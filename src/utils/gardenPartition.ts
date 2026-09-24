import { GardenStudentData, GardenReward, WaterLog, CustomSeedSet } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState, supabase } from '../supabaseClient';

/**
 * 📦 QUẢN LÝ DỮ LIỆU VƯỜN TRI THỨC, ĐỔI THƯỞNG & KHO HẠT GIỐNG (OFFLINE-FIRST & WORKSPACE ISOLATION)
 * Chuẩn mực hóa 100% theo phân hệ Workspace của Đánh giá tặng sao:
 * - Phân vùng lưu trữ tuyệt đối theo Workspace (Workspace Partitioning) cho từng Giáo viên
 * - Ghi tức thì 0ms vào LocalStorage (Bảo toàn 100% dữ liệu khi ngoại tuyến)
 * - Mỗi giáo viên tự quản lý: Cây & Giọt nước học sinh, Kho quà tặng, Kho hạt giống 7 cấp độ
 * - Timeout 1.5s bảo vệ chống treo/đơ giao diện khi rớt mạng
 * - Xử lý thông minh việc đổi thưởng (trừ giọt nước) không bị Math.max đè mất dữ liệu
 */

// Danh sách phần thưởng mẫu mặc định ban đầu: Rỗng để giáo viên tự tạo
export const DEFAULT_REWARDS: GardenReward[] = [];

// Mẫu Bộ Hạt Giống Mặc Định
export const DEFAULT_CUSTOM_SEED_SETS: CustomSeedSet[] = [];

/**
 * 🛡️ HÀM NHẬN DIỆN PHẦN THƯỞNG MẪU (SAMPLE REWARDS)
 * Tự động loại bỏ triệt để các phần thưởng mẫu cũ khỏi hệ thống
 */
export const isSampleReward = (item: GardenReward): boolean => {
  if (!item) return false;
  const sampleIds = ['rew-1', 'rew-2', 'rew-3', 'rew-4'];
  if (item.id && sampleIds.includes(item.id)) return true;
  const sampleTitles = [
    'bút chì màu dễ thương',
    'vở bài tập lò xo xinh xắn',
    'bộ màu vẽ 24 màu sặc sỡ',
    'đồ chơi lắp ráp trí tuệ'
  ];
  if (item.title && sampleTitles.includes(item.title.trim().toLowerCase())) return true;
  return false;
};

/**
 * 🔄 HỢP NHẤT SÂU DANH MỤC PHẦN THƯỞNG (DEEP MERGE REWARDS)
 * Hợp nhất danh sách phần thưởng theo ID, bảo toàn các phần thưởng mới được tạo ngoại tuyến
 * ở cả client và server, tự động loại bỏ mọi phần thưởng mẫu cũ.
 */
export function deepMergeRewards(
  target: GardenReward[],
  source: GardenReward[]
): GardenReward[] {
  const map = new Map<string, GardenReward>();

  if (Array.isArray(target)) {
    target.forEach(item => {
      if (item && item.id && !isSampleReward(item)) map.set(item.id, { ...item });
    });
  }

  if (Array.isArray(source)) {
    source.forEach(item => {
      if (item && item.id && !isSampleReward(item)) {
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
            type: item.type || existing.type,
            imageUrl: item.imageUrl !== undefined ? item.imageUrl : existing.imageUrl
          });
        }
      }
    });
  }

  const merged = Array.from(map.values()).filter(item => !isSampleReward(item));
  return merged;
}

/**
 * 💾 LƯU DANH MỤC PHẦN THƯỞNG ĐỔI QUÀ (OFFLINE-FIRST & WORKSPACE SCOPED)
 * - Ghi ngay 0ms vào LocalStorage của đúng Workspace giáo viên.
 * - Cô lập 100%, đồng thời cập nhật Cloud của Workspace và kho chung nếu là tài khoản quản trị.
 * - Ghi nhận danh sách ID bị xóa để chống hồi sinh dữ liệu cũ (Tombstone Deletion Protection).
 */
