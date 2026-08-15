/**
 * 1-Click Instant Desktop Shortcut & PWA Installer Utility
 * Downloads PhongMayTHLongDinh.url targeting https://phongmaythlongdinh.com/ immediately on click
 */

export function triggerInstantShortcutDownload(showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const TARGET_URL = 'https://phongmaythlongdinh.com/';

  // 1. Trigger PWA Native prompt if available
  if (typeof window !== 'undefined' && (window as any).deferredPwaInstallPrompt) {
    try {
      (window as any).deferredPwaInstallPrompt.prompt();
    } catch (e) {}
  }

  // 2. Automatically generate and download Windows Desktop .url shortcut file
  try {
    const urlContent = `[InternetShortcut]
URL=${TARGET_URL}
IconIndex=0
IconFile=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
HotKey=0
IDList=
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,1
`;
    const blob = new Blob([urlContent], { type: 'application/x-mswinurl' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'PhongMayTHLongDinh.url';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);

    if (showToast) {
      showToast('🚀 Đã tự động tải Lối Tắt Desktop (https://phongmaythlongdinh.com/) về máy thành công!', 'success');
    }
  } catch (err) {
    console.error('Failed to generate desktop shortcut:', err);
    if (showToast) {
      showToast('Không thể tạo lối tắt tự động: ' + String(err), 'error');
    }
  }
}
