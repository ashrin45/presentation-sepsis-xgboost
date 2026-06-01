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
N = 20000
PREVALENCE_GLOBALE_CIBLE = 0.065

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
    if leuco_GL < 4:   return 10.0
    if leuco_GL < 8:   return 0.2
    if leuco_GL < 12:  return 1.0
    return 12.0


def generer(n=N, seed=SEED):
    rng = np.random.default_rng(seed)

    modes_l = list(PROPORTIONS_MODES.keys())
    modes_p = list(PROPORTIONS_MODES.values())
    mode = rng.choice(modes_l, size=n, p=modes_p)

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

    risque = np.ones(n)

    for m, prev_voulue in PREVALENCE_PAR_MODE.items():
        risque[mode == m] *= prev_voulue / PREVALENCE_GLOBALE_CIBLE

    risque *= np.array([risque_leucocytes(l) for l in leuco])

    risque *= 1 + 6.0 * (nlr > 8)
    risque *= 1 + 5.0 * (lympho < 0.5)
    risque *= 1 + 3.0 * (eos < 0.02)
    risque *= 1 + 7.0 * granul_immatures_presents

    risque /= risque.mean() / PREVALENCE_GLOBALE_CIBLE
    risque = np.clip(risque, 0.001, 0.99)

    y = (rng.uniform(0, 1, size=n) < risque).astype(int)

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
