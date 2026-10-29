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
for (const f of fs.readdirSync(path.join(__dirname, 'img')).filter(f => /\.(png|jpe?g)$/i.test(f))) {
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
    ['AeroDesign power system', 'Flown', 'Two seasons of 5 V, 15 A power for a competition aircraft, 5th overall.', '12'],
    ['Flight controller module', 'In design', 'STM32H757 ArduPilot module, 36 × 55 mm, with a second designer.', '16'],
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
  cap(s, 'FOC: motivation, theory, schematic, simulation, layout, bring-up, p.03–11 · AeroDesign p.12–15 · more boards p.16', rx, 1.6 + 3 * 1.25 + 0.15, rw);
}

/* ============================================================ 03 FOC motivation */
{
  const s = slide('light', 'FOC motor controller');
  title(s, 'FOC motor controller: a joint drive for a cat-scale biped');
  const pw = 5.2;
  ph(s, M, 1.55, pw, pw * 0.75, 'Rev 01 top side, straight down on white paper, window light, fills the frame. 4:3.');
  cap(s, 'Rev 01 · 70 × 70 mm · 6 layers · KiCad · fabricated and assembled at JLCPCB, August 2026', M, 1.55 + pw * 0.75 + 0.08, pw);
  const rx = M + pw + 0.6, rw = W - M - rx;
  body(s, 'Quasi-direct drive: a 6:1 to 10:1 gear so the joint is backdrivable and torque tracks motor current almost directly. That makes current-sense accuracy the primary spec, and the joint must hold torque at standstill, so the encoder has to be absolute. Six of these sit on one CAN-FD bus.', rx, 1.55, rw, 1.5);
  specs(s, rx, 3.2, rw, [
    ['Bus', '12S Li-ion · 36 V cutoff, 50.4 V full · 60 V ceiling'],
    ['Phase current', '10 A RMS continuous, from the joint torque budget'],
    ['Switching', 'Inaudible, > 20 kHz · 25 kHz built, 40 kHz planned'],
    ['Position', 'Absolute, available at zero speed'],
    ['Safety', 'Fault = coast · no uncommanded torque · independent stop'],
    ['Size', '≤ 80 × 80 mm, it hangs on a limb'],
  ], { lw: 1.25 });
  cap(s, 'Design history: Rev A 40 V FETs on a 50 V bus · Rev B lowest-RDS(on) FET had the highest loss · Rev C protected every fault on the board, 19 sheets · Rev 1 trimmed to the requirement and built.', rx, 5.9, rw);
}

/* ============================================================ 04 theory */
{
  const s = slide('light');
  title(s, 'Background: what field-oriented control does');
  const r = img(s, 'foc-theory.png', M, 1.5, CW, 4.1);
  cap(s, 'Fig 1 · Clarke and Park transforms move the three phase currents into the rotor frame; inverse Park and space-vector PWM bring the result back to the bridge.', M, r.y + r.h + 0.1, CW);
  body(s, 'Why it matters here: torque is proportional to i_q, so controlling i_q is controlling joint torque. Sensorless observers need back-EMF and have no signal at zero speed, which is where a leg spends much of its time. Hence the on-board 14-bit absolute encoder, placed at the board centre on the rotor axis.', M, r.y + r.h + 0.5, CW, 0.9, { fontSize: 11, lineSpacing: 16 });
}

