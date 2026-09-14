import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AssistantActiveTab, 
  CurrentClassContext, 
  TeachingQuickNote, 
  TeachingTask 
} from './types';
import { 
  getTeacherScheduleMap, 
  resolveCurrentClassContext, 
  extractTeacherSubjects,
  getDateOfWeekDay 
} from './services/scheduleMatchingEngine';
import { 
  loadTeachingTasks, 
  saveTeachingTasks, 
  loadTeachingQuickNotes, 
  saveTeachingQuickNotes 
} from './services/taskStorageService';
import { getWorkspaceId } from '../../services/workspaceService';
import { ClassItem, Grade, Member, TimetableData } from '../../types';
import { AssistantHeader } from './components/AssistantHeader';
import { TodayDashboard } from './components/TodayDashboard';
import { NextWeekPlanner } from './components/NextWeekPlanner';
import { TaskListView } from './components/TaskListView';
import { ScheduleTimelineView } from './components/ScheduleTimelineView';
import { QuickNoteModal } from './components/QuickNoteModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { playStarRewardSound, playWarningDeductSound } from '../../utils/audioEffects';
import { Plus, Zap } from 'lucide-react';

export interface TeachingAssistantProps {
  currentUser: Member | null;
  members: Member[];
  classes: ClassItem[];
  grades: Grade[];
  timetableData: TimetableData;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  dbStates?: Record<string, any>;
}

