import React from 'react';
import { createPortal } from 'react-dom';
import { Student, EvaluationData, SeatingChart, Computer, EmulationDataState, AttendanceData, ClassItem, GardenStudentData, WaterLog, Member } from '../types';
import { Star, Calendar, Search, X, Award, MessageSquare, Tag, ArrowLeft, Save, RefreshCw, Mail, Send, Check } from 'lucide-react';
import { triggerStarsConfetti } from '../utils/confetti';
import { playStarRewardSound, playWarningDeductSound } from '../utils/audioEffects';
import { CyberRobotCardFrameDecoration } from './CyberRobotCardFrameDecoration';
import { StudentCard3D } from './StudentCard3D';
import { VietnameseDatePicker } from './common/VietnameseDatePicker';
import { getStudentAvatar } from '../utils/studentAvatar';
import { matchStudentSearch } from '../utils/nameFormatter';
import { saveDayPartitionedEvaluation } from '../utils/evaluationPartition';
import { saveWorkspaceGardenData } from '../utils/gardenPartition';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState } from '../supabaseClient';

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
  workspaceId?: string;
  gardenData?: { [studentId: string]: GardenStudentData };
  setGardenData?: React.Dispatch<React.SetStateAction<{ [studentId: string]: GardenStudentData }>>;
  currentUser?: any;
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

// 🌟 Component ô nhận xét độc lập với Local State & Debounce chống xung đột bộ gõ tiếng Việt (Unikey/EVKey)
interface TeacherCommentInputProps {
  studentId: string;
  initialComment: string;
  onSaveComment: (studentId: string, comment: string) => void;
}

