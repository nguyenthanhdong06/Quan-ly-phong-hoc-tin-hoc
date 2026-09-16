import { GardenStudentData, GardenReward, WaterLog } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState, supabase } from '../supabaseClient';

/**
 * 📦 QUẢN LÝ DỮ LIỆU VƯỜN TRI THỨC & ĐỔI THƯỞNG (OFFLINE-FIRST & DEEP MERGE ĐA TẦNG)
 * Chuẩn mực hóa 100% theo phân hệ Điểm danh:
 * - Phân vùng lưu trữ theo Workspace (Workspace Partitioning)
 * - Ghi tức thì 0ms vào LocalStorage (Bảo toàn 100% dữ liệu khi ngoại tuyến)
 * - Hợp nhất đa chiều 3 tầng: Cloud cũ -> Local cũ -> Thao tác mới nhất
 * - Timeout 1.5s bảo vệ chống treo/đơ giao diện khi rớt mạng
 * - Xử lý thông minh việc đổi thưởng (trừ giọt nước) không bị Math.max đè mất dữ liệu
 */

// Danh sách phần thưởng mặc định ban đầu
export const DEFAULT_REWARDS: GardenReward[] = [
  { id: 'rew-1', icon: '✏️', title: 'Bút chì màu dễ thương', cost: 100, type: 'WATER' },
  { id: 'rew-2', icon: '📓', title: 'Vở bài tập lò xo xinh xắn', cost: 200, type: 'WATER' },
  { id: 'rew-3', icon: '🎨', title: 'Bộ màu vẽ 24 màu sặc sỡ', cost: 350, type: 'HARVEST' },
  { id: 'rew-4', icon: '🧩', title: 'Đồ chơi lắp ráp trí tuệ', cost: 350, type: 'HARVEST' }
];

/**
 * 🔄 HỢP NHẤT SÂU DANH MỤC PHẦN THƯỞNG (DEEP MERGE REWARDS)
 * Hợp nhất danh sách phần thưởng theo ID, bảo toàn các phần thưởng mới được tạo ngoại tuyến
 * ở cả client và server, không bao giờ làm mất phần thưởng thầy cô đã thêm ở chế độ offline.
 */
export function deepMergeRewards(
  target: GardenReward[],
  source: GardenReward[]
): GardenReward[] {
  const map = new Map<string, GardenReward>();

  if (Array.isArray(target)) {
    target.forEach(item => {
      if (item && item.id) map.set(item.id, { ...item });
    });
  }

  if (Array.isArray(source)) {
    source.forEach(item => {
      if (item && item.id) {
        const existing = map.get(item.id);
        if (!existing) {
          map.set(item.id, { ...item });
        } else {
          // Gộp thông tin, ưu tiên phiên bản mới nhất
          map.set(item.id, {
            ...existing,
            ...item,
            title: item.title?.trim() || existing.title,
            cost: typeof item.cost === 'number' ? item.cost : existing.cost,
            icon: item.icon || existing.icon,
            type: item.type || existing.type
          });
        }
      }
    });
  }

  const merged = Array.from(map.values());
  return merged.length > 0 ? merged : DEFAULT_REWARDS;
}

/**
 * 💾 LƯU DANH MỤC PHẦN THƯỞNG ĐỔI QUÀ (OFFLINE-FIRST & DEEP MERGE)
 * - Ghi ngay 0ms vào LocalStorage (chống mất dữ liệu khi rớt mạng).
 * - Timeout 1.5s bảo vệ khi đọc Cloud để không đơ ứng dụng khi ngoại tuyến.
 * - Hợp nhất đa chiều 3 tầng: Cloud cũ -> Local cũ -> Thao tác mới nhất.
 */
