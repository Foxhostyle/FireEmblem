// ============================================================
// Échec & Lame v3 — données : classes, objets, carte, constantes
// ============================================================

export const BOARD = 8;          // plateau 8x8
export const SUDDEN_DEATH = 40;  // demi-tours avant la mort subite
export const DOUBLE_SPD = 3;     // écart de vitesse pour doubler
export const KOMI = 0;           // PV bonus du second joueur

// --- Classes : HP / Atq / Déf / Tech / Vit / Mou --------------
// La Technique gouverne la précision et les coups critiques.
export const CLASSES = {
  lord: {
    name: 'Seigneur', piece: 'Roi',
    hp: 20, atk: 6, def: 4, tec: 7, spd: 6, mov: 3,
    rng: [1], wpn: 'sword',
    desc: "S'il tombe, la partie est perdue.",
  },
  soldier: {
    name: 'Soldat', piece: 'Pion',
    hp: 18, atk: 5, def: 3, tec: 5, spd: 4, mov: 2,
    rng: [1], wpn: 'lance',
    desc: 'Solide ligne de front.',
  },
  cavalier: {
    name: 'Cavalier', piece: 'Cavalier',
    hp: 17, atk: 5, def: 3, tec: 5, spd: 7, mov: 4,
    rng: [1], wpn: 'sword', pass: true,
    desc: 'Rapide, saute par-dessus les unités.',
  },
  knight: {
    name: 'Chevalier', piece: 'Tour',
    hp: 22, atk: 7, def: 6, tec: 3, spd: 1, mov: 2,
    rng: [1], wpn: 'axe',
    desc: 'Mur de fer : frappe fort mais vise mal.',
  },
  mage: {
    name: 'Mage', piece: 'Fou',
    hp: 14, atk: 7, def: 2, tec: 8, spd: 5, mov: 3,
    rng: [1, 2], wpn: 'magic', magic: true,
    desc: 'Précis, frappe à distance, ignore la moitié de la Déf.',
  },
};

export const WPN_NAMES = { sword: 'Épée', lance: 'Lance', axe: 'Hache', magic: 'Magie' };

// Triangle des armes : épée > hache > lance > épée (±1 dégât, ±10 précision)
export const TRIANGLE = { sword: 'axe', axe: 'lance', lance: 'sword' };

// --- Équipement : toujours un bonus CONTRE un malus ------------
export const ITEMS = {
  weapons: [
    { id: 'w_heavy', name: 'Forge lourde',   mods: { atk: +3, spd: -2 } },
    { id: 'w_light', name: 'Forge légère',   mods: { spd: +2, atk: -1 } },
    { id: 'w_keen',  name: 'Forge perçante', mods: { atk: +2, def: -2 } },
    { id: 'w_duel',  name: 'Lame d’estoc',   mods: { tec: +3, atk: -1 } },
    { id: 'w_guard', name: 'Forge de garde', mods: { def: +2, atk: -1 } },
  ],
  armors: [
    { id: 'a_plate', name: 'Harnois de plates',    mods: { def: +3, spd: -2 } },
    { id: 'a_cape',  name: 'Cape d’agilité',       mods: { spd: +2, def: -1 } },
    { id: 'a_boots', name: 'Bottes ailées',        mods: { mov: +1, def: -2 } },
    { id: 'a_charm', name: 'Amulette vitale',      mods: { hp: +6, spd: -1 } },
    { id: 'a_lens',  name: 'Monocle du duelliste', mods: { tec: +2, hp: -3 } },
  ],
};

export const STAT_NAMES = { hp: 'PV', atk: 'Atq', def: 'Déf', tec: 'Tec', spd: 'Vit', mov: 'Mou' };

// --- Terrain ----------------------------------------------------
// 0 plaine · 1 forêt (coût 2, +1 Déf, +15 esquive) · 2 ruine (infranchissable)
export const TERRAIN = {
  0: { name: 'Plaine', cost: 1, def: 0, avoid: 0 },
  1: { name: 'Forêt',  cost: 2, def: 1, avoid: 15 },
  2: { name: 'Ruine',  cost: Infinity, def: 0, avoid: 0 },
};

// Carte symétrique (rotation 180°)
export const MAP = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,1,0,0,1,0,0],
  [1,0,2,0,0,0,0,0],
  [0,0,0,0,0,2,0,1],
  [0,0,1,0,0,1,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
];

// --- Armées de départ (bleus en bas, rouges en haut, miroir 180°)
export const START_UNITS = [
  ['cavalier', 1, 7],
  ['lord',     3, 7],
  ['mage',     4, 7],
  ['knight',   6, 7],
  ['soldier',  2, 6],
  ['soldier',  5, 6],
];

export const TEAM_NAMES = ['Bleus', 'Rouges'];
