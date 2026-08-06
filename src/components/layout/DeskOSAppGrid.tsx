import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
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
  GripVertical,
  Image as ImageIcon,
  FileText,
  Sprout,
  CalendarCheck
} from 'lucide-react';
import { Member } from '../../types';
import { playAppLaunchSound } from '../../utils/audioEffects';
import { loadUserHiddenMenuItems } from '../../services/userPreferencesService';
import { WallpaperOption } from './DeskOSWallpaperSelector';

interface AppItem {
  id: string;
  label: string;
  icon: React.ElementType;
  bg: string;
  text: string;
  requiresTeacherRole?: boolean;
  requiresLoggedIn?: boolean;
  requiresAdmin?: boolean;
}

interface DeskOSAppGridProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Member | null;
  activeWallpaper?: WallpaperOption;
}

const ALL_POSSIBLE_APPS: AppItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, bg: 'bg-[#bae6fd]', text: 'text-[#0369a1]' },
  { id: 'students', label: 'Học sinh', icon: Users, bg: 'bg-[#bbf7d0]', text: 'text-[#15803d]', requiresTeacherRole: true },
  { id: 'classes-management', label: 'Lớp học', icon: School, bg: 'bg-[#fef08a]', text: 'text-[#a16207]', requiresTeacherRole: true },
  { id: 'attendance', label: 'Điểm danh', icon: ClipboardCheck, bg: 'bg-[#ddd6fe]', text: 'text-[#6d28d9]', requiresTeacherRole: true },
  { id: 'evaluation', label: 'Đánh giá', icon: Star, bg: 'bg-[#fbcfe8]', text: 'text-[#be185d]', requiresTeacherRole: true },
  { id: 'emulation', label: 'Thi đua', icon: Trophy, bg: 'bg-[#fef08a]', text: 'text-[#854d0e]', requiresTeacherRole: true },
  { id: 'knowledge-garden', label: 'Vườn tri thức', icon: Sprout, bg: 'bg-[#dcfce7]', text: 'text-[#15803d]' },
  { id: 'seating', label: 'Sơ đồ máy', icon: Monitor, bg: 'bg-[#ccfbf1]', text: 'text-[#0f766e]', requiresTeacherRole: true },
  { id: 'timetable', label: 'Thời khóa biểu', icon: Calendar, bg: 'bg-[#bfdbfe]', text: 'text-[#1d4ed8]', requiresTeacherRole: true },
  { id: 'lab-booking', label: 'Đăng ký phòng máy', icon: CalendarCheck, bg: 'bg-[#c7d2fe]', text: 'text-[#3730a3]', requiresTeacherRole: true },
  { id: 'resources', label: 'Kho tài nguyên', icon: FolderOpen, bg: 'bg-[#fed7aa]', text: 'text-[#c2410c]' },
  { id: 'personal-questions', label: 'Kho câu hỏi', icon: HelpCircle, bg: 'bg-[#a7f3d0]', text: 'text-[#047857]', requiresTeacherRole: true },
  { id: 'avatar-gallery', label: 'Kho avatar', icon: ImageIcon, bg: 'bg-[#fbcfe8]', text: 'text-[#be185d]', requiresTeacherRole: true },
  { id: 'computer-report', label: 'Báo cáo máy', icon: FileText, bg: 'bg-[#a5f3fc]', text: 'text-[#0891b2]', requiresLoggedIn: true },
  { id: 'interactive-games', label: 'Trò chơi', icon: Gamepad2, bg: 'bg-[#e9d5ff]', text: 'text-[#7e22ce]', requiresTeacherRole: true },
  { id: 'admin', label: 'Quản trị', icon: Settings, bg: 'bg-[#e2e8f0]', text: 'text-[#334155]', requiresAdmin: true },
];

