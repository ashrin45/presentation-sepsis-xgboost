# Plan d'implémentation, présentation Sepsis XGBoost

> **Pour agents :** SOUS-SKILL REQUIS, utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent `- [ ]` pour le suivi.

**Goal:** Construire un slide-deck HTML navigable de 16 slides qui applique la théorie XGBoost et l'analyse SHAP à une cohorte sepsis simulée, en réutilisant les animations existantes du cours ML et en créant celles qui manquent.

**Architecture:** Slide-deck vanilla HTML / CSS / JS, une seule page `index.html` avec navigation clavier. Pipeline Python amont qui génère les données simulées, entraîne 4 modèles, exporte un `deck.json` statique. Le deck charge le JSON au démarrage. Animations extraites des modules existants (HTML + JS d'init inliné, jamais en iframe) ou créées en SVG / Canvas pour les nouvelles.

**Tech Stack:** HTML5, CSS3, JavaScript ES6+ vanilla, SVG, Google Fonts (Inter, JetBrains Mono). Python 3.11+, `numpy`, `pandas`, `scikit-learn`, `xgboost`, `shap`.

**Référence :** voir `storyboard.md` pour le contenu détaillé de chaque slide.

---

## Phase A — Fondations (la coquille tourne, sans contenu)

### Task A1 : Structure de projet et fichiers vides

**Files:**
- Create: `index.html` (shell minimal)
- Create: `assets/css/deck.css` (vide)
- Create: `assets/js/deck-navigation.js` (vide)
- Create: `assets/js/data-loader.js` (vide)
- Create: `assets/js/animations/.gitkeep`
- Create: `assets/data/.gitkeep`
- Create: `data-pipeline/.gitkeep`

Aucun test ici, c'est de la mise en place. Aller direct à A2.

- [ ] **Step 1:** Créer la structure de dossiers et fichiers vides via une seule commande Bash.

```bash
cd "C:/Users/33698/Documents/1_CNAM/presentation_sepsis_xgboost" && \
mkdir -p assets/css assets/js/animations assets/data data-pipeline && \
touch index.html assets/css/deck.css assets/js/deck-navigation.js assets/js/data-loader.js \
      assets/js/animations/.gitkeep assets/data/.gitkeep data-pipeline/.gitkeep
```

- [ ] **Step 2:** Vérifier la structure.

```bash
find . -type f | sort
```
Attendu :
```
./assets/css/deck.css
./assets/data/.gitkeep
./assets/js/animations/.gitkeep
./assets/js/data-loader.js
./assets/js/deck-navigation.js
./data-pipeline/.gitkeep
./implementation_plan.md
./index.html
./storyboard.md
```

---

### Task A2 : `index.html` shell avec une slide vide

**Files:**
- Modify: `index.html`

Coquille HTML5 qui charge les fonts, le CSS, et 2 JS. Une seule `<section class="slide active">` placeholder pour vérifier le rendu.

- [ ] **Step 1:** Écrire le contenu de `index.html`.

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Détecter un sepsis avec une NFS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/deck.css">
</head>
<body>
  <main class="deck">
    <section class="slide active" data-slide="0">
      <h1 style="font-size:2rem">Slide 0, placeholder</h1>
      <p>Si vous voyez ce texte centré sur fond gris clair, la coquille tourne.</p>
    </section>
  </main>

  <nav class="deck-nav" aria-label="Navigation du deck">
    <button id="prev" aria-label="Slide précédente">←</button>
    <span id="counter">01 / 01</span>
    <button id="next" aria-label="Slide suivante">→</button>
  </nav>

  <script src="assets/js/data-loader.js" defer></script>
  <script src="assets/js/deck-navigation.js" defer></script>
</body>
</html>
```

- [ ] **Step 2:** Ouvrir `index.html` dans le navigateur, vérifier que la slide placeholder est visible.

---

### Task A3 : CSS `deck.css` (tokens Direction B + layout slide)

**Files:**
- Modify: `assets/css/deck.css`

Implémenter la palette Direction B verrouillée dans la spec (blanc clinique + accent teal), tailles slide 16:9, layout slide centré, classes de base réutilisables.

- [ ] **Step 1:** Écrire le CSS de base.

```css
:root {
  --bg:         #FAFAFA;
  --surface:    #FFFFFF;
  --text:       #0F172A;
  --text-soft:  #1F2937;
  --muted:      #6B7280;
  --border:     #E5E7EB;
  --teal:       #0D9488;
  --teal-soft:  rgba(13, 148, 136, 0.08);
  --brick:      #D14545;
  --brick-soft: rgba(209, 69, 69, 0.07);
  --amber:      #F59E0B;
  --slide-w:    1280px;
  --slide-h:    720px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 400;
  min-height: 100vh;
  overflow: hidden;
}

.deck {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
}

.slide {
  width: var(--slide-w);
  height: var(--slide-h);
  background: var(--bg);
  padding: 64px 72px;
  display: none;
  flex-direction: column;
  position: relative;
  max-width: 95vw;
  max-height: 90vh;
  transform-origin: center;
}

.slide.active { display: flex; }

.slide h1 {
  font-weight: 800;
  font-size: 50px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--text);
}
.slide h2 {
  font-weight: 700;
  font-size: 28px;
  color: var(--text);
  margin-top: 0;
}
.slide .subtitle {
  font-weight: 500;
  font-size: 18px;
  color: var(--muted);
  margin-top: 8px;
}
.slide .phrase-cle-haut {
  font-weight: 400;
  font-size: 22px;
  color: var(--text-soft);
  margin-top: 28px;
  padding-left: 26px;
  border-left: 4px solid var(--teal);
  line-height: 1.4;
}
.slide .phrase-cle-bas {
  position: absolute;
  bottom: 88px;
  left: 72px;
  right: 72px;
  font-weight: 500;
  font-size: 17px;
  color: var(--text-soft);
  padding: 14px 20px;
  background: var(--teal-soft);
  border-left: 4px solid var(--teal);
}

.warn-card {
  background: var(--brick-soft);
  border-left: 4px solid var(--brick);
  padding: 14px 18px;
  font-size: 15px;
  color: var(--text-soft);
}

.callout-teal {
  background: var(--teal-soft);
  border-left: 4px solid var(--teal);
  padding: 14px 18px;
  font-size: 15px;
  color: var(--text-soft);
}

table.metrics {
  border-collapse: collapse;
  width: 100%;
  margin-top: 20px;
  font-size: 14px;
}
table.metrics th, table.metrics td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}
table.metrics th {
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
table.metrics td.num {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}
table.metrics td.highlight {
  color: var(--teal);
  font-weight: 600;
}

.deck-nav {
  position: fixed;
  bottom: 16px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--muted);
  background: var(--surface);
  padding: 8px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.06);
}
.deck-nav button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--text);
  padding: 0 8px;
}
.deck-nav button:hover { color: var(--teal); }
.deck-nav button:disabled { opacity: 0.3; cursor: default; }
```

- [ ] **Step 2:** Recharger `index.html` dans le navigateur. La slide placeholder doit être centrée sur fond `#FAFAFA`, la navigation visible en bas à droite.

- [ ] **Step 3:** Vérification responsive simple (DevTools, redimensionner la fenêtre). La slide ne doit jamais dépasser la fenêtre.

---

### Task A4 : Navigation clavier et boutons

**Files:**
- Modify: `assets/js/deck-navigation.js`

Navigation simple. Sélectionne `.slide`, indices, raccourcis clavier.

- [ ] **Step 1:** Écrire `deck-navigation.js`.

```javascript
(() => {
  'use strict';

  const slides = Array.from(document.querySelectorAll('.slide'));
  let current = 0;

  const counter = document.getElementById('counter');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');

  function pad(n) { return String(n).padStart(2, '0'); }

  function update() {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    counter.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slides.length - 1;
    document.dispatchEvent(new CustomEvent('slidechange', { detail: { index: current, slide: slides[current] } }));
  }

  function go(delta) {
    const next = Math.min(slides.length - 1, Math.max(0, current + delta));
    if (next !== current) {
      current = next;
      update();
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault(); go(+1); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); go(-1); break;
      case 'Home':
        e.preventDefault(); current = 0; update(); break;
      case 'End':
        e.preventDefault(); current = slides.length - 1; update(); break;
      case 'f':
      case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
        break;
    }
  });

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(+1));

  update();
})();
```

- [ ] **Step 2:** Recharger la page, vérifier les raccourcis :
  - flèches gauche / droite : navigue
  - espace : avance
  - Home / End : début / fin
  - F : plein écran (à toggler avec ESC)
  - boutons UI : équivalents
  - Le counter `01 / 01` s'affiche correctement.

---

### Task A5 : Data loader avec stub

**Files:**
- Modify: `assets/js/data-loader.js`
- Create: `assets/data/deck.json` (stub minimal pour permettre le test)

Le loader expose `window.deckData` dès que `deck.json` est chargé. Les animations consommeront cette donnée.

- [ ] **Step 1:** Écrire un stub minimal pour `assets/data/deck.json`.

```json
{
  "_stub": true,
  "metrics": {},
  "roc_xgb": [],
  "pr_xgb": [],
  "shap_waterfall_patient_99pct": { "base_value": 0.06, "contributions": [], "final_prob": 0.99 }
}
```

- [ ] **Step 2:** Écrire `data-loader.js`.

```javascript
(async () => {
  'use strict';

  window.deckData = null;
  window.deckDataReady = new Promise((resolve, reject) => {
    fetch('assets/data/deck.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        window.deckData = data;
        document.dispatchEvent(new CustomEvent('deckdataready', { detail: data }));
        resolve(data);
      })
      .catch(err => {
        console.error('[data-loader] échec du chargement de deck.json :', err);
        reject(err);
      });
  });
})();
```

