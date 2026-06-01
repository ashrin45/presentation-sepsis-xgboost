# Storyboard, présentation « Détecter un sepsis avec une NFS »

**Date :** 2026-06-01
**Auteur :** ashrin45
**Statut :** spec validée, en attente d'implémentation
**Livrable :** présentation HTML (slide-deck navigable) standalone, à présenter à l'oral

---

## 1. Contexte et objectifs

### 1.1 Mission

Présentation orale de ~12 minutes dans le cadre d'une chaîne de présentations pédagogiques (collègue 1 : régression logistique, collègue 2 : random forest, **ce slot : XGBoost + SHAP**, sur des cas différents pour chaque intervenant).

### 1.2 Public

Étudiants et enseignants d'un cursus IA en santé. L'enseignante (Mounia) est biostatisticienne et **note le discernement critique**, pas la capacité à faire tourner XGBoost.

### 1.3 Cas clinique propre

Prédire qu'une hémoculture reviendra positive (bactériémie) à partir d'une numération formule sanguine, sur une cohorte simulée de ~2 500 patients hospitalisés avec suspicion de bactériémie, prévalence 6,5 % d'hémocultures positives.

### 1.4 Mission pédagogique double

1. **Expliquer la théorie XGBoost** (bagging vs boosting, gradient, hyperparamètres, manquants natifs, `scale_pos_weight`)
2. **Démontrer un discernement critique** en rejouant explicitement les 5 questions clés de Mounia sur le cas sepsis :
   - Déséquilibre des classes : stratégie consciente
   - Variable sociale : `mode de prise en charge` comme proxy révélé par SHAP
   - Choix de la métrique : décision clinique, pas technique
   - Rôle de SHAP : explique, ne corrige ni n'équilibre
   - Performance vs équité : arbitrage clinique final

### 1.5 Ton et grille

Grille **Why / When / How** comme colonne vertébrale (demande explicite de Mounia : *pourquoi cette méthode, dans quel contexte, comment l'appliquer et l'interpréter*).

---

## 2. Décisions transverses

### 2.1 Format

Slide-deck HTML navigable (← → au clavier), une slide par concept, 16:9, plein écran possible. Pas de scrollytelling.

### 2.2 Style visuel (Direction B, « Clinique blanc, teal »)

- Fond principal : `#FAFAFA`
- Texte principal : `#0F172A` / `#1F2937`
- Texte secondaire : `#6B7280`
- Accent principal : teal `#0D9488`
- Accent secondaire (avertissements, callouts) : rouge brique `#D14545` (clin d'œil au style éditorial du cours sans en reprendre la palette beige)
- Typographies : **Inter** (corps, titres, UI), **JetBrains Mono** (chiffres, code, métadonnées)
- Pas de Newsreader / serif (réservé au cours, pas à la présentation)
- Espacement généreux, hiérarchie claire, beaucoup d'air

### 2.3 Conventions d'écriture (impératives)

- **Jamais de tiret cadratin** (`—`) dans le texte des slides. Remplacer par virgule, deux-points, parenthèses, point ou retour à la ligne.
- **Pas de mention administrative** (Cnam, Certificat, DU) dans les éléments visibles.
- **Définir chaque terme technique à son premier usage** en demi-phrase inline. Exemples : « recall (sensibilité, part des vrais positifs détectés) », « AUC-PR (aire sous la courbe précision-rappel) ».
- **Pas d'iframe** pour intégrer des animations existantes. Extraire le composant (HTML + JS d'init) et l'inliner dans la slide.

### 2.4 Stratégie de réutilisation des animations

Les animations vivantes sont extraites depuis `C:/Users/33698/Documents/1_Deeplearning/ml/modules/{09-random-forest, 10-xgboost, 11-shap}/` :
- Identifier le `<div id="...">` cible dans l'`index.html` du module
- Extraire la fonction d'initialisation dans `script.js`
- Inliner dans une slide du deck (assets/js/animations/<nom>.js)
- Réécrire les styles pour qu'ils s'intègrent au thème B (blanc/teal) au lieu du thème inkdrop beige

Animations à créer (pas dans les modules existants) :
- Curseur de seuil + ROC + PR + matrice de confusion (S2b, réutilisé en S4b)
- Schéma SVG des 3 obstacles (S1b)
- Schéma SVG d'un nœud avec NaN par défaut (S3d)
- Bandeau historique : barres animées Recall RL → RF → XGB (S4a)

### 2.5 Emplacement

Tout le livrable vit dans :
```
C:/Users/33698/Documents/1_CNAM/presentation_sepsis_xgboost/
├── storyboard.md          (ce fichier)
├── index.html             (le deck)
├── assets/
│   ├── css/deck.css
│   ├── js/
│   │   ├── deck-navigation.js
│   │   ├── animations/    (une animation = un fichier)
│   │   └── data/          (JSON exportés depuis le notebook)
│   └── fonts/             (si fonts hébergées localement, sinon Google Fonts)
└── data-pipeline/
    ├── generate_data.py
    ├── train_models.py
    ├── export_for_deck.py
    └── README.md
```

Pas versionné dans le repo `Deeplearning`, livraison standalone.

### 2.6 Pipeline data

