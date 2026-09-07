import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StudentAttendanceStat, formatDateVN } from './attendanceStatsUtils';
import { AttendanceStatus } from '../../types';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  AlertOctagon, 
  AlertCircle,
  MessageSquare, 
  Check, 
  Copy,
  Sparkles,
  Info
} from 'lucide-react';

interface AttendanceStudentModalProps {
  stat: StudentAttendanceStat | null;
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const AttendanceStudentModal: React.FC<AttendanceStudentModalProps> = ({
  stat,
  onClose,
  showToast
}) => {
  const [copied, setCopied] = useState(false);

  // Lắng nghe phím Escape để đóng modal mượt mà
  useEffect(() => {
    if (!stat) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stat, onClose]);

  if (!stat) return null;

  const { student, totalSessions, presentCount, lateCount, excusedCount, unexcusedCount, attendanceRate, rating, ratingColor, dailyRecords } = stat;

  // Lấy các buổi có vấn đề (vắng hoặc trễ)
  const abnormalRecords = dailyRecords.filter((r) => r.status !== 'present');

  // Copy tin nhắn trao đổi phụ huynh / GVCN
  const handleCopyMessage = () => {
    let msg = `📢 THÔNG TIN CHUYÊN CẦN HỌC SINH\n`;
    msg += `------------------------------------\n`;
    msg += `Họ và tên: ${student.name} (MSHS: ${student.code})\n`;
    msg += `Lớp: ${student.classId} | Môn học: Tin học\n`;
    msg += `Tổng số buổi học: ${totalSessions} buổi\n`;
    msg += `✅ Đi học đầy đủ: ${presentCount} buổi\n`;
    if (lateCount > 0) msg += `🟡 Đi trễ: ${lateCount} lần\n`;
    if (excusedCount > 0) msg += `🔵 Vắng có phép: ${excusedCount} buổi\n`;
    if (unexcusedCount > 0) msg += `🔴 VẮNG KHÔNG PHÉP: ${unexcusedCount} buổi\n`;
    msg += `📊 Tỷ lệ chuyên cần: ${attendanceRate}%\n`;
    msg += `Xếp loại: ${rating}\n`;
    msg += `------------------------------------\n`;

    if (abnormalRecords.length > 0) {
      msg += `Chi tiết các ngày vắng/trễ:\n`;
      abnormalRecords.forEach((r, idx) => {
        const statusLabel = 
          r.status === 'late' ? 'Đi trễ' : 
          r.status === 'excused' ? 'Vắng có phép' : 'VẮNG KHÔNG PHÉP';
        msg += `${idx + 1}. Ngày ${formatDateVN(r.date)}: [${statusLabel}]\n`;
      });
    } else {
      msg += `Em tham gia đầy đủ và tích cực 100% các buổi học!\n`;
    }

    navigator.clipboard.writeText(msg);
    setCopied(true);
    showToast(`Đã sao chép tin nhắn tình hình chuyên cần của em ${student.name}!`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper lấy cấu hình màu cho từng ngày trong Ma trận lịch
  const getDayStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return {
          bg: 'bg-emerald-500',
          text: 'text-white',
          border: 'border-emerald-600',
          label: 'Có mặt (Đi học)',
          icon: '🟢'
        };
      case 'late':
        return {
          bg: 'bg-amber-500',
          text: 'text-white',
          border: 'border-amber-600',
          label: 'Đi trễ',
          icon: '🟡'
        };
      case 'excused':
        return {
          bg: 'bg-sky-500',
          text: 'text-white',
          border: 'border-sky-600',
          label: 'Vắng có phép',
          icon: '🔵'
        };
      case 'unexcused':
        return {
          bg: 'bg-rose-600',
          text: 'text-white',
          border: 'border-rose-700',
          label: 'Vắng không phép',
          icon: '🔴'
        };
      default:
        return {
          bg: 'bg-slate-200',
          text: 'text-slate-700',
          border: 'border-slate-300',
          label: 'Chưa có dữ liệu',
          icon: '⚪'
        };
    }
  };

  return typeof document !== 'undefined' && createPortal(
    <div 
      className="absolute inset-0 bg-slate-900/65 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#faf5ec] w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-[#d6c4a8] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 my-auto text-left max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Modal Header: Đồng bộ chuẩn giao diện Popup Nút Xem của Quản trị hệ thống */}
        <div className="bg-gradient-to-r from-[#dfccb0] via-[#e8d9c2] to-[#dfccb0] px-5 py-3.5 border-b border-[#c8b598] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📅</span>
            <div>
              <h3 className="font-black text-sm text-[#42301c] uppercase tracking-wide flex items-center gap-2">
                Chi Tiết Lịch Điểm Danh: <span className="font-black text-slate-900">{student.name}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${ratingColor.bg} ${ratingColor.text} ${ratingColor.border}`}>
                  {rating}
                </span>
              </h3>
              <p className="text-[11px] font-bold text-amber-900">
                Lớp: <strong className="font-black text-amber-950">{student.classId}</strong> • MSHS: <strong className="font-mono text-emerald-800">{student.code}</strong> • Giới tính: {student.gender}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6e5334] hover:text-[#382613] bg-white/60 hover:bg-white p-1.5 rounded-full transition-all cursor-pointer shadow-xs focus:outline-none"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Nội dung chi tiết chuẩn phong cách DeskOS */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-bold text-[#42301c]">
          
          {/* Thanh phụ: Tóm tắt trạng thái & Nút thao tác nhanh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#78350f] font-black">
            <span>Tổng hợp chuyên cần & nhật ký điểm danh:</span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-1.5 bg-[#ecdcc7] hover:bg-[#dfcdb5] text-[#4a2e16] text-xs font-black px-3.5 py-1.5 rounded-full border border-[#d6c4a8] transition-all cursor-pointer active:scale-95 shadow-3xs self-start sm:self-auto"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" /> Đã sao chép tin nhắn!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Soạn tin nhắn gửi GVCN / Phụ huynh
                </>
              )}
            </button>
          </div>

          {/* Card Thông tin học sinh & 5 chỉ số KPI chuyên cần */}
          <div className="bg-white/95 p-4 rounded-2xl border border-[#d6c4a8] text-xs text-[#5c4326] space-y-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center font-black text-amber-900 text-xl shrink-0 overflow-hidden shadow-xs">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{student.gender === 'Nữ' ? '👧' : '👦'}</span>
                )}
              </div>
              <div className="space-y-1 text-left flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-base truncate">{student.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${ratingColor.bg} ${ratingColor.text} ${ratingColor.border}`}>
                    {rating}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>Mã định danh (MSHS): <strong className="font-mono text-emerald-800">{student.code}</strong></span>
                  <span>•</span>
                  <span>Lớp: <strong className="text-amber-900 font-black">{student.classId}</strong></span>
                  <span>•</span>
                  <span>Giới tính: <strong className="text-slate-700">{student.gender}</strong></span>
                </p>
              </div>
            </div>

            {/* 5 Quick KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#f0e4d0]">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-[10px] font-bold text-slate-500 block">Tổng số buổi</span>
                <strong className="text-base sm:text-lg font-black text-slate-800 font-mono">{totalSessions}</strong>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-[10px] font-bold text-emerald-800 block">Có mặt</span>
                <strong className="text-base sm:text-lg font-black text-emerald-800 font-mono">{presentCount}</strong>
              </div>

              <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-[10px] font-bold text-amber-800 block">Đi trễ</span>
                <strong className="text-base sm:text-lg font-black text-amber-800 font-mono">{lateCount}</strong>
              </div>

              <div className="bg-sky-50/80 border border-sky-300 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-[10px] font-bold text-sky-800 block">Có phép</span>
                <strong className="text-base sm:text-lg font-black text-sky-800 font-mono">{excusedCount}</strong>
              </div>

              <div className="bg-rose-50/80 border border-rose-300 rounded-xl p-2.5 text-center shadow-3xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-rose-800 block">Không phép</span>
                <strong className="text-base sm:text-lg font-black text-rose-700 font-mono">{unexcusedCount}</strong>
              </div>
            </div>

            {/* Tỷ lệ chuyên cần progress */}
            <div className="pt-2 border-t border-[#f0e4d0] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#5c4326] uppercase tracking-wider text-[11px]">
                  Tỷ Lệ Chuyên Cần Khóa Học:
                </span>
                <span className="font-black text-sm sm:text-base text-amber-900 font-mono">
                  {attendanceRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    attendanceRate >= 95
                      ? 'bg-emerald-500'
                      : attendanceRate >= 85
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Khối Ma Trận Lịch Điểm Danh (Calendar Matrix View) */}
          <div className="bg-white/95 p-4 rounded-2xl border border-[#d6c4a8] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-[#3d2b17] tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>MA TRẬN LỊCH ĐIỂM DANH CÁC BUỔI HỌC</span>
              </h4>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {dailyRecords.length} buổi đã ghi nhận
              </span>
            </div>

            {/* Bảng chú giải màu sắc */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-700 bg-[#faf5ec] p-2.5 rounded-xl border border-[#e8d9c2]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Có mặt
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Đi trễ
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Vắng có phép
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Vắng không phép
              </span>
            </div>

            {/* Matrix Grid */}
            {dailyRecords.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-bold">
                Chưa có dữ liệu buổi học nào được ghi nhận cho học sinh này.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {dailyRecords.map((rec) => {
                  const colorConfig = getDayStatusColor(rec.status);
                  const dateShort = rec.date.slice(5).replace('-', '/'); // MM/DD
                  return (
                    <div
                      key={rec.date}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition hover:scale-105 cursor-default ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border} shadow-3xs`}
                      title={`Ngày: ${formatDateVN(rec.date)} | Trạng thái: ${colorConfig.label}`}
                    >
                      <span className="text-[10px] font-mono font-bold opacity-90">{dateShort}</span>
                      <span className="text-xs font-black mt-0.5">{colorConfig.icon}</span>
                      <span className="text-[9px] font-bold truncate max-w-full block opacity-95">
                        {rec.status === 'present' ? 'Đi học' : rec.status === 'late' ? 'Trễ' : rec.status === 'excused' ? 'Có phép' : 'Không phép'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nhật ký các ngày vắng hoặc trễ (nếu có) */}
          {abnormalRecords.length > 0 && (
            <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-3.5 shadow-xs space-y-2 text-left">
              <div className="flex items-center gap-1.5 font-black text-xs text-rose-900">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>NHẬT KÝ CÁC BUỔI CẦN LƯU Ý ({abnormalRecords.length} buổi):</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {abnormalRecords.map((r, i) => {
                  const isLate = r.status === 'late';
                  const isExcused = r.status === 'excused';
                  return (
                    <div
                      key={i}
                      className="bg-white/95 border border-rose-200 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-3xs"
                    >
                      <span className="font-bold text-slate-700">
                        📅 Buổi ngày: <strong className="text-slate-900 font-mono">{formatDateVN(r.date)}</strong>
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          isLate
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isExcused
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        {isLate ? '🟡 Đi trễ' : isExcused ? '🔵 Vắng có phép' : '🔴 Vắng không phép'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Chuẩn phong cách Quản trị hệ thống */}
        <div className="p-5 pt-0 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="px-5 py-2.5 rounded-2xl bg-[#ecdcc7] hover:bg-[#dfcdb5] text-[#4a2e16] font-black text-xs border border-[#d6c4a8] transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép tin nhắn!' : 'Sao chép tin nhắn trao đổi'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 font-black text-white text-xs shadow-md shadow-amber-600/25 active:scale-95 transition-all cursor-pointer"
          >
            Đóng (Esc)
          </button>
        </div>

      </div>
    </div>,
    (typeof document !== 'undefined' && (document.getElementById('deskos-window-body') || document.getElementById('deskos-active-window'))) || document.body
  );
};
