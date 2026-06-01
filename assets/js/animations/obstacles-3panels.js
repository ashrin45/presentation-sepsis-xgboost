(() => {
  'use strict';
  function mount(container) {
    container.innerHTML = `
      <div class="obstacle">
        <div class="obstacle-svg">
          <svg viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg">
            <rect x="10"  y="40" width="180" height="30" fill="#0D9488" rx="4"/>
            <rect x="178" y="40" width="12"  height="30" fill="#D14545" rx="4"/>
            <text x="100" y="92" font-family="JetBrains Mono" font-size="12" text-anchor="middle" fill="#0F172A">93,5 % négatifs</text>
            <text x="184" y="92" font-family="JetBrains Mono" font-size="11" text-anchor="middle" fill="#D14545">6,5 %</text>
          </svg>
        </div>
        <h3>Déséquilibre 6,5 %</h3>
        <p>scale_pos_weight ≈ 13 : pondération native des classes</p>
      </div>
      <div class="obstacle">
        <div class="obstacle-svg">
          <svg viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg">
            <path d="M 10 30 Q 60 95 110 60 Q 160 25 210 90" fill="none" stroke="#0D9488" stroke-width="3"/>
            <line x1="10"  y1="100" x2="210" y2="100" stroke="#6B7280" stroke-width="1"/>
            <text x="20"  y="98" font-family="Inter" font-size="9" fill="#6B7280" dy="10">leucopénie</text>
            <text x="190" y="98" font-family="Inter" font-size="9" fill="#6B7280" dy="10" text-anchor="end">hyperleuco</text>
          </svg>
        </div>
        <h3>Relation en U</h3>
        <p>arbres séquentiels qui captent seuils et interactions</p>
      </div>
      <div class="obstacle">
        <div class="obstacle-svg">
          <svg viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg">
            ${Array.from({length: 6}).map((_, r) => Array.from({length: 11}).map((__, c) => {
              const missing = (r === 1 && c === 3) || (r === 3 && c === 7) || (r === 4 && c === 2) || (r === 0 && c === 9);
              return `<rect x="${10 + c*18}" y="${10 + r*15}" width="14" height="11" fill="${missing ? '#FAFAFA' : '#0D9488'}" stroke="${missing ? '#D14545' : 'transparent'}" stroke-dasharray="${missing ? '2,2' : '0'}"/>`;
            }).join('')).join('')}
          </svg>
        </div>
        <h3>Manquants NFS</h3>
        <p>direction par défaut native (zéro imputation)</p>
      </div>
    `;
  }

  window.mountObstacles3Panels = mount;
})();
