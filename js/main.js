// ============================================================
// Échec & Lame — interface, rendu, animations, entrées tactiles
// ============================================================
'use strict';

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ---------- État global de l'UI ------------------------------
const UI = {
  mode: 'ai',            // 'ai' | '2p'
  difficulty: 'normal',  // 'normal' | 'hard'
  game: null,
  phase: 'idle',         // idle | selected | moved | preview | anim | over
  sel: null,             // unité sélectionnée
  reach: null,           // {tiles, cost}
  envelope: [],          // cases attaquables (sélection)
  directs: new Map(),    // id ennemi -> meilleure case d'attaque
  origin: null,          // position avant déplacement (pour annuler)
  target: null,          // cible en prévisualisation
  inspect: null,         // unité inspectée (ennemi/allié)
  inspectZone: [],
  prepTeam: 0,
  startTime: 0,
  muted: localStorage.getItem('el_mute') === '1',
};

const FX = {
  offsets: {},   // id -> [dx, dy] en px (animations)
  flash: {},     // id -> timestamp de fin de flash
  fade: {},      // id -> alpha (mort)
  popups: [],    // {x, y, text, born, color}
  sparks: [],    // étincelles d'impact (en px du calque fx)
  rings: [],     // ondes de choc
  motes: [],     // poussières lumineuses ambiantes
  embers: [],    // braises de l'écran titre
  shake: 0,      // timestamp de fin de tremblement
};

const TILE = 24, SCALE = 4; // fx = 192*4 = 768
let cv, ctx, fx, fxctx, menuBg, menuCtx;

// ---------- Sons (WebAudio, synthèse minimaliste) -------------
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
  } catch (e) { /* audio non disponible */ }
}
const SFX = {
  ui: () => beep(880, 0.05),
  select: () => beep(660, 0.06),
  move: () => beep(440, 0.05, 'triangle'),
  hit: () => beep(150, 0.12, 'sawtooth', 0.18, -90),
  miss: () => beep(300, 0.06, 'triangle', 0.08),
  kill: () => { beep(220, 0.2, 'sawtooth', 0.18, -160); setTimeout(() => beep(110, 0.25, 'sawtooth', 0.15, -70), 90); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'square', 0.1), i * 130)); },
};

// ---------- Navigation entre écrans ---------------------------
function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
}

// ---------- Initialisation ------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  cv = $('#board'); ctx = cv.getContext('2d');
  fx = $('#fx'); fxctx = fx.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // blasons (écran titre et écran de fin)
  $('#crest').getContext('2d').drawImage(getCrest(0), 0, 0);

  // fond animé (braises) derrière tous les écrans
  menuBg = $('#menu-bg'); menuCtx = menuBg.getContext('2d');
  const resize = () => { menuBg.width = innerWidth; menuBg.height = innerHeight; };
  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 36; i++) FX.embers.push(newEmber(true));
  for (let i = 0; i < 18; i++) FX.motes.push({
    x: Math.random() * 768, y: Math.random() * 768,
    vx: 4 + Math.random() * 8, vy: -3 - Math.random() * 7,
    ph: Math.random() * 6.28, r: 2 + Math.random() * 3,
  });

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
  $('#btn-quit').onclick = () => { if (confirm('Abandonner la partie ?')) show('screen-menu'); };
  $('#btn-mute').onclick = toggleMute;
  $('#btn-again').onclick = () => { SFX.ui(); startPrep(); };
  $('#btn-menu').onclick = () => { SFX.ui(); show('screen-menu'); };
  updateMuteBtn();

  cv.addEventListener('pointerdown', onTap);
  requestAnimationFrame(loop);
  show('screen-menu');
});

function toggleMute() {
  UI.muted = !UI.muted;
  localStorage.setItem('el_mute', UI.muted ? '1' : '0');
  updateMuteBtn();
}
function updateMuteBtn() { $('#btn-mute').textContent = UI.muted ? '🔇' : '🔊'; }

