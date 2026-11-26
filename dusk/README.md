# Top floor

A title screen — the view from a top-floor bar over a pixel city — and the
projects. Light or dark follows the device's setting.

```
index.html              page shell: the title screen, the projects, the footer
contact.html            the telegraph (+ assets/contact.css, contact.js)
resume.html             work history (+ assets/resume.css)
assets/site.css         the look (dark and light themes at the top)
assets/fx.js            the moving parts: quotes, the sky, the bar, the wind,
                        the article lightbox and the hidden things
assets/entries.js       builds the project cards from content/
assets/article-md.js    builds a project's write-up page from its article.md
assets/article.css      styling for those pages (+ article.js, vendor/marked)
assets/img/             the city (dark and light) and the pixel-ship cursor
content/
  manifest.json         which projects appear, and in what order
  placeholder.webp      shown for any image that's missing
  projects/<slug>/      one folder per project:
    entry.json            the card on the homepage
    article.md            the write-up, in Markdown  <- the file you edit
    *.jpg / *.png / *.gif its images
    index.html            the page that shows article.md (same in every folder, never edited)
design/                 logo sheet + toucan.svg (the favicon)
```

There are ten projects: `fc-som`, `foc-controller`, `power-board`,
`avionics-2024`, `kyogre-spirit`, `dc-load`, `micromouse`, and the three
pre-PCB ones, `protoboard-avionics`, `water-rocket` and `rover` (written with
`layout: gallery`). The template to
copy is `content/projects/example`.

## Running it locally

`entries.js` loads JSON with `fetch()`, which browsers block on `file://`.
Double-clicking index.html gives you empty sections. Serve the folder instead.
From the repo root:

    npm run serve                   # then open http://localhost:8000/Personal-Site/

