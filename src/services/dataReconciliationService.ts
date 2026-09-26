/**
 * 🔄 DỊCH VỤ KẾT HỢP & HỢP NHẤT DỮ LIỆU THÔNG MINH (DATA RECONCILIATION & MERGE SERVICE)
 * 
 * Nhiệm vụ:
 * Kết hợp thông minh giữa "Dữ liệu thật trên Supabase Cloud" và "Dữ liệu trong LocalStorage" của máy người dùng.
 * - Không để dữ liệu đám mây đè mất dữ liệu vừa tạo/chỉnh sửa ngoại tuyến dưới máy.
 * - Không để dữ liệu máy bỏ sót các thay đổi mới nhất từ các giáo viên/thiết bị khác trên Supabase.
 * - Bảo toàn tính toàn vẹn và tối đa hóa thông tin của từng bản ghi (Học sinh, Lớp học, Máy tính, TKB, Phân quyền...).
 */

import {
  Grade,
  ClassItem,
  Student,
  Computer,
  DocumentItem,
  Member,
  TimetableData,
  GardenReward
} from '../types';
import { sortClasses } from '../utils/classSorter';
import { isSampleReward } from '../utils/gardenPartition';

/**
 * 1. Hợp nhất Danh sách Khối (Grades)
 */
export function mergeGrades(cloudGrades?: Grade[], localGrades?: Grade[]): Grade[] {
  const map = new Map<number, Grade>();

  if (Array.isArray(cloudGrades)) {
    cloudGrades.forEach(g => {
      if (g && typeof g.id === 'number') map.set(g.id, { ...g });
    });
  }

  if (Array.isArray(localGrades)) {
    localGrades.forEach(g => {
      if (g && typeof g.id === 'number') {
        const existing = map.get(g.id);
        if (!existing) {
          map.set(g.id, { ...g });
        } else {
          map.set(g.id, { ...existing, ...g });
        }
      }
    });
  }

  return Array.from(map.values()).sort((a, b) => a.id - b.id);
}

/**
 * 2. Hợp nhất Danh sách Lớp học (Classes)
 */
export function mergeClasses(cloudClasses?: ClassItem[], localClasses?: ClassItem[]): ClassItem[] {
  const map = new Map<string, ClassItem>();

  const getKey = (c: ClassItem) => {
    if (c.id) return String(c.id).trim().toLowerCase();
    return `${c.gradeId}_${c.name}`.trim().toLowerCase();
  };

  // Nạp từ Cloud
  if (Array.isArray(cloudClasses)) {
    cloudClasses.forEach(c => {
      if (c && (c.id || c.name)) {
        map.set(getKey(c), { ...c });
      }
    });
  }

  // Hợp nhất với LocalStorage
  if (Array.isArray(localClasses)) {
    localClasses.forEach(c => {
      if (c && (c.id || c.name)) {
        const key = getKey(c);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, { ...c });
        } else {
          // Ưu tiên các trường có giá trị chi tiết hơn
          map.set(key, {
            ...existing,
            ...c,
            teacher: c.teacher || existing.teacher,
            teacherPhone: c.teacherPhone || existing.teacherPhone,
            subjectTeacher: c.subjectTeacher || existing.subjectTeacher
          });
        }
      }
    });
  }

  return sortClasses(Array.from(map.values()));
}

/**
 * 3. Hợp nhất Danh sách Học sinh (Students)
 * Tự động lọc bỏ học sinh mẫu cũ (st-1 đến st-21) và bảo toàn avatar, nhiệm vụ, ghi chú
 */
export function mergeStudents(cloudStudents?: Student[], localStudents?: Student[]): Student[] {
  const map = new Map<string, Student>();
  const isMockStudent = (id?: string) => Boolean(id && id.match(/^st-(?:[1-9]|1[0-9]|2[0-1])$/));

  const getKey = (s: Student) => {
    if (s.id) return s.id.trim().toLowerCase();
    if (s.code) return `code_${s.code.trim().toLowerCase()}`;
    return `${s.classId}_${s.name}`.trim().toLowerCase();
  };

  // Nạp từ Cloud
  if (Array.isArray(cloudStudents)) {
    cloudStudents.forEach(s => {
      if (s && (s.id || s.name) && !isMockStudent(s.id)) {
        map.set(getKey(s), { ...s });
      }
    });
  }

  // Hợp nhất với LocalStorage
  if (Array.isArray(localStudents)) {
    localStudents.forEach(s => {
      if (s && (s.id || s.name) && !isMockStudent(s.id)) {
        const key = getKey(s);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, { ...s });
        } else {
          // Kết hợp đầy đủ: giữ avatar, duty, notes nếu một trong hai bên có
          map.set(key, {
            ...existing,
            ...s,
            avatarUrl: s.avatarUrl || existing.avatarUrl,
            duty: s.duty || existing.duty,
            notes: s.notes || existing.notes,
            code: s.code || existing.code,
            gender: s.gender || existing.gender || 'Nam',
            classId: s.classId || existing.classId
          });
        }
      }
    });
  }

  return Array.from(map.values());
}

