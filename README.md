# ⚔ Échec & Lame

Un jeu tactique **pixel art pour mobile** qui croise **Fire Emblem** et les
**échecs** : on retrouve le triangle des armes, les doubles attaques, les
ripostes et le terrain de Fire Emblem, mais sur un plateau 8×8 où l'on ne
joue qu'**une seule unité par tour**, comme aux échecs. Aucun hasard : tous
les dégâts sont prévisibles avant d'attaquer.

Une partie dure **10 à 20 minutes**.

## ▶ Jouer

C'est un jeu web, sans dépendance ni build :

- **En local** : ouvrir `index.html` dans un navigateur (ou
  `python3 -m http.server` puis `http://localhost:8000` sur le téléphone).
- **En ligne** : activer GitHub Pages sur ce dépôt (Settings → Pages →
  branche, dossier `/`) et ouvrir l'URL depuis un téléphone.

### Modes

- **1 joueur** contre l'ordinateur (IA *Recrue* ou *Stratège*) ;
- **2 joueurs** sur le même téléphone, chacun joue son tour.

## 📜 Règles

- **But** : tuer le **Seigneur** adverse (le « roi »).
- **Un tour = une unité** : déplacer puis attaquer ou attendre. On peut
  rejouer la même unité plusieurs tours de suite.
- **Combat déterministe** : dégâts = Atq − Déf, **minimum 1**. Le défenseur
  riposte si l'attaquant est à sa portée.
- **Double attaque** : +3 Vitesse ou plus d'écart → on frappe deux fois.
- **Prévoyance** : un défenseur strictement plus rapide riposte **avant**
  la première frappe de l'attaquant.
- **Triangle des armes** (±1 dégât) : Épée > Hache > Lance > Épée.
  La Magie est neutre et ignore la moitié de la Déf.
- **Terrain** : la forêt donne +1 Déf mais coûte 2 points de mouvement.
- **Mort subite** : après 20 tours chacun, toutes les unités perdent
  1 PV par tour complet — impossible de jouer la montre.
- **Komi** : les Bleus jouent en premier ; chaque unité Rouge a +1 PV en
  compensation.

### Unités (inspirées des pièces)

| Unité | Pièce | Arme | Profil |
|---|---|---|---|
| Seigneur | Roi | Épée | Bon partout — s'il meurt, c'est perdu |
| Soldat ×2 | Pion | Lance | Ligne de front solide |
| Cavalier | Cavalier | Épée | Très rapide, saute par-dessus les unités |
| Chevalier | Tour | Hache | Mur de fer, très lent |
| Mage | Fou | Magie | Frappe à distance 1-2, fragile |

### Équipement

Avant la bataille, chaque unité peut recevoir **1 arme + 1 armure**.
Chaque objet est unique dans le camp et donne toujours **un bonus contre
un malus** : Forge lourde (+3 Atq / −2 Vit), Forge légère (+2 Vit / −1 Atq),
Forge perçante (+2 Atq / −2 Déf), Forge de garde (+2 Déf / −1 Atq),
Harnois de plates (+3 Déf / −2 Vit), Cape d'agilité (+2 Vit / −1 Déf),
Bottes ailées (+1 Mou / −2 Déf), Amulette vitale (+6 PV / −1 Vit).

## 🎯 Choix de design

- **Zéro hasard** : pour marier échecs et Fire Emblem, tout le combat est
  déterministe et prévisualisé. La tension vient du positionnement, pas
  des dés.
- **Une unité par tour** : c'est ce qui rend le jeu « nerveux » — pas de
  longue phase ennemie, on répond coup pour coup.
- **Dégâts minimum 1** : sans cela, un Seigneur sur-blindé devenait
  littéralement invincible (constaté en simulation) et la partie gelait.
- **Prévoyance + komi** : en simulation IA-contre-IA (160 parties par
  réglage), le premier joueur gagnait ~90 % des parties miroir. La riposte
  prioritaire du défenseur plus rapide et le +1 PV du second joueur
  ramènent le miroir « Stratège » à ~50/50.
- **Mort subite** : garantit la durée cible de 10-20 min et force
  l'engagement en fin de partie.

L'IA évalue chaque coup possible (case × cible) avec une carte des menaces
ennemies, simule exactement la séquence de frappes, et mesure chaque coup
en **gain par rapport à l'immobilité** de l'unité — *Stratège* est précise
et évite les cases mortelles, *Recrue* est plus brouillonne.

## 🗂 Architecture

```
index.html      écrans (menu, règles, préparation, jeu, fin)
css/style.css   style mobile
js/data.js      classes, objets, carte, constantes d'équilibrage
js/sprites.js   sprites 16×16 dessinés en grilles de caractères
js/game.js      moteur de règles (déplacement, combat, victoire)
js/ai.js        IA + équipement automatique
js/main.js      interface, rendu canvas, animations, sons
```

## 💡 Idées pour la suite (v2)

- **Brouillard d'équipement** : cacher l'équipement adverse jusqu'au
  premier combat de chaque unité (mind game à la draft).
- **Draft d'objets alterné** : au lieu d'équiper en aveugle, drafter les
  8 objets chacun son tour.
- **Nouvelles unités** : Archer (portée 2 uniquement), Soigneur,
  Voleur (vole un objet en attaquant).
- **Cartes variées** : rivières, forts (+2 Déf), brume.
- **Promotion** : un Soldat qui atteint la dernière rangée se promeut
  (comme aux échecs !).
- **Multijoueur en ligne** (le moteur étant déterministe, il suffit
  d'échanger les coups), historique des coups et notation de partie.
- **PWA** : manifeste + service worker pour l'installer hors-ligne.
