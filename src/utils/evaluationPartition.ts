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
 */
export function saveDayPartitionedEvaluation(
  evaluationData: EvaluationData,
  targetDate?: string,
  workspaceId: string = 'ws_default'
) {
  if (!evaluationData) return;

  const prefix = `${workspaceId}_`;
  const datesToSave = targetDate ? [targetDate] : Object.keys(evaluationData);

  datesToSave.forEach(dateKey => {
    const dayPayload = evaluationData[dateKey];
    if (dayPayload && Object.keys(dayPayload).length > 0) {
      const partitionedKey = `${prefix}school_evaluation_${dateKey}`;
      safeSetLocalStorage(partitionedKey, dayPayload);
      saveSupabaseState(partitionedKey, dayPayload);
    }
  });

  // Ghi đè bản sao dự phòng tổng của workspace vào localStorage
  safeSetLocalStorage(`${prefix}school_evaluation_data`, evaluationData);
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
