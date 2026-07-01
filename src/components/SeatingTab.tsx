import React from 'react';
import { Student, Computer, SeatingChart } from '../types';
import { Monitor, X, Wrench, AlertTriangle, PenTool, Clipboard, Search, Check, ChevronDown, Maximize, Minimize, Tv, ZoomIn, ZoomOut, Sun, Moon } from 'lucide-react';
import { googleDriveAvatars } from './AvatarGalleryTab';

// Format name: If name has more than 2 words, display only the middle name and first name (last 2 words)
const formatStudentName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  if (words.length > 2) {
    return words.slice(-2).join(' ');
  }
  return trimmed;
};

// 3D Pixel/Cartoon Avatar component for boy/girl or custom Google Drive URL
const StudentAvatar3D = ({ gender, size = 'w-10 h-10', name = '', avatarUrl }: { gender: string; size?: string; name?: string; avatarUrl?: string }) => {
  const [error, setError] = React.useState(false);
  const srcPath = avatarUrl || (gender === 'Nữ' ? '/Nu.jpg' : '/Nam.jpg');

  React.useEffect(() => {
    // Reset error state if avatarUrl changes
    setError(false);
  }, [avatarUrl]);

  if (error || !srcPath) {
    const isGirl = gender === 'Nữ';
    return (
      <div className={`${size} rounded-full flex items-center justify-center font-extrabold border-2 shadow-inner text-lg shrink-0 ${
        isGirl 
          ? 'bg-gradient-to-tr from-pink-400 to-rose-300 border-pink-200 text-white' 
          : 'bg-gradient-to-tr from-blue-400 to-sky-300 border-blue-200 text-white'
      }`}>
        {isGirl ? '👧🏻' : '👦🏻'}
      </div>
    );
  }

  return (
    <img
      src={srcPath}
      alt={name || "Student Avatar"}
      referrerPolicy="no-referrer"
      onError={() => {
        setError(true);
      }}
      className={`${size} rounded-full object-cover border-2 border-slate-200/90 shadow-md hover:scale-105 transition-transform duration-200 shrink-0`}
    />
  );
};

