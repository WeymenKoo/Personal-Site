// Original diagrams for the portfolio, drawn as SVG from the facts in
// content.js. Written to dusk/portfolio/fig/. The web deck inlines them
// (so they use the page's fonts); the .pptx gets a 2× PNG of each.
const fs = require('fs');
const path = require('path');
const T = require('./tokens');

const SANS = "'Space Grotesk', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- primitives ---------- */
function svg(w, h, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${w + 8} ${h + 8}" width="${w + 8}" height="${h + 8}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
  <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="${T.ink}"/></marker>
  <marker id="arb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="${T.signal}"/></marker>
</defs>
${body}
</svg>\n`;
}
function text(x, y, s, o = {}) {
  const { size = 20, mono = false, weight = mono ? 500 : 500, fill = T.ink, anchor = 'start', ls = mono ? 0.6 : 0 } = o;
  return `<text x="${x}" y="${y}" font-family="${mono ? MONO : SANS}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ''}>${esc(s)}</text>`;
}
// a block: title in sans, up to 3 sub-lines in mono
function box(x, y, w, h, title, subs = [], o = {}) {
  const { fill = T.white, stroke = T.ink, dash = false, tsize = 24, accent = false, center = true } = o;
  const st = accent ? T.signal : stroke;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${st}" stroke-width="${accent ? 3 : 2}"${dash ? ' stroke-dasharray="7 6"' : ''}/>`;
  const lines = subs.length;
  const cx = center ? x + w / 2 : x + 18;
  const anchor = center ? 'middle' : 'start';
  const block = tsize + lines * 24;
  let ty = y + h / 2 - block / 2 + tsize * 0.82;
  s += text(cx, ty, title, { size: tsize, weight: 600, anchor, fill: dash ? T.ink2 : T.ink });
  subs.forEach((l, i) => { s += text(cx, ty + 30 + i * 24, l, { size: 16, mono: true, weight: 400, anchor, fill: T.ink2 }); });
  return s;
}
function line(pts, o = {}) {
  const { color = T.ink, width = 2, arrow = 'end', dash = false } = o;
  const m = color === T.signal ? 'arb' : 'ar';
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${dash ? ' stroke-dasharray="7 6"' : ''}${arrow === 'end' || arrow === 'both' ? ` marker-end="url(#${m})"` : ''}${arrow === 'both' ? ` marker-start="url(#${m})"` : ''}/>`;
}
function tag(x, y, s, o = {}) { // small mono label on a paper chip, for wire labels
  const { anchor = 'middle', fill = T.ink2, size = 15 } = o;
  const w = s.length * size * 0.62 + 14;
  const rx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return `<rect x="${rx}" y="${y - size - 3}" width="${w}" height="${size + 10}" fill="${T.paper}"/>` + text(anchor === 'middle' ? x : anchor === 'end' ? x - 7 : x + 7, y, s, { size, mono: true, weight: 400, fill, anchor });
}

/* ---------- A1: FOC system + current loop ---------- */
function focSystem() {
  const W = 1200, H = 820;
  let b = '';
  // row 1: hardware
  b += text(0, 26, 'HARDWARE', { size: 16, mono: true, fill: T.signal, ls: 1.5 });
  b += box(0, 70, 190, 120, 'Host GUI', ['setpoints', 'telemetry']);
  b += box(300, 50, 300, 300, 'STM32G431', ['Cortex-M4 · 170 MHz', 'TIM1 · 3× ADC', 'FOC ISR'], { accent: true, tsize: 28 });
  b += box(700, 50, 220, 160, 'DRV8323S', ['gate drive', '3× current amp', 'SPI config']);
  b += box(990, 50, 210, 160, 'Bridge', ['6× ISC030N10NM6', '100 V FETs', '3 mΩ shunts']);
  b += `<circle cx="1100" cy="355" r="62" fill="${T.white}" stroke="${T.ink}" stroke-width="2"/>` + text(1100, 352, 'Motor', { size: 22, weight: 600, anchor: 'middle' }) + text(1100, 376, '3-phase', { size: 15, mono: true, weight: 400, anchor: 'middle', fill: T.ink2 });
  b += box(700, 300, 220, 110, 'AS5047P', ['14-bit angle']);
  // bus
  b += line([[1100, 0], [1100, 50]], {}) + tag(1100, 22, 'DC BUS 36–56 V', { anchor: 'end' });
  // links host <-> mcu
  b += line([[190, 105], [300, 105]], { arrow: 'both' }) + tag(245, 92, 'UART', { size: 14 });
  b += line([[190, 160], [300, 160]], { arrow: 'both' }) + tag(245, 147, 'CAN FD', { size: 14 });
  // mcu -> drv (PWM), drv -> bridge (gates)
  b += line([[600, 95], [700, 95]], { color: T.signal, width: 3 }) + tag(650, 82, '6× PWM', { size: 14, fill: T.signal });
  b += line([[920, 95], [990, 95]]) + tag(955, 82, 'gates', { size: 14 });
  // shunts back
  b += line([[990, 170], [920, 170]]) + tag(955, 196, 'shunts', { size: 14 });
  b += line([[700, 170], [600, 170]]) + tag(650, 196, 'I A·B·C', { size: 14 });
  // bridge -> motor
  b += line([[1100, 210], [1100, 290]]) + tag(1100, 258, 'A B C', { size: 14, anchor: 'start' });
  // encoder
  b += line([[1038, 355], [920, 355]], { arrow: 'none' });
  b += line([[700, 355], [650, 355], [650, 300], [600, 300]]);
  b += tag(675, 342, 'SPI', { size: 14 });
  // NTC / estop
  b += box(300, 400, 300, 60, 'NTC · E-stop · motor temp', [], { tsize: 17, dash: true });
  b += line([[450, 400], [450, 350]]);

  // row 2: current loop
  const y = 560, h = 120;
  b += text(0, 528, 'CURRENT LOOP · EVERY 40 µs', { size: 16, mono: true, fill: T.signal, ls: 1.5 });
  const steps = [['Clarke', 'Park'], ['PI', 'd and q'], ['Inverse', 'Park'], ['SVPWM', ''], ['TIM1', '25 kHz']];
  const bw = 168, gap = 46, x0 = 140;
  b += text(0, y + 54, 'i A·B·C', { size: 18, mono: true });
  b += text(0, y + 78, 'from ADC', { size: 14, mono: true, weight: 400, fill: T.ink2 });
  b += line([[100, y + 60], [x0, y + 60]]);
  steps.forEach((s, i) => {
    const x = x0 + i * (bw + gap);
    b += box(x, y, bw, h, s[0], s[1] ? [s[1]] : [], { accent: i === 1 });
    if (i < steps.length - 1) b += line([[x + bw, y + 60], [x + bw + gap, y + 60]]);
  });
  const xe = x0 + 4 * (bw + gap) + bw;
  // setpoint into PI
  const xpi = x0 + (bw + gap) + bw / 2;
  b += line([[xpi, y - 34], [xpi, y]]) + tag(xpi, y - 40, 'i q* from host', { size: 14 });
  // theta into park and inverse park
  const xpk = x0 + bw / 2, xip = x0 + 2 * (bw + gap) + bw / 2;
  b += line([[xpk, y + h + 50], [xip, y + h + 50]], { arrow: 'none' });
  b += line([[xpk, y + h + 50], [xpk, y + h]]) + line([[xip, y + h + 50], [xip, y + h]]);
  b += tag((xpk + xip) / 2, y + h + 56, 'θ from AS5047P', { size: 14 });
  return svg(W, H, b, 'FOC controller: system block diagram and current loop');
}

/* ---------- A3: FOC 6-layer stackup ---------- */
function focStackup() {
  const W = 900, H = 760;
  const layers = [
    ['L1', 'Signal + power · components', false],
    ['L2', 'GND, solid', true],
    ['L3', 'Signal + power', false],
    ['L4', 'GND, solid', true],
    ['L5', 'GND, solid', true],
    ['L6', 'Bus copper + signal', false],
  ];
  let b = '';
  const x = 40, w = 420, top = 150, pitch = 100, th = 22;
  // dielectric slab
  b += `<rect x="${x}" y="${top - 6}" width="${w}" height="${pitch * 5 + th + 12}" fill="${T.rule}" opacity=".45"/>`;
  layers.forEach(([n, d, gnd], i) => {
    const y = top + i * pitch;
    b += `<rect x="${x}" y="${y}" width="${w}" height="${th}" fill="${gnd ? T.signal : T.white}" stroke="${gnd ? T.signal : T.ink}" stroke-width="2"/>`;
    b += text(x + w + 40, y + th - 2, n, { size: 22, mono: true, weight: 600, fill: gnd ? T.signal : T.ink });
    b += text(x + w + 100, y + th - 2, d, { size: 20, weight: gnd ? 600 : 500, fill: gnd ? T.signal : T.ink });
  });
  // via in pad through all layers
  const vx = x + 120;
  b += `<rect x="${vx - 9}" y="${top - 30}" width="18" height="${pitch * 5 + th + 30}" fill="${T.white}" stroke="${T.ink}" stroke-width="2"/>`;
  b += `<rect x="${vx - 40}" y="${top - 40}" width="80" height="14" fill="${T.ink}"/>`;
  b += line([[vx + 70, top - 100], [vx + 10, top - 46]], { color: T.signal });
  b += text(vx + 78, top - 104, 'via-in-pad under the high-side drain', { size: 16, mono: true, weight: 400, fill: T.signal });
  b += text(x, H - 20, '6 layers · JLCPCB · thicknesses not to scale', { size: 15, mono: true, weight: 400, fill: T.ink2 });
  return svg(W, H, b, 'Six-layer stackup of the FOC motor controller');
}

/* ---------- B5: 2025 power path ---------- */
function pb25Power() {
  const W = 1200, H = 420;
  let b = '';
  const y = 60, h = 140;
  b += box(0, y, 170, h, 'Battery', ['7–25 V', '4S max']);
  b += box(250, y, 200, h, 'TPS25983', ['e-fuse', 'UV · OV · ILIM'], { accent: true });
  b += box(530, y, 220, h, 'LM5146', ['sync buck ctrl', '3.3 µH']);
  b += box(830, y, 200, h, 'TPS25983', ['e-fuse', 'output side'], { accent: true });
  b += text(1060, y + 64, '5 V', { size: 28, weight: 600 }) + text(1060, y + 92, '15 A', { size: 18, mono: true, fill: T.ink2 });
  b += line([[170, y + 70], [250, y + 70]]) + line([[450, y + 70], [530, y + 70]]) + line([[750, y + 70], [830, y + 70]]) + line([[1030, y + 70], [1052, y + 70]]);
  b += box(680, 290, 220, 100, 'V and I sense', [], { tsize: 20 });
  b += line([[790, y + 70], [790, 290]], { arrow: 'none', dash: true });
  b += line([[900, 340], [1000, 340]]) + text(1010, 346, 'telemetry to FC', { size: 17, mono: true, weight: 400 });
  b += text(0, H - 8, 'Loads: servos · camera · airspeed · GNSS · radios · flight controller', { size: 15, mono: true, weight: 400, fill: T.ink2 });
  return svg(W, H, b, 'Power path of the 2025 board');
}

/* ---------- B6: buck input hot loop (original drawing) ---------- */
function hotLoop() {
  const W = 900, H = 760;
  let b = '';
  const xl = 200, xq = 470, xr = 780, yt = 110, ysw = 360, yb = 610;
  // the loop: shaded area, then the loop's own wires drawn thick in blue
  b += `<rect x="${xl}" y="${yt}" width="${xq - xl}" height="${yb - yt}" fill="${T.trace}" fill-opacity=".13"/>`;
  b += `<path d="M${xl} 330 L${xl} ${yt} L${xq} ${yt} L${xq} ${yb} L${xl} ${yb} L${xl} 390" fill="none" stroke="${T.signal}" stroke-width="7" stroke-linejoin="round" opacity=".55"/>`;
  // rails
  b += line([[60, yt], [xq, yt]], { arrow: 'none' }) + text(60, yt - 18, 'VIN', { size: 20, mono: true, weight: 600 });
  b += line([[60, yb], [xr, yb]], { arrow: 'none' }) + text(60, yb + 40, 'GND · L2 plane directly underneath', { size: 18, mono: true, weight: 400 });
  // Cin
  b += line([[xl, yt], [xl, 330]], { arrow: 'none' }) + line([[xl, 390], [xl, yb]], { arrow: 'none' });
  b += `<line x1="${xl - 40}" y1="330" x2="${xl + 40}" y2="330" stroke="${T.ink}" stroke-width="4"/><line x1="${xl - 40}" y1="390" x2="${xl + 40}" y2="390" stroke="${T.ink}" stroke-width="4"/>`;
  b += text(xl - 56, 360, 'C IN', { size: 18, mono: true, anchor: 'end' }) + text(xl - 56, 384, 'ceramic', { size: 14, mono: true, weight: 400, anchor: 'end', fill: T.ink2 });
  // FETs
  b += line([[xq, yt], [xq, 170]], { arrow: 'none' });
  b += box(xq - 55, 170, 110, 120, 'HS', ['FET'], { tsize: 22 });
  b += line([[xq, 290], [xq, 430]], { arrow: 'none' });
  b += box(xq - 55, 430, 110, 120, 'LS', ['FET'], { tsize: 22 });
  b += line([[xq, 550], [xq, yb]], { arrow: 'none' });
  // switch node, inductor, output cap
  b += `<circle cx="${xq}" cy="${ysw}" r="6" fill="${T.ink}"/>` + text(xq + 14, ysw - 12, 'SW', { size: 18, mono: true, weight: 600 });
  b += line([[xq, ysw], [580, ysw]], { arrow: 'none' });
  let coil = `M580 ${ysw}`;
  for (let i = 0; i < 4; i++) coil += ' a 20 20 0 0 1 40 0';
  b += `<path d="${coil}" fill="none" stroke="${T.ink}" stroke-width="2"/>`;
  b += line([[740, ysw], [xr, ysw], [xr, 470]], { arrow: 'none' }) + line([[xr, 510], [xr, yb]], { arrow: 'none' });
  b += `<line x1="${xr - 35}" y1="470" x2="${xr + 35}" y2="470" stroke="${T.ink}" stroke-width="4"/><line x1="${xr - 35}" y1="510" x2="${xr + 35}" y2="510" stroke="${T.ink}" stroke-width="4"/>`;
  b += text(660, ysw - 36, 'L · 3.3 µH', { size: 18, mono: true, anchor: 'middle' }) + text(xr + 12, ysw - 12, '5 V', { size: 18, mono: true, weight: 600 });
  b += text(xr + 48, 496, 'C OUT', { size: 16, mono: true });
  // label
  b += text(xl + 18, 200, 'HOT LOOP', { size: 20, mono: true, weight: 700, fill: T.signal });
  b += text(xl + 18, 226, 'highest di/dt', { size: 14, mono: true, weight: 400, fill: T.signal });
  b += text(xl + 18, 470, 'C IN → HS → LS', { size: 14, mono: true, weight: 400, fill: T.signal });
  b += text(xl + 18, 492, '→ GND → C IN', { size: 14, mono: true, weight: 400, fill: T.signal });
  b += text(xl + 18, 514, 'keep it small', { size: 14, mono: true, weight: 400, fill: T.signal });
  b += text(60, H - 16, 'Original drawing, after TI SNVA803', { size: 14, mono: true, weight: 400, fill: T.ink2 });
  return svg(W, H, b, 'Input hot loop of a synchronous buck converter');
}

/* ---------- C1: module <-> carrier ---------- */
function somInterface() {
  const W = 1200, H = 760;
  let b = '';
  // carrier
  b += `<rect x="0" y="40" width="1200" height="680" rx="10" fill="${T.paper}" stroke="${T.ink2}" stroke-width="2" stroke-dasharray="9 7"/>`;
  b += text(28, 84, 'CARRIER · airframe-specific', { size: 17, mono: true, fill: T.ink2, ls: 1.2 });
  // module 36x55 scaled 7 px/mm -> 252 x 385, rotated landscape 385 x 252
  const mx = 410, my = 230, mw = 385, mh = 252;
  b += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="8" fill="${T.white}" stroke="${T.signal}" stroke-width="3"/>`;
  b += text(mx + mw / 2, my + 100, 'SoM', { size: 34, weight: 700, anchor: 'middle' });
  b += text(mx + mw / 2, my + 134, '36 × 55 mm · 6 layers', { size: 16, mono: true, weight: 400, anchor: 'middle', fill: T.ink2 });
  b += text(mx + mw / 2, my + 160, 'STM32H757 · sensors · storage · power', { size: 14, mono: true, weight: 400, anchor: 'middle', fill: T.ink2 });
  // J1 / J2 strips
  b += `<rect x="${mx + 30}" y="${my + 14}" width="${mw - 60}" height="26" fill="${T.ink}"/>` + text(mx + mw / 2, my + 33, 'J1', { size: 16, mono: true, fill: T.white, anchor: 'middle' });
  b += `<rect x="${mx + 30}" y="${my + mh - 40}" width="${mw - 60}" height="26" fill="${T.ink}"/>` + text(mx + mw / 2, my + mh - 21, 'J2', { size: 16, mono: true, fill: T.white, anchor: 'middle' });
  // groups
  const left = [['Flight I/O', ['PWM ×12 · UART ×6', 'I²C · ADC · SBUS']], ['Safety', ['buzzer · BOOT0']]];
  const right = [['CAN1 · flight', ['TCAN3413']], ['Payload I/O', ['CAN2 · SPI6 · I²C · GPIO']]];
  left.forEach((g, i) => { const y = 150 + i * 300; b += box(40, y, 290, 120, g[0], g[1], { tsize: 22 }); b += line([[330, y + 60], [mx, y < 300 ? my + 27 : my + mh - 27]], { arrow: 'both' }); });
  right.forEach((g, i) => { const y = 150 + i * 300; b += box(870, y, 290, 120, g[0], g[1], { tsize: 22 }); b += line([[870, y + 60], [mx + mw, y < 300 ? my + 27 : my + mh - 27]], { arrow: 'both' }); });
  b += box(475, 580, 255, 100, 'Power in', ['carrier 5 V · USB 5 V'], { tsize: 22 });
  b += line([[602, 580], [602, my + mh]], { color: T.ink });
  return svg(W, H, b, 'Flight controller module and its carrier interface');
}

