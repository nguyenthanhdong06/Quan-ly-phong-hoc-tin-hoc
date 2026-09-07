import { Student } from '../types';

export interface ParsedName {
  surname: string;
  middle: string;
  first: string;
  middleAndFirst: string;
}

export function parseName(fullName: string): ParsedName {
  if (!fullName) return { surname: '', middle: '', first: '', middleAndFirst: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { surname: '', middle: '', first: parts[0], middleAndFirst: parts[0] };
  if (parts.length === 2) return { surname: parts[0], middle: '', first: parts[1], middleAndFirst: `${parts[0]} ${parts[1]}` };
  const surname = parts[0];
  const first = parts[parts.length - 1];
  const middle = parts.slice(1, parts.length - 1).join(' ');
  const middleAndFirst = parts.slice(-2).join(' ');
  return { surname, middle, first, middleAndFirst };
}

/**
 * Smart Vietnamese Student Name Formatter based on Class Context:
 * Rule 1: Unique middle + first name in class (e.g. 'Nguyễn Ngọc An') -> 'Ngọc An'
 * Rule 2: Same middle + first name, different surname (e.g. 'Nguyễn Ngọc An', 'Huỳnh Ngọc An') -> 'Ngọc An' and 'Huỳnh An'
 * Rule 3: Identical full name in class (e.g. 'Nguyễn Ngọc An', 'Nguyễn Ngọc An') -> 'Ngọc An A' and 'Ngọc An B'
 */
export function formatSmartStudentName(student: Student | null | undefined, classStudents: Student[] = []): string {
  if (!student || !student.name) return '';
  const currentTrimmed = student.name.trim();
  const currentParsed = parseName(currentTrimmed);

  // Filter valid students in class
  const sameClassStudents = classStudents.filter(s => s && s.name);

  // Rule 3 Check: Identical full names in the class
  const identicalFullNameStudents = sameClassStudents.filter(
    s => s.name.trim().toLowerCase() === currentTrimmed.toLowerCase()
  );

  if (identicalFullNameStudents.length > 1) {
    // Sort deterministically by code or id
    identicalFullNameStudents.sort((a, b) => (a.code || a.id || '').localeCompare(b.code || b.id || ''));
    const idx = identicalFullNameStudents.findIndex(s => s.id === student.id || s.code === student.code);
    const suffixLetter = String.fromCharCode(65 + (idx >= 0 ? idx : 0)); // A, B, C...
    const baseName = currentParsed.middleAndFirst || currentTrimmed;
    return `${baseName} ${suffixLetter}`;
  }

  // Rule 1 & Rule 2 Check: Same middleAndFirst ('Ngọc An')
  const sameMiddleAndFirst = sameClassStudents.filter(s => {
    const p = parseName(s.name);
    return p.middleAndFirst.toLowerCase() === currentParsed.middleAndFirst.toLowerCase();
  });

  // Rule 1: Unique middleAndFirst in class (e.g. 'Nguyễn Ngọc An' -> 'Ngọc An')
  if (sameMiddleAndFirst.length <= 1) {
    return currentParsed.middleAndFirst || currentTrimmed;
  }

  // Rule 2: Multiple students have same middleAndFirst ('Ngọc An'), but different surnames
  const surnameCounts: Record<string, number> = {};
  sameMiddleAndFirst.forEach(s => {
    const sur = parseName(s.name).surname.toLowerCase();
    surnameCounts[sur] = (surnameCounts[sur] || 0) + 1;
  });

  let primarySurname = parseName(sameMiddleAndFirst[0].name).surname.toLowerCase();
  let maxCount = 0;
  Object.keys(surnameCounts).forEach(sur => {
    if (surnameCounts[sur] > maxCount) {
      maxCount = surnameCounts[sur];
      primarySurname = sur;
    }
  });

  const mySurname = currentParsed.surname.toLowerCase();

  if (mySurname === primarySurname) {
    return currentParsed.middleAndFirst || currentTrimmed; // 'Ngọc An'
  } else {
    // Return Surname + FirstName e.g. 'Huỳnh An'
    return currentParsed.surname 
      ? `${currentParsed.surname} ${currentParsed.first}` 
      : (currentParsed.middleAndFirst || currentTrimmed);
  }
}

/**
 * Standardized Computer Naming Formatter:
 * Unifies all computer names across the application into a single standard format: "Máy 01", "Máy 02", "Máy 10"...
 */
export function formatComputerName(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === '') return 'Máy 01';
  const str = String(val).trim();

  // Extract digits from input (e.g. "1" -> 1, "01" -> 1, "M.01" -> 1, "Máy #1" -> 1, "Máy 1" -> 1, "Máy số 01" -> 1)
  const numMatch = str.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    const formattedNum = num < 10 ? `0${num}` : `${num}`;
    return `Máy ${formattedNum}`;
  }

  if (str.startsWith('Máy ')) return str;
  return `Máy ${str}`;
}

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu
 * Hỗ trợ cả 2 chuẩn Unicode: NFC (Dựng sẵn) và NFD (Tổ hợp)
 */
