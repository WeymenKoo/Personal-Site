---
title: AeroDesign Power Board
subtitle: The 5 V, 15 A power board for UBC AeroDesign's 2025 Advanced Class aircraft.
team: UBC AeroDesign
role: Lead designer: schematic, layout, bring-up
date: 2024–25 season
---

The power board sits between the flight battery and everything else in the aircraft. It takes a 2S–4S LiPo, makes one protected 5 V rail, and distributes it to nine servo outputs, the receiver, the telemetry radio, the camera, the sensors and the flight controller, which plugs into it from above.

![Render of Flight Controller v2 seated on the power board](render-stack.jpg#wide "The power board with Flight Controller v2 plugged in, rendered in Blender from the Altium STEP models and Gerbers.")

I was the lead designer of this board, a clean-sheet redesign after the previous revision did not work. B. Liu is credited on the silkscreen for groundwork from that earlier revision.

**Status:** built and flown in UBC AeroDesign's aircraft in the Advanced Class of SAE Aero Design 2025. Bench-characterised in November 2026 up to 1.9 A: the protection and regulation match the design, and three faults turned up; see [Validation](#validation) at the end.

| | |
|---|---|
| Input | 2S–4S LiPo; input eFuse window `5.97–24.86 V` |
| Output | 5 V, 15 A maximum (design) |
| Buck | TI LM5146 controller, 2 × AON7534 FETs, 3.3 µH, 300 kHz |
| Protection | TPS25983 eFuse on the input and on the servo output · P-channel reverse-polarity FET · TVS diodes · an ESD array on every connector |
| Sensing | Servo-rail current: INA240A2 across a 5 mΩ shunt, to the flight controller's ADC |
| Outputs | 9 PWM servo channels · ELRS receiver · telemetry radio · CAN · ArduCam (SPI) · external power sensing |
| Flight controller | Plugs in through two 1 × 14, 2.54 mm headers (J12, J13) |
| Board | 110 × 60 mm, 6 layers |
| Tools | Altium Designer |
| Designers | W. Koo (lead) · B. Liu (earlier revision) |

## Planning | From the chalkboard

The avionics for the 2024–25 aircraft were planned on a chalkboard first: the flight controller, the receiver, the radios, the camera and the power budget. The stack itself was sketched on paper: the flight controller sitting on 2 × 17, 2.54 mm headers above the power board.

![The 2024–25 avionics system drawn out on a chalkboard: flight controller, receiver, radios, camera, ESC and a power budget](plan-chalkboard.jpg#wide "Planning the avionics on a chalkboard, 5 October 2024.")
![A pen sketch of the flight controller stacked above the power board on 2.54 mm headers](plan-sketch.jpg "The stack, sketched on paper, 20 October 2024.")
![The assembled power board on the bench next to a roll of solder and a pair of tweezers](bench-solder.jpg "The power board on the bench, 22 March 2025.")

## Power flow

![Block diagram from the top schematic sheet, with the dropped blocks crossed out in red](plan-vs-built.jpg#wide "The block diagram on the top schematic sheet. The blocks crossed out in red were dropped from the design.")

The board as built has one path:

1. **Input eFuse** (TPS25983) with reverse-polarity protection, from the battery to `VBATT_PROT`.
2. **LM5146 buck**, from `VBATT_PROT` to `VBUCK_OUT`, 5 V.
3. **Servo output eFuse** (a second TPS25983) and a 5 mΩ current shunt, from `VBUCK_OUT` to `5V_PROT`.
4. **Connectors**: every connector on the board, servo or otherwise, is supplied from `5V_PROT`.

Each stage has a power-good signal brought out to a test pad: `IPGD` (input eFuse), `BKPGD` (buck) and `OPGD` (output eFuse). `OPGD` also drives a status LED through a 2N7002.

The crossed-out blocks are what the design started with: a second battery with its own input eFuse, an LM5050 ideal-diode OR between the two packs, current sensing on each battery input, and a second 5 A buck with its own ideal diode.

## Input protection | Input eFuse and reverse polarity

![Input eFuse schematic sheet](sch-2-input-efuse.jpg#wide "Input eFuse sheet.")

- **Reverse polarity:** a P-channel MOSFET (Infineon BSC030P03NS3, Q4) in the battery path. Its gate is pulled to ground through 100 kΩ and clamped by a 6 V zener.
- **Surge:** a 1.5 kW TVS (38.9 V) across the battery input.
- **eFuse:** TI TPS25983 (U4), set with resistor dividers and capacitors on its pins:

| Setting | Value |
|---|---|
| Undervoltage | on at `5.97 V`, off at `5.48 V` |
| Overvoltage | off at `24.86 V` |
| Current limit | `17.81 A` |
| Transient overcurrent blanking | `2021 µs` |
| Inrush | `0.46 A`, no dV/dt start-up required |
| On a fault | latches off |

- A solder jumper bypasses the eFuse. Pulling `EN/UVLO` below 0.8 V shuts it down.
- A 30 V, 5 A diode (D24) sits between the eFuse output and ground.

## Buck converter | 5 V, 15 A: LM5146

![LM5146 buck schematic sheet](sch-3-buck.jpg#wide "LM5146 buck sheet.")

The design targets, as written on the sheet:

| | |
|---|---|
| Input | `7–30 V` (controller on at `6 V`, off at `5.5 V`) |
| Output | `5 V`, `15 A` maximum |
| Switching frequency | `300 kHz` |
| Soft start | `4 ms` |
| Output ripple | `8 mV` peak-to-peak, with output capacitor ESR ≤ `2 mΩ` |
| Inductor ripple current | `3.7 A` peak-to-peak |
| Loop crossover | `50 kHz` |

- **Controller:** TI LM5146 (U3), synchronous, driving two AON7534 N-channel MOSFETs (Q2 high side, Q3 low side).
- **Inductor:** Codaca CSBX1275-3R3M, 3.3 µH, saturating at 37 A. The sheet records the rule it was picked by: saturation current above the eFuse current limit (17.81 A).
- **Output voltage:** 24.9 kΩ over 4.75 kΩ on the 0.8 V feedback pin, which sets `4.994 V`.
- **Capacitors:** 4 × 4.7 µF ceramic on the input, 5 × 4.7 µF ceramic on the output; a 2.2 Ω + 100 nF RC across the input.
- **Compensation:** a type III network (R15, C44, C46 on `COMP`; R16, R17, C47 on `FB`) for the 50 kHz crossover.
- **Light load:** `SYNCIN` is left unconnected, so the controller runs in diode emulation (discontinuous conduction) at light load.
- **Grounds:** analog ground for the IC reference and power ground for the high-current paths, joined at one net tie.

## Servo output | Output eFuse and current sense

![Servo output eFuse and current sense schematic sheet](sch-4-servo-efuse.jpg#wide "Servo output eFuse and current sense sheet.")

A second TPS25983 (U1) sits between the buck and the connectors:

| Setting | Value |
|---|---|
| Undervoltage | on at `2.99 V`, off at `2.74 V` |
| Overvoltage | off at `7.93 V`, back on at `7.27 V` |
| Current limit | `17.81 A` |
| Transient overcurrent blanking | `2021 µs` |
| Inrush | `1.01 A` |
| On a fault | retries 4 times, `94 ms` apart |

- An AON7534 (Q1) is driven from the eFuse's `DVDT/BGATE` pin.
- An SMCJ12A TVS on the buck side, a Schottky (RSX501L) from the output to ground, and 2 × 100 µF on the output.

**Current sense.** A 5 mΩ, 3 W shunt (R1) carries the whole servo rail. A TI INA240A2 reads it, referenced to mid-supply (2.5 V at 0 A). The sheet assumes a gain of 20 V/V; the A2 is a 50 V/V part, which the bench tests caught (see [Validation](#validation)). The design numbers on the sheet:

| | |
|---|---|
| Full scale | `15 A` → `75 mV` across the shunt → `1.5 V` swing at the output |
| Shunt loss at 15 A | `1.125 W` |
| Output | `SRV_Isns`, to the flight controller's `ADC1` |

The sheet requires a Kelvin connection from the shunt to the amplifier; it is made with two 0 Ω links (R4, R5).

## Connectors

![Connectors schematic sheet](sch-5-connectors.jpg#wide "Connectors sheet.")

| Ref | Pins | Use |
|---|---|---|
| J1–J3, J6–J8 | 3 | Servo outputs, PWM 7, 8, 9, 1, 2, 3 |
| P1–P3 | 3 | Header servo outputs, PWM 6, 5, 4 |
| J4 | 4 | External power sensing: 5 V, `ADC_V2`, `ADC_I2`, GND |
| J5 | 4 | ELRS receiver: 5 V, TX, RX, GND |
| J9 | 4 | CAN: 5 V, CAN P, CAN N, GND |
| J10 | 4 | Telemetry radio: 5 V, TX, RX, GND |
| J11 | 6 | ArduCam: 5 V, SPI (MOSI, MISO, SCK, CS), GND |
| J12, J13 | 14 each | Flight controller interface: PWM 1–9, CAN, UARTs, camera SPI, ADC, 5 V |

Every connector has a 100 nF capacitor on its 5 V pin and a PACDN042 ESD array on its signal lines.

## PCB layout

![Exploded view of the power board's six copper layers, labelled L1 to L6](render-layers.jpg#wide "The six copper layers, in Altium's layer colours.")

| Layer | Use | Copper |
|---|---|---|
| L1 | Power, top | 52.9 % |
| L2 | Ground | 91.6 % |
| L3 | Ground | 91.6 % |
| L4 | Signal | 6.4 % |
| L5 | Ground | 91.6 % |
| L6 | Signal, bottom | 10.2 % |

L2, L3 and L5 are the same solid ground pour. The battery comes in on the V+ and V− pads on one short edge; the 5 V and ground pads are on the other.

![The assembled power board held in a hand, top side, with the FORWARD arrow and the empty flight controller headers](board-in-hand.jpg "Assembled, 1 May 2025.")

## Flight Controller v2 | The flight controller (not my design)

Flight Controller v2 was designed by another member of the avionics team. It is built around an STM32H723ZG, with a BNO055 IMU, a BMP390 barometer, a TCAN1042 CAN transceiver and a u-blox ZED-F9P GNSS board on top. It plugs into the power board's J12 and J13 and takes its 5 V and every servo, radio and camera signal through them.

![Flight Controller v2 seated on the power board](fc-on-power-board.jpg "Flight Controller v2 on the power board, 4 May 2025.")
![The power board and flight controller installed in the fuselage, with the GNSS board on top and a telemetry radio in front](installed-2025.jpg "Installed in the fuselage, 1 May 2025, with the ZED-F9P GNSS board and a Holybro 915 MHz telemetry radio.")

## Rework | The flight controller didn't fit

The connector spacing didn't match. Flight Controller v2's header rows came out narrower than the power board's J12 and J13, so the two boards couldn't plug together. Checking that the two designs mated was my job as avionics lead, and I missed it.

The fix was rework, done on 22 March 2025: a strip of 2.54 mm perfboard with a header on it, soldered along one edge of the flight controller, and fine jumper wires.

![The flight controller from below, with a strip of yellow-green perfboard and a header soldered along one edge, and fine red jumper wires](rework-fc-bottom.jpg "The flight controller from below: the perfboard strip along the top, and the jumper wires.")
![The flight controller from above, with red jumper wires along the header and pins sticking out of the side](rework-fc-top.jpg "From above.")
![The reworked flight controller seated on the power board](rework-fitted.jpg "Seated on the power board.")
![The stack held up from the side, the flight controller above the power board](rework-stack-side.jpg "The stack from the side.")

## SAE Aero Design 2025

The power board and Flight Controller v2 flew in UBC AeroDesign's aircraft, number 221, in the Advanced Class of SAE Aero Design 2025.

![Team members holding aircraft 221 up before a flight](comp-2025-launch.jpg#wide "Aircraft 221 at SAE Aero Design 2025.")

![Aircraft 221 in flight against a clear sky, a flag on the right](comp-2025-flight.jpg#bleed "In flight.")

Results: [SAE Aero Design Advanced Class results (PDF)](https://www.saeaerodesign.com/content/Advanced-Class-Results.pdf).

## Validation | Bench tests

The board flew the 2025 season without bench data. In November 2026 I characterised it on the bench: a KORAD KA3005P supply, a RIGOL DHO804 scope, a Brymen BM235 meter and my own [DC electronic load](../dc-load/index.html), all driven from Python with every test scripted and logged.

![The bench: a bench supply, a scope, the DC load on its heat-pipe heatsink, and the power board with probe wires soldered on](bench-setup.jpg#wide "The bench, November 2026. The power board is at the bottom, with probe wires soldered on.")

The load tops out at 1.9 A, so every output measurement covers 0 to 1.9 A of the board's 15 A rating. The short-circuit test goes far beyond that.

### Measured against the design

| Parameter | Design | Measured |
|---|---|---|
| Input undervoltage, on / off | `5.97 / 5.48 V` | `5.97–5.995 / 5.53–5.55 V` |
| Input overvoltage, off / back on | `24.86 / 22.79 V` | `24.92–24.95 / 23.03–23.05 V` |
| Reverse polarity, −22 V | blocked | under `10 µA` |
| Output, no load | `4.994 V` | `5.055–5.063 V`; `5 mV` line regulation over 7.4–22 V |
| Load regulation, 0 to 1.9 A | – | `3–6 mV` at the buck, about `50 mV` at the servo headers |
| Efficiency at 1.9 A | – | `94.4 / 93.8 / 92.4 / 91.0 %` at 7.4 / 12 / 16.8 / 22 V in |
| Switching frequency | `300 kHz` | `308.8 kHz` at every load |
| Soft start | `4 ms` | `2.95 ms` (10–90 %), `9 mV` overshoot |
| Output ripple at 1.9 A | `8 mV` | `14–15 mV` peak-to-peak |
| Load step, 1.55 A | – | `67–172 mV` dip, `160–430 µs` to settle, well damped |
| Switch-node peak, 22 V in | under `27 V` | `23.4 V` (a minimum: 70 MHz scope) |
| Current-sense sensitivity | `0.10 V/A` | `0.251 V/A` |
| Servo short circuit | limit, 4 retries, latch | trips in under `0.1 ms`, 5 retries, latches; a power cycle recovers it |
| Hot-plug input peak at 7.4 / 12 / 16.8 V | – | `11.6 / 19.7 / 30.5 V` |

Every protection threshold is within about 1 % of its design value. The sequencing is clean, the loop is stable, and the board survived a hard short on the servo rail at 22 V in.

![Efficiency against load current at four input voltages](bench-efficiency.png "Efficiency, measured to the servo headers, so it includes the eFuse and shunt.")
![The 5 V rail and the power-good signals during start-up at 12 V](bench-startup.png "Start-up at 12 V.")

### What the bench found

| | Finding |
|---|---|
| **Major** | **Hot-plug overshoot.** Touching a live supply onto the input rings it to 1.8 × the supply voltage. A full 4S pack (16.8 V) puts `30.5 V` on 30 V-rated parts; the TVS clamps too high to help. |
| **Major** | **Load dump on the buck output.** Each time the servo eFuse trips, the inductor's energy lands on 5 × 4.7 µF: about `11 V` on capacitors rated for 10 V. |
| **Major** | **Current sense gain.** The INA240A2 is a 50 V/V part; the schematic note assumed 20 V/V. The output is `0.25 V/A`, so the flight controller's 3.3 V ADC clips at about `3.2 A`. |
| Moderate | **Servo-path resistance.** The buck's feedback is taken before the eFuse, FET and shunt, which measure `23.5 mΩ`: 50 mV of droop at 1.9 A, about 0.35 V and 5 W at 15 A. |
| Minor | Ripple is `14–15 mV` against an 8 mV target: the 100 µF output capacitors lose about half their capacitance at 5 V. |
| Minor | Load-step recovery is slow but well damped; the dip is `172 mV` at 7.4 V in. |

![Input voltage ringing above the supply voltage when a live supply is connected](bench-hotplug.png "Hot-plug overshoot at three input voltages.")
![Scope capture of the servo rail short circuit: the buck output jumping at each eFuse retry](scope-short-circuit.png "Servo rail shorted at 22 V in. The buck output (cyan, 5 V/div) jumps at each retry.")
![The current-sense output against load current, a straight line at 0.251 V per amp](bench-current-sense.png "Servo current sense: 0.251 V/A, not the 0.10 V/A designed.")
![The voltage drop from the buck output to the servo headers against load current](bench-servo-drop.png "Drop from the buck to the servo headers: 23.5 mΩ.")
![The 5 V rail dipping and recovering when the load steps by 1.55 A](bench-loadstep.png#wide "Load step, 0.1 to 1.8 A, at three input voltages.")

### Not tested

These need a load above 1.9 A:

- Regulation, efficiency, ripple and switch-node stress from 2 to 15 A
- The `17.81 A` current limit and its 2 ms blanking
- A 15 A thermal soak
- A real LiPo plug-in through the flight harness

### Fixes

For the flown board:

1. **Current sense:** correct the gain in firmware to 0.25 V/A, and add a divider so the signal cannot exceed 3.3 V at the flight controller's ADC.
2. **Buck output:** add at least 47 µF of bulk capacitance next to the inductor, and swap the 10 V capacitors for 16 V parts.
3. **Input:** add at least 100 µF of low-ESR capacitance across the input, then re-measure the 4S hot-plug.

The next revision takes the same three fixes into the design, moves the feedback point to the servo rail, and gets tested at full current on a bigger load.

Schematic, test log, scripts, raw data and every scope capture: [github.com/WeymenKoo/2025-Power-Board](https://github.com/WeymenKoo/2025-Power-Board).
