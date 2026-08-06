/**
 * Module Quản Lý Đăng Nhập Đa Thiết Bị (Multi-Device Control)
 * Tự động phát hiện và xử lý khi tài khoản được đăng nhập ở thiết bị/trình duyệt khác.
 */

const LOCAL_SESSION_KEY = 'ccm_active_session_id';

export interface MultiDeviceSessionState {
  username: string;
  sessionId: string;
  loginTime: string;
  deviceInfo?: string;
}

// Tạo mã Session ngẫu nhiên duy nhất cho phiên làm việc
export function createSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Lưu Session ID của thiết bị hiện tại vào LocalStorage
export function setLocalSession(sessionId: string): void {
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, sessionId);
  } catch (err) {
    console.error('Lỗi khi lưu Session ID:', err);
  }
}

// Lấy Session ID từ LocalStorage
export function getLocalSession(): string | null {
  try {
    return localStorage.getItem(LOCAL_SESSION_KEY);
  } catch (err) {
    return null;
  }
}

// Xóa Session ID khi đăng xuất
export function clearLocalSession(): void {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch (err) {
    console.error('Lỗi khi xóa Session ID:', err);
  }
}

// Lấy thông tin thiết bị cơ bản của người dùng
export function getDeviceInfo(): string {
  if (typeof window === 'undefined' || !window.navigator) return 'Thiết bị Web';
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Máy tính Windows';
  if (ua.includes('Macintosh')) return 'Máy tính Mac';
  if (ua.includes('Android')) return 'Điện thoại Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'Thiết bị iOS';
  return 'Trình duyệt Web';
}
