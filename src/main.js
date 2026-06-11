// ============================================================
// Échec & Lame v3 — interface, flux de jeu, sons
// ============================================================
import { BOARD, SUDDEN_DEATH, CLASSES, ITEMS, WPN_NAMES, STAT_NAMES, TEAM_NAMES } from './data.js';
import { Game, stats, findItem, trueHit } from './engine.js';
import { aiChooseMove, autoEquip } from './ai.js';
import { crestCanvas, unitCanvas } from './art.js';
import { Diorama } from './scene.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const UI = {
  mode: 'ai',
  difficulty: 'normal',
  game: null,
  phase: 'idle',   // idle | selected | moved | preview | anim | over
  sel: null,
  reach: null,
  envelope: [],
  directs: new Map(),
  origin: null,
  target: null,
  inspect: null,
  inspectZone: [],
  prepTeam: 0,
  startTime: 0,
  muted: localStorage.getItem('el_mute') === '1',
};

let scene;

// ---------- Sons ----------
let actx = null;
function beep(freq, dur = 0.07, type = 'square', vol = 0.12, slide = 0) {
  if (UI.muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), actx.currentTime + dur);
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) { /* pas d'audio */ }
}
const SFX = {
  ui: () => beep(880, 0.05),
  select: () => beep(660, 0.06),
  move: () => beep(440, 0.05, 'triangle'),
  hit: () => beep(150, 0.12, 'sawtooth', 0.18, -90),
  crit: () => { beep(95, 0.18, 'sawtooth', 0.24, -55); beep(300, 0.1, 'square', 0.12, -160); },
  miss: () => beep(520, 0.09, 'sine', 0.07, -260),
  kill: () => { beep(220, 0.2, 'sawtooth', 0.18, -160); setTimeout(() => beep(110, 0.25, 'sawtooth', 0.15, -70), 90); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'square', 0.1), i * 130)); },
};

function show(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }

// ---------- Initialisation ----------
window.addEventListener('DOMContentLoaded', () => {
  scene = new Diorama($('#gl'));
  scene.setMode('menu');

  $('#crest').getContext('2d').drawImage(crestCanvas(0), 0, 0);

  $('#btn-ai').onclick = () => { SFX.ui(); $('#diff-picker').classList.toggle('hidden'); };
  $$('#diff-picker button').forEach(b => b.onclick = () => {
    SFX.ui(); UI.mode = 'ai'; UI.difficulty = b.dataset.diff; startPrep();
  });
  $('#btn-2p').onclick = () => { SFX.ui(); UI.mode = '2p'; startPrep(); };
  $('#btn-rules').onclick = () => { SFX.ui(); show('screen-rules'); };
  $('#btn-rules-back').onclick = () => { SFX.ui(); show('screen-menu'); };
  $('#btn-prep-auto').onclick = () => { SFX.ui(); clearEquip(UI.prepTeam); autoEquip(UI.game, UI.prepTeam); renderPrep(); };
  $('#btn-prep-clear').onclick = () => { SFX.ui(); clearEquip(UI.prepTeam); renderPrep(); };
  $('#btn-prep-go').onclick = prepDone;
  $('#btn-item-close').onclick = () => { SFX.ui(); $('#item-modal').classList.add('hidden'); renderPrep(); };
  $('#btn-wait').onclick = actWait;
  $('#btn-cancel').onclick = actCancel;
  $('#btn-attack').onclick = actAttack;
  $('#btn-back').onclick = actBack;
  $('#btn-quit').onclick = () => {
    if (confirm('Abandonner la partie ?')) { scene.setMode('menu'); show('screen-menu'); }
  };
  $('#btn-mute').onclick = () => {
    UI.muted = !UI.muted;
    localStorage.setItem('el_mute', UI.muted ? '1' : '0');
    updateMuteBtn();
  };
  $('#btn-again').onclick = () => { SFX.ui(); startPrep(); };
  $('#btn-menu').onclick = () => { SFX.ui(); scene.setMode('menu'); show('screen-menu'); };
  updateMuteBtn();

  $('#gl').addEventListener('pointerdown', onTap);
  show('screen-menu');
});

