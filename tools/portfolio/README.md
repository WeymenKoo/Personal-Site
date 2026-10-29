# Hardware portfolio

One source, three outputs:

| output | where | made by |
|---|---|---|
| the web deck | `dusk/portfolio/index.html` → weymenkoo.github.io/Personal-Site/portfolio/ | `npm run portfolio` |
| the PDF to send | `WeymenKoo_HardwarePortfolio_2026-11.pdf`, printed from the web deck | `npm run portfolio:pdf` (and on every deploy) |
| the PowerPoint | `WeymenKoo_HardwarePortfolio_2026-11.pptx`, editable | `npm run portfolio:pptx` |

```
tools/portfolio/
  content.js      THE FILE YOU EDIT: every word, spec, table and image on every page
  tokens.js       colours and the 1920 × 1080 artboard
  figures.js      the original diagrams (block diagrams, stackup, hot loop) → dusk/portfolio/fig/
  layout.js       places everything on the artboard; both outputs draw these exact boxes
  build-html.js   → dusk/portfolio/index.html
  build-pdf.js    prints the web deck to PDF (headless Chromium)
  build-pptx.js   → .pptx (pptxgenjs + sharp)
  build.js        runs the above
dusk/portfolio/
  index.html      GENERATED, don't edit by hand; commit it after a build
  portfolio.css   the deck's look; portfolio.js: present mode, keyboard, lightbox
  img/ fig/ fonts/
```

## Editing

1. Change `content.js`. Put anything you haven't confirmed in `[[ double brackets ]]`:
   it renders cyan with brackets on the site and in the .pptx, so it can't ship by accident.
2. `npm run portfolio`, then `npm run serve` and open http://localhost:8000/Personal-Site/portfolio/
3. `npm test` before you push. The suite fails if `index.html` is stale or if any text
   spills out of its box, so a too-long line shows up as a failing test, not a broken slide.

`npm run portfolio:todo` lists every `[[ ]]` left and the pages still showing a
"Figure to add" placeholder.

### Adding a photo or figure

- Photos go in `dusk/portfolio/img/`, about 1600 px on the long side, JPEG ~80, lowercase names.
  Give `w` and `h` (the file's pixel size) in `content.js`.
- A deep-dive page with `figure: null` shows the dashed placeholder named by `placeholder:`.
  Replace it with `figure: { src: 'img/a5-switch-node.png', w: 1600, h: 900, alt: '…' }`.
- Scope captures: export PNG, keep the filename that records the conditions
  (`pb25_ripple_5A_16V.png`), and say the probe setup in the caption.
- Diagrams are drawn in `figures.js`. Don't paste in other people's figures; redraw and cite.

### Page types

`cover` · `summary` · `overview` (image left, specs right) · `story` (two columns, 2024 → 2025) ·
`gallery` (8 tiles) · `deep` (one idea: headline, figure left, body + specs/table right;
`layout: 'table'` for a full-width table; `figures: [a, b]` for two side by side) · `back`.

## The PowerPoint

`npm install` once, then `npm run portfolio:pptx`. It lands in `dusk/portfolio/` (git-ignored).
Install **Space Grotesk** and **JetBrains Mono** (free, Google Fonts) on the machine that opens
it, or PowerPoint substitutes them and lines rewrap. Diagrams come in as images; edit them
in `figures.js` and rebuild, not in PowerPoint. If you edit text in PowerPoint, copy the change
back into `content.js`, or the next build overwrites it.

## The page around the deck

Borrowed from willwhang.dev: an author card on the left (`meta.tagline`, `location`, `school`
in `content.js`), a grid of project cards above the deck (`cards` in `content.js`, plus every
gallery tile that has a photo), and an "On this page" list on the right that lights the slide
you're on (each appendix page's `short` label). The desk follows the OS light/dark setting; the
slides stay light, because they're the same pages as the PDF. None of this is in the PDF or .pptx.

## Presenting

On the site: **Present** (or any page, then the button) goes full screen; ← → / PgUp PgDn /
click to move, Esc to leave. The page index is under **Pages**.

## No Chromium download?

If `npx playwright install` is blocked, point the PDF build and the tests at a Chromium you have:
`CHROMIUM_PATH=/path/to/chrome npm run portfolio:pdf`.
