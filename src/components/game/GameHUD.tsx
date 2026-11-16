import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Crosshair,
  Trophy,
  Radio,
  Sparkles,
  RefreshCw,
  Eye,
  Zap,
  Move,
  Check,
  RotateCcw,
  ZoomIn,
} from 'lucide-react';
import { CombatEngine } from '../../game/combatEngine';
import {
  CombatantScore,
  CustomHudLayout,
  KillFeedEntry,
  OperatorData,
  WeaponData,
  EndOfMatchStats,
  ChatMessage,
  QuickCommsType,
  GameSettings,
  MaxwellElement,
} from '../../types/game';
import { CAMERA_VIEWPOINT_PRESETS, DEFAULT_SETTINGS } from '../../data/gameData';
import {
  ControlActionType,
  DEFAULT_HUD_LAYOUT,
  OperatorWheelButtonSpec,
  SILVESTER_15_POWERS,
  WheelLayoutVariant,
  getControlProfileForOperator,
} from '../../data/operatorControls';
import { soundEngine } from '../../audio/soundEngine';
import { EndOfMatchScreen } from './EndOfMatchScreen';
import { SettingsLayer } from '../layers/SettingsLayer';

interface GameHUDProps {
  engine: CombatEngine;
  operator: OperatorData;
  settings?: GameSettings;
  onUpdateSettings?: (settings: GameSettings) => void;
  onExitMatch: () => void;
  onPlayAgain: () => void;
  onOpenStore?: () => void;
}

type RadarBlip = {
  id: string;
  dx: number;
  dz: number;
  kind: 'bot' | 'powerup';
};

type HudSlotKey = keyof CustomHudLayout;

const HUD_SLOT_NAMES: Record<HudSlotKey, string> = {
  minimap: 'Minimap & HP',
  powerUp: 'Power-Up Bar',
  joystick: 'Move Joystick',
  actionWheel: 'Attack Section',
  skillBar: 'Skill Section',
};

const MAXWELL_ELEMENT_UI: Record<
  MaxwellElement,
  { short: string; title: string; hex: string; btnClass: string }
> = {
  arcane: {
    short: 'ARC',
    title: 'Arcane (-30% Mana)',
    hex: '#c084fc',
    btnClass: 'border-violet-400 bg-violet-600/40 text-violet-100',
  },
  fire: {
    short: 'FIRE',
    title: 'Pyro (+35% DMG & Burn Immune)',
    hex: '#fb923c',
    btnClass: 'border-orange-400 bg-orange-600/40 text-orange-100',
  },
  lightning: {
    short: 'VOLT',
    title: 'Lightning (+38% Speed & Cast)',
    hex: '#38bdf8',
    btnClass: 'border-sky-400 bg-sky-600/40 text-sky-100',
  },
  frost: {
    short: 'ICE',
    title: 'Frost (Chill & Shield Regen)',
    hex: '#67e8f9',
    btnClass: 'border-cyan-400 bg-cyan-600/40 text-cyan-100',
  },
  void: {
    short: 'VOID',
    title: 'Void (+45% DMG & Lifesteal)',
    hex: '#f43f5e',
    btnClass: 'border-rose-400 bg-rose-600/40 text-rose-100',
  },
};

const NEW_HERO_IDS = new Set([
  'iron_man',
  'spider_man',
  'doctor_strange',
  'scarlet_witch',
  'batman',
  'wonder_woman',
  'aquaman',
  'rimuru_tempest',
  'sung_jinwoo',
  'naruto_uzumaki',
  'monkey_d_luffy',
  'satoru_gojo',
  'yuji_itadori',
  'garou_opm',
  'anos_voldigoad',
  'itachi_uchiha',
  'sasuke_uchiha',
]);

const NEW_HERO_CHATTER: Record<string, string[]> = {
  iron_man: ['Iron Man: J.A.R.V.I.S., arm Mark 85 nanotech and lock missiles.', 'Overwatch: Arc Reactor signature at 400%.'],
  spider_man: ['Spider-Man: Spider-Sense is tingling! Webbing perimeter now!', 'Overwatch: Agile hostiles swinging overhead!'],
  doctor_strange: ['Dr. Strange: By the Hoary Hosts of Hoggoth, seal the Mirror Dimension.', 'Overwatch: Eldritch Sling Ring portal detected!'],
  scarlet_witch: ['Scarlet Witch: Chaos magic rewrites reality—stand aside.', 'Overwatch: Hex probability spike in sector!'],
  batman: ['Batman: Smoke deployed. They will never see the Dark Knight coming.', 'Overwatch: WayneTech stealth cowl active!'],
  wonder_woman: ['Wonder Woman: Athena guides my shield and the Lasso of Truth!', 'Overwatch: Amazonian warrior shockwave detected!'],
  aquaman: ['Aquaman: By the Trident of Poseidon, summon the abyssal tide!', 'Overwatch: Atlantean hydro-tempest rising!'],
  rimuru_tempest: ['Rimuru: Ciel, analyze hostile magicules and prepare Beelzebuth!', 'Overwatch: Demon Lord True Dragon aura detected!'],
  sung_jinwoo: ['Sung Jin-Woo: ARISE. My shadow soldiers, swallow them whole.', 'Overwatch: Shadow Monarch army emerging!'],
  naruto_uzumaki: ['Naruto: Believe it! Kurama and I are going all out—Rasenshuriken!', 'Overwatch: Nine-Tails Six Paths chakra surging!'],
  monkey_d_luffy: ['Luffy: Shishishi! Gear 5 heartbeat—let’s turn this arena into rubber!', 'Overwatch: Yonko Conqueror Haki shockwave!'],
  satoru_gojo: ['Satoru Gojo: Throughout Heaven and Earth, I alone am the Honored One.', 'Overwatch: Limitless Hollow Purple warning!'],
  yuji_itadori: ['Yuji Itadori: Lock in... Sparks of Black don’t choose who they bless—BLACK FLASH!', 'Overwatch: Cursed Energy black spark critical!'],
  garou_opm: ['Garou: Mode: Saitama. Time to shatter every martial art on Earth!', 'Overwatch: Cosmic Fear God-level threat detected!'],
  anos_voldigoad: ['Anos Voldigoad: Did you really think destroying my body would kill me?', 'Overwatch: Venuzdonoa reason-erasure field!'],
  itachi_uchiha: ['Itachi Uchiha: You are already caught inside my Tsukuyomi.', 'Overwatch: Mangekyo Amaterasu black flames!'],
  sasuke_uchiha: ['Sasuke Uchiha: Six Paths Rinnegan—feel the wrath of Kirin and Indra’s Arrow!', 'Overwatch: Susanoo lightning discharge!'],
};

const getWheelShellStyles = (variant: WheelLayoutVariant): { className: string; style?: React.CSSProperties } => {
  switch (variant) {
    // Bespoke stylized shells preserved for Superman, Son Goku, Maxwell Shodron, and Saitama
    case 'kryptonian_diamond':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 border-2 border-red-500/80 bg-gradient-to-b from-blue-950/70 via-zinc-950/75 to-red-950/70 shadow-[0_0_24px_rgba(239,68,68,0.35)] p-3',
        style: {
          clipPath: 'polygon(50% 0%, 98% 34%, 80% 98%, 20% 98%, 2% 34%)',
        },
      };
    case 'saiyan_orbit':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 border-cyan-400/80 bg-gradient-to-br from-sky-950/55 via-zinc-950/60 to-amber-950/45 shadow-[0_0_24px_rgba(56,189,248,0.35)] p-2.5 sm:p-3 ring-2 ring-amber-400/35 ring-offset-2 ring-offset-transparent',
      };
    case 'arcane_sigil':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 border-2 border-violet-400/85 bg-gradient-to-br from-violet-950/75 via-zinc-950/75 to-amber-950/55 shadow-[0_0_24px_rgba(192,132,252,0.42)] p-2.5 sm:p-3',
        style: {
          clipPath: 'polygon(30% 2%, 70% 2%, 98% 30%, 98% 70%, 70% 98%, 30% 98%, 2% 70%, 2% 30%)',
        },
      };
    case 'hero_cross':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 border-white/35 bg-zinc-950/35 shadow-[0_0_20px_rgba(255,255,255,0.1)] p-2.5 sm:p-3',
      };

    // Clean, organized, unclipped tactical cards for all other characters
    case 'cyber_hex':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-pink-500/75 bg-zinc-950/75 shadow-[0_0_20px_rgba(236,72,153,0.28)] p-2.5 sm:p-3',
      };
    case 'tactical_arc':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-sky-400/70 bg-slate-950/75 shadow-[0_0_18px_rgba(56,189,248,0.22)] p-2.5 sm:p-3',
      };
    case 'heavy_octa':
    case 'sonic_equalizer':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-orange-500/75 bg-zinc-950/75 shadow-[0_0_20px_rgba(249,115,22,0.28)] p-2.5 sm:p-3',
      };
    case 'king_crown':
    case 'veritas_eye':
    case 'thunder_breath':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-amber-400/80 bg-zinc-950/78 shadow-[0_0_22px_rgba(251,191,36,0.3)] p-2.5 sm:p-3',
      };
    case 'speed_bolt':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-yellow-400/80 bg-gradient-to-br from-red-950/75 via-zinc-950/80 to-amber-950/70 shadow-[0_0_22px_rgba(250,204,21,0.3)] p-2.5 sm:p-3',
      };
    case 'lantern_ring':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-950/75 via-zinc-950/80 to-teal-950/70 shadow-[0_0_22px_rgba(34,197,94,0.3)] p-2.5 sm:p-3',
      };
    case 'shazam_crest':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-yellow-300/80 bg-gradient-to-b from-red-950/75 via-zinc-950/80 to-amber-950/70 shadow-[0_0_22px_rgba(253,224,71,0.3)] p-2.5 sm:p-3',
      };
    case 'asgard_rune':
    case 'rattle_burst':
    case 'water_sun_breath':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-sky-400/80 bg-zinc-950/78 shadow-[0_0_22px_rgba(56,189,248,0.3)] p-2.5 sm:p-3',
      };
    case 'sovereign_omega':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-amber-300/85 bg-gradient-to-br from-indigo-950/82 via-zinc-950/85 to-violet-950/80 shadow-[0_0_24px_rgba(56,189,248,0.35)] p-2.5 sm:p-3',
      };
    case 'valkyrie_wing':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-pink-400/80 bg-gradient-to-br from-rose-950/75 via-zinc-950/80 to-pink-950/75 shadow-[0_0_22px_rgba(244,114,182,0.3)] p-2.5 sm:p-3',
      };
    case 'marvel_tactical':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-red-500/80 bg-gradient-to-br from-red-950/78 via-zinc-950/82 to-slate-950/80 shadow-[0_0_22px_rgba(239,68,68,0.3)] p-2.5 sm:p-3',
      };
    case 'dc_emblem':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-sky-400/80 bg-gradient-to-br from-slate-950/82 via-zinc-950/85 to-amber-950/70 shadow-[0_0_22px_rgba(56,189,248,0.3)] p-2.5 sm:p-3',
      };
    case 'anime_crest':
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-violet-400/80 bg-gradient-to-br from-violet-950/80 via-zinc-950/82 to-amber-950/70 shadow-[0_0_22px_rgba(168,85,247,0.32)] p-2.5 sm:p-3',
      };
    case 'demon_king':
    default:
      return {
        className:
          'relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-rose-500/80 bg-gradient-to-br from-rose-950/75 via-zinc-950/85 to-purple-950/75 shadow-[0_0_22px_rgba(244,63,94,0.32)] p-2.5 sm:p-3',
      };
  }
};