/* ============================================================ 05 architecture */
{
  const s = slide('light');
  title(s, 'Schematic: 14 sheets, one block per function');
  const fw = 6.6;
  const r = img(s, 'sch-arch.png', M, 1.5, fw, 5.0);
  cap(s, 'Fig 2 · Sheet 2, project architecture. Each box is a sheet; the wires are the only signals that cross sheets.', M, r.y + r.h + 0.08, fw);
  const rx = M + fw + 0.5, rw = W - M - rx;
  specs(s, rx, 1.5, rw, [
    ['Power path', 'TVS → +VPROT → 3 × 100 µF polymer + 9 × 4.7 µF MLCC → bridge'],
    ['Rails', 'LMR36520 buck, 400 kHz → 5 V → TLV75733 LDO → 3.3 V'],
    ['Gate drive', 'DRV8323S: IDRIVE/TDRIVE over SPI, charge pump, 3 current amps, VDS OCP'],
    ['MCU', 'STM32G431, 170 MHz · TIM1 PWM · injected ADC on TIM1_TRGO2 · FDCAN'],
    ['Grounds', 'PGND, AGND, DGND star-joined at the shunts; chassis isolated, one 0 Ω bond'],
    ['Interfaces', 'CAN-FD in/out · UART · aux encoder SPI · motor NTC · E-stop · SWD'],
  ], { lw: 1.05, fs: 10.5 });
  body(s, 'What was removed on the way to Rev 1: a hot-swap front end (bus-level job, moved to the distribution board), USB-C and a bridge chip (SWD does it), an off-board encoder (unshielded SPI through a moving joint was the top field-failure risk), and a CAN ID ladder.', rx, 5.0, rw, 1.4, { fontSize: 10.5, lineSpacing: 15 });
}

/* ============================================================ 06 power stage */
{
  const s = slide('light');
  title(s, 'Power stage: the FET was chosen on figure of merit, not RDS(on)');
  const fw = 7.0;
  const r = img(s, 'sch-bridge.png', M, 1.5, fw, 3.2);
  cap(s, 'Fig 3 · Sheet 7: DC-link capacitors and the three-phase bridge. Red X: RC snubber footprints, fitted DNP.', M, r.y + r.h + 0.08, fw);
  table(s, M, r.y + r.h + 0.5, fw, ['RDS(on)', 'P conduction', 'P switching', 'Total per FET'], [
    ['1.50 mΩ (IPT015N10N5)', '1.80 W', '3.85 W', '5.65 W, worst'],
    ['2.24 mΩ', '2.69 W', '1.58 W', '4.27 W'],
    ['2.70 mΩ', '3.24 W', '1.36 W', '4.60 W'],
  ], [2.4, 1.4, 1.4, 1.8], { fs: 10 });
  cap(s, 'Table 1 · Loss per FET at 40 A RMS, 40 kHz, 50 V, IDRIVE 1 A. Switching loss dominates; the lowest-RDS(on) part loses.', M, r.y + r.h + 0.5 + 1.25, fw);
  const rx = M + fw + 0.5, rw = W - M - rx;
  specs(s, rx, 1.5, rw, [
    ['FET', 'ISC030N10NM6 · 100 V · 3.0 mΩ · Qg 55 nC · 5 × 6 mm'],
    ['Why', 'FoM RDS(on) × Qg · TDSON-8 instead of six TOLL (~700 mm²) for < 1 W per FET'],
    ['Gate drive', 'IDRIVE 0.33 / 0.66 A, 0 Ω series · charge pump 4.1 mA of 25 mA at 25 kHz'],
    ['Dead time', '200 ns · TDRIVE adaptive · ISTRONG 2 A pulldown on the opposite gate'],
    ['DC link', 'Sized by ripple current, ~7.8 A RMS at 10 A per phase, not by capacitance'],
    ['Snubbers', 'Ring 89.7 MHz self-damps in 40 ns in simulation; 32 RC combinations gave nothing. Footprints kept, DNP.'],
    ['Sense', '3 mΩ Kelvin shunts × gain 20 → ±27.5 A full scale, 13.4 mA/LSB'],
  ], { lw: 1.0, fs: 10.5 });
}

