import { Member, SeatingChart, EmulationDataState, Question, Subject } from '../types';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState, supabase } from '../supabaseClient';
import { defaultSeating, defaultEmulation } from '../data/mockData';
import { deepMergeEmulationState } from '../utils/evaluationPartition';
import { loadWorkspaceGardenData as loadPartitionedGarden } from '../utils/gardenPartition';
import { loadWorkspaceSeatingData, saveWorkspaceSeatingData } from '../utils/labPartition';

/**
 * 🏢 WORKSPACE SERVICE - HỆ THỐNG KHÔNG GIAN LÀM VIỆC ĐỘC LẬP THEO TỪNG USER
 * Đảm bảo mỗi Giáo viên có một không gian làm việc riêng biệt 100%.
 * Dạy trùng lớp thì sơ đồ chỗ ngồi, điểm danh, chấm sao, thi đua và vườn tri thức
 * của giáo viên này hoàn toàn không làm thay đổi hay ảnh hưởng đến giáo viên khác.
 */

export const WORKSPACE_PREFIX = 'ws_';

/**
 * Lấy mã định danh Workspace duy nhất cho người dùng hiện tại
 * Ví dụ: User id 'u-1' -> 'ws_u-1', User id 'u-2' -> 'ws_u-2'
 */
export function getWorkspaceId(user: Member | null): string {
  if (!user) return `${WORKSPACE_PREFIX}default`;
  // Ưu tiên dùng user.id (ví dụ: 'u-1', 'u-2') hoặc username đã được chuẩn hóa
  const cleanId = (user.id || user.username || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${WORKSPACE_PREFIX}${cleanId}`;
}

/**
 * Tạo khóa lưu trữ phân lập theo Workspace
 * Ví dụ: getScopedKey('school_seating_chart', 'ws_u-2') -> 'ws_u-2_school_seating_chart'
 */
export function getScopedKey(baseKey: string, workspaceId: string): string {
  if (baseKey.startsWith(workspaceId)) {
    return baseKey;
  }
  return `${workspaceId}_${baseKey}`;
}

/**
 * Kiểm tra xem một khóa có thuộc về Workspace hay không
 */
export function isWorkspaceKey(key: string): boolean {
  return key.startsWith(WORKSPACE_PREFIX);
}

/**
 * Lấy tên giáo viên hoặc chủ sở hữu của Workspace
 */
export function getWorkspaceOwnerName(workspaceId: string, members: Member[]): string {
  if (!workspaceId || workspaceId === `${WORKSPACE_PREFIX}default`) {
    return 'Không gian Mặc định';
  }
  const cleanId = workspaceId.replace(WORKSPACE_PREFIX, '');
  const matched = members.find(m => m.id === cleanId || m.username === cleanId);
  if (matched) {
    return `Thầy/Cô ${matched.name}`;
  }
  return `Không gian (${cleanId})`;
}

/**
 * Tải dữ liệu trạng thái phân lập theo Workspace (với cơ chế Fallback thông minh)
 * 1. Đọc từ Cloud dbStates theo scopedKey
 * 2. Đọc từ LocalStorage theo scopedKey
 * 3. Nếu chưa có (user mới), đọc từ bản sao lưu ban đầu / dữ liệu mẫu và tự động clone vào workspace của user
 */
export function loadWorkspaceState<T>(
  baseKey: string,
  workspaceId: string,
  dbStates?: Record<string, any>,
  fallbackValue?: T
): T {
  const scopedKey = getScopedKey(baseKey, workspaceId);

  // 1. Kiểm tra trong dbStates từ Supabase Cloud
  if (dbStates && dbStates[scopedKey] !== undefined) {
    safeSetLocalStorage(scopedKey, dbStates[scopedKey]);
    return dbStates[scopedKey];
  }

  // 2. Kiểm tra trong LocalStorage
  const localScoped = safeGetLocalStorage<T | null>(scopedKey, null);
  if (localScoped !== null && localScoped !== undefined) {
    return localScoped;
  }

  // 3. Cơ chế Khởi tạo cho User mới (Auto-Clone from Legacy/Default):
  // Đọc từ baseKey toàn cục (nếu có) hoặc fallback mặc định
  let initialClone: any = fallbackValue;
  if (dbStates && dbStates[baseKey] !== undefined) {
    initialClone = dbStates[baseKey];
  } else {
    const legacyLocal = safeGetLocalStorage<T | null>(baseKey, null);
    if (legacyLocal !== null && legacyLocal !== undefined) {
      initialClone = legacyLocal;
    }
  }

  // Nếu vẫn chưa có gì, gán dữ liệu mặc định hệ thống
  if (!initialClone) {
    if (baseKey === 'school_seating_chart') initialClone = defaultSeating;
    else if (baseKey === 'school_emulation_state') initialClone = defaultEmulation;
    else initialClone = fallbackValue;
  }

  // Tự động ghi nhận bản clone vào LocalStorage của Workspace này
  if (initialClone) {
    safeSetLocalStorage(scopedKey, initialClone);
  }

  return initialClone as T;
}

/**
 * Lưu dữ liệu trạng thái phân lập theo Workspace xuống cả LocalStorage và Supabase Cloud
 */
export async function saveWorkspaceState(
  baseKey: string,
  workspaceId: string,
  value: any
): Promise<boolean> {
  const scopedKey = getScopedKey(baseKey, workspaceId);
  safeSetLocalStorage(scopedKey, value);
  return await saveSupabaseState(scopedKey, value);
}

/**
 * Tải sơ đồ chỗ ngồi riêng cho Workspace
 * 🛡️ DEEP MERGE: Hợp nhất Cloud và LocalStorage để không làm mất sơ đồ lớp đã xếp khi offline!
 */
export function loadWorkspaceSeatingChart(
  workspaceId: string,
  dbStates?: Record<string, any>
): SeatingChart {
  return loadWorkspaceSeatingData(workspaceId, dbStates, defaultSeating);
}

/**
 * Lưu sơ đồ chỗ ngồi riêng cho Workspace có Deep Merge an toàn
 */
export async function saveWorkspaceSeatingChart(
  seatingChart: SeatingChart,
  workspaceId: string,
  targetClass?: string,
  onMerged?: (merged: SeatingChart) => void
): Promise<boolean> {
  return await saveWorkspaceSeatingData(seatingChart, targetClass, workspaceId, onMerged);
}


/**
 * Tải dữ liệu thi đua & đổi quà riêng cho Workspace
 * 🛡️ DEEP MERGE: Hợp nhất Cloud và LocalStorage để không làm mất sao thi đua tích lũy khi offline!
 */
export function loadWorkspaceEmulationState(
  workspaceId: string,
  dbStates?: Record<string, any>
): EmulationDataState {
  const scopedKey = getScopedKey('school_emulation_state', workspaceId);
  const cloudData = dbStates?.[scopedKey] || null;
  const localData = safeGetLocalStorage<EmulationDataState | null>(scopedKey, null);

  let merged: EmulationDataState = { ...defaultEmulation };
  if (cloudData && typeof cloudData === 'object') {
    merged = deepMergeEmulationState(merged, cloudData);
  }
  if (localData && typeof localData === 'object') {
    merged = deepMergeEmulationState(merged, localData);
  }

  // Tự động lưu bản hợp nhất vào LocalStorage
  safeSetLocalStorage(scopedKey, merged);
  return merged;
}

/**
 * Tải dữ liệu Vườn Tri Thức riêng cho Workspace
 * 🛡️ DEEP MERGE: Sử dụng loadPartitionedGarden bảo toàn cấp độ cây và số lần tưới khi offline!
 */
export function loadWorkspaceGardenData(
  workspaceId: string,
  dbStates?: Record<string, any>,
  fallbackValue: Record<string, any> = {}
): Record<string, any> {
  return loadPartitionedGarden(workspaceId, dbStates, fallbackValue);
}

/**
 * Tải dữ liệu thời khóa biểu riêng cho Workspace của Giáo viên
 */
export function loadWorkspaceTimetableData(
  workspaceId: string,
  userIdentifier?: string,
  dbStates?: Record<string, any>
): Record<string, any> {
  const scopedKey = getScopedKey('school_timetable_data', workspaceId);

  // 1. Kiểm tra từ Cloud dbStates theo scopedKey
  if (dbStates && dbStates[scopedKey] !== undefined && typeof dbStates[scopedKey] === 'object') {
    safeSetLocalStorage(scopedKey, dbStates[scopedKey]);
    return dbStates[scopedKey];
  }

  // 2. Kiểm tra từ LocalStorage
  const localScoped = safeGetLocalStorage<Record<string, any> | null>(scopedKey, null);
  if (localScoped && typeof localScoped === 'object' && Object.keys(localScoped).length > 0) {
    return localScoped;
  }

  // 3. Fallback: Đọc từ school_timetable_data toàn cục theo userIdentifier
  if (userIdentifier) {
    const globalTimetable = (dbStates && dbStates['school_timetable_data']) 
      || safeGetLocalStorage<Record<string, any>>('school_timetable_data', {});
    
    // Tìm theo userIdentifier (username, id, hoặc case-insensitive)
    if (globalTimetable[userIdentifier]) {
      const schedule = globalTimetable[userIdentifier];
      safeSetLocalStorage(scopedKey, schedule);
      return schedule;
    }
    const cleanId = userIdentifier.toLowerCase();
    const matchedKey = Object.keys(globalTimetable).find(k => k.toLowerCase() === cleanId);
    if (matchedKey && globalTimetable[matchedKey]) {
      const schedule = globalTimetable[matchedKey];
      safeSetLocalStorage(scopedKey, schedule);
      return schedule;
    }
  }

  return {};
}

/**
 * Lưu dữ liệu thời khóa biểu riêng cho Workspace của Giáo viên
 */
export async function saveWorkspaceTimetableData(
  workspaceId: string,
  schedule: Record<string, any>
): Promise<boolean> {
  return await saveWorkspaceState('school_timetable_data', workspaceId, schedule);
}

export const DEFAULT_WORKSPACE_SUBJECTS: Subject[] = [
  { id: 'subj-1', name: 'Tin học', gradeId: 1 },
  { id: 'subj-2', name: 'Tin học', gradeId: 2 },
  { id: 'subj-3', name: 'Tin học', gradeId: 3 },
  { id: 'subj-4', name: 'Tin học', gradeId: 4 },
  { id: 'subj-5', name: 'Tin học', gradeId: 5 }
];

/**
 * 📚 Tải ngân hàng câu hỏi riêng theo Workspace của Giáo viên
 * Hỗ trợ Fallback tự động từ key cũ school_questions_${userIdentifier}
 */
export function loadWorkspaceQuestions(
  workspaceId: string,
  userIdentifier?: string,
  dbStates?: Record<string, any>,
  fallbackDefault: Question[] = []
): Question[] {
  const scopedKey = getScopedKey('school_questions', workspaceId);

  // 1. Kiểm tra từ Cloud dbStates theo scopedKey
  if (dbStates && Array.isArray(dbStates[scopedKey]) && dbStates[scopedKey].length > 0) {
    safeSetLocalStorage(scopedKey, dbStates[scopedKey]);
    return dbStates[scopedKey];
  }

  // 2. Kiểm tra từ LocalStorage theo scopedKey
  const localScoped = safeGetLocalStorage<Question[] | null>(scopedKey, null);
  if (Array.isArray(localScoped) && localScoped.length > 0) {
    return localScoped;
  }

  // 3. Fallback: Di chuyển dữ liệu cũ từ school_questions_${userIdentifier}
  if (userIdentifier) {
    const legacyKey = `school_questions_${userIdentifier}`;
    const legacyCloud = dbStates?.[legacyKey];
    if (Array.isArray(legacyCloud) && legacyCloud.length > 0) {
      safeSetLocalStorage(scopedKey, legacyCloud);
      return legacyCloud;
    }
    const legacyLocal = safeGetLocalStorage<Question[] | null>(legacyKey, null);
    if (Array.isArray(legacyLocal) && legacyLocal.length > 0) {
      safeSetLocalStorage(scopedKey, legacyLocal);
      return legacyLocal;
    }
  }

  // 3.5. Fallback kế thừa: Di chuyển dữ liệu từ kho câu hỏi toàn cục school_questions (nếu có)
  const globalCloud = dbStates?.['school_questions'];
  if (Array.isArray(globalCloud) && globalCloud.length > 0) {
    safeSetLocalStorage(scopedKey, globalCloud);
    return globalCloud;
  }
  const globalLocal = safeGetLocalStorage<Question[] | null>('school_questions', null);
  if (Array.isArray(globalLocal) && globalLocal.length > 0) {
    safeSetLocalStorage(scopedKey, globalLocal);
    return globalLocal;
  }

  // 4. Nếu chưa có gì, fallback default
  if (fallbackDefault && fallbackDefault.length > 0) {
    safeSetLocalStorage(scopedKey, fallbackDefault);
    return fallbackDefault;
  }

  return [];
}

/**
 * 💾 Lưu ngân hàng câu hỏi phân lập theo Workspace
 */
export async function saveWorkspaceQuestions(
  questions: Question[],
  workspaceId: string
): Promise<boolean> {
  return await saveWorkspaceState('school_questions', workspaceId, questions);
}

/**
 * 📖 Tải danh mục môn học riêng theo Workspace của Giáo viên
 */
export function loadWorkspaceSubjects(
  workspaceId: string,
  userIdentifier?: string,
  dbStates?: Record<string, any>,
  fallbackDefault: Subject[] = DEFAULT_WORKSPACE_SUBJECTS
): Subject[] {
  const scopedKey = getScopedKey('school_subjects', workspaceId);

  // 1. Cloud dbStates
  if (dbStates && Array.isArray(dbStates[scopedKey]) && dbStates[scopedKey].length > 0) {
    safeSetLocalStorage(scopedKey, dbStates[scopedKey]);
    return dbStates[scopedKey];
  }

  // 2. LocalStorage
  const localScoped = safeGetLocalStorage<Subject[] | null>(scopedKey, null);
  if (Array.isArray(localScoped) && localScoped.length > 0) {
    return localScoped;
  }

  // 3. Fallback legacy
  if (userIdentifier) {
    const legacyKey = `school_subjects_${userIdentifier}`;
    const legacyCloud = dbStates?.[legacyKey];
    if (Array.isArray(legacyCloud) && legacyCloud.length > 0) {
      safeSetLocalStorage(scopedKey, legacyCloud);
      return legacyCloud;
    }
    const legacyLocal = safeGetLocalStorage<Subject[] | null>(legacyKey, null);
    if (Array.isArray(legacyLocal) && legacyLocal.length > 0) {
      safeSetLocalStorage(scopedKey, legacyLocal);
      return legacyLocal;
    }
  }

  // 3.5 Fallback kế thừa danh mục môn học toàn cục school_subjects
  const globalSubjectsCloud = dbStates?.['school_subjects'];
  if (Array.isArray(globalSubjectsCloud) && globalSubjectsCloud.length > 0) {
    safeSetLocalStorage(scopedKey, globalSubjectsCloud);
    return globalSubjectsCloud;
  }
  const globalSubjectsLocal = safeGetLocalStorage<Subject[] | null>('school_subjects', null);
  if (Array.isArray(globalSubjectsLocal) && globalSubjectsLocal.length > 0) {
    safeSetLocalStorage(scopedKey, globalSubjectsLocal);
    return globalSubjectsLocal;
  }

  // 4. Default subjects
  safeSetLocalStorage(scopedKey, fallbackDefault);
  return fallbackDefault;
}

/**
 * 💾 Lưu danh mục môn học phân lập theo Workspace
 */
export async function saveWorkspaceSubjects(
  subjects: Subject[],
  workspaceId: string
): Promise<boolean> {
  return await saveWorkspaceState('school_subjects', workspaceId, subjects);
}

/**
 * 🎮 Tải bảng xếp hạng trò chơi (Kéo co, Đấu trường...) riêng theo Workspace
 */
export function loadWorkspaceGameLeaderboard(
  workspaceId: string,
  gameKey: string = 'tug_leaderboard',
  dbStates?: Record<string, any>
): any[] {
  const scopedKey = getScopedKey(gameKey, workspaceId);

  // 1. Cloud
  if (dbStates && Array.isArray(dbStates[scopedKey])) {
    safeSetLocalStorage(scopedKey, dbStates[scopedKey]);
    return dbStates[scopedKey];
  }

  // 2. LocalStorage scoped
  const localScoped = safeGetLocalStorage<any[] | null>(scopedKey, null);
  if (Array.isArray(localScoped)) {
    return localScoped;
  }

  // 3. Fallback legacy un-scoped
  const legacy = safeGetLocalStorage<any[] | null>(gameKey, null);
  if (Array.isArray(legacy) && legacy.length > 0) {
    safeSetLocalStorage(scopedKey, legacy);
    return legacy;
  }

  return [];
}

/**
 * 💾 Lưu bảng xếp hạng trò chơi riêng theo Workspace
 */
export async function saveWorkspaceGameLeaderboard(
  workspaceId: string,
  gameKey: string = 'tug_leaderboard',
  leaderboard: any[]
): Promise<boolean> {
  return await saveWorkspaceState(gameKey, workspaceId, leaderboard);
}


/**
 * 🗑️ Xóa vĩnh viễn toàn bộ Không gian làm việc của Giáo viên trên Supabase Cloud và LocalStorage
 * Được kích hoạt tự động khi Quản trị viên xóa tài khoản giáo viên (user).
 */
export async function deleteUserWorkspaceData(
  user: { id: string; username?: string; name?: string }
): Promise<{ success: boolean; deletedCount: number }> {
  const cleanId = (user.id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanUsername = (user.username || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  let deletedCount = 0;

  try {
    // 1. Quét tất cả các khóa trên Supabase liên quan đến workspace giáo viên này
    const { data: allStates, error: fetchErr } = await supabase
      .from('school_states')
      .select('key');

    if (!fetchErr && allStates && allStates.length > 0) {
      const keysToDelete = allStates
        .map(r => r.key)
        .filter(key => {
          if (!key) return false;
          // Khóa bắt đầu bằng ws_id hoặc ws_username
          if (cleanId && (key.startsWith(`ws_${cleanId}_`) || key === `ws_${cleanId}`)) return true;
          if (cleanUsername && (key.startsWith(`ws_${cleanUsername}_`) || key === `ws_${cleanUsername}`)) return true;
          // Khóa kết thúc bằng _ws_id hoặc _ws_username (ví dụ attendance_2026-09-04_ws_u-2)
          if (cleanId && key.endsWith(`_ws_${cleanId}`)) return true;
          if (cleanUsername && key.endsWith(`_ws_${cleanUsername}`)) return true;
          return false;
        });

      if (keysToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('school_states')
          .delete()
          .in('key', keysToDelete);

        if (!delErr) {
          deletedCount += keysToDelete.length;
        } else {
          console.warn('Lỗi khi xóa khóa workspace trên Supabase:', delErr.message);
        }
      }
    }

    // 2. Dọn dẹp tiêu đề thời khóa biểu của giáo viên trong school_timetable_titles
    const currentTitlesMap = safeGetLocalStorage<Record<string, any>>('school_timetable_titles', {});
    let titlesChanged = false;
    if (user.username && currentTitlesMap[user.username]) {
      delete currentTitlesMap[user.username];
      titlesChanged = true;
    }
    if (user.id && currentTitlesMap[user.id]) {
      delete currentTitlesMap[user.id];
      titlesChanged = true;
    }
    if (titlesChanged) {
      safeSetLocalStorage('school_timetable_titles', currentTitlesMap);
      await saveSupabaseState('school_timetable_titles', currentTitlesMap);
    }

    // 3. Dọn dẹp lịch dạy thời khóa biểu của giáo viên trong school_timetable_data
    const currentTimetable = safeGetLocalStorage<Record<string, any>>('school_timetable_data', {});
    if (user.username && currentTimetable[user.username]) {
      delete currentTimetable[user.username];
      safeSetLocalStorage('school_timetable_data', currentTimetable);
      await saveSupabaseState('school_timetable_data', currentTimetable);
    }

    // 4. Dọn dẹp toàn bộ bộ nhớ cục bộ localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (
          (cleanId && (k.startsWith(`ws_${cleanId}`) || k.includes(`_${cleanId}`))) ||
          (cleanUsername && (k.startsWith(`ws_${cleanUsername}`) || k.includes(`_${cleanUsername}`) || k === `timetable_title_${cleanUsername}` || k === `timetable_signature_${cleanUsername}`))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
    }

    return { success: true, deletedCount };
  } catch (err) {
    console.warn('Lỗi khi xóa workspace của giáo viên:', err);
    return { success: false, deletedCount };
  }
}
