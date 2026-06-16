import React, { useState } from 'react';
import { Member, Computer } from '../types';
import { UserCheck, Trash2, ShieldAlert, Heart, HardDrive, Cpu, Cloud, Check, Wifi, AlertTriangle, RefreshCw, Database, FileCode, CheckCircle2 } from 'lucide-react';
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
  onForcePush
}: AdminTabProps) {

  // States for adding member
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Giáo viên bộ môn');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

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

  // Copy SQL instructions
  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_INITIALIZATION_QUERY);
    setCopiedSql(true);
    showToast('Đã sao chép mã lệnh SQL khởi tạo Supabase!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: add registration form */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 h-fit text-left">
          <h4 className="font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2">
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
                <option value="Quản trị viên">Quản trị viên (Toàn quyền CRUD)</option>
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

        {/* Right column: list existing teachers & global configs card */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6 text-left">
          
          <div>
            <h3 className="font-extrabold text-slate-800 text-base mb-3 flex items-center gap-2">
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
                        <p className="text-[10px] text-slate-400">Username: <strong>{member.username}</strong> (Pass mặc định: 123)</p>
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

          {/* Quick global configurations reset hardware button */}
          <div className="pt-4 border-t border-slate-200 space-y-3.5 text-left bg-slate-50/50 p-4 rounded-2xl border">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Sửa chữa khẩn cấp phần cứng hệ thống phòng máy
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Trong trường hợp kết thúc đợt kiểm tra học kỳ hoặc đã hoàn thành công tác bảo trì kỹ thuật cho phòng thi, thầy cô có thể nhanh chóng khôi phục trạng thái hoạt động tốt cho toàn bộ 40 máy trong lớp học bằng phím tắt bên dưới.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleResetComputers}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow cursor-pointer"
              >
                Reset tất cả 40 máy sang "Hoạt động tốt"
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Supabase Integration Card */}
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
                  className="flex items-center gap-1.5 bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
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

    </div>
  );
}

