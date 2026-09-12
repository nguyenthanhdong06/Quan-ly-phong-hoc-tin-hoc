import React from 'react';
import { createPortal } from 'react-dom';
import { Student, EvaluationData, SeatingChart, Computer, EmulationDataState, AttendanceData, ClassItem } from '../types';
import { Star, Calendar, Search, X, Award, MessageSquare, Tag, ArrowLeft } from 'lucide-react';
import { triggerStarsConfetti } from '../utils/confetti';
import { playStarRewardSound, playWarningDeductSound } from '../utils/audioEffects';
import { CyberRobotCardFrameDecoration } from './CyberRobotCardFrameDecoration';
import { StudentCard3D } from './StudentCard3D';
import { VietnameseDatePicker } from './common/VietnameseDatePicker';
import { getStudentAvatar } from '../utils/studentAvatar';
import { matchStudentSearch } from '../utils/nameFormatter';

interface EvaluationTabProps {
  selectedClass: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  students: Student[];
  computers: Computer[];
  seatingChart: SeatingChart;
  evaluationData: EvaluationData;
  setEvaluationData: React.Dispatch<React.SetStateAction<EvaluationData>>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  systemDateText: string;
  setEmulationDataState: any;
  emulationDataState: EmulationDataState;
  attendanceData: AttendanceData;
  classes?: ClassItem[];
}

// Simple Avatar Component to render clean, flat circle avatars with student-specific background colors with gorgeous hover effects
const SimpleAvatar = ({ emoji, bg, size = 'w-16 h-16', className = '', avatarUrl }: { emoji: string; bg: string; size?: string; className?: string; avatarUrl?: string }) => {
  return (
    <div className={`rounded-full flex items-center justify-center border-2 shadow-inner select-none shrink-0 ${bg} ${size} ${className} avatar-sparkle-hover relative overflow-hidden`}>
      {/* Micro-sparkle floating star indicators on hover */}
      <div className="absolute -top-1 -right-1 text-amber-500 text-xs opacity-0 scale-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-12 pointer-events-none z-20">
        ✨
      </div>
      <div className="absolute -bottom-1 -left-1 text-amber-400 text-[10px] opacity-0 scale-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:-rotate-12 pointer-events-none z-20">
        ✨
      </div>

      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          className="w-full h-full object-cover rounded-full relative z-10 transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-[1.85em] leading-none select-none pointer-events-none relative z-10 transition-transform duration-300 group-hover:scale-115">
          {emoji}
        </span>
      )}
    </div>
  );
};

const formatDisplayName = (fullName: string) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 2) {
    return parts.slice(-2).join(' ');
  }
  return fullName;
};

const getStudentBadge = (stars: number) => {
  if (stars >= 20) {
    return {
      type: 'diamond',
      label: 'Kim Cương',
      ringClass: 'ring-[3.5px] ring-cyan-400 ring-offset-2 shadow-[0_0_15px_rgba(34,211,238,0.55)]',
      badgeClass: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-white border-cyan-200 text-[8px] font-black',
      emoji: '💎'
    };
  } else if (stars >= 10) {
    return {
      type: 'gold',
      label: 'Huy hiệu Vàng',
      ringClass: 'ring-[3.5px] ring-amber-400 ring-offset-2 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      badgeClass: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 border-amber-200 text-[8px] font-black',
      emoji: '🥇'
    };
  } else if (stars >= 5) {
    return {
      type: 'silver',
      label: 'Huy hiệu Bạc',
      ringClass: 'ring-[3px] ring-slate-300 ring-offset-1 shadow-xs',
      badgeClass: 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 border-slate-100 text-[8px] font-black',
      emoji: '🥈'
    };
  }
  return null;
};

interface EvaluationStudentCardItemProps {
  student: Student;
  classStudents: Student[];
  machineName: string;
  currentStars: number;
  isAbsent: boolean;
  onSelectStudent: (student: Student) => void;
}

