import { ArenaMap, OperatorData, WeaponData, GameSettings, TacticalPerk } from '../types/game';

export const INITIAL_WEAPONS: WeaponData[] = [
  {
    id: 'm4_vanguard',
    name: 'M4-Vanguard',
    type: 'assault',
    category: 'primary',
    damage: 32,
    fireRate: 11.5,
    magSize: 30,
    currentAmmo: 30,
    reserveAmmo: 120,
    reloadTime: 1.8,
    accuracy: 78,
    range: 65,
    mobility: 72,
    control: 80,
    recoil: 0.022,
    spread: 0.018,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#1e242d',
      secondary: '#2e3846',
      accent: '#eab308',
      glow: '#38bdf8',
    },
    attachments: [
      { id: 'optic_holo', name: 'Holographic Reflex', slot: 'optic', statMod: { accuracy: 8 }, enabled: true },
      { id: 'barrel_ext', name: 'Extended Match Barrel', slot: 'barrel', statMod: { range: 12, mobility: -4 }, enabled: false },
      { id: 'mag_45', name: '45-Round Drum Mag', slot: 'magazine', statMod: { control: -5 }, enabled: false },
      { id: 'laser_tac', name: '5mW Tactical Laser', slot: 'laser', statMod: { mobility: 6, accuracy: 4 }, enabled: true },
    ],
    description: 'All-around military standard assault platform. High stability and predictable recoil pattern for mid-range skirmishes.'
  },
  {
    id: 'dl_arctic',
    name: 'DL-Arctic .50',
    type: 'sniper',
    category: 'primary',
    damage: 115,
    fireRate: 1.2,
    magSize: 5,
    currentAmmo: 5,
    reserveAmmo: 25,
    reloadTime: 2.6,
    accuracy: 95,
    range: 98,
    mobility: 48,
    control: 54,
    recoil: 0.08,
    spread: 0.002,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#111827',
      secondary: '#374151',
      accent: '#38bdf8',
      glow: '#60a5fa',
    },
    attachments: [
      { id: 'optic_thermal', name: 'Variable 8x Zoom Scope', slot: 'optic', statMod: { range: 10 }, enabled: true },
      { id: 'barrel_fluted', name: 'Heavy Fluted Barrel', slot: 'barrel', statMod: { damage: 8 }, enabled: true },
    ],
    description: 'High-caliber anti-material precision rifle. Guaranteed one-shot kill on chest and headshots across any distance.'
  },
  {
    id: 'fennec_volt',
    name: 'Fennec Volt-9',
    type: 'smg',
    category: 'primary',
    damage: 22,
    fireRate: 17.0,
    magSize: 35,
    currentAmmo: 35,
    reserveAmmo: 140,
    reloadTime: 1.4,
    accuracy: 62,
    range: 42,
    mobility: 92,
    control: 66,
    recoil: 0.028,
    spread: 0.032,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#1c1917',
      secondary: '#44403c',
      accent: '#ec4899',
      glow: '#f43f5e',
    },
    attachments: [
      { id: 'optic_reddot', name: 'Micro Red Dot', slot: 'optic', statMod: { accuracy: 5 }, enabled: true },
      { id: 'barrel_suppr', name: 'Monolithic Suppressor', slot: 'barrel', statMod: { range: 6 }, enabled: true },
    ],
    description: 'Supercharged submachine gun with unmatched cyclic rate of fire. Devastating for aggressive close-quarters clearing.'
  },
  {
    id: 'krm_breaker',
    name: 'KRM-Breaker 12G',
    type: 'shotgun',
    category: 'primary',
    damage: 18, // per pellet (8 pellets = 144 max)
    fireRate: 1.5,
    magSize: 8,
    currentAmmo: 8,
    reserveAmmo: 32,
    reloadTime: 2.2,
    accuracy: 45,
    range: 30,
    mobility: 80,
    control: 60,
    recoil: 0.065,
    spread: 0.065,
    bulletsPerShot: 8,
    isAutomatic: false,
    colorScheme: {
      primary: '#262626',
      secondary: '#525252',
      accent: '#f97316',
      glow: '#fb923c',
    },
    attachments: [
      { id: 'barrel_choke', name: 'Marauder Choke', slot: 'barrel', statMod: { accuracy: 15, range: 10 }, enabled: true },
    ],
    description: 'Pump-action tactical combat shotgun. Clears corridors with deadly 8-pellet buckshot spread.'
  },
  {
    id: 'deagle_gs',
    name: '.50 GS Hand Cannon',
    type: 'pistol',
    category: 'secondary',
    damage: 55,
    fireRate: 3.5,
    magSize: 7,
    currentAmmo: 7,
    reserveAmmo: 35,
    reloadTime: 1.5,
    accuracy: 75,
    range: 52,
    mobility: 90,
    control: 58,
    recoil: 0.045,
    spread: 0.02,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#18181b',
      secondary: '#71717a',
      accent: '#eab308',
      glow: '#fbbf24',
    },
    attachments: [],
    description: 'Heavy secondary sidearm. Two-shot lethal capability with formidable stopping power.'
  },
  {
    id: 'combat_knife',
    name: 'Tactical Shadow Knife',
    type: 'knife',
    category: 'secondary',
    damage: 100,
    fireRate: 2.2,
    magSize: 1,
    currentAmmo: 1,
    reserveAmmo: 1,
    reloadTime: 0.1,
    accuracy: 100,
    range: 12,
    mobility: 100,
    control: 95,
    recoil: 0,
    spread: 0,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#09090b',
      secondary: '#27272a',
      accent: '#ef4444',
      glow: '#dc2626',
    },
    attachments: [],
    description: 'Forged carbon-steel tactical blade. Instant silent melee execution in close proximity.'
  }
];

export const SAITAMA_POWERS: WeaponData[] = [
  {
    id: 'saitama_normal_punch',
    name: 'Normal Casual Strike',
    type: 'fist',
    category: 'primary',
    damage: 180,
    fireRate: 3.5,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.1,
    accuracy: 96,
    range: 45,
    mobility: 100,
    control: 95,
    recoil: 0.015,
    spread: 0.01,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#ef4444',
      secondary: '#fef08a',
      accent: '#eab308',
      glow: '#f97316',
    },
    attachments: [],
    description: 'A casual, effortless punch creating a visible atmospheric pressure cone that vaporizes anything in its path.'
  },
  {
    id: 'saitama_consecutive',
    name: 'Consecutive Normal Punches',
    type: 'fist',
    category: 'primary',
    damage: 65,
    fireRate: 15.0,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 88,
    range: 40,
    mobility: 98,
    control: 85,
    recoil: 0.02,
    spread: 0.035,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#dc2626',
      secondary: '#fef08a',
      accent: '#eab308',
      glow: '#fbbf24',
    },
    attachments: [],
    description: 'An unstoppable wall of ultra-high-speed punches creating a continuous barrage of explosive sonic airbursts.'
  },
  {
    id: 'saitama_serious',
    name: 'Serious Punch Shockwave',
    type: 'fist',
    category: 'primary',
    damage: 500,
    fireRate: 0.8,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.6,
    accuracy: 100,
    range: 90,
    mobility: 92,
    control: 90,
    recoil: 0.06,
    spread: 0.005,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#b91c1c',
      secondary: '#fef08a',
      accent: '#f59e0b',
      glow: '#ef4444',
    },
    attachments: [],
    description: 'A committed, planetary-grade punch whose sheer atmospheric displacement parts clouds across whole continents.'
  },
  {
    id: 'saitama_afterimage',
    name: 'Omnidirectional Strike',
    type: 'fist',
    category: 'secondary',
    damage: 220,
    fireRate: 2.5,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 98,
    range: 50,
    mobility: 100,
    control: 92,
    recoil: 0.01,
    spread: 0.01,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#f59e0b',
      secondary: '#ffffff',
      accent: '#facc15',
      glow: '#38bdf8',
    },
    attachments: [],
    description: 'Hyper-velocity afterimages attacking the target from every spatial vector simultaneously.'
  }
];

export const GOKU_POWERS: WeaponData[] = [
  {
    id: 'goku_ki_blast',
    name: 'Ki Blast Barrage',
    type: 'ki_blast',
    category: 'primary',
    damage: 45,
    fireRate: 12.0,
    magSize: 100,
    currentAmmo: 100,
    reserveAmmo: 400,
    reloadTime: 0.8,
    accuracy: 84,
    range: 75,
    mobility: 95,
    control: 85,
    recoil: 0.018,
    spread: 0.02,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#facc15',
      secondary: '#38bdf8',
      accent: '#f59e0b',
      glow: '#67e8f9',
    },
    attachments: [],
    description: 'Rapid-fire concentrated Ki spheres hurled with precision from palms, detonating on impact with concussive energy.'
  },
  {
    id: 'goku_kamehameha',
    name: 'Kamehameha Wave',
    type: 'beam',
    category: 'primary',
    damage: 175,
    fireRate: 1.5,
    magSize: 50,
    currentAmmo: 50,
    reserveAmmo: 200,
    reloadTime: 1.5,
    accuracy: 98,
    range: 95,
    mobility: 80,
    control: 88,
    recoil: 0.04,
    spread: 0.005,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#0284c7',
      secondary: '#38bdf8',
      accent: '#bae6fd',
      glow: '#0ea5e9',
    },
    attachments: [],
    description: 'Master Roshi’s sacred Turtle School blast. A piercing radiant cyan beam that annihilates enemy defenses in a straight line.'
  },
  {
    id: 'goku_spirit_bomb',
    name: 'Spirit Bomb (Genki Dama)',
    type: 'energy_ball',
    category: 'secondary',
    damage: 400,
    fireRate: 0.7,
    magSize: 10,
    currentAmmo: 10,
    reserveAmmo: 30,
    reloadTime: 2.2,
    accuracy: 95,
    range: 85,
    mobility: 75,
    control: 80,
    recoil: 0.05,
    spread: 0.01,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#38bdf8',
      secondary: '#e0f2fe',
      accent: '#67e8f9',
      glow: '#ffffff',
    },
    attachments: [],
    description: 'Divine celestial sphere gathering energy from the universe. Explodes in a massive radiant spherical AoE shockwave.'
  },
  {
    id: 'goku_dragon_fist',
    name: 'Dragon Fist / Instant Transmission',
    type: 'fist',
    category: 'secondary',
    damage: 250,
    fireRate: 2.0,
    magSize: 50,
    currentAmmo: 50,
    reserveAmmo: 150,
    reloadTime: 0.4,
    accuracy: 100,
    range: 45,
    mobility: 100,
    control: 92,
    recoil: 0.015,
    spread: 0.005,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#ea580c',
      secondary: '#facc15',
      accent: '#f97316',
      glow: '#fde047',
    },
    attachments: [],
    description: 'Instant Transmission teleportation into an explosive Golden Dragon Fist piercing straight through opponent lines.'
  }
];

export const SUPERMAN_POWERS: WeaponData[] = [
  {
    id: 'superman_kryptonian_strike',
    name: 'Kryptonian Heavy Strike',
    type: 'kryptonian_strike',
    category: 'primary',
    damage: 195,
    fireRate: 3.0,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.1,
    accuracy: 98,
    range: 48,
    mobility: 100,
    control: 96,
    recoil: 0.012,
    spread: 0.008,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#13347a',
      secondary: '#b91c1c',
      accent: '#eab308',
      glow: '#ef4444',
    },
    attachments: [],
    description: 'Colossal Kryptonian shockwave strike that shatters ground geometry and launches hostile squads across the arena.'
  },
  {
    id: 'superman_heat_vision',
    name: 'Focused Heat Vision',
    type: 'heat_vision',
    category: 'primary',
    damage: 85,
    fireRate: 10.0,
    magSize: 120,
    currentAmmo: 120,
    reserveAmmo: 480,
    reloadTime: 0.9,
    accuracy: 99,
    range: 96,
    mobility: 95,
    control: 94,
    recoil: 0.008,
    spread: 0.004,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#dc2626',
      secondary: '#facc15',
      accent: '#ffffff',
      glow: '#f97316',
    },
    attachments: [],
    description: 'Twin solar-charged optical plasma beams cutting through composite armor and detonating targets at extreme range.'
  },
  {
    id: 'superman_super_breath',
    name: 'Arctic Super-Breath',
    type: 'super_breath',
    category: 'secondary',
    damage: 160,
    fireRate: 1.4,
    magSize: 30,
    currentAmmo: 30,
    reserveAmmo: 120,
    reloadTime: 1.2,
    accuracy: 92,
    range: 42,
    mobility: 92,
    control: 90,
    recoil: 0.02,
    spread: 0.03,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#0284c7',
      secondary: '#bae6fd',
      accent: '#e0f2fe',
      glow: '#38bdf8',
    },
    attachments: [],
    description: 'Sub-zero hurricane gale cone that freezes enemies solid, shatters incoming projectiles, and blasts back formations.'
  },
  {
    id: 'superman_sonic_ram',
    name: 'Sonic Flight Ram',
    type: 'kryptonian_strike',
    category: 'secondary',
    damage: 260,
    fireRate: 1.8,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.3,
    accuracy: 100,
    range: 55,
    mobility: 100,
    control: 95,
    recoil: 0.015,
    spread: 0.005,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#1d4ed8',
      secondary: '#60a5fa',
      accent: '#facc15',
      glow: '#93c5fd',
    },
    attachments: [],
    description: 'Breaks the sound barrier in an omni-directional flight surge, delivering a devastating blue-white sonic boom impact.'
  }
];

export const MAXWELL_POWERS: WeaponData[] = [
  {
    id: 'maxwell_arcane_bolt',
    name: 'Arcane Bolt Volley',
    type: 'arcane_bolt',
    category: 'primary',
    damage: 54,
    fireRate: 11.5,
    magSize: 80,
    currentAmmo: 80,
    reserveAmmo: 320,
    reloadTime: 0.9,
    accuracy: 92,
    range: 82,
    mobility: 96,
    control: 90,
    recoil: 0.014,
    spread: 0.014,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#4c1d95',
      secondary: '#a855f7',
      accent: '#fbbf24',
      glow: '#c084fc',
    },
    attachments: [],
    description: 'Rapid-fire conjured bolts of condensed Aether that home cleanly across mid-range sightlines and detonate with violet rune sparks.'
  },
  {
    id: 'maxwell_rune_beam',
    name: 'Aether Rune Ray',
    type: 'rune_beam',
    category: 'primary',
    damage: 195,
    fireRate: 1.5,
    magSize: 40,
    currentAmmo: 40,
    reserveAmmo: 160,
    reloadTime: 1.2,
    accuracy: 99,
    range: 96,
    mobility: 88,
    control: 94,
    recoil: 0.025,
    spread: 0.004,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#5b21b6',
      secondary: '#c084fc',
      accent: '#fde047',
      glow: '#e879f9',
    },
    attachments: [],
    description: 'Focuses Maxwell’s crystal scepter into a piercing beam of golden-violet runic energy that tears through enemy armor.'
  },
  {
    id: 'maxwell_chronos_orb',
    name: 'Chronos Gravity Sphere',
    type: 'chronos_orb',
    category: 'secondary',
    damage: 310,
    fireRate: 0.9,
    magSize: 16,
    currentAmmo: 16,
    reserveAmmo: 64,
    reloadTime: 1.5,
    accuracy: 96,
    range: 85,
    mobility: 86,
    control: 88,
    recoil: 0.035,
    spread: 0.008,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#0e7490',
      secondary: '#38bdf8',
      accent: '#facc15',
      glow: '#67e8f9',
    },
    attachments: [],
    description: 'Launches an unstable temporal orb that warps space-time on impact and shatters hostile formations.'
  },
  {
    id: 'maxwell_void_nova',
    name: 'Void Nova Burst',
    type: 'void_nova',
    category: 'secondary',
    damage: 240,
    fireRate: 2.2,
    magSize: 40,
    currentAmmo: 40,
    reserveAmmo: 160,
    reloadTime: 0.8,
    accuracy: 95,
    range: 58,
    mobility: 98,
    control: 92,
    recoil: 0.018,
    spread: 0.012,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#881337',
      secondary: '#f43f5e',
      accent: '#fbbf24',
      glow: '#fb7185',
    },
    attachments: [],
    description: 'Unleashes an expanding crimson-violet astral wave from Maxwell’s sigil ring, blasting foes backward.'
  }
];

export const KING_POWERS: WeaponData[] = [
  {
    id: 'king_engine_pulse',
    name: 'King Engine Acoustic Roar',
    type: 'king_engine',
    category: 'primary',
    damage: 145,
    fireRate: 4.5,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 96,
    range: 62,
    mobility: 92,
    control: 96,
    recoil: 0.012,
    spread: 0.015,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#18181b',
      secondary: '#dc2626',
      accent: '#fbbf24',
      glow: '#f59e0b',
    },
    attachments: [],
    description: 'Projects the deafening thump of the King Engine as a golden-crimson shockwave that terrifies and shatters enemies.'
  },
  {
    id: 'king_hellfire_wave',
    name: 'Hellfire Wave-Motion Cannon',
    type: 'king_wave',
    category: 'secondary',
    damage: 340,
    fireRate: 1.1,
    magSize: 30,
    currentAmmo: 30,
    reserveAmmo: 120,
    reloadTime: 1.4,
    accuracy: 98,
    range: 92,
    mobility: 85,
    control: 90,
    recoil: 0.03,
    spread: 0.008,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#991b1b',
      secondary: '#f59e0b',
      accent: '#fde047',
      glow: '#ef4444',
    },
    attachments: [],
    description: 'Ultimate Purgatory Abyssal Wave-Motion blast unleashed at peak S-Class intimidation.'
  }
];

export const FLASH_POWERS: WeaponData[] = [
  {
    id: 'flash_lightning_throw',
    name: 'Speed Force Lightning',
    type: 'speed_lightning',
    category: 'primary',
    damage: 38,
    fireRate: 18.0,
    magSize: 120,
    currentAmmo: 120,
    reserveAmmo: 600,
    reloadTime: 0.6,
    accuracy: 90,
    range: 80,
    mobility: 100,
    control: 95,
    recoil: 0.008,
    spread: 0.014,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#dc2626',
      secondary: '#fbbf24',
      accent: '#fef08a',
      glow: '#f59e0b',
    },
    attachments: [],
    description: 'Hurls rapid streaks of raw Speed Force lightning generated from supersonic kinetic momentum.'
  },
  {
    id: 'flash_infinite_mass',
    name: 'Infinite Mass Punch',
    type: 'speed_punch',
    category: 'secondary',
    damage: 290,
    fireRate: 2.2,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 98,
    range: 46,
    mobility: 100,
    control: 94,
    recoil: 0.015,
    spread: 0.008,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#b91c1c',
      secondary: '#facc15',
      accent: '#ffffff',
      glow: '#fbbf24',
    },
    attachments: [],
    description: 'Strikes at near-light speed, imparting white-dwarf relativistic mass and concussive golden shockwaves.'
  }
];

export const LANTERN_POWERS: WeaponData[] = [
  {
    id: 'lantern_construct_gatling',
    name: 'Emerald Hard-Light Pulse',
    type: 'lantern_beam',
    category: 'primary',
    damage: 52,
    fireRate: 13.0,
    magSize: 100,
    currentAmmo: 100,
    reserveAmmo: 500,
    reloadTime: 0.8,
    accuracy: 94,
    range: 88,
    mobility: 94,
    control: 94,
    recoil: 0.01,
    spread: 0.01,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#15803d',
      secondary: '#22c55e',
      accent: '#86efac',
      glow: '#4ade80',
    },
    attachments: [],
    description: 'Fires razor-sharp emerald hard-light darts and plasma beams forged directly from the Oan Power Ring.'
  },
  {
    id: 'lantern_warhammer',
    name: 'Hard-Light Warhammer',
    type: 'lantern_hammer',
    category: 'secondary',
    damage: 265,
    fireRate: 1.5,
    magSize: 40,
    currentAmmo: 40,
    reserveAmmo: 160,
    reloadTime: 1.0,
    accuracy: 96,
    range: 58,
    mobility: 90,
    control: 90,
    recoil: 0.025,
    spread: 0.012,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#166534',
      secondary: '#4ade80',
      accent: '#bbf7d0',
      glow: '#22c55e',
    },
    attachments: [],
    description: 'Manifests a colossal green construct warhammer that crushes enemy shields and blasts targets backward.'
  }
];

export const SHAZAM_POWERS: WeaponData[] = [
  {
    id: 'shazam_living_lightning',
    name: 'Living Lightning Bolts',
    type: 'lightning_arc',
    category: 'primary',
    damage: 58,
    fireRate: 11.5,
    magSize: 90,
    currentAmmo: 90,
    reserveAmmo: 450,
    reloadTime: 0.8,
    accuracy: 92,
    range: 85,
    mobility: 96,
    control: 92,
    recoil: 0.012,
    spread: 0.012,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#dc2626',
      secondary: '#facc15',
      accent: '#fef9c3',
      glow: '#fde047',
    },
    attachments: [],
    description: 'Channels the magic of Zeus as rapid white-gold living lightning arcs from Shazam’s gauntlets.'
  },
  {
    id: 'shazam_hercules_fist',
    name: 'Strength of Hercules Strike',
    type: 'kryptonian_strike',
    category: 'secondary',
    damage: 245,
    fireRate: 2.2,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.15,
    accuracy: 98,
    range: 46,
    mobility: 98,
    control: 94,
    recoil: 0.018,
    spread: 0.008,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#b91c1c',
      secondary: '#eab308',
      accent: '#fef08a',
      glow: '#facc15',
    },
    attachments: [],
    description: 'Godlike physical strike empowered by Hercules and Achilles, releasing thunderous shockwaves.'
  }
];

export const THOR_POWERS: WeaponData[] = [
  {
    id: 'thor_mjolnir_throw',
    name: 'Mjolnir Thunder Strike',
    type: 'mjolnir_strike',
    category: 'primary',
    damage: 225,
    fireRate: 2.4,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.15,
    accuracy: 97,
    range: 64,
    mobility: 94,
    control: 92,
    recoil: 0.02,
    spread: 0.008,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#334155',
      secondary: '#94a3b8',
      accent: '#38bdf8',
      glow: '#67e8f9',
    },
    attachments: [],
    description: 'Hurls forged Uru Mjolnir lightning blasts that shatter armor and crackle across the battlefield.'
  },
  {
    id: 'thor_stormbreaker_arc',
    name: 'Bifrost Storm Arc',
    type: 'lightning_arc',
    category: 'secondary',
    damage: 62,
    fireRate: 11.0,
    magSize: 100,
    currentAmmo: 100,
    reserveAmmo: 400,
    reloadTime: 0.8,
    accuracy: 93,
    range: 86,
    mobility: 92,
    control: 90,
    recoil: 0.012,
    spread: 0.012,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#0284c7',
      secondary: '#38bdf8',
      accent: '#e0f2fe',
      glow: '#7dd3fc',
    },
    attachments: [],
    description: 'Unleashes continuous torrents of celestial Asgardian sky-lightning.'
  }
];

export const SILVESTER_POWERS: WeaponData[] = [
  {
    id: 'silvester_cosmic_gauntlet',
    name: 'Cosmic Judgment Gauntlet',
    type: 'silvester_gauntlet',
    category: 'primary',
    damage: 96,
    fireRate: 15.0,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.15,
    accuracy: 99,
    range: 98,
    mobility: 100,
    control: 98,
    recoil: 0.004,
    spread: 0.005,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: {
      primary: '#09090b',
      secondary: '#38bdf8',
      accent: '#fbbf24',
      glow: '#38bdf8',
    },
    attachments: [],
    description: 'Fires rapid sovereign antimatter bolts infused with cosmic energy that shred any armor in existence.'
  },
  {
    id: 'silvester_omega_blade',
    name: 'Omega Astral Blade',
    type: 'silvester_blade',
    category: 'secondary',
    damage: 340,
    fireRate: 2.6,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.15,
    accuracy: 100,
    range: 82,
    mobility: 100,
    control: 99,
    recoil: 0.008,
    spread: 0.003,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#312e81',
      secondary: '#a855f7',
      accent: '#fde047',
      glow: '#c084fc',
    },
    attachments: [],
    description: 'Manifests a celestial dimension-cleaving greatsword firing razor reality shockwaves.'
  },
  {
    id: 'silvester_hyperion_cannon',
    name: 'Hyperion Singularity Cannon',
    type: 'silvester_cannon',
    category: 'secondary',
    damage: 460,
    fireRate: 1.4,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 100,
    range: 100,
    mobility: 96,
    control: 96,
    recoil: 0.014,
    spread: 0.002,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: {
      primary: '#18181b',
      secondary: '#fbbf24',
      accent: '#38bdf8',
      glow: '#facc15',
    },
    attachments: [],
    description: 'Twin-core sovereign rail-beam fusing black hole plasma with celestial light.'
  }
];

