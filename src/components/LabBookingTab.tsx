import React, { useState, useMemo } from 'react';
import { LabInfo, LabBooking, LabIncident, LabMaintenanceLog, Member, ClassItem, Computer } from '../types';
import { 
  CalendarDays, FilePenLine, AlertTriangle, Sliders, Plus, Trash2, CheckCircle2, 
  Monitor, Cpu, Search, User, Check, X, 
  Building, RefreshCw, AlertOctagon, Info, BookMarked, Wrench, RotateCw, Microchip, HardDrive, Tag,
  Edit, Grid, Database, Copy, CheckCheck, Rows, Columns, Hash, Move, MousePointer, Pencil, ShieldCheck, Sparkles
} from 'lucide-react';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState } from '../supabaseClient';

interface LabBookingTabProps {
  members: Member[];
  classes: ClassItem[];
  computers: Computer[];
  currentUser: any;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  bookings: LabBooking[];
  setBookings: React.Dispatch<React.SetStateAction<LabBooking[]>>;
  incidents: LabIncident[];
  setIncidents: React.Dispatch<React.SetStateAction<LabIncident[]>>;
  maintenanceLogs: LabMaintenanceLog[];
  setMaintenanceLogs: React.Dispatch<React.SetStateAction<LabMaintenanceLog[]>>;
  labs: LabInfo[];
  setLabs: React.Dispatch<React.SetStateAction<LabInfo[]>>;
}

// Date formatting helper enforcing strict DD-MM-YYYY format
export const formatDateDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return dateStr;
};

