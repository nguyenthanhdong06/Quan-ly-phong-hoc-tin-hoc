import { createClient } from '@supabase/supabase-js';

// Access variables from import.meta.env with hardcoded fallbacks provided by the user
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://teslhzdwnbhrreyyvybe.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc2xoemR3bmJocnJleXl2eWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODU4MzMsImV4cCI6MjA5Njc2MTgzM30.7C_kMIAteGDhkljjK6lpbjIPHxZS_GWmVhzd6rJsjIY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isSupabaseOnline = true; // Track if Supabase is reachable

export const setSupabaseOnline = (online: boolean) => {
  isSupabaseOnline = online;
};

export const getSupabaseOnline = (): boolean => {
  return isSupabaseOnline;
};

// Helper check to see if Supabase config is available
export const isSupabaseConfigured = (): boolean => {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
};

// Generic interface for states stored in database
export interface SupabaseState {
  key: string;
  value: any;
  updated_at: string;
}

export const SQL_INITIALIZATION_QUERY = `-- CHẠY LỆNH NÀY TRONG SQL EDITOR CỦA SUPABASE:
-- 1. Tạo bảng lưu trữ trạng thái toàn bộ phần mềm phòng học Tin học
CREATE TABLE IF NOT EXISTS school_states (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Kích hoạt tính năng Row Level Security (RLS) bảo mật
ALTER TABLE school_states ENABLE ROW LEVEL SECURITY;

-- 3. Tạo chính sách RLS cho phép truy cập public đọc/ghi dữ liệu học tập
CREATE POLICY "Cho phép truy cập công khai Select" ON school_states FOR SELECT USING (true);
CREATE POLICY "Cho phép truy cập công khai Insert" ON school_states FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép truy cập công khai Update" ON school_states FOR UPDATE USING (true);
CREATE POLICY "Cho phép truy cập công khai Delete" ON school_states FOR DELETE USING (true);
`;

/**
 * Load all states from Supabase at once
 */
export async function loadAllSupabaseStates(): Promise<Record<string, any>> {
  if (!isSupabaseOnline) {
    console.info('Supabase client is currently offline. Skipping fetch.');
    return {};
  }
  try {
    const { data, error } = await supabase
      .from('school_states')
      .select('*');

    if (error) {
      console.warn('Supabase fetch error, using local storage/mock fallback:', error.message);
      return {};
    }

    isSupabaseOnline = true; // Successfully connected

    if (!data || data.length === 0) {
      return {};
    }

    const stateMap: Record<string, any> = {};
    data.forEach((row: any) => {
      stateMap[row.key] = row.value;
    });
    return stateMap;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn('Error in loadAllSupabaseStates:', errMsg);
    if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch') || errMsg.includes('NetworkError')) {
      isSupabaseOnline = false;
      console.warn('Supabase offline or unreachable. Background auto-sync is disabled to prevent user warnings.');
    }
    return {};
  }
}

/**
 * Save state key-value to Supabase
 */
export async function saveSupabaseState(key: string, value: any): Promise<boolean> {
  // Sync to localStorage first for instant client responsiveness
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  if (!isSupabaseOnline) {
    return false;
  }

  // Then save to Supabase database
  try {
    const { error } = await supabase
      .from('school_states')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) {
      console.warn(`Supabase upsert failed for key [${key}]:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn(`Error saving to Supabase for key [${key}]:`, errMsg);
    if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch') || errMsg.includes('NetworkError')) {
      isSupabaseOnline = false;
      console.warn('Supabase offline or unreachable. Background auto-sync is disabled to prevent user warnings.');
    }
    return false;
  }
}
