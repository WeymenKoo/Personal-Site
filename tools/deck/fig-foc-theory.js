// Original figure: how field-oriented control works. Black/gray, orange for the torque axis.
const fs = require('fs');
const sharp = require('sharp');
const INK = '#111111', GRAY = '#7A7A7A', LIGHT = '#CFCFCF', ACC = '#E4561B', F = "Arial, Helvetica, sans-serif";
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-family="${F}" font-size="${o.size || 15}" fill="${o.fill || INK}" text-anchor="${o.a || 'start'}" font-weight="${o.w || 400}">${esc(s)}</text>`;
const box = (x, y, w, h, title, sub, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.2}"/>` +
  t(x + w / 2, y + h / 2 + (sub ? -4 : 5), title, { a: 'middle', size: 15, w: 600 }) + (sub ? t(x + w / 2, y + h / 2 + 14, sub, { a: 'middle', size: 11, fill: GRAY }) : '');
const ar = (x1, y1, x2, y2, o = {}) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${o.c || INK}" stroke-width="${o.sw || 1.2}" fill="none" marker-end="url(#a${o.c === ACC ? 'o' : ''})"/>`;
const ln = (pts, o = {}) => `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ')}" stroke="${o.c || INK}" stroke-width="${o.sw || 1.2}" fill="none"${o.arrow ? ` marker-end="url(#a${o.c === ACC ? 'o' : ''})"` : ''}${o.dash ? ' stroke-dasharray="4 4"' : ''}/>`;

let b = '';
// --- top: hardware. bus → three half bridges → motor
b += t(0, 18, 'POWER STAGE', { size: 11, fill: GRAY });
const bx = 60, by = 40;
b += ln([[bx, by + 10], [bx + 300, by + 10]]); b += t(bx - 8, by + 14, '+', { a: 'end', size: 14 }); b += t(bx - 8, by + 160, '0', { a: 'end', size: 14 });
b += ln([[bx, by + 156], [bx + 300, by + 156]]);
['A', 'B', 'C'].forEach((ph, i) => {
  const x = bx + 50 + i * 100;
  b += ln([[x, by + 10], [x, by + 35]]); b += `<rect x="${x - 12}" y="${by + 35}" width="24" height="30" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
  b += ln([[x, by + 65], [x, by + 100]]); b += `<rect x="${x - 12}" y="${by + 100}" width="24" height="30" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
  b += ln([[x, by + 130], [x, by + 140]]);
  // shunt
  b += `<rect x="${x - 6}" y="${by + 140}" width="12" height="10" fill="#fff" stroke="${INK}" stroke-width="1"/>`; b += ln([[x, by + 150], [x, by + 156]]);
  // phase out to motor
  b += `<circle cx="${x}" cy="${by + 83}" r="2.5" fill="${INK}"/>`;
  b += t(x + 16, by + 79, ph, { size: 12, fill: GRAY });
  b += t(x + 8, by + 153, 'i' + ph.toLowerCase(), { size: 11, fill: ACC });
});
// motor
b += `<circle cx="${bx + 395}" cy="${by + 83}" r="34" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
b += t(bx + 395, by + 80, 'PMSM', { a: 'middle', size: 13, w: 600 }); b += t(bx + 395, by + 96, '14 pole pairs', { a: 'middle', size: 10, fill: GRAY });
[0, 1, 2].forEach(i => { const x = bx + 50 + i * 100; b += ln([[x, by + 83], [bx + 330, by + 60 + i * 23]], { c: LIGHT }); b += ln([[bx + 330, by + 60 + i * 23], [bx + 362, by + 70 + i * 10]], { c: LIGHT }); });
b += t(bx + 395, by + 135, 'θ from an absolute encoder', { a: 'middle', size: 11, fill: GRAY });
b += t(bx + 395, by + 150, 'on the rotor axis', { a: 'middle', size: 11, fill: GRAY });
b += t(0, by + 183, 'Six gates, 25 kHz · dead time 200 ns · three low-side shunts sampled at the PWM centre, when all low sides conduct', { size: 11, fill: GRAY });

// --- right: dq frame
const cx = 760, cy = 120;
b += t(620, 18, 'ROTOR FRAME', { size: 11, fill: GRAY });
b += `<circle cx="${cx}" cy="${cy}" r="60" fill="none" stroke="${LIGHT}" stroke-width="1"/>`;
b += ar(cx, cy, cx + 85, cy - 40); b += t(cx + 90, cy - 42, 'd  (magnet axis, i_d = 0)', { size: 12 });
b += ar(cx, cy, cx + 40, cy - 85, { c: ACC }); b += t(cx + 44, cy - 92, 'q  (torque: T = Kt · i_q)', { size: 12, fill: ACC, w: 600 });
b += ar(cx, cy, cx + 95, cy, { c: GRAY }); b += t(cx + 98, cy + 14, 'stator α', { size: 11, fill: GRAY });
b += `<path d="M${cx + 40} ${cy} A40 40 0 0 0 ${cx + 36} ${cy - 17}" fill="none" stroke="${GRAY}" stroke-width="1"/>`; b += t(cx + 46, cy - 14, 'θ', { size: 12, fill: GRAY });
b += t(620, 215, 'In the rotor frame the currents are DC, so two PI loops do the work.', { size: 11, fill: GRAY });
b += t(620, 231, 'That is the whole trick; six-step gives ~13 % torque ripple and no angle control.', { size: 11, fill: GRAY });

// --- bottom: control loop
const y0 = 290, h = 56, w = 118, g = 34, x0 = 130;
b += t(0, y0 - 20, 'CONTROL LOOP · EVERY 40 µs', { size: 11, fill: GRAY });
const steps = [['Clarke', '3 → 2 phases'], ['Park', 'with θ'], ['PI × 2', 'i_d → 0, i_q → T*'], ['Inverse Park', 'with θ'], ['SVPWM', '+15 % bus use'], ['Gates', 'TIM1 · DRV8323']];
steps.forEach((s, i) => {
  const x = x0 + i * (w + g); b += box(x, y0, w, h, s[0], s[1], { stroke: i === 2 ? ACC : INK, sw: i === 2 ? 1.6 : 1.2 });
  if (i < steps.length - 1) b += ar(x + w, y0 + h / 2, x + w + g, y0 + h / 2);
});
b += ar(20, y0 + h / 2, x0, y0 + h / 2, { c: ACC }); b += t(20, y0 + h / 2 - 8, 'ia ib ic', { size: 11, fill: ACC });
const xe = x0 + 5 * (w + g) + w;
b += ln([[xe, y0 + h / 2], [xe + 24, y0 + h / 2], [xe + 24, y0 - 46], [bx + 160, y0 - 46], [bx + 160, by + 175]], { c: LIGHT, dash: true, arrow: false });
b += t(bx + 166, y0 - 52, 'gate signals back to the bridge', { size: 10, fill: GRAY });
// theta feed
const xp = x0 + 1 * (w + g) + w / 2, xi = x0 + 3 * (w + g) + w / 2;
b += ln([[xp, y0 + h + 40], [xi, y0 + h + 40]], { c: GRAY }); b += ar(xp, y0 + h + 40, xp, y0 + h, { c: GRAY }); b += ar(xi, y0 + h + 40, xi, y0 + h, { c: GRAY });
b += t((xp + xi) / 2, y0 + h + 56, 'θ, encoder · 14-bit', { a: 'middle', size: 11, fill: GRAY });
// setpoint
const xpi = x0 + 2 * (w + g) + w / 2;
b += ar(xpi, y0 - 30, xpi, y0, { c: ACC }); b += t(xpi + 6, y0 - 22, 'i_q* from the host', { size: 11, fill: ACC });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 1080 430" width="1080" height="430">
<defs>
<marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="${INK}"/></marker>
<marker id="ao" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="${ACC}"/></marker>
</defs>
<rect x="-10" y="-10" width="1080" height="430" fill="#fff"/>
${b}</svg>`;
fs.writeFileSync(__dirname + '/img/foc-theory.svg', svg);
sharp(Buffer.from(svg), { density: 250 }).png().toFile(__dirname + '/img/foc-theory.png').then(() => console.log('ok'));
