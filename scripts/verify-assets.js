import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const publicDir = path.join(rootDir, 'public');
const publicImgDir = path.join(publicDir, 'img');

console.log('\n🔍 =========================================================');
console.log('🚀 AUDIT TÀI NGUYÊN ẢNH: Đang kiểm tra các file ảnh Static...');
console.log('=========================================================\n');

// Image Regex
const STRING_IMAGE_REGEX = /['"]([^'"]+\.(?:png|jpe?g|webp|gif|svg|ico))(?:\?[^'"]*)?['"]/gi;
const URL_CSS_REGEX = /url\(['"]?([^'"\)]+\.(?:png|jpe?g|webp|gif|svg|ico))(?:\?[^'"]*)?['"]\)/gi;

function getAllSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllSourceFiles(filePath, fileList);
    } else if (/\.(tsx?|jsx?|css)$/i.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const sourceFiles = getAllSourceFiles(srcDir);
let missingAssets = [];
let checkedAssets = new Set();
let foundAssetsCount = 0;

// Helper to check if file or its webp/png equivalent exists in public or public/img
function fileOrEquivalentExists(cleanAssetPath) {
  const relPath = cleanAssetPath.startsWith('/') ? cleanAssetPath.substring(1) : cleanAssetPath;
  const baseName = path.basename(cleanAssetPath);
  const nameWithoutExt = path.parse(baseName).name;

  // Possible exact paths
  const candidatePaths = [
    path.join(publicDir, relPath),
    path.join(publicImgDir, baseName),
    path.join(publicDir, baseName),
  ];

  // Also check webp / png / jpg equivalents
  const extensions = ['.webp', '.png', '.jpg', '.jpeg', '.svg'];
  for (const ext of extensions) {
    candidatePaths.push(path.join(publicDir, `${nameWithoutExt}${ext}`));
    candidatePaths.push(path.join(publicImgDir, `${nameWithoutExt}${ext}`));
  }

  for (const targetPath of candidatePaths) {
    if (fs.existsSync(targetPath)) {
      return true;
    }
  }

  return false;
}

for (const filePath of sourceFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((lineText, lineIdx) => {
    const findMatches = (regex) => {
      let m;
      regex.lastIndex = 0;
      while ((m = regex.exec(lineText)) !== null) {
        let assetPath = m[1];

        // Filter out remote URLs, data URIs, or JS string templates
        if (
          assetPath.startsWith('http://') ||
          assetPath.startsWith('https://') ||
          assetPath.startsWith('data:') ||
          assetPath.startsWith('blob:') ||
          assetPath.includes('${')
        ) {
          continue;
        }

        const cleanPath = assetPath.split('?')[0];
        const uniqueKey = `${filePath}:${lineIdx}:${cleanPath}`;

        if (checkedAssets.has(uniqueKey)) continue;
        checkedAssets.add(uniqueKey);

        const ok = fileOrEquivalentExists(cleanPath);

        if (ok) {
          foundAssetsCount++;
        } else {
          const relFile = path.relative(rootDir, filePath).replace(/\\/g, '/');
          missingAssets.push({
            file: relFile,
            line: lineIdx + 1,
            asset: assetPath
          });
        }
      }
    };

    findMatches(STRING_IMAGE_REGEX);
    findMatches(URL_CSS_REGEX);
  });
}

console.log(`📊 Kết quả rà soát: Đã quét ${sourceFiles.length} file nguồn.`);
console.log(`✅ Khảo sát ${foundAssetsCount} đường dẫn ảnh static hoàn toàn đầy đủ trong public/!`);

if (missingAssets.length > 0) {
  console.log('\n❌ =========================================================');
  console.log('🚨 CẢNH BÁO THIẾU TÀI NGUYÊN ẢNH STATIC TRONG PUBLIC/ !');
  console.log('=========================================================\n');
  missingAssets.forEach((item) => {
    console.log(` ⚠️ [CẢNH BÁO]: ${item.file}:${item.line}`);
    console.log(`    ↳ File ảnh không tồn tại trong public: "${item.asset}"\n`);
  });
  console.log('---------------------------------------------------------');
  console.log('💡 HƯỚNG DẪN FIX: Vui lòng bổ sung file ảnh trên vào public/ trước khi deploy Vercel!');
  console.log('=========================================================\n');
  process.exit(1);
} else {
  console.log('\n🎉 RÀ SOÁT TÀI NGUYÊN HOÀN HẢO! 100% file ảnh static đều sẵn sàng cho Vercel Build.\n');
  process.exit(0);
}