/* ---------- C2: SoM architecture ---------- */
function somArch() {
  const W = 1200, H = 790;
  let b = '';
  const grey = { dash: true, fill: T.paper };
  b += box(420, 100, 360, 340, 'STM32H757', ['Cortex-M7 · 400 MHz', 'TFBGA240', 'runs ArduPilot'], { accent: true, tsize: 32 });
  b += text(0, 70, 'SENSING', { size: 16, mono: true, fill: T.signal, ls: 1.5 });
  b += box(0, 100, 300, 100, 'IMU 1 + baro 1', ['LSM6DSV32X · DPS368']);
  b += box(0, 220, 300, 100, 'IMU 2 + baro 2', ['ICM-42688-P · MS5611'], grey);
  b += box(0, 340, 300, 100, 'Magnetometer', ['LIS2MDL']);
  b += line([[300, 150], [420, 150]]) + tag(360, 137, 'SPI1', { size: 14 });
  b += line([[300, 270], [420, 270]], { dash: true }) + tag(360, 257, 'SPI2', { size: 14 });
  b += line([[300, 390], [420, 390]]) + tag(360, 377, 'I²C', { size: 14 });
  b += text(900, 70, 'STORAGE', { size: 16, mono: true, fill: T.signal, ls: 1.5 });
  b += box(900, 100, 300, 100, 'FRAM · parameters', ['FM25V02A']);
  b += box(900, 220, 300, 100, 'microSD · logs', ['4-bit SDMMC']);
  b += box(900, 340, 300, 100, 'Board ID', ['M24C64 EEPROM']);
  b += line([[900, 150], [780, 150]]) + tag(840, 137, 'SPI3', { size: 14 });
  b += line([[900, 270], [780, 270]]) + tag(840, 257, 'SDMMC', { size: 14 });
  b += line([[900, 390], [780, 390]]) + tag(840, 377, 'I²C', { size: 14 });
  const by = 560, bh = 100;
  b += box(0, by, 250, bh, 'CAN1 · flight', ['TCAN3413']);
  b += box(290, by, 250, bh, 'CAN2 · payload', ['TCAN3413']);
  b += box(660, by, 250, bh, 'USB-C', ['USB switch']);
  b += box(950, by, 250, bh, 'Power', ['mux · e-fuse', 'buck · LDO']);
  b += line([[125, by], [125, 500], [470, 500], [470, 440]]);
  b += line([[415, by], [415, 520], [540, 520], [540, 440]]);
  b += line([[785, by], [785, 520], [660, 520], [660, 440]]);
  b += line([[1075, by], [1075, 500], [730, 500], [730, 440]]) + tag(1000, 494, '3.3 V', { size: 14 });
  b += `<rect x="0" y="740" width="1200" height="44" rx="4" fill="${T.ink}"/>` + text(600, 769, 'J1 + J2 · board-to-board to the carrier', { size: 17, mono: true, fill: T.white, anchor: 'middle' });
  [125, 415, 785, 1075].forEach(x => { b += line([[x, by + bh], [x, 740]], { arrow: 'both' }); });
  return svg(W, H, b, 'Flight controller module architecture');
}

