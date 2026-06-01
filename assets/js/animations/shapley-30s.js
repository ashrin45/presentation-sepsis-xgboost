(() => {
  'use strict';

  // Vignette Shapley en 30 s (S5a).
  // Analogie jeu coopératif : 3 joueurs A, B, C arrivent dans 6 ordres possibles.
  // Cycle visuel : on déroule chaque ordre, on cumule la contribution marginale
  // au gain, puis on affiche la moyenne = valeur de Shapley.
  // Animation 600 ms max par transition.

  const TEAL  = '#0D9488';
  const BRICK = '#D14545';
  const AMBER = '#F59E0B';
  const TEXT  = '#0F172A';
  const MUTED = '#6B7280';
  const BORDER = '#E5E7EB';

  const PLAYERS = ['A', 'B', 'C'];
  const COLORS  = [TEAL, AMBER, BRICK];

  // Les 6 permutations canoniques
  const ORDERS = [
    [0, 1, 2], [0, 2, 1],
    [1, 0, 2], [1, 2, 0],
    [2, 0, 1], [2, 1, 0]
  ];

  // Apport marginal fictif par joueur dans chaque ordre (illustratif, plausible).
  // moyenne par joueur → "valeurs Shapley" qu'on affiche en bas.
  // Calcul cohérent : on suppose un modèle simple où contributions individuelles
  // valent A=0.40, B=0.25, C=0.10 (somme=0.75, prédiction finale fictive).
  const MARGINAL = {
    A: 0.40,
    B: 0.25,
    C: 0.10
  };

  function mount(container) {
    if (!container) return;
    container.innerHTML = '';

    const root = document.createElement('div');
    root.style.fontFamily = 'Inter, system-ui, sans-serif';
    root.style.color = TEXT;
    root.style.maxWidth = '480px';
    root.style.margin = '0 auto';
    container.appendChild(root);

    root.innerHTML = `
      <div style="text-align:center;font-size:12px;color:${MUTED};margin-bottom:8px;">
        3 joueurs, 6 ordres d'arrivée
      </div>
      <div id="shap30-order" style="display:flex;justify-content:center;gap:10px;
           font-family:JetBrains Mono,monospace;font-size:14px;margin-bottom:14px;
           min-height:32px;align-items:center;"></div>
      <div id="shap30-stage" style="display:flex;justify-content:center;gap:10px;
           min-height:64px;margin-bottom:14px;"></div>
      <div style="border-top:1px dashed ${BORDER};padding-top:10px;">
        <div style="text-align:center;font-size:11px;color:${MUTED};margin-bottom:6px;">
          Moyenne des apports marginaux = valeur de Shapley
        </div>
        <div id="shap30-results" style="display:flex;justify-content:center;gap:14px;
             font-family:JetBrains Mono,monospace;font-size:13px;"></div>
      </div>
    `;

    const orderEl   = root.querySelector('#shap30-order');
    const stageEl   = root.querySelector('#shap30-stage');
    const resultsEl = root.querySelector('#shap30-results');

    function playerBox(idx, opacity = 1) {
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;
                    transition:opacity 300ms ease;opacity:${opacity};">
          <div style="width:42px;height:42px;border-radius:8px;
                      background:${COLORS[idx]}22;border:2px solid ${COLORS[idx]};
                      display:flex;align-items:center;justify-content:center;
                      font-weight:700;color:${COLORS[idx]};font-size:18px;">
            ${PLAYERS[idx]}
          </div>
          <div style="font-family:JetBrains Mono,monospace;font-size:10px;color:${MUTED};">
            +${MARGINAL[PLAYERS[idx]].toFixed(2)}
          </div>
        </div>
      `;
    }

    function arrow() {
      return `<div style="display:flex;align-items:center;font-size:18px;color:${MUTED};">→</div>`;
    }

    function renderResults() {
      resultsEl.innerHTML = PLAYERS.map((p, i) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="width:32px;height:32px;border-radius:6px;
                      background:${COLORS[i]}22;border:1.5px solid ${COLORS[i]};
                      display:flex;align-items:center;justify-content:center;
                      font-weight:700;color:${COLORS[i]};font-size:14px;">
            ${p}
          </div>
          <div style="color:${COLORS[i]};font-weight:600;">φ = ${MARGINAL[p].toFixed(2)}</div>
        </div>
      `).join('');
    }

    let step = 0;
    let timer = null;

    function tick() {
      const order = ORDERS[step % ORDERS.length];
      orderEl.innerHTML = order.map((i, k) =>
        `<span style="color:${COLORS[i]};font-weight:${k === 0 ? 700 : 500};">${PLAYERS[i]}</span>${k < 2 ? `<span style="color:${MUTED};margin:0 4px;">→</span>` : ''}`
      ).join('');

      const parts = [];
      for (let k = 0; k < order.length; k++) {
        parts.push(playerBox(order[k], 1));
        if (k < order.length - 1) parts.push(arrow());
      }
      stageEl.innerHTML = parts.join('');

      step++;
    }

    renderResults();
    tick();
    timer = setInterval(tick, 1100);

    // Cleanup si on remount sur le même container
    if (container._shap30Cleanup) container._shap30Cleanup();
    container._shap30Cleanup = () => clearInterval(timer);
  }

  window.mountShapley30s = mount;
})();