This serves the site under `/Personal-Site/`, exactly as GitHub Pages will,
so a path that would break in production also breaks here. No Node? Use
`cd dusk && python3 -m http.server` (then http://localhost:8000/) instead.

Leave it running. Save a file, reload the page, and you'll see the change.

---

## Adding entries

Every entry works the same way: **a folder, a JSON file, and one line in
the manifest.** Numbering (A1, A2…) and the project count are worked out
automatically from manifest order.

### A project

**1. Copy the template folder.** Name it with a short lowercase slug, with no
spaces and no number (the number comes from the manifest order):

    cp -r content/projects/example content/projects/foc-controller

The copy brings three files: `entry.json` (the card), `article.md` (the
write-up) and `index.html` (the page that shows the write-up; leave it alone).

**2. Add the images** to that folder. Filenames are up to you; you refer to
them by name in step 3.

    content/projects/foc-controller/
      entry.json
      article.md
      index.html
      cover.jpg
      rev1.jpg

**3. Edit `entry.json`:**

```json
{
  "title": "Field-oriented motor controller",
  "status": "wip",
  "statusLabel": "At fab",
  "year": "2026",
  "spec": "50 V · 3-phase · ±27.5 A · CAN FD",
  "summary": "A three-phase FOC controller on an STM32G431 ...",
  "cover": { "src": "cover.jpg", "alt": "Rev 01, top and bottom render", "fit": "contain" },
  "strip": [
    { "src": "rev1.jpg", "alt": "Rev 1 on the bench", "caption": "Rev 1" }
  ],
  "link": ""
}
```

| field | what it does |
|---|---|
| `status` | dot colour: `ok` green · `wip` amber · `stop` red · `idle` grey |
| `statusLabel` | the words beside the dot: "Flown", "At fab", "Calibrating"… |
| `year` | shown on the LCD in the footer |
| `spec` | the one-line spec in accent colour; separate items with ` · ` |
| `cover.fit` | `cover` crops to fill the frame; `contain` shows the whole image (use for renders on white) |
| `strip` | optional row of thumbnails under the spec; `[]` hides it |
| `tldr` | optional: `{ "src", "alt" }`, a 4:3 photo of the real board for the card; without it the card uses `cover` |
| `portfolio` | optional: `false` marks a project as site-only (the high-school ones). `portfolio.pdf` itself is written by hand in `tools/portfolio/content.js` |
| `link` | where "Read →" goes: `"content/projects/<slug>/index.html"` for the write-up in this folder (see "Writing an article"), or any URL; `""` hides the link |

The card shows the `tldr` picture
when there is one, otherwise the `cover`, at 4:3, about 600 px wide. Give it
its own 1200 × 900 copy, centred on the subject, and keep the full-size
images for the article: big images in the cards make scrolling stutter.
`strip` is no longer shown on the homepage; it can stay in the file.

**4. List it in `content/manifest.json`.** Order here is order on the page:

```json
{
  "projects": ["foc-controller", "micromouse"]
}
```

Leave `example` out of the list; its folder stays as the template to copy
from.

### Writing an article (the "Read →" page)

Each project's write-up is one Markdown file in the project's own folder:
`content/projects/<slug>/article.md`. Edit it in any text editor, save,
reload the page. There is no build step.

**1.** The template is already in the folder you copied: `article.md`.

**2.** Point the card at the page that shows it. In `entry.json`:

```json
"link": "content/projects/<slug>/index.html"
```

**3.** Write `article.md`:

```markdown
---
title: FOC Motor Controller
subtitle: One sentence under the title.
team: Individual work
role: Design, layout, bring-up
date: Rev 1 · 2026
---

The opening paragraph. Anything above the first ## sits under the title.

| | |
|---|---|
| Bus | 12S LiPo, `50.4 V` full |
| MCU | STM32G431 |

## Renders

![Top side render](render-top.jpg "Top: bridge, gate driver, MCU.")

## Small label | The big heading

Body text.
```

The block between the two `---` lines sets the header. Every line in it is
optional: without `title`, the page uses the title from `entry.json`. The
status dot and its label always come from `entry.json`, so the card and the
article never disagree.

**Each `##` heading starts a chapter.** Chapters are numbered for you. Every
picture opens big on the page when clicked. The page ends with a quote and
the way back to the projects.

| you write | you get |
|---|---|
| `## Heading` | a numbered chapter |
| `## Small label \| Heading` | the same, with a small label beside the number |
| `### Heading` | a smaller heading inside a chapter |
| `![alt](file.jpg "Caption")` on its own line | one image with a caption (the caption is optional) |
| two or three of those on consecutive lines | images side by side |
| `file.jpg#wide` | a wider image; `#bleed` gives it the whole screen |
| `file.jpg#tall` / `#land` on the first of a side-by-side group | crops the group to 3:4 / 4:3 so mixed shapes line up |
| `> a quote` ending with a line `> — where it's from` | the quote box, with its source |
| a table with an empty header row (`\| \| \|`) | a spec sheet: label on the left, value on the right |
| any other table | a table; a cell holding only `→` gets the accent colour |
| `` `5 V` `` | a number in the accent colour |
| `- [ ]` / `- [x]` list | a checklist, with the ticked one highlighted |
| `~~word~~` | struck through |
| `[text](https://…)` | a link (opens in a new tab if it leaves the site) |
| `layout: gallery` in the block between the `---` lines | a page that's mostly pictures: a wider column for the photos, text kept at reading width, and four or more images on consecutive lines make a photo wall (one column on a phone) |

Images are paths relative to the project folder: `cover.jpg`,
`layers.gif`. Clicking any image opens the full-size file in a new tab, so a
schematic can be exported large and still fit the column. The `alt` text in the square brackets is required: describe
what's in the picture.

**Fancier blocks are plain HTML inside the Markdown.** Paste the block
on its own lines, with a blank line before and after and none inside it.
The styles for these live in `assets/article.css`:

| block | markup |
|---|---|
| text message (the dots "type" before it appears) | `<div class="ar-chat">` with `.who`, `.typing`, `.msg`, `.seen` |
| three-column verdict | `<div class="ar-gbu">` with `.good` `.bad` `.ugly` |
| the ECG trace | `<div class="ar-ecg">` |
| results in big numbers (they count up as they scroll in) | `<div class="ar-stats">` holding `<div><b>36 W</b><span>what it means</span></div>` per number; add `class="bad"` to a child to show it in red |

**Previewing:** GitHub and most editors render `article.md` well enough to
proofread, but only the site shows the real layout. Run it locally (above).

**GIFs:** keep each under about 1 MB (around 500 px wide, a few frames, a
shared palette). A slideshow of 3–5 stills is usually better than a
crossfade. `npm test` fails on any image over 1 MB.

**Quoting your old slides:** fine, it's your writing. Don't paste in
memes or other people's images off those slides. They're copyrighted,
and on a public site they're the part that gets taken down.

### Image checklist

- Export at about **1800 px on the long side**, JPEG quality ~80. A full-size
  scan is 10× the bytes for no visible difference.
- **Lowercase filenames, no spaces.** GitHub Pages is case-sensitive:
  `Cover.JPG` can work on your Mac or Windows laptop and break once deployed.
- **Always write `alt` text.** Describe what's in the photo, for screen
  readers and for when an image fails to load.
- **Replacing an image?** Keeping the same filename is fine, but GitHub
  Pages lets browsers cache files for about 10 minutes, so visitors may see
  the old one briefly. Hard-refresh (Ctrl/Cmd + Shift + R) to check yours.
- **Keep photos out of `main` until you mean to publish them.** Anything
  committed stays in git history, even after you delete it.

### When something doesn't show up

Open the browser console (F12 → Console). Anything `entries.js` couldn't
load is logged there with `[entries]` and the file path.

| symptom | likely cause |
|---|---|
| one entry missing, console says `skipped …` | a JSON syntax error in that file: a trailing comma, or a missing quote or bracket. Paste the file into https://jsonlint.com |
| the beach placeholder instead of your photo | the `src` filename doesn't match the file on disk (check case and extension) |
| entry missing | its slug isn't in `manifest.json`, or is spelled differently from the folder |
| "Read →" opens "Nothing to read yet." | the folder has no `article.md` (check the spelling; the console line starts with `[article]`) |
| "Read →" opens a 404 | the folder has no `index.html`: copy it from `content/projects/example/` |
| a heading or table shows as plain text | it needs a blank line before it |
| everything empty | you opened the file directly (use the local server above), or `manifest.json` itself has a syntax error |

---

## The moving parts (assets/fx.js)

- **Theme.** `site.css` has the dark colours in `:root` and the light ones
  in the `prefers-color-scheme: light` block under it. The city has a
  picture for each: `assets/img/city-dark.png`, `city-light.png`.
- **The city.** Drawn by `tools/city/build_city.py` (run it to redraw):
  Marina Bay Sands, Pacific Central Station, Tokyo Tower, Elizabeth Tower,
  Bitexco Tower, the Transamerica Pyramid and the Petronas Towers over a neon
  district. It is one 4800 px wide banner, anchored to the right edge and
  never repeated: narrower screens crop more off the left, so the landmarks
  sit in the right half and stay clear of the title. `city-lights-a.png` / `-b.png` hold just
  the aviation lights; `site.css` blinks them (`@keyframes av`). The SOS
  window and the jazz club's button are placed by `TILE` in `fx.js`
  (`build_city.py --sos` prints the numbers if the picture changes).
- **The Low Pass.** The jazz club in the skyline: click it for an original
  swing tune synthesised in the browser (`jazz` in `fx.js`); click again
  to stop.
- **Below the city** (`assets/depths.js`, index and résumé). As you scroll
  past the title, a faint underground (piles, pipes, a data cable) gives way
  to the sea: three real research subs (click them) and a hunter-killer that
  fires torpedoes at the cursor in the margins; over the project boxes
  you're in cover. At the bottom, a tube platform with ads and trains; put
  the cursor on the track and the train stops. Nothing fixed sits in the
  middle column, and anything crossing it fades nearly out.
- **Shooting things down.** Click anything flying in the sky and it
  explodes (`boom`, `targets` in `fx.js`); it comes back a little later.
- **Quotes.** `LINES` near the top of `fx.js`. The title screen cycles
  through them; the footer and the end of each article show one at random.
- **The sky.** One scene per visit, picked at random: the patrol (the ship
  shoots down the aliens that drift in), a launch with hot staging, a
  shuttle launch that drops its boosters, a Falcon Heavy whose side
  boosters fire to come home, a shuttle gliding in to land, the space
  station or Hubble going over, a capsule under parachutes, or a red
  roadster tumbling slowly across. `SCENE_LIST` in `fx.js`;
  `index.html?scene=falcon-heavy` (or any other name in that list) picks
  one. Clicking the ship makes it barrel-roll.
- **The bar.** A different two or three drinks every visit, in different
  places (`DRINKS`). Sweep the cursor across a glass and it slides the
  way you swept; grab one and fling it; they slow down, knock into each
  other and stop at the ends of the bar. A tap says what's in it; the
  arrow keys nudge a focused glass.
- **Wind.** Whatever is flying (the ship, the aliens, the rocket and its
  booster, the shuttle, the station, the capsule, even the exhaust) drifts
  gently away from the cursor. `wind.R` is how far it reaches and `wind.K`
  how hard it blows.
- **The dock** (bottom-right, on every page): the theme button cycles
  Auto (follow the device) → Light → Dark and is remembered from page to
  page (`assets/theme.js` applies it before the page paints).
- **Pictures in articles** open big on the page (← → to step, Esc to
  close) instead of in a new tab.
- **Reduced motion** (an OS setting): the sky holds still and nothing
  shines or blinks.

### The contact page (contact.html)

A Morse cheat sheet with the email and phone number written on it in plain
sight, and a telegraph key. Tapping `HI` (or `SOS`) on the key, with the
mouse, a finger or the space bar, opens a message box. The message is words
only: "Send by email" and "Send as a text" open the visitor's own mail or
messages app with it written out, so nothing is stored and there is nowhere
to attach a file (dropped or pasted files are turned away). To change the
address or number, edit them in `contact.html` and at the top of
`assets/contact.js`. Timing (how long a dash is) is at the top of that file
too.

### The résumé page (resume.html)

The work history is written straight into `resume.html`: education,
skills, then one `<article class="job">` per role (company, title, dates,
bullets).

### After editing anything in assets/

    npm run stamp

This puts a fresh `?v=…` on every link to the CSS, JS and images, so a
returning visitor's browser can't pair the new page with an old cached
script (that shows up as a broken-looking page for ten minutes). `npm test`
fails if you forget. Editing `article.md` or `entry.json` doesn't need it,
but adding or changing pictures in a project folder does: it also rewrites
that folder's `sizes.json`, so phones hold each picture's space while it
loads instead of jumping as you scroll.

On phones (`html.lite`, set by `theme.js`) nothing flies or swims: the
stars are drawn once, and the underground and sea are one still picture
that scrolls with the page. Add `?full` to the address to see everything on
a phone, `?lite` to see the phone version on a desktop.

### Hidden things

- The white car lights are Morse: `IT WORKS ON MY BENCH`.
- The red car lights are 8-bit ASCII, a lit dot for 1: `DONT LET THE SMOKE OUT`.
- One window on the tallest tower blinks `SOS`.
- The footer's faint binary says `hi`.
- On the contact page, tapping `73` or `CQ` gets an answer; the sheet's
  bottom corner says `73`.
- ↑↑↓↓←→←→ B A on the title screen starts an invasion. Typing `sudo`,
  `smoke` or `42` gets an answer. The console has a note.

## Tests

The suite lives in `tests/` at the repo root and runs in headless Chromium.
It copies the site, adds projects and a Markdown article **by following
the steps in this README**, and checks that they render. It also opens the
published articles (every image loads and has alt text, nothing over 1 MB,
no leftover `PLACEHOLDER`), and covers both themes, the cursor, the bar,
the drinks, the wind, the hidden codes, the lightbox, reduced motion, the phone layout,
broken-entry handling and scroll performance. One-time setup, from the
repo root:

    npm install
    npx playwright install chromium

Then:

    npm test

By default the tests generate tiny images, so no personal photos need to be
in the repo. To run them against real photos, point `SITE_PHOTOS` at a
folder of JPEGs:

    SITE_PHOTOS=~/Pictures/site-export npm test

**If you change how entries work, change this README and the tests in the
same commit.** The tests are the proof that the instructions are true.

## Performance

`npm run profile` scrolls the page in headless Chromium and reports frame
times (run `npm run serve` first). Use it after any visual change that
touches fixed, blurred or blended layers. p95 should stay around 16.7 ms
(60 fps). To A/B test a CSS idea without editing files:

    npm run profile -- http://localhost:8000/Personal-Site/index.html "body::after{display:none}"

## Deploy (GitHub Pages)

Every push to `main` runs `.github/workflows/pages.yml`:

1. **test**: runs `npm test`. If anything fails, nothing is deployed and
   the live site stays as it was.
2. **deploy**: publishes the `dusk/` folder to GitHub Pages.

The site goes live at **https://weymenkoo.github.io/Personal-Site/**.
Watch a deploy under the repo's **Actions** tab. A red ✘ means the tests
caught something; click into the run to see which one.

Pull requests run the tests too but don't deploy, so you can try a change
on a branch first.

### One-time setup

1. **Repo → Settings → Pages → Build and deployment → Source: "GitHub
   Actions".**
2. GitHub Pages on a **private** repo needs a paid plan (Pro / Team). On a
   free account, the repo must be **public**. Everything in its history then
   becomes public too, including anything you've since deleted.
3. Optional custom domain: Settings → Pages → Custom domain. Then add a
   `CNAME` file containing the domain to `dusk/`.