Un notebook Python (`data-pipeline/`) en amont produit :
- Un dataset simulé (~2 500 lignes, 11 variables NFS + `mode_prise_en_charge` calibrée comme proxy réel, 6,5 % de positifs, manquants réalistes sur VPM/RDW principalement)
- L'entraînement de 4 modèles : RL 50/50, RL réel, RF réel, XGBoost réel
- Un export JSON consommé par le deck, contenant :
  - Métriques de chaque modèle (Acc, Recall, Precision, AUC-ROC, AUC-PR)
  - Vecteurs ROC et PR pré-calculés pour XGBoost (pour le curseur de seuil de S2b/S4b)
  - Résidus à l'étape 10 / 50 / 100 du boosting XGBoost (pour S3b)
  - SHAP : top 8 features importance globale, dependence plot leucocytes, waterfall d'un patient à risque > 99 %

Les chiffres SHAP du waterfall (S5c) sont **réalistes mais illustratifs** : on les fige à des valeurs plausibles, recalculés sur le dataset simulé final.

### 2.7 Calibration du proxy « mode de prise en charge »

Dans la simulation, `mode_prise_en_charge` prend 3 valeurs : `Hospitalisé` / `Domicile` / `Soins de suite`. La prévalence de bactériémie est calibrée :
- Hospitalisé : ~8,5 %
- Domicile : ~3,5 %
- Soins de suite : ~5,5 %

Cela rend la variable **réellement prédictive** pour SHAP, et la révélation de S5c devient authentique. La discussion éthique reste valide précisément parce que la variable « marche » sans pour autant être une cause biologique.

---

## 3. Storyboard slide par slide

### Conventions de notation

- **Titre** : le titre affiché en haut de slide
- **Phrase clé haut** : la phrase qui donne le message en 1 ligne, sous le titre
- **Contenu** : layout et matière de la slide
- **Phrase clé bas** : la conclusion de la slide, ce qu'on veut que le public retienne
- **Animation** : nature, source (à extraire / à créer), position
- **Transition** : la phrase orale qui amène à la slide suivante

---

### S0, Ouverture (30 s)

- **Titre :** Détecter un sepsis avec une numération formule sanguine.
- **Sous-titre :** Cas clinique appliqué à XGBoost et SHAP.
- **Question d'accroche centrale :** *Une NFS ordinaire, 11 paramètres, quelques euros : peut-elle anticiper qu'une hémoculture reviendra positive ?*
- **Trois metadata en pied :**
  - Données : simulées, ~2 500 épisodes
  - Cohorte : 6,5 % d'hémocultures positives chez les patients hospitalisés avec suspicion de bactériémie
  - Variables : 11 NFS + mode de prise en charge
- **Citation Mounia (encadré teal) :** *« Ne pas faire d'IA à tout prix. »* Le vrai sujet : savoir critiquer XGBoost, pas démontrer qu'il marche.
- **Roadmap (bas droite) :** WHY / WHEN / HOW théorie / HOW cas / HOW interpréter et critiquer
- **Animation :** aucune.
- **Transition :** Avant la théorie, une question simple : pourquoi XGBoost ici ?

---

### S1a, WHY 1/2 : Le plafond des modèles simples sur ce cas (45 s)

- **Titre :** Pourquoi XGBoost ici, le plafond de la chaîne « RL → RF ».
- **Phrase clé haut :** Sur le sepsis, la chaîne RL puis RF bute toujours sur le même mur, un recall qui plafonne à 0,43.
- **Encadré définitions (haut, gris, lu une fois pour toute la suite) :**
  - **Accuracy** : taux global de prédictions correctes.
  - **Recall** (sensibilité) : part des vrais positifs détectés, `VP / (VP + FN)`. Le chiffre à regarder quand rater un cas est plus grave que paniquer pour rien.
  - **AUC-PR** : aire sous la courbe précision-rappel, métrique adaptée aux cibles rares.
- **Mini-tableau central :**
  | Modèle | Accuracy | Recall | AUC-PR |
  |---|---|---|---|
  | RL, classes équilibrées 50/50 | 0,84 | 0,72 | élevée |
  | RL, vraie prévalence 6,5 % | **0,96** | **0,43** | 0,40 |
  | RF, vraie prévalence | 0,95 | **0,43** | 0,65 |
- **Encadré rouge brique à droite :** Le piège accuracy, un classifieur qui prédit « négatif » à tout le monde atteint déjà **0,93** d'accuracy. L'accuracy ment quand la cible est rare.
- **Animation :** mini-visuel de la relation en U des leucocytes, à extraire du module 09 random forest. Tiers de slide.
- **Phrase clé bas :** D'où vient ce mur ? De trois obstacles concrets qu'aucun des deux modèles ne lève entièrement.
- **Transition :** Voyons ces trois obstacles, et ce que XGBoost répond à chacun.

---

### S1b, WHY 2/2 : Les trois obstacles qui appellent XGBoost (45 s)

