# Dusk — prototype

A day, from golden hour to night. Scroll down and the page changes hour.

```
index.html          the whole page
assets/dusk.css     styling
assets/dusk.js      the colour blend, tape counter, lightbox, record player
img/photos/         film scans, named tN-NN-description.jpg
img/projects/       project images
```

## The hours

Each `<section>` has `data-hour="..."`. The page blends between the hours
of neighbouring sections as you scroll. The palettes live at the top of
`assets/dusk.js` in `HOURS` — change a colour there and the site follows.

    golden -> afternoon -> dusk -> blue -> night -> off

## Things to fill in (search for PLACEHOLDER)

- The hello paragraph on the landing page — rewrite it in your voice
- Tape titles, locations, and the two-line notes for each roll
- The "why" line under each record

## Changing a song

Every Spotify player is currently Johnny B. Goode. To change one:
Spotify -> the song -> Share -> Copy song link. The ID is the part after
`/track/` and before any `?`. Paste it into the iframe `src` (for tapes)
or `data-track` (for records).

## Adding a photo roll

Copy one `<article class="tape">` block. The first frame is always the
big one. If a roll has an awkward count, `class="w6"` makes a frame
half-width and `class="w12"` makes it a full-width strip.

Images: export at ~1800px on the long side, lowercase filenames.

## Deploy

Drag the `dusk` folder onto https://app.netlify.com/drop
