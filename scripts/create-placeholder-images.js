import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple 1x1 pixel PNG data (transparent)
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x03, 0x20, // Width: 800
  0x00, 0x00, 0x01, 0xC2, // Height: 450 (16:9 ratio)
  0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 6 (RGBA)
  0x72, 0x0A, 0x5C, 0x57, // CRC
  0x00, 0x00, 0x00, 0x0A, // IDAT chunk length  
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // Minimal IDAT data
  0x0D, 0x0A, 0x2D, 0xB4, // CRC
  0x00, 0x00, 0x00, 0x00, // IEND chunk length
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

const features = [
  'upload', 'analyzer', 'planner', 'lessons', 'quizzes',
  'acs-lib', 'dashboard', 'schools', 'reports'
];

const featuresDir = path.join(__dirname, '../public/images/features');

// Ensure directory exists
if (!fs.existsSync(featuresDir)) {
  fs.mkdirSync(featuresDir, { recursive: true });
}

// Create placeholder images for each feature
features.forEach(feature => {
  const filePath = path.join(featuresDir, `${feature}-screenshot.jpg`);
  // Create a simple colored rectangle SVG and convert to PNG-like data
  const svgContent = `<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1e9df1;stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:#0066cc;stop-opacity:0.9" />
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#grad)"/>
    <text x="400" y="200" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="bold">
      ${feature.toUpperCase()} FEATURE
    </text>
    <text x="400" y="250" text-anchor="middle" fill="white" font-family="Arial" font-size="18" opacity="0.9">
      Demo Screenshot Preview
    </text>
    <rect x="50" y="50" width="700" height="350" fill="none" stroke="white" stroke-width="2" opacity="0.5" rx="10"/>
  </svg>`;
  
  fs.writeFileSync(filePath.replace('.jpg', '.svg'), svgContent);
  console.log(`Created ${feature}-screenshot.svg`);
});

console.log('Placeholder images created successfully!');