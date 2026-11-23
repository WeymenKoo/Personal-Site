# portfolio.pdf

`npm run portfolio` prints `dusk/portfolio.pdf` (11 × 8.5 in, landscape) from `content.js` with headless Chromium.
Set `CHROMIUM_PATH` to use a system Chrome instead of Playwright's.

| File | What it is |
|---|---|
| `content.js` | The pages, in order, written with the helpers in `build.js`: `page`, `fig`, `scope`, `stats`, `table` |
| `build.js` | Turns the pages into HTML and prints the PDF; warns if a page overflows or an asset is unused |
| `assets/` | Every picture in the PDF, resized and re-encoded with no metadata, plus `scopes.json` |
| `prep/` | The scripts that make `assets/` (they read the project repos and the render folders) |
| `fonts/` | Literata and IBM Plex Mono (OFL) |

## Remaking the assets

The project repos are cloned side by side into one folder (`AeroDesign-Power-Board`, `FOC-Motor-Controller`,
`DC-Electronic-Load`); the renders are the `~/Claude/renders` folder.

```
python3 tools/portfolio/prep/assets.py . ~/Claude/renders tools/portfolio/assets          # photos and renders
python3 tools/portfolio/prep/scope.py <repos> tools/portfolio/assets                       # scope captures + call-outs
python3 tools/portfolio/prep/gerber_plot.py <repos>/DC-Electronic-Load tools/portfolio/assets   # DC load layouts
python3 tools/portfolio/prep/pb_layout.py ~/Claude/renders/fc_pb/tex_stack tools/portfolio/assets/pb-layout.jpg
npm run portfolio
```

## Scope captures

Each one is the RIGOL DHO804's own screenshot from the project's `bench_test` / `Testing` folder, cropped to the
graticule and otherwise untouched. `prep/scope.py` works out where each call-out goes from the scope's scale
(100 px per time division, 51.75 px per volt division) and the trace's own pixels; the numbers in the labels come
from that run's logged results. `build.js` draws them over the picture as vector lines and text.
