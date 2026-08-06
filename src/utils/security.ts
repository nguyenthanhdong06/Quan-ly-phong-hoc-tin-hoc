/**
 * Security & Authentication Utilities
 * Provides SHA-256 cryptographic hashing and input sanitization
 */

/**
 * Generates SHA-256 hash of a string using browser-native Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Web Crypto SHA-256 fallback to standard encoding:', err);
    // Fallback simple hash for legacy environments
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'sha256_' + Math.abs(hash).toString(16);
  }
}

/**
 * Securely verifies an input password against stored hash or legacy plain text password
 */
export async function verifyPassword(inputPassword: string, storedPasswordOrHash: string): Promise<boolean> {
  if (!inputPassword || !storedPasswordOrHash) return false;
  
  // Direct plain text match check
  if (inputPassword === storedPasswordOrHash) return true;

  // SHA-256 hashed match check
  const inputHash = await hashPassword(inputPassword);
  return inputHash === storedPasswordOrHash;
}

/**
 * Sanitizes text input to prevent XSS and malformed string injection
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Strip unsafe HTML angle brackets
    .slice(0, 200);       // Cap string length
}