- [ ] **Step 3:** Recharger la page, ouvrir la console. Attendu : pas d'erreur. Vérifier `window.deckData._stub === true` dans la console.

  Note : pour que `fetch` fonctionne sur un fichier local, certains navigateurs (Chrome) bloquent. Si c'est le cas, lancer un serveur statique :

```bash
cd "C:/Users/33698/Documents/1_CNAM/presentation_sepsis_xgboost" && python -m http.server 8080
```

puis ouvrir `http://localhost:8080`.

---

## Phase B — Pipeline data Python

### Task B1 : `requirements.txt` et README pipeline

**Files:**
- Create: `data-pipeline/requirements.txt`
- Create: `data-pipeline/README.md`
- Modify (supprimer le `.gitkeep` si présent dans `data-pipeline/`).

- [ ] **Step 1:** Écrire `data-pipeline/requirements.txt`.

```
numpy>=1.26
pandas>=2.1
scikit-learn>=1.4
xgboost>=2.0
shap>=0.45
```

- [ ] **Step 2:** Écrire `data-pipeline/README.md`.

```markdown
# Pipeline data, présentation Sepsis XGBoost

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # ou .venv/Scripts/activate sous Windows
pip install -r requirements.txt
```

## Exécution

```bash
python generate_data.py     # produit sepsis_cohort.csv
python train_models.py      # produit models.pkl
python export_for_deck.py   # produit ../assets/data/deck.json
```

Le `deck.json` est consommé statiquement par le deck HTML (au démarrage).

## Reproductibilité

`generate_data.py` utilise `numpy.random.default_rng(seed=2026)`. Toute exécution donne le même dataset.
```

- [ ] **Step 3:** Créer le venv et installer les deps.

```bash
cd data-pipeline
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
```

Vérification : `pip list` doit montrer numpy, pandas, scikit-learn, xgboost, shap.

---

### Task B2 : `generate_data.py` (cohorte simulée)

**Files:**
- Create: `data-pipeline/generate_data.py`
- Output: `data-pipeline/sepsis_cohort.csv`

Génère 2 500 patients avec :
- 11 variables NFS biologiquement plausibles (lois normales et log-normales)
- 1 variable contexte `mode_prise_en_charge`
- Cible binaire avec prévalence 6,5 % stratifiée par mode de prise en charge
- Relation en U des leucocytes calibrée
- Manquants réalistes sur RDW (~10 %), VPM (~5 %), éosinophiles (~2 %)

- [ ] **Step 1:** Écrire `generate_data.py`.

```python
"""
Génération d'une cohorte simulée de 2 500 patients hospitalisés avec suspicion de
bactériémie. Variables NFS biologiquement plausibles, prévalence 6,5 %, U sur les
leucocytes, manquants réalistes, et un proxy social (mode_prise_en_charge).

Usage:
    python generate_data.py
Sortie:
    sepsis_cohort.csv (2 500 lignes, 13 colonnes)
"""

import numpy as np
import pandas as pd

SEED = 2026
N = 2500
PREVALENCE_GLOBALE_CIBLE = 0.065

# Prévalence stratifiée par mode de prise en charge (S2.7 du storyboard)
PREVALENCE_PAR_MODE = {
    'Hospitalisé':    0.085,
    'Domicile':       0.035,
    'Soins de suite': 0.055,
}
PROPORTIONS_MODES = {
    'Hospitalisé':    0.55,
    'Domicile':       0.25,
    'Soins de suite': 0.20,
}


def risque_leucocytes(leuco_GL):
    """Risque relatif en U : leucopénie et hyperleucocytose élèvent le risque."""
    if leuco_GL < 4:   return 1.6
    if leuco_GL < 8:   return 0.7
    if leuco_GL < 12:  return 1.0
    return 1.8


def generer(n=N, seed=SEED):
    rng = np.random.default_rng(seed)

    # Mode de prise en charge
    modes_l = list(PROPORTIONS_MODES.keys())
    modes_p = list(PROPORTIONS_MODES.values())
    mode = rng.choice(modes_l, size=n, p=modes_p)

    # Variables NFS (log-normales et normales tronquées)
    leuco = np.clip(rng.lognormal(mean=np.log(8.0), sigma=0.5, size=n), 1.0, 40.0)
    pnn   = np.clip(leuco * rng.uniform(0.45, 0.80, size=n), 0.3, 30.0)
    lympho = np.clip(leuco * rng.uniform(0.10, 0.35, size=n), 0.05, 6.0)
    nlr = pnn / np.clip(lympho, 0.05, None)

    granul_immatures_pct = np.clip(rng.gamma(shape=0.5, scale=1.5, size=n), 0, 25)
    granul_immatures_presents = (granul_immatures_pct > 1.0).astype(int)

    plaq = np.clip(rng.normal(loc=250, scale=80, size=n), 20, 700)
    eos  = np.clip(rng.exponential(scale=0.15, size=n), 0, 1.5)
    mono = np.clip(rng.normal(loc=0.6, scale=0.2, size=n), 0.1, 2.0)
    hb   = np.clip(rng.normal(loc=13.0, scale=1.8, size=n), 6, 19)
    vpm  = np.clip(rng.normal(loc=10.5, scale=1.2, size=n), 7, 14)
    rdw  = np.clip(rng.normal(loc=13.5, scale=1.4, size=n), 10, 22)

    # Calcul du risque
    risque = np.ones(n)

    # Effet variable mode (calibration vise les PREVALENCE_PAR_MODE)
    for m, prev_voulue in PREVALENCE_PAR_MODE.items():
        risque[mode == m] *= prev_voulue / PREVALENCE_GLOBALE_CIBLE

    # Effet U sur leucocytes
    risque *= np.array([risque_leucocytes(l) for l in leuco])

    # Autres signaux biologiques (NLR élevé, lymphopénie, éosinopénie, myélémie)
    risque *= 1 + 0.6 * (nlr > 8)            # NLR élevé
    risque *= 1 + 0.5 * (lympho < 0.5)       # lymphopénie
    risque *= 1 + 0.4 * (eos < 0.02)         # éosinopénie
    risque *= 1 + 0.7 * granul_immatures_presents   # myélémie

    # Normalisation pour viser la prévalence globale 0,065
    risque /= risque.mean() / PREVALENCE_GLOBALE_CIBLE
    risque = np.clip(risque, 0.001, 0.99)

    # Tirage de la cible
    y = (rng.uniform(0, 1, size=n) < risque).astype(int)

    # Manquants réalistes
    rdw_mask = rng.uniform(0, 1, size=n) < 0.10
    vpm_mask = rng.uniform(0, 1, size=n) < 0.05
    eos_mask = rng.uniform(0, 1, size=n) < 0.02
    rdw[rdw_mask] = np.nan
    vpm[vpm_mask] = np.nan
    eos[eos_mask] = np.nan

    df = pd.DataFrame({
        'leucocytes':     leuco,
        'PNN':            pnn,
        'lymphocytes':    lympho,
        'NLR':            nlr,
        'granul_immatures_pct': granul_immatures_pct,
        'granul_immatures_present': granul_immatures_presents,
        'plaquettes':     plaq,
        'eosinophiles':   eos,
        'monocytes':      mono,
        'hemoglobine':    hb,
        'VPM':            vpm,
        'RDW':            rdw,
        'mode_prise_en_charge': mode,
        'hemoculture_positive': y,
    })

    return df


if __name__ == '__main__':
    df = generer()
    df.to_csv('sepsis_cohort.csv', index=False)

    print(f"Dataset généré : {len(df)} lignes, {df.shape[1]} colonnes")
    print(f"Prévalence globale : {df['hemoculture_positive'].mean():.3f}")
    print("Prévalence par mode :")
    print(df.groupby('mode_prise_en_charge')['hemoculture_positive'].agg(['mean', 'count']))
    print("\nManquants :")
    print(df.isna().sum()[df.isna().sum() > 0])
```

- [ ] **Step 2:** Lancer le script.

```bash
cd data-pipeline && python generate_data.py
```

Attendu : prévalence globale entre 0,055 et 0,075 ; prévalence Hospitalisé > Soins de suite > Domicile ; manquants visibles sur RDW (~250), VPM (~125), éosinophiles (~50).

- [ ] **Step 3:** Si la prévalence dévie franchement de 0,065, ajuster la calibration (la normalisation `risque /= risque.mean() / PREVALENCE_GLOBALE_CIBLE` doit la centrer ; si non, augmenter / réduire les facteurs multiplicatifs des effets).

---

### Task B3 : `train_models.py` (4 modèles)

**Files:**
- Create: `data-pipeline/train_models.py`
- Output: `data-pipeline/models.pkl`

- [ ] **Step 1:** Écrire le script.

```python
"""
Entraîne 4 modèles sur sepsis_cohort.csv :
  1) RL équilibrée 50/50 (par sous-échantillonnage des négatifs)
  2) RL sur prévalence réelle
  3) Random Forest sur prévalence réelle
  4) XGBoost sur prévalence réelle, avec scale_pos_weight et early stopping

Sortie : models.pkl (dict contenant les modèles + X_test/y_test + autres)
"""

import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

SEED = 2026


def prepare_features(df, fit_scaler_on=None):
    """Retourne X (numpy array), y, feature_names, et le scaler ajusté."""
    feat_num = ['leucocytes', 'PNN', 'lymphocytes', 'NLR', 'granul_immatures_pct',
                'plaquettes', 'eosinophiles', 'monocytes', 'hemoglobine', 'VPM', 'RDW']
    feat_bin = ['granul_immatures_present']
    feat_cat = ['mode_prise_en_charge']

    # One-hot du mode (3 modalités)
    df_oh = pd.get_dummies(df, columns=feat_cat, prefix='mode')

    feature_names = feat_num + feat_bin + [c for c in df_oh.columns if c.startswith('mode_')]
    X = df_oh[feature_names].copy()
    y = df['hemoculture_positive'].values

    return X, y, feature_names