- **Titre :** Trois obstacles cliniques, trois besoins méthodologiques.
- **Layout :** trois panneaux côte à côte, chacun = obstacle + mini-viz + réponse XGBoost.

  | Panneau | Obstacle clinique | Mini-viz | Réponse XGBoost |
  |---|---|---|---|
  | 1 | Déséquilibre 6,5 % | barre 93,5 / 6,5 | `scale_pos_weight ≈ 13` |
  | 2 | Non-linéarités + interactions (U leucocytes) | courbe en U des leucocytes | arbres séquentiels |
  | 3 | Manquants systémiques NFS | matrice avec trous | direction par défaut native |

- **Phrase clé bas :** RL : aucun des trois levé. RF : un et demi. XGBoost : les trois. C'est ce qui justifie de « sortir le bazooka » ici, pas ailleurs.
- **Animation :** trois mini-viz SVG à créer (apparition séquentielle au passage de slide, ~200 ms entre panneaux).
- **Transition :** Sortir le bazooka n'est pas un automatisme. Quand est-ce vraiment adapté ? Et quelle métrique on regarde ?

---

### S2a, WHEN 1/2 : Quand sortir XGBoost, quand s'abstenir (45 s)

- **Titre :** Quand sortir XGBoost, quand s'abstenir.
- **Phrase clé haut :** XGBoost n'est pas une réponse par défaut, c'est une réponse à un profil de problème précis.
- **Tableau central deux colonnes :**

  | XGBoost est adapté quand... | XGBoost n'est PAS le bon choix quand... |
  |---|---|
  | Données tabulaires (lignes × colonnes) | Images, texte, audio (deep learning) |
  | Relations non linéaires, interactions | Relations linéaires propres (RL suffit) |
  | Données manquantes structurelles | Dataset très propre et complet |
  | Classes déséquilibrées | Besoin d'interprétabilité forte et simple |
  | Taille moyenne (10³ à 10⁶) | Très petits jeux (< 300 obs), risque de surapprentissage |
  | Pas d'a priori sur la forme des relations | Visée d'inférence causale, pas prédictive |

- **Phrase clé bas :** Le sepsis-NFS coche les 5 premières conditions. C'est ce qui justifie d'aller plus loin que RL ou RF. Et c'est ce qui m'interdit de prétendre que XGBoost est partout la bonne réponse.
- **Animation :** aucune.
- **Transition :** Avoir le bon modèle ne suffit pas. Encore faut-il regarder la bonne métrique. Et le choix de la métrique n'est pas technique.

---

### S2b, WHEN 2/2 : La métrique est un choix clinique (45 s) ⭐ ANIMATION CLÉ

- **Titre :** Le choix de la métrique n'est pas technique, il est clinique.
- **Phrase clé haut :** En sepsis, un faux négatif tue. Une fausse alerte coûte une hémoculture. Le rapport de gravité dicte la métrique.
- **Bloc gauche (50 %), définitions cliniques :**

  | Erreur | Conséquence | Coût |
  |---|---|---|
  | **Faux négatif (FN)** : modèle dit non, réalité oui | Antibiothérapie retardée, risque choc septique, mortalité | Très élevé |
  | **Faux positif (FP)** : modèle dit oui, réalité non | Hémoculture supplémentaire, antibio préemptive courte, observation | Modéré |

- **Bloc droit (50 %), définitions métriques :**
  - **Recall** = `VP / (VP + FN)`. Maximiser recall = minimiser les patients ratés.
  - **Precision** = `VP / (VP + FP)`. Maximiser precision = minimiser les fausses alertes.
  - **AUC-PR** : la métrique de synthèse adaptée aux cibles rares, préférable à AUC-ROC ici.

- **Phrase clé bas :** On pilote au recall et à l'AUC-PR. L'accuracy ne s'occupe pas du sort des patients qu'elle rate.

- **Animation à créer (clé) :** un curseur de seuil de décision, avec en temps réel :
  - matrice de confusion sur cohorte simulée 6,5 % qui se met à jour
  - courbe ROC tracée, point opérationnel qui glisse
  - courbe PR tracée, même point opérationnel
  - valeurs Recall / Precision / Accuracy en gros caractères qui bougent
  - On déplace le curseur de 0,5 à 0,3, on voit accuracy chuter pendant que recall monte.
- **Réutilisation :** la même animation revient en S4b.
- **Transition :** OK, le sepsis appelle XGBoost et il faut piloter au recall. Comment XGBoost fait-il, concrètement ?

---

### S3a, HOW théorie 1/5 : Bagging et boosting (50 s)

- **Titre :** Bagging et boosting, deux philosophies opposées d'agrégation.
- **Phrase clé haut :** Le boosting ne moyenne pas des avis indépendants, il construit une chaîne d'arbres où chacun corrige le précédent.
- **Deux colonnes côte à côte :**

  **Bagging (Random Forest)**
  - Bootstrap indépendants (échantillonnage avec remise)
  - Sous-échantillonnage aléatoire des variables à chaque split
  - Arbres entraînés en parallèle
  - Prédiction : vote majoritaire ou moyenne
  - Effet : réduit la **variance**
  - Image : comité d'experts indépendants qui votent

  **Boosting (XGBoost)**
  - Arbres entraînés en série
  - Chaque arbre se concentre sur les erreurs du précédent
  - Prédiction : somme pondérée des arbres
  - Effet : réduit le **biais**
  - Image : élèves successifs qui corrigent les copies de leurs prédécesseurs

