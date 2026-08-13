import { LabInfo, Student, LabIncident } from '../types';
import { formatComputerName } from './nameFormatter';

export interface ExportWordSeatingChartOptions {
  className: string;
  lab: LabInfo;
  classStudents: Student[];
  attendanceSummary: { total: number; present: number; excused: number; unexcused: number; absentTotal: number };
  cellDataMap: Record<string, { assignedStudents: Student[]; monitorRole: 'L. Trưởng' | 'Lớp phó' | 'Tổ trưởng' | null; targetIncident: LabIncident | null }>;
  gridRows: number;
  gridCols: number;
  gridCells: Array<{ row: number; col: number; type: 'pc' | 'aisle' | 'desk'; label: string; pcNum: number }>;
  getStudentAttendance: (id: string) => 'present' | 'excused' | 'unexcused';
  hideAisles?: boolean;
}

export function exportSeatingChartToWord({
  className,
  lab,
  classStudents,
  attendanceSummary,
  cellDataMap,
  gridRows,
  gridCols,
  gridCells,
  getStudentAttendance,
  hideAisles = true
}: ExportWordSeatingChartOptions) {
  const dateStr = new Date().toLocaleDateString('vi-VN');

  // 1. Identify columns containing at least 1 PC
  const pcColsSet = new Set<number>();
  gridCells.forEach(cell => {
    if (cell.type === 'pc') pcColsSet.add(cell.col);
  });

  const shouldHideAisles = hideAisles !== false && pcColsSet.size > 0;
  const sortedCols = shouldHideAisles
    ? Array.from(pcColsSet).sort((a, b) => a - b)
    : Array.from({ length: gridCols }, (_, i) => i);

  // Construct MS Word HTML document with MSO page orientation LANDSCAPE (A4 Ngang 1 trang)
  let htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Sơ Đồ Phòng Máy Tính - Lớp ${className.toUpperCase()}</title>
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
        @page Section1 {
          size: 29.7cm 21.0cm;
          margin: 0.8cm 0.8cm 0.8cm 0.8cm;
          mso-page-orientation: landscape;
        }
        div.Section1 {
          page: Section1;
        }
        @page {
          size: A4 landscape;
          margin: 0.8cm;
          mso-page-orientation: landscape;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 10pt;
          color: #000000;
          margin: 0;
          padding: 0;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          table-layout: fixed;
        }
        .header-table td {
          padding: 2px 4px;
          vertical-align: top;
        }
        .title {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin-top: 4px;
          margin-bottom: 3px;
          text-transform: uppercase;
        }
        .sub-title {
          font-size: 10pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
        }
        .screen-banner {
          background-color: #fef3c7;
          color: #78350f;
          font-weight: bold;
          text-align: center;
          padding: 4px;
          font-size: 9.5pt;
          border: 1px solid #d97706;
          margin-bottom: 8px;
          border-radius: 4px;
        }
        .grid-table {
          width: 100%;
          border: 1px solid #000;
          margin-bottom: 8px;
        }
        .grid-table td {
          border: 1px solid #000;
          padding: 3px;
          vertical-align: top;
          height: 52px;
        }
        .pc-box {
          background-color: #f8fafc;
        }
        .pc-header {
          font-weight: bold;
          font-size: 8.5pt;
          border-bottom: 1px solid #94a3b8;
          padding-bottom: 2px;
          margin-bottom: 3px;
        }
        .student-pill {
          background-color: #d1fae5;
          border: 1px solid #10b981;
          font-size: 8.5pt;
          font-weight: bold;
          padding: 2px;
          text-align: center;
          margin-bottom: 2px;
          border-radius: 3px;
        }
        .student-absent {
          background-color: #ffe4e6;
          border: 1px solid #f43f5e;
          color: #9f1239;
          text-decoration: line-through;
        }
        .aisle-box {
          background-color: #f8fafc;
          border: 1px dashed #cbd5e1;
          color: #94a3b8;
          text-align: center;
          font-size: 7.5pt;
          font-weight: bold;
          vertical-align: middle !important;
          height: 35px;
        }
        .footer-table td {
          text-align: center;
          font-weight: bold;
          padding-top: 12px;
          font-size: 9.5pt;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <table class="header-table">
          <tr>
            <td style="width: 55%;">
              <b>TRƯỜNG TIỂU HỌC LONG ĐỊNH</b><br>
              <i>Bộ Môn Tin Học • Quản Lý Phòng Lab</i>
            </td>
            <td style="width: 45%; text-align: right;">
              <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>
              <i>Độc lập - Tự do - Hạnh phúc</i><br>
              <small>Ngày xuất: ${dateStr}</small>
            </td>
          </tr>
        </table>

        <div class="title">SƠ ĐỒ PHÒNG MÁY TÍNH - LỚP ${className.toUpperCase()}</div>
        <div class="sub-title">
          ${lab.name} (${lab.code}) &bull; Sĩ số: ${classStudents.length} học sinh 
          (${attendanceSummary.present} có mặt, ${attendanceSummary.absentTotal} vắng)
        </div>

        <div class="screen-banner">MÀN CHIẾU & BẢNG GIÁO VIÊN (${lab.name.toUpperCase()})</div>

        <table class="grid-table">
  `;

  // Render Rows & Compact Columns (omit empty aisle columns)
  for (let r = 0; r < gridRows; r++) {
    htmlContent += '<tr>';
    for (const c of sortedCols) {
      const tile = gridCells.find(cell => cell.row === r && cell.col === c);
      if (!tile || tile.type === 'aisle') {
        htmlContent += `<td class="aisle-box">Lối đi</td>`;
        continue;
      }

      const pcId = tile.label;
      const formattedPcName = formatComputerName(pcId);
      const cellData = cellDataMap[pcId] || { assignedStudents: [] };
      const assignedSts = cellData.assignedStudents || [];

      htmlContent += `<td class="pc-box">`;
      htmlContent += `<div class="pc-header">🖥️ ${formattedPcName}</div>`;

      if (assignedSts.length > 0) {
        assignedSts.forEach(st => {
          const att = getStudentAttendance(st.id);
          const isAbsent = att === 'excused' || att === 'unexcused';
          const role = (cellData as any)?.monitorRole;
          
          let roleTag = '';
          if (role === 'L. Trưởng') roleTag = ' 🌟[L.TRƯỞNG]';
          if (role === 'Lớp phó') roleTag = ' ⭐[LỚP PHÓ]';

          if (isAbsent) {
            htmlContent += `<div class="student-pill student-absent">[VẮNG] ${st.name}${roleTag}</div>`;
          } else {
            htmlContent += `<div class="student-pill">${st.name}${roleTag}</div>`;
          }
        });
      } else {
        htmlContent += `<div style="font-size: 7.5pt; color: #94a3b8; font-style: italic; text-align: center; margin-top: 10px;">Chưa xếp</div>`;
      }

      htmlContent += `</td>`;
    }
    htmlContent += '</tr>';
  }

  htmlContent += `
        </table>

        <table class="footer-table">
          <tr>
            <td style="width: 50%;">
              CÁN BỘ QUẢN LÝ PHÒNG LAB<br>
              <small style="font-weight: normal; color: #64748b;">(Ký và ghi rõ họ tên)</small>
            </td>
            <td style="width: 50%;">
              GIÁO VIÊN BỘ MÔN TIN HỌC<br>
              <small style="font-weight: normal; color: #64748b;">(Ký và ghi rõ họ tên)</small>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  // Create Blob and trigger instant browser download
  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  const fileName = `So_Do_Phong_May_${className.toUpperCase()}_${lab.code}_${new Date().toISOString().split('T')[0]}.doc`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
