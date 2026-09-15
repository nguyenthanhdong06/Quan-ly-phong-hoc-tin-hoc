import { SeatingChart, LabIncident } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState, supabase } from '../supabaseClient';

/**
 * 📦 BỘ CÔNG CỤ OFFLINE-FIRST & DEEP MERGE CHO PHÂN HỆ PHÒNG LAB
 * Chuẩn mực hóa cơ chế lưu trữ phân vùng, chống mất dữ liệu khi ngoại tuyến,
 * và tự động hợp nhất hai chiều (Cloud <-> Local) cho sơ đồ chỗ ngồi và sự cố máy tính.
 */

export const defaultSeating: SeatingChart = {
  '6A': {
    'M.01': 'st-1',
    'M.02': 'st-2',
    'M.03': 'st-3',
    'M.04': 'st-4',
    'M.05': 'st-5',
    'M.06': 'st-6',
    'M.07': 'st-7',
    'M.08': 'st-8',
    'M.09': 'st-9',
    'M.10': 'st-10',
    'M.11': 'st-11',
    'M.12': 'st-12',
    'M.13': 'st-13',
    'M.14': 'st-14',
    'M.15': 'st-15',
    'M.16': 'st-16'
  }
};

/**
 * 🔄 HỢP NHẤT SÂU DỮ LIỆU SƠ ĐỒ CHỖ NGỒI (DEEP MERGE SEATING CHART)
 * - Bảo toàn 100% tất cả các lớp đã xếp chỗ trước đó.
 * - Khi giáo viên đang thao tác trên 1 lớp cụ thể (activeClass), sơ đồ mới của lớp đó sẽ là nguồn chuẩn.
 * - Các lớp khác giữa 2 nguồn dữ liệu (Cloud & Local) sẽ được bảo toàn gộp chung.
 */
export function deepMergeSeatingChart(
  target: SeatingChart,
  source: SeatingChart,
  activeClass?: string
): SeatingChart {
  if (!source || typeof source !== 'object') return target ? { ...target } : {};
  if (!target || typeof target !== 'object') return { ...source };

  const result: SeatingChart = { ...target };

  for (const classKey of Object.keys(source)) {
    if (!result[classKey]) {
      // Lớp chỉ có ở source -> sao chép toàn bộ sang
      result[classKey] = { ...source[classKey] };
    } else if (activeClass && classKey.trim().toLowerCase() === activeClass.trim().toLowerCase()) {
      // Đúng lớp đang thao tác -> ưu tiên phiên bản vừa xếp của giáo viên
      result[classKey] = { ...source[classKey] };
    } else {
      // Các lớp khác tồn tại ở cả 2 bên -> hợp nhất chỗ ngồi từng máy
      const targetClassSeating = { ...result[classKey] };
      const sourceClassSeating = source[classKey] || {};

      for (const pcId of Object.keys(sourceClassSeating)) {
        if (sourceClassSeating[pcId]) {
          targetClassSeating[pcId] = sourceClassSeating[pcId];
        }
      }
      result[classKey] = targetClassSeating;
    }
  }

  return result;
}

/**
 * 🔄 HỢP NHẤT DANH SÁCH SỰ CỐ PHÒNG LAB (DEEP MERGE LAB INCIDENTS)
 * Tránh trùng lặp theo ID, bảo toàn các sự cố vừa ghi nhận ngoại tuyến.
 */
export function deepMergeLabIncidents(
  target: LabIncident[],
  source: LabIncident[]
): LabIncident[] {
  const map = new Map<string, LabIncident>();

  if (Array.isArray(target)) {
    target.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
  }

  if (Array.isArray(source)) {
    source.forEach(item => {
      if (item && item.id) {
        const existing = map.get(item.id);
        if (!existing) {
          map.set(item.id, item);
        } else {
          // Gộp thông tin, ưu tiên trạng thái mới nhất
          map.set(item.id, { ...existing, ...item });
        }
      }
    });
  }

  return Array.from(map.values());
}

/**
 * 🔄 HỢP NHẤT DỮ LIỆU CÁN SỰ LỚP TRONG PHÒNG MÁY (DUTIES)
 */
export function deepMergeStudentDuties(
  target: Record<string, string>,
  source: Record<string, string>
): Record<string, string> {
  return {
    ...(target || {}),
    ...(source || {})
  };
}

/**
 * 💾 LƯU SƠ ĐỒ CHỖ NGỒI THEO PHÂN VÙNG WORKSPACE (OFFLINE-FIRST)
 * - Ghi ngay 0ms vào LocalStorage.
 * - Có timeout 1.5s bảo vệ chống treo khi ngoại tuyến.
 * - Hợp nhất đa chiều 3 tầng: Cloud cũ -> Local cũ -> Dữ liệu mới nhất vừa thao tác.
 */