function updateMuteBtn() { $('#btn-mute').textContent = UI.muted ? '🔇' : '🔊'; }

// ---------- Préparation ----------
function startPrep() {
  UI.game = new Game();
  UI.prepTeam = 0;
  if (UI.mode === 'ai') autoEquip(UI.game, 1);
  scene.setMode('menu');
  scene.syncUnits(UI.game);
  scene.setHighlights({});
  show('screen-prep');
  renderPrep();
}

function clearEquip(team) {
  for (const u of UI.game.alive(team)) { u.weapon = null; u.armor = null; }
}

function statLine(u) {
  const base = CLASSES[u.cls], s = stats(u);
  return ['hp', 'atk', 'def', 'tec', 'spd', 'mov'].map(k => {
    const d = s[k] - base[k] - (k === 'hp' ? (u.komi || 0) : 0);
    const cls = d > 0 ? 'up' : d < 0 ? 'down' : '';
    return `<span class="stat ${cls}">${STAT_NAMES[k]} ${s[k]}${d ? ` (${d > 0 ? '+' : ''}${d})` : ''}</span>`;
  }).join(' ');
}

function renderPrep() {
  const t = UI.prepTeam;
  $('#prep-title').textContent = `Équipement — ${TEAM_NAMES[t]}`;
  $('#prep-title').className = t === 0 ? 'team-blue' : 'team-red';
  $('#btn-prep-go').textContent =
    (UI.mode === '2p' && t === 0) ? 'Au tour des Rouges ➜' : '⚔ Lancer la bataille';
  const list = $('#prep-list');
  list.innerHTML = '';
  for (const u of UI.game.alive(t)) {
    const card = document.createElement('div');
    card.className = 'unit-card fe-panel';
    const frame = document.createElement('div');
    frame.className = 'mini-frame';
    const cv = unitCanvas(u.cls, t, 0);
    const mini = document.createElement('canvas');
    mini.width = cv.width; mini.height = cv.height;
    mini.className = 'mini';
    mini.getContext('2d').drawImage(cv, 0, 0);
    frame.appendChild(mini);
    const info = document.createElement('div');
    const w = findItem(u.weapon), a = findItem(u.armor);
    info.innerHTML =
      `<b>${CLASSES[u.cls].name}</b> <small>(${CLASSES[u.cls].piece} · ${WPN_NAMES[CLASSES[u.cls].wpn]})</small><br>` +
      `<span class="items">⚒ ${w ? w.name : '—'} &nbsp; 🛡 ${a ? a.name : '—'}</span><br>` +
      statLine(u);
    card.append(frame, info);
    card.onclick = () => { SFX.select(); openItemModal(u); };
    list.appendChild(card);
  }
}

function modsText(it) {
  return Object.entries(it.mods)
    .map(([k, v]) => `<span class="${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v} ${STAT_NAMES[k]}</span>`)
    .join(' / ');
}

function openItemModal(u) {
  $('#item-title').textContent = `${CLASSES[u.cls].name} — choisir l'équipement`;
  const box = $('#item-lists');
  box.innerHTML = '';
  for (const [slot, pool, label] of [['weapon', ITEMS.weapons, 'Armes (1 max)'], ['armor', ITEMS.armors, 'Armures (1 max)']]) {
    const h = document.createElement('h3');
    h.textContent = label;
    box.appendChild(h);
    box.appendChild(itemRow('Aucun équipement', '', u[slot] === null, false,
      () => { u[slot] = null; openItemModal(u); }));
    for (const it of pool) {
      const holder = UI.game.alive(u.team).find(x => x.id !== u.id && (x.weapon === it.id || x.armor === it.id));
      box.appendChild(itemRow(it.name, modsText(it), u[slot] === it.id, !!holder,
        () => { u[slot] = u[slot] === it.id ? null : it.id; openItemModal(u); },
        holder ? `pris : ${CLASSES[holder.cls].name}` : ''));
    }
  }
  $('#item-modal').classList.remove('hidden');
}

