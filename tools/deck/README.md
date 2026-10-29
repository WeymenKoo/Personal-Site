# The portfolio deck (minimal)

`node tools/deck/build.js` → `tools/deck/WeymenKoo_HardwarePortfolio_2026.pptx` (git-ignored).
Needs `npm install` once (pptxgenjs, sharp).

- One typeface (`FONT` at the top of build.js), black on white, one orange for the single result per page.
- Every gray "Photo to add" block names the exact shot. Replace by dropping the file in `img/` and
  swapping the `ph(...)` call for `img(...)`.
- Text in `[ brackets ]` is unconfirmed. Search the file for `todo(`.
- Export the PDF from PowerPoint (File → Export) after the fonts are what you want.
