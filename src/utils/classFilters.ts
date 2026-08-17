import { Member, ClassItem, TimetableData } from '../types';

/**
 * Filter classes to match 100% of the assigned classes in the user's timetable.
 * Admin users see 100% of all classes in the school.
 */
export function getTeacherAssignedClasses(
  currentUser: Member | null,
  timetableData: TimetableData,
  classes: ClassItem[]
): ClassItem[] {
  if (!currentUser) return classes;

  const isAdmin = currentUser.role?.includes('Admin');
  if (isAdmin) return classes; // Admin gets 100% of all classes

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
    return assignedClasses;
  }

  const directTeacherClasses = classes.filter(c => 
    (c.teacher && c.teacher.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
    (c.subjectTeacher && c.subjectTeacher.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  return directTeacherClasses.length > 0 ? directTeacherClasses : classes;
}
