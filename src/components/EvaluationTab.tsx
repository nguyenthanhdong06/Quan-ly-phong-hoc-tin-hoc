import React from 'react';
import { Student, EvaluationData, SeatingChart, Computer, EmulationDataState, AttendanceData } from '../types';
import { Star, Calendar, Search, X, Award, MessageSquare, Tag } from 'lucide-react';

interface EvaluationTabProps {
  selectedClass: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  students: Student[];
  computers: Computer[];
  seatingChart: SeatingChart;
  evaluationData: EvaluationData;
  setEvaluationData: React.Dispatch<React.SetStateAction<EvaluationData>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  systemDateText: string;
  setEmulationDataState: any;
  emulationDataState: EmulationDataState;
  attendanceData: AttendanceData;
}

// Deterministic helper to get a cute avatar based on student's ID/name to match the exact design in screenshots
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

// 3D Pixel Sticker Component to render gorgeous glossy cute animal badges
const StickerAvatar = ({ emoji, studentId, size = 'w-16 h-16', className = '' }: { emoji: string; studentId: string; size?: string; className?: string }) => {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  // Vibrant gradient pairs matching the exact high-end circular 3D backgrounds in the reference image
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
    <div className={`relative rounded-full aspect-square flex items-center justify-center border-4 border-white shadow-[0_5px_12px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.10)] bg-gradient-to-tr ${currentGradient} select-none transition-all duration-300 overflow-hidden ${size} ${className}`}>
      
      {/* 3D Pixel grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-12 mix-blend-overlay pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(45deg, #000 25%, transparent 25%), 
            linear-gradient(-45deg, #000 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #000 75%), 
            linear-gradient(-45deg, transparent 75%, #000 75%)
          `,
          backgroundSize: '10px 10px',
          backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
        }}
      />

      {/* Inner radial shading to enhance the 3D globe/lens effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.22)_100%)] mix-blend-multiply pointer-events-none rounded-full" />
      <div className="absolute inset-1 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.40)_0%,transparent_55%)] pointer-events-none rounded-full" />

      {/* Retro digital scanlines for game-aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_50%,rgba(0,0,0,0.06)_50%)] bg-[length:100%_4px] pointer-events-none" />

      {/* Cute Emoji with a soft, rich 3D drop-shadow */}
      <span 
        className="text-[1.85em] relative z-10 leading-none filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.28)] saturate-120 contrast-105 select-none pointer-events-none transform group-hover:scale-110 duration-200"
        style={{
          imageRendering: 'pixelated',
        }}
      >
        {emoji}
      </span>

      {/* Glossy epoxy dome reflection (top-half crescent) */}
      <div className="absolute top-[2px] left-[3%] right-[3%] h-[38%] bg-gradient-to-b from-white/35 via-white/8 to-transparent rounded-full opacity-90 pointer-events-none z-20" />
      
      {/* 3D glint dot reflection */}
      <div className="absolute top-[12%] left-[22%] w-1.5 h-1.5 bg-white/75 rounded-full blur-[0.2px] pointer-events-none z-20" />

      {/* Inner circular outline layer */}
      <div className="absolute inset-0.5 rounded-full border border-white/15 pointer-events-none z-10" />
    </div>
  );
};

// Helper to format student name for short display to fit card perfectly while keeping native tooltip for hover
const formatDisplayName = (fullName: string) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 2) {
    // Return last 2 words (e.g. "Nguyễn Thị Mộng Mơ" -> "Mộng Mơ")
    return parts.slice(-2).join(' ');
  }
  return fullName;
};

