import { CustomHudLayout } from '../types/game';

export type ControlActionType =
  | 'fire_hold'
  | 'jump'
  | 'kick'
  | 'slide'
  | 'kamehameha'
  | 'spirit_bomb'
  | 'instant_tp'
  | 'serious_punch'
  | 'consecutive'
  | 'ads_toggle'
  | 'reload'
  | 'cloak_dash'
  | 'sonar_ping'
  | 'overdrive_slam'
  | 'flight_toggle'
  | 'super_dash'
  | 'super_breath'
  | 'thermal_overload'
  | 'arcane_blink'
  | 'chrono_stasis'
  | 'aether_barrier'
  | 'arcane_nova'
  | 'magic_transmission'
  | 'king_engine'
  | 'king_assist'
  | 'king_hellfire'
  | 'flash_phase'
  | 'flash_vortex'
  | 'flash_ultimate'
  | 'lantern_shield'
  | 'lantern_construct'
  | 'lantern_beam'
  | 'shazam_bolt'
  | 'shazam_ultimate'
  | 'thor_throw'
  | 'thor_slam'
  | 'thor_bifrost'
  | 'silvester_time_freeze'
  | 'silvester_singularity'
  | 'silvester_meteor_rain'
  | 'silvester_divine_overdrive'
  | 'silvester_mirror_cloak'
  | 'silvester_tachyon_step'
  | 'silvester_solar_nova'
  | 'silvester_zero_blizzard'
  | 'silvester_hellfire'
  | 'silvester_thunder_chain'
  | 'silvester_soul_drain'
  | 'silvester_reality_slash'
  | 'silvester_sovereign_roar'
  | 'silvester_omega_apocalypse'
  | 'dre_bass_drop'
  | 'dre_sub_step'
  | 'dre_amplify'
  | 'dre_omega_mixtape'
  | 'truth_seal'
  | 'truth_veil_shift'
  | 'truth_true_sight'
  | 'truth_absolute'
  | 'heiliea_seraph_heal'
  | 'heiliea_starfall'
  | 'heiliea_celestial_nova'
  | 'baby_tantrum'
  | 'baby_crawl_zoom'
  | 'baby_nap_shield'
  | 'baby_crying_wave'
  | 'zenitsu_thunderclap'
  | 'zenitsu_sixfold'
  | 'zenitsu_flaming_dragon'
  | 'tanjiro_water_wheel'
  | 'tanjiro_hinokami_dash'
  | 'tanjiro_sun_dragon'
  | 'muzan_whip_storm'
  | 'muzan_blood_step'
  | 'muzan_shockwave'
  | 'transform_form'
  | 'iron_missiles'
  | 'iron_nano_shield'
  | 'iron_unibeam'
  | 'spider_web_bomb'
  | 'spider_zip'
  | 'spider_overload'
  | 'strange_mirror_seal'
  | 'strange_portal'
  | 'strange_vishanti'
  | 'wanda_reality_warp'
  | 'wanda_telekinesis'
  | 'wanda_chaos_nova'
  | 'batman_smoke'
  | 'batman_grapnel'
  | 'batman_hellbat'
  | 'ww_bracelets'
  | 'ww_lasso'
  | 'ww_godstrike'
  | 'aquaman_tidal'
  | 'aquaman_surge'
  | 'aquaman_kraken'
  | 'rimuru_beelzebuth'
  | 'rimuru_storm'
  | 'rimuru_azathoth'
  | 'jinwoo_rulers'
  | 'jinwoo_exchange'
  | 'jinwoo_arise'
  | 'naruto_rasenshuriken'
  | 'naruto_blitz'
  | 'naruto_bijuu'
  | 'luffy_red_roc'
  | 'luffy_culverin'
  | 'luffy_bajrang'
  | 'gojo_red'
  | 'gojo_infinity'
  | 'gojo_purple'
  | 'yuji_black_flash'
  | 'yuji_step'
  | 'yuji_shrine'
  | 'garou_fajin'
  | 'garou_dash'
  | 'garou_gamma'
  | 'anos_eyes'
  | 'anos_venuzdonoa'
  | 'anos_egil'
  | 'itachi_amaterasu'
  | 'itachi_crows'
  | 'itachi_tsukuyomi'
  | 'sasuke_kirin'
  | 'sasuke_warp'
  | 'sasuke_indra';

export type WheelLayoutVariant =
  | 'hero_cross'
  | 'saiyan_orbit'
  | 'kryptonian_diamond'
  | 'cyber_hex'
  | 'tactical_arc'
  | 'heavy_octa'
  | 'arcane_sigil'
  | 'king_crown'
  | 'speed_bolt'
  | 'lantern_ring'
  | 'shazam_crest'
  | 'asgard_rune'
  | 'sovereign_omega'
  | 'sonic_equalizer'
  | 'veritas_eye'
  | 'valkyrie_wing'
  | 'rattle_burst'
  | 'thunder_breath'
  | 'water_sun_breath'
  | 'demon_king'
  | 'marvel_tactical'
  | 'dc_emblem'
  | 'anime_crest';

export interface OperatorWheelButtonSpec {
  slot: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  label: string;
  action: ControlActionType;
  icon:
    | 'jump'
    | 'fist'
    | 'kick'
    | 'slide'
    | 'kamehameha'
    | 'spirit_bomb'
    | 'teleport'
    | 'crosshair'
    | 'scope'
    | 'blade'
    | 'slam'
    | 'dash'
    | 'flight'
    | 'breath'
    | 'laser_eyes'
    | 'sonic_dash'
    | 'sigil'
    | 'stasis'
    | 'blink'
    | 'barrier'
    | 'crown'
    | 'lightning'
    | 'ring'
    | 'bolt'
    | 'hammer'
    | 'meteor'
    | 'vortex'
    | 'omega'
    | 'blackhole'
    | 'snowflake'
    | 'bass'
    | 'truth_eye'
    | 'wing'
    | 'rattle'
    | 'katana'
    | 'water_wave'
    | 'sun_flame'
    | 'demon_whip'
    | 'web'
    | 'shield'
    | 'batarang'
    | 'trident'
    | 'dagger'
    | 'rasengan'
    | 'strawhat'
    | 'infinity'
    | 'crimson_eye'
    | 'abyss'
    | 'transform';
  accentBorder: string;
  accentBg: string;
  accentGlow?: string;
  textColor?: string;
  isPrimary?: boolean;
}

export interface OperatorSkillButtonSpec {
  label: string;
  action: ControlActionType;
  icon: OperatorWheelButtonSpec['icon'];
  keyHint?: string;
  borderClass: string;
  bgClass: string;
  textColor?: string;
}

export interface OperatorControlProfile {
  operatorId: string;
  wheelVariant: WheelLayoutVariant;
  themeAccent: string;
  wheelRingBorder: string;
  powerUpLabel: string;
  powerUpAction: ControlActionType;
  powerUpChargeLabel: string;
  powerUpReadyLabel: string;
  powerUpGradient: string;
  powerUpBadgeIcon:
    | 'fist'
    | 'kamehameha'
    | 'solar'
    | 'cyber'
    | 'radar'
    | 'reactor'
    | 'sigil'
    | 'crown'
    | 'lightning'
    | 'ring'
    | 'bolt'
    | 'hammer'
    | 'omega'
    | 'bass'
    | 'truth_eye'
    | 'wing'
    | 'rattle'
    | 'katana'
    | 'sun_flame'
    | 'demon_whip'
    | 'web'
    | 'shield'
    | 'batarang'
    | 'trident'
    | 'dagger'
    | 'rasengan'
    | 'strawhat'
    | 'infinity'
    | 'crimson_eye'
    | 'abyss';
  buttons: [
    OperatorWheelButtonSpec,
    OperatorWheelButtonSpec,
    OperatorWheelButtonSpec,
    OperatorWheelButtonSpec
  ];
  skillButtons?: OperatorSkillButtonSpec[];
  extraUtilityLabel?: string;
  extraUtilityAction?: ControlActionType;
}

export const DEFAULT_HUD_LAYOUT: CustomHudLayout = {
  minimap: { x: 10, y: 15, scale: 1.0 },
  powerUp: { x: 14, y: 54, scale: 1.0 },
  joystick: { x: 12, y: 80, scale: 1.0 },
  actionWheel: { x: 87, y: 78, scale: 1.0 },
  skillBar: { x: 64, y: 84, scale: 1.0 },
};

const SAITAMA_CONTROLS: OperatorControlProfile = {
  operatorId: 'saitama',
  wheelVariant: 'hero_cross',
  themeAccent: '#facc15',
  wheelRingBorder: 'border-white/30',
  powerUpLabel: 'SERIOUS POWER',
  powerUpAction: 'serious_punch',
  powerUpChargeLabel: 'FOCUS',
  powerUpReadyLabel: 'SERIOUS PUNCH',
  powerUpGradient: 'from-amber-200 via-orange-400 to-red-500',
  powerUpBadgeIcon: 'fist',
  buttons: [
    {
      slot: 'topLeft',
      label: 'JUMP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-white/65',
      accentBg: 'bg-zinc-900/75',
    },
    {
      slot: 'topRight',
      label: 'PUNCH',
      action: 'fire_hold',
      icon: 'fist',
      accentBorder: 'border-amber-400',
      accentBg: 'bg-gradient-to-b from-amber-800/75 to-zinc-900/90',
      accentGlow: 'shadow-[0_0_16px_rgba(251,191,36,0.45)]',
      textColor: 'text-amber-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'KICK',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-white/65',
      accentBg: 'bg-zinc-900/75',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-white/65',
      accentBg: 'bg-zinc-900/75',
    },
  ],
  skillButtons: [
    { label: 'BARRAGE', action: 'consecutive', icon: 'fist', keyHint: 'F', borderClass: 'border-amber-400/75', bgClass: 'bg-amber-950/80', textColor: 'text-amber-200' },
    { label: 'SERIOUS', action: 'serious_punch', icon: 'slam', keyHint: 'Q', borderClass: 'border-red-400/80', bgClass: 'bg-red-950/80', textColor: 'text-red-200' },
  ],
  extraUtilityLabel: 'BARRAGE',
  extraUtilityAction: 'consecutive',
};

