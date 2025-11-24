/**
 * PWA 아이콘 생성 스크립트
 * 
 * public/icon-source.png 파일을 기반으로 PWA 아이콘을 생성합니다.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// public 디렉토리 확인
const publicDir = path.join(process.cwd(), 'public');
const sourceIcon = path.join(publicDir, 'icon-source.png');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 아이콘 생성
async function generateIcons() {
  try {
    if (!fs.existsSync(sourceIcon)) {
      console.error('❌ 원본 아이콘 파일(public/icon-source.png)을 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('🎨 원본 아이콘을 사용하여 PWA 아이콘을 생성합니다...');

    // 192x192 아이콘 생성
    await sharp(sourceIcon)
      .resize(192, 192)
      .toFile(path.join(publicDir, 'icon-192x192.png'));

    // 512x512 아이콘 생성
    await sharp(sourceIcon)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'icon-512x512.png'));

    console.log('✅ PWA 아이콘 생성이 완료되었습니다.');
    console.log('   - public/icon-192x192.png');
    console.log('   - public/icon-512x512.png');
  } catch (error) {
    console.error('❌ 아이콘 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateIcons();

