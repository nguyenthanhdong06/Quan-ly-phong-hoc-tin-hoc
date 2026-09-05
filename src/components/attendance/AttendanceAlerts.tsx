import React, { useState } from 'react';
import { AttendanceAlertItem, StudentAttendanceStat } from './attendanceStatsUtils';
import { 
  HeartHandshake, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  TrendingDown, 
  Eye, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface AttendanceAlertsProps {
  alerts: AttendanceAlertItem[];
  studentStats: StudentAttendanceStat[];
  onSelectStudent: (stat: StudentAttendanceStat) => void;
}

export const AttendanceAlerts: React.FC<AttendanceAlertsProps> = ({
  alerts,
  studentStats,
  onSelectStudent
}) => {
  const [filterType, setFilterType] = useState<'all' | 'unexcused' | 'frequent_absent' | 'frequent_late' | 'low_rate'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const getAlertBadge = (type: AttendanceAlertItem['type']) => {
    switch (type) {
      case 'unexcused':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Không phép'
        };
      case 'frequent_late':
        return {
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Đi trễ'
        };
      case 'frequent_absent':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
          label: 'Vắng nhiều'
        };
      case 'low_rate':
        return {
          icon: <TrendingDown className="w-4 h-4 text-rose-600" />,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Chuyên cần thấp'
        };
    }
  };

  return (
    <div className="border-2 border-[#cbb89d] rounded-2xl bg-[#fffbf0] p-4 shadow-sm space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-[#ebdcc9] pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#dfccb0] text-[#3d2b17]">
            <HeartHandshake className="w-4 h-4 text-[#3d2b17]" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase text-[#3d2b17] tracking-wider flex items-center gap-2">
              <span>CẢNH BÁO CHUYÊN CẦN & GỢI Ý HỖ TRỢ HỌC SINH</span>
              {alerts.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  {alerts.length} em cần lưu ý
                </span>
              )}
            </h3>
            <p className="text-[11px] font-bold text-[#5c4327]">
              Phát hiện sớm các biểu hiện chuyên cần giảm sút để kịp thời động viên, hỗ trợ học sinh với tinh thần tích cực.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer text-[11px] ${
              filterType === 'all'
                ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Tất cả ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('unexcused')}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer text-[11px] ${
              filterType === 'unexcused'
                ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Vắng không phép
          </button>
          <button
            type="button"
            onClick={() => setFilterType('frequent_late')}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer text-[11px] ${
              filterType === 'frequent_late'
                ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Đi trễ
          </button>
          <button
            type="button"
            onClick={() => setFilterType('low_rate')}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer text-[11px] ${
              filterType === 'low_rate'
                ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Chuyên cần thấp
          </button>
        </div>
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-sm">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Tuyệt vời! Không có học sinh nào nằm trong danh sách cần cảnh báo.</span>
          </div>
          <p className="text-xs font-bold text-emerald-600">
            Tất cả học sinh đều duy trì tỷ lệ chuyên cần tốt, tham gia đều đặn các buổi học.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAlerts.map((item) => {
            const badge = getAlertBadge(item.type);
            const targetStat = studentStats.find((s) => s.student.id === item.student.id);

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#ebdcc9] rounded-2xl p-4 shadow-2xs space-y-2.5 transition hover:border-[#cbb89d] hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                        {badge.icon}
                      </div>
                      <div>
                        <strong className="text-xs sm:text-sm font-black text-slate-900 block">
                          {item.student.name}
                        </strong>
                        <span className="text-[10px] font-bold text-slate-500">
                          Lớp: <span className="font-black text-amber-900">{item.student.classId}</span> | MSHS:{' '}
                          <span className="font-mono">{item.student.code}</span>
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${badge.badgeBg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 mt-2.5 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                    {item.detail}
                  </p>

                  <div className="mt-2 text-[11px] font-semibold text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 flex items-start gap-1.5">
                    <span className="text-xs shrink-0">💡</span>
                    <span>
                      <strong className="font-black text-amber-950">Gợi ý hỗ trợ: </strong>
                      {item.suggestion}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-slate-400">
                    Chuyên cần: <strong className="font-black text-slate-800">{targetStat?.attendanceRate || 0}%</strong>
                  </span>

                  {targetStat && (
                    <button
                      type="button"
                      onClick={() => onSelectStudent(targetStat)}
                      className="inline-flex items-center gap-1 font-extrabold text-[11px] text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-200/70 px-2.5 py-1 rounded-lg border border-amber-300 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem lịch chi tiết</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
