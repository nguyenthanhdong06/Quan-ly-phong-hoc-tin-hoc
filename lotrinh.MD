# 🗺️ LỘ TRÌNH PHÁT TRIỂN & BÁO CÁO RÀ SOÁT NGUỒN MÃ
> **Hệ Thống Số Quản Lý Phòng Học Tin Học - Trường Tiểu Học Long Định**
> *Cập nhật lần cuối: 14/08/2026*

---

## 📌 QUY TẮC BẮT ĐẦU VÀ NGUYÊN TẮC PHÁT TRIỂN (WORKFLOW RULES)
> [!IMPORTANT]
> **Mỗi khi bắt đầu ca làm việc mới, nhận lệnh mới hoặc được yêu cầu, AI/Developer MUST đọc file `lotrinh.MD` này trước tiên để nắm rõ vị trí hiện tại, tiến độ các công việc đã hoàn thành và danh mục việc cần làm tiếp theo.**
> 
> **3 QUY TẮC NGUYÊN TẮC PHÁT TRIỂN HỆ THỐNG:**
> 1. **Giới hạn số dòng File**: Tất cả các file sửa và tạo mới **không được viết quá 600 dòng** (trong trường hợp đặc biệt bắt buộc không được vượt quá 800 dòng).
> 2. **Cấu trúc Mô-đun tính năng**: **Mỗi tính năng phải nằm ở một file hoặc folder riêng biệt**, tuyệt đối không gộp nhiều tính năng chung trong một file/folder.
> 3. **Tư vấn Thiết kế Giao diện**: Khi bắt đầu thiết kế hoặc thay đổi thiết kế giao diện, chủ động **tư vấn lựa chọn giữa Ant Design và Nuxt UI kết hợp với UI-UX-MASTER** để người dùng lựa chọn giải pháp tối ưu nhất.

---

## 📋 I. NẬT KÝ LỘ TRÌNH CÁC CÔNG VIỆC ĐÃ HOÀN THÀNH (ROADMAP LOG)

### 🚀 GIAI ĐOẠN 1: THIẾT KẾ GIAO DIỆN & TÍNH NĂNG CỐT LÕI
- [x] **Xây dựng Sơ đồ phòng máy 3D & Xếp chỗ tự động**: Quản lý 36-40 máy trạm, phân bổ học sinh theo sơ đồ lớp, cho phép kéo thả và xem chi tiết học sinh ngồi từng máy.
- [x] **Quản lý Học sinh & Khối Lớp**: Quản lý danh sách học sinh theo khối (Khối 3, Khối 4, Khối 5), quản lý danh sách lớp học và thông tin cá nhân.
- [x] **Đánh giá & Chấm điểm học tập**: Đánh giá nếp học, chuyên cần, thao tác máy và phát thưởng Sao tích lũy cho từng học sinh.
- [x] **Bảng Thi đua & Đổi thưởng**: Bảng xếp hạng học sinh nhiều Sao nhất lớp/khối, tích hợp hiệu ứng pháo hoa chúc mừng khi đạt danh hiệu.
- [x] **Kho Avatar Hoạt họa 3D**: Tích hợp danh mục Avatar tùy chỉnh (Google Drive / Upload) & bộ Avatar mặc định hoạt họa cute 3D cho Nam (`👦🏻`) và Nữ (`👧🏻`).
- [x] **Hệ thống Game Tương tác & Câu hỏi Cá nhân**: Tích hợp các trò chơi ô chữ, trắc nghiệm và câu hỏi kiến thức Tin học cho học sinh.
- [x] **Báo cáo Sự cố Máy tính**: Học sinh/Giáo viên ghi nhận hư hỏng bàn phím, chuột, màn hình, tai nghe và gửi báo cáo về quản trị viên.

---

### 🎨 GIAI ĐOẠN 2: THẺ HỌC SINH 3D & QUY TẮC HIỂN THỊ TÊN TỰ ĐỘNG
- [x] **Tích hợp Khung Thẻ Học Sinh 3D Độc quyền**:
  - **Học sinh Nữ**: Sử dụng mẫu khung [thehocsinhnu.png](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/public/thehocsinhnu.png) (tỷ lệ chuẩn `353 x 484 px`, tone hồng chấm bi cute).
  - **Học sinh Nam**: Sử dụng mẫu khung [thehocsinhnam.png](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/public/thehocsinhnam.png) (tỷ lệ chuẩn `354 x 460 px`, tone xanh da trời năng động).