/* ============================================================ 07 sim 1 */
{
  const s = slide('light');
  title(s, 'Simulation: double pulse and the shoot-through question');
  const w1 = 6.2;
  const r1 = img(s, 'S1_dpt_waveforms.png', M, 1.5, w1, 3.7);
  cap(s, 'Fig 4 · Double pulse, leg A · 50.4 V, 14.1 A · IDRIVE 0.33 / 0.66 A · ngspice, VDMOS model fitted to the datasheet (RDS(on) 2.56 mΩ, Qg 53.8 nC, plateau 4.57 V)', M, r1.y + r1.h + 0.08, w1);
  body(s, 'Turn-off peaks at 52.6 V and rings itself out. Turn-on shows 32 A on a 14.1 A load: body-diode recovery plus Coss, pessimistic because the model has no soft-recovery term.', M, r1.y + r1.h + 0.55, w1, 1.0, { fontSize: 11, lineSpacing: 16 });
  const x2 = M + w1 + 0.5, w2 = W - M - x2;
  const r2 = img(s, 'S2_shoot_through_margin.png', x2, 1.5, w2, 2.5);
  cap(s, 'Fig 5 · Induced high-side gate voltage at low-side turn-on, 200 ns after the high side is told to turn off', x2, r2.y + r2.h + 0.08, w2);
  body(s, 'Can the off FET be pulled on through its Miller capacitance while its partner switches? With a resistive 14 Ω gate model, yes: 1.75 V against a 2.3 V minimum threshold. The DRV8323 is a current sink with a 2 A strong pulldown, and the induced voltage falls to 0.08 V. That is why the gate–source RC networks stayed unpopulated.', x2, r2.y + r2.h + 0.5, w2, 2.0, { fontSize: 11, lineSpacing: 16 });
}

/* ============================================================ 08 sim 2 */
{
  const s = slide('light');
  title(s, 'Simulation: drive strength, loop inductance and junction temperature');
  const gw = (CW - 2 * 0.4) / 3;
  const figs = [['S3_idrive_sweep.png', 'Fig 6 · IDRIVE sweep at 50.4 V, 14.1 A'], ['S4_loop_inductance.png', 'Fig 7 · Overshoot vs commutation-loop inductance'], ['S5_thermal.png', 'Fig 8 · Loss and Tj per FET vs phase current, 25 kHz, 40 °C, no heatsink']];
  figs.forEach((f, i) => { const x = M + i * (gw + 0.4); img(s, f[0], x, 1.5, gw, 2.4); cap(s, f[1], x, 1.5 + 2.4 + 0.08, gw); });
  const notes = [
    'Faster drive cuts turn-on energy from 33 to 10 µJ, but the high-side recovery overshoot goes 51 → 69 → 111 V at 0.33 / 0.57 / 1.0 A, through the 100 V rating. IDRIVE stays at 0.33 / 0.66 A until the switch node has been scoped.',
    'Overshoot against total loop inductance: 53 / 64 / 77 / 97 V at 2.4 / 12.4 / 22.4 / 42.4 nH. The layout budget became "keep the HF loop under ~10 nH"; the built board extracts at about 2.4 nH.',
    'At the 10 A design point Tj is about 63 °C high side and 73 °C low side. Six-FET total 3.9 W at 25 kHz. The low side has no vertical thermal path (switch node kept on L1), so 10 A is the rating until its case temperature is measured.',
  ];
  notes.forEach((n, i) => body(s, n, M + i * (gw + 0.4), 4.4, gw, 2.3, { fontSize: 11, lineSpacing: 16 }));
}

/* ============================================================ 09 layout */
{
  const s = slide('light');
  title(s, 'Layout: six layers, two of them unbroken ground');
  const lw = 2.55, gap = 0.22;
  [['layer-L1.png', 'L1 · signal + power'], ['layer-L2.png', 'L2 · ground, solid'], ['layer-L3.png', 'L3 · signal + power'], ['layer-L6.png', 'L6 · bus copper + signal']].forEach((f, i) => {
    const x = M + i * (lw + gap); img(s, f[0], x, 1.5, lw, lw); cap(s, f[1], x, 1.5 + lw + 0.06, lw);
  });
  cap(s, 'Fig 9 · Copper, from the fab package. Stackup: Sig/Pwr · GND · Sig/Pwr · Sig/Pwr · GND · Sig/Pwr', M, 1.5 + lw + 0.32, 4 * lw + 3 * gap);
  const ty = 1.5 + lw + 0.75;
  const cw2 = (CW - 0.5) / 2;
  specs(s, M, ty, cw2, [
    ['Power stage', 'Phases and bus on one edge, next to the FET row · MLCCs 6 mm from the FETs · loop ~2.4 nH'],
    ['High side', '16 via-in-pad per drain into the inner bus plane · stencil windowpaned on every thermal pad'],
    ['Switch node', 'Kept on L1 only: no switching copper on inner layers, no via stubs on the noisiest nets'],
  ], { lw: 1.0, fs: 10.5 });
  specs(s, M + cw2 + 0.5, ty, cw2, [
    ['Encoder', 'AS5047P at (40.00, 40.00), the geometric centre, on the bottom · aux SPI connector kept'],
    ['Chassis', 'Isolated: one 0 Ω bond, 1 nF / 1 kV at every hole, moat cut on the inner planes'],
    ['Fab', '70.1 × 70.1 mm · 344 vias at 0.25 / 0.55 mm · 38 test points · 159 + 33 parts, JLCPCB PCBA'],
  ], { lw: 1.0, fs: 10.5 });
}