const GOKU_CONTROLS: OperatorControlProfile = {
  operatorId: 'son_goku',
  wheelVariant: 'saiyan_orbit',
  themeAccent: '#38bdf8',
  wheelRingBorder: 'border-cyan-400/55',
  powerUpLabel: 'KAMEHAMEHA',
  powerUpAction: 'kamehameha',
  powerUpChargeLabel: 'CHARGE KI',
  powerUpReadyLabel: 'KAMEHAMEHA!',
  powerUpGradient: 'from-cyan-300 via-sky-400 to-blue-600',
  powerUpBadgeIcon: 'kamehameha',
  buttons: [
    {
      slot: 'topLeft',
      label: 'KI LEAP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-cyan-300/75',
      accentBg: 'bg-sky-950/80',
      textColor: 'text-cyan-100',
    },
    {
      slot: 'topRight',
      label: 'KAMEHA',
      action: 'kamehameha',
      icon: 'kamehameha',
      accentBorder: 'border-cyan-400',
      accentBg: 'bg-gradient-to-b from-sky-700/85 to-blue-950/90',
      accentGlow: 'shadow-[0_0_18px_rgba(56,189,248,0.55)]',
      textColor: 'text-cyan-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'GENKI',
      action: 'spirit_bomb',
      icon: 'spirit_bomb',
      accentBorder: 'border-amber-400/80',
      accentBg: 'bg-indigo-950/85',
      textColor: 'text-amber-200',
    },
    {
      slot: 'bottomRight',
      label: 'WARP TP',
      action: 'instant_tp',
      icon: 'teleport',
      accentBorder: 'border-sky-300/75',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-sky-200',
    },
  ],
  skillButtons: [
    { label: 'KAMEHA', action: 'kamehameha', icon: 'kamehameha', keyHint: 'E', borderClass: 'border-cyan-400/80', bgClass: 'bg-sky-950/80', textColor: 'text-cyan-200' },
    { label: 'GENKI', action: 'spirit_bomb', icon: 'spirit_bomb', keyHint: 'Q', borderClass: 'border-amber-400/80', bgClass: 'bg-indigo-950/80', textColor: 'text-amber-200' },
    { label: 'WARP TP', action: 'instant_tp', icon: 'teleport', keyHint: 'F', borderClass: 'border-sky-300/80', bgClass: 'bg-zinc-900/85', textColor: 'text-sky-200' },
  ],
  extraUtilityLabel: 'KI BLAST',
  extraUtilityAction: 'fire_hold',
};

const SUPERMAN_CONTROLS: OperatorControlProfile = {
  operatorId: 'superman',
  wheelVariant: 'kryptonian_diamond',
  themeAccent: '#ef4444',
  wheelRingBorder: 'border-red-500/60',
  powerUpLabel: 'SOLAR THERMAL',
  powerUpAction: 'thermal_overload',
  powerUpChargeLabel: 'ABSORB SUN',
  powerUpReadyLabel: 'LASER EYES!',
  powerUpGradient: 'from-yellow-300 via-orange-500 to-red-600',
  powerUpBadgeIcon: 'solar',
  buttons: [
    {
      slot: 'topLeft',
      label: 'FLIGHT',
      action: 'flight_toggle',
      icon: 'flight',
      accentBorder: 'border-blue-400/85',
      accentBg: 'bg-blue-950/85',
      textColor: 'text-sky-200',
    },
    {
      slot: 'topRight',
      label: 'THERMAL',
      action: 'thermal_overload',
      icon: 'laser_eyes',
      accentBorder: 'border-red-400',
      accentBg: 'bg-gradient-to-b from-red-700/85 to-amber-950/90',
      accentGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
      textColor: 'text-amber-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'BREATH',
      action: 'super_breath',
      icon: 'breath',
      accentBorder: 'border-cyan-300/85',
      accentBg: 'bg-cyan-950/85',
      textColor: 'text-cyan-100',
    },
    {
      slot: 'bottomRight',
      label: 'MIGHT',
      action: 'fire_hold',
      icon: 'fist',
      accentBorder: 'border-amber-400/85',
      accentBg: 'bg-blue-950/80',
      textColor: 'text-amber-300',
    },
  ],
  skillButtons: [
    { label: 'SONIC DASH', action: 'super_dash', icon: 'sonic_dash', keyHint: 'F', borderClass: 'border-sky-400/80', bgClass: 'bg-blue-950/80', textColor: 'text-sky-200' },
    { label: 'BREATH', action: 'super_breath', icon: 'breath', keyHint: 'E', borderClass: 'border-cyan-300/80', bgClass: 'bg-cyan-950/80', textColor: 'text-cyan-100' },
    { label: 'THERMAL', action: 'thermal_overload', icon: 'laser_eyes', keyHint: 'Q', borderClass: 'border-red-400/85', bgClass: 'bg-red-950/80', textColor: 'text-amber-200' },
  ],
  extraUtilityLabel: 'SONIC DASH',
  extraUtilityAction: 'super_dash',
};

const SPECTRE_CONTROLS: OperatorControlProfile = {
  operatorId: 'spectre_neon',
  wheelVariant: 'cyber_hex',
  themeAccent: '#ec4899',
  wheelRingBorder: 'border-pink-400/50',
  powerUpLabel: 'CYBER CLOAK',
  powerUpAction: 'cloak_dash',
  powerUpChargeLabel: 'SYNC',
  powerUpReadyLabel: 'PHANTOM DASH',
  powerUpGradient: 'from-pink-400 via-fuchsia-500 to-cyan-400',
  powerUpBadgeIcon: 'cyber',
  buttons: [
    {
      slot: 'topLeft',
      label: 'VAULT',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-cyan-300/75',
      accentBg: 'bg-zinc-900/80',
    },
    {
      slot: 'topRight',
      label: 'SHOOT',
      action: 'fire_hold',
      icon: 'crosshair',
      accentBorder: 'border-pink-400',
      accentBg: 'bg-gradient-to-b from-pink-900/75 to-zinc-950/90',
      accentGlow: 'shadow-[0_0_16px_rgba(236,72,153,0.45)]',
      textColor: 'text-pink-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'BLADE',
      action: 'kick',
      icon: 'blade',
      accentBorder: 'border-fuchsia-400/80',
      accentBg: 'bg-zinc-900/80',
      textColor: 'text-fuchsia-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-cyan-400/80',
      accentBg: 'bg-zinc-900/80',
      textColor: 'text-cyan-200',
    },
  ],
  skillButtons: [
    { label: 'CLOAK DASH', action: 'cloak_dash', icon: 'dash', keyHint: 'F', borderClass: 'border-pink-400/80', bgClass: 'bg-pink-950/80', textColor: 'text-pink-200' },
    { label: 'AIM SCOPE', action: 'ads_toggle', icon: 'scope', borderClass: 'border-cyan-400/75', bgClass: 'bg-zinc-900/85', textColor: 'text-cyan-200' },
    { label: 'RELOAD', action: 'reload', icon: 'crosshair', keyHint: 'R', borderClass: 'border-zinc-500/75', bgClass: 'bg-zinc-900/85', textColor: 'text-zinc-200' },
  ],
  extraUtilityLabel: 'AIM',
  extraUtilityAction: 'ads_toggle',
};

const VANGUARD_CONTROLS: OperatorControlProfile = {
  operatorId: 'vanguard_recon',
  wheelVariant: 'tactical_arc',
  themeAccent: '#38bdf8',
  wheelRingBorder: 'border-sky-300/45',
  powerUpLabel: 'SONAR PULSE',
  powerUpAction: 'sonar_ping',
  powerUpChargeLabel: 'SCAN',
  powerUpReadyLabel: 'SONAR STRIKE',
  powerUpGradient: 'from-sky-300 via-cyan-400 to-teal-500',
  powerUpBadgeIcon: 'radar',
  buttons: [
    {
      slot: 'topLeft',
      label: 'SCOPE',
      action: 'ads_toggle',
      icon: 'scope',
      accentBorder: 'border-cyan-300/80',
      accentBg: 'bg-slate-900/85',
      textColor: 'text-cyan-200',
    },
    {
      slot: 'topRight',
      label: 'SHOOT',
      action: 'fire_hold',
      icon: 'crosshair',
      accentBorder: 'border-sky-400',
      accentBg: 'bg-gradient-to-b from-sky-800/75 to-slate-950/90',
      accentGlow: 'shadow-[0_0_16px_rgba(56,189,248,0.45)]',
      textColor: 'text-sky-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'JUMP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-white/65',
      accentBg: 'bg-zinc-900/80',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-white/65',
      accentBg: 'bg-zinc-900/80',
    },
  ],
  skillButtons: [
    { label: 'SONAR PULSE', action: 'sonar_ping', icon: 'scope', keyHint: 'Q', borderClass: 'border-cyan-400/80', bgClass: 'bg-sky-950/80', textColor: 'text-cyan-200' },
    { label: 'KICK', action: 'kick', icon: 'kick', keyHint: 'E', borderClass: 'border-zinc-400/75', bgClass: 'bg-zinc-900/85', textColor: 'text-zinc-200' },
    { label: 'RELOAD', action: 'reload', icon: 'crosshair', keyHint: 'R', borderClass: 'border-zinc-500/75', bgClass: 'bg-zinc-900/85', textColor: 'text-zinc-200' },
  ],
  extraUtilityLabel: 'RELOAD',
  extraUtilityAction: 'reload',
};

