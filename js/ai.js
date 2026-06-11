// ============================================================
// Échec & Lame — IA (heuristique + carte de menaces)
// ============================================================
'use strict';

// Valeur stratégique d'une unité (pour les échanges)
function unitValue(u) {
  const base = { lord: 100, mage: 16, knight: 14, cavalier: 13, soldier: 10 }[u.cls];
  return base + stats(u).hp * 0.3;
}

// Carte des menaces : pour chaque case, dégâts max qu'un ennemi
// pourrait infliger à une unité qui s'y trouverait au prochain tour.
function threatMap(game, enemyTeam, sample) {
  const map = Array.from({ length: BOARD }, () => Array(BOARD).fill(0));
  for (const e of game.alive(enemyTeam)) {
    const { tiles } = game.reachable(e);
    const spots = tiles.concat([{ x: e.x, y: e.y }]);
    const rng = CLASSES[e.cls].rng;
    const se = stats(e);
    for (const t of spots) {
      for (const r of rng) {
        for (let dx = -r; dx <= r; dx++) {
          const dy = r - Math.abs(dx);
          for (const sy of dy === 0 ? [0] : [-1, 1]) {
            const ax = t.x + dx, ay = t.y + sy * dy;
            if (!game.inBoard(ax, ay)) continue;
            // approximation : atk - déf moyenne de l'échantillon
            const dmg = Math.max(0, se.atk - (CLASSES[e.cls].magic ? sample.def / 2 : sample.def));
            map[ay][ax] = Math.max(map[ay][ax], dmg);
          }
        }
      }
    }
  }
  return map;
}

// Choisit le meilleur coup pour `team`.
// difficulty : 'normal' (gourmand) | 'hard' (prudent + protection du roi)
function aiChooseMove(game, team, difficulty) {
  const hard = difficulty === 'hard';
  const enemies = game.alive(1 - team);
  const myLord = game.units.find(u => u.team === team && u.cls === 'lord');
  const foeLord = game.units.find(u => u.team === 1 - team && u.cls === 'lord');
  const mine = game.alive(team);
  const avgDef = mine.length
    ? mine.reduce((a, e) => a + stats(e).def, 0) / mine.length : 3;
  const danger = threatMap(game, 1 - team, { def: avgDef });
  const noise = hard ? 0.05 : 0.4; // variété des parties

  let best = null;
  const sd = game.suddenDeath;

  for (const u of game.alive(team)) {
    const { tiles } = game.reachable(u);
    const spots = tiles.concat([{ x: u.x, y: u.y, c: 0 }]);
    const myVal = unitValue(u);

    // Score de position d'une case pour cette unité
    const posScore = (x, y) => {
      const distLord = Math.abs(x - foeLord.x) + Math.abs(y - foeLord.y);
      const distMyLord = Math.abs(x - myLord.x) + Math.abs(y - myLord.y);
      const risk = danger[y][x];
      let pos = game.terrain(x, y).def * 1.5;          // couvert
      if (u.cls === 'lord') {
        // le roi avance à peine et fuit tout danger sérieux
        pos -= distLord * (sd ? 1.5 : 0.25);
        pos -= risk * (sd ? 2 : 5);
        if (!sd && risk >= u.hp * 0.6) pos -= 500;
      } else {
        pos -= distLord * (sd ? 2 : 1.2);              // avancer vers le roi adverse
        pos -= risk * 0.3 * (sd ? 0.3 : 1);
        if (hard && !sd && risk >= u.hp) pos -= myVal * 0.8;
        if (!sd)
          pos -= Math.max(0, distMyLord - 4) * 0.2;    // cohésion légère
      }
      return pos;
    };

    // Référence : rester sur place sans agir. Les scores des coups sont
    // mesurés en GAIN par rapport à cette référence, sinon les unités
    // loin du front ne seraient jamais jouées.
    const baseline = posScore(u.x, u.y);

    for (const t of spots) {
      const pos = posScore(t.x, t.y) - baseline;
      const noMove = t.x === u.x && t.y === u.y;
      consider({ unit: u, dest: [t.x, t.y], target: null },
        pos + (noMove ? -0.5 : 0) + Math.random() * noise);

      // --- options d'attaque depuis cette case ---
      for (const e of game.targetsFrom(u, t.x, t.y)) {
        const f = game.forecast(u, e, [t.x, t.y]);
        // simulation exacte de la séquence (prévoyance comprise)
        let hpA = u.hp, hpE = e.hp;
        for (const st of f.seq) {
          if (st.who === 'A') { if (hpA <= 0) break; hpE -= st.dmg; }
          else { if (hpE <= 0) break; hpA -= st.dmg; }
        }
        const dealt = e.hp - Math.max(0, hpE);
        const taken = u.hp - Math.max(0, hpA);
        const kills = hpE <= 0;
        const dies = hpA <= 0;
        const sdBoost = sd ? 1.8 : 1;
        let s = pos + dealt * 1.6 * sdBoost + (kills ? unitValue(e) * 1.2 : 0);
        s -= taken * 0.7 / sdBoost;
        if (dies) s -= myVal * (hard ? 1.2 : 0.8) / sdBoost;
        if (e.cls === 'lord') s += dealt * 2.5 + (kills ? 1000 : 0);
        if (u.cls === 'lord' && !kills) s -= 6; // le roi n'attaque que pour tuer
        consider({ unit: u, dest: [t.x, t.y], target: e }, s + Math.random() * noise);
      }
    }
  }

  function consider(move, score) {
    if (!best || score > best.score) best = { ...move, score };
  }
  return best;
}

// --- Équipement automatique (pour l'IA ou le bouton "Auto") ----
function autoEquip(game, team) {
  const units = game.alive(team);
  const plan = [
    ['knight', 'w_heavy'],   // le chevalier ne double jamais : -2 Vit gratuit
    ['knight', 'a_charm'],
    ['lord', 'w_guard'],     // roi solide
    ['lord', 'a_plate'],
    ['mage', 'w_keen'],      // le mage frappe à distance : -2 Déf peu risqué
    ['cavalier', 'a_cape'],  // garantit la double sur presque tout
    ['soldier', 'w_light'],
    ['soldier', 'a_boots'],
  ];
  for (const [cls, itemId] of plan) {
    const isWeapon = ITEMS.weapons.some(w => w.id === itemId);
    const u = units.find(x => x.cls === cls && (isWeapon ? !x.weapon : !x.armor));
    if (!u) continue;
    if (isWeapon) u.weapon = itemId; else u.armor = itemId;
  }
}