const renderControlIcon = (icon: OperatorWheelButtonSpec['icon'], isMeleeFist?: boolean) => {
  switch (icon) {
    case 'fist':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <path
            d="M7 17 C7 12, 10 9, 15 9 L25 9 C28 9, 30 11, 30 14 L30 22 C30 25, 27 27, 23 27 L12 27 C9 27, 7 24, 7 17 Z"
            fill="#f6c78d"
            stroke="#18181b"
            strokeWidth="2.2"
          />
          <path d="M13 9 L13 16 M18 9 L18 16 M23 9 L23 16" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 20 L19 20" stroke="#18181b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'jump':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-white">
          <circle cx="18" cy="6" r="2.6" />
          <path d="M16 9.5 L12 15 L17 17.5 L14 24 L16.5 25 L20.5 16.5 L16 14 L18.5 11 L23 13 L24 10.5 Z" />
          <path d="M11 16 L7 13 L8.5 11 L13 13.5 Z" />
          <path d="M19 18.5 L24 23 L22 25 L17.5 20 Z" />
        </svg>
      );
    case 'kick':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-white">
          <circle cx="11" cy="7" r="2.5" />
          <path d="M12 10 L15 16 L26 11 L27 13.5 L15.5 19.5 L12.5 27 L10 26.5 L12 18 L8.5 14 Z" />
          <path d="M10 11.5 L6.5 14 L8 16 L11.5 13 Z" />
        </svg>
      );
    case 'slide':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-white">
          <circle cx="21" cy="9" r="2.4" />
          <path d="M19 12 L14 19 L5 21 L5.5 23.5 L15.5 22 L19.5 17 L24 23 L26 21.5 L20.5 14.5 Z" />
          <path d="M6 12 L13 12 M4 16 L10 16" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'kamehameha':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <circle cx="18" cy="18" r="10" fill="#0ea5e9" opacity="0.35" />
          <circle cx="18" cy="18" r="6.5" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2.2" />
          <path d="M18 4 L20 11 M18 25 L20 32 M4 18 L11 18 M25 18 L32 18" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'spirit_bomb':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <circle cx="18" cy="14" r="9" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
          <circle cx="18" cy="14" r="4.5" fill="#ffffff" />
          <path d="M12 28 L18 22 L24 28" stroke="#e2e8f0" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'teleport':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-sky-300" strokeWidth="2">
          <path d="M16 4 L20 13 L28 13 L21 19 L23 28 L16 22 L9 28 L11 19 L4 13 L12 13 Z" />
        </svg>
      );
    case 'flight':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-sky-200" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4 L23 15 L18 15 L18 26 L14 26 L14 15 L9 15 Z" fill="rgba(56,189,248,0.28)" />
          <path d="M6 21 L10 18 M26 21 L22 18" />
        </svg>
      );
    case 'laser_eyes':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <circle cx="12" cy="13" r="3.4" fill="#fef08a" stroke="#ef4444" strokeWidth="1.8" />
          <circle cx="24" cy="13" r="3.4" fill="#fef08a" stroke="#ef4444" strokeWidth="1.8" />
          <path d="M11 16 L6 31 M13 16 L13 31 M23 16 L23 31 M25 16 L30 31" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'breath':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-cyan-200" strokeWidth="2" strokeLinecap="round">
          <path d="M6 18 Q13 12 22 15 Q28 17 30 13" />
          <path d="M6 21 Q15 24 27 22" />
          <path d="M18 8 L20 12 L18 16 M27 8 L25 11 L29 11" />
        </svg>
      );
    case 'sonic_dash':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-sky-300" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 16 L24 16 M18 10 L26 16 L18 22" />
          <path d="M7 10 L14 10 M7 22 L14 22" opacity="0.65" />
        </svg>
      );
    case 'blade':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-fuchsia-300" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 26 L26 6 M18 6 L26 6 L26 14" />
          <path d="M8 18 L14 24" />
        </svg>
      );
    case 'dash':
      return <Zap className="w-5 h-5 text-cyan-300" />;
    case 'scope':
      return <Eye className="w-5 h-5 text-cyan-300" />;
    case 'slam':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-orange-300" strokeWidth="2.2" strokeLinecap="round">
          <path d="M16 5 L16 21 M10 15 L16 21 L22 15 M6 26 L26 26" />
        </svg>
      );
    case 'sigil':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <polygon points="18,4 30,25 6,25" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="18,32 30,11 6,11" fill="none" stroke="#facc15" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="18" cy="18" r="3.6" fill="#e9d5ff" />
        </svg>
      );
    case 'stasis':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-cyan-300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5 H23 M9 27 H23 M10 5 L16 15 L22 5 M10 27 L16 17 L22 27" />
          <circle cx="16" cy="16" r="11" strokeDasharray="3 3" opacity="0.55" />
        </svg>
      );
    case 'blink':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-fuchsia-300" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="16" cy="16" rx="9" ry="12" strokeDasharray="4 2" />
          <path d="M12 16 L20 16 M16 11 L21 16 L16 21" />
        </svg>
      );
    case 'barrier':
      return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-violet-300" strokeWidth="2.1" strokeLinejoin="round">
          <polygon points="16,4 26,10 26,22 16,28 6,22 6,10" fill="rgba(192,132,252,0.2)" />
          <circle cx="16" cy="16" r="4" fill="#facc15" stroke="none" />
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <path d="M6 25 L9 12 L15 18 L18 8 L21 18 L27 12 L30 25 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="6" y="25" width="24" height="4" rx="1" fill="#dc2626" />
        </svg>
      );
    case 'lightning':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <polygon points="21,4 10,20 17,20 15,32 26,16 19,16" fill="#fde047" stroke="#dc2626" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'ring':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <circle cx="18" cy="18" r="9" fill="none" stroke="#4ade80" strokeWidth="3.2" />
          <line x1="9" y1="9" x2="27" y2="9" stroke="#86efac" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="9" y1="27" x2="27" y2="27" stroke="#86efac" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="18" cy="18" r="3.5" fill="#bbf7d0" />
        </svg>
      );
    case 'bolt':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <polygon points="22,3 9,19 16,19 14,33 27,15 20,15" fill="#fef08a" stroke="#b45309" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'hammer':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
          <rect x="9" y="7" width="18" height="10" rx="2" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="2" />
          <rect x="16" y="17" width="4" height="13" rx="1" fill="#78350f" />
          <path d="M5 10 L8 13 M31 10 L28 13" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'meteor':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <circle cx="20" cy="20" r="8" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <path d="M6 6 L14 14 M11 5 L17 11 M5 12 L11 18" stroke="#86efac" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'vortex':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-amber-300" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 10 Q18 6 30 10" />
          <path d="M9 17 Q18 14 27 17" />
          <path d="M12 24 Q18 22 24 24" />
          <path d="M16 30 L20 30" />
        </svg>
      );
    case 'omega':
      return (
        <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7 fill-none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="14" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="4 2" />
          <path
            d="M11 27 H15 V23 C12 21 10.5 18 10.5 15 C10.5 10.5 13.8 7.5 18 7.5 C22.2 7.5 25.5 10.5 25.5 15 C25.5 18 24 21 21 23 V27 H25"
            stroke="#fde047"
            strokeWidth="2.6"
          />
        </svg>
      );
    case 'blackhole':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <circle cx="18" cy="18" r="11" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="5 3" />
          <circle cx="18" cy="18" r="5.5" fill="#09090b" stroke="#f0abfc" strokeWidth="2" />
        </svg>
      );
    case 'snowflake':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 stroke-cyan-300 fill-none" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="5" x2="18" y2="31" />
          <line x1="7" y1="11.5" x2="29" y2="24.5" />
          <line x1="29" y1="11.5" x2="7" y2="24.5" />
        </svg>
      );
    case 'bass':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <circle cx="18" cy="18" r="11" fill="#18181b" stroke="#f97316" strokeWidth="2.2" />
          <circle cx="18" cy="18" r="5" fill="#fb923c" />
          <path d="M5 12 Q3 18 5 24 M31 12 Q33 18 31 24" fill="none" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'truth_eye':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <path d="M4 18 Q18 6 32 18 Q18 30 4 18 Z" fill="#1e293b" stroke="#fbbf24" strokeWidth="2.2" />
          <circle cx="18" cy="18" r="5" fill="#fde047" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="2" fill="#09090b" />
        </svg>
      );
    case 'wing':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-pink-300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 26 Q10 10 30 7 Q22 15 24 22 Q16 20 12 27 Z" fill="rgba(244,114,182,0.28)" />
          <path d="M12 18 L24 14 M10 22 L20 20" />
        </svg>
      );
    case 'rattle':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <circle cx="22" cy="13" r="7" fill="#38bdf8" stroke="#fef08a" strokeWidth="2.2" />
          <path d="M16 19 L9 27" stroke="#fde047" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="8" cy="28" r="3" fill="#fb7185" />
        </svg>
      );
    case 'katana':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 30 L28 8" stroke="#e2e8f0" strokeWidth="2.8" />
          <path d="M11 21 L15 25" stroke="#facc15" strokeWidth="3" />
          <path d="M5 31 L12 24" stroke="#f59e0b" strokeWidth="3.2" />
        </svg>
      );
    case 'water_wave':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-cyan-300" strokeWidth="2.3" strokeLinecap="round">
          <path d="M5 17 Q12 8 20 16 Q26 22 31 14" />
          <path d="M6 24 Q14 17 22 23 Q28 27 31 21" />
        </svg>
      );
    case 'sun_flame':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <circle cx="18" cy="18" r="6" fill="#fde047" stroke="#ea580c" strokeWidth="2" />
          <path d="M18 4 L20 10 M18 26 L20 32 M4 18 L10 18 M26 18 L32 18 M8 8 L12 12 M24 24 L28 28 M28 8 L24 12 M12 24 L8 28" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'demon_whip':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-rose-400" strokeWidth="2.4" strokeLinecap="round">
          <path d="M6 28 Q14 14 20 22 Q26 28 30 8" />
          <path d="M26 11 L30 8 L31 13" />
        </svg>
      );
    case 'web':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-slate-100" strokeWidth="1.9" strokeLinecap="round">
          <circle cx="18" cy="18" r="11" />
          <circle cx="18" cy="18" r="5.5" />
          <path d="M18 4 V32 M4 18 H32 M8 8 L28 28 M28 8 L8 28" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <path d="M18 4 L30 9 V18 C30 25 24 30 18 32 C12 30 6 25 6 18 V9 Z" fill="#dc2626" stroke="#fde047" strokeWidth="2.2" />
          <polygon points="18,11 20.5,16 26,16.5 22,20 23,25.5 18,22.5 13,25.5 14,20 10,16.5 15.5,16" fill="#fef08a" />
        </svg>
      );
    case 'batarang':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <path d="M4 14 Q11 10 15 16 L18 11 L21 16 Q25 10 32 14 L26 23 Q21 20 18 25 Q15 20 10 23 Z" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'trident':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-amber-300" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 5 V31 M10 7 V15 Q10 19 18 19 Q26 19 26 15 V7" />
          <path d="M18 5 L15 9 M18 5 L21 9 M10 7 L8 10 M26 7 L28 10" />
        </svg>
      );
    case 'dagger':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 28 L28 8 L22 10 L12 20 Z" fill="#c084fc" stroke="#a855f7" strokeWidth="1.8" />
          <path d="M6 30 L12 24 M11 21 L15 25" stroke="#e9d5ff" strokeWidth="2.4" />
        </svg>
      );
    case 'rasengan':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <circle cx="18" cy="18" r="10" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
          <path d="M11 18 A7 7 0 0 1 25 14 M25 18 A7 7 0 0 1 11 22" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="18" r="3.2" fill="#f97316" />
        </svg>
      );
    case 'strawhat':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <ellipse cx="18" cy="22" rx="13" ry="4.5" fill="#facc15" stroke="#854d0e" strokeWidth="1.6" />
          <path d="M10 20 C10 11 26 11 26 20 Z" fill="#fde047" stroke="#854d0e" strokeWidth="1.6" />
          <path d="M10 19 H26" stroke="#dc2626" strokeWidth="3" />
        </svg>
      );
    case 'infinity':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-sky-300" strokeWidth="2.6" strokeLinecap="round">
          <path d="M18 18 C14 11 6 11 6 18 C6 25 14 25 18 18 C22 11 30 11 30 18 C30 25 22 25 18 18 Z" />
        </svg>
      );
    case 'crimson_eye':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <circle cx="18" cy="18" r="10.5" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.8" />
          <circle cx="18" cy="18" r="6" fill="none" stroke="#18181b" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="2.6" fill="#09090b" />
          <circle cx="18" cy="12" r="1.5" fill="#09090b" />
          <circle cx="12.8" cy="21" r="1.5" fill="#09090b" />
          <circle cx="23.2" cy="21" r="1.5" fill="#09090b" />
        </svg>
      );
    case 'abyss':
      return (
        <svg viewBox="0 0 36 36" className="w-5 h-5 sm:w-6 sm:h-6">
          <polygon points="18,4 24,14 33,18 24,22 18,32 12,22 3,18 12,14" fill="#7e22ce" stroke="#f43f5e" strokeWidth="1.8" />
          <circle cx="18" cy="18" r="4" fill="#09090b" stroke="#e9d5ff" strokeWidth="1.5" />
        </svg>
      );
    case 'transform':
      return <RefreshCw className="w-5 h-5 text-amber-300" />;
    case 'crosshair':
    default:
      return isMeleeFist ? (
        <Zap className="w-5 h-5 text-amber-300" />
      ) : (
        <Crosshair className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      );
  }
};

