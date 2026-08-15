/**
 * PWA Service Worker Registration & Offline-First Connectivity Listener
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('⚡ PWA Service Worker Registered Successfully! Scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('⚠️ PWA Service Worker Registration failed:', err);
        });
    });
  }
}

export function subscribeNetworkStatus(onStatusChange: (isOnline: boolean) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