/**
 * 4. Hợp nhất Danh sách Thiết bị Máy tính (Computers)
 */
export function mergeComputers(cloudComputers?: Computer[], localComputers?: Computer[]): Computer[] {
  const map = new Map<string, Computer>();

  const getKey = (comp: Computer) => comp.id || `comp_num_${comp.num}`;

  if (Array.isArray(cloudComputers)) {
    cloudComputers.forEach(comp => {
      if (comp) map.set(getKey(comp), { ...comp });
    });
  }

  if (Array.isArray(localComputers)) {
    localComputers.forEach(comp => {
      if (comp) {
        const key = getKey(comp);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, { ...comp });
        } else {
          // Nếu một trong 2 bên báo hỏng hoặc bảo trì, ưu tiên ghi nhận để cảnh báo kỹ thuật
          const statusPriority = { 'Bảo trì': 3, 'Đang hỏng': 2, 'Hoạt động': 1 };
          const pLocal = statusPriority[comp.status] || 1;
          const pCloud = statusPriority[existing.status] || 1;
          const chosenStatus = pLocal >= pCloud ? comp.status : existing.status;

          map.set(key, {
            ...existing,
            ...comp,
            status: chosenStatus,
            isMerged: comp.isMerged ?? existing.isMerged
          });
        }
      }
    });
  }

  return Array.from(map.values()).sort((a, b) => a.num - b.num);
}

/**
 * 5. Hợp nhất Danh sách Thành viên / Phân quyền Giáo viên (Members)
 */
export function mergeMembers(cloudMembers?: Member[], localMembers?: Member[]): Member[] {
  const map = new Map<string, Member>();

  const getKey = (m: Member) => {
    if (m.username) return m.username.trim().toLowerCase();
    return m.id ? m.id.trim().toLowerCase() : '';
  };

  if (Array.isArray(cloudMembers)) {
    cloudMembers.forEach(m => {
      if (m && (m.username || m.id)) {
        map.set(getKey(m), { ...m });
      }
    });
  }

  if (Array.isArray(localMembers)) {
    localMembers.forEach(m => {
      if (m && (m.username || m.id)) {
        const key = getKey(m);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, { ...m });
        } else {
          // Bảo toàn thông tin phân quyền mới nhất (đặc biệt là khối, lớp chủ nhiệm vừa thêm)
          map.set(key, {
            ...existing,
            ...m,
            role: m.role || existing.role,
            homeroomGradeId: m.homeroomGradeId ?? existing.homeroomGradeId,
            homeroomClassId: m.homeroomClassId ?? existing.homeroomClassId,
            email: m.email || existing.email,
            phone: m.phone || existing.phone,
            name: m.name || existing.name
          });
        }
      }
    });
  }

  return Array.from(map.values());
}

/**
 * 6. Hợp nhất Danh sách Tài liệu (Documents)
 */
export function mergeDocuments(cloudDocs?: DocumentItem[], localDocs?: DocumentItem[]): DocumentItem[] {
  const map = new Map<string, DocumentItem>();

  if (Array.isArray(cloudDocs)) {
    cloudDocs.forEach(d => {
      if (d && d.id) map.set(d.id, { ...d });
    });
  }

  if (Array.isArray(localDocs)) {
    localDocs.forEach(d => {
      if (d && d.id) {
        const existing = map.get(d.id);
        if (!existing) {
          map.set(d.id, { ...d });
        } else {
          map.set(d.id, { ...existing, ...d });
        }
      }
    });
  }

  return Array.from(map.values());
}

/**
 * 7. Hợp nhất Thời khóa biểu toàn trường & từng Giáo viên (TimetableData)
 */
