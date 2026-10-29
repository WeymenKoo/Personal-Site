// Hardware portfolio deck — minimal.
// One typeface, two weights, black on white, one accent. Nothing decorative.
// Run: node build.js  →  WeymenKoo_HardwarePortfolio_2026.pptx
const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const FONT = 'Arial';          // swap for 'Helvetica Neue' if you prefer; keep one face
const INK = '111111', GRAY = '7A7A7A', LIGHT = 'D8D8D8', PAPER = 'FFFFFF', DARK = '141414', ACCENT = 'E4561B';
const PH_FILL = 'F1F1EF';      // placeholder tint, warm paper

const W = 13.333, H = 7.5, M = 0.6;     // slide, margin (in)
const CW = W - 2 * M;

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE';
pres.author = 'Weymen Koo';
pres.title = 'Weymen Koo — Hardware design portfolio 2026';
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

pres.defineSlideMaster({ title: 'light', background: { color: PAPER }, objects: [
  { text: { text: 'Weymen Koo · Hardware portfolio · 2026', options: { x: M, y: H - 0.55, w: 6, h: 0.25, fontFace: FONT, fontSize: 9, color: GRAY, margin: 0 } } },
  { placeholder: { options: { name: 'title', type: 'title', x: M, y: 0.55, w: CW, h: 0.7, fontFace: FONT, fontSize: 24, color: INK, margin: 0, valign: 'top', align: 'left' }, text: '' } },
]});
pres.defineSlideMaster({ title: 'dark', background: { color: DARK }, objects: [] });

let page = 0;
function slide(master = 'light', section) {
  if (section) pres.addSection({ title: section });
  const s = pres.addSlide({ masterName: master, ...(section || lastSection ? { sectionTitle: section || lastSection } : {}) });
  if (section) lastSection = section;
  page++;
  if (master === 'light') s.addText(String(page).padStart(2, '0'), { x: W - M - 1, y: H - 0.55, w: 1, h: 0.25, fontFace: FONT, fontSize: 9, color: GRAY, align: 'right', margin: 0 });
  return s;
}
let lastSection = null;

const T = (s, txt, o) => s.addText(txt, { fontFace: FONT, color: INK, margin: 0, valign: 'top', isTextBox: true, ...o });
const title = (s, t) => s.addText(t, { placeholder: 'title' });
const body = (s, txt, x, y, w, h, o = {}) => T(s, txt, { x, y, w, h, fontSize: 12, lineSpacing: 18, ...o });
const cap = (s, txt, x, y, w, o = {}) => T(s, txt, { x, y, w, h: 0.3, fontSize: 9, color: GRAY, ...o });

