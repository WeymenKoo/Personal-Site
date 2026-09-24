# Dusk

A day, from golden hour to night. Scroll down and the page changes hour.

```
index.html              page shell: hero, section headings, career timeline
assets/dusk.css         styling
assets/dusk.js          colour blend, tape counter, liner notes, lightbox, record player
assets/entries.js       builds projects / tapes / records from content/
content/
  manifest.json         which projects and tapes appear, and in what order
  hero.jpg              the landing photo
  placeholder.svg       shown for any image that's missing
  projects/<slug>/      entry.json + that project's images
  tapes/<slug>/         entry.json + that roll's frames
  records.json          the record shelf
design/                 logo sheet + toucan.svg (the mark, also the favicon)
```

## Running it locally

`entries.js` loads JSON with `fetch()`, which browsers block on `file://`.
Opening index.html by double-clicking gives you empty sections. Serve it:

    cd dusk && python3 -m http.server     # then http://localhost:8000

## Adding a project

1. Copy `content/projects/example/` to `content/projects/<your-slug>/`
2. Drop the images in that folder and edit `entry.json`
3. Add `"<your-slug>"` to `projects` in `content/manifest.json`

Numbering (A1, A2…) and the count in the heading follow manifest order.

| field | notes |
|---|---|
| `status` | `ok` (green) · `wip` (amber) · `stop` (red) · `idle` (grey) |
| `statusLabel` | the words next to the dot |
| `cover.fit` | `cover` crops to fill; `contain` for renders on white |
| `strip` | optional row of thumbnails; `[]` to hide |
| `link` | the "Read →" target; `""` hides it |

## Adding a photo roll

Same three steps, in `content/tapes/`. The first frame is always the big one.
For an awkward count, `"width": 6` makes a frame half-width and
`"width": 12` makes it a full-width strip.

Images: export at ~1800px on the long side, lowercase filenames.

## Adding a record

Append an object to `content/records.json`. `sleeve` is the two gradient
colours, `ink` the text colour on the sleeve.

## Changing a song

Spotify → the song → Share → Copy song link. The ID is the part after
`/track/` and before any `?`. It goes in `song` (tapes) or `track` (records).

## The hours

Each `<section>` has `data-hour="..."`. The palettes live at the top of
`assets/dusk.js` in `HOURS`.

    golden -> afternoon -> dusk -> blue -> night -> off

## Deploy

Drag the `dusk` folder onto https://app.netlify.com/drop
