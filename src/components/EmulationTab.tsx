import React, { useState, useMemo } from 'react';
import { Student, EmulationDataState, SeatingChart, Computer, ClassItem, Grade, EvaluationData } from '../types';
import { Award, ShoppingBag, HelpCircle, Search, Sparkles, Check, Star, X, BarChart3, Trophy, TrendingUp, Calendar, Clock, Award as AwardIcon, ArrowLeft, Filter, RefreshCw, UserCheck, Flame, RotateCcw } from 'lucide-react';
import FireworksCelebration from './FireworksCelebration';
import { triggerVictoryConfetti } from '../utils/confetti';
import { playVictoryFanfareSound, playButtonClickSound } from '../utils/audioEffects';
import { HoneyBeeCardFrameDecoration } from './HoneyBeeCardFrameDecoration';
import { StudentCard3D } from './StudentCard3D';

const getStudentAvatar = (studentId: string, allStudents?: Student[]) => {
  const avatars = [
    { emoji: "🐼", bg: "bg-indigo-50 border-indigo-100" },
    { emoji: "🐰", bg: "bg-emerald-50 border-emerald-100" },
    { emoji: "🦁", bg: "bg-amber-50 border-amber-100" },
    { emoji: "🦊", bg: "bg-orange-50 border-orange-100" },
    { emoji: "🐯", bg: "bg-yellow-50 border-yellow-100" },
    { emoji: "🐨", bg: "bg-slate-100/80 border-slate-200" },
    { emoji: "🐸", bg: "bg-green-50 border-green-100" },
    { emoji: "🐷", bg: "bg-pink-50 border-pink-100" },
    { emoji: "🐻", bg: "bg-amber-100/60 border-amber-200" },
    { emoji: "🦉", bg: "bg-purple-50 border-purple-100" },
    { emoji: "🐱", bg: "bg-rose-50 border-rose-100" },
    { emoji: "🐶", bg: "bg-blue-50 border-blue-100" },
    { emoji: "🐧", bg: "bg-slate-100/80 border-slate-200"},
    { emoji: "🐻‍❄️", bg: "bg-rose-50 border-rose-200"},
    { emoji: "🦄", bg: "bg-rose-50 border-rose-100"},
    { emoji: "🐺", bg: "bg-slate-100/80 border-slate-200"},
    { emoji: "🦝", bg: "bg-slate-100/80 border-slate-200"},
    { emoji: "🐹", bg: "bg-rose-50 border-rose-100"},
    { emoji: "🐭", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐮", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐴", bg: "bg-amber-100/60 border-amber-200"},
    { emoji: "🐳", bg: "bg-blue-50 border-blue-100"},
    { emoji: "🐋", bg: "bg-blue-50 border-blue-100"},
    { emoji: "🐙", bg: "bg-pink-50 border-pink-100"},
    { emoji: "🦑", bg: "bg-amber-100/60 border-orange-100"},
    { emoji: "crab", bg: "bg-amber-100/60 border-pink-100"},
    { emoji: "🦚", bg: "bg-green-50 border-green-100"},
    { emoji: "🦧", bg: "bg-blue-50 border-blue-100"},
    { emoji: "🕊️", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐞", bg: "bg-amber-50 border-amber-100"},
    { emoji: "🦋", bg: "bg-amber-50 border-amber-100"},
    { emoji: "🐝", bg: "bg-yellow-50 border-yellow-100"},
    { emoji: "🦗", bg: "bg-amber-50 border-amber-100"},
    { emoji: "🪲", bg: "bg-green-50 border-green-100"},
    { emoji: "🪰", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🕷️", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🦂", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🦖", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🦕", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐲", bg: "bg-blue border-emerald-100"},
    { emoji: "🐔", bg: "bg-emerald-50 border-emerald-100"},
    { emoji: "🐓", bg: "bg-emerald-50 border-emerald-100"}
  ];

  if (allStudents && allStudents.length > 0) {
    const sorted = [...allStudents].sort((a, b) => a.id.localeCompare(b.id));
    const index = sorted.findIndex(s => s.id === studentId);
    if (index !== -1) {
      return avatars[index % avatars.length];
    }
  }

  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 20) - hash);
  }
  hash = Math.abs(hash);

  return avatars[hash % avatars.length];
};

const StickerAvatar = ({ emoji, studentId, size = 'w-16 h-16', className = '', avatarUrl, bg }: { emoji: string; studentId?: string; size?: string; className?: string; avatarUrl?: string; bg?: string }) => {
  let backgroundClass = bg;
  if (!backgroundClass && studentId) {
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
      hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const bgList = [
      "bg-indigo-50 border-indigo-100",
      "bg-emerald-50 border-emerald-100",
      "bg-amber-50 border-amber-100",
      "bg-orange-50 border-orange-100",
      "bg-yellow-50 border-yellow-100",
      "bg-rose-50 border-rose-100",
      "bg-purple-50 border-purple-100",
      "bg-blue-50 border-blue-100"
    ];
    backgroundClass = bgList[Math.abs(hash) % bgList.length];
  }

  return (
    <div className={`rounded-full flex items-center justify-center border-2 shadow-inner select-none shrink-0 ${backgroundClass || 'bg-amber-50 border-amber-100'} ${size} ${className} avatar-sparkle-hover relative overflow-hidden`}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="leading-none drop-shadow-xs text-[1.85em]">{emoji}</span>
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
      ringClass: 'ring-[3.5px] ring-amber-400 ring-offset-2 shadow-[0_0_15px_rgba(251,191,36,0.55)]',
      badgeClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-amber-200 text-[8px] font-black',
      emoji: '👑'
    };
  } else if (stars >= 5) {
    return {
      type: 'silver',
      label: 'Huy hiệu Bạc',
      ringClass: 'ring-[3.5px] ring-slate-300 ring-offset-2 shadow-[0_0_8px_rgba(148,163,184,0.35)]',
      badgeClass: 'bg-gradient-to-r from-slate-300 to-slate-400 text-white border-slate-200 text-[8px] font-black',
      emoji: '🥈'
    };
  }
  return null;
};

