import React, { useState, useEffect, useMemo } from 'react';
import { Grade, ClassItem, Student, Computer, DocumentItem, Member, AttendanceData, EvaluationData, EmulationDataState, SeatingChart, TimetableData, MotivationalQuote, THEMES } from './types';
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
  defaultTimetable,
  defaultQuotes
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
import { AvatarGalleryTab, loadCustomAvatars } from './components/AvatarGalleryTab';
import AdminTab from './components/AdminTab';
import TimetableTab from './components/TimetableTab';
import { InteractiveGamesTab } from './components/InteractiveGamesTab';
import { PersonalQuestionsTab } from './components/PersonalQuestionsTab';
import ComputerReportTab from './components/ComputerReportTab';
import { KnowledgeGardenTab } from './components/KnowledgeGardenTab';
import CuteMiniRobot from './components/CuteMiniRobot';
import { SciFi3DPopupFrame } from './components/SciFi3DPopupFrame';

// Supabase services
import { loadAllSupabaseStates, saveSupabaseState, setSupabaseOnline } from './supabaseClient';
import { safeSetLocalStorage } from './utils/safeStorage';
import { verifyPassword, sanitizeInput } from './utils/security';
import { createSessionId, setLocalSession, getLocalSession, clearLocalSession } from './features/auth/multiDeviceSession';

// DeskOS Layout Components
import { DeskOSSidebar } from './components/layout/DeskOSSidebar';
import { DeskOSMacWidget } from './components/layout/DeskOSMacWidget';
import { DeskOSAppGrid } from './components/layout/DeskOSAppGrid';
import { DeskOSTaskbar } from './components/layout/DeskOSTaskbar';
import { DeskOSWallpaperSelector, WALLPAPER_OPTIONS } from './components/layout/DeskOSWallpaperSelector';
import { DeskOSMacWindow } from './components/layout/DeskOSMacWindow';


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
  Image,
  Settings,
  LogIn,
  LogOut,
  ArrowRight,
  X,
  Shield,
  ShieldCheck,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  Paintbrush,
  Database,
  RefreshCw,
  Cloud,
  Gamepad2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Puzzle,
  Cpu,
  Eye,
  EyeOff
} from 'lucide-react';



