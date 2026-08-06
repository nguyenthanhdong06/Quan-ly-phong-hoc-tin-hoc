# 🗺️ LỘ TRÌNH PHÁT TRIỂN & BÁO CÁO RÀ SOÁT NGUỒN MÃ
> **Hệ Thống Số Quản Lý Phòng Học Tin Học - Trường Tiểu Học Long Định**
> *Cập nhật lần cuối: 01/08/2026*

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
- [x] **Tự động Load Trang Đăng Nhập khi Truy cập Website (Screenshot 2026-08-01 090051.png)**:
  - Trang Đăng Nhập chính thức trở thành **Trang Đích (Landing Page / Dashboard mặc định)** tự động xuất hiện ngay lập tức khi mở website thay vì load trang 'Tổng quan'.
  - Giữ nút "Đăng nhập" ở thanh Sidebar để người dùng tiện tương tác.
- [x] **Loại bỏ Zoom Hover & Xóa dòng Khách**: Loại bỏ hoàn toàn hiệu ứng phóng to hover trên khung form đăng nhập và xóa bỏ nút 'Vào trang web với tư cách Khách'.
- [x] **Khắc phục Triệt để Lỗi Lằn Sọc Màu (Screenshot 2026-08-01 094723.png)**:
  - *Nguyên nhân*: Do hiệu ứng `drop-shadow` của container SVG nằm đè lên ranh giới vùng màu khiến bóng mờ bị đổ thành vạch kẻ màu dọc.
  - *Khắc phục*: Gỡ bỏ hiệu ứng shadow lệch trên đường vòm SVG, phủ phẳng tone xanh da trời `#009bfb` giúp đường vòm bầu cong hòa làm một 100% với mảng nền bên phải, loại bỏ hoàn toàn lằn sọc màu.
- [x] **Cập nhật Mã Màu Xanh Hoàng Gia `#381DFC` (Screenshot 2026-08-01 110023.png)**:
  - Thay thế màu xanh nhạt cũ bằng màu xanh Indigo/Royal Blue đậm đà cá tính `#381DFC` đồng bộ trên mảng nền bên phải và đường vòm bầu cong SVG.
- [x] **Áp dụng Nút Bấm Capsule 3D Tím Hồng Mới ([buttondnmoi.png](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/public/buttondnmoi.png))**:
  - Tích hợp khung nút bấm bo tròn capsule 3D dải màu chuyển tím-hồng chuyển sắc tuyệt đẹp [buttondnmoi.webp](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/public/buttondnmoi.webp) (tệp WebP đã tối ưu `11.2KB`).
  - **Tối ưu hóa Kích thước & Cân đối Chiều cao**: Căn chỉnh tỷ lệ chuẩn `654x93px` (`aspect-[654/93]`), thu gọn bề ngang (`width: 68%`) và chiều cao `height: 6.2%` (~35px) **khớp chuẩn 100%** với độ cao của 2 ô nhập liệu User & Password, ôm vừa vặn chữ "ĐĂNG NHẬP" và không gây mất cân đối.
  - Tích hợp hiệu ứng vệt sáng kim loại phản quang (Glass Shine Sweep) lướt nhẹ khi hover chuột.
