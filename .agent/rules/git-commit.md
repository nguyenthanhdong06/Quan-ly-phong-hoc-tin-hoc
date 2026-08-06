---
trigger: always_on
---

# Nguyên Tắc Git Commit & Workflow Đồng Bộ GitHub

## Repository Liên Kết Mặc Định
- **GitHub Link**: `https://github.com/nguyenthanhdong06/Quan-ly-phong-hoc-tin-hoc`

## Quy Trình Bắt Buộc Sau Khi Sửa/Hoàn Thành Tính Năng
1. **Hỏi Ý Kiến Thầy/Cô**: Sau khi hoàn thành hoặc sửa xong một tính năng, BẮT BUỘC phải hỏi Thầy/Cô xem có muốn Commit mã nguồn lên Git hay không.
2. **Thực Thi Khi Đồng Ý**: Khi Thầy/Cô đồng ý (hoặc yêu cầu), tiến hành commit và push trực tiếp lên đúng GitHub Repository link ở trên.

## Quy Tắc Commit Message Bằng Tiếng Việt
Khi commit và push code lên GitHub, **luôn viết commit message bằng tiếng Việt**, mô tả rõ ràng và dễ hiểu những thay đổi của phiên bản.

### Quy tắc:
1. **Ngôn ngữ**: Tiếng Việt (Việt Nam), không dùng tiếng Anh.
2. **Rõ ràng**: Ghi chú cụ thể những gì đã thay đổi, thêm mới, sửa lỗi.
3. **Dễ hiểu**: Mô tả thân thiện, ngắn gọn và chính xác.

### Ví dụ:
```bash
✅ Đúng:
git commit -m "Sửa lỗi văng màn hình ErrorBoundary trên Vercel do thiếu giá trị mặc định cho theme"
git commit -m "Thêm bộ ảnh WebP nén siêu nhẹ cho 7 cấp độ Khu vườn tri thức"
git commit -m "Bỏ nút lọc khối ở màn hình Giáo viên quản lý Khu vườn tri thức"

❌ Sai:
git commit -m "feat: fix theme crash"
git commit -m "fix bug"
git commit -m "update code"
```