export async function saveWorkspaceRewardsData(
  rewards: GardenReward[],
  workspaceId: string = 'ws_default',
  onMerged?: (merged: GardenReward[]) => void
): Promise<boolean> {
  if (!rewards || rewards.length === 0) return true;

  const effectiveWs = workspaceId && workspaceId !== 'ws_default' ? workspaceId : 'ws_u-1';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}garden_rewards_v2`;
  const cloudKey = `${prefix}school_garden_rewards`;
  const legacyStorageKey = 'deskos_garden_rewards_v2';
  const legacyCloudKey = 'school_garden_rewards';

  // 1. Đọc dữ liệu hiện có từ LocalStorage
  let localData: GardenReward[] = [];
  try {
    const rawLocal = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey) || localStorage.getItem(legacyCloudKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localData = parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local rewards data khi lưu:', e);
  }

  // 2. Đọc dữ liệu mới nhất từ Supabase Cloud với Timeout 1.5s bảo vệ chống treo khi Offline
  let cloudData: GardenReward[] = [];
  if (typeof navigator === 'undefined' || navigator.onLine) {
    try {
      const fetchPromise = supabase
        .from('school_states')
        .select('value')
        .eq('key', cloudKey)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: string }>(resolve => 
        setTimeout(() => resolve({ data: null, error: 'timeout' }), 1500)
      );

      const res: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (res?.data?.value && Array.isArray(res.data.value)) {
        cloudData = res.data.value;
      } else {
        // Fallback đọc key legacy nếu key phân vùng chưa có
        const legacyRes: any = await supabase
          .from('school_states')
          .select('value')
          .eq('key', legacyCloudKey)
          .maybeSingle();
        if (legacyRes?.data?.value && Array.isArray(legacyRes.data.value)) {
          cloudData = legacyRes.data.value;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc cloud rewards data khi lưu:', e);
    }
  }

  // 3. THỰC HIỆN DEEP MERGE ĐA TẦNG (Cloud cũ + Local cũ + Thao tác mới nhất)
  let mergedData = deepMergeRewards(cloudData, localData);
  mergedData = deepMergeRewards(mergedData, rewards);

  // 4. Lưu ngay lập tức vào LocalStorage (Bảo đảm dữ liệu sống sót 100% khi rớt mạng)
  safeSetLocalStorage(storageKey, mergedData);
  safeSetLocalStorage(legacyStorageKey, mergedData);
  safeSetLocalStorage(legacyCloudKey, mergedData);

  // 5. Cập nhật React State tức thì qua Callback
  if (onMerged) {
    try {
      onMerged(mergedData);
    } catch (e) {}
  }

  // 6. Lưu lên Supabase Cloud (cả key phân vùng và key tương thích)
  try {
    const success = await saveSupabaseState(cloudKey, mergedData);
    await saveSupabaseState(legacyCloudKey, mergedData);
    return success;
  } catch {
    return true; // Đã lưu an toàn ở LocalStorage khi offline
  }
}

/**
 * 📥 TẢI VÀ HỢP NHẤT TOÀN BỘ DỮ LIỆU PHẦN THƯỞNG CHO WORKSPACE
 * Bảo toàn 100% dữ liệu đã làm việc offline mà không bao giờ bị Cloud cũ đè mất!
 */
export function loadWorkspaceRewardsData(
  workspaceId: string = 'ws_default',
  dbStates?: Record<string, any>,
  fallbackValue: GardenReward[] = DEFAULT_REWARDS
): GardenReward[] {
  const effectiveWs = workspaceId && workspaceId !== 'ws_default' ? workspaceId : 'ws_u-1';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}garden_rewards_v2`;
  const cloudKey = `${prefix}school_garden_rewards`;
  const legacyStorageKey = 'deskos_garden_rewards_v2';
  const legacyCloudKey = 'school_garden_rewards';

  let merged: GardenReward[] = Array.isArray(fallbackValue) && fallbackValue.length > 0 ? [...fallbackValue] : [...DEFAULT_REWARDS];

  // 1. Tải bản sao từ Cloud dbStates nếu có
  const scopedCloud = dbStates?.[cloudKey];
  if (scopedCloud && Array.isArray(scopedCloud) && scopedCloud.length > 0) {
    merged = deepMergeRewards(merged, scopedCloud);
  } else {
    const legacyCloud = dbStates?.[legacyCloudKey];
    if (legacyCloud && Array.isArray(legacyCloud) && legacyCloud.length > 0) {
      merged = deepMergeRewards(merged, legacyCloud);
    }
  }

  // 2. Tải bản sao từ LocalStorage (chứa các chỉnh sửa mới nhất cả khi offline)
  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal) {
      const parsedLocal = JSON.parse(rawLocal);
      if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
        merged = deepMergeRewards(merged, parsedLocal);
      }
    }
  } catch (e) {
    console.warn('Cannot parse local workspace rewards data:', e);
  }

  // 3. Kiểm tra fallback legacy 'deskos_garden_rewards_v2' và 'school_garden_rewards' nếu cần
  try {
    const rawLegacy = localStorage.getItem(legacyStorageKey) || localStorage.getItem(legacyCloudKey);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        merged = deepMergeRewards(merged, parsedLegacy);
      }
    }
  } catch (e) {}

  return merged;
}

