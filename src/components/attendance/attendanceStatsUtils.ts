import { Student, AttendanceData, AttendanceStatus } from '../../types';
import * as XLSX from 'xlsx';

export interface AttendanceFilterState {
  classId: string;
  month: string; // 'all' | '1'..'12'
  startDate: string;
  endDate: string;
  studentId: string; // 'all' | studentId
  status: 'all' | AttendanceStatus;
}

export interface StudentAttendanceStat {
  student: Student;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  unexcusedCount: number;
  attendanceRate: number; // 0 - 100
  rating: 'Xuất sắc' | 'Tốt' | 'Cần cố gắng' | 'Cảnh báo';
  ratingColor: {
    bg: string;
    text: string;
    border: string;
  };
  dailyRecords: Array<{
    date: string;
    status: AttendanceStatus;
    classId: string;
  }>;
}

export interface ClassSummaryStat {
  totalStudents: number;
  totalSessions: number;
  totalPresent: number;
  totalExcused: number;
  totalUnexcused: number;
  totalLate: number;
  avgAttendanceRate: number;
}

export interface MonthlyTrendStat {
  monthKey: string;
  monthNum: number;
  year: number;
  sessionsCount: number;
  presentCount: number;
  excusedCount: number;
  unexcusedCount: number;
  lateCount: number;
  attendanceRate: number;
  dates: string[];
}

export interface AttendanceAlertItem {
  id: string;
  student: Student;
  type: 'frequent_absent' | 'unexcused' | 'frequent_late' | 'low_rate';
  title: string;
  detail: string;
  suggestion: string;
  severity: 'warning' | 'danger' | 'info';
}

/**
 * Format ngày YYYY-MM-DD sang DD/MM/YYYY chuẩn tiếng Việt
 */
export const formatDateVN = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

/**
 * Lấy danh sách tất cả các ngày đã có dữ liệu điểm danh thực tế
 */
export const getRecordedDates = (
  attendanceData: AttendanceData,
  classId: string
): string[] => {
  const dates = Object.keys(attendanceData).filter((dateKey) => {
    const dayData = attendanceData[dateKey];
    if (!dayData) return false;
    if (classId === 'all') {
      return Object.keys(dayData).length > 0;
    }
    return !!dayData[classId] && Object.keys(dayData[classId]).length > 0;
  });

  return dates.sort((a, b) => a.localeCompare(b));
};

/**
 * Lọc danh sách ngày theo tháng và khoảng thời gian
 */
export const filterDates = (
  dates: string[],
  month: string,
  startDate: string,
  endDate: string
): string[] => {
  return dates.filter((dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return true;
    const m = parseInt(parts[1], 10).toString();

    // Lọc theo tháng nếu có chọn
    if (month !== 'all' && m !== month) {
      return false;
    }

    // Lọc theo khoảng ngày tùy chọn
    if (startDate && dateStr < startDate) {
      return false;
    }
    if (endDate && dateStr > endDate) {
      return false;
    }

    return true;
  });
};

/**
 * Phân loại đánh giá chuyên cần
 */
export const getAttendanceRating = (
  rate: number,
  unexcusedCount: number
): {
  rating: 'Xuất sắc' | 'Tốt' | 'Cần cố gắng' | 'Cảnh báo';
  ratingColor: { bg: string; text: string; border: string };
} => {
  if (unexcusedCount >= 2 || rate < 80) {
    return {
      rating: 'Cảnh báo',
      ratingColor: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' }
    };
  }
  if (rate >= 98) {
    return {
      rating: 'Xuất sắc',
      ratingColor: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' }
    };
  }
  if (rate >= 90) {
    return {
      rating: 'Tốt',
      ratingColor: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300' }
    };
  }
  return {
    rating: 'Cần cố gắng',
    ratingColor: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' }
  };
};

/**
 * Tính toán số liệu thống kê chi tiết cho từng học sinh
 */
