const packager = require('@electron/packager');
const path = require('path');
const fs = require('fs');

async function buildDesktop() {
  console.log('\n🚀 BẮT ĐẦU ĐÓNG GÓI ỨNG DỤNG WINDOWS EXECUTABLE (.EXE)...');
  console.log('---------------------------------------------------------');

  const outDir = path.resolve(__dirname, '../dist-electron');
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  const appPaths = await packager.packager({
    dir: path.resolve(__dirname, '..'),
    name: 'QuanLyPhongHocTinHoc',
    platform: 'win32',
    arch: 'x64',
    out: outDir,
    overwrite: true,
    asar: true,
    prune: false,
    appVersion: '1.0.0',
    appCopyright: 'Trường Tiểu Học Long Định',
    win32metadata: {
      CompanyName: 'Trường Tiểu Học Long Định',
      FileDescription: 'Hệ thống Quản lý phòng học Tin học',
      ProductName: 'Quản Lý Phòng Tin Học',
      InternalName: 'QuanLyPhongHocTinHoc',
      OriginalFilename: 'QuanLyPhongHocTinHoc.exe'
    },
    ignore: [
      /^\/src($|\/)/,
      /^\/scripts($|\/)/,
      /^\/\.git($|\/)/,
      /^\/\.agent($|\/)/,
      /^\/\.gemini($|\/)/,
      /^\/dist-electron($|\/)/,
      /^\/release($|\/)/,
      /^\/node_modules($|\/)/
    ]
  });

  console.log('✅ ĐÓNG GÓI THÀNH CÔNG!');
  console.log(`📁 Thư mục ứng dụng Windows (.exe): ${appPaths[0]}`);
  console.log(`🖥️ File chạy trực tiếp: ${path.join(appPaths[0], 'QuanLyPhongHocTinHoc.exe')}\n`);
}

buildDesktop().catch((err) => {
  console.error('❌ LỖI KHI ĐÓNG GÓI:', err);
  process.exit(1);
});
