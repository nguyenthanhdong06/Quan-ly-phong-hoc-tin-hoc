import { GardenStudentData, GardenReward, WaterLog, CustomSeedSet } from '../types';
import { safeSetLocalStorage } from './safeStorage';
import { saveSupabaseState, supabase } from '../supabaseClient';
import { reconcileRewards } from '../services/dataReconciliationService';

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
 * 💾 LƯU DANH MỤC PHẦN THƯỞNG ĐỔI QUÀ (SCOPED WORKSPACE ISOLATION)
 * - Tài khoản nào tạo/sửa/xóa phần thưởng thì CHỈ LƯU VÀO TÀI KHOẢN ĐÓ.
 * - Tuyệt đối không lưu vào khoá toàn cục (school_garden_rewards) để không ghi đè hay làm xáo trộn giữa các tài khoản.
 * - Đồng bộ giữa LocalStorage và Supabase Cloud theo đúng key phân vùng của tài khoản đó (đảm bảo cùng 1 tài khoản mở ở Localhost hay Vercel đều đồng nhất 100%).
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

  // 1. Xử lý tham số thứ 3 (Callback onMerged hoặc danh sách ID vừa xóa của tài khoản này)
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
      // Lưu danh sách ID đã xóa CHỈ vào key của tài khoản này trên Supabase
      saveSupabaseState(deletedIdsKey, updated);
    } catch (e) {}
  }

  // 2. Đọc tập ID đã xóa của tài khoản này để lọc triệt để
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

  // 3. Lưu ngay lập tức 0ms vào LocalStorage CHỈ CỦA TÀI KHOẢN NÀY
  safeSetLocalStorage(storageKey, cleanedRewards);

  // 4. Cập nhật React State tức thì qua Callback (nếu có)
  if (onMerged) {
    try {
      onMerged(cleanedRewards);
    } catch (e) {}
  }

  // 5. Ghi đè đồng bộ lên Supabase Cloud CHỈ THEO KEY CỦA TÀI KHOẢN NÀY (cloudKey)
  // TUYỆT ĐỐI KHÔNG GHI VÀO KEY TOÀN CỤC school_garden_rewards
  try {
    const success = await saveSupabaseState(cloudKey, cleanedRewards);
    return success;
  } catch {
    return true; // Đã lưu an toàn ở LocalStorage khi offline
  }
}