const REAPER_CONTROLS: OperatorControlProfile = {
  operatorId: 'reaper_apex',
  wheelVariant: 'heavy_octa',
  themeAccent: '#f97316',
  wheelRingBorder: 'border-orange-500/50',
  powerUpLabel: 'CORE OVERDRIVE',
  powerUpAction: 'overdrive_slam',
  powerUpChargeLabel: 'VENT',
  powerUpReadyLabel: 'OVERDRIVE',
  powerUpGradient: 'from-yellow-400 via-orange-500 to-red-600',
  powerUpBadgeIcon: 'reactor',
  buttons: [
    {
      slot: 'topLeft',
      label: 'THRUST',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-orange-300/75',
      accentBg: 'bg-zinc-900/80',
    },
    {
      slot: 'topRight',
      label: 'FIRE',
      action: 'fire_hold',
      icon: 'crosshair',
      accentBorder: 'border-orange-400',
      accentBg: 'bg-gradient-to-b from-orange-800/75 to-zinc-950/90',
      accentGlow: 'shadow-[0_0_16px_rgba(249,115,22,0.5)]',
      textColor: 'text-orange-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'MELEE',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-red-400/80',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-red-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-white/65',
      accentBg: 'bg-zinc-900/80',
    },
  ],
  skillButtons: [
    { label: 'EXO SLAM', action: 'overdrive_slam', icon: 'slam', keyHint: 'Q', borderClass: 'border-orange-400/85', bgClass: 'bg-orange-950/80', textColor: 'text-orange-200' },
    { label: 'AIM', action: 'ads_toggle', icon: 'scope', borderClass: 'border-zinc-500/75', bgClass: 'bg-zinc-900/85', textColor: 'text-zinc-200' },
    { label: 'RELOAD', action: 'reload', icon: 'crosshair', keyHint: 'R', borderClass: 'border-zinc-500/75', bgClass: 'bg-zinc-900/85', textColor: 'text-zinc-200' },
  ],
  extraUtilityLabel: 'RELOAD',
  extraUtilityAction: 'reload',
};

const MAXWELL_CONTROLS: OperatorControlProfile = {
  operatorId: 'maxwell_shodron',
  wheelVariant: 'arcane_sigil',
  themeAccent: '#c084fc',
  wheelRingBorder: 'border-violet-400/75',
  powerUpLabel: 'AETHER MANA',
  powerUpAction: 'arcane_nova',
  powerUpChargeLabel: 'CHANNEL MANA',
  powerUpReadyLabel: 'ARCANE NOVA!',
  powerUpGradient: 'from-violet-400 via-fuchsia-500 to-amber-300',
  powerUpBadgeIcon: 'sigil',
  buttons: [
    {
      slot: 'topLeft',
      label: 'LEVITATE',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-violet-300/80',
      accentBg: 'bg-violet-950/85',
      textColor: 'text-violet-100',
    },
    {
      slot: 'topRight',
      label: 'CAST',
      action: 'fire_hold',
      icon: 'sigil',
      accentBorder: 'border-amber-300',
      accentBg: 'bg-gradient-to-b from-violet-700/85 to-indigo-950/90',
      accentGlow: 'shadow-[0_0_20px_rgba(192,132,252,0.58)]',
      textColor: 'text-amber-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'SURGE',
      action: 'chrono_stasis',
      icon: 'stasis',
      accentBorder: 'border-cyan-300/80',
      accentBg: 'bg-indigo-950/85',
      textColor: 'text-cyan-200',
    },
    {
      slot: 'bottomRight',
      label: 'BLINK',
      action: 'arcane_blink',
      icon: 'blink',
      accentBorder: 'border-fuchsia-400/80',
      accentBg: 'bg-purple-950/85',
      textColor: 'text-fuchsia-200',
    },
  ],
  skillButtons: [
    { label: 'CHRONOS', action: 'chrono_stasis', icon: 'stasis', keyHint: 'E', borderClass: 'border-cyan-400/80', bgClass: 'bg-indigo-950/80', textColor: 'text-cyan-200' },
    { label: 'WARD', action: 'aether_barrier', icon: 'barrier', keyHint: 'X', borderClass: 'border-amber-400/80', bgClass: 'bg-amber-950/80', textColor: 'text-amber-200' },
    { label: 'NOVA', action: 'arcane_nova', icon: 'sigil', keyHint: 'Q', borderClass: 'border-fuchsia-400/80', bgClass: 'bg-violet-950/80', textColor: 'text-fuchsia-200' },
  ],
  extraUtilityLabel: 'TRANSMUTE',
  extraUtilityAction: 'magic_transmission',
};

const KING_CONTROLS: OperatorControlProfile = {
  operatorId: 'king_opm',
  wheelVariant: 'king_crown',
  themeAccent: '#fbbf24',
  wheelRingBorder: 'border-amber-400/75',
  powerUpLabel: 'KING ENGINE',
  powerUpAction: 'king_hellfire',
  powerUpChargeLabel: 'INTIMIDATE',
  powerUpReadyLabel: 'HELLFIRE CANNON!',
  powerUpGradient: 'from-amber-300 via-red-500 to-rose-700',
  powerUpBadgeIcon: 'crown',
  buttons: [
    {
      slot: 'topLeft',
      label: 'LEAP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-zinc-300/75',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-amber-100',
    },
    {
      slot: 'topRight',
      label: 'ROAR',
      action: 'fire_hold',
      icon: 'crown',
      accentBorder: 'border-amber-400',
      accentBg: 'bg-gradient-to-b from-amber-700/85 to-zinc-950/90',
      accentGlow: 'shadow-[0_0_20px_rgba(251,191,36,0.55)]',
      textColor: 'text-amber-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'KICK',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-red-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-red-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-yellow-400/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-yellow-200',
    },
  ],
  skillButtons: [
    { label: 'KING ENGINE', action: 'king_engine', icon: 'stasis', keyHint: 'E', borderClass: 'border-red-400/85', bgClass: 'bg-red-950/85', textColor: 'text-red-200' },
    { label: 'SAITAMA ASSIST', action: 'king_assist', icon: 'fist', keyHint: 'F', borderClass: 'border-yellow-400/85', bgClass: 'bg-amber-950/85', textColor: 'text-yellow-200' },
    { label: 'HELLFIRE', action: 'king_hellfire', icon: 'crown', keyHint: 'Q', borderClass: 'border-amber-400/85', bgClass: 'bg-orange-950/85', textColor: 'text-amber-200' },
  ],
  extraUtilityLabel: 'HELLFIRE',
  extraUtilityAction: 'king_hellfire',
};

const FLASH_CONTROLS: OperatorControlProfile = {
  operatorId: 'the_flash',
  wheelVariant: 'speed_bolt',
  themeAccent: '#f59e0b',
  wheelRingBorder: 'border-yellow-400/80',
  powerUpLabel: 'SPEED FORCE',
  powerUpAction: 'flash_ultimate',
  powerUpChargeLabel: 'BUILD CHARGE',
  powerUpReadyLabel: 'INFINITE MASS!',
  powerUpGradient: 'from-red-500 via-amber-400 to-yellow-200',
  powerUpBadgeIcon: 'lightning',
  buttons: [
    {
      slot: 'topLeft',
      label: 'LEAP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-red-300/75',
      accentBg: 'bg-red-950/85',
      textColor: 'text-amber-100',
    },
    {
      slot: 'topRight',
      label: 'SPEED BOLT',
      action: 'fire_hold',
      icon: 'lightning',
      accentBorder: 'border-yellow-400',
      accentBg: 'bg-gradient-to-b from-red-700/85 to-amber-900/90',
      accentGlow: 'shadow-[0_0_20px_rgba(250,204,21,0.55)]',
      textColor: 'text-yellow-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'STRIKE',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-amber-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-amber-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-yellow-300/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-yellow-200',
    },
  ],
  skillButtons: [
    { label: 'VORTEX', action: 'flash_vortex', icon: 'vortex', keyHint: 'E', borderClass: 'border-amber-400/85', bgClass: 'bg-orange-950/85', textColor: 'text-amber-200' },
    { label: 'PHASE WARP', action: 'flash_phase', icon: 'sonic_dash', keyHint: 'F', borderClass: 'border-yellow-300/85', bgClass: 'bg-red-950/85', textColor: 'text-yellow-200' },
    { label: 'MASS NOVA', action: 'flash_ultimate', icon: 'lightning', keyHint: 'Q', borderClass: 'border-yellow-400', bgClass: 'bg-amber-950/90', textColor: 'text-yellow-100' },
  ],
  extraUtilityLabel: 'MASS NOVA',
  extraUtilityAction: 'flash_ultimate',
};

const LANTERN_CONTROLS: OperatorControlProfile = {
  operatorId: 'green_lantern',
  wheelVariant: 'lantern_ring',
  themeAccent: '#22c55e',
  wheelRingBorder: 'border-emerald-400/80',
  powerUpLabel: 'WILLPOWER',
  powerUpAction: 'lantern_beam',
  powerUpChargeLabel: 'OATH CHARGE',
  powerUpReadyLabel: 'OAN BEAM!',
  powerUpGradient: 'from-emerald-300 via-green-500 to-teal-600',
  powerUpBadgeIcon: 'ring',
  buttons: [
    {
      slot: 'topLeft',
      label: 'RING FLY',
      action: 'flight_toggle',
      icon: 'flight',
      accentBorder: 'border-emerald-300/80',
      accentBg: 'bg-emerald-950/85',
      textColor: 'text-emerald-100',
    },
    {
      slot: 'topRight',
      label: 'CONSTRUCT',
      action: 'fire_hold',
      icon: 'ring',
      accentBorder: 'border-emerald-400',
      accentBg: 'bg-gradient-to-b from-emerald-700/85 to-zinc-950/90',
      accentGlow: 'shadow-[0_0_20px_rgba(34,197,94,0.58)]',
      textColor: 'text-emerald-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'HAMMER',
      action: 'kick',
      icon: 'hammer',
      accentBorder: 'border-lime-400/85',
      accentBg: 'bg-green-950/85',
      textColor: 'text-lime-200',
    },
    {
      slot: 'bottomRight',
      label: 'DASH',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-teal-300/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-teal-200',
    },
  ],
  skillButtons: [
    { label: 'METEOR', action: 'lantern_construct', icon: 'meteor', keyHint: 'E', borderClass: 'border-lime-400/85', bgClass: 'bg-green-950/85', textColor: 'text-lime-200' },
    { label: 'RING WARD', action: 'lantern_shield', icon: 'barrier', keyHint: 'F', borderClass: 'border-teal-300/85', bgClass: 'bg-emerald-950/85', textColor: 'text-teal-200' },
    { label: 'OAN BEAM', action: 'lantern_beam', icon: 'ring', keyHint: 'Q', borderClass: 'border-emerald-400', bgClass: 'bg-emerald-900/85', textColor: 'text-emerald-100' },
  ],
  extraUtilityLabel: 'WILL BEAM',
  extraUtilityAction: 'lantern_beam',
};

