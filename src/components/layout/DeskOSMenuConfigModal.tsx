import React from 'react';
import { SlidersHorizontal, Eye, EyeOff, RotateCcw, X, Check } from 'lucide-react';
import { playButtonClickSound } from '../../utils/audioEffects';

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface DeskOSMenuConfigModalProps {
  allMenuItems: MenuItemConfig[];
  hiddenItemIds: string[];
  onToggleItem: (id: string) => void;
  onResetDefault: () => void;
  onClose: () => void;
}

export const DeskOSMenuConfigModal: React.FC<DeskOSMenuConfigModalProps> = ({
  allMenuItems,
  hiddenItemIds,
  onToggleItem,
  onResetDefault,
  onClose,
}) => {
  const visibleCount = allMenuItems.length - hiddenItemIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-fadeIn">
      <div className="w-full max-w-md bg-[#ebdcc4] border-2 border-[#d6c4a8] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#dfccb0] px-4 py-3 border-b border-[#c8b598] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#6e5334]" />
            <div>
              <h3 className="font-extrabold text-sm text-[#5c4326]">Tùy Chỉnh Ẩn/Hiện Menu</h3>
              <p className="text-[10px] font-bold text-[#806443]">Đang hiển thị {visibleCount}/{allMenuItems.length} chức năng</p>
            </div>
          </div>
          <button
            onClick={() => {
              playButtonClickSound();
              onClose();
            }}
            className="btn-raw text-[#806443] hover:text-[#42301c] p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items Toggle List */}
        <div className="p-3 bg-white/80 space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {allMenuItems.map((item) => {
            const Icon = item.icon;
            const isHidden = hiddenItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  playButtonClickSound();
                  onToggleItem(item.id);
                }}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                  isHidden
                    ? 'bg-slate-100/70 border-slate-200 opacity-60 hover:opacity-80'
                    : 'bg-white border-[#e4d5bf] shadow-2xs hover:border-amber-400'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center border shrink-0 ${
                    isHidden ? 'bg-slate-200 text-slate-400 border-slate-300' : item.color
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`font-bold text-xs truncate ${isHidden ? 'text-slate-500 line-through' : 'text-[#42301c]'}`}>
                    {item.label}
                  </span>
                </div>

                {/* Toggle Eye Switch */}
                <button
                  type="button"
                  className={`btn-plain p-1 rounded-lg border transition-colors ${
                    isHidden
                      ? '!bg-slate-200 !text-slate-500 border-slate-300'
                      : '!bg-emerald-500 !text-white border-emerald-600 shadow-2xs'
                  }`}
                  title={isHidden ? "Bấm để HIỆN chức năng này" : "Bấm để ẨN chức năng này"}
                >
                  {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#dfccb0] px-4 py-2.5 border-t border-[#c8b598] flex items-center justify-between">
          <button
            onClick={() => {
              playButtonClickSound();
              onResetDefault();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d6c4a8] hover:bg-[#c8b598] text-[#42301c] font-bold text-xs rounded-xl transition-colors cursor-pointer"
            title="Khôi phục hiện tất cả các menu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <button
            onClick={() => {
              playButtonClickSound();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#6e5334] hover:bg-[#564027] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Hoàn tất</span>
          </button>
        </div>
      </div>
    </div>
  );
};