/**
 * 📥 TẢI VÀ KẾT HỢP DỮ LIỆU PHẦN THƯỞNG CHO WORKSPACE (SCOPED WORKSPACE RECONCILIATION)
 * - Tài khoản nào CHỈ NẠP DỮ LIỆU CỦA CHÍNH TÀI KHOẢN ĐÓ (từ Cloud và LocalStorage của tài khoản).
 * - Tuyệt đối không nạp từ khoá toàn cục để không bị hòa trộn kho quà của tài khoản khác.
 * - Kết hợp thông minh giữa Supabase Cloud và LocalStorage của tài khoản đó để khi tài khoản đó mở ở Localhost hay Vercel đều có dữ liệu giống nhau 100%.
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
  const deletedIdsKey = `${prefix}deleted_reward_ids`;

  // 🛡️ DỌN SẠCH TRIỆT ĐỂ: Loại bỏ tất cả dữ liệu trong các biến/khóa toàn cục cũ khỏi LocalStorage
  try {
    localStorage.removeItem('school_garden_rewards');
    localStorage.removeItem('garden_rewards_v2');
    localStorage.removeItem('garden_rewards');
    localStorage.removeItem('school_garden_deleted_reward_ids');
  } catch (e) {}

  // 0. Thu thập toàn bộ ID đã bị xóa CỦA CHÍNH TÀI KHOẢN NÀY (cả từ Local và Cloud)
  const deletedIds = new Set<string>();

  // Đọc từ LocalStorage của tài khoản này
  try {
    const rawLocalDeleted = localStorage.getItem(deletedIdsKey);
    if (rawLocalDeleted) {
      const parsed = JSON.parse(rawLocalDeleted);
      if (Array.isArray(parsed)) parsed.forEach(id => deletedIds.add(String(id)));
    }
  } catch (e) {}

  // Đọc từ Cloud dbStates của tài khoản này (nếu có)
  if (dbStates) {
    const cloudScopedDeleted = dbStates[deletedIdsKey];
    if (Array.isArray(cloudScopedDeleted)) {
      cloudScopedDeleted.forEach(id => deletedIds.add(String(id)));
    }
  }

  // Cập nhật lại deletedIds đầy đủ vào LocalStorage của tài khoản này
  const allDeletedArr = Array.from(deletedIds);
  if (allDeletedArr.length > 0) {
    safeSetLocalStorage(deletedIdsKey, allDeletedArr);
  }

  // 1. Thu thập danh sách phần thưởng từ Cloud CHỈ CỦA TÀI KHOẢN NÀY
  let cloudItems: GardenReward[] = [];
  if (dbStates) {
    const scopedCloud = dbStates[cloudKey];
    if (Array.isArray(scopedCloud) && scopedCloud.length > 0) {
      cloudItems = scopedCloud;
    }
  }

  // 2. Thu thập danh sách phần thưởng từ LocalStorage CHỈ CỦA TÀI KHOẢN NÀY
  let localItems: GardenReward[] = [];
  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) localItems = parsed;
    }
  } catch (e) {}

  // 3. Kết hợp thông minh giữa Cloud và LocalStorage của chính tài khoản này
  let result: GardenReward[] = [];

  if (cloudItems.length > 0 || localItems.length > 0) {
    result = reconcileRewards(cloudItems, localItems, deletedIds);
  } else if (Array.isArray(fallbackValue) && fallbackValue.length > 0) {
    result = fallbackValue.filter(item => item && item.id && !isSampleReward(item) && !deletedIds.has(item.id));
  }

  // 4. Lưu lại dữ liệu hợp nhất vào LocalStorage CHỈ CỦA TÀI KHOẢN NÀY
  safeSetLocalStorage(storageKey, result);

  // 5. Tự động đồng bộ hóa ngược (Auto Self-Healing) CHỈ LÊN KEY CỦA TÀI KHOẢN NÀY TRÊN CLOUD:
  // Giúp tài khoản đó khi mở ở Localhost hay Vercel đều sở hữu cùng một bộ dữ liệu hoàn chỉnh nhất
  if (dbStates && result.length > 0) {
    const cloudCount = cloudItems.length;
    const needsSync = result.length !== cloudCount || 
      result.some(r => !cloudItems.some(c => c.id === r.id)) ||
      cloudItems.some(c => deletedIds.has(c.id));

    if (needsSync) {
      saveSupabaseState(cloudKey, result);
      if (allDeletedArr.length > 0) {
        saveSupabaseState(deletedIdsKey, allDeletedArr);
      }
    }
  }

  return result;
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

  // 🛡️ DỌN SẠCH TRIỆT ĐỂ: Loại bỏ các khóa dữ liệu vườn toàn cục cũ khỏi LocalStorage
  try {
    localStorage.removeItem('school_garden_data');
    localStorage.removeItem('garden_data_v2');
    localStorage.removeItem('garden_data');
  } catch (e) {}

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
 * Chỉ lưu theo đúng key chuẩn của Workspace (${workspaceId}_school_custom_seed_sets)
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

  // 1. Lưu ngay vào LocalStorage của Workspace
  safeSetLocalStorage(storageKey, seedSets);

  // 2. Lưu lên Supabase Cloud của Workspace CHỈ theo đúng key chuẩn của Workspace
  try {
    return await saveSupabaseState(cloudKey, seedSets);
  } catch {
    return true; // Lưu an toàn ở local khi offline
  }
}

/**
 * 📥 TẢI KHO HẠT GIỐNG TÙY CHỈNH THEO WORKSPACE
 * Tự động tải kho hạt giống của đúng Workspace giáo viên đó.
 * Loại bỏ hoàn toàn các khóa toàn cục dư thừa khỏi LocalStorage.
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

  // 🛡️ DỌN SẠCH TRIỆT ĐỂ: Loại bỏ các khóa hạt giống toàn cục cũ khỏi LocalStorage
  try {
    localStorage.removeItem('school_custom_seed_sets');
    localStorage.removeItem('custom_seed_sets_v1');
    localStorage.removeItem('custom_seed_sets');
  } catch (e) {}

  let result: CustomSeedSet[] = [];

  // 1. Tải từ Cloud theo Workspace hiện tại (các cây của riêng giáo viên)
  const scopedCloud = dbStates?.[cloudKey];
  if (Array.isArray(scopedCloud) && scopedCloud.length > 0) {
    result = deepMergeSeedSets(result, scopedCloud);
  }

  // 2. Đọc từ LocalStorage của Workspace (chứa các thay đổi offline mới nhất)
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

  if (result.length > 0) {
    safeSetLocalStorage(storageKey, result);
    return result;
  }

  return Array.isArray(fallbackValue) ? fallbackValue : [];
}


