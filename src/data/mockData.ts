import { Grade, ClassItem, Student, Computer, DocumentItem, Member, AttendanceData, EvaluationData, EmulationDataState, SeatingChart } from '../types';

export const defaultGrades: Grade[] = [
  { id: 3, name: 'Khối 3' },
  { id: 4, name: 'Khối 4' },
  { id: 5, name: 'Khối 5' },
];

export const defaultClasses: ClassItem[] = [
  { id: 'Ba 1', name: 'Ba 1', gradeId: 3, teacher: 'Nguyễn Thanh Đồng', teacherPhone: '0912345678', subjectTeacher: 'Nguyễn Thanh Đồng (Tin học)' },
  { id: '3B', name: 'Lớp 3B', gradeId: 3, teacher: 'Lê Hoài Nam', teacherPhone: '0987654321', subjectTeacher: 'Nguyễn Thanh Đồng (Tin học)' },
  { id: '4A', name: 'Lớp 4A', gradeId: 4, teacher: 'Nguyễn Thanh Đồng', teacherPhone: '0912345678', subjectTeacher: 'Nguyễn Thanh Đồng (Tin học)' },
  { id: '4B', name: 'Lớp 4B', gradeId: 4, teacher: 'Phạm Hồng Hạnh', teacherPhone: '0901234567', subjectTeacher: 'Nguyễn Thanh Đồng (Tin học)' },
  { id: '5A', name: 'Lớp 5A', gradeId: 5, teacher: 'Nguyễn Thanh Đồng', teacherPhone: '0912345678', subjectTeacher: 'Nguyễn Thanh Đồng (Tin học)' },
  { id: '5B', name: 'Lớp 5B', gradeId: 5, teacher: 'Vũ Minh Khôi', teacherPhone: '0934567890', subjectTeacher: 'Nguyễn Thanh Đồng (Tin học)' },
];

export const defaultStudents: Student[] = [];

export const generateDefaultComputers = (): Computer[] => {
  const list: Computer[] = [];
  // 35 Standard computers
  for (let i = 1; i <= 35; i++) {
    list.push({
      id: `comp-${i}`,
      name: `MÁY ${i}`,
      status: i === 12 ? 'Đang hỏng' : i === 24 ? 'Bảo trì' : 'Hoạt động',
      isMerged: false,
      num: i
    });
  }
  // 5 Merged computers (Máy ghép)
  for (let i = 1; i <= 5; i++) {
    list.push({
      id: `comp-g${i}`,
      name: `MÁY GHÉP ${i}`,
      status: i === 3 ? 'Bảo trì' : 'Hoạt động',
      isMerged: true,
      num: i
    });
  }
  return list;
};

export const defaultDocuments: DocumentItem[] = [
  { id: 'doc-1', title: 'Kế hoạch giáo dục Tin học lớp 3 - Tuần 1-18', type: 'KHGD', fileUrl: '#', author: 'Nguyễn Thanh Đồng', date: '2026-05-15', size: '2.4 MB', description: 'Phân phối chương trình môn Tin học lớp 3 học kỳ I.' },
  { id: 'doc-2', title: 'Bài giảng PPT: Chủ đề A - Máy tính và em (Lớp 3)', type: 'Bài giảng', fileUrl: '#', author: 'Nguyễn Thanh Đồng', date: '2026-05-20', size: '15.8 MB', description: 'Slide thuyết trình bài học Khái niệm Máy tính cơ bản.' },
  { id: 'doc-3', title: 'Kế hoạch giáo dục Tin học lớp 4 - Kì I', type: 'KHGD', fileUrl: '#', author: 'Lê Hoài Nam', date: '2026-05-10', size: '1.8 MB', description: 'Phân phối chương trình môn Tin học lớp 4 học kỳ I.' },
  { id: 'doc-4', title: 'Bài giảng điện tử: An toàn trên môi trường Internet (Lớp 5)', type: 'Bài giảng', fileUrl: '#', author: 'Phạm Hồng Hạnh', date: '2026-06-02', size: '24.1 MB', description: 'Bài giảng kỹ năng số chống lừa đảo, bảo mật mật khẩu dành cho học sinh lớp 5.' },
];

export const defaultMembers: Member[] = [
  { id: 'u-1', name: 'Nguyễn Thanh Đồng', role: 'Quản trị hệ thống (Admin)', email: 'nguyenthanhdong.hutech@gmail.com', phone: '0987.654.321', username: 'dong.nt', password: 'phongmay@123' },
];

const todayKey = new Date().toISOString().split('T')[0];

export const defaultAttendance: AttendanceData = {};

export const defaultEvaluation: EvaluationData = {};

export const defaultEmulation: EmulationDataState = {};

export const defaultSeating: SeatingChart = {};

export const defaultTimetable = {
  'dong.nt': {
    // Thứ Hai
    '2-5': { subject: 'Tin học', className: '3⁵' },
    '2-6': { subject: 'Tin học', className: '4²' },
    '2-7': { subject: 'Tin học', className: '4⁵' },
    // Thứ Ba
    '3-5': { subject: 'Tin học', className: '3⁶' },
    '3-6': { subject: 'Tin học', className: '3²' },
    '3-7': { subject: 'Tin học', className: '5⁶' },
    // Thứ Tư
    '4-1': { subject: 'Tin học', className: '4³' },
    '4-2': { subject: 'Tin học', className: '5²' },
    '4-3': { subject: 'Tin học', className: '5¹' },
    '4-4': { subject: 'Tin học', className: '3⁴' },
    '4-6': { subject: 'Tin học', className: '4¹' },
    '4-7': { subject: 'Tin học', className: '5⁷' },
    // Thứ Năm
    '5-1': { subject: 'Tin học', className: '4⁴' },
    '5-2': { subject: 'Tin học', className: '5³' },
    '5-3': { subject: 'Tin học', className: '5⁵' },
    '5-4': { subject: 'Tin học', className: '5⁴' },
    '5-6': { subject: 'Tin học', className: '3¹' },
    '5-7': { subject: 'Tin học', className: '4⁶' },
  },
  'nam.lh': {
    '2-1': { subject: 'Tin học', className: '3¹' },
    '2-2': { subject: 'Tin học', className: '3²' },
    '3-1': { subject: 'Tin học', className: '4¹' },
    '3-2': { subject: 'Tin học', className: '4²' },
  }
};