// photo placeholder: tint + what to shoot
function ph(s, x, y, w, h, what) {
  s.addShape('rect', { x, y, w, h, fill: { color: PH_FILL }, line: { type: 'none' } });
  T(s, [{ text: 'Photo to add', options: { color: GRAY, fontSize: 9, breakLine: true } }, { text: what, options: { color: GRAY, fontSize: 11 } }],
    { x: x + 0.25, y: y + 0.25, w: w - 0.5, h: h - 0.5, lineSpacing: 16 });
}
function img(s, file, x, y, w, h, fit = 'contain') {
  const p = path.join(__dirname, 'img', file);
  const meta = sizes[file];
  if (fit === 'cover') return s.addImage({ path: p, x, y, w, h, sizing: { type: 'cover', w, h } });
  const k = Math.min(w / meta.w, h / meta.h), dw = meta.w * k, dh = meta.h * k;
  s.addImage({ path: p, x: x + (w - dw) / 2, y, w: dw, h: dh });
  return { x: x + (w - dw) / 2, y, w: dw, h: dh };
}
// spec rows: gray label, black value, hairline between
function specs(s, x, y, w, rows, o = {}) {
  const lw = o.lw || 1.3, fs = o.fs || 11;
  const cpl = Math.floor((w - lw) / (fs / 72 * 0.52));   // chars per line, Arial average
  let yy = y;
  rows.forEach(([k, v], i) => {
    const lines = Math.max(1, Math.ceil(String(v).length / cpl));
    const rh = 0.17 + lines * 0.19;
    s.addShape('line', { x, y: yy, w, h: 0, line: { color: LIGHT, width: 0.5 } });
    T(s, k, { x, y: yy + 0.08, w: lw, h: 0.25, fontSize: 9, color: GRAY });
    T(s, v, { x: x + lw, y: yy + 0.07, w: w - lw, h: rh - 0.07, fontSize: fs, lineSpacing: 14, color: o.accentLast && i === rows.length - 1 ? ACCENT : INK });
    yy += rh;
  });
  s.addShape('line', { x, y: yy, w, h: 0, line: { color: LIGHT, width: 0.5 } });
  return yy;
}
function table(s, x, y, w, head, rows, colW, o = {}) {
  const fs = o.fs || 10;
  const border = [{ type: 'none' }, { type: 'none' }, { pt: 0.5, color: LIGHT }, { type: 'none' }];
  const H = head.map(h => ({ text: h, options: { fontFace: FONT, fontSize: 9, color: GRAY, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: INK }, { type: 'none' }], valign: 'bottom' } }));
  const R = rows.map(r => r.map(c => ({ text: c, options: { fontFace: FONT, fontSize: fs, color: INK, border, valign: 'top' } })));
  s.addTable([H, ...R], { x, y, w, colW, margin: [6, 6, 6, 0], autoPage: false });
}
const sizes = {};
for (const f of fs.readdirSync(path.join(__dirname, 'img'))) {
  const m = require('child_process').execSync(`python3 -c "from PIL import Image;im=Image.open('img/${f}');print(im.size[0],im.size[1])"`, { cwd: __dirname }).toString().trim().split(' ');
  sizes[f] = { w: +m[0], h: +m[1] };
}
const todo = t => `[ ${t} ]`;

/* ============================================================ 01 cover */
{
  const s = slide('dark', 'Cover');
  T(s, 'Weymen Koo', { x: M, y: 2.5, w: 7, h: 0.9, fontSize: 44, color: 'F2F2F2' });
  T(s, '许梣焕', { x: M, y: 3.35, w: 7, h: 0.5, fontSize: 18, color: '8A8A8A', fontFace: 'PingFang SC' });
  T(s, 'Hardware design portfolio', { x: M, y: 4.1, w: 7, h: 0.4, fontSize: 18, color: 'F2F2F2' });
  T(s, 'Power electronics · board-level design · avionics', { x: M, y: 4.5, w: 7, h: 0.4, fontSize: 12, color: '8A8A8A' });
  T(s, '2026', { x: M, y: 5.3, w: 2, h: 0.4, fontSize: 12, color: ACCENT });
  T(s, 'kchweymen@gmail.com · github.com/WeymenKoo', { x: M, y: H - 0.95, w: 8, h: 0.3, fontSize: 9, color: '8A8A8A' });
  s.addShape('rect', { x: 7.6, y: M, w: W - 7.6 - M, h: H - 2 * M, fill: { color: '1E1E1E' }, line: { type: 'none' } });
  T(s, [{ text: 'Photo to add', options: { color: '8A8A8A', fontSize: 9, breakLine: true } },
        { text: 'FOC controller Rev 01 on matte black card, three-quarter angle, window light from the left, no other objects. The one dramatic photo in the deck.', options: { color: '8A8A8A', fontSize: 11 } }],
    { x: 7.85, y: M + 0.25, w: W - 7.6 - M - 0.5, h: 2, lineSpacing: 16 });
}

