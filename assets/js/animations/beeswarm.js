(() => {
  'use strict';

  // Beeswarm SHAP (S5b).
  // Consomme window.deckData.shap_beeswarm = { features: [...], data: [...] }
  //   - features : noms ordonnés (top 7 à 10 par mean |SHAP|)
  //   - data : tableau de patients, chaque patient = { feature_values: {name: v}, shap_values: {name: v} }
  // Variante tolérée : data = { feature_name: [{shap, value}, ...] } (clés par feature)
  // Couleurs : gradient teal (bas) → brick (haut) sur la valeur du biomarqueur.

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

  // Interpolation lin entre teal et brick selon t ∈ [0, 1]
  function gradColor(t) {
    const c1 = [13, 148, 136];   // teal
    const c2 = [209, 69, 69];    // brick
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    return `rgb(${r},${g},${b})`;
  }

  // Normalise les données vers { features: [...], rows: [{shap: [...], val: [...]}] }
  function normalize(src) {
    if (!src) return null;
    const features = Array.isArray(src.features) ? src.features.slice() : null;
    if (!features) return null;

    let rows = [];
    if (Array.isArray(src.data)) {
      // Format 3 (production export) : flat array of {feature, shap, value}, F entries per patient
      const first = src.data[0];
      if (first && typeof first.feature === 'string' && typeof first.shap === 'number') {
        const F = features.length;
        if (F > 0 && src.data.length % F === 0) {
          const nPatients = src.data.length / F;
          for (let p = 0; p < nPatients; p++) {
            const shap = new Array(F).fill(NaN);
            const val  = new Array(F).fill(NaN);
            for (let j = 0; j < F; j++) {
              const e = src.data[p * F + j];
              if (!e) continue;
              const idx = features.indexOf(e.feature);
              if (idx >= 0) {
                shap[idx] = Number(e.shap);
                val[idx]  = (e.value !== null && e.value !== undefined) ? Number(e.value) : NaN;
              }
            }
            rows.push({ shap, val });
          }
          return { features, rows };
        }
      }
      // Format 1 : data = [{ shap_values, feature_values }]
      for (const pt of src.data) {
        const sv = pt.shap_values || pt.shap || {};
        const fv = pt.feature_values || pt.values || {};
        const shap = features.map(f => Number(sv[f]));
        const val  = features.map(f => Number(fv[f]));
        rows.push({ shap, val });
      }
    } else if (src.data && typeof src.data === 'object') {
      // Format 2 : data = { feature: [{shap, value}, ...] }
      const n = (src.data[features[0]] || []).length;
      for (let i = 0; i < n; i++) {
        const shap = features.map(f => Number((src.data[f] || [])[i]?.shap));
        const val  = features.map(f => Number((src.data[f] || [])[i]?.value));
        rows.push({ shap, val });
      }
    } else {
      return null;
    }
    return { features, rows };
  }

  function mount(container, data) {
    if (!container) return;
    container.innerHTML = '';

    let src = data;
    if (src && typeof src === 'object' && src.shap_beeswarm) src = src.shap_beeswarm;
    if (!src && window.deckData && window.deckData.shap_beeswarm) src = window.deckData.shap_beeswarm;
    const norm = normalize(src);
    if (!norm || !norm.rows.length) {
      fallback(container, 'window.deckData.shap_beeswarm non disponible.');
      return;
    }

    // Top 10 features par mean |SHAP|
    const meanAbs = norm.features.map((_, i) => {
      let s = 0, c = 0;
      for (const r of norm.rows) {
        const v = r.shap[i];
        if (typeof v === 'number' && isFinite(v)) { s += Math.abs(v); c++; }
      }
      return c > 0 ? s / c : 0;
    });
    const order = meanAbs.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).slice(0, 10);
    const topIdx = order.map(o => o.i);

    // Range SHAP symétrique
    let sMax = 0;
    for (const r of norm.rows) for (const i of topIdx) {
      const v = r.shap[i];
      if (typeof v === 'number' && isFinite(v)) sMax = Math.max(sMax, Math.abs(v));
    }
    if (sMax === 0) sMax = 1;

    // Range valeur par feature (pour la couleur)
    const valMin = {}, valMax = {};
    for (const i of topIdx) {
      let lo = Infinity, hi = -Infinity;
      for (const r of norm.rows) {
        const v = r.val[i];
        if (typeof v === 'number' && isFinite(v)) {
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }
      valMin[i] = isFinite(lo) ? lo : 0;
      valMax[i] = isFinite(hi) ? hi : 1;
    }

    const W = 720;
    const padL = 130, padR = 30, padT = 24, padB = 36;
    const rowH = 30;
    const H = padT + padB + topIdx.length * rowH + 20;
    const innerW = W - padL - padR;

    function xAt(s) { return padL + (s + sMax) / (2 * sMax) * innerW; }

    let svg = `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
           style="width:100%;max-width:${W}px;display:block;margin:0 auto;
                  font-family:Inter,system-ui,sans-serif;">
        <!-- Ligne SHAP = 0 -->
        <line x1="${xAt(0)}" y1="${padT}" x2="${xAt(0)}"
              y2="${padT + topIdx.length * rowH}"
              stroke="${MUTED}" stroke-width="1" opacity="0.5"/>
    `;

    // Lignes guides + labels feature
    topIdx.forEach((featIdx, r) => {
      const yC = padT + r * rowH + rowH / 2;
      svg += `
        <line x1="${padL}" y1="${yC}" x2="${padL + innerW}" y2="${yC}"
              stroke="${BORDER}" stroke-width="1" opacity="0.4"/>
        <text x="${padL - 8}" y="${yC + 4}" text-anchor="end"
              font-family="Inter,sans-serif" font-size="11" fill="${TEXT}">
          ${norm.features[featIdx]}
        </text>
      `;
    });

    // Points (jittered)
    topIdx.forEach((featIdx, r) => {
      const yC = padT + r * rowH + rowH / 2;
      const lo = valMin[featIdx], hi = valMax[featIdx];
      const span = hi - lo || 1;
      norm.rows.forEach((row, p) => {
        const sv = row.shap[featIdx];
        const vv = row.val[featIdx];
        if (typeof sv !== 'number' || !isFinite(sv)) return;
        const x = xAt(sv);
        const jitter = (Math.sin(p * 13.37 + r) * 0.5) * (rowH - 8);
        const y = yC + jitter;
        const t = typeof vv === 'number' && isFinite(vv) ? (vv - lo) / span : 0.5;
        svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"
                        fill="${gradColor(t)}" opacity="0.7"/>`;
      });
    });

    // Axe X et labels
    const yAxis = padT + topIdx.length * rowH + 4;
    svg += `
      <line x1="${padL}" y1="${yAxis}" x2="${padL + innerW}" y2="${yAxis}"
            stroke="${BORDER}" stroke-width="1"/>
      <text x="${xAt(0)}" y="${yAxis + 16}" text-anchor="middle"
            font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">0</text>
      <text x="${padL}" y="${yAxis + 16}" text-anchor="start"
            font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">${(-sMax).toFixed(2)}</text>
      <text x="${padL + innerW}" y="${yAxis + 16}" text-anchor="end"
            font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">${(+sMax).toFixed(2)}</text>
      <text x="${padL + innerW / 2}" y="${H - 6}" text-anchor="middle"
            font-family="Inter,sans-serif" font-size="11" fill="${TEXT}">valeur SHAP (impact sur la prédiction)</text>
    `;

    // Légende gradient couleur
    const lgX = padL + innerW - 110, lgY = 10, lgW = 100, lgH = 8;
    svg += `
      <defs>
        <linearGradient id="bs-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="${TEAL}"/>
          <stop offset="100%" stop-color="${BRICK}"/>
        </linearGradient>
      </defs>
      <rect x="${lgX}" y="${lgY}" width="${lgW}" height="${lgH}" fill="url(#bs-grad)" rx="2"/>
      <text x="${lgX}" y="${lgY - 2}" font-family="Inter,sans-serif" font-size="9" fill="${MUTED}">valeur :</text>
      <text x="${lgX}" y="${lgY + lgH + 10}" font-family="JetBrains Mono,monospace" font-size="9" fill="${MUTED}">bas</text>
      <text x="${lgX + lgW}" y="${lgY + lgH + 10}" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="9" fill="${MUTED}">haut</text>
    `;

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  window.mountBeeswarm = mount;
})();
