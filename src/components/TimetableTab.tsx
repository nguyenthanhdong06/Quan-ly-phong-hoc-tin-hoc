import React, { useState, useMemo } from 'react';
import { Member, TimetableData } from '../types';
import { 
  Calendar, 
  Clock, 
  User, 
  Printer, 
  BookOpen, 
  Search, 
  HelpCircle, 
  FileDown, 
  FileText, 
  Eye, 
  EyeOff,
  Filter,
  CheckCircle,
  Users,
  Grid
} from 'lucide-react';

interface TimetableTabProps {
  timetableData: TimetableData;
  members: Member[];
  currentUser: Member | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function TimetableTab({
  timetableData,
  members,
  currentUser,
  showToast
}: TimetableTabProps) {
  // Find teachers from members list
  const teachers = members.filter(m => m.role.includes('Giáo viên') || m.role.includes('Admin'));

  // Default selected teacher to the current logged in user (if they are a teacher/admin)
  const [selectedTeacherUsername, setSelectedTeacherUsername] = useState<string>(() => {
    if (currentUser) {
      const match = teachers.find(t => t.username === currentUser.username);
      if (match) return match.username;
    }
    return teachers[0]?.username || '';
  });

  // View modes: 'personal' (Cá nhân), 'global' (Toàn trường), 'search' (Tra cứu nhanh)
  const [viewMode, setViewMode] = useState<'personal' | 'global' | 'search'>('personal');
  const [previewPaperMode, setPreviewPaperMode] = useState<boolean>(false);
  const [selectedGlobalDay, setSelectedGlobalDay] = useState<string>('2'); // '2' = Thứ 2, etc.
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedTeacher = teachers.find(t => t.username === selectedTeacherUsername);

  const handlePrint = () => {
    const printableContent = document.getElementById('printable-timetable');
    if (!printableContent) {
      showToast('Không tìm thấy dữ liệu để in!', 'error');
      return;
    }

    // Create a temporary hidden iframe for printing
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
      // Fallback to normal window.print
      window.print();
      showToast('Đang mở hộp thoại in thời khóa biểu...', 'success');
      return;
    }

    // Write complete HTML with explicit print styles to print properly
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Thời khóa biểu - ${selectedTeacher?.name || ''}</title>
          <style>
            @media print {
              @page {
                size: A4 landscape;
                margin: 1cm 1.5cm 1cm 1.5cm;
              }
              body {
                background: white !important;
                color: black !important;
                margin: 0;
                padding: 0;
                font-family: "Times New Roman", Times, serif !important;
              }
            }
            body {
              background: white !important;
              color: black !important;
              margin: 0;
              padding: 10px;
              font-family: "Times New Roman", Times, serif !important;
              font-size: 11px;
            }
            .text-center {
              text-align: center;
            }
            .mb-6 {
              margin-bottom: 20px;
            }
            .text-xl {
              font-size: 18px;
            }
            .text-sm {
              font-size: 13px;
            }
            .font-bold {
              font-weight: bold;
            }
            .uppercase {
              text-transform: uppercase;
            }
            .mt-1 {
              margin-top: 4px;
            }
            .my-4 {
              margin-top: 16px;
              margin-bottom: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse !important;
              margin-top: 15px;
              margin-bottom: 20px;
            }
            table, th, td {
              border: 1px solid black !important;
              color: black !important;
            }
            th {
              background-color: #f2f2f2 !important;
              font-weight: bold !important;
              padding: 6px 4px !important;
              font-size: 11px !important;
              text-align: center !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            td {
              padding: 6px 4px !important;
              font-size: 11px !important;
              text-align: center !important;
            }
            .flex {
              display: flex;
            }
            .justify-between {
              justify-content: space-between;
            }
            .items-start {
              align-items: flex-start;
            }
            .mt-6 {
              margin-top: 24px;
            }
            .w-full {
              width: 100%;
            }
            .text-left {
              text-align: left;
            }
            .leading-normal {
              line-height: 1.4;
            }
            .block {
              display: block;
            }
            .pl-4 {
              padding-left: 16px;
            }
            .italic {
              font-style: italic;
            }
            .text-neutral-500 {
              color: #555555;
            }
            .text-xs {
              font-size: 10px;
            }
            .w-[250px] {
              width: 250px;
            }
            .h-[110px] {
              height: 110px;
            }
            .mt-8 {
              margin-top: 32px;
            }
            sup {
              font-size: 8px;
              vertical-align: super;
              line-height: 0;
            }
          </style>
        </head>
        <body>
          <div>
            ${printableContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();

    showToast('Đang mở hộp thoại in thời khóa biểu...', 'success');
  };

  const getCellData = (day: string, period: string) => {
    const teacherSchedule = timetableData[selectedTeacherUsername] || {};
    return teacherSchedule[`${day}-${period}`];
  };

  // Helper to format class string to superscript format (e.g. 3/5 -> 3⁵ or 3.5 -> 3⁵)
  const formatSuperscriptClass = (className: string): React.ReactNode => {
    const match = className.match(/^(\d+)[/.-](\d+)$/);
    if (match) {
      return (
        <>
          {match[1]}<sup>{match[2]}</sup>
        </>
      );
    }
    
    const letterMatch = className.match(/^(\d+)([A-Za-z]+)$/);
    if (letterMatch) {
      return (
        <>
          {letterMatch[1]}<sup>{letterMatch[2]}</sup>
        </>
      );
    }

    return className;
  };

  // Render cell as HTML string (for Word export)
  const renderCellHTMLString = (day: string, period: string): string => {
    const data = getCellData(day, period);
    if (!data) return '';
    
    const subject = data.subject || '';
    const className = data.className || '';
    
    const match = className.match(/^(\d+)[/.-](\d+)$/);
    if (match) {
      return `${subject} ${match[1]}<sup>${match[2]}</sup>`;
    }
    
    const letterMatch = className.match(/^(\d+)([A-Za-z]+)$/);
    if (letterMatch) {
      return `${subject} ${letterMatch[1]}<sup>${letterMatch[2]}</sup>`;
    }

    return `${subject} ${className}`;
  };

  // Function to Export as Word File (.doc) preserving the landscape tables, superscript classes and signatures
  const handleExportWord = () => {
    const teacherName = selectedTeacher?.name || 'Giao_Vien';
    const fileName = `Thoi_Khoa_Bieu_${teacherName.replace(/\s+/g, '_')}.doc`;
    
    // Create HTML template of the timetable exactly like the image
    const htmlTableRows = `
      <!-- SANG Row 1 -->
      <tr>
        <td class="session-cell" rowspan="5" style="font-weight: bold; text-align: center; font-size: 11pt; border: 1px solid black; width: 120px;">SÁNG</td>
        <td style="font-weight: bold; text-align: center; border: 1px solid black; padding: 6px;">1</td>
        ${['2', '3', '4', '5', '6'].map(day => `<td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold;">${renderCellHTMLString(day, '1')}</td>`).join('')}
      </tr>
      <!-- SANG Row 2 -->
      <tr>
        <td style="font-weight: bold; text-align: center; border: 1px solid black; padding: 6px;">2</td>
        ${['2', '3', '4', '5', '6'].map(day => `<td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold;">${renderCellHTMLString(day, '2')}</td>`).join('')}
      </tr>
      <!-- SANG Row 2.5: GIO RA CHOI -->
      <tr class="break-row" style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="6" style="text-align: center; border: 1px solid black; padding: 5px; font-weight: bold; font-size: 10pt; letter-spacing: 2px;">GIỜ RA CHƠI</td>
      </tr>
      <!-- SANG Row 3 -->
      <tr>
        <td style="font-weight: bold; text-align: center; border: 1px solid black; padding: 6px;">3</td>
        ${['2', '3', '4', '5', '6'].map(day => `<td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold;">${renderCellHTMLString(day, '3')}</td>`).join('')}
      </tr>
      <!-- SANG Row 4 -->
      <tr>
        <td style="font-weight: bold; text-align: center; border: 1px solid black; padding: 6px;">4</td>
        ${['2', '3', '4', '5', '6'].map(day => `<td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold;">${renderCellHTMLString(day, '4')}</td>`).join('')}
      </tr>
      
      <!-- CHIEU Row 5 -->
      <tr>
        <td class="session-cell" rowspan="3" style="font-weight: bold; text-align: center; font-size: 11pt; border: 1px solid black; width: 120px;">CHIỀU</td>
        <td style="font-weight: bold; text-align: center; border: 1px solid black; padding: 6px;">5</td>
        ${['2', '3', '4', '5', '6'].map(day => `<td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold;">${renderCellHTMLString(day, '5')}</td>`).join('')}
      </tr>
      <!-- CHIEU Row 6 -->
      <tr>
        <td style="font-weight: bold; text-align: center; border: 1px solid black; padding: 6px;">6</td>
        ${['2', '3', '4', '5', '6'].map(day => `<td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold;">${renderCellHTMLString(day, '6')}</td>`).join('')}
      </tr>
      <!-- CHIEU Row 7 -->
      <tr>
        <td style="font-weight: bold; text-align: center; border: 1px solid black; padding: 6px;">7</td>
        ${['2', '3', '4', '5', '6'].map(day => `<td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold;">${renderCellHTMLString(day, '7')}</td>`).join('')}
      </tr>
    `;

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-org:office:office' 
            xmlns:w='urn:schemas-microsoft-microsoft-org:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Thời khóa biểu giảng dạy</title>
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
            size: A4 landscape;
            margin: 1.5cm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: black;
            line-height: 1.4;
          }
          .title-container {
            text-align: center;
            margin-bottom: 20px;
          }
          .title {
            font-size: 15pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
          }
          .subtitle {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 5px 0 0 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 25px;
          }
          th {
            border: 1px solid black;
            padding: 8px 4px;
            font-weight: bold;
            font-size: 10.5pt;
            text-align: center;
            background-color: #f2f2f2;
          }
          td {
            border: 1px solid black;
            padding: 8px 4px;
            font-size: 10.5pt;
            text-align: center;
          }
          .footer-layout {
            width: 100%;
            margin-top: 20px;
          }
          .footer-col-left {
            width: 50%;
            text-align: left;
            vertical-align: top;
            font-size: 10.5pt;
          }
          .footer-col-right {
            width: 50%;
            text-align: center;
            vertical-align: top;
            font-size: 10.5pt;
          }
          sup {
            font-size: 8.5pt;
            vertical-align: super;
            line-height: 0;
          }
        </style>
      </head>
      <body>
        <div class="title-container">
          <p class="title">THỜI KHÓA BIỂU (202-202) TỪ 9/9/202</p>
          <p class="subtitle">GIÁO VIÊN: ${teacherName.toUpperCase()} – LỚP 2 BUỔI/ NGÀY</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 120px;">THỜI GIAN</th>
              <th style="width: 80px;">TIẾT</th>
              <th>THỨ HAI</th>
              <th>THỨ BA</th>
              <th>THỨ TƯ</th>
              <th>THỨ NĂM</th>
              <th>THỨ SÁU</th>
            </tr>
          </thead>
          <tbody>
            ${htmlTableRows}
          </tbody>
        </table>

        <table class="footer-layout" style="border: none; margin-top: 25px;">
          <tr style="border: none;">
            <td class="footer-col-left" style="border: none; text-align: left;">
              <strong>Ghi chú:</strong><br>
              <strong>* Sáng:</strong><br>
              &nbsp;&nbsp;&nbsp;&nbsp;- Vào học : 7h00<br>
              &nbsp;&nbsp;&nbsp;&nbsp;- Ra về:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10h10<br>
              <strong>* Chiều:</strong><br>
              &nbsp;&nbsp;&nbsp;&nbsp;- Vào học: 14h00<br>
              &nbsp;&nbsp;&nbsp;&nbsp;- Ra về:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;16h10
            </td>
            <td class="footer-col-right" style="border: none; text-align: center; vertical-align: top;">
              <strong style="text-transform: uppercase; letter-spacing: 1px;">GVBM</strong><br>
              <span style="font-size: 9pt; font-style: italic; color: #555555;">(Ký và ghi rõ họ tên)</span>
              <br><br><br><br><br>
              <strong style="font-size: 11pt;">${teacherName}</strong>
            </td>
          </tr>
        </table>
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
    
    showToast(`Đã xuất file Word thời khóa biểu thành công cho GV ${teacherName}!`, 'success');
  };

  // Memoized advanced search results for all teachers
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const results: Array<{
      teacher: Member;
      day: string;
      period: string;
      subject: string;
      className: string;
    }> = [];

    teachers.forEach((teacher) => {
      const schedule = timetableData[teacher.username] || {};
      Object.entries(schedule).forEach(([key, val]: [string, any]) => {
        // key format "day-period" e.g. "2-1"
        const [day, period] = key.split('-');
        const teacherName = teacher.name.toLowerCase();
        const className = val.className.toLowerCase();
        const subject = val.subject.toLowerCase();
        const dayStr = `thứ ${day === '2' ? 'hai' : day === '3' ? 'ba' : day === '4' ? 'tư' : day === '5' ? 'năm' : 'sáu'}`;

        if (
          teacherName.includes(query) ||
          className.includes(query) ||
          subject.includes(query) ||
          dayStr.includes(query)
        ) {
          results.push({
            teacher,
            day,
            period,
            subject: val.subject,
            className: val.className
          });
        }
      });
    });

    // Sort by day, period, teacher name
    return results.sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      if (a.period !== b.period) return a.period.localeCompare(b.period);
      return a.teacher.name.localeCompare(b.teacher.name);
    });
  }, [searchQuery, timetableData, teachers]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      
      {/* STYLE BLOCK FOR PRINT MEDIA */}
      <style>{`
        @media print {
          /* Hide everything except the print container */
          body * {
            visibility: hidden;
            background: none !important;
          }
          #printable-timetable, #printable-timetable * {
            visibility: visible;
          }
          #printable-timetable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
            color: black !important;
            display: block !important;
            font-family: "Times New Roman", Times, serif !important;
          }
          @page {
            size: A4 landscape;
            margin: 1.2cm 1.5cm 1.2cm 1.5cm;
          }
          /* Ensure borders are printed nicely */
          table, th, td {
            border: 1px solid black !important;
            border-collapse: collapse !important;
            color: black !important;
          }
          th {
            background-color: #f2f2f2 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* NEW INTERACTIVE HEADER SECTION & MODE CONTROLLER */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600 shrink-0 w-fit">
            <Calendar className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-wider">
                THỜI KHÓA BIỂU
              </h3>
              
              {/* INTERACTIVE MODE BADGE SWITCHER */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('personal')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all duration-200 cursor-pointer ${
                    viewMode === 'personal'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Xem thời khóa biểu chi tiết từng giáo viên"
                >
                  Cá nhân
                </button>
                <button
                  onClick={() => setViewMode('global')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all duration-200 cursor-pointer ${
                    viewMode === 'global'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Quan sát thời khóa biểu tổng hợp của cả trường"
                >
                  Toàn trường
                </button>
                <button
                  onClick={() => setViewMode('search')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all duration-200 cursor-pointer ${
                    viewMode === 'search'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tìm nhanh lịch học của Lớp, Môn hoặc Giáo viên"
                >
                  Tra cứu nhanh
                </button>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {viewMode === 'personal' && 'Hỗ trợ tra cứu cá nhân, xem trước bản giấy, xuất Word và in thời khóa biểu trực tiếp.'}
              {viewMode === 'global' && 'Bảng tổng hợp giúp ban giám hiệu và giáo viên dễ quan sát, quản lý và sắp xếp lịch dạy thay thế.'}
              {viewMode === 'search' && 'Nhập thông tin bất kỳ để định vị lịch dạy của giáo viên, lớp học hoặc môn học ngay lập tức.'}
            </p>
          </div>
        </div>

        {/* CONTROLS AREA - DEPENDS ON MODE */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
          
          {viewMode === 'personal' && (
            <>
              {/* Paper Preview toggle button */}
              <button
                onClick={() => {
                  setPreviewPaperMode(!previewPaperMode);
                  showToast(
                    previewPaperMode 
                      ? 'Đã chuyển sang Chế độ hiển thị Hiện đại.' 
                      : 'Đã chuyển sang Chế độ xem trước Bản Giấy A4.', 
                    'success'
                  );
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl border transition cursor-pointer active:scale-95 ${
                  previewPaperMode 
                    ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950 font-black' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                {previewPaperMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {previewPaperMode ? 'Bản Thường' : 'Xem Bản Giấy'}
              </button>

              {/* Export to Word Button */}
              <button
                onClick={handleExportWord}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black rounded-xl transition cursor-pointer active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                Xuất Word
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl border border-emerald-700 shadow-sm transition cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                In Lịch / PDF
              </button>

              {/* Teacher Selector dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase flex items-center gap-1 shrink-0 ml-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Giáo viên:
                </span>
                <select
                  value={selectedTeacherUsername}
                  onChange={(e) => {
                    setSelectedTeacherUsername(e.target.value);
                    const name = teachers.find(t => t.username === e.target.value)?.name || e.target.value;
                    showToast(`Đã chuyển sang xem TKB của: ${name}`, 'success');
                  }}
                  className="border border-slate-200 bg-white rounded-xl py-1 px-2.5 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[150px]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.username}>
                      {t.name} {t.username === currentUser?.username ? '(Tôi)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {viewMode === 'global' && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-100">
              <Grid className="w-4 h-4 text-emerald-600" />
              <span>Chế độ: Bảng tổng hợp Toàn trường ({teachers.length} GV)</span>
            </div>
          )}

          {viewMode === 'search' && (
            <div className="flex items-center gap-2 bg-teal-50 text-teal-800 text-xs font-bold px-3 py-2 rounded-xl border border-teal-100">
              <Search className="w-4 h-4 text-teal-600" />
              <span>Chế độ: Công cụ tìm kiếm Lịch dạy nhanh</span>
            </div>
          )}

        </div>
      </div>

      {/* TEACHER CARD PROFILE (ONLY IN PERSONAL VIEW) */}
      {viewMode === 'personal' && selectedTeacher && (
        <div className="bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-5 rounded-3xl border border-emerald-100/50 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
              <span>Họ và tên: {selectedTeacher.name}</span>
              {selectedTeacher.username === currentUser?.username && (
                <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                  Tài khoản của bạn
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 font-semibold">
              Chức danh: <strong className="text-emerald-700">{selectedTeacher.role}</strong>
              {' | '} Tài khoản: <strong className="text-slate-600">{selectedTeacher.username}</strong>
              {' | '} Email: <strong className="text-slate-600">{selectedTeacher.email || 'N/A'}</strong>
            </p>
          </div>
          <div className="bg-white/80 px-3.5 py-2 rounded-2xl border border-emerald-100 shadow-sm text-right">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Tổng số tiết dạy</span>
            <span className="text-lg font-black text-emerald-700">
              {Object.keys(timetableData[selectedTeacherUsername] || {}).length} tiết / tuần
            </span>
          </div>
        </div>
      )}

      {/* --- MODE 1: PERSONAL VIEW --- */}
      {viewMode === 'personal' && (
        previewPaperMode ? (
          /* PREVIEW PAPER MODE */
          <div className="bg-neutral-100 p-8 rounded-3xl border border-slate-200 flex justify-center shadow-inner overflow-x-auto">
            <div className="bg-white text-black p-12 shadow-2xl rounded-sm border border-neutral-300 w-[1000px] shrink-0 text-left" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              
              {/* Center Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black uppercase tracking-wide text-neutral-900">THỜI KHÓA BIỂU (2025-2026) TỪ 9/9/2025</h1>
                <h2 className="text-base font-bold uppercase mt-1.5 text-neutral-800">
                  GIÁO VIÊN: {selectedTeacher?.name.toUpperCase()} – LỚP 2 BUỔI/ NGÀY
                </h2>
              </div>

              {/* Timetable Table */}
              <table className="w-full border-collapse border border-black text-center text-sm my-6">
                <thead>
                  <tr className="font-bold text-black uppercase bg-neutral-100">
                    <th className="border border-black py-3 px-2 w-[15%] font-bold text-sm">THỜI GIAN</th>
                    <th className="border border-black py-3 px-2 w-[10%] font-bold text-sm">TIẾT</th>
                    <th className="border border-black py-3 px-2 w-[15%] font-bold text-sm">THỨ HAI</th>
                    <th className="border border-black py-3 px-2 w-[15%] font-bold text-sm">THỨ BA</th>
                    <th className="border border-black py-3 px-2 w-[15%] font-bold text-sm">THỨ TƯ</th>
                    <th className="border border-black py-3 px-2 w-[15%] font-bold text-sm">THỨ NĂM</th>
                    <th className="border border-black py-3 px-2 w-[15%] font-bold text-sm">THỨ SÁU</th>
                  </tr>
                </thead>
                <tbody>
                  {/* --- SÁNG --- */}
                  {/* Tiết 1 */}
                  <tr>
                    <td className="border border-black font-black uppercase text-base" rowSpan={5}>SÁNG</td>
                    <td className="border border-black py-3 font-bold text-sm">1</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '1');
                      return (
                        <td key={`pre-1-${day}`} className="border border-black p-3 text-sm font-bold">
                          {data ? (
                            <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                          ) : ''}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Tiết 2 */}
                  <tr>
                    <td className="border border-black py-3 font-bold text-sm">2</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '2');
                      return (
                        <td key={`pre-2-${day}`} className="border border-black p-3 text-sm font-bold">
                          {data ? (
                            <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                          ) : ''}
                        </td>
                      );
                    })}
                  </tr>

                  {/* GIỜ RA CHƠI */}
                  <tr className="bg-neutral-50 text-center tracking-widest text-xs font-black uppercase text-neutral-850">
                    <td className="border border-black py-2.5 text-center font-bold" colSpan={6}>
                      GIỜ RA CHƠI
                    </td>
                  </tr>

                  {/* Tiết 3 */}
                  <tr>
                    <td className="border border-black py-3 font-bold text-sm">3</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '3');
                      return (
                        <td key={`pre-3-${day}`} className="border border-black p-3 text-sm font-bold">
                          {data ? (
                            <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                          ) : ''}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Tiết 4 */}
                  <tr>
                    <td className="border border-black py-3 font-bold text-sm">4</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '4');
                      return (
                        <td key={`pre-4-${day}`} className="border border-black p-3 text-sm font-bold">
                          {data ? (
                            <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                          ) : ''}
                        </td>
                      );
                    })}
                  </tr>

                  {/* --- CHIỀU --- */}
                  {/* Tiết 5 */}
                  <tr>
                    <td className="border border-black font-black uppercase text-base" rowSpan={3}>CHIỀU</td>
                    <td className="border border-black py-3 font-bold text-sm">5</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '5');
                      return (
                        <td key={`pre-5-${day}`} className="border border-black p-3 text-sm font-bold">
                          {data ? (
                            <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                          ) : ''}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Tiết 6 */}
                  <tr>
                    <td className="border border-black py-3 font-bold text-sm">6</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '6');
                      return (
                        <td key={`pre-6-${day}`} className="border border-black p-3 text-sm font-bold">
                          {data ? (
                            <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                          ) : ''}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Tiết 7 */}
                  <tr>
                    <td className="border border-black py-3 font-bold text-sm">7</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '7');
                      return (
                        <td key={`pre-7-${day}`} className="border border-black p-3 text-sm font-bold">
                          {data ? (
                            <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                          ) : ''}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>

              {/* Notes and Signature Footers */}
              <div className="flex justify-between items-start mt-8 w-full text-sm">
                <div className="text-left leading-relaxed text-neutral-800 space-y-1">
                  <span className="font-bold block text-neutral-900">Ghi chú:</span>
                  <span className="font-bold block mt-1">* Sáng:</span>
                  <span className="block pl-4">- Vào học: 7h00</span>
                  <span className="block pl-4">- Ra về: 10h10</span>
                  <span className="font-bold block mt-1">* Chiều:</span>
                  <span className="block pl-4">- Vào học: 14h00</span>
                  <span className="block pl-4">- Ra về: 16h10</span>
                </div>
                <div className="text-center w-[300px] flex flex-col justify-between h-[140px] text-neutral-900">
                  <div>
                    <span className="font-black uppercase tracking-wider block text-sm">GVBM</span>
                    <span className="italic text-xs text-neutral-500 block mt-1">(Ký và ghi rõ họ tên)</span>
                  </div>
                  <div className="mt-8">
                    <span className="font-bold text-base block border-t border-neutral-200/50 pt-2">{selectedTeacher?.name}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* REGULAR MODERN TIMETABLE VIEW */
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-3xl bg-slate-50/50 p-2">
              <table className="w-full border-collapse border border-slate-300 text-center text-xs min-w-[700px] print:text-[10px]">
                
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-slate-300 text-slate-800 font-extrabold uppercase text-[11px] print:bg-slate-100">
                    <th className="border border-slate-300 py-3 px-2 w-[130px]">THỜI GIAN</th>
                    <th className="border border-slate-300 py-3 px-2 w-[90px]">TIẾT</th>
                    <th className="border border-slate-300 py-3 px-3">THỨ HAI</th>
                    <th className="border border-slate-300 py-3 px-3">THỨ BA</th>
                    <th className="border border-slate-300 py-3 px-3">THỨ TƯ</th>
                    <th className="border border-slate-300 py-3 px-3">THỨ NĂM</th>
                    <th className="border border-slate-300 py-3 px-3">THỨ SÁU</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  
                  {/* --- BUỔI SÁNG --- */}
                  {/* Row 1 - Tiết 1 */}
                  <tr className="hover:bg-slate-50/40 transition">
                    <td className="border border-slate-300 font-black text-slate-800 tracking-wider text-[11px] bg-slate-50/55" rowSpan={5}>
                      <div className="flex flex-col items-center justify-center p-2">
                        <span className="text-emerald-600 text-lg">☀️</span>
                        <span className="font-black tracking-widest text-[#113f43] uppercase text-xs">SÁNG</span>
                        <span className="text-[10px] text-slate-400 font-bold mt-1">7h00 - 10h10</span>
                      </div>
                    </td>
                    <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Sáng 1</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '1');
                      return (
                        <td key={`1-${day}`} className="border border-slate-300 p-3.5 min-h-[64px]">
                          {data ? (
                            <div className="space-y-1">
                              <p className="font-black text-emerald-800 uppercase text-xs">{data.subject}</p>
                              <span className="inline-flex bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                                Lớp {formatSuperscriptClass(data.className)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic font-semibold">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 2 - Tiết 2 */}
                  <tr className="hover:bg-slate-50/40 transition">
                    <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Sáng 2</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '2');
                      return (
                        <td key={`2-${day}`} className="border border-slate-300 p-3.5 min-h-[64px]">
                          {data ? (
                            <div className="space-y-1">
                              <p className="font-black text-emerald-800 uppercase text-xs">{data.subject}</p>
                              <span className="inline-flex bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                                Lớp {formatSuperscriptClass(data.className)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic font-semibold">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* BAR FOR GIỜ RA CHƠI */}
                  <tr className="bg-slate-550/10 text-center tracking-widest text-[11px] font-bold bg-slate-100 text-slate-700">
                    <td className="border border-slate-300 py-2.5 bg-slate-150" colSpan={1}>
                      <div className="flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </td>
                    <td className="border border-slate-300 py-2.5 text-slate-800 font-black uppercase tracking-wider" colSpan={5}>
                      ☕ GIỜ RA CHƠI (GIẢI LAO PHÒNG MÁY)
                    </td>
                  </tr>

                  {/* Row 3 - Tiết 3 */}
                  <tr className="hover:bg-slate-50/40 transition">
                    <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Sáng 3</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '3');
                      return (
                        <td key={`3-${day}`} className="border border-slate-300 p-3.5 min-h-[64px]">
                          {data ? (
                            <div className="space-y-1">
                              <p className="font-black text-emerald-800 uppercase text-xs">{data.subject}</p>
                              <span className="inline-flex bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                                Lớp {formatSuperscriptClass(data.className)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic font-semibold">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 4 - Tiết 4 */}
                  <tr className="hover:bg-slate-50/40 transition">
                    <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Sáng 4</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '4');
                      return (
                        <td key={`4-${day}`} className="border border-slate-300 p-3.5 min-h-[64px]">
                          {data ? (
                            <div className="space-y-1">
                              <p className="font-black text-emerald-800 uppercase text-xs">{data.subject}</p>
                              <span className="inline-flex bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                                Lớp {formatSuperscriptClass(data.className)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic font-semibold">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 4.5 - Tiết Trưa / Ra chơi sáng */}
                  <tr className="bg-slate-550/10 text-center tracking-widest text-[11px] font-bold text-slate-500">
                    <td className="border border-slate-300 py-1.5" colSpan={1}>
                      🌙
                    </td>
                    <td className="border border-[#e2e8f0] py-1.5 text-[9px] uppercase tracking-wider font-extrabold text-slate-400" colSpan={5}>
                      Nghỉ trưa & Chuẩn bị buổi chiều
                    </td>
                  </tr>

                  {/* --- BUỔI CHIỀU --- */}
                  {/* Row 5 - Tiết 5 */}
                  <tr className="hover:bg-slate-50/40 transition">
                    <td className="border border-slate-300 font-black text-slate-800 tracking-wider text-[11px] bg-slate-50/55" rowSpan={3}>
                      <div className="flex flex-col items-center justify-center p-2">
                        <span className="text-teal-600 text-lg">🌇</span>
                        <span className="font-black tracking-widest text-[#113f43] uppercase text-xs">CHIỀU</span>
                        <span className="text-[10px] text-slate-400 font-bold mt-1">14h00 - 16h10</span>
                      </div>
                    </td>
                    <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Chiều 5</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '5');
                      return (
                        <td key={`5-${day}`} className="border border-slate-300 p-3.5 min-h-[64px]">
                          {data ? (
                            <div className="space-y-1">
                              <p className="font-black text-emerald-800 uppercase text-xs">{data.subject}</p>
                              <span className="inline-flex bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                                Lớp {formatSuperscriptClass(data.className)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic font-semibold">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 6 - Tiết 6 */}
                  <tr className="hover:bg-slate-50/40 transition">
                    <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Chiều 6</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '6');
                      return (
                        <td key={`6-${day}`} className="border border-slate-300 p-3.5 min-h-[64px]">
                          {data ? (
                            <div className="space-y-1">
                              <p className="font-black text-emerald-800 uppercase text-xs">{data.subject}</p>
                              <span className="inline-flex bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                                Lớp {formatSuperscriptClass(data.className)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic font-semibold">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 7 - Tiết 7 */}
                  <tr className="hover:bg-slate-50/40 transition">
                    <td className="border border-slate-300 font-extrabold bg-slate-50/55 text-slate-600 py-4">Chiều 7</td>
                    {['2', '3', '4', '5', '6'].map((day) => {
                      const data = getCellData(day, '7');
                      return (
                        <td key={`7-${day}`} className="border border-slate-300 p-3.5 min-h-[64px]">
                          {data ? (
                            <div className="space-y-1">
                              <p className="font-black text-emerald-800 uppercase text-xs">{data.subject}</p>
                              <span className="inline-flex bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                                Lớp {formatSuperscriptClass(data.className)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic font-semibold">Trống</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                </tbody>
              </table>
            </div>

            {/* INFO FOOTER */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-xs font-semibold text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="block font-black text-emerald-800 uppercase text-[10px]">📌 QUY ĐỊNH & THÔNG TIN THỜI GIAN:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li><strong>SÁNG:</strong> Vào lớp: <strong>7h00</strong>. Ra về: <strong>10h10</strong></li>
                  <li><strong>CHIỀU:</strong> Vào lớp: <strong>14h00</strong>. Ra về: <strong>16h10</strong></li>
                  <li>Nếu phát hiện sai sót trong lịch phân công giảng dạy, vui lòng liên hệ Ban Giám Hiệu (Admin) để cập nhật kịp thời.</li>
                </ul>
              </div>
            </div>
          </div>
        )
      )}

      {/* --- MODE 2: GLOBAL MASTER VIEW --- */}
      {viewMode === 'global' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 text-left animate-fadeIn">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                BẢNG TỔNG HỢP GIẢNG DẠY TOÀN TRƯỜNG
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Xem chi tiết phân bổ lịch dạy của tất cả giáo viên theo từng ngày để dễ quản lý và theo dõi.
              </p>
            </div>
            
            {/* Day Selector */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full lg:w-auto">
              {['2', '3', '4', '5', '6'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedGlobalDay(day)}
                  className={`flex-1 lg:flex-none px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    selectedGlobalDay === day
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Thứ {day === '2' ? 'Hai' : day === '3' ? 'Ba' : day === '4' ? 'Tư' : day === '5' ? 'Năm' : 'Sáu'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-3xl bg-slate-50/50 p-2">
            <table className="w-full border-collapse text-center text-xs min-w-[900px]">
              <thead>
                {/* Session headers */}
                <tr className="bg-slate-200 border-b border-slate-300 text-slate-800 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3 w-[180px] text-left border border-slate-300" rowSpan={2}>Giáo viên</th>
                  <th className="py-1.5 px-2 border border-slate-300 bg-emerald-50 text-emerald-800" colSpan={4}>BUỔI SÁNG (☀️ 7h00 - 10h10)</th>
                  <th className="py-1.5 px-2 border border-slate-300 bg-teal-50 text-teal-800" colSpan={3}>BUỔI CHIỀU (🌇 14h00 - 16h10)</th>
                </tr>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[9px]">
                  <th className="py-2 border border-slate-300 w-[100px]">Tiết 1</th>
                  <th className="py-2 border border-slate-300 w-[100px]">Tiết 2</th>
                  <th className="py-2 border border-slate-300 w-[100px]">Tiết 3</th>
                  <th className="py-2 border border-slate-300 w-[100px]">Tiết 4</th>
                  <th className="py-2 border border-slate-300 w-[100px]">Tiết 5</th>
                  <th className="py-2 border border-slate-300 w-[100px]">Tiết 6</th>
                  <th className="py-2 border border-slate-300 w-[100px]">Tiết 7</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {teachers.map((t) => {
                  const schedule = timetableData[t.username] || {};
                  const totalPeriodsToday = Object.keys(schedule).filter(k => k.startsWith(`${selectedGlobalDay}-`)).length;
                  
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/40 transition">
                      {/* Teacher Profile Column */}
                      <td className="border border-slate-300 p-3 text-left font-semibold bg-slate-50/40">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          {t.name}
                          {t.username === currentUser?.username && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1 rounded">Tôi</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{t.role}</div>
                        <div className="text-[9px] text-slate-400 mt-1 font-bold">
                          Dạy hôm nay: <span className="text-emerald-700 font-black">{totalPeriodsToday} tiết</span>
                        </div>
                      </td>

                      {/* Tiết 1 - 7 Columns */}
                      {['1', '2', '3', '4', '5', '6', '7'].map((period) => {
                        const cell = schedule[`${selectedGlobalDay}-${period}`];
                        return (
                          <td key={period} className="border border-slate-300 p-2 min-h-[50px] vertical-middle">
                            {cell ? (
                              <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-150 shadow-sm transition hover:scale-[1.02]">
                                <p className="font-extrabold text-[9px] uppercase leading-tight tracking-wide">{cell.subject}</p>
                                <p className="font-black text-[11px] text-emerald-950 mt-0.5">{formatSuperscriptClass(cell.className)}</p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic font-medium">Trống</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODE 3: ADVANCED QUICK LOOKUP --- */}
      {viewMode === 'search' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 text-left animate-fadeIn">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên lớp (ví dụ: 4/3), tên môn học (Tin học), hoặc tên giáo viên..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
                >
                  Xóa
                </button>
              )}
            </div>
            
            <div className="flex gap-2 shrink-0">
              {['Lớp 3', 'Lớp 4', 'Lớp 5', 'Tin học'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl text-xs font-bold text-slate-600 border border-slate-100 transition"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {searchQuery ? (
            searchResults.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-3xl">
                <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px]">
                      <th className="py-3 px-4">Giáo viên</th>
                      <th className="py-3 px-4">Thời gian giảng dạy</th>
                      <th className="py-3 px-4">Môn học</th>
                      <th className="py-3 px-4">Lớp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {searchResults.map((res, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{res.teacher.name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{res.teacher.role}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-100 mr-2">
                            Thứ {res.day === '2' ? 'Hai' : res.day === '3' ? 'Ba' : res.day === '4' ? 'Tư' : res.day === '5' ? 'Năm' : 'Sáu'}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-lg border border-teal-100">
                            Tiết {res.period} ({res.period <= '4' ? 'Sáng' : 'Chiều'})
                          </span>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-700 uppercase">
                          {res.subject}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-100 text-slate-800 font-black px-2.5 py-0.5 rounded-lg border border-amber-250 text-xs">
                            Lớp {formatSuperscriptClass(res.className)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-2">
                <p className="text-slate-400 font-bold text-sm">Không tìm thấy thời khóa biểu phù hợp với từ khóa "{searchQuery}"</p>
                <p className="text-xs text-slate-400">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc kiểm tra lại chính tả.</p>
              </div>
            )
          ) : (
            <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-slate-500 font-bold text-sm">Sẵn sàng tra cứu nâng cao</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Bạn có thể tìm kiếm bất kỳ thông tin nào liên quan đến môn học, lớp học (Ví dụ: <strong>3/5</strong>, <strong>4/4</strong>), tên giáo viên, hoặc các ngày trong tuần.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HIDDEN PRINT-ONLY CONTAINER WITH EXACT MATCH TO THE ATTACHED PHOTO */}
      <div id="printable-timetable" className="hidden bg-white text-black p-12 leading-normal" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        {/* Title Block */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">THỜI KHÓA BIỂU (2024-2025) TỪ 9/9/2024</h1>
          <h2 className="text-sm font-bold uppercase mt-1">
            GIÁO VIÊN: {selectedTeacher?.name.toUpperCase()} – LỚP 2 BUỔI/ NGÀY
          </h2>
        </div>

        {/* Exact Photo Structure Table */}
        <table className="w-full border-collapse border border-black text-center text-[11px] my-4">
          <thead>
            <tr className="font-bold text-black uppercase">
              <th className="border border-black py-2.5 px-2 w-[15%] font-bold text-xs" style={{ border: '1px solid black' }}>THỜI GIAN</th>
              <th className="border border-black py-2.5 px-2 w-[10%] font-bold text-xs" style={{ border: '1px solid black' }}>TIẾT</th>
              <th className="border border-black py-2.5 px-2 w-[15%] font-bold text-xs" style={{ border: '1px solid black' }}>THỬ HAI</th>
              <th className="border border-black py-2.5 px-2 w-[15%] font-bold text-xs" style={{ border: '1px solid black' }}>THỨ BA</th>
              <th className="border border-black py-2.5 px-2 w-[15%] font-bold text-xs" style={{ border: '1px solid black' }}>THỨ TƯ</th>
              <th className="border border-black py-2.5 px-2 w-[15%] font-bold text-xs" style={{ border: '1px solid black' }}>THỨ NĂM</th>
              <th className="border border-black py-2.5 px-2 w-[15%] font-bold text-xs" style={{ border: '1px solid black' }}>THỨ SÁU</th>
            </tr>
          </thead>
          <tbody>
            {/* --- SÁNG --- */}
            {/* Row 1 - Tiết 1 */}
            <tr>
              <td className="border border-black font-bold uppercase text-xs w-[15%]" rowSpan={5} style={{ border: '1px solid black', fontWeight: 'bold' }}>SÁNG</td>
              <td className="border border-black py-2 font-bold text-xs w-[10%]" style={{ border: '1px solid black', fontWeight: 'bold' }}>1</td>
              {['2', '3', '4', '5', '6'].map((day) => {
                const data = getCellData(day, '1');
                return (
                  <td key={`p-1-${day}`} className="border border-black p-2 font-bold" style={{ border: '1px solid black' }}>
                    {data ? (
                      <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                    ) : ''}
                  </td>
                );
              })}
            </tr>

            {/* Row 2 - Tiết 2 */}
            <tr>
              <td className="border border-black py-2 font-bold text-xs" style={{ border: '1px solid black', fontWeight: 'bold' }}>2</td>
              {['2', '3', '4', '5', '6'].map((day) => {
                const data = getCellData(day, '2');
                return (
                  <td key={`p-2-${day}`} className="border border-black p-2 font-bold" style={{ border: '1px solid black' }}>
                    {data ? (
                      <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                    ) : ''}
                  </td>
                );
              })}
            </tr>

            {/* GIỜ RA CHƠI row */}
            <tr className="font-bold text-center">
              <td className="border border-black py-1.5 font-bold uppercase text-[10px]" colSpan={6} style={{ border: '1px solid black', fontWeight: 'bold', letterSpacing: '2px' }}>
                GIỜ RA CHƠI
              </td>
            </tr>

            {/* Row 3 - Tiết 3 */}
            <tr>
              <td className="border border-black py-2 font-bold text-xs" style={{ border: '1px solid black', fontWeight: 'bold' }}>3</td>
              {['2', '3', '4', '5', '6'].map((day) => {
                const data = getCellData(day, '3');
                return (
                  <td key={`p-3-${day}`} className="border border-black p-2 font-bold" style={{ border: '1px solid black' }}>
                    {data ? (
                      <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                    ) : ''}
                  </td>
                );
              })}
            </tr>

            {/* Row 4 - Tiết 4 */}
            <tr>
              <td className="border border-black py-2 font-bold text-xs" style={{ border: '1px solid black', fontWeight: 'bold' }}>4</td>
              {['2', '3', '4', '5', '6'].map((day) => {
                const data = getCellData(day, '4');
                return (
                  <td key={`p-4-${day}`} className="border border-black p-2 font-bold" style={{ border: '1px solid black' }}>
                    {data ? (
                      <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                    ) : ''}
                  </td>
                );
              })}
            </tr>

            {/* --- CHIỀU --- */}
            {/* Row 5 - Tiết 5 */}
            <tr>
              <td className="border border-black font-bold uppercase text-xs w-[15%]" rowSpan={3} style={{ border: '1px solid black', fontWeight: 'bold' }}>CHIỀU</td>
              <td className="border border-black py-2 font-bold text-xs w-[10%]" style={{ border: '1px solid black', fontWeight: 'bold' }}>5</td>
              {['2', '3', '4', '5', '6'].map((day) => {
                const data = getCellData(day, '5');
                return (
                  <td key={`p-5-${day}`} className="border border-black p-2 font-bold" style={{ border: '1px solid black' }}>
                    {data ? (
                      <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                    ) : ''}
                  </td>
                );
              })}
            </tr>

            {/* Row 6 - Tiết 6 */}
            <tr>
              <td className="border border-black py-2 font-bold text-xs" style={{ border: '1px solid black', fontWeight: 'bold' }}>6</td>
              {['2', '3', '4', '5', '6'].map((day) => {
                const data = getCellData(day, '6');
                return (
                  <td key={`p-6-${day}`} className="border border-black p-2 font-bold" style={{ border: '1px solid black' }}>
                    {data ? (
                      <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                    ) : ''}
                  </td>
                );
              })}
            </tr>

            {/* Row 7 - Tiết 7 */}
            <tr>
              <td className="border border-black py-2 font-bold text-xs" style={{ border: '1px solid black', fontWeight: 'bold' }}>7</td>
              {['2', '3', '4', '5', '6'].map((day) => {
                const data = getCellData(day, '7');
                return (
                  <td key={`p-7-${day}`} className="border border-black p-2 font-bold" style={{ border: '1px solid black' }}>
                    {data ? (
                      <span>{data.subject} {formatSuperscriptClass(data.className)}</span>
                    ) : ''}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        {/* Footer info blocks exact match */}
        <div className="flex justify-between items-start mt-6 w-full text-[11px]" style={{ width: '100%' }}>
          <div className="text-left leading-normal" style={{ textAlign: 'left' }}>
            <span className="font-bold block" style={{ fontWeight: 'bold' }}>Ghi chú:</span>
            <span className="font-bold block mt-1" style={{ fontWeight: 'bold' }}>* Sáng:</span>
            <span className="block pl-4">- Vào học: 7h00</span>
            <span className="block pl-4">- Ra về:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10h10</span>
            <span className="font-bold block mt-1" style={{ fontWeight: 'bold' }}>* Chiều:</span>
            <span className="block pl-4">- Vào học: 14h00</span>
            <span className="block pl-4">- Ra về:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;16h10</span>
          </div>
          <div className="text-center w-[250px] flex flex-col justify-between h-[110px]" style={{ textAlign: 'center' }}>
            <div>
              <span className="font-bold uppercase tracking-wider block" style={{ fontWeight: 'bold' }}>GVBM</span>
              <span className="italic text-[9px] text-neutral-500 block" style={{ fontStyle: 'italic' }}>(Ký và ghi rõ họ tên)</span>
            </div>
            <div className="mt-8">
              <span className="font-bold text-xs block" style={{ fontWeight: 'bold' }}>{selectedTeacher?.name}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