const SHAZAM_CONTROLS: OperatorControlProfile = {
  operatorId: 'shazam_champion',
  wheelVariant: 'shazam_crest',
  themeAccent: '#fde047',
  wheelRingBorder: 'border-yellow-400/80',
  powerUpLabel: 'ZEUS POWER',
  powerUpAction: 'shazam_ultimate',
  powerUpChargeLabel: 'CHANNEL ZEUS',
  powerUpReadyLabel: 'SHAZAM!',
  powerUpGradient: 'from-yellow-200 via-amber-400 to-red-600',
  powerUpBadgeIcon: 'bolt',
  buttons: [
    {
      slot: 'topLeft',
      label: 'MERCURY',
      action: 'flight_toggle',
      icon: 'flight',
      accentBorder: 'border-red-400/80',
      accentBg: 'bg-red-950/85',
      textColor: 'text-amber-100',
    },
    {
      slot: 'topRight',
      label: 'SMITE',
      action: 'fire_hold',
      icon: 'bolt',
      accentBorder: 'border-yellow-300',
      accentBg: 'bg-gradient-to-b from-red-700/85 to-amber-950/90',
      accentGlow: 'shadow-[0_0_20px_rgba(253,224,71,0.58)]',
      textColor: 'text-yellow-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'STRIKE',
      action: 'kick',
      icon: 'fist',
      accentBorder: 'border-amber-300/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-yellow-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-red-300/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-amber-200',
    },
  ],
  skillButtons: [
    { label: 'ZEUS BOLT', action: 'shazam_bolt', icon: 'lightning', keyHint: 'E', borderClass: 'border-amber-300/85', bgClass: 'bg-amber-950/85', textColor: 'text-yellow-200' },
    { label: 'HERCULES', action: 'super_dash', icon: 'sonic_dash', keyHint: 'F', borderClass: 'border-red-400/85', bgClass: 'bg-red-950/85', textColor: 'text-amber-200' },
    { label: 'SHAZAM!', action: 'shazam_ultimate', icon: 'bolt', keyHint: 'Q', borderClass: 'border-yellow-300', bgClass: 'bg-red-900/85', textColor: 'text-yellow-100' },
  ],
  extraUtilityLabel: 'SHAZAM!',
  extraUtilityAction: 'shazam_ultimate',
};

const THOR_CONTROLS: OperatorControlProfile = {
  operatorId: 'thor_odinson',
  wheelVariant: 'asgard_rune',
  themeAccent: '#38bdf8',
  wheelRingBorder: 'border-sky-400/80',
  powerUpLabel: 'ODINFORCE',
  powerUpAction: 'thor_bifrost',
  powerUpChargeLabel: 'SUMMON STORM',
  powerUpReadyLabel: 'BIFROST!',
  powerUpGradient: 'from-cyan-200 via-sky-400 to-blue-700',
  powerUpBadgeIcon: 'hammer',
  buttons: [
    {
      slot: 'topLeft',
      label: 'STORM FLY',
      action: 'flight_toggle',
      icon: 'flight',
      accentBorder: 'border-sky-300/80',
      accentBg: 'bg-slate-900/85',
      textColor: 'text-sky-100',
    },
    {
      slot: 'topRight',
      label: 'MJOLNIR',
      action: 'fire_hold',
      icon: 'hammer',
      accentBorder: 'border-cyan-400',
      accentBg: 'bg-gradient-to-b from-sky-800/85 to-slate-950/90',
      accentGlow: 'shadow-[0_0_20px_rgba(56,189,248,0.6)]',
      textColor: 'text-cyan-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'SMASH',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-cyan-300/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-cyan-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-amber-300/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-amber-200',
    },
  ],
  skillButtons: [
    { label: 'THUNDER SLAM', action: 'thor_slam', icon: 'slam', keyHint: 'E', borderClass: 'border-cyan-400/85', bgClass: 'bg-sky-950/85', textColor: 'text-cyan-200' },
    { label: 'MJOLNIR TOSS', action: 'thor_throw', icon: 'hammer', keyHint: 'F', borderClass: 'border-amber-300/85', bgClass: 'bg-slate-900/85', textColor: 'text-amber-200' },
    { label: 'BIFROST', action: 'thor_bifrost', icon: 'lightning', keyHint: 'Q', borderClass: 'border-sky-300', bgClass: 'bg-blue-950/85', textColor: 'text-sky-100' },
  ],
  extraUtilityLabel: 'BIFROST',
  extraUtilityAction: 'thor_bifrost',
};

const SILVESTER_CONTROLS: OperatorControlProfile = {
  operatorId: 'silvester_jais',
  wheelVariant: 'sovereign_omega',
  themeAccent: '#38bdf8',
  wheelRingBorder: 'border-amber-300/85',
  powerUpLabel: 'OMEGA SOVEREIGN',
  powerUpAction: 'silvester_omega_apocalypse',
  powerUpChargeLabel: 'ASCEND',
  powerUpReadyLabel: 'OMEGA APOCALYPSE',
  powerUpGradient: 'from-cyan-300 via-violet-400 to-amber-300',
  powerUpBadgeIcon: 'omega',
  buttons: [
    {
      slot: 'topLeft',
      label: 'OMNI FLY',
      action: 'flight_toggle',
      icon: 'flight',
      accentBorder: 'border-cyan-300/85',
      accentBg: 'bg-slate-900/90',
      textColor: 'text-cyan-100',
    },
    {
      slot: 'topRight',
      label: 'SOVEREIGN',
      action: 'fire_hold',
      icon: 'omega',
      accentBorder: 'border-amber-300',
      accentBg: 'bg-gradient-to-b from-indigo-800/90 via-violet-900/90 to-zinc-950/95',
      accentGlow: 'shadow-[0_0_22px_rgba(56,189,248,0.65)]',
      textColor: 'text-amber-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'STRIKE',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-violet-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-violet-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-amber-400/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-amber-200',
    },
  ],
  skillButtons: [
    { label: 'TIME STOP', action: 'silvester_time_freeze', icon: 'stasis', keyHint: 'E', borderClass: 'border-violet-400/85', bgClass: 'bg-violet-950/85', textColor: 'text-violet-200' },
    { label: 'TACHYON', action: 'silvester_tachyon_step', icon: 'sonic_dash', keyHint: 'F', borderClass: 'border-sky-300/85', bgClass: 'bg-sky-950/85', textColor: 'text-sky-200' },
    { label: 'GOD 4X', action: 'silvester_divine_overdrive', icon: 'omega', keyHint: 'T', borderClass: 'border-amber-300/85', bgClass: 'bg-amber-950/85', textColor: 'text-amber-200' },
  ],
  extraUtilityLabel: 'GOD 4X',
  extraUtilityAction: 'silvester_divine_overdrive',
};

export interface SilvesterDeckPower {
  id: number;
  short: string;
  name: string;
  action: ControlActionType;
  cost: number;
  colorClass: string;
}

export const SILVESTER_15_POWERS: SilvesterDeckPower[] = [
  { id: 1, short: 'FLY', name: '1. Omni-Flight', action: 'flight_toggle', cost: 0, colorClass: 'border-cyan-400/75 text-cyan-200 bg-cyan-950/75' },
  { id: 2, short: 'TIME', name: '2. Chronos Time-Freeze', action: 'silvester_time_freeze', cost: 15, colorClass: 'border-violet-400/75 text-violet-200 bg-violet-950/75' },
  { id: 3, short: 'HOLE', name: '3. Black Hole Singularity', action: 'silvester_singularity', cost: 20, colorClass: 'border-fuchsia-400/75 text-fuchsia-200 bg-fuchsia-950/75' },
  { id: 4, short: 'METEOR', name: '4. Celestial Meteor Rain', action: 'silvester_meteor_rain', cost: 20, colorClass: 'border-orange-400/75 text-orange-200 bg-orange-950/75' },
  { id: 5, short: 'GOD 4X', name: '5. Divine Overdrive (4x)', action: 'silvester_divine_overdrive', cost: 25, colorClass: 'border-amber-300/85 text-amber-200 bg-amber-950/80' },
  { id: 6, short: 'CLOAK', name: '6. Astral Mirror Cloak', action: 'silvester_mirror_cloak', cost: 15, colorClass: 'border-emerald-400/75 text-emerald-200 bg-emerald-950/75' },
  { id: 7, short: 'WARP', name: '7. Tachyon Flash Step', action: 'silvester_tachyon_step', cost: 0, colorClass: 'border-sky-300/75 text-sky-200 bg-sky-950/75' },
  { id: 8, short: 'NOVA', name: '8. Solar Supernova', action: 'silvester_solar_nova', cost: 20, colorClass: 'border-yellow-400/75 text-yellow-200 bg-yellow-950/75' },
  { id: 9, short: 'ZERO', name: '9. Absolute Zero Blizzard', action: 'silvester_zero_blizzard', cost: 15, colorClass: 'border-cyan-300/75 text-cyan-100 bg-cyan-950/80' },
  { id: 10, short: 'INFERNO', name: '10. Hellfire Judgment', action: 'silvester_hellfire', cost: 20, colorClass: 'border-red-400/75 text-red-200 bg-red-950/75' },
  { id: 11, short: 'ZAP', name: '11. Thunder God Chain', action: 'silvester_thunder_chain', cost: 15, colorClass: 'border-sky-400/75 text-sky-200 bg-slate-900/85' },
  { id: 12, short: 'DRAIN', name: '12. Soul Drain Eclipse', action: 'silvester_soul_drain', cost: 15, colorClass: 'border-rose-400/75 text-rose-200 bg-rose-950/75' },
  { id: 13, short: 'RIFT', name: '13. Reality Slash', action: 'silvester_reality_slash', cost: 20, colorClass: 'border-indigo-400/75 text-indigo-200 bg-indigo-950/75' },
  { id: 14, short: 'ROAR', name: '14. Sovereign Roar', action: 'silvester_sovereign_roar', cost: 0, colorClass: 'border-amber-400/75 text-amber-100 bg-zinc-900/85' },
  { id: 15, short: 'OMEGA', name: '15. Omega Apocalypse', action: 'silvester_omega_apocalypse', cost: 40, colorClass: 'border-yellow-300 text-yellow-100 bg-gradient-to-r from-violet-800/90 to-amber-700/85 font-black' },
];

