# ⚔ Échec & Lame — tactique HD-2D

Un jeu tactique mobile qui croise **Fire Emblem** et les **échecs**,
dans un écrin **HD-2D** façon remake Dragon Quest : diorama 3D flottant
sur l'océan, sprites pixel art, lumière dorée, bloom et caméra de duel.

- **Un tour = une unité**, chacun son tour. But : abattre le **Seigneur** adverse.
- **Technique, précision, critiques** : chaque attaque affiche dégâts,
  % de toucher et % de critique avant d'être confirmée. Système
  « 2 jets » à la Fire Emblem GBA.
- **Équipement** : 1 arme + 1 armure par unité, chaque objet est unique
  et donne toujours **un bonus contre un malus**.
- 1 joueur (IA Recrue/Stratège) ou 2 joueurs sur le même téléphone.
- Une partie : **10-20 minutes** (mort subite après 20 tours chacun).

## ▶ Jouer

Le jeu est 100 % statique (un bundle, aucune requête) :

- **En ligne** : activer GitHub Pages (Settings → Pages → branche, `/`)
  et ouvrir l'URL sur téléphone.
- **En local** : `python3 -m http.server` puis `http://localhost:8000`
  (le bundle est commité, aucun build nécessaire pour jouer).

## 🛠 Développement

```bash
npm install        # three.js + esbuild
npm run build      # src/*.js -> dist/bundle.js
npm run sim 60     # équilibrage : IA vs IA, 60 parties par matchup
```

```
src/data.js     classes, objets, carte, constantes
src/engine.js   règles : déplacement, combat probabiliste, victoire
src/ai.js       IA (espérances exactes par énumération des issues)
src/art.js      pixel art : sprites 24x32, tuiles, blason, textures
src/scene.js    diorama three.js : caméra, lumière, bloom, animations
src/main.js     écrans, flux de jeu, sons
src/sim.js      simulation d'équilibrage (node)
```

## 📜 Règles complètes

Voir le **Codex** en jeu. L'essentiel :

| Mécanique | Formule |
|---|---|
| Dégâts | Atq − Déf (magie : − Déf/2), minimum 1 |
| Précision | 70 + (Tec − Vit déf) × 5, ±10 triangle, −15 forêt, borné 40-100 |
| Critique (×2) | 2 + Tec × 2 − Tec déf, borné 0-35 |
| Double attaque | +3 Vit d'écart |
| Prévoyance | défenseur strictement plus rapide → riposte en premier |
| Triangle | Épée > Hache > Lance > Épée (magie neutre) |
| Forêt | +1 Déf, +15 esquive, coût 2 — Ruines : infranchissables |
| Mort subite | tour 21+ : −1 PV à tous, chaque tour complet |

Unités (PV/Atq/Déf/Tec/Vit/Mou) : Seigneur 20/6/4/7/6/3 ·
Soldat 18/5/3/5/4/2 · Cavalier 17/5/3/5/7/4 (saute les unités) ·
Chevalier 22/7/6/3/1/2 · Mage 14/7/2/8/5/3 (portée 1-2).

## 🎯 Conception

Les choix (techno, formules, équilibrage mesuré sur 480 parties
simulées, direction artistique) sont documentés dans **[DESIGN.md](DESIGN.md)** —
le compte rendu du « conseil » de conception demandé pour la v3.
