import React from 'react';
import { TeachingTask } from '../types';
import { PRIORITY_CONFIG, STATUS_CONFIG, DAY_NAMES, PERIOD_TIMES } from '../constants';
import { CheckCircle2, Circle, Clock, Edit2, Trash2, Calendar, AlertTriangle, Repeat } from 'lucide-react';

interface TaskCardProps {
  task: TeachingTask;
  onToggleComplete: (task: TeachingTask) => void;
  onEdit: (task: TeachingTask) => void;
  onDelete: (taskId: string) => void;
  showScheduleBadge?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  showScheduleBadge = true,
}) => {
  const isDone = task.status === 'completed';
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

  const dayLabel = task.scheduleDay ? DAY_NAMES[task.scheduleDay] || `Thứ ${task.scheduleDay}` : '';
  const periodTime = task.schedulePeriod ? PERIOD_TIMES[task.schedulePeriod] : null;

  return (
    <div
      className={`group relative rounded-xl border p-3.5 transition-all duration-200 shadow-xs hover:shadow-md ${
        isDone
          ? 'bg-emerald-50/40 border-emerald-200 opacity-80'
          : task.status === 'overdue'
          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
          : 'bg-[#fffbf0] border-[#cbb89d] hover:border-amber-500'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Nút check hoàn thành */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
          title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
        >
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : (
            <Circle className="w-5 h-5 text-[#854d0e] hover:text-emerald-600" />
          )}
        </button>

        {/* Nội dung công việc */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Tag Lớp */}
            {task.classId && (
              <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-md bg-[#dfccb0] text-[#3d2b17] border border-[#cbb89d] shadow-2xs">
                Lớp {task.classId}
              </span>
            )}

            {/* Tag Loại việc */}
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-950 border border-amber-300/80">
              {task.category}
            </span>

            {/* Tag Mức độ ưu tiên */}
            <span
              className={`text-[10.5px] font-black px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${priority.bg} ${priority.text} ${priority.border}`}
            >
              <span>{priority.icon}</span>
              <span>{priority.label}</span>
            </span>

            {/* Tag Lặp lại */}
            {task.isRecurring && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-0.5">
                <Repeat className="w-3 h-3" /> Lặp lại
              </span>
            )}
          </div>

          {/* Tiêu đề công việc */}
          <h4
            className={`font-black text-sm text-[#3d2b17] leading-snug break-words ${
              isDone ? 'line-through text-slate-500' : ''
            }`}
          >
            {task.title}
          </h4>

          {/* Ghi chú mô tả */}
          {task.description && (
            <p className="text-xs text-[#5c4327]/80 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Dòng thông tin liên kết TKB / Hạn chót */}
          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-[#cbb89d]/30 text-[11px] text-[#5c4327] flex-wrap">
            {showScheduleBadge && task.scheduleDay && task.schedulePeriod && (
              <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/50 px-2 py-0.5 rounded">
                <Calendar className="w-3.5 h-3.5 text-amber-800" />
                {dayLabel} - Tiết {task.schedulePeriod} {periodTime ? `(${periodTime.start})` : ''}
              </span>
            )}

            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  task.status === 'overdue' ? 'text-rose-700 font-bold' : 'text-slate-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {task.status === 'overdue' ? 'Hạn chót: Quá hạn' : `Hạn: ${new Date(task.dueDate).toLocaleDateString('vi-VN')} ${new Date(task.dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            )}
          </div>
        </div>

        {/* Nút hành động sửa/xóa */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-[#5c4327] hover:text-amber-900 hover:bg-amber-200/60 transition cursor-pointer"
            title="Chỉnh sửa công việc"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer"
            title="Xóa công việc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
