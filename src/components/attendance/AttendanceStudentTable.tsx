import React, { useState, useMemo } from 'react';
import { StudentAttendanceStat } from './attendanceStatsUtils';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Award,
  Users
} from 'lucide-react';

interface AttendanceStudentTableProps {
  studentStats: StudentAttendanceStat[];
  onSelectStudent: (stat: StudentAttendanceStat) => void;
}

type SortField = 'name' | 'code' | 'classId' | 'totalSessions' | 'presentCount' | 'excusedCount' | 'unexcusedCount' | 'lateCount' | 'attendanceRate';
type SortOrder = 'asc' | 'desc';

export const AttendanceStudentTable: React.FC<AttendanceStudentTableProps> = ({
  studentStats,
  onSelectStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Lọc theo từ khóa tìm kiếm
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return studentStats;
    return studentStats.filter(
      (item) =>
        item.student.name.toLowerCase().includes(term) ||
        item.student.code.toLowerCase().includes(term) ||
        item.student.classId.toLowerCase().includes(term)
    );
  }, [studentStats, searchTerm]);

  // Sắp xếp theo cột
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'name') {
        // Sắp xếp theo tên (tách từ cuối)
        const getLastName = (fullName: string) => {
          const parts = fullName.trim().split(' ');
          return parts[parts.length - 1] || fullName;
        };
        valA = getLastName(a.student.name);
        valB = getLastName(b.student.name);
      } else if (sortField === 'code') {
        valA = a.student.code;
        valB = b.student.code;
      } else if (sortField === 'classId') {
        valA = a.student.classId;
        valB = b.student.classId;
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB, 'vi') 
          : valB.localeCompare(valA, 'vi');
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredList, sortField, sortOrder]);

  // Phân trang
  const totalItems = sortedList.length;
  const effectivePageSize = pageSize === -1 ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const paginatedList = useMemo(() => {
    if (pageSize === -1) return sortedList;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedList.slice(startIndex, startIndex + pageSize);
  }, [sortedList, currentPage, pageSize]);

  // Xử lý đổi cột sắp xếp
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-amber-700 font-bold" /> 
      : <ArrowDown className="w-3 h-3 text-amber-700 font-bold" />;
  };

  return (
    <div className="border-2 border-[#cbb89d] rounded-2xl bg-[#fffbf0] overflow-hidden shadow-sm space-y-0 text-left">
      {/* Header controls strip */}
      <div className="bg-[#dfccb0] border-b border-[#cbb89d] p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-white/70 text-[#3d2b17]">
            <Users className="w-4 h-4 text-[#3d2b17]" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase text-[#3d2b17] tracking-wider">
              BẢNG THỐNG KÊ CHI TIẾT HỌC SINH
            </h3>
            <p className="text-[11px] font-bold text-[#5c4327]">
              Tổng cộng {studentStats.length} học sinh trong danh sách thống kê.
            </p>
          </div>
        </div>

        {/* Search & Page size selector */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, mã HS, lớp..."
              className="w-full bg-white border border-[#cbb89d] rounded-xl py-1.5 pl-8 pr-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-bold text-[#5c4327] hidden sm:inline">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#cbb89d] rounded-xl py-1.5 px-2 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
              <option value="-1">Tất cả</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse text-xs text-left">
          <thead>
            <tr className="bg-[#ebdcc9]/50 border-b border-[#cbb89d] text-[11px] font-black text-[#3d2b17] uppercase tracking-wider select-none">
              <th className="py-3 px-3.5 text-center w-12">STT</th>
              <th 
                onClick={() => handleSort('name')}
                className="py-3 px-3.5 cursor-pointer hover:bg-[#dfccb0]/50 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Họ và Tên</span>
                  {renderSortIcon('name')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('classId')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-[#dfccb0]/50 transition w-20"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Lớp</span>
                  {renderSortIcon('classId')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('totalSessions')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-[#dfccb0]/50 transition w-24"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Tổng buổi</span>
                  {renderSortIcon('totalSessions')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('presentCount')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-[#dfccb0]/50 transition w-20 text-emerald-800"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Có mặt</span>
                  {renderSortIcon('presentCount')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('excusedCount')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-[#dfccb0]/50 transition w-22 text-sky-800"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Vắng CP</span>
                  {renderSortIcon('excusedCount')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('unexcusedCount')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-[#dfccb0]/50 transition w-22 text-rose-800"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Không phép</span>
                  {renderSortIcon('unexcusedCount')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('lateCount')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-[#dfccb0]/50 transition w-20 text-amber-800"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Đi trễ</span>
                  {renderSortIcon('lateCount')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('attendanceRate')}
                className="py-3 px-3.5 text-center cursor-pointer hover:bg-[#dfccb0]/50 transition w-36"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Chuyên cần (%)</span>
                  {renderSortIcon('attendanceRate')}
                </div>
              </th>
              <th className="py-3 px-3 text-center w-28">Đánh giá</th>
              <th className="py-3 px-3 text-center w-20">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 font-bold">
                  Không tìm thấy học sinh nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              paginatedList.map((stat, idx) => {
                const displayIndex = pageSize === -1 
                  ? idx + 1 
                  : (currentPage - 1) * pageSize + idx + 1;
                
                return (
                  <tr
                    key={stat.student.id}
                    onClick={() => onSelectStudent(stat)}
                    className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400">
                      {displayIndex}
                    </td>

                    {/* Họ và tên + Mã HS + Avatar */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-black text-amber-900 text-xs shrink-0 overflow-hidden">
                          {stat.student.avatarUrl ? (
                            <img src={stat.student.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{stat.student.gender === 'Nữ' ? '👧' : '👦'}</span>
                          )}
                        </div>
                        <div>
                          <strong className="text-slate-900 font-black block group-hover:text-amber-800 transition">
                            {stat.student.name}
                          </strong>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            MSHS: {stat.student.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Lớp */}
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                        {stat.student.classId}
                      </span>
                    </td>

                    {/* Tổng buổi */}
                    <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                      {stat.totalSessions}
                    </td>

                    {/* Có mặt */}
                    <td className="py-3 px-3 text-center font-black text-emerald-700 font-mono">
                      {stat.presentCount}
                    </td>

                    {/* Vắng có phép */}
                    <td className="py-3 px-3 text-center font-bold text-sky-700 font-mono">
                      {stat.excusedCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                          {stat.excusedCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    {/* Vắng không phép */}
                    <td className="py-3 px-3 text-center font-bold text-rose-700 font-mono">
                      {stat.unexcusedCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-black">
                          {stat.unexcusedCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    {/* Đi trễ */}
                    <td className="py-3 px-3 text-center font-bold text-amber-700 font-mono">
                      {stat.lateCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          {stat.lateCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    {/* Tỷ lệ chuyên cần (%) + Progress bar */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span className={stat.attendanceRate >= 90 ? 'text-emerald-700' : stat.attendanceRate >= 80 ? 'text-amber-700' : 'text-rose-700'}>
                            {stat.attendanceRate}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              stat.attendanceRate >= 95
                                ? 'bg-emerald-500'
                                : stat.attendanceRate >= 85
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${stat.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Đánh giá */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border ${stat.ratingColor.bg} ${stat.ratingColor.text} ${stat.ratingColor.border}`}
                      >
                        <span>{stat.rating}</span>
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(stat);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                        title="Bấm để xem ma trận lịch điểm danh chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="bg-[#dfccb0]/50 border-t border-[#cbb89d] p-3 flex flex-col sm:flex-row justify-between items-center gap-2.5 text-xs">
          <div className="text-[11px] font-bold text-[#5c4327]">
            Hiển thị <span className="font-black text-slate-800">{(currentPage - 1) * pageSize + 1}</span> -{' '}
            <span className="font-black text-slate-800">{Math.min(currentPage * pageSize, totalItems)}</span> /{' '}
            <span className="font-black text-slate-800">{totalItems}</span> học sinh
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#cbb89d] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-bold text-xs text-[#3d2b17]">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#cbb89d] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
