import React from 'react';
import { Image, Check, X } from 'lucide-react';
import { playButtonClickSound } from '../../utils/audioEffects';

export interface WallpaperOption {
  id: string;
  name: string;
  className: string;
  previewBg: string;
  isDark?: boolean;
  appLabelTextColor: string;
  clockTextColor: string;
  dateTextColor: string;
  taskbarBtnClass?: string;
}

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  {
    id: 'vintage-cream',
    name: 'Gỗ Be Vintage',
    className: 'bg-[#f5e6ca]',
    previewBg: 'bg-[#f5e6ca]',
    isDark: false,
    appLabelTextColor: 'text-[#4a351e]',
    clockTextColor: 'text-[#382613]',
    dateTextColor: 'text-[#5c4326]'
  },
  {
    id: 'nordic-slate',
    name: 'Xanh Đá Xám',
    className: 'bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-slate-100',
    previewBg: 'bg-gradient-to-r from-slate-800 to-teal-900',
    isDark: true,
    appLabelTextColor: 'text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]',
    clockTextColor: 'text-cyan-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]',
    dateTextColor: 'text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]',
    taskbarBtnClass: 'bg-slate-800/60 text-slate-100 border-slate-600/50'
  },
  {
    id: 'sakura-bloom',
    name: 'Hoa Đào Pastel',
    className: 'bg-gradient-to-br from-pink-100 via-rose-100 to-purple-200',
    previewBg: 'bg-gradient-to-r from-pink-200 to-purple-300',
    isDark: false,
    appLabelTextColor: 'text-[#4a2334]',
    clockTextColor: 'text-[#4a1d2f]',
    dateTextColor: 'text-[#7a3b53]'
  },
  {
    id: 'cyberpunk-neon',
    name: 'Đêm Dạ Quang',
    className: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-purple-100',
    previewBg: 'bg-gradient-to-r from-indigo-900 to-purple-900',
    isDark: true,
    appLabelTextColor: 'text-purple-100 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]',
    clockTextColor: 'text-fuchsia-200 drop-shadow-[0_0_8px_rgba(232,121,249,0.9)]',
    dateTextColor: 'text-purple-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]',
    taskbarBtnClass: 'bg-purple-950/60 text-purple-100 border-purple-700/50'
  },
  {
    id: 'oak-wood',
    name: 'Gỗ Sồi Ấm Áp',
    className: 'bg-[#e2ceb1]',
    previewBg: 'bg-[#d2be9f]',
    isDark: false,
    appLabelTextColor: 'text-[#3b230d]',
    clockTextColor: 'text-[#38200a]',
    dateTextColor: 'text-[#5c3c1b]'
  },
  {
    id: 'ocean-breeze',
    name: 'Biển Sâu Thuần Khiết',
    className: 'bg-gradient-to-br from-sky-900 via-cyan-950 to-blue-950 text-cyan-100',
    previewBg: 'bg-gradient-to-r from-sky-800 to-cyan-900',
    isDark: true,
    appLabelTextColor: 'text-cyan-50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]',
    clockTextColor: 'text-cyan-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]',
    dateTextColor: 'text-cyan-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]',
    taskbarBtnClass: 'bg-cyan-950/60 text-cyan-100 border-cyan-700/50'
  }
];

interface DeskOSWallpaperSelectorProps {
  currentWallpaperId: string;
  onSelectWallpaper: (id: string) => void;
  onClose: () => void;
}

export const DeskOSWallpaperSelector: React.FC<DeskOSWallpaperSelectorProps> = ({
  currentWallpaperId,
  onSelectWallpaper,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-[#ebdcc4] border border-[#d6c4a8] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#dfccb0] px-4 py-3 border-b border-[#c8b598] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-[#6e5334]" />
            <span className="font-extrabold text-sm text-[#5c4326]">Chọn Hình Nền DeskOS</span>
          </div>
          <button
            onClick={() => {
              playButtonClickSound();
              onClose();
            }}
            className="text-[#806443] hover:text-[#42301c] p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallpaper Grid */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white/70 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {WALLPAPER_OPTIONS.map((wp) => {
            const isSelected = currentWallpaperId === wp.id;

            return (
              <button
                key={wp.id}
                onClick={() => {
                  playButtonClickSound();
                  onSelectWallpaper(wp.id);
                }}
                className={`group flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/80 shadow-md ring-2 ring-amber-400'
                    : 'border-slate-200 bg-white/80 hover:border-amber-400 hover:shadow-xs'
                }`}
              >
                <div className={`w-full h-20 rounded-lg ${wp.previewBg} border border-black/10 flex items-center justify-center relative overflow-hidden shadow-inner`}>
                  {isSelected && (
                    <div className="bg-amber-500 text-white p-1 rounded-full shadow-md">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <span className="font-bold text-xs text-[#5c4326] mt-2 group-hover:text-black">
                  {wp.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Action */}
        <div className="bg-[#dfccb0] px-4 py-2.5 border-t border-[#c8b598] text-right">
          <button
            onClick={() => {
              playButtonClickSound();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#6e5334] hover:bg-[#564027] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
