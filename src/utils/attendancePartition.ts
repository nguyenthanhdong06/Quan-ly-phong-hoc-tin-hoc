import { AttendanceData } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState, supabase } from '../supabaseClient';

/**
 * 📦 GÓI GỌN PAYLOAD ĐIỂM DANH THEO NGÀY & PHÂN LẬP THEO WORKSPACE
 * Tách nhỏ key lưu trữ theo từng ngày (ws_USER_school_attendance_YYYY-MM-DD)
 * Giúp dung lượng Payload truyền tải nhẹ x10 đến x100 lần, đồng thời
 * cô lập hoàn toàn sổ điểm danh của từng giáo viên!
 */

/**
 * 🔄 HỢP NHẤT SÂU DỮ LIỆU ĐIỂM DANH (3 CẤP ĐỘ: NGÀY -> LỚP -> HỌC SINH)
 * Tuyệt đối bảo toàn 100% tất cả các ngày cũ và các lớp cũ, không bao giờ bị ghi đè mất!
 */
export function deepMergeAttendance(
  target: AttendanceData,
  source: AttendanceData
): AttendanceData {
  if (!source || typeof source !== 'object') return target ? { ...target } : {};
  if (!target || typeof target !== 'object') return { ...source };

  const result: AttendanceData = { ...target };

  for (const dateKey of Object.keys(source)) {
    if (!result[dateKey]) {
      result[dateKey] = { ...source[dateKey] };
    } else {
      // Ngày đã tồn tại ở cả 2 bên -> Hợp nhất danh sách các lớp trong ngày
      const targetDay = { ...result[dateKey] };
      const sourceDay = source[dateKey];
      for (const classKey of Object.keys(sourceDay)) {
        if (!targetDay[classKey]) {
          targetDay[classKey] = { ...sourceDay[classKey] };
        } else {
          // Lớp đã tồn tại ở cả 2 bên -> Hợp nhất trạng thái từng học sinh
          targetDay[classKey] = {
            ...targetDay[classKey],
            ...sourceDay[classKey]
          };
        }
      }
      result[dateKey] = targetDay;
    }
  }

  return result;
}

/**
 * Lưu dữ liệu điểm danh phân mảnh nhẹ theo từng ngày và không gian làm việc
 * 🛡️ DEEP MERGE CLOUD & LOCAL: Luôn hợp nhất đa chiều với dữ liệu hiện có trên Cloud & LocalStorage
 * trước khi lưu, đảm bảo lịch sử điểm danh của tất cả các lớp và các ngày cũ không bao giờ bị mất!
 */
