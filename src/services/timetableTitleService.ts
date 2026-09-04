import { Member } from '../types';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState } from '../supabaseClient';
import { getWorkspaceId, getScopedKey } from './workspaceService';

export interface TeacherTimetableConfig {
  title: string;
  signature: string;
  username?: string;
  userId?: string;
  name?: string;
  updatedAt?: string;
}

export type TimetableTitlesMap = Record<string, TeacherTimetableConfig>;

export const DEFAULT_TIMETABLE_TITLE = 'THỜI KHÓA BIỂU (2025-2026) TỪ 09/09/2025';
export const DEFAULT_SIGNATURE_TITLE = 'GVBM';

/**
 * Lấy cấu hình tiêu đề và mục ký thời khóa biểu cho giáo viên
 */
export function getTeacherTimetableConfig(
  username?: string,
  userId?: string,
  workspaceId?: string
): TeacherTimetableConfig {
  const titlesMap = safeGetLocalStorage<TimetableTitlesMap>('school_timetable_titles', {});

  // 1. Kiểm tra từ map tổng theo username hoặc userId
  if (username && titlesMap[username]) {
    return {
      title: titlesMap[username].title || DEFAULT_TIMETABLE_TITLE,
      signature: titlesMap[username].signature || DEFAULT_SIGNATURE_TITLE,
      username,
      userId: titlesMap[username].userId || userId,
      name: titlesMap[username].name,
      updatedAt: titlesMap[username].updatedAt
    };
  }

  if (userId && titlesMap[userId]) {
    return {
      title: titlesMap[userId].title || DEFAULT_TIMETABLE_TITLE,
      signature: titlesMap[userId].signature || DEFAULT_SIGNATURE_TITLE,
      username: titlesMap[userId].username || username,
      userId,
      name: titlesMap[userId].name,
      updatedAt: titlesMap[userId].updatedAt
    };
  }

  // 2. Kiểm tra từ localStorage riêng của giáo viên
  const title = (username && localStorage.getItem(`timetable_title_${username}`))
    || (userId && localStorage.getItem(`timetable_title_${userId}`))
    || (workspaceId && safeGetLocalStorage<{ title?: string }>(`${workspaceId}_school_timetable_title`, {} as any)?.title)
    || localStorage.getItem('timetable_custom_title')
    || DEFAULT_TIMETABLE_TITLE;

  const signature = (username && localStorage.getItem(`timetable_signature_${username}`))
    || (userId && localStorage.getItem(`timetable_signature_${userId}`))
    || (workspaceId && safeGetLocalStorage<{ signature?: string }>(`${workspaceId}_school_timetable_title`, {} as any)?.signature)
    || localStorage.getItem('timetable_custom_signature')
    || DEFAULT_SIGNATURE_TITLE;

  return { title, signature, username, userId };
}

/**
 * Lưu cấu hình tiêu đề thời khóa biểu cho từng giáo viên (User-Scoped & Global Map), đồng bộ lên Supabase Cloud
 */
