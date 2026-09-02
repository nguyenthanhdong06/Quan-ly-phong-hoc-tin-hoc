import React, { useState, useMemo, useEffect } from 'react';
import { Member, Computer, Student, ClassItem, MotivationalQuote } from '../types';
import { UserCheck, Trash2, ShieldAlert, Heart, HardDrive, Cpu, Cloud, Check, Wifi, AlertTriangle, RefreshCw, Database, FileCode, CheckCircle2, X, Calendar, Plus, Clock, User, Sparkles, Settings, FileText, Printer, Save, Key, Lock, Eye, EyeOff, RotateCcw, Mail, Send, ArrowRight, ArrowLeft } from 'lucide-react';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState, supabase, SQL_INITIALIZATION_QUERY } from '../supabaseClient';
import { sendOtpToUser, GOOGLE_APPS_SCRIPT_GMAIL_TEMPLATE } from '../services/emailSmsOtpService';
import { encryptVaultData } from '../utils/security';
import { CloudKeysExplorer } from './CloudKeysExplorer';

interface AdminTabProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  computers: Computer[];
  setComputers: React.Dispatch<React.SetStateAction<Computer[]>>;
  currentUser: any;
  showToast: (message: string, type?: 'success' | 'error') => void;
  isSyncing?: boolean;
  supabaseError?: string | null;
  onForceSync?: () => Promise<void>;
  onForcePush?: () => Promise<void>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  timetableData: any;
  setTimetableData: React.Dispatch<React.SetStateAction<any>>;
  classes: ClassItem[];
  quotes: MotivationalQuote[];
  setQuotes: React.Dispatch<React.SetStateAction<MotivationalQuote[]>>;
}