export const GameHUD: React.FC<GameHUDProps> = ({
  engine,
  operator,
  settings = DEFAULT_SETTINGS,
  onUpdateSettings,
  onExitMatch,
  onPlayAgain,
  onOpenStore,
}) => {
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [kiEnergy, setKiEnergy] = useState(100);
  const [stagger, setStagger] = useState(100);
  const [isStaggered, setIsStaggered] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [isThermalOverload, setIsThermalOverload] = useState(false);
  const [isChargingKi, setIsChargingKi] = useState(false);
  const [magicElement, setMagicElement] = useState<MaxwellElement>(engine.currentMagicElement || 'arcane');
  const [ammo, setAmmo] = useState({ current: 30, reserve: 120 });
  const [weapon, setWeapon] = useState<WeaponData>(engine.getCurrentWeapon());
  const [isADS, setIsADS] = useState(false);
  const [isThirdPerson, setIsThirdPerson] = useState(engine.isThirdPerson);
  const [isReloading, setIsReloading] = useState(false);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const [scores, setScores] = useState<CombatantScore[]>([]);
  const [hitmarker, setHitmarker] = useState<{ isHeadshot: boolean; damage: number } | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; duration: number } | null>(null);
  const [endMatchStats, setEndMatchStats] = useState<EndOfMatchStats | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);

  // Live On-Screen Drag & Resize HUD Layout Editor & Live Camera Zoom Editor
  const [isEditingHud, setIsEditingHud] = useState(false);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [editingSlot, setEditingSlot] = useState<HudSlotKey>('actionWheel');
  const draggingHudSlot = useRef<HudSlotKey | null>(null);
  const hudRootRef = useRef<HTMLDivElement>(null);

  // Minimap radar blips
  const [radarBlips, setRadarBlips] = useState<RadarBlip[]>([]);

  // Tactical Communication & Connection
  const [showCommsMenu, setShowCommsMenu] = useState(false);
  const [activeCallout, setActiveCallout] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'System',
      isPlayer: false,
      text: 'Match active [EU-WEST 24ms].',
      time: '00:01',
      channel: 'system',
    },
  ]);

  // Persistent Bottom-Left Analog Joystick state
  const [joyOffset, setJoyOffset] = useState({ x: 0, y: 0 });
  const joyContainerRef = useRef<HTMLDivElement>(null);
  const joyTouchId = useRef<number | null>(null);
  const joyMouseActive = useRef<boolean>(false);

  // Screen swipe & mouse drag 360 camera look
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lookMouseActive = useRef<boolean>(false);
  const lookMouseMoved = useRef<boolean>(false);
  const msgSeqRef = useRef<number>(0);

  const profile = getControlProfileForOperator(operator.id);
  const isSaitama = operator.id === 'saitama';
  const isGoku = operator.id === 'son_goku';
  const isSuperman = operator.id === 'superman';
  const isMaxwell = operator.id === 'maxwell_shodron';
  const isKing = operator.id === 'king_opm';
  const isFlash = operator.id === 'the_flash';
  const isLantern = operator.id === 'green_lantern';
  const isShazam = operator.id === 'shazam_champion';
  const isThor = operator.id === 'thor_odinson';
  const isSilvester = operator.id === 'silvester_jais';
  const isDre = operator.id === 'dre_titan';
  const isTruth = operator.id === 'the_truth';
  const isHeiliea = operator.id === 'heiliea_valkyrie';
  const isBaby = operator.id === 'the_baby';
  const isZenitsu = operator.id === 'zenitsu_agatsuma';
  const isTanjiro = operator.id === 'tanjiro_kamado';
  const isMuzan = operator.id === 'muzan_kibutsuji';
  const isNewHero = NEW_HERO_IDS.has(operator.id);
  const canFlyHero =
    isSuperman ||
    isLantern ||
    isShazam ||
    isThor ||
    isSilvester ||
    isTruth ||
    isHeiliea ||
    operator.id === 'iron_man' ||
    operator.id === 'doctor_strange' ||
    operator.id === 'scarlet_witch' ||
    operator.id === 'wonder_woman' ||
    operator.id === 'rimuru_tempest' ||
    operator.id === 'satoru_gojo' ||
    operator.id === 'anos_voldigoad';
  const hudLayout: CustomHudLayout = {
    ...DEFAULT_HUD_LAYOUT,
    ...(localSettings.hudLayout || {}),
  };
  const wheelShell = getWheelShellStyles(profile.wheelVariant);
  const activeElementUi = MAXWELL_ELEMENT_UI[magicElement];

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Connect Engine Callbacks
  useEffect(() => {
    const prevOnMatchOver = engine.callbacks.onMatchOver;
    engine.callbacks = {
      onHealthChanged: (h: number, a: number) => {
        setHealth(h);
        setArmor(a);
      },
      onAmmoChanged: (cur: number, res: number) => {
        setAmmo({ current: cur, reserve: res });
      },
      onWeaponChanged: (w: WeaponData) => {
        setWeapon(w);
      },
      onKillFeed: (entry: KillFeedEntry) => {
        setKillFeed(prev => [entry, ...prev.filter(k => k.id !== entry.id).slice(0, 3)]);
      },
      onScoresUpdated: (newScores: CombatantScore[]) => {
        setScores(newScores);
      },
      onMatchOver: (winner: string, isPlayerWinner: boolean) => {
        prevOnMatchOver?.(winner, isPlayerWinner);
        const stats = engine.buildEndOfMatchStats(isPlayerWinner);
        setEndMatchStats(stats);
      },
      onMatchOverWithStats: (stats: EndOfMatchStats) => {
        setEndMatchStats(stats);
      },
      onHitmarker: (isHeadshot: boolean, damage: number) => {
        setHitmarker({ isHeadshot, damage });
        setTimeout(() => setHitmarker(null), 180);
      },
      onPowerUpActive: (type: string, duration: number) => {
        setActivePowerUp({ type, duration });
        setTimeout(() => setActivePowerUp(null), duration * 1000);
      },
      onKiChanged: (energy: number) => {
        setKiEnergy(energy);
      },
      onStaggerChanged: (nextStagger: number, staggered: boolean) => {
        setStagger(nextStagger);
        setIsStaggered(staggered);
      },
      onFlightChanged: (flying: boolean) => {
        setIsFlying(flying);
      },
      onThermalOverloadChanged: (active: boolean) => {
        setIsThermalOverload(active);
      },
      onElementChanged: (element: MaxwellElement) => {
        setMagicElement(element);
      },
    };
  }, [engine]);

  // Minimap radar refresh loop (10Hz)
  useEffect(() => {
    const interval = setInterval(() => {
      if (showSettings || endMatchStats) return;
      const state = engine.getRadarState();
      const cos = Math.cos(state.playerYaw);
      const sin = Math.sin(state.playerYaw);
      const radarRange = 42;
      const blips: RadarBlip[] = [];

      state.bots.forEach(bot => {
        if (!bot.isAlive) return;
        const wx = bot.x - state.playerX;
        const wz = bot.z - state.playerZ;
        const rx = wx * cos - wz * sin;
        const rz = wx * sin + wz * cos;
        blips.push({
          id: bot.id,
          dx: Math.max(-1, Math.min(1, rx / radarRange)),
          dz: Math.max(-1, Math.min(1, rz / radarRange)),
          kind: 'bot',
        });
      });

      state.powerUps.forEach(pUp => {
        if (!pUp.isAvailable) return;
        const wx = pUp.x - state.playerX;
        const wz = pUp.z - state.playerZ;
        const rx = wx * cos - wz * sin;
        const rz = wx * sin + wz * cos;
        blips.push({
          id: pUp.id,
          dx: Math.max(-1, Math.min(1, rx / radarRange)),
          dz: Math.max(-1, Math.min(1, rz / radarRange)),
          kind: 'powerup',
        });
      });

      setRadarBlips(blips);
    }, 100);

    return () => clearInterval(interval);
  }, [engine, showSettings, endMatchStats]);

  // Periodic squad communication chatter
  useEffect(() => {
    const chatInterval = setInterval(() => {
      if (endMatchStats || showSettings) return;
      const chatterList = NEW_HERO_CHATTER[operator.id]
        ? NEW_HERO_CHATTER[operator.id]
        : isSuperman
        ? ['Superman: Solar levels rising. Watching the skyline.', 'Overwatch: Hostile armor compromised!']
        : isGoku
        ? ['Goku: Let’s see if you can handle this Kamehameha!', 'Ghost_07: Enemy spotted mid!']
        : isMaxwell
        ? ['Maxwell: Astral runes aligned. Chronos Stasis ready.', 'Overwatch: Arcane energy spike detected!']
        : isKing
        ? ['King: *King Engine roaring* Stay calm... they are terrified!', 'Overwatch: S-Class Rank 7 intimidation spike!']
        : isFlash
        ? ['Flash: Blink and you’ll miss me across the arena!', 'Overwatch: Speed Force surge detected!']
        : isLantern
        ? ['Green Lantern: Willpower ring at 100%. Constructing perimeter.', 'Overwatch: Emerald construct inbound!']
        : isShazam
        ? ['Shazam: Calling down the lightning of Zeus!', 'Overwatch: High-voltage magic surge!']
        : isThor
        ? ['Thor: By Odin’s beard, Mjolnir hungers for battle!', 'Overwatch: Bifrost atmospheric anomaly!']
        : isSilvester
        ? ['Silvester A.Jais: Fifteen Sovereign powers armed. Observe.', 'Overwatch: Omega Sovereign singularity detected!']
        : isDre
        ? ['Dre: 808 subwoofers armed. Drop the bass on their squad!', 'Overwatch: Sonic bass shockwave incoming!']
        : isTruth
        ? ['The Truth: The All-Seeing Eye pierces every illusion.', 'Overwatch: Veritas seal active across sector!']
        : isHeiliea
        ? ['Heiliea: Celestial wings spread. Starlight guides us!', 'Overwatch: Valkyrie starfall strike locked!']
        : isBaby
        ? ['The Baby: Goo-goo ga-ga! *Cosmic Tantrum charging!*', 'Overwatch: Tiny Titan speed anomaly detected!']
        : isZenitsu
        ? ['Zenitsu: I’m terrified... wait—*asleep* Thunder Breathing First Form!', 'Overwatch: Supersonic lightning slash detected!']
        : isTanjiro
        ? ['Tanjiro: Total Concentration, Hinokami Kagura—keep moving forward!', 'Overwatch: Water and Sun Breathing blade active!']
        : isMuzan
        ? ['Muzan: Submit to the Demon King or perish in black blood.', 'Overwatch: Regenerative Demon King threat Alert!']
        : isSaitama
        ? ['Saitama: Wait, is the supermarket sale today?', 'Apex_Sniper: Enemy flank left!']
        : ['Overwatch: Hostiles active in sector.', 'Ghost_07: Moving in!'];

      const randomChat = chatterList[Math.floor(Math.random() * chatterList.length)];
      const [sender, text] = randomChat.split(':');
      setChatMessages(prev => [
        ...prev.slice(-2),
        {
          id: `chat_${Date.now()}_${++msgSeqRef.current}`,
          sender,
          isPlayer: false,
          text,
          time: 'Live',
          channel: 'team',
        },
      ]);
    }, 16000);

    return () => clearInterval(chatInterval);
  }, [endMatchStats, showSettings, operator.id, isGoku, isSaitama, isSuperman, isMaxwell, isKing, isFlash, isLantern, isShazam, isThor, isSilvester, isDre, isTruth, isHeiliea, isBaby, isZenitsu, isTanjiro, isMuzan]);

  // Desktop Keyboard + Arrow Keys Free-Look + Mouse Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditingHud) {
          setIsEditingHud(false);
          return;
        }
        setShowSettings(prev => !prev);
        return;
      }
      if (showSettings || endMatchStats || isEditingHud) return;

      // Movement (Front, Back, Left, Right)
      if (e.key === 'w' || e.key === 'W') engine.moveInput.y = 1;
      if (e.key === 's' || e.key === 'S') engine.moveInput.y = -1;
      if (e.key === 'a' || e.key === 'A') engine.moveInput.x = -1;
      if (e.key === 'd' || e.key === 'D') engine.moveInput.x = 1;

      // Arrow keys let player see around 360 degrees smoothly anytime (including 180-deg laser eye sweep!)
      if (e.key === 'ArrowLeft') engine.lookInput.x = -1;
      if (e.key === 'ArrowRight') engine.lookInput.x = 1;
      if (e.key === 'ArrowUp') engine.lookInput.y = -1;
      if (e.key === 'ArrowDown') engine.lookInput.y = 1;

      if (e.key === ' ' || e.code === 'Space') engine.jump();
      if (e.key === 'e' || e.key === 'E') {
        if (isSuperman) engine.triggerSuperBreath();
        else if (isGoku) engine.triggerKamehameha();
        else if (isMaxwell) engine.triggerChronoStasis();
        else if (isKing) engine.triggerKingEngine();
        else if (isFlash) engine.triggerFlashVortex();
        else if (isLantern) engine.triggerLanternConstruct();
        else if (isShazam) engine.triggerShazamBolt();
        else if (isThor) engine.triggerThorThunderSlam();
        else if (isSilvester) engine.triggerSilvesterTimeFreeze();
        else if (isDre) engine.triggerDreBassDrop();
        else if (isTruth) engine.triggerTruthSeal();
        else if (isHeiliea) engine.triggerHeilieaStarfall();
        else if (isBaby) engine.triggerBabyTantrum();
        else if (isZenitsu) engine.triggerZenitsuThunderclap();
        else if (isTanjiro) engine.triggerTanjiroWaterWheel();
        else if (isMuzan) engine.triggerMuzanWhipStorm();
        else if (isNewHero) engine.triggerAbility('special');
        else engine.triggerKick();
      }
      if (e.key === 'Shift') engine.triggerSlide();
      if (e.key === 'c' || e.key === 'C') {
        setIsChargingKi(true);
        engine.triggerAbility('charge');
      }
      if (e.key === 'q' || e.key === 'Q') {
        if (isSuperman) engine.triggerThermalOverload();
        else if (isGoku) engine.triggerSpiritBomb();
        else if (isMaxwell) engine.triggerArcaneNova();
        else if (isKing) engine.triggerKingHellfire();
        else if (isFlash) engine.triggerFlashUltimate();
        else if (isLantern) engine.triggerLanternBeam();
        else if (isShazam) engine.triggerShazamUltimate();
        else if (isThor) engine.triggerThorBifrost();
        else if (isSilvester) engine.triggerSilvesterOmegaApocalypse();
        else if (isDre) engine.triggerDreOmegaMixtape();
        else if (isTruth) engine.triggerTruthAbsolute();
        else if (isHeiliea) engine.triggerHeilieaCelestialNova();
        else if (isBaby) engine.triggerBabyCryingWave();
        else if (isZenitsu) engine.triggerZenitsuFlamingDragon();
        else if (isTanjiro) engine.triggerTanjiroSunDragon();
        else if (isMuzan) engine.triggerMuzanShockwave();
        else engine.triggerAbility('super');
      }
      if (e.key === 'f' || e.key === 'F') {
        if (isSuperman || isShazam) engine.triggerSuperSpeedDash();
        else if (isMaxwell) engine.triggerArcaneBlink();
        else if (isKing) engine.triggerKingSaitamaAssist();
        else if (isFlash) engine.triggerFlashPhase();
        else if (isLantern) engine.triggerLanternShield();
        else if (isThor) engine.triggerThorHammerThrow();
        else if (isSilvester) engine.triggerSilvesterTachyonStep();
        else if (isDre) engine.triggerDreSubStep();
        else if (isTruth) engine.triggerTruthVeilShift();
        else if (isHeiliea) engine.triggerHeilieaSeraphHeal();
        else if (isBaby) engine.triggerBabyCrawlZoom();
        else if (isZenitsu) engine.triggerZenitsuSixfold();
        else if (isTanjiro) engine.triggerTanjiroHinokamiDash();
        else if (isMuzan) engine.triggerMuzanBloodStep();
        else if (isNewHero) engine.triggerAbility('teleport');
        else engine.triggerAbility('special');
      }
      if (e.key === 'x' || e.key === 'X') {
        if (canFlyHero) engine.toggleFlight();
        else if (isMaxwell) engine.triggerAetherBarrier();
      }
      if (e.key === 't' || e.key === 'T') {
        if (isMaxwell) engine.transmuteElement();
        else if (isSilvester) engine.triggerSilvesterDivineOverdrive();
        else if (isDre) engine.triggerDreAmplify();
        else if (isTruth) engine.triggerTruthTrueSight();
        else if (isBaby) engine.triggerBabyNapShield();
        else if (isNewHero || operator.skins.length > 1) engine.transformNextForm();
      }
      if (e.key === 'r' || e.key === 'R') {
        engine.reload();
        setIsReloading(true);
        setTimeout(() => setIsReloading(false), engine.getCurrentWeapon().reloadTime * 1000);
      }
      if (e.key === '1') engine.switchWeapon(0);
      if (e.key === '2') engine.switchWeapon(1);
      if (e.key === 'v' || e.key === 'V') {
        const next = !engine.isThirdPerson;
        engine.setThirdPerson(next);
        setIsThirdPerson(next);
      }
      if (e.key === 'z' || e.key === 'Z') {
        setIsEditingHud(false);
        setIsEditingZoom(prev => !prev);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowScoreboard(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'w' || e.key === 'W') && engine.moveInput.y > 0) engine.moveInput.y = 0;
      if ((e.key === 's' || e.key === 'S') && engine.moveInput.y < 0) engine.moveInput.y = 0;
      if ((e.key === 'a' || e.key === 'A') && engine.moveInput.x < 0) engine.moveInput.x = 0;
      if ((e.key === 'd' || e.key === 'D') && engine.moveInput.x > 0) engine.moveInput.x = 0;

      if (e.key === 'ArrowLeft' && engine.lookInput.x < 0) engine.lookInput.x = 0;
      if (e.key === 'ArrowRight' && engine.lookInput.x > 0) engine.lookInput.x = 0;
      if (e.key === 'ArrowUp' && engine.lookInput.y < 0) engine.lookInput.y = 0;
      if (e.key === 'ArrowDown' && engine.lookInput.y > 0) engine.lookInput.y = 0;

      if (e.key === 'c' || e.key === 'C') {
        setIsChargingKi(false);
        engine.stopKiCharging();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (showSettings || endMatchStats || isEditingHud) return;
      if (document.pointerLockElement) {
        engine.lookDelta.x += e.movementX;
        engine.lookDelta.y += e.movementY;
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [engine, showSettings, endMatchStats, isEditingHud, operator.id, operator.skins.length, isNewHero, isGoku, isSuperman, isMaxwell, isKing, isFlash, isLantern, isShazam, isThor, isSilvester, isDre, isTruth, isHeiliea, isBaby, isZenitsu, isTanjiro, isMuzan, canFlyHero]);

  // Release pointer lock when Settings, HUD Editor, or Live Zoom Editor opens
  useEffect(() => {
    if ((showSettings || isEditingHud || isEditingZoom) && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }, [showSettings, isEditingHud, isEditingZoom]);

  // Execute any operator-specific control action
  const executeControlAction = (action: ControlActionType, phase: 'down' | 'up' | 'click') => {
    if (isEditingHud) return;

    if (action === 'fire_hold') {
      if (phase === 'down') engine.startFiring();
      else if (phase === 'up') engine.stopFiring();
      return;
    }

    if (phase === 'up') return;

    switch (action) {
      case 'jump':
        engine.jump();
        break;
      case 'kick':
        engine.triggerKick();
        break;
      case 'slide':
        engine.triggerSlide();
        break;
      case 'kamehameha':
        engine.triggerKamehameha();
        break;
      case 'spirit_bomb':
        engine.triggerSpiritBomb();
        break;
      case 'instant_tp':
        engine.triggerAbility('teleport');
        break;
      case 'flight_toggle':
        engine.toggleFlight();
        break;
      case 'super_dash':
        engine.triggerSuperSpeedDash();
        break;
      case 'super_breath':
        engine.triggerSuperBreath();
        break;
      case 'thermal_overload':
        engine.triggerThermalOverload();
        break;
      case 'serious_punch':
        if (kiEnergy >= 70) engine.triggerAbility('super');
        else engine.triggerAbility('special');
        break;
      case 'consecutive':
        engine.triggerAbility('special');
        break;
      case 'ads_toggle': {
        const next = !engine.isADS;
        engine.setADS(next);
        setIsADS(next);
        break;
      }
      case 'reload':
        engine.reload();
        setIsReloading(true);
        setTimeout(() => setIsReloading(false), engine.getCurrentWeapon().reloadTime * 1000);
        break;
      case 'cloak_dash':
        engine.triggerAbility('teleport');
        engine.triggerSlide();
        break;
      case 'sonar_ping':
        soundEngine.playQuickComms('Sonar Pulse Active!');
        engine.triggerAbility('special');
        break;
      case 'overdrive_slam':
        engine.triggerKick();
        if (kiEnergy >= 60) engine.triggerAbility('super');
        break;
      case 'arcane_blink':
        engine.triggerArcaneBlink();
        break;
      case 'chrono_stasis':
        engine.triggerChronoStasis();
        break;
      case 'aether_barrier':
        engine.triggerAetherBarrier();
        break;
      case 'arcane_nova':
        engine.triggerArcaneNova();
        break;
      case 'magic_transmission':
        engine.transmuteElement();
        break;
      case 'king_engine':
        engine.triggerKingEngine();
        break;
      case 'king_assist':
        engine.triggerKingSaitamaAssist();
        break;
      case 'king_hellfire':
        engine.triggerKingHellfire();
        break;
      case 'flash_phase':
        engine.triggerFlashPhase();
        break;
      case 'flash_vortex':
        engine.triggerFlashVortex();
        break;
      case 'flash_ultimate':
        engine.triggerFlashUltimate();
        break;
      case 'lantern_shield':
        engine.triggerLanternShield();
        break;
      case 'lantern_construct':
        engine.triggerLanternConstruct();
        break;
      case 'lantern_beam':
        engine.triggerLanternBeam();
        break;
      case 'shazam_bolt':
        engine.triggerShazamBolt();
        break;
      case 'shazam_ultimate':
        engine.triggerShazamUltimate();
        break;
      case 'thor_throw':
        engine.triggerThorHammerThrow();
        break;
      case 'thor_slam':
        engine.triggerThorThunderSlam();
        break;
      case 'thor_bifrost':
        engine.triggerThorBifrost();
        break;
      case 'silvester_time_freeze':
        engine.triggerSilvesterTimeFreeze();
        break;
      case 'silvester_singularity':
        engine.triggerSilvesterSingularity();
        break;
      case 'silvester_meteor_rain':
        engine.triggerSilvesterMeteorRain();
        break;
      case 'silvester_divine_overdrive':
        engine.triggerSilvesterDivineOverdrive();
        break;
      case 'silvester_mirror_cloak':
        engine.triggerSilvesterMirrorCloak();
        break;
      case 'silvester_tachyon_step':
        engine.triggerSilvesterTachyonStep();
        break;
      case 'silvester_solar_nova':
        engine.triggerSilvesterSolarNova();
        break;
      case 'silvester_zero_blizzard':
        engine.triggerSilvesterZeroBlizzard();
        break;
      case 'silvester_hellfire':
        engine.triggerSilvesterHellfire();
        break;
      case 'silvester_thunder_chain':
        engine.triggerSilvesterThunderChain();
        break;
      case 'silvester_soul_drain':
        engine.triggerSilvesterSoulDrain();
        break;
      case 'silvester_reality_slash':
        engine.triggerSilvesterRealitySlash();
        break;
      case 'silvester_sovereign_roar':
        engine.triggerSilvesterSovereignRoar();
        break;
      case 'silvester_omega_apocalypse':
        engine.triggerSilvesterOmegaApocalypse();
        break;
      case 'dre_bass_drop':
        engine.triggerDreBassDrop();
        break;
      case 'dre_sub_step':
        engine.triggerDreSubStep();
        break;
      case 'dre_amplify':
        engine.triggerDreAmplify();
        break;
      case 'dre_omega_mixtape':
        engine.triggerDreOmegaMixtape();
        break;
      case 'truth_seal':
        engine.triggerTruthSeal();
        break;
      case 'truth_veil_shift':
        engine.triggerTruthVeilShift();
        break;
      case 'truth_true_sight':
        engine.triggerTruthTrueSight();
        break;
      case 'truth_absolute':
        engine.triggerTruthAbsolute();
        break;
      case 'heiliea_seraph_heal':
        engine.triggerHeilieaSeraphHeal();
        break;
      case 'heiliea_starfall':
        engine.triggerHeilieaStarfall();
        break;
      case 'heiliea_celestial_nova':
        engine.triggerHeilieaCelestialNova();
        break;
      case 'baby_tantrum':
        engine.triggerBabyTantrum();
        break;
      case 'baby_crawl_zoom':
        engine.triggerBabyCrawlZoom();
        break;
      case 'baby_nap_shield':
        engine.triggerBabyNapShield();
        break;
      case 'baby_crying_wave':
        engine.triggerBabyCryingWave();
        break;
      case 'zenitsu_thunderclap':
        engine.triggerZenitsuThunderclap();
        break;
      case 'zenitsu_sixfold':
        engine.triggerZenitsuSixfold();
        break;
      case 'zenitsu_flaming_dragon':
        engine.triggerZenitsuFlamingDragon();
        break;
      case 'tanjiro_water_wheel':
        engine.triggerTanjiroWaterWheel();
        break;
      case 'tanjiro_hinokami_dash':
        engine.triggerTanjiroHinokamiDash();
        break;
      case 'tanjiro_sun_dragon':
        engine.triggerTanjiroSunDragon();
        break;
      case 'muzan_whip_storm':
        engine.triggerMuzanWhipStorm();
        break;
      case 'muzan_blood_step':
        engine.triggerMuzanBloodStep();
        break;
      case 'muzan_shockwave':
        engine.triggerMuzanShockwave();
        break;
      case 'transform_form':
        engine.transformNextForm();
        break;
      case 'iron_missiles':
        engine.triggerIronMissiles();
        break;
      case 'iron_nano_shield':
        engine.triggerIronNanoShield();
        break;
      case 'iron_unibeam':
        engine.triggerIronUnibeam();
        break;
      case 'spider_web_bomb':
        engine.triggerSpiderWebBomb();
        break;
      case 'spider_zip':
        engine.triggerSpiderZip();
        break;
      case 'spider_overload':
        engine.triggerSpiderOverload();
        break;
      case 'strange_mirror_seal':
        engine.triggerStrangeMirrorSeal();
        break;
      case 'strange_portal':
        engine.triggerStrangePortal();
        break;
      case 'strange_vishanti':
        engine.triggerStrangeVishanti();
        break;
      case 'wanda_reality_warp':
        engine.triggerWandaRealityWarp();
        break;
      case 'wanda_telekinesis':
        engine.triggerWandaTelekinesis();
        break;
      case 'wanda_chaos_nova':
        engine.triggerWandaChaosNova();
        break;
      case 'batman_smoke':
        engine.triggerBatmanSmoke();
        break;
      case 'batman_grapnel':
        engine.triggerBatmanGrapnel();
        break;
      case 'batman_hellbat':
        engine.triggerBatmanHellbat();
        break;
      case 'ww_bracelets':
        engine.triggerWwBracelets();
        break;
      case 'ww_lasso':
        engine.triggerWwLasso();
        break;
      case 'ww_godstrike':
        engine.triggerWwGodstrike();
        break;
      case 'aquaman_tidal':
        engine.triggerAquamanTidal();
        break;
      case 'aquaman_surge':
        engine.triggerAquamanSurge();
        break;
      case 'aquaman_kraken':
        engine.triggerAquamanKraken();
        break;
      case 'rimuru_beelzebuth':
        engine.triggerRimuruBeelzebuth();
        break;
      case 'rimuru_storm':
        engine.triggerRimuruStorm();
        break;
      case 'rimuru_azathoth':
        engine.triggerRimuruAzathoth();
        break;
      case 'jinwoo_rulers':
        engine.triggerJinwooRulers();
        break;
      case 'jinwoo_exchange':
        engine.triggerJinwooExchange();
        break;
      case 'jinwoo_arise':
        engine.triggerJinwooArise();
        break;
      case 'naruto_rasenshuriken':
        engine.triggerNarutoRasenshuriken();
        break;
      case 'naruto_blitz':
        engine.triggerNarutoBlitz();
        break;
      case 'naruto_bijuu':
        engine.triggerNarutoBijuu();
        break;
      case 'luffy_red_roc':
        engine.triggerLuffyRedRoc();
        break;
      case 'luffy_culverin':
        engine.triggerLuffyCulverin();
        break;
      case 'luffy_bajrang':
        engine.triggerLuffyBajrang();
        break;
      case 'gojo_red':
        engine.triggerGojoRed();
        break;
      case 'gojo_infinity':
        engine.triggerGojoInfinity();
        break;
      case 'gojo_purple':
        engine.triggerGojoPurple();
        break;
      case 'yuji_black_flash':
        engine.triggerYujiBlackFlash();
        break;
      case 'yuji_step':
        engine.triggerYujiStep();
        break;
      case 'yuji_shrine':
        engine.triggerYujiShrine();
        break;
      case 'garou_fajin':
        engine.triggerGarouFajin();
        break;
      case 'garou_dash':
        engine.triggerGarouDash();
        break;
      case 'garou_gamma':
        engine.triggerGarouGamma();
        break;
      case 'anos_eyes':
        engine.triggerAnosEyes();
        break;
      case 'anos_venuzdonoa':
        engine.triggerAnosVenuzdonoa();
        break;
      case 'anos_egil':
        engine.triggerAnosEgil();
        break;
      case 'itachi_amaterasu':
        engine.triggerItachiAmaterasu();
        break;
      case 'itachi_crows':
        engine.triggerItachiCrows();
        break;
      case 'itachi_tsukuyomi':
        engine.triggerItachiTsukuyomi();
        break;
      case 'sasuke_kirin':
        engine.triggerSasukeKirin();
        break;
      case 'sasuke_warp':
        engine.triggerSasukeWarp();
        break;
      case 'sasuke_indra':
        engine.triggerSasukeIndra();
        break;
    }
  };

  // Persistent Analog Joystick helpers
  const updateJoystickFromPoint = (clientX: number, clientY: number) => {
    const el = joyContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxRadius = rect.width * 0.36;

    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const kx = dist > 0.5 ? Math.cos(angle) * clamped : 0;
    const ky = dist > 0.5 ? Math.sin(angle) * clamped : 0;

    setJoyOffset({ x: kx, y: ky });
    engine.moveInput.x = kx / maxRadius;
    engine.moveInput.y = -ky / maxRadius;
  };

  const resetJoystick = () => {
    joyTouchId.current = null;
    joyMouseActive.current = false;
    setJoyOffset({ x: 0, y: 0 });
    engine.moveInput.x = 0;
    engine.moveInput.y = 0;
  };

  const handleSettingsChange = (next: GameSettings) => {
    setLocalSettings(next);
    engine.updateSettings(next);
    onUpdateSettings?.(next);
  };

  // Live On-Screen HUD Layout update helpers
  const updateHudSlot = (slot: HudSlotKey, patch: Partial<{ x: number; y: number; scale: number }>) => {
    const nextLayout: CustomHudLayout = {
      ...hudLayout,
      [slot]: { ...hudLayout[slot], ...patch },
    };
    handleSettingsChange({ ...localSettings, hudLayout: nextLayout });
  };

  const handleHudDragMove = (clientX: number, clientY: number) => {
    if (!isEditingHud || !draggingHudSlot.current || !hudRootRef.current) return;
    const rect = hudRootRef.current.getBoundingClientRect();
    const px = Math.max(6, Math.min(94, ((clientX - rect.left) / rect.width) * 100));
    const py = Math.max(8, Math.min(92, ((clientY - rect.top) / rect.height) * 100));
    updateHudSlot(draggingHudSlot.current, { x: Math.round(px), y: Math.round(py) });
  };

  // Screen swipe camera look (see around freely anywhere outside buttons)
  const handleViewportTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (showSettings || endMatchStats || isEditingHud) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== joyTouchId.current && lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleViewportTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isEditingHud && draggingHudSlot.current) {
      const t = e.touches[0];
      if (t) handleHudDragMove(t.clientX, t.clientY);
      return;
    }
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joyTouchId.current) {
        updateJoystickFromPoint(touch.clientX, touch.clientY);
      } else if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        engine.lookDelta.x += dx * 1.35;
        engine.lookDelta.y += dy * 1.35;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleViewportTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    draggingHudSlot.current = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joyTouchId.current) {
        resetJoystick();
      } else if (touch.identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  };

  const sendComms = (_type: QuickCommsType, label: string) => {
    soundEngine.playQuickComms(label);
    setActiveCallout(label);
    setTimeout(() => setActiveCallout(null), 2600);
    setShowCommsMenu(false);
    setChatMessages(prev => [
      ...prev.slice(-2),
      {
        id: `comms_${Date.now()}_${++msgSeqRef.current}`,
        sender: operator.name,
        isPlayer: true,
        text: label.toUpperCase(),
        time: 'Now',
        channel: 'team',
      },
    ]);
  };

  const activeEditTransform = hudLayout[editingSlot];

  return (
    <div
      ref={hudRootRef}
      className="absolute inset-0 z-30 select-none overflow-hidden touch-none"
      onWheel={e => {
        if (showSettings || endMatchStats || showScoreboard || isEditingHud) return;
        const curZoom = localSettings.cameraZoom ?? DEFAULT_SETTINGS.cameraZoom ?? 1.0;
        const step = e.deltaY > 0 ? 0.08 : -0.08;
        const nextZoom = Math.max(0.55, Math.min(2.2, Number((curZoom + step).toFixed(2))));
        if (nextZoom !== curZoom) {
          handleSettingsChange({ ...localSettings, cameraZoom: nextZoom });
        }
      }}
      onTouchStart={handleViewportTouchStart}
      onTouchMove={handleViewportTouchMove}
      onTouchEnd={handleViewportTouchEnd}
      onTouchCancel={handleViewportTouchEnd}
      onMouseMove={e => {
        if (isEditingHud && draggingHudSlot.current) {
          handleHudDragMove(e.clientX, e.clientY);
          return;
        }
        if (joyMouseActive.current) {
          updateJoystickFromPoint(e.clientX, e.clientY);
        } else if (lookMouseActive.current && !document.pointerLockElement) {
          const dx = e.clientX - lastLookPos.current.x;
          const dy = e.clientY - lastLookPos.current.y;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            lookMouseMoved.current = true;
          }
          engine.lookDelta.x += dx * 1.2;
          engine.lookDelta.y += dy * 1.2;
          lastLookPos.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onMouseUp={e => {
        draggingHudSlot.current = null;
        if (joyMouseActive.current) {
          resetJoystick();
        }
        if (lookMouseActive.current) {
          if (!lookMouseMoved.current && e.button === 0 && !showSettings && !endMatchStats && !isEditingHud) {
            engine.startFiring();
            setTimeout(() => engine.stopFiring(), 120);
          }
          lookMouseActive.current = false;
          lookMouseMoved.current = false;
        }
      }}
      onMouseDown={e => {
        if (showSettings || endMatchStats || isEditingHud) return;
        if (e.target === e.currentTarget) {
          if (document.pointerLockElement && e.button === 0) {
            engine.startFiring();
            setTimeout(() => engine.stopFiring(), 120);
          } else if (e.button === 0) {
            lookMouseActive.current = true;
            lookMouseMoved.current = false;
            lastLookPos.current = { x: e.clientX, y: e.clientY };
          }
        }
      }}
    >
      {/* SUPERMAN THERMAL OVERLOAD: CRIMSON SCREEN EDGE GLOW */}
      {isThermalOverload && (
        <>
          <div className="absolute inset-0 pointer-events-none z-10 border-[12px] border-red-600/70 shadow-[inset_0_0_95px_rgba(239,68,68,0.75)] animate-pulse" />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-3 py-1 rounded-full bg-red-950/90 border border-red-400 text-[10px] font-mono-tactical font-black text-amber-200 tracking-widest uppercase shadow-[0_0_20px_rgba(239,68,68,0.6)]">
            THERMAL OVERLOAD · SWEEP 180° TO MELT TARGETS
          </div>
        </>
      )}

      {/* LOW HEALTH PULSING RED EDGE (<30 HP) */}
      {health < 30 && !isThermalOverload && (
        <div className="absolute inset-0 pointer-events-none z-10 border-[10px] border-red-600/45 shadow-[inset_0_0_65px_rgba(239,68,68,0.45)]" />
      )}

      {/* LIVE HUD EDIT MODE TOOLBAR & ALIGNMENT GRID */}
      {isEditingHud && (
        <>
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(251,191,36,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(251,191,36,0.08) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-zinc-950/95 border-2 border-amber-400 rounded px-3 py-2.5 shadow-2xl space-y-2 pointer-events-auto"
            onClick={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <Move className="w-4 h-4 text-amber-400" />
                <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                  DRAG SECTIONS &amp; ADJUST SIZE
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    soundEngine.playUIClick('tab');
                    handleSettingsChange({ ...localSettings, hudLayout: DEFAULT_HUD_LAYOUT });
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-[10px] font-mono-tactical text-zinc-300 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playUIClick('select');
                    setIsEditingHud(false);
                  }}
                  className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-heading font-black uppercase flex items-center space-x-1"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>DONE</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-0.5">
              {(Object.keys(HUD_SLOT_NAMES) as HudSlotKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => {
                    soundEngine.playUIClick('tab');
                    setEditingSlot(key);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono-tactical uppercase border whitespace-nowrap shrink-0 transition-all ${
                    editingSlot === key
                      ? 'bg-amber-500 text-black border-amber-300 font-black'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {HUD_SLOT_NAMES[key]} ({Math.round(hudLayout[key].scale * 100)}%)
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1.5 rounded">
              <span className="text-[10px] font-mono-tactical text-amber-400 font-black shrink-0 min-w-[78px]">
                SIZE: {Math.round(activeEditTransform.scale * 100)}%
              </span>
              <button
                onClick={() =>
                  updateHudSlot(editingSlot, {
                    scale: Math.max(0.6, Math.round((activeEditTransform.scale - 0.05) * 100) / 100),
                  })
                }
                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center shrink-0"
              >
                -
              </button>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={activeEditTransform.scale}
                onChange={e => updateHudSlot(editingSlot, { scale: parseFloat(e.target.value) })}
                className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() =>
                  updateHudSlot(editingSlot, {
                    scale: Math.min(1.5, Math.round((activeEditTransform.scale + 0.05) * 100) / 100),
                  })
                }
                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center shrink-0"
              >
                +
              </button>
            </div>
          </div>
        </>
      )}

      {/* LIVE IN-GAME CAMERA ZOOM & VIEWING POINT EDITOR */}
      {isEditingZoom && (() => {
        const camZoom = localSettings.cameraZoom ?? DEFAULT_SETTINGS.cameraZoom ?? 1.0;
        const camFov = localSettings.cameraFov ?? DEFAULT_SETTINGS.cameraFov ?? 54;
        const camHeight = localSettings.cameraHeight ?? DEFAULT_SETTINGS.cameraHeight ?? 0.0;
        const camShoulder = localSettings.cameraShoulder ?? DEFAULT_SETTINGS.cameraShoulder ?? 0.0;
        const distM = (2.15 * camZoom).toFixed(2);

        return (
          <div
            className="absolute top-12 right-3 z-40 w-[92%] max-w-sm bg-zinc-950/92 border-2 border-amber-400 rounded px-3 py-2.5 shadow-2xl space-y-2.5 pointer-events-auto"
            onClick={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 min-w-0">
                <ZoomIn className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-heading font-black text-xs text-white uppercase tracking-wider truncate">
                  LIVE CAMERA ZOOM
                </span>
                <span className="text-[10px] font-mono-tactical text-amber-300 font-bold shrink-0">
                  {camZoom.toFixed(2)}x · {camFov}°
                </span>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => {
                    const next = !isThirdPerson;
                    engine.setThirdPerson(next);
                    setIsThirdPerson(next);
                    soundEngine.playUIClick('tab');
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-cyan-400 text-[10px] font-mono-tactical text-cyan-300 font-bold"
                >
                  {isThirdPerson ? '3RD' : '1ST'}
                </button>
                <button
                  onClick={() => {
                    soundEngine.playUIClick('tab');
                    handleSettingsChange({
                      ...localSettings,
                      cameraZoom: 1.0,
                      cameraFov: 54,
                      cameraHeight: 0.0,
                      cameraShoulder: 0.0,
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-[10px] font-mono-tactical text-zinc-300 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playUIClick('select');
                    setIsEditingZoom(false);
                  }}
                  className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-heading font-black uppercase flex items-center space-x-1"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>DONE</span>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1">
              {CAMERA_VIEWPOINT_PRESETS.map(preset => {
                const isMatch =
                  Math.abs(camZoom - preset.cameraZoom) < 0.03 &&
                  Math.abs(camFov - preset.cameraFov) <= 1 &&
                  Math.abs(camHeight - preset.cameraHeight) < 0.04 &&
                  Math.abs(camShoulder - preset.cameraShoulder) < 0.04;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      soundEngine.playUIClick('select');
                      handleSettingsChange({
                        ...localSettings,
                        cameraZoom: preset.cameraZoom,
                        cameraFov: preset.cameraFov,
                        cameraHeight: preset.cameraHeight,
                        cameraShoulder: preset.cameraShoulder,
                      });
                    }}
                    className={`py-1 px-1 rounded text-[9px] font-mono-tactical uppercase border transition-all truncate ${
                      isMatch
                        ? 'bg-amber-500 text-black border-amber-300 font-black'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-amber-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Live Sliders Grid */}
            <div className="space-y-1.5">
              {/* Zoom Distance */}
              <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded">
                <span className="text-[10px] font-mono-tactical text-amber-400 font-black shrink-0 min-w-[82px]">
                  ZOOM {distM}m
                </span>
                <button
                  onClick={() =>
                    handleSettingsChange({
                      ...localSettings,
                      cameraZoom: Math.max(0.55, Number((camZoom - 0.06).toFixed(2))),
                    })
                  }
                  className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center shrink-0"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.55"
                  max="2.2"
                  step="0.02"
                  value={camZoom}
                  onChange={e =>
                    handleSettingsChange({ ...localSettings, cameraZoom: parseFloat(e.target.value) })
                  }
                  className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() =>
                    handleSettingsChange({
                      ...localSettings,
                      cameraZoom: Math.min(2.2, Number((camZoom + 0.06).toFixed(2))),
                    })
                  }
                  className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center shrink-0"
                >
                  +
                </button>
              </div>

              {/* FOV Lens */}
              <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded">
                <span className="text-[10px] font-mono-tactical text-cyan-300 font-black shrink-0 min-w-[82px]">
                  FOV {camFov}°
                </span>
                <button
                  onClick={() =>
                    handleSettingsChange({ ...localSettings, cameraFov: Math.max(40, camFov - 2) })
                  }
                  className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center shrink-0"
                >
                  -
                </button>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="1"
                  value={camFov}
                  onChange={e =>
                    handleSettingsChange({ ...localSettings, cameraFov: parseInt(e.target.value, 10) })
                  }
                  className="flex-1 accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() =>
                    handleSettingsChange({ ...localSettings, cameraFov: Math.min(95, camFov + 2) })
                  }
                  className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center shrink-0"
                >
                  +
                </button>
              </div>

              {/* Height & Shoulder side-by-side */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded space-y-0.5">
                  <div className="flex justify-between text-[9px] font-mono-tactical text-zinc-300">
                    <span>HEIGHT</span>
                    <span className="text-amber-300 font-bold">
                      {camHeight >= 0 ? `+${camHeight.toFixed(2)}` : camHeight.toFixed(2)}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.45"
                    max="0.85"
                    step="0.02"
                    value={camHeight}
                    onChange={e =>
                      handleSettingsChange({ ...localSettings, cameraHeight: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded space-y-0.5">
                  <div className="flex justify-between text-[9px] font-mono-tactical text-zinc-300">
                    <span>SHOULDER</span>
                    <span className="text-amber-300 font-bold">
                      {Math.abs(camShoulder) < 0.02
                        ? 'CTR'
                        : camShoulder > 0
                        ? `R+${camShoulder.toFixed(2)}`
                        : `L${camShoulder.toFixed(2)}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.85"
                    max="0.85"
                    step="0.02"
                    value={camShoulder}
                    onChange={e =>
                      handleSettingsChange({ ...localSettings, cameraShoulder: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <p className="text-[9px] font-mono-tactical text-zinc-400 text-center">
              Drag arena view outside this box to orbit &amp; preview · Scroll wheel zooms anytime
            </p>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* 1. MINIMAP RADAR + HEALTH / STAGGER BAR (MOVABLE & RESIZABLE)          */}
      {/* ===================================================================== */}
      <div
        className={`absolute z-20 flex flex-col space-y-1 origin-center transition-transform duration-75 ${
          isEditingHud
            ? `pointer-events-auto cursor-grab active:cursor-grabbing p-1 rounded border-2 ${
                editingSlot === 'minimap' ? 'border-amber-400 bg-amber-500/15' : 'border-white/50 bg-black/40'
              }`
            : 'pointer-events-none'
        }`}
        style={{
          left: `${hudLayout.minimap.x}%`,
          top: `${hudLayout.minimap.y}%`,
          transform: `translate(-50%, -50%) scale(${hudLayout.minimap.scale})`,
        }}
        onMouseDown={e => {
          if (!isEditingHud) return;
          e.stopPropagation();
          setEditingSlot('minimap');
          draggingHudSlot.current = 'minimap';
        }}
        onTouchStart={e => {
          if (!isEditingHud) return;
          e.stopPropagation();
          setEditingSlot('minimap');
          draggingHudSlot.current = 'minimap';
        }}
      >
        {isEditingHud && (
          <div className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-mono-tactical font-black text-center">
            RADAR · {Math.round(hudLayout.minimap.scale * 100)}%
          </div>
        )}
        <div
          className="relative w-24 h-20 sm:w-28 sm:h-24 bg-zinc-950/75 border border-zinc-400/50 rounded-xs overflow-hidden shadow-xl"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.09) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        >
          {radarBlips.map(blip => (
            <div
              key={blip.id}
              className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                blip.kind === 'bot'
                  ? 'bg-red-500 shadow-[0_0_5px_#ef4444]'
                  : 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]'
              }`}
              style={{
                left: `${50 + blip.dx * 44}%`,
                top: `${50 + blip.dz * 44}%`,
              }}
            />
          ))}

          <svg
            viewBox="0 0 16 16"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3"
          >
            <polygon points="8,1 14,14 8,11 2,14" fill="#ffffff" />
          </svg>
        </div>

        {/* Simple Minimalist Health + Stagger Resistance (Superman) + Kills Strip */}
        <div className="w-24 sm:w-28 bg-zinc-950/80 border border-zinc-700/70 px-1.5 py-0.5 rounded-xs space-y-0.5">
          <div className="flex items-center justify-between text-[9px] font-mono-tactical">
            <span className={health < 30 ? 'text-red-400 font-black' : 'text-emerald-400 font-bold'}>
              HP {Math.max(0, health)}
            </span>
            <span className="text-amber-400 font-bold">{engine.kills}/25</span>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-xs overflow-hidden flex">
            <div
              className={`h-full transition-all duration-150 ${
                health < 30 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(0, health)}%` }}
            />
          </div>

          {isSuperman && (
            <>
              <div className="flex items-center justify-between text-[8px] font-mono-tactical pt-0.5">
                <span className={isStaggered ? 'text-red-400 font-black animate-pulse' : 'text-sky-300 font-bold'}>
                  {isStaggered ? 'STAGGERED' : `POISE ${stagger}%`}
                </span>
                {isFlying && <span className="text-amber-300 font-black">FLIGHT</span>}
              </div>
              <div className="h-1 w-full bg-zinc-900 rounded-xs overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-150 ${
                    isStaggered ? 'bg-red-500' : 'bg-sky-400'
                  }`}
                  style={{ width: `${Math.max(0, stagger)}%` }}
                />
              </div>
            </>
          )}
        </div>

        {activePowerUp && (
          <div className="bg-amber-950/90 border border-amber-400 px-2 py-0.5 rounded-xs text-[9px] font-mono-tactical text-amber-300 font-bold flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{activePowerUp.type}</span>
          </div>
        )}
        {activeCallout && (
          <div className="bg-zinc-900/90 border border-amber-500/70 px-2 py-0.5 rounded-xs text-[9px] font-mono-tactical text-amber-300 font-bold">
            RADIO: {activeCallout}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. TOP-RIGHT: SETTINGS + LIVE HUD EDIT + UTILITY BUTTONS               */}
      {/* ===================================================================== */}
      <div
        className="absolute top-3 right-3 z-20 flex flex-col items-end space-y-1.5 pointer-events-auto"
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
      >
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => {
              soundEngine.playUIClick('tab');
              setIsEditingHud(false);
              setIsEditingZoom(prev => !prev);
            }}
            className={`h-7 sm:h-8 px-2 rounded-xs border text-[10px] font-mono-tactical uppercase flex items-center space-x-1 shadow active:scale-95 transition-all ${
              isEditingZoom
                ? 'bg-amber-500 border-amber-300 text-black font-black'
                : 'bg-zinc-900/80 border-zinc-600/70 hover:border-amber-400 text-amber-300'
            }`}
            title="Edit Camera Zoom & Viewing Point Live [Z]"
          >
            <ZoomIn className="w-3 h-3" />
            <span className="hidden sm:inline">ZOOM</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick('tab');
              setIsEditingZoom(false);
              setIsEditingHud(prev => !prev);
            }}
            className={`h-7 sm:h-8 px-2 rounded-xs border text-[10px] font-mono-tactical uppercase flex items-center space-x-1 shadow active:scale-95 transition-all ${
              isEditingHud
                ? 'bg-amber-500 border-amber-300 text-black font-black'
                : 'bg-zinc-900/80 border-zinc-600/70 hover:border-amber-400 text-amber-300'
            }`}
            title="Move & Resize Controls Live"
          >
            <Move className="w-3 h-3" />
            <span className="hidden sm:inline">HUD EDIT</span>
          </button>

          <button
            onClick={() => {
              const next = !isThirdPerson;
              engine.setThirdPerson(next);
              setIsThirdPerson(next);
              soundEngine.playUIClick('tab');
            }}
            className="h-7 sm:h-8 px-2 rounded-xs bg-zinc-900/80 border border-zinc-600/70 hover:border-amber-400 text-zinc-200 text-[10px] font-mono-tactical uppercase flex items-center space-x-1 shadow active:scale-95 transition-all"
            title="Toggle Camera View [V]"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">{isThirdPerson ? '3RD' : '1ST'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick('tab');
              setShowCommsMenu(prev => !prev);
            }}
            className="h-7 sm:h-8 px-2 rounded-xs bg-zinc-900/80 border border-zinc-600/70 hover:border-amber-400 text-amber-300 text-[10px] font-mono-tactical uppercase flex items-center space-x-1 shadow active:scale-95 transition-all"
            title="Tactical Radio"
          >
            <Radio className="w-3 h-3" />
            <span className="hidden sm:inline">RADIO</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick('tab');
              setShowScoreboard(prev => !prev);
            }}
            className="h-7 sm:h-8 px-2 rounded-xs bg-zinc-900/80 border border-zinc-600/70 hover:border-amber-400 text-zinc-200 text-[10px] font-mono-tactical uppercase flex items-center space-x-1 shadow active:scale-95 transition-all"
            title="Leaderboard [Tab]"
          >
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">RANKS</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick('select');
              setIsEditingHud(false);
              setIsEditingZoom(false);
              setShowSettings(true);
            }}
            className="h-8 sm:h-9 px-3 bg-zinc-900/85 hover:bg-zinc-800 border border-zinc-400/60 hover:border-amber-400 text-white font-heading font-bold tracking-wider uppercase text-[11px] sm:text-xs flex items-center space-x-1.5 shadow-xl active:scale-95 transition-all"
            style={{ clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)' }}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-200" />
            <span>SETTINGS</span>
          </button>
        </div>

        {/* Killfeed List */}
        <div className="space-y-1 w-48 sm:w-56 pointer-events-none">
          {killFeed.map(feed => (
            <div
              key={feed.id}
              className="px-2 py-0.5 rounded-xs bg-zinc-950/75 border border-zinc-800/80 text-[9px] sm:text-[10px] font-mono-tactical flex items-center justify-between text-zinc-300"
            >
              <span className={feed.killerIsPlayer ? 'text-amber-400 font-black truncate max-w-[68px]' : 'text-zinc-300 truncate max-w-[68px]'}>
                {feed.killerName}
              </span>
              <span className="text-zinc-500 text-[8px] px-1">{feed.isHeadshot ? 'CRIT' : 'KO'}</span>
              <span className={feed.victimIsPlayer ? 'text-red-400 font-bold truncate max-w-[68px]' : 'text-zinc-400 truncate max-w-[68px]'}>
                {feed.victimName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK COMMS POPUP */}
      {showCommsMenu && (
        <div
          className="absolute top-12 right-4 z-40 bg-zinc-950/95 border border-amber-500/80 p-3 rounded-lg shadow-2xl space-y-1.5 w-52 pointer-events-auto"
          onClick={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
            <span className="text-[11px] font-heading font-black text-amber-400 uppercase tracking-wider">
              TACTICAL COMMS
            </span>
            <button onClick={() => setShowCommsMenu(false)} className="text-xs text-zinc-400 hover:text-white">
              ✕
            </button>
          </div>
          {[
            { type: 'enemy_spotted', label: 'Enemy Spotted!' },
            { type: 'need_backup', label: 'Need Backup Here!' },
            { type: 'ultimate_ready', label: 'Power-Up Ready!' },
            { type: 'rush_mid', label: 'Rush Center!' },
          ].map(com => (
            <button
              key={com.type}
              onClick={() => sendComms(com.type as QuickCommsType, com.label)}
              className="w-full text-left px-2.5 py-1.5 rounded-xs bg-zinc-900 hover:bg-amber-500/20 hover:text-amber-300 text-xs font-mono-tactical border border-zinc-800 transition-all"
            >
              {com.label}
            </button>
          ))}
        </div>
      )}

      {/* CENTER CROSSHAIR & HITMARKER */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-5 h-5 flex items-center justify-center opacity-75">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isThermalOverload ? '#ef4444' : localSettings.crosshairColor || profile.themeAccent }}
          />
          <div className="absolute top-0 w-0.5 h-1.5 bg-white/80" />
          <div className="absolute bottom-0 w-0.5 h-1.5 bg-white/80" />
          <div className="absolute left-0 h-0.5 w-1.5 bg-white/80" />
          <div className="absolute right-0 h-0.5 w-1.5 bg-white/80" />
        </div>

        {hitmarker && (
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div className="absolute w-6 h-0.5 bg-red-500 rotate-45" />
              <div className="absolute w-6 h-0.5 bg-red-500 -rotate-45" />
            </div>
            {hitmarker.isHeadshot && (
              <span className="text-[10px] font-mono-tactical font-black text-amber-400 uppercase tracking-widest mt-6">
                CRIT +{hitmarker.damage}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. OPERATOR POWER-UP GAUGE (BESPOKE PER HERO + MOVABLE & RESIZABLE)    */}
      {/* ===================================================================== */}
      <div
        className={`absolute z-20 flex flex-col items-start pointer-events-auto origin-center transition-transform duration-75 ${
          isEditingHud
            ? `cursor-grab active:cursor-grabbing p-1.5 rounded border-2 ${
                editingSlot === 'powerUp' ? 'border-amber-400 bg-amber-500/15' : 'border-white/50 bg-black/40'
              }`
            : ''
        }`}
        style={{
          left: `${hudLayout.powerUp.x}%`,
          top: `${hudLayout.powerUp.y}%`,
          transform: `translate(-50%, -50%) scale(${hudLayout.powerUp.scale})`,
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => {
          if (!isEditingHud) return;
          e.stopPropagation();
          setEditingSlot('powerUp');
          draggingHudSlot.current = 'powerUp';
        }}
        onTouchStart={e => {
          e.stopPropagation();
          if (isEditingHud) {
            setEditingSlot('powerUp');
            draggingHudSlot.current = 'powerUp';
          }
        }}
      >
        {isEditingHud && (
          <div className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-mono-tactical font-black mb-1">
            POWER-UP · {Math.round(hudLayout.powerUp.scale * 100)}%
          </div>
        )}

        <div
          className="text-[10px] font-heading font-black italic tracking-widest uppercase ml-9 mb-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
          style={{ color: isMaxwell ? activeElementUi.hex : profile.themeAccent }}
        >
          {isMaxwell ? `${magicElement.toUpperCase()} MANA` : profile.powerUpLabel}
        </div>

        <div className="relative flex items-center">
          {/* Hero Emblem Badge */}
          <div
            className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900/95 border-2 flex items-center justify-center shadow-lg -mr-2.5"
            style={{ borderColor: isMaxwell ? activeElementUi.hex : profile.themeAccent }}
          >
            {profile.powerUpBadgeIcon === 'fist' && renderControlIcon('fist')}
            {profile.powerUpBadgeIcon === 'kamehameha' && renderControlIcon('kamehameha')}
            {profile.powerUpBadgeIcon === 'solar' && renderControlIcon('laser_eyes')}
            {profile.powerUpBadgeIcon === 'cyber' && renderControlIcon('blade')}
            {profile.powerUpBadgeIcon === 'radar' && renderControlIcon('scope')}
            {profile.powerUpBadgeIcon === 'reactor' && renderControlIcon('slam')}
            {profile.powerUpBadgeIcon === 'sigil' && renderControlIcon('sigil')}
            {profile.powerUpBadgeIcon === 'crown' && renderControlIcon('crown')}
            {profile.powerUpBadgeIcon === 'lightning' && renderControlIcon('lightning')}
            {profile.powerUpBadgeIcon === 'ring' && renderControlIcon('ring')}
            {profile.powerUpBadgeIcon === 'bolt' && renderControlIcon('bolt')}
            {profile.powerUpBadgeIcon === 'hammer' && renderControlIcon('hammer')}
            {profile.powerUpBadgeIcon === 'omega' && renderControlIcon('omega')}
            {profile.powerUpBadgeIcon === 'bass' && renderControlIcon('bass')}
            {profile.powerUpBadgeIcon === 'truth_eye' && renderControlIcon('truth_eye')}
            {profile.powerUpBadgeIcon === 'wing' && renderControlIcon('wing')}
            {profile.powerUpBadgeIcon === 'rattle' && renderControlIcon('rattle')}
            {profile.powerUpBadgeIcon === 'katana' && renderControlIcon('katana')}
            {profile.powerUpBadgeIcon === 'sun_flame' && renderControlIcon('sun_flame')}
            {profile.powerUpBadgeIcon === 'demon_whip' && renderControlIcon('demon_whip')}
            {profile.powerUpBadgeIcon === 'web' && renderControlIcon('web')}
            {profile.powerUpBadgeIcon === 'shield' && renderControlIcon('shield')}
            {profile.powerUpBadgeIcon === 'batarang' && renderControlIcon('batarang')}
            {profile.powerUpBadgeIcon === 'trident' && renderControlIcon('trident')}
            {profile.powerUpBadgeIcon === 'dagger' && renderControlIcon('dagger')}
            {profile.powerUpBadgeIcon === 'rasengan' && renderControlIcon('rasengan')}
            {profile.powerUpBadgeIcon === 'strawhat' && renderControlIcon('strawhat')}
            {profile.powerUpBadgeIcon === 'infinity' && renderControlIcon('infinity')}
            {profile.powerUpBadgeIcon === 'crimson_eye' && renderControlIcon('crimson_eye')}
            {profile.powerUpBadgeIcon === 'abyss' && renderControlIcon('abyss')}
          </div>

          {/* Skewed Power-Up Meter Container */}
          <div
            className="w-28 sm:w-36 h-5 sm:h-6 bg-zinc-950/75 border-2 border-zinc-200/80 overflow-hidden shadow-xl flex items-center"
            style={{
              clipPath: 'polygon(0 28%, 100% 0%, 90% 100%, 0 100%)',
            }}
          >
            <div
              className={`h-full transition-all duration-150 bg-gradient-to-r ${profile.powerUpGradient}`}
              style={{ width: `${Math.max(8, kiEnergy)}%` }}
            />
          </div>
        </div>

        {/* Capsule Button below Power-Up Bar (Hold: Charge Power | Release: Signature Power-Up) */}
        <div className="flex items-center space-x-1.5 ml-14 sm:ml-16 mt-1">
          <button
            onMouseDown={() => {
              if (isEditingHud) return;
              setIsChargingKi(true);
              engine.triggerAbility('charge');
            }}
            onMouseUp={() => {
              if (isEditingHud) return;
              setIsChargingKi(false);
              engine.stopKiCharging();
              executeControlAction(profile.powerUpAction, 'click');
            }}
            onTouchStart={e => {
              e.stopPropagation();
              if (isEditingHud) return;
              setIsChargingKi(true);
              engine.triggerAbility('charge');
            }}
            onTouchEnd={e => {
              e.stopPropagation();
              if (isEditingHud) return;
              setIsChargingKi(false);
              engine.stopKiCharging();
              executeControlAction(profile.powerUpAction, 'click');
            }}
            className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono-tactical font-bold flex items-center space-x-1 shadow transition-all active:scale-90 ${
              kiEnergy >= 45
                ? 'bg-zinc-900/90 text-white border-white/75'
                : 'bg-zinc-800/75 border-white/35 text-zinc-200'
            }`}
            style={kiEnergy >= 45 ? { borderColor: profile.themeAccent, color: profile.themeAccent } : undefined}
            title={`Hold to Charge / Release to Trigger ${profile.powerUpReadyLabel}`}
          >
            <Zap className="w-3 h-3" />
            <span>
              {isThermalOverload
                ? 'BEAMING!'
                : isChargingKi
                ? 'CHARGING'
                : kiEnergy >= 45
                ? profile.powerUpReadyLabel
                : `${kiEnergy}%`}
            </span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. ANALOG JOYSTICK (FRONT/BACK/LEFT/RIGHT + MOVABLE & RESIZABLE)       */}
      {/* ===================================================================== */}
      <div
        ref={joyContainerRef}
        className={`absolute z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full border bg-zinc-950/25 shadow-[inset_0_0_16px_rgba(255,255,255,0.08)] flex items-center justify-center pointer-events-auto origin-center transition-transform duration-75 ${
          isEditingHud
            ? `cursor-grab active:cursor-grabbing border-2 ${
                editingSlot === 'joystick' ? 'border-amber-400 bg-amber-500/20' : 'border-white/70'
              }`
            : 'border-white/30 cursor-grab active:cursor-grabbing'
        }`}
        style={{
          left: `${hudLayout.joystick.x}%`,
          top: `${hudLayout.joystick.y}%`,
          transform: `translate(-50%, -50%) scale(${hudLayout.joystick.scale})`,
        }}
        onTouchStart={e => {
          e.stopPropagation();
          if (showSettings || endMatchStats) return;
          if (isEditingHud) {
            setEditingSlot('joystick');
            draggingHudSlot.current = 'joystick';
            return;
          }
          const t = e.changedTouches[0];
          if (t) {
            joyTouchId.current = t.identifier;
            updateJoystickFromPoint(t.clientX, t.clientY);
          }
        }}
        onMouseDown={e => {
          e.stopPropagation();
          if (showSettings || endMatchStats) return;
          if (isEditingHud) {
            setEditingSlot('joystick');
            draggingHudSlot.current = 'joystick';
            return;
          }
          joyMouseActive.current = true;
          updateJoystickFromPoint(e.clientX, e.clientY);
        }}
      >
        {isEditingHud && (
          <div className="absolute -top-5 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-mono-tactical font-black whitespace-nowrap">
            MOVE · {Math.round(hudLayout.joystick.scale * 100)}%
          </div>
        )}

        <div className="absolute top-2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-white/35 pointer-events-none" />
        <div className="absolute bottom-2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-white/35 pointer-events-none" />
        <div className="absolute left-2 w-0 h-0 border-t-[4px] border-b-[4px] border-r-[6px] border-t-transparent border-b-transparent border-r-white/35 pointer-events-none" />
        <div className="absolute right-2 w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-white/35 pointer-events-none" />

        <div className="w-12 h-12 rounded-full border border-white/15 pointer-events-none" />

        <div
          className="absolute w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/55 border border-white/80 shadow-[0_0_10px_rgba(255,255,255,0.35)] pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${joyOffset.x}px, ${joyOffset.y}px)`,
          }}
        />
      </div>

      {/* ===================================================================== */}
      {/* 5A. DEDICATED SKILL SECTION (MOVABLE & % RESIZABLE INDEPENDENTLY!)    */}
      {/* ===================================================================== */}
      <div
        className={`absolute z-20 flex flex-col items-end space-y-1.5 pointer-events-auto origin-center transition-transform duration-75 ${
          isEditingHud
            ? `cursor-grab active:cursor-grabbing p-1.5 rounded border-2 ${
                editingSlot === 'skillBar' ? 'border-amber-400 bg-amber-500/15' : 'border-violet-400/70 bg-black/45'
              }`
            : ''
        }`}
        style={{
          left: `${hudLayout.skillBar.x}%`,
          top: `${hudLayout.skillBar.y}%`,
          transform: `translate(-50%, -50%) scale(${hudLayout.skillBar.scale})`,
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => {
          if (!isEditingHud) return;
          e.stopPropagation();
          setEditingSlot('skillBar');
          draggingHudSlot.current = 'skillBar';
        }}
        onTouchStart={e => {
          e.stopPropagation();
          if (isEditingHud) {
            setEditingSlot('skillBar');
            draggingHudSlot.current = 'skillBar';
          }
        }}
      >
        {isEditingHud && (
          <div className="px-1.5 py-0.5 rounded bg-violet-500 text-white text-[9px] font-mono-tactical font-black whitespace-nowrap">
            SKILLS · {Math.round(hudLayout.skillBar.scale * 100)}%
          </div>
        )}

        {/* Maxwell 5-Element Magic Transmission Bar */}
        {isMaxwell && (
          <div className="flex items-center space-x-1 bg-zinc-950/85 border border-zinc-800/90 px-1.5 py-1 rounded">
            {(['arcane', 'fire', 'lightning', 'frost', 'void'] as MaxwellElement[]).map(el => {
              const ui = MAXWELL_ELEMENT_UI[el];
              const isActive = magicElement === el;
              return (
                <button
                  key={el}
                  onMouseDown={e => {
                    e.stopPropagation();
                    if (!isEditingHud) engine.transmuteElement(el);
                  }}
                  onTouchStart={e => {
                    e.stopPropagation();
                    if (!isEditingHud) engine.transmuteElement(el);
                  }}
                  title={ui.title}
                  className={`px-1.5 py-0.5 rounded-xs border text-[8px] font-mono-tactical font-bold transition-all active:scale-90 ${
                    isActive
                      ? ui.btnClass
                      : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  {ui.short}
                </button>
              );
            })}
            <button
              onMouseDown={e => {
                e.stopPropagation();
                executeControlAction('aether_barrier', 'down');
              }}
              onTouchStart={e => {
                e.stopPropagation();
                executeControlAction('aether_barrier', 'down');
              }}
              title="Elemental Ward Shield [X]"
              className="px-1.5 py-0.5 rounded-xs border border-amber-400/70 bg-amber-500/20 text-amber-200 text-[8px] font-mono-tactical font-bold active:scale-90"
            >
              WARD
            </button>
          </div>
        )}

        {/* Silvester 15-Power Omega Deck */}
        {isSilvester && (
          <div className="bg-zinc-950/88 border border-cyan-400/55 p-1 rounded shadow-[0_0_16px_rgba(56,189,248,0.28)]">
            <div className="text-[7px] font-mono-tactical font-black text-amber-300 tracking-wider uppercase mb-0.5 flex items-center justify-between px-0.5">
              <span>15-POWER OMEGA DECK</span>
              <span className="text-cyan-300">{kiEnergy}%</span>
            </div>
            <div className="grid grid-cols-5 gap-0.5">
              {SILVESTER_15_POWERS.map(pwr => {
                const canAfford = kiEnergy >= pwr.cost;
                const isActiveFly = pwr.action === 'flight_toggle' && isFlying;
                return (
                  <button
                    key={pwr.id}
                    onMouseDown={e => {
                      e.stopPropagation();
                      executeControlAction(pwr.action, 'down');
                    }}
                    onTouchStart={e => {
                      e.stopPropagation();
                      executeControlAction(pwr.action, 'down');
                    }}
                    title={`${pwr.name}${pwr.cost > 0 ? ` (${pwr.cost}% Energy)` : ''}`}
                    className={`px-1 py-0.5 rounded-xs border text-[7px] font-mono-tactical font-bold leading-tight transition-all active:scale-90 ${
                      pwr.colorClass
                    } ${isActiveFly ? 'ring-1 ring-white brightness-125' : ''} ${
                      !canAfford ? 'opacity-45' : 'hover:brightness-125'
                    }`}
                  >
                    {isActiveFly ? 'LAND' : pwr.short}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Organized Character Skill Buttons Tray (Separate from Attack Section!) */}
        {profile.skillButtons && profile.skillButtons.length > 0 && (
          <div className="bg-zinc-950/80 border border-zinc-700/80 rounded-xl p-1.5 shadow-xl flex items-center space-x-1.5 backdrop-blur-xs">
            {profile.skillButtons.map(sb => (
              <button
                key={sb.action + sb.label}
                onMouseDown={e => {
                  e.stopPropagation();
                  executeControlAction(sb.action, 'down');
                }}
                onTouchStart={e => {
                  e.stopPropagation();
                  executeControlAction(sb.action, 'down');
                }}
                className={`relative px-2 py-1.5 rounded-lg border ${sb.borderClass} ${sb.bgClass} flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] active:scale-90 hover:brightness-125 transition-all shadow-inner`}
                title={`${sb.label}${sb.keyHint ? ` [${sb.keyHint}]` : ''}`}
              >
                {sb.keyHint && (
                  <span className="absolute -top-1.5 -right-1 px-1 rounded bg-zinc-900 border border-zinc-600 text-[7px] font-mono-tactical font-black text-amber-300 leading-tight">
                    {sb.keyHint}
                  </span>
                )}
                <div className="scale-75 -my-1">{renderControlIcon(sb.icon)}</div>
                <span
                  className={`text-[7px] sm:text-[8px] font-heading font-extrabold uppercase tracking-tight leading-none mt-0.5 whitespace-nowrap ${
                    sb.textColor || 'text-white'
                  }`}
                >
                  {sb.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Weapon Readout + Utility + Swap Strip */}
        <div className="flex items-center space-x-1.5">
          <div
            onClick={() => executeControlAction('reload', 'click')}
            className="hidden sm:block px-2 py-0.5 rounded-xs bg-zinc-950/80 border border-zinc-700/80 text-[9px] font-mono-tactical text-zinc-200 cursor-pointer hover:border-amber-400"
          >
            <span
              className="font-bold mr-1"
              style={{ color: isMaxwell ? activeElementUi.hex : profile.themeAccent }}
            >
              {weapon.name}
            </span>
            <span>{weapon.magSize >= 999 ? '∞' : isReloading ? 'RELOAD' : `${ammo.current}/${ammo.reserve}`}</span>
          </div>

          {profile.extraUtilityLabel && profile.extraUtilityAction && (
            <button
              onMouseDown={() => executeControlAction(profile.extraUtilityAction!, 'down')}
              onMouseUp={() => executeControlAction(profile.extraUtilityAction!, 'up')}
              onTouchStart={e => {
                e.stopPropagation();
                executeControlAction(profile.extraUtilityAction!, 'down');
              }}
              onTouchEnd={e => {
                e.stopPropagation();
                executeControlAction(profile.extraUtilityAction!, 'up');
              }}
              style={isMaxwell ? { borderColor: activeElementUi.hex, color: activeElementUi.hex } : undefined}
              className="px-2 py-0.5 rounded-md border border-white/35 bg-zinc-950/80 text-zinc-100 text-[9px] font-mono-tactical font-bold hover:border-amber-400 active:scale-95"
            >
              {profile.extraUtilityLabel}
            </button>
          )}

          <button
            onClick={() => {
              if (isEditingHud) return;
              engine.switchWeapon((engine.activeWeaponIndex + 1) % engine.weapons.length);
            }}
            className="hidden sm:flex px-2 py-0.5 rounded-md border border-white/30 bg-zinc-950/80 text-zinc-200 text-[9px] font-mono-tactical items-center space-x-1 hover:border-amber-400 active:scale-95"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>SWAP</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5B. ATTACK SECTION (CLEAN ORGANIZED CLUSTER + MOVABLE & % RESIZABLE)  */}
      {/* ===================================================================== */}
      <div
        className={`absolute z-20 flex items-center justify-center pointer-events-auto origin-center transition-transform duration-75 ${
          isEditingHud
            ? `cursor-grab active:cursor-grabbing p-1.5 rounded border-2 ${
                editingSlot === 'actionWheel' ? 'border-amber-400 bg-amber-500/15' : 'border-white/55 bg-black/40'
              }`
            : ''
        }`}
        style={{
          left: `${hudLayout.actionWheel.x}%`,
          top: `${hudLayout.actionWheel.y}%`,
          transform: `translate(-50%, -50%) scale(${hudLayout.actionWheel.scale})`,
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => {
          if (!isEditingHud) return;
          e.stopPropagation();
          setEditingSlot('actionWheel');
          draggingHudSlot.current = 'actionWheel';
        }}
        onTouchStart={e => {
          e.stopPropagation();
          if (isEditingHud) {
            setEditingSlot('actionWheel');
            draggingHudSlot.current = 'actionWheel';
          }
        }}
      >
        {isEditingHud && (
          <div className="absolute -top-5 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-mono-tactical font-black whitespace-nowrap">
            ATTACK · {Math.round(hudLayout.actionWheel.scale * 100)}%
          </div>
        )}

        {/* Distinct Operator-Specific Attack Cluster Shell */}
        <div
          className={wheelShell.className}
          style={
            isMaxwell
              ? {
                  ...wheelShell.style,
                  borderColor: activeElementUi.hex,
                  boxShadow: `0 0 24px ${activeElementUi.hex}66`,
                }
              : wheelShell.style
          }
        >
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1.5 sm:gap-2 place-items-center">
            {profile.buttons.map(btn => {
              const isActiveFlightBtn = canFlyHero && btn.action === 'flight_toggle' && isFlying;
              const isActiveThermalBtn = isSuperman && btn.action === 'thermal_overload' && isThermalOverload;
              const isFeaturedClassic =
                profile.wheelVariant === 'hero_cross' ||
                profile.wheelVariant === 'saiyan_orbit' ||
                profile.wheelVariant === 'kryptonian_diamond' ||
                profile.wheelVariant === 'arcane_sigil';

              return (
                <button
                  key={btn.slot}
                  onMouseDown={() => executeControlAction(btn.action, 'down')}
                  onMouseUp={() => executeControlAction(btn.action, 'up')}
                  onMouseLeave={() => {
                    if (btn.action === 'fire_hold') engine.stopFiring();
                  }}
                  onTouchStart={e => {
                    e.stopPropagation();
                    executeControlAction(btn.action, 'down');
                  }}
                  onTouchEnd={e => {
                    e.stopPropagation();
                    executeControlAction(btn.action, 'up');
                  }}
                  className={`${
                    btn.isPrimary
                      ? 'w-14 h-14 sm:w-16 sm:h-16'
                      : 'w-12 h-12 sm:w-14 sm:h-14'
                  } ${
                    profile.wheelVariant === 'kryptonian_diamond'
                      ? 'rounded-lg rotate-3'
                      : profile.wheelVariant === 'arcane_sigil'
                      ? 'rounded-md'
                      : isFeaturedClassic
                      ? 'rounded-full'
                      : 'rounded-xl'
                  } border-2 ${btn.accentBorder} ${btn.accentBg} ${
                    btn.accentGlow || ''
                  } ${
                    isActiveFlightBtn ? 'ring-2 ring-sky-300 brightness-125' : ''
                  } ${
                    isActiveThermalBtn ? 'ring-2 ring-yellow-300 animate-pulse brightness-125' : ''
                  } flex flex-col items-center justify-center text-white shadow-inner active:scale-90 active:brightness-125 transition-all`}
                  title={btn.label}
                >
                  {renderControlIcon(
                    btn.icon,
                    isSaitama || isGoku || isSuperman || isMaxwell || isKing || isFlash || isLantern || isShazam || isThor || isSilvester || isDre || isTruth || isHeiliea || isBaby || isNewHero
                  )}
                  <span
                    className={`text-[8px] sm:text-[9px] font-heading font-extrabold tracking-tight uppercase leading-none -mt-0.5 ${
                      btn.textColor || 'text-white'
                    }`}
                  >
                    {isActiveFlightBtn ? 'LAND' : btn.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* COMPACT RADIO CHAT STREAM */}
      <div className="hidden lg:flex flex-col space-y-1 absolute left-5 top-36 z-10 max-w-[210px] pointer-events-none opacity-80">
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className="px-2 py-0.5 rounded-xs bg-zinc-950/65 border border-zinc-800/70 text-[10px] font-mono-tactical text-zinc-300"
          >
            <span className={msg.isPlayer ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
              [{msg.sender}]:{' '}
            </span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* SCOREBOARD MODAL */}
      {showScoreboard && (
        <div
          className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-6 pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-zinc-950 border border-zinc-700 p-5 rounded-lg max-w-lg w-full clip-tactical-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="font-heading font-black text-lg text-amber-400 uppercase tracking-wider">
                TACTICAL LEADERBOARD
              </h3>
              <button
                onClick={() => setShowScoreboard(false)}
                className="text-xs text-zinc-400 hover:text-white uppercase font-mono-tactical"
              >
                Close [TAB]
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {scores.map((s, idx) => (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xs flex items-center justify-between text-xs font-mono-tactical border ${
                    s.isPlayer
                      ? 'bg-amber-500/10 border-amber-400 text-white font-bold'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-zinc-500 w-4 font-bold">{idx + 1}</span>
                    <span className={s.isPlayer ? 'text-amber-400 font-bold' : ''}>{s.name}</span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span>K: {s.kills}</span>
                    <span>D: {s.deaths}</span>
                    <span className="text-amber-400 font-bold">{s.score} PTS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* IN-GAME SETTINGS OVERLAY WITH CUSTOM LAYOUT EDITOR & BACK BUTTON */}
      {showSettings && (
        <div
          className="absolute inset-0 z-50 pointer-events-auto"
          onClick={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          <SettingsLayer
            settings={localSettings}
            onUpdateSettings={handleSettingsChange}
            onBack={() => setShowSettings(false)}
            isInGame
            onEnterLiveHudEdit={() => {
              setShowSettings(false);
              setIsEditingZoom(false);
              setIsEditingHud(true);
            }}
            onEnterLiveZoomEdit={() => {
              setShowSettings(false);
              setIsEditingHud(false);
              setIsEditingZoom(true);
            }}
            onExitMatch={() => {
              engine.dispose();
              onExitMatch();
            }}
          />
        </div>
      )}

      {/* END OF MATCH RESULTS COMPONENT */}
      {endMatchStats && (
        <EndOfMatchScreen
          stats={endMatchStats}
          operator={operator}
          weapon={weapon}
          onPlayAgain={onPlayAgain}
          onReturnToLobby={() => {
            engine.dispose();
            onExitMatch();
          }}
          onOpenStore={onOpenStore}
        />
      )}
    </div>
  );
};