export const DRE_POWERS: WeaponData[] = [
  {
    id: 'dre_sonic_cannon',
    name: '808 Sub-Bass Cannon',
    type: 'sonic_bass',
    category: 'primary',
    damage: 96,
    fireRate: 3.4,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.25,
    accuracy: 92,
    range: 82,
    mobility: 94,
    control: 92,
    recoil: 0.012,
    spread: 0.014,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: { primary: '#18181b', secondary: '#f97316', accent: '#fbbf24', glow: '#f97316' },
    attachments: [],
    description: 'Fires compressed studio bass waves that rattle armor and stagger advancing foes.'
  },
  {
    id: 'dre_boom_amp',
    name: 'Studio Equalizer Boom',
    type: 'sonic_boom',
    category: 'secondary',
    damage: 215,
    fireRate: 1.5,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.3,
    accuracy: 94,
    range: 75,
    mobility: 90,
    control: 88,
    recoil: 0.018,
    spread: 0.01,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: { primary: '#27272a', secondary: '#fbbf24', accent: '#f97316', glow: '#fde047' },
    attachments: [],
    description: 'Heavy subwoofer blast wave built to knock attackers back off objectives.'
  }
];

export const TRUTH_POWERS: WeaponData[] = [
  {
    id: 'truth_veritas_ray',
    name: 'All-Seeing Veritas Ray',
    type: 'truth_ray',
    category: 'primary',
    damage: 145,
    fireRate: 4.5,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 100,
    range: 100,
    mobility: 96,
    control: 98,
    recoil: 0.004,
    spread: 0.002,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: { primary: '#f8fafc', secondary: '#fbbf24', accent: '#fef08a', glow: '#fbbf24' },
    attachments: [],
    description: 'Continuous golden beams of pure revealed truth that pierce shields cleanly.'
  },
  {
    id: 'truth_oracle_prism',
    name: 'Golden Oracle Prism',
    type: 'truth_prism',
    category: 'secondary',
    damage: 320,
    fireRate: 1.8,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.25,
    accuracy: 100,
    range: 98,
    mobility: 95,
    control: 96,
    recoil: 0.008,
    spread: 0.001,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: { primary: '#0f172a', secondary: '#38bdf8', accent: '#fbbf24', glow: '#fde047' },
    attachments: [],
    description: 'Focused pyramid refraction beam shattering illusions and heavy armor alike.'
  }
];

export const HEILIEA_POWERS: WeaponData[] = [
  {
    id: 'heiliea_starlight_lance',
    name: 'Starlight Valkyrie Lance',
    type: 'star_lance',
    category: 'primary',
    damage: 138,
    fireRate: 4.8,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 98,
    range: 96,
    mobility: 98,
    control: 96,
    recoil: 0.006,
    spread: 0.004,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: { primary: '#fce7f3', secondary: '#f472b6', accent: '#fbbf24', glow: '#f472b6' },
    attachments: [],
    description: 'Luminous rose-gold energy spears launched at blinding aerial speed.'
  },
  {
    id: 'heiliea_petal_storm',
    name: 'Celestial Petal Storm',
    type: 'petal_storm',
    category: 'secondary',
    damage: 280,
    fireRate: 2.1,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.25,
    accuracy: 96,
    range: 92,
    mobility: 98,
    control: 95,
    recoil: 0.009,
    spread: 0.008,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: { primary: '#be185d', secondary: '#fbcfe8', accent: '#fde047', glow: '#f472b6' },
    attachments: [],
    description: 'Cascading starlight blossoms carrying celestial impact.'
  }
];

export const BABY_POWERS: WeaponData[] = [
  {
    id: 'baby_bottle_blaster',
    name: 'Turbo Plasma Bottle',
    type: 'bottle_blaster',
    category: 'primary',
    damage: 130,
    fireRate: 5.5,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 96,
    range: 92,
    mobility: 100,
    control: 94,
    recoil: 0.006,
    spread: 0.006,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: { primary: '#38bdf8', secondary: '#fef08a', accent: '#ef4444', glow: '#38bdf8' },
    attachments: [],
    description: 'High-pressure cosmic formula blaster firing rapid glowing plasma droplets.'
  },
  {
    id: 'baby_rattle_smash',
    name: 'Cosmic Rattle Smasher',
    type: 'tantrum_smash',
    category: 'secondary',
    damage: 340,
    fireRate: 1.7,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.25,
    accuracy: 95,
    range: 80,
    mobility: 100,
    control: 92,
    recoil: 0.012,
    spread: 0.005,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: { primary: '#fbbf24', secondary: '#38bdf8', accent: '#ef4444', glow: '#fde047' },
    attachments: [],
    description: 'Toy rattle overflowing with inexplicable cosmic shockwave force.'
  }
];

export const ZENITSU_POWERS: WeaponData[] = [
  {
    id: 'zenitsu_nichirin_blade',
    name: 'Yellow Nichirin Katana',
    type: 'nichirin_thunder',
    category: 'primary',
    damage: 145,
    fireRate: 5.6,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.18,
    accuracy: 99,
    range: 88,
    mobility: 100,
    control: 96,
    recoil: 0.005,
    spread: 0.004,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: { primary: '#18181b', secondary: '#facc15', accent: '#fef08a', glow: '#fbbf24' },
    attachments: [],
    description: 'Thunder-forged Nichirin blade launching rapid iaijutsu lightning slash arcs.'
  },
  {
    id: 'zenitsu_thunderclap',
    name: 'Thunderclap & Flash Edge',
    type: 'thunder_flash',
    category: 'secondary',
    damage: 325,
    fireRate: 2.0,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 100,
    range: 95,
    mobility: 100,
    control: 98,
    recoil: 0.01,
    spread: 0.001,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: { primary: '#fbbf24', secondary: '#38bdf8', accent: '#ffffff', glow: '#fde047' },
    attachments: [],
    description: 'Godspeed lightning-drawn cleave moving faster than sound.'
  }
];

export const TANJIRO_POWERS: WeaponData[] = [
  {
    id: 'tanjiro_water_blade',
    name: 'Black Nichirin (Water)',
    type: 'water_slash',
    category: 'primary',
    damage: 140,
    fireRate: 4.8,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 98,
    range: 90,
    mobility: 97,
    control: 98,
    recoil: 0.006,
    spread: 0.005,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: { primary: '#0f172a', secondary: '#38bdf8', accent: '#bae6fd', glow: '#0ea5e9' },
    attachments: [],
    description: 'Flowing Water Breathing katana arcing azure hydro-slashes across the arena.'
  },
  {
    id: 'tanjiro_hinokami_blade',
    name: 'Hinokami Kagura (Sun)',
    type: 'sun_flame',
    category: 'secondary',
    damage: 310,
    fireRate: 2.1,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.22,
    accuracy: 99,
    range: 94,
    mobility: 98,
    control: 96,
    recoil: 0.01,
    spread: 0.003,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: { primary: '#7f1d1d', secondary: '#f97316', accent: '#fde047', glow: '#ef4444' },
    attachments: [],
    description: 'Scarlet Sun Breathing blade unleashing blazing crimson solar rings.'
  }
];

export const MUZAN_POWERS: WeaponData[] = [
  {
    id: 'muzan_spine_whip',
    name: 'Biokinesis Spine Whips',
    type: 'demon_whip',
    category: 'primary',
    damage: 155,
    fireRate: 5.0,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.18,
    accuracy: 97,
    range: 92,
    mobility: 96,
    control: 95,
    recoil: 0.007,
    spread: 0.006,
    bulletsPerShot: 1,
    isAutomatic: true,
    colorScheme: { primary: '#18181b', secondary: '#dc2626', accent: '#f43f5e', glow: '#ef4444' },
    attachments: [],
    description: 'Whip-like demonic flesh blades slicing high-velocity crimson shock arcs.'
  },
  {
    id: 'muzan_blood_bramble',
    name: 'Black Blood Brambles',
    type: 'blood_thorn',
    category: 'secondary',
    damage: 335,
    fireRate: 1.9,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.24,
    accuracy: 98,
    range: 95,
    mobility: 95,
    control: 95,
    recoil: 0.011,
    spread: 0.004,
    bulletsPerShot: 1,
    isAutomatic: false,
    colorScheme: { primary: '#450a0a', secondary: '#be123c', accent: '#a855f7', glow: '#f43f5e' },
    attachments: [],
    description: 'Barbed crimson Demon King thorns erupting with cursed shockwaves.'
  }
];

function makeHeroWeapon(
  id: string,
  name: string,
  type: WeaponData['type'],
  category: 'primary' | 'secondary',
  damage: number,
  fireRate: number,
  colors: [string, string, string, string],
  description: string
): WeaponData {
  return {
    id,
    name,
    type,
    category,
    damage,
    fireRate,
    magSize: 999,
    currentAmmo: 999,
    reserveAmmo: 999,
    reloadTime: 0.2,
    accuracy: 99,
    range: 96,
    mobility: 96,
    control: 96,
    recoil: category === 'primary' ? 0.006 : 0.014,
    spread: category === 'primary' ? 0.005 : 0.002,
    bulletsPerShot: 1,
    isAutomatic: category === 'primary',
    colorScheme: { primary: colors[0], secondary: colors[1], accent: colors[2], glow: colors[3] },
    attachments: [],
    description,
  };
}

export const IRON_MAN_POWERS: WeaponData[] = [
  makeHeroWeapon('ironman_repulsors', 'Stark Repulsor Gauntlets', 'repulsor_beam', 'primary', 142, 4.6, ['#b91c1c', '#fbbf24', '#38bdf8', '#38bdf8'], 'Rapid nanotech repulsor bolts channeled directly from Tony Stark’s Arc Reactor.'),
  makeHeroWeapon('ironman_unibeam', 'RT Chest Unibeam', 'unibeam', 'secondary', 380, 1.4, ['#991b1b', '#e2e8f0', '#fbbf24', '#7dd3fc'], 'Concentrated plasma Unibeam engineered to punch through heavy exosuits.'),
];

export const SPIDER_MAN_POWERS: WeaponData[] = [
  makeHeroWeapon('spiderman_webshooters', 'Stark Web-Shooters', 'web_shooter', 'primary', 124, 5.2, ['#dc2626', '#1d4ed8', '#f8fafc', '#e2e8f0'], 'High-tension synthetic webbing firing rapid impact-web bursts across rooftops.'),
  makeHeroWeapon('spiderman_webgauntlet', 'Iron-Web Impact Hammer', 'web_gauntlet', 'secondary', 295, 2.0, ['#991b1b', '#fbbf24', '#a855f7', '#38bdf8'], 'Compressed electric-web kinetic smash amplified by Iron Spider & Symbiote tendrils.'),
];

export const STRANGE_POWERS: WeaponData[] = [
  makeHeroWeapon('strange_mandala', 'Eldritch Mandala Bolts', 'eldritch_bolt', 'primary', 148, 4.2, ['#1e3a8a', '#f97316', '#facc15', '#fb923c'], 'Spinning Vishanti spell mandalas unleashing scorching mystic shards.'),
  makeHeroWeapon('strange_crimson_whip', 'Crimson Bands Whip', 'eldritch_whip', 'secondary', 345, 1.7, ['#7c2d12', '#ea580c', '#22c55e', '#facc15'], 'Arcane conjured whips infused with Time Stone & Darkhold reality energy.'),
];

export const WANDA_POWERS: WeaponData[] = [
  makeHeroWeapon('wanda_hex_bolts', 'Scarlet Chaos Hex', 'chaos_hex', 'primary', 156, 4.4, ['#991b1b', '#ef4444', '#f43f5e', '#fb7185'], 'Probability-warping crimson Chaos Magic bolts that destabilize enemy defenses.'),
  makeHeroWeapon('wanda_darkhold_rift', 'Chthon Reality Rift', 'chaos_rift', 'secondary', 375, 1.5, ['#450a0a', '#dc2626', '#f43f5e', '#f43f5e'], 'Shatters spatial fabric with unleashed Darkhold Scarlett Witch hexes.'),
];

export const BATMAN_POWERS: WeaponData[] = [
  makeHeroWeapon('batman_batarangs', 'Mk-VII Razor Batarangs', 'batarang', 'primary', 136, 4.8, ['#18181b', '#3f3f46', '#fbbf24', '#ef4444'], 'Precision carbon-alloy and Hellbat-heated throwing batarangs with stun micro-charges.'),
  makeHeroWeapon('batman_shock_gauntlet', 'Bat-Shock Disruptor', 'bat_gauntlet', 'secondary', 320, 1.8, ['#09090b', '#dc2626', '#fbbf24', '#ef4444'], 'High-voltage WayneTech knuckle shockwaves capable of dropping meta-humans.'),
];

export const WONDER_WOMAN_POWERS: WeaponData[] = [
  makeHeroWeapon('ww_godkiller_sword', 'Godkiller Blade & Aegis', 'amazon_sword', 'primary', 155, 4.0, ['#b91c1c', '#fbbf24', '#1d4ed8', '#fde047'], 'Themysciran divine sword arcs imbued with Olympian shockwave edges.'),
  makeHeroWeapon('ww_lasso_of_truth', 'Lasso of Hestia Strike', 'lasso_truth', 'secondary', 340, 1.7, ['#fbbf24', '#fef08a', '#f59e0b', '#fde047'], 'Blazing unbreakable golden lasso lashes that stun liars and tear armor apart.'),
];

export const AQUAMAN_POWERS: WeaponData[] = [
  makeHeroWeapon('aquaman_trident', 'Trident of Atlan', 'trident_bolt', 'primary', 150, 4.1, ['#d97706', '#059669', '#38bdf8', '#22d3ee'], 'Atlantean royal trident firing pressurized oceanic hydro-bolts and sea lightning.'),
  makeHeroWeapon('aquaman_hydro_lance', 'Abyssal Hydro Lance', 'hydro_lance', 'secondary', 350, 1.6, ['#0f766e', '#fbbf24', '#06b6d4', '#67e8f9'], 'Crushing deep-trench water lances capable of breaching warship hulls.'),
];

export const RIMURU_POWERS: WeaponData[] = [
  makeHeroWeapon('rimuru_megiddo', 'Megiddo Sun-Water Ray', 'megiddo_ray', 'primary', 165, 4.8, ['#0ea5e9', '#e2e8f0', '#facc15', '#38bdf8'], 'Thousands of hyper-focused azure water droplets refracting lethal solar beams.'),
  makeHeroWeapon('rimuru_katana', 'Dragon Spirit Katana', 'tempest_katana', 'secondary', 390, 1.7, ['#0f172a', '#38bdf8', '#c084fc', '#67e8f9'], 'Mythic-grade Tempest blade humming with Veldora’s Black Lightning & Ciel precision.'),
];

export const JINWOO_POWERS: WeaponData[] = [
  makeHeroWeapon('jinwoo_daggers', 'Kasaka & Knight Killer', 'monarch_daggers', 'primary', 158, 5.4, ['#18181b', '#7c3aed', '#38bdf8', '#a855f7'], 'Twin Shadow Monarch assassin daggers tearing phantom violet slash trails.'),
  makeHeroWeapon('jinwoo_kamish', 'Kamish’s Wrath Fangs', 'kamish_wrath', 'secondary', 410, 1.8, ['#312e81', '#a855f7', '#e879f9', '#c084fc'], 'Dragon-forged daggers channeling Ashborn’s Sovereign purple mana.'),
];

export const NARUTO_POWERS: WeaponData[] = [
  makeHeroWeapon('naruto_rasengan', 'Sage Chakra Rasengan', 'rasengan_orb', 'primary', 162, 4.2, ['#ea580c', '#facc15', '#38bdf8', '#38bdf8'], 'Spinning spheres of compressed Wind-style, Kurama, and Six Paths chakra.'),
  makeHeroWeapon('naruto_kunai', 'Truth-Seeking Kunai', 'shinobi_kunai', 'secondary', 385, 1.8, ['#09090b', '#fbbf24', '#f97316', '#fde047'], 'Instant-striking Sage kunai backed by Baryon crimson-gold chakra rings.'),
];

export const LUFFY_POWERS: WeaponData[] = [
  makeHeroWeapon('luffy_gum_pistol', 'Gum-Gum Red Hawk', 'gum_pistol', 'primary', 154, 4.6, ['#dc2626', '#fbbf24', '#f8fafc', '#f97316'], 'Rubber-accelerated Armament Haki fists igniting mid-air into flaming Red Hawks.'),
  makeHeroWeapon('luffy_haki_fist', 'Sun God Conqueror’s Fist', 'haki_fist', 'secondary', 405, 1.6, ['#f8fafc', '#c084fc', '#fde047', '#ffffff'], 'Toon-physics Gear 5 lightning & Supreme King Haki shockwave punches.'),
];

export const GOJO_POWERS: WeaponData[] = [
  makeHeroWeapon('gojo_blue', 'Cursed Technique: Blue', 'limitless_blue', 'primary', 168, 4.4, ['#0284c7', '#38bdf8', '#e0f2fe', '#38bdf8'], 'Imploding Limitless azure singularities crushing targets with negative space attraction.'),
  makeHeroWeapon('gojo_purple', 'Hollow Technique: Purple', 'hollow_purple', 'secondary', 430, 1.4, ['#581c87', '#a855f7', '#f43f5e', '#c084fc'], 'Imaginary mass erasing everything along its path by fusing Red and Blue.'),
];

export const ITADORI_POWERS: WeaponData[] = [
  makeHeroWeapon('itadori_divergent', 'Divergent Black Fist', 'divergent_fist', 'primary', 148, 4.9, ['#be123c', '#18181b', '#ef4444', '#f43f5e'], 'Double-impact Cursed Energy strikes followed closely by crackling Black Flash sparks.'),
  makeHeroWeapon('itadori_blood_pierce', 'Piercing Blood & Shrine', 'blood_pierce', 'secondary', 360, 1.8, ['#7f1d1d', '#dc2626', '#09090b', '#ef4444'], 'Supersonic Blood Manipulation jets paired with Sukuna-vessel Soul Cleaves.'),
];

export const GAROU_POWERS: WeaponData[] = [
  makeHeroWeapon('garou_water_stream', 'Water Stream Rock Fist', 'water_stream_fist', 'primary', 160, 5.2, ['#1e3a8a', '#38bdf8', '#f8fafc', '#38bdf8'], 'Deflecting martial arts barrages weaving flowing water currents around every strike.'),
  makeHeroWeapon('garou_cosmic_fist', 'Mode: Nuclear Fission', 'cosmic_fist', 'secondary', 425, 1.6, ['#09090b', '#6366f1', '#f43f5e', '#a855f7'], 'God-granted Cosmic Fear strikes mimicking planetary gamma and nuclear detonations.'),
];

export const ANOS_POWERS: WeaponData[] = [
  makeHeroWeapon('anos_jiograze', 'Jio Graze: Hellfire Sun', 'jio_graze', 'primary', 175, 4.5, ['#450a0a', '#dc2626', '#facc15', '#ef4444'], 'Jet-black miniature suns cast effortlessly by the Demon King of Tyranny.'),
  makeHeroWeapon('anos_venuzdonoa', 'Venuzdonoa Abolisher', 'venuzdonoa_blade', 'secondary', 445, 1.5, ['#09090b', '#991b1b', '#a855f7', '#f43f5e'], 'Mythic dark blade that destroys reason, immortals, and magic concepts in a slash.'),
];

export const ITACHI_POWERS: WeaponData[] = [
  makeHeroWeapon('itachi_kunai', 'Sharingan Fire Shuriken', 'uchiha_kunai', 'primary', 152, 4.8, ['#18181b', '#dc2626', '#f97316', '#ef4444'], 'Spinning Akatsuki shuriken & Phoenix Flower fireballs guided by Sharingan foresight.'),
  makeHeroWeapon('itachi_totsuka', 'Sword of Totsuka', 'totsuka_blade', 'secondary', 385, 1.6, ['#ea580c', '#fbbf24', '#fef08a', '#f97316'], 'Ethereal Susanoo spirit blade sealing targets in an eternal golden gourd.'),
];

export const SASUKE_POWERS: WeaponData[] = [
  makeHeroWeapon('sasuke_chidori', 'Chidori Sharp Spear', 'chidori_blade', 'primary', 162, 4.7, ['#1e1b4b', '#38bdf8', '#a855f7', '#67e8f9'], 'Searing azure Kusanagi lightning bolts chirping with Six Paths chakra.'),
  makeHeroWeapon('sasuke_indra', 'Indra’s Susanoo Arrow', 'indra_arrow', 'secondary', 415, 1.5, ['#312e81', '#7c3aed', '#f43f5e', '#c084fc'], 'Cataclysmic Rinnegan lightning arrow infused with Eternal Mangekyo black flames.'),
];

export function getWeaponsForOperator(operator: OperatorData): WeaponData[] {
  if (operator.id === 'saitama') return SAITAMA_POWERS;
  if (operator.id === 'son_goku') return GOKU_POWERS;
  if (operator.id === 'superman') return SUPERMAN_POWERS;
  if (operator.id === 'silvester_jais') return SILVESTER_POWERS;
  if (operator.id === 'dre_titan') return DRE_POWERS;
  if (operator.id === 'the_truth') return TRUTH_POWERS;
  if (operator.id === 'heiliea_valkyrie') return HEILIEA_POWERS;
  if (operator.id === 'the_baby') return BABY_POWERS;
  if (operator.id === 'zenitsu_agatsuma') return ZENITSU_POWERS;
  if (operator.id === 'tanjiro_kamado') return TANJIRO_POWERS;
  if (operator.id === 'muzan_kibutsuji') return MUZAN_POWERS;
  if (operator.id === 'maxwell_shodron') return MAXWELL_POWERS;
  if (operator.id === 'king_opm') return KING_POWERS;
  if (operator.id === 'the_flash') return FLASH_POWERS;
  if (operator.id === 'green_lantern') return LANTERN_POWERS;
  if (operator.id === 'shazam_champion') return SHAZAM_POWERS;
  if (operator.id === 'thor_odinson') return THOR_POWERS;
  if (operator.id === 'iron_man') return IRON_MAN_POWERS;
  if (operator.id === 'spider_man') return SPIDER_MAN_POWERS;
  if (operator.id === 'doctor_strange') return STRANGE_POWERS;
  if (operator.id === 'scarlet_witch') return WANDA_POWERS;
  if (operator.id === 'batman') return BATMAN_POWERS;
  if (operator.id === 'wonder_woman') return WONDER_WOMAN_POWERS;
  if (operator.id === 'aquaman') return AQUAMAN_POWERS;
  if (operator.id === 'rimuru_tempest') return RIMURU_POWERS;
  if (operator.id === 'sung_jinwoo') return JINWOO_POWERS;
  if (operator.id === 'naruto_uzumaki') return NARUTO_POWERS;
  if (operator.id === 'monkey_d_luffy') return LUFFY_POWERS;
  if (operator.id === 'satoru_gojo') return GOJO_POWERS;
  if (operator.id === 'yuji_itadori') return ITADORI_POWERS;
  if (operator.id === 'garou_opm') return GAROU_POWERS;
  if (operator.id === 'anos_voldigoad') return ANOS_POWERS;
  if (operator.id === 'itachi_uchiha') return ITACHI_POWERS;
  if (operator.id === 'sasuke_uchiha') return SASUKE_POWERS;
  return INITIAL_WEAPONS;
}

