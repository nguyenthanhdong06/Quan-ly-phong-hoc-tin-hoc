import React from 'react';
import { Student, EvaluationData, SeatingChart, Computer, EmulationDataState, AttendanceData } from '../types';
import { Star, Calendar, Search, X, Award, MessageSquare, Tag } from 'lucide-react';
import { triggerStarsConfetti } from '../utils/confetti';
import { playStarRewardSound, playWarningDeductSound } from '../utils/audioEffects';
import { CyberRobotCardFrameDecoration } from './CyberRobotCardFrameDecoration';
import { StudentCard3D } from './StudentCard3D';

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

    if (delta > 0) {
      triggerStarsConfetti();
      playStarRewardSound();
    } else {
      playWarningDeductSound();
    }

    showToast(`Đã ${delta > 0 ? 'khen thưởng (+)' : 'nhắc nhở (-)'}${Math.abs(delta)} ⭐: ${label}`);
  };

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
            <div className="flex items-center gap-2 bg-white/90 border border-[#cbb89d] px-3.5 py-1.5 rounded-xl text-xs font-semibold w-full sm:w-auto">
              <span className="text-slate-700 font-bold whitespace-nowrap text-left text-xs">Ngày chấm:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent border-none text-slate-900 font-extrabold focus:outline-none focus:ring-0 cursor-pointer"
              />
            </div>

            <button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl border border-amber-500 transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto active:scale-95"
            >
              💾 Khóa Sổ & Lưu
            </button>
          </div>
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

            const avatar = getStudentAvatar(s.id, students);
            const badge = getStudentBadge(currentStars);

            // Check if student is marked as absent today
            const attendanceStatus = attendanceData[selectedDate]?.[selectedClass]?.[s.id];
            const isAbsent = attendanceStatus === 'excused' || attendanceStatus === 'unexcused';

            return (
              <div 
                key={s.id} 
                onClick={() => setSelectedStudent(s)}
                className="w-full flex justify-center cursor-pointer hover:scale-[1.025] active:scale-[0.98] transition-transform duration-200"
              >
                <StudentCard3D
                  student={s}
                  classStudents={classStudents}
                  machineName={seatObj ? seatObj.name : 'Chưa xếp máy'}
                  starCount={currentStars}
                  size="sm"
                  isAbsent={isAbsent}
                />
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
        const badge = getStudentBadge(currentStars);

        // Check if student is marked as absent today
        const modalAttendanceStatus = attendanceData[selectedDate]?.[selectedClass]?.[s.id];
        const isModalStudentAbsent = modalAttendanceStatus === 'excused' || modalAttendanceStatus === 'unexcused';

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#faf5ec] w-full max-w-lg rounded-3xl shadow-2xl border-2 border-[#d6c4a8] flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Clean Top Header Bar */}
              <div className="bg-gradient-to-r from-[#dfccb0] via-[#e8d9c2] to-[#dfccb0] px-5 py-3 border-b border-[#c8b598] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-700 fill-amber-500" />
                  <span className="font-extrabold text-sm text-[#42301c]">Đánh Giá & Tặng Sao Học Sinh</span>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="text-[#6e5334] hover:text-[#382613] bg-white/60 hover:bg-white p-1.5 rounded-full transition-all cursor-pointer shadow-xs focus:outline-none"
                  title="Đóng cửa sổ"
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
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 border-2 border-emerald-700 rounded-full p-2.5 px-3.5 flex items-center justify-between transition-all cursor-pointer group text-left shadow-md"
                        >
                          <span className="text-xs sm:text-sm font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] truncate pr-1">
                            {opt.label}
                          </span>
                          <span className="bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black shrink-0 flex items-center gap-0.5 border border-amber-400 shadow-xs">
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
                          className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 border-2 border-rose-700 rounded-full p-2.5 px-3.5 flex items-center justify-between transition-all cursor-pointer group text-left shadow-md"
                        >
                          <span className="text-xs sm:text-sm font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] truncate pr-1">
                            {opt.label}
                          </span>
                          <span className="bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black shrink-0 flex items-center gap-0.5 border border-amber-400 shadow-xs">
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
      })()}

    </div>
  );
}