export async function saveWorkspaceRewardsData(
  rewards: GardenReward[],
  workspaceId: string = 'ws_default',
  onMergedOrDeletedIds?: ((merged: GardenReward[]) => void) | string | string[]
): Promise<boolean> {
  if (!Array.isArray(rewards)) return true;

  const effectiveWs = workspaceId ? workspaceId : 'ws_default';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}garden_rewards_v2`;
  const cloudKey = `${prefix}school_garden_rewards`;
  const deletedIdsKey = `${prefix}deleted_reward_ids`;

  // 1. Xử lý tham số thứ 3 (Callback onMerged hoặc danh sách ID vừa xóa)
  let onMerged: ((merged: GardenReward[]) => void) | undefined;
  if (typeof onMergedOrDeletedIds === 'function') {
    onMerged = onMergedOrDeletedIds;
  } else if (onMergedOrDeletedIds) {
    try {
      const rawDeleted = localStorage.getItem(deletedIdsKey);
      const currentDeleted: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      const toAdd = Array.isArray(onMergedOrDeletedIds) ? onMergedOrDeletedIds : [onMergedOrDeletedIds];
      const updated = Array.from(new Set([...currentDeleted, ...toAdd]));
      safeSetLocalStorage(deletedIdsKey, updated);
    } catch (e) {}
  }

  // 2. Đọc tập ID đã xóa để lọc triệt để
  let deletedIds = new Set<string>();
  try {
    const rawDeleted = localStorage.getItem(deletedIdsKey);
    if (rawDeleted) {
      const parsed = JSON.parse(rawDeleted);
      if (Array.isArray(parsed)) parsed.forEach(id => deletedIds.add(String(id)));
    }
  } catch (e) {}

  // Lọc sạch toàn bộ phần thưởng mẫu và phần thưởng đã bị xóa
  const cleanedRewards = rewards.filter(item => item && item.id && !isSampleReward(item) && !deletedIds.has(item.id));

  // 3. Lưu ngay lập tức 0ms vào LocalStorage của Workspace này
  safeSetLocalStorage(storageKey, cleanedRewards);
  // Đồng bộ cả key legacy nếu có để không bị xung đột
  safeSetLocalStorage(`${prefix}garden_rewards`, cleanedRewards);

  // 4. Cập nhật React State tức thì qua Callback (nếu có)
  if (onMerged) {
    try {
      onMerged(cleanedRewards);
    } catch (e) {}
  }

  // 5. Ghi đè đồng bộ lên Supabase Cloud theo key phân vùng của Workspace
  try {
    const promises = [saveSupabaseState(cloudKey, cleanedRewards)];
    // Nếu là Workspace mặc định hoặc Workspace quản trị chính (ws_u-1): cập nhật luôn kho chung toàn trường
    if (effectiveWs === 'ws_default' || effectiveWs === 'ws_u-1') {
      promises.push(saveSupabaseState('school_garden_rewards', cleanedRewards));
    }
    const results = await Promise.all(promises);
    return results[0];
  } catch {
    return true; // Đã lưu an toàn ở LocalStorage khi offline
  }
}

/**
 * 📥 TẢI VÀ HỢP NHẤT DỮ LIỆU PHẦN THƯỞNG CHO WORKSPACE
 * Cô lập tuyệt đối theo Workspace:
 * - Ưu tiên 1: Dữ liệu LocalStorage của Workspace (bảo toàn 100% việc thêm/sửa/xóa của giáo viên).
 * - Ưu tiên 2: Dữ liệu Cloud của đúng Workspace đó trên Supabase.
 * - Ưu tiên 3: Kế thừa từ Cloud toàn cục CHỈ KHI Workspace là mới tinh chưa từng được cấu hình.
 * - Tuyệt đối không merge mù quáng để tránh hồi sinh các phần thưởng đã bị giáo viên xóa!
 */
export function loadWorkspaceRewardsData(
  workspaceId: string = 'ws_default',
  dbStates?: Record<string, any>,
  fallbackValue: GardenReward[] = DEFAULT_REWARDS
): GardenReward[] {
  const effectiveWs = workspaceId ? workspaceId : 'ws_default';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}garden_rewards_v2`;
  const cloudKey = `${prefix}school_garden_rewards`;
  const globalCloudKey = 'school_garden_rewards';
  const deletedIdsKey = `${prefix}deleted_reward_ids`;

  // 0. Đọc tập ID đã bị xóa của Workspace để loại trừ triệt để (Tombstone)
  let deletedIds = new Set<string>();
  try {
    const rawDeleted = localStorage.getItem(deletedIdsKey);
    if (rawDeleted) {
      const parsed = JSON.parse(rawDeleted);
      if (Array.isArray(parsed)) parsed.forEach(id => deletedIds.add(String(id)));
    }
  } catch (e) {}

  const filterValid = (arr: any[]): GardenReward[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => item && item.id && !isSampleReward(item) && !deletedIds.has(item.id));
  };

  // 1. ƯU TIÊN 1: Đọc từ LocalStorage của Workspace hiện tại
  // Nếu LocalStorage đã tồn tại bản ghi (kể cả mảng rỗng [] khi giáo viên đã xóa hết quà)
  const rawLocal = localStorage.getItem(storageKey);
  if (rawLocal !== null) {
    try {
      const parsedLocal = JSON.parse(rawLocal);
      if (Array.isArray(parsedLocal)) {
        const cleaned = filterValid(parsedLocal);
        return cleaned;
      }
    } catch (e) {
      console.warn('Cannot parse local workspace rewards data:', e);
    }
  }

  // 2. ƯU TIÊN 2: Đọc từ Cloud Supabase của đúng Workspace hiện tại
  const scopedCloud = dbStates?.[cloudKey];
  if (scopedCloud !== undefined && Array.isArray(scopedCloud)) {
    const cleaned = filterValid(scopedCloud);
    safeSetLocalStorage(storageKey, cleaned);
    return cleaned;
  }

  // 3. ƯU TIÊN 3: Kế thừa từ Cloud toàn cục của trường (Chỉ áp dụng khi Workspace mới tinh chưa từng cấu hình)
  const globalCloud = dbStates?.[globalCloudKey];
  if (globalCloud !== undefined && Array.isArray(globalCloud) && globalCloud.length > 0) {
    const cleaned = filterValid(globalCloud);
    if (cleaned.length > 0) {
      safeSetLocalStorage(storageKey, cleaned);
      return cleaned;
    }
  }

  // 4. Dự phòng: fallbackValue (nếu có và hợp lệ)
  const cleanedFallback = filterValid(fallbackValue);
  return cleanedFallback;
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
 * 💾 Lưu dữ liệu Vườn Tri Thức với cơ chế Offline-First & Phân Vùng Workspace
 * Cô lập 100% theo Workspace: Điểm nước và tiến trình cây của giáo viên nào chỉ thuộc giáo viên đó.
 */