function itemRow(name, mods, selected, disabled, onclick, note = '') {
  const d = document.createElement('div');
  d.className = 'item-row' + (selected ? ' selected' : '') + (disabled ? ' disabled' : '');
  d.innerHTML = `<b>${name}</b> ${mods}${note ? ` <small>(${note})</small>` : ''}`;
  if (!disabled) d.onclick = () => { SFX.ui(); onclick(); };
  return d;
}

function prepDone() {
  SFX.ui();
  if (UI.mode === '2p' && UI.prepTeam === 0) {
    UI.prepTeam = 1;
    renderPrep();
    window.scrollTo(0, 0);
    return;
  }
  startBattle();
}

// ---------- Bataille ----------
function startBattle() {
  UI.phase = 'idle';
  UI.sel = UI.target = UI.inspect = null;
  UI.startTime = Date.now();
  scene.syncUnits(UI.game);
  scene.setMode('battle');
  scene.setHighlights({});
  show('screen-game');
  updateTopBar();
  setPanel(hintText());
  banner(`Tour des ${TEAM_NAMES[0]}`, 'rgba(34, 52, 110, 0.92)');
}

function updateTopBar() {
  const g = UI.game;
  $('#turn-label').textContent = `Tour ${Math.ceil(g.turn / 2)}`;
  const ind = $('#team-indicator');
  ind.textContent = TEAM_NAMES[g.current];
  ind.className = g.current === 0 ? 'team-blue' : 'team-red';
  $('#sd-label').textContent = g.suddenDeath ? '☠ MORT SUBITE' :
    (g.turn > SUDDEN_DEATH - 10 ? `☠ dans ${Math.ceil((SUDDEN_DEATH - g.turn + 1) / 2)} tours` : '');
}

function setPanel(html, buttons = {}, unit = null) {
  $('#panel-text').innerHTML = html;
  showPortrait(unit);
  $('#btn-wait').classList.toggle('hidden', !buttons.wait);
  $('#btn-cancel').classList.toggle('hidden', !buttons.cancel);
  $('#btn-attack').classList.toggle('hidden', !buttons.attack);
  $('#btn-back').classList.toggle('hidden', !buttons.back);
}

function showPortrait(u) {
  const f = $('#portrait-frame');
  if (!u) { f.classList.remove('show'); return; }
  f.classList.add('show');
  const cv = unitCanvas(u.cls, u.team, 0);
  const c = $('#portrait');
  c.width = cv.width; c.height = cv.height;
  c.getContext('2d').drawImage(cv, 0, 0);
}

function unitInfo(u) {
  const s = stats(u), c = CLASSES[u.cls];
  const w = findItem(u.weapon), a = findItem(u.armor);
  return `<b class="${u.team === 0 ? 'team-blue' : 'team-red'}">${c.name}</b> ` +
    `<small>${WPN_NAMES[c.wpn]}${w || a ? ' · ' + [w, a].filter(Boolean).map(i => i.name).join(', ') : ''}</small>` +
    `<div class="stat-chips"><span>PV ${u.hp}/${s.hp}</span><span>Atq ${s.atk}</span>` +
    `<span>Déf ${s.def}</span><span>Tec ${s.tec}</span><span>Vit ${s.spd}</span><span>Mou ${s.mov}</span></div>`;
}

function banner(text, color) {
  const b = $('#banner');
  b.textContent = text;
  if (color) b.style.background =
    `linear-gradient(90deg, transparent 0%, ${color} 12%, ${color} 88%, transparent 100%)`;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
}