export async function saveTeacherTimetableConfig(
  teacher: { username: string; id?: string; name?: string },
  config: { title: string; signature: string },
  currentUser?: Member | null
): Promise<boolean> {
  const cleanTitle = config.title?.trim() || DEFAULT_TIMETABLE_TITLE;
  const cleanSignature = config.signature?.trim() || DEFAULT_SIGNATURE_TITLE;
  const now = new Date().toISOString();

  const record: TeacherTimetableConfig = {
    title: cleanTitle,
    signature: cleanSignature,
    username: teacher.username,
    userId: teacher.id,
    name: teacher.name,
    updatedAt: now
  };

  // 1. Lưu cục bộ cho giáo viên này
  if (teacher.username) {
    localStorage.setItem(`timetable_title_${teacher.username}`, cleanTitle);
    localStorage.setItem(`timetable_signature_${teacher.username}`, cleanSignature);
  }
  if (teacher.id) {
    localStorage.setItem(`timetable_title_${teacher.id}`, cleanTitle);
    localStorage.setItem(`timetable_signature_${teacher.id}`, cleanSignature);
  }

  // Nếu giáo viên được lưu chính là tài khoản hiện tại, cập nhật cả fallback key
  if (currentUser?.username === teacher.username || currentUser?.id === teacher.id) {
    localStorage.setItem('timetable_custom_title', cleanTitle);
    localStorage.setItem('timetable_custom_signature', cleanSignature);
  }

  // 2. Cập nhật Map tổng hợp toàn trường
  const currentMap = safeGetLocalStorage<TimetableTitlesMap>('school_timetable_titles', {});
  if (teacher.username) {
    currentMap[teacher.username] = record;
  }
  if (teacher.id) {
    currentMap[teacher.id] = record;
  }
  safeSetLocalStorage('school_timetable_titles', currentMap);

  // 3. Xác định User-Scoped Workspace Key
  const wsId = teacher.id 
    ? `ws_${teacher.id.replace(/[^a-zA-Z0-9_-]/g, '_')}` 
    : getWorkspaceId({ id: teacher.id || '', username: teacher.username, name: teacher.name || '' } as Member);
  const scopedKey = getScopedKey('school_timetable_title', wsId);

  safeSetLocalStorage(scopedKey, record);

  // 4. Đồng bộ lên Supabase Cloud: Cả khóa riêng của giáo viên và danh mục tổng
  try {
    const [scopedSaved, globalSaved] = await Promise.all([
      saveSupabaseState(scopedKey, record),
      saveSupabaseState('school_timetable_titles', currentMap)
    ]);

    // Bắn sự kiện cập nhật để các component đang mở tự động đồng bộ ngay lập tức
    window.dispatchEvent(new Event('timetable_config_updated'));
    window.dispatchEvent(new Event('storage'));

    return Boolean(scopedSaved || globalSaved);
  } catch (err) {
    console.warn('Lỗi khi lưu tiêu đề thời khóa biểu lên Supabase:', err);
    window.dispatchEvent(new Event('timetable_config_updated'));
    window.dispatchEvent(new Event('storage'));
    return false;
  }
}

/**
 * Đồng bộ tiêu đề thời khóa biểu khi tải dữ liệu từ Supabase về
 */
export function syncTimetableTitlesFromSupabase(
  dbStates: Record<string, any>,
  activeWorkspaceId?: string
): void {
  if (!dbStates) return;

  // 1. Đồng bộ danh mục tổng hợp toàn trường
  if (dbStates['school_timetable_titles'] && typeof dbStates['school_timetable_titles'] === 'object') {
    const map = dbStates['school_timetable_titles'] as TimetableTitlesMap;
    safeSetLocalStorage('school_timetable_titles', map);

    Object.entries(map).forEach(([key, cfg]) => {
      if (cfg && cfg.title) {
        localStorage.setItem(`timetable_title_${key}`, cfg.title);
      }
      if (cfg && cfg.signature) {
        localStorage.setItem(`timetable_signature_${key}`, cfg.signature);
      }
    });
  }

  // 2. Đồng bộ khóa riêng của workspace hiện tại
  if (activeWorkspaceId) {
    const scopedKey = `${activeWorkspaceId}_school_timetable_title`;
    const scopedVal = dbStates[scopedKey];
    if (scopedVal && typeof scopedVal === 'object') {
      safeSetLocalStorage(scopedKey, scopedVal);
      if (scopedVal.title) {
        localStorage.setItem('timetable_custom_title', scopedVal.title);
        if (scopedVal.username) localStorage.setItem(`timetable_title_${scopedVal.username}`, scopedVal.title);
        if (scopedVal.userId) localStorage.setItem(`timetable_title_${scopedVal.userId}`, scopedVal.title);
      }
      if (scopedVal.signature) {
        localStorage.setItem('timetable_custom_signature', scopedVal.signature);
        if (scopedVal.username) localStorage.setItem(`timetable_signature_${scopedVal.username}`, scopedVal.signature);
        if (scopedVal.userId) localStorage.setItem(`timetable_signature_${scopedVal.userId}`, scopedVal.signature);
      }
    }
  }

  window.dispatchEvent(new Event('timetable_config_updated'));
}
