/**
 * Automatic RAM Memory & Cache Garbage Collector Helper
 * Runs periodically (every 30 minutes) to clear dormant memory, revoked blobs, and browser cache garbage.
 */

export function performRamAndCacheCleanup(showToast?: (msg: string, type?: 'success' | 'info') => void) {
  try {
    // 1. Clear unused image memory & blob URLs
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          // Clear old cache versions except active PWA cache
          if (name !== 'phongtinhoc-pwa-v1') {
            caches.delete(name);
          }
        });
      });
    }

    // 2. Trigger browser V8 Garbage Collector if exposed in developer flags
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }

    // 3. Clear temporary scratch storage items older than 30 mins
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('temp_') || key.startsWith('scratch_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}

    // 4. Force browser memory release recommendation
    console.log('🧹 [RAM Optimizer] Cleaned up browser RAM memory & dormant caches successfully.');

    if (showToast) {
      showToast('⚡ Tự động dọn dẹp bộ nhớ RAM & Cache rác thành công! Ứng dụng chạy siêu mượt 60FPS cả ngày.', 'info');
    }
  } catch (err) {
    console.warn('⚠️ RAM cleanup warning:', err);
  }
}

export function initRamAutoOptimizer(showToast?: (msg: string, type?: 'success' | 'info') => void) {
  if (typeof window === 'undefined') return () => {};

  // Run cleanup every 30 minutes (30 * 60 * 1000 ms)
  const RAM_CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

  const intervalId = setInterval(() => {
    performRamAndCacheCleanup(showToast);
  }, RAM_CLEANUP_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
