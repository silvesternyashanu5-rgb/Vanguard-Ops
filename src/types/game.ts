export type WeaponType =
  | 'assault'
  | 'sniper'
  | 'smg'
  | 'shotgun'
  | 'pistol'
  | 'knife'
  | 'fist'
  | 'ki_blast'
  | 'beam'
  | 'energy_ball'
  | 'kryptonian_strike'
  | 'super_breath'
  | 'heat_vision'
  | 'arcane_bolt'
  | 'rune_beam'
  | 'chronos_orb'
  | 'void_nova'
  | 'king_engine'
  | 'king_wave'
  | 'speed_lightning'
  | 'speed_punch'
  | 'lantern_beam'
  | 'lantern_hammer'
  | 'lightning_arc'
  | 'mjolnir_strike'
  | 'silvester_gauntlet'
  | 'silvester_blade'
  | 'silvester_cannon'
  | 'sonic_bass'
  | 'sonic_boom'
  | 'truth_ray'
  | 'truth_prism'
  | 'star_lance'
  | 'petal_storm'
  | 'bottle_blaster'
  | 'tantrum_smash'
  | 'nichirin_thunder'
  | 'thunder_flash'
  | 'water_slash'
  | 'sun_flame'
  | 'demon_whip'
  | 'blood_thorn'
  | 'repulsor_beam'
  | 'unibeam'
  | 'web_shooter'
  | 'web_gauntlet'
  | 'eldritch_bolt'
  | 'eldritch_whip'
  | 'chaos_hex'
  | 'chaos_rift'
  | 'batarang'
  | 'bat_gauntlet'
  | 'amazon_sword'
  | 'lasso_truth'
  | 'trident_bolt'
  | 'hydro_lance'
  | 'megiddo_ray'
  | 'tempest_katana'
  | 'monarch_daggers'
  | 'kamish_wrath'
  | 'rasengan_orb'
  | 'shinobi_kunai'
  | 'gum_pistol'
  | 'haki_fist'
  | 'limitless_blue'
  | 'hollow_purple'
  | 'divergent_fist'
  | 'blood_pierce'
  | 'water_stream_fist'
  | 'cosmic_fist'
  | 'jio_graze'
  | 'venuzdonoa_blade'
  | 'uchiha_kunai'
  | 'totsuka_blade'
  | 'chidori_blade'
  | 'indra_arrow';

export type OperatorCategory = 'normal' | 'anime' | 'marvel' | 'dc' | 'legendary';

export type MaxwellElement = 'arcane' | 'fire' | 'lightning' | 'frost' | 'void';

export interface WeaponAttachment {
  id: string;
  name: string;
  slot: 'optic' | 'barrel' | 'magazine' | 'laser';
  statMod: {
    damage?: number;
    fireRate?: number;
    accuracy?: number;
    range?: number;
    mobility?: number;
    control?: number;
  };
  enabled: boolean;
}

export interface WeaponData {
  id: string;
  name: string;
  type: WeaponType;
  category: 'primary' | 'secondary';
  damage: number;
  fireRate: number; // rounds per second
  magSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  reloadTime: number; // in seconds
  accuracy: number; // 0-100
  range: number; // 0-100
  mobility: number; // 0-100
  control: number; // 0-100
  recoil: number;
  spread: number;
  bulletsPerShot: number;
  isAutomatic: boolean;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  attachments: WeaponAttachment[];
  description: string;
}

