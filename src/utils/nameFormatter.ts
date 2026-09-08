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
/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu
 * Hỗ trợ toàn bộ chuẩn Unicode: NFC, NFD, mọi dải dấu tổ hợp, và ký tự Đ / đ
 */
export function removeVietnameseTones(str: string | null | undefined): string {
  if (!str) return '';
  // 1. Chuẩn hóa về NFD để tách các ký tự dấu tổ hợp (Combining Diacritical Marks)
  let result = str.normalize('NFD');
  // 2. Xóa các ký tự dấu tổ hợp (bao gồm dải Unicode \u0300 - \u036f, \u1dc0 - \u1dff, \u20d0 - \u20ff, \ufe20 - \ufe2f)
  result = result.replace(/[\u0300-\u036f\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g, '');
  // 3. Thay thế các ký tự Đ / đ đặc thù của tiếng Việt
  result = result.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
  // 4. Chuẩn hóa lại về NFC
  return result.normalize('NFC');
}

/**
 * Chuẩn hóa chuỗi tiếng Việt:
 * - Loại bỏ các ký tự ẩn zero-width (\u200B-\u200D), BOM (\uFEFF), soft hyphen (\u00AD)
 * - Chuẩn hóa tất cả các loại khoảng trắng Unicode (\u00A0, tab...) thành khoảng trắng đơn ' '
 * - Chuẩn hóa Unicode NFC
 * - Chuyển chữ thường toLowerCase và trim 2 đầu
 */
export function normalizeVietnameseString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    .replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g, ' ')
    .normalize('NFC')
    .toLowerCase()
    .trim();
}

/**
 * Chuyển đổi các ký tự phân cách (dấu gạch ngang, chấm, phẩy, ngoặc...) thành khoảng trắng
 */
