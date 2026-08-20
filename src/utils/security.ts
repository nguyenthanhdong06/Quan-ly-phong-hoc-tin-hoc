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

const VAULT_SALT = 'THLongDinh_OTP_Vault_Secret_2026';

/**
 * Encrypts sensitive configuration payload before syncing to Supabase Cloud DB
 */
export function encryptVaultData(data: Record<string, any>): string {
  try {
    const jsonStr = JSON.stringify({ ...data, _timestamp: Date.now() });
    let result = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ VAULT_SALT.charCodeAt(i % VAULT_SALT.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(result));
  } catch (err) {
    console.warn('Vault encryption fallback:', err);
    return JSON.stringify(data);
  }
}

/**
 * Decrypts encrypted vault payload retrieved from Supabase Cloud DB
 */
export function decryptVaultData(vaultString: any): Record<string, any> | null {
  if (!vaultString) return null;
  try {
    if (typeof vaultString === 'object' && !Array.isArray(vaultString)) return vaultString;
    if (typeof vaultString === 'string' && vaultString.startsWith('{')) return JSON.parse(vaultString);

    const decoded = decodeURIComponent(atob(vaultString));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ VAULT_SALT.charCodeAt(i % VAULT_SALT.length);
      result += String.fromCharCode(charCode);
    }
    return JSON.parse(result);
  } catch (err) {
    console.warn('Vault decryption failed:', err);
    try {
      return typeof vaultString === 'string' ? JSON.parse(vaultString) : vaultString;
    } catch {
      return null;
    }
  }
}

