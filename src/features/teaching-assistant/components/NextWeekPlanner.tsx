import React, { useState } from 'react';
import { TeachingTask } from '../types';
import { TaskCard } from './TaskCard';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  School, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  BookOpen,
  Filter
} from 'lucide-react';
import { DAY_NAMES, PERIOD_TIMES } from '../constants';
import { getDateOfWeekDay } from '../services/scheduleMatchingEngine';
import { TimetableCell } from '../../../types';

interface NextWeekPlannerProps {
  tasks: TeachingTask[];
  scheduleMap: Record<string, TimetableCell>;
  onToggleComplete: (task: TeachingTask) => void;
  onEditTask: (task: TeachingTask) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTaskForPeriod: (day: string, period: string, className: string, subject: string, dateStr: string) => void;
  selectedGradeId: number | null;
  selectedClassId: string | null;
  selectedSubject: string | null;
}

export const NextWeekPlanner: React.FC<NextWeekPlannerProps> = ({
  tasks,
  scheduleMap,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskForPeriod,
  selectedGradeId,
  selectedClassId,
  selectedSubject,
}) => {
  // weekOffset: 0 = Tuần này, 1 = Tuần tới (Mặc định trọng tâm), 2 = Tuần kế tiếp
  const [weekOffset, setWeekOffset] = useState<number>(1);

  // Tính ngày đầu tuần và cuối tuần
  const mondayInfo = getDateOfWeekDay('2', weekOffset);
  const fridayInfo = getDateOfWeekDay('6', weekOffset);

  const days = ['2', '3', '4', '5', '6'];

  // Lọc việc theo khối, lớp, môn nếu có
  const filteredTasks = tasks.filter(t => {
    if (selectedGradeId !== null && t.gradeId && t.gradeId !== selectedGradeId) return false;
    if (selectedClassId && t.classId && t.classId !== selectedClassId) return false;
    if (selectedSubject && t.subject && t.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
    return true;
  });

  // Thống kê tổng số việc trong tuần
  const weekTasks = filteredTasks.filter(t => {
    // Có thể khớp theo scheduleDay hoặc plannedDate
    return t.scheduleDay && days.includes(t.scheduleDay);
  });
  const completedCount = weekTasks.filter(t => t.status === 'completed').length;
  const urgentCount = weekTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  return (
    <div className="space-y-4 text-[#3d2b17]">
      {/* THANH ĐIỀU HƯỚNG TUẦN & TỔNG QUAN */}
      <div className="bg-[#fffbf0] border border-[#cbb89d] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-amber-950">
              <CalendarDays className="w-5 h-5 stroke-[2.5]" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#3d2b17]">
              {weekOffset === 1
                ? 'Kế hoạch công việc TUẦN TỚI'
                : weekOffset === 0
                ? 'Kế hoạch công việc TUẦN NÀY'
                : 'Kế hoạch công việc TUẦN SAU NỮA'}
            </h2>
            <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-md border border-amber-300">
              Từ {mondayInfo.displayStr} đến {fridayInfo.displayStr}
            </span>
          </div>
          <p className="text-xs text-[#5c4327] mt-1 font-medium">
            Lập kế hoạch giáo án, thiết bị và bài thực hành trước cho từng lớp theo Thời khóa biểu
          </p>
        </div>

        {/* Nút chuyển tuần & Thống kê */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Badge thống kê việc tuần */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-950">
              Tổng {weekTasks.length} việc
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950">
              Xong {completedCount}/{weekTasks.length}
            </span>
            {urgentCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 animate-pulse">
                ⚡ {urgentCount} khẩn
              </span>
            )}
          </div>

          {/* Cụm chuyển tuần */}
          <div className="flex items-center gap-1 bg-[#dfccb0]/50 p-1 rounded-xl border border-[#cbb89d]">
            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-white text-[#3d2b17] transition cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(1)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                weekOffset === 1 ? 'bg-[#3d2b17] text-white shadow-2xs' : 'text-[#3d2b17] hover:bg-white'
              }`}
            >
              Tuần tới
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-1.5 rounded-lg hover:bg-white text-[#3d2b17] transition cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5 CỘT TỪ THỨ 2 ĐẾN THỨ 6 (RESPONSIVE GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5 items-start">
        {days.map(dayStr => {
          const { dateStr, displayStr } = getDateOfWeekDay(dayStr, weekOffset);
          const dayName = DAY_NAMES[dayStr];

          // Lấy danh sách tiết TKB của ngày này
          const daySlots: Array<{ period: string; cell: TimetableCell; times: { session: string; start: string; end: string } }> = [];
          for (let p = 1; p <= 7; p++) {
            const periodStr = String(p);
            const key = `${dayStr}-${periodStr}`;
            const cell = scheduleMap[key];
            if (cell && cell.className) {
              // Áp dụng bộ lọc nếu có
              if (selectedClassId && cell.className !== selectedClassId) continue;
              if (selectedSubject && cell.subject && cell.subject.toLowerCase() !== selectedSubject.toLowerCase()) continue;

              daySlots.push({
                period: periodStr,
                cell,
                times: PERIOD_TIMES[periodStr] || { session: 'Sáng', start: '07:30', end: '08:05' },
              });
            }
          }

          // Việc của ngày này
          const dayTasks = filteredTasks.filter(t => t.scheduleDay === dayStr || t.plannedDate === dateStr);

          return (
            <div
              key={dayStr}
              className="rounded-2xl border border-[#cbb89d] bg-[#fffbf0] overflow-hidden shadow-xs flex flex-col min-h-[380px]"
            >
              {/* Header Cột Thứ */}
              <div className="bg-gradient-to-r from-[#dfccb0] to-[#e8d9c2] px-3.5 py-3 border-b border-[#cbb89d] flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-[#3d2b17]">{dayName}</h3>
                  <span className="text-[11px] font-bold text-[#5c4327]">Ngày {displayStr}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/70 text-[#3d2b17] text-[10px] font-black border border-[#cbb89d]">
                  {daySlots.length} tiết
                </span>
              </div>

              {/* Danh sách các tiết TKB và Việc của từng tiết */}
              <div className="p-3 space-y-3 flex-1">
                {daySlots.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    Không có tiết dạy theo TKB
                  </div>
                ) : (
                  daySlots.map(({ period, cell, times }) => {
                    // Lọc việc gắn trực tiếp với tiết này
                    const slotTasks = dayTasks.filter(t => t.schedulePeriod === period);

                    return (
                      <div
                        key={period}
                        className="rounded-xl border border-[#cbb89d]/70 bg-white/80 p-2.5 space-y-2 shadow-2xs hover:border-amber-400 transition"
                      >
                        {/* Tiêu đề tiết học */}
                        <div className="flex items-center justify-between gap-1 flex-wrap pb-1.5 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded">
                              T.{period}
                            </span>
                            <span className="font-black text-xs text-[#3d2b17]">
                              Lớp {cell.className}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#5c4327]">
                            {cell.subject || 'Tin học'}
                          </span>
                        </div>

                        {/* Danh sách việc của tiết này */}
                        {slotTasks.length > 0 && (
                          <div className="space-y-1.5">
                            {slotTasks.map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onToggleComplete={onToggleComplete}
                                onEdit={onEditTask}
                                onDelete={onDeleteTask}
                                showScheduleBadge={false}
                              />
                            ))}
                          </div>
                        )}

                        {/* Nút thêm nhanh việc cho tiết này */}
                        <button
                          type="button"
                          onClick={() => onOpenNewTaskForPeriod(dayStr, period, cell.className, cell.subject || 'Tin học', dateStr)}
                          className="w-full py-1 rounded-lg text-[11px] font-bold text-amber-900 hover:text-amber-950 hover:bg-amber-100/70 border border-dashed border-amber-300/80 transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>+ Việc cần làm</span>
                        </button>
                      </div>
                    );
                  })
                )}

                {/* Các việc chung trong ngày (không gắn tiết cụ thể) */}
                {dayTasks.filter(t => !t.schedulePeriod).length > 0 && (
                  <div className="pt-2 border-t border-[#cbb89d]/30 space-y-1.5">
                    <span className="text-[10px] font-black text-[#5c4327] uppercase tracking-wider block">
                      Việc chung trong ngày:
                    </span>
                    {dayTasks.filter(t => !t.schedulePeriod).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        showScheduleBadge={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
