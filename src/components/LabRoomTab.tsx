import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Student, Computer, SeatingChart, LabInfo, ClassItem, LabIncident, AttendanceData } from '../types';
import { 
  Monitor, X, Wrench, AlertTriangle, PenTool, Clipboard, Search, Check, ChevronDown, 
  Maximize, Minimize, Tv, ZoomIn, ZoomOut, Sun, Moon, ArrowLeft, Palette, Sparkles, 
  RotateCcw, Users, Plus, LayoutGrid, CheckCircle2, UserCheck, ShieldCheck, Image as ImageIcon,
  Sliders, Move, ArrowRightLeft, Upload, Link, CheckCheck, RefreshCw, Zap, Eye, EyeOff, 
  PanelLeftClose, PanelLeftOpen, Printer, UserX, AlertCircle, MousePointerClick, Star, Award, Crown,
  ListFilter, UserPlus, Layers, Settings, FileSpreadsheet, Armchair, Trash2, User, FileText
} from 'lucide-react';
import { StudentAvatar3D, formatStudentNameFirstAndMiddle } from './StudentAvatar3D';
import { formatComputerName } from '../utils/nameFormatter';
import { exportSeatingChartToWord } from '../utils/wordExportHelper';
import { extractGoogleDriveFileId, convertGoogleDriveUrl } from '../utils/googleDriveImageHelper';
import { compressImageFile } from './KnowledgeGardenTab';
import { playButtonClickSound, playVictoryFanfareSound } from '../utils/audioEffects';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState } from '../supabaseClient';

