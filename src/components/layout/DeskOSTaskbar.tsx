import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Clock, 
  Image as ImageIcon, 
  Home, 
  Users, 
  School, 
  ClipboardCheck, 
  Star, 
  Trophy, 
  Monitor, 
  Calendar, 
  FolderOpen, 
  Gamepad2, 
  Settings, 
  HelpCircle, 
  FileText,
  Volume2,
  VolumeX,
  Sprout,
  CalendarCheck
} from 'lucide-react';
import { playButtonClickSound, isAudioMuted, toggleAudioMute } from '../../utils/audioEffects';
import { WallpaperOption } from './DeskOSWallpaperSelector';

interface DeskOSTaskbarProps {
  activeTab: string;
  openTabs: string[];
  minimizedTabs: string[];
  onMinimizeApp: (tabId: string) => void;
  onRestoreApp: (tabId: string) => void;
  onOpenWallpaper: () => void;
  onToggleStartMenu: () => void;
  isStartMenuOpen: boolean;
  activeWallpaper?: WallpaperOption;
}

const APP_ICONS: Record<string, { label: string; icon: React.ElementType }> = {
  dashboard: { label: 'Tổng quan', icon: Home },
  students: { label: 'Học sinh', icon: Users },
  'classes-management': { label: 'Lớp học', icon: School },
  attendance: { label: 'Điểm danh', icon: ClipboardCheck },
  evaluation: { label: 'Đánh giá', icon: Star },
  emulation: { label: 'Thi đua', icon: Trophy },
  'knowledge-garden': { label: 'Vườn tri thức', icon: Sprout },
  'lab-room': { label: 'Phòng Lab', icon: Monitor },
  timetable: { label: 'Thời khóa biểu', icon: Calendar },
  'lab-booking': { label: 'Đăng ký phòng máy', icon: CalendarCheck },
  resources: { label: 'Kho tài nguyên', icon: FolderOpen },
  'personal-questions': { label: 'Kho câu hỏi', icon: HelpCircle },
  'avatar-gallery': { label: 'Kho avatar', icon: ImageIcon },
  'computer-report': { label: 'Báo cáo máy', icon: FileText },
  'interactive-games': { label: 'Trò chơi', icon: Gamepad2 },
  admin: { label: 'Quản trị', icon: Settings },
};

