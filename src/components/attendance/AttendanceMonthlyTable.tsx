import React, { useState } from 'react';
import { MonthlyTrendStat, formatDateVN } from './attendanceStatsUtils';
import { Calendar, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';

interface AttendanceMonthlyTableProps {
  monthlyTrends: MonthlyTrendStat[];
}

export const AttendanceMonthlyTable: React.FC<AttendanceMonthlyTableProps> = ({
  monthlyTrends
}) => {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const toggleExpand = (monthKey: string) => {
    setExpandedMonth((prev) => (prev === monthKey ? null : monthKey));
  };

  return (
    <div className="border-2 border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-sm space-y-0 text-left">
      {/* Header */}
      <div className="bg-[#dfccb0] border-b border-[#cbb89d] p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-white/70 text-[#3d2b17]">
            <Calendar className="w-4 h-4 text-[#3d2b17]" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase text-[#3d2b17] tracking-wider">
              BẢNG TỔNG HỢP CHUYÊN CẦN THEO THÁNG
            </h3>
            <p className="text-[11px] font-bold text-[#5c4327]">
              Bấm vào từng tháng để xem chi tiết danh sách các ngày đã tổ chức điểm danh.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse text-xs text-left">
          <thead>
            <tr className="bg-[#ebdcc9]/50 border-b border-[#cbb89d] text-[11px] font-black text-[#3d2b17] uppercase tracking-wider select-none">
              <th className="py-3 px-4">Tháng</th>
              <th className="py-3 px-3 text-center">Tổng buổi học</th>
              <th className="py-3 px-3 text-center text-emerald-800">Lượt Có mặt</th>
              <th className="py-3 px-3 text-center text-sky-800">Vắng có phép</th>
              <th className="py-3 px-3 text-center text-rose-800">Không phép</th>
              <th className="py-3 px-3 text-center text-amber-800">Đi trễ</th>
              <th className="py-3 px-4 text-center">Tỷ lệ chuyên cần (%)</th>
              <th className="py-3 px-3 text-center w-24">Chi tiết</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {monthlyTrends.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                  Chưa có dữ liệu điểm danh tháng nào được ghi nhận.
                </td>
              </tr>
            ) : (
              monthlyTrends.map((m) => {
                const isExpanded = expandedMonth === m.monthKey;

                return (
                  <React.Fragment key={m.monthKey}>
                    <tr
                      onClick={() => toggleExpand(m.monthKey)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-black text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-600" />
                        <span className="group-hover:text-amber-800 transition">{m.monthKey}</span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                        {m.sessionsCount} buổi
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-black text-emerald-700">
                        {m.presentCount}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-sky-700">
                        {m.excusedCount}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-rose-700">
                        {m.unexcusedCount}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-700">
                        {m.lateCount}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-black text-slate-800">{m.attendanceRate}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div
                              className="bg-amber-600 h-1.5 rounded-full"
                              style={{ width: `${m.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(m.monthKey);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 py-1 px-2.5 rounded-lg border border-amber-200 transition cursor-pointer"
                        >
                          <span>{isExpanded ? 'Thu gọn' : 'Xem ngày'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Bung danh sách ngày khi click */}
                    {isExpanded && (
                      <tr className="bg-amber-50/20">
                        <td colSpan={8} className="p-4 border-b border-amber-100">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-[#3d2b17] tracking-wider">
                                📅 Danh Sách Các Ngày Điểm Danh Trong {m.monthKey}:
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                {m.dates.length} ngày tổ chức học
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {m.dates.map((dateStr) => (
                                <div
                                  key={dateStr}
                                  className="bg-white border border-[#cbb89d] px-3 py-1.5 rounded-xl shadow-2xs text-xs font-bold text-slate-800 flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="font-mono">{formatDateVN(dateStr)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