def train_rl(X_train, y_train, balanced=False):
    """Régression logistique. Si balanced, sous-échantillonne les négatifs."""
    if balanced:
        pos_idx = np.where(y_train == 1)[0]
        neg_idx = np.where(y_train == 0)[0]
        rng = np.random.default_rng(SEED)
        neg_sample = rng.choice(neg_idx, size=len(pos_idx), replace=False)
        idx = np.concatenate([pos_idx, neg_sample])
        rng.shuffle(idx)
        X_tr, y_tr = X_train.iloc[idx], y_train[idx]
    else:
        X_tr, y_tr = X_train, y_train

    # Imputation simple pour la RL (médiane)
    X_tr_filled = X_tr.fillna(X_tr.median(numeric_only=True))
    scaler = StandardScaler()
    X_tr_scaled = scaler.fit_transform(X_tr_filled)

    mdl = LogisticRegression(max_iter=1000, random_state=SEED)
    mdl.fit(X_tr_scaled, y_tr)
    return mdl, scaler


def train_rf(X_train, y_train):
    """Random Forest. Imputation médiane."""
    X_tr_filled = X_train.fillna(X_train.median(numeric_only=True))
    mdl = RandomForestClassifier(
        n_estimators=300, max_depth=10, min_samples_leaf=5,
        random_state=SEED, n_jobs=-1
    )
    mdl.fit(X_tr_filled, y_train)
    return mdl


def train_xgb(X_train, y_train, X_val, y_val):
    """XGBoost avec manquants natifs et scale_pos_weight."""
    spw = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    print(f"scale_pos_weight = {spw:.2f}")
    mdl = xgb.XGBClassifier(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        reg_alpha=0,
        reg_lambda=1,
        scale_pos_weight=spw,
        objective='binary:logistic',
        eval_metric='aucpr',
        random_state=SEED,
        n_jobs=-1,
        early_stopping_rounds=30,
    )
    mdl.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    return mdl, spw


def main():
    df = pd.read_csv('sepsis_cohort.csv')
    X, y, feature_names = prepare_features(df)

    # Split global 70/15/15 (train / val / test)
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30,
                                                        stratify=y, random_state=SEED)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50,
                                                    stratify=y_temp, random_state=SEED)

    rl_bal,  scal_bal  = train_rl(X_train, y_train, balanced=True)
    rl_real, scal_real = train_rl(X_train, y_train, balanced=False)
    rf_real            = train_rf(X_train, y_train)
    xgb_real, spw      = train_xgb(X_train, y_train, X_val, y_val)

    bundle = {
        'feature_names': feature_names,
        'X_train': X_train, 'y_train': y_train,
        'X_val':   X_val,   'y_val':   y_val,
        'X_test':  X_test,  'y_test':  y_test,
        'rl_bal':  rl_bal,  'scaler_bal':  scal_bal,
        'rl_real': rl_real, 'scaler_real': scal_real,
        'rf_real': rf_real,
        'xgb_real': xgb_real, 'scale_pos_weight': spw,
    }
    with open('models.pkl', 'wb') as f:
        pickle.dump(bundle, f)

    print(f"4 modèles entraînés et sauvegardés dans models.pkl")


if __name__ == '__main__':
    main()
```

- [ ] **Step 2:** Lancer le script.

```bash
python train_models.py
```

Attendu : message `scale_pos_weight = ~14`, pas d'erreur. `models.pkl` existe et fait quelques MB.

---

### Task B4 : `export_for_deck.py` (production du `deck.json`)

**Files:**
- Create: `data-pipeline/export_for_deck.py`
- Output: `../assets/data/deck.json` (écrase le stub)

- [ ] **Step 1:** Écrire le script.

```python
"""
Calcule les métriques, courbes ROC et PR, valeurs SHAP, et exporte un JSON
consommé par le deck HTML.
"""

import json
import pickle
import numpy as np
import pandas as pd
import shap
from sklearn.metrics import (accuracy_score, recall_score, precision_score,
                              roc_auc_score, average_precision_score,
                              roc_curve, precision_recall_curve, confusion_matrix)

OUTPUT = '../assets/data/deck.json'


def metrics_at_threshold(y_true, proba, threshold):
    pred = (proba >= threshold).astype(int)
    return {
        'threshold': float(threshold),
        'accuracy':  float(accuracy_score(y_true, pred)),
        'recall':    float(recall_score(y_true, pred, zero_division=0)),
        'precision': float(precision_score(y_true, pred, zero_division=0)),
    }


def metrics_summary(y_true, proba):
    auc_roc = float(roc_auc_score(y_true, proba))
    auc_pr  = float(average_precision_score(y_true, proba))
    return {
        'auc_roc': auc_roc,
        'auc_pr':  auc_pr,
        **{f'at_{int(100*t):02d}': metrics_at_threshold(y_true, proba, t) for t in [0.50, 0.40, 0.30]}
    }


def predict_rl(model, scaler, X):
    X_filled = X.fillna(X.median(numeric_only=True))
    X_scaled = scaler.transform(X_filled)
    return model.predict_proba(X_scaled)[:, 1]


def predict_rf(model, X):
    X_filled = X.fillna(X.median(numeric_only=True))
    return model.predict_proba(X_filled)[:, 1]


def predict_xgb(model, X):
    return model.predict_proba(X)[:, 1]


def main():
    with open('models.pkl', 'rb') as f:
        b = pickle.load(f)

    X_test, y_test = b['X_test'], b['y_test']

    # Prédictions
    p_rl_bal  = predict_rl(b['rl_bal'],  b['scaler_bal'],  X_test)
    p_rl_real = predict_rl(b['rl_real'], b['scaler_real'], X_test)
    p_rf      = predict_rf(b['rf_real'], X_test)
    p_xgb     = predict_xgb(b['xgb_real'], X_test)

    # Métriques
    out = { 'metrics': {
        'rl_equilibre': metrics_summary(y_test, p_rl_bal),
        'rl_reel':      metrics_summary(y_test, p_rl_real),
        'rf':           metrics_summary(y_test, p_rf),
        'xgb':          metrics_summary(y_test, p_xgb),
    }}

    # Courbes ROC et PR pour XGBoost (pour le curseur de seuil de S2b/S4b)
    fpr, tpr, thr_roc = roc_curve(y_test, p_xgb)
    prec, rec, thr_pr = precision_recall_curve(y_test, p_xgb)

    out['roc_xgb'] = [
        {'threshold': float(t), 'fpr': float(f), 'tpr': float(tp)}
        for t, f, tp in zip(thr_roc, fpr, tpr)
    ]
    out['pr_xgb'] = [
        {'threshold': float(t), 'precision': float(p), 'recall': float(r)}
        for t, p, r in zip(np.concatenate([thr_pr, [1.0]]), prec, rec)
    ]

    # Matrice de confusion à 3 seuils
    out['confusion_at_threshold'] = {}
    for t in [0.50, 0.40, 0.30]:
        pred = (p_xgb >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
        out['confusion_at_threshold'][f'{t:.2f}'] = {
            'tn': int(tn), 'fp': int(fp), 'fn': int(fn), 'tp': int(tp)
        }

    # SHAP sur XGBoost (TreeExplainer, rapide)
    print("Calcul SHAP...")
    explainer = shap.TreeExplainer(b['xgb_real'])
    shap_values = explainer.shap_values(X_test)
    base_value = float(explainer.expected_value if np.ndim(explainer.expected_value) == 0
                       else explainer.expected_value[0])

    feature_names = b['feature_names']

    # Beeswarm résumé : pour chaque feature, mean(|shap|)
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    order = np.argsort(-mean_abs_shap)
    out['shap_global'] = [
        {'feature': feature_names[i], 'mean_abs_shap': float(mean_abs_shap[i])}
        for i in order[:12]
    ]

    # Beeswarm complet (échantillonné à 500 points pour ne pas exploser le JSON)
    rng = np.random.default_rng(2026)
    sample_idx = rng.choice(len(X_test), size=min(500, len(X_test)), replace=False)
    out['shap_beeswarm'] = {
        'features': feature_names,
        'data': [
            {'feature': feature_names[j],
             'shap': float(shap_values[i, j]),
             'value': float(X_test.iloc[i, j]) if not pd.isna(X_test.iloc[i, j]) else None}
            for i in sample_idx for j in range(len(feature_names))
        ]
    }

    # Dependence leucocytes
    leuco_idx = feature_names.index('leucocytes')
    out['shap_dependence_leucocytes'] = [
        {'x': float(X_test.iloc[i, leuco_idx]),
         'y_shap': float(shap_values[i, leuco_idx])}
        for i in range(len(X_test))
    ]

    # Waterfall, on cherche un patient avec proba >= 0,98 et qui a un nan visible
    high_risk = np.where(p_xgb >= 0.98)[0]
    chosen = None
    for i in high_risk:
        row = X_test.iloc[i]
        if pd.isna(row.get('RDW', 0)):
            chosen = i; break
    if chosen is None and len(high_risk) > 0:
        chosen = int(high_risk[0])

    if chosen is not None:
        row = X_test.iloc[chosen]
        contribs = sorted(
            [(feature_names[j], float(row.iloc[j]) if not pd.isna(row.iloc[j]) else None,
              float(shap_values[chosen, j]))
             for j in range(len(feature_names))],
            key=lambda x: -abs(x[2])
        )
        out['shap_waterfall_patient_99pct'] = {
            'base_value': base_value,
            'final_prob': float(p_xgb[chosen]),
            'contributions': [
                {'feature': c[0], 'value': c[1], 'shap': c[2]}
                for c in contribs[:10]
            ],
        }

    # Résidus à plusieurs itérations (pour S3b)
    # On reconstruit le booster, on prédit à n iterations différentes
    import xgboost as xgb_mod
    booster = b['xgb_real'].get_booster()
    dmat = xgb_mod.DMatrix(X_test, missing=np.nan)
    out['residuals_at_iteration'] = {}
    for n_iter in [1, 10, 100]:
        if n_iter > booster.num_boosted_rounds(): continue
        raw = booster.predict(dmat, iteration_range=(0, n_iter), output_margin=True)
        proba_step = 1 / (1 + np.exp(-raw))
        residus = y_test - proba_step
        # Échantillon de 200 points
        idx = rng.choice(len(residus), size=min(200, len(residus)), replace=False)
        out['residuals_at_iteration'][str(n_iter)] = [float(residus[i]) for i in idx]

    out['scale_pos_weight'] = float(b['scale_pos_weight'])
    out['feature_names'] = feature_names

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2, ensure_ascii=False, allow_nan=False)

    print(f"Exporté : {OUTPUT}")
    print(f"Taille JSON : {len(json.dumps(out))} caractères")


