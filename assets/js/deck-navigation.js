(() => {
  'use strict';

  const slides = Array.from(document.querySelectorAll('.slide'));
  let current = 0;

  const counter = document.getElementById('counter');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');

  function pad(n) { return String(n).padStart(2, '0'); }

  function update() {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    counter.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slides.length - 1;
    document.dispatchEvent(new CustomEvent('slidechange', { detail: { index: current, slide: slides[current] } }));
  }

  function go(delta) {
    const next = Math.min(slides.length - 1, Math.max(0, current + delta));
    if (next !== current) {
      current = next;
      update();
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault(); go(+1); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); go(-1); break;
      case 'Home':
        e.preventDefault(); current = 0; update(); break;
      case 'End':
        e.preventDefault(); current = slides.length - 1; update(); break;
      case 'f':
      case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
        break;
    }
  });

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(+1));

  update();
})();
