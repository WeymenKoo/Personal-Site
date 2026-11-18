---
title: Kyogre and Spirit
subtitle: Two seasons of wings and tails for UBC AeroDesign's Advanced Class aircraft. A crash, one flight for Spirit, and two shipments UPS would rather not talk about.
team: UBC AeroDesign
role: Mechanical lead, lifting surfaces and aerodynamics
date: 2021–23
---

Before I moved to the electrical side of UBC AeroDesign, I spent two seasons as the mechanical lead for lifting surfaces and aerodynamics: the wings, the flaps and the tail. That covered two aircraft for the Advanced Class of SAE Aero Design. *Kyogre*, the blue one, named after the Pokémon, was the 2021–22 plane. *Spirit*, the 2022–23 plane, was built twice: once in purple and white, then again in transparent red.

Between them: Kyogre crashed in testing, Spirit flew once, and neither flew at competition. UPS helped with that last part, both years.

I never wrote any of this down at the time, so this is a photo album more than a story. It runs in the order the work did: concept, analysis, design, build, test flights, competition, and the planes as they ended up.

![Kyogre on the turf at Thunderbird Stadium, blue with red wingtips](kyogre-test-field.jpg#land "Kyogre, April 2022.")
![The first Spirit airframe on a gravel field, in purple, white and red](spirit-v1-field-1.jpg "Spirit, first build, March 2023.")
![The second Spirit airframe on a concrete apron, in transparent red with 221 UBC on the wings](spirit-final.jpg "Spirit, second build, April 2023.")

| | |
|---|---|
| Kyogre | 2021–22 season · team 211 · blended wing and fuselage, `119 in` span, aspect ratio `6.37`, taildragger, single tail boom, conventional tail |
| Kyogre airfoils | E591 root · S1223 RTL tip · S8035 tail |
| Spirit | 2022–23 season · team 221 · blended wing body, `120 in` span, taildragger, single tail boom, conventional tail |
| Spirit airfoils | S808 fuselage section · S1223 inner wing · S1223 RTL outer wing · NACA 0012 tail |
| Structure | Laser-cut balsa and plywood ribs and straps · carbon fibre spar and tail boom · carbon fibre where the loads are high · MonoKote covering · 3D-printed control surfaces on Spirit |
| Kyogre result | SAE Aero Design East 2022, Fort Worth: 5th of 18 in the Advanced Class, without a flight |
| Spirit result | SAE Aero Design West 2023, Fort Worth: 7th of 12 in the Advanced Class, without a flight |
| Flights | Kyogre: crashed on a test flight · Spirit: one, on video · at competition: `0` |
| Tools | XFLR5 · MATLAB · SolidWorks · AutoCAD for nesting the laser-cut sheets |

## Concept | Sketches, a chalkboard and a paint file

Kyogre started as a lofted surface in SolidWorks: a wide centre section that blends into tapered outer wings.

![Grey lofted surface model of Kyogre's wing and blended fuselage](kyogre-wing-loft.png "Kyogre's wing as a surface model, November 2021.")

For the next plane I started on paper. These two pages are from the same day in June 2022.

![Notebook sketch of a high-wing aircraft with a tail boom, annotated with wing separation options and where the PADA goes](concept-sketch-1.jpg#land "16 June 2022. A carbon tail boom that runs into the fuselage, two options for where the wing splits, and a spot for the PADA under the wing.")
![Notebook sketch of a low-wing aircraft, annotated with notes on the landing gear, spar and tail](concept-sketch-2.jpg "The low-wing version: shorter landing gear, a carbon tube spar, and a separate H-stab and V-stab so the tail packs down.")

Neither sketch is the plane that got built. After the team's trade study, Spirit became a blended wing body on taildragger gear. What carried over from the sketches is the single carbon tail boom and the wing that separates into sections.

By November the layout was fixed and the question was how to build it.

![A long chalkboard covered in a planform drawing of the wing, with rib positions and notes](concept-chalkboard.jpg#wide "12 November 2022: working out the structure on a chalkboard.")

![Annotated top view of Spirit's wing and tail, colour-coded by rib material, with servos, hatches, landing gear and control surfaces marked](concept-structure-plan.jpg#wide "The structural plan that came out of it. Grey ribs are 2 mm carbon fibre, orange are 3/16 in plywood, brown are 1/8 in balsa. Green is a control surface, blue is a servo, purple is a hatch.")

The plan put carbon fibre and plywood ribs at the wing joints, around the landing gear and at the ends of each tail surface, and balsa everywhere else. The flaps, ailerons and rudder are 3D printed; the elevator is wood. The horizontal stabilizer is two halves on one spar, which leaves room in the middle for the tail boom clamp, the tail wheel and the vertical stabilizer clamp.

## Analysis | Kyogre, by the numbers

Everything in this chapter is from the team's 2022 design report, apart from the taper sweep, which I replotted from the XFLR5 exports.

### Airfoils and wing

More than 30 low-Reynolds-number airfoils went through XFLR5. The E591 was picked for the root, on maximum lift and minimum drag, and the S1223 RTL for the tip, on stall angle and stall behaviour. Both tail surfaces use the S8035, for its `15.5°` stall angle and gentle stall.

![Outlines of the E591 and S1223 RTL airfoils](kyogre-airfoils.png "E591 at the root, S1223 RTL at the tip.")

![Line chart of maximum takeoff weight against aspect ratio for four airfoils, with the E591 curve peaking at an aspect ratio of 6](kyogre-mtow-ar.png "Maximum takeoff weight against aspect ratio, from the sizing script. The E591 peaks at 6.")

![Kyogre's spanwise lift distribution at 4 degrees, almost on top of an elliptical curve, with the wing planform drawn underneath](kyogre-lift-distribution.png "Lift along the span at 4°, against an elliptical distribution.")

The sizing script put the best aspect ratio for the E591 at 6. With the S1223 RTL at the tip, a few more iterations landed on `6.37`.

The wing is a constant-chord inner section with tapered outer panels, which gets close to an elliptical planform and can still be built from flat ribs. With a taper ratio of `0.36` and `1°` of twist, the lift distribution from XFLR5's lifting-line analysis sits almost on the ellipse.

### Tail and balance

The tail was sized from tail volume coefficients of `0.70` (horizontal) and `0.04` (vertical), with aspect ratios of `4.0` and `1.5`. Then came the taper sweep:

![Two line charts of lift coefficient and lift-to-drag ratio against angle of attack for ten tail taper ratios, all nearly identical](kyogre-tail-taper.png#wide "Tail taper sweep in XFLR5 at 40 ft/s. Replotted from the exported polars.")

Taper made next to no difference to lift over drag, so it was chosen for other reasons: `0.75` on the horizontal stabilizer and `0.67` on the vertical.

![Chart of static margin against centre of gravity location for each loading condition, inside the forward and aft limits](kyogre-static-margin.png "Static margin against CG position. Kyogre is the black line.")

The targets were a CG between 25% and 33% of the mean aerodynamic chord and a static margin between 5% and 15%. Empty, Kyogre sits at about 30.6% with a margin near 10.7%. With water and the PADA on board it moves back to about 31.8% and 9.5%. The neutral point is at 41%.

### Stability

![Two charts: pitching moment coefficient against angle of attack for seven CG positions, and a root locus plot of the longitudinal modes](kyogre-stability.png#wide "Static stability (left) and the longitudinal root locus for CG positions from 25% to 55% of the chord (right).")

The pitching moment slope is negative at every CG position in the envelope, so the plane is statically stable throughout. Dynamically, the short-period mode is well damped. The phugoid is unstable across the whole CG range, with a period of `7.06 s` at the forward limit, slow enough for the pilot to correct.

### Drag and control

![A table of minimum drag coefficient by component, and the drag polar with glide ratio](kyogre-drag.png#wide "Component drag build-up and the full-plane drag polar.")

The wing and blended fuselage account for `0.0096` of the `0.0160` zero-lift drag coefficient. Glide ratio peaks between 17 and 18.

| Surface | Chord ratio | Max deflection | Sized for | Projected |
|---|---|---|---|---|
| Ailerons | 33% | 20° | time to bank 45° | `0.76 s` |
| Elevators | 35% | 25° | pitching moment per radian of deflection | `−1.66 /rad` |
| Rudder | 30% | 25° | deflection needed in a crosswind landing | `11.3°` |

### Takeoff

![Line chart of thrust against airspeed for the Hacker Q80 motor with a 20 by 8 propeller, wind tunnel against simulation](kyogre-thrust.png "Thrust against airspeed: wind tunnel and simulation.")

![Line chart of simulated altitude against runway length for three headwinds](kyogre-takeoff.png "Simulated takeoff: 127.4 ft with no wind, 98.3 ft into 5 ft/s, 73.0 ft into 10 ft/s.")

The motor is a Hacker Q80-13XS F3A with a 20×8E propeller, under the class's `750 W` limit. Thrust curves from the wind tunnel and lift and drag from XFLR5 feed a takeoff simulation.

### Loads and structure

![V-n diagram with the manoeuvre envelope in blue and gust loads in dashed red](kyogre-vn.png#wide "V-n diagram, with gust loads for Fort Worth.")

Cruise is `41 ft/s` and the dive speed is 150% of that. The design load factor is 3, and with a safety factor of 1.5 the structure is sized for `4.5`.

- **Wing spar:** a carbon fibre tube at the quarter chord. Flight loads put `9,141 psi` on it at the root. A one-wheel landing, at 675 lb, puts `76,000 psi`. So the spar is sized for landing, with a safety factor of 1.67 and under 2 in of deflection.
- **Tail boom:** a twill-weave carbon fibre tube, `1.125 in` outside and `1 in` inside. It is sized for a 54.7 lbf tail-wheel landing load and for `4.89 lb-ft` of torsion from rolling to 45° in one second.

| Subsystem | Critical case | Safety margin |
|---|---|---|
| Wing spar | Landing | `0.42` |
| Tail boom | Banking | `0.4` |
| Landing gear | One-wheel strike | `0.4` |

### Weight

| | |
|---|---|
| Wings | `1.92 lb` (outer wings 1.20, spar 0.72) |
| Tail | `1.40 lb` (horizontal 1.00, vertical 0.40) |
| Fuselage | `5.55 lb` |
| Landing gear | `1.52 lb` |
| Propulsion | `2.75 lb` |
| Empty | `13.14 lb` |
| Gross | `28.99 lb`, including 12.5 lb of water and containers |

## Design | XFLR5, then SolidWorks

### Spirit's wing

Spirit went through the same process a year later. Three airfoils were picked from the candidates: the thick S808 for the fuselage section, where the payload sits, the S1223 for the inner wing, and the S1223 RTL for the outer wing.

![Line chart of lift coefficient against angle of attack for the S808, S1223 and S1223 RTL airfoils](spirit-airfoils-2d.png "2D lift curves of the three airfoils, from the 2023 design report.")
![XFLR5 view of the three airfoil sections overlaid along the wing](xflr5-spirit-airfoils.png "The three sections overlaid, root to tip.")

![XFLR5 3D view of Spirit's wing and tail with streamlines trailing behind](xflr5-spirit-streamlines.png#wide "The wing and tail in XFLR5, November 2022.")

![XFLR5 wing editor with the table of sections and a 3D view of the wing root](xflr5-spirit-sections.png "The wing as sections: S808 out to 10 in at a 33.5 in chord, S1223 from 13.5 in to 35 in at a 21.3 in chord, and S1223 RTL at the tip.")
![XFLR5 top view of the wing planform and the tail](xflr5-spirit-planform.png "Planform, March 2023: `119 in` span, `2577 in²` of wing area.")

![XFLR5 plot of the spanwise lift distribution, a green curve close to a grey elliptical one](xflr5-spirit-lift.png#wide "Lift along the span at 3° and 37.7 ft/s (green), against an elliptical distribution (grey).")

### CAD

Every rib, strap and piece of sheeting was modelled in SolidWorks, then flattened to DXF and nested in AutoCAD for the laser cutter.

![Photo of a monitor showing Kyogre's wing and tail structure in SolidWorks](kyogre-cad-screen.jpg#land "Kyogre's wing, tail boom and tail on screen.")
![CAD render of Kyogre's full airframe structure](kyogre-cad-final.png "Kyogre, final assembly, May 2022.")

![CAD render of Kyogre's horizontal stabilizer: ribs, straps and carbon fibre trailing-edge sheeting](kyogre-cad-hstab.png "Kyogre's horizontal stabilizer, March 2022.")

![CAD render of Spirit's full airframe: blended fuselage, tapered wings, tail boom and tail](spirit-cad.jpg#wide "Spirit, full assembly.")

On Spirit the wing was split between several of us, so the CAD went through reviews. These are two of the marked-up sheets.

![Marked-up screenshots of the outer wing CAD with numbered review notes](review-outer-wing.jpg#wide "Outer wing review, 10 November 2022. Thinner straps that stay inside the airfoil, tabs for the MonoKote to stick to on the undercambered side, and spar holes that line up with the mid wing.")

![Marked-up screenshots of the mid wing CAD with review notes](review-mid-wing.jpg#wide "Mid wing review. Straps that slot into the ribs and sit flush with the profile, and leading-edge sheeting in the model.")

![CAD render of the Revision 1 outer wing, with ribs, straps, leading-edge sheeting and the aileron](spirit-outer-wing-rev1.png "Outer wing, Revision 1, March 2023.")

## Manufacturing | Laser-cut ribs, carbon fibre and MonoKote

### Kyogre

![Ribs standing upright on a jig on a workshop bench](kyogre-build-jig.jpg#tall "October 2021: ribs on a jig, early in the season.")
![A set of ribs slotted onto their straps, held up by hand](kyogre-build-ribs.jpg "18 March 2022: ribs slotted onto their straps.")

![The centre section on a bench, framed up, with the first panels of blue MonoKote on](kyogre-build-covering.jpg#land "24 March: the centre section framed up, first panels of MonoKote on.")
![A sheet of carbon fibre next to a sheet of balsa on the bench](kyogre-build-sheeting.jpg "Carbon fibre sheeting for the trailing edge.")

![One half of Kyogre's wing on a bench, covered in blue with a red tip](kyogre-build-wing.jpg#tall "26 March, 2:26 am.")
![The wing on the workshop floor with a team member lying beside it](kyogre-build-span.jpg "For scale.")

![The covered wing on the floor with the tail boom and tail attached, and a tape measure held against the vertical stabilizer](kyogre-build-tail.jpg "Tail on, and a tape measure for the height.")

### Spirit

![The vertical stabilizer structure laid on a bench next to its white 3D-printed rudder](spirit-build-vstab.jpg#tall "21 March 2023: the Revision 1 vertical stabilizer with its 3D-printed rudder.")
![Outer wing panels on a table, covered in transparent red film, with servos being fitted](spirit-build-covering.jpg "Outer wings in transparent red, servos going in.")

![A table covered in laser-cut ribs, straps and a carbon spar, with a laptop showing the CAD](spirit-build-parts.jpg "31 March 2023: ribs, straps and the carbon spar, with the CAD open beside them.")

## Test flights | One crash, and one plane that stayed on the ground

### Kyogre, 9 April 2022

![Team members checking Kyogre on the turf at Thunderbird Stadium](kyogre-test-preflight.jpg "Thunderbird Stadium, 12:14 pm.")

![Kyogre's wreckage on the turf: the centre section and tail, with balsa fragments around them](kyogre-test-after-1.jpg#land "12:33 pm.")
![The broken airframe on the turf with people standing around it](kyogre-test-after-2.jpg "It did not come back in one piece.")

Nineteen minutes separate those photos. The tail clamp was loose. In the air the plane banked too hard and too tight, and came down on the turf. The analysis covered the tail boom in a 45° bank. It did not cover a clamp that wasn't tight.

![A team member gluing ribs on a clean workbench](kyogre-rebuild.jpg "24 April 2022: gluing ribs again.")

### Spirit, first build

The first Spirit never flew.

![The first Spirit airframe on wet pavement at night, with the team standing around it](spirit-v1-night-1.jpg "17 February 2023: the first Spirit, outside at night.")

![Spirit on the pavement at night with its hatch open and the avionics lit green](spirit-v1-night-2.jpg#tall "5 March 2023, 5:35 am: avionics on.")
![Spirit seen from behind on a gravel field, with its white vertical stabilizer and purple tail](spirit-v1-field-2.jpg "The same day, 3 pm, at the field.")

Its centre of gravity sat too far back and it was far too heavy: the design report has the built airframe at `22.92 lb` against a `20 lb` target. So after March the fuselage was shifted in the CAD and the whole airframe was built again, this time in transparent red.

## Competition | Fort Worth, twice, no thanks to UPS

Both planes went to Fort Worth, Texas. Neither flew a competition round.

### Kyogre, May 2022

I have this one from my teammates. UPS lost the shipment, tools included. The team reached SAE Aero Design East far too late, with a subsystem missing, and Kyogre did not fly. UBC still placed 5th of 18 in the class; [UBC's write-up](https://ece.ubc.ca/?p=19083) has the details.

### Spirit, April 2023

A year later we shipped Spirit from Vancouver with UPS again. They lost it again, then delivered it late.

<div class="ar-chat">
<span class="who">UPS tracking (dramatization)</span>
<span aria-hidden="true" class="typing"><i></i><i></i><i></i></span>
<div class="msg">Your package is on the way.<br>Which way, we cannot say.</div>
<span class="seen">Seen <b>✓✓</b><br>both years</span>
</div>

That is why these two photos were taken in a house, late at night, in competition week:

![Spirit's wing panels attached to the bare fuselage frame, on the floor of a games room](spirit-build-airframe.jpg#land "13 April 2023, 11:32 pm.")
![Spirit being assembled on a living-room rug, with the carbon nose shell, tail boom and landing gear attached](spirit-build-assembly.jpg "14 April.")

On top of the late delivery, technical issues with *Sprite*, the small delta-wing aircraft Spirit was meant to release in flight (the PADA), held up our technical inspection.

![People gathered around Spirit on a stand at the flying field](spirit-comp-pits.jpg#wide "15 April 2023, morning: Spirit on the stand.")

We reached the flight line one minute before the no-fly cutoff and the runway closing. Spirit did not fly at the competition. UBC finished 7th of 12 in the class; the full table is on [SAE's results page](https://www.saeaerodesign.com/page.aspx?pageid=c93ea933-b70e-4523-8cbc-276cc89a4211).

### What Brown did for us

| | Kyogre, 2022 | Spirit, 2023 |
|---|---|---|
| Shipped with | UPS | UPS |
| Shipment | lost, tools included | lost, then late |
| Competition flights | `0` | `0` |

We built an aircraft that carries water and launches a second aircraft in flight. UPS could not carry a box from Vancouver to Texas, twice.

### The one flight

Spirit flew once. This is it, at dusk on 15 April 2023, outside the competition rounds.

![Spirit banking just after takeoff over a grass runway at dusk](spirit-flight-takeoff.jpg#wide "15 April 2023, dusk: takeoff.")

![Spirit seen from below against the sky](spirit-flight-overhead.jpg#land "Overhead.")
![Spirit touching down on the grass](spirit-flight-landing.jpg "And back on the ground. Stills from a phone video.")

## The planes | Kyogre and Spirit

![Render of Kyogre in blue with red wingtips and a red and blue vertical stabilizer](kyogre-render.png "Kyogre, rendered in its colours: blue and red, like the Pokémon it is named after.")

![Render of Spirit in purple, white and red, with the delta-wing PADA beside it](spirit-render-livery.png#wide "Spirit in its first colours, with Sprite, the PADA it carried.")

![Render of Spirit's bare structure, from the 2023 design report](spirit-render.jpg#wide "Spirit's structure, from the 2023 design report.")

![The second Spirit airframe on a concrete apron in the sun, transparent red, with 221 UBC on the wing](spirit-final.jpg#bleed "Spirit, 16 April 2023.")
