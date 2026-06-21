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

