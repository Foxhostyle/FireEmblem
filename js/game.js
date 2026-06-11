// ============================================================
// Échec & Lame — moteur de règles (déterministe, zéro hasard)
// ============================================================
'use strict';

let unitSeq = 0;

function makeUnit(cls, team, x, y) {
  // komi : les Rouges jouent en second, +1 PV compense le trait
  const komi = team === 1 ? 1 : 0;
  return {
    id: ++unitSeq, cls, team, x, y,
    weapon: null, armor: null, // ids d'objets
    komi,
    hp: CLASSES[cls].hp + komi,
    dead: false,
  };
}

function findItem(id) {
  return ITEMS.weapons.concat(ITEMS.armors).find(i => i.id === id) || null;
}

// Stats effectives = classe + équipement (planchers : mov >= 1, autres >= 0)
function stats(u) {
  const base = CLASSES[u.cls];
  const s = { hp: base.hp, atk: base.atk, def: base.def, spd: base.spd, mov: base.mov };
  for (const itemId of [u.weapon, u.armor]) {
    const it = findItem(itemId);
    if (!it) continue;
    for (const k in it.mods) s[k] += it.mods[k];
  }
  s.hp += u.komi || 0;
  s.mov = Math.max(1, s.mov);
  for (const k of ['atk', 'def', 'spd']) s[k] = Math.max(0, s[k]);
  s.hp = Math.max(1, s.hp);
  return s;
}

class Game {
  constructor() {
    this.units = [];
    for (const [cls, x, y] of START_UNITS) {
      this.units.push(makeUnit(cls, 0, x, y));
      this.units.push(makeUnit(cls, 1, BOARD - 1 - x, BOARD - 1 - y));
    }
    this.turn = 1;          // demi-tours joués + 1
    this.current = 0;       // équipe active (0 = bleus commencent)
    this.winner = null;
    this.suddenDeath = false;
  }

  alive(team) { return this.units.filter(u => !u.dead && u.team === team); }
  unitAt(x, y) { return this.units.find(u => !u.dead && u.x === x && u.y === y) || null; }
  inBoard(x, y) { return x >= 0 && y >= 0 && x < BOARD && y < BOARD; }
  terrain(x, y) { return TERRAIN[MAP[y][x]]; }

  // --- Déplacement : BFS avec coût de terrain -----------------
  // Traverse les alliés (et tout le monde pour le cavalier), ne
  // peut pas s'arrêter sur une case occupée.
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

  // Chemin reconstruit pour l'animation
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

  // Ennemis attaquables depuis (x, y)
  targetsFrom(u, x, y) {
    const rng = CLASSES[u.cls].rng;
    return this.alive(1 - u.team).filter(e => rng.includes(Math.abs(e.x - x) + Math.abs(e.y - y)));
  }

  // --- Combat --------------------------------------------------
  // Dégâts d'une frappe (déterministe)
  strikeDamage(att, def, attPos, defPos) {
    const sa = stats(att), sd = stats(def);
    const ca = CLASSES[att.cls];
    let dmg = sa.atk;
    // triangle des armes
    const wa = ca.wpn, wd = CLASSES[def.cls].wpn;
    if (TRIANGLE[wa] === wd) dmg += 1;
    else if (TRIANGLE[wd] === wa) dmg -= 1;
    // défense (la magie ignore la moitié de la Déf)
    const terr = this.terrain(defPos[0], defPos[1]).def;
    dmg -= ca.magic ? Math.floor(sd.def / 2) + terr : sd.def + terr;
    // minimum 1 : aucune unité n'est invincible, le siège reste possible
    return Math.max(1, dmg);
  }

  // Prévision complète : séquence de frappes A/D avec doubles
  forecast(att, def, attPos) {
    const ap = attPos || [att.x, att.y];
    const dp = [def.x, def.y];
    const dist = Math.abs(ap[0] - dp[0]) + Math.abs(ap[1] - dp[1]);
    const canCounter = CLASSES[def.cls].rng.includes(dist);
    const sa = stats(att), sd = stats(def);
    const dmgA = this.strikeDamage(att, def, ap, dp);
    const dmgD = canCounter ? this.strikeDamage(def, att, dp, ap) : 0;
    const dblA = sa.spd >= sd.spd + DOUBLE_SPD;
    const dblD = sd.spd >= sa.spd + DOUBLE_SPD;
    // Prévoyance : un défenseur strictement plus rapide riposte en PREMIER
    const vantage = canCounter && sd.spd > sa.spd;
    // Ordre : (prévoyance), attaquant, défenseur, puis la double du plus rapide
    const seq = [];
    if (vantage) seq.push({ who: 'D', dmg: dmgD });
    seq.push({ who: 'A', dmg: dmgA });
    if (canCounter && !vantage) seq.push({ who: 'D', dmg: dmgD });
    if (dblA) seq.push({ who: 'A', dmg: dmgA });
    else if (canCounter && dblD) seq.push({ who: 'D', dmg: dmgD });
    return { dmgA, dmgD, dblA, dblD, canCounter, vantage, seq };
  }

  // Applique le combat ; renvoie la liste des frappes réellement portées
  resolveCombat(att, def, attPos) {
    const f = this.forecast(att, def, attPos);
    const strikes = [];
    for (const st of f.seq) {
      const actor = st.who === 'A' ? att : def;
      const victim = st.who === 'A' ? def : att;
      if (actor.dead || victim.dead) break;
      victim.hp = Math.max(0, victim.hp - st.dmg);
      const kill = victim.hp === 0;
      strikes.push({ who: st.who, dmg: st.dmg, kill });
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

  // Fin du tour d'une équipe → passe la main, gère la mort subite
  endTurn() {
    this.turn++;
    this.current = 1 - this.current;
    if (this.turn > SUDDEN_DEATH) {
      this.suddenDeath = true;
      // une vague d'usure par tour complet, sur les DEUX camps (symétrique)
      if (this.current === 0) {
        for (const u of this.units) {
          if (u.dead) continue;
          u.hp = Math.max(0, u.hp - 1);
          if (u.hp === 0) u.dead = true;
        }
        const l0 = this.units.find(u => u.team === 0 && u.cls === 'lord');
        const l1 = this.units.find(u => u.team === 1 && u.cls === 'lord');
        if (l0.dead && l1.dead) {
          // double KO : départage aux PV totaux, puis au nombre d'unités
          const hp = t => this.alive(t).reduce((a, u) => a + u.hp, 0);
          if (hp(0) !== hp(1)) this.winner = hp(0) > hp(1) ? 0 : 1;
          else this.winner = this.alive(0).length >= this.alive(1).length ? 0 : 1;
        } else this.checkVictory();
      }
    }
  }
}
