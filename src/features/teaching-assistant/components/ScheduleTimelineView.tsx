import React from 'react';
import { TeachingTask } from '../types';
import { DAY_NAMES, PERIOD_TIMES } from '../constants';
import { TimetableCell } from '../../../types';
import { Calendar, Plus, CheckCircle2, Clock } from 'lucide-react';

interface ScheduleTimelineViewProps {
  tasks: TeachingTask[];
  scheduleMap: Record<string, TimetableCell>;
  onOpenNewTaskForPeriod: (day: string, period: string, className: string, subject: string) => void;
  onEditTask: (task: TeachingTask) => void;
  onToggleComplete: (task: TeachingTask) => void;
}

export const ScheduleTimelineView: React.FC<ScheduleTimelineViewProps> = ({
  tasks,
  scheduleMap,
  onOpenNewTaskForPeriod,
  onEditTask,
  onToggleComplete,
}) => {
  const days = ['2', '3', '4', '5', '6'];
  const morningPeriods = ['1', '2', '3', '4'];
  const afternoonPeriods = ['5', '6', '7'];

  const renderPeriodCell = (day: string, period: string) => {
    const key = `${day}-${period}`;
    const cell = scheduleMap[key];
    const timeConfig = PERIOD_TIMES[period];

    // Lọc công việc của tiết này
    const periodTasks = tasks.filter(t => t.scheduleDay === day && t.schedulePeriod === period);
    const hasIncompleteTasks = periodTasks.some(t => t.status !== 'completed');

    if (!cell || !cell.className) {
      return (
        <div className="h-full min-h-[90px] p-2 rounded-xl bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 text-[10px]">
          Trống
        </div>
      );
    }

    return (
      <div
        className={`h-full min-h-[110px] p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
          hasIncompleteTasks
            ? 'bg-amber-50/90 border-amber-400 ring-1 ring-amber-300 shadow-2xs'
            : periodTasks.length > 0
            ? 'bg-emerald-50/80 border-emerald-300'
            : 'bg-white border-[#cbb89d] hover:border-amber-400'
        }`}
      >
        {/* Thông tin lớp học */}
        <div>
          <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100 mb-1.5">
            <span className="font-mono font-black text-xs text-[#3d2b17] bg-[#dfccb0] px-1.5 py-0.5 rounded">
              Lớp {cell.className}
            </span>
            <span className="text-[10px] font-bold text-[#5c4327]">
              {cell.subject || 'Tin học'}
            </span>
          </div>

          {/* Danh sách việc */}
          <div className="space-y-1">
            {periodTasks.map(t => {
              const isDone = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className={`text-[10px] font-bold p-1 rounded border flex items-center gap-1 cursor-pointer transition ${
                    isDone
                      ? 'bg-emerald-100/70 border-emerald-200 text-emerald-900 line-through'
                      : 'bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-200'
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
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full border border-amber-800" />
                    )}
                  </button>
                  <span className="truncate">{t.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nút thêm việc nhanh */}
        <button
          type="button"
          onClick={() => onOpenNewTaskForPeriod(day, period, cell.className, cell.subject || 'Tin học')}
          className="mt-2 text-[10px] font-black text-[#5c4327] hover:text-amber-950 flex items-center justify-center gap-0.5 py-0.5 rounded hover:bg-amber-100 transition cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Thêm việc
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-[#3d2b17]">
      <div className="bg-[#fffbf0] border border-[#cbb89d] rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500 text-amber-950">
            <Calendar className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <h3 className="font-black text-base sm:text-lg text-[#3d2b17]">
              Lịch đối chiếu Thời khóa biểu & Công việc
            </h3>
            <p className="text-xs text-[#5c4327]">
              Xem đồng thời tiết dạy và những việc cần chuẩn bị theo từng ô thời gian
            </p>
          </div>
        </div>
      </div>

      {/* BẢNG LỊCH CHÍNH (TIMELINE GRID) */}
      <div className="bg-[#fffbf0] border border-[#cbb89d] rounded-2xl p-3 sm:p-4 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-xs">
          <thead>
            <tr className="bg-[#dfccb0] border-b border-[#cbb89d]">
              <th className="p-2.5 text-center font-black text-[#3d2b17] w-24">Buổi / Tiết</th>
              {days.map(d => (
                <th key={d} className="p-2.5 text-center font-black text-[#3d2b17]">
                  {DAY_NAMES[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#cbb89d]/30">
            {/* BUỔI SÁNG */}
            {morningPeriods.map((period, idx) => (
              <tr key={`morning_${period}`}>
                <td className="p-2 text-center font-black bg-[#dfccb0]/30 border-r border-[#cbb89d]/30">
                  <span className="block text-amber-950">Tiết {period}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {PERIOD_TIMES[period].start}
                  </span>
                </td>
                {days.map(d => (
                  <td key={`${d}-${period}`} className="p-1.5 align-top">
                    {renderPeriodCell(d, period)}
                  </td>
                ))}
              </tr>
            ))}

            {/* HÀNG GIỜ RA CHƠI */}
            <tr className="bg-amber-100/50 text-center font-black text-[11px] text-amber-900 tracking-wider">
              <td colSpan={6} className="py-1 border-y border-amber-200">
                ☕ GIỜ NGHỈ GIẢI LAO TRƯA
              </td>
            </tr>

            {/* BUỔI CHIỀU */}
            {afternoonPeriods.map(period => (
              <tr key={`afternoon_${period}`}>
                <td className="p-2 text-center font-black bg-[#dfccb0]/30 border-r border-[#cbb89d]/30">
                  <span className="block text-amber-950">Tiết {period}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {PERIOD_TIMES[period].start}
                  </span>
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
    </div>
  );
};
