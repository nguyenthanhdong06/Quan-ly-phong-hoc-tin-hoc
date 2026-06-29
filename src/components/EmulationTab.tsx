import React, { useState } from 'react';
import { Student, EmulationDataState } from '../types';
import { Award, ShoppingBag, HelpCircle, Search, Sparkles, Check } from 'lucide-react';
import FireworksCelebration from './FireworksCelebration';

interface EmulationTabProps {
  selectedClass: string;
  students: Student[];
  emulationDataState: EmulationDataState;
  setEmulationDataState: React.Dispatch<React.SetStateAction<EmulationDataState>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  isRedemptionPeriod: boolean;
}

export default function EmulationTab({
  selectedClass,
  students,
  emulationDataState,
  setEmulationDataState,
  showToast,
  isRedemptionPeriod
}: EmulationTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
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

  // Reset page when class, search term or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, searchTerm, pageSize]);

  const classStudents = students.filter(s => s.classId === selectedClass);
  const filteredStudents = classStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalStudents = filteredStudents.length;
  const totalPages = Math.ceil(totalStudents / pageSize) || 1;

  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Get current active star count of a student
  const getStudentCurrentStars = (studentId: string) => {
    const emulationState = emulationDataState[studentId] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };
    const deducted = emulationState.totalDeducted !== undefined 
      ? emulationState.totalDeducted 
      : (emulationState.exchangedStickers || 0) * 5;

    return Math.max(0, emulationState.cumulativeStars - deducted);
  };

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

      {/* Rulebook shop with actual stock list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Guidelines */}
        <div className="space-y-4">
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-1.5 text-left">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              QUY CHẾ TÍCH SAO ĐỔI STICKER
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed text-left">
              Học sinh đạt thành tích tốt trong các buổi học Tin học sẽ nhận được điểm Sao. Quỹ sao này có thể dùng đổi trực tiếp các loại quà sticker thực tế sau:
            </p>

            <div className="space-y-3 text-xs text-left">
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <span className="text-2xl">👍</span>
                <div>
                  <strong className="text-xs text-slate-800 block">Sticker Chăm Ngoan Học Tập</strong>
                  <span className="text-[11px] text-emerald-600 font-bold">Chi phí đổi: 5 ⭐</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <strong className="text-xs text-slate-800 block">Sticker Siêu Nhân Tin Học</strong>
                  <span className="text-[11px] text-blue-600 font-bold">Chi phí đổi: 10 ⭐</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-indigo-100 bg-indigo-50/20 flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <strong className="text-xs text-slate-800 block font-black">Sticker Chiến Binh Công Nghệ</strong>
                  <span className="text-[11px] text-indigo-600 font-bold">Chi phí đổi: 15 ⭐</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-amber-200 bg-amber-50/25 flex items-center gap-3">
                <span className="text-2xl">🎖️</span>
                <div>
                  <strong className="text-xs text-slate-900 block font-black">Sticker Siêu Sao Tin Học</strong>
                  <span className="text-[11px] text-red-600 font-black">Chi phí đổi: 20 ⭐</span>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 text-xs text-amber-900 text-left">
            <strong className="text-amber-800 block mb-1">💡 Hướng dẫn dành cho thầy cô:</strong>
            <p className="leading-relaxed">
              Vào cuối tháng, giáo viên sẽ xuất báo cáo này để trao tận tay Sticker thật cho học sinh tương ứng với lịch sử đổi quà trên ứng dụng phần mềm.
            </p>
          </div>

        </div>

        {/* Right list: Student star list & exchange center */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
            <div className="text-left">
              <h3 className="font-extrabold text-slate-800 text-sm">Góc Quầy Đổi Thưởng: Lớp <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-lg border border-yellow-300">{selectedClass}</span></h3>
              <p className="text-[11px] text-slate-400">Ấn đổi quà khi bé tích luỹ đủ sao vàng học tốt</p>
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

          {/* List layout */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {paginatedStudents.map(s => {
              const stars = getStudentCurrentStars(s.id);
              const emulationObj = emulationDataState[s.id] || { cumulativeStars: 0, exchangedStickers: 0, totalDeducted: 0, badges: [] };

              return (
                <div 
                  key={s.id} 
                  className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left"
                >
                  <div className="space-y-1.5 flex-1">
                    <div>
                      <strong className="text-xs font-extrabold text-slate-800 block">{s.name}</strong>
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span>Mã: {s.code}</span>
                        <span>•</span>
                        <span className="text-amber-500 font-extrabold">Sao tích lũy: {stars} ⭐</span>
                      </div>
                    </div>

                    {/* Badge container visual */}
                    {emulationObj.badges && emulationObj.badges.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {emulationObj.badges.map(badge => (
                          <span 
                            key={badge} 
                            className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-600 animate-spin" />
                            🎁 {badge}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] italic text-slate-400 block pb-1">Chưa đổi bất kỳ sticker nào</span>
                    )}
                  </div>

                  {/* Buttons exchanges */}
                  <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                    <button
                      onClick={() => handleExchangeReward(s.id, s.name, '👍Sticker Chăm Ngoan', 5)}
                      className="flex-1 sm:flex-none bg-white hover:bg-emerald-100 border border-slate-200 hover:border-emerald-350 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-2xs transition-all"
                    >
                    👍 Chăm Ngoan (5⭐)
                    </button>
                    <button
                      onClick={() => handleExchangeReward(s.id, s.name, '⚡Sticker Siêu Nhân Tin Học', 10)}
                      className="flex-1 sm:flex-none bg-white hover:bg-blue-200 border border-slate-200 hover:border-blue-350 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-2xs transition-all"
                    >
                      ⚡ Siêu Nhân (10⭐)
                    </button>
                    <button
                      onClick={() => handleExchangeReward(s.id, s.name, '🛡️Sticker Chiến Binh', 15)}
                      className="flex-1 sm:flex-none bg-white hover:bg-indigo-300 border border-slate-200 hover:border-indigo-350 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-2xs transition-all"
                    >
                      🛡️ Chiến Binh (15⭐)
                    </button>
                    <button
                      onClick={() => handleExchangeReward(s.id, s.name, '🎖️Sticker Siêu Sao Tin Học', 20)}
                      className="flex-1 sm:flex-none bg-amber-200 hover:bg-amber-600 text-black border border-amber-600 hover:border-amber-700 text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md transition-all "
                    >
                      🎖️ Huy Hiệu (20⭐)
                    </button>
                  </div>

                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                Không tìm thấy học sinh nào thuộc lớp {selectedClass} phù hợp với từ khóa.
              </div>
            )}
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