export const OPERATORS: OperatorData[] = [
  {
    id: 'saitama',
    name: 'Saitama',
    callsign: 'THE ONE PUNCH HERO',
    faction: 'Hero Association (Caped Baldy)',
    category: 'anime',
    quote: '"I\'m just a guy who\'s a hero for fun."',
    archetype: 'Parody / Overpowered (OP) Protagonist',
    health: 100,
    speed: 1.25,
    armorRating: 1.45,
    signatureMoves: [
      {
        name: 'Normal Punch',
        type: 'Standard Strike',
        description: 'A casual, effortless punch that vaporizes monsters, armor plates, and city blocks in a single strike.'
      },
      {
        name: 'Consecutive Normal Punches',
        type: 'High-Speed Barrage',
        description: 'A relentless barrage of one-handed normal punches moving so fast it creates an inescapable wall of destruction.'
      },
      {
        name: 'Serious Punch',
        type: 'Planetary Shockwave',
        description: 'A rare committed strike whose sheer atmospheric compression parts clouds across whole continents.'
      },
      {
        name: 'Omnidirectional Punch',
        type: 'Hyper-Velocity Afterimages',
        description: 'Moves faster than optical detection, creating a surrounding sphere of afterimages attacking from all vectors simultaneously.'
      }
    ],
    psychologicalProfile: {
      trait: 'Existential Boredom & Pragmatism',
      boredomLoop: 'Having completely broken his human biological limiter through 100 push-ups, 100 sit-ups, 100 squats, and a 10km run every single day, he suffers from loss of thrill in battle. Most concerned about missing grocery store discount sales.'
    },
    activeSkill: {
      name: 'Serious Punch Shockwave',
      description: 'Releases a devastating kinetic shockwave, clearing all hostiles within tactical radius and granting maximum speed overdrive.',
      cooldown: 25,
      duration: 6,
      icon: 'Flame'
    },
    skins: [
      { 
        id: 'skin_saitama_classic', 
        name: 'Classic Hero Suit (Default)', 
        rarity: 'Mythic', 
        primaryColor: '#facc15', 
        camoPattern: 'saitama_classic', 
        visorColor: '#eab308',
        capeColor: '#ffffff',
        gloveColor: '#dc2626'
      },
      { 
        id: 'skin_saitama_serious', 
        name: 'Serious Shaded Mode', 
        rarity: 'Legendary', 
        primaryColor: '#eab308', 
        camoPattern: 'saitama_serious', 
        visorColor: '#ef4444',
        capeColor: '#f8fafc',
        gloveColor: '#b91c1c'
      },
      { 
        id: 'skin_saitama_oppai', 
        name: '"OPPAI" Casual Hoodie', 
        rarity: 'Epic', 
        primaryColor: '#ef4444', 
        camoPattern: 'saitama_oppai', 
        visorColor: '#2563eb',
        capeColor: '#1e293b',
        gloveColor: '#fed7aa'
      },
      { 
        id: 'skin_saitama_tracksuit', 
        name: '100 Push-ups Training Tracksuit', 
        rarity: 'Rare', 
        primaryColor: '#0ea5e9', 
        camoPattern: 'saitama_tracksuit', 
        visorColor: '#38bdf8',
        capeColor: '#ffffff',
        gloveColor: '#0284c7'
      },
    ],
    selectedSkinId: 'skin_saitama_classic',
    unlocked: true,
  },
  {
    id: 'son_goku',
    name: 'Son Goku',
    callsign: 'LEGENDARY SAIYAN',
    faction: 'Universe 7 / Z-Fighters (Earth)',
    category: 'anime',
    quote: '"I am the hope of the universe! Let\'s fight with everything we\'ve got!"',
    archetype: 'Pure-hearted Saiyan & Martial Arts Obsessive',
    health: 100,
    speed: 1.22,
    armorRating: 1.35,
    signatureMoves: [
      {
        name: 'Kamehameha',
        type: 'Concentrated Ki Wave',
        description: 'Iconic Turtle School energy wave focused in cupped hands and unleashed as a blinding beam of destruction.'
      },
      {
        name: 'Spirit Bomb (Genki Dama)',
        type: 'Universal Sphere',
        description: 'Gathers ambient life energy from all living creatures across the cosmos into a massive luminous orb.'
      },
      {
        name: 'Instant Transmission (Shunkan Ido)',
        type: 'Spatial Teleportation',
        description: 'Locks onto target Ki signatures to instantaneously teleport anywhere on the battlefield in zero seconds.'
      }
    ],
    psychologicalProfile: {
      trait: 'Battle-Obsessive & Universal Protector',
      boredomLoop: 'Loves fighting stronger opponents above all else. Constantly breaks through mortal limits to reach divine states of God Ki and Autonomous Ultra Instinct.'
    },
    activeSkill: {
      name: 'God Kamehameha Burst',
      description: 'Channels concentrated God Ki wave forward while triggering instant-transmission flash step and 50% fire rate overclock.',
      cooldown: 22,
      duration: 5,
      icon: 'Zap'
    },
    skins: [
      {
        id: 'skin_goku_base',
        name: 'Form 1: Base Form (Normal)',
        rarity: 'Rare',
        primaryColor: '#ea580c',
        camoPattern: 'goku_base',
        formNumber: 1,
        isLocked: false,
        visorColor: '#ea580c',
        hairColor: '#18181b',
        eyeColor: '#18181b',
        auraColor: 'rgba(255,255,255,0.2)',
        multiplier: '1x Base Power',
        transformationLore: 'Normal black spiky hair and standard orange gi. Relies on martial arts technique and tactical reading.'
      },
      {
        id: 'skin_goku_ssj1',
        name: 'Form 2: Super Saiyan (SSJ1)',
        rarity: 'Epic',
        primaryColor: '#ea580c',
        camoPattern: 'goku_ssj1',
        formNumber: 2,
        isLocked: false,
        visorColor: '#facc15',
        hairColor: '#facc15',
        eyeColor: '#10b981',
        auraColor: '#eab308',
        multiplier: '50x Base Multiplier',
        transformationLore: 'Golden hair standing straight up with emerald green eyes and blazing yellow fiery aura.'
      },
      {
        id: 'skin_goku_ssj2',
        name: 'Form 3: Super Saiyan 2 (SSJ2)',
        rarity: 'Epic',
        primaryColor: '#ea580c',
        camoPattern: 'goku_ssj2',
        formNumber: 3,
        isLocked: false,
        visorColor: '#fde047',
        hairColor: '#fde047',
        eyeColor: '#10b981',
        auraColor: '#38bdf8',
        multiplier: '100x Base (2x SSJ)',
        transformationLore: 'Sharper rigid golden hair with constant crackling blue-white bio-electricity arcs.'
      },
      {
        id: 'skin_goku_ssj3',
        name: 'Form 4: Super Saiyan 3 (SSJ3)',
        rarity: 'Legendary',
        primaryColor: '#ea580c',
        camoPattern: 'goku_ssj3',
        formNumber: 4,
        isLocked: true,
        priceCP: 250,
        visorColor: '#facc15',
        hairColor: '#facc15',
        eyeColor: '#059669',
        auraColor: '#f59e0b',
        multiplier: '400x Base (4x SSJ2)',
        transformationLore: 'Eyebrows disappear, brow bone protrudes, and golden hair cascades down past the waist.'
      },
      {
        id: 'skin_goku_ssg',
        name: 'Form 5: Super Saiyan God (SSG)',
        rarity: 'Legendary',
        primaryColor: '#ea580c',
        camoPattern: 'goku_ssg',
        formNumber: 5,
        isLocked: true,
        priceCP: 350,
        visorColor: '#ef4444',
        hairColor: '#ef4444',
        eyeColor: '#ef4444',
        auraColor: '#dc2626',
        multiplier: 'Divine God Ki',
        transformationLore: 'Harnesses divine God Ki. Crimson red hair and eyes with a leaner youthful physique and divine flame aura.'
      },
      {
        id: 'skin_goku_ssb',
        name: 'Form 6: Super Saiyan Blue (SSB)',
        rarity: 'Legendary',
        primaryColor: '#ea580c',
        camoPattern: 'goku_ssb',
        formNumber: 6,
        isLocked: true,
        priceCP: 450,
        visorColor: '#06b6d4',
        hairColor: '#06b6d4',
        eyeColor: '#06b6d4',
        auraColor: '#0ea5e9',
        multiplier: 'God Ki + Super Saiyan',
        transformationLore: 'Shimmering cyan blue hair, eyes, and eyebrows with glowing divine blue fire and sparkling god particles.'
      },
      {
        id: 'skin_goku_ui_sign',
        name: 'Form 7: Ultra Instinct -Sign-',
        rarity: 'Mythic',
        primaryColor: '#ea580c',
        camoPattern: 'goku_ui_sign',
        formNumber: 7,
        isLocked: true,
        priceCP: 550,
        visorColor: '#94a3b8',
        hairColor: '#475569',
        eyeColor: '#94a3b8',
        auraColor: '#38bdf8',
        multiplier: 'Autonomous Reflexes',
        transformationLore: 'Silver-frosted unstyled black hair and glowing silver-grey eyes. The body moves and reacts on pure instinct.'
      },
      {
        id: 'skin_goku_mui',
        name: 'Form 8: Mastered Ultra Instinct (True UI)',
        rarity: 'Mythic',
        primaryColor: '#ea580c',
        camoPattern: 'goku_mui',
        formNumber: 8,
        isLocked: true,
        priceCP: 700,
        visorColor: '#f1f5f9',
        hairColor: '#f8fafc',
        eyeColor: '#cbd5e1',
        auraColor: '#e2e8f0',
        multiplier: 'Supreme Peak State',
        transformationLore: 'Pure glowing platinum-silver hair and piercing silver eyes. Absolute peak divine combat state surpassing Gods of Destruction.'
      }
    ],
    selectedSkinId: 'skin_goku_base',
    unlocked: true,
  },
  {
    id: 'superman',
    name: 'Superman',
    callsign: 'MAN OF STEEL',
    faction: 'House of El / Justice League',
    category: 'dc',
    quote: '"Dreams save us. Dreams lift us up and transform us into something better."',
    archetype: 'Solar-Powered Kryptonian Paragon',
    health: 120,
    speed: 1.28,
    armorRating: 1.65,
    signatureMoves: [
      {
        name: 'Thermal Overload (Laser Eyes)',
        type: 'Ultimate Plasma Sweep',
        description: 'Hovers mid-air as eyes ignite white-hot, sweeping twin thermal beams across a 180-degree arc to strip armor and melt hostiles.'
      },
      {
        name: 'Omni-Directional Flight & Sonic Dash',
        type: 'Supersonic Aerial Mobility',
        description: 'Smooth omni-directional hovering flight with supersonic forward bursts that shatter the sound barrier.'
      },
      {
        name: 'Kryptonian Might & Stagger Poise',
        type: 'Invulnerability Passive',
        description: 'Shrugs off standard gunfire with Stagger Resistance while delivering ground-cracking shockwave punches.'
      },
      {
        name: 'Arctic Super-Breath',
        type: 'Cryo AoE Cone',
        description: 'Exhales a sub-zero gale cone that blows back crowds, extinguishes embers, and freezes enemies solid.'
      }
    ],
    psychologicalProfile: {
      trait: 'Unbreakable Hope & Solar Fortitude',
      boredomLoop: 'Draws boundless cellular energy from Earth’s yellow sun. Holds back immense Kryptonian might to protect civilians while unlocking Thermal Overload only when pushed to peak threat.'
    },
    activeSkill: {
      name: 'Thermal Overload (Laser Eyes)',
      description: 'Hovers locked in mid-air and unleashes twin white-hot solar plasma beams sweeping 180 degrees with armor-stripping melt damage.',
      cooldown: 24,
      duration: 4.5,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_superman_kryptonian',
        name: 'Kryptonian Armourweave (Classic)',
        rarity: 'Mythic',
        primaryColor: '#13347a',
        camoPattern: 'superman_kryptonian',
        visorColor: '#facc15',
        capeColor: '#b91c1c',
        gloveColor: '#13347a',
        auraColor: '#f59e0b',
        multiplier: 'Yellow Sun Peak',
        transformationLore: 'Royal blue Kryptonian micro-weave suit with golden utility belt, deep red boots, raised crimson S-shield, and weighted cape.'
      },
      {
        id: 'skin_superman_kingdom',
        name: 'Kingdom Crimson Edition',
        rarity: 'Legendary',
        primaryColor: '#0f172a',
        camoPattern: 'superman_kingdom',
        visorColor: '#dc2626',
        capeColor: '#991b1b',
        gloveColor: '#0f172a',
        auraColor: '#ef4444',
        multiplier: 'Obsidian Emblem',
        transformationLore: 'Dark slate-blue veteran Kryptonian weave featuring the stark black-bordered crimson S-shield.'
      },
      {
        id: 'skin_superman_solar',
        name: 'Solar Recovery Suit',
        rarity: 'Epic',
        primaryColor: '#111827',
        camoPattern: 'superman_solar_black',
        visorColor: '#e2e8f0',
        capeColor: '#1f2937',
        gloveColor: '#111827',
        auraColor: '#fbbf24',
        multiplier: '2x Solar Recharge',
        transformationLore: 'Black Kryptonian regeneration matrix engineered to maximize yellow sunlight absorption.'
      }
    ],
    selectedSkinId: 'skin_superman_kryptonian',
    unlocked: true,
  },
  {
    id: 'silvester_jais',
    name: 'SILVESTER A.Jais',
    callsign: 'OMEGA SOVEREIGN · 15 POWERS',
    faction: 'Apex Pantheon (Supreme Tier)',
    category: 'legendary',
    quote: '"Fifteen powers. Infinite mastery. Every realm kneels before the Sovereign."',
    archetype: 'Supreme Omni-Power Sovereign',
    health: 150,
    speed: 1.48,
    armorRating: 1.75,
    signatureMoves: [
      {
        name: '15-Power Omega Arsenal',
        type: 'All-Element Mastery',
        description: 'Commands 15 distinct powers: Omni-Flight, Chronos Time-Freeze, Black Hole Singularity, Meteor Rain, Divine Overdrive 4x, Mirror Cloak, Tachyon Step, Solar Supernova, Absolute Zero Blizzard, Hellfire Judgment, Thunder Chain, Soul Drain, Reality Slash, Sovereign Roar, and Omega Apocalypse.'
      },
      {
        name: 'Chronos Time-Freeze & Black Hole Singularity',
        type: 'Space-Time Manipulation',
        description: 'Locks all enemies in frozen time across 26m, vaporizes witch spells, or collapses targets into a gravity singularity.'
      },
      {
        name: 'Omega Apocalypse (Ultimate)',
        type: 'Supreme Cosmic Detonation',
        description: 'Levitates above the battlefield and rains celestial beams + 6 Omega pillars across 32m, erasing everything in sight.'
      }
    ],
    psychologicalProfile: {
      trait: 'Absolute Composure & Supreme Versatility',
      boredomLoop: 'Unmatched Apex Sovereign possessing 15 mastered powers across time, gravity, lightning, ice, fire, and antimatter—built to outclass every hero and sorcerer alike.'
    },
    activeSkill: {
      name: '15-Power Omega Sovereign Deck',
      description: 'Switches seamlessly between 15 devastating cosmic, temporal, elemental, and physical powers.',
      cooldown: 12,
      duration: 6.0,
      icon: 'Sparkles'
    },
    skins: [
      {
        id: 'skin_silvester_prime',
        name: 'Sovereign Prime (Obsidian & Gold)',
        rarity: 'Mythic',
        primaryColor: '#09090b',
        camoPattern: 'silvester_prime',
        isLocked: false,
        visorColor: '#38bdf8',
        capeColor: '#312e81',
        gloveColor: '#eab308',
        auraColor: '#38bdf8',
        multiplier: '15 Powers · Supreme',
        transformationLore: 'Obsidian-chrome sovereign plate forged with royal gold pauldrons, cyan star-core chest reactor, and flowing cosmic indigo cape.'
      },
      {
        id: 'skin_silvester_seraph',
        name: 'Celestial Seraph (Platinum & Gold)',
        rarity: 'Mythic',
        primaryColor: '#f8fafc',
        camoPattern: 'silvester_seraph',
        isLocked: false,
        visorColor: '#fde047',
        capeColor: '#facc15',
        gloveColor: '#e2e8f0',
        auraColor: '#fde047',
        multiplier: 'Seraph Radiance',
        transformationLore: 'Radiant pearl-platinum armor crowned in divine gold light with blazing azure halo rings.'
      },
      {
        id: 'skin_silvester_eclipse',
        name: 'Abyssal Eclipse (Void Crimson)',
        rarity: 'Mythic',
        primaryColor: '#18041c',
        camoPattern: 'silvester_eclipse',
        isLocked: false,
        visorColor: '#f43f5e',
        capeColor: '#4c0519',
        gloveColor: '#be123c',
        auraColor: '#e879f9',
        multiplier: 'Dark Matter Omega',
        transformationLore: 'Obsidian-crimson dark matter armor with orbiting magenta star-shards and abyssal aura.'
      }
    ],
    selectedSkinId: 'skin_silvester_prime',
    unlocked: true,
  },
  {
    id: 'maxwell_shodron',
    name: 'Maxwell Shodron',
    callsign: 'ARCANE SOVEREIGN',
    faction: 'Order of the Astral Veil',
    category: 'legendary',
    quote: '"Reality is merely ink—and I hold the quill of the Aether."',
    archetype: 'Grand Archmage & Chronomancer',
    health: 105,
    speed: 1.2,
    armorRating: 1.35,
    signatureMoves: [
      {
        name: 'Elemental Magic Transmission',
        type: '5-Element Form Shift',
        description: 'Transmutes Maxwell’s Aether robe, halo, and spells between Arcane, Inferno Fire (+35% DMG), Tempest Lightning (+40% Speed & Fire Rate), Glacial Frost (Shield Regen & Freeze), and Eclipse Void (Lifesteal).'
      },
      {
        name: 'Arcane Nova (Cataclysm)',
        type: 'Ultimate Sigil Detonation',
        description: 'Summons concentric runic rings charged with Maxwell’s active element before unleashing a 24m shockwave that obliterates nearby foes.'
      },
      {
        name: 'Elemental Stasis Surge',
        type: 'Temporal & Elemental AoE',
        description: 'Emits an elemental surge (Chronos Freeze, Fireball Nova, Chain Thunder, Blizzard, or Void Collapse) that erases enemy projectiles.'
      },
      {
        name: 'Phase Blink & Aether Barrier',
        type: 'Warp & Arcane Ward',
        description: 'Folds 13m forward through the Astral Veil or weaves an Aether Barrier (+45 Shield) purging burn and slow effects.'
      }
    ],
    psychologicalProfile: {
      trait: 'Elemental Mastery & Sovereign Adaptability',
      boredomLoop: 'Master of Magic Transmission who rewrites his own mana matrix mid-battle—igniting into Pyromancer Fire, surging as Tempest Lightning, crystallizing into Glacial Frost, or eclipsing into Void Sovereignty.'
    },
    activeSkill: {
      name: 'Magic Transmission & Arcane Nova',
      description: 'Shifts between Fire, Lightning, Frost, Void, and Arcane forms while unleashing elemental cataclysm rings.',
      cooldown: 20,
      duration: 4.5,
      icon: 'Sparkles'
    },
    skins: [
      {
        id: 'skin_maxwell_archmage',
        name: 'Form 1: Archmage Sovereign (Arcane)',
        rarity: 'Mythic',
        primaryColor: '#5b21b6',
        camoPattern: 'maxwell_archmage',
        isLocked: false,
        visorColor: '#c084fc',
        capeColor: '#31105f',
        gloveColor: '#4c1d95',
        auraColor: '#a855f7',
        eyeColor: '#c084fc',
        multiplier: 'Arcane Form · -30% Mana Cost',
        transformationLore: 'Midnight-violet sorcerer coat with gold rune filigree, flowing astral cape, and orbiting violet-gold sigil halo.'
      },
      {
        id: 'skin_maxwell_fire',
        name: 'Form 2: Inferno Pyromancer (Fire)',
        rarity: 'Mythic',
        primaryColor: '#9a3412',
        camoPattern: 'maxwell_fire',
        isLocked: false,
        visorColor: '#fb923c',
        capeColor: '#7c2d12',
        gloveColor: '#c2410c',
        auraColor: '#f97316',
        eyeColor: '#facc15',
        multiplier: 'Fire Form · 1.35x Damage',
        transformationLore: 'Blazing solar-ember vestments and molten gold halo; grants burn immunity and scorching inferno spell blasts.'
      },
      {
        id: 'skin_maxwell_lightning',
        name: 'Form 3: Tempest Stormcaller (Lightning)',
        rarity: 'Mythic',
        primaryColor: '#1e1b4b',
        camoPattern: 'maxwell_lightning',
        isLocked: false,
        visorColor: '#facc15',
        capeColor: '#312e81',
        gloveColor: '#0284c7',
        auraColor: '#fde047',
        eyeColor: '#38bdf8',
        multiplier: 'Lightning Form · +40% Speed',
        transformationLore: 'High-voltage stormcaller coat crackled with cyan-gold arcs, accelerating movement and rapid spellcasting.'
      },
      {
        id: 'skin_maxwell_frost',
        name: 'Form 4: Glacial Cryomancer (Frost)',
        rarity: 'Legendary',
        primaryColor: '#0c4a6e',
        camoPattern: 'maxwell_frost',
        isLocked: false,
        visorColor: '#67e8f9',
        capeColor: '#082f49',
        gloveColor: '#0369a1',
        auraColor: '#38bdf8',
        eyeColor: '#a5f3fc',
        multiplier: 'Frost Form · Shield Regen & Chill',
        transformationLore: 'Sub-zero crystalline robes surrounded by orbiting frost shards that regenerate shields and freeze enemies on hit.'
      },
      {
        id: 'skin_maxwell_void',
        name: 'Form 5: Eclipse Sovereign (Void)',
        rarity: 'Mythic',
        primaryColor: '#3b0764',
        camoPattern: 'maxwell_void',
        isLocked: false,
        visorColor: '#e879f9',
        capeColor: '#1a0526',
        gloveColor: '#86198f',
        auraColor: '#d946ef',
        eyeColor: '#f43f5e',
        multiplier: 'Void Form · 1.45x + Lifesteal',
        transformationLore: 'Abyssal shadow-magenta vestments channeling dark rift energy that drains enemy life with every spell.'
      },
      {
        id: 'skin_maxwell_astral',
        name: 'Astral Starweaver',
        rarity: 'Legendary',
        primaryColor: '#0e7490',
        camoPattern: 'maxwell_astral',
        isLocked: false,
        visorColor: '#67e8f9',
        capeColor: '#083344',
        gloveColor: '#155e75',
        auraColor: '#22d3ee',
        eyeColor: '#67e8f9',
        multiplier: 'Celestial Resonance',
        transformationLore: 'Deep cyan starlight vestments woven from nebula silk, crowned with a luminous cyan-silver chronomancer halo.'
      },
      {
        id: 'skin_maxwell_bloodmoon',
        name: 'Blood-Moon Warlock',
        rarity: 'Epic',
        primaryColor: '#881337',
        camoPattern: 'maxwell_blood_moon',
        isLocked: false,
        visorColor: '#fb7185',
        capeColor: '#4c0519',
        gloveColor: '#881337',
        auraColor: '#f43f5e',
        eyeColor: '#fb7185',
        multiplier: 'Crimson Eclipse',
        transformationLore: 'Obsidian-crimson warlock regalia empowered by eclipse runes and scarlet spellfire.'
      }
    ],
    selectedSkinId: 'skin_maxwell_archmage',
    unlocked: true,
  },
  {
    id: 'king_opm',
    name: 'King',
    callsign: 'S-CLASS RANK 7 · KING ENGINE',
    faction: 'Hero Association (S-Class)',
    category: 'anime',
    quote: '"You dare challenge the strongest man on Earth?"',
    archetype: 'Intimidation Juggernaut & King Engine',
    health: 110,
    speed: 1.05,
    armorRating: 1.25,
    signatureMoves: [
      {
        name: 'The King Engine',
        type: 'Sonic Terror Pulse',
        description: 'A deafening heartbeat aura that paralyzes hostiles within 18m and erases incoming projectiles out of sheer dread.'
      },
      {
        name: 'Ultimate Hellfire Burst Wave-Motion Cannon',
        type: 'Cataclysmic Energy Wave',
        description: 'Releases an apocalyptic golden-crimson wave-motion discharge across a 30m line.'
      },
      {
        name: 'Phantom Hero Assist',
        type: 'Surprise Counterstrike',
        description: 'Triggers a blinding kinetic shockwave punch ahead of King while he casually sidesteps.'
      }
    ],
    psychologicalProfile: {
      trait: 'Overwhelming Poker Face & Legendary Bluff',
      boredomLoop: 'Recognized globally as the strongest man alive, King’s racing heartbeat resonates so powerfully that monsters and sorcerers surrender or freeze on the spot.'
    },
    activeSkill: {
      name: 'Ultimate Hellfire Wave-Motion Cannon',
      description: 'Triggers King Engine paralysis followed by a catastrophic golden-crimson wave-motion blast.',
      cooldown: 20,
      duration: 4.5,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_king_classic',
        name: 'S-Class Black Turtleneck',
        rarity: 'Mythic',
        primaryColor: '#18181b',
        camoPattern: 'king_classic',
        isLocked: false,
        visorColor: '#fbbf24',
        auraColor: '#f59e0b',
        multiplier: 'King Engine Aura',
        transformationLore: 'Iconic triple-scarred stare, spiked golden hair, and black turtleneck radiating golden dread waves.'
      },
      {
        id: 'skin_king_gold',
        name: 'Overdrive Hellfire King',
        rarity: 'Legendary',
        primaryColor: '#7f1d1d',
        camoPattern: 'king_gold',
        isLocked: false,
        visorColor: '#fde047',
        auraColor: '#ef4444',
        multiplier: 'Maximum Intimidation',
        transformationLore: 'Crimson-gold aura variant surging with Hellfire Wave-Motion pressure.'
      }
    ],
    selectedSkinId: 'skin_king_classic',
    unlocked: true,
  },
  {
    id: 'the_flash',
    name: 'The Flash',
    callsign: 'SCARLET SPEEDSTER',
    faction: 'Justice League',
    category: 'dc',
    quote: '"My name is Barry Allen—and I am the fastest man alive."',
    archetype: 'Speed Force Hyper-Rusher',
    health: 100,
    speed: 1.52,
    armorRating: 1.15,
    signatureMoves: [
      {
        name: 'Speed Force Phasing',
        type: 'Hyper-Velocity Dash',
        description: 'Streaks 22m instantaneously leaving golden Speed Force lightning orbs and boosting speed.'
      },
      {
        name: 'Cyclone Vortex',
        type: 'Mach 10 Whirlwind AoE',
        description: 'Spins faster than sound to shred incoming spells and stun surrounding opponents with lightning.'
      },
      {
        name: 'Infinite Mass Nova',
        type: 'Relativistic Ultimate',
        description: 'Delivers an ultra-high-velocity lightning detonation shockwave across 22m.'
      }
    ],
    psychologicalProfile: {
      trait: 'Relativistic Reflexes & Unstoppable Momentum',
      boredomLoop: 'Taps directly into the extra-dimensional Speed Force, outrunning gunfire, time stasis, and witch projectiles across the battlefield.'
    },
    activeSkill: {
      name: 'Infinite Mass Nova',
      description: 'Surges through the Speed Force to detonate a blinding lightning shockwave.',
      cooldown: 16,
      duration: 4.0,
      icon: 'Zap'
    },
    skins: [
      {
        id: 'skin_flash_scarlet',
        name: 'Scarlet Speedster Armor',
        rarity: 'Mythic',
        primaryColor: '#dc2626',
        camoPattern: 'flash_scarlet',
        isLocked: false,
        visorColor: '#facc15',
        gloveColor: '#b91c1c',
        auraColor: '#fbbf24',
        multiplier: '1.52x Speed Force',
        transformationLore: 'Friction-proof crimson armor with golden winged ear-bolts and glowing Speed Force chest emblem.'
      },
      {
        id: 'skin_flash_godspeed',
        name: 'White-Gold Godspeed',
        rarity: 'Legendary',
        primaryColor: '#e2e8f0',
        camoPattern: 'flash_godspeed',
        isLocked: false,
        visorColor: '#fde047',
        gloveColor: '#eab308',
        auraColor: '#fef08a',
        multiplier: 'White Lightning Surge',
        transformationLore: 'Pearl-white ceramic Speed Force plates accented with radiant metallic gold lightning.'
      },
      {
        id: 'skin_flash_black',
        name: 'Black Flash Eclipse',
        rarity: 'Mythic',
        primaryColor: '#09090b',
        camoPattern: 'flash_black',
        isLocked: false,
        visorColor: '#ef4444',
        gloveColor: '#991b1b',
        auraColor: '#ef4444',
        multiplier: 'Crimson Rift Speed',
        transformationLore: 'Obsidian suit crackling with red Speed Force plasma.'
      }
    ],
    selectedSkinId: 'skin_flash_scarlet',
    unlocked: true,
  },
  {
    id: 'green_lantern',
    name: 'Green Lantern',
    callsign: 'EMERALD WILLPOWER',
    faction: 'Green Lantern Corps (Sector 2814)',
    category: 'dc',
    quote: '"In brightest day, in blackest night—no evil shall escape my sight."',
    archetype: 'Hard-Light Construct Flier',
    health: 110,
    speed: 1.25,
    armorRating: 1.4,
    signatureMoves: [
      {
        name: 'Hard-Light Construct Meteor',
        type: 'Orbital Construct Slam',
        description: 'Manifests a massive emerald anvil construct from thin air, smashing enemies and cratering the ground.'
      },
      {
        name: 'Oan Planetary Beam',
        type: 'Ultimate Emerald Cannon',
        description: 'Fires a sweeping 30m beam of pure condensed green willpower.'
      },
      {
        name: 'Emerald Ward Dome & Ring Flight',
        type: 'Willpower Barrier + Flight',
        description: 'Raises a +55 shield willpower sphere or takes omni-directional emerald flight.'
      }
    ],
    psychologicalProfile: {
      trait: 'Unbreakable Willpower & Creative Manifestation',
      boredomLoop: 'Chosen by the Power Ring of Oa, Hal converts pure courage into solid emerald constructs, warhammers, and orbital shields.'
    },
    activeSkill: {
      name: 'Oan Planetary Beam',
      description: 'Channels full Power Ring willpower into an unstoppable emerald laser surge.',
      cooldown: 18,
      duration: 4.0,
      icon: 'Sparkles'
    },
    skins: [
      {
        id: 'skin_lantern_emerald',
        name: 'Sector 2814 Emerald Corps',
        rarity: 'Mythic',
        primaryColor: '#15803d',
        camoPattern: 'lantern_emerald',
        isLocked: false,
        visorColor: '#4ade80',
        gloveColor: '#ffffff',
        auraColor: '#22c55e',
        multiplier: '100% Willpower',
        transformationLore: 'Classic emerald & obsidian Corps uniform with white gauntlets and glowing Oan chest battery.'
      },
      {
        id: 'skin_lantern_parallax',
        name: 'Gold Parallax Entity',
        rarity: 'Legendary',
        primaryColor: '#a16207',
        camoPattern: 'lantern_parallax',
        isLocked: false,
        visorColor: '#fde047',
        gloveColor: '#facc15',
        auraColor: '#fbbf24',
        multiplier: 'Parallax Armor',
        transformationLore: 'Regal emerald-gold armor plate infused with cosmic entity energy.'
      },
      {
        id: 'skin_lantern_white',
        name: 'White Lantern of Life',
        rarity: 'Mythic',
        primaryColor: '#f8fafc',
        camoPattern: 'lantern_white',
        isLocked: false,
        visorColor: '#86efac',
        gloveColor: '#e2e8f0',
        auraColor: '#ffffff',
        multiplier: 'Life Entity Radiance',
        transformationLore: 'Luminous pure-white Life Ring uniform uniting the emotional spectrum.'
      }
    ],
    selectedSkinId: 'skin_lantern_emerald',
    unlocked: true,
  },
  {
    id: 'shazam_champion',
    name: 'Shazam',
    callsign: 'CHAMPION OF MAGIC',
    faction: 'Rock of Eternity',
    category: 'dc',
    quote: '"Say my name and let the lightning of Zeus shake the heavens!"',
    archetype: 'Mystic Thunder Paragon & Flier',
    health: 120,
    speed: 1.32,
    armorRating: 1.45,
    signatureMoves: [
      {
        name: 'SHAZAM! Sky Thunderbolt',
        type: 'Vertical Lightning Strike',
        description: 'Calls down a towering golden sky-lightning pillar onto enemies ahead, dealing 320 AoE damage.'
      },
      {
        name: 'Strength of Hercules & Speed of Mercury',
        type: 'Flight & Sonic Dash',
        description: 'Soars effortlessly in a flowing white-gold cape and delivers heavy sonic strikes.'
      },
      {
        name: 'Wrath of the Six Elders',
        type: 'Ultimate Storm Barrage',
        description: 'Summons 5 cascading sky bolts around Shazam while restoring +25 magic shield.'
      }
    ],
    psychologicalProfile: {
      trait: 'Wisdom of Solomon · Power of Zeus',
      boredomLoop: 'Bestowed the powers of six ancient elders, channeling magical lightning bolts from the clouds while protecting allies with heroic optimism.'
    },
    activeSkill: {
      name: 'SHAZAM! Thunderbolt Storm',
      description: 'Calls down devastating golden lightning directly from the sky.',
      cooldown: 18,
      duration: 4.0,
      icon: 'Zap'
    },
    skins: [
      {
        id: 'skin_shazam_classic',
        name: 'Royal Crimson & White Cape',
        rarity: 'Mythic',
        primaryColor: '#dc2626',
        camoPattern: 'shazam_classic',
        isLocked: false,
        visorColor: '#fde047',
        capeColor: '#f8fafc',
        gloveColor: '#eab308',
        auraColor: '#facc15',
        multiplier: 'Power of Zeus',
        transformationLore: 'Crimson champion suit with glowing golden chest bolt, golden gauntlets, and white-gold hooded cape.'
      },
      {
        id: 'skin_shazam_black',
        name: 'Obsidian Lightning Sovereign',
        rarity: 'Legendary',
        primaryColor: '#18181b',
        camoPattern: 'shazam_black',
        isLocked: false,
        visorColor: '#facc15',
        capeColor: '#27272a',
        gloveColor: '#eab308',
        auraColor: '#fbbf24',
        multiplier: 'Kahndaq Might',
        transformationLore: 'Obsidian battle regalia etched with burning gold lightning.'
      }
    ],
    selectedSkinId: 'skin_shazam_classic',
    unlocked: true,
  },
  {
    id: 'thor_odinson',
    name: 'Thor',
    callsign: 'GOD OF THUNDER',
    faction: 'Asgardian Vanguard',
    category: 'marvel',
    quote: '"Whosoever holds this hammer, if he be worthy, shall possess the power of Thor!"',
    archetype: 'Asgardian Storm Flier & Hammer Striker',
    health: 125,
    speed: 1.24,
    armorRating: 1.5,
    signatureMoves: [
      {
        name: 'Mjolnir Spin Toss',
        type: 'Uru Boomerang Impact',
        description: 'Hurls Mjolnir forward in a crackling cyan lightning arc, blasting enemies back 24m.'
      },
      {
        name: 'God of Thunder Slam',
        type: 'Sky Lightning Shockwave',
        description: 'Smashes Mjolnir into the earth to detonate an 18m storm ring and paralyze foes.'
      },
      {
        name: 'Bifrost Awakening',
        type: 'Ultimate Celestial Pillar',
        description: 'Calls down the rainbow Bifrost beam from Asgard, dealing 480 damage and healing +25 HP/Armor.'
      }
    ],
    psychologicalProfile: {
      trait: 'Royal Asgardian Valor & Odinforce',
      boredomLoop: 'Crown prince of Asgard wielding enchanted Uru hammer Mjolnir to command hurricanes, soar across battlefields, and summon the Bifrost.'
    },
    activeSkill: {
      name: 'Bifrost Awakening',
      description: 'Summons a massive celestial Bifrost lightning pillar from Asgard.',
      cooldown: 20,
      duration: 4.5,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_thor_odinson',
        name: 'Asgardian Classic + Winged Helm',
        rarity: 'Mythic',
        primaryColor: '#1e293b',
        camoPattern: 'thor_asgard',
        isLocked: false,
        visorColor: '#38bdf8',
        capeColor: '#b91c1c',
        gloveColor: '#475569',
        auraColor: '#38bdf8',
        multiplier: 'Mjolnir Worthy',
        transformationLore: 'Gunmetal Asgardian mail with six silver discs, flowing crimson cape, silver winged helm, and forged Mjolnir.'
      },
      {
        id: 'skin_thor_ragnarok',
        name: 'Stormbreaker Infinity Armor',
        rarity: 'Legendary',
        primaryColor: '#0f172a',
        camoPattern: 'thor_stormbreaker',
        isLocked: false,
        visorColor: '#7dd3fc',
        capeColor: '#991b1b',
        gloveColor: '#1e293b',
        auraColor: '#67e8f9',
        multiplier: 'Awakened Thunder',
        transformationLore: 'Blackened infinity warplate crackling with bright cyan-white Odinforce eyes.'
      },
      {
        id: 'skin_thor_rune_king',
        name: 'Rune King All-Father',
        rarity: 'Mythic',
        primaryColor: '#78350f',
        camoPattern: 'thor_rune',
        isLocked: false,
        visorColor: '#fde047',
        capeColor: '#7f1d1d',
        gloveColor: '#eab308',
        auraColor: '#facc15',
        multiplier: 'All-Father Odinforce',
        transformationLore: 'Golden Asgardian regal mail imbued with supreme cosmic rune power.'
      }
    ],
    selectedSkinId: 'skin_thor_odinson',
    unlocked: true,
  },
  {
    id: 'dre_titan',
    name: 'Dre',
    callsign: 'SONIC STRIKER',
    faction: 'Street Vanguard Division',
    category: 'normal',
    quote: '"Turn the sub up—when the bass drops, the whole arena shakes!"',
    archetype: 'Sonic Bass Juggernaut & Equalizer Striker',
    health: 120,
    speed: 1.24,
    armorRating: 1.45,
    signatureMoves: [
      {
        name: '360° Bass Drop',
        type: 'Seismic Shockwave',
        description: 'Slams a colossal studio sub-wave around Dre, knocking hostiles backward and stunning them for 3 seconds.'
      },
      {
        name: 'Sub-Step Dash',
        type: 'Acoustic Warp',
        description: 'Rides a compressed soundwave forward 18m with blazing orange-gold afterimages.'
      },
      {
        name: 'Amplify',
        type: 'Armor & Damage Buff',
        description: 'Boosts studio frequency output to grant +50 Armor and Quad Damage overdrive.'
      },
      {
        name: 'Omega Mixtape Finale',
        type: 'Ultimate Sonic Cataclysm',
        description: 'Detonates twin golden soundwave pillars across 26m, dealing 520 damage and obliterating spells.'
      }
    ],
    psychologicalProfile: {
      trait: 'Rhythmic Precision & Unshakeable Groove',
      boredomLoop: 'Master sound architect who weaponizes 808 sub-frequencies into kinetic shockwaves that shatter enemy armor on the beat.'
    },
    activeSkill: {
      name: 'Omega Mixtape Finale',
      description: 'Drops a battlefield-wide 808 seismic bass explosion dealing 520 AoE damage.',
      cooldown: 16,
      duration: 5,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_dre_studio',
        name: '808 Studio Sovereign',
        rarity: 'Mythic',
        primaryColor: '#18181b',
        camoPattern: 'dre_studio',
        isLocked: false,
        visorColor: '#f97316',
        capeColor: '#ea580c',
        gloveColor: '#fbbf24',
        auraColor: '#f97316',
        multiplier: '808 Resonance',
        transformationLore: 'Matte-black bomber armor, gold medallion crest, glowing headphones, and orbiting orange EQ rings.'
      },
      {
        id: 'skin_dre_platinum',
        name: 'Platinum Gold Edition',
        rarity: 'Legendary',
        primaryColor: '#f59e0b',
        camoPattern: 'dre_platinum',
        isLocked: false,
        visorColor: '#fef08a',
        capeColor: '#fbbf24',
        gloveColor: '#ffffff',
        auraColor: '#fde047',
        multiplier: 'Multi-Platinum Amp',
        transformationLore: 'Championship gold-trimmed sonic armor radiating dazzling concert acoustics.'
      }
    ],
    selectedSkinId: 'skin_dre_studio',
    unlocked: true,
  },
  {
    id: 'the_truth',
    name: 'The Truth',
    callsign: 'ALL-SEEING SEER',
    faction: 'Veritas Conclave',
    category: 'legendary',
    quote: '"No illusion survives the light. Nothing stays hidden from The Truth."',
    archetype: 'Mystic Truth Illuminator & Reality Striker',
    health: 115,
    speed: 1.28,
    armorRating: 1.4,
    signatureMoves: [
      {
        name: 'Judgment Seal',
        type: 'Golden Stasis Lock',
        description: 'Locks all nearby hostiles in frozen truth geometry for 4.5 seconds and erases incoming magic.'
      },
      {
        name: 'Veil Shift',
        type: 'Dimensional Blink',
        description: 'Steps instantaneously 20m through the veil of reality.'
      },
      {
        name: 'True Sight',
        type: 'Armor Strip & Reveal',
        description: 'Strips hostile armor within 20m and refills +35 Veritas Energy.'
      },
      {
        name: 'Absolute Truth',
        type: 'Ultimate Golden Pillar',
        description: 'Summons an All-Seeing celestial sky beam dealing 560 critical damage.'
      }
    ],
    psychologicalProfile: {
      trait: 'Omniscient Calm & Absolute Clarity',
      boredomLoop: 'Keeper of the Golden Pyramid who sees every witch enchantment before it is cast and dissolves lies with pure radiant light.'
    },
    activeSkill: {
      name: 'Absolute Truth',
      description: 'Calls down a blinding golden pillar of revealed reality across the arena.',
      cooldown: 16,
      duration: 4.5,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_truth_oracle',
        name: 'White-Gold Veritas Cloak',
        rarity: 'Mythic',
        primaryColor: '#f8fafc',
        camoPattern: 'truth_oracle',
        isLocked: false,
        visorColor: '#fbbf24',
        capeColor: '#fef08a',
        gloveColor: '#eab308',
        auraColor: '#fbbf24',
        multiplier: 'All-Seeing Focus',
        transformationLore: 'Ivory mystic longcoat etched with gold trim, All-Seeing Pyramid halo, and luminous golden eyes.'
      },
      {
        id: 'skin_truth_eclipse',
        name: 'Obsidian Oracle',
        rarity: 'Legendary',
        primaryColor: '#0f172a',
        camoPattern: 'truth_eclipse',
        isLocked: false,
        visorColor: '#38bdf8',
        capeColor: '#fbbf24',
        gloveColor: '#38bdf8',
        auraColor: '#38bdf8',
        multiplier: 'Astral Clarity',
        transformationLore: 'Midnight scholar vestments illuminated by cyan-gold truth prisms.'
      }
    ],
    selectedSkinId: 'skin_truth_oracle',
    unlocked: true,
  },
  {
    id: 'heiliea_valkyrie',
    name: 'Heiliea',
    callsign: 'STARLIGHT VALKYRIE',
    faction: 'Celestial Valkyrie Order',
    category: 'legendary',
    quote: '"Rise on wings of starlight—none shall fall while Heiliea watches the sky!"',
    archetype: 'Aerial Valkyrie & Starlight Medic-Warrior',
    health: 120,
    speed: 1.32,
    armorRating: 1.42,
    signatureMoves: [
      {
        name: 'Valkyrie Wing Flight',
        type: 'Omni-Directional Soar',
        description: 'Spreads luminous pearl-pink Valkyrie wings for swift aerial dominance.'
      },
      {
        name: 'Seraph Heal',
        type: 'Celestial Restoration',
        description: 'Restores +60 HP and +45 Armor while purging burns, chills, and hostile spells.'
      },
      {
        name: 'Starfall Barrage',
        type: 'Sky Meteor Volley',
        description: 'Calls down five blazing rose-gold starlight meteors onto targets ahead.'
      },
      {
        name: 'Celestial Nova',
        type: 'Ultimate Sanctuary Burst',
        description: 'Unleashes a radiant 26m supernova dealing 500 damage and healing Heiliea to full.'
      }
    ],
    psychologicalProfile: {
      trait: 'Radiant Compassion & Fierce Aerial Grace',
      boredomLoop: 'Unmatched guardian of the Celestial Order who weaves restorative starlight directly into devastating Valkyrie lance strikes.'
    },
    activeSkill: {
      name: 'Celestial Nova',
      description: 'Detonates a radiant starlight burst that heals Heiliea and wipes surrounding hostiles.',
      cooldown: 16,
      duration: 5,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_heiliea_valkyrie',
        name: 'Pearl Rose-Gold Valkyrie',
        rarity: 'Mythic',
        primaryColor: '#fce7f3',
        camoPattern: 'heiliea_valkyrie',
        isLocked: false,
        visorColor: '#f472b6',
        capeColor: '#fbcfe8',
        gloveColor: '#fbbf24',
        auraColor: '#f472b6',
        multiplier: 'Starlight Grace',
        transformationLore: 'Pearl-white Valkyrie armor, rose-gold crescent crown, radiant twin wings, and astral star crystals.'
      },
      {
        id: 'skin_heiliea_rose',
        name: 'Crimson Seraph',
        rarity: 'Legendary',
        primaryColor: '#be185d',
        camoPattern: 'heiliea_rose',
        isLocked: false,
        visorColor: '#fde047',
        capeColor: '#9d174d',
        gloveColor: '#f472b6',
        auraColor: '#fde047',
        multiplier: 'Seraphic Flame',
        transformationLore: 'Deep magenta celestial warplate crowned with blazing golden wing tips.'
      }
    ],
    selectedSkinId: 'skin_heiliea_valkyrie',
    unlocked: true,
  },
  {
    id: 'the_baby',
    name: 'The Baby',
    callsign: 'TINY COSMIC TITAN',
    faction: 'Nursery Chaos Division',
    category: 'legendary',
    quote: '"Goo-goo ga-ga! ...Wait, why is the whole map shaking?!"',
    archetype: 'Hyper-Speed Tiny Juggernaut',
    health: 115,
    speed: 1.4,
    armorRating: 1.38,
    signatureMoves: [
      {
        name: 'Tantrum Stomp',
        type: 'Earth-Splitting Slam',
        description: 'Slams the cosmic rattle into the ground, cracking arena terrain and stunning foes in 18m.'
      },
      {
        name: 'Crawl Zoom',
        type: 'Hyper-Tiny Dash',
        description: 'Launches forward at hilarious supersonic speed trailing glowing sky-blue stars.'
      },
      {
        name: 'Nap Time Shield',
        type: 'Cozy +55 Armor & Heal',
        description: 'Wraps The Baby in a starry bubble granting +55 Armor and +30 HP.'
      },
      {
        name: 'Mega Crying Wave',
        type: 'Ultimate Acoustic Wipe',
        description: 'Unleashes an unstoppable acoustic tantrum shockwave across 28m dealing 580 damage!'
      }
    ],
    psychologicalProfile: {
      trait: 'Unfiltered Toddler Energy & Cosmic Power',
      boredomLoop: 'Compact, adorable, and dangerously overpowered—underestimating his pacifier emblem is the fastest way to get launched across City Z.'
    },
    activeSkill: {
      name: 'Mega Crying Wave',
      description: 'Releases an arena-shaking acoustic shockwave obliterating spells and hostile waves.',
      cooldown: 15,
      duration: 4.5,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_baby_boss',
        name: 'Cosmic Onesie Boss',
        rarity: 'Mythic',
        primaryColor: '#38bdf8',
        camoPattern: 'baby_boss',
        isLocked: false,
        visorColor: '#fde047',
        capeColor: '#ef4444',
        gloveColor: '#ffffff',
        auraColor: '#38bdf8',
        multiplier: 'Pacifier Power',
        transformationLore: 'Sky-blue star onesie, heroic crimson cape, golden pacifier chest badge, and orbiting toy stars.'
      },
      {
        id: 'skin_baby_cosmic',
        name: 'Golden Diaper Sovereign',
        rarity: 'Legendary',
        primaryColor: '#fbbf24',
        camoPattern: 'baby_cosmic',
        isLocked: false,
        visorColor: '#38bdf8',
        capeColor: '#7c3aed',
        gloveColor: '#fde047',
        auraColor: '#fde047',
        multiplier: 'Naptime Overdrive',
        transformationLore: 'Sparkling golden onesie with royal violet cape and supersonic rattle.'
      }
    ],
    selectedSkinId: 'skin_baby_boss',
    unlocked: true,
  },
  {
    id: 'zenitsu_agatsuma',
    name: 'Zenitsu Agatsuma',
    callsign: 'THUNDER BREATHING',
    faction: 'Demon Slayer Corps',
    category: 'anime',
    quote: '"Master taught me only the First Form... so I perfected it to godlike speed!"',
    archetype: 'Thunder Breathing Speedster',
    health: 105,
    speed: 1.44,
    armorRating: 1.22,
    signatureMoves: [
      {
        name: 'First Form: Thunderclap & Flash',
        type: 'Lightning Iaijutsu Dash',
        description: 'Dashes forward 22m in a blinding yellow lightning streak, cleaving every hostile in path for 340 DMG.'
      },
      {
        name: 'Thunderclap & Flash: Sixfold',
        type: '6-Angle Spark Volley',
        description: 'Chains six crackling lightning slashes in rapid sequence, wiping enemy projectiles and stunning foes.'
      },
      {
        name: 'Seventh Form: Flaming Thunder God',
        type: 'Ultimate Dragon Strike',
        description: 'Unleashes a roaring golden thunder dragon pillar across 26m dealing 620 damage!'
      }
    ],
    psychologicalProfile: {
      trait: 'Sleeping Trance & Godspeed Resolve',
      boredomLoop: 'Awakens pure Thunder Breathing instincts in combat—striking in a single golden flash before foes hear the thunder.'
    },
    activeSkill: {
      name: 'Seventh Form: Flaming Thunder God',
      description: 'Summons the golden lightning dragon pillar dealing 620 devastating AoE damage.',
      cooldown: 16,
      duration: 4.5,
      icon: 'Zap'
    },
    skins: [
      {
        id: 'skin_zenitsu_classic',
        name: 'Yellow Triangle Haori',
        rarity: 'Mythic',
        primaryColor: '#eab308',
        camoPattern: 'zenitsu_classic',
        isLocked: false,
        visorColor: '#fde047',
        capeColor: '#f59e0b',
        gloveColor: '#18181b',
        auraColor: '#facc15',
        multiplier: 'Thunder Breathing 1st Form',
        transformationLore: 'Demon Slayer Corps black uniform under an amber-yellow haori with electric golden Nichirin katana.'
      },
      {
        id: 'skin_zenitsu_godspeed',
        name: 'Sleeping Trance (Godspeed)',
        rarity: 'Legendary',
        primaryColor: '#ca8a04',
        camoPattern: 'zenitsu_godspeed',
        isLocked: false,
        visorColor: '#38bdf8',
        capeColor: '#fde047',
        gloveColor: '#facc15',
        auraColor: '#38bdf8',
        multiplier: 'Godspeed Flash',
        transformationLore: 'Awakened unconscious stance overflowing with blinding yellow-cyan thunder arcs.'
      }
    ],
    selectedSkinId: 'skin_zenitsu_classic',
    unlocked: true,
  },
  {
    id: 'tanjiro_kamado',
    name: 'Tanjiro Kamado',
    callsign: 'SUN & WATER BREATHING',
    faction: 'Demon Slayer Corps',
    category: 'anime',
    quote: '"I will never give up! Hinokami Kagura—blaze brighter than the sun!"',
    archetype: 'Dual-Style Breathing Swordsman',
    health: 115,
    speed: 1.28,
    armorRating: 1.35,
    signatureMoves: [
      {
        name: 'Water Tenth Form: Constant Flux',
        type: 'Swirling Hydro Vortex',
        description: 'Spins a roaring cyan water dragon vortex (280 DMG), extinguishing fire spells and granting +25 Armor.'
      },
      {
        name: 'Hinokami Kagura: Dance',
        type: 'Solar Flame Cleave',
        description: 'Surges forward 16m leaving blazing scarlet sun-fire rings dealing 330 DMG.'
      },
      {
        name: 'Sun Halo Dragon Head Dance',
        type: 'Ultimate Sun Breathing',
        description: 'Sweeps a scorching crimson-gold dragon inferno across 25m dealing 600 DMG and restoring +35 HP.'
      }
    ],
    psychologicalProfile: {
      trait: 'Unbreakable Empathy & Demon Slayer Mark',
      boredomLoop: 'Combines the fluid defense of Water Breathing with the overwhelming offensive blaze of ancestral Sun Breathing.'
    },
    activeSkill: {
      name: 'Sun Halo Dragon Head Dance',
      description: 'Ignites Hinokami Kagura into a blazing Sun Dragon cataclysm.',
      cooldown: 16,
      duration: 5.0,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_tanjiro_classic',
        name: 'Checkered Haori (Water Style)',
        rarity: 'Mythic',
        primaryColor: '#10b981',
        camoPattern: 'tanjiro_classic',
        isLocked: false,
        visorColor: '#38bdf8',
        capeColor: '#059669',
        gloveColor: '#18181b',
        auraColor: '#38bdf8',
        multiplier: 'Water & Sun Focus',
        transformationLore: 'Green-and-black checkered haori over Corps uniform with burgundy hair and black Nichirin blade.'
      },
      {
        id: 'skin_tanjiro_hinokami',
        name: 'Hinokami Mark Awakened',
        rarity: 'Mythic',
        primaryColor: '#dc2626',
        camoPattern: 'tanjiro_hinokami',
        isLocked: false,
        visorColor: '#f97316',
        capeColor: '#991b1b',
        gloveColor: '#facc15',
        auraColor: '#ef4444',
        multiplier: 'Demon Slayer Mark',
        transformationLore: 'Scarlet blazing Mark awakened on forehead with glowing crimson Hinokami Sun aura.'
      }
    ],
    selectedSkinId: 'skin_tanjiro_classic',
    unlocked: true,
  },
  {
    id: 'muzan_kibutsuji',
    name: 'Muzan Kibutsuji',
    callsign: 'DEMON KING',
    faction: 'Twelve Kizuki (Demon Progenitor)',
    category: 'anime',
    quote: '"I am the closest thing to a true perfection. Bow before the Demon King."',
    archetype: 'Biokinesis Whip Sovereign & Regenerator',
    health: 135,
    speed: 1.26,
    armorRating: 1.48,
    signatureMoves: [
      {
        name: 'Biokinesis Spine Whips',
        type: 'Crimson Razor Flurry',
        description: 'Lashes out with razor blood-whips across 16m, dealing 310 DMG and draining +30 HP.'
      },
      {
        name: 'Crimson Mist Step',
        type: 'Demon Shift & Armor',
        description: 'Dissolves into blood mist 18m forward while hardening demonic flesh (+35 Armor).'
      },
      {
        name: 'Black Blood Shockwave Apocalypse',
        type: 'Ultimate Demon King Wave',
        description: 'Releases an arena-wide crimson-violet shockwave dealing 640 DMG, stunning hostiles, and healing +45 HP.'
      }
    ],
    psychologicalProfile: {
      trait: 'Immortal Overlord & Cellular Mastery',
      boredomLoop: 'First progenitor of all demons; weaponizes shifting spine whips and relentless cellular regeneration across any battlefield.'
    },
    activeSkill: {
      name: 'Black Blood Shockwave Apocalypse',
      description: 'Emits a crushing Demon King shockwave that drains health and paralyzes surrounding foes.',
      cooldown: 16,
      duration: 5.0,
      icon: 'Flame'
    },
    skins: [
      {
        id: 'skin_muzan_suit',
        name: 'Obsidian Tuxedo & Fedora',
        rarity: 'Mythic',
        primaryColor: '#18181b',
        camoPattern: 'muzan_suit',
        isLocked: false,
        visorColor: '#ef4444',
        capeColor: '#450a0a',
        gloveColor: '#09090b',
        auraColor: '#dc2626',
        multiplier: 'Demon King Presence',
        transformationLore: 'Tailored black suit, crisp white fedora, glowing ruby demon eyes, and barbed crimson flesh whips.'
      },
      {
        id: 'skin_muzan_final',
        name: 'White-Haired Final Combat Form',
        rarity: 'Mythic',
        primaryColor: '#450a0a',
        camoPattern: 'muzan_final',
        isLocked: false,
        visorColor: '#f43f5e',
        capeColor: '#18181b',
        gloveColor: '#7f1d1d',
        auraColor: '#f43f5e',
        multiplier: '900-Year Regeneration',
        transformationLore: 'Silver-white battle hair, scarred torso eruptions, and nine thrashing spine-whip tendrils.'
      }
    ],
    selectedSkinId: 'skin_muzan_suit',
    unlocked: true,
  },
  {
    id: 'spectre_neon',
    name: 'Spectre',
    callsign: 'NEON PHANTOM',
    faction: 'Cyber Security Syndicate',
    category: 'normal',
    quote: '"Target acquired. Target eliminated. Zero traces left."',
    health: 95,
    speed: 1.15,
    armorRating: 0.95,
    activeSkill: {
      name: 'Tactical Cloak & Dash',
      description: 'Increases sprint speed by 45% and renders operator semi-invisible on enemy radar for 6 seconds.',
      cooldown: 28,
      duration: 6,
      icon: 'Zap'
    },
    skins: [
      { id: 'skin_cyber_neon', name: 'Cyber Neon Zero', rarity: 'Epic', primaryColor: '#ec4899', camoPattern: 'cyber_neon', visorColor: '#06b6d4' },
      { id: 'skin_glitch_shadow', name: 'Carbon Glitch', rarity: 'Legendary', primaryColor: '#0f172a', camoPattern: 'urban_shadow', visorColor: '#ec4899' },
    ],
    selectedSkinId: 'skin_cyber_neon',
    unlocked: true,
  },
  {
    id: 'vanguard_recon',
    name: 'Vanguard',
    callsign: 'ARCTIC PREDATOR',
    faction: 'Polar Defense Force',
    category: 'normal',
    quote: '"Cold precision never misses."',
    health: 110,
    speed: 0.95,
    armorRating: 1.25,
    activeSkill: {
      name: 'Sonar Radar Ping',
      description: 'Pings all hostile enemies on the minimap through walls within a 45m radius for 7 seconds.',
      cooldown: 30,
      duration: 7,
      icon: 'Radio'
    },
    skins: [
      { id: 'skin_arctic_spec', name: 'Snowstorm Ghillie', rarity: 'Rare', primaryColor: '#e2e8f0', camoPattern: 'tactical_navy', visorColor: '#0ea5e9' },
    ],
    selectedSkinId: 'skin_arctic_spec',
    unlocked: true,
  },
  {
    id: 'reaper_apex',
    name: 'Reaper-T7',
    callsign: 'WAR MACHINE',
    faction: 'Automated Armaments Corp',
    category: 'normal',
    quote: '"Extermination protocol initialized."',
    health: 120,
    speed: 0.9,
    armorRating: 1.3,
    activeSkill: {
      name: 'Overdrive Cannon',
      description: 'Overclocks current firearm fire rate by 50% and removes reload time for 5 seconds.',
      cooldown: 40,
      duration: 5,
      icon: 'Flame'
    },
    skins: [
      { id: 'skin_mech_titan', name: 'Obsidian Armor', rarity: 'Legendary', primaryColor: '#27272a', camoPattern: 'urban_shadow', visorColor: '#ef4444' },
    ],
    selectedSkinId: 'skin_mech_titan',
    unlocked: true,
  },
  // --- MARVEL HEROES (IRON MAN, SPIDER-MAN, DOCTOR STRANGE, SCARLET WITCH) ---
  {
    id: 'iron_man',
    name: 'Iron Man',
    callsign: 'INVINCIBLE MK-85',
    faction: 'Avengers (Stark Industries)',
    category: 'marvel',
    quote: '"I am Iron Man. Nanotech armed—missiles hot, Unibeam at max output."',
    archetype: 'Nano-Armored Tech Genius / Aerial Striker',
    health: 100,
    speed: 1.24,
    armorRating: 1.4,
    signatureMoves: [
      { name: 'Micro-Missile Barrage', type: 'Shoulder Salvo [E]', description: 'Launches homing Stark micro-missiles hitting up to 4 foes and blasting craters.' },
      { name: 'Bleeding Edge Nano Shield', type: 'Nano Defense [F]', description: 'Deploys +60 Nano Armor, clears burns/slows, and restores +20 HP.' },
      { name: 'Armor Transformation', type: 'Live Form Shift [T]', description: 'Morphs live between Mark III, Mark 50 Nano, Mark 85 Endgame, and Hulkbuster.' },
      { name: 'Maximum RT Unibeam', type: 'Core Ultimate [Q]', description: 'Fires a towering Arc Reactor beam tearing across the arena.' },
    ],
    psychologicalProfile: {
      trait: 'Futurist Ingenuity',
      boredomLoop: 'Always three armor upgrades ahead of every threat, Tony Stark improvises Stark orbital tech mid-firefight.'
    },
    activeSkill: { name: 'Maximum RT Unibeam', description: 'Unleashes Arc Reactor overdrive + full Nano Armor.', cooldown: 20, duration: 5, icon: 'Zap' },
    skins: [
      { id: 'skin_ironman_mk3', name: 'Mark III Classic Armor', rarity: 'Epic', primaryColor: '#b91c1c', camoPattern: 'ironman_mk3', visorColor: '#38bdf8', auraColor: '#38bdf8', gloveColor: '#fbbf24', multiplier: 'ARC MARK III', transformationLore: 'Iconic hot-rod crimson and gold titanium alloy with glowing circular Arc Reactor.', isLocked: false },
      { id: 'skin_ironman_mk50', name: 'Mark 50 Bleeding Edge', rarity: 'Legendary', primaryColor: '#991b1b', camoPattern: 'ironman_mk50', visorColor: '#7dd3fc', auraColor: '#38bdf8', gloveColor: '#f59e0b', multiplier: 'NANO MK-L · +15% SPEED', transformationLore: 'Liquid nanoparticle suit sprouting twin back wing thrusters and energy cannons.', isLocked: false },
      { id: 'skin_ironman_mk85', name: 'Mark 85 Endgame Infinity', rarity: 'Mythic', primaryColor: '#7f1d1d', camoPattern: 'ironman_mk85', visorColor: '#fde047', auraColor: '#fbbf24', gloveColor: '#fbbf24', multiplier: 'INFINITY NANOTECH', transformationLore: 'Heavy gold shoulder armor carrying Infinity Stone energy conduits on the right gauntlet.', isLocked: false },
      { id: 'skin_ironman_hulkbuster', name: 'Veronica Hulkbuster Armor', rarity: 'Mythic', primaryColor: '#991b1b', camoPattern: 'ironman_hulkbuster', visorColor: '#38bdf8', auraColor: '#f97316', gloveColor: '#fbbf24', multiplier: 'HEAVY TITAN ARMOR', transformationLore: 'Massive orbital heavy-assault suit engineered to trade blows with world-breakers.', isLocked: false },
    ],
    selectedSkinId: 'skin_ironman_mk85',
    unlocked: true,
  },
  {
    id: 'spider_man',
    name: 'Spider-Man',
    callsign: 'FRIENDLY NEIGHBORHOOD',
    faction: 'Avengers / Queens',
    category: 'marvel',
    quote: '"My Spider-Sense is tingling—good thing I brought four extra arms!"',
    archetype: 'Acrobatic Web-Slinger & Iron Spider',
    health: 100,
    speed: 1.36,
    armorRating: 1.2,
    signatureMoves: [
      { name: 'Web Bomb Bind', type: 'Crowd Control [E]', description: 'Detonates an electric web cluster immobilizing nearby enemies for 4 seconds.' },
      { name: 'Web Zip Swing', type: 'Hyper Mobility [F]', description: 'Launches forward on a high-tension web line across ruins with Spider-Sense dodge.' },
      { name: 'Suit Transformation', type: 'Live Form Shift [T]', description: 'Cycles Classic Red-Blue, Iron Spider Golden Arms, and Symbiote Black Suit.' },
      { name: 'Iron-Symbiote Overload', type: 'Slam Ultimate [Q]', description: 'Leaps and slams the ground with mechanical waldoes & symbiote spikes.' },
    ],
    psychologicalProfile: {
      trait: 'Quipping Acrobat Under Pressure',
      boredomLoop: 'With great power comes endless agility—reading incoming attacks before they fire.'
    },
    activeSkill: { name: 'Spider-Sense & Overload', description: 'Tethers nearby foes in electric webbing and boosts agility.', cooldown: 18, duration: 5, icon: 'Zap' },
    skins: [
      { id: 'skin_spiderman_classic', name: 'Classic Red & Blue', rarity: 'Epic', primaryColor: '#dc2626', camoPattern: 'spiderman_classic', visorColor: '#f8fafc', auraColor: '#38bdf8', capeColor: '#1d4ed8', multiplier: 'SPIDER-SENSE 1.36x', transformationLore: 'Iconic red-and-blue webbed suit with expressive white Spider-Sense lenses.', isLocked: false },
      { id: 'skin_spiderman_iron', name: 'Iron Spider (Gold Arms)', rarity: 'Mythic', primaryColor: '#991b1b', camoPattern: 'spiderman_iron', visorColor: '#38bdf8', auraColor: '#fbbf24', gloveColor: '#fbbf24', multiplier: '4 GOLDEN WALDOES', transformationLore: 'Stark nanotech armor featuring glowing blue eye lenses and 4 articulated golden spider legs.', isLocked: false },
      { id: 'skin_spiderman_symbiote', name: 'Symbiote Black Suit', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'spiderman_symbiote', visorColor: '#ffffff', auraColor: '#a855f7', capeColor: '#18181b', multiplier: 'VENOM SYMBIOTE', transformationLore: 'Living jet-black alien suit with jagged white spider emblem and tendrils.', isLocked: false },
    ],
    selectedSkinId: 'skin_spiderman_classic',
    unlocked: true,
  },
  {
    id: 'doctor_strange',
    name: 'Doctor Strange',
    callsign: 'SORCERER SUPREME',
    faction: 'Masters of the Mystic Arts',
    category: 'marvel',
    quote: '"In the grand calculus of the multiverse, you already lost."',
    archetype: 'Multiversal Mystic / Time Stone Master',
    health: 100,
    speed: 1.24,
    armorRating: 1.35,
    signatureMoves: [
      { name: 'Mirror Dimension Seal', type: 'Stasis & Purge [E]', description: 'Traps enemies in crystalline geometry (3.5s freeze) and wipes incoming spells.' },
      { name: 'Sling Ring Portal', type: 'Spatial Warp [F]', description: 'Opens a golden spark portal to teleport behind cover with Mystic Ward.' },
      { name: 'Multiverse Variant', type: 'Live Form Shift [T]', description: 'Shifts between Sorcerer Supreme, Defender Strange, and Sinister Darkhold.' },
      { name: 'Vishanti Time Nova', type: 'Mystic Ultimate [Q]', description: 'Fires emerald Time Stone & scarlet Eldritch rings across the entire sector.' },
    ],
    psychologicalProfile: {
      trait: 'Multiversal Strategist',
      boredomLoop: 'Viewed 14,000,605 timelines and memorized every winning spell sequence.'
    },
    activeSkill: { name: 'Winds of Watoomb & Vishanti', description: 'Seals time loops, erases spells, and blasts mystic rings.', cooldown: 22, duration: 6, icon: 'Sparkles' },
    skins: [
      { id: 'skin_strange_supreme', name: 'Sorcerer Supreme', rarity: 'Legendary', primaryColor: '#1e3a8a', camoPattern: 'strange_supreme', visorColor: '#22c55e', capeColor: '#b91c1c', auraColor: '#f97316', multiplier: 'EYE OF AGAMOTTO', transformationLore: 'Sanctum navy robes, sentient crimson Cloak of Levitation, and emerald Time Stone.', isLocked: false },
      { id: 'skin_strange_defender', name: 'Defender Strange', rarity: 'Legendary', primaryColor: '#09090b', camoPattern: 'strange_defender', visorColor: '#fb923c', capeColor: '#991b1b', auraColor: '#f97316', multiplier: 'MULTIVERSE VARIANT', transformationLore: 'Sleek black-and-crimson multiverse coat with silver temple streaks.', isLocked: false },
      { id: 'skin_strange_sinister', name: 'Sinister Darkhold Strange', rarity: 'Mythic', primaryColor: '#18181b', camoPattern: 'strange_sinister', visorColor: '#c084fc', capeColor: '#4c1d95', auraColor: '#a855f7', multiplier: 'THIRD EYE AWAKENED', transformationLore: 'Corrupted Darkhold sorcerer boasting an awakened mystic Third Eye and shadow aura.', isLocked: false },
    ],
    selectedSkinId: 'skin_strange_supreme',
    unlocked: true,
  },
  {
    id: 'scarlet_witch',
    name: 'Scarlet Witch',
    callsign: 'CHAOS NEXUS BEING',
    faction: 'Avengers / Mount Wundagore',
    category: 'marvel',
    quote: '"You break the rules and become a hero. I do it and wield Chaos."',
    archetype: 'Chaos Reality Warper',
    health: 100,
    speed: 1.26,
    armorRating: 1.32,
    signatureMoves: [
      { name: 'Hex Reality Warp', type: 'Reality Stun [E]', description: 'Crushes armor to 0, freezes enemies inside crimson Hex runes, and deletes spells.' },
      { name: 'Telekinetic Phase', type: 'Chaos Surge [F]', description: 'Glides rapidly through scarlet mist while shielding +45 Chaos Ward.' },
      { name: 'Nexus Transformation', type: 'Live Form Shift [T]', description: 'Ascends from Sokovian Jacket Wanda to Scarlet Witch Crown & Darkhold Queen.' },
      { name: 'Chthon Darkhold Nova', type: 'Nexus Ultimate [Q]', description: 'Bends reality to detonate an overwhelming crimson Chaos Wave.' },
    ],
    psychologicalProfile: {
      trait: 'Boundless Chaos Conduit',
      boredomLoop: 'Needs no incantations—spontaneous Probability Hexes rewrite what exists.'
    },
    activeSkill: { name: 'Scarlet Reality Rewrite', description: 'Strips enemy armor, cleanses debuffs, and blasts Chaos Magic.', cooldown: 22, duration: 6, icon: 'Flame' },
    skins: [
      { id: 'skin_wanda_sokovia', name: 'Sokovian Hex Jacket', rarity: 'Epic', primaryColor: '#991b1b', camoPattern: 'wanda_sokovia', visorColor: '#ef4444', capeColor: '#7f1d1d', auraColor: '#ef4444', multiplier: 'HEX AWAKENED', transformationLore: 'Long crimson leather coat with glowing scarlet chaos energy swirling at fingertips.', isLocked: false },
      { id: 'skin_wanda_scarlet', name: 'Scarlet Witch Crown', rarity: 'Mythic', primaryColor: '#7f1d1d', camoPattern: 'wanda_scarlet', visorColor: '#f43f5e', capeColor: '#dc2626', auraColor: '#f43f5e', multiplier: 'NEXUS TIARA', transformationLore: 'Forged Scarlet Witch headdress, ornate crimson armor plates, and floating cape.', isLocked: false },
      { id: 'skin_wanda_darkhold', name: 'Darkhold Chthon Queen', rarity: 'Mythic', primaryColor: '#18181b', camoPattern: 'wanda_darkhold', visorColor: '#fb7185', capeColor: '#450a0a', auraColor: '#e11d48', multiplier: 'CHAOS SOVEREIGN', transformationLore: 'Blackened Darkhold fingertips, obsidian chaos crown, and apocalyptic red halo.', isLocked: false },
    ],
    selectedSkinId: 'skin_wanda_scarlet',
    unlocked: true,
  },
  // --- DC HEROES (BATMAN, WONDER WOMAN, AQUAMAN) ---
  {
    id: 'batman',
    name: 'Batman',
    callsign: 'THE DARK KNIGHT',
    faction: 'Justice League / Gotham',
    category: 'dc',
    quote: '"I am vengeance. I am the night. I have a contingency for everything."',
    archetype: 'Apex Detective & Hellbat Tactician',
    health: 100,
    speed: 1.26,
    armorRating: 1.4,
    signatureMoves: [
      { name: 'Cryo Smoke Bomb', type: 'Stealth & Freeze [E]', description: 'Drops a WayneTech cryo-smoke cloud freezing hostiles and erasing incoming spells.' },
      { name: 'Grapnel Gun Blitz', type: 'Bat-Mobility [F]', description: 'Zips rapidly across cover with cape-glide momentum and +35 Armor.' },
      { name: 'Bat-Suit Protocol', type: 'Live Form Shift [T]', description: 'Deploys Classic Dark Knight, Arkham Knight exo-plate, or Apokolips Hellbat.' },
      { name: 'Hellbat Fenrir Strike', type: 'Bat-Ultimate [Q]', description: 'Ignites crimson chest wings for a brutal Gotham shockwave blitz.' },
    ],
    psychologicalProfile: {
      trait: 'Hyper-Prepared Tactician',
      boredomLoop: 'Turned Gotham’s shadows into an arsenal capable of neutralizing gods.'
    },
    activeSkill: { name: 'Hellbat Protocol', description: 'Unleashes Hellbat wing surge, stealth cloak, and cryo disruption.', cooldown: 22, duration: 5, icon: 'Shield' },
    skins: [
      { id: 'skin_batman_classic', name: 'Dark Knight Classic', rarity: 'Epic', primaryColor: '#334155', camoPattern: 'batman_classic', visorColor: '#f8fafc', capeColor: '#09090b', gloveColor: '#fbbf24', multiplier: 'GOTHAM DETECTIVE', transformationLore: 'Slate-grey kevlar suit, scalloped midnight cape, iconic utility belt, and sharp cowl ears.', isLocked: false },
      { id: 'skin_batman_arkham', name: 'Arkham Exo-Knight', rarity: 'Legendary', primaryColor: '#1e293b', camoPattern: 'batman_arkham', visorColor: '#38bdf8', capeColor: '#0f172a', gloveColor: '#64748b', multiplier: 'TRI-WEAVE ARMOR', transformationLore: 'Segmented titanium Arkham battleplate built to withstand heavy ordnance.', isLocked: false },
      { id: 'skin_batman_hellbat', name: 'Hellbat Apokolips Suit', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'batman_hellbat', visorColor: '#ef4444', capeColor: '#991b1b', auraColor: '#ef4444', multiplier: 'DARKSEID SLAYER', transformationLore: 'Forged in the Sun by the Justice League—obsidian plate with blazing crimson bat-wings.', isLocked: false },
    ],
    selectedSkinId: 'skin_batman_classic',
    unlocked: true,
  },
  {
    id: 'wonder_woman',
    name: 'Wonder Woman',
    callsign: 'PRINCESS OF THEMYSCIRA',
    faction: 'Justice League / Amazons',
    category: 'dc',
    quote: '"Peace is something you fight for every single day—with shield and sword."',
    archetype: 'Demigod Amazon Warrior / Flight',
    health: 100,
    speed: 1.28,
    armorRating: 1.45,
    signatureMoves: [
      { name: 'Bracelets of Submission', type: 'Deflect Slam [E]', description: 'Clashes indestructible gauntlets to wipe all hostile spells and blast foes back.' },
      { name: 'Lasso of Truth Dash', type: 'Binding Rush [F]', description: 'Snaps the golden lasso forward to stun targets and surge in close.' },
      { name: 'Amazon Transformation', type: 'Live Form Shift [T]', description: 'Morphs between Amazon Champion, Golden Eagle Armor, and Goddess of War.' },
      { name: 'Olympian War Strike', type: 'Divine Ultimate [Q]', description: 'Calls down divine Olympian thunder while healing +35 HP.' },
    ],
    psychologicalProfile: {
      trait: 'Unbreakable Compassion & Valor',
      boredomLoop: 'Thousands of years of Amazonian combat mastery tempered by boundless grace.'
    },
    activeSkill: { name: 'Bracelets & Eagle Flight', description: 'Clashes divine gauntlets to clear magic and deal Olympian damage.', cooldown: 20, duration: 6, icon: 'Shield' },
    skins: [
      { id: 'skin_ww_amazon', name: 'Amazon Warrior', rarity: 'Epic', primaryColor: '#b91c1c', camoPattern: 'ww_amazon', visorColor: '#fbbf24', capeColor: '#1d4ed8', gloveColor: '#94a3b8', multiplier: 'DEMIGOD CHAMPION', transformationLore: 'Crimson eagle breastplate, royal blue skirt, golden tiara, and silver Bracelets.', isLocked: false },
      { id: 'skin_ww_golden', name: 'Golden Eagle Armor', rarity: 'Mythic', primaryColor: '#eab308', camoPattern: 'ww_golden_eagle', visorColor: '#fef08a', capeColor: '#fbbf24', auraColor: '#fde047', multiplier: 'WINGED AEGIS', transformationLore: 'Shining ceremonial Golden Eagle Armor fitted with towering winged pauldrons.', isLocked: false },
      { id: 'skin_ww_war', name: 'Goddess of War', rarity: 'Mythic', primaryColor: '#991b1b', camoPattern: 'ww_war_goddess', visorColor: '#38bdf8', capeColor: '#0f172a', auraColor: '#38bdf8', multiplier: 'GODSLAYER AWAKENED', transformationLore: 'Divine silver-crimson warplate crackling with blue Olympian lightning.', isLocked: false },
    ],
    selectedSkinId: 'skin_ww_amazon',
    unlocked: true,
  },
  {
    id: 'aquaman',
    name: 'Aquaman',
    callsign: 'KING OF ATLANTIS',
    faction: 'Justice League / Atlantis',
    category: 'dc',
    quote: '"You carry fire and steel. I bring the crushing fury of seven oceans!"',
    archetype: 'Atlantean Sovereign & Hydro-Striker',
    health: 100,
    speed: 1.24,
    armorRating: 1.42,
    signatureMoves: [
      { name: 'Atlantean Tidal Wave', type: 'Hydro Sweep [E]', description: 'Sweeps a pressurized ocean wave freezing foes and extinguishing fire burns.' },
      { name: 'Hydro Surge Dash', type: 'Current Rush [F]', description: 'Propels forward inside a swirling sea vortex with +40 Atlantean scale armor.' },
      { name: 'King Transformation', type: 'Live Form Shift [T]', description: 'Shifts between Gold-Green King of Atlantis, Gladiator, and Stealth Manta Suit.' },
      { name: 'Kraken Maelstrom', type: 'Oceanic Ultimate [Q]', description: 'Summons an abyssal maelstrom tearing through arena squads.' },
    ],
    psychologicalProfile: {
      trait: 'Bridger of Land & Sea',
      boredomLoop: 'Commands every wave and abyssal leviathan across seventy percent of Earth.'
    },
    activeSkill: { name: 'Kraken Maelstrom', description: 'Unleashes crushing oceanic pressure & full hydration cleanse.', cooldown: 20, duration: 5, icon: 'Flame' },
    skins: [
      { id: 'skin_aquaman_king', name: 'King of Atlantis', rarity: 'Legendary', primaryColor: '#eab308', camoPattern: 'aquaman_king', visorColor: '#38bdf8', capeColor: '#059669', gloveColor: '#fbbf24', multiplier: 'TRIDENT OF ATLAN', transformationLore: 'Iconic golden Atlantean scale armor paired with emerald gauntlets and royal Trident.', isLocked: false },
      { id: 'skin_aquaman_gladiator', name: 'Abyssal Gladiator', rarity: 'Epic', primaryColor: '#1e293b', camoPattern: 'aquaman_gladiator', visorColor: '#22d3ee', capeColor: '#0f766e', auraColor: '#06b6d4', multiplier: 'TRENCH STEEL', transformationLore: 'Heavy obsidian Atlantean battle armor etched with bioluminescent aqua runes.', isLocked: false },
      { id: 'skin_aquaman_stealth', name: 'Stealth Manta Suit', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'aquaman_stealth', visorColor: '#38bdf8', capeColor: '#0284c7', auraColor: '#38bdf8', multiplier: 'DEEP SEA STEALTH', transformationLore: 'Midnight tactical hydro-suit with glowing cyan gills built for covert strikes.', isLocked: false },
    ],
    selectedSkinId: 'skin_aquaman_king',
    unlocked: true,
  },
  // --- 10 REQUESTED ANIME HEROES ---
  {
    id: 'rimuru_tempest',
    name: 'Rimuru Tempest',
    callsign: 'TRUE DRAGON DEMON LORD',
    faction: 'Jura Tempest Federation',
    category: 'anime',
    quote: '"Ciel, analyze their magic. Gluttonous King Beelzebuth—devour everything!"',
    archetype: 'Ultimate Slime / True Dragon Supreme',
    health: 100,
    speed: 1.34,
    armorRating: 1.48,
    signatureMoves: [
      { name: 'Beelzebuth Devour', type: 'Spell Eat & Heal [E]', description: 'Consumes all hostile witch spells, blasts enemies in black-violet slime void, and heals +35 HP.' },
      { name: 'Veldora Storm Warp', type: 'Tempest Dash [F]', description: 'Teleports in black dragon lightning while boosting speed.' },
      { name: 'Slime Evolution', type: 'Live Form Shift [T]', description: 'Evolves Slime Human → Awakened Demon Lord → True Dragon Ultimate Slime (Ciel).' },
      { name: 'Void God Azathoth', type: 'True Dragon Ult [Q]', description: 'Collapses space with Nihility Collapse, erasing targets across the map.' },
    ],
    psychologicalProfile: {
      trait: 'Carefree Sovereign With Ciel',
      boredomLoop: 'Once an ordinary slime, now commands Octagram Demon Lord authority and True Dragon Nihility.'
    },
    activeSkill: { name: 'Void God Azathoth', description: 'Devours magic, heals vitality, and unleashes True Dragon Nihility.', cooldown: 20, duration: 6, icon: 'Zap' },
    skins: [
      { id: 'skin_rimuru_slime', name: 'Tempest Human Form', rarity: 'Epic', primaryColor: '#1e293b', camoPattern: 'rimuru_slime', visorColor: '#fbbf24', capeColor: '#f8fafc', auraColor: '#38bdf8', hairColor: '#7dd3fc', multiplier: 'GREAT SAGE', transformationLore: 'Blue-silver hair, dark Tempest coat, fluffy white scarf, and a companion Slime aura.', isLocked: false },
      { id: 'skin_rimuru_demon_lord', name: 'Awakened Demon Lord', rarity: 'Legendary', primaryColor: '#09090b', camoPattern: 'rimuru_demon_lord', visorColor: '#ef4444', capeColor: '#18181b', auraColor: '#a855f7', hairColor: '#38bdf8', multiplier: 'RAPHAEL AWAKENED', transformationLore: 'Fur-trimmed jet-black Demon Lord coat and dark bat wings of Octagram royalty.', isLocked: false },
      { id: 'skin_rimuru_dragon', name: 'True Dragon (Ciel)', rarity: 'Mythic', primaryColor: '#f8fafc', camoPattern: 'rimuru_true_dragon', visorColor: '#fef08a', capeColor: '#38bdf8', auraColor: '#67e8f9', hairColor: '#bae6fd', multiplier: 'NIHILITY AZATHOTH', transformationLore: 'Radiant white-gold True Dragon vestments, dragon wings, and golden Ciel crown.', isLocked: false },
    ],
    selectedSkinId: 'skin_rimuru_dragon',
    unlocked: true,
  },
  {
    id: 'sung_jinwoo',
    name: 'Sung Jin-Woo',
    callsign: 'THE SHADOW MONARCH',
    faction: 'Ahjin Guild / Sovereign of Shadows',
    category: 'anime',
    quote: '"ARISE. Every fallen enemy becomes my shadow soldier."',
    archetype: 'Necromancer Assassin / Ashborn Heir',
    health: 100,
    speed: 1.38,
    armorRating: 1.42,
    signatureMoves: [
      { name: "Ruler's Authority", type: 'Telekinetic Crush [E]', description: 'Crushes enemy armor to 0 and locks hostiles mid-air with invisible Monarch force.' },
      { name: 'Shadow Exchange', type: 'Shadow Teleport [F]', description: 'Steps into shadow space, warping forward and gaining +45 Shadow Armor.' },
      { name: 'Monarch Transformation', type: 'Live Form Shift [T]', description: 'Evolves E-Rank Assassin → Shadow Monarch Cloak → Ashborn True Monarch.' },
      { name: 'ARISE: Domain of Shadows', type: 'Monarch Ult [Q]', description: 'Expands a pitch-violet Monarch domain calling Igris, Beru, and Bellion shadows.' },
    ],
    psychologicalProfile: {
      trait: 'Solo Leveling Sovereign',
      boredomLoop: 'Rose from Humanity’s Weakest Hunter to wield an immortal legion of ten million shadows.'
    },
    activeSkill: { name: 'ARISE: Shadow Domain', description: 'Unleashes violet Monarch pillars and refreshes Assassin velocity.', cooldown: 20, duration: 6, icon: 'Zap' },
    skins: [
      { id: 'skin_jinwoo_assassin', name: 'Hunter Assassin Coat', rarity: 'Epic', primaryColor: '#1e293b', camoPattern: 'jinwoo_assassin', visorColor: '#38bdf8', capeColor: '#0f172a', auraColor: '#0ea5e9', multiplier: 'LEVEL UP SYSTEM', transformationLore: 'Dark combat trench coat, dual Kasaka daggers, and cold ice-blue System eyes.', isLocked: false },
      { id: 'skin_jinwoo_monarch', name: 'Shadow Monarch (Igris)', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'jinwoo_monarch', visorColor: '#a855f7', capeColor: '#3b0764', auraColor: '#9333ea', multiplier: 'SHADOW SOVEREIGN', transformationLore: 'Flowing pitch-violet Shadow Monarch mantle and blazing amethyst hunter gaze.', isLocked: false },
      { id: 'skin_jinwoo_ashborn', name: 'Ashborn True Monarch', rarity: 'Mythic', primaryColor: '#020617', camoPattern: 'jinwoo_ashborn', visorColor: '#e879f9', capeColor: '#581c87', auraColor: '#c084fc', multiplier: 'IMMORTAL HEART', transformationLore: 'Full obsidian Ashborn shadow dragon armor crowned in eternal violet flame.', isLocked: false },
    ],
    selectedSkinId: 'skin_jinwoo_monarch',
    unlocked: true,
  },
  {
    id: 'naruto_uzumaki',
    name: 'Naruto Uzumaki',
    callsign: 'SEVENTH HOKAGE',
    faction: 'Hidden Leaf Village (Konoha)',
    category: 'anime',
    quote: '"I’m never gonna go back on my word—that’s my ninja way, believe it!"',
    archetype: 'Nine-Tails Jinchuriki / Six Paths',
    health: 100,
    speed: 1.35,
    armorRating: 1.4,
    signatureMoves: [
      { name: 'Wind Style: Rasenshuriken', type: 'Razor Vortex [E]', description: 'Hurls a howling chakra shuriken that cuts armor and blasts an entire squad.' },
      { name: 'Shadow Clone Blitz', type: 'Shinobi Rush [F]', description: 'Propels forward on Kurama chakra jets with +40 Chakra Cloak armor.' },
      { name: 'Tailed Beast Mode', type: 'Live Form Shift [T]', description: 'Cycles Shippuden → Sage Mode → KCM2 → Six Paths → Baryon Mode!' },
      { name: 'Baryon Tailed Beast Bomb', type: 'Kurama Ult [Q]', description: 'Detonates a massive condensed Bijuu Bomb erasing all cover nearby.' },
    ],
    psychologicalProfile: {
      trait: 'Indomitable Shinobi Bonds',
      boredomLoop: 'United Kurama’s hatred with Toad Sage nature energy to become the Seventh Hokage.'
    },
    activeSkill: { name: 'Six Paths Kurama Link', description: 'Channels Truth-Seeking Orbs and Bijuu chakra overdrive.', cooldown: 20, duration: 6, icon: 'Flame' },
    skins: [
      { id: 'skin_naruto_shippuden', name: 'Shippuden Orange Ninja', rarity: 'Rare', primaryColor: '#ea580c', camoPattern: 'naruto_shippuden', visorColor: '#38bdf8', capeColor: '#18181b', hairColor: '#facc15', multiplier: 'KONOHA SHINOBI', transformationLore: 'Classic orange-and-black shinobi tracksuit, spiky blonde hair, and Konoha headband.', isLocked: false },
      { id: 'skin_naruto_sage', name: 'Mount Myoboku Sage Mode', rarity: 'Epic', primaryColor: '#dc2626', camoPattern: 'naruto_sage', visorColor: '#fbbf24', capeColor: '#991b1b', auraColor: '#f59e0b', hairColor: '#fde047', multiplier: 'SAGE SENJUTSU', transformationLore: 'Crimson Hokage-style flame haori cloak and golden toad-sage eye pigmentation.', isLocked: false },
      { id: 'skin_naruto_kcm2', name: 'Kurama Chakra Mode (KCM2)', rarity: 'Legendary', primaryColor: '#facc15', camoPattern: 'naruto_kcm2', visorColor: '#fbbf24', capeColor: '#f97316', auraColor: '#fbbf24', hairColor: '#fef08a', multiplier: 'KURAMA LINK 2.5x', transformationLore: 'Radiant golden-amber Kurama chakra cloak lined with Six Paths magatama seals.', isLocked: false },
      { id: 'skin_naruto_sixpaths', name: 'Six Paths Sage Mode', rarity: 'Mythic', primaryColor: '#fbbf24', camoPattern: 'naruto_sixpaths', visorColor: '#fef08a', capeColor: '#18181b', auraColor: '#fde047', hairColor: '#fef9c3', multiplier: 'TRUTH-SEEKING ORBS', transformationLore: 'Golden glowing Hokage mantle orbited by 6 black Truth-Seeking Orbs.', isLocked: false },
      { id: 'skin_naruto_baryon', name: 'Baryon Mode (Final Form)', rarity: 'Mythic', primaryColor: '#ea580c', camoPattern: 'naruto_baryon', visorColor: '#ef4444', capeColor: '#b91c1c', auraColor: '#f97316', hairColor: '#fbbf24', multiplier: 'NUCLEAR KURAMA · APEX', transformationLore: 'Blazing crimson-orange Nine-Tails chakra cloak and twin fox ear flames.', isLocked: false },
    ],
    selectedSkinId: 'skin_naruto_sixpaths',
    unlocked: true,
  },
  {
    id: 'monkey_d_luffy',
    name: 'Monkey D. Luffy',
    callsign: 'SUN GOD NIKA',
    faction: 'Straw Hat Pirates (Emperor)',
    category: 'anime',
    quote: '"I’m gonna be King of the Pirates! This is my peak—GEAR 5!"',
    archetype: 'Emperor of the Sea / Rubber Awakened',
    health: 100,
    speed: 1.34,
    armorRating: 1.38,
    signatureMoves: [
      { name: 'Gum-Gum Red Roc', type: 'Haki Fire Slam [E]', description: 'Blasts Conqueror-infused flaming rubber punches blasting targets sky-high.' },
      { name: 'Jet Culverin Step', type: 'Gear 2/4 Rush [F]', description: 'Snaps at blinding steam velocity around foes and grants +35 Haki armor.' },
      { name: 'Gear Shift Transform', type: 'Live Form Shift [T]', description: 'Morphs Base Straw Hat → Gear 2nd/3rd → Gear 4th → Gear 5 Sun God Nika!' },
      { name: 'Bajrang Gun (Gear 5)', type: 'Emperor Ult [Q]', description: 'Island-crushing rubber fist wrapped in Supreme King lightning!' },
    ],
    psychologicalProfile: {
      trait: 'Free Spirit / Joy Boy',
      boredomLoop: 'Laughs through impossible odds as Drums of Liberation echo across the battlefield.'
    },
    activeSkill: { name: 'Drums of Liberation: Bajrang Gun', description: 'Awakens Nika cloud halo and slams massive Haki fists.', cooldown: 20, duration: 6, icon: 'Flame' },
    skins: [
      { id: 'skin_luffy_base', name: 'Straw Hat Captain', rarity: 'Rare', primaryColor: '#dc2626', camoPattern: 'luffy_base', visorColor: '#18181b', capeColor: '#facc15', auraColor: '#f97316', multiplier: 'RUBBER PIRATE', transformationLore: 'Red pirate vest, blue shorts, chest X-scar, and the legendary Straw Hat.', isLocked: false },
      { id: 'skin_luffy_gear2', name: 'Gear 2nd Steam Overdrive', rarity: 'Epic', primaryColor: '#ef4444', camoPattern: 'luffy_gear2', visorColor: '#fde047', capeColor: '#f43f5e', auraColor: '#fb7185', gloveColor: '#09090b', multiplier: 'SONIC STEAM + HAKI', transformationLore: 'Pumping glowing rose-red skin releasing hot steam with Armament Haki fists.', isLocked: false },
      { id: 'skin_luffy_gear4', name: 'Gear 4th Boundman / Snakeman', rarity: 'Legendary', primaryColor: '#b91c1c', camoPattern: 'luffy_gear4', visorColor: '#ef4444', capeColor: '#18181b', auraColor: '#dc2626', gloveColor: '#09090b', multiplier: 'BLACK MAMBA HAKI', transformationLore: 'Black Armament tribal markings across torso and swirling crimson-black steam collar.', isLocked: false },
      { id: 'skin_luffy_gear5', name: 'Gear 5: Sun God Nika', rarity: 'Mythic', primaryColor: '#f8fafc', camoPattern: 'luffy_gear5', visorColor: '#f43f5e', capeColor: '#ffffff', auraColor: '#e2e8f0', hairColor: '#ffffff', multiplier: 'DRUMS OF LIBERATION', transformationLore: 'All-white Joy Boy transformation with billowing white hagoromo cloud ring and crimson eyes.', isLocked: false },
    ],
    selectedSkinId: 'skin_luffy_gear5',
    unlocked: true,
  },
  {
    id: 'satoru_gojo',
    name: 'Satoru Gojo',
    callsign: 'THE HONORED ONE',
    faction: 'Jujutsu High (Strongest Sorcerer)',
    category: 'anime',
    quote: '"Throughout Heaven and Earth, I alone am the Honored One."',
    archetype: 'Limitless & Six Eyes Transcendent',
    health: 100,
    speed: 1.36,
    armorRating: 1.5,
    signatureMoves: [
      { name: 'Cursed Technique: Red', type: 'Repulsion Blast [E]', description: 'Blasts convergent crimson Limitless force hurling foes back and erasing spells.' },
      { name: 'Limitless Infinity Shield', type: 'Absolute Barrier [F]', description: 'Divides space infinitely (+65 Armor & clears incoming burns/slows).' },
      { name: 'Six Eyes Shift', type: 'Live Form Shift [T]', description: 'Unmasks Blindfold → Awakened Six Eyes → Shinjuku Honored One.' },
      { name: 'Domain: Unlimited Void + Purple', type: 'Special Grade Ult [Q]', description: 'Stuns enemies in Infinite Void sensory overload and detonates Hollow Purple!' },
    ],
    psychologicalProfile: {
      trait: 'Effortlessly Untouchable',
      boredomLoop: 'Born with Six Eyes and Limitless; Infinity keeps every attack from ever touching him.'
    },
    activeSkill: { name: 'Unlimited Void + Hollow Purple', description: 'Freezes enemies in Domain Expansion and erases them with Purple.', cooldown: 22, duration: 6, icon: 'Sparkles' },
    skins: [
      { id: 'skin_gojo_blindfold', name: 'Blindfold Jujutsu Teacher', rarity: 'Epic', primaryColor: '#0f172a', camoPattern: 'gojo_blindfold', visorColor: '#18181b', auraColor: '#38bdf8', hairColor: '#f8fafc', multiplier: 'INFINITY PASSIVE', transformationLore: 'Dark navy Jujutsu coat, matte black blindfold, and gravity-defying snowy white hair.', isLocked: false },
      { id: 'skin_gojo_sixeyes', name: 'Awakened Six Eyes (No Blindfold)', rarity: 'Mythic', primaryColor: '#1e293b', camoPattern: 'gojo_six_eyes', visorColor: '#38bdf8', auraColor: '#7dd3fc', hairColor: '#ffffff', multiplier: 'SIX EYES UNSEALED', transformationLore: 'Blindfold removed, revealing crystalline sky-blue Six Eyes and orbiting Red & Blue orbs.', isLocked: false },
      { id: 'skin_gojo_shinjuku', name: 'Shinjuku Honored One', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'gojo_shinjuku', visorColor: '#c084fc', capeColor: '#f8fafc', auraColor: '#a855f7', hairColor: '#ffffff', multiplier: '200% HOLLOW PURPLE', transformationLore: 'Fitted black Shinjuku battle shirt, loose white hakama pants, and Hollow Purple halo.', isLocked: false },
    ],
    selectedSkinId: 'skin_gojo_sixeyes',
    unlocked: true,
  },
  {
    id: 'yuji_itadori',
    name: 'Yuji Itadori',
    callsign: 'CURSED BLITZ VESSEL',
    faction: 'Tokyo Jujutsu High',
    category: 'anime',
    quote: '"I don’t care how many curses you throw at me—BLACK FLASH!"',
    archetype: 'Black Flash Brawler & Sukuna Vessel',
    health: 100,
    speed: 1.34,
    armorRating: 1.38,
    signatureMoves: [
      { name: 'Black Flash Chain', type: '2.5x Crit Slam [E]', description: 'Distorts space with black-crimson lightning, shattering armor and staggering foes.' },
      { name: 'Manji Cursed Step', type: 'Brawler Dash [F]', description: 'Closes distance in an instant and fortifies Blood Armor (+35 Armor).' },
      { name: 'Vessel Awakening', type: 'Live Form Shift [T]', description: 'Switches Jujutsu Uniform → Sukuna Vessel Markings → Awakened Black Flash!' },
      { name: 'Shrine Soul Dismantle', type: 'Vessel Ult [Q]', description: 'Slashes the sector with Malevolent Dismantle waves + +30 HP heal.' },
    ],
    psychologicalProfile: {
      trait: 'Unwavering Cog of Mercy',
      boredomLoop: 'Surpasses limits on sheer willpower, landing consecutive Black Flashes at will.'
    },
    activeSkill: { name: 'Awakened Black Flash', description: 'Triggers distorted space crimson lightning strikes and Shrine slashes.', cooldown: 18, duration: 5, icon: 'Zap' },
    skins: [
      { id: 'skin_itadori_uniform', name: 'Jujutsu High Uniform', rarity: 'Rare', primaryColor: '#1e293b', camoPattern: 'itadori_uniform', visorColor: '#f43f5e', capeColor: '#dc2626', auraColor: '#38bdf8', hairColor: '#fda4af', multiplier: 'DIVERGENT FIST', transformationLore: 'Dark navy Jujutsu jacket layered with signature crimson hoodie and pink spiky hair.', isLocked: false },
      { id: 'skin_itadori_sukuna', name: 'King of Curses Vessel', rarity: 'Mythic', primaryColor: '#450a0a', camoPattern: 'itadori_sukuna', visorColor: '#ef4444', capeColor: '#09090b', auraColor: '#dc2626', hairColor: '#f43f5e', multiplier: 'MALEVOLENT MARKS', transformationLore: 'Black cursed Sukuna forehead & cheek markings and glowing crimson eyes.', isLocked: false },
      { id: 'skin_itadori_blackflash', name: 'Awakened Black Flash', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'itadori_blackflash', visorColor: '#fde047', capeColor: '#be123c', auraColor: '#ef4444', hairColor: '#fb7185', multiplier: 'CURSED ZONE 2.5X', transformationLore: 'Battle-torn gauntlets crackling with eternal black-and-red Black Flash sparks.', isLocked: false },
    ],
    selectedSkinId: 'skin_itadori_blackflash',
    unlocked: true,
  },
  {
    id: 'garou_opm',
    name: 'Garou',
    callsign: 'COSMIC FEAR HERO HUNTER',
    faction: 'Bangs Dojo / Cosmic Threat: God',
    category: 'anime',
    quote: '"I have copied the flow of every force in the universe. Mode: Saitama!"',
    archetype: 'Adaptive Martial Monster / Cosmic Fear',
    health: 100,
    speed: 1.4,
    armorRating: 1.46,
    signatureMoves: [
      { name: 'Extreme Fajin: Cross Fang', type: 'Shockwave [E]', description: 'Bypasses defense directly, strips armor, and fires an internal shockwave.' },
      { name: 'Whirlwind Iron Dash', type: 'Martial Warp [F]', description: 'Weaves past incoming attacks at 1.40x speed with +40 Adaptation Armor.' },
      { name: 'Monster Evolution', type: 'Live Form Shift [T]', description: 'Evolves Hero Hunter → Spiral → Monster Gargoyle → Cosmic Fear Mode!' },
      { name: 'Cosmic Gamma Ray Burst', type: 'Stellar Ult [Q]', description: 'Releases a blinding stellar beam erupting nuclear craters across the arena.' },
    ],
    psychologicalProfile: {
      trait: 'Relentless Evolution',
      boredomLoop: 'Every defeat pushes Garou through another monster limiter until the cosmos itself bends.'
    },
    activeSkill: { name: 'Cosmic Gamma Ray Burst', description: 'Channels starry Galaxy Fist shockwaves and adaptive hyper-speed.', cooldown: 20, duration: 6, icon: 'Flame' },
    skins: [
      { id: 'skin_garou_hunter', name: 'Hero Hunter', rarity: 'Epic', primaryColor: '#18181b', camoPattern: 'garou_hunter', visorColor: '#fbbf24', auraColor: '#38bdf8', hairColor: '#e2e8f0', multiplier: 'WATER STREAM FIST', transformationLore: 'Tight black martial arts shirt and unmistakable double-horned silver hair.', isLocked: false },
      { id: 'skin_garou_spiral', name: 'Half-Monster Spiral', rarity: 'Legendary', primaryColor: '#27272a', camoPattern: 'garou_spiral', visorColor: '#ef4444', auraColor: '#f97316', hairColor: '#f8fafc', multiplier: 'MONSTERIZATION', transformationLore: 'Crimson left eye and glowing molten chest cracks as human limiters break.', isLocked: false },
      { id: 'skin_garou_monster', name: 'Gargoyle Monster Form', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'garou_monster', visorColor: '#f97316', capeColor: '#ea580c', auraColor: '#ef4444', multiplier: 'MONSTER CALAMITY', transformationLore: 'Jagged obsidian monster exoskeleton glowing with roaring magma veins.', isLocked: false },
      { id: 'skin_garou_cosmic', name: 'Awakened Cosmic Fear Mode', rarity: 'Mythic', primaryColor: '#020617', camoPattern: 'garou_cosmic', visorColor: '#e879f9', capeColor: '#6366f1', auraColor: '#a855f7', hairColor: '#c084fc', multiplier: 'MODE: COSMIC FEAR', transformationLore: 'Star-filled cosmic nebula silhouette across body and face with radiant galaxy halo.', isLocked: false },
    ],
    selectedSkinId: 'skin_garou_cosmic',
    unlocked: true,
  },
  {
    id: 'anos_voldigoad',
    name: 'Anos Voldigoad',
    callsign: 'DEMON KING OF TYRANNY',
    faction: 'Delzogade Demon King Academy',
    category: 'anime',
    quote: '"Did you think killing me would be enough to make me die?"',
    archetype: 'Founder / Reality-Destroying Demon King',
    health: 100,
    speed: 1.36,
    armorRating: 1.5,
    signatureMoves: [
      { name: 'Demon Eyes of Destruction', type: 'Freeze & Erase [E]', description: 'Red-eyed gaze disintegrates all incoming magic and freezes targets for 4s.' },
      { name: 'Venuzdonoa Abolisher Slash', type: 'Concept Warp [F]', description: 'Blinks with the dark sword ignoring barriers and stealing +35 Vitality.' },
      { name: 'Tyranny Transformation', type: 'Live Form Shift [T]', description: 'Cycles Academy Uniform → True Demon King → Chaotic Eyes of Destruction.' },
      { name: 'Egil Grone Angdroa', type: 'World-End Ult [Q]', description: 'Unleashes black-flame annihilation wiping every foe on the radar.' },
    ],
    psychologicalProfile: {
      trait: 'Absolute Confident Royalty',
      boredomLoop: 'Laughs off time stops, death curses, and cosmic barriers with one heartbeat.'
    },
    activeSkill: { name: 'Egil Grone Angdroa', description: 'Black annihilation flames and Venuzdonoa reason-erasure.', cooldown: 20, duration: 6, icon: 'Flame' },
    skins: [
      { id: 'skin_anos_academy', name: 'Demon King Academy', rarity: 'Epic', primaryColor: '#f8fafc', camoPattern: 'anos_academy', visorColor: '#ef4444', capeColor: '#09090b', auraColor: '#dc2626', multiplier: 'FOUNDER ANOS', transformationLore: 'White Academy uniform, black shoulder cape, golden braids, and ruby Demon King eyes.', isLocked: false },
      { id: 'skin_anos_tyrant', name: 'True Demon King of Tyranny', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'anos_tyrant', visorColor: '#f43f5e', capeColor: '#991b1b', auraColor: '#ef4444', multiplier: 'VENUZDONOA DRAWN', transformationLore: 'Crimson-and-gold Demon Emperor vestments wreathed in concentric blood-magic seals.', isLocked: false },
      { id: 'skin_anos_chaotic', name: 'Chaotic Eyes of Destruction', rarity: 'Mythic', primaryColor: '#020617', camoPattern: 'anos_chaotic', visorColor: '#c084fc', capeColor: '#450a0a', auraColor: '#a855f7', multiplier: 'WORLD DESTRUCTION', transformationLore: 'Apocalyptic obsidian halo and twin Chaotic Purple-Crimson eyes.', isLocked: false },
    ],
    selectedSkinId: 'skin_anos_tyrant',
    unlocked: true,
  },
  {
    id: 'itachi_uchiha',
    name: 'Itachi Uchiha',
    callsign: 'MANGEKYO PHANTOM',
    faction: 'Akatsuki / Uchiha Clan',
    category: 'anime',
    quote: '"You are already under my genjutsu. Amaterasu."',
    archetype: 'Genjutsu Master & Susanoo Wielder',
    health: 100,
    speed: 1.32,
    armorRating: 1.38,
    signatureMoves: [
      { name: 'Amaterasu Black Flames', type: 'Inextinguishable [E]', description: 'Ignites inextinguishable black flames that lock targets and erase spells.' },
      { name: 'Crow Clone Genjutsu', type: 'Illusion Blink [F]', description: 'Dissolves into a flock of crows, teleporting behind enemies with +40 Yata Ward.' },
      { name: 'Uchiha Awakening', type: 'Live Form Shift [T]', description: 'Shifts Akatsuki Cloak → Amber Mangekyo Susanoo → Edo Tensei Immortal.' },
      { name: 'Tsukuyomi & Yata Susanoo', type: 'Ocular Ult [Q]', description: 'Shatters minds in red-moon Tsukuyomi and sweeps Totsuka Spirit Blade!' },
    ],
    psychologicalProfile: {
      trait: 'Silent Protector in Shadow',
      boredomLoop: 'Bore the darkness of the Uchiha alone while mastering Mangekyo perfection.'
    },
    activeSkill: { name: 'Tsukuyomi & Susanoo', description: 'Unleashes Mangekyo genjutsu stun, Yata shield, and Totsuka slashes.', cooldown: 20, duration: 6, icon: 'Eye' },
    skins: [
      { id: 'skin_itachi_akatsuki', name: 'Akatsuki Red Cloud Cloak', rarity: 'Epic', primaryColor: '#09090b', camoPattern: 'itachi_akatsuki', visorColor: '#ef4444', capeColor: '#dc2626', auraColor: '#ef4444', multiplier: 'SHARINGAN MASTER', transformationLore: 'High-collar black Akatsuki coat adorned with crimson clouds and glowing Sharingan.', isLocked: false },
      { id: 'skin_itachi_susanoo', name: 'Amber Mangekyo Susanoo', rarity: 'Mythic', primaryColor: '#18181b', camoPattern: 'itachi_susanoo', visorColor: '#f97316', capeColor: '#ea580c', auraColor: '#fb923c', multiplier: 'TOTSUKA & YATA', transformationLore: 'Surrounded by blazing amber-orange Susanoo flame ribs and spirit shield.', isLocked: false },
      { id: 'skin_itachi_edo', name: 'Edo Tensei Reanimated', rarity: 'Mythic', primaryColor: '#450a0a', camoPattern: 'itachi_edo', visorColor: '#f43f5e', capeColor: '#7f1d1d', auraColor: '#a855f7', multiplier: 'IMMORTAL CHAKRA', transformationLore: 'Maroon Edo cloak with cracked immortal visage and limitless Mangekyo regeneration.', isLocked: false },
    ],
    selectedSkinId: 'skin_itachi_susanoo',
    unlocked: true,
  },
  {
    id: 'sasuke_uchiha',
    name: 'Sasuke Uchiha',
    callsign: 'SHADOW HOKAGE',
    faction: 'Konoha / Uchiha Clan',
    category: 'anime',
    quote: '"Watch carefully—this is the Six Paths Rinnegan. Indra’s Arrow!"',
    archetype: 'Rinnegan Swordsman / Lightning Master',
    health: 100,
    speed: 1.36,
    armorRating: 1.4,
    signatureMoves: [
      { name: 'Kirin & Kagutsuchi', type: 'Sky Storm [E]', description: 'Calls down sky lightning laced with black Blaze Release flames.' },
      { name: 'Amenotejikara Warp', type: 'Rinnegan Swap [F]', description: 'Instantaneous spatial warp forward with lightning Susanoo barrier.' },
      { name: 'Ocular Transformation', type: 'Live Form Shift [T]', description: 'Evolves Hebi/Taka Cloak → Eternal Mangekyo Susanoo → Six Paths Rinnegan!' },
      { name: 'Indra’s Arrow', type: 'Six Paths Ult [Q]', description: 'Fires the ultimate violet-gold Susanoo lightning arrow obliterating the arena.' },
    ],
    psychologicalProfile: {
      trait: 'Cold Vigilant Blade',
      boredomLoop: 'Walks the shadow horizon wielding Six Paths Rinnegan and Sword of Kusanagi.'
    },
    activeSkill: { name: 'Indra’s Arrow & Amenotejikara', description: 'Rinnegan spatial teleportation paired with cataclysmic lightning.', cooldown: 20, duration: 6, icon: 'Zap' },
    skins: [
      { id: 'skin_sasuke_taka', name: 'Hebi / Taka Cloak', rarity: 'Epic', primaryColor: '#e2e8f0', camoPattern: 'sasuke_taka', visorColor: '#ef4444', capeColor: '#581c87', auraColor: '#38bdf8', multiplier: 'CHIDORI BLITZ', transformationLore: 'Open-chest white Taka robe tied with purple shimenawa rope and Chidori sparks.', isLocked: false },
      { id: 'skin_sasuke_ems', name: 'Eternal Mangekyo Susanoo', rarity: 'Mythic', primaryColor: '#1e1b4b', camoPattern: 'sasuke_ems', visorColor: '#f43f5e', capeColor: '#6d28d9', auraColor: '#a855f7', multiplier: 'KAGUTSUCHI FLAME', transformationLore: 'Dark indigo Uchiha vestments framed by glowing violet Susanoo ribcage and halo.', isLocked: false },
      { id: 'skin_sasuke_rinnegan', name: 'Six Paths Rinnegan', rarity: 'Mythic', primaryColor: '#09090b', camoPattern: 'sasuke_rinnegan', visorColor: '#c084fc', capeColor: '#312e81', auraColor: '#c084fc', multiplier: 'TOMOE RINNEGAN', transformationLore: 'Wandering Shadow Hokage cloak, glowing violet Rinnegan eye, and Six Paths aura.', isLocked: false },
    ],
    selectedSkinId: 'skin_sasuke_rinnegan',
    unlocked: true,
  },
];