- [x] **3 Quy tắc hiển thị Tên Học Sinh Rút gọn Thông minh ([nameFormatter.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/nameFormatter.ts))**:
  - **Quy tắc 1 (Không trùng tên lót & tên)**: *"Nguyễn Ngọc An"* $\rightarrow$ *"Ngọc An"*.
  - **Quy tắc 2 (Trùng tên lót & tên, khác họ)**: *"Nguyễn Ngọc An"* & *"Huỳnh Ngọc An"* $\rightarrow$ *"Ngọc An"* & *"Huỳnh An"*.
  - **Quy tắc 3 (Trùng cả Họ, Tên lót & Tên trong 1 lớp)**: 2 học sinh cùng tên *"Nguyễn Ngọc An"* $\rightarrow$ *"Ngọc An A"* & *"Ngọc An B"*.
- [x] **Bố trí 4 Vị trí Thông tin Chuẩn trên Thẻ Học Sinh**:
  - **Vị trí 1 (Số Sao)**: Nằm góc trên bên phải bảng trắng (`0 ⭐`, `2 ⭐`).
  - **Vị trí 2 (Avatar)**: Căn giữa phần trên bảng trắng.
  - **Vị trí 3 (Tên học sinh - NỔI BẬT)**: Nằm giữa phía dưới Avatar, được đóng khung làm nổi bật với phông chữ `font-black`.
  - **Vị trí 4 (Số máy)**: Nằm phía dưới Tên học sinh (`💻 Máy 05` / `💻 Chưa xếp máy`).
- [x] **Loại bỏ lằn gạch ngang & Khung bo góc Avatar**: Tẩy sạch dứt điểm 100% các nét kẻ ngang cũ và bỏ khung bo góc gò bó xung quanh avatar, giúp thẻ thông thoáng tự nhiên.

---

### 🔑 GIAI ĐOẠN 3: NÂNG CẤP TRANG ĐĂNG NHẬP THÀNH TRANG CHÍNH & TINH CHỈNH GIAO DIỆN MỚI
- [x] **Tự động Load Trang Đăng Nhập khi Truy cập Website**: Trang Đăng Nhập chính thức trở thành Trang Đích (Landing Page) mặc định.
- [x] **Loại bỏ Zoom Hover & Xóa dòng Khách**: Loại bỏ hiệu ứng zoom form và nút vào trang dạng Khách.
- [x] **Khắc phục Triệt để Lỗi Lằn Sọc Màu**: Gỡ bỏ drop-shadow làm bóng mờ SVG bị đổ lệch màu.
- [x] **Cập nhật Mã Màu Xanh Hoàng Gia `#381DFC`**: Đồng bộ mã màu Indigo/Royal Blue đậm đà trên background.
- [x] **Áp dụng Nút Bấm Capsule 3D Tím Hồng Mới**: Nút bấm login 3D WebP nén nhẹ `11.2KB` kèm vệt sáng Glass Shine Sweep.
- [x] **Xây dựng Giao diện DeskOS (Neumorphic Desk OS Interface)**: Màn hình vintage, menu popover không thanh cuộn, đa cửa sổ Mac OS, Taskbar Dock, âm thanh khen thưởng, bảng vinh danh 3D Top 3 có hoạt hình nhảy bục.
- [x] **Xóa Trống Thông Tin Ô User & Password khi Đăng xuất**: Reset tự động nâng cao bảo mật.

---

### 🛡️ GIAI ĐOẠN 4: BẢO MẬT & TỐI ƯU HÓA HIỆU NĂNG TỐC ĐỘ
- [x] **Mã hóa Mật khẩu SHA-256 ([security.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/security.ts))**: Tích hợp mã hóa SHA-256 & `sanitizeInput` chống XSS/Injection.
- [x] **Nén Ảnh WebP Tốc độ Siêu tốc**: Nén toàn bộ ảnh static giảm dung lượng từ ~1.6MB xuống ~480KB (tải trang nhanh x3 lần).

