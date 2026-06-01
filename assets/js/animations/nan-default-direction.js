(() => {
  'use strict';
  function mount(c) {
    c.innerHTML = `
      <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:560px;display:block;margin:0 auto;">
        <rect x="240" y="20" width="120" height="50" rx="8" fill="#FFFFFF" stroke="#0D9488" stroke-width="2"/>
        <text x="300" y="44" text-anchor="middle" font-family="Inter" font-weight="600" font-size="14" fill="#0F172A">NLR &gt; 5 ?</text>

        <line x1="280" y1="70" x2="150" y2="160" stroke="#9CA3AF" stroke-width="2"/>
        <line x1="320" y1="70" x2="450" y2="160" stroke="#9CA3AF" stroke-width="2"/>

        <text x="200" y="115" font-family="Inter" font-size="11" fill="#6B7280">NLR ≤ 5</text>
        <text x="400" y="115" font-family="Inter" font-size="11" fill="#6B7280">NLR &gt; 5</text>

        <rect x="380" y="100" width="100" height="22" rx="11" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5"/>
        <text x="430" y="115" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#92400E">NaN par défaut</text>

        <rect x="80"  y="160" width="140" height="40" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
        <text x="150" y="184" text-anchor="middle" font-family="Inter" font-size="12" fill="#1F2937">sous-arbre A</text>

        <rect x="380" y="160" width="140" height="40" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
        <text x="450" y="184" text-anchor="middle" font-family="Inter" font-size="12" fill="#1F2937">sous-arbre B</text>

        <text x="300" y="270" text-anchor="middle" font-family="Inter" font-size="13" fill="#1F2937">
          À l'entraînement, XGBoost a appris que pour ce nœud,
        </text>
        <text x="300" y="290" text-anchor="middle" font-family="Inter" font-size="13" fill="#1F2937">
          NaN ressemble plus au profil « NLR élevé ».
        </text>
      </svg>
    `;
  }
  window.mountNanDefaultDirection = mount;
})();
