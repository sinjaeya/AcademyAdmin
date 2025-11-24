/**
 * PWA 아이콘 생성 스크립트 (건물 아이콘 버전)
 * 
 * 현대적인 건물 아이콘을 생성합니다.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG 아이콘 생성 (192x192) - 건물 아이콘
const icon192Svg = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6b21a8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#9333ea;stop-opacity:0.3" />
    </linearGradient>
  </defs>
  
  <!-- 배경 -->
  <rect width="192" height="192" rx="42" fill="url(#bgGrad)"/>
  
  <!-- 테두리 -->
  <rect x="8" y="8" width="176" height="176" rx="38" fill="none" stroke="url(#borderGrad)" stroke-width="4"/>
  
  <!-- 건물 (isometric view) -->
  <g transform="translate(96, 96)">
    <!-- 건물 본체 (왼쪽 면) -->
    <polygon points="-40,20 -40,-30 0,-50 0,0" fill="#ffffff" opacity="0.95"/>
    <!-- 건물 본체 (오른쪽 면) -->
    <polygon points="0,-50 40,-30 40,20 0,0" fill="#ffffff"/>
    <!-- 건물 본체 (윗면) -->
    <polygon points="-40,-30 0,-50 40,-30 0,-60" fill="#e0e7ff" opacity="0.8"/>
    
    <!-- 건물 오버행 (오른쪽) -->
    <polygon points="0,-30 20,-20 20,10 0,0" fill="#f3f4f6"/>
    <polygon points="0,-30 20,-20 0,-40" fill="#d1d5db" opacity="0.6"/>
    
    <!-- 왼쪽 면 창문들 (3개) -->
    <rect x="-35" y="-25" width="8" height="10" fill="#1e3a8a" rx="1"/>
    <rect x="-35" y="-10" width="8" height="10" fill="#1e3a8a" rx="1"/>
    <rect x="-35" y="5" width="8" height="10" fill="#1e3a8a" rx="1"/>
    
    <!-- 오른쪽 면 창문들 (4개) -->
    <rect x="5" y="-30" width="12" height="12" fill="#1e3a8a" rx="1"/>
    <rect x="20" y="-30" width="12" height="12" fill="#1e3a8a" rx="1"/>
    <rect x="5" y="-15" width="12" height="12" fill="#1e3a8a" rx="1"/>
    <rect x="20" y="-15" width="12" height="12" fill="#1e3a8a" rx="1"/>
    
    <!-- 창문 크로스 패턴 (오른쪽 면) -->
    <line x1="11" y1="-30" x2="11" y2="-18" stroke="#3b82f6" stroke-width="0.5"/>
    <line x1="5" y1="-24" x2="17" y2="-24" stroke="#3b82f6" stroke-width="0.5"/>
    <line x1="26" y1="-30" x2="26" y2="-18" stroke="#3b82f6" stroke-width="0.5"/>
    <line x1="20" y1="-24" x2="32" y2="-24" stroke="#3b82f6" stroke-width="0.5"/>
    <line x1="11" y1="-15" x2="11" y2="-3" stroke="#3b82f6" stroke-width="0.5"/>
    <line x1="5" y1="-9" x2="17" y2="-9" stroke="#3b82f6" stroke-width="0.5"/>
    <line x1="26" y1="-15" x2="26" y2="-3" stroke="#3b82f6" stroke-width="0.5"/>
    <line x1="20" y1="-9" x2="32" y2="-9" stroke="#3b82f6" stroke-width="0.5"/>
    
    <!-- 그림자 효과 -->
    <polygon points="-40,20 0,0 0,5 -40,25" fill="#1e3a8a" opacity="0.2"/>
    <polygon points="0,0 40,20 40,25 0,5" fill="#6b21a8" opacity="0.2"/>
  </g>
</svg>`;

// SVG 아이콘 생성 (512x512) - 건물 아이콘
const icon512Svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6b21a8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="borderGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#9333ea;stop-opacity:0.3" />
    </linearGradient>
  </defs>
  
  <!-- 배경 -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad2)"/>
  
  <!-- 테두리 -->
  <rect x="20" y="20" width="472" height="472" rx="100" fill="none" stroke="url(#borderGrad2)" stroke-width="10"/>
  
  <!-- 건물 (isometric view) -->
  <g transform="translate(256, 256)">
    <!-- 건물 본체 (왼쪽 면) -->
    <polygon points="-110,55 -110,-80 0,-130 0,0" fill="#ffffff" opacity="0.95"/>
    <!-- 건물 본체 (오른쪽 면) -->
    <polygon points="0,-130 110,-80 110,55 0,0" fill="#ffffff"/>
    <!-- 건물 본체 (윗면) -->
    <polygon points="-110,-80 0,-130 110,-80 0,-160" fill="#e0e7ff" opacity="0.8"/>
    
    <!-- 건물 오버행 (오른쪽) -->
    <polygon points="0,-80 55,-55 55,25 0,0" fill="#f3f4f6"/>
    <polygon points="0,-80 55,-55 0,-105" fill="#d1d5db" opacity="0.6"/>
    
    <!-- 왼쪽 면 창문들 (3개) -->
    <rect x="-95" y="-70" width="22" height="28" fill="#1e3a8a" rx="3"/>
    <rect x="-95" y="-28" width="22" height="28" fill="#1e3a8a" rx="3"/>
    <rect x="-95" y="14" width="22" height="28" fill="#1e3a8a" rx="3"/>
    
    <!-- 오른쪽 면 창문들 (4개) -->
    <rect x="15" y="-80" width="32" height="32" fill="#1e3a8a" rx="3"/>
    <rect x="55" y="-80" width="32" height="32" fill="#1e3a8a" rx="3"/>
    <rect x="15" y="-40" width="32" height="32" fill="#1e3a8a" rx="3"/>
    <rect x="55" y="-40" width="32" height="32" fill="#1e3a8a" rx="3"/>
    
    <!-- 창문 크로스 패턴 (오른쪽 면) -->
    <line x1="31" y1="-80" x2="31" y2="-48" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="15" y1="-64" x2="47" y2="-64" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="71" y1="-80" x2="71" y2="-48" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="55" y1="-64" x2="87" y2="-64" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="31" y1="-40" x2="31" y2="-8" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="15" y1="-24" x2="47" y2="-24" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="71" y1="-40" x2="71" y2="-8" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="55" y1="-24" x2="87" y2="-24" stroke="#3b82f6" stroke-width="1.5"/>
    
    <!-- 그림자 효과 -->
    <polygon points="-110,55 0,0 0,15 -110,70" fill="#1e3a8a" opacity="0.2"/>
    <polygon points="0,0 110,55 110,70 0,15" fill="#6b21a8" opacity="0.2"/>
  </g>
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
    console.log('   - icon-192x192.png (건물 아이콘)');
    console.log('   - icon-512x512.png (건물 아이콘)');
  } catch (error) {
    console.error('❌ 아이콘 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateIcons();



