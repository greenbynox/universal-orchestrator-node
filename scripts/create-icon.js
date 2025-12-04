const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'electron', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a proper 256x256 PNG using raw buffer (BMP-like structure)
function createPNG(size) {
  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (13 bytes of data)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData.writeUInt8(8, 8);        // bit depth
  ihdrData.writeUInt8(2, 9);        // color type (RGB)
  ihdrData.writeUInt8(0, 10);       // compression
  ihdrData.writeUInt8(0, 11);       // filter
  ihdrData.writeUInt8(0, 12);       // interlace
  
  // Create a simple gradient icon
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      // Create a gradient from purple to blue
      const r = Math.floor(100 + (x / size) * 50);
      const g = Math.floor(50 + (y / size) * 100);
      const b = Math.floor(180 + ((x + y) / (size * 2)) * 75);
      rawData.push(r, g, b);
    }
  }
  
  // Compress with zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  
  // Build IHDR chunk
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // Build IDAT chunk
  const idatChunk = createChunk('IDAT', compressed);
  
  // Build IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  
  // Calculate CRC32
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create ICO file with multiple sizes
function createICO() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngs = sizes.map(size => ({
    size,
    data: createPNG(size)
  }));
  
  // ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);           // reserved
  header.writeUInt16LE(1, 2);           // type (1 = ICO)
  header.writeUInt16LE(pngs.length, 4); // image count
  
  // Calculate offsets
  let offset = 6 + (16 * pngs.length);
  const entries = [];
  
  for (const png of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(png.size >= 256 ? 0 : png.size, 0);  // width
    entry.writeUInt8(png.size >= 256 ? 0 : png.size, 1);  // height
    entry.writeUInt8(0, 2);                // color palette
    entry.writeUInt8(0, 3);                // reserved
    entry.writeUInt16LE(1, 4);             // color planes
    entry.writeUInt16LE(32, 6);            // bits per pixel
    entry.writeUInt32LE(png.data.length, 8);  // size of image data
    entry.writeUInt32LE(offset, 12);       // offset
    
    entries.push(entry);
    offset += png.data.length;
  }
  
  return Buffer.concat([header, ...entries, ...pngs.map(p => p.data)]);
}

// Create ICNS file for macOS
function createICNS() {
  const png256 = createPNG(256);
  const png512 = createPNG(512);
  
  // ICNS header
  const magic = Buffer.from('icns');
  
  // ic08 = 256x256 PNG
  const ic08Type = Buffer.from('ic08');
  const ic08Length = Buffer.alloc(4);
  ic08Length.writeUInt32BE(8 + png256.length, 0);
  
  // ic09 = 512x512 PNG  
  const ic09Type = Buffer.from('ic09');
  const ic09Length = Buffer.alloc(4);
  ic09Length.writeUInt32BE(8 + png512.length, 0);
  
  const content = Buffer.concat([
    ic08Type, ic08Length, png256,
    ic09Type, ic09Length, png512
  ]);
  
  const totalLength = Buffer.alloc(4);
  totalLength.writeUInt32BE(8 + content.length, 0);
  
  return Buffer.concat([magic, totalLength, content]);
}

// Generate icons
console.log('Creating icons...');

// Create 256x256 PNG
const png256 = createPNG(256);
fs.writeFileSync(path.join(iconsDir, 'icon.png'), png256);
console.log('Created icon.png (256x256)');

// Create 512x512 PNG for high DPI
const png512 = createPNG(512);
fs.writeFileSync(path.join(iconsDir, '512x512.png'), png512);
console.log('Created 512x512.png');

// Create ICO for Windows
const ico = createICO();
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), ico);
console.log('Created icon.ico');

// Create ICNS for macOS
const icns = createICNS();
fs.writeFileSync(path.join(iconsDir, 'icon.icns'), icns);
console.log('Created icon.icns');

console.log('\nAll icons created successfully!');
