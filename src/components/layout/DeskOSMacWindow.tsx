import React, { useState } from 'react';
import { Minus, Square, X, Home, Users, School, ClipboardCheck, Star, Trophy, Monitor, Calendar, FolderOpen, Gamepad2, Settings, HelpCircle, Image as ImageIcon, FileText, Sprout, CalendarCheck } from 'lucide-react';
import { Grade, ClassItem } from '../../types';
import { playButtonClickSound } from '../../utils/audioEffects';

interface DeskOSMacWindowProps {
  activeTab: string;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  grades?: Grade[];
  selectedGrade?: number;
  setSelectedGrade?: (g: number) => void;
  filteredClasses?: ClassItem[];
  selectedClass?: string;
  setSelectedClass?: (c: string) => void;
  children: React.ReactNode;
}

const TAB_METADATA: Record<string, { label: string; icon: React.ElementType }> = {
  dashboard: { label: 'Tổng quan', icon: Home },
  students: { label: 'Quản lý Học sinh', icon: Users },
  'classes-management': { label: 'Quản lý Lớp học', icon: School },
  attendance: { label: 'Điểm danh Học sinh', icon: ClipboardCheck },
  evaluation: { label: 'Đánh giá Tiết học', icon: Star },
  emulation: { label: 'Thi đua Phòng máy', icon: Trophy },
  'knowledge-garden': { label: 'Khu Vườn Tri Thức', icon: Sprout },
  seating: { label: 'Sơ đồ Máy tính', icon: Monitor },
  'lab-room': { label: 'Phòng Lab', icon: Monitor },
  timetable: { label: 'Thời khóa biểu', icon: Calendar },
  'lab-booking': { label: 'Đăng ký & Quản lý Phòng máy', icon: CalendarCheck },
  resources: { label: 'Kho tài nguyên Giáo án', icon: FolderOpen },
  'personal-questions': { label: 'Kho câu hỏi AI', icon: HelpCircle },
  'avatar-gallery': { label: 'Kho avatar', icon: ImageIcon },
  'computer-report': { label: 'Báo cáo phòng máy', icon: FileText },
  'interactive-games': { label: 'Trò chơi Tương tác', icon: Gamepad2 },
  admin: { label: 'Quản trị Hệ thống', icon: Settings },
};

export const DeskOSMacWindow: React.FC<DeskOSMacWindowProps> = ({
  activeTab,
  onClose,
  onMinimize,
  isMinimized,
  grades,
  selectedGrade,
  setSelectedGrade,
  filteredClasses,
  selectedClass,
  setSelectedClass,
  children,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const currentTabInfo = TAB_METADATA[activeTab] || { label: 'Phòng Lab', icon: Monitor };
  const TabIcon = currentTabInfo.icon;

  if (isMinimized) return null;

  return (
    <div 
      className={`w-full mx-auto transition-all duration-300 h-[calc(100vh-68px)] max-h-[calc(100vh-68px)] flex flex-col overflow-hidden ${
        isMaximized 
          ? 'max-w-full px-1 py-0' 
          : 'max-w-7xl px-1 sm:px-2 py-0.5'
      }`}
    >
      <div className="bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-2xl shadow-[0_20px_50px_rgba(80,55,25,0.25)] overflow-hidden flex flex-col flex-1 transition-all duration-200">
        {/* macOS iMac Window Header Bar */}
        <div className="bg-gradient-to-r from-[#dfccb0] via-[#e8d9c2] to-[#dfccb0] px-3.5 py-2 border-b border-[#c8b598] flex flex-wrap items-center justify-between gap-2 select-none shrink-0">
          {/* Active App Tab Title Pill */}
          <div className="flex items-center gap-2 bg-[#f5e6ca] px-3 py-1 rounded-xl border border-[#d6c4a8] shadow-2xs">
            <TabIcon className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="font-extrabold text-xs text-[#42301c] tracking-tight">{currentTabInfo.label}</span>
          </div>

          {/* Integrated Grade & Class Selectors (Position #1 - Screenshot 2026-08-02 202051.png) */}
          <div className="flex items-center gap-2">
            {grades && selectedGrade !== undefined && setSelectedGrade && (
              <div className="bg-[#f5e6ca] rounded-xl px-2 py-0.5 flex items-center gap-1 border border-[#d6c4a8] shadow-inner">
                <span className="text-[10px] font-black text-[#806443] uppercase tracking-wider hidden sm:inline">Khối:</span>
                {grades.map(g => (
                  <button
                    key={g.id}
                    onClick={() => {
                      playButtonClickSound();
                      setSelectedGrade(g.id);
                    }}
                    className={`px-2 py-0.5 text-xs font-black rounded-lg transition-all ${
                      selectedGrade === g.id 
                        ? 'bg-amber-500 text-white shadow-sm border border-amber-600' 
                        : 'hover:bg-amber-100 text-[#5c4326]'
                    }`}
                  >
                    {g.id}
                  </button>
                ))}
              </div>
            )}

            {filteredClasses && selectedClass !== undefined && setSelectedClass && (
              <div className="bg-[#f5e6ca] rounded-xl px-2 py-0.5 flex items-center gap-1 border border-[#d6c4a8] shadow-inner">
                <span className="text-[10px] font-black text-[#806443] uppercase tracking-wider hidden sm:inline">Lớp:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    playButtonClickSound();
                    setSelectedClass(e.target.value);
                  }}
                  className="bg-transparent text-[#4a351e] font-black text-xs outline-none cursor-pointer pr-1"
                >
                  {filteredClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {filteredClasses.length === 0 && (
                    <option value="">Không có lớp</option>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Traffic Light Window Control Buttons (Red, Yellow, Green) */}
          <div className="flex items-center gap-2">
            {/* Minimize Button (Yellow) */}
            <button
              onClick={() => {
                playButtonClickSound();
                onMinimize();
              }}
              className="w-4 h-4 rounded-full bg-amber-400 hover:bg-amber-500 border border-amber-600/40 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs active:scale-95 group"
              title="Thu nhỏ ứng dụng xuống thanh Taskbar"
            >
              <Minus className="w-2.5 h-2.5 text-amber-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Maximize/Restore Button (Green) */}
            <button
              onClick={() => {
                playButtonClickSound();
                setIsMaximized(!isMaximized);
              }}
              className="w-4 h-4 rounded-full bg-emerald-500 hover:bg-emerald-600 border border-emerald-700/40 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs active:scale-95 group"
              title={isMaximized ? "Thu gọn cửa sổ" : "Phóng to cửa sổ"}
            >
              <Square className="w-2.5 h-2.5 text-emerald-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Close Button (Red) */}
            <button
              onClick={() => {
                playButtonClickSound();
                onClose();
              }}
              className="w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 border border-rose-700/40 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs active:scale-95 group"
              title="Đóng ứng dụng"
            >
              <X className="w-2.5 h-2.5 text-rose-950 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Window Content Body (Zero outer page scrollbar! Internal scrollbar ONLY inside iMac Window) */}
        <div className="p-3 sm:p-5 bg-[#faf5ec]/90 backdrop-blur-xs flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
