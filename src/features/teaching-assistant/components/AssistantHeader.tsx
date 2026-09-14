import React from 'react';
import { AssistantActiveTab } from '../types';
import { 
  CheckSquare, 
  CalendarDays, 
  ListTodo, 
  Calendar, 
  Plus, 
  Zap, 
  User, 
  Filter, 
  BookOpen
} from 'lucide-react';
import { ClassItem, Grade, Member } from '../../../types';
import { getWorkspaceOwnerName } from '../../../services/workspaceService';

interface AssistantHeaderProps {
  activeTab: AssistantActiveTab;
  setActiveTab: (tab: AssistantActiveTab) => void;
  grades: Grade[];
  classes: ClassItem[];
  subjects: string[];
  selectedGradeId: number | null;
  setSelectedGradeId: (id: number | null) => void;
  selectedClassId: string | null;
  setSelectedClassId: (id: string | null) => void;
  selectedSubject: string | null;
  setSelectedSubject: (subject: string | null) => void;
  onOpenNewTaskModal: () => void;
  onOpenQuickNoteModal: () => void;
  workspaceId: string;
  members: Member[];
  pendingTasksCount: number;
  urgentTasksCount: number;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  activeTab,
  setActiveTab,
  grades,
  classes,
  subjects,
  selectedGradeId,
  setSelectedGradeId,
  selectedClassId,
  setSelectedClassId,
  selectedSubject,
  setSelectedSubject,
  onOpenNewTaskModal,
  onOpenQuickNoteModal,
  workspaceId,
  members,
  pendingTasksCount,
  urgentTasksCount,
}) => {
  const ownerName = getWorkspaceOwnerName(workspaceId, members);

  // Lọc lớp theo khối đã chọn (nếu có)
  const availableClasses = selectedGradeId
    ? classes.filter(c => c.gradeId === selectedGradeId)
    : classes;

  return (
    <div className="space-y-4">
      {/* Banner Tiêu đề & Nút hành động */}
      <div className="bg-gradient-to-r from-[#dfccb0] via-[#e8d9c2] to-[#dfccb0] border border-[#cbb89d] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-amber-500 text-amber-950 shadow-xs">
              <CheckSquare className="w-6 h-6 stroke-[2.5]" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#3d2b17] tracking-tight flex items-center gap-2">
                Trợ lý công việc giảng dạy
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                  DeskOS Assistant
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#5c4327] mt-0.5 flex items-center gap-2">
                <span>Quản lý kế hoạch bài dạy, đối chiếu TKB và nhắc việc tự động</span>
                <span className="hidden sm:inline text-[#cbb89d]">•</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                  <User className="w-3 h-3" /> {ownerName}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Cụm nút Thao tác nhanh */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenQuickNoteModal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 shadow-xs border border-amber-600/40 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
            title="Ghi chú nhanh tiết dạy hiện tại"
          >
            <Zap className="w-4 h-4 fill-amber-950" />
            <span>⚡ Ghi chú nhanh</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewTaskModal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm bg-[#3d2b17] hover:bg-[#2a1d0f] text-[#fffbf0] shadow-xs border border-[#2a1d0f] hover:scale-[1.02] active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Thêm việc mới</span>
          </button>
        </div>
      </div>

      {/* Thanh chuyển đổi 4 Chế độ xem cốt lõi (4 Core Views) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#dfccb0]/50 border border-[#cbb89d] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              activeTab === 'today'
                ? 'bg-[#3d2b17] text-[#fffbf0] shadow-xs'
                : 'text-[#3d2b17] hover:bg-[#fffbf0]/60'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Hôm nay</span>
            {pendingTasksCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'today' ? 'bg-amber-400 text-amber-950' : 'bg-amber-200 text-amber-900'}`}>
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('next_week')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              activeTab === 'next_week'
                ? 'bg-[#3d2b17] text-[#fffbf0] shadow-xs'
                : 'text-[#3d2b17] hover:bg-[#fffbf0]/60'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Tuần tới (Trọng tâm)</span>
            <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
              HOT
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all_tasks')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              activeTab === 'all_tasks'
                ? 'bg-[#3d2b17] text-[#fffbf0] shadow-xs'
                : 'text-[#3d2b17] hover:bg-[#fffbf0]/60'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Sổ tay công việc</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-[#3d2b17] text-[#fffbf0] shadow-xs'
                : 'text-[#3d2b17] hover:bg-[#fffbf0]/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lịch kết hợp TKB</span>
          </button>
        </div>

        {/* Cảnh báo việc khẩn cấp nếu có */}
        {urgentTasksCount > 0 && (
          <div className="hidden lg:inline-flex items-center gap-1.5 text-xs font-black text-rose-900 bg-rose-100/90 border border-rose-300 px-3 py-1 rounded-xl shadow-2xs shrink-0 animate-pulse">
            <span>⚡ Có {urgentTasksCount} việc khẩn cấp cần chuẩn bị!</span>
          </div>
        )}
      </div>

      {/* Thanh lọc nhanh (Quick Filter Chips): Khối / Lớp / Môn */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#fffbf0] border border-[#cbb89d] rounded-xl px-3 py-2 text-xs">
        {/* Lọc Khối */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-[#5c4327] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Khối:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedGradeId(null);
              setSelectedClassId(null);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedGradeId === null
                ? 'bg-[#3d2b17] text-[#fffbf0]'
                : 'bg-[#dfccb0]/60 text-[#3d2b17] hover:bg-[#dfccb0]'
            }`}
          >
            Tất cả
          </button>
          {grades.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setSelectedGradeId(g.id === selectedGradeId ? null : g.id);
                setSelectedClassId(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedGradeId === g.id
                  ? 'bg-[#3d2b17] text-[#fffbf0]'
                  : 'bg-[#dfccb0]/60 text-[#3d2b17] hover:bg-[#dfccb0]'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Chọn Lớp & Chọn Môn */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Chọn Lớp */}
          <select
            value={selectedClassId || ''}
            onChange={(e) => setSelectedClassId(e.target.value ? e.target.value : null)}
            className="px-2.5 py-1 rounded-lg bg-[#fffbf0] border border-[#cbb89d] text-xs font-bold text-[#3d2b17] focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="">-- Tất cả Lớp --</option>
            {availableClasses.map(c => (
              <option key={c.id} value={c.name}>
                Lớp {c.name}
              </option>
            ))}
          </select>

          {/* Chọn Môn */}
          {subjects.length > 1 && (
            <select
              value={selectedSubject || ''}
              onChange={(e) => setSelectedSubject(e.target.value ? e.target.value : null)}
              className="px-2.5 py-1 rounded-lg bg-[#fffbf0] border border-[#cbb89d] text-xs font-bold text-[#3d2b17] focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">-- Môn học --</option>
              {subjects.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};
