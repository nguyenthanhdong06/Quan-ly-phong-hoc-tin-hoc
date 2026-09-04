import { EvaluationData } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState } from '../supabaseClient';

/**
 * 📦 GÓI GỌN PAYLOAD ĐÁNH GIÁ & CHẤM SAO THEO NGÀY & PHÂN LẬP THEO WORKSPACE
 * Tách nhỏ key lưu trữ theo từng ngày (ws_USER_school_evaluation_YYYY-MM-DD)
 * Giúp dung lượng Payload truyền tải nhẹ x10 đến x100 lần, đồng thời
 * cô lập hoàn toàn sổ điểm số, sao vàng và nhận xét của từng giáo viên!
 */

/**
 * Lưu dữ liệu chấm sao phân mảnh nhẹ theo từng ngày và không gian làm việc
 * 🚀 TỐI ƯU HÓA SUPABASE: Lưu 1 khóa tổng duy nhất (${prefix}school_evaluation_data)
 * giúp giảm 90% số lượng khóa trên Cloud và tránh rác ws_default.
 */
export async function saveDayPartitionedEvaluation(
  evaluationData: EvaluationData,
  targetDate?: string,
  workspaceId: string = 'ws_default'
): Promise<boolean> {
  if (!evaluationData) return true;
  // 🛡️ Ngăn chặn lưu nếu là workspace mặc định chưa đăng nhập (tránh rác ws_default trên Supabase)
  if (!workspaceId || workspaceId === 'ws_default') return true;

  const prefix = `${workspaceId}_`;

  // Lưu cục bộ theo ngày vào LocalStorage để đọc offline siêu tốc nếu cần
  if (targetDate && evaluationData[targetDate]) {
    safeSetLocalStorage(`${prefix}school_evaluation_${targetDate}`, evaluationData[targetDate]);
  }

  // Lưu bản tổng hợp của Workspace vào LocalStorage và duy nhất 1 key trên Supabase Cloud
  safeSetLocalStorage(`${prefix}school_evaluation_data`, evaluationData);
  return await saveSupabaseState(`${prefix}school_evaluation_data`, evaluationData);
}

/**
 * Tải và hợp nhất toàn bộ dữ liệu chấm sao phân mảnh cho một Workspace cụ thể
 */
export function loadDayPartitionedEvaluation(
  dbStates?: Record<string, any>,
  fallbackData: EvaluationData = {},
  workspaceId: string = 'ws_default'
): EvaluationData {
  const prefix = `${workspaceId}_`;
  const merged: EvaluationData = { ...fallbackData };

  // 1. Tải bản sao dự phòng của Workspace
  const scopedCloud = dbStates?.[`${prefix}school_evaluation_data`];
  if (scopedCloud && typeof scopedCloud === 'object') {
    Object.assign(merged, scopedCloud);
  } else {
    try {
      const scopedLocal = localStorage.getItem(`${prefix}school_evaluation_data`);
      if (scopedLocal) {
        Object.assign(merged, JSON.parse(scopedLocal));
      }
    } catch (e) {
      console.warn('Cannot parse evaluation fallback data:', e);
    }
  }

  // 2. Quét các key phân mảnh ws_USER_school_evaluation_YYYY-MM-DD từ Supabase dbStates
  if (dbStates) {
    Object.keys(dbStates).forEach(key => {
      if (key.startsWith(`${prefix}school_evaluation_`) && key !== `${prefix}school_evaluation_data`) {
        const dateKey = key.replace(`${prefix}school_evaluation_`, '');
        if (dateKey && dbStates[key] && typeof dbStates[key] === 'object') {
          merged[dateKey] = dbStates[key];
        }
      }
    });
  }

  // 3. Quét các key phân mảnh ws_USER_school_evaluation_YYYY-MM-DD từ LocalStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${prefix}school_evaluation_`) && key !== `${prefix}school_evaluation_data`) {
        const dateKey = key.replace(`${prefix}school_evaluation_`, '');
        const rawVal = localStorage.getItem(key);
        if (dateKey && rawVal) {
          try {
            merged[dateKey] = JSON.parse(rawVal);
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

  const prefix = `${workspaceId}_`;

  if (key === `${prefix}school_evaluation_data`) {
    return { ...prev, ...value };
  }

  if (key.startsWith(`${prefix}school_evaluation_`)) {
    const dateKey = key.replace(`${prefix}school_evaluation_`, '');
    if (dateKey) {
      return {
        ...prev,
        [dateKey]: value
      };
    }
  }

  return prev;
}