export default function AdminTab({
  members,
  setMembers,
  computers,
  setComputers,
  currentUser,
  showToast,
  isSyncing = false,
  supabaseError = null,
  onForceSync,
  onForcePush,
  students,
  setStudents,
  timetableData,
  setTimetableData,
  classes,
  quotes,
  setQuotes
}: AdminTabProps) {

  const [activeSubTab, setActiveSubTab] = useState<'giang_day' | 'phan_quyen' | 'danh_ngon' | 'email_sms' | 'he_thong' | 'database'>('giang_day');

  // Email & SMS Config States
  const [otpProvider, setOtpProvider] = useState<string>(() => localStorage.getItem('school_otp_provider') || 'emailjs');
  const [emailApiKey, setEmailApiKey] = useState<string>(() => localStorage.getItem('school_email_api_key') || '');
  const [emailServiceId, setEmailServiceId] = useState<string>(() => localStorage.getItem('school_email_service_id') || '');
  const [emailTemplateId, setEmailTemplateId] = useState<string>(() => localStorage.getItem('school_email_template_id') || '');
  const [senderEmail, setSenderEmail] = useState<string>(() => localStorage.getItem('school_sender_email') || 'nguyenthanhdong.hutech@gmail.com');
  const [smsApiKey, setSmsApiKey] = useState<string>(() => localStorage.getItem('school_sms_api_key') || '');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Supabase Database Connection Tester
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testConnStatus, setTestConnStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    try {
      const { data, error } = await supabase.from('school_states').select('key').limit(1);
      if (error) {
        setTestConnStatus('ERROR');
        showToast('Kết nối Supabase thất bại: ' + error.message, 'error');
      } else {
        setTestConnStatus('SUCCESS');
        showToast('Kết nối Supabase Cloud hoàn toàn thông suốt (Bảng school_states sẵn sàng)!', 'success');
      }
    } catch (e: any) {
      setTestConnStatus('ERROR');
      showToast('Lỗi kết nối: ' + (e?.message || e), 'error');
    } finally {
      setIsTestingConn(false);
    }
  };

  // States for Create Account Inline View & Highlight focus
  const [isCreateAccountViewOpen, setIsCreateAccountViewOpen] = useState(false);
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);

  const handleSaveOtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const configPayload = {
      provider: otpProvider,
      apiKey: emailApiKey.trim(),
      serviceId: emailServiceId.trim(),
      templateId: emailTemplateId.trim(),
      senderEmail: senderEmail.trim(),
      smsApiKey: smsApiKey.trim()
    };

    localStorage.setItem('school_otp_provider', configPayload.provider);
    localStorage.setItem('school_email_api_key', configPayload.apiKey);
    localStorage.setItem('school_email_service_id', configPayload.serviceId);
    localStorage.setItem('school_email_template_id', configPayload.templateId);
    localStorage.setItem('school_sender_email', configPayload.senderEmail);
    localStorage.setItem('school_sms_api_key', configPayload.smsApiKey);

    // Mã hóa bảo mật và đẩy cấu hình EmailJS lên Supabase Cloud Vault
    const encryptedVaultPayload = encryptVaultData(configPayload);
    const cloudSaved = await saveSupabaseState('school_otp_config', encryptedVaultPayload);

    if (cloudSaved) {
      showToast('🔐 Đã mã hóa & đồng bộ cấu hình EmailJS lên Supabase Cloud Vault! Mọi thiết bị khác sẽ tự động sử dụng mà không cần cấu hình lại.', 'success');
    } else {
      showToast('⚙️ Đã lưu cấu hình EmailJS cục bộ trên thiết bị này!', 'success');
    }
  };

  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyGoogleScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_GMAIL_TEMPLATE);
    setCopiedScript(true);
    showToast('⚡ Đã sao chép mã nguồn Google Apps Script gửi Gmail tự động thành công!');
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleTestSendEmail = async () => {
    const testTargetEmail = (currentUser?.email || senderEmail || 'nguyenthanhdong.hutech@gmail.com').trim();
    if (!testTargetEmail) {
      showToast('Vui lòng nhập Email người nhận thử nghiệm!', 'error');
      return;
    }
    setIsTestingEmail(true);
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      const res = await sendOtpToUser(
        'admin',
        currentUser?.name || 'Quản trị viên',
        testTargetEmail,
        currentUser?.phone,
        testOtp,
        {
          provider: otpProvider,
          apiKey: emailApiKey,
          serviceId: emailServiceId,
          templateId: emailTemplateId,
          senderEmail: senderEmail
        }
      );
      showToast(`✉️ ${res.message}`, res.message.includes('thành công') ? 'success' : 'error');
    } catch (err: any) {
      showToast(`Không thể gửi Email thử nghiệm: ${err?.message || 'Lỗi phát thư'}`, 'error');
    } finally {
      setIsTestingEmail(false);
    }
  };

  // States for adding member
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Giáo viên bộ môn');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Change Password Modal States
  const [changePasswordUser, setChangePasswordUser] = useState<Member | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleOpenChangePassword = (member: Member) => {
    if (!isRootAdmin && (member.id === 'u-1' || member.role.includes('Quản trị hệ thống'))) {
      showToast('⚠️ Quyền Quản trị viên không được phép sửa mật khẩu của Quản trị hệ thống (Admin).', 'error');
      return;
    }
    setChangePasswordUser(member);
    setNewPasswordInput('');
    setShowNewPassword(false);
  };

  const handleSavePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordUser) return;
    const cleanPass = newPasswordInput.trim();
    if (!cleanPass || cleanPass.length < 4) {
      showToast('Mật khẩu mới phải có từ 4 ký tự trở lên!', 'error');
      return;
    }

    const updatedMembers = members.map(m =>
      m.id === changePasswordUser.id ? { ...m, password: cleanPass } : m
    );

    setMembers(updatedMembers);
    safeSetLocalStorage('school_members', updatedMembers);
    await saveSupabaseState('school_members', updatedMembers);

    showToast(`🔑 Đã đổi mật khẩu cho tài khoản "${changePasswordUser.name}" (${changePasswordUser.username}) thành công!`, 'success');
    setChangePasswordUser(null);
    setNewPasswordInput('');
  };

  const handleResetToDefaultPassword = async (member: Member) => {
    if (!isRootAdmin && (member.id === 'u-1' || member.role.includes('Quản trị hệ thống'))) {
      showToast('⚠️ Quyền Quản trị viên không được phép reset mật khẩu của Quản trị hệ thống (Admin).', 'error');
      return;
    }
    if (window.confirm(`Xác nhận reset mật khẩu của tài khoản "${member.name}" (${member.username}) về mặc định (phongmay@123)?`)) {
      const defaultPass = 'phongmay@123';
      const updatedMembers = members.map(m =>
        m.id === member.id ? { ...m, password: defaultPass } : m
      );

      setMembers(updatedMembers);
      safeSetLocalStorage('school_members', updatedMembers);
      await saveSupabaseState('school_members', updatedMembers);

      showToast(`🔄 Đã reset mật khẩu tài khoản "${member.name}" về mặc định: phongmay@123!`, 'success');
    }
  };

  // Quotes management states & handlers
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim()) {
      showToast('Nội dung câu nói không được để trống!', 'error');
      return;
    }
    const newQuote: MotivationalQuote = {
      id: `quote-${Date.now()}`,
      text: quoteText.trim(),
      author: quoteAuthor.trim() || 'Khuyết danh',
      isActive: quotes.length === 0
    };
    setQuotes(prev => [...prev, newQuote]);
    setQuoteText('');
    setQuoteAuthor('');
    showToast('Đã thêm câu nói tạo động lực mới thành công!', 'success');
  };

  const handleDeleteQuote = (id: string) => {
    setQuotes(prev => {
      const filtered = prev.filter(q => q.id !== id);
      const wasActive = prev.find(q => q.id === id)?.isActive;
      if (wasActive && filtered.length > 0) {
        filtered[0].isActive = true;
      }
      return filtered;
    });
    showToast('Đã xóa câu nói thành công!', 'success');
  };

  const handleSetActiveQuote = (id: string) => {
    setQuotes(prev => prev.map(q => ({
      ...q,
      isActive: q.id === id
    })));
    showToast('Đã đặt làm câu nói hiển thị chính trên bảng tin!', 'success');
  };

  // States for Active Scheduler Teacher
  const [selectedTeacherUsername, setSelectedTeacherUsername] = useState<string>(() => {
    return localStorage.getItem('timetable_selected_teacher') || currentUser?.username || (members[0] ? members[0].username : 'dong.nt');
  });

  // Helpers to fetch custom title and signature per teacher
  const getTeacherTitle = (username: string) => {
    if (!username) return 'THỜI KHÓA BIỂU (2025-2026) TỪ 09/09/2025';
    return localStorage.getItem(`timetable_title_${username}`)
      || localStorage.getItem('timetable_custom_title')
      || 'THỜI KHÓA BIỂU (2025-2026) TỪ 09/09/2025';
  };

  const getTeacherSignature = (username: string) => {
    if (!username) return 'GVBM';
    return localStorage.getItem(`timetable_signature_${username}`)
      || localStorage.getItem('timetable_custom_signature')
      || 'GVBM';
  };

  // Configurable Timetable Title and Signature Title (Editable per teacher)
  const [timetableTitle, setTimetableTitle] = useState<string>(() => {
    const initialTeacher = localStorage.getItem('timetable_selected_teacher') || currentUser?.username || (members[0] ? members[0].username : 'dong.nt');
    return getTeacherTitle(initialTeacher);
  });

  const [signatureTitle, setSignatureTitle] = useState<string>(() => {
    const initialTeacher = localStorage.getItem('timetable_selected_teacher') || currentUser?.username || (members[0] ? members[0].username : 'dong.nt');
    return getTeacherSignature(initialTeacher);
  });

  // Save title and signature config for the selected teacher
  const handleSaveTitleConfig = () => {
    if (selectedTeacherUsername) {
      localStorage.setItem(`timetable_title_${selectedTeacherUsername}`, timetableTitle);
      localStorage.setItem(`timetable_signature_${selectedTeacherUsername}`, signatureTitle);
    }
    localStorage.setItem('timetable_custom_title', timetableTitle);
    localStorage.setItem('timetable_custom_signature', signatureTitle);
    window.dispatchEvent(new Event('timetable_config_updated'));
    window.dispatchEvent(new Event('storage'));
    const teacherObj = members.find(m => m.username === selectedTeacherUsername);
    const nameStr = teacherObj ? teacherObj.name : selectedTeacherUsername;
    showToast(`Đã lưu tiêu đề TKB & mục ký cho giáo viên ${nameStr}!`, 'success');
  };

  // Keep state synchronized in real time with localStorage and custom events
  useEffect(() => {
    const handleSync = () => {
      const savedTeacher = localStorage.getItem('timetable_selected_teacher') || selectedTeacherUsername;
      if (savedTeacher !== selectedTeacherUsername) {
        setSelectedTeacherUsername(savedTeacher);
      }
      setTimetableTitle(getTeacherTitle(savedTeacher));
      setSignatureTitle(getTeacherSignature(savedTeacher));
    };
    handleSync();
    window.addEventListener('timetable_config_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('timetable_config_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [selectedTeacherUsername]);

  // Cell assignment states
  const [editingCell, setEditingCell] = useState<{ day: string; period: string } | null>(null);
  const [formSubject, setFormSubject] = useState('Tin học');
  const [formClass, setFormClass] = useState('');

  // Helper to open cell editing modal
  const handleCellClick = (day: string, period: string) => {
    const teacherSchedule = timetableData[selectedTeacherUsername] || {};
    const current = teacherSchedule[`${day}-${period}`];
    setFormSubject(current ? current.subject : 'Tin học');
    setFormClass(current ? current.className : '');
    setEditingCell({ day, period });
  };

  // Helper to save assignment
  const handleSaveAssignment = () => {
    if (!editingCell) return;
    
    if (!formClass.trim()) {
      showToast('Tên lớp không được để trống! Vui lòng điền thông tin hoặc chọn nhãn gợi ý.', 'error');
      return;
    }

    const teacherSchedule = { ...(timetableData[selectedTeacherUsername] || {}) };
    teacherSchedule[`${editingCell.day}-${editingCell.period}`] = {
      subject: formSubject.trim(),
      className: formClass.trim()
    };

    setTimetableData((prev: any) => ({
      ...prev,
      [selectedTeacherUsername]: teacherSchedule
    }));

    setEditingCell(null);
    showToast(`Đã lưu thời khóa biểu Tiết ${editingCell.period} - Thứ ${editingCell.day} thành công!`, 'success');
  };

  // Helper to clear/delete assignment
  const handleDeleteAssignment = () => {
    if (!editingCell) return;

    const teacherSchedule = { ...(timetableData[selectedTeacherUsername] || {}) };
    delete teacherSchedule[`${editingCell.day}-${editingCell.period}`];

    setTimetableData((prev: any) => ({
      ...prev,
      [selectedTeacherUsername]: teacherSchedule
    }));

    setEditingCell(null);
    showToast(`Đã gỡ phân công Tiết ${editingCell.period} - Thứ ${editingCell.day}!`, 'success');
  };

  // Super-script click appender helper for class selection
  const handleAddSuperscript = (char: string) => {
    setFormClass((prev) => prev + char);
  };


  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Họ tên và địa chỉ Email không được để trống!', 'error');
      return;
    }

    const usernameMatch = newEmail.split('@')[0];
    const usernameClean = usernameMatch ? usernameMatch.trim().toLowerCase() : `gv-${Date.now()}`;

    if (members.some(m => m.username === usernameClean)) {
      showToast('Tài khoản Email này đã được đăng ký hoặc trùng username hệ thống!', 'error');
      return;
    }

    // Bảo vệ quyền Quản trị hệ thống (Admin): Chỉ có Root Admin độc quyền, không tạo mới ngang hàng
    let assignedRole = newRole;
    if (assignedRole === 'Quản trị hệ thống (Admin)' || assignedRole.includes('Quản trị hệ thống') || assignedRole === 'Quản trị viên') {
      assignedRole = 'Giáo viên bộ môn';
    }

    const item: Member = {
      id: `u-${Date.now()}`,
      name: newName.trim(),
      role: assignedRole,
      email: newEmail.trim(),
      phone: newPhone.trim() || 'Chưa cung cấp',
      username: usernameClean,
      password: 'phongmay@123'
    };

    const updatedMembers = [...members, item];
    setMembers(updatedMembers);
    safeSetLocalStorage('school_members', updatedMembers);
    await saveSupabaseState('school_members', updatedMembers);

    // Reset Form
    setNewName('');
    setNewRole('Giáo viên bộ môn');
    setNewEmail('');
    setNewPhone('');

    // Đóng chế độ tạo inline view & focus tới tài khoản mới tạo
    setHighlightedMemberId(item.id);
    setIsCreateAccountViewOpen(false);
    showToast(`🎉 Đã tạo thành công tài khoản cho Giáo viên ${item.name} (${item.username})!`, 'success');

    // Tự động cuộn và highlight dòng tài khoản mới trong danh sách
    setTimeout(() => {
      const rowElem = document.getElementById(`member-row-${item.id}`);
      if (rowElem) {
        rowElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!isRootAdmin) {
      showToast('⚠️ Quyền Quản trị viên không được phép xóa tài khoản cán bộ giáo viên. Thao tác xóa chỉ dành cho Quản trị hệ thống (Admin).', 'error');
      return;
    }
    if (id === 'u-1') {
      showToast('Thầy cô không thể xóa tài khoản Quản trị hệ thống tối cao này!', 'error');
      return;
    }
    const updatedMembers = members.filter(m => m.id !== id);
    setMembers(updatedMembers);
    safeSetLocalStorage('school_members', updatedMembers);
    await saveSupabaseState('school_members', updatedMembers);
    showToast(`Đã hủy quyền truy cập hệ thống của: ${name}`);
  };

  // Reset all computers to functional
  const handleResetComputers = () => {
    setComputers(prev => prev.map(c => ({
      ...c,
      status: 'Hoạt động'
    })));
    showToast('Đã khởi chạy bảo dưỡng, đồng loạt thiết lập 40 máy trạm về trạng thái rực rỡ Hoạt động Tốt!');
  };

  // Delete all students from system
  const handleDeleteAllStudents = () => {
    if (!isRootAdmin) {
      showToast('⚠️ Quyền Quản trị viên không được phép xóa toàn bộ dữ liệu học sinh!', 'error');
      return;
    }
    setStudents([]);
    setIsDeleteConfirmOpen(false);
    showToast('Đã xóa toàn bộ danh sách học sinh trên hệ thống thành công!', 'success');
  };

  // Copy SQL instructions
  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_INITIALIZATION_QUERY);
    setCopiedSql(true);
    showToast('Đã sao chép mã lệnh SQL khởi tạo Supabase!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Phân biệt Root Admin (Quản trị hệ thống) và Sub-Admin (Quản trị viên)
  const isRootAdmin = currentUser?.id === 'u-1' || currentUser?.role?.includes('Quản trị hệ thống');

  const SUB_TABS = [
    {
      id: 'giang_day',
      label: 'Phân công giảng dạy',
      icon: Calendar,
      activeClass: 'bg-[#ff9f00] hover:bg-[#e68e00] text-white border-transparent shadow-xs shadow-[#ff9f00]/20',
      inactiveClass: 'bg-[#ff9f00]/8 text-[#d48200] hover:bg-[#ff9f00]/15 border-transparent',
      rootOnly: false
    },
    {
      id: 'phan_quyen',
      label: 'Phân quyền',
      icon: UserCheck,
      activeClass: 'bg-[#00a36c] hover:bg-[#008f5e] text-white border-transparent shadow-xs shadow-[#00a36c]/20',
      inactiveClass: 'bg-[#00a36c]/8 text-[#00875a] hover:bg-[#00a36c]/15 border-transparent',
      rootOnly: false
    },
    {
      id: 'danh_ngon',
      label: 'Danh ngôn',
      icon: Sparkles,
      activeClass: 'bg-[#5837fa] hover:bg-[#472bd1] text-white border-transparent shadow-xs shadow-[#5837fa]/20',
      inactiveClass: 'bg-[#5837fa]/8 text-[#472bd1] hover:bg-[#5837fa]/15 border-transparent',
      rootOnly: false
    },
    {
      id: 'email_sms',
      label: 'Cấu hình Email & SMS OTP',
      icon: Mail,
      activeClass: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-transparent shadow-xs shadow-[#2563eb]/20',
      inactiveClass: 'bg-[#2563eb]/8 text-[#1d4ed8] hover:bg-[#2563eb]/15 border-transparent',
      rootOnly: true
    },
    {
      id: 'he_thong',
      label: 'Hệ thống quan trọng',
      icon: ShieldAlert,
      activeClass: 'bg-[#9c13f7] hover:bg-[#850ee0] text-white border-transparent shadow-xs shadow-[#9c13f7]/20',
      inactiveClass: 'bg-[#9c13f7]/8 text-[#850ee0] hover:bg-[#9c13f7]/15 border-transparent',
      rootOnly: true
    },
    {
      id: 'database',
      label: 'Cơ sở dữ liệu',
      icon: Database,
      activeClass: 'bg-[#1d5fa3] hover:bg-[#18508a] text-white border-transparent shadow-xs shadow-[#1d5fa3]/20',
      inactiveClass: 'bg-[#1d5fa3]/8 text-[#18508a] hover:bg-[#1d5fa3]/15 border-transparent',
      rootOnly: true
    }
  ] as const;

  const visibleSubTabs = SUB_TABS.filter(tab => !tab.rootOnly || isRootAdmin);

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Horizontal Sub-tabs Navigation */}
      <div className="bg-slate-50/30 p-2 rounded-2xl border border-slate-100/70 mb-6 overflow-x-auto">
        <div className="flex flex-row items-center gap-2.5 min-w-max">
          {visibleSubTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider border transition-all duration-200 cursor-pointer select-none ${
                  isActive 
                    ? `${tab.activeClass} transform scale-[1.02] -translate-y-[0.5px]` 
                    : `${tab.inactiveClass} active:scale-95`
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. THỜI KHÓA BIỂU GIẢNG DẠY (KHO VƯỜN TRI THỨC CARAMEL STYLING) */}
      {activeSubTab === 'giang_day' && (
        <div id="timetable-management-section" className="bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-3xl p-6 shadow-[0_20px_50px_rgba(80,55,25,0.15)] text-left space-y-6 animate-fadeIn">
        
        {/* Header bar */}
        <div className="bg-gradient-to-r from-[#ecdcc7] via-[#e5d3bc] to-[#ded0bb] p-4 rounded-2xl border border-[#d6c4a8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            <div className="bg-[#f4bf3b] p-3 rounded-2xl text-[#422e00] border border-[#dca31f] shadow-xs shrink-0">
              <Calendar className="w-6 h-6 text-[#422e00] animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#4a2e16] text-base uppercase tracking-wide flex items-center gap-2">
                <span>THỜI KHÓA BIỂU GIẢNG DẠY</span>
                <span className="text-[10px] bg-[#f5e6ca] text-[#713f12] font-black px-3 py-1 rounded-full border border-[#d6c4a8] shadow-2xs">
                  BẢNG PHÂN CÔNG ĐỐI CHIẾU
                </span>
              </h3>
              <p className="text-xs text-[#78350f] font-semibold mt-0.5">
                Nhấp trực tiếp lên các ô tiết học để phân công môn học & lớp học. Phân công riêng biệt cho từng giáo viên.
              </p>
            </div>
          </div>

          {/* Teacher Selector dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-[#fbf7ee] p-2.5 rounded-2xl border border-[#d6c4a8] shadow-2xs">
            <span className="text-xs font-black text-[#5c4326] uppercase flex items-center gap-1 shrink-0 ml-1">
              <User className="w-3.5 h-3.5 text-[#d97706]" /> Chọn Giáo viên phụ trách:
            </span>
            <select
              value={selectedTeacherUsername}
              onChange={(e) => {
                const newUsername = e.target.value;
                setSelectedTeacherUsername(newUsername);
                localStorage.setItem('timetable_selected_teacher', newUsername);
                window.dispatchEvent(new Event('timetable_config_updated'));
                window.dispatchEvent(new Event('storage'));
                showToast(`Đã chuyển sang xem TKB của giáo viên: ${members.find(m => m.username === newUsername)?.name || newUsername}`);
              }}
              className="border border-[#d6c4a8] bg-white rounded-xl p-2 text-xs font-black text-[#3d2514] focus:outline-none focus:ring-2 focus:ring-[#287866] cursor-pointer min-w-[200px] shadow-2xs"
            >
              {members.map((teacher) => (
                <option key={teacher.id} value={teacher.username}>
                  {teacher.name} ({teacher.username})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* EDITABLE CONFIGURATION SECTION FOR TIMETABLE TITLE AND SIGNATURE TITLE */}
        <div className="bg-[#fbf7ee] border-2 border-[#e5dacf] p-4 rounded-2xl shadow-xs text-left space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dacf] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="bg-[#f4bf3b] text-[#422e00] p-1.5 rounded-xl border border-[#dca31f]">
                <Settings className="w-4 h-4 text-[#422e00]" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#4a2e16] flex items-center gap-2">
                  <span>Cấu hình Tiêu đề & Mục ký tên thời khóa biểu</span>
                  <span className="bg-[#f5e6ca] text-[#713f12] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#d6c4a8]">
                    Áp dụng riêng: {members.find(m => m.username === selectedTeacherUsername)?.name || selectedTeacherUsername}
                  </span>
                </h3>
                <p className="text-[10px] text-[#78350f] font-semibold">
                  Tùy chỉnh tiêu đề và mục ký tên áp dụng riêng cho giáo viên đang chọn. Bấm nút Lưu để lưu cố định cho giáo viên này.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveTitleConfig}
              className="bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-4 py-2 rounded-full border border-[#16473c] shadow-md transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu tiêu đề giáo viên</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0.5">
            {/* Input 1: Tiêu đề thời khóa biểu */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <span>Tiêu đề thời khóa biểu ({members.find(m => m.username === selectedTeacherUsername)?.name})</span>
              </label>
              <input
                type="text"
                value={timetableTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  setTimetableTitle(val);
                  if (selectedTeacherUsername) {
                    localStorage.setItem(`timetable_title_${selectedTeacherUsername}`, val);
                  }
                  localStorage.setItem('timetable_custom_title', val);
                  window.dispatchEvent(new Event('timetable_config_updated'));
                  window.dispatchEvent(new Event('storage'));
                }}
                className="w-full bg-white text-slate-900 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-slate-700/60 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-xs"
                placeholder="THỜI KHÓA BIỂU (2025-2026) TỪ 09/09/2025"
              />
            </div>

            {/* Input 2: Mục tiêu đề ký */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <span>Mục tiêu đề ký</span>
              </label>
              <input
                type="text"
                value={signatureTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  setSignatureTitle(val);
                  if (selectedTeacherUsername) {
                    localStorage.setItem(`timetable_signature_${selectedTeacherUsername}`, val);
                  }
                  localStorage.setItem('timetable_custom_signature', val);
                  window.dispatchEvent(new Event('timetable_config_updated'));
                  window.dispatchEvent(new Event('storage'));
                }}
                className="w-full bg-white text-slate-900 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-slate-700/60 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-xs"
                placeholder="GVBM"
              />
            </div>
          </div>
        </div>

        {/* Timetable visual responsive table wrapper */}
        <div className="overflow-x-auto border border-slate-200 rounded-3xl bg-slate-50/50 p-2">
          <table className="w-full border-collapse border border-slate-300 text-center text-xs min-w-[700px]">
            
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider whitespace-nowrap">
                <th className="border border-slate-300 py-3 px-2 w-[130px] whitespace-nowrap">THỜI GIAN</th>
                <th className="border border-slate-300 py-3 px-2 w-[90px] whitespace-nowrap">TIẾT</th>
                <th className="border border-slate-300 py-3 px-3 whitespace-nowrap">THỨ HAI</th>
                <th className="border border-slate-300 py-3 px-3 whitespace-nowrap">THỨ BA</th>
                <th className="border border-slate-300 py-3 px-3 whitespace-nowrap">THỨ TƯ</th>
                <th className="border border-slate-300 py-3 px-3 whitespace-nowrap">THỨ NĂM</th>
                <th className="border border-slate-300 py-3 px-3 whitespace-nowrap">THỨ SÁU</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              
              {/* --- BUỔI SÁNG --- */}
              {/* Row 1 - Tiết 1 */}
              <tr className="bg-white hover:bg-slate-50/40 transition">
                <td className="border border-slate-300 font-black text-slate-800 tracking-wider text-[11px] bg-slate-50/55" rowSpan={5}>
                  <div className="flex flex-col items-center justify-center p-2">
                    <span className="text-amber-500 text-lg">☀️</span>
                    <span className="font-black tracking-widest text-[#0c2a5c] uppercase text-xs">SÁNG</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">7h00 - 10h10</span>
                  </div>
                </td>
                <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Sáng 1</td>
                {['2', '3', '4', '5', '6'].map((day) => {
                  const data = (timetableData[selectedTeacherUsername] || {})[`${day}-1`];
                  return (
                    <td 
                      key={`1-${day}`} 
                      id={`cell-${day}-1`}
                      onClick={() => handleCellClick(day, '1')}
                      className="border border-slate-300 p-3.5 transition relative cursor-pointer group hover:bg-amber-50 select-none min-h-[64px]"
                    >
                      {data ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0c2a5c] uppercase text-xs">{data.subject}</p>
                          <span className="inline-flex bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                            Lớp {data.className}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 group-hover:text-slate-500 italic transition font-semibold flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500" /> Trống
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 2 - Tiết 2 */}
              <tr className="bg-white hover:bg-slate-50/40 transition">
                <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Sáng 2</td>
                {['2', '3', '4', '5', '6'].map((day) => {
                  const data = (timetableData[selectedTeacherUsername] || {})[`${day}-2`];
                  return (
                    <td 
                      key={`2-${day}`}
                      id={`cell-${day}-2`}
                      onClick={() => handleCellClick(day, '2')}
                      className="border border-slate-300 p-3.5 transition relative cursor-pointer group hover:bg-amber-50 select-none min-h-[64px]"
                    >
                      {data ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0c2a5c] uppercase text-xs">{data.subject}</p>
                          <span className="inline-flex bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                            Lớp {data.className}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 group-hover:text-slate-500 italic transition font-semibold flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500" /> Trống
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* BAR FOR GIỜ RA CHƠI (Spans across all 5 weekdays) */}
              <tr className="bg-emerald-550/10 text-center tracking-widest text-[11px] font-bold bg-emerald-50 text-[#0c2a2c]">
                <td className="border border-slate-300 py-3 bg-slate-100/70" colSpan={1}>
                  <div className="flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </td>
                <td className="border border-slate-300 py-3 text-emerald-900 font-black uppercase tracking-wider" colSpan={5}>
                  ☕ GIỜ RA CHƠI (GIẢI LAO PHÒNG MÁY)
                </td>
              </tr>

              {/* Row 3 - Tiết 3 */}
              <tr className="bg-white hover:bg-slate-50/40 transition">
                <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Sáng 3</td>
                {['2', '3', '4', '5', '6'].map((day) => {
                  const data = (timetableData[selectedTeacherUsername] || {})[`${day}-3`];
                  return (
                    <td 
                      key={`3-${day}`}
                      id={`cell-${day}-3`}
                      onClick={() => handleCellClick(day, '3')}
                      className="border border-slate-300 p-3.5 transition relative cursor-pointer group hover:bg-amber-50 select-none min-h-[64px]"
                    >
                      {data ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0c2a5c] uppercase text-xs">{data.subject}</p>
                          <span className="inline-flex bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                            Lớp {data.className}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 group-hover:text-slate-500 italic transition font-semibold flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500" /> Trống
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 4 - Tiết 4 */}
              <tr className="bg-white hover:bg-slate-50/40 transition">
                <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Sáng 4</td>
                {['2', '3', '4', '5', '6'].map((day) => {
                  const data = (timetableData[selectedTeacherUsername] || {})[`${day}-4`];
                  return (
                    <td 
                      key={`4-${day}`}
                      id={`cell-${day}-4`}
                      onClick={() => handleCellClick(day, '4')}
                      className="border border-slate-300 p-3.5 transition relative cursor-pointer group hover:bg-amber-50 select-none min-h-[64px]"
                    >
                      {data ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0c2a5c] uppercase text-xs">{data.subject}</p>
                          <span className="inline-flex bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                            Lớp {data.className}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 group-hover:text-slate-500 italic transition font-semibold flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500" /> Trống
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* --- BUỔI CHIỀU --- */}
              {/* Row 5 - Tiết 5 */}
              <tr className="bg-white hover:bg-slate-50/40 transition">
                <td className="border border-slate-300 font-black text-slate-800 tracking-wider text-[11px] bg-slate-50/55" rowSpan={3}>
                  <div className="flex flex-col items-center justify-center p-2">
                    <span className="text-teal-600 text-lg">🌇</span>
                    <span className="font-black tracking-widest text-[#0c2a5c] uppercase text-xs">CHIỀU</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">14h00 - 16h10</span>
                  </div>
                </td>
                <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Chiều 5</td>
                {['2', '3', '4', '5', '6'].map((day) => {
                  const data = (timetableData[selectedTeacherUsername] || {})[`${day}-5`];
                  return (
                    <td 
                      key={`5-${day}`}
                      id={`cell-${day}-5`}
                      onClick={() => handleCellClick(day, '5')}
                      className="border border-slate-300 p-3.5 transition relative cursor-pointer group hover:bg-amber-50 select-none min-h-[64px]"
                    >
                      {data ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0c2a5c] uppercase text-xs">{data.subject}</p>
                          <span className="inline-flex bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                            Lớp {data.className}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 group-hover:text-slate-500 italic transition font-semibold flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500" /> Trống
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 6 - Tiết 6 */}
              <tr className="bg-white hover:bg-slate-50/40 transition">
                <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Chiều 6</td>
                {['2', '3', '4', '5', '6'].map((day) => {
                  const data = (timetableData[selectedTeacherUsername] || {})[`${day}-6`];
                  return (
                    <td 
                      key={`6-${day}`}
                      id={`cell-${day}-6`}
                      onClick={() => handleCellClick(day, '6')}
                      className="border border-slate-300 p-3.5 transition relative cursor-pointer group hover:bg-amber-50 select-none min-h-[64px]"
                    >
                      {data ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0c2a5c] uppercase text-xs">{data.subject}</p>
                          <span className="inline-flex bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                            Lớp {data.className}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 group-hover:text-slate-500 italic transition font-semibold flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500" /> Trống
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 7 - Tiết 7 */}
              <tr className="bg-white hover:bg-slate-50/40 transition">
                <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Chiều 7</td>
                {['2', '3', '4', '5', '6'].map((day) => {
                  const data = (timetableData[selectedTeacherUsername] || {})[`${day}-7`];
                  return (
                    <td 
                      key={`7-${day}`}
                      id={`cell-${day}-7`}
                      onClick={() => handleCellClick(day, '7')}
                      className="border border-slate-300 p-3.5 transition relative cursor-pointer group hover:bg-amber-50 select-none min-h-[64px]"
                    >
                      {data ? (
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#0c2a5c] uppercase text-xs">{data.subject}</p>
                          <span className="inline-flex bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                            Lớp {data.className}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 group-hover:text-slate-500 italic transition font-semibold flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500" /> Trống
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Notes matching bottom of the paper */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-xs font-semibold text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border">
          <div className="space-y-1">
            <span className="block font-black text-[#0c2a5c] uppercase text-[10px]">📌 Ghi chú thời gian và lộ trình biểu mẫu (Lũy kế):</span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><strong>SÁNG:</strong> Vào lớp: <strong>7h00</strong>. Ra về: <strong>10h10</strong></li>
              <li><strong>CHIỀU:</strong> Vào lớp: <strong>14h00</strong>. Ra về: <strong>16h10</strong></li>
              <li>Thời khóa biểu được hiển thị độc lập cho từng giáo viên được lựa chọn ở trình đơn phía trên.</li>
            </ul>
          </div>
          <div className="space-y-1 sm:max-w-xs text-right sm:text-left">
            <span className="block font-black text-slate-800 uppercase text-[10px]">💡 HƯỚNG DẪN QUẢN TRỊ VIÊN:</span>
            <p className="text-[11px] text-slate-400 font-medium">
              Quý thầy cô chỉ cần nhấp trực tiếp vào ô tương ứng trên lưới. Sau khi hoàn thành lựa chọn bộ môn và định danh mã lớp, hãy nhấp <strong>"Lưu phân công"</strong> để hệ thống tự động lưu trữ cục bộ và đồng bộ điện toán đám mây.
            </p>
          </div>
        </div>

      </div>
      )}

      {/* 2. QUẢN LÝ THÀNH VIÊN VÀ QUYỀN HẠN TRUY CẬP (INLINE VIEW & FULL TABLE) */}
      {activeSubTab === 'phan_quyen' && (
        <div className="space-y-6 animate-fadeIn text-left">
          {isCreateAccountViewOpen ? (
            /* --- INLINE VIEW 100% FULL WIDTH: FORM TẠO TÀI KHOẢN MỚI --- */
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 animate-fadeIn max-w-4xl mx-auto">
              
              {/* Inline View Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 border border-amber-100">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base uppercase tracking-wide flex items-center gap-2">
                      <span>Cấp Quyền & Tạo Tài Khoản Giáo Viên Mới</span>
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                        Chế độ Inline View 100%
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Nhập thông tin Giáo viên và thiết lập phân quyền cấp dưới trong Nhà trường
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateAccountViewOpen(false)}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                  <span>Quay về danh sách</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddMember} className="space-y-5 text-xs">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Họ và Tên */}
                  <div>
                    <label className="block font-black uppercase text-slate-600 text-[11px] mb-1.5">
                      Họ và Tên Giáo viên *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nhập đầy đủ họ và tên (Ví dụ: Nguyễn Văn An)..."
                      className="w-full bg-slate-50/50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Quyền Hạn Hệ Thống (Phân Cấp) */}
                  <div>
                    <label className="block font-black uppercase text-slate-600 text-[11px] mb-1.5">
                      Phân quyền & Vai trò *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-300 rounded-xl p-3 text-xs font-extrabold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Giáo viên bộ môn">Giáo viên bộ môn (Chấm điểm + Điểm danh + Quản lý Lớp)</option>
                      <option value="Giáo viên Chủ nhiệm">Giáo viên Chủ nhiệm</option>
                      <option value="Tổ trưởng chuyên môn">Tổ trưởng chuyên môn</option>
                    </select>
                    <p className="text-[10px] text-amber-700 font-medium mt-1">
                      📌 *Lưu ý: Quyền "Quản trị hệ thống (Admin)" là cấp cao nhất độc quyền, không được cấp cho tài khoản tạo mới.
                    </p>
                  </div>

                  {/* Email Trường học / Gmail */}
                  <div>
                    <label className="block font-black uppercase text-slate-600 text-[11px] mb-1.5">
                      Địa chỉ Email *
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Ví dụ: nguyenvanan@gmail.com"
                      className="w-full bg-slate-50/50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tên đăng nhập (Username) sẽ tự động lấy từ phần đầu Email.
                    </p>
                  </div>

                  {/* Số Điện Thoại */}
                  <div>
                    <label className="block font-black uppercase text-slate-600 text-[11px] mb-1.5">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Nhập số điện thoại (Ví dụ: 0912.345.678)..."
                      className="w-full bg-slate-50/50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Form Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateAccountViewOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition text-xs cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-xl shadow-md transition text-xs cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>Tạo tài khoản & Cấp quyền ngay</span>
                  </button>
                </div>

              </form>

            </div>
          ) : (
            /* --- FULL WIDTH 100% TABLE VIEW: THÀNH VIÊN GIÁO VIÊN (KHO VƯỜN TRI THỨC CARAMEL STYLING) --- */
            <div className="bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-3xl p-6 shadow-[0_20px_50px_rgba(80,55,25,0.15)] space-y-5 text-left select-none">
              
              {/* Header Banner with "➕ Thêm tài khoản" Button */}
              <div className="bg-gradient-to-r from-[#ecdcc7] via-[#e5d3bc] to-[#ded0bb] p-4 rounded-2xl border border-[#d6c4a8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#f4bf3b] p-3 rounded-2xl text-[#422e00] border border-[#dca31f] shadow-xs shrink-0">
                    <ShieldAlert className="w-6 h-6 text-[#422e00]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#4a2e16] text-base uppercase tracking-wide flex items-center gap-2">
                      <span>Thành Viên Giáo Viên Trong Nhà Trường</span>
                      <span className="text-[10px] bg-[#f5e6ca] text-[#713f12] font-black px-3 py-1 rounded-full border border-[#d6c4a8] shadow-2xs">
                        {members.length} tài khoản
                      </span>
                    </h3>
                    <p className="text-xs text-[#78350f] font-semibold mt-0.5">
                      Danh sách tài khoản cán bộ giáo viên, quản lý mật khẩu và phân quyền hệ thống
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateAccountViewOpen(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-5 py-2.5 rounded-full border border-[#16473c] shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 text-emerald-100" />
                  <span>Thêm tài khoản</span>
                </button>
              </div>

              {/* Full Width Table */}
              <div className="overflow-x-auto rounded-2xl border-2 border-[#d6c4a8] bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f5e6ca] border-b border-[#d6c4a8] text-[#5c4326] font-black text-[11px] uppercase tracking-wider whitespace-nowrap">
                      <th className="py-3.5 px-4 whitespace-nowrap">THÔNG TIN GIÁO VIÊN</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">ĐỊA CHỈ EMAIL / SỐ ĐIỆN THOẠI</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">PHÂN QUYỀN HỆ THỐNG</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">QUẢN LÝ MẬT KHẨU</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map(member => {
                      const isHighlighted = member.id === highlightedMemberId;
                      const isRootAdmin = member.id === 'u-1' || member.role.includes('Quản trị hệ thống');
                      return (
                        <tr
                          key={member.id}
                          id={`member-row-${member.id}`}
                          className={`transition duration-300 ${
                            isHighlighted
                              ? 'bg-amber-100/80 border-2 border-amber-400 font-bold ring-2 ring-amber-300'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                  <span>{member.name}</span>
                                  {isHighlighted && (
                                    <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">VỪA TẠO</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400">Username: <strong className="text-slate-600 font-mono">{member.username}</strong></p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-semibold text-slate-700">{member.email}</p>
                            <p className="text-[10px] text-slate-400">{member.phone}</p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            { (member.id === 'u-1' || member.role.includes('Quản trị hệ thống') || member.role === 'Admin') ? (
                              <span className="inline-flex items-center gap-1 bg-[#fef9c3] text-[#713f12] border border-[#fde047] font-black text-[11px] px-3.5 py-0.5 rounded-full shadow-2xs tracking-tight whitespace-nowrap select-none">
                                Quản trị hệ thống (Admin)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-[11px] px-3 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                                {member.role}
                              </span>
                            )}
                          </td>

                          {/* Quản lý Mật Khẩu: Đổi Mật Khẩu & Reset về mặc định (phongmay@123) */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleOpenChangePassword(member)}
                                className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200 transition cursor-pointer active:scale-95 shadow-2xs"
                                title="Đổi mật khẩu tài khoản này"
                              >
                                <Key className="w-3.5 h-3.5 text-amber-600" />
                                Đổi MK
                              </button>
                              <button
                                onClick={() => handleResetToDefaultPassword(member)}
                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-300 transition cursor-pointer active:scale-95 shadow-2xs"
                                title="Reset mật khẩu về mặc định (phongmay@123)"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                Reset MK
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {!isRootAdmin ? (
                              <button
                                onClick={() => handleDeleteMember(member.id, member.name)}
                                className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition inline-block focus:outline-none cursor-pointer"
                                title="Xóa thành viên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] italic text-slate-400 font-medium">Root Admin</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL ĐỔI MẬT KHẨU TÀI KHOẢN CHO ADMIN */}
      {changePasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5 text-left relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setChangePasswordUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b pb-3">
              <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                <Key className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">Đổi Mật Khẩu Tài Khoản</h3>
                <p className="text-xs text-slate-500 font-medium">Giáo viên: <strong className="text-slate-800">{changePasswordUser.name}</strong></p>
              </div>
            </div>

            <form onSubmit={handleSavePasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  disabled
                  value={changePasswordUser.username}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-mono font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu mới (ví dụ: phongmay@123)..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 pr-10 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Mật khẩu phải chứa từ 4 ký tự trở lên.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setChangePasswordUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-md shadow-amber-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Lưu Mật Khẩu Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUẢN LÝ CÂU NÓI TẠO ĐỘNG LỰC CHO HỌC SINH */}
      {activeSubTab === 'danh_ngon' && (
        <div id="motivational-quotes-section" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 text-left mb-6 animate-fadeIn">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="bg-amber-50 p-2 rounded-xl text-amber-600">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-base uppercase tracking-wide">
              Danh ngôn & Câu nói tạo động lực cho học sinh
            </h4>
            <p className="text-xs text-slate-400 font-semibold">Tùy chỉnh câu nói truyền cảm hứng hiển thị trên bảng đen ở trang chủ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form để thêm câu nói mới */}
          <form onSubmit={handleAddQuote} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h5 className="font-extrabold text-xs text-slate-600 uppercase tracking-wider">Thêm câu nói mới</h5>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase">Nội dung câu nói *</label>
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Ví dụ: Học vấn làm đẹp con người..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-slate-800 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase">Tác giả / Nguồn dẫn</label>
              <input
                type="text"
                value={quoteAuthor}
                onChange={(e) => setQuoteAuthor(e.target.value)}
                placeholder="Ví dụ: Ngạn ngữ Nga, V.I. Lênin..."
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-slate-800 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              Thêm vào danh sách
            </button>
          </form>

          {/* Danh sách các câu nói hiện có */}
          <div className="lg:col-span-2 space-y-3">
            <h5 className="font-extrabold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>Danh sách hiện có ({quotes.length})</span>
              <span className="text-[10px] lowercase text-slate-400 font-semibold">(Bấm "Kích hoạt" để hiển thị câu nói lên bảng đen)</span>
            </h5>

            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="p-3">Nội dung câu nói</th>
                    <th className="p-3 w-32">Tác giả</th>
                    <th className="p-3 w-40 text-center">Trạng thái</th>
                    <th className="p-3 w-16 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {quotes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium italic">
                        Chưa có câu nói nào. Hãy thêm một câu nói truyền động lực ở bên trái!
                      </td>
                    </tr>
                  ) : (
                    quotes.map((q) => (
                      <tr 
                        key={q.id} 
                        className={`hover:bg-slate-50 transition-colors ${q.isActive ? 'bg-amber-50/20' : ''}`}
                      >
                        <td className="p-3 align-middle font-semibold leading-relaxed">
                          “{q.text}”
                        </td>
                        <td className="p-3 align-middle font-bold text-slate-500">
                          {q.author}
                        </td>
                        <td className="p-3 align-middle text-center">
                          {q.isActive ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-black uppercase">
                              <Check className="w-3 h-3" /> Đang hiển thị
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetActiveQuote(q.id)}
                              className="bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-600 hover:text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Kích hoạt
                            </button>
                          )}
                        </td>
                        <td className="p-3 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteQuote(q.id)}
                            className="text-slate-350 hover:text-rose-600 transition p-1 cursor-pointer"
                            title="Xóa câu nói này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 3. TÍNH NĂNG BẢO TRÌ PHÒNG MÁY & DANGER ZONE (KHO VƯỜN TRI THỨC CARAMEL STYLING) */}
      {activeSubTab === 'he_thong' && (
        <div className="bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-3xl p-6 shadow-[0_20px_50px_rgba(80,55,25,0.15)] text-left space-y-6 animate-fadeIn select-none">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#ecdcc7] via-[#e5d3bc] to-[#ded0bb] p-4 rounded-2xl border border-[#d6c4a8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#f4bf3b] p-3 rounded-2xl text-[#422e00] border border-[#dca31f] shadow-xs shrink-0">
                <Cpu className="w-6 h-6 text-[#422e00] animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#4a2e16] text-base uppercase tracking-wide flex items-center gap-2">
                  <span>Hệ Thống Quan Trọng & Khôi Phục Khẩn Cấp</span>
                  <span className="text-[10px] bg-[#f5e6ca] text-[#713f12] font-black px-3 py-1 rounded-full border border-[#d6c4a8] shadow-2xs">
                    Bảo trì nâng cao
                  </span>
                </h3>
                <p className="text-xs text-[#78350f] font-semibold mt-0.5">
                  Các công cụ chẩn đoán thiết bị phần cứng phòng máy và khu vực quản trị dữ liệu học sinh
                </p>
              </div>
            </div>
          </div>

          <div id="maintenance-administration-section" className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          
          {/* Card 1: Hardware Emergency Diagnostics */}
          <div className="bg-[#fbf7ee] border-2 border-[#e5dacf] p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#e5dacf] pb-2">
              <div className="bg-[#f4bf3b] p-2 rounded-xl text-[#422e00] border border-[#dca31f]">
                <Cpu className="w-5 h-5 text-[#422e00]" />
              </div>
              <div>
                <h4 className="font-black text-[#4a2e16] text-sm uppercase tracking-wide">
                  Bảo dưỡng phòng thi khẩn cấp
                </h4>
                <p className="text-[10px] text-[#78350f] font-semibold">Công cụ phòng Lab công nghệ cao</p>
              </div>
            </div>
            
            <p className="text-xs text-[#5c4326] leading-relaxed font-semibold">
              Trong trường hợp kết thúc đợt kiểm tra học kỳ hoặc đã hoàn thành công tác bảo trì kỹ thuật cho phòng thi, thầy cô có thể nhanh chóng khôi phục trạng thái hoạt động tốt cho toàn bộ 40 máy trong lớp học bằng phím tắt bên dưới.
            </p>
            
            <div className="pt-2">
              <button
                onClick={handleResetComputers}
                className="bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-5 py-2.5 rounded-full border border-[#16473c] shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Cpu className="w-4 h-4 text-emerald-200" />
                <span>Reset tất cả 40 máy sang "Hoạt động tốt"</span>
              </button>
            </div>
          </div>

          {/* Card 2: Danger Zone for Student Records reset */}
          <div className="bg-[#fff5f5] border-2 border-[#fecaca] p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#fca5a5] pb-2">
              <div className="bg-rose-100 p-2 rounded-xl text-rose-700 border border-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-rose-900 text-sm uppercase tracking-wide">
                  Khu vực giới hạn bảo mật (Danger Zone)
                </h4>
                <p className="text-[10px] text-rose-700 font-semibold">Hành động bảo mật cấp cao</p>
              </div>
            </div>

            <p className="text-xs text-rose-950 leading-relaxed font-semibold">
              Hành động này sẽ <strong>xóa hoàn toàn</strong> danh sách học sinh ở tất cả các khối lớp đã thiết lập trong hệ thống. Quý thầy cô vui lòng cân nhắc kỹ trước khi thực hiện.
            </p>
            
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="bg-gradient-to-b from-[#ff3535] via-[#dc2626] to-[#991b1b] hover:from-[#ff4d4d] hover:to-[#b91c1c] text-white font-black text-xs px-5 py-2.5 rounded-full border border-[#991b1b] shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-100" />
                <span>Xóa toàn bộ học sinh ({students.length} em)</span>
              </button>
            </div>
          </div>

          </div>
        </div>
      )}

      {/* MODAL PHÂN CÔNG THỜI KHÓA BIỂU CHI TIẾT */}
      {editingCell && (
        <div id="school-timetable-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-fadeIn text-left">
            
            {/* Modal title */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-slate-950 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-950 flex items-center gap-1.5 animate-pulse">
                  <Calendar className="w-4.5 h-4.5" />
                  PHÂN CÔNG LỊCH GIẢNG DẠY
                </h4>
                <p className="text-[10px] text-slate-850 font-black">
                  Thứ {editingCell.day === '2' ? 'Hai' : editingCell.day === '3' ? 'Ba' : editingCell.day === '4' ? 'Tư' : editingCell.day === '5' ? 'Năm' : 'Sáu'} — Tiết {editingCell.period} ({parseInt(editingCell.period) <= 4 ? 'Sáng' : 'Chiều'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="bg-black/10 hover:bg-black/25 text-slate-950 rounded-full p-1.5 focus:outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Form Subject input segment */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">Học phần giảng dạy: *</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Ví dụ: Tin học, Lập trình..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-slate-800"
                />
                
                {/* Suggestions for subjects */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Tin học', 'Công nghệ', 'STEM', 'Kỹ năng số', 'Lập trình'].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setFormSubject(sub)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[9px] px-2.5 py-1 rounded-md transition cursor-pointer"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Class input segment */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">Mã Lớp được phân công: *</label>
                <input
                  type="text"
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  placeholder="Nhập tên lớp (Ví dụ: 4³, 3⁵, Ba 1...)"
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-black text-slate-800"
                />

                {/* Micro superscript helper appenders to match paper layout exactly! */}
                <div className="mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-dashed text-left space-y-1.5">
                  <span className="block text-[9px] font-black text-slate-400 tracking-widest uppercase">
                    Chữ số mũ nhanh (Tin học 4³, Tin học 3⁵...):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['¹', '²', '³', '⁴', '⁵', '⁶', '⁷'].map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleAddSuperscript(char)}
                        className="bg-white hover:bg-amber-100/80 border text-slate-800 w-7 h-7 flex items-center justify-center font-black rounded-lg transition text-xs shadow-sm cursor-pointer"
                        title={`Thêm ${char}`}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggestions for standard class codes of registered classes */}
                <div className="space-y-1.5 mt-3 text-left">
                  <span className="block text-[9px] font-black text-slate-400 tracking-widest uppercase">
                    Gợi ý nhanh từ danh sách lớp thực tế:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border rounded-lg bg-white">
                    {classes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormClass(c.name)}
                        className="border hover:border-amber-500 hover:bg-amber-50 text-slate-700 font-bold text-[9px] px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 text-xs pt-3 border-t border-slate-100">
                {/* Delete button if already assigned */}
                <button
                  type="button"
                  onClick={handleDeleteAssignment}
                  className="bg-red-50 hover:bg-red-100 text-red-650 font-black px-4 py-3 rounded-xl block cursor-pointer transition text-center order-2 sm:order-1 sm:mr-auto"
                >
                  Xóa phân công
                </button>
                
                <div className="flex gap-2 order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => setEditingCell(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-3 rounded-xl block cursor-pointer transition flex-1 text-center"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssignment}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-3 rounded-xl block shadow transition flex-1 text-center cursor-pointer"
                  >
                    Lưu phân công
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 5. CẤU HÌNH API KEY EMAIL & SMS OTP */}
      {/* CẤU HÌNH GỬI MÃ XÁC MINH OTP - KHƯ VƯỜN TRI THỨC STYLING (CARAMEL & CREAM 3D WARM DESIGN) */}
      {activeSubTab === 'email_sms' && (
        <div className="bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-3xl p-6 shadow-[0_20px_50px_rgba(80,55,25,0.15)] text-left space-y-6 animate-fadeIn">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#ecdcc7] via-[#e5d3bc] to-[#ded0bb] p-4 rounded-2xl border border-[#d6c4a8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-3">
              <div className="bg-[#f4bf3b] p-3 rounded-2xl text-[#422e00] border border-[#dca31f] shadow-xs shrink-0">
                <Mail className="w-6 h-6 animate-bounce text-[#422e00]" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#4a2e16] text-base uppercase tracking-wide flex items-center gap-2">
                  <span>Cấu Hình Cổng Gửi Mã Xác Minh OTP (Email & SMS)</span>
                  <span className="text-[10px] bg-[#f5e6ca] text-[#713f12] font-black px-3 py-1 rounded-full border border-[#d6c4a8] shadow-2xs">
                    Miễn phí 100%
                  </span>
                </h3>
                <p className="text-xs text-[#78350f] font-semibold mt-0.5">
                  Thiết lập Cổng Gmail Tự Động hoặc EmailJS/Resend API để hệ thống phát mã OTP thật về hòm thư Email của Giáo viên
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSendEmail}
              disabled={isTestingEmail}
              className="flex items-center gap-2 bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-5 py-2.5 rounded-full border border-[#16473c] shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 select-none"
            >
              <Send className={`w-4 h-4 ${isTestingEmail ? 'animate-spin' : ''}`} />
              <span>{isTestingEmail ? 'Đang phát thư thử nghiệm...' : '✉️ Gửi Email OTP Thử Nghiệm'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveOtpConfig} className="space-y-6">
            
            {/* Provider Selector Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-[#4a2e16] tracking-wider mb-2">
                1. Chọn Nhà Cung Cấp Cổng Email / SMS OTP:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                
                {/* Option 1: Gmail Automatic Gateway (Google Apps Script) */}
                <div
                  onClick={() => setOtpProvider('gmail_script')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    otpProvider === 'gmail_script'
                      ? 'border-[#287866] bg-[#f0fdf4] text-[#16473c] shadow-md ring-2 ring-[#287866]/20'
                      : 'border-[#d6c4a8] bg-[#fbf7ee] hover:bg-[#f5e6ca] text-[#4a2e16]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">Gmail Tự Động (Google Script)</span>
                    <span className="text-[10px] bg-[#dcfce7] text-[#166534] font-black px-2 py-0.5 rounded-full border border-[#bbf7d0]">Trực Tiếp Gmail</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-2 font-semibold leading-relaxed">
                    Gửi Email OTP thật 100% qua Gmail nguyenthanhdong.hutech@gmail.com. Không giới hạn 200 lượt.
                  </p>
                </div>

                {/* Option 2: EmailJS */}
                <div
                  onClick={() => setOtpProvider('emailjs')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    otpProvider === 'emailjs'
                      ? 'border-[#287866] bg-[#f0fdf4] text-[#16473c] shadow-md ring-2 ring-[#287866]/20'
                      : 'border-[#d6c4a8] bg-[#fbf7ee] hover:bg-[#f5e6ca] text-[#4a2e16]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">EmailJS Gateway</span>
                    <span className="text-[10px] bg-blue-100 text-blue-900 font-black px-2 py-0.5 rounded-full border border-blue-200">Gói Miễn Phí</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-2 font-semibold leading-relaxed">
                    200 email/tháng miễn phí. Kết nối trực tiếp với Gmail, Outlook hoặc Email trường học.
                  </p>
                </div>

                {/* Option 3: Resend */}
                <div
                  onClick={() => setOtpProvider('resend')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    otpProvider === 'resend'
                      ? 'border-[#287866] bg-[#f0fdf4] text-[#16473c] shadow-md ring-2 ring-[#287866]/20'
                      : 'border-[#d6c4a8] bg-[#fbf7ee] hover:bg-[#f5e6ca] text-[#4a2e16]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">Resend API</span>
                    <span className="text-[10px] bg-purple-100 text-purple-900 font-black px-2 py-0.5 rounded-full border border-purple-200">3,000 Email/tháng</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-2 font-semibold leading-relaxed">
                    3,000 email/tháng siêu tốc. Khuyên dùng cho trường học giao dịch lớn.
                  </p>
                </div>

                {/* Option 4: Custom Webhook */}
                <div
                  onClick={() => setOtpProvider('webhook')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    otpProvider === 'webhook'
                      ? 'border-[#287866] bg-[#f0fdf4] text-[#16473c] shadow-md ring-2 ring-[#287866]/20'
                      : 'border-[#d6c4a8] bg-[#fbf7ee] hover:bg-[#f5e6ca] text-[#4a2e16]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">SMS Gateway / Webhook</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-full border border-amber-200">Tùy biến</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-2 font-semibold leading-relaxed">
                    Kết nối Cổng nhắn tin SMS Viettel/Zalo ZNS của Nhà trường qua Webhook HTTP POST.
                  </p>
                </div>

              </div>
            </div>

            {/* API Credentials Input Form Card */}
            <div className="bg-[#fbf7ee] border-2 border-[#e5dacf] p-5 rounded-2xl shadow-xs space-y-4">
              <h4 className="font-extrabold text-xs text-[#4a2e16] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[#e5dacf]">
                <Key className="w-4 h-4 text-[#d97706]" />
                2. Điền API Key & Thông Số Cấu Hình ({otpProvider.toUpperCase()}):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* API Key / WebApp Exec URL */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-[#5c4326] mb-1">
                    {otpProvider === 'gmail_script' 
                      ? 'Google Web App Exec URL (Hoặc EmailJS Public Key): *' 
                      : 'API Key / Public Key: *'}
                  </label>
                  <input
                    type="text"
                    value={emailApiKey}
                    onChange={(e) => setEmailApiKey(e.target.value)}
                    placeholder={
                      otpProvider === 'gmail_script' 
                        ? 'https://script.google.com/macros/s/AKfycb.../exec' 
                        : (otpProvider === 'resend' ? 're_123456789...' : 'user_live_xxx...')
                    }
                    className="w-full bg-white border border-[#d6c4a8] rounded-xl p-2.5 text-xs font-mono font-bold text-[#3d2514] focus:outline-none focus:ring-2 focus:ring-[#287866] shadow-2xs"
                  />
                  <p className="text-[10px] text-[#78350f] font-semibold mt-1">
                    {otpProvider === 'gmail_script'
                      ? '* Dán URL Web App triển khai từ Google Apps Script (Hoặc để trống để dùng Cổng Gmail tự động hóa tự kết nối).'
                      : (otpProvider === 'resend' 
                          ? '* Đăng ký miễn phí tại https://resend.com để lấy API Key' 
                          : '* Đăng ký tài khoản EmailJS tại https://emailjs.com để lấy Public Key')}
                  </p>
                </div>

                {/* Email Sender Address */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-[#5c4326] mb-1">
                    Địa chỉ Email Gửi Đi Mặc Định (Sender):
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="thlongdinh.otp@gmail.com"
                    className="w-full bg-white border border-[#d6c4a8] rounded-xl p-2.5 text-xs font-bold text-[#3d2514] focus:outline-none focus:ring-2 focus:ring-[#287866] shadow-2xs"
                  />
                  <p className="text-[10px] text-[#78350f] font-semibold mt-1">
                    * Email dùng để phát tin nhắn OTP đến hộp thư của Giáo viên.
                  </p>
                </div>

                {/* Optional Service ID for EmailJS */}
                {otpProvider === 'emailjs' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black uppercase text-[#5c4326] mb-1">
                        EmailJS Service ID:
                      </label>
                      <input
                        type="text"
                        value={emailServiceId}
                        onChange={(e) => setEmailServiceId(e.target.value)}
                        placeholder="service_gmail"
                        className="w-full bg-white border border-[#d6c4a8] rounded-xl p-2.5 text-xs font-mono font-bold text-[#3d2514] focus:outline-none focus:ring-2 focus:ring-[#287866] shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-[#5c4326] mb-1">
                        EmailJS Template ID:
                      </label>
                      <input
                        type="text"
                        value={emailTemplateId}
                        onChange={(e) => setEmailTemplateId(e.target.value)}
                        placeholder="template_otp"
                        className="w-full bg-white border border-[#d6c4a8] rounded-xl p-2.5 text-xs font-mono font-bold text-[#3d2514] focus:outline-none focus:ring-2 focus:ring-[#287866] shadow-2xs"
                      />
                    </div>
                  </>
                )}

                {/* SMS API Key */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-[#5c4326] mb-1">
                    SMS Gateway API Key (Tùy chọn):
                  </label>
                  <input
                    type="password"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    placeholder="sms_key_optional..."
                    className="w-full bg-white border border-[#d6c4a8] rounded-xl p-2.5 text-xs font-mono font-bold text-[#3d2514] focus:outline-none focus:ring-2 focus:ring-[#287866] shadow-2xs"
                  />
                  <p className="text-[10px] text-[#78350f] font-semibold mt-1">
                    * Điền API Key nếu trường sử dụng thêm dịch vụ gửi SMS Brandname trực tiếp về di động.
                  </p>
                </div>

              </div>
            </div>

            {/* Google Apps Script Gmail Gateway Helper Box */}
            {otpProvider === 'gmail_script' && (
              <div className="bg-[#f4ebd9] border-2 border-[#dca31f] p-4 rounded-2xl space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5dacf] pb-2">
                  <div>
                    <h5 className="font-black text-xs text-[#422e00] uppercase tracking-wider flex items-center gap-1.5">
                      <span>⚡ MÃ NGUỒN CỔNG GỬI GMAIL TỰ ĐỘNG KHÔNG GIỚI HẠN (GOOGLE APPS SCRIPT)</span>
                    </h5>
                    <p className="text-[10px] text-[#78350f] font-semibold mt-0.5">
                      Tạo dự án mới tại <a href="https://script.google.com" target="_blank" rel="noreferrer" className="underline font-black text-[#422e00]">https://script.google.com</a> ➔ Dán mã này ➔ Triển khai dạng Web App (Quyền: Anyone).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyGoogleScript}
                    className="bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-4 py-2 rounded-full border border-[#16473c] shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                  >
                    <FileCode className="w-4 h-4 text-emerald-200" />
                    <span>{copiedScript ? '✅ Đã sao chép!' : 'Sao chép mã Google Script'}</span>
                  </button>
                </div>

                <div className="bg-[#2d1b0e] text-[#fde047] p-3 rounded-xl font-mono text-[10px] max-h-36 overflow-y-auto leading-relaxed border border-[#4a2e16] select-all shadow-inner">
                  <pre>{GOOGLE_APPS_SCRIPT_GMAIL_TEMPLATE}</pre>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#d6c4a8]">
              <button
                type="button"
                onClick={handleTestSendEmail}
                disabled={isTestingEmail}
                className="flex items-center gap-2 bg-gradient-to-b from-[#e5a823] to-[#c78b0f] hover:from-[#f3b52d] hover:to-[#d69612] text-white font-black text-xs px-5 py-2.5 rounded-full border border-[#9e6d0a] shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isTestingEmail ? 'animate-spin' : ''}`} />
                <span>{isTestingEmail ? 'Đang phát thư thử nghiệm...' : '✉️ Gửi Email OTP Thử Nghiệm qua Gmail'}</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-6 py-3 rounded-full border border-[#16473c] shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>🔐 Lưu & Đồng Bộ Cấu Hình Gmail OTP Lên Cloud</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* 4. CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU CLOUD (KHO VƯỜN TRI THỨC CARAMEL STYLING) */}
      {activeSubTab === 'database' && (
        <div className="bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-3xl p-6 shadow-[0_20px_50px_rgba(80,55,25,0.15)] text-left space-y-6 animate-fadeIn select-none">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#ecdcc7] via-[#e5d3bc] to-[#ded0bb] p-4 rounded-2xl border border-[#d6c4a8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#f4bf3b] p-3 rounded-2xl text-[#422e00] border border-[#dca31f] shadow-xs shrink-0">
              <Database className="w-6 h-6 text-[#422e00] animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#4a2e16] text-base uppercase tracking-wide">Cấu hình kết nối Cơ sở dữ liệu Supabase</h3>
              <p className="text-xs text-[#78350f] font-semibold mt-0.5">Trạng thái đồng nhất dữ liệu thời gian thực giữa Website và hệ quản trị Supabase Cloud</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConn}
              className="inline-flex items-center gap-1 bg-white/90 hover:bg-white text-[#78350f] hover:text-[#4a2e16] text-[11px] font-black px-3 py-1.5 rounded-full border border-[#d6c4a8] shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Nhấn để kiểm tra kết nối trực tiếp tới Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
              <span>Kiểm tra kết nối</span>
            </button>

            {testConnStatus === 'SUCCESS' || (!supabaseError && testConnStatus !== 'ERROR') ? (
              <span className="inline-flex items-center gap-1.5 bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] text-xs font-black px-3.5 py-1.5 rounded-full shadow-2xs">
                <Check className="w-4 h-4 text-[#166534] font-bold" /> ĐỒNG BỘ: HOẠT ĐỘNG
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-250 text-rose-800 text-xs font-black px-3.5 py-1.5 rounded-full shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> {supabaseError || 'CẦN KHỞI TẠO SQL (BẢNG KHÔNG TỒN TẠI)'}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Project Credentials & Cloud Sync */}
          <div className="bg-[#fbf7ee] border-2 border-[#e5dacf] p-5 rounded-2xl shadow-xs space-y-4">
            <h4 className="font-extrabold text-sm text-[#4a2e16] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[#e5dacf]">
              <Cloud className="w-4.5 h-4.5 text-[#d97706]" /> Thông tin kết nối dự án (Project Credentials)
            </h4>

            <div className="space-y-3 font-mono text-xs text-left bg-white p-4 rounded-xl border border-[#d6c4a8] shadow-inner">
              <div>
                <span className="block text-[9px] font-black uppercase text-[#78350f] mb-1">Supabase Endpoint URL</span>
                <span className="text-[#3d2514] break-all select-all font-bold">https://teslhzdwnbhrreyyvybe.supabase.co</span>
              </div>
              <div className="border-t border-[#ebdcc7] pt-2">
                <span className="block text-[9px] font-black uppercase text-[#78350f] mb-1">Public Anon JWT Key</span>
                <span className="text-[#5c4326] break-all text-[10px] select-all leading-tight font-bold">
                  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...JsjIY
                </span>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <h5 className="font-black text-xs text-[#4a2e16] uppercase tracking-wider">Công cụ đồng bộ khẩn cấp (Manual Cloud Sync)</h5>
              <p className="text-xs text-[#5c4326] leading-relaxed font-semibold">
                Dữ liệu được lưu trữ tự động xuống <strong>LocalStorage</strong> để hoạt động siêu tốc, sau đó tức thì đồng bộ lên đám mây <strong>Supabase</strong>. Nếu thầy cô muốn cưỡng chế nạp hoặc tải thủ công dữ liệu:
              </p>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onForceSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 bg-gradient-to-b from-[#e5a823] to-[#c78b0f] hover:from-[#f3b52d] hover:to-[#d69612] text-white font-black text-xs px-4 py-2.5 rounded-full border border-[#9e6d0a] shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Tải dữ liệu từ Supabase về máy</span>
                </button>

                <button
                  type="button"
                  onClick={onForcePush}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-4 py-2.5 rounded-full border border-[#16473c] shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Đẩy đè dữ liệu hiện tại lên đám mây Supabase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: SQL Initialization Query */}
          <div className="bg-[#fbf7ee] border-2 border-[#e5dacf] p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5dacf]">
              <h4 className="font-extrabold text-sm text-[#4a2e16] uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4.5 h-4.5 text-[#d97706]" /> Mã lệnh khởi tạo SQL (Execute in SQL Editor)
              </h4>
              <button
                type="button"
                onClick={handleCopySql}
                className="bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-3.5 py-1.5 rounded-full border border-[#16473c] shadow-sm transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" /> Đã sao chép!
                  </>
                ) : (
                  'Sao chép SQL'
                )}
              </button>
            </div>

            <p className="text-xs text-[#5c4326] leading-relaxed font-semibold">
              Để cơ sở dữ liệu hoạt động hoàn chỉnh, vui lòng nhấp nút <strong>"Sao chép SQL"</strong> ở phía trên, sau đó truy cập <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#d97706] hover:underline font-black">Supabase Dashboard</a> &rarr; dự án của bạn &rarr; menu <strong>SQL Editor</strong> &rarr; nhấn <strong>New query</strong> &rarr; Dán mã lệnh SQL này vào và nhấn nút <strong>Run</strong> để khởi tạo bảng <code>school_states</code>!
            </p>

            <div className="bg-[#2d1b0e] text-[#fde047] font-mono text-[9px] p-3.5 rounded-xl border border-[#4a2e16] max-h-56 overflow-y-auto leading-relaxed select-all shadow-inner">
              <pre className="whitespace-pre-wrap">{SQL_INITIALIZATION_QUERY}</pre>
            </div>
          </div>

          {/* Card 3: Cloud Keys Explorer (Trình Tra Cứu & Khám Phá Khóa Dữ Liệu Supabase) */}
          <div className="col-span-1 md:col-span-2 pt-2">
            <CloudKeysExplorer showToast={showToast} currentUser={currentUser} />
          </div>

        </div>

      </div>
      )}

      {/* POP-UP CONFIRMATION FOR DELETING ALL STUDENTS */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-fadeIn text-left">
            
            <div className="bg-gradient-to-r from-red-500 to-red-650 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-1.5 font-extrabold text-sm uppercase tracking-widest text-white">
                <AlertTriangle className="w-5 h-5 animate-pulse text-yellow-300" />
                Cảnh báo nguy hiểm!
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="bg-black/10 hover:bg-black/25 text-white rounded-full p-1.5 focus:outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-extrabold text-slate-800 leading-relaxed">
                Bạn có muốn xóa toàn bộ danh sách học sinh không?
              </p>
              
              <p className="text-xs text-slate-500 bg-slate-50 border p-3.5 rounded-xl font-semibold leading-relaxed">
                ⚠️ Lưu ý: Toàn bộ danh sách <strong>{students.length} em học sinh</strong> hiện tại ở mọi khối lớp sẽ bị xóa sạch khỏi hệ thống.
              </p>

              <div className="flex justify-end gap-2 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl block cursor-pointer transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllStudents}
                  className="bg-red-600 hover:bg-red-750 text-white font-extrabold px-5 py-2.5 rounded-xl block shadow transition cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

