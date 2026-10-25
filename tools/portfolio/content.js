// The portfolio, as data. One file feeds both outputs:
//   the web deck   dusk/portfolio/index.html   (and the PDF printed from it)
//   the PowerPoint WeymenKoo_HardwarePortfolio_2026-11.pptx
//
// Writing rules (from PORTFOLIO_CONTEXT.md): lead with the outcome, numbers
// with units, "My role" names collaborators, failures stay in, cut anything
// you can't defend in an interview.
//
// [[ like this ]] marks a gap for you to fill. It renders in cyan with
// brackets, on the site and in the .pptx, so nothing ships by accident:
//   npm run portfolio:todo   lists every one that's left.

const meta = {
  name: 'Weymen Koo',
  cjk: '许梣焕',
  title: 'Hardware Design Portfolio',
  docId: 'WK-PF-2026',
  rev: 'Rev A',
  updated: 'Nov 2026',
  focus: 'Power electronics · Board-level design · Avionics',
  degree: 'B.A.Sc. Electrical Engineering, UBC · 2027',
  email: 'kchweymen@gmail.com',
  github: 'github.com/WeymenKoo',
  site: 'weymenkoo.github.io/Personal-Site/portfolio',
  pdfName: 'WeymenKoo_HardwarePortfolio_2026-11.pdf',
  // web only: the author card beside the deck
  tagline: 'Designs power and mixed-signal boards, then brings them up on the bench.',
  location: 'Vancouver, BC',
  school: 'UBC Electrical Engineering · 2027',
  personalSite: '../',
};

// web only: the project index above the deck. Each card jumps to a slide (by id);
// gallery tiles that have a photo are added after these automatically.
const cards = [
  { to: '02', title: 'FOC Motor Controller', status: 'wip', statusLabel: 'Bring-up',
    line: 'A 60 V field-oriented drive for a robot joint. Rev 01 spins a motor; Rev B is in review.',
    image: { src: 'img/foc-top.jpg', alt: 'FOC controller Rev 01, top side render' } },
  { to: '03', title: 'AeroDesign Power System', status: 'ok', statusLabel: 'Flown',
    line: 'Two seasons of 5 V, 15 A power for an SAE Aero Design plane: a shoot-through, then a protected rebuild.',
    image: { src: 'img/pb25-photo.jpg', alt: '2025 power board, assembled' },
    long: { href: '../content/projects/avionics/index.html', label: 'Long read' } },
  { to: '04', title: 'Flight Controller SoM', status: 'wip', statusLabel: 'In design',
    line: 'An STM32H757 ArduPilot module, 36 × 55 mm, designed with a junior engineer I mentor.',
    figure: 'fig/som-arch.svg' },
];

