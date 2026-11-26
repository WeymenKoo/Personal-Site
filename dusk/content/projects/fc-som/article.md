---
title: Flight Controller SoM
subtitle: The brain of UBC AeroDesign's next aircraft, on a module the size of a matchbox.
team: UBC AeroDesign
role: Lead designer: architecture, schematic, layout, manufacturing release
date: Rev A · Nov 2026
---

A 55 × 40 mm, 8-layer flight controller that runs ArduPilot. It plugs into a carrier board through two board-to-board connectors, so the carrier can change with the aircraft and the brain stays the same.

![Render of the flight controller SoM, top side](cover.jpg#wide "Top side: STM32H757, USB-C, SWD header, boot and reset buttons.")

**Does it work?** Not known yet. The design is finished, checked and exported, and it gets ordered together with the carrier board.

**My role:** I led the design: the architecture, the schematic, the layout and the manufacturing release. I brought Lachlan Biersteker, a newer member, onto the board to train him. He selected the eFuse, the buck and the LDO under my review and did early routing, which I took over and finished.

![The module turning: top, angled bottom, bottom, and a pair side by side](turn.gif#wide "Rendered in Blender from the Altium model and the fabrication files.")

## What it is

| | |
|---|---|
| Processor | STM32H757, 400 MHz |
| Firmware | ArduPilot |
| Sensors | 2 IMUs, 2 barometers, a magnetometer |
| Storage | FRAM for settings, microSD for logs |
| I/O | 16 servo outputs, 8 serial ports, 2 CAN buses |
| Board | 55 × 40 mm, 8 layers, 150 parts on both sides |

Two of everything that matters: each IMU and barometer pair sits on its own bus, so one bus failing still leaves a complete set. It also has 22 test pads for bring-up.

![Bottom side at an angle: the two connectors and the microSD socket](bottom-angle.jpg#wide "Bottom: the two board-to-board connectors and the microSD socket.")

## Inside | Eight layers

![Exploded view of the copper layers, labelled L1 to L8](layer-stack.jpg#wide "The copper layers, exploded.")

![The four signal layers overlaid, seen from above](all-signal-layers.jpg#wide "All four signal layers, seen from above.")

## Next | Bring-up

When it arrives, in this order:

- [x] Design checked: zero rule violations, manufacturing files checked against the board
- [ ] First power on USB, current-limited
- [ ] Debugger connects, clocks come up
- [ ] ArduPilot boots and finds every sensor
- [ ] On the carrier: servos, radios, CAN

The schematic, the 3D model, the ArduPilot board files and the manufacturing package are in the [repository](https://github.com/WeymenKoo/AeroDesign-Flight-Controller-SoM).
