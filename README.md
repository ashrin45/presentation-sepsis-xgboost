# Détecter un sepsis avec une NFS, XGBoost + SHAP

Présentation HTML (slide-deck navigable) appliquant la théorie XGBoost et l'analyse SHAP à un cas clinique simulé : prédire qu'une hémoculture reviendra positive (bactériémie) à partir d'une numération formule sanguine.

## Voir la présentation

Page GitHub Pages : [https://ashrin45.github.io/presentation-sepsis-xgboost/](https://ashrin45.github.io/presentation-sepsis-xgboost/)

Localement : ouvrir `index.html` dans un navigateur, ou lancer un petit serveur statique :

```bash
python -m http.server 8080
# puis ouvrir http://localhost:8080
```

## Navigation

- Flèches gauche / droite, ou espace pour avancer
- `F` pour le plein écran, `ESC` pour sortir
- `Home` / `End` pour aller au début / à la fin

## Structure

```
index.html                 # le deck (18 slides)
assets/css/deck.css        # style (Direction B, blanc clinique, accent teal)
assets/js/                 # navigation, data loader, slide resizer
assets/js/animations/      # une animation par fichier (8 animations)
assets/data/deck.json      # chiffres réels produits par le pipeline data
data-pipeline/             # pipeline Python (génération, entraînement, export)
storyboard.md              # spec slide par slide
real_data_research.md      # rapport sur les sources de données réelles
```

## Pipeline data (reproduire les chiffres)

Le `deck.json` est produit par 3 scripts Python à lancer dans l'ordre :

```bash
cd data-pipeline
python -m venv .venv
source .venv/bin/activate     # ou .venv/Scripts/activate sur Windows
pip install -r requirements.txt

python generate_data.py       # produit sepsis_cohort.csv (20 000 patients simulés)
python train_models.py        # entraîne 6 modèles, produit models.pkl
python export_for_deck.py     # produit ../assets/data/deck.json
```

Seed : `numpy.random.default_rng(2026)`. Toute exécution donne le même dataset.

## Données

**Simulées**, ~20 000 patients adultes, prévalence d'hémocultures positives ~6 % dans la cohorte. 11 paramètres NFS biologiquement plausibles + 1 variable de contexte (mode de prise en charge). Manquants réalistes sur RDW, VPM, éosinophiles.

Le label est "hémoculture positive". Pour rejouer la démarche sur des données réelles, voir `real_data_research.md` (pointe vers sbcdata, Zenodo, CC BY 4.0 et PhysioNet Challenge 2019).

## Licence

Code et présentation sous licence MIT, sauf indication contraire.
