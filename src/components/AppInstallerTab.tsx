import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Laptop, 
  Monitor, 
  School, 
  Zap, 
  Check, 
  Copy, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AppWindow,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { motion } from 'motion/react';

interface AppInstallerTabProps {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function AppInstallerTab({ showToast }: AppInstallerTabProps) {
  // Target URL fixed to https://phongmaythlongdinh.com/ as requested
  const TARGET_URL = 'https://phongmaythlongdinh.com/';
  const APP_TITLE = 'Quản Lý Phòng Học Tin Học - Trường TH Long Định';

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [selectedIconId, setSelectedIconId] = useState<'monitor' | 'school' | 'zap' | 'laptop'>('monitor');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Auto-detect PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      showToast('🎉 Cài đặt ứng dụng PWA lên Desktop thành công!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

  // Icon options matching the application title & domain
  const ICON_OPTIONS = [
    {
      id: 'monitor',
      title: 'Icon Máy Tính Phòng Lab 🖥️',
      desc: 'Phù hợp màn hình máy tính bàn phòng lab',
      icon: Monitor,
      previewSrc: '/chongoi3.png',
      badge: 'Khuyên dùng'
    },
    {
      id: 'school',
      title: 'Icon Trường TH Long Định 🏫',
      desc: 'Biểu tượng giáo dục trường học',
      icon: School,
      previewSrc: '/thehocsinhnam.webp',
      badge: 'Trường học'
    },
    {
      id: 'zap',
      title: 'Icon PWA Siêu Tốc ⚡',
      desc: 'Biểu tượng ứng dụng PWA ngoại tuyến',
      icon: Zap,
      previewSrc: '/thehocsinhnu.webp',
      badge: 'PWA Native'
    },
    {
      id: 'laptop',
      title: 'Icon Laptop Giáo Viên 💻',
      desc: 'Dành cho máy tính cá nhân giáo viên',
      icon: Laptop,
      previewSrc: '/buttondnmoi.webp',
      badge: 'Mượt 60FPS'
    }
  ];

  const activeIconObj = useMemo(() => {
    return ICON_OPTIONS.find(i => i.id === selectedIconId) || ICON_OPTIONS[0];
  }, [selectedIconId]);

  // 1-Click PWA Native Installation
  const handlePwaInstallClick = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('Đã chấp nhận cài đặt ứng dụng PWA!', 'success');
        }
        setInstallPrompt(null);
      } catch (err) {
        showToast('Lỗi khi kích hoạt cài đặt PWA', 'error');
      }
    } else {
      // Fallback: Create Windows .url Shortcut File directly targeting https://phongmaythlongdinh.com/
      handleCreateWindowsShortcut();
    }
  };

  // Create Windows Desktop Shortcut File (.url) targeting https://phongmaythlongdinh.com/
  const handleCreateWindowsShortcut = () => {
    const urlFileContent = `[InternetShortcut]
URL=${TARGET_URL}
IconIndex=0
IconFile=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
HotKey=0
IDList=
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,1
`;
    const blob = new Blob([urlFileContent], { type: 'application/x-mswinurl' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'PhongMayTHLongDinh.url';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    showToast(`Đã tạo tệp Lối Tắt Desktop (.url) hướng về ${TARGET_URL}!`, 'success');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(TARGET_URL);
    setCopiedUrl(true);
    showToast(`Đã sao chép đường dẫn ${TARGET_URL} thành công!`, 'success');
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  return (
    <div className="space-y-6 text-slate-800 pb-12 max-w-5xl mx-auto">
      
      {/* App Main Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-amber-200 text-xs font-black backdrop-blur-md border border-white/20">
              <AppWindow className="w-4 h-4 text-amber-300" />
              <span>ỨNG DỤNG CÀI ĐẶT PWA DESKTOP 1-CLICK</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
              Cài Đặt Lối Tắt Màn Hình Desktop Windows
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium leading-relaxed">
              Mở ứng dụng từ Icon Desktop mượt như ứng dụng native Windows, hoạt động 100% ngoại tuyến cả khi mất mạng Internet!
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePwaInstallClick}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black px-6 py-4 rounded-2xl shadow-2xl transition flex items-center justify-center gap-3 text-sm cursor-pointer border border-emerald-300 shrink-0"
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>TỰ ĐỘNG CÀI ĐẶT 1-CLICK</span>
          </motion.button>
        </div>
      </div>

      {/* URL Domain Info Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div className="text-left">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Đường Dẫn URL Trang Web Đã Đổi Tự Động
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đổi đường dẫn chạy thử <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">http://localhost:3000/</code> thành Tên miền chính thức:
            </p>
          </div>
          <button
            onClick={handleCopyUrl}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedUrl ? 'Đã sao chép' : 'Sao chép URL'}</span>
          </button>
        </div>

        <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-sm font-bold flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-500">URL:</span>
            <span className="text-amber-300 underline font-black">{TARGET_URL}</span>
          </div>
          <a 
            href={TARGET_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
            title="Mở liên kết trong tab mới"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Automatic Icon Selection Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="text-left border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Tự Động Chọn Icon Cho Shortcut Hợp Lý (Phù Hợp Tên)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hệ thống tự động đề xuất 4 bộ biểu tượng icon độ phân giải cao dành cho Desktop Windows:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {ICON_OPTIONS.map((opt) => {
            const isSelected = selectedIconId === opt.id;
            const IconComp = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  setSelectedIconId(opt.id as any);
                  showToast(`Đã chọn ${opt.title} làm biểu tượng shortcut!`, 'info');
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400/30' 
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="p-2.5 rounded-xl bg-white shadow-2xs border border-slate-100">
                    <IconComp className={`w-6 h-6 ${isSelected ? 'text-emerald-600' : 'text-slate-600'}`} />
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {opt.badge}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">{opt.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{opt.desc}</p>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã áp dụng Icon này</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Creation Alternative Card */}
      <div className="bg-amber-50/80 rounded-3xl p-6 border border-amber-200/80 space-y-3 text-left">
        <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-700" />
          HƯỚNG DẪN TẠO ICON DESKTOP TRÊN CHROME / EDGE (2 BƯỚC THỦ CÔNG):
        </h4>
        <ol className="text-xs text-amber-900/90 font-semibold space-y-2 list-decimal pl-5 leading-relaxed">
          <li>Trên trình duyệt Chrome/Edge, truy cập địa chỉ: <strong className="text-amber-950 underline">{TARGET_URL}</strong></li>
          <li>Nhấn vào <strong>Menu 3 chấm (Góc trên bên phải)</strong> ➔ Chọn <strong>Cài đặt ứng dụng này (Install App)</strong> hoặc <strong>Lưu & Chia sẻ ➔ Tạo lối tắt (Create Shortcut...)</strong> ➔ Đánh dấu chọn <strong>"Mở dưới dạng cửa sổ" (Open as window)</strong>.</li>
        </ol>
      </div>

    </div>
  );
}
