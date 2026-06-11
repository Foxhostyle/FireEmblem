// ============================================================
// Échec & Lame — sprites pixel art 24x24, tuiles et blason
// ============================================================
'use strict';

// Légende : . transparent  O contour  S peau  s peau ombrée
// P équipe  p équipe sombre  Q équipe claire  M métal  m métal sombre
// w blanc/acier clair  H cheveux  h cheveux ombrés  W bois  V bois sombre
// G or  g or sombre  K gris sombre  k presque noir  T/t/u feuillage  L cuir
const PALETTES = {
  base: {
    O: '#181425', S: '#f2c79a', s: '#cf9d6a',
    M: '#c0c8d8', m: '#7e88a0', w: '#f4f6f8',
    W: '#9a6230', V: '#6b431f', L: '#7a4e2a',
    G: '#f0c542', g: '#b8862a',
    K: '#3a3f4d', k: '#23202f',
    T: '#2f6b38', t: '#449a4e', u: '#63b85f',
  },
  team: [
    { P: '#3f6fd1', p: '#27479c', Q: '#7da3ee', H: '#e8c84a', h: '#b3932a' }, // bleus
    { P: '#d04a44', p: '#8e2430', Q: '#ee8273', H: '#8a55a8', h: '#5d3375' }, // rouges
  ],
};

const SPRITE_SIZE = 24;

// Chaque sprite : 24 lignes de 24 caractères.
const SPRITES = {
  // ---- Seigneur : épée levée, circlet d'or, tunique fine ----
  lord: [
    '........................',
    '................OO......',
    '...............OwMO.....',
    '...............OwMO.....',
    '.....OOOOO.....OwMO.....',
    '....OHHHHHO....OwMO.....',
    '...OHHHHHHHO...OwMO.....',
    '...OGgGGGgGO...OwMO.....',
    '...OHSSSSSHO...OwMO.....',
    '...OHSOSSOSO...OwMO.....',
    '....OSSSSSO....OwMO.....',
    '....OsSSSsO....OwMO.....',
    '.....OOOO.....OOMMO.....',
    '....OPQQPO....OGGO......',
    '...OPQQQQPO..OSSO.......',
    '..OpPQQQQPPOOSSO........',
    '..OpPPGGGPPOOOO.........',
    '..OpPPPPPPPPO...........',
    '..OpPPPPPPPPO...........',
    '..OOpPPPPPPpO...........',
    '...OpPO..OPpO...........',
    '...OPPO..OPPO...........',
    '..OKKKO..OKKKO..........',
    '........................',
  ],
  // ---- Soldat : casque à plumet, lance verticale --------------
  soldier: [
    '.................O......',
    '................OwO.....',
    '................OwMO....',
    '................OMO.....',
    '................OWO.....',
    '......OOOO......OWO.....',
    '.....OPPPPO.....OWO.....',
    '....OMMMMMMO....OWO.....',
    '....OMwMMMMO....OWO.....',
    '....OMmmmmMO....OWO.....',
    '....OmSSSSmO....OWO.....',
    '....OmSOSOSO....OWO.....',
    '.....OSSSSO.....OWO.....',
    '......OOOO.....SOWO.....',
    '.....OPQQPO....SOWO.....',
    '....OpPQQQPO....OWO.....',
    '....OpPPPPPO....OWO.....',
    '....OpPPPPPO....OWO.....',
    '....OOpPPpOO....OWO.....',
    '.....OPO.OPO....OWO.....',
    '....OKKO.OKKO...OWO.....',
    '.....OO...OO....OWO.....',
    '................OVO.....',
    '........................',
  ],
  // ---- Cavalier : monture au galop, cavalier à l'épée ----------
  cavalier: [
    '........................',
    '......OOOO........O.....',
    '.....OHHHHO......OwO....',
    '.....OHSSSHO.....OwMO...',
    '.....OHSOSOO.....OwMO...',
    '......OSSSO......OwMO...',
    '.....OOPPPOO.....OwMO...',
    '....OpPQQQPO.....OwMO...',
    '....OpPQQQPPO...OOMO....',
    '....OpPPPPPPOOOOSSO.....',
    '.....OpPPPPPOOSSOO......',
    '......OOOOOOOOOOWKKO....',
    '...OO.OWWWWWWWWOWWKKO...',
    '..OWWOWWWWWWWWWWWWOKO...',
    '.OVWWWWWWWWWWWWWWWO.O...',
    '.OVWWWWWWWWWWWWWWO......',
    '.OVOWWWWWWWWWWWWO.......',
    '..OOWWWOWWWWOWWWO.......',
    '...OWWO.OWWO.OWWO.......',
    '...OWVO.OWVO..OWVO......',
    '...OVO...OVO...OVO......',
    '..OKKO..OKKO..OKKO......',
    '........................',
    '........................',
  ],
  // ---- Chevalier : heaume à visière, hache bipenne --------------
  knight: [
    '........................',
    '...............OWWO.....',
    '............OOOWWOOO....',
    '...........OMMOWWOMMO...',
    '...........OMwOWWOwMO...',
    '...........OMMOWWOMMO...',
    '............OOOWWOOO....',
    '...............OWWO.....',
    '.....OOOOO.....OWWO.....',
    '....OMMMMMO....OWWO.....',
    '....OMwwwMO....OWWO.....',
    '....OmkkkmO....OWWO.....',
    '....OMMMMMO...SOWWO.....',
    '...OOOOOOOOO..SOWWO.....',
    '..OMMOPQQPOMMO.OWWO.....',
    '..OMmOPQQPOmMO.OWWO.....',
    '..OOOPPGGPPOOO.OWWO.....',
    '....OpPPPPpO...OWWO.....',
    '....OpPPPPpO...OWWO.....',
    '...OOMMOOMMOO..OWWO.....',
    '...OMMMOOMMMO..OWWO.....',
    '....OKKOOKKO...OWWO.....',
    '.....OO..OO....OOOO.....',
    '........................',
  ],
  // ---- Mage : capuche pointue, bâton à orbe --------------------
  mage: [
    '........................',
    '.................OO.....',
    '................OGGO....',
    '.........O.....OGwGGO...',
    '......OOPPO....OGGGGO...',
    '.....OPPPPPO....OGGO....',
    '....OPPQPPPPO....OWO....',
    '....OPQPPPPPO....OWO....',
    '...OPPkkkkkPPO...OWO....',
    '...OPkSwSwSkPO...OWO....',
    '...OPkSSSSSkPO...OWO....',
    '....OkSSSSkO.....OWO....',
    '.....OOOOOO......OWO....',
    '....OPQQQQPO....OSWO....',
    '...OpPQQQQPPO..OSWO.....',
    '...OpPPPPPPPPOOOWO......',
    '...OpPPwPPPPPOOWO.......',
    '...OpPPwPPPPOOWO........',
    '..OpPPPwPPPPO.OWO.......',
    '..OpPPPPPPPPO.OWO.......',
    '..OpPPPPPPPPpO.OWO......',
    '.OOpppppppppOO.OWO......',
    '.OOOOOOOOOOOO...O.......',
    '........................',
  ],
};