- **Phrase clé bas :** Sur le sepsis, le bagging plafonne à recall 0,43 parce qu'aucun arbre individuel ne sait quoi faire des cas rares mal classés. Le boosting force la chaîne à se concentrer dessus.
- **Animation :** `bagging-boosting-schema` du module 10 XGBoost (à extraire).
- **Transition :** Comment un nouvel arbre se « concentre » sur ce qui a été raté ? En apprenant les résidus.

---

### S3b, HOW théorie 2/5 : Apprendre les résidus (50 s)

- **Titre :** Le gradient boosting apprend la suite des résidus.
- **Phrase clé haut :** Chaque arbre ne réapprend pas le problème. Il apprend juste ce que le précédent n'a pas su faire.
- **Définition inline :** Résidu = écart entre vérité et prédiction courante. Pour une classification binaire, `r_i = y_i − σ(F_m(x_i))` où σ est la sigmoïde.
- **Formule cadrée centrale :** `F_{m+1}(x) = F_m(x) + η · h_{m+1}(x)` avec `h_{m+1}` entraîné à prédire `−∂L/∂F` (gradient négatif de la fonction de perte).
- **Visuel temporel central (à créer en SVG simple, **valeurs calculées sur le dataset simulé**) :**
  - Étape 0 : prédiction = moyenne, résidus très grands sur les positifs
  - Étape 10 : arbres ont absorbé l'essentiel des cas faciles, résidus restants = patients atypiques
  - Étape 100 : convergence, arbres ajoutés en dernier microscopiques
- **Phrase clé bas :** Friedman 1999 a montré que c'est équivalent à une descente de gradient dans l'espace des fonctions. D'où le nom : gradient boosting.
- **Animation :** `residuals-chart` ou démo `Live boost` du module 10 (à extraire).
- **Transition :** Cette discipline coûte cher, à chaque itération on peut surapprendre. Trois garde-fous existent pour ça.

---

### S3c, HOW théorie 3/5 : Les trois garde-fous (50 s)

- **Titre :** Learning rate, régularisation, early stopping, la discipline du boosting.
- **Phrase clé haut :** Sans discipline, le boosting peut tout retenir, bruit inclus. Trois leviers tracent la limite.
- **Layout :** trois cartes empilées verticalement (3 lignes), pas côte à côte (lisibilité).

  **Carte 1, Learning rate η**
  - Facteur multiplicatif appliqué à chaque nouvel arbre quand il est ajouté à la somme.
  - Plage : 0,01 (lent et robuste) à 0,3 (rapide et instable).
  - Petit η + beaucoup d'arbres = plus robuste qu'un grand η + peu d'arbres.
  - Sepsis : **η = 0,05**

  **Carte 2, Régularisation L1 (α) et L2 (λ) sur les feuilles**
  - L1 pénalise la magnitude, pousse certains poids à zéro (feuilles muettes).
  - L2 pénalise le carré, évite les feuilles à valeurs extrêmes.
  - Limite la sur-confiance d'un arbre individuel.
  - Sepsis : **λ = 1, α = 0**

  **Carte 3, Early stopping**
  - Arrêter l'ajout d'arbres si la loss de validation ne progresse plus depuis N rounds.
  - Trouve le nombre optimal d'arbres sans validation croisée externe.
  - Sepsis : **`early_stopping_rounds = 30`, `max_trees = 500`**

- **Phrase clé bas :** Trois leviers indépendants qui marchent ensemble. C'est la combinaison qui tient, pas chaque pièce isolément.
- **Animation possible (légère) :** courbe d'apprentissage train vs validation, marqueur vertical au point optimal pour matérialiser l'early stopping.
- **Transition :** Reste un problème spécifique aux NFS, les valeurs manquantes. XGBoost les gère nativement.

---

### S3d, HOW théorie 4/5 : Manquants natifs (40 s)

- **Titre :** Les valeurs manquantes, XGBoost apprend où les envoyer.
- **Phrase clé haut :** Pas de moyenne, pas de médiane, pas de kNN d'imputation. À chaque nœud, le modèle apprend une direction par défaut pour les NaN.
- **Définition inline :** À chaque split, XGBoost teste les deux scénarios « NaN va à gauche » et « NaN va à droite », et garde celui qui maximise le gain d'information. La direction est mémorisée dans le nœud.
- **Visuel central (SVG schématique à créer) :**
  - Nœud : « NLR > 5 ? »
  - Branche gauche (NLR ≤ 5) : sous-arbre A
  - Branche droite (NLR > 5) : sous-arbre B
  - Marqueur jaune sur la branche droite : « NaN par défaut → »
  - Légende : à l'entraînement, XGBoost a appris que sur ce nœud, NaN ressemble plus au profil « NLR élevé ».
- **Phrase clé bas :** Pour la NFS, où VPM ou RDW manquent selon l'analyseur, c'est un avantage net. Pas d'imputation, donc pas de biais d'imputation.
- **Animation :** schéma SVG statique à créer.
- **Transition :** Dernier réglage spécifique au sepsis, la réponse paramétrique au déséquilibre.

---

### S3e, HOW théorie 5/5 : `scale_pos_weight ≈ 13` (50 s)

