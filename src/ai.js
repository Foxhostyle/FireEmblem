// ============================================================
// Échec & Lame v3 — IA à base d'espérances de dégâts
// ============================================================
import { BOARD, CLASSES, ITEMS } from './data.js';
import { stats, trueHit } from './engine.js';

function unitValue(u) {
  const base = { lord: 100, mage: 16, knight: 14, cavalier: 13, soldier: 10 }[u.cls];
  return base + stats(u).hp * 0.3;
}

// Carte des menaces : espérance de dégâts max qu'un ennemi peut
// infliger sur chaque case au prochain tour (approximation).
function threatMap(game, enemyTeam, sampleDef) {
  const map = Array.from({ length: BOARD }, () => Array(BOARD).fill(0));
  for (const e of game.alive(enemyTeam)) {
    const { tiles } = game.reachable(e);
    const spots = tiles.concat([{ x: e.x, y: e.y }]);
    const rng = CLASSES[e.cls].rng;
    const se = stats(e);
    const raw = Math.max(1, se.atk - (CLASSES[e.cls].magic ? sampleDef / 2 : sampleDef));
    const ev = raw * trueHit(Math.min(100, 70 + se.tec * 2));
    for (const t of spots) {
      for (const r of rng) {
        for (let dx = -r; dx <= r; dx++) {
          const dy = r - Math.abs(dx);
          for (const sy of dy === 0 ? [0] : [-1, 1]) {
            const ax = t.x + dx, ay = t.y + sy * dy;
            if (!game.inBoard(ax, ay)) continue;
            map[ay][ax] = Math.max(map[ay][ax], ev);
          }
        }
      }
    }
  }
  return map;
}

// difficulty : 'normal' (brouillon) | 'hard' (précis)
export function aiChooseMove(game, team, difficulty) {
  const hard = difficulty === 'hard';
  const myLord = game.units.find(u => u.team === team && u.cls === 'lord');
  const foeLord = game.units.find(u => u.team === 1 - team && u.cls === 'lord');
  const mine = game.alive(team);
  const avgDef = mine.length
    ? mine.reduce((a, e) => a + stats(e).def, 0) / mine.length : 3;
  const danger = threatMap(game, 1 - team, avgDef);
  const noise = hard ? 0.05 : 0.5;
  const sd = game.suddenDeath;

  let best = null;
  const consider = (move, score) => {
    if (!best || score > best.score) best = { ...move, score };
  };

  for (const u of mine) {
    const { tiles } = game.reachable(u);
    const spots = tiles.concat([{ x: u.x, y: u.y, c: 0 }]);
    const myVal = unitValue(u);

    const posScore = (x, y) => {
      const distLord = Math.abs(x - foeLord.x) + Math.abs(y - foeLord.y);
      const distMyLord = Math.abs(x - myLord.x) + Math.abs(y - myLord.y);
      const risk = danger[y][x];
      let pos = game.terrain(x, y).def * 1.5 + game.terrain(x, y).avoid * 0.05;
      if (u.cls === 'lord') {
        pos -= distLord * (sd ? 1.5 : 0.25);
        pos -= risk * (sd ? 2 : 5);
        if (!sd && risk >= u.hp * 0.6) pos -= 500;
      } else {
        pos -= distLord * (sd ? 2 : 1.2);
        pos -= risk * 0.3 * (sd ? 0.3 : 1);
        if (hard && !sd && risk >= u.hp) pos -= myVal * 0.8;
        if (!sd) pos -= Math.max(0, distMyLord - 4) * 0.2;
      }
      return pos;
    };

    // Gain mesuré par rapport à l'immobilité (sinon les unités
    // éloignées du front ne seraient jamais jouées).
    const baseline = posScore(u.x, u.y);

    for (const t of spots) {
      const pos = posScore(t.x, t.y) - baseline;
      const noMove = t.x === u.x && t.y === u.y;
      consider({ unit: u, dest: [t.x, t.y], target: null },
        pos + (noMove ? -0.5 : 0) + Math.random() * noise);

      for (const e of game.targetsFrom(u, t.x, t.y)) {
        const { evDealt, evTaken, pKill, pDie } = game.expected(u, e, [t.x, t.y]);
        const sdBoost = sd ? 1.8 : 1;
        let s = pos + evDealt * 1.6 * sdBoost + pKill * unitValue(e) * 1.2;
        s -= evTaken * 0.7 / sdBoost;
        s -= pDie * myVal * (hard ? 1.2 : 0.8) / sdBoost;
        if (e.cls === 'lord') s += evDealt * 2.5 + pKill * 1000;
        if (u.cls === 'lord' && pKill < 0.55) s -= 6;
        consider({ unit: u, dest: [t.x, t.y], target: e }, s + Math.random() * noise);
      }
    }
  }
  return best;
}

// --- Équipement automatique --------------------------------------
export function autoEquip(game, team) {
  const units = game.alive(team);
  const plan = [
    ['knight', 'w_heavy'],    // ne double jamais : -2 Vit indolore
    ['knight', 'a_charm'],
    ['lord', 'w_guard'],
    ['lord', 'a_plate'],
    ['cavalier', 'w_duel'],   // technique : touche les cibles rapides
    ['cavalier', 'a_cape'],
    ['mage', 'w_keen'],
    ['soldier', 'w_light'],
    ['soldier', 'a_lens'],
    ['soldier', 'a_boots'],
  ];
  for (const [cls, itemId] of plan) {
    const isWeapon = ITEMS.weapons.some(w => w.id === itemId);
    const u = units.find(x => x.cls === cls && (isWeapon ? !x.weapon : !x.armor));
    if (!u) continue;
    if (isWeapon) u.weapon = itemId; else u.armor = itemId;
  }
}
