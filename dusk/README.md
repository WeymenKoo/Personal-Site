# Dusk

A day, from golden hour to night. Scroll down and the page changes hour.

```
index.html              page shell: hero and section headings
assets/dusk.css         styling
assets/dusk.js          hour snap, tape counter, liner notes, lightbox, record player
assets/entries.js       builds projects / tapes / records from content/
assets/article-md.js    builds a project's write-up page from its article.md
assets/article.css      styling for those pages (+ article.js, vendor/marked)
content/
  manifest.json         which projects and tapes appear, and in what order
  hero.jpg              the landing photo (add your own)
  placeholder.webp      shown for any image that's missing (the beach photo)
  projects/<slug>/      one folder per project:
    entry.json            the card on the homepage
    article.md            the write-up, in Markdown  <- the file you edit
    *.jpg / *.png / *.gif its images
    index.html            the page that shows article.md (same in every folder, never edited)
  tapes/<slug>/         entry.json + that roll's frames
  records.json          the record shelf
design/                 logo sheet + toucan.svg (the mark, also the favicon)
```

Side A currently holds three projects: `fc-som`, `foc-controller` and
`avionics`. Side B (photo rolls) and the record shelf are empty for now and
say "Nothing here yet." until you add an entry. The templates to copy are
still in `content/projects/example` and `content/tapes/example`.

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
the manifest.** Numbering (A1, A2… / Tape 01, 02…) and the counts in the
section headings are worked out automatically from manifest order.

### A project (Side A)

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
| `link` | where "Read →" goes: `"content/projects/<slug>/index.html"` for the write-up in this folder (see "Writing an article"), or any URL; `""` hides the link |

The card photo is shown about 600 px wide and the strip thumbnails about
150 px. Give the card its own small copies (around 1200 px for the cover,
480 px squares for the strip) and keep the full-size images for the
article: big images in the cards make scrolling stutter.

**4. List it in `content/manifest.json`.** Order here is order on the page:

```json
{
  "projects": ["foc-controller", "micromouse"],
  "tapes": ["hanoi-2024"]
}
```

Leave `example` out of the list; its folder stays as the template to copy
from. An empty list (`"tapes": []`) is fine: that side shows "Nothing here
yet."

### A photo roll (Side B)

Same four steps, in `content/tapes/`:

    cp -r content/tapes/example content/tapes/hanoi-2024

```json
{
  "title": "Humid afternoon",
  "location": "Hanoi",
  "film": "Portra 400",
  "notes": "Two lines about this roll.",
  "song": "75Suv3FnFQji4Lp3ATMLJ1",
  "frames": [
    { "src": "01.jpg", "alt": "Hawker cooking over a wok" },
    { "src": "02.jpg", "alt": "Open-air café counter" },
    { "src": "03.jpg", "alt": "Minaret between buildings" },
    { "src": "04.jpg", "alt": "Motorbike in a doorway", "width": 6 },
    { "src": "05.jpg", "alt": "The city from a high floor", "width": 6 }
  ]
}
```

- **The first frame is always the big one.** Put your strongest shot first.
- The layout is a 12-column grid. After the big first frame, frames are
  4 columns wide by default. `"width": 6` makes a frame half-width and
  `"width": 12` makes it a full-width strip. Use them to tidy up an
  awkward count.
- `song` is a Spotify track ID (see below). `""` hides the player.
- The frame count in the header is counted for you.

### A record (the shelf)

Records have no images, so there's no folder. Add an object to the list in
`content/records.json` (it starts empty: `[]`; separate objects with
commas). The first record is the one loaded in the player. With no records,
the shelf says "Nothing here yet." and the player is hidden.

```json
{
  "track": "75Suv3FnFQji4Lp3ATMLJ1",
  "title": "Johnny B. Goode",
  "artist": "Chuck Berry",
  "why": "One line on why.",
  "sleeve": ["#F2B45A", "#D9534F"],
  "ink": "#2A1410"
}
```

`sleeve` is the two gradient colours on the cover; `ink` is the text colour
on it. Pick an `ink` that reads clearly against both sleeve colours.

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

**Each `##` heading starts a chapter.** Chapters are numbered for you, and
each one moves the page on an hour, the way the homepage does: the title
block is golden hour, the last chapter is lights off, and the chapters in
between are spread across the afternoon, dusk, blue hour and night. The
deck's tape counter becomes a reading-progress counter.

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

Images are paths relative to the project folder: `cover.jpg`,
`layers.gif`. The `alt` text in the square brackets is required: describe
what's in the picture.

**Fancier blocks are plain HTML inside the Markdown.** Paste the block
on its own lines, with a blank line before and after and none inside it.
`avionics/article.md` uses all of these:

| block | markup |
|---|---|
| text message (the dots "type" before it appears) | `<div class="ar-chat">` with `.who`, `.typing`, `.msg`, `.seen` |
| three-column verdict | `<div class="ar-gbu">` with `.good` `.bad` `.ugly` |
| the ECG trace | `<div class="ar-ecg">` |

**Previewing:** GitHub and most editors render `article.md` well enough to
proofread, but only the site shows the real layout. Run it locally (above).

**GIFs:** keep each under about 1 MB (around 500 px wide, a few frames, a
shared palette). A slideshow of 3–5 stills is usually better than a
crossfade. `npm test` fails on any image over 1 MB.

**Quoting your old slides:** fine, it's your writing. Don't paste in
memes or other people's images off those slides. They're copyrighted,
and on a public site they're the part that gets taken down.

### Finding a Spotify track ID

Spotify → the song → Share → Copy song link. You get something like:

    https://open.spotify.com/track/75Suv3FnFQji4Lp3ATMLJ1?si=abc123
                                   └──────── this part ──┘

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

## The hours

Each `<section>` in index.html has a `data-hour`. When a section's top
crosses a little past the middle of the screen, the page snaps to that hour:

    golden -> afternoon -> dusk -> blue -> night -> off

- **Colours:** `HOURS` at the top of `assets/dusk.js`.
- **Fade speed:** `--fade` in the `HOUR SNAP` block at the top of
  `assets/dusk.css` (default `.6s`).

The ink colour flips halfway through the fade, so text never sits
grey-on-grey. With "reduce motion" switched on in the OS, the change is
instant.

## Tests

The suite lives in `tests/` at the repo root and runs in headless Chromium.
It copies the site, adds projects, rolls, records and a Markdown article
**by following the steps in this README**, and checks that they render. It
also opens the three published articles (every image loads and has alt
text, nothing over 1 MB, no leftover `PLACEHOLDER`), and covers the
lightbox, record player, hour snap, tape counter, nav, phone layout,
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
