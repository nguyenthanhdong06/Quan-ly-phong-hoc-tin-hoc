import React, { useEffect, useRef, useState } from 'react';
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
  LogOut,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  FileText,
  SlidersHorizontal,
  Sprout,
  CalendarCheck
} from 'lucide-react';
import { Member } from '../../types';
import { playButtonClickSound } from '../../utils/audioEffects';
import { DeskOSMenuConfigModal } from './DeskOSMenuConfigModal';
import { loadUserHiddenMenuItems, saveUserHiddenMenuItems } from '../../services/userPreferencesService';

interface DeskOSSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Member | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DeskOSSidebar: React.FC<DeskOSSidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isOpen,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUser?.role.includes('Admin');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const username = currentUser?.username || currentUser?.name || 'default_user';

  // Per-Teacher Personalized Hidden Menu Items state
  const [hiddenItemIds, setHiddenItemIds] = useState<string[]>([]);

  // Load teacher-specific menu preferences when user changes or component opens
  useEffect(() => {
    let isMounted = true;
    loadUserHiddenMenuItems(username).then((items) => {
      if (isMounted) {
        setHiddenItemIds(items);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [username, isOpen]);

  // Handle click outside to close menu (ignoring the start button and config modal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        menuRef.current && 
        !menuRef.current.contains(target) && 
        !target.closest('#start-menu-button') &&
        !target.closest('.fixed.inset-0')
      ) {
        if (isOpen && !isConfigModalOpen) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isConfigModalOpen, onClose]);

  if (!isOpen) return null;

  const allMenuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, color: 'bg-[#bae6fd] text-[#0369a1] border-[#7dd3fc]' },
    { id: 'students', label: 'Quản lý Học sinh', icon: Users, color: 'bg-[#bbf7d0] text-[#15803d] border-[#86efac]' },
    ...(isAdmin ? [{ id: 'classes-management', label: 'Quản lý Lớp học', icon: School, color: 'bg-[#fef08a] text-[#a16207] border-[#fde047]' }] : []),
    { id: 'attendance', label: 'Điểm danh Học sinh', icon: ClipboardCheck, color: 'bg-[#ddd6fe] text-[#6d28d9] border-[#c4b5fd]' },
    { id: 'evaluation', label: 'Đánh giá Tiết học', icon: Star, color: 'bg-[#fbcfe8] text-[#be185d] border-[#f472b6]' },
    { id: 'emulation', label: 'Thi đua Phòng máy', icon: Trophy, color: 'bg-[#fef08a] text-[#854d0e] border-[#fde047]' },
    { id: 'knowledge-garden', label: 'Khu Vườn Tri Thức', icon: Sprout, color: 'bg-[#dcfce7] text-[#15803d] border-[#86efac]' },
    { id: 'lab-room', label: 'Phòng Lab', icon: Monitor, color: 'bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]' },
    { id: 'timetable', label: 'Thời khóa biểu', icon: Calendar, color: 'bg-[#bfdbfe] text-[#1d4ed8] border-[#93c5fd]' },
    { id: 'lab-booking', label: 'Đăng ký Phòng máy', icon: CalendarCheck, color: 'bg-[#c7d2fe] text-[#3730a3] border-[#a5b4fc]' },
    { id: 'resources', label: 'Kho tài nguyên Giáo án', icon: FolderOpen, color: 'bg-[#fed7aa] text-[#c2410c] border-[#fdba74]' },
    { id: 'personal-questions', label: 'Kho câu hỏi', icon: HelpCircle, color: 'bg-[#a7f3d0] text-[#047857] border-[#6ee7b7]' },
    { id: 'avatar-gallery', label: 'Kho avatar', icon: ImageIcon, color: 'bg-[#fbcfe8] text-[#be185d] border-[#f472b6]' },
    { id: 'computer-report', label: 'Báo cáo phòng máy', icon: FileText, color: 'bg-[#a5f3fc] text-[#0891b2] border-[#67e8f9]' },
    { id: 'interactive-games', label: 'Trò chơi Tương tác', icon: Gamepad2, color: 'bg-[#e9d5ff] text-[#7e22ce] border-[#d8b4fe]' },
  ];

  if (isAdmin) {
    allMenuItems.push({ id: 'admin', label: 'Quản trị Hệ thống', icon: Settings, color: 'bg-[#e2e8f0] text-[#334155] border-[#cbd5e1]' });
  }

  // Filter visible items based on current teacher's preference
  const visibleMenuItems = allMenuItems.filter((item) => !hiddenItemIds.includes(item.id));

  const handleToggleItem = (id: string) => {
    let updated: string[];
    if (hiddenItemIds.includes(id)) {
      updated = hiddenItemIds.filter((hId) => hId !== id);
    } else {
      if (hiddenItemIds.length >= allMenuItems.length - 1) {
        return;
      }
      updated = [...hiddenItemIds, id];
    }
    setHiddenItemIds(updated);
    saveUserHiddenMenuItems(username, updated);
  };

  const handleResetDefault = () => {
    setHiddenItemIds([]);
    saveUserHiddenMenuItems(username, []);
  };

  const handleItemClick = (id: string) => {
    playButtonClickSound();
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      <div 
        ref={menuRef}
        className="fixed bottom-14 left-4 z-50 w-72 sm:w-80 bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-2xl shadow-[0_20px_50px_rgba(80,55,25,0.35)] overflow-hidden select-none animate-in fade-in slide-in-from-bottom-3 duration-200"
      >
        {/* Start Menu Header with Config Button & Teacher Name */}
        <div className="bg-gradient-to-r from-[#d9c4a5] via-[#e4d1b3] to-[#ebdcc4] px-3.5 py-2 border-b border-[#c8b598] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5.5 h-5.5 rounded-lg bg-amber-500/20 border border-amber-600/30 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-900" />
            </div>
            <div>
              <h3 className="font-black text-[#42301c] text-xs uppercase tracking-wider">Phòng Tin Học OS</h3>
            </div>
          </div>

          <button
            onClick={() => {
              playButtonClickSound();
              setIsConfigModalOpen(true);
            }}
            className={`btn-plain flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border transition-colors cursor-pointer ${
              hiddenItemIds.length > 0
                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                : 'bg-amber-200/90 hover:bg-amber-300 text-amber-900 border-amber-300'
            }`}
            title={`Tùy chỉnh Menu cá nhân của ${username} (Đang ẩn ${hiddenItemIds.length} mục)`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Tùy chỉnh</span>
            {hiddenItemIds.length > 0 && (
              <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white/60 shadow-2xs animate-pulse">
                {hiddenItemIds.length}
              </span>
            )}
          </button>
        </div>

        {/* Menu Content (1-Column Vertical List) */}
        <div className="p-1.5 bg-white/80 backdrop-blur-xs flex flex-col gap-0.5">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`btn-plain w-full !flex !items-center !justify-between px-2.5 py-1 rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer !shadow-none ${
                  isActive
                    ? '!bg-amber-500 !text-white border border-amber-600 font-black translate-x-1'
                    : '!text-[#5c4326] !bg-white/70 hover:!bg-white hover:!text-black border border-[#e4d5bf]'
                }`}
              >
                {/* Left-aligned Icon & Text */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center border shrink-0 ${
                    isActive ? 'bg-white/20 text-white border-transparent' : item.color
                  }`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="whitespace-normal line-clamp-2 leading-tight text-left font-extrabold text-[11px] sm:text-xs tracking-tight">
                    {item.label}
                  </span>
                </div>

                {/* Right Arrow Indicator */}
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isActive ? 'text-white translate-x-0.5' : 'text-[#a38767] opacity-60'
                }`} />
              </button>
            );
          })}

          {visibleMenuItems.length === 0 && (
            <div className="p-4 text-center text-xs font-bold text-slate-500">
              Chưa có chức năng nào được chọn hiển thị.
            </div>
          )}

          {/* Separator */}
          <div className="my-0.5 border-t border-[#dfccb0]" />

          {/* User Info & Logout Footer - Match Media Screenshot 100% */}
          <div className="flex items-center justify-between bg-[#f5e6ca] border border-[#d6c4a8] px-3 py-1.5 rounded-full shadow-2xs">
            <div className="flex items-center gap-2 truncate pr-1">
              <div className="w-7 h-7 rounded-full bg-amber-400 border border-amber-500 flex items-center justify-center font-black text-xs text-[#42301c] shrink-0 shadow-2xs">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="truncate">
                <p className="font-black text-xs text-[#42301c] truncate leading-snug">{currentUser?.name || 'Giáo viên'}</p>
                <p className="text-[11px] font-bold text-[#806443] truncate leading-tight mt-0.5">
                  {(currentUser?.role?.includes('Quản trị hệ thống') || currentUser?.role === 'Admin' || currentUser?.id === 'u-1') 
                    ? 'Quản trị hệ thống (Admin)' 
                    : (currentUser?.role || 'Giáo viên bộ môn')}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playButtonClickSound();
                onLogout();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-full font-black text-xs text-white bg-gradient-to-b from-[#e54d4d] to-[#c92a2a] hover:from-[#f05555] hover:to-[#d63030] border border-[#a81c1c] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.2)] transition-all cursor-pointer shrink-0 active:scale-95 active:translate-y-0.5 select-none"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Configuration Modal */}
      {isConfigModalOpen && (
        <DeskOSMenuConfigModal
          allMenuItems={allMenuItems}
          hiddenItemIds={hiddenItemIds}
          onToggleItem={handleToggleItem}
          onResetDefault={handleResetDefault}
          onClose={() => setIsConfigModalOpen(false)}
        />
      )}
    </>
  );
};
