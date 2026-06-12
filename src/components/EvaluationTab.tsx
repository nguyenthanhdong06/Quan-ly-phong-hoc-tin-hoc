import React from 'react';
import { Student, EvaluationData, SeatingChart, Computer } from '../types';
import { Star, MessageSquare, Tag, Calendar, Save, Award, Search, X } from 'lucide-react';

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
}

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
  setEmulationDataState
}: EvaluationTabProps) {
  
  const [searchTerm, setSearchTerm] = React.useState('');

  // Reset search term when class changes for perfect UX
  React.useEffect(() => {
    setSearchTerm('');
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

  const availableTags = ['Hăng hái', 'Thực hành tốt', 'Giúp đỡ bạn', 'Chưa tập trung', 'Nói chuyện riêng'];

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
        const studentEmulation = prev[studentId] || { cumulativeStars: 10, exchangedStickers: 0, totalDeducted: 0, badges: [] };
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
            Tìm kiếm nhanh học sinh và tăng/giảm sao, gắn tag hoặc đánh giá chi tiết.
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

      {/* Grid of student evaluations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStudents.map((s) => {
          const evalObj = currentDaysEvaluations[s.id] || { rating: 0, comment: '', tags: [] };
          
          // Get quick computer seat allocation status
          const seatId = Object.keys(seatingChart[selectedClass] || {}).find(k => seatingChart[selectedClass][k] === s.id);
          const seatObj = seatId ? computers.find(c => c.id === seatId) : null;

          return (
            <div 
              key={s.id} 
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 transition-all flex flex-col justify-between gap-4 text-left"
            >
              <div className="space-y-3.5">
                
                {/* Visual Name & computer ID row */}
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-sm font-extrabold text-slate-800 block">{s.name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {s.code} • Giới tính: {s.gender}</span>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    seatObj ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500 border'
                  }`}>
                    {seatObj ? `📍 Ngồi: ${seatObj.name}` : '❌ Chưa xếp máy'}
                  </span>
                </div>

                {/* Rating Stars picker (1 to 5) */}
                <div className="flex items-center gap-1.5 py-1">
                  <span className="text-xs font-bold text-slate-405 mr-1 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Chấm thi đua:
                  </span>
                  {[1, 2, 3, 4, 5].map(starNum => (
                    <button
                      key={starNum}
                      type="button"
                      onClick={() => handleSetRating(s.id, starNum)}
                      className={`text-2xl transition transform hover:scale-115 focus:outline-none ${
                        starNum <= evalObj.rating ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Tags Effort Quick assignment */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Năng lực thực hành & Nỗ lực học tập:</span>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map(tag => {
                      const isSelected = evalObj.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(s.id, tag)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            isSelected 
                              ? 'bg-amber-500 text-white border border-amber-600 shadow-sm' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Comment Opinion text */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Nhận xét chi tiết của Giáo viên:</span>
                  <textarea
                    value={evalObj.comment}
                    onChange={(e) => handleSetComment(s.id, e.target.value)}
                    placeholder="Ghi nhận xét của bé (ví dụ: Chăm chú lắng nghe, hoàn thành xuất sắc, hoặc còn lơ đãng...)"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl h-20 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

              </div>
            </div>
          );
        })}

        {classStudents.length > 0 && filteredStudents.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 border border-dashed rounded-3xl font-medium">
            Không tìm thấy học sinh nào phù hợp với từ khóa "<strong>{searchTerm}</strong>".
          </div>
        )}

        {classStudents.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 border border-dashed rounded-3xl font-medium">
            Lớp học "{selectedClass}" hiện chưa có bất kỳ học sinh nào trong danh sách. Hãy nạp danh sách học sinh trước khi chấm điểm.
          </div>
        )}
      </div>

    </div>
  );
}