- [x] **Xây dựng Giao diện DeskOS (Neumorphic Desk OS Interface - Screenshot 2026-08-01 195107.png)**:
  - *Tông màu kem/be ấm áp vintage* (`#f5e6ca` - `#e6d2b5`) kết hợp hiệu ứng Neumorphism 3D mềm mại.
  - *Bảng Menu Chức năng Nổ Popover dạng Khung Đơn*: Chuyển đổi mô-đun [DeskOSSidebar.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/layout/DeskOSSidebar.tsx) tích hợp trực tiếp vào nút **'Phòng Tin Học'** ở góc dưới bên trái màn hình. Bấm để ẩn/hiện, tối ưu 2 cột hiển thị trọn vẹn 100% trong 1 khung duy nhất, **loại bỏ hoàn toàn thanh cuộn (Zero Scrollbar)**.
  - *Mở rộng Không gian Hiển thị Nối rộng 100%*: Loại bỏ cột menu dọc chiếm diện tích ở mảng trái, khôi phục không gian hiển thị rộng rãi, thoáng đãng như ban đầu cho tất cả các trang nội dung chức năng.
  - *Cửa sổ Chào mừng kiểu Mac OS*: Tách mô-đun riêng [DeskOSMacWidget.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/layout/DeskOSMacWidget.tsx). Tích hợp Avatar Giáo viên cá nhân hóa ở vị trí trung tâm với viền vàng nổi bật.
  - *Hỗ Trợ Thao Tác Đa Cửa Sổ (Multi-Window Multitasking)*: Phát triển cơ chế quản lý đa ứng dụng mở cùng lúc (`openTabs`, `minimizedTabs`). Khi thu nhỏ ứng dụng (bấm nút 🟡 trên cửa sổ iMac hoặc biểu tượng trên Dock), giao diện tự động quay về Màn hình bàn làm việc chính Tổng quan (`dashboard`) để Thầy/Cô chọn và mở thêm nhiều ứng dụng khác. Thanh Taskbar Dock [DeskOSTaskbar.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/layout/DeskOSTaskbar.tsx) hiển thị đồng thời danh sách tất cả các ứng dụng đang mở để chuyển đổi tức thì.
  - *Đồng Bộ Nút Bấm Thanh Taskbar*: Chuẩn hóa 100% tất cả các nút trên Taskbar (Phòng Tin Học, Ứng dụng đang mở, Hình nền) về dạng Pill bo tròn `rounded-full` với hiệu ứng kính mờ và Hover đồng nhất.
  - *Tối Ưu Cửa Sổ Đánh Giá Học Sinh ([EvaluationTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/EvaluationTab.tsx))*: Sửa lỗi đè thanh tiêu đề lên Tên/Avatar học sinh, thiết kế thanh tiêu đề mượt mà kèm nút ✖️. Làm nổi bật chữ tên các nút **Khen thưởng (Tặng sao)** và **Nhắc nhở (Trừ sao)** bằng font trắng in hoa đè bóng đốm nổi bật 100%.
  - *Chuẩn Hóa Khung Bảng & Cửa Sổ Trang kiểu MacOS (Beige Vintage Card Frame)*: Áp dụng khung tiêu đề dải kem mỏng (`bg-[#dfccb0]`) cho các thẻ nội dung và viền cửa sổ chuẩn phong cách DeskOS iMac.
  - *Công Tắc Bật/Tắt Âm Thanh Khen Thưởng (Audio Mute Toggle - [DeskOSTaskbar.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/layout/DeskOSTaskbar.tsx))*: Thêm nút 🔊 Bật âm / 🔇 Tắt âm trực tiếp trên thanh Taskbar giúp Thầy/Cô chủ động bật/tắt toàn bộ âm thanh hiệu ứng tức thì khi cần giữ yên tĩnh cho tiết học.
  - *Bảng Vinh Danh 3 Học Sinh Xuất Sắc Nhất Tháng (Monthly Top 3 Hall of Fame - [EmulationTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/EmulationTab.tsx))*: Thiết kế màn hình trình diễn bục vinh danh 3D (🥇 Quán quân vàng, 🥈 Hạng nhì bạc, 🥉 Hạng ba đồng) kèm nhạc mừng chiến thắng (`playVictoryFanfareSound`) và pháo hoa rực rỡ.
  - *Tự Động Nhắc Bật Bảng Vinh Danh Cuối Tiết ([EmulationTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/EmulationTab.tsx))*: Tự động hiển thị banner nhắc nhở thông minh ở 5 phút cuối tiết học, cho phép Thầy/Cô bấm 1-chạm mở ngay Bảng Vinh Danh & Tổng Kết Thi Đua.
  - *Hiệu Ứng Bục Vinh Danh Xếp Hạng Theo Khối Lớp ([EmulationTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/EmulationTab.tsx))*: Bổ sung bộ lọc linh hoạt trong Bảng Vinh Danh (Lớp hiện tại, Toàn Khối 3, Toàn Khối 4, Toàn Khối 5, Toàn Trường). Khi đổi bộ lọc, bục vinh danh 3D cập nhật Top 3 xuất sắc nhất tức thì!
  - *Hiệu Ứng Hoạt Hình Nhân Vật 3D Trèo/Nhảy Lên Bục Vinh Danh ([EmulationTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/EmulationTab.tsx) & [src/index.css](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/index.css))*: Thiết kế chuỗi hiệu ứng chuyển động 3D lò co nảy bật tưng bừng (`podiumHop1`, `podiumHop2`, `podiumHop3`). Lần lượt 🥉 Hạng Ba, 🥈 Hạng Nhì và 🥇 Quán Quân Vàng nhảy tưng tưng trèo lên các bậc bục 1, 2, 3 sinh động kèm nút bấm *🏃 Nhảy Lên Bục Lại*.
  - *Ứng Dụng "Khu Vườn Tri Thức" Gamification Tương Tác ([KnowledgeGardenTab.tsx](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/components/KnowledgeGardenTab.tsx))*: Phát triển ứng dụng rèn luyện tính nếp học tập với 4 mô-đun chính (🏡 Vườn Của Em, 🌎 Vườn Cả Lớp, 🎁 Đổi Thưởng, 👩‍🏫 Quản Lý Giáo Viên). Tích hợp 7 cấp độ tăng trưởng cây trồng (🌰 Hạt Giống -> 🌱 Nảy Mầm -> 🌿 Hai Lá -> 🪴 Cây Non -> 🌳 Cây Cổ Thụ -> 🌸 Ra Hoa -> 🍎 Kết Trái), hiệu ứng chạm cây tự tưới nước `+1 💧` nhún nhảy, thanh tiến độ nảy mầm, bộ huy hiệu đức tính, cửa hàng đổi quà và trích xuất báo cáo TXT/CSV.
