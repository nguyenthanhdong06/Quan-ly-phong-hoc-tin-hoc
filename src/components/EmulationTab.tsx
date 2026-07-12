import React, { useState, useMemo } from 'react';
import { Student, EmulationDataState, SeatingChart, Computer, ClassItem, Grade } from '../types';
import { Award, ShoppingBag, HelpCircle, Search, Sparkles, Check, Star, X, BarChart3, Trophy, TrendingUp } from 'lucide-react';
import FireworksCelebration from './FireworksCelebration';

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
    { emoji: "🦀", bg: "bg-amber-100/60 border-pink-100"},
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

const StickerAvatar = ({ emoji, studentId, size = 'w-16 h-16', className = '', avatarUrl }: { emoji: string; studentId: string; size?: string; className?: string; avatarUrl?: string }) => {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const gradientBgs = [
    'from-[#5cd6ff] via-[#38bcf2] to-[#1294d9]', // Soft Sky Blue
    'from-[#6be4a0] via-[#4fd087] to-[#2cb46a]', // Fresh Emerald Mint
    'from-[#ff8cb8] via-[#f7629b] to-[#dc3a74]', // Candy Strawberry Pink
    'from-[#ffb443] via-[#f8951d] to-[#d67200]', // Warm Honey Orange
    'from-[#ab8fff] via-[#8565f4] to-[#6039e1]', // Cosmic Violet Indigo
    'from-[#ffd93d] via-[#fbc118] to-[#e0a000]', // Golden Sunny Yellow
    'from-[#4ade80] via-[#22c55e] to-[#15803d]', // Bright Garden Green
    'from-[#f472b6] via-[#ec4899] to-[#be185d]', // Flamingo Pink
    'from-[#fb7185] via-[#f43f5e] to-[#be123c]', // Coral Rose Red
    'from-[#38bdf8] via-[#0ea5e9] to-[#0369a1]', // Oceanic Deep Blue
    'from-[#fecaca] via-[#f87171] to-[#dc2626]', // Cherry Red
    'from-[#fda4af] via-[#fb7185] to-[#e11d48]', // Rose Red
    'from-[#f9a8d4] via-[#ec4899] to-[#be185d]', // Bubble Pink
    'from-[#fbcfe8] via-[#f472b6] to-[#db2777]', // Candy Pink
    'from-[#ccfbf1] via-[#5eead4] to-[#14b8a6]', // Fresh Teal
    'from-[#99f6e4] via-[#2dd4bf] to-[#0f766e]', // Aqua Teal
    'from-[#d1fae5] via-[#34d399] to-[#059669]', // Spring Green
    'from-[#f0fdf4] via-[#86efac] to-[#22c55e]', // Light Spring
    'from-[#fef9c3] via-[#fde047] to-[#f59e0b]', // Honey Yellow
    'from-[#f5d0fe] via-[#d946ef] to-[#a21caf]', // Orchid Pink
    'from-[#a5f3fc] via-[#22d3ee] to-[#0891b2]', // Aqua Cyan
    'from-[#6ee7f9] via-[#06b6d4] to-[#0e7490]', // Tropical Cyan
  ];

  const currentGradient = gradientBgs[hash % gradientBgs.length];

  return (
    <div className={`relative rounded-full aspect-square flex items-center justify-center border-2 border-white shadow-sm bg-gradient-to-tr ${currentGradient} select-none transition-all duration-300 overflow-hidden ${size} ${className}`}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          className="w-[85%] h-[85%] object-cover rounded-full relative z-10"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span 
          className="text-[1.85em] relative z-10 leading-none saturate-120 contrast-105 select-none pointer-events-none transform group-hover:scale-110 duration-200"
          style={{
            imageRendering: 'pixelated',
          }}
        >
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
  grades
}: EmulationTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStudentForReward, setSelectedStudentForReward] = useState<Student | null>(null);
  
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

  // Subtabs within EmulationTab
  const [activeSubTab, setActiveSubTab] = useState<'comparison' | 'redemption'>('comparison');
  
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
      return {
        ...s,
        cumulativeStars: stState.cumulativeStars || 0,
        exchangedStickers: stState.exchangedStickers || 0,
        badges: stState.badges || []
      };
    }).sort((a, b) => b.cumulativeStars - a.cumulativeStars)
      .slice(0, 10);
  }, [classes, selectedGradeId, students, emulationDataState]);

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
    setCelebration({
      isOpen: true,
      studentId,
      studentName,
      studentClass: sClass,
      badgeName
    });

    showToast(`Chúc mừng bé "${studentName}" đã đổi thành công Sticker: "${badgeName}"! (-${starCost} ⭐)`);
  };

  return (
    <div className="space-y-6">

      {/* Promotional Banner with Blinking status warning */}
      <div className="bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 text-left">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 p-3 rounded-2xl text-yellow-100 text-4xl shadow-inner animate-bounce">
            🏆
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider">Cửa Hàng Học Tập • Đổi Sao Lấy Quà</h2>
            <p className="text-xs text-amber-100 font-medium">Tích lũy sao vàng thực hành hàng tháng để nhận được nhiều huy hiệu sticker rực rỡ.</p>
            
            {isRedemptionPeriod && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-red-700 text-yellow-250 text-xs font-black px-3.5 py-1.5 rounded-full border-2 border-yellow-300 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>🔔 ĐANG HỖ TRỢ ĐỔI QUÀ ĐẠT ĐỈNH (TỪ NGÀY 1 ĐẾN 15 HÀNG THÁNG)</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/20 border border-white/30 px-5 py-3 rounded-2xl text-center relative z-10 w-full md:w-auto">
          <span className="text-sm font-black text-white block uppercase">Bản tin học kỳ</span>
          <span className="text-xl font-black text-yellow-200">Tháng 06/2026</span>
        </div>
      </div>

      {/* Subtab navigation */}
      <div className="flex bg-slate-100 p-1 rounded-2xl max-w-md border border-slate-200/60 shadow-inner">
        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase transition-all duration-150 cursor-pointer ${
            activeSubTab === 'comparison'
              ? 'bg-white text-blue-600 shadow-md border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          So Sánh Thi Đua Khối
        </button>
        <button
          onClick={() => setActiveSubTab('redemption')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase transition-all duration-150 cursor-pointer ${
            activeSubTab === 'redemption'
              ? 'bg-white text-blue-600 shadow-md border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Cửa Hàng Đổi Thưởng
        </button>
      </div>

      {activeSubTab === 'comparison' ? (
        <div className="space-y-6">
          {/* Grade Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-150 shadow-sm text-left">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Trophy className="w-5 h-5 text-amber-500" />
                So Sánh Thi Đua Cấp Khối
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Theo dõi, vinh danh và so sánh tổng điểm thi đua hàng tuần giữa các lớp trong cùng một khối</p>
            </div>
            <div className="flex gap-2">
              {allGrades.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGradeId(g.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border cursor-pointer ${
                    selectedGradeId === g.id
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Emulation Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Top Class */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 border border-amber-200/50">
                <Trophy className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Lớp dẫn đầu khối</span>
                <strong className="text-base text-slate-900 font-black block">
                  {topClass ? `Lớp ${topClass.name}` : 'N/A'}
                </strong>
                <span className="text-[10px] text-emerald-600 font-extrabold block">
                  {topClass ? `${topClass.averageStars} ⭐ / học sinh` : '--'}
                </span>
              </div>
            </div>

            {/* Total Grade Stars */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-500 border border-yellow-200/50">
                <Star className="w-6 h-6 fill-yellow-500" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Tổng sao tích lũy khối</span>
                <strong className="text-base text-slate-900 font-black block">
                  {gradeTotalStars} ⭐
                </strong>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Từ {gradeTotalStudents} học sinh
                </span>
              </div>
            </div>

            {/* Total Stickers Exchanged */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-pink-50 rounded-2xl text-pink-500 border border-pink-200/50">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Sticker đã trao tay</span>
                <strong className="text-base text-slate-900 font-black block">
                  {gradeTotalStickers} quà
                </strong>
                <span className="text-[10px] text-pink-600 font-semibold block">
                  Phần thưởng đổi sao
                </span>
              </div>
            </div>

            {/* Grade MVP */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 border border-teal-200/50">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1 overflow-hidden">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Siêu sao khối {selectedGradeId}</span>
                <strong className="text-xs text-slate-900 font-black block truncate">
                  {gradeMVP ? gradeMVP.name : 'N/A'}
                </strong>
                <span className="text-[10px] text-teal-600 font-extrabold block truncate">
                  {gradeMVP ? `${gradeMVP.cumulativeStars} ⭐ (Lớp ${classes?.find(c => c.id === gradeMVP.classId)?.name || ''})` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Chart & detailed comparison layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Chart - Left */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6 text-left">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Biểu Đồ So Sánh Sao Trung Bình / Học Sinh
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">Chỉ số công bằng nhất thể hiện phong trào thi đua của tập thể lớp</p>
                </div>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-full uppercase">
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
                    
                    let barColor = 'bg-gradient-to-r from-blue-500 to-indigo-500';
                    let rankBadge = 'bg-slate-100 text-slate-600';
                    if (index === 0) {
                      barColor = 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500';
                      rankBadge = 'bg-amber-100 text-amber-700 font-black';
                    } else if (index === 1) {
                      barColor = 'bg-gradient-to-r from-slate-400 to-slate-500';
                      rankBadge = 'bg-slate-250 text-slate-700 font-black';
                    } else if (index === 2) {
                      barColor = 'bg-gradient-to-r from-orange-400 to-orange-500';
                      rankBadge = 'bg-orange-100 text-orange-700 font-black';
                    }

                    return (
                      <div key={classData.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-extrabold ${rankBadge}`}>
                              {index + 1}
                            </span>
                            <span className="font-extrabold text-slate-700">Lớp {classData.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold">({classData.studentCount} HS)</span>
                            {index === 0 && <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50 flex items-center gap-0.5 uppercase tracking-wide">🏆 Dẫn đầu</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-800 text-xs">{classData.averageStars} ⭐ / HS</span>
                            <span className="text-[10px] text-slate-400 font-bold">(Tổng: {classData.totalStars} ⭐)</span>
                          </div>
                        </div>
                        
                        <div className="h-4.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-150/50 flex shadow-inner">
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
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs text-left flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b pb-2.5 mb-3">
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  QUY CHẾ THI ĐUA KHỐI
                </h4>
                <div className="space-y-3.5 text-slate-600 font-medium">
                  <p className="leading-relaxed">
                    🌟 <strong>Sao vàng danh dự:</strong> Điểm số thi đua của lớp được tích lũy từ hoạt động xây dựng bài, làm bài tập đầy đủ và các dự án tin học của học sinh.
                  </p>
                  <p className="leading-relaxed">
                    📊 <strong>Công thức so sánh:</strong> 
                    <span className="block mt-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 font-mono text-[10px] text-indigo-700 font-extrabold text-center">
                      Sao Trung Bình = Tổng Sao / Sĩ Số Lớp
                    </span>
                    Việc chia trung bình giúp việc so sánh công bằng tuyệt đối giữa các lớp có sĩ số khác nhau.
                  </p>
                  <p className="leading-relaxed">
                    🏵️ <strong>Kỷ luật tích cực:</strong> Học sinh giữ kỷ luật tốt, không bị nhắc nhở sẽ giữ vững điểm số thi đua tuần cho lớp học.
                  </p>
                </div>
              </div>
              <div className="bg-amber-100/50 border border-amber-200/50 p-3.5 rounded-2xl text-[11px] text-amber-900 font-semibold">
                <span className="font-bold text-amber-800 block mb-0.5">💡 Lưu ý quan trọng:</span>
                Nhà trường sẽ tổ chức trao cờ luân lưu cho lớp dẫn đầu khối vào lễ chào cờ thứ Hai tuần kế tiếp.
              </div>
            </div>

          </div>

          {/* Detailed table of comparison */}
          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Bảng Điểm Thi Đua Khối Chi Tiết
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">Bảng phân tích và xếp hạng chính xác kết quả tích lũy</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 pl-4 text-center w-14">Hạng</th>
                    <th className="p-3">Lớp</th>
                    <th className="p-3 text-center">Sĩ Số</th>
                    <th className="p-3 text-right">Tổng Sao Vàng</th>
                    <th className="p-3 text-right">Sao Trung Bình / HS</th>
                    <th className="p-3 text-center">Sticker Đã Đổi</th>
                    <th className="p-3 pl-6">Học Sinh Đứng Đầu Lớp</th>
                    <th className="p-3 text-center pr-4">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                  {classComparisonList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        Chưa có dữ liệu thi đua trong khối này.
                      </td>
                    </tr>
                  ) : (
                    classComparisonList.map((classData, index) => {
                      let rowBg = 'hover:bg-slate-50/50';
                      let badgeClass = 'bg-slate-100 text-slate-600';
                      if (index === 0) {
                        rowBg = 'bg-amber-50/10 hover:bg-amber-50/20';
                        badgeClass = 'bg-amber-100 text-amber-700 font-black border border-amber-200/50';
                      } else if (index === 1) {
                        badgeClass = 'bg-slate-200 text-slate-700 font-black border border-slate-300';
                      } else if (index === 2) {
                        badgeClass = 'bg-orange-100 text-orange-700 font-black border border-orange-200';
                      }

                      return (
                        <tr key={classData.id} className={`transition-colors ${rowBg}`}>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] ${badgeClass}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-slate-900">
                            Lớp {classData.name}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-500">
                            {classData.studentCount} HS
                          </td>
                          <td className="p-3 text-right text-slate-900 font-extrabold">
                            {classData.totalStars} ⭐
                          </td>
                          <td className="p-3 text-right text-emerald-600 font-black">
                            {classData.averageStars} ⭐
                          </td>
                          <td className="p-3 text-center text-pink-600 font-bold">
                            {classData.totalStickers} Sticker
                          </td>
                          <td className="p-3 pl-6 text-slate-600">
                            {classData.topStudent ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">👑</span>
                                <span className="font-extrabold text-slate-800">{classData.topStudent.name}</span>
                                <span className="bg-amber-500 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-md border border-yellow-300">
                                  {classData.topStudentStars} ⭐
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>
                          <td className="p-3 text-center pr-4">
                            <button
                              onClick={() => {
                                setViewingDetailClassId(classData.id);
                                setClassSearchTerm('');
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-1.5 rounded-xl border border-blue-150 font-black text-[10px] uppercase transition-all cursor-pointer"
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

          {/* Wall of Fame Grade Top 10 */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 rounded-[32px] border border-indigo-950/45 shadow-xl space-y-4 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-800/40 pb-3">
              <div>
                <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  BẢNG VÀNG VINH DANH KHỐI {selectedGradeId}
                </h4>
                <p className="text-[11px] text-indigo-300 font-medium">Top 10 học sinh tích lũy sao vàng xuất sắc nhất toàn khối</p>
              </div>
              <span className="text-[10px] font-black text-amber-300 bg-amber-400/25 border border-amber-400/30 px-3.5 py-1.5 rounded-full uppercase flex items-center gap-1 shrink-0">
                ✨ SIÊU SAO HỌC ĐƯỜNG
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topStudentsInGrade.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-indigo-200 font-bold text-xs">
                  Chưa có dữ liệu học sinh trong khối này.
                </div>
              ) : (
                topStudentsInGrade.map((student, idx) => {
                  const studentClass = classes?.find(c => c.id === student.classId);
                  
                  let rankColor = 'bg-indigo-800/80 text-indigo-200';
                  let borderColor = 'border-indigo-800/30';
                  if (idx === 0) {
                    rankColor = 'bg-amber-400 text-amber-950 font-black';
                    borderColor = 'border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.2)]';
                  } else if (idx === 1) {
                    rankColor = 'bg-slate-300 text-slate-900 font-black';
                    borderColor = 'border-slate-300/40';
                  } else if (idx === 2) {
                    rankColor = 'bg-orange-400 text-orange-950 font-black';
                    borderColor = 'border-orange-400/40';
                  }

                  return (
                    <div 
                      key={student.id} 
                      className={`bg-indigo-950/40 border ${borderColor} rounded-2xl p-3 flex items-center justify-between hover:bg-indigo-900/40 transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-extrabold ${rankColor}`}>
                          {idx + 1}
                        </span>
                        <span className="text-lg">
                          {getStudentAvatar(student.id, students).emoji}
                        </span>
                        <div>
                          <strong className="text-xs font-extrabold block text-slate-100">{student.name}</strong>
                          <span className="text-[10px] text-indigo-300">Lớp {studentClass ? studentClass.name : student.classId}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-0.5">
                          {student.cumulativeStars} <Star className="w-3 h-3 fill-amber-400 inline" />
                        </span>
                        {student.exchangedStickers > 0 && (
                          <span className="bg-pink-500/20 text-pink-300 text-[8px] font-black px-1.5 py-0.5 rounded border border-pink-500/30 uppercase">
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Guidelines */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-1.5 text-left">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              QUY CHẾ ĐỔI STICKER
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed text-left">
              Học sinh đạt thành tích tốt sẽ dùng quỹ sao vàng tích lũy đổi trực tiếp các loại sticker thực tế:
            </p>

            <div className="grid grid-cols-2 gap-3">
              
              {/* Sticker 1 */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center text-center justify-between min-h-[145px] group hover:border-emerald-400 hover:bg-emerald-50/10 transition-all">
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
                  <span className="text-[9px] text-emerald-600 font-extrabold block mt-1.5">Phí: 5 ⭐</span>
                </div>
              </div>

              {/* Sticker 2 */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center text-center justify-between min-h-[145px] group hover:border-blue-400 hover:bg-blue-50/10 transition-all">
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
                  <span className="text-[9px] text-blue-600 font-extrabold block mt-1.5">Phí: 10 ⭐</span>
                </div>
              </div>

              {/* Sticker 3 */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/10 flex flex-col items-center text-center justify-between min-h-[145px] group hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
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
                  <span className="text-[9px] text-indigo-600 font-extrabold block mt-1.5">Phí: 15 ⭐</span>
                </div>
              </div>

              {/* Sticker 4 */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-amber-200 bg-amber-50/10 flex flex-col items-center text-center justify-between min-h-[145px] group hover:border-rose-400 hover:bg-rose-50/20 transition-all">
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
                  <span className="text-[9px] text-rose-600 font-extrabold block mt-1.5">Phí: 20 ⭐</span>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-[11px] text-amber-900 text-left">
            <strong className="text-amber-800 block mb-1">💡 Hướng dẫn dành cho thầy cô:</strong>
            <p className="leading-relaxed">
              Vào cuối tháng, giáo viên sẽ trao tận tay sticker thực tế cho học sinh theo đúng lịch sử đổi quà trên hệ thống.
            </p>
          </div>

        </div>

        {/* Right list: Student star list & exchange center */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
            <div className="text-left">
              <h3 className="font-extrabold text-slate-800 text-sm">Góc Quầy Đổi Thưởng: Lớp <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-lg border border-yellow-300">{selectedClass}</span></h3>
              <p className="text-[11px] text-slate-400">Ấn vào học sinh để mở quầy đổi quà sticker rực rỡ</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">Sổ Thi Đua Chuyên Cần</span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên học sinh cần đổi quà..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    onClick={() => setSelectedStudentForReward(s)}
                    className="bg-white p-4 rounded-3xl shadow-xs border border-slate-100 hover:border-amber-400 hover:shadow-md transition-all flex flex-col items-center justify-center relative text-center select-none cursor-pointer group active:scale-95 duration-150 min-h-[180px] h-[180px]"
                  >
                    {/* Star count badge at Top-Right */}
                    <div className="absolute top-2.5 right-2.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-amber-200/60 flex items-center gap-0.5 shadow-3xs group-hover:bg-amber-100/50 transition-colors">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                      <span>{stars}</span>
                    </div>

                    {/* Circular Avatar with Achievement Badge Frame */}
                    <div className="relative my-1 shrink-0">
                      <StickerAvatar 
                        emoji={avatar.emoji} 
                        studentId={s.id} 
                        size="w-18 h-18" 
                        className={`${badge ? badge.ringClass : ''}`}
                        avatarUrl={s.avatarUrl}
                      />
                      {badge && (
                        <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7.5px] font-black border uppercase tracking-wider whitespace-nowrap shadow-xs flex items-center gap-0.5 scale-90 group-hover:scale-95 transition-all ${badge.badgeClass}`}>
                          <span>{badge.emoji}</span>
                          <span>{badge.label}</span>
                        </span>
                      )}
                    </div>

                    {/* Full Name & Code */}
                    <div className="flex flex-col items-center justify-center mt-2 max-w-full">
                      <strong className="text-xs font-extrabold text-slate-800 leading-tight truncate w-full" title={s.name}>
                        {formatDisplayName(s.name)}
                      </strong>
                    </div>

                    {/* Machine Pill Badge instead of Level */}
                    <span className="inline-block bg-indigo-50 text-indigo-600 border border-indigo-100/40 px-3 py-0.5 rounded-full text-[10px] font-black mt-1.5">
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

      </div>
      )}

      {/* Selection Reward Modal */}
      {selectedStudentForReward && (() => {
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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Close Button at top-right */}
              <button
                onClick={() => setSelectedStudentForReward(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all cursor-pointer z-20"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-left">
                
                {/* Student Mini Profile Card */}
                <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-4">
                  <div className="relative shrink-0">
                    <StickerAvatar 
                      emoji={avatar.emoji} 
                      studentId={s.id} 
                      size="w-16 h-16" 
                      className={`${badge ? badge.ringClass : ''} shadow-md`}
                      avatarUrl={s.avatarUrl}
                    />
                    {badge && (
                      <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7.5px] font-black border uppercase tracking-wider whitespace-nowrap shadow-xs flex items-center gap-0.5 ${badge.badgeClass}`}>
                        <span>{badge.emoji}</span>
                        <span>{badge.label}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-left space-y-1 flex-1">
                    <h4 className="font-black text-slate-800 text-base leading-tight">{s.name}</h4>
                    
                    {/* Star count display exactly as image */}
                    <div className="text-amber-600 font-extrabold text-[12.5px] flex items-center gap-1.5">
                      <span className="text-amber-500 text-sm">⭐</span>
                      <span>Đang có: {stars} Sao</span>
                    </div>

                    {/* Class and Machine info row with class replacing the student code */}
                    <div className="text-[11px] text-slate-450 font-bold flex items-center gap-2 mt-1">
                      <span>Lớp: {selectedClass}</span>
                      <span>•</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${
                        seatObj ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-50/70 text-indigo-500'
                      }`}>
                        {seatObj ? `💻 ${seatObj.name}` : 'Chưa xếp máy'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rewards Grid */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Danh Sách Quà Đổi Thưởng</h5>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {rewardsList.map((reward) => {
                      const isAffordable = stars >= reward.cost;
                      const hasBadge = emulationObj.badges?.includes(reward.name);

                      return (
                        <div 
                          key={reward.name}
                          className={`p-4 border rounded-2xl transition-all relative flex flex-col justify-between items-center text-center min-h-[260px] group ${
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

                          {/* Beautiful 3D Pixel Sticker */}
                          <div className="my-3 flex items-center justify-center">
                            <StickerAvatar 
                              emoji={reward.emoji} 
                              studentId={reward.name} 
                              size="w-16 h-16" 
                              className="transform group-hover:scale-110 transition-transform duration-300 shadow-md"
                            />
                          </div>

                          {/* Sticker Label & Details (Placed below the 3D sticker icon) */}
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

                {/* Exchanged Badges / History */}
                <div className="border-t pt-4">
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

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t flex justify-end">
                <button
                  onClick={() => setSelectedStudentForReward(null)}
                  className="bg-slate-250 hover:bg-slate-350 text-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* POPUP MODAL: CHI TIẾT THI ĐUA TỪNG HỌC SINH CỦA LỚP */}
      {viewingDetailClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-4xl md:max-w-5xl max-h-[85vh] flex flex-col overflow-hidden border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center text-left">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-300" />
                  Chi Tiết Thi Đua Lớp {classes?.find(c => c.id === viewingDetailClassId)?.name || viewingDetailClassId}
                </h3>
                <p className="text-[10px] text-indigo-100 font-semibold">Khối {classes?.find(c => c.id === viewingDetailClassId)?.gradeId} • GVCN: {classes?.find(c => c.id === viewingDetailClassId)?.teacher || 'Đang cập nhật'}</p>
              </div>
              <button
                onClick={() => setViewingDetailClassId(null)}
                className="p-1 hover:bg-white/25 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Student filter inside popup */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 text-left">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={classSearchTerm}
                  onChange={(e) => setClassSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm học sinh trong lớp..."
                  className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px] whitespace-nowrap">
                      <th className="p-2.5 text-center w-12 whitespace-nowrap">Hạng</th>
                      <th className="p-2.5 whitespace-nowrap">Tên Học Sinh</th>
                      <th className="p-2.5 text-right whitespace-nowrap">Tổng Sao Tích Lũy</th>
                      <th className="p-2.5 text-right whitespace-nowrap">Sticker Đã Đổi</th>
                      <th className="p-2.5 text-right whitespace-nowrap">Sao Còn Lại</th>
                      <th className="p-2.5 pl-4 whitespace-nowrap">Huy Hiệu Sở Hữu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                    {(() => {
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

                      if (filteredClassSts.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                              Không tìm thấy học sinh nào phù hợp.
                            </td>
                          </tr>
                        );
                      }

                      return filteredClassSts.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-center">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] ${
                              idx === 0 ? 'bg-amber-100 text-amber-700 font-extrabold' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-2.5 font-extrabold text-slate-900 flex items-center gap-1.5 text-left whitespace-nowrap">
                            <span>{getStudentAvatar(st.id, students).emoji}</span>
                            <span>{st.name}</span>
                          </td>
                          <td className="p-2.5 text-right text-slate-900">
                            {st.cumulativeStars} ⭐
                          </td>
                          <td className="p-2.5 text-right text-pink-600">
                            {st.exchangedStickers} quà
                          </td>
                          <td className="p-2.5 text-right text-emerald-600">
                            {st.currentStars} ⭐
                          </td>
                          <td className="p-2.5 pl-4">
                            {st.badges.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {st.badges.map((b, i) => (
                                  <span key={i} className="bg-slate-100 text-slate-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-slate-200">
                                    {b}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-normal">Chưa có</span>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button
                onClick={() => {
                  setViewingDetailClassId(null);
                  setClassSearchTerm('');
                }}
                className="px-5 py-2 bg-slate-250 hover:bg-slate-350 text-slate-700 rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <FireworksCelebration
        isOpen={celebration.isOpen}
        onClose={() => setCelebration(prev => ({ ...prev, isOpen: false }))}
        studentId={celebration.studentId}
        studentName={celebration.studentName}
        studentClass={celebration.studentClass}
        badgeName={celebration.badgeName}
        students={students}
      />

    </div>
  );
}