export const ARENA_MAPS: ArenaMap[] = [
  {
    id: 'city_z_wasteland',
    name: 'City Z - Ground Zero',
    codename: 'SECTOR-Z',
    location: 'City Z Ruins (Meteor Impact Zone)',
    description: 'Saitama\'s decimated hometown. Features a central meteor crater, collapsed elevated highway overpass, concrete roadblocks, and ruined apartment towers.',
    theme: 'city_z',
    skyColor: '#0e1726',
    groundColor: '#44484f',
    fogColor: '#222b3a',
    fogDensity: 0.0085,
    lightingPreset: {
      sunColor: '#ffcf96',
      sunIntensity: 2.8,
      sunPosition: [26, 12, -16],
      hemiSky: '#64748b',
      hemiGround: '#1a1d24',
    },
    mapSize: { x: 90, z: 90 },
    maxPlayers: 8,
    powerUpSpawns: [
      { type: 'quad_damage', position: [0, 1.2, 0], respawnDelay: 35 },
      { type: 'health', position: [-25, 1.2, -22], respawnDelay: 15 },
      { type: 'health', position: [25, 1.2, 22], respawnDelay: 15 },
      { type: 'armor', position: [0, 5.2, -18], respawnDelay: 20 },
      { type: 'speed', position: [-22, 1.2, 24], respawnDelay: 25 },
      { type: 'ammo', position: [24, 1.2, -24], respawnDelay: 12 },
    ]
  },
  {
    id: 'tournament_arena',
    name: 'World Martial Arts Stage',
    codename: 'TENKAICHI',
    location: 'Papaya Island Arena',
    description: 'The legendary stone martial arts arena from Dragon Ball. Features a central square fighting ring, 4 stone corner dragons, red viewing pagodas, and Torii gates.',
    theme: 'tournament_arena',
    skyColor: '#0284c7',
    groundColor: '#d6d3d1',
    fogColor: '#38bdf8',
    fogDensity: 0.007,
    lightingPreset: {
      sunColor: '#fef08a',
      sunIntensity: 2.6,
      sunPosition: [35, 60, 25],
      hemiSky: '#67e8f9',
      hemiGround: '#78716c',
    },
    mapSize: { x: 85, z: 85 },
    maxPlayers: 8,
    powerUpSpawns: [
      { type: 'quad_damage', position: [0, 2.2, 0], respawnDelay: 35 },
      { type: 'armor', position: [-24, 1.2, 0], respawnDelay: 20 },
      { type: 'armor', position: [24, 1.2, 0], respawnDelay: 20 },
      { type: 'speed', position: [0, 1.2, -24], respawnDelay: 25 },
      { type: 'health', position: [-18, 1.2, -18], respawnDelay: 15 },
      { type: 'ammo', position: [18, 1.2, 18], respawnDelay: 12 },
    ]
  },
  {
    id: 'planet_namek',
    name: 'Planet Namek Wasteland',
    codename: 'NAMEK-PRIME',
    location: 'Guru\'s Sacred Highlands',
    description: 'Alien battlefield featuring turquoise grass, emerald green skies, towering rock plateaus, Namekian dome houses, and glowing geothermal energy pools.',
    theme: 'planet_namek',
    skyColor: '#064e3b',
    groundColor: '#0f766e',
    fogColor: '#065f46',
    fogDensity: 0.011,
    lightingPreset: {
      sunColor: '#6ee7b7',
      sunIntensity: 2.0,
      sunPosition: [-25, 50, -20],
      hemiSky: '#34d399',
      hemiGround: '#042f2e',
    },
    mapSize: { x: 85, z: 85 },
    maxPlayers: 8,
    powerUpSpawns: [
      { type: 'quad_damage', position: [0, 1.2, 0], respawnDelay: 35 },
      { type: 'speed', position: [22, 1.2, -22], respawnDelay: 25 },
      { type: 'health', position: [-22, 1.2, 22], respawnDelay: 15 },
      { type: 'armor', position: [-22, 4.5, -22], respawnDelay: 20 },
      { type: 'ammo', position: [22, 1.2, 22], respawnDelay: 12 },
    ]
  },
  {
    id: 'neon_complex',
    name: 'Neon Complex',
    codename: 'SECTOR-09',
    location: 'Neo Tokyo Underground Docks',
    description: 'Multi-level cybernetic facility featuring industrial catwalks, shipping containers, and intense high-tech vertical vantage points.',
    theme: 'cyber_neon',
    skyColor: '#090d16',
    groundColor: '#111827',
    fogColor: '#0a0e1a',
    fogDensity: 0.012,
    lightingPreset: {
      sunColor: '#38bdf8',
      sunIntensity: 1.6,
      sunPosition: [30, 45, 20],
      hemiSky: '#38bdf8',
      hemiGround: '#1e1b4b',
    },
    mapSize: { x: 80, z: 80 },
    maxPlayers: 8,
    powerUpSpawns: [
      { type: 'quad_damage', position: [0, 1.2, 0], respawnDelay: 35 },
      { type: 'health', position: [-22, 1.2, -18], respawnDelay: 15 },
      { type: 'health', position: [22, 1.2, 18], respawnDelay: 15 },
      { type: 'armor', position: [18, 1.2, -20], respawnDelay: 20 },
      { type: 'speed', position: [-18, 1.2, 22], respawnDelay: 25 },
      { type: 'ammo', position: [0, 4.2, -26], respawnDelay: 12 },
    ]
  },
  {
    id: 'dust_district',
    name: 'Dust District',
    codename: 'OUTPOST OMEGA',
    location: 'Kharif Desert Outpost',
    description: 'Sun-drenched desert military fortification with fortified adobe bunkers, sandbag trenches, sniper bell tower, and open kill zones.',
    theme: 'dust_district',
    skyColor: '#382b1d',
    groundColor: '#78593a',
    fogColor: '#453524',
    fogDensity: 0.009,
    lightingPreset: {
      sunColor: '#fed7aa',
      sunIntensity: 2.4,
      sunPosition: [40, 50, 30],
      hemiSky: '#fdba74',
      hemiGround: '#713f12',
    },
    mapSize: { x: 85, z: 85 },
    maxPlayers: 8,
    powerUpSpawns: [
      { type: 'quad_damage', position: [0, 1.2, 0], respawnDelay: 35 },
      { type: 'armor', position: [-25, 1.2, 0], respawnDelay: 20 },
      { type: 'armor', position: [25, 1.2, 0], respawnDelay: 20 },
      { type: 'speed', position: [0, 1.2, -25], respawnDelay: 25 },
      { type: 'health', position: [-18, 1.2, -18], respawnDelay: 15 },
      { type: 'ammo', position: [18, 1.2, 18], respawnDelay: 12 },
    ]
  }
];