export interface OperatorSkin {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  primaryColor: string;
  camoPattern: 
    | 'tactical_navy' | 'desert_camo' | 'urban_shadow' | 'cyber_neon' | 'gold_damascus' 
    | 'saitama_classic' | 'saitama_serious' | 'saitama_oppai' | 'saitama_tracksuit'
    | 'goku_base' | 'goku_ssj1' | 'goku_ssj2' | 'goku_ssj3' | 'goku_ssg' | 'goku_ssb' | 'goku_ui_sign' | 'goku_mui'
    | 'superman_kryptonian' | 'superman_solar_black' | 'superman_kingdom'
    | 'maxwell_archmage' | 'maxwell_astral' | 'maxwell_blood_moon'
    | 'maxwell_fire' | 'maxwell_lightning' | 'maxwell_frost' | 'maxwell_void'
    | 'king_classic' | 'king_gold'
    | 'flash_scarlet' | 'flash_godspeed' | 'flash_black'
    | 'lantern_emerald' | 'lantern_parallax' | 'lantern_white'
    | 'shazam_classic' | 'shazam_black'
    | 'thor_asgard' | 'thor_stormbreaker' | 'thor_rune'
    | 'silvester_prime' | 'silvester_seraph' | 'silvester_eclipse'
    | 'dre_studio' | 'dre_platinum'
    | 'truth_oracle' | 'truth_eclipse'
    | 'heiliea_valkyrie' | 'heiliea_rose'
    | 'baby_boss' | 'baby_cosmic'
    | 'zenitsu_classic' | 'zenitsu_godspeed'
    | 'tanjiro_classic' | 'tanjiro_hinokami'
    | 'muzan_suit' | 'muzan_final'
    | 'ironman_mk3' | 'ironman_mk50' | 'ironman_mk85' | 'ironman_hulkbuster'
    | 'spiderman_classic' | 'spiderman_iron' | 'spiderman_symbiote'
    | 'strange_supreme' | 'strange_defender' | 'strange_sinister'
    | 'wanda_sokovia' | 'wanda_scarlet' | 'wanda_darkhold'
    | 'batman_classic' | 'batman_arkham' | 'batman_hellbat'
    | 'ww_amazon' | 'ww_golden_eagle' | 'ww_war_goddess'
    | 'aquaman_king' | 'aquaman_gladiator' | 'aquaman_stealth'
    | 'rimuru_slime' | 'rimuru_demon_lord' | 'rimuru_true_dragon'
    | 'jinwoo_assassin' | 'jinwoo_monarch' | 'jinwoo_ashborn'
    | 'naruto_shippuden' | 'naruto_sage' | 'naruto_kcm2' | 'naruto_sixpaths' | 'naruto_baryon'
    | 'luffy_base' | 'luffy_gear2' | 'luffy_gear4' | 'luffy_gear5'
    | 'gojo_blindfold' | 'gojo_six_eyes' | 'gojo_shinjuku'
    | 'itadori_uniform' | 'itadori_sukuna' | 'itadori_blackflash'
    | 'garou_hunter' | 'garou_spiral' | 'garou_monster' | 'garou_cosmic'
    | 'anos_academy' | 'anos_tyrant' | 'anos_chaotic'
    | 'itachi_akatsuki' | 'itachi_susanoo' | 'itachi_edo'
    | 'sasuke_taka' | 'sasuke_ems' | 'sasuke_rinnegan';
  visorColor: string;
  capeColor?: string;
  gloveColor?: string;
  isLocked?: boolean;
  priceCP?: number;
  formNumber?: number;
  auraColor?: string;
  hairColor?: string;
  eyeColor?: string;
  multiplier?: string;
  transformationLore?: string;
}

export interface OperatorData {
  id: string;
  name: string;
  callsign: string;
  faction: string;
  category?: OperatorCategory;
  quote: string;
  archetype?: string;
  health: number;
  speed: number;
  armorRating: number;
  signatureMoves?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  psychologicalProfile?: {
    trait: string;
    boredomLoop: string;
  };
  activeSkill: {
    name: string;
    description: string;
    cooldown: number; // seconds
    duration: number; // seconds
    icon: string;
  };
  skins: OperatorSkin[];
  selectedSkinId: string;
  unlocked: boolean;
}

export interface ArenaMap {
  id: string;
  name: string;
  codename: string;
  location: string;
  description: string;
  theme: 'cyber_neon' | 'dust_district' | 'midnight_warehouse' | 'city_z' | 'tournament_arena' | 'planet_namek';
  skyColor: string;
  groundColor: string;
  fogColor: string;
  fogDensity: number;
  lightingPreset: {
    sunColor: string;
    sunIntensity: number;
    sunPosition: [number, number, number];
    hemiSky: string;
    hemiGround: string;
  };
  mapSize: { x: number; z: number };
  maxPlayers: number;
  powerUpSpawns: Array<{
    type: PowerUpType;
    position: [number, number, number];
    respawnDelay: number;
  }>;
}

export type PowerUpType = 'health' | 'armor' | 'quad_damage' | 'speed' | 'ammo';

export interface PowerUpInstance {
  id: string;
  type: PowerUpType;
  position: [number, number, number];
  name: string;
  duration: number; // active effect duration in seconds (0 for instant)
  multiplier?: number;
  color: string;
  glowColor: string;
  isAvailable: boolean;
  respawnTimeRemaining: number;
  respawnDelay: number;
}

export interface ActivePowerUpEffect {
  type: PowerUpType;
  timeRemaining: number;
  maxTime: number;
  multiplier: number;
}

export type GameMode = 'ffa' | 'duel_1v1';

