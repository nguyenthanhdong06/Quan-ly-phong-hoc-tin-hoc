import { TimetableData } from '../types';

/**
 * Tự động chuyển đổi các tiết học buổi chiều từ cấu trúc cũ sang cấu trúc mới:
 * - Chiều 5 (cũ: slot 5) -> Chiều 6 (mới: slot 6)
 * - Chiều 6 (cũ: slot 6) -> Chiều 7 (mới: slot 7)
 * - Chiều 7 (cũ: slot 7) -> Chiều 8 (mới: slot 8)
 * - Buổi sáng có 5 tiết (slot 1 đến 5).
 */
export function shiftScheduleToV2(schedule: Record<string, any>): Record<string, any> {
  if (!schedule || typeof schedule !== 'object') return schedule;
  const keys = Object.keys(schedule);
  // Nếu đã có slot kết thúc bằng -8 thì đã migrate rồi
  if (keys.some(k => k.endsWith('-8'))) return schedule;

  const shifted: Record<string, any> = {};
  for (const [key, val] of Object.entries(schedule)) {
    const parts = key.split('-');
    if (parts.length === 2) {
      const [day, period] = parts;
      if (period === '7') shifted[`${day}-8`] = val;
      else if (period === '6') shifted[`${day}-7`] = val;
      else if (period === '5') shifted[`${day}-6`] = val;
      else shifted[key] = val;
    } else {
      shifted[key] = val;
    }
  }
  return shifted;
}

export function shiftTimetableDataToV2(data: TimetableData): TimetableData {
  if (!data || typeof data !== 'object') return data;
  const result: TimetableData = {};
  for (const [teacherId, sched] of Object.entries(data)) {
    result[teacherId] = shiftScheduleToV2(sched);
  }
  return result;
}

export function autoMigrateLocalTimetableStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const isMigrated = localStorage.getItem('timetable_v2_migrated');
    if (isMigrated === 'true') return;

    // Migrate global school_timetable_data in localStorage
    const rawGlobal = localStorage.getItem('school_timetable_data');
    if (rawGlobal) {
      try {
        const parsed = JSON.parse(rawGlobal);
        const migrated = shiftTimetableDataToV2(parsed);
        localStorage.setItem('school_timetable_data', JSON.stringify(migrated));
      } catch (e) {
        // ignore
      }
    }

    // Migrate all ws_*_school_timetable_data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ws_') && key.endsWith('_school_timetable_data')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const migrated = shiftScheduleToV2(parsed);
            localStorage.setItem(key, JSON.stringify(migrated));
          } catch (e) {}
        }
      }
    }

    localStorage.setItem('timetable_v2_migrated', 'true');
  } catch (err) {
    console.warn('Timetable storage migration notice:', err);
  }
}
