# Weymen Koo — personal site

Circuit boards and flight hardware: a title screen over a pixel city, then the projects.

**Live:** https://weymenkoo.github.io/Personal-Site/

```
dusk/        the site itself: this folder is what gets published
tests/       Playwright tests (npm test)
tools/       scroll-profile.js, a frame-time profiler (npm run profile)
.github/     test + deploy workflow for GitHub Pages
```

## Projects

The **[portfolio.pdf](https://weymenkoo.github.io/Personal-Site/portfolio.pdf)** is a work sample for job
applications: four projects, each as board, design and layout, test results and use, on one fixed grid. It is
written in `tools/portfolio/content.js` and printed by `npm run portfolio` into `dusk/portfolio.pdf`, published with
the site. See [tools/portfolio/README.md](tools/portfolio/README.md). The GitHub profile
README is hand-written and just links here.

## Editing

Each project is a folder under `dusk/content/projects/` with its images
and one Markdown file, `article.md`, which is the write-up. Edit that file
to change the article. `portfolio.pdf` is separate: edit `tools/portfolio/content.js`, then run
`npm run portfolio`.

Adding projects, writing an article, running it
locally, and deploying: see **[dusk/README.md](dusk/README.md)**.
