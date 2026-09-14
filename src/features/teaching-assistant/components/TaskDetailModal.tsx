import React, { useState, useEffect, useMemo } from 'react';
import { 
  TeachingTask, 
  TaskPriority, 
  TaskCategory, 
  TaskStatus, 
  MatchedScheduleSlot 
} from '../types';
import { 
  DEFAULT_CATEGORIES, 
  PRIORITY_CONFIG, 
  STATUS_CONFIG, 
  INFORMATICS_TASK_TEMPLATES, 
  GENERAL_TASK_TEMPLATES, 
  DAY_NAMES,
  PERIOD_TIMES
} from '../constants';
import { ClassItem, Grade, TimetableCell } from '../../../types';
import { findMatchingSlotsForClass, getDateOfWeekDay } from '../services/scheduleMatchingEngine';
import { 
  X, 
  CheckSquare, 
  Calendar, 
  Clock, 
  Sparkles, 
  School, 
  BookOpen, 
  Repeat, 
  Bell, 
  Zap, 
  Flag 
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TeachingTask | null;
  initialValues?: Partial<TeachingTask>;
  onSaveTask: (taskData: Omit<TeachingTask, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  classes: ClassItem[];
  grades: Grade[];
  scheduleMap: Record<string, TimetableCell>;
  workspaceId: string;
  userId: string;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialValues,
  onSaveTask,
  classes,
  grades,
  scheduleMap,
  workspaceId,
  userId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Chuẩn bị bài');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('Tin học');
  const [scheduleDay, setScheduleDay] = useState('');
  const [schedulePeriod, setSchedulePeriod] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'by_timetable'>('weekly');

  // Load task to edit or initial values
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setCategory(taskToEdit.category);
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
        setSelectedClass(taskToEdit.classId || '');
        setSubject(taskToEdit.subject || 'Tin học');
        setScheduleDay(taskToEdit.scheduleDay || '');
        setSchedulePeriod(taskToEdit.schedulePeriod || '');
        setPlannedDate(taskToEdit.plannedDate || '');
        setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.slice(0, 16) : '');
        setReminderMinutes(taskToEdit.reminderBeforeMinutes || 30);
        setIsRecurring(Boolean(taskToEdit.isRecurring));
        setRecurrenceType(taskToEdit.recurrenceType || 'none');
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setTitle(initialValues?.title || '');
        setDescription(initialValues?.description || '');
        setCategory(initialValues?.category || 'Chuẩn bị bài');
        setPriority(initialValues?.priority || 'medium');
        setStatus('todo');
        setSelectedClass(initialValues?.classId || '');
        setSubject(initialValues?.subject || 'Tin học');
        setScheduleDay(initialValues?.scheduleDay || '');
        setSchedulePeriod(initialValues?.schedulePeriod || '');
        setPlannedDate(initialValues?.plannedDate || todayStr);
        setDueDate(initialValues?.dueDate || '');
        setReminderMinutes(initialValues?.reminderBeforeMinutes || 30);
        setIsRecurring(Boolean(initialValues?.isRecurring));
        setRecurrenceType(initialValues?.recurrenceType || 'none');
      }
    }
  }, [isOpen, taskToEdit, initialValues]);

  // Tìm các tiết TKB phù hợp khi chọn lớp
  const matchingSlots: MatchedScheduleSlot[] = useMemo(() => {
    if (!selectedClass) return [];
    return findMatchingSlotsForClass(scheduleMap, selectedClass, subject);
  }, [scheduleMap, selectedClass, subject]);

  if (!isOpen) return null;

  // Khi click vào 1 tiết TKB gợi ý: Tự động điền Thứ, Tiết và tính ngày/giờ
  const handleSelectSlot = (slot: MatchedScheduleSlot) => {
    setScheduleDay(slot.day);
    setSchedulePeriod(slot.period);

    // Tự động tính ngày cho tuần tới hoặc tuần hiện tại
    const { dateStr } = getDateOfWeekDay(slot.day, 1); // Ưu tiên tuần tới
    setPlannedDate(dateStr);
    setDueDate(`${dateStr}T${slot.startTime}`);
  };

  // Áp dụng mẫu công việc 1-chạm
  const handleApplyTemplate = (tpl: { title: string; category: string; priority: TaskPriority }) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    setPriority(tpl.priority);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Tìm gradeId tương ứng với classId
    let gradeId: number | undefined;
    if (selectedClass) {
      const matchClass = classes.find(c => c.name === selectedClass);
      if (matchClass) gradeId = matchClass.gradeId;
    }

    onSaveTask({
      id: taskToEdit?.id,
      workspaceId,
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      gradeId,
      classId: selectedClass || undefined,
      subject: subject || undefined,
      category,
      priority,
      status,
      plannedDate: plannedDate || undefined,
      dueDate: dueDate || undefined,
      scheduleDay: scheduleDay || undefined,
      schedulePeriod: schedulePeriod || undefined,
      reminderBeforeMinutes: reminderMinutes,
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : 'none',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col text-[#3d2b17]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#dfccb0] via-[#e8d9c2] to-[#dfccb0] px-5 py-3.5 border-b border-[#cbb89d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-amber-950 shadow-2xs">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </span>
            <h3 className="font-black text-base sm:text-lg text-[#3d2b17]">
              {taskToEdit ? 'Chỉnh sửa công việc giảng dạy' : 'Tạo công việc giảng dạy mới'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#3d2b17]/70 hover:text-[#3d2b17] hover:bg-[#dfccb0] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Gợi ý mẫu 1-chạm (Quick Templates) */}
          {!taskToEdit && (
            <div className="p-3 rounded-xl bg-[#dfccb0]/40 border border-[#cbb89d] space-y-1.5">
              <span className="font-black text-[11px] text-[#5c4327] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Mẫu việc chuẩn bị nhanh 1-chạm:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {INFORMATICS_TASK_TEMPLATES.slice(0, 4).map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white/80 hover:bg-amber-100 text-[#3d2b17] border border-[#cbb89d] transition cursor-pointer"
                  >
                    + {tpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tiêu đề công việc */}
          <div>
            <label className="block text-xs font-black text-[#5c4327] mb-1">
              Nội dung công việc cần làm <span className="text-rose-600">*</span>:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Chuẩn bị bài 8 - Làm quen với thư mục, In phiếu bài tập..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Chọn Lớp & Môn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1 flex items-center gap-1">
                <School className="w-3.5 h-3.5" /> Áp dụng cho Lớp:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">-- Toàn khối / Việc chung --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>
                    Lớp {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Môn học:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Tin học"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* KHU VỰC LIÊN KẾT TKB THÔNG MINH */}
          {selectedClass && matchingSlots.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-100/60 border border-amber-300 space-y-2">
              <span className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-800" />
                Hệ thống tìm thấy các tiết TKB Thầy dạy lớp {selectedClass}:
              </span>
              <div className="flex flex-wrap gap-2">
                {matchingSlots.map((slot, idx) => {
                  const isSelected = scheduleDay === slot.day && schedulePeriod === slot.period;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#3d2b17] text-[#fffbf0] border-[#3d2b17] shadow-xs'
                          : 'bg-white hover:bg-amber-200/80 text-amber-950 border-amber-400'
                      }`}
                    >
                      <span>📅 {DAY_NAMES[slot.day]} - Tiết {slot.period} ({slot.startTime})</span>
                      {isSelected && <span className="text-[10px] bg-amber-400 text-amber-950 px-1 rounded">Đã chọn</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phân loại & Mức độ ưu tiên */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1">
                Loại công việc:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" /> Mức độ ưu tiên:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="urgent">⚡ Khẩn cấp</option>
                <option value="high">🚩 Ưu tiên cao</option>
                <option value="medium">📌 Bình thường</option>
                <option value="low">☕ Thấp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1">
                Trạng thái:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="todo">🟡 Chưa làm</option>
                <option value="in_progress">🔵 Đang làm</option>
                <option value="completed">🟢 Hoàn thành</option>
                <option value="overdue">🔴 Quá hạn</option>
                <option value="cancelled">⚪ Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Ngày thực hiện & Hạn chót & Nhắc việc */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Ngày thực hiện:
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Hạn hoàn thành:
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5" /> Nhắc trước tiết học:
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value={15}>Trước 15 phút</option>
                <option value={30}>Trước 30 phút</option>
                <option value={60}>Trước 1 giờ</option>
                <option value={180}>Trước 3 giờ</option>
                <option value={1440}>Trước 1 ngày</option>
              </select>
            </div>
          </div>

          {/* Cấu hình lặp lại */}
          <div className="p-3 rounded-xl bg-white/70 border border-[#cbb89d] flex items-center justify-between flex-wrap gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-black text-xs text-[#3d2b17] flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-amber-700" />
                Công việc lặp lại định kỳ
              </span>
            </label>

            {isRecurring && (
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950 cursor-pointer"
              >
                <option value="daily">Hằng ngày</option>
                <option value="weekly">Hằng tuần (Vào ngày này)</option>
                <option value="by_timetable">Theo tiết dạy TKB mỗi tuần</option>
              </select>
            )}
          </div>

          {/* Ghi chú chi tiết */}
          <div>
            <label className="block text-xs font-black text-[#5c4327] mb-1">
              Ghi chú thêm (không bắt buộc):
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết bài tập, dặn dò học sinh, lưu ý thiết bị..."
              className="w-full p-2.5 rounded-xl bg-white border border-[#cbb89d] font-semibold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Nút bấm Lưu / Hủy */}
          <div className="pt-2 border-t border-[#cbb89d]/40 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-[#3d2b17] hover:bg-[#2a1d0f] text-[#fffbf0] shadow-md hover:scale-[1.01] active:scale-95 transition cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{taskToEdit ? 'Lưu thay đổi' : 'Tạo công việc'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