export interface KillFeedEntry {
  id: string;
  killerName: string;
  killerIsPlayer: boolean;
  victimName: string;
  victimIsPlayer: boolean;
  weaponName: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface CombatantScore {
  id: string;
  name: string;
  isPlayer: boolean;
  team: 'blue' | 'red';
  kills: number;
  deaths: number;
  score: number;
  ping: number;
}

export type ActiveScreenLayer = 
  | 'lobby' 
  | 'game' 
  | 'operators' 
  | 'loadout' 
  | 'settings' 
  | 'maps' 
  | 'store' 
  | 'battlepass' 
  | 'room_lobby'
  | 'deployment_prep'
  | 'ranked';

export interface RankedPlayerEntry {
  id: string;
  name: string;
  operatorId: string;
  level: number;
  rankTier: string;
  rp: number;
  wins: number;
  losses: number;
  kd: number;
  isPlayer?: boolean;
  status: 'online' | 'in_duel' | 'offline';
}

export interface RoomParticipant {
  id: string;
  name: string;
  operatorId: string;
  operatorName: string;
  level: number;
  rp: number;
  isBot: boolean;
  isReady: boolean;
  isHost: boolean;
}

export interface MultiplayerRoomState {
  roomCode: string;
  mode: GameMode;
  isRanked: boolean;
  mapId: string;
  players: RoomParticipant[];
  minPlayers: number;
  maxPlayers: number;
  countdownSeconds: number | null;
  status: 'waiting' | 'countdown' | 'launching' | 'in_match';
  chatMessages: Array<{ id: string; sender: string; text: string; time: string }>;
}

export interface MatchLaunchConfig {
  mode: GameMode;
  isRanked: boolean;
  opponentNames: string[];
  totalCombatants: number;
  enemyType?: 'witches' | 'operators';
}

export interface HudElementTransform {
  x: number; // center X percentage (5..95)
  y: number; // center Y percentage (8..92)
  scale: number; // size multiplier (0.65..1.45)
}

export interface CustomHudLayout {
  joystick: HudElementTransform;
  actionWheel: HudElementTransform;
  skillBar: HudElementTransform;
  powerUp: HudElementTransform;
  minimap: HudElementTransform;
}

export interface GameSettings {
  touchSensitivity: number; // 0.2 to 2.5
  invertY: boolean;
  autoAds: boolean;
  vibration: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  announcer: boolean;
  fpsLimit: 60 | 120;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  shadows: boolean;
  bloom: boolean;
  crosshairColor: string;
  crosshairDynamic: boolean;
  damageNumbers: boolean;
  hitmarkerSound: boolean;
  cameraZoom?: number; // 0.55 to 2.20 distance multiplier
  cameraFov?: number; // 40 to 95 degrees
  cameraHeight?: number; // -0.45 to +0.85 meters vertical viewpoint offset
  cameraShoulder?: number; // -0.85 to +0.85 meters horizontal shoulder offset
  hudLayout?: CustomHudLayout;
}

export interface MatchAward {
  id: string;
  title: string;
  category: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  xpBonus: number;
}

export interface EndOfMatchStats {
  winner: string;
  isPlayerWinner: boolean;
  mvp: {
    name: string;
    isPlayer: boolean;
    operatorId: string;
    operatorName: string;
    score: number;
    kills: number;
    deaths: number;
    kd: string;
    title: string;
    quote: string;
  };
  playerStats: {
    kills: number;
    deaths: number;
    kdRatio: number;
    score: number;
    totalDamage: number;
    headshots: number;
    headshotPercentage: number;
    accuracyPercentage: number;
    highestStreak: number;
    powerUpsCollected: number;
    abilitiesUsed: number;
    matchDurationSeconds: number;
  };
  awards: MatchAward[];
  rewards: {
    creditsEarned: number;
    codPoints: number;
    xpGained: number;
    previousLevel: number;
    currentLevel: number;
    levelProgressPercent: number;
    battlePassTier: number;
    rankTier: string;
    rankPointsGained: number;
  };
  scoreboard: CombatantScore[];
}

export type QuickCommsType = 
  | 'enemy_spotted' 
  | 'need_backup' 
  | 'ultimate_ready' 
  | 'charge_ki' 
  | 'defend_here' 
  | 'rush_mid';

export interface ChatMessage {
  id: string;
  sender: string;
  isPlayer: boolean;
  text: string;
  time: string;
  channel: 'all' | 'team' | 'system';
}

export interface MatchConnectionState {
  ping: number;
  packetLoss: number;
  serverRegion: string;
  roomCode: string;
  status: 'connected' | 'connecting' | 'offline';
}

export interface TacticalPerk {
  id: string;
  name: string;
  category: 'mobility' | 'defense' | 'offense' | 'utility';
  bonusLabel: string;
  description: string;
}