// Helper to generate default lab matrix layout (Rows x Cols) with labels Máy 01, Máy 02...
export const generateDefaultLabLayout = (rows: number = 5, cols: number = 8) => {
  const layout: Record<string, { type: 'pc' | 'aisle' | 'desk'; label?: string; pcNumber?: number }> = {};
  let pcCounter = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}_${c}`;
      layout[key] = { 
        type: 'pc', 
        pcNumber: pcCounter, 
        label: formatComputerName(pcCounter)
      };
      pcCounter++;
    }
  }
  return layout;
};

// Preset Frame Skin Options for PC Card
export interface FrameSkin {
  id: string;
  name: string;
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
    id: 'imac-classic',
    name: 'iMac Classic Cream (Mặc Định)',
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
  badgeRightMargin?: number;
}

interface LabRoomTabProps {
  selectedClass: string;
  computers: Computer[];
  setComputers?: React.Dispatch<React.SetStateAction<Computer[]>>;
  students: Student[];
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  seatingChart: SeatingChart;
  setSeatingChart: React.Dispatch<React.SetStateAction<SeatingChart>>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  labs?: LabInfo[];
  classes?: ClassItem[];
  onSelectClass?: (className: string) => void;
  attendanceData?: AttendanceData;
  selectedDate?: string;
}

export default function LabRoomTab({
  selectedClass,
  students,
  seatingChart,
  setSeatingChart,
  showToast,
  labs = [
    { id: 'lab1', name: 'Phòng Lab 01', code: 'P.201', totalPCs: 36, status: 'Active', location: 'Tầng 2 - Nhà A', gridRows: 5, gridCols: 8 },
    { id: 'lab2', name: 'Phòng Lab 02', code: 'P.202', totalPCs: 40, status: 'Active', location: 'Tầng 2 - Nhà A', gridRows: 5, gridCols: 8 },
    { id: 'lab3', name: 'Phòng Lab 03', code: 'P.301', totalPCs: 32, status: 'Maintenance', location: 'Tầng 3 - Nhà B', gridRows: 4, gridCols: 8 }
  ],
  classes = [],
  onSelectClass,
  attendanceData,
  selectedDate = new Date().toISOString().split('T')[0]
}: LabRoomTabProps) {

  // Selected Lab State (default to Lab 01 P.201)
  const [selectedLabId, setSelectedLabId] = useState<string>(labs[0]?.id || 'lab1');
  const activeLab = useMemo(() => {
    return labs.find(l => l.id === selectedLabId || l.code === selectedLabId || l.name === selectedLabId) || labs[0];
  }, [labs, selectedLabId]);

  // Realtime Sync Attendance Data State
  const [localAttendance] = useState<AttendanceData>(() => {
    if (attendanceData && Object.keys(attendanceData).length > 0) return attendanceData;
    try {
      const saved = localStorage.getItem('school_attendance_data');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentClassAttendanceMap = useMemo(() => {
    return localAttendance?.[selectedDate]?.[selectedClass] || {};
  }, [localAttendance, selectedDate, selectedClass]);

  const getStudentAttendance = useCallback((studentId: string): 'present' | 'excused' | 'unexcused' => {
    if (currentClassAttendanceMap[studentId]) {
      return currentClassAttendanceMap[studentId];
    }
    return 'present';
  }, [currentClassAttendanceMap]);

  // 🔔 Real-time Incidents Sync from LocalStorage / Windows events
  const [incidents, setIncidents] = useState<LabIncident[]>(() => {
    try {
      const saved = localStorage.getItem('school_lab_incidents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleSyncIncidents = () => {
      try {
        const saved = localStorage.getItem('school_lab_incidents');
        if (saved) setIncidents(JSON.parse(saved));
      } catch (e) {}
    };

    window.addEventListener('storage', handleSyncIncidents);
    window.addEventListener('school_incidents_updated', handleSyncIncidents);
    return () => {
      window.removeEventListener('storage', handleSyncIncidents);
      window.removeEventListener('school_incidents_updated', handleSyncIncidents);
    };
  }, []);

  // --- CLASS MONITOR ROLE STATE (L. TRƯỞNG / LỚP PHÓ / TỔ TRƯỞNG) ---
  const [studentDuties, setStudentDuties] = useState<{ [studentId: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('school_student_duties_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveStudentDuty = useCallback((studentId: string, dutyRole: string | null) => {
    const updated = { ...studentDuties };
    if (dutyRole) {
      updated[studentId] = dutyRole;
    } else {
      delete updated[studentId];
    }
    setStudentDuties(updated);
    try {
      localStorage.setItem('school_student_duties_v1', JSON.stringify(updated));
      saveSupabaseState('school_student_duties', updated);
    } catch (e) {}
  }, [studentDuties]);

  const getStudentMonitorRole = useCallback((st: Student): 'L. Trưởng' | 'Lớp phó' | 'Tổ trưởng' | null => {
    if (!st) return null;
    if (studentDuties[st.id]) {
      const role = studentDuties[st.id];
      if (role === 'Lớp trưởng' || role === 'L. Trưởng') return 'L. Trưởng';
      return role as any;
    }
    if (st.duty) {
      if (st.duty === 'Lớp trưởng' || st.duty === 'L. Trưởng') return 'L. Trưởng';
      return st.duty as any;
    }

    const str = `${st.notes || ''} ${st.name}`.toLowerCase();
    if (str.includes('l. trưởng') || str.includes('lớp trưởng') || str.includes('(lt)')) return 'L. Trưởng';
    if (str.includes('lớp phó') || str.includes('(lp)')) return 'Lớp phó';
    if (str.includes('tổ trưởng') || str.includes('(tt)')) return 'Tổ trưởng';
    return null;
  }, [studentDuties]);

  // --- GENDER COLOR CUSTOMIZATION STATE (NAM XANH / NỮ HỒNG TOGGLE) ---
  const [showGenderColors, setShowGenderColors] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('school_show_gender_colors_v1');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleGenderColors = () => {
    setShowGenderColors(prev => {
      const nextVal = !prev;
      try {
        localStorage.setItem('school_show_gender_colors_v1', JSON.stringify(nextVal));
      } catch (e) {}
      showToast(nextVal ? 'Đã BẬT dải màu Nam (Xanh biển) / Nữ (Hồng nhạt)!' : 'Đã TẮT màu Nam/Nữ, quay về màu Emerald mặc định!', 'info');
      return nextVal;
    });
  };

  // State to toggle hiding empty aisle columns for 1-page A4 print optimization
  const [hideAislesPrint, setHideAislesPrint] = useState<boolean>(true);

  // Fast HashMap lookup for students by ID
  const studentsByIdMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  // --- LAB ROOM MATRIX GENERATION ---
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
          const pcLabel = formatComputerName(tile.label || tile.pcLabel || num);
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

  // Columns containing at least 1 PC (for 1-page A4 aisle hiding compaction)
  const pcColumnIndices = useMemo(() => {
    const colsWithPc = new Set<number>();
    activeLabGrid.cells.forEach(c => {
      if (c.type === 'pc') colsWithPc.add(c.col);
    });
    return colsWithPc;
  }, [activeLabGrid.cells]);

  // Printable cells & column count based on hideAislesPrint
  const printableGridData = useMemo(() => {
    if (!hideAislesPrint || pcColumnIndices.size === 0) {
      return {
        cols: activeLabGrid.cols,
        cells: activeLabGrid.cells
      };
    }

    const sortedColIndices: number[] = Array.from(pcColumnIndices).map(n => Number(n)).sort((a, b) => a - b);
    const colRemap = new Map<number, number>();
    sortedColIndices.forEach((oldColIndex: number, newIndex: number) => {
      colRemap.set(oldColIndex, newIndex);
    });

    const filteredCells = activeLabGrid.cells
      .filter(cell => pcColumnIndices.has(cell.col))
      .map(cell => ({
        ...cell,
        col: colRemap.get(cell.col) ?? cell.col
      }));

    return {
      cols: sortedColIndices.length,
      cells: filteredCells
    };
  }, [hideAislesPrint, pcColumnIndices, activeLabGrid]);

  // Students of current selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClass);
  }, [students, selectedClass]);

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

  const getAssignedStudentIds = useCallback((seatingVal?: string): string[] => {
    if (!seatingVal) return [];
    return seatingVal.split(/[,+;]/).map(s => s.trim()).filter(Boolean);
  }, []);

  // --- MEMOIZED CELL DATA MAP FOR MAXIMUM PERFORMANCE & ACCURATE INCIDENT MATCHING ---
  const computedCellDataMap = useMemo(() => {
    const map: Record<string, {
      assignedStudents: Student[];
      hasAbsentStudent: boolean;
      monitorRole: 'L. Trưởng' | 'Lớp phó' | 'Tổ trưởng' | null;
      targetIncident: LabIncident | null;
      isFull: boolean;
      hasOne: boolean;
    }> = {};

    activeLabGrid.pcList.forEach(pc => {
      const pcId = pc.id;
      const pcNum = pc.pcNum;
      const assignedIds = getAssignedStudentIds(currentClassSeating[pcId]);
      const assignedSts = assignedIds.map(id => studentsByIdMap.get(id)).filter(Boolean) as Student[];

      let hasAbsent = false;
      let monitorRole: 'L. Trưởng' | 'Lớp phó' | 'Tổ trưởng' | null = null;

      assignedSts.forEach(s => {
        const att = getStudentAttendance(s.id);
        if (att === 'excused' || att === 'unexcused') hasAbsent = true;
        const role = getStudentMonitorRole(s);
        if (role && !monitorRole) monitorRole = role;
      });

      // 🔍 ACCURATE INCIDENT MATCHING ACROSS LAB IDS & PC NUMBER/ID FORMATS
      const targetInc = incidents.find(inc => {
        if (inc.status === 'Resolved') return false;

        // 1. Lab ID matching (direct ID match OR active lab match)
        const labMatches = 
          !inc.labId || 
          inc.labId === selectedLabId || 
          inc.labId === activeLab.id || 
          inc.labId === activeLab.code ||
          inc.labId === activeLab.name ||
          labs.findIndex(l => l.id === inc.labId) === labs.findIndex(l => l.id === selectedLabId);

        if (!labMatches) return false;

        // 2. Computer ID (pcId) & Exact Numeric pcNumber matching ONLY (NO SUBSTRING INCLUDES)
        const incFormattedId = formatComputerName(inc.pcId || inc.pcNumber);
        const cellFormattedId = formatComputerName(pcId);
        
        if (incFormattedId === cellFormattedId) return true;

        const incNum = typeof inc.pcNumber === 'number' 
          ? inc.pcNumber 
          : parseInt(String(inc.pcNumber || '').replace(/\D/g, ''), 10);

        if (!isNaN(incNum) && incNum > 0 && incNum === pcNum) return true;

        return false;
      }) || null;

      map[pcId] = {
        assignedStudents: assignedSts,
        hasAbsentStudent: hasAbsent,
        monitorRole,
        targetIncident: targetInc,
        isFull: assignedSts.length >= 2,
        hasOne: assignedSts.length === 1
      };
    });

    return map;
  }, [activeLabGrid.pcList, currentClassSeating, getAssignedStudentIds, studentsByIdMap, getStudentAttendance, getStudentMonitorRole, incidents, selectedLabId, activeLab, labs]);

  const assignedStudentIdsList = useMemo(() => {
    const assigned = new Set<string>();
    Object.values(currentClassSeating).forEach((val: any) => {
      getAssignedStudentIds(String(val || '')).forEach(id => assigned.add(id));
    });
    return Array.from(assigned);
  }, [currentClassSeating, getAssignedStudentIds]);

  const unassignedStudents = useMemo(() => {
    return classStudents.filter(s => !assignedStudentIdsList.includes(s.id));
  }, [classStudents, assignedStudentIdsList]);

  // Toggle Left Unassigned Panel (Inside Seating Sub-View)
  const [isUnassignedPanelVisible, setIsUnassignedPanelVisible] = useState<boolean>(true);

  // 1-Click Quick Assign Selection
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<string | null>(null);

  // Search input for unassigned panel
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

  // Quick Student Finder Search State
  const [searchStudentSeat, setSearchStudentSeat] = useState<string>('');
  const [showAbsentOnlyFilter, setShowAbsentOnlyFilter] = useState<boolean>(false);

  const matchingPcIdsForSearch = useMemo(() => {
    if (!searchStudentSeat.trim()) return new Set<string>();
    const q = searchStudentSeat.toLowerCase().trim();
    const matchedPcs = new Set<string>();

    Object.entries(currentClassSeating).forEach(([pcId, valStr]) => {
      const studentIds = getAssignedStudentIds(String(valStr || ''));
      const hasMatch = studentIds.some(id => {
        const st = studentsByIdMap.get(id);
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
  }, [searchStudentSeat, currentClassSeating, studentsByIdMap, getAssignedStudentIds]);

  // Zoom Level Control State (70% to 140%)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(140, prev + 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(70, prev - 10));
  const handleZoomReset = () => setZoomLevel(100);

  // PC Frame Config State
  const [frameConfig, setFrameConfig] = useState<PCFrameConfig>(() => {
    try {
      const saved = localStorage.getItem('deskos_pc_frame_config_v1');
      return saved ? JSON.parse(saved) : {
        skinId: 'imac-classic',
        cardSize: 'md',
        borderRadius: 'rounded-2xl',
        glowEffect: true,
        badgeRightMargin: 0
      };
    } catch {
      return {
        skinId: 'imac-classic',
        cardSize: 'md',
        borderRadius: 'rounded-2xl',
        glowEffect: true,
        badgeRightMargin: 0
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

  // --- 🚀 INLINE SUB-VIEW STATES ---
  const [isSeatingViewOpen, setIsSeatingViewOpen] = useState(false);
  const [isFrameConfigSubViewOpen, setIsFrameConfigSubViewOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Drag & Drop States & Performance Refs for Instant 60FPS Reactivity
  const [draggedStudentIdState, setDraggedStudentIdState] = useState<string | null>(null);
  const [draggedSourcePcIdState, setDraggedSourcePcIdState] = useState<string | null>(null);
  const [dragOverPcId, setDragOverPcId] = useState<string | null>(null);
  const dragOverPcIdRef = useRef<string | null>(null);

  const seatingChartRef = useRef(seatingChart);
  useEffect(() => {
    seatingChartRef.current = seatingChart;
  }, [seatingChart]);

  const supabaseDebounceTimerRef = useRef<any>(null);

  // 🖨️ Document.body Portal Container for 100% Perfect A4 Printing (Zero Blank Pages)
  const [printPortalContainer, setPrintPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById('lab-print-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lab-print-portal';
      document.body.appendChild(el);
    }
    setPrintPortalContainer(el);
  }, []);

  const cardSizeClasses = {
    sm: 'p-2 min-h-[90px]',
    md: 'p-3 min-h-[110px]',
    lg: 'p-3.5 min-h-[130px]',
    xl: 'p-4.5 min-h-[150px]'
  };

  // --- ⚡ INSTANT 60FPS ZERO-LAG SEATING MUTATION SAVE HANDLER ---
  const saveSeatingState = useCallback((newClassSeating: { [pcId: string]: string }) => {
    const updatedChart: SeatingChart = {
      ...seatingChartRef.current,
      [selectedClass]: newClassSeating
    };

    // 1. INSTANT REACT STATE UPDATE (0ms)
    setSeatingChart(updatedChart);

    // 2. INSTANT LOCAL STORAGE WRITE (~0.1ms)
    try {
      localStorage.setItem('school_seating_chart', JSON.stringify(updatedChart));
    } catch (e) {}

    // 3. DEBOUNCED BACKGROUND SUPABASE SYNC (1500ms - Never blocks UI frames)
    if (supabaseDebounceTimerRef.current) {
      clearTimeout(supabaseDebounceTimerRef.current);
    }
    supabaseDebounceTimerRef.current = setTimeout(() => {
      try {
        saveSupabaseState('school_seating_chart', updatedChart);
      } catch (e) {}
    }, 1500);
  }, [selectedClass, setSeatingChart]);

  // Assign student to computer
  const assignStudentToComputer = useCallback((pcId: string, studentId: string) => {
    const currentSeating = { ...(seatingChartRef.current[selectedClass] || {}) };

    const att = getStudentAttendance(studentId);
    if (att === 'excused' || att === 'unexcused') {
      const st = studentsByIdMap.get(studentId);
      showToast(`Chú ý: ${st ? formatStudentNameFirstAndMiddle(st.name) : 'Học sinh'} đang được báo VẮNG MẶT hôm nay (${att === 'excused' ? 'Có phép' : 'Không phép'})!`, 'warning');
    }

    Object.keys(currentSeating).forEach(key => {
      const ids = getAssignedStudentIds(currentSeating[key]).filter(id => id !== studentId);
      if (ids.length > 0) {
        currentSeating[key] = ids.join(',');
      } else {
        delete currentSeating[key];
      }
    });

    const targetPCHs = getAssignedStudentIds(currentSeating[pcId]);
    if (targetPCHs.length >= 2) {
      showToast('Máy tính này đã đủ 2 học sinh!', 'warning');
      return;
    }

    targetPCHs.push(studentId);
    currentSeating[pcId] = targetPCHs.join(',');
    saveSeatingState(currentSeating);
    playButtonClickSound();

    const st = studentsByIdMap.get(studentId);
    showToast(`Đã xếp ${st ? formatStudentNameFirstAndMiddle(st.name) : 'học sinh'} vào ${pcId}!`, 'success');
  }, [selectedClass, getAssignedStudentIds, saveSeatingState, studentsByIdMap, showToast, getStudentAttendance]);

  // SWAP MACHINE SEATING OR MOVE STUDENTS BETWEEN MACHINES
  const swapOrMoveStudentsBetweenPCs = useCallback((sourcePcId: string, targetPcId: string, draggedStId: string) => {
    const currentSeating = { ...(seatingChartRef.current[selectedClass] || {}) };
    const sourceIds = getAssignedStudentIds(currentSeating[sourcePcId]);
    const targetIds = getAssignedStudentIds(currentSeating[targetPcId]);

    if (targetIds.length < 2) {
      const newSourceIds = sourceIds.filter(id => id !== draggedStId);
      const newTargetIds = [...targetIds, draggedStId];

      if (newSourceIds.length > 0) currentSeating[sourcePcId] = newSourceIds.join(',');
      else delete currentSeating[sourcePcId];

      currentSeating[targetPcId] = newTargetIds.join(',');
      saveSeatingState(currentSeating);
      playButtonClickSound();
      showToast(`Đã chuyển học sinh sang máy ${targetPcId}!`, 'success');
      return;
    }

    const swappedTargetStId = targetIds[0];
    const newSourceIds = sourceIds.map(id => id === draggedStId ? swappedTargetStId : id);
    const newTargetIds = targetIds.map(id => id === swappedTargetStId ? draggedStId : id);

    currentSeating[sourcePcId] = newSourceIds.join(',');
    currentSeating[targetPcId] = newTargetIds.join(',');

    saveSeatingState(currentSeating);
    playVictoryFanfareSound();

    const st1 = studentsByIdMap.get(draggedStId);
    const st2 = studentsByIdMap.get(swappedTargetStId);
    showToast(`Đã tráo vị trí ngồi giữa ${st1 ? formatStudentNameFirstAndMiddle(st1.name) : 'HS1'} (${sourcePcId}) và ${st2 ? formatStudentNameFirstAndMiddle(st2.name) : 'HS2'} (${targetPcId})!`, 'success');
  }, [selectedClass, getAssignedStudentIds, saveSeatingState, studentsByIdMap, showToast]);

  // ❌ 100% RELIABLE & INSTANT STUDENT REMOVAL FROM COMPUTER
  const unassignStudentFromComputer = useCallback((pcId: string, studentId: string) => {
    const currentSeating = { ...(seatingChartRef.current[selectedClass] || {}) };
    const targetPCHs = getAssignedStudentIds(currentSeating[pcId]).filter(id => id !== studentId);
    if (targetPCHs.length > 0) {
      currentSeating[pcId] = targetPCHs.join(',');
    } else {
      delete currentSeating[pcId];
    }
    saveSeatingState(currentSeating);
    playButtonClickSound();
    showToast('Đã xóa học sinh khỏi vị trí máy!', 'info');
  }, [selectedClass, getAssignedStudentIds, saveSeatingState, showToast]);

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

  // QUICK HEAD-OF-ROW SEATING FOR CLASS MONITORS
  const handleSeatClassMonitorsHead = () => {
    if (classStudents.length === 0) {
      showToast('Lớp học chưa có học sinh nào!', 'warning');
      return;
    }

    let lopTruong = classStudents.find(s => getStudentMonitorRole(s) === 'L. Trưởng');
    let lopPho = classStudents.find(s => getStudentMonitorRole(s) === 'Lớp phó');

    if (!lopTruong && classStudents[0]) {
      lopTruong = classStudents[0];
      saveStudentDuty(lopTruong.id, 'L. Trưởng');
    }
    if (!lopPho && classStudents[1]) {
      lopPho = classStudents[1];
      saveStudentDuty(lopPho.id, 'Lớp phó');
    }

    const availablePcs = activeLabGrid.pcList;
    if (availablePcs.length < 2) {
      showToast('Phòng Lab cần ít nhất 2 máy tính!', 'warning');
      return;
    }

    const currentSeating = { ...currentClassSeating };
    const pcHead1 = availablePcs[0]?.id || formatComputerName(1);
    const pcHead2 = availablePcs[1]?.id || formatComputerName(2);

    if (lopTruong) {
      Object.keys(currentSeating).forEach(k => {
        const ids = getAssignedStudentIds(currentSeating[k]).filter(id => id !== lopTruong!.id);
        if (ids.length > 0) currentSeating[k] = ids.join(',');
        else delete currentSeating[k];
      });
      currentSeating[pcHead1] = lopTruong.id;
    }

    if (lopPho) {
      Object.keys(currentSeating).forEach(k => {
        const ids = getAssignedStudentIds(currentSeating[k]).filter(id => id !== lopPho!.id);
        if (ids.length > 0) currentSeating[k] = ids.join(',');
        else delete currentSeating[k];
      });
      currentSeating[pcHead2] = lopPho.id;
    }

    saveSeatingState(currentSeating);
    playVictoryFanfareSound();
    showToast(`Đã tự động xếp L. Trưởng (${lopTruong ? formatStudentNameFirstAndMiddle(lopTruong.name) : ''}) vào máy ${pcHead1} và Lớp phó (${lopPho ? formatStudentNameFirstAndMiddle(lopPho.name) : ''}) vào máy ${pcHead2} đầu bàn!`, 'success');
  };

  // Auto seating algorithm
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
    showToast(`Đã xếp tự động chỗ ngồi cho ${classStudents.length} học sinh lớp ${selectedClass} (ưu tiên học sinh có mặt)!`, 'success');
  };

  // DRAG AND DROP HANDLERS (100% Flicker-Free 60FPS Drag & Drop Performance)
  const dragPayloadRef = useRef<{ studentId: string; sourcePcId: string | null } | null>(null);

  const handleStudentDragStart = useCallback((e: React.DragEvent, studentId: string, sourcePcId: string | null = null) => {
    const payload = JSON.stringify({ studentId, sourcePcId });
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'move';
    dragPayloadRef.current = { studentId, sourcePcId };
  }, []);

  // Smooth dragover handler - only updates state if PC ID actually changes
  const handlePcDragOver = useCallback((e: React.DragEvent, pcId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPcIdRef.current !== pcId) {
      dragOverPcIdRef.current = pcId;
      setDragOverPcId(pcId);
    }
  }, []);

  // Smooth dragleave handler - ignores dragleave when moving over child elements inside same card
  const handlePcDragLeave = useCallback((e: React.DragEvent, pcId: string) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as Node | null;
    if (e.currentTarget && relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return; // Still inside the same card, ignore dragleave to prevent flickering
    }
    if (dragOverPcIdRef.current === pcId) {
      dragOverPcIdRef.current = null;
      setDragOverPcId(null);
    }
  }, []);

  const handleStudentDragEnd = useCallback(() => {
    dragOverPcIdRef.current = null;
    setDragOverPcId(null);
    dragPayloadRef.current = null;
  }, []);

  const handlePcDrop = useCallback((e: React.DragEvent, targetPcId: string) => {
    e.preventDefault();
    dragOverPcIdRef.current = null;
    setDragOverPcId(null);

    let studentId = dragPayloadRef.current?.studentId;
    let sourcePcId = dragPayloadRef.current?.sourcePcId;

    try {
      const dataRaw = e.dataTransfer.getData('text/plain');
      if (dataRaw) {
        const parsed = JSON.parse(dataRaw);
        if (parsed.studentId) {
          studentId = parsed.studentId;
          sourcePcId = parsed.sourcePcId;
        }
      }
    } catch (err) {}

    dragPayloadRef.current = null;

    if (!studentId) return;
    if (sourcePcId === targetPcId) return;

    if (sourcePcId) {
      swapOrMoveStudentsBetweenPCs(sourcePcId, targetPcId, studentId);
    } else {
      assignStudentToComputer(targetPcId, studentId);
    }
  }, [assignStudentToComputer, swapOrMoveStudentsBetweenPCs]);

  const handlePcCardClick = useCallback((pcId: string) => {
    if (selectedStudentForAssign) {
      assignStudentToComputer(pcId, selectedStudentForAssign);
      setSelectedStudentForAssign(null);
    }
  }, [selectedStudentForAssign, assignStudentToComputer]);

  // Custom Image Upload for PC Frame
  const [customDriveInput, setCustomDriveInput] = useState('');
  const driveFileId = useMemo(() => extractGoogleDriveFileId(customDriveInput), [customDriveInput]);

  const handleApplyDriveFrameImage = () => {
    if (!customDriveInput.trim()) return;
    const processedUrl = convertGoogleDriveUrl(customDriveInput, 1000);
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

  // 📄 EXPORT SEATING CHART TO MS WORD (.DOC)
  const handleExportWord = useCallback(() => {
    try {
      exportSeatingChartToWord({
        className: selectedClass,
        lab: activeLab,
        classStudents,
        attendanceSummary,
        cellDataMap: computedCellDataMap,
        gridRows: activeLabGrid.rows,
        gridCols: activeLabGrid.cols,
        gridCells: activeLabGrid.cells,
        getStudentAttendance,
        hideAisles: hideAislesPrint
      });
      playVictoryFanfareSound();
      showToast(`Đã xuất sơ đồ phòng máy lớp ${selectedClass} ra file Word (.doc) thành công!`, 'success');
    } catch (e) {
      showToast('Lỗi khi xuất file Word, vui lòng thử lại!', 'error');
    }
  }, [selectedClass, activeLab, classStudents, attendanceSummary, computedCellDataMap, activeLabGrid, getStudentAttendance, hideAislesPrint, showToast]);

  // Printable Canvas Component for Portal
  const renderPrintableCanvas = () => (
    <div className="printable-a4-canvas bg-white p-6 border-2 border-slate-900 text-slate-900 space-y-4 max-w-[1050px] mx-auto">
      <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center text-slate-900">
        <div>
          <div className="font-black text-xs uppercase tracking-wider text-slate-800">TRƯỜNG TIỂU HỌC LONG ĐỊNH</div>
          <h2 className="font-black text-lg text-slate-900 leading-tight">SƠ ĐỒ PHÒNG MÁY TÍNH - LỚP {selectedClass.toUpperCase()}</h2>
          <div className="text-[11px] font-bold text-slate-700">
            {activeLab.name} ({activeLab.code}) • Sĩ số: {classStudents.length} HS ({attendanceSummary.present} Có mặt, {attendanceSummary.absentTotal} Vắng)
          </div>
        </div>
        <div className="text-right text-[11px] font-bold text-slate-600">
          Ngày in: {new Date().toLocaleDateString('vi-VN')}
        </div>
      </div>

      <div className="bg-amber-100/70 text-amber-950 border border-amber-300 py-1.5 font-black text-center text-xs uppercase rounded-xl tracking-widest flex items-center justify-center gap-2">
        <span>MÀN CHIẾU & BẢNG GIÁO VIÊN ({activeLab.name})</span>
      </div>

      <div 
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${printableGridData.cols}, minmax(0, 1fr))`
        }}
      >
        {printableGridData.cells.map(tile => {
          if (tile.type === 'aisle') {
            return (
              <div key={`print_aisle_${tile.row}_${tile.col}`} className="bg-slate-100/60 border border-dashed border-slate-300 rounded p-1 text-center text-[8px] font-bold text-slate-400 min-h-[45px] flex items-center justify-center">
                Lối đi
              </div>
            );
          }

          const pcId = tile.label;
          const cellData = computedCellDataMap[pcId] || { assignedStudents: [] };
          const assignedSts = cellData.assignedStudents;

          return (
            <div key={`print_pc_${pcId}`} className="border-2 border-slate-900 rounded p-1 bg-slate-50 min-h-[60px] flex flex-col justify-between text-xs">
              <div className="flex justify-between items-center font-bold text-[10px] border-b border-slate-400 pb-0.5 mb-0.5 w-full gap-1">
                <span className="font-black text-slate-900 whitespace-nowrap shrink-0">🖥️ {formatComputerName(pcId)}</span>
                {cellData.monitorRole === 'L. Trưởng' ? (
                  <span 
                    style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                    className="text-[7.5px] font-black bg-amber-300 text-slate-950 px-1 rounded border border-amber-600 whitespace-nowrap shrink-0 ml-auto transition-all"
                  >
                    🌟 L. TRƯỞNG
                  </span>
                ) : cellData.monitorRole === 'Lớp phó' ? (
                  <span 
                    style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                    className="text-[7.5px] font-black bg-sky-300 text-slate-950 px-1 rounded border border-sky-600 whitespace-nowrap shrink-0 ml-auto transition-all"
                  >
                    ⭐ LỚP PHÓ
                  </span>
                ) : cellData.monitorRole === 'Tổ trưởng' ? (
                  <span 
                    style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                    className="text-[7.5px] font-black bg-purple-300 text-slate-950 px-1 rounded border border-purple-600 whitespace-nowrap shrink-0 ml-auto transition-all"
                  >
                    🔰 TỔ TRƯỞNG
                  </span>
                ) : null}
              </div>

              {assignedSts.length > 0 ? (
                <div className="space-y-0.5 my-auto">
                  {assignedSts.map(st => {
                    const att = getStudentAttendance(st.id);
                    const isAbsent = att === 'excused' || att === 'unexcused';
                    const monitorRole = getStudentMonitorRole(st);

                    return (
                      <div key={`print_st_${st.id}`} className={`font-black text-[9.5px] text-center rounded px-1 py-0.5 border flex items-center justify-center gap-0.5 ${
                        isAbsent ? 'bg-rose-100 border-rose-400 text-rose-900 line-through' : 'bg-emerald-100 border-emerald-400 text-emerald-950'
                      }`}>
                        {monitorRole === 'L. Trưởng' && <span className="text-[8px]">🌟</span>}
                        {monitorRole === 'Lớp phó' && <span className="text-[8px]">⭐</span>}
                        <span>{isAbsent ? `[VẮNG] ` : ''}{formatStudentNameFirstAndMiddle(st.name)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[8.5px] text-slate-400 italic text-center my-auto">Chưa xếp</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-slate-400 grid grid-cols-2 text-center text-xs font-bold">
        <div>
          <div>CÁN BỘ QUẢN LÝ PHÒNG LAB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">(Ký và ghi rõ họ tên)</div>
        </div>
        <div>
          <div>GIÁO VIÊN BỘ MÔN TIN HỌC</div>
          <div className="text-[10px] text-slate-500 mt-0.5">(Ký và ghi rõ họ tên)</div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // 🪑 1. INLINE SUB-VIEW: XẾP CHỖ NGỒI (FULL WINDOW INTERACTIVE CANVAS MATCHING Screenshot 2026-08-13 160505.png)
  // =========================================================================
  if (isSeatingViewOpen) {
    return (
      <div className="space-y-5 text-slate-800 pb-12">
        {/* Top Control Bar for Seating View */}
        <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
          <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSeatingViewOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#cbb89d] font-black text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" /> Quay Về Sơ Đồ Chính
              </button>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-amber-800" />
                  CHỨC NĂNG KÉO THẢ XẾP CHỖ NGỒI HỌC SINH (LỚP {selectedClass.toUpperCase()})
                </h3>
                <p className="text-[11px] font-bold text-slate-600">Kéo thả học sinh từ bảng danh sách chờ hoặc tráo đổi ghế giữa các máy tính</p>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSeatClassMonitorsHead}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-700"
              >
                <Star className="w-3.5 h-3.5" /> Xếp Cán Bộ Lớp
              </button>

              <button
                onClick={handleAutoSeatClass}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Xếp Tự Động
              </button>

              <button
                onClick={handleClearAllClassSeating}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Xóa Chỗ Ngồi
              </button>
            </div>
          </div>
        </div>

        {/* Dual Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT PANEL: HỌC SINH CHỜ NGỒI */}
          {isUnassignedPanelVisible && (
            <div className="lg:col-span-4 bg-[#fffbf0] rounded-2xl p-4 border border-[#cbb89d] shadow-xs space-y-3 flex flex-col max-h-[720px] overflow-hidden">
              
              <div className="space-y-0.5 border-b border-[#cbb89d] pb-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xs text-[#3d2b17] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-800" />
                    HỌC SINH CHỜ NGỒI ({unassignedStudents.length})
                  </h3>
                  <button
                    onClick={() => setIsUnassignedPanelVisible(false)}
                    className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-[#3d2b17] border border-amber-300 font-black text-[10px] cursor-pointer shadow-2xs flex items-center gap-1"
                    title="Ẩn bảng chờ để mở rộng sơ đồ máy"
                  >
                    <span>◀ Ẩn</span>
                  </button>
                </div>
                <p className="text-[10px] font-bold text-slate-500 leading-snug">
                  Kéo HOẶC nhấp chọn học sinh để xếp vào ô máy tính.
                </p>
              </div>

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

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[540px]">
                {filteredUnassignedStudents.length > 0 ? (
                  filteredUnassignedStudents.map(st => {
                    const att = getStudentAttendance(st.id);
                    const isAbsent = att === 'excused' || att === 'unexcused';
                    const isSelectedForAssign = selectedStudentForAssign === st.id;
                    const monitorRole = getStudentMonitorRole(st);

                    return (
                      <div
                        key={st.id}
                        draggable={true}
                        onDragStart={(e) => handleStudentDragStart(e, st.id)}
                        onDragEnd={handleStudentDragEnd}
                        onClick={() => {
                          if (isSelectedForAssign) {
                            setSelectedStudentForAssign(null);
                          } else {
                            setSelectedStudentForAssign(st.id);
                            showToast(`Đang chọn ${formatStudentNameFirstAndMiddle(st.name)}! Nhấp vào bất kỳ ô máy tính nào bên phải để xếp.`, 'info');
                          }
                        }}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group shadow-2xs ${
                          isSelectedForAssign 
                            ? 'bg-emerald-100 border-2 border-emerald-600 ring-2 ring-emerald-400/50 scale-[1.02] z-10' 
                            : isAbsent 
                              ? 'bg-rose-50 border-rose-300 hover:bg-rose-100/80' 
                              : 'bg-white hover:bg-emerald-50 border-[#cbb89d] hover:border-emerald-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <StudentAvatar3D gender={st.gender} size="w-8 h-8" name={st.name} avatarUrl={st.avatarUrl} />
                          <div>
                            <div className="font-black text-xs text-slate-900 group-hover:text-emerald-950 flex flex-wrap items-center gap-1.5">
                              <span>{st.name}</span>
                              
                              {monitorRole === 'L. Trưởng' && (
                                <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded border border-amber-500 flex items-center gap-0.5 shadow-2xs">
                                  L. TRƯỞNG
                                </span>
                              )}
                              {monitorRole === 'Lớp phó' && (
                                <span className="text-[9px] font-black bg-sky-400 text-slate-950 px-1.5 py-0.5 rounded border border-sky-500 flex items-center gap-0.5 shadow-2xs">
                                  LỚP PHÓ
                                </span>
                              )}
                              {monitorRole === 'Tổ trưởng' && (
                                <span className="text-[9px] font-black bg-purple-400 text-slate-950 px-1.5 py-0.5 rounded border border-purple-500 flex items-center gap-0.5 shadow-2xs">
                                  TỔ TRƯỞNG
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>MSHS: {st.code}</span>
                              <div className="flex items-center gap-1 text-[9px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveStudentDuty(st.id, monitorRole === 'L. Trưởng' ? null : 'L. Trưởng');
                                  }}
                                  className={`px-1 rounded border cursor-pointer font-black ${monitorRole === 'L. Trưởng' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-amber-100'}`}
                                >
                                  L.Trưởng
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveStudentDuty(st.id, monitorRole === 'Lớp phó' ? null : 'Lớp phó');
                                  }}
                                  className={`px-1 rounded border cursor-pointer font-black ${monitorRole === 'Lớp phó' ? 'bg-sky-500 text-white border-sky-600' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-sky-100'}`}
                                >
                                  L.Phó
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[9px] font-black px-2 py-1 rounded-md border flex items-center gap-1 ${
                          isSelectedForAssign 
                            ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse'
                            : isAbsent 
                              ? 'bg-rose-200 text-rose-900 border-rose-300' 
                              : 'bg-amber-100 text-amber-900 border-amber-200 group-hover:bg-emerald-200 group-hover:text-emerald-900'
                        }`}>
                          {isSelectedForAssign ? '✓ Đang chọn' : 'Xếp máy 👆'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 font-bold text-xs text-emerald-800">
                    ✓ Tất cả học sinh đã có máy!
                  </div>
                )}
              </div>

            </div>
          )}

          {/* RIGHT PANEL: INTERACTIVE ROOM SEATING MAP */}
          <div className={`${isUnassignedPanelVisible ? 'lg:col-span-8' : 'lg:col-span-12'} bg-[#fbf7ee] rounded-2xl p-4 sm:p-5 border border-[#cbb89d] shadow-xs space-y-4`}>
            
            {/* Header Màn chiếu bảng giáo viên */}
            <div className="flex justify-between items-center bg-[#dfccb0] p-2.5 rounded-xl border border-[#cbb89d]">
              <span className="text-xs font-black text-[#3d2b17] uppercase tracking-widest flex items-center gap-2">
                <Tv className="w-4 h-4 text-amber-800" />
                MÀN CHIẾU & BẢNG GIÁO VIÊN ({activeLab.name} - {activeLab.code})
              </span>

              {!isUnassignedPanelVisible && (
                <button
                  onClick={() => setIsUnassignedPanelVisible(true)}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                >
                  ▶ Hiện Bảng CHỜ ({unassignedStudents.length} HS)
                </button>
              )}
            </div>

            {/* Room Matrix Grid */}
            <div 
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${activeLabGrid.cols}, minmax(0, 1fr))`
              }}
            >
              {activeLabGrid.cells.map(tile => {
                if (tile.type === 'aisle') {
                  return (
                    <div key={`aisle_${tile.row}_${tile.col}`} className="bg-amber-100/40 border border-amber-200/50 rounded-xl p-2 flex items-center justify-center min-h-[90px] select-none">
                      <span className="text-[10px] font-black text-amber-800/40 uppercase tracking-wider">Lối đi</span>
                    </div>
                  );
                }

                const pcId = tile.label;
                const cellData = computedCellDataMap[pcId] || { assignedStudents: [] };
                const assignedStudents = cellData.assignedStudents;
                const isFull = cellData.isFull;
                const isDragOver = dragOverPcId === pcId;
                const monitorRole = cellData.monitorRole;

                let borderStyleClass = 'border-[#cbb89d] bg-[#fffbf0]';
                if (monitorRole === 'L. Trưởng') {
                  borderStyleClass = 'border-amber-400 bg-amber-50/80 ring-4 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.6)] z-10';
                } else if (monitorRole === 'Lớp phó') {
                  borderStyleClass = 'border-sky-400 bg-sky-50/80 ring-4 ring-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.6)] z-10';
                } else if (isFull) {
                  borderStyleClass = 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/60';
                }

                return (
                  <div
                    key={`pc_${pcId}`}
                    onClick={() => handlePcCardClick(pcId)}
                    onDragOver={(e) => handlePcDragOver(e, pcId)}
                    onDragLeave={(e) => handlePcDragLeave(e, pcId)}
                    onDrop={(e) => handlePcDrop(e, pcId)}
                    className={`rounded-xl border-2 transition-all relative flex flex-col justify-between cursor-pointer ${cardSizeClasses[frameConfig.cardSize]} ${
                      isDragOver ? 'border-amber-500 scale-105 bg-amber-100 ring-4 ring-amber-400/50 z-20' : borderStyleClass
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5 w-full gap-1">
                      <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border shadow-2xs whitespace-nowrap shrink-0 ${
                        assignedStudents.length > 0
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-[#dfccb0] text-[#3d2b17] border-[#cbb89d]'
                      }`}>
                        🖥️ {formatComputerName(pcId)}
                      </span>

                      {monitorRole === 'L. Trưởng' ? (
                        <span 
                          style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                          className="text-[8.5px] sm:text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full border border-amber-500 shadow-md animate-pulse whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all"
                        >
                          🌟 L. TRƯỞNG
                        </span>
                      ) : monitorRole === 'Lớp phó' ? (
                        <span 
                          style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                          className="text-[8.5px] sm:text-[9px] font-black bg-sky-400 text-slate-950 px-1.5 py-0.5 rounded-full border border-sky-500 shadow-md whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all"
                        >
                          ⭐ LỚP PHÓ
                        </span>
                      ) : monitorRole === 'Tổ trưởng' ? (
                        <span 
                          style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                          className="text-[8.5px] sm:text-[9px] font-black bg-purple-400 text-slate-950 px-1.5 py-0.5 rounded-full border border-purple-500 shadow-md whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all"
                        >
                          🔰 TỔ TRƯỞNG
                        </span>
                      ) : null}
                    </div>

                    {assignedStudents.length > 0 ? (
                      <div className="space-y-1.5 my-auto w-full text-center">
                        {assignedStudents.map(st => {
                          const role = getStudentMonitorRole(st);
                          let pillBgStyle = 'bg-emerald-400 text-slate-950 border-emerald-300';
                          if (showGenderColors) {
                            if (st.gender === 'Nữ') pillBgStyle = 'bg-pink-300 text-slate-950 border-pink-200';
                            else pillBgStyle = 'bg-sky-400 text-slate-950 border-sky-300';
                          }

                          return (
                            <div
                              key={st.id}
                              draggable={true}
                              onDragStart={(e) => handleStudentDragStart(e, st.id, pcId)}
                              onDragEnd={handleStudentDragEnd}
                              className={`rounded-lg px-2.5 py-1 flex items-center justify-between relative transition-all cursor-grab active:cursor-grabbing text-center shadow-2xs border ${pillBgStyle}`}
                            >
                              <span className="font-black text-xs text-center truncate mx-auto flex items-center justify-center gap-1">
                                {role === 'L. Trưởng' && <Star className="w-3 h-3 text-amber-950 fill-amber-300" />}
                                {role === 'Lớp phó' && <Award className="w-3 h-3 text-sky-950" />}
                                <span>{formatStudentNameFirstAndMiddle(st.name)}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  unassignStudentFromComputer(pcId, st.id);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-900/70 hover:text-white hover:bg-rose-600 p-1 rounded-full cursor-pointer z-30 transition-all shadow-2xs border border-transparent hover:border-rose-700 active:scale-90"
                                title="Xóa học sinh khỏi máy"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="my-auto py-1.5 text-center justify-center flex items-center text-[#5c4327]/60 font-bold text-[10px] border border-dashed border-[#cbb89d] rounded-lg bg-white/40">
                        {selectedStudentForAssign ? '👆 Nhấp để xếp máy' : 'Kéo HOẶC nhấp xếp'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // 🖨️ 2. DEDICATED PRINT PREVIEW WITH DOCUMENT.BODY PORTAL (100% PERFECT A4 PRINTING)
  // =========================================================================
  if (isPrintModalOpen) {
    return (
      <div className="space-y-6 text-slate-800 pb-10">
        <style>{`
          @media print {
            #root {
              display: none !important;
            }
            body > *:not(#lab-print-portal) {
              display: none !important;
            }
            #lab-print-portal {
              display: block !important;
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 8mm !important;
            }
            #lab-print-portal * {
              visibility: visible !important;
            }
            @page {
              size: A4 landscape;
              margin: 5mm;
            }
          }
        `}</style>

        {/* Portal to document.body for zero blank pages when printing */}
        {printPortalContainer && createPortal(
          renderPrintableCanvas(),
          printPortalContainer
        )}

        {/* Top Control Bar (Screen only) */}
        <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs no-print">
          <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#cbb89d] font-black text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" /> Quay Về Sơ Đồ Phòng Lab
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideAislesPrint(!hideAislesPrint)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md border ${
                  hideAislesPrint 
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-900' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-[#cbb89d]'
                }`}
                title="Bật/Tắt thu gọn lối đi để tối ưu toàn bộ ma trận máy tính trong 1 trang A4 duy nhất"
              >
                <Sliders className="w-4 h-4" /> 
                {hideAislesPrint ? '🟢 Đã Ẩn Lối Đi (Tối Ưu 1 Trang A4)' : '⚪ Hiện Lối Đi Đầy Đủ'}
              </button>

              <button
                onClick={handleExportWord}
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer border border-blue-900"
                title="Tải sơ đồ chỗ ngồi về máy dưới dạng file Word (.doc) để chỉnh sửa và in"
              >
                <FileText className="w-4 h-4" /> XUẤT FILE WORD (.DOC)
              </button>

              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer border border-amber-950"
              >
                <Printer className="w-4 h-4" /> XÁC NHẬN IN NGAY / XUẤT FILE PDF
              </button>
            </div>
          </div>
        </div>

        {/* Screen Preview Container */}
        <div className="no-print">
          {renderPrintableCanvas()}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🎨 3. INLINE SUB-VIEW: ĐỔI KHUNG CARD PC
  // =========================================================================
  if (isFrameConfigSubViewOpen) {
    return (
      <div className="space-y-6 text-slate-800 pb-10">
        <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
          <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFrameConfigSubViewOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#cbb89d] font-black text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" /> Quay Về Sơ Đồ Phòng Lab
              </button>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-800" />
                  THIẾT LẬP & ĐỔI KHUNG CARD PC PHÒNG LAB
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#fffbf0] rounded-3xl p-6 border border-[#cbb89d] shadow-xs space-y-4">
              <h4 className="font-black text-sm text-[#3d2b17] flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600" /> MẪU PRESET KHUNG CARD CÓ SẴN
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
                          : 'border-[#cbb89d] hover:border-emerald-500 bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-black text-xs text-slate-900">{skin.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">Click để chọn ngay</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#fffbf0] rounded-3xl p-6 border border-[#cbb89d] shadow-xs space-y-4">
              <h4 className="font-black text-sm text-[#3d2b17] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" /> NẠP ẢNH KHUNG CARD TỪ GOOGLE DRIVE HOẶC MÁY TÍNH
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-slate-700">Dán Link Google Drive:</label>
                  {driveFileId && (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Drive OK
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDriveInput}
                    onChange={(e) => setCustomDriveInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    className="flex-1 px-3.5 py-2.5 text-xs font-bold rounded-2xl border border-[#cbb89d] bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                  <button
                    onClick={handleApplyDriveFrameImage}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#cbb89d] space-y-2">
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
                  <span className="text-xs font-bold text-emerald-900">Đang dùng Ảnh Khung Tùy Chỉnh!</span>
                  <button
                    onClick={() => setFrameConfig(prev => ({ ...prev, customImageUrl: undefined }))}
                    className="text-xs font-black text-rose-600 hover:underline cursor-pointer"
                  >
                    Gỡ bỏ ảnh tùy chỉnh
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#fffbf0] rounded-3xl p-6 border border-[#cbb89d] shadow-xs space-y-4">
              <h4 className="font-black text-sm text-[#3d2b17] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" /> ĐỒNG BỘ KÍCH THƯỚC CARD & SƠ ĐỒ LỚP HỌC
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-600 mb-1.5">Kích thước Ô Máy Tính:</label>
                  <select
                    value={frameConfig.cardSize}
                    onChange={(e) => setFrameConfig(prev => ({ ...prev, cardSize: e.target.value as any }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#cbb89d] bg-white font-black text-slate-800 focus:outline-none cursor-pointer"
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
                    {frameConfig.glowEffect ? 'Bật Phát Sáng' : 'Tắt Phát Sáng'}
                  </button>
                </div>
              </div>
            </div>

            {/* 📏 MARGIN ADJUSTMENT CONTROL BOX */}
            <div className="bg-[#fffbf0] rounded-3xl p-6 border border-[#cbb89d] shadow-xs space-y-4">
              <h4 className="font-black text-sm text-[#3d2b17] flex items-center gap-2">
                <Move className="w-4 h-4 text-amber-600" /> TÙY CHỈNH KHOẢNG CÁCH LỀ BÊN PHẢI (MARGIN ADJUSTMENT)
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <label className="text-slate-700">Khoảng cách từ nhãn tới mép lề bên phải thẻ Card:</label>
                  <span className="font-black bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                    {frameConfig.badgeRightMargin || 0} px
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500">0px (Sát lề)</span>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="1"
                    value={frameConfig.badgeRightMargin || 0}
                    onChange={(e) => setFrameConfig(prev => ({ ...prev, badgeRightMargin: Number(e.target.value) }))}
                    className="flex-1 accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <span className="text-[11px] font-bold text-slate-500">32px (Thụt lùi)</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 italic">
                  💡 Thầy/Cô có thể kéo thanh trượt để tự do căn chỉnh khoảng cách nhãn Cán bộ lớp (L. Trưởng, Lớp phó...) thụt lùi so với mép lề bên phải theo ý muốn.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#fffbf0] rounded-3xl p-6 border border-[#cbb89d] text-slate-900 space-y-4 shadow-md sticky top-4">
              <h4 className="font-black text-xs text-[#3d2b17] uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" /> XEM TRƯỚC HIỂN THỊ KHUNG CARD PC
              </h4>

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
                <div className="flex justify-between items-center mb-3 w-full gap-1">
                  <span className="font-mono font-black text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg border border-emerald-400 shadow-2xs whitespace-nowrap shrink-0">
                    🖥️ Máy 01
                  </span>
                  <span 
                    style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                    className="text-[8.5px] sm:text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full border border-amber-500 shadow-md animate-pulse whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all"
                  >
                    🌟 L. TRƯỞNG
                  </span>
                </div>

                <div className="space-y-1.5 text-center">
                  <div className="bg-emerald-400 border-2 border-emerald-300 text-slate-950 rounded-xl px-3 py-1.5 flex items-center justify-center relative shadow-md">
                    <span className="font-black text-xs text-center mx-auto flex items-center gap-1">
                      <span>Văn An</span>
                    </span>
                    <span className="absolute right-2 text-[10px] opacity-70">×</span>
                  </div>
                  <div className="bg-emerald-400 border-2 border-emerald-300 text-slate-950 rounded-xl px-3 py-1.5 flex items-center justify-center relative shadow-md">
                    <span className="font-black text-xs text-center mx-auto flex items-center gap-1">
                      <span>Thị Bích</span>
                    </span>
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
  // 🖥️ MAIN VIEW: MAIN ROOM CANVAS GRID (100% FULL WIDTH - NO UNASSIGNED PANEL OUTSIDE)
  // =========================================================================
  return (
    <div className="space-y-5 pb-12 text-slate-800">
      
      {/* 🌟 1. BANNER ACTION BUTTONS ROW (Xếp chỗ ngồi | Khung Card | Màu Nam/Nữ | Xếp Cán Bộ Lớp | Xếp Tự Động | Xóa chỗ ngồi) */}
      <div className="relative rounded-2xl border border-[#cbb89d] bg-[#fffbf0] py-3 px-4 text-slate-900 shadow-xs no-print flex flex-wrap items-center justify-between gap-2.5">
        
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Xếp chỗ ngồi */}
          <button
            onClick={() => setIsSeatingViewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-900"
            title="Mở giao diện kéo thả xếp chỗ ngồi tương tác"
          >
            <Armchair className="w-3.5 h-3.5 text-amber-200" />
            <span>Xếp chỗ ngồi ({unassignedStudents.length} HS Chờ)</span>
          </button>

          {/* Khung card */}
          <button
            onClick={() => setIsFrameConfigSubViewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#3d2b17] hover:bg-[#281c0f] text-amber-200 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-[#5c4327] cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Khung card</span>
          </button>

          {/* Màu Nam/Nữ (MOVED HERE ALONGSIDE OTHER ACTION BUTTONS) */}
          <button
            onClick={toggleGenderColors}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
              showGenderColors 
                ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-500'
                : 'bg-white text-slate-800 border-[#cbb89d] hover:bg-slate-100'
            }`}
            title="Bật/Tắt dải màu xanh biển cho Nam và màu hồng nhạt cho Nữ"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Màu Nam/Nữ: {showGenderColors ? 'BẬT' : 'TẮT'}</span>
          </button>

          {/* Xếp Cán Bộ Lớp */}
          <button
            onClick={handleSeatClassMonitorsHead}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-700"
            title="Ưu tiên xếp L. Trưởng và Lớp phó vào các vị trí máy đầu bàn (M.01, M.02)"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Xếp Cán Bộ Lớp</span>
          </button>

          {/* Xếp Tự Động */}
          <button
            onClick={handleAutoSeatClass}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xếp Tự Động</span>
          </button>
        </div>

        {/* Xóa chỗ ngồi */}
        <button
          onClick={handleClearAllClassSeating}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-rose-700"
          title="Xóa toàn bộ chỗ ngồi đã xếp của lớp hiện tại"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa chỗ ngồi</span>
        </button>

      </div>

      {/* 🎛️ 2. CONTROL FILTER BAR */}
      <div className="bg-[#fffbf0] rounded-2xl p-3.5 sm:p-4 border border-[#cbb89d] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        
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

          {/* Attendance Summary */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#cbb89d] text-xs font-black text-[#3d2b17] shadow-2xs">
            <span>Điểm danh:</span>
            <span className="text-emerald-700 font-bold">Có mặt: {attendanceSummary.present}</span>
            {attendanceSummary.absentTotal > 0 ? (
              <span className="text-rose-700 font-black flex items-center gap-0.5">
                | Vắng: {attendanceSummary.absentTotal}
                {attendanceSummary.excused > 0 && <span className="text-amber-700"> ({attendanceSummary.excused}P)</span>}
                {attendanceSummary.unexcused > 0 && <span className="text-rose-700"> ({attendanceSummary.unexcused}K)</span>}
              </span>
            ) : (
              <span className="text-slate-400">| Đủ 100%</span>
            )}
          </div>

          {/* Quick Student Finder */}
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-700" />
            <input
              type="text"
              value={searchStudentSeat}
              onChange={(e) => setSearchStudentSeat(e.target.value)}
              placeholder="Tìm vị trí chỗ ngồi HS..."
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

          {searchStudentSeat && (
            <span className="text-[11px] font-black text-amber-900 bg-amber-200/90 px-2.5 py-1 rounded-lg border border-amber-400">
              {matchingPcIdsForSearch.size} ô máy khớp!
            </span>
          )}

          {attendanceSummary.absentTotal > 0 && (
            <button
              onClick={() => setShowAbsentOnlyFilter(!showAbsentOnlyFilter)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all border flex items-center gap-1.5 cursor-pointer ${
                showAbsentOnlyFilter
                  ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              {showAbsentOnlyFilter ? 'Hiển thị vắng' : `Lọc ${attendanceSummary.absentTotal} HS Vắng`}
            </button>
          )}

        </div>

      </div>

      {/* 🖼️ 3. MAIN ROOM CANVAS GRID (100% FULL WIDTH ON MAIN SCREEN) */}
      <div className="w-full bg-[#fbf7ee] rounded-2xl p-4 sm:p-5 border border-[#cbb89d] shadow-xs space-y-4">
        
        {/* Top Canvas Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#dfccb0] p-2.5 rounded-xl border border-[#cbb89d]">
          
          <span className="text-xs font-black text-[#3d2b17] uppercase tracking-widest flex items-center gap-2 mx-auto sm:mx-0">
            <Tv className="w-4 h-4 text-amber-800" />
            MÀN CHIẾU & BẢNG GIÁO VIÊN ({activeLab.name} - {activeLab.code})
          </span>

          <div className="flex items-center gap-2 no-print">
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

            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 140}
              className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-800 border border-[#cbb89d] text-xs font-black shadow-2xs disabled:opacity-40 cursor-pointer"
              title="Phóng to sơ đồ (+10%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {zoomLevel !== 100 && (
              <button
                onClick={handleZoomReset}
                className="px-2 py-1 rounded-lg bg-white hover:bg-amber-50 text-[10px] font-black text-slate-700 border border-[#cbb89d] cursor-pointer"
              >
                ↺ 100%
              </button>
            )}

            <button
              onClick={handleExportWord}
              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 border border-blue-900 cursor-pointer ml-1"
              title="Xuất sơ đồ chỗ ngồi ra file Word (.doc) để chỉnh sửa"
            >
              <FileText className="w-3.5 h-3.5" /> Xuất Word
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-100 font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 border border-amber-950 cursor-pointer ml-1"
              title="Mở xem trước và in sơ đồ chỗ ngồi A4"
            >
              <Printer className="w-3.5 h-3.5" /> In Sơ Đồ
            </button>
          </div>

        </div>

        {/* Room Matrix Grid */}
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

              const pcId = tile.label;
              const cellData = computedCellDataMap[pcId] || {
                assignedStudents: [],
                hasAbsentStudent: false,
                monitorRole: null,
                targetIncident: null,
                isFull: false,
                hasOne: false
              };

              const assignedStudents = cellData.assignedStudents;
              const isFull = cellData.isFull;
              const hasOne = cellData.hasOne;
              const isDragOver = dragOverPcId === pcId;
              const isSearchMatch = matchingPcIdsForSearch.has(pcId);
              const hasAbsentStudent = cellData.hasAbsentStudent;
              const monitorRole = cellData.monitorRole;
              const targetIncident = cellData.targetIncident;

              let borderStyleClass = 'border-[#cbb89d] bg-[#fffbf0]';
              if (targetIncident) {
                borderStyleClass = 'border-rose-500 bg-rose-100/90 ring-4 ring-rose-400 text-rose-950 z-20 shadow-[0_0_20px_rgba(244,63,94,0.7)]';
              } else if (showAbsentOnlyFilter && hasAbsentStudent) {
                borderStyleClass = 'border-rose-500 bg-rose-50 ring-4 ring-rose-500 text-rose-950 z-30 shadow-[0_0_25px_rgba(244,63,94,0.8)]';
              } else if (isSearchMatch) {
                borderStyleClass = 'border-amber-400 bg-amber-100/90 ring-4 ring-amber-400 scale-105 shadow-[0_0_25px_rgba(245,158,11,0.8)] z-30';
              } else if (monitorRole === 'L. Trưởng') {
                borderStyleClass = 'border-amber-400 bg-amber-50/80 ring-4 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.6)] z-10';
              } else if (monitorRole === 'Lớp phó') {
                borderStyleClass = 'border-sky-400 bg-sky-50/80 ring-4 ring-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.6)] z-10';
              } else if (monitorRole === 'Tổ trưởng') {
                borderStyleClass = 'border-purple-400 bg-purple-50/80 ring-4 ring-purple-400/80 shadow-[0_0_20px_rgba(192,132,252,0.6)] z-10';
              } else if (isFull) {
                borderStyleClass = 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
              } else if (hasOne) {
                borderStyleClass = 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
              }

              return (
                <div
                  key={`pc_${pcId}`}
                  onClick={() => handlePcCardClick(pcId)}
                  onDragOver={(e) => handlePcDragOver(e, pcId)}
                  onDragLeave={(e) => handlePcDragLeave(e, pcId)}
                  onDrop={(e) => handlePcDrop(e, pcId)}
                  className={`rounded-xl border-2 transition-all relative flex flex-col justify-between cursor-pointer ${cardSizeClasses[frameConfig.cardSize]} ${
                    isDragOver ? 'border-amber-500 scale-105 bg-amber-100 ring-4 ring-amber-400/50 z-20' : borderStyleClass
                  } ${
                    frameConfig.customImageUrl 
                      ? 'border-indigo-400/80 bg-slate-950/90' 
                      : `${borderStyleClass} ${frameConfig.glowEffect && !targetIncident && !isSearchMatch && !monitorRole ? activeSkin.glowShadow : ''}`
                  }`}
                  style={frameConfig.customImageUrl ? {
                    backgroundImage: `url(${frameConfig.customImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : undefined}
                >
                  <div className="flex justify-between items-center mb-1.5 w-full gap-1">
                    <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border shadow-2xs whitespace-nowrap shrink-0 ${
                      assignedStudents.length > 0
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-[#dfccb0] text-[#3d2b17] border-[#cbb89d]'
                    }`}>
                      🖥️ {formatComputerName(pcId)}
                    </span>

                    {monitorRole === 'L. Trưởng' ? (
                      <span 
                        style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                        className="text-[8.5px] sm:text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full border border-amber-500 shadow-md animate-pulse whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all"
                      >
                        🌟 L. TRƯỞNG
                      </span>
                    ) : monitorRole === 'Lớp phó' ? (
                      <span 
                        style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                        className="text-[8.5px] sm:text-[9px] font-black bg-sky-400 text-slate-950 px-1.5 py-0.5 rounded-full border border-sky-500 shadow-md whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all"
                      >
                        ⭐ LỚP PHÓ
                      </span>
                    ) : monitorRole === 'Tổ trưởng' ? (
                      <span 
                        style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                        className="text-[8.5px] sm:text-[9px] font-black bg-purple-400 text-slate-950 px-1.5 py-0.5 rounded-full border border-purple-500 shadow-md whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all"
                      >
                        🔰 TỔ TRƯỞNG
                      </span>
                    ) : targetIncident ? (
                      <span 
                        style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                        className="text-[8.5px] sm:text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full border border-rose-400 animate-pulse whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all" title={targetIncident.issue}
                      >
                        HỎNG
                      </span>
                    ) : hasAbsentStudent ? (
                      <span 
                        style={{ marginRight: `${frameConfig.badgeRightMargin || 0}px` }}
                        className="text-[8.5px] sm:text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full border border-rose-400 whitespace-nowrap shrink-0 ml-auto inline-flex items-center gap-0.5 transition-all" title="Có học sinh báo vắng mặt hôm nay"
                      >
                        CÓ VẮNG
                      </span>
                    ) : null}
                  </div>

                  {targetIncident && (
                    <div className="text-[9px] font-black text-rose-900 bg-rose-200 px-1 py-0.5 rounded text-center truncate mb-1 border border-rose-300">
                      {targetIncident.type}: {targetIncident.issue}
                    </div>
                  )}

                  {assignedStudents.length > 0 ? (
                    <div className="space-y-1.5 my-auto w-full text-center">
                      {assignedStudents.map(st => {
                        const att = getStudentAttendance(st.id);
                        const isUnexcused = att === 'unexcused';
                        const isExcused = att === 'excused';
                        const isAbsent = isUnexcused || isExcused;
                        const role = getStudentMonitorRole(st);

                        let pillBgStyle = 'bg-emerald-400 text-slate-950 border-emerald-300';
                        if (isUnexcused) {
                          pillBgStyle = 'bg-rose-600 text-white border-rose-400';
                        } else if (isExcused) {
                          pillBgStyle = 'bg-amber-600 text-white border-amber-400';
                        } else if (showGenderColors) {
                          if (st.gender === 'Nữ') {
                            pillBgStyle = 'bg-pink-300 text-slate-950 border-pink-200 shadow-2xs';
                          } else {
                            pillBgStyle = 'bg-sky-400 text-slate-950 border-sky-300 shadow-2xs';
                          }
                        }

                        return (
                          <div
                            key={st.id}
                            draggable={true}
                            onDragStart={(e) => handleStudentDragStart(e, st.id, pcId)}
                            onDragEnd={handleStudentDragEnd}
                            className={`rounded-lg px-2.5 py-1 flex items-center justify-between relative transition-all cursor-grab active:cursor-grabbing group text-center shadow-2xs border ${pillBgStyle}`}
                          >
                            <span className="font-black text-xs text-center truncate mx-auto flex items-center justify-center gap-1" title={st.name}>
                              {role === 'L. Trưởng' && <Star className="w-3 h-3 text-amber-950 fill-amber-300" />}
                              {role === 'Lớp phó' && <Award className="w-3 h-3 text-sky-950" />}
                              {isUnexcused && <span className="text-[9px] font-black bg-slate-950/70 px-1 rounded text-rose-200">K</span>}
                              {isExcused && <span className="text-[9px] font-black bg-slate-950/70 px-1 rounded text-amber-200">P</span>}
                              <span className={isAbsent ? 'line-through opacity-90' : ''}>{formatStudentNameFirstAndMiddle(st.name)}</span>
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                unassignStudentFromComputer(pcId, st.id);
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-900/70 hover:text-white hover:bg-rose-600 p-1 rounded-full cursor-pointer z-30 transition-all shadow-2xs border border-transparent hover:border-rose-700 active:scale-90"
                              title="Xóa học sinh khỏi máy"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        );
                      })}

                      {assignedStudents.length === 2 && (
                        <div className="text-[10px] font-black text-[#3d2b17] bg-[#dfccb0]/90 px-2 py-0.5 rounded-md border border-[#cbb89d] text-center justify-center tracking-tight truncate mx-auto w-full">
                          {formatStudentNameFirstAndMiddle(assignedStudents[0].name)} + {formatStudentNameFirstAndMiddle(assignedStudents[1].name)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="my-auto py-1.5 text-center justify-center flex items-center text-[#5c4327]/60 font-bold text-[10px] border border-dashed border-[#cbb89d] rounded-lg bg-white/40">
                      Bấm "Xếp chỗ ngồi" để xếp
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