/* ============================================================ 02 summary */
{
  const s = slide('light', 'Two-minute read');
  title(s, 'I design power and mixed-signal boards, then bring them up on the bench.');
  body(s, 'Fourth-year Electrical Engineering at UBC Vancouver, graduating June 2027. Co-op terms in test and product design at Tesla and Dometic. Looking for a hardware design role in power electronics, board-level design, or aerospace and drones.', M, 1.6, 5.6, 1.6);
  specs(s, M, 3.5, 5.6, [
    ['Tools', 'KiCad · Altium · LTspice · STM32CubeIDE · Python'],
    ['Layout', '4 and 6 layer · power stages to 60 V, 15 A'],
    ['Bench', 'Scope, DMM, electronic load · bring-up and validation'],
    ['People', 'Led a 30-person avionics team · mentoring a junior designer'],
  ], { lw: 1.0 });
  const rx = 7.2, rw = W - M - rx;
  const projs = [
    ['FOC motor controller', 'Bring-up', '60 V, 10 A field-oriented drive. Rev 01 spins a motor; Rev B in review.', '03'],
    ['AeroDesign power system', 'Flown', 'Two seasons of 5 V, 15 A power for a competition aircraft, 5th overall.', '04'],
    ['Flight controller module', 'In design', 'STM32H757 ArduPilot module, 36 × 55 mm, with a second designer.', '05'],
  ];
  projs.forEach((p, i) => {
    const y = 1.6 + i * 1.25;
    s.addShape('line', { x: rx, y, w: rw, h: 0, line: { color: LIGHT, width: 0.5 } });
    T(s, p[0], { x: rx, y: y + 0.12, w: rw - 1, h: 0.3, fontSize: 14 });
    T(s, p[1], { x: rx + rw - 1.4, y: y + 0.15, w: 1.4, h: 0.3, fontSize: 9, color: GRAY, align: 'right' });
    T(s, p[2], { x: rx, y: y + 0.47, w: rw - 0.6, h: 0.6, fontSize: 11, color: INK, lineSpacing: 16 });
    T(s, 'p.' + p[3], { x: rx + rw - 0.6, y: y + 0.9, w: 0.6, h: 0.25, fontSize: 9, color: GRAY, align: 'right' });
  });
  s.addShape('line', { x: rx, y: 1.6 + 3 * 1.25, w: rw, h: 0, line: { color: LIGHT, width: 0.5 } });
  cap(s, 'Six more boards on p.06 · design detail from p.07', rx, 1.6 + 3 * 1.25 + 0.15, rw);
}

/* ============================================================ 03 FOC */
{
  const s = slide('light');
  title(s, 'FOC motor controller');
  const pw = 5.6;
  ph(s, M, 1.6, pw, pw * 0.75, 'Rev 01 top side, straight down on white paper, window light, fills the frame. 4:3.');
  cap(s, 'Rev 01 · 70 × 70 mm · 6 layers · KiCad', M, 1.6 + pw * 0.75 + 0.1, pw);
  const rx = M + pw + 0.6, rw = W - M - rx;
  body(s, 'A 60 V field-oriented controller for a quasi-direct-drive robot joint. Designed from the power stage out: the bridge was simulated before layout, the layout was reviewed from the fab package, and Rev 01 was brought up on the bench in September.', rx, 1.6, rw, 1.3);
  specs(s, rx, 3.1, rw, [
    ['My role', todo('solo, or who helped')],
    ['Bus', '36–56 V (12S) · 60 V absolute'],
    ['Phase', '10 A RMS continuous'],
    ['Sense', '3 mΩ shunts · ±27.5 A full scale'],
    ['Control', '25 kHz centre-aligned PWM · 200 ns dead time'],
    ['Silicon', 'STM32G431 · DRV8323S · 6 × ISC030N10NM6 · AS5047P'],
    ['Result', '2000 rpm open-loop on a T-Motor MN601-S at 12 V'],
  ], { accentLast: true });
}

