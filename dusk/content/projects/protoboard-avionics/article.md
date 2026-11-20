---
title: Protoboard flight computers
subtitle: Four hand-wired flight computers for a water rocket, 2019 to 2021.
team: Individual work
role: Soldering, wiring, firmware
date: Apr 2019 – Jul 2021
layout: gallery
---

A water rocket flight computer that records altitude and acceleration and deploys the parachute. Four generations, all soldered on protoboard. Each one was built to fix what went wrong with the last.

> I have been committed to design a water rocket flight computer capable of recording altitude and accelerometer data, and deploying parachutes.
> — "My Projects," 2021

| | |
|---|---|
| Gen 1 · Apr 2019 | Servo timer |
| Gen 2 · Mar 2020 | Arduino Nano, BME280, SD card |
| Gen 3 · Sep 2020 | Adds an MPU6050, better board |
| Gen 4 · Jul 2021 | Teensy 3.5, BME280, MPU6050, RGB light, break-wire circuit |

## Apr 2019 | Gen 1: a servo timer

A basic servo timer to deploy the parachute, built after the one at the science competition failed. My first time soldering parts onto a protoboard.

It deployed the parachute, on the ground at least. It also had loose wiring, an unreliable battery setup and parts it didn't need, and the rocket wasn't airtight. I wanted a more systematic way to deploy the parachute, so I made a second version.

![Gen 1 on a breadboard: an Arduino Nano, a seven-segment display, a button and a servo](gen1-breadboard.jpg "On the breadboard first.")
![Gen 1 soldered on a small piece of protoboard with a seven-segment display, wired to a servo and a battery](gen1-protoboard.jpg "On protoboard.")
![Gen 1's protoboard sitting on top of a printed ring inside the rocket body](gen1-in-rocket.jpg "In the rocket.")

![A frame from the Gen 1 test video: the board, a servo and a battery on a desk](gen1-video.jpg "Test video, 2019.")

[▸ Watch the Gen 1 test on YouTube](https://www.youtube.com/watch?v=KsAgU6lybk8)

## Mar 2020 | Gen 2: logging altitude

Built during quarantine, with an Arduino Nano, a BME280 and an SD card reader. The goal was to log altitude to the SD card and use the BME280 to find apogee and release the parachute.

I simulated the altitude drop by blowing air onto the sensor, and it worked. But the protoboard was cheap, and its solder pads came off the board.

![Gen 2 on a breadboard with an Arduino Nano, an SD card reader and a BME280](gen2-breadboard.jpg "Breadboard.")
![Gen 2 soldered on brown protoboard, held in a hand: Arduino Nano, SD card adapter and a purple BME280 board](gen2-board.jpg "Soldered.")
![The back of Gen 2's protoboard with hand-routed wires](gen2-back.jpg "The back.")
![Gen 2 mounted on a printed base next to the grey nose cone halves and a LiPo battery](gen2-in-nose.jpg "With the nose cone.")

![A frame from the Gen 2 test video: the board on a desk next to a printed part](gen2-video.jpg "Test video, 2020.")

[▸ Watch the Gen 2 test on YouTube](https://www.youtube.com/watch?v=CZhQfjahri0)

## Sep 2020 | Gen 3: the "final" version

The third generation took the earlier mistakes into account and was built as, hopefully, the final version. It added an MPU6050 and used a better-quality board.

The SD card reader would not talk to the Arduino no matter what. I went through the code, replaced the board, replaced the Arduino and added capacitors. Nothing worked. The code had also grown too big for the Arduino Nano, with little room left to experiment.

![Gen 3 on blue protoboard: Arduino Nano, microSD adapter, a purple sensor board and a buzzer](gen3-front.jpg "Front.")
![The back of Gen 3: point-to-point wiring across the blue protoboard](gen3-back.jpg "Back.")
![Gen 3 standing upright in its white printed mount](gen3-on-base.jpg "In its printed mount.")
![Gen 3 sliding into the white printed rocket body on the desk](gen3-in-rocket.jpg "Going into the rocket.")

## Jul 2021 | Gen 4: Teensy 3.5

The fourth version, powered by a Teensy 3.5 (double the price where I lived), with a BME280, an MPU6050, an RGB light and a break-wire circuit. Untested. The plan was to drop it from a drone once I'd settled in at university.

![Gen 4 on green protoboard with a Teensy 3.5, mounted in a white printed housing with a servo on the side](gen4.jpg "Gen 4, in its housing.")

It was long and frustrating, but looking back at what I managed to make by myself, it was worth it.

> In the future, I would like to further refine the code and also learn how to design printed circuit board. The final goal is to build a reliable water rocket parachute deployment system.
> — Gen 4, July 2021

The boards I've designed since then are on the [projects page](../../../index.html#projects).
