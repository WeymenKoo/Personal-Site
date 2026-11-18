// Stamps every link to the site's own CSS / JS / images with ?v=<hash of the
// assets>, so a browser never pairs a new page with an old cached script
// (GitHub Pages lets browsers keep files for 10 minutes).
//
//   npm run stamp            rewrite the stamps
//   node tools/stamp.js --check   exit 1 if they're out of date (used by the tests)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE = path.join(__dirname, '..', 'dusk');
const STAMP = /\?v=[0-9a-f]{8}/g;

function walk(dir, keep, out = []) {
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, keep, out);
    else if (keep(p)) out.push(p);
  }
  return out;
}

/* what gets stamped: the pages, and the two files that load other files */
function targets() {
  return [
    ...walk(SITE, p => p.endsWith('.html')),
    path.join(SITE, 'assets', 'site.css'),
    path.join(SITE, 'assets', 'article-md.js'),
  ];
}

/* the hash covers everything in assets/, with any old stamp taken out first */
function hash() {
  const h = crypto.createHash('sha1');
  for (const f of walk(path.join(SITE, 'assets'), () => true)) {
    h.update(path.relative(SITE, f));
    const buf = fs.readFileSync(f);
    h.update(/\.(css|js|svg)$/.test(f) ? buf.toString('utf8').replace(STAMP, '') : buf);
  }
  return h.digest('hex').slice(0, 8);
}

function stamped(file, v) {
  let s = fs.readFileSync(file, 'utf8').replace(STAMP, '');
  if (file.endsWith('.html')) {
    // href="…assets/site.css"  src="…assets/fx.js"
    s = s.replace(/((?:href|src)="(?:\.\.\/)*assets\/[\w./-]+\.(?:css|js))"/g, `$1?v=${v}"`);
  } else if (file.endsWith('.css')) {
    s = s.replace(/url\((img\/[\w.-]+)\)/g, `url($1?v=${v})`);
  } else {
    // article-md.js: script(ASSETS + "fx.js")
    s = s.replace(/(script\(ASSETS \+ "[\w./-]+\.js)"/g, `$1?v=${v}"`);
  }
  return s;
}

function run(check) {
  const v = hash();
  const stale = [];
  for (const f of targets()) {
    const next = stamped(f, v);
    if (next === fs.readFileSync(f, 'utf8')) continue;
    stale.push(path.relative(path.join(SITE, '..'), f));
    if (!check) fs.writeFileSync(f, next);
  }
  return { v, stale };
}

module.exports = { run };

if (require.main === module) {
  const check = process.argv.includes('--check');
  const { v, stale } = run(check);
  if (check && stale.length) { console.error('stale stamps (run: npm run stamp):\n  ' + stale.join('\n  ')); process.exit(1); }
  console.log(check ? `stamps are current (${v})` : `stamped ${stale.length} file(s) with ?v=${v}`);
}
