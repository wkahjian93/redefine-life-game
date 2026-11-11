// Draws the app icon (die on navy with coral heart) and writes PNGs into docs/icons: node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const out = path.join(__dirname, '..', 'docs', 'icons');
fs.mkdirSync(out, { recursive: true });

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const NAVY = hex('#14213D'), WHITE = hex('#FFF8EE'), CORAL = hex('#FF6B4A'), SUN = hex('#FFC93C');

// shape tests in unit coordinates (0..1); later shapes paint over earlier ones
function colourAt(x, y) {
  const dx = x - 0.5, dy = y - 0.5;
  let c = NAVY;
  // rounded white die face
  const h = 0.27, rad = 0.07, qx = Math.max(Math.abs(dx) - (h - rad), 0), qy = Math.max(Math.abs(dy) - (h - rad), 0);
  if (Math.hypot(qx, qy) < rad) c = WHITE;
  // four navy corner pips + coral centre pip
  [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(([px, py]) => { if (Math.hypot(dx - px, dy - py) < 0.045) c = NAVY; });
  if (Math.hypot(dx, dy) < 0.06) c = CORAL;
  if (y > 0.84 && y < 0.87 && Math.abs(dx) < 0.2) c = SUN;               // underline
  return c;
}

function png(size) {
  const ss = 4, raw = Buffer.alloc((size * 4 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const c = colourAt((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size);
        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
      }
      const o = py * (size * 4 + 1) + 1 + px * 4;
      raw[o] = acc[0] / (ss * ss); raw[o + 1] = acc[1] / (ss * ss); raw[o + 2] = acc[2] / (ss * ss); raw[o + 3] = 255;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

[['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]].forEach(([name, size]) => {
  fs.writeFileSync(path.join(out, name), png(size));
  console.log('wrote', name);
});
