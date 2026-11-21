// Writes content/projects/<slug>/sizes.json: { "file.jpg": [width, height], ... } for every picture in
// the folder. article-md.js puts the sizes on the <img>s, so a phone keeps each picture's space while
// it loads and the page doesn't jump as you scroll. Run by `npm run stamp`.
//
//   node tools/sizes.js           rewrite them
//   node tools/sizes.js --check   exit 1 if any is out of date (used by the tests)
const fs = require('fs');
const path = require('path');

const PROJECTS = path.join(__dirname, '..', 'dusk', 'content', 'projects');
const PIC = /\.(jpe?g|png|gif|webp)$/i;

/* width and height from the file's header; JPEGs here carry no rotation (no metadata on site images) */
function dims(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString('ascii', 0, 3) === 'GIF') return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (kind === 'VP8L') { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1]; }
    if (kind === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

function sizesFor(dir) {
  const out = {};
  for (const f of fs.readdirSync(dir).filter(f => PIC.test(f)).sort()) {
    const d = dims(path.join(dir, f));
    if (d) out[f] = d;
  }
  return JSON.stringify(out) + '\n';
}

function run(check) {
  const stale = [];
  for (const slug of fs.readdirSync(PROJECTS).sort()) {
    const dir = path.join(PROJECTS, slug);
    if (!fs.statSync(dir).isDirectory()) continue;
    const file = path.join(dir, 'sizes.json'), want = sizesFor(dir);
    const have = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (have === want) continue;
    stale.push(slug);
    if (!check) fs.writeFileSync(file, want);
  }
  return stale;
}

module.exports = { dims, sizesFor, run };

if (require.main === module) {
  const check = process.argv.includes('--check');
  const stale = run(check);
  if (check && stale.length) { console.error('sizes.json out of date: ' + stale.join(', ') + ' (run: npm run stamp)'); process.exit(1); }
  console.log(check ? 'sizes.json up to date' : `sizes.json: ${stale.length} folder(s) updated`);
}