/* ---------- C3: SoM power tree ---------- */
function somPower() {
  const W = 1200, H = 520;
  let b = '';
  b += box(0, 60, 200, 100, 'Carrier 5 V', [], { tsize: 22 });
  b += box(0, 250, 200, 100, 'USB-C 5 V', [], { tsize: 22 });
  b += box(280, 140, 210, 130, 'Priority mux', ['carrier wins'], { accent: true });
  b += box(570, 140, 190, 130, 'e-fuse', ['protection']);
  b += box(856, 30, 340, 120, 'Buck → 3.3 V', ['MCU · storage · CAN · USB']);
  b += box(856, 260, 340, 120, 'LDO → 3.3 V', ['IMU · baro · mag']);
  b += line([[200, 110], [240, 110], [240, 180], [280, 180]]);
  b += line([[200, 300], [240, 300], [240, 230], [280, 230]]);
  b += line([[490, 205], [570, 205]]);
  b += line([[760, 205], [810, 205], [810, 90], [856, 90]]);
  b += line([[810, 205], [810, 320], [856, 320]]);
  b += text(0, 480, 'Separate sensor rail: digital switching noise stays off the IMU supply', { size: 16, mono: true, weight: 400, fill: T.ink2 });
  return svg(W, H, b, 'Power tree of the flight controller module');
}

const FIGS = {
  'foc-system.svg': focSystem,
  'foc-stackup.svg': focStackup,
  'pb25-power.svg': pb25Power,
  'hot-loop.svg': hotLoop,
  'som-interface.svg': somInterface,
  'som-arch.svg': somArch,
  'som-power.svg': somPower,
};

function writeFigures(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, fn] of Object.entries(FIGS)) fs.writeFileSync(path.join(outDir, name), fn());
  return Object.keys(FIGS);
}

module.exports = { writeFigures, FIGS };
if (require.main === module) console.log(writeFigures(path.join(__dirname, '../../dusk/portfolio/fig')));
