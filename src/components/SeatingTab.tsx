import React from 'react';
import { Student, Computer, SeatingChart } from '../types';
import { Monitor, X, Wrench, AlertTriangle, PenTool, Clipboard } from 'lucide-react';

interface SeatingTabProps {
  selectedClass: string;
  computers: Computer[];
  setComputers: React.Dispatch<React.SetStateAction<Computer[]>>;
  students: Student[];
  seatingChart: SeatingChart;
  setSeatingChart: React.Dispatch<React.SetStateAction<SeatingChart>>;
  activeAssignModal: string | null;
  setActiveAssignModal: (computerId: string | null) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  classroomColumns: any[];
}

export default function SeatingTab({
  selectedClass,
  computers,
  setComputers,
  students,
  seatingChart,
  setSeatingChart,
  activeAssignModal,
  setActiveAssignModal,
  showToast,
  classroomColumns
}: SeatingTabProps) {

  const classStudents = students.filter(s => s.classId === selectedClass);

  // Assign student to computer seat
  const handleAssignStudent = (computerId: string, studentId: string) => {
    setSeatingChart(prev => {
      const currentClassSeating = { ...(prev[selectedClass] || {}) };
      if (!studentId) {
        delete currentClassSeating[computerId];
      } else {
        // If student was assigned to another computer in the SAME class, vacate them from previous machine
        Object.keys(currentClassSeating).forEach(key => {
          if (currentClassSeating[key] === studentId) {
            delete currentClassSeating[key];
          }
        });
        currentClassSeating[computerId] = studentId;
      }
      return {
        ...prev,
        [selectedClass]: currentClassSeating
      };
    });
    
    setActiveAssignModal(null);
    showToast('Cập nhật sơ đồ chỗ ngồi thành công!');
  };

  // Change computer hardware status
  const handleUpdateComputerStatus = (computerId: string, newStatus: 'Hoạt động' | 'Đang hỏng' | 'Bảo trì') => {
    setComputers(prev => prev.map(c => c.id === computerId ? { ...c, status: newStatus } : c));
    showToast(`Đã chuyển trạng thái thiết bị thành: ${newStatus}`);
  };

  return (
    <div className="space-y-6">

      {/* Control guidelines */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase">
            Sơ Đồ Phân Máy Phòng Học Tin học
          </h2>
          <p className="text-xs text-slate-400">
            Mẹo: Click chuột trực tiếp vào ô máy trạm để chỉ định vị trí học sinh ngồi thực hành hoặc đánh dấu hỏng hóc nhanh.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-amber-450 border border-amber-500 rounded shadow-sm inline-block"></span>
            <span>Thiết bị tốt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-red-400 border border-red-550 rounded shadow-sm inline-block animate-pulse"></span>
            <span>Gặp Sự Cố</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-blue-400 border border-blue-550 rounded shadow-sm inline-block"></span>
            <span>Bảo Trì</span>
          </div>
        </div>

      </div>

      {/* PHYSICAL CLASSROOM POSITION CANVAS */}
      <div className="bg-white p-6 rounded-3xl shadow-md border-4 border-slate-800 space-y-6 overflow-x-auto min-w-[900px]">
        
        {/* UPPER ROW: Teachers Desk, Blackboard, Class Entry gate */}
        <div className="grid grid-cols-12 gap-4 items-center">
          
          {/* Teachers Desk */}
          <div className="col-span-3 bg-slate-150 border-2 border-dashed border-slate-350 rounded-xl p-3 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-6 bg-amber-250 border-2 border-amber-500 rounded mb-1 shadow-sm"></div>
            <strong className="text-xs text-slate-550 block font-bold">BÀN GIÁO VIÊN</strong>
          </div>

          {/* Blackboard board */}
          <div className="col-span-6 bg-slate-800 text-white rounded-xl py-4 shadow-inner border-2 border-slate-700 text-center relative">
            <span className="font-extrabold text-sm tracking-widest uppercase block">BẢNG LỚP HỌC</span>
          </div>

          {/* Doorway gate */}
          <div className="col-span-3 flex justify-end">
            <div className="bg-amber-500 text-white font-black text-xs py-5 px-6 rounded-xl border-2 border-amber-600 shadow-md text-center max-w-[120px] tracking-wider uppercase">
              CỬA RA VÀO
            </div>
          </div>

        </div>

        {/* COLUMNS MATRIX OF COMPUTERS */}
        <div className="grid grid-cols-5 gap-4 pt-4 border-t border-slate-200">
          {classroomColumns.map((col, colIndex) => (
            <div key={colIndex} className="space-y-3 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-widest pb-1.5 border-b border-slate-200">{col.title}</p>
              
              <div className="space-y-2">
                {col.items.map((computer: Computer) => {
                  const assignedStudentId = seatingChart[selectedClass]?.[computer.id];
                  const studentObj = classStudents.find(s => s.id === assignedStudentId);

                  let statusBg = 'bg-amber-400 border-amber-500 text-slate-800 hover:bg-amber-450';
                  if (computer.status === 'Đang hỏng') {
                    statusBg = 'bg-red-400 border-red-500 text-white hover:bg-red-450';
                  } else if (computer.status === 'Bảo trì') {
                    statusBg = 'bg-blue-400 border-blue-500 text-white hover:bg-blue-450';
                  }

                  return (
                    <div
                      key={computer.id}
                      onClick={() => setActiveAssignModal(computer.id)}
                      className={`p-3 border-2 rounded-xl text-center shadow-sm cursor-pointer transition transform hover:-translate-y-0.5 active:translate-y-0 ${statusBg}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-black/10 px-1 rounded block">
                          {computer.isMerged ? 'Ghép' : 'Trạm'}
                        </span>
                        
                        <span className={`w-2 h-2 rounded-full border border-black/10 inline-block ${
                          computer.status === 'Hoạt động' ? 'bg-emerald-500' :
                          computer.status === 'Đang hỏng' ? 'bg-red-650 animate-ping' : 'bg-blue-650'
                        }`} />
                      </div>

                      <p className="text-xs font-black">{computer.name}</p>

                      <div className="mt-1.5 pt-1.5 border-t border-black/5 min-h-[22px] flex items-center justify-center">
                        {studentObj ? (
                          <p className="text-[10px] font-bold truncate max-w-[120px] text-slate-900 leading-none">
                            {studentObj.name}
                          </p>
                        ) : (
                          <span className="text-[9px] italic text-black/40 block">Trống</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Metadata info */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-450">
          <span>Khảo sát lớp học thực nghiệm môn Tin TH Long Định</span>
          <span>Bản quyền quản trị @Nguyễn Thanh Đồng</span>
        </div>

      </div>

      {/* SEATING MODAL PANEL SELECTOR */}
      {activeAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-fadeIn">
            
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex justify-between items-center">
              <div className="text-left">
                <h3 className="font-extrabold text-sm uppercase">Cập nhật vị trí máy trạm</h3>
                <p className="text-xs text-amber-100">
                  {computers.find(c => c.id === activeAssignModal)?.name} — Lớp quản lý: {selectedClass}
                </p>
              </div>
              <button
                onClick={() => setActiveAssignModal(null)}
                className="bg-black/10 hover:bg-black/20 text-white rounded-full p-1 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Quick status controls */}
              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tình trạng vật lý thiết bị</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Hoạt động', 'Đang hỏng', 'Bảo trì'] as const).map(status => {
                    const isCurrent = computers.find(c => c.id === activeAssignModal)?.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleUpdateComputerStatus(activeAssignModal, status)}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg border-2 transition ${
                          isCurrent 
                            ? 'bg-amber-550 border-amber-600 text-white shadow-sm' 
                            : 'border-slate-200 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Student dropdown list */}
              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Học sinh được chia ngồi máy</label>
                <select
                  onChange={(e) => handleAssignStudent(activeAssignModal, e.target.value)}
                  value={seatingChart[selectedClass]?.[activeAssignModal] || ''}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-700"
                >
                  <option value="">-- Để trống máy (Rút thẻ học sinh) --</option>
                  {classStudents.map(s => {
                    const otherCompId = Object.keys(seatingChart[selectedClass] || {}).find(
                      key => seatingChart[selectedClass][key] === s.id && key !== activeAssignModal
                    );
                    const otherComp = otherCompId ? computers.find(c => c.id === otherCompId) : null;
                    
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} {otherComp ? `(Đang ngồi ${otherComp.name})` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Chỉ định một học sinh trong dánh sách sinh hoạt lớp {selectedClass} vào thiết bị số máy trạm này để chấm điểm chuyên cần thích ứng.
                </p>
              </div>

              <div className="pt-2 border-t flex justify-end text-xs">
                <button
                  onClick={() => setActiveAssignModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold px-4 py-2.5 rounded-xl block"
                >
                  Xác nhận Khép Lại
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