/* ============================================================ 04 AeroDesign */
{
  const s = slide('light');
  title(s, 'AeroDesign power system, 2024 → 2025');
  const cw = (CW - 0.6) / 2;
  [[M, '2024 · Shadow · flown, 5th overall', 'Wiring hub with the Cube Orange seated, straight down on white paper. 4:3.',
    [['Buck', 'ISL8117A · 2S–4S → 5 V, 15 A'], ['Path', 'Two batteries, ideal-diode OR'], ['Board', '4-layer hub · 2-layer power modules'], ['Lesson', 'A shoot-through killed four servos']]],
   [M + cw + 0.6, '2025 · Rev 2 · ' + todo('flown?'), '2025 power board, top, straight down on white paper. 4:3.',
    [['Buck', 'LM5146 · 7–25 V → 5 V, 15 A'], ['Protect', 'TPS25983 e-fuse, input and output'], ['Board', '6 layers · V and I telemetry'], ['Fix', 'Locking connectors · pinouts on the silkscreen']]],
  ].forEach(([x, head, shot, rows]) => {
    T(s, head, { x, y: 1.5, w: cw, h: 0.3, fontSize: 11, color: GRAY });
    ph(s, x, 1.85, cw, cw * 0.5, shot);
    specs(s, x, 1.85 + cw * 0.5 + 0.25, cw, rows, { lw: 1.0 });
  });
  cap(s, 'My role · Power and controls lead 2023–24 · Avionics lead 2024–25, about 30 people · 2025 board designed with B. Liu ' + todo('who did what'), M, H - 1.0, CW);
}

/* ============================================================ 05 SoM */
{
  const s = slide('light');
  title(s, 'Flight controller module');
  const fw = 6.4;
  const r = img(s, 'som-arch.png', M, 1.6, fw, 4.4);
  cap(s, 'Architecture. Dashed: footprints fitted on a later build.', M, r.y + r.h + 0.1, fw);
  const rx = M + fw + 0.6, rw = W - M - rx;
  body(s, 'An STM32H757 autopilot module for ArduPilot that plugs into a carrier board, so a new airframe needs a new carrier, not a new autopilot. Everything flight-critical lives on the module: processor, IMU and barometer, magnetometer, FRAM, microSD, two CAN buses, power conditioning.', rx, 1.6, rw, 1.7);
  specs(s, rx, 3.5, rw, [
    ['My role', 'Lead designer · a junior designer owns power and primary sensors'],
    ['MCU', 'STM32H757XIH6 · TFBGA240'],
    ['Sensing', 'LSM6DSV32X + DPS368 on SPI1 · second pair on SPI2'],
    ['Buses', 'CAN1 flight · CAN2 payload'],
    ['Board', '36 × 55 mm · 6 layers · two board-to-board connectors'],
    ['Status', 'Interface freeze Oct 2026 · boards Feb 2027'],
  ]);
}

/* ============================================================ 06 more boards */
{
  const s = slide('light');
  title(s, 'More boards');
  const tiles = [
    ['Electronic load', 'STM32F103, DAC-controlled MOSFETs · 150 W target · paused at 5 V, 1 A, thermally limited', 'Control board and power board side by side, on white.'],
    ['Micromouse Rev 02', 'STM32F411 · DRV8833 · IR pulsed at 100 mA for 60 µs · gyro + PD control · ' + todo('status'), 'Micromouse on white, three-quarter angle.'],
    ['Flight computers, five generations', 'Four protoboard builds from 2019, then a 4-layer PCB: IMU, barometer, logging, state machine', 'Gen 1 protoboard and Gen 5 PCB together, on white.'],
    ['Glowstick V3', 'ESP32-C3 · BQ25628E USB-C charging · audio-reactive LEDs · ' + todo('status'), 'Board, or KiCad render on white.'],
    ['Battery management', 'bq77915 protector · ' + todo('cell count, status'), 'KiCad render on white.'],
    ['Power meter', 'STM32F103 · INA211 · CAN · designed, not built', 'KiCad render on white.'],
  ];
  const tw = (CW - 2 * 0.4) / 3, th = 1.45;
  tiles.forEach((t, i) => {
    const x = M + (i % 3) * (tw + 0.4), y = 1.55 + Math.floor(i / 3) * (th + 1.15);
    ph(s, x, y, tw, th, t[2]);
    T(s, t[0], { x, y: y + th + 0.12, w: tw, h: 0.3, fontSize: 12 });
    T(s, t[1], { x, y: y + th + 0.42, w: tw, h: 0.6, fontSize: 10, color: GRAY, lineSpacing: 14 });
  });
}