export default function App() {
  // --- COLOR THEME STATE ---
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    return localStorage.getItem('app_theme_id') || 'original';
  });

  const currentTheme = useMemo(() => {
    return THEMES.find(t => t.id === currentThemeId) || THEMES[5];
  }, [currentThemeId]);

  const handleThemeChange = (id: string) => {
    setCurrentThemeId(id);
    localStorage.setItem('app_theme_id', id);
  };

  const [showColorPicker, setShowColorPicker] = useState(false);

  // --- DESK OS WALLPAPER STATE ---
  const [currentWallpaperId, setCurrentWallpaperId] = useState<string>(() => {
    return localStorage.getItem('deskos_wallpaper') || 'vintage-cream';
  });
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isWindowMinimized, setIsWindowMinimized] = useState(false);

  const activeWallpaper = useMemo(() => {
    return WALLPAPER_OPTIONS.find(w => w.id === currentWallpaperId) || WALLPAPER_OPTIONS[0];
  }, [currentWallpaperId]);

  // Helper for safe storage parsing
  const safeParse = <T,>(key: string, fallback: T, isSession = false): T => {
    try {
      const val = isSession ? sessionStorage.getItem(key) : localStorage.getItem(key);
      if (!val) return fallback;
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  };

  // --- STATE INIT FROM LOCAL STORAGE ---
  const [grades, setGrades] = useState<Grade[]>(() => safeParse('school_grades', defaultGrades));
  const [classes, setClasses] = useState<ClassItem[]>(() => safeParse('school_classes', defaultClasses));
  const [students, setStudents] = useState<Student[]>(() => safeParse('school_students', defaultStudents));
  const [computers, setComputers] = useState<Computer[]>(() => safeParse('school_computers', generateDefaultComputers()));
  const [seatingChart, setSeatingChart] = useState<SeatingChart>(() => safeParse('school_seating_chart', defaultSeating));
  const [attendanceData, setAttendanceData] = useState<AttendanceData>(() => safeParse('school_attendance_data', defaultAttendance));
  const [evaluationData, setEvaluationData] = useState<EvaluationData>(() => safeParse('school_evaluation_data', defaultEvaluation));
  const [emulationDataState, setEmulationDataState] = useState<EmulationDataState>(() => safeParse('school_emulation_state', defaultEmulation));
  const [documents, setDocuments] = useState<DocumentItem[]>(() => safeParse('school_documents', defaultDocuments));
  const [members, setMembers] = useState<Member[]>(() => safeParse('school_members', defaultMembers));
  const [timetableData, setTimetableData] = useState<TimetableData>(() => safeParse('school_timetable_data', defaultTimetable));
  const [quotes, setQuotes] = useState<MotivationalQuote[]>(() => safeParse('school_quotes', defaultQuotes));

  // --- SUPABASE CLOUD STATUS STATES ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // --- INTERACTION / SYSTEM STATES ---
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'students', 'classes-management', 'attendance', 'evaluation', 'emulation', 'seating', 'resources', 'avatar-gallery', 'admin', 'interactive-games', 'personal-questions'
  
  // --- DESK OS MULTI-WINDOW STATES ---
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [minimizedTabs, setMinimizedTabs] = useState<string[]>([]);

  const handleOpenApp = (tabId: string) => {
    if (tabId !== 'dashboard') {
      if (!openTabs.includes(tabId)) {
        setOpenTabs(prev => [...prev, tabId]);
      }
      setMinimizedTabs(prev => prev.filter(t => t !== tabId));
    }
    setActiveTab(tabId);
  };

  const handleMinimizeApp = (tabId: string) => {
    if (tabId !== 'dashboard' && !minimizedTabs.includes(tabId)) {
      setMinimizedTabs(prev => [...prev, tabId]);
    }
    setActiveTab('dashboard'); // Return to Overview page so user can open more apps!
  };

  const handleCloseApp = (tabId: string) => {
    setOpenTabs(prev => prev.filter(t => t !== tabId));
    setMinimizedTabs(prev => prev.filter(t => t !== tabId));
    setActiveTab('dashboard');
  };

  const handleRestoreApp = (tabId: string) => {
    setMinimizedTabs(prev => prev.filter(t => t !== tabId));
    setActiveTab(tabId);
  };

  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [selectedClass, setSelectedClass] = useState<string>('Ba 1');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Authentication session
  const [currentUser, setCurrentUser] = useState<Member | null>(() => safeParse('school_current_user', null, true));
  
  // Cài đặt tự động đăng xuất do không hoạt động (phút) - 0 là tắt
  const [inactivityLimit, setInactivityLimit] = useState<number>(() => {
    const saved = localStorage.getItem('school_inactivity_limit');
    return saved ? parseInt(saved, 10) : 10; // Mặc định tự động đăng xuất sau 10 phút
  });

  const [secondsLeft, setSecondsLeft] = useState<number>(inactivityLimit * 60);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isTeachingGroupOpen, setIsTeachingGroupOpen] = useState<boolean>(() => {
    return localStorage.getItem('group_teaching_open') !== 'false';
  });
  const [isLearningGroupOpen, setIsLearningGroupOpen] = useState<boolean>(() => {
    return localStorage.getItem('group_learning_open') !== 'false';
  });
  const [isSystemGroupOpen, setIsSystemGroupOpen] = useState<boolean>(() => {
    return localStorage.getItem('group_system_open') !== 'false';
  });

  const isTeachingGroupActive = isTeachingGroupOpen || ['students', 'classes-management', 'attendance', 'evaluation', 'seating', 'timetable'].includes(activeTab);
  const isLearningGroupActive = isLearningGroupOpen || ['interactive-games', 'personal-questions', 'emulation', 'resources', 'avatar-gallery'].includes(activeTab);
  const isSystemGroupActive = isSystemGroupOpen || ['admin', 'computer-report'].includes(activeTab);
  const isDashboardActive = activeTab === 'dashboard' && !isTeachingGroupActive && !isLearningGroupActive && !isSystemGroupActive;
  const isGameMenuActive = isGameMenuOpen || ['interactive-games', 'personal-questions'].includes(activeTab);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const getTabStyle = (tabName: string) => {
    return activeTab === tabName ? { backgroundColor: currentTheme.medium } : {};
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  // Modal Seating handler trigger
  const [activeAssignModal, setActiveAssignModal] = useState<string | null>(null);

  // Automated scroll lock for any active full-screen popups
  useEffect(() => {
    const checkActiveModals = () => {
      // Find all fixed full-screen modal overlays in the DOM
      const activeModals = document.querySelectorAll('.fixed.inset-0');
      if (activeModals.length > 0) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    // Run check initially
    checkActiveModals();

    // Setup mutation observer to automatically watch for modal additions/removals
    const observer = new MutationObserver(() => {
      checkActiveModals();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

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
          if (dbStates['school_quotes']) setQuotes(dbStates['school_quotes']);
          if (dbStates['custom_avatars_list'] && Array.isArray(dbStates['custom_avatars_list'])) {
            safeSetLocalStorage('custom_avatars_list', dbStates['custom_avatars_list']);
            window.dispatchEvent(new CustomEvent('custom_avatars_updated', { detail: dbStates['custom_avatars_list'] }));
          }
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

  // --- BACKGROUND CLOUD SYNC FOR AVATARS ON WINDOW FOCUS ---
  useEffect(() => {
    const handleFocusOrVisibility = async () => {
      try {
        const dbStates = await loadAllSupabaseStates();
        if (dbStates && dbStates['custom_avatars_list'] && Array.isArray(dbStates['custom_avatars_list'])) {
          safeSetLocalStorage('custom_avatars_list', dbStates['custom_avatars_list']);
          window.dispatchEvent(new CustomEvent('custom_avatars_updated', { detail: dbStates['custom_avatars_list'] }));
        }
        if (dbStates && dbStates['school_students'] && Array.isArray(dbStates['school_students'])) {
          setStudents(dbStates['school_students']);
        }
      } catch (e) {
        // Silent background check
      }
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);
    return () => {
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, []);

  // Auto-expand and synchronize menu groups based on activeTab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setIsTeachingGroupOpen(false);
      setIsLearningGroupOpen(false);
      setIsSystemGroupOpen(false);
      setIsGameMenuOpen(false);
      localStorage.setItem('group_teaching_open', 'false');
      localStorage.setItem('group_learning_open', 'false');
      localStorage.setItem('group_system_open', 'false');
    } else if (['students', 'classes-management', 'attendance', 'evaluation', 'seating', 'timetable'].includes(activeTab)) {
      setIsTeachingGroupOpen(true);
      setIsLearningGroupOpen(false);
      setIsSystemGroupOpen(false);
      setIsGameMenuOpen(false);
      localStorage.setItem('group_teaching_open', 'true');
      localStorage.setItem('group_learning_open', 'false');
      localStorage.setItem('group_system_open', 'false');
    } else if (['emulation', 'resources', 'avatar-gallery', 'interactive-games', 'personal-questions'].includes(activeTab)) {
      setIsLearningGroupOpen(true);
      setIsTeachingGroupOpen(false);
      setIsSystemGroupOpen(false);
      localStorage.setItem('group_learning_open', 'true');
      localStorage.setItem('group_teaching_open', 'false');
      localStorage.setItem('group_system_open', 'false');
      if (['interactive-games', 'personal-questions'].includes(activeTab)) {
        setIsGameMenuOpen(true);
      } else {
        setIsGameMenuOpen(false);
      }
    } else if (['admin', 'computer-report'].includes(activeTab)) {
      setIsSystemGroupOpen(true);
      setIsTeachingGroupOpen(false);
      setIsLearningGroupOpen(false);
      setIsGameMenuOpen(false);
      localStorage.setItem('group_system_open', 'true');
      localStorage.setItem('group_teaching_open', 'false');
      localStorage.setItem('group_learning_open', 'false');
    }
  }, [activeTab]);

  // Close toast automatically after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // --- EFFECT: SYNC STATES WITH LOCAL STORAGE & SUPABASE CORES ---
  useEffect(() => {
    safeSetLocalStorage('school_grades', grades);
    if (isLoaded) {
      saveSupabaseState('school_grades', grades);
    }
  }, [grades, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_classes', classes);
    if (isLoaded) {
      saveSupabaseState('school_classes', classes);
    }
  }, [classes, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_students', students);
    if (isLoaded) {
      saveSupabaseState('school_students', students);
    }
  }, [students, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_computers', computers);
    if (isLoaded) {
      saveSupabaseState('school_computers', computers);
    }
  }, [computers, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_seating_chart', seatingChart);
    if (isLoaded) {
      saveSupabaseState('school_seating_chart', seatingChart);
    }
  }, [seatingChart, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_attendance_data', attendanceData);
    if (isLoaded) {
      saveSupabaseState('school_attendance_data', attendanceData);
    }
  }, [attendanceData, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_evaluation_data', evaluationData);
    if (isLoaded) {
      saveSupabaseState('school_evaluation_data', evaluationData);
    }
  }, [evaluationData, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_emulation_state', emulationDataState);
    if (isLoaded) {
      saveSupabaseState('school_emulation_state', emulationDataState);
    }
  }, [emulationDataState, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_documents', documents);
    if (isLoaded) {
      saveSupabaseState('school_documents', documents);
    }
  }, [documents, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_members', members);
    if (isLoaded) {
      saveSupabaseState('school_members', members);
    }
  }, [members, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_timetable_data', timetableData);
    if (isLoaded) {
      saveSupabaseState('school_timetable_data', timetableData);
    }
  }, [timetableData, isLoaded]);

  useEffect(() => {
    safeSetLocalStorage('school_quotes', quotes);
    if (isLoaded) {
      saveSupabaseState('school_quotes', quotes);
    }
  }, [quotes, isLoaded]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('school_current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('school_current_user');
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
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = sanitizeInput(loginForm.username).toLowerCase();
    const inputPassword = loginForm.password;

    const foundUser = members.find(
      (m) => m.username.trim().toLowerCase() === cleanUsername
    );

    if (foundUser) {
      const isValid = await verifyPassword(inputPassword, foundUser.password || '123456');
      if (isValid) {
        // Tạo Session ID ngẫu nhiên cho phiên làm việc mới
        const newSessionId = createSessionId();
        setLocalSession(newSessionId);

        const updatedUser = { ...foundUser, activeSessionId: newSessionId };
        setCurrentUser(updatedUser);

        // Cập nhật mảng members với activeSessionId mới
        setMembers((prev) => {
          const next = prev.map((m) => (m.id === foundUser.id ? updatedUser : m));
          safeSetLocalStorage('school_members', next);
          saveSupabaseState('school_members', next);
          return next;
        });

        setIsLoginModalOpen(false);
        showToast(`Đăng nhập thành công! Chào thầy cô: ${foundUser.name}`);
        return;
      }
    }

    showToast('Tên đăng nhập hoặc mật khẩu chưa chính xác!', 'error');
  };

  const handleLogout = () => {
    if (currentUser) {
      showToast(`Hẹn gặp lại thầy/cô ${currentUser.name}!`);
    }
    clearLocalSession(); // Clear session ID from LocalStorage
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' }); // Clear credentials on logout
    setIsLoginModalOpen(true);
    setActiveTab('dashboard');
  };

  // --- MULTI-DEVICE SESSION CONTROL (Tự động phát hiện và đăng xuất tài khoản trùng) ---
  useEffect(() => {
    if (!currentUser) return;

    const checkSessionConflict = () => {
      const localSess = getLocalSession();
      const dbUser = members.find((m) => m.id === currentUser.id);

      if (dbUser && dbUser.activeSessionId && localSess && dbUser.activeSessionId !== localSess) {
        showToast(`CẢNH BÁO BẢO MẬT: Tài khoản "${currentUser.name}" vừa được đăng nhập trên một thiết bị khác! Tự động đăng xuất...`, 'error');
        handleLogout();
      }
    };

    const interval = setInterval(checkSessionConflict, 2000);
    window.addEventListener('storage', checkSessionConflict);
    window.addEventListener('focus', checkSessionConflict);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkSessionConflict);
      window.removeEventListener('focus', checkSessionConflict);
    };
  }, [currentUser, members]);

  // --- EFFECT: INACTIVITY SECURITY AUTO LOGOUT ---
  useEffect(() => {
    localStorage.setItem('school_inactivity_limit', inactivityLimit.toString());
    setSecondsLeft(inactivityLimit * 60);
  }, [inactivityLimit]);

  useEffect(() => {
    if (!currentUser || inactivityLimit === 0) {
      setSecondsLeft(0);
      setIsWarningModalOpen(false);
      return;
    }

    setSecondsLeft(inactivityLimit * 60);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCurrentUser(null);
          setActiveTab('dashboard');
          setIsWarningModalOpen(false);
          showToast('Hệ thống tự động đăng xuất do không hoạt động để bảo mật thông tin!', 'error');
          return 0;
        }

        if (prev === 31) {
          setIsWarningModalOpen(true);
        }

        return prev - 1;
      });
    }, 1000);

    const handleUserActivity = () => {
      if (!isWarningModalOpen) {
        setSecondsLeft(inactivityLimit * 60);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity));

    return () => {
      clearInterval(timer);
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [currentUser, inactivityLimit, isWarningModalOpen]);

  // --- MANUAL CLOUD SYNCHRONIZATION ACTION SERVICES ---
  const forceFetchFromSupabase = async () => {
    setIsSyncing(true);
    setSupabaseError(null);
    setSupabaseOnline(true); // Reset connection state on manual action
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
        if (dbStates['school_quotes']) setQuotes(dbStates['school_quotes']);
        if (dbStates['custom_avatars_list'] && Array.isArray(dbStates['custom_avatars_list'])) {
          safeSetLocalStorage('custom_avatars_list', dbStates['custom_avatars_list']);
          window.dispatchEvent(new CustomEvent('custom_avatars_updated', { detail: dbStates['custom_avatars_list'] }));
        }
        
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
    setSupabaseOnline(true); // Reset connection state on manual action
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
        saveSupabaseState('school_timetable_data', timetableData),
        saveSupabaseState('school_quotes', quotes),
        saveSupabaseState('custom_avatars_list', loadCustomAvatars())
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

  const teachingGroupChildren = (
    <>
      <button
        onClick={() => {
          setActiveTab('students');
          setIsMobileMenuOpen(false);
        }}
        title={isSidebarCollapsed ? "Học sinh" : ""}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
          isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
        } ${
          activeTab === 'students'
            ? isSidebarCollapsed
              ? 'text-amber-300 shadow-inner font-black bg-white/10'
              : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
            : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
        }`}
        style={getTabStyle('students')}
      >
        {isSidebarCollapsed && <Users className="w-4 h-4 shrink-0" />}
        <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Học sinh</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('classes-management');
          setIsMobileMenuOpen(false);
        }}
        title={isSidebarCollapsed ? "Khối & Lớp" : ""}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
          isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
        } ${
          activeTab === 'classes-management'
            ? isSidebarCollapsed
              ? 'text-amber-300 shadow-inner font-black bg-white/10'
              : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
            : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
        }`}
        style={getTabStyle('classes-management')}
      >
        {isSidebarCollapsed && <Layers className="w-4 h-4 shrink-0" />}
        <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Khối & Lớp</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('attendance');
          setIsMobileMenuOpen(false);
        }}
        title={isSidebarCollapsed ? "Điểm danh (Sổ điểm danh)" : ""}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
          isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
        } ${
          activeTab === 'attendance'
            ? isSidebarCollapsed
              ? 'text-amber-300 shadow-inner font-black bg-white/10'
              : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
            : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
        }`}
        style={getTabStyle('attendance')}
      >
        {isSidebarCollapsed && <ClipboardCheck className="w-4 h-4 shrink-0" />}
        <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Điểm danh</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('evaluation');
          setIsMobileMenuOpen(false);
        }}
        title={isSidebarCollapsed ? "Sổ nhận xét học trực quan" : ""}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
          isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
        } ${
          activeTab === 'evaluation'
            ? isSidebarCollapsed
              ? 'text-amber-300 shadow-inner font-black bg-white/10'
              : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
            : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
        }`}
        style={getTabStyle('evaluation')}
      >
        {isSidebarCollapsed && <Award className="w-4 h-4 shrink-0" />}
        <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Nhận xét</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('seating');
          setIsMobileMenuOpen(false);
        }}
        title={isSidebarCollapsed ? "Sơ đồ máy & Chỗ ngồi" : ""}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
          isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
        } ${
          activeTab === 'seating'
            ? isSidebarCollapsed
              ? 'text-amber-300 shadow-inner font-black bg-white/10'
              : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
            : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
        }`}
        style={getTabStyle('seating')}
      >
        {isSidebarCollapsed && <Monitor className="w-4 h-4 shrink-0" />}
        <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Phòng máy</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('timetable');
          setIsMobileMenuOpen(false);
        }}
        title={isSidebarCollapsed ? "Thời khóa biểu giảng dạy" : ""}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
          isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
        } ${
          activeTab === 'timetable'
            ? isSidebarCollapsed
              ? 'text-amber-300 shadow-inner font-black bg-white/10'
              : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
            : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
        }`}
        style={getTabStyle('timetable')}
      >
        {isSidebarCollapsed && <Calendar className="w-4 h-4 shrink-0" />}
        <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Thời khóa biểu</span>
      </button>
    </>
  );

  const learningGroupChildren = (
    <>
      <div className="space-y-0.5">
        <button
          onClick={() => {
            setIsGameMenuOpen(!isGameMenuOpen);
          }}
          title={isSidebarCollapsed ? "Trò chơi học tập" : ""}
          className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer active:scale-95 ${
            isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
          } ${
            isGameMenuActive
              ? isSidebarCollapsed
                ? 'text-amber-300 shadow-inner font-black bg-white/10'
                : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
              : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
          }`}
          style={isGameMenuActive ? { backgroundColor: currentTheme.medium } : {}}
        >
          {isSidebarCollapsed && <Gamepad2 className="w-4 h-4 shrink-0" />}
          <span className={isSidebarCollapsed ? 'md:hidden' : 'flex-1 text-left'}>Trò chơi</span>
          {!isSidebarCollapsed && (
            <span className="text-white/60 text-[8px] transition-transform duration-200" style={{ transform: isGameMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          )}
        </button>

        {/* Submenus with smooth transition */}
        {isSidebarCollapsed ? (
          isGameMenuOpen && (
            <div className="flex flex-col items-center gap-1 py-1 animate-in slide-in-from-top-1 duration-150">
              <button
                onClick={() => {
                  setActiveTab('interactive-games');
                  setIsMobileMenuOpen(false);
                }}
                title="Trò chơi tương tác"
                className={`flex items-center gap-2 rounded-lg text-[10px] font-bold tracking-wide transition-all cursor-pointer w-7 h-7 justify-center p-0 text-sm ${
                  activeTab === 'interactive-games'
                    ? 'text-amber-300 bg-white/10 font-black'
                    : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
                }`}
              >
                <span className="text-xs shrink-0">🎮</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('personal-questions');
                  setIsMobileMenuOpen(false);
                }}
                title="Kho câu hỏi cá nhân"
                className={`flex items-center gap-2 rounded-lg text-[10px] font-bold tracking-wide transition-all cursor-pointer w-7 h-7 justify-center p-0 text-sm ${
                  activeTab === 'personal-questions'
                    ? 'text-amber-300 bg-white/10 font-black'
                    : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
                }`}
              >
                <span className="text-xs shrink-0">📚</span>
              </button>
            </div>
          )
        ) : (
          <div className={`submenu-transition ${isGameMenuOpen ? 'open mt-1 mb-2' : ''}`}>
            <div className="overflow-hidden">
              <div className="pl-3.5 ml-2 space-y-1 mt-0.5 mb-1">
                <button
                  onClick={() => {
                    setActiveTab('interactive-games');
                    setIsMobileMenuOpen(false);
                  }}
                  title="Trò chơi tương tác"
                  className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                    activeTab === 'interactive-games'
                      ? 'text-amber-300 bg-white/10 border-l-4 border-amber-300 shadow-inner font-black'
                      : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
                  }`}
                >
                  <span className="truncate">Tương tác lớp</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('personal-questions');
                    setIsMobileMenuOpen(false);
                  }}
                  title="Kho câu hỏi cá nhân"
                  className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                    activeTab === 'personal-questions'
                      ? 'text-amber-300 bg-white/10 border-l-4 border-amber-300 shadow-inner font-black'
                      : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
                  }`}
                >
                  <span className="truncate">Kho câu hỏi</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setActiveTab('emulation');
          setIsMobileMenuOpen(false);
        }}
        title={isSidebarCollapsed ? "Phong trào thi đua / Đổi quà" : ""}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer active:scale-95 ${
          isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
        } ${
          activeTab === 'emulation'
            ? isSidebarCollapsed
              ? 'text-amber-300 shadow-inner font-black bg-white/10'
              : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
            : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
        } ${
          isRedemptionPeriod 
            ? 'animate-pulse bg-gradient-to-r from-red-650 via-amber-650 to-red-650 text-white border-2 border-yellow-300 shadow' 
            : ''
        }`}
        style={getTabStyle('emulation')}
      >
        {isSidebarCollapsed && <Sparkles className="w-4 h-4 shrink-0" />}
        <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Thi Đua</span>
        {isRedemptionPeriod && (
          <span className={`ml-auto bg-yellow-300 text-red-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tight shrink-0 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
            Quà 🎁
          </span>
        )}
      </button>

      {(() => {
        const isUserAdmin = currentUser?.role?.toLowerCase().includes('admin');
        const pendingCount = isUserAdmin ? (documents ? documents.filter(d => d.status === 'pending').length : 0) : 0;
        return (
          <button
            onClick={() => {
              setActiveTab('resources');
              setIsMobileMenuOpen(false);
            }}
            title={isSidebarCollapsed ? `Học liệu số & Tài nguyên${pendingCount > 0 ? ` (${pendingCount} chờ duyệt)` : ''}` : ""}
            className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 relative ${
              isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
            } ${
              activeTab === 'resources'
                ? isSidebarCollapsed
                  ? 'text-amber-300 shadow-inner font-black bg-white/10'
                  : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
                : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
            }`}
            style={getTabStyle('resources')}
          >
            {isSidebarCollapsed && (
              <div className="relative shrink-0 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span 
                    className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full animate-pulse border"
                    style={{ backgroundColor: '#ef4444', borderColor: currentTheme.dark }}
                  />
                )}
              </div>
            )}
            <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Học liệu số</span>
            {pendingCount > 0 && !isSidebarCollapsed && (
              <span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse leading-none shadow-sm shrink-0">
                {pendingCount}
              </span>
            )}
          </button>
        );
      })()}

      <button
        onClick={() => {
          setActiveTab('avatar-gallery');
          setIsMobileMenuOpen(false);
        }}
        title={isSidebarCollapsed ? "Kho avatar" : ""}
        className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 relative ${
          isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
        } ${
          activeTab === 'avatar-gallery'
            ? isSidebarCollapsed
              ? 'text-amber-300 shadow-inner font-black bg-white/10'
              : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
            : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
        }`}
        style={getTabStyle('avatar-gallery')}
      >
        {isSidebarCollapsed && <Image className="w-4 h-4 shrink-0" />}
        <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Kho avatar</span>
      </button>
    </>
  );

  const systemGroupChildren = (
    <>
      {currentUser && currentUser.role.includes('Admin') && (
        <button
          onClick={() => {
            setActiveTab('admin');
            setIsMobileMenuOpen(false);
          }}
          title={isSidebarCollapsed ? "Bảng quản trị hệ thống" : ""}
          className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
            isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
          } ${
            activeTab === 'admin'
              ? isSidebarCollapsed
                ? 'text-amber-300 shadow-inner font-black bg-white/10'
                : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
              : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
          }`}
          style={getTabStyle('admin')}
        >
          {isSidebarCollapsed && <Settings className="w-4 h-4 shrink-0" />}
          <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Quản trị</span>
        </button>
      )}

      {currentUser && (
        <button
          onClick={() => {
            setActiveTab('computer-report');
            setIsMobileMenuOpen(false);
          }}
          title={isSidebarCollapsed ? "Báo cáo phòng máy" : ""}
          className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
            isSidebarCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
          } ${
            activeTab === 'computer-report'
              ? isSidebarCollapsed
                ? 'text-amber-300 shadow-inner font-black bg-white/10'
                : 'text-amber-300 border-l-4 border-amber-300 shadow-inner font-black bg-white/10'
              : 'text-[#e2f1f2]/80 hover:bg-white/12 hover:text-white'
          }`}
          style={getTabStyle('computer-report')}
        >
          {isSidebarCollapsed && <Monitor className="w-4 h-4 shrink-0" />}
          <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Báo cáo phòng máy</span>
        </button>
      )}
    </>
  );

  return (
    <div className={`h-screen max-h-screen overflow-hidden ${activeWallpaper.className} text-slate-800 flex flex-col font-sans transition-all relative select-none`}>
      
      {/* Toast Notification block */}
      {toast.show && (
        <div 
          className={`fixed bottom-16 right-5 z-[100] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-white transition-all transform translate-y-0 text-sm font-extrabold ${
            toast.type === 'error' ? 'bg-red-500 border border-red-600' : 'bg-emerald-600 border border-emerald-700'
          }`}
        >
          <span>{toast.type === 'error' ? '🚨' : '🎉'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* DESK OS MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 w-full mx-auto p-1 sm:p-2 flex flex-col overflow-hidden h-[calc(100vh-50px)]">
          
      {/* MAIN SCREEN LOADERS */}
      <main className="flex-1 w-full mx-auto animate-fadeIn overflow-hidden flex flex-col pb-12">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn h-full overflow-y-auto custom-scrollbar p-2 sm:p-4 pb-16">
            {/* Mac-style Welcome Window Widget */}
            <DeskOSMacWidget currentUser={currentUser} />

            {/* 4x3 App Launcher Grid */}
            <DeskOSAppGrid
              activeTab={activeTab}
              setActiveTab={handleOpenApp}
              currentUser={currentUser}
              activeWallpaper={activeWallpaper}
            />
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <DeskOSMacWindow
            activeTab={activeTab}
            onClose={() => handleCloseApp(activeTab)}
            onMinimize={() => handleMinimizeApp(activeTab)}
            isMinimized={minimizedTabs.includes(activeTab)}
            grades={grades}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            filteredClasses={filteredActiveClasses}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
          >
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
                emulationDataState={emulationDataState}
                attendanceData={attendanceData}
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
                computers={computers}
                seatingChart={seatingChart}
                classes={classes}
                grades={grades}
                systemDateText={systemDateText}
                evaluationData={evaluationData}
                selectedDate={selectedDate}
              />
            )}

            {activeTab === 'knowledge-garden' && (
              <KnowledgeGardenTab
                students={students}
                selectedClass={selectedClass}
                classes={classes}
                onSelectClass={setSelectedClass}
                showToast={showToast}
              />
            )}

            {activeTab === 'seating' && hasAdminOrTeacherAccess && (
              <SeatingTab
                selectedClass={selectedClass}
                computers={computers}
                setComputers={setComputers}
                students={students}
                setStudents={setStudents}
                seatingChart={seatingChart}
                setSeatingChart={setSeatingChart}
                activeAssignModal={activeAssignModal}
                setActiveAssignModal={setActiveAssignModal}
                showToast={showToast}
                classroomColumns={classroomColumns}
              />
            )}

            {activeTab === 'timetable' && hasAdminOrTeacherAccess && (
              <TimetableTab
                timetableData={timetableData}
                members={members}
                currentUser={currentUser}
                showToast={showToast}
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

            {activeTab === 'avatar-gallery' && hasAdminOrTeacherAccess && (
              <AvatarGalleryTab
                students={students}
                setStudents={setStudents}
                classes={classes}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
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
                quotes={quotes}
                setQuotes={setQuotes}
              />
            )}

            {activeTab === 'computer-report' && currentUser && (
              <ComputerReportTab currentUser={currentUser} />
            )}

            {activeTab === 'interactive-games' && hasAdminOrTeacherAccess && (
              <InteractiveGamesTab
                currentUser={currentUser}
                showToast={showToast}
                selectedGrade={selectedGrade}
              />
            )}

            {activeTab === 'personal-questions' && hasAdminOrTeacherAccess && (
              <PersonalQuestionsTab
                currentUser={currentUser}
                showToast={showToast}
                selectedGrade={selectedGrade}
              />
            )}
          </DeskOSMacWindow>
        )}

      </main>

      </div>

      {/* DeskOS Bottom Taskbar */}
      <DeskOSTaskbar
        activeTab={activeTab}
        openTabs={openTabs}
        minimizedTabs={minimizedTabs}
        onMinimizeApp={handleMinimizeApp}
        onRestoreApp={handleRestoreApp}
        onOpenWallpaper={() => setIsWallpaperModalOpen(true)}
        onToggleStartMenu={() => setIsStartMenuOpen(!isStartMenuOpen)}
        isStartMenuOpen={isStartMenuOpen}
        activeWallpaper={activeWallpaper}
      />

      {/* DeskOS Start Menu Popover */}
      <DeskOSSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
      />

      {/* DeskOS Wallpaper Selector Modal */}
      {isWallpaperModalOpen && (
        <DeskOSWallpaperSelector
          currentWallpaperId={currentWallpaperId}
          onSelectWallpaper={(id) => {
            setCurrentWallpaperId(id);
            localStorage.setItem('deskos_wallpaper', id);
          }}
          onClose={() => setIsWallpaperModalOpen(false)}
        />
      )}

      {/* DEDICATED FULLSCREEN LOGIN PAGE (formmaumoi.png & Screenshot 2026-08-01 090051.png) */}
      {(isLoginModalOpen || !currentUser) && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col md:flex-row select-none">
          
          {/* ========================================================================= */}
          {/* VỊ TRÍ SỐ 2: ĐẶT ẢNH 'background.webp' LẤP HẾT KHOẢNG TRỐNG (Left Section) */}
          {/* ========================================================================= */}
          <div className="relative w-full md:w-[58%] lg:w-[62%] h-[35vh] md:h-full overflow-hidden shrink-0">
            {/* Background Image: background.webp */}
            <img
              src="/background.webp?v=1"
              alt="Phòng Học Tin Học Background"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/background.png';
              }}
              className="w-full h-full object-cover object-center select-none pointer-events-none"
            />
            {/* Soft gradient overlay for smooth transition */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/30 via-transparent to-slate-950/40 pointer-events-none" />
          </div>

          {/* ========================================================================= */}
          {/* VỊ TRÍ SỐ 1: PHỦ MÀU XANH HOÀNG GIA #381DFC & ĐẶT 'formdangnhapnoi.webp' Ở TRUNG TÂM */}
          {/* ========================================================================= */}
          <div className="relative w-full md:w-[42%] lg:w-[38%] h-[65vh] md:h-full bg-[#381DFC] flex items-center justify-center p-4 sm:p-6 md:p-8 shadow-2xl z-20">
            
            {/* Seamless Curved Arc Divider matching right panel color #381DFC */}
            <div className="absolute top-0 bottom-0 -left-12 sm:-left-16 md:-left-24 w-12 sm:w-16 md:w-24 pointer-events-none hidden md:block z-10">
              <svg className="w-full h-full text-[#381DFC] fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M100,0 C30,30 30,70 100,100 Z" />
              </svg>
            </div>

            {/* ===================================================================== */}
            {/* KHUNG FILE ẢNH 'formdangnhapnoi.webp' ĐẶT TẠI TRUNG TÂM (No Hover Zoom) */}
            {/* ===================================================================== */}
            <div className="relative w-full max-w-[310px] sm:max-w-[350px] md:max-w-[370px] aspect-[636/960] rounded-[32px] overflow-hidden drop-shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
              
              {/* Background Frame Image: formdangnhapnoi.webp */}
              <img
                src="/formdangnhapnoi.webp?v=1"
                alt="Form Đăng Nhập Frame Nổi"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/formdangnhapnoi.png';
                }}
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
              />

              {/* Form Container */}
              <form onSubmit={handleLoginSubmit} className="absolute inset-0 z-20">

                {/* VỊ TRÍ NHẬP "USER": CĂN CHÍNH GIỮA KHUNG TRẮNG BẦU (Center Y ≈ 43.1%) */}
                <div 
                  className="absolute flex items-center justify-center"
                  style={{
                    top: '40.0%',
                    height: '6.2%',
                    left: '10.0%',
                    width: '80.0%',
                  }}
                >
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    placeholder="tên đăng nhập"
                    className="w-full h-full bg-transparent border-none outline-none text-white font-extrabold text-xs sm:text-sm placeholder:text-white/80 placeholder:font-medium px-3 font-mono leading-none flex items-center"
                    autoFocus
                    required
                  />
                </div>

                {/* VỊ TRÍ NHẬP "PASSWORD": CĂN CHÍNH GIỮA KHUNG TRẮNG BẦU (Center Y ≈ 56.9%) */}
                <div 
                  className="absolute flex items-center justify-center"
                  style={{
                    top: '53.8%',
                    height: '6.2%',
                    left: '10.0%',
                    width: '71.0%',
                  }}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="mật khẩu"
                    className="w-full h-full bg-transparent border-none outline-none text-white font-extrabold text-xs sm:text-sm placeholder:text-white/80 placeholder:font-medium px-3 font-mono leading-none flex items-center"
                    required
                  />
                </div>

                {/* Eye Toggle Password Visibility Button (White Tone Icon) */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-raw absolute flex items-center justify-center cursor-pointer text-white hover:text-purple-200 transition-colors"
                  style={{
                    top: '53.8%',
                    height: '6.2%',
                    left: '81.5%',
                    width: '8.5%',
                  }}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
                </button>

                {/* ================================================================= */}
                {/* NÚT 'ĐĂNG NHẬP' CẤU TRÚC 'buttondnmoi.png' (Tùy chỉnh tỷ lệ ôm gọn chữ) */}
                {/* ================================================================= */}
                <div 
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{
                    top: '66.8%',
                    left: '16.0%',
                    width: '68.0%',
                    height: '6.2%',
                  }}
                >
                  <button
                    type="submit"
                    className="btn-raw pointer-events-auto relative cursor-pointer w-full h-full max-w-[240px] aspect-[654/93] flex items-center justify-center transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] hover:brightness-110 focus:outline-none group bg-transparent border-none p-0 overflow-hidden drop-shadow-[0_6px_20px_rgba(236,72,153,0.45)]"
                    title="Bấm để đăng nhập hệ thống"
                  >
                    {/* Background Image: buttondnmoi.webp - Tỷ lệ 654x93 */}
                    <img
                      src="/buttondnmoi.webp"
                      alt=""
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/buttondnmoi.png';
                      }}
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
                    />

                    {/* Glass Shine Sweep Effect on Hover */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none z-10" />

                    {/* Centered Text "ĐĂNG NHẬP" hugging snugly inside pink-purple capsule frame */}
                    <span className="relative z-20 font-black text-white text-xs sm:text-sm uppercase tracking-[0.18em] drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform">
                      Đăng nhập
                    </span>
                  </button>
                </div>

              </form>
            </div>

          </div>

        </div>
      )}

      {/* SUPABASE SYNCHRONIZATION MODAL */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-emerald-500/30 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            
            {/* Header of the Modal */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-950 p-6 border-b border-emerald-500/20 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/30 shrink-0">
                    <Database className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Đồng bộ đám mây trực tuyến</span>
                    </div>
                    <h3 className="font-extrabold text-base uppercase tracking-wider text-emerald-300">
                      Cơ Sở Dữ Liệu Đám Mây Supabase
                    </h3>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body of the Modal */}
            <div className="p-6 space-y-6 text-left relative z-10">
              
              {/* Introduction Text */}
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wide text-emerald-300">
                  KẾT NỐI THÔNG SUỐT VỚI MÁY CHỦ SUPABASE DATABASE
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  Hạ tầng luôn an toàn. Mọi dữ liệu học sinh, số liệu thi đua, sao tích lũy được bảo toàn tuyệt đối. Dữ liệu được lưu trữ tự động xuống <strong className="text-white">LocalStorage</strong> để hoạt động siêu tốc, sau đó tức thì đồng bộ lên đám mây <strong className="text-emerald-400">Supabase Cloud</strong>.
                </p>
              </div>

              {/* Stats Grid inside Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/10 text-left">
                  <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Phân loại Khối</span>
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1 mt-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" /> {grades.length} khối
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/10 text-left">
                  <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Tổng số lớp</span>
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1 mt-1">
                    🏫 {classes.length} lớp
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/10 text-left">
                  <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Học sinh liên kết</span>
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1 mt-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" /> {students.length} HS
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/10 text-left">
                  <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Máy trạm</span>
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1 mt-1">
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" /> {computers.length} chỗ
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/10 text-left col-span-2 sm:col-span-1">
                  <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Học liệu số</span>
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1 mt-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> {documents.length} tài liệu
                  </span>
                </div>
              </div>

              {/* Cloud Sync Manual Action panel */}
              <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-3">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Các thao tác cưỡng chế đồng bộ</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await forceFetchFromSupabase();
                    }}
                    disabled={isSyncing}
                    className="bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 hover:border-emerald-500/80 text-xs text-white font-extrabold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <div className="text-left">
                      <span className="block text-white">Tải dữ liệu về</span>
                      <span className="block text-[9px] text-emerald-400/80 font-normal">Ghi đè từ đám mây xuống Local</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await forcePushToSupabase();
                    }}
                    disabled={isSyncing}
                    className="bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 hover:border-indigo-500/80 text-xs text-white font-extrabold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    <Cloud className="w-4 h-4 text-indigo-400" />
                    <div className="text-left">
                      <span className="block text-white">Sao lưu lên đám mây</span>
                      <span className="block text-[9px] text-indigo-400/80 font-normal">Đẩy đè dữ liệu hiện tại lên Supabase</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Status footer with connection status */}
              <div className="flex items-center justify-between border-t border-emerald-500/10 pt-4 text-slate-400 text-[10px] font-semibold">
                <span className="flex items-center gap-1.5">
                  Trạng thái kết nối:
                  {supabaseError ? (
                    <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-bold">{supabaseError}</span>
                  ) : (
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">Hoạt động thông suốt</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  Đồng ý & Đóng
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* INACTIVITY WARNING MODAL */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-rose-100 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            
            <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-amber-600 p-6 text-white text-left flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-2xl shrink-0 animate-bounce flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base uppercase tracking-wider">
                  ⚠️ Cảnh Báo An Ninh Phiên Làm Việc
                </h3>
                <p className="text-[10px] text-rose-100 font-semibold mt-0.5">
                  Bảo vệ thông tin & phòng ngừa người khác sử dụng trái phép
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-left">
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống phát hiện tài khoản của thầy/cô <strong className="text-slate-800 font-bold">{currentUser?.name}</strong> đang tạm thời không hoạt động. Để đảm bảo an toàn tuyệt đối cho điểm số và dữ liệu học sinh, phiên làm việc sẽ tự động kết thúc sau:
              </p>

              <div className="flex flex-col items-center justify-center bg-rose-50/50 border border-rose-100 rounded-2xl py-5 space-y-1">
                <span className="text-3xl font-black font-mono text-rose-600 tracking-wider animate-pulse">
                  00:{secondsLeft.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Giây còn lại</span>
              </div>

              <p className="text-[10px] text-slate-450 italic text-center leading-relaxed">
                * Di chuyển chuột hoặc gõ phím không tự động gia hạn khi bảng cảnh báo này đang hiện lên. Vui lòng bấm nút bên dưới để xác nhận thầy/cô vẫn đang làm việc.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentUser(null);
                    setActiveTab('dashboard');
                    setIsWarningModalOpen(false);
                    showToast('Đã chủ động đăng xuất an toàn!', 'success');
                  }}
                  className="w-full sm:w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Đăng xuất ngay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSecondsLeft(inactivityLimit * 60);
                    setIsWarningModalOpen(false);
                    showToast('Đã tiếp tục duy trì phiên đăng nhập!', 'success');
                  }}
                  className="w-full sm:w-2/3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 text-white animate-pulse" />
                  <span>Tôi vẫn đang làm việc!</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