export async function saveWorkspaceGardenData(
  gardenData: Record<string, GardenStudentData>,
  workspaceId: string = 'ws_default',
  onMerged?: (merged: Record<string, GardenStudentData>) => void
): Promise<boolean> {
  if (!gardenData || Object.keys(gardenData).length === 0) return true;

  const effectiveWs = workspaceId ? workspaceId : 'ws_default';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}garden_data_v2`;
  const cloudKey = `${prefix}school_garden_data`;

  // 1. Đọc dữ liệu hiện có từ LocalStorage của đúng Workspace
  let localData: Record<string, GardenStudentData> = {};
  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed && typeof parsed === 'object') {
        localData = parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local garden data khi lưu:', e);
  }

  // 2. Đọc dữ liệu mới nhất từ Supabase Cloud của Workspace với Timeout 1.5s bảo vệ chống treo khi Offline
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

  // 3. THỰC HIỆN DEEP MERGE ĐA TẦNG (Cloud cũ + Local cũ + Thao tác mới nhất của Workspace)
  let mergedData = deepMergeGardenData(cloudData, localData);
  mergedData = deepMergeGardenData(mergedData, gardenData);

  // 4. Lưu ngay lập tức vào LocalStorage của Workspace (Bảo đảm dữ liệu sống sót 100% khi rớt mạng)
  safeSetLocalStorage(storageKey, mergedData);

  // 5. Cập nhật React State tức thì qua Callback
  if (onMerged) {
    try {
      onMerged(mergedData);
    } catch (e) {}
  }

  // 6. Lưu lên Supabase Cloud của Workspace
  try {
    return await saveSupabaseState(cloudKey, mergedData);
  } catch {
    return true; // Đã lưu an toàn ở LocalStorage khi offline
  }
}

/**
 * 📥 Tải và hợp nhất toàn bộ dữ liệu Vườn Tri Thức cho Workspace
 * Đảm bảo 100% cách ly: Giáo viên mới vào bắt đầu từ vườn riêng của mình, không bị lấy dữ liệu từ giáo viên khác!
 */
export function loadWorkspaceGardenData(
  workspaceId: string = 'ws_default',
  dbStates?: Record<string, any>,
  fallbackValue: Record<string, GardenStudentData> = {}
): Record<string, GardenStudentData> {
  const effectiveWs = workspaceId ? workspaceId : 'ws_default';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}garden_data_v2`;
  const cloudKey = `${prefix}school_garden_data`;

  let merged: Record<string, GardenStudentData> = { ...fallbackValue };

  // 1. Tải bản sao từ Cloud dbStates của đúng Workspace
  const scopedCloud = dbStates?.[cloudKey];
  if (scopedCloud && typeof scopedCloud === 'object') {
    merged = deepMergeGardenData(merged, scopedCloud);
  }

  // 2. Tải bản sao từ LocalStorage của đúng Workspace (chứa các chỉnh sửa mới nhất cả khi offline)
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

  return merged;
}

