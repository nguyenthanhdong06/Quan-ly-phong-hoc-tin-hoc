/**
 * Bộ Tối Ưu Nén Ảnh WebP Tự Động Siêu Nhẹ (WebP High-Speed Image Compressor)
 * ⚡ Chuyển đổi mọi định dạng ảnh từ Máy tính (PNG, JPG, JPEG, WEBP, GIF, BMP)
 *    thành chuỗi WebP Base64 DataURL cực nhẹ (Giảm dung lượng từ 5MB - 10MB xuống ~30KB - 80KB).
 */

export const compressImageToWebP = (
  file: File,
  maxWidth: number = 600,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Giữ tỷ lệ khung hình và tính toán kích thước chiều rộng tối đa
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể khởi tạo Canvas 2D'));
          return;
        }

        // Vẽ ảnh lên canvas với làm mịn chất lượng cao
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất ảnh nén định dạng WebP
        let webpDataUrl = canvas.toDataURL('image/webp', quality);

        // Trường hợp trình duyệt cũ không hỗ trợ WebP export, tự động fallback sang JPEG chất lượng cao
        if (!webpDataUrl.startsWith('data:image/webp')) {
          webpDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(webpDataUrl);
      };
      img.onerror = () => reject(new Error('Lỗi khi đọc dữ liệu ảnh!'));
    };
    reader.onerror = () => reject(new Error('Lỗi khi tải tệp từ máy tính!'));
  });
};