export interface CameraViewpointPreset {
  id: string;
  label: string;
  cameraZoom: number;
  cameraFov: number;
  cameraHeight: number;
  cameraShoulder: number;
}

export const CAMERA_VIEWPOINT_PRESETS: CameraViewpointPreset[] = [
  { id: 'cinematic', label: 'Cinematic', cameraZoom: 1.0, cameraFov: 54, cameraHeight: 0.0, cameraShoulder: 0.0 },
  { id: 'closeup', label: 'Close-Up', cameraZoom: 0.72, cameraFov: 48, cameraHeight: 0.22, cameraShoulder: 0.0 },
  { id: 'shoulder', label: 'Over-Shoulder', cameraZoom: 0.82, cameraFov: 52, cameraHeight: 0.34, cameraShoulder: 0.46 },
  { id: 'wide', label: 'Wide Tactical', cameraZoom: 1.55, cameraFov: 68, cameraHeight: 0.25, cameraShoulder: 0.0 },
];

export const DEFAULT_SETTINGS: GameSettings = {
  touchSensitivity: 1.0,
  invertY: false,
  autoAds: false,
  vibration: true,
  masterVolume: 0.85,
  sfxVolume: 0.9,
  musicVolume: 0.45,
  announcer: true,
  fpsLimit: 60,
  graphicsQuality: 'high',
  shadows: true,
  bloom: true,
  crosshairColor: '#38bdf8',
  crosshairDynamic: true,
  damageNumbers: true,
  hitmarkerSound: true,
  cameraZoom: 1.0,
  cameraFov: 54,
  cameraHeight: 0.0,
  cameraShoulder: 0.0,
  hudLayout: {
    minimap: { x: 10, y: 15, scale: 1.0 },
    powerUp: { x: 14, y: 54, scale: 1.0 },
    joystick: { x: 12, y: 80, scale: 1.0 },
    skillBar: { x: 64, y: 84, scale: 1.0 },
    actionWheel: { x: 87, y: 78, scale: 1.0 },
  },
};