/**
 * 🔄 HỢP NHẤT SÂU KHO HẠT GIỐNG (DEEP MERGE SEED SETS)
 * Tự động gộp các bộ hạt giống theo ID hoặc Tên cây, bảo toàn tối đa dữ liệu,
 * ưu tiên bộ có nhiều hình ảnh cấp độ nhất hoặc mới nhất.
 */
export function deepMergeSeedSets(
  target: CustomSeedSet[],
  source: CustomSeedSet[]
): CustomSeedSet[] {
  const map = new Map<string, CustomSeedSet>();

  const processItem = (item: CustomSeedSet) => {
    if (!item || (!item.id && !item.name)) return;
    const key = (item.name ? item.name.trim().toLowerCase() : item.id) || item.id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item });
    } else {
      // Hợp nhất các cấp độ 1-7 (cấp độ nào có ảnh thì giữ lại)
      const mergedLevels = {
        1: existing.levels?.[1] || '',
        2: existing.levels?.[2] || '',
        3: existing.levels?.[3] || '',
        4: existing.levels?.[4] || '',
        5: existing.levels?.[5] || '',
        6: existing.levels?.[6] || '',
        7: existing.levels?.[7] || '',
        ...(existing.levels || {})
      };
      if (item.levels) {
        for (let lvl = 1; lvl <= 7; lvl++) {
          const lKey = lvl as keyof typeof item.levels;
          if (item.levels[lKey] && item.levels[lKey].trim()) {
            mergedLevels[lKey] = item.levels[lKey];
          }
        }
      }
      map.set(key, {
        ...existing,
        ...item,
        id: existing.id || item.id,
        icon: item.icon || existing.icon,
        name: existing.name || item.name,
        levels: mergedLevels,
        createdAt: existing.createdAt || item.createdAt
      });
    }
  };

  if (Array.isArray(target)) target.forEach(processItem);
  if (Array.isArray(source)) source.forEach(processItem);

  return Array.from(map.values());
}

