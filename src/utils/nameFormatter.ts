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
