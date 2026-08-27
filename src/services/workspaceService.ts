import { Member, SeatingChart, EmulationDataState } from '../types';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/safeStorage';
import { saveSupabaseState } from '../supabaseClient';
import { defaultSeating, defaultEmulation } from '../data/mockData';

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
 */
export function loadWorkspaceSeatingChart(
  workspaceId: string,
  dbStates?: Record<string, any>
): SeatingChart {
  return loadWorkspaceState<SeatingChart>(
    'school_seating_chart',
    workspaceId,
    dbStates,
    defaultSeating
  );
}

/**
 * Tải dữ liệu thi đua & đổi quà riêng cho Workspace
 */
export function loadWorkspaceEmulationState(
  workspaceId: string,
  dbStates?: Record<string, any>
): EmulationDataState {
  return loadWorkspaceState<EmulationDataState>(
    'school_emulation_state',
    workspaceId,
    dbStates,
    defaultEmulation
  );
}

/**
 * Tải dữ liệu Vườn Tri Thức riêng cho Workspace
 */
export function loadWorkspaceGardenData(
  workspaceId: string,
  dbStates?: Record<string, any>,
  fallbackValue: Record<string, any> = {}
): Record<string, any> {
  return loadWorkspaceState<Record<string, any>>(
    'school_garden_data',
    workspaceId,
    dbStates,
    safeGetLocalStorage('deskos_garden_data_v2', fallbackValue)
  );
}