export const getTodayDDMMYYYY = (): string => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// Hàm khởi tạo ma trận sơ đồ phòng lab mặc định (Rows x Cols) với nhãn M.01, M.02...
export const generateDefaultLabLayout = (rows: number = 6, cols: number = 6) => {
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

// Lưới khung tiết học tiểu học (35 phút/tiết, giải lao 20 phút sau tiết 2)
export const TIME_SLOTS = [
  { id: 's1', name: 'Sáng 1', period: 'Sáng', time: '07:00 - 07:35', isBreak: false },
  { id: 's2', name: 'Sáng 2', period: 'Sáng', time: '07:40 - 08:15', isBreak: false },
  { id: 'break_am', name: 'Giờ Ra Chơi', period: 'Sáng', time: '08:15 - 08:35', isBreak: true, label: '☕ GIỜ RA CHƠI (GIẢI LAO PHÒNG MÁY)' },
  { id: 's3', name: 'Sáng 3', period: 'Sáng', time: '08:35 - 09:10', isBreak: false },
  { id: 's4', name: 'Sáng 4', period: 'Sáng', time: '09:15 - 09:50', isBreak: false },
  { id: 'break_noon', name: 'Nghỉ Trưa', period: 'Trưa', time: '09:50 - 14:00', isBreak: true, label: '🌙 NGHỈ TRƯA & CHUẨN BỊ BUỔI CHIỀU' },
  { id: 'c5', name: 'Chiều 5', period: 'Chiều', time: '14:00 - 14:35', isBreak: false },
  { id: 'c6', name: 'Chiều 6', period: 'Chiều', time: '14:40 - 15:15', isBreak: false },
  { id: 'c7', name: 'Chiều 7', period: 'Chiều', time: '15:20 - 15:55', isBreak: false },
];

export const DAYS_OF_WEEK = [
  { id: 1, name: 'Thứ Hai', short: 'T2' },
  { id: 2, name: 'Thứ Ba', short: 'T3' },
  { id: 3, name: 'Thứ Tư', short: 'T4' },
  { id: 4, name: 'Thứ Năm', short: 'T5' },
  { id: 5, name: 'Thứ Sáu', short: 'T6' },
  { id: 6, name: 'Thứ Bảy', short: 'T7' },
];

export default function LabBookingTab({
  members,
  classes,
  computers,
  currentUser,
  showToast,
  bookings,
  setBookings,
  incidents,
  setIncidents,
  maintenanceLogs,
  setMaintenanceLogs,
  labs,
  setLabs
}: LabBookingTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'booking' | 'incident' | 'log' | 'admin'>('calendar');
  const [selectedLab, setSelectedLab] = useState<string>(labs[0] ? labs[0].id : 'lab1');

  // Form states for Module 2: Booking Form
  const [teacherNameInput, setTeacherNameInput] = useState<string>(currentUser?.name || (members[0] ? members[0].name : ''));
  const [classNameInput, setClassNameInput] = useState<string>(classes[0] ? classes[0].name : 'Ba 1');
  const [studentCountInput, setStudentCountInput] = useState<number>(35);
  const [subjectInput, setSubjectInput] = useState<string>('Tin học - Bài thực hành gõ phím & Scratch');
  const [formLabId, setFormLabId] = useState<string>(labs[0] ? labs[0].id : 'lab1');
  const [formDayIndex, setFormDayIndex] = useState<number>(1);
  const [formSlotId, setFormSlotId] = useState<string>('s1');

  // Popup Modal for Conflict Warning
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);

  // Form states for Module 3: Incident Report
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<number | null>(null);
  const [incidentReporter, setIncidentReporter] = useState<string>(currentUser?.name || '');
  const [incidentType, setIncidentType] = useState<'Hardware' | 'Software' | 'Network' | 'Other'>('Hardware');
  const [incidentPriority, setIncidentPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [incidentIssue, setIncidentIssue] = useState<string>('');

  // Form states for Module 4: Maintenance Log
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState<boolean>(false);
  const [logFilterType, setLogFilterType] = useState<string>('All');
  const [logFilterPC, setLogFilterPC] = useState<string>('All');
  const [logSearchTerm, setLogSearchTerm] = useState<string>('');
  
  const [logTargetType, setLogTargetType] = useState<'pc' | 'lab'>('pc');
  const [logPcNumber, setLogPcNumber] = useState<number>(1);
  const [logType, setLogType] = useState<'Repair' | 'Replacement' | 'Upgrade' | 'Maintenance' | 'Software' | 'Other'>('Repair');
  const [logTitle, setLogTitle] = useState<string>('');
  const [logDescription, setLogDescription] = useState<string>('');
  const [logTechnician, setLogTechnician] = useState<string>(currentUser?.name || 'Cán bộ tin học');
  const [logCost, setLogCost] = useState<number>(0);
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Admin filter search term
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');

  // States for LAB EDITOR MODAL & LAB MATRIX CUSTOMIZER (TRÌNH THIẾT KẾ SƠ ĐỒ PHÒNG LAB MẪU)
  const [isLabEditorModalOpen, setIsLabEditorModalOpen] = useState<boolean>(false);
  const [editingLab, setEditingLab] = useState<LabInfo | null>(null);
  const [labFormName, setLabFormName] = useState<string>('');
  const [labFormCode, setLabFormCode] = useState<string>('');
  const [labFormLocation, setLabFormLocation] = useState<string>('');
  const [labFormStatus, setLabFormStatus] = useState<'Active' | 'Maintenance'>('Active');
  const [labFormTotalPCs, setLabFormTotalPCs] = useState<number>(36);
  const [labFormRows, setLabFormRows] = useState<number>(6);
  const [labFormCols, setLabFormCols] = useState<number>(6);
  const [labFormLayout, setLabFormLayout] = useState<Record<string, { type: 'pc' | 'aisle' | 'desk'; label?: string; pcNumber?: number }>>({});
  const [activeEditorTool, setActiveEditorTool] = useState<'aisle' | 'drag' | 'desk' | 'rename'>('aisle');
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [paintTargetType, setPaintTargetType] = useState<'pc' | 'aisle' | null>(null);
  const [selectedSwapKey, setSelectedSwapKey] = useState<string | null>(null);

  // Supabase SQL Config Modal
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Transition from Calendar Cell click to Booking Form
  const handleCellClickToBook = (dayIndex: number, slotId: string) => {
    setFormLabId(selectedLab);
    setFormDayIndex(dayIndex);
    setFormSlotId(slotId);
    setActiveSubTab('booking');
  };

  // Real-time Conflict Detection
  const conflictBooking = useMemo(() => {
    return bookings.find(b => 
      b.labId === formLabId &&
      Number(b.dayIndex) === Number(formDayIndex) &&
      b.slotId === formSlotId &&
      b.status !== 'Rejected'
    );
  }, [bookings, formLabId, formDayIndex, formSlotId]);

  // Submit Handler for Booking
  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (conflictBooking) {
      setIsConflictModalOpen(true);
      return;
    }

    if (!teacherNameInput.trim() || !classNameInput.trim() || !subjectInput.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin tên giáo viên, lớp và môn học!', 'error');
      return;
    }

    const newBooking: LabBooking = {
      id: `bk_${Date.now()}`,
      labId: formLabId,
      dayIndex: Number(formDayIndex),
      slotId: formSlotId,
      teacherName: teacherNameInput.trim(),
      className: classNameInput.trim(),
      studentCount: Number(studentCountInput) || 35,
      subject: subjectInput.trim(),
      date: getTodayDDMMYYYY(),
      status: 'Approved'
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    safeSetLocalStorage('school_lab_bookings', updated);
    await saveSupabaseState('school_lab_bookings', updated);

    showToast(`Đã tạo phiếu đăng ký phòng máy cho lớp ${newBooking.className} thành công!`, 'success');
    setActiveSubTab('calendar');
  };

  // Update & Delete Handlers for Bookings
  const handleUpdateBookingStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    setBookings(updated);
    safeSetLocalStorage('school_lab_bookings', updated);
    await saveSupabaseState('school_lab_bookings', updated);
    showToast(`Đã cập nhật trạng thái phiếu đăng ký: ${status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}!`, 'success');
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Thầy/Cô có chắc chắn muốn xóa phiếu đăng ký mượn phòng máy này không?')) {
      const updated = bookings.filter(b => b.id !== id);
      setBookings(updated);
      safeSetLocalStorage('school_lab_bookings', updated);
      await saveSupabaseState('school_lab_bookings', updated);
      showToast('Đã xóa phiếu đăng ký mượn phòng máy!', 'success');
    }
  };

  // Submit Handler for Incident Report
  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeatNumber) {
      showToast('Vui lòng nhấp chọn số máy tính bị hỏng trên sơ đồ!', 'error');
      return;
    }
    if (!incidentIssue.trim()) {
      showToast('Vui lòng mô tả chi tiết sự cố gặp phải!', 'error');
      return;
    }

    const newIncident: LabIncident = {
      id: `inc_${Date.now()}`,
      labId: selectedLab,
      pcNumber: selectedSeatNumber,
      reporter: incidentReporter.trim() || currentUser?.name || 'Giáo viên bộ môn',
      type: incidentType,
      issue: incidentIssue.trim(),
      priority: incidentPriority,
      date: getTodayDDMMYYYY(),
      status: 'Pending'
    };

    const updated = [newIncident, ...incidents];
    setIncidents(updated);
    safeSetLocalStorage('school_lab_incidents', updated);
    await saveSupabaseState('school_lab_incidents', updated);

    showToast(`Đã gửi báo cáo sự cố Máy #${selectedSeatNumber} thành công!`, 'success');
    setSelectedSeatNumber(null);
    setIncidentIssue('');
  };

  const handleUpdateIncidentStatus = async (id: string, status: 'Pending' | 'In Progress' | 'Resolved') => {
    const updated = incidents.map(i => i.id === id ? { ...i, status } : i);
    setIncidents(updated);
    safeSetLocalStorage('school_lab_incidents', updated);
    await saveSupabaseState('school_lab_incidents', updated);
    showToast(`Đã cập nhật trạng thái xử lý sự cố: ${status === 'Resolved' ? 'Đã khắc phục xong' : status === 'In Progress' ? 'Đang kỹ thuật sửa' : 'Chờ xử lý'}!`, 'success');
  };

  const handleDeleteIncident = async (id: string) => {
    if (window.confirm('Xác nhận xóa phiếu báo cáo sự cố máy tính này?')) {
      const updated = incidents.filter(i => i.id !== id);
      setIncidents(updated);
      safeSetLocalStorage('school_lab_incidents', updated);
      await saveSupabaseState('school_lab_incidents', updated);
      showToast('Đã xóa phiếu báo cáo sự cố!', 'success');
    }
  };

  // Submit Handler for Maintenance Logs
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề hạng mục bảo trì/sửa chữa!', 'error');
      return;
    }

    const pcNum = logTargetType === 'pc' ? Number(logPcNumber) : null;
    const pcLbl = logTargetType === 'pc' ? `Máy #${pcNum}` : 'Toàn phòng';

    const newLog: LabMaintenanceLog = {
      id: `log_${Date.now()}`,
      labId: selectedLab,
      pcNumber: pcNum,
      pcLabel: pcLbl,
      type: logType,
      title: logTitle.trim(),
      description: logDescription.trim(),
      technician: logTechnician.trim() || currentUser?.name || 'Cán bộ tin học',
      cost: Number(logCost) || 0,
      date: formatDateDDMMYYYY(logDate)
    };

    const updated = [newLog, ...maintenanceLogs];
    setMaintenanceLogs(updated);
    safeSetLocalStorage('school_lab_maintenance_logs', updated);
    await saveSupabaseState('school_lab_maintenance_logs', updated);

    showToast('Đã ghi thành công nhật ký bảo trì/thay thế linh kiện mới!', 'success');
    setIsAddLogModalOpen(false);
    setLogTitle('');
    setLogDescription('');
    setLogCost(0);
  };

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Xác nhận xóa dòng nhật ký bảo trì thiết bị này?')) {
      const updated = maintenanceLogs.filter(m => m.id !== id);
      setMaintenanceLogs(updated);
      safeSetLocalStorage('school_lab_maintenance_logs', updated);
      await saveSupabaseState('school_lab_maintenance_logs', updated);
      showToast('Đã xóa dòng nhật ký bảo trì thành công!', 'success');
    }
  };

  // LAB EDITOR MODAL HANDLERS (+ THÊM PHÒNG MỚI & SỬA SƠ ĐỒ PHÒNG LAB MA TRẬN)
  const handleOpenAddLabModal = () => {
    const defaultRows = 6;
    const defaultCols = 6;
    const initialLayout = generateDefaultLabLayout(defaultRows, defaultCols);

    let pcCount = 0;
    Object.values(initialLayout).forEach((t: any) => { if (t && t.type === 'pc') pcCount++; });

    setEditingLab(null);
    setLabFormName(`Phòng Lab 0${labs.length + 1}`);
    setLabFormCode(`P.${200 + labs.length + 1}`);
    setLabFormLocation('Tầng 2 - Nhà A');
    setLabFormStatus('Active');
    setLabFormRows(defaultRows);
    setLabFormCols(defaultCols);
    setLabFormTotalPCs(pcCount);
    setLabFormLayout(initialLayout);
    setActiveEditorTool('aisle');
    setSelectedSwapKey(null);
    setIsLabEditorModalOpen(true);
  };

  const handleOpenEditLabModal = (lab: LabInfo) => {
    const rows = lab.gridRows || 6;
    const cols = lab.gridCols || 6;
    const layout = (lab.customLayout && Object.keys(lab.customLayout).length > 0)
      ? lab.customLayout
      : generateDefaultLabLayout(rows, cols);

    setEditingLab(lab);
    setLabFormName(lab.name);
    setLabFormCode(lab.code);
    setLabFormLocation(lab.location);
    setLabFormStatus(lab.status || 'Active');
    setLabFormRows(rows);
    setLabFormCols(cols);
    setLabFormTotalPCs(lab.totalPCs);
    setLabFormLayout(layout);
    setActiveEditorTool('aisle');
    setSelectedSwapKey(null);
    setIsLabEditorModalOpen(true);
  };

  const handleDeleteLab = async (labId: string) => {
    if (window.confirm('Thầy/Cô có chắc chắn muốn xóa phòng lab này không?')) {
      const updated = labs.filter(l => l.id !== labId);
      setLabs(updated);
      safeSetLocalStorage('school_labs', updated);
      await saveSupabaseState('school_labs', updated);
      showToast('Đã xóa phòng lab!', 'success');
    }
  };

  // Đánh lại số thứ tự và nhãn máy liên tục (M.01, M.02...)
  const recalculatePcLabels = (rows: number, cols: number, layoutObj: Record<string, any>) => {
    let counter = 1;
    const newLayout: Record<string, any> = {};

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r}_${c}`;
        const tile = layoutObj[key] || { type: 'pc' };
        if (tile.type === 'pc') {
          const pcNumStr = counter < 10 ? `0${counter}` : `${counter}`;
          newLayout[key] = {
            ...tile,
            pcNumber: counter,
            label: tile.label && tile.label.startsWith('M.') ? tile.label : `M.${pcNumStr}`
          };
          counter++;
        } else {
          newLayout[key] = tile;
        }
      }
    }
    setLabFormLayout(newLayout);
    setLabFormTotalPCs(counter - 1);
  };

  // Khôi phục đủ 36 máy (hoặc rows x cols máy)
  const handleRestoreFullPcs = () => {
    const layout = generateDefaultLabLayout(labFormRows, labFormCols);
    let pcCount = 0;
    Object.values(layout).forEach((t: any) => { if (t && t.type === 'pc') pcCount++; });
    setLabFormLayout(layout);
    setLabFormTotalPCs(pcCount);
    showToast(`Đã khôi phục lại đủ ${pcCount} máy tính cho phòng lab!`, 'success');
  };

  // CHÈN / XÓA CỘT & HÀNG TRỰC TIẾP TẠI BẤT KỲ VỊ TRÍ NÀO TRÊN MA TRẬN
  const handleInsertColumnAt = (colIdx: number) => {
    const newCols = labFormCols + 1;
    const newLayout: Record<string, any> = {};

    for (let r = 0; r < labFormRows; r++) {
      for (let c = 0; c < newCols; c++) {
        const newKey = `${r}_${c}`;
        if (c < colIdx) {
          newLayout[newKey] = labFormLayout[`${r}_${c}`] || { type: 'pc' };
        } else if (c === colIdx) {
          newLayout[newKey] = { type: 'pc' };
        } else {
          newLayout[newKey] = labFormLayout[`${r}_${c - 1}`] || { type: 'pc' };
        }
      }
    }

    setLabFormCols(newCols);
    recalculatePcLabels(labFormRows, newCols, newLayout);
    showToast(`Đã chèn thêm 1 Cột tại vị trí Cột ${colIdx + 1}!`, 'success');
  };

  const handleDeleteColumnAt = (colIdx: number) => {
    if (labFormCols <= 1) {
      showToast('Phòng máy phải có ít nhất 1 Cột!', 'warning');
      return;
    }
    const newCols = labFormCols - 1;
    const newLayout: Record<string, any> = {};

    for (let r = 0; r < labFormRows; r++) {
      let destC = 0;
      for (let c = 0; c < labFormCols; c++) {
        if (c !== colIdx) {
          const newKey = `${r}_${destC}`;
          newLayout[newKey] = labFormLayout[`${r}_${c}`] || { type: 'pc' };
          destC++;
        }
      }
    }

    setLabFormCols(newCols);
    recalculatePcLabels(labFormRows, newCols, newLayout);
    showToast(`Đã xóa Cột ${colIdx + 1}!`, 'info');
  };

  const handleInsertRowAt = (rowIdx: number) => {
    const newRows = labFormRows + 1;
    const newLayout: Record<string, any> = {};

    for (let r = 0; r < newRows; r++) {
      for (let c = 0; c < labFormCols; c++) {
        const newKey = `${r}_${c}`;
        if (r < rowIdx) {
          newLayout[newKey] = labFormLayout[`${r}_${c}`] || { type: 'pc' };
        } else if (r === rowIdx) {
          newLayout[newKey] = { type: 'pc' };
        } else {
          newLayout[newKey] = labFormLayout[`${r - 1}_${c}`] || { type: 'pc' };
        }
      }
    }

    setLabFormRows(newRows);
    recalculatePcLabels(newRows, labFormCols, newLayout);
    showToast(`Đã chèn 1 Hàng tại vị trí Hàng ${rowIdx + 1}!`, 'success');
  };

  const handleDeleteRowAt = (rowIdx: number) => {
    if (labFormRows <= 1) {
      showToast('Phòng máy phải có ít nhất 1 Hàng!', 'warning');
      return;
    }
    const newRows = labFormRows - 1;
    const newLayout: Record<string, any> = {};

    let destR = 0;
    for (let r = 0; r < labFormRows; r++) {
      if (r !== rowIdx) {
        for (let c = 0; c < labFormCols; c++) {
          const newKey = `${destR}_${c}`;
          newLayout[newKey] = labFormLayout[`${r}_${c}`] || { type: 'pc' };
        }
        destR++;
      }
    }

    setLabFormRows(newRows);
    recalculatePcLabels(newRows, labFormCols, newLayout);
    showToast(`Đã xóa Hàng ${rowIdx + 1}!`, 'info');
  };

  // Thay đổi số hàng/cột từ dropdown select
  const handleSelectRowsChange = (newRows: number) => {
    setLabFormRows(newRows);
    const newLayout: Record<string, any> = {};
    for (let r = 0; r < newRows; r++) {
      for (let c = 0; c < labFormCols; c++) {
        const key = `${r}_${c}`;
        newLayout[key] = labFormLayout[key] || { type: 'pc' };
      }
    }
    recalculatePcLabels(newRows, labFormCols, newLayout);
  };

  const handleSelectColsChange = (newCols: number) => {
    setLabFormCols(newCols);
    const newLayout: Record<string, any> = {};
    for (let r = 0; r < labFormRows; r++) {
      for (let c = 0; c < newCols; c++) {
        const key = `${r}_${c}`;
        newLayout[key] = labFormLayout[key] || { type: 'pc' };
      }
    }
    recalculatePcLabels(labFormRows, newCols, newLayout);
  };

  const handleSaveLabLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labFormName.trim() || !labFormCode.trim()) {
      showToast('Vui lòng nhập đầy đủ tên phòng lab và mã phòng!', 'error');
      return;
    }

    let pcCounter = 0;
    Object.values(labFormLayout).forEach((tile: any) => {
      if (tile && tile.type === 'pc') pcCounter++;
    });
    const calculatedTotalPCs = pcCounter > 0 ? pcCounter : Number(labFormTotalPCs);

    if (editingLab) {
      const updated = labs.map(l => l.id === editingLab.id ? {
        ...l,
        name: labFormName.trim(),
        code: labFormCode.trim(),
        location: labFormLocation.trim(),
        status: labFormStatus,
        totalPCs: calculatedTotalPCs,
        gridRows: labFormRows,
        gridCols: labFormCols,
        customLayout: labFormLayout
      } : l);
      setLabs(updated);
      safeSetLocalStorage('school_labs', updated);
      await saveSupabaseState('school_labs', updated);
      showToast(`Đã cập nhật sơ đồ ma trận phòng ${labFormName}!`, 'success');
    } else {
      const newLab: LabInfo = {
        id: `lab_${Date.now()}`,
        name: labFormName.trim(),
        code: labFormCode.trim(),
        location: labFormLocation.trim(),
        status: labFormStatus,
        totalPCs: calculatedTotalPCs,
        gridRows: labFormRows,
        gridCols: labFormCols,
        customLayout: labFormLayout
      };
      const updated = [...labs, newLab];
      setLabs(updated);
      safeSetLocalStorage('school_labs', updated);
      await saveSupabaseState('school_labs', updated);
      showToast(`Đã thêm phòng lab mới: ${newLab.name}!`, 'success');
    }

    setIsLabEditorModalOpen(false);
  };

  // Xử lý Rê Chuột (Drag Mouse) vẽ lối đi & Kéo Thả Ô Hoán Đổi Vị Trí
  const handleTileMouseDown = (r: number, c: number) => {
    setIsMouseDown(true);
    const key = `${r}_${c}`;
    const currentTile = labFormLayout[key] || { type: 'pc' };

    if (activeEditorTool === 'aisle') {
      const nextType = currentTile.type === 'aisle' ? 'pc' : 'aisle';
      setPaintTargetType(nextType);
      toggleAisleTile(r, c, nextType);
      return;
    }

    if (activeEditorTool === 'drag') {
      if (!selectedSwapKey) {
        setSelectedSwapKey(key);
        showToast(`Đã chọn ${currentTile.label || 'Ô 1'}. Hãy nhấp tiếp vào ô thứ 2 để hoán đổi!`, 'info');
      } else if (selectedSwapKey === key) {
        setSelectedSwapKey(null);
      } else {
        swapTwoTiles(selectedSwapKey, key);
        setSelectedSwapKey(null);
      }
      return;
    }

    handleGridCellClick(r, c);
  };

  const handleTileMouseEnter = (r: number, c: number) => {
    if (isMouseDown && activeEditorTool === 'aisle' && paintTargetType) {
      toggleAisleTile(r, c, paintTargetType);
    }
  };

  const toggleAisleTile = (r: number, c: number, targetType: 'pc' | 'aisle') => {
    const key = `${r}_${c}`;
    const currentTile = labFormLayout[key] || { type: 'pc' };
    if (currentTile.type === targetType) return;

    const newLayout = {
      ...labFormLayout,
      [key]: { ...currentTile, type: targetType }
    };
    setLabFormLayout(newLayout);
    recalculatePcLabels(labFormRows, labFormCols, newLayout);
  };

  const swapTwoTiles = (key1: string, key2: string) => {
    if (!key1 || !key2 || key1 === key2) return;
    const tile1 = labFormLayout[key1] || { type: 'pc' };
    const tile2 = labFormLayout[key2] || { type: 'pc' };

    const newLayout = {
      ...labFormLayout,
      [key1]: tile2,
      [key2]: tile1
    };
    setLabFormLayout(newLayout);
    recalculatePcLabels(labFormRows, labFormCols, newLayout);
    showToast(`Đã hoán đổi vị trí (${tile1.label || 'Ô 1'}) ⇄ (${tile2.label || 'Ô 2'})!`, 'success');
  };

  const handleTileDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key);
    setSelectedSwapKey(key);
  };

  const handleTileDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData('text/plain') || selectedSwapKey;
    if (sourceKey && sourceKey !== targetKey) {
      swapTwoTiles(sourceKey, targetKey);
    }
    setSelectedSwapKey(null);
  };

  const handleGridCellClick = (r: number, c: number) => {
    const key = `${r}_${c}`;
    const currentTile = labFormLayout[key] || { type: 'pc' };

    if (activeEditorTool === 'rename') {
      const newLabel = window.prompt('Nhập nhãn tên máy mới (ví dụ: M.01, M.02, PC-VIP...):', currentTile.label || '');
      if (newLabel !== null) {
        setLabFormLayout(prev => ({
          ...prev,
          [key]: { ...currentTile, type: 'pc', label: newLabel.trim() || currentTile.label }
        }));
        showToast('Đã đổi tên nhãn máy tính!', 'success');
      }
      return;
    }

    if (activeEditorTool === 'desk') {
      setLabFormLayout(prev => ({
        ...prev,
        [key]: currentTile.type === 'desk' ? { type: 'pc' } : { type: 'desk', label: 'Bàn GV' }
      }));
      return;
    }

    if (activeEditorTool === 'aisle') {
      const nextType = currentTile.type === 'aisle' ? 'pc' : 'aisle';
      toggleAisleTile(r, c, nextType);
      return;
    }
  };

  // Filtered Lists
  const filteredLogs = useMemo(() => {
    return maintenanceLogs.filter(log => {
      if (log.labId !== selectedLab) return false;
      if (logFilterType !== 'All' && log.type !== logFilterType) return false;
      if (logFilterPC === 'lab' && log.pcNumber !== null) return false;
      if (logFilterPC !== 'All' && logFilterPC !== 'lab' && Number(log.pcNumber) !== Number(logFilterPC)) return false;

      if (logSearchTerm.trim() !== '') {
        const term = logSearchTerm.toLowerCase();
        return (
          log.title.toLowerCase().includes(term) ||
          log.description.toLowerCase().includes(term) ||
          log.technician.toLowerCase().includes(term) ||
          (log.pcLabel && log.pcLabel.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [maintenanceLogs, selectedLab, logFilterType, logFilterPC, logSearchTerm]);

  const totalSpent = useMemo(() => {
    return filteredLogs.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
  }, [filteredLogs]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      b.teacherName.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      b.className.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      b.subject.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      b.labId.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );
  }, [bookings, adminSearchTerm]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => 
      i.reporter.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      i.issue.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      i.labId.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      String(i.pcNumber).includes(adminSearchTerm)
    );
  }, [incidents, adminSearchTerm]);

  const currentLabObj = labs.find(l => l.id === selectedLab) || labs[0] || {
    id: 'lab1', name: 'Phòng Lab 01', code: 'P.201', totalPCs: 36, status: 'Active', location: 'Tầng 2 - Nhà A'
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-slate-800 pb-10 animate-fadeIn">
      
      {/* 🌟 1. DESKOS IMAC WARM BEIGE CARD HEADER STRIP */}
      <div className="border-2 border-[#cbb89d] rounded-3xl bg-[#fffbf0] overflow-hidden shadow-sm">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2.5 text-left">
            <span className="font-extrabold text-xs text-[#5c4327]">Đang quản lý:</span>
            <span className="font-black text-xs text-indigo-900 bg-white px-3 py-1 rounded-xl border border-[#cbb89d] shadow-2xs">
              🏢 {currentLabObj.name} ({currentLabObj.code})
            </span>
          </div>

          {/* Navigation Subtab Buttons Group (FE Vườn Tri Thức) */}
          <nav className="flex items-center gap-1.5 bg-[#e4d3ba] p-1.5 rounded-2xl border border-[#cbb89d] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveSubTab('calendar')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'calendar'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>1. Lịch Mượn</span>
            </button>

            <button
              onClick={() => setActiveSubTab('booking')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'booking'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <FilePenLine className="w-4 h-4" />
              <span>2. Đăng Ký</span>
            </button>

            <button
              onClick={() => setActiveSubTab('incident')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'incident'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>3. Báo Sự Cố</span>
            </button>

            <button
              onClick={() => setActiveSubTab('log')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'log'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <BookMarked className="w-4 h-4 text-teal-300" />
              <span>4. Nhật Ký Bảo Trì</span>
            </button>

            <button
              onClick={() => setActiveSubTab('admin')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Duyệt & Quản Lý</span>
            </button>
          </nav>
        </div>
      </div>

      {/* ====================================================================
          MODULE 1: LỊCH ĐĂNG KÝ PHÒNG MÁY (CALENDAR MATRIX VIEW)
          ==================================================================== */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-6 animate-fadeIn">
          {/* LAB SELECTOR CARDS - WARM BEIGE STYLE */}
          <div className="bg-[#fffbf0] p-5 sm:p-6 rounded-3xl shadow-sm border border-[#cbb89d] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-700" />
                <span>Danh Sách Phòng Máy Tin Học Nhà Trường</span>
              </h3>
              <span className="text-xs font-bold text-slate-600">Bấm chọn phòng để xem lịch:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {labs.map(lab => {
                const isSelected = selectedLab === lab.id;
                const activeIssueCount = incidents.filter(i => i.labId === lab.id && i.status !== 'Resolved').length;
                return (
                  <div
                    key={lab.id}
                    onClick={() => setSelectedLab(lab.id)}
                    className={`cursor-pointer p-4.5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-700 bg-indigo-50/90 shadow-md ring-2 ring-indigo-500/30'
                        : 'border-[#cbb89d]/70 hover:border-indigo-400 bg-white hover:bg-[#fffbf0] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${
                        isSelected ? 'bg-indigo-700 text-white shadow-md' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        <Monitor className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-black text-slate-900 flex items-center gap-2">
                          <span>{lab.name}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            {lab.code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold mt-0.5">
                          {lab.totalPCs} máy • {lab.location}
                        </div>
                      </div>
                    </div>

                    {activeIssueCount > 0 ? (
                      <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {activeIssueCount} lỗi
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Tốt
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CALENDAR MATRIX TABLE - WARM BEIGE HEADER */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#cbb89d] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#cbb89d] flex justify-between items-center bg-[#dfccb0]/40">
              <h3 className="text-sm font-black text-[#3d2b17] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-700" />
                <span>Thời Khóa Biểu Sử Dụng - {currentLabObj.name} ({currentLabObj.code})</span>
              </h3>
              <button
                onClick={() => setActiveSubTab('booking')}
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Phiếu Đăng Ký Mượn</span>
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full border-collapse text-left text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-[#dfccb0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-4 w-44 border-r border-[#cbb89d] whitespace-nowrap">Tiết Học & Thời Gian</th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day.id} className="py-3.5 px-4 text-center border-r border-[#cbb89d] whitespace-nowrap">
                        <span className="block text-[#3d2b17] font-black">{day.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {TIME_SLOTS.map(slot => {
                    if (slot.isBreak) {
                      return (
                        <tr key={slot.id} className="bg-indigo-50/80 text-center font-extrabold text-xs border-y border-indigo-200">
                          <td className="p-3 bg-indigo-100/70 text-indigo-950 border-r border-indigo-200 font-mono text-[11px]">
                            {slot.time}
                          </td>
                          <td colSpan={DAYS_OF_WEEK.length} className="p-3 text-indigo-950 uppercase text-[11px] tracking-wider font-black">
                            {slot.label}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={slot.id} className="hover:bg-[#fffbf0]/90 transition border-b border-slate-200">
                        <td className="p-3.5 border-r border-slate-200 bg-slate-50/80 font-medium">
                          <div className="font-black text-indigo-950 text-sm">{slot.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{slot.time}</div>
                        </td>

                        {DAYS_OF_WEEK.map(day => {
                          const matchBooking = bookings.find(
                            b => b.labId === selectedLab && Number(b.dayIndex) === day.id && b.slotId === slot.id && b.status !== 'Rejected'
                          );

                          return (
                            <td 
                              key={day.id} 
                              onClick={() => !matchBooking && handleCellClickToBook(day.id, slot.id)}
                              className={`p-2 border-r border-slate-200 align-top h-24 min-w-[130px] transition ${
                                !matchBooking ? 'hover:bg-indigo-50/60 cursor-pointer group' : ''
                              }`}
                            >
                              {matchBooking ? (
                                <div className="h-full bg-emerald-50/90 border border-emerald-300 rounded-2xl p-2.5 flex flex-col justify-between shadow-2xs">
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[9px] font-black bg-emerald-700 text-white px-1.5 py-0.5 rounded">TIN HỌC</span>
                                      <span className="text-[10px] font-black bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        Lớp {matchBooking.className}
                                      </span>
                                    </div>
                                    <div className="text-xs font-extrabold text-emerald-950 truncate mt-1">
                                      {matchBooking.teacherName}
                                    </div>
                                    <div className="text-[10px] text-emerald-800 truncate mt-0.5 font-medium">
                                      {matchBooking.subject}
                                    </div>
                                  </div>

                                  <div className="text-[10px] text-emerald-800 border-t border-emerald-200/80 pt-1 mt-1 flex justify-between items-center font-bold">
                                    <span>{matchBooking.studentCount} HS</span>
                                    <span className="text-emerald-800 flex items-center gap-1 font-extrabold">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {matchBooking.status === 'Approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-700 transition">
                                  <span className="text-xs font-semibold italic text-slate-300 group-hover:text-indigo-500">Trống</span>
                                  <span className="text-[10px] hidden group-hover:inline-flex items-center gap-1 text-indigo-700 font-extrabold mt-1">
                                    <Plus className="w-3 h-3" /> Đăng ký
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODULE 2: PHIẾU ĐĂNG KÝ MƯỢN (BOOKING FORM)
          ==================================================================== */}
      {activeSubTab === 'booking' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
          <div className="bg-[#fffbf0] rounded-3xl border border-[#cbb89d] p-6 sm:p-8 space-y-6 shadow-sm text-left">
            <div className="border-b border-[#cbb89d]/70 pb-4 flex items-center justify-between">
              <div>
                <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  MODULE 2: PHIẾU ĐĂNG KÝ MƯỢN
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">Tạo Phiếu Đăng Ký Mượn Phòng Máy</h3>
              </div>
              <button
                onClick={() => setActiveSubTab('calendar')}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                ← Quay lại lịch mượn
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-6 text-xs">
              <div className="space-y-4">
                <h4 className="font-extrabold text-[#3d2b17] text-sm border-b border-[#cbb89d]/60 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-700" />
                  Thông Tin Giáo Viên & Tiết Dạy
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Giáo Viên Đăng Ký *</label>
                    <select
                      value={teacherNameInput}
                      onChange={e => setTeacherNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                      required
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.name}>{m.name} ({m.username})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Lớp Đăng Ký *</label>
                    <select
                      value={classNameInput}
                      onChange={e => setClassNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                      required
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.name}>{c.name} ({c.teacher})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Sĩ Số Học Sinh *</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={studentCountInput}
                      onChange={e => setStudentCountInput(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Môn Học / Bài Dạy *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tin học 3 - Thực hành Scratch..."
                      value={subjectInput}
                      onChange={e => setSubjectInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="font-extrabold text-[#3d2b17] text-sm border-b border-[#cbb89d]/60 pb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-700" />
                  Chọn Phòng & Khung Thời Gian Mượn
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Phòng Máy *</label>
                    <select
                      value={formLabId}
                      onChange={e => setFormLabId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                    >
                      {labs.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Thứ Trong Tuần *</label>
                    <select
                      value={formDayIndex}
                      onChange={e => setFormDayIndex(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                    >
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Khung Tiết Học *</label>
                    <select
                      value={formSlotId}
                      onChange={e => setFormSlotId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                    >
                      {TIME_SLOTS.filter(s => !s.isBreak).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.time})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {conflictBooking && (
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center space-x-2 shadow-2xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      Trùng lịch: Khung giờ đã được đăng ký bởi GV <strong>{conflictBooking.teacherName}</strong> (Lớp {conflictBooking.className})
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#cbb89d]/70 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('calendar')}
                  className="px-5 py-2.5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer active:scale-95"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-2xl font-extrabold text-xs text-white shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 ${
                    conflictBooking ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-700/20'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Gửi Phiếu Đăng Ký Mượn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP MODAL CẢNH BÁO TRÙNG LỊCH */}
      {isConflictModalOpen && conflictBooking && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-red-500 space-y-5 relative text-left">
            <div className="flex items-center gap-3.5 border-b border-red-200 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600 shrink-0">
                <AlertOctagon className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-red-700 uppercase tracking-wide">
                  🚨 CẢNH BÁO TRÙNG LỊCH ĐĂNG KÝ!
                </h3>
                <p className="text-xs font-bold text-slate-600">
                  Không thể gửi phiếu đăng ký do khung giờ đã có lớp khác.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-slate-800 space-y-1.5 font-semibold">
                <div>
                  📍 <span className="font-bold">Phòng máy chọn:</span> <strong className="text-indigo-950">{labs.find(l => l.id === formLabId)?.name}</strong>
                </div>
                <div>
                  🕒 <span className="font-bold">Thời gian:</span> <strong className="text-red-700">{DAYS_OF_WEEK.find(d => d.id === formDayIndex)?.name} - {TIME_SLOTS.find(s => s.id === formSlotId)?.name} ({TIME_SLOTS.find(s => s.id === formSlotId)?.time})</strong>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-2 text-amber-950 font-bold">
                <div className="text-xs uppercase text-amber-900 font-black flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  Thông tin giáo viên đang mượn khung giờ này:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>👨‍🏫 Giáo viên: <strong className="text-slate-900">{conflictBooking.teacherName}</strong></div>
                  <div>🏫 Lớp mượn: <strong className="text-slate-900">{conflictBooking.className}</strong></div>
                  <div className="col-span-2">📖 Bài dạy: <strong className="text-slate-900">{conflictBooking.subject}</strong></div>
                </div>
              </div>

              <p className="text-slate-600 text-xs font-medium italic">
                Vui lòng đổi sang tiết học khác hoặc chọn phòng máy khác để hoàn tất việc đăng ký phòng máy.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setIsConflictModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Chọn Khung Giờ Khác</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODULE 3: BÁO CÁO SỰ CỐ MÁY TÍNH (INCIDENT REPORT & SEAT MAP)
          ==================================================================== */}
      {activeSubTab === 'incident' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SƠ ĐỒ THẺ MÁY TÍNH IMAC 3D */}
            <div className="lg:col-span-7 bg-[#fffbf0] p-6 rounded-3xl border border-[#cbb89d] shadow-sm space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[#cbb89d]/70 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-indigo-700" />
                  <span>Sơ Đồ Máy {currentLabObj.name}</span>
                </h3>
                <select
                  value={selectedLab}
                  onChange={e => { setSelectedLab(e.target.value); setSelectedSeatNumber(null); }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none cursor-pointer"
                >
                  {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div className="w-full bg-[#dfccb0] text-[#3d2b17] text-center py-2.5 rounded-2xl text-xs font-black uppercase mb-4 border border-[#cbb89d] shadow-2xs">
                📌 BẢNG / BÀN GIÁO VIÊN BỘ MÔN
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {Array.from({ length: currentLabObj.totalPCs }).map((_, idx) => {
                  const pcNum = idx + 1;
                  const isBroken = incidents.some(i => i.labId === selectedLab && i.pcNumber === pcNum && i.status !== 'Resolved');
                  const isSelected = selectedSeatNumber === pcNum;

                  let cardStyle = 'bg-white border-slate-200 text-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 shadow-2xs';
                  if (isBroken) cardStyle = 'bg-rose-100 border-rose-300 text-rose-950 font-black shadow-2xs';
                  if (isSelected) cardStyle = 'bg-amber-100 border-amber-500 text-amber-950 font-black ring-4 ring-amber-400/50 scale-105 shadow-md';

                  return (
                    <div
                      key={pcNum}
                      onClick={() => setSelectedSeatNumber(pcNum)}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition cursor-pointer ${cardStyle}`}
                    >
                      <Cpu className={`w-5 h-5 mb-1 ${isBroken ? 'text-rose-600' : isSelected ? 'text-amber-600' : 'text-indigo-600'}`} />
                      <span className="text-xs font-black">Máy {pcNum < 10 ? `0${pcNum}` : pcNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORM BÁO SỰ CỐ MÁY TÍNH */}
            <div className="lg:col-span-5 bg-[#fffbf0] p-6 rounded-3xl border border-[#cbb89d] shadow-sm space-y-4 text-left">
              <h3 className="text-sm font-black text-slate-900 border-b border-[#cbb89d]/70 pb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Chi Tiết Báo Cáo Sự Cố Máy Tính</span>
              </h3>

              <form onSubmit={handleAddIncident} className="space-y-4 text-xs">
                <div className="p-3.5 bg-white rounded-2xl flex justify-between items-center text-xs font-bold border border-slate-300 shadow-2xs">
                  <span className="text-slate-700">Số máy đã chọn:</span>
                  {selectedSeatNumber ? (
                    <span className="bg-indigo-700 text-white px-3.5 py-1 rounded-xl font-mono font-black shadow-2xs">
                      Máy #{selectedSeatNumber}
                    </span>
                  ) : (
                    <span className="text-rose-600 italic font-bold">Chưa chọn máy trên sơ đồ</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Người Báo Cáo *</label>
                  <input
                    type="text"
                    placeholder="Tên Giáo viên / Học sinh báo cáo..."
                    value={incidentReporter}
                    onChange={e => setIncidentReporter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Phân Loại Lỗi</label>
                    <select
                      value={incidentType}
                      onChange={e => setIncidentType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white cursor-pointer"
                    >
                      <option value="Hardware">Phần Cứng (Liệt phím/chuột)</option>
                      <option value="Software">Phần Mềm (Lỗi Win/WinRAR)</option>
                      <option value="Network">Mạng (Không có Internet)</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Mức Ưu Tiên</label>
                    <select
                      value={incidentPriority}
                      onChange={e => setIncidentPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white cursor-pointer"
                    >
                      <option value="Low">Thấp</option>
                      <option value="Medium">Trung Bình</option>
                      <option value="High">Khẩn Cấp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Mô Tả Lỗi Chi Tiết *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Mô tả lỗi (Chuột không di chuyển được, liệt phím Space, không nạp Windows...)"
                    value={incidentIssue}
                    onChange={e => setIncidentIssue(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={!selectedSeatNumber}
                  className={`w-full py-3 rounded-2xl font-black text-xs text-white transition shadow-md cursor-pointer active:scale-95 ${
                    selectedSeatNumber ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Gửi Báo Cáo Sự Cố Máy #{selectedSeatNumber || '?'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODULE 4: NHẬT KÝ BẢO TRÌ & SỬA CHỮA THIẾT BỊ (MAINTENANCE LOGS)
          ==================================================================== */}
      {activeSubTab === 'log' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-[#fffbf0] p-5 rounded-3xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wide">Số Lượt Ghi Vết Bảo Trì</div>
                <div className="text-2xl font-black text-[#3d2b17] mt-1">{filteredLogs.length} Lượt</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 border border-teal-300 flex items-center justify-center text-xl font-bold shadow-2xs">
                <BookMarked className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#fffbf0] p-5 rounded-3xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wide">Tổng Chi Phí Sửa / Thay Linh Kiện</div>
                <div className="text-2xl font-black text-emerald-800 mt-1">{formatVND(totalSpent)}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center text-xl font-bold shadow-2xs">
                <Tag className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#fffbf0] p-5 rounded-3xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wide">Phòng Đang Chọn Ghi Chép</div>
                <select
                  value={selectedLab}
                  onChange={e => setSelectedLab(e.target.value)}
                  className="mt-1 font-black text-indigo-900 text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                >
                  {labs.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsAddLogModalOpen(true)}
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi Nhật Ký</span>
              </button>
            </div>
          </div>

          <div className="bg-[#fffbf0] p-4.5 rounded-3xl border border-[#cbb89d] shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 text-left">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-black text-slate-700 uppercase">Lọc Theo:</span>
              <select
                value={logFilterType}
                onChange={e => setLogFilterType(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-black bg-white cursor-pointer"
              >
                <option value="All">Tất cả loại nhật ký</option>
                <option value="Repair">🛠️ Sửa chữa</option>
                <option value="Replacement">🔄 Thay linh kiện</option>
                <option value="Upgrade">🚀 Nâng cấp phần cứng</option>
                <option value="Maintenance">🧹 Bảo trì định kỳ</option>
                <option value="Software">💻 Phần mềm</option>
              </select>

              <select
                value={logFilterPC}
                onChange={e => setLogFilterPC(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-black bg-white cursor-pointer"
              >
                <option value="All">Tất cả thiết bị</option>
                <option value="lab">🏢 Toàn bộ phòng máy</option>
                {Array.from({ length: currentLabObj.totalPCs }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>💻 Máy #{i + 1}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tiêu đề, người sửa, linh kiện..."
                value={logSearchTerm}
                onChange={e => setLogSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#cbb89d] overflow-hidden shadow-xs p-6 text-left">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic">
                <BookMarked className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-500" />
                <p className="text-xs font-extrabold">Chưa có ghi chép nhật ký bảo trì nào cho phòng máy này.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map(log => (
                  <div key={log.id} className="p-4.5 rounded-2xl border border-slate-200/90 hover:border-[#cbb89d] bg-slate-50/50 hover:bg-[#fffbf0]/90 transition-all flex flex-col md:flex-row justify-between gap-4 shadow-2xs">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black px-3 py-0.5 rounded-full">
                          {log.type === 'Repair' ? '🛠️ Sửa chữa' : log.type === 'Replacement' ? '🔄 Thay linh kiện' : log.type === 'Upgrade' ? '🚀 Nâng cấp' : log.type === 'Maintenance' ? '🧹 Bảo trì' : '💻 Phần mềm'}
                        </span>
                        <span className="bg-slate-800 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md font-mono">
                          {log.pcLabel || (log.pcNumber ? `Máy #${log.pcNumber}` : 'Toàn phòng')}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          📅 {formatDateDDMMYYYY(log.date)}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900">{log.title}</h4>

                      {log.description && (
                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                          {log.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-bold pt-1">
                        <span>👨‍🔧 Thực hiện: <strong className="text-indigo-900">{log.technician}</strong></span>
                        {log.cost > 0 && (
                          <span className="text-emerald-900 font-black bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                            💵 Chi phí: {formatVND(log.cost)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end items-end shrink-0">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition cursor-pointer"
                        title="Xóa nhật ký"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL GHI NHẬT KÝ BẢO TRÌ */}
      {isAddLogModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-[#cbb89d] space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-teal-600" />
                <span>Ghi Nhật Ký Bảo Trì & Sửa Chữa Mới</span>
              </h3>
              <button onClick={() => setIsAddLogModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phòng Máy</label>
                  <select
                    value={selectedLab}
                    onChange={e => setSelectedLab(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                  >
                    {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Đối Tượng</label>
                  <select
                    value={logTargetType}
                    onChange={e => setLogTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                  >
                    <option value="pc">Từng máy cụ thể</option>
                    <option value="lab">Toàn bộ phòng máy</option>
                  </select>
                </div>
              </div>

              {logTargetType === 'pc' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Số Máy</label>
                  <select
                    value={logPcNumber}
                    onChange={e => setLogPcNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                  >
                    {Array.from({ length: currentLabObj.totalPCs }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Máy #{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Loại Hoạt Động</label>
                  <select
                    value={logType}
                    onChange={e => setLogType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                  >
                    <option value="Repair">🛠️ Sửa chữa</option>
                    <option value="Replacement">🔄 Thay thế linh kiện</option>
                    <option value="Upgrade">🚀 Nâng cấp phần cứng</option>
                    <option value="Maintenance">🧹 Bảo trì định kỳ</option>
                    <option value="Software">💻 Phần mềm</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ngày Thực Hiện</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Tiêu Đề Hạng Mục *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thay RAM 8GB Kingston DDR4..."
                  value={logTitle}
                  onChange={e => setLogTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mô Tả Chi Tiết / Thông Số Linh Kiện</label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú chi tiết thông số linh kiện, tình trạng cũ/mới, thời hạn bảo hành..."
                  value={logDescription}
                  onChange={e => setLogDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Người Sửa / Đơn Vị</label>
                  <input
                    type="text"
                    placeholder="Tên Giáo viên / Kỹ thuật viên..."
                    value={logTechnician}
                    onChange={e => setLogTechnician(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Chi Phí Thay/Sửa (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    placeholder="0"
                    value={logCost}
                    onChange={e => setLogCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 font-extrabold text-xs text-white shadow-md cursor-pointer"
                >
                  Lưu Nhật Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODULE 5: QUẢN LÝ DUYỆT PHIẾU, SỰ CỐ & THIẾT KẾ SƠ ĐỒ PHÒNG LAB
          ==================================================================== */}
      {activeSubTab === 'admin' && (
        <div className="space-y-6 animate-fadeIn text-left">
          
          {/* CARD TOP: QUẢN LÝ DANH SÁCH & SƠ ĐỒ PHÒNG LAB */}
          <div className="bg-[#fffbf0] p-6 rounded-3xl border border-[#cbb89d] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#cbb89d]/70 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Quản Lý Danh Sách & Sơ Đồ Phòng LAB</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Thêm mới phòng máy, thiết kế sơ đồ ma trận hàng x cột và chỉnh sửa tên máy trực tiếp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddLabModal}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Phòng Mới</span>
                </button>
              </div>
            </div>

            {/* CARDS LIST PHÒNG LAB */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {labs.map(lab => (
                <div key={lab.id} className="p-4.5 rounded-2xl border border-slate-200/90 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition-all flex items-center justify-between shadow-2xs hover:shadow-md">
                  <div className="space-y-1">
                    <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <span>{lab.name}</span>
                      <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ({lab.code})
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      {lab.totalPCs} Máy • {lab.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditLabModal(lab)}
                      className="flex items-center gap-1.5 text-indigo-800 bg-indigo-100/90 hover:bg-indigo-200 border border-indigo-300 px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer transition active:scale-95"
                      title="Thiết kế sơ đồ ma trận"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDeleteLab(lab.id)}
                      className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-2 rounded-xl transition cursor-pointer"
                      title="Xóa phòng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="bg-[#fffbf0] p-4.5 rounded-3xl border border-[#cbb89d] shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Bảng Quản Lý Duyệt Phiếu & Sửa Chữa Sự Cố</span>
            </h3>

            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên giáo viên, lớp, máy hỏng..."
                value={adminSearchTerm}
                onChange={e => setAdminSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* TABLE 1: BOOKINGS LIST */}
          <div className="bg-white rounded-3xl border border-[#cbb89d] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#cbb89d] font-black text-[#3d2b17] text-sm flex justify-between items-center bg-[#dfccb0]/40">
              <span>Danh Sách Phiếu Đăng Ký Mượn Phòng ({filteredBookings.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#dfccb0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-4 whitespace-nowrap">GIÁO VIÊN</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">LỚP & SĨ SỐ</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">PHÒNG MÁY</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">MÔN HỌC</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">TRẠNG THÁI</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">THAO TÁC DUYỆT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic font-medium">
                        Chưa có dữ liệu phiếu đăng ký mượn phòng máy.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-[#fffbf0]/80 transition border-b border-slate-200">
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">{b.teacherName}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800 whitespace-nowrap">{b.className} ({b.studentCount} HS)</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="bg-indigo-100 text-indigo-900 font-mono font-black text-[10px] px-2.5 py-0.5 rounded-md border border-indigo-200">
                            {b.labId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">{b.subject}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-black px-3 py-0.5 rounded-full ${
                            b.status === 'Approved' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-rose-100 text-rose-950 border border-rose-300'
                          }`}>
                            {b.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3 py-1 rounded-xl shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Rejected')}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] px-3 py-1 rounded-xl shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-xl border border-rose-200 transition cursor-pointer active:scale-95"
                              title="Xóa phiếu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: INCIDENTS LIST */}
          <div className="bg-white rounded-3xl border border-[#cbb89d] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#cbb89d] font-black text-[#3d2b17] text-sm flex justify-between items-center bg-[#dfccb0]/40">
              <span>Danh Sách Báo Cáo Sự Cố Máy Tính ({filteredIncidents.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#dfccb0] border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-4 whitespace-nowrap">VỊ TRÍ MÁY</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">LOẠI LỖI</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">MÔ TẢ SỰ CỐ</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">TRẠNG THÁI</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">THAO TÁC X XỬ LÝ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic font-medium">
                        Không có báo cáo sự cố máy tính nào.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map(i => (
                      <tr key={i.id} className="hover:bg-[#fffbf0]/80 transition border-b border-slate-200">
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                          {i.labId} - Máy #{i.pcNumber}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800 whitespace-nowrap">{i.type}</td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">{i.issue}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-black px-3 py-0.5 rounded-full ${
                            i.status === 'Resolved' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' :
                            i.status === 'In Progress' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-rose-100 text-rose-950 border border-rose-300'
                          }`}>
                            {i.status === 'Resolved' ? 'Đã khắc phục' : i.status === 'In Progress' ? 'Đang sửa' : 'Chờ xử lý'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleUpdateIncidentStatus(i.id, 'In Progress')}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] px-3 py-1 rounded-xl shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Đang sửa
                            </button>
                            <button
                              onClick={() => handleUpdateIncidentStatus(i.id, 'Resolved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3 py-1 rounded-xl shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Đã xong
                            </button>
                            <button
                              onClick={() => handleDeleteIncident(i.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-xl border border-rose-200 transition cursor-pointer active:scale-95"
                              title="Xóa báo cáo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LAB EDITOR MODAL: TRÌNH THIẾT KẾ SƠ ĐỒ MA TRẬN PHÒNG LAB ĐỘNG (POPUP FULL CHUẨN MẪU 100%)
          ==================================================================== */}
      {isLabEditorModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 relative overflow-hidden text-left">
            
            {/* HEADER MODAL (STICKY TOP) */}
            <div className="px-6 py-4 border-b border-[#cbb89d] bg-[#dfccb0]/50 flex justify-between items-center shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Grid className="w-6 h-6 text-indigo-700" />
                  <span>Thiết Kế Sơ Đồ – {labFormName || 'Phòng Lab'}</span>
                </h3>
                <p className="text-xs text-slate-600 font-semibold">
                  Mặc định tạo đủ máy theo Hàng x Cột. Chọn "Kẻ Lối Đi" và rê chuột hoặc bấm nút ở đầu Cột/Hàng.
                </p>
              </div>
              <button 
                onClick={() => setIsLabEditorModalOpen(false)} 
                className="text-slate-500 hover:text-slate-800 transition p-1.5 rounded-xl hover:bg-slate-200/60 cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveLabLayout} className="flex flex-col flex-1 overflow-hidden">
              
              {/* BODY CONTAINER (SCROLLABLE CONTENT) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                
                {/* PHẦN 1: THÔNG TIN CƠ BẢN (4 Ô INPUT CÙNG HÀNG) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">TÊN PHÒNG *</label>
                    <input
                      type="text"
                      required
                      value={labFormName}
                      onChange={e => setLabFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Phòng Lab 01"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">MÃ PHÒNG *</label>
                    <input
                      type="text"
                      required
                      value={labFormCode}
                      onChange={e => setLabFormCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="P.201"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">VỊ TRÍ</label>
                    <input
                      type="text"
                      value={labFormLocation}
                      onChange={e => setLabFormLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Tầng 2 - Nhà A"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase mb-1">TRẠNG THÁI</label>
                    <select
                      value={labFormStatus}
                      onChange={e => setLabFormStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="Active">Đang hoạt động</option>
                      <option value="Maintenance">Đang bảo trì</option>
                    </select>
                  </div>
                </div>

                {/* PHẦN 2: THANH ĐIỀU KHIỂN SỐ HÀNG/CỘT, KHÔI PHỤC MÁY & BỘ CÔNG CỤ TOOLBAR */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    
                    {/* DROPDOWN CHỌN SỐ HÀNG VÀ CỘT */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-700">Số Hàng:</span>
                        <select
                          value={labFormRows}
                          onChange={e => handleSelectRowsChange(Number(e.target.value))}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold bg-white outline-none cursor-pointer"
                        >
                          {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1} Hàng</option>
                          ))}
                        </select>
                      </div>

                      <span className="text-slate-400 font-black text-sm">✕</span>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-700">Số Cột:</span>
                        <select
                          value={labFormCols}
                          onChange={e => handleSelectColsChange(Number(e.target.value))}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold bg-white outline-none cursor-pointer"
                        >
                          {Array.from({ length: 14 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1} Cột</option>
                          ))}
                        </select>
                      </div>

                      {/* NÚT KHÔI PHỤC ĐỦ MÁY */}
                      <button
                        type="button"
                        onClick={handleRestoreFullPcs}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-xs hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Khôi phục đủ {labFormRows * labFormCols} máy</span>
                      </button>
                    </div>

                    {/* BỘ CÔNG CỤ TOOL MODES PILL BAR */}
                    <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl border border-slate-300">
                      <button
                        type="button"
                        onClick={() => setActiveEditorTool('aisle')}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                          activeEditorTool === 'aisle'
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'text-slate-700 hover:bg-slate-300/60'
                        }`}
                      >
                        <span>🪛 Kẻ Lối Đi (Rê Chuột)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveEditorTool('drag')}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                          activeEditorTool === 'drag'
                            ? 'bg-indigo-700 text-white shadow-md'
                            : 'text-slate-700 hover:bg-slate-300/60'
                        }`}
                      >
                        <Move className="w-3.5 h-3.5" />
                        <span>Kéo Thả Ô</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveEditorTool('desk')}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                          activeEditorTool === 'desk'
                            ? 'bg-indigo-700 text-white shadow-md'
                            : 'text-slate-700 hover:bg-slate-300/60'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Đặt Bàn GV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveEditorTool('rename')}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                          activeEditorTool === 'rename'
                            ? 'bg-indigo-700 text-white shadow-md'
                            : 'text-slate-700 hover:bg-slate-300/60'
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Sửa Tên Máy</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-black px-3 py-1 rounded-xl">
                      Máy thực tế: {Object.values(labFormLayout).filter((t: any) => t && t.type === 'pc').length} Máy
                    </span>
                  </div>
                </div>

                {/* PHẦN 3: MATRIX CANVAS CONTAINER (DARK NAVY THEME BG-[#0F172A] VỚI VẼ LỐI ĐI RÊ CHUỘT & KÉO THẢ Ô) */}
                <div 
                  className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 overflow-x-auto shadow-2xl space-y-4 select-none"
                  onMouseLeave={() => { setIsMouseDown(false); setPaintTargetType(null); }}
                  onMouseUp={() => { setIsMouseDown(false); setPaintTargetType(null); }}
                >
                  
                  <div className="inline-block min-w-full text-left">
                    {/* HÀNG HÀNH ĐỘNG CỘT (TOP ACTION ROW) */}
                    <div className="flex items-center gap-2 mb-2 font-mono">
                      {/* Ô HÀNH ĐỘNG GÓC TRÁI (TOP-LEFT CORNER CELL) */}
                      <div className="w-24 shrink-0 text-center font-bold text-[11px] text-slate-400">
                        Thao Tác
                      </div>

                      {/* CÁC NÚT + CỘT VÀ XÓA CỘT TRÊN TỪNG CỘT */}
                      {Array.from({ length: labFormCols }).map((_, cIdx) => (
                        <div key={cIdx} className="w-24 shrink-0 flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1 w-full">
                            <button
                              type="button"
                              onClick={() => handleInsertColumnAt(cIdx)}
                              className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-400 font-extrabold text-[10px] px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-0.5"
                              title={`Chèn thêm cột mới tại vị trí Cột ${cIdx + 1}`}
                            >
                              + Cột
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumnAt(cIdx)}
                              className="bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-400 p-0.5 rounded transition cursor-pointer"
                              title={`Xóa Cột ${cIdx + 1}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400">↓ Cột {cIdx + 1}</span>
                        </div>
                      ))}

                      {/* NÚT THÊM CỘT VÀO CUỐI */}
                      <button
                        type="button"
                        onClick={() => handleInsertColumnAt(labFormCols)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-md transition cursor-pointer whitespace-nowrap ml-2 active:scale-95"
                      >
                        + Thêm Cột
                      </button>
                    </div>

                    {/* CÁC HÀNG MA TRẬN VÀ CÁC THẺ MÁY TÍNH (ROW MATRIX CANVAS) */}
                    <div className="space-y-2">
                      {Array.from({ length: labFormRows }).map((_, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2">
                          
                          {/* CỘT THAO TÁC HÀNG TRÊN TỪNG HÀNG (LEFT ACTION COLUMN) */}
                          <div className="w-24 shrink-0 flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleInsertRowAt(rIdx)}
                                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-400 font-extrabold text-[10px] px-1 py-0.5 rounded transition cursor-pointer"
                                title={`Chèn 1 hàng mới tại vị trí Hàng ${rIdx + 1}`}
                              >
                                + Hàng
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRowAt(rIdx)}
                                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-400 p-0.5 rounded transition cursor-pointer"
                                title={`Xóa Hàng ${rIdx + 1}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-400 font-mono">→ H{rIdx + 1}</span>
                          </div>

                          {/* CÁC THẺ MÁY TÍNH TRONG HÀNG */}
                          {Array.from({ length: labFormCols }).map((_, cIdx) => {
                            const key = `${rIdx}_${cIdx}`;
                            const tile = labFormLayout[key] || { type: 'pc' };
                            const isSelectedForSwap = selectedSwapKey === key;

                            let cardBg = 'bg-[#4338ca] hover:bg-[#4f46e5] text-white border-indigo-400/40 shadow-md';
                            if (tile.type === 'desk') cardBg = 'bg-amber-600 hover:bg-amber-700 text-white border-amber-400/40 shadow-md';
                            if (tile.type === 'aisle') cardBg = 'bg-slate-900/70 border-dashed border-slate-700 text-slate-600 hover:bg-slate-900';

                            if (isSelectedForSwap) {
                              cardBg += ' ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-105 z-20 animate-pulse';
                            }

                            return (
                              <div
                                key={key}
                                draggable={activeEditorTool === 'drag'}
                                onDragStart={(e) => handleTileDragStart(e, key)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleTileDrop(e, key)}
                                onMouseDown={() => handleTileMouseDown(rIdx, cIdx)}
                                onMouseEnter={() => handleTileMouseEnter(rIdx, cIdx)}
                                className={`w-24 h-16 shrink-0 rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 cursor-pointer transition-all active:scale-95 select-none ${cardBg}`}
                              >
                                {tile.type === 'pc' && (
                                  <>
                                    <Monitor className="w-4 h-4 text-white mb-0.5" />
                                    <span className="text-xs font-extrabold tracking-wider truncate max-w-full">
                                      {tile.label || `M.${rIdx * labFormCols + cIdx + 1}`}
                                    </span>
                                  </>
                                )}

                                {tile.type === 'desk' && (
                                  <>
                                    <User className="w-4 h-4 text-white mb-0.5" />
                                    <span className="text-xs font-black tracking-wider">Bàn GV</span>
                                  </>
                                )}

                                {tile.type === 'aisle' && (
                                  <span className="text-[10px] font-bold italic text-slate-500">Lối đi</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* NÚT THÊM HÀNG VÀO CUỐI SƠ ĐỒ */}
                    <div className="mt-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleInsertRowAt(labFormRows)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl shadow-md transition cursor-pointer active:scale-95"
                      >
                        + Thêm Hàng Vào Cuối Sơ Đồ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER MODAL (STICKY BOTTOM) */}
              <div className="px-6 py-4 border-t border-[#cbb89d] bg-[#dfccb0]/40 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="text-xs font-medium text-slate-700 italic flex items-center gap-1.5">
                  <span>💡 Mẹo: Bấm nút [+ Cột] hoặc [+ Hàng] ở bất kỳ vị trí nào để chèn thêm hàng/cột ngay tại đó.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLabEditorModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs shadow-lg transition cursor-pointer active:scale-95"
                  >
                    Lưu Sơ Đồ & Thông Tin
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
