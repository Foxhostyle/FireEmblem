// ============================================================
// Échec & Lame v3 — pixel art : sprites, tuiles, textures
// ============================================================

// Légende : . transparent  O contour  S peau  s peau ombrée
// P équipe  p sombre  Q clair  M métal  m métal sombré  w blanc
// H cheveux  h ombrés  W bois  V bois sombre  G or  g or sombre
// K gris  k nuit  T/t/u/v feuillage  L cuir
export const PALETTES = {
  base: {
    O: '#2a2138', S: '#f6cfa2', s: '#d3a06c',
    M: '#c8d0e0', m: '#8590a8', w: '#f6f8fa',
    W: '#9a6230', V: '#6b431f', L: '#7a4e2a',
    G: '#f0c542', g: '#b8862a',
    K: '#3f4458', k: '#262335',
    B: '#8a5a32', b: '#5e3a22', C: '#a87648',
    T: '#2f6b38', t: '#449a4e', u: '#63b85f', v: '#7fd470',
  },
  team: [
    { P: '#3f6fd1', p: '#28489e', Q: '#84a9ef', H: '#4f80e2', h: '#30549e' },
    { P: '#d04a44', p: '#922832', Q: '#ee8273', H: '#e85a38', h: '#a23420' },
  ],
};

// ligne de taille : au-dessus, le corps « respire » sur la frame 2
export const WAISTS = { lord: 24, soldier: 24, knight: 23, mage: 26, cavalier: 13 };

