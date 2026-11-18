// Seals the transcript rows that are only shown to someone who solves the
// exam question for that course.
//
//   node tools/seal-grades.js /path/outside/the/repo/sealed-grades.json
//
// The input (never committed: it holds the grades AND the answers) maps a
// course code to its grade and to the answer of each question variant, in
// the order the variants appear in dusk/content/transcript.json:
//   { "MATH_V 302": { "grade": { "pct": 25, "letter": "F", "rec": "0.0" },
//                     "answers": ["0.3333", "3.0000", "0.0375"] } }
// Answers are written the way the page normalises a typed answer: the
// value rounded to 4 decimal places.
//
// Each variant's grade is encrypted with AES-256-GCM under a key derived
// (PBKDF2-SHA256) from that variant's answer. Only the ciphertext goes into
// the repo, so the page can show the grade only to someone with the answer.
// It is a joke lock, not a vault: the answers are short numbers, so someone
// patient could brute-force them offline. Don't seal anything you'd mind
// being read.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, '..', 'dusk', 'content', 'transcript.json');
const ITER = 150000;

function seal(answer, payload) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(answer, salt, ITER, 32, 'sha256');
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(payload), 'utf8'), c.final(), c.getAuthTag()]);
  return { salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64'), iter: ITER };
}

if (require.main === module) {
  const src = process.argv[2];
  if (!src) { console.error('usage: node tools/seal-grades.js <sealed-grades.json, kept outside the repo>'); process.exit(1); }
  const grades = JSON.parse(fs.readFileSync(src, 'utf8'));
  const t = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  let n = 0;
  for (const s of t.sessions) for (const r of s.rows) {
    if (!r.exam) continue;
    const g = grades[r.code];
    if (!g || !g.grade || !g.answers || g.answers.length !== r.exam.variants.length) throw new Error('no grade or answers for ' + r.code);
    r.exam.variants.forEach((v, i) => { Object.assign(v, seal(g.answers[i], g.grade)); n++; });
  }
  fs.writeFileSync(FILE, JSON.stringify(t, null, 2) + '\n');
  console.log(`sealed ${n} variant(s) in ${path.relative(process.cwd(), FILE)}`);
}

module.exports = { seal };
