import { Member } from '../../../types';
import { getWorkspaceId } from '../../../services/workspaceService';
import { safeGetLocalStorage, safeSetLocalStorage } from '../../../utils/safeStorage';
import { saveSupabaseState, supabase } from '../../../supabaseClient';
import { TeachingQuickNote, TeachingTask } from '../types';

const TASKS_BASE_KEY = 'teaching_tasks';
const NOTES_BASE_KEY = 'teaching_quick_notes';

/**
 * 📦 Dữ liệu mẫu ban đầu cho giáo viên mới làm quen hệ thống
 */
export function getDefaultTeachingTasks(workspaceId: string, userId: string): TeachingTask[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return [
    {
      id: `task-sample-1`,
      workspaceId,
      userId,
      title: 'Bật máy chủ và kiểm tra 35 máy tính phòng Lab',
      description: 'Khởi động máy học sinh, kiểm tra kết nối mạng LAN và phần mềm luyện gõ.',
      gradeId: 3,
      classId: '3A',
      subject: 'Tin học',
      category: 'Chuẩn bị thiết bị',
      priority: 'urgent',
      status: 'todo',
      scheduleDay: '2',
      schedulePeriod: '1',
      plannedDate: todayStr,
      dueDate: `${todayStr}T07:30:00`,
      reminderBeforeMinutes: 30,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: `task-sample-2`,
      workspaceId,
      userId,
      title: 'Chuẩn bị bài giảng PowerPoint: Bài 8 - Làm quen với thư mục',
      description: 'Chèn thêm hình ảnh minh họa cây thư mục cho các em dễ hình dung.',
      gradeId: 3,
      classId: '3A',
      subject: 'Tin học',
      category: 'Soạn giáo án',
      priority: 'high',
      status: 'in_progress',
      scheduleDay: '2',
      schedulePeriod: '2',
      plannedDate: todayStr,
      dueDate: `${todayStr}T08:15:00`,
      reminderBeforeMinutes: 60,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: `task-sample-3`,
      workspaceId,
      userId,
      title: 'In 35 phiếu bài tập thực hành vẽ hình Paint',
      description: 'In trước giờ học chiều cho lớp 4B.',
      gradeId: 4,
      classId: '4B',
      subject: 'Tin học',
      category: 'In tài liệu',
      priority: 'medium',
      status: 'todo',
      scheduleDay: '3',
      schedulePeriod: '5',
      plannedDate: todayStr,
      dueDate: `${todayStr}T13:30:00`,
      reminderBeforeMinutes: 30,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

/**
 * 📥 Tải danh sách công việc theo Workspace
 */
export async function loadTeachingTasks(
  currentUser: Member | null,
  dbStates?: Record<string, any>
): Promise<TeachingTask[]> {
  const workspaceId = getWorkspaceId(currentUser);
  const scopedKey = `${workspaceId}_${TASKS_BASE_KEY}`;
  const userId = currentUser?.id || currentUser?.username || 'user';

  // 1. Kiểm tra từ Supabase dbStates
  if (dbStates && dbStates[scopedKey] && Array.isArray(dbStates[scopedKey])) {
    safeSetLocalStorage(scopedKey, dbStates[scopedKey]);
    return dbStates[scopedKey];
  }

  // 2. Kiểm tra từ LocalStorage
  const localData = safeGetLocalStorage<TeachingTask[] | null>(scopedKey, null);
  if (localData && Array.isArray(localData) && localData.length > 0) {
    return localData;
  }

  // 3. Nếu chưa có, trả về dữ liệu mẫu và lưu vào workspace của user
  const initialTasks = getDefaultTeachingTasks(workspaceId, userId);
  safeSetLocalStorage(scopedKey, initialTasks);
  saveSupabaseState(scopedKey, initialTasks).catch(() => {});
  return initialTasks;
}

/**
 * 💾 Lưu danh sách công việc theo Workspace
 */
export async function saveTeachingTasks(
  tasks: TeachingTask[],
  currentUser: Member | null
): Promise<boolean> {
  const workspaceId = getWorkspaceId(currentUser);
  const scopedKey = `${workspaceId}_${TASKS_BASE_KEY}`;

  try {
    // 1. Lưu LocalStorage trước để giao diện phản hồi tức thì
    safeSetLocalStorage(scopedKey, tasks);

    // 2. Lưu vào Supabase bảng school_states
    await saveSupabaseState(scopedKey, tasks);

    // 3. Thử lưu thêm vào bảng quan hệ teaching_tasks nếu bảng đã được tạo
    try {
      // Upsert batch
      const rows = tasks.map(t => ({
        id: t.id,
        workspace_id: t.workspaceId || workspaceId,
        user_id: t.userId,
        title: t.title,
        description: t.description || '',
        grade_id: t.gradeId || null,
        class_id: t.classId || null,
        subject: t.subject || 'Tin học',
        category: t.category,
        priority: t.priority,
        status: t.status,
        week_number: t.weekNumber || null,
        planned_date: t.plannedDate || null,
        due_date: t.dueDate || null,
        schedule_day: t.scheduleDay || null,
        schedule_period: t.schedulePeriod || null,
        reminder_before_minutes: t.reminderBeforeMinutes || 30,
        is_recurring: Boolean(t.isRecurring),
        recurrence_type: t.recurrenceType || 'none',
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('teaching_tasks').upsert(rows, { onConflict: 'id' });
    } catch {
      // Nếu bảng chưa được khởi tạo, không gây lỗi cho người dùng
    }

    return true;
  } catch (err) {
    console.error('Lỗi khi lưu công việc giảng dạy:', err);
    return false;
  }
}

/**
 * 📥 Tải danh sách ghi chú nhanh theo Workspace
 */
export async function loadTeachingQuickNotes(
  currentUser: Member | null,
  dbStates?: Record<string, any>
): Promise<TeachingQuickNote[]> {
  const workspaceId = getWorkspaceId(currentUser);
  const scopedKey = `${workspaceId}_${NOTES_BASE_KEY}`;

  if (dbStates && dbStates[scopedKey] && Array.isArray(dbStates[scopedKey])) {
    safeSetLocalStorage(scopedKey, dbStates[scopedKey]);
    return dbStates[scopedKey];
  }

  const localData = safeGetLocalStorage<TeachingQuickNote[] | null>(scopedKey, null);
  if (localData && Array.isArray(localData)) {
    return localData;
  }

  return [];
}

/**
 * 💾 Lưu danh sách ghi chú nhanh theo Workspace
 */
export async function saveTeachingQuickNotes(
  notes: TeachingQuickNote[],
  currentUser: Member | null
): Promise<boolean> {
  const workspaceId = getWorkspaceId(currentUser);
  const scopedKey = `${workspaceId}_${NOTES_BASE_KEY}`;

  try {
    safeSetLocalStorage(scopedKey, notes);
    await saveSupabaseState(scopedKey, notes);
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu ghi chú nhanh:', err);
    return false;
  }
}