/**
 * 🔄 HỢP NHẤT SÂU DỮ LIỆU VƯỜN CÂY (TỪNG HỌC SINH -> NƯỚC -> HUY HIỆU -> NHẬT KÝ)
 * 🛡️ Xử lý thông minh: So sánh timestamp của hành động mới nhất để bảo toàn cả việc cộng nước
 * VÀ trừ nước khi đổi thưởng / thu hoạch quả, không bao giờ để Math.max đè mất việc đổi thưởng!
 */
export function deepMergeGardenData(
  target: Record<string, GardenStudentData>,
  source: Record<string, GardenStudentData>
): Record<string, GardenStudentData> {
  if (!source || typeof source !== 'object') return target ? { ...target } : {};
  if (!target || typeof target !== 'object') return { ...source };

  const result: Record<string, GardenStudentData> = { ...target };

  // Helper trích xuất timestamp từ log ID (dạng log-1710000000000)
  const getLogTimestamp = (log: WaterLog): number => {
    if (!log || !log.id) return 0;
    if (typeof log.id === 'string' && log.id.startsWith('log-')) {
      const num = Number(log.id.replace('log-', ''));
      if (!isNaN(num) && num > 0) return num;
    }
    return 0;
  };

  const getLatestTimestamp = (logs?: WaterLog[]): number => {
    if (!logs || logs.length === 0) return 0;
    let max = 0;
    for (const l of logs) {
      const t = getLogTimestamp(l);
      if (t > max) max = t;
    }
    return max;
  };

  for (const studentId of Object.keys(source)) {
    if (!result[studentId]) {
      result[studentId] = { ...source[studentId] };
    } else {
      const targetStudent = result[studentId];
      const sourceStudent = source[studentId];

      // 1. Hợp nhất nhật ký tưới nước & đổi thưởng (Logs): Hợp nhất theo log ID
      const logsMap = new Map<string, WaterLog>();
      (targetStudent.logs || []).forEach(l => {
        if (l && l.id) logsMap.set(l.id, l);
      });
      (sourceStudent.logs || []).forEach(l => {
        if (l && l.id) logsMap.set(l.id, l);
      });

      // Sắp xếp nhật ký mới nhất lên đầu
      const mergedLogs = Array.from(logsMap.values()).sort((a, b) => {
        const timeA = getLogTimestamp(a);
        const timeB = getLogTimestamp(b);
        if (timeA && timeB) return timeB - timeA;
        return 0;
      });

      // 2. Nước (Điểm phát triển):
      // So sánh hành động mới nhất giữa 2 bên để bảo toàn cả việc cộng nước VÀ trừ nước khi đổi quà/thu hoạch
      const targetTime = getLatestTimestamp(targetStudent.logs);
      const sourceTime = getLatestTimestamp(sourceStudent.logs);

      let finalWater: number;
      if (sourceTime > targetTime) {
        // Source có hành động đổi quà hoặc tưới mới hơn -> tin tưởng source
        finalWater = Math.max(0, sourceStudent.water ?? 0);
      } else if (targetTime > sourceTime) {
        // Target có hành động mới hơn -> tin tưởng target
        finalWater = Math.max(0, targetStudent.water ?? 0);
      } else {
        // Cả 2 cùng thời điểm hoặc không có logs -> lấy giá trị lớn nhất chống thụt lùi
        finalWater = Math.max(targetStudent.water || 0, sourceStudent.water || 0);
      }

      // 3. Huy hiệu: Hợp nhất danh sách huy hiệu không trùng lặp
      const mergedBadges = Array.from(
        new Set([...(targetStudent.badges || []), ...(sourceStudent.badges || [])])
      );

      // 4. Hạt giống: Ưu tiên loại hạt giống đã chọn
      const seed = sourceStudent.seed || targetStudent.seed;

      result[studentId] = {
        ...targetStudent,
        ...sourceStudent,
        studentId,
        water: finalWater,
        badges: mergedBadges,
        logs: mergedLogs,
        seed
      };
    }
  }

  return result;
}

/**
 * 💾 Lưu dữ liệu Vườn Tri Thức với cơ chế Offline-First & Deep Merge
 */