/* ============================================================ 10 sensing + protection */
{
  const s = slide('light');
  title(s, 'Sensing and protection: timing rejects the noise, hardware holds the line');
  const cw2 = (CW - 0.5) / 2;
  body(s, 'Current sense is the primary spec, because in a QDD joint sense error is torque error. The shunt and gain are one decision: 3 mΩ × 20 gives ±23.3 A linear, 16.3 A RMS. Gain 40 would clip at 13.75 A. Switching noise is rejected by sampling at the PWM counter peak, when every low side conducts and the bridge is quiet, not by filtering; the 56 Ω / 2.2 nF RC is edge damping only. Offsets are calibrated in normal mode with the bridge idle on every wake, because the driver\'s own calibration mode left 0.15 to 0.46 A of error.', M, 1.5, cw2, 2.6, { fontSize: 11, lineSpacing: 16 });
  specs(s, M, 4.2, cw2, [
    ['Resolution', '13.4 mA per LSB · noise 11–14 mA rms per sample'],
    ['Bus sense', '24.9 k + 12.4 k over 2 k · 15.8 mV/LSB · 838 Hz, monitor only'],
    ['Temperature', 'Board NTC, motor NTC, MCU sensor · every reading carries an age'],
  ], { lw: 1.1, fs: 10.5 });
  table(s, M + cw2 + 0.5, 1.5, cw2, ['Layer', 'Mechanism', 'Behaviour'], [
    ['Input transient', 'SMCJ51CA TVS', 'Clamps at 82 V'],
    ['VDS over-current', 'DRV8323, VDS_LVL 0.06 V', '~13 A hot, 20 A cold'],
    ['Firmware OC', 'Control ISR', '4.5 A trip in the current bench tier'],
    ['Driver fault', 'nFAULT → TIM1 break input', 'Outputs off in hardware, no software in the path'],
    ['Output lock', 'ISR + main loop', 'Illegal enable bits cleared, fault latched'],
    ['Dead-man, watchdog', '100 ms, 500 ms', 'Coast'],
    ['Stale inputs', '> 500 ms old', 'Refuse ARM, fault an armed board'],
    ['Regen', 'Guard above ~120 rpm', 'Every stop is a coast'],
  ], [1.6, 2.1, cw2 - 3.7], { fs: 10 });
  cap(s, 'Table 2 · Protection layers. Fault state is always coast: shorting the low sides at speed would drive ~180 A.', M + cw2 + 0.5, 5.9, cw2);
}