export const calculateStudentAttendanceStats = (
  attendanceData: AttendanceData,
  students: Student[],
  classId: string,
  filter: AttendanceFilterState
): {
  studentStats: StudentAttendanceStat[];
  summary: ClassSummaryStat;
} => {
  // Lọc học sinh theo lớp
  let targetStudents = classId === 'all' 
    ? students 
    : students.filter((s) => s.classId === classId);

  // Lọc theo học sinh cụ thể nếu có
  if (filter.studentId !== 'all') {
    targetStudents = targetStudents.filter((s) => s.id === filter.studentId);
  }

  // Lấy các ngày có dữ liệu phù hợp
  const allRecordedDates = getRecordedDates(attendanceData, classId);
  const activeDates = filterDates(
    allRecordedDates,
    filter.month,
    filter.startDate,
    filter.endDate
  );

  let totalPresentAll = 0;
  let totalExcusedAll = 0;
  let totalUnexcusedAll = 0;
  let totalLateAll = 0;

  const studentStats: StudentAttendanceStat[] = targetStudents.map((s) => {
    let present = 0;
    let excused = 0;
    let unexcused = 0;
    let late = 0;
    const dailyRecords: Array<{ date: string; status: AttendanceStatus; classId: string }> = [];

    activeDates.forEach((d) => {
      const dayClasses = attendanceData[d];
      if (!dayClasses) return;

      // Tìm lớp của học sinh này trong ngày
      const targetClass = classId === 'all' ? s.classId : classId;
      const classRecord = dayClasses[targetClass];
      if (!classRecord) return;

      const status: AttendanceStatus = classRecord[s.id] || 'present';

      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'excused') excused++;
      else if (status === 'unexcused') unexcused++;

      dailyRecords.push({
        date: d,
        status,
        classId: targetClass
      });
    });

    const totalSessions = activeDates.length;
    // Tỷ lệ chuyên cần = (Có mặt + Đi trễ) / Tổng buổi * 100%
    const effectiveAttended = present + late;
    const attendanceRate = totalSessions > 0
      ? Math.min(100, Math.round((effectiveAttended / totalSessions) * 100))
      : 100;

    const { rating, ratingColor } = getAttendanceRating(attendanceRate, unexcused);

    totalPresentAll += present;
    totalExcusedAll += excused;
    totalUnexcusedAll += unexcused;
    totalLateAll += late;

    return {
      student: s,
      totalSessions,
      presentCount: present,
      lateCount: late,
      excusedCount: excused,
      unexcusedCount: unexcused,
      attendanceRate,
      rating,
      ratingColor,
      dailyRecords
    };
  });

  // Lọc tiếp theo trạng thái nếu có yêu cầu
  const filteredStudentStats = studentStats.filter((item) => {
    if (filter.status === 'all') return true;
    if (filter.status === 'present') return item.presentCount > 0;
    if (filter.status === 'late') return item.lateCount > 0;
    if (filter.status === 'excused') return item.excusedCount > 0;
    if (filter.status === 'unexcused') return item.unexcusedCount > 0;
    return true;
  });

  const totalStudents = targetStudents.length;
  const totalSessions = activeDates.length;
  const sumRates = studentStats.reduce((acc, curr) => acc + curr.attendanceRate, 0);
  const avgAttendanceRate = totalStudents > 0 ? Math.round(sumRates / totalStudents) : 100;

  const summary: ClassSummaryStat = {
    totalStudents,
    totalSessions,
    totalPresent: totalPresentAll,
    totalExcused: totalExcusedAll,
    totalUnexcused: totalUnexcusedAll,
    totalLate: totalLateAll,
    avgAttendanceRate
  };

  return { studentStats: filteredStudentStats, summary };
};

/**
 * Tính toán xu hướng chuyên cần theo từng tháng trong năm học
 */
export const calculateMonthlyTrends = (
  attendanceData: AttendanceData,
  classId: string,
  students: Student[]
): MonthlyTrendStat[] => {
  const targetStudents = classId === 'all'
    ? students
    : students.filter((s) => s.classId === classId);

  const dates = getRecordedDates(attendanceData, classId);

  // Nhóm ngày theo tháng (Tháng 9 -> Tháng 5 năm học)
  const monthMap: { [monthKey: string]: { monthNum: number; year: number; dates: string[] } } = {};

  dates.forEach((d) => {
    const parts = d.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const key = `Tháng ${m}`;
      if (!monthMap[key]) {
        monthMap[key] = { monthNum: m, year: y, dates: [] };
      }
      monthMap[key].dates.push(d);
    }
  });

  // Thứ tự tháng năm học: 9, 10, 11, 12, 1, 2, 3, 4, 5
  const academicOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];

  const results: MonthlyTrendStat[] = Object.keys(monthMap)
    .map((key) => {
      const info = monthMap[key];
      let present = 0;
      let late = 0;
      let excused = 0;
      let unexcused = 0;

      info.dates.forEach((dateStr) => {
        const dayRecord = attendanceData[dateStr];
        if (!dayRecord) return;

        targetStudents.forEach((s) => {
          const cls = classId === 'all' ? s.classId : classId;
          const status = dayRecord[cls]?.[s.id] || 'present';
          if (status === 'present') present++;
          else if (status === 'late') late++;
          else if (status === 'excused') excused++;
          else if (status === 'unexcused') unexcused++;
        });
      });

      const totalEntries = present + late + excused + unexcused;
      const rate = totalEntries > 0
        ? Math.min(100, Math.round(((present + late) / totalEntries) * 100))
        : 100;

      return {
        monthKey: key,
        monthNum: info.monthNum,
        year: info.year,
        sessionsCount: info.dates.length,
        presentCount: present,
        excusedCount: excused,
        unexcusedCount: unexcused,
        lateCount: late,
        attendanceRate: rate,
        dates: info.dates
      };
    })
    .sort((a, b) => {
      const orderA = academicOrder.indexOf(a.monthNum);
      const orderB = academicOrder.indexOf(b.monthNum);
      return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
    });

  return results;
};

/**
 * Phát hiện học sinh cần hỗ trợ và quan tâm tích cực
 */
export const detectAttendanceAlerts = (
  studentStats: StudentAttendanceStat[]
): AttendanceAlertItem[] => {
  const alerts: AttendanceAlertItem[] = [];

  studentStats.forEach((stat) => {
    // 1. Cảnh báo vắng không phép
    if (stat.unexcusedCount >= 1) {
      alerts.push({
        id: `unexcused-${stat.student.id}`,
        student: stat.student,
        type: 'unexcused',
        severity: stat.unexcusedCount >= 2 ? 'danger' : 'warning',
        title: `Vắng không phép (${stat.unexcusedCount} buổi)`,
        detail: `Em ${stat.student.name} có ${stat.unexcusedCount} buổi không phép. Cần kiểm tra nguyên nhân để hỗ trợ kịp thời.`,
        suggestion: 'Nhắn tin thân thiện trao đổi với GVCN để hỏi thăm sức khỏe hoặc hoàn cảnh gia đình của em.'
      });
    }

    // 2. Đi trễ nhiều lần
    if (stat.lateCount >= 2) {
      alerts.push({
        id: `late-${stat.student.id}`,
        student: stat.student,
        type: 'frequent_late',
        severity: 'warning',
        title: `Đi trễ thường xuyên (${stat.lateCount} lần)`,
        detail: `Em có ${stat.lateCount} lần vào lớp muộn trong kỳ học này.`,
        suggestion: 'Khích lệ em đi học đúng giờ, có thể thưởng thêm sao điểm danh để tạo động lực tích cực.'
      });
    }

    // 3. Tổng số buổi vắng nhiều (>= 3 buổi)
    const totalAbsent = stat.excusedCount + stat.unexcusedCount;
    if (totalAbsent >= 3 && !alerts.some(a => a.student.id === stat.student.id && a.type === 'unexcused')) {
      alerts.push({
        id: `absent-${stat.student.id}`,
        student: stat.student,
        type: 'frequent_absent',
        severity: totalAbsent >= 5 ? 'danger' : 'warning',
        title: `Nghỉ học nhiều buổi (Vắng ${totalAbsent} buổi)`,
        detail: `Em đã nghỉ tổng cộng ${totalAbsent} buổi (Có phép: ${stat.excusedCount}, Không phép: ${stat.unexcusedCount}).`,
        suggestion: 'Hỗ trợ em mượn vở bạn ghi bài và ôn tập lại kiến thức thực hành máy tính đã bỏ lỡ.'
      });
    }

    // 4. Tỷ lệ chuyên cần thấp (< 80%)
    if (stat.attendanceRate < 80 && stat.totalSessions >= 3) {
      alerts.push({
        id: `rate-${stat.student.id}`,
        student: stat.student,
        type: 'low_rate',
        severity: 'danger',
        title: `Tỷ lệ chuyên cần thấp (${stat.attendanceRate}%)`,
        detail: `Tỷ lệ tham gia học của em đạt ${stat.attendanceRate}%, dưới ngưỡng tiêu chuẩn 85%.`,
        suggestion: 'Lên kế hoạch kèm cặp phụ đạo ngắn 10 phút đầu giờ để em bắt kịp tiến độ lớp.'
      });
    }
  });

  return alerts;
};

