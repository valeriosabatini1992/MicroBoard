const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output dir exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to generate a simple uncompressed PNG with pure Node.js
function createPng(width, height, drawFn) {
  // RGBA buffer: (width * 4 + 1 filter byte) per row
  const rowStride = width * 4 + 1;
  const rawData = Buffer.alloc(rowStride * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowStride;
    rawData[rowStart] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelStart = rowStart + 1 + x * 4;
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcData = Buffer.concat([typeBuf, data]);
    const crc = crc32(crcData);
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, crcData, crcBuf]);
  }

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk('IHDR', ihdrData);

  // IDAT
  const idat = chunk('IDAT', compressed);

  // IEND
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Simple CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ (-1)) >>> 0;
}

// Drawing function for MicroBoard logo (Dark medical navy background, rounded medical cross, glowing cyan/red accent)
function drawMicroIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Background: dark navy rounded rect
  const cornerR = w * 0.22;
  const inX = Math.abs(dx) <= (cx - cornerR);
  const inY = Math.abs(dy) <= (cy - cornerR);
  let inBounds = true;
  if (!inX && !inY) {
    const cdx = Math.abs(dx) - (cx - cornerR);
    const cdy = Math.abs(dy) - (cy - cornerR);
    if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerR) inBounds = false;
  }

  if (!inBounds) return [0, 0, 0, 0]; // Transparent outside

  // Medical cross dimensions
  const crossArm = w * 0.14;
  const crossLength = w * 0.36;
  const inCrossH = Math.abs(dy) <= crossArm && Math.abs(dx) <= crossLength;
  const inCrossV = Math.abs(dx) <= crossArm && Math.abs(dy) <= crossLength;

  if (inCrossH || inCrossV) {
    // Medical red / teal cross gradient
    if (dy < -crossArm * 0.5) {
      return [179, 32, 58, 255]; // Red for infection
    } else if (dy > crossArm * 0.5) {
      return [14, 111, 104, 255]; // Teal for surveillance
    }
    return [255, 255, 255, 255]; // Pure white center
  }

  // Base background: #15222E navy
  return [21, 34, 46, 255];
}

// Write icons
[
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 }
].forEach(({ file, size }) => {
  const pngBuf = createPng(size, size, drawMicroIcon);
  fs.writeFileSync(path.join(iconsDir, file), pngBuf);
  console.log(`Generated ${file} (${size}x${size})`);
});

// Also create an SVG version
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#15222E"/>
  <rect x="180" y="96" width="152" height="320" rx="24" fill="#FFFFFF"/>
  <rect x="96" y="180" width="320" height="152" rx="24" fill="#FFFFFF"/>
  <rect x="196" y="112" width="120" height="100" rx="16" fill="#B3203A"/>
  <rect x="196" y="300" width="120" height="100" rx="16" fill="#0E6F68"/>
  <circle cx="256" cy="256" r="32" fill="#2354C0"/>
</svg>`;
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
console.log('Generated icon.svg');
