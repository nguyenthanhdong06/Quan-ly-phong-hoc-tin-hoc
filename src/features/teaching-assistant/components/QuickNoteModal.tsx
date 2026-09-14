import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CurrentClassContext, TeachingQuickNote } from '../types';
import { Zap, Save, CalendarPlus, X, Clock, School, BookOpen } from 'lucide-react';
import { ClassItem } from '../../../types';
import { VietnameseDatePicker } from '../../../components/common/VietnameseDatePicker';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext: CurrentClassContext;
  classes: ClassItem[];
  onSaveQuickNote: (note: Omit<TeachingQuickNote, 'id' | 'createdAt'>) => void;
  onConvertToTask: (noteContent: string, classId?: string, subject?: string) => void;
  workspaceId: string;
  userId: string;
}

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  isOpen,
  onClose,
  currentContext,
  classes,
  onSaveQuickNote,
  onConvertToTask,
  workspaceId,
  userId,
}) => {
  const [content, setContent] = useState('');
  const [selectedClass, setSelectedClass] = useState(currentContext.className || '');
  const [selectedSubject, setSelectedSubject] = useState(currentContext.subject || 'Tin học');
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Khi modal mở, cập nhật lớp, môn và ngày theo ngữ cảnh hiện tại
  useEffect(() => {
    if (isOpen) {
      setSelectedClass(currentContext.className || (classes[0]?.name || ''));
      setSelectedSubject(currentContext.subject || 'Tin học');
      setContent('');
      setNoteDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, currentContext, classes]);

  // Phím tắt Esc để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSaveQuickNote({
      workspaceId,
      userId,
      content: content.trim(),
      classId: selectedClass || undefined,
      subject: selectedSubject || undefined,
      period: currentContext.period || undefined,
      noteDate: noteDate || new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  const handleSaveAndConvert = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onConvertToTask(content.trim(), selectedClass, selectedSubject);
    onClose();
  };

  const portalTarget = typeof document !== 'undefined'
    ? (document.getElementById('deskos-window-body') || document.getElementById('deskos-active-window') || document.body)
    : null;
  const isBodyTarget = portalTarget === (typeof document !== 'undefined' ? document.body : null);

  return typeof document !== 'undefined' && portalTarget ? createPortal(
    <div 
      className={`${isBodyTarget ? 'fixed' : 'absolute'} inset-0 bg-slate-900/65 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#faf5ec] w-full max-w-lg rounded-3xl shadow-2xl border-2 border-[#d6c4a8] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200 my-auto text-left outline-none"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header Modal chuẩn phong cách Vườn tri thức */}
        <div className="bg-gradient-to-r from-[#dfccb0] via-[#e8d9c2] to-[#dfccb0] px-5 py-3.5 border-b border-[#c8b598] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-amber-500 text-amber-950 shadow-2xs">
              <Zap className="w-5 h-5 fill-amber-950 stroke-[2.5]" />
            </span>
            <div>
              <h3 className="font-black text-base text-[#42301c]">Ghi chú nhanh trong tiết dạy</h3>
              <p className="text-[11px] font-bold text-[#6e5334]">Lưu nhanh sự việc hoặc phát sinh cần xử lý</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6e5334] hover:text-[#382613] bg-white/60 hover:bg-white p-1.5 rounded-full transition-all cursor-pointer shadow-xs focus:outline-none"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thân Form */}
        <form onSubmit={handleSaveOnly} className="p-5 space-y-4">
          {/* Thông tin ngữ cảnh tiết học hiện tại & Bộ chọn ngày chuẩn cấu trúc */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-amber-100/60 border border-amber-300/80 text-xs font-bold text-amber-950">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                {currentContext.isTeachingNow
                  ? `Tiết ${currentContext.period} (${currentContext.startTime} - ${currentContext.endTime})`
                  : 'Ngoài giờ học / Giờ ra chơi'}
              </span>
              {currentContext.isTeachingNow && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black animate-pulse">
                  Đang dạy
                </span>
              )}
            </div>

            <VietnameseDatePicker
              label="Ngày ghi:"
              value={noteDate}
              onChange={(newDate) => setNoteDate(newDate)}
              className="bg-white/95"
            />
          </div>

          {/* Chọn Lớp & Môn */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1 flex items-center gap-1">
                <School className="w-3.5 h-3.5" /> Lớp đang dạy:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#d6c4a8] text-xs font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="">-- Không gắn lớp --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>
                    Lớp {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#5c4327] mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Môn học:
              </label>
              <input
                type="text"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                placeholder="VD: Tin học"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#d6c4a8] text-xs font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Ô nhập ghi chú nhanh */}
          <div>
            <label className="block text-xs font-black text-[#5c4327] mb-1">
              Nội dung ghi chú <span className="text-rose-600">*</span>:
            </label>
            <textarea
              autoFocus
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="VD: Máy 8 chuột bị kẹt, Lớp 3A chưa hoàn thành bài tập Scratch bài 4, chuẩn bị đồ dùng..."
              className="w-full p-3 rounded-xl bg-white border border-[#d6c4a8] text-sm font-semibold text-[#3d2b17] placeholder:text-[#5c4327]/40 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Cụm nút bấm hành động chuẩn phong cách Vườn tri thức */}
          <div className="pt-2 border-t border-[#c8b598]/50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              Hủy (Esc)
            </button>

            <button
              type="submit"
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-xs bg-[#dfccb0] hover:bg-[#d0bea0] text-[#3d2b17] border border-[#cbb89d] disabled:opacity-50 active:scale-95 transition cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Chỉ lưu ghi chú</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndConvert}
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-600/20 disabled:opacity-50 active:scale-95 transition cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Tạo việc tuần tới 👉</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget
  ) : null;
};
