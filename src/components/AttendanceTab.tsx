import React from 'react';
import { Student, AttendanceData, ClassItem, AttendanceStatus } from '../types';
import { Check, ClipboardCheck, Calendar, UserCheck, AlertTriangle, AlertCircle, Search, X, Sparkles, CheckCircle, Save, BarChart3, ArrowLeft, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VietnameseDatePicker } from './common/VietnameseDatePicker';
import { AttendanceStatsView } from './attendance/AttendanceStatsView';

interface AttendanceTabProps {
  selectedClass: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  students: Student[];
  attendanceData: AttendanceData;
  setAttendanceData: React.Dispatch<React.SetStateAction<AttendanceData>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  systemDateText: string;
  classes?: ClassItem[];
  setClasses?: React.Dispatch<React.SetStateAction<ClassItem[]>>;
}

interface AttendanceStudentRowProps {
  student: Student;
  displayIndex: number;
  currentStatus: AttendanceStatus;
  isJustUpdated: boolean;
  onSetState: (studentId: string, status: AttendanceStatus) => void;
}

const AttendanceStudentRow = React.memo(({
  student: s,
  displayIndex,
  currentStatus,
  isJustUpdated,
  onSetState
}: AttendanceStudentRowProps) => {
  // Dynamic row styling based on status
  let rowBg = 'bg-white hover:bg-emerald-50/20';
  let borderLeftAccent = 'border-l-4 border-l-emerald-500';

  if (currentStatus === 'late') {
    rowBg = 'bg-amber-50/70 hover:bg-amber-100/60';
    borderLeftAccent = 'border-l-4 border-l-amber-500';
  } else if (currentStatus === 'excused') {
    rowBg = 'bg-sky-50/70 hover:bg-sky-100/60';
    borderLeftAccent = 'border-l-4 border-l-sky-500';
  } else if (currentStatus === 'unexcused') {
    rowBg = 'bg-rose-100/80 hover:bg-rose-200/70';
    borderLeftAccent = 'border-l-4 border-l-red-600';
  }

  return (
    <tr className={`${rowBg} ${borderLeftAccent} transition-all duration-150 relative`}>
      <td className="py-3.5 px-4 font-bold text-slate-400">{displayIndex}</td>
      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{s.code}</td>
      <td className="py-3.5 px-4 text-left">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <strong className="font-black text-slate-900 text-sm">{s.name}</strong>
            {isJustUpdated && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 shadow-xs flex items-center gap-1"
              >
                ✓ Đã cập nhật
              </motion.span>
            )}
          </div>

          <div>
            {currentStatus === 'present' && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300/80 inline-flex items-center gap-1 shadow-2xs">
                ✓ Đi học
              </span>
            )}
            {currentStatus === 'late' && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 border border-amber-400 inline-flex items-center gap-1 shadow-2xs">
                ⏰ Đi trễ
              </span>
            )}
            {currentStatus === 'excused' && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-200 text-sky-950 border border-sky-400 inline-flex items-center gap-1 shadow-2xs">
                🔵 Vắng có phép (P)
              </span>
            )}
            {currentStatus === 'unexcused' && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white border border-red-700 inline-flex items-center gap-1 shadow-2xs">
                🔴 VẮNG KHÔNG PHÉP (KP)
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${s.gender === 'Nữ' ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
          {s.gender === 'Nữ' ? 'Nữ 👧🏻' : 'Nam 👦🏻'}
        </span>
      </td>
      <td className="py-3.5 px-4 text-center">
        <div className="inline-flex rounded-xl bg-slate-200/80 p-1 w-full border border-slate-300/80 shadow-inner gap-1 select-none">
          <button
            type="button"
            onClick={() => onSetState(s.id, 'present')}
            className={`flex-1 text-center py-2 px-2 rounded-lg text-xs tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
              currentStatus === 'present' 
                ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400 border border-emerald-500 scale-[1.03]' 
                : 'bg-slate-100/90 text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 font-bold'
            }`}
          >
            <Check className={`w-3.5 h-3.5 stroke-[3] ${currentStatus === 'present' ? 'text-white' : 'text-slate-400'}`} />
            <span>Đi Học</span>
          </button>

          <button
            type="button"
            onClick={() => onSetState(s.id, 'late')}
            className={`flex-1 text-center py-2 px-2 rounded-lg text-xs tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
              currentStatus === 'late' 
                ? 'bg-amber-500 text-white font-black shadow-md shadow-amber-500/30 ring-2 ring-amber-300 border border-amber-400 scale-[1.03]' 
                : 'bg-slate-100/90 text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 font-bold'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 stroke-[2.5] ${currentStatus === 'late' ? 'text-white' : 'text-slate-400'}`} />
            <span>Đi Trễ</span>
          </button>

          <button
            type="button"
            onClick={() => onSetState(s.id, 'excused')}
            className={`flex-1 text-center py-2 px-2 rounded-lg text-xs tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
              currentStatus === 'excused' 
                ? 'bg-sky-600 text-white font-black shadow-md shadow-sky-600/30 ring-2 ring-sky-300 border border-sky-500 scale-[1.03]' 
                : 'bg-slate-100/90 text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 font-bold'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 stroke-[2.5] ${currentStatus === 'excused' ? 'text-white' : 'text-slate-400'}`} />
            <span>Có Phép</span>
          </button>

          <button
            type="button"
            onClick={() => onSetState(s.id, 'unexcused')}
            className={`flex-1 text-center py-2 px-2 rounded-lg text-xs tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
              currentStatus === 'unexcused' 
                ? 'bg-red-600 text-white font-black shadow-md shadow-red-600/30 ring-2 ring-red-400 border border-red-500 scale-[1.03]' 
                : 'bg-slate-100/90 text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 font-bold'
            }`}
          >
            <X className={`w-3.5 h-3.5 stroke-[3] ${currentStatus === 'unexcused' ? 'text-white' : 'text-slate-400'}`} />
            <span>Không Phép</span>
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function AttendanceTab({
  selectedClass,
  selectedDate,
  setSelectedDate,
  students,
  attendanceData,
  setAttendanceData,
  showToast,
  systemDateText,
  classes,
  setClasses
}: AttendanceTabProps) {
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [justUpdatedId, setJustUpdatedId] = React.useState<string | null>(null);

  // Subview toggle state: 'attendance' (default) | 'stats' (Bảng thống kê) | 'zalo' (Báo cáo Zalo/SMS 100% Inline View)
  const [subView, setSubView] = React.useState<'attendance' | 'stats' | 'zalo'>('attendance');

  // 💬 Zalo / SMS Fast Report States
  const [reportTemplate, setReportTemplate] = React.useState<'zalo' | 'sms' | 'full'>('zalo');
  const [customMessageText, setCustomMessageText] = React.useState('');

  // 📱 Homeroom Teacher (GVCN) Info linked directly from Class Management (classes prop)
  const currentClassObj = classes?.find(c => c.id === selectedClass);
  const gvcnName = currentClassObj?.teacher || 'Chưa cập nhật';
  const gvcnPhone = currentClassObj?.teacherPhone || '';

  // 💻 / 📱 Device Auto-Detection for Zalo PC vs Zalo Mobile
  const isMobileInitial = typeof window !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
  const [zaloTargetMode, setZaloTargetMode] = React.useState<'pc' | 'mobile'>(isMobileInitial ? 'mobile' : 'pc');

  // Reset search term when class changes for perfect UX
  React.useEffect(() => {
    setSearchTerm('');
  }, [selectedClass]);

  // Reset current page when selection or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, searchTerm, pageSize]);

  const classStudents = students.filter(s => s.classId === selectedClass);
  const currentDaysAttendance = attendanceData[selectedDate]?.[selectedClass] || {};

  // Filter students based on search term (case-insensitive)
  const filteredStudents = React.useMemo(() => {
    return classStudents.filter(s => {
      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return true;
      return (
        s.name.toLowerCase().includes(searchLower) ||
        s.code.toLowerCase().includes(searchLower)
      );
    });
  }, [classStudents, searchTerm]);

  const totalStudents = filteredStudents.length;
  const totalPages = Math.ceil(totalStudents / pageSize) || 1;

  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Metrics (Memoized for 0ms Instant Calculation & Zero Jitter)
  const { 
    presentCount, 
    presentFemaleCount,
    lateCount,
    lateFemaleCount,
    excusedCount, 
    excusedFemaleCount,
    unexcusedCount, 
    unexcusedFemaleCount,
    totalAbsentCount, 
    totalFemaleCount,
    totalCount,
    attendanceRate 
  } = React.useMemo(() => {
    let present = 0;
    let presentFemale = 0;
    let late = 0;
    let lateFemale = 0;
    let excused = 0;
    let excusedFemale = 0;
    let unexcused = 0;
    let unexcusedFemale = 0;
    let totalFemale = 0;

    classStudents.forEach(s => {
      const isFemale = s.gender === 'Nữ' || s.gender?.toLowerCase() === 'nữ';
      if (isFemale) totalFemale++;

      const status = currentDaysAttendance[s.id] || 'present';
      if (status === 'present') {
        present++;
        if (isFemale) presentFemale++;
      } else if (status === 'late') {
        late++;
        if (isFemale) lateFemale++;
      } else if (status === 'excused') {
        excused++;
        if (isFemale) excusedFemale++;
      } else if (status === 'unexcused') {
        unexcused++;
        if (isFemale) unexcusedFemale++;
      }
    });

    const total = classStudents.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;
    return {
      presentCount: present,
      presentFemaleCount: presentFemale,
      lateCount: late,
      lateFemaleCount: lateFemale,
      excusedCount: excused,
      excusedFemaleCount: excusedFemale,
      unexcusedCount: unexcused,
      unexcusedFemaleCount: unexcusedFemale,
      totalAbsentCount: excused + unexcused,
      totalFemaleCount: totalFemale,
      totalCount: total,
      attendanceRate: rate
    };
  }, [classStudents, currentDaysAttendance]);

  // 💬 Auto Generator for Zalo / SMS Homeroom Teacher Attendance Report Text
  const generateReportText = React.useCallback((template: 'zalo' | 'sms' | 'full') => {
    const total = classStudents.length;
    const femaleTotal = classStudents.filter(s => s.gender === 'Nữ').length;

    const presentStudents = classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') === 'present');
    const lateStudents = classStudents.filter(s => currentDaysAttendance[s.id] === 'late');
    const excusedStudents = classStudents.filter(s => currentDaysAttendance[s.id] === 'excused');
    const unexcusedStudents = classStudents.filter(s => currentDaysAttendance[s.id] === 'unexcused');
    const absentStudents = [...excusedStudents, ...unexcusedStudents];

    const formattedDate = selectedDate.split('-').reverse().join('/');

    if (template === 'sms') {
      if (absentStudents.length === 0 && lateStudents.length === 0) {
        return `[DIEM DANH ${selectedClass} ${formattedDate}] Si so ${total} HS. Lop di du 100%!`;
      }
      const absentNames = absentStudents.map(s => `${s.name} (${currentDaysAttendance[s.id] === 'excused' ? 'P' : 'KP'})`).join(', ');
      const lateNames = lateStudents.map(s => `${s.name} (Tre)`).join(', ');
      let sms = `[DIEM DANH ${selectedClass} ${formattedDate}] Si so ${total}. `;
      if (absentStudents.length > 0) sms += `Vang ${absentStudents.length}: ${absentNames}. `;
      if (lateStudents.length > 0) sms += `Tre ${lateStudents.length}: ${lateNames}.`;
      return sms.trim();
    }

    if (template === 'full') {
      let msg = `📋 BÁO CÁO CHI TIẾT ĐIỂM DANH LỚP ${selectedClass}\n`;
      msg += `📅 Ngày dạy: ${formattedDate} | Môn: Tin học\n`;
      msg += `------------------------------------\n`;
      msg += `📊 Sĩ số: ${total} học sinh (Nữ: ${femaleTotal})\n`;
      msg += `✅ Có mặt đúng giờ: ${presentStudents.length}/${total} HS\n`;
      if (lateStudents.length > 0) msg += `⏰ Đi trễ: ${lateStudents.length} HS\n`;
      msg += `🟡 Vắng có phép (P): ${excusedStudents.length} HS\n`;
      msg += `🔴 Vắng không phép (KP): ${unexcusedStudents.length} HS\n`;
      msg += `------------------------------------\n`;
      if (absentStudents.length === 0 && lateStudents.length === 0) {
        msg += `🎉 LỚP HỌC ĐI ĐỦ 100%! Không có học sinh vắng hoặc trễ.`;
      } else {
        if (lateStudents.length > 0) {
          msg += `⏰ HỌC SINH ĐI TRỄ:\n`;
          lateStudents.forEach((s, idx) => {
            msg += `${idx + 1}. ${s.name} (MSHS: ${s.code})\n`;
          });
          msg += `\n`;
        }
        if (absentStudents.length > 0) {
          msg += `📝 DANH SÁCH HỌC SINH VẮNG:\n`;
          absentStudents.forEach((s, idx) => {
            const st = currentDaysAttendance[s.id];
            const statusText = st === 'excused' ? 'Có Phép (P)' : 'KHÔNG PHÉP (KP)';
            msg += `${idx + 1}. ${s.name} (MSHS: ${s.code}) - [${statusText}]\n`;
          });
        }
      }
      return msg;
    }

    // Default Zalo Standard Template
    let msg = `📋 BÁO CÁO ĐIỂM DANH LỚP ${selectedClass} - NGÀY ${formattedDate}\n`;
    msg += `------------------------------------\n`;
    msg += `👨‍🏫 Kính gửi Giáo viên chủ nhiệm Lớp ${selectedClass},\n`;
    msg += `Em xin báo cáo điểm danh tiết Tin học hôm nay (${formattedDate}):\n\n`;
    msg += `📊 Sĩ số: ${total} học sinh\n`;
    msg += `✅ Hiện diện: ${presentStudents.length + lateStudents.length}/${total} HS\n`;
    if (lateStudents.length > 0) {
      msg += `⏰ Đi trễ: ${lateStudents.length} em (${lateStudents.map(s => s.name).join(', ')})\n`;
    }
    msg += `❌ Số lượng vắng: ${absentStudents.length} học sinh\n\n`;

    if (absentStudents.length === 0) {
      msg += `🎉 LỚP ĐI HỌC ĐỦ 100%! Không có học sinh vắng mặt.\n`;
    } else {
      msg += `📌 Danh sách học sinh vắng mặt:\n`;
      absentStudents.forEach((s, idx) => {
        const st = currentDaysAttendance[s.id];
        const tag = st === 'excused' ? 'Có phép (P)' : 'KHÔNG PHÉP (KP)';
        msg += `${idx + 1}. ${s.name} - [${tag}]\n`;
      });
    }

    msg += `\nKính báo Thầy/Cô nắm thông tin!`;
    return msg;
  }, [classStudents, currentDaysAttendance, selectedClass, selectedDate]);

  // Set single student status with 0ms instant local mutation
  const handleSetState = React.useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => {
      const dayData = { ...(prev[selectedDate] || {}) };
      const classData = { ...(dayData[selectedClass] || {}) };
      classData[studentId] = status;
      dayData[selectedClass] = classData;
      return { ...prev, [selectedDate]: dayData };
    });
  }, [selectedClass, selectedDate, setAttendanceData]);

  // Set all present
  const handleSetAllPresent = () => {
    const allPresent: { [stId: string]: 'present' } = {};
    classStudents.forEach(s => {
      allPresent[s.id] = 'present';
    });

    setAttendanceData(prev => {
      const dayData = { ...(prev[selectedDate] || {}) };
      dayData[selectedClass] = allPresent;
      return { ...prev, [selectedDate]: dayData };
    });
    showToast(`Đã đồng loạt đánh dấu Có mặt tất cả học sinh lớp ${selectedClass}`);
  };

  const handleSave = () => {
    // Save is implicit due to useEffect syncing to localStorage, but we show a beautiful feedback
    showToast(`Đã lưu trữ thành công thông tin điểm danh ngày ${selectedDate.split('-').reverse().join('/')} của lớp ${selectedClass}!`);
  };

  return (
    <div className="space-y-6">

      {/* 🌟 DESKOS IMAC WARM BEIGE CARD HEADER STRIP */}
      <div className="border-2 border-[#cbb89d] rounded-3xl bg-[#fffbf0] overflow-hidden shadow-sm">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-black text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
              <span>📋</span> SỔ ĐIỂM DANH LỚP: <span className="text-emerald-800 font-black bg-white/90 px-2.5 py-0.5 rounded-lg border border-[#cbb89d]">{selectedClass}</span>
            </h2>
            <p className="text-[11px] font-bold text-[#5c4327] flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5 text-amber-800" />
              Thời gian: <strong>{systemDateText}</strong>
            </p>
          </div>

          {/* Date Selector & Save block */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <VietnameseDatePicker
              label="Chọn ngày dạy:"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
            />

            <button
              onClick={handleSetAllPresent}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl border border-emerald-500 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Đánh dấu tất cả học sinh trong lớp là Có Mặt"
            >
              <CheckCircle className="w-4 h-4 text-emerald-100" />
              Tất Cả Có Mặt
            </button>

            <button
              onClick={() => setSubView(prev => prev === 'stats' ? 'attendance' : 'stats')}
              className={`font-extrabold text-xs py-2 px-3.5 rounded-xl border transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                subView === 'stats'
                  ? 'bg-amber-700 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
              }`}
              title="Mở Bảng Thống Kê Báo Cáo gửi Giáo Viên Chủ Nhiệm"
            >
              <BarChart3 className="w-4 h-4 text-amber-100" />
              <span>Bảng Thống Kê</span>
            </button>

            <button
              onClick={() => {
                setReportTemplate('zalo');
                setCustomMessageText(generateReportText('zalo'));
                setSubView(prev => prev === 'zalo' ? 'attendance' : 'zalo');
              }}
              className={`font-extrabold text-xs py-2 px-3.5 rounded-xl border transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                subView === 'zalo'
                  ? 'bg-sky-700 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                  : 'bg-sky-600 hover:bg-sky-700 text-white border-sky-500'
              }`}
              title="Tạo tin nhắn Zalo/SMS tự động tổng hợp danh sách vắng gửi Giáo viên chủ nhiệm"
            >
              <span>💬</span> Báo Cáo Zalo/SMS
            </button>

            <button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl border border-amber-500 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-100" />
              Lưu Sổ
            </button>
          </div>
        </div>
      </div>

      {/* Statistics board with smooth instant 0ms numbers (Tổng/Nữ) - Chỉ hiển thị ở Sổ điểm danh / Zalo */}
      {subView !== 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sĩ số lớp cần học</span>
            <strong className="text-2xl font-black text-slate-800 mt-1 block">
              {totalCount}/{totalFemaleCount}
            </strong>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-left relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Hiện diện (Học tốt)</span>
            <strong className="text-2xl font-black text-emerald-700 mt-1 block transition-all duration-200">
              {presentCount + lateCount}/{presentFemaleCount + lateFemaleCount} <span className="text-xs font-bold text-emerald-600">({attendanceRate}%)</span>
            </strong>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-left relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">Xin phép nghỉ (P)</span>
            <strong className="text-2xl font-black text-amber-700 mt-1 block transition-all duration-200">
              {excusedCount}/{excusedFemaleCount}
            </strong>
          </div>

          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-left relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-700 block">Vắng không phép (KP)</span>
            <strong className="text-2xl font-black text-red-700 mt-1 block transition-all duration-200">
              {unexcusedCount}/{unexcusedFemaleCount}
            </strong>
          </div>
        </div>
      )}

      {/* ====================================================================
          1. CHẾ ĐỘ 1: HỆ THỐNG PHÂN TÍCH & BẢNG THỐNG KÊ CHUYÊN CẦN TOÀN DIỆN
          ==================================================================== */}
      {subView === 'stats' && (
        <AttendanceStatsView
          selectedClass={selectedClass}
          classes={classes}
          students={students}
          attendanceData={attendanceData}
          onBackToAttendance={() => setSubView('attendance')}
          showToast={showToast}
        />
      )}

      {/* ====================================================================
          2. CHẾ ĐỘ 2: SỔ ĐIỂM DANH CHÍNH (SƠ ĐỒ & DANH SÁCH LỚP)
          ==================================================================== */}
      {subView === 'attendance' && (
        <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
        
        {/* Search student controls & Header Strip */}
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-left">
            <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
              <span>📋</span>
              BẢNG ĐIỂM DANH HỌC SINH
            </h3>
            <p className="text-[11px] font-bold text-[#5c4327]">
              Chọn trạng thái đi học (Hiện diện / Vắng phép / Không phép) cho từng học sinh bên dưới.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên hoặc MSHS..."
              className="w-full text-xs pl-9 pr-8 py-2 border border-[#cbb89d] bg-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-[#fffbf0] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#e8d7c0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-4 w-16 whitespace-nowrap">STT</th>
                <th className="py-3.5 px-4 w-24 font-mono whitespace-nowrap">ID MSHS</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Họ và Tên Học sinh</th>
                <th className="py-3.5 px-4 w-28 whitespace-nowrap">Giới tính</th>
                <th className="py-3.5 px-4 text-center w-96 whitespace-nowrap">Trạng thái điểm danh (Vui lòng chọn)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.map((s, index) => {
                  const currentStatus = currentDaysAttendance[s.id] || 'present';
                  const originalIndex = classStudents.findIndex(cs => cs.id === s.id);
                  const displayIndex = originalIndex !== -1 ? originalIndex + 1 : index + 1;
                  const isJustUpdated = justUpdatedId === s.id;

                  return (
                    <AttendanceStudentRow
                      key={s.id}
                      student={s}
                      displayIndex={displayIndex}
                      currentStatus={currentStatus}
                      isJustUpdated={isJustUpdated}
                      onSetState={handleSetState}
                    />
                  );
                })}
              
              {classStudents.length > 0 && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold text-xs">
                    Không tìm thấy học sinh nào phù hợp với từ khóa "<strong>{searchTerm}</strong>".
                  </td>
                </tr>
              )}

              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-450 font-semibold text-xs">
                    Không có bất kỳ dữ liệu học sinh nào trong lớp "{selectedClass}" để điểm danh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls styled matching screenshot */}
        {filteredStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span>Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
                <span>học sinh / trang</span>
              </div>

              {/* Items range status */}
              <div>
                <span>Hiển thị </span>
                <span className="font-bold text-slate-700">
                  {Math.min((currentPage - 1) * pageSize + 1, totalStudents)} - {Math.min(currentPage * pageSize, totalStudents)}
                </span>
                <span> trên </span>
                <strong className="text-amber-600 font-extrabold">{totalStudents}</strong>
                <span> học sinh</span>
              </div>
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition flex items-center gap-1 ${
                  currentPage === 1
                    ? 'bg-slate-50 text-slate-350 border-slate-150 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 cursor-pointer'
                }`}
              >
                ‹ Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-full border text-xs font-black transition flex items-center justify-center ${
                      isActive
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 cursor-pointer'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition flex items-center gap-1 ${
                  currentPage === totalPages
                    ? 'bg-slate-50 text-slate-350 border-slate-150 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 cursor-pointer'
                }`}
              >
                Sau ›
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ====================================================================
          3. CHẾ ĐỘ 3: BÁO CÁO ZALO/SMS CHO GVCN (INLINE VIEW 100%)
          ==================================================================== */}
      {subView === 'zalo' && (
        <div className="space-y-6 animate-fadeIn w-full">
          {/* Top navigation bar with Quay về button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fffbf0] border border-[#cbb89d] p-4 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setSubView('attendance')}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-xl border border-slate-700 transition shadow-2xs cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-200" />
              <span>Quay Về Sổ Điểm Danh</span>
            </button>

            <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
              <span>💬</span> BÁO CÁO ZALO/SMS CHO GVCN LỚP <span className="text-sky-700 font-mono bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">{selectedClass}</span>
            </h3>

            <span className="text-xs font-bold text-slate-500">
              Ngày: <strong className="text-slate-800 font-mono">{systemDateText}</strong>
            </span>
          </div>

          {/* Inline View 100% Full Width Container */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-[#cbb89d] space-y-5 text-left w-full">
            
            {/* Report Template Selector Strip */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setReportTemplate('zalo');
                  setCustomMessageText(generateReportText('zalo'));
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  reportTemplate === 'zalo' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-white/60'
                }`}
              >
                💬 Mẫu Zalo Chuẩn
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportTemplate('sms');
                  setCustomMessageText(generateReportText('sms'));
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  reportTemplate === 'sms' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-white/60'
                }`}
              >
                📱 Mẫu SMS Ngắn
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportTemplate('full');
                  setCustomMessageText(generateReportText('full'));
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  reportTemplate === 'full' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700 hover:bg-white/60'
                }`}
              >
                📑 Mẫu Chi Tiết Đầy Đủ
              </button>
            </div>

            {/* GVCN Info Configuration Box (Read-Only Linked from Class Management) */}
            <div className="bg-sky-50/90 p-4 rounded-2xl border border-sky-200 text-left space-y-3">
              
              {/* Device Auto-Detect Switcher Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-2.5">
                <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                  ⚙️ KÍCH HOẠT KẾT NỐI ZALO LỚP <span className="text-sky-700 bg-white px-2 py-0.5 rounded-lg border border-sky-300">{selectedClass}</span>:
                </span>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-sky-300 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-500 px-1">Chế độ:</span>
                  <button
                    type="button"
                    onClick={() => setZaloTargetMode('pc')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                      zaloTargetMode === 'pc' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    💻 Zalo PC (Máy tính)
                  </button>
                  <button
                    type="button"
                    onClick={() => setZaloTargetMode('mobile')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                      zaloTargetMode === 'mobile' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    📱 Zalo Mobile (Điện thoại)
                  </button>
                </div>
              </div>

              {/* GVCN Name & Phone Display Grid (Read-Only linked from Class Management) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-sky-200 shadow-2xs text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-sky-950 whitespace-nowrap flex items-center gap-1">
                    👤 GVCN Lớp {selectedClass}:
                  </span>
                  <span className="text-xs font-black text-slate-800 bg-sky-50/90 px-3 py-1 rounded-xl border border-sky-200">
                    {gvcnName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-sky-950 whitespace-nowrap flex items-center gap-1">
                    📱 SĐT Zalo:
                  </span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${
                    gvcnPhone 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-mono font-black' 
                      : 'bg-rose-50 text-rose-700 border-rose-200 font-normal italic'
                  }`}>
                    {gvcnPhone || 'Chưa cập nhật bên Quản Lý Lớp'}
                  </span>
                </div>
              </div>

              {/* Linked Info Status Helper */}
              {(() => {
                const clean = gvcnPhone.trim().replace(/\D/g, '');
                if (!gvcnPhone) {
                  return (
                    <p className="text-[11px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <span>⚠️</span> Lớp <strong>{selectedClass}</strong> chưa được nhập SĐT Zalo GVCN. Thầy/Cô bổ sung SĐT tại mục <strong>"Quản Lý Lớp Học"</strong>.
                    </p>
                  );
                }
                if (clean.length !== 10) {
                  return (
                    <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      <span>⚠️</span> SĐT Zalo GVCN đang có <strong>{clean.length}</strong> chữ số (Cần đúng 10 số). Vui lòng kiểm tra lại bên "Quản Lý Lớp Học"!
                    </p>
                  );
                }
                return (
                  <p className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <span>✅</span> Thông tin móc nối trực tiếp từ Quản Lý Lớp Học. Sẵn sàng kết nối Zalo với GVCN: <strong>{gvcnName}</strong> ({gvcnPhone}).
                  </p>
                );
              })()}
            </div>

            {/* Live Preview Textarea */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-black text-slate-700">Xem trước & Chỉnh sửa nội dung tin nhắn gửi GVCN:</label>
              <textarea
                rows={9}
                value={customMessageText}
                onChange={(e) => setCustomMessageText(e.target.value)}
                className="w-full p-4 text-xs font-mono font-bold rounded-2xl border border-[#cbb89d] bg-white focus:outline-none focus:border-sky-600 shadow-inner leading-relaxed text-slate-800"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#cbb89d]">
              <button
                type="button"
                onClick={() => setSubView('attendance')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Quay Về</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customMessageText);
                    showToast('Đã sao chép tin nhắn thành công! Thầy/Cô có thể dán (Ctrl+V) vào Zalo ngay.', 'success');
                  }}
                  className="px-4.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span>📋</span> Sao Chép Nội Dung
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = gvcnPhone.trim().replace(/\D/g, '');
                    if (gvcnPhone.trim() && cleanPhone.length !== 10) {
                      showToast(`⚠️ SĐT Zalo GVCN chưa đúng 10 chữ số (Hiện tại đang có ${cleanPhone.length} số). Vui lòng gõ đủ 10 số!`, 'error');
                      return;
                    }

                    navigator.clipboard.writeText(customMessageText);

                    if (zaloTargetMode === 'pc') {
                      let zaloNativeAppUri = 'zalo://';
                      if (cleanPhone) {
                        zaloNativeAppUri = `zalo://conversation?phone=${cleanPhone}`;
                      }

                      const nativeLink = document.createElement('a');
                      nativeLink.href = zaloNativeAppUri;
                      document.body.appendChild(nativeLink);
                      nativeLink.click();
                      document.body.removeChild(nativeLink);

                      setTimeout(() => {
                        window.location.href = zaloNativeAppUri;
                      }, 150);

                      showToast(`Đã sao chép tin nhắn & Mở Zalo PC App ${cleanPhone ? `chat với SĐT ${cleanPhone}` : ''}!`, 'success');
                    } else {
                      let mobileUri = 'https://zalo.me/';
                      if (cleanPhone) {
                        mobileUri = `https://zalo.me/${cleanPhone}`;
                      }

                      window.open(mobileUri, '_blank');
                      showToast(`Đã sao chép tin nhắn & Mở Zalo Mobile App ${cleanPhone ? `với SĐT ${cleanPhone}` : ''}!`, 'success');
                    }
                  }}
                  className="px-4.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 border border-sky-500"
                  title={zaloTargetMode === 'pc' ? 'Kích hoạt ứng dụng Zalo PC trên máy tính' : 'Mở ứng dụng Zalo Mobile trên điện thoại'}
                >
                  <span>💬</span> {zaloTargetMode === 'pc' ? 'Mở Zalo PC App' : 'Mở App Zalo Mobile'}
                </button>

                <a
                  href={
                    gvcnPhone.trim().replace(/\D/g, '') 
                      ? `sms:${gvcnPhone.trim().replace(/\D/g, '')}?body=${encodeURIComponent(customMessageText)}` 
                      : `sms:?body=${encodeURIComponent(customMessageText)}`
                  }
                  onClick={() => {
                    navigator.clipboard.writeText(customMessageText);
                    showToast('Đã sao chép & Kích hoạt ứng dụng Tin nhắn SMS!', 'success');
                  }}
                  className="px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 no-underline"
                >
                  <span>📱</span> Gửi SMS
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
