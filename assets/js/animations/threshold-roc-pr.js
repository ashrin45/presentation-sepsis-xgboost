(() => {
  'use strict';

  // Interactive threshold slider: 4 big metrics + confusion matrix + ROC + PR.
  // Reads window.deckData = { roc_xgb, pr_xgb, confusion_at_threshold, metrics.xgb.{at_50,at_40,at_30} }
  // API: window.mountThresholdRocPR(container, data, initialThreshold = 0.5)

  const TEAL    = '#0D9488';
  const BRICK   = '#D14545';
  const MUTED   = '#6B7280';
  const TEXT    = '#0F172A';
  const BORDER  = '#E5E7EB';
  const MONO    = 'JetBrains Mono, ui-monospace, monospace';

  function fallback(container) {
    container.innerHTML = '<p style="color:' + MUTED + ';font-family:Inter,sans-serif;font-size:13px;text-align:center;padding:24px;">Données indisponibles, lancez le pipeline data.</p>';
  }

  function fmtPct(v) {
    if (!isFinite(v)) return '—';
    return (v * 100).toFixed(1) + ' %';
  }

  function fmtThr(v) {
    return v.toFixed(2);
  }

  function findClosestPR(pr, thr) {
    let best = pr[0], bestD = Infinity;
    for (const p of pr) {
      const d = Math.abs(p.threshold - thr);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  function findClosestROC(roc, thr) {
    let best = roc[0], bestD = Infinity;
    for (const r of roc) {
      const d = Math.abs(r.threshold - thr);
      if (d < bestD) { bestD = d; best = r; }
    }
    return best;
  }

  function computeConfusion(thr, data, nPos, nNeg) {
    // Try exact key match first
    const cm = data.confusion_at_threshold || {};
    const key = thr.toFixed(2);
    if (cm[key]) {
      const c = cm[key];
      return { tp: c.tp, fp: c.fp, fn: c.fn, tn: c.tn };
    }
    // Fallback: derive from PR
    const p = findClosestPR(data.pr_xgb, thr);
    const recall = p.recall, precision = p.precision;
    const tp = Math.round(recall * nPos);
    const fp = precision > 0 ? Math.round(tp * (1 - precision) / precision) : 0;
    const fn = nPos - tp;
    const tn = nNeg - fp;
    return { tp: tp, fp: fp, fn: fn, tn: Math.max(0, tn) };
  }

  function computeMetrics(cm) {
    const recall = cm.tp + cm.fn > 0 ? cm.tp / (cm.tp + cm.fn) : 0;
    const precision = cm.tp + cm.fp > 0 ? cm.tp / (cm.tp + cm.fp) : 0;
    const total = cm.tp + cm.fp + cm.fn + cm.tn;
    const accuracy = total > 0 ? (cm.tp + cm.tn) / total : 0;
    return { recall: recall, precision: precision, accuracy: accuracy };
  }

  function plotSVG(curve, xKey, yKey, op, xLabel, yLabel, baselineY, annotation) {
    const W = 160, H = 160, padL = 28, padR = 8, padT = 10, padB = 26;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const x = v => padL + v * innerW;
    const y = v => padT + (1 - v) * innerH;
    const pts = curve.map(p => x(p[xKey]) + ',' + y(p[yKey])).join(' ');
    const diag = xKey === 'fpr'
      ? '<line x1="' + x(0) + '" y1="' + y(0) + '" x2="' + x(1) + '" y2="' + y(1) + '" stroke="' + MUTED + '" stroke-width="1" stroke-dasharray="3,3"/>'
      : '';
    // Baseline horizontale (prévalence pour la PR) : seuil "hasard"
    const baseline = (typeof baselineY === 'number' && baselineY > 0 && baselineY < 1)
      ? '<line x1="' + x(0) + '" y1="' + y(baselineY) + '" x2="' + x(1) + '" y2="' + y(baselineY) + '" stroke="' + MUTED + '" stroke-width="1" stroke-dasharray="3,3"/>' +
        '<text x="' + (x(1) - 2) + '" y="' + (y(baselineY) - 3) + '" text-anchor="end" font-family="' + MONO + '" font-size="7" fill="' + MUTED + '">hasard ' + (baselineY * 100).toFixed(1) + '%</text>'
      : '';
    // Annotation près du point op (ex: "1 / 7" pour la PR)
    // Affichée comme un badge blanc avec contour brique pour rester lisible
    // même quand le point est sur la courbe.
    let annot = '';
    if (annotation) {
      const px = x(op[xKey]);
      const py = y(op[yKey]);
      const right = px < (padL + innerW / 2);
      const tx = right ? px + 12 : px - 12;
      const ty = py - 4;
      const anchor = right ? 'start' : 'end';
      const padX = 4, padY = 2;
      const charW = 6.2;
      const txtW = annotation.length * charW;
      const rectX = anchor === 'start' ? tx - padX : tx - txtW - padX;
      const rectY = ty - 10;
      const rectW = txtW + padX * 2;
      const rectH = 14;
      annot =
        '<rect x="' + rectX.toFixed(1) + '" y="' + rectY.toFixed(1) +
        '" width="' + rectW.toFixed(1) + '" height="' + rectH +
        '" fill="#FFFFFF" stroke="' + BRICK + '" stroke-width="1" rx="3"/>' +
        '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) +
        '" text-anchor="' + anchor + '" font-family="' + MONO +
        '" font-size="10" font-weight="700" fill="' + BRICK + '">' +
        annotation + '</text>';
    }
    const ticks = [0, 0.5, 1];
    const xTicks = ticks.map(t =>
      '<text x="' + x(t) + '" y="' + (padT + innerH + 12) + '" text-anchor="middle" font-family="' + MONO + '" font-size="8" fill="' + MUTED + '">' + t.toFixed(1) + '</text>'
    ).join('');
    const yTicks = ticks.map(t =>
      '<text x="' + (padL - 4) + '" y="' + (y(t) + 3) + '" text-anchor="end" font-family="' + MONO + '" font-size="8" fill="' + MUTED + '">' + t.toFixed(1) + '</text>'
    ).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">' +
      '<rect x="' + padL + '" y="' + padT + '" width="' + innerW + '" height="' + innerH + '" fill="none" stroke="' + BORDER + '" stroke-width="1"/>' +
      diag +
      baseline +
      '<polyline points="' + pts + '" fill="none" stroke="' + TEAL + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="' + x(op[xKey]) + '" cy="' + y(op[yKey]) + '" r="5" fill="' + BRICK + '" stroke="#fff" stroke-width="1.5"/>' +
      annot +
      xTicks + yTicks +
      '<text x="' + (padL + innerW / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="' + TEXT + '">' + xLabel + '</text>' +
      '<text x="10" y="' + (padT + innerH / 2) + '" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="' + TEXT + '" transform="rotate(-90 10 ' + (padT + innerH / 2) + ')">' + yLabel + '</text>' +
      '</svg>';
  }

  function confusionHTML(cm) {
    const cell = (val, color, bold) =>
      '<td style="padding:10px 14px;border:1px solid ' + BORDER + ';font-family:' + MONO + ';font-size:18px;text-align:center;color:' + color + ';font-weight:' + (bold ? 700 : 500) + ';min-width:60px;">' + val + '</td>';
    const th = txt =>
      '<th style="padding:6px 10px;border:1px solid ' + BORDER + ';font-family:Inter,sans-serif;font-size:11px;font-weight:500;color:' + MUTED + ';background:#FAFAFA;">' + txt + '</th>';
    return '<table style="border-collapse:collapse;margin:0 auto;">' +
      '<tr>' + th('') + th('Préd. négatif') + th('Préd. positif') + '</tr>' +
      '<tr>' + th('Vrai négatif') + cell(cm.tn, TEAL, false) + cell(cm.fp, BRICK, false) + '</tr>' +
      '<tr>' + th('Vrai positif') + cell(cm.fn, BRICK, true) + cell(cm.tp, TEAL, false) + '</tr>' +
      '</table>';
  }

  function mount(container, data, initialThreshold) {
    if (!container) return;
    container.innerHTML = '';
    const src = data || window.deckData;
    if (!src || !Array.isArray(src.roc_xgb) || !Array.isArray(src.pr_xgb) || !src.roc_xgb.length || !src.pr_xgb.length) {
      fallback(container);
      return;
    }
    const thr0 = isFinite(initialThreshold) ? initialThreshold : 0.5;

    // Estimate n_pos / n_neg from any known confusion entry, default 200/2800
    let nPos = 200, nNeg = 2800;
    const cmDict = src.confusion_at_threshold || {};
    const keys = Object.keys(cmDict);
    if (keys.length) {
      const first = cmDict[keys[0]];
      if (first && isFinite(first.tp) && isFinite(first.fn) && isFinite(first.fp) && isFinite(first.tn)) {
        nPos = first.tp + first.fn;
        nNeg = first.fp + first.tn;
      }
    }

    container.innerHTML =
      '<div class="threshold-roc-pr">' +
        '<div class="trp-row trp-numbers">' +
          '<div class="trp-metric"><div class="trp-label" style="font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.5px;">Seuil</div><div class="trp-value" data-k="thr" style="font-family:' + MONO + ';font-size:28px;color:' + TEXT + ';font-weight:600;">—</div></div>' +
          '<div class="trp-metric"><div class="trp-label" style="font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.5px;">Recall</div><div class="trp-value" data-k="rec" style="font-family:' + MONO + ';font-size:28px;color:' + TEAL + ';font-weight:600;">—</div></div>' +
          '<div class="trp-metric"><div class="trp-label" style="font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.5px;">Precision</div><div class="trp-value" data-k="pre" style="font-family:' + MONO + ';font-size:28px;color:' + TEXT + ';font-weight:600;">—</div><div class="trp-sub" data-k="pre-sub" style="font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';margin-top:2px;">—</div></div>' +
          '<div class="trp-metric"><div class="trp-label" style="font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:0.5px;">Accuracy</div><div class="trp-value" data-k="acc" style="font-family:' + MONO + ';font-size:28px;color:' + MUTED + ';font-weight:600;">—</div></div>' +
        '</div>' +
        '<div class="trp-slider" style="margin:16px 0;">' +
          '<input type="range" min="0.05" max="0.95" step="0.01" value="' + thr0 + '" style="width:100%;accent-color:' + TEAL + ';"/>' +
        '</div>' +
        '<div class="trp-row trp-plots" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;align-items:start;">' +
          '<div class="trp-plot trp-confusion"><div class="trp-plot-title" style="font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';text-align:center;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Matrice de confusion</div><div data-slot="cm"></div></div>' +
          '<div class="trp-plot trp-roc"><div class="trp-plot-title" style="font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';text-align:center;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Courbe ROC</div><div data-slot="roc"></div></div>' +
          '<div class="trp-plot trp-pr"><div class="trp-plot-title" style="font-family:Inter,sans-serif;font-size:11px;color:' + MUTED + ';text-align:center;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Courbe Précision-Rappel</div><div data-slot="pr"></div></div>' +
        '</div>' +
      '</div>';

    const slider = container.querySelector('input[type=range]');
    const valThr = container.querySelector('[data-k="thr"]');
    const valRec = container.querySelector('[data-k="rec"]');
    const valPre = container.querySelector('[data-k="pre"]');
    const valPreSub = container.querySelector('[data-k="pre-sub"]');
    const valAcc = container.querySelector('[data-k="acc"]');
    const slotCM = container.querySelector('[data-slot="cm"]');
    const slotROC = container.querySelector('[data-slot="roc"]');
    const slotPR = container.querySelector('[data-slot="pr"]');

    const prevalence = nPos / (nPos + nNeg);

    function render(thr) {
      const cm = computeConfusion(thr, src, nPos, nNeg);
      const m = computeMetrics(cm);
      valThr.textContent = fmtThr(thr);
      valRec.textContent = fmtPct(m.recall);
      valPre.textContent = fmtPct(m.precision);
      if (valPreSub) {
        if (m.precision > 0) {
          const n = Math.round(1 / m.precision);
          valPreSub.textContent = '≈ 1 vrai sepsis pour ' + n + ' alertes';
        } else {
          valPreSub.textContent = '—';
        }
      }
      valAcc.textContent = fmtPct(m.accuracy);
      slotCM.innerHTML = confusionHTML(cm);
      const opROC = findClosestROC(src.roc_xgb, thr);
      const opPR = findClosestPR(src.pr_xgb, thr);
      slotROC.innerHTML = plotSVG(src.roc_xgb, 'fpr', 'tpr', opROC, '1 - spécificité', 'sensibilité');
      const prAnnot = m.precision > 0 ? '1 / ' + Math.round(1 / m.precision) : '';
      slotPR.innerHTML = plotSVG(src.pr_xgb, 'recall', 'precision', opPR, 'Recall', 'Precision', prevalence, prAnnot);
    }

    slider.addEventListener('input', (e) => {
      render(parseFloat(e.target.value));
    });

    render(thr0);
  }

  window.mountThresholdRocPR = mount;
})();
