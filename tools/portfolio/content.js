// The portfolio's pages, in order. Numbers come from the projects' test reports:
//   power board  github.com/WeymenKoo/AeroDesign-Power-Board (README, bench_test/results/*/notes.txt)
//   FOC          github.com/WeymenKoo/FOC-Motor-Controller (Testing/README.md, Testing/Bench/CHAR_LOG.md)
//   DC load      github.com/WeymenKoo/DC-Electronic-Load (bench_test/REPORT.md)
//   SoM          github.com/WeymenKoo/AeroDesign-Flight-Controller-SoM (README.md)
module.exports = ({ fig, scope, stats, table, page }) => {
  const P = [];
  const PB = n => `<b>01</b> · AeroDesign power board · ${n}`;

  /* ---------------- cover ---------------- */
  P.push(`<section class="page cover">
  <h1>Weymen Koo</h1>
  <p class="cjk">许梣焕</p>
  <p class="lede">Hardware portfolio: power electronics, motor control and flight avionics.</p>
  <div class="toc">
    <div><h4>Featured</h4><ul>
      <li>01 · AeroDesign power board<span>Concept · layout · bench test · flown 2025</span></li></ul></div>
    <div><h4>Headline</h4><ul>
      <li>02 · Flight controller SoM<span>Render · 8-layer layout</span></li>
      <li>03 · FOC motor controller<span>Layout · power-stage tests</span></li>
      <li>04 · DC electronic load<span>Layout · bench tests</span></li></ul></div>
    <div><h4>Gallery</h4><ul>
      <li>Shadow power distribution<span>2024 · flown</span></li>
      <li>Carrier board v1<span>2026 · for the SoM</span></li>
      <li>Micromouse V2<span>2023–24</span></li>
      <li>Kyogre and Spirit<span>2021–23 · airframes</span></li></ul></div>
  </div>
  <div class="strip">${fig('pb-hero', '', { h: '1.55in' })}${fig('fc-hero', '', { h: '1.55in' })}${fig('foc-hero', '', { h: '1.55in' })}${fig('el-heatsink', '', { h: '1.55in' })}</div>
  <p class="meta">kchweymen@gmail.com · github.com/WeymenKoo<br>weymenkoo.github.io/Personal-Site · scope captures are unedited RIGOL screenshots; call-outs added on top</p>
</section>`);

  /* ---------------- 01 power board: overview ---------------- */
  P.push(page(PB('Overview'), 'AeroDesign power board', `
<div class="cols" style="grid-template-columns:6.6in 1fr">
  <div class="stack">
    ${fig('pb-hero', 'Rev 3, rendered in Blender from the Altium STEP and Gerbers. Battery in on the left edge, 5 V out on the right.', { h: '4.75in' })}
    ${stats([['15 A', 'design load on one protected 5 V rail'], ['91–94 %', 'efficiency at 1.9 A, 7.4–22 V in'], ['≈ 1 %', 'every protection threshold vs. design'], ['2025', 'flown at SAE Aero Design, Advanced Class']])}
  </div>
  <div class="stack small">
    <div><div class="kicker">What it is</div>
    <p>The power board for UBC AeroDesign's 2025 aircraft. It takes the 2S–4S flight battery and makes one protected 5 V rail for nine servos, the receiver, telemetry, camera and the flight controller, which plugs in on top.</p></div>
    <div><div class="kicker">My role</div>
    <p>Lead designer: requirements, schematic, layout, bring-up and the 2026 bench campaign. A clean-sheet redesign after the previous revision did not work.</p></div>
    <div><div class="kicker">The path</div>
    <p>Battery → input eFuse (TPS25983 + reverse-polarity FET) → LM5146 synchronous buck → servo-output eFuse (second TPS25983) with a 5 mΩ / INA240 current sense → every connector.</p></div>
    <div><div class="kicker">Status</div>
    <p>Flown all season in aircraft 221. It flew with no bench data, so in November 2026 I characterised it to 1.9 A: the design holds, and the tests found three faults that go into Rev B.</p></div>
    <p class="muted">Next pages: concept, layout, test, deployment.</p>
  </div>
</div>`, { spec: '2S–4S in · 5 V 15 A · LM5146 buck · 2 × TPS25983 eFuse · INA240 · 110 × 60 mm, 6 layers · Altium' }));

  /* ---------------- 01 concept ---------------- */
  P.push(page(PB('Concept'), 'One protected 5 V rail, from the battery to every servo', `
<div class="cols" style="grid-template-columns:3.55in 1fr">
  <div class="stack small">
    <div><h3>Requirements</h3><ul>
      <li>2S–4S LiPo in: 7–22 V.</li>
      <li>5 V at up to 15 A for nine servos, the receiver, telemetry, camera and the flight controller.</li>
      <li>Survive a reversed battery, a live plug-in and a shorted servo.</li>
      <li>Tell the flight controller how much current the servos draw.</li></ul></div>
    <div><h3>Decisions</h3>
    ${table([
      ['Input', 'TPS25983 eFuse: on 5.97 V, off 24.86 V, 17.81 A limit, latches. P-FET Q4 for reverse polarity, 1.5 kW TVS.'],
      ['Buck', 'LM5146 + 2 × AON7534, 300 kHz. 3.3 µH inductor picked to saturate (37 A) above the eFuse limit, so the eFuse trips first. Type III loop for a 50 kHz crossover.'],
      ['Output', 'A second TPS25983 with a back-to-back FET: a short on the 5 V side is cut off and retried 4 times, then latched, instead of loading the buck.'],
      ['Sensing', '5 mΩ shunt, INA240 to the flight controller\'s ADC; power-good from every stage to a test pad.'],
      ['Cut', 'A second battery with ideal-diode OR-ing, per-battery sensing and a second 5 A buck: one path from battery to connectors.'],
    ])}</div>
  </div>
  <div class="stack">
    ${fig('pb-blocks', 'The block diagram on the top schematic sheet. Crossed out: what the design started with and dropped.')}
    <div class="grid2">
      ${fig('pb-chalkboard', 'The 2024–25 avionics planned on a chalkboard, October 2024: radios, camera, power budget.', { h: '2.6in' })}
      ${fig('pb-sketch', 'The stack on paper: flight controller on 2.54 mm headers above the power board.', { h: '2.6in', pos: 'center 35%' })}
    </div>
  </div>
</div>`));

  /* ---------------- 01 layout ---------------- */
  const S = 1.6; // pb-layout.jpg is the 1500-px working view scaled by 1.6
  const bx = (x0, y0, x1, y1, text, pos) => ({ t: 'box', x0: x0 * S, y0: y0 * S, x1: x1 * S, y1: y1 * S, text, pos });
  P.push(page(PB('Layout'), 'Six layers: power on top, three ground planes under it', `
<div class="cols" style="grid-template-columns:6.9in 1fr">
  <div class="stack">
    ${fig('pb-layout', 'L1, the power layer, plotted from the fabrication data (40 px/mm). Current flows one way: battery in on the left, 5 V out on the right.', {
      marks: [
        bx(25, 140, 212, 420, 'battery in', 'tl'),
        bx(222, 100, 600, 340, 'input eFuse U4 + Q4', 'tl'),
        bx(88, 430, 648, 752, 'LM5146 buck + 3.3 µH', 'tr'),
        bx(880, 245, 1292, 592, 'servo eFuse U1, shunt, INA240', 'bl'),
        bx(712, 75, 1405, 200, '9 servo + radio connectors', 'tr'),
        bx(712, 640, 1405, 752, '', 'tl'),
        bx(1338, 210, 1475, 620, '5 V / GND out', 'tr'),
        bx(170, 755, 650, 790, 'J13 (J12 above): flight controller', 'tr'),
      ] })}
    <div class="grid2" style="grid-template-columns:3.6in 1fr">
      ${fig('pb-exploded', 'The six copper layers, exploded, in Altium\'s layer colours.', { h: '1.95in' })}
      <div class="small">${table([['L1', 'Power, top', '52.9 %'], ['L2', 'Ground', '91.6 %'], ['L3', 'Ground', '91.6 %'], ['L4', 'Signal', '6.4 %'], ['L5', 'Ground', '91.6 %'], ['L6', 'Signal, bottom', '10.2 %']], ['Layer', 'Use', 'Copper'])}</div>
    </div>
  </div>
  <div class="stack small">
    <ul>
      <li><b>Power stays on L1</b> in wide pours that run one way, from the battery edge to the output edge.</li>
      <li><b>Three solid ground planes</b> (L2, L3, L5), signals on L4 and L6.</li>
      <li><b>The buck in one corner:</b> controller, FETs and inductor together; analog and power ground meet at one net tie.</li>
      <li><b>Kelvin sense:</b> the INA240 reads the shunt through two 0 Ω links, not through the pour.</li>
      <li>ESD array and 100 nF on every connector.</li>
    </ul>
    ${fig('pb-built', 'As built: Rev 3 on the bench.', { h: '2.2in' })}
  </div>
</div>`));

  /* ---------------- 01 test: regulation ---------------- */
  P.push(page(PB('Test'), 'Bench test 1: does it regulate?', `
<div class="cols" style="grid-template-columns:1fr 1fr 2.35in">
  <div class="stack">${scope('pb-startup')}${scope('pb-sw')}</div>
  <div class="stack">${scope('pb-loadstep')}${fig('pb-eff', '<b>Efficiency</b> 4 input voltages × 11 loads, measured to the servo headers (eFuse and shunt included).')}</div>
  <div class="stack small">
    <div><div class="kicker">Bench</div>
    <p>KORAD KA3005P supply, RIGOL DHO804 scope, Brymen BM235, and my own DC load (04) as the load. Every test is a Python script that sets limits, runs, logs the data and saves the screen.</p>
    <p class="muted">The load tops out at 1.9 A, so these cover 0–1.9 A of the 15 A rating.</p></div>
    <div><div class="kicker">Result</div>
    ${table([
      ['Output', '5.055–5.063 V; 5 mV over 7.4–22 V in'],
      ['Soft-start', '2.95 ms, 9 mV overshoot'],
      ['Sequencing', 'buck → 5V_PROT → OPGD, no restart into 1.9 A'],
      ['Switching', '308.8 kHz at every load'],
      ['Load step', '67–172 mV dip, settles in 160–430 µs'],
      ['Ripple', '14–15 mVpp vs 8 mV target'],
      ['Efficiency', '94.4 / 93.8 / 92.4 / 91.0 %'],
    ])}</div>
    <p>The loop is stable and well damped at every input voltage. The ripple miss is the 100 µF output capacitors losing half their capacitance at 5 V of DC bias.</p>
    ${fig('pb-bench', 'The bench, with the probe wires soldered to the board.', { h: '1.5in' })}
  </div>
</div>`));

  /* ---------------- 01 test: protection ---------------- */
  P.push(page(PB('Test'), 'Bench test 2: does it protect?', `
<div class="cols" style="grid-template-columns:5.05in 1fr">
  <div class="stack">${scope('pb-hotplug')}${scope('pb-short')}</div>
  <div class="stack small">
    ${table([
      ['UVLO on / off', '5.97 / 5.48 V', '5.97–5.995 / 5.53–5.55 V'],
      ['OVP off / on', '24.86 / 22.79 V', '24.92–24.95 / 23.03–23.05 V'],
      ['Reverse, −22 V', 'blocked', '< 10 µA'],
      ['Servo short', 'limit, 4 retries, latch', '< 0.1 ms trip, 5 retries, latch'],
      ['Current sense', '0.10 V/A', '0.251 V/A'],
    ], ['', 'Design', 'Measured'])}
    <p>Every threshold lands within about 1 % of its design value, reverse polarity is blocked, and a hard short at 22 V in trips, retries and latches with no damage. Three things did not pass:</p>
    ${table([
      ['<span class="tag">F1</span>', '<b>Hot-plug.</b> The battery leads ring the input to 1.8 × VIN: a full 4S pack puts 30.5 V on 30 V parts. The TVS clamps too high to help.'],
      ['<span class="tag">F2</span>', '<b>Load dump.</b> Each eFuse trip dumps the inductor\'s energy into 5 × 4.7 µF: up to ≈ 11.3 V on 10 V capacitors.'],
      ['<span class="tag">F3</span>', '<b>Sense gain.</b> The INA240A2 is 50 V/V; the schematic assumed 20. The flight controller\'s ADC clips at ≈ 3.2 A.'],
    ])}
    <p class="muted">Not tested yet (needs more than 1.9 A): 2–15 A regulation, the 17.8 A limit, a 15 A thermal soak, a real LiPo plug-in.</p>
  </div>
</div>`));

  /* ---------------- 01 deployment ---------------- */
  P.push(page(PB('Deployment'), 'Flown in 2025; what Rev B changes', `
<div class="cols" style="grid-template-columns:2.75in 1fr">
  <div class="stack">${fig('pb-installed', 'In the fuselage, May 2025, with the flight controller and GNSS board on top.', { h: '5.35in' })}</div>
  <div class="stack">
  ${fig('pb-flight', '<b>Aircraft 221</b> at SAE Aero Design 2025, Advanced Class. The board flew the whole season.', { h: '2.7in', pos: 'center 38%' })}
  <div class="grid2 small">
    <div><div class="kicker">Integration miss</div>
    <p>The flight controller (another member's design) came back with its header rows narrower than J12/J13. Checking that the two boards mated was my job as avionics lead, and I missed it. Fixed by rework: a perfboard strip with a header along one edge, and jumper wires.</p>
    <div class="kicker" style="margin-top:.12in">Flown board</div>
    <p>Planned: use the measured 0.25 V/A in firmware, and add a divider so the sense output can't exceed 3.3 V at the ADC.</p></div>
    <div><div class="kicker">Rev B, from the bench findings</div>
    ${table([
      ['F1', '≥ 100 µF low-ESR bulk across the input; lower-clamp TVS and/or 40 V eFuse and FETs'],
      ['F2', '≥ 47 µF bulk next to L1; 16–25 V capacitors on VBUCK_OUT'],
      ['F3', 'INA240A1 (20 V/V) referenced to ground: 0–15 A → 0–1.5 V'],
      ['F4', 'Sense the buck at 5V_PROT: the 23.5 mΩ after the feedback point costs 0.35 V and 5 W at 15 A'],
      ['Test', 'A bigger load to finish 2–15 A, the current limit and a thermal soak'],
    ])}</div>
  </div></div>
</div>`));

  /* ---------------- 02 SoM ---------------- */
  const SOM = n => `<b>02</b> · Flight controller SoM · ${n}`;
  P.push(page(SOM('Render'), 'Flight controller SoM', `
<div class="cols" style="grid-template-columns:6.7in 1fr">
  <div class="stack">
    ${fig('fc-hero', 'Rev A, top side. Rendered from the Altium STEP and Gerbers.', { h: '3.75in' })}
    <div class="grid2">${fig('fc-bottom', 'Bottom: the two Hirose DF17 board-to-board connectors and the microSD.', { h: '1.75in' })}${fig('g-carrier-top', 'The carrier it plugs into (gallery).', { h: '1.75in' })}</div>
  </div>
  <div class="stack small">
    <p>A flight-controller module for UBC AeroDesign: the processor, sensors, storage and power path on one 55 × 40 mm board that plugs into a carrier through two DF17 connectors and a payload board. I led the design and trained a newer member on the power path.</p>
    ${table([
      ['MCU', 'STM32H757XIH6, 400 MHz, ArduPilot'],
      ['IMUs', 'LSM6DSV32X + ICM-42688-P'],
      ['Baros', 'DPS368 + MS5611'],
      ['Mag', 'LIS2MDL'],
      ['Storage', '32 KB FRAM, microSD, ID EEPROM'],
      ['Power', '5 V carrier or USB-C, TPS2116 mux, 1.1 A eFuse, buck + sensor LDO'],
      ['I/O', '16 PWM, 8 UART + USB, 4 I²C, 2 CAN, 5 ADC'],
      ['Board', '8 layers, 150 parts, 22 test pads'],
    ])}
    <p>Each SPI bus carries one IMU and one barometer, so losing a bus still leaves a full pair.</p>
    <p class="muted">Status: Rev A design-complete, not yet fabricated.</p>
  </div>
</div>`, { spec: 'STM32H757 · 55 × 40 mm · 8 layers · 2 IMU · 2 baro · ArduPilot · Altium' }));

  P.push(page(SOM('Layout'), 'Eight layers around a 265-ball BGA', `
<div class="cols" style="grid-template-columns:4.3in 1fr">
  <div class="stack">${fig('fc-layers', 'Every layer on its own, in Altium\'s layer colours.')}</div>
  <div class="stack">
    ${fig('fc-signal', '<b>All signal layers</b> (L1, L3, L6, L8) seen from above, ground planes hidden. ')}
    <div class="grid2">
      ${fig('fc-stack', 'The stack-up, exploded.')}
      <div class="small"><ul>
        <li>Every signal layer is next to a ground plane (L2, L5, L7); L4 is the power plane.</li>
        <li>Sensors on their own 3.3 V LDO rail, separate from the main buck.</li>
        <li>Both DF17 connectors and the microSD on the bottom.</li>
        <li>22 test pads for bring-up: rails, debug, buses.</li></ul></div>
    </div>
  </div>
</div>`));

  /* ---------------- 03 FOC ---------------- */
  const FOC = n => `<b>03</b> · FOC motor controller · ${n}`;
  P.push(page(FOC('Layout'), 'FOC motor controller', `
<div class="cols" style="grid-template-columns:6.4in 1fr">
  <div class="stack">
    ${fig('foc-layers', 'Each layer: L1, L3, L4 and L6 carry signal and power; L2 (and L5, the same) are ground.')}
    <div class="grid2">${fig('foc-signal', 'Signal layers L1, L3, L4, L6 together (red, cyan, green, blue), ground hidden.', { h: '2.7in' })}${fig('foc-hero', 'Rev 1, rendered.', { h: '2.7in' })}</div>
  </div>
  <div class="stack small">
    <p>A single-axis field-oriented-control drive for one joint of a cat-sized walking robot, designed for a 12S bus (56 V max) and 10 A rms per phase.</p>
    ${table([
      ['MCU', 'STM32G431, CAN-FD'],
      ['Gate driver', 'DRV8323S, SPI'],
      ['FETs', '6 × ISC030N10NM6, 100 V'],
      ['Sense', '3 low-side 3 mΩ shunts'],
      ['Bus', '≈ 350 µF, 25 kHz PWM'],
      ['Board', '70 × 70 mm, 6 layers'],
    ])}
    ${fig('foc-photo', 'Rev 1, built.', { h: '1.7in' })}
    <p>Rev 1 is built and runs a motor sensorless to 3000 rpm on a 30 V bench supply. The 56 V design point is not tested yet.</p>
  </div>
</div>`, { spec: '12S bus · 10 A rms · STM32G431 + DRV8323S · 70 × 70 mm, 6 layers · Altium' }));

  P.push(page(FOC('Test'), 'Power stage on the bench: what firmware has to respect', `
<div class="grid2" style="gap:.08in .22in;width:9.4in;margin:0 auto">
  ${scope('foc-id15')}${scope('foc-id7')}${scope('foc-vds')}${scope('foc-hotplug')}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 2.9in;gap:.22in;margin-top:.1in" class="small">
  <div><h3>−10 V on a −7 V pin</h3>
  <p>A day of characterisation at 30 V, with a parked rotor as the load. With current flowing into the phase, the low-side turn-on rings the switch node to −10 V at the gate driver's default gate current. Slowing it to 190 / 380 mA costs 11 ns of edge and removes it (−0.76 V); firmware now starts there and refuses anything faster than 440 / 880 mA.</p></div>
  <div><h3>Short-circuit trip at ≈ 280 A</h3>
  <p>At the lowest VDS threshold (0.06 V) the driver tripped at 22 A, so the threshold is just V / 2.7 mΩ, and the default 0.75 V means ≈ 280 A: no real protection. Now 0.13 V (≈ 48 A cold, 30 A hot). </p>
  <p class="muted">Rev B: a lower-inductance shunt return, a braking clamp, phase-C sense on its own ADC.</p></div>
  <div>${table([
      ['Current sense', 'within 1–2 %, 20–27 mA rms noise'],
      ['Firmware OC trip', '9.5 µs, ADC sample to outputs off'],
      ['Sensorless', '3000 rpm, 50 of 50 starts'],
      ['Thermal', '+10 °C FET case, 10 min at 5 A'],
    ])}</div>
</div>`));

  /* ---------------- 04 DC load ---------------- */
  const EL = n => `<b>04</b> · DC electronic load · ${n}`;
  const g = 24; // px per mm in the Gerber plots
  const pw = (x, y) => [(x - 9.9873) * g, (109.0127 - y) * g];   // power board, pick-and-place mm -> px
  const cw = (x, y) => [(x - 18.9873) * g, (91.0127 - y) * g];   // control board
  const around = (f, x, y, hw, hh, text, pos) => { const [cx, cy] = f(x, y); return { t: 'box', x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh, text, pos }; };
  P.push(page(EL('Layout'), 'DC electronic load', `
<div class="cols" style="grid-template-columns:1fr 1fr 2.6in">
  <div class="stack">${fig('el-power-layout', '<b>Power board</b>, top copper (red) over bottom (blue), plotted from the Gerbers; part positions from the pick-and-place file.', {
      marks: [
        { t: 'box', x0: 500, y0: 400, x1: 1480, y1: 770, text: 'Q1, Q2 IRF530 + 0.2 Ω pairs', pos: 'tl' },
        around(pw, 82.25, 74, 80, 90, 'U3: two loops', 'br'),
        around(pw, 56.25, 39.925, 80, 90, 'U1: V sense', 'tl'),
        around(pw, 75.4, 30, 220, 75, 'shunt + INA240', 'br'),
        around(pw, 85.5, 55, 70, 240, 'P1', 'bl'),
      ] })}</div>
  <div class="stack">${fig('el-control-layout', '<b>Control board</b>, stacked on the power board through P3.', {
      marks: [
        around(cw, 61, 61.25, 150, 150, 'STM32F103', 'tl'),
        { t: 'box', x0: 810, y0: 1090, x1: 1360, y1: 1250, text: 'REF5040 + 12-bit DAC', pos: 'bl' },
        { t: 'box', x0: 40, y0: 1060, x1: 500, y1: 1480, text: '12 → 5 V buck', pos: 'tl' },
        { t: 'box', x0: 960, y0: 1420, x1: 1560, y1: 1790, text: 'USB-C, CH340E', pos: 'tl' },
        around(cw, 85.5, 55, 65, 230, 'P3', 'bl'),
      ] })}</div>
  <div class="stack small">
    <p>A programmable load for testing power supplies and batteries: set a current, and it sinks it. It is the load on the power board's bench tests (01).</p>
    <p>Two boards, stacked. The power board has one op-amp loop per MOSFET, each forcing the voltage on its own 0.2 Ω pair to follow the DAC, so the two FETs share current to 0.1 %. The control board sets the DAC from a 4.096 V reference and reads current back through the INA240.</p>
    ${fig('el-sch', 'The power stage: one loop per MOSFET into a shared 5 mΩ shunt.', { fit: 'contain', style: '' })}
    ${fig('el-heatsink', 'Rev A on its heat-pipe tower.', { h: '1.45in' })}
  </div>
</div>`, { spec: 'Rev A: 2 × IRF530 · STM32F103 · 12-bit DAC · USB-C · 2 boards, 4 layers each · Altium' }));

  P.push(page(EL('Test'), 'Rev A measured: 1.93 A, 36 W, and two predicted faults confirmed', `
<div class="cols" style="grid-template-columns:1fr 1fr 2.45in">
  <div class="stack">${scope('el-step')}${fig('el-envelope', '<b>Operating envelope, measured.</b> On-resistance at low voltage, the gate-drive ceiling at 1.93 A, then the 36 W thermal limit (no fan).')}</div>
  <div class="stack">${scope('el-vsen')}
    <div class="small">${table([
      ['Current', '0–1.93 A (2.04 A hot)'],
      ['Setpoint', '2.5 mA steps, ±7 mA calibrated'],
      ['Readback', '±10 mA of the supply to 1.9 A'],
      ['Sharing', '0.1 % between the FETs'],
      ['Steps', '11–16 µs edges, ≤ 1.5 % overshoot'],
      ['Power', '≈ 36 W continuous, no fan'],
    ], ['', 'Rev A, measured'])}</div>
    ${fig('el-boards', 'Rev A: power board (top) and control board.', { h: '1.75in' })}</div>
  <div class="stack small">
    <p>A schematic review (netlists rebuilt from the Altium files, the power-board errors reproduced in LTspice) predicted the main faults; the bench confirmed them:</p>
    <div><h3>Gate drive capped at 4.1 V</h3>
    <p>The loops run from the 4.096 V reference, so a gate can never pass ≈ 4.1 V. Two IRF530s at that drive top out at 1.93 A: the silkscreen says 10 A.</p></div>
    <div><h3>Voltage readback stuck</h3>
    <p>The difference amplifier's feedback goes to its + input, so the output latches at 3.96 V at any voltage, and drives an MCU pin above its 3.6 V maximum. Fix: swap two resistors.</p></div>
    <div><h3>Rev B</h3>
    <p>Op-amps on a 12 V rail, four TO-247 MOSFETs with a loop each, 4-wire voltage sense into an external ADC: 10 A and 150 W with a fan. Schematic done and simulated; placed, not yet routed.</p></div>
  </div>
</div>`));

  /* ---------------- gallery ---------------- */
  P.push(page('<b>Gallery</b> · Other boards', 'Other boards', `
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.18in .22in">
  ${fig('g-shadow', '<b>Shadow power distribution, 2024.</b> The wiring hub carrying the Cube Orange flight controller, and a power module beside it. Flown at SAE Aero Design West 2024.', { h: '2.3in' })}
  ${fig('g-module', '<b>Shadow power module.</b> One of two: 5 V, 15 A (ISL8117A), hot-swappable dual batteries, voltage and current sensing.', { h: '2.3in' })}
  ${fig('g-shadow-installed', '<b>Shadow, installed.</b> The hub in the fuselage with the Cube Orange and GNSS.', { h: '2.3in' })}
  ${fig('g-carrier', '<b>Carrier board v1, 2026–27.</b> 6 layers; the SoM (02) mates on two DF17 connectors, 8 mm stack height. XT30 in, JST-GH out.', { h: '2.3in' })}
  ${fig('g-micromouse', '<b>Micromouse V2, 2023–24.</b> STM32F411, DRV8833, four IR pairs, IMU and encoders on one board. V1 put the motor inputs on pins with no timer; V2 fixed it.', { h: '2.3in' })}
  ${fig('g-kyogre', '<b>Kyogre and Spirit, 2021–23.</b> Not a board: two seasons as lifting-surfaces lead on AeroDesign\'s airframes, from XFLR5 to the build.', { h: '2.3in' })}
</div>`));

  return P;
};
