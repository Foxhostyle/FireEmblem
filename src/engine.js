// ============================================================
// Échec & Lame v3 — moteur de règles (combat probabiliste)
// ============================================================
import {
  BOARD, SUDDEN_DEATH, DOUBLE_SPD, KOMI,
  CLASSES, TRIANGLE, ITEMS, TERRAIN, MAP, START_UNITS,
} from './data.js';

let unitSeq = 0;

export function makeUnit(cls, team, x, y) {
  const komi = team === 1 ? KOMI : 0;
  return {
    id: ++unitSeq, cls, team, x, y,
    weapon: null, armor: null,
    komi,
    hp: CLASSES[cls].hp + komi,
    dead: false,
  };
}

export function findItem(id) {
  return ITEMS.weapons.concat(ITEMS.armors).find(i => i.id === id) || null;
}

// Stats effectives = classe + équipement + komi
export function stats(u) {
  const base = CLASSES[u.cls];
  const s = { hp: base.hp, atk: base.atk, def: base.def, tec: base.tec, spd: base.spd, mov: base.mov };
  for (const itemId of [u.weapon, u.armor]) {
    const it = findItem(itemId);
    if (!it) continue;
    for (const k in it.mods) s[k] += it.mods[k];
  }
  s.hp += u.komi || 0;
  s.mov = Math.max(1, s.mov);
  for (const k of ['atk', 'def', 'tec', 'spd']) s[k] = Math.max(0, s[k]);
  s.hp = Math.max(1, s.hp);
  return s;
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Système « 2 jets » (comme FE GBA) : la précision affichée p (0-100)
// se comporte comme la moyenne de deux jets — les 85 % en valent ~92.
export function trueHit(p) {
  const x = p / 100;
  return x <= 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
}

export class Game {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.units = [];
    for (const [cls, x, y] of START_UNITS) {
      this.units.push(makeUnit(cls, 0, x, y));
      this.units.push(makeUnit(cls, 1, BOARD - 1 - x, BOARD - 1 - y));
    }
    this.turn = 1;
    this.current = 0;
    this.winner = null;
    this.suddenDeath = false;
  }

  alive(team) { return this.units.filter(u => !u.dead && u.team === team); }
  unitAt(x, y) { return this.units.find(u => !u.dead && u.x === x && u.y === y) || null; }
  inBoard(x, y) { return x >= 0 && y >= 0 && x < BOARD && y < BOARD; }
  terrain(x, y) { return TERRAIN[MAP[y][x]]; }

  // --- Déplacement : Dijkstra avec coût de terrain ---------------
  reachable(u) {
    const s = stats(u);
    const cost = Array.from({ length: BOARD }, () => Array(BOARD).fill(Infinity));
    cost[u.y][u.x] = 0;
    const queue = [[u.x, u.y, 0]];
    const out = [];
    while (queue.length) {
      queue.sort((a, b) => a[2] - b[2]);
      const [x, y, c] = queue.shift();
      if (c > cost[y][x]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!this.inBoard(nx, ny)) continue;
        const occ = this.unitAt(nx, ny);
        if (occ && occ.team !== u.team && !CLASSES[u.cls].pass) continue;
        const nc = c + this.terrain(nx, ny).cost;
        if (nc > s.mov || nc >= cost[ny][nx]) continue;
        cost[ny][nx] = nc;
        queue.push([nx, ny, nc]);
      }
    }
    for (let y = 0; y < BOARD; y++)
      for (let x = 0; x < BOARD; x++)
        if (cost[y][x] <= s.mov && !this.unitAt(x, y)) out.push({ x, y, c: cost[y][x] });
    return { tiles: out, cost };
  }

  path(u, costGrid, tx, ty) {
    const p = [[tx, ty]];
    let [x, y] = [tx, ty];
    while (x !== u.x || y !== u.y) {
      let best = null;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!this.inBoard(nx, ny)) continue;
        if (costGrid[ny][nx] + this.terrain(x, y).cost === costGrid[y][x])
          if (!best || costGrid[ny][nx] < costGrid[best[1]][best[0]]) best = [nx, ny];
      }
      if (!best) break;
      [x, y] = best;
      p.unshift([x, y]);
    }
    return p;
  }

  targetsFrom(u, x, y) {
    const rng = CLASSES[u.cls].rng;
    return this.alive(1 - u.team).filter(e => rng.includes(Math.abs(e.x - x) + Math.abs(e.y - y)));
  }

  // --- Combat ------------------------------------------------------
  // Profil d'une frappe att -> def : dégâts, précision, critique
  strikeProfile(att, def, attPos, defPos) {
    const sa = stats(att), sd = stats(def);
    const ca = CLASSES[att.cls];
    const wa = ca.wpn, wd = CLASSES[def.cls].wpn;
    let dmg = sa.atk;
    let hit = 70 + (sa.tec - sd.spd) * 5;
    if (TRIANGLE[wa] === wd) { dmg += 1; hit += 10; }
    else if (TRIANGLE[wd] === wa) { dmg -= 1; hit -= 10; }
    const terr = this.terrain(defPos[0], defPos[1]);
    dmg -= ca.magic ? Math.floor(sd.def / 2) + terr.def : sd.def + terr.def;
    hit -= terr.avoid;
    const crit = clamp(2 + sa.tec * 2 - sd.tec, 0, 35);
    return { dmg: Math.max(1, dmg), hit: clamp(hit, 40, 100), crit };
  }

  // Prévision complète : séquence de frappes avec ordres et probabilités
  forecast(att, def, attPos) {
    const ap = attPos || [att.x, att.y];
    const dp = [def.x, def.y];
    const dist = Math.abs(ap[0] - dp[0]) + Math.abs(ap[1] - dp[1]);
    const canCounter = CLASSES[def.cls].rng.includes(dist);
    const sa = stats(att), sd = stats(def);
    const A = this.strikeProfile(att, def, ap, dp);
    const D = canCounter ? this.strikeProfile(def, att, dp, ap) : null;
    const dblA = sa.spd >= sd.spd + DOUBLE_SPD;
    const dblD = sd.spd >= sa.spd + DOUBLE_SPD;
    const vantage = canCounter && sd.spd > sa.spd;
    const seq = [];
    if (vantage) seq.push({ who: 'D', ...D });
    seq.push({ who: 'A', ...A });
    if (canCounter && !vantage) seq.push({ who: 'D', ...D });
    if (dblA) seq.push({ who: 'A', ...A });
    else if (canCounter && dblD) seq.push({ who: 'D', ...D });
    return { A, D, dblA, dblD, canCounter, vantage, seq };
  }

  // Espérances exactes par énumération des issues (≤ 3 frappes)
  // -> { evDealt, evTaken, pKill, pDie }
  expected(att, def, attPos) {
    const f = this.forecast(att, def, attPos);
    let evDealt = 0, evTaken = 0, pKill = 0, pDie = 0;
    const walk = (i, hpA, hpD, prob) => {
      if (prob < 1e-9) return;
      if (i >= f.seq.length || hpA <= 0 || hpD <= 0) {
        evDealt += prob * (def.hp - Math.max(0, hpD));
        evTaken += prob * (att.hp - Math.max(0, hpA));
        if (hpD <= 0) pKill += prob;
        if (hpA <= 0) pDie += prob;
        return;
      }
      const st = f.seq[i];
      const p = trueHit(st.hit), c = st.crit / 100;
      const apply = (mult, pr) => {
        if (st.who === 'A') walk(i + 1, hpA, hpD - st.dmg * mult, prob * pr);
        else walk(i + 1, hpA - st.dmg * mult, hpD, prob * pr);
      };
      apply(0, 1 - p);                // esquive
      apply(1, p * (1 - c));          // touche
      apply(2, p * c);                // critique (x2)
    };
    walk(0, att.hp, def.hp, 1);
    return { evDealt, evTaken, pKill, pDie, f };
  }

  // Applique le combat (jets réels) ; renvoie les frappes jouées
  resolveCombat(att, def, attPos) {
    const f = this.forecast(att, def, attPos);
    const strikes = [];
    for (const st of f.seq) {
      const actor = st.who === 'A' ? att : def;
      const victim = st.who === 'A' ? def : att;
      if (actor.dead || victim.dead) break;
      const roll = (this.rng() + this.rng()) / 2 * 100;
      const hit = roll < st.hit;
      const crit = hit && this.rng() * 100 < st.crit;
      const dmg = hit ? st.dmg * (crit ? 2 : 1) : 0;
      victim.hp = Math.max(0, victim.hp - dmg);
      const kill = hit && victim.hp === 0;
      strikes.push({ who: st.who, dmg, hit, crit, kill });
      if (kill) { victim.dead = true; break; }
    }
    this.checkVictory();
    return strikes;
  }

  checkVictory() {
    for (const t of [0, 1]) {
      const lord = this.units.find(u => u.team === t && u.cls === 'lord');
      if (lord.dead) this.winner = 1 - t;
    }
  }

  endTurn() {
    this.turn++;
    this.current = 1 - this.current;
    if (this.turn > SUDDEN_DEATH) {
      this.suddenDeath = true;
      // une vague d'usure par tour complet, sur les DEUX camps
      if (this.current === 0) {
        for (const u of this.units) {
          if (u.dead) continue;
          u.hp = Math.max(0, u.hp - 1);
          if (u.hp === 0) u.dead = true;
        }
        const l0 = this.units.find(u => u.team === 0 && u.cls === 'lord');
        const l1 = this.units.find(u => u.team === 1 && u.cls === 'lord');
        if (l0.dead && l1.dead) {
          const hp = t => this.alive(t).reduce((a, u) => a + u.hp, 0);
          if (hp(0) !== hp(1)) this.winner = hp(0) > hp(1) ? 0 : 1;
          else this.winner = this.alive(0).length >= this.alive(1).length ? 0 : 1;
        } else this.checkVictory();
      }
    }
  }
}