// ---- Tuiles 24x24 -------------------------------------------
const TILE_PAL = {
  a: '#a8d473', b: '#9cc968', c: '#8db95a', d: '#bade85',
  e: '#90bf5f', f: '#84b254', i: '#76a449', j: '#9ed06d',
  T: '#2c6437', t: '#3e8a48', u: '#57a857', v: '#6fc468', V: '#1f4a28',
  W: '#7a522e', w: '#5e3d20',
  F: '#fef6e0', Y: '#ffd95e', R: '#ff8e9e', s: '#7d9450',
};

const TILES = {
  grassA: [
    'aaaaaaaaaaaaaaaaaaaaaaaa', 'aaaabaaaaaaaaajaaaaaaaaa', 'aaaaaaaaaacaaaaaaaaabaaa',
    'abaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaajaaaaaaaaabaaaaaa', 'aaacaaaaaaaaaaaaaaaaaaja',
    'aaaaaaaaaabaaaaaaacaaaaa', 'aaaaaabaaaaaaaaaaaaaaaaa', 'ajaaaaaaaaaaacaaaaaabaaa',
    'aaaaacaaaaaaaaaaaaaaaaaa', 'aaaaaaaaabaaaaaajaaaaaaa', 'aaabaaaaaaaaaaaaaaaaacaa',
    'aaaaaaaaaaaacaaaaabaaaaa', 'aacaaaaajaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaabaaaaaaaa',
    'aaaaabaaaacaaaaaaaaaajaa', 'abaaaaaaaaaaaaaaacaaaaaa', 'aaaaaaaaajaaabaaaaaaaaaa',
    'aaaaacaaaaaaaaaaaaabaaaa', 'aaaaaaaaaaaaaaaaaaaaaaaa', 'aabaaaaaaacaaaaajaaaaaaa',
    'aaaaaaaaaaaaaabaaaaaaaca', 'aaaaajaaaaaaaaaaaaaaaaaa', 'aaaaaaaaabaaaaaaaacaaaaa',
  ],
  grassB: [
    'eeeeeeeeeeeeeeeeeeeeeeee', 'eeeefeeeeeeeeebeeeeeeeee', 'eeeeeeeeeeieeeeeeeeefeee',
    'efeeeeeeeeeeeeeeeeeeeeee', 'eeeeeeebeeeeeeeeefeeeeee', 'eeeieeeeeeeeeeeeeeeeeebe',
    'eeeeeeeeeefeeeeeeeieeeee', 'eeeeeefeeeeeeeeeeeeeeeee', 'ebeeeeeeeeeeeieeeeeefeee',
    'eeeeeieeeeeeeeeeeeeeeeee', 'eeeeeeeeefeeeeeebeeeeeee', 'eeefeeeeeeeeeeeeeeeeeiee',
    'eeeeeeeeeeeeieeeeefeeeee', 'eeieeeeebeeeeeeeeeeeeeee', 'eeeeeeeeeeeeeeefeeeeeeee',
    'eeeeefeeeeieeeeeeeeeebee', 'efeeeeeeeeeeeeeeeieeeeee', 'eeeeeeeeebeeefeeeeeeeeee',
    'eeeeeieeeeeeeeeeeeefeeee', 'eeeeeeeeeeeeeeeeeeeeeeee', 'eefeeeeeeeieeeeebeeeeeee',
    'eeeeeeeeeeeeeefeeeeeeeie', 'eeeeebeeeeeeeeeeeeeeeeee', 'eeeeeeeeefeeeeeeeeieeeee',
  ],
  forest: [
    'eeeeeeeeeeeeeeeeeeeeeeee', 'eeeeeeeeTTTTTTeeeeeeeeee', 'eeeeeeTTttttttTTeeeeeeee',
    'eeeeeTtttuuuutttTeeeeeee', 'eeeeTttuuvvvuuuttTeeeeee', 'eeeTttuuvvvvvuuuttTeeeee',
    'eeeTtuuvvuvvvvuuttTeeeee', 'eeTttuvvvvuvvuuutttTeeee', 'eeTtuuvuuvvvvuuuuttTeeee',
    'eeTtuuvvvvuuvvuutttTeeee', 'eeTttuuvvuuuvuuutttTeeee', 'eeeTtuuuuvuuuuuuttTeeeee',
    'eeeTttuutuuuutttttTeeeee', 'eeeeTttttuuutttttTeeeeee', 'eeeeVTTtttttttTTVeeeeeee',
    'eeeeeVVTTTTTTTVVeeeeeeee', 'eeeeeeVVwWWwVVeeeeeeeeee', 'eeeeeeeeWWWWeeeeeeeeeeee',
    'eeeeeeeewWWWeeeeeeeeeeee', 'eeeeeeeeWWWweeeeeeeeeeee', 'eeeeeeswWWWWwseeeeeeeeee',
    'eeeeesssWWWWssseeeeeeeee', 'eeeeeeeeeeeeeeeeeeeeeeee', 'eeeeeeeeeeeeeeeeeeeeeeee',
  ],
};

