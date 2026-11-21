---
title: Rovers
subtitle: A six-wheel lockdown rover inspired by the Mars rovers, rebuilt once, then a four-wheel one at university.
team: Individual work
role: CAD, 3D printing, wiring, code
date: Mar 2020 – Feb 2023
layout: gallery
---

A small six-wheeled RC rover, built from a lunchbox and aluminium extrusion. It was meant to drive itself eventually, at a more laid-back pace. It let me experiment with DC motor drivers and programming. The autonomous part turned out more complex than I expected, so I put it on hold. As it stands, it's an over-engineered Arduino RC car.

| | |
|---|---|
| v1 · Mar 2020 | Mostly 3D printed, rocker-bogie, four steering servos |
| v2 · Mar 2021 | Aluminium extrusion chassis, plastic electronics box |
| Drive | DC motors on two BTS7960 drivers, Arduino |
| Navigation | GPS and magnetometer, for ArduPilot |
| Rover 2 · 2022 | Four wheels, designed in SolidWorks |

## Mar 2020 | A 90% printed rover

It was lockdown, so I drew up a rover in Fusion 360 that would be about 90% 3D printed. It was inspired by the Mars rovers. This is the project where I spent the most time with my 3D printer and with Fusion 360.

![The rover's Fusion 360 model: a box body on six wheels with rocker-bogie legs](cad.jpg#wide "The Fusion 360 model.")

## Printing it

![A new 3D printer in its foam-lined box](printer-box.jpg "The printer, September 2019.")
![The printer's hot end over the bed, mid-print](printer-printing.jpg "Printing.")

![Grey printed leg parts and links laid out on a desk](first-legs.jpg "April 2020: the first legs.")

![The white printed body with grey printed legs, on a desk](printed-body.jpg "Body and legs.")
![The printed body from the other side, with a small plant behind it](printed-body-2.jpg "The other side.")

![Printed rocker-bogie legs folded against the body](printed-legs.jpg "The rocker-bogie legs.")
![The legs from above, with a yellow cable running past](printed-legs-2.jpg "From above.")
![The rover's legs with servo wiring, in front of a monitor](legs-wired.jpg "Servos and wiring in.")
![A side view of the legs with wires running to the motors](legs-wired-2.jpg "Side view.")

![Top view: two blue motor drivers inside the white body, legs out to the sides](top-drivers.jpg "Motor drivers in the body.")
![Top view of the whole rover with wheels and servos](top-drivers-2.jpg "From above.")

![The printed rover from the side on a tiled floor, the legs and servo wiring along it](july-side.jpg "July 2020, side.")
![The printed rover from the front on a tiled floor, the white body between the legs](july-front.jpg "Front.")

## Motors | Two BTS7960s

Testing the motors with two BTS7960 motor drivers. I also changed the differential bar design, because the old one was too weak and flimsy.

![Wiring laid out on the desk: an Arduino, a LiPo battery and motor leads](motor-test.jpg "Motor test.")
![Top view of the rover with both BTS7960 drivers mounted inside](motor-test-top.jpg "Both drivers mounted.")

## Rocker-bogie | Too many parts

The rover has the iconic rocker-bogie mobility system. Four servos turn the wheels so the rover can turn on the spot.

I started working two part-time jobs around this time, so the project went on hold. There were other issues too. The 3D-printed mechanisms on the front and rear wheels were weak and unreliable, and the joints were wobbly. There were too many bolts and nuts, and some weren't needed. The whole thing was more complex than it should have been. I want to build things as simply as possible: the fewer moving parts the better.

![The printed rover with its legs, servos and wiring](servos.jpg "Servos and wiring on the legs.")
![The rover on the desk next to its RC transmitter](servos-rc.jpg "With the transmitter.")
![The printed rover on a glass desk from above at an angle, the servos and wiring on its legs](july-desk.jpg "July 2020.")

## Mar 2021 | Aluminium rebuild

Using the same parts, I abandoned the old mobility system. It was hard to print and had too many parts, each one a potential point of failure. I bought some aluminium extrusion and made it the main chassis, which is also more durable.

I used a plastic food container to house all the electronics, added LEDs and printed a bracket to hold the motors in place. Also added decals.

![The electronics laid out in the open plastic box: motor drivers, Arduino and wiring](v2-electronics.jpg "The electronics box.")
![The aluminium rover from the side, with the clear box on top](v2-side.jpg "On extrusion.")
![The aluminium rover from the front](v2-front.jpg "Front.")
![Close-up of the wheels and motor brackets on the extrusion](v2-wheels.jpg "Printed motor brackets.")
![The rover in the dark with its red LEDs on](v2-leds.jpg "LEDs.")
![The rover on the floor from the front, with the clear box and decals](v2-box.jpg "Decals.")

## GPS | Trying for autonomy

I wanted to make it autonomous with ArduPilot, so I fitted a cheap GPS and magnetometer to get its location and heading. I fried the magnetometer, though: it runs on 3.3 V, not 5 V. I took a break from the project, and as it stands it's an RC car.

![The rover with a GPS mast, a clear electronics box and danger decals, April 2021](v2-desk.jpg "With the GPS mast, April 2021.")
![The same rover side-on: six wheels on the aluminium frame](v2-desk-side.jpg "Side-on.")
![A frame from the drive video: the rover in a hallway behind a backpack](video.jpg "Drive video.")

[▸ Watch it drive on YouTube](https://www.youtube.com/watch?v=HQ-1oEVmYHU)

## 2022 | Rover 2: four wheels

Rover 2 got paused. I didn't see the point in it anymore, and [AeroDesign](../kyogre-spirit/index.html) became the focus that year.

![SolidWorks model of a four-wheel rover: a box chassis with an electronics bay, a fan cover and red-hubbed wheels](rover2-cad.jpg#wide "The SolidWorks model, December 2022.")

![A four-wheel rover with a white printed chassis and big treaded wheels, on a desk](rover2-dorm.jpg "On the desk, March 2022.")
![The four-wheel rover from the front, with wiring across the top](rover2-dorm-2.jpg "April 2022.")
![The rover in a workshop with a light-blue printed cover over the electronics](rover2-cover.jpg "With its blue cover, December 2022.")
![The rover on a wooden floor from above, next to its RC transmitter](rover2-rc.jpg "With the transmitter, December 2022.")

<figure class="ar-fig"><video src="rover2-drive.mp4" poster="rover2-drive-poster.jpg" controls muted playsinline preload="metadata" style="width:100%;max-width:24rem;height:auto"></video><figcaption>Driving on a workshop floor, February 2023.</figcaption></figure>
