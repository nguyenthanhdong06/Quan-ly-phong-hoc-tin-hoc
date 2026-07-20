import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { 
  Printer, 
  Download, 
  Plus, 
  Trash2, 
  Eye, 
  FileText, 
  Save, 
  RefreshCw, 
  Check, 
  PlusCircle, 
  ArrowLeft,
  BookOpen,
  X,
  AlertTriangle
} from 'lucide-react';

interface ComputerReportTabProps {
  currentUser: Member | null;
}

interface GeneralInfo {
  tieuDeBaoCao?: string;
  donVi: string;
  diaPhuong: string;
  nguoiPhuTrach: string;
  thoiGianBaoCao: string;
}

interface AssetRow {
  stt: number;
  hangMuc: string;
  tongSo: string;
  hoatDongTot: string;
  huHong: string;
  ghiChu: string;
  isCustom?: boolean;
}

interface BrokenDetailRow {
  id: string;
  stt: number;
  thietBi: string;
  viTri: string;
  hienTrang: string;
  mucDo: string;
}

interface AdditionRow {
  id: string;
  stt: number;
  thietBi: string;
  soLuong: string;
  lyDo: string;
}

interface SavedReport {
  id: string;
  title: string;
  date: string;
  creator: string;
  generalInfo: GeneralInfo;
  assets: AssetRow[];
  brokenDetails: BrokenDetailRow[];
  additions: AdditionRow[];
  ngayKy: string;
  thangKy: string;
  namKy: string;
}

const DEVICE_OPTIONS = [
  'Máy tính',
  'Màn hình',
  'Bàn phím',
  'Chuột',
  'Miếng lót chuột',
  'Tai nghe',
  'Bộ phát Wifi',
  'Máy chiếu/Tivi',
  'Loa',
  'Dây mạng',
  'Ổ điện, dây điện',
  'Ổ cắm điện',
  'Quạt',
  'Điều hòa (nếu có)'
];

const LOCATION_OPTIONS = [
  'Máy Giáo viên',
  ...Array.from({ length: 35 }, (_, i) => `Máy số ${(i + 1).toString().padStart(2, '0')}`),
  'Bàn giáo viên',
  'Tủ thiết bị',
];

const DEFAULT_ASSETS: AssetRow[] = [
  { stt: 1, hangMuc: 'Máy tính', tongSo: '24', hoatDongTot: '22', huHong: '2', ghiChu: '2 máy lỗi nguồn' },
  { stt: 2, hangMuc: 'Màn hình', tongSo: '24', hoatDongTot: '23', huHong: '1', ghiChu: '1 màn hình nhấp nháy' },
  { stt: 3, hangMuc: 'Bàn phím', tongSo: '24', hoatDongTot: '23', huHong: '1', ghiChu: 'Liệt phím Space' },
  { stt: 4, hangMuc: 'Chuột', tongSo: '24', hoatDongTot: '23', huHong: '1', ghiChu: 'Hỏng con lăn' },
  { stt: 5, hangMuc: 'Miếng lót chuột', tongSo: '24', hoatDongTot: '24', huHong: '0', ghiChu: 'Tốt' },
  { stt: 6, hangMuc: 'Tai nghe', tongSo: '24', hoatDongTot: '20', huHong: '4', ghiChu: 'Mất âm thanh 1 bên' },
  { stt: 7, hangMuc: 'Bộ phát Wifi', tongSo: '2', hoatDongTot: '2', huHong: '0', ghiChu: 'Hoạt động ổn định' },
  { stt: 8, hangMuc: 'Máy chiếu/Tivi', tongSo: '1', hoatDongTot: '1', huHong: '0', ghiChu: 'Rõ nét' },
  { stt: 9, hangMuc: 'Loa', tongSo: '1', hoatDongTot: '1', huHong: '0', ghiChu: 'Tốt' },
  { stt: 10, hangMuc: 'Dây mạng', tongSo: '24', hoatDongTot: '24', huHong: '0', ghiChu: 'Ổn định' },
  { stt: 11, hangMuc: 'Ổ điện, dây điện', tongSo: '12', hoatDongTot: '11', huHong: '1', ghiChu: 'Cần gia cố 1 ổ cắm' },
  { stt: 12, hangMuc: 'Quạt', tongSo: '4', hoatDongTot: '4', huHong: '0', ghiChu: 'Mát' },
  { stt: 13, hangMuc: 'Điều hòa (nếu có)', tongSo: '2', hoatDongTot: '2', huHong: '0', ghiChu: 'Tốt' },
];

const DEFAULT_BROKEN: BrokenDetailRow[] = [
  { id: 'b-1', stt: 1, thietBi: 'Bàn phím', viTri: 'Máy số 05', hienTrang: 'Liệt nhiều phím, không sử dụng được', mucDo: 'Cần thay mới' },
  { id: 'b-2', stt: 2, thietBi: 'Chuột', viTri: 'Máy số 12', hienTrang: 'Không nhận tín hiệu', mucDo: 'Cần thay mới' },
  { id: 'b-3', stt: 3, thietBi: 'Máy tính', viTri: 'Máy số 18', hienTrang: 'Không khởi động', mucDo: 'Cần kiểm tra' },
  { id: 'b-4', stt: 4, thietBi: 'Màn hình', viTri: 'Máy số 03', hienTrang: 'Màn hình nhấp nháy', mucDo: 'Cần sửa chữa' },
  { id: 'b-5', stt: 5, thietBi: 'Tai nghe', viTri: 'Máy số 07', hienTrang: 'Mất âm thanh', mucDo: 'Cần thay mới' },
];

const DEFAULT_ADDITIONS: AdditionRow[] = [
  { id: 'a-1', stt: 1, thietBi: 'Bàn phím', soLuong: '2', lyDo: 'Thay thiết bị hư hỏng' },
  { id: 'a-2', stt: 2, thietBi: 'Chuột', soLuong: '2', lyDo: 'Thay thiết bị hư hỏng' },
  { id: 'a-3', stt: 3, thietBi: 'Tai nghe', soLuong: '5', lyDo: 'Phục vụ học sinh' },
  { id: 'a-4', stt: 4, thietBi: 'Dây mạng', soLuong: '1 cuộn', lyDo: 'Dự phòng sửa chữa' },
  { id: 'a-5', stt: 5, thietBi: 'Ổ cắm điện', soLuong: '4', lyDo: 'Bổ sung an toàn điện' },
  { id: 'a-6', stt: 6, thietBi: 'Máy tính', soLuong: '1', lyDo: 'Thay máy đã xuống cấp' },
];

