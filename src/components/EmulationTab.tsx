import React, { useState, useMemo } from 'react';
import { Student, EmulationDataState, SeatingChart, Computer, ClassItem, Grade, EvaluationData } from '../types';
import { Award, ShoppingBag, HelpCircle, Search, Sparkles, Check, Star, X, BarChart3, Trophy, TrendingUp, Calendar, Clock, Award as AwardIcon, ArrowLeft } from 'lucide-react';
import FireworksCelebration from './FireworksCelebration';
import { triggerVictoryConfetti } from '../utils/confetti';
import { playVictoryFanfareSound, playButtonClickSound } from '../utils/audioEffects';
import { HoneyBeeCardFrameDecoration } from './HoneyBeeCardFrameDecoration';
import { StudentCard3D } from './StudentCard3D';
import { getStudentAvatar } from '../utils/studentAvatar';

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

  // Helper Cuộn Mượt (Smooth Scroll) lên đầu trang khi mở Inline Sub-View
  const scrollToFormTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
      // August (8) to December (12) is HK1 of that year
      if (month >= 8 && month <= 12) {
        return `${year}-HK1`;
      }
      // January (1) to July (7) is HK2 of previous school year
      const schoolYearStart = month >= 1 && month <= 7 ? parseInt(year, 10) - 1 : parseInt(year, 10);
      return `${schoolYearStart}-HK2`;
    };
    return getSemesterId(dateStr1) === getSemesterId(dateStr2);
  };

  const getStarsForPeriod = React.useCallback((studentId: string, period: 'week' | 'month' | 'semester') => {
    let evaluatedSum = 0;
    let periodEvaluatedSum = 0;
    
    if (evaluationData) {
      Object.keys(evaluationData).forEach(dateKey => {
        const dayData = evaluationData[dateKey];
        if (dayData) {
          Object.keys(dayData).forEach(classId => {
            const classData = dayData[classId];
            if (classData && classData[studentId]) {
              const r = classData[studentId].rating || 0;
              evaluatedSum += r;
              
              if (period === 'week' && isSameWeek(dateKey, selectedDate)) {
                periodEvaluatedSum += r;
              } else if (period === 'month' && isSameMonth(dateKey, selectedDate)) {
                periodEvaluatedSum += r;
              } else if (period === 'semester' && isSameSemester(dateKey, selectedDate)) {
                periodEvaluatedSum += r;
              }
            }
          });
        }
      });
    }

    const baseStars = emulationDataState[studentId]?.cumulativeStars || 0;
    
    if (period === 'semester') {
      return Math.max(baseStars, evaluatedSum);
    }
    
    if (period === 'month') {
      if (evaluatedSum > 0) {
        const monthRatio = periodEvaluatedSum / evaluatedSum;
        return Math.max(periodEvaluatedSum, Math.round(baseStars * monthRatio));
      } else {
        const seed = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const factor = 0.4 + (seed % 3) * 0.15; // 0.4, 0.55, 0.70
        return Math.round(baseStars * factor);
      }
    }
    
    if (period === 'week') {
      if (evaluatedSum > 0) {
        const weekRatio = periodEvaluatedSum / evaluatedSum;
        return Math.max(periodEvaluatedSum, Math.round(baseStars * (weekRatio || 0.15)));
      } else {
        const seed = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const factor = 0.12 + (seed % 3) * 0.08; // 0.12, 0.20, 0.28
        return Math.round(baseStars * factor);
      }
    }
    
    return baseStars;
  }, [evaluationData, selectedDate, emulationDataState]);

  // Grade state for comparison
  const currentClassObj = useMemo(() => {
    return (classes || []).find(c => c.id === selectedClass);
  }, [classes, selectedClass]);
  
  const [selectedGradeId, setSelectedGradeId] = useState<number>(currentClassObj ? currentClassObj.gradeId : 3);
  const [viewingDetailClassId, setViewingDetailClassId] = useState<string | null>(null);
  const [classSearchTerm, setClassSearchTerm] = useState('');

  // Auto-sync selectedGradeId when selectedClass changes
  React.useEffect(() => {
    if (classes) {
      const activeObj = classes.find(c => c.id === selectedClass);
      if (activeObj) {
        setSelectedGradeId(activeObj.gradeId);
      }
    }
  }, [selectedClass, classes]);

  const allGrades = useMemo(() => {
    return grades || [
      { id: 3, name: 'Khối 3' },
      { id: 4, name: 'Khối 4' },
      { id: 5, name: 'Khối 5' }
    ];
  }, [grades]);

  const classComparisonList = useMemo(() => {
    const activeClasses = (classes || []).filter(c => c.gradeId === selectedGradeId);
    return activeClasses.map(c => {
      const classSts = students.filter(s => s.classId === c.id);
      const totalStars = classSts.reduce((sum, s) => {
        const stState = emulationDataState[s.id] || { cumulativeStars: 0 };
        return sum + (stState.cumulativeStars || 0);
      }, 0);
      const averageStars = classSts.length > 0 ? parseFloat((totalStars / classSts.length).toFixed(1)) : 0;
      const totalStickers = classSts.reduce((sum, s) => {
        const stState = emulationDataState[s.id] || { exchangedStickers: 0 };
        return sum + (stState.exchangedStickers || 0);
      }, 0);

      let topStudent: Student | null = null;
      let topStudentStars = 0;
      if (classSts.length > 0) {
        const sortedSts = [...classSts].sort((a, b) => {
          const starsA = emulationDataState[a.id]?.cumulativeStars || 0;
          const starsB = emulationDataState[b.id]?.cumulativeStars || 0;
          return starsB - starsA;
        });
        topStudent = sortedSts[0];
        topStudentStars = emulationDataState[topStudent.id]?.cumulativeStars || 0;
      }

      return {
        ...c,
        studentCount: classSts.length,
        totalStars,
        averageStars,
        totalStickers,
        topStudent,
        topStudentStars
      };
    }).sort((a, b) => b.averageStars - a.averageStars);
  }, [classes, selectedGradeId, students, emulationDataState]);

  const topStudentsInGrade = useMemo(() => {
    const gradeClassIds = (classes || []).filter(c => c.gradeId === selectedGradeId).map(c => c.id);
    const gradeSts = students.filter(s => gradeClassIds.includes(s.classId));

    return gradeSts.map(s => {
      const stState = emulationDataState[s.id] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
      const periodStars = getStarsForPeriod(s.id, emulationPeriod);
      return {
        ...s,
        cumulativeStars: periodStars,
        exchangedStickers: stState.exchangedStickers || 0,
        badges: stState.badges || []
      };
    }).sort((a, b) => b.cumulativeStars - a.cumulativeStars)
      .slice(0, 10);
  }, [classes, selectedGradeId, students, emulationDataState, emulationPeriod, getStarsForPeriod]);

  const topClass = useMemo(() => classComparisonList[0] || null, [classComparisonList]);
  const gradeTotalStars = useMemo(() => classComparisonList.reduce((sum, c) => sum + c.totalStars, 0), [classComparisonList]);
  const gradeTotalStickers = useMemo(() => classComparisonList.reduce((sum, c) => sum + c.totalStickers, 0), [classComparisonList]);
  const gradeTotalStudents = useMemo(() => classComparisonList.reduce((sum, c) => sum + c.studentCount, 0), [classComparisonList]);
  const gradeMVP = useMemo(() => topStudentsInGrade[0] || null, [topStudentsInGrade]);

  // Reset page when class, search term or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, searchTerm, pageSize]);

  // Get current active star count of a student
  const getStudentCurrentStars = (studentId: string) => {
    const emulationState = emulationDataState[studentId] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
    const deducted = emulationState.totalDeducted !== undefined 
      ? emulationState.totalDeducted 
      : (emulationState.exchangedStickers || 0) * 5;

    return Math.max(0, emulationState.cumulativeStars - deducted);
  };

  const classStudents = students.filter(s => s.classId === selectedClass);
  // Only allow displaying students eligible for rewards (having 5 or more stars)
  const eligibleStudents = classStudents.filter(s => getStudentCurrentStars(s.id) >= 5);
  const filteredStudents = eligibleStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalStudents = filteredStudents.length;
  const totalPages = Math.ceil(totalStudents / pageSize) || 1;

  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Process Reward Exchange
  const handleExchangeReward = (
    studentId: string,
    studentName: string,
    badgeName: string,
    starCost: number
  ) => {
    const availableStars = getStudentCurrentStars(studentId);
    if (availableStars < starCost) {
      showToast(`Bé "${studentName}" hiện chỉ có ${availableStars} ⭐, không đủ để đổi: "${badgeName}" (Cần ${starCost} ⭐)!`, 'error');
      return;
    }

    setEmulationDataState(prev => {
      const currentData = prev[studentId] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
      const updatedBadges = currentData.badges.includes(badgeName) ? currentData.badges : [...currentData.badges, badgeName];
      const initialDeduction = currentData.totalDeducted !== undefined 
        ? currentData.totalDeducted 
        : (currentData.exchangedStickers || 0) * 5;

      return {
        ...prev,
        [studentId]: {
          ...currentData,
          exchangedStickers: currentData.exchangedStickers + 1,
          totalDeducted: initialDeduction + starCost,
          badges: updatedBadges
        }
      };
    });

    const studentObj = students.find(s => s.id === studentId);
    const sClass = studentObj?.classId || selectedClass;

    // Trigger fireworks and congratulations popup!
    triggerVictoryConfetti();
    setCelebration({
      isOpen: true,
      studentId,
      studentName,
      studentClass: sClass,
      badgeName
    });

    showToast(`Chúc mừng bé "${studentName}" đã đổi thành công Sticker: "${badgeName}"! (-${starCost} ⭐)`);
  };

  // =========================================================================
  // 1. FULL WINDOW SUB-VIEW: CỬA HÀNG ĐỔI THƯỞNG STICKER HỌC SINH
  // =========================================================================
  if (selectedStudentForReward) {
    const s = selectedStudentForReward;
    const stars = getStudentCurrentStars(s.id);
    const avatar = getStudentAvatar(s.id, students);
    const badge = getStudentBadge(stars);
    const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
    const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
    const emulationObj = emulationDataState[s.id] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };

    const rewardsList = [
      {
        name: '👍Sticker Chăm Ngoan',
        label: 'Chăm Ngoan Học Tập',
        emoji: '👍',
        cost: 5,
        colorClass: 'hover:border-emerald-400 hover:bg-emerald-50/20 text-emerald-700 border-emerald-100',
        buttonClass: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600'
      },
      {
        name: '⚡Sticker Siêu Nhân Tin Học',
        label: 'Siêu Nhân Tin Học',
        emoji: '⚡',
        cost: 10,
        colorClass: 'hover:border-blue-400 hover:bg-blue-50/20 text-blue-700 border-blue-100',
        buttonClass: 'bg-blue-500 hover:bg-blue-600 border-blue-600'
      },
      {
        name: '🛡️Sticker Chiến Binh',
        label: 'Chiến Binh Công Nghệ',
        emoji: '🛡️',
        cost: 15,
        colorClass: 'hover:border-indigo-400 hover:bg-indigo-50/20 text-indigo-700 border-indigo-100',
        buttonClass: 'bg-indigo-500 hover:bg-indigo-600 border-indigo-600'
      },
      {
        name: '🎖️Sticker Siêu Sao Tin Học',
        label: 'Siêu Sao Tin Học',
        emoji: '🎖️',
        cost: 20,
        colorClass: 'hover:border-rose-400 hover:bg-rose-50/20 text-rose-700 border-rose-100',
        buttonClass: 'bg-rose-500 hover:bg-rose-600 border-rose-600 animate-pulse'
      }
    ];

    return (
      <div className="w-full min-h-[85vh] bg-[#fffbf0] rounded-3xl border-2 border-[#cbb89d] p-6 sm:p-8 space-y-6 shadow-sm relative text-left animate-fadeIn">
        <FireworksCelebration
          isOpen={celebration.isOpen}
          onClose={() => setCelebration(prev => ({ ...prev, isOpen: false }))}
          studentId={celebration.studentId}
          studentName={celebration.studentName}
          studentClass={celebration.studentClass}
          badgeName={celebration.badgeName}
          students={students}
        />

        {/* Header with Return Button */}
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-4 flex items-center justify-between gap-4 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 rounded-t-[22px]">
          <div>
            <span className="bg-white/80 text-emerald-800 border border-[#cbb89d] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              🎁 CỬA HÀNG ĐỔI THƯỞNG STICKER
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#3d2b17] mt-2">
              Đổi Quà Tích Lũy Cho: {s.name} (Lớp {s.classId})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedStudentForReward(null); scrollToFormTop(); }}
            className="text-xs text-[#3d2b17] hover:bg-white/90 font-bold px-4 py-2.5 rounded-xl border border-[#cbb89d] bg-white transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#3d2b17]" />
            <span>Quay lại danh sách đổi thưởng</span>
          </button>
        </div>

        {/* View Content */}
        <div className="space-y-6 text-left">
          <div className="flex justify-center py-2 bg-white rounded-2xl border border-[#cbb89d] p-4 shadow-inner">
            <StudentCard3D
              student={s}
              classStudents={classStudents}
              machineName={seatObj ? seatObj.name : 'Chưa xếp máy'}
              starCount={stars}
              size="md"
            />
          </div>

          <div className="space-y-3">
            <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Danh Sách Quà Đổi Thưởng</h5>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {rewardsList.map((reward) => {
                const isAffordable = stars >= reward.cost;
                const hasBadge = emulationObj.badges?.includes(reward.name);

                return (
                  <div 
                    key={reward.name}
                    className={`p-4 border rounded-2xl transition-all relative flex flex-col justify-between items-center text-center min-h-[260px] group bg-white ${
                      isAffordable 
                        ? reward.colorClass + ' cursor-pointer shadow-xs hover:shadow-md' 
                        : 'bg-slate-50/50 border-slate-100 opacity-60'
                    }`}
                    onClick={() => {
                      if (isAffordable) {
                        handleExchangeReward(s.id, s.name, reward.name, reward.cost);
                      } else {
                        showToast(`Không đủ sao để đổi ${reward.label}. Cần thêm ${reward.cost - stars} ⭐ nữa nhé!`, 'error');
                      }
                    }}
                  >
                    <div className="w-full flex justify-between items-start gap-1">
                      {hasBadge ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 uppercase tracking-wide">
                          <Check className="w-2.5 h-2.5 stroke-[3px]" /> Đã có
                        </span>
                      ) : <span className="h-4" />}
                    </div>

                    <div className="my-3 flex items-center justify-center">
                      <StickerAvatar 
                        emoji={reward.emoji} 
                        studentId={reward.name} 
                        size="w-16 h-16" 
                        className="transform group-hover:scale-110 transition-transform duration-300 shadow-md"
                      />
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center px-1">
                      <strong className="text-[11px] font-black text-slate-800 block leading-tight uppercase tracking-wide">
                        {reward.label}
                      </strong>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1.5">
                        Yêu cầu: {reward.cost} ⭐
                      </span>
                    </div>

                    <div className="w-full mt-4 flex flex-col items-center gap-2 pt-3 border-t border-dashed border-slate-200">
                      {isAffordable ? (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Đủ Điều Kiện</span>
                      ) : (
                        <span className="text-[9px] font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Thiếu {reward.cost - stars} ⭐</span>
                      )}

                      <button
                        disabled={!isAffordable}
                        className={`w-full text-[9px] font-black py-1.5 rounded-xl text-white shadow-xs transition-colors cursor-pointer uppercase ${
                          isAffordable 
                            ? reward.buttonClass 
                            : 'bg-slate-300 border-none cursor-not-allowed'
                        }`}
                      >
                        Đổi ngay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#cbb89d]/50 pt-4">
            <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-2">Lịch Sử Đổi Thưởng ({emulationObj.exchangedStickers || 0} lần)</h5>
            {emulationObj.badges && emulationObj.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {emulationObj.badges.map((badgeName) => (
                  <span 
                    key={badgeName} 
                    className="bg-amber-50 text-amber-900 border border-amber-200/60 text-[10px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-3xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>🎁 {badgeName}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">Học sinh chưa quy đổi sticker phần thưởng nào trong tháng này.</p>
            )}
          </div>

        </div>

        {/* View Footer */}
        <div className="pt-4 border-t border-[#cbb89d]/50 flex justify-end">
          <button
            onClick={() => { setSelectedStudentForReward(null); scrollToFormTop(); }}
            className="px-6 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 font-extrabold hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 active:scale-95 text-xs uppercase shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. FULL WINDOW SUB-VIEW: CHI TIẾT THI ĐUA TỪNG HỌC SINH CỦA LỚP
  // =========================================================================
  if (viewingDetailClassId) {
    const classSts = students.filter(s => s.classId === viewingDetailClassId);
    const sortedClassSts = [...classSts].map(s => {
      const stState = emulationDataState[s.id] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
      const currentStars = Math.max(0, (stState.cumulativeStars || 0) - (stState.totalDeducted || (stState.exchangedStickers || 0) * 5));
      return {
        ...s,
        cumulativeStars: stState.cumulativeStars || 0,
        exchangedStickers: stState.exchangedStickers || 0,
        currentStars,
        badges: stState.badges || []
      };
    }).sort((a, b) => b.cumulativeStars - a.cumulativeStars);

    const filteredClassSts = sortedClassSts.filter(s => s.name.toLowerCase().includes(classSearchTerm.toLowerCase()));

    return (
      <div className="w-full min-h-[85vh] bg-[#fffbf0] rounded-3xl border-2 border-[#cbb89d] p-6 sm:p-8 space-y-6 shadow-sm relative text-left animate-fadeIn">
        <FireworksCelebration
          isOpen={celebration.isOpen}
          onClose={() => setCelebration(prev => ({ ...prev, isOpen: false }))}
          studentId={celebration.studentId}
          studentName={celebration.studentName}
          studentClass={celebration.studentClass}
          badgeName={celebration.badgeName}
          students={students}
        />

        {/* Header with Return Button */}
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-4 flex items-center justify-between gap-4 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 rounded-t-[22px]">
          <div>
            <span className="bg-white/80 text-emerald-800 border border-[#cbb89d] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              🏆 BẢNG VINH DANH CHI TIẾT LỚP
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#3d2b17] mt-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-600" />
              Chi Tiết Thi Đua Lớp {classes?.find(c => c.id === viewingDetailClassId)?.name || viewingDetailClassId}
            </h3>
            <p className="text-xs text-[#5c4327] font-bold mt-1">
              Khối {classes?.find(c => c.id === viewingDetailClassId)?.gradeId} • GVCN: {classes?.find(c => c.id === viewingDetailClassId)?.teacher || 'Đang cập nhật'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setViewingDetailClassId(null); setClassSearchTerm(''); scrollToFormTop(); }}
            className="text-xs text-[#3d2b17] hover:bg-white/90 font-bold px-4 py-2.5 rounded-xl border border-[#cbb89d] bg-white transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#3d2b17]" />
            <span>Quay lại bảng so sánh thi đua</span>
          </button>
        </div>

        {/* Search Student filter inside view */}
        <div className="p-1 text-left">
          <div className="relative max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              value={classSearchTerm}
              onChange={(e) => setClassSearchTerm(e.target.value)}
              placeholder="Tìm kiếm học sinh trong lớp..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-[#cbb89d] rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs font-bold text-slate-800"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-[#cbb89d] bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#e8d7c0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                  <th className="p-3.5 text-center w-12 whitespace-nowrap">Hạng</th>
                  <th className="p-3.5 whitespace-nowrap">Tên Học Sinh</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Tổng Sao Tích Lũy</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Sticker Đã Đổi</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Sao Còn Lại</th>
                  <th className="p-3.5 pl-4 whitespace-nowrap">Huy Hiệu Sở Hữu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredClassSts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                      Không tìm thấy học sinh nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredClassSts.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
                          idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-slate-900 flex items-center gap-2 text-left whitespace-nowrap">
                        <span>{getStudentAvatar(st.id, students).emoji}</span>
                        <span>{st.name}</span>
                      </td>
                      <td className="p-3.5 text-right text-amber-600 font-black">
                        {st.cumulativeStars} ⭐
                      </td>
                      <td className="p-3.5 text-right text-pink-600 font-black">
                        {st.exchangedStickers} quà
                      </td>
                      <td className="p-3.5 text-right text-emerald-600 font-black">
                        {st.currentStars} ⭐
                      </td>
                      <td className="p-3.5 pl-4">
                        {st.badges.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {st.badges.map((b, i) => (
                              <span key={i} className="bg-[#fffbf0] text-[#5c4327] text-[9px] font-black px-2 py-0.5 rounded-lg border border-[#cbb89d]">
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-normal">Chưa có</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#cbb89d]/50 flex justify-end">
          <button
            onClick={() => {
              setViewingDetailClassId(null);
              setClassSearchTerm('');
              scrollToFormTop();
            }}
            className="px-6 py-2.5 rounded-2xl border border-[#cbb89d] bg-white text-[#3d2b17] font-black hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 active:scale-95 text-xs uppercase shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#3d2b17]" />
            <span>Quay Lại</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. FULL WINDOW SUB-VIEW: BẢNG VINH DANH TOP 3 HỌC SINH XUẤT SẮC NHẤT THÁNG
  // =========================================================================
  if (isMonthlyHallOfFameOpen) {
    let activeSts = [...students];

    if (hallOfFameFilter === 'current-class' && selectedClass) {
      activeSts = students.filter(s => s.classId === selectedClass);
    } else if (hallOfFameFilter === 'grade-3' || hallOfFameFilter === 'grade-4' || hallOfFameFilter === 'grade-5') {
      const targetGradeId = parseInt(hallOfFameFilter.replace('grade-', ''), 10);
      const gradeClassIds = (classes || []).filter(c => c.gradeId === targetGradeId).map(c => c.id);
      activeSts = students.filter(s => gradeClassIds.includes(s.classId));
    }

    const sortedStudents = [...activeSts].sort((a, b) => {
      const starsA = getStarsForPeriod(a.id, 'month');
      const starsB = getStarsForPeriod(b.id, 'month');
      return starsB - starsA;
    });

    const top1 = sortedStudents[0];
    const top2 = sortedStudents[1];
    const top3 = sortedStudents[2];

    const getAvatarData = (s?: Student) => s ? getStudentAvatar(s.id, students) : { emoji: '⭐', bg: 'bg-amber-50' };

    return (
      <div className="w-full min-h-[85vh] bg-gradient-to-b from-[#2b1f13] via-[#3d2c1b] to-[#1e150d] border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-white relative overflow-hidden animate-fadeIn text-left">
        <FireworksCelebration
          isOpen={celebration.isOpen}
          onClose={() => setCelebration(prev => ({ ...prev, isOpen: false }))}
          studentId={celebration.studentId}
          studentName={celebration.studentName}
          studentClass={celebration.studentClass}
          badgeName={celebration.badgeName}
          students={students}
        />

        {/* Header with Return Button */}
        <div className="border-b border-amber-600/30 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
              <Trophy className="w-4 h-4 fill-amber-950" />
              <span>BẢNG VINH DANH THÁNG</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { setIsMonthlyHallOfFameOpen(false); scrollToFormTop(); }}
            className="text-xs text-amber-200 hover:text-white font-bold px-4 py-2.5 rounded-xl border border-amber-600/40 bg-amber-950/60 hover:bg-amber-900/80 transition cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang thi đua</span>
          </button>
        </div>

        {/* Celebration Title */}
        <div className="text-center space-y-1.5 mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight drop-shadow-md">
            🏆 TOP 3 HỌC SINH XUẤT SẮC NHẤT THÁNG 🏆
          </h2>
          <p className="text-xs text-amber-200/80 font-semibold">
            Tuyên dương 3 gương mặt tiêu biểu có thành tích tích lũy sao thi đua cao nhất!
          </p>
        </div>

        {/* Grade & Scope Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6 bg-[#1a110a] p-1.5 rounded-2xl border border-amber-600/30">
          {[
            { id: 'current-class', label: `Lớp ${selectedClass || ''}` },
            { id: 'grade-3', label: 'Toàn Khối 3' },
            { id: 'grade-4', label: 'Toàn Khối 4' },
            { id: 'grade-5', label: 'Toàn Khối 5' },
            { id: 'all-school', label: 'Toàn Trường' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                playButtonClickSound();
                setHallOfFameFilter(item.id as any);
                setPodiumAnimKey(prev => prev + 1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                hallOfFameFilter === item.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md border border-amber-300 scale-102'
                  : 'text-amber-200/70 hover:text-amber-100 hover:bg-amber-950/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 3D Podium Hall of Fame Showcase with Student Hopping Animation */}
        <div key={podiumAnimKey} className="grid grid-cols-3 gap-3 sm:gap-6 items-end justify-center mb-8 pt-4">
          
          {/* 🥈 TOP 2 SILVER (LEFT) */}
          <div className="flex flex-col items-center space-y-2 animate-podium-hop-2">
            {top2 ? (
              <>
                <div className="relative group cursor-pointer">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 shadow-[0_0_25px_rgba(203,213,225,0.7)] overflow-hidden flex items-center justify-center bg-slate-800">
                    {top2.avatarUrl ? (
                      <img src={top2.avatarUrl} alt={top2.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{getAvatarData(top2).emoji}</span>
                    )}
                  </div>
                  <span className="absolute -top-2 -right-1 bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 w-7 h-7 rounded-full font-black text-xs flex items-center justify-center border border-white shadow-md">
                    🥈
                  </span>
                </div>
                <div className="text-center">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-200 truncate max-w-[100px] sm:max-w-[130px]">{top2.name}</h4>
                  <span className="text-[10px] font-bold text-slate-400 block">Lớp: {top2.classId}</span>
                  <span className="inline-block mt-1 bg-slate-200/20 text-slate-200 font-black text-[11px] px-2.5 py-0.5 rounded-full border border-slate-300/30">
                    {getStarsForPeriod(top2.id, 'month')} ⭐
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-500">Chưa có</span>
            )}
            <div className="w-full bg-gradient-to-b from-slate-400/30 to-slate-600/40 rounded-t-xl h-16 flex items-center justify-center font-black text-slate-300 text-sm border-t-2 border-slate-300">
              TOP 2
            </div>
          </div>

          {/* 🥇 TOP 1 GOLD CHAMPION (CENTER - HIGHEST) */}
          <div className="flex flex-col items-center space-y-2 -translate-y-3 animate-podium-hop-1">
            {top1 ? (
              <>
                <div className="relative group cursor-pointer">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                    👑
                  </div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.9)] overflow-hidden flex items-center justify-center bg-amber-950 ring-4 ring-amber-300/40">
                    {top1.avatarUrl ? (
                      <img src={top1.avatarUrl} alt={top1.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{getAvatarData(top1).emoji}</span>
                    )}
                  </div>
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 w-8 h-8 rounded-full font-black text-sm flex items-center justify-center border-2 border-white shadow-lg">
                    🥇
                  </span>
                </div>
                <div className="text-center">
                  <h4 className="font-black text-sm sm:text-base text-amber-300 truncate max-w-[120px] sm:max-w-[150px] drop-shadow-md">{top1.name}</h4>
                  <span className="text-[11px] font-extrabold text-amber-200/90 block">Lớp: {top1.classId}</span>
                  <span className="inline-block mt-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-black text-xs px-3 py-0.5 rounded-full shadow-md border border-yellow-300">
                    {getStarsForPeriod(top1.id, 'month')} ⭐
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs text-amber-500">Chưa có</span>
            )}
            <div className="w-full bg-gradient-to-b from-amber-400/40 to-amber-600/50 rounded-t-xl h-24 flex items-center justify-center font-black text-amber-300 text-base border-t-2 border-amber-400 shadow-lg">
              QUÁN QUÂN
            </div>
          </div>

          {/* 🥉 TOP 3 BRONZE (RIGHT) */}
          <div className="flex flex-col items-center space-y-2 animate-podium-hop-3">
            {top3 ? (
              <>
                <div className="relative group cursor-pointer">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-700 shadow-[0_0_25px_rgba(217,119,6,0.7)] overflow-hidden flex items-center justify-center bg-amber-950">
                    {top3.avatarUrl ? (
                      <img src={top3.avatarUrl} alt={top3.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{getAvatarData(top3).emoji}</span>
                    )}
                  </div>
                  <span className="absolute -top-2 -right-1 bg-gradient-to-r from-amber-600 to-amber-800 text-white w-7 h-7 rounded-full font-black text-xs flex items-center justify-center border border-white shadow-md">
                    🥉
                  </span>
                </div>
                <div className="text-center">
                  <h4 className="font-extrabold text-xs sm:text-sm text-amber-200/90 truncate max-w-[100px] sm:max-w-[130px]">{top3.name}</h4>
                  <span className="text-[10px] font-bold text-amber-300/70 block">Lớp: {top3.classId}</span>
                  <span className="inline-block mt-1 bg-amber-700/30 text-amber-200 font-black text-[11px] px-2.5 py-0.5 rounded-full border border-amber-600/30">
                    {getStarsForPeriod(top3.id, 'month')} ⭐
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs text-amber-500">Chưa có</span>
            )}
            <div className="w-full bg-gradient-to-b from-amber-700/30 to-amber-900/40 rounded-t-xl h-12 flex items-center justify-center font-black text-amber-400 text-xs border-t-2 border-amber-600">
              TOP 3
            </div>
          </div>

        </div>

        {/* Celebration Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-amber-600/30">
          <button
            onClick={() => {
              setPodiumAnimKey(prev => prev + 1);
              playButtonClickSound();
            }}
            className="bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 font-black text-xs py-3 px-4 rounded-2xl border border-amber-600/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            title="Bấm để trình diễn lại hiệu ứng 3D nhân vật nhảy lên bục vinh danh"
          >
            <span>🏃 Nhảy Lên Bục Lại</span>
          </button>
          <button
            onClick={() => {
              setPodiumAnimKey(prev => prev + 1);
              triggerVictoryConfetti();
              playVictoryFanfareSound();
            }}
            className="flex-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-xs py-3 px-4 rounded-2xl shadow-lg border border-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <span>🎆 Bắn Pháo Hoa & Nhạc Mừng</span>
          </button>
          <button
            onClick={() => { setIsMonthlyHallOfFameOpen(false); scrollToFormTop(); }}
            className="bg-amber-950/80 hover:bg-amber-900 text-amber-200 font-bold text-xs py-3 px-5 rounded-2xl border border-amber-700/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DEFAULT CASE: TRANG CHÍNH ỨNG DỤNG THI ĐUA
  // =========================================================================
  return (
    <div className="space-y-4 sm:space-y-6 text-slate-800 pb-10">
      
      {/* 🌟 1. DESKOS IMAC WARM BEIGE CARD HEADER STRIP (CHUẨN VƯỜN TRI THỨC) */}
      <div className="border-2 border-[#cbb89d] rounded-3xl bg-[#fffbf0] overflow-hidden shadow-sm">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2 text-left">
            <span className="font-bold text-xs text-[#5c4327]">Đang chọn:</span>
            <span className="font-black text-xs text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg border border-[#cbb89d]">
              Lớp {selectedClass} • Khối {selectedGradeId}
            </span>
            {isRedemptionPeriod && (
              <span className="inline-flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-red-700 shadow-2xs">
                <span className="animate-ping inline-block w-1.5 h-1.5 bg-yellow-300 rounded-full mr-1 shrink-0" />
                <span>🔔 ĐỔI QUÀ (1-15 HÀNG THÁNG)</span>
              </span>
            )}
          </div>

          {/* Navigation Tab Buttons */}
          <nav className="flex items-center gap-1 bg-[#e4d3ba] p-1 rounded-xl border border-[#cbb89d] overflow-x-auto max-w-full">
            <button
              onClick={() => {
                playButtonClickSound();
                setActiveSubTab('comparison');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'comparison'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📊 So Sánh Thi Đua Khối</span>
            </button>
            <button
              onClick={() => {
                playButtonClickSound();
                setActiveSubTab('redemption');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'redemption'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>🎁 Cửa Hàng Đổi Thưởng</span>
            </button>
            <button
              onClick={handleOpenMonthlyHallOfFame}
              className="px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-[#3d2b17] hover:bg-[#d5c3aa]"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>🏆 Bảng Vinh Danh Tháng</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Automatic End-of-Lesson Honor Celebration Reminder Banner */}
      {showLessonEndReminder && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-amber-950 p-3.5 rounded-2xl border-2 border-yellow-300 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">🔔</span>
            <div className="text-left">
              <h4 className="font-black text-xs sm:text-sm uppercase tracking-wide">
                CẢNH BÁO TỰ ĐỘNG CUỐI TIẾT HỌC (SẮP HẾT GIỜ)!
              </h4>
              <p className="text-[11px] font-bold text-amber-900">
                Chỉ còn 5 phút nữa là kết thúc tiết học! Thầy/Cô có muốn bật Bảng Vinh Danh & Tổng Kết Thi Đua cho Lớp <strong className="underline">{selectedClass}</strong> không?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowLessonEndReminder(false);
                handleOpenMonthlyHallOfFame();
              }}
              className="bg-amber-950 hover:bg-black text-amber-300 font-black text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>🏆 Bật Bảng Vinh Danh Ngay</span>
            </button>
            <button
              onClick={() => setShowLessonEndReminder(false)}
              className="bg-white/40 hover:bg-white/60 text-amber-950 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer transition-all"
            >
              ⏰ Để sau
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'comparison' ? (
        <div className="space-y-6">
          
          {/* Grade Selector & Header Bar */}
          <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>SO SÁNH THI ĐUA CẤP KHỐI • KHỐI {selectedGradeId}</span>
                </h3>
                <p className="text-[11px] font-bold text-[#5c4327]">Theo dõi, vinh danh và so sánh tổng điểm thi đua hàng tuần giữa các lớp</p>
              </div>
              <div className="flex items-center gap-1 bg-[#e4d3ba] p-1 rounded-xl border border-[#cbb89d]">
                <span className="text-[10px] font-black text-[#5c4327] px-1.5 flex items-center gap-1">
                  Chọn Khối:
                </span>
                {allGrades.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGradeId(g.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                      selectedGradeId === g.id
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grade Emulation Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Top Class */}
            <div className="bg-white p-4.5 rounded-2xl border border-[#cbb89d] shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-200">
                <Trophy className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#5c4327] font-black uppercase block tracking-wider">Lớp dẫn đầu khối</span>
                <strong className="text-base text-slate-900 font-black block">
                  {topClass ? `Lớp ${topClass.name}` : 'N/A'}
                </strong>
                <span className="text-[11px] text-emerald-700 font-black block">
                  {topClass ? `${topClass.averageStars} ⭐ / học sinh` : '--'}
                </span>
              </div>
            </div>

            {/* Total Grade Stars */}
            <div className="bg-white p-4.5 rounded-2xl border border-[#cbb89d] shadow-xs flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600 border border-yellow-200">
                <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#5c4327] font-black uppercase block tracking-wider">Tổng sao tích lũy khối</span>
                <strong className="text-base text-slate-900 font-black block">
                  {gradeTotalStars} ⭐
                </strong>
                <span className="text-[10px] text-slate-500 font-bold block">
                  Từ {gradeTotalStudents} học sinh
                </span>
              </div>
            </div>

            {/* Total Stickers Exchanged */}
            <div className="bg-white p-4.5 rounded-2xl border border-[#cbb89d] shadow-xs flex items-center gap-4">
              <div className="p-3 bg-pink-50 rounded-2xl text-pink-600 border border-pink-200">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#5c4327] font-black uppercase block tracking-wider">Sticker đã trao tay</span>
                <strong className="text-base text-slate-900 font-black block">
                  {gradeTotalStickers} quà
                </strong>
                <span className="text-[10px] text-pink-600 font-bold block">
                  Phần thưởng đổi sao
                </span>
              </div>
            </div>

            {/* Grade MVP */}
            <div className="bg-white p-4.5 rounded-2xl border border-[#cbb89d] shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 border border-emerald-200">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 overflow-hidden">
                <span className="text-[10px] text-[#5c4327] font-black uppercase block tracking-wider">Siêu sao khối {selectedGradeId}</span>
                <strong className="text-xs text-slate-900 font-black block truncate">
                  {gradeMVP ? gradeMVP.name : 'N/A'}
                </strong>
                <span className="text-[10px] text-emerald-700 font-black block truncate">
                  {gradeMVP ? `${gradeMVP.cumulativeStars} ⭐ (Lớp ${classes?.find(c => c.id === gradeMVP.classId)?.name || ''})` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Chart & Detailed comparison layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Chart - Left */}
            <div className="lg:col-span-2 border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs text-left">
              <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-[#3d2b17] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    Biểu Đồ So Sánh Sao Trung Bình / Học Sinh
                  </h4>
                  <p className="text-[11px] text-[#5c4327] font-bold">Chỉ số công bằng nhất thể hiện phong trào thi đua của tập thể lớp</p>
                </div>
                <span className="text-[10px] font-black text-emerald-800 bg-white/80 border border-[#cbb89d] px-2.5 py-1 rounded-full uppercase">
                  Sao trung bình
                </span>
              </div>

              <div className="p-5 bg-white space-y-4">
                {classComparisonList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-bold text-xs">
                    Chưa có lớp học nào được phân công trong khối này.
                  </div>
                ) : (
                  classComparisonList.map((classData, index) => {
                    const maxAverage = Math.max(...classComparisonList.map(c => c.averageStars), 1);
                    const percent = Math.min(100, Math.round((classData.averageStars / maxAverage) * 100));
                    
                    let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-600';
                    let rankBadge = 'bg-slate-100 text-slate-600';
                    if (index === 0) {
                      barColor = 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500';
                      rankBadge = 'bg-amber-100 text-amber-700 font-black border border-amber-300';
                    } else if (index === 1) {
                      barColor = 'bg-gradient-to-r from-slate-400 to-slate-500';
                      rankBadge = 'bg-slate-200 text-slate-700 font-black border border-slate-300';
                    } else if (index === 2) {
                      barColor = 'bg-gradient-to-r from-orange-400 to-orange-500';
                      rankBadge = 'bg-orange-100 text-orange-700 font-black border border-orange-300';
                    }

                    return (
                      <div key={classData.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${rankBadge}`}>
                              {index + 1}
                            </span>
                            <span className="font-black text-slate-800">Lớp {classData.name}</span>
                            <span className="text-[10px] text-slate-400">({classData.studentCount} HS)</span>
                            {index === 0 && (
                              <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-0.5 uppercase tracking-wide">
                                🏆 Dẫn đầu
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-900 text-xs">{classData.averageStars} ⭐ / HS</span>
                            <span className="text-[10px] text-slate-400 font-bold">(Tổng: {classData.totalStars} ⭐)</span>
                          </div>
                        </div>
                        
                        <div className="h-4.5 w-full bg-[#faf7f0] rounded-full overflow-hidden border border-[#d8cbba] flex shadow-inner">
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

            {/* Quick guide / Emulation rules info - Right */}
            <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] p-5 text-xs text-left flex flex-col justify-between space-y-4 shadow-xs">
              <div>
                <h4 className="font-black text-[#3d2b17] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-[#cbb89d] pb-2.5 mb-3">
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  QUY CHẾ THI ĐUA KHỐI
                </h4>
                <div className="space-y-3 text-[#5c4327] font-medium leading-relaxed">
                  <p>
                    🌟 <strong>Sao vàng danh dự:</strong> Điểm số thi đua của lớp được tích lũy từ hoạt động xây dựng bài, làm bài tập đầy đủ và các dự án tin học của học sinh.
                  </p>
                  <p>
                    📊 <strong>Công thức so sánh:</strong> 
                    <span className="block mt-1 bg-white px-3 py-1.5 rounded-xl border border-[#cbb89d] font-mono text-[10px] text-emerald-800 font-black text-center">
                      Sao Trung Bình = Tổng Sao / Sĩ Số Lớp
                    </span>
                    Việc chia trung bình giúp việc so sánh công bằng tuyệt đối giữa các lớp có sĩ số khác nhau.
                  </p>
                  <p>
                    🏵️ <strong>Kỷ luật tích cực:</strong> Học sinh giữ kỷ luật tốt, không bị nhắc nhở sẽ giữ vững điểm số thi đua tuần cho lớp học.
                  </p>
                </div>
              </div>
              <div className="bg-amber-100/70 border border-amber-300 p-3.5 rounded-2xl text-[11px] text-amber-950 font-bold">
                <span className="font-black text-amber-900 block mb-0.5">💡 Lưu ý quan trọng:</span>
                Nhà trường sẽ tổ chức trao cờ luân lưu cho lớp dẫn đầu khối vào lễ chào cờ thứ Hai tuần kế tiếp.
              </div>
            </div>

          </div>

          {/* Detailed table of comparison */}
          <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-black text-[#3d2b17] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  BẢNG ĐIỂM THI ĐUA KHỐI CHI TIẾT
                </h4>
                <p className="text-[11px] text-[#5c4327] font-bold">Bảng phân tích và xếp hạng chính xác kết quả tích lũy</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-[#fffbf0]">
              <div className="overflow-x-auto rounded-2xl border border-[#cbb89d] bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#e8d7c0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                      <th className="p-3.5 pl-4 text-center w-14 whitespace-nowrap">Hạng</th>
                      <th className="p-3.5 whitespace-nowrap">Lớp</th>
                      <th className="p-3.5 text-center whitespace-nowrap">Sĩ Số</th>
                      <th className="p-3.5 text-right whitespace-nowrap">Tổng Sao Vàng</th>
                      <th className="p-3.5 text-right whitespace-nowrap">Sao Trung Bình / HS</th>
                      <th className="p-3.5 text-center whitespace-nowrap">Sticker Đã Đổi</th>
                      <th className="p-3.5 pl-6 whitespace-nowrap">Học Sinh Đứng Đầu Lớp</th>
                      <th className="p-3.5 text-center pr-4 whitespace-nowrap">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {classComparisonList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                          Chưa có dữ liệu thi đua trong khối này.
                        </td>
                      </tr>
                    ) : (
                      classComparisonList.map((classData, index) => {
                        let rowBg = 'hover:bg-slate-50/80';
                        let badgeClass = 'bg-slate-100 text-slate-600';
                        if (index === 0) {
                          rowBg = 'bg-amber-50/30 hover:bg-amber-50/60';
                          badgeClass = 'bg-amber-100 text-amber-800 font-black border border-amber-300';
                        } else if (index === 1) {
                          badgeClass = 'bg-slate-200 text-slate-800 font-black border border-slate-300';
                        } else if (index === 2) {
                          badgeClass = 'bg-orange-100 text-orange-800 font-black border border-orange-300';
                        }

                        return (
                          <tr key={classData.id} className={`transition-colors ${rowBg}`}>
                            <td className="p-3.5 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${badgeClass}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="p-3.5 font-black text-slate-900">
                              Lớp {classData.name}
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-500">
                              {classData.studentCount} HS
                            </td>
                            <td className="p-3.5 text-right text-slate-900 font-black">
                              {classData.totalStars} ⭐
                            </td>
                            <td className="p-3.5 text-right text-emerald-700 font-black">
                              {classData.averageStars} ⭐
                            </td>
                            <td className="p-3.5 text-center text-pink-600 font-black">
                              {classData.totalStickers} Sticker
                            </td>
                            <td className="p-3.5 pl-6 text-slate-600">
                              {classData.topStudent ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">👑</span>
                                  <span className="font-black text-slate-800">{classData.topStudent.name}</span>
                                  <span className="bg-amber-500 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-md border border-yellow-300">
                                    {classData.topStudentStars} ⭐
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">--</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center pr-4">
                              <button
                                onClick={() => {
                                  setViewingDetailClassId(classData.id);
                                  setClassSearchTerm('');
                                  scrollToFormTop();
                                }}
                                className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-black text-[10px] uppercase border border-sky-200 shadow-2xs transition-all cursor-pointer"
                              >
                                Xem Chi Tiết
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

          {/* Wall of Fame Grade Top 10 */}
          <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs text-left">
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-black text-[#3d2b17] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                  BẢNG VÀNG VINH DANH KHỐI {selectedGradeId}
                </h4>
                <p className="text-[11px] text-[#5c4327] font-bold">Top 10 học sinh tích lũy sao vàng xuất sắc nhất toàn khối</p>
              </div>
              <span className="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-3.5 py-1 rounded-full uppercase flex items-center gap-1 shrink-0">
                ✨ SIÊU SAO HỌC ĐƯỜNG
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-[#fffbf0] space-y-4">
              {/* Bộ lọc thời gian cho Bảng Vàng */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#e8d7c0]/50 p-3 rounded-2xl border border-[#cbb89d]">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-700" />
                  <span className="text-[11px] font-black text-[#3d2b17] uppercase tracking-wider">Thời gian thi đua:</span>
                </div>
                <div className="flex items-center gap-1 bg-[#e4d3ba] p-1 rounded-xl border border-[#cbb89d] self-stretch sm:self-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setEmulationPeriod('week')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase transition-all duration-200 flex items-center gap-1 cursor-pointer flex-1 sm:flex-none justify-center ${
                      emulationPeriod === 'week'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    Tuần này
                  </button>
                  <button
                    onClick={() => setEmulationPeriod('month')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase transition-all duration-200 flex items-center gap-1 cursor-pointer flex-1 sm:flex-none justify-center ${
                      emulationPeriod === 'month'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Tháng này
                  </button>
                  <button
                    onClick={() => setEmulationPeriod('semester')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase transition-all duration-200 flex items-center gap-1 cursor-pointer flex-1 sm:flex-none justify-center ${
                      emulationPeriod === 'semester'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
                    }`}
                  >
                    <Trophy className="w-3 h-3" />
                    Học kỳ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topStudentsInGrade.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-slate-400 font-bold text-xs">
                    Chưa có dữ liệu học sinh trong khối này.
                  </div>
                ) : (
                  topStudentsInGrade.map((student, idx) => {
                    const studentClass = classes?.find(c => c.id === student.classId);
                    
                    let rankColor = 'w-7 h-7 bg-slate-100 text-slate-600 border border-slate-200/80 font-bold';
                    let borderColor = 'border-[#cbb89d]';
                    let cardBg = 'bg-white hover:bg-amber-50/20';
                    if (idx === 0) {
                      rankColor = 'w-9 h-9 bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 text-amber-950 font-black shadow-md ring-4 ring-amber-400/20 text-sm';
                      borderColor = 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]';
                      cardBg = 'bg-amber-50/30 hover:bg-amber-50/50';
                    } else if (idx === 1) {
                      rankColor = 'w-8 h-8 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-800 font-black border border-slate-300 shadow-xs';
                      borderColor = 'border-slate-300';
                      cardBg = 'bg-slate-50/30 hover:bg-slate-100/50';
                    } else if (idx === 2) {
                      rankColor = 'w-8 h-8 bg-gradient-to-br from-amber-200 via-orange-300 to-amber-600 text-white font-black border border-orange-300 shadow-xs';
                      borderColor = 'border-orange-300';
                      cardBg = 'bg-orange-50/30 hover:bg-orange-50/50';
                    }

                    return (
                      <div 
                        key={student.id} 
                        className={`${cardBg} border ${borderColor} rounded-2xl p-3 flex items-center justify-between transition-all shadow-2xs`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center rounded-full shrink-0 ${rankColor}`}>
                            {idx + 1}
                          </span>
                          <span className="text-lg">
                            {getStudentAvatar(student.id, students).emoji}
                          </span>
                          <div>
                            <strong className="text-xs font-black block text-slate-800">{student.name}</strong>
                            <span className="text-[10px] text-slate-500 font-bold">Lớp {studentClass ? studentClass.name : student.classId}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-600 flex items-center gap-0.5">
                            {student.cumulativeStars} <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 inline" />
                          </span>
                          {student.exchangedStickers > 0 && (
                            <span className="bg-pink-100 text-pink-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-pink-200 uppercase">
                              🎁 {student.exchangedStickers} Sticker
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
          {/* Left Column: Guidelines */}
          <div className="lg:col-span-1 space-y-4">
            
            <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
              <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                <h4 className="font-black text-[#3d2b17] text-xs uppercase tracking-wider">
                  QUY CHẾ ĐỔI STICKER
                </h4>
              </div>
              
              <div className="p-4 bg-[#fffbf0] space-y-4">
                <p className="text-[11px] text-[#5c4327] font-bold leading-relaxed text-left">
                  Học sinh đạt thành tích tốt sẽ dùng quỹ sao vàng tích lũy đổi trực tiếp các loại sticker thực tế:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Sticker 1 */}
                  <div className="bg-white p-2.5 rounded-xl border border-[#cbb89d] flex flex-col items-center text-center justify-between min-h-[145px] group hover:border-emerald-500 hover:bg-emerald-50/10 transition-all shadow-2xs">
                    <div className="my-1 flex items-center justify-center">
                      <StickerAvatar 
                        emoji="👍" 
                        studentId="👍Sticker Chăm Ngoan" 
                        size="w-12 h-12" 
                        className="transform group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="w-full">
                      <strong className="text-[10px] font-black text-slate-800 block leading-tight uppercase tracking-wider">Chăm Ngoan</strong>
                      <span className="text-[9px] text-emerald-700 font-black block mt-1.5">Phí: 5 ⭐</span>
                    </div>
                  </div>

                  {/* Sticker 2 */}
                  <div className="bg-white p-2.5 rounded-xl border border-[#cbb89d] flex flex-col items-center text-center justify-between min-h-[145px] group hover:border-blue-500 hover:bg-blue-50/10 transition-all shadow-2xs">
                    <div className="my-1 flex items-center justify-center">
                      <StickerAvatar 
                        emoji="⚡" 
                        studentId="⚡Sticker Siêu Nhân Tin Học" 
                        size="w-12 h-12" 
                        className="transform group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="w-full">
                      <strong className="text-[10px] font-black text-slate-800 block leading-tight uppercase tracking-wider">Siêu Nhân</strong>
                      <span className="text-[9px] text-blue-700 font-black block mt-1.5">Phí: 10 ⭐</span>
                    </div>
                  </div>

                  {/* Sticker 3 */}
                  <div className="bg-white p-2.5 rounded-xl border border-[#cbb89d] flex flex-col items-center text-center justify-between min-h-[145px] group hover:border-indigo-500 hover:bg-indigo-50/10 transition-all shadow-2xs">
                    <div className="my-1 flex items-center justify-center">
                      <StickerAvatar 
                        emoji="🛡️" 
                        studentId="🛡️Sticker Chiến Binh" 
                        size="w-12 h-12" 
                        className="transform group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="w-full">
                      <strong className="text-[10px] font-black text-slate-800 block leading-tight uppercase tracking-wider">Chiến Binh</strong>
                      <span className="text-[9px] text-indigo-700 font-black block mt-1.5">Phí: 15 ⭐</span>
                    </div>
                  </div>

                  {/* Sticker 4 */}
                  <div className="bg-white p-2.5 rounded-xl border border-[#cbb89d] flex flex-col items-center text-center justify-between min-h-[145px] group hover:border-rose-500 hover:bg-rose-50/10 transition-all shadow-2xs">
                    <div className="my-1 flex items-center justify-center">
                      <StickerAvatar 
                        emoji="🎖️" 
                        studentId="🎖️Sticker Siêu Sao Tin Học" 
                        size="w-12 h-12" 
                        className="transform group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="w-full">
                      <strong className="text-[10px] font-black text-slate-800 block leading-tight uppercase tracking-wider">Siêu Sao</strong>
                      <span className="text-[9px] text-rose-700 font-black block mt-1.5">Phí: 20 ⭐</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="bg-[#e8d7c0]/50 p-4 rounded-2xl border border-[#cbb89d] text-[11px] text-[#5c4327] text-left">
              <strong className="text-[#3d2b17] font-black block mb-1">💡 Hướng dẫn dành cho thầy cô:</strong>
              <p className="leading-relaxed font-bold">
                Vào cuối tháng, giáo viên sẽ trao tận tay sticker thực tế cho học sinh theo đúng lịch sử đổi quà trên hệ thống.
              </p>
            </div>

          </div>

          {/* Right list: Student star list & exchange center */}
          <div className="lg:col-span-3 border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs text-left">
            
            <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-left">
                <h3 className="font-black text-[#3d2b17] text-xs sm:text-sm uppercase tracking-wider">
                  Góc Quầy Đổi Thưởng: Lớp <span className="bg-white/80 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-lg border border-[#cbb89d]">{selectedClass}</span>
                </h3>
                <p className="text-[11px] text-[#5c4327] font-bold">Ấn vào học sinh để mở quầy đổi quà sticker rực rỡ</p>
              </div>
              <span className="text-[10px] font-black text-[#5c4327] bg-[#e4d3ba] border border-[#cbb89d] px-3 py-1 rounded-full uppercase">
                Sổ Thi Đua Chuyên Cần
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-[#fffbf0] space-y-4">
              {/* Quick Search */}
              <div className="relative max-w-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên học sinh cần đổi quà..."
                  className="w-full text-xs pl-9 pr-4 py-2 border border-[#cbb89d] rounded-xl bg-white focus:outline-none focus:border-emerald-500 font-bold text-slate-800 shadow-2xs"
                />
              </div>

              {/* Grid of student evaluation cards */}
              {paginatedStudents.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {paginatedStudents.map((s) => {
                    const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
                    const seatObj = seatId ? computers.find(c => c.id === seatId) : null;
                    
                    const stars = getStudentCurrentStars(s.id);
                    const avatar = getStudentAvatar(s.id, students);
                    const badge = getStudentBadge(stars);

                    return (
                      <div 
                        key={s.id} 
                        onClick={() => {
                          setSelectedStudentForReward(s);
                          scrollToFormTop();
                        }}
                        className="bg-white p-4 rounded-3xl border border-amber-300/80 shadow-[0_6px_0_0_#f59e0b,0_10px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_9px_0_0_#d97706,0_15px_25px_rgba(245,158,11,0.3)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-[0_2px_0_0_#b45309] transition-all flex flex-col items-center justify-center relative text-center select-none cursor-pointer group duration-150 min-h-[180px] h-[180px] overflow-hidden"
                      >
                        {/* Honey Beehive Frame Decoration */}
                        <HoneyBeeCardFrameDecoration />

                        {/* Star count badge at Top-Right - Inside dashed yellow border */}
                        <div className="absolute top-3.5 right-3.5 z-10 text-amber-600 font-extrabold text-[12px] flex items-center gap-1 select-none drop-shadow-2xs">
                          <span className="font-black">{stars}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        </div>

                        {/* Circular Avatar with Achievement Badge Frame */}
                        <div className="relative my-1 shrink-0 z-10">
                          <StickerAvatar 
                            emoji={avatar.emoji} 
                            studentId={s.id} 
                            bg={avatar.bg}
                            size="w-18 h-18" 
                            className={`${badge ? badge.ringClass : ''}`}
                            avatarUrl={s.avatarUrl}
                          />
                          {badge && (
                            <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 rounded-full text-[7.5px] font-black border uppercase tracking-wider whitespace-nowrap shadow-md flex items-center gap-0.5 scale-90 group-hover:scale-95 transition-all ${badge.badgeClass}`}>
                              <span>{badge.emoji}</span>
                              <span>{badge.label}</span>
                            </span>
                          )}
                        </div>

                        {/* Full Name & Code */}
                        <div className="flex flex-col items-center justify-center mt-2 max-w-full z-10">
                          <strong className="text-xs font-extrabold text-slate-800 leading-tight truncate w-full" title={s.name}>
                            {formatDisplayName(s.name)}
                          </strong>
                        </div>

                        {/* Machine Pill Badge instead of Level */}
                        <span className="inline-block bg-[#fffbf0] text-[#5c4327] border border-[#cbb89d] px-3 py-0.5 rounded-full text-[10px] font-black mt-1.5 z-10">
                          {seatObj ? `💻 ${seatObj.name}` : 'Chưa xếp máy'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  Không có học sinh nào đạt đủ điều kiện đổi quà (từ 5 sao trở lên) hoặc không tìm thấy học sinh phù hợp.
                </div>
              )}

              {/* Pagination Controls */}
              {filteredStudents.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-[#cbb89d]/60 text-xs font-bold text-[#5c4327]">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    {/* Page size selector */}
                    <div className="flex items-center gap-2">
                      <span>Hiển thị</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-white border border-[#cbb89d] rounded-xl px-2.5 py-1.5 font-bold text-slate-700 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                      <span className="font-black text-[#3d2b17]">
                        {Math.min((currentPage - 1) * pageSize + 1, totalStudents)} - {Math.min(currentPage * pageSize, totalStudents)}
                      </span>
                      <span> trên </span>
                      <strong className="text-amber-700 font-black">{totalStudents}</strong>
                      <span> học sinh</span>
                    </div>
                  </div>

                  {/* Pagination buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-black transition flex items-center gap-1 ${
                        currentPage === 1
                          ? 'bg-white/50 text-slate-300 border-[#cbb89d]/40 cursor-not-allowed'
                          : 'bg-white hover:bg-slate-50 text-[#3d2b17] border-[#cbb89d] cursor-pointer'
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
                              ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-[#3d2b17] border-[#cbb89d] cursor-pointer'
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
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-black transition flex items-center gap-1 ${
                        currentPage === totalPages
                          ? 'bg-white/50 text-slate-300 border-[#cbb89d]/40 cursor-not-allowed'
                          : 'bg-white hover:bg-slate-50 text-[#3d2b17] border-[#cbb89d] cursor-pointer'
                      }`}
                    >
                      Sau ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
