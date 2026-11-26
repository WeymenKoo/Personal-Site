---
title: AeroDesign Power Board
subtitle: The 5 V, 15 A power board for UBC AeroDesign's 2025 Advanced Class aircraft.
team: UBC AeroDesign
role: Lead designer: schematic, layout, bring-up
date: 2024–25 season
---

It sits between the flight battery and everything else in the aircraft: every servo, the receiver, the radios, the camera and the flight controller, which plugs in on top.

![Render of Flight Controller v2 seated on the power board](render-stack.jpg#wide "The power board with Flight Controller v2 plugged in, rendered in Blender.")

**Does it work?** It flew the whole 2025 season. A year later I put it on the bench: everything it was designed to do, it does, and three things I didn't design for turned up.

I was the lead designer, a clean-sheet redesign after the previous revision didn't work. B. Liu is credited on the silkscreen for groundwork from that earlier revision.

![From a chalkboard plan to a pen sketch, a render, the board in hand, installed in the fuselage and the aircraft in flight](story.gif#wide "From the chalkboard to the air, October 2024 to May 2025.")

## What it is

A 2S–4S battery comes in. A protected 5 V rail, rated for 15 A, goes out to nine servos and everything else. There's an electronic fuse on the way in and another on the way out, so a short on the servo side can't take the flight controller down with it.

| | |
|---|---|
| In | 2S–4S LiPo |
| Out | `5 V`, `15 A` |
| Protection | eFuse on the input and on the servo rail, reverse-polarity FET |
| Extras | Servo current sensing, power-good signals and a status light |
| Board | 110 × 60 mm, 6 layers, Altium |

![The assembled power board held in a hand, top side](board-in-hand.jpg "Assembled, 1 May 2025.")
![Exploded view of the power board's six copper layers](render-layers.jpg "The six copper layers.")

## Rework | The flight controller didn't fit

Flight Controller v2, designed by a teammate, came out with its header rows narrower than mine. The two boards couldn't plug together. Checking that was my job as avionics lead, and I missed it. The fix, on 22 March 2025: a strip of perfboard and fine jumper wires.

![The flight controller from below, with a strip of perfboard and fine red jumper wires](rework-fc-bottom.jpg "The fix, from below.")
![The reworked flight controller seated on the power board](rework-fitted.jpg "And seated.")

## SAE Aero Design 2025

![Team members holding aircraft 221 up before a flight](comp-2025-launch.jpg#wide "Aircraft 221 at SAE Aero Design 2025.")

![Aircraft 221 in flight against a clear sky, a flag on the right](comp-2025-flight.jpg#bleed "It flew.")

Results: [SAE Aero Design Advanced Class results (PDF)](https://www.saeaerodesign.com/content/Advanced-Class-Results.pdf).

## Nov 2026 | Does it work?

The board flew a season without ever being bench-tested. In November 2026 I fixed that, with my own [DC load](../dc-load/index.html) as the load.

![The bench: a bench supply, a scope, the DC load on its heatsink, and the power board with probe wires soldered on](bench-setup.jpg#wide "The bench, November 2026.")

<div class="ar-stats">
<div><b>1 %</b><span>every protection threshold, against the design</span></div>
<div><b>91–94 %</b><span>efficient at 1.9 A</span></div>
<div><b>0.1 ms</b><span>to cut off a dead short on the servo rail</span></div>
<div><b>15 mV</b><span>of ripple on the 5 V rail</span></div>
</div>

![Efficiency against load current at four input voltages](bench-efficiency.png "Efficiency, measured all the way to the servo headers.")
![The 5 V rail and the power-good signals during start-up](scope-startup.png "Start-up: a clean ramp, then each stage reports good, in order.")

My load tops out at 1.9 A, so everything from 2 to 15 A is still untested.

## Findings | What failed, and why

<table class="ar-fix">
<thead><tr><th>What broke</th><th></th><th>Why, and the fix</th></tr></thead>
<tbody>
<tr><td>Plugging in a full 4S pack puts 30.5 V on 30 V parts.</td><td>→</td><td>The battery leads and the input capacitors ring. A bulk capacitor across the input damps it.</td></tr>
<tr><td>Every time the servo fuse trips, 10 V capacitors see up to 11.3 V.</td><td>→</td><td>The buck's inductor dumps its energy with nowhere to go. More capacitance there, and 16 V parts.</td></tr>
<tr><td>Servo current reads 2.5 times too high.</td><td>→</td><td>The amplifier is a 50× part; the schematic assumed 20×. Firmware corrects it; Rev B uses the 20× part.</td></tr>
</tbody>
</table>

![Scope capture of the 16.8 V hot-plug, peaking at 30.5 V against a 30 V rating line](scope-hotplug.png "Plugging in a full pack: 30.5 V.")
![Scope capture of the servo rail short circuit: the fuse retrying five times, then latching](scope-short-circuit.png "A dead short on the servo rail: five retries, then off. It survived.")

The schematic, every scope capture, the test log and the raw data are in the [repository](https://github.com/WeymenKoo/AeroDesign-Power-Board).