export default function TeachingAssistant({
  currentUser,
  members,
  classes,
  grades,
  timetableData,
  showToast,
  dbStates,
}: TeachingAssistantProps) {
  const workspaceId = getWorkspaceId(currentUser);
  const userId = currentUser?.id || currentUser?.username || 'user';

  // Chế độ xem hiện tại: Mặc định là 'today' hoặc 'next_week'
  const [activeTab, setActiveTab] = useState<AssistantActiveTab>('today');

  // Danh sách công việc và ghi chú nhanh
  const [tasks, setTasks] = useState<TeachingTask[]>([]);
  const [quickNotes, setQuickNotes] = useState<TeachingQuickNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Bộ lọc Khối / Lớp / Môn
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Trạng thái Modals
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TeachingTask | null>(null);
  const [taskModalInitialValues, setTaskModalInitialValues] = useState<Partial<TeachingTask>>({});

  // Lấy TKB của giáo viên hiện tại
  const teacherScheduleMap = useMemo(() => {
    return getTeacherScheduleMap(timetableData, currentUser);
  }, [timetableData, currentUser]);

  // Trích xuất danh sách môn học của giáo viên
  const teacherSubjects = useMemo(() => {
    return extractTeacherSubjects(teacherScheduleMap);
  }, [teacherScheduleMap]);

  // Ngữ cảnh lớp học hiện tại (cập nhật mỗi 30 giây)
  const [currentContext, setCurrentContext] = useState<CurrentClassContext>(() => {
    return resolveCurrentClassContext(teacherScheduleMap);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentContext(resolveCurrentClassContext(teacherScheduleMap));
    }, 30000);
    return () => clearInterval(timer);
  }, [teacherScheduleMap]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      const loadedTasks = await loadTeachingTasks(currentUser, dbStates);
      const loadedNotes = await loadTeachingQuickNotes(currentUser, dbStates);
      if (isMounted) {
        setTasks(loadedTasks);
        setQuickNotes(loadedNotes);
        setIsLoaded(true);
      }
    }
    initData();
    return () => {
      isMounted = false;
    };
  }, [currentUser, dbStates]);

  // Tự động kiểm tra và nhắc nhở việc sắp đến hạn trước tiết học
  useEffect(() => {
    if (!isLoaded || tasks.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status === 'todo' && task.dueDate) {
          const dueTime = new Date(task.dueDate).getTime();
          const remindBeforeMs = (task.reminderBeforeMinutes || 30) * 60 * 1000;
          const remindTime = dueTime - remindBeforeMs;
          const diffMs = dueTime - now.getTime();

          // Nếu đang trong khung giờ nhắc nhở (còn từ 0 đến reminderMinutes phút)
          if (now.getTime() >= remindTime && diffMs > 0 && diffMs <= 10 * 60 * 1000) {
            playWarningDeductSound();
            showToast(
              `⏰ Nhắc việc: "${task.title}" (Lớp ${task.classId || ''}) sắp đến giờ học!`,
              'warning'
            );
          }
        }
      });
    };

    const reminderInterval = setInterval(checkReminders, 60000); // 1 phút kiểm tra 1 lần
    return () => clearInterval(reminderInterval);
  }, [tasks, isLoaded, showToast]);

  // Thao tác: Đánh dấu hoàn thành / chưa hoàn thành
  const handleToggleComplete = useCallback((task: TeachingTask) => {
    const isNowCompleted = task.status !== 'completed';
    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: (isNowCompleted ? 'completed' : 'todo') as any,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    saveTeachingTasks(updatedTasks, currentUser);

    if (isNowCompleted) {
      playStarRewardSound();
      showToast('Đã đánh dấu hoàn thành công việc! 🎉', 'success');
    }
  }, [tasks, currentUser, showToast]);

  // Thao tác: Lưu hoặc Cập nhật công việc
  const handleSaveTask = useCallback((taskData: Omit<TeachingTask, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    let updatedTasks: TeachingTask[];
    const nowIso = new Date().toISOString();

    if (taskData.id) {
      // Cập nhật việc cũ
      updatedTasks = tasks.map(t => {
        if (t.id === taskData.id) {
          return {
            ...t,
            ...taskData,
            id: t.id,
            updatedAt: nowIso,
          } as TeachingTask;
        }
        return t;
      });
      showToast('Đã cập nhật công việc!', 'success');
    } else {
      // Thêm việc mới
      const newTask: TeachingTask = {
        ...taskData,
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      updatedTasks = [newTask, ...tasks];
      showToast('Đã thêm công việc mới vào kế hoạch!', 'success');
    }

    setTasks(updatedTasks);
    saveTeachingTasks(updatedTasks, currentUser);
  }, [tasks, currentUser, showToast]);

  // Thao tác: Xóa công việc
  const handleDeleteTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    saveTeachingTasks(updatedTasks, currentUser);
    showToast('Đã xóa công việc.', 'info');
  }, [tasks, currentUser, showToast]);

  // Thao tác: Mở modal thêm việc cho một tiết cụ thể
  const handleOpenNewTaskForPeriod = useCallback((
    day: string,
    period: string,
    className: string,
    subject: string,
    customDateStr?: string
  ) => {
    const { dateStr } = getDateOfWeekDay(day, 1); // Mặc định tuần tới
    const targetDate = customDateStr || dateStr;

    setTaskToEdit(null);
    setTaskModalInitialValues({
      classId: className,
      subject,
      scheduleDay: day,
      schedulePeriod: period,
      plannedDate: targetDate,
      dueDate: `${targetDate}T08:00:00`,
      priority: 'high',
      category: 'Chuẩn bị bài',
    });
    setIsNewTaskModalOpen(true);
  }, []);

  // Thao tác: Lưu ghi chú nhanh
  const handleSaveQuickNote = useCallback((noteData: Omit<TeachingQuickNote, 'id' | 'createdAt'>) => {
    const newNote: TeachingQuickNote = {
      ...noteData,
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNote, ...quickNotes];
    setQuickNotes(updated);
    saveTeachingQuickNotes(updated, currentUser);
    playStarRewardSound();
    showToast('Đã lưu ghi chú nhanh thành công!', 'success');
  }, [quickNotes, currentUser, showToast]);

  // Thao tác: Xóa ghi chú nhanh
  const handleDeleteQuickNote = useCallback((noteId: string) => {
    const updated = quickNotes.filter(n => n.id !== noteId);
    setQuickNotes(updated);
    saveTeachingQuickNotes(updated, currentUser);
    showToast('Đã xóa ghi chú.', 'info');
  }, [quickNotes, currentUser, showToast]);

  // Thao tác: Chuyển ghi chú thành công việc tuần tới
  const handleConvertNoteToTask = useCallback((noteContent: string, classId?: string, subject?: string) => {
    setTaskToEdit(null);
    setTaskModalInitialValues({
      title: noteContent,
      classId: classId || '',
      subject: subject || 'Tin học',
      category: 'Chuẩn bị thiết bị',
      priority: 'high',
      description: `Ghi chú ghi nhận từ tiết dạy: "${noteContent}"`,
    });
    setIsNewTaskModalOpen(true);
  }, []);

  // Đếm công việc chưa hoàn thành và khẩn cấp
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
  const urgentTasksCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  return (
    <div className="space-y-6 pb-20 text-[#3d2b17]">
      {/* 1. Header & Điều hướng Tab chính */}
      <AssistantHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        grades={grades}
        classes={classes}
        subjects={teacherSubjects}
        selectedGradeId={selectedGradeId}
        setSelectedGradeId={setSelectedGradeId}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        onOpenNewTaskModal={() => {
          setTaskToEdit(null);
          setTaskModalInitialValues({});
          setIsNewTaskModalOpen(true);
        }}
        onOpenQuickNoteModal={() => setIsQuickNoteModalOpen(true)}
        workspaceId={workspaceId}
        members={members}
        pendingTasksCount={pendingTasksCount}
        urgentTasksCount={urgentTasksCount}
      />

      {/* 2. Nội dung chính theo Tab được chọn */}
      {activeTab === 'today' && (
        <TodayDashboard
          tasks={tasks}
          quickNotes={quickNotes}
          currentContext={currentContext}
          scheduleMap={teacherScheduleMap}
          onToggleComplete={handleToggleComplete}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setIsNewTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onOpenNewTaskForPeriod={handleOpenNewTaskForPeriod}
          onConvertToTask={(note) => handleConvertNoteToTask(note.content, note.classId, note.subject)}
          onDeleteQuickNote={handleDeleteQuickNote}
          onOpenQuickNoteModal={() => setIsQuickNoteModalOpen(true)}
        />
      )}

      {activeTab === 'next_week' && (
        <NextWeekPlanner
          tasks={tasks}
          scheduleMap={teacherScheduleMap}
          onToggleComplete={handleToggleComplete}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setIsNewTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onOpenNewTaskForPeriod={handleOpenNewTaskForPeriod}
          selectedGradeId={selectedGradeId}
          selectedClassId={selectedClassId}
          selectedSubject={selectedSubject}
        />
      )}

      {activeTab === 'all_tasks' && (
        <TaskListView
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setIsNewTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onOpenNewTaskModal={() => {
            setTaskToEdit(null);
            setTaskModalInitialValues({});
            setIsNewTaskModalOpen(true);
          }}
          selectedGradeId={selectedGradeId}
          selectedClassId={selectedClassId}
          selectedSubject={selectedSubject}
        />
      )}

      {activeTab === 'timeline' && (
        <ScheduleTimelineView
          tasks={tasks}
          scheduleMap={teacherScheduleMap}
          onOpenNewTaskForPeriod={handleOpenNewTaskForPeriod}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setIsNewTaskModalOpen(true);
          }}
          onToggleComplete={handleToggleComplete}
        />
      )}

      {/* 3. Modal Ghi chú nhanh */}
      <QuickNoteModal
        isOpen={isQuickNoteModalOpen}
        onClose={() => setIsQuickNoteModalOpen(false)}
        currentContext={currentContext}
        classes={classes}
        onSaveQuickNote={handleSaveQuickNote}
        onConvertToTask={handleConvertNoteToTask}
        workspaceId={workspaceId}
        userId={userId}
      />

      {/* 4. Modal Thêm / Chỉnh sửa công việc */}
      <TaskDetailModal
        isOpen={isNewTaskModalOpen}
        onClose={() => {
          setIsNewTaskModalOpen(false);
          setTaskToEdit(null);
          setTaskModalInitialValues({});
        }}
        taskToEdit={taskToEdit}
        initialValues={taskModalInitialValues}
        onSaveTask={handleSaveTask}
        classes={classes}
        grades={grades}
        scheduleMap={teacherScheduleMap}
        workspaceId={workspaceId}
        userId={userId}
      />

      {/* 5. Nút bấm tròn nổi (Floating Action Button - FAB) cho màn hình di động */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden flex flex-col items-end gap-2.5">
        <button
          type="button"
          onClick={() => setIsQuickNoteModalOpen(true)}
          className="w-11 h-11 rounded-full bg-amber-400 text-amber-950 shadow-lg border border-amber-500 flex items-center justify-center cursor-pointer active:scale-95 transition"
          title="Ghi chú nhanh"
        >
          <Zap className="w-5 h-5 fill-amber-950" />
        </button>
        <button
          type="button"
          onClick={() => {
            setTaskToEdit(null);
            setTaskModalInitialValues({});
            setIsNewTaskModalOpen(true);
          }}
          className="w-13 h-13 rounded-full bg-[#3d2b17] text-[#fffbf0] shadow-xl border-2 border-amber-400 flex items-center justify-center cursor-pointer active:scale-95 transition"
          title="Thêm công việc mới"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
