import { Grade, ClassItem, Student, Computer, DocumentItem, Member, AttendanceData, EvaluationData, EmulationDataState, SeatingChart } from '../types';

export const defaultGrades: Grade[] = [
  { id: 3, name: 'Khối 3' },
  { id: 4, name: 'Khối 4' },
  { id: 5, name: 'Khối 5' },
];

export const defaultClasses: ClassItem[] = [
  { id: 'Ba 1', name: 'Ba 1', gradeId: 3, teacher: 'Nguyễn Thanh Đồng' },
  { id: '3B', name: 'Lớp 3B', gradeId: 3, teacher: 'Lê Hoài Nam' },
  { id: '4A', name: 'Lớp 4A', gradeId: 4, teacher: 'Nguyễn Thanh Đồng' },
  { id: '4B', name: 'Lớp 4B', gradeId: 4, teacher: 'Phạm Hồng Hạnh' },
  { id: '5A', name: 'Lớp 5A', gradeId: 5, teacher: 'Nguyễn Thanh Đồng' },
  { id: '5B', name: 'Lớp 5B', gradeId: 5, teacher: 'Vũ Minh Khôi' },
];

export const defaultStudents: Student[] = [
  { id: 'st-1', code: 'HS301', name: 'Nguyễn Minh Quân', gender: 'Nam', classId: 'Ba 1' },
  { id: 'st-2', code: 'HS302', name: 'Trần Thị Mỹ Tâm', gender: 'Nữ', classId: 'Ba 1' },
  { id: 'st-3', code: 'HS303', name: 'Lê Hoàng Nam', gender: 'Nam', classId: 'Ba 1' },
  { id: 'st-4', code: 'HS304', name: 'Phạm Bảo Khánh', gender: 'Nam', classId: 'Ba 1' },
  { id: 'st-5', code: 'HS305', name: 'Đỗ Thùy Trang', gender: 'Nữ', classId: 'Ba 1' },
  { id: 'st-6', code: 'HS306', name: 'Nguyễn An Bình', gender: 'Nam', classId: 'Ba 1' },
  { id: 'st-7', code: 'HS307', name: 'Vũ Cẩm Ly', gender: 'Nữ', classId: 'Ba 1' },
  { id: 'st-8', code: 'HS308', name: 'Hoàng Quốc Bảo', gender: 'Nam', classId: 'Ba 1' },
  { id: 'st-9', code: 'HS309', name: 'Phan Gia Huy', gender: 'Nam', classId: 'Ba 1' },
  { id: 'st-10', code: 'HS310', name: 'Nguyễn Lâm Oanh', gender: 'Nữ', classId: 'Ba 1' },
  { id: 'st-11', code: 'HS311', name: 'Bùi Anh Tuấn', gender: 'Nam', classId: 'Ba 1' },
  { id: 'st-12', code: 'HS312', name: 'Lý Kim Chi', gender: 'Nữ', classId: 'Ba 1' },
  { id: 'st-13', code: 'HS313', name: 'Phùng Minh Triết', gender: 'Nam', classId: 'Ba 1' },
  { id: 'st-14', code: 'HS314', name: 'Hồ Nhã Phương', gender: 'Nữ', classId: 'Ba 1' },
  { id: 'st-15', code: 'HS315', name: 'Đặng Ngọc Lân', gender: 'Nam', classId: 'Ba 1' },
  
  { id: 'st-16', code: 'HS316', name: 'Lê Tiến Dũng', gender: 'Nam', classId: '3B' },
  { id: 'st-17', code: 'HS317', name: 'Mai Khánh Huyền', gender: 'Nữ', classId: '3B' },
  
  { id: 'st-18', code: 'HS401', name: 'Trịnh Công Sơn', gender: 'Nam', classId: '4A' },
  { id: 'st-19', code: 'HS402', name: 'Nguyễn Thu Phương', gender: 'Nữ', classId: '4A' },
  { id: 'st-20', code: 'HS501', name: 'Đoàn Văn Hậu', gender: 'Nam', classId: '5A' },
  { id: 'st-21', code: 'HS502', name: 'Phạm Hải Yến', gender: 'Nữ', classId: '5A' },
];

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
  { id: 'u-1', name: 'Nguyễn Thanh Đồng', role: 'Quản trị viên', email: 'dong.nt@school.edu.vn', phone: '0987.654.321', username: 'dong.nt' },
  { id: 'u-2', name: 'Lê Hoài Nam', role: 'Giáo viên bộ môn', email: 'nam.lh@school.edu.vn', phone: '0912.345.678', username: 'nam.lh' },
  { id: 'u-3', name: 'Phạm Hồng Hạnh', role: 'Giáo viên bộ môn', email: 'hanh.ph@school.edu.vn', phone: '0905.112.233', username: 'hanh.ph' },
  { id: 'u-4', name: 'Vũ Minh Khôi', role: 'Giáo viên bộ môn', email: 'khoi.vm@school.edu.vn', phone: '0977.888.999', username: 'khoi.vm' },
];

const todayKey = new Date().toISOString().split('T')[0];

export const defaultAttendance: AttendanceData = {
  [todayKey]: {
    'Ba 1': {
      'st-1': 'present',
      'st-2': 'present',
      'st-3': 'excused',
      'st-4': 'present',
    }
  }
};

export const defaultEvaluation: EvaluationData = {
  [todayKey]: {
    'Ba 1': {
      'st-1': { rating: 5, comment: 'Thực hành nhanh nhẹn, hoàn thành tốt toàn bộ bài tập gõ phím nhanh.', tags: ['Thực hành tốt', 'Hăng hái'] },
      'st-2': { rating: 4, comment: 'Hoàn thành bài tập đúng hạn, chú ý nghe giảng.', tags: ['Thực hành tốt'] },
      'st-3': { rating: 3, comment: 'Còn nói chuyện riêng nhiều, chưa tập trung nghe hướng dẫn thực hành ghép nhóm.', tags: ['Chưa tập trung', 'Nói chuyện riêng'] },
    }
  }
};

export const defaultEmulation: EmulationDataState = {
  'st-1': { cumulativeStars: 22, exchangedStickers: 1, totalDeducted: 5, badges: ['Sticker Chăm Ngoan'] },
  'st-2': { cumulativeStars: 18, exchangedStickers: 0, totalDeducted: 0, badges: [] },
  'st-3': { cumulativeStars: 8, exchangedStickers: 0, totalDeducted: 0, badges: [] },
  'st-4': { cumulativeStars: 25, exchangedStickers: 2, totalDeducted: 10, badges: ['Sticker Siêu Nhân Tin Học'] },
  'st-5': { cumulativeStars: 14, exchangedStickers: 0, totalDeducted: 0, badges: [] },
};

export const defaultSeating: SeatingChart = {
  'Ba 1': {
    'comp-1': 'st-1',
    'comp-2': 'st-2',
    'comp-3': 'st-3',
    'comp-9': 'st-4',
    'comp-10': 'st-5',
    'comp-17': 'st-6',
    'comp-18': 'st-7',
    'comp-25': 'st-8',
    'comp-26': 'st-9',
    'comp-33': 'st-10',
    'comp-34': 'st-11',
    'comp-g1': 'st-12',
    'comp-g2': 'st-13',
  },
  '4A': {
    'comp-1': 'st-18',
    'comp-2': 'st-19',
  },
  '5A': {
    'comp-1': 'st-20',
    'comp-2': 'st-21',
  }
};
