import React, { useState, useMemo } from 'react';
import { TeachingTask, TaskStatus, TaskPriority } from '../types';
import { TaskCard } from './TaskCard';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  ListTodo, 
  AlertTriangle, 
  Calendar,
  X
} from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../constants';

interface TaskListViewProps {
  tasks: TeachingTask[];
  onToggleComplete: (task: TeachingTask) => void;
  onEditTask: (task: TeachingTask) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTaskModal: () => void;
  selectedGradeId: number | null;
  selectedClassId: string | null;
  selectedSubject: string | null;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskModal,
  selectedGradeId,
  selectedClassId,
  selectedSubject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Lọc đa chiều
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Tìm kiếm văn bản
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = (task.description || '').toLowerCase().includes(q);
        const matchClass = (task.classId || '').toLowerCase().includes(q);
        const matchCat = task.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchClass && !matchCat) return false;
      }

      // Lọc trạng thái
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;

      // Lọc ưu tiên
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      // Lọc khối & lớp
      if (selectedGradeId !== null && task.gradeId && task.gradeId !== selectedGradeId) return false;
      if (selectedClassId && task.classId && task.classId !== selectedClassId) return false;
      if (selectedSubject && task.subject && task.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, selectedGradeId, selectedClassId, selectedSubject]);

  // Đếm theo trạng thái
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
    };
  }, [tasks]);

  return (
    <div className="space-y-4 text-[#3d2b17]">
      {/* THANH TÌM KIẾM & BỘ LỌC TRẠNG THÁI */}
      <div className="bg-[#fffbf0] border border-[#cbb89d] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Ô tìm kiếm thông minh */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc, tên lớp, giáo án, thiết bị..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#cbb89d] text-xs font-semibold text-[#3d2b17] placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc Ưu tiên */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-[#5c4327]">Ưu tiên:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#cbb89d] text-xs font-bold text-[#3d2b17] focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="urgent">⚡ Khẩn cấp</option>
              <option value="high">🚩 Ưu tiên cao</option>
              <option value="medium">📌 Bình thường</option>
              <option value="low">☕ Thấp</option>
            </select>
          </div>
        </div>

        {/* Các chip lọc trạng thái */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-[#3d2b17] text-[#fffbf0] shadow-xs'
                : 'bg-white border border-[#cbb89d] text-[#3d2b17] hover:bg-amber-100/50'
            }`}
          >
            Tất cả ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('todo')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'todo'
                ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                : 'bg-white border border-[#cbb89d] text-[#3d2b17] hover:bg-amber-100/50'
            }`}
          >
            🟡 Chưa làm ({counts.todo})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'in_progress'
                ? 'bg-sky-600 text-white font-black shadow-xs'
                : 'bg-white border border-[#cbb89d] text-[#3d2b17] hover:bg-sky-100/50'
            }`}
          >
            🔵 Đang làm ({counts.in_progress})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'bg-white border border-[#cbb89d] text-[#3d2b17] hover:bg-emerald-100/50'
            }`}
          >
            🟢 Hoàn thành ({counts.completed})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'overdue'
                ? 'bg-rose-600 text-white font-black shadow-xs'
                : 'bg-white border border-[#cbb89d] text-rose-700 hover:bg-rose-100/50'
            }`}
          >
            🔴 Quá hạn ({counts.overdue})
          </button>
        </div>
      </div>

      {/* DANH SÁCH THẺ CÔNG VIỆC */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#fffbf0] border border-dashed border-[#cbb89d] text-center space-y-3">
          <ListTodo className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-black text-base text-[#3d2b17]">Không tìm thấy công việc nào phù hợp!</h4>
          <p className="text-xs text-[#5c4327]">
            Thầy có thể thay đổi từ khóa tìm kiếm, điều chỉnh bộ lọc hoặc bấm nút bên dưới để tạo công việc mới.
          </p>
          <button
            type="button"
            onClick={onOpenNewTaskModal}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#3d2b17] text-[#fffbf0] hover:bg-[#2a1d0f] transition cursor-pointer"
          >
            + Tạo công việc mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              showScheduleBadge={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
