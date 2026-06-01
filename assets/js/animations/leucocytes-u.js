(() => {
  'use strict';

  // Mini-viz de la relation en U des leucocytes (S1a)
  // Risque de bactériémie en fonction des leucocytes (G/L) :
  //   < 4    → 8 %   (leucopénie)
  //   4 - 8  → 4 %   (normal)
  //   8 - 12 → 6 %
  //   > 12   → 10 %  (hyperleuco)
  // Rendu : 4 barres + courbe lissée superposée.

  const TEAL   = '#0D9488';
  const BRICK  = '#D14545';
  const TEXT   = '#0F172A';
  const MUTED  = '#6B7280';
  const BORDER = '#E5E7EB';

  function mount(container) {
    if (!container) return;
    container.innerHTML = '';

    const W = 420, H = 240;
    const padL = 44, padR = 16, padT = 18, padB = 42;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const bins = [
      { label: '< 4',    risk: 8,  color: BRICK },
      { label: '4-8',    risk: 4,  color: TEAL  },
      { label: '8-12',   risk: 6,  color: TEAL  },
      { label: '> 12',   risk: 10, color: BRICK }
    ];
    const maxRisk = 12;
    const barW = innerW / bins.length;

    // Coordonnées des sommets de barres pour tracer la courbe en U
    const centers = bins.map((b, i) => ({
      x: padL + i * barW + barW / 2,
      y: padT + innerH - (b.risk / maxRisk) * innerH,
      r: b.risk
    }));

    // Spline Catmull-Rom simplifiée → path SVG cubique
    function smoothPath(pts) {
      if (pts.length < 2) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
      }
      return d;
    }

    const yTicks = [0, 4, 8, 12];

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
           style="width:100%;max-width:${W}px;display:block;margin:0 auto;font-family:Inter,system-ui,sans-serif;">
        <!-- Axes -->
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + innerH}"
              stroke="${BORDER}" stroke-width="1"/>
        <line x1="${padL}" y1="${padT + innerH}" x2="${padL + innerW}" y2="${padT + innerH}"
              stroke="${BORDER}" stroke-width="1"/>

        <!-- Grille horizontale + ticks Y -->
        ${yTicks.map(t => {
          const y = padT + innerH - (t / maxRisk) * innerH;
          return `
            <line x1="${padL}" y1="${y}" x2="${padL + innerW}" y2="${y}"
                  stroke="${BORDER}" stroke-width="1" stroke-dasharray="2,3" opacity="0.6"/>
            <text x="${padL - 6}" y="${y + 3}" text-anchor="end"
                  font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">${t}%</text>
          `;
        }).join('')}

        <!-- Barres -->
        ${bins.map((b, i) => {
          const x = padL + i * barW + barW * 0.18;
          const w = barW * 0.64;
          const h = (b.risk / maxRisk) * innerH;
          const y = padT + innerH - h;
          return `
            <rect x="${x}" y="${y}" width="${w}" height="${h}"
                  fill="${b.color}" opacity="0.18" rx="3"/>
            <text x="${x + w / 2}" y="${y - 5}" text-anchor="middle"
                  font-family="JetBrains Mono,monospace" font-size="11" font-weight="500"
                  fill="${b.color}">${b.risk}%</text>
          `;
        }).join('')}

        <!-- Courbe lissée en U -->
        <path d="${smoothPath(centers)}" fill="none" stroke="${TEAL}" stroke-width="2.5"
              stroke-linecap="round"/>

        <!-- Points sur la courbe -->
        ${centers.map(c => `
          <circle cx="${c.x}" cy="${c.y}" r="3.5" fill="#FFFFFF" stroke="${TEAL}" stroke-width="2"/>
        `).join('')}

        <!-- Labels X -->
        ${bins.map((b, i) => {
          const x = padL + i * barW + barW / 2;
          return `<text x="${x}" y="${padT + innerH + 18}" text-anchor="middle"
                        font-family="JetBrains Mono,monospace" font-size="10" fill="${MUTED}">${b.label}</text>`;
        }).join('')}

        <!-- Légendes axes -->
        <text x="${padL + innerW / 2}" y="${H - 6}" text-anchor="middle"
              font-family="Inter,sans-serif" font-size="11" fill="${TEXT}">Leucocytes (G/L)</text>
        <text x="12" y="${padT + innerH / 2}" text-anchor="middle"
              font-family="Inter,sans-serif" font-size="11" fill="${TEXT}"
              transform="rotate(-90 12 ${padT + innerH / 2})">Risque bactériémie</text>
      </svg>
    `;
  }

  window.mountLeucocytesU = mount;
})();