const DRE_CONTROLS: OperatorControlProfile = {
  operatorId: 'dre_titan',
  wheelVariant: 'sonic_equalizer',
  themeAccent: '#f97316',
  wheelRingBorder: 'border-orange-400/80',
  powerUpLabel: '808 OVERDRIVE',
  powerUpAction: 'dre_omega_mixtape',
  powerUpChargeLabel: 'DROP BASS',
  powerUpReadyLabel: 'OMEGA MIXTAPE!',
  powerUpGradient: 'from-amber-400 via-orange-500 to-rose-600',
  powerUpBadgeIcon: 'bass',
  buttons: [
    {
      slot: 'topLeft',
      label: 'BASS LEAP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-orange-300/80',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-orange-100',
    },
    {
      slot: 'topRight',
      label: 'SUB BLAST',
      action: 'fire_hold',
      icon: 'bass',
      accentBorder: 'border-orange-400',
      accentBg: 'bg-gradient-to-b from-orange-700/85 to-zinc-950/95',
      accentGlow: 'shadow-[0_0_20px_rgba(249,115,22,0.6)]',
      textColor: 'text-amber-200',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'STRIKE',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-amber-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-amber-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-rose-400/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-rose-200',
    },
  ],
  skillButtons: [
    { label: 'BASS DROP', action: 'dre_bass_drop', icon: 'slam', keyHint: 'E', borderClass: 'border-amber-400/85', bgClass: 'bg-orange-950/85', textColor: 'text-amber-200' },
    { label: 'SUB-STEP', action: 'dre_sub_step', icon: 'sonic_dash', keyHint: 'F', borderClass: 'border-rose-400/85', bgClass: 'bg-rose-950/85', textColor: 'text-rose-200' },
    { label: 'AMPLIFY', action: 'dre_amplify', icon: 'bass', keyHint: 'T', borderClass: 'border-orange-400/85', bgClass: 'bg-zinc-900/85', textColor: 'text-orange-200' },
    { label: 'MIXTAPE', action: 'dre_omega_mixtape', icon: 'omega', keyHint: 'Q', borderClass: 'border-yellow-400', bgClass: 'bg-orange-900/85', textColor: 'text-yellow-100' },
  ],
  extraUtilityLabel: 'AMPLIFY',
  extraUtilityAction: 'dre_amplify',
};

const TRUTH_CONTROLS: OperatorControlProfile = {
  operatorId: 'the_truth',
  wheelVariant: 'veritas_eye',
  themeAccent: '#fbbf24',
  wheelRingBorder: 'border-amber-300/85',
  powerUpLabel: 'VERITAS',
  powerUpAction: 'truth_absolute',
  powerUpChargeLabel: 'ILLUMINATE',
  powerUpReadyLabel: 'ABSOLUTE TRUTH!',
  powerUpGradient: 'from-yellow-100 via-amber-400 to-yellow-600',
  powerUpBadgeIcon: 'truth_eye',
  buttons: [
    {
      slot: 'topLeft',
      label: 'LEVITATE',
      action: 'flight_toggle',
      icon: 'flight',
      accentBorder: 'border-amber-200/80',
      accentBg: 'bg-slate-900/90',
      textColor: 'text-amber-100',
    },
    {
      slot: 'topRight',
      label: 'EYE RAY',
      action: 'fire_hold',
      icon: 'truth_eye',
      accentBorder: 'border-amber-300',
      accentBg: 'bg-gradient-to-b from-amber-600/85 to-zinc-950/95',
      accentGlow: 'shadow-[0_0_22px_rgba(251,191,36,0.6)]',
      textColor: 'text-yellow-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'STRIKE',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-yellow-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-yellow-200',
    },
    {
      slot: 'bottomRight',
      label: 'SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-cyan-300/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-cyan-200',
    },
  ],
  skillButtons: [
    { label: 'JUDGMENT', action: 'truth_seal', icon: 'stasis', keyHint: 'E', borderClass: 'border-yellow-400/85', bgClass: 'bg-amber-950/85', textColor: 'text-yellow-200' },
    { label: 'VEIL WARP', action: 'truth_veil_shift', icon: 'blink', keyHint: 'F', borderClass: 'border-cyan-300/85', bgClass: 'bg-slate-900/85', textColor: 'text-cyan-200' },
    { label: 'TRUE SIGHT', action: 'truth_true_sight', icon: 'truth_eye', keyHint: 'T', borderClass: 'border-amber-300/85', bgClass: 'bg-zinc-900/85', textColor: 'text-amber-200' },
    { label: 'VERITAS', action: 'truth_absolute', icon: 'omega', keyHint: 'Q', borderClass: 'border-yellow-200', bgClass: 'bg-amber-900/85', textColor: 'text-yellow-100' },
  ],
  extraUtilityLabel: 'TRUE SIGHT',
  extraUtilityAction: 'truth_true_sight',
};

const HEILIEA_CONTROLS: OperatorControlProfile = {
  operatorId: 'heiliea_valkyrie',
  wheelVariant: 'valkyrie_wing',
  themeAccent: '#f472b6',
  wheelRingBorder: 'border-pink-400/85',
  powerUpLabel: 'STARLIGHT',
  powerUpAction: 'heiliea_celestial_nova',
  powerUpChargeLabel: 'ASCEND',
  powerUpReadyLabel: 'CELESTIAL NOVA!',
  powerUpGradient: 'from-pink-200 via-rose-400 to-amber-300',
  powerUpBadgeIcon: 'wing',
  buttons: [
    {
      slot: 'topLeft',
      label: 'WING FLY',
      action: 'flight_toggle',
      icon: 'wing',
      accentBorder: 'border-pink-300/80',
      accentBg: 'bg-rose-950/85',
      textColor: 'text-pink-100',
    },
    {
      slot: 'topRight',
      label: 'STAR LANCE',
      action: 'fire_hold',
      icon: 'blade',
      accentBorder: 'border-pink-400',
      accentBg: 'bg-gradient-to-b from-pink-700/85 to-zinc-950/95',
      accentGlow: 'shadow-[0_0_22px_rgba(244,114,182,0.58)]',
      textColor: 'text-pink-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'SLASH',
      action: 'kick',
      icon: 'kick',
      accentBorder: 'border-rose-300/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-rose-200',
    },
    {
      slot: 'bottomRight',
      label: 'GLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-amber-300/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-amber-200',
    },
  ],
  skillButtons: [
    { label: 'STARFALL', action: 'heiliea_starfall', icon: 'meteor', keyHint: 'E', borderClass: 'border-amber-300/85', bgClass: 'bg-rose-950/85', textColor: 'text-amber-200' },
    { label: 'SERAPH HEAL', action: 'heiliea_seraph_heal', icon: 'barrier', keyHint: 'F', borderClass: 'border-emerald-300/85', bgClass: 'bg-emerald-950/85', textColor: 'text-emerald-200' },
    { label: 'CELESTIAL NOVA', action: 'heiliea_celestial_nova', icon: 'wing', keyHint: 'Q', borderClass: 'border-pink-300', bgClass: 'bg-pink-900/85', textColor: 'text-pink-100' },
  ],
  extraUtilityLabel: 'BLESSING',
  extraUtilityAction: 'heiliea_seraph_heal',
};

const BABY_CONTROLS: OperatorControlProfile = {
  operatorId: 'the_baby',
  wheelVariant: 'rattle_burst',
  themeAccent: '#38bdf8',
  wheelRingBorder: 'border-sky-300/85',
  powerUpLabel: 'PACIFIER PWR',
  powerUpAction: 'baby_crying_wave',
  powerUpChargeLabel: 'CHARGE CRY',
  powerUpReadyLabel: 'MEGA CRY WAVE!',
  powerUpGradient: 'from-cyan-300 via-sky-400 to-amber-300',
  powerUpBadgeIcon: 'rattle',
  buttons: [
    {
      slot: 'topLeft',
      label: 'BOUNCE',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-sky-300/80',
      accentBg: 'bg-sky-950/85',
      textColor: 'text-sky-100',
    },
    {
      slot: 'topRight',
      label: 'BOTTLE',
      action: 'fire_hold',
      icon: 'rattle',
      accentBorder: 'border-amber-300',
      accentBg: 'bg-gradient-to-b from-sky-600/85 to-indigo-950/95',
      accentGlow: 'shadow-[0_0_20px_rgba(56,189,248,0.6)]',
      textColor: 'text-amber-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'BONK',
      action: 'kick',
      icon: 'fist',
      accentBorder: 'border-rose-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-rose-200',
    },
    {
      slot: 'bottomRight',
      label: 'ROLL',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-yellow-300/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-yellow-200',
    },
  ],
  skillButtons: [
    { label: 'TANTRUM', action: 'baby_tantrum', icon: 'slam', keyHint: 'E', borderClass: 'border-rose-400/85', bgClass: 'bg-rose-950/85', textColor: 'text-rose-200' },
    { label: 'CRAWL ZOOM', action: 'baby_crawl_zoom', icon: 'sonic_dash', keyHint: 'F', borderClass: 'border-yellow-300/85', bgClass: 'bg-amber-950/85', textColor: 'text-yellow-200' },
    { label: 'NAP SHIELD', action: 'baby_nap_shield', icon: 'barrier', keyHint: 'T', borderClass: 'border-sky-300/85', bgClass: 'bg-sky-950/85', textColor: 'text-sky-200' },
    { label: 'CRY WAVE', action: 'baby_crying_wave', icon: 'rattle', keyHint: 'Q', borderClass: 'border-cyan-300', bgClass: 'bg-indigo-950/85', textColor: 'text-cyan-100' },
  ],
  extraUtilityLabel: 'NAP SHIELD',
  extraUtilityAction: 'baby_nap_shield',
};