export const SPRITES = {
  lord: [
    '................................',
    '................................',
    '............O.O.O.O.............',
    '...........OHOHOHOHO............',
    '...........OHhHHhHHO............',
    '..........OHGGGGGGGHO...........',
    '.........OHHHHHHHHHhHO..........',
    '.........OhHhHSSSShHhO..........',
    '..........OHOSkSkSOOO...........',
    '..........OHOSSSSSO.............',
    '...........OOSSSSSO.............',
    '.........OOOOOssSOOOOO..........',
    '........OwMMMOOOOOMMMwO.........',
    '........OMMMMQQPPPMMMMO.........',
    '........OMMMMQQQPPMMMMO.........',
    '........OMMMMQQPPPMMMMO.........',
    '........OpppPPPPPPPPPPO.........',
    '........OpppPPPPPPPPPPO.........',
    '........OpppPPPPpppPPPO.........',
    '........OpppPPPPpppPPPO.........',
    '........OpppPPPPpppPPPOO........',
    '........OpppPPPppppPPSSGO.......',
    '........OpppGGGgGGGGOSSgOOO.....',
    '.......OpSSSGGGGGGGGOGGGGGGO....',
    '.......OpSSPPPppppppOOOwMOO.....',
    '.......OpPpPPPppppppO.OwMO......',
    '......OpPPpPPPppppppO.OwMO......',
    '......OpPPpPPPppppppO.OwMO......',
    '......OpPPpKKKKOKKKKO.OwMO......',
    '......OpPPpKKKkOKKKKO..OwMO.....',
    '.....OpPPPpKKKKOKKKKO..OwMO.....',
    '.....OpPPPpKKKKOKKKKO..OwMO.....',
    '.....OpPPPpKKKKOKKKKO..OwMO.....',
    '....OpPPPPpKKKKOKKKKO..OwMO.....',
    '....OpPPPPpKKKKOKKKKO..OwMO.....',
    '....OpPPPPpKKKKOKKKKO..OwMO.....',
    '...OpPPPPPpKKKKOKKKKKO.OwMO.....',
    '...OpPPPpPpKKKKOOKKKKO..OwMO....',
    '..OppppppplLLLLOOLLLLLO.OwMO....',
    '...OOOOOOOLLLLLOOLLLLLO.OwMO....',
    '.........OLLLLLOOLLLLLO.OwMO....',
    '.........OLLLLLOOLLLLLO..OO.....',
    '.........OlllllOOlllllO.........',
    '..........OOOOO..OOOOO..........',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  soldier: [
    '...............O................',
    '..............OQO...............',
    '.............OPPPO.....O........',
    '............OOPPPOO...OwO.......',
    '...........OwwPPPMMO.OMwO.......',
    '...........OMMMMMMMO.OMMO.......',
    '...........OMMMMMMMO.OMWO.......',
    '...........OMMMMMMMO.OMWO.......',
    '...........OSkSSkSSO.OMWO.......',
    '...........OSSSSSSSO..OWO.......',
    '...........OSSSSSSSO..OWO.......',
    '.........OOOsssssssOOOOWO.......',
    '........OQPPPOOOOOPPPQOWO.......',
    '........OPPPPwwwMMPPPPOWO.......',
    '.....OOOOPPPPwwwMMPPPPOWO.......',
    '....OMMMMMMPPwwwMMPPPPOWO.......',
    '....OMwwMMMwwwwwMMMPPPOWO.......',
    '....OMwwMMMMMMmmmmmPPPOWO.......',
    '....OMwPPMMPPPPPPPPPPPSWO.......',
    '....OMwPPMMMMMmmmmmPPPSWO.......',
    '....OMwwMMMMMMmmmmmmOOSWO.......',
    '....OMwwMMMMMMmmmmmmO.OWO.......',
    '....OMMMMMMLLLLLLLLLO.OWO.......',
    '.....OOOOOOLLLLLLLLLO.OWO.......',
    '..........OPPPppppppO.OWO.......',
    '..........OPPPppppppO.OWO.......',
    '..........OPPPppppppO.OWO.......',
    '..........OPPPppppppO.OWO.......',
    '..........OKKKKOKKKKO.OWO.......',
    '..........OKKKkOKKKKO.OWO.......',
    '..........OKKKKOKKKKO.OWO.......',
    '..........OKKKKOKKKKO.OWO.......',
    '..........OKKKKOKKKKO.OWO.......',
    '..........OKKKKOKKKKO.OWO.......',
    '..........OKKKKOKKKKO.OWO.......',
    '..........OKKKKOKKKKO.OWO.......',
    '..........OKKKKOKKKKKOOWO.......',
    '..........OKKKKOOKKKKOOWO.......',
    '.........OlLLLLOOLLLLLOWO.......',
    '.........OLLLLLOOLLLLLOWO.......',
    '.........OLLLLLOOLLLLLOWO.......',
    '.........OLLLLLOOLLLLLOWO.......',
    '.........OlllllOOlllllOWO.......',
    '..........OOOOO..OOOOO.O........',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  cavalier: [
    '...................O.O.O.O......................',
    '..................OHOHOHOHO.....................',
    '..................OHHHHHHHO................OO...',
    '.................OHHHHHHHHO...............OwMO..',
    '.................OHHSSSSShO.............OOwVO...',
    '.................OHOSkSkSO............OOWVVO....',
    '.................OOOSSSSSOOO.........OWVVOO.....',
    '................OwMMMOsOMMMMO......OOWVOO.......',
    '................OMMMMQPPMMMMO.....OWVVOCO.......',
    '................OMMMMQPPMMMMO...OOWVOBObO.......',
    '.................OOQQQPPPPPPO.OOWVVOOkkOO.......',
    '..................OQQQPPPPPPOOWVVkO.OOOCCOO.....',
    '..................OPPPPppPPSSWVOOO.OkkCOBCCO....',
    '..................OPPPPppPPWVVOOkOOkkkBBBBBCOO..',
    '..................OPPPPppWVVSkkkkkkkBBBBBBBBCCO.',
    '..................OPPPPpWVOOOOOOOkkkkkkkkkkBBbCO',
    '..................OPPPWVVpPO...OkkkBBBbOOObbBbBO',
    '.........OO..OOOOOOPPWVPPPPO.OOkkkBBBbO...OObbbO',
    '........OkkOOCCCCCOWVVPPPPPOOCkkkBBBbO......OOO.',
    '.......OkkkkCBBBBWVVpppppppCCBkkBBBBO...........',
    '.......OkkkBBBBBWVBBCCBCKKKBBBkBBBBbO...........',
    '......OkkkkBBBBBBBBBBBBBKKKBBBBBBBbO............',
    '......OkkkBBBBBBBBBBBBBBKKKBBBBBBBO.............',
    '.....OkkkkBBBBBBBBBBBBBBKKKBBBBBBBCO............',
    '.....OkkkOBBBBBBBBBBBBBBKKKBBBBBBBO.............',
    '....OkkkkOBBBBBBBBBBBBBBKKKBBBBBBBO.............',
    '....OkkkOObBBBBBBBBBBBBBLLLLBBBBBbO.............',
    '....OkkkO.ObBBBBBbbBBBBBLLLLbBBBbO..............',
    '....OkkO...OBBbbbbbbbbBbLLLLbbBBO...............',
    '....OkkO...OBBOOObbOOObOOOOObbBBO...............',
    '....OkkO...OBBOObbbO..O....ObbBBCO..............',
    '...OkkkO...OBBOObbO.........ObBBbO..............',
    '....OkO....OBBOObbO.........ObBBO...............',
    '.....O.....OBBOObbO........OkkBBO...............',
    '...........OBBOObbO........OkkBbO...............',
    '...........OBBOObbO.........OObbbO..............',
    '...........OBBOObbbO..........ObbbO.............',
    '...........ObBCOObbO...........ObbO.............',
    '............OBBOObbO...........ObbO.............',
    '...........OkkkOkkkO...........OkkkO............',
    '...........OkkkOkkkO...........OkkkO............',
    '............OOO.OOO.............OOO.............',
    '................................................',
    '................................................',
    '................................................',
    '................................................',
    '................................................',
    '................................................',
  ],
  knight: [
    '.............OQO................',
    '............OPQPO...............',
    '............OPPPO...............',
    '...........OOPPPOO..............',
    '..........OwwPPPwwO.....OO......',
    '..........OwwwwwwwO.OOOOWVOOOO..',
    '..........OMMMMMMMOOMMMMWVMMMMO.',
    '..........OMkkkkkMOOwwMMWVMMmmO.',
    '..........OMMMMMMMOOwwMMWVMMmmO.',
    '.....OOOOOOMMMMMMMOOwwMMWVMMmmO.',
    '....OwwwwMOmmmmmmmOMwwMMWVMMmmO.',
    '....OwwwwMOmmmmmmmOMwwMMWVMMmmO.',
    '....OMMMMMwwwwMMMMMMwwMMWVMMmmO.',
    '....OMMMMMwwQQQPPMMMMMMMWVMMMMO.',
    '....OmMMMMwwQQQPPMMMMMMmWVOOOO..',
    '.....OOOwwwwQQQPPMMMmmmOWVO.....',
    '.......OwwwwPPPPPMMMmmmOWVO.....',
    '.......OMMMMPPPPPmmmmmmOWVO.....',
    '.......OMMMMPPPPPmmmmmmOWVO.....',
    '.......OMMMMPPPPPmmmmmSSWVO.....',
    '.......OMMMMMMMmmmmmmOSSWVO.....',
    '.......OMMMMMMMmmmmmmOSSWVO.....',
    '.......OMMMMMMMmmmmmmOOOWVO.....',
    '.......OmmmmpppppmmmmO.OWVO.....',
    '.......OmmmmpppppmmmmO.OWVO.....',
    '.......OmmmmpppppmmmmO.OWVO.....',
    '........OmmmmmOmmmmmO..OWVO.....',
    '........OmmmmmOmmmmmO..OWVO.....',
    '........OmmmmmOmmmmmO..OWVO.....',
    '........OmmmmmOmmmmmO..OWVO.....',
    '........OmmmmmOmmmmmO..OWVO.....',
    '........OmmmmmOmmmmmO..OWVO.....',
    '........OmmmmmOmmmmmO...OO......',
    '........OwMMMMOmwMMMMO..........',
    '........OMMMMMOOMMMMMO..........',
    '........OMMMMMOOMMMMMO..........',
    '........OMMMMMOOMMMMMO..........',
    '........OMMMMMOOMMMMMO..........',
    '........OMMMMMOOMMMMMO..........',
    '.......OMMMMMMOOMMMMMMO.........',
    '.......OMMMMMMOOMMMMMMO.........',
    '.......OMMMMMMOOMMMMMMO.........',
    '.......OmmmmmmOOmmmmmmO.........',
    '........OOOOOO..OOOOOO..........',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  mage: [
    '................................',
    '................................',
    '................................',
    '.......................OOO......',
    '...........OOOOOOOO...OgGGO.....',
    '..........OQQQQQQQPO.OGGwGO.....',
    '..........OQQQQQQQPO..OGGGO.....',
    '..........OPPPPPPPPO...OOO......',
    '..........OPPkkkkkPO...OWO......',
    '..........OPPkwkwkPO...OWVO.....',
    '..........OPPkkkkkPO...OWVO.....',
    '..........OPPkkkkkPO...OWVO.....',
    '..........OPPPPPPPPOO..OWVO.....',
    '.........OQQQQQQQQQQQO.OWVO.....',
    '.........OQQQQQQQQQQQO.OWVO.....',
    '.........OQQQQQQQQQQQOOOWVO.....',
    '..........OOpppwpppOPPPOWVO.....',
    '........OOOOpppwpppOPPPOWVO.....',
    '.......OPPPPpppwpppOPPPOWVO.....',
    '.......OPPPPpppwpppOPPSSWVO.....',
    '......OwwwwPPppwppPpPPSSWVO.....',
    '......OwwwwPPppwppPpOOSSWVO.....',
    '......OLLLLPPppwppPpO.OOWVO.....',
    '......OLLLLpPppwppPpO..OWVO.....',
    '......OLLLLpPppwppPpO..OWVO.....',
    '.......OOOOpPppwppPpO..OWVO.....',
    '.........OpPPppwppPGpO.OWVO.....',
    '.........OpPPppwppPPpO.OWVO.....',
    '.........OpPPppwppPPpO.OWVO.....',
    '.........OpPPppwppPPpO.OWVO.....',
    '.........OGPPppwppPPpO.OWVO.....',
    '.........OpPPppwppPPpO.OWVO.....',
    '........OpPPPppwppPPPpOOWVO.....',
    '........OpPPPppwppPPPpOOWVO.....',
    '........OpPPPppwppPPPpOOWVO.....',
    '........OpPPPppwppPPPpOOWVO.....',
    '........OpPPPppwppPPGpOOWVO.....',
    '........OpPPPppwppPPPpOOWVO.....',
    '.......OpPPPPppwppPPPPpOWVO.....',
    '.......OpPPPPppwppPPPPpOWVO.....',
    '.......OpPPPPppwppPPPPpOWVO.....',
    '.......OpPPPPPPPPPPPPPpOWVO.....',
    '......OpppppppppppppppppWVO.....',
    '.......OOOOOOOOOOOOOOOOOOO......',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
};

export const TREE = [
    '........................',
    '.........TTTTT..........',
    '......TTTtttttTT........',
    '....TTtttuuuutttTT......',
    '...TttuuvvvvuuutttT.....',
    '..TttuvvvvvvvvuutttT....',
    '..TtuvvvvuvvvvvuuttT....',
    '.TttuvvuvvvvuvvvuttT....',
    '.TtuuvvvvvuvvvvuuttTT...',
    '.TtuvvuvvvvvuvvvvuttT...',
    '.TtuuvvvvuvvvvuvuuttT...',
    '.TttuvvvvvvuvvvvuttTT...',
    '..TtuuvvuvvvvuvuuttT....',
    '..TttuuvvvuuvvuuttTT....',
    '...TTtuuuuvuuuuttTT.....',
    '....TTttuuuuuttTTT......',
    '.....VTTttttTTTV........',
    '......VVTTTTVVV.........',
    '........VwWWV...........',
    '........wWWWV...........',
    '........wWWWV...........',
    '.......VwWWWWV..........',
    '.......VWWWWWV..........',
    '......VwWWWWWWV.........',
    '......sswWWWwss.........',
    '.....sssssssssss........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
];

export const RUIN = [
    '........................',
    '........................',
    '........................',
    '........................',
    '......OOOO..OO..........',
    '.....OMMMMOOMMO.........',
    '.....OMwwMMMMmO.........',
    '.....OMMMMMMOO..........',
    '......OmMMmO............',
    '......OmMMMO............',
    '......OMtMmO............',
    '......OmMMmO............',
    '......OMMtMO............',
    '......OmMMmO............',
    '......OMMMmO............',
    '......OmtMMO............',
    '......OMMMmO............',
    '.....OOMMMMOO...........',
    '....OMMmMMmMMO..........',
    '....OMwMMMMmMO..........',
    '...OOMMMMMMMMOO.........',
    '...OMmMtMMMmMMO.........',
    '...OttMMMmMMttO.........',
    '....sstttttss...........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
];

export const TILE_PAL = {
  a: '#a8d473', b: '#9cc968', c: '#8db95a', d: '#bade85',
  e: '#90bf5f', f: '#84b254', i: '#76a449', j: '#9ed06d',
  T: '#2c6437', t: '#3e8a48', u: '#57a857', v: '#6fc468', V: '#1f4a28',
  W: '#7a522e', w: '#5e3d20',
  F: '#fef6e0', Y: '#ffd95e', R: '#ff8e9e', s: '#7d9450',
  M: '#b9b4c4', m: '#8d8799', O: '#5e5870', k: '#46415a',
};

export const TILES = {
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

export const DECORS = {
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

export const CREST = [
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

// case de ruine : dalle fissurée
TILES.ruinGround = TILES.grassB.map((row, r) =>
  row.split('').map((ch, c) => {
    const ring = r < 3 || r > 20 || c < 3 || c > 20;
    if (ring) return ch;
    const h = (r * 31 + c * 17) % 13;
    return h === 0 ? 'm' : h < 3 ? 'k' : h < 10 ? 'M' : 'O';
  }).join(''));

// ---------- rendu de base ----------
export function drawGrid(ctx, grid, pal, x = 0, y = 0, flip = false) {
  for (let r = 0; r < grid.length; r++) {
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

export function gridCanvas(grid, pal) {
  const cv = document.createElement('canvas');
  cv.width = grid[0].length; cv.height = grid.length;
  drawGrid(cv.getContext('2d'), grid, pal, 0, 0, false);
  return cv;
}

const cache = {};

export function unitCanvas(cls, team, frame = 0) {
  const key = 'u' + cls + team + frame;
  if (!cache[key]) {
    let grid = SPRITES[cls];
    if (frame === 1) {
      const waist = WAISTS[cls];
      grid = grid.map((row, r) =>
        r === 0 ? '.'.repeat(row.length) : (r <= waist ? grid[r - 1] : row));
    }
    const cv = document.createElement('canvas');
    cv.width = grid[0].length; cv.height = grid.length;
    const pal = Object.assign({}, PALETTES.base, PALETTES.team[team]);
    drawGrid(cv.getContext('2d'), grid, pal, 0, 0, team === 1);
    cache[key] = cv;
  }
  return cache[key];
}

// silhouette blanche (flash de dégâts)
export function unitFlashCanvas(cls, team) {
  const key = 'f' + cls + team;
  if (!cache[key]) {
    const srcCv = unitCanvas(cls, team, 0);
    const cv = document.createElement('canvas');
    cv.width = srcCv.width; cv.height = srcCv.height;
    const c = cv.getContext('2d');
    c.drawImage(srcCv, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, cv.width, cv.height);
    cache[key] = cv;
  }
  return cache[key];
}

export function tileCanvas(name) {
  const key = 't' + name;
  if (!cache[key]) cache[key] = gridCanvas(TILES[name] || DECORS[name], TILE_PAL);
  return cache[key];
}

// tuile composée : herbe + décor superposé
export function composedTile(base, decor) {
  const key = 'c' + base + (decor || '');
  if (!cache[key]) {
    const cv = document.createElement('canvas');
    cv.width = 24; cv.height = 24;
    const c = cv.getContext('2d');
    c.drawImage(tileCanvas(base), 0, 0);
    if (decor) c.drawImage(tileCanvas(decor), 0, 0);
    cache[key] = cv;
  }
  return cache[key];
}

export function treeCanvas() {
  if (!cache.tree) cache.tree = gridCanvas(TREE, TILE_PAL);
  return cache.tree;
}

export function ruinCanvas() {
  if (!cache.ruin) cache.ruin = gridCanvas(RUIN, Object.assign({}, PALETTES.base, { t: '#5d9a52', s: '#55834b' }));
  return cache.ruin;
}

export function crestCanvas(team) {
  const key = 'crest' + team;
  if (!cache[key]) cache[key] = gridCanvas(CREST, Object.assign({}, PALETTES.base, PALETTES.team[team]));
  return cache[key];
}

// ---------- textures procédurales ----------
export function waterCanvas() {
  if (cache.water) return cache.water;
  const cv = document.createElement('canvas');
  cv.width = 96; cv.height = 96;
  const c = cv.getContext('2d');
  c.fillStyle = '#1d3a6e';
  c.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 380; i++) {
    const x = (i * 37) % 96, y = (i * 53 + (i * i) % 7) % 96;
    c.fillStyle = ['#234a86', '#16305c', '#2a55a0', '#1a3464'][i % 4];
    c.fillRect(x, y, 2 + (i % 3), 1);
  }
  for (let i = 0; i < 46; i++) {
    const x = (i * 61) % 96, y = (i * 29) % 96;
    c.fillStyle = 'rgba(150, 200, 255, 0.55)';
    c.fillRect(x, y, 3 + (i % 4), 1);
  }
  cache.water = cv;
  return cv;
}

export function rockCanvas() {
  if (cache.rock) return cache.rock;
  const cv = document.createElement('canvas');
  cv.width = 48; cv.height = 48;
  const c = cv.getContext('2d');
  c.fillStyle = '#4a3a30';
  c.fillRect(0, 0, 48, 48);
  for (let i = 0; i < 320; i++) {
    const x = (i * 31) % 48, y = (i * 17 + (i % 5)) % 48;
    c.fillStyle = ['#55443a', '#3c2e26', '#5e4c40', '#362a22', '#46362c'][i % 5];
    c.fillRect(x, y, 2 + (i % 3), 1 + (i % 2));
  }
  // strates sombres
  for (let y = 6; y < 48; y += 11) {
    c.fillStyle = 'rgba(20, 14, 10, 0.5)';
    c.fillRect(0, y, 48, 1);
  }
  cache.rock = cv;
  return cv;
}

export function skyCanvas() {
  if (cache.sky) return cache.sky;
  const cv = document.createElement('canvas');
  cv.width = 4; cv.height = 512;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, '#241d4e');
  g.addColorStop(0.45, '#3a2a62');
  g.addColorStop(0.72, '#7a4470');
  g.addColorStop(0.88, '#d4775a');
  g.addColorStop(1.0, '#f0a85e');
  c.fillStyle = g;
  c.fillRect(0, 0, 4, 512);
  cache.sky = cv;
  return cv;
}

export function softCircleCanvas() {
  if (cache.soft) return cache.soft;
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  cache.soft = cv;
  return cv;
}
