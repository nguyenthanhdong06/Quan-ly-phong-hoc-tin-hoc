import React, { useState, useEffect, useMemo } from 'react';
import { Student, Computer, SeatingChart, LabInfo, ClassItem } from '../types';
import { 
  Monitor, X, Wrench, AlertTriangle, PenTool, Clipboard, Search, Check, ChevronDown, 
  Maximize, Minimize, Tv, ZoomIn, ZoomOut, Sun, Moon, ArrowLeft, Palette, Sparkles, 
  RotateCcw, Users, Plus, LayoutGrid, CheckCircle2, UserCheck, ShieldCheck, Image as ImageIcon,
  Sliders, Move, ArrowRightLeft, Upload, Link, CheckCheck, RefreshCw, Zap
} from 'lucide-react';
import { extractGoogleDriveFileId, convertGoogleDriveUrl, compressImageFile } from './KnowledgeGardenTab';
import { playButtonClickSound, playVictoryFanfareSound } from '../utils/audioEffects';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState } from '../supabaseClient';

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
    id: 'modern-slate',
    name: 'Modern Slate (Mặc Định)',
    icon: '🖥️',
    bgGradient: 'bg-slate-900/90',
    borderColor: 'border-indigo-500/50 hover:border-indigo-400',
    textColor: 'text-slate-100',
    headerBg: 'bg-indigo-950/80 text-indigo-200 border-indigo-500/30',
    pillBg: 'bg-emerald-500 hover:bg-emerald-600',
    pillText: 'text-slate-950',
    glowShadow: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]'
  },
  {
    id: 'imac-beige',
    name: 'iMac Classic Cream (DeskOS)',
    icon: '🍏',
    bgGradient: 'bg-[#fffbf0]',
    borderColor: 'border-[#cbb89d] hover:border-emerald-500',
    textColor: 'text-slate-900',
    headerBg: 'bg-[#dfccb0] text-slate-800 border-[#cbb89d]',
    pillBg: 'bg-emerald-600 hover:bg-emerald-700',
    pillText: 'text-white',
    glowShadow: 'shadow-md'
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
    id: 'vintage-crt',
    name: 'Vintage CRT Terminal',
    icon: '📟',
    bgGradient: 'bg-zinc-950',
    borderColor: 'border-emerald-500/80 hover:border-emerald-400',
    textColor: 'text-emerald-400 font-mono',
    headerBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60',
    pillBg: 'bg-emerald-400 hover:bg-emerald-300',
    pillText: 'text-zinc-950 font-black',
    glowShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
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
  },
  {
    id: 'deep-space',
    name: 'Deep Space Aurora',
    icon: '🌌',
    bgGradient: 'bg-gradient-to-b from-indigo-950 via-slate-900 to-purple-950',
    borderColor: 'border-purple-500/60 hover:border-pink-400',
    textColor: 'text-purple-100',
    headerBg: 'bg-purple-900/60 text-purple-200 border-purple-400/30',
    pillBg: 'bg-gradient-to-r from-purple-400 to-pink-400',
    pillText: 'text-slate-950 font-black',
    glowShadow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
  }
];