const EvaluationStudentCardItem = React.memo(({
  student: s,
  classStudents,
  machineName,
  currentStars,
  isAbsent,
  onSelectStudent
}: EvaluationStudentCardItemProps) => {
  return (
    <div 
      onClick={() => onSelectStudent(s)}
      className="w-full flex justify-center cursor-pointer hover:scale-[1.025] active:scale-[0.98] transition-transform duration-200"
    >
      <StudentCard3D
        student={s}
        classStudents={classStudents}
        machineName={machineName}
        starCount={currentStars}
        size="sm"
        isAbsent={isAbsent}
      />
    </div>
  );
});

export default function EvaluationTab({
  selectedClass,
  selectedDate,
  setSelectedDate,
  students,
  computers,
  seatingChart,
  evaluationData,
  setEvaluationData,
  showToast,
  systemDateText,
  setEmulationDataState,
  emulationDataState,
  attendanceData,
  classes = []
}: EvaluationTabProps) {
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const commentInputRef = React.useRef<HTMLInputElement>(null);

  // Subview toggle state: 'evaluation' (default) | 'zalo' (Báo cáo Zalo/SMS 100% Inline View)
  const [subView, setSubView] = React.useState<'evaluation' | 'zalo'>('evaluation');
  const [reportTemplate, setReportTemplate] = React.useState<'zalo' | 'sms' | 'full'>('zalo');
  const [customMessageText, setCustomMessageText] = React.useState<string>('');

  // 💻 / 📱 Device Auto-Detection for Zalo PC vs Zalo Mobile
  const isMobileInitial = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [zaloTargetMode, setZaloTargetMode] = React.useState<'pc' | 'mobile'>(isMobileInitial ? 'mobile' : 'pc');

  // Find GVCN info for the selected class from classes array or localStorage 'school_classes'
  const currentClassObj = React.useMemo(() => {
    // 1. Search in passed prop `classes`
    let found = classes?.find(c => 
      c.id === selectedClass || 
      (c.name && c.name.trim().toLowerCase() === selectedClass.trim().toLowerCase()) ||
      (c.id && selectedClass && c.id.trim().toLowerCase() === selectedClass.trim().toLowerCase())
    );

    // 2. If not found or if teacher/phone is missing, search directly in localStorage 'school_classes'
    if (!found || (!found.teacher && !found.teacherPhone)) {
      try {
        const local = localStorage.getItem('school_classes');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            const localFound = parsed.find((c: any) => 
              c.id === selectedClass || 
              (c.name && c.name.trim().toLowerCase() === selectedClass.trim().toLowerCase()) ||
              (c.id && selectedClass && c.id.trim().toLowerCase() === selectedClass.trim().toLowerCase())
            );
            if (localFound) found = localFound;
          }
        }
      } catch (e) {
        console.error('Error loading school_classes fallback in EvaluationTab:', e);
      }
    }

    return found || null;
  }, [classes, selectedClass, subView]);

  const gvcnName = currentClassObj?.teacher?.trim() || 'Chưa cập nhật GVCN';
  const gvcnPhone = currentClassObj?.teacherPhone?.trim() || '';

  const handleSelectStudent = React.useCallback((student: Student) => {
    setSelectedStudent(student);
  }, []);

  // Auto focus into comment input when student modal opens & handle Escape key
  React.useEffect(() => {
    if (selectedStudent) {
      const timer = setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 60);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelectedStudent(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedStudent?.id]);

  // Reset search term & update Zalo report text if open when class changes
  React.useEffect(() => {
    setSearchTerm('');
    setSelectedStudent(null);
  }, [selectedClass]);

  const classStudents = students.filter(s => 
    s.classId === selectedClass || 
    (s.classId && selectedClass && s.classId.trim().toLowerCase() === selectedClass.trim().toLowerCase())
  );
  const currentDaysEvaluations = evaluationData[selectedDate]?.[selectedClass] || {};

  // Filter students by search term (Smart Vietnamese Search: NFC/NFD, unaccented, multi-tokens)
  const filteredStudents = React.useMemo(() => {
    if (!searchTerm.trim()) return classStudents;
    return classStudents.filter(s => matchStudentSearch(s, searchTerm, classStudents));
  }, [classStudents, searchTerm]);

  const availableTags = ['🙋Hăng hái', '💻Thực hành tốt', '🤝Giúp đỡ bạn', '🤔Chưa tập trung', '🤫Nói chuyện riêng'];

  // Handle single rating update & update emulation stars cumulative in parallel!
  const handleSetRating = (studentId: string, rating: number) => {
    // Get old rating to see the offset/difference for emulation stars
    const oldRating = currentDaysEvaluations[studentId]?.rating || 0;
    const diff = rating - oldRating;

    setEvaluationData(prev => {
      const dayData = { ...(prev[selectedDate] || {}) };
      const classData = { ...(dayData[selectedClass] || {}) };
      const currentEval = classData[studentId] || { rating: 0, comment: '', tags: [] };
      classData[studentId] = { ...currentEval, rating };
      dayData[selectedClass] = classData;
      return { ...prev, [selectedDate]: dayData };
    });

    // Award / adjust the cumulative stars in EmulationState!
    if (diff !== 0) {
      setEmulationDataState((prev: any) => {
        const studentEmulation = prev[studentId] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
        const newCumulative = Math.max(0, studentEmulation.cumulativeStars + diff);
        return {
          ...prev,
          [studentId]: {
            ...studentEmulation,
            cumulativeStars: newCumulative
          }
        };
      });
      showToast(`Đã thay đổi ${diff > 0 ? '+' : ''}${diff} ⭐ thi đua tích lũy cho học sinh!`);
    }
  };

  const handleSetComment = (studentId: string, comment: string) => {
    setEvaluationData(prev => {
      const dayData = { ...(prev[selectedDate] || {}) };
      const classData = { ...(dayData[selectedClass] || {}) };
      const currentEval = classData[studentId] || { rating: 0, comment: '', tags: [] };
      classData[studentId] = { ...currentEval, comment };
      dayData[selectedClass] = classData;
      return { ...prev, [selectedDate]: dayData };
    });
  };

  const handleToggleTag = (studentId: string, tag: string) => {
    setEvaluationData(prev => {
      const dayData = { ...(prev[selectedDate] || {}) };
      const classData = { ...(dayData[selectedClass] || {}) };
      const currentEval = classData[studentId] || { rating: 0, comment: '', tags: [] };
      
      let newTags = [...currentEval.tags];
      if (newTags.includes(tag)) {
        newTags = newTags.filter(t => t !== tag);
      } else {
        newTags.push(tag);
      }

      classData[studentId] = { ...currentEval, tags: newTags };
      dayData[selectedClass] = classData;
      return { ...prev, [selectedDate]: dayData };
    });
  };

  const handleAwardStars = (studentId: string, delta: number, label: string) => {
    // 1. Award / adjust the cumulative stars in EmulationState!
    setEmulationDataState((prev: any) => {
      const studentEmulation = prev[studentId] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
      const newCumulative = Math.max(0, studentEmulation.cumulativeStars + delta);
      return {
        ...prev,
        [studentId]: {
          ...studentEmulation,
          cumulativeStars: newCumulative
        }
      };
    });

    // 2. Also register the action tag inside evaluationData for the current day!
    setEvaluationData(prev => {
      const dayData = { ...(prev[selectedDate] || {}) };
      const classData = { ...(dayData[selectedClass] || {}) };
      const currentEval = classData[studentId] || { rating: 0, comment: '', tags: [] };
      
      const tagText = `${delta > 0 ? '🟢' : '🔴'} ${label} (${delta > 0 ? '+' : ''}${delta}⭐)`;
      let newTags = [...currentEval.tags];
      if (!newTags.includes(tagText)) {
        newTags.push(tagText);
      }
      
      classData[studentId] = { ...currentEval, tags: newTags };
      dayData[selectedClass] = classData;
      return { ...prev, [selectedDate]: dayData };
    });

    if (delta > 0) {
      triggerStarsConfetti();
      playStarRewardSound();
    } else {
      playWarningDeductSound();
    }

    showToast(`Đã ${delta > 0 ? 'khen thưởng (+)' : 'nhắc nhở (-)'}${Math.abs(delta)} ⭐: ${label}`);
  };

  const isReminderOrViolationTag = (tag: string) => {
    const lower = tag.toLowerCase();
    return (
      tag.includes('🔴') ||
      lower.includes('nói chuyện') ||
      lower.includes('chưa tập trung') ||
      lower.includes('muộn') ||
      lower.includes('sách') ||
      lower.includes('vở') ||
      lower.includes('vệ sinh') ||
      lower.includes('nhắc nhở') ||
      lower.includes('vi phạm') ||
      tag.includes('-')
    );
  };

  const isPraiseTag = (tag: string) => {
    const lower = tag.toLowerCase();
    return (
      tag.includes('🟢') ||
      lower.includes('hăng hái') ||
      lower.includes('thực hành tốt') ||
      lower.includes('giúp đỡ') ||
      lower.includes('phát biểu') ||
      lower.includes('trực nhật') ||
      lower.includes('khen thưởng') ||
      tag.includes('+')
    );
  };

  // 💬 Auto Generator for Zalo / SMS Homeroom Teacher Evaluation Report Text
  const generateReportText = React.useCallback((template: 'zalo' | 'sms' | 'full') => {
    const total = classStudents.length;
    const femaleTotal = classStudents.filter(s => s.gender === 'Nữ').length;
    const formattedDate = selectedDate.split('-').reverse().join('/');

    // Tìm các học sinh cần nhắc nhở / có vi phạm hoặc nhận xét của giáo viên
    const violatingStudents = classStudents.filter(s => {
      const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
      const comment = (evalObj.comment || '').trim();
      const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
      const reminderOrDeductTags = tags.filter(isReminderOrViolationTag);
      return Boolean(comment || reminderOrDeductTags.length > 0);
    });

    // Tìm các học sinh tiêu biểu / được khen thưởng
    const praisedStudents = classStudents.filter(s => {
      const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
      const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
      const praiseTags = tags.filter(isPraiseTag);
      return Boolean(praiseTags.length > 0 || evalObj.rating >= 4);
    });

    if (template === 'sms') {
      if (violatingStudents.length === 0) {
        return `[TIN HOC ${selectedClass} ${formattedDate}] Si so ${total} HS. Gio hoc tot, khong co HS vi pham.`;
      }
      const items = violatingStudents.map(s => {
        const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
        const comment = (evalObj.comment || '').trim();
        const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
        const reminderTags = tags.filter(isReminderOrViolationTag);
        const reason = comment || reminderTags.map(t => t.replace(/🔴|\(.*\)/g, '').trim()).filter(Boolean).join(', ');
        const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
        const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
        const machineLabel = seatObj ? `-${seatObj.name}` : '';
        return `${s.name}${machineLabel}${reason ? ` (${reason})` : ''}`;
      }).join('; ');
      const gvcnRecipient = gvcnName && gvcnName !== 'Chưa cập nhật GVCN' ? ` (${gvcnName})` : '';
      return `[TIN HOC ${selectedClass} ${formattedDate}] Co ${violatingStudents.length} HS can nhac nho: ${items}. Nho GVCN${gvcnRecipient} phoi hop!`.trim();
    }

    if (template === 'full') {
      let msg = `📋 BÁO CÁO CHI TIẾT TIẾT HỌC & ĐÁNH GIÁ NỀN NẾP\n`;
      msg += `Môn: Tin học | Lớp: ${selectedClass}\n`;
      msg += `📅 Ngày: ${formattedDate}\n`;
      msg += `------------------------------------\n`;
      msg += `📊 Sĩ số lớp: ${total} học sinh (Nữ: ${femaleTotal})\n`;
      msg += `🌟 Học sinh tích cực/khen thưởng: ${praisedStudents.length} em\n`;
      msg += `⚠️ Học sinh cần nhắc nhở/vi phạm: ${violatingStudents.length} em\n`;
      msg += `------------------------------------\n`;

      if (violatingStudents.length === 0) {
        msg += `🎉 Không có học sinh vi phạm trong tiết học.\n`;
      } else {
        msg += `⚠️ DANH SÁCH CHI TIẾT HỌC SINH CẦN NHẮC NHỞ:\n`;
        violatingStudents.forEach((s, idx) => {
          const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
          const comment = (evalObj.comment || '').trim();
          const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
          const reminderTags = tags.filter(isReminderOrViolationTag);
          const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
          const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
          const machineLabel = seatObj ? ` | ${seatObj.name}` : '';

          msg += `${idx + 1}. ${s.name} (MSHS: ${s.code}${machineLabel})\n`;
          if (comment) msg += `   - Nhận xét giáo viên: ${comment}\n`;
          if (reminderTags.length > 0) msg += `   - Thẻ nhắc nhở/vi phạm: ${reminderTags.join(', ')}\n`;
        });
      }

      if (praisedStudents.length > 0) {
        msg += `\n🌟 DANH SÁCH HỌC SINH ĐƯỢC KHEN THƯỞNG:\n`;
        praisedStudents.forEach((s, idx) => {
          const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
          const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
          const praiseTags = tags.filter(isPraiseTag);
          const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
          const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
          const machineLabel = seatObj ? ` | ${seatObj.name}` : '';

          msg += `${idx + 1}. ${s.name} (MSHS: ${s.code}${machineLabel})\n`;
          if (praiseTags.length > 0) msg += `   - Thưởng: ${praiseTags.join(', ')}\n`;
        });
      }

      msg += `\n------------------------------------\n`;
      const gvcnRecipient = gvcnName && gvcnName !== 'Chưa cập nhật GVCN' ? ` (${gvcnName})` : '';
      msg += `Kính gửi GVCN Lớp ${selectedClass}${gvcnRecipient} phối hợp đôn đốc các em học sinh. Trân trọng cảm ơn Thầy/Cô!`;
      return msg;
    }

    // Default Zalo Standard Template
    let msg = `📋 BÁO CÁO NỀN NẾP TIẾT TIN HỌC - LỚP ${selectedClass}\n`;
    msg += `📅 Ngày: ${formattedDate}\n`;
    msg += `------------------------------------\n`;
    const gvcnRecipient = gvcnName && gvcnName !== 'Chưa cập nhật GVCN' ? ` (${gvcnName})` : '';
    msg += `👨‍🏫 Kính gửi Giáo viên chủ nhiệm Lớp ${selectedClass}${gvcnRecipient},\n`;
    msg += `Em xin gửi Thầy/Cô tình hình học tập và nền nếp của lớp trong tiết Tin học hôm nay (${formattedDate}):\n\n`;
    msg += `📊 Sĩ số lớp: ${total} học sinh\n`;

    if (violatingStudents.length === 0) {
      msg += `🎉 TÌNH HÌNH NỀN NẾP RẤT TỐT: Lớp học chăm ngoan, nghiêm túc, không có học sinh vi phạm hay bị nhắc nhở trong giờ học.\n`;
    } else {
      msg += `⚠️ DANH SÁCH HỌC SINH CẦN NHẮC NHỞ / VI PHẠM NỀN NẾP (${violatingStudents.length} em):\n`;
      violatingStudents.forEach((s, idx) => {
        const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
        const comment = (evalObj.comment || '').trim();
        const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
        const reminderTags = tags.filter(isReminderOrViolationTag);
        const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
        const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
        const machineLabel = seatObj ? ` (${seatObj.name})` : '';

        msg += `${idx + 1}. ${s.name}${machineLabel}:\n`;
        if (comment) {
          msg += `   - Ý kiến/Nhận xét: ${comment}\n`;
        }
        if (reminderTags.length > 0) {
          msg += `   - Nhắc nhở: ${reminderTags.join(', ')}\n`;
        }
      });
      msg += `\nKính mong Thầy/Cô phối hợp nhắc nhở các em để tiết học sau đạt kết quả tốt hơn!\n`;
    }

    if (praisedStudents.length > 0) {
      msg += `\n🌟 HỌC SINH TÍCH CỰC / KHEN THƯỞNG TRONG TIẾT (${praisedStudents.length} em):\n`;
      praisedStudents.forEach((s, idx) => {
        const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
        const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
        const praiseTags = tags.filter(isPraiseTag);
        const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
        const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
        const machineLabel = seatObj ? ` (${seatObj.name})` : '';
        const tagText = praiseTags.length > 0 ? ` - ${praiseTags.join(', ')}` : '';
        msg += `${idx + 1}. ${s.name}${machineLabel}${tagText}\n`;
      });
    }

    msg += `\nEm trân trọng cảm ơn Thầy/Cô!`;
    return msg;
  }, [classStudents, currentDaysEvaluations, selectedClass, selectedDate, seatingChart, computers, gvcnName]);

  const handleSave = () => {
    showToast(`Đã lưu thành công ý kiến đánh giá học kỳ ngày ${selectedDate.split('-').reverse().join('/')} cho lớp ${selectedClass}!`);
  };

  return (
    <div className="space-y-6">

      {/* 🌟 DESKOS IMAC WARM BEIGE CARD HEADER STRIP */}
      <div className="border-2 border-[#cbb89d] rounded-3xl bg-[#fffbf0] overflow-hidden shadow-sm">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-black text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
              <span>⭐</span> SỔ ĐÁNH GIÁ & CHẤM ĐIỂM SAO LỚP: <span className="text-emerald-800 font-black bg-white/90 px-2.5 py-0.5 rounded-lg border border-[#cbb89d]">{selectedClass}</span>
            </h2>
            <p className="text-[11px] font-bold text-[#5c4327] flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5 text-amber-800" />
              Ngày chấm điểm: <strong>{systemDateText}</strong>
            </p>
          </div>

          {/* Date & Save controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <VietnameseDatePicker
              label="Ngày chấm:"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
            />

            <button
              type="button"
              onClick={() => {
                setReportTemplate('zalo');
                setCustomMessageText(generateReportText('zalo'));
                setSubView(prev => prev === 'zalo' ? 'evaluation' : 'zalo');
              }}
              className={`font-black text-xs py-2 px-3.5 rounded-xl border transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto active:scale-95 ${
                subView === 'zalo'
                  ? 'bg-sky-700 hover:bg-sky-800 text-white border-sky-600 ring-2 ring-sky-300'
                  : 'bg-sky-600 hover:bg-sky-700 text-white border-sky-500'
              }`}
              title="Tạo tin nhắn Zalo/SMS gửi tình hình học sinh vi phạm tới Giáo viên chủ nhiệm"
            >
              <span>💬</span> Báo Cáo Zalo
            </button>

            <button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl border border-amber-500 transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto active:scale-95"
            >
              💾 Khóa Sổ & Lưu
            </button>
          </div>
        </div>
      </div>

      {/* VIEW CHÍNH: DANH SÁCH HỌC SINH ĐÁNH GIÁ */}
      {subView === 'evaluation' && (
        <>
          {/* Student Search and quick info bar - Positioned wonderfully at the head of student list */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-left">
              <h3 className="font-extrabold text-slate-800 text-sm">Danh sách học sinh đánh giá ({filteredStudents.length}/{classStudents.length})</h3>
          <p className="text-[11px] text-slate-400">
            Tìm kiếm nhanh học sinh và tăng/giảm sao, click chọn vào thẻ học sinh để đánh giá chi tiết.
          </p>
        </div>
        <div className="relative w-full sm:w-80 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên hoặc MSHS..."
            autoComplete="off"
            spellCheck={false}
            className="w-full text-xs pl-9 pr-8 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none focus:bg-white transition-all font-semibold shadow-2xs"
          />
          {searchTerm && (
            <button 
              type="button"
              onClick={() => setSearchTerm('')}
              title="Xóa tìm kiếm"
              className="btn-raw btn-plain !absolute right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors focus:outline-none cursor-pointer"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of student evaluation cards */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5 justify-items-center">
          {filteredStudents.map((s) => {
            const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
            const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
            
            // Get emulation stats to display the exact cumulative stars
            const emulationObj = emulationDataState[s.id] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
            const cumulativeStars = emulationObj.cumulativeStars;
            const deducted = emulationObj.totalDeducted !== undefined 
              ? emulationObj.totalDeducted 
              : (emulationObj.exchangedStickers || 0) * 5;
            const currentStars = Math.max(0, cumulativeStars - deducted);

            // Check if student is marked as absent today
            const attendanceStatus = attendanceData[selectedDate]?.[selectedClass]?.[s.id];
            const isAbsent = attendanceStatus === 'excused' || attendanceStatus === 'unexcused';

            return (
              <EvaluationStudentCardItem
                key={s.id}
                student={s}
                classStudents={classStudents}
                machineName={seatObj ? seatObj.name : 'Chưa xếp máy'}
                currentStars={currentStars}
                isAbsent={isAbsent}
                onSelectStudent={handleSelectStudent}
              />
            );
          })}
        </div>
      ) : (
        <>
          {classStudents.length > 0 && (
            <div className="py-16 text-center text-slate-400 border border-dashed rounded-3xl font-medium bg-white">
              Không tìm thấy học sinh nào phù hợp với từ khóa "<strong>{searchTerm}</strong>".
            </div>
          )}

          {classStudents.length === 0 && (
            <div className="py-16 text-center text-slate-400 border border-dashed rounded-3xl font-medium bg-white">
              Lớp học "{selectedClass}" hiện chưa có bất kỳ học sinh nào trong danh sách. Hãy nạp danh sách học sinh trước khi chấm điểm.
            </div>
          )}
        </>
      )}

      {/* Edit Evaluation Modal - Portaled to document.body to ensure 100% full screen coverage */}
      {selectedStudent && typeof document !== 'undefined' && createPortal((() => {
        const s = selectedStudent;
        const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
        const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
        const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
        const emulationObj = emulationDataState[s.id] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
        const cumulativeStars = emulationObj.cumulativeStars;
        const deducted = emulationObj.totalDeducted !== undefined 
          ? emulationObj.totalDeducted 
          : (emulationObj.exchangedStickers || 0) * 5;
        const currentStars = Math.max(0, cumulativeStars - deducted);
        const avatar = getStudentAvatar(s.id, students);
        const badge = getStudentBadge(currentStars);

        // Check if student is marked as absent today
        const modalAttendanceStatus = attendanceData[selectedDate]?.[selectedClass]?.[s.id];
        const isModalStudentAbsent = modalAttendanceStatus === 'excused' || modalAttendanceStatus === 'unexcused';

        return (
          <div 
            className="absolute inset-0 bg-slate-900/65 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedStudent(null);
              }
            }}
          >
            <div 
              className="bg-[#faf5ec] w-full max-w-lg rounded-3xl shadow-2xl border-2 border-[#d6c4a8] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clean Top Header Bar */}
              <div className="bg-gradient-to-r from-[#dfccb0] via-[#e8d9c2] to-[#dfccb0] px-5 py-3 border-b border-[#c8b598] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-700 fill-amber-500" />
                  <span className="font-extrabold text-sm text-[#42301c]">Đánh Giá & Tặng Sao Học Sinh</span>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="text-[#6e5334] hover:text-[#382613] bg-white/60 hover:bg-white p-1.5 rounded-full transition-all cursor-pointer shadow-xs focus:outline-none"
                  title="Đóng cửa sổ (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Inner Content Body */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Student Identification Info */}
                <div className="flex items-center gap-4 bg-white/80 p-3.5 rounded-2xl border border-[#d6c4a8] shadow-xs">
                  <div className="relative shrink-0">
                    <SimpleAvatar 
                      emoji={avatar.emoji} 
                      bg={avatar.bg}
                      size="w-14 h-14" 
                      className={`${badge ? badge.ringClass : ''}`}
                      avatarUrl={s.avatarUrl}
                    />
                    {badge && (
                      <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10 px-1.5 py-0.5 rounded-full text-[7.5px] font-black border uppercase tracking-wider whitespace-nowrap shadow-md flex items-center gap-0.5 ${badge.badgeClass}`}>
                        <span>{badge.emoji}</span>
                        <span>{badge.label}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-800 text-base sm:text-lg leading-tight truncate">{s.name}</h3>
                      {isModalStudentAbsent && (
                        <span 
                          className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider cursor-help"
                          title={modalAttendanceStatus === 'excused' ? 'Học sinh Vắng học có phép ngày hôm nay' : 'Học sinh Vắng học không phép ngày hôm nay'}
                        >
                          ⚠️ Vắng ({modalAttendanceStatus === 'excused' ? 'Có phép' : 'Không phép'})
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black text-amber-700 mt-0.5 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                      <span>Đang có: {currentStars} Sao</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold mt-1 flex gap-2 items-center">
                      <span>Lớp: {selectedClass}</span>
                      <span>•</span>
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-black border border-indigo-100">
                        {seatObj ? `💻 ${seatObj.name}` : 'Chưa xếp máy'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Inputs */}
                <div className="space-y-5 text-left">
                  {/* KHEN THƯỜNG (TẶNG SAO) - Prominent Bold White Text */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-emerald-600">➕</span> KHEN THƯỜNG (TẶNG SAO)
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: "Phát biểu", value: 5 },
                        { label: "Làm bài đủ", value: 3 },
                        { label: "Giúp đỡ bạn", value: 2 },
                        { label: "Trực nhật", value: 10 }
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleAwardStars(s.id, opt.value, opt.label)}
                          className="btn-eval btn-eval-reward"
                          title={`${opt.label} (+${opt.value} sao)`}
                        >
                          <span className="btn-eval-text">
                            {opt.label}
                          </span>
                          <span className="btn-eval-badge">
                            +{opt.value} ⭐️
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NHẮC NHỞ (TRỪ SAO) - Prominent Bold White Text */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-rose-600">➖</span> NHẮC NHỞ (TRỪ SAO)
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: "Nói chuyện", value: -2 },
                        { label: "Quên sách,vở,.vv", value: -5 },
                        { label: "Đi học muộn", value: -3 },
                        { label: "Vệ sinh chưa tốt", value: -1 }
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleAwardStars(s.id, opt.value, opt.label)}
                          className="btn-eval btn-eval-deduct"
                          title={`${opt.label} (${opt.value} sao)`}
                        >
                          <span className="btn-eval-text">
                            {opt.label}
                          </span>
                          <span className="btn-eval-badge">
                            {opt.value} ⭐️
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teacher Comment */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-[#5c4326] uppercase tracking-wider block">
                      Ý kiến / Nhận xét của giáo viên:
                    </span>
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={evalObj.comment}
                      onChange={(e) => handleSetComment(s.id, e.target.value)}
                      placeholder="Ghi nhận xét chi tiết (VD: Làm bài tốt, phát biểu)..."
                      className="w-full text-xs px-3.5 py-2.5 border border-[#d6c4a8] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white font-extrabold text-[#42301c]"
                    />
                  </div>
                </div>

                {/* Close/Done button */}
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-full bg-[#5c4326] hover:bg-[#42301c] text-white font-black text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center shadow-md active:scale-95"
                >
                  Xong & Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })(), (typeof document !== 'undefined' && (document.getElementById('deskos-window-body') || document.getElementById('deskos-active-window'))) || document.body)}
        </>
      )}

      {/* ====================================================================
          BÁO CÁO ZALO/SMS CHO GVCN (INLINE VIEW 100%)
          ==================================================================== */}
      {subView === 'zalo' && (
        <div className="space-y-6 animate-fadeIn w-full">
          {/* Top navigation bar with Quay về button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fffbf0] border border-[#cbb89d] p-4 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setSubView('evaluation')}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-xl border border-slate-700 transition shadow-2xs cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-200" />
              <span>Quay Về Sổ Đánh Giá</span>
            </button>

            <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
              <span>💬</span> BÁO CÁO ZALO/SMS CHO GVCN LỚP <span className="text-sky-700 font-mono bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">{selectedClass}</span>
            </h3>

            <span className="text-xs font-bold text-slate-500">
              Ngày chấm: <strong className="text-slate-800 font-mono">{systemDateText}</strong>
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
                rows={10}
                value={customMessageText}
                onChange={(e) => setCustomMessageText(e.target.value)}
                placeholder="Nội dung báo cáo gửi Giáo viên chủ nhiệm..."
                className="w-full p-4 text-xs font-mono font-bold rounded-2xl border border-[#cbb89d] bg-white focus:outline-none focus:border-sky-600 shadow-inner leading-relaxed text-slate-800"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#cbb89d]">
              <button
                type="button"
                onClick={() => setSubView('evaluation')}
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