// ---------- Préparation (équipement) ---------------------------
function startPrep() {
  UI.game = new Game();
  UI.prepTeam = 0;
  if (UI.mode === 'ai') autoEquip(UI.game, 1);
  show('screen-prep');
  renderPrep();
}

function clearEquip(team) {
  for (const u of UI.game.alive(team)) { u.weapon = null; u.armor = null; }
}

function statLine(u) {
  const base = CLASSES[u.cls], s = stats(u);
  return ['hp', 'atk', 'def', 'spd', 'mov'].map(k => {
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
    const mini = document.createElement('canvas');
    mini.width = 24; mini.height = 24; mini.className = 'mini';
    mini.getContext('2d').drawImage(getSprite(u.cls, t), 0, 0);
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
  const team = u.team;
  $('#item-title').textContent = `${CLASSES[u.cls].name} — choisir l'équipement`;
  const box = $('#item-lists');
  box.innerHTML = '';
  for (const [slot, pool, label] of [['weapon', ITEMS.weapons, 'Armes (1 max)'], ['armor', ITEMS.armors, 'Armures (1 max)']]) {
    const h = document.createElement('h3');
    h.textContent = label;
    box.appendChild(h);
    const none = itemRow('Aucun équipement', '', u[slot] === null, false,
      () => { u[slot] = null; openItemModal(u); });
    box.appendChild(none);
    for (const it of pool) {
      const holder = UI.game.alive(team).find(x => x.id !== u.id && (x.weapon === it.id || x.armor === it.id));
      const row = itemRow(it.name, modsText(it), u[slot] === it.id, !!holder,
        () => { u[slot] = u[slot] === it.id ? null : it.id; openItemModal(u); },
        holder ? `pris : ${CLASSES[holder.cls].name}` : '');
      box.appendChild(row);
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

// ---------- Démarrage de la bataille ---------------------------
function startBattle() {
  UI.phase = 'idle';
  UI.sel = UI.target = UI.inspect = null;
  UI.startTime = Date.now();
  FX.popups = []; FX.sparks = []; FX.rings = [];
  FX.offsets = {}; FX.flash = {}; FX.fade = {};
  show('screen-game');
  updateTopBar();
  setPanel(`<b>Tour des ${TEAM_NAMES[0]}</b> — touchez une unité bleue pour commencer.`);
  banner(`Tour des ${TEAM_NAMES[0]}`, 'rgba(34, 52, 110, 0.92)');
}

// ---------- Barre du haut / panneau ----------------------------
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
  const c = $('#portrait').getContext('2d');
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, 24, 24);
  c.drawImage(getSprite(u.cls, u.team), 0, 0);
}

function unitInfo(u) {
  const s = stats(u), c = CLASSES[u.cls];
  const w = findItem(u.weapon), a = findItem(u.armor);
  return `<b class="${u.team === 0 ? 'team-blue' : 'team-red'}">${c.name}</b> ` +
    `<small>${WPN_NAMES[c.wpn]}${w || a ? ' · ' + [w, a].filter(Boolean).map(i => i.name).join(', ') : ''}</small>` +
    `<div class="stat-chips"><span>PV ${u.hp}/${s.hp}</span><span>Atq ${s.atk}</span>` +
    `<span>Déf ${s.def}</span><span>Vit ${s.spd}</span><span>Mou ${s.mov}</span></div>`;
}

function banner(text, color) {
  const b = $('#banner');
  b.textContent = text;
  if (color) b.style.background =
    `linear-gradient(90deg, transparent 0%, ${color} 12%, ${color} 88%, transparent 100%)`;
  b.classList.remove('show');
  void b.offsetWidth; // relance l'animation CSS
  b.classList.add('show');
}

// ---------- Entrées tactiles ------------------------------------
function cellFromEvent(e) {
  const r = cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * BOARD);
  const y = Math.floor((e.clientY - r.top) / r.height * BOARD);
  return [Math.min(BOARD - 1, Math.max(0, x)), Math.min(BOARD - 1, Math.max(0, y))];
}

function onTap(e) {
  if (UI.phase === 'anim' || UI.phase === 'over') return;
  if (UI.mode === 'ai' && UI.game.current === 1) return; // tour de l'IA
  const [x, y] = cellFromEvent(e);
  const g = UI.game;
  const u = g.unitAt(x, y);

  if (UI.phase === 'preview') return; // choisir via les boutons

  if (UI.phase === 'moved') {
    // seule action par case : choisir une cible à portée
    if (u && u.team !== g.current && g.targetsFrom(UI.sel, UI.sel.x, UI.sel.y).includes(u)) {
      openPreview(u);
    }
    return;
  }

  // phase idle / selected
  if (u && u.team === g.current) {
    selectUnit(u);
    return;
  }
  if (UI.phase === 'selected') {
    if (u && u.team !== g.current && UI.directs.has(u.id)) {
      // attaque directe : se déplace automatiquement au meilleur poste
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
    return;
  }
  // inspection d'une unité ennemie (zone de menace)
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
  // enveloppe d'attaque + meilleure case par cible
  UI.envelope = [];
  UI.directs = new Map();
  const spots = UI.reach.tiles.concat([{ x: u.x, y: u.y, c: 0 }]);
  for (const e of UI.game.alive(1 - u.team)) {
    let best = null;
    for (const t of spots) {
      if (!CLASSES[u.cls].rng.includes(Math.abs(e.x - t.x) + Math.abs(e.y - t.y))) continue;
      const f = UI.game.forecast(u, e, [t.x, t.y]);
      const score = f.dmgA * (f.dblA ? 2 : 1) - (f.canCounter ? f.dmgD * 0.5 : 0)
        + UI.game.terrain(t.x, t.y).def;
      if (!best || score > best.score) best = { t, score };
    }
    if (best) {
      UI.directs.set(e.id, [best.t.x, best.t.y]);
      UI.envelope.push([e.x, e.y]);
    }
  }
  setPanel(unitInfo(u) + '<small>Touchez une case bleue pour bouger, un ennemi pour attaquer.</small>', {}, u);
}

function deselect() {
  UI.sel = null; UI.reach = null; UI.envelope = []; UI.directs = new Map();
  UI.phase = 'idle';
}

// déplace l'unité (animation) puis enchaîne
function moveAndThen(u, [tx, ty], then) {
  UI.origin = [u.x, u.y];
  const p = UI.game.path(u, UI.reach.cost, tx, ty);
  UI.phase = 'anim';
  animMove(u, p).then(() => { UI.phase = 'moved'; then(); });
}

function afterMove() {
  const targets = UI.game.targetsFrom(UI.sel, UI.sel.x, UI.sel.y);
  if (targets.length)
    setPanel(unitInfo(UI.sel) + '<small>Touchez un ennemi à portée, ou attendez.</small>',
      { wait: true, cancel: true }, UI.sel);
  else
    setPanel(unitInfo(UI.sel) + '<small>Aucun ennemi à portée.</small>',
      { wait: true, cancel: true }, UI.sel);
}

function openPreview(target) {
  UI.target = target;
  UI.phase = 'preview';
  const f = UI.game.forecast(UI.sel, target, [UI.sel.x, UI.sel.y]);
  const a = UI.sel, d = target;
  const line = (u, dmg, dbl, label) =>
    `<div class="fc-row ${u.team === 0 ? 'team-blue' : 'team-red'}">` +
    `<b>${CLASSES[u.cls].name}</b> PV ${u.hp} → <b>${label}</b>${dbl ? ' ×2' : ''}</div>`;
  setPanel(
    `<div class="forecast">` +
    line(a, f.dmgA, f.dblA, `${f.dmgA} dgt`) +
    line(d, f.dmgD, f.dblD && f.canCounter, f.canCounter ? `${f.dmgD} dgt (riposte)` : 'pas de riposte') +
    (f.vantage ? `<div class="fc-warn">⚠ Prévoyance : le défenseur, plus rapide, riposte en premier !</div>` : '') +
    `</div>`,
    { attack: true, back: true }, a);
  SFX.select();
}

// ---------- Actions ----------------------------------------------
function actWait() {
  SFX.ui();
  finishAction();
}

function actCancel() {
  SFX.ui();
  // revient à la position d'origine
  if (UI.origin) { UI.sel.x = UI.origin[0]; UI.sel.y = UI.origin[1]; }
  deselect();
  setPanel(hintText());
}

function actBack() {
  SFX.ui();
  UI.target = null;
  UI.phase = 'moved';
  afterMove();
}

function actAttack() {
  const att = UI.sel, def = UI.target;
  UI.phase = 'anim';
  setPanel('');
  const strikes = UI.game.resolveCombat(att, def, [att.x, att.y]);
  animCombat(att, def, strikes).then(() => finishAction());
}

function finishAction() {
  const g = UI.game;
  deselect();
  if (g.winner !== null) return endGame();
  g.endTurn();
  if (g.winner !== null) return endGame(); // mort subite
  updateTopBar();
  if (g.suddenDeath && g.turn === SUDDEN_DEATH + 1)
    banner('☠ MORT SUBITE', 'rgba(20, 12, 14, 0.94)');
  else
    banner(`Tour des ${TEAM_NAMES[g.current]}`,
      g.current === 0 ? 'rgba(34, 52, 110, 0.92)' : 'rgba(110, 32, 36, 0.92)');
  setPanel(hintText());
  if (UI.mode === 'ai' && g.current === 1) {
    UI.phase = 'anim';
    setTimeout(aiPlay, 650);
  } else {
    UI.phase = 'idle';
  }
}

// ---------- Tour de l'IA -------------------------------------------
async function aiPlay() {
  const g = UI.game;
  const mv = aiChooseMove(g, 1, UI.difficulty);
  if (!mv) { UI.phase = 'idle'; finishAction(); return; }
  const u = mv.unit;
  setPanel(unitInfo(u), {}, u);
  const { cost } = g.reachable(u);
  if (mv.dest[0] !== u.x || mv.dest[1] !== u.y) {
    SFX.move();
    await animMove(u, g.path(u, cost, mv.dest[0], mv.dest[1]));
  }
  if (mv.target && !mv.target.dead) {
    await sleep(350);
    const strikes = g.resolveCombat(u, mv.target, [u.x, u.y]);
    await animCombat(u, mv.target, strikes);
  } else {
    await sleep(250);
  }
  finishAction();
}

// ---------- Animations ----------------------------------------------
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function animMove(u, path) {
  for (let i = 1; i < path.length; i++) {
    const [fx0, fy0] = path[i - 1], [tx, ty] = path[i];
    const t0 = performance.now(), dur = 90;
    u.x = tx; u.y = ty;
    while (performance.now() - t0 < dur) {
      const k = 1 - (performance.now() - t0) / dur;
      FX.offsets[u.id] = [(fx0 - tx) * TILE * k, (fy0 - ty) * TILE * k - Math.sin((1 - k) * Math.PI) * 4];
      await sleep(16);
    }
    delete FX.offsets[u.id];
  }
}

function spawnImpact(x, y, big) {
  // coordonnées du calque fx (board px * SCALE)
  const cx = (x * TILE + TILE / 2) * SCALE, cy = (y * TILE + TILE / 2) * SCALE;
  const n = big ? 16 : 10;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, sp = (2 + Math.random() * 5) * (big ? 1.5 : 1);
    FX.sparks.push({
      x: cx, y: cy,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
      born: performance.now(), life: 320 + Math.random() * 180,
      color: ['#fff6d8', '#ffe14d', '#ffab4d', '#ffffff'][i % 4],
      size: 3 + Math.random() * 4,
    });
  }
  FX.rings.push({ x: cx, y: cy, born: performance.now() });
}

async function animCombat(att, def, strikes) {
  for (const st of strikes) {
    const actor = st.who === 'A' ? att : def;
    const victim = st.who === 'A' ? def : att;
    // petite charge vers la cible
    const dx = Math.sign(victim.x - actor.x), dy = Math.sign(victim.y - actor.y);
    const t0 = performance.now(), dur = 160;
    while (performance.now() - t0 < dur) {
      const p = (performance.now() - t0) / dur;
      const k = Math.sin(p * Math.PI) * 7;
      FX.offsets[actor.id] = [dx * k, dy * k];
      await sleep(16);
    }
    delete FX.offsets[actor.id];
    // impact
    SFX.hit();
    FX.flash[victim.id] = performance.now() + 140;
    FX.shake = performance.now() + 130;
    spawnImpact(victim.x, victim.y, st.kill);
    FX.popups.push({
      x: victim.x, y: victim.y, born: performance.now(),
      text: `-${st.dmg}`, color: '#ffe14d',
    });
    if (st.kill) {
      await sleep(180);
      SFX.kill();
      const t1 = performance.now(), d1 = 380;
      while (performance.now() - t1 < d1) {
        FX.fade[victim.id] = 1 - (performance.now() - t1) / d1;
        await sleep(16);
      }
      delete FX.fade[victim.id];
    }
    await sleep(220);
  }
}

// ---------- Fin de partie ---------------------------------------------
function endGame() {
  UI.phase = 'over';
  const g = UI.game;
  const mins = Math.round((Date.now() - UI.startTime) / 60000 * 10) / 10;
  SFX.win();
  setTimeout(() => {
    $('#crest-end').getContext('2d').drawImage(getCrest(g.winner), 0, 0);
    $('#end-title').textContent = `Victoire des ${TEAM_NAMES[g.winner]} !`;
    $('#end-title').className = g.winner === 0 ? 'team-blue' : 'team-red';
    $('#end-sub').textContent =
      `${Math.ceil(g.turn / 2)} tours · ${mins} min` +
      (UI.mode === 'ai' ? (g.winner === 0 ? ' · Bravo, l’IA est vaincue !' : ' · L’IA l’emporte…') : '');
    show('screen-end');
  }, 900);
}

// ---------- Braises du fond (tous écrans) -------------------------------
function newEmber(anywhere) {
  return {
    x: Math.random() * innerWidth,
    y: anywhere ? Math.random() * innerHeight : innerHeight + 10,
    vy: 0.25 + Math.random() * 0.55,
    sway: 0.4 + Math.random() * 0.9,
    ph: Math.random() * 6.28,
    r: 1 + Math.random() * 2.2,
    gold: Math.random() < 0.7,
  };
}

function drawEmbers(now) {
  menuCtx.clearRect(0, 0, menuBg.width, menuBg.height);
  for (let i = 0; i < FX.embers.length; i++) {
    let e = FX.embers[i];
    e.y -= e.vy;
    e.x += Math.sin(now / 1700 + e.ph) * e.sway * 0.4;
    if (e.y < -12) { FX.embers[i] = e = newEmber(false); }
    const tw = 0.45 + 0.4 * Math.sin(now / 480 + e.ph * 3);
    menuCtx.globalAlpha = Math.max(0, tw) * 0.7;
    menuCtx.fillStyle = e.gold ? '#ffce63' : '#b48cff';
    menuCtx.beginPath();
    menuCtx.arc(e.x, e.y, e.r, 0, 6.28);
    menuCtx.fill();
  }
  menuCtx.globalAlpha = 1;
}

// ---------- Boucle de rendu ---------------------------------------------
function loop(now) {
  requestAnimationFrame(loop);
  drawEmbers(now);
  if ($('#screen-game').classList.contains('active') && UI.game) drawGame(now);
}

function drawCorners(px, py, color, off) {
  const L = 7;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const x0 = px + 1 - off, y0 = py + 1 - off, x1 = px + TILE - 1 + off, y1 = py + TILE - 1 + off;
  ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0);
  ctx.moveTo(x1 - L, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L);
  ctx.moveTo(x1, y1 - L); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L, y1);
  ctx.moveTo(x0 + L, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L);
  ctx.stroke();
}

