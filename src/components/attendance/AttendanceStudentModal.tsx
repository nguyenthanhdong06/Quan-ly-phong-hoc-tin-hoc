import React, { useState } from 'react';
import { StudentAttendanceStat, formatDateVN } from './attendanceStatsUtils';
import { AttendanceStatus } from '../../types';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  AlertOctagon, 
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-[#dfccb0] border-b border-[#cbb89d] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#cbb89d] flex items-center justify-center text-lg font-black text-amber-900 shadow-xs overflow-hidden">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{student.gender === 'Nữ' ? '👧' : '👦'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-[#3d2b17] uppercase tracking-wide">
                  {student.name}
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${ratingColor.bg} ${ratingColor.text} ${ratingColor.border}`}>
                  {rating}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#5c4327]">
                MSHS: <span className="font-mono text-slate-800">{student.code}</span> | Lớp:{' '}
                <span className="font-black text-amber-900">{student.classId}</span> | Giới tính: {student.gender}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5c4327] hover:bg-[#ebdcc9] hover:text-[#3d2b17] transition cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* 5 Quick KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-white border border-[#cbb89d] rounded-xl p-2.5 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block">Tổng buổi</span>
              <strong className="text-lg font-black text-slate-800 font-mono">{totalSessions}</strong>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 block">Có mặt</span>
              <strong className="text-lg font-black text-emerald-800 font-mono">{presentCount}</strong>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-amber-700 block">Đi trễ</span>
              <strong className="text-lg font-black text-amber-800 font-mono">{lateCount}</strong>
            </div>

            <div className="bg-sky-50 border border-sky-300 rounded-xl p-2.5 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-sky-700 block">Có phép</span>
              <strong className="text-lg font-black text-sky-800 font-mono">{excusedCount}</strong>
            </div>

            <div className="bg-rose-50 border border-rose-300 rounded-xl p-2.5 text-center shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-rose-700 block">Không phép</span>
              <strong className="text-lg font-black text-rose-700 font-mono">{unexcusedCount}</strong>
            </div>
          </div>

          {/* Tỷ lệ chuyên cần progress */}
          <div className="bg-white border border-[#cbb89d] rounded-2xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#3d2b17] uppercase tracking-wider">
                Tỷ Lệ Chuyên Cần Toàn Khóa:
              </span>
              <span className="font-black text-base text-amber-800 font-mono">
                {attendanceRate}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
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

          {/* ==========================================================
              LỊCH ĐIỂM DANH (CALENDAR MATRIX VIEW 5 MÃ MÀU)
              ========================================================== */}
          <div className="bg-white border border-[#cbb89d] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-[#3d2b17] tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>MA TRẬN LỊCH ĐIỂM DANH CÁC BUỔI HỌC</span>
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                {dailyRecords.length} buổi đã ghi nhận
              </span>
            </div>

            {/* Bảng chú giải màu sắc */}
            <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Có mặt
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Đi trễ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Vắng có phép
              </span>
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
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition hover:scale-105 cursor-default ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border} shadow-2xs`}
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
            <div className="bg-amber-50/60 border border-amber-300 rounded-2xl p-4 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700" />
                <span>NHẬT KÝ CÁC BUỔI CẦN LƯU Ý ({abnormalRecords.length} buổi)</span>
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {abnormalRecords.map((r, i) => {
                  const isLate = r.status === 'late';
                  const isExcused = r.status === 'excused';
                  return (
                    <div
                      key={i}
                      className="bg-white border border-amber-200 rounded-xl p-2 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-700">
                        📅 Buổi ngày: <strong className="text-slate-900 font-mono">{formatDateVN(r.date)}</strong>
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
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

        {/* Footer Actions */}
        <div className="bg-[#dfccb0] border-t border-[#cbb89d] p-3.5 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl border border-amber-800 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-amber-200" />}
            <span>{copied ? 'Đã Sao Chép Tin Nhắn!' : 'Soạn Tin Nhắn Zalo Trao Đổi'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-2 px-5 rounded-xl border border-slate-300 transition shadow-2xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