// Helper to get achievement badge info based on cumulative stars
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
  attendanceData
}: EvaluationTabProps) {
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);

  // Reset search term when class changes for perfect UX
  React.useEffect(() => {
    setSearchTerm('');
    setSelectedStudent(null);
  }, [selectedClass]);

  const classStudents = students.filter(s => s.classId === selectedClass);
  const currentDaysEvaluations = evaluationData[selectedDate]?.[selectedClass] || {};

  // Filter students by search term
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

    showToast(`Đã ${delta > 0 ? 'khen thưởng (+)' : 'nhắc nhở (-)'}${Math.abs(delta)} ⭐: ${label}`);
  };

  const handleSave = () => {
    showToast(`Đã lưu thành công ý kiến đánh giá học kỳ ngày ${selectedDate.split('-').reverse().join('/')} cho lớp ${selectedClass}!`);
  };

  return (
    <div className="space-y-6">

      {/* Header controls select Date & Save blocks (2 separate items) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="space-y-1 text-left">
          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">Nhận xét thời gian thực</span>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mt-1">
            Sổ Đánh giá & Chấm Điểm Sao: <span className="text-amber-600 font-black">{selectedClass}</span>
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Ngày chấm điểm: <strong>{systemDateText}</strong>
          </p>
        </div>

        {/* Date & Save controls - 2 separate nicely styled boxes */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* 1. Date Selector Block */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold w-full sm:w-auto">
            <span className="text-slate-500 font-bold whitespace-nowrap text-left text-xs">Ngày chấm:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="bg-transparent border-none text-slate-800 font-extrabold focus:outline-none focus:ring-0 cursor-pointer"
            />
          </div>

          {/* 2. Save Button Block */}
          <button
            onClick={handleSave}
            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl border border-amber-600 hover:border-amber-700 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            💾 Khóa Sổ & Lưu
          </button>
        </div>

      </div>

      {/* Student Search and quick info bar - Positioned wonderfully at the head of student list */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="text-left">
          <h3 className="font-extrabold text-slate-800 text-sm">Danh sách học sinh đánh giá ({filteredStudents.length}/{classStudents.length})</h3>
          <p className="text-[11px] text-slate-400">
            Tìm kiếm nhanh học sinh và tăng/giảm sao, click chọn vào thẻ học sinh để đánh giá chi tiết.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên hoặc MSHS..."
            className="w-full text-xs pl-9 pr-8 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none focus:bg-white transition-all font-semibold"
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

      {/* Grid of student evaluation cards */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
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

            const avatar = getStudentAvatar(s.id, students);
            const badge = getStudentBadge(cumulativeStars);

            // Check if student is marked as absent today
            const attendanceStatus = attendanceData[selectedDate]?.[selectedClass]?.[s.id];
            const isAbsent = attendanceStatus === 'excused' || attendanceStatus === 'unexcused';

            return (
              <div 
                key={s.id} 
                onClick={() => setSelectedStudent(s)}
                className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-amber-400 hover:shadow-md transition-all flex flex-col items-center justify-center relative text-center select-none cursor-pointer group active:scale-95 duration-150"
              >
                {/* Star count badge at Top-Right */}
                <div className="absolute top-2.5 right-2.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-amber-200/60 flex items-center gap-0.5 shadow-3xs group-hover:bg-amber-100/50 transition-colors">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                  <span>{currentStars}</span>
                </div>

                {/* Circular Avatar with Achievement Badge Frame */}
                <div className="relative my-2 shrink-0">
                  <StickerAvatar 
                    emoji={avatar.emoji} 
                    studentId={s.id} 
                    size="w-16 h-16" 
                    className={`${badge ? badge.ringClass : ''}`}
                  />
                  {badge && (
                    <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7.5px] font-black border uppercase tracking-wider whitespace-nowrap shadow-xs flex items-center gap-0.5 scale-90 group-hover:scale-95 transition-all ${badge.badgeClass}`}>
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                    </span>
                  )}
                </div>

                {/* Full Name & Absence Warning */}
                <div className="flex items-center justify-center gap-1.5 mt-3 max-w-full">
                  <strong className="text-sm font-extrabold text-slate-800 leading-tight truncate" title={s.name}>
                    {formatDisplayName(s.name)}
                  </strong>
                  {isAbsent && (
                    <span 
                      className="inline-flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 rounded-full w-4 h-4 text-[9px] font-black shrink-0 cursor-help"
                      title={attendanceStatus === 'excused' ? 'Vắng học có phép ngày hôm nay' : 'Vắng học không phép ngày hôm nay'}
                    >
                      ⚠️
                    </span>
                  )}
                </div>

                {/* Machine Pill Badge instead of Level */}
                <span className="inline-block bg-indigo-50 text-indigo-600 border border-indigo-100/40 px-3 py-0.5 rounded-full text-[10px] font-black mt-2">
                  {seatObj ? `💻 ${seatObj.name}` : 'Chưa xếp máy'}
                </span>
              </div>
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

      {/* Edit Evaluation Modal */}
      {selectedStudent && (() => {
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
        const badge = getStudentBadge(cumulativeStars);

        // Check if student is marked as absent today
        const modalAttendanceStatus = attendanceData[selectedDate]?.[selectedClass]?.[s.id];
        const isModalStudentAbsent = modalAttendanceStatus === 'excused' || modalAttendanceStatus === 'unexcused';

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl border border-slate-100/80 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Close Button */}
              <button 
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Student Identification Info */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="relative shrink-0 my-1">
                  <StickerAvatar 
                    emoji={avatar.emoji} 
                    studentId={s.id} 
                    size="w-14 h-14" 
                    className={`${badge ? badge.ringClass : ''}`}
                  />
                  {badge && (
                    <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7.5px] font-black border uppercase tracking-wider whitespace-nowrap shadow-xs flex items-center gap-0.5 ${badge.badgeClass}`}>
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{s.name}</h3>
                    {isModalStudentAbsent && (
                      <span 
                        className="inline-flex items-center gap-1 bg-rose-50 text-rose-500 border border-rose-100 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider cursor-help"
                        title={modalAttendanceStatus === 'excused' ? 'Học sinh Vắng học có phép ngày hôm nay' : 'Học sinh Vắng học không phép ngày hôm nay'}
                      >
                        ⚠️ Vắng ({modalAttendanceStatus === 'excused' ? 'Có phép' : 'Không phép'})
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    <span>Đang có: {currentStars} Sao</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1 flex gap-2 items-center">
                    <span>{s.code}</span>
                    <span>•</span>
                    <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-bold">
                      {seatObj ? `💻 ${seatObj.name}` : 'Chưa xếp máy'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Inputs */}
              <div className="space-y-6 text-left">
                {/* KHEN THƯỜNG (TẶNG SAO) */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-emerald-500">➕</span> KHEN THƯỜNG (TẶNG SAO)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
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
                        className="bg-emerald-50/70 hover:bg-emerald-100/80 active:scale-95 border border-emerald-200/50 hover:border-emerald-300 rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer group text-left"
                      >
                        <span className="text-xs font-extrabold text-emerald-800 group-hover:text-emerald-950 truncate pr-1">
                          {opt.label}
                        </span>
                        <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 flex items-center gap-0.5 shadow-3xs">
                          +{opt.value} ⭐️
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* NHẮC NHỞ (TRỪ SAO) */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-rose-500">➖</span> NHẮC NHỞ (TRỪ SAO)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Nói chuyện", value: -2 },
                      { label: "Quên sách", value: -5 },
                      { label: "Đi học muộn", value: -3 }
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleAwardStars(s.id, opt.value, opt.label)}
                        className="bg-rose-50/70 hover:bg-rose-100/80 active:scale-95 border border-rose-200/50 hover:border-rose-300 rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer group text-left"
                      >
                        <span className="text-xs font-extrabold text-rose-800 group-hover:text-rose-950 truncate pr-1">
                          {opt.label}
                        </span>
                        <span className="bg-rose-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 flex items-center gap-0.5 shadow-3xs">
                          {opt.value} ⭐️
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teacher Comment */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                    Ý kiến / Nhận xét của giáo viên:
                  </span>
                  <input
                    type="text"
                    value={evalObj.comment}
                    onChange={(e) => handleSetComment(s.id, e.target.value)}
                    placeholder="Ghi nhận xét chi tiết (VD: Làm bài tốt, phát biểu)..."
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Close/Done button */}
              <button
                onClick={() => setSelectedStudent(null)}
                className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-2xl transition-all cursor-pointer text-center"
              >
                Xong & Đóng
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

