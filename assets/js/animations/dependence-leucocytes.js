(() => {
  'use strict';

  // Dependence plot SHAP × leucocytes (S5b).
  // Consomme window.deckData.shap_dependence_leucocytes = [{x, y_shap}, ...]
  // X = leucocytes (G/L), Y = valeur SHAP. Forme attendue : U.

  const TEAL   = '#0D9488';
  const BRICK  = '#D14545';
  const TEXT   = '#0F172A';
  const MUTED  = '#6B7280';
  const BORDER = '#E5E7EB';

  function fallback(container, msg) {
    container.innerHTML = `
      <div style="padding:24px;border:1px dashed ${BORDER};border-radius:8px;
                  background:#FAFAFA;color:${MUTED};font-family:Inter,sans-serif;
                  font-size:13px;text-align:center;">
        ${msg}
      </div>
    `;
  }

  function mount(container, data) {
    if (!container) return;
    container.innerHTML = '';

    let src = data;
    if (src && typeof src === 'object' && Array.isArray(src.shap_dependence_leucocytes)) src = src.shap_dependence_leucocytes;
    if (!src && window.deckData && window.deckData.shap_dependence_leucocytes) src = window.deckData.shap_dependence_leucocytes;
    if (!Array.isArray(src) || !src.length) {
      fallback(container, 'window.deckData.shap_dependence_leucocytes non disponible.');
      return;
    }

    const points = src
      .map(p => ({ x: Number(p.x), y: Number(p.y_shap !== undefined ? p.y_shap : p.shap) }))
      .filter(p => isFinite(p.x) && isFinite(p.y));

    if (!points.length) {
      fallback(container, 'données dependence vides ou non numériques.');
      return;
    }

    // Cap visuel à 22 G/L : 95 % des patients sont sous ce seuil,
    // la queue jusqu'à 40 G/L ne contient qu'une centaine d'outliers
    // qui creusent un vide trompeur à droite. On les clippe et on indique le rebond.
    const X_CAP = 22;
    const nClipped = points.filter(p => p.x > X_CAP).length;
    const ys = points.map(p => p.y);
    const xMin = 0;
    const xMax = X_CAP;
    const yAbs = Math.max(...ys.map(Math.abs));
    const yMin = -yAbs, yMax = +yAbs;

    const W = 480, H = 320;
    const padL = 52, padR = 18, padT = 18, padB = 44;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const xAt = x => padL + (x - xMin) / (xMax - xMin || 1) * innerW;
    const yAt = y => padT + innerH - (y - yMin) / (yMax - yMin || 1) * innerH;

    // Ticks
    function tickValues(lo, hi, n) {
      const step = (hi - lo) / n;
      const arr = [];
      for (let i = 0; i <= n; i++) arr.push(lo + i * step);
      return arr;
    }

    const xTicks = tickValues(xMin, xMax, 5);
    const yTicks = tickValues(yMin, yMax, 4);

    // Couleur des points : teal si SHAP < 0, brick si SHAP > 0, dégradé selon |y|
    // Les outliers au-delà du X_CAP sont écrasés sur le bord droit, en plus pâle.
    const dots = points.map(p => {
      const t = Math.min(1, Math.abs(p.y) / (yAbs || 1));
      const color = p.y < 0 ? TEAL : BRICK;
      const clipped = p.x > X_CAP;
      const xUsed = clipped ? X_CAP : p.x;
      const cx = xAt(xUsed).toFixed(1);
      const cy = yAt(p.y).toFixed(1);
      const op = clipped ? 0.25 : (0.35 + 0.45 * t);
      return `<circle cx="${cx}" cy="${cy}" r="2.8" fill="${color}" opacity="${op}"/>`;
    }).join('');

    // Annotation des outliers clippés
    const clipNote = nClipped > 0 ? `
      <line x1="${xAt(X_CAP)}" y1="${padT}" x2="${xAt(X_CAP)}" y2="${padT + innerH}"
            stroke="${MUTED}" stroke-width="1" stroke-dasharray="3,3" opacity="0.4"/>
      <text x="${padL + innerW - 6}" y="${padT + 12}" text-anchor="end"
            font-family="Inter,sans-serif" font-size="9" font-style="italic" fill="${MUTED}">
        + ${nClipped} patients > ${X_CAP} G/L (regroupés)
      </text>
    ` : '';

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
           style="width:100%;max-width:${W}px;display:block;margin:0 auto;
                  font-family:Inter,system-ui,sans-serif;">

        <!-- Axes -->
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + innerH}"
              stroke="${BORDER}" stroke-width="1"/>
        <line x1="${padL}" y1="${padT + innerH}" x2="${padL + innerW}" y2="${padT + innerH}"
              stroke="${BORDER}" stroke-width="1"/>

        <!-- Ligne y = 0 -->
        <line x1="${padL}" y1="${yAt(0)}" x2="${padL + innerW}" y2="${yAt(0)}"
              stroke="${MUTED}" stroke-width="1" stroke-dasharray="2,3" opacity="0.6"/>

        <!-- Ticks Y -->
        ${yTicks.map(t => `
          <text x="${padL - 6}" y="${yAt(t) + 3}" text-anchor="end"
                font-family="JetBrains Mono,monospace" font-size="9" fill="${MUTED}">
            ${t.toFixed(1)}
          </text>
          <line x1="${padL - 3}" y1="${yAt(t)}" x2="${padL}" y2="${yAt(t)}"
                stroke="${BORDER}"/>
        `).join('')}

        <!-- Ticks X -->
        ${xTicks.map(t => `
          <text x="${xAt(t)}" y="${padT + innerH + 14}" text-anchor="middle"
                font-family="JetBrains Mono,monospace" font-size="9" fill="${MUTED}">
            ${t.toFixed(0)}
          </text>
          <line x1="${xAt(t)}" y1="${padT + innerH}" x2="${xAt(t)}" y2="${padT + innerH + 3}"
                stroke="${BORDER}"/>
        `).join('')}

        <!-- Points -->
        ${dots}

        <!-- Marqueur outliers clippés -->
        ${clipNote}

        <!-- Légendes -->
        <text x="${padL + innerW / 2}" y="${H - 8}" text-anchor="middle"
              font-family="Inter,sans-serif" font-size="11" fill="${TEXT}">
          Leucocytes (G/L)
        </text>
        <text x="14" y="${padT + innerH / 2}" text-anchor="middle"
              font-family="Inter,sans-serif" font-size="11" fill="${TEXT}"
              transform="rotate(-90 14 ${padT + innerH / 2})">
          Valeur SHAP
        </text>
      </svg>
    `;
  }

  window.mountDependenceLeucocytes = mount;
})();
