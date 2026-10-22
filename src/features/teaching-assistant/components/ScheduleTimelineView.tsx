import React from 'react';
import { TeachingTask } from '../types';
import { DAY_NAMES, PERIOD_TIMES } from '../constants';
import { Member, TimetableCell } from '../../../types';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Coffee, 
  Sun, 
  Users, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';

interface ScheduleTimelineViewProps {
  tasks: TeachingTask[];
  scheduleMap: Record<string, TimetableCell>;
  currentUser?: Member | null;
  members?: Member[];
  selectedTeacherId?: string;
  onSelectTeacherId?: (teacherId: string) => void;
  onOpenNewTaskForPeriod: (day: string, period: string, className: string, subject: string) => void;
  onEditTask: (task: TeachingTask) => void;
  onToggleComplete: (task: TeachingTask) => void;
}

export const ScheduleTimelineView: React.FC<ScheduleTimelineViewProps> = ({
  tasks,
  scheduleMap,
  currentUser,
  members = [],
  selectedTeacherId,
  onSelectTeacherId,
  onOpenNewTaskForPeriod,
  onEditTask,
  onToggleComplete,
}) => {
  const days = ['2', '3', '4', '5', '6'];

  // Khung tiết theo quy định mới
  const morningPart1 = ['1', '2'];       // Sáng 1 & Sáng 2
  const morningPart2 = ['3', '4', '5'];  // Sáng 3, 4, 5 (ra về 10h35)
  const afternoonPeriods = ['6', '7', '8']; // Chiều 6, 7, 8 (14h00 - 15h55)

  const isAdmin = Boolean(currentUser?.role?.includes('Admin'));

  const renderPeriodCell = (day: string, period: string) => {
    const key = `${day}-${period}`;
    const cell = scheduleMap[key];

    // Lọc công việc của tiết này
    const periodTasks = tasks.filter(t => t.scheduleDay === day && t.schedulePeriod === period);
    const hasIncompleteTasks = periodTasks.some(t => t.status !== 'completed');

    if (!cell || !cell.className) {
      return (
        <div className="h-full min-h-[92px] p-2 rounded-xl bg-slate-50/60 border border-dashed border-slate-200/90 flex flex-col items-center justify-center text-slate-400 text-[11px] select-none">
          <span className="text-[10px] text-slate-300 font-semibold">Trống</span>
        </div>
      );
    }

    return (
      <div
        className={`h-full min-h-[110px] p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
          hasIncompleteTasks
            ? 'bg-amber-50/95 border-amber-400 ring-1 ring-amber-300 shadow-2xs'
            : periodTasks.length > 0
            ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs'
            : 'bg-white border-[#cbb89d] hover:border-amber-400 hover:shadow-xs'
        }`}
      >
        {/* Thông tin lớp học & Môn */}
        <div>
          <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#cbb89d]/20 mb-1.5">
            <span className="font-mono font-black text-xs text-[#3d2b17] bg-[#dfccb0] px-1.5 py-0.5 rounded shadow-2xs">
              Lớp {cell.className}
            </span>
            <span className="text-[10.5px] font-bold text-[#5c4327] truncate">
              {cell.subject || 'Tin học'}
            </span>
          </div>

          {/* Danh sách công việc liên kết của tiết này */}
          <div className="space-y-1">
            {periodTasks.map(t => {
              const isDone = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className={`text-[10.5px] font-bold p-1 rounded-md border flex items-center gap-1.5 cursor-pointer transition ${
                    isDone
                      ? 'bg-emerald-100/70 border-emerald-200 text-emerald-900 line-through'
                      : 'bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-200 shadow-2xs'
                  }`}
                  title={t.title}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(t);
                    }}
                    className="shrink-0 cursor-pointer"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border-2 border-amber-800" />
                    )}
                  </button>
                  <span className="truncate">{t.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nút thêm việc nhanh cho tiết này */}
        <button
          type="button"
          onClick={() => onOpenNewTaskForPeriod(day, period, cell.className, cell.subject || 'Tin học')}
          className="mt-2 text-[10.5px] font-black text-[#5c4327] hover:text-amber-950 flex items-center justify-center gap-1 py-1 rounded-md hover:bg-amber-100 transition cursor-pointer border border-transparent hover:border-amber-300"
        >
          <Plus className="w-3 h-3 stroke-[3]" /> Thêm việc
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-[#3d2b17]">
      {/* 1. Header Thanh điều khiển & Chuyển đổi Workspace */}
      <div className="bg-[#fffbf0] border border-[#cbb89d] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500 text-amber-950 shadow-xs">
            <Calendar className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <h3 className="font-black text-base sm:text-lg text-[#3d2b17] leading-tight">
              Lịch đối chiếu Thời khóa biểu & Kế hoạch bài dạy
            </h3>
            <p className="text-xs text-[#5c4327] mt-0.5">
              Khung giờ chuẩn: Sáng 5 tiết (07:00 - 10:35) • Chiều 3 tiết (14:00 - 15:55)
            </p>
          </div>
        </div>

        {/* Khu vực phân quyền tài khoản & Workspace */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          {isAdmin ? (
            <div className="flex items-center gap-2 bg-[#dfccb0]/60 px-3 py-1.5 rounded-xl border border-[#cbb89d]">
              <Users className="w-4 h-4 text-[#5c4327] shrink-0" />
              <label className="text-xs font-bold text-[#5c4327] shrink-0">
                Xem theo giáo viên:
              </label>
              <select
                value={selectedTeacherId || ''}
                onChange={(e) => onSelectTeacherId && onSelectTeacherId(e.target.value)}
                className="bg-white border border-[#cbb89d] rounded-lg px-2.5 py-1 text-xs font-black text-[#3d2b17] focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
              >
                {members.map((m) => (
                  <option key={m.id || m.username} value={m.id || m.username}>
                    {m.name || m.username} {m.role?.includes('Admin') ? '(Quản trị)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Không gian làm việc riêng: <strong>{currentUser?.name || currentUser?.username}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. BẢNG THỜI KHÓA BIỂU KẾT HỢP TIMELINE */}
      <div className="bg-[#fffbf0] border border-[#cbb89d] rounded-2xl p-3 sm:p-4 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-xs">
          <thead>
            <tr className="bg-[#dfccb0] border-b-2 border-[#cbb89d]">
              <th className="p-2.5 text-center font-black text-[#3d2b17] w-28">
                Buổi / Tiết
              </th>
              {days.map(d => (
                <th key={d} className="p-2.5 text-center font-black text-[#3d2b17] text-sm">
                  {DAY_NAMES[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#cbb89d]/30">
            {/* BUỔI SÁNG - ĐỢT 1: TIẾT 1 & TIẾT 2 */}
            {morningPart1.map(period => (
              <tr key={`morning_${period}`}>
                <td className="p-2.5 text-center font-black bg-[#dfccb0]/35 border-r border-[#cbb89d]/40">
                  <span className="block text-amber-950 font-black text-xs">
                    Sáng {period}
                  </span>
                  <span className="text-[10.5px] text-[#5c4327] font-semibold block mt-0.5">
                    {PERIOD_TIMES[period]?.start} - {PERIOD_TIMES[period]?.end}
                  </span>
                </td>
                {days.map(d => (
                  <td key={`${d}-${period}`} className="p-1.5 align-top">
                    {renderPeriodCell(d, period)}
                  </td>
                ))}
              </tr>
            ))}

            {/* HÀNG GIỜ RA CHƠI GIỮA BUỔI SÁNG: 08:15 - 08:40 (25 PHÚT) */}
            <tr className="bg-gradient-to-r from-amber-100/80 via-amber-200/90 to-amber-100/80 text-center font-black text-xs text-amber-950 tracking-wider">
              <td colSpan={6} className="py-2.5 px-3 border-y-2 border-amber-300">
                <div className="flex items-center justify-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-800" />
                  <span>GIỜ RA CHƠI: 08:15 - 08:40 (25 phút giải lao)</span>
                </div>
              </td>
            </tr>

            {/* BUỔI SÁNG - ĐỢT 2: TIẾT 3, TIẾT 4 & TIẾT 5 (RA VỀ 10h35) */}
            {morningPart2.map(period => (
              <tr key={`morning_${period}`}>
                <td className="p-2.5 text-center font-black bg-[#dfccb0]/35 border-r border-[#cbb89d]/40">
                  <span className="block text-amber-950 font-black text-xs">
                    Sáng {period}
                  </span>
                  <span className="text-[10.5px] text-[#5c4327] font-semibold block mt-0.5">
                    {PERIOD_TIMES[period]?.start} - {PERIOD_TIMES[period]?.end}
                  </span>
                  {period === '5' && (
                    <span className="inline-block mt-0.5 text-[9.5px] font-bold text-emerald-800 bg-emerald-100/80 px-1 rounded border border-emerald-300">
                      Ra về 10:35
                    </span>
                  )}
                </td>
                {days.map(d => (
                  <td key={`${d}-${period}`} className="p-1.5 align-top">
                    {renderPeriodCell(d, period)}
                  </td>
                ))}
              </tr>
            ))}

            {/* HÀNG NGHỈ TRƯA & CHUẨN BỊ BUỔI CHIỀU: 10:35 - 14:00 */}
            <tr className="bg-gradient-to-r from-[#e8d9c2]/80 via-[#dfccb0] to-[#e8d9c2]/80 text-center font-black text-xs text-[#5c4327] tracking-wider">
              <td colSpan={6} className="py-2.5 px-3 border-y-2 border-[#cbb89d]">
                <div className="flex items-center justify-center gap-2">
                  <Sun className="w-4 h-4 text-amber-700" />
                  <span>NGHỈ TRƯA & CHUẨN BỊ BUỔI CHIỀU: 10:35 - 14:00</span>
                </div>
              </td>
            </tr>

            {/* BUỔI CHIỀU: CHIỀU 6, CHIỀU 7 & CHIỀU 8 (14:00 - 15:55, RA VỀ 16:10) */}
            {afternoonPeriods.map(period => (
              <tr key={`afternoon_${period}`}>
                <td className="p-2.5 text-center font-black bg-[#dfccb0]/35 border-r border-[#cbb89d]/40">
                  <span className="block text-amber-950 font-black text-xs">
                    Chiều {period}
                  </span>
                  <span className="text-[10.5px] text-[#5c4327] font-semibold block mt-0.5">
                    {PERIOD_TIMES[period]?.start} - {PERIOD_TIMES[period]?.end}
                  </span>
                  {period === '8' && (
                    <span className="inline-block mt-0.5 text-[9.5px] font-bold text-amber-900 bg-amber-100/90 px-1 rounded border border-amber-300">
                      Ra về 16:10
                    </span>
                  )}
                </td>
                {days.map(d => (
                  <td key={`${d}-${period}`} className="p-1.5 align-top">
                    {renderPeriodCell(d, period)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. BẢNG GHI CHÚ QUY ĐỊNH KHUNG GIỜ & WORKSPACE */}
      <div className="bg-[#fffbf0] border border-[#cbb89d] rounded-2xl p-3.5 sm:p-4 text-xs space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-amber-950 font-black">
          <Info className="w-4 h-4 text-amber-700" />
          <span>Quy định thời gian học & Đồng bộ không gian làm việc:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[#5c4327]">
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1">
            <span className="font-bold text-amber-950 block">🌅 Buổi Sáng (5 tiết)</span>
            <p>• Vào lớp: <strong>07:00</strong> | Ra chơi: <strong>08:15 - 08:40</strong> (25 phút)</p>
            <p>• Tiết 5 kết thúc: <strong>10:35</strong> (Học sinh tan học buổi sáng)</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1">
            <span className="font-bold text-amber-950 block">🌇 Buổi Chiều (3 tiết)</span>
            <p>• Vào lớp: <strong>14:00</strong> (Chiều 6, Chiều 7, Chiều 8)</p>
            <p>• Tiết 8 kết thúc: <strong>15:55</strong> (Học sinh ra về lúc <strong>16:10</strong>)</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
            <span className="font-bold text-emerald-950 block">🔒 Không gian làm việc riêng</span>
            <p>• Tôn trọng Workspace độc lập của từng tài khoản giáo viên.</p>
            <p>• Công việc, ghi chú và lịch dạy được bảo mật và tự động đồng bộ.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
