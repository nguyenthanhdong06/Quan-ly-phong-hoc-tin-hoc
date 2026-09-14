import React, { useState, useEffect } from 'react';
import { CurrentClassContext, TeachingQuickNote, TeachingTask } from '../types';
import { Zap, Save, CalendarPlus, X, Clock, School, BookOpen } from 'lucide-react';
import { ClassItem } from '../../../types';

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

  // Khi modal mở, cập nhật lớp và môn theo tiết học hiện tại
  useEffect(() => {
    if (isOpen) {
      setSelectedClass(currentContext.className || (classes[0]?.name || ''));
      setSelectedSubject(currentContext.subject || 'Tin học');
      setContent('');
    }
  }, [isOpen, currentContext, classes]);

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
      noteDate: new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  const handleSaveAndConvert = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onConvertToTask(content.trim(), selectedClass, selectedSubject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#fffbf0] border-2 border-amber-500/70 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 px-5 py-3.5 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-amber-950 shadow-2xs">
              <Zap className="w-5 h-5 fill-amber-950 stroke-[2.5]" />
            </span>
            <div>
              <h3 className="font-black text-base text-amber-950">Ghi chú nhanh trong tiết dạy</h3>
              <p className="text-[11px] font-bold text-amber-900/80">Lưu nhanh sự việc hoặc việc cần khắc phục</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-amber-950/70 hover:text-amber-950 hover:bg-amber-500/30 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Form */}
        <form onSubmit={handleSaveOnly} className="p-5 space-y-4">
          {/* Thông tin ngữ cảnh tiết học hiện tại */}
          <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300/80 flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-amber-950">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-800" />
              <span>
                {currentContext.isTeachingNow
                  ? `Đang trong Tiết ${currentContext.period} (${currentContext.startTime} - ${currentContext.endTime})`
                  : 'Ngoài giờ học hoặc giờ ra chơi'}
              </span>
            </div>

            {currentContext.isTeachingNow && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black animate-pulse">
                Đang đứng lớp
              </span>
            )}
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
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] text-xs font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#cbb89d] text-xs font-bold text-[#3d2b17] focus:ring-2 focus:ring-amber-500"
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
              className="w-full p-3 rounded-xl bg-white border border-[#cbb89d] text-sm font-semibold text-[#3d2b17] placeholder:text-[#5c4327]/40 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Cụm nút bấm hành động */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs bg-[#dfccb0] hover:bg-[#d0bea0] text-[#3d2b17] border border-[#cbb89d] disabled:opacity-50 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Chỉ lưu ghi chú</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndConvert}
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Tạo việc tuần tới 👉</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
