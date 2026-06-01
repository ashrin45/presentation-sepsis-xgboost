(() => {
  'use strict';

  const DESIGN_W = 1280;
  const DESIGN_H = 720;
  const MARGIN = 0.96;

  function resize() {
    if (document.documentElement.classList.contains('print-mode')) return;
    const sw = window.innerWidth  * MARGIN;
    const sh = window.innerHeight * MARGIN;
    const scale = Math.min(sw / DESIGN_W, sh / DESIGN_H);
    document.querySelectorAll('.slide').forEach(s => {
      s.style.transform = '';
      s.style.zoom = scale;
    });
  }

  window.addEventListener('resize', resize);
  document.addEventListener('DOMContentLoaded', resize);
  resize();
})();
