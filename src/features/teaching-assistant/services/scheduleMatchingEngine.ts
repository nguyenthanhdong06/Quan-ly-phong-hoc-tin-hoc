import { Member, TimetableCell, TimetableData } from '../../../types';
import { PERIOD_TIMES, DAY_NAMES } from '../constants';
import { CurrentClassContext, MatchedScheduleSlot } from '../types';
import { safeGetLocalStorage } from '../../../utils/safeStorage';

/**
 * 🔍 Lấy dữ liệu TKB của giáo viên hiện tại từ TimetableData và Workspace riêng biệt
 */
export function getTeacherScheduleMap(
  timetableData: TimetableData,
  currentUser: Member | null,
  dbStates?: Record<string, any>
): Record<string, TimetableCell> {
  if (!currentUser) return {};

  const cleanId = (currentUser.id || currentUser.username || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const wsKey = `ws_${cleanId}_school_timetable_data`;

  // 1. Kiểm tra trong timetableData theo username, id, name hoặc cleanId
  if (timetableData) {
    if (currentUser.username && timetableData[currentUser.username] && Object.keys(timetableData[currentUser.username]).length > 0) {
      return timetableData[currentUser.username];
    }
    if (currentUser.id && timetableData[currentUser.id] && Object.keys(timetableData[currentUser.id]).length > 0) {
      return timetableData[currentUser.id];
    }
    if (currentUser.name && timetableData[currentUser.name] && Object.keys(timetableData[currentUser.name]).length > 0) {
      return timetableData[currentUser.name];
    }
    if (cleanId && timetableData[cleanId] && Object.keys(timetableData[cleanId]).length > 0) {
      return timetableData[cleanId];
    }
    // Khớp không phân biệt hoa thường
    const searchKey = (currentUser.username || currentUser.id || currentUser.name || '').toLowerCase();
    const matchedKey = Object.keys(timetableData).find(k => k.toLowerCase() === searchKey);
    if (matchedKey && timetableData[matchedKey] && Object.keys(timetableData[matchedKey]).length > 0) {
      return timetableData[matchedKey];
    }
  }

  // 2. Tôn trọng không gian làm việc (Workspace): Đọc từ dbStates theo wsKey
  if (dbStates && dbStates[wsKey] && typeof dbStates[wsKey] === 'object' && Object.keys(dbStates[wsKey]).length > 0) {
    return dbStates[wsKey];
  }

  // 3. Đọc từ LocalStorage theo wsKey riêng của Workspace giáo viên
  const wsSchedule = safeGetLocalStorage<Record<string, TimetableCell>>(wsKey, {});
  if (wsSchedule && Object.keys(wsSchedule).length > 0) {
    return wsSchedule;
  }

  // 4. Fallback cho Admin nếu Admin chưa có TKB riêng: Lấy giáo viên đầu tiên có TKB để tiện đối chiếu
  if (currentUser.role?.includes('Admin') && timetableData) {
    const firstActiveTeacherKey = Object.keys(timetableData).find(k => Object.keys(timetableData[k] || {}).length > 0);
    if (firstActiveTeacherKey && timetableData[firstActiveTeacherKey]) {
      return timetableData[firstActiveTeacherKey];
    }
  }

  return {};
}

/**
 * 🎯 Tìm tất cả các tiết trong tuần giáo viên dạy lớp này (để gợi ý liên kết TKB)
 */
export function findMatchingSlotsForClass(
  scheduleMap: Record<string, TimetableCell>,
  className: string,
  subject?: string
): MatchedScheduleSlot[] {
  if (!scheduleMap || !className) return [];

  const matches: MatchedScheduleSlot[] = [];
  const normalizedClass = className.trim().toLowerCase();

  for (const [key, cell] of Object.entries(scheduleMap)) {
    if (!cell || !cell.className) continue;

    const cellClass = cell.className.trim().toLowerCase();
    if (cellClass === normalizedClass) {
      if (subject && cell.subject && cell.subject.toLowerCase() !== subject.toLowerCase()) {
        continue;
      }

      const [day, period] = key.split('-');
      const timeConfig = PERIOD_TIMES[period] || { session: 'Sáng', start: '08:00', end: '08:45' };

      matches.push({
        day,
        period,
        session: timeConfig.session,
        startTime: timeConfig.start,
        endTime: timeConfig.end,
        className: cell.className,
        subject: cell.subject || 'Tin học',
      });
    }
  }

  // Sắp xếp theo Thứ rồi theo Tiết
  return matches.sort((a, b) => {
    if (a.day !== b.day) return Number(a.day) - Number(b.day);
    return Number(a.period) - Number(b.period);
  });
}

/**
 * 🕒 Xác định tiết học và lớp đang dạy hiện tại (Realtime Context)
 * Dùng cho tính năng "Ghi chú nhanh 1-chạm" và thông báo nhắc nhở
 */
export function resolveCurrentClassContext(
  scheduleMap: Record<string, TimetableCell>,
  customDate?: Date
): CurrentClassContext {
  const now = customDate || new Date();
  const jsDay = now.getDay(); // 0 = CN, 1 = T2, 2 = T3, ..., 6 = T7

  // Ánh xạ Thứ: JS 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6
  let scheduleDay = '';
  if (jsDay >= 1 && jsDay <= 5) {
    scheduleDay = String(jsDay + 1); // 1 -> '2', 2 -> '3', ..., 5 -> '6'
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!scheduleDay || !scheduleMap) {
    return {
      isTeachingNow: false,
      day: scheduleDay,
      period: '',
      className: '',
      subject: '',
      startTime: '',
      endTime: '',
      remainingMinutes: 0,
    };
  }

  // Duyệt qua 7 tiết học xem giờ hiện tại nằm trong tiết nào (kèm dung sai 5 phút trước/sau tiết)
  for (const [period, times] of Object.entries(PERIOD_TIMES)) {
    const [startH, startM] = times.start.split(':').map(Number);
    const [endH, endM] = times.end.split(':').map(Number);

    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;

    // Trong tiết hoặc trước tiết 10 phút
    if (currentMinutes >= startTotalMinutes - 10 && currentMinutes <= endTotalMinutes + 5) {
      const key = `${scheduleDay}-${period}`;
      const cell = scheduleMap[key];

      if (cell && cell.className) {
        const remaining = Math.max(0, endTotalMinutes - currentMinutes);
        return {
          isTeachingNow: true,
          day: scheduleDay,
          period,
          className: cell.className,
          subject: cell.subject || 'Tin học',
          startTime: times.start,
          endTime: times.end,
          remainingMinutes: remaining,
        };
      }
    }
  }

  return {
    isTeachingNow: false,
    day: scheduleDay,
    period: '',
    className: '',
    subject: '',
    startTime: '',
    endTime: '',
    remainingMinutes: 0,
  };
}

/**
 * 📅 Tính ngày cụ thể (YYYY-MM-DD) cho Thứ trong tuần
 * targetDay: '2' (T2), '3' (T3)...
 * weekOffset: 0 = tuần này, 1 = tuần tới, -1 = tuần trước
 */
export function getDateOfWeekDay(targetDay: string, weekOffset: number = 0): { dateStr: string; displayStr: string } {
  const now = new Date();
  const currentDay = now.getDay(); // 0: CN, 1: T2...
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const targetDayNum = Number(targetDay); // 2 -> Thứ 2 (offset 0 từ Thứ 2)
  const dayOffsetFromMonday = targetDayNum - 2;

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + distanceToMonday + (weekOffset * 7) + dayOffsetFromMonday);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const date = String(targetDate.getDate()).padStart(2, '0');

  const dateStr = `${year}-${month}-${date}`;
  const displayStr = `${date}/${month}`;

  return { dateStr, displayStr };
}

/**
 * 🏷️ Trích xuất danh sách môn học duy nhất từ TKB của giáo viên
 */
export function extractTeacherSubjects(scheduleMap: Record<string, TimetableCell>): string[] {
  const subjectsSet = new Set<string>();
  subjectsSet.add('Tin học'); // Mặc định luôn có môn Tin học

  Object.values(scheduleMap || {}).forEach(cell => {
    if (cell && cell.subject && cell.subject.trim()) {
      subjectsSet.add(cell.subject.trim());
    }
  });

  return Array.from(subjectsSet);
}
