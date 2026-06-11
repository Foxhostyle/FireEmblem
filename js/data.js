// ============================================================
// Échec & Lame — données du jeu (classes, objets, carte)
// ============================================================
'use strict';

const BOARD = 8;          // plateau 8x8
const SUDDEN_DEATH = 40;  // demi-tours avant la mort subite
const DOUBLE_SPD = 3;     // écart de vitesse pour doubler

// --- Classes d'unités (inspirées des pièces d'échecs) -------
// rng : portées d'attaque ; pass : traverse toutes les unités
const CLASSES = {
  lord: {
    name: 'Seigneur', piece: 'Roi',
    hp: 20, atk: 6, def: 4, spd: 6, mov: 3,
    rng: [1], wpn: 'sword',
    desc: "S'il tombe, la partie est perdue.",
  },
  soldier: {
    name: 'Soldat', piece: 'Pion',
    hp: 18, atk: 5, def: 3, spd: 4, mov: 2,
    rng: [1], wpn: 'lance',
    desc: 'Solide ligne de front.',
  },
  cavalier: {
    name: 'Cavalier', piece: 'Cavalier',
    hp: 17, atk: 5, def: 3, spd: 7, mov: 4,
    rng: [1], wpn: 'sword', pass: true,
    desc: 'Rapide, saute par-dessus les unités.',
  },
  knight: {
    name: 'Chevalier', piece: 'Tour',
    hp: 22, atk: 7, def: 6, spd: 1, mov: 2,
    rng: [1], wpn: 'axe',
    desc: 'Mur de fer, mais lent.',
  },
  mage: {
    name: 'Mage', piece: 'Fou',
    hp: 14, atk: 7, def: 2, spd: 5, mov: 3,
    rng: [1, 2], wpn: 'magic', magic: true,
    desc: 'Frappe à distance, ignore la moitié de la Déf.',
  },
};

const WPN_NAMES = { sword: 'Épée', lance: 'Lance', axe: 'Hache', magic: 'Magie' };

// Triangle des armes : épée > hache > lance > épée (±1 dégât)
const TRIANGLE = { sword: 'axe', axe: 'lance', lance: 'sword' };

// --- Équipement : toujours un bonus CONTRE un malus ----------
// Chaque objet est unique au sein d'un camp. 1 arme + 1 armure max par unité.
const ITEMS = {
  weapons: [
    { id: 'w_heavy', name: 'Forge lourde',   mods: { atk: +3, spd: -2 } },
    { id: 'w_light', name: 'Forge légère',   mods: { spd: +2, atk: -1 } },
    { id: 'w_keen',  name: 'Forge perçante', mods: { atk: +2, def: -2 } },
    { id: 'w_guard', name: 'Forge de garde', mods: { def: +2, atk: -1 } },
  ],
  armors: [
    { id: 'a_plate', name: 'Harnois de plates', mods: { def: +3, spd: -2 } },
    { id: 'a_cape',  name: 'Cape d’agilité', mods: { spd: +2, def: -1 } },
    { id: 'a_boots', name: 'Bottes ailées',      mods: { mov: +1, def: -2 } },
    { id: 'a_charm', name: 'Amulette vitale',    mods: { hp: +6, spd: -1 } },
  ],
};

const STAT_NAMES = { hp: 'PV', atk: 'Atq', def: 'Déf', spd: 'Vit', mov: 'Mou' };

// --- Terrain --------------------------------------------------
// 0 plaine (coût 1), 1 forêt (coût 2, +1 Déf)
const TERRAIN = {
  0: { name: 'Plaine', cost: 1, def: 0 },
  1: { name: 'Forêt',  cost: 2, def: 1 },
};

// Carte symétrique (rotation 180°)
const MAP = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,1,0,0,1,0,0],
  [1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1],
  [0,0,1,0,0,1,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
];

// --- Armées de départ (bleus en bas, rouges en haut, miroir 180°)
const START_UNITS = [
  // [classe, x, y] pour l'équipe 0 (bleus) ; rouges = miroir
  ['cavalier', 1, 7],
  ['lord',     3, 7],
  ['mage',     4, 7],
  ['knight',   6, 7],
  ['soldier',  2, 6],
  ['soldier',  5, 6],
];

const TEAM_NAMES = ['Bleus', 'Rouges'];
