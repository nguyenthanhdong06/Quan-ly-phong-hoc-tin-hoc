import React from 'react';
import { ClassSummaryStat } from './attendanceStatsUtils';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  AlertOctagon, 
  TrendingUp, 
  Award 
} from 'lucide-react';

interface AttendanceSummaryCardsProps {
  summary: ClassSummaryStat;
  isFiltered: boolean;
}

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({
  summary,
  isFiltered
}) => {
  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase text-[#5c4327] tracking-wider flex items-center gap-1.5">
          <span>📊</span> DASHBOARD TỔNG QUAN CHUYÊN CẦN
        </h3>
        {isFiltered && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            Đang lọc dữ liệu
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Tổng số học sinh */}
        <div className="bg-[#fffdfa] border-2 border-[#d8cbba] rounded-2xl p-3.5 shadow-2xs relative overflow-hidden transition hover:shadow-sm">
          <div className="flex items-center justify-between text-[#8c6b44]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Học sinh</span>
            <Users className="w-4 h-4 text-[#8c6b44]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#3d2b17]">{summary.totalStudents}</span>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Sĩ số thống kê</span>
          </div>
        </div>

        {/* 2. Tổng số buổi học */}
        <div className="bg-[#fffdfa] border-2 border-[#d8cbba] rounded-2xl p-3.5 shadow-2xs relative overflow-hidden transition hover:shadow-sm">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800">Buổi học</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-900">{summary.totalSessions}</span>
            <span className="text-[10px] font-bold text-indigo-500 block mt-0.5">Buổi thực dạy</span>
          </div>
        </div>

        {/* 3. Tổng lượt có mặt */}
        <div className="bg-emerald-50/70 border-2 border-emerald-300/80 rounded-2xl p-3.5 shadow-2xs relative overflow-hidden transition hover:shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Có mặt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-800">{summary.totalPresent}</span>
            <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Lượt tham gia học</span>
          </div>
        </div>

        {/* 4. Tổng lượt vắng có phép */}
        <div className="bg-sky-50/70 border-2 border-sky-300/80 rounded-2xl p-3.5 shadow-2xs relative overflow-hidden transition hover:shadow-sm">
          <div className="flex items-center justify-between text-sky-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Vắng có phép</span>
            <CalendarClock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-sky-800">{summary.totalExcused}</span>
            <span className="text-[10px] font-bold text-sky-600 block mt-0.5">Có đơn xin phép</span>
          </div>
        </div>

        {/* 5. Tổng lượt vắng không phép */}
        <div className="bg-rose-50/80 border-2 border-rose-300/80 rounded-2xl p-3.5 shadow-2xs relative overflow-hidden transition hover:shadow-sm">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Không phép</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-700">{summary.totalUnexcused}</span>
            <span className="text-[10px] font-bold text-rose-500 block mt-0.5">Nghỉ không báo</span>
          </div>
        </div>

        {/* 6. Tổng lượt đi trễ */}
        <div className="bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-2xs relative overflow-hidden transition hover:shadow-sm">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Đi trễ</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-800">{summary.totalLate}</span>
            <span className="text-[10px] font-bold text-amber-600 block mt-0.5">Vào lớp muộn</span>
          </div>
        </div>

        {/* 7. Tỷ lệ chuyên cần trung bình */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-gradient-to-br from-[#fff7e6] to-[#ffedd5] border-2 border-amber-400 rounded-2xl p-3.5 shadow-2xs relative overflow-hidden transition hover:shadow-sm">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[10px] font-black uppercase tracking-wider">Chuyên cần</span>
            <TrendingUp className="w-4 h-4 text-amber-700" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-900">{summary.avgAttendanceRate}%</span>
            <div className="w-full bg-amber-200/80 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summary.avgAttendanceRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
