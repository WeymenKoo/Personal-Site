# Dusk

A day, from golden hour to night. Scroll down and the page changes hour.

```
index.html              page shell: hero, section headings, career timeline
assets/dusk.css         styling
assets/dusk.js          hour snap, tape counter, liner notes, lightbox, record player
assets/entries.js       builds projects / tapes / records from content/
content/
  manifest.json         which projects and tapes appear, and in what order
  hero.jpg              the landing photo (add your own)
  placeholder.svg       shown for any image that's missing
  projects/<slug>/      entry.json + that project's images
  tapes/<slug>/         entry.json + that roll's frames
  records.json          the record shelf
design/                 logo sheet + toucan.svg (the mark, also the favicon)
```

## Running it locally

`entries.js` loads JSON with `fetch()`, which browsers block on `file://`.
Double-clicking index.html gives you empty sections. Serve the folder instead:

    cd dusk
    python3 -m http.server          # then open http://localhost:8000

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

### Finding a Spotify track ID

Spotify → the song → Share → Copy song link. You get something like:

    https://open.spotify.com/track/75Suv3FnFQji4Lp3ATMLJ1?si=abc123
                                   └──────── this part ──┘

### Image checklist

- Export at about **1800 px on the long side**, JPEG quality ~80. A full-size
  scan is 10× the bytes for no visible difference.
- **Lowercase filenames, no spaces.** Netlify's server is case-sensitive:
  `Cover.JPG` works on your laptop and breaks in production.
- **Always write `alt` text.** Describe what's in the photo, for screen
  readers and for when an image fails to load.
- **Replacing an image?** Keeping the same filename is fine. Netlify is
  set to re-check `content/` on every visit, so nobody gets a stale copy.

### When something doesn't show up

Open the browser console (F12 → Console). Anything `entries.js` couldn't
load is logged there with `[entries]` and the file path.

| symptom | likely cause |
|---|---|
| one entry missing, console says `skipped …` | a JSON syntax error in that file: a trailing comma, or a missing quote or bracket. Paste the file into https://jsonlint.com |
| grey "PHOTO" box | the `src` filename doesn't match the file on disk (check case and extension) |
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

## Performance

`tools/scroll-profile.js` (at the repo root) scrolls the page in headless
Chromium and reports frame times. Run it after any visual change that
touches fixed, blurred or blended layers. p95 should stay around 16.7 ms
(60 fps).

    node ../tools/scroll-profile.js http://localhost:8000/index.html

## Deploy

Drag the `dusk` folder onto https://app.netlify.com/drop
