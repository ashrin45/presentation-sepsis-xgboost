"""
Entraîne 6 modèles sur sepsis_cohort.csv :
  1) RL équilibrée 50/50 (par sous-échantillonnage des négatifs)
  2) RL sur prévalence réelle, sans class_weight (naïve)
  3) RL sur prévalence réelle, avec class_weight='balanced'
  4) Random Forest sur prévalence réelle, sans class_weight (naïve)
  5) Random Forest sur prévalence réelle, avec class_weight='balanced'
  6) XGBoost sur prévalence réelle, avec scale_pos_weight et early stopping

Sortie : models.pkl
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


def prepare_features(df):
    feat_num = ['leucocytes', 'PNN', 'lymphocytes', 'NLR', 'granul_immatures_pct',
                'plaquettes', 'eosinophiles', 'monocytes', 'hemoglobine', 'VPM', 'RDW']
    feat_bin = ['granul_immatures_present']
    feat_cat = ['mode_prise_en_charge']

    df_oh = pd.get_dummies(df, columns=feat_cat, prefix='mode')

    feature_names = feat_num + feat_bin + [c for c in df_oh.columns if c.startswith('mode_')]
    X = df_oh[feature_names].copy()
    y = df['hemoculture_positive'].values

    return X, y, feature_names


def train_rl(X_train, y_train, balanced=False, class_weight_balanced=False):
    if balanced and class_weight_balanced:
        raise ValueError("balanced (50/50 subsampling) and class_weight_balanced are mutually exclusive")

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

    X_tr_filled = X_tr.fillna(X_tr.median(numeric_only=True))
    scaler = StandardScaler()
    X_tr_scaled = scaler.fit_transform(X_tr_filled)

    cw = 'balanced' if class_weight_balanced else None
    mdl = LogisticRegression(max_iter=1000, random_state=SEED, class_weight=cw)
    mdl.fit(X_tr_scaled, y_tr)
    return mdl, scaler


def train_rf(X_train, y_train, class_weight_balanced=False):
    X_tr_filled = X_train.fillna(X_train.median(numeric_only=True))
    cw = 'balanced' if class_weight_balanced else None
    mdl = RandomForestClassifier(
        n_estimators=300, max_depth=10, min_samples_leaf=5,
        random_state=SEED, n_jobs=-1, class_weight=cw,
    )
    mdl.fit(X_tr_filled, y_train)
    return mdl


def train_xgb(X_train, y_train, X_val, y_val):
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

    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30,
                                                        stratify=y, random_state=SEED)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50,
                                                    stratify=y_temp, random_state=SEED)

    rl_bal,             scal_bal             = train_rl(X_train, y_train, balanced=True)
    rl_reel_naive,      scal_reel_naive      = train_rl(X_train, y_train, balanced=False, class_weight_balanced=False)
    rl_reel_balanced,   scal_reel_balanced   = train_rl(X_train, y_train, balanced=False, class_weight_balanced=True)
    rf_naive                                  = train_rf(X_train, y_train, class_weight_balanced=False)
    rf_balanced                               = train_rf(X_train, y_train, class_weight_balanced=True)
    xgb_real, spw                             = train_xgb(X_train, y_train, X_val, y_val)

    bundle = {
        'feature_names': feature_names,
        'X_train': X_train, 'y_train': y_train,
        'X_val':   X_val,   'y_val':   y_val,
        'X_test':  X_test,  'y_test':  y_test,
        'rl_bal':            rl_bal,            'scaler_bal':            scal_bal,
        'rl_reel_naive':     rl_reel_naive,     'scaler_reel_naive':     scal_reel_naive,
        'rl_reel_balanced':  rl_reel_balanced,  'scaler_reel_balanced':  scal_reel_balanced,
        'rf_naive':          rf_naive,
        'rf_balanced':       rf_balanced,
        'xgb_real': xgb_real, 'scale_pos_weight': spw,
    }
    with open('models.pkl', 'wb') as f:
        pickle.dump(bundle, f)

    print(f"6 modèles entraînés et sauvegardés dans models.pkl")


if __name__ == '__main__':
    main()