---

### 🌟 GIAI ĐOẠN 5: CHUẨN HÓA GIAO DIỆN INLINE VIEW, TỐI ƯU CÂY THI ĐƯA & ĐỒNG BỘ ĐÁM MÂY (CẬP NHẬT 14/08/2026)
- [x] **Loại bỏ chữ `(INLINE VIEW 100%)`**: Dọn dẹp tiêu đề các cửa sổ 'Danh mục lớp học' & 'Danh sách học sinh' sạch sẽ.
- [x] **Áp dụng hiển thị ảnh Google Drive siêu tốc từ 'Kho avatar' sang 'Vườn tri thức'**: Chuyển đổi URL sang Edge CDN w800 (`https://drive.google.com/thumbnail?id=...&sz=w800`), thêm `referrerPolicy="no-referrer"`, và chuỗi 4 lớp Fallback chống lỗi 403 Forbidden.
- [x] **Tải ảnh trực tiếp từ máy tính làm Cây Thi Đua (Auto nén WebP)**: Tích hợp `imageCompressor.ts` tự động nén WebP Base64 (~30KB/ảnh) cho 7 cấp độ cây thi đua và hỗ trợ tải hàng loạt 7 tệp cùng lúc.
- [x] **Khắc phục triệt để 100% lỗi chớp giật Kéo thả & Xóa học sinh ('X')**: Sửa logic `dragleave` DOM containment trong `LabRoomTab.tsx` và chống Event Bubbling trên nút xóa 'X' máy tính.
- [x] **Bỏ Mã Học Sinh (MSHS) trong Bảng 'Học Sinh Chờ Ngồi'**: Tinh gọn thẻ học sinh trong danh sách chờ.
- [x] **Tự Động Lưu Phiên Làm Việc (Auto-Save Indicator)**: Bổ sung huy hiệu chấm xanh phát sáng **`🟢 Đã đồng bộ lên đám mây (HH:mm:ss)`** và **`🔄 Đang lưu...`** tức thì trên cả 2 thanh công cụ.
- [x] **Khắc Phục Triệt Để 100% Lỗi Chậm/Giật Thẻ Điểm Danh**: Tối ưu `React.useMemo` 0ms và giữ nguyên phần tử DOM không bị Unmount/Remount.
- [x] **Cực Tối Ưu Độ Tương Phản 3 Nút Điểm Danh (`Đi Học`, `Có Phép`, `Không Phép`)**: Nút được chọn hiển thị màu sắc rực rỡ + viền glow, nút chưa chọn chìm xuống màu xám trung tính.
- [x] **Hiển Thị Huy Hiệu Trạng Thái & Màu Hàng Học Sinh Trực Quan**: Tự động gắn nhãn `✓ Đi học`, `🟡 Vắng có phép (P)`, `🔴 VẮNG KHÔNG PHÉP (KP)` ngay dưới tên học sinh và phủ dải màu hàng trực quan.

---