export async function saveWorkspaceSeatingData(
  seatingChart: SeatingChart,
  targetClass?: string,
  workspaceId?: string,
  onMerged?: (merged: SeatingChart) => void
): Promise<boolean> {
  if (!seatingChart) return true;

  const effectiveWs = workspaceId && workspaceId !== 'ws_default' ? workspaceId : 'ws_u-1';
  const prefix = `${effectiveWs}_`;
  const mainKey = `${prefix}school_seating_chart`;
  const legacyKey = 'school_seating_chart';

  // 1. Đọc dữ liệu hiện có từ LocalStorage
  let localData: SeatingChart = {};
  try {
    const rawLocal = localStorage.getItem(mainKey) || localStorage.getItem(legacyKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed && typeof parsed === 'object') {
        localData = parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local seating khi lưu:', e);
  }

  // 2. Đọc dữ liệu mới nhất từ Cloud (kèm timeout 1.5s chống treo khi offline)
  let cloudData: SeatingChart = {};
  try {
    const fetchCloudPromise = supabase
      .from('school_states')
      .select('value')
      .eq('key', mainKey)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Offline timeout') }), 1500)
    );

    const { data, error } = await Promise.race([fetchCloudPromise, timeoutPromise]);

    if (!error && data && data.value && typeof data.value === 'object') {
      cloudData = data.value;
    }
  } catch (e) {
    console.warn('Không thể đọc cloud seating (đang offline hoặc mạng chậm):', e);
  }

  // 3. THỰC HIỆN DEEP MERGE ĐA TẦNG:
  // Cloud cũ -> Local cũ -> Dữ liệu mới nhất vừa thao tác
  let mergedData = deepMergeSeatingChart(cloudData, localData, targetClass);
  mergedData = deepMergeSeatingChart(mergedData, seatingChart, targetClass);

  // 4. Lưu phân mảnh lớp vào LocalStorage nếu có targetClass
  if (targetClass && mergedData[targetClass]) {
    safeSetLocalStorage(`${prefix}school_seating_${targetClass}`, mergedData[targetClass]);
  }

  // 5. Lưu bản tổng hợp hoàn chỉnh vào LocalStorage (cả khóa phân vùng và khóa tương thích ngược)
  safeSetLocalStorage(mainKey, mergedData);
  safeSetLocalStorage(legacyKey, mergedData);

  // 6. Callback cập nhật React State ngay lập tức
  if (onMerged) {
    try {
      onMerged(mergedData);
    } catch (e) {}
  }

  // 7. Lưu lên Cloud Supabase
  try {
    return await saveSupabaseState(mainKey, mergedData);
  } catch {
    return true; // Đã lưu an toàn ở LocalStorage khi offline
  }
}

/**
 * 📥 TẢI VÀ HỢP NHẤT SƠ ĐỒ CHỖ NGỒI CHO WORKSPACE
 * 🛡️ BẢO TOÀN DỮ LIỆU: Tự động khôi phục từ default/legacy và Deep Merge để
 * dữ liệu xếp chỗ offline không bao giờ bị Cloud cũ ghi đè mất!
 */
export function loadWorkspaceSeatingData(
  workspaceId?: string,
  dbStates?: Record<string, any>,
  fallbackData: SeatingChart = defaultSeating
): SeatingChart {
  const effectiveWs = workspaceId && workspaceId !== 'ws_default' ? workspaceId : 'ws_u-1';
  const prefix = `${effectiveWs}_`;
  const mainKey = `${prefix}school_seating_chart`;

  let merged: SeatingChart = { ...fallbackData };

  // 1. Tải bản sao từ Cloud dbStates
  const scopedCloud = dbStates?.[mainKey] || dbStates?.['school_seating_chart'];
  if (scopedCloud && typeof scopedCloud === 'object') {
    merged = deepMergeSeatingChart(merged, scopedCloud);
  }

  // 2. Tải bản sao dự phòng từ LocalStorage
  try {
    const scopedLocal = localStorage.getItem(mainKey) || localStorage.getItem('school_seating_chart');
    if (scopedLocal) {
      const parsedLocal = JSON.parse(scopedLocal);
      if (parsedLocal && typeof parsedLocal === 'object') {
        merged = deepMergeSeatingChart(merged, parsedLocal);
      }
    }
  } catch (e) {
    console.warn('Cannot parse seating local data:', e);
  }

  // 3. Khôi phục thêm từ các bản phân mảnh theo lớp (nếu có)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${prefix}school_seating_`) && !k.endsWith('_chart')) {
        const className = k.replace(`${prefix}school_seating_`, '');
        if (className && !merged[className]) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const classObj = JSON.parse(raw);
            if (classObj && typeof classObj === 'object') {
              merged[className] = classObj;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error reading partitioned class seatings:', e);
  }

  // Tự động sao lưu bản hợp nhất sạch sẽ vào LocalStorage
  safeSetLocalStorage(mainKey, merged);
  return merged;
}
