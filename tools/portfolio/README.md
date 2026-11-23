# portfolio.pdf

`npm run portfolio` prints `dusk/portfolio.pdf` (11 × 8.5 in, landscape) from `content.js` with headless Chromium.
Set `CHROMIUM_PATH` to use a system Chrome instead of Playwright's.

It is a work sample for job applications. Built projects follow one order: the real board with its specs and
purpose, then design and layout, then testing, then use.

## The grid

Every page is three columns by two rows. Every picture sits in a 4:3 frame, in one of two sizes:

- `grid(...)`: six cells. A cell is a picture with a caption (`fig`), a scope capture (`scope`) or text (`text`).
- `hero(...)`: one picture across two columns and both rows, with text under it, and two cells on the right.

`build.js` never crops: pictures are made 4:3 beforehand by `prep/assets.py`, and the build fails on one that is
not. It also warns when a text block would be clipped.

| File | What it is |
|---|---|
| `content.js` | The pages, in order |
| `build.js` | Turns the pages into HTML and prints the PDF |
| `assets/` | Every picture in the PDF, 4:3, re-encoded with no metadata, plus `scopes.json` and `layouts.json` |
| `prep/` | The scripts that make `assets/` |
| `fonts/` | JetBrains Mono (OFL) |

## Rules

- A picture has to say something: the board, a design step, a measurement, or the board in use.
- Built boards open with a real photo. Renders are for boards that are not built yet, and for views a photo can't give.
- Scope plots are real captures that show a performance figure (start-up, transient response, ripple, switching,
  step response). Fault and debug captures stay in the project repos.
- Nothing cut off: each picture gets to 4:3 by a chosen crop that keeps the whole subject, or by padding
  (`full`, `crop`, `pad`, `extend` in `prep/assets.py`).

## Remaking the assets

The project repos are cloned side by side into one folder (`AeroDesign-Power-Board`, `FOC-Motor-Controller`,
`DC-Electronic-Load`); the renders are the `~/Claude/renders` folder; the power board and FOC Gerbers are their
unzipped fabrication outputs.

```
python3 tools/portfolio/prep/assets.py . ~/Claude/renders <repos> tools/portfolio/assets
python3 tools/portfolio/prep/scope.py <repos> tools/portfolio/assets
python3 tools/portfolio/prep/layout_plot.py <power board gerbers> <FOC gerbers> <repos>/DC-Electronic-Load tools/portfolio/assets
npm run portfolio
```

## Scope captures

Each one is the RIGOL DHO804's own 1024 × 600 screenshot from the project's test folder, whole and unedited.
`prep/scope.py` works out where each call-out goes from the scope's scale (100 px per time division, 51.75 px per
volt division) and the trace's own pixels; the numbers in the labels come from that run's logged results.
`build.js` draws them over the picture as vector lines and text.

## Layout plots

`prep/layout_plot.py` plots the fabrication Gerbers in one style: light board, copper as a tint with an outline
(top red, bottom blue), exposed pads solid, silkscreen dark. It writes each board's mm-to-pixel transform to
`layouts.json`, so the numbered call-outs in `content.js` are given in board millimetres (from the pick-and-place
files) and land on the part.