const TeacherCommentInput: React.FC<TeacherCommentInputProps> = ({
  studentId,
  initialComment,
  onSaveComment
}) => {
  const [comment, setComment] = React.useState<string>(initialComment || '');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const latestCommentRef = React.useRef<string>(initialComment || '');
  const debounceTimerRef = React.useRef<any>(null);

  latestCommentRef.current = comment;

  // Cập nhật khi mở modal hoặc chọn học sinh khác
  React.useEffect(() => {
    setComment(initialComment || '');
    latestCommentRef.current = initialComment || '';
  }, [studentId]);

  // Tự động focus mượt mà khi modal mở và đưa con trỏ về cuối chữ
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [studentId]);

  // Lưu lại giá trị khi unmount (đóng modal)
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSaveComment(studentId, latestCommentRef.current);
    };
  }, [studentId, onSaveComment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setComment(val); // Cập nhật local state ngay tức thì -> 0ms lag, Unikey/EVKey gõ tiếng Việt hoàn hảo không bị nhảy chữ

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onSaveComment(studentId, val);
    }, 350);
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSaveComment(studentId, latestCommentRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSaveComment(studentId, latestCommentRef.current);
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={comment}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="Ghi nhận xét chi tiết (VD: Làm bài tốt, phát biểu)..."
      className="w-full text-xs px-3.5 py-2.5 border border-[#d6c4a8] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white font-extrabold text-[#42301c] transition-colors"
      autoComplete="off"
      spellCheck={false}
    />
  );
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
  classes = [],
  workspaceId,
  gardenData,
  setGardenData,
  currentUser
}: EvaluationTabProps) {
  
  const activeUser = currentUser || safeGetLocalStorage<Member | null>('school_current_user', null);
  const isHomeroomTeacher = Boolean(
    activeUser?.role && (
      activeUser.role.trim().toLowerCase().includes('chủ nhiệm') ||
      activeUser.role.trim().toLowerCase().includes('chu nhiem')
    )
  );

  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Subview toggle state: 'evaluation' (default) | 'zalo' (Báo cáo Zalo/SMS 100% Inline View)
  const [subView, setSubView] = React.useState<'evaluation' | 'zalo'>('evaluation');
  const [reportTemplate, setReportTemplate] = React.useState<'zalo' | 'sms' | 'full' | 'private'>('zalo');
  const [customMessageText, setCustomMessageText] = React.useState<string>('');
  const [selectedPrivateStudentId, setSelectedPrivateStudentId] = React.useState<string | null>(null);

  // 🛡️ Tùy chọn chỉ gửi danh sách khen thưởng lên nhóm chung (bảo vệ quyền riêng tư của các em bị nhắc nhở)
  const [onlyPraiseInGroup, setOnlyPraiseInGroup] = React.useState<boolean>(() => {
    return safeGetLocalStorage<boolean>('zalo_only_praise_in_group', false);
  });

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

  // Handle Escape key to close modal
  React.useEffect(() => {
    if (selectedStudent) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelectedStudent(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedStudent]);

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
    setHasUnsavedChanges(true);
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

  const handleSetComment = React.useCallback((studentId: string, comment: string) => {
    setEvaluationData(prev => {
      const dayData = { ...(prev[selectedDate] || {}) };
      const classData = { ...(dayData[selectedClass] || {}) };
      const currentEval = classData[studentId] || { rating: 0, comment: '', tags: [] };
      if (currentEval.comment === comment) return prev;
      setHasUnsavedChanges(true);
      classData[studentId] = { ...currentEval, comment };
      dayData[selectedClass] = classData;
      return { ...prev, [selectedDate]: dayData };
    });
  }, [selectedDate, selectedClass]);

  const handleToggleTag = (studentId: string, tag: string) => {
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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

    // 3. Tự động đồng bộ giọt nước vào Vườn tri thức trong cùng Workspace của giáo viên!
    if (setGardenData) {
      setGardenData(prevGarden => {
        const studentGarden = prevGarden?.[studentId] || {
          studentId,
          seed: '🌸 Cây Hoa Đào',
          water: 0,
          badges: [],
          logs: []
        };
        const newWater = Math.max(0, studentGarden.water + delta);
        const newLog: WaterLog = {
          id: `log-${Date.now()}`,
          date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          amount: delta,
          reason: `${delta > 0 ? '⭐ Khen thưởng' : '⚠️ Nhắc nhở'}: ${label}`
        };
        const updatedStudent = {
          ...studentGarden,
          water: newWater,
          logs: [newLog, ...studentGarden.logs]
        };
        const updatedAll = {
          ...prevGarden,
          [studentId]: updatedStudent
        };
        if (workspaceId) {
          saveWorkspaceGardenData(updatedAll, workspaceId);
        }
        return updatedAll;
      });
    }

    if (delta > 0) {
      triggerStarsConfetti();
      playStarRewardSound();
    } else {
      playWarningDeductSound();
    }

    showToast(`Đã ${delta > 0 ? 'khen thưởng (+)' : 'nhắc nhở (-)'}${Math.abs(delta)} ⭐ ${delta > 0 ? '(thưởng kèm +' : '(trừ kèm '}${delta} 💧 Vườn tri thức): ${label}`);
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

  // Danh sách các học sinh cần nhắc nhở / có vi phạm hoặc nhận xét trong ngày
  const violatingStudents = React.useMemo(() => {
    return classStudents.filter(s => {
      const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
      const comment = (evalObj.comment || '').trim();
      const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
      const reminderOrDeductTags = tags.filter(isReminderOrViolationTag);
      return Boolean(comment || reminderOrDeductTags.length > 0);
    });
  }, [classStudents, currentDaysEvaluations]);

  // ✉️ Hàm tạo nội dung tin nhắn gửi riêng cho phụ huynh từng học sinh bị nhắc nhở
  const generateIndividualParentMessage = React.useCallback((student: Student) => {
    const formattedDate = selectedDate.split('-').reverse().join('/');
    const evalObj = currentDaysEvaluations[student.id] || { rating: 0, comment: '', tags: [] };
    const comment = (evalObj.comment || '').trim();
    const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
    const reminderTags = tags.filter(isReminderOrViolationTag).map(t => t.replace(/🔴|\(.*\)/g, '').trim()).filter(Boolean);
    const teacherSignName = activeUser?.name?.trim() || gvcnName || 'Giáo viên';

    let msg = `Thầy/Cô xin phép gửi thông tin tình hình học tập và nền nếp của con ${student.name} trong tiết học hôm nay (${formattedDate}):\n`;
    
    if (reminderTags.length > 0) {
      msg += `- Vấn đề cần rèn luyện thêm: ${reminderTags.join(', ')}\n`;
    }
    if (comment) {
      msg += `- Lời dặn của giáo viên: ${comment}\n`;
    }
    if (reminderTags.length === 0 && !comment) {
      msg += `- Con cần chú ý rèn luyện thêm sự tập trung và tuân thủ nền nếp trong giờ học.\n`;
    }

    msg += `\nKính mong Quý Phụ huynh cùng gia đình đồng hành, nhắc nhở và động viên để con tập trung và tiến bộ hơn trong các tiết học sau.\n\n`;
    msg += `Xin trân trọng cảm ơn Quý Phụ huynh!\n`;
    if (isHomeroomTeacher) {
      msg += `GVCN Lớp ${selectedClass}: ${teacherSignName}`;
    } else {
      msg += `Giáo viên bộ môn Tin học: ${teacherSignName}`;
    }
    return msg;
  }, [selectedDate, currentDaysEvaluations, selectedClass, activeUser, gvcnName, isHomeroomTeacher]);

  // 💬 Auto Generator for Zalo / SMS Homeroom Teacher Evaluation Report Text
  const generateReportText = React.useCallback((
    template: 'zalo' | 'sms' | 'full' | 'private', 
    hideReminders?: boolean,
    targetStudentId?: string | 'ALL'
  ) => {
    // ✉️ Trường hợp chọn Mẫu Nhắn riêng Phụ huynh
    if (template === 'private') {
      if (violatingStudents.length === 0) {
        return `🎉 Tiết học hôm nay cả lớp thực hiện nền nếp rất tốt, không có học sinh nào bị nhắc nhở để gửi riêng cho phụ huynh.`;
      }
      if (targetStudentId && targetStudentId !== 'ALL') {
        const targetStudent = violatingStudents.find(s => s.id === targetStudentId) || violatingStudents[0];
        return generateIndividualParentMessage(targetStudent);
      }
      if (violatingStudents.length === 1) {
        return generateIndividualParentMessage(violatingStudents[0]);
      }
      return violatingStudents.map((s, idx) => {
        return `[Tin nhắn ${idx + 1} - Gửi PH em ${s.name}]:\n${generateIndividualParentMessage(s)}`;
      }).join('\n\n------------------------------------\n\n');
    }

    const isOnlyPraise = hideReminders !== undefined ? hideReminders : onlyPraiseInGroup;
    const total = classStudents.length;
    const femaleTotal = classStudents.filter(s => s.gender === 'Nữ').length;
    const formattedDate = selectedDate.split('-').reverse().join('/');

    // Tìm các học sinh tiêu biểu / được khen thưởng
    const praisedStudents = classStudents.filter(s => {
      const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
      const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
      const praiseTags = tags.filter(isPraiseTag);
      return Boolean(praiseTags.length > 0 || evalObj.rating >= 4);
    });

    // 🌸 TRƯỜNG HỢP 1: TÀI KHOẢN GIÁO VIÊN CHỦ NHIỆM (GỬI THÔNG BÁO CHO PHỤ HUYNH)
    if (isHomeroomTeacher) {
      const teacherSignName = activeUser?.name?.trim() || gvcnName;

      // 📱 1.1. Mẫu Nhắn Tin Ngắn gọn cho GVCN gửi Phụ Huynh
      if (template === 'sms') {
        let sms = `[LỚP ${selectedClass} - ${formattedDate}] GVCN thông báo tình hình học tập:\n`;
        if (praisedStudents.length > 0) {
          const pNames = praisedStudents.slice(0, 5).map(s => s.name).join(', ');
          sms += `- Khen ngợi ${praisedStudents.length} em tiêu biểu: ${pNames}${praisedStudents.length > 5 ? '...' : ''}.\n`;
        } else {
          sms += `- Hôm nay cả lớp hoàn thành tốt các nhiệm vụ học tập.\n`;
        }

        if (violatingStudents.length > 0) {
          if (isOnlyPraise) {
            sms += `- Các bạn cần lưu ý thêm về nền nếp, GVCN xin phép trao đổi riêng với từng phụ huynh để cùng đôn đốc con.\n`;
          } else {
            const vItems = violatingStudents.slice(0, 5).map(s => {
              const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
              const comment = (evalObj.comment || '').trim();
              const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
              const reminderTags = tags.filter(isReminderOrViolationTag);
              const reason = comment || reminderTags.map(t => t.replace(/🔴|\(.*\)/g, '').trim()).filter(Boolean).join(', ');
              return `${s.name}${reason ? ` (${reason})` : ''}`;
            }).join('; ');
            sms += `- Nhờ PH phối hợp nhắc nhở ${violatingStudents.length} em: ${vItems}${violatingStudents.length > 5 ? '...' : ''}.\n`;
          }
        } else {
          sms += `- Hôm nay cả lớp chăm ngoan, học tập tốt, không có em nào vi phạm.\n`;
        }
        sms += `Trân trọng cảm ơn Quý Phụ huynh! (GVCN: ${teacherSignName})`;
        return sms.trim();
      }

      // 📑 1.2. Mẫu Đánh Giá Chi Tiết Đầy Đủ gửi Phụ Huynh
      if (template === 'full') {
        let msg = `📋 BẢNG TỔNG HỢP HỌC TẬP & RÈN LUYỆN CHI TIẾT - LỚP ${selectedClass}\n`;
        msg += `📅 Ngày: ${formattedDate}\n`;
        msg += `👨‍🏫 Giáo viên chủ nhiệm: ${teacherSignName}\n`;
        msg += `------------------------------------\n`;
        msg += `Kính gửi: Quý Phụ huynh Lớp ${selectedClass},\n`;
        msg += `Dưới đây là bảng tổng hợp chi tiết tình hình học tập và nền nếp của các con trong ngày hôm nay:\n\n`;
        msg += `📊 Sĩ số lớp: ${total} học sinh (Nữ: ${femaleTotal})\n`;
        msg += `🌟 Số học sinh tích cực, tiêu biểu: ${praisedStudents.length} em\n`;
        if (!isOnlyPraise) {
          msg += `⚠️ Số học sinh cần phối hợp đôn đốc: ${violatingStudents.length} em\n`;
        }
        msg += `------------------------------------\n`;

        if (praisedStudents.length > 0) {
          msg += `\n🌟 DANH SÁCH CÁC CON ĐƯỢC KHEN THƯỞNG / TÍCH CỰC:\n`;
          praisedStudents.forEach((s, idx) => {
            const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
            const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
            const praiseTags = tags.filter(isPraiseTag);
            const comment = (evalObj.comment || '').trim();
            msg += `${idx + 1}. ${s.name}\n`;
            if (praiseTags.length > 0) msg += `   - Thành tích: ${praiseTags.join(', ')}\n`;
            if (comment) msg += `   - Nhận xét GV: ${comment}\n`;
          });
        }

        if (violatingStudents.length === 0) {
          msg += `\n🎉 Cả lớp hôm nay thực hiện nền nếp rất tốt, không có bạn nào vi phạm!\n`;
        } else if (isOnlyPraise) {
          msg += `\n💬 VỀ NỀN NẾP & HỌC TẬP CẦN LƯU Ý:\n`;
          msg += `Để đảm bảo tính riêng tư của các con trên nhóm chung của lớp, đối với một số bạn cần rèn luyện thêm về nền nếp và sự tập trung, GVCN xin phép sẽ chủ động liên hệ và trao đổi riêng tới từng Quý Phụ huynh để cùng gia đình đồng hành giúp con tiến bộ hơn ạ.\n`;
        } else {
          msg += `\n⚠️ DANH SÁCH CÁC CON CẦN GIA ĐÌNH PHỐI HỢP NHẮC NHỞ:\n`;
          violatingStudents.forEach((s, idx) => {
            const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
            const comment = (evalObj.comment || '').trim();
            const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
            const reminderTags = tags.filter(isReminderOrViolationTag);
            msg += `${idx + 1}. ${s.name}\n`;
            if (reminderTags.length > 0) msg += `   - Vấn đề cần lưu ý: ${reminderTags.join(', ')}\n`;
            if (comment) msg += `   - Lời dặn của GV: ${comment}\n`;
          });
          msg += `\n👉 Kính mong Quý Phụ huynh cùng nhắc nhở để các con tiến bộ hơn trong các buổi học tới!\n`;
        }

        msg += `\n------------------------------------\n`;
        msg += `Trân trọng cảm ơn sự đồng hành và quan tâm của Quý Phụ huynh!\n`;
        msg += `GVCN Lớp ${selectedClass}: ${teacherSignName}`;
        return msg;
      }

      // 💬 1.3. Mẫu Zalo Gửi Phụ Huynh (Mặc định: Trang trọng, Sư phạm, Dễ hiểu)
      let msg = `🌸 THÔNG BÁO TÌNH HÌNH HỌC TẬP - LỚP ${selectedClass} 🌸\n`;
      msg += `📅 Ngày: ${formattedDate}\n`;
      msg += `------------------------------------\n`;
      msg += `Kính gửi: Quý Phụ huynh Lớp ${selectedClass},\n`;
      msg += `Giáo viên chủ nhiệm xin thông tin nhanh tình hình học tập và nền nếp của lớp trong ngày hôm nay như sau:\n\n`;
      msg += `📊 Sĩ số lớp: ${total} học sinh\n`;

      if (praisedStudents.length > 0) {
        msg += `\n🌟 CÁC CON TIÊU BIỂU / ĐƯỢC KHEN THƯỞNG (${praisedStudents.length} em):\n`;
        praisedStudents.forEach((s, idx) => {
          const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
          const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
          const praiseTags = tags.filter(isPraiseTag);
          const tagText = praiseTags.length > 0 ? ` (${praiseTags.join(', ')})` : ' (Học tập tích cực, chăm ngoan ⭐)';
          msg += `${idx + 1}. ${s.name}${tagText}\n`;
        });
      }

      if (violatingStudents.length === 0) {
        msg += `\n🎉 TÌNH HÌNH CHUNG: Hôm nay cả lớp chăm ngoan, học tập tích cực và thực hiện rất tốt nội quy, không có học sinh nào bị nhắc nhở.\n`;
      } else if (isOnlyPraise) {
        msg += `\n💬 LƯU Ý VỀ NỀN NẾP & HỌC TẬP:\n`;
        msg += `Để bảo vệ sự riêng tư và giúp các con giữ được tinh thần thoải mái, đối với một vài bạn cần rèn luyện thêm về nền nếp/bài vở, GVCN xin phép được nhắn tin riêng tới từng Phụ huynh để cùng gia đình nhắc nhở con tiến bộ hơn ạ.\n`;
      } else {
        msg += `\n⚠️ CÁC CON CẦN GIA ĐÌNH PHỐI HỢP ĐÔN ĐỐC, NHẮC NHỞ (${violatingStudents.length} em):\n`;
        violatingStudents.forEach((s, idx) => {
          const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
          const comment = (evalObj.comment || '').trim();
          const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
          const reminderTags = tags.filter(isReminderOrViolationTag);
          const detail = comment || reminderTags.join(', ') || 'Cần chú ý tập trung học tập';
          msg += `${idx + 1}. ${s.name}: ${detail}\n`;
        });
        msg += `\n👉 Kính nhờ Quý Phụ huynh nhắc nhở nhẹ nhàng để các con hoàn thiện bản thân và học tập tốt hơn ạ.\n`;
      }

      msg += `\nTrân trọng cảm ơn sự phối hợp chặt chẽ từ Quý Phụ huynh!\n`;
      msg += `Giáo viên chủ nhiệm: ${teacherSignName}`;
      return msg;
    }

    // 👨‍🏫 TRƯỜNG HỢP 2: TÀI KHOẢN KHÁC (GIÁO VIÊN BỘ MÔN / ADMIN) BÁO CÁO CHO GVCN
    if (template === 'sms') {
      if (violatingStudents.length === 0) {
        return `[TIN HOC ${selectedClass} ${formattedDate}] Si so ${total} HS. Gio hoc tot, khong co HS vi pham.`;
      }
      if (isOnlyPraise) {
        const pNames = praisedStudents.slice(0, 5).map(s => s.name).join(', ');
        return `[TIN HOC ${selectedClass} ${formattedDate}] Khen ngoi ${praisedStudents.length} HS tieu bieu: ${pNames}. Danh sach nhac nho da duoc gui rieng GVCN.`;
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
      if (!isOnlyPraise) {
        msg += `⚠️ Học sinh cần nhắc nhở/vi phạm: ${violatingStudents.length} em\n`;
      }
      msg += `------------------------------------\n`;

      if (praisedStudents.length > 0) {
        msg += `\n🌟 DANH SÁCH HỌC SINH ĐƯỢC KHEN THƯỞNG:\n`;
        praisedStudents.forEach((s, idx) => {
          const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
          const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
          const praiseTags = tags.filter(isPraiseTag);
          const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
          const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
          const machineLabel = seatObj ? ` (${seatObj.name})` : '';

          msg += `${idx + 1}. ${s.name}${machineLabel}\n`;
          if (praiseTags.length > 0) msg += `   - Thưởng: ${praiseTags.join(', ')}\n`;
        });
      }

      if (violatingStudents.length === 0) {
        msg += `\n🎉 Không có học sinh vi phạm trong tiết học.\n`;
      } else if (isOnlyPraise) {
        msg += `\n💬 VỀ HỌC SINH CẦN LƯU Ý:\n`;
        msg += `Danh sách các em cần nhắc nhở/chưa tập trung được chuyển tiếp riêng tới GVCN để bảo vệ tính riêng tư của các em khi gửi thông tin vào nhóm chung.\n`;
      } else {
        msg += `\n⚠️ DANH SÁCH CHI TIẾT HỌC SINH CẦN NHẮC NHỞ:\n`;
        violatingStudents.forEach((s, idx) => {
          const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
          const comment = (evalObj.comment || '').trim();
          const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
          const reminderTags = tags.filter(isReminderOrViolationTag);
          const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
          const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
          const machineLabel = seatObj ? ` (${seatObj.name})` : '';

          msg += `${idx + 1}. ${s.name}${machineLabel}\n`;
          if (comment) msg += `   - Nhận xét giáo viên: ${comment}\n`;
          if (reminderTags.length > 0) msg += `   - Thẻ nhắc nhở/vi phạm: ${reminderTags.join(', ')}\n`;
        });
      }

      msg += `\n------------------------------------\n`;
      const gvcnRecipient = gvcnName && gvcnName !== 'Chưa cập nhật GVCN' ? ` (${gvcnName})` : '';
      msg += `Kính gửi GVCN Lớp ${selectedClass}${gvcnRecipient} phối hợp đôn đốc các em học sinh. Trân trọng cảm ơn Thầy/Cô!`;
      return msg;
    }

    // Default Zalo Standard Template cho GV Bộ môn
    let msg = `📋 BÁO CÁO NỀN NẾP TIẾT TIN HỌC - LỚP ${selectedClass}\n`;
    msg += `📅 Ngày: ${formattedDate}\n`;
    msg += `------------------------------------\n`;
    const gvcnRecipient = gvcnName && gvcnName !== 'Chưa cập nhật GVCN' ? ` (${gvcnName})` : '';
    msg += `👨‍🏫 Kính gửi Giáo viên chủ nhiệm Lớp ${selectedClass}${gvcnRecipient},\n`;
    msg += `Em xin gửi Thầy/Cô tình hình học tập và nền nếp của lớp trong tiết Tin học hôm nay (${formattedDate}):\n\n`;
    msg += `📊 Sĩ số lớp: ${total} học sinh\n`;

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

    if (violatingStudents.length === 0) {
      msg += `\n🎉 TÌNH HÌNH NỀN NẾP RẤT TỐT: Lớp học chăm ngoan, nghiêm túc, không có học sinh vi phạm hay bị nhắc nhở trong giờ học.\n`;
    } else if (isOnlyPraise) {
      msg += `\n💬 VỀ NỀN NẾP TIẾT HỌC:\n`;
      msg += `Danh sách các em học sinh cần nhắc nhở trong tiết học được gửi riêng cho Thầy/Cô GVCN để bảo vệ tính riêng tư của các em khi gửi tin vào nhóm lớp.\n`;
    } else {
      msg += `\n⚠️ DANH SÁCH HỌC SINH CẦN NHẮC NHỞ / VI PHẠM NỀN NẾP (${violatingStudents.length} em):\n`;
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

    msg += `\nEm trân trọng cảm ơn Thầy/Cô!`;
    return msg;
  }, [isHomeroomTeacher, activeUser, classStudents, currentDaysEvaluations, selectedClass, selectedDate, seatingChart, computers, gvcnName, onlyPraiseInGroup, violatingStudents, generateIndividualParentMessage]);

  // ✉️ Xử lý khi chọn mẫu 'Nhắn riêng PH' hoặc bấm chọn riêng từng học sinh (chỉ áp dụng cho GVCN)
  const handleSelectPrivateTemplate = React.useCallback((studentId?: string | 'ALL') => {
    if (!isHomeroomTeacher) return;
    setReportTemplate('private');
    if (violatingStudents.length === 0) {
      setSelectedPrivateStudentId(null);
      setCustomMessageText(`🎉 Tiết học hôm nay cả lớp thực hiện nền nếp rất tốt, không có học sinh nào bị nhắc nhở để gửi riêng cho phụ huynh.`);
      showToast('🎉 Tiết học hôm nay cả lớp chăm ngoan, không có học sinh nào bị nhắc nhở.', 'info');
      return;
    }

    if (studentId && studentId !== 'ALL') {
      setSelectedPrivateStudentId(studentId);
      const student = violatingStudents.find(s => s.id === studentId) || violatingStudents[0];
      setCustomMessageText(generateIndividualParentMessage(student));
      showToast(`Đã nạp mẫu tin nhắn riêng gửi phụ huynh em ${student.name}!`, 'info');
    } else if (violatingStudents.length === 1) {
      const singleStudent = violatingStudents[0];
      setSelectedPrivateStudentId(singleStudent.id);
      setCustomMessageText(generateIndividualParentMessage(singleStudent));
      showToast(`Đã nạp mẫu tin nhắn riêng gửi phụ huynh em ${singleStudent.name}!`, 'info');
    } else {
      const chosenId = studentId || 'ALL';
      setSelectedPrivateStudentId(chosenId);
      setCustomMessageText(generateReportText('private', onlyPraiseInGroup, chosenId));
      showToast(`Đã nạp mẫu tin nhắn riêng của ${chosenId === 'ALL' ? `tất cả ${violatingStudents.length} em` : 'học sinh'}!`, 'info');
    }
  }, [isHomeroomTeacher, violatingStudents, generateIndividualParentMessage, generateReportText, onlyPraiseInGroup, showToast]);

  // Đảm bảo an toàn: Nếu không phải GVCN mà đang chọn template 'private' thì tự động chuyển về 'zalo'
  React.useEffect(() => {
    if (!isHomeroomTeacher && reportTemplate === 'private') {
      setReportTemplate('zalo');
      setCustomMessageText(generateReportText('zalo', onlyPraiseInGroup));
    }
  }, [isHomeroomTeacher, reportTemplate, generateReportText, onlyPraiseInGroup]);

  // 🛡️ LƯU SỔ ĐÁNH GIÁ CHỦ ĐỘNG: Lưu trực tiếp vào LocalStorage và Supabase Cloud với Deep Merge
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const targetWs = workspaceId || (typeof localStorage !== 'undefined' && localStorage.getItem('deskos_active_workspace')) || 'ws_u-1';
      
      const success = await saveDayPartitionedEvaluation(
        evaluationData,
        selectedDate,
        targetWs,
        (merged) => {
          setEvaluationData(merged);
        }
      );

      // Lưu đồng thời số sao thi đua tích lũy (EmulationState)
      if (emulationDataState) {
        const emulationKey = `${targetWs}_school_emulation_state`;
        safeSetLocalStorage(emulationKey, emulationDataState);
        saveSupabaseState(emulationKey, emulationDataState);
      }

      setHasUnsavedChanges(false);
      showToast(`Đã lưu trữ thành công sổ đánh giá & chấm sao ngày ${selectedDate.split('-').reverse().join('/')} của lớp ${selectedClass}!`, 'success');
    } catch (err) {
      console.error('Lỗi khi lưu sổ đánh giá:', err);
      showToast('Có lỗi xảy ra khi lưu sổ đánh giá!', 'error');
    } finally {
      setIsSaving(false);
    }
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
                setCustomMessageText(generateReportText('zalo', onlyPraiseInGroup));
                setSubView(prev => prev === 'zalo' ? 'evaluation' : 'zalo');
              }}
              className={`font-black text-xs py-2 px-3.5 rounded-xl border transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto active:scale-95 ${
                subView === 'zalo'
                  ? 'bg-sky-700 hover:bg-sky-800 text-white border-sky-600 ring-2 ring-sky-300'
                  : 'bg-sky-600 hover:bg-sky-700 text-white border-sky-500'
              }`}
              title={isHomeroomTeacher ? "Tạo tin nhắn Zalo/SMS thông báo tình hình học tập gửi Quý Phụ huynh" : "Tạo tin nhắn Zalo/SMS gửi tình hình học sinh vi phạm tới Giáo viên chủ nhiệm"}
            >
              <span>💬</span> Báo Cáo Zalo
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`font-extrabold text-xs py-2 px-4 rounded-xl border transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto active:scale-95 ${
                isSaving
                  ? 'bg-amber-400 text-amber-950 border-amber-300 opacity-85 cursor-wait'
                  : hasUnsavedChanges
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 ring-2 ring-rose-400/60 animate-pulse'
                  : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
              }`}
              title={hasUnsavedChanges ? "Có thay đổi chưa lưu! Bấm để lưu sổ đánh giá" : "Lưu sổ đánh giá"}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Đang lưu...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Lưu Đánh Giá *</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-100" />
                  <span>Lưu Đánh Giá</span>
                </>
              )}
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
                    <TeacherCommentInput
                      studentId={s.id}
                      initialComment={evalObj.comment || ''}
                      onSaveComment={handleSetComment}
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
              <span>💬</span> {isHomeroomTeacher ? 'THÔNG BÁO TÌNH HÌNH HỌC TẬP GỬI PHỤ HUYNH LỚP' : 'BÁO CÁO ZALO/SMS CHO GVCN LỚP'}{' '}
              <span className="text-sky-700 font-mono bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">{selectedClass}</span>
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
                  setSelectedPrivateStudentId(null);
                  setCustomMessageText(generateReportText('zalo', onlyPraiseInGroup));
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  reportTemplate === 'zalo' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:bg-white/60'
                }`}
              >
                {isHomeroomTeacher ? '💬 Mẫu Zalo Gửi Phụ Huynh' : '💬 Mẫu Zalo Chuẩn'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportTemplate('sms');
                  setSelectedPrivateStudentId(null);
                  setCustomMessageText(generateReportText('sms', onlyPraiseInGroup));
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  reportTemplate === 'sms' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-white/60'
                }`}
              >
                {isHomeroomTeacher ? '📱 Mẫu Nhắn Tin Ngắn' : '📱 Mẫu SMS Ngắn'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportTemplate('full');
                  setSelectedPrivateStudentId(null);
                  setCustomMessageText(generateReportText('full', onlyPraiseInGroup));
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  reportTemplate === 'full' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700 hover:bg-white/60'
                }`}
              >
                {isHomeroomTeacher ? '📑 Mẫu Đánh Giá Chi Tiết' : '📑 Mẫu Chi Tiết Đầy Đủ'}
              </button>
              {isHomeroomTeacher && (
                <button
                  type="button"
                  onClick={() => handleSelectPrivateTemplate(selectedPrivateStudentId || 'ALL')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                    reportTemplate === 'private'
                      ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-400/50'
                      : 'bg-teal-600/90 hover:bg-teal-700 text-white shadow-xs'
                  }`}
                  title="Hiển thị mẫu tin nhắn gửi riêng 1-1 cho phụ huynh từng em bị nhắc nhở"
                >
                  <span>✉️</span>
                  <span>Nhắn riêng PH</span>
                  {violatingStudents.length > 0 && (
                    <span className="bg-white/25 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                      {violatingStudents.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* 🛡️ TÙY CHỌN BẢO VỆ TÍNH RIÊNG TƯ: CHỈ GỬI DANH SÁCH KHEN THƯỞNG LÊN NHÓM CHUNG */}
            <div className="bg-amber-50/90 border border-amber-300/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-3xs transition-all">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyPraiseInGroup}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOnlyPraiseInGroup(checked);
                    safeSetLocalStorage('zalo_only_praise_in_group', checked);
                    setCustomMessageText(generateReportText(reportTemplate, checked));
                  }}
                  className="w-4.5 h-4.5 text-emerald-600 rounded-md border-amber-400 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>🛡️</span> Chỉ gửi danh sách khen thưởng lên nhóm chung
                </span>
              </label>

              <span className="text-[11px] font-bold text-amber-900/90 bg-amber-100/80 px-2.5 py-1 rounded-xl border border-amber-200/80">
                🔒 Bảo vệ tính riêng tư của các em chưa ngoan, tránh để phụ huynh khác so sánh trên nhóm lớp
              </span>
            </div>

            {/* GVCN Info Configuration Box (Read-Only Linked from Class Management) */}
            <div className="bg-sky-50/90 p-4 rounded-2xl border border-sky-200 text-left space-y-3">
              
              {/* Device Auto-Detect Switcher Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-2.5">
                <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                  {isHomeroomTeacher ? (
                    <>
                      <span>⚙️</span> KẾT NỐI GỬI ZALO CHO PHỤ HUYNH LỚP{' '}
                      <span className="text-sky-700 bg-white px-2 py-0.5 rounded-lg border border-sky-300 font-mono">
                        {selectedClass}
                      </span>
                      :
                    </>
                  ) : (
                    <>
                      <span>⚙️</span> KÍCH HOẠT KẾT NỐI ZALO LỚP{' '}
                      <span className="text-sky-700 bg-white px-2 py-0.5 rounded-lg border border-sky-300 font-mono">
                        {selectedClass}
                      </span>
                      :
                    </>
                  )}
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

              {/* GVCN Info Grid */}
              {isHomeroomTeacher ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-sky-200 shadow-2xs text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-sky-950 whitespace-nowrap flex items-center gap-1">
                      👤 Giáo viên chủ nhiệm:
                    </span>
                    <span className="text-xs font-black text-slate-800 bg-sky-50/90 px-3 py-1 rounded-xl border border-sky-200">
                      {activeUser?.name || gvcnName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-sky-950 whitespace-nowrap flex items-center gap-1">
                      🏫 Lớp phụ trách:
                    </span>
                    <span className="text-xs font-black text-sky-800 bg-sky-50/90 px-3 py-1 rounded-xl border border-sky-200 font-mono">
                      Lớp {selectedClass}
                    </span>
                  </div>
                </div>
              ) : (
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
              )}

              {/* Status Helper Banner */}
              {isHomeroomTeacher ? (
                <p className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <span>✅</span> Sẵn sàng gửi tin nhắn thông báo đến <strong>Nhóm Zalo Phụ Huynh Lớp {selectedClass}</strong> hoặc gửi riêng cho từng Phụ huynh.
                </p>
              ) : (() => {
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

            {/* Thanh chọn học sinh khi chọn mẫu Nhắn riêng PH (chỉ hiển thị với GVCN) */}
            {isHomeroomTeacher && reportTemplate === 'private' && violatingStudents.length > 0 && (
              <div className="bg-teal-50/90 border border-teal-200/90 p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-teal-950">
                  <span className="flex items-center gap-1.5">
                    <span>✉️</span> Chọn học sinh để nạp tin nhắn riêng:
                  </span>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-lg border border-teal-200/60">
                    {violatingStudents.length} em có lưu ý nền nếp
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {violatingStudents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleSelectPrivateTemplate('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 border ${
                        selectedPrivateStudentId === 'ALL' || !selectedPrivateStudentId
                          ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                          : 'bg-white text-teal-800 border-teal-200 hover:bg-teal-100/60'
                      }`}
                    >
                      <span>📑</span>
                      <span>Tất cả ({violatingStudents.length} em)</span>
                    </button>
                  )}
                  {violatingStudents.map((s, idx) => {
                    const isSelected = selectedPrivateStudentId === s.id || (violatingStudents.length === 1 && selectedPrivateStudentId !== 'ALL');
                    const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
                    const tags: string[] = Array.isArray(evalObj.tags) ? evalObj.tags : [];
                    const reminderTags = tags.filter(isReminderOrViolationTag);

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectPrivateTemplate(s.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-100/60 hover:border-teal-300'
                        }`}
                      >
                        <span>{idx + 1}. {s.name}</span>
                        {reminderTags.length > 0 && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${
                            isSelected ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700 font-bold'
                          }`}>
                            {reminderTags.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Preview Textarea */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-black text-slate-700">
                {reportTemplate === 'private'
                  ? `Nội dung tin nhắn gửi riêng cho Phụ huynh ${selectedPrivateStudentId && selectedPrivateStudentId !== 'ALL' ? `em ${violatingStudents.find(s => s.id === selectedPrivateStudentId)?.name || ''}` : '(Có thể chỉnh sửa trực tiếp):'}`
                  : (isHomeroomTeacher ? 'Xem trước & Chỉnh sửa nội dung tin nhắn gửi Phụ huynh:' : 'Xem trước & Chỉnh sửa nội dung tin nhắn gửi GVCN:')}
              </label>
              <textarea
                rows={10}
                value={customMessageText}
                onChange={(e) => setCustomMessageText(e.target.value)}
                placeholder={isHomeroomTeacher ? "Nội dung thông báo tình hình học tập gửi Quý Phụ huynh..." : "Nội dung báo cáo gửi Giáo viên chủ nhiệm..."}
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

              <div className="flex flex-wrap items-center gap-2">
                {isHomeroomTeacher && (
                  <button
                    type="button"
                    onClick={() => handleSelectPrivateTemplate(selectedPrivateStudentId || 'ALL')}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      reportTemplate === 'private'
                        ? 'bg-teal-700 text-white ring-2 ring-teal-400/50'
                        : 'bg-teal-600/90 hover:bg-teal-700 text-white'
                    }`}
                    title="Hiển thị mẫu tin nhắn gửi riêng 1-1 cho phụ huynh từng em bị nhắc nhở"
                  >
                    <span>✉️</span>
                    <span>Nhắn riêng PH</span>
                    {violatingStudents.length > 0 && (
                      <span className="bg-white/25 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                        {violatingStudents.length}
                      </span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customMessageText);
                    showToast(
                      isHomeroomTeacher
                        ? 'Đã sao chép nội dung gửi Phụ huynh! Thầy/Cô có thể dán (Ctrl+V) vào nhóm Zalo Phụ huynh lớp ngay.'
                        : 'Đã sao chép tin nhắn thành công! Thầy/Cô có thể dán (Ctrl+V) vào Zalo ngay.',
                      'success'
                    );
                  }}
                  className="px-4.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span>📋</span> Sao Chép Nội Dung
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isHomeroomTeacher) {
                      navigator.clipboard.writeText(customMessageText);
                      if (zaloTargetMode === 'pc') {
                        const zaloNativeAppUri = 'zalo://';
                        const nativeLink = document.createElement('a');
                        nativeLink.href = zaloNativeAppUri;
                        document.body.appendChild(nativeLink);
                        nativeLink.click();
                        document.body.removeChild(nativeLink);

                        setTimeout(() => {
                          window.location.href = zaloNativeAppUri;
                        }, 150);

                        showToast('Đã sao chép nội dung gửi Phụ huynh & Kích hoạt Zalo PC! Thầy/Cô dán (Ctrl+V) vào nhóm Phụ huynh Lớp nhé.', 'success');
                      } else {
                        window.open('https://chat.zalo.me/', '_blank');
                        showToast('Đã sao chép nội dung gửi Phụ huynh & Mở Zalo Web! Thầy/Cô dán (Ctrl+V) vào nhóm Phụ huynh Lớp nhé.', 'success');
                      }
                      return;
                    }

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
                  title={
                    isHomeroomTeacher
                      ? (zaloTargetMode === 'pc' ? 'Mở Zalo PC để dán tin nhắn vào nhóm phụ huynh lớp' : 'Mở Zalo Web/Mobile để gửi phụ huynh')
                      : (zaloTargetMode === 'pc' ? 'Kích hoạt ứng dụng Zalo PC trên máy tính' : 'Mở ứng dụng Zalo Mobile trên điện thoại')
                  }
                >
                  <span>💬</span>{' '}
                  {isHomeroomTeacher
                    ? (zaloTargetMode === 'pc' ? 'Mở Zalo Gửi Phụ Huynh' : 'Mở App Zalo Gửi PH')
                    : (zaloTargetMode === 'pc' ? 'Mở Zalo PC App' : 'Mở App Zalo Mobile')}
                </button>

                <a
                  href={
                    isHomeroomTeacher
                      ? `sms:?body=${encodeURIComponent(customMessageText)}`
                      : (gvcnPhone.trim().replace(/\D/g, '') 
                          ? `sms:${gvcnPhone.trim().replace(/\D/g, '')}?body=${encodeURIComponent(customMessageText)}` 
                          : `sms:?body=${encodeURIComponent(customMessageText)}`)
                  }
                  onClick={() => {
                    navigator.clipboard.writeText(customMessageText);
                    showToast(
                      isHomeroomTeacher
                        ? 'Đã sao chép & Kích hoạt ứng dụng Soạn Tin nhắn SMS gửi Phụ huynh!'
                        : 'Đã sao chép & Kích hoạt ứng dụng Tin nhắn SMS!',
                      'success'
                    );
                  }}
                  className="px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 no-underline"
                >
                  <span>📱</span> {isHomeroomTeacher ? 'Soạn SMS Gửi PH' : 'Gửi SMS'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

