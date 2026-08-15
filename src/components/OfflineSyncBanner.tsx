import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeNetworkStatus } from '../utils/pwaRegister';

interface OfflineSyncBannerProps {
  onOnlineRestored?: () => void;
}

export default function OfflineSyncBanner({ onOnlineRestored }: OfflineSyncBannerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus((online) => {
      setIsOnline(online);
      if (online) {
        setJustRestored(true);
        if (onOnlineRestored) onOnlineRestored();
        const timer = setTimeout(() => setJustRestored(false), 5000);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, [onOnlineRestored]);

  if (isOnline && !justRestored) return null;

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-amber-600 via-amber-500 to-rose-600 text-white py-2 px-4 shadow-lg text-xs font-black flex items-center justify-between gap-3 border-b border-amber-400/40 relative z-50"
        >
          <div className="flex items-center gap-2 max-w-4xl mx-auto text-left">
            <span className="p-1 rounded-lg bg-white/20 shrink-0 animate-pulse">
              <WifiOff className="w-4 h-4 text-white" />
            </span>
            <div>
              <p className="font-black text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                ⚡ ĐANG Ở CHẾ ĐỘ NGOẠI TUYẾN (OFFLINE-FIRST PWA)
                <span className="bg-white/20 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">0ms Local Sync</span>
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium opacity-95 text-amber-100">
                Phòng máy đang mất kết nối Internet. Mọi thao tác Điểm danh, Xếp chỗ & Đánh giá đều hoạt động 100% bình thường trên máy tính này!
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 text-[10px] bg-black/20 px-2.5 py-1 rounded-xl shrink-0 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>An tâm dữ liệu</span>
          </div>
        </motion.div>
      )}

      {isOnline && justRestored && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 px-4 shadow-lg text-xs font-black flex items-center justify-between gap-3 border-b border-emerald-400/40 relative z-50"
        >
          <div className="flex items-center gap-2 max-w-4xl mx-auto text-left">
            <span className="p-1 rounded-lg bg-white/20 shrink-0">
              <Wifi className="w-4 h-4 text-emerald-200" />
            </span>
            <div>
              <p className="font-black text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                🟢 ĐÃ KHÔI PHỤC KẾT NỐI INTERNET!
                <span className="bg-white/20 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Đã đồng bộ Cloud</span>
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium opacity-95 text-emerald-100">
                Hệ thống tự động đẩy toàn bộ bản ghi Điểm danh & Xếp chỗ ngoại tuyến lên Supabase Cloud an toàn tuyệt đối.
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 text-[10px] bg-black/20 px-2.5 py-1 rounded-xl shrink-0 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Hoàn tất sync</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
