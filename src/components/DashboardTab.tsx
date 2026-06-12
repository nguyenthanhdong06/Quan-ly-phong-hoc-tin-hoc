import React, { useMemo, useState } from 'react';
import { Grade, ClassItem, Student, Computer, DocumentItem, EmulationDataState } from '../types';
import { Award, Monitor, Activity, Radio, AlertTriangle, FileText, ChevronRight, CheckCircle, HelpCircle, Database, Cloud, RefreshCw, Layers, Users, BookOpen } from 'lucide-react';

interface DashboardTabProps {
  selectedClass: string;
  grades: Grade[];
  classes: ClassItem[];
  students: Student[];
  computers: Computer[];
  seatingChart: { [classId: string]: { [computerId: string]: string } };
  attendanceData: any;
  evaluationData: any;
  emulationDataState: EmulationDataState;
  documents: DocumentItem[];
  currentUser: any;
  setActiveTab: (tab: string) => void;
  systemDateText: string;
  isSyncing?: boolean;
  supabaseError?: string | null;
  onForceSync?: () => Promise<void>;
  onForcePush?: () => Promise<void>;
}

export default function DashboardTab({
  selectedClass,
  grades,
  classes,
  students,
  computers,
  seatingChart,
  attendanceData,
  evaluationData,
  emulationDataState,
  documents,
  currentUser,
  setActiveTab,
  systemDateText,
  isSyncing = false,
  supabaseError = null,
  onForceSync,
  onForcePush
}: DashboardTabProps) {
  
  const [showDbInfo, setShowDbInfo] = useState(true);
  
  // Helpers
  const getStudentCurrentStars = (studentId: string) => {
    const emulationState = emulationDataState[studentId] || { cumulativeStars: 10, exchangedStickers: 0, totalDeducted: 0, badges: [] };
    
    // Total stars = Month Cumulative - totalDeducted
    const deducted = emulationState.totalDeducted !== undefined 
      ? emulationState.totalDeducted 
      : (emulationState.exchangedStickers || 0) * 5;

    return Math.max(0, emulationState.cumulativeStars - deducted);
  };

  // Memoized stats
  const stats = useMemo(() => {
    const totalComps = computers.length;
    const okComps = computers.filter(c => c.status === 'Hoạt động').length;
    const badComps = computers.filter(c => c.status === 'Đang hỏng').length;
    const maintComps = computers.filter(c => c.status === 'Bảo trì').length;
    
    const classSts = students.filter(s => s.classId === selectedClass);
    const assignedStsCount = Object.keys(seatingChart[selectedClass] || {}).length;

    // Sum of all stars awarded to current class
    let totalClassStars = 0;
    classSts.forEach(student => {
      totalClassStars += getStudentCurrentStars(student.id);
    });

    let totalStickersExchanged = 0;
    classSts.forEach(student => {
      const sEm = emulationDataState[student.id] || { exchangedStickers: 0 };
      totalStickersExchanged += sEm.exchangedStickers || 0;
    });

    return {
      totalComps,
      okComps,
      badComps,
      maintComps,
      totalStudentsInClass: classSts.length,
      assignedStudents: assignedStsCount,
      unassignedStudents: Math.max(0, classSts.length - assignedStsCount),
      totalClassStars,
      totalStickersExchanged
    };
  }, [computers, students, selectedClass, seatingChart, emulationDataState]);

  // Filter students for the Golden Board of Honor (having stars >= 20)
  const goldenBoardStudents = useMemo(() => {
    return students
      .filter(s => s.classId === selectedClass && getStudentCurrentStars(s.id) >= 20)
      .map(s => ({
        ...s,
        stars: getStudentCurrentStars(s.id),
        badges: emulationDataState[s.id]?.badges || []
      }))
      .sort((a, b) => b.stars - a.stars);
  }, [students, selectedClass, emulationDataState]);

  const activeClassObj = classes.find(c => c.id === selectedClass);

  return (
    <div className="space-y-6">

      {/* SUPABASE DEPLOYMENT & SYNC CHECK STATION */}
      {showDbInfo && (
        <div id="supabase-db-monitor" className="bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/30 p-5 rounded-3xl text-white shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Trạm Giám Sát Supabase Cloud</span>
              </div>
              <h3 className="text-base font-black flex items-center gap-2 uppercase tracking-wide">
                <Database className="w-5 h-5 text-emerald-400" />
                Kiểm tra Kết nối & Cấu trúc Database thành công
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Dữ liệu hiển thị dưới đây được tải trực tiếp từ cơ sở dữ liệu đám mây Supabase an toàn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-force-sync-dashboard"
                onClick={onForceSync}
                disabled={isSyncing}
                className="bg-emerald-850 hover:bg-emerald-800 shadow border border-emerald-700 hover:border-emerald-500 text-xs text-white font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                Tải lại đám mây
              </button>
              <button
                type="button"
                id="btn-hide-monitor-dashboard"
                onClick={() => setShowDbInfo(false)}
                className="bg-stone-800 hover:bg-stone-700 text-xs text-slate-300 font-bold px-3 py-2 rounded-xl transition cursor-pointer"
              >
                Ẩn bảng điều khiển
              </button>
            </div>
          </div>

          {/* Quick Metrics from Supabase */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-emerald-500/20 text-left">
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-emerald-500/10">
              <span className="block text-[8px] font-black uppercase text-slate-400">Khối Đã Tạo</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" /> {grades.length} khối
              </span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-emerald-500/10">
              <span className="block text-[8px] font-black uppercase text-slate-400">Lớp Đang Quản Lý</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                🏫 {classes.length} lớp học
              </span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-emerald-500/10">
              <span className="block text-[8px] font-black uppercase text-slate-400">Học Sinh Liên Kết</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> {students.length} học sinh
              </span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-emerald-500/10">
              <span className="block text-[8px] font-black uppercase text-slate-400">Máy Trạm Phòng Máy</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <Monitor className="w-3.5 h-3.5 text-emerald-500" /> {computers.length} thiết bị
              </span>
            </div>
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-emerald-500/10 col-span-2 sm:col-span-1">
              <span className="block text-[8px] font-black uppercase text-slate-400">Tài Liệu Số</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> {documents.length} học liệu
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Golden Board of Honor Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Golden scroll (Bảng vàng danh dự) */}
        <div className="lg:col-span-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-6 rounded-3xl shadow-xl border-4 border-yellow-300 text-slate-900 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-950/20 pb-3 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl animate-bounce">👑</span>
                <div>
                  <h2 className="text-xl font-black text-amber-950 uppercase tracking-wide">Bảng Vàng Danh Dự</h2>
                  <p className="text-[11px] text-amber-900 font-bold">Vinh danh những ngôi sao sáng gặt hái từ 20⭐(sao) thi đua trở lên!</p>
                </div>
              </div>
              <span className="bg-amber-950/15 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-amber-900/10">
                Lớp học: {activeClassObj ? activeClassObj.name : selectedClass}
              </span>
            </div>

            {/* Grid of outstanding student badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goldenBoardStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="bg-white/90 hover:bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-yellow-400 shadow-sm flex items-center gap-3 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 flex items-center justify-center text-lg font-black shadow-inner border border-white">
                    🏆
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="text-sm font-black text-slate-800 block truncate">{student.name}</strong>
                    <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider inline-block">
                      Học Sinh Xuất Sắc
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-amber-600 font-extrabold">{student.stars} ⭐</span>
                      {student.badges.slice(0, 2).map(b => (
                        <span key={b} className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold truncate max-w-[80px]">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Placeholder for no outstanding students */}
              {goldenBoardStudents.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white/40 backdrop-blur-sm border border-dashed border-amber-900/15 rounded-2xl p-4 text-amber-950 text-xs font-semibold">
                  🌟 Hãy cùng thi đua đạt trên 20 ⭐ tích lũy trong tháng này để ghi danh lên Bảng Vàng học đường!
                  <p className="text-[10px] text-amber-950/70 italic mt-1 font-medium">(Thầy cô có thể chấm thêm điểm sao cho các em tại mục "Nhận xét đánh giá")</p>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-amber-950/10 flex justify-between items-center text-[10px] text-amber-950 font-bold">
            <span>Thời điểm tổng hợp: {systemDateText}</span>
          </div>
        </div>

        {/* Right column: Class summary statistics */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                Thi Đua Lớp: {activeClassObj ? activeClassObj.name : selectedClass}
              </h3>
              <p className="text-[10px] text-slate-400 text-left">Theo dõi quỹ thi đua khen thưởng của lớp</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase text-left">Sao tích lũy lớp</span>
                <strong className="text-xl text-amber-500 mt-1 block text-left">{stats.totalClassStars} ⭐</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase text-left">Sticker đổi thưởng</span>
                <strong className="text-xl text-indigo-600 mt-1 block text-left">{stats.totalStickersExchanged} 🎁</strong>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-950 leading-relaxed font-semibold text-left">
              🎁 Bé chăm ngoan có thể dùng quỹ sao tích lũy học tập này để tự tin đổi quà Sticker tại mục <strong className="text-red-600 underline cursor-pointer" onClick={() => setActiveTab('emulation')}>Bảng tin thi đua</strong>.
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('emulation')} 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition mt-4"
          >
            Mở tủ Sticker Đổi thưởng →
          </button>
        </div>

      </div>

      {/* Hardware / Computer Status Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase text-left">Tổng số máy trạm</p>
            <p className="text-3xl font-black text-slate-800 mt-1 text-left">{stats.totalComps}</p>
            <p className="text-xs text-slate-400 mt-1 text-left">35 Máy thường + 5 Máy ghép</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <Monitor className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 font-bold uppercase text-left">Đang hoạt động tốt</p>
            <p className="text-3xl font-black text-emerald-600 mt-1 text-left">{stats.okComps}</p>
            <p className="text-xs text-slate-400 mt-1 text-left">Sẵn sàng vận hành 100%</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-red-500 font-bold uppercase text-left">Thiết bị báo hỏng</p>
            <p className="text-3xl font-black text-red-500 mt-1 text-left">{stats.badComps}</p>
            <p className="text-xs text-slate-400 mt-1 text-left">Gửi phiếu chờ sửa chữa</p>
          </div>
          <div className="bg-red-50 p-3 rounded-xl text-red-500">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-500 font-bold uppercase text-left">Đang bảo trì phần mềm</p>
            <p className="text-3xl font-black text-blue-500 mt-1 text-left">{stats.maintComps}</p>
            <p className="text-xs text-slate-400 mt-1 text-left">Nâng cấp và cài đặt hệ thống</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-500">
            <Activity className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Realtime Classroom Position Info & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
            Thông Tin Phân Bổ Tiết Học Hiện Tại
          </h3>
          
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <p className="text-sm font-semibold text-slate-700 text-left">
              Lớp học đang chấm điểm: <span className="text-amber-600 font-black">{activeClassObj ? activeClassObj.name : selectedClass}</span> 
              {activeClassObj?.teacher && <span> | GV Phụ trách: <strong>{activeClassObj.teacher}</strong></span>}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium text-left">Sĩ số học sinh</span>
                <strong className="text-xl text-slate-800 block text-left">{stats.totalStudentsInClass}</strong>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium text-left">Đồng bộ chỗ ngồi</span>
                <strong className="text-xl text-emerald-600 block text-left">{stats.assignedStudents}</strong>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium text-left">Chưa gán máy</span>
                <strong className="text-xl text-amber-600 block text-left">{stats.unassignedStudents}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 border border-dashed border-slate-200 rounded-xl text-left">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                Học liệu tải lên gần nhất
              </h4>
              <div className="space-y-2">
                {documents.slice(0, 2).map(d => (
                  <div key={d.id} className="text-xs flex justify-between items-center p-2 bg-slate-50 rounded border">
                    <span className="truncate font-semibold text-slate-600 max-w-[170px]">{d.title}</span>
                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-bold">{d.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border border-dashed border-slate-200 rounded-xl text-left">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-600" />
                Người đang vận hành
              </h4>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {currentUser ? currentUser.name.substring(0,2).toUpperCase() : 'GV'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{currentUser ? currentUser.name : 'Khách vãng lai'}</p>
                  <p className="text-[10px] text-slate-400">{currentUser ? currentUser.role : 'Giáo viên bộ môn'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Shortcuts card */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between text-left">
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase tracking-wide">Phím tắt tính năng</h3>
            <p className="text-xs text-amber-100 leading-relaxed">
              Phần mềm được tối ưu để hoạt động trơn tru trên mọi thiết bị. Thầy cô có thể di chuyển nhanh tới các nghiệp vụ sau:
            </p>
            
            <div className="space-y-2">
              <button onClick={() => setActiveTab('seating')} className="w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between">
                <span>Vào Sơ đồ Chỗ ngồi phòng máy</span>
                <ChevronRight className="w-4 h-4 text-amber-200" />
              </button>
              <button onClick={() => setActiveTab('students')} className="w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between">
                <span>Nhập nhanh Excel danh sách học sinh</span>
                <ChevronRight className="w-4 h-4 text-amber-200" />
              </button>
              <button onClick={() => setActiveTab('resources')} className="w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between">
                <span>Tải học liệu số / Phân phối chương trình</span>
                <ChevronRight className="w-4 h-4 text-amber-200" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-500/50 mt-6 text-center text-[10px] text-amber-200">
            Truy cập an toàn hệ thống giáo dục tiểu học TH Long Định
          </div>
        </div>

      </div>

    </div>
  );
}
