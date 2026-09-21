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
  TimetableData
} from '../types';
import { sortClasses } from '../utils/classSorter';

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
