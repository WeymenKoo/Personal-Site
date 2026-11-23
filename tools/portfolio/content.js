// The portfolio's pages, in order. Built projects follow one sequence: the real board with its specs
// and purpose, then design and layout, then testing, then use. Numbers come from the projects' reports:
//   power board  github.com/WeymenKoo/AeroDesign-Power-Board (README, bench_test/results/*/notes.txt)
//   FOC          github.com/WeymenKoo/FOC-Motor-Controller (Testing/README.md, Testing/Bench/CHAR_LOG.md)
//   DC load      github.com/WeymenKoo/DC-Electronic-Load (bench_test/REPORT.md, RevB/README.md)
//   SoM          github.com/WeymenKoo/AeroDesign-Flight-Controller-SoM (README.md)
module.exports = ({ fig, scope, text, table, stats, key, kicker, grid, hero, page, layoutMarks, LEGEND, frame, cap }) => {
  const P = [];
  const sec = (n, name, part) => `<b>${n}</b> · ${name} · ${part}`;

  /* ================= cover ================= */
  P.push(page('Hardware portfolio', '', '', `
<div class="cell text">
  <div class="name">Weymen Koo</div>
  <div class="cjk">许梣焕</div>
  <p class="lede">Electrical engineering, UBC (B.A.Sc. 2027). I design, lay out, build and test circuit boards: power electronics, motor control and flight avionics.</p>
  <div class="toc">${table([
    ['01', '<b>AeroDesign power board</b><br>5 V 15 A power distribution. Flown 2025.'],
    ['02', '<b>Flight controller SoM</b><br>STM32H757, 8 layers. Design complete.'],
    ['03', '<b>FOC motor controller</b><br>12S, 10 A rms. Built, running a motor.'],
    ['04', '<b>DC electronic load</b><br>Programmable load. Built, in use.'],
    ['05', '<b>Other work</b><br>Shadow avionics, Micromouse, SolidWorks airframe.'],
  ])}</div>
  <p class="muted" style="margin-top:.18in">Built boards are shown in one order: the board, its design and layout, its test results, then where it is used. Every scope plot is an unedited RIGOL DHO804 screenshot with call-outs drawn on top.</p>
  <div class="contact">kchweymen@gmail.com<br>github.com/WeymenKoo<br>weymenkoo.github.io/Personal-Site</div>
</div>
${fig('pb-photo', '01 · AeroDesign power board', 'Battery to a protected 5 V rail for every servo and radio on a competition aircraft.')}
${fig('fc-hero', '02 · Flight controller SoM', 'Processor, sensors and storage on a 55 × 40 mm module that runs ArduPilot.')}
${fig('foc-photo', '03 · FOC motor controller', 'Three-phase drive for one joint of a walking robot.')}
${fig('el-photo', '04 · DC electronic load', 'A bench instrument I built, then used to test the power board.')}`, 'cover'));

  /* ================= 01 power board ================= */
  const PB = 'AeroDesign power board';
  P.push(hero(sec('01', PB, 'Overview'), PB, '2S–4S in · 5 V 15 A · LM5146 buck · 2 × TPS25983 eFuse · 110 × 60 mm, 6 layers', 'pb-photo', {}, `
${stats([['5 V 15 A', 'one protected rail, design rating'], ['91–94 %', 'efficiency at 1.9 A, 7.4–22 V in'], ['≈ 1 %', 'protection thresholds vs. design'], ['2025', 'flown, SAE Aero Design Advanced Class']])}
<div>${kicker('What it is for')}<p>The power board of UBC AeroDesign's 2025 aircraft. It takes the 2S–4S flight battery and feeds nine servos, the receiver, telemetry, camera and the flight controller, which plugs in on top.</p></div>
<div>${kicker('My role')}<p>Lead designer: requirements, schematic, layout, bring-up and bench characterisation. A clean-sheet redesign after the previous revision did not work.</p></div>`, [
    text(`${kicker('Specifications')}${table([
      ['Input', '2S–4S LiPo, 7–22 V'],
      ['Output', '5 V, 15 A max (design)'],
      ['Buck', 'TI LM5146, 2 × AON7534, 3.3 µH, 300 kHz'],
      ['Input protection', 'TPS25983 eFuse: UVLO 5.97 V, OVP 24.86 V, 17.8 A; reverse-polarity P-FET; TVS'],
      ['Output protection', 'second TPS25983: 17.8 A, retries then latches'],
      ['Sensing', 'servo current: 5 mΩ shunt + INA240'],
      ['Outputs', '9 servo, ELRS, telemetry, CAN, camera'],
      ['Board', '110 × 60 mm, 6 layers'],
      ['Tool', 'Altium Designer'],
    ])}`),
    text(`${kicker('Status')}<p>Built in March 2025 and flown for the whole 2025 season in aircraft 221.</p><p>Characterised on the bench in November 2026 from 0 to 1.9 A: regulation, start-up, transient response and every protection threshold match the design. The same tests exposed three weaknesses, which are designed out in Rev B (page 6).</p>${kicker('In this section')}${table([['p. 3', 'Design: from plan to architecture'], ['p. 4', 'Layout'], ['p. 5', 'Test results'], ['p. 6', 'In the aircraft']])}`),
  ]));

  P.push(grid(sec('01', PB, 'Design'), 'From a chalkboard to one protected power path', 'Requirements → architecture → settings', [
    fig('pb-chalkboard', 'System plan', 'The 2024–25 avionics planned on a chalkboard: flight controller, receiver, radios, camera, and the power budget this board had to meet.'),
    fig('pb-sketch', 'Mechanical concept', 'The stack on paper: flight controller on 2.54 mm headers above the power board, buck converter underneath it.'),
    fig('pb-blocks', 'Architecture', 'Block diagram from the top schematic sheet. Crossed out in red: a second battery with ideal-diode OR-ing and a second buck were dropped. The board as built has one path.'),
    text(`${kicker('Requirements')}<ul>
      <li>2S–4S LiPo input: 7 to 22 V.</li>
      <li>5 V at up to 15 A for nine servos, the receiver, telemetry, camera and flight controller.</li>
      <li>Survive a reversed battery, a live plug-in and a shorted servo lead.</li>
      <li>Report servo current to the flight controller.</li>
      <li>Carry the flight controller on two 1 × 14 headers.</li></ul>`),
    text(`${kicker('Design decisions')}${table([
      ['Buck', 'LM5146 controller, 2 × AON7534 FETs, 300 kHz, type III loop for a 50 kHz crossover.'],
      ['Inductor', '3.3 µH, saturates at 37 A: above the 17.8 A eFuse limit, so the eFuse always acts first.'],
      ['Two eFuses', 'One at the battery, one at the 5 V output: a short there is cut off, retried 4 times, then latched.'],
      ['Sense', '5 mΩ shunt, Kelvin-connected to an INA240.'],
    ])}`),
    text(`${kicker('Protection settings')}${table([
      ['Input UVLO', 'on 5.97 V, off 5.48 V'],
      ['Input OVP', 'off 24.86 V, on 22.79 V'],
      ['Current limit', '17.81 A, 2 ms blanking'],
      ['Input fault', 'latches off'],
      ['Servo fault', '4 retries, 94 ms apart'],
      ['Soft-start', '4 ms'],
      ['Power-good', 'input, buck and output, each to a test pad'],
    ])}`),
  ]));

  P.push(hero(sec('01', PB, 'Layout'), 'Layout: power flows left to right on the top layer', 'Plotted from the fabrication Gerbers · inner layers: L2, L3, L5 solid ground, L4 signal', 'layout-pb', {
    marks: layoutMarks('layout-pb', [
      [1, 'pb', 45.2, 82.9, -30, -230], [2, 'pb', 52.3, 81.8, 30, -210], [3, 'pb', 66.1, 78.8, 60, -260],
      [4, 'pb', 53.2, 53.7, -250, 60], [5, 'pb', 73.5, 53.5, 60, 330], [6, 'pb', 114.5, 64.6, -150, 110],
      [7, 'pb', 132.6, 71.5, 60, -100], [8, 'pb', 73.0, 91.7, 0, -100], [9, 'pb', 120.6, 86.3, 0, -200], [10, 'pb', 144.5, 77.3, 60, -150],
    ]), extra: LEGEND }, `
${key([
  'Battery input pads, V+ and V−',
  'Q4 reverse-polarity P-FET and D23 TVS, right at the entry',
  'U4 input eFuse: UVLO, OVP and the 17.8 A limit',
  'U3 LM5146 with its FETs Q2 / Q3 next to it',
  'L1 3.3 µH and the buck output capacitors',
  'U1 servo-rail eFuse with Q1 as a blocking FET',
  'R1 5 mΩ shunt, Kelvin-routed to the INA240 (U2)',
  'J12 / J13: the flight controller plugs in here',
  'Servo and radio connectors, each with an ESD array',
  '5 V and ground output pads',
])}`, [
    fig('pb-exploded', 'Six-layer stack', 'L1 carries power; L2, L3 and L5 are the same solid ground pour; L4 and L6 carry signals. Copper: 53 % on L1, 92 % on each ground layer.'),
    text(`${kicker('Layout decisions')}<ul>
      <li>High current runs on L1 in wide pours, from the battery pads to the output pads.</li>
      <li>L2, directly under it, is a solid ground plane.</li>
      <li>The buck sits in one corner: controller, FETs, inductor and capacitors together. Analog and power ground meet at one net tie.</li>
      <li>The shunt is sensed through two 0 Ω Kelvin links, not through the pour.</li>
      <li>Each stage has a power-good test pad on the top side for bring-up.</li></ul>`),
  ]));

  P.push(grid(sec('01', PB, 'Test'), 'Test results: start-up, transient response, ripple, switching', 'KORAD KA3005P · RIGOL DHO804 · Brymen BM235 · my DC load (04) · every test scripted in Python and logged', [
    scope('pb-startup', 'The buck ramps in 2.95 ms with 9 mV of overshoot; the servo eFuse then connects the rail, and power-good follows. No restart, also into a 1.9 A load at 7.4 V.'),
    scope('pb-loadstep', 'A 1.54 A step at the lowest input voltage: one 172 mV dip and a smooth recovery. At 22 V in the dip is 67 mV. The loop is stable and well damped.'),
    scope('pb-ripple', '14.0 mVpp on the servo rail at the 308 kHz switching frequency (target: 8 mV; the output capacitors lose capacitance under DC bias).'),
    scope('pb-swfreq', 'The converter holds 308.8 kHz from no load to 1.9 A: discontinuous with diode emulation up to 1 A, continuous at 1.9 A.'),
    scope('pb-swedge', 'At the highest input voltage the switch node peaks at 23.4 V on 30 V FETs. Measured with a 70 MHz scope, so a lower bound.'),
    text(`${kicker('Measured against design')}${table([
      ['Output, no load', '4.994 V', '5.055–5.063 V'],
      ['Line regulation', '–', '5 mV, 7.4–22 V'],
      ['Load regulation', '–', '3–6 mV at the buck'],
      ['Efficiency, 1.9 A', '–', '94.4 % at 7.4 V<br>91.0 % at 22 V'],
      ['Switching', '300 kHz', '308.8 kHz'],
      ['Soft-start', '4 ms', '2.95 ms'],
      ['UVLO on / off', '5.97 / 5.48 V', '≈ 5.98 / 5.54 V'],
      ['OVP off / on', '24.86 / 22.79 V', '≈ 24.9 / 23.0 V'],
      ['Reverse, −22 V', 'blocked', '< 10 µA'],
    ], ['', 'Design', 'Measured'])}<p class="muted">Tested from 0 to 1.9 A, the limit of my load. 2–15 A is the next campaign.</p>`),
  ]));

  P.push(grid(sec('01', PB, 'In use'), 'In use: a full competition season', 'SAE Aero Design 2025, Advanced Class · aircraft 221', [
    fig('pb-stack', 'As a stack', 'How it is used: Flight Controller v2 (a teammate\'s design) plugs into J12 / J13 and takes its 5 V and every servo, radio and camera signal through them. Render from the STEP models.'),
    fig('pb-installed', 'Installed', 'In the fuselage, May 2025: the power board at the bottom of the stack, the flight controller and GNSS board above it, the telemetry radio beside it.'),
    fig('pb-flight', 'Flown', 'Aircraft 221 in the air at SAE Aero Design 2025. The board powered every servo, the receiver, telemetry, camera and flight controller for the whole season.'),
    text(`${kicker('What testing changed for Rev B')}${table([
      ['Input', 'Bulk damping at the input: a live 4S plug-in rings the supply leads to 1.8 × VIN.'],
      ['Buck output', '≥ 47 µF more, and 16 V capacitors: an eFuse trip dumps the inductor\'s energy into too little capacitance.'],
      ['Current sense', 'INA240A1 (20 V/V), ground-referenced: 0–15 A maps to 0–1.5 V. Rev 3 reads 0.25 V/A.'],
      ['Regulation', 'Sense at the servo rail: 23.5 mΩ after the feedback point costs 50 mV at 1.9 A.'],
    ])}`),
    text(`${kicker('What I would do differently')}<p>The flight controller came back with its header rows narrower than J12 / J13, so the two boards did not plug together. Checking that they mated was my job as avionics lead, and I missed it.</p><p>It was fixed by rework: a perfboard strip with a header along one edge, and jumper wires. It flew that way.</p>`),
    text(`${kicker('Still to test')}<p>My load stops at 1.9 A, so these need a bigger one:</p><ul>
      <li>Regulation, efficiency and ripple from 2 to 15 A.</li>
      <li>The 17.8 A current limit and its 2 ms blanking.</li>
      <li>A 15 A thermal soak.</li>
      <li>A real LiPo plug-in through the flight harness.</li></ul>`),
  ]));

  /* ================= 02 flight controller SoM ================= */
  const SOM = 'Flight controller SoM';
  P.push(hero(sec('02', SOM, 'Overview'), SOM, 'STM32H757 · 55 × 40 mm · 8 layers · 2 IMUs · 2 barometers · ArduPilot · design complete, not yet built', 'fc-hero', {}, `
${stats([['55 × 40', 'mm, 8 layers'], ['150', 'parts: 59 top, 91 bottom'], ['2 + 2', 'IMUs and barometers on separate buses'], ['140', 'pins to the carrier, two DF17 connectors']])}
<div>${kicker('What it is for')}<p>A flight computer for UBC AeroDesign, built as a module: processor, sensors, storage and power path on one board that plugs into a carrier board and a payload board.</p></div>
<div>${kicker('My role')}<p>Lead designer: architecture, schematic, layout and manufacturing release. I trained a newer member on the power path. Rev A is design-complete and not yet fabricated, so these are renders from the Altium STEP and Gerbers.</p></div>`, [
    text(`${kicker('Specifications')}${table([
      ['Processor', 'STM32H757XIH6, Cortex-M7, 400 MHz'],
      ['Firmware', 'ArduPilot (ChibiOS)'],
      ['IMUs', 'LSM6DSV32X (SPI1), ICM-42688-P (SPI5)'],
      ['Barometers', 'DPS368 (SPI1), MS5611 (SPI5)'],
      ['Magnetometer', 'LIS2MDL'],
      ['Storage', '32 KB FRAM, microSD, ID EEPROM'],
      ['Power', '5 V from carrier or USB-C, priority mux, 1.1 A eFuse, 3.3 V buck, sensor LDO'],
      ['I/O', '16 PWM, 8 UART + USB, 4 I²C, 2 CAN, 5 ADC'],
      ['Test', '22 test pads'],
      ['Tool', 'Altium Designer'],
    ])}`),
    fig('fc-bottom', 'Bottom side', 'Two Hirose DF17 board-to-board connectors (80 and 60 pins) and the microSD socket. 91 of the 150 parts are on this side.'),
  ]));

  P.push(hero(sec('02', SOM, 'Layout'), 'Layout: eight layers around a 265-ball BGA', 'Layer colours as in Altium · ground planes hidden in the main view', 'fc-signal', {}, `
<div>${kicker('Routing')}<ul>
  <li>Four signal layers: L1, L3, L6, L8. Each one is next to a ground plane (L2, L5, L7); L4 is the power plane.</li>
  <li>The BGA escapes through about 200 vias in pads, epoxy-filled and capped.</li></ul></div>
<div>${kicker('Partitioning')}<ul>
  <li>One IMU and one barometer per SPI bus: losing a bus still leaves a complete pair.</li>
  <li>Sensors run from their own 3.3 V LDO, separate from the main buck rail.</li></ul></div>`, [
    fig('fc-stack', 'Stack-up', 'L1 signal · L2 ground · L3 signal · L4 power · L5 ground · L6 signal · L7 ground · L8 signal. Copper: 86 % on the ground planes, 82 % on the power plane.'),
    fig('fc-carrier', 'How it will be used', 'Mated to the 2026–27 carrier board through the two DF17 connectors, 8 mm apart. The carrier is not my design; it is shown for context.'),
  ]));

  /* ================= 03 FOC motor controller ================= */
  const FOC = 'FOC motor controller';
  P.push(hero(sec('03', FOC, 'Overview'), FOC, '12S bus, 56 V max · 10 A rms per phase · STM32G431 + DRV8323S · CAN-FD · 70 × 70 mm, 6 layers', 'foc-photo', {}, `
${stats([['3000 rpm', 'sensorless closed loop, 30 V bench supply'], ['50 / 50', 'sensorless starts reached closed loop'], ['1–2 %', 'phase-current accuracy vs. a floating DMM'], ['+10 °C', 'FET case, 10 min at 5 A, still air']])}
<div>${kicker('What it is for')}<p>A field-oriented-control drive for one joint of a cat-sized walking robot. Six boards are planned, one per joint, sharing a 12S bus and talking over CAN-FD.</p></div>
<div>${kicker('My role')}<p>Everything on the board: schematic, layout, LTspice models, firmware bring-up and the test campaign. Rev 1 is built and tested to 30 V and 10 A; the 56 V design point is not tested yet.</p></div>`, [
    text(`${kicker('Specifications')}${table([
      ['Bus', '12S LiPo: 44.4 V nominal, 56 V max'],
      ['Phase current', '10 A rms (design target)'],
      ['MCU', 'STM32G431RB, 170 MHz'],
      ['Gate driver', 'TI DRV8323S, SPI, 3 sense amplifiers'],
      ['Power stage', '6 × ISC030N10NM6, 100 V'],
      ['Current sense', '3 × 3 mΩ low-side shunts'],
      ['PWM', '25 kHz, 200 ns dead time'],
      ['Position', 'AS5047P 14-bit magnetic encoder'],
      ['Comms', 'CAN-FD, UART, SWD'],
      ['Tool', 'KiCad, assembled by JLCPCB'],
    ])}`),
    fig('foc-render', 'Top and bottom', 'Render of both sides on standoffs. The encoder sits on the bottom at the board\'s centre, under the motor shaft.'),
  ]));

  P.push(hero(sec('03', FOC, 'Layout'), 'Layout: power stage on one edge, logic on the other', 'Plotted from the fabrication Gerbers · inner layers: L2 and L5 solid ground, L3 and L4 signal and power', 'layout-foc', {
    marks: layoutMarks('layout-foc', [
      [1, 'top', 29.2, 62.5, -150, 175], [2, 'top', 41.4, 70.3, 0, -120], [3, 'top', 32.75, 54.75, 120, 120],
      [4, 'top', 62, 60.5, 110, -150], [5, 'top', 21.75, 44.75, -150, 60], [6, 'top', 48.25, 27.5, 130, -120],
      [7, 'top', 68, 43.5, 60, -110], [8, 'top', 44.75, 11, 150, 95], [9, 'bottom', 40, 40, -120, -120],
    ], [['top', 'L1, top'], ['bottom', 'L6, bottom']]), extra: LEGEND }, `
${key([
  'Three half-bridges: 6 × 100 V FETs in a row',
  'Phase outputs A, B, C and the bus terminals on one edge',
  '3 mΩ low-side shunts directly under each bridge leg',
  'Bulk capacitors, about 350 µF, beside the bridges',
  'DRV8323S next to the bridge: short gate loops',
  'STM32G431, away from the switching edge',
  'LMR36520 buck: bus to 5 V, then an LDO to 3.3 V',
  'CAN-FD, UART, encoder and SWD along the far edge',
  'AS5047P encoder on the bottom, at the centre',
])}`, [
    fig('foc-stack', 'Six-layer stack', 'L1, L3, L4 and L6 carry signal and power; L2 and L5 are identical ground planes. Phase and bus current run in outer-layer pours.'),
    text(`${kicker('What the layout taught me')}<ul>
      <li>At the gate driver's default drive strength the low-side turn-on rang the switch node past the driver's rating. Slowing the edge from 7 ns to 18 ns fixed it; firmware now enforces that setting.</li>
      <li>Phase C has the largest commutation loop and rings most. Rev B gets a lower-inductance shunt return.</li>
      <li>Phase C's current is sampled second on its ADC, which costs 5 % of usable duty. Rev B routes the three so none waits behind another.</li></ul>`),
  ]));

  P.push(grid(sec('03', FOC, 'Test and use'), 'Test results, and the board driving a motor', 'KORAD KA3005P 30 V · RIGOL DHO804 · T-Motor MN601-S as the load', [
    scope('foc-edge', 'High-side turn-on at the gate-drive setting the firmware ships with: a 25.5 ns edge with 0.11 V of overshoot on a 30 V bus.'),
    scope('foc-pwm', 'One 25 kHz period. The sense amplifier settles well inside the low-side window, where the ADC samples; measured current is within 1–2 % of a DMM.'),
    scope('foc-ripple', 'The motor running closed-loop at 2000 rpm: 67 mV p-p of bus ripple between edges, 58–79 mV from 1000 to 3000 rpm.'),
    scope('foc-bemf', 'Motor identification: the flux constant from the coasting back-EMF agrees within 0.5 % with the value stored in the firmware (KV 282).'),
    fig('foc-bench', 'In use: on the bench', 'Rev 1 driving a T-Motor MN601-S: sensorless speed control to 3000 rpm, 50 of 50 starts, and a current-vector position hold.'),
    fig('foc-gui', 'In use: FOCLINK', 'The bench console for bring-up, a PySide6 app over UART: arming, motor identification, spin control and live plots. Safety logic stays in the firmware.'),
  ]));

  /* ================= 04 DC electronic load ================= */
  const EL = 'DC electronic load';
  P.push(hero(sec('04', EL, 'Overview'), EL, 'Rev A · 2 × IRF530 linear stage · STM32F103 · 12-bit DAC, 4.096 V reference · USB-C · two 4-layer boards', 'el-photo', {}, `
${stats([['1.93 A', 'maximum current, Rev A'], ['36 W', 'continuous, no fan'], ['12 µs', 'load-step rise time, ≤ 0.6 % overshoot'], ['±10 mA', 'current readback to 1.9 A']])}
<div>${kicker('What it is for')}<p>A programmable load for testing power supplies and batteries: set a current over USB and it sinks it, steady or as a square wave. It was the load in the power board's bench tests in section 01.</p></div>
<div>${kicker('My role')}<p>A personal project: schematic, layout, firmware, a Python test suite and the characterisation. Rev A is built and in use. Rev B (10 A, 150 W) is designed and simulated; its PCB is placed, not yet routed.</p></div>`, [
    text(`${kicker('Specifications, Rev A')}${table([
      ['Power board', '2 × IRF530, one op-amp current loop per FET, 0.2 Ω source resistors'],
      ['Control board', 'STM32F103, MCP4725 12-bit DAC, REF5040 4.096 V reference'],
      ['Readback', '5 mΩ shunt + INA240'],
      ['Setpoint', '2.5 mA steps, ±7 mA calibrated'],
      ['Interface', 'USB-C (CH340E), Python and a GUI'],
      ['Supply', 'USB, or 12 V through a TPS5430 buck'],
      ['Tool', 'Altium Designer'],
    ])}`),
    text(`${kicker('Status')}<p>Rev A was built in late 2024 and characterised in November 2026. It is my working load up to 1.9 A.</p><p>In the photo: the control board stacked on the power board through a 16-pin header, with the two MOSFETs mounted on a heat-pipe cooler.</p>${kicker('In this section')}${table([['p. 13', 'Layout and the current loop'], ['p. 14', 'Test results, and the load in use']])}`),
  ]));

  P.push(hero(sec('04', EL, 'Layout'), 'Layout: a power board and a control board that stack', 'Plotted from the fabrication Gerbers · part positions from the pick-and-place files', 'layout-el', {
    marks: layoutMarks('layout-el', [
      [1, 'power', 55, 81.2, 0, 130], [2, 'power', 37, 88, -150, -70], [3, 'power', 82.25, 74, 80, -110],
      [4, 'power', 75.4, 30, 110, 110], [5, 'power', 85.5, 55, 105, 0],
      [6, 'control', 61, 61.25, -130, -110], [7, 'control', 64, 42.5, -40, 150], [8, 'control', 29, 39, -60, 150], [9, 'control', 70.5, 19.4, 150, 30],
    ], [['power', 'Power board, 88 × 88 mm'], ['control', 'Control board, 70 × 74.5 mm']]), extra: LEGEND }, `
${key([
  'Q1 and Q2 (IRF530), beside the cut-out for the cooler',
  'Two 0.2 Ω source resistors per FET set each loop\'s gain',
  'Dual op-amp: one current loop per MOSFET',
  '5 mΩ shunt and INA240 for current readback',
  '16-pin header: the two boards stack here',
  'STM32F103 microcontroller',
  '4.096 V reference and the 12-bit DAC it feeds',
  '12 V to 5 V buck for standalone use',
  'USB-C and the USB-UART bridge',
])}`, [
    fig('el-sch', 'One of two identical loops', 'The op-amp drives the gate until the voltage on the FET\'s source resistors equals the DAC setpoint. A loop per FET makes the two share current to 0.1 %.'),
    text(`${kicker('Design notes')}<ul>
      <li>The high-current path is one wide pour around the cut-out, with the solder mask opened over it.</li>
      <li>Linear, not switched: the FETs burn the power, so the thermal path sets the rating. Measured: 0.99 K/W heatsink to ambient.</li>
      <li>Rev A limit: the loops run from the 4.096 V reference, so gate drive stops at 4.1 V and current at 1.93 A.</li>
      <li>Rev B: op-amps on a 12 V rail, four TO-247 FETs, 4-wire voltage sense. Target 10 A and 150 W.</li></ul>`),
  ]));

  P.push(grid(sec('04', EL, 'Test and use'), 'Test results, and the load at work', 'KORAD KA3005P as the source · RIGOL DHO804 · every test a Python script with a safety monitor', [
    scope('el-rise', 'A 1.7 A step: the current rises in 11.6–11.8 µs (10–90 %) with at most 0.6 % overshoot, the same from a 5 V and a 12 V source.'),
    scope('el-fall', 'The falling edge takes 15.7–16.2 µs. The yellow and cyan traces are the two MOSFETs: each loop regulates its own FET, and they share current to 0.1 %.'),
    scope('el-settle', 'At a longer timebase the step is flat after the edge. Clean, repeatable edges are what make the load usable for transient tests on converters.'),
    text(`${kicker('Measured, Rev A')}${table([
      ['Current range', '0–1.93 A (2.04 A hot)'],
      ['Setpoint', '2.5 mA steps, no dead zone'],
      ['Accuracy', '±7 mA after calibration'],
      ['Readback', '±10 mA of the supply'],
      ['Sharing', '0.1 % between the FETs'],
      ['Step, 10–90 %', '≈ 12 µs up, ≈ 16 µs down'],
      ['Overshoot', '≤ 0.6 %, no ringing'],
      ['Minimum voltage', '0.55 V at 1 A'],
      ['Continuous power', '≈ 36 W, no fan'],
    ])}`),
    fig('el-probing', 'Test method', 'Each MOSFET\'s current is read across its own source resistors, with a DMM and the supply as references. Scripts set limits, run, log and save the screen.'),
    fig('pb-bench', 'In use: testing the power board', 'The load (left, on its cooler) on the bench with the AeroDesign power board. Its square wave produced the load transients in section 01.'),
  ]));

  /* ================= 05 other work ================= */
  P.push(grid('<b>05</b> · Other work · Electronics', 'Other electronics', 'Shadow power distribution, 2023–24 · Micromouse, 2023–24', [
    fig('g-hub', 'Shadow wiring hub · 2024', 'The carrier board of UBC AeroDesign\'s 2023–24 aircraft, Shadow: the Cube Orange flight controller, a sensor board and GNSS plug into it, and it distributes power and signals to the airframe.'),
    fig('g-shadow-render', 'Hub and power module', 'The hub with the Cube Orange fitted, beside one of the two power modules I designed: 5 V, 15 A (ISL8117A), hot-swappable dual batteries, voltage and current sensing. Render from the Altium models.'),
    fig('g-hub-installed', 'Installed', 'The hub in Shadow\'s fuselage with the Cube Orange and GNSS on top. I was power and propulsion lead that season.'),
    fig('g-shadow', 'Shadow, the aircraft it flew in', 'Shadow on a test day, 16 March 2024. It flew with this hub and both power modules at SAE Aero Design West 2024, Van Nuys, California.'),
    fig('g-micromouse', 'Micromouse V2 · 2023–24', 'A maze-solving robot on one board: STM32F411, DRV8833, four IR pairs, IMU and encoders. V1 put the motor inputs on pins with no timer; V2 fixed the pinout.'),
    text(`${kicker('Tools I use')}${table([
      ['Design', 'Altium Designer, KiCad, LTspice'],
      ['Firmware', 'C on STM32, ArduPilot / ChibiOS'],
      ['Test', 'Python + PyVISA, scopes, e-loads'],
      ['Mechanical', 'SolidWorks (CSWA), XFLR5'],
    ])}${kicker('<span style="display:block;margin-top:.08in">Industry</span>')}<p>Tesla, Test System Engineer co-op (2025): high-voltage PCBAs and end-of-line test.</p><p>Dometic Marine, Product Design co-op (2024–25): hot-swap protection, ESD testing.</p>${kicker('<span style="display:block;margin-top:.08in">Write-ups, data and source</span>')}<p>weymenkoo.github.io/Personal-Site<br>github.com/WeymenKoo<br>kchweymen@gmail.com</p>`),
  ]));

  P.push(grid('<b>05</b> · Other work · Mechanical design', 'Mechanical design: an airframe in SolidWorks, from model to flight', 'Spirit · UBC AeroDesign 2022–23 Advanced Class · mechanical lead, lifting surfaces and aerodynamics', [
    fig('m-cad', 'Full assembly in SolidWorks', 'Spirit, a blended wing body with a 120 in span: every rib, strap, spar, control surface and the tail modelled as parts and integrated in one assembly. I owned the integration assembly, flaps, tail and control surfaces.'),
    fig('m-review', 'Design review', 'My review of a member\'s outer-wing CAD as lead: thinner straps inside the airfoil, tabs so the covering holds on the undercambered skin, lightening holes, spar holes aligned with the mid wing.'),
    fig('m-parts', 'From CAD to parts', 'Ribs and straps nested from the model and laser-cut in balsa, plywood and carbon fibre, laid out with the carbon spar and the assembly open on the laptop. March 2023.'),
    fig('m-build', 'Assembly', 'Ribs slotted onto their straps (left, the 2021–22 wing), and Spirit\'s outer wings covered, with servos going in (right).'),
    fig('m-built', 'Built', 'Spirit, second airframe, April 2023. The first came out at 22.9 lb against a 20 lb target with the CG too far aft, so it was built again.'),
    fig('m-flight', 'Flown', 'Spirit just after take-off, 15 April 2023. Wing: 4.96 lb built against 5.96 lb in CAD and a 4.5 lb target.'),
  ]));

  return P;
};
