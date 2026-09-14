import React from 'react';
import { TeachingQuickNote, TeachingTask, CurrentClassContext } from '../types';
import { TaskCard } from './TaskCard';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  School, 
  Plus, 
  ArrowRight, 
  FileText,
  Trash2
} from 'lucide-react';
import { DAY_NAMES, PERIOD_TIMES } from '../constants';
import { TimetableCell } from '../../../types';

interface TodayDashboardProps {
  tasks: TeachingTask[];
  quickNotes: TeachingQuickNote[];
  currentContext: CurrentClassContext;
  scheduleMap: Record<string, TimetableCell>;
  onToggleComplete: (task: TeachingTask) => void;
  onEditTask: (task: TeachingTask) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTaskForPeriod: (day: string, period: string, className: string, subject: string) => void;
  onConvertToTask: (note: TeachingQuickNote) => void;
  onDeleteQuickNote: (noteId: string) => void;
  onOpenQuickNoteModal: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  tasks,
  quickNotes,
  currentContext,
  scheduleMap,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskForPeriod,
  onConvertToTask,
  onDeleteQuickNote,
  onOpenQuickNoteModal,
}) => {
  const now = new Date();
  const jsDay = now.getDay();
  const todayScheduleDay = jsDay >= 1 && jsDay <= 5 ? String(jsDay + 1) : '2';
  const todayStr = now.toISOString().split('T')[0];

  // Các tiết dạy của hôm nay
  const todayPeriods: Array<{ period: string; cell: TimetableCell; times: { session: string; start: string; end: string } }> = [];
  for (let p = 1; p <= 7; p++) {
    const periodStr = String(p);
    const key = `${todayScheduleDay}-${periodStr}`;
    const cell = scheduleMap[key];
    if (cell && cell.className) {
      todayPeriods.push({
        period: periodStr,
        cell,
        times: PERIOD_TIMES[periodStr] || { session: 'Sáng', start: '07:30', end: '08:05' },
      });
    }
  }

  // Lọc việc của ngày hôm nay hoặc chưa xong
  const todayTasks = tasks.filter(t => {
    if (t.plannedDate === todayStr) return true;
    if (t.scheduleDay === todayScheduleDay) return true;
    return false;
  });

  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const urgentToday = todayTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const overdueToday = tasks.filter(t => t.status === 'overdue').length;

  // Lọc ghi chú của hôm nay
  const todayNotes = quickNotes.filter(n => n.noteDate === todayStr);

  return (
    <div className="space-y-5 text-[#3d2b17]">
      {/* ⚠️ CẢNH BÁO TIẾT HỌC SẮP DIỄN RA CÒN VIỆC CHƯA CHUẨN BỊ */}
      {currentContext.isTeachingNow && urgentToday > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 text-white shadow-md flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-white/20">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </span>
            <div>
              <h4 className="font-black text-sm sm:text-base">
                Cảnh báo: Tiết {currentContext.period} lớp {currentContext.className} ({currentContext.subject}) có {urgentToday} việc khẩn cấp chưa hoàn thành!
              </h4>
              <p className="text-xs text-rose-100 font-medium">
                Vui lòng kiểm tra và chuẩn bị ngay thiết bị/học liệu cho học sinh.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CÁC THẺ THỐNG KÊ NHANH HÔM NAY (QUICK METRICS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#fffbf0] border border-[#cbb89d] shadow-xs">
          <span className="text-[11px] font-black text-[#5c4327] uppercase tracking-wider block mb-1">
            Tiết dạy hôm nay
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#3d2b17]">{todayPeriods.length}</span>
            <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
              {DAY_NAMES[todayScheduleDay] || 'Hôm nay'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#fffbf0] border border-[#cbb89d] shadow-xs">
          <span className="text-[11px] font-black text-[#5c4327] uppercase tracking-wider block mb-1">
            Việc cần làm hôm nay
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-900">{todayTasks.length}</span>
            <span className="text-xs font-bold text-slate-600">
              Xong {completedToday}/{todayTasks.length}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#fffbf0] border border-[#cbb89d] shadow-xs">
          <span className="text-[11px] font-black text-[#5c4327] uppercase tracking-wider block mb-1">
            Việc khẩn cấp
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-black ${urgentToday > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {urgentToday}
            </span>
            {urgentToday > 0 && (
              <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded">
                Cần làm ngay
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#fffbf0] border border-[#cbb89d] shadow-xs">
          <span className="text-[11px] font-black text-[#5c4327] uppercase tracking-wider block mb-1">
            Quá hạn tích lũy
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-black ${overdueToday > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {overdueToday}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {overdueToday === 0 ? 'Hoàn hảo ✨' : 'Cần xử lý'}
            </span>
          </div>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH: LỊCH TIẾT DẠY & CÔNG VIỆC TỪNG TIẾT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CỘT TRÁI (2/3): DANH SÁCH TIẾT DẠY & VIỆC ĐI KÈM */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-[#3d2b17] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-800" />
              Lịch tiết dạy và việc chuẩn bị hôm nay
            </h3>
            <span className="text-xs font-bold text-[#5c4327]">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          {todayPeriods.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#fffbf0] border border-dashed border-[#cbb89d] text-center space-y-2">
              <School className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-black text-sm text-[#3d2b17]">Hôm nay Thầy không có tiết dạy trên TKB!</p>
              <p className="text-xs text-[#5c4327]">
                Thầy có thể tranh thủ soạn giáo án hoặc lập kế hoạch cho tuần tới.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {todayPeriods.map(({ period, cell, times }) => {
                const periodTasks = todayTasks.filter(t => t.schedulePeriod === period);
                const isCurrent = currentContext.isTeachingNow && currentContext.period === period;

                return (
                  <div
                    key={period}
                    className={`rounded-2xl border transition p-4 ${
                      isCurrent
                        ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400 shadow-sm'
                        : 'bg-[#fffbf0] border-[#cbb89d]'
                    }`}
                  >
                    {/* Header Tiết */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#cbb89d]/30 mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#3d2b17] text-[#fffbf0] font-mono font-black text-xs">
                          Tiết {period}
                        </span>
                        <span className="font-black text-sm text-[#3d2b17]">
                          Lớp {cell.className} - {cell.subject || 'Tin học'}
                        </span>
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> ({times.start} - {times.end})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenNewTaskForPeriod(todayScheduleDay, period, cell.className, cell.subject || 'Tin học')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-white hover:bg-amber-100 text-[#3d2b17] border border-[#cbb89d] transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>Thêm việc tiết này</span>
                      </button>
                    </div>

                    {/* Danh sách công việc của tiết */}
                    {periodTasks.length === 0 ? (
                      <p className="text-xs text-[#5c4327]/70 italic py-1">
                        Chưa có công việc chuẩn bị nào cho tiết này. Bấm "Thêm việc tiết này" nếu cần chuẩn bị máy tính/tài liệu.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {periodTasks.map(task => (
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
                );
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI (1/3): GHI CHÚ NHANH HÔM NAY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-[#3d2b17] flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-700 fill-amber-700" />
              Ghi chú nhanh hôm nay ({todayNotes.length})
            </h3>
            <button
              type="button"
              onClick={onOpenQuickNoteModal}
              className="text-xs font-bold text-amber-900 hover:underline cursor-pointer"
            >
              + Ghi chú mới
            </button>
          </div>

          {todayNotes.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#fffbf0] border border-dashed border-[#cbb89d] text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-xs text-[#5c4327]">Chưa có ghi chú nào hôm nay</p>
              <button
                type="button"
                onClick={onOpenQuickNoteModal}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-400 text-amber-950 border border-amber-500 shadow-2xs hover:bg-amber-300 transition cursor-pointer"
              >
                ⚡ Ghi chú ngay
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayNotes.map(note => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-xl bg-[#fffbf0] border border-[#cbb89d] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#5c4327]">
                    <div className="flex items-center gap-1.5">
                      {note.classId && (
                        <span className="px-2 py-0.5 rounded bg-[#dfccb0] text-[#3d2b17] font-mono">
                          Lớp {note.classId}
                        </span>
                      )}
                      {note.period && <span>Tiết {note.period}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteQuickNote(note.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                      title="Xóa ghi chú"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="font-bold text-xs text-[#3d2b17] leading-relaxed break-words">
                    {note.content}
                  </p>

                  <div className="pt-2 border-t border-[#cbb89d]/30 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onConvertToTask(note)}
                      className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 transition cursor-pointer"
                    >
                      <span>Tạo việc tuần tới</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
