// Adds entries to a copy of the site by following dusk/README.md step by step.
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const SITE = path.join(__dirname, '..', 'dusk');

/* a solid-colour PNG, so the suite needs no real photos in the repo */
function png(w, h, [r, g, b]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  const crc = buf => { let c = ~0; for (const x of buf) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(w).fill([r, g, b]).flat())]);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(Array(h).fill(row)))), chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* SITE_PHOTOS=/path/to/jpgs uses real photos (cycled); otherwise generated ones */
const real = process.env.SITE_PHOTOS
  ? fs.readdirSync(process.env.SITE_PHOTOS).filter(f => /\.jpe?g$/i.test(f)).sort().map(f => path.join(process.env.SITE_PHOTOS, f))
  : [];
let n = 0;
function image() {
  if (real.length) return fs.readFileSync(real[n++ % real.length]);
  n++;
  return png(60, 40, [(n * 70) % 256, (n * 130) % 256, (n * 40) % 256]);
}

/* A copy of the site reset to templates only, so tests that add entries
   start from a blank site no matter what real content has been published. */
function copySite() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dusk-'));
  fs.cpSync(SITE, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'content', 'manifest.json'),
    JSON.stringify({ projects: ['example'], tapes: ['example'] }, null, 2));
  return dir;
}

const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJSON = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

/* README "Adding a project" / "Adding a photo roll", steps 1–4 */
function addEntry(site, kind, slug, entry, files) {
  const dir = path.join(site, 'content', kind, slug);
  fs.cpSync(path.join(site, 'content', kind, 'example'), dir, { recursive: true }); // 1. copy the template
  for (const f of files) fs.writeFileSync(path.join(dir, f), image());              // 2. add the images
  writeJSON(path.join(dir, 'entry.json'), entry);                                   // 3. edit entry.json
  const manifest = path.join(site, 'content', 'manifest.json');                     // 4. list it
  const m = readJSON(manifest);
  m[kind].push(slug);
  writeJSON(manifest, m);
}

/* README "Remove "example" from the list once you have a real entry" */
function removeExample(site) {
  const manifest = path.join(site, 'content', 'manifest.json');
  const m = readJSON(manifest);
  m.projects = m.projects.filter(s => s !== 'example');
  m.tapes = m.tapes.filter(s => s !== 'example');
  writeJSON(manifest, m);
}

/* README "Adding a record" */
function addRecord(site, record) {
  const f = path.join(site, 'content', 'records.json');
  writeJSON(f, [...readJSON(f), record]);
}

function addHero(site) {
  fs.writeFileSync(path.join(site, 'content', 'hero.jpg'), image());
}

module.exports = { copySite, addEntry, addRecord, addHero, removeExample, SITE };
