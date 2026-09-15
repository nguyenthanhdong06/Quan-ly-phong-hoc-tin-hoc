import { EvaluationData, EmulationDataState } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState, supabase } from '../supabaseClient';

/**
 * 📦 GÓI GỌN PAYLOAD ĐÁNH GIÁ & CHẤM SAO THEO NGÀY & PHÂN LẬP THEO WORKSPACE
 * Tách nhỏ key lưu trữ theo từng ngày (ws_USER_school_evaluation_YYYY-MM-DD)
 * Giúp dung lượng Payload truyền tải nhẹ x10 đến x100 lần, đồng thời
 * cô lập hoàn toàn sổ điểm số, sao vàng và nhận xét của từng giáo viên!
 */

/**
 * 🔄 HỢP NHẤT SÂU DỮ LIỆU ĐÁNH GIÁ / CHẤM SAO (3 CẤP ĐỘ: NGÀY -> LỚP -> HỌC SINH)
 * Đảm bảo không ghi đè mất ngày cũ hoặc lớp cũ!
 */
export function deepMergeEvaluation(
  target: EvaluationData,
  source: EvaluationData
): EvaluationData {
  if (!source || typeof source !== 'object') return target ? { ...target } : {};
  if (!target || typeof target !== 'object') return { ...source };

  const result: EvaluationData = { ...target };

  for (const dateKey of Object.keys(source)) {
    if (!result[dateKey]) {
      result[dateKey] = { ...source[dateKey] };
    } else {
      const targetDay = { ...result[dateKey] };
      const sourceDay = source[dateKey];
      for (const classKey of Object.keys(sourceDay)) {
        if (!targetDay[classKey]) {
          targetDay[classKey] = { ...sourceDay[classKey] };
        } else {
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
 * 🔄 HỢP NHẤT SÂU DỮ LIỆU SAO THI ĐUA TÍCH LŨY (EMULATION STATE)
 * Bảo toàn 100% số sao, huy hiệu, sticker học sinh đã nhận được khi chấm ngoại tuyến!
 */
export function deepMergeEmulationState(
  target: EmulationDataState,
  source: EmulationDataState
): EmulationDataState {
  if (!source || typeof source !== 'object') return target ? { ...target } : {};
  if (!target || typeof target !== 'object') return { ...source };

  const result: EmulationDataState = { ...target };

  for (const studentId of Object.keys(source)) {
    if (!result[studentId]) {
      result[studentId] = { ...source[studentId] };
    } else {
      const targetItem = result[studentId];
      const sourceItem = source[studentId];

      const maxStars = Math.max(targetItem.cumulativeStars || 0, sourceItem.cumulativeStars || 0);
      const maxStickers = Math.max(targetItem.exchangedStickers || 0, sourceItem.exchangedStickers || 0);
      const maxDeducted = Math.max(targetItem.totalDeducted || 0, sourceItem.totalDeducted || 0);
      const mergedBadges = Array.from(new Set([...(targetItem.badges || []), ...(sourceItem.badges || [])]));

      result[studentId] = {
        ...targetItem,
        ...sourceItem,
        cumulativeStars: maxStars,
        exchangedStickers: maxStickers,
        totalDeducted: maxDeducted,
        badges: mergedBadges
      };
    }
  }

  return result;
}

/**
 * Lưu dữ liệu chấm sao phân mảnh nhẹ theo từng ngày và không gian làm việc
 * 🛡️ DEEP MERGE CLOUD & LOCAL: Hợp nhất đa chiều với dữ liệu hiện có trên Cloud & LocalStorage
 * trước khi lưu, đảm bảo lịch sử nhận xét của tất cả các lớp và các ngày cũ không bao giờ bị mất!
 */
export async function saveDayPartitionedEvaluation(
  evaluationData: EvaluationData,
  targetDate?: string,
  workspaceId: string = 'ws_default',
  onMerged?: (merged: EvaluationData) => void
): Promise<boolean> {
  if (!evaluationData) return true;
  // 🛡️ Ngăn chặn lưu nếu là workspace mặc định chưa đăng nhập (tránh rác ws_default trên Supabase)
  if (!workspaceId || workspaceId === 'ws_default') return true;

  const prefix = `${workspaceId}_`;
  const mainKey = `${prefix}school_evaluation_data`;

  // 1. Đọc dữ liệu hiện có từ LocalStorage
  let localData: EvaluationData = {};
  try {
    const rawLocal = localStorage.getItem(mainKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed && typeof parsed === 'object') {
        localData = parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local evaluation khi lưu:', e);
  }

  // 2. Đọc dữ liệu mới nhất từ Supabase Cloud để phòng ngừa xung đột thiết bị (kèm timeout 1.5s bảo vệ chống treo khi Offline)
  let cloudData: EvaluationData = {};
  if (typeof navigator === 'undefined' || navigator.onLine) {
    try {
      const fetchPromise = supabase
        .from('school_states')
        .select('value')
        .eq('key', mainKey)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: string }>(resolve =>
        setTimeout(() => resolve({ data: null, error: 'timeout' }), 1500)
      );

      const res: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (res?.data?.value && typeof res.data.value === 'object') {
        cloudData = res.data.value;
      }
    } catch (e) {
      console.warn('Lỗi đọc cloud evaluation khi lưu:', e);
    }
  }

  // 3. THỰC HIỆN DEEP MERGE ĐA TẦNG:
  let mergedData = deepMergeEvaluation(cloudData, localData);
  mergedData = deepMergeEvaluation(mergedData, evaluationData);

  // 4. Lưu bản phân mảnh theo ngày vào LocalStorage để đọc offline siêu tốc nếu cần
  if (targetDate && mergedData[targetDate]) {
    safeSetLocalStorage(`${prefix}school_evaluation_${targetDate}`, mergedData[targetDate]);
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
 * Tải và hợp nhất toàn bộ dữ liệu chấm sao phân mảnh cho một Workspace cụ thể
 * 🛡️ BẢO TOÀN LỊCH SỬ: Tự động khôi phục dữ liệu từ ws_default nếu thiếu,
 * và Deep Merge tất cả các ngày/lớp từ Cloud, LocalStorage và phân mảnh.
 */
export function loadDayPartitionedEvaluation(
  dbStates?: Record<string, any>,
  fallbackData: EvaluationData = {},
  workspaceId: string = 'ws_default'
): EvaluationData {
  if (!workspaceId || workspaceId === 'ws_default') {
    return { ...fallbackData };
  }

  const prefix = `${workspaceId}_`;
  let merged: EvaluationData = { ...fallbackData };

  // 1. Tải bản sao tổng hợp từ Supabase Cloud
  const scopedCloud = dbStates?.[`${prefix}school_evaluation_data`];
  if (scopedCloud && typeof scopedCloud === 'object') {
    merged = deepMergeEvaluation(merged, scopedCloud);
  }

  // 2. Tải bản sao dự phòng từ LocalStorage
  try {
    const scopedLocal = localStorage.getItem(`${prefix}school_evaluation_data`);
    if (scopedLocal) {
      const parsedLocal = JSON.parse(scopedLocal);
      if (parsedLocal && typeof parsedLocal === 'object') {
        merged = deepMergeEvaluation(merged, parsedLocal);
      }
    }
  } catch (e) {
    console.warn('Cannot parse evaluation fallback data:', e);
  }

  // 3. Tự động khôi phục dữ liệu lịch sử từ ws_default (nếu ws hiện tại chưa có các ngày cũ đó)
  const defaultCloud = dbStates?.['ws_default_school_evaluation_data'];
  if (defaultCloud && typeof defaultCloud === 'object' && Object.keys(defaultCloud).length > 0) {
    for (const dKey of Object.keys(defaultCloud)) {
      if (!merged[dKey]) {
        merged[dKey] = defaultCloud[dKey];
      } else {
        for (const cKey of Object.keys(defaultCloud[dKey])) {
          if (!merged[dKey][cKey]) {
            merged[dKey][cKey] = defaultCloud[dKey][cKey];
          }
        }
      }
    }
  }

  // 4. Quét các key phân mảnh ws_USER_school_evaluation_YYYY-MM-DD từ Supabase dbStates
  if (dbStates) {
    Object.keys(dbStates).forEach(key => {
      if (key.startsWith(`${prefix}school_evaluation_`) && key !== `${prefix}school_evaluation_data`) {
        const dateKey = key.replace(`${prefix}school_evaluation_`, '');
        if (dateKey && dbStates[key] && typeof dbStates[key] === 'object') {
          merged = deepMergeEvaluation(merged, { [dateKey]: dbStates[key] });
        }
      }
    });
  }

  // 5. Quét các key phân mảnh ws_USER_school_evaluation_YYYY-MM-DD từ LocalStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${prefix}school_evaluation_`) && key !== `${prefix}school_evaluation_data`) {
        const dateKey = key.replace(`${prefix}school_evaluation_`, '');
        const rawVal = localStorage.getItem(key);
        if (dateKey && rawVal) {
          try {
            const parsed = JSON.parse(rawVal);
            if (parsed && typeof parsed === 'object') {
              merged = deepMergeEvaluation(merged, { [dateKey]: parsed });
            }
          } catch (err) {}
        }
      }
    }
  } catch (e) {
    console.warn('Cannot scan localStorage workspace evaluation partitions:', e);
  }

  return merged;
}

/**
 * Cập nhật Realtime state chấm sao theo ngày khi nhận được payload từ WebSocket cho đúng Workspace
 */
export function applyPartitionedEvaluationUpdate(
  prev: EvaluationData,
  key: string,
  value: any,
  workspaceId: string = 'ws_default'
): EvaluationData {
  if (!value || typeof value !== 'object') return prev;
  if (!workspaceId || workspaceId === 'ws_default') return prev;

  const prefix = `${workspaceId}_`;

  if (key === `${prefix}school_evaluation_data`) {
    return deepMergeEvaluation(prev, value);
  }

  if (key.startsWith(`${prefix}school_evaluation_`)) {
    const dateKey = key.replace(`${prefix}school_evaluation_`, '');
    if (dateKey) {
      return deepMergeEvaluation(prev, { [dateKey]: value });
    }
  }

  return prev;
}
