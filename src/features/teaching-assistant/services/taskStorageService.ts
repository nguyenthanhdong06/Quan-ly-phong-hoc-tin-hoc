import { Member } from '../../../types';
import { getWorkspaceId } from '../../../services/workspaceService';
import { safeGetLocalStorage, safeSetLocalStorage } from '../../../utils/safeStorage';
import { saveSupabaseState, supabase } from '../../../supabaseClient';
import { TeachingQuickNote, TeachingTask } from '../types';

const TASKS_BASE_KEY = 'teaching_tasks';
const NOTES_BASE_KEY = 'teaching_quick_notes';

/**
 * 📦 Dữ liệu mặc định (hoàn toàn trống, không dùng dữ liệu mẫu)
 */
export function getDefaultTeachingTasks(_workspaceId?: string, _userId?: string): TeachingTask[] {
  return [];
}

/**
 * 🧹 Lọc bỏ triệt để các công việc mẫu cũ nếu còn lưu trong bộ nhớ
 */
function filterOutSampleTasks(tasks: TeachingTask[]): TeachingTask[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(t => !t.id.startsWith('task-sample-') && !t.id.includes('sample'));
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

  // Tự động dọn dẹp các row mẫu trong Supabase nếu có
  try {
    supabase.from('teaching_tasks').delete().like('id', 'task-sample%').then(() => {});
  } catch {
    // Bỏ qua nếu bảng chưa khởi tạo
  }

  // 1. Kiểm tra từ Supabase dbStates
  if (dbStates && dbStates[scopedKey] && Array.isArray(dbStates[scopedKey])) {
    const cleaned = filterOutSampleTasks(dbStates[scopedKey]);
    if (cleaned.length !== dbStates[scopedKey].length) {
      safeSetLocalStorage(scopedKey, cleaned);
      saveSupabaseState(scopedKey, cleaned).catch(() => {});
    } else {
      safeSetLocalStorage(scopedKey, cleaned);
    }
    return cleaned;
  }

  // 2. Kiểm tra từ LocalStorage
  const localData = safeGetLocalStorage<TeachingTask[] | null>(scopedKey, null);
  if (localData && Array.isArray(localData)) {
    const cleaned = filterOutSampleTasks(localData);
    if (cleaned.length !== localData.length) {
      safeSetLocalStorage(scopedKey, cleaned);
      saveSupabaseState(scopedKey, cleaned).catch(() => {});
    }
    return cleaned;
  }

  // 3. Nếu chưa có, trả về mảng rỗng
  safeSetLocalStorage(scopedKey, []);
  return [];
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
