---
title: Kyogre and Spirit
subtitle: Two seasons of wings and tails for UBC AeroDesign's Advanced Class aircraft. One crash, one flight, and two shipments UPS would rather not talk about.
team: UBC AeroDesign
role: Mechanical lead, lifting surfaces and aerodynamics
date: 2021–23
---

Before I moved to the electrical side of UBC AeroDesign, I spent two seasons as mechanical lead for lifting surfaces and aerodynamics: the wings, the flaps and the tail. *Kyogre*, the blue one, was the 2021–22 plane. *Spirit*, the 2022–23 plane, was built twice.

![Kyogre on the turf at Thunderbird Stadium, blue with red wingtips](kyogre-test-field.jpg#land "Kyogre, April 2022.")
![The second Spirit airframe on a concrete apron, in transparent red with 221 UBC on the wings](spirit-final.jpg "Spirit, second build, April 2023.")

| | |
|---|---|
| Kyogre | 2021–22 · blended wing and fuselage · `119 in` span · aspect ratio `6.37` · E591 root, S1223 RTL tip, S8035 tail |
| Spirit | 2022–23 · blended wing body · `120 in` span · S808 fuselage, S1223 inner, S1223 RTL outer, NACA 0012 tail |
| Structure | Laser-cut balsa and plywood ribs · carbon fibre spar and tail boom · MonoKote |
| Tools | XFLR5 · MATLAB · SolidWorks · AutoCAD |

## Drafting | Paper first

![Notebook sketch of a high-wing aircraft with a tail boom, annotated with wing separation options and where the PADA goes](concept-sketch-1.jpg#land "16 June 2022: a carbon tail boom and two options for where the wing splits.")
![Notebook sketch of a low-wing aircraft, annotated with notes on the landing gear, spar and tail](concept-sketch-2.jpg "Same day, low-wing version.")

Neither sketch is the plane that got built: after the trade study, Spirit became a blended wing body. The single carbon tail boom and the wing that splits into sections carried over.

![A long chalkboard covered in a planform drawing of the wing, with rib positions and notes](concept-chalkboard.jpg#wide "12 November 2022: the structure, on a chalkboard.")

![Annotated top view of Spirit's wing and tail, colour-coded by rib material, with servos, hatches, landing gear and control surfaces marked](concept-structure-plan.jpg#wide "The plan that came out of it. Grey: carbon fibre ribs. Orange: plywood. Brown: balsa. Green: control surfaces. Blue: servos.")

## Analysis | XFLR5, then the design report

More than 30 low-Reynolds-number airfoils went through XFLR5. The wing and tail were then modelled in it as a whole, and those runs fed the figures in the design report.

![XFLR5 3D view of Spirit's wing and tail with streamlines trailing behind](xflr5-spirit-streamlines.png#wide "Spirit's wing and tail in XFLR5, November 2022.")

![Line chart of maximum takeoff weight against aspect ratio for four airfoils, with the E591 curve peaking at an aspect ratio of 6](kyogre-mtow-ar.png "Max takeoff weight against aspect ratio. The E591 peaks at 6; with the S1223 RTL at the tip, Kyogre landed on `6.37`.")
![Kyogre's spanwise lift distribution at 4 degrees, almost on top of an elliptical curve, with the wing planform drawn underneath](kyogre-lift-distribution.png "Lift along the span at 4°. Taper `0.36` and `1°` of twist put it almost on the ellipse.")

![Chart of static margin against centre of gravity location for each loading condition, inside the forward and aft limits](kyogre-static-margin.png#wide "Static margin against CG. Empty, Kyogre sits at 30.6% MAC with a 10.7% margin; the neutral point is at 41%.")

## CAD | SolidWorks, reviewed

Every rib, strap and piece of sheeting was modelled in SolidWorks, flattened to DXF and nested in AutoCAD for the laser cutter. On Spirit the wing was split between several of us, so the CAD went through marked-up reviews.

![Marked-up screenshots of the outer wing CAD with numbered review notes](review-outer-wing.jpg#wide "Outer wing review, 10 November 2022.")

![CAD render of Kyogre's full airframe structure](kyogre-cad-final.png "Kyogre, final assembly.")
![CAD render of Spirit's full airframe: blended fuselage, tapered wings, tail boom and tail](spirit-cad.jpg "Spirit, final assembly.")

## Build | Ribs, carbon and MonoKote

![A set of ribs slotted onto their straps, held up by hand](kyogre-build-ribs.jpg "Kyogre's ribs on their straps, March 2022.")
![One half of Kyogre's wing on a bench, covered in blue with a red tip](kyogre-build-wing.jpg#tall "26 March, 2:26 am.")

![A table covered in laser-cut ribs, straps and a carbon spar, with a laptop showing the CAD](spirit-build-parts.jpg "Spirit's parts, March 2023.")
![Outer wing panels on a table, covered in transparent red film, with servos being fitted](spirit-build-covering.jpg "Outer wings in red, servos going in.")

## Fate | One crash, one flight

**Kyogre** crashed on a test flight on 9 April 2022. The tail clamp was loose. The analysis covered the boom in a 45° bank; it did not cover a clamp that wasn't tight. It was rebuilt, then UPS lost the shipment to Fort Worth. UBC placed 5th of 18 without a flight.

![Kyogre's wreckage on the turf: the centre section and tail, with balsa fragments around them](kyogre-test-after-1.jpg#wide "12:33 pm. Nineteen minutes after preflight.")

**Spirit** came out at `22.92 lb` against a `20 lb` target, with the CG too far aft, so it was built again. UPS lost that one too, then delivered it late. We reached the flight line one minute before the cutoff, and UBC placed 7th of 12 without a flight.

It flew once, at dusk on 15 April 2023, outside the competition rounds.

![Spirit banking just after takeoff over a grass runway at dusk](spirit-flight-takeoff.jpg#bleed "15 April 2023, dusk.")
