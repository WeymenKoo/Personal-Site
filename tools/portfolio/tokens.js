// Design tokens, shared by the web deck, the figures and the .pptx.
// Values from PORTFOLIO_CONTEXT.md §5.
module.exports = {
  paper: '#F7F8FA',  // page background
  white: '#FFFFFF',  // boxes inside figures
  ink: '#0B0F14',    // text, lines
  ink2: '#5B6470',   // secondary text, captions
  rule: '#D9DEE5',   // hairlines, grid
  signal: '#0A6CFF', // accent: callouts, status, links
  trace: '#19D3F5',  // secondary accent: highlights
  todo: '#0891B2',   // [[ to fill ]] text — trace, darkened to read on paper
  fault: '#E5484D',  // failure pages only
  ok: '#12A150',     // status: shipped / flown
  idle: '#8A93A0',   // status: paused / not built
  W: 1920, H: 1080,  // artboard
};