// Petites décorations posées sur l'herbe (24x24 clairsemées)
const DECORS = {
  flowers: [
    '........................', '........................', '....F...................',
    '...FYF..................', '....F...................', '........................',
    '........................', '..................R.....', '.................RYR....',
    '..................R.....', '........................', '........................',
    '........................', '........................', '......s.................',
    '.....sss................', '........................', '........................',
    '........................', '...............F........', '..............FYF.......',
    '...............F........', '........................', '........................',
  ],
  tufts: [
    '........................', '........................', '........................',
    '..........s.............', '.........sss............', '........................',
    '........................', '........................', '....................s...',
    '...................sss..', '........................', '........................',
    '...s....................', '..sss...................', '........................',
    '........................', '........................', '........................',
    '........................', '..............s.........', '.............sss........',
    '........................', '........................', '........................',
  ],
};

// ---- Blason de l'écran titre (32x32) -------------------------
const CREST = [
  '................................',
  '...............GG...............',
  '...............GG...............',
  '...............WW...............',
  '...............WW...............',
  '.....Mw........WW........wM.....',
  '...MMww...GGGGGGGGGGGG...wwMM...',
  '..MMwww...gGGGGGGGGGGg...wwwMM..',
  '.Mmwww..GGGGGGGwMGGGGGGG..wwwmM.',
  '.Mmwww..GgPPPPPwMPPPPPgG..wwwmM.',
  '..Mmww..GgPQQQPwMPPPPPgG..wwmM..',
  '..Mmw...GgPQQPPwMPPPPPgG...wmM..',
  '...Mmw..GgPQPPPwMPPPPPgG..wmM...',
  '....Mm..GgPPPPPwMPPPPPgG..mM....',
  '.....Mm.GgPPPPPwMPPPPPgG.mM.....',
  '........GgPPPPPwMPPPPPgG........',
  '........GgPPPPPwMPPPPPgG........',
  '........GgPPPPPwMPPPPPgG........',
  '.........GgPPPPwMPPPPgG.........',
  '.........GgPPPPwMPPPPgG.........',
  '..........GgPPPwMPPPgG..........',
  '...........GgPPwMPPgG...........',
  '............GgPwMPgG............',
  '.............GgwPgG.............',
  '..............GggG..............',
  '...............GG...............',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

// ---- Rendu ---------------------------------------------------
function drawGrid(ctx, grid, pal, x, y, flip) {
  const h = grid.length;
  for (let r = 0; r < h; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
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
    cv.width = SPRITE_SIZE; cv.height = SPRITE_SIZE;
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
    cv.width = SPRITE_SIZE; cv.height = SPRITE_SIZE;
    const src = TILES[name] || DECORS[name];
    drawGrid(cv.getContext('2d'), src, TILE_PAL, 0, 0, false);
    tileCache[name] = cv;
  }
  return tileCache[name];
}

function getCrest(team) {
  const key = 'crest' + team;
  if (!tileCache[key]) {
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    const pal = Object.assign({}, PALETTES.base, PALETTES.team[team]);
    drawGrid(cv.getContext('2d'), CREST, pal, 0, 0, false);
    tileCache[key] = cv;
  }
  return tileCache[key];
}
