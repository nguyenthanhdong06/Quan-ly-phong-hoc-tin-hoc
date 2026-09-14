import { TaskCategory, TaskPriority, TaskStatus } from './types';

// Khung giờ chuẩn các tiết học trường Tiểu học
export const PERIOD_TIMES: Record<string, { session: 'Sáng' | 'Chiều'; start: string; end: string }> = {
  '1': { session: 'Sáng', start: '07:30', end: '08:05' },
  '2': { session: 'Sáng', start: '08:15', end: '08:50' },
  '3': { session: 'Sáng', start: '09:20', end: '09:55' },
  '4': { session: 'Sáng', start: '10:05', end: '10:40' },
  '5': { session: 'Chiều', start: '13:30', end: '14:05' },
  '6': { session: 'Chiều', start: '14:15', end: '14:50' },
  '7': { session: 'Chiều', start: '15:00', end: '15:35' },
};

export const DAY_NAMES: Record<string, string> = {
  '2': 'Thứ Hai',
  '3': 'Thứ Ba',
  '4': 'Thứ Tư',
  '5': 'Thứ Năm',
  '6': 'Thứ Sáu',
};

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  'Chuẩn bị bài',
  'Soạn giáo án',
  'Chuẩn bị thiết bị',
  'Chuẩn bị tài liệu',
  'In tài liệu',
  'Kiểm tra bài',
  'Chấm bài',
  'Nhập điểm',
  'Nhận xét học sinh',
  'Công việc hành chính',
  'Khác',
];

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; bg: string; text: string; border: string; icon: string }> = {
  urgent: {
    label: 'Khẩn cấp',
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    border: 'border-rose-400',
    icon: '⚡',
  },
  high: {
    label: 'Ưu tiên cao',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-400',
    icon: '🚩',
  },
  medium: {
    label: 'Bình thường',
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-300',
    icon: '📌',
  },
  low: {
    label: 'Thấp',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: '☕',
  },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  todo: {
    label: 'Chưa làm',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  in_progress: {
    label: 'Đang làm',
    bg: 'bg-sky-50',
    text: 'text-sky-900',
    border: 'border-sky-300',
    dot: 'bg-sky-500',
  },
  completed: {
    label: 'Hoàn thành',
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
  overdue: {
    label: 'Quá hạn',
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-400',
    dot: 'bg-rose-500',
  },
  cancelled: {
    label: 'Đã hủy',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
};

// Mẫu công việc chuẩn bị bài 1-chạm theo bộ môn
export const INFORMATICS_TASK_TEMPLATES = [
  { title: 'Bật và kiểm tra phòng máy tính', category: 'Chuẩn bị thiết bị', priority: 'high' as TaskPriority },
  { title: 'Chuẩn bị file bài tập thực hành', category: 'Chuẩn bị bài', priority: 'medium' as TaskPriority },
  { title: 'In phiếu bài tập / phiếu thực hành', category: 'In tài liệu', priority: 'medium' as TaskPriority },
  { title: 'Kiểm tra chuột & bàn phím trước tiết', category: 'Chuẩn bị thiết bị', priority: 'high' as TaskPriority },
  { title: 'Soạn bài giảng trình chiếu PowerPoint', category: 'Soạn giáo án', priority: 'medium' as TaskPriority },
  { title: 'Chấm bài thực hành trên máy', category: 'Chấm bài', priority: 'medium' as TaskPriority },
];

export const GENERAL_TASK_TEMPLATES = [
  { title: 'Chuẩn bị giáo án và đồ dùng dạy học', category: 'Chuẩn bị bài', priority: 'high' as TaskPriority },
  { title: 'In phiếu học tập cho học sinh', category: 'In tài liệu', priority: 'medium' as TaskPriority },
  { title: 'Chấm và chữa bài tập về nhà', category: 'Chấm bài', priority: 'medium' as TaskPriority },
  { title: 'Nhập điểm và đánh giá thường xuyên', category: 'Nhập điểm', priority: 'medium' as TaskPriority },
  { title: 'Nhắc nhở học sinh cần phụ đạo', category: 'Nhận xét học sinh', priority: 'medium' as TaskPriority },
];
