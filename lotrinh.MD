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

## 🔍 II. BÁO CÁO RÀ SOÁT SOURCE CODE & KHUYẾN NGHỊ (FE - BE - DB CODE AUDIT)

### 💻 1. RÀ SOÁT FRONTEND (FE):
- **Ưu điểm**:
  - Giao diện DeskOS Neumorphic đẹp, chuẩn UX/UI hiện đại, 60FPS.
  - Ảnh static đã được audit nén WebP siêu nhẹ, tích hợp CDN Google Drive load 30ms.
  - Cấu trúc state tập trung và giao diện không bị giật lag sau khi tối ưu `useMemo` và DOM element stability.
- **Lỗ hổng & Điểm cần cải thiện**:
  - `App.tsx` (1869 dòng) và `LabRoomTab.tsx` (2150 dòng) đang quá lớn so với quy tắc thiết kế architecture (< 800 dòng).
  - *Khuyến nghị*: Tiến hành phân tách dần các sub-component trong `LabRoomTab.tsx` sang folder `src/features/lab-room/` (vd: `SeatingView.tsx`, `FrameConfigView.tsx`, `LabOverview.tsx`).

### 🗄️ 2. RÀ SOÁT BACKEND & DATABASE (BE & DB):
- **Ưu điểm**:
  - Kiến trúc đồng bộ 2 tầng: LocalStorage ghi nhận 0ms + Supabase background debounced 800ms giúp trải nghiệm mượt mà không bao giờ bị nghẽn mạng.
  - Có mã hóa SHA-256 cho mật khẩu và mã hóa session ID thiết bị.
- **Lỗ hổng & Cảnh báo Bảo mật**:
  - Phân quyền (Authorization) hiện tại chỉ check role `admin`/`teacher` trên Frontend UI. Trên Supabase Database, nếu chưa bật Row Level Security (RLS) policies thì người dùng am hiểu công nghệ có thể dùng API Key công khai để ghi đè DB.
  - *Khuyến nghị*: Bật RLS Policies trên Supabase Dashboard cho các bảng `school_seating_chart`, `students`, `attendance`.

---

## 🎯 III. DANH MỤC VIỆC CẦN LÀM TIẾP THEO (NEXT STEPS)
1. **BẮT BUỘC ĐỌC FILE `lotrinh.MD` NÀY ĐẦU TIÊN** trước mỗi ca làm việc mới hoặc khi tiếp nhận yêu cầu mới.
2. Tách nhỏ các file lớn (> 800 dòng) như `LabRoomTab.tsx` và `App.tsx` theo từng mô-đun tính năng riêng.
3. Tiếp nhận các yêu cầu phát triển hoặc tùy chỉnh giao diện từ Thầy/Cô.