- **Titre :** `scale_pos_weight ≈ 13`, la réponse paramétrique au déséquilibre.
- **Phrase clé haut :** Le ratio négatifs sur positifs dans la cohorte (93,5 / 6,5 ≈ 14) devient directement le poids appliqué au gradient de la classe positive.
- **Définition inline :** `scale_pos_weight`, hyperparamètre qui multiplie le gradient (et la perte) des observations positives. Équilibre artificiel des classes pendant l'apprentissage, sans rééchantillonner.
- **Mécanique (3 puces) :**
  - Chaque erreur sur un positif compte ~13 fois plus dans la loss.
  - Le modèle voit le problème comme s'il était quasi équilibré.
  - Pas de SMOTE, pas de sous-échantillonnage destructif.
- **Vignette callback discrète vers S1b :** « On avait identifié le déséquilibre 6,5 % comme premier obstacle. Voici la réponse XGBoost. »
- **Mini-tableau de comparaison (centre) :**

  | Stratégie | Mécanisme | Inconvénient principal |
  |---|---|---|
  | Sous-échantillonnage des négatifs | jeter des observations | perd de l'information sur la classe majoritaire |
  | SMOTE | synthétiser des positifs artificiels | fragile en clinique, suspicion réglementaire |
  | Ajustement post-hoc du seuil | déplacer le seuil de décision | indépendant du modèle, à combiner |
  | **`scale_pos_weight`** | reweighting du gradient à l'apprentissage | augmente le risque de surapprentissage |

- **Phrase clé bas :** C'est UNE des stratégies, pas LA solution. Conscience requise : `scale_pos_weight` surajuste plus facilement, validation impérative.
- **Animation possible :** mini balance avec poids 1 vs 13.
- **Transition :** Théorie posée. Voyons ce que ça donne sur la cohorte sepsis simulée.

---

### S4a, HOW appliqué 1/2 : Les chiffres XGBoost (50 s)

- **Titre :** XGBoost sur la cohorte simulée, les chiffres.
- **Phrase clé haut :** Pas un saut de discrimination globale, un saut de rappel.
- **Tableau central (chiffres définitifs après le notebook) :**

  | Modèle | AUC-ROC | AUC-PR | Recall @ 0,5 | Precision @ 0,5 |
  |---|---|---|---|---|
  | RL prévalence réelle | 0,82 | 0,40 | 0,43 | 0,28 |
  | Random Forest | **0,90** | **0,65** | 0,43 | 0,55 |
  | XGBoost | 0,88 | 0,62 | **0,55** | 0,50 |

- **Encadré « lecture honnête » à droite :**
  - AUC-ROC : XGB légèrement en dessous de RF (0,88 vs 0,90).
  - AUC-PR : quasi équivalents.
  - Recall à seuil 0,5 : 0,43 → 0,55, soit 28 % de vrais positifs supplémentaires détectés à seuil égal.
- **Phrase clé bas :** Le gain XGBoost n'est pas dans la discrimination, il est dans la sensibilité à seuil égal. C'est exactement ce qu'on veut en sepsis.
- **Animation :** barres verticales animées Recall (RL → RF → XGB) qui s'élèvent au passage de slide.
- **Transition :** Et si on accepte un peu plus de fausses alertes ? On baisse le seuil.

---

### S4b, HOW appliqué 2/2 : L'arbitrage du seuil (40 s)

- **Titre :** Abaisser le seuil de 0,5 à 0,3, un arbitrage clinique.
- **Phrase clé haut :** Le seuil de décision n'est pas une donnée, c'est une décision clinique.
- **Animation principale :** réutilisation de l'animation S2b (ROC + PR + matrice de confusion + curseur), démarrage à 0,5, glisse à 0,3 en commentaire oral.
- **Mini-tableau « zoom sur l'arbitrage » (à droite de l'animation) :**

  | Seuil | Recall | Precision | Vrais positifs détectés sur 100 vrais sepsis |
  |---|---|---|---|
  | 0,50 | 0,55 | 0,50 | 55 |
  | 0,40 | 0,61 | 0,42 | 61 |
  | 0,30 | 0,65 | 0,35 | 65 |

- **Encadré question clinique (en bas, teal léger) :** Combien de fausses alertes est-on prêt à accepter pour récupérer **10 sepsis manqués supplémentaires** sur 100 vrais positifs ?
- **Phrase clé bas :** Cette décision n'est pas la mienne. C'est celle du clinicien et du service. Mais le modèle doit la rendre **visible** et **chiffrable**.
- **Transition :** On a un modèle avec un seuil clinique. Maintenant, qu'a-t-il appris ? Quels signaux a-t-il identifiés ? Et y a-t-il des signaux suspects ?

---

### S5a, SHAP 1/3 : Ce que SHAP fait, ce qu'il ne fait pas (45 s)

- **Titre :** SHAP, expliquer chaque prédiction individuellement.
- **Phrase clé haut :** SHAP ne donne pas une simple importance globale. SHAP attribue à chaque variable sa contribution à CHAQUE prédiction.
- **Définition inline :**
  - **Valeur de Shapley** (Shapley, 1953) : part équitable d'un joueur dans un gain collectif, moyennée sur tous les ordres d'arrivée possibles.
  - **Adaptée au ML** (Lundberg, Lee, 2017) : joueurs = variables, gain = prédiction, valeur SHAP `φᵢ` = contribution de la variable i à l'écart entre la prédiction de cette instance et la prédiction moyenne.