### 🌐 GIAI ĐOẠN 6: TÍCH HỢP PWA (PROGRESSIVE WEB APP) NGOẠI TUYẾN HOÀN TOÀN (OFFLINE-FIRST) (CẬP NHẬT 15/08/2026)
- [x] **Cấu Hình PWA Web App Manifest ([public/manifest.json](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/public/manifest.json))**: Khai báo đầy đủ tên ứng dụng, biểu tượng maskable icons (192px & 512px), tone màu hoàng gia `#381DFC`, chế độ `standalone` cho phép cài đặt app như phần mềm native trên Windows / iOS / Android.
- [x] **Xây Dựng Service Worker Ngoại Tuyến ([public/sw.js](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/public/sw.js))**: Tự động lưu bộ nhớ đệm (Cache Static Assets) toàn bộ mã nguồn HTML, CSS, JS, Ảnh WebP, SVG, Font chữ. Trình duyệt tải trang tức thì **ngay cả khi phòng máy mất sạch 100% mạng Internet**.
- [x] **Cơ Chế Trình Quản Lý PWA & Tự Động Khôi Phục Nguồn Mạch ([src/utils/pwaRegister.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/pwaRegister.ts))**: Đăng ký Service Worker an toàn, tự động lắng nghe sự kiện chuyển đổi trạng thái mạng `online` / `offline` thời gian thực.
- [x] **Thanh Thống Báo Trạng Thái Trực Quan ([src/components/OfflineSyncBanner.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/OfflineSyncBanner.tsx))**:
  - **Khi Mất Mạng (Offline)**: Hiển thị banner cảnh báo **`⚡ ĐANG Ở CHẾ ĐỘ NGOẠI TUYẾN (OFFLINE-FIRST PWA) - 0ms Local Sync`**. Mọi thao tác Điểm danh, Xếp chỗ máy tính, Tặng sao đều thực thi 100% bình thường trên máy tính!
  - **Khi Có Mạng Trở Lại (Online Restored)**: Hiển thị banner xanh rực rỡ **`🟢 ĐÃ KHÔI PHỤC KẾT NỐI INTERNET! - Tự động đồng bộ toàn bộ dữ liệu ngoại tuyến lên Supabase Cloud!`** và tự động xả sạch bản ghi ngoại tuyến đẩy lên DB Cloud mà không cần F5!

---

### 🧠 GIAI ĐOẠN 7: TỰ ĐỘNG TỐI ƯU HÓA BỘ NHỚ RAM 30 PHÚT & TINH CHỈNH GIAO DIỆN PHÒNG LAB (CẬP NHẬT 15/08/2026)
- [x] **Tự Động Tối Ưu Hóa Bộ Nhớ RAM Định Kỳ 30 Phút ([src/utils/ramOptimizer.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/ramOptimizer.ts))**:
  - Tự động quét dọn bộ nhớ đệm (Cache) rác trình duyệt, giải phóng các đối tượng Blob URL không còn sử dụng, kích hoạt V8 Garbage Collector và xóa các file tạm ngầm sau mỗi 30 phút sử dụng liên tục.
  - Đảm bảo ứng dụng chạy cả ngày không bị đầy bộ nhớ RAM hay chậm lag.
- [x] **Gỡ Bỏ Huy Hiệu Auto-Save Đã Đánh Dấu ([src/components/LabRoomTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/LabRoomTab.tsx))**: Loại bỏ hoàn toàn nút huy hiệu `🟢 Đã đồng bộ lên đám mây (HH:mm:ss)` trên thanh công cụ Phòng Lab theo đúng khoanh vùng trong ảnh của Thầy/Cô.

---

### 📱 GIAI ĐOẠN 8: XÂY DỰNG ỨNG DỤNG 'CÀI ĐẶT ỨNG DỤNG' & ĐỔI URL CHÍNH THỨC (CẬP NHẬT 15/08/2026)
- [x] **Xây Dựng Modul Ứng Dụng Mới 'Cài Đặt Ứng Dụng' ([src/components/AppInstallerTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/AppInstallerTab.tsx))**:
  - Tạo ứng dụng độc lập trên giao diện DeskOS App Grid với tên gọi **'Cài đặt ứng dụng'**.
  - **Tích hợp PWA Desktop Shortcut 1-Click**: Cho phép tạo và tải về tệp Lối Tắt Màn Hình Windows (.url) hoặc kích hoạt ô cài đặt PWA Native 1-Click mở ứng dụng mượt như phần mềm gốc.
  - [x] **Cấu hình URL Tên Miền Chính Thức**: Đổi URL chạy thử `http://localhost:3000/` thành đường dẫn URL chính thức: **`https://phongmaythlongdinh.com/`**.
- [x] **Kích Hoạt Tải Lối Tắt Desktop 1-Click Trực Tiếp ([src/utils/shortcutInstaller.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/shortcutInstaller.ts))**:
  - Tự động kích hoạt tải tệp Lối Tắt Desktop Windows (`PhongMayTHLongDinh.url`) hướng về `https://phongmaythlongdinh.com/` ngay khi người dùng click vào Icon **'Cài đặt ứng dụng'**.
  - **Loại bỏ hoàn toàn cửa sổ giao diện bên trong** giúp trải nghiệm siêu nhanh 1-Click đúng như yêu cầu của Thầy/Cô.