/* ============================================================ A1 */
{
  const s = slide('light', 'A · FOC motor controller');
  title(s, 'The bridge was simulated before layout');
  const w1 = 6.2;
  const r1 = img(s, 'S1_dpt_waveforms.png', M, 1.55, w1, 3.7);
  cap(s, 'Fig A1.1 · Double-pulse test, leg A · 50.4 V, 14.1 A · IDRIVE 0.33 / 0.66 A · LTspice', M, r1.y + r1.h + 0.08, w1);
  const x2 = M + w1 + 0.5, w2 = W - M - x2;
  const r2 = img(s, 'S2_shoot_through_margin.png', x2, 1.55, w2, 2.5);
  cap(s, 'Fig A1.2 · Induced gate voltage on the off FET during the complementary edge, by driver model', x2, r2.y + r2.h + 0.08, w2);
  body(s, 'The question was whether the low-side FET can be pulled on through its Miller capacitance while the high side switches. A resistive 14 Ω gate model says yes: 1.75 V induced against a 2.3 V threshold. The DRV8323 is a current sink, not a resistor; with the strong hold current the induced voltage falls to 0.08 V. Dead time stays at 200 ns and no gate–source capacitors are fitted, with footprints reserved.', x2, r2.y + r2.h + 0.45, w2, 2.2);
}

/* ============================================================ A2 */
{
  const s = slide('light');
  title(s, 'Drive strength, loop inductance and heat set the design point');
  const gw = (CW - 2 * 0.4) / 3;
  const figs = [['S3_idrive_sweep.png', 'Fig A2.1 · IDRIVE sweep at 14.1 A'], ['S4_loop_inductance.png', 'Fig A2.2 · Overshoot vs commutation-loop inductance'], ['S5_thermal.png', 'Fig A2.3 · Loss and junction temperature vs phase current']];
  figs.forEach((f, i) => { const x = M + i * (gw + 0.4); img(s, f[0], x, 1.55, gw, 2.4); cap(s, f[1], x, 1.55 + 2.4 + 0.08, gw); });
  const notes = [
    'IDRIVE 0.33 / 0.66 A. Switching energy falls fast up to about 0.4 A and flattens; above 0.6 A the high-side overshoot climbs through the 80 % derating line. The chosen setting sits where both curves are flat.',
    'Loop inductance. At 50.4 V and 14.1 A the high-side overshoot crosses the 100 V rating above roughly 12 nH. That number drove the layout: via-in-pad on the high-side drains, 2 oz copper, solid ground on L2 directly under the stage.',
    'Thermal. At the 10 A design point the low-side FET sits near 72 °C with no heatsink. The as-built low side has no vertical thermal path, so 10 A is the rating; the earlier 20 A stress figure was withdrawn.',
  ];
  notes.forEach((n, i) => body(s, n, M + i * (gw + 0.4), 4.5, gw, 2.2, { fontSize: 11, lineSpacing: 16 }));
}

/* ============================================================ A3 */
{
  const s = slide('light');
  title(s, 'Rev 01 bring-up: five findings, from bit-shifted SPI to a motor model 2.5× off');
  table(s, M, 1.55, 7.6, ['', 'Symptom', 'Cause', 'Change'], [
    ['1', 'SPI reads bit-shifted', 'DRV8323 SDO is open-drain; the pull-up is too weak at 2.66 MHz', 'SPI throttled to 332 kHz; stable since'],
    ['2', 'Current offset 0.15–0.46 A', 'Offset taken in the driver\'s internal calibration mode', 'Calibrate the amps in normal mode at 0 A: ±1 mV, 11–14 mA rms floor'],
    ['3', 'Phase C current inverted', 'Sense wiring reversed on phase C', '−1 in firmware ' + todo('hardware fix in Rev B?')],
    ['4', 'Pins don\'t match the schematic', 'DRV_ENABLE and encoder CS routed differently from their labels', todo('fix')],
    ['5', 'Motor model off', 'MN601-S phase resistance measured 98 mΩ; datasheet says 39 mΩ', 'Measured values in the model'],
  ], [0.3, 1.9, 2.9, 2.5], { fs: 10 });
  cap(s, 'Table A3.1 · Bench log, September 2026', M, 5.0, 7.6);
  const x2 = M + 7.6 + 0.5, w2 = W - M - x2;
  const r = img(s, 'T2_voltage_limited_speed.png', x2, 1.55, w2, 2.6);
  cap(s, 'Fig A3.1 · Open-loop I/f speed against the voltage limit, MN601-S', x2, r.y + r.h + 0.08, w2);
  body(s, 'The first spin tripped over-current at about 960 rpm with a 2 V limit; raising the limit in RAM reached 2000 rpm. The speed line uses the measured KV and phase resistance, which is why the motor-model correction above mattered.', x2, r.y + r.h + 0.45, w2, 1.6, { fontSize: 11, lineSpacing: 16 });
}

