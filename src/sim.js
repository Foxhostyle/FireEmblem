// ============================================================
// Échec & Lame v3 — simulation d'équilibrage (node src/sim.js)
// ============================================================
import { Game } from './engine.js';
import { aiChooseMove, autoEquip } from './ai.js';
import { TEAM_NAMES } from './data.js';

function play(d0, d1) {
  const g = new Game();
  autoEquip(g, 0); autoEquip(g, 1);
  let guard = 0, how = '?';
  while (g.winner === null && guard++ < 600) {
    const mv = aiChooseMove(g, g.current, g.current === 0 ? d0 : d1);
    if (!mv) break;
    const u = mv.unit;
    u.x = mv.dest[0]; u.y = mv.dest[1];
    if (mv.target && !mv.target.dead) {
      g.resolveCombat(u, mv.target, [u.x, u.y]);
      if (g.winner !== null) how = 'combat';
    }
    if (g.winner === null) { g.endTurn(); if (g.winner !== null) how = 'usure'; }
  }
  return { w: g.winner, t: g.turn, how, sd: g.suddenDeath };
}

const N = parseInt(process.argv[2] || '60', 10);
for (const [d0, d1] of [['normal', 'normal'], ['hard', 'hard'], ['hard', 'normal'], ['normal', 'hard']]) {
  const wins = [0, 0, 0]; const turns = []; let sdCount = 0; const hows = { combat: 0, usure: 0 };
  for (let i = 0; i < N; i++) {
    const r = play(d0, d1);
    if (r.w === null) wins[2]++; else wins[r.w]++;
    turns.push(r.t);
    if (r.sd) sdCount++;
    if (r.how in hows) hows[r.how]++;
  }
  turns.sort((a, b) => a - b);
  console.log(
    `${d0} vs ${d1}: ${TEAM_NAMES[0]} ${wins[0]} / ${TEAM_NAMES[1]} ${wins[1]} / blocage ${wins[2]}` +
    ` | demi-tours med ${turns[N >> 1]} max ${turns[N - 1]}` +
    ` | mort subite ${sdCount}/${N} | fins: ${hows.combat} combat, ${hows.usure} usure`);
}
