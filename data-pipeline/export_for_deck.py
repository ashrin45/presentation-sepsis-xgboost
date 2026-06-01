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

    p_rl_bal           = predict_rl(b['rl_bal'],            b['scaler_bal'],            X_test)
    p_rl_reel_naive    = predict_rl(b['rl_reel_naive'],     b['scaler_reel_naive'],     X_test)
    p_rl_reel_balanced = predict_rl(b['rl_reel_balanced'],  b['scaler_reel_balanced'],  X_test)
    p_rf_naive         = predict_rf(b['rf_naive'],     X_test)
    p_rf_balanced      = predict_rf(b['rf_balanced'],  X_test)
    p_xgb              = predict_xgb(b['xgb_real'], X_test)

    out = { 'metrics': {
        'rl_equilibre':     metrics_summary(y_test, p_rl_bal),
        'rl_reel_naive':    metrics_summary(y_test, p_rl_reel_naive),
        'rl_reel_balanced': metrics_summary(y_test, p_rl_reel_balanced),
        'rf_naive':         metrics_summary(y_test, p_rf_naive),
        'rf_balanced':      metrics_summary(y_test, p_rf_balanced),
        'xgb':              metrics_summary(y_test, p_xgb),
    }}

    fpr, tpr, thr_roc = roc_curve(y_test, p_xgb)
    prec, rec, thr_pr = precision_recall_curve(y_test, p_xgb)

    # sklearn's roc_curve prepends np.inf as the first threshold ; clamp to 1.0 for JSON
    thr_roc_safe = np.where(np.isfinite(thr_roc), thr_roc, 1.0)

    out['roc_xgb'] = [
        {'threshold': float(t), 'fpr': float(f), 'tpr': float(tp)}
        for t, f, tp in zip(thr_roc_safe, fpr, tpr)
    ]
    out['pr_xgb'] = [
        {'threshold': float(t), 'precision': float(p), 'recall': float(r)}
        for t, p, r in zip(np.concatenate([thr_pr, [1.0]]), prec, rec)
    ]

    out['confusion_at_threshold'] = {}
    for t in [0.50, 0.40, 0.30]:
        pred = (p_xgb >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
        out['confusion_at_threshold'][f'{t:.2f}'] = {
            'tn': int(tn), 'fp': int(fp), 'fn': int(fn), 'tp': int(tp)
        }

    print("Calcul SHAP...")
    explainer = shap.TreeExplainer(b['xgb_real'])
    shap_values = explainer.shap_values(X_test)
    base_value = float(explainer.expected_value if np.ndim(explainer.expected_value) == 0
                       else explainer.expected_value[0])

    feature_names = b['feature_names']

    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    order = np.argsort(-mean_abs_shap)
    out['shap_global'] = [
        {'feature': feature_names[i], 'mean_abs_shap': float(mean_abs_shap[i])}
        for i in order[:12]
    ]

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

    leuco_idx = feature_names.index('leucocytes')
    out['shap_dependence_leucocytes'] = [
        {'x': float(X_test.iloc[i, leuco_idx]),
         'y_shap': float(shap_values[i, leuco_idx])}
        for i in range(len(X_test))
    ]

    # Pick the highest-risk patient (top-3 by proba), preferring one with missing RDW
    # so the waterfall slide can illustrate XGBoost's native NaN handling
    top_idx = np.argsort(-p_xgb)[:max(3, int((p_xgb >= 0.90).sum()))]
    chosen = None
    for i in top_idx:
        row = X_test.iloc[i]
        if pd.isna(row.get('RDW', 0)):
            chosen = int(i); break
    if chosen is None and len(top_idx) > 0:
        chosen = int(top_idx[0])

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

    import xgboost as xgb_mod
    booster = b['xgb_real'].get_booster()
    dmat = xgb_mod.DMatrix(X_test, missing=np.nan)
    out['residuals_at_iteration'] = {}
    n_rounds = booster.num_boosted_rounds()
    # Pick 5 iterations spread across the actual training range for a smooth animation
    iters = sorted({1, max(2, n_rounds // 8), max(3, n_rounds // 4), max(5, n_rounds // 2), n_rounds})
    for n_iter in iters:
        if n_iter < 1 or n_iter > n_rounds: continue
        raw = booster.predict(dmat, iteration_range=(0, n_iter), output_margin=True)
        proba_step = 1 / (1 + np.exp(-raw))
        residus = y_test - proba_step
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