export function mergeTimetableData(
  cloudTimetable?: TimetableData,
  localTimetable?: TimetableData
): TimetableData {
  const merged: TimetableData = {};

  const teacherKeys = new Set<string>([
    ...Object.keys(cloudTimetable || {}),
    ...Object.keys(localTimetable || {})
  ]);

  teacherKeys.forEach(teacherKey => {
    const cloudSchedule = cloudTimetable?.[teacherKey] || {};
    const localSchedule = localTimetable?.[teacherKey] || {};

    const cellKeys = new Set<string>([
      ...Object.keys(cloudSchedule),
      ...Object.keys(localSchedule)
    ]);

    merged[teacherKey] = {};

    cellKeys.forEach(cellKey => {
      const cCell = cloudSchedule[cellKey];
      const lCell = localSchedule[cellKey];

      if (lCell && (lCell.subject || lCell.className)) {
        merged[teacherKey][cellKey] = { ...cCell, ...lCell };
      } else if (cCell && (cCell.subject || cCell.className)) {
        merged[teacherKey][cellKey] = { ...lCell, ...cCell };
      } else {
        merged[teacherKey][cellKey] = lCell || cCell || { subject: '', className: '' };
      }
    });
  });

  return merged;
}

/**
 * 8. Hợp nhất Mảng Generic theo ID (dùng cho Labs, Incidents, Maintenance Logs, Bookings, Questions, Subjects...)
 */
export function mergeArrayById<T extends { id?: string | number }>(
  cloudList?: T[],
  localList?: T[],
  keyField: keyof T = 'id'
): T[] {
  const map = new Map<string | number, T>();

  if (Array.isArray(cloudList)) {
    cloudList.forEach(item => {
      if (item && item[keyField] !== undefined) {
        map.set(item[keyField] as any, { ...item });
      }
    });
  }

  if (Array.isArray(localList)) {
    localList.forEach(item => {
      if (item && item[keyField] !== undefined) {
        const key = item[keyField] as any;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, { ...item });
        } else {
          map.set(key, { ...existing, ...item });
        }
      }
    });
  }

  return Array.from(map.values());
}

/**
 * 9. Hợp nhất Danh mục Phần thưởng Kho Quà (Garden Rewards)
 * Kết hợp thông minh giữa Supabase Cloud và LocalStorage để Localhost và Vercel giống nhau 100%, không bị kênh dữ liệu.
 */
export function reconcileRewards(
  cloudRewards?: GardenReward[],
  localRewards?: GardenReward[],
  deletedIds?: Set<string> | string[]
): GardenReward[] {
  const deletedSet = new Set<string>();
  if (deletedIds) {
    if (deletedIds instanceof Set) {
      deletedIds.forEach(id => deletedSet.add(String(id)));
    } else if (Array.isArray(deletedIds)) {
      deletedIds.forEach(id => deletedSet.add(String(id)));
    }
  }

  const map = new Map<string, GardenReward>();

  const isValidItem = (item: any): item is GardenReward => {
    return Boolean(
      item &&
      item.id &&
      typeof item.id === 'string' &&
      !isSampleReward(item) &&
      !deletedSet.has(item.id)
    );
  };

  // 1. Nạp từ Cloud (Dữ liệu thật trên máy chủ Supabase) - ƯU TIÊN SỐ 1
  if (Array.isArray(cloudRewards)) {
    cloudRewards.forEach(item => {
      if (isValidItem(item)) {
        map.set(item.id, { ...item });
      }
    });
  }

  // 2. Chỉ khi Cloud hoàn toàn rỗng hoặc chưa nạp thì mới dùng LocalStorage
  if (!cloudRewards || cloudRewards.length === 0) {
    if (Array.isArray(localRewards)) {
      localRewards.forEach(item => {
        if (isValidItem(item)) {
          map.set(item.id, { ...item });
        }
      });
    }
  }

  return Array.from(map.values()).filter(item => !isSampleReward(item) && !deletedSet.has(item.id));
}

/**
 * 🧹 DỌN SẠCH TOÀN BỘ CÁC KHÓA RÁC TOÀN CỤC CŨ TRONG LOCALSTORAGE
 * Đảm bảo trình duyệt không còn lưu giữ các khóa toàn cục cũ gây xung đột hoặc hồi sinh dữ liệu cũ.
 */
export function cleanAllOrphanGardenStorage(): void {
  const obsoleteKeys = [
    'ws_default_school_garden_rewards',
    'ws_default_school_garden_data',
    'ws_default_school_custom_seed_sets',
    'ws_default_deleted_reward_ids',
    'ws_default_garden_rewards_v2',
    'ws_default_garden_data_v2',
    'ws_default_custom_seed_sets_v1',
    'school_garden_rewards',
    'garden_rewards_v2',
    'garden_rewards',
    'school_garden_deleted_reward_ids',
    'school_garden_data',
    'garden_data_v2',
    'garden_data',
    'school_custom_seed_sets',
    'custom_seed_sets_v1',
    'custom_seed_sets'
  ];

  obsoleteKeys.forEach(k => {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  });
}

