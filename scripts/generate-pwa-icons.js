/**
 * PWA 아이콘 생성 스크립트
 * 
 * 이 스크립트는 간단한 PNG 아이콘을 생성합니다.
 * 실제 프로덕션에서는 디자인된 아이콘 이미지를 사용하세요.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG 아이콘 생성 (192x192)
const icon192Svg = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="192" height="192" fill="url(#grad)" rx="20"/>
  <text x="96" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">부</text>
</svg>`;

// SVG 아이콘 생성 (512x512)
const icon512Svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad2)" rx="50"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">부</text>
</svg>`;

// public 디렉토리 확인
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// PNG 아이콘 생성
async function generateIcons() {
  try {
    // 192x192 아이콘 생성
    await sharp(Buffer.from(icon192Svg))
      .png()
      .resize(192, 192)
      .toFile(path.join(publicDir, 'icon-192x192.png'));

    // 512x512 아이콘 생성
    await sharp(Buffer.from(icon512Svg))
      .png()
      .resize(512, 512)
      .toFile(path.join(publicDir, 'icon-512x512.png'));

    console.log('✅ PWA 아이콘 PNG 파일이 생성되었습니다.');
    console.log('   - icon-192x192.png');
    console.log('   - icon-512x512.png');
    console.log('\n💡 참고: 실제 프로덕션에서는 디자인된 아이콘 이미지를 사용하세요.');
  } catch (error) {
    console.error('❌ 아이콘 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateIcons();

