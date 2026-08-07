import React, { useState, useMemo } from 'react';
import { LabInfo, LabBooking, LabIncident, LabMaintenanceLog, Member, ClassItem, Computer } from '../types';
import { 
  CalendarDays, FilePenLine, AlertTriangle, Sliders, Plus, Trash2, CheckCircle2, 
  Monitor, Cpu, Search, User, Check, X, 
  Building, RefreshCw, AlertOctagon, Info, BookMarked, Wrench, RotateCw, Microchip, HardDrive, Tag
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

// Danh sách phòng máy chính thực tế nhà trường
export const SYSTEM_LABS: LabInfo[] = [
  { id: 'lab1', name: 'Phòng Máy Số 1', code: 'PM-01', totalPCs: 35, status: 'Active', location: 'Tầng 2 - Khu Phòng Học A' },
  { id: 'lab2', name: 'Phòng Máy Số 2', code: 'PM-02', totalPCs: 40, status: 'Active', location: 'Tầng 2 - Khu Phòng Học B' },
  { id: 'lab3', name: 'Phòng Thực Hành STEM', code: 'PM-STEM', totalPCs: 30, status: 'Maintenance', location: 'Tầng 3 - Nhà Đa Năng' },
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
  setMaintenanceLogs
}: LabBookingTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'booking' | 'incident' | 'log' | 'admin'>('calendar');
  const [selectedLab, setSelectedLab] = useState<string>('lab1');

  // Form states for Module 2: Booking Form
  const [teacherNameInput, setTeacherNameInput] = useState<string>(currentUser?.name || (members[0] ? members[0].name : ''));
  const [classNameInput, setClassNameInput] = useState<string>(classes[0] ? classes[0].name : 'Ba 1');
  const [studentCountInput, setStudentCountInput] = useState<number>(35);
  const [subjectInput, setSubjectInput] = useState<string>('Tin học - Bài thực hành gõ phím & Scratch');
  const [formLabId, setFormLabId] = useState<string>('lab1');
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

  const currentLabObj = SYSTEM_LABS.find(l => l.id === selectedLab) || SYSTEM_LABS[0];

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-slate-800 pb-10 animate-fadeIn">
      
      {/* 🌟 1. DESKOS IMAC WARM BEIGE CARD HEADER STRIP (LOẠI BỎ TẤT CẢ CHỮ, CHỈ GIỮ LẠI "Đang xem:") */}
      <div className="border border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-xs">
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] px-4 py-2.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2 text-left">
            <span className="font-bold text-xs text-[#5c4327]">Đang xem:</span>
            <span className="font-black text-xs text-indigo-900 bg-white/80 px-2.5 py-1 rounded-lg border border-[#cbb89d]">
              {currentLabObj.name} ({currentLabObj.code})
            </span>
          </div>

          {/* Navigation Subtab Buttons Group (FE Vườn Tri Thức) */}
          <nav className="flex items-center gap-1 bg-[#e4d3ba] p-1 rounded-xl border border-[#cbb89d] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveSubTab('calendar')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'calendar'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>1. Lịch Mượn</span>
            </button>

            <button
              onClick={() => setActiveSubTab('booking')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'booking'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <FilePenLine className="w-4 h-4" />
              <span>2. Đăng Ký</span>
            </button>

            <button
              onClick={() => setActiveSubTab('incident')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'incident'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>3. Báo Sự Cố</span>
            </button>

            <button
              onClick={() => setActiveSubTab('log')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'log'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-[#3d2b17] hover:bg-[#d5c3aa]'
              }`}
            >
              <BookMarked className="w-4 h-4 text-teal-300" />
              <span>4. Nhật Ký Bảo Trì</span>
            </button>

            <button
              onClick={() => setActiveSubTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-xs'
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
          {/* LAB SELECTOR CARDS */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#cbb89d] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-700" />
                <span>Danh Sách Phòng Máy Tin Học Nhà Trường</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">Bấm chọn phòng để xem lịch:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SYSTEM_LABS.map(lab => {
                const isSelected = selectedLab === lab.id;
                const activeIssueCount = incidents.filter(i => i.labId === lab.id && i.status !== 'Resolved').length;
                return (
                  <div
                    key={lab.id}
                    onClick={() => setSelectedLab(lab.id)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-700 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                        isSelected ? 'bg-indigo-700 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-extrabold text-slate-800 flex items-center gap-2">
                          <span>{lab.name}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {lab.code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {lab.totalPCs} máy • {lab.location}
                        </div>
                      </div>
                    </div>

                    {activeIssueCount > 0 ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {activeIssueCount} lỗi
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Tốt
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CALENDAR MATRIX TABLE (CẤU TRÚC BẢNG VƯỜN TRI THỨC SẠCH BẤT KỲ NÚT BẤM DƯ THỪA NÀO IN CELL) */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#cbb89d] overflow-hidden">
            <div className="p-4 border-b border-[#cbb89d] flex justify-between items-center bg-[#dfccb0]/30">
              <h3 className="text-sm font-extrabold text-[#3d2b17] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-700" />
                <span>Thời Khóa Biểu Sử Dụng - {currentLabObj.name} ({currentLabObj.code})</span>
              </h3>
              <button
                onClick={() => setActiveSubTab('booking')}
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Phiếu Đăng Ký Mượn</span>
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full border-collapse text-left text-xs min-w-[800px]">
                <thead>
                  <tr className="bg-[#dfccb0]/40 border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-4 w-44 border-r border-[#cbb89d]/40 whitespace-nowrap">Tiết Học & Thời Gian</th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day.id} className="py-3.5 px-4 text-center border-r border-[#cbb89d]/40 whitespace-nowrap">
                        <span className="block text-[#3d2b17] font-black">{day.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {TIME_SLOTS.map(slot => {
                    if (slot.isBreak) {
                      return (
                        <tr key={slot.id} className="bg-indigo-50/70 text-center font-extrabold text-xs border-y border-indigo-100">
                          <td className="p-3 bg-indigo-100/60 text-indigo-900 border-r border-indigo-200 font-mono text-[11px]">
                            {slot.time}
                          </td>
                          <td colSpan={DAYS_OF_WEEK.length} className="p-3 text-indigo-950 uppercase text-[11px] tracking-wider">
                            {slot.label}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={slot.id} className="hover:bg-[#fffbf0]/80 transition border-b border-slate-200/60">
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
                                <div className="h-full bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[9px] font-black bg-emerald-700 text-white px-1.5 py-0.5 rounded">TIN HỌC</span>
                                      <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        Lớp {matchBooking.className}
                                      </span>
                                    </div>
                                    <div className="text-xs font-extrabold text-emerald-950 truncate mt-1">
                                      {matchBooking.teacherName}
                                    </div>
                                    <div className="text-[10px] text-emerald-700 truncate mt-0.5">
                                      {matchBooking.subject}
                                    </div>
                                  </div>

                                  <div className="text-[10px] text-emerald-700 border-t border-emerald-200/80 pt-1 mt-1 flex justify-between items-center font-bold">
                                    <span>{matchBooking.studentCount} HS</span>
                                    <span className="text-emerald-700 flex items-center gap-1">
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
          MODULE 2: PHIẾU ĐĂNG KÝ MƯỢN (KHUNG CẢNH BÁO VỀ VỊ TRÍ BAN ĐẦU DƯỚI DROPDOWN KHUNG TIẾT)
          ==================================================================== */}
      {activeSubTab === 'booking' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#cbb89d] p-6 sm:p-8 space-y-6 shadow-xs text-left">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <span className="bg-indigo-100 text-indigo-900 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                  MODULE 2: PHIẾU ĐĂNG KÝ MƯỢN
                </span>
                <h3 className="text-xl font-black text-slate-800 mt-1">Tạo Phiếu Đăng Ký Mượn Phòng Máy</h3>
              </div>
              <button
                onClick={() => setActiveSubTab('calendar')}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                ← Quay lại lịch mượn
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-6 text-xs">
              {/* PHẦN 1: THÔNG TIN GIÁO VIÊN VÀ TIẾT DẠY */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-700" />
                  Thông Tin Giáo Viên & Tiết Dạy
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Giáo Viên Đăng Ký *</label>
                    <select
                      value={teacherNameInput}
                      onChange={e => setTeacherNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 2: CHỌN PHÒNG VÀ KHUNG TIẾT MƯỢN */}
              <div className="space-y-4 pt-2">
                <h4 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-700" />
                  Chọn Phòng & Khung Thời Gian Mượn
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Phòng Máy *</label>
                    <select
                      value={formLabId}
                      onChange={e => setFormLabId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {SYSTEM_LABS.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Thứ Trong Tuần *</label>
                    <select
                      value={formDayIndex}
                      onChange={e => setFormDayIndex(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {TIME_SLOTS.filter(s => !s.isBreak).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.time})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 🔴 VỊ TRÍ BAN ĐẦU CỦA KHUNG CẢNH BÁO TRÙNG LỊCH (ĐẶT NGAY DƯỚI CÁC Ô CHỌN KHUNG TIẾT) */}
                {conflictBooking && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      Trùng lịch: Khung giờ đã được đăng ký bởi GV <strong>{conflictBooking.teacherName}</strong> (Lớp {conflictBooking.className})
                    </span>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('calendar')}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer active:scale-95"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
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

      {/* 🔴 POP-UP MODAL CẢNH BÁO TRÙNG LỊCH (BẬT KHI NHẤP GỬI PHIẾU NẾU TRÙNG LỊCH) */}
      {isConflictModalOpen && conflictBooking && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-red-500 space-y-5 relative text-left">
            <div className="flex items-center gap-3 border-b border-red-200 pb-3">
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

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-slate-800 space-y-1.5 font-semibold">
                <div>
                  📍 <span className="font-bold">Phòng máy chọn:</span> <strong className="text-indigo-900">{SYSTEM_LABS.find(l => l.id === formLabId)?.name}</strong>
                </div>
                <div>
                  🕒 <span className="font-bold">Thời gian:</span> <strong className="text-red-700">{DAYS_OF_WEEK.find(d => d.id === formDayIndex)?.name} - {TIME_SLOTS.find(s => s.id === formSlotId)?.name} ({TIME_SLOTS.find(s => s.id === formSlotId)?.time})</strong>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-amber-950 font-bold">
                <div className="text-xs uppercase text-amber-800 font-black flex items-center gap-1">
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
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Chọn Khung Giờ Khác</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODULE 3: BÁO CÁO SỰ CỐ MÁY TÍNH (INCIDENT REPORTING)
          ==================================================================== */}
      {activeSubTab === 'incident' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SEAT GRID MAP SELECTOR */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#cbb89d] shadow-xs space-y-4 text-left">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-700" />
                  <span>Sơ Đồ Máy {currentLabObj.name}</span>
                </h3>
                <select
                  value={selectedLab}
                  onChange={e => { setSelectedLab(e.target.value); setSelectedSeatNumber(null); }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                >
                  {SYSTEM_LABS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div className="w-full bg-[#dfccb0]/40 text-[#3d2b17] text-center py-2 rounded-xl text-xs font-extrabold uppercase mb-4 border border-[#cbb89d]">
                📌 BẢNG / BÀN GIÁO VIÊN BỘ MÔN
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {Array.from({ length: currentLabObj.totalPCs }).map((_, idx) => {
                  const pcNum = idx + 1;
                  const isBroken = incidents.some(i => i.labId === selectedLab && i.pcNumber === pcNum && i.status !== 'Resolved');
                  const isSelected = selectedSeatNumber === pcNum;

                  let bgColor = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40';
                  if (isBroken) bgColor = 'bg-rose-100 border-rose-300 text-rose-900 font-black';
                  if (isSelected) bgColor = 'bg-amber-100 border-amber-500 text-amber-950 font-black ring-2 ring-amber-400/50';

                  return (
                    <div
                      key={pcNum}
                      onClick={() => setSelectedSeatNumber(pcNum)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition cursor-pointer ${bgColor}`}
                    >
                      <Cpu className={`w-4 h-4 mb-1 ${isBroken ? 'text-rose-600' : 'text-slate-500'}`} />
                      <span className="text-xs font-extrabold">Máy {pcNum < 10 ? `0${pcNum}` : pcNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INCIDENT REPORT FORM */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#cbb89d] shadow-xs space-y-4 text-left">
              <h3 className="text-sm font-extrabold text-slate-800 border-b pb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Chi Tiết Sự Cố Máy Tính</span>
              </h3>

              <form onSubmit={handleAddIncident} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs font-bold border border-slate-200">
                  <span>Số máy đã chọn:</span>
                  {selectedSeatNumber ? (
                    <span className="bg-indigo-700 text-white px-3 py-1 rounded-lg font-mono font-black">
                      Máy #{selectedSeatNumber}
                    </span>
                  ) : (
                    <span className="text-rose-500 italic font-semibold">Chưa chọn máy trên sơ đồ</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Người Báo Cáo *</label>
                  <input
                    type="text"
                    placeholder="Tên Giáo viên / Học sinh báo cáo..."
                    value={incidentReporter}
                    onChange={e => setIncidentReporter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Phân Loại Lỗi</label>
                    <select
                      value={incidentType}
                      onChange={e => setIncidentType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="Hardware">Phần Cứng (Liệt phím/chuột)</option>
                      <option value="Software">Phần Mềm (Lỗi Windows/WinRAR)</option>
                      <option value="Network">Mạng (Không có Internet)</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Mức Ưu Tiên</label>
                    <select
                      value={incidentPriority}
                      onChange={e => setIncidentPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
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
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={!selectedSeatNumber}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs text-white transition shadow-md cursor-pointer active:scale-95 ${
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
          {/* STATS HEADER */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-white p-5 rounded-2xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wide">Số Lượt Ghi Vết Bảo Trì</div>
                <div className="text-2xl font-black text-[#3d2b17] mt-1">{filteredLogs.length} Lượt</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-xl font-bold">
                <BookMarked className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wide">Tổng Chi Phí Sửa / Thay Linh Kiện</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{formatVND(totalSpent)}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl font-bold">
                <Tag className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#cbb89d] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-wide">Phòng Đang Chọn Ghi Chép</div>
                <select
                  value={selectedLab}
                  onChange={e => setSelectedLab(e.target.value)}
                  className="mt-1 font-black text-indigo-900 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                >
                  {SYSTEM_LABS.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsAddLogModalOpen(true)}
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi Nhật Ký</span>
              </button>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-[#cbb89d] shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 text-left">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-black text-slate-600 uppercase">Lọc Theo:</span>
              <select
                value={logFilterType}
                onChange={e => setLogFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-extrabold bg-white cursor-pointer"
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
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-extrabold bg-white cursor-pointer"
              >
                <option value="All">Tất cả thiết bị</option>
                <option value="lab">🏢 Toàn bộ phòng máy</option>
                {Array.from({ length: currentLabObj.totalPCs }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>💻 Máy #{i + 1}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tiêu đề, người sửa, linh kiện..."
                value={logSearchTerm}
                onChange={e => setLogSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* LOGS LIST */}
          <div className="bg-white rounded-2xl border border-[#cbb89d] overflow-hidden shadow-xs p-6 text-left">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic">
                <BookMarked className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-500" />
                <p className="text-xs font-extrabold">Chưa có ghi chép nhật ký bảo trì nào cho phòng máy này.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map(log => (
                  <div key={log.id} className="p-4.5 rounded-2xl border border-slate-200 hover:border-[#cbb89d] bg-slate-50/50 hover:bg-[#fffbf0]/80 transition-all flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
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
                          <span className="text-emerald-800 font-black bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-300">
                            💵 Chi phí: {formatVND(log.cost)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end items-end shrink-0">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition cursor-pointer"
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

      {/* MODAL GHI NHẬT KÝ BẢO TRÌ MỚI */}
      {isAddLogModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-[#cbb89d] space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
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
                    {SYSTEM_LABS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
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
          MODULE 5: QUẢN LÝ DUYỆT PHIẾU & BÁO CÁO SỬA CHỮA (ADMIN DASHBOARD)
          ==================================================================== */}
      {activeSubTab === 'admin' && (
        <div className="space-y-6 animate-fadeIn">
          {/* SEARCH & FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-[#cbb89d] shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 text-left">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Bảng Quản Lý Duyệt Phiếu & Sửa Chữa Sự Cố</span>
            </h3>

            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên giáo viên, lớp, máy hỏng..."
                value={adminSearchTerm}
                onChange={e => setAdminSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* TABLE 1: BOOKINGS LIST (CẤU TRÚC BẢNG VƯỜN TRI THỨC + PHỤC HỒI NÚT BẤM STYLED BUTTON) */}
          <div className="bg-white rounded-2xl border border-[#cbb89d] overflow-hidden shadow-xs text-left">
            <div className="p-4 border-b border-[#cbb89d] font-extrabold text-[#3d2b17] text-sm flex justify-between items-center bg-[#dfccb0]/30">
              <span>Danh Sách Phiếu Đăng Ký Mượn Phòng ({filteredBookings.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#dfccb0]/40 border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-4 whitespace-nowrap">GIÁO VIÊN</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">LỚP & SĨ SỐ</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">PHÒNG MÁY</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">MÔN HỌC</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">TRẠNG THÁI</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">THAO TÁC DUYỆT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic font-medium">
                        Chưa có dữ liệu phiếu đăng ký mượn phòng máy.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-[#fffbf0]/80 transition border-b border-slate-200/60">
                        <td className="py-3 px-4 font-extrabold text-slate-800 whitespace-nowrap">{b.teacherName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">{b.className} ({b.studentCount} HS)</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="bg-indigo-100 text-indigo-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-indigo-200">
                            {b.labId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{b.subject}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            b.status === 'Approved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}>
                            {b.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Approved')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Rejected')}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-200 transition cursor-pointer active:scale-95"
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

          {/* TABLE 2: INCIDENTS LIST (CẤU TRÚC BẢNG VƯỜN TRI THỨC + PHỤC HỒI NÚT BẤM ĐANG SỬA/ĐÃ XONG/XÓA) */}
          <div className="bg-white rounded-2xl border border-[#cbb89d] overflow-hidden shadow-xs text-left">
            <div className="p-4 border-b border-[#cbb89d] font-extrabold text-[#3d2b17] text-sm flex justify-between items-center bg-[#dfccb0]/30">
              <span>Danh Sách Báo Cáo Sự Cố Máy Tính ({filteredIncidents.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#dfccb0]/40 border-b border-[#cbb89d] text-[#3d2b17] font-black uppercase text-[11px] tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-4 whitespace-nowrap">VỊ TRÍ MÁY</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">LOẠI LỖI</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">MÔ TẢ SỰ CỐ</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">TRẠNG THÁI</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">THAO TÁC XỬ LÝ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic font-medium">
                        Không có báo cáo sự cố máy tính nào.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map(i => (
                      <tr key={i.id} className="hover:bg-[#fffbf0]/80 transition border-b border-slate-200/60">
                        <td className="py-3 px-4 font-black text-slate-800 whitespace-nowrap">
                          {i.labId} - Máy #{i.pcNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">{i.type}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{i.issue}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            i.status === 'Resolved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                            i.status === 'In Progress' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}>
                            {i.status === 'Resolved' ? 'Đã khắc phục' : i.status === 'In Progress' ? 'Đang sửa' : 'Chờ xử lý'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleUpdateIncidentStatus(i.id, 'In Progress')}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Đang sửa
                            </button>
                            <button
                              onClick={() => handleUpdateIncidentStatus(i.id, 'Resolved')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs transition cursor-pointer active:scale-95"
                            >
                              Đã xong
                            </button>
                            <button
                              onClick={() => handleDeleteIncident(i.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-200 transition cursor-pointer active:scale-95"
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
    </div>
  );
}