/**
 * 🎯 SO SÁNH VÀ THANH LỌC THÔNG MINH KHO QUÀ (SMART RECONCILE & PRUNE REWARDS)
 * Lấy dữ liệu thật từ Supabase Cloud làm CHÂN LÝ. Đối chiếu với LocalStorage:
 * Nếu trong LocalStorage có bất kỳ món quà nào dư thừa / không tồn tại trên Supabase -> LOẠI BỎ NGAY LẬP TỨC.
 */
export function smartReconcileAndPruneRewards(
  cloudRewards: GardenReward[] | undefined,
  storageKey: string,
  deletedIds?: Set<string>
): GardenReward[] {
  cleanAllOrphanGardenStorage();

  // 1. Nếu trên Cloud có danh sách quà: Cloud là nguồn chân lý duy nhất
  if (Array.isArray(cloudRewards)) {
    const validCloudItems = cloudRewards.filter(
      r => r && r.id && !isSampleReward(r) && (!deletedIds || !deletedIds.has(r.id))
    );
    const cloudIdSet = new Set(validCloudItems.map(r => r.id));

    // Đọc LocalStorage để kiểm tra và phát hiện dữ liệu dư thừa
    try {
      const rawLocal = localStorage.getItem(storageKey);
      if (rawLocal) {
        const localList: GardenReward[] = JSON.parse(rawLocal);
        if (Array.isArray(localList)) {
          const orphanItems = localList.filter(l => l && l.id && !cloudIdSet.has(l.id));
          if (orphanItems.length > 0) {
            console.info(`🧹 Đã phát hiện và loại bỏ ${orphanItems.length} món quà dư thừa trong LocalStorage:`, orphanItems.map(o => o.title || o.id));
          }
        }
      }
    } catch (e) {}

    // Ghi đè danh sách sạch chuẩn từ Cloud vào LocalStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(validCloudItems));
    } catch (e) {}

    return validCloudItems;
  }

  // 2. Fallback khi hoàn toàn offline: dùng LocalStorage đã lọc
  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal) {
      const localList: GardenReward[] = JSON.parse(rawLocal);
      if (Array.isArray(localList)) {
        return localList.filter(r => r && r.id && !isSampleReward(r) && (!deletedIds || !deletedIds.has(r.id)));
      }
    }
  } catch (e) {}

  return [];
}

/**
 * 🎯 SO SÁNH VÀ THANH LỌC THÔNG MINH TIẾN TRÌNH VƯỜN CÂY HỌC SINH (SMART RECONCILE & PRUNE GARDEN DATA)
 * Đối chiếu dữ liệu học sinh trong LocalStorage với Supabase Cloud. Dữ liệu nào dư thừa hoặc không có trên Cloud sẽ bị loại bỏ.
 */
export function smartReconcileAndPruneGardenData(
  cloudGarden: Record<string, any> | undefined,
  storageKey: string
): Record<string, any> {
  cleanAllOrphanGardenStorage();

  if (cloudGarden && typeof cloudGarden === 'object' && Object.keys(cloudGarden).length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cloudGarden));
    } catch (e) {}
    return cloudGarden;
  }

  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal) {
      const localParsed = JSON.parse(rawLocal);
      if (localParsed && typeof localParsed === 'object') {
        return localParsed;
      }
    }
  } catch (e) {}

  return {};
}

/**
 * 🎯 SO SÁNH VÀ THANH LỌC THÔNG MINH KHO HẠT GIỐNG (SMART RECONCILE & PRUNE SEED SETS)
 * Đảm bảo các bộ hạt giống 7 cấp độ khớp 100% với dữ liệu thật trên Supabase Cloud.
 */
export function smartReconcileAndPruneSeedSets<T extends { id?: string; name?: string }>(
  cloudSeedSets: T[] | undefined,
  storageKey: string
): T[] {
  cleanAllOrphanGardenStorage();

  if (Array.isArray(cloudSeedSets) && cloudSeedSets.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cloudSeedSets));
    } catch (e) {}
    return cloudSeedSets;
  }

  try {
    const rawLocal = localStorage.getItem(storageKey);
    if (rawLocal) {
      const localParsed = JSON.parse(rawLocal);
      if (Array.isArray(localParsed)) {
        return localParsed;
      }
    }
  } catch (e) {}

  return [];
}