// status → dot colour. ok green: shipped / flown · wip cyan: in progress
// sim hollow cyan: simulation only · idle grey: paused / not built · stop red
const slides = [

  /* ================================================================ 00 */
  {
    type: 'cover', id: '00', section: 'Cover',
    image: { src: 'img/foc-render.jpg', w: 1600, h: 900, alt: 'FOC motor controller Rev 01, KiCad render of the top and bottom sides' },
    // callouts: x, y as fractions of the image; label in mono
    callouts: [
      { x: 0.306, y: 0.655, label: 'STM32G431', dx: -40, dy: 150 },
      { x: 0.122, y: 0.44, label: 'DRV8323S', dx: -10, dy: -260 },
      { x: 0.235, y: 0.215, label: '6× ISC030N10NM6 · 100 V', dx: 60, dy: -150 },
    ],
    caption: 'Fig 00 — FOC motor controller, Rev 01 · top and bottom · 70 × 70 mm · 6 layers · KiCad render',
  },

  /* ================================================================ 01 */
  {
    type: 'summary', id: '01', section: 'Summary',
    lede: 'I design power and mixed-signal boards, then bring them up on the bench.',
    sub: 'Fourth-year Electrical Engineering at UBC Vancouver, graduating June 2027. Looking for hardware design roles in power electronics, board-level design, and aerospace and drones.',
    tiles: [
      { letter: 'A', title: 'FOC Motor Controller', status: 'wip', statusLabel: 'Bring-up',
        result: 'Spun a T-Motor MN601-S to 2000 rpm open-loop on Rev 01.', ref: '02' },
      { letter: 'B', title: 'AeroDesign Power System', status: 'ok', statusLabel: 'Flown',
        result: 'Flew in Shadow, 5th overall. Rebuilt with e-fuses after a shoot-through.', ref: '03' },
      { letter: 'C', title: 'Flight Controller SoM', status: 'wip', statusLabel: 'In design',
        result: 'STM32H757 module, 36 × 55 mm, 6 layers. Leading a second designer.', ref: '04' },
    ],
    // ■ core · ◧ partial · '' none     columns: A B C
    skills: [
      ['Power-stage design', 'full', 'full', 'half'],
      ['Mixed-signal / sensing', 'full', 'full', 'full'],
      ['PCB layout, 4–6 layers', 'full', 'full', 'half'],
      ['MCU firmware', 'full', '', ''],
      ['Simulation (LTspice)', 'full', 'half', ''],
      ['Bring-up and test', 'full', 'half', ''],
      ['Leading people', '', 'full', 'full'],
    ],
    tools: 'KiCad · Altium · LTspice · STM32CubeIDE · Python',
    skillsNote: '[[ confirm every cell ]]',
  },

  /* ================================================================ 02 */
  {
    type: 'overview', id: '02', section: 'FOC Motor Controller', partNo: 'WK-FOC-01',
    status: 'wip', statusLabel: 'Bring-up · 2026',
    title: 'FOC Motor Controller',
    problem: 'A 60 V field-oriented controller for a quasi-direct-drive robot joint.',
    image: { src: 'img/foc-top.jpg', w: 800, h: 800, alt: 'FOC controller Rev 01, top side render', fit: 'cover' },
    fig: 'Fig 02.1 — Rev 01, top side · KiCad render [[ swap for a bench photo ]]',
    specs: [
      ['My role', '[[ what you did, solo or with whom ]]'],
      ['Bus', '36–56 V (12S Li-ion) · 60 V absolute'],
      ['Phase', '10 A RMS continuous'],
      ['Sense', '±27.5 A full scale · 3 mΩ shunt · gain 20'],
      ['Control', '25 kHz centre-aligned PWM · 200 ns dead time'],
      ['Silicon', 'STM32G431 · DRV8323S · AS5047P · CAN FD'],
      ['Board', '70 × 70 mm · 6 layers'],
      ['Result', '2000 rpm open-loop I/f at 12 V, T-Motor MN601-S'],
    ],
  },

  /* ================================================================ 03 */
  {
    type: 'story', id: '03', section: 'AeroDesign Power System', partNo: 'WK-PWR-24/25',
    status: 'ok', statusLabel: 'Flown · 2024',
    title: 'AeroDesign Power System',
    problem: 'Two seasons of power for an SAE Aero Design Advanced Class aircraft: what failed, and what changed.',
    columns: [
      { head: '2024 · Shadow', status: 'ok', statusLabel: 'Flown · 5th overall',
        image: { src: 'img/hub-bench.jpg', w: 1000, h: 1000, alt: '2024 wiring hub on the bench with the Cube Orange flight controller seated' },
        specs: [
          ['Buck', 'ISL8117A · 2S–4S → 5 V, 15 A'],
          ['Path', 'Dual battery, ideal-diode OR'],
          ['Board', '4-layer hub · 2-layer modules'],
          ['Lesson', 'A shoot-through killed 4 servos'],
        ] },
      { head: '2025 · Rev 2', status: 'wip', statusLabel: '[[ flown? ]]',
        image: { src: 'img/pb25-photo.jpg', w: 1600, h: 1200, alt: '2025 power board, assembled, top side' },
        specs: [
          ['Buck', 'LM5146 · 7–25 V → 5 V, 15 A'],
          ['Protect', 'TPS25983 e-fuse, input and output'],
          ['Board', '6 layers · V/I telemetry'],
          ['I/O', 'Locking connectors, pinout on silkscreen'],
        ] },
    ],
    role: 'Power & Controls Lead 2023–24 · Avionics Lead 2024–25, ~30 people · 2025 board co-designed with B. Liu [[ who did what ]]',
  },

  /* ================================================================ 04 */
  {
    type: 'overview', id: '04', section: 'Flight Controller SoM', partNo: 'WK-SOM-01',
    status: 'wip', statusLabel: 'In design · 2026',
    title: 'Flight Controller SoM',
    problem: 'An STM32H757 autopilot module for ArduPilot that plugs into a carrier board, built for UBC AeroDesign.',
    figure: { src: 'fig/som-arch.svg', w: 1208, h: 798, alt: 'Block diagram of the flight controller module' },
    fig: 'Fig 04.1 — Architecture, redrawn from the Rev E notes',
    specs: [
      ['My role', 'Lead designer · mentoring a junior designer who owns power and primary sensors'],
      ['MCU', 'STM32H757XIH6 · TFBGA240 · 400 MHz Cortex-M7'],
      ['Sensing', 'IMU + baro on SPI1 · second pair on SPI2, fitted later'],
      ['Bus', 'CAN1 flight · CAN2 payload · TCAN3413'],
      ['Board', '36 × 55 mm · 6 layers · J1 + J2 board-to-board'],
      ['Status', 'Interface freeze 30 Oct 2026 · boards Feb 2027'],
    ],
  },

  /* ================================================================ 05 */
  {
    type: 'gallery', id: '05', section: 'More boards',
    title: 'More boards',
    sub: 'Eight more, one line each.',
    tiles: [
      { name: 'Electronic Load', status: 'idle', statusLabel: 'Paused',
        spec: 'STM32F103 + DAC control · 150 W target · thermally limited at 5 V, 1 A so far',
        image: { src: 'img/eload.jpg', w: 900, h: 900, alt: 'Electronic load control and power boards' } },
      { name: 'Micromouse Rev 02', status: 'wip', statusLabel: '[[ status ]]',
        spec: 'STM32F411 · DRV8833 · IR pulsed at 100 mA for 60 µs · gyro + PD control',
        image: { src: 'img/micromouse.jpg', w: 900, h: 900, alt: 'Micromouse Rev 02 with motors fitted' } },
      { name: 'Flight computers ×5', status: 'ok', statusLabel: 'Done · from 2019',
        spec: 'Four protoboard generations, then my first 4-layer PCB: IMU, baro, logging',
        image: { src: 'img/fc-gen5.jpg', w: 430, h: 430, alt: 'Fifth-generation flight computer PCB during assembly' } },
      { name: 'BMS', status: 'wip', statusLabel: '[[ status ]]',
        spec: 'bq77915 protector · [[ cell count ]]', image: null },
      { name: 'Glowstick V3', status: 'wip', statusLabel: '[[ status ]]',
        spec: 'ESP32-C3 · BQ25628E USB-C charging · audio-reactive LEDs', image: null },
      { name: 'Power Meter', status: 'idle', statusLabel: 'Not built',
        spec: 'STM32F103 · INA211 · MCP2551 CAN', image: null },
      { name: 'PCB Heart', status: 'wip', statusLabel: '[[ status ]]',
        spec: '[[ one line ]]', image: null },
      { name: 'Capstone JY063', status: 'sim', statusLabel: 'Simulation',
        spec: 'Stimulation system · Howland current source · isolated LV rails', image: null },
    ],
  },

  /* ================================================================ A */
  {
    type: 'deep', id: 'A1', short: 'System and current loop', appendix: 'A', section: 'FOC Motor Controller', partNo: 'WK-FOC-01',
    headline: 'A 25 kHz centre-aligned PWM gives the current loop a 40 µs window',
    body: 'Each PWM period the G431 samples the three low-side shunts, runs Clarke and Park, two PI current loops and SVPWM, then updates the timer. The DRV8323S drives six 100 V FETs and amplifies the shunts; the AS5047P reports rotor angle over SPI.',
    figure: { src: 'fig/foc-system.svg', w: 1200, h: 820, alt: 'FOC controller system block diagram and current loop' },
    caption: 'Fig A1.1 — System and current loop · drawn from the Rev 01 schematic',
    specs: [
      ['PWM', '25 kHz centre-aligned · 40 µs period'],
      ['Dead time', '200 ns · [[ set where: DRV8323S or TIM1? ]]'],
      ['ISR time', '[[ measured µs of the 40 ]]'],
      ['Sense', '3 mΩ × gain 20 → ±27.5 A full scale'],
      ['Links', 'FOCLINK/1 on UART · FOCCAN/1 on CAN FD'],
    ],
  },
  {
    type: 'deep', id: 'A2', short: 'Power-stage simulation', appendix: 'A', section: 'FOC Motor Controller', partNo: 'WK-FOC-01',
    headline: 'I simulated the bridge before layout: [[ the one number that changed the design ]]',
    body: 'Five LTspice studies on the power stage, run before routing: switching edges, shoot-through margin at the chosen dead time, gate-drive strength, loop inductance and temperature rise. [[ chose X because Y; rejected Z because W ]]',
    figure: null,
    placeholder: 'LTspice plots S1–S5 · FoC Motor Controller/Documentation/files/',
    caption: 'Fig A2.1 — Double-pulse test, simulated · LTspice',
    table: {
      cols: [['Study', 330], ['Result', 380]],
      rows: [
        ['S1 Double-pulse edges', '[[ rise / fall, overshoot ]]'],
        ['S2 Shoot-through margin', '[[ ns of margin at 200 ns ]]'],
        ['S3 IDRIVE sweep', '[[ chosen setting, why ]]'],
        ['S4 Loop inductance', '[[ nH ]]'],
        ['S5 Thermal', '[[ ΔT at 10 A RMS ]]'],
      ],
    },
  },
  {
    type: 'deep', id: 'A3', short: 'Layout and stackup', appendix: 'A', section: 'FOC Motor Controller', partNo: 'WK-FOC-01',
    headline: 'Three unbroken ground planes give every signal layer a reference next door',
    body: 'Six layers from JLCPCB. L2, L4 and L5 are solid ground; power and signals share L1, L3 and L6 [[ confirm L3 ]]. The high-side drains use via-in-pad, so the bus copper drops straight through instead of detouring around the FETs.',
    figure: { src: 'fig/foc-stackup.svg', w: 908, h: 768, alt: 'Six-layer stackup of the FOC controller' },
    caption: 'Fig A3.1 — Rev 01 stackup · from the KiCad board setup',
    specs: [
      ['Stackup', '6 layers · GND on L2, L4, L5'],
      ['FETs', 'Via-in-pad on the high-side drains'],
      ['Board', '70 × 70 mm · 4 mounting holes'],
    ],
  },
  {
    type: 'deep', id: 'A4', short: 'Bring-up findings', appendix: 'A', section: 'FOC Motor Controller', partNo: 'WK-FOC-01', layout: 'table',
    headline: 'Five bench findings on Rev 01, from bit-shifted SPI to a motor model 2.5× off',
    table: {
      cols: [['#', 60], ['Symptom', 300], ['Root cause', 520], ['Change', 400], ['Evidence', 448]],
      rows: [
        ['01', 'SPI reads bit-shifted', 'DRV8323 SDO is open-drain; R17 pull-up too weak at 2.66 MHz', 'SPI throttled to 332 kHz', 'Stable reads'],
        ['02', 'Current offset 0.15–0.46 A', 'Offset taken in the DRV8323 internal calibration mode', 'Calibrate the amps in normal mode at 0 A', '±1 mV · 11–14 mA rms floor'],
        ['03', 'Phase C current inverted', 'Phase C current-sense wiring reversed', '−1 sign in firmware', '[[ check ]]'],
        ['04', "Pins don't match schematic", 'DRV_ENABLE and encoder CS routed differently from their labels', '[[ fix ]]', '[[ evidence ]]'],
        ['05', 'Motor model off', 'MN601-S phase resistance measured 98 mΩ; datasheet says 39 mΩ', '[[ what changed ]]', '[[ evidence ]]'],
      ],
    },
    caption: 'Table A4.1 — Bench bring-up, Sep 2026 · source: bench log and firmware notes',
    note: 'Rev B: [[ which of these move into hardware? ]]',
  },
  {
    type: 'deep', id: 'A5', short: 'Measured on the bench', appendix: 'A', section: 'FOC Motor Controller', partNo: 'WK-FOC-01',
    headline: '[[ The headline the scope gives you: switch-node overshoot, dead time, bus sag ]]',
    body: 'Measured on the bench at a 12 V bus first, then higher. Each capture uses the same probe setup, photographed, and is saved as CSV and PNG with the conditions in the filename.',
    figure: null,
    placeholder: 'Scope capture · switch node, phase A · 12 V bus',
    caption: 'Fig A5.1 — Switch node, phase A · [[ scope model, probe, bandwidth ]]',
    table: {
      cols: [['Test', 330], ['Result', 380]],
      rows: [
        ['Switch node, each phase', '[[ rise, fall, overshoot, ring Hz ]]'],
        ['Dead time at gate pins', '[[ ns, expect 200 ]]'],
        ['Phase current vs command', '[[ error, open-loop I/f ]]'],
        ['DC bus on a throttle step', '[[ sag + ripple, AC-coupled ]]'],
      ],
    },
  },
  {
    type: 'deep', id: 'A6', short: 'Firmware and GUI', appendix: 'A', section: 'FOC Motor Controller', partNo: 'WK-FOC-01',
    headline: 'A host GUI and two framed protocols make every bench run repeatable',
    body: 'FOCLINK/1 runs over UART and FOCCAN/1 over CAN FD, carrying commands and telemetry in the same frames. The GUI sends setpoints, plots live data and captures scope-style buffers from the board [[ confirm ]]. The 2000 rpm open-loop I/f ramp was logged on 28 Sep 2026.',
    figure: null,
    placeholder: 'GUI screenshot · FoC Motor Controller/Firmware/Foc GUI.png',
    caption: 'Fig A6.1 — Host GUI during an open-loop ramp',
    specs: [
      ['Rev B', 'Targets the ODrive M8325s motor on a 60 V bus'],
      ['Carry over', '[[ fixes from A4 that move into hardware ]]'],
      ['Status', 'In design review'],
    ],
  },

  /* ================================================================ B */
  {
    type: 'deep', id: 'B1', short: 'Power budget', appendix: 'B', section: 'AeroDesign Power System', partNo: 'WK-PWR-24/25',
    headline: 'Worst case: about 18 A of 5 V load, split across two 15 A modules',
    body: 'One aircraft, one 5 V rail for everything: flight controller, cellular video, optical system, sensors and four servos. Competition rules cap the battery at 4S. I sized the power modules from this budget, with the stall current of every servo counted at once.',
    figure: { src: 'img/power-budget.jpg', w: 1440, h: 844, alt: 'Worst-case power budget for the 2024 aircraft, as a flow diagram' },
    caption: 'Fig B1.1 — Worst-case power budget, 2023–24 design review',
    specs: [
      ['Flight ctrl', '3.05 A'],
      ['Cellular', '4.0 A'],
      ['Optical', '0.66 A'],
      ['Sensors', '0.43 A'],
      ['Servos', '4 × 2.5 A'],
      ['Margin', '11.9 A across two 15 A modules'],
    ],
  },
  {
    type: 'deep', id: 'B2', short: '2024 architecture', appendix: 'B', section: 'AeroDesign Power System', partNo: 'WK-PWR-24',
    headline: "One wiring hub replaced the rat's nest: every connection made once, on copper",
    body: 'I split the system the way you would split a body. The wiring hub is the brain: a carrier for the Cube Orange with every servo, radio and sensor connector. The power module is the heart. A small empennage hub in the tail drives the elevator, rudder and tail gear and unplugs for travel.',
    figure: { src: 'img/power-arch.jpg', w: 1440, h: 844, alt: 'Power architecture of the 2024 aircraft Shadow' },
    caption: 'Fig B2.1 — Power architecture of Shadow, 2023–24',
    specs: [
      ['Inputs', 'Kill switch · two 16.8 V packs'],
      ['Links', '2.4 GHz ELRS · 900 MHz telemetry · cellular video'],
      ['FC', 'Cube Orange over MAVLink'],
    ],
  },
  {
    type: 'deep', id: 'B3', short: '2024 boards and result', appendix: 'B', section: 'AeroDesign Power System', partNo: 'WK-PWR-24',
    headline: 'Four-layer hub, two-layer buck modules, and Shadow flew to 5th overall',
    body: 'Hub: vertical signals on top, horizontal and high-current on the bottom, a TVS and 0.1 µF at every connector. Module: an ISL8117A synchronous buck, with the output capacitor sized for two servos stalling at once.',
    figures: [
      { src: 'img/hub-top.jpg', w: 792, h: 672, alt: 'Wiring hub, top side render' },
      { src: 'img/module-render.jpg', w: 877, h: 476, alt: 'Power module render' },
    ],
    caption: 'Fig B3.1 — Wiring hub, top · Fig B3.2 — 5 V 15 A power module · Altium',
    specs: [
      ['Input', '7.4–20 V, 2S–4S with margin'],
      ['Switching', '3.3 µH at 600 kHz · 15.97 A peak'],
      ['Output', '330 µF · ±10.6 mV on a 5 A step'],
      ['Sense', '3 mΩ shunt × 60 → 2.7 V at 15 A'],
      ['Result', 'Flew · 5th overall, Advanced Class'],
    ],
  },
  {
    type: 'deep', id: 'B4', short: 'Failure analysis', appendix: 'B', section: 'AeroDesign Power System', partNo: 'WK-PWR-24', tone: 'fault',
    headline: 'A suspected shoot-through killed four servos, and the board had no way to tell us why',
    body: 'Both switches of the buck half-bridge on at once shorts the input to ground. Nothing on the board could have caught it or recorded it. My own review of the season: "Dismissed a member\'s concern about a critical failure."',
    figures: [
      { src: 'img/fail-shoot.jpg', w: 800, h: 800, alt: 'Damaged power module after the suspected shoot-through' },
      { src: 'img/fail-exposure.jpg', w: 654, h: 654, alt: 'Exposed wiring and connectors on the airframe' },
    ],
    caption: 'Fig B4.1 — After the shoot-through · Fig B4.2 — Exposure to the elements',
    table: {
      cols: [['What failed', 290], ['Fixed in 2025 by', 420]],
      rows: [
        ['No output protection', 'TPS25983 e-fuse, input and output'],
        ['No datalog, no test points', 'V and I sensed, sent over telemetry'],
        ['Cheap connectors', 'Locking I/O connectors'],
        ['Buck IC low on stock', 'LM5146, still 5 V at 15 A'],
        ['Root cause', '[[ confirmed, or still suspected? ]]'],
      ],
    },
  },
  {
    type: 'deep', id: 'B5', short: '2025 redesign', appendix: 'B', section: 'AeroDesign Power System', partNo: 'WK-PWR-25',
    headline: 'Rev 2 was designed from the failure list: protect both ends, measure everything',
    body: 'Redesigned from scratch for the 2024–25 autonomous payload mission, with B. Liu. Same job, 5 V at 15 A, from 7–25 V. [[ who did what: e.g. I did the power stage and layout, B. Liu did ... ]]',
    figure: { src: 'fig/pb25-power.svg', w: 1208, h: 428, alt: 'Power path of the 2025 board' },
    caption: 'Fig B5.1 — Rev 2 power path: protected on both sides of the buck',
    specs: [
      ['Input', '7–25 V · 4S or smaller, per the rules'],
      ['Buck', 'LM5146 controller · 3.3 µH · 5 V, 15 A'],
      ['Protect', 'TPS25983 e-fuse in and out'],
      ['Telemetry', 'Bus V and I to the flight controller'],
      ['Loads', 'Servos, camera, airspeed, GNSS, radios, FC'],
    ],
  },
  {
    type: 'deep', id: 'B6', short: '2025 layout', appendix: 'B', section: 'AeroDesign Power System', partNo: 'WK-PWR-25',
    headline: 'Six layers, three of them ground, under a 15 A buck whose input loop sets the noise',
    body: 'At 15 A the input loop of the buck carries the fastest edges on the board, so it is the loop to keep small. [[ how you placed the input caps and FETs ]] L2 is solid ground directly underneath. [[ the GND-split lesson, in one line ]]',
    figures: [
      { src: 'fig/hot-loop.svg', w: 900, h: 760, alt: 'Buck converter input hot loop, original drawing' },
      { src: 'img/pb25-layout.jpg', w: 1600, h: 900, alt: 'LM5146 power stage layout close-up' },
    ],
    caption: 'Fig B6.1 — Input hot loop, after TI SNVA803 · Fig B6.2 — LM5146 stage, layout',
    specs: [
      ['Stackup', 'PWR · GND · GND · SIG · GND · SIG'],
      ['Hot loop', '[[ loop area or length, mm ]]'],
      ['Back side', 'Every pinout printed on the silkscreen'],
    ],
  },
  {
    type: 'deep', id: 'B7', short: 'Validation', appendix: 'B', section: 'AeroDesign Power System', partNo: 'WK-PWR-25', layout: 'table',
    headline: '[[ Headline from the bench: e.g. ripple and regulation at 5 A ]]',
    table: {
      cols: [['#', 60], ['Test', 420], ['Condition', 440], ['Expected', 380], ['Result', 428]],
      rows: [
        ['01', 'Smoke test', '16 V in, 0.5 A supply limit', 'No faults, 5 V out', '[[ ]]'],
        ['02', 'UV / OV thresholds + recovery', 'Sweep input slowly', 'Off at 5.5 V falling, on at 6 V', '[[ ]]'],
        ['03', 'Line regulation', '8 → 25 V in', '[[ spec ]]', '[[ ]]'],
        ['04', 'Load regulation', '5 Ω and 1 Ω loads: 1 A, 5 A', '[[ spec ]]', '[[ ]]'],
        ['05', 'Output ripple', '1 A and 5 A, short ground spring', '[[ mV pk-pk ]]', '[[ ]]'],
        ['06', 'Load step', 'If a fast load can be rigged', '[[ mV, µs ]]', '[[ ]]'],
        ['07', 'Endurance', '5 A for 1 h, thermocouple', '[[ °C ]]', '[[ ]]'],
      ],
    },
    caption: 'Table B7.1 — Validation against the 2025 test plan · bench, Oct 2026',
    note: 'The test plan was written in 2025, before the team had the gear to run it.',
  },

  /* ================================================================ C */
  {
    type: 'deep', id: 'C1', short: 'Module and carrier', appendix: 'C', section: 'Flight Controller SoM', partNo: 'WK-SOM-01',
    headline: 'Everything flight-critical on a 36 × 55 mm module; everything airframe-specific on the carrier',
    body: 'The module carries the processor, sensors, storage and power conditioning. The carrier only breaks signals out to the aircraft, so a new airframe needs a new carrier, not a new autopilot. [[ confirm the why: replace the Cube Orange? ]]',
    figure: { src: 'fig/som-interface.svg', w: 1200, h: 760, alt: 'Module-to-carrier interface over J1 and J2' },
    caption: 'Fig C1.1 — Module-to-carrier interface',
    specs: [
      ['Flight I/O', 'PWM ×12 · UART ×6 · I²C · ADC · SBUS'],
      ['Payload I/O', 'CAN2 · SPI6 · I²C · GPIO'],
      ['Power in', 'Carrier 5 V or USB 5 V'],
      ['Connectors', 'J1 + J2, board-to-board'],
    ],
  },
  {
    type: 'deep', id: 'C2', short: 'Architecture', appendix: 'C', section: 'Flight Controller SoM', partNo: 'WK-SOM-01',
    headline: 'Room for two IMU + baro pairs on separate SPI buses; the first build fits one',
    body: 'The primary pair (LSM6DSV32X, DPS368) sits on SPI1. A second, different pair (ICM-42688-P, MS5611) has footprints on SPI2 and is not fitted on the first build. Parameters live in FRAM on SPI3; flight logs on microSD over 4-bit SDMMC.',
    figure: { src: 'fig/som-arch.svg', w: 1208, h: 798, alt: 'Flight controller module block diagram' },
    caption: 'Fig C2.1 — Architecture · grey: not fitted on the first build',
    specs: [
      ['MCU', 'STM32H757XIH6 · TFBGA240'],
      ['Magnetometer', 'LIS2MDL'],
      ['Storage', 'FM25V02A FRAM · microSD'],
      ['ID', 'M24C64 board-ID EEPROM'],
      ['CAN', '2 × TCAN3413'],
    ],
  },
  {
    type: 'deep', id: 'C3', short: 'Power tree', appendix: 'C', section: 'Flight Controller SoM', partNo: 'WK-SOM-01',
    headline: 'Carrier power wins over USB, and the sensors get their own LDO',
    body: 'A priority mux takes the carrier 5 V whenever it is present and falls back to USB on the bench. An e-fuse follows the mux. A buck makes 3.3 V for the digital side; a separate LDO feeds the IMU, baro and magnetometer.',
    figure: { src: 'fig/som-power.svg', w: 1200, h: 520, alt: 'Power tree of the flight controller module' },
    caption: 'Fig C3.1 — Power tree',
    placeholder2: 'Floorplan v3 · export from Miro',
    specs: [
      ['Sources', 'Carrier 5 V · USB-C 5 V'],
      ['Digital', 'Buck → 3.3 V'],
      ['Sensors', 'LDO → 3.3 V'],
      ['Placement', 'MCU rotated 90° · [[ floorplan note ]]'],
    ],
  },
  {
    type: 'deep', id: 'C4', short: 'Team and plan', appendix: 'C', section: 'Flight Controller SoM', partNo: 'WK-SOM-01', layout: 'table',
    headline: 'Two designers, split by schematic sheet, gated by reviews',
    table: {
      cols: [['Sheet', 380], ['Owner', 380], ['Gate', 560], ['Status', 408]],
      rows: [
        ['MCU, storage, CAN, interface', 'Weymen', '[[ review gate ]]', '[[ ]]'],
        ['Power tree', 'Junior designer [[ name? ]]', '[[ review gate ]]', '[[ ]]'],
        ['Primary sensors', 'Junior designer', '[[ review gate ]]', '[[ ]]'],
        ['Layout, 6 layers', '[[ ]]', '[[ review gate ]]', '[[ ]]'],
        ['Carrier board', '[[ ]]', '[[ ]]', '[[ ]]'],
      ],
    },
    caption: 'Table C4.1 — Ownership and review gates',
    note: 'Milestones: interface freeze 30 Oct 2026 · boards Feb 2027 · bring-up [[ date ]]',
  },

  /* ================================================================ back */
  { type: 'back', id: 'END', section: 'Contact' },
];

module.exports = { meta, slides, cards };