const ZENITSU_CONTROLS: OperatorControlProfile = {
  operatorId: 'zenitsu_agatsuma',
  wheelVariant: 'thunder_breath',
  themeAccent: '#facc15',
  wheelRingBorder: 'border-yellow-400/85',
  powerUpLabel: 'THUNDER BREATH',
  powerUpAction: 'zenitsu_flaming_dragon',
  powerUpChargeLabel: 'FOCUS BREATH',
  powerUpReadyLabel: 'FLAMING THUNDER GOD!',
  powerUpGradient: 'from-yellow-200 via-amber-400 to-orange-500',
  powerUpBadgeIcon: 'katana',
  buttons: [
    {
      slot: 'topLeft',
      label: 'LEAP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-yellow-300/80',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-yellow-100',
    },
    {
      slot: 'topRight',
      label: 'NICHIRIN',
      action: 'fire_hold',
      icon: 'katana',
      accentBorder: 'border-yellow-400',
      accentBg: 'bg-gradient-to-b from-amber-600/85 to-zinc-950/95',
      accentGlow: 'shadow-[0_0_20px_rgba(250,204,21,0.55)]',
      textColor: 'text-yellow-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'SLASH',
      action: 'kick',
      icon: 'blade',
      accentBorder: 'border-amber-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-amber-200',
    },
    {
      slot: 'bottomRight',
      label: 'DASH',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-sky-300/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-sky-200',
    },
  ],
  skillButtons: [
    { label: 'THUNDERCLAP', action: 'zenitsu_thunderclap', icon: 'lightning', keyHint: 'E', borderClass: 'border-yellow-400/85', bgClass: 'bg-amber-950/85', textColor: 'text-yellow-200' },
    { label: 'SIXFOLD', action: 'zenitsu_sixfold', icon: 'sonic_dash', keyHint: 'F', borderClass: 'border-amber-300/85', bgClass: 'bg-zinc-900/85', textColor: 'text-amber-200' },
    { label: 'FLAMING GOD', action: 'zenitsu_flaming_dragon', icon: 'katana', keyHint: 'Q', borderClass: 'border-yellow-300', bgClass: 'bg-orange-950/85', textColor: 'text-yellow-100' },
  ],
};

const TANJIRO_CONTROLS: OperatorControlProfile = {
  operatorId: 'tanjiro_kamado',
  wheelVariant: 'water_sun_breath',
  themeAccent: '#38bdf8',
  wheelRingBorder: 'border-cyan-400/85',
  powerUpLabel: 'HINOKAMI KAGURA',
  powerUpAction: 'tanjiro_sun_dragon',
  powerUpChargeLabel: 'TOTAL FOCUS',
  powerUpReadyLabel: 'SUN DRAGON HALO!',
  powerUpGradient: 'from-cyan-300 via-sky-500 to-red-500',
  powerUpBadgeIcon: 'sun_flame',
  buttons: [
    {
      slot: 'topLeft',
      label: 'LEAP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-emerald-300/80',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-emerald-100',
    },
    {
      slot: 'topRight',
      label: 'NICHIRIN',
      action: 'fire_hold',
      icon: 'katana',
      accentBorder: 'border-cyan-400',
      accentBg: 'bg-gradient-to-b from-sky-700/85 via-zinc-950/90 to-red-950/90',
      accentGlow: 'shadow-[0_0_20px_rgba(56,189,248,0.52)]',
      textColor: 'text-cyan-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'STRIKE',
      action: 'kick',
      icon: 'blade',
      accentBorder: 'border-red-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-orange-200',
    },
    {
      slot: 'bottomRight',
      label: 'FLOW SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-cyan-300/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-cyan-200',
    },
  ],
  skillButtons: [
    { label: 'WATER WHEEL', action: 'tanjiro_water_wheel', icon: 'water_wave', keyHint: 'E', borderClass: 'border-cyan-400/85', bgClass: 'bg-sky-950/85', textColor: 'text-cyan-200' },
    { label: 'HINOKAMI DASH', action: 'tanjiro_hinokami_dash', icon: 'sun_flame', keyHint: 'F', borderClass: 'border-orange-400/85', bgClass: 'bg-red-950/85', textColor: 'text-orange-200' },
    { label: 'SUN DRAGON', action: 'tanjiro_sun_dragon', icon: 'katana', keyHint: 'Q', borderClass: 'border-red-400', bgClass: 'bg-amber-950/85', textColor: 'text-amber-100' },
  ],
};

const MUZAN_CONTROLS: OperatorControlProfile = {
  operatorId: 'muzan_kibutsuji',
  wheelVariant: 'demon_king',
  themeAccent: '#f43f5e',
  wheelRingBorder: 'border-rose-500/85',
  powerUpLabel: 'DEMON BLOOD',
  powerUpAction: 'muzan_shockwave',
  powerUpChargeLabel: 'ABSORB BLOOD',
  powerUpReadyLabel: 'BLACK BLOOD NOVA!',
  powerUpGradient: 'from-rose-500 via-red-600 to-purple-700',
  powerUpBadgeIcon: 'demon_whip',
  buttons: [
    {
      slot: 'topLeft',
      label: 'LEAP',
      action: 'jump',
      icon: 'jump',
      accentBorder: 'border-rose-300/80',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-rose-100',
    },
    {
      slot: 'topRight',
      label: 'SPINE WHIP',
      action: 'fire_hold',
      icon: 'demon_whip',
      accentBorder: 'border-rose-500',
      accentBg: 'bg-gradient-to-b from-rose-800/85 to-zinc-950/95',
      accentGlow: 'shadow-[0_0_20px_rgba(244,63,94,0.58)]',
      textColor: 'text-rose-100',
      isPrimary: true,
    },
    {
      slot: 'bottomLeft',
      label: 'CLAW SLASH',
      action: 'kick',
      icon: 'blade',
      accentBorder: 'border-purple-400/85',
      accentBg: 'bg-zinc-900/85',
      textColor: 'text-purple-200',
    },
    {
      slot: 'bottomRight',
      label: 'MIST SLIDE',
      action: 'slide',
      icon: 'slide',
      accentBorder: 'border-red-400/85',
      accentBg: 'bg-zinc-900/90',
      textColor: 'text-red-200',
    },
  ],
  skillButtons: [
    { label: 'WHIP STORM', action: 'muzan_whip_storm', icon: 'demon_whip', keyHint: 'E', borderClass: 'border-rose-400/85', bgClass: 'bg-rose-950/85', textColor: 'text-rose-200' },
    { label: 'BLOOD STEP', action: 'muzan_blood_step', icon: 'blink', keyHint: 'F', borderClass: 'border-purple-400/85', bgClass: 'bg-purple-950/85', textColor: 'text-purple-200' },
    { label: 'BLACK BLOOD', action: 'muzan_shockwave', icon: 'vortex', keyHint: 'Q', borderClass: 'border-red-500', bgClass: 'bg-red-950/90', textColor: 'text-red-100' },
  ],
};

function makeHeroControls(cfg: {
  operatorId: string;
  wheelVariant: WheelLayoutVariant;
  themeAccent: string;
  ringBorder: string;
  powerUpLabel: string;
  powerUpReadyLabel: string;
  powerUpGradient: string;
  badgeIcon: OperatorControlProfile['powerUpBadgeIcon'];
  canFly?: boolean;
  fireLabel: string;
  fireIcon: OperatorWheelButtonSpec['icon'];
  kickLabel: string;
  eSkill: { label: string; action: ControlActionType; icon: OperatorWheelButtonSpec['icon'] };
  fSkill: { label: string; action: ControlActionType; icon: OperatorWheelButtonSpec['icon'] };
  qSkill: { label: string; action: ControlActionType; icon: OperatorWheelButtonSpec['icon'] };
  colorA: string;
  colorB: string;
  colorQ: string;
}): OperatorControlProfile {
  return {
    operatorId: cfg.operatorId,
    wheelVariant: cfg.wheelVariant,
    themeAccent: cfg.themeAccent,
    wheelRingBorder: cfg.ringBorder,
    powerUpLabel: cfg.powerUpLabel,
    powerUpAction: cfg.qSkill.action,
    powerUpChargeLabel: 'CHARGE ENERGY',
    powerUpReadyLabel: cfg.powerUpReadyLabel,
    powerUpGradient: cfg.powerUpGradient,
    powerUpBadgeIcon: cfg.badgeIcon,
    buttons: [
      {
        slot: 'topLeft',
        label: cfg.canFly ? 'FLY' : 'LEAP',
        action: cfg.canFly ? 'flight_toggle' : 'jump',
        icon: cfg.canFly ? 'flight' : 'jump',
        accentBorder: 'border-cyan-300/80',
        accentBg: 'bg-zinc-900/90',
        textColor: 'text-cyan-100',
      },
      {
        slot: 'topRight',
        label: cfg.fireLabel,
        action: 'fire_hold',
        icon: cfg.fireIcon,
        accentBorder: 'border-amber-400',
        accentBg: 'bg-gradient-to-b from-zinc-800/90 to-zinc-950/95',
        accentGlow: 'shadow-[0_0_20px_rgba(251,191,36,0.48)]',
        textColor: 'text-white',
        isPrimary: true,
      },
      {
        slot: 'bottomLeft',
        label: cfg.kickLabel,
        action: 'kick',
        icon: 'kick',
        accentBorder: 'border-rose-400/85',
        accentBg: 'bg-zinc-900/85',
        textColor: 'text-rose-200',
      },
      {
        slot: 'bottomRight',
        label: 'SLIDE',
        action: 'slide',
        icon: 'slide',
        accentBorder: 'border-sky-300/85',
        accentBg: 'bg-zinc-900/90',
        textColor: 'text-sky-200',
      },
    ],
    skillButtons: [
      { label: cfg.eSkill.label, action: cfg.eSkill.action, icon: cfg.eSkill.icon, keyHint: 'E', borderClass: cfg.colorA, bgClass: 'bg-zinc-950/85', textColor: 'text-zinc-100' },
      { label: cfg.fSkill.label, action: cfg.fSkill.action, icon: cfg.fSkill.icon, keyHint: 'F', borderClass: cfg.colorB, bgClass: 'bg-zinc-950/85', textColor: 'text-zinc-100' },
      { label: 'TRANSFORM', action: 'transform_form', icon: 'transform', keyHint: 'T', borderClass: 'border-amber-300/85', bgClass: 'bg-amber-950/85', textColor: 'text-amber-200' },
      { label: cfg.qSkill.label, action: cfg.qSkill.action, icon: cfg.qSkill.icon, keyHint: 'Q', borderClass: cfg.colorQ, bgClass: 'bg-red-950/85', textColor: 'text-white' },
    ],
    extraUtilityLabel: 'TRANSFORM',
    extraUtilityAction: 'transform_form',
  };
}

