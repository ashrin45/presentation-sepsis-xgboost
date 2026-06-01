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
