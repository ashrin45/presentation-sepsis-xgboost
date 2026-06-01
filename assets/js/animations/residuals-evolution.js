(() => {
  'use strict';

  // S3b, animation des résidus.
  // Un seul histogramme grand format qui morphe entre les itérations en boucle automatique.
  // Consomme window.deckData.residuals_at_iteration = {"1": [...], "10": [...], ...}

  const TEAL   = '#0D9488';
  const BRICK  = '#D14545';
  const TEXT   = '#0F172A';
  const MUTED  = '#6B7280';
  const BORDER = '#E5E7EB';

  const BIN_COUNT = 22;
  const HOLD_MS   = 1600;
  const MORPH_MS  = 700;

  function fallback(container, msg) {
    container.innerHTML = `
      <div style="padding:24px;border:1px dashed ${BORDER};border-radius:8px;
                  background:#FAFAFA;color:${MUTED};font-family:Inter,sans-serif;
                  font-size:13px;text-align:center;">
        ${msg}
      </div>
    `;
  }

  function histogram(values, binCount, range) {
    const [lo, hi] = range;
    const bins = new Array(binCount).fill(0);
    const width = (hi - lo) / binCount;
    for (const v of values) {
      if (typeof v !== 'number' || !isFinite(v)) continue;
      if (v < lo || v > hi) continue;
      let idx = Math.floor((v - lo) / width);
      if (idx === binCount) idx = binCount - 1;
      bins[idx]++;
    }
    return bins;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function mount(container, data) {
    if (!container) return;
    if (container._residualsCleanup) { container._residualsCleanup(); }
    container.innerHTML = '';

    let src = data;
    if (src && typeof src === 'object' && src.residuals_at_iteration) src = src.residuals_at_iteration;
    if (!src && window.deckData && window.deckData.residuals_at_iteration) src = window.deckData.residuals_at_iteration;
    if (!src || typeof src !== 'object') {
      fallback(container, 'window.deckData.residuals_at_iteration non disponible.');
      return;
    }

    const stages = Object.keys(src)
      .map(k => ({ k, n: parseInt(k, 10), vals: Array.isArray(src[k]) ? src[k] : [] }))
      .filter(o => !isNaN(o.n) && o.vals.length)
      .sort((a, b) => a.n - b.n);
    if (!stages.length) { fallback(container, 'résidus indisponibles.'); return; }

    let lo = Infinity, hi = -Infinity;
    for (const s of stages) {
      for (const v of s.vals) {
        if (typeof v !== 'number' || !isFinite(v)) continue;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    const bound = Math.max(Math.abs(lo), Math.abs(hi), 0.001);
    const range = [-bound, bound];

    let maxCount = 0;
    for (const s of stages) {
      s.bins = histogram(s.vals, BIN_COUNT, range);
      const m = Math.max.apply(null, s.bins);
      if (m > maxCount) maxCount = m;
      // mean(|résidu|) pour affichage stat
      let sum = 0, n = 0;
      for (const v of s.vals) { if (isFinite(v)) { sum += Math.abs(v); n++; } }
      s.meanAbs = n > 0 ? sum / n : 0;
    }

    // Commentaire par position dans la séquence
    const COMMENTS = [
      'Premier arbre. Prédictions proches de la moyenne, résidus très étalés.',
      'Quelques arbres ont absorbé les cas faciles.',
      'Le boosting attaque les cas atypiques restants.',
      'La distribution se resserre nettement autour de 0.',
      'Convergence. Les arbres ajoutés en fin apportent un signal microscopique.',
    ];
    function commentFor(idx) {
      if (stages.length <= 1) return COMMENTS[COMMENTS.length - 1];
      const t = idx / (stages.length - 1);
      const pick = Math.min(COMMENTS.length - 1, Math.round(t * (COMMENTS.length - 1)));
      return COMMENTS[pick];
    }

    const W = 600, H = 230;
    const padL = 50, padR = 24, padT = 30, padB = 38;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const barW = innerW / BIN_COUNT;
    const zeroX = padL + ((0 - range[0]) / (range[1] - range[0])) * innerW;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;width:100%;
                  font-family:Inter,system-ui,sans-serif;">
        <div data-slot="header" style="display:flex;align-items:baseline;gap:16px;margin-bottom:6px;">
          <span style="font-family:JetBrains Mono,monospace;font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.08em;">Itération</span>
          <span data-slot="step-label" style="font-family:JetBrains Mono,monospace;font-size:26px;font-weight:600;color:${TEXT};">—</span>
          <span data-slot="step-progress" style="font-family:JetBrains Mono,monospace;font-size:11px;color:${MUTED};"></span>
          <span style="font-family:Inter,sans-serif;font-size:11px;color:${MUTED};">mean(|résidu|) =</span>
          <span data-slot="mean-abs" style="font-family:JetBrains Mono,monospace;font-size:14px;font-weight:600;color:${TEXT};">—</span>
        </div>
        <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
             style="width:100%;max-width:${W}px;display:block;">
          <line x1="${padL}" y1="${padT + innerH}" x2="${padL + innerW}" y2="${padT + innerH}"
                stroke="${BORDER}" stroke-width="1"/>
          <line x1="${zeroX}" y1="${padT}" x2="${zeroX}" y2="${padT + innerH}"
                stroke="${MUTED}" stroke-width="1" stroke-dasharray="2,3"/>
          <g data-slot="bars"></g>
          <text x="${padL}" y="${H - 18}" text-anchor="start"
                font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">
            ${range[0].toFixed(2)}
          </text>
          <text x="${zeroX}" y="${H - 18}" text-anchor="middle"
                font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">0</text>
          <text x="${padL + innerW}" y="${H - 18}" text-anchor="end"
                font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">
            ${range[1].toFixed(2)}
          </text>
          <text x="${padL + innerW / 2}" y="${H - 4}" text-anchor="middle"
                font-family="Inter,sans-serif" font-size="11" fill="${TEXT}">
            résidu r = y − σ(F<tspan font-style="italic">m</tspan>(x))
          </text>
          <text x="14" y="${padT + innerH / 2}" text-anchor="middle"
                font-family="Inter,sans-serif" font-size="11" fill="${TEXT}"
                transform="rotate(-90 14 ${padT + innerH / 2})">fréquence</text>
          <!-- Légende couleurs -->
          <rect x="${padL + innerW - 138}" y="${padT + 6}" width="10" height="10" fill="${TEAL}" opacity="0.62" rx="1"/>
          <text x="${padL + innerW - 124}" y="${padT + 15}" font-family="Inter,sans-serif" font-size="10" fill="${MUTED}">r &lt; 0 (sur-prédit)</text>
          <rect x="${padL + innerW - 138}" y="${padT + 22}" width="10" height="10" fill="${BRICK}" opacity="0.62" rx="1"/>
          <text x="${padL + innerW - 124}" y="${padT + 31}" font-family="Inter,sans-serif" font-size="10" fill="${MUTED}">r &gt; 0 (sous-prédit)</text>
        </svg>
        <p data-slot="caption" style="margin:8px 0 0;text-align:center;font-family:Inter,sans-serif;
                  font-size:13px;color:${TEXT};max-width:580px;min-height:36px;line-height:1.4;">
          —
        </p>
      </div>
    `;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const barsGroup = container.querySelector('[data-slot="bars"]');
    const stepLabel = container.querySelector('[data-slot="step-label"]');
    const stepProg  = container.querySelector('[data-slot="step-progress"]');
    const meanAbsEl = container.querySelector('[data-slot="mean-abs"]');
    const captionEl = container.querySelector('[data-slot="caption"]');

    const rects = [];
    for (let i = 0; i < BIN_COUNT; i++) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      const binCenter = range[0] + (i + 0.5) * (range[1] - range[0]) / BIN_COUNT;
      const color = binCenter < 0 ? TEAL : BRICK;
      rect.setAttribute('x', String(padL + i * barW + 1));
      rect.setAttribute('width', String(Math.max(0, barW - 1.5)));
      rect.setAttribute('fill', color);
      rect.setAttribute('opacity', '0.62');
      rect.setAttribute('rx', '1');
      rect.setAttribute('y', String(padT + innerH));
      rect.setAttribute('height', '0');
      barsGroup.appendChild(rect);
      rects.push(rect);
    }

    function renderBins(bins) {
      for (let i = 0; i < BIN_COUNT; i++) {
        const c = bins[i];
        const hh = maxCount > 0 ? (c / maxCount) * innerH : 0;
        rects[i].setAttribute('height', hh.toFixed(2));
        rects[i].setAttribute('y', (padT + innerH - hh).toFixed(2));
      }
    }

    function setLabel(stage, nextStage, t) {
      const shownStage = (!nextStage || t < 0.5) ? stage : nextStage;
      stepLabel.textContent = String(shownStage.n);
      const idx = stages.indexOf(shownStage);
      stepProg.textContent = `${idx + 1} / ${stages.length}`;
      if (meanAbsEl) meanAbsEl.textContent = shownStage.meanAbs.toFixed(3);
      if (captionEl) captionEl.textContent = commentFor(idx);
    }

    // Indicateur pause / clic + auto-play
    const hint = document.createElement('div');
    hint.style.cssText = 'margin-top:6px;font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';text-align:center;cursor:pointer;user-select:none;';
    hint.innerHTML = '<span data-slot="play-state">▶ auto</span> &nbsp;·&nbsp; cliquez l\'histogramme pour avancer manuellement';
    container.querySelector('div').appendChild(hint);
    const playState = hint.querySelector('[data-slot="play-state"]');

    // Boucle d'animation
    let rafId = null;
    let lastTs = performance.now();
    let elapsed = 0;
    let stepIdx = 0;
    let autoPlay = true;
    const cycleLen = HOLD_MS + MORPH_MS;

    function setPlayState() {
      playState.textContent = autoPlay ? '▶ auto' : '⏸ pause';
    }

    function advanceManual() {
      autoPlay = false;
      elapsed = 0;
      stepIdx = (stepIdx + 1) % stages.length;
      renderBins(stages[stepIdx].bins);
      setLabel(stages[stepIdx], null, 0);
      setPlayState();
    }

    // Click sur l'animation = avance manuel, pause l'auto-play
    const svgEl = container.querySelector('svg');
    if (svgEl) svgEl.style.cursor = 'pointer';
    svgEl.addEventListener('click', advanceManual);
    hint.addEventListener('click', () => {
      autoPlay = !autoPlay;
      if (autoPlay) elapsed = 0;
      setPlayState();
    });

    function loop(ts) {
      const dt = ts - lastTs;
      lastTs = ts;
      if (autoPlay) elapsed += dt;

      const current = stages[stepIdx];
      const next    = stages[(stepIdx + 1) % stages.length];

      let bins;
      if (elapsed < HOLD_MS) {
        bins = current.bins;
        setLabel(current, null, 0);
      } else if (elapsed < cycleLen) {
        const rawT = (elapsed - HOLD_MS) / MORPH_MS;
        const t = easeInOutCubic(rawT);
        bins = current.bins.map((c, i) => c + (next.bins[i] - c) * t);
        setLabel(current, next, rawT);
      } else {
        elapsed -= cycleLen;
        stepIdx = (stepIdx + 1) % stages.length;
        bins = stages[stepIdx].bins;
        setLabel(stages[stepIdx], null, 0);
      }

      renderBins(bins);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    container._residualsCleanup = () => {
      autoPlay = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };
  }

  window.mountResidualsEvolution = mount;
})();
