import { Member, ClassItem, TimetableData } from '../types';
import { sortClasses } from './classSorter';

/**
 * Filter classes to match 100% of the assigned classes in the user's timetable.
 * Admin users see 100% of all classes in the school.
 */
export function getTeacherAssignedClasses(
  currentUser: Member | null,
  timetableData: TimetableData,
  classes: ClassItem[]
): ClassItem[] {
  if (!currentUser) return sortClasses(classes);

  const isAdmin = currentUser.role?.includes('Admin');
  if (isAdmin) return sortClasses(classes); // Admin gets 100% of all classes

  // Ưu tiên cao nhất: Danh sách lớp được Quản trị viên phân công cụ thể qua Checkbox
  if (Array.isArray(currentUser.assignedClasses) && currentUser.assignedClasses.length > 0) {
    const assignedIdsSet = new Set(currentUser.assignedClasses.map(id => id.trim().toLowerCase()));
    const specificClasses = classes.filter(c => 
      assignedIdsSet.has(c.id.trim().toLowerCase()) || 
      assignedIdsSet.has(c.name.trim().toLowerCase())
    );
    if (specificClasses.length > 0) {
      return sortClasses(specificClasses);
    }
  }

  // Find user's schedule entries in timetableData by username, id, or name
  const userTimetable =
    timetableData[currentUser.username] ||
    timetableData[currentUser.id] ||
    timetableData[currentUser.name] ||
    {};

  // Collect unique class names assigned in teacher's timetable
  const assignedClassNames = new Set<string>();
  Object.values(userTimetable).forEach((cell: any) => {
    if (cell && cell.className && typeof cell.className === 'string' && cell.className.trim()) {
      assignedClassNames.add(cell.className.trim().toLowerCase());
    }
  });

  // Filter classes array to include ONLY those assigned in timetable, OR classes where teacher === currentUser.name
  const assignedClasses = classes.filter(c => {
    const cNameLower = c.name.trim().toLowerCase();
    const cIdLower = c.id.trim().toLowerCase();
    const isTeacherOfClass =
      (c.teacher && c.teacher.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
      (c.subjectTeacher && c.subjectTeacher.trim().toLowerCase() === currentUser.name.trim().toLowerCase());

    return assignedClassNames.has(cNameLower) || assignedClassNames.has(cIdLower) || isTeacherOfClass;
  });

  // If no classes match timetable yet (e.g. fresh setup), fallback to classes assigned directly to teacher
  if (assignedClasses.length > 0) {
    return sortClasses(assignedClasses);
  }

  const directTeacherClasses = classes.filter(c => 
    (c.teacher && c.teacher.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
    (c.subjectTeacher && c.subjectTeacher.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  return sortClasses(directTeacherClasses.length > 0 ? directTeacherClasses : classes);
}