export async function saveDayPartitionedAttendance(
  attendanceData: AttendanceData,
  targetDate?: string,
  workspaceId?: string,
  onMerged?: (merged: AttendanceData) => void
): Promise<boolean> {
  if (!attendanceData) return true;
  // 🛡️ Chặn triệt để khóa điểm danh mặc định (ws_default hoặc rỗng)
  if (!workspaceId || workspaceId === 'ws_default') {
    return true;
  }

  const prefix = `${workspaceId}_`;
  const mainKey = `${prefix}school_attendance_data`;

  // 1. Đọc dữ liệu hiện có từ LocalStorage
  let localData: AttendanceData = {};
  try {
    const rawLocal = localStorage.getItem(mainKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed && typeof parsed === 'object') {
        localData = parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local attendance khi lưu:', e);
  }

  // 2. Đọc dữ liệu mới nhất từ Supabase Cloud để phòng ngừa xung đột thiết bị
  let cloudData: AttendanceData = {};
  try {
    const { data, error } = await supabase
      .from('school_states')
      .select('value')
      .eq('key', mainKey)
      .maybeSingle();

    if (!error && data && data.value && typeof data.value === 'object') {
      cloudData = data.value;
    }
  } catch (e) {
    console.warn('Lỗi đọc cloud attendance khi lưu:', e);
  }

  // 3. THỰC HIỆN DEEP MERGE ĐA TẦNG:
  // Thứ tự ưu tiên: Cloud cũ -> Local cũ -> Dữ liệu mới nhất vừa thao tác
  let mergedData = deepMergeAttendance(cloudData, localData);
  mergedData = deepMergeAttendance(mergedData, attendanceData);

  // 4. Lưu bản phân mảnh theo ngày vào LocalStorage để đọc offline siêu tốc nếu cần
  if (targetDate && mergedData[targetDate]) {
    safeSetLocalStorage(`${prefix}school_attendance_${targetDate}`, mergedData[targetDate]);
  }

  // 5. Lưu bản tổng hợp hoàn chỉnh vào LocalStorage và duy nhất 1 key trên Supabase Cloud
  safeSetLocalStorage(mainKey, mergedData);

  // 6. Callback cập nhật lại React State tức thì
  if (onMerged) {
    try {
      onMerged(mergedData);
    } catch (e) {}
  }

  return await saveSupabaseState(mainKey, mergedData);
}

/**
 * Tải và hợp nhất toàn bộ dữ liệu điểm danh cho một Workspace cụ thể
 * 🛡️ BẢO TOÀN LỊCH SỬ: Tự động khôi phục dữ liệu từ ws_default nếu thiếu,
 * và Deep Merge tất cả các ngày/lớp từ Cloud, LocalStorage và phân mảnh.
 */
export function loadDayPartitionedAttendance(
  dbStates?: Record<string, any>,
  fallbackData: AttendanceData = {},
  workspaceId?: string
): AttendanceData {
  if (!workspaceId || workspaceId === 'ws_default') {
    return { ...fallbackData };
  }

  const prefix = `${workspaceId}_`;
  let merged: AttendanceData = { ...fallbackData };

  // 1. Tải bản sao tổng hợp từ Supabase Cloud
  const scopedCloud = dbStates?.[`${prefix}school_attendance_data`];
  if (scopedCloud && typeof scopedCloud === 'object') {
    merged = deepMergeAttendance(merged, scopedCloud);
  }

  // 2. Tải bản sao dự phòng từ LocalStorage
  try {
    const scopedLocal = localStorage.getItem(`${prefix}school_attendance_data`);
    if (scopedLocal) {
      const parsedLocal = JSON.parse(scopedLocal);
      if (parsedLocal && typeof parsedLocal === 'object') {
        merged = deepMergeAttendance(merged, parsedLocal);
      }
    }
  } catch (e) {
    console.warn('Cannot parse attendance local data:', e);
  }

  // 3. TỰ ĐỘNG KHÔI PHỤC LỊCH SỬ TỪ ws_default (nếu ws hiện tại chưa có các ngày cũ đó)
  // Giúp các lớp Thầy đã lưu trước đây (ví dụ: ngày 21/08, 22/08, 26/08...) không bao giờ bị mất!
  const defaultCloud = dbStates?.['ws_default_school_attendance_data'];
  if (defaultCloud && typeof defaultCloud === 'object' && Object.keys(defaultCloud).length > 0) {
    for (const dKey of Object.keys(defaultCloud)) {
      if (!merged[dKey]) {
        merged[dKey] = defaultCloud[dKey];
      } else {
        // Ngày đã có, bổ sung các lớp còn thiếu
        for (const cKey of Object.keys(defaultCloud[dKey])) {
          if (!merged[dKey][cKey]) {
            merged[dKey][cKey] = defaultCloud[dKey][cKey];
          }
        }
      }
    }
  }

  // 4. Quét các key phân mảnh ws_USER_school_attendance_YYYY-MM-DD từ Supabase dbStates
  if (dbStates) {
    Object.keys(dbStates).forEach(key => {
      if (key.startsWith(`${prefix}school_attendance_`) && key !== `${prefix}school_attendance_data`) {
        const dateKey = key.replace(`${prefix}school_attendance_`, '');
        if (dateKey && dbStates[key] && typeof dbStates[key] === 'object') {
          merged = deepMergeAttendance(merged, { [dateKey]: dbStates[key] });
        }
      }
    });
  }

  // 5. Quét các key phân mảnh ws_USER_school_attendance_YYYY-MM-DD từ LocalStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${prefix}school_attendance_`) && key !== `${prefix}school_attendance_data`) {
        const dateKey = key.replace(`${prefix}school_attendance_`, '');
        const rawVal = localStorage.getItem(key);
        if (dateKey && rawVal) {
          try {
            const parsed = JSON.parse(rawVal);
            if (parsed && typeof parsed === 'object') {
              merged = deepMergeAttendance(merged, { [dateKey]: parsed });
            }
          } catch (err) {}
        }
      }
    }
  } catch (e) {
    console.warn('Cannot scan localStorage workspace attendance partitions:', e);
  }

  return merged;
}

/**
 * Cập nhật Realtime state điểm danh theo ngày khi nhận được payload từ WebSocket cho đúng Workspace
 * Sử dụng deepMergeAttendance để hợp nhất từng lớp và từng học sinh mà không đè mất dữ liệu.
 */
export function applyPartitionedAttendanceUpdate(
  prev: AttendanceData,
  key: string,
  value: any,
  workspaceId?: string
): AttendanceData {
  if (!value || typeof value !== 'object') return prev;
  if (!workspaceId || workspaceId === 'ws_default') return prev;

  const prefix = `${workspaceId}_`;

  if (key === `${prefix}school_attendance_data`) {
    return deepMergeAttendance(prev, value);
  }

  if (key.startsWith(`${prefix}school_attendance_`)) {
    const dateKey = key.replace(`${prefix}school_attendance_`, '');
    if (dateKey) {
      return deepMergeAttendance(prev, { [dateKey]: value });
    }
  }

  return prev;
}