function floatAt(x, y, text, cls = '') {
  const d = document.createElement('div');
  d.className = 'floater ' + cls;
  d.textContent = text;
  const p = scene.screenPos(x, y, 1.25);
  d.style.left = p.left + 'px';
  d.style.top = p.top + 'px';
  $('#floaters').appendChild(d);
  setTimeout(() => d.remove(), 1100);
}

// ---------- Surlignages ----------
function refreshHighlights() {
  const h = { zone: UI.inspectZone };
  if (UI.phase === 'selected' && UI.reach) {
    h.move = UI.reach.tiles.map(t => [t.x, t.y]);
    h.attack = UI.envelope;
    h.cursor = [UI.sel.x, UI.sel.y];
  } else if (UI.phase === 'moved' && UI.sel) {
    h.attack = UI.game.targetsFrom(UI.sel, UI.sel.x, UI.sel.y).map(e => [e.x, e.y]);
    h.cursor = [UI.sel.x, UI.sel.y];
  } else if (UI.phase === 'preview' && UI.target) {
    h.cursor = [UI.sel.x, UI.sel.y];
    h.target = [UI.target.x, UI.target.y];
  }
  scene.setHighlights(h);
}

// ---------- Entrées ----------
function onTap(e) {
  if (!$('#screen-game').classList.contains('active')) return;
  if (UI.phase === 'anim' || UI.phase === 'over') return;
  if (UI.mode === 'ai' && UI.game.current === 1) return;
  const cell = scene.pick(e.clientX, e.clientY);
  if (!cell) return;
  const [x, y] = cell;
  const g = UI.game;
  const u = g.unitAt(x, y);

  if (UI.phase === 'preview') return;

  if (UI.phase === 'moved') {
    if (u && u.team !== g.current && g.targetsFrom(UI.sel, UI.sel.x, UI.sel.y).includes(u)) {
      openPreview(u);
    }
    return;
  }

  if (u && u.team === g.current) { selectUnit(u); return; }

  if (UI.phase === 'selected') {
    if (u && u.team !== g.current && UI.directs.has(u.id)) {
      const spot = UI.directs.get(u.id);
      SFX.move();
      moveAndThen(UI.sel, spot, () => openPreview(u));
      return;
    }
    const ok = UI.reach.tiles.some(t => t.x === x && t.y === y);
    if (ok) {
      SFX.move();
      moveAndThen(UI.sel, [x, y], () => afterMove());
      return;
    }
    deselect();
    setPanel(hintText());
    refreshHighlights();
    return;
  }

  // inspection (zone de menace)
  if (u) {
    UI.inspect = u;
    const { tiles } = g.reachable(u);
    const zone = new Set();
    for (const t of tiles.concat([{ x: u.x, y: u.y }]))
      for (const r of CLASSES[u.cls].rng)
        for (let dx = -r; dx <= r; dx++) {
          const dy = r - Math.abs(dx);
          for (const sy of dy === 0 ? [0] : [-1, 1]) {
            const ax = t.x + dx, ay = t.y + sy * dy;
            if (g.inBoard(ax, ay)) zone.add(ax + ',' + ay);
          }
        }
    UI.inspectZone = [...zone].map(s => s.split(',').map(Number));
    SFX.select();
    setPanel(unitInfo(u) + '<small>Zone de menace affichée.</small>', {}, u);
  } else {
    UI.inspect = null; UI.inspectZone = [];
    setPanel(hintText());
  }
  refreshHighlights();
}

function hintText() {
  return `<b>Tour des ${TEAM_NAMES[UI.game.current]}</b> — touchez une unité ${UI.game.current === 0 ? 'bleue' : 'rouge'}.`;
}

