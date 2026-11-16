# Weymen Koo — personal site

Circuit boards, film photographs, and records: a day, from golden hour to night.

**Live:** https://weymenkoo.github.io/Personal-Site/

```
dusk/        the site itself: this folder is what gets published
dusk/portfolio/   the hardware portfolio deck (generated; see tools/portfolio/README.md)
tests/       Playwright tests (npm test)
tools/       scroll-profile.js, a frame-time profiler (npm run profile)
tools/portfolio/  the portfolio's source: content.js → web deck, PDF and .pptx
.github/     test + deploy workflow for GitHub Pages
```

Each project is a folder under `dusk/content/projects/` with its images
and one Markdown file, `article.md`, which is the write-up. Edit that file
to change the article.

Adding projects, photo rolls and records, writing an article, running it
locally, and deploying: see **[dusk/README.md](dusk/README.md)**.

**Hardware portfolio:** https://weymenkoo.github.io/Personal-Site/portfolio/ —
edit it in `tools/portfolio/content.js`; see **[tools/portfolio/README.md](tools/portfolio/README.md)**.
