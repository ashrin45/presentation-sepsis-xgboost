# Recherche de données réelles, sepsis NFS

*Date de la recherche : 2026-06-01. Présentation visée dans 1 à 3 jours.*

## Verdict en une ligne

**Faisable dans 1 à 3 jours**, mais uniquement via deux sources ouvertes et téléchargeables sans credentialing : (1) **PhysioNet Challenge 2019** (CC BY 4.0, compte PhysioNet simple suffisant, NFS partielle + label Sepsis-3) et (2) **sbcdata** sur Zenodo (CC BY 4.0, téléchargement direct sans compte, NFS complète + label sepsis ICD-10, ~528 000 patients de Leipzig/Greifswald). MIMIC-IV et eICU sont **hors timeline** (credentialing PhysioNet : plusieurs jours à 45 jours selon la file d'attente).

---

## Option 1, MIMIC-IV via PhysioNet

### Accès, étapes concrètes
Processus à 3 étapes (depuis 2024, cf. [PhysioNet news #395](https://physionet.org/news/post/395/)) :
1. **Credentialing** : créer un compte PhysioNet, soumettre identité + référence professionnelle (page « Credentialing » du profil).
2. **Training CITI** : suivre le cours CITI Program *« Data or Specimens Only Research »* (affiliation *Massachusetts Institute of Technology Affiliates*), puis téléverser le rapport sur la page « Training ». Durée typique du cours CITI : **4 à 8 heures** (plusieurs modules : Belmont Report, Federal Regulations, Privacy & Confidentiality, etc.). Cf. [PhysioNet CITI Course Instructions](https://physionet.org/about/citi-course/).
3. **Data Use Agreement (DUA)** : signer le DUA sur la page « Files » du projet MIMIC-IV.

### Délai estimé, honnêtement
- Cours CITI : 1 jour (si on s'y consacre).
- **Revue manuelle de la demande de credentialing par PhysioNet** : « plusieurs jours ouvrés », mais en pratique **5 à 14 jours**, et **jusqu'à 45 jours** en 2022 lors de surcharge, et délais *« significatifs »* annoncés par PhysioNet en juin 2024 pour raisons de staffing. Sources : [FAQs PhysioNet](https://physionet.org/about/faqs/) ; [News 2024 delays](https://physionet.org/news/post/2024-delay-expected-credentialing/) ; [News 2022 delays](https://physionet.org/news/2022/).
- Téléchargement (≈ 30–80 Go pour MIMIC-IV v3.x) + extraction cohorte : 1–2 jours.

**Total cold start → dataframe d'analyse : 7 à 20 jours, médiane probable ~10 jours.**

### Tables et item codes utiles
- **`labevents`** (module `hosp`), à joindre avec `d_labitems` pour les libellés. Itemids NFS confirmés ([Nature Sci. Data MIMIC-IV](https://www.nature.com/articles/s41597-022-01899-x), Medium derivation example, PMC sepsis-MIMIC papers) :
  - Hémoglobine : `51222`
  - Plaquettes : `51265`
  - Leucocytes (WBC) : `51301`
  - Neutrophiles (count) : `51256`
  - Pour lymphocytes, éosinophiles, monocytes, RDW, MPV : itemids existent mais ne sont pas tous documentés publiquement de façon fiable ; il faut faire une jointure `d_labitems` sur `label LIKE` après accès. **Honnêtement, je ne peux pas confirmer les valeurs exactes ici sans accès à `d_labitems`.**
- **`microbiologyevents`** (module `hosp`) : filtrer `spec_type_desc IN ('BLOOD CULTURE', 'BLOOD CULTURE - NEONATE', ...)`. Positivité = lignes où `org_name IS NOT NULL`. Hiérarchie spécimen → organisme → isolat → antibiotique, cf. [doc microbiologyevents](https://github.com/MIT-LCP/mimic-iv-website/blob/master/content/hosp/microbiologyevents.md).

### Verdict pour notre timeline
**NON** pour 1 à 3 jours. À écarter pour cette présentation. Réservable pour un projet ultérieur.

---

## Option 2, PhysioNet Challenge 2019 (Early Prediction of Sepsis)

### Accès
- **Pas de credentialing.** Seulement un compte PhysioNet (création immédiate) + acceptation de la licence. Page produit : [physionet.org/content/challenge-2019/1.0.0/](https://physionet.org/content/challenge-2019/1.0.0/).
- Téléchargement direct via `wget` ou AWS S3 ouvert :
  - `wget -r -N -c -np https://physionet.org/files/challenge-2019/1.0.0/`
  - `s3://physionet-open/challenge-2019/1.0.0/` (bucket public)
- Licence : **Creative Commons Attribution 4.0 International**.

### Variables disponibles
Format : un fichier `.psv` (pipe-separated) par patient. Colonnes confirmées ([page PhysioNet du challenge](https://physionet.org/content/challenge-2019/1.0.0/), [PMC6964870](https://pmc.ncbi.nlm.nih.gov/articles/PMC6964870/)) :
- Vitaux : `HR, O2Sat, Temp, SBP, MAP, DBP, Resp, EtCO2`
- Biochimie/gaz : `BaseExcess, HCO3, FiO2, pH, PaCO2, SaO2, AST, BUN, Alkalinephos, Calcium, Chloride, Creatinine, Bilirubin_direct, Glucose, Lactate, Magnesium, Phosphate, Potassium, Bilirubin_total, TroponinI`
- **NFS partielle** : `Hct, Hgb, PTT, WBC, Fibrinogen, Platelets`
- Démographie + admin : `Age, Gender, Unit1, Unit2, HospAdmTime, ICULOS`
- **Cible** : `SepsisLabel` (1 si `t ≥ t_sepsis − 6h`, 0 sinon ; sepsis défini selon Sepsis-3 = SOFA ≥ 2 + suspicion d'infection, opérationnalisée par **hémoculture ou antibiotique IV prescrit** dans une fenêtre temporelle).

- **40 336 patients** au total (training set A : 20 336 ; set B : 20 000), données issues de 2 hôpitaux US (Beth Israel et Emory).

### Limites pour notre cas d'usage
- **Pas de WBC differential** (pas de neutrophiles/lymphocytes/monocytes/éosinophiles séparés). La NFS est limitée à WBC, Hct, Hgb, Platelets.
- **Pas de résultat d'hémoculture brut**. La cible est `SepsisLabel`, pas « hémoculture positive ». L'hémoculture est utilisée *en amont* dans la définition Sepsis-3 (« suspicion d'infection ») mais n'est pas exposée comme variable.
- Format long (1 ligne = 1 heure de séjour), beaucoup de NaN, requiert un peu de prétraitement.

### Verdict
**OUI, faisable en 1 jour.** Compromis acceptable si on accepte que le label est *« sepsis Sepsis-3 »* plutôt que *« hémoculture positive »*, et que la NFS est partielle (4 paramètres). Pédagogiquement défendable, c'est la référence du domaine.

---

## Option 3, eICU Collaborative Research Database

### Accès
Mêmes étapes que MIMIC-IV (CITI training + credentialing PhysioNet + DUA). Cf. [eicu-crd.mit.edu/gettingstarted/access/](https://eicu-crd.mit.edu/gettingstarted/access/) et [physionet.org/content/eicu-crd/2.0/](https://physionet.org/content/eicu-crd/2.0/).

### Verdict
**NON pour 1 à 3 jours.** Même barrière de credentialing que MIMIC. À écarter.

---

## Option 4, dérivés publics (Kaggle, GitHub, Zenodo)

### Candidats trouvés

1. **sbcdata (Steinbach et al. 2024)** — **LE candidat le plus solide pour cette présentation.**
   - DOI : [10.5281/zenodo.10781419](https://doi.org/10.5281/zenodo.10781419)
   - Téléchargement direct : `https://zenodo.org/api/records/10781419/files/ampel-leipzig/sbcdata-1.0.1.zip/content` (47,1 Mo zippé, 2,7 Go décompressé).
   - GitHub : [github.com/ampel-leipzig/sbcdata](https://github.com/ampel-leipzig/sbcdata)
   - Licence : **CC BY 4.0**. Aucun credentialing. Aucun compte requis.
   - Contenu : ~528 000 patients (1 488 cas sepsis + 527 038 contrôles dans la cohorte d'entraînement UMLT de Leipzig ; cohorte de validation UMG Greifswald séparée). 7 variables principales : `âge, sexe, hémoglobine, plaquettes, MCV, RBC, WBC`. Label sepsis basé sur codes **ICD-10**.
   - Format : package R, mais le zip contient des fichiers de données qu'on peut lire en Python via `pyreadr` (lit les `.rda`/`.rds`).
   - Bonus : **fournit une fonction de conversion MIMIC-IV → format sbcdata**, parfait pour la slide « pipeline portable ».
   - Article : [Steinbach et al., Clin. Chem. 2024](https://academic.oup.com/clinchem/article/70/3/506/7618099).
   - Limite honnête : le label est *sepsis ICD-10*, **pas hémoculture positive**. Mais c'est la situation aussi sur la plupart des bases. Et la NFS différentielle (neutro/lympho) n'y est pas non plus, seul WBC total.

2. **Kaggle « MIMIC-IV Style ICU Dataset for Sepsis Prediction »** ([kaggle.com/datasets/sinanshereef/...](https://www.kaggle.com/datasets/sinanshereef/mimic-iv-style-icu-dataset-for-sepsis-prediction))
   - Statut peu clair (« style » MIMIC-IV peut signifier synthétique ou dérivé). À vérifier sur la page, mais probablement **non éligible si on veut une caution scientifique** (provenance ambiguë).

3. **Kaggle « Hematology Complete Blood Count Dataset MIMIC-III »** ([kaggle.com/datasets/ashlingovindasamy/...](https://www.kaggle.com/datasets/ashlingovindasamy/hematology-complete-blood-count-dataset-mimic-iii))
   - Probable extraction NFS depuis MIMIC-III. **Attention** : la redistribution de MIMIC est interdite par la DUA. Si cette dataset existe vraiment, elle viole probablement la licence MIMIC. **À éviter pour une présentation académique au CNAM.**

4. **Kaggle « Sepsis fictitious data »** ([kaggle.com/datasets/dscarpetta/sepsis-fictitious-data](https://www.kaggle.com/datasets/dscarpetta/sepsis-fictitious-data))
   - Données **fictives** d'après le titre. Non éligible pour un message « données réelles ».

5. **GitHub `EarlGlynn/PhysioNet-Sepsis-Challenge`** ([github.com/EarlGlynn/PhysioNet-Sepsis-Challenge](https://github.com/EarlGlynn/PhysioNet-Sepsis-Challenge))
   - Pipeline d'analyse du Challenge 2019, pas une nouvelle source de données. Utile comme exemple de code.

### Verdict Option 4
**OUI grâce à sbcdata.** C'est la voie royale pour 1 à 3 jours : téléchargement direct, licence CC BY 4.0, NFS + label sepsis, ~528 000 patients, et le package fournit même la passerelle MIMIC-IV.

---

## Option 5, datasets d'articles

1. **Steinbach et al. 2024**, *Clin. Chem.* 70(3):506–515. *« Applying Machine Learning to Blood Count Data Predicts Sepsis with ICU Admission »*. [DOI](https://academic.oup.com/clinchem/article/70/3/506/7618099). **Dataset = sbcdata ci-dessus.** Modèle de référence le plus pertinent pour la thèse de la présentation (NFS seule → prédire sepsis, AUROC 0,872).

2. **UCI ML Repository — Sepsis Survival Minimal Clinical Records** ([archive.ics.uci.edu/dataset/827/](https://archive.ics.uci.edu/dataset/827/sepsis+survival+minimal+clinical+records))
   - 110 204 admissions, Norvège 2011–2012. **Mais : variables minimales** (age, sex, episode number, days alive). **Pas de NFS.** Non éligible pour notre angle CBC.

3. **Reyna et al. 2020**, *Crit. Care Med.* (papier du Challenge 2019). [PMC6964870](https://pmc.ncbi.nlm.nih.gov/articles/PMC6964870/). Dataset déjà couvert en Option 2.

4. **Figshare** (réplication de papiers « culture-free detection ») : codes plutôt que données patient utilisables. Non éligible.

### Verdict Option 5
La seule source réellement utile d'un article publié récemment et téléchargeable sans friction est **sbcdata (Steinbach 2024)**, déjà listée.

---

## Recommandation

**Utiliser sbcdata (Zenodo) comme jeu de données réelles principal, et garder PhysioNet Challenge 2019 comme jeu de validation externe ou alternative.**

Plan d'exécution sur 1 à 3 jours :

1. **Jour 1 matin (≤ 1 h)** : télécharger le zip Zenodo (`curl -L "https://zenodo.org/api/records/10781419/files/ampel-leipzig/sbcdata-1.0.1.zip/content" -o sbcdata.zip`). Décompresser. Repérer les fichiers `.rda` dans `data/`.
2. **Jour 1 après-midi (2–3 h)** : charger en Python via `pyreadr.read_r("sepsis.rda")` ou installer R + extraire en CSV (`saveRDS` → `write.csv`). Inspecter colonnes (`age, sex, HGB, MCV, PLT, RBC, WBC`, `Label`, `Diagnosis`, `Center`, `Set`).
3. **Jour 2** : reproduire un mini-pipeline XGBoost identique au storyboard de la présentation, sur sbcdata. Comparer l'AUROC obtenu à celui de Steinbach (0,872) comme sanity check.
4. **Jour 3** : préparer 1 slide « données réelles » + 1 slide « limites et écart au cas idéal (label ICD-10 ≠ hémoculture positive ; WBC total seul, pas de différentielle) ».

Si sbcdata pose un problème inattendu (format `.rda` qu'on ne parvient pas à charger en Python), bascule de secours : **Challenge 2019**, téléchargeable directement, NFS partielle mais label Sepsis-3 propre. Plan B exécutable en < 4 h.

**À éviter pour cette présentation** : MIMIC-IV, eICU (credentialing hors timeline), datasets Kaggle de provenance ambiguë ou potentiellement en violation de la DUA MIMIC.

---

## Note pour la slide d'ajout éventuelle

Formulation suggérée pour une slide additionnelle :

> ### Le pipeline est portable, voici comment le rejouer sur données réelles
>
> **Source : sbcdata, Steinbach et al. 2024** (Zenodo DOI : 10.5281/zenodo.10781419, CC BY 4.0).
> - 528 000 patients adultes, hôpitaux universitaires de Leipzig et Greifswald, 2014–2021.
> - NFS minimale : Hb, plaquettes, MCV, RBC, WBC ; + âge et sexe.
> - Label : sepsis (codes ICD-10), 1 488 cas dans la cohorte d'entraînement.
> - Téléchargement direct, **pas de credentialing**.
>
> **Ajustements à prévoir par rapport à notre démo :**
> 1. **Label** : ici sepsis ICD-10, pas hémoculture positive. Si on veut un label « hémoculture+ », il faut MIMIC-IV (`microbiologyevents.spec_type_desc = 'BLOOD CULTURE'` + `org_name IS NOT NULL`) — qui demande un credentialing CITI/PhysioNet de 5 à 14 jours.
> 2. **NFS** : pas de différentielle leucocytaire (neutro/lympho/mono/éosino) dans sbcdata. Pour cela, MIMIC-IV `labevents` avec itemids 51301 (WBC), 51256 (neutro), 51265 (plt), 51222 (Hb), etc.
> 3. **Granularité temporelle** : sbcdata est par prélèvement, pas par heure ; pour un format horaire (style Challenge 2019), prévoir une étape de forward-fill.
> 4. **Validation externe** : PhysioNet Challenge 2019 (40 336 patients, Sepsis-3, US, CC BY 4.0, sans credentialing) reste le benchmark standard.

---

## Sources

- [PhysioNet FAQs](https://physionet.org/about/faqs/)
- [PhysioNet CITI Course Instructions](https://physionet.org/about/citi-course/)
- [PhysioNet news, three-step credentialing](https://physionet.org/news/post/395/)
- [PhysioNet news, credentialing delays 2024](https://physionet.org/news/post/2024-delay-expected-credentialing/)
- [PhysioNet news, 2022 delays](https://physionet.org/news/2022/)
- [MIMIC-IV v3.1 PhysioNet](https://physionet.org/content/mimiciv/3.1/)
- [MIMIC-IV Nature Scientific Data paper](https://www.nature.com/articles/s41597-022-01899-x)
- [MIMIC microbiologyevents doc](https://github.com/MIT-LCP/mimic-iv-website/blob/master/content/hosp/microbiologyevents.md)
- [PhysioNet Challenge 2019 dataset](https://physionet.org/content/challenge-2019/1.0.0/)
- [Reyna et al. Challenge 2019 paper, PMC6964870](https://pmc.ncbi.nlm.nih.gov/articles/PMC6964870/)
- [eICU CRD on PhysioNet](https://physionet.org/content/eicu-crd/2.0/)
- [eICU access instructions](https://eicu-crd.mit.edu/gettingstarted/access/)
- [Steinbach et al. 2024, Clin. Chem.](https://academic.oup.com/clinchem/article/70/3/506/7618099)
- [sbcdata Zenodo record](https://zenodo.org/records/10781419)
- [sbcdata GitHub repo](https://github.com/ampel-leipzig/sbcdata)
- [UCI Sepsis Survival dataset](https://archive.ics.uci.edu/dataset/827/sepsis+survival+minimal+clinical+records)
- [Kaggle MIMIC-IV style ICU sepsis](https://www.kaggle.com/datasets/sinanshereef/mimic-iv-style-icu-dataset-for-sepsis-prediction)
- [Kaggle Hematology CBC MIMIC-III](https://www.kaggle.com/datasets/ashlingovindasamy/hematology-complete-blood-count-dataset-mimic-iii) (statut DUA douteux)
