const sharp = require('sharp');
const path = require('path');

const inputPath = 'C:/Users/sinja/.gemini/antigravity/brain/0f947afd-fed8-4769-ac90-ae45a0144c8c/academy_admin_icon_v2_1763968247564.png';
const outputPath = 'C:/Users/sinja/.gemini/antigravity/brain/0f947afd-fed8-4769-ac90-ae45a0144c8c/academy_admin_icon_v5_composite.png';

const width = 1024; // Assuming high res, but we'll resize or match
const height = 1024;

const svgText = `
<svg width="${width}" height="${height}">
  <style>
    .title { fill: #1d4ed8; font-size: 600px; font-family: sans-serif; font-weight: bold; }
  </style>
  <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" class="title">A</text>
</svg>
`;

async function composite() {
  try {
    const metadata = await sharp(inputPath).metadata();
    
    // Adjust SVG to match image dimensions
    const finalSvg = svgText.replace(`width="${width}"`, `width="${metadata.width}"`)
                            .replace(`height="${height}"`, `height="${metadata.height}"`)
                            .replace('font-size: 600px', `font-size: ${metadata.height * 0.6}px`);

    await sharp(inputPath)
      .composite([
        {
          input: Buffer.from(finalSvg),
          top: 0,
          left: 0,
        },
      ])
      .toFile(outputPath);
      
    console.log('Successfully created composite icon');
  } catch (error) {
    console.error('Error:', error);
  }
}

composite();
