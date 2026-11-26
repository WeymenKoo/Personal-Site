---
title: DC Electronic Load
subtitle: A programmable load for testing power supplies and batteries.
team: Personal project
role: Design, layout, simulation
date: 2024 – present
---

An electronic load pulls a set current from whatever you plug into it, so you can see how a power supply holds up. I built Rev A in late 2024 and finally measured it properly in November 2026.

**Does it work?** Yes, up to 1.93 A and about 36 W. The silkscreen says 10 A. The bench found why it stops short, and Rev B is designed around that.

## Rev A | The board

![Rev A on the bench: the control board stacked on the power board, scope probes clipped on, a scope glowing behind](rev-a-hero.jpg#wide "Rev A, November 2026: the control board stacked on the power board, on a heat-pipe tower heatsink.")

Two boards. The control board has a microcontroller, a DAC to set the current, and USB-C to a GUI on the laptop. The power board has two MOSFETs, each with its own op-amp loop that holds its current to the setpoint, and the heatsink burns the power off.

![The Rev A power board and control board side by side on a wooden desk](rev-b-boards.jpg "Fresh from the fab, December 2024. Power board top, control board bottom.")
![The two boards stacked](rev-b-stack.jpg "Stacked, December 2024.")

![The boards on a CPU cooler on the bench, wired to a supply and an ST-Link](rev-b-bench.jpg "First bring-up, December 2024.")
![Close-up of the stacked boards on the heatsink](rev-a-closeup.jpg "On the heat-pipe tower, November 2026.")

## Nov 2026 | Bench test

Almost two years later, a proper day on the bench: a scope, a bench supply as the thing being tested, a meter and a thermocouple, all run from Python scripts with a safety monitor.

![The bench: a scope, a bench supply and a meter beside the load on its heatsink](bench-setup.jpg "The bench.")
![A thermocouple taped to the heatsink next to the MOSFET, under a scope probe](bench-thermocouple.jpg "A thermocouple on the heatsink, for the thermal run.")

![A hand holding a scope probe on the board, the supply and meter behind](bench-probing.jpg#wide "Probing the gates.")

<div class="ar-stats">
<div><b>1.93 A</b><span>the most it will pull</span></div>
<div><b>36 W</b><span>continuous, no fan</span></div>
<div><b>12 µs</b><span>load steps, no ringing</span></div>
<div><b>10 mA</b><span>current readback error, worst case</span></div>
</div>

![The operating envelope: current against input voltage, bounded by the on-resistance, the gate-drive ceiling and the thermal limit](bench-envelope.png#wide "What it can do: current against the voltage it's connected to.")

![Labelled scope capture of a 0.1 to 1.8 A step, with the 11.6 µs rise marked](scope-step.png "A load step from 0.1 to 1.8 A: fast and clean, both MOSFETs tracking.")
![Heatsink temperature over a 23-minute run at 10, 20 and 30 W, with the fitted thermal model](bench-thermal.png "The thermal run: 10, 20 and 30 W for three minutes each, no fan.")

It's been a working tool since: it was the load for the [AeroDesign power board's bench tests](../power-board/index.html).

## Findings | What failed, and what I learned

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

What I took from it:

- **Check what drives a part, not just the part.** The MOSFETs were fine; the rail feeding their gates wasn't.
- **Copper is a resistor.** When you're sensing in milliohms, the trace back to the connector matters as much as the shunt.
- **Know what every part does at power-up,** before any code runs.

## Design | Layout and schematic

![The e-load layout plotted from the fabrication Gerbers: the power board and the control board side by side, with nine numbered call-outs and a key](layout-annotated.png#wide "A power board and a control board that stack.")

![The power stage schematic: two op-amp loops, each driving one MOSFET with its source resistors, into a shared shunt](sch-power-stage.png#wide "The power stage: one op-amp loop per MOSFET. The 4.096 V supply on these op-amps is the 1.93 A ceiling.")

![The DAC and the 4.096 V reference](sch-dac-reference.png "The DAC and its reference.")
![The voltage-sense difference amplifier and the current-sense amplifier](sch-sense.png "Voltage and current sense. The voltage amplifier is the one with the swapped resistors.")

## Rev B | The next board

Every one of those is fixed in the design: full gate drive, four bigger MOSFETs with a blower, a voltage sense that works, and protection in hardware instead of firmware. The target is 10 A and 150 W. The schematic is done and simulated, every part is placed, and routing comes next.

The hardware, firmware, GUI, test scripts and the full bench report are in the [repository](https://github.com/WeymenKoo/DC-Electronic-Load).