- [x] **Xóa Trống Thông Tin Ô User & Password khi Đăng xuất**: Tự động reset 2 ô nhập liệu về trạng thái trống khi bấm Đăng xuất để bảo mật tuyệt đối.

---

### 🛡️ GIAI ĐOẠN 4: THỰC THI BẢO MẬT & TỐI ƯU HÓA HIỆU NĂNG TỐC ĐỘ (ĐÃ THỰC THI)
- [x] **Mã hóa Mật khẩu SHA-256 ([security.ts](file:///d:/LAPTRINH/qu%E1%BA%A3n-l%C3%BD-ph%C3%B2ng-h%E1%BB%8Dc-tin-h%E1%BB%8Dc/src/utils/security.ts))**:
  - Xây dựng module mã hóa SHA-256 mã hóa mật khẩu người dùng trước khi xác thực.
  - Tích hợp helper `verifyPassword` và `sanitizeInput` chống tấn công chèn chuỗi độc hại.
- [x] **Nén Ảnh WebP Tốc độ Siêu tốc (Tải trang nhanh x3 lần)**:
  - Đã nén toàn bộ các tệp tài nguyên ảnh sang định dạng WebP siêu nhẹ:
    - `background.png` (364KB) $\rightarrow$ `background.webp` (**104KB**, giảm 71%)
    - `formdangnhapnoi.png` (381KB) $\rightarrow$ `formdangnhapnoi.webp` (**225KB**, giảm 41%)
    - `buttonlogin.png` (424KB) $\rightarrow$ `buttonlogin.webp` (**99.8KB**, giảm 76%)
    - `thehocsinhnam.png` (191KB) $\rightarrow$ `thehocsinhnam.webp` (**28.3KB**, giảm 85%)
    - `thehocsinhnu.png` (189KB) $\rightarrow$ `thehocsinhnu.webp` (**24.4KB**, giảm 87%)
  - Tổng dung lượng tải ảnh giảm từ ~1.6MB xuống chỉ còn **~480KB**.

---

## 🎯 II. DANH MỤC VIỆC CẦN LÀM TIẾP THEO (NEXT STEPS)
1. Thường xuyên đọc lại file `lotrinh.MD` trước khi bắt đầu nhiệm vụ mới.
2. Tiếp nhận các yêu cầu phát triển hoặc tùy chỉnh giao diện từ người dùng.