export interface PCFrameConfig {
  skinId: string;
  customImageUrl?: string;
  cardSize: 'sm' | 'md' | 'lg' | 'xl';
  borderRadius: string; // 'rounded-2xl', 'rounded-3xl' etc.
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
  onSelectClass
}: SeatingTabProps) {

  // Selected Lab State (default to Lab 01 P.201)
  const [selectedLabId, setSelectedLabId] = useState<string>(labs[0]?.id || 'lab1');
  const activeLab = useMemo(() => {
    return labs.find(l => l.id === selectedLabId) || labs[0];
  }, [labs, selectedLabId]);

  // Students of current selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClass);
  }, [students, selectedClass]);

  // Seating assignments map for selectedClass: { [computerId]: "std1,std2" }
  const currentClassSeating = useMemo(() => {
    return seatingChart[selectedClass] || {};
  }, [seatingChart, selectedClass]);

  // Helper to parse student IDs assigned to a computer
  const getAssignedStudentIds = (seatingVal?: string): string[] => {
    if (!seatingVal) return [];
    return seatingVal.split(/[,+;]/).map(s => s.trim()).filter(Boolean);
  };

  // List of student IDs currently assigned to ANY PC in this class
  const assignedStudentIdsList = useMemo(() => {
    const assigned = new Set<string>();
    Object.values(currentClassSeating).forEach((val: any) => {
      getAssignedStudentIds(String(val || '')).forEach(id => assigned.add(id));
    });
    return Array.from(assigned);
  }, [currentClassSeating]);

  // List of unassigned students in this class
  const unassignedStudents = useMemo(() => {
    return classStudents.filter(s => !assignedStudentIdsList.includes(s.id));
  }, [classStudents, assignedStudentIdsList]);

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

  // --- PC FRAME CUSTOMIZER CONFIG STATE ---
  const [frameConfig, setFrameConfig] = useState<PCFrameConfig>(() => {
    try {
      const saved = localStorage.getItem('deskos_pc_frame_config_v1');
      return saved ? JSON.parse(saved) : {
        skinId: 'modern-slate',
        cardSize: 'md',
        borderRadius: 'rounded-2xl',
        glowEffect: true
      };
    } catch {
      return {
        skinId: 'modern-slate',
        cardSize: 'md',
        borderRadius: 'rounded-2xl',
        glowEffect: true
      };
    }
  });

  // Active Frame Skin Object
  const activeSkin = useMemo(() => {
    return PRESET_FRAME_SKINS.find(s => s.id === frameConfig.skinId) || PRESET_FRAME_SKINS[0];
  }, [frameConfig.skinId]);

  // Save Frame Config effect
  useEffect(() => {
    try {
      localStorage.setItem('deskos_pc_frame_config_v1', JSON.stringify(frameConfig));
      saveSupabaseState('school_pc_frame_config', frameConfig);
    } catch (e) {}
  }, [frameConfig]);

  // --- INLINE SUB-VIEWS STATES (100% WINDOW TAKEOVER) ---
  const [isClassListSubViewOpen, setIsClassListSubViewOpen] = useState(false);
  const [isFrameConfigSubViewOpen, setIsFrameConfigSubViewOpen] = useState(false);

  // Drag and Drop States
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [draggedSourcePcId, setDraggedSourcePcId] = useState<string | null>(null);
  const [dragOverPcId, setDragOverPcId] = useState<string | null>(null);

  // Card Size Tailwind mappings
  const cardSizeClasses = {
    sm: 'p-2 min-h-[90px]',
    md: 'p-3.5 min-h-[115px]',
    lg: 'p-4 min-h-[135px]',
    xl: 'p-5 min-h-[155px]'
  };

  // --- SEATING ASSIGNMENT MUTATION HANDLERS ---
  const saveSeatingState = (newClassSeating: { [pcId: string]: string }) => {
    const updatedChart: SeatingChart = {
      ...seatingChart,
      [selectedClass]: newClassSeating
    };
    setSeatingChart(updatedChart);
    try {
      localStorage.setItem('school_seating_chart', JSON.stringify(updatedChart));
      saveSupabaseState('school_seating_chart', updatedChart);
    } catch (e) {}
  };

  // Assign a student to a PC (supports pairing up to 2 students per PC!)
  const assignStudentToComputer = (pcId: string, studentId: string) => {
    const currentSeating = { ...currentClassSeating };

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
  };

  // Remove a specific student from a PC
  const unassignStudentFromComputer = (pcId: string, studentId: string) => {
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
  };

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

  // Auto seating algorithm (🪄 Xếp Tự Động)
  const handleAutoSeatClass = () => {
    if (classStudents.length === 0) {
      showToast('Lớp học chưa có học sinh nào!', 'warning');
      return;
    }

    const availablePcs = computers.filter(c => c.status === 'Hoạt động');
    if (availablePcs.length === 0) {
      showToast('Không có máy tính nào khả dụng trong phòng!', 'error');
      return;
    }

    const newSeating: { [pcId: string]: string } = {};
    let pcIndex = 0;

    classStudents.forEach((st, idx) => {
      // 2 students per PC if student count exceeds PC count, otherwise 1 student per PC
      const targetPc = availablePcs[pcIndex % availablePcs.length];
      const pcId = targetPc.id || `M.${targetPc.num < 10 ? '0' + targetPc.num : targetPc.num}`;

      const existing = getAssignedStudentIds(newSeating[pcId]);
      if (existing.length < 2) {
        existing.push(st.id);
        newSeating[pcId] = existing.join(',');
      } else {
        pcIndex++;
        const nextPc = availablePcs[pcIndex % availablePcs.length];
        const nextPcId = nextPc.id || `M.${nextPc.num < 10 ? '0' + nextPc.num : nextPc.num}`;
        newSeating[nextPcId] = [st.id].join(',');
      }
    });

    saveSeatingState(newSeating);
    playVictoryFanfareSound();
    showToast(`🪄 Đã xếp tự động chỗ ngồi máy tính cho toàn bộ ${classStudents.length} học sinh lớp ${selectedClass}!`, 'success');
  };

  // Drag handlers
  const handleStudentDragStart = (e: React.DragEvent, studentId: string, sourcePcId: string | null = null) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ studentId, sourcePcId }));
    setDraggedStudentId(studentId);
    setDraggedSourcePcId(sourcePcId);
  };

  const handlePcDrop = (e: React.DragEvent, targetPcId: string) => {
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
  // 🌟 INLINE SUB-VIEW 1: DANH SÁCH LỚP HỌC (100% FULL WINDOW TAKEOVER)
  // =========================================================================
  if (isClassListSubViewOpen) {
    return (
      <div className="space-y-6 text-slate-800 pb-10">
        {/* Header Header Bar */}
        <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
          <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsClassListSubViewOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#cbb89d] font-black text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" /> Quay Về Sơ Đồ Phòng Máy
              </button>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span>📋</span> DANH SÁCH HỌC SINH LỚP {selectedClass} ({classStudents.length} HS)
                </h3>
                <p className="text-[11px] font-bold text-slate-600">Xem chi tiết trạng thái xếp máy và gán máy nhanh cho từng học sinh</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSeatClass}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> 🪄 Xếp Tự Động Toàn Lớp
              </button>
              <button
                onClick={handleClearAllClassSeating}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> ↺ Xóa Chỗ Ngồi
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Mã MSHS</th>
                  <th className="py-3 px-4">Họ và Tên Học Sinh</th>
                  <th className="py-3 px-4">Tên Rút Gọn (Chữ Lót + Tên)</th>
                  <th className="py-3 px-4">Giới Tính</th>
                  <th className="py-3 px-4">Vị Trí Máy Tính</th>
                  <th className="py-3 px-4 text-center">Thao Tác Nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {classStudents.map((st, idx) => {
                  const assignedPcId = Object.keys(currentClassSeating).find(pcId => 
                    getAssignedStudentIds(currentClassSeating[pcId]).includes(st.id)
                  );
                  const isSeated = Boolean(assignedPcId);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-extrabold">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-800">{st.code}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900">{st.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 font-extrabold text-[11px]">
                          {formatStudentNameFirstAndMiddle(st.name)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{st.gender === 'Nữ' ? '👧 Nữ' : '👦 Nam'}</td>
                      <td className="py-3.5 px-4">
                        {isSeated ? (
                          <span className="bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200 font-black text-[11px] inline-flex items-center gap-1">
                            <Monitor className="w-3.5 h-3.5" /> {assignedPcId}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200 font-bold text-[11px]">
                            Chưa có chỗ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isSeated ? (
                          <button
                            onClick={() => unassignStudentFromComputer(assignedPcId!, st.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-[11px] border border-rose-200 transition-all active:scale-95 cursor-pointer"
                          >
                            Xóa khỏi máy
                          </button>
                        ) : (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                assignStudentToComputer(e.target.value, st.id);
                              }
                            }}
                            defaultValue=""
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 font-black text-[11px] border border-emerald-200 focus:outline-none cursor-pointer"
                          >
                            <option value="" disabled>+ Chọn máy để gán...</option>
                            {computers.filter(c => c.status === 'Hoạt động').map(c => {
                              const pcId = c.id || `M.${c.num < 10 ? '0' + c.num : c.num}`;
                              const count = getAssignedStudentIds(currentClassSeating[pcId]).length;
                              return (
                                <option key={pcId} value={pcId} disabled={count >= 2}>
                                  {pcId} ({count}/2 HS)
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🎨 INLINE SUB-VIEW 2: ĐỔI KHUNG CARD PC (100% FULL WINDOW TAKEOVER)
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-black text-slate-800 focus:outline-none"
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
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs border transition-all ${
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
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-slate-100 space-y-4 shadow-xl sticky top-4">
              <h4 className="font-black text-xs text-indigo-300 uppercase tracking-wider flex items-center gap-2">
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
                {/* Header PC info */}
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono font-black text-xs bg-slate-950/60 px-2.5 py-1 rounded-lg text-indigo-300 border border-indigo-500/30">
                    🖥️ M.01
                  </span>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    2/2 HS
                  </span>
                </div>

                {/* Sample Student Pills */}
                <div className="space-y-1.5">
                  <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 rounded-xl px-3 py-1.5 flex justify-between items-center">
                    <span className="font-black text-xs">Văn An</span>
                    <span className="text-[10px] opacity-70">×</span>
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 rounded-xl px-3 py-1.5 flex justify-between items-center">
                    <span className="font-black text-xs">Thị Bích</span>
                    <span className="text-[10px] opacity-70">×</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-400 text-center leading-relaxed">
                Tất cả {computers.length} ô máy tính trên sơ đồ sẽ tự động áp dụng kiểu khung card đã chọn ở trên!
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
    <div className="space-y-6 pb-12 text-slate-800">
      
      {/* 🌟 1. BANNER HEADER TÍM GRADIENT GIỐNG HÌNH ẢNH ĐÍNH KÈM (MODULE 2: PHÒNG LAB) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2a0845] via-[#4b1248] to-[#1e0538] p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-purple-500/30">
        {/* Glow Ambient Orbs */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Left Text Block */}
          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 rounded-full bg-purple-500/25 border border-purple-400/40 text-[11px] font-black uppercase tracking-wider text-purple-200">
              MODULE 2: PHÒNG LAB (SƠ ĐỒ HỌC SINH MÁY TÍNH)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>🖥️</span> Sơ Đồ Lớp Học & Chỗ Ngồi Máy Tính
            </h2>
            <p className="text-xs sm:text-sm font-medium text-purple-200/90 leading-relaxed max-w-2xl">
              Ghi danh học sinh, ghép 2 học sinh/máy (hiển thị <strong className="text-amber-300">'Văn An + Thị Bích'</strong>) & kéo thả sắp xếp linh hoạt.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            
            {/* Button 1: Danh sách lớp */}
            <button
              onClick={() => setIsClassListSubViewOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>📋</span> Danh Sách Lớp ({classStudents.length} HS)
            </button>

            {/* Button 2: Đổi khung Card PC */}
            <button
              onClick={() => setIsFrameConfigSubViewOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 border border-indigo-400/40 cursor-pointer"
            >
              <span>🎨</span> Đổi Khung Card PC
            </button>

            {/* Button 3: Xếp Tự Động */}
            <button
              onClick={handleAutoSeatClass}
              className="px-4.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>🪄</span> Xếp Tự Động
            </button>

          </div>

        </div>
      </div>

      {/* 🎛️ 2. CONTROL FILTER BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          {/* Lab Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">CHỌN PHÒNG MÁY</label>
            <select
              value={selectedLabId}
              onChange={(e) => setSelectedLabId(e.target.value)}
              className="px-4 py-2 text-xs font-black rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer min-w-[180px]"
            >
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} ({lab.code})
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">TÊN LỚP HỌC</label>
            {classes.length > 0 && onSelectClass ? (
              <select
                value={selectedClass}
                onChange={(e) => onSelectClass(e.target.value)}
                className="px-4 py-2 text-xs font-black rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer min-w-[140px]"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.name}>
                    Lớp {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedClass}
                readOnly
                className="px-4 py-2 text-xs font-black rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 w-[140px]"
              />
            )}
          </div>

        </div>

        {/* Right Info & Clear Button */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          
          <div className="text-xs font-bold">
            <span className="text-slate-500">Chờ xếp chỗ: </span>
            <span className="font-black text-amber-600">{unassignedStudents.length} HS</span>
          </div>

          <button
            onClick={handleClearAllClassSeating}
            className="px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>↺</span> Xóa Chỗ Ngồi
          </button>

        </div>

      </div>

      {/* 🖼️ 3. TWO-COLUMN MAIN CANVAS (LEFT: UNASSIGNED LIST, RIGHT: PC ROOM MAP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: HỌC SINH CHỜ NGỒI ================= */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col max-h-[750px] overflow-hidden">
          
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>👦</span> HỌC SINH CHỜ NGỒI ({unassignedStudents.length})
              </h3>
            </div>
            <p className="text-[11px] font-bold text-slate-400 leading-snug">
              Kéo tên học sinh vào ô máy tính bên phải để xếp chỗ.
            </p>
          </div>

          {/* Search Unassigned Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={unassignedSearch}
              onChange={(e) => setUnassignedSearch(e.target.value)}
              placeholder="Tìm kiếm học sinh..."
              className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Scrollable Students List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[560px]">
            {filteredUnassignedStudents.length > 0 ? (
              filteredUnassignedStudents.map(st => (
                <div
                  key={st.id}
                  draggable={true}
                  onDragStart={(e) => handleStudentDragStart(e, st.id)}
                  className="bg-slate-50 hover:bg-emerald-50/80 p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between cursor-grab active:cursor-grabbing group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl select-none">
                      {st.gender === 'Nữ' ? '👧' : '👦'}
                    </span>
                    <div>
                      <div className="font-black text-xs text-slate-900 group-hover:text-emerald-950">
                        {st.name}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        MSHS: {st.code} • Tên ngắn: <span className="text-emerald-700 font-extrabold">{formatStudentNameFirstAndMiddle(st.name)}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-black bg-slate-200 group-hover:bg-emerald-200 group-hover:text-emerald-900 text-slate-600 px-2 py-1 rounded-lg">
                    Kéo chỗ 🖐️
                  </span>
                </div>
              ))
            ) : unassignedStudents.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <div className="font-black text-xs text-emerald-800">Tất cả học sinh đã có máy!</div>
                <p className="text-[11px] font-bold text-slate-400 max-w-[200px] mx-auto">
                  Toàn bộ {classStudents.length} học sinh lớp {selectedClass} đã được xếp vị trí chỗ ngồi máy tính thành công.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 font-bold text-xs">
                Không tìm thấy học sinh nào khớp với từ khóa "{unassignedSearch}"
              </div>
            )}
          </div>

        </div>

        {/* ================= RIGHT COLUMN: SƠ ĐỒ PHÒNG MÁY TÍNH (DARK CANVAS) ================= */}
        <div className="lg:col-span-8 bg-[#0b1120] rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-2xl space-y-6 overflow-hidden">
          
          {/* Top Teacher Board Banner */}
          <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl py-3 px-4 border border-indigo-500/30 text-center shadow-inner">
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center justify-center gap-2">
              👨‍🏫 MÀN CHIẾU & BẢNG GIÁO VIÊN ({activeLab.name} - {activeLab.code})
            </span>
          </div>

          {/* PC Seating Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {computers.map(c => {
              const pcId = c.id || `M.${c.num < 10 ? '0' + c.num : c.num}`;
              const assignedIds = getAssignedStudentIds(currentClassSeating[pcId]);
              const assignedStudents = assignedIds.map(id => students.find(s => s.id === id)).filter(Boolean) as Student[];

              const isFull = assignedStudents.length >= 2;
              const isDragOver = dragOverPcId === pcId;

              return (
                <div
                  key={pcId}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverPcId(pcId);
                  }}
                  onDragLeave={() => setDragOverPcId(null)}
                  onDrop={(e) => handlePcDrop(e, pcId)}
                  className={`rounded-2xl border-2 transition-all relative flex flex-col justify-between ${cardSizeClasses[frameConfig.cardSize]} ${
                    isDragOver ? 'border-amber-400 scale-105 bg-amber-950/40 ring-4 ring-amber-400/40 z-20' : ''
                  } ${
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
                  {/* PC Header Bar */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-black text-xs bg-slate-950/70 px-2.5 py-0.5 rounded-lg text-indigo-300 border border-indigo-500/30">
                      🖥️ {pcId}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      isFull 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                        : assignedStudents.length > 0 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {assignedStudents.length}/2 HS
                    </span>
                  </div>

                  {/* Student Seating Slot Content */}
                  {assignedStudents.length > 0 ? (
                    <div className="space-y-1.5 my-auto">
                      {assignedStudents.map(st => (
                        <div
                          key={st.id}
                          draggable={true}
                          onDragStart={(e) => handleStudentDragStart(e, st.id, pcId)}
                          className="bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 rounded-xl px-2.5 py-1 flex items-center justify-between transition-all cursor-grab active:cursor-grabbing group shadow-xs"
                        >
                          <span className="font-black text-xs truncate max-w-[110px]" title={st.name}>
                            {formatStudentNameFirstAndMiddle(st.name)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unassignStudentFromComputer(pcId, st.id);
                            }}
                            className="text-emerald-400 hover:text-rose-400 p-0.5 rounded-full hover:bg-slate-900/50 transition-colors cursor-pointer"
                            title="Xóa học sinh khỏi máy"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Display formatted concatenated string e.g. "Văn An + Thị Bích" when 2 students seated */}
                      {assignedStudents.length === 2 && (
                        <div className="text-[9px] font-black text-amber-300 text-center tracking-tight truncate pt-0.5 opacity-90">
                          {formatStudentNameFirstAndMiddle(assignedStudents[0].name)} + {formatStudentNameFirstAndMiddle(assignedStudents[1].name)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="my-auto py-2 text-center text-slate-500 font-bold text-[11px] border border-dashed border-slate-700/60 rounded-xl bg-slate-950/40">
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
  );
}