export default function ComputerReportTab({ currentUser }: ComputerReportTabProps) {
  // General Form States
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({
    tieuDeBaoCao: 'BÁO CÁO CƠ SỞ VẬT CHẤT PHÒNG MÁY TÍNH',
    donVi: 'Trường Tiểu học Long Định',
    diaPhuong: 'Xã Long Định',
    nguoiPhuTrach: currentUser?.name || 'Nguyễn Thanh Đồng',
    thoiGianBaoCao: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  });

  const [assets, setAssets] = useState<AssetRow[]>(DEFAULT_ASSETS);
  const [brokenDetails, setBrokenDetails] = useState<BrokenDetailRow[]>(DEFAULT_BROKEN);
  const [additions, setAdditions] = useState<AdditionRow[]>(DEFAULT_ADDITIONS);

  // Signing date details
  const [ngayKy, setNgayKy] = useState<string>(new Date().getDate().toString().padStart(2, '0'));
  const [thangKy, setThangKy] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [namKy, setNamKy] = useState<string>(new Date().getFullYear().toString());

  // Report List for local history persistence
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Tab UI modes
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  // Load saved reports on mount
  useEffect(() => {
    const local = localStorage.getItem('school_computer_reports');
    if (local) {
      try {
        setSavedReports(JSON.parse(local));
      } catch (e) {
        console.error('Error parsing saved reports', e);
      }
    }
  }, []);

  // Update general reporter when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setGeneralInfo(prev => ({
        ...prev,
        nguoiPhuTrach: currentUser.name
      }));
    }
  }, [currentUser]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Reset form to default template
  const handleResetForm = () => {
    if (window.confirm('Bạn có chắc chắn muốn thiết lập lại toàn bộ nội dung mẫu?')) {
      setGeneralInfo({
        tieuDeBaoCao: 'BÁO CÁO CƠ SỞ VẬT CHẤT PHÒNG MÁY TÍNH',
        donVi: 'Trường Tiểu học Long Định',
        diaPhuong: 'Xã Long Định',
        nguoiPhuTrach: currentUser?.name || 'Nguyễn Thanh Đồng',
        thoiGianBaoCao: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      });
      setAssets(DEFAULT_ASSETS);
      setBrokenDetails(DEFAULT_BROKEN);
      setAdditions(DEFAULT_ADDITIONS);
      setNgayKy(new Date().getDate().toString().padStart(2, '0'));
      setThangKy((new Date().getMonth() + 1).toString().padStart(2, '0'));
      setNamKy(new Date().getFullYear().toString());
      setActiveReportId(null);
      showToast('Đã khôi phục dữ liệu mẫu chuẩn giống ảnh 100%');
    }
  };

  // Handle general field changes
  const handleGeneralChange = (key: keyof GeneralInfo, val: string) => {
    setGeneralInfo(prev => ({ ...prev, [key]: val }));
  };

  // Handle Section II Asset cell changes
  const handleAssetChange = (idx: number, key: keyof AssetRow, val: string) => {
    const updated = [...assets];
    updated[idx] = { ...updated[idx], [key]: val };
    setAssets(updated);
  };

  const addAssetRow = () => {
    const nextStt = assets.length + 1;
    const newRow: AssetRow = {
      stt: nextStt,
      hangMuc: '',
      tongSo: '0',
      hoatDongTot: '0',
      huHong: '0',
      ghiChu: '',
      isCustom: true
    };
    setAssets([...assets, newRow]);
  };

  const removeAssetRow = (index: number) => {
    const filtered = assets.filter((_, idx) => idx !== index);
    const reset = filtered.map((row, idx) => ({
      ...row,
      stt: idx + 1
    }));
    setAssets(reset);
  };

  // Section III Add / Remove Rows
  const addBrokenRow = () => {
    const nextStt = brokenDetails.length + 1;
    const newRow: BrokenDetailRow = {
      id: `b-custom-${Date.now()}`,
      stt: nextStt,
      thietBi: '',
      viTri: 'Máy số ...',
      hienTrang: '',
      mucDo: 'Cần sửa chữa'
    };
    setBrokenDetails([...brokenDetails, newRow]);
  };

  const removeBrokenRow = (id: string) => {
    const filtered = brokenDetails.filter(row => row.id !== id);
    // Recalculate STT
    const reset = filtered.map((row, index) => ({
      ...row,
      stt: index + 1
    }));
    setBrokenDetails(reset);
  };

  const handleBrokenChange = (id: string, key: keyof BrokenDetailRow, val: string) => {
    const updated = brokenDetails.map(row => {
      if (row.id === id) {
        return { ...row, [key]: val };
      }
      return row;
    });
    setBrokenDetails(updated);
  };

  // Section IV Add / Remove Rows
  const addAdditionRow = () => {
    const nextStt = additions.length + 1;
    const newRow: AdditionRow = {
      id: `a-custom-${Date.now()}`,
      stt: nextStt,
      thietBi: '',
      soLuong: '1',
      lyDo: 'Thay thiết bị hư hỏng'
    };
    setAdditions([...additions, newRow]);
  };

  const removeAdditionRow = (id: string) => {
    const filtered = additions.filter(row => row.id !== id);
    // Recalculate STT
    const reset = filtered.map((row, index) => ({
      ...row,
      stt: index + 1
    }));
    setAdditions(reset);
  };

  const handleAdditionChange = (id: string, key: keyof AdditionRow, val: string) => {
    const updated = additions.map(row => {
      if (row.id === id) {
        return { ...row, [key]: val };
      }
      return row;
    });
    setAdditions(updated);
  };

  // Save report to browser history
  const handleSaveReport = () => {
    const id = activeReportId || `rep-${Date.now()}`;
    const reportTitle = `Báo cáo ngày ${generalInfo.thoiGianBaoCao} - ${generalInfo.nguoiPhuTrach}`;
    
    const newReport: SavedReport = {
      id,
      title: reportTitle,
      date: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      creator: generalInfo.nguoiPhuTrach,
      generalInfo,
      assets,
      brokenDetails,
      additions,
      ngayKy,
      thangKy,
      namKy
    };

    let updatedList: SavedReport[];
    if (activeReportId) {
      updatedList = savedReports.map(r => r.id === activeReportId ? newReport : r);
      showToast('Cập nhật báo cáo thành công!');
    } else {
      updatedList = [newReport, ...savedReports];
      setActiveReportId(id);
      showToast('Đã lưu báo cáo mới vào lịch sử phòng máy!');
    }

    setSavedReports(updatedList);
    localStorage.setItem('school_computer_reports', JSON.stringify(updatedList));
  };

  // Load a report from history
  const handleLoadReport = (rep: SavedReport) => {
    setGeneralInfo(rep.generalInfo);
    setAssets(rep.assets);
    setBrokenDetails(rep.brokenDetails);
    setAdditions(rep.additions);
    setNgayKy(rep.ngayKy || '01');
    setThangKy(rep.thangKy || '01');
    setNamKy(rep.namKy || '2026');
    setActiveReportId(rep.id);
    setViewMode('edit');
    showToast(`Đã tải báo cáo của ${rep.creator}`);
  };

  // Delete a report from history
  const handleDeleteReport = (id: string) => {
    const filtered = savedReports.filter(r => r.id !== id);
    setSavedReports(filtered);
    localStorage.setItem('school_computer_reports', JSON.stringify(filtered));
    if (activeReportId === id) {
      setActiveReportId(null);
    }
    setDeleteConfirmId(null);
    showToast('Đã xóa báo cáo!');
  };

  // Helper to construct the HTML representation for both direct print & Word doc conversion
  const generateOfficialHTML = (isWord: boolean = false) => {
    const containerStyle = isWord 
      ? "font-family: 'Times New Roman', Times, serif; color: black; line-height: 1.4; background: white; font-size: 11pt;"
      : "font-family: 'Times New Roman', Times, serif; color: black; line-height: 1.4; padding: 1.5cm; max-width: 21cm; margin: 0 auto; background: white; font-size: 11pt;";
    return `
      <div style="${containerStyle}">
        <!-- ĐẦU TRANG -->
        <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="width: 45%; text-align: center; vertical-align: top; padding: 0;">
              <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; color: black;">UBND XÃ LONG ĐỊNH</div>
              <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1.5px; color: black; margin-top: 2px;">TRƯỜNG TH LONG ĐỊNH</div>
            </td>
            <td style="width: 55%; text-align: center; vertical-align: top; padding: 0;">
              <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; color: black;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-size: 10pt; font-weight: bold; margin-top: 2px; color: black;">Độc lập - Tự do - Hạnh phúc</div>
              <div style="width: 130px; border-bottom: 1.5px solid black; margin: 5px auto 0 auto;"></div>
            </td>
          </tr>
        </table>

        <!-- TIÊU ĐỀ CHÍNH -->
        <div style="text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 30px 0 25px 0; letter-spacing: 0.5px; color: black;">
          ${(generalInfo.tieuDeBaoCao || 'BÁO CÁO CƠ SỞ VẬT CHẤT PHÒNG MÁY TÍNH').toUpperCase()}
        </div>

        <!-- I. THÔNG TIN CHUNG -->
        <div style="font-size: 11pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; text-transform: none; color: black;">
          I. Thông tin chung
        </div>
        <table style="width: 100%; border: none; border-collapse: collapse; font-size: 11pt; margin-bottom: 20px; color: black;">
          <tr style="height: 25px;">
            <td style="width: 200px; padding: 2px 0; font-weight: normal;">Đơn vị:</td>
            <td style="border-bottom: 1px dotted #555; padding: 2px 5px; font-weight: bold;">${generalInfo.donVi}</td>
          </tr>
          <tr style="height: 25px;">
            <td style="padding: 2px 0; font-weight: normal;">Địa phương:</td>
            <td style="border-bottom: 1px dotted #555; padding: 2px 5px;">${generalInfo.diaPhuong}</td>
          </tr>
          <tr style="height: 25px;">
            <td style="padding: 2px 0; font-weight: normal;">Người phụ trách phòng máy:</td>
            <td style="border-bottom: 1px dotted #555; padding: 2px 5px; font-weight: bold;">${generalInfo.nguoiPhuTrach}</td>
          </tr>
          <tr style="height: 25px;">
            <td style="padding: 2px 0; font-weight: normal;">Thời gian báo cáo:</td>
            <td style="border-bottom: 1px dotted #555; padding: 2px 5px;">${generalInfo.thoiGianBaoCao}</td>
          </tr>
        </table>

        <!-- II. HIỆN TRẠNG PHÒNG MÁY -->
        <div style="font-size: 11pt; font-weight: bold; margin-top: 25px; margin-bottom: 10px; color: black;">
          II. Hiện trạng phòng máy
        </div>
        <table style="width: 100%; border: 1px solid black; border-collapse: collapse; font-size: 10pt; color: black; margin-bottom: 25px;">
          <thead>
            <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center; height: 30px;">
              <th style="border: 1px solid black; width: 45px; padding: 5px;">STT</th>
              <th style="border: 1px solid black; text-align: left; padding: 5px 10px; width: 180px;">Hạng mục</th>
              <th style="border: 1px solid black; width: 85px; padding: 5px;">Tổng số</th>
              <th style="border: 1px solid black; width: 110px; padding: 5px;">Hoạt động tốt</th>
              <th style="border: 1px solid black; width: 90px; padding: 5px;">Hư hỏng</th>
              <th style="border: 1px solid black; text-align: left; padding: 5px 10px;">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${assets.map(asset => `
              <tr style="height: 25px; vertical-align: middle;">
                <td style="border: 1px solid black; text-align: center; padding: 4px;">${asset.stt}</td>
                <td style="border: 1px solid black; text-align: left; padding: 4px 10px; font-weight: ${asset.stt <= 5 ? 'bold' : 'normal'}">${asset.hangMuc}</td>
                <td style="border: 1px solid black; text-align: center; padding: 4px;">${asset.tongSo}</td>
                <td style="border: 1px solid black; text-align: center; padding: 4px; color: green; font-weight: bold;">${asset.hoatDongTot}</td>
                <td style="border: 1px solid black; text-align: center; padding: 4px; color: ${parseInt(asset.huHong) > 0 ? 'red' : 'black'}; font-weight: ${parseInt(asset.huHong) > 0 ? 'bold' : 'normal'}">${asset.huHong}</td>
                <td style="border: 1px solid black; text-align: left; padding: 4px 10px; font-style: italic; font-size: 9.5pt; color: #333;">${asset.ghiChu}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- III. CHI TIẾT CÁC THIẾT BỊ HƯ HỎNG -->
        <div style="font-size: 11pt; font-weight: bold; margin-top: 25px; margin-bottom: 10px; color: black; page-break-before: auto;">
          III. Chi tiết các thiết bị hư hỏng
        </div>
        <table style="width: 100%; border: 1px solid black; border-collapse: collapse; font-size: 10pt; color: black; margin-bottom: 25px;">
          <thead>
            <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center; height: 30px;">
              <th style="border: 1px solid black; width: 45px; padding: 5px;">STT</th>
              <th style="border: 1px solid black; text-align: left; padding: 5px 10px; width: 140px;">Thiết bị</th>
              <th style="border: 1px solid black; text-align: left; padding: 5px 10px; width: 130px;">Vị trí/Máy số</th>
              <th style="border: 1px solid black; text-align: left; padding: 5px 10px;">Hiện trạng</th>
              <th style="border: 1px solid black; text-align: center; padding: 5px; width: 120px;">Mức độ</th>
            </tr>
          </thead>
          <tbody>
            ${brokenDetails.length === 0 ? `
              <tr>
                <td colspan="5" style="border: 1px solid black; text-align: center; padding: 15px; font-style: italic; color: #555;">Không có thiết bị hư hỏng ghi nhận.</td>
              </tr>
            ` : brokenDetails.map(row => `
              <tr style="height: 25px; vertical-align: middle;">
                <td style="border: 1px solid black; text-align: center; padding: 4px;">${row.stt}</td>
                <td style="border: 1px solid black; text-align: left; padding: 4px 10px; font-weight: bold;">${row.thietBi}</td>
                <td style="border: 1px solid black; text-align: left; padding: 4px 10px;">${row.viTri}</td>
                <td style="border: 1px solid black; text-align: left; padding: 4px 10px; color: #444;">${row.hienTrang}</td>
                <td style="border: 1px solid black; text-align: center; padding: 4px; font-weight: bold; color: ${row.mucDo.includes('thay mới') ? '#d97706' : '#2563eb'}">${row.mucDo}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- IV. THIẾT BỊ CẦN BỔ SUNG -->
        <div style="font-size: 11pt; font-weight: bold; margin-top: 25px; margin-bottom: 10px; color: black;">
          IV. Thiết bị cần bổ sung
        </div>
        <table style="width: 100%; border: 1px solid black; border-collapse: collapse; font-size: 10pt; color: black; margin-bottom: 35px;">
          <thead>
            <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center; height: 30px;">
              <th style="border: 1px solid black; width: 45px; padding: 5px;">STT</th>
              <th style="border: 1px solid black; text-align: left; padding: 5px 10px; width: 180px;">Thiết bị</th>
              <th style="border: 1px solid black; text-align: center; padding: 5px; width: 130px;">Số lượng đề nghị</th>
              <th style="border: 1px solid black; text-align: left; padding: 5px 10px;">Lý do</th>
            </tr>
          </thead>
          <tbody>
            ${additions.length === 0 ? `
              <tr>
                <td colspan="4" style="border: 1px solid black; text-align: center; padding: 15px; font-style: italic; color: #555;">Không đề xuất thêm thiết bị bổ sung.</td>
              </tr>
            ` : additions.map(row => `
              <tr style="height: 25px; vertical-align: middle;">
                <td style="border: 1px solid black; text-align: center; padding: 4px;">${row.stt}</td>
                <td style="border: 1px solid black; text-align: left; padding: 4px 10px; font-weight: bold;">${row.thietBi}</td>
                <td style="border: 1px solid black; text-align: center; padding: 4px; font-weight: bold; color: #16a34a;">${row.soLuong}</td>
                <td style="border: 1px solid black; text-align: left; padding: 4px 10px;">${row.lyDo}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- CHỮ KÝ VÀ NGÀY THÁNG -->
        <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 30px; color: black; page-break-inside: avoid;">
          <tr>
            <td style="width: 45%; text-align: center; padding: 0;"></td>
            <td style="width: 55%; text-align: center; padding: 0; vertical-align: top;">
              <div style="font-style: italic; font-size: 11pt; margin-bottom: 5px;">Long Định, ngày ${ngayKy} tháng ${thangKy} năm 20${namKy.replace(/^20/, '')}</div>
              <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">Người lập báo cáo</div>
              <div style="font-size: 10pt; font-style: italic; color: #555; margin-top: 2px; margin-bottom: 60px;">(Ký, ghi rõ họ tên)</div>
              <div style="font-weight: bold; font-size: 11.5pt; text-decoration: none;">${generalInfo.nguoiPhuTrach}</div>
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  // 1. DIRECT PRINT IMPLEMENTATION (using the hidden iframe technique from TimetableTab)
  const handlePrint = () => {
    // Create temporary hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      showToast('Đang mở hộp thoại in báo cáo...', 'success');
      return;
    }

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Báo cáo CSVC Phòng máy tính - TH Long Định</title>
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }
              body {
                background: white !important;
                color: black !important;
                margin: 0;
                padding: 0;
              }
            }
            body {
              background: white !important;
              color: black !important;
              font-family: "Times New Roman", Times, serif !important;
            }
          </style>
        </head>
        <body>
          ${generateOfficialHTML()}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
    showToast('Đang chuẩn bị bản in đẹp chuẩn 100%...');
  };

  // 2. WORD FILE EXPORT (.DOC) PRESERVING STYLES (similar to TimetableTab)
  const handleExportWord = () => {
    const fileName = `BaocaophongTinhoc_TieuhocLongDinh_${generalInfo.thoiGianBaoCao.replace(/\//g, '-')}.doc`;
    
    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-org:office:office' 
            xmlns:w='urn:schemas-microsoft-microsoft-org:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Báo cáo cơ sở vật chất phòng máy</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4 portrait;
            margin-top: 2cm;
            margin-bottom: 2cm;
            margin-left: 3cm;
            margin-right: 2cm;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            color: black;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            font-family: "Times New Roman", Times, serif;
          }
        </style>
      </head>
      <body>
        ${generateOfficialHTML(true)}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docContent], {
      type: 'application/msword;charset=utf-8'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file báo cáo dạng MS Word (.doc)!');
  };

  if (isPrintMode) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] py-10 print:py-0 print:bg-white flex justify-center items-start relative z-50 animate-fadeIn">
        <style>{`
          aside, header, nav, footer, #report-toast {
            display: none !important;
          }
          main, #root > div > div {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: #f1f5f9 !important;
          }
          @media print {
            body, html {
              background: white !important;
            }
            main, #root > div > div {
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Toast Notification */}
        {toastMessage && (
          <div 
            className={`fixed bottom-5 right-5 z-[10000] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform translate-y-0 scale-100 ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-600 text-white border border-emerald-500' 
                : 'bg-rose-600 text-white border border-rose-500'
            }`}
            id="report-toast"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider">{toastMessage.text}</span>
          </div>
        )}

        {/* FLOATING ACTION TOOLBAR */}
        <div className="fixed top-4 right-4 z-[9999] bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-3.5 no-print print:hidden">
          <div className="flex flex-col text-left leading-tight pr-3.5 border-r border-slate-700">
            <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider">Chế độ In chuyên nghiệp</span>
            <span className="text-[9px] text-slate-400 font-bold">Đã ẩn mọi menu & thanh công cụ</span>
          </div>
          
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md font-bold"
            title="Mở hộp thoại in của trình duyệt"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Báo Cáo</span>
          </button>
          
          <button
            onClick={handleExportWord}
            className="px-3.5 py-2 bg-[#1e62a3] hover:bg-[#154a7d] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md font-bold"
            title="Tải tệp tin Microsoft Word"
          >
            <Download className="w-3.5 h-3.5" />
            <span>File Word</span>
          </button>
          
          <button
            onClick={() => setIsPrintMode(false)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md font-bold"
            title="Trở về trang chỉnh sửa"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="bg-white shadow-2xl p-4 sm:p-8 md:p-12 w-full max-w-[21cm] border border-slate-300 min-h-[29.7cm] text-black print:shadow-none print:border-0 print:p-0 my-4 print:my-0">
          <div 
            dangerouslySetInnerHTML={{ __html: generateOfficialHTML() }} 
            className="preview-doc-wrapper"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform translate-y-0 scale-100 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border border-emerald-500' 
              : 'bg-rose-600 text-white border border-rose-500'
          }`}
          id="report-toast"
        >
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider">{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-[#e2f1f2]/30 border border-[#113f43]/10 text-slate-800 p-4 rounded-2xl shadow-3xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-10 h-10 rounded-xl bg-[#113f43]/10 flex items-center justify-center border border-[#113f43]/10 shadow-3xs">
            <BookOpen className="w-5 h-5 text-[#113f43]" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#113f43] flex items-center gap-2">
              Báo cáo phòng máy tính
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Báo cáo hiện trạng trang thiết bị vật chất phòng tin học - Trường TH Long Định
            </p>
          </div>
        </div>

        {/* Action Toggle Modes */}
        <div className="flex flex-wrap gap-2 relative">
          <button
            onClick={handleResetForm}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 bg-white hover:bg-slate-50 text-[#113f43] border border-slate-200 cursor-pointer shadow-3xs active:scale-95 transition-all"
            title="Khôi phục nội dung chuẩn giống 100% ảnh mẫu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Khôi phục mẫu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: REPORTS HISTORY (1/4 space) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                📂 Lịch sử báo cáo
              </h3>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {savedReports.length} bản
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Các báo cáo đã lưu được lưu trữ trên trình duyệt của giáo viên để xem lại, cập nhật hoặc xuất bản in bất cứ lúc nào.
            </p>

            {savedReports.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-medium space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p>Chưa có báo cáo nào được lưu.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {savedReports.map((rep) => {
                  const isActive = activeReportId === rep.id;
                  return (
                    <div
                      key={rep.id}
                      onClick={() => handleLoadReport(rep)}
                      className={`group p-3 rounded-2xl border transition-all text-left cursor-pointer flex items-start justify-between gap-2 ${
                        isActive 
                          ? 'border-[#113f43] bg-teal-50/20 shadow-xs' 
                          : 'border-slate-150 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <strong className={`block text-xs truncate leading-snug ${isActive ? 'text-[#113f43] font-bold' : 'text-slate-800 font-semibold'}`}>
                          {rep.generalInfo.donVi}
                        </strong>
                        <span className="block text-[10px] text-slate-500 mt-1 font-medium">
                          📅 {rep.generalInfo.thoiGianBaoCao}
                        </span>
                        <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded mt-1.5 uppercase">
                          👤 {rep.creator}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(rep.id);
                        }}
                        className="p-2 rounded-xl text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 transition-all cursor-pointer shadow-3xs flex items-center justify-center self-center shrink-0"
                        title="Xóa báo cáo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUICK INSTRUCTIONS */}
          <div className="bg-amber-500/5 p-5 rounded-3xl border border-amber-500/10 text-left space-y-2.5">
            <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              💡 HƯỚNG DẪN ĐƠN GIẢN
            </h4>
            <ul className="text-[11px] text-amber-900/80 space-y-1.5 list-disc pl-3.5 font-medium leading-relaxed">
              <li>Bạn có thể trực tiếp thay đổi số lượng, hiện trạng và nội dung của các bảng trên form.</li>
              <li>Sử dụng nút <strong className="text-amber-950">"Xem trước"</strong> để kiểm tra bố cục chuẩn văn bản hành chính Việt Nam.</li>
              <li>Bấm <strong className="text-amber-950">"In báo cáo"</strong> để in trực tiếp qua máy in hoặc chọn "Lưu dưới dạng PDF" trong hộp thoại in của trình duyệt để có file PDF vector siêu nét.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: EDITOR OR PREVIEW (3/4 space) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* CONTROL BAR */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-3xs flex flex-wrap items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                activeReportId 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                  : 'bg-amber-50 text-amber-800 border border-amber-100'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeReportId ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {activeReportId ? 'Báo cáo đã lưu' : 'Phác thảo mới'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-95 border ${
                  viewMode === 'preview'
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-400 shadow-xs font-bold'
                    : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-xs font-bold'
                }`}
                title="Bật/Tắt bản xem trước A4 chuẩn"
              >
                <Eye className="w-3.5 h-3.5 text-white" />
                {viewMode === 'preview' ? 'Chỉnh sửa' : 'Xem trước A4'}
              </button>

              <button
                onClick={handleSaveReport}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-3xs active:scale-95 transition-all font-bold"
                title="Lưu lại báo cáo vào danh sách đã lưu"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu nháp
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-3xs active:scale-95 transition-all font-bold"
                title="Mở hộp thoại in mặc định của trình duyệt"
              >
                <Printer className="w-3.5 h-3.5" />
                In nhanh
              </button>

              <button
                onClick={() => {
                  setViewMode('preview');
                  setIsPrintMode(true);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-3xs active:scale-95 transition-all font-bold"
                title="Bật chế độ xem toàn màn hình ẩn toàn bộ điều hướng để in"
              >
                <Printer className="w-3.5 h-3.5 animate-pulse" />
                Chế độ In
              </button>

              <button
                onClick={handleExportWord}
                className="px-3 py-1.5 bg-[#1e62a3] hover:bg-[#154a7d] text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-3xs active:scale-95 transition-all font-bold"
                title="Tải xuống tệp Microsoft Word .doc"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất Word
              </button>
            </div>
          </div>

          {/* EDIT MODE CANVAS */}
          {viewMode === 'edit' ? (
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-xs text-left space-y-8">
              
              {/* UB / QUỐC HIỆU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-6">
                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Cơ quan chủ quản</div>
                  <input 
                    type="text" 
                    value={generalInfo.donVi} 
                    onChange={(e) => handleGeneralChange('donVi', e.target.value)}
                    className="w-full text-sm font-extrabold text-slate-800 uppercase bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl focus:border-[#113f43] focus:bg-white outline-none"
                  />
                  <div className="text-[10px] text-slate-400 font-semibold italic">Mặc định: Trường Tiểu học Long Định</div>
                </div>
                <div className="space-y-1 md:text-right">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Địa phương hành chính</div>
                  <input 
                    type="text" 
                    value={generalInfo.diaPhuong} 
                    onChange={(e) => handleGeneralChange('diaPhuong', e.target.value)}
                    className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl focus:border-[#113f43] focus:bg-white outline-none md:text-right"
                  />
                  <div className="text-[10px] text-slate-400 font-semibold italic">Mặc định: Xã Long Định</div>
                </div>
              </div>

              {/* SECTION I: THÔNG TIN CHUNG */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#113f43] pl-2.5">
                  I. Thông tin chung
                </h3>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      Tiêu đề báo cáo (Sẽ in hoa):
                    </label>
                    <input 
                      type="text" 
                      value={generalInfo.tieuDeBaoCao || ''} 
                      onChange={(e) => handleGeneralChange('tieuDeBaoCao', e.target.value)}
                      placeholder="Nhập tiêu đề báo cáo phòng máy..."
                      className="w-full text-xs font-extrabold uppercase text-slate-800 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl focus:border-[#113f43] outline-none shadow-3xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Người phụ trách phòng máy:</label>
                      <input 
                        type="text" 
                        value={generalInfo.nguoiPhuTrach} 
                        onChange={(e) => handleGeneralChange('nguoiPhuTrach', e.target.value)}
                        placeholder="Họ và tên..."
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl focus:border-[#113f43] outline-none shadow-3xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Thời gian báo cáo:</label>
                      <input 
                        type="text" 
                        value={generalInfo.thoiGianBaoCao} 
                        onChange={(e) => handleGeneralChange('thoiGianBaoCao', e.target.value)}
                        placeholder="Ví dụ: 19/07/2026..."
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl focus:border-[#113f43] outline-none shadow-3xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION II: HIỆN TRẠNG PHÒNG MÁY */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#113f43] pl-2.5">
                    II. Hiện trạng phòng máy
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-[10px] font-bold text-slate-400 italic">Nhập số lượng & ghi chú hiện trạng chi tiết</span>
                    <button
                      onClick={addAssetRow}
                      className="px-3.5 py-1.5 bg-[#113f43] hover:bg-[#1a5b61] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Thêm hạng mục
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-3xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <th className="p-3 text-center w-12">STT</th>
                        <th className="p-3 w-56">Hạng mục</th>
                        <th className="p-3 text-center w-28">Tổng số</th>
                        <th className="p-3 text-center w-28">Hoạt động tốt</th>
                        <th className="p-3 text-center w-28">Hư hỏng</th>
                        <th className="p-3">Ghi chú hiện trạng</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {assets.map((asset, idx) => {
                        return (
                          <tr key={asset.stt} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 text-center font-bold text-slate-400">{asset.stt}</td>
                            <td className="p-2">
                              <div className="relative">
                                <select 
                                  value={DEVICE_OPTIONS.includes(asset.hangMuc) ? asset.hangMuc : (asset.hangMuc ? 'custom' : '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'custom') {
                                      handleAssetChange(idx, 'hangMuc', '');
                                    } else {
                                      handleAssetChange(idx, 'hangMuc', val);
                                    }
                                  }}
                                  className="w-full bg-white text-xs font-black text-[#103e42] border border-slate-200 rounded-full pl-4 pr-8 py-1.5 outline-none focus:border-[#113f43] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%23103e42%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat shadow-3xs transition-all duration-200"
                                >
                                  <option value="" disabled>-- Chọn thiết bị --</option>
                                  {DEVICE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                  <option value="custom">✍️ Nhập thiết bị khác...</option>
                                </select>
                              </div>
                              
                              {!DEVICE_OPTIONS.includes(asset.hangMuc) && (
                                <input 
                                  type="text" 
                                  value={asset.hangMuc}
                                  onChange={(e) => handleAssetChange(idx, 'hangMuc', e.target.value)}
                                  placeholder="Nhập thiết bị mới..."
                                  className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-full px-4 py-1.5 outline-none focus:border-[#113f43] mt-1 shadow-3xs"
                                />
                              )}
                            </td>
                            
                            {/* TỔNG SỐ */}
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => {
                                    const next = Math.max(0, parseInt(asset.tongSo || '0') - 1).toString();
                                    handleAssetChange(idx, 'tongSo', next);
                                  }}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 active:scale-95"
                                >
                                  -
                                </button>
                                <input 
                                  type="text" 
                                  value={asset.tongSo}
                                  onChange={(e) => handleAssetChange(idx, 'tongSo', e.target.value)}
                                  className="w-10 text-center font-extrabold text-slate-800 border border-slate-200 rounded p-1 outline-none focus:border-[#113f43]"
                                />
                                <button 
                                  onClick={() => {
                                    const next = (parseInt(asset.tongSo || '0') + 1).toString();
                                    handleAssetChange(idx, 'tongSo', next);
                                  }}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* HOẠT ĐỘNG TỐT */}
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => {
                                    const next = Math.max(0, parseInt(asset.hoatDongTot || '0') - 1).toString();
                                    handleAssetChange(idx, 'hoatDongTot', next);
                                  }}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 active:scale-95"
                                >
                                  -
                                </button>
                                <input 
                                  type="text" 
                                  value={asset.hoatDongTot}
                                  onChange={(e) => handleAssetChange(idx, 'hoatDongTot', e.target.value)}
                                  className="w-10 text-center font-extrabold text-emerald-600 border border-slate-200 rounded p-1 outline-none focus:border-emerald-500"
                                />
                                <button 
                                  onClick={() => {
                                    const next = (parseInt(asset.hoatDongTot || '0') + 1).toString();
                                    handleAssetChange(idx, 'hoatDongTot', next);
                                  }}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* HƯ HỎNG */}
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => {
                                    const next = Math.max(0, parseInt(asset.huHong || '0') - 1).toString();
                                    handleAssetChange(idx, 'huHong', next);
                                  }}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 active:scale-95"
                                >
                                  -
                                </button>
                                <input 
                                  type="text" 
                                  value={asset.huHong}
                                  onChange={(e) => handleAssetChange(idx, 'huHong', e.target.value)}
                                  className={`w-10 text-center font-extrabold border rounded p-1 outline-none ${
                                    parseInt(asset.huHong || '0') > 0 
                                      ? 'text-rose-600 border-rose-200 bg-rose-50/25 focus:border-rose-500' 
                                      : 'text-slate-800 border-slate-200 focus:border-[#113f43]'
                                  }`}
                                />
                                <button 
                                  onClick={() => {
                                    const next = (parseInt(asset.huHong || '0') + 1).toString();
                                    handleAssetChange(idx, 'huHong', next);
                                  }}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* GHI CHÚ */}
                            <td className="p-2">
                              <input 
                                type="text" 
                                value={asset.ghiChu}
                                onChange={(e) => handleAssetChange(idx, 'ghiChu', e.target.value)}
                                placeholder="Ghi chú thêm..."
                                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43] transition"
                              />
                            </td>

                            {/* XÓA DÒNG */}
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removeAssetRow(idx)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition active:scale-95 cursor-pointer shadow-3xs"
                                title="Xóa hạng mục này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION III: CHI TIẾT CÁC THIẾT BỊ HƯ HỎNG */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#113f43] pl-2.5">
                    III. Chi tiết các thiết bị hư hỏng
                  </h3>
                  <button
                    onClick={addBrokenRow}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Thêm thiết bị hư hỏng
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-3xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <th className="p-3 text-center w-12">STT</th>
                        <th className="p-3 w-44">Thiết bị</th>
                        <th className="p-3 w-44">Vị trí/Máy số</th>
                        <th className="p-3">Hiện trạng hư hỏng</th>
                        <th className="p-3 w-40 text-center">Đề xuất xử lý</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {brokenDetails.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 font-medium italic">
                            Không có thiết bị hư hỏng ghi nhận. Hãy bấm "Thêm thiết bị" để liệt kê nếu có.
                          </td>
                        </tr>
                      ) : (
                        brokenDetails.map((row, index) => (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 text-center font-bold text-slate-400">{row.stt}</td>
                            
                            {/* THIẾT BỊ */}
                            <td className="p-2">
                              <div className="space-y-1">
                                <select 
                                  value={DEVICE_OPTIONS.includes(row.thietBi) ? row.thietBi : (row.thietBi ? 'custom' : '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'custom') {
                                      handleBrokenChange(row.id, 'thietBi', '');
                                    } else {
                                      handleBrokenChange(row.id, 'thietBi', val);
                                    }
                                  }}
                                  className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43] cursor-pointer"
                                >
                                  <option value="" disabled>-- Chọn thiết bị --</option>
                                  {DEVICE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                  <option value="custom">✍️ Nhập thiết bị khác...</option>
                                </select>
                                
                                {(!DEVICE_OPTIONS.includes(row.thietBi) || row.thietBi === '') && (
                                  <input 
                                    type="text" 
                                    value={row.thietBi}
                                    onChange={(e) => handleBrokenChange(row.id, 'thietBi', e.target.value)}
                                    placeholder="Nhập tên thiết bị..."
                                    className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43] mt-1"
                                  />
                                )}
                              </div>
                            </td>

                            {/* VỊ TRÍ */}
                            <td className="p-2">
                              <div className="space-y-1">
                                <select 
                                  value={LOCATION_OPTIONS.includes(row.viTri) ? row.viTri : (row.viTri ? 'custom' : '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'custom') {
                                      handleBrokenChange(row.id, 'viTri', '');
                                    } else {
                                      handleBrokenChange(row.id, 'viTri', val);
                                    }
                                  }}
                                  className="w-full bg-white text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43] cursor-pointer"
                                >
                                  <option value="" disabled>-- Chọn vị trí --</option>
                                  {LOCATION_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                  <option value="custom">✍️ Nhập vị trí khác...</option>
                                </select>
                                
                                {(!LOCATION_OPTIONS.includes(row.viTri) || row.viTri === '') && (
                                  <input 
                                    type="text" 
                                    value={row.viTri}
                                    onChange={(e) => handleBrokenChange(row.id, 'viTri', e.target.value)}
                                    placeholder="Ví dụ: Máy số 05..."
                                    className="w-full bg-white text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43] mt-1"
                                  />
                                )}
                              </div>
                            </td>

                            {/* HIỆN TRẠNG */}
                            <td className="p-2">
                              <input 
                                type="text" 
                                value={row.hienTrang}
                                onChange={(e) => handleBrokenChange(row.id, 'hienTrang', e.target.value)}
                                placeholder="Liệt nhiều phím, không nhận tín hiệu..."
                                className="w-full bg-white text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43]"
                              />
                            </td>

                            {/* MỨC ĐỘ / ĐỀ XUẤT */}
                            <td className="p-2 text-center">
                              <select
                                value={row.mucDo}
                                onChange={(e) => handleBrokenChange(row.id, 'mucDo', e.target.value)}
                                className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43] cursor-pointer"
                              >
                                <option value="Cần thay mới">🔧 Cần thay mới</option>
                                <option value="Cần sửa chữa">⚙️ Cần sửa chữa</option>
                                <option value="Cần kiểm tra">🔍 Cần kiểm tra</option>
                              </select>
                            </td>

                            {/* REMOVE BUTTON */}
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removeBrokenRow(row.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Xóa dòng"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION IV: THIẾT BỊ CẦN BỔ SUNG */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#113f43] pl-2.5">
                    IV. Thiết bị cần bổ sung (Đề xuất)
                  </h3>
                  <button
                    onClick={addAdditionRow}
                    className="px-3.5 py-1.5 bg-[#113f43] hover:bg-[#1a5b61] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Thêm đề xuất bổ sung
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-3xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <th className="p-3 text-center w-12">STT</th>
                        <th className="p-3 w-56">Thiết bị đề xuất</th>
                        <th className="p-3 text-center w-36">Số lượng đề xuất</th>
                        <th className="p-3">Lý do đề xuất chi tiết</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {additions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 font-medium italic">
                            Không có thiết bị đề xuất bổ sung. Hãy bấm "Thêm đề xuất" nếu cần.
                          </td>
                        </tr>
                      ) : (
                        additions.map((row, index) => (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 text-center font-bold text-slate-400">{row.stt}</td>
                            
                            {/* THIẾT BỊ */}
                            <td className="p-2">
                              <div className="space-y-1">
                                <select 
                                  value={DEVICE_OPTIONS.includes(row.thietBi) ? row.thietBi : (row.thietBi ? 'custom' : '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'custom') {
                                      handleAdditionChange(row.id, 'thietBi', '');
                                    } else {
                                      handleAdditionChange(row.id, 'thietBi', val);
                                    }
                                  }}
                                  className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43] cursor-pointer"
                                >
                                  <option value="" disabled>-- Chọn thiết bị --</option>
                                  {DEVICE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                  <option value="custom">✍️ Nhập thiết bị khác...</option>
                                </select>
                                
                                {(!DEVICE_OPTIONS.includes(row.thietBi) || row.thietBi === '') && (
                                  <input 
                                    type="text" 
                                    value={row.thietBi}
                                    onChange={(e) => handleAdditionChange(row.id, 'thietBi', e.target.value)}
                                    placeholder="Nhập thiết bị mới..."
                                    className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43] mt-1"
                                  />
                                )}
                              </div>
                            </td>

                            {/* SỐ LƯỢNG */}
                            <td className="p-2">
                              <input 
                                type="text" 
                                value={row.soLuong}
                                onChange={(e) => handleAdditionChange(row.id, 'soLuong', e.target.value)}
                                placeholder="Ví dụ: 2 cái, 1 cuộn..."
                                className="w-full bg-white text-xs font-extrabold text-[#113f43] border border-slate-200 rounded-xl px-3 py-1.5 text-center outline-none focus:border-[#113f43]"
                              />
                            </td>

                            {/* LÝ DO */}
                            <td className="p-2">
                              <input 
                                type="text" 
                                value={row.lyDo}
                                onChange={(e) => handleAdditionChange(row.id, 'lyDo', e.target.value)}
                                placeholder="Lý do bổ sung..."
                                className="w-full bg-white text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#113f43]"
                              />
                            </td>

                            {/* REMOVE BUTTON */}
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removeAdditionRow(row.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Xóa dòng"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION V: CHỮ KÝ VÀ NGÀY THÁNG */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#113f43] pl-2.5">
                  V. Xác nhận báo cáo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-150 items-center">
                  <div className="md:col-span-1 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    Địa phương & Ngày ký:
                  </div>
                  <div className="md:col-span-3 grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-black">Ngày</label>
                      <input 
                        type="text" 
                        value={ngayKy} 
                        onChange={(e) => setNgayKy(e.target.value)} 
                        className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl p-2 outline-none text-center bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-black">Tháng</label>
                      <input 
                        type="text" 
                        value={thangKy} 
                        onChange={(e) => setThangKy(e.target.value)} 
                        className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl p-2 outline-none text-center bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-black">Năm</label>
                      <input 
                        type="text" 
                        value={namKy} 
                        onChange={(e) => setNamKy(e.target.value)} 
                        className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl p-2 outline-none text-center bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            
            /* PREVIEW MODE CANVAS */
            <div className="bg-slate-100 p-4 sm:p-8 rounded-[32px] border border-slate-250 shadow-inner overflow-x-auto">
              <div className="bg-white mx-auto shadow-2xl p-8 sm:p-12 w-full max-w-[21cm] border border-slate-300 min-h-[29.7cm] text-black">
                <div 
                  dangerouslySetInnerHTML={{ __html: generateOfficialHTML() }} 
                  className="preview-doc-wrapper"
                />
              </div>
            </div>
          )}

        </div>

      </div>

      {/* DELETE CONFIRMATION MODAL POPUP */}
      {deleteConfirmId && (() => {
        const targetRep = savedReports.find(r => r.id === deleteConfirmId);
        if (!targetRep) return null;
        return (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 transition-all duration-300"
            onClick={() => setDeleteConfirmId(null)}
          >
            <div 
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-4 relative transform scale-100 transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-3xs">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>

              <div className="space-y-1.5 w-full">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  Xác nhận xóa báo cáo?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Hành động này sẽ xóa vĩnh viễn báo cáo đã lưu của đơn vị:
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left space-y-1 my-2">
                  <div className="text-xs font-black text-slate-800 truncate">
                    🏢 {targetRep.generalInfo.donVi}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 flex flex-wrap gap-2">
                    <span>📅 {targetRep.generalInfo.thoiGianBaoCao}</span>
                    <span>👤 {targetRep.creator}</span>
                  </div>
                </div>
                <p className="text-[11px] text-rose-500 font-bold">
                  ⚠️ Lưu ý: Bạn sẽ không thể khôi phục lại dữ liệu này!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-slate-200 active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteReport(deleteConfirmId)}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-rose-600/10 active:scale-95"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
