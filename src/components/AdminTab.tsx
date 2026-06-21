import React, { useState, useMemo } from 'react';
import { Member, Computer, Student, ClassItem } from '../types';
import { UserCheck, Trash2, ShieldAlert, Heart, HardDrive, Cpu, Cloud, Check, Wifi, AlertTriangle, RefreshCw, Database, FileCode, CheckCircle2, X, Calendar, Plus, Clock, User } from 'lucide-react';
import { SQL_INITIALIZATION_QUERY } from '../supabaseClient';

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
  classes
}: AdminTabProps) {

  // States for adding member
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Giáo viên bộ môn');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // States for Active Scheduler Teacher
  const [selectedTeacherUsername, setSelectedTeacherUsername] = useState<string>(() => {
    return currentUser?.username || (members[0] ? members[0].username : 'dong.nt');
  });

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


  const handleAddMember = (e: React.FormEvent) => {
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

    const item: Member = {
      id: `u-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      email: newEmail.trim(),
      phone: newPhone.trim() || 'Chưa cung cấp',
      username: usernameClean
    };

    setMembers(prev => [...prev, item]);
    setNewName('');
    setNewRole('Giáo viên bộ môn');
    setNewEmail('');
    setNewPhone('');
    showToast(`Đã thêm thành viên giáo viên ${item.name} và cấp quyền thành công!`);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (id === 'u-1') {
      showToast('Thầy cô không thể xóa tài khoản Quản trị viên tối cao này!', 'error');
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== id));
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

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* 1. THỜI KHÓA BIỂU GIẢNG DẠY (Ưu tiên số 1 - Đưa lên đầu làm màn hình trung tâm) */}
      <div id="timetable-management-section" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left space-y-6">
        
        {/* Header bar */}
        <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-2xl text-amber-600">
              <Calendar className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase tracking-wider flex items-center gap-2">
                THỜI KHÓA BIỂU GIẢNG DẠY
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                  BẢNG PHÂN CÔNG ĐỐI CHIẾU
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Nhấp trực tiếp lên các ô tiết học để phân công môn học & lớp học. Phân công riêng biệt cho từng giáo viên.
              </p>
            </div>
          </div>

          {/* Teacher Selector dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase flex items-center gap-1 shrink-0 ml-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Chọn Giáo viên phụ trách:
            </span>
            <select
              value={selectedTeacherUsername}
              onChange={(e) => {
                setSelectedTeacherUsername(e.target.value);
                showToast(`Đã chuyển sang xem TKB của giáo viên: ${members.find(m => m.username === e.target.value)?.name || e.target.value}`);
              }}
              className="border border-slate-200 bg-white rounded-xl p-2 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer min-w-[200px]"
            >
              {members.map((teacher) => (
                <option key={teacher.id} value={teacher.username}>
                  {teacher.name} ({teacher.username})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Informative block showing details of the selected teacher */}
        <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 p-4 rounded-2xl border border-amber-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="font-black text-slate-800 text-sm">
              Giáo viên: {members.find(m => m.username === selectedTeacherUsername)?.name || 'Chưa rõ'}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Chức danh chuyên môn: <strong className="text-slate-600">{members.find(m => m.username === selectedTeacherUsername)?.role || 'Giáo viên bộ môn'}</strong>
              {' | '} Email liên lạc: <strong className="text-slate-600">{members.find(m => m.username === selectedTeacherUsername)?.email || 'dong.nt@school.edu.vn'}</strong>
            </p>
          </div>
        </div>

        {/* Timetable visual responsive table wrapper */}
        <div className="overflow-x-auto border border-slate-200 rounded-3xl bg-slate-50/50 p-2">
          <table className="w-full border-collapse border border-slate-300 text-center text-xs min-w-[700px]">
            
            <thead>
              <tr className="bg-slate-200 border-b-2 border-slate-300 text-slate-800 font-extrabold uppercase text-[11px]">
                <th className="border border-slate-300 py-3 px-2 w-[130px]">THỜI GIAN</th>
                <th className="border border-slate-300 py-3 px-2 w-[90px]">TIẾT</th>
                <th className="border border-slate-300 py-3 px-3">THỨ HAI</th>
                <th className="border border-slate-300 py-3 px-3">THỨ BA</th>
                <th className="border border-slate-300 py-3 px-3">THỨ TƯ</th>
                <th className="border border-slate-300 py-3 px-3">THỨ NĂM</th>
                <th className="border border-slate-300 py-3 px-3">THỨ SÁU</th>
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

      {/* 2. QUẢN LÝ THÀNH VIÊN VÀ QUYỀN HẠN TRUY CẬP (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: add registration form */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 h-fit text-left">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide border-b pb-2 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            Cấp quyền giảng dạy mới
          </h4>

          <form onSubmit={handleAddMember} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-500 mb-1">Họ và Tên Giáo viên</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ..."
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">Quyền hạn hệ thống</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-700"
              >
                <option value="Giáo viên bộ môn">Giáo viên bộ môn (Chấm điểm + Điểm danh)</option>
                <option value="Quản trị viên">Quản trị viên (Toàn quyền)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">Email trường học</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Ví dụ: hotengv@school.edu.vn"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">Số điện thoại liên hệ</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Chưa cung cấp số"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg transition text-xs"
            >
              + Tạo tài khoản & Gửi thư nhận việc
            </button>
          </form>
        </div>

        {/* Right column: list existing teachers - Pure Table without maintenance clutter */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 text-left">
          
          <div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Thành viên giáo viên trong Nhà trường
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Thông tin giáo viên</th>
                    <th className="py-3 px-4">Địa chỉ Email / phone</th>
                    <th className="py-3 px-4">Phân Quyền</th>
                    <th className="py-3 px-4 text-center">Xóa quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <p className="font-extrabold text-slate-800">{member.name}</p>
                        <p className="text-[10px] text-slate-400">Username: <strong>{member.username}</strong> (Pass mặc định: 123456)</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-700">{member.email}</p>
                        <p className="text-[10px] text-slate-400">{member.phone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                          member.role.includes('Admin') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 border'
                        }`}>
                          {member.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {member.id !== 'u-1' ? (
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition inline-block focus:outline-none"
                            title="Xóa thành viên"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] italic text-slate-400 font-medium">Không thể xóa</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* 3. TÍNH NĂNG BẢO TRÌ PHÒNG MÁY & DANGER ZONE (Tách biệt khỏi Nhân sự) */}
      <div id="maintenance-administration-section" className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Card 1: Hardware Emergency Diagnostics */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
              <Cpu className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                Bảo dưỡng phòng thi khẩn cấp
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold">Công cụ phòng Lab công nghệ cao</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Trong trường hợp kết thúc đợt kiểm tra học kỳ hoặc đã hoàn thành công tác bảo trì kỹ thuật cho phòng thi, thầy cô có thể nhanh chóng khôi phục trạng thái hoạt động tốt cho toàn bộ 40 máy trong lớp học bằng phím tắt bên dưới.
          </p>
          
          <div className="pt-2">
            <button
              onClick={handleResetComputers}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer flex items-center gap-1.5 hover:scale-[1.01]"
            >
              <Cpu className="w-4 h-4" />
              Reset tất cả 40 máy sang "Hoạt động tốt"
            </button>
          </div>
        </div>

        {/* Card 2: Danger Zone for Student Records reset */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 bg-rose-50/10 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <div className="bg-rose-50 p-2 rounded-xl text-rose-600">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-rose-800 text-sm uppercase tracking-wide">
                Khu vực giới hạn bảo mật (Danger Zone)
              </h4>
              <p className="text-[10px] text-rose-400 font-semibold">Hành động bảo mật cấp cao</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Hành động này sẽ <strong>xóa hoàn toàn</strong> danh sách học sinh ở tất cả các khối lớp đã thiết lập trong hệ thống. Quý thầy cô vui lòng cân nhắc kỹ trước khi thực hiện.
          </p>
          
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer flex items-center gap-1.5 hover:scale-[1.01]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa toàn bộ học sinh ({students.length} em)
            </button>
          </div>
        </div>

      </div>

      {/* MODAL PHÂN CÔNG THỜI KHÓA BIỂU CHI TIẾT */}
      {editingCell && (
        <div id="school-timetable-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

      {/* 4. CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU CLOUD (Nền tảng kỹ thuật - Ở cuối trang) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-left space-y-6">
        
        <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase tracking-wide">Cấu hình kết nối Cơ sở dữ liệu Supabase</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Trạng thái đồng nhất dữ liệu thời gian thực giữa Website và hệ quản trị Supabase Cloud</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            {!supabaseError ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-xl">
                <Check className="w-4 h-4 text-emerald-600 font-bold" /> ĐỒNG BỘ: HOẠT ĐỘNG
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-250 text-rose-800 text-xs font-black px-3 py-1.5 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> CẦN KHỞI TẠO SQL (BẢNG KHÔNG TỒN TẠI)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Cloud className="w-4.5 h-4.5 text-teal-600" /> Thông tin kết nối dự án (Project Credentials)
            </h4>

            <div className="space-y-3 font-mono text-xs text-left bg-slate-50 p-4 rounded-xl border">
              <div>
                <span className="block text-[9px] font-black uppercase text-slate-400 mb-1">Supabase Endpoint URL</span>
                <span className="text-slate-700 break-all select-all font-semibold">https://teslhzdwnbhrreyyvybe.supabase.co</span>
              </div>
              <div className="border-t pt-2">
                <span className="block text-[9px] font-black uppercase text-slate-400 mb-1">Public Anon JWT Key</span>
                <span className="text-slate-500 break-all text-[10px] select-all leading-tight font-semibold">
                  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...JsjIY
                </span>
              </div>
            </div>

            <div className="space-y-3.5">
              <h5 className="font-extrabold text-xs text-slate-700">Công cụ đồng bộ khẩn cấp (Manual Cloud Sync)</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Dữ liệu được lưu trữ tự động xuống <strong>LocalStorage</strong> để hoạt động siêu tốc, sau đó tức thì đồng bộ lên đám mây <strong>Supabase</strong>. Nếu thầy cô muốn cưỡng chế nạp hoặc tải thủ công dữ liệu:
              </p>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onForceSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 border border-slate-300 hover:border-slate-800 hover:bg-slate-50 text-slate-800 font-extrabold text-xs px-3.5 py-2 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Tải dữ liệu từ Supabase về máy
                </button>

                <button
                  type="button"
                  onClick={onForcePush}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Đẩy đè dữ liệu hiện tại lên đám mây Supabase
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <FileCode className="w-4.5 h-4.5 text-amber-500" /> Mã lệnh khởi tạo SQL (Execute in SQL Editor)
              </h4>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-xs text-amber-600 hover:text-amber-800 font-black flex items-center gap-1 border border-amber-200 hover:border-amber-400 bg-amber-50 px-3 py-1 rounded-lg transition-all cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã sao chép!
                  </>
                ) : (
                  'Sao chép SQL'
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Để cơ sở dữ liệu hoạt động hoàn chỉnh, vui lòng nhấp nút <strong>"Sao chép SQL"</strong> ở phía trên, sau đó truy cập <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-extrabold">Supabase Dashboard</a> &rarr; dự án của bạn &rarr; menu <strong>SQL Editor</strong> &rarr; nhấn <strong>New query</strong> &rarr; Dán mã lệnh SQL này vào và nhấn nút <strong>Run</strong> để khởi tạo bảng <code>school_states</code>!
            </p>

            <div className="bg-slate-900 text-slate-300 font-mono text-[9px] p-3.5 rounded-xl border border-slate-800 max-h-56 overflow-y-auto leading-relaxed select-all">
              <pre className="whitespace-pre-wrap">{SQL_INITIALIZATION_QUERY}</pre>
            </div>
          </div>
        </div>

      </div>

      {/* POP-UP CONFIRMATION FOR DELETING ALL STUDENTS */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

