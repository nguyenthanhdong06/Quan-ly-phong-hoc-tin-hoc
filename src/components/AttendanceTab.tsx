import React from 'react';
import { Student, AttendanceData } from '../types';
import { Check, ClipboardCheck, Calendar, UserCheck, AlertTriangle, AlertCircle, Search, X, Sparkles, CheckCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AttendanceTabProps {
  selectedClass: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  students: Student[];
  attendanceData: AttendanceData;
  setAttendanceData: React.Dispatch<React.SetStateAction<AttendanceData>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  systemDateText: string;
}

export default function AttendanceTab({
  selectedClass,
  selectedDate,
  setSelectedDate,
  students,
  attendanceData,
  setAttendanceData,
  showToast,
  systemDateText
}: AttendanceTabProps) {
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [justUpdatedId, setJustUpdatedId] = React.useState<string | null>(null);

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

  // Metrics
  let presentCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;

  classStudents.forEach(s => {
    const status = currentDaysAttendance[s.id] || 'present'; // Default is present
    if (status === 'present') presentCount++;
    else if (status === 'excused') excusedCount++;
    else if (status === 'unexcused') unexcusedCount++;
  });

  const attendanceRate = classStudents.length > 0 
    ? Math.round((presentCount / classStudents.length) * 100)
    : 100;

  // Set single student status with visual pulse trigger
  const handleSetState = (studentId: string, status: 'present' | 'excused' | 'unexcused') => {
    setJustUpdatedId(studentId);
    setTimeout(() => setJustUpdatedId(null), 600);

    setAttendanceData(prev => {
      const dayData = { ...(prev[selectedDate] || {}) };
      const classData = { ...(dayData[selectedClass] || {}) };
      classData[studentId] = status;
      dayData[selectedClass] = classData;
      return { ...prev, [selectedDate]: dayData };
    });
  };

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
      <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-black text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
              <span>📋</span> SỔ ĐIỂM DANH HỌC SINH LỚP: <span className="text-emerald-800 font-black bg-white/90 px-2.5 py-0.5 rounded-lg border border-[#cbb89d]">{selectedClass}</span>
            </h2>
            <p className="text-[11px] font-bold text-[#5c4327] flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5 text-amber-800" />
              Thời gian: <strong>{systemDateText}</strong>
            </p>
          </div>

          {/* Date Selector & Save block */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white/90 border border-[#cbb89d] px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span className="text-slate-700 whitespace-nowrap font-bold">Chọn ngày dạy:</span>
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
              onClick={handleSetAllPresent}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl border border-emerald-500 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Đánh dấu tất cả học sinh trong lớp là Có Mặt"
            >
              <CheckCircle className="w-4 h-4 text-emerald-100" />
              Tất Cả Có Mặt
            </button>

            <button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl border border-amber-500 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-100" />
              Lưu Sổ
            </button>
          </div>
        </div>
      </div>

      {/* Statistics board with smooth number bumps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-left">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sĩ số lớp cần học</span>
          <strong className="text-2xl font-black text-slate-800 mt-1 block">{classStudents.length}</strong>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-left relative overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Hiện diện (Học tốt)</span>
          <motion.strong 
            key={presentCount}
            initial={{ scale: 1.25, color: '#059669' }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-2xl font-black text-emerald-700 mt-1 block"
          >
            {presentCount} <span className="text-xs font-bold text-emerald-500">({attendanceRate}%)</span>
          </motion.strong>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-left relative overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">Xin phép nghỉ (P)</span>
          <motion.strong 
            key={excusedCount}
            initial={{ scale: 1.25, color: '#d97706' }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-2xl font-black text-amber-700 mt-1 block"
          >
            {excusedCount}
          </motion.strong>
        </div>

        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-left relative overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-600 block">Vắng không phép (KP)</span>
          <motion.strong 
            key={unexcusedCount}
            initial={{ scale: 1.25, color: '#dc2626' }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-2xl font-black text-red-700 mt-1 block"
          >
            {unexcusedCount}
          </motion.strong>
        </div>

      </div>

      {/* Báo cáo nhanh cho Giáo viên chủ nhiệm */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-left">
            <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
              <span className="animate-pulse">📝</span> BẢNG THỐNG KÊ BÁO CÁO GIÁO VIÊN CHỦ NHIỆM
            </h4>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Báo cáo nhanh số liệu điểm danh ngày <span className="font-bold text-slate-700">{selectedDate.split('-').reverse().join('/')}</span> của lớp <span className="font-bold text-amber-600">{selectedClass}</span>.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const textMessage = `BÁO CÁO ĐIỂM DANH LỚP: ${selectedClass}\n` +
                `- Sĩ số: ${classStudents.length} học sinh (Nữ: ${classStudents.filter(s => s.gender === 'Nữ').length})\n` +
                `- Hiện diện: ${classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') === 'present').length} học sinh` +
                ` (Nữ: ${classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') === 'present' && s.gender === 'Nữ').length})\n` +
                `- Vắng: ${classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') !== 'present').length} học sinh` +
                ` (Nữ: ${classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') !== 'present' && s.gender === 'Nữ').length})\n` +
                `- Họ tên HS vắng: ${
                  classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') !== 'present').length > 0
                    ? classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') !== 'present').map(s => {
                        const st = currentDaysAttendance[s.id];
                        return `${s.name} (${st === 'excused' ? 'Phép' : 'Không phép'})`;
                      }).join(', ')
                    : 'Không có (Lớp đi đủ 100%)'
                }`;
              
              navigator.clipboard.writeText(textMessage);
              showToast("Đã sao chép nội dung báo cáo điểm danh gửi GVCN thành công! ✨");
            }}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            title="Sao chép văn bản để gửi qua Zalo/Viber"
          >
            📋 Sao chép nhanh cho GVCN
          </motion.button>
        </div>

        <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm max-w-3xl">
          <table className="w-full border-collapse text-xs text-left">
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-slate-50/40 transition">
                <td className="py-2.5 px-4 font-bold text-slate-500 bg-slate-50 w-44 border-r border-slate-200">Lớp:</td>
                <td className="py-2.5 px-4 font-black text-amber-600">{selectedClass}</td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-slate-50/40 transition">
                <td className="py-2.5 px-4 font-bold text-slate-500 bg-slate-50 w-44 border-r border-slate-200">Sĩ số:</td>
                <td className="py-2.5 px-4 font-extrabold text-slate-800">
                  {classStudents.length} học sinh <span className="text-slate-300 font-normal mx-1">|</span> <span className="text-pink-600 font-extrabold">{classStudents.filter(s => s.gender === 'Nữ').length} Nữ</span>
                </td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-slate-50/40 transition">
                <td className="py-2.5 px-4 font-bold text-slate-500 bg-slate-50 w-44 border-r border-slate-200">Hiện diện:</td>
                <td className="py-2.5 px-4 font-extrabold text-emerald-700">
                  {classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') === 'present').length} học sinh đi học <span className="text-slate-300 font-normal mx-1">|</span> <span className="text-pink-600 font-extrabold">{classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') === 'present' && s.gender === 'Nữ').length} Nữ</span>
                </td>
              </tr>
              <tr className="border-b border-slate-200 hover:bg-slate-50/40 transition">
                <td className="py-2.5 px-4 font-bold text-slate-500 bg-slate-50 w-44 border-r border-slate-200">Vắng:</td>
                <td className="py-2.5 px-4 font-extrabold text-red-650">
                  <span className="text-red-600">{classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') !== 'present').length} học sinh vắng</span> <span className="text-slate-300 font-normal mx-1">|</span> <span className="text-pink-600 font-extrabold">{classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') !== 'present' && s.gender === 'Nữ').length} Nữ</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/40 transition">
                <td className="py-3 px-4 font-bold text-slate-500 bg-slate-50 w-44 border-r border-slate-200 align-middle">Họ tên HS vắng:</td>
                <td className="py-3 px-4 font-semibold text-slate-700">
                  {classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') !== 'present').length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {classStudents.filter(s => (currentDaysAttendance[s.id] || 'present') !== 'present').map(s => {
                          const status = currentDaysAttendance[s.id];
                          const isExcused = status === 'excused';
                          return (
                            <motion.span 
                              key={s.id} 
                              initial={{ scale: 0.7, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.7, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider shadow-2xs ${
                                isExcused 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              <span>{s.name}</span>
                              <span className="text-[8px] bg-white opacity-90 px-1 py-0.2 rounded border shadow-sm font-mono">
                                {isExcused ? 'Phép (P)' : 'Không Phép (KP)'}
                              </span>
                            </motion.span>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.span 
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-emerald-600 font-extrabold text-[11px] flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Gương mẫu! Lớp đi học đầy đủ 100%, không có học sinh vắng.
                    </motion.span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Table for attendance records on selected date */}
      <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs space-y-0 text-left">
        
        {/* Search student controls & Header Strip */}
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-left">
            <h3 className="font-black text-xs sm:text-sm text-[#3d2b17] tracking-wider uppercase flex items-center gap-2">
              <span>📋</span>
              BẢNG ĐIỂM DANH HỌC SINH • NGÀY {selectedDate}
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
              <AnimatePresence>
                {paginatedStudents.map((s, index) => {
                  const currentStatus = currentDaysAttendance[s.id] || 'present';
                  const originalIndex = classStudents.findIndex(cs => cs.id === s.id);
                  const displayIndex = originalIndex !== -1 ? originalIndex + 1 : index + 1;
                  const isJustUpdated = justUpdatedId === s.id;

                  // Dynamic row styling based on status
                  let rowBg = 'bg-white hover:bg-slate-50/60';
                  let borderLeftAccent = 'border-l-4 border-l-emerald-500';

                  if (currentStatus === 'excused') {
                    rowBg = 'bg-amber-50/40 hover:bg-amber-50/80';
                    borderLeftAccent = 'border-l-4 border-l-amber-500';
                  } else if (currentStatus === 'unexcused') {
                    rowBg = 'bg-rose-50/40 hover:bg-rose-50/80';
                    borderLeftAccent = 'border-l-4 border-l-rose-500';
                  }

                  return (
                    <motion.tr 
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: isJustUpdated ? [1, 1.012, 1] : 1,
                      }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ 
                        duration: 0.2, 
                        scale: { duration: 0.35, ease: 'easeOut' } 
                      }}
                      className={`${rowBg} ${borderLeftAccent} transition-colors duration-300 relative`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-400">{displayIndex}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{s.code}</td>
                      <td className="py-3.5 px-4 text-left">
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
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${s.gender === 'Nữ' ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                          {s.gender === 'Nữ' ? 'Nữ 👧🏻' : 'Nam 👦🏻'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex rounded-xl bg-slate-100/90 p-1 w-full border border-slate-200/70 shadow-inner gap-1">
                          
                          {/* Present Button */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSetState(s.id, 'present')}
                            className={`flex-1 text-center py-1.5 px-2 rounded-lg text-[10.5px] font-black tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              currentStatus === 'present' 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-1 ring-emerald-500' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 ${currentStatus === 'present' ? 'text-white' : 'text-slate-400'}`} />
                            Đi Học
                          </motion.button>

                          {/* Excused Button */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSetState(s.id, 'excused')}
                            className={`flex-1 text-center py-1.5 px-2 rounded-lg text-[10.5px] font-black tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              currentStatus === 'excused' 
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-400' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                            }`}
                          >
                            <Calendar className={`w-3.5 h-3.5 ${currentStatus === 'excused' ? 'text-white' : 'text-slate-400'}`} />
                            Có Phép (P)
                          </motion.button>

                          {/* Unexcused Button (LÀM NỔI BẬT ĐẶC BIỆT KHI ĐƯỢC CHỌN VÀ KHÔNG CHỌN - HẾT MỜ CHỮ) */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSetState(s.id, 'unexcused')}
                            className={`flex-1 text-center py-1.5 px-2 rounded-lg text-[10.5px] font-black tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
                              currentStatus === 'unexcused' 
                                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400 border border-rose-500 animate-pulse' 
                                : 'bg-rose-50/90 text-rose-900 hover:text-rose-950 hover:bg-rose-100 border border-rose-200 font-black'
                            }`}
                          >
                            <X className={`w-3.5 h-3.5 ${currentStatus === 'unexcused' ? 'text-white font-black' : 'text-rose-600 font-black'}`} />
                            <span className={currentStatus === 'unexcused' ? 'text-white font-black drop-shadow-xs' : 'text-rose-900 font-black'}>
                              Không Phép (KP)
                            </span>
                          </motion.button>

                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              
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

    </div>
  );
}