export function cleanPunctuation(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/[-_.,;:()/[\]{}"'`~!?@#$%^&*+=<>|\\]/g, ' ');
}

/**
 * Lấy các chữ cái đầu tiên của từng từ (Viết tắt)
 * Ví dụ: "Nguyễn Tấn Phát" -> "ntp"
 */
export function getInitials(str: string | null | undefined): string {
  if (!str) return '';
  const cleaned = cleanPunctuation(normalizeVietnameseString(str));
  const unaccent = removeVietnameseTones(cleaned);
  const words = unaccent.split(' ').filter(Boolean);
  return words.map(w => w[0]).join('');
}

/**
 * Chuẩn hóa các biến thể tên lớp thường dùng tại trường học:
 * Ví dụ: "Ba 1" <-> "3/1", "3.1", "3 1", "3A1"
 */
export function getClassSearchVariants(classStr: string | null | undefined): string[] {
  if (!classStr) return [];
  const base = normalizeVietnameseString(classStr);
  const variants = new Set<string>([base, removeVietnameseTones(base)]);

  const numeric = base
    .replace(/\bba\b/g, '3')
    .replace(/\bbốn\b/g, '4')
    .replace(/\bnăm\b/g, '5')
    .replace(/\bmột\b/g, '1')
    .replace(/\bhai\b/g, '2');
  variants.add(numeric);
  variants.add(numeric.replace(/\s+/g, ''));
  variants.add(numeric.replace(/\s+/g, '/'));
  variants.add(numeric.replace(/\s+/g, '.'));
  variants.add(numeric.replace(/\s+/g, '-'));

  if (base.includes('/')) {
    variants.add(base.replace('/', ' '));
    variants.add(base.replace('/', '.'));
    variants.add(base.replace('/', '-'));
    variants.add(base.replace('/', ''));
  }

  return Array.from(variants).filter(Boolean);
}

/**
 * So khớp thông minh giữa chuỗi đích (target) và từ khóa tìm kiếm (query)
 * Hỗ trợ:
 * 1. Tìm chính xác có dấu (chuẩn hóa Unicode NFC/NFD)
 * 2. Tìm không dấu (gõ "phat" tìm ra "Phát", "duyen" tìm ra "Duyên")
 * 3. Tìm không dấu theo tiền tố từ (gõ "an" chỉ khớp học sinh tên "An", không ăn nhầm vào chữ "tấn" hay "đăng")
 * 4. Tìm đa từ không phân biệt thứ tự từ (gõ "nguyen phat" hay "phat nguyen" đều ra "Nguyễn Tấn Phát")
 * 5. Tìm theo viết tắt chữ cái đầu (gõ "ntp" ra "Nguyễn Tấn Phát")
 * 6. Tìm xuyên suốt ký tự phân cách (dấu gạch nối, dấu chấm, ngoặc đơn...)
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
  if (normTarget.includes(normQuery)) {
    const qWords = normQuery.split(' ').filter(Boolean);
    if (qWords.length === 1 && normQuery.length <= 2) {
      const tWords = normTarget.split(' ').filter(Boolean);
      if (tWords.some(w => w.startsWith(normQuery))) {
        return true;
      }
    } else {
      return true;
    }
  }

  // 2. Chuỗi target không dấu chứa query không dấu
  const unaccentQuery = removeVietnameseTones(normQuery);
  const unaccentTarget = removeVietnameseTones(normTarget);

  const cleanTarget = normalizeVietnameseString(cleanPunctuation(unaccentTarget));
  const cleanQuery = normalizeVietnameseString(cleanPunctuation(unaccentQuery));

  if (cleanTarget.includes(cleanQuery)) {
    // Với từ đơn ngắn (<= 3 ký tự), yêu cầu khớp tiền tố của một từ để tránh nhầm (vd "an" trong "tan")
    const qTokens = cleanQuery.split(' ').filter(Boolean);
    if (qTokens.length === 1 && cleanQuery.length <= 3) {
      const targetWords = cleanTarget.split(' ').filter(Boolean);
      if (targetWords.some(w => w.startsWith(cleanQuery))) {
        return true;
      }
    } else {
      return true;
    }
  }

  // 3. Token-based word prefix match (tất cả các từ trong query đều xuất hiện trong target)
  const queryTokens = cleanQuery.split(' ').filter(Boolean);
  const targetWords = cleanTarget.split(' ').filter(Boolean);

  if (queryTokens.length > 0) {
    const isAllTokensMatched = queryTokens.every(qToken => 
      targetWords.some(tWord => tWord.startsWith(qToken) || (qToken.length > 3 && tWord.includes(qToken)))
    );
    if (isAllTokensMatched) return true;
  }

  // 4. Initials match (viết tắt chữ cái đầu, ví dụ ntp -> Nguyễn Tấn Phát)
  if (cleanQuery.length >= 2) {
    const targetInitials = targetWords.map(w => w[0]).join('');
    if (targetInitials.includes(cleanQuery)) {
      return true;
    }
  }

  return false;
}

/**
 * Kiểm tra xem một học sinh có khớp với từ khóa tìm kiếm hay không
 * Tìm linh hoạt trên:
 * - Họ và tên đầy đủ
 * - Tên gọi thông minh theo lớp (Smart student name) hoặc Tên đệm + Tên
 * - Mã học sinh (MSHS)
 * - Chức vụ (Lớp trưởng, Tổ trưởng...)
 * - Ghi chú (Notes, Máy...)
 * - Lớp học và biến thể tên lớp (Ba 1, 3/1, 3.1...)
 * - Tìm kết hợp đa trường (Ví dụ: "Phát Ba 1", "An HS01", "Khoa 3/1")
 */
export function matchStudentSearch(
  student: {
    id?: string;
    name: string;
    code?: string;
    duty?: string;
    notes?: string;
    classId?: string;
    smartName?: string;
  } | null | undefined,
  query: string | null | undefined,
  classStudents?: Student[]
): boolean {
  if (!query || !query.trim()) return true;
  if (!student) return false;

  // 1. Tìm trên Họ và tên đầy đủ
  if (matchVietnameseSearch(student.name, query)) return true;

  // 2. Tìm trên Tên gọi ngắn gọn (Tên hoặc Tên đệm + Tên)
  const parsed = parseName(student.name);
  if (matchVietnameseSearch(parsed.first, query)) return true;
  if (matchVietnameseSearch(parsed.middleAndFirst, query)) return true;

  // 3. Tìm trên Smart Name nếu có
  if (student.smartName && matchVietnameseSearch(student.smartName, query)) return true;
  if (classStudents && classStudents.length > 0) {
    const smartFormatted = formatSmartStudentName(student as Student, classStudents);
    if (smartFormatted && matchVietnameseSearch(smartFormatted, query)) return true;
  }

  // 4. Tìm trên Mã học sinh (code / MSHS)
  if (student.code) {
    const codeStr = String(student.code).toLowerCase().trim();
    const qStr = query.toLowerCase().trim();
    if (codeStr.includes(qStr) || matchVietnameseSearch(codeStr, qStr)) return true;
  }

  // 5. Tìm trên Chức vụ (duty)
  if (student.duty && matchVietnameseSearch(student.duty, query)) return true;

  // 6. Tìm trên Ghi chú (notes)
  if (student.notes && matchVietnameseSearch(student.notes, query)) return true;

  // 7. Tìm trên Lớp học & biến thể (classId: Ba 1, 3/1, 3.1...)
  if (student.classId) {
    if (matchVietnameseSearch(student.classId, query)) return true;
    const classVariants = getClassSearchVariants(student.classId);
    if (classVariants.some(v => matchVietnameseSearch(v, query))) return true;
  }

  // 8. Tìm trên Profile tổng hợp (cho phép gõ kết hợp: "Phát Ba 1", "An HS01", "Khoa 3/1")
  const combinedProfile = [
    student.name,
    parsed.middleAndFirst,
    student.code,
    student.classId,
    ...(student.classId ? getClassSearchVariants(student.classId) : []),
    student.duty,
    student.notes
  ].filter(Boolean).join(' ');

  if (matchVietnameseSearch(combinedProfile, query)) return true;

  return false;
}


