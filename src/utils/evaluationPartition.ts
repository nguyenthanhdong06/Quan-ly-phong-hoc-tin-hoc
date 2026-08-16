import { EvaluationData } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState } from '../supabaseClient';

/**
 * 📦 GÓI GỌN PAYLOAD ĐÁNH GIÁ & CHẤM SAO THEO NGÀY (DAY-PARTITIONED EVALUATION UTILITY)
 * Tách nhỏ key lưu trữ theo từng ngày (school_evaluation_YYYY-MM-DD)
 * Giúp dung lượng Payload truyền tải qua Supabase Cloud & WebSocket nhẹ hơn x10 đến x100 lần!
 */

/**
 * Lưu dữ liệu chấm sao phân mảnh nhẹ theo từng ngày
 */
export function saveDayPartitionedEvaluation(evaluationData: EvaluationData, targetDate?: string) {
  if (!evaluationData) return;

  const datesToSave = targetDate ? [targetDate] : Object.keys(evaluationData);

  datesToSave.forEach(dateKey => {
    const dayPayload = evaluationData[dateKey];
    if (dayPayload && Object.keys(dayPayload).length > 0) {
      const partitionedKey = `school_evaluation_${dateKey}`;
      safeSetLocalStorage(partitionedKey, dayPayload);
      saveSupabaseState(partitionedKey, dayPayload);
    }
  });

  // Ghi đè bản sao dự phòng tổng vào localStorage
  safeSetLocalStorage('school_evaluation_data', evaluationData);
}

/**
 * Tải và hợp nhất toàn bộ dữ liệu chấm sao phân mảnh từ Supabase/LocalStorage
 */
export function loadDayPartitionedEvaluation(dbStates?: Record<string, any>, fallbackData: EvaluationData = {}): EvaluationData {
  const merged: EvaluationData = { ...fallbackData };

  // 1. Tải bản sao dự phòng monolithic (nếu có)
  const legacyCloud = dbStates?.['school_evaluation_data'];
  if (legacyCloud && typeof legacyCloud === 'object') {
    Object.assign(merged, legacyCloud);
  } else {
    try {
      const savedLegacy = localStorage.getItem('school_evaluation_data');
      if (savedLegacy) {
        Object.assign(merged, JSON.parse(savedLegacy));
      }
    } catch (e) {
      console.warn('Cannot parse legacy evaluation data:', e);
    }
  }

  // 2. Quét toàn bộ key phân mảnh school_evaluation_YYYY-MM-DD từ Supabase dbStates
  if (dbStates) {
    Object.keys(dbStates).forEach(key => {
      if (key.startsWith('school_evaluation_') && key !== 'school_evaluation_data') {
        const dateKey = key.replace('school_evaluation_', '');
        if (dateKey && dbStates[key] && typeof dbStates[key] === 'object') {
          merged[dateKey] = dbStates[key];
        }
      }
    });
  }

  // 3. Quét toàn bộ key phân mảnh school_evaluation_YYYY-MM-DD từ LocalStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('school_evaluation_') && key !== 'school_evaluation_data') {
        const dateKey = key.replace('school_evaluation_', '');
        const rawVal = localStorage.getItem(key);
        if (dateKey && rawVal) {
          merged[dateKey] = JSON.parse(rawVal);
        }
      }
    }
  } catch (e) {
    console.warn('Cannot scan localStorage evaluation partitions:', e);
  }

  return merged;
}

/**
 * Cập nhật Realtime state chấm sao theo ngày khi nhận được payload từ WebSocket
 */
export function applyPartitionedEvaluationUpdate(
  prev: EvaluationData,
  key: string,
  value: any
): EvaluationData {
  if (!value || typeof value !== 'object') return prev;

  if (key === 'school_evaluation_data') {
    return { ...prev, ...value };
  }

  if (key.startsWith('school_evaluation_')) {
    const dateKey = key.replace('school_evaluation_', '');
    if (dateKey) {
      return {
        ...prev,
        [dateKey]: value
      };
    }
  }

  return prev;
}
