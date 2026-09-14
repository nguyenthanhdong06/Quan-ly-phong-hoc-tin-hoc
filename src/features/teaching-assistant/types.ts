export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export type TaskCategory = 
  | 'Chuẩn bị bài'
  | 'Soạn giáo án'
  | 'Chuẩn bị thiết bị'
  | 'Chuẩn bị tài liệu'
  | 'In tài liệu'
  | 'Kiểm tra bài'
  | 'Chấm bài'
  | 'Nhập điểm'
  | 'Nhận xét học sinh'
  | 'Công việc hành chính'
  | 'Khác'
  | string;

export interface TeachingTask {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  description?: string;
  gradeId?: number;
  classId?: string;
  subject?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  
  // Liên kết tuần học & TKB
  weekNumber?: number;
  plannedDate?: string;     // YYYY-MM-DD
  dueDate?: string;         // ISO String hoặc YYYY-MM-DD HH:mm
  scheduleDay?: string;     // '2' | '3' | '4' | '5' | '6'
  schedulePeriod?: string;  // '1' | '2' | '3' | '4' | '5' | '6' | '7'
  reminderBeforeMinutes?: number; // 15, 30, 60, 180, 1440
  
  // Công việc lặp lại
  isRecurring?: boolean;
  recurrenceType?: 'none' | 'daily' | 'weekly' | 'by_timetable';
  
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface TeachingQuickNote {
  id: string;
  workspaceId: string;
  userId: string;
  content: string;
  classId?: string;
  subject?: string;
  period?: string;
  noteDate: string;         // YYYY-MM-DD
  convertedTaskId?: string;
  createdAt: string;
}

export interface MatchedScheduleSlot {
  day: string;              // '2', '3', '4', '5', '6'
  period: string;           // '1' - '7'
  session: 'Sáng' | 'Chiều';
  startTime: string;        // '07:30'
  endTime: string;          // '08:05'
  className: string;
  subject: string;
}

export interface CurrentClassContext {
  isTeachingNow: boolean;
  day: string;
  period: string;
  className: string;
  subject: string;
  startTime: string;
  endTime: string;
  remainingMinutes: number;
}

export type AssistantActiveTab = 'today' | 'next_week' | 'all_tasks' | 'timeline';
