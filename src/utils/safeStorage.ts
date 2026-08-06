/**
 * Utility for safe localStorage access with QuotaExceededError protection and automatic cleanup.
 */

export function safeSetLocalStorage(key: string, value: any): boolean {
  try {
    const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, jsonStr);
    return true;
  } catch (err: any) {
    console.warn(`[safeSetLocalStorage] Failed to save key "${key}":`, err);

    // Handle quota exceeded error gracefully
    if (
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014
    ) {
      try {
        // Fallback strategy 1: If saving students, strip huge base64 avatars (>50KB) for localStorage
        if (key === 'school_students' && Array.isArray(value)) {
          const lightweightStudents = value.map((student: any) => {
            if (student.avatarUrl && typeof student.avatarUrl === 'string' && student.avatarUrl.length > 50000) {
              return { ...student, avatarUrl: undefined };
            }
            return student;
          });
          localStorage.setItem(key, JSON.stringify(lightweightStudents));
          console.info('[safeSetLocalStorage] Saved lightweight version of school_students to avoid QuotaExceededError.');
          return true;
        }

        // Fallback strategy 2: Try clearing non-essential cache items
        const nonEssentialKeys = ['custom_avatars_list', 'vongQuayQuizData', 'school_quotes'];
        for (const k of nonEssentialKeys) {
          if (k !== key) {
            try {
              localStorage.removeItem(k);
            } catch {
              // ignore
            }
          }
        }

        // Try setting value again
        const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, jsonStr);
        return true;
      } catch (fallbackErr) {
        console.error(`[safeSetLocalStorage] Quota full, unable to write "${key}" to localStorage. State remains in React memory & Supabase.`, fallbackErr);
        return false;
      }
    }
    return false;
  }
}

export function safeGetLocalStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val);
  } catch (err) {
    console.warn(`[safeGetLocalStorage] Error reading key "${key}":`, err);
    return fallback;
  }
}