function selectUnit(u) {
  SFX.select();
  UI.sel = u;
  UI.inspect = null; UI.inspectZone = [];
  UI.phase = 'selected';
  UI.reach = UI.game.reachable(u);
  UI.envelope = [];
  UI.directs = new Map();
  const spots = UI.reach.tiles.concat([{ x: u.x, y: u.y, c: 0 }]);
  for (const e of UI.game.alive(1 - u.team)) {
    let best = null;
    for (const t of spots) {
      if (!CLASSES[u.cls].rng.includes(Math.abs(e.x - t.x) + Math.abs(e.y - t.y))) continue;
      const { evDealt, evTaken } = UI.game.expected(u, e, [t.x, t.y]);
      const score = evDealt - evTaken * 0.5 + UI.game.terrain(t.x, t.y).def;
      if (!best || score > best.score) best = { t, score };
    }
    if (best) {
      UI.directs.set(e.id, [best.t.x, best.t.y]);
      UI.envelope.push([e.x, e.y]);
    }
  }
  setPanel(unitInfo(u) + '<small>Touchez une case bleue pour bouger, un ennemi pour attaquer.</small>', {}, u);
  refreshHighlights();
}

function deselect() {
  UI.sel = null; UI.reach = null; UI.envelope = []; UI.directs = new Map();
  UI.phase = 'idle';
}

function moveAndThen(u, [tx, ty], then) {
  UI.origin = [u.x, u.y];
  const p = UI.game.path(u, UI.reach.cost, tx, ty);
  UI.phase = 'anim';
  scene.setHighlights({});
  scene.moveUnit(u, p).then(() => { UI.phase = 'moved'; then(); refreshHighlights(); });
}

function afterMove() {
  const targets = UI.game.targetsFrom(UI.sel, UI.sel.x, UI.sel.y);
  setPanel(unitInfo(UI.sel) +
    `<small>${targets.length ? 'Touchez un ennemi à portée, ou attendez.' : 'Aucun ennemi à portée.'}</small>`,
    { wait: true, cancel: true }, UI.sel);
}

function openPreview(target) {
  UI.target = target;
  UI.phase = 'preview';
  const f = UI.game.forecast(UI.sel, target, [UI.sel.x, UI.sel.y]);
  const a = UI.sel, d = target;
  const side = (u, st, dbl, counterNote) => {
    if (!st) return `<div class="fc-row ${u.team === 0 ? 'team-blue' : 'team-red'}">` +
      `<b>${CLASSES[u.cls].name}</b> <small>PV ${u.hp}</small> — <small>pas de riposte</small></div>`;
    return `<div class="fc-row ${u.team === 0 ? 'team-blue' : 'team-red'}">` +
      `<b>${CLASSES[u.cls].name}</b> <small>PV ${u.hp}</small>` +
      `<span class="fc-chips"><span>${st.dmg} dgt${dbl ? ' ×2' : ''}</span>` +
      `<span>${st.hit} %</span><span>crit ${st.crit} %</span>${counterNote ? '<span>riposte</span>' : ''}</span></div>`;
  };
  setPanel(
    `<div class="forecast">` +
    side(a, f.A, f.dblA, false) +
    side(d, f.D, f.dblD && f.canCounter, true) +
    (f.vantage ? `<div class="fc-warn">⚠ Prévoyance : le défenseur, plus rapide, riposte en premier !</div>` : '') +
    `</div>`,
    { attack: true, back: true }, a);
  SFX.select();
  refreshHighlights();
}

// ---------- Actions ----------
function actWait() { SFX.ui(); finishAction(); }

function actCancel() {
  SFX.ui();
  if (UI.origin) {
    UI.sel.x = UI.origin[0]; UI.sel.y = UI.origin[1];
    scene.place(UI.sel);
  }
  deselect();
  setPanel(hintText());
  refreshHighlights();
}

function actBack() {
  SFX.ui();
  UI.target = null;
  UI.phase = 'moved';
  afterMove();
  refreshHighlights();
}

function actAttack() {
  const att = UI.sel, def = UI.target;
  UI.phase = 'anim';
  setPanel('');
  scene.setHighlights({});
  const strikes = UI.game.resolveCombat(att, def, [att.x, att.y]);
  animCombat(att, def, strikes).then(() => finishAction());
}