export function removeVietnameseTones(str: string | null | undefined): string {
  if (!str) return '';
  // 1. Chuẩn hóa về NFD để tách các ký tự dấu tổ hợp (Combining Diacritical Marks)
  let result = str.normalize('NFD');
  // 2. Xóa các ký tự dấu tổ hợp (dải Unicode \u0300 - \u036f)
  result = result.replace(/[\u0300-\u036f]/g, '');
  // 3. Thay thế các ký tự Đ / đ đặc thù của tiếng Việt
  result = result.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
  // 4. Chuẩn hóa lại về NFC
  return result.normalize('NFC');
}

/**
 * Chuẩn hóa chuỗi tiếng Việt:
 * - Chuẩn hóa NFC
 * - Chuyển chữ thường toLowerCase
 * - Bỏ khoảng trắng thừa ở 2 đầu và giữa chuỗi
 */
export function normalizeVietnameseString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * So khớp thông minh giữa chuỗi đích (target) và từ khóa tìm kiếm (query)
 * Hỗ trợ:
 * 1. Tìm chính xác có dấu (chuẩn hóa Unicode NFC/NFD)
 * 2. Tìm không dấu (gõ "phat" tìm ra "Phát")
 * 3. Tìm đa từ / từng token (gõ "nguyen phat" tìm ra "Nguyễn Tấn Phát")
 * 4. Tìm không phân biệt chữ hoa, chữ thường
 */
export function matchVietnameseSearch(
  target: string | null | undefined,
  query: string | null | undefined
): boolean {
  if (!query || !query.trim()) return true;
  if (!target || !target.trim()) return false;

  const normQuery = normalizeVietnameseString(query);
  const normTarget = normalizeVietnameseString(target);

  // 1. Chuỗi target chứa toàn bộ query (chuẩn hóa Unicode có dấu)
  if (normTarget.includes(normQuery)) return true;

  // 2. Chuỗi target không dấu chứa query không dấu
  const unaccentQuery = removeVietnameseTones(normQuery);
  const unaccentTarget = removeVietnameseTones(normTarget);
  if (unaccentTarget.includes(unaccentQuery)) return true;

  // 3. Token-based match (tất cả các từ trong query đều xuất hiện trong target)
  // Ví dụ query "Nguyen Phat" -> tokens: ["nguyen", "phat"]
  // Target: "Nguyễn Tấn Phát" -> unaccent tokens: ["nguyen", "tan", "phat"]
  const queryTokens = unaccentQuery.split(' ').filter(Boolean);
  if (queryTokens.length > 1) {
    const isAllTokensMatched = queryTokens.every(token => 
      unaccentTarget.includes(token) || normTarget.includes(token)
    );
    if (isAllTokensMatched) return true;
  }

  return false;
}

/**
 * Kiểm tra xem một học sinh có khớp với từ khóa tìm kiếm hay không
 * Tìm linh hoạt trên: Họ và tên, Mã học sinh (code), Chức vụ (duty), Ghi chú (notes), Lớp (classId)
 */
export function matchStudentSearch(
  student: { name: string; code?: string; duty?: string; notes?: string; classId?: string } | null | undefined,
  query: string | null | undefined
): boolean {
  if (!query || !query.trim()) return true;
  if (!student) return false;

  return (
    matchVietnameseSearch(student.name, query) ||
    matchVietnameseSearch(student.code, query) ||
    matchVietnameseSearch(student.duty, query) ||
    matchVietnameseSearch(student.classId, query) ||
    matchVietnameseSearch(student.notes, query)
  );
}