- **Identité fondamentale (formule cadrée) :** `f(x) = E[f(x)] + Σᵢ φᵢ(x)`
- **Deux cards côte à côte :**

  **Card teal, « SHAP fait » :**
  - Explique une prédiction individuelle (locale)
  - S'agrège en importance globale (moyenne des `|φᵢ|`)
  - Détecte des dépendances suspectes
  - Permet d'auditer un modèle après coup

  **Card rouge brique, « SHAP NE fait PAS » :**
  - N'améliore PAS la prédiction
  - N'équilibre PAS les classes (c'est `scale_pos_weight` ou rééchantillonnage)
  - Ne fait PAS d'inférence causale
  - Ne corrige PAS un biais, il le **révèle**

- **Phrase clé bas :** SHAP est un microscope, pas un correcteur. Il dit ce que le modèle a appris, pas si c'est juste.
- **Animation :** vignette Shapley en 30 s du module 11 (à extraire), petite, en bas à droite.
- **Transition :** Voyons d'abord ce que XGBoost a appris globalement sur le sepsis.

---

### S5b, SHAP 2/3 : Beeswarm et dependence (le U revient) (45 s)

- **Titre :** Le modèle redécouvre la sémiologie infectieuse, et le U se reconfirme.
- **Phrase clé haut :** Beeswarm, chaque point est un patient, chaque ligne une variable, la couleur encode la valeur. La position horizontale = contribution SHAP.
- **Deux blocs côte à côte :**

  **Bloc gauche, beeswarm global (animation module 11 à extraire) :**
  Variables triées par importance décroissante : NLR, lymphocytes, granuleux immatures (myélémie), éosinophiles, PNN, leucocytes, plaquettes, etc.

  Lecture sous le beeswarm :
  - NLR élevé, lymphopénie, éosinopénie, myélémie : tous poussent vers « bactériémie »
  - Cohérent avec la physiopathologie infectieuse
  - Le modèle « redécouvre » la sémiologie de la NFS infectieuse

  **Bloc droit, dependence plot leucocytes (animation module 11 à extraire) :**
  - Axe X : valeur leucocytes (G/L)
  - Axe Y : contribution SHAP
  - Forme attendue : **U** (contribution positive aux deux extrêmes)

  Vignette callback vers S1a/S1b : Le U observé ici est exactement celui identifié dans les données brutes en WHY. XGBoost l'a bien appris.

- **Phrase clé bas :** Le modèle redécouvre la clinique. Bon signe, mais pas suffisant pour le valider.
- **Transition :** Et si on regardait UN patient en particulier ?

---

### S5c, SHAP 3/3 : Waterfall et l'intrus (50 s)

- **Titre :** Waterfall d'un patient à risque 99 %, NLR, lymphopénie, et un intrus.
- **Phrase clé haut :** Le modèle attribue 99 % de probabilité à ce patient. Décomposons la prédiction variable par variable.
- **Bloc gauche, waterfall (animation module 11 à extraire et adapter) :**

  | Contribution | Variable | Valeur | SHAP (logits) |
  |---|---|---|---|
  | Base `E[f(x)]` | Prévalence moyenne | – | 0,06 |
  | + | NLR | 55 | +4,49 |
  | + | Lymphocytes | 0,1 G/L | +2,27 |
  | + | Granuleux immatures | présents | +1,50 |
  | + | **Mode de prise en charge** | **Hospitalisé** | **+1,20** ⚠️ |
  | + | Éosinophiles | 0 | +0,80 |
  | − | VPM | normale | −0,20 |
  | − | Plaquettes | normales | −0,10 |
  | ∅ | RDW | **manquant (nan)** | – |
  | = prédiction | | | **0,99** |

  Annotation : `nan = RDW` visible, décision rendue malgré un paramètre absent.

- **Bloc droit, la variable suspecte (encadré rouge brique) :**
  - Mode de prise en charge = `Hospitalisé` contribue +1,20.
  - Question : signal biologique, ou proxy de sévérité du patient ?
  - Réponse : c'est un proxy. Un patient hospitalisé est par construction déjà jugé sévère par un clinicien. La variable « marche » statistiquement, mais elle reflète une indication clinique préalable, pas une physiopathologie.

- **Encadré central (gros, accent teal) :** Corrélation n'est pas causalité. La variable « mode de prise en charge » prédit, mais elle ne cause pas. Si on l'utilise comme critère, on risque d'amplifier une inégalité : les patients déjà mieux ressourcés (suivi à domicile, moins sévères, mieux entourés) seraient déprioritisés.

- **Phrase clé bas :** SHAP révèle. Le clinicien décide. La question n'est pas technique, elle est éthique.
- **Transition :** On a un modèle qui prédit, son explication, un piège identifié. Reste à décider quoi en faire.

---

### SC, Conclusion : Performance OU équité ? (30 s)