async function animCombat(att, def, strikes) {
  await scene.focusDuel(att, def);
  for (const st of strikes) {
    const actor = st.who === 'A' ? att : def;
    const victim = st.who === 'A' ? def : att;
    await scene.lunge(actor, victim);
    if (st.hit) {
      if (st.crit) SFX.crit(); else SFX.hit();
      scene.flash(victim, st.crit ? 220 : 130);
      scene.sparks(victim.x, victim.y, st.crit || st.kill);
      scene.updateHp(victim, stats(victim).hp);
      floatAt(victim.x, victim.y, `-${st.dmg}`, st.crit ? 'crit' : '');
      if (st.crit) floatAt(victim.x, victim.y - 0.0, 'CRITIQUE !', 'critlabel');
    } else {
      SFX.miss();
      await scene.dodge(victim, actor);
      floatAt(victim.x, victim.y, 'esquivé', 'miss');
    }
    if (st.kill) {
      await sleep(160);
      SFX.kill();
      await scene.fadeOut(victim);
    }
    await sleep(230);
  }
  await scene.unfocus();
}

function finishAction() {
  const g = UI.game;
  deselect();
  scene.setHighlights({});
  if (g.winner !== null) return endGame();
  g.endTurn();
  scene.syncUnits(g); // morts d'usure éventuelles
  for (const u of g.units) if (!u.dead) scene.updateHp(u, stats(u).hp);
  if (g.winner !== null) return endGame();
  updateTopBar();
  if (g.suddenDeath && g.turn === SUDDEN_DEATH + 1)
    banner('☠ MORT SUBITE', 'rgba(20, 12, 14, 0.94)');
  else
    banner(`Tour des ${TEAM_NAMES[g.current]}`,
      g.current === 0 ? 'rgba(34, 52, 110, 0.92)' : 'rgba(110, 32, 36, 0.92)');
  setPanel(hintText());
  if (UI.mode === 'ai' && g.current === 1) {
    UI.phase = 'anim';
    setTimeout(aiPlay, 600);
  } else {
    UI.phase = 'idle';
  }
}

async function aiPlay() {
  const g = UI.game;
  const mv = aiChooseMove(g, 1, UI.difficulty);
  if (!mv) { finishAction(); return; }
  const u = mv.unit;
  setPanel(unitInfo(u), {}, u);
  const { cost } = g.reachable(u);
  if (mv.dest[0] !== u.x || mv.dest[1] !== u.y) {
    SFX.move();
    await scene.moveUnit(u, g.path(u, cost, mv.dest[0], mv.dest[1]));
  }
  if (mv.target && !mv.target.dead) {
    await sleep(320);
    const strikes = g.resolveCombat(u, mv.target, [u.x, u.y]);
    await animCombat(u, mv.target, strikes);
  } else {
    await sleep(240);
  }
  finishAction();
}

// ---------- Fin ----------
function endGame() {
  UI.phase = 'over';
  const g = UI.game;
  const mins = Math.round((Date.now() - UI.startTime) / 60000 * 10) / 10;
  SFX.win();
  setTimeout(() => {
    $('#crest-end').getContext('2d').drawImage(crestCanvas(g.winner), 0, 0);
    $('#end-title').textContent = `Victoire des ${TEAM_NAMES[g.winner]} !`;
    $('#end-title').className = g.winner === 0 ? 'team-blue' : 'team-red';
    $('#end-sub').textContent =
      `${Math.ceil(g.turn / 2)} tours · ${mins} min` +
      (UI.mode === 'ai' ? (g.winner === 0 ? ' · Bravo, l’IA est vaincue !' : ' · L’IA l’emporte…') : '');
    scene.setMode('menu');
    show('screen-end');
  }, 900);
}

// exposé pour les tests automatisés
window.UI = UI;
window.__game = () => UI.game;
window.__hooks = { selectUnit, moveAndThen, openPreview, actAttack, actWait, afterMove, aiChooseMove };
