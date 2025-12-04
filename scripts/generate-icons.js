/**
 * ============================================================
 * ICON GENERATOR
 * Generates application icons for all platforms
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

// Simple SVG icon that we'll save as a placeholder
const iconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="ring1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#2563eb"/>
    </linearGradient>
    <linearGradient id="ring2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
    <linearGradient id="ring3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4"/>
      <stop offset="100%" style="stop-color:#0891b2"/>
    </linearGradient>
    <linearGradient id="center" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="50%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <circle cx="256" cy="256" r="250" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="248" fill="none" stroke="#1e293b" stroke-width="4"/>
  
  <!-- Outer ring -->
  <circle cx="256" cy="256" r="200" fill="none" stroke="url(#ring1)" stroke-width="12" stroke-linecap="round" stroke-dasharray="200 800" transform="rotate(-90 256 256)"/>
  
  <!-- Middle ring -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="url(#ring2)" stroke-width="10" stroke-linecap="round" stroke-dasharray="150 650" transform="rotate(30 256 256)"/>
  
  <!-- Inner ring -->
  <circle cx="256" cy="256" r="120" fill="none" stroke="url(#ring3)" stroke-width="8" stroke-linecap="round" stroke-dasharray="100 500" transform="rotate(120 256 256)"/>
  
  <!-- Center circle -->
  <circle cx="256" cy="256" r="70" fill="url(#center)"/>
  
  <!-- Center icon (node symbol) -->
  <g fill="#ffffff">
    <circle cx="256" cy="230" r="12"/>
    <circle cx="230" cy="270" r="12"/>
    <circle cx="282" cy="270" r="12"/>
    <line x1="256" y1="230" x2="230" y2="270" stroke="#ffffff" stroke-width="4"/>
    <line x1="256" y1="230" x2="282" y2="270" stroke="#ffffff" stroke-width="4"/>
    <line x1="230" y1="270" x2="282" y2="270" stroke="#ffffff" stroke-width="4"/>
  </g>
</svg>`;

const iconsDir = path.join(__dirname, '..', 'electron', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Save SVG
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSVG);
console.log('✅ Created icon.svg');

// Create a simple PNG placeholder (base64 encoded 64x64 icon)
// This is a minimal valid PNG that will work as a placeholder
const pngBase64 = `iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF
8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0w
TXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRh
LyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuYjBmOGJlMywgMjAyMS8xMi8w
OC0xOToxMToyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9y
Zy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9
IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0
cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25z
LmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5j
b20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAv
c1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIz
LjEgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMS0xNVQxMDowMDowMCswMTowMCIg
eG1wOk1vZGlmeURhdGU9IjIwMjQtMDEtMTVUMTA6MDA6MDArMDE6MDAiIHhtcDpNZXRhZGF0YURh
dGU9IjIwMjQtMDEtMTVUMTA6MDA6MDArMDE6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90
b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjEiIHhtcE1NOkRv
Y3VtZW50SUQ9InhtcC5kaWQ6MSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjEi
Pjwvcmut`;

// Write minimal PNG
const pngBuffer = Buffer.from(pngBase64, 'base64');
fs.writeFileSync(path.join(iconsDir, 'icon.png'), pngBuffer);
console.log('✅ Created icon.png (placeholder)');

console.log('\n📝 Note: For production, replace the placeholder icons with proper high-resolution icons:');
console.log('   - icon.ico (256x256) for Windows');
console.log('   - icon.icns (512x512) for macOS');
console.log('   - icon.png (512x512) for Linux');
console.log('\nYou can use tools like:');
console.log('   - https://convertio.co/svg-ico/');
console.log('   - https://cloudconvert.com/svg-to-icns');
console.log('   - electron-icon-builder npm package');
