import React, { useState, useMemo } from 'react';
import { 
  Student, 
  ClassItem, 
  EvaluationData, 
  Computer, 
  SeatingChart, 
  Member 
} from '../types';
import { 
  LayoutGrid, 
  Users, 
  Calendar, 
  TrendingUp, 
  FileText, 
  ArrowLeft, 
  Search, 
  Copy, 
  Download, 
  Printer, 
  Check, 
  AlertTriangle, 
  Award, 
  ShieldAlert, 
  Filter, 
  Sparkles, 
  Clock, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { VietnameseDatePicker } from './common/VietnameseDatePicker';
import { matchStudentSearch } from '../utils/nameFormatter';

interface EvaluationStatisticsViewProps {
  selectedClass: string;
  classes: ClassItem[];
  students: Student[];
  evaluationData: EvaluationData;
  computers: Computer[];
  seatingChart: SeatingChart;
  currentUser?: Member | null;
  onBack: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export type PeriodType = 'today' | 'this_week' | 'this_month' | 'semester_1' | 'semester_2' | 'school_year' | 'custom';
export type ActiveTabModule = 'overview' | 'students' | 'timeline' | 'behavior' | 'reports';

// Hàm nhận diện thẻ vi phạm / nhắc nhở chuẩn mực
export const isViolationOrReminderTag = (tag: string): boolean => {
  const lower = tag.toLowerCase();
  return (
    tag.includes('🔴') ||
    lower.includes('nói chuyện') ||
    lower.includes('chưa tập trung') ||
    lower.includes('mất trật tự') ||
    lower.includes('muộn') ||
    lower.includes('trễ') ||
    lower.includes('sách') ||
    lower.includes('vở') ||
    lower.includes('vệ sinh') ||
    lower.includes('nhắc nhở') ||
    lower.includes('vi phạm') ||
    lower.includes('nghịch') ||
    lower.includes('game') ||
    lower.includes('chơi') ||
    tag.includes('-')
  );
};

// Hàm nhận diện thẻ khen ngợi / tiến bộ
export const isPraiseTag = (tag: string): boolean => {
  const lower = tag.toLowerCase();
  return (
    tag.includes('🟢') ||
    lower.includes('hăng hái') ||
    lower.includes('thực hành tốt') ||
    lower.includes('giúp đỡ') ||
    lower.includes('phát biểu') ||
    lower.includes('trực nhật') ||
    lower.includes('khen thưởng') ||
    lower.includes('chăm chỉ') ||
    tag.includes('+')
  );
};

// Phân loại nhóm hành vi vi phạm
export const categorizeViolation = (tagOrComment: string): string => {
  const lower = tagOrComment.toLowerCase();
  if (lower.includes('nói chuyện') || lower.includes('mất trật tự') || lower.includes('ồn')) {
    return 'Nói chuyện riêng / Ồn ào';
  }
  if (lower.includes('chưa tập trung') || lower.includes('làm việc riêng') || lower.includes('ngủ gật')) {
    return 'Chưa tập trung / Việc riêng';
  }
  if (lower.includes('sách') || lower.includes('vở') || lower.includes('đồ dùng') || lower.includes('quên bút')) {
    return 'Quên sách vở / Đồ dùng';
  }
  if (lower.includes('nghịch') || lower.includes('game') || lower.includes('mạng') || lower.includes('máy tính') || lower.includes('phá')) {
    return 'Nghịch máy / Chơi game / Vào mạng';
  }
  if (lower.includes('muộn') || lower.includes('trễ') || lower.includes('ra ngoài') || lower.includes('rời vị trí')) {
    return 'Đi trễ / Tự ý rời vị trí';
  }
  return 'Lỗi nền nếp khác';
};

// Lấy khoảng thời gian mặc định của năm học hiện tại
const getPeriodDates = (period: PeriodType): { start: string; end: string } => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  if (period === 'today') {
    return { start: todayStr, end: todayStr };
  }

  if (period === 'this_week') {
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mY = monday.getFullYear();
    const mM = String(monday.getMonth() + 1).padStart(2, '0');
    const mD = String(monday.getDate()).padStart(2, '0');

    const sY = sunday.getFullYear();
    const sM = String(sunday.getMonth() + 1).padStart(2, '0');
    const sD = String(sunday.getDate()).padStart(2, '0');

    return { start: `${mY}-${mM}-${mD}`, end: `${sY}-${sM}-${sD}` };
  }

  if (period === 'this_month') {
    const firstDay = `${y}-${m}-01`;
    const lastDayNum = new Date(y, now.getMonth() + 1, 0).getDate();
    const lastDay = `${y}-${m}-${String(lastDayNum).padStart(2, '0')}`;
    return { start: firstDay, end: lastDay };
  }

  // Năm học: Bắt đầu từ tháng 9 năm nay hoặc năm ngoái
  const currentSchoolYearStart = now.getMonth() >= 8 ? y : y - 1;
  const currentSchoolYearEnd = currentSchoolYearStart + 1;

  if (period === 'semester_1') {
    return { start: `${currentSchoolYearStart}-09-01`, end: `${currentSchoolYearEnd}-01-15` };
  }

  if (period === 'semester_2') {
    return { start: `${currentSchoolYearEnd}-01-16`, end: `${currentSchoolYearEnd}-05-31` };
  }

  if (period === 'school_year') {
    return { start: `${currentSchoolYearStart}-09-01`, end: `${currentSchoolYearEnd}-05-31` };
  }

  return { start: todayStr, end: todayStr };
};

export const EvaluationStatisticsView: React.FC<EvaluationStatisticsViewProps> = ({
  selectedClass,
  classes,
  students,
  evaluationData,
  computers,
  seatingChart,
  currentUser,
  onBack,
  showToast
}) => {
  // State điều hướng 5 module theo ảnh đính kèm
  const [activeModule, setActiveModule] = useState<ActiveTabModule>('overview');
  
  // State phạm vi lớp: 'current' (Lớp hiện tại trên thanh ngang) | 'all' (Tất cả lớp phụ trách)
  const [scopeMode, setScopeMode] = useState<'current' | 'all'>('current');

  // State khoảng thời gian
  const [periodType, setPeriodType] = useState<PeriodType>('this_month');
  const defaultDates = useMemo(() => getPeriodDates('this_month'), []);
  const [customStartDate, setCustomStartDate] = useState<string>(defaultDates.start);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultDates.end);

  // Bộ lọc tìm kiếm học sinh
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'once' | 'repeat' | 'severe'>('all');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<string | null>(null);

  // Mẫu tin nhắn Zalo
  const [zaloReportFormat, setZaloReportFormat] = useState<'summary' | 'detailed' | 'cooperation'>('summary');
  const [copiedZalo, setCopiedZalo] = useState(false);

  // Tính toán khoảng ngày thực tế có hiệu lực
  const effectiveDateRange = useMemo(() => {
    if (periodType === 'custom') {
      return {
        start: customStartDate || '2000-01-01',
        end: customEndDate || '2099-12-31'
      };
    }
    return getPeriodDates(periodType);
  }, [periodType, customStartDate, customEndDate]);

  // Danh sách các lớp trong phạm vi thống kê
  const targetClasses = useMemo(() => {
    if (scopeMode === 'current') {
      return [selectedClass];
    }
    return classes.map(c => c.id || c.name);
  }, [scopeMode, selectedClass, classes]);

  // Danh sách học sinh thuộc phạm vi thống kê
  const targetStudents = useMemo(() => {
    if (scopeMode === 'current') {
      return students.filter(s => s.classId === selectedClass);
    }
    return students.filter(s => targetClasses.includes(s.classId));
  }, [scopeMode, selectedClass, targetClasses, students]);

  // GVCN của lớp đang chọn
  const currentClassObj = useMemo(() => {
    return classes.find(c => c.id === selectedClass || c.name === selectedClass);
  }, [classes, selectedClass]);
  const gvcnName = currentClassObj?.teacher?.trim() || 'Giáo viên chủ nhiệm';
  const gvcnPhone = currentClassObj?.teacherPhone?.trim() || '';

  // 🧠 CORE ENGINE: TỔNG HỢP VÀ PHÂN TÍCH TẤT CẢ VI PHẠM TRONG KHOẢNG THỜI GIAN
  const statsData = useMemo(() => {
    const studentMap: Record<string, {
      student: Student;
      violationsCount: number;
      praisesCount: number;
      records: Array<{
        date: string;
        classId: string;
        rating: number;
        comment: string;
        violationTags: string[];
        praiseTags: string[];
        categories: string[];
      }>;
    }> = {};

    // Khởi tạo map cho tất cả học sinh trong phạm vi
    targetStudents.forEach(s => {
      studentMap[s.id] = {
        student: s,
        violationsCount: 0,
        praisesCount: 0,
        records: []
      };
    });

    const categoryStats: Record<string, number> = {
      'Nói chuyện riêng / Ồn ào': 0,
      'Chưa tập trung / Việc riêng': 0,
      'Quên sách vở / Đồ dùng': 0,
      'Nghịch máy / Chơi game / Vào mạng': 0,
      'Đi trễ / Tự ý rời vị trí': 0,
      'Lỗi nền nếp khác': 0
    };

    const timelineStats: Record<string, { date: string; violations: number; praises: number }> = {};
    const classStats: Record<string, { totalStudents: number; violationsCount: number; violatingStudents: Set<string> }> = {};

    targetClasses.forEach(cId => {
      const classSts = students.filter(s => s.classId === cId);
      classStats[cId] = {
        totalStudents: classSts.length,
        violationsCount: 0,
        violatingStudents: new Set<string>()
      };
    });

    let totalViolations = 0;
    let totalPraises = 0;

    // Quét toàn bộ các ngày có trong evaluationData
    const allDates = Object.keys(evaluationData || {}).sort();

    allDates.forEach(dateKey => {
      // Kiểm tra nằm trong khoảng ngày
      if (dateKey >= effectiveDateRange.start && dateKey <= effectiveDateRange.end) {
        const dayClasses = evaluationData[dateKey] || {};

        targetClasses.forEach(cId => {
          const classEvals = dayClasses[cId] || {};

          Object.keys(classEvals).forEach(studentId => {
            const evalRec = classEvals[studentId];
            if (!evalRec) return;

            const tags = Array.isArray(evalRec.tags) ? evalRec.tags : [];
            const comment = (evalRec.comment || '').trim();
            const rating = evalRec.rating || 0;

            const violationTags = tags.filter(isViolationOrReminderTag);
            const praiseTags = tags.filter(isPraiseTag);

            // Xác định xem có tính là 1 lượt vi phạm không:
            // 1) Có thẻ vi phạm HOẶC 2) Rating thấp 1-2 sao HOẶC 3) Nhận xét có chứa nội dung nhắc nhở
            const isViolation = violationTags.length > 0 || (rating > 0 && rating <= 2) || (comment && isViolationOrReminderTag(comment));
            const isPraise = praiseTags.length > 0 || rating >= 4;

            if (isPraise) {
              totalPraises++;
              if (studentMap[studentId]) {
                studentMap[studentId].praisesCount++;
              }
              if (!timelineStats[dateKey]) {
                timelineStats[dateKey] = { date: dateKey, violations: 0, praises: 0 };
              }
              timelineStats[dateKey].praises++;
            }

            if (isViolation) {
              totalViolations++;

              if (!timelineStats[dateKey]) {
                timelineStats[dateKey] = { date: dateKey, violations: 0, praises: 0 };
              }
              timelineStats[dateKey].violations++;

              if (classStats[cId]) {
                classStats[cId].violationsCount++;
                classStats[cId].violatingStudents.add(studentId);
              }

              // Phân loại nhóm hành vi
              const studentCategories: string[] = [];
              if (violationTags.length > 0) {
                violationTags.forEach(t => {
                  const cat = categorizeViolation(t);
                  categoryStats[cat] = (categoryStats[cat] || 0) + 1;
                  if (!studentCategories.includes(cat)) studentCategories.push(cat);
                });
              } else if (comment) {
                const cat = categorizeViolation(comment);
                categoryStats[cat] = (categoryStats[cat] || 0) + 1;
                if (!studentCategories.includes(cat)) studentCategories.push(cat);
              } else {
                categoryStats['Lỗi nền nếp khác'] = (categoryStats['Lỗi nền nếp khác'] || 0) + 1;
                studentCategories.push('Lỗi nền nếp khác');
              }

              if (studentMap[studentId]) {
                studentMap[studentId].violationsCount++;
                studentMap[studentId].records.push({
                  date: dateKey,
                  classId: cId,
                  rating,
                  comment,
                  violationTags,
                  praiseTags,
                  categories: studentCategories
                });
              }
            }
          });
        });
      }
    });

    // Danh sách học sinh có vi phạm
    const violatingStudentsList = Object.values(studentMap)
      .filter(item => item.violationsCount > 0)
      .sort((a, b) => b.violationsCount - a.violationsCount);

    // Học sinh tái phạm (>= 2 lần)
    const repeatOffenders = violatingStudentsList.filter(item => item.violationsCount >= 2);

    // Học sinh vi phạm nặng (>= 4 lần)
    const severeOffenders = violatingStudentsList.filter(item => item.violationsCount >= 4);

    // Lớp cần quan tâm nhất
    let mostViolatedClass = selectedClass;
    let maxViolations = -1;
    Object.keys(classStats).forEach(cId => {
      if (classStats[cId].violationsCount > maxViolations) {
        maxViolations = classStats[cId].violationsCount;
        mostViolatedClass = cId;
      }
    });

    // Học sinh có tiến bộ (có vi phạm nhưng đã được khen thưởng nhiều hơn hoặc không tái phạm trong 7 ngày gần nhất)
    const improvingStudents = Object.values(studentMap).filter(item => {
      return item.violationsCount > 0 && item.praisesCount >= item.violationsCount;
    });

    return {
      totalStudents: targetStudents.length,
      violatingStudentsCount: violatingStudentsList.length,
      totalViolationsCount: totalViolations,
      repeatOffendersCount: repeatOffenders.length,
      severeOffendersCount: severeOffenders.length,
      improvingStudentsCount: improvingStudents.length,
      totalPraisesCount: totalPraises,
      mostViolatedClass,
      violatingStudentsList,
      categoryStats,
      timelineStats: Object.values(timelineStats).sort((a, b) => a.date.localeCompare(b.date)),
      classStats
    };
  }, [evaluationData, targetStudents, targetClasses, effectiveDateRange, selectedClass, students]);

  // Lọc học sinh ở Mục 2 theo Search Term và Mức độ
  const filteredViolatingStudents = useMemo(() => {
    return statsData.violatingStudentsList.filter(item => {
      // 1. Lọc theo search
      if (searchStudentTerm.trim()) {
        const matches = matchStudentSearch(item.student, searchStudentTerm, targetStudents);
        if (!matches) return false;
      }
      // 2. Lọc theo mức độ
      if (severityFilter === 'once') return item.violationsCount === 1;
      if (severityFilter === 'repeat') return item.violationsCount >= 2 && item.violationsCount <= 3;
      if (severityFilter === 'severe') return item.violationsCount >= 4;
      return true;
    });
  }, [statsData.violatingStudentsList, searchStudentTerm, targetStudents, severityFilter]);

  // Thông tin học sinh đang chọn xem chi tiết
  const currentDetailStudent = useMemo(() => {
    if (!selectedStudentForDetail) return null;
    return statsData.violatingStudentsList.find(s => s.student.id === selectedStudentForDetail) || null;
  }, [selectedStudentForDetail, statsData.violatingStudentsList]);

  // Tạo nội dung tin nhắn gửi GVCN qua Zalo
  const generatedZaloMessage = useMemo(() => {
    const formattedStart = effectiveDateRange.start.split('-').reverse().join('/');
    const formattedEnd = effectiveDateRange.end.split('-').reverse().join('/');
    const timeLabel = effectiveDateRange.start === effectiveDateRange.end ? formattedStart : `${formattedStart} - ${formattedEnd}`;

    let msg = `📋 BÁO CÁO TỔNG HỢP NỀN NẾP TIẾT TIN HỌC - LỚP ${selectedClass}\n`;
    msg += `📅 Thời gian: ${timeLabel}\n`;
    msg += `------------------------------------\n`;
    msg += `👨‍🏫 Kính gửi Giáo viên chủ nhiệm Lớp ${selectedClass} (${gvcnName}),\n`;
    msg += `Bộ môn Tin học xin gửi Thầy/Cô báo cáo tổng kết nền nếp của lớp trong giai đoạn vừa qua:\n\n`;
    msg += `📊 Tổng số học sinh: ${statsData.totalStudents} em\n`;
    msg += `🌟 Số lượt khen thưởng tích cực: ${statsData.totalPraisesCount} lượt\n`;
    msg += `⚠️ Số học sinh cần nhắc nhở: ${statsData.violatingStudentsCount} em (${statsData.totalViolationsCount} lượt vi phạm)\n`;

    if (statsData.violatingStudentsCount === 0) {
      msg += `\n🎉 TUYỆT VỜI: Cả lớp duy trì nền nếp rất tốt, không có trường hợp nào vi phạm kỷ luật phòng máy trong suốt thời gian này!\n`;
    } else {
      if (zaloReportFormat === 'summary') {
        msg += `\n📌 DANH SÁCH HỌC SINH CẦN NHẮC NHỞ / TÁI PHẠM:\n`;
        statsData.violatingStudentsList.forEach((item, idx) => {
          const commonErrors = Array.from(new Set(item.records.flatMap(r => r.categories))).slice(0, 2).join(', ');
          const levelText = item.violationsCount >= 3 ? '🔴 Tái phạm nhiều' : (item.violationsCount === 2 ? '🟠 Tái phạm' : '🟡 Nhắc nhở');
          msg += `${idx + 1}. ${item.student.name} (${item.violationsCount} lần - ${levelText})${commonErrors ? `: ${commonErrors}` : ''}\n`;
        });
      } else if (zaloReportFormat === 'detailed') {
        msg += `\n🔍 CHI TIẾT CÁC LẦN VI PHẠM TỪNG EM:\n`;
        statsData.violatingStudentsList.forEach((item, idx) => {
          msg += `\n${idx + 1}. ${item.student.name} (${item.violationsCount} lần):\n`;
          item.records.forEach(r => {
            const dStr = r.date.split('-').reverse().slice(0, 2).join('/');
            const detailText = r.comment || r.violationTags.join(', ') || 'Chưa tập trung';
            msg += `   - [${dStr}]: ${detailText}\n`;
          });
        });
      } else if (zaloReportFormat === 'cooperation') {
        const severeItems = statsData.violatingStudentsList.filter(s => s.violationsCount >= 2);
        msg += `\n🤝 CÁC TRƯỜNG HỢP CẦN PHỐI HỢP ĐẶC BIỆT (${severeItems.length} em):\n`;
        if (severeItems.length === 0) {
          msg += `(Không có em nào tái phạm từ 2 lần trở lên. Các lỗi vi phạm chỉ mang tính nhất thời)\n`;
        } else {
          severeItems.forEach((item, idx) => {
            const allComments = item.records.map(r => r.comment).filter(Boolean).slice(0, 2).join('; ');
            msg += `${idx + 1}. ${item.student.name} - Vi phạm ${item.violationsCount} lần. ${allComments ? `Lưu ý: "${allComments}"` : 'Thường xuyên nói chuyện/mất trật tự.'}\n`;
          });
          msg += `\nNhờ Thầy/Cô chủ nhiệm quan tâm nhắc nhở và đôn đốc thêm giúp bộ môn ạ!\n`;
        }
      }
    }

    msg += `\nTrân trọng cảm ơn sự phối hợp của Thầy/Cô!`;
    return msg;
  }, [effectiveDateRange, selectedClass, gvcnName, statsData, zaloReportFormat]);

  // Xử lý sao chép Zalo
  const handleCopyZalo = async () => {
    try {
      await navigator.clipboard.writeText(generatedZaloMessage);
      setCopiedZalo(true);
      showToast('Đã sao chép nội dung báo cáo Zalo vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopiedZalo(false), 2500);
    } catch (e) {
      showToast('Không thể sao chép tự động, vui lòng chọn văn bản và sao chép thủ công.', 'warning');
    }
  };

  // Mở Zalo Web / App
  const handleOpenZalo = () => {
    handleCopyZalo();
    const zaloUrl = gvcnPhone 
      ? `https://zalo.me/${gvcnPhone.replace(/\D/g, '')}`
      : 'https://chat.zalo.me';
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  };

  // Xuất file Excel (.xlsx) chuẩn chỉnh
  const handleExportExcel = () => {
    try {
      const formattedStart = effectiveDateRange.start.split('-').reverse().join('/');
      const formattedEnd = effectiveDateRange.end.split('-').reverse().join('/');
      const timeLabel = effectiveDateRange.start === effectiveDateRange.end ? formattedStart : `${formattedStart} den ${formattedEnd}`;

      // 1. Tạo hàng dữ liệu cho bảng
      const excelRows: any[] = [];

      excelRows.push({ 'A': 'BÁO CÁO THỐNG KÊ TÌNH HÌNH VI PHẠM & NỀN NẾP HỌC SINH' });
      excelRows.push({ 'A': `Phạm vi: ${scopeMode === 'current' ? `Lớp ${selectedClass}` : 'Tất cả các lớp phụ trách'}` });
      excelRows.push({ 'A': `Thời gian thống kê: ${timeLabel}` });
      excelRows.push({ 'A': `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}` });
      excelRows.push({}); // Dòng trống

      // Header bảng chính
      excelRows.push({
        'STT': 'STT',
        'Họ và tên': 'Họ và tên',
        'Lớp': 'Lớp',
        'Vị trí máy': 'Vị trí máy',
        'Số lượt vi phạm': 'Số lượt vi phạm',
        'Mức độ': 'Mức độ',
        'Lỗi thường gặp': 'Lỗi thường gặp',
        'Lịch sử chi tiết': 'Lịch sử chi tiết (Ngày - Lỗi - Nhận xét)'
      });

      if (statsData.violatingStudentsList.length === 0) {
        excelRows.push({
          'STT': '',
          'Họ và tên': 'Không có học sinh vi phạm trong thời gian này',
          'Lớp': '',
          'Vị trí máy': '',
          'Số lượt vi phạm': 0,
          'Mức độ': 'Tốt',
          'Lỗi thường gặp': 'Chăm ngoan, chấp hành tốt',
          'Lịch sử chi tiết': ''
        });
      } else {
        statsData.violatingStudentsList.forEach((item, index) => {
          const seatId = Object.keys(seatingChart[item.student.classId] || {}).find(k => seatingChart[item.student.classId][k] === item.student.id);
          const comp = seatId ? computers.find(c => c.id === seatId) : null;
          const machineLabel = comp ? comp.name : 'Chưa xếp máy';

          const levelText = item.violationsCount >= 4 
            ? 'Nghiêm trọng (>= 4 lần)' 
            : (item.violationsCount >= 2 ? 'Tái phạm (2-3 lần)' : 'Nhắc nhở (1 lần)');

          const commonErrors = Array.from(new Set(item.records.flatMap(r => r.categories))).join(', ');
          
          const historyDetails = item.records.map(r => {
            const d = r.date.split('-').reverse().join('/');
            const err = r.comment || r.violationTags.join(', ') || 'Chưa tập trung';
            return `[${d}]: ${err}`;
          }).join(' | ');

          excelRows.push({
            'STT': index + 1,
            'Họ và tên': item.student.name,
            'Lớp': item.student.classId,
            'Vị trí máy': machineLabel,
            'Số lượt vi phạm': item.violationsCount,
            'Mức độ': levelText,
            'Lỗi thường gặp': commonErrors,
            'Lịch sử chi tiết': historyDetails
          });
        });
      }

      // Tạo workbook và sheet
      const ws = XLSX.utils.json_to_sheet(excelRows, { skipHeader: true });

      // Thiết lập độ rộng cột
      ws['!cols'] = [
        { wch: 6 },  // STT
        { wch: 24 }, // Họ và tên
        { wch: 10 }, // Lớp
        { wch: 14 }, // Máy
        { wch: 16 }, // Số lượt
        { wch: 22 }, // Mức độ
        { wch: 30 }, // Lỗi thường gặp
        { wch: 50 }  // Lịch sử chi tiết
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ThongKeViPham');

      const fileName = `Thong_Ke_Vi_Pham_${scopeMode === 'current' ? `Lop_${selectedClass}` : 'Tat_Ca_Lop'}_${effectiveDateRange.start}_den_${effectiveDateRange.end}.xlsx`;
      XLSX.writeFile(wb, fileName);

      showToast('Đã xuất thành công tệp Excel thống kê vi phạm!', 'success');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      showToast('Có lỗi xảy ra khi tạo tệp Excel!', 'error');
    }
  };

  // In trực tiếp bảng báo cáo
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 🌟 THANH ĐIỀU HƯỚNG TRÊN CÙNG: QUAY LẠI & PHẠM VI KHỐI LỚP */}
      <div className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ebdcc4] hover:bg-[#dfccb0] text-[#3d2b17] font-black text-xs border border-[#cbb89d] transition shadow-2xs active:scale-95 cursor-pointer"
            title="Quay lại giao diện chấm điểm theo máy"
          >
            <ArrowLeft className="w-4 h-4 text-amber-900" />
            <span>Quay lại sổ chấm điểm</span>
          </button>

          <div className="h-6 w-px bg-[#cbb89d] hidden sm:block" />

          <div>
            <h2 className="text-sm sm:text-base font-black text-[#3d2b17] uppercase tracking-wide flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500 text-white shadow-2xs">📊</span>
              THỐNG KÊ & THEO DÕI NỀN NẾP HỌC SINH
            </h2>
            <p className="text-[11px] font-bold text-[#5c4327]">
              Phát hiện học sinh vi phạm, theo dõi sự tiến bộ và xuất báo cáo gửi Giáo viên chủ nhiệm
            </p>
          </div>
        </div>

        {/* BỘ LỌC PHẠM VI (TÔN TRỌNG BỘ LỌC KHỐI LỚP THANH NGANG) */}
        <div className="flex items-center gap-2 bg-[#f4e8d3] p-1 rounded-xl border border-[#cbb89d]">
          <button
            type="button"
            onClick={() => setScopeMode('current')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              scopeMode === 'current'
                ? 'bg-amber-600 text-white shadow-sm border border-amber-700'
                : 'text-[#42301c] hover:bg-white/60'
            }`}
            title="Sử dụng lớp đang chọn trên thanh ngang"
          >
            Lớp hiện tại: <span className="underline ml-1 font-black">{selectedClass}</span>
          </button>

          <button
            type="button"
            onClick={() => setScopeMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              scopeMode === 'all'
                ? 'bg-amber-600 text-white shadow-sm border border-amber-700'
                : 'text-[#42301c] hover:bg-white/60'
            }`}
            title="Tổng hợp tất cả các lớp Thầy/Cô phụ trách"
          >
            Tất cả các lớp ({classes.length})
          </button>
        </div>
      </div>

      {/* 🧭 THANH CHỌN MỐC THỜI GIAN NHANH (MỤC 3: THỐNG KÊ THEO THỜI GIAN) */}
      <div className="bg-[#fffbf0] border border-[#d6c4a8] rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black uppercase text-[#5c4327] mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-700" /> Thời gian:
          </span>

          <button
            type="button"
            onClick={() => setPeriodType('today')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
              periodType === 'today' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#ebdcc4] text-[#42301c] hover:bg-[#dfccb0]'
            }`}
          >
            Hôm nay
          </button>

          <button
            type="button"
            onClick={() => setPeriodType('this_week')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
              periodType === 'this_week' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#ebdcc4] text-[#42301c] hover:bg-[#dfccb0]'
            }`}
          >
            Tuần này
          </button>

          <button
            type="button"
            onClick={() => setPeriodType('this_month')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
              periodType === 'this_month' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#ebdcc4] text-[#42301c] hover:bg-[#dfccb0]'
            }`}
          >
            Tháng này
          </button>

          <button
            type="button"
            onClick={() => setPeriodType('semester_1')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
              periodType === 'semester_1' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#ebdcc4] text-[#42301c] hover:bg-[#dfccb0]'
            }`}
          >
            Học kỳ 1
          </button>

          <button
            type="button"
            onClick={() => setPeriodType('semester_2')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
              periodType === 'semester_2' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#ebdcc4] text-[#42301c] hover:bg-[#dfccb0]'
            }`}
          >
            Học kỳ 2
          </button>

          <button
            type="button"
            onClick={() => setPeriodType('school_year')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
              periodType === 'school_year' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#ebdcc4] text-[#42301c] hover:bg-[#dfccb0]'
            }`}
          >
            Cả năm học
          </button>

          <button
            type="button"
            onClick={() => setPeriodType('custom')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
              periodType === 'custom' ? 'bg-amber-500 text-white shadow-xs' : 'bg-[#ebdcc4] text-[#42301c] hover:bg-[#dfccb0]'
            }`}
          >
            Tùy chọn ngày
          </button>
        </div>

        {/* NẾU CHỌN TÙY CHỌN NGÀY: ÁP DỤNG CẤU TRÚC NGÀY THÁNG CỦA ỨNG DỤNG ĐÁNH GIÁ (VIETNAMESE DATE PICKER) */}
        {periodType === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 bg-[#f4e8d3] p-1 rounded-2xl border border-[#cbb89d] shadow-2xs">
            <VietnameseDatePicker
              label="Từ:"
              value={customStartDate}
              onChange={(newDate) => setCustomStartDate(newDate)}
              className="py-1 px-2.5 rounded-xl bg-white border-[#cbb89d]"
            />
            <VietnameseDatePicker
              label="Đến:"
              value={customEndDate}
              onChange={(newDate) => setCustomEndDate(newDate)}
              className="py-1 px-2.5 rounded-xl bg-white border-[#cbb89d]"
            />
          </div>
        )}

        <div className="text-[11px] font-black text-amber-900 bg-amber-100/90 px-3 py-1 rounded-xl border border-amber-300">
          Hiệu lực: {effectiveDateRange.start.split('-').reverse().join('/')} ➔ {effectiveDateRange.end.split('-').reverse().join('/')}
        </div>
      </div>

      {/* 📱 5 CARD NAVIGATION (THEO ĐÚNG CẤU TRÚC ẢNH MẪU ĐÍNH KÈM CỦA THẦY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* CARD 1: TỔNG QUAN VI PHẠM */}
        <div
          onClick={() => setActiveModule('overview')}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeModule === 'overview'
              ? 'bg-[#fffdf5] border-amber-500 shadow-md ring-2 ring-amber-200'
              : 'bg-white hover:bg-[#fffcf7] border-[#e2d5c3] hover:border-amber-400'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300">
              <LayoutGrid className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-black text-xs text-[#3d2b17] flex items-center gap-1">
                1. Tổng quan vi phạm
              </h3>
              <p className="text-[10px] text-[#705333] font-bold line-clamp-2 mt-0.5">
                Số học sinh vi phạm, số lượt vi phạm, học sinh tái phạm và lớp cần quan tâm.
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#f0e3d0] flex items-center justify-between text-[11px] font-black">
            <span className="text-amber-800">{statsData.violatingStudentsCount} HS vi phạm</span>
            <span className="text-[#a0825c]">{statsData.totalViolationsCount} lượt</span>
          </div>
        </div>

        {/* CARD 2: THỐNG KÊ THEO HỌC SINH */}
        <div
          onClick={() => setActiveModule('students')}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeModule === 'students'
              ? 'bg-[#f0f9ff] border-sky-500 shadow-md ring-2 ring-sky-200'
              : 'bg-white hover:bg-[#f0f9ff]/50 border-[#e2d5c3] hover:border-sky-400'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 border border-sky-300">
              <Users className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <h3 className="font-black text-xs text-[#1e3a5f] flex items-center gap-1">
                2. Thống kê theo học sinh
              </h3>
              <p className="text-[10px] text-[#4b6b94] font-bold line-clamp-2 mt-0.5">
                Xem lịch sử của từng em, loại vi phạm, thời điểm và mức độ lặp lại.
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#e0f2fe] flex items-center justify-between text-[11px] font-black">
            <span className="text-sky-800">{statsData.repeatOffendersCount} em tái phạm</span>
            <span className="text-emerald-700">{statsData.improvingStudentsCount} em tiến bộ</span>
          </div>
        </div>

        {/* CARD 3: THỐNG KÊ THEO THỜI GIAN */}
        <div
          onClick={() => setActiveModule('timeline')}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeModule === 'timeline'
              ? 'bg-[#f0fdf4] border-emerald-500 shadow-md ring-2 ring-emerald-200'
              : 'bg-white hover:bg-[#f0fdf4]/50 border-[#e2d5c3] hover:border-emerald-400'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-300">
              <Calendar className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-black text-xs text-[#14472d] flex items-center gap-1">
                3. Thống kê theo thời gian
              </h3>
              <p className="text-[10px] text-[#3d7557] font-bold line-clamp-2 mt-0.5">
                Tuần, tháng, quý, học kỳ, năm học hoặc khoảng ngày tùy chọn.
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#dcfce7] flex items-center justify-between text-[11px] font-black">
            <span className="text-emerald-800">{statsData.timelineStats.length} ngày có tiết</span>
            <span className="text-[#3d7557]">{periodType.toUpperCase()}</span>
          </div>
        </div>

        {/* CARD 4: PHÂN TÍCH HÀNH VI */}
        <div
          onClick={() => setActiveModule('behavior')}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeModule === 'behavior'
              ? 'bg-[#fff1f2] border-rose-500 shadow-md ring-2 ring-rose-200'
              : 'bg-white hover:bg-[#fff1f2]/50 border-[#e2d5c3] hover:border-rose-400'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 border border-rose-300">
              <TrendingUp className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <h3 className="font-black text-xs text-[#50131d] flex items-center gap-1">
                4. Phân tích hành vi
              </h3>
              <p className="text-[10px] text-[#853c48] font-bold line-clamp-2 mt-0.5">
                Xác định loại vi phạm phổ biến, xu hướng tăng giảm và trường hợp lặp lại.
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#ffe4e6] flex items-center justify-between text-[11px] font-black">
            <span className="text-rose-800">Top lỗi: Ồn ào</span>
            <span className="text-[#853c48]">6 nhóm hành vi</span>
          </div>
        </div>

        {/* CARD 5: BÁO CÁO GIÁO VIÊN CHỦ NHIỆM */}
        <div
          onClick={() => setActiveModule('reports')}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeModule === 'reports'
              ? 'bg-[#f8fafc] border-slate-600 shadow-md ring-2 ring-slate-300'
              : 'bg-white hover:bg-[#f8fafc] border-[#e2d5c3] hover:border-slate-500'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300">
              <FileText className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="font-black text-xs text-slate-900 flex items-center gap-1">
                5. Báo cáo GVCN
              </h3>
              <p className="text-[10px] text-slate-600 font-bold line-clamp-2 mt-0.5">
                Tạo nội dung ngắn gọn để gửi Zalo, hoặc xuất Excel/PDF để lưu hồ sơ.
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-black">
            <span className="text-slate-800">Zalo & Excel</span>
            <span className="text-emerald-700">Sẵn sàng xuất</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🌟 NỘI DUNG CHI TIẾT TỪNG MODULE TÙY CHỌN */}
      {/* ========================================================= */}

      {/* MODULE 1: TỔNG QUAN VI PHẠM */}
      {activeModule === 'overview' && (
        <div className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-2xl p-4 sm:p-5 shadow-xs space-y-5 animate-fadeIn">
          <div className="border-b border-[#e2d5c3] pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-[#3d2b17] flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-amber-700" />
                1. TỔNG QUAN NỀN NẾP & TÌNH HÌNH VI PHẠM
              </h3>
              <p className="text-xs text-[#5c4327] font-bold">
                Thống kê số lượng học sinh vi phạm, tần suất tái phạm và nhận định mức độ cần quan tâm
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
            </div>
          </div>

          {/* 4 THẺ CHỈ SỐ KPI CHÍNH */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1 */}
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs text-left">
              <span className="text-[10px] font-black text-[#85643a] uppercase tracking-wider block">
                Số học sinh vi phạm
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-900">
                  {statsData.violatingStudentsCount}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  / {statsData.totalStudents} em ({Math.round((statsData.violatingStudentsCount / (statsData.totalStudents || 1)) * 100)}%)
                </span>
              </div>
              <p className="text-[10px] text-amber-700 font-bold mt-1">
                {statsData.violatingStudentsCount === 0 ? '🎉 Lớp đạt chuẩn nền nếp' : '⚠️ Có học sinh cần theo dõi'}
              </p>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs text-left">
              <span className="text-[10px] font-black text-[#85643a] uppercase tracking-wider block">
                Tổng số lượt vi phạm
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-700">
                  {statsData.totalViolationsCount}
                </span>
                <span className="text-xs font-bold text-slate-500">lượt nhắc nhở</span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold mt-1">
                Ghi nhận trong {statsData.timelineStats.length} buổi học
              </p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs text-left">
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                Học sinh tái phạm (≥ 2 lần)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-rose-700">
                  {statsData.repeatOffendersCount}
                </span>
                <span className="text-xs font-bold text-rose-600">em</span>
              </div>
              <p className="text-[10px] text-rose-700 font-bold mt-1">
                {statsData.repeatOffendersCount > 0 ? `🚨 Có ${statsData.severeOffendersCount} em vi phạm >= 4 lần` : '✅ Không có trường hợp tái phạm'}
              </p>
            </div>

            {/* KPI 4 */}
            <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-2xs text-left">
              <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider block">
                Lớp cần quan tâm nhất
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-sky-800">
                  {statsData.mostViolatedClass || 'Không có'}
                </span>
              </div>
              <p className="text-[10px] text-sky-700 font-bold mt-1">
                {statsData.classStats[statsData.mostViolatedClass]?.violationsCount || 0} lượt vi phạm
              </p>
            </div>
          </div>

          {/* DẢI KHEN THƯỞNG SONG HÀNH (GIÁO DỤC TÍCH CỰC) */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">
                🌟
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950">Ghi nhận tích cực & Tuyên dương</h4>
                <p className="text-[11px] text-emerald-800 font-bold">
                  Toàn bộ lớp đã có <strong>{statsData.totalPraisesCount}</strong> lượt khen thưởng và <strong>{statsData.improvingStudentsCount}</strong> em có biểu hiện khắc phục tiến bộ!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('reports')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg transition active:scale-95 cursor-pointer"
            >
              Xem báo cáo gửi GVCN ➔
            </button>
          </div>

          {/* BẢNG TÓM TẮT NHANH CÁC HỌC SINH TÁI PHẠM */}
          <div className="bg-white rounded-xl border border-[#e2d5c3] p-4 text-left">
            <h4 className="text-xs font-black text-[#3d2b17] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>⚠️ Danh sách học sinh tái phạm cần chú ý đặc biệt</span>
              <span className="text-[11px] font-bold text-slate-500">
                Hiển thị {statsData.repeatOffendersCount} học sinh
              </span>
            </h4>

            {statsData.repeatOffendersCount === 0 ? (
              <div className="py-6 text-center text-xs font-bold text-emerald-700 bg-emerald-50/50 rounded-lg">
                🎉 Thật tuyệt vời! Không có học sinh nào tái phạm trong giai đoạn này.
              </div>
            ) : (
              <div className="divide-y divide-[#f2e7d7]">
                {statsData.violatingStudentsList.filter(s => s.violationsCount >= 2).map((item, idx) => (
                  <div key={item.student.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-black text-xs text-[#3d2b17]">{item.student.name}</span>
                        <span className="ml-2 text-[10px] font-bold text-slate-500">Lớp {item.student.classId}</span>
                        <div className="text-[10px] text-slate-600">
                          Lỗi chính: {Array.from(new Set(item.records.flatMap(r => r.categories))).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                        {item.violationsCount} lượt vi phạm
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentForDetail(item.student.id);
                          setActiveModule('students');
                        }}
                        className="text-xs font-black text-sky-700 hover:underline cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 2: THỐNG KÊ THEO HỌC SINH */}
      {activeModule === 'students' && (
        <div className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
          <div className="border-b border-[#e2d5c3] pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-[#1e3a5f] flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-700" />
                2. THỐNG KÊ LỊCH SỬ TỪNG HỌC SINH
              </h3>
              <p className="text-xs text-[#4b6b94] font-bold">
                Tra cứu chi tiết từng em, loại lỗi mắc phải, thời điểm vi phạm và theo dõi mức độ lặp lại
              </p>
            </div>

            {/* Ô TÌM KIẾM & BỘ LỌC MỨC ĐỘ */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchStudentTerm}
                  onChange={(e) => setSearchStudentTerm(e.target.value)}
                  placeholder="Tìm tên học sinh..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#cbb89d] rounded-xl font-bold text-[#3d2b17] outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <select
                value={severityFilter}
                onChange={(e: any) => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#cbb89d] rounded-xl font-black text-[#3d2b17] outline-none"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="once">Nhắc nhở (1 lần)</option>
                <option value="repeat">Tái phạm (2-3 lần)</option>
                <option value="severe">Nghiêm trọng (≥ 4 lần)</option>
              </select>
            </div>
          </div>

          {/* DANH SÁCH BẢNG HỌC SINH VI PHẠM */}
          <div className="bg-white rounded-xl border border-[#e2d5c3] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5ebd9] border-b border-[#e2d5c3] text-[#3d2b17] font-black uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">STT</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-2">Lớp</th>
                    <th className="py-2.5 px-3">Số lần vi phạm</th>
                    <th className="py-2.5 px-3">Mức độ cảnh báo</th>
                    <th className="py-2.5 px-3">Lỗi thường mắc</th>
                    <th className="py-2.5 px-3">Nhận xét mới nhất</th>
                    <th className="py-2.5 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2e7d7] font-bold text-[#3d2b17]">
                  {filteredViolatingStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-bold">
                        Không tìm thấy học sinh vi phạm nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredViolatingStudents.map((item, idx) => {
                      const latestRecord = item.records[item.records.length - 1];
                      const levelBadge = item.violationsCount >= 4 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                          🚨 Nghiêm trọng (≥ 4)
                        </span>
                      ) : (item.violationsCount >= 2 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          ⚠️ Tái phạm ({item.violationsCount})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
                          🟡 Nhắc nhở (1)
                        </span>
                      ));

                      return (
                        <tr key={item.student.id} className="hover:bg-amber-50/40 transition">
                          <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-black text-[#2e1d0c]">
                            {item.student.name}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600">{item.student.classId}</td>
                          <td className="py-2.5 px-3 font-black text-rose-700">
                            {item.violationsCount} lượt
                          </td>
                          <td className="py-2.5 px-3">{levelBadge}</td>
                          <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                            {Array.from(new Set(item.records.flatMap(r => r.categories))).slice(0, 2).join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={latestRecord?.comment || ''}>
                            {latestRecord?.comment || latestRecord?.violationTags.join(', ') || 'Chưa ghi chú'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForDetail(item.student.id)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-black transition cursor-pointer active:scale-95 shadow-2xs"
                            >
                              Xem lịch sử
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* POPUP / MODAL XEM CHI TIẾT LỊCH SỬ MỘT HỌC SINH */}
          {currentDetailStudent && (
            <div className="bg-white border-2 border-sky-400 rounded-xl p-4 shadow-md text-left space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <div>
                  <h4 className="text-sm font-black text-[#1e3a5f] flex items-center gap-2">
                    <span>👤</span> LỊCH SỬ NỀN NẾP: <strong className="text-rose-700">{currentDetailStudent.student.name}</strong> - Lớp {currentDetailStudent.student.classId}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Tổng số: {currentDetailStudent.violationsCount} lượt nhắc nhở vi phạm | {currentDetailStudent.praisesCount} lượt khen thưởng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForDetail(null)}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-black transition cursor-pointer"
                >
                  Đóng lại ✕
                </button>
              </div>

              {/* TIMELINE CÁC NGÀY VI PHẠM */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {currentDetailStudent.records.map((r, i) => (
                  <div key={i} className="p-2.5 bg-sky-50/60 rounded-xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-black text-[#1e3a5f]">
                        <span className="px-2 py-0.5 bg-sky-200 text-sky-900 rounded-md text-[10px]">
                          Ngày {r.date.split('-').reverse().join('/')}
                        </span>
                        <span>{r.categories.join(', ')}</span>
                      </div>
                      {r.comment && (
                        <p className="text-[11px] text-slate-700 italic mt-0.5">
                          Nhận xét: "{r.comment}"
                        </p>
                      )}
                    </div>
                    <div className="text-[10px] font-black text-rose-700">
                      {r.violationTags.join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 3: THỐNG KÊ THEO THỜI GIAN */}
      {activeModule === 'timeline' && (
        <div className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
          <div className="border-b border-[#e2d5c3] pb-3">
            <h3 className="text-base font-black text-[#14472d] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              3. THỐNG KÊ THEO TIẾN TRÌNH THỜI GIAN
            </h3>
            <p className="text-xs text-[#3d7557] font-bold">
              Theo dõi biến động vi phạm qua từng ngày, tuần hoặc tháng để phát hiện xu hướng nền nếp
            </p>
          </div>

          {/* DANH SÁCH CÁC NGÀY CÓ TIẾT DẠY */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {statsData.timelineStats.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs font-bold text-slate-500 bg-white rounded-xl border border-[#e2d5c3]">
                Không có dữ liệu chấm điểm nào trong khoảng thời gian đã chọn.
              </div>
            ) : (
              statsData.timelineStats.map((item) => {
                const dateDisplay = item.date.split('-').reverse().join('/');
                const isGoodDay = item.violations === 0;

                return (
                  <div
                    key={item.date}
                    className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition ${
                      isGoodDay
                        ? 'bg-emerald-50/80 border-emerald-300'
                        : 'bg-white border-amber-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-[#3d2b17] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-800" />
                        <span>Ngày {dateDisplay}</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-600 mt-1 flex items-center gap-3">
                        <span className="text-emerald-700">🌟 {item.praises} lượt khen</span>
                        <span className="text-rose-700">⚠️ {item.violations} lượt nhắc</span>
                      </div>
                    </div>
                    <div>
                      {isGoodDay ? (
                        <span className="px-2 py-1 rounded-lg bg-emerald-200 text-emerald-900 text-[10px] font-black">
                          Rất tốt
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-amber-200 text-amber-900 text-[10px] font-black">
                          Cần nhắc
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODULE 4: PHÂN TÍCH HÀNH VI */}
      {activeModule === 'behavior' && (
        <div className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-2xl p-4 sm:p-5 shadow-xs space-y-5 animate-fadeIn">
          <div className="border-b border-[#e2d5c3] pb-3">
            <h3 className="text-base font-black text-[#50131d] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-700" />
              4. PHÂN TÍCH HÀNH VI & XU HƯỚNG VI PHẠM
            </h3>
            <p className="text-xs text-[#853c48] font-bold">
              Phát hiện các loại lỗi học sinh thường mắc phải nhất để có giải pháp sư phạm phù hợp
            </p>
          </div>

          {/* DANH SÁCH THANH PHẦN TRĂM CÁC LOẠI LỖI */}
          <div className="bg-white p-4 rounded-xl border border-[#e2d5c3] space-y-3.5 text-left">
            <h4 className="text-xs font-black text-[#3d2b17] uppercase tracking-wider mb-2">
              Tỷ lệ các nhóm hành vi vi phạm ({statsData.totalViolationsCount} lượt)
            </h4>

            {Object.entries(statsData.categoryStats).map(([catName, count]) => {
              const numCount = Number(count) || 0;
              const percent = statsData.totalViolationsCount > 0 
                ? Math.round((numCount / statsData.totalViolationsCount) * 100) 
                : 0;

              return (
                <div key={catName} className="space-y-1">
                  <div className="flex justify-between text-xs font-black text-[#3d2b17]">
                    <span>{catName}</span>
                    <span className="text-rose-800">{count} lượt ({percent}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* GỢI Ý SƯ PHẠM ĐỀ XUẤT */}
          <div className="bg-[#fff9eb] border border-amber-300 rounded-xl p-4 text-left space-y-2">
            <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase">
              <span>💡</span> Gợi ý giải pháp khắc phục cho giáo viên
            </h4>
            <ul className="text-xs text-[#5c4327] font-bold space-y-1 list-disc list-inside">
              <li>Đối với lỗi <strong>Nói chuyện riêng / Mất trật tự</strong>: Cân nhắc đổi chỗ ngồi trên Sơ đồ máy tính hoặc giao nhiệm vụ trợ giảng cho các em.</li>
              <li>Đối với lỗi <strong>Nghịch máy / Chơi game ngoài</strong>: Sử dụng tính năng Khóa máy từ xa hoặc nhắc nhở trừ điểm thi đua và trừ giọt nước Vườn Tri Thức.</li>
              <li>Đối với học sinh có biểu hiện tiến bộ: Kịp thời cộng sao thưởng để khích lệ tinh thần các em.</li>
            </ul>
          </div>
        </div>
      )}

      {/* MODULE 5: BÁO CÁO GIÁO VIÊN CHỦ NHIỆM & XUẤT DỮ LIỆU */}
      {activeModule === 'reports' && (
        <div className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
          <div className="border-b border-[#e2d5c3] pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-800" />
                5. BÁO CÁO GIÁO VIÊN CHỦ NHIỆM & XUẤT DỮ LIỆU
              </h3>
              <p className="text-xs text-slate-600 font-bold">
                Tạo tin nhắn Zalo gửi GVCN Lớp {selectedClass} ({gvcnName}) hoặc xuất tệp Excel lưu trữ hồ sơ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                title="Tải bảng thống kê vi phạm ra file Excel .xlsx"
              >
                <Download className="w-4 h-4" /> Xuất Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-black text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                title="In hoặc lưu file PDF trực tiếp"
              >
                <Printer className="w-4 h-4" /> In / PDF
              </button>
            </div>
          </div>

          {/* CHỌN MẪU BÁO CÁO ZALO */}
          <div className="bg-white rounded-xl border border-[#e2d5c3] p-4 text-left space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#3d2b17]">Mẫu báo cáo Zalo:</span>
                <div className="flex items-center gap-1 bg-[#f5ebd9] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setZaloReportFormat('summary')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      zaloReportFormat === 'summary' ? 'bg-sky-600 text-white shadow-xs' : 'text-[#42301c]'
                    }`}
                  >
                    Tóm tắt gọn gàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setZaloReportFormat('detailed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      zaloReportFormat === 'detailed' ? 'bg-sky-600 text-white shadow-xs' : 'text-[#42301c]'
                    }`}
                  >
                    Chi tiết từng ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setZaloReportFormat('cooperation')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      zaloReportFormat === 'cooperation' ? 'bg-sky-600 text-white shadow-xs' : 'text-[#42301c]'
                    }`}
                  >
                    Chỉ học sinh cần phối hợp
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyZalo}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs ${
                    copiedZalo
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {copiedZalo ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedZalo ? 'Đã sao chép!' : 'Sao chép tin nhắn'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenZalo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                  title="Mở ứng dụng Zalo để dán và gửi cho GVCN"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Gửi qua Zalo</span>
                </button>
              </div>
            </div>

            {/* KHUNG XEM TRƯỚC VĂN BẢN ZALO */}
            <div className="relative">
              <textarea
                readOnly
                value={generatedZaloMessage}
                rows={11}
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 leading-relaxed outline-none select-all"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
