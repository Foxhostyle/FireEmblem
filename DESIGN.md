# Conseil de conception — Échec & Lame v3

Décisions prises « en conseil » : quatre rôles, un débat, une décision
par sujet. Trace écrite pour les itérations futures.

## 1. Direction technique — quelle techno ?

- **Options** : Canvas 2D (v2), PixiJS (2D WebGL + filtres), Phaser,
  **Three.js** (3D WebGL + post-processing).
- **Débat** : le rendu HD-2D des remakes Dragon Quest / Octopath est
  littéralement *une scène 3D inclinée + sprites pixel billboards +
  bloom/profondeur*. Le simuler en 2D (Pixi) est possible mais fragile
  (fausse perspective, pas de vraie caméra). Phaser n'apporte rien ici.
- **Décision** : **Three.js**, bundlé par esbuild en un fichier statique
  (`dist/bundle.js`) → zéro serveur, GitHub Pages OK, mobile OK
  (pixelRatio plafonné, bloom basse résolution, scène ~150 draw calls).
- **Validation** : rendu WebGL vérifié en headless (SwiftShader) avant
  d'écrire la moindre ligne de la scène.

## 2. Game design — le hasard, oui, mais lisible

- **Demande** : la Technique comme stat, jouer avec la précision,
  fini le tout-déterministe.
- **Débat** : le hasard pur frustre (XCOM 95 % raté) ; le déterminisme
  pur (v1/v2) crée des forteresses imprenables et un avantage du trait
  énorme (mesuré à ~90 % en mirror IA !).
- **Décision** :
  - **Précision** = 70 + (Tec − Vit adverse) × 5, ±10 triangle des
    armes, −15 si la cible est en forêt, bornée [40, 100].
  - **Système 2 jets** (comme FE GBA) : moyenne de deux jets → les
    précisions affichées hautes sont plus fiables qu'annoncé, les
    gambles restent des gambles. Affiché honnêtement comme « % ».
  - **Critique** (dégâts ×2) = 2 + Tec×2 − Tec adverse, borné [0, 35].
  - Tout est **annoncé avant l'attaque** (dégâts, %, crit, ordre des
    frappes, prévoyance).
- **Effet mesuré** : l'aléa contrôlé a dissous l'avantage du premier
  joueur — mirror IA ≈ 50/50 sur 480 parties, **sans komi**.

## 3. Structure de tour — garder « 1 unité par tour » ?

- **Débat** : phases complètes à la FE (lent, moins échecs) vs
  alternance stricte (nerveux, lisible, zugzwang intéressant).
- **Décision** : **on garde 1 unité par tour**. Le hasard adoucit
  l'avantage du trait, la mort subite (tour 20+) force l'engagement.
  Les ruines infranchissables créent des lignes de front.

## 4. Direction artistique

- Diorama insulaire flottant sur l'océan (référence DQ3 HD-2D) :
  socle rocheux, eau animée, horizon brumeux (fog accordé à la
  distance caméra), lumière chaude du soir + remplissage froid.
- Sprites pixel art 24×32 (32×32 cavalier) en billboards, 2 frames
  d'idle, ombres portées douces, jauges de PV flottantes.
- Post-processing : bloom (UnrealBloom), vignette + étalonnage
  chaud/froid (shader maison), tone mapping ACES.
- **Caméra cinématique** : orbite lente au menu, cadrage adaptatif à
  l'écran en bataille (fit par la largeur), **zoom de duel** pendant
  chaque combat — c'est le moment « wow » signé HD-2D.

## 5. Équilibrage (mesures)

- Outil : `npm run sim` (IA vs IA, espérances exactes par énumération
  des issues de combat ≤ 3 frappes).
- Résultats finaux (120 parties/matchup) : mirrors 60/60 et 62/58,
  médiane ~25 tours par partie (cible 10-20 min réelle).
- Komi retiré (inutile depuis le passage au probabiliste — il créait
  même un biais : le +1 PV gagnait les courses d'usure).

## Idées notées pour la v4

- Brouillard de guerre léger, draft d'objets alterné, promotion du
  Soldat sur la dernière rangée, en ligne (websocket, moteur déjà
  déterministe modulo seed), musique chiptune, mode hauteur de
  terrain (falaises +1 portée).