function drawGame(now) {
  const g = UI.game;

  // tremblement d'écran
  let sx = 0, sy = 0;
  if (FX.shake > now) { sx = (Math.random() - 0.5) * 4; sy = (Math.random() - 0.5) * 4; }
  ctx.setTransform(1, 0, 0, 1, sx, sy);
  ctx.clearRect(-6, -6, cv.width + 12, cv.height + 12);

  // terrain + décorations déterministes
  for (let y = 0; y < BOARD; y++)
    for (let x = 0; x < BOARD; x++) {
      const tname = MAP[y][x] === 1 ? 'forest' : ((x + y) % 2 ? 'grassB' : 'grassA');
      ctx.drawImage(getTile(tname), x * TILE, y * TILE);
      if (MAP[y][x] === 0) {
        const h = (x * 53 + y * 97 + 11) % 23;
        if (h === 3) ctx.drawImage(getTile('flowers'), x * TILE, y * TILE);
        else if (h === 7 || h === 15) ctx.drawImage(getTile('tufts'), x * TILE, y * TILE);
      }
    }

  // surlignages
  const pulse = 0.5 + 0.5 * Math.sin(now / 240);
  if (UI.inspect && UI.inspectZone.length) {
    ctx.fillStyle = `rgba(255, 150, 40, ${0.28 + pulse * 0.1})`;
    for (const [x, y] of UI.inspectZone) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  }
  if (UI.phase === 'selected' && UI.reach) {
    for (const t of UI.reach.tiles) {
      ctx.fillStyle = `rgba(80, 140, 255, ${0.32 + pulse * 0.08})`;
      ctx.fillRect(t.x * TILE, t.y * TILE, TILE, TILE);
      ctx.strokeStyle = 'rgba(180, 215, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(t.x * TILE + 0.5, t.y * TILE + 0.5, TILE - 1, TILE - 1);
    }
    ctx.fillStyle = `rgba(255, 60, 60, ${0.38 + pulse * 0.12})`;
    for (const [x, y] of UI.envelope) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  }
  if (UI.phase === 'moved' && UI.sel) {
    ctx.fillStyle = `rgba(255, 60, 60, ${0.38 + pulse * 0.12})`;
    for (const e of g.targetsFrom(UI.sel, UI.sel.x, UI.sel.y))
      ctx.fillRect(e.x * TILE, e.y * TILE, TILE, TILE);
  }
  if (UI.phase === 'preview' && UI.target)
    drawCorners(UI.target.x * TILE, UI.target.y * TILE, '#ff5040', Math.round(pulse * 2));

  // curseur de sélection (coins animés)
  if (UI.sel) drawCorners(UI.sel.x * TILE, UI.sel.y * TILE, '#fdf6e0', Math.round(pulse * 2));

  // unités (triées par y pour la profondeur)
  const units = g.units.filter(u => !u.dead || FX.fade[u.id] !== undefined)
    .sort((a, b) => a.y - b.y);
  for (const u of units) {
    const off = FX.offsets[u.id] || [0, 0];
    const bob = (u.team === g.current && UI.phase !== 'over') ? (Math.floor(now / 380) % 2) : 0;
    const px = u.x * TILE + off[0], py = u.y * TILE + off[1] - bob;
    const fade = FX.fade[u.id];
    if (fade !== undefined) ctx.globalAlpha = fade;

    // ombre portée
    ctx.fillStyle = 'rgba(12, 10, 24, 0.34)';
    ctx.beginPath();
    ctx.ellipse(u.x * TILE + TILE / 2 + off[0] * 0.4, u.y * TILE + TILE - 2.5, 7.5, 2.6, 0, 0, 6.28);
    ctx.fill();

    ctx.drawImage(getSprite(u.cls, u.team), px, py);
    if (FX.flash[u.id] > now) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 3, py + 1, TILE - 6, TILE - 2);
      ctx.globalAlpha = fade !== undefined ? fade : 1;
    }
    ctx.globalAlpha = 1;

    // barre de PV (seulement si l'unité est blessée)
    const sMax = stats(u).hp;
    if (!u.dead && u.hp < sMax) {
      const ratio = u.hp / sMax;
      const cols = ratio > 0.55 ? ['#46d846', '#8df08d'] : ratio > 0.28 ? ['#ffd23c', '#ffe98e'] : ['#ff5040', '#ff9a8e'];
      ctx.fillStyle = 'rgba(10, 10, 22, 0.85)';
      ctx.fillRect(px + 3, py + TILE - 4, 18, 4);
      const w = Math.max(1, Math.round(16 * ratio));
      ctx.fillStyle = cols[1];
      ctx.fillRect(px + 4, py + TILE - 3, w, 1);
      ctx.fillStyle = cols[0];
      ctx.fillRect(px + 4, py + TILE - 2, w, 1);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // ---- calque effets (texte net, lumière, particules) ----
  fxctx.clearRect(0, 0, fx.width, fx.height);

  // balayage de lumière diagonal très doux
  const lt = (now / 16000) % 1;
  const span = fx.height * 0.5;
  const ly = -span + (fx.height + 2 * span) * lt;
  const grad = fxctx.createLinearGradient(0, ly - span, fx.width, ly + span);
  grad.addColorStop(0, 'rgba(255, 238, 190, 0)');
  grad.addColorStop(0.5, 'rgba(255, 238, 190, 0.085)');
  grad.addColorStop(1, 'rgba(255, 238, 190, 0)');
  fxctx.fillStyle = grad;
  fxctx.fillRect(0, 0, fx.width, fx.height);

  // poussières lumineuses
  for (const m of FX.motes) {
    m.x += m.vx * 0.016; m.y += m.vy * 0.016;
    if (m.y < -8) { m.y = fx.height + 8; m.x = Math.random() * fx.width; }
    if (m.x > fx.width + 8) m.x = -8;
    fxctx.globalAlpha = 0.10 + 0.09 * Math.sin(now / 700 + m.ph);
    fxctx.fillStyle = '#ffeebe';
    fxctx.beginPath();
    fxctx.arc(m.x, m.y, m.r, 0, 6.28);
    fxctx.fill();
  }
  fxctx.globalAlpha = 1;

  // ondes de choc
  FX.rings = FX.rings.filter(r => now - r.born < 260);
  for (const r of FX.rings) {
    const age = (now - r.born) / 260;
    fxctx.globalAlpha = (1 - age) * 0.65;
    fxctx.strokeStyle = '#fff2c8';
    fxctx.lineWidth = 3 * (1 - age) + 1;
    fxctx.beginPath();
    fxctx.arc(r.x, r.y, 6 + age * 46, 0, 6.28);
    fxctx.stroke();
  }

  // étincelles
  FX.sparks = FX.sparks.filter(s => now - s.born < s.life);
  for (const s of FX.sparks) {
    const age = (now - s.born) / s.life;
    s.x += s.vx; s.y += s.vy; s.vy += 0.22;
    fxctx.globalAlpha = 1 - age;
    fxctx.fillStyle = s.color;
    fxctx.fillRect(s.x, s.y, s.size * (1 - age * 0.5), s.size * (1 - age * 0.5));
  }
  fxctx.globalAlpha = 1;

  // dégâts flottants
  fxctx.textAlign = 'center';
  fxctx.font = `bold ${8 * SCALE}px Georgia, serif`;
  FX.popups = FX.popups.filter(p => now - p.born < 850);
  for (const p of FX.popups) {
    const age = (now - p.born) / 850;
    const yy = (p.y * TILE + 6 - age * 14) * SCALE;
    const xx = (p.x * TILE + TILE / 2) * SCALE;
    fxctx.globalAlpha = 1 - age * age;
    fxctx.lineWidth = 6;
    fxctx.strokeStyle = 'rgba(16, 10, 26, 0.9)';
    fxctx.strokeText(p.text, xx, yy);
    fxctx.fillStyle = p.color;
    fxctx.fillText(p.text, xx, yy);
  }
  fxctx.globalAlpha = 1;
}
