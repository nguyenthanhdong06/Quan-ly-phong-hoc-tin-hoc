import React from 'react';
import { ClassItem, Student, AttendanceStatus } from '../../types';
import { AttendanceFilterState } from './attendanceStatsUtils';
import { Filter, RotateCcw, FileSpreadsheet, Calendar, Users, CheckCircle, Clock } from 'lucide-react';

interface AttendanceFilterBarProps {
  filter: AttendanceFilterState;
  tempFilter: AttendanceFilterState;
  setTempFilter: React.Dispatch<React.SetStateAction<AttendanceFilterState>>;
  onApplyFilter: () => void;
  onResetFilter: () => void;
  onExportExcel: () => void;
  classes?: ClassItem[];
  students: Student[];
}

export const AttendanceFilterBar: React.FC<AttendanceFilterBarProps> = ({
  tempFilter,
  setTempFilter,
  onApplyFilter,
  onResetFilter,
  onExportExcel,
  classes = [],
  students = []
}) => {
  // Lọc danh sách học sinh theo lớp đang chọn trong filter
  const availableStudents = React.useMemo(() => {
    if (tempFilter.classId === 'all') return students;
    return students.filter((s) => s.classId === tempFilter.classId);
  }, [students, tempFilter.classId]);

  return (
    <div className="border-2 border-[#cbb89d] rounded-2xl bg-[#fffbf0] p-4 shadow-sm space-y-3.5 text-left">
      <div className="flex items-center justify-between border-b border-[#ebdcc9] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#dfccb0] text-[#3d2b17]">
            <Filter className="w-4 h-4 text-[#3d2b17]" />
          </span>
          <h3 className="text-xs sm:text-sm font-black uppercase text-[#3d2b17] tracking-wider">
            BỘ LỌC THỐNG KÊ CHUYÊN CẦN
          </h3>
        </div>

        <button
          type="button"
          onClick={onExportExcel}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-1.5 px-3 rounded-xl border border-emerald-600 transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
          title="Tải bảng báo cáo thống kê định dạng Microsoft Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
          <span className="hidden sm:inline">Xuất Báo Cáo Excel</span>
          <span className="sm:hidden">Excel</span>
        </button>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* 1. Chọn Lớp */}
        <div>
          <label className="block text-[11px] font-black text-[#5c4327] mb-1">
            🏫 Lớp học:
          </label>
          <select
            value={tempFilter.classId}
            onChange={(e) => {
              const newClass = e.target.value;
              setTempFilter((prev) => ({
                ...prev,
                classId: newClass,
                studentId: 'all' // Reset chọn học sinh khi đổi lớp
              }));
            }}
            className="w-full bg-white border border-[#cbb89d] rounded-xl py-2 px-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="all">-- Tất cả các lớp --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Lớp {cls.name || cls.id}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Chọn Tháng */}
        <div>
          <label className="block text-[11px] font-black text-[#5c4327] mb-1">
            📅 Tháng học:
          </label>
          <select
            value={tempFilter.month}
            onChange={(e) =>
              setTempFilter((prev) => ({ ...prev, month: e.target.value }))
            }
            className="w-full bg-white border border-[#cbb89d] rounded-xl py-2 px-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="all">-- Cả năm học --</option>
            <option value="9">Tháng 9 (Đầu HK1)</option>
            <option value="10">Tháng 10</option>
            <option value="11">Tháng 11</option>
            <option value="12">Tháng 12</option>
            <option value="1">Tháng 1 (Bắt đầu HK2)</option>
            <option value="2">Tháng 2</option>
            <option value="3">Tháng 3</option>
            <option value="4">Tháng 4</option>
            <option value="5">Tháng 5 (Tổng kết)</option>
          </select>
        </div>

        {/* 3. Khoảng thời gian (Từ ngày - Đến ngày) */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-[11px] font-black text-[#5c4327] mb-1">
            ⏳ Khoảng thời gian:
          </label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={tempFilter.startDate}
              onChange={(e) =>
                setTempFilter((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-1/2 bg-white border border-[#cbb89d] rounded-xl py-1.5 px-2 font-bold text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
              title="Từ ngày"
            />
            <span className="text-[#8c6b44] font-bold text-[10px]">-</span>
            <input
              type="date"
              value={tempFilter.endDate}
              onChange={(e) =>
                setTempFilter((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-1/2 bg-white border border-[#cbb89d] rounded-xl py-1.5 px-2 font-bold text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
              title="Đến ngày"
            />
          </div>
        </div>

        {/* 4. Chọn Học sinh */}
        <div>
          <label className="block text-[11px] font-black text-[#5c4327] mb-1">
            👦 Học sinh:
          </label>
          <select
            value={tempFilter.studentId}
            onChange={(e) =>
              setTempFilter((prev) => ({ ...prev, studentId: e.target.value }))
            }
            className="w-full bg-white border border-[#cbb89d] rounded-xl py-2 px-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="all">-- Tất cả học sinh ({availableStudents.length}) --</option>
            {availableStudents.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.code})
              </option>
            ))}
          </select>
        </div>

        {/* 5. Trạng thái Điểm danh */}
        <div>
          <label className="block text-[11px] font-black text-[#5c4327] mb-1">
            🎯 Trạng thái:
          </label>
          <select
            value={tempFilter.status}
            onChange={(e) =>
              setTempFilter((prev) => ({
                ...prev,
                status: e.target.value as any
              }))
            }
            className="w-full bg-white border border-[#cbb89d] rounded-xl py-2 px-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="all">-- Tất cả trạng thái --</option>
            <option value="present">🟢 Có mặt (Đi học)</option>
            <option value="late">🟡 Đi trễ</option>
            <option value="excused">🔵 Vắng có phép (P)</option>
            <option value="unexcused">🔴 Vắng không phép (KP)</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#ebdcc9]/60">
        <button
          type="button"
          onClick={onResetFilter}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-1.5 px-3.5 rounded-xl border border-slate-300 transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Đặt lại</span>
        </button>

        <button
          type="button"
          onClick={onApplyFilter}
          className="bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs py-1.5 px-4 rounded-xl border border-amber-800 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <Filter className="w-3.5 h-3.5 text-amber-200" />
          <span>Áp Dụng Bộ Lọc</span>
        </button>
      </div>
    </div>
  );
};