/* ============================================================ A4 */
{
  const s = slide('light');
  title(s, 'Firmware: the control interrupt fits its 40 µs window');
  const w1 = 5.4;
  const r1 = img(s, 'T1_isr_budget.png', M, 1.55, w1, 3.0);
  cap(s, 'Fig A4.1 · Control-ISR execution time vs streamed scope signals, firmware 0.6.1', M, r1.y + r1.h + 0.08, w1);
  body(s, 'The current loop runs in the PWM interrupt every 40 µs. Idle it takes 17.5 µs; spinning, with five signals streamed to the host, the recorder peaks at 38 µs. That is the budget line for Rev B at 40 kHz, and it is why telemetry is framed, not printed.', M, r1.y + r1.h + 0.45, w1, 1.6, { fontSize: 11, lineSpacing: 16 });
  const x2 = M + w1 + 0.5, w2 = W - M - x2;
  const r2 = img(s, 'gui.png', x2, 1.55, w2, 3.6);
  cap(s, 'Fig A4.2 · Host GUI: bench sync, spin control, limits, live telemetry. FOCLINK/1 over UART, FOCCAN/1 over CAN FD.', x2, r2.y + r2.h + 0.08, w2);
  specs(s, x2, r2.y + r2.h + 0.5, w2, [['Rev B', 'ODrive M8325s, 60 V bus, 40 kHz · in design review'], ['Open points', todo('what carries over from the bring-up list')]], { lw: 1.1 });
}

/* ============================================================ B1 */
{
  const s = slide('light', 'B · AeroDesign power system');
  title(s, '2024: one wiring hub replaced the rat\'s nest, and the plane flew');
  const w1 = 6.0;
  const r1 = img(s, 'power-arch.jpg', M, 1.55, w1, 3.4);
  cap(s, 'Fig B1.1 · Power architecture of Shadow, 2023–24 season', M, r1.y + r1.h + 0.08, w1);
  const x2 = M + w1 + 0.5, w2 = W - M - x2, hw = (w2 - 0.3) / 2;
  const ra = img(s, 'hub-top.jpg', x2, 1.55, hw, 2.0);
  const rb = img(s, 'module-render.jpg', x2 + hw + 0.3, 1.55, hw, 2.0);
  cap(s, 'Fig B1.2 · Wiring hub, 4 layers, Altium', x2, 1.55 + 2.0 + 0.08, hw);
  cap(s, 'Fig B1.3 · 5 V 15 A power module', x2 + hw + 0.3, 1.55 + 2.0 + 0.08, hw);
  specs(s, x2, 4.1, w2, [
    ['Loads', 'FC 3.05 A · cellular 4.0 A · optical 0.66 A · 4 servos × 2.5 A → ~18 A worst case'],
    ['Buck', 'ISL8117A · 3.3 µH at 600 kHz · 15.97 A peak'],
    ['Output', '330 µF · ±10.6 mV on a two-servo stall'],
    ['Result', 'Flew · 5th overall, SAE Aero Design Advanced Class'],
  ], { lw: 0.9, accentLast: true });
  body(s, 'Hub: vertical signals on top, high current on the bottom, TVS and 0.1 µF at every connector.', M, r1.y + r1.h + 0.45, w1, 0.8, { fontSize: 11, lineSpacing: 16 });
}