/**
 * 💾 LƯU KHO HẠT GIỐNG TÙY CHỈNH THEO WORKSPACE (OFFLINE-FIRST & WORKSPACE SCOPED)
 * Mỗi giáo viên tự tạo và quản lý các bộ hạt giống 7 cấp độ riêng của mình
 */
export async function saveWorkspaceSeedSets(
  seedSets: CustomSeedSet[],
  workspaceId: string = 'ws_default'
): Promise<boolean> {
  if (!Array.isArray(seedSets)) return true;

  const effectiveWs = workspaceId ? workspaceId : 'ws_default';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}custom_seed_sets_v1`;
  const cloudKey = `${prefix}school_custom_seed_sets`;
  const legacyCloudKey = `${prefix}custom_seed_sets_v1`;

  // 1. Lưu ngay vào LocalStorage của Workspace
  safeSetLocalStorage(storageKey, seedSets);

  // 2. Lưu lên Supabase Cloud của Workspace (lưu cả 2 key để tương thích mọi phiên bản)
  try {
    const p1 = saveSupabaseState(cloudKey, seedSets);
    const p2 = saveSupabaseState(legacyCloudKey, seedSets);
    const [r1] = await Promise.all([p1, p2]);
    return r1;
  } catch {
    return true; // Lưu an toàn ở local khi offline
  }
}

/**
 * 📥 TẢI KHO HẠT GIỐNG TÙY CHỈNH THEO WORKSPACE
 * Tự động tải kho hạt giống của đúng Workspace giáo viên đó, đồng thời tự động kế thừa
 * kho hạt giống toàn cục của trường (nếu có) để giáo viên không bao giờ bị mất hạt giống cũ.
 */
export function loadWorkspaceSeedSets(
  workspaceId: string = 'ws_default',
  dbStates?: Record<string, any>,
  fallbackValue: CustomSeedSet[] = DEFAULT_CUSTOM_SEED_SETS
): CustomSeedSet[] {
  const effectiveWs = workspaceId ? workspaceId : 'ws_default';
  const prefix = `${effectiveWs}_`;
  const storageKey = `${prefix}custom_seed_sets_v1`;
  const cloudKey = `${prefix}school_custom_seed_sets`;
  const legacyCloudKey = `${prefix}custom_seed_sets_v1`;
  const globalCloudKey = 'school_custom_seed_sets';

  let result: CustomSeedSet[] = [];

  // 1. Kế thừa từ Cloud kho hạt giống toàn cục của trường (10 cây mẫu)
  const globalCloud = dbStates?.[globalCloudKey];
  if (Array.isArray(globalCloud) && globalCloud.length > 0) {
    result = deepMergeSeedSets(result, globalCloud);
  }

  // 2. Kế thừa từ Cloud theo Workspace hiện tại (các cây của riêng giáo viên)
  const scopedCloud = dbStates?.[cloudKey] || dbStates?.[legacyCloudKey];
  if (Array.isArray(scopedCloud) && scopedCloud.length > 0) {
    result = deepMergeSeedSets(result, scopedCloud);
  }

  // 3. Đọc từ LocalStorage của Workspace (chứa các thay đổi offline mới nhất)
  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal !== null) {
      const parsedLocal = JSON.parse(rawLocal);
      if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
        result = deepMergeSeedSets(result, parsedLocal);
      }
    }
  } catch (e) {
    console.warn('Cannot parse local seed sets:', e);
  }

  // 4. Dự phòng: Đọc LocalStorage toàn cục cũ
  try {
    const rawGlobal = localStorage.getItem('school_custom_seed_sets');
    if (rawGlobal !== null) {
      const parsedGlobal = JSON.parse(rawGlobal);
      if (Array.isArray(parsedGlobal) && parsedGlobal.length > 0) {
        result = deepMergeSeedSets(result, parsedGlobal);
      }
    }
  } catch (e) {}

  if (result.length > 0) {
    safeSetLocalStorage(storageKey, result);
    return result;
  }

  return Array.isArray(fallbackValue) ? fallbackValue : [];
}


