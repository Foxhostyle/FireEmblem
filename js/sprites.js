// ============================================================
// Échec & Lame — sprites pixel art 16x16 dessinés en grilles
// ============================================================
'use strict';

// Légende : . transparent  O contour  S peau  s peau ombrée
// P couleur d'équipe  p équipe sombre  M métal  m métal sombre
// H cheveux  h cheveux ombrés  W bois  G or  w blanc  K gris sombre
const PALETTES = {
  base: {
    O: '#14121f', S: '#f2c896', s: '#cf9d6a', M: '#cdd5e1', m: '#828ca0',
    W: '#9a6230', G: '#ecc23c', w: '#f5f5f0', K: '#3a3f4d',
  },
  team: [
    { P: '#4d7fdd', p: '#2b4a9b', H: '#e8c84a', h: '#b3932a' }, // bleus
    { P: '#d8504a', p: '#92262c', H: '#7a4a8f', h: '#542f66' }, // rouges
  ],
};

// Chaque sprite : 16 lignes de 16 caractères.
const SPRITES = {
  // ---- Seigneur : épée levée, cape, diadème -----------------
  lord: [
    '..........O.....',
    '.....OOO..OMO...',
    '....OHHHO.OMO...',
    '...OGHHHGOOMO...',
    '...OHSSSHOOMO...',
    '...OHSOSOOOMO...',
    '....OSSSO.OMO...',
    '...OOPPPOOOWO...',
    '..OpPPPPPOSO....',
    '..OpPGPPPPSO....',
    '..OpPGPPPOO.....',
    '..OOPPPPPO......',
    '...OpPPPpO......',
    '...OpO.OpO......',
    '..OKKO.OKKO.....',
    '................',
  ],
  // ---- Soldat : casque rond, lance verticale ----------------
  soldier: [
    '...........OO...',
    '....OOO....OGO..',
    '...OMMMO...OWO..',
    '..OMMMMMO..OWO..',
    '..OmSSSmO..OWO..',
    '...OSOSO...OWO..',
    '....OSSO...OWO..',
    '...OPPPPO.OSWO..',
    '..OpPPPPPOOWO...',
    '..OpPPPPPO.OWO..',
    '..OOpPPpOO.OWO..',
    '...OpPPpO..OWO..',
    '...OPO.PO..OWO..',
    '..OKO..OKO.OWO..',
    '...........OO...',
    '................',
  ],
  // ---- Cavalier : monture + cavalier à l'épée ----------------
  cavalier: [
    '......OOO.......',
    '.....OHHHO..O...',
    '.....OSSSO.OMO..',
    '.....OSOSO.OMO..',
    '....OOPPPOOMO...',
    '...OpPPPPPSO....',
    '...OpPPPPOO.....',
    '..OOOPPPOOOO....',
    '.OWWWPPPWWWWO...',
    'OWWWWWWWWWWWWO..',
    'OWOWWWWWWWWOWO..',
    'OWO.OWWWWO..OWO.',
    '.OO.OWO.OWO.OWO.',
    '....OKO..OKO.OO.',
    '....OO....OO....',
    '................',
  ],
  // ---- Chevalier : armure massive, hache ---------------------
  knight: [
    '................',
    '...OOOOO...OO...',
    '..OMMMMMO.OGGO..',
    '..OMPMPMO.OGGOO.',
    '..OmmSmmO..OWOO.',
    '..OMSOSMO..OWO..',
    '..OOMMMOO..OWO..',
    '.OMMPPPMMO.OWO..',
    'OMmPPPPPmMOSWO..',
    'OMmPpPpPmMOOWO..',
    'OOOPPPPPOOOOWO..',
    '..OpPPPpO..OWO..',
    '..OMMOMMO..OWO..',
    '.OMMO.OMMO.OO...',
    '.OOO...OOO......',
    '................',
  ],
  // ---- Mage : capuche, bâton, orbe ----------------------------
  mage: [
    '......OOO....O..',
    '.....OPPPO..OGO.',
    '....OPpPpPO.OGO.',
    '....OPSSSPO.OWO.',
    '....OPSOSPO.OWO.',
    '.....OSSSO..OWO.',
    '....OOPPPOO.OWO.',
    '...OPpPPPpOOSWO.',
    '...OpPPPPPOOWO..',
    '...OpPwPPPO.OWO.',
    '...OpPwPPpO.OWO.',
    '...OOpPPpOO.OWO.',
    '....OpPPpO..OWO.',
    '....OOOOOO..OO..',
    '................',
    '................',
  ],
};

