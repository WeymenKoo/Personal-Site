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

The short version of every project, one picture each, and the printable
**portfolio.pdf** are on my GitHub profile: **[github.com/WeymenKoo](https://github.com/WeymenKoo)**.

They're generated here from the projects' `entry.json` by `npm run tldr`
(into `dusk/tldr.md` and `dusk/portfolio.pdf`), published with the site,
and the profile repo picks them up on its own (see
[`.github/workflows/sync-portfolio.yml`](https://github.com/WeymenKoo/WeymenKoo/blob/main/.github/workflows/sync-portfolio.yml) there).

## Editing

Each project is a folder under `dusk/content/projects/` with its images
and one Markdown file, `article.md`, which is the write-up. Edit that file
to change the article. The profile's Projects section and `portfolio.pdf` come
from each project's `entry.json`: after changing one, run `npm run tldr`.

Adding projects, writing an article, running it
locally, and deploying: see **[dusk/README.md](dusk/README.md)**.