export const DeskOSTaskbar: React.FC<DeskOSTaskbarProps> = ({
  activeTab,
  openTabs,
  minimizedTabs,
  onMinimizeApp,
  onRestoreApp,
  onOpenWallpaper,
  onToggleStartMenu,
  isStartMenuOpen,
  activeWallpaper,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [muted, setMuted] = useState(isAudioMuted());

  // Realtime clock and formatted Vietnamese date (Chủ nhật,02/08/2026.)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const dayName = days[now.getDay()];
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();

      const timeFormatted = now.toLocaleTimeString('vi-VN', { hour12: false });
      const dateFormatted = `${dayName},${dd}/${mm}/${yyyy}.`;

      setTimeStr(timeFormatted);
      setDateStr(dateFormatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const newMute = toggleAudioMute();
    setMuted(newMute);
    if (!newMute) {
      playButtonClickSound();
    }
  };

  return (
    <footer className={`fixed bottom-0 left-0 right-0 w-full z-40 backdrop-blur-2xl px-4 py-1.5 border-t border-white/40 shadow-[0_-8px_32px_rgba(0,0,0,0.15)] flex items-center justify-between select-none transition-all ${
      activeWallpaper?.isDark ? 'bg-slate-950/40 text-slate-100' : 'bg-white/20 text-[#42301c]'
    }`}>
      {/* macOS Dock Container (Left & Open Apps Items) */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar max-w-[65vw] py-1">
        {/* Left Start Button ('Phòng Tin Học') - Uniform Pill Button Styling */}
        <button
          id="start-menu-button"
          onClick={() => {
            playButtonClickSound();
            onToggleStartMenu();
          }}
          className={`h-9 px-3.5 rounded-full border shadow-sm flex items-center gap-2 font-black text-xs cursor-pointer transition-all active:scale-95 shrink-0 ${
            isStartMenuOpen
              ? 'bg-[#3b6f6a] text-white border-2 border-amber-400 shadow-md'
              : 'bg-[#599e98] hover:bg-[#4d8b85] text-white border border-[#3e736e]'
          }`}
          title="Bấm để ẩn/hiện Bảng Menu chính Phòng Tin Học"
        >
          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Laptop className="w-3 h-3 text-white" />
          </div>
          <span className="whitespace-nowrap">Phòng Tin Học</span>
        </button>

        {/* Multi-Window Open App Dock Buttons - Uniform Pill Button Styling */}
        {openTabs.map((tabId) => {
          const appInfo = APP_ICONS[tabId] || { label: tabId, icon: Home };
          const ActiveIcon = appInfo.icon;
          const isCurrentActive = activeTab === tabId;
          const isMinimized = minimizedTabs.includes(tabId);

          return (
            <button
              key={tabId}
              onClick={() => {
                playButtonClickSound();
                if (isCurrentActive) {
                  onMinimizeApp(tabId);
                } else {
                  onRestoreApp(tabId);
                }
              }}
              className={`h-9 px-3.5 rounded-full font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                isCurrentActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-2 border-amber-300 shadow-md backdrop-blur-md'
                  : isMinimized
                    ? activeWallpaper?.isDark
                      ? 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/60 border border-slate-700/50 backdrop-blur-md opacity-75'
                      : 'bg-white/35 hover:bg-white/60 text-[#42301c] border border-white/40 backdrop-blur-md opacity-75'
                    : activeWallpaper?.isDark
                      ? 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 border border-slate-600/50 backdrop-blur-md'
                      : 'bg-white/45 hover:bg-white/70 text-[#42301c] border border-white/50 backdrop-blur-md'
              }`}
              title={isCurrentActive ? `Thu nhỏ ${appInfo.label} về Màn hình chính` : `Mở cửa sổ ${appInfo.label}`}
            >
              <ActiveIcon className="w-4 h-4 shrink-0" />
              <span className="max-w-[120px] truncate whitespace-nowrap">{appInfo.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Taskbar Section: Audio Mute Toggle, Wallpaper Picker & Clock/Date */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Audio Mute / Unmute Toggle Button */}
        <button
          onClick={handleToggleMute}
          className={`h-9 px-3 rounded-full border shadow-xs backdrop-blur-md flex items-center gap-1.5 font-black text-xs cursor-pointer transition-all active:scale-95 ${
            muted
              ? 'bg-rose-500/80 hover:bg-rose-600/90 text-white border-rose-600 ring-1 ring-rose-400'
              : activeWallpaper?.isDark
                ? 'bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-100 border-emerald-600/50'
                : 'bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-900 border-emerald-500/30'
          }`}
          title={muted ? 'Âm thanh khen thưởng đang TẮT (Nhấp để Bật)' : 'Âm thanh khen thưởng đang BẬT (Nhấp để Tắt giữ trật tự)'}
        >
          {muted ? (
            <>
              <VolumeX className="w-4 h-4 text-white shrink-0 animate-pulse" />
              <span className="hidden md:inline whitespace-nowrap">Tắt âm</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">Bật âm</span>
            </>
          )}
        </button>

        {/* Wallpaper Picker Trigger - Uniform Pill Button Styling */}
        <button
          onClick={() => {
            playButtonClickSound();
            onOpenWallpaper();
          }}
          className={`h-9 px-3.5 rounded-full border shadow-xs backdrop-blur-md flex items-center gap-1.5 font-black text-xs cursor-pointer transition-all active:scale-95 ${
            activeWallpaper?.isDark
              ? 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-100 border-slate-600/50'
              : 'bg-white/35 hover:bg-white/60 text-[#42301c] border-white/40'
          }`}
          title="Đổi hình nền DeskOS"
        >
          <ImageIcon className={`w-4 h-4 shrink-0 ${activeWallpaper?.isDark ? 'text-amber-300' : 'text-amber-800'}`} />
          <span className="hidden sm:inline whitespace-nowrap">Hình nền</span>
        </button>

        {/* Borderless Stacked Vertical Clock & Date Column */}
        <div className="flex flex-col items-end justify-center font-mono leading-tight px-1 transition-colors">
          {/* Top Line: Digital Time */}
          <div className={`flex items-center gap-1 font-black text-xs transition-colors ${
            activeWallpaper?.clockTextColor || 'text-[#382613]'
          }`}>
            <Clock className={`w-3.5 h-3.5 shrink-0 ${activeWallpaper?.isDark ? 'text-amber-300' : 'text-amber-800'}`} />
            <span>{timeStr || '19:55:08'}</span>
          </div>
          {/* Bottom Line: Formatted Date (Chủ nhật,02/08/2026.) */}
          <div className={`text-[10px] font-bold transition-colors ${
            activeWallpaper?.dateTextColor || 'text-[#5c4326]'
          }`}>
            {dateStr || 'Chủ nhật,02/08/2026.'}
          </div>
        </div>
      </div>
    </footer>
  );
};