/**
 * Xuất file Excel (.xlsx) báo cáo thống kê chuyên cần
 */
export const exportAttendanceToExcel = (
  studentStats: StudentAttendanceStat[],
  summary: ClassSummaryStat,
  className: string,
  filter: AttendanceFilterState
) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Tổng quan & Danh sách học sinh
  const rows: any[] = [
    ['BÁO CÁO THỐNG KÊ CHUYÊN CẦN HỌC SINH'],
    [`Lớp: ${className === 'all' ? 'Tất cả các lớp' : className}`],
    [`Thời gian xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
    [`Bộ lọc: Tháng ${filter.month === 'all' ? 'Cả năm' : filter.month} | Từ: ${formatDateVN(filter.startDate) || 'Đầu kỳ'} - Đến: ${formatDateVN(filter.endDate) || 'Hiện tại'}`],
    [],
    ['TỔNG QUAN LỚP HỌC'],
    ['Tổng số học sinh', summary.totalStudents],
    ['Tổng số buổi học ghi nhận', summary.totalSessions],
    ['Tổng lượt có mặt', summary.totalPresent],
    ['Tổng lượt vắng có phép', summary.totalExcused],
    ['Tổng lượt vắng không phép', summary.totalUnexcused],
    ['Tổng lượt đi trễ', summary.totalLate],
    ['Tỷ lệ chuyên cần trung bình', `${summary.avgAttendanceRate}%`],
    [],
    ['DANH SÁCH CHI TIẾT TỪNG HỌC SINH'],
    [
      'STT',
      'Mã học sinh',
      'Họ và tên',
      'Giới tính',
      'Lớp',
      'Tổng số buổi',
      'Có mặt',
      'Vắng có phép',
      'Vắng không phép',
      'Đi trễ',
      'Tỷ lệ chuyên cần (%)',
      'Đánh giá'
    ]
  ];

  studentStats.forEach((stat, idx) => {
    rows.push([
      idx + 1,
      stat.student.code,
      stat.student.name,
      stat.student.gender,
      stat.student.classId,
      stat.totalSessions,
      stat.presentCount,
      stat.excusedCount,
      stat.unexcusedCount,
      stat.lateCount,
      `${stat.attendanceRate}%`,
      stat.rating
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set độ rộng cột hợp lý
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Thống Kê Chuyên Cần');

  const fileName = `Thong_Ke_Diem_Danh_${className}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
