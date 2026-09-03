import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Search, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Check, 
  Copy, 
  X, 
  AlertTriangle, 
  Layers, 
  HardDrive, 
  Clock, 
  Activity, 
  Filter, 
  ArrowUpDown,
  Info
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Member } from '../types';

export interface CloudKeyRow {
  key: string;
  value: any;
  updated_at: string;
}

export interface CloudKeyInfo extends CloudKeyRow {
  category: string;
  categoryLabel: string;
  categoryColor: string;
  categoryBadgeBg: string;
  categoryBadgeText: string;
  categoryBadgeBorder: string;
  description: string;
  itemCount: number;
  itemType: 'array' | 'object' | 'string' | 'primitive';
  byteSize: number;
}

interface CloudKeysExplorerProps {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  currentUser?: Member | null;
}

// Format byte size to human readable (B, KB, MB)
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format timestamp to Vietnamese date-time + relative time
export function formatVietnameseDateTime(dateStr: string): { full: string; relative: string } {
  if (!dateStr) return { full: 'Chưa cập nhật', relative: 'Không rõ' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { full: dateStr, relative: '' };

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    const full = `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;

    // Relative time calculation
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);

    let relative = '';
    if (diffSec < 10) {
      relative = 'Vừa xong';
    } else if (diffSec < 60) {
      relative = `${diffSec} giây trước`;
    } else if (diffSec < 3600) {
      const min = Math.floor(diffSec / 60);
      relative = `${min} phút trước`;
    } else if (diffSec < 86400) {
      const h = Math.floor(diffSec / 3600);
      relative = `${h} giờ trước`;
    } else {
      const days = Math.floor(diffSec / 86400);
      relative = `${days} ngày trước`;
    }

    return { full, relative };
  } catch (e) {
    return { full: dateStr, relative: '' };
  }
}

// Classify key and provide rich metadata
export function analyzeCloudKey(row: CloudKeyRow): CloudKeyInfo {
  const k = row.key;
  const val = row.value;

  // 1. Calculate byte size
  let byteSize = 0;
  try {
    const str = typeof val === 'string' ? val : JSON.stringify(val);
    byteSize = new Blob([str]).size;
  } catch (e) {
    byteSize = 0;
  }

  // 2. Determine Item Type & Count
  let itemType: 'array' | 'object' | 'string' | 'primitive' = 'primitive';
  let itemCount = 0;

  if (Array.isArray(val)) {
    itemType = 'array';
    itemCount = val.length;
  } else if (val !== null && typeof val === 'object') {
    itemType = 'object';
    itemCount = Object.keys(val).length;
  } else if (typeof val === 'string') {
    itemType = 'string';
    itemCount = val.length;
  } else {
    itemType = 'primitive';
    itemCount = 1;
  }

  // 3. Category & Description Resolver
  let category = 'system';
  let categoryLabel = 'Hệ thống';
  let categoryColor = '#64748b';
  let categoryBadgeBg = 'bg-slate-100';
  let categoryBadgeText = 'text-slate-700';
  let categoryBadgeBorder = 'border-slate-300';
  let description = 'Dữ liệu cấu hình hệ thống';

  if (k === 'school_members') {
    category = 'auth';
    categoryLabel = 'Tài khoản & Phân quyền';
    categoryColor = '#8b5cf6';
    categoryBadgeBg = 'bg-purple-100';
    categoryBadgeText = 'text-purple-800';
    categoryBadgeBorder = 'border-purple-300';
    description = 'Danh sách tài khoản Admin và Giáo viên toàn trường';
  } else if (k === 'school_grades') {
    category = 'classes';
    categoryLabel = 'Khối lớp';
    categoryColor = '#0284c7';
    categoryBadgeBg = 'bg-sky-100';
    categoryBadgeText = 'text-sky-800';
    categoryBadgeBorder = 'border-sky-300';
    description = 'Danh mục các khối lớp (Khối 3, Khối 4, Khối 5...)';
  } else if (k === 'school_classes') {
    category = 'classes';
    categoryLabel = 'Lớp học';
    categoryColor = '#0284c7';
    categoryBadgeBg = 'bg-sky-100';
    categoryBadgeText = 'text-sky-800';
    categoryBadgeBorder = 'border-sky-300';
    description = 'Danh sách các lớp học chính thức trong năm học';
  } else if (k === 'school_students') {
    category = 'students';
    categoryLabel = 'Học sinh';
    categoryColor = '#10b981';
    categoryBadgeBg = 'bg-emerald-100';
    categoryBadgeText = 'text-emerald-800';
    categoryBadgeBorder = 'border-emerald-300';
    description = 'Hồ sơ thông tin học sinh toàn trường';
  } else if (k === 'school_computers') {
    category = 'lab';
    categoryLabel = 'Máy tính Phòng Lab';
    categoryColor = '#f59e0b';
    categoryBadgeBg = 'bg-amber-100';
    categoryBadgeText = 'text-amber-800';
    categoryBadgeBorder = 'border-amber-300';
    description = 'Danh sách máy tính, máy ghép và trạng thái hoạt động';
  } else if (k === 'school_labs' || k.startsWith('school_lab_') || k === 'school_computer_reports') {
    category = 'lab';
    categoryLabel = k === 'school_computer_reports' ? 'Báo cáo phòng máy' : 'Phòng thực hành';
    categoryColor = '#0891b2';
    categoryBadgeBg = 'bg-cyan-100';
    categoryBadgeText = 'text-cyan-800';
    categoryBadgeBorder = 'border-cyan-300';
    description = k === 'school_labs' 
      ? 'Danh mục các phòng máy thực hành' 
      : k === 'school_lab_bookings' 
      ? 'Lịch đăng ký mượn phòng máy của giáo viên' 
      : k === 'school_lab_incidents' 
      ? 'Nhật ký sự cố hỏng hóc máy tính' 
      : k === 'school_computer_reports'
      ? 'Lịch sử báo cáo cơ sở vật chất phòng máy của giáo viên'
      : 'Lịch sử bảo trì thiết bị phòng máy';
  } else if (k.includes('attendance')) {
    category = 'attendance';
    categoryLabel = 'Điểm danh';
    categoryColor = '#06b6d4';
    categoryBadgeBg = 'bg-cyan-100';
    categoryBadgeText = 'text-cyan-800';
    categoryBadgeBorder = 'border-cyan-300';
    description = k.includes('20') 
      ? `Dữ liệu điểm danh chuyên cần ngày ${k.split('_').pop()}` 
      : 'Tổng hợp dữ liệu chuyên cần điểm danh';
  } else if (k.includes('evaluation')) {
    category = 'evaluation';
    categoryLabel = 'Đánh giá tiết học';
    categoryColor = '#3b82f6';
    categoryBadgeBg = 'bg-blue-100';
    categoryBadgeText = 'text-blue-800';
    categoryBadgeBorder = 'border-blue-300';
    description = k.includes('20') 
      ? `Nhận xét và chấm điểm thực hành ngày ${k.split('_').pop()}` 
      : 'Tổng hợp nhận xét và đánh giá tiết học';
  } else if (k.includes('seating')) {
    category = 'seating';
    categoryLabel = 'Sơ đồ chỗ ngồi';
    categoryColor = '#6366f1';
    categoryBadgeBg = 'bg-indigo-100';
    categoryBadgeText = 'text-indigo-800';
    categoryBadgeBorder = 'border-indigo-300';
    description = 'Sơ đồ bố trí vị trí ngồi máy tính theo từng lớp';
  } else if (k.includes('emulation')) {
    category = 'emulation';
    categoryLabel = 'Thi đua & Đổi sao';
    categoryColor = '#ec4899';
    categoryBadgeBg = 'bg-pink-100';
    categoryBadgeText = 'text-pink-800';
    categoryBadgeBorder = 'border-pink-300';
    description = 'Bảng tích lũy sao thi đua, đổi quà và huy hiệu';
  } else if (k.includes('garden') || k === 'school_custom_seed_sets' || k === 'school_garden_rewards') {
    category = 'garden';
    categoryLabel = 'Vườn Tri Thức';
    categoryColor = '#84cc16';
    categoryBadgeBg = 'bg-lime-100';
    categoryBadgeText = 'text-lime-800';
    categoryBadgeBorder = 'border-lime-300';
    description = k === 'school_custom_seed_sets' 
      ? 'Kho bộ sưu tập 7 cấp độ ảnh hạt giống cây trồng' 
      : k === 'school_garden_rewards' 
      ? 'Danh mục phần quà đổi điểm thưởng tưới cây' 
      : 'Cấp độ sinh trưởng và điểm chăm sóc cây học sinh';
  } else if (k === 'school_timetable_data') {
    category = 'schedule';
    categoryLabel = 'Thời khóa biểu';
    categoryColor = '#14b8a6';
    categoryBadgeBg = 'bg-teal-100';
    categoryBadgeText = 'text-teal-800';
    categoryBadgeBorder = 'border-teal-300';
    description = 'Lịch phân công giảng dạy môn Tin học theo tuần';
  } else if (k === 'school_documents') {
    category = 'resources';
    categoryLabel = 'Tài liệu & Kế hoạch';
    categoryColor = '#f97316';
    categoryBadgeBg = 'bg-orange-100';
    categoryBadgeText = 'text-orange-800';
    categoryBadgeBorder = 'border-orange-300';
    description = 'Kế hoạch dạy học, giáo án điện tử PPT môn Tin';
  } else if (k === 'school_quotes') {
    category = 'resources';
    categoryLabel = 'Danh ngôn học tập';
    categoryColor = '#eab308';
    categoryBadgeBg = 'bg-yellow-100';
    categoryBadgeText = 'text-yellow-800';
    categoryBadgeBorder = 'border-yellow-300';
    description = 'Câu châm ngôn truyền cảm hứng học tập mỗi ngày';
  } else if (k.startsWith('school_otp_') || k.includes('vault') || k === 'custom_avatars_list' || k === 'school_pc_frame_config') {
    category = 'security';
    categoryLabel = 'Bảo mật & Cấu hình';
    categoryColor = '#64748b';
    categoryBadgeBg = 'bg-slate-100';
    categoryBadgeText = 'text-slate-800';
    categoryBadgeBorder = 'border-slate-300';
    description = k === 'school_otp_config' 
      ? 'Khóa mã hóa Cloud Vault Gmail OTP' 
      : k === 'school_otp_history' 
      ? 'Nhật ký gửi mã OTP xác thực' 
      : k === 'custom_avatars_list' 
      ? 'Kho ảnh đại diện tùy chỉnh' 
      : 'Cấu hình khung hình PC và bảo mật';
  }

  return {
    ...row,
    category,
    categoryLabel,
    categoryColor,
    categoryBadgeBg,
    categoryBadgeText,
    categoryBadgeBorder,
    description,
    itemCount,
    itemType,
    byteSize
  };
}

export const CloudKeysExplorer: React.FC<CloudKeysExplorerProps> = ({
  showToast,
  currentUser
}) => {
  const [keysData, setKeysData] = useState<CloudKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastFetchedTime, setLastFetchedTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'size' | 'records' | 'key'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pingMs, setPingMs] = useState<number | null>(null);

  // Modals
  const [inspectingKey, setInspectingKey] = useState<CloudKeyInfo | null>(null);
  const [deletingKey, setDeletingKey] = useState<CloudKeyInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // 1. FETCH ALL KEYS FROM SUPABASE
  const fetchCloudKeys = async () => {
    setIsLoading(true);
    const startPing = performance.now();
    try {
      const { data, error } = await supabase
        .from('school_states')
        .select('key, value, updated_at');

      const endPing = performance.now();
      setPingMs(Math.round(endPing - startPing));

      if (error) {
        showToast('Lỗi khi tải danh sách khóa Supabase: ' + error.message, 'error');
        setKeysData([]);
      } else if (data) {
        const analyzed = data.map(analyzeCloudKey);
        setKeysData(analyzed);
        setLastFetchedTime(new Date().toISOString());
      }
    } catch (e: any) {
      showToast('Lỗi kết nối tới Supabase: ' + (e?.message || e), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudKeys();
  }, []);

  // 2. STATS COMPUTATION
  const stats = useMemo(() => {
    const totalKeys = keysData.length;
    const totalBytes = keysData.reduce((acc, k) => acc + k.byteSize, 0);
    const activeKeys = keysData.filter(k => k.itemCount > 0).length;
    const emptyKeys = totalKeys - activeKeys;

    // Find most recently updated key
    let mostRecent: CloudKeyInfo | null = null;
    if (keysData.length > 0) {
      mostRecent = [...keysData].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
    }

    return {
      totalKeys,
      totalBytes,
      activeKeys,
      emptyKeys,
      mostRecent
    };
  }, [keysData]);

  // 3. FILTER & SORT
  const filteredAndSortedKeys = useMemo(() => {
    let result = keysData.filter(item => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.key.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) || 
        item.categoryLabel.toLowerCase().includes(q);

      // Category filter
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchSearch && matchCat;
    });

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'updated') {
        cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      } else if (sortBy === 'size') {
        cmp = a.byteSize - b.byteSize;
      } else if (sortBy === 'records') {
        cmp = a.itemCount - b.itemCount;
      } else if (sortBy === 'key') {
        cmp = a.key.localeCompare(b.key);
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [keysData, searchQuery, categoryFilter, sortBy, sortOrder]);

  // 4. ACTION: DELETE KEY
  const handleDeleteKey = async () => {
    if (!deletingKey) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('school_states')
        .delete()
        .eq('key', deletingKey.key);

      if (error) {
        showToast('Xóa khóa thất bại: ' + error.message, 'error');
      } else {
        showToast(`Đã xóa thành công khóa "${deletingKey.key}" trên Supabase Cloud!`, 'success');
        setKeysData(prev => prev.filter(k => k.key !== deletingKey.key));
        setDeletingKey(null);
      }
    } catch (e: any) {
      showToast('Lỗi khi xóa khóa: ' + (e?.message || e), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 5. ACTION: COPY JSON
  const handleCopyJson = (val: any) => {
    try {
      const text = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
      navigator.clipboard.writeText(text);
      setCopiedKey(true);
      showToast('Đã sao chép nội dung JSON vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (e) {
      showToast('Không thể sao chép JSON', 'error');
    }
  };

  const categoriesList = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'auth', label: 'Tài khoản' },
    { id: 'classes', label: 'Lớp & Khối' },
    { id: 'students', label: 'Học sinh' },
    { id: 'lab', label: 'Phòng máy' },
    { id: 'attendance', label: 'Điểm danh' },
    { id: 'evaluation', label: 'Đánh giá' },
    { id: 'seating', label: 'Chỗ ngồi' },
    { id: 'emulation', label: 'Thi đua' },
    { id: 'garden', label: 'Vườn Tri Thức' },
    { id: 'schedule', label: 'TKB' },
    { id: 'resources', label: 'Tài liệu & Danh ngôn' },
    { id: 'security', label: 'Cấu hình' }
  ];

  return (
    <div className="bg-[#fbf7ee] border-2 border-[#d6c4a8] rounded-3xl p-6 shadow-md space-y-6 text-left animate-fadeIn">
      
      {/* 1. HEADER & SUMMARY METRICS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#e5dacf]">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#287866] to-[#1a5346] p-3.5 rounded-2xl text-white shadow-md">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-[#4a2e16] uppercase tracking-wide">
                Trình Khám Phá Khóa Dữ Liệu Đám Mây (Cloud Keys Explorer)
              </h3>
              <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                Supabase Live
              </span>
            </div>
            <p className="text-xs text-[#78350f] font-semibold mt-0.5">
              Theo dõi chi tiết số lượng bản ghi, dung lượng và thời gian cập nhật của từng bảng dữ liệu trên Cloud
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {pingMs !== null && (
            <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#d6c4a8] text-[11px] font-bold text-[#5c4326] shadow-2xs">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Ping: <strong className="text-emerald-700">{pingMs}ms</strong></span>
            </div>
          )}

          <button
            type="button"
            onClick={fetchCloudKeys}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white font-black text-xs px-4 py-2 rounded-full border border-[#16473c] shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Tải lại danh sách khóa từ Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang đọc...' : 'Làm mới khóa'}</span>
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-2xl border border-[#e5dacf] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#78350f] font-bold mb-1">
            <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-indigo-500" /> Tổng số khóa</span>
          </div>
          <div className="text-xl font-black text-[#4a2e16]">
            {stats.totalKeys} <span className="text-xs font-semibold text-slate-500">khóa</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
            {stats.activeKeys} khóa có dữ liệu • {stats.emptyKeys} khóa rỗng
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#e5dacf] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#78350f] font-bold mb-1">
            <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5 text-blue-500" /> Tổng dung lượng</span>
          </div>
          <div className="text-xl font-black text-[#4a2e16]">
            {formatBytes(stats.totalBytes)}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Ước tính tải JSON
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#e5dacf] shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-xs text-[#78350f] font-bold mb-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> Cập nhật mới nhất</span>
          </div>
          {stats.mostRecent ? (
            <div>
              <div className="text-xs font-black text-[#4a2e16] truncate font-mono">
                {stats.mostRecent.key}
              </div>
              <div className="text-[10px] text-[#78350f] font-semibold mt-0.5 flex items-center gap-2">
                <span>{formatVietnameseDateTime(stats.mostRecent.updated_at).full}</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-black text-[9px]">
                  {formatVietnameseDateTime(stats.mostRecent.updated_at).relative}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">Chưa có dữ liệu khóa</div>
          )}
        </div>
      </div>

      {/* 3. SEARCH & CATEGORY FILTER TOOLBAR */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên khóa, mô tả hoặc danh mục..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#d6c4a8] rounded-xl text-xs text-[#3d2514] font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#287866] shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-[#78350f] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-white border border-[#d6c4a8] text-xs font-bold text-[#4a2e16] px-3 py-1.5 rounded-xl focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="updated">Thời gian cập nhật</option>
              <option value="size">Dung lượng (Bytes)</option>
              <option value="records">Số lượng bản ghi</option>
              <option value="key">Tên khóa (A-Z)</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="bg-white border border-[#d6c4a8] text-xs font-black text-[#4a2e16] px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            >
              {sortOrder === 'desc' ? '⬇️ Giảm dần' : '⬆️ Tăng dần'}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-black text-[#78350f] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Lọc:
          </span>
          {categoriesList.map(cat => {
            const isSelected = categoryFilter === cat.id;
            const count = cat.id === 'ALL' 
              ? keysData.length 
              : keysData.filter(k => k.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  isSelected 
                    ? 'bg-[#287866] text-white border-[#16473c] shadow-xs' 
                    : 'bg-white hover:bg-[#ebdcc4] text-[#5c4326] border-[#d6c4a8]'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. KEYS TABLE */}
      <div className="bg-white rounded-2xl border border-[#d6c4a8] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#287866] animate-spin mx-auto" />
            <p className="text-xs font-extrabold text-[#78350f]">Đang tra cứu danh sách khóa trực tiếp từ Supabase Cloud...</p>
          </div>
        ) : filteredAndSortedKeys.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Info className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-extrabold text-[#4a2e16]">Không tìm thấy khóa dữ liệu nào phù hợp</p>
            <p className="text-xs text-[#78350f]">Hãy thử tìm kiếm với từ khóa khác hoặc chuyển danh mục lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f5ebd9] border-b border-[#e5dacf] text-[#4a2e16] uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Tên Khóa (Supabase Key) & Danh Mục</th>
                  <th className="py-3 px-3 text-center">Bản Ghi / Cấu Trúc</th>
                  <th className="py-3 px-3 text-right">Dung Lượng</th>
                  <th className="py-3 px-4">Thời Gian Cập Nhật</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedKeys.map((item, idx) => {
                  const dt = formatVietnameseDateTime(item.updated_at);
                  const isRecent = Date.now() - new Date(item.updated_at).getTime() < 3600000; // < 1 hour

                  return (
                    <tr 
                      key={item.key} 
                      className={`hover:bg-[#faf4e8] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfaf5]'}`}
                    >
                      {/* Key & Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-[#287866] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {item.key}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${item.categoryBadgeBg} ${item.categoryBadgeText} ${item.categoryBadgeBorder}`}>
                              {item.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#78350f] font-semibold">
                            {item.description}
                          </p>
                        </div>
                      </td>

                      {/* Records Count */}
                      <td className="py-3.5 px-3 text-center">
                        {item.itemType === 'array' ? (
                          <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                            item.itemCount > 0 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            <strong>{item.itemCount}</strong> {item.itemCount === 1 ? 'mục' : 'mục'}
                          </span>
                        ) : item.itemType === 'object' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            <strong>{item.itemCount}</strong> khóa con
                          </span>
                        ) : (
                          <span className="inline-flex items-center font-bold text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            Chuỗi ({item.itemCount} ký tự)
                          </span>
                        )}
                      </td>

                      {/* Byte Size */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#4a2e16]">
                        {formatBytes(item.byteSize)}
                      </td>

                      {/* Updated At */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs text-[#3d2514] font-bold">
                            {dt.full}
                          </div>
                          <div className="text-[10px] font-bold text-[#78350f] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className={isRecent ? 'text-emerald-600 font-extrabold' : 'text-slate-500'}>
                              {dt.relative}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {item.itemCount > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 text-emerald-600" /> Có dữ liệu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Trống (0)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingKey(item)}
                            className="inline-flex items-center gap-1 bg-gradient-to-b from-[#287866] to-[#1d5c4e] hover:from-[#318f7a] hover:to-[#226e5e] text-white text-[11px] font-black px-2.5 py-1.5 rounded-lg border border-[#16473c] shadow-2xs transition-all cursor-pointer active:scale-95"
                            title="Xem chi tiết JSON"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingKey(item)}
                            className="inline-flex items-center p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all cursor-pointer active:scale-95"
                            title="Xóa khóa này khỏi Cloud"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL: JSON INSPECTOR */}
      {inspectingKey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#fdfaf5] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-[#d6c4a8] transform transition-all animate-fadeIn text-left flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#287866] to-[#1a5346] p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-200" />
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider">
                    Chi Tiết Khóa: <span className="font-mono text-amber-300">{inspectingKey.key}</span>
                  </h4>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    {inspectingKey.description} • {formatBytes(inspectingKey.byteSize)} • {inspectingKey.itemCount} bản ghi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingKey(null)}
                className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: JSON View */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#78350f] font-bold">
                <span>Định dạng dữ liệu JSON lưu trữ trên Supabase:</span>
                <button
                  type="button"
                  onClick={() => handleCopyJson(inspectingKey.value)}
                  className="inline-flex items-center gap-1 bg-[#ecdcc7] hover:bg-[#dfcdb5] text-[#4a2e16] text-xs font-black px-3 py-1 rounded-full border border-[#d6c4a8] transition-all cursor-pointer active:scale-95"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" /> Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Sao chép JSON
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#231811] text-[#fde047] font-mono text-[11px] p-4 rounded-2xl border border-[#4a2e16] overflow-x-auto max-h-[50vh] leading-relaxed shadow-inner">
                <pre className="whitespace-pre-wrap select-all">
                  {typeof inspectingKey.value === 'string' 
                    ? inspectingKey.value 
                    : JSON.stringify(inspectingKey.value, null, 2)}
                </pre>
              </div>

              <div className="bg-[#f0e6d6] p-3 rounded-xl border border-[#d6c4a8] text-xs text-[#5c4326] space-y-1 font-semibold">
                <div><strong>Khóa:</strong> <code className="font-mono text-emerald-800">{inspectingKey.key}</code></div>
                <div><strong>Thời gian cập nhật:</strong> {formatVietnameseDateTime(inspectingKey.updated_at).full}</div>
                <div><strong>Dung lượng:</strong> {formatBytes(inspectingKey.byteSize)} ({inspectingKey.byteSize} bytes)</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f5ebd9] p-4 border-t border-[#e5dacf] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectingKey(null)}
                className="bg-[#287866] hover:bg-[#1f6253] text-white font-black text-xs px-5 py-2 rounded-full border border-[#16473c] shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL: DELETE CONFIRMATION */}
      {deletingKey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-fadeIn text-left">
            
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 font-extrabold text-sm uppercase tracking-wide text-white">
                <AlertTriangle className="w-5 h-5 text-yellow-300 animate-pulse" />
                Xác nhận xóa khóa Cloud
              </div>
              <button
                type="button"
                onClick={() => setDeletingKey(null)}
                className="bg-black/10 hover:bg-black/25 text-white rounded-full p-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                Thầy/Cô có chắc chắn muốn xóa vĩnh viễn khóa dữ liệu sau khỏi Supabase Cloud không?
              </p>
              
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl font-mono text-xs font-black text-rose-800 break-all">
                {deletingKey.key}
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Hành động này sẽ xóa dữ liệu bảng này trên máy chủ. Nếu cần thiết, dữ liệu có thể được nạp lại bằng nút "Đẩy đè dữ liệu".
              </p>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingKey(null)}
                disabled={isDeleting}
                className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2 rounded-full border border-slate-300 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteKey}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-2 rounded-full border border-rose-700 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