// ---- Tuiles 16x16 -------------------------------------------
const TILE_PAL = {
  a: '#9fcf6e', b: '#92c463', c: '#7fb354', // herbe claire
  d: '#86b85c', e: '#7aad51', f: '#699c45', // herbe sombre
  T: '#2f6b38', t: '#3f8a48', u: '#56a258', V: '#274f2c', W: '#7a522e',
};

const TILES = {
  grassA: [
    'aaaaaaaaaaaaaaaa','aaaaabaaaaaaaaaa','aaaaaaaaaaacaaaa','abaaaaaaaaaaaaaa',
    'aaaaaaaabaaaaaaa','aaacaaaaaaaaaaba','aaaaaaaaaaaaaaaa','aaaaaabaaacaaaaa',
    'aaaaaaaaaaaaaaaa','acaaaaaaaaaaaaaa','aaaaaaabaaaaacaa','aaaaaaaaaaaaaaaa',
    'aabaaaaaaabaaaaa','aaaaaacaaaaaaaaa','aaaaaaaaaaaaabaa','aaaaaaaaaaaaaaaa',
  ],
  grassB: [
    'dddddddddddddddd','ddddeddddddddddd','dddddddddddfdddd','dedddddddddddddd',
    'dddddddderdddddd','dddfdddddddddded','dddddddddddddddd','ddddddeddfdddddd',
    'dddddddddddddddd','dfdddddddddddddd','dddddddedddddfdd','dddddddddddddddd',
    'ddeddddddderdddd','ddddddfddddddddd','dddddddddddddedd','dddddddddddddddd',
  ].map(r => r.replace(/r/g, 'd')),
  forest: [
    'dddddddddddddddd','dddddTTTTddddddd','ddddTttttTdddddd','dddTttuttutTdddd',
    'ddTtutttttttTddd','ddTttttuttttTddd','dTttuttttutttTdd','dTtttttttttttTdd',
    'dTttuttVttuttTdd','ddTtttVVVtttTddd','ddTttVtttVttTddd','dddTTtttttTTdddd',
    'ddddVTTTTTVddddd','dddddDWWdddddddd','ddddddWWdddddddd','dddddddddddddddd',
  ].map(r => r.replace(/D/g, 'd')),
};

// ---- Rendu ---------------------------------------------------
function drawGrid(ctx, grid, pal, x, y, flip) {
  const h = grid.length;
  for (let r = 0; r < h; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x + (flip ? row.length - 1 - c : c), y + r, 1, 1);
    }
  }
}

// Met en cache chaque sprite par (classe, équipe) sur un canvas
const spriteCache = {};
function getSprite(cls, team) {
  const key = cls + team;
  if (!spriteCache[key]) {
    const cv = document.createElement('canvas');
    cv.width = 16; cv.height = 16;
    const pal = Object.assign({}, PALETTES.base, PALETTES.team[team]);
    drawGrid(cv.getContext('2d'), SPRITES[cls], pal, 0, 0, team === 1);
    spriteCache[key] = cv;
  }
  return spriteCache[key];
}

const tileCache = {};
function getTile(name) {
  if (!tileCache[name]) {
    const cv = document.createElement('canvas');
    cv.width = 16; cv.height = 16;
    drawGrid(cv.getContext('2d'), TILES[name], TILE_PAL, 0, 0, false);
    tileCache[name] = cv;
  }
  return tileCache[name];
}