/* ============================================================ B2 */
{
  const s = slide('light');
  title(s, 'A suspected shoot-through killed four servos, and the board could not tell us why');
  const pw = 2.9;
  img(s, 'fail-shoot-through.jpg', M, 1.55, pw, pw, 'cover');
  img(s, 'fail-exposure.jpg', M + pw + 0.3, 1.55, pw, pw, 'cover');
  cap(s, 'Fig B2.1 · After the event · Fig B2.2 · Wiring exposed to the elements', M, 1.55 + pw + 0.08, 2 * pw + 0.3);
  body(s, 'Both switches of the buck half-bridge on at once shorts the input to ground. Nothing on the board could catch it or record it. My own review of the season: "Dismissed a member\'s concern about a critical failure."', M, 1.55 + pw + 0.5, 2 * pw + 0.3, 1.6, { fontSize: 11, lineSpacing: 16 });
  const x2 = M + 2 * pw + 0.3 + 0.6, w2 = W - M - x2;
  table(s, x2, 1.55, w2, ['What failed in 2024', 'Fixed in 2025 by'], [
    ['No output protection', 'TPS25983 e-fuse on the input and the output'],
    ['No datalog, no test points', 'Bus voltage and current sensed and sent over telemetry'],
    ['Connectors chosen on price', 'Locking I/O connectors'],
    ['Buck controller going out of stock', 'LM5146, still 5 V at 15 A'],
    ['Two-layer power modules', 'Six layers: power, ground, ground, signal, ground, signal'],
    ['Root cause', todo('confirmed, or still suspected?')],
  ], [2.4, w2 - 2.4], { fs: 10 });
}

/* ============================================================ B3 */
{
  const s = slide('light');
  title(s, '2025: redesigned from the failure list');
  const pw = 5.6;
  ph(s, M, 1.55, pw, pw * 0.75, 'Rev 2 power board, top, straight down on white paper. 4:3. (Current desk photo is a fallback.)');
  cap(s, 'Fig B3.1 · 2025 power board, assembled', M, 1.55 + pw * 0.75 + 0.08, pw);
  const x2 = M + pw + 0.5, w2 = W - M - x2;
  const r = img(s, 'pdb2-lm5146-layout.jpg', x2, 1.55, w2, 2.3);
  cap(s, 'Fig B3.2 · LM5146 stage layout: input ceramics across the FETs, solid ground on L2 underneath', x2, r.y + r.h + 0.08, w2);
  specs(s, x2, r.y + r.h + 0.5, w2, [
    ['Input', '7–25 V · 4S or smaller, per the rules'],
    ['Buck', 'LM5146 · 3.3 µH · 5 V, 15 A'],
    ['Protect', 'TPS25983 e-fuse in and out'],
    ['Telemetry', 'Bus V and I to the flight controller'],
    ['Validation', 'UV/OV, line and load regulation, ripple, 1 h at 5 A · ' + todo('bench, Nov 2026')],
  ], { lw: 1.0 });
}

/* ============================================================ end */
{
  const s = slide('dark', 'End');
  T(s, 'Thanks for reading.', { x: M, y: 2.6, w: 9, h: 0.8, fontSize: 32, color: 'F2F2F2' });
  T(s, 'Happy to walk through any board, schematic or bench log in an interview.', { x: M, y: 3.4, w: 9, h: 0.5, fontSize: 14, color: '8A8A8A' });
  T(s, 'kchweymen@gmail.com\ngithub.com/WeymenKoo\nweymenkoo.github.io/Personal-Site', { x: M, y: 4.4, w: 9, h: 1.2, fontSize: 12, color: 'F2F2F2', lineSpacing: 20 });
  T(s, 'Rev A · November 2026', { x: M, y: H - 0.95, w: 6, h: 0.3, fontSize: 9, color: ACCENT });
}

const out = path.join(__dirname, 'WeymenKoo_HardwarePortfolio_2026.pptx');  // git-ignored
pres.writeFile({ fileName: out }).then(() => console.log('wrote', out, page, 'pages'));