- **Titre :** Performance OU équité ? Le dernier mot revient au clinicien.
- **Question centrale (gros, centré) :** Un modèle plus performant qui s'appuie sur une variable potentiellement biaisante est-il acceptable ?
- **Récapitulatif des 5 pièges de Mounia :**

  | Piège | Réponse de l'exposé |
  |---|---|
  | Déséquilibre 6,5 % | Stratégie consciente : `scale_pos_weight` + ajustement du seuil |
  | Variable sociale | Révélée par SHAP, à interroger systématiquement |
  | Choix de la métrique | Décision **clinique**, on pilote au recall et à l'AUC-PR |
  | Ce que SHAP fait | Explique, **ne corrige ni n'équilibre** |
  | Performance vs équité | Arbitrage clinique, pas technique |

- **Encadré « limites assumées » (à droite, gris) :**
  - Données simulées, à valider sur export labo réel
  - Validation multicentrique nécessaire (un seul centre simulé)
  - Contexte clinique (âge, fièvre, CRP, foyer) absent du dataset
  - Aucune validation prospective faite ici

- **Phrase finale (en gros, accent teal, citation Mounia) :** *« Ne pas faire d'IA à tout prix. »* Le notebook XGBoost n'est qu'un prétexte. Le vrai sujet est le discernement critique.
- **Animation :** aucune.

---

## 4. Animations, inventaire complet

### À extraire des modules existants
| Source | Animation | Slide(s) cible(s) |
|---|---|---|
| `ml/modules/09-random-forest` | mini-viz « relation en U des leucocytes » | S1a |
| `ml/modules/10-xgboost` | `bagging-boosting-schema` | S3a |
| `ml/modules/10-xgboost` | `residuals-chart` ou `Live boost` | S3b |
| `ml/modules/10-xgboost` | éventuelle courbe d'apprentissage avec early stopping | S3c |
| `ml/modules/11-shap` | Shapley en 30 s (jeu coopératif) | S5a |
| `ml/modules/11-shap` | beeswarm | S5b |
| `ml/modules/11-shap` | dependence plot | S5b |
| `ml/modules/11-shap` | waterfall | S5c |