if __name__ == '__main__':
    main()
```

- [ ] **Step 2:** Lancer le script.

```bash
python export_for_deck.py
```

Attendu : pas d'erreur, message `Exporté : ../assets/data/deck.json`.

- [ ] **Step 3:** Vérifier le JSON dans le navigateur. Recharger `index.html` (avec serveur statique), ouvrir la console, taper `window.deckData.metrics.xgb.auc_roc` : doit renvoyer une valeur entre 0,85 et 0,95.

---

### Task B5 : Validation des chiffres cibles

Les valeurs annoncées dans le storyboard (recall 0,55 XGB, 0,43 RL/RF, AUC-ROC ~0,90, etc.) doivent être à peu près atteintes. Si elles divergent franchement, ajuster la simulation.

- [ ] **Step 1:** Lire les métriques produites.

```bash
python -c "import json; m = json.load(open('../assets/data/deck.json'))['metrics']; \
import pprint; pprint.pprint({k: {'auc_pr': v['auc_pr'], 'auc_roc': v['auc_roc'], \
'recall@0.5': v['at_50']['recall'], 'recall@0.3': v['at_30']['recall']} for k, v in m.items()})"
```

- [ ] **Step 2:** Vérifier les ordres de grandeur. Cibles approximatives :
  - `rl_reel.recall@0.5` proche de 0,43
  - `rf.recall@0.5` proche de 0,43
  - `xgb.recall@0.5` proche de 0,55
  - `xgb.recall@0.3` proche de 0,65
  - Tous les `auc_pr` entre 0,40 et 0,70

- [ ] **Step 3:** Si une cible diverge de plus de 0,05, ajuster `generate_data.py` (calibration des signaux) puis re-runner B2 → B3 → B4.

---

## Phase C — Slides statiques (sans dépendance data)

### Task C1 : S0 Ouverture

**Files:**
- Modify: `index.html` (ajouter `<section class="slide" data-slide="S0">`, remplacer la slide placeholder).

- [ ] **Step 1:** Remplacer la slide placeholder de `index.html` par une slide S0 conforme au mockup Direction B (voir `mockup_styles_S0.html`).

```html
<section class="slide" data-slide="S0">
  <h1>Détecter un sepsis avec une numération formule sanguine.</h1>
  <div class="subtitle">Cas clinique appliqué à XGBoost et SHAP.</div>
  <div class="phrase-cle-haut">
    Une NFS ordinaire, 11 paramètres, quelques euros : peut-elle anticiper qu'une hémoculture reviendra positive ?
  </div>
  <div class="meta-row">
    <div class="meta-item">
      <div class="meta-label">Données</div>
      <div class="meta-value">Simulées, ~2 500 épisodes</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Cohorte</div>
      <div class="meta-value">6,5 % d'hémocultures positives chez les patients hospitalisés avec suspicion de bactériémie</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Variables</div>
      <div class="meta-value">11 NFS et mode de prise en charge</div>
    </div>
  </div>
  <div class="callout-teal" style="margin-top:auto; margin-bottom:80px;">
    <em>« Ne pas faire d'IA à tout prix. »</em> Le vrai sujet : savoir critiquer XGBoost, pas démontrer qu'il marche.
  </div>
  <div class="roadmap">
    <span class="active">WHY</span><span class="sep">/</span>
    <span>WHEN</span><span class="sep">/</span>
    <span>HOW théorie</span><span class="sep">/</span>
    <span>HOW cas</span><span class="sep">/</span>
    <span>HOW interpréter et critiquer</span>
  </div>
</section>
```

- [ ] **Step 2:** Ajouter les styles spécifiques dans `deck.css`.

```css
.meta-row {
  display: flex;
  gap: 60px;
  margin-top: 36px;
}
.meta-item { display: flex; flex-direction: column; gap: 6px; max-width: 280px; }
.meta-label {
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--teal);
}
.meta-value { font-size: 15px; color: var(--text-soft); }

.roadmap {
  position: absolute;
  bottom: 38px;
  left: 72px;
  right: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.05em;
}
.roadmap .sep { color: var(--border); }
.roadmap span.active { color: var(--teal); }
```

- [ ] **Step 3:** Recharger la page. Vérifier que S0 s'affiche conformément au mockup, sans débordement.

---

### Task C2 : S1b 3 panneaux SVG des obstacles

**Files:**
- Create: `assets/js/animations/obstacles-3panels.js`
- Modify: `index.html` (ajouter slide S1b)
- Modify: `assets/css/deck.css` (styles 3-panels)

- [ ] **Step 1:** Écrire le composant SVG dans `obstacles-3panels.js`.

```javascript
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
```

- [ ] **Step 2:** Ajouter la slide S1b dans `index.html` (après S1a, ou directement après S0 si S1a pas encore prêt).

```html
<section class="slide" data-slide="S1b">
  <h1>Trois obstacles cliniques, trois besoins méthodologiques.</h1>
  <div class="phrase-cle-haut">Le sepsis-NFS pose trois problèmes différents. XGBoost en règle un par levier paramétrique.</div>
  <div class="obstacles-3panels" id="obstacles-3panels"></div>
  <div class="phrase-cle-bas">
    RL : aucun des trois levé. RF : un et demi. XGBoost : les trois. C'est ce qui justifie de « sortir le bazooka » ici, pas ailleurs.
  </div>
  <script>
    document.addEventListener('slidechange', e => {
      if (e.detail.slide.dataset.slide === 'S1b') {
        window.mountObstacles3Panels(document.getElementById('obstacles-3panels'));
      }
    });
  </script>
