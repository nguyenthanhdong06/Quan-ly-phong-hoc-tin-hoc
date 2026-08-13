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
  getStudentAttendance
}: ExportWordSeatingChartOptions) {
  const dateStr = new Date().toLocaleDateString('vi-VN');

  // Construct MS Word HTML document with MSO page orientation LANDSCAPE (Khổ giấy ngang)
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
          margin: 1.0cm 1.0cm 1.0cm 1.0cm;
          mso-page-orientation: landscape;
        }
        div.Section1 {
          page: Section1;
        }
        @page {
          size: A4 landscape;
          margin: 1cm 1cm 1cm 1cm;
          mso-page-orientation: landscape;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          color: #000000;
          margin: 0;
          padding: 0;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        .header-table td {
          padding: 4px;
          vertical-align: top;
        }
        .title {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          margin-top: 10px;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .sub-title {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 15px;
        }
        .screen-banner {
          background-color: #fef3c7;
          color: #78350f;
          font-weight: bold;
          text-align: center;
          padding: 6px;
          font-size: 10pt;
          border: 1px solid #d97706;
          margin-bottom: 10px;
          border-radius: 4px;
        }
        .grid-table {
          width: 100%;
          border: 1px solid #000;
          margin-bottom: 15px;
        }
        .grid-table td {
          border: 1px solid #000;
          padding: 4px;
          vertical-align: top;
          height: 65px;
        }
        .pc-box {
          background-color: #f8fafc;
        }
        .pc-header {
          font-weight: bold;
          font-size: 9pt;
          border-bottom: 1px solid #94a3b8;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .student-pill {
          background-color: #d1fae5;
          border: 1px solid #10b981;
          font-size: 9pt;
          font-weight: bold;
          padding: 3px;
          text-align: center;
          margin-bottom: 3px;
          border-radius: 4px;
        }
        .student-absent {
          background-color: #ffe4e6;
          border: 1px solid #f43f5e;
          color: #9f1239;
          text-decoration: line-through;
        }
        .aisle-box {
          background-color: #f1f5f9;
          color: #94a3b8;
          text-align: center;
          font-size: 8pt;
          font-weight: bold;
          vertical-align: middle !important;
        }
        .footer-table td {
          text-align: center;
          font-weight: bold;
          padding-top: 25px;
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

  // Render Rows & Columns
  for (let r = 0; r < gridRows; r++) {
    htmlContent += '<tr>';
    for (let c = 0; c < gridCols; c++) {
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
        htmlContent += `<div style="font-size: 8pt; color: #94a3b8; font-style: italic; text-align: center; margin-top: 15px;">Chưa xếp</div>`;
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
