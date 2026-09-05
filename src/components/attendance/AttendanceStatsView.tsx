import React, { useState, useMemo, useCallback } from 'react';
import { Student, AttendanceData, ClassItem, AttendanceStatus } from '../../types';
import {
  AttendanceFilterState,
  StudentAttendanceStat,
  calculateStudentAttendanceStats,
  calculateMonthlyTrends,
  detectAttendanceAlerts,
  exportAttendanceToExcel
} from './attendanceStatsUtils';
import { AttendanceFilterBar } from './AttendanceFilterBar';
import { AttendanceSummaryCards } from './AttendanceSummaryCards';
import { AttendanceCharts } from './AttendanceCharts';
import { AttendanceStudentTable } from './AttendanceStudentTable';
import { AttendanceMonthlyTable } from './AttendanceMonthlyTable';
import { AttendanceAlerts } from './AttendanceAlerts';
import { AttendanceStudentModal } from './AttendanceStudentModal';
import { ArrowLeft, BarChart3, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface AttendanceStatsViewProps {
  selectedClass: string;
  classes?: ClassItem[];
  students: Student[];
  attendanceData: AttendanceData;
  onBackToAttendance: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const AttendanceStatsView: React.FC<AttendanceStatsViewProps> = ({
  selectedClass,
  classes = [],
  students,
  attendanceData,
  onBackToAttendance,
  showToast
}) => {
  // Bộ lọc áp dụng thực tế
  const [filter, setFilter] = useState<AttendanceFilterState>({
    classId: selectedClass || 'all',
    month: 'all',
    startDate: '',
    endDate: '',
    studentId: 'all',
    status: 'all'
  });

  // Bộ lọc tạm thời trên thanh công cụ
  const [tempFilter, setTempFilter] = useState<AttendanceFilterState>({
    classId: selectedClass || 'all',
    month: 'all',
    startDate: '',
    endDate: '',
    studentId: 'all',
    status: 'all'
  });

  // Modal xem chi tiết học sinh
  const [activeModalStat, setActiveModalStat] = useState<StudentAttendanceStat | null>(null);

  // Tính toán số liệu học sinh & tổng quan
  const { studentStats, summary } = useMemo(() => {
    return calculateStudentAttendanceStats(
      attendanceData,
      students,
      filter.classId,
      filter
    );
  }, [attendanceData, students, filter]);

  // Tính toán xu hướng các tháng
  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(attendanceData, filter.classId, students);
  }, [attendanceData, filter.classId, students]);

  // Danh sách cảnh báo chuyên cần
  const alerts = useMemo(() => {
    return detectAttendanceAlerts(studentStats);
  }, [studentStats]);

  // Áp dụng bộ lọc
  const handleApplyFilter = useCallback(() => {
    setFilter({ ...tempFilter });
    showToast('Đã áp dụng thành công bộ lọc thống kê chuyên cần!');
  }, [tempFilter, showToast]);

  // Đặt lại bộ lọc
  const handleResetFilter = useCallback(() => {
    const initial: AttendanceFilterState = {
      classId: selectedClass || 'all',
      month: 'all',
      startDate: '',
      endDate: '',
      studentId: 'all',
      status: 'all'
    };
    setTempFilter(initial);
    setFilter(initial);
    showToast('Đã đặt lại bộ lọc thống kê về mặc định.');
  }, [selectedClass, showToast]);

  // Xuất file Excel
  const handleExportExcel = useCallback(() => {
    try {
      const currentClassName = filter.classId === 'all' 
        ? 'Tat_Ca_Cac_Lop' 
        : `Lop_${filter.classId}`;
      exportAttendanceToExcel(studentStats, summary, currentClassName, filter);
      showToast('Đã xuất file báo cáo Excel (.xlsx) thành công!');
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      showToast('Có lỗi xảy ra khi tạo file Excel, vui lòng thử lại.', 'error');
    }
  }, [studentStats, summary, filter, showToast]);

  const isFiltered = filter.month !== 'all' || !!filter.startDate || !!filter.endDate || filter.studentId !== 'all' || filter.status !== 'all';

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      {/* 🌟 Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fffbf0] border-2 border-[#cbb89d] p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToAttendance}
            className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl border border-slate-700 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Quay lại giao diện sổ điểm danh hàng ngày"
          >
            <ArrowLeft className="w-4 h-4 text-slate-200" />
            <span>Quay Về Sổ Điểm Danh</span>
          </button>

          <div>
            <h2 className="text-sm sm:text-base font-black uppercase text-[#3d2b17] tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-800" />
              <span>HỆ THỐNG PHÂN TÍCH & BẢNG THỐNG KÊ CHUYÊN CẦN</span>
            </h2>
            <p className="text-[11px] font-bold text-[#5c4327]">
              Không gian làm việc giáo viên: Đang xem {filter.classId === 'all' ? 'Tất cả các lớp' : `Lớp ${filter.classId}`}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl border border-emerald-600 transition shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Xuất bảng số liệu ra Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Xuất Báo Cáo Excel</span>
          </button>
        </div>
      </div>

      {/* 1. BỘ LỌC THỐNG KÊ */}
      <AttendanceFilterBar
        filter={filter}
        tempFilter={tempFilter}
        setTempFilter={setTempFilter}
        onApplyFilter={handleApplyFilter}
        onResetFilter={handleResetFilter}
        onExportExcel={handleExportExcel}
        classes={classes}
        students={students}
      />

      {/* 2. DASHBOARD TỔNG QUAN (7 THẺ CHỈ SỐ) */}
      <AttendanceSummaryCards summary={summary} isFiltered={isFiltered} />

      {/* 3. BIỂU ĐỒ TRỰC QUAN HÓA (4 BIỂU ĐỒ) */}
      <AttendanceCharts summary={summary} monthlyTrends={monthlyTrends} />

      {/* 4. BẢNG THỐNG KÊ CHI TIẾT TỪNG HỌC SINH */}
      <AttendanceStudentTable
        studentStats={studentStats}
        onSelectStudent={(stat) => setActiveModalStat(stat)}
      />

      {/* 5. THỐNG KÊ THEO THÁNG TRONG NĂM HỌC */}
      <AttendanceMonthlyTable monthlyTrends={monthlyTrends} />

      {/* 6. CẢNH BÁO CHUYÊN CẦN & GỢI Ý HỖ TRỢ TÍCH CỰC */}
      <AttendanceAlerts
        alerts={alerts}
        studentStats={studentStats}
        onSelectStudent={(stat) => setActiveModalStat(stat)}
      />

      {/* 7. MODAL CHI TIẾT ĐIỂM DANH HỌC SINH (5 MÃ MÀU MA TRẬN) */}
      <AttendanceStudentModal
        stat={activeModalStat}
        onClose={() => setActiveModalStat(null)}
        showToast={showToast}
      />
    </div>
  );
};
