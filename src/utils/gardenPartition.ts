import { GardenStudentData } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState, supabase } from '../supabaseClient';

/**
 * 📦 QUẢN LÝ DỮ LIỆU VƯỜN TRI THỨC (OFFLINE-FIRST & DEEP MERGE ĐA TẦNG)
 * Đảm bảo dữ liệu chăm sóc cây, tưới nước, huy hiệu của từng học sinh
 * hoạt động mượt mà khi ngoại tuyến và tự động hợp nhất an toàn khi có mạng trở lại.
 */

/**
 * 🔄 HỢP NHẤT SÂU DỮ LIỆU VƯỜN CÂY (TỪNG HỌC SINH -> NƯỚC -> HUY HIỆU -> NHẬT KÝ)
 * Tuyệt đối không bao giờ làm giảm cấp độ hay mất lịch sử tưới cây đã làm việc offline!
 */
export function deepMergeGardenData(
  target: Record<string, GardenStudentData>,
  source: Record<string, GardenStudentData>
): Record<string, GardenStudentData> {
  if (!source || typeof source !== 'object') return target ? { ...target } : {};
  if (!target || typeof target !== 'object') return { ...source };

  const result: Record<string, GardenStudentData> = { ...target };

  for (const studentId of Object.keys(source)) {
    if (!result[studentId]) {
      result[studentId] = { ...source[studentId] };
    } else {
      const targetStudent = result[studentId];
      const sourceStudent = source[studentId];

      // 1. Nước (Điểm phát triển): Lấy giá trị lớn nhất (không bao giờ thụt lùi cấp độ)
      const maxWater = Math.max(targetStudent.water || 0, sourceStudent.water || 0);

      // 2. Huy hiệu: Hợp nhất danh sách huy hiệu không trùng lặp
      const mergedBadges = Array.from(
        new Set([...(targetStudent.badges || []), ...(sourceStudent.badges || [])])
      );

      // 3. Nhật ký tưới nước (Logs): Hợp nhất theo log ID
      const existingLogIds = new Set((targetStudent.logs || []).map(l => l.id));
      const mergedLogs = [...(targetStudent.logs || [])];
      (sourceStudent.logs || []).forEach(l => {
        if (!existingLogIds.has(l.id)) {
          mergedLogs.push(l);
          existingLogIds.add(l.id);
        }
      });

      // 4. Hạt giống: Ưu tiên loại hạt giống đã chọn
      const seed = sourceStudent.seed || targetStudent.seed;

      result[studentId] = {
        ...targetStudent,
        ...sourceStudent,
        studentId,
        water: maxWater,
        badges: mergedBadges,
        logs: mergedLogs,
        seed
      };
    }
  }

  return result;
}

/**
 * 💾 Lưu dữ liệu Vườn Tri Thức với cơ chế Offline-First & Deep Merge
 */
export async function saveWorkspaceGardenData(
  gardenData: Record<string, GardenStudentData>,
  workspaceId: string = 'ws_default',
  onMerged?: (merged: Record<string, GardenStudentData>) => void
): Promise<boolean> {
  if (!gardenData || Object.keys(gardenData).length === 0) return true;
  if (!workspaceId || workspaceId === 'ws_default') return true;

  const storageKey = `${workspaceId}_garden_data_v2`;
  const cloudKey = `${workspaceId}_school_garden_data`;

  // 1. Đọc dữ liệu hiện có từ LocalStorage
  let localData: Record<string, GardenStudentData> = {};
  try {
    const rawLocal = localStorage.getItem(storageKey) || localStorage.getItem('deskos_garden_data_v2');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed && typeof parsed === 'object') {
        localData = parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local garden data khi lưu:', e);
  }

  // 2. Đọc dữ liệu mới nhất từ Supabase Cloud với Timeout 1.5s bảo vệ chống treo khi Offline
  let cloudData: Record<string, GardenStudentData> = {};
  if (typeof navigator === 'undefined' || navigator.onLine) {
    try {
      const fetchPromise = supabase
        .from('school_states')
        .select('value')
        .eq('key', cloudKey)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: string }>(resolve => 
        setTimeout(() => resolve({ data: null, error: 'timeout' }), 1500)
      );

      const res: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (res?.data?.value && typeof res.data.value === 'object') {
        cloudData = res.data.value;
      }
    } catch (e) {
      console.warn('Lỗi đọc cloud garden data khi lưu:', e);
    }
  }

  // 3. THỰC HIỆN DEEP MERGE ĐA TẦNG (Cloud cũ + Local cũ + Thao tác mới nhất)
  let mergedData = deepMergeGardenData(cloudData, localData);
  mergedData = deepMergeGardenData(mergedData, gardenData);

  // 4. Lưu ngay lập tức vào LocalStorage (Bảo đảm dữ liệu sống sót 100% khi rớt mạng)
  safeSetLocalStorage(storageKey, mergedData);
  safeSetLocalStorage('deskos_garden_data_v2', mergedData);

  // 5. Cập nhật React State tức thì qua Callback
  if (onMerged) {
    try {
      onMerged(mergedData);
    } catch (e) {}
  }

  // 6. Lưu lên Supabase Cloud
  return await saveSupabaseState(cloudKey, mergedData);
}

/**
 * 📥 Tải và hợp nhất toàn bộ dữ liệu Vườn Tri Thức cho Workspace
 * Bảo toàn 100% dữ liệu đã làm việc offline mà không bao giờ bị Cloud cũ đè mất!
 */
export function loadWorkspaceGardenData(
  workspaceId: string = 'ws_default',
  dbStates?: Record<string, any>,
  fallbackValue: Record<string, GardenStudentData> = {}
): Record<string, GardenStudentData> {
  if (!workspaceId || workspaceId === 'ws_default') {
    return { ...fallbackValue };
  }

  const storageKey = `${workspaceId}_garden_data_v2`;
  const cloudKey = `${workspaceId}_school_garden_data`;
  let merged: Record<string, GardenStudentData> = { ...fallbackValue };

  // 1. Tải bản sao từ Cloud dbStates nếu có
  const scopedCloud = dbStates?.[cloudKey];
  if (scopedCloud && typeof scopedCloud === 'object') {
    merged = deepMergeGardenData(merged, scopedCloud);
  }

  // 2. Tải bản sao từ LocalStorage (chứa các chỉnh sửa mới nhất cả khi offline)
  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal) {
      const parsedLocal = JSON.parse(rawLocal);
      if (parsedLocal && typeof parsedLocal === 'object') {
        merged = deepMergeGardenData(merged, parsedLocal);
      }
    }
  } catch (e) {
    console.warn('Cannot parse local garden data:', e);
  }

  // 3. Kiểm tra fallback legacy 'deskos_garden_data_v2' nếu cần
  try {
    const rawLegacy = localStorage.getItem('deskos_garden_data_v2');
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (parsedLegacy && typeof parsedLegacy === 'object') {
        merged = deepMergeGardenData(merged, parsedLegacy);
      }
    }
  } catch (e) {}

  return merged;
}
