import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, Computer, SeatingChart, LabInfo, ClassItem, LabIncident, AttendanceData } from '../types';
import { 
  Monitor, X, Wrench, AlertTriangle, PenTool, Clipboard, Search, Check, ChevronDown, 
  Maximize, Minimize, Tv, ZoomIn, ZoomOut, Sun, Moon, ArrowLeft, Palette, Sparkles, 
  RotateCcw, Users, Plus, LayoutGrid, CheckCircle2, UserCheck, ShieldCheck, Image as ImageIcon,
  Sliders, Move, ArrowRightLeft, Upload, Link, CheckCheck, RefreshCw, Zap, Eye, EyeOff, 
  PanelLeftClose, PanelLeftOpen, Printer, UserX, AlertCircle
} from 'lucide-react';
import { extractGoogleDriveFileId, convertGoogleDriveUrl, compressImageFile } from './KnowledgeGardenTab';
import { playButtonClickSound, playVictoryFanfareSound } from '../utils/audioEffects';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState } from '../supabaseClient';

// Helper to generate default lab matrix layout (Rows x Cols) with labels M.01, M.02...
export const generateDefaultLabLayout = (rows: number = 5, cols: number = 8) => {
  const layout: Record<string, { type: 'pc' | 'aisle' | 'desk'; label?: string; pcNumber?: number }> = {};
  let pcCounter = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}_${c}`;
      const pcNumStr = pcCounter < 10 ? `0${pcCounter}` : `${pcCounter}`;
      layout[key] = { 
        type: 'pc', 
        pcNumber: pcCounter, 
        label: `M.${pcNumStr}` 
      };
      pcCounter++;
    }
  }
  return layout;
};

// 3D Pixel/Cartoon Avatar component for boy/girl or custom Google Drive URL
export const StudentAvatar3D = ({ gender, size = 'w-10 h-10', name = '', avatarUrl }: { gender: string; size?: string; name?: string; avatarUrl?: string }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [avatarUrl]);

  const isGirl = gender === 'Nữ';

  if (!avatarUrl || error) {
    return (
      <div 
        className={`${size} rounded-full flex items-center justify-center font-extrabold border-2 shadow-inner select-none shrink-0 ${
          isGirl 
            ? 'bg-gradient-to-tr from-pink-400 to-rose-300 border-pink-200 text-white' 
            : 'bg-gradient-to-tr from-blue-400 to-sky-300 border-blue-200 text-white'
        }`}
        title={name || "Avatar mặc định"}
      >
        <span className="text-[1.25em] leading-none pointer-events-none">
          {isGirl ? '👧🏻' : '👦🏻'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name || "Student Avatar"}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`${size} rounded-full object-cover border-2 border-slate-200/90 shadow-md hover:scale-105 transition-transform duration-200 shrink-0`}
    />
  );
};

/**
 * Format student name: Display ONLY First name + Middle name (Chỉ hiện tên và chữ lót)
 * Examples:
 * - "Nguyễn Thị Bích" -> "Thị Bích"
 * - "Trần Văn An" -> "Văn An"
 * - "Phạm Phương Thảo" -> "Phương Thảo"
 * - "Lê Anh Quân" -> "Anh Quân"
 * - "Vũ Quốc Cường" -> "Quốc Cường"
 */
export const formatStudentNameFirstAndMiddle = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  if (words.length > 2) {
    return words.slice(-2).join(' ');
  }
  return trimmed;
};

// Preset Frame Skin Options for PC Card
export interface FrameSkin {
  id: string;
  name: string;
  icon: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  headerBg: string;
  pillBg: string;
  pillText: string;
  glowShadow: string;
}

export const PRESET_FRAME_SKINS: FrameSkin[] = [
  {
    id: 'imac-beige',
    name: 'iMac Classic Cream (Mặc Định)',
    icon: '🍏',
    bgGradient: 'bg-[#fffbf0]',
    borderColor: 'border-[#cbb89d] hover:border-emerald-500',
    textColor: 'text-slate-900',
    headerBg: 'bg-[#dfccb0] text-slate-800 border-[#cbb89d]',
    pillBg: 'bg-emerald-400 hover:bg-emerald-300',
    pillText: 'text-slate-950 font-black',
    glowShadow: 'shadow-md'
  },
  {
    id: 'modern-slate',
    name: 'Modern Slate Dark',
    icon: '🖥️',
    bgGradient: 'bg-slate-900/90',
    borderColor: 'border-indigo-500/50 hover:border-indigo-400',
    textColor: 'text-slate-100',
    headerBg: 'bg-indigo-950/80 text-indigo-200 border-indigo-500/30',
    pillBg: 'bg-emerald-400 hover:bg-emerald-300',
    pillText: 'text-slate-950 font-black',
    glowShadow: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]'
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon Glow',
    icon: '⚡',
    bgGradient: 'bg-black/95',
    borderColor: 'border-cyan-400 hover:border-fuchsia-400',
    textColor: 'text-cyan-200',
    headerBg: 'bg-gradient-to-r from-cyan-950 to-fuchsia-950 text-cyan-300 border-cyan-500/50',
    pillBg: 'bg-gradient-to-r from-cyan-400 to-fuchsia-400',
    pillText: 'text-black font-black',
    glowShadow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]'
  },
  {
    id: 'emerald-glass',
    name: 'Emerald Glassmorphism',
    icon: '💎',
    bgGradient: 'bg-emerald-950/80 backdrop-blur-md',
    borderColor: 'border-emerald-400/60 hover:border-emerald-300',
    textColor: 'text-emerald-100',
    headerBg: 'bg-emerald-900/70 text-emerald-200 border-emerald-400/40',
    pillBg: 'bg-emerald-400 hover:bg-emerald-300',
    pillText: 'text-emerald-950 font-black',
    glowShadow: 'shadow-[0_0_25px_rgba(52,211,153,0.25)]'
  }
];

export interface PCFrameConfig {
  skinId: string;
  customImageUrl?: string;
  cardSize: 'sm' | 'md' | 'lg' | 'xl';
  borderRadius: string;
  glowEffect: boolean;
}

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
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  classroomColumns: any[];
  labs?: LabInfo[];
  classes?: ClassItem[];
  onSelectClass?: (className: string) => void;
  attendanceData?: AttendanceData;
  selectedDate?: string;
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
  classroomColumns,
  labs = [
    { id: 'lab1', name: 'Phòng Lab 01', code: 'P.201', totalPCs: 36, status: 'Active', location: 'Tầng 2 - Nhà A', gridRows: 5, gridCols: 8 },
    { id: 'lab2', name: 'Phòng Lab 02', code: 'P.202', totalPCs: 40, status: 'Active', location: 'Tầng 2 - Nhà A', gridRows: 5, gridCols: 8 },
    { id: 'lab3', name: 'Phòng Lab 03', code: 'P.301', totalPCs: 32, status: 'Maintenance', location: 'Tầng 3 - Nhà B', gridRows: 4, gridCols: 8 }
  ],
  classes = [],
  onSelectClass,
  attendanceData,
  selectedDate = new Date().toISOString().split('T')[0]
}: SeatingTabProps) {

  // Selected Lab State (default to Lab 01 P.201)
  const [selectedLabId, setSelectedLabId] = useState<string>(labs[0]?.id || 'lab1');
  const activeLab = useMemo(() => {
    return labs.find(l => l.id === selectedLabId) || labs[0];
  }, [labs, selectedLabId]);

  // Realtime Sync Attendance Data State
  const [localAttendance, setLocalAttendance] = useState<AttendanceData>(() => {
    if (attendanceData && Object.keys(attendanceData).length > 0) return attendanceData;
    try {
      const saved = localStorage.getItem('school_attendance_data');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (attendanceData && Object.keys(attendanceData).length > 0) {
      setLocalAttendance(attendanceData);
    }
  }, [attendanceData]);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('school_attendance_data');
        if (saved) setLocalAttendance(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to get attendance status of a student for the selected class and date
  const getStudentAttendance = useCallback((studentId: string): 'present' | 'excused' | 'unexcused' => {
    const classAtt = localAttendance?.[selectedDate]?.[selectedClass];
    if (classAtt && classAtt[studentId]) {
      return classAtt[studentId];
    }
    return 'present';
  }, [localAttendance, selectedDate, selectedClass]);

  // Load Incidents from localStorage to trigger Incident Glow Indicators
  const [incidents, setIncidents] = useState<LabIncident[]>(() => {
    try {
      const saved = localStorage.getItem('school_lab_incidents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('school_lab_incidents');
        if (saved) setIncidents(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Compute exact layout matrix synchronized 100% with the selected Lab from LabBookingTab!
  const activeLabGrid = useMemo(() => {
    const rows = activeLab?.gridRows || 5;
    const cols = activeLab?.gridCols || 8;
    const layoutObj = (activeLab?.customLayout && Object.keys(activeLab.customLayout).length > 0)
      ? activeLab.customLayout
      : generateDefaultLabLayout(rows, cols);

    const cells: Array<{ row: number; col: number; type: 'pc' | 'aisle' | 'desk'; label: string; pcNum: number }> = [];
    const pcList: Array<{ id: string; label: string; pcNum: number }> = [];

    let pCounter = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r}_${c}`;
        const tile = layoutObj[key] || { type: 'pc' };
        if (tile.type === 'pc') {
          const num = tile.pcNumber || pCounter;
          const pcNumStr = num < 10 ? `0${num}` : `${num}`;
          const pcLabel = tile.label || tile.pcLabel || `M.${pcNumStr}`;
          cells.push({ row: r, col: c, type: 'pc', label: pcLabel, pcNum: num });
          pcList.push({ id: pcLabel, label: pcLabel, pcNum: num });
          pCounter++;
        } else {
          cells.push({ row: r, col: c, type: 'aisle', label: 'Lối đi', pcNum: 0 });
        }
      }
    }

    return { rows, cols, cells, pcList };
  }, [activeLab]);

  // Students of current selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClass);
  }, [students, selectedClass]);

  // Compute class attendance summary: { presentCount, excusedCount, unexcusedCount }
  const attendanceSummary = useMemo(() => {
    let present = 0;
    let excused = 0;
    let unexcused = 0;

    classStudents.forEach(s => {
      const att = getStudentAttendance(s.id);
      if (att === 'excused') excused++;
      else if (att === 'unexcused') unexcused++;
      else present++;
    });

    return { total: classStudents.length, present, excused, unexcused, absentTotal: excused + unexcused };
  }, [classStudents, getStudentAttendance]);

  // Seating assignments map for selectedClass: { [computerId]: "std1,std2" }
  const currentClassSeating = useMemo(() => {
    return seatingChart[selectedClass] || {};
  }, [seatingChart, selectedClass]);

  // Helper to parse student IDs assigned to a computer
  const getAssignedStudentIds = useCallback((seatingVal?: string): string[] => {
    if (!seatingVal) return [];
    return seatingVal.split(/[,+;]/).map(s => s.trim()).filter(Boolean);
  }, []);

  // List of student IDs currently assigned to ANY PC in this class
  const assignedStudentIdsList = useMemo(() => {
    const assigned = new Set<string>();
    Object.values(currentClassSeating).forEach((val: any) => {
      getAssignedStudentIds(String(val || '')).forEach(id => assigned.add(id));
    });
    return Array.from(assigned);
  }, [currentClassSeating, getAssignedStudentIds]);

  // List of unassigned students in this class
  const unassignedStudents = useMemo(() => {
    return classStudents.filter(s => !assignedStudentIdsList.includes(s.id));
  }, [classStudents, assignedStudentIdsList]);

  // Toggle Left Unassigned Students Panel Visibility
  const [isUnassignedPanelVisible, setIsUnassignedPanelVisible] = useState<boolean>(true);

  // Search input for unassigned left column
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const filteredUnassignedStudents = useMemo(() => {
    if (!unassignedSearch.trim()) return unassignedStudents;
    const q = unassignedSearch.toLowerCase();
    return unassignedStudents.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.code.toLowerCase().includes(q) ||
      formatStudentNameFirstAndMiddle(s.name).toLowerCase().includes(q)
    );
  }, [unassignedStudents, unassignedSearch]);

  // --- 🔍 QUICK STUDENT FINDER SEARCH STATE ---
  const [searchStudentSeat, setSearchStudentSeat] = useState<string>('');

  // Toggle filter to highlight absent students only
  const [showAbsentOnlyFilter, setShowAbsentOnlyFilter] = useState<boolean>(false);

  // Matches for Quick Student Finder
  const matchingPcIdsForSearch = useMemo(() => {
    if (!searchStudentSeat.trim()) return new Set<string>();
    const q = searchStudentSeat.toLowerCase().trim();
    const matchedPcs = new Set<string>();

    Object.entries(currentClassSeating).forEach(([pcId, valStr]) => {
      const studentIds = getAssignedStudentIds(String(valStr || ''));
      const hasMatch = studentIds.some(id => {
        const st = students.find(s => s.id === id);
        if (!st) return false;
        return st.name.toLowerCase().includes(q) || 
               st.code.toLowerCase().includes(q) || 
               formatStudentNameFirstAndMiddle(st.name).toLowerCase().includes(q);
      });
      if (hasMatch) {
        matchedPcs.add(pcId);
      }
    });

    return matchedPcs;
  }, [searchStudentSeat, currentClassSeating, students, getAssignedStudentIds]);

  // --- 🔍 ZOOM LEVEL CONTROL STATE (80% to 140%) ---
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(140, prev + 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(70, prev - 10));
  const handleZoomReset = () => setZoomLevel(100);

  // --- PC FRAME CUSTOMIZER CONFIG STATE ---
  const [frameConfig, setFrameConfig] = useState<PCFrameConfig>(() => {
    try {
      const saved = localStorage.getItem('deskos_pc_frame_config_v1');
      return saved ? JSON.parse(saved) : {
        skinId: 'imac-beige',
        cardSize: 'md',
        borderRadius: 'rounded-2xl',
        glowEffect: true
      };
    } catch {
      return {
        skinId: 'imac-beige',
        cardSize: 'md',
        borderRadius: 'rounded-2xl',
        glowEffect: true
      };
    }
  });

  const activeSkin = useMemo(() => {
    return PRESET_FRAME_SKINS.find(s => s.id === frameConfig.skinId) || PRESET_FRAME_SKINS[0];
  }, [frameConfig.skinId]);

  useEffect(() => {
    try {
      localStorage.setItem('deskos_pc_frame_config_v1', JSON.stringify(frameConfig));
      saveSupabaseState('school_pc_frame_config', frameConfig);
    } catch (e) {}
  }, [frameConfig]);

  // --- INLINE SUB-VIEW STATE (100% WINDOW TAKEOVER) ---
  const [isFrameConfigSubViewOpen, setIsFrameConfigSubViewOpen] = useState(false);

  // Drag and Drop States
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [draggedSourcePcId, setDraggedSourcePcId] = useState<string | null>(null);
  const [dragOverPcId, setDragOverPcId] = useState<string | null>(null);

  // Card Size Tailwind mappings
  const cardSizeClasses = {
    sm: 'p-2 min-h-[90px]',
    md: 'p-3 min-h-[110px]',
    lg: 'p-3.5 min-h-[130px]',
    xl: 'p-4.5 min-h-[150px]'
  };

  // --- SEATING ASSIGNMENT MUTATION HANDLERS (OPTIMIZED 0MS INSTANT LATENCY) ---
  const saveSeatingState = useCallback((newClassSeating: { [pcId: string]: string }) => {
    const updatedChart: SeatingChart = {
      ...seatingChart,
      [selectedClass]: newClassSeating
    };
    
    // 1. Instant React UI Update with 0ms delay!
    setSeatingChart(updatedChart);

    // 2. Non-blocking Async persistence in background
    setTimeout(() => {
      try {
        localStorage.setItem('school_seating_chart', JSON.stringify(updatedChart));
        saveSupabaseState('school_seating_chart', updatedChart);
      } catch (e) {}
    }, 0);
  }, [seatingChart, selectedClass, setSeatingChart]);

  // Assign student to computer
  const assignStudentToComputer = useCallback((pcId: string, studentId: string) => {
    const currentSeating = { ...currentClassSeating };

    // Check if student is marked absent
    const att = getStudentAttendance(studentId);
    if (att === 'excused' || att === 'unexcused') {
      const st = classStudents.find(s => s.id === studentId);
      showToast(`⚠️ Chú ý: ${st ? formatStudentNameFirstAndMiddle(st.name) : 'Học sinh'} đang được báo VẮNG MẶT hôm nay (${att === 'excused' ? 'Có phép' : 'Không phép'})!`, 'warning');
    }

    // First remove student from any other PC in this class
    Object.keys(currentSeating).forEach(key => {
      const ids = getAssignedStudentIds(currentSeating[key]).filter(id => id !== studentId);
      if (ids.length > 0) {
        currentSeating[key] = ids.join(',');
      } else {
        delete currentSeating[key];
      }
    });

    // Get current students at target PC
    const targetPCHs = getAssignedStudentIds(currentSeating[pcId]);
    if (targetPCHs.length >= 2) {
      showToast('Máy tính này đã đủ 2 học sinh!', 'warning');
      return;
    }

    targetPCHs.push(studentId);
    currentSeating[pcId] = targetPCHs.join(',');
    saveSeatingState(currentSeating);
    playButtonClickSound();

    const st = classStudents.find(s => s.id === studentId);
    showToast(`Đã xếp ${st ? formatStudentNameFirstAndMiddle(st.name) : 'học sinh'} vào ${pcId}!`, 'success');
  }, [currentClassSeating, getAssignedStudentIds, saveSeatingState, classStudents, showToast, getStudentAttendance]);

  // Remove a specific student from a PC
  const unassignStudentFromComputer = useCallback((pcId: string, studentId: string) => {
    const currentSeating = { ...currentClassSeating };
    const targetPCHs = getAssignedStudentIds(currentSeating[pcId]).filter(id => id !== studentId);
    if (targetPCHs.length > 0) {
      currentSeating[pcId] = targetPCHs.join(',');
    } else {
      delete currentSeating[pcId];
    }
    saveSeatingState(currentSeating);
    playButtonClickSound();
    showToast('Đã gỡ học sinh khỏi vị trí máy!', 'info');
  }, [currentClassSeating, getAssignedStudentIds, saveSeatingState, showToast]);

  // Clear all seating for selected class
  const handleClearAllClassSeating = () => {
    if (assignedStudentIdsList.length === 0) {
      showToast('Lớp hiện tại chưa có chỗ ngồi nào được xếp!', 'info');
      return;
    }
    saveSeatingState({});
    playButtonClickSound();
    showToast(`Đã xóa toàn bộ chỗ ngồi của lớp ${selectedClass}!`, 'info');
  };

  // Auto seating algorithm (🪄 Xếp Tự Động - Ưu tiên học sinh CÓ MẶT)
  const handleAutoSeatClass = () => {
    if (classStudents.length === 0) {
      showToast('Lớp học chưa có học sinh nào!', 'warning');
      return;
    }

    const availablePcs = activeLabGrid.pcList;
    if (availablePcs.length === 0) {
      showToast('Không có máy tính nào trong sơ đồ phòng máy này!', 'error');
      return;
    }

    // Sort students: Present students first, Absent students last
    const sortedStudents = [...classStudents].sort((a, b) => {
      const attA = getStudentAttendance(a.id) === 'present' ? 0 : 1;
      const attB = getStudentAttendance(b.id) === 'present' ? 0 : 1;
      return attA - attB;
    });

    const newSeating: { [pcId: string]: string } = {};
    let pcIndex = 0;

    sortedStudents.forEach((st) => {
      const targetPc = availablePcs[pcIndex % availablePcs.length];
      const pcId = targetPc.id;

      const existing = getAssignedStudentIds(newSeating[pcId]);
      if (existing.length < 2) {
        existing.push(st.id);
        newSeating[pcId] = existing.join(',');
      } else {
        pcIndex++;
        const nextPc = availablePcs[pcIndex % availablePcs.length];
        newSeating[nextPc.id] = [st.id].join(',');
      }
    });

    saveSeatingState(newSeating);
    playVictoryFanfareSound();
    showToast(`🪄 Đã xếp tự động chỗ ngồi cho ${classStudents.length} học sinh lớp ${selectedClass} (ưu tiên học sinh có mặt)!`, 'success');
  };

  // Drag handlers
  const handleStudentDragStart = useCallback((e: React.DragEvent, studentId: string, sourcePcId: string | null = null) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ studentId, sourcePcId }));
    setDraggedStudentId(studentId);
    setDraggedSourcePcId(sourcePcId);
  }, []);

  const handlePcDrop = useCallback((e: React.DragEvent, targetPcId: string) => {
    e.preventDefault();
    setDragOverPcId(null);
    const dataRaw = e.dataTransfer.getData('application/json');
    if (!dataRaw) return;

    try {
      const { studentId, sourcePcId } = JSON.parse(dataRaw);
      if (!studentId) return;

      if (sourcePcId === targetPcId) return;

      assignStudentToComputer(targetPcId, studentId);
    } catch (err) {}
  }, [assignStudentToComputer]);

  // 🖨️ PRINT SEATING MAP HANDLER
  const handlePrintSeatingMap = () => {
    window.print();
  };

  // Custom Image URL Upload for PC Frame (Google Drive link or Computer file upload)
  const [customDriveInput, setCustomDriveInput] = useState('');
  const driveFileId = useMemo(() => extractGoogleDriveFileId(customDriveInput), [customDriveInput]);

  const handleApplyDriveFrameImage = () => {
    if (!customDriveInput.trim()) return;
    const processedUrl = convertGoogleDriveUrl(customDriveInput);
    setFrameConfig(prev => ({
      ...prev,
      customImageUrl: processedUrl
    }));
    showToast('Đã áp dụng ảnh khung card từ Google Drive!', 'success');
  };

  const handleUploadFrameImageFromComputer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Đang tối ưu ảnh khung card...', 'info');
      const compressed = await compressImageFile(file, 800, 0.8);
      setFrameConfig(prev => ({
        ...prev,
        customImageUrl: compressed
      }));
      showToast('Đã tải ảnh khung card từ máy tính thành công!', 'success');
    } catch (err) {
      showToast('Lỗi khi tải ảnh, vui lòng thử lại!', 'error');
    }
  };

  // =========================================================================
  // 🎨 INLINE SUB-VIEW: ĐỔI KHUNG CARD PC (100% FULL WINDOW TAKEOVER)
  // =========================================================================
  if (isFrameConfigSubViewOpen) {
    return (
      <div className="space-y-6 text-slate-800 pb-10">
        {/* Header Bar */}
        <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
          <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFrameConfigSubViewOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#cbb89d] font-black text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" /> Quay Về Sơ Đồ Phòng Máy
              </button>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span>🎨</span> THIẾT LẬP & ĐỔI KHUNG CARD PC SƠ ĐỒ PHÒNG MÁY
                </h3>
                <p className="text-[11px] font-bold text-slate-600">Tùy biến viền card PC, màu sắc, hình nền từ Google Drive hoặc máy tính</p>
              </div>
            </div>

            <button
              onClick={() => setIsFrameConfigSubViewOpen(false)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              ✓ Hoàn Tất & Áp Dụng
            </button>
          </div>
        </div>

        {/* Customizer Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Presets Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>🌟</span> MẪU PRESET KHUNG CARD CÓ SẴN
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_FRAME_SKINS.map(skin => {
                  const isSelected = frameConfig.skinId === skin.id && !frameConfig.customImageUrl;
                  return (
                    <div
                      key={skin.id}
                      onClick={() => {
                        setFrameConfig(prev => ({
                          ...prev,
                          skinId: skin.id,
                          customImageUrl: undefined
                        }));
                        showToast(`Đã chọn mẫu khung "${skin.name}"!`, 'info');
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-400/30' 
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <span className="text-3xl">{skin.icon}</span>
                      <div>
                        <div className="font-black text-xs text-slate-900">{skin.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">Click để chọn ngay</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Google Drive / Computer Upload Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>🌐</span> NẠP ẢNH KHUNG CARD TỪ GOOGLE DRIVE HOẶC MÁY TÍNH
              </h4>

              {/* Google Drive Link Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-slate-700">Dán Link Google Drive:</label>
                  {driveFileId && (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      🟢 Drive OK
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDriveInput}
                    onChange={(e) => setCustomDriveInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    className="flex-1 px-3.5 py-2.5 text-xs font-bold rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                  <button
                    onClick={handleApplyDriveFrameImage}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>

              {/* Upload File from Computer */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-black text-slate-700">Hoặc Tải Tệp Ảnh từ Máy Tính:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFrameImageFromComputer}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-xs file:font-black file:bg-sky-100 file:text-sky-800 hover:file:bg-sky-200 cursor-pointer"
                />
              </div>

              {frameConfig.customImageUrl && (
                <div className="pt-2 flex items-center justify-between bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-900">✨ Đang dùng Ảnh Khung Tùy Chỉnh!</span>
                  <button
                    onClick={() => setFrameConfig(prev => ({ ...prev, customImageUrl: undefined }))}
                    className="text-xs font-black text-rose-600 hover:underline cursor-pointer"
                  >
                    Gỡ bỏ ảnh tùy chỉnh
                  </button>
                </div>
              )}
            </div>

            {/* Sizing & Alignment tuning */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>📐</span> ĐỒNG BỘ KÍCH THƯỚC CARD & SƠ ĐỒ LỚP HỌC
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-600 mb-1.5">Kích thước Ô Máy Tính:</label>
                  <select
                    value={frameConfig.cardSize}
                    onChange={(e) => setFrameConfig(prev => ({ ...prev, cardSize: e.target.value as any }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-black text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="sm">Nhỏ (Gọn gàng)</option>
                    <option value="md">Vừa (Chuẩn đẹp)</option>
                    <option value="lg">Lớn (Nổi bật)</option>
                    <option value="xl">Rất Lớn (Trình chiếu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1.5">Hiệu Ứng Phát Sáng:</label>
                  <button
                    onClick={() => setFrameConfig(prev => ({ ...prev, glowEffect: !prev.glowEffect }))}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs border transition-all cursor-pointer ${
                      frameConfig.glowEffect 
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {frameConfig.glowEffect ? '✨ Bật Phát Sáng' : 'Tắt Phát Sáng'}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Live Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#fffbf0] rounded-3xl p-6 border border-[#cbb89d] text-slate-900 space-y-4 shadow-md sticky top-4">
              <h4 className="font-black text-xs text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
                <span>👁️</span> XEM TRƯỚC HIỂN THỊ KHUNG CARD PC
              </h4>

              {/* Sample Card Render */}
              <div 
                className={`rounded-2xl border-2 transition-all relative overflow-hidden ${cardSizeClasses[frameConfig.cardSize]} ${
                  frameConfig.customImageUrl 
                    ? 'border-indigo-400/80 bg-slate-950/90' 
                    : `${activeSkin.bgGradient} ${activeSkin.borderColor} ${frameConfig.glowEffect ? activeSkin.glowShadow : ''}`
                }`}
                style={frameConfig.customImageUrl ? {
                  backgroundImage: `url(${frameConfig.customImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              >
                {/* Header PC info - Green Badge when assigned */}
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono font-black text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg border border-emerald-400 shadow-2xs">
                    🖥️ M.01
                  </span>
                  <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full border border-emerald-400">
                    2/2 HS
                  </span>
                </div>

                {/* Sample Student Pills - High Contrast Neon Emerald Pill with Centered Name */}
                <div className="space-y-1.5 text-center">
                  <div className="bg-emerald-400 border-2 border-emerald-300 text-slate-950 rounded-xl px-3 py-1.5 flex items-center justify-center relative shadow-md">
                    <span className="font-black text-xs text-center mx-auto">Văn An</span>
                    <span className="absolute right-2 text-[10px] opacity-70">×</span>
                  </div>
                  <div className="bg-emerald-400 border-2 border-emerald-300 text-slate-950 rounded-xl px-3 py-1.5 flex items-center justify-center relative shadow-md">
                    <span className="font-black text-xs text-center mx-auto">Thị Bích</span>
                    <span className="absolute right-2 text-[10px] opacity-70">×</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-600 text-center leading-relaxed">
                Tất cả ô máy tính trên sơ đồ sẽ tự động áp dụng kiểu khung card đã chọn ở trên!
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // 🖥️ MAIN VIEW: SƠ ĐỒ LỚP HỌC & CHỖ NGỒI MÁY TÍNH (MAIN ROOM CANVAS)
  // =========================================================================
  return (
    <div className="space-y-5 pb-12 text-slate-800">
      
      {/* CSS @media print style for clean A4 printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-room-map, #printable-room-map * {
            visibility: visible;
          }
          #printable-room-map {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 10px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 🌟 1. BANNER HEADER MÀU SẮC ĐỒNG BỘ KHU VƯỜN TRI THỨC (IMAC WARM BEIGE & EMERALD GOLD) */}
      <div className="relative rounded-2xl border border-[#cbb89d] bg-[#fffbf0] py-3.5 px-5 text-slate-900 shadow-sm overflow-hidden no-print">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          
          {/* Left Single Instruction Line */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl select-none">🖥️</span>
            <p className="text-xs sm:text-sm font-black text-[#3d2b17]">
              👉 Kéo thả tên học sinh vào máy tính để xếp chỗ (ghép tối đa 2 HS/máy).
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Button 1: Đổi khung Card PC */}
            <button
              onClick={() => setIsFrameConfigSubViewOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#3d2b17] hover:bg-[#281c0f] text-amber-200 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-[#5c4327] cursor-pointer"
            >
              <span>🎨</span> Đổi Khung Card PC
            </button>

            {/* Button 2: Xếp Tự Động */}
            <button
              onClick={handleAutoSeatClass}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🪄</span> Xếp Tự Động (Ưu tiên Có Mặt)
            </button>

          </div>

        </div>
      </div>

      {/* 🎛️ 2. CONTROL FILTER BAR & ATTENDANCE SUMMARY & QUICK FINDER */}
      <div className="bg-[#fffbf0] rounded-2xl p-3.5 sm:p-4 border border-[#cbb89d] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        
        {/* Selectors, Attendance Summary & Quick Student Finder Input */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          
          {/* Lab Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black text-[#5c4327] uppercase tracking-wider shrink-0">CHỌN PHÒNG MÁY:</label>
            <select
              value={selectedLabId}
              onChange={(e) => setSelectedLabId(e.target.value)}
              className="px-3.5 py-1.5 text-xs font-black rounded-xl border border-[#cbb89d] bg-white text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs cursor-pointer min-w-[160px]"
            >
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} ({lab.code})
                </option>
              ))}
            </select>
          </div>

          {/* 📋 ATTENDANCE INTEGRATION SUMMARY BADGE (ĐỒNG BỘ ĐIỂM DANH HÔM NAY) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#cbb89d] text-xs font-black text-[#3d2b17] shadow-2xs">
            <span>📋 Điểm danh:</span>
            <span className="text-emerald-700">🟢 {attendanceSummary.present} Có mặt</span>
            {attendanceSummary.absentTotal > 0 ? (
              <span className="text-rose-700 font-black flex items-center gap-0.5">
                | 🔴 {attendanceSummary.absentTotal} Vắng
                {attendanceSummary.excused > 0 && <span className="text-amber-700"> ({attendanceSummary.excused}P)</span>}
                {attendanceSummary.unexcused > 0 && <span className="text-rose-700"> ({attendanceSummary.unexcused}K)</span>}
              </span>
            ) : (
              <span className="text-slate-400">| Đủ 100%</span>
            )}
          </div>

          {/* 🔍 QUICK STUDENT FINDER SEARCH INPUT */}
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-700" />
            <input
              type="text"
              value={searchStudentSeat}
              onChange={(e) => setSearchStudentSeat(e.target.value)}
              placeholder="🔍 Tìm vị trí chỗ ngồi HS..."
              className="w-full pl-9 pr-7 py-1.5 text-xs font-black rounded-xl border border-amber-300 bg-amber-50/80 text-amber-950 focus:outline-none focus:border-amber-500 shadow-2xs placeholder:text-amber-700/60"
            />
            {searchStudentSeat && (
              <button
                onClick={() => setSearchStudentSeat('')}
                className="absolute right-2 top-2 text-amber-700 hover:text-amber-950 text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Result Counter Indicator */}
          {searchStudentSeat && (
            <span className="text-[11px] font-black text-amber-900 bg-amber-200/90 px-2.5 py-1 rounded-lg border border-amber-400 animate-pulse">
              ✨ {matchingPcIdsForSearch.size} ô máy khớp!
            </span>
          )}

          {/* Toggle Filter to Highlight Absent Students Only */}
          {attendanceSummary.absentTotal > 0 && (
            <button
              onClick={() => setShowAbsentOnlyFilter(!showAbsentOnlyFilter)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all border flex items-center gap-1.5 cursor-pointer ${
                showAbsentOnlyFilter
                  ? 'bg-rose-600 text-white border-rose-500 shadow-xs animate-pulse'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              {showAbsentOnlyFilter ? 'Showing Absent' : `🔴 Lọc ${attendanceSummary.absentTotal} HS Vắng`}
            </button>
          )}

          {/* Toggle Button to Hide/Show Unassigned Left Panel */}
          <button
            onClick={() => setIsUnassignedPanelVisible(!isUnassignedPanelVisible)}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all border flex items-center gap-1.5 cursor-pointer ${
              isUnassignedPanelVisible
                ? 'bg-amber-100/70 text-amber-900 border-amber-300 hover:bg-amber-200/80'
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-xs'
            }`}
          >
            {isUnassignedPanelVisible ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5" /> Ẩn Bảng CHỜ
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5" /> ▶ Hiện Bảng CHỜ ({unassignedStudents.length} HS)
              </>
            )}
          </button>

        </div>

        {/* Right Info & Clear Seating Button */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-[#cbb89d]">
          
          <div className="text-xs font-bold">
            <span className="text-slate-600">Chờ xếp chỗ: </span>
            <span className="font-black text-amber-700">{unassignedStudents.length} HS</span>
          </div>

          <button
            onClick={handleClearAllClassSeating}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span>↺</span> Xóa Chỗ Ngồi
          </button>

        </div>

      </div>

      {/* 🖼️ 3. MAIN ROOM CANVAS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ================= LEFT COLUMN: HỌC SINH CHỜ NGỒI ================= */}
        {isUnassignedPanelVisible && (
          <div className="lg:col-span-4 bg-[#fffbf0] rounded-2xl p-4 border border-[#cbb89d] shadow-sm space-y-3 flex flex-col max-h-[720px] overflow-hidden no-print">
            
            <div className="space-y-0.5 border-b border-[#cbb89d] pb-2.5">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xs text-[#3d2b17] flex items-center gap-1.5">
                  <span>👦</span> HỌC SINH CHỜ NGỒI ({unassignedStudents.length})
                </h3>
                <button
                  onClick={() => setIsUnassignedPanelVisible(false)}
                  className="text-[10px] font-black text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Ẩn bảng chờ để mở rộng sơ đồ"
                >
                  ◀ Ẩn
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-500 leading-snug">
                Kéo tên học sinh vào ô máy tính bên phải để xếp chỗ.
              </p>
            </div>

            {/* Search Unassigned Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={unassignedSearch}
                onChange={(e) => setUnassignedSearch(e.target.value)}
                placeholder="Tìm kiếm học sinh..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-xl border border-[#cbb89d] bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Scrollable Students List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[540px]">
              {filteredUnassignedStudents.length > 0 ? (
                filteredUnassignedStudents.map(st => {
                  const att = getStudentAttendance(st.id);
                  const isAbsent = att === 'excused' || att === 'unexcused';

                  return (
                    <div
                      key={st.id}
                      draggable={true}
                      onDragStart={(e) => handleStudentDragStart(e, st.id)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-grab active:cursor-grabbing group shadow-2xs ${
                        isAbsent 
                          ? 'bg-rose-50 border-rose-300 hover:bg-rose-100/80' 
                          : 'bg-white hover:bg-emerald-50 border-[#cbb89d] hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg select-none">
                          {st.gender === 'Nữ' ? '👧' : '👦'}
                        </span>
                        <div>
                          <div className="font-black text-xs text-slate-900 group-hover:text-emerald-950 flex items-center gap-1.5">
                            <span>{st.name}</span>
                            {att === 'unexcused' && (
                              <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded border border-rose-500">
                                🚫 VẮNG (K)
                              </span>
                            )}
                            {att === 'excused' && (
                              <span className="text-[9px] font-black bg-amber-600 text-white px-1.5 py-0.5 rounded border border-amber-500">
                                📝 VẮNG (P)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">
                            MSHS: {st.code} • Tên ngắn: <span className="text-emerald-700 font-extrabold">{formatStudentNameFirstAndMiddle(st.name)}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                        isAbsent 
                          ? 'bg-rose-200 text-rose-900 border-rose-300' 
                          : 'bg-amber-100 text-amber-900 border-amber-200 group-hover:bg-emerald-200 group-hover:text-emerald-900'
                      }`}>
                        Kéo chỗ 🖐️
                      </span>
                    </div>
                  );
                })
              ) : unassignedStudents.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                    ✓
                  </div>
                  <div className="font-black text-xs text-emerald-800">Tất cả học sinh đã có máy!</div>
                  <p className="text-[10px] font-bold text-slate-400 max-w-[180px] mx-auto">
                    Toàn bộ học sinh lớp {selectedClass} đã được xếp vị trí chỗ ngồi.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 font-bold text-xs">
                  Không tìm thấy học sinh nào khớp từ khóa
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= RIGHT COLUMN: SƠ ĐỒ PHÒNG MÁY TÍNH (NỀN SÁNG VÀNG KEM iMAC) ================= */}
        <div 
          id="printable-room-map"
          className={`${isUnassignedPanelVisible ? 'lg:col-span-8' : 'lg:col-span-12'} bg-[#fbf7ee] rounded-2xl p-4 sm:p-5 border border-[#cbb89d] shadow-sm space-y-4 transition-all duration-300`}
        >
          
          {/* Top Canvas Toolbar with Teacher Screen Board & Zoom / Print Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#dfccb0] p-2.5 rounded-xl border border-[#cbb89d]">
            
            {/* Màn chiếu bảng giáo viên */}
            <span className="text-xs font-black text-[#3d2b17] uppercase tracking-widest flex items-center gap-2 mx-auto sm:mx-0">
              👨‍🏫 MÀN CHIẾU & BẢNG GIÁO VIÊN ({activeLab.name} - {activeLab.code})
            </span>

            {/* Right Zoom & Print Controls */}
            <div className="flex items-center gap-2 no-print">
              
              {/* Zoom Out */}
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 70}
                className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-800 border border-[#cbb89d] text-xs font-black shadow-2xs disabled:opacity-40 cursor-pointer"
                title="Thu nhỏ sơ đồ (-10%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-black text-[#3d2b17] min-w-[42px] text-center select-none">
                {zoomLevel}%
              </span>

              {/* Zoom In */}
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 140}
                className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-800 border border-[#cbb89d] text-xs font-black shadow-2xs disabled:opacity-40 cursor-pointer"
                title="Phóng to sơ đồ (+10%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {/* Reset Zoom */}
              {zoomLevel !== 100 && (
                <button
                  onClick={handleZoomReset}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-amber-50 text-[10px] font-black text-slate-700 border border-[#cbb89d] cursor-pointer"
                >
                  ↺ 100%
                </button>
              )}

              {/* 🖨️ Print Button */}
              <button
                onClick={handlePrintSeatingMap}
                className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-100 font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 border border-amber-950 cursor-pointer ml-1"
                title="In sơ đồ chỗ ngồi ra PDF hoặc giấy A4"
              >
                <Printer className="w-3.5 h-3.5" /> In Sơ Đồ
              </button>

            </div>

          </div>

          {/* Room Matrix Grid matching activeLab gridRows x gridCols with Dynamic Zoom Scaling */}
          <div 
            className="transition-transform duration-200 origin-top"
            style={{
              zoom: `${zoomLevel}%`
            }}
          >
            <div 
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${activeLabGrid.cols}, minmax(0, 1fr))`
              }}
            >
              {activeLabGrid.cells.map(tile => {
                // AISLE TILE (Lối đi)
                if (tile.type === 'aisle') {
                  return (
                    <div 
                      key={`aisle_${tile.row}_${tile.col}`}
                      className="bg-amber-100/40 border border-amber-200/50 rounded-xl p-2 flex items-center justify-center min-h-[90px] select-none"
                    >
                      <span className="text-[10px] font-black text-amber-800/40 uppercase tracking-wider">Lối đi</span>
                    </div>
                  );
                }

                // PC TILE (Máy tính)
                const pcId = tile.label;
                const pcNum = tile.pcNum;
                const assignedIds = getAssignedStudentIds(currentClassSeating[pcId]);
                const assignedStudents = assignedIds.map(id => students.find(s => s.id === id)).filter(Boolean) as Student[];

                const isFull = assignedStudents.length >= 2;
                const hasOne = assignedStudents.length === 1;
                const isDragOver = dragOverPcId === pcId;
                const isSearchMatch = matchingPcIdsForSearch.has(pcId);

                // Check if any student seated at this PC is marked ABSENT (ĐIỂM DANH VẮNG MẶT)
                const hasAbsentStudent = assignedStudents.some(s => {
                  const att = getStudentAttendance(s.id);
                  return att === 'excused' || att === 'unexcused';
                });

                // ⚠️ INCIDENT REPORT CHECK (Incident Glow Indicator)
                const targetIncident = incidents.find(inc => 
                  inc.labId === selectedLabId && 
                  (inc.pcNumber === pcNum || pcId.includes(String(inc.pcNumber))) && 
                  inc.status !== 'Resolved'
                );

                // Dynamic Border Style for PC Card
                let borderStyleClass = 'border-[#cbb89d] bg-[#fffbf0]';
                if (targetIncident) {
                  borderStyleClass = 'border-rose-500 bg-rose-100/90 ring-4 ring-rose-400 animate-pulse text-rose-950 z-20';
                } else if (showAbsentOnlyFilter && hasAbsentStudent) {
                  borderStyleClass = 'border-rose-500 bg-rose-50 ring-4 ring-rose-500 animate-bounce text-rose-950 z-30 shadow-[0_0_25px_rgba(244,63,94,0.8)]';
                } else if (isSearchMatch) {
                  borderStyleClass = 'border-amber-400 bg-amber-100/90 ring-4 ring-amber-400 animate-pulse scale-105 shadow-[0_0_25px_rgba(245,158,11,0.8)] z-30';
                } else if (isFull) {
                  borderStyleClass = 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
                } else if (hasOne) {
                  borderStyleClass = 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
                }

                return (
                  <div
                    key={`pc_${pcId}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverPcId(pcId);
                    }}
                    onDragLeave={() => setDragOverPcId(null)}
                    onDrop={(e) => handlePcDrop(e, pcId)}
                    className={`rounded-xl border-2 transition-all relative flex flex-col justify-between ${cardSizeClasses[frameConfig.cardSize]} ${
                      isDragOver ? 'border-amber-500 scale-105 bg-amber-100 ring-4 ring-amber-400/50 z-20' : ''
                    } ${
                      frameConfig.customImageUrl 
                        ? 'border-indigo-400/80 bg-slate-950/90' 
                        : `${borderStyleClass} ${frameConfig.glowEffect && !targetIncident && !isSearchMatch ? activeSkin.glowShadow : ''}`
                    }`}
                    style={frameConfig.customImageUrl ? {
                      backgroundImage: `url(${frameConfig.customImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : undefined}
                  >
                    {/* PC Header Bar - Green Badge 'M.' background when assigned */}
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border shadow-2xs ${
                        assignedStudents.length > 0
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-[#dfccb0] text-[#3d2b17] border-[#cbb89d]'
                      }`}>
                        🖥️ {pcId}
                      </span>

                      {/* Incident Warning Badge, Absent Alert or Student Count */}
                      {targetIncident ? (
                        <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full border border-rose-400 animate-bounce" title={targetIncident.issue}>
                          ⚠️ HỎNG
                        </span>
                      ) : hasAbsentStudent ? (
                        <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full border border-rose-400 animate-pulse" title="Có học sinh báo vắng mặt hôm nay">
                          🔴 CÓ VẮNG
                        </span>
                      ) : (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border shadow-2xs ${
                          isFull 
                            ? 'bg-emerald-500 text-white border-emerald-400' 
                            : assignedStudents.length > 0 
                              ? 'bg-amber-500 text-white border-amber-400' 
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}>
                          {assignedStudents.length}/2 HS
                        </span>
                      )}
                    </div>

                    {/* Incident Issue Banner Warning if Broken */}
                    {targetIncident && (
                      <div className="text-[9px] font-black text-rose-900 bg-rose-200 px-1 py-0.5 rounded text-center truncate mb-1 border border-rose-300">
                        {targetIncident.type}: {targetIncident.issue}
                      </div>
                    )}

                    {/* Student Seating Slot Content - High Contrast Neon Emerald Pill with Attendance Status */}
                    {assignedStudents.length > 0 ? (
                      <div className="space-y-1 my-auto w-full text-center">
                        {assignedStudents.map(st => {
                          const att = getStudentAttendance(st.id);
                          const isUnexcused = att === 'unexcused';
                          const isExcused = att === 'excused';
                          const isAbsent = isUnexcused || isExcused;

                          return (
                            <div
                              key={st.id}
                              draggable={true}
                              onDragStart={(e) => handleStudentDragStart(e, st.id, pcId)}
                              className={`border-2 rounded-lg px-2 py-1 flex items-center justify-center relative transition-all cursor-grab active:cursor-grabbing group shadow-md text-center ${
                                isUnexcused 
                                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                                  : isExcused 
                                    ? 'bg-amber-600 text-white border-amber-400' 
                                    : 'bg-emerald-400 hover:bg-emerald-300 border-emerald-300 text-slate-950'
                              }`}
                            >
                              <span className="font-black text-xs text-center truncate max-w-[100px] mx-auto drop-shadow-2xs flex items-center justify-center gap-1" title={st.name}>
                                {isUnexcused && <span className="text-[9px] font-black bg-slate-950/70 px-1 rounded text-rose-200">🚫 K</span>}
                                {isExcused && <span className="text-[9px] font-black bg-slate-950/70 px-1 rounded text-amber-200">📝 P</span>}
                                <span className={isAbsent ? 'line-through opacity-90' : ''}>{formatStudentNameFirstAndMiddle(st.name)}</span>
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unassignStudentFromComputer(pcId, st.id);
                                }}
                                className="absolute right-1 text-current hover:text-rose-700 p-0.5 rounded-full hover:bg-white/60 transition-colors cursor-pointer"
                                title="Xóa học sinh khỏi máy"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Display formatted concatenated string e.g. "Văn An + Thị Bích" when 2 students seated */}
                        {assignedStudents.length === 2 && (
                          <div className="text-[10px] font-black text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400 text-center justify-center tracking-tight truncate mx-auto w-full shadow-xs">
                            {formatStudentNameFirstAndMiddle(assignedStudents[0].name)} + {formatStudentNameFirstAndMiddle(assignedStudents[1].name)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="my-auto py-1.5 text-center justify-center flex items-center text-amber-900/60 font-bold text-[10px] border border-dashed border-amber-300/80 rounded-lg bg-amber-50/50">
                        Kéo HS vào đây
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
