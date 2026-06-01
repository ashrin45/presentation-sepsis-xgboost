(() => {
  'use strict';

  // Waterfall SHAP d'un patient à haut risque (S5c).
  // Consomme window.deckData.shap_waterfall_patient_99pct = {
  //   base_value: 0.06,
  //   final_prob: 0.99,
  //   contributions: [{feature, value, shap}, ...]
  // }
  // Highlight rouge brique sur la barre dont feature === 'mode_Hospitalisé'.

  const TEAL    = '#0D9488';
  const BRICK   = '#D14545';
  const AMBER   = '#F59E0B';
  const TEXT    = '#0F172A';
  const MUTED   = '#6B7280';
  const BORDER  = '#E5E7EB';

  const PROXY_FEATURE = 'mode_Hospitalisé';

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
    if (src && typeof src === 'object' && src.shap_waterfall_patient_99pct) src = src.shap_waterfall_patient_99pct;
    if (!src && window.deckData && window.deckData.shap_waterfall_patient_99pct) src = window.deckData.shap_waterfall_patient_99pct;
    if (!src || !Array.isArray(src.contributions)) {
      fallback(container, 'window.deckData.shap_waterfall_patient_99pct non disponible.');
      return;
    }

    const baseValue = Number(src.base_value);
    const finalProb = Number(src.final_prob);
    if (!isFinite(baseValue) || !isFinite(finalProb)) {
      fallback(container, 'base_value/final_prob manquants.');
      return;
    }

    // Trier par |shap| desc pour une lecture standard SHAP waterfall
    const contribs = src.contributions
      .filter(c => c && isFinite(Number(c.shap)))
      .map(c => ({
        feature: String(c.feature),
        value: c.value,
        shap: Number(c.shap)
      }))
      .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));

    if (!contribs.length) {
      fallback(container, 'aucune contribution.');
      return;
    }

    // Domaine : on travaille en probas, donc [0, 1]. Si valeurs en logits dans
    // la prod réelle, le brief impose la même mécanique (base + somme = final).
    // On prend min/max effectifs avec un peu de marge.
    let cumul = baseValue;
    const steps = contribs.map(c => {
      const start = cumul;
      const end = cumul + c.shap;
      cumul = end;
      return { ...c, start, end };
    });

    const allVals = [baseValue, finalProb].concat(steps.map(s => s.start)).concat(steps.map(s => s.end));
    let lo = Math.min(...allVals);
    let hi = Math.max(...allVals);
    const margin = (hi - lo) * 0.08 || 0.05;
    lo -= margin;
    hi += margin;

    const W = 640;
    const padL = 200, padR = 80, padT = 36, padB = 36;
    const rowH = 26;
    const H = padT + padB + (steps.length + 1) * rowH;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const xAt = v => padL + (v - lo) / (hi - lo || 1) * innerW;

    // Lignes guides verticales : base et final
    const baseX = xAt(baseValue);
    const finalX = xAt(finalProb);

    // Ticks X
    function ticks(lo, hi, n) {
      const t = [];
      for (let i = 0; i <= n; i++) t.push(lo + (hi - lo) * (i / n));
      return t;
    }
    const xTicks = ticks(lo, hi, 4);

    // Construction barres
    const barRows = steps.map((s, i) => {
      const y = padT + i * rowH + rowH * 0.18;
      const h = rowH * 0.64;
      const x1 = xAt(s.start), x2 = xAt(s.end);
      const x = Math.min(x1, x2);
      const w = Math.max(2, Math.abs(x2 - x1));

      const isProxy = s.feature === PROXY_FEATURE;
      const baseColor = isProxy ? BRICK : (s.shap >= 0 ? AMBER : TEAL);
      const stroke = isProxy ? BRICK : 'none';
      const opacity = isProxy ? 0.9 : 0.75;

      const sign = s.shap >= 0 ? '+' : '';
      const valLabel = (s.value === null || s.value === undefined || s.value === '')
        ? ''
        : ` = ${typeof s.value === 'number' ? s.value : String(s.value)}`;

      const featLabel = isProxy
        ? `<tspan font-weight="700" fill="${BRICK}">${s.feature}</tspan>`
        : s.feature;

      return `
        <g>
          <text x="${padL - 8}" y="${y + h * 0.7}" text-anchor="end"
                font-family="Inter,sans-serif" font-size="11" fill="${TEXT}">
            ${featLabel}${valLabel ? `<tspan font-family="JetBrains Mono,monospace" fill="${MUTED}" font-size="10">${valLabel}</tspan>` : ''}
          </text>
          <rect x="${x}" y="${y}" width="${w}" height="${h}"
                fill="${baseColor}" opacity="${opacity}"
                stroke="${stroke}" stroke-width="${isProxy ? 1.5 : 0}" rx="2"/>
          <text x="${x2 + (s.shap >= 0 ? 4 : -4)}" y="${y + h * 0.72}"
                text-anchor="${s.shap >= 0 ? 'start' : 'end'}"
                font-family="JetBrains Mono,monospace" font-size="10"
                fill="${isProxy ? BRICK : TEXT}" font-weight="${isProxy ? 700 : 500}">
            ${sign}${s.shap.toFixed(2)}
          </text>
          ${isProxy ? `<text x="${padL - 8}" y="${y - 2}" text-anchor="end"
                              font-family="Inter,sans-serif" font-size="9" font-style="italic"
                              fill="${BRICK}">proxy social</text>` : ''}
        </g>
      `;
    }).join('');

    // Ligne récap base + final
    const finalY = padT + steps.length * rowH + rowH * 0.5;

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
           style="width:100%;max-width:${W}px;display:block;margin:0 auto;
                  font-family:Inter,system-ui,sans-serif;background:#FFFFFF;">

        <!-- Axes -->
        <line x1="${padL}" y1="${padT}" x2="${padL + innerW}" y2="${padT}"
              stroke="${BORDER}" stroke-width="1"/>
        <line x1="${padL}" y1="${padT + innerH}" x2="${padL + innerW}" y2="${padT + innerH}"
              stroke="${BORDER}" stroke-width="1"/>

        <!-- Ligne base -->
        <line x1="${baseX}" y1="${padT}" x2="${baseX}" y2="${padT + innerH}"
              stroke="${MUTED}" stroke-width="1" stroke-dasharray="4,3"/>
        <text x="${baseX}" y="${padT - 8}" text-anchor="middle"
              font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">
          E[f(x)] = ${baseValue.toFixed(2)}
        </text>

        <!-- Ligne finale -->
        <line x1="${finalX}" y1="${padT}" x2="${finalX}" y2="${padT + innerH}"
              stroke="${TEXT}" stroke-width="1.5"/>
        <text x="${finalX}" y="${padT - 8}" text-anchor="middle"
              font-family="JetBrains Mono,monospace" font-size="10" fill="${TEXT}" font-weight="600">
          f(x) = ${finalProb.toFixed(2)}
        </text>

        <!-- Ticks X -->
        ${xTicks.map(t => `
          <text x="${xAt(t)}" y="${padT + innerH + 16}" text-anchor="middle"
                font-family="JetBrains Mono,monospace" font-size="9" fill="${MUTED}">
            ${t.toFixed(2)}
          </text>
          <line x1="${xAt(t)}" y1="${padT + innerH}" x2="${xAt(t)}" y2="${padT + innerH + 3}"
                stroke="${BORDER}"/>
        `).join('')}

        <!-- Barres -->
        ${barRows}

        <!-- Légende bas -->
        <text x="${padL + innerW / 2}" y="${H - 6}" text-anchor="middle"
              font-family="Inter,sans-serif" font-size="11" fill="${TEXT}">
          Probabilité de bactériémie
        </text>
      </svg>
    `;
  }

  window.mountWaterfallPatient = mount;
})();
