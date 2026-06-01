"""
Exploration sbcdata : reproduit notre pipeline minimal (RL, RF, XGBoost) sur les
données réelles, pour comparer les chiffres avec la simulation actuelle.

Choix de simplicité :
  - Cible binaire : Sepsis vs tout le reste (Control + SIRS)
  - Une mesure par patient (la première)
  - Centre Leipzig uniquement
  - 5 variables NFS de base (WBC, HGB, PLT, RBC, MCV) + Age, Sex, CRP, Sender

Sortie : tableau comparatif des métriques.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, recall_score, precision_score,
                              roc_auc_score, average_precision_score)
import xgboost as xgb

SEED = 2026
CSV = 'C:/Users/33698/Downloads/ampel-leipzig-sbcdata-5c6f568/inst/extdata/unzipped/extdata/sbcdata.csv'


def load_and_filter():
    print('[1/4] Chargement du CSV...')
    df = pd.read_csv(CSV)
    print(f'   {len(df):,} lignes brutes, {df["Id"].nunique():,} Ids')

    print('[2/4] Filtrage Leipzig + premiere mesure par patient...')
    df = df[df['Center'] == 'Leipzig'].copy()
    df = df.sort_values(['Id', 'Time']).groupby('Id', as_index=False).first()
    df['y'] = (df['Diagnosis'] == 'Sepsis').astype(int)
    print(f'   {len(df):,} patients uniques Leipzig')
    print(f'   Prevalence Sepsis : {df["y"].mean():.4f}')
    print(f'   Sepsis count : {df["y"].sum():,}')
    return df


def prepare_features(df):
    feat_num = ['Age', 'WBC', 'HGB', 'PLT', 'RBC', 'MCV', 'CRP']
    df['Sex_M'] = (df['Sex'] == 'M').astype(int)
    df = pd.get_dummies(df, columns=['Sender'], prefix='Sender', dtype=int)
    sender_cols = [c for c in df.columns if c.startswith('Sender_')]
    feature_names = feat_num + ['Sex_M'] + sender_cols
    X = df[feature_names].copy()
    y = df['y'].values
    return X, y, feature_names


def metrics_summary(y_true, proba, name):
    auc_roc = roc_auc_score(y_true, proba)
    auc_pr = average_precision_score(y_true, proba)
    out = {'model': name, 'auc_roc': auc_roc, 'auc_pr': auc_pr}
    for t in [0.5, 0.3, 0.1, 0.05]:
        pred = (proba >= t).astype(int)
        out[f'recall@{t}'] = recall_score(y_true, pred, zero_division=0)
        out[f'precision@{t}'] = precision_score(y_true, pred, zero_division=0)
        out[f'accuracy@{t}'] = accuracy_score(y_true, pred)
    return out


def main():
    df = load_and_filter()
    X, y, feature_names = prepare_features(df)

    print('[3/4] Train/val/test split 70/15/15 stratifie...')
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=SEED)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=SEED)
    print(f'   Train {len(X_train):,} / Val {len(X_val):,} / Test {len(X_test):,}')
    print(f'   Positifs test : {y_test.sum():,} ({y_test.mean():.4f})')

    print('[4/4] Entrainement et evaluation des modeles...')

    # RL naive (pas de class_weight)
    X_tr_imp = X_train.fillna(X_train.median(numeric_only=True))
    X_te_imp = X_test.fillna(X_train.median(numeric_only=True))
    scaler = StandardScaler()
    X_tr_sc = scaler.fit_transform(X_tr_imp)
    X_te_sc = scaler.transform(X_te_imp)

    rl_naive = LogisticRegression(max_iter=1000, random_state=SEED)
    rl_naive.fit(X_tr_sc, y_train)
    p_rl_naive = rl_naive.predict_proba(X_te_sc)[:, 1]

    rl_bal = LogisticRegression(max_iter=1000, random_state=SEED, class_weight='balanced')
    rl_bal.fit(X_tr_sc, y_train)
    p_rl_bal = rl_bal.predict_proba(X_te_sc)[:, 1]

    # RF naive et balanced
    rf_naive = RandomForestClassifier(n_estimators=300, max_depth=10,
                                      min_samples_leaf=5, random_state=SEED, n_jobs=-1)
    rf_naive.fit(X_tr_imp, y_train)
    p_rf_naive = rf_naive.predict_proba(X_te_imp)[:, 1]

    rf_bal = RandomForestClassifier(n_estimators=300, max_depth=10,
                                    min_samples_leaf=5, random_state=SEED,
                                    n_jobs=-1, class_weight='balanced')
    rf_bal.fit(X_tr_imp, y_train)
    p_rf_bal = rf_bal.predict_proba(X_te_imp)[:, 1]

    # XGBoost avec scale_pos_weight + manquants natifs (NB on passe X_train SANS imputation)
    spw = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    print(f'   scale_pos_weight = {spw:.2f}')
    xgb_mdl = xgb.XGBClassifier(
        n_estimators=500, learning_rate=0.05, max_depth=6,
        reg_alpha=0, reg_lambda=1, scale_pos_weight=spw,
        objective='binary:logistic', eval_metric='aucpr',
        random_state=SEED, n_jobs=-1, early_stopping_rounds=30)
    xgb_mdl.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    p_xgb = xgb_mdl.predict_proba(X_test)[:, 1]

    results = [
        metrics_summary(y_test, p_rl_naive, 'RL naive'),
        metrics_summary(y_test, p_rl_bal,   'RL balanced'),
        metrics_summary(y_test, p_rf_naive, 'RF naive'),
        metrics_summary(y_test, p_rf_bal,   'RF balanced'),
        metrics_summary(y_test, p_xgb,      'XGBoost'),
    ]

    out = pd.DataFrame(results)
    print()
    print('=== Resultats sur test set ===')
    print(out.to_string(index=False, float_format=lambda x: f'{x:.3f}'))


if __name__ == '__main__':
    main()
