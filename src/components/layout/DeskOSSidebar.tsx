import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Users,
  Layers,
  Award,
  Sparkles,
  ClipboardCheck,
  Tv,
  Calendar,
  Grid,
  Gamepad2,
  FolderLock,
  LogOut,
  ChevronRight,
  SlidersHorizontal,
  Sprout,
  CalendarCheck,
  ArrowLeftRight
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
  activeWorkspaceOwnerName?: string;
  onOpenWorkspaceSwitcher?: () => void;
}

export const DeskOSSidebar: React.FC<DeskOSSidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isOpen,
  onClose,
  activeWorkspaceOwnerName,
  onOpenWorkspaceSwitcher,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUser?.role.includes('Admin');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const username = currentUser?.username || currentUser?.name || 'default_user';

  // State for user's hidden items loaded from Supabase / localStorage
  const [hiddenItemIds, setHiddenItemIds] = useState<string[]>([]);

  // Load hidden menu items when user changes or modal opens
  useEffect(() => {
    loadUserHiddenMenuItems(username).then((loaded) => {
      setHiddenItemIds(loaded);
    });

    const handleConfigChange = () => {
      loadUserHiddenMenuItems(username).then((loaded) => {
        setHiddenItemIds(loaded);
      });
    };

    window.addEventListener('deskos_menu_config_changed', handleConfigChange);
    return () => window.removeEventListener('deskos_menu_config_changed', handleConfigChange);
  }, [username]);

  const allMenuItems = [
    { id: 'dashboard', label: 'Bàn Làm Việc Tổng Quan', icon: Home, color: 'text-amber-700 bg-amber-100 border-amber-300' },
    { id: 'attendance', label: 'Sổ Điểm Danh Lớp Học', icon: ClipboardCheck, color: 'text-emerald-700 bg-emerald-100 border-emerald-300' },
    { id: 'evaluation', label: 'Đánh Giá & Nhận Xét', icon: Award, color: 'text-rose-700 bg-rose-100 border-rose-300' },
    { id: 'knowledge-garden', label: 'Khu Vườn Tri Thức', icon: Sprout, color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
    { id: 'emulation', label: 'Bảng Vàng Thi Đua', icon: Sparkles, color: 'text-yellow-800 bg-yellow-100 border-yellow-300' },
    { id: 'lab-room', label: 'Sơ Đồ Phòng Máy', icon: Tv, color: 'text-cyan-800 bg-cyan-100 border-cyan-300' },
    { id: 'timetable', label: 'Lịch Báo Giảng & TKB', icon: Calendar, color: 'text-purple-700 bg-purple-100 border-purple-300' },
    { id: 'lab-booking', label: 'Đăng Ký Mượn Phòng', icon: CalendarCheck, color: 'text-teal-700 bg-teal-100 border-teal-300' },
    { id: 'classes-management', label: 'Danh Sách Lớp Học', icon: Layers, color: 'text-indigo-700 bg-indigo-100 border-indigo-300' },
    { id: 'students', label: 'Hồ Sơ Học Sinh', icon: Users, color: 'text-blue-700 bg-blue-100 border-blue-300' },
    { id: 'interactive-games', label: 'Trò Chơi Tương Tác', icon: Gamepad2, color: 'text-orange-700 bg-orange-100 border-orange-300' },
    { id: 'avatar-gallery', label: 'Kho Ảnh Đại Diện', icon: Grid, color: 'text-pink-700 bg-pink-100 border-pink-300' },
    ...(isAdmin ? [{ id: 'admin', label: 'Quản Trị Hệ Thống', icon: FolderLock, color: 'text-amber-800 bg-amber-200 border-amber-400' }] : [])
  ];

  const visibleMenuItems = allMenuItems.filter(item => !hiddenItemIds.includes(item.id));

  // Toggle item visibility
  const handleToggleItem = async (id: string) => {
    let nextHidden: string[];
    if (hiddenItemIds.includes(id)) {
      nextHidden = hiddenItemIds.filter(i => i !== id);
    } else {
      nextHidden = [...hiddenItemIds, id];
    }
    setHiddenItemIds(nextHidden);
    await saveUserHiddenMenuItems(username, nextHidden);
  };

  // Reset to default
  const handleResetDefault = async () => {
    setHiddenItemIds([]);
    await saveUserHiddenMenuItems(username, []);
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close (Desktop/Mobile)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('#deskos-start-btn')
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="fixed bottom-14 left-2 sm:left-4 z-50 w-[300px] sm:w-[330px] bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-2xl shadow-[0_15px_35px_rgba(70,45,15,0.3)] overflow-hidden animate-in slide-in-from-bottom-5 duration-200 select-none text-[#42301c]"
        style={{
          fontFamily: "'Nunito', 'Segoe UI', sans-serif"
        }}
      >
        {/* Top Header Strip - Warm Caramel */}
        <div className="bg-[#dfccb0] px-4 py-2.5 border-b border-[#c8b598] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600 shadow-2xs" />
            <span className="font-black text-xs text-[#5c4326] tracking-wide">
              Tin Học OS - Ứng Dụng
            </span>
          </div>

          <button
            onClick={() => {
              playButtonClickSound();
              setIsConfigModalOpen(true);
            }}
            className="p-1 rounded-lg hover:bg-black/5 text-[#6e5334] transition-colors cursor-pointer"
            title="Tùy chỉnh danh sách ứng dụng hiển thị"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Menu Apps List */}
        <div className="p-2 space-y-1 max-h-[62vh] overflow-y-auto custom-scrollbar">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  playButtonClickSound();
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer group active:scale-98 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm font-black'
                    : 'hover:bg-white/60 text-[#42301c]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
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

          {/* 🏢 User Workspace Indicator in Sidebar */}
          {activeWorkspaceOwnerName && (
            <div className="flex items-center justify-between bg-[#fffbf0] border border-[#d6c4a8] px-3 py-1 rounded-xl text-[10.5px] font-black text-[#5c4326]">
              <div className="flex items-center gap-1.5 truncate">
                <Home className="w-3 h-3 text-emerald-700 shrink-0" />
                <span className="truncate">Không gian: <span className="text-emerald-800 font-extrabold">{activeWorkspaceOwnerName}</span></span>
              </div>
              {isAdmin && onOpenWorkspaceSwitcher && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenWorkspaceSwitcher();
                    onClose();
                  }}
                  className="ml-1 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[9px] font-black cursor-pointer shadow-2xs flex items-center gap-0.5"
                  title="Chuyển đổi không gian làm việc"
                >
                  <ArrowLeftRight className="w-2 h-2" />
                  <span>Đổi</span>
                </button>
              )}
            </div>
          )}

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
              style={{
                background: 'linear-gradient(180deg, #ff3535 0%, #dc2626 50%, #991b1b 100%)',
                borderColor: '#7f1d1d',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 3px 6px rgba(220, 38, 38, 0.4)'
              }}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-full font-black text-xs text-white border transition-all cursor-pointer shrink-0 active:scale-95 active:translate-y-0.5 select-none drop-shadow-xs hover:brightness-110"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5 drop-shadow-xs" />
              <span className="drop-shadow-xs">Thoát</span>
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