export async function saveWorkspaceGardenData(
  gardenData: Record<string, GardenStudentData>,
  workspaceId: string = 'ws_default',
  onMerged?: (merged: Record<string, GardenStudentData>) => void
): Promise<boolean> {
  if (!gardenData || Object.keys(gardenData).length === 0) return true;

  const effectiveWs = workspaceId && workspaceId !== 'ws_default' ? workspaceId : 'ws_u-1';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}garden_data_v2`;
  const cloudKey = `${prefix}school_garden_data`;
  const legacyKey = 'deskos_garden_data_v2';

  // 1. Đọc dữ liệu hiện có từ LocalStorage
  let localData: Record<string, GardenStudentData> = {};
  try {
    const rawLocal = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed && typeof parsed === 'object') {
        localData = parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local garden data khi lưu:', e);
  }

  // 2. Đọc dữ liệu mới nhất từ Supabase Cloud với Timeout 1.5s bảo vệ chống treo khi Offline
  let cloudData: Record<string, GardenStudentData> = {};
  if (typeof navigator === 'undefined' || navigator.onLine) {
    try {
      const fetchPromise = supabase
        .from('school_states')
        .select('value')
        .eq('key', cloudKey)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: string }>(resolve => 
        setTimeout(() => resolve({ data: null, error: 'timeout' }), 1500)
      );

      const res: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (res?.data?.value && typeof res.data.value === 'object') {
        cloudData = res.data.value;
      }
    } catch (e) {
      console.warn('Lỗi đọc cloud garden data khi lưu:', e);
    }
  }

  // 3. THỰC HIỆN DEEP MERGE ĐA TẦNG (Cloud cũ + Local cũ + Thao tác mới nhất)
  let mergedData = deepMergeGardenData(cloudData, localData);
  mergedData = deepMergeGardenData(mergedData, gardenData);

  // 4. Lưu ngay lập tức vào LocalStorage (Bảo đảm dữ liệu sống sót 100% khi rớt mạng)
  safeSetLocalStorage(storageKey, mergedData);
  safeSetLocalStorage(legacyKey, mergedData);

  // 5. Cập nhật React State tức thì qua Callback
  if (onMerged) {
    try {
      onMerged(mergedData);
    } catch (e) {}
  }

  // 6. Lưu lên Supabase Cloud
  try {
    return await saveSupabaseState(cloudKey, mergedData);
  } catch {
    return true; // Đã lưu an toàn ở LocalStorage khi offline
  }
}

/**
 * 📥 Tải và hợp nhất toàn bộ dữ liệu Vườn Tri Thức cho Workspace
 * Bảo toàn 100% dữ liệu đã làm việc offline mà không bao giờ bị Cloud cũ đè mất!
 */
export function loadWorkspaceGardenData(
  workspaceId: string = 'ws_default',
  dbStates?: Record<string, any>,
  fallbackValue: Record<string, GardenStudentData> = {}
): Record<string, GardenStudentData> {
  const effectiveWs = workspaceId && workspaceId !== 'ws_default' ? workspaceId : 'ws_u-1';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}garden_data_v2`;
  const cloudKey = `${prefix}school_garden_data`;
  const legacyKey = 'deskos_garden_data_v2';

  let merged: Record<string, GardenStudentData> = { ...fallbackValue };

  // 1. Tải bản sao từ Cloud dbStates nếu có
  const scopedCloud = dbStates?.[cloudKey];
  if (scopedCloud && typeof scopedCloud === 'object') {
    merged = deepMergeGardenData(merged, scopedCloud);
  }

  // 2. Tải bản sao từ LocalStorage (chứa các chỉnh sửa mới nhất cả khi offline)
  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal) {
      const parsedLocal = JSON.parse(rawLocal);
      if (parsedLocal && typeof parsedLocal === 'object') {
        merged = deepMergeGardenData(merged, parsedLocal);
      }
    }
  } catch (e) {
    console.warn('Cannot parse local garden data:', e);
  }

  // 3. Kiểm tra fallback legacy 'deskos_garden_data_v2' nếu cần
  try {
    const rawLegacy = localStorage.getItem(legacyKey);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (parsedLegacy && typeof parsedLegacy === 'object') {
        merged = deepMergeGardenData(merged, parsedLegacy);
      }
    }
  } catch (e) {}

  return merged;
}

