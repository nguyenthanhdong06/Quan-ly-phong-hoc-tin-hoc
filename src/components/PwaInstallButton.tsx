import React, { useEffect, useState } from 'react';
import { Download, MonitorCheck, Sparkles, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      if (isStandalone) {
        setIsInstalled(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 1-Click Native PWA Install Prompt
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If native prompt is not available yet, open guide modal & generate Windows .url shortcut
      setShowGuideModal(true);
    }
  };

  // Generate Windows .url Desktop Shortcut File for 1-Click Desktop Access
  const downloadWindowsUrlShortcut = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000/';
    const shortcutContent = `[InternetShortcut]\nURL=${currentUrl}\nIDList=\nHotKey=0\nIconIndex=0\nIconFile=C:\\Windows\\System32\\shell32.dll\n`;
    
    const blob = new Blob([shortcutContent], { type: 'application/x-mswinurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Phòng Học Tin Học.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold shadow-sm select-none">
        <MonitorCheck className="w-4 h-4 text-emerald-400" />
        <span>Đã Cài Đặt PWA Desktop App</span>
      </div>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleInstallClick}
        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 border border-indigo-300/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95 group"
        title="Tạo icon phím tắt ứng dụng ra màn hình Desktop Windows với 1 cú click"
      >
        <Download className="w-4 h-4 text-amber-300 group-hover:bounce" />
        <span>💻 CÀI APP RA DESKTOP WINDOWS (1-CLICK)</span>
        <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
      </motion.button>

      {/* Guide & Shortcut Modal Fallback */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-900 space-y-5 text-left relative"
            >
              <div className="flex justify-between items-center border-b border-[#cbb89d] pb-3">
                <h3 className="font-black text-base text-indigo-900 flex items-center gap-2">
                  <MonitorCheck className="w-5 h-5 text-indigo-600" />
                  CÀI ĐẶT SHORTCUT ỨNG DỤNG RA DESKTOP WINDOWS
                </h3>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center text-xs text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs font-medium text-slate-700">
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-indigo-950 block text-xs font-black">Cách 1: Tải File Shortcut Windows 1-Click (.url)</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Bấm nút bên dưới để tải ngay file phím tắt <strong>Phòng Học Tin Học.url</strong> về máy tính. Kéo file vừa tải ra màn hình Desktop Windows để double-click mở ứng dụng siêu tốc!
                    </p>
                    <button
                      onClick={downloadWindowsUrlShortcut}
                      className="mt-2.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-amber-300" />
                      Tải File Desktop Shortcut (.url) Ngay
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-950 block text-xs font-black">Cách 2: Cài Đặt Trực Tiếp Trên Trình Duyệt (Chrome / Edge)</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Nhấp vào biểu tượng <strong>"Cài đặt" / "Install" 💻</strong> trên thanh địa chỉ của trình duyệt Chrome hoặc Edge (góc trên bên phải), chọn <strong>Install</strong> để biến trang web thành ứng dụng Windows độc lập!
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Đã Hểu & Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
