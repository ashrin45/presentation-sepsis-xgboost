(() => {
  'use strict';

  // Schéma bagging vs boosting (S3a).
  // Extrait/adapté de ml/modules/10-xgboost > Lessons.mountBaggingBoostingSchema.
  // Palette inkdrop verte/rouge remplacée par teal/brick + Inter.

  const TEAL  = '#0D9488';
  const BRICK = '#D14545';
  const TEXT  = '#0F172A';
  const MUTED = '#6B7280';

  function tree(x, y, color) {
    return `
      <g transform="translate(${x}, ${y})">
        <circle cx="0"   cy="0"  r="6" fill="${color}"/>
        <line x1="0"  y1="6"  x2="-12" y2="26" stroke="${color}" stroke-width="1.5"/>
        <line x1="0"  y1="6"  x2="12"  y2="26" stroke="${color}" stroke-width="1.5"/>
        <circle cx="-12" cy="30" r="4" fill="${color}"/>
        <circle cx="12"  cy="30" r="4" fill="${color}"/>
      </g>
    `;
  }

  function mount(container) {
    if (!container) return;
    container.innerHTML = '';

    const W = 720, H = 110;

    // Bagging : 5 arbres parallèles, gauche
    const bagX = [60, 115, 170, 225, 280];
    const baggingTrees = bagX.map(x => tree(x, 30, TEAL)).join('');

    // Boosting : 5 arbres en série avec flèches, droite
    const boostX = [390, 445, 500, 555, 610];
    const boostingTrees = boostX.map((x, i) => {
      const arrow = i < boostX.length - 1
        ? `<line x1="${x + 20}" y1="45" x2="${boostX[i + 1] - 20}" y2="45"
                 stroke="${BRICK}" stroke-width="1.5" marker-end="url(#bvb-arr)"/>`
        : '';
      return tree(x, 30, BRICK) + arrow;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
           style="width:100%;max-width:${W}px;display:block;margin:0 auto;font-family:Inter,system-ui,sans-serif;">

        <defs>
          <marker id="bvb-arr" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="${BRICK}"/>
          </marker>
        </defs>

        <!-- Trait vertical séparateur -->
        <line x1="345" y1="10" x2="345" y2="100"
              stroke="#E5E7EB" stroke-width="1" stroke-dasharray="3,4"/>

        <!-- Arbres -->
        ${baggingTrees}
        ${boostingTrees}

        <!-- Pictogrammes : parallèle vs séquentiel -->
        <text x="170" y="100" text-anchor="middle"
              font-family="Inter,sans-serif" font-size="11" font-style="italic" fill="${TEAL}">
          en parallèle
        </text>
        <text x="500" y="100" text-anchor="middle"
              font-family="Inter,sans-serif" font-size="11" font-style="italic" fill="${BRICK}">
          en série
        </text>
      </svg>
    `;
  }

  window.mountBaggingVsBoosting = mount;
})();