export const DeskOSAppGrid: React.FC<DeskOSAppGridProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  activeWallpaper,
}) => {
  const isAdmin = currentUser?.role.includes('Admin');
  const hasTeacherOrAdminAccess = isAdmin || currentUser?.role.includes('Giáo viên') || currentUser?.role.includes('BGH');
  const username = currentUser?.username || currentUser?.name || 'default_user';

  const [apps, setApps] = useState<AppItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Synchronize available apps with Teacher's Role & Hidden Menu items preference
  const refreshAppsList = useCallback(async () => {
    const hiddenIds = await loadUserHiddenMenuItems(username);

    const availableApps = ALL_POSSIBLE_APPS.filter((app) => {
      if (app.requiresAdmin && !isAdmin) return false;
      if (app.requiresTeacherRole && !hasTeacherOrAdminAccess) return false;
      if (app.requiresLoggedIn && !currentUser) return false;
      // Synchronized Hiding: Hide icon from main desktop grid if hidden in menu config!
      if (hiddenIds.includes(app.id)) return false;
      return true;
    });

    try {
      const savedOrderStr = localStorage.getItem('deskos_app_order');
      if (savedOrderStr) {
        const savedIds: string[] = JSON.parse(savedOrderStr);
        const ordered: AppItem[] = [];
        savedIds.forEach((id) => {
          const found = availableApps.find((a) => a.id === id);
          if (found) ordered.push(found);
        });

        // Append any newly available apps not in saved order
        availableApps.forEach((a) => {
          if (!ordered.some((item) => item.id === a.id)) {
            ordered.push(a);
          }
        });
        setApps(ordered);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse saved app order:', e);
    }

    setApps(availableApps);
  }, [currentUser, username, isAdmin, hasTeacherOrAdminAccess]);

  useEffect(() => {
    refreshAppsList();

    // Listen for custom menu config changes
    const handleConfigChange = () => {
      refreshAppsList();
    };

    window.addEventListener('deskos_menu_config_changed', handleConfigChange);
    return () => {
      window.removeEventListener('deskos_menu_config_changed', handleConfigChange);
    };
  }, [refreshAppsList]);

  const saveAppOrder = (newApps: AppItem[]) => {
    setApps(newApps);
    try {
      const ids = newApps.map((a) => a.id);
      localStorage.setItem('deskos_app_order', JSON.stringify(ids));
    } catch (e) {
      console.warn('Failed to save app order:', e);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newApps = [...apps];
    const draggedItem = newApps[draggedIndex];
    newApps.splice(draggedIndex, 1);
    newApps.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    saveAppOrder(newApps);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAppClick = (id: string) => {
    playAppLaunchSound();
    setActiveTab(id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-2 select-none animate-fadeIn">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 justify-items-center">
        {apps.map((app, index) => {
          const Icon = app.icon;
          const isActive = activeTab === app.id;
          const isDragging = draggedIndex === index;

          return (
            <div
              key={app.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleAppClick(app.id)}
              className={`group flex flex-col items-center gap-1.5 p-1 rounded-2xl transition-all duration-200 cursor-grab active:cursor-grabbing relative ${
                isDragging ? 'opacity-40 scale-95' : 'hover:scale-105 active:scale-95'
              }`}
              title="Kéo thả để sắp xếp lại vị trí ứng dụng"
            >
              {/* Drag Handle Indicator */}
              <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-60 transition-opacity text-[#6b5133]">
                <GripVertical className="w-3 h-3" />
              </div>

              {/* Pastel App Icon Container */}
              <div 
                className={`w-13 h-13 sm:w-15 sm:h-15 rounded-2xl flex items-center justify-center shadow-[0_6px_15px_rgba(0,0,0,0.07)] border border-white/60 transition-transform duration-200 group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] ${
                  app.bg || 'bg-slate-200'
                } ${isActive ? 'ring-4 ring-amber-400 ring-offset-2' : ''}`}
              >
                <Icon className={`w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 ${app.text}`} />
              </div>

              {/* App Label with Adaptive Text Color */}
              <span className={`font-extrabold text-[11px] sm:text-xs tracking-tight text-center max-w-[95px] truncate leading-none transition-colors ${
                activeWallpaper?.appLabelTextColor || 'text-[#4a351e]'
              }`}>
                {app.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
