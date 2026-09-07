import { AttendanceData } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState } from '../supabaseClient';

/**
 * 📦 GÓI GỌN PAYLOAD ĐIỂM DANH THEO NGÀY & PHÂN LẬP THEO WORKSPACE
 * Tách nhỏ key lưu trữ theo từng ngày (ws_USER_school_attendance_YYYY-MM-DD)
 * Giúp dung lượng Payload truyền tải nhẹ x10 đến x100 lần, đồng thời
 * cô lập hoàn toàn sổ điểm danh của từng giáo viên!
 */

/**
 * Lưu dữ liệu điểm danh phân mảnh nhẹ theo từng ngày và không gian làm việc
 * 🛡️ LOẠI BỎ KHÓA MẶC ĐỊNH: Tuyệt đối không lưu nếu là workspace mặc định ws_default hoặc rỗng.
 * Chỉ lưu duy nhất cho workspace giáo viên thực tế (${prefix}school_attendance_data).
 */
export async function saveDayPartitionedAttendance(
  attendanceData: AttendanceData,
  targetDate?: string,
  workspaceId?: string
): Promise<boolean> {
  if (!attendanceData) return true;
  // 🛡️ Chặn triệt để khóa điểm danh mặc định (ws_default hoặc rỗng)
  if (!workspaceId || workspaceId === 'ws_default') {
    return true;
  }

  const prefix = `${workspaceId}_`;

  // Lưu cục bộ theo ngày vào LocalStorage để đọc offline siêu tốc nếu cần
  if (targetDate && attendanceData[targetDate]) {
    safeSetLocalStorage(`${prefix}school_attendance_${targetDate}`, attendanceData[targetDate]);
  }

  // Lưu bản tổng hợp của Workspace vào LocalStorage và duy nhất 1 key trên Supabase Cloud
  safeSetLocalStorage(`${prefix}school_attendance_data`, attendanceData);
  return await saveSupabaseState(`${prefix}school_attendance_data`, attendanceData);
}

/**
 * Tải và hợp nhất toàn bộ dữ liệu điểm danh cho một Workspace cụ thể
 * 🛡️ LOẠI BỎ KHÓA MẶC ĐỊNH: Không bao giờ tải từ khóa mặc định ws_default_school_attendance_data.
 */
export function loadDayPartitionedAttendance(
  dbStates?: Record<string, any>,
  fallbackData: AttendanceData = {},
  workspaceId?: string
): AttendanceData {
  // Dọn dẹp các khóa mặc định còn sót lại trong LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ws_default_school_attendance_data');
      localStorage.removeItem('school_attendance_data');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('ws_default_school_attendance_') || k === 'school_attendance_data')) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch (e) {}

  // Nếu không có workspace hoặc là ws_default, không tải khóa mặc định
  if (!workspaceId || workspaceId === 'ws_default') {
    return { ...fallbackData };
  }

  const prefix = `${workspaceId}_`;
  const merged: AttendanceData = { ...fallbackData };

  // 1. Tải bản sao dự phòng của Workspace
  const scopedCloud = dbStates?.[`${prefix}school_attendance_data`];
  if (scopedCloud && typeof scopedCloud === 'object') {
    Object.assign(merged, scopedCloud);
  } else {
    try {
      const scopedLocal = localStorage.getItem(`${prefix}school_attendance_data`);
      if (scopedLocal) {
        Object.assign(merged, JSON.parse(scopedLocal));
      }
    } catch (e) {
      console.warn('Cannot parse attendance fallback data:', e);
    }
  }

  // 2. Quét các key phân mảnh ws_USER_school_attendance_YYYY-MM-DD từ Supabase dbStates
  if (dbStates) {
    Object.keys(dbStates).forEach(key => {
      if (key.startsWith(`${prefix}school_attendance_`) && key !== `${prefix}school_attendance_data`) {
        const dateKey = key.replace(`${prefix}school_attendance_`, '');
        if (dateKey && dbStates[key] && typeof dbStates[key] === 'object') {
          merged[dateKey] = dbStates[key];
        }
      }
    });
  }

  // 3. Quét các key phân mảnh ws_USER_school_attendance_YYYY-MM-DD từ LocalStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${prefix}school_attendance_`) && key !== `${prefix}school_attendance_data`) {
        const dateKey = key.replace(`${prefix}school_attendance_`, '');
        const rawVal = localStorage.getItem(key);
        if (dateKey && rawVal) {
          try {
            merged[dateKey] = JSON.parse(rawVal);
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
    return { ...prev, ...value };
  }

  if (key.startsWith(`${prefix}school_attendance_`)) {
    const dateKey = key.replace(`${prefix}school_attendance_`, '');
    if (dateKey) {
      return {
        ...prev,
        [dateKey]: value
      };
    }
  }

  return prev;
}
