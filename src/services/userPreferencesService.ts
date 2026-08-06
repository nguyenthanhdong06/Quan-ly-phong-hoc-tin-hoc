import { saveSupabaseState, supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Service for managing per-teacher personalized Menu hidden items on Supabase & LocalStorage
 */

export function getUserMenuKey(username?: string): string {
  const userKey = username ? username.toLowerCase().trim() : 'default_user';
  return `deskos_hidden_menu_${userKey}`;
}

/**
 * Load teacher-specific hidden menu items from LocalStorage and Supabase
 */
export async function loadUserHiddenMenuItems(username?: string): Promise<string[]> {
  const key = getUserMenuKey(username);

  // 1. Instant load from LocalStorage
  let localHidden: string[] = [];
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      localHidden = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to parse local user hidden menu items:', e);
  }

  // 2. Fetch latest from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('school_states')
        .select('value')
        .eq('key', key)
        .single();

      if (!error && data && Array.isArray(data.value)) {
        localStorage.setItem(key, JSON.stringify(data.value));
        return data.value;
      }
    } catch (err) {
      console.warn('Supabase fetch user menu config error:', err);
    }
  }

  return localHidden;
}

/**
 * Save teacher-specific hidden menu items to LocalStorage and Supabase
 */
export async function saveUserHiddenMenuItems(username: string | undefined, hiddenItemIds: string[]): Promise<boolean> {
  const key = getUserMenuKey(username);

  // 1. Instant local storage save
  try {
    localStorage.setItem(key, JSON.stringify(hiddenItemIds));
  } catch (e) {
    console.warn('Failed to save user hidden menu items to local storage:', e);
  }

  // Notify listeners for instant UI synchronization
  window.dispatchEvent(new CustomEvent('deskos_menu_config_changed'));

  // 2. Asynchronously sync to Supabase
  return await saveSupabaseState(key, hiddenItemIds);
}
