---
title: FOC Motor Controller
subtitle: A motor controller for one joint of a cat-sized walking robot.
date: Rev 1 · 2026
---

70 × 70 mm, six layers, built for a 12S battery. One board drives one joint. Six of them will share the battery and talk to each other over CAN-FD.

![Render of two boards on brass standoffs, one top side up and one flipped](render-pair.jpg#wide "Top and bottom, rendered in Blender from the KiCad board.")

**Does it work?** On the bench, yes: at 30 V and up to 10 A per phase it spins a motor, measures its own current and shuts itself off when it should. It hasn't run on the 12S battery, at full current or under load yet, and the bench found five things Rev 2 has to fix.

**Who did what.** The electrical design, the bench work and the Rev 2 decisions are mine. The firmware and the bench GUI were written by Claude (Anthropic's AI model), which also ran the scripted bench tests; I reviewed its work and set the limits saved to the board.

## Rev 1 | What it is

![The assembled Rev 1 board, top side, on a light background](photo-rev1.jpg "Rev 1, assembled by JLCPCB.")

![Top side render: three half-bridges, bulk capacitors, DRV8323S and STM32G431](cover.jpg "Top: the bridge on one edge, the logic on the other.")
![Bottom side render: power bus, phase pads and the AS5047P encoder](render-bottom.jpg "Bottom: the encoder sits right under the motor shaft.")

| | |
|---|---|
| Battery | 12S lithium, `50.4 V` full |
| Current | `10 A` RMS per phase (design target) |
| Brain | STM32G431 and a DRV8323S gate driver |
| Power stage | 6 Infineon 100 V MOSFETs |
| Position | AS5047P magnetic encoder, on the board |
| Board | 70 × 70 mm, 6 layers, KiCad |

![The board on its 3D-printed test upright with the ODrive M8325s motor behind it](bench-board-side.jpg#wide "On the test upright with the motor it's meant for.")

## Nov 2026 | Does it work?

One day on the bench with a 30 V supply, a scope and a small drone motor standing in for the real one.

![Bench setup: the Rev 1 board and the motor on a cutting board, a scope, a bench supply and a meter](bench-setup-nov.jpg#wide "The bench, 22 November 2026.")

<div class="ar-stats">
<div><b>3000 rpm</b><span>spun with no encoder, unloaded</span></div>
<div><b>50 / 50</b><span>clean starts without the encoder</span></div>
<div><b>10 A</b><span>held per phase at 30 V</span></div>
<div><b>1–2 %</b><span>current reading, against a meter</span></div>
</div>

![FOCLINK, the bench console, booting up and then showing the dashboard](gui-boot.gif#wide "FOCLINK, the bench console, booting. It only asks; the firmware decides what's allowed.")

## Findings | What failed, and why

<table class="ar-fix">
<thead><tr><th>What broke</th><th></th><th>Why, and the fix</th></tr></thead>
<tbody>
<tr><td>Switching rang a pin to −10 V. It's rated for −7 V.</td><td>→</td><td>The gate driver powers up at its fastest setting. Slowed down, the same edge rings to −0.8 V.</td></tr>
<tr><td>Short-circuit protection was set to 280 A.</td><td>→</td><td>Another power-on default. Now about 48 A.</td></tr>
<tr><td>Braking pumped a 12 V supply to 23 V.</td><td>→</td><td>A braking motor is a generator, and the energy has nowhere to go. Firmware backs off now; Rev 2 gets a braking resistor.</td></tr>
<tr><td>One phase goes blind near full throttle.</td><td>→</td><td>It's measured a moment too late. Firmware rebuilds it from the other two; Rev 2 fixes the routing.</td></tr>
<tr><td>No emergency stop.</td><td>→</td><td>The bench supply's switch was the E-stop. Rev 2 gets a real one.</td></tr>
</tbody>
</table>

![Scope capture flipping between the default gate drive, ringing to −10 V, and the slowed one at −0.8 V](fix-gate-drive.gif#wide "The first fix, before and after.")

## Design | Layout

![The FOC controller layout plotted from the fabrication Gerbers, top and bottom, with nine numbered call-outs and a key](layout-annotated.png#wide "Power stage on one edge, logic on the other.")

![Exploded view of the six copper layers](layer-stack.jpg#wide "The six copper layers.")

## Rev 2 | Next

Rev 2 takes those five fixes. Before that, Rev 1 still has to see the 12S battery, full current, the encoder and a real load on the shaft, and then six boards talking on one bus.

Every measurement, scope capture and the full Rev 2 list are in the [repository](https://github.com/WeymenKoo/FOC-Motor-Controller#bench-session-22-november-2026).