export const BOT_NAMES = [
  'Ghost_07', 'Viper_K9', 'ShadowReaper', 'Apex_Sniper',
  'Titan_X', 'FrostByte', 'Zero_Merc', 'Delta_Echo',
  'Kodiak_Ops', 'NightStalker', 'Cobra_Command', 'Spectre_99'
];

export const SAITAMA_PERKS: TacticalPerk[] = [
  {
    id: 'perk_saitama_sale_sprint',
    name: 'Saturday Sale Sprint',
    category: 'mobility',
    bonusLabel: '+20% SPRINT',
    description: 'Urgent supermarket discount dash speed across open ruins and rooftops.'
  },
  {
    id: 'perk_saitama_limiter',
    name: 'Broken Limiter Aura',
    category: 'offense',
    bonusLabel: '+25% PUNCH FORCE',
    description: 'Amplifies shockwave radius and instant kinetic knockback on every strike.'
  },
  {
    id: 'perk_saitama_apathy',
    name: 'Unbothered Guard',
    category: 'defense',
    bonusLabel: '+30 ARMOR CAP',
    description: 'Shrugs off incoming ballistic fire and explosions with casual apathy.'
  },
  {
    id: 'perk_saitama_cabbage',
    name: 'Discount Coupon Charm',
    category: 'utility',
    bonusLabel: '+25% MATCH XP',
    description: 'Protects Saturday grocery budget while boosting post-match credit rewards.'
  }
];