interface EmulationTabProps {
  selectedClass: string;
  students: Student[];
  emulationDataState: EmulationDataState;
  setEmulationDataState: React.Dispatch<React.SetStateAction<EmulationDataState>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  isRedemptionPeriod: boolean;
  computers: Computer[];
  seatingChart: SeatingChart;
  classes?: ClassItem[];
  grades?: Grade[];
  systemDateText?: string;
  evaluationData?: EvaluationData;
  selectedDate?: string;
}

export default function EmulationTab({
  selectedClass,
  students,
  emulationDataState,
  setEmulationDataState,
  showToast,
  isRedemptionPeriod,
  computers,
  seatingChart,
  classes,
  grades,
  systemDateText,
  evaluationData,
  selectedDate = '2026-07-15'
}: EmulationTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStudentForReward, setSelectedStudentForReward] = useState<Student | null>(null);

  // Helper Cuộn Mượt (Smooth Scroll) lên đầu trang khi mở Form / Sub-view
  const scrollToFormTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Parse active month information dynamically
  const activeMonthYearLabel = React.useMemo(() => {
    if (systemDateText) {
      const match = systemDateText.match(/tháng\s+(\d+)\s+năm\s+(\d+)/i);
      if (match) {
        return `Tháng ${match[1]}/${match[2]}`;
      }
    }
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `Tháng ${mm}/${yyyy}`;
  }, [systemDateText]);
  
  // State for celebration fireworks and card popup
  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    studentClass: string;
    badgeName: string;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
    studentClass: '',
    badgeName: '',
  });

  // State for Monthly Top 3 Honor Celebration Showcase Modal
  const [isMonthlyHallOfFameOpen, setIsMonthlyHallOfFameOpen] = useState(false);
  const [hallOfFameFilter, setHallOfFameFilter] = useState<'current-class' | 'grade-3' | 'grade-4' | 'grade-5' | 'all-school'>('current-class');
  const [showLessonEndReminder, setShowLessonEndReminder] = useState(false);
  const [podiumAnimKey, setPodiumAnimKey] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'comparison' | 'redemption'>('comparison');

  // Check end-of-lesson auto reminder (last 5 minutes of lesson hours)
  React.useEffect(() => {
    const checkLessonEnd = () => {
      const now = new Date();
      const min = now.getMinutes();
      if ((min >= 40 && min <= 45) || (min >= 25 && min <= 30)) {
        setShowLessonEndReminder(true);
      }
    };
    checkLessonEnd();
    const timer = setInterval(checkLessonEnd, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenMonthlyHallOfFame = () => {
    setIsMonthlyHallOfFameOpen(true);
    setPodiumAnimKey(prev => prev + 1);
    triggerVictoryConfetti();
    playVictoryFanfareSound();
    scrollToFormTop();
  };
  
  // Emulation Period filter state for BẢNG VÀNG VINH DANH KHỐI
  const [emulationPeriod, setEmulationPeriod] = useState<'week' | 'month' | 'semester'>('month');

  // Helper date filters
  const isSameWeek = (dateStr1: string, dateStr2: string) => {
    try {
      const d1 = new Date(dateStr1);
      const d2 = new Date(dateStr2);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
      const getMonday = (d: Date) => {
        const copy = new Date(d);
        const day = copy.getDay();
        const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(copy.setDate(diff));
      };
      const m1 = getMonday(d1);
      const m2 = getMonday(d2);
      return m1.toDateString() === m2.toDateString();
    } catch {
      return false;
    }
  };

  const isSameMonth = (dateStr1: string, dateStr2: string) => {
    const p1 = dateStr1.split('-');
    const p2 = dateStr2.split('-');
    return p1[0] === p2[0] && p1[1] === p2[1];
  };

  const isSameSemester = (dateStr1: string, dateStr2: string) => {
    const getSemesterId = (dStr: string) => {
      const parts = dStr.split('-');
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      if (isNaN(month)) return '1';
      if (month >= 8 && month <= 12) {
        return `${year}-HK1`;
      }
      const schoolYearStart = month >= 1 && month <= 7 ? parseInt(year, 10) - 1 : parseInt(year, 10);
      return `${schoolYearStart}-HK2`;
    };
    return getSemesterId(dateStr1) === getSemesterId(dateStr2);
  };

  const getStarsForPeriod = React.useCallback((studentId: string, period: 'week' | 'month' | 'semester') => {
    let evaluatedSum = 0;
    
    if (evaluationData) {
      Object.keys(evaluationData).forEach(dateKey => {
        const dayData = evaluationData[dateKey];
        if (dayData) {
          Object.keys(dayData).forEach(classId => {
            const classData = dayData[classId];
            if (classData && classData[studentId]) {
              const r = classData[studentId].rating || 0;
              if (period === 'week' && isSameWeek(dateKey, selectedDate)) {
                evaluatedSum += r;
              } else if (period === 'month' && isSameMonth(dateKey, selectedDate)) {
                evaluatedSum += r;
              } else if (period === 'semester' && isSameSemester(dateKey, selectedDate)) {
                evaluatedSum += r;
              }
            }
          });
        }
      });
    }

    const stateVal = emulationDataState[studentId]?.cumulativeStars || 0;
    return evaluatedSum > 0 ? evaluatedSum : stateVal;
  }, [evaluationData, emulationDataState, selectedDate]);

  // Available rewards list
  const rewardList = [
    { id: 'rw1', name: 'Thợ Gõ Phím Siêu Tốc', stars: 5, emoji: '⌨️', bg: 'from-amber-400 to-yellow-500' },
    { id: 'rw2', name: 'Lập Trình Viên Tương Lai', stars: 10, emoji: '💻', bg: 'from-cyan-400 to-blue-500' },
    { id: 'rw3', name: 'Phù Thủy Thiết Kế Graphics', stars: 15, emoji: '🎨', bg: 'from-pink-400 to-purple-500' },
    { id: 'rw4', name: 'Họa Sĩ Số Tài Ba', stars: 5, emoji: '🖌️', bg: 'from-emerald-400 to-teal-500' },
    { id: 'rw5', name: 'Nhà Thám Hiểm Internet', stars: 10, emoji: '🌐', bg: 'from-blue-400 to-indigo-500' },
    { id: 'rw6', name: 'Master Trình Chiếu Slide', stars: 15, emoji: '📊', bg: 'from-orange-400 to-amber-500' },
    { id: 'rw7', name: 'Dự Án Tin Học Xuất Sắc', stars: 20, emoji: '🚀', bg: 'from-violet-500 to-fuchsia-600' },
    { id: 'rw8', name: 'Chiến Binh Sáng Tạo AI', stars: 25, emoji: '🤖', bg: 'from-[#00F2FE] to-[#4FACFE]' },
  ];

  // Grades list fallback
  const allGrades = grades && grades.length > 0 ? grades : [
    { id: 3, name: 'Khối 3' },
    { id: 4, name: 'Khối 4' },
    { id: 5, name: 'Khối 5' }
  ];

  const [selectedGradeId, setSelectedGradeId] = useState<number>(3);
  const [viewingDetailClassId, setViewingDetailClassId] = useState<string | null>(null);
  const [classSearchTerm, setClassSearchTerm] = useState<string>('');

  // Classes under selected grade
  const currentGradeClasses = useMemo(() => {
    if (!classes) return [];
    return classes.filter(c => c.gradeId === selectedGradeId);
  }, [classes, selectedGradeId]);

  // Aggregate comparison stats per class in selected grade
  const classComparisonList = useMemo(() => {
    return currentGradeClasses.map(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      const studentCount = clsStudents.length || 1;
      
      let totalStars = 0;
      let totalStickers = 0;
      let topStudent: Student | null = null;
      let topStudentStars = -1;

      clsStudents.forEach(s => {
        const sStars = getStarsForPeriod(s.id, emulationPeriod);
        totalStars += sStars;
        totalStickers += emulationDataState[s.id]?.exchangedStickers || 0;

        if (sStars > topStudentStars) {
          topStudentStars = sStars;
          topStudent = s;
        }
      });

      const averageStars = Math.round((totalStars / studentCount) * 10) / 10;

      return {
        id: cls.id,
        name: cls.name,
        teacher: cls.teacher,
        studentCount,
        totalStars,
        averageStars,
        totalStickers,
        topStudent,
        topStudentStars: topStudentStars > -1 ? topStudentStars : 0
      };
    }).sort((a, b) => b.averageStars - a.averageStars);
  }, [currentGradeClasses, students, emulationDataState, emulationPeriod, getStarsForPeriod]);

  // Top MVP class & Top MVP student of the grade
  const topClass = classComparisonList[0] || null;
  
  const gradeMVP = useMemo(() => {
    const gradeStudents = students.filter(s => {
      const cObj = classes?.find(c => c.id === s.classId);
      return cObj && cObj.gradeId === selectedGradeId;
    });

    if (gradeStudents.length === 0) return null;

    let mvp: Student | null = null;
    let maxStars = -1;

    gradeStudents.forEach(s => {
      const stars = getStarsForPeriod(s.id, emulationPeriod);
      if (stars > maxStars) {
        maxStars = stars;
        mvp = s;
      }
    });

    return mvp ? { ...mvp, cumulativeStars: maxStars } : null;
  }, [students, classes, selectedGradeId, emulationPeriod, getStarsForPeriod]);

  // Overall grade totals
  const gradeTotalStars = useMemo(() => {
    return classComparisonList.reduce((acc, c) => acc + c.totalStars, 0);
  }, [classComparisonList]);

  const gradeTotalStickers = useMemo(() => {
    return classComparisonList.reduce((acc, c) => acc + c.totalStickers, 0);
  }, [classComparisonList]);

  const gradeTotalStudents = useMemo(() => {
    return classComparisonList.reduce((acc, c) => acc + c.studentCount, 0);
  }, [classComparisonList]);

  // Single Class Detailed Roster Modal / View
  const selectedDetailClassObj = useMemo(() => {
    if (!viewingDetailClassId || !classes) return null;
    return classes.find(c => c.id === viewingDetailClassId) || null;
  }, [viewingDetailClassId, classes]);

  const selectedDetailClassStudents = useMemo(() => {
    if (!viewingDetailClassId) return [];
    return students.filter(s => s.classId === viewingDetailClassId).map(s => ({
      ...s,
      periodStars: getStarsForPeriod(s.id, emulationPeriod)
    })).sort((a, b) => b.periodStars - a.periodStars);
  }, [viewingDetailClassId, students, emulationPeriod, getStarsForPeriod]);

  const filteredDetailClassStudents = useMemo(() => {
    if (!classSearchTerm.trim()) return selectedDetailClassStudents;
    const term = classSearchTerm.toLowerCase();
    return selectedDetailClassStudents.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term)
    );
  }, [selectedDetailClassStudents, classSearchTerm]);

  // Redemption Subtab: Current Class Roster
  const currentClassStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClass).map(s => ({
      ...s,
      currentStars: emulationDataState[s.id]?.cumulativeStars || 0,
      exchangedStickers: emulationDataState[s.id]?.exchangedStickers || 0
    }));
  }, [students, selectedClass, emulationDataState]);

  const filteredCurrentClassStudents = useMemo(() => {
    if (!searchTerm.trim()) return currentClassStudents;
    const term = searchTerm.toLowerCase();
    return currentClassStudents.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term)
    );
  }, [currentClassStudents, searchTerm]);

  // Handler for redeeming reward stickers
  const handleRedeemSticker = (reward: typeof rewardList[0]) => {
    if (!selectedStudentForReward) {
      showToast('Vui lòng chọn 1 học sinh trước khi bấm đổi quà!', 'error');
      return;
    }

    const currentStars = emulationDataState[selectedStudentForReward.id]?.cumulativeStars || 0;
    const currentStickers = emulationDataState[selectedStudentForReward.id]?.exchangedStickers || 0;
    const starCost = reward.stars;

    if (currentStars < starCost) {
      showToast(`Học sinh "${selectedStudentForReward.name}" chưa đủ ${starCost} ⭐ (hiện có: ${currentStars} ⭐)!`, 'error');
      return;
    }

    const newStars = currentStars - starCost;
    const newStickers = currentStickers + 1;

    setEmulationDataState(prev => ({
      ...prev,
      [selectedStudentForReward.id]: {
        ...prev[selectedStudentForReward.id],
        cumulativeStars: newStars,
        exchangedStickers: newStickers
      }
    }));

    triggerVictoryConfetti();
    playVictoryFanfareSound();

    const sClass = classes?.find(c => c.id === selectedStudentForReward.classId)?.name || selectedClass;
    const badgeName = reward.name;

    setCelebration({
      isOpen: true,
      studentId: selectedStudentForReward.id,
      studentName: selectedStudentForReward.name,
      studentClass: sClass,
      badgeName
    });

    showToast(`Chúc mừng bé "${selectedStudentForReward.name}" đã đổi thành công Sticker: "${badgeName}"! (-${starCost} ⭐)`);
  };

  return (
    <div className="space-y-6 text-slate-800 pb-10 animate-fadeIn">

      {/* 🌟 1. DESKOS IMAC WARM BEIGE CARD HEADER STRIP (ĐỒNG BỘ 100% ĐĂNG KÝ PHÒNG MÁY) */}
      <div className="border-2 border-[#cbb89d] rounded-3xl bg-[#fffbf0] overflow-hidden shadow-sm">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2.5 text-left">
            <span className="font-extrabold text-xs text-[#5c4327]">Đang xem thi đua:</span>
            <span className="font-black text-xs text-indigo-900 bg-white px-3 py-1 rounded-xl border border-[#cbb89d] shadow-2xs">
              🏆 Lớp {selectedClass} • {activeMonthYearLabel}
            </span>
          </div>

          {/* Navigation Subtab Buttons Group */}
          <nav className="flex items-center gap-1.5 bg-[#e4d3ba] p-1.5 rounded-2xl border border-[#cbb89d] overflow-x-auto max-w-full">
            <button
              onClick={() => {
                playButtonClickSound();
                setActiveSubTab('comparison');
                scrollToFormTop();
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'comparison'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>1. Thi Đua Cấp Khối</span>
            </button>

            <button
              onClick={() => {
                playButtonClickSound();
                setActiveSubTab('redemption');
                scrollToFormTop();
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'redemption'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>2. Cửa Hàng Đổi Thưởng</span>
            </button>

            <button
              onClick={handleOpenMonthlyHallOfFame}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Trophy className="w-4 h-4 text-yellow-200 animate-pulse" />
              <span>🏆 Bảng Vinh Danh Tháng</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Automatic End-of-Lesson Honor Celebration Reminder Banner */}
      {showLessonEndReminder && (
        <div className="bg-[#fffbf0] p-4 rounded-3xl border-2 border-amber-400 shadow-md flex flex-wrap items-center justify-between gap-3 animate-fadeIn select-none text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🔔</span>
            <div>
              <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                CẢNH BÁO TỰ ĐỘNG CUỐI TIẾT HỌC (SẮP HẾT GIỜ)!
              </h4>
              <p className="text-[11px] font-bold text-slate-600">
                Chỉ còn 5 phút nữa là kết thúc tiết học! Thầy/Cô có muốn bật Bảng Vinh Danh & Tổng Kết Thi Đua cho Lớp <strong className="text-indigo-900 underline">{selectedClass}</strong> không?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowLessonEndReminder(false);
                handleOpenMonthlyHallOfFame();
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>🏆 Bật Bảng Vinh Danh Ngay</span>
            </button>
            <button
              onClick={() => setShowLessonEndReminder(false)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs px-3.5 py-2 rounded-2xl cursor-pointer transition-all"
            >
              ⏰ Để sau
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUBTAB 1: SO SÁNH THI ĐUA KHỐI & BẢNG VÀNG CHI TIẾT
          ==================================================================== */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* GRADE SELECTOR & EMULATION PERIOD FILTER CARD */}
          <div className="bg-[#fffbf0] p-5 sm:p-6 rounded-3xl border border-[#cbb89d] shadow-sm space-y-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-indigo-700" />
                  <span>So Sánh Thi Đua Cấp Khối & Bảng Xếp Hạng</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Theo dõi, vinh danh và so sánh tổng điểm thi đua giữa các lớp trong cùng khối.
                </p>
              </div>

              {/* Emulation Period Filter */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-300 shadow-2xs">
                <span className="text-xs font-black text-slate-700">Thời gian:</span>
                <select
                  value={emulationPeriod}
                  onChange={e => setEmulationPeriod(e.target.value as any)}
                  className="bg-transparent font-black text-xs text-indigo-900 outline-none cursor-pointer"
                >
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng hiện tại</option>
                  <option value="semester">Cả học kỳ</option>
                </select>
              </div>
            </div>

            {/* Grade Tabs Selector */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#cbb89d]/60">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider mr-2">Chọn Khối:</span>
              {allGrades.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setSelectedGradeId(g.id); scrollToFormTop(); }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all border cursor-pointer active:scale-95 ${
                    selectedGradeId === g.id
                      ? 'bg-indigo-700 text-white border-indigo-800 shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* GRADE EMULATION OVERVIEW CARDS (WARM BEIGE CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Top Class */}
            <div className="bg-[#fffbf0] p-5 rounded-3xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Lớp Dẫn Đầu Khối</span>
                <strong className="text-base text-slate-900 font-black block">
                  {topClass ? `Lớp ${topClass.name}` : 'N/A'}
                </strong>
                <span className="text-xs text-emerald-800 font-black block">
                  {topClass ? `${topClass.averageStars} ⭐ / học sinh` : '--'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center text-xl font-bold shadow-2xs">
                🏆
              </div>
            </div>

            {/* Total Grade Stars */}
            <div className="bg-[#fffbf0] p-5 rounded-3xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Tổng Sao Tích Lũy Khối</span>
                <strong className="text-base text-slate-900 font-black block">
                  {gradeTotalStars} ⭐
                </strong>
                <span className="text-xs text-slate-500 font-semibold block">
                  Từ {gradeTotalStudents} học sinh
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-800 border border-yellow-300 flex items-center justify-center text-xl font-bold shadow-2xs">
                ⭐
              </div>
            </div>

            {/* Total Stickers Exchanged */}
            <div className="bg-[#fffbf0] p-5 rounded-3xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Sticker Đã Đổi</span>
                <strong className="text-base text-slate-900 font-black block">
                  {gradeTotalStickers} phần quà
                </strong>
                <span className="text-xs text-pink-700 font-semibold block">
                  Phần thưởng tích đổi
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-800 border border-pink-300 flex items-center justify-center text-xl font-bold shadow-2xs">
                🛍️
              </div>
            </div>

            {/* Grade MVP */}
            <div className="bg-[#fffbf0] p-5 rounded-3xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div className="space-y-1 overflow-hidden">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Siêu Sao Khối {selectedGradeId}</span>
                <strong className="text-xs text-indigo-950 font-black block truncate">
                  {gradeMVP ? gradeMVP.name : 'N/A'}
                </strong>
                <span className="text-xs text-teal-800 font-black block truncate">
                  {gradeMVP ? `${gradeMVP.cumulativeStars} ⭐ (${classes?.find(c => c.id === gradeMVP.classId)?.name || ''})` : '--'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 border border-teal-300 flex items-center justify-center text-xl font-bold shadow-2xs shrink-0">
                ✨
              </div>
            </div>
          </div>

          {/* VISUAL COMPARISON CHART & RULES LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Bar Chart - Left */}
            <div className="lg:col-span-2 bg-[#fffbf0] p-6 rounded-3xl border border-[#cbb89d] shadow-sm space-y-6 text-left">
              <div className="flex justify-between items-center border-b border-[#cbb89d]/70 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-700" />
                    <span>Biểu Đồ So Sánh Sao Trung Bình / Học Sinh</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Chỉ số công bằng thể hiện phong trào thi đua của tập thể lớp</p>
                </div>
                <span className="text-[10px] font-black text-indigo-900 bg-white border border-slate-300 px-3 py-1 rounded-full uppercase">
                  Sao trung bình
                </span>
              </div>

              <div className="space-y-5">
                {classComparisonList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-bold text-xs">
                    Chưa có lớp học nào được phân công trong khối này.
                  </div>
                ) : (
                  classComparisonList.map((classData, index) => {
                    const maxAverage = Math.max(...classComparisonList.map(c => c.averageStars), 1);
                    const percent = Math.min(100, Math.round((classData.averageStars / maxAverage) * 100));
                    
                    let barColor = 'bg-gradient-to-r from-indigo-500 to-indigo-700';
                    let rankBadge = 'bg-slate-200 text-slate-700 font-black';
                    if (index === 0) {
                      barColor = 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500';
                      rankBadge = 'bg-amber-100 text-amber-950 font-black border border-amber-300';
                    } else if (index === 1) {
                      barColor = 'bg-gradient-to-r from-slate-400 to-slate-600';
                      rankBadge = 'bg-slate-200 text-slate-800 font-black border border-slate-300';
                    } else if (index === 2) {
                      barColor = 'bg-gradient-to-r from-orange-400 to-orange-500';
                      rankBadge = 'bg-orange-100 text-orange-950 font-black border border-orange-300';
                    }

                    return (
                      <div key={classData.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${rankBadge}`}>
                              {index + 1}
                            </span>
                            <span className="font-black text-slate-900">Lớp {classData.name}</span>
                            <span className="text-[10px] text-slate-500 font-bold">({classData.studentCount} HS)</span>
                            {index === 0 && (
                              <span className="text-[9px] font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 uppercase tracking-wide">
                                🏆 Dẫn đầu
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-indigo-950 text-xs">{classData.averageStars} ⭐ / HS</span>
                            <span className="text-[10px] text-slate-500 font-bold">(Tổng: {classData.totalStars} ⭐)</span>
                          </div>
                        </div>
                        
                        <div className="h-4.5 w-full bg-white rounded-full overflow-hidden border border-slate-300 flex shadow-inner">
                          <div 
                            className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Rules Info Card - Right */}
            <div className="bg-[#fffbf0] p-6 rounded-3xl border border-[#cbb89d] shadow-sm text-xs text-left flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-[#cbb89d]/70 pb-2.5 mb-3">
                  <HelpCircle className="w-4 h-4 text-indigo-700" />
                  <span>QUY CHẾ THI ĐUA KHỐI</span>
                </h4>
                <div className="space-y-3.5 text-slate-700 font-medium">
                  <p className="leading-relaxed">
                    🌟 <strong>Sao vàng danh dự:</strong> Điểm thi đua của lớp được tích lũy từ hoạt động phát biểu xây dựng bài, làm bài tập đầy đủ và hoàn thành dự án Tin học.
                  </p>
                  <p className="leading-relaxed">
                    📊 <strong>Công thức so sánh:</strong> 
                    <span className="block mt-1 bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-[10px] text-indigo-950 font-black text-center shadow-2xs">
                      Sao Trung Bình = Tổng Sao / Sĩ Số Lớp
                    </span>
                  </p>
                  <p className="leading-relaxed">
                    🏵️ <strong>Kỷ luật tích cực:</strong> Học sinh giữ kỷ luật tốt, không vi phạm quy định phòng máy sẽ giữ vững điểm thi đua cho lớp.
                  </p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl text-[11px] text-amber-950 font-semibold shadow-2xs">
                <span className="font-black text-amber-900 block mb-0.5">💡 Lưu ý quan trọng:</span>
                Nhà trường sẽ tuyên dương và trao cờ luân lưu cho lớp dẫn đầu khối vào lễ chào cờ thứ Hai tuần kế tiếp.
              </div>
            </div>

          </div>

          {/* DETAILED EMULATION TABLE */}
          <div className="bg-white rounded-3xl border border-[#cbb89d] overflow-hidden shadow-xs text-left">
            <div className="p-4 border-b border-[#cbb89d] font-black text-[#3d2b17] text-sm flex justify-between items-center bg-[#dfccb0]/40">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>Bảng Điểm Thi Đua Khối {selectedGradeId} Chi Tiết</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#dfccb0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                    <th className="p-3.5 pl-4 text-center w-14 whitespace-nowrap">HẠNG</th>
                    <th className="p-3.5 whitespace-nowrap">LỚP HỌC</th>
                    <th className="p-3.5 text-center whitespace-nowrap">SĨ SỐ</th>
                    <th className="p-3.5 text-right whitespace-nowrap">TỔNG SAO VÀNG</th>
                    <th className="p-3.5 text-right whitespace-nowrap">SAO TRUNG BÌNH / HS</th>
                    <th className="p-3.5 text-center whitespace-nowrap">STICKER ĐÃ ĐỔI</th>
                    <th className="p-3.5 pl-6 whitespace-nowrap">HỌC SINH ĐỨNG ĐẦU LỚP</th>
                    <th className="p-3.5 text-center pr-4 whitespace-nowrap">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 font-semibold text-slate-800">
                  {classComparisonList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold italic">
                        Chưa có dữ liệu thi đua trong khối này.
                      </td>
                    </tr>
                  ) : (
                    classComparisonList.map((classData, index) => {
                      let rowBg = 'hover:bg-[#fffbf0]/90';
                      let badgeClass = 'bg-slate-200 text-slate-700 font-black';
                      if (index === 0) {
                        rowBg = 'bg-amber-50/40 hover:bg-amber-50/70';
                        badgeClass = 'bg-amber-100 text-amber-950 font-black border border-amber-300';
                      } else if (index === 1) {
                        badgeClass = 'bg-slate-200 text-slate-800 font-black border border-slate-300';
                      } else if (index === 2) {
                        badgeClass = 'bg-orange-100 text-orange-950 font-black border border-orange-300';
                      }

                      return (
                        <tr key={classData.id} className={`transition-colors border-b border-slate-200 ${rowBg}`}>
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] ${badgeClass}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="p-3.5 font-black text-slate-900 whitespace-nowrap">
                            Lớp {classData.name}
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-600 whitespace-nowrap">
                            {classData.studentCount} HS
                          </td>
                          <td className="p-3.5 text-right text-slate-900 font-black whitespace-nowrap">
                            {classData.totalStars} ⭐
                          </td>
                          <td className="p-3.5 text-right text-emerald-800 font-black whitespace-nowrap">
                            {classData.averageStars} ⭐
                          </td>
                          <td className="p-3.5 text-center text-pink-700 font-black whitespace-nowrap">
                            {classData.totalStickers} quà
                          </td>
                          <td className="p-3.5 pl-6 whitespace-nowrap">
                            {classData.topStudent ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">👑</span>
                                <span className="font-extrabold text-slate-900">{classData.topStudent.name}</span>
                                <span className="bg-amber-100 text-amber-950 text-[9.5px] font-black px-2 py-0.5 rounded-md border border-amber-300">
                                  {classData.topStudentStars} ⭐
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center pr-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setViewingDetailClassId(classData.id);
                                setClassSearchTerm('');
                                scrollToFormTop();
                              }}
                              className="bg-indigo-100/90 hover:bg-indigo-200 text-indigo-900 px-3.5 py-1 rounded-xl border border-indigo-300 font-black text-[11px] transition cursor-pointer active:scale-95"
                            >
                              Xem Chi Tiết Lớp
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
        </div>
      )}

      {/* ====================================================================
          SUBTAB 2: CỬA HÀNG ĐỔI THƯỞNG (REDEMPTION STORE & REWARD CARDS)
          ==================================================================== */}
      {activeSubTab === 'redemption' && (
        <div className="space-y-6 animate-fadeIn text-left">
          
          {/* BANNER CỬA HÀNG HỌC TẬP - DESKOS WARM BEIGE STYLE */}
          <div className="bg-[#fffbf0] p-6 rounded-3xl border border-[#cbb89d] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center text-2xl font-bold shrink-0 shadow-2xs">
                🎁
              </div>
              <div>
                <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  CỬA HÀNG ĐỔI THƯỞNG
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Cửa Hàng Tích Sao Đổi Huy Hiệu Sticker</h3>
                <p className="text-xs font-semibold text-slate-500">
                  Sử dụng số sao vàng tích lũy từ các tiết học Tin học để đổi phần thưởng sticker độc quyền.
                </p>
              </div>
            </div>

            {isRedemptionPeriod && (
              <div className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                <span>🔔 ĐÃ MỞ CỬA ĐỔI THƯỞNG (1 - 15 HÀNG THÁNG)</span>
              </div>
            )}
          </div>

          {/* STUDENT SELECTION FOR REWARD REDEMPTION CARD */}
          <div className="bg-[#fffbf0] p-5 sm:p-6 rounded-3xl border border-[#cbb89d] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#cbb89d]/70 pb-4">
              <div>
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-700" />
                  <span>Bước 1: Chọn Học Sinh Đổi Thưởng (Lớp {selectedClass})</span>
                </h4>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Nhấp chọn 1 học sinh bên dưới để kiểm tra quỹ sao tích lũy và đổi quà.
                </p>
              </div>

              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên hoặc mã học sinh..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                />
              </div>
            </div>

            {/* Students Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-1 no-scrollbar">
              {filteredCurrentClassStudents.map(student => {
                const isSelected = selectedStudentForReward?.id === student.id;
                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudentForReward(student)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-between ${
                      isSelected
                        ? 'border-indigo-700 bg-indigo-50/90 shadow-md ring-2 ring-indigo-500/30 scale-105'
                        : 'border-[#cbb89d]/70 hover:border-indigo-400 bg-white shadow-2xs'
                    }`}
                  >
                    <div className="font-black text-slate-900 text-xs truncate max-w-full">{student.name}</div>
                    <div className="text-[11px] font-black text-amber-800 my-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {student.currentStars} ⭐
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isSelected ? 'Đã chọn' : 'Chọn đổi'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REWARD STICKERS LIST GRID (DESKOS WARM BEIGE CARDS) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-700" />
                <span>Bước 2: Danh Sách Huy Hiệu Sticker Đổi Thưởng</span>
              </h4>
              {selectedStudentForReward && (
                <span className="text-xs font-black text-indigo-950 bg-indigo-100 border border-indigo-300 px-3.5 py-1 rounded-full">
                  Đang chọn đổi cho: <strong>{selectedStudentForReward.name}</strong> ({emulationDataState[selectedStudentForReward.id]?.cumulativeStars || 0} ⭐)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {rewardList.map(reward => {
                const canAfford = selectedStudentForReward
                  ? (emulationDataState[selectedStudentForReward.id]?.cumulativeStars || 0) >= reward.stars
                  : false;

                return (
                  <div
                    key={reward.id}
                    className="bg-[#fffbf0] rounded-3xl border border-[#cbb89d] p-5 space-y-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-300 flex items-center justify-center text-3xl shadow-2xs">
                        {reward.emoji}
                      </div>
                      <h5 className="font-black text-slate-900 text-xs">{reward.name}</h5>
                      <span className="inline-block text-xs font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                        {reward.stars} ⭐
                      </span>
                    </div>

                    <button
                      onClick={() => handleRedeemSticker(reward)}
                      disabled={!selectedStudentForReward || !canAfford}
                      className={`w-full py-2.5 rounded-2xl font-black text-xs transition shadow-md cursor-pointer active:scale-95 ${
                        !selectedStudentForReward
                          ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                          : canAfford
                          ? 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-indigo-700/20'
                          : 'bg-rose-100 text-rose-800 border border-rose-300 cursor-not-allowed'
                      }`}
                    >
                      {!selectedStudentForReward
                        ? 'Chọn HS ở trên'
                        : canAfford
                        ? 'Đổi Ngay'
                        : 'Chưa đủ sao'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ====================================================================
          INLINE DETAIL VIEW FOR SINGLE CLASS ROSTER (THAY THẾ MODAL POPUP)
          ==================================================================== */}
      {viewingDetailClassId && selectedDetailClassObj && (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn text-left">
          <div className="bg-[#fffbf0] rounded-3xl border border-[#cbb89d] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[#cbb89d]/70 pb-4 flex items-center justify-between">
              <div>
                <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  CHI TIẾT THI ĐUA LỚP
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Bảng Vàng Thi Đua Lớp {selectedDetailClassObj.name} ({selectedDetailClassObj.teacher})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setViewingDetailClassId(null); scrollToFormTop(); }}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại bảng thi đua khối</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-300 shadow-2xs">
              <div className="text-xs font-bold text-slate-700">
                Sĩ số: <strong className="text-slate-900 font-black">{selectedDetailClassStudents.length} học sinh</strong> • Tổng tích lũy: <strong className="text-emerald-800 font-black">{selectedDetailClassStudents.reduce((acc, s) => acc + s.periodStars, 0)} ⭐</strong>
              </div>

              <div className="w-full md:w-72 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học sinh trong lớp..."
                  value={classSearchTerm}
                  onChange={e => setClassSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#cbb89d] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#dfccb0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                      <th className="p-3.5 pl-4 text-center w-14 whitespace-nowrap">HẠNG</th>
                      <th className="p-3.5 whitespace-nowrap">HỌC SINH</th>
                      <th className="p-3.5 text-center whitespace-nowrap">GIỚI TÍNH</th>
                      <th className="p-3.5 text-right whitespace-nowrap">SAO TÍCH LŨY</th>
                      <th className="p-3.5 text-center whitespace-nowrap">HUY HIỆU ĐẠT ĐƯỢC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 font-semibold text-slate-800">
                    {filteredDetailClassStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                          Không tìm thấy học sinh nào.
                        </td>
                      </tr>
                    ) : (
                      filteredDetailClassStudents.map((student, idx) => {
                        const badge = getStudentBadge(student.periodStars);
                        return (
                          <tr key={student.id} className="hover:bg-[#fffbf0]/90 transition border-b border-slate-200">
                            <td className="p-3.5 text-center font-black">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] ${
                                idx === 0 ? 'bg-amber-100 text-amber-950 font-black border border-amber-300' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="p-3.5 font-black text-slate-900 whitespace-nowrap">{student.name}</td>
                            <td className="p-3.5 text-center font-bold text-slate-600 whitespace-nowrap">{student.gender}</td>
                            <td className="p-3.5 text-right font-black text-amber-900 whitespace-nowrap">{student.periodStars} ⭐</td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              {badge ? (
                                <span className={`px-3 py-1 rounded-full border text-[10px] font-black inline-flex items-center gap-1 ${badge.badgeClass}`}>
                                  <span>{badge.emoji}</span>
                                  <span>{badge.label}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Chưa đạt</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => { setViewingDetailClassId(null); scrollToFormTop(); }}
                className="px-5 py-2.5 rounded-2xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer active:scale-95"
              >
                Quay Lại Bảng Khối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP CELEBRATION FIREWORKS & DRAFT MODALS */}
      {celebration.isOpen && (
        <FireworksCelebration
          isOpen={celebration.isOpen}
          onClose={() => setCelebration(prev => ({ ...prev, isOpen: false }))}
          studentId={celebration.studentId}
          studentName={celebration.studentName}
          studentClass={celebration.studentClass}
          badgeName={celebration.badgeName}
        />
      )}

    </div>
  );
}