/* ============================================================ 11 bring-up */
{
  const s = slide('light');
  title(s, 'Bring-up: what the bench found, and 2000 rpm');
  table(s, M, 1.5, 7.4, ['', 'Symptom', 'Cause', 'Change'], [
    ['1', 'SPI reads bit-shifted', 'DRV8323 SDO is open-drain; the pull-up is too weak at 2.66 MHz', 'SPI at 332 kHz; stable since'],
    ['2', 'Current offset 0.15–0.46 A', 'Offset taken in the driver\'s internal calibration mode', 'Calibrate in normal mode at 0 A: ±1 mV'],
    ['3', 'Phase C current inverted', 'Sense wiring reversed on phase C', '−1 in firmware ' + todo('Rev B fix')],
    ['4', 'Pins differ from the schematic', 'DRV_ENABLE and encoder CS routed differently from their labels', 'Firmware pin map updated'],
    ['5', 'Motor model 2.5× off', 'MN601-S phase R measured 98 mΩ; datasheet 39 mΩ', 'On-board ID of R, Ld/Lq, flux linkage'],
  ], [0.3, 1.9, 2.8, 2.4], { fs: 10 });
  cap(s, 'Table 3 · Rev 01 bench log, September 2026. Measured: 200 ns dead time, zero overlap, duty ±0.3 %.', M, 4.95, 7.4);
  const x2 = M + 7.4 + 0.5, w2 = W - M - x2;
  const r = img(s, 'T2_voltage_limited_speed.png', x2, 1.5, w2, 2.6);
  cap(s, 'Fig 10 · Open-loop I/f speed against the voltage limit. First spin tripped over-current near 960 rpm; raising the limit reached 2000 rpm.', x2, r.y + r.h + 0.08, w2);
  specs(s, x2, r.y + r.h + 0.6, w2, [
    ['Validated', 'Switching, motor ID, I/f to 2000 rpm at 12 V'],
    ['Not yet', 'Closed loop (magnet not fitted), > 12 V, load, thermal at rating'],
    ['Control ISR', '18 µs idle, 29 µs spinning, of 40 µs'],
    ['Result', '2000 rpm open-loop, MN601-S, 12 V bench supply'],
  ], { lw: 1.0, fs: 10.5, accentLast: true });
}

/* ============================================================ B1 */
{
  const s = slide('light', 'AeroDesign power system');
  title(s, 'AeroDesign: the aircraft as a system, 2024');
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
  body(s, 'The brief: a kill switch, two 16.8 V packs, a 2.4 GHz control link, ESC PWM, 900 MHz telemetry, cellular video and MAVLink to the flight controller, all through one 5 V rail. I split it into a wiring hub (the carrier for every connector), a power module, and a small tail hub, and sized the modules from the worst-case budget with every servo stalled at once.', M, r1.y + r1.h + 0.45, w1, 1.4, { fontSize: 11, lineSpacing: 16 });
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

/* ============================================================ 06 more boards */
{
  const s = slide('light', 'More boards');
  title(s, 'More boards');
  const tiles = [
    ['Electronic load', 'STM32F103, DAC-controlled MOSFETs · 150 W target · paused at 5 V, 1 A, thermally limited', 'Control board and power board side by side, on white.'],
    ['Micromouse Rev 02', 'STM32F411 · DRV8833 · IR pulsed at 100 mA for 60 µs · gyro + PD control · ' + todo('status'), 'Micromouse on white, three-quarter angle.'],
    ['Flight computers, five generations', 'Four protoboard builds from 2019, then a 4-layer PCB: IMU, barometer, logging, state machine', 'Gen 1 protoboard and Gen 5 PCB together, on white.'],
    ['Glowstick V3', 'ESP32-C3 · BQ25628E USB-C charging · audio-reactive LEDs · ' + todo('status'), 'Board, or KiCad render on white.'],
    ['Flight controller module', 'STM32H757 ArduPilot module, 36 × 55 mm, 6 layers · lead designer, with a junior designer · interface freeze Oct 2026', 'KiCad render or floorplan on white.'],
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

/* ============================================================ end */
{
  const s = slide('dark', 'End');
  T(s, 'Thanks for reading.', { x: M, y: 2.6, w: 9, h: 0.8, fontSize: 32, color: 'F2F2F2' });
  T(s, 'Happy to walk through any board, schematic or bench log in an interview.', { x: M, y: 3.4, w: 9, h: 0.5, fontSize: 14, color: '8A8A8A' });
  T(s, 'kchweymen@gmail.com\ngithub.com/WeymenKoo\nweymenkoo.github.io/Personal-Site', { x: M, y: 4.4, w: 9, h: 1.2, fontSize: 12, color: 'F2F2F2', lineSpacing: 20 });
  T(s, 'Rev A · November 2026', { x: M, y: H - 0.95, w: 6, h: 0.3, fontSize: 9, color: ACCENT });
}

const out = path.join(__dirname, 'WeymenKoo_HardwarePortfolio_2026.pptx');
pres.writeFile({ fileName: out }).then(() => console.log('wrote', out, page, 'pages'));
