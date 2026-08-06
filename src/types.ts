export interface Grade {
  id: number;
  name: string;
}

export interface ClassItem {
  id: string; // Tương đương tên lớp hoặc mã định danh lớp unique
  name: string;
  gradeId: number;
  teacher: string;
}

export interface Student {
  id: string;
  code: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  classId: string;
  notes?: string;
  avatarUrl?: string;
}

export interface Computer {
  id: string;
  name: string;
  status: 'Hoạt động' | 'Đang hỏng' | 'Bảo trì';
  isMerged: boolean;
  num: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: string; // 'KHGD' | 'Bài giảng' ...
  fileUrl: string;
  author: string;
  date: string;
  size: string;
  description?: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  removedFromMyDocs?: boolean;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  username: string;
  activeSessionId?: string;
}

// Cấu trúc điểm danh chi tiết theo ngày: { [dateKey]: { [classId]: { [studentId]: status } } }
export interface AttendanceData {
  [dateKey: string]: {
    [classId: string]: {
      [studentId: string]: 'present' | 'excused' | 'unexcused';
    };
  };
}

// Cấu trúc nhận xét chi tiết theo ngày: { [dateKey]: { [classId]: { [studentId]: { rating, comment, tags } } } }
export interface EvaluationRecord {
  rating: number;
  comment: string;
  tags: string[];
}

export interface EvaluationData {
  [dateKey: string]: {
    [classId: string]: {
      [studentId: string]: EvaluationRecord;
    };
  };
}

// Cấu trúc tích lũy thi đua học sinh: { [studentId]: { cumulativeStars, exchangedStickers, totalDeducted, badges } }
export interface EmulationStateItem {
  cumulativeStars: number;
  exchangedStickers: number;
  totalDeducted: number;
  badges: string[];
}

export interface EmulationDataState {
  [studentId: string]: EmulationStateItem;
}

// Sơ đồ chỗ ngồi của lớp: { [classId]: { [computerId]: studentId } }
export interface SeatingChart {
  [classId: string]: {
    [computerId: string]: string;
  };
}

// Cấu trúc phân công Thời khóa biểu giáo viên: { [usernameOrId]: { [dayPeriodKey]: { subject, className } } }
export interface TimetableCell {
  subject: string;
  className: string;
}

export interface TimetableData {
  [teacherIdOrUsername: string]: {
    [dayPeriodKey: string]: TimetableCell;
  };
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author: string;
  isActive: boolean;
}

export interface TeacherTodo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  category: 'teaching' | 'setup' | 'maintenance' | 'other';
}

export interface Question {
  id: string;
  title: string;
  options: string[];
  correctIndex: number; // 0 to 3
  explanation?: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  gradeId: number;
  category: string;
  authorId: string;
  subjectId?: string;
}

export interface AppTheme {
  id: string;
  name: string;
  primary: string;
  dark: string;
  medium: string;
  light: string;
  textMuted: string;
  dotColor: string;
}

export const THEMES: AppTheme[] = [
  {
    id: 'slate-teal',
    name: 'Xanh Đá',
    primary: '#528285',
    dark: '#3d6264',
    medium: '#457073',
    light: '#5d9194',
    textMuted: '#cfe6e7',
    dotColor: '#5a9497'
  },
  {
    id: 'crimson-red',
    name: 'Đỏ Hồng',
    primary: '#be123c',
    dark: '#881337',
    medium: '#9f1239',
    light: '#e11d48',
    textMuted: '#fecdd3',
    dotColor: '#f43f5e'
  },
  {
    id: 'deep-violet',
    name: 'Tím Đậm',
    primary: '#6d28d9',
    dark: '#4c1d95',
    medium: '#5b21b6',
    light: '#7c3aed',
    textMuted: '#ddd6fe',
    dotColor: '#8b5cf6'
  },
  {
    id: 'classic-[#381DFC]',
    name: 'Hoàng Gia',
    primary: '#381DFC',
    dark: '#2410a8',
    medium: '#2e15d4',
    light: '#513afc',
    textMuted: '#d5d0ff',
    dotColor: '#381DFC'
  }
];

// Cấu trúc dữ liệu Khu Vườn Tri Thức (Knowledge Garden)
export interface WaterLog {
  id: string;
  date: string;
  amount: number;
  reason: string;
}

export interface GardenReward {
  id: string;
  icon: string;
  title: string;
  cost: number;
  type: 'WATER' | 'HARVEST';
}

export interface GardenStudentData {
  studentId: string;
  seed: string;
  water: number;
  badges: string[];
  logs: WaterLog[];
}

export interface GardenDataState {
  [studentId: string]: GardenStudentData;
}