### À créer
| Animation | Slide |
|---|---|
| Trois mini-viz SVG (déséquilibre 93,5/6,5, U, matrice avec trous) | S1b |
| Curseur de seuil + ROC + PR + matrice de confusion (interactif) | S2b et S4b |
| Schéma SVG nœud d'arbre avec direction par défaut NaN | S3d |
| Mini balance scale_pos_weight 1 vs 13 (optionnel) | S3e |
| Barres verticales Recall RL → RF → XGB (légère animation d'apparition) | S4a |

---

## 5. Pipeline data

### Notebook Python amont (`data-pipeline/`)

**`generate_data.py`** produit `data/sepsis_cohort.csv` :
- ~2 500 patients hospitalisés avec suspicion de bactériémie
- 11 variables NFS biologiquement plausibles : leucocytes (G/L), PNN (G/L), lymphocytes (G/L), NLR calculée, granuleux immatures (présent/absent + %), plaquettes (G/L), éosinophiles (G/L), monocytes (G/L), hémoglobine (g/dL), VPM (fL), RDW (%)
- 1 variable contexte : `mode_prise_en_charge` ∈ {Hospitalisé, Domicile, Soins de suite}
- Prévalence cible 6,5 % de positifs (hémoculture+)
- Stratification du proxy : Hospitalisé ~8,5 %, Domicile ~3,5 %, Soins de suite ~5,5 %
- Relation en U des leucocytes calibrée : <4 G/L → 8 %, 4-8 → 4 %, 8-12 → 6 %, >12 → 10 %
- Manquants réalistes : RDW ~10 %, VPM ~5 %, éosinophiles ~2 %

**`train_models.py`** entraîne et stocke :
- RL équilibrée 50/50 (via sous-échantillonnage)
- RL sur prévalence réelle
- Random Forest sur prévalence réelle
- XGBoost sur prévalence réelle (avec `scale_pos_weight = 13`, η = 0,05, λ = 1, early stopping = 30, max_trees = 500)

**`export_for_deck.py`** produit `data/deck.json` :
```json
{
  "metrics": {
    "rl_equilibre": {"acc": 0.84, "recall": 0.72, ...},
    "rl_reel":      {"acc": 0.96, "recall": 0.43, ...},
    "rf":           {"acc": 0.95, "recall": 0.43, ...},
    "xgb":          {"acc": ..., "recall": 0.55, ...}
  },
  "roc_xgb": [{"seuil": 0.0, "tpr": 1.0, "fpr": 1.0}, ...],
  "pr_xgb":  [{"seuil": 0.0, "precision": 0.065, "recall": 1.0}, ...],
  "confusion_at_threshold": {
    "0.50": {"tp": ..., "fp": ..., "fn": ..., "tn": ...},
    "0.40": {...},
    "0.30": {...}
  },
  "residuals_at_iteration": {
    "0":  [valeurs sur échantillon réduit],
    "10": [...],
    "100": [...]
  },
  "shap_global": [
    {"feature": "NLR", "mean_abs_shap": ...},
    ...
  ],
  "shap_dependence_leucocytes": [{"x": ..., "y_shap": ...}, ...],
  "shap_waterfall_patient_99pct": {
    "base_value": 0.06,
    "contributions": [
      {"feature": "NLR", "value": 55, "shap": 4.49},
      {"feature": "Lymphocytes", "value": 0.1, "shap": 2.27},
      ...
    ],
    "final_prob": 0.99
  }
}
```

Le deck HTML consomme `data/deck.json` statiquement (chargé en JS au démarrage).

---

## 6. Questions ouvertes et hypothèses à valider

- [ ] Validation à l'oral : passe avec l'utilisateur pour vérifier qu'aucune slide ne lui paraît embarrassante à présenter (ton, niveau technique).
- [ ] Animation S2b interactivité : décider à l'implémentation si le curseur de seuil bouge en *drag* continu ou en *steps* discrets (visuellement plus propre).

## 6.1 Décision pipeline data

Je propose le script Python complet (`generate_data.py`, `train_models.py`, `export_for_deck.py`), avec des dépendances minimales (`numpy`, `pandas`, `scikit-learn`, `xgboost`, `shap`). L'utilisateur le valide, puis le lance localement pour produire `data/deck.json`. Le deck HTML consomme ce JSON statiquement.

## 6.2 Chiffres réels après simulation (à utiliser dans les slides)

Le pipeline a été exécuté. Les chiffres cibles d'origine (recall 0,43 sur RL et RF) étaient illustratifs : ils ne sont pas atteignables sur des classifieurs non rééquilibrés à 6,5 % de prévalence. Les chiffres simulés réels sont les suivants (à charger dynamiquement depuis `deck.json` dans les slides) :

| Modèle | AUC-ROC | AUC-PR | Recall @ 0,5 | Recall @ 0,3 |
|---|---|---|---|---|
| RL équilibrée 50/50 | 0,80 | 0,25 | 0,65 | 0,83 |
| RL prévalence réelle | 0,81 | 0,29 | **0,00** | 0,13 |
| Random Forest | 0,92 | 0,58 | 0,22 | 0,44 |
| XGBoost | 0,91 | 0,53 | **0,43** | **0,52** |

Le crescendo recall@0,5 (0,00 → 0,22 → 0,43) est **plus tranchant** que la cible d'origine, et matérialise le piège « accuracy ment » (slide S1a) : RL réelle ne détecte LITTÉRALEMENT aucun positif tout en affichant ~93 % d'accuracy.

Les slides chiffrées (S1a, S4a, S5b, S5c) doivent lire ces valeurs depuis `window.deckData` au lieu de chiffres en dur. La narration reste identique, seuls les nombres bougent.

`scale_pos_weight` effectif = ~15 (ratio négatifs/positifs sur le train set, légèrement supérieur au 13 annoncé du fait du split stratifié).

Le waterfall S5c utilise un patient à `p = 0,90` (le max XGB sur le test est ~0,95, pas 0,99). Adapter la formulation orale (« patient à risque très élevé » au lieu de « 99 % »).

L'ordre stratifié du proxy `mode_prise_en_charge` est devenu 2-tier (Hospitalisé ~7 % > {Domicile, Soins de suite} ~5 %) au lieu du 3-tier visé (8,5 / 5,5 / 3,5). Le SHAP distingue tout de même Hospitalisé des autres modalités : le message éthique tient.

---

## 7. Style guide compact (rappel pour l'implémentation)

- **Palette :** fond `#FAFAFA`, texte `#0F172A`, secondaire `#6B7280`, accent teal `#0D9488`, accent rouge brique `#D14545` (warnings, callouts), bordures `#E5E7EB`.
- **Typographie :** Inter (300, 400, 500, 600, 700, 800), JetBrains Mono (400, 500). Aucune police serif.
- **Tailles :** titre slide 54px (800), phrase clé 28px (400-500), corps 16-18px, chiffres en mono pour les tableaux.
- **Espacement :** padding slide 64-72px tout autour.
- **Aspect :** slide 1280×720 native, scale responsive jusqu'à 1100×619.
- **Navigation :** ← → clavier, espace pour avancer, ESC pour vue sommaire, F pour plein écran.
- **Numérotation :** discrète bas droite, format `04 / 16`.

---

## 8. Glossaire intégré au deck (rappels inline, pas une page séparée)

À glisser à chaque premier usage :
- **NFS** : numération formule sanguine
- **NLR** : ratio neutrophiles sur lymphocytes
- **VPM** : volume plaquettaire moyen
- **RDW** : red cell distribution width, indice de dispersion des hématies
- **Accuracy** : taux global de prédictions correctes
- **Recall (sensibilité)** : VP / (VP + FN), part des vrais positifs détectés
- **Precision** : VP / (VP + FP)
- **AUC-PR** : aire sous la courbe précision-rappel
- **AUC-ROC** : aire sous la courbe TPR-FPR
- **Bagging** : bootstrap aggregating, agrégation d'arbres indépendants
- **Boosting** : agrégation séquentielle, chaque arbre corrige le précédent
- **Résidu** : écart entre vérité et prédiction courante
- **Valeur de Shapley** : contribution d'une variable à une prédiction, moyennée sur les coalitions
- **`scale_pos_weight`** : hyperparamètre XGBoost de pondération du gradient de la classe positive
- **Beeswarm, dependence plot, waterfall** : trois visualisations canoniques de SHAP