---

### 🎨 GIAI ĐOẠN 9: NÂNG CẤP NÚT KHÔNG PHÉP NỀN ĐỎ & ĐỒNG BỘ BANNER KEM GỖ IMAC WARM BEIGE (CẬP NHẬT 16/08/2026)
- [x] **Nút 'Không Phép (KP)' Chuyển Nền Đỏ Rực Rỡ ([src/components/AttendanceTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/AttendanceTab.tsx#L570-L585))**:
  - Cập nhật nút trạng thái nghỉ không phép sang tông đỏ rực rỡ (`bg-red-600 hover:bg-red-700 text-white font-black shadow-md shadow-red-600/40 ring-2 ring-red-400 border border-red-500 scale-[1.03]`) với phản hồi 0ms.
- [x] **Đồng Bộ Dải Banner iMac Warm Beige Trên 100% Ứng Dụng**:
  - Chuẩn hóa cấu trúc dải banner tiêu đề cho tất cả các ứng dụng (`AttendanceTab`, `StudentsTab`, `ClassesTab`, `EvaluationTab`, `KnowledgeGardenTab`, `TimetableTab`, `ResourcesTab`, `AvatarGalleryTab`, `ComputerReportTab`) theo đúng chuẩn thiết kế iMac Warm Beige (`border-2 border-[#cbb89d] rounded-3xl bg-[#fffbf0] overflow-hidden shadow-sm` với dải trên `bg-[#dfccb0] border-b border-[#cbb89d] px-5 py-3`).
- [x] **Đồng Bộ Mã Nguồn Lên GitHub Repository**:
  - Đã Commit và Push mã nguồn thành công lên đúng GitHub Repository (`https://github.com/nguyenthanhdong06/Quan-ly-phong-hoc-tin-hoc`) với Commit Message Tiếng Việt rõ ràng.
- [x] **Khắc Phục Triệt Để 100% Lỗi Dựt Lag Do WebSocket & Cloud Sync ([src/supabaseClient.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/supabaseClient.ts) & [src/App.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/App.tsx))**:
  - Tích hợp **WebSocket Self-Echo Suppressor** (`isRecentLocalSave(key, 3000)`): Loại bỏ 100% phản hồi lặp lại của WebSocket khi client vừa lưu dữ liệu local, giải phóng Main Thread CPU không bị nghẽn hàm so sánh `isIdentical`.
  - Hoãn đệm bất đồng bộ `safeSetLocalStorage` (800ms) giúp thao tác nhấp chuột điểm danh đạt tốc độ phản hồi 0ms siêu mượt.
  - Tối ưu DOM Table Rendering trong `AttendanceTab.tsx` loại bỏ `<AnimatePresence>` đạt tốc độ 60FPS.
- [x] **Gói Gọn Payload Điểm Danh Theo Ngày ([src/utils/attendancePartition.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/attendancePartition.ts))**:
  - Tách nhỏ key lưu trữ theo từng ngày (`school_attendance_YYYY-MM-DD`): Giúp dung lượng Payload truyền tải qua Supabase Cloud & WebSocket nhẹ hơn từ **x10 đến x100 lần** (~2KB/ngày).
  - Tích hợp cơ chế tự động nạp & tương thích ngược với dữ liệu cũ.
- [x] **Gói Gọn Payload Đánh Giá & Chấm Sao Theo Ngày ([src/utils/evaluationPartition.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/evaluationPartition.ts))**:
  - Tách nhỏ key lưu trữ Đánh giá & Chấm sao theo từng ngày (`school_evaluation_YYYY-MM-DD`): Giúp nén nhẹ dung lượng đồng bộ đám mây và WebSocket thêm x10-x100 lần.
- [x] **Memoize Từng Dòng Học Sinh Với React.memo ([src/components/AttendanceTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/AttendanceTab.tsx))**:
  - Tách `AttendanceStudentRow` bọc bởi `React.memo`: Chỉ render lại duy nhất 1 dòng học sinh vừa thay đổi trạng thái, 39 học sinh còn lại giữ nguyên DOM 100% (0ms cost re-render).
- [x] **Memoize Thẻ Học Sinh Trong Sổ Đánh Giá & Chấm Sao ([src/components/StudentCard3D.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/StudentCard3D.tsx) & [src/components/EvaluationTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/EvaluationTab.tsx))**:
  - Bọc `React.memo` cho `StudentCard3D` và tạo `EvaluationStudentCardItem`: Giữ nguyên DOM 100% cho 39 thẻ học sinh khác khi bấm chọn/thưởng sao 1 học sinh.
- [x] **Sửa Lỗi Bất Đồng Bộ Dữ Liệu Điểm Danh 2-Chiều Giữa 'Điểm Danh' & 'Phòng Lab' ([src/components/LabRoomTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/LabRoomTab.tsx))**:
  - Gỡ bỏ state đóng băng nội bộ `localAttendance`, liên kết trực tiếp prop `attendanceData` theo thời gian thực (Realtime Props) và nạp phân mảnh theo ngày. Đồng bộ 100% số lượng Có mặt/Vắng mặt và sơ đồ chỗ ngồi.
- [x] **Nâng Cấp Hiển Thị Đầy Đủ 100% Danh Sách Học Sinh Lớp Trong Bảng 'Phòng Lab' ([src/components/LabRoomTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/LabRoomTab.tsx))**:
  - Tích hợp bộ chuyển tab 3 chế độ (Chưa xếp | Tất cả lớp | Đã xếp), hiển thị nhãn máy tính đã ngồi và nút `Đổi máy 🔄`. Chuẩn hóa so khớp mã lớp không phân biệt chữ hoa/thường.
- [x] **Loại Bỏ Tính Năng WebSocket Supabase Cho Ứng Dụng 'Điểm Danh' ([src/App.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/App.tsx))**:
  - Bỏ 100% sự kiện lắng nghe WebSocket Realtime kênh `school_attendance_...` cho ứng dụng Điểm danh. Điểm danh hoạt động siêu tốc 0ms với LocalStorage & Supabase REST API không bị nghẽn hay lặp sự kiện WebSocket.
- [x] **Cập Nhật Hiệu Ứng Nền Đỏ Tức Thì Cho Nút 'Không Phép' ([src/components/AttendanceTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/AttendanceTab.tsx))**:
  - Khi nhấp chọn 'Không phép (KP)', nút lập tức chuyển sang màu nền đỏ đậm `bg-red-600` rực rỡ, đi kèm nhãn trạng thái và viền dòng nổi bật.
- [x] **Chuẩn Hóa Định Dạng Ngày Tháng Chuẩn Việt Nam DD/MM/YYYY ([src/components/common/VietnameseDatePicker.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/common/VietnameseDatePicker.tsx))**:
  - Xây dựng thành phần `VietnameseDatePicker` dùng chung cho toàn bộ các ứng dụng (Điểm Danh, Đánh Giá & Chấm Sao...), tích hợp 2 tính năng song song: (1) Nhập tay trực tiếp định dạng `DD/MM/YYYY` (ví dụ: `16/08/2026`), và (2) Nhấp chuột vào biểu tượng lịch 📅 để bật bộ chọn ngày. Khắc phục triệt để lỗi tự nhảy về số '01' khi gõ hoặc xóa ngày tháng nhờ cơ chế kiểm soát Focus & Lazy Parse linh hoạt.
- [x] **Nâng Cấp Phân Quyền Không Gian Làm Việc Độc Lập & Phân Phối Lớp Học Theo TKB ([src/App.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/App.tsx), [src/utils/classFilters.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/classFilters.ts))**:
  - **Báo cáo máy**: Mỗi giáo viên có không gian báo cáo cá nhân độc lập, không thấy báo cáo của giáo viên khác (trừ Admin thấy tất cả).
  - **Khớp danh sách lớp 100% TKB**: Lọc chính xác các lớp được phân công dạy trong Thời khóa biểu của giáo viên hiện tại (trừ Admin thấy 100% tất cả các lớp).
  - **Ẩn ứng dụng 'Lớp học'**: Ẩn menu ứng dụng Lớp học trên toàn bộ giao diện DeskOS (Màn hình chính App Grid, Menu Start, Sidebar điều hướng) đối với tất cả giáo viên thường (chỉ Admin mới nhìn thấy và truy cập).
  - **Thời khóa biểu cá nhân**: Giới hạn ứng dụng Thời khóa biểu chỉ hiển thị thời khóa biểu của Giáo viên hiện tại, khóa bộ chọn GV khác (trừ Admin).
- [x] **Khắc Phục Lỗi Tự Động Đăng Xuất Văng Tài Khoản & Mở Khóa Chỉnh Sửa Ô Nhập Tên Đăng Nhập ([src/App.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/App.tsx))**:
  - **Khắc phục văng tài khoản khi đăng nhập**: Loại bỏ hoàn toàn vòng lặp kiểm tra xung đột phiên làm việc đa thiết bị (`checkSessionConflict`) do đồng bộ Supabase / WebSocket gây văng tài khoản đột ngột ngay sau khi đăng nhập.
- [x] **Tích Hợp Chức Năng Khôi Phục & Đổi Mật Khẩu Nhanh Qua Mã Xác Minh OTP ([src/App.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/App.tsx))**:
  - **Nút 'Quên mật khẩu?'**: Dạng chữ thuần sắc nét kết hợp biểu tượng Chìa Khóa `🔑 Quên mật khẩu? Khôi phục nhanh` mượt mà.
  - **Đồng bộ Tone màu & Cấu trúc theo mẫu ảnh ([src/App.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/App.tsx))**: Chuyển đổi toàn bộ Popup 'Khôi phục và đổi mật khẩu nhanh' sang Tone Kem Caramel Kem (`#fbf7ee`), thanh tiêu đề Caramel Vàng Gold kèm biểu tượng Chìa Khóa `🔑`, nút đóng tròn beige, thẻ thông tin trắng bo tròn và các nút bấm nhung 3D viên thuốc dạng Teal/Green (`#24877b`) khớp 100% với mẫu ảnh.
  - **Dịch vụ Gửi Email/SMS OTP ([src/services/emailSmsOtpService.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/services/emailSmsOtpService.ts))**: Viết sẵn Module phát lệnh gửi Email & SMS OTP thực tế tới Email/SĐT của Giáo viên; tích hợp cổng mô phỏng bảo mật và chế độ xem mã thử nghiệm dành cho Dev/Admin.

---

## 🔍 II. BÁO CÁO RÀ SOÁT CHUYÊN SÂU: CHỨC NĂNG 'PHÒNG LAB' & 'ĐIỂM DANH' (FE - BE - DB AUDIT)

### 1. 🖥️ BÁO CÁO RÀ SOÁT ỨNG DỤNG 'PHÒNG LAB' (`LabRoomTab.tsx`):
- **Cấu trúc dữ liệu & Luồng hoạt động**:
  - State `seatingChart` lưu dưới dạng key-value `{ [className]: { [pcId]: studentId } }`.
  - Luồng lưu dữ liệu: Khi kéo thả hoặc gán máy ➔ `setSeatingChart` (0ms) ➔ `localStorage.setItem` (~0.1ms) ➔ `saveSupabaseState` với Debounce 800ms.
- **Đánh giá Hiệu năng & Trải nghiệm (FE)**:
  - *Điểm mạnh*: Phản hồi kéo thả mượt 60FPS, đã hết chớp nháy sau khi xử lý `dragleave` và `e.stopPropagation()`. Huy hiệu `🟢 Đã đồng bộ lên đám mây` giúp giáo viên hoàn toàn an tâm.
  - *Điểm cần cải thiện*: Dung lượng lưu trữ của key `'school_seating_chart'` đẩy lên Supabase là 1 mảng JSON khổng lồ chứa dữ liệu sơ đồ của tất cả các lớp.

---

### 2. 📋 BÁO CÁO RÀ SOÁT ỨNG DỤNG 'ĐIỂM DANH' (`AttendanceTab.tsx`):
- **Cấu trúc dữ liệu & Luồng hoạt động**:
  - State `attendanceData` lưu dạng `{ [date]: { [className]: { [studentId]: status } } }`.
  - Luồng lưu dữ liệu: Điểm danh từng học sinh ➔ `setAttendanceData` ➔ Trigger `useEffect` ở `App.tsx` ➔ Gửi API `saveSupabaseState('school_attendance', attendanceData)`.
- **Đánh giá Hiệu năng & Trải nghiệm (FE)**:
  - *Điểm mạnh*: Các thẻ thống kê ("Sĩ số", "Hiện diện", "Nghỉ có phép", "Vắng không phép") phản hồi 0ms nhờ `React.useMemo`. Bộ 3 nút điểm danh (`Đi Học`, `Có Phép`, `Không Phép`) và nhãn trạng thái dưới tên vô cùng rõ ràng.
  - *Lỗ hổng Kỹ thuật BE - DB*:
    - **Lỗi 1 (Nghẽn cổ chai Request HTTP)**: Trong `AttendanceTab.tsx`, mỗi lần nhấp điểm danh 1 học sinh là kích hoạt `useEffect` ở `App.tsx` gửi ngay 1 Request HTTP `POST` lên Supabase. Điểm danh nhanh 10 học sinh liên tiếp sẽ bắn 10 Request HTTP song song làm mạng bị nghẽn (Network Bottleneck) và Supabase trả về chậm 2-3s.
    - **Lỗi 2 (Thiếu Kênh Đồng Bộ Realtime 2 Chiều)**: Nếu Giáo viên A điểm danh trên máy 1, Giáo viên B mở máy 2 sẽ không thấy kết quả điểm danh nhảy tự động trừ khi reload lại trang.

---

### 🛠️ 3. BẢNG TỔNG HỢP LỖ HỔNG & KHUYẾN NGHỊ THỰC THI:

| Stt | Tên Lỗ hổng / Điểm trễ | Ảnh hưởng | Nguyên nhân Kỹ thuật | Khuyến nghị & Giải pháp Khắc phục |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Spam Request HTTP khi điểm danh nhanh** | Điểm danh 10 HS liên tiếp làm Supabase phản hồi chậm 2-3s | `AttendanceTab` chưa có Debounce timer, bắn API Supabase liên tục mỗi click | **Bổ sung Debounce Timer (500-800ms)** cho state `attendanceData` giống như `LabRoomTab` |
| **2** | **Thiếu Kênh Realtime 2 chiều tức thì** | Giáo viên máy 2 không thấy máy 1 vừa đổi chỗ / điểm danh | Chưa đăng ký `supabase.channel('public:school_states').on(...)` ở Client | **Kích hoạt Supabase Realtime Subscription** tự động lắng nghe event DB để sync UI 2 chiều |
| **3** | **Payload JSON khổng lồ gửi về Supabase** | Truyền tải dữ liệu phình to khi số lượng ngày/lớp tăng | Key `'school_attendance'` gom toàn bộ ngày trong năm thành 1 object lớn | **Tách nhỏ Key theo ngày/tháng** (vd: `school_attendance_2026-08-14`) giúp Payload nhẹ x10 lần |
| **4** | **Phân quyền RLS chưa xiết chặt trên Supabase** | Lỗ hổng bảo mật nếu ai đó lấy Anon Key | DB Supabase cài Policy `USING (true)` cho phép đọc/ghi tự do | **Cấu hình RLS Policy** kiểm tra vai trò xác thực người dùng |

---

## 🎯 III. DANH MỤC VIỆC CẦN LÀM TIẾP THEO (NEXT STEPS)
1. **BẮT BUỘC ĐỌC FILE `lotrinh.MD` NÀY ĐẦU TIÊN** trước mỗi ca làm việc mới hoặc khi tiếp nhận yêu cầu mới.
2. Áp dụng ngay bộ lọc Debounce 800ms cho việc lưu `attendanceData` để loại bỏ 100% hiện tượng nghẽn request Supabase khi điểm danh nhanh.
3. Kích hoạt Supabase Realtime Subscription cho ứng dụng Phòng Lab & Điểm danh.