const IRON_MAN_CONTROLS = makeHeroControls({
  operatorId: 'iron_man',
  wheelVariant: 'marvel_tactical',
  themeAccent: '#f59e0b',
  ringBorder: 'border-red-500/85',
  powerUpLabel: 'ARC REACTOR',
  powerUpReadyLabel: 'UNIBEAM!',
  powerUpGradient: 'from-cyan-300 via-sky-500 to-red-500',
  badgeIcon: 'reactor',
  canFly: true,
  fireLabel: 'REPULSOR',
  fireIcon: 'bolt',
  kickLabel: 'ARMOR SLAM',
  eSkill: { label: 'MICRO MISSILES', action: 'iron_missiles', icon: 'meteor' },
  fSkill: { label: 'NANO SHIELD', action: 'iron_nano_shield', icon: 'shield' },
  qSkill: { label: 'UNI-BEAM', action: 'iron_unibeam', icon: 'laser_eyes' },
  colorA: 'border-red-400/85',
  colorB: 'border-cyan-400/85',
  colorQ: 'border-amber-300',
});

const SPIDER_MAN_CONTROLS = makeHeroControls({
  operatorId: 'spider_man',
  wheelVariant: 'marvel_tactical',
  themeAccent: '#ef4444',
  ringBorder: 'border-red-500/85',
  powerUpLabel: 'SPIDER-SENSE',
  powerUpReadyLabel: 'IRON SPIDER!',
  powerUpGradient: 'from-red-500 via-sky-500 to-amber-300',
  badgeIcon: 'web',
  fireLabel: 'WEB SHOT',
  fireIcon: 'web',
  kickLabel: 'ACRO KICK',
  eSkill: { label: 'WEB TRAP', action: 'spider_web_bomb', icon: 'web' },
  fSkill: { label: 'WEB ZIP', action: 'spider_zip', icon: 'sonic_dash' },
  qSkill: { label: 'ARACHNID SURGE', action: 'spider_overload', icon: 'omega' },
  colorA: 'border-slate-200/85',
  colorB: 'border-red-400/85',
  colorQ: 'border-amber-300',
});

const DOCTOR_STRANGE_CONTROLS = makeHeroControls({
  operatorId: 'doctor_strange',
  wheelVariant: 'marvel_tactical',
  themeAccent: '#f97316',
  ringBorder: 'border-amber-400/85',
  powerUpLabel: 'EYE OF AGAMOTTO',
  powerUpReadyLabel: 'VISHANTI!',
  powerUpGradient: 'from-amber-300 via-orange-500 to-emerald-400',
  badgeIcon: 'sigil',
  canFly: true,
  fireLabel: 'ELDRITCH',
  fireIcon: 'sigil',
  kickLabel: 'MANDALA HIT',
  eSkill: { label: 'MIRROR SEAL', action: 'strange_mirror_seal', icon: 'stasis' },
  fSkill: { label: 'SLING PORTAL', action: 'strange_portal', icon: 'blink' },
  qSkill: { label: 'HOGGOTH BOLTS', action: 'strange_vishanti', icon: 'sigil' },
  colorA: 'border-emerald-400/85',
  colorB: 'border-orange-400/85',
  colorQ: 'border-amber-300',
});

const SCARLET_WITCH_CONTROLS = makeHeroControls({
  operatorId: 'scarlet_witch',
  wheelVariant: 'marvel_tactical',
  themeAccent: '#f43f5e',
  ringBorder: 'border-rose-500/85',
  powerUpLabel: 'CHAOS MAGIC',
  powerUpReadyLabel: 'REALITY NOVA!',
  powerUpGradient: 'from-rose-400 via-red-600 to-purple-600',
  badgeIcon: 'sigil',
  canFly: true,
  fireLabel: 'HEX BOLT',
  fireIcon: 'vortex',
  kickLabel: 'HEX BURST',
  eSkill: { label: 'HEX SEAL', action: 'wanda_reality_warp', icon: 'stasis' },
  fSkill: { label: 'CHAOS BLINK', action: 'wanda_telekinesis', icon: 'blink' },
  qSkill: { label: 'CHAOS NOVA', action: 'wanda_chaos_nova', icon: 'vortex' },
  colorA: 'border-rose-400/85',
  colorB: 'border-purple-400/85',
  colorQ: 'border-red-400',
});

const BATMAN_CONTROLS = makeHeroControls({
  operatorId: 'batman',
  wheelVariant: 'dc_emblem',
  themeAccent: '#94a3b8',
  ringBorder: 'border-amber-400/85',
  powerUpLabel: 'KNIGHT PROTOCOL',
  powerUpReadyLabel: 'HELLBAT FURY!',
  powerUpGradient: 'from-zinc-500 via-amber-400 to-red-600',
  badgeIcon: 'batarang',
  fireLabel: 'BATARANG',
  fireIcon: 'batarang',
  kickLabel: 'CQC STRIKE',
  eSkill: { label: 'CRYO SMOKE', action: 'batman_smoke', icon: 'snowflake' },
  fSkill: { label: 'GRAPNEL ZIP', action: 'batman_grapnel', icon: 'dash' },
  qSkill: { label: 'HELLBAT OVERDRIVE', action: 'batman_hellbat', icon: 'batarang' },
  colorA: 'border-cyan-400/85',
  colorB: 'border-slate-300/85',
  colorQ: 'border-red-500',
});

const WONDER_WOMAN_CONTROLS = makeHeroControls({
  operatorId: 'wonder_woman',
  wheelVariant: 'dc_emblem',
  themeAccent: '#eab308',
  ringBorder: 'border-yellow-400/85',
  powerUpLabel: 'AMAZON MIGHT',
  powerUpReadyLabel: 'GODWAVE!',
  powerUpGradient: 'from-yellow-300 via-red-500 to-blue-500',
  badgeIcon: 'shield',
  canFly: true,
  fireLabel: 'GODKILLER',
  fireIcon: 'blade',
  kickLabel: 'AEGIS BASH',
  eSkill: { label: 'BRACELET CLASH', action: 'ww_bracelets', icon: 'shield' },
  fSkill: { label: 'LASSO PULL', action: 'ww_lasso', icon: 'dash' },
  qSkill: { label: 'GODKILLER STRIKE', action: 'ww_godstrike', icon: 'lightning' },
  colorA: 'border-yellow-300/85',
  colorB: 'border-amber-400/85',
  colorQ: 'border-red-400',
});

const AQUAMAN_CONTROLS = makeHeroControls({
  operatorId: 'aquaman',
  wheelVariant: 'dc_emblem',
  themeAccent: '#06b6d4',
  ringBorder: 'border-cyan-400/85',
  powerUpLabel: 'ATLANTIS WRATH',
  powerUpReadyLabel: 'KARATHEN!',
  powerUpGradient: 'from-cyan-300 via-teal-500 to-amber-400',
  badgeIcon: 'trident',
  fireLabel: 'TRIDENT',
  fireIcon: 'trident',
  kickLabel: 'SEA SWEEP',
  eSkill: { label: 'TIDAL VORTEX', action: 'aquaman_tidal', icon: 'water_wave' },
  fSkill: { label: 'HYDRO SURGE', action: 'aquaman_surge', icon: 'sonic_dash' },
  qSkill: { label: 'OCEAN TEMPEST', action: 'aquaman_kraken', icon: 'trident' },
  colorA: 'border-cyan-400/85',
  colorB: 'border-teal-300/85',
  colorQ: 'border-amber-400',
});

const RIMURU_CONTROLS = makeHeroControls({
  operatorId: 'rimuru_tempest',
  wheelVariant: 'anime_crest',
  themeAccent: '#38bdf8',
  ringBorder: 'border-sky-400/85',
  powerUpLabel: 'RAPHAEL / CIEL',
  powerUpReadyLabel: 'AZATHOTH!',
  powerUpGradient: 'from-cyan-300 via-sky-500 to-amber-300',
  badgeIcon: 'abyss',
  canFly: true,
  fireLabel: 'MEGIDDO',
  fireIcon: 'katana',
  kickLabel: 'TEMPEST CUT',
  eSkill: { label: 'BEELZEBUTH', action: 'rimuru_beelzebuth', icon: 'blackhole' },
  fSkill: { label: 'SPATIAL WARP', action: 'rimuru_storm', icon: 'blink' },
  qSkill: { label: 'VOID AZATHOTH', action: 'rimuru_azathoth', icon: 'abyss' },
  colorA: 'border-purple-400/85',
  colorB: 'border-cyan-300/85',
  colorQ: 'border-amber-300',
});

const JINWOO_CONTROLS = makeHeroControls({
  operatorId: 'sung_jinwoo',
  wheelVariant: 'anime_crest',
  themeAccent: '#a855f7',
  ringBorder: 'border-purple-500/85',
  powerUpLabel: 'SHADOW MONARCH',
  powerUpReadyLabel: 'ARISE!',
  powerUpGradient: 'from-violet-400 via-purple-600 to-indigo-800',
  badgeIcon: 'dagger',
  fireLabel: 'DAGGERS',
  fireIcon: 'dagger',
  kickLabel: 'MUTILATE',
  eSkill: { label: "RULER'S HAND", action: 'jinwoo_rulers', icon: 'vortex' },
  fSkill: { label: 'SHADOW STEP', action: 'jinwoo_exchange', icon: 'blink' },
  qSkill: { label: 'ARISE LEGION', action: 'jinwoo_arise', icon: 'dagger' },
  colorA: 'border-violet-400/85',
  colorB: 'border-purple-400/85',
  colorQ: 'border-fuchsia-400',
});

const NARUTO_CONTROLS = makeHeroControls({
  operatorId: 'naruto_uzumaki',
  wheelVariant: 'anime_crest',
  themeAccent: '#f97316',
  ringBorder: 'border-orange-400/85',
  powerUpLabel: 'KURAMA CHAKRA',
  powerUpReadyLabel: 'BIJUU BOMB!',
  powerUpGradient: 'from-yellow-300 via-orange-500 to-red-500',
  badgeIcon: 'rasengan',
  fireLabel: 'RASENGAN',
  fireIcon: 'rasengan',
  kickLabel: 'BARRAGE',
  eSkill: { label: 'RASENSHURIKEN', action: 'naruto_rasenshuriken', icon: 'rasengan' },
  fSkill: { label: 'KURAMA BLITZ', action: 'naruto_blitz', icon: 'sonic_dash' },
  qSkill: { label: 'SIX PATHS BIJUU', action: 'naruto_bijuu', icon: 'sun_flame' },
  colorA: 'border-sky-400/85',
  colorB: 'border-amber-400/85',
  colorQ: 'border-orange-400',
});

