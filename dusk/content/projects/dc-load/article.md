---
title: DC Electronic Load
subtitle: A programmable load for testing power supplies and batteries.
team: Personal project
role: Design, layout, simulation
date: 2024 – present
---

An electronic load pulls a set current from whatever you plug into it, so you can see how a power supply holds up. I built Rev A in late 2024 and finally measured it properly in November 2026.

![Rev A on the bench: the control board stacked on the power board, on a heat-pipe tower heatsink](rev-a-on-heatsink.jpg#wide "Rev A on a heat-pipe tower heatsink, November 2026.")

**Does it work?** Yes, up to 1.93 A and about 36 W. The silkscreen says 10 A. The bench found why it stops short, and Rev B is designed around that.

![The boards bare on a desk, then stacked, then on the heatsink, then on the bench](story.gif#wide "December 2024 to November 2026.")

## Rev A | What it is

Two boards. The control board has a microcontroller, a DAC to set the current, and USB-C to a GUI on the laptop. The power board has two MOSFETs, each with its own op-amp loop that holds its current to the setpoint, and a heatsink to burn the power off.

![The Rev A power board and control board side by side](rev-b-boards.jpg "The two boards, December 2024.")
![The control board held up in front of its layout](rev-b-control.jpg "The control board, in front of its layout.")

## Nov 2026 | Does it work?

![The bench: a scope, a bench supply and a meter beside the load on its heatsink](bench-setup.jpg "The bench.")
![Close-up of the stacked boards on the heatsink](rev-a-closeup.jpg "The stack, probed.")

<div class="ar-stats">
<div><b>1.93 A</b><span>the most it will pull</span></div>
<div><b>36 W</b><span>continuous, no fan</span></div>
<div><b>12 µs</b><span>load steps, no ringing</span></div>
<div><b>10 mA</b><span>current readback error, worst case</span></div>
</div>

![The operating envelope: current against input voltage, bounded by the on-resistance, the gate-drive ceiling and the thermal limit](bench-envelope.png#wide "What it can do: current against the voltage it's connected to.")

![Labelled scope capture of a 0.1 to 1.8 A step, with the 11.6 µs rise marked](scope-step.png#wide "A load step from 0.1 to 1.8 A: fast and clean, both MOSFETs tracking.")

It's been a working tool since: it was the load for the [AeroDesign power board's bench tests](../power-board/index.html).

## Findings | What failed, and why

<table class="ar-fix">
<thead><tr><th>What broke</th><th></th><th>Why, and the fix</th></tr></thead>
<tbody>
<tr><td>It stops at 1.93 A, not 10 A.</td><td>→</td><td>The op-amps run from a 4.096 V reference, so they can't drive the MOSFET gates any higher. Rev B gives them a 12 V rail.</td></tr>
<tr><td>Voltage readback is stuck at 3.98 V, whatever's connected.</td><td>→</td><td>Two resistors swapped in the schematic turned the amplifier into a latch. Swap them back.</td></tr>
<tr><td>Every setpoint reads 8 % low.</td><td>→</td><td>6.6 mΩ of copper in the return path counts as sense resistance. Found with a meter, one trace segment at a time.</td></tr>
<tr><td>At power-up, it asked for 5.6 A before the microcontroller even started.</td><td>→</td><td>The DAC remembers its last value. Zeroed, and the firmware checks it at every boot.</td></tr>
</tbody>
</table>

![Requested against delivered current, flattening at 1.93 A](bench-current-ceiling.png "Ask for more, get 1.93 A.")
![Labelled scope capture of the voltage-sense output at 3.96 V with 20 V on the input](scope-vsen.png "20 V in, and it should read 2.0 V. It reads 3.96.")

## Rev B | The next board

Every one of those is fixed in the design: full gate drive, four bigger MOSFETs with a blower, a voltage sense that works, and protection in hardware instead of firmware. The target is 10 A and 150 W. The schematic is done and simulated, every part is placed, and routing comes next.

The hardware, firmware, GUI, test scripts and the full bench report are in the [repository](https://github.com/WeymenKoo/DC-Electronic-Load).