export const GOKU_PERKS: TacticalPerk[] = [
  {
    id: 'perk_goku_senzu',
    name: 'Senzu Bean Pouch',
    category: 'defense',
    bonusLabel: '+30 HP REGEN',
    description: 'Emergency Korin Tower Senzu reserves that rapidly restore vitality.'
  },
  {
    id: 'perk_goku_zenkai',
    name: 'Saiyan Zenkai Boost',
    category: 'offense',
    bonusLabel: '+20% KI DMG',
    description: 'Surges combat power higher whenever health drops during battle.'
  },
  {
    id: 'perk_goku_weighted_gi',
    name: 'Weighted Training Gi',
    category: 'mobility',
    bonusLabel: '+18% DASH',
    description: 'Mastered King Kai gravity training for faster Instant Transmission recovery.'
  },
  {
    id: 'perk_goku_god_ki',
    name: 'God Ki Concentration',
    category: 'utility',
    bonusLabel: '+30% KI CHARGE',
    description: 'Accelerates Ki energy charging speed for Kamehameha and Spirit Bomb.'
  }
];

export const TACTICAL_PERKS: TacticalPerk[] = [
  {
    id: 'perk_tac_flak',
    name: 'Ceramic Flak Plate',
    category: 'defense',
    bonusLabel: '+25 ARMOR',
    description: 'Reinforced composite armor vest reducing explosive and rifle damage.'
  },
  {
    id: 'perk_tac_lightweight',
    name: 'Lightweight Rig',
    category: 'mobility',
    bonusLabel: '+15% SPEED',
    description: 'Streamlined tactical carrier increasing sprint and ADS strafe speed.'
  },
  {
    id: 'perk_tac_sleight',
    name: 'Sleight of Hand',
    category: 'offense',
    bonusLabel: '+35% RELOAD',
    description: 'Rapid magazine swap technique keeping sustained pressure on hostiles.'
  },
  {
    id: 'perk_tac_scavenger',
    name: 'Ammo Scavenger',
    category: 'utility',
    bonusLabel: '+50% RESERVE',
    description: 'Replenishes tactical ammunition and energy cells from fallen targets.'
  }
];

export const SUPERMAN_PERKS: TacticalPerk[] = [
  {
    id: 'perk_superman_yellow_sun',
    name: 'Yellow Sun Absorption',
    category: 'utility',
    bonusLabel: '+35% SOLAR CHARGE',
    description: 'Accelerates Solar Energy buildup for rapid Thermal Overload Laser Eyes activation.'
  },
  {
    id: 'perk_superman_poise',
    name: 'Man of Steel Poise',
    category: 'defense',
    bonusLabel: '+40% STAGGER RES',
    description: 'Reinforces Kryptonian Stagger Resistance so standard enemy gunfire bounces off harmlessly.'
  },
  {
    id: 'perk_superman_sonic',
    name: 'Supersonic Draft',
    category: 'mobility',
    bonusLabel: '+22% FLIGHT SPD',
    description: 'Boosts omni-directional flight acceleration and Super-Speed Dash burst range.'
  },
  {
    id: 'perk_superman_thermal',
    name: 'Solar Flare Intensity',
    category: 'offense',
    bonusLabel: '+25% LASER MELT',
    description: 'Increases Thermal Overload beam width, scorched earth blast, and armor-strip speed.'
  }
];

export const MAXWELL_PERKS: TacticalPerk[] = [
  {
    id: 'perk_maxwell_mana',
    name: 'Aether Reservoir',
    category: 'utility',
    bonusLabel: '+35% MANA FLOW',
    description: 'Boosts passive mana channeling and accelerates Arcane Nova & Chronos Stasis readiness.'
  },
  {
    id: 'perk_maxwell_ward',
    name: 'Runic Ward Matrix',
    category: 'defense',
    bonusLabel: '+45 ARCANE SHIELD',
    description: 'Reinforces Aether Barrier strength and hardens Maxwell’s astral coat against elemental hexes.'
  },
  {
    id: 'perk_maxwell_blink',
    name: 'Astral Step',
    category: 'mobility',
    bonusLabel: '+20% WARP SPEED',
    description: 'Extends Phase Blink spatial reach and grants brisk levitation agility across rooftops.'
  },
  {
    id: 'perk_maxwell_amplification',
    name: 'Sigil Amplification',
    category: 'offense',
    bonusLabel: '+25% SPELL DMG',
    description: 'Supercharges Arcane Bolts, Aether Rune Rays, and Void Nova detonations with golden sigils.'
  }
];

