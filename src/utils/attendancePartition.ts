import { AttendanceData } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState } from '../supabaseClient';

/**
 * 📦 GÓI GỌN PAYLOAD ĐIỂM DANH THEO NGÀY (DAY-PARTITIONED ATTENDANCE UTILITY)
 * Tách nhỏ key lưu trữ theo từng ngày (school_attendance_YYYY-MM-DD)
 * Giúp dung lượng Payload truyền tải qua Supabase Cloud & WebSocket nhẹ x10 đến x100 lần!
 */

/**
 * Lưu dữ liệu điểm danh phân mảnh nhẹ theo từng ngày
 */
export function saveDayPartitionedAttendance(attendanceData: AttendanceData, targetDate?: string) {
  if (!attendanceData) return;

  const datesToSave = targetDate ? [targetDate] : Object.keys(attendanceData);

  datesToSave.forEach(dateKey => {
    const dayPayload = attendanceData[dateKey];
    if (dayPayload && Object.keys(dayPayload).length > 0) {
      const partitionedKey = `school_attendance_${dateKey}`;
      safeSetLocalStorage(partitionedKey, dayPayload);
      saveSupabaseState(partitionedKey, dayPayload);
    }
  });

  // Luôn ghi đè bản sao dự phòng tổng vào localStorage
  safeSetLocalStorage('school_attendance_data', attendanceData);
}

/**
 * Tải và hợp nhất toàn bộ dữ liệu điểm danh phân mảnh từ Supabase/LocalStorage
 */
export function loadDayPartitionedAttendance(dbStates?: Record<string, any>, fallbackData: AttendanceData = {}): AttendanceData {
  const merged: AttendanceData = { ...fallbackData };

  // 1. Tải bản sao dự phòng monolithic (nếu có)
  const legacyCloud = dbStates?.['school_attendance_data'];
  if (legacyCloud && typeof legacyCloud === 'object') {
    Object.assign(merged, legacyCloud);
  } else {
    try {
      const savedLegacy = localStorage.getItem('school_attendance_data');
      if (savedLegacy) {
        Object.assign(merged, JSON.parse(savedLegacy));
      }
    } catch (e) {
      console.warn('Cannot parse legacy attendance data:', e);
    }
  }

  // 2. Quét toàn bộ key phân mảnh school_attendance_YYYY-MM-DD từ Supabase dbStates
  if (dbStates) {
    Object.keys(dbStates).forEach(key => {
      if (key.startsWith('school_attendance_') && key !== 'school_attendance_data') {
        const dateKey = key.replace('school_attendance_', '');
        if (dateKey && dbStates[key] && typeof dbStates[key] === 'object') {
          merged[dateKey] = dbStates[key];
        }
      }
    });
  }

  // 3. Quét toàn bộ key phân mảnh school_attendance_YYYY-MM-DD từ LocalStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('school_attendance_') && key !== 'school_attendance_data') {
        const dateKey = key.replace('school_attendance_', '');
        const rawVal = localStorage.getItem(key);
        if (dateKey && rawVal) {
          merged[dateKey] = JSON.parse(rawVal);
        }
      }
    }
  } catch (e) {
    console.warn('Cannot scan localStorage attendance partitions:', e);
  }

  return merged;
}

/**
 * Cập nhật Realtime state điểm danh theo ngày khi nhận được payload từ WebSocket
 */
export function applyPartitionedAttendanceUpdate(
  prev: AttendanceData,
  key: string,
  value: any
): AttendanceData {
  if (!value || typeof value !== 'object') return prev;

  if (key === 'school_attendance_data') {
    return { ...prev, ...value };
  }

  if (key.startsWith('school_attendance_')) {
    const dateKey = key.replace('school_attendance_', '');
    if (dateKey) {
      return {
        ...prev,
        [dateKey]: value
      };
    }
  }

  return prev;
}
