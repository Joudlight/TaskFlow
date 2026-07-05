/*
  App.QR — minimal, dependency-free QR code generator.
  Scope, deliberately: byte mode only, error-correction level L, versions 1-5
  (fits any realistic GitHub Pages URL), fixed mask pattern 0, single Reed-Solomon
  block (no interleaving needed at these versions). This keeps the implementation
  small and verifiable rather than reproducing the entire ISO/IEC 18004 spec.
*/
(function () {
  'use strict';
  window.App = window.App || {};

  // ---------- GF(256) arithmetic (primitive polynomial 0x11D) ----------
  const EXP = new Array(256);
  const LOG = new Array(256);
  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
  })();
  function gexp(n) { n = n % 255; if (n < 0) n += 255; return EXP[n]; }
  function glog(n) { return LOG[n]; }

  function polyMultiply(a, b) {
    const r = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
      if (a[i] === 0) continue;
      for (let j = 0; j < b.length; j++) {
        if (b[j] === 0) continue;
        r[i + j] ^= gexp(glog(a[i]) + glog(b[j]));
      }
    }
    return r;
  }

  function reedSolomonEncode(dataBytes, ecCount) {
    let generator = [1];
    for (let i = 0; i < ecCount; i++) generator = polyMultiply(generator, [1, gexp(i)]);
    const remainder = dataBytes.concat(new Array(ecCount).fill(0));
    for (let i = 0; i < dataBytes.length; i++) {
      const coeff = remainder[i];
      if (coeff === 0) continue;
      const logCoeff = glog(coeff);
      for (let j = 0; j < generator.length; j++) {
        remainder[i + j] ^= gexp(glog(generator[j]) + logCoeff);
      }
    }
    return remainder.slice(dataBytes.length);
  }

  // ---------- Version tables (byte mode, EC level L only) ----------
  const DATA_CODEWORDS = { 1: 19, 2: 34, 3: 55, 4: 80, 5: 108 };
  const EC_CODEWORDS = { 1: 7, 2: 10, 3: 15, 4: 20, 5: 26 };
  const ALIGNMENT_CENTER = { 1: null, 2: 18, 3: 22, 4: 26, 5: 30 };
  const moduleCount = (v) => 4 * v + 17;

  function selectVersion(byteLength) {
    for (let v = 1; v <= 5; v++) {
      const requiredBits = 4 + 8 + byteLength * 8;
      if (requiredBits <= DATA_CODEWORDS[v] * 8) return v;
    }
    return null;
  }

  // ---------- Byte-mode bit stream ----------
  function buildDataCodewords(bytes, version) {
    const capacity = DATA_CODEWORDS[version];
    const bits = [];
    const put = (num, len) => { for (let i = len - 1; i >= 0; i--) bits.push((num >>> i) & 1); };
    put(4, 4);               // mode indicator: byte mode
    put(bytes.length, 8);    // char count indicator (8 bits for versions 1-9)
    bytes.forEach((b) => put(b, 8));
    const remaining = capacity * 8 - bits.length;
    put(0, Math.min(4, Math.max(0, remaining))); // terminator
    while (bits.length % 8 !== 0) bits.push(0);
    const padBytes = [0xec, 0x11];
    let pi = 0;
    while (bits.length < capacity * 8) { put(padBytes[pi % 2], 8); pi++; }
    const out = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      out.push(byte);
    }
    return out.slice(0, capacity);
  }

  // ---------- Format info (EC level L=01, mask=0 -> data bits 01000), BCH(15,5) ----------
  function formatBits() {
    const data = 0b01000; // EC level L (01) + mask pattern 000
    let d = data;
    const gen = 0b10100110111; // generator polynomial, degree 10
    let shifted = data << 10;
    for (let i = 4; i >= 0; i--) {
      if ((shifted >> (i + 10)) & 1) shifted ^= (gen << i);
    }
    let full = (data << 10) | shifted;
    full ^= 0b101010000010010; // fixed XOR mask
    return full;
  }

  const FINDER = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  const ALIGNMENT = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ];

  function buildMatrix(dataCodewords, ecCodewords, version) {
    const n = moduleCount(version);
    const m = Array.from({ length: n }, () => new Array(n).fill(null));
    const reserved = Array.from({ length: n }, () => new Array(n).fill(false));

    function place(r, c, val, isReserved) {
      if (r < 0 || r >= n || c < 0 || c >= n) return;
      m[r][c] = val;
      if (isReserved) reserved[r][c] = true;
    }
    function placeBlock(pattern, topRow, topCol, isReserved) {
      for (let r = 0; r < pattern.length; r++) {
        for (let c = 0; c < pattern[0].length; c++) place(topRow + r, topCol + c, pattern[r][c], isReserved);
      }
    }

    // Finder patterns + separators (reserve full 8x8 corner zones)
    placeBlock(FINDER, 0, 0, true);
    placeBlock(FINDER, 0, n - 7, true);
    placeBlock(FINDER, n - 7, 0, true);
    for (let i = 0; i < 8; i++) {
      place(7, i, 0, true); place(i, 7, 0, true);                 // top-left separator
      place(7, n - 1 - i, 0, true); place(i, n - 8, 0, true);     // top-right separator
      place(n - 8, i, 0, true); place(n - 1 - i, 7, 0, true);     // bottom-left separator
    }

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
      place(6, i, i % 2 === 0 ? 1 : 0, true);
      place(i, 6, i % 2 === 0 ? 1 : 0, true);
    }

    // Alignment pattern (versions 2-5: exactly one, skip if it would overlap a finder zone)
    const ac = ALIGNMENT_CENTER[version];
    if (ac != null) placeBlock(ALIGNMENT, ac - 2, ac - 2, true);

    // Dark module (always present, fixed position)
    place(n - 8, 8, 1, true);

    // Format info (both copies), fixed EC=L / mask=0
    const fBits = formatBits();
    const bit = (i) => (fBits >> i) & 1;
    // Vertical copy, column 8, top-left area
    for (let i = 0; i <= 5; i++) place(i, 8, bit(i), true);
    place(7, 8, bit(6), true);
    place(8, 8, bit(7), true);
    place(8, 7, bit(8), true);
    for (let i = 9; i <= 14; i++) place(8, 14 - i, bit(i), true);
    // Horizontal copy (top-right) + vertical copy (bottom-left) — redundant copies
    for (let i = 0; i <= 7; i++) place(8, n - 1 - i, bit(i), true);
    for (let i = 8; i <= 14; i++) place(n - 15 + i, 8, bit(i), true);

    // ---- Data placement: zigzag, two columns at a time, right to left, skipping column 6 ----
    const codewords = dataCodewords.concat(ecCodewords);
    const bitsLen = codewords.length * 8;
    let bitIndex = 0;
    function nextBit() {
      if (bitIndex >= bitsLen) return 0;
      const byte = codewords[bitIndex >> 3];
      const b = (byte >> (7 - (bitIndex % 8))) & 1;
      bitIndex++;
      return b;
    }

    let col = n - 1;
    let upward = true;
    while (col > 0) {
      if (col === 6) col--; // skip the vertical timing column
      for (let k = 0; k < n; k++) {
        const row = upward ? n - 1 - k : k;
        for (let dc = 0; dc < 2; dc++) {
          const c = col - dc;
          if (reserved[row][c]) continue;
          const bitVal = nextBit();
          const masked = (row + c) % 2 === 0 ? bitVal ^ 1 : bitVal; // mask 0: (row+col)%2==0
          place(row, c, masked, false);
        }
      }
      upward = !upward;
      col -= 2;
    }

    return m;
  }

  /** Generates a boolean matrix (true = dark module) for the given text, or null if it doesn't fit v1-5. */
  function generate(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    const version = selectVersion(bytes.length);
    if (!version) return null;
    const dataCodewords = buildDataCodewords(bytes, version);
    const ecCodewords = reedSolomonEncode(dataCodewords, EC_CODEWORDS[version]);
    const matrix = buildMatrix(dataCodewords, ecCodewords, version);
    return matrix.map((row) => row.map((v) => !!v));
  }

  /** Renders the matrix as an SVG string with a quiet-zone border, ready to inject into the DOM. */
  function toSVG(matrix, opts) {
    opts = opts || {};
    const quiet = 4;
    const n = matrix.length;
    const total = n + quiet * 2;
    const dark = opts.dark || '#16181d';
    const light = opts.light || '#ffffff';
    let cells = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c]) cells += `<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1"/>`;
      }
    }
    return `<svg viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code linking to this app">` +
      `<rect width="${total}" height="${total}" fill="${light}"/>` +
      `<g fill="${dark}">${cells}</g></svg>`;
  }

  App.QR = { generate, toSVG, _internal: { selectVersion, buildDataCodewords, reedSolomonEncode, buildMatrix, formatBits } };
})();
