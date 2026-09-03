/**
 * 📚 CLASS SORTER UTILITY - TỰ ĐỘNG SẮP XẾP THỨ TỰ LỚP HỌC CHUẨN TỰ NHIÊN
 * Đảm bảo danh sách lớp luôn được sắp xếp từ bé đến lớn (ví dụ: Ba 1, Ba 2, Ba 3, Ba 4...)
 * dù người dùng tạo lớp trước hay sau, hỗ trợ cả chữ (Một, Hai, Ba...), số (3/1, 3/2),
 * ký tự mũ (3¹, 3²...) và số La Mã.
 */

const VIETNAMESE_GRADE_WORDS: Record<string, number> = {
  'một': 1, 'mot': 1, 'nhất': 1, 'nhat': 1,
  'hai': 2, 'nhì': 2, 'nhi': 2,
  'ba': 3, 'tam': 3,
  'bốn': 4, 'bon': 4, 'tư': 4, 'tu': 4,
  'năm': 5, 'nam': 5
};

/**
 * Chuẩn hóa tên lớp học để so sánh chính xác:
 * - Chuyển đổi các ký tự số mũ (⁰-¹-²-³-⁴-⁵-⁶-⁷-⁸-⁹) về số 0-9
 * - Loại bỏ khoảng trắng thừa
 */
export function normalizeClassName(str?: string): string {
  if (!str) return '';
  const s = str.trim();
  
  return s
    .replace(/[⁰]/g, '0')
    .replace(/[¹]/g, '1')
    .replace(/[²]/g, '2')
    .replace(/[³]/g, '3')
    .replace(/[⁴]/g, '4')
    .replace(/[⁵]/g, '5')
    .replace(/[⁶]/g, '6')
    .replace(/[⁷]/g, '7')
    .replace(/[⁸]/g, '8')
    .replace(/[⁹]/g, '9');
}

/**
 * Trích xuất thứ bậc khối từ tên lớp (nếu không có trường gradeId)
 */
export function extractClassGrade(str?: string): number | null {
  if (!str) return null;
  const normalized = normalizeClassName(str);
  const parts = normalized.split(/[\s./_-]+/);
  const firstWordLower = parts[0]?.toLowerCase();

  if (firstWordLower && VIETNAMESE_GRADE_WORDS[firstWordLower]) {
    return VIETNAMESE_GRADE_WORDS[firstWordLower];
  }

  const matchDigit = normalized.match(/^\d+/);
  if (matchDigit) {
    return parseInt(matchDigit[0], 10);
  }

  return null;
}

/**
 * Hàm so sánh 2 đối tượng lớp học theo thứ tự từ bé đến lớn
 */
export function compareClasses<T extends { id?: string; name?: string; gradeId?: number }>(a: T, b: T): number {
  // 1. So sánh theo Khối (gradeId) nếu có
  const gA = a.gradeId ?? extractClassGrade(a.name || a.id);
  const gB = b.gradeId ?? extractClassGrade(b.name || b.id);

  if (gA !== null && gB !== null && gA !== undefined && gB !== undefined && gA !== gB) {
    return gA - gB;
  }

  // 2. So sánh theo Tên lớp đã chuẩn hóa bằng phép so sánh số tự nhiên (numeric collation)
  const normA = normalizeClassName(a.name || a.id || '');
  const normB = normalizeClassName(b.name || b.id || '');

  return normA.localeCompare(normB, 'vi', { numeric: true, sensitivity: 'base' });
}

/**
 * Tự động sắp xếp mảng lớp học từ bé đến lớn
 */
export function sortClasses<T extends { id?: string; name?: string; gradeId?: number }>(classes: T[]): T[] {
  if (!Array.isArray(classes)) return [];
  return [...classes].sort(compareClasses);
}