</section>
```

- [ ] **Step 3:** Charger le script dans `index.html` (avant `deck-navigation.js`).

```html
<script src="assets/js/animations/obstacles-3panels.js" defer></script>
```

- [ ] **Step 4:** Ajouter les styles dans `deck.css`.

```css
.obstacles-3panels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-top: 40px;
}
.obstacle {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.obstacle-svg svg { width: 100%; height: auto; max-height: 110px; }
.obstacle h3 { font-size: 16px; font-weight: 700; color: var(--text); text-align: center; }
.obstacle p  { font-size: 13px; color: var(--text-soft); text-align: center; }
```

- [ ] **Step 5:** Recharger, naviguer jusqu'à S1b, vérifier les 3 panneaux SVG.

---

### Task C3 : S2a Tableau OUI / NON

**Files:**
- Modify: `index.html`
- Modify: `assets/css/deck.css` (styles `table.compare`)

- [ ] **Step 1:** Ajouter la slide.

```html
<section class="slide" data-slide="S2a">
  <h1>Quand sortir XGBoost, quand s'abstenir.</h1>
  <div class="phrase-cle-haut">XGBoost n'est pas une réponse par défaut. C'est une réponse à un profil de problème précis.</div>
  <table class="compare">
    <thead>
      <tr><th>XGBoost est adapté quand...</th><th>XGBoost n'est PAS le bon choix quand...</th></tr>
    </thead>
    <tbody>
      <tr><td>Données tabulaires (lignes × colonnes)</td><td>Images, texte, audio (deep learning)</td></tr>
      <tr><td>Relations non linéaires, interactions entre variables</td><td>Relations linéaires propres (RL suffit)</td></tr>
      <tr><td>Données manquantes structurelles</td><td>Dataset très propre et complet</td></tr>
      <tr><td>Classes déséquilibrées</td><td>Besoin d'interprétabilité forte et simple</td></tr>
      <tr><td>Taille moyenne (10³ à 10⁶ observations)</td><td>Très petits jeux (&lt; 300 obs)</td></tr>
      <tr><td>Pas d'a priori sur la forme des relations</td><td>Visée d'inférence causale, pas prédictive</td></tr>
    </tbody>
  </table>
  <div class="phrase-cle-bas">
    Le sepsis-NFS coche les 5 premières conditions. Et c'est ce qui m'interdit de prétendre que XGBoost est partout la bonne réponse.
  </div>
</section>
```

- [ ] **Step 2:** Styles dans `deck.css`.

```css
table.compare {
  border-collapse: collapse;
  width: 100%;
  margin-top: 36px;
  font-size: 15px;
}
table.compare th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
table.compare th:first-child { color: var(--teal); }
table.compare th:last-child  { color: var(--brick); }
table.compare td {
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  color: var(--text-soft);
  width: 50%;
}
```

- [ ] **Step 3:** Recharger, naviguer à S2a, vérifier.

---

### Task C4 : S3d schéma SVG « NaN par défaut »

**Files:**
- Create: `assets/js/animations/nan-default-direction.js`
- Modify: `index.html`
- Modify: `assets/css/deck.css`

- [ ] **Step 1:** Écrire le composant SVG.

```javascript
(() => {
  'use strict';
  function mount(c) {
    c.innerHTML = `
      <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:560px;display:block;margin:0 auto;">
        <!-- nœud racine -->
        <rect x="240" y="20" width="120" height="50" rx="8" fill="#FFFFFF" stroke="#0D9488" stroke-width="2"/>
        <text x="300" y="44" text-anchor="middle" font-family="Inter" font-weight="600" font-size="14" fill="#0F172A">NLR &gt; 5 ?</text>

        <!-- branches -->
        <line x1="280" y1="70" x2="150" y2="160" stroke="#9CA3AF" stroke-width="2"/>
        <line x1="320" y1="70" x2="450" y2="160" stroke="#9CA3AF" stroke-width="2"/>

        <text x="200" y="115" font-family="Inter" font-size="11" fill="#6B7280">NLR ≤ 5</text>
        <text x="400" y="115" font-family="Inter" font-size="11" fill="#6B7280">NLR &gt; 5</text>

        <!-- bulle NaN -->
        <rect x="380" y="100" width="100" height="22" rx="11" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5"/>
        <text x="430" y="115" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#92400E">NaN par défaut</text>

        <!-- sous-arbres -->
        <rect x="80"  y="160" width="140" height="40" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
        <text x="150" y="184" text-anchor="middle" font-family="Inter" font-size="12" fill="#1F2937">sous-arbre A</text>

        <rect x="380" y="160" width="140" height="40" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
        <text x="450" y="184" text-anchor="middle" font-family="Inter" font-size="12" fill="#1F2937">sous-arbre B</text>

        <!-- légende -->
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
```

- [ ] **Step 2:** Ajouter S3d dans `index.html`.

```html
<section class="slide" data-slide="S3d">
  <h1>Les valeurs manquantes, XGBoost apprend où les envoyer.</h1>
  <div class="phrase-cle-haut">
    Pas de moyenne, pas de médiane, pas de kNN. À chaque nœud, le modèle apprend une direction par défaut pour les NaN.
  </div>
  <div id="nan-default-direction" style="margin-top:24px;"></div>
  <div class="phrase-cle-bas">
    Pour la NFS, où VPM ou RDW manquent selon l'analyseur, c'est un avantage net. Pas d'imputation, donc pas de biais d'imputation.
  </div>
  <script>
    document.addEventListener('slidechange', e => {
      if (e.detail.slide.dataset.slide === 'S3d') window.mountNanDefaultDirection(document.getElementById('nan-default-direction'));
    });
  </script>
</section>
```

Et charger le script (`<script src="assets/js/animations/nan-default-direction.js" defer></script>`).

- [ ] **Step 3:** Recharger, naviguer à S3d, vérifier.

---

### Task C5 : SC Conclusion

**Files:**
- Modify: `index.html`
- Modify: `assets/css/deck.css`

- [ ] **Step 1:** Ajouter la slide.

```html
<section class="slide" data-slide="SC">
  <h1>Performance OU équité ? Le dernier mot revient au clinicien.</h1>
  <div class="phrase-cle-haut" style="font-size:26px;">
    Un modèle plus performant qui s'appuie sur une variable potentiellement biaisante est-il acceptable ?
  </div>
  <table class="recap" style="margin-top:32px;">
    <thead>
      <tr><th>Piège</th><th>Réponse de l'exposé</th></tr>
    </thead>
    <tbody>
      <tr><td>Déséquilibre 6,5 %</td><td>Stratégie consciente : scale_pos_weight et ajustement du seuil</td></tr>
      <tr><td>Variable sociale</td><td>Révélée par SHAP, à interroger systématiquement</td></tr>
      <tr><td>Choix de la métrique</td><td>Décision <strong>clinique</strong>, on pilote au recall et à l'AUC-PR</td></tr>
      <tr><td>Ce que SHAP fait</td><td>Explique, <strong>ne corrige ni n'équilibre</strong></td></tr>
      <tr><td>Performance vs équité</td><td>Arbitrage clinique, pas technique</td></tr>
    </tbody>
  </table>
  <div class="callout-teal" style="margin-top:24px; font-size:18px;">
    <em>« Ne pas faire d'IA à tout prix. »</em> Le notebook XGBoost n'est qu'un prétexte. Le vrai sujet est le discernement critique.
  </div>
</section>
```

- [ ] **Step 2:** Styles `table.recap` (similaire à `compare`).

```css
table.recap { border-collapse: collapse; width: 100%; font-size: 14px; }
table.recap th, table.recap td { padding: 10px 16px; border-bottom: 1px solid var(--border); text-align: left; }
table.recap th:first-child { color: var(--brick); width: 30%; }
table.recap th:last-child  { color: var(--teal); }
table.recap td:first-child { font-weight: 600; }
```

- [ ] **Step 3:** Recharger, vérifier SC.

---

## Phase D — Animations extraites des modules existants

Stratégie générale : on identifie le ou les `<div id="...">` cibles dans `1_Deeplearning/ml/modules/<module>/index.html`, on récupère la fonction d'init dans `script.js`, on adapte les couleurs au thème Direction B, on inline dans un fichier `assets/js/animations/<nom>.js` du deck.

### Task D1 : Extraire « courbe en U leucocytes » pour S1a

**Files:**
- Read: `C:/Users/33698/Documents/1_Deeplearning/ml/modules/09-random-forest/index.html` et `script.js` pour identifier la viz en U
- Create: `assets/js/animations/leucocytes-u.js`
- Modify: `index.html` (ajouter S1a)
- Modify: `assets/css/deck.css`

- [ ] **Step 1:** Repérer dans le module 09 RF la viz qui montre la relation en U. Si elle existe : lire son code (HTML + init JS). Si elle n'existe pas en tant que telle, en créer une simple SVG (4 points sur les classes <4, 4-8, 8-12, >12 avec hauteurs 8 %, 4 %, 6 %, 10 %).

- [ ] **Step 2:** Écrire `leucocytes-u.js`.

```javascript
(() => {
  'use strict';
  function mount(c) {
    const points = [
      { x: 2,  risk: 0.08, label: '< 4' },
      { x: 6,  risk: 0.04, label: '4 à 8' },
      { x: 10, risk: 0.06, label: '8 à 12' },
      { x: 14, risk: 0.10, label: '> 12' },
    ];
    const W = 320, H = 180, pad = 30;
    const xScale = v => pad + (v / 16) * (W - 2*pad);
    const yScale = v => H - pad - (v / 0.12) * (H - 2*pad);
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x).toFixed(1)} ${yScale(p.risk).toFixed(1)}`).join(' ');
    c.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%; max-width:320px; display:block; margin:0 auto;">
        <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" stroke="#9CA3AF" stroke-width="1"/>
        <line x1="${pad}" y1="${pad}"   x2="${pad}"   y2="${H-pad}" stroke="#9CA3AF" stroke-width="1"/>
        <path d="${pathD}" fill="none" stroke="#0D9488" stroke-width="2.5"/>
        ${points.map(p => `<circle cx="${xScale(p.x)}" cy="${yScale(p.risk)}" r="4" fill="#0D9488"/>`).join('')}
        ${points.map(p => `<text x="${xScale(p.x)}" y="${H - 8}" text-anchor="middle" font-family="Inter" font-size="10" fill="#6B7280">${p.label}</text>`).join('')}
        ${points.map(p => `<text x="${xScale(p.x)}" y="${yScale(p.risk) - 8}" text-anchor="middle" font-family="JetBrains Mono" font-size="10" fill="#0F172A">${Math.round(p.risk*100)} %</text>`).join('')}
        <text x="${W/2}" y="${pad-10}" text-anchor="middle" font-family="Inter" font-size="11" fill="#1F2937">Risque de bactériémie par tranche de leucocytes (G/L)</text>
      </svg>
    `;
  }
  window.mountLeucocytesU = mount;
})();
```

- [ ] **Step 3:** Ajouter S1a dans `index.html` (entre S0 et S1b).

```html
<section class="slide" data-slide="S1a">
  <h1>Pourquoi XGBoost ici, le plafond des modèles simples.</h1>
  <div class="phrase-cle-haut">
    Sur le sepsis, la chaîne RL puis RF bute toujours sur le même mur : un recall qui plafonne à 0,43.
  </div>

  <div class="defs-box">
    <div><strong>Accuracy</strong> : taux global de prédictions correctes.</div>
    <div><strong>Recall</strong> (sensibilité) : VP / (VP + FN), part des vrais positifs détectés.</div>
    <div><strong>AUC-PR</strong> : aire sous la courbe précision-rappel, adaptée aux cibles rares.</div>
  </div>

  <div class="s1a-grid">
    <table class="metrics">
      <thead>
        <tr><th>Modèle</th><th>Accuracy</th><th>Recall</th><th>AUC-PR</th></tr>
      </thead>
      <tbody>
        <tr><td>RL, classes équilibrées 50/50</td><td class="num">0,84</td><td class="num">0,72</td><td class="num">élevée</td></tr>
        <tr><td>RL, vraie prévalence 6,5 %</td><td class="num highlight">0,96</td><td class="num highlight">0,43</td><td class="num">0,40</td></tr>
        <tr><td>RF, vraie prévalence</td><td class="num">0,95</td><td class="num highlight">0,43</td><td class="num">0,65</td></tr>
      </tbody>
    </table>
    <div id="leucocytes-u"></div>
  </div>

  <div class="warn-card">
    Le piège accuracy : un classifieur qui prédit « négatif » à tout le monde atteint déjà <strong>0,93</strong> d'accuracy. L'accuracy ment quand la cible est rare.
  </div>

  <div class="phrase-cle-bas">
    D'où vient ce mur ? De trois obstacles concrets qu'aucun des deux modèles ne lève entièrement.
  </div>

  <script>
    document.addEventListener('slidechange', e => {
      if (e.detail.slide.dataset.slide === 'S1a') window.mountLeucocytesU(document.getElementById('leucocytes-u'));
    });
  </script>
</section>
```

- [ ] **Step 4:** Styles dans `deck.css`.

```css
.defs-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 12px;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 20px;
}
.defs-box strong { color: var(--text); }

.s1a-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-top: 20px;
  align-items: start;
}
```

- [ ] **Step 5:** Charger le script et tester.

---

### Task D2 : Extraire « bagging-boosting-schema » pour S3a

**Files:**
- Read: `C:/Users/33698/Documents/1_Deeplearning/ml/modules/10-xgboost/index.html` (chercher `id="bagging-boosting-schema"`)
- Read: `C:/Users/33698/Documents/1_Deeplearning/ml/modules/10-xgboost/script.js` (chercher la fonction d'init)
- Create: `assets/js/animations/bagging-vs-boosting.js` (inliner et adapter couleurs)
- Modify: `index.html` (S3a)
- Modify: `assets/css/deck.css`

- [ ] **Step 1:** Ouvrir `1_Deeplearning/ml/modules/10-xgboost/index.html`, repérer la section `<div id="bagging-boosting-schema"></div>` et son contexte HTML.

- [ ] **Step 2:** Ouvrir `script.js` du module 10, repérer la fonction qui mount sur cet id (probablement `initBaggingBoosting` ou nom similaire).

- [ ] **Step 3:** Copier le code complet de l'init dans `assets/js/animations/bagging-vs-boosting.js`, en remplaçant :
  - Couleurs `--ink-secondary` (#D14545) par `var(--brick)` ou `#D14545` selon contexte
  - Couleurs `--c-ml-accent` (teal #0D9488) gardées
  - Polices Newsreader / Outfit par Inter
  - Exposer la fonction comme `window.mountBaggingVsBoosting`

- [ ] **Step 4:** Ajouter S3a dans `index.html`.

```html
<section class="slide" data-slide="S3a">
  <h1>Bagging et boosting, deux philosophies opposées d'agrégation.</h1>
  <div class="phrase-cle-haut">
    Le boosting ne moyenne pas des avis indépendants. Il construit une chaîne d'arbres où chacun corrige le précédent.
  </div>
  <div class="s3a-grid">
    <div class="card">
      <h2>Bagging (Random Forest)</h2>
      <ul>
        <li>Bootstrap indépendants (échantillonnage avec remise)</li>
        <li>Sous-échantillonnage aléatoire des variables</li>
        <li>Arbres entraînés en parallèle</li>
        <li>Prédiction : vote majoritaire ou moyenne</li>
        <li>Réduit la <strong>variance</strong></li>
      </ul>
    </div>
    <div class="card teal-border">
      <h2>Boosting (XGBoost)</h2>
      <ul>
        <li>Arbres entraînés en <strong>série</strong></li>
        <li>Chaque arbre se concentre sur les erreurs du précédent</li>
        <li>Prédiction : somme pondérée</li>
        <li>Réduit le <strong>biais</strong></li>
      </ul>
    </div>
  </div>
  <div id="bagging-boosting-schema" style="margin-top:16px; height:140px;"></div>
  <div class="phrase-cle-bas">
    Sur le sepsis, le bagging plafonne à recall 0,43 parce qu'aucun arbre individuel ne sait quoi faire des cas rares mal classés. Le boosting force la chaîne à se concentrer dessus.
  </div>
  <script>
    document.addEventListener('slidechange', e => {
      if (e.detail.slide.dataset.slide === 'S3a' && window.mountBaggingVsBoosting) {
        window.mountBaggingVsBoosting(document.getElementById('bagging-boosting-schema'));
      }
    });
  </script>
</section>
```

- [ ] **Step 5:** Styles.

```css
.s3a-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px 24px;
}
.card.teal-border { border-left: 4px solid var(--teal); }
.card h2 { margin-bottom: 10px; }
.card ul { list-style: none; padding: 0; }
.card li { font-size: 14px; color: var(--text-soft); padding: 4px 0; }
```

- [ ] **Step 6:** Tester. Si l'extraction de l'animation du module pose problème (dépendances bizarres), créer une version simplifiée maison (deux schémas SVG côte à côte : 5 arbres en parallèle vs 5 arbres en chaîne avec flèches).

---

### Task D3 : Extraire `residuals-chart` ou `Live boost` pour S3b

**Files:**
- Read: module 10 XGBoost (chercher `id="residuals-chart"`)
- Create: `assets/js/animations/residuals-evolution.js`
- Modify: `index.html` (S3b), avec consommation de `window.deckData.residuals_at_iteration`
- Modify: `assets/css/deck.css`

- [ ] **Step 1:** Repérer dans le module 10 la viz des résidus, l'extraire.

- [ ] **Step 2:** Adapter pour consommer `deckData.residuals_at_iteration[0|10|100]`. Représenter chaque itération en mini-histogramme empilé verticalement.

```javascript
(() => {
  'use strict';
  function mount(c, data) {
    const iters = data && data.residuals_at_iteration;
    if (!iters) { c.innerHTML = '<em>Données indisponibles</em>'; return; }
    const blocks = Object.keys(iters).sort((a,b) => parseInt(a) - parseInt(b));
    c.innerHTML = blocks.map(k => `
      <div class="resi-block">
        <div class="resi-label">Itération ${k}</div>
        <div class="resi-bars">
          ${histogramme(iters[k], 20)}
        </div>
      </div>
    `).join('');
  }

  function histogramme(values, nBins) {
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const bins = Array(nBins).fill(0);
    values.forEach(v => bins[Math.min(nBins - 1, Math.floor((v - min) / range * nBins))]++);
    const maxCount = Math.max(...bins, 1);
    return bins.map((cnt, i) => `<div class="resi-bar" style="height:${(cnt / maxCount) * 100}%"></div>`).join('');
  }

  window.mountResidualsEvolution = mount;
})();
```

- [ ] **Step 3:** Ajouter S3b.

```html
<section class="slide" data-slide="S3b">
  <h1>Le gradient boosting apprend la suite des résidus.</h1>
  <div class="phrase-cle-haut">
    Chaque arbre ne réapprend pas le problème. Il apprend juste ce que le précédent n'a pas su faire.
  </div>
  <div class="formula-box">
    F<sub>m+1</sub>(x) = F<sub>m</sub>(x) + η · h<sub>m+1</sub>(x)
    <div class="formula-note">avec h<sub>m+1</sub> qui apprend les résidus <code>−∂L / ∂F</code> (gradient négatif de la loss).</div>
  </div>
  <div id="residuals-evolution" class="residuals-evolution"></div>
  <div class="phrase-cle-bas">
    Friedman 1999 : c'est équivalent à une descente de gradient dans l'espace des fonctions. D'où « gradient boosting ».
  </div>
  <script>
    document.addEventListener('slidechange', async e => {
      if (e.detail.slide.dataset.slide === 'S3b') {
        await window.deckDataReady;
        window.mountResidualsEvolution(document.getElementById('residuals-evolution'), window.deckData);
      }
    });
  </script>
</section>
```

- [ ] **Step 4:** Styles.

```css
.formula-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px 24px;
  margin: 20px 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 17px;
  text-align: center;
  color: var(--text);
}
.formula-note { font-family: 'Inter'; font-size: 12px; color: var(--muted); margin-top: 8px; }
.residuals-evolution { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 12px; }
.resi-block { background: var(--surface); border: 1px solid var(--border); padding: 16px; border-radius: 6px; }
.resi-label { font-family: 'JetBrains Mono'; font-size: 11px; color: var(--muted); margin-bottom: 8px; }
.resi-bars { display: flex; align-items: flex-end; gap: 1px; height: 60px; }
.resi-bar { flex: 1; background: var(--teal); min-height: 2px; }
```

- [ ] **Step 5:** Tester.

---

### Task D4 : Extraire animation Shapley pour S5a

**Files:**
- Read: `1_Deeplearning/ml/modules/11-shap/index.html` (chercher la vignette Shapley en 30s, probablement `id="shapley-game"` ou similaire)
- Create: `assets/js/animations/shapley-30s.js`
- Modify: `index.html` (S5a)
- Modify: `assets/css/deck.css`

Procédure d'extraction identique à D2 et D3. Voir storyboard §3 S5a pour le contenu de la slide. Si l'animation source est trop complexe à extraire, créer une vignette simple : 3 joueurs (A, B, C), tableau des 6 ordres d'arrivée, contribution marginale.

- [ ] **Step 1:** Repérer la vignette dans le module 11.
- [ ] **Step 2:** Extraire ou recréer simplement.
- [ ] **Step 3:** Ajouter la slide S5a (voir storyboard, deux cards « SHAP fait » / « SHAP NE fait PAS »).
- [ ] **Step 4:** Tester.

---

### Task D5 : Extraire beeswarm + dependence pour S5b

**Files:**
- Read: module 11 SHAP (beeswarm + dependence plot)
- Create: `assets/js/animations/beeswarm.js`, `assets/js/animations/dependence-leucocytes.js`
- Modify: `index.html` (S5b), avec consommation de `deckData.shap_beeswarm` et `deckData.shap_dependence_leucocytes`

Procédure identique. La spécificité ici : les animations consomment des données réelles produites par le pipeline (`shap_global`, `shap_beeswarm`, `shap_dependence_leucocytes`). Si les animations du module 11 sont basées sur des datasets autres, adapter pour lire `window.deckData`.

- [ ] **Step 1:** Beeswarm : trier les variables par `mean_abs_shap`, plotter chaque échantillon comme un point coloré par sa valeur normalisée.
- [ ] **Step 2:** Dependence plot leucocytes : scatter X = leucocytes G/L, Y = SHAP de cette feature.
- [ ] **Step 3:** Assembler la slide S5b (deux blocs côte à côte).
- [ ] **Step 4:** Vérifier que la forme en U apparaît bien dans le dependence plot.

---

### Task D6 : Extraire waterfall pour S5c (avec révélation du proxy)

**Files:**
- Read: module 11 SHAP (waterfall)
- Create: `assets/js/animations/waterfall-patient.js`
- Modify: `index.html` (S5c), avec consommation de `deckData.shap_waterfall_patient_99pct`

- [ ] **Step 1:** Adapter le waterfall pour mettre en évidence en rouge brique la ligne `mode_prise_en_charge` (ou `mode_Hospitalisé` après one-hot encoding).

- [ ] **Step 2:** Ajouter S5c avec l'encadré rouge brique « variable suspecte » et le grand encadré teal « Corrélation n'est pas causalité ».

- [ ] **Step 3:** Vérifier que le proxy ressort bien dans le waterfall (sinon, retoucher la calibration de B2 ou choisir un autre patient cible dans B4).

---

## Phase E — Animations à créer (data-driven)

### Task E1 : Animation interactive ROC + PR + matrice + curseur seuil (S2b et S4b)

**Files:**
- Create: `assets/js/animations/threshold-roc-pr.js`
- Modify: `index.html` (S2b et S4b)
- Modify: `assets/css/deck.css`

C'est l'animation principale du deck. Doit :
- Lire `deckData.roc_xgb`, `deckData.pr_xgb` (vecteurs pré-calculés)
- Afficher 3 graphiques côte à côte : matrice de confusion, ROC, PR
- Un curseur `<input type="range" min="0" max="1" step="0.01">` qui contrôle un seuil
- Les valeurs Recall / Precision / Accuracy s'affichent en gros et bougent en temps réel
- Le point opérationnel glisse sur ROC et PR

- [ ] **Step 1:** Écrire le composant.

```javascript
(() => {
  'use strict';

  function mount(c, data, initialThreshold = 0.5) {
    const roc = data.roc_xgb;
    const pr  = data.pr_xgb;

    c.innerHTML = `
      <div class="threshold-roc-pr">
        <div class="trp-row trp-numbers">
          <div class="trp-metric"><div class="trp-label">Seuil</div><div class="trp-value" id="trp-th">${initialThreshold.toFixed(2)}</div></div>
          <div class="trp-metric"><div class="trp-label">Recall</div><div class="trp-value teal" id="trp-recall">–</div></div>
          <div class="trp-metric"><div class="trp-label">Precision</div><div class="trp-value" id="trp-precision">–</div></div>
          <div class="trp-metric"><div class="trp-label">Accuracy</div><div class="trp-value muted" id="trp-accuracy">–</div></div>
        </div>
        <div class="trp-slider">
          <input type="range" id="trp-input" min="0.05" max="0.95" step="0.01" value="${initialThreshold}">
        </div>
        <div class="trp-row trp-plots">
          <div class="trp-plot" id="trp-confusion"></div>
          <div class="trp-plot" id="trp-roc"></div>
          <div class="trp-plot" id="trp-pr"></div>
        </div>
      </div>
    `;

    const elTh    = c.querySelector('#trp-th');
    const elRec   = c.querySelector('#trp-recall');
    const elPrec  = c.querySelector('#trp-precision');
    const elAcc   = c.querySelector('#trp-accuracy');
    const slider  = c.querySelector('#trp-input');

    function update(th) {
      elTh.textContent = th.toFixed(2);
      const m = closestMetricsForThreshold(roc, pr, th, data);
      elRec.textContent  = m.recall.toFixed(2);
      elPrec.textContent = m.precision.toFixed(2);
      elAcc.textContent  = m.accuracy.toFixed(2);
      drawConfusion(c.querySelector('#trp-confusion'), m);
      drawROC(c.querySelector('#trp-roc'), roc, th);
      drawPR(c.querySelector('#trp-pr'), pr, th);
    }

    slider.addEventListener('input', e => update(parseFloat(e.target.value)));
    update(initialThreshold);
  }

  // helpers : closestMetricsForThreshold, drawConfusion, drawROC, drawPR
  function closestMetricsForThreshold(roc, pr, th, data) {
    // Le plus proche dans pr_xgb
    const p = pr.reduce((best, cur) => Math.abs(cur.threshold - th) < Math.abs(best.threshold - th) ? cur : best);
    // Confusion à partir de pr (calcul approximatif)
    // Pour la confusion exacte on s'appuie sur data.confusion_at_threshold si dispo, sinon approx.
    const conf = data.confusion_at_threshold[th.toFixed(2)];
    const tp = conf ? conf.tp : Math.round(p.recall * 80);
    const fn = conf ? conf.fn : Math.round((1 - p.recall) * 80);
    const fp = conf ? conf.fp : Math.round(((1 - p.precision) / p.precision) * tp);
    const tn = conf ? conf.tn : 1000;
    return {
      threshold: p.threshold, recall: p.recall, precision: p.precision,
      accuracy: (tp + tn) / (tp + tn + fp + fn),
      tp, fp, fn, tn
    };
  }

  function drawConfusion(el, m) {
    el.innerHTML = `
      <div class="trp-plot-title">Matrice de confusion</div>
      <table class="confusion">
        <tr><th></th><th>Préd. négatif</th><th>Préd. positif</th></tr>
        <tr><th>Vrai négatif</th><td class="ok">${m.tn}</td><td class="warn">${m.fp}</td></tr>
        <tr><th>Vrai positif</th><td class="bad">${m.fn}</td><td class="ok">${m.tp}</td></tr>
      </table>`;
  }
  function drawROC(el, roc, th) {
    const W=160, H=160, pad=20;
    const xS = x => pad + x * (W - 2*pad);
    const yS = y => H - pad - y * (H - 2*pad);
    const d = roc.map((p, i) => `${i ? 'L' : 'M'} ${xS(p.fpr).toFixed(1)} ${yS(p.tpr).toFixed(1)}`).join(' ');
    const op = roc.reduce((b, c) => Math.abs(c.threshold - th) < Math.abs(b.threshold - th) ? c : b);
    el.innerHTML = `
      <div class="trp-plot-title">ROC</div>
      <svg viewBox="0 0 ${W} ${H}">
        <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${pad}" stroke="#E5E7EB" stroke-dasharray="3,3"/>
        <path d="${d}" fill="none" stroke="#0D9488" stroke-width="2"/>
        <circle cx="${xS(op.fpr)}" cy="${yS(op.tpr)}" r="5" fill="#D14545"/>
        <text x="${W/2}" y="${H-4}" text-anchor="middle" font-size="9" fill="#6B7280">FPR</text>
        <text x="${pad-12}" y="${H/2}" font-size="9" fill="#6B7280" transform="rotate(-90,${pad-12},${H/2})">TPR</text>
      </svg>`;
  }
  function drawPR(el, pr, th) {
    const W=160, H=160, pad=20;
    const xS = x => pad + x * (W - 2*pad);
    const yS = y => H - pad - y * (H - 2*pad);
    const d = pr.map((p, i) => `${i ? 'L' : 'M'} ${xS(p.recall).toFixed(1)} ${yS(p.precision).toFixed(1)}`).join(' ');
    const op = pr.reduce((b, c) => Math.abs(c.threshold - th) < Math.abs(b.threshold - th) ? c : b);
    el.innerHTML = `
      <div class="trp-plot-title">Précision-Rappel</div>
      <svg viewBox="0 0 ${W} ${H}">
        <path d="${d}" fill="none" stroke="#0D9488" stroke-width="2"/>
        <circle cx="${xS(op.recall)}" cy="${yS(op.precision)}" r="5" fill="#D14545"/>
        <text x="${W/2}" y="${H-4}" text-anchor="middle" font-size="9" fill="#6B7280">Recall</text>
        <text x="${pad-12}" y="${H/2}" font-size="9" fill="#6B7280" transform="rotate(-90,${pad-12},${H/2})">Precision</text>
      </svg>`;
  }

  window.mountThresholdRocPR = mount;
})();
```

- [ ] **Step 2:** Styles (extrait).

```css
.threshold-roc-pr { width: 100%; }
.trp-row { display: flex; gap: 20px; }
.trp-numbers { justify-content: space-around; margin-bottom: 12px; }
.trp-metric { display: flex; flex-direction: column; align-items: center; }
.trp-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
.trp-value { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 600; color: var(--text); }
.trp-value.teal { color: var(--teal); }
.trp-value.muted { color: var(--muted); }
.trp-slider { padding: 8px 0 16px; }
.trp-slider input { width: 100%; accent-color: var(--teal); }
.trp-plots { gap: 16px; }
.trp-plot { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 12px; }
.trp-plot-title { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
.trp-plot svg { width: 100%; height: auto; }
table.confusion { font-size: 12px; border-collapse: collapse; width: 100%; }
table.confusion th, table.confusion td { padding: 6px; border: 1px solid var(--border); text-align: center; }
table.confusion td.ok   { color: var(--text); }
table.confusion td.warn { color: var(--brick); }
table.confusion td.bad  { color: var(--brick); font-weight: 700; }
```

- [ ] **Step 3:** Slide S2b dans `index.html`.

```html
<section class="slide" data-slide="S2b">
  <h1>Le choix de la métrique n'est pas technique, il est clinique.</h1>
  <div class="phrase-cle-haut">
    En sepsis, un faux négatif tue. Une fausse alerte coûte une hémoculture. Le rapport de gravité dicte la métrique.
  </div>
  <div id="trp-s2b" class="anim-anchor"></div>
  <div class="phrase-cle-bas">
    On pilote au recall et à l'AUC-PR. L'accuracy ne s'occupe pas du sort des patients qu'elle rate.
  </div>
  <script>
    document.addEventListener('slidechange', async e => {
      if (e.detail.slide.dataset.slide === 'S2b') {
        await window.deckDataReady;
        window.mountThresholdRocPR(document.getElementById('trp-s2b'), window.deckData, 0.5);
      }
    });
  </script>
</section>
```

- [ ] **Step 4:** Slide S4b avec réutilisation et seuil initial à 0,3.

```html
<section class="slide" data-slide="S4b">
  <h1>Abaisser le seuil de 0,5 à 0,3, un arbitrage clinique.</h1>
  <div class="phrase-cle-haut">
    Le seuil de décision n'est pas une donnée, c'est une décision clinique.
  </div>
  <div id="trp-s4b" class="anim-anchor"></div>
  <div class="callout-teal" style="margin-top: 16px;">
    Combien de fausses alertes est-on prêt à accepter pour récupérer <strong>10 sepsis manqués supplémentaires</strong> sur 100 vrais positifs ?
  </div>
  <div class="phrase-cle-bas">
    Cette décision n'est pas la mienne. C'est celle du clinicien et du service. Mais le modèle doit la rendre <strong>visible</strong> et <strong>chiffrable</strong>.
  </div>
  <script>
    document.addEventListener('slidechange', async e => {
      if (e.detail.slide.dataset.slide === 'S4b') {
        await window.deckDataReady;
        window.mountThresholdRocPR(document.getElementById('trp-s4b'), window.deckData, 0.3);
      }
    });
  </script>
</section>
```

- [ ] **Step 5:** Tester. Glisser le curseur doit faire bouger les 3 graphiques + les 4 chiffres en temps réel.

---

### Task E2 : Slide S4a, tableau XGBoost + barres animées Recall

**Files:**
- Modify: `index.html` (ajouter S4a)
- Create: `assets/js/animations/recall-bars.js` (optionnel)

- [ ] **Step 1:** Slide S4a.

```html
<section class="slide" data-slide="S4a">
  <h1>XGBoost sur la cohorte simulée, les chiffres.</h1>
  <div class="phrase-cle-haut">
    Pas un saut de discrimination globale, un saut de rappel.
  </div>
  <div class="s4a-grid">
    <table class="metrics" id="s4a-table">
      <thead>
        <tr><th>Modèle</th><th>AUC-ROC</th><th>AUC-PR</th><th>Recall @ 0,5</th><th>Precision @ 0,5</th></tr>
      </thead>
      <tbody id="s4a-tbody"></tbody>
    </table>
    <div class="warn-card" style="background: var(--teal-soft); border-left-color: var(--teal); color: var(--text-soft);">
      <strong>Lecture honnête.</strong><br>
      • AUC-ROC : XGB légèrement en dessous de RF.<br>
      • AUC-PR : quasi équivalents.<br>
      • Recall @ 0,5 : 0,43 → 0,55, soit ~28 % de vrais positifs supplémentaires détectés à seuil égal.
    </div>
  </div>
  <div class="phrase-cle-bas">
    Le gain XGBoost n'est pas dans la discrimination, il est dans la sensibilité à seuil égal. C'est exactement ce qu'on veut en sepsis.
  </div>
  <script>
    document.addEventListener('slidechange', async e => {
      if (e.detail.slide.dataset.slide === 'S4a') {
        await window.deckDataReady;
        const m = window.deckData.metrics;
        const tbody = document.getElementById('s4a-tbody');
        const fmt = n => n.toFixed(2).replace('.', ',');
        tbody.innerHTML = [
          ['RL prévalence réelle', m.rl_reel],
          ['Random Forest',        m.rf],
          ['XGBoost',              m.xgb],
        ].map(([name, x], i) => `
          <tr>
            <td>${name}</td>
            <td class="num">${fmt(x.auc_roc)}</td>
            <td class="num">${fmt(x.auc_pr)}</td>
            <td class="num ${i === 2 ? 'highlight' : ''}">${fmt(x.at_50.recall)}</td>
            <td class="num">${fmt(x.at_50.precision)}</td>
          </tr>
        `).join('');
      }
    });
  </script>
</section>
```

- [ ] **Step 2:** Styles si nécessaire.

```css
.s4a-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 28px; align-items: start; }
```

- [ ] **Step 3:** Tester.

---

### Task E3 : Slides texte restantes S3c, S3e, S5a, S5b, S5c

Pour chaque, suivre le storyboard, créer la slide avec le contenu indiqué. Animations seulement si extractions disponibles depuis Phase D (sinon, slide statique avec contenu textuel suffisant).

- [ ] **Step 1:** S3c (3 cartes empilées LR / régul / early stopping).
- [ ] **Step 2:** S3e (`scale_pos_weight` callback + tableau comparaison stratégies).
- [ ] **Step 3:** S5a (deux cards SHAP fait / SHAP NE fait PAS, formule cadrée).
- [ ] **Step 4:** S5b (beeswarm + dependence, voir D5).
- [ ] **Step 5:** S5c (waterfall + variable proxy, voir D6).

Voir storyboard §3 pour le contenu exact.

---

## Phase F — Assemblage et validation finale

### Task F1 : Vérifier l'ordre des slides

**Files:**
- Modify: `index.html`

Vérifier que les `<section class="slide">` apparaissent dans l'ordre du storyboard :
S0, S1a, S1b, S2a, S2b, S3a, S3b, S3c, S3d, S3e, S4a, S4b, S5a, S5b, S5c, SC.

Le counter doit afficher `XX / 16`.

- [ ] **Step 1:** Lister les `data-slide` dans `index.html` (via grep / lecture).
- [ ] **Step 2:** Comparer à l'ordre attendu, ajuster si besoin.

---

### Task F2 : Walkthrough final, chrono à 12 min

- [ ] **Step 1:** Lancer le serveur statique : `python -m http.server 8080`.
- [ ] **Step 2:** Ouvrir `http://localhost:8080`, passer en plein écran (touche F).
- [ ] **Step 3:** Naviguer slide par slide à la flèche droite. Pour chaque, lire à voix haute la phrase-clé haut et bas, vérifier que les animations se chargent.
- [ ] **Step 4:** Chronométrer le temps total de lecture. Cible : entre 11 et 13 minutes.
- [ ] **Step 5:** Noter les slides qui :
  - débordent du cadre (à corriger CSS)
  - ont une animation cassée (console à vérifier)
  - se lisent moins bien que sur le papier (à reformuler)
- [ ] **Step 6:** Itérer si nécessaire.

---

### Task F3 : Polish final, sommaire et numéros de slide

- [ ] **Step 1:** Ajouter, en haut à droite de chaque slide, un numéro discret format `04 / 16` (CSS-only via `counter-increment` ou JS).
- [ ] **Step 2:** Optionnel, raccourci ESC qui affiche une grille sommaire des 16 slides cliquable. À faire seulement si le walkthrough F2 a convaincu que c'est utile.
- [ ] **Step 3:** Vérifier responsive sur les résolutions plausibles de présentation : 1920×1080 (vidéoprojecteur classique), 1280×720 (ordinateur portable basique).

---

## 7. Auto-revue du plan

### Couverture spec → tâches

| Section du storyboard | Tâche(s) couvrante(s) |
|---|---|
| §1 Contexte | Documentation, pas de tâche |
| §2.1 Format slide-deck | A1, A2, A4 |
| §2.2 Style Direction B | A3 |
| §2.3 Conventions écriture | présentes dans chaque slide |
| §2.4 Réutilisation animations | D1, D2, D3, D4, D5, D6 |
| §2.5 Emplacement | A1 |
| §2.6 Pipeline data | B1, B2, B3, B4, B5 |
| §2.7 Calibration proxy | B2 (signal `mode_prise_en_charge`) |
| §3 16 slides | C1-C5, D1-D6, E1-E3 |
| §4 Animations inventaire | D1-D6 (extraites), C2, C4, E1, E2 (créées) |
| §5 Pipeline data JSON | B4 produit la structure |
| §7 Style guide | A3 |

Aucune section non couverte.

### Cohérence des types et noms

- Nom de fichier : `assets/data/deck.json` partout.
- Variable globale : `window.deckData` (chargée par `data-loader.js`).
- Event : `slidechange` (depuis `deck-navigation.js`).
- Naming animations : `window.mount<NomCamelCase>` (un par fichier).
- Naming clés JSON : voir B4 (`metrics`, `roc_xgb`, `pr_xgb`, `shap_waterfall_patient_99pct`, etc.). Toutes les tâches qui consomment se réfèrent à ces clés exactes.

### Placeholders

Le plan est complet, pas de TODO, TBD, ou "to be implemented".

Une exception assumée : les tâches D2 à D6 demandent de lire des fichiers source et d'en extraire des animations. Le code exact dépend du contenu actuel des modules cours. L'exécutant devra lire les fichiers et adapter — c'est délibéré, ce sont les seules zones qui ne peuvent pas être pré-écrites.
