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

The printable one-page-per-project **[portfolio.pdf](https://weymenkoo.github.io/Personal-Site/portfolio.pdf)**
is generated from the projects' `entry.json` by `npm run tldr` (into
`dusk/portfolio.pdf`) and published with the site. The GitHub profile
README is hand-written and just links here.

## Editing

Each project is a folder under `dusk/content/projects/` with its images
and one Markdown file, `article.md`, which is the write-up. Edit that file
to change the article. `portfolio.pdf` comes from each project's `entry.json`: after changing
one, run `npm run tldr`.

Adding projects, writing an article, running it
locally, and deploying: see **[dusk/README.md](dusk/README.md)**.
