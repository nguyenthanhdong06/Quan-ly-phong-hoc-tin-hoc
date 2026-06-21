import React, { useState, useEffect, useMemo } from 'react';
import { Grade, ClassItem, Student, Computer, DocumentItem, Member, AttendanceData, EvaluationData, EmulationDataState, SeatingChart, TimetableData } from './types';
import {
  defaultGrades,
  defaultClasses,
  defaultStudents,
  generateDefaultComputers,
  defaultDocuments,
  defaultMembers,
  defaultAttendance,
  defaultEvaluation,
  defaultEmulation,
  defaultSeating,
  defaultTimetable
} from './data/mockData';

// Subcomponents import
import DashboardTab from './components/DashboardTab';
import StudentsTab from './components/StudentsTab';
import ClassesTab from './components/ClassesTab';
import AttendanceTab from './components/AttendanceTab';
import EvaluationTab from './components/EvaluationTab';
import EmulationTab from './components/EmulationTab';
import SeatingTab from './components/SeatingTab';
import ResourcesTab from './components/ResourcesTab';
import AdminTab from './components/AdminTab';

// Supabase services
import { loadAllSupabaseStates, saveSupabaseState } from './supabaseClient';


// Icons import from Lucide
import {
  Home,
  Users,
  Layers,
  ClipboardCheck,
  Award,
  Sparkles,
  Monitor,
  BookOpen,
  Settings,
  LogIn,
  LogOut,
  X,
  ShieldCheck,
  Menu,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function App() {
  // --- STATE INIT FROM LOCAL STORAGE ---
  const [grades, setGrades] = useState<Grade[]>(() => {
    const local = localStorage.getItem('school_grades');
    return local ? JSON.parse(local) : defaultGrades;
  });

  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const local = localStorage.getItem('school_classes');
    return local ? JSON.parse(local) : defaultClasses;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const local = localStorage.getItem('school_students');
    return local ? JSON.parse(local) : defaultStudents;
  });

  const [computers, setComputers] = useState<Computer[]>(() => {
    const local = localStorage.getItem('school_computers');
    return local ? JSON.parse(local) : generateDefaultComputers();
  });

  const [seatingChart, setSeatingChart] = useState<SeatingChart>(() => {
    const local = localStorage.getItem('school_seating_chart');
    return local ? JSON.parse(local) : defaultSeating;
  });

  const [attendanceData, setAttendanceData] = useState<AttendanceData>(() => {
    const local = localStorage.getItem('school_attendance_data');
    return local ? JSON.parse(local) : defaultAttendance;
  });

  const [evaluationData, setEvaluationData] = useState<EvaluationData>(() => {
    const local = localStorage.getItem('school_evaluation_data');
    return local ? JSON.parse(local) : defaultEvaluation;
  });

  const [emulationDataState, setEmulationDataState] = useState<EmulationDataState>(() => {
    const local = localStorage.getItem('school_emulation_state');
    return local ? JSON.parse(local) : defaultEmulation;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const local = localStorage.getItem('school_documents');
    return local ? JSON.parse(local) : defaultDocuments;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const local = localStorage.getItem('school_members');
    return local ? JSON.parse(local) : defaultMembers;
  });

  const [timetableData, setTimetableData] = useState<TimetableData>(() => {
    const local = localStorage.getItem('school_timetable_data');
    return local ? JSON.parse(local) : defaultTimetable;
  });

  // --- SUPABASE CLOUD STATUS STATES ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // --- INITIAL EFFECT: FETCH FROM SUPABASE ---
  useEffect(() => {
    async function syncFromSupabase() {
      setIsSyncing(true);
      setSupabaseError(null);
      try {
        const dbStates = await loadAllSupabaseStates();
        if (dbStates && Object.keys(dbStates).length > 0) {
          if (dbStates['school_grades']) setGrades(dbStates['school_grades']);
          if (dbStates['school_classes']) setClasses(dbStates['school_classes']);
          if (dbStates['school_students']) setStudents(dbStates['school_students']);
          if (dbStates['school_computers']) setComputers(dbStates['school_computers']);
          if (dbStates['school_seating_chart']) setSeatingChart(dbStates['school_seating_chart']);
          if (dbStates['school_attendance_data']) setAttendanceData(dbStates['school_attendance_data']);
          if (dbStates['school_evaluation_data']) setEvaluationData(dbStates['school_evaluation_data']);
          if (dbStates['school_emulation_state']) setEmulationDataState(dbStates['school_emulation_state']);
          if (dbStates['school_documents']) setDocuments(dbStates['school_documents']);
          if (dbStates['school_members']) setMembers(dbStates['school_members']);
          if (dbStates['school_timetable_data']) setTimetableData(dbStates['school_timetable_data']);
          showToast('Đã đồng bộ hóa toàn bộ cơ sở dữ liệu từ Supabase Cloud!', 'success');
        } else {
          // If Supabase is empty, let the user know and let them push datasets themselves
          console.log('Supabase is empty, waiting for manual database seeding or user creations...');
          setSupabaseError('Cơ sở dữ liệu rỗng (Bấm Đẩy dữ liệu mẫu)');
          showToast('Truy cập Supabase thành công nhưng chưa có dữ liệu trong bảng!', 'error');
        }
      } catch (err: any) {
        console.warn('Initial Supabase fetch failed:', err);
        setSupabaseError(err?.message || 'Lỗi kết nối');
      } finally {
        setIsSyncing(false);
        setIsLoaded(true);
      }
    }
    syncFromSupabase();
  }, []);

  // --- INTERACTION / SYSTEM STATES ---
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'students', 'classes-management', 'attendance', 'evaluation', 'emulation', 'seating', 'resources', 'admin'
  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [selectedClass, setSelectedClass] = useState<string>('Ba 1');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Authentication session
  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    const local = localStorage.getItem('school_current_user');
    return local ? JSON.parse(local) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Custom Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  // Close toast automatically after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Modal Seating handler trigger
  const [activeAssignModal, setActiveAssignModal] = useState<string | null>(null);

  // --- EFFECT: SYNC STATES WITH LOCAL STORAGE & SUPABASE CORES ---
  useEffect(() => {
    localStorage.setItem('school_grades', JSON.stringify(grades));
    if (isLoaded) {
      saveSupabaseState('school_grades', grades);
    }
  }, [grades, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_classes', JSON.stringify(classes));
    if (isLoaded) {
      saveSupabaseState('school_classes', classes);
    }
  }, [classes, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_students', JSON.stringify(students));
    if (isLoaded) {
      saveSupabaseState('school_students', students);
    }
  }, [students, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_computers', JSON.stringify(computers));
    if (isLoaded) {
      saveSupabaseState('school_computers', computers);
    }
  }, [computers, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_seating_chart', JSON.stringify(seatingChart));
    if (isLoaded) {
      saveSupabaseState('school_seating_chart', seatingChart);
    }
  }, [seatingChart, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_attendance_data', JSON.stringify(attendanceData));
    if (isLoaded) {
      saveSupabaseState('school_attendance_data', attendanceData);
    }
  }, [attendanceData, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_evaluation_data', JSON.stringify(evaluationData));
    if (isLoaded) {
      saveSupabaseState('school_evaluation_data', evaluationData);
    }
  }, [evaluationData, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_emulation_state', JSON.stringify(emulationDataState));
    if (isLoaded) {
      saveSupabaseState('school_emulation_state', emulationDataState);
    }
  }, [emulationDataState, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_documents', JSON.stringify(documents));
    if (isLoaded) {
      saveSupabaseState('school_documents', documents);
    }
  }, [documents, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_members', JSON.stringify(members));
    if (isLoaded) {
      saveSupabaseState('school_members', members);
    }
  }, [members, isLoaded]);

  useEffect(() => {
    localStorage.setItem('school_timetable_data', JSON.stringify(timetableData));
    if (isLoaded) {
      saveSupabaseState('school_timetable_data', timetableData);
    }
  }, [timetableData, isLoaded]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('school_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('school_current_user');
    }
  }, [currentUser]);

  // --- DATE TIMING FORMATTERS ---
  const systemDateText = useMemo(() => {
    // Show selectedDate formatted nicely in Vietnamese
    const [year, month, day] = selectedDate.split('-');
    if (!year || !month || !day) return '';
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[dateObj.getDay()];
    return `${dayName}, ngày ${day} tháng ${month} năm ${year}`;
  }, [selectedDate]);

  const isRedemptionPeriod = useMemo(() => {
    // First 15 days of the month is star redemption/exchanging festival
    const day = new Date().getDate();
    return day <= 15;
  }, []);

  const hasAdminOrTeacherAccess = useMemo(() => {
    return currentUser !== null && (
      currentUser.role.includes('Admin') || 
      currentUser.role.includes('Giáo viên')
    );
  }, [currentUser]);

  // Filter classes by grade
  const filteredActiveClasses = useMemo(() => {
    return classes.filter(c => c.gradeId === selectedGrade);
  }, [classes, selectedGrade]);

  // Auto handle selectedClass synchronization when grade changes
  useEffect(() => {
    const firstOfGrade = classes.find(c => c.gradeId === selectedGrade);
    if (firstOfGrade) {
      setSelectedClass(firstOfGrade.id);
    }
  }, [selectedGrade, classes]);

  // --- COMPUTER LAYOUT GROUPS (For 3D-Like classroom representation) ---
  const classroomColumns = useMemo(() => {
    const col1 = [
      ...computers.filter(c => !c.isMerged && c.num >= 33 && c.num <= 35),
      ...computers.filter(c => c.isMerged)
    ];
    const col2 = computers.filter(c => !c.isMerged && c.num >= 25 && c.num <= 32).sort((a,b) => a.num - b.num);
    const col3 = computers.filter(c => !c.isMerged && c.num >= 17 && c.num <= 24).sort((a,b) => a.num - b.num);
    const col4 = computers.filter(c => !c.isMerged && c.num >= 9 && c.num <= 16).sort((a,b) => a.num - b.num);
    const col5 = computers.filter(c => !c.isMerged && c.num >= 1 && c.num <= 8).sort((a,b) => a.num - b.num);

    return [
      { title: 'Dãy 1 (Máy 33-35 + Ghép)', items: col1 },
      { title: 'Dãy 2 (Máy 25-32)', items: col2 },
      { title: 'Dãy 3 (Máy 17-24)', items: col3 },
      { title: 'Dãy 4 (Máy 9-16)', items: col4 },
      { title: 'Dãy 5 (Máy 1-8)', items: col5 }
    ];
  }, [computers]);

  // --- AUTH SERVICES ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = members.find(
      (m) => m.username === loginForm.username.trim().toLowerCase() && loginForm.password === '123456'
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsLoginModalOpen(false);
      showToast(`Đăng nhập thành công! Chào thầy cô: ${foundUser.name}`);
    } else {
      showToast('Tên đăng nhập không chính xác hoặc mật khẩu chưa đúng!', 'error');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      showToast(`Hẹn gặp lại thầy/cô ${currentUser.name}!`);
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- MANUAL CLOUD SYNCHRONIZATION ACTION SERVICES ---
  const forceFetchFromSupabase = async () => {
    setIsSyncing(true);
    setSupabaseError(null);
    try {
      showToast('Đang tải dữ liệu đám mây Supabase...', 'success');
      const dbStates = await loadAllSupabaseStates();
      if (dbStates && Object.keys(dbStates).length > 0) {
        if (dbStates['school_grades']) setGrades(dbStates['school_grades']);
        if (dbStates['school_classes']) setClasses(dbStates['school_classes']);
        if (dbStates['school_students']) setStudents(dbStates['school_students']);
        if (dbStates['school_computers']) setComputers(dbStates['school_computers']);
        if (dbStates['school_seating_chart']) setSeatingChart(dbStates['school_seating_chart']);
        if (dbStates['school_attendance_data']) setAttendanceData(dbStates['school_attendance_data']);
        if (dbStates['school_evaluation_data']) setEvaluationData(dbStates['school_evaluation_data']);
        if (dbStates['school_emulation_state']) setEmulationDataState(dbStates['school_emulation_state']);
        if (dbStates['school_documents']) setDocuments(dbStates['school_documents']);
        if (dbStates['school_members']) setMembers(dbStates['school_members']);
        if (dbStates['school_timetable_data']) setTimetableData(dbStates['school_timetable_data']);
        
        showToast('Tải dữ liệu thành công! Đã ghi nhận đè bộ nhớ cục bộ.', 'success');
      } else {
        showToast('Chưa ghi nhận bản sao lưu nào trên đám mây. Vui lòng chọn Đẩy dữ liệu!', 'error');
        setSupabaseError('Chưa có dữ liệu dự phòng');
      }
    } catch (err: any) {
      showToast('Lỗi tải dữ liệu: ' + (err?.message || err), 'error');
      setSupabaseError(err?.message || 'Lỗi tải');
    } finally {
      setIsSyncing(false);
    }
  };

  const forcePushToSupabase = async () => {
    setIsSyncing(true);
    setSupabaseError(null);
    try {
      showToast('Khởi chạy tiến trình đẩy đồng bộ đám mây...', 'success');
      const results = await Promise.all([
        saveSupabaseState('school_grades', grades),
        saveSupabaseState('school_classes', classes),
        saveSupabaseState('school_students', students),
        saveSupabaseState('school_computers', computers),
        saveSupabaseState('school_seating_chart', seatingChart),
        saveSupabaseState('school_attendance_data', attendanceData),
        saveSupabaseState('school_evaluation_data', evaluationData),
        saveSupabaseState('school_emulation_state', emulationDataState),
        saveSupabaseState('school_documents', documents),
        saveSupabaseState('school_members', members),
        saveSupabaseState('school_timetable_data', timetableData)
      ]);
      
      const allSuccess = results.every(r => r === true);
      if (allSuccess) {
        showToast('Sao lưu và ghi đè đám mây Supabase hoàn thành rực rỡ!', 'success');
      } else {
        showToast('Đẩy dữ liệu thất bại. Quý thầy cô cần cấu hình khởi tạo bảng SQL trước!', 'error');
        setSupabaseError('Lỗi ghi đè (Cần khởi tạo bảng RLS)');
      }
    } catch (err: any) {
      showToast('Lỗi tải dữ liệu lên: ' + (err?.message || err), 'error');
      setSupabaseError(err?.message || 'Lỗi đẩy dữ liệu');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans transition-all relative">
      
      {/* Toast Notification block */}
      {toast.show && (
        <div 
          className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-white transition-all transform translate-y-0 text-sm font-extrabold ${
            toast.type === 'error' ? 'bg-red-500 border border-red-600' : 'bg-emerald-600 border border-emerald-700'
          }`}
        >
          <span>{toast.type === 'error' ? '🚨' : '🎉'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* MOBILE SIDEBAR BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
        />
      )}

      {/* VERTICAL SIDEBAR MENU */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-[#113f43] text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out shrink-0 border-r border-[#1a5a5e]/25
        md:sticky md:top-0 md:h-screen md:translate-x-0
        ${isSidebarCollapsed ? 'w-64 md:w-16' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header Brand */}
        <div className={`p-4 bg-[#0a2c2f] border-b border-[#247c81]/30 flex items-center justify-between shadow-sm shrink-0 ${isSidebarCollapsed ? 'md:flex-col md:gap-3 md:p-3' : ''}`}>
          <div className={`flex items-center gap-2.5 text-left ${isSidebarCollapsed ? 'md:flex-col md:text-center' : ''}`}>
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-2 rounded-xl text-[#0a2c2f] shadow-md border border-amber-300 flex items-center justify-center shrink-0">
              <Monitor className="w-5 h-5 animate-pulse" />
            </div>
            {!isSidebarCollapsed && (
              <div className="transition-all duration-300">
                <h1 className="font-extrabold text-xl uppercase tracking-widest text-white leading-none mb-1">CCM 1.0</h1>
                <p className="text-[11px] text-[#a6d5d8] font-bold leading-none">Trường Tiểu học Long Định</p>
              </div>
            )}
          </div>
          
          {/* Collapse toggle and close buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const next = !isSidebarCollapsed;
                setIsSidebarCollapsed(next);
                localStorage.setItem('sidebar_collapsed', String(next));
              }}
              className="hidden md:inline-flex p-1.5 rounded-lg hover:bg-white/10 text-white cursor-pointer transition-all active:scale-90"
              title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              {isSidebarCollapsed ? (
                <ChevronsRight className="w-4 h-4 text-amber-300 animate-pulse" />
              ) : (
                <ChevronsLeft className="w-4 h-4 text-[#e2f1f2]/80" />
              )}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white md:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vertical Items List */}
        <div className="flex-1 py-2 px-3 space-y-1 overflow-y-auto no-scrollbar scroll-smooth">
          
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileMenuOpen(false);
            }}
            title={isSidebarCollapsed ? "Tổng quan" : ""}
            className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
              isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
            } ${
              activeTab === 'dashboard'
                ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Tổng quan</span>
          </button>

          {hasAdminOrTeacherAccess && (
            <button
              onClick={() => {
                setActiveTab('students');
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Học sinh" : ""}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
              } ${
                activeTab === 'students'
                  ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                  : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Học sinh</span>
            </button>
          )}

          {hasAdminOrTeacherAccess && (
            <button
              onClick={() => {
                setActiveTab('classes-management');
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Khối & Lớp" : ""}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
              } ${
                activeTab === 'classes-management'
                  ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                  : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Khối & Lớp</span>
            </button>
          )}

          {hasAdminOrTeacherAccess && (
            <button
              onClick={() => {
                setActiveTab('attendance');
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Điểm danh (Sổ điểm danh)" : ""}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
              } ${
                activeTab === 'attendance'
                  ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                  : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Điểm danh</span>
            </button>
          )}

          {hasAdminOrTeacherAccess && (
            <button
              onClick={() => {
                setActiveTab('evaluation');
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Sổ nhận xét học trực quan" : ""}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
              } ${
                activeTab === 'evaluation'
                  ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                  : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Nhận xét</span>
            </button>
          )}

          {hasAdminOrTeacherAccess && (
            <button
              onClick={() => {
                setActiveTab('emulation');
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Phong trào thi đua / Đổi quà" : ""}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer active:scale-95 ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
              } ${
                activeTab === 'emulation'
                  ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                  : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
              } ${
                isRedemptionPeriod 
                  ? 'animate-pulse bg-gradient-to-r from-red-650 via-amber-650 to-red-650 text-white border-2 border-yellow-300 shadow' 
                  : ''
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Thi Đua</span>
              {isRedemptionPeriod && (
                <span className={`ml-auto bg-yellow-300 text-red-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tight shrink-0 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                  Quà 🎁
                </span>
              )}
            </button>
          )}

          {hasAdminOrTeacherAccess && (
            <button
              onClick={() => {
                setActiveTab('seating');
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Sơ đồ máy & Chỗ ngồi" : ""}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
              } ${
                activeTab === 'seating'
                  ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                  : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4 shrink-0" />
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Phòng máy</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('resources');
              setIsMobileMenuOpen(false);
            }}
            title={isSidebarCollapsed ? "Học liệu số & Tài nguyên" : ""}
            className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
              isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
            } ${
              activeTab === 'resources'
                ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Học liệu số</span>
          </button>

          {currentUser && currentUser.role.includes('Admin') && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Bảng quản trị hệ thống" : ""}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
              } ${
                activeTab === 'admin'
                  ? 'bg-[#175358] text-amber-300 border-l-4 border-amber-300 shadow-inner font-black'
                  : 'text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Quản trị</span>
            </button>
          )}

          {/* Account Profile & Authentication block */}
          <div className="pt-3 border-t border-[#247c81]/25 mt-2.5 space-y-1.5 shrink-0">
            {!currentUser ? (
               <button
                onClick={() => {
                  setIsLoginModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? "Đăng nhập" : ""}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-[#e2f1f2]/80 hover:bg-white/5 hover:text-white active:scale-95 ${
                  isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
                }`}
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Đăng nhập</span>
              </button>
            ) : (
              <div className="space-y-1.5">
                <div className={`px-4 py-2 rounded-xl bg-[#0a2c2f]/90 border border-[#247c81]/35 flex items-center ${isSidebarCollapsed ? 'md:justify-center md:px-2' : 'gap-3'}`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 flex-1 text-left">
                      <span className="block text-[8px] font-black text-emerald-300 uppercase tracking-widest leading-none mb-1">
                        {currentUser.role === 'Admin' ? 'QUẢN TRỊ VIÊN (ADMIN)' : currentUser.role.toUpperCase()}
                      </span>
                      <p className="text-xs font-black text-white truncate leading-none">
                        {currentUser.name}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  title={isSidebarCollapsed ? "Đăng xuất" : ""}
                  className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider text-red-200 hover:bg-[#802222]/30 hover:text-white transition-all cursor-pointer active:scale-95 border border-red-500/20 ${
                    isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
                  }`}
                >
                  <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                  <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Footer credit */}
        <div className={`p-3.5 bg-[#0a2c2f]/75 border-t border-[#247c81]/25 text-center shrink-0 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
          <p className="text-[9px] text-[#a6d5d8]/70 font-medium">Bản quyền © 2026 bởi</p>
          <p className="text-[9px] text-amber-300 font-extrabold uppercase tracking-widest mt-0.5">Nguyễn Thanh Đồng</p>
        </div>

      </aside>

      {/* RIGHT MAIN PANEL WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOP NAVIGATION BAR - Show only on mobile for menu toggling */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs h-14 flex items-center px-4 shrink-0 justify-between md:hidden animate-fadeIn">
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#1e6a70]">T.H Long Định</span>
          </div>

          {/* Right helper info & Mobile hamburger toggle menu */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100/60 px-3 py-1 rounded-full border border-slate-250/20">
              {systemDateText}
            </span>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Menu dọc"
            >
              <Menu className="w-5 h-5 text-[#1e6a70]" />
            </button>
          </div>

        </nav>

      {/* HEADER SECTION PANEL */}
      <header className="bg-gradient-to-r from-[#113f43] via-[#175358] to-[#1e6a70] text-white shadow-xl sticky top-14 md:top-0 z-20 transition-all border-b border-[#247c81]/30">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 text-left">
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-2.5 rounded-xl text-[#0a2c2f] shadow-md border border-amber-300 flex items-center justify-center shrink-0">
              <Monitor className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-sm">Hệ Thống Số Quản Lý Phòng Học Tin Học</h1>
              <p className="text-xs text-[#a6d5d8] font-semibold flex flex-wrap items-center gap-1.5 mt-1">
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[12px] font-black px-2.5 py-0.5 rounded-lg shadow-sm backdrop-blur-xs">Trường Tiểu học Long Định</span>
                <span className="text-[#a6d5d8]/60">•</span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 rounded-lg text-[9px] text-[#2fe0b1] font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${supabaseError ? 'bg-red-400 animate-pulse' : 'bg-emerald-400 shrink-0'}`}></span>
                  Supabase {supabaseError ? 'Lỗi' : 'Đồng bộ'}
                </span>
                <span className="text-[#a6d5d8]/60">•</span>
                <span>Người chịu trách nhiệm: <strong className="text-amber-300 font-extrabold">{currentUser ? currentUser.name : 'Chưa đăng nhập'}</strong></span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Grades quick selections */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 flex items-center gap-1 border border-white/10 shadow-inner">
              <span className="text-[10px] px-2 font-black text-teal-200 uppercase tracking-wider">Khối:</span>
              {grades.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGrade(g.id)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                    selectedGrade === g.id 
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-[#0a2c2f] shadow-md border border-amber-300 font-extrabold' 
                      : 'hover:bg-white/10 text-white/90'
                  }`}
                >
                  {g.id}
                </button>
              ))}
            </div>

            {/* Classes selector select */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 flex items-center gap-1 border border-white/10 shadow-inner">
              <span className="text-[10px] px-2 font-black text-teal-200 uppercase tracking-wider">Lớp:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-[#113f43]/90 text-white font-extrabold text-xs rounded-lg border border-white/10 focus:ring-2 focus:ring-amber-400 p-1 cursor-pointer pr-5"
              >
                {filteredActiveClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {filteredActiveClasses.length === 0 && (
                  <option value="">Không có lớp</option>
                )}
              </select>
            </div>

          </div>

        </div>
      </header>


      {/* MAIN SCREEN LOADERS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
        
        {activeTab === 'dashboard' && (
          <DashboardTab
            selectedClass={selectedClass}
            selectedDate={selectedDate}
            grades={grades}
            classes={classes}
            students={students}
            computers={computers}
            seatingChart={seatingChart}
            attendanceData={attendanceData}
            evaluationData={evaluationData}
            emulationDataState={emulationDataState}
            documents={documents}
            currentUser={currentUser}
            setActiveTab={setActiveTab}
            systemDateText={systemDateText}
            isSyncing={isSyncing}
            supabaseError={supabaseError}
            onForceSync={forceFetchFromSupabase}
            onForcePush={forcePushToSupabase}
          />
        )}

        {activeTab === 'students' && hasAdminOrTeacherAccess && (
          <StudentsTab
            selectedClass={selectedClass}
            students={students}
            setStudents={setStudents}
            showToast={showToast}
          />
        )}

        {activeTab === 'classes-management' && hasAdminOrTeacherAccess && (
          <ClassesTab
            grades={grades}
            setGrades={setGrades}
            classes={classes}
            setClasses={setClasses}
            students={students}
            setStudents={setStudents}
            showToast={showToast}
          />
        )}

        {activeTab === 'attendance' && hasAdminOrTeacherAccess && (
          <AttendanceTab
            selectedClass={selectedClass}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            students={students}
            attendanceData={attendanceData}
            setAttendanceData={setAttendanceData}
            showToast={showToast}
            systemDateText={systemDateText}
          />
        )}

        {activeTab === 'evaluation' && hasAdminOrTeacherAccess && (
          <EvaluationTab
            selectedClass={selectedClass}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            students={students}
            computers={computers}
            seatingChart={seatingChart}
            evaluationData={evaluationData}
            setEvaluationData={setEvaluationData}
            showToast={showToast}
            systemDateText={systemDateText}
            setEmulationDataState={setEmulationDataState}
          />
        )}

        {activeTab === 'emulation' && hasAdminOrTeacherAccess && (
          <EmulationTab
            selectedClass={selectedClass}
            students={students}
            emulationDataState={emulationDataState}
            setEmulationDataState={setEmulationDataState}
            showToast={showToast}
            isRedemptionPeriod={isRedemptionPeriod}
          />
        )}

        {activeTab === 'seating' && hasAdminOrTeacherAccess && (
          <SeatingTab
            selectedClass={selectedClass}
            computers={computers}
            setComputers={setComputers}
            students={students}
            seatingChart={seatingChart}
            setSeatingChart={setSeatingChart}
            activeAssignModal={activeAssignModal}
            setActiveAssignModal={setActiveAssignModal}
            showToast={showToast}
            classroomColumns={classroomColumns}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab
            documents={documents}
            setDocuments={setDocuments}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {activeTab === 'admin' && currentUser && currentUser.role.includes('Admin') && (
          <AdminTab
            members={members}
            setMembers={setMembers}
            computers={computers}
            setComputers={setComputers}
            currentUser={currentUser}
            showToast={showToast}
            isSyncing={isSyncing}
            supabaseError={supabaseError}
            onForceSync={forceFetchFromSupabase}
            onForcePush={forcePushToSupabase}
            students={students}
            setStudents={setStudents}
            timetableData={timetableData}
            setTimetableData={setTimetableData}
            classes={classes}
          />
        )}

      </main>

      {/* LOGIN MODAL BOX DIALOG */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-fadeIn">
            
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white flex justify-between items-center text-left">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-widest flex items-center gap-1.5">
                  <LogIn className="w-5 h-5" />
                  Đăng Nhập Cổng Giáo Viên
                </h3>
                <p className="text-[10px] text-amber-100 font-semibold mt-0.5">Trường Tiểu học Long Định • Quản trị phòng máy</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="bg-black/10 hover:bg-black/25 text-white rounded-full p-1.5 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-left">

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Tên Đăng Nhập (Email prefix)</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Ví dụ:dong.nt"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Mật khẩu</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Ví dụ:123456789"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl block cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-2.5 rounded-xl block shadow"
                >
                  Xác nhận
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#0a2326] text-[#a6d5d8]/70 text-xs py-8 border-t border-[#247c81]/25 text-center space-y-2 mt-auto">
        <p className="font-extrabold text-[#e2f1f2] uppercase tracking-wider text-xs sm:text-sm">Hệ Thống Số Quản Lý Phòng Học Tin Học Trường Tiểu Học Long Định</p>
        <p className="font-medium text-[11px] sm:text-xs">
          <span>© 2026. Xây dựng và hoàn thiện bởi Giáo Viên </span>
          <strong className="text-amber-300 hover:text-amber-200 transition-colors cursor-pointer">Nguyễn Thanh Đồng.</strong>
        </p>
        <p className="text-[11px] sm:text-xs text-[#a6d5d8]/55">
          <span>Liên hệ hỗ trợ qua Email: </span>
          <span className="text-amber-300/85 underline font-mono select-all hover:text-amber-200 transition-colors">nguyenthanhdong.hutech@gmail.com</span>
        </p>
      </footer>

      </div> {/* RIGHT MAIN PANEL WRAPPER CLOSE */}

    </div>
  );
}
