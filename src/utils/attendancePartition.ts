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
 */
export function saveDayPartitionedAttendance(
  attendanceData: AttendanceData,
  targetDate?: string,
  workspaceId: string = 'ws_default'
) {
  if (!attendanceData) return;

  const prefix = `${workspaceId}_`;
  const datesToSave = targetDate ? [targetDate] : Object.keys(attendanceData);

  datesToSave.forEach(dateKey => {
    const dayPayload = attendanceData[dateKey];
    if (dayPayload && Object.keys(dayPayload).length > 0) {
      const partitionedKey = `${prefix}school_attendance_${dateKey}`;
      safeSetLocalStorage(partitionedKey, dayPayload);
      saveSupabaseState(partitionedKey, dayPayload);
    }
  });

  // Ghi đè bản sao dự phòng tổng của workspace vào localStorage
  safeSetLocalStorage(`${prefix}school_attendance_data`, attendanceData);
}

/**
 * Tải và hợp nhất toàn bộ dữ liệu điểm danh phân mảnh cho một Workspace cụ thể
 */
export function loadDayPartitionedAttendance(
  dbStates?: Record<string, any>,
  fallbackData: AttendanceData = {},
  workspaceId: string = 'ws_default'
): AttendanceData {
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
  workspaceId: string = 'ws_default'
): AttendanceData {
  if (!value || typeof value !== 'object') return prev;

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
