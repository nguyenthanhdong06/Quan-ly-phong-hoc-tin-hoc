import React, { useState } from 'react';
import { ClassSummaryStat, MonthlyTrendStat } from './attendanceStatsUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, GitCompare } from 'lucide-react';

interface AttendanceChartsProps {
  summary: ClassSummaryStat;
  monthlyTrends: MonthlyTrendStat[];
}

// Custom tooltip phong cách iMac DeskOS
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 text-left">
        <p className="font-extrabold text-amber-400 border-b border-slate-700 pb-1">{label || payload[0]?.name}</p>
        <div className="space-y-1 pt-1">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }} />
                <span>{entry.name}:</span>
              </span>
              <strong className="font-mono font-bold text-white">
                {entry.value} {typeof entry.value === 'number' && entry.name.includes('%') ? '%' : 'lượt'}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  summary,
  monthlyTrends
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'bar' | 'line' | 'pie' | 'compare'>('all');

  // Dữ liệu cho Biểu đồ Cột & Tròn
  const statusData = [
    { name: 'Có mặt', value: summary.totalPresent, fill: '#10b981' }, // Emerald
    { name: 'Đi trễ', value: summary.totalLate, fill: '#f59e0b' },     // Amber
    { name: 'Vắng có phép', value: summary.totalExcused, fill: '#0284c7' }, // Sky
    { name: 'Vắng không phép', value: summary.totalUnexcused, fill: '#e11d48' } // Rose
  ];

  // Dữ liệu cho Biểu đồ Đường xu hướng chuyên cần theo tháng
  const trendData = monthlyTrends.map((m) => ({
    name: m.monthKey,
    'Tỷ lệ chuyên cần (%)': m.attendanceRate,
    'Buổi học': m.sessionsCount
  }));

  // Dữ liệu cho Biểu đồ So sánh các tháng
  const compareData = monthlyTrends.map((m) => ({
    name: m.monthKey,
    'Có mặt': m.presentCount,
    'Đi trễ': m.lateCount,
    'Vắng có phép': m.excusedCount,
    'Không phép': m.unexcusedCount
  }));

  const totalActions = summary.totalPresent + summary.totalLate + summary.totalExcused + summary.totalUnexcused;

  return (
    <div className="border-2 border-[#cbb89d] rounded-2xl bg-[#fffbf0] p-4 shadow-sm space-y-4 text-left">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-[#ebdcc9] pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#dfccb0] text-[#3d2b17]">
            <BarChart3 className="w-4 h-4 text-[#3d2b17]" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase text-[#3d2b17] tracking-wider">
              BIỂU ĐỒ TRỰC QUAN HÓA CHUYÊN CẦN
            </h3>
            <p className="text-[11px] font-bold text-[#5c4327]">
              Phân tích biến thiên, tỷ lệ tham gia và so sánh các mốc thời gian.
            </p>
          </div>
        </div>

        {/* Chart View Mode Switcher */}
        <div className="inline-flex rounded-xl bg-[#ebdcc9] p-1 border border-[#cbb89d] text-xs font-bold gap-1 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setActiveChartTab('all')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeChartTab === 'all'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-[#5c4327] hover:bg-white/50'
            }`}
          >
            Tất cả (Lưới)
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('bar')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeChartTab === 'bar'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-[#5c4327] hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cột trạng thái</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('line')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeChartTab === 'line'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-[#5c4327] hover:bg-white/50'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Đường xu hướng</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('pie')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeChartTab === 'pie'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-[#5c4327] hover:bg-white/50'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tròn phân bổ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('compare')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeChartTab === 'compare'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-[#5c4327] hover:bg-white/50'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">So sánh tháng</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className={`grid gap-4 ${activeChartTab === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* 1. BIỂU ĐỒ CỘT: Số lượt theo trạng thái */}
        {(activeChartTab === 'all' || activeChartTab === 'bar') && (
          <div className="bg-white border border-[#cbb89d] rounded-xl p-4 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-[#3d2b17] mb-3 flex items-center justify-between">
              <span>📊 Số Lượt Theo Trạng Thái</span>
              <span className="text-[11px] font-bold text-slate-400">Tổng: {totalActions} lượt</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="value" name="Số lượt" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 2. BIỂU ĐỒ ĐƯỜNG: Tỷ lệ chuyên cần theo thời gian */}
        {(activeChartTab === 'all' || activeChartTab === 'line') && (
          <div className="bg-white border border-[#cbb89d] rounded-xl p-4 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-[#3d2b17] mb-3 flex items-center justify-between">
              <span>📈 Xu Hướng Chuyên Cần Theo Tháng</span>
              <span className="text-[11px] font-bold text-amber-700">Mục tiêu: ≥ 95%</span>
            </h4>
            <div className="h-64 w-full">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  Chưa có dữ liệu theo tháng
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="Tỷ lệ chuyên cần (%)"
                      stroke="#d97706"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#d97706', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* 3. BIỂU ĐỒ TRÒN: Phân bổ tỷ lệ các trạng thái */}
        {(activeChartTab === 'all' || activeChartTab === 'pie') && (
          <div className="bg-white border border-[#cbb89d] rounded-xl p-4 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-[#3d2b17] mb-3 flex items-center justify-between">
              <span>🍩 Phân Bổ Tỷ Lệ Các Trạng Thái</span>
              <span className="text-[11px] font-bold text-emerald-700">
                Hiện diện: {totalActions > 0 ? Math.round(((summary.totalPresent + summary.totalLate) / totalActions) * 100) : 100}%
              </span>
            </h4>
            <div className="h-64 w-full">
              {totalActions === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  Chưa có dữ liệu điểm danh
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, idx) => (
                        <Cell key={`pie-cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                      formatter={(val) => <span className="font-bold text-slate-700">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* 4. BIỂU ĐỒ SO SÁNH GIỮA CÁC THÁNG */}
        {(activeChartTab === 'all' || activeChartTab === 'compare') && (
          <div className="bg-white border border-[#cbb89d] rounded-xl p-4 shadow-2xs">
            <h4 className="text-xs font-black uppercase text-[#3d2b17] mb-3 flex items-center justify-between">
              <span>📊 So Sánh Chuyên Cần Giữa Các Tháng</span>
              <span className="text-[11px] font-bold text-slate-400">{monthlyTrends.length} tháng ghi nhận</span>
            </h4>
            <div className="h-64 w-full">
              {compareData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  Chưa có dữ liệu so sánh giữa các tháng
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compareData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 5 }}
                      formatter={(val) => <span className="font-bold text-slate-700">{val}</span>}
                    />
                    <Bar dataKey="Có mặt" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Đi trễ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Vắng có phép" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Không phép" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