const LUFFY_CONTROLS = makeHeroControls({
  operatorId: 'monkey_d_luffy',
  wheelVariant: 'anime_crest',
  themeAccent: '#ef4444',
  ringBorder: 'border-red-400/85',
  powerUpLabel: 'DRUMS OF LIBERATION',
  powerUpReadyLabel: 'BAJRANG GUN!',
  powerUpGradient: 'from-white via-amber-300 to-red-500',
  badgeIcon: 'strawhat',
  fireLabel: 'GUM PISTOL',
  fireIcon: 'fist',
  kickLabel: 'WHIP KICK',
  eSkill: { label: 'RED ROC', action: 'luffy_red_roc', icon: 'sun_flame' },
  fSkill: { label: 'JET CULVERIN', action: 'luffy_culverin', icon: 'sonic_dash' },
  qSkill: { label: 'G5 BAJRANG GUN', action: 'luffy_bajrang', icon: 'strawhat' },
  colorA: 'border-orange-400/85',
  colorB: 'border-rose-400/85',
  colorQ: 'border-yellow-200',
});

const GOJO_CONTROLS = makeHeroControls({
  operatorId: 'satoru_gojo',
  wheelVariant: 'anime_crest',
  themeAccent: '#60a5fa',
  ringBorder: 'border-cyan-300/85',
  powerUpLabel: 'LIMITLESS SIX EYES',
  powerUpReadyLabel: 'HOLLOW PURPLE!',
  powerUpGradient: 'from-cyan-300 via-blue-500 to-fuchsia-600',
  badgeIcon: 'infinity',
  canFly: true,
  fireLabel: 'LAPSE BLUE',
  fireIcon: 'infinity',
  kickLabel: 'BLACK FLASH',
  eSkill: { label: 'REVERSAL RED', action: 'gojo_red', icon: 'vortex' },
  fSkill: { label: 'INFINITY BARRIER', action: 'gojo_infinity', icon: 'infinity' },
  qSkill: { label: 'HOLLOW PURPLE', action: 'gojo_purple', icon: 'blackhole' },
  colorA: 'border-red-400/85',
  colorB: 'border-cyan-300/85',
  colorQ: 'border-fuchsia-400',
});

const YUJI_CONTROLS = makeHeroControls({
  operatorId: 'yuji_itadori',
  wheelVariant: 'anime_crest',
  themeAccent: '#fb7185',
  ringBorder: 'border-rose-400/85',
  powerUpLabel: 'CURSED SPARK',
  powerUpReadyLabel: 'MALEVOLENT SHRINE!',
  powerUpGradient: 'from-cyan-300 via-rose-500 to-red-700',
  badgeIcon: 'fist',
  fireLabel: 'DIVERGENT',
  fireIcon: 'fist',
  kickLabel: 'MANJI KICK',
  eSkill: { label: 'BLACK FLASH', action: 'yuji_black_flash', icon: 'bolt' },
  fSkill: { label: 'FLASH STEP', action: 'yuji_step', icon: 'sonic_dash' },
  qSkill: { label: 'DOMAIN SHRINE', action: 'yuji_shrine', icon: 'crimson_eye' },
  colorA: 'border-rose-500/85',
  colorB: 'border-cyan-400/85',
  colorQ: 'border-red-500',
});

const GAROU_CONTROLS = makeHeroControls({
  operatorId: 'garou_opm',
  wheelVariant: 'anime_crest',
  themeAccent: '#c084fc',
  ringBorder: 'border-purple-400/85',
  powerUpLabel: 'GODLIKE ADAPTATION',
  powerUpReadyLabel: 'GAMMA RAY BURST!',
  powerUpGradient: 'from-sky-300 via-purple-500 to-amber-300',
  badgeIcon: 'abyss',
  fireLabel: 'WATER FIST',
  fireIcon: 'fist',
  kickLabel: 'WHIRLWIND',
  eSkill: { label: 'FA JIN SMASH', action: 'garou_fajin', icon: 'slam' },
  fSkill: { label: 'CONSTELLATION', action: 'garou_dash', icon: 'sonic_dash' },
  qSkill: { label: 'GAMMA RAY BURST', action: 'garou_gamma', icon: 'abyss' },
  colorA: 'border-cyan-400/85',
  colorB: 'border-purple-400/85',
  colorQ: 'border-amber-300',
});

const ANOS_CONTROLS = makeHeroControls({
  operatorId: 'anos_voldigoad',
  wheelVariant: 'anime_crest',
  themeAccent: '#a855f7',
  ringBorder: 'border-red-500/85',
  powerUpLabel: 'TYRANT SOURCE',
  powerUpReadyLabel: 'VENUZDONOA!',
  powerUpGradient: 'from-purple-500 via-red-600 to-zinc-900',
  badgeIcon: 'crimson_eye',
  canFly: true,
  fireLabel: 'JIO GRAZE',
  fireIcon: 'crimson_eye',
  kickLabel: 'TYRANT HIT',
  eSkill: { label: 'EYES OF CHAOS', action: 'anos_eyes', icon: 'crimson_eye' },
  fSkill: { label: 'GATUM WARP', action: 'anos_venuzdonoa', icon: 'blade' },
  qSkill: { label: 'EGIL GRONE', action: 'anos_egil', icon: 'sun_flame' },
  colorA: 'border-purple-400/85',
  colorB: 'border-red-400/85',
  colorQ: 'border-rose-500',
});

const ITACHI_CONTROLS = makeHeroControls({
  operatorId: 'itachi_uchiha',
  wheelVariant: 'anime_crest',
  themeAccent: '#dc2626',
  ringBorder: 'border-red-500/85',
  powerUpLabel: 'MANGEKYO SUSANOO',
  powerUpReadyLabel: 'TSUKUYOMI!',
  powerUpGradient: 'from-red-500 via-orange-500 to-zinc-950',
  badgeIcon: 'crimson_eye',
  fireLabel: 'SHARINGAN',
  fireIcon: 'crimson_eye',
  kickLabel: 'CROW KICK',
  eSkill: { label: 'AMATERASU', action: 'itachi_amaterasu', icon: 'sun_flame' },
  fSkill: { label: 'CROW CLONE', action: 'itachi_crows', icon: 'blink' },
  qSkill: { label: 'TSUKUYOMI', action: 'itachi_tsukuyomi', icon: 'crimson_eye' },
  colorA: 'border-red-500/85',
  colorB: 'border-orange-400/85',
  colorQ: 'border-rose-500',
});

const SASUKE_CONTROLS = makeHeroControls({
  operatorId: 'sasuke_uchiha',
  wheelVariant: 'anime_crest',
  themeAccent: '#818cf8',
  ringBorder: 'border-violet-400/85',
  powerUpLabel: 'RINNEGAN SIX PATHS',
  powerUpReadyLabel: "INDRA'S ARROW!",
  powerUpGradient: 'from-sky-300 via-violet-500 to-purple-800',
  badgeIcon: 'crimson_eye',
  fireLabel: 'CHIDORI',
  fireIcon: 'lightning',
  kickLabel: 'LION BARRAGE',
  eSkill: { label: 'KIRIN THUNDER', action: 'sasuke_kirin', icon: 'lightning' },
  fSkill: { label: 'AMENOTEJIKARA', action: 'sasuke_warp', icon: 'blink' },
  qSkill: { label: "INDRA'S ARROW", action: 'sasuke_indra', icon: 'katana' },
  colorA: 'border-cyan-400/85',
  colorB: 'border-violet-400/85',
  colorQ: 'border-purple-400',
});

const OPERATOR_CONTROL_MAP: Record<string, OperatorControlProfile> = {
  saitama: SAITAMA_CONTROLS,
  son_goku: GOKU_CONTROLS,
  superman: SUPERMAN_CONTROLS,
  silvester_jais: SILVESTER_CONTROLS,
  dre_titan: DRE_CONTROLS,
  the_truth: TRUTH_CONTROLS,
  heiliea_valkyrie: HEILIEA_CONTROLS,
  the_baby: BABY_CONTROLS,
  zenitsu_agatsuma: ZENITSU_CONTROLS,
  tanjiro_kamado: TANJIRO_CONTROLS,
  muzan_kibutsuji: MUZAN_CONTROLS,
  maxwell_shodron: MAXWELL_CONTROLS,
  king_opm: KING_CONTROLS,
  the_flash: FLASH_CONTROLS,
  green_lantern: LANTERN_CONTROLS,
  shazam_champion: SHAZAM_CONTROLS,
  thor_odinson: THOR_CONTROLS,
  iron_man: IRON_MAN_CONTROLS,
  spider_man: SPIDER_MAN_CONTROLS,
  doctor_strange: DOCTOR_STRANGE_CONTROLS,
  scarlet_witch: SCARLET_WITCH_CONTROLS,
  batman: BATMAN_CONTROLS,
  wonder_woman: WONDER_WOMAN_CONTROLS,
  aquaman: AQUAMAN_CONTROLS,
  rimuru_tempest: RIMURU_CONTROLS,
  sung_jinwoo: JINWOO_CONTROLS,
  naruto_uzumaki: NARUTO_CONTROLS,
  monkey_d_luffy: LUFFY_CONTROLS,
  satoru_gojo: GOJO_CONTROLS,
  yuji_itadori: YUJI_CONTROLS,
  garou_opm: GAROU_CONTROLS,
  anos_voldigoad: ANOS_CONTROLS,
  itachi_uchiha: ITACHI_CONTROLS,
  sasuke_uchiha: SASUKE_CONTROLS,
  spectre_neon: SPECTRE_CONTROLS,
  vanguard_recon: VANGUARD_CONTROLS,
  reaper_apex: REAPER_CONTROLS,
};

export function getControlProfileForOperator(operatorId: string): OperatorControlProfile {
  return OPERATOR_CONTROL_MAP[operatorId] || VANGUARD_CONTROLS;
}