interface SeatingTabProps {
  selectedClass: string;
  computers: Computer[];
  setComputers: React.Dispatch<React.SetStateAction<Computer[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
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
  setStudents,
  seatingChart,
  setSeatingChart,
  activeAssignModal,
  setActiveAssignModal,
  showToast,
  classroomColumns
}: SeatingTabProps) {

  const classStudents = students.filter(s => s.classId === selectedClass);

  const [modalSearch, setModalSearch] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [scaleSize, setScaleSize] = React.useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [projectorTheme, setProjectorTheme] = React.useState<'dark' | 'light'>('dark');
  const [avatarChangeStudent, setAvatarChangeStudent] = React.useState<Student | null>(null);

  // Drag and drop states for interactive seating rearrangement
  const [draggedOverId, setDraggedOverId] = React.useState<string | null>(null);
  const [activeDraggingId, setActiveDraggingId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, computerId: string) => {
    e.dataTransfer.setData('text/plain', computerId);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDraggingId(computerId);
  };

  const handleDragEnd = () => {
    setActiveDraggingId(null);
    setDraggedOverId(null);
  };

  const handleDragOverCustom = (e: React.DragEvent, computerId: string) => {
    e.preventDefault();
    if (activeDraggingId !== computerId) {
      setDraggedOverId(computerId);
    }
  };

  const handleDragLeaveCustom = () => {
    setDraggedOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetComputerId: string) => {
    e.preventDefault();
    const sourceComputerId = e.dataTransfer.getData('text/plain');
    if (!sourceComputerId || sourceComputerId === targetComputerId) {
      setDraggedOverId(null);
      return;
    }

    setSeatingChart(prev => {
      const currentClassSeating = { ...(prev[selectedClass] || {}) };
      const sourceStudentId = currentClassSeating[sourceComputerId];
      const targetStudentId = currentClassSeating[targetComputerId];

      if (sourceStudentId) {
        if (targetStudentId) {
          // Swap positions of two students
          currentClassSeating[targetComputerId] = sourceStudentId;
          currentClassSeating[sourceComputerId] = targetStudentId;
        } else {
          // Move from source to empty target
          currentClassSeating[targetComputerId] = sourceStudentId;
          delete currentClassSeating[sourceComputerId];
        }
      }
      return {
        ...prev,
        [selectedClass]: currentClassSeating
      };
    });

    setDraggedOverId(null);
    setActiveDraggingId(null);
    showToast('Đổi chỗ học sinh thành công!');
  };

  React.useEffect(() => {
    setModalSearch('');
    setIsDropdownOpen(false);
  }, [activeAssignModal]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyNativeFullscreen = !!document.fullscreenElement;
      if (!isCurrentlyNativeFullscreen && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen();
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleBrowserFullscreen = async () => {
    const nextVal = !isFullscreen;
    setIsFullscreen(nextVal);
    
    try {
      if (nextVal) {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen API is not fully supported or restricted in sandbox iframe:", err);
    }
  };

  const getComputerContrastClasses = (status: string, isThemeDark: boolean) => {
    if (isThemeDark) {
      if (status === 'Đang hỏng') {
        return 'bg-red-950/90 border-red-500/80 text-rose-300 hover:bg-red-900/80';
      } else if (status === 'Bảo trì') {
        return 'bg-blue-950/90 border-blue-500/80 text-blue-200 hover:bg-blue-900/80';
      }
      return 'bg-slate-850 border-amber-500/60 text-amber-200 hover:bg-slate-800 hover:border-amber-400';
    } else {
      if (status === 'Đang hỏng') {
        return 'bg-red-500 border-red-600 text-white hover:bg-red-600';
      } else if (status === 'Bảo trì') {
        return 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600';
      }
      return 'bg-amber-400 border-amber-500 text-slate-900 hover:bg-amber-500 hover:border-amber-600';
    }
  };

  const scaleConfig = {
    sm: {
      card: 'p-1.5 border rounded-lg',
      name: 'text-[11px] font-bold',
      student: 'text-[9px] max-w-[85px]',
      icon: 'w-2 h-2',
      columnSpacing: 'p-2 rounded-xl space-y-2',
      colTitle: 'text-[9px]'
    },
    md: {
      card: 'p-2.5 border-2 rounded-xl',
      name: 'text-xs font-extrabold',
      student: 'text-[10px] max-w-[110px]',
      icon: 'w-3 h-3',
      columnSpacing: 'p-3 rounded-2xl space-y-2.5',
      colTitle: 'text-[10px]'
    },
    lg: {
      card: 'p-3.5 border-2 rounded-xl',
      name: 'text-sm font-black',
      student: 'text-xs font-black max-w-[140px]',
      icon: 'w-3.5 h-3.5',
      columnSpacing: 'p-4 rounded-2xl space-y-3',
      colTitle: 'text-xs'
    },
    xl: {
      card: 'p-5 border-[3px] rounded-2xl',
      name: 'text-lg font-black',
      student: 'text-sm font-black max-w-[180px]',
      icon: 'w-4 h-4',
      columnSpacing: 'p-5 rounded-2xl space-y-4',
      colTitle: 'text-sm'
    }
  };

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
            ✨Mẹo: Click chuột trực tiếp vào ô máy trạm để chỉ định học sinh. 
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-amber-400 border border-amber-500 rounded shadow-sm inline-block"></span>
            <span>Thiết bị tốt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-red-400 border border-red-500 rounded shadow-sm inline-block animate-pulse"></span>
            <span>Gặp Sự Cố</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-blue-400 border border-blue-500 rounded shadow-sm inline-block"></span>
            <span>Bảo Trì</span>
          </div>

          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition duration-150 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Tv className="w-4 h-4 animate-pulse" />
            <span>Chế độ toàn màn hình</span>
          </button>
        </div>

      </div>

      {/* PHYSICAL CLASSROOM POSITION CANVAS */}
      <div className="bg-white p-6 rounded-3xl shadow-md border-4 border-slate-800 space-y-6 overflow-x-auto min-w-[900px]">
        
        {/* UPPER ROW: Teachers Desk, Blackboard, Class Entry gate */}
        <div className="grid grid-cols-12 gap-4 items-center">
          
          {/* Teachers Desk */}
          <div className="col-span-3 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-3 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-6 bg-amber-200 border-2 border-amber-500 rounded mb-1 shadow-sm"></div>
            <strong className="text-xs text-slate-500 block font-bold">BÀN GIÁO VIÊN</strong>
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

                  const isDraggingThis = activeDraggingId === computer.id;
                  const isDraggedOverThis = draggedOverId === computer.id;

                  let statusBg = 'bg-amber-400 border-amber-500 text-slate-800 hover:bg-amber-500';
                  if (computer.status === 'Đang hỏng') {
                    statusBg = 'bg-red-400 border-red-500 text-white hover:bg-red-500';
                  } else if (computer.status === 'Bảo trì') {
                    statusBg = 'bg-blue-400 border-blue-500 text-white hover:bg-blue-500';
                  }

                  let dragClasses = studentObj ? 'cursor-grab active:cursor-grabbing hover:scale-[1.03]' : 'cursor-pointer';
                  if (isDraggingThis) {
                    dragClasses = 'opacity-30 border-dashed scale-95 select-none cursor-grabbing';
                  }

                  let ringClass = '';
                  if (isDraggedOverThis) {
                    ringClass = 'ring-4 ring-indigo-500 ring-offset-2 border-indigo-600 bg-indigo-50 shadow-xl scale-[1.08] z-20 animate-pulse';
                  } else {
                    ringClass = `hover:-translate-y-1 hover:shadow-lg hover:ring-4 ${
                      computer.status === 'Đang hỏng' ? 'hover:ring-rose-455/40' :
                      computer.status === 'Bảo trì' ? 'hover:ring-blue-455/40' : 'hover:ring-amber-455/60'
                    }`;
                  }

                  return (
                    <div
                      key={computer.id}
                      onClick={() => setActiveAssignModal(computer.id)}
                      draggable={!!studentObj}
                      onDragStart={(e) => handleDragStart(e, computer.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOverCustom(e, computer.id)}
                      onDragLeave={handleDragLeaveCustom}
                      onDrop={(e) => handleDrop(e, computer.id)}
                      className={`p-3 border-2 rounded-xl text-center shadow-sm transition-all duration-200 transform active:translate-y-0 ${statusBg} ${dragClasses} ${ringClass}`}
                      title={studentObj ? `Nhấn giữ để kéo thả đổi chỗ [${studentObj.name}]` : 'Nhấp chuột để gán học sinh'}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-black/10 px-1 rounded block">
                          {computer.isMerged ? '💻 Ghép' : '💻 Trạm'}
                        </span>
                        
                        <span className={`w-2 h-2 rounded-full border border-black/10 inline-block ${
                          computer.status === 'Hoạt động' ? 'bg-emerald-500' :
                          computer.status === 'Đang hỏng' ? 'bg-red-600 animate-ping' : 'bg-blue-600'
                        }`} />
                      </div>

                      <p className="text-xs font-black text-slate-900">{computer.name}</p>

                      <div className="mt-1.5 pt-1.5 border-t border-black/3 min-h-[30px] flex items-center justify-center">
                        {studentObj ? (
                          <div className="flex flex-col items-center w-full gap-1.5">
                            {/* 3D Pixel Cartoon Avatar */}
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setAvatarChangeStudent(studentObj);
                              }}
                              className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                              title={`Nhấp vào đây để đổi avatar cho ${studentObj.name}`}
                            >
                              <StudentAvatar3D 
                                gender={studentObj.gender} 
                                size="w-10 h-10" 
                                name={studentObj.name} 
                                avatarUrl={studentObj.avatarUrl}
                              />
                            </div>
                            
                            <div className={`px-2 py-1.5 rounded-xl w-full font-black uppercase tracking-wide text-center whitespace-normal break-words leading-tight text-xs sm:text-[12.5px] ${
                              computer.status === 'Đang hỏng' 
                                ? 'bg-rose-950 text-rose-100 border border-rose-800' 
                                : computer.status === 'Bảo trì'
                                ? 'bg-blue-950 text-blue-100 border border-blue-800'
                                : 'bg-white text-slate-900 border border-slate-300 shadow-md'
                            }`}>
                              {formatStudentName(studentObj.name)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold tracking-wide italic text-black/40 block">Trống</span>
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
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
          <span>Sơ đồ lớp học môn Tin học Trường Tiểu học Long Định</span>
          <span>Bản quyền quản trị @Nguyễn Thanh Đồng</span>
        </div>

      </div>

      {/* SEATING MODAL PANEL SELECTOR */}
      {activeAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-visible border border-slate-100 transform transition-all animate-fadeIn">
            
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex justify-between items-center rounded-t-2xl">
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
                            ? 'bg-amber-500 border-amber-600 text-white shadow-sm' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Student dropdown list */}
              {(() => {
                const currentAssignedId = activeAssignModal ? (seatingChart[selectedClass]?.[activeAssignModal] || '') : '';
                const currentAssignedStudent = currentAssignedId ? classStudents.find(s => s.id === currentAssignedId) : null;
                const filteredClassStudents = classStudents.filter(s => {
                  const searchLower = modalSearch.toLowerCase().trim();
                  if (!searchLower) return true;
                  return s.name.toLowerCase().includes(searchLower) || s.code.toLowerCase().includes(searchLower);
                });

                return (
                  <div className="space-y-3.5 text-left relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Học sinh được chia ngồi máy
                    </label>
                    
                    {/* Beautiful Custom Search Dropdown Trigger box */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder={currentAssignedStudent ? `${currentAssignedStudent.name} (${currentAssignedStudent.code})` : "🔎 Tìm nhanh tên hoặc mã số học sinh..."}
                        value={modalSearch}
                        onChange={(e) => {
                          setModalSearch(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full text-xs pl-10 pr-20 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-none bg-white font-extrabold text-slate-800 cursor-text shadow-xs placeholder-slate-400 transition-all"
                      />
                      
                      <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
                        {modalSearch && (
                          <button
                            type="button"
                            onClick={() => setModalSearch('')}
                            className="text-slate-450 hover:text-slate-700 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
                        >
                          <ChevronDown className={`w-4 h-4 text-slate-450 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Clear selection indicators / warning */}
                    {currentAssignedStudent && !modalSearch && !isDropdownOpen && (
                      <div className="flex justify-between items-center bg-amber-50/80 border border-amber-200 rounded-xl p-3 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">👤</span>
                          <div className="text-left">
                            <p className="text-[10px] font-black tracking-wide text-amber-500 uppercase">Đang gán máy cho</p>
                            <p className="text-xs font-black text-amber-950">
                              {currentAssignedStudent.name} <span className="font-mono font-bold text-amber-700">({currentAssignedStudent.code})</span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleAssignStudent(activeAssignModal, '');
                            setModalSearch('');
                          }}
                          className="text-[10px] font-black text-rose-700 hover:text-white uppercase bg-white hover:bg-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                        >
                          Rút thẻ (Bỏ trống)
                        </button>
                      </div>
                    )}

                    {/* Floating Dropdown Overlay */}
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 focus:outline-none focus:ring-0">
                        
                        {/* Leave empty seat option */}
                        <div className="p-1.5 bg-slate-50/50 sticky top-0 border-b border-slate-100 z-10 backdrop-blur-md">
                          <button
                            type="button"
                            onClick={() => {
                              handleAssignStudent(activeAssignModal, '');
                              setIsDropdownOpen(false);
                              setModalSearch('');
                            }}
                            className={`w-full text-left text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center justify-between transition-all border ${
                              !currentAssignedId 
                                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50/50 hover:border-rose-150'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-base">❌</span>
                              <span>Để trống máy (Rút thẻ học sinh)</span>
                            </span>
                            {!currentAssignedId && <Check className="w-4 h-4 text-rose-700" />}
                          </button>
                        </div>

                        {/* Students loop list - spacious & clear rows */}
                        <div className="p-1.5 space-y-1">
                          {filteredClassStudents.length > 0 ? (
                            filteredClassStudents.map(s => {
                              const otherCompId = Object.keys(seatingChart[selectedClass] || {}).find(
                                key => seatingChart[selectedClass][key] === s.id && key !== activeAssignModal
                              );
                              const otherComp = otherCompId ? computers.find(c => c.id === otherCompId) : null;
                              const isSelected = currentAssignedId === s.id;

                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    handleAssignStudent(activeAssignModal, s.id);
                                    setIsDropdownOpen(false);
                                    setModalSearch('');
                                  }}
                                  className={`w-full text-left text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-between transition border ${
                                    isSelected 
                                      ? 'bg-amber-500 border-amber-600 text-white font-black shadow-md' 
                                      : 'bg-white border-transparent text-slate-800 hover:bg-amber-50/60 hover:border-amber-200'
                                  }`}
                                >
                                  <div className="flex flex-col text-left space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm">
                                        {s.gender === 'Nữ' ? '👧🏻' : '👦🏻'}
                                      </span>
                                      <span className="font-extrabold tracking-tight">
                                        {s.name}
                                      </span>
                                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                                        isSelected 
                                          ? 'bg-amber-600/50 text-amber-50' 
                                          : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {s.code}
                                      </span>
                                    </div>
                                    
                                    {otherComp && (
                                      <span className={`text-[9px] font-bold inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md ${
                                        isSelected 
                                          ? 'bg-amber-600/40 text-amber-100' 
                                          : 'bg-amber-50 border border-amber-100 text-amber-700'
                                      }`}>
                                        ⚠️ Đang ngồi ở: <strong className="uppercase">{otherComp.name}</strong>
                                      </span>
                                    )}
                                  </div>
                                  
                                  {isSelected && (
                                    <div className="bg-white/20 p-1 rounded-full text-white">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="py-6 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-1 bg-slate-50/50 rounded-xl m-1">
                              <span>🔍</span>
                              <span>Không tìm thấy học sinh nào phù hợp</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 leading-normal">
                      Chỉ định một học sinh trong danh sách sinh hoạt lớp <span className="font-extrabold text-slate-500">{selectedClass}</span> vào thiết bị số máy trạm này để chấm điểm chuyên cần thích ứng.
                    </p>
                  </div>
                );
              })()}

              <div className="pt-2 border-t flex justify-end text-xs">
                <button
                  onClick={() => setActiveAssignModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl block cursor-pointer"
                >
                  Xác nhận Khép Lại
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* EXQUISITE CLASSROOM PROJECTOR FULL SCREEN OVERLAY */}
      {isFullscreen && (
        <div className={`fixed inset-0 z-40 flex flex-col p-6 overflow-y-auto ${
          projectorTheme === 'dark' 
            ? 'bg-slate-950 text-slate-100' 
            : 'bg-slate-50 text-slate-900 bg-gradient-to-b from-slate-50 to-slate-100'
        }`}>
          
          {/* Projector Mode Top Control Panel Header */}
          <div className={`flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b ${
            projectorTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-md border border-indigo-450 hidden sm:block">
                <Tv className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-left">
                <h1 className="text-lg font-black uppercase tracking-wider flex flex-wrap items-center gap-2">
                  <span className={`${projectorTheme === 'dark' ? 'text-amber-400' : 'text-slate-800'}`}>SƠ ĐỒ PHÒNG MÁY CHUYÊN DỤNG</span>
                  <span className="text-[9px] bg-amber-500 text-slate-950 font-black py-0.5 px-2 rounded-full tracking-normal uppercase">
                    MÁY CHIẾU LỚP HỌC
                  </span>
                </h1>
                <p className={`text-xs ${projectorTheme === 'dark' ? 'text-slate-400' : 'text-slate-550'} font-semibold`}>
                  Lớp: <span className="font-extrabold uppercase bg-amber-400/25 text-amber-500 border border-amber-500/35 px-1.5 py-0.2 rounded">{selectedClass}</span> • Thầy giáo: <span className="font-extrabold">Nguyễn Thanh Đồng</span> (Giáo viên Tin học)
                </p>
              </div>
            </div>

            {/* Quick configuration tools for projector */}
            <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto justify-end">
              
              {/* Scale Adjuster */}
              <div className={`flex items-center gap-1.5 p-1 rounded-xl ${
                projectorTheme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-200/80 border border-slate-300'
              }`}>
                <span className={`font-black px-2 pointer-events-none text-[10px] uppercase hidden sm:inline ${
                  projectorTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>Thu Phóng Chữ:</span>
                {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setScaleSize(size)}
                    className={`px-3 py-1.5 rounded-lg font-black uppercase transition-all duration-150 cursor-pointer text-[10px] ${
                      scaleSize === size 
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                        : projectorTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {size === 'sm' ? 'Nhỏ' : size === 'md' ? 'Vừa' : size === 'lg' ? 'Lớn' : 'Cực Đại'}
                  </button>
                ))}
              </div>

              {/* Theme Selector */}
              <div className={`flex items-center gap-1 p-1 rounded-xl ${
                projectorTheme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-200/80 border border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setProjectorTheme('dark')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-black text-[10.5px] ${
                    projectorTheme === 'dark'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Chế độ Tối"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Nền tối</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProjectorTheme('light')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-black text-[10.5px] ${
                    projectorTheme === 'light'
                      ? 'bg-white text-indigo-950 shadow-md border border-slate-200'
                      : projectorTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600'
                  }`}
                  title="Chế độ Sáng"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Nền sáng</span>
                </button>
              </div>

              {/* Exit Projection button */}
              <button
                type="button"
                onClick={toggleBrowserFullscreen}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-750 text-white font-black px-4.5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 duration-150 cursor-pointer"
              >
                <Minimize className="w-4 h-4" />
                <span>Thoát Trình Chiếu (ESC)</span>
              </button>
            </div>
          </div>

          {/* Central Physical Classroom Layout mapping */}
          <div className={`flex-1 flex flex-col justify-between max-w-7xl mx-auto w-full p-6 border-4 rounded-3xl transition-colors duration-200 ${
            projectorTheme === 'dark' 
              ? 'bg-slate-900 border-slate-800 shadow-2xl' 
              : 'bg-white border-slate-300 shadow-xl'
          } space-y-8 overflow-x-auto min-w-[1000px]`}>
            
            {/* Projector Header row: Teachers desk, board, entry */}
            <div className="grid grid-cols-12 gap-5 items-center">
              
              {/* Teacher Desk */}
              <div className={`col-span-3 border-2 border-dashed rounded-2xl p-4 text-center ${
                projectorTheme === 'dark' 
                  ? 'bg-slate-950/40 border-slate-800 text-slate-400' 
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <div className="w-14 h-8 bg-amber-500/20 border-2 border-amber-500 rounded-lg mx-auto mb-1.5"></div>
                <strong className="text-xs uppercase tracking-wider block font-bold">BÀN GIÁO VIÊN</strong>
              </div>

              {/* Blackboard board */}
              <div className={`col-span-6 rounded-2xl py-4 shadow-inner border-2 text-center text-white font-black uppercase tracking-widest ${
                projectorTheme === 'dark' 
                  ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-200' 
                  : 'bg-slate-800 border-slate-700 text-slate-100'
              }`}>
                <span className="text-sm md:text-base">MÀN CHIẾU • BẢNG LỚP HỌC</span>
              </div>

              {/* Entry doorway gate */}
              <div className="col-span-3 flex justify-end">
                <div className="bg-amber-500 text-slate-955 font-black text-xs py-4 px-6 rounded-2xl border-2 border-amber-600 shadow-md tracking-wider uppercase text-center">
                  CỬA VÀO PHÒNG
                </div>
              </div>

            </div>

            {/* SEATING COLUMNS MATRIX CONTROLLER */}
            <div className="grid grid-cols-5 gap-4 pt-4 border-t border-dashed border-slate-500/20">
              {classroomColumns.map((col, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`transition-all duration-200 ${scaleConfig[scaleSize].columnSpacing} ${
                    projectorTheme === 'dark' ? 'bg-slate-950/30' : 'bg-slate-50'
                  } border ${
                    projectorTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <p className={`font-black uppercase tracking-wider text-center border-b pb-2 ${
                    scaleConfig[scaleSize].colTitle
                  } ${
                    projectorTheme === 'dark' ? 'text-slate-400 border-slate-805' : 'text-slate-500 border-slate-200'
                  }`}>
                    {col.title}
                  </p>
                  
                  <div className="space-y-2">
                    {col.items.map((computer: Computer) => {
                      const assignedStudentId = seatingChart[selectedClass]?.[computer.id];
                      const studentObj = classStudents.find(s => s.id === assignedStudentId);
                      const statusBg = getComputerContrastClasses(computer.status, projectorTheme === 'dark');

                      const isDraggingThis = activeDraggingId === computer.id;
                      const isDraggedOverThis = draggedOverId === computer.id;

                      let dragClasses = studentObj ? 'cursor-grab active:cursor-grabbing hover:scale-[1.03]' : 'cursor-pointer';
                      if (isDraggingThis) {
                        dragClasses = 'opacity-30 border-dashed scale-95 select-none cursor-grabbing';
                      }

                      let ringClass = '';
                      if (isDraggedOverThis) {
                        ringClass = 'ring-4 ring-indigo-505 ring-offset-2 border-indigo-600 bg-indigo-950/60 shadow-2xl scale-[1.08] z-20 animate-pulse';
                      } else {
                        ringClass = `hover:-translate-y-1.5 hover:shadow-xl hover:ring-4 ${
                          computer.status === 'Đang hỏng' ? 'hover:ring-rose-455/40' :
                          computer.status === 'Bảo trì' ? 'hover:ring-blue-455/40' : 'hover:ring-amber-455/65'
                        }`;
                      }

                      return (
                        <div
                          key={computer.id}
                          onClick={() => setActiveAssignModal(computer.id)}
                          draggable={!!studentObj}
                          onDragStart={(e) => handleDragStart(e, computer.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOverCustom(e, computer.id)}
                          onDragLeave={handleDragLeaveCustom}
                          onDrop={(e) => handleDrop(e, computer.id)}
                          className={`border-2 text-center shadow transition-all duration-200 cursor-pointer transform active:translate-y-0 ${
                            scaleConfig[scaleSize].card
                          } ${statusBg} ${dragClasses} ${ringClass}`}
                          title={studentObj ? `Nhấn giữ để kéo thả đổi chỗ [${studentObj.name}]` : 'Nhấp chuột để gán học sinh'}
                        >
                          <div className="flex justify-between items-center opacity-85">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-black/10 px-1.5 py-0.2 rounded block">
                              {computer.name}
                            </span>
                            
                            <span className={`w-2 h-2 rounded-full border border-black/10 inline-block ${
                              computer.status === 'Hoạt động' ? 'bg-emerald-500' :
                              computer.status === 'Đang hỏng' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                            }`} />
                          </div>

                          <div className="pt-2 border-t border-black/5 min-h-[38px] flex flex-col items-center justify-center">
                            {studentObj ? (
                              <div className="flex flex-col items-center w-full gap-1.5">
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAvatarChangeStudent(studentObj);
                                  }}
                                  className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                  title={`Nhấp vào đây để đổi avatar cho ${studentObj.name}`}
                                >
                                  <StudentAvatar3D 
                                    gender={studentObj.gender} 
                                    size={
                                      scaleSize === 'sm' ? 'w-8 h-8' :
                                      scaleSize === 'md' ? 'w-10 h-10' :
                                      scaleSize === 'lg' ? 'w-12 h-12' : 'w-14 h-14'
                                    } 
                                    name={studentObj.name} 
                                    avatarUrl={studentObj.avatarUrl}
                                  />
                                </div>
                                <div className={`px-2 py-1.5 rounded-xl w-full text-center font-black uppercase tracking-wider shadow-md whitespace-normal break-words leading-tight ${
                                  projectorTheme === 'dark'
                                    ? 'bg-slate-950 text-amber-300 border border-slate-800'
                                    : 'bg-white text-slate-900 border border-slate-300'
                                } ${
                                  scaleSize === 'sm' ? 'text-[11px] sm:text-xs' :
                                  scaleSize === 'md' ? 'text-xs sm:text-[13px]' :
                                  scaleSize === 'lg' ? 'text-[13px] sm:text-sm' :
                                                       'text-sm sm:text-[15px]'
                                }`}>
                                  {formatStudentName(studentObj.name)}
                                </div>
                              </div>
                            ) : (
                              <span className={`italic block opacity-40 text-[9px] font-black uppercase tracking-wider ${
                                projectorTheme === 'dark' ? 'text-slate-400' : 'text-slate-550'
                              }`}>Trống</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>

            {/* Bottom Credits info inside screen */}
            <div className={`pt-4 border-t border-dashed flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider ${
              projectorTheme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
            }`}>
              <span>Trường Tiểu học Long Định • Phòng máy thực nghiệm</span>
              <span>Lớp học Tin học lý thú</span>
            </div>

          </div>

        </div>
      )}

      {/* AVATAR CHANGE MODAL */}
      {avatarChangeStudent && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Close Button */}
            <button 
              onClick={() => setAvatarChangeStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-slate-850 uppercase tracking-tight flex items-center gap-2">
                🎨 Thay đổi Avatar học sinh
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Chọn một trong các avatar cute từ Google Drive cho học sinh <strong className="text-slate-700 font-extrabold">{avatarChangeStudent.name}</strong>.
              </p>
            </div>

            {/* Current Avatar Info */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
              <div className="shrink-0">
                <StudentAvatar3D 
                  gender={avatarChangeStudent.gender} 
                  size="w-14 h-14" 
                  name={avatarChangeStudent.name} 
                  avatarUrl={avatarChangeStudent.avatarUrl} 
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-800">{avatarChangeStudent.name}</h4>
                <p className="text-xs text-slate-400 font-medium">Lớp: {selectedClass} • Giới tính: {avatarChangeStudent.gender}</p>
                {avatarChangeStudent.avatarUrl && (
                  <button
                    onClick={() => {
                      setStudents(prev => prev.map(s => {
                        if (s.id === avatarChangeStudent.id) {
                          const { avatarUrl, ...rest } = s;
                          return rest;
                        }
                        return s;
                      }));
                      showToast(`Đã khôi phục avatar mặc định cho ${avatarChangeStudent.name}!`, 'success');
                      setAvatarChangeStudent(null);
                    }}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-extrabold mt-1.5 flex items-center gap-1 cursor-pointer active:scale-95 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200"
                  >
                    🔄 Khôi phục mặc định
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Avatars */}
            <div className="grid grid-cols-4 gap-3 max-h-[260px] overflow-y-auto p-1">
              {googleDriveAvatars.map((url, idx) => {
                const isSelected = avatarChangeStudent.avatarUrl === url;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setStudents(prev => prev.map(s => {
                        if (s.id === avatarChangeStudent.id) {
                          return { ...s, avatarUrl: url };
                        }
                        return s;
                      }));
                      showToast(`Đã đổi avatar thành công cho học sinh ${avatarChangeStudent.name}!`, 'success');
                      setAvatarChangeStudent(null);
                    }}
                    className={`relative aspect-square rounded-2xl bg-slate-50 border-2 overflow-hidden hover:scale-105 hover:border-amber-400 transition-all cursor-pointer p-1.5 group flex items-center justify-center ${
                      isSelected ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/20 shadow-md' : 'border-slate-150'
                    }`}
                  >
                    <img 
                      src={url} 
                      alt={`Cute Avatar ${idx + 1}`} 
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-150 flex justify-end">
              <button
                onClick={() => setAvatarChangeStudent(null)}
                className="bg-slate-100 hover:bg-slate-250 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
