// Generates the app icons as PNGs, with no image library.
// Draws at 4x and averages down, which gives smooth edges.
const zlib = require('zlib');
const fs = require('fs');

const BG    = [0x11, 0x14, 0x18];
const ROUTE = [0xff, 0x5a, 0x1f];
const START = [0x34, 0xd3, 0x99];
const WHITE = [0xff, 0xff, 0xff];

// the route shape, in 0..1 coordinates
const SHAPE = [[0.20, 0.74], [0.35, 0.50], [0.50, 0.62], [0.66, 0.32], [0.81, 0.41]];

function crcOf(buf) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buf) >>> 0;
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcOf(typed), 0);
  return Buffer.concat([len, typed, crc]);
}

function toPNG(size, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // truecolour
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;  // no per-line filter
    Buffer.from(rgb.buffer, y * size * 3, size * 3).copy(raw, y * stride + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function disc(buf, w, cx, cy, r, col) {
  const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(w - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r * r) continue;
      const i = (y * w + x) * 3;
      buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2];
    }
  }
}

function render(size) {
  const S = 4, W = size * S;
  const big = new Uint8Array(W * W * 3);
  for (let i = 0; i < W * W; i++) {
    big[i * 3] = BG[0]; big[i * 3 + 1] = BG[1]; big[i * 3 + 2] = BG[2];
  }

  const pts = SHAPE.map(p => [p[0] * W, p[1] * W]);
  const lineR = 0.062 * W;

  // stamp overlapping discs along each segment to get a round-capped line
  for (let s = 0; s < pts.length - 1; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay));
    for (let t = 0; t <= steps; t++) {
      const f = t / steps;
      disc(big, W, ax + (bx - ax) * f, ay + (by - ay) * f, lineR, ROUTE);
    }
  }

  const ends = [[pts[0], START], [pts[pts.length - 1], ROUTE]];
  for (const [p, col] of ends) {
    disc(big, W, p[0], p[1], 0.105 * W, WHITE);
    disc(big, W, p[0], p[1], 0.078 * W, col);
  }

  // average each SxS block down to one pixel
  const out = new Uint8Array(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const i = ((y * S + sy) * W + (x * S + sx)) * 3;
          r += big[i]; g += big[i + 1]; b += big[i + 2];
        }
      }
      const n = S * S, o = (y * size + x) * 3;
      out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n);
    }
  }
  return out;
}

for (const size of [180, 192, 512]) {
  const file = 'icon-' + size + '.png';
  fs.writeFileSync(file, toPNG(size, render(size)));
  console.log(file, fs.statSync(file).size + ' bytes');
}