export const KING_PERKS: TacticalPerk[] = [
  {
    id: 'perk_king_engine',
    name: 'Deafening Heartbeat',
    category: 'offense',
    bonusLabel: '+30% STUN RADIUS',
    description: 'Extends King Engine acoustic intimidation range and boosts Hellfire Cannon shockwave force.'
  },
  {
    id: 'perk_king_bluff',
    name: 'Unflinching Poker Face',
    category: 'defense',
    bonusLabel: '+35 ARMOR',
    description: 'Enemies hesitate before attacking King, effectively reducing incoming projectile pressure.'
  },
  {
    id: 'perk_king_escape',
    name: 'Tactical Retreat Dash',
    category: 'mobility',
    bonusLabel: '+20% SIDESTEP',
    description: 'Enables swift repositioning around ruins while maintaining an undefeated reputation.'
  },
  {
    id: 'perk_king_luck',
    name: 'S-Class Absurd Luck',
    category: 'utility',
    bonusLabel: '+25% METER GAIN',
    description: 'Accelerates King Engine dread buildup so Hellfire Wave-Motion Cannon charges faster.'
  }
];

export const FLASH_PERKS: TacticalPerk[] = [
  {
    id: 'perk_flash_metabolism',
    name: 'Speed Force Conduit',
    category: 'mobility',
    bonusLabel: '+20% BASE SPD',
    description: 'Amplifies Barry’s baseline sprint and Speed Force Phase burst velocity.'
  },
  {
    id: 'perk_flash_vortex',
    name: 'Cyclone Vacuum',
    category: 'offense',
    bonusLabel: '+25% BOLT DMG',
    description: 'Supercharges Speed Lightning throws and Cyclone Vortex electrocution damage.'
  },
  {
    id: 'perk_flash_heal',
    name: 'Accelerated Healing',
    category: 'defense',
    bonusLabel: '+30 HP REGEN',
    description: 'Hyper-fast Speed Force cellular metabolism restores vitality rapidly.'
  },
  {
    id: 'perk_flash_inertia',
    name: 'Infinite Momentum',
    category: 'utility',
    bonusLabel: '+30% CHARGE',
    description: 'Moving at high speed refills Flash’s Speed Force gauge almost instantaneously.'
  }
];

export const LANTERN_PERKS: TacticalPerk[] = [
  {
    id: 'perk_lantern_battery',
    name: 'Central Power Battery',
    category: 'utility',
    bonusLabel: '+35% RING CHARGE',
    description: 'Synchronizes Hal’s ring with Oa for rapid willpower recharge in prolonged fights.'
  },
  {
    id: 'perk_lantern_construct',
    name: 'Heavy Hard-Light Forge',
    category: 'offense',
    bonusLabel: '+25% CONSTRUCT',
    description: 'Increases Warhammer and Meteor Construct impact radius and armor shatter.'
  },
  {
    id: 'perk_lantern_shield',
    name: 'Indomitable Ward',
    category: 'defense',
    bonusLabel: '+45 RING SHIELD',
    description: 'Reinforces Emerald Ward Dome capacity and deflects witch elemental hexes.'
  },
  {
    id: 'perk_lantern_flight',
    name: 'Sector Wingman',
    category: 'mobility',
    bonusLabel: '+22% FLIGHT SPD',
    description: 'Boosts ring-propelled atmospheric flight thrust and evasive strafing.'
  }
];

export const SHAZAM_PERKS: TacticalPerk[] = [
  {
    id: 'perk_shazam_zeus',
    name: 'Power of Zeus',
    category: 'offense',
    bonusLabel: '+30% BOLT DMG',
    description: 'Intensifies Living Lightning arcs and vertical SHAZAM! sky thunderbolts.'
  },
  {
    id: 'perk_shazam_atlas',
    name: 'Stamina of Atlas',
    category: 'defense',
    bonusLabel: '+40 MAGIC WARD',
    description: 'Fortifies Shazam’s crimson-gold armor against both physical strikes and witch spells.'
  },
  {
    id: 'perk_shazam_mercury',
    name: 'Speed of Mercury',
    category: 'mobility',
    bonusLabel: '+24% FLIGHT SPD',
    description: 'Grants blistering supersonic flight curves and rapid aerial repositioning.'
  },
  {
    id: 'perk_shazam_solomon',
    name: 'Wisdom of Solomon',
    category: 'utility',
    bonusLabel: '+30% MANA FLOW',
    description: 'Optimizes mystical energy efficiency for more frequent SHAZAM! transformations.'
  }
];

export const THOR_PERKS: TacticalPerk[] = [
  {
    id: 'perk_thor_odinforce',
    name: 'All-Father Odinforce',
    category: 'utility',
    bonusLabel: '+35% CHARGE',
    description: 'Channels royal Asgardian energy to rapidly awaken Bifrost strikes.'
  },
  {
    id: 'perk_thor_uru',
    name: 'Forged in Nidavellir',
    category: 'offense',
    bonusLabel: '+30% HAMMER DMG',
    description: 'Empowers Mjolnir Spin Toss and Thunder Slam shockwaves across 18m.'
  },
  {
    id: 'perk_thor_asgard',
    name: 'Asgardian Vitality',
    category: 'defense',
    bonusLabel: '+45 ARMOR CAP',
    description: 'Dense Asgardian armor plating shrugs off sustained fire and elemental curses.'
  },
  {
    id: 'perk_thor_bifrost_wings',
    name: 'Stormcaller Flight',
    category: 'mobility',
    bonusLabel: '+22% FLIGHT SPD',
    description: 'Spins Mjolnir at hyper-velocity for swift aerial dominance across any arena.'
  }
];

export const SILVESTER_PERKS: TacticalPerk[] = [
  {
    id: 'perk_silvester_omega',
    name: '15-Power Sovereign Core',
    category: 'offense',
    bonusLabel: '+45% ALL DMG',
    description: 'Amplifies all 15 Silvester powers, Cosmic Gauntlet bolts, and Omega Apocalypse shockwaves.'
  },
  {
    id: 'perk_silvester_aegis',
    name: 'Celestial Invulnerability',
    category: 'defense',
    bonusLabel: '+65 SHIELD REGEN',
    description: 'Absorbs incoming elemental magic and grants massive Astral Mirror Cloak protection.'
  },
  {
    id: 'perk_silvester_tachyon',
    name: 'Tachyon Hyper-Glide',
    category: 'mobility',
    bonusLabel: '+35% FLIGHT/SPD',
    description: 'Pushes Silvester’s sprint, Omni-Flight, and Tachyon Flash Step to apex velocity.'
  },
  {
    id: 'perk_silvester_eternal',
    name: 'Infinite Sovereign Reservoir',
    category: 'utility',
    bonusLabel: '+50% ENERGY FLOW',
    description: 'Ultra-fast Omega energy regeneration enabling non-stop chaining across all 15 powers.'
  }
];

export const DRE_PERKS: TacticalPerk[] = [
  {
    id: 'perk_dre_808',
    name: '808 Sub-Harmonic',
    category: 'offense',
    bonusLabel: '+30% BASS DMG',
    description: 'Boosts Bass Drop knockback radius and Omega Mixtape seismic impact.'
  },
  {
    id: 'perk_dre_amp',
    name: 'Studio Limiter',
    category: 'defense',
    bonusLabel: '+45 AMP ARMOR',
    description: 'Absorbs incoming explosions and reinforces Dre’s sonic shield.'
  },
  {
    id: 'perk_dre_tempo',
    name: 'Double-Time Tempo',
    category: 'mobility',
    bonusLabel: '+22% SUB-STEP',
    description: 'Accelerates sprint speed and Sub-Step dash burst distance.'
  },
  {
    id: 'perk_dre_master',
    name: 'Platinum Mastering',
    category: 'utility',
    bonusLabel: '+35% METER FLOW',
    description: 'Builds 808 Overdrive meter faster on every hit.'
  }
];

export const TRUTH_PERKS: TacticalPerk[] = [
  {
    id: 'perk_truth_clarity',
    name: 'Absolute Clarity',
    category: 'offense',
    bonusLabel: '+35% RAY DMG',
    description: 'Pierces hostile shields and supercharges All-Seeing Eye Rays.'
  },
  {
    id: 'perk_truth_veil',
    name: 'Sanctuary of Truth',
    category: 'defense',
    bonusLabel: '+40% WARD',
    description: 'Neutralizes incoming witch illusions and elemental curses.'
  },
  {
    id: 'perk_truth_levitate',
    name: 'Mystic Levitation',
    category: 'mobility',
    bonusLabel: '+24% FLIGHT SPD',
    description: 'Increases airborne glide speed and Veil Shift blink reach.'
  },
  {
    id: 'perk_truth_seer',
    name: 'Omniscient Focus',
    category: 'utility',
    bonusLabel: '+35% VERITAS',
    description: 'Rapidly restores Veritas energy after True Sight reveals.'
  }
];

export const HEILIEA_PERKS: TacticalPerk[] = [
  {
    id: 'perk_heiliea_seraph',
    name: 'Seraphic Grace',
    category: 'defense',
    bonusLabel: '+45% HEAL',
    description: 'Empowers Seraph Heal restoration and purifies all witch burns.'
  },
  {
    id: 'perk_heiliea_star',
    name: 'Astra Spearhead',
    category: 'offense',
    bonusLabel: '+30% LANCE DMG',
    description: 'Sharpens Starlight Lances and widens Starfall meteor blasts.'
  },
  {
    id: 'perk_heiliea_wings',
    name: 'Valkyrie Pinions',
    category: 'mobility',
    bonusLabel: '+26% WING FLY',
    description: 'Soars swiftly across any arena with agile wing maneuvers.'
  },
  {
    id: 'perk_heiliea_halo',
    name: 'Celestial Crown',
    category: 'utility',
    bonusLabel: '+35% STARLIGHT',
    description: 'Replenishes Starlight gauge continuously while airborne.'
  }
];

export const BABY_PERKS: TacticalPerk[] = [
  {
    id: 'perk_baby_cry',
    name: 'Supersonic Wail',
    category: 'offense',
    bonusLabel: '+35% TANTRUM',
    description: 'Expands Tantrum Stomp and Mega Crying Wave shockwaves.'
  },
  {
    id: 'perk_baby_nap',
    name: 'Cozy Blankie Armor',
    category: 'defense',
    bonusLabel: '+50 NAP SHIELD',
    description: 'Tiny hitbox + reinforced Nap Shield protection.'
  },
  {
    id: 'perk_baby_crawl',
    name: 'Turbo Crawl',
    category: 'mobility',
    bonusLabel: '+30% ZOOM SPD',
    description: 'Dashes around ruins faster than enemies can aim.'
  },
  {
    id: 'perk_baby_formula',
    name: 'Cosmic Formula',
    category: 'utility',
    bonusLabel: '+40% ENERGY',
    description: 'Instant Pacifier Power recharge between tantrums.'
  }
];

export const ZENITSU_PERKS: TacticalPerk[] = [
  {
    id: 'perk_zenitsu_first_form',
    name: 'First Form Mastery',
    category: 'offense',
    bonusLabel: '+35% FLASH DMG',
    description: 'Supercharges Thunderclap & Flash dash cleave and katana arc speed.'
  },
  {
    id: 'perk_zenitsu_godspeed',
    name: 'Godspeed Reflex',
    category: 'mobility',
    bonusLabel: '+28% DASH SPD',
    description: 'Accelerates footwork faster than sound across arena ruins.'
  },
  {
    id: 'perk_zenitsu_trance',
    name: 'Sleeping Trance',
    category: 'defense',
    bonusLabel: '+25% EVASION',
    description: 'Sharpens unconscious parry instincts during Sixfold Surges.'
  },
  {
    id: 'perk_zenitsu_focus',
    name: 'Thunder Focus',
    category: 'utility',
    bonusLabel: '+35% BREATHING',
    description: 'Rapidly restores Breathing gauge for non-stop thunder strikes.'
  }
];

export const TANJIRO_PERKS: TacticalPerk[] = [
  {
    id: 'perk_tanjiro_hinokami',
    name: 'Hinokami Kagura',
    category: 'offense',
    bonusLabel: '+35% SUN DMG',
    description: 'Amplifies Sun Breathing crimson rings and dragon strikes.'
  },
  {
    id: 'perk_tanjiro_water_flux',
    name: 'Constant Flux Flow',
    category: 'defense',
    bonusLabel: '+30% WATER WARD',
    description: 'Extinguishes witch burns and hardens Water Tenth Form armor.'
  },
  {
    id: 'perk_tanjiro_mark',
    name: 'Demon Slayer Mark',
    category: 'mobility',
    bonusLabel: '+24% AGILITY',
    description: 'Accelerates breathing lunges and dodges across open ground.'
  },
  {
    id: 'perk_tanjiro_recovery',
    name: 'Total Concentration',
    category: 'utility',
    bonusLabel: '+35% STAMINA',
    description: 'Sustains Total Concentration Breathing energy all match long.'
  }
];

export const MUZAN_PERKS: TacticalPerk[] = [
  {
    id: 'perk_muzan_biokinesis',
    name: 'Spine Whip Frenzy',
    category: 'offense',
    bonusLabel: '+35% WHIP DMG',
    description: 'Sharpens Biokinesis tentacles and widens Black Blood Shockwave.'
  },
  {
    id: 'perk_muzan_regen',
    name: 'Immortal Cellular Regen',
    category: 'defense',
    bonusLabel: '+30 HP LIFESTEAL',
    description: 'Accelerates Demon King passive healing and blood armor wards.'
  },
  {
    id: 'perk_muzan_mist',
    name: 'Blood Mist Step',
    category: 'mobility',
    bonusLabel: '+24% WARP SPD',
    description: 'Glides through gunfire and magic volleys inside crimson mist.'
  },
  {
    id: 'perk_muzan_king',
    name: 'Progenitor Cell Pool',
    category: 'utility',
    bonusLabel: '+35% BLOOD PWR',
    description: 'Continuously refills Demon Blood gauge for relentless pressure.'
  }
];

export function makeHeroPerks(
  prefix: string,
  offense: [string, string, string],
  defense: [string, string, string],
  mobility: [string, string, string],
  utility: [string, string, string]
): TacticalPerk[] {
  return [
    { id: `perk_${prefix}_off`, name: offense[0], category: 'offense', bonusLabel: offense[1], description: offense[2] },
    { id: `perk_${prefix}_def`, name: defense[0], category: 'defense', bonusLabel: defense[1], description: defense[2] },
    { id: `perk_${prefix}_mob`, name: mobility[0], category: 'mobility', bonusLabel: mobility[1], description: mobility[2] },
    { id: `perk_${prefix}_utl`, name: utility[0], category: 'utility', bonusLabel: utility[1], description: utility[2] },
  ];
}

export const HERO_EXTRA_PERKS: Record<string, TacticalPerk[]> = {
  iron_man: makeHeroPerks('ironman', ['Arc Overdrive', '+35% UNIBEAM DMG', 'Amplifies Repulsor & Chest Unibeam energy output.'], ['Bleeding Edge Plating', '+60 NANO SHIELD', 'Strengthens Nano Shield absorption and thermal resistance.'], ['Mk-85 Jet Thrusters', '+25% FLIGHT SPD', 'Boosts supersonic aerial banking speed and missile lock.'], ['Friday Tactical AI', '+35% REACTOR', 'Recharges Arc Reactor energy between Unibeam salvos.']),
  spider_man: makeHeroPerks('spiderman', ['Impact Webbing', '+30% WEB DMG', 'Increases Iron Spider gauntlet & Symbiote strike damage.'], ['Spider-Sense Reflex', '+30% DODGE', 'Heightens threat perception against ambush spells.'], ['Web-Line Acrobatics', '+32% SWING SPD', 'Extends Web Zip range and mid-air vault velocity.'], ['Stark Web Fluid', '+35% FLUID', 'Rapidly replenishes Web Bomb & Overload reserves.']),
  doctor_strange: makeHeroPerks('strange', ['Vishanti Mastery', '+35% SPELL DMG', 'Sharpens Eldritch Mandala & Crimson Whip potency.'], ['Cloak of Levitation', '+45 MYSTIC WARD', 'Automatically deflects witch curses inside Mirror Seal.'], ['Sling Ring Mastery', '+30% PORTAL RNG', 'Extends Sling Ring blink distance and flight hover speed.'], ['Eye of Agamotto', '+40% MANA', 'Accelerates Time Stone energy recharge.']),
  scarlet_witch: makeHeroPerks('wanda', ['Chthon Chaos Hex', '+40% HEX DMG', 'Supercharges Darkhold Reality Rift & Chaos Bolts.'], ['Nexus Barrier', '+50 CHAOS WARD', 'Absorbs incoming fire & water magic cleanly.'], ['Scarlet Levitation', '+26% GLIDE SPD', 'Increases aerial telekinetic drift velocity.'], ['Probability Manipulation', '+35% CHAOS PWR', 'Reduces Reality Warp downtime.']),
  batman: makeHeroPerks('batman', ['Hellbat Strike', '+35% GADGET DMG', 'Overclocks Shock Gauntlet & Batarang kinetic impact.'], ['Kevlar Batsuit', '+55 ARMOR', 'Mitigates ballistic and magic splash damage.'], ['Grapnel Boost', '+28% ZIP SPD', 'Improves Grapnel Blitz pull speed and glide recovery.'], ['Utility Belt Sync', '+35% TECH', 'Rapidly recharges Cryo Smoke Bombs.']),
  wonder_woman: makeHeroPerks('ww', ['Godkiller Edge', '+35% BLADE DMG', 'Boosts sword cleave & War Goddess shockwave output.'], ['Aegis & Bracelets', '+55 DEFLECT', 'Wipes all hostile spells on Bracelet Clash.'], ['Eagle Wings', '+28% FLIGHT SPD', 'Accelerates Golden Eagle aerial diving speed.'], ['Olympian Blessing', '+35% FAVOR', 'Restores divine energy & +35 HP on Ult.']),
  aquaman: makeHeroPerks('aquaman', ['Atlan Trident Surge', '+35% HYDRO DMG', 'Empowers Tidal Wave & Kraken Maelstrom force.'], ['Atlantean Scales', '+50 OCEAN WARD', 'Extinguishes witch burns and hardens scale armor.'], ['Current Rider', '+26% SURGE SPD', 'Boosts Hydro Surge rush speed across the arena.'], ['Seven Seas Command', '+35% TIDE PWR', 'Sustains Atlantean hydro energy continuously.']),
  rimuru_tempest: makeHeroPerks('rimuru', ['Void Azathoth', '+40% NIHILITY DMG', 'Amplifies Megiddo rays & True Dragon Void slashes.'], ['Gluttonous Beelzebuth', '+40 HP DEVOUR', 'Converts enemy spells directly into health & armor.'], ['Black Lightning Step', '+30% WARP SPD', 'Accelerates Veldora Storm dash & True Dragon flight.'], ['Ultimate Skill: Ciel', '+45% ENERGY', 'Ciel optimizes parallel calculation recharge.']),
  sung_jinwoo: makeHeroPerks('jinwoo', ['Monarch Lethality', '+40% DAGGER DMG', 'Boosts Kasaka & Kamish critical backstab damage.'], ['Shadow Legion Guard', '+50 SHADOW ARMOR', 'Igris & Bellion intercept lethal blows.'], ['Shadow Exchange', '+34% BLINK SPD', 'Enhances Assassin sprint & Shadow Exchange distance.'], ['Sovereign Mana Heart', '+40% MANA', 'Fuel for continuous Ruler’s Authority & Arise.']),
  naruto_uzumaki: makeHeroPerks('naruto', ['Baryon Rasengan', '+40% CHAKRA DMG', 'Boosts Rasenshuriken & Tailed Beast Bomb blast radius.'], ['Kurama Cloak Guard', '+55 BIJUU WARD', 'Protects against explosions and witch elemental burns.'], ['Body Flicker Shunshin', '+32% BLITZ SPD', 'High-speed Shadow Clone rush across open ground.'], ['Sage Chakra Pool', '+45% CHAKRA', 'Endless Six Paths & Kurama chakra flow.']),
  monkey_d_luffy: makeHeroPerks('luffy', ['Conqueror Coating', '+40% HAKI DMG', 'Powers up Red Roc & Gear 5 Bajrang Gun impacts.'], ['Gum-Gum Elasticity', '+50 RUBBER DEF', 'Natural blunt and kinetic shock resistance.'], ['Gear 2 Steam Jets', '+32% JET SPD', 'Blinding Jet Culverin dashes across the map.'], ['Drums of Liberation', '+40% STAMINA', 'Sustains Gear 5 Awakening heartbeats longer.']),
  satoru_gojo: makeHeroPerks('gojo', ['Hollow Purple 200%', '+45% LIMITLESS', 'Maximizes Lapse: Blue, Red & Purple output.'], ['Neutral Infinity', '+65 BARRIER', 'Infinite spatial division wipes incoming projectiles.'], ['Spatial Teleport', '+34% BLINK SPD', 'Instant warp repositioning mid-flight.'], ['Six Eyes Efficiency', '+50% CURSED EN', 'Near-zero cursed energy expenditure.']),
  yuji_itadori: makeHeroPerks('itadori', ['Black Flash Resonance', '+42% CRIT DMG', 'Raises Black Flash & Soul Dismantle impact.'], ['Blood Manipulation Guard', '+45 BLOOD DEF', 'Hardens crimson blood armor & heals on Shrine Ult.'], ['Superhuman Sprint', '+30% RUSH SPD', 'Explosive Manji Cursed Step closure speed.'], ['Cursed Vessel Zone', '+38% ENERGY', 'Sustains rapid Divergent Fist & Black Flash chains.']),
  garou_opm: makeHeroPerks('garou', ['Cosmic Fission Fist', '+42% MARTIAL DMG', 'Ignores armor with Water Stream & Nuclear Fission.'], ['Monster Exoskeleton', '+55 SHELL DEF', 'Gargoyle & Cosmic plating resists heavy fire.'], ['Godspeed Martial Flow', '+35% FLOW SPD', '1.40x adaptive footwork & Whirlwind dashes.'], ['Limiter Breaker', '+42% EVOLUTION', 'Accelerates Monster Evolution & Gamma Ray bursts.']),
  anos_voldigoad: makeHeroPerks('anos', ['Egil Grone Angdroa', '+45% DESTRUCTION', 'Maximizes Jio Graze & Venuzdonoa reason erasure.'], ['Demon King Heart', '+60 IMMORTAL WARD', 'Ignores enemy spells inside Chaotic Eyes glaze.'], ['Spatial Tyranny Flight', '+32% FLIGHT SPD', 'Effortless sovereign flight and Venuzdonoa blink.'], ['Abyssal Magic Source', '+50% MANA', 'Immense demonic source regeneration.']),
  itachi_uchiha: makeHeroPerks('itachi', ['Amaterasu Burn', '+40% OCULAR DMG', 'Supercharges Totsuka Blade & Black Flame burns.'], ['Yata Mirror Aegis', '+55 SUSANOO DEF', 'Deflects elemental magic while inside Crow Genjutsu.'], ['Crow Clone Blink', '+30% SHUNSHIN', 'Smooth Akatsuki & Susanoo evasion jumps.'], ['Mangekyo Reserves', '+40% CHAKRA', 'Edo Tensei & Sharingan chakra efficiency.']),
  sasuke_uchiha: makeHeroPerks('sasuke', ['Indra Lightning', '+42% CHIDORI DMG', 'Boosts Kirin sky bolts & Indra’s Arrow impact.'], ['Eternal Susanoo Armor', '+55 SUSANOO DEF', 'Violet ribcage absorbs explosions & witch hexes.'], ['Amenotejikara Warp', '+34% WARP SPD', 'Instant Rinnegan spatial swap jumps.'], ['Six Paths Yin Chakra', '+42% CHAKRA', 'Rapidly recharges Susanoo & Kagutsuchi arts.']),
};

export function getPerksForOperator(operator: OperatorData): TacticalPerk[] {
  if (operator.id === 'saitama') return SAITAMA_PERKS;
  if (operator.id === 'son_goku') return GOKU_PERKS;
  if (operator.id === 'superman') return SUPERMAN_PERKS;
  if (operator.id === 'silvester_jais') return SILVESTER_PERKS;
  if (operator.id === 'dre_titan') return DRE_PERKS;
  if (operator.id === 'the_truth') return TRUTH_PERKS;
  if (operator.id === 'heiliea_valkyrie') return HEILIEA_PERKS;
  if (operator.id === 'the_baby') return BABY_PERKS;
  if (operator.id === 'zenitsu_agatsuma') return ZENITSU_PERKS;
  if (operator.id === 'tanjiro_kamado') return TANJIRO_PERKS;
  if (operator.id === 'muzan_kibutsuji') return MUZAN_PERKS;
  if (operator.id === 'maxwell_shodron') return MAXWELL_PERKS;
  if (operator.id === 'king_opm') return KING_PERKS;
  if (operator.id === 'the_flash') return FLASH_PERKS;
  if (operator.id === 'green_lantern') return LANTERN_PERKS;
  if (operator.id === 'shazam_champion') return SHAZAM_PERKS;
  if (operator.id === 'thor_odinson') return THOR_PERKS;
  if (HERO_EXTRA_PERKS[operator.id]) return HERO_EXTRA_PERKS[operator.id];
  return TACTICAL_PERKS;
}

