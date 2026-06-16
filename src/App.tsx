import React, { useState, useEffect, useMemo } from 'react';
import { Grade, ClassItem, Student, Computer, DocumentItem, Member, AttendanceData, EvaluationData, EmulationDataState, SeatingChart } from './types';
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
  defaultSeating
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
  ShieldCheck
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
  const [loginForm, setLoginForm] = useState({ username: 'dong.nt', password: '123' });

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
      (m) => m.username === loginForm.username.trim().toLowerCase() && loginForm.password === '123'
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsLoginModalOpen(false);
      showToast(`Đăng nhập thành công! Chào thầy cô: ${foundUser.name}`);
    } else {
      showToast('Tên đăng nhập không chính xác hoặc mật khẩu (mặc định: 123) chưa đúng!', 'error');
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
        saveSupabaseState('school_members', members)
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-all">
      
      {/* Toast Notification block */}
      {toast.show && (
        <div 
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-white transition-all transform translate-y-0 text-sm font-extrabold ${
            toast.type === 'error' ? 'bg-red-500 border border-red-600' : 'bg-emerald-600 border border-emerald-700'
          }`}
        >
          <span>{toast.type === 'error' ? '🚨' : '🎉'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION PANEL */}
      <header className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 text-left">
            <div className="bg-white p-2.5 rounded-xl text-amber-600 shadow-inner">
              <Monitor className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Hệ Thống Số Quản Lý Phòng Học Tin Học</h1>
              <p className="text-xs text-amber-100 font-semibold flex flex-wrap items-center gap-1.5 mt-1">
                <span>Trường Tiểu Học Long Định</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 bg-amber-700/40 px-2 py-0.5 rounded-lg text-[9px] text-white">
                  <span className={`w-1.5 h-1.5 rounded-full ${supabaseError ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                  Supabase {supabaseError ? 'Lỗi' : 'Đồng bộ'}
                </span>
                <span>•</span>
                <span>Người chịu trách nhiệm: <strong className="underline text-white font-black">{currentUser ? currentUser.name : 'Chưa đăng nhập'}</strong></span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Grades quick selections */}
            <div className="bg-amber-700/35 rounded-xl p-1 flex items-center gap-1 border border-amber-400/40">
              <span className="text-[10px] px-2 font-black text-amber-200 uppercase tracking-wider">Khối:</span>
              {grades.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGrade(g.id)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                    selectedGrade === g.id 
                      ? 'bg-white text-amber-700 shadow-sm border border-white' 
                      : 'hover:bg-amber-600/50 text-white'
                  }`}
                >
                  {g.id}
                </button>
              ))}
            </div>

            {/* Classes selector select */}
            <div className="bg-amber-700/35 rounded-xl p-1 flex items-center gap-1 border border-amber-400/40">
              <span className="text-[10px] px-2 font-black text-amber-200 uppercase tracking-wider">Lớp:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-amber-700 text-white font-extrabold text-xs rounded-lg border-none focus:ring-2 focus:ring-white p-1 cursor-pointer pr-5"
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

      {/* STICKY MAIN NAVIGATION BAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto no-scrollbar py-2 gap-1.5 items-center">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" /> Tổng quan
            </button>
            
            {hasAdminOrTeacherAccess && (
              <button
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'students' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" /> Học sinh
              </button>
            )}

            {/* New CRUD Class & Grade tab */}
            {hasAdminOrTeacherAccess && (
              <button
                onClick={() => setActiveTab('classes-management')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'classes-management' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" /> Khối & Lớp
              </button>
            )}

            {hasAdminOrTeacherAccess && (
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'attendance' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" /> Điểm danh
              </button>
            )}

            {hasAdminOrTeacherAccess && (
              <button
                onClick={() => setActiveTab('evaluation')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'evaluation' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4" /> Nhận xét
              </button>
            )}

            {hasAdminOrTeacherAccess && (
              <button
                onClick={() => setActiveTab('emulation')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap relative ${
                  activeTab === 'emulation'
                    ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 shadow-sm font-black'
                    : 'text-slate-500 hover:bg-slate-100'
                } ${
                  isRedemptionPeriod 
                    ? 'animate-pulse bg-gradient-to-r from-red-500 via-amber-500 to-red-500 text-white border-2 border-yellow-300 shadow scale-105' 
                    : ''
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Góc Thi Đua</span>
                {isRedemptionPeriod && (
                  <span className="ml-1 bg-yellow-300 text-red-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase animate-bounce border border-white">
                    Đổi Quà 🎁
                  </span>
                )}
              </button>
            )}

            {hasAdminOrTeacherAccess && (
              <button
                onClick={() => setActiveTab('seating')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'seating' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Monitor className="w-4 h-4" /> Sơ đồ phòng máy
              </button>
            )}

            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                activeTab === 'resources' 
                  ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Học liệu số
            </button>

            {/* Admin only route */}
            {currentUser && currentUser.role.includes('Admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === 'admin' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" /> Quản trị
              </button>
            )}

            {/* Authentication Button Container */}
            <div className="ml-auto flex items-center pl-4 border-l">
              {!currentUser ? (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-amber-600 border-2 border-amber-400 hover:bg-amber-50 shadow-sm transition"
                >
                  <LogIn className="w-4 h-4" /> Đăng nhập
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="hidden lg:inline text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentUser.role}: <strong className="text-slate-700 font-extrabold">{currentUser.name}</strong></span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* MAIN SCREEN LOADERS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
        
        {activeTab === 'dashboard' && (
          <DashboardTab
            selectedClass={selectedClass}
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
              
              {/* Quick credentials selection */}
              <div className="p-3 bg-slate-50 border rounded-2xl text-left space-y-1.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Đăng nhập nhanh bộ môn (Bản chọn nhanh)</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginForm({ username: 'dong.nt', password: '123' })}
                    className="bg-white hover:bg-amber-100 border text-slate-800 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm transition"
                  >
                    Thầy Đồng (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginForm({ username: 'nam.lh', password: '123' })}
                    className="bg-white hover:bg-amber-100 border text-slate-800 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm transition"
                  >
                    Thầy Nam (Giáo viên)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Tên Đăng Nhập (Email prefix)</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Ví dụ: dong.nt"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Mật khẩu xác thực</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Mật khẩu mặc định: 123"
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
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 text-center space-y-1 mt-auto">
        <p className="font-bold text-slate-300 uppercase tracking-wider">Hệ Thống Số Quản Lý Phòng Học Tin Học Trường Tiểu Học Long Định</p>
        <p>© 2026. Xây dựng và hoàn thiện bởi Giáo Viên Nguyễn Thanh Đồng.</p>
      </footer>

    </div>
  );
}
