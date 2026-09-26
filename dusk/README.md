# Dusk

A day, from golden hour to night. Scroll down and the page changes hour.

```
index.html              page shell: hero, section headings, career timeline
assets/dusk.css         styling
assets/dusk.js          hour snap, tape counter, liner notes, lightbox, record player
assets/entries.js       builds projects / tapes / records from content/
assets/article.css      long-form project pages (+ article.js)
content/
  manifest.json         which projects and tapes appear, and in what order
  hero.jpg              the landing photo (add your own)
  placeholder.webp      shown for any image that's missing (the beach photo)
  projects/<slug>/      entry.json + that project's images (+ index.html, its article)
  tapes/<slug>/         entry.json + that roll's frames
  records.json          the record shelf
design/                 logo sheet + toucan.svg (the mark, also the favicon)
```

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

**2. Add the images** to that folder. Filenames are up to you; you refer to
them by name in step 3.

    content/projects/foc-controller/
      entry.json
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
| `link` | where "Read →" goes; `""` hides the link |

**4. List it in `content/manifest.json`.** Order here is order on the page:

```json
{
  "projects": ["foc-controller", "micromouse"],
  "tapes": ["hanoi-2024"]
}
```

Remove `"example"` from the list once you have a real entry. You can delete
its folder too, or keep it around to copy from.

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

Records have no images, so there's no folder. Add an object to
`content/records.json`. The first record is the one loaded in the player.

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

A project card can link to a long-form page. The page lives in the
project's own folder, next to its `entry.json` and images.

**1.** The template is already in the folder you copied:
`content/projects/<slug>/index.html`.

**2.** Point the card at it — in `entry.json`:

```json
"link": "content/projects/<slug>/index.html"
```

**3.** Edit `index.html`. Replace every `PLACEHOLDER`; delete what you
don't need. Images are paths relative to the folder: `"cover.jpg"`,
`"layers.gif"`.

Each `<section data-hour="...">` snaps the page to that hour as you
scroll, same as the homepage. Use them in order:
`golden → afternoon → dusk → blue → night → off`. The deck's tape
counter becomes a reading-progress counter, and its nav links point at
your section `id`s.

| component | markup | use it for |
|---|---|---|
| chapter | `<section class="ar-ch" data-hour="…">` + `.ar-kick` + `<h2>` | each part of the story |
| slide quote | `<blockquote class="ar-slide"> … <cite>` | words lifted off an old deck, with where they came from |
| image | `<figure class="ar-fig">` (add `ar-gif` for GIFs) | one picture |
| full width | `<figure class="ar-bleed">` | the one photo that deserves the whole screen |
| gallery | `<div class="ar-grid two">` / `three`, add `land` for 4:3 | photos side by side |
| text message | `<div class="ar-chat">` (who, typing, msg, seen) | the 2 AM message; the dots "type" before it appears |
| checklist | `<ul class="ar-check">`, `class="done"` on the ticked one | options you weighed |
| three columns | `<div class="ar-gbu">` with `.good` `.bad` `.ugly` | a verdict |
| before → after | `<table class="ar-fix">` | what broke, what changed |
| specs | `<dl class="ar-specs">` | the numbers, at the end |
| liner note | `<p class="liner liner-off" id="offLine">` | a random line from the homepage pool |

**Give every image its `width` and `height`** (the file's real pixel size,
e.g. `<img src="cover.jpg" width="1456" height="840" …>`). The browser then
reserves the space before the image arrives. Without it, a photo loading
late pushes the page down, and the hour label can end up showing the wrong
section until you scroll again.

**GIFs:** keep each under about 1 MB — around 500 px wide, a few
frames, a shared palette. Always add `loading="lazy"`. A long GIF of a
photo is the fastest way to make the page heavy; a slideshow of 3–5
stills is usually better than a crossfade.

**Quoting your old slides:** fine, it's your writing. Don't paste in
memes or other people's images off those slides — they're copyrighted,
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
It copies the site, adds projects, rolls and records **by following the
steps in this README**, and checks that they render. It also covers the
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
