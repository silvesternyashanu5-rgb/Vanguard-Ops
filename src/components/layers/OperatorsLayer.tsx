import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Shield, Zap, Check, Lock, Award, Eye, Flame, Sparkles, BookOpen, User, Infinity } from 'lucide-react';
import { OperatorCategory, OperatorData, WeaponData } from '../../types/game';
import { soundEngine } from '../../audio/soundEngine';
import { LobbyViewer } from '../../game/lobbyViewer';

interface OperatorsLayerProps {
  operators: OperatorData[];
  selectedOperator: OperatorData;
  equippedWeapon: WeaponData;
  onSelectOperator: (op: OperatorData) => void;
  onBack: () => void;
  onOpenStore?: () => void;
}

const CATEGORY_TABS: Array<{ id: 'all' | OperatorCategory; label: string; badgeClass: string }> = [
  { id: 'all', label: 'ALL', badgeClass: 'border-zinc-500 text-zinc-200 bg-zinc-800/80' },
  { id: 'normal', label: 'NORMAL', badgeClass: 'border-slate-400 text-slate-200 bg-slate-800/80' },
  { id: 'anime', label: 'ANIME', badgeClass: 'border-amber-400 text-amber-200 bg-amber-950/75' },
  { id: 'marvel', label: 'MARVEL', badgeClass: 'border-sky-400 text-sky-200 bg-sky-950/75' },
  { id: 'dc', label: 'DC', badgeClass: 'border-blue-400 text-blue-200 bg-blue-950/75' },
  { id: 'legendary', label: 'LEGENDARY', badgeClass: 'border-violet-400 text-violet-200 bg-violet-950/75' },
];

type HeroUiMeta = {
  headerTag: string;
  monogram: string;
  badgeGrad: string;
  previewLine: string;
  powerBoxTitle: string;
  powerSummary: string;
  strength: string;
  mobility: string;
  defense: string;
  ultimate: string;
  loreTitle: string;
  loreExtra: string;
  doctrineTitle: string;
  bullets: Array<{ dotClass: string; text: string }>;
};

const NEW_HERO_UI_META: Record<string, HeroUiMeta> = {
  iron_man: {
    headerTag: 'STARK NANOTECH ARMOR',
    monogram: 'IM',
    badgeGrad: 'bg-gradient-to-tr from-red-700 via-red-600 to-amber-400 border-amber-400 text-amber-100 shadow-md',
    previewLine: 'ARMOR: MARK III TO MARK 85 · ARC REACTOR · FLIGHT THRUSTERS',
    powerBoxTitle: 'STARK ARC REACTOR & NANOTECH',
    powerSummary: 'Genius billionaire Tony Stark cycles between Mark III, Hulkbuster, Mark 50, and Mark 85 Bleeding Edge forms mid-match with flight, Jericho micro-missiles, Nano Shields, and Arc Unibeams.',
    strength: 'JERICHO ARSENAL',
    mobility: 'SUPERSONIC FLIGHT',
    defense: '22% DR + NANO SHIELD',
    ultimate: 'MARK 85 UNIBEAM',
    loreTitle: 'ARMORED AVENGER',
    loreExtra: 'With each Stark armor iteration, Tony adapts in real time—folding nanotech shields and repulsor wing cannons directly around combat threats.',
    doctrineTitle: 'STARK COMBAT PROTOCOLS',
    bullets: [
      { dotClass: 'bg-red-500', text: 'TRANSFORM [T]: MK III / HULKBUSTER / MK 50 / MK 85' },
      { dotClass: 'bg-sky-400', text: 'REPULSOR FLIGHT + +50 ARMOR NANO SHIELD' },
      { dotClass: 'bg-amber-400', text: 'JERICHO MISSILE BARRAGE & ARC UNIBEAM' },
    ],
  },
  spider_man: {
    headerTag: 'FRIENDLY NEIGHBORHOOD HERO',
    monogram: 'SP',
    badgeGrad: 'bg-gradient-to-tr from-red-700 via-blue-700 to-amber-300 border-red-400 text-white shadow-md',
    previewLine: 'SUIT: CLASSIC TO IRON SPIDER · 4 GOLD WALDO ARMS · WEB SHOOTERS',
    powerBoxTitle: 'SPIDER-SENSE & IRON WALDO ARMS',
    powerSummary: 'Wall-crawling acrobatics at 1.38x agility combined with Web Snare Bombs that freeze targets for 3.8s, supersonic Web Zips, and Symbiote / Iron Spider transformations.',
    strength: 'PROPORTIONAL TITAN',
    mobility: 'WEB ZIP (1.38x)',
    defense: 'SPIDER-SENSE EVASION',
    ultimate: 'INSTANT KILL OVERLOAD',
    loreTitle: 'WITH GREAT POWER',
    loreExtra: 'Armed with Stark’s Iron Spider waldoes, Symbiote black-suit fury, and Spider-Sense reflexes, Peter Parker outmaneuvers entire squads.',
    doctrineTitle: 'ARACHNID COMBAT PROTOCOLS',
    bullets: [
      { dotClass: 'bg-red-500', text: 'TRANSFORM [T]: CLASSIC / INTEGRATED / SYMBIOTE / IRON SPIDER' },
      { dotClass: 'bg-slate-200', text: 'WEB SNARE BOMB FREEZES ENEMIES & SPELLS 3.8S' },
      { dotClass: 'bg-amber-400', text: 'IRON SPIDER WALDO INSTANT-KILL SURGE' },
    ],
  },
  doctor_strange: {
    headerTag: 'SORCERER SUPREME',
    monogram: 'DS',
    badgeGrad: 'bg-gradient-to-tr from-indigo-900 via-red-700 to-emerald-400 border-amber-400 text-amber-100 shadow-md',
    previewLine: 'CLOAK OF LEVITATION · EYE OF AGAMOTTO · ELDRITCH MANDALAS',
    powerBoxTitle: 'MYSTIC ARTS & TIME STONE',
    powerSummary: 'Master of Kamar-Taj commanding Mirror Dimension Seals (4.0s stasis + spell wipe), Sling Ring Portal warps, flight, and Supreme Vishanti bolts.',
    strength: 'ELDRITCH SUPREME',
    mobility: 'LEVITATION + PORTALS',
    defense: 'MIRROR DIMENSION SEAL',
    ultimate: 'BOLTS OF VISHANTI',
    loreTitle: 'KEEPER OF THE SANCTUM',
    loreExtra: 'Wielding the Eye of Agamotto and Cloak of Levitation, Stephen Strange bends space and time across Supreme and Astral forms.',
    doctrineTitle: 'MYSTIC SANCTUM DOCTRINE',
    bullets: [
      { dotClass: 'bg-orange-400', text: 'TRANSFORM [T]: MASTER / DEFENDER / ASTRAL / SUPREME' },
      { dotClass: 'bg-emerald-400', text: 'MIRROR SEAL LOCKS HOSTILES FOR 4.0 SECONDS' },
      { dotClass: 'bg-amber-400', text: 'SLING RING WARP & VISHANTI BARRAGE' },
    ],
  },
  scarlet_witch: {
    headerTag: 'CHAOS MAGIC AVATAR',
    monogram: 'SW',
    badgeGrad: 'bg-gradient-to-tr from-rose-900 via-red-600 to-fuchsia-500 border-rose-400 text-rose-100 shadow-md',
    previewLine: 'SCARLET TIARA · DARKHOLD CORRUPTION · FLOATING HEX RINGS',
    powerBoxTitle: 'PROBABILITY HEX & CHAOS MAGIC',
    powerSummary: 'Wanda Maximoff rewrites combat with levitation flight, Reality Hex Warps that freeze enemies mid-cast, Telekinetic Blinks, and devastating Scarlet Chaos Novas.',
    strength: 'REALITY WARPER',
    mobility: 'HEX LEVITATION',
    defense: 'PROBABILITY WARD',
    ultimate: 'CHAOS REALITY NOVA',
    loreTitle: 'FORGED IN CHAOS',
    loreExtra: 'Ascending from Avengers coat to the Darkhold-crowned Scarlet Witch, Wanda shatters enemy formations with crimson hex magic.',
    doctrineTitle: 'CHAOS HEX PROTOCOLS',
    bullets: [
      { dotClass: 'bg-rose-500', text: 'TRANSFORM [T]: AVENGER / WANDAVISION / SCARLET WITCH / DARKHOLD' },
      { dotClass: 'bg-fuchsia-400', text: 'REALITY WARP HEX WIPES PROJECTILES & LOCKS FOES' },
      { dotClass: 'bg-red-500', text: 'TELEKINETIC BLINK + CHAOS NOVA' },
    ],
  },
  batman: {
    headerTag: 'GOTHAM DARK KNIGHT',
    monogram: 'BM',
    badgeGrad: 'bg-gradient-to-tr from-zinc-950 via-slate-800 to-amber-400 border-amber-400 text-amber-200 shadow-md',
    previewLine: 'COWL & SCALLOPED CAPE · UTILITY BELT · HELLBAT WINGS',
    powerBoxTitle: 'WAYNETECH & HELLBAT PROTOCOL',
    powerSummary: 'Master detective & martial strategist deploying Cryo-Smoke (+35 armor & freeze), Bat-Grapnel zip dashes, Beyond stealth speed, and the Apokolips Hellbat armor.',
    strength: 'APEX MARTIAL TIER',
    mobility: 'GRAPNEL ZIP + GLIDE',
    defense: 'CRYO-SMOKE + HELLBAT',
    ultimate: 'HELLBAT OVERDRIVE',
    loreTitle: 'VENGEANCE OF GOTHAM',
    loreExtra: 'Armed with WayneTech prep-time countermeasures—from Arkham Knight armor to the winged Hellbat forged on Apokolips—Bruce Wayne never yields.',
    doctrineTitle: 'DARK KNIGHT PROTOCOLS',
    bullets: [
      { dotClass: 'bg-amber-400', text: 'TRANSFORM [T]: DARK KNIGHT / BEYOND / ARKHAM / HELLBAT' },
      { dotClass: 'bg-slate-300', text: 'CRYO-SMOKE PELLET (+35 ARMOR & FREEZE)' },
      { dotClass: 'bg-red-500', text: 'BAT-GRAPNEL ZIP & HELLBAT OVERDRIVE' },
    ],
  },
  wonder_woman: {
    headerTag: 'AMAZONIAN PRINCESS',
    monogram: 'WW',
    badgeGrad: 'bg-gradient-to-tr from-red-700 via-amber-500 to-blue-700 border-amber-300 text-yellow-100 shadow-md',
    previewLine: 'GOLDEN TIARA & ARMOR · LASSO OF TRUTH · GOLDEN EAGLE WINGS',
    powerBoxTitle: 'OLYMPIAN AEGIS & GODKILLER',
    powerSummary: 'Demigod warrior soaring with Amazonian flight, Bracelets of Submission shockwaves (+45 armor), Lasso of Truth charges, and Golden Eagle Thunderwaves.',
    strength: 'DEMIGOD TITAN',
    mobility: 'WARRIOR FLIGHT + LASSO',
    defense: 'AEGIS BRACELET (+45)',
    ultimate: 'GODKILLER WAVE',
    loreTitle: 'CHAMPION OF THEMYSCIRA',
    loreExtra: 'Uniting Amazonian discipline with the Golden Armor of Asteria, Diana stands unbreakable at the center of every battle.',
    doctrineTitle: 'THEMYSCIRA WAR DOCTRINE',
    bullets: [
      { dotClass: 'bg-amber-400', text: 'TRANSFORM [T]: AMAZON / FLASHPOINT / GOLDEN EAGLE / GODDESS' },
      { dotClass: 'bg-yellow-300', text: 'BRACELET CLASH GRANTS +45 ARMOR & STUN WAVE' },
      { dotClass: 'bg-red-500', text: 'LASSO CHARGE & GODKILLER THUNDERWAVE' },
    ],
  },
  aquaman: {
    headerTag: 'KING OF ATLANTIS',
    monogram: 'AQ',
    badgeGrad: 'bg-gradient-to-tr from-emerald-700 via-cyan-600 to-amber-400 border-cyan-300 text-amber-100 shadow-md',
    previewLine: 'TRIDENT OF ATLAN · GOLD SCALE ARMOR · HYDRO-STORM AURA',
    powerBoxTitle: 'ATLANTEAN TIDE & TRIDENT',
    powerSummary: 'Sovereign of the Seven Seas wielding Poseidon’s Trident for healing Tidal Vortexes (+20 HP), Hydro Surge dashes, and Karathen Ocean Tempests.',
    strength: 'ATLANTEAN MONARCH',
    mobility: 'HYDRO SURGE DASH',
    defense: 'TRIDENT VORTEX HEAL',
    ultimate: 'KARATHEN TEMPEST',
    loreTitle: 'UNIFIER OF THE SEAS',
    loreExtra: 'Clad in the mythic Gold & Emerald King Armor or Stealth Blue Camo, Arthur Curry commands oceanic pressure anywhere on land or sky.',
    doctrineTitle: 'SEVEN SEAS DOCTRINE',
    bullets: [
      { dotClass: 'bg-cyan-400', text: 'TRANSFORM [T]: ORIN / KING GOLD / GLADIATOR / STEALTH' },
      { dotClass: 'bg-emerald-400', text: 'TIDAL VORTEX HEALS +20 HP & WIPES PROJECTILES' },
      { dotClass: 'bg-amber-400', text: 'HYDRO SURGE & KARATHEN OCEAN TEMPEST' },
    ],
  },
  rimuru_tempest: {
    headerTag: 'DEMON LORD & TRUE DRAGON',
    monogram: 'RT',
    badgeGrad: 'bg-gradient-to-tr from-sky-600 via-indigo-700 to-amber-300 border-sky-300 text-white shadow-md',
    previewLine: 'SILVER-BLUE HAIR · BLACK DEMON LORD COAT & WINGS · KATANA',
    powerBoxTitle: 'ULTIMATE SKILL BEELZEBUTH & CIEL',
    powerSummary: 'Reincarnated ruler of Tempest with passive +2.6 HP/sec Slime Regeneration, Winged Flight, Gluttonous King Beelzebuth absorption (+35 HP), and Void God Azathoth.',
    strength: 'TRUE DRAGON TIER',
    mobility: 'SPATIAL MOTION FLY',
    defense: '+2.6 HP/S REGEN + WARD',
    ultimate: 'VOID GOD AZATHOTH',
    loreTitle: 'CHANCELLOR OF JURA TEMPEST',
    loreExtra: 'From Slime traveler to Octagram Demon Lord and True Dragon, Rimuru’s Ciel parallel processing turns every enemy spell into raw power.',
    doctrineTitle: 'RAPHAEL / CIEL PROTOCOLS',
    bullets: [
      { dotClass: 'bg-sky-400', text: 'TRANSFORM [T]: SLIME / DEMON LORD / TRUE DRAGON / GOD' },
      { dotClass: 'bg-emerald-400', text: 'PASSIVE +2.6 HP/S + BEELZEBUTH +35 HP ABSORB' },
      { dotClass: 'bg-violet-400', text: 'SPATIAL MOTION STORM & VOID GOD AZATHOTH' },
    ],
  },
  sung_jinwoo: {
    headerTag: 'SHADOW MONARCH',
    monogram: 'SJ',
    badgeGrad: 'bg-gradient-to-tr from-zinc-950 via-purple-800 to-violet-400 border-purple-400 text-purple-100 shadow-md',
    previewLine: 'VIOLET MONARCH MANTLE · KAMISH WRATH DAGGERS · SHADOW CROWN',
    powerBoxTitle: "ARISE & RULER'S AUTHORITY",
    powerSummary: 'Solo Leveling’s Shadow Monarch moves at 1.38x speed—freezing targets with Ruler’s Authority, blinking via Shadow Exchange, and unleashing ARISE Shadow Legions.',
    strength: 'MONARCH ASSASSIN',
    mobility: 'SHADOW EXCHANGE (1.38x)',
    defense: 'MONARCH VEIL WARD',
    ultimate: 'ARISE SHADOW LEGION',
    loreTitle: 'THE ONE-MAN ARMY',
    loreExtra: 'Rising from E-Rank hunter to the eternal Shadow Monarch of the Dead, Jin-Woo commands Igris, Beru, and Bellion with a single word: Arise.',
    doctrineTitle: 'SHADOW MONARCH SYSTEM',
    bullets: [
      { dotClass: 'bg-purple-400', text: 'TRANSFORM [T]: E-RANK / NECROMANCER / SHADOW MONARCH / TRUE' },
      { dotClass: 'bg-violet-300', text: "RULER'S AUTHORITY TELEKINETIC FREEZE (3.0S)" },
      { dotClass: 'bg-indigo-400', text: 'SHADOW EXCHANGE BLITZ & ARISE: LEGION NOVA' },
    ],
  },
  naruto_uzumaki: {
    headerTag: 'SEVENTH HOKAGE (BARYON)',
    monogram: 'NU',
    badgeGrad: 'bg-gradient-to-tr from-orange-600 via-amber-400 to-red-600 border-amber-300 text-zinc-950 shadow-md',
    previewLine: 'SPIKY BLONDE HAIR · HOKAGE / BARYON MANTLE · GLOWING TAILS',
    powerBoxTitle: 'KURAMA SIX PATHS & BARYON MODE',
    powerSummary: 'Seventh Hokage running at 1.40x speed with passive +2.0 HP/s Uzumaki/Kurama healing, Lava Rasenshuriken, Kurama Blitz, and Six Paths Bijuu Bombs.',
    strength: 'BARYON HOKAGE',
    mobility: 'KURAMA BLITZ (1.40x)',
    defense: '+2.0 HP/S + SAGE AURA',
    ultimate: 'BIJUU RASENSHURIKEN',
    loreTitle: 'CHILD OF PROPHECY',
    loreExtra: 'Awakening Sage Mode, KCM2 Golden Chakra, Six Paths Truthseeker orbs, and the burning crimson Baryon fusion, Naruto never breaks his ninja way.',
    doctrineTitle: 'SEVENTH HOKAGE NINDO',
    bullets: [
      { dotClass: 'bg-orange-400', text: 'TRANSFORM [T]: SAGE / KURAMA KCM2 / SIX PATHS / BARYON' },
      { dotClass: 'bg-emerald-400', text: 'PASSIVE +2.0 HP/SEC + +40 HP BIJUU RECOVERY' },
      { dotClass: 'bg-yellow-300', text: 'LAVA RASENSHURIKEN & ULTRA-BIG BALL BIJUU' },
    ],
  },
  monkey_d_luffy: {
    headerTag: 'EMPEROR GEAR 5 NIKA',
    monogram: 'ML',
    badgeGrad: 'bg-gradient-to-tr from-red-600 via-amber-300 to-white border-amber-300 text-zinc-950 shadow-md',
    previewLine: 'STRAW HAT ON COLLAR · GEAR 5 WHITE CLOUD SHAWL · RUBBER HAKI',
    powerBoxTitle: 'CONQUEROR HAKI & DRUMS OF LIBERATION',
    powerSummary: 'Sun God Nika fighting with 22% passive rubber DR, Red Roc flame punches, Snakeman Jet Culverin dashes, and island-shattering Bajrang Gun finishers.',
    strength: 'YONKO GEAR 5',
    mobility: 'SNAKEMAN CULVERIN (1.38x)',
    defense: '22% RUBBER HAKI DR',
    ultimate: 'GUM-GUM BAJRANG GUN',
    loreTitle: 'WARRIOR OF LIBERATION',
    loreExtra: 'Advancing through Gear 2 Steam, Boundman, Snakeman, and awakened Gear 5 Sun God Nika, Luffy fights at peak freedom across every transform.',
    doctrineTitle: 'STRAW HAT EMPEROR HAKI',
    bullets: [
      { dotClass: 'bg-red-500', text: 'TRANSFORM [T]: GEAR 2 / BOUNDMAN / SNAKEMAN / GEAR 5 NIKA' },
      { dotClass: 'bg-orange-400', text: '22% RUBBER HAKI DR + GUM-GUM RED ROC' },
      { dotClass: 'bg-white', text: 'JET CULVERIN BLITZ & BAJRANG GUN' },
    ],
  },
  satoru_gojo: {
    headerTag: 'THE HONORED ONE',
    monogram: 'SG',
    badgeGrad: 'bg-gradient-to-tr from-zinc-950 via-sky-500 to-purple-500 border-sky-400 text-white shadow-md',
    previewLine: 'WHITE HAIR · BLINDFOLD / SIX EYES · INFINITY BLUE-PURPLE AURA',
    powerBoxTitle: 'LIMITLESS INFINITY & SIX EYES',
    powerSummary: 'Strongest Sorcerer protected by passive 35% Infinity damage reduction, Flight, Cursed Red knockbacks, +65 Armor Limitless Wards, and Hollow Purple erasure.',
    strength: 'SPECIAL GRADE APEX',
    mobility: 'LIMITLESS TELEPORT FLY',
    defense: '35% INFINITY DR + WARD',
    ultimate: 'HOLLOW PURPLE',
    loreTitle: 'UNLIMITED VOID',
    loreExtra: 'Born with the Six Eyes and Limitless cursed technique, Satoru Gojo drops his blindfold in Shinjuku & Awakened states to unleash Hollow Purple.',
    doctrineTitle: 'JUJUTSU SPECIAL GRADE',
    bullets: [
      { dotClass: 'bg-sky-400', text: 'TRANSFORM [T]: JJK HIGH / BLINDFOLD / SHINJUKU / HONORED ONE' },
      { dotClass: 'bg-cyan-300', text: '35% PASSIVE INFINITY DR + +65 ARMOR BARRIER' },
      { dotClass: 'bg-purple-400', text: 'REVERSAL RED & HOLLOW TECHNIQUE PURPLE' },
    ],
  },
  yuji_itadori: {
    headerTag: 'VESSEL OF BLACK FLASH',
    monogram: 'YI',
    badgeGrad: 'bg-gradient-to-tr from-zinc-900 via-rose-700 to-sky-400 border-rose-400 text-rose-100 shadow-md',
    previewLine: 'RED HOODIE COLLAR · PINK HAIR · BLACK FLASH LIGHTNING SPARKS',
    powerBoxTitle: 'AWAKENED BLACK FLASH & SHRINE',
    powerSummary: 'Relentless close-quarters brawler at 1.38x speed stacking Black Flash stuns (+20 HP vampiric), Cursed Flash Steps, and Awakened Malevolent Shrine.',
    strength: 'BLACK FLASH KING',
    mobility: 'CURSED STEP (1.38x)',
    defense: '20 HP BLACK FLASH HEAL',
    ultimate: 'MALEVOLENT SHRINE',
    loreTitle: 'A COG THAT NEVER STOPS',
    loreExtra: 'Mastering Divergent Fist, Blood Manipulation, Sukuna’s Malevolent Shrine, and consecutive Black Flashes, Yuji overwhelms curses up close.',
    doctrineTitle: 'SHINJUKU BRAWLER SYSTEM',
    bullets: [
      { dotClass: 'bg-rose-500', text: 'TRANSFORM [T]: UNIFORM / SUKUNA / BLACK FLASH / AWAKENED' },
      { dotClass: 'bg-sky-400', text: 'AWAKENED BLACK FLASH HEALS +20 HP & STUNS' },
      { dotClass: 'bg-red-600', text: 'CURSED FLASH STEP & SHRINE DOMAIN' },
    ],
  },
  garou_opm: {
    headerTag: 'COSMIC FEAR AVATAR',
    monogram: 'GR',
    badgeGrad: 'bg-gradient-to-tr from-indigo-950 via-purple-600 to-cyan-400 border-purple-400 text-cyan-100 shadow-md',
    previewLine: 'SPIKY SILVER HAIR / COSMIC GALAXY SKIN · WATER STREAM FIST',
    powerBoxTitle: 'MODE: SAITAMA & GOD SLAYER',
    powerSummary: 'Martial prodigy wielding 22% Counter DR, Extreme Fa Jin internal shocks, Awakened dashes, and Gamma Ray Bursts across Human, Spiral, Monster, and Cosmic Fear forms.',
    strength: 'GOD SLAYER FIST',
    mobility: 'CONSTELLATION DASH (1.42x)',
    defense: '22% FLOWING WATER DR',
    ultimate: 'GAMMA RAY BURST',
    loreTitle: 'THE HERO HUNTER',
    loreExtra: 'Touched by God to achieve Cosmic Fear Mode, Garou copies every energy and martial art across the universe to push past disaster level God.',
    doctrineTitle: 'CALAMITY MARTIAL ARTS',
    bullets: [
      { dotClass: 'bg-sky-400', text: 'TRANSFORM [T]: HERO HUNTER / SPIRAL / MONSTER / COSMIC FEAR' },
      { dotClass: 'bg-purple-400', text: 'COSMIC GALAXY SKIN + 22% COUNTER DEFLECTION' },
      { dotClass: 'bg-cyan-300', text: 'EXTREME FA JIN & GAMMA RAY BURST' },
    ],
  },
  anos_voldigoad: {
    headerTag: 'DEMON KING OF TYRANNY',
    monogram: 'AV',
    badgeGrad: 'bg-gradient-to-tr from-zinc-950 via-purple-900 to-rose-600 border-rose-400 text-rose-100 shadow-md',
    previewLine: 'DEMON KING ROBES · VENUZDONOA SWORD · CHAOTIC PURPLE EYES',
    powerBoxTitle: 'VENUZDONOA & CHAOTIC DESTRUCTION',
    powerSummary: 'Founder of Demonkind with 35% DR, +2.4 HP/sec immortality regen, Flight, Chaotic Eyes that wipe all enemy magic for 4.0s, and Egil Grone Angdroa.',
    strength: 'MISFIT OVERLORD',
    mobility: 'DEMON KING FLIGHT (1.36x)',
    defense: '35% DR + 2.4 HP/S REGEN',
    ultimate: 'EGIL GRONE ANGDROA',
    loreTitle: 'FOUNDER OF DILHADE',
    loreExtra: 'No concept of fate, reason, or time can bind Anos Voldigoad once he draws the sword Venuzdonoa and opens the Eyes of Chaotic Destruction.',
    doctrineTitle: 'DEMON KING SOVEREIGNTY',
    bullets: [
      { dotClass: 'bg-purple-500', text: 'TRANSFORM [T]: ACADEMY / FOUNDER / VENUZDONOA / SILVER SEA' },
      { dotClass: 'bg-rose-500', text: '35% DR + 2.4 HP/S + 4.0S CHAOTIC EYE LOCK' },
      { dotClass: 'bg-red-500', text: 'VENUZDONOA SLASH & EGIL GRONE ANGDROA' },
    ],
  },
  itachi_uchiha: {
    headerTag: 'UCHIHA MANGEKYO PRODIGY',
    monogram: 'IU',
    badgeGrad: 'bg-gradient-to-tr from-zinc-950 via-red-800 to-zinc-800 border-red-500 text-red-100 shadow-md',
    previewLine: 'AKATSUKI RED CLOUDS / ANBU / EDO · SUSANOO & CROWS',
    powerBoxTitle: 'TSUKUYOMI & TOTSUKA SUSANOO',
    powerSummary: 'Silent shinobi legend with +1.8 HP/s Edo/Susanoo sustain, Amaterasu black-flame seals, Ephemeral Crow Clone teleports, and 4.2s Tsukuyomi illusions.',
    strength: 'MANGEKYO GENIUS',
    mobility: 'CROW CLONE WARP (1.36x)',
    defense: 'YATA MIRROR + +1.8 HP/S',
    ultimate: 'TSUKUYOMI + TOTSUKA',
    loreTitle: 'SHINOBI IN THE SHADOWS',
    loreExtra: 'Carrying Akatsuki’s red-cloud cloak, Anbu mask, and crimson Armored Susanoo with Yata Mirror, Itachi ends duels before enemies realize they fell into genjutsu.',
    doctrineTitle: 'UCHIHA GENJUTSU PROTOCOLS',
    bullets: [
      { dotClass: 'bg-red-500', text: 'TRANSFORM [T]: ANBU / AKATSUKI / SUSANOO / EDO TENSEI' },
      { dotClass: 'bg-rose-400', text: 'AMATERASU BLACK FLAME + CROW CLONE WARP' },
      { dotClass: 'bg-orange-400', text: 'TSUKUYOMI 4.2S GENJUTSU LOCK + TOTSUKA' },
    ],
  },
  sasuke_uchiha: {
    headerTag: 'SIX PATHS RINNEGAN',
    monogram: 'SU',
    badgeGrad: 'bg-gradient-to-tr from-indigo-950 via-purple-700 to-sky-400 border-indigo-400 text-indigo-100 shadow-md',
    previewLine: 'RINNEGAN PURPLE EYE · CURSE MARK / SUSANOO WINGS · KATANA',
    powerBoxTitle: 'AMENOTEJIKARA & INDRA ARROW',
    powerSummary: 'Shadow Hokage operating at 1.38x speed, calling down Kirin lightning strikes, swapping space instantly with Amenotejikara, and firing Indra’s Arrow.',
    strength: 'RINNEGAN SHADOW',
    mobility: 'AMENOTEJIKARA (1.38x)',
    defense: 'PERFECT SUSANOO ARMOR',
    ultimate: "INDRA'S ARROW",
    loreTitle: 'SHADOW HOKAGE',
    loreExtra: 'From Hebi Curse Mark Wings to Eternal Mangekyo and Six Paths Rinnegan Susanoo, Sasuke wields Chidori and flame control with surgical lethality.',
    doctrineTitle: 'RINNEGAN NINJA ARTS',
    bullets: [
      { dotClass: 'bg-indigo-400', text: 'TRANSFORM [T]: CURSE MARK / AKATSUKI / EMS / RINNEGAN' },
      { dotClass: 'bg-sky-400', text: 'LIGHTNING KIRIN STRIKE & AMENOTEJIKARA' },
      { dotClass: 'bg-purple-400', text: "INDRA'S ARROW SUSANOO LIGHTNING NOVA" },
    ],
  },
};

export const OperatorsLayer: React.FC<OperatorsLayerProps> = ({
  operators,
  selectedOperator,
  equippedWeapon,
  onSelectOperator,
  onBack,
  onOpenStore,
}) => {
  const [activeOp, setActiveOp] = useState<OperatorData>(selectedOperator);
  const [activeSkinId, setActiveSkinId] = useState<string>(selectedOperator.selectedSkinId);
  const [categoryFilter, setCategoryFilter] = useState<'all' | OperatorCategory>('all');
  const [tab, setTab] = useState<'skins' | 'abilities' | 'lore'>('skins');
  const viewerMountRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<LobbyViewer | null>(null);

  // Sync if selectedOperator changes externally (e.g. skin unlocked in store)
  useEffect(() => {
    const updated = operators.find(o => o.id === activeOp.id) || selectedOperator;
    setActiveOp(updated);
  }, [operators, selectedOperator]);

  useEffect(() => {
    if (viewerMountRef.current && !viewerInstanceRef.current) {
      const viewer = new LobbyViewer(viewerMountRef.current, activeOp, equippedWeapon);
      viewerInstanceRef.current = viewer;

      const handleResize = () => viewer.handleResize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        viewer.dispose();
        viewerInstanceRef.current = null;
      };
    }
  }, []);

  const handleSelectOp = (op: OperatorData) => {
    setActiveOp(op);
    setActiveSkinId(op.selectedSkinId);
    soundEngine.playUIClick('select');

    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.updateOperator(op, equippedWeapon);
    }
  };

  const handleSelectSkin = (skinId: string) => {
    setActiveSkinId(skinId);
    soundEngine.playUIClick('tab');
    const updated = { ...activeOp, selectedSkinId: skinId };
    setActiveOp(updated);

    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.updateOperator(updated, equippedWeapon);
    }
  };

  const handleEquip = () => {
    soundEngine.playUIClick('deploy');
    soundEngine.playPowerUp('quad_damage');
    onSelectOperator({ ...activeOp, selectedSkinId: activeSkinId });
    onBack();
  };

  const isSaitama = activeOp.id === 'saitama';
  const isGoku = activeOp.id === 'son_goku';
  const isSuperman = activeOp.id === 'superman';
  const isMaxwell = activeOp.id === 'maxwell_shodron';
  const isKing = activeOp.id === 'king_opm';
  const isFlash = activeOp.id === 'the_flash';
  const isLantern = activeOp.id === 'green_lantern';
  const isShazam = activeOp.id === 'shazam_champion';
  const isThor = activeOp.id === 'thor_odinson';
  const isSilvester = activeOp.id === 'silvester_jais';
  const isDre = activeOp.id === 'dre_titan';
  const isTruth = activeOp.id === 'the_truth';
  const isHeiliea = activeOp.id === 'heiliea_valkyrie';
  const isBaby = activeOp.id === 'the_baby';
  const isZenitsu = activeOp.id === 'zenitsu_agatsuma';
  const isTanjiro = activeOp.id === 'tanjiro_kamado';
  const isMuzan = activeOp.id === 'muzan_kibutsuji';
  const activeSkin = activeOp.skins.find(s => s.id === activeSkinId) || activeOp.skins[0];
  const filteredOperators =
    categoryFilter === 'all'
      ? operators
      : operators.filter(op => (op.category || 'normal') === categoryFilter);

  return (
    <div className="absolute inset-0 z-40 h-dvh bg-[#080a0f] text-white flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-11 lg:h-14 px-3 lg:px-6 flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/80 z-10 backdrop-blur-sm shrink-0">
        <div className="flex items-center space-x-2 lg:space-x-4 min-w-0">
          <button
            onClick={() => {
              soundEngine.playUIClick('back');
              onBack();
            }}
            className="flex items-center space-x-1.5 text-zinc-300 hover:text-amber-400 font-heading uppercase text-xs lg:text-sm tracking-widest px-2.5 py-1 lg:px-3 lg:py-1.5 rounded bg-zinc-900 border border-zinc-700/60 active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-zinc-700 shrink-0" />
          <h1 className="text-sm lg:text-xl font-bold font-heading uppercase tracking-wider text-white flex items-center space-x-2 min-w-0">
            <span className="text-amber-400 whitespace-nowrap">CHARACTER PROFILE</span>
            <span className="hidden sm:inline-block text-[10px] lg:text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono-tactical border border-amber-500/30 whitespace-nowrap">
              {isSaitama
                ? 'LIMITER: BROKEN'
                : isGoku
                ? 'SAIYAN WARRIOR'
                : isSuperman
                ? 'KRYPTONIAN PARAGON'
                : isMaxwell
                ? 'ARCHMAGE OF AETHER'
                : isKing
                ? 'S-CLASS RANK 7'
                : isFlash
                ? 'SCARLET SPEEDSTER'
                : isLantern
                ? 'GREEN LANTERN CORPS'
                : isShazam
                ? 'CHAMPION OF ETERNITY'
                : isThor
                ? 'GOD OF THUNDER'
                : isSilvester
                ? 'OMEGA SOVEREIGN (15 POWERS)'
                : isDre
                ? 'SONIC BASSPOWER'
                : isTruth
                ? 'ALL-SEEING VERITAS'
                : isHeiliea
                ? 'CELESTIAL VALKYRIE'
                : isBaby
                ? 'TINY COSMIC TITAN'
                : isZenitsu
                ? 'THUNDER BREATHING'
                : isTanjiro
                ? 'WATER & SUN BREATHING'
                : isMuzan
                ? 'DEMON KING'
                : NEW_HERO_UI_META[activeOp.id]?.headerTag || 'SPECIALIST DIVISION'}
            </span>
          </h1>
        </div>

        <div className="flex items-center space-x-2 text-[10px] lg:text-xs font-mono-tactical text-zinc-400 shrink-0">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 whitespace-nowrap">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>ROSTER: {operators.length} HEROES</span>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 min-h-0 flex flex-col min-[540px]:flex-row overflow-hidden relative">
        {/* Left Side: Character Selector List + Categories */}
        <div className="w-full min-[540px]:w-48 lg:w-72 border-b min-[540px]:border-b-0 min-[540px]:border-r border-zinc-800/80 bg-zinc-950/60 p-2 lg:p-4 overflow-y-auto space-y-2 z-10 flex-shrink-0 max-h-40 min-[540px]:max-h-none">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] lg:text-xs font-mono-tactical text-zinc-500 uppercase tracking-widest">
              Character Select
            </span>
            <span className="text-[10px] font-mono-tactical text-amber-400">
              {filteredOperators.length}
            </span>
          </div>

          {/* Category Filter Strip */}
          <div className="flex flex-wrap gap-1 px-0.5">
            {CATEGORY_TABS.map(cat => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundEngine.playUIClick('tab');
                    setCategoryFilter(cat.id);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono-tactical font-bold uppercase border transition-all ${
                    active
                      ? 'bg-amber-500 text-black border-amber-300 shadow'
                      : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 lg:space-y-2">
            {filteredOperators.map((op) => {
              const isSelected = activeOp.id === op.id;
              const isEquipped = selectedOperator.id === op.id;
              const isOpSaitama = op.id === 'saitama';
              const isOpGoku = op.id === 'son_goku';
              const isOpSuperman = op.id === 'superman';
              const isOpMaxwell = op.id === 'maxwell_shodron';
              const isOpKing = op.id === 'king_opm';
              const isOpFlash = op.id === 'the_flash';
              const isOpLantern = op.id === 'green_lantern';
              const isOpShazam = op.id === 'shazam_champion';
              const isOpThor = op.id === 'thor_odinson';
              const isOpSilvester = op.id === 'silvester_jais';
              const isOpDre = op.id === 'dre_titan';
              const isOpTruth = op.id === 'the_truth';
              const isOpHeiliea = op.id === 'heiliea_valkyrie';
              const isOpBaby = op.id === 'the_baby';
              const isOpZenitsu = op.id === 'zenitsu_agatsuma';
              const isOpTanjiro = op.id === 'tanjiro_kamado';
              const isOpMuzan = op.id === 'muzan_kibutsuji';
              const opCat = op.category || 'normal';
              const catMeta = CATEGORY_TABS.find(c => c.id === opCat);

              return (
                <div
                  key={op.id}
                  onClick={() => handleSelectOp(op)}
                  className={`p-2 lg:p-3 rounded border transition-all cursor-pointer relative clip-tactical-sm ${
                    isSelected
                      ? 'bg-zinc-800/90 border-amber-400 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/40'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {isEquipped && (
                    <div className="hidden lg:flex absolute top-2 right-2 items-center space-x-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-mono-tactical font-bold rounded border border-amber-500/40">
                      <Check className="w-2.5 h-2.5" />
                      <span>EQUIPPED</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className={`w-8 h-8 lg:w-11 lg:h-11 rounded border flex items-center justify-center font-heading text-xs lg:text-base font-black shrink-0 ${
                      isOpSaitama 
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 border-amber-400 text-black shadow-md' 
                        : isOpGoku
                        ? 'bg-gradient-to-tr from-orange-500 to-amber-400 border-orange-400 text-black shadow-md'
                        : isOpSuperman
                        ? 'bg-gradient-to-tr from-red-600 via-blue-700 to-amber-400 border-red-400 text-yellow-200 shadow-md'
                        : isOpMaxwell
                        ? 'bg-gradient-to-tr from-violet-600 via-purple-700 to-amber-400 border-violet-400 text-amber-200 shadow-md'
                        : isOpKing
                        ? 'bg-gradient-to-tr from-zinc-900 via-amber-500 to-red-600 border-amber-400 text-amber-100 shadow-md'
                        : isOpFlash
                        ? 'bg-gradient-to-tr from-red-600 via-red-500 to-yellow-400 border-yellow-400 text-yellow-100 shadow-md'
                        : isOpLantern
                        ? 'bg-gradient-to-tr from-emerald-800 via-green-600 to-lime-400 border-emerald-400 text-emerald-100 shadow-md'
                        : isOpShazam
                        ? 'bg-gradient-to-tr from-red-700 via-red-600 to-yellow-300 border-yellow-300 text-yellow-100 shadow-md'
                        : isOpThor
                        ? 'bg-gradient-to-tr from-slate-800 via-sky-700 to-cyan-300 border-sky-400 text-cyan-100 shadow-md'
                        : isOpSilvester
                        ? 'bg-gradient-to-tr from-indigo-900 via-cyan-500 to-amber-300 border-amber-300 text-white shadow-md'
                        : isOpDre
                        ? 'bg-gradient-to-tr from-zinc-900 via-orange-600 to-amber-400 border-orange-400 text-amber-100 shadow-md'
                        : isOpTruth
                        ? 'bg-gradient-to-tr from-slate-100 via-amber-400 to-yellow-200 border-amber-300 text-zinc-900 shadow-md'
                        : isOpHeiliea
                        ? 'bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-200 border-pink-300 text-white shadow-md'
                        : isOpBaby
                        ? 'bg-gradient-to-tr from-sky-400 via-cyan-300 to-yellow-200 border-sky-300 text-zinc-900 shadow-md'
                        : isOpZenitsu
                        ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-400 border-yellow-300 text-zinc-950 shadow-md'
                        : isOpTanjiro
                        ? 'bg-gradient-to-tr from-emerald-600 via-zinc-900 to-cyan-400 border-cyan-400 text-white shadow-md'
                        : isOpMuzan
                        ? 'bg-gradient-to-tr from-zinc-950 via-rose-800 to-red-600 border-rose-500 text-rose-100 shadow-md'
                        : NEW_HERO_UI_META[op.id]?.badgeGrad || 'bg-zinc-800 border-zinc-700 text-amber-400'
                    }`}>
                      {isOpSaitama
                        ? 'OPM'
                        : isOpGoku
                        ? 'DBZ'
                        : isOpSuperman
                        ? 'SM'
                        : isOpMaxwell
                        ? 'MS'
                        : isOpKing
                        ? 'KG'
                        : isOpFlash
                        ? 'FL'
                        : isOpLantern
                        ? 'GL'
                        : isOpShazam
                        ? 'SH'
                        : isOpThor
                        ? 'TH'
                        : isOpSilvester
                        ? 'SAJ'
                        : isOpDre
                        ? 'DR'
                        : isOpTruth
                        ? 'TT'
                        : isOpHeiliea
                        ? 'HL'
                        : isOpBaby
                        ? 'BB'
                        : isOpZenitsu
                        ? 'ZN'
                        : isOpTanjiro
                        ? 'TJ'
                        : isOpMuzan
                        ? 'MZ'
                        : NEW_HERO_UI_META[op.id]?.monogram || op.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <h3 className="font-heading font-black text-xs lg:text-sm tracking-wide text-white uppercase truncate">
                          {op.name}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <p className="text-[10px] lg:text-xs text-amber-400 font-mono-tactical font-bold truncate">{op.callsign}</p>
                        {catMeta && (
                          <span className={`text-[8px] font-mono-tactical font-bold px-1 py-0 rounded border uppercase ${catMeta.badgeClass}`}>
                            {catMeta.label}
                          </span>
                        )}
                      </div>
                      <span className="hidden lg:block text-[11px] text-zinc-400 truncate max-w-[160px]">{op.faction}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: 3D Turntable Viewport */}
        <div className="flex-1 min-w-0 min-h-0 relative flex items-center justify-center">
          <div ref={viewerMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Interactive Hint */}
          <div className="absolute bottom-2 left-3 lg:bottom-4 lg:left-6 pointer-events-none flex items-center space-x-1.5 text-[10px] lg:text-xs font-mono-tactical text-zinc-400 bg-zinc-950/75 px-2 py-1 lg:px-3 lg:py-1.5 rounded border border-zinc-800 backdrop-blur-xs">
            <Eye className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-cyan-400" />
            <span>DRAG TO ROTATE 360°</span>
          </div>

          <div className="absolute top-2 left-3 lg:top-4 lg:left-6 pointer-events-none">
            <span className="text-[9px] lg:text-[11px] font-mono-tactical text-amber-400 uppercase tracking-widest block">
              // 3D HERO PREVIEW
            </span>
            <span className="text-lg lg:text-3xl font-black font-heading tracking-wide uppercase text-white drop-shadow-md">
              {activeOp.name}
            </span>
            {isSaitama && (
              <span className="hidden lg:block text-xs font-mono-tactical text-amber-300">
                CAPE: FLOWING WHITE · GLOVES & BOOTS: HEAVY RED · SUIT: YELLOW
              </span>
            )}
            {isSuperman && (
              <span className="hidden lg:block text-xs font-mono-tactical text-sky-300">
                SUIT: KRYPTONIAN ARMOURWEAVE · CAPE: WEIGHTED CRIMSON · CREST: HOUSE OF EL
              </span>
            )}
            {isMaxwell && (
              <span className="hidden lg:block text-xs font-mono-tactical text-violet-300">
                COAT: ASTRAL VIOLET · HALO: ORBITING SIGIL · FOCUS: AETHER SCEPTER
              </span>
            )}
            {isKing && (
              <span className="hidden lg:block text-xs font-mono-tactical text-amber-300">
                TRENCH COAT: S-CLASS NOIR · EYE SCAR · ORBITING KING ENGINE AURA
              </span>
            )}
            {isFlash && (
              <span className="hidden lg:block text-xs font-mono-tactical text-yellow-300">
                SPEEDSTER SUIT: SCARLET · GOLDEN EAR WINGS · SPEED FORCE LIGHTNING
              </span>
            )}
            {isLantern && (
              <span className="hidden lg:block text-xs font-mono-tactical text-emerald-300">
                RING: OAN POWER RING · LANTERN CREST · ORBITING HARD-LIGHT CONSTRUCTS
              </span>
            )}
            {isShazam && (
              <span className="hidden lg:block text-xs font-mono-tactical text-yellow-200">
                SUIT: CRIMSON TUNIC · CAPE: FLOWING WHITE · CHEST: ZEUS LIGHTNING BOLT
              </span>
            )}
            {isThor && (
              <span className="hidden lg:block text-xs font-mono-tactical text-sky-300">
                ARMOR: ASGARDIAN SCALE · CAPE: CRIMSON CLOTH · WEAPON: FORGED MJOLNIR
              </span>
            )}
            {isSilvester && (
              <span className="hidden lg:block text-xs font-mono-tactical text-cyan-300">
                ARMOR: OBSIDIAN SOVEREIGN · HALO + DUAL ORBIT RINGS · 15 OMEGA POWERS
              </span>
            )}
            {isDre && (
              <span className="hidden lg:block text-xs font-mono-tactical text-orange-300">
                STUDIO JACKET · GOLDEN CHAIN &amp; HEADPHONES · 808 SUB-CANNON
              </span>
            )}
            {isTruth && (
              <span className="hidden lg:block text-xs font-mono-tactical text-amber-200">
                WHITE-GOLD ROBES · LEVITATING VERITAS HALO · ALL-SEEING EYE
              </span>
            )}
            {isHeiliea && (
              <span className="hidden lg:block text-xs font-mono-tactical text-pink-300">
                CELESTIAL PLATING · STARLIGHT VALKYRIE WINGS · SOLAR LANCE
              </span>
            )}
            {isBaby && (
              <span className="hidden lg:block text-xs font-mono-tactical text-sky-300">
                MINI TITAN SIZE · STARLIGHT ONESIE · GOLDEN RATTLE &amp; COSMIC BOTTLE
              </span>
            )}
            {isZenitsu && (
              <span className="hidden lg:block text-xs font-mono-tactical text-yellow-300">
                YELLOW TRIANGLE HAORI · GOLDEN-BOLT NICHIRIN KATANA
              </span>
            )}
            {isTanjiro && (
              <span className="hidden lg:block text-xs font-mono-tactical text-emerald-300">
                CHECKERED GREEN-BLACK HAORI · BLACK NICHIRIN + HANAFUDA EARRINGS
              </span>
            )}
            {isMuzan && (
              <span className="hidden lg:block text-xs font-mono-tactical text-rose-400">
                WHITE SUIT &amp; FEDORA · CRIMSON EYES · 4 BIOLOGICAL SPINE WHIPS
              </span>
            )}
            {NEW_HERO_UI_META[activeOp.id] && (
              <span className="hidden lg:block text-xs font-mono-tactical text-cyan-300">
                {NEW_HERO_UI_META[activeOp.id].previewLine}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Deep Character Dossier & Skin Options */}
        <div className="w-full min-[540px]:w-72 lg:w-[410px] min-h-0 border-t min-[540px]:border-t-0 min-[540px]:border-l border-zinc-800/80 bg-zinc-950/90 p-3 lg:p-5 overflow-hidden z-10 flex-shrink-0 flex flex-col justify-between gap-2">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono-tactical">
                  {activeOp.archetype || 'SPECIALIST CLASSIFICATION'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono-tactical font-bold border border-amber-500/40">
                  {activeOp.callsign}
                </span>
              </div>
              <h2 className="text-2xl font-black font-heading uppercase text-white mt-1">
                {activeOp.name}
              </h2>
              <p className="text-xs italic text-amber-200/90 mt-1 font-serif">
                {activeOp.quote}
              </p>
            </div>

            {/* Sub-tabs: Skins, Abilities, Lore */}
            <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded border border-zinc-800">
              <button
                onClick={() => {
                  setTab('skins');
                  soundEngine.playUIClick('tab');
                }}
                className={`flex-1 py-1.5 text-xs font-mono-tactical font-bold uppercase rounded transition-all flex items-center justify-center space-x-1 ${
                  tab === 'skins' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>SKINS ({activeOp.skins.length})</span>
              </button>
              <button
                onClick={() => {
                  setTab('abilities');
                  soundEngine.playUIClick('tab');
                }}
                className={`flex-1 py-1.5 text-xs font-mono-tactical font-bold uppercase rounded transition-all flex items-center justify-center space-x-1 ${
                  tab === 'abilities' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>COMBAT ABILITIES</span>
              </button>
              <button
                onClick={() => {
                  setTab('lore');
                  soundEngine.playUIClick('tab');
                }}
                className={`flex-1 py-1.5 text-xs font-mono-tactical font-bold uppercase rounded transition-all flex items-center justify-center space-x-1 ${
                  tab === 'lore' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>PSYCHE & LORE</span>
              </button>
            </div>

            {/* TAB 1: SKINS & OUTFITS */}
            {tab === 'skins' && (
              <div className="space-y-3">
                <span className="text-xs uppercase font-mono-tactical tracking-wider text-zinc-400 block">
                  SELECT WARDROBE SKIN
                </span>
                <div className="space-y-2">
                  {activeOp.skins.map(skin => {
                    const isSkinSelected = activeSkinId === skin.id;
                    return (
                      <div
                        key={skin.id}
                        onClick={() => handleSelectSkin(skin.id)}
                        className={`p-3 rounded border text-left cursor-pointer transition-all clip-tactical-sm ${
                          isSkinSelected
                            ? 'border-amber-400 bg-amber-500/15 text-white shadow-md shadow-amber-500/10'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white/40 shadow-sm"
                              style={{ backgroundColor: skin.primaryColor }}
                            />
                            <h4 className="font-heading font-black text-sm text-white uppercase">
                              {skin.name}
                            </h4>
                          </div>
                          <span className={`text-[10px] font-mono-tactical font-bold px-1.5 py-0.5 rounded uppercase ${
                            skin.rarity === 'Mythic' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                            skin.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                            'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          }`}>
                            {skin.rarity}
                          </span>
                        </div>

                        {/* Visual signature description for Saitama skins */}
                        {isSaitama && (
                          <div className="mt-2 text-[11px] text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/80 pt-1.5">
                            {skin.id === 'skin_saitama_classic' && (
                              <span>Yellow jumpsuit, flowing white cape with golden studs, heavy red gloves, and circular gold belt.</span>
                            )}
                            {skin.id === 'skin_saitama_serious' && (
                              <span>Dramatic ink shading, glowing golden aura, intense glaring eyes ready for Serious Punch.</span>
                            )}
                            {skin.id === 'skin_saitama_oppai' && (
                              <span>Casual red hoodie with "OPPAI" print, denim jeans, and white/red sneakers.</span>
                            )}
                            {skin.id === 'skin_saitama_tracksuit' && (
                              <span>Lightweight cyan training tracksuit for 100 push-ups, 100 sit-ups, and 10km morning run.</span>
                            )}
                          </div>
                        )}

                        {/* Visual signature description for Son Goku transformations */}
                        {isGoku && (
                          <div className="mt-2 text-[11px] text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/80 pt-1.5 flex items-center justify-between">
                            <div>
                              <span className="text-amber-400 font-mono-tactical font-black text-[10px] block">
                                {skin.multiplier}
                              </span>
                              <span>{skin.transformationLore}</span>
                            </div>
                            {skin.isLocked && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-400 font-mono-tactical text-[10px] font-bold ml-2 shrink-0">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>STORE</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Visual signature description for Superman suits */}
                        {isSuperman && (
                          <div className="mt-2 text-[11px] text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/80 pt-1.5 flex items-center justify-between">
                            <div>
                              {skin.multiplier && (
                                <span className="text-sky-400 font-mono-tactical font-black text-[10px] block">
                                  {skin.multiplier}
                                </span>
                              )}
                              <span>
                                {skin.transformationLore ||
                                  (skin.id === 'skin_superman_classic'
                                    ? 'Kryptonian armourweave royal blue suit, weighted crimson cape, raised "S" shield, golden utility belt, and deep red boots.'
                                    : skin.id === 'skin_superman_solar'
                                    ? 'Solar-recovery obsidian black Kryptonian weave with silver House of El crest and hyper-absorbent energy coils.'
                                    : 'Crimson & obsidian Kingdom Come armor with darkened S-crest built for maximum stagger resistance.')}
                              </span>
                            </div>
                            {skin.isLocked && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-400 font-mono-tactical text-[10px] font-bold ml-2 shrink-0">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>STORE</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Visual signature description for Maxwell Shodron & New Heroes */}
                        {(isMaxwell || isKing || isFlash || isLantern || isShazam || isThor || isSilvester || isDre || isTruth || isHeiliea || isBaby || isZenitsu || isTanjiro || isMuzan || Boolean(NEW_HERO_UI_META[activeOp.id])) && (
                          <div className="mt-2 text-[11px] text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/80 pt-1.5">
                            {skin.multiplier && (
                              <span className="text-amber-300 font-mono-tactical font-black text-[10px] block">
                                {skin.multiplier}
                              </span>
                            )}
                            <span>{skin.transformationLore}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: COMBAT STYLE & SIGNATURE MOVES */}
            {tab === 'abilities' && (
              <div className="space-y-3">
                {/* Character-Specific Power Stats Box */}
                <div className="bg-zinc-900/80 p-3.5 rounded border border-amber-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-mono-tactical text-amber-400 font-black uppercase">
                    <Infinity className="w-4 h-4 text-amber-400" />
                    <span>
                      {isSuperman
                        ? 'KRYPTONIAN SOLAR PHYSIOLOGY'
                        : isGoku
                        ? 'SAIYAN GOD KI POTENTIAL'
                        : isSaitama
                        ? 'LIMITLESS PHYSICAL STATS'
                        : isMaxwell
                        ? 'ASTRAL & CHRONOS SORCERY'
                        : isKing
                        ? 'KING ENGINE INTIMIDATION'
                        : isFlash
                        ? 'SPEED FORCE CONDUIT'
                        : isLantern
                        ? 'OAN POWER RING CONSTRUCTS'
                        : isShazam
                        ? 'MAGIC OF SHAZAM!'
                        : isThor
                        ? 'ASGARDIAN ODINFORCE'
                        : isSilvester
                        ? '15-POWER OMEGA SOVEREIGNTY'
                        : isDre
                        ? '808 SONIC BASSWAVE ARSENAL'
                        : isTruth
                        ? 'VERITAS ILLUSION BREAKER'
                        : isHeiliea
                        ? 'SERAPHIM STARLIGHT VALKYRIE'
                        : isBaby
                        ? 'COSMIC NURSERY TITAN'
                        : isZenitsu
                        ? 'THUNDER BREATHING: FIRST FORM'
                        : isTanjiro
                        ? 'WATER BREATHING & HINOKAMI KAGURA'
                        : isMuzan
                        ? 'DEMON KING BIOMANCY'
                        : NEW_HERO_UI_META[activeOp.id]?.powerBoxTitle || 'TACTICAL COMBAT PROFILE'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {isSuperman
                      ? 'Yellow-sun radiation grants omni-directional supersonic flight, impenetrable Stagger Resistance poise, Arctic Super-Breath, and devastating Thermal Overload laser vision.'
                      : isGoku
                      ? 'Limit-breaking martial mastery channeling divine Ki blasts, Kamehameha beams, Instant Transmission, and Super Saiyan transformations.'
                      : isSaitama
                      ? 'Infinite strength, speed, durability, and reflexes. Has no biological limiters—power scales instantaneously to surpass any threat in existence.'
                      : isMaxwell
                      ? 'Grand Archmage wielding high-velocity Arcane Bolts, Chronos Stasis fields that freeze enemies and erase projectiles, dimensional Phase Blink, and Magic Transmission across 5 elements.'
                      : isKing
                      ? 'S-Class Rank 7 Hero whose terrifying King Engine freezes enemies and erases incoming projectiles, backed up by Saitama Phantom Assists and Hellfire Wave-Motion Cannons.'
                      : isFlash
                      ? 'Fastest Hero Alive with 1.52x base speed, Speed Force Lightning, Phase Warp surges, whirlwind Speed Vortexes, and Infinite Mass Nova.'
                      : isLantern
                      ? 'Wields the emerald Power Ring of Oa for flight, Emerald Hard-Light pulses, protective Ring Wards, falling Meteor Constructs, and piercing Oan Willpower Beams.'
                      : isShazam
                      ? 'Empowered by six ancient deities: Flight of Mercury, Strength of Hercules dashes, Bolt of Zeus sky strikes, and Living Lightning SHAZAM! thunderfalls.'
                      : isThor
                      ? 'Crown Prince of Asgard commanding Mjolnir throws, storm flight, seismic Thunder Slams, and celestial Bifrost Odenforce pillars.'
                      : isSilvester
                      ? 'The pinnacle combatant on the roster with 15 distinct powers: Omni-Flight, Chronos Time-Freeze, Black Hole Singularity, Meteor Rain, Divine Overdrive 4x, Mirror Cloak, Tachyon Step, Solar Nova, Zero Blizzard, Hellfire, Thunder Chain, Soul Drain, Reality Slash, Sovereign Roar, and Omega Apocalypse.'
                      : isDre
                      ? 'Street-legend beatmaker packing an 808 Sub-Cannon that blasts concave bass shockwaves, Sub-Step dashes, Amplify studio armor boosts, and the Omega Mixtape drops.'
                      : isTruth
                      ? 'All-seeing mystic flier wielding Judgment Seals that lock targets and erase enemy spells, Veil Warps, True Sight precision buffs, and Absolute Veritas rays.'
                      : isHeiliea
                      ? 'Celestial winged Valkyrie hovering high above combat with Star Lance salvos, Seraph Healing blessings (+40 HP & cleanse), Starfall rains, and Celestial Nova.'
                      : isBaby
                      ? 'Tiny cosmic prodigy zipping around at 1.40x speed with a hard-to-hit frame, bouncing Tantrum slams, Nap Shields, and a deafening Mega Cry Wave.'
                      : isZenitsu
                      ? 'Demon Slayer who moves at 1.44x speed with glowing thunder orbs—delivering Thunderclap & Flash dashes, Sixfold lightning chains, and Flaming Thunder God slashes.'
                      : isTanjiro
                      ? 'Versatile Demon Slayer combining fluid Water Wheel slashes with blazing Hinokami Kagura fire dashes and Sun Dragon Halo spirals.'
                      : isMuzan
                      ? 'Progenitor of all Demons with passive +2.8 HP/s blood regeneration, sweeping Spine Whip Storms, instant Blood Step teleports, and Black Blood Shockwaves.'
                      : NEW_HERO_UI_META[activeOp.id]?.powerSummary || activeOp.psychologicalProfile?.boredomLoop || activeOp.activeSkill.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono-tactical">
                    <div className="p-1.5 bg-black/40 rounded border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">STRENGTH:</span>
                      <span className="text-amber-400 font-bold">
                        {isSuperman
                          ? 'SOLAR TITAN'
                          : isGoku
                          ? 'MULTIVERSAL'
                          : isSaitama
                          ? 'INFINITE (∞)'
                          : isMaxwell
                          ? 'ARCHMAGE TIER'
                          : isKing
                          ? 'SUPREME LUCK'
                          : isFlash
                          ? 'INFINITE MASS'
                          : isLantern
                          ? 'WILL CONSTRUCT'
                          : isShazam
                          ? 'HERCULES TIER'
                          : isThor
                          ? 'GODLIKE URU'
                          : isSilvester
                          ? 'OMEGA APEX (15X)'
                          : isDre
                          ? 'HEAVY BASS'
                          : isTruth
                          ? 'MYSTIC SEER'
                          : isHeiliea
                          ? 'VALKYRIE TIER'
                          : isBaby
                          ? 'COSMIC CHAOS'
                          : isZenitsu
                          ? 'GODSPEED SLASH'
                          : isTanjiro
                          ? 'SUN BREATHER'
                          : isMuzan
                          ? 'DEMON KING'
                          : NEW_HERO_UI_META[activeOp.id]?.strength || 'ELITE'}
                      </span>
                    </div>
                    <div className="p-1.5 bg-black/40 rounded border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">MOBILITY:</span>
                      <span className="text-cyan-400 font-bold">
                        {isSuperman
                          ? 'SUPERSONIC FLIGHT'
                          : isGoku
                          ? 'INSTANT WARP'
                          : isSaitama
                          ? 'SUBLUMINAL (∞)'
                          : isMaxwell
                          ? 'PHASE BLINK'
                          : isKing
                          ? 'TACTICAL SIDESTEP'
                          : isFlash
                          ? 'SPEED FORCE (1.52x)'
                          : isLantern
                          ? 'RING FLIGHT'
                          : isShazam
                          ? 'MERCURY FLIGHT'
                          : isThor
                          ? 'STORM FLIGHT'
                          : isSilvester
                          ? 'OMNI FLY + WARP'
                          : isTruth || isHeiliea
                          ? 'CELESTIAL FLIGHT'
                          : isBaby
                          ? 'CRAWL ZOOM (1.40x)'
                          : isZenitsu
                          ? 'THUNDER DASH (1.44x)'
                          : isTanjiro
                          ? 'HINOKAMI DASH'
                          : isMuzan
                          ? 'BLOOD STEP WARP'
                          : NEW_HERO_UI_META[activeOp.id]?.mobility || `${activeOp.speed.toFixed(2)}x`}
                      </span>
                    </div>
                    <div className="p-1.5 bg-black/40 rounded border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">DEFENSE:</span>
                      <span className="text-emerald-400 font-bold">
                        {isSuperman
                          ? 'STAGGER POISE'
                          : isSaitama
                          ? 'INVULNERABLE'
                          : isMaxwell
                          ? 'AETHER BARRIER'
                          : isKing
                          ? 'FEAR FREEZE'
                          : isLantern
                          ? 'EMERALD WARD'
                          : isShazam
                          ? 'ACHILLES COURAGE'
                          : isThor
                          ? 'ASGARDIAN SCALE'
                          : isSilvester
                          ? '45% DR + CLOAK'
                          : isDre
                          ? 'AMPLIFY +40 ARMOR'
                          : isTruth
                          ? 'SPELL ERASE SEAL'
                          : isHeiliea
                          ? 'SERAPH +40 HEAL'
                          : isBaby
                          ? 'TINY HITBOX + NAP'
                          : isMuzan
                          ? '+2.8 HP/S REGEN'
                          : NEW_HERO_UI_META[activeOp.id]?.defense || `${activeOp.health} HP`}
                      </span>
                    </div>
                    <div className="p-1.5 bg-black/40 rounded border border-zinc-800 flex justify-between">
                      <span className="text-zinc-400">ULTIMATE:</span>
                      <span className="text-red-400 font-bold">
                        {isSuperman
                          ? 'THERMAL OVERLOAD'
                          : isGoku
                          ? 'KAMEHAMEHA'
                          : isSaitama
                          ? 'SERIOUS PUNCH'
                          : isMaxwell
                          ? 'ARCANE NOVA'
                          : isKing
                          ? 'HELLFIRE CANNON'
                          : isFlash
                          ? 'INFINITE MASS NOVA'
                          : isLantern
                          ? 'OAN BEAM'
                          : isShazam
                          ? 'SHAZAM! THUNDER'
                          : isThor
                          ? 'BIFROST PILLAR'
                          : isSilvester
                          ? 'OMEGA APOCALYPSE'
                          : isDre
                          ? 'OMEGA MIXTAPE'
                          : isTruth
                          ? 'ABSOLUTE TRUTH'
                          : isHeiliea
                          ? 'CELESTIAL NOVA'
                          : isBaby
                          ? 'MEGA CRY WAVE'
                          : isZenitsu
                          ? 'FLAMING THUNDER GOD'
                          : isTanjiro
                          ? 'SUN DRAGON HALO'
                          : isMuzan
                          ? 'BLACK BLOOD NOVA'
                          : NEW_HERO_UI_META[activeOp.id]?.ultimate || activeOp.activeSkill.name.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signature Moves List */}
                {activeOp.signatureMoves && (
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-mono-tactical tracking-wider text-zinc-400 block">
                      SIGNATURE COMBAT MOVES
                    </span>
                    {activeOp.signatureMoves.map((move, idx) => (
                      <div key={idx} className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-black text-xs text-white uppercase">
                            {move.name}
                          </h4>
                          <span className="text-[10px] font-mono-tactical text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {move.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                          {move.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PSYCHOLOGICAL & NARRATIVE PROFILE */}
            {tab === 'lore' && (
              <div className="space-y-3">
                <div className="bg-zinc-900/60 p-3.5 rounded border border-zinc-800 space-y-2">
                  <span className="text-xs uppercase font-mono-tactical text-amber-400 font-bold block">
                    {isSuperman
                      ? 'LAST SON OF KRYPTON'
                      : isGoku
                      ? 'EARTH-RAISED SAIYAN PARAGON'
                      : isSaitama
                      ? 'THE BOREDOM LOOP'
                      : isMaxwell
                      ? 'SOVEREIGN OF THE ASTRAL VEIL'
                      : isKing
                      ? 'THE STRONGEST MAN ON EARTH'
                      : isFlash
                      ? 'AVATAR OF THE SPEED FORCE'
                      : isLantern
                      ? 'SECTOR 2814 PROTECTOR'
                      : isShazam
                      ? 'MORTAL CHAMPION OF ETERNITY'
                      : isThor
                      ? 'PRINCE OF ASGARD'
                      : isSilvester
                      ? 'THE OMEGA SOVEREIGN'
                      : isDre
                      ? '808 STUDIO TITAN'
                      : isTruth
                      ? 'KEEPER OF VERITAS'
                      : isHeiliea
                      ? 'SERAPHIM VALKYRIE'
                      : isBaby
                      ? 'TINY COSMIC PRODIGY'
                      : isZenitsu
                      ? 'THUNDER HASHIRA SUCCESSOR'
                      : isTanjiro
                      ? 'INHERITOR OF THE SUN'
                      : isMuzan
                      ? 'PROGENITOR OF ALL DEMONS'
                      : NEW_HERO_UI_META[activeOp.id]?.loreTitle || `${activeOp.faction.toUpperCase()} DOSSIER`}
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {activeOp.psychologicalProfile?.boredomLoop ||
                      `${activeOp.archetype || activeOp.faction} specialist deployed with ${activeOp.armorRating}% armor rating. ${activeOp.quote}`}
                  </p>
                  {isSuperman && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800 pt-2">
                      Raised in Smallville by Jonathan and Martha Kent, Kal-El channels the boundless power of Earth's yellow sun to shield humanity, holding back unless forced to unleash Thermal Overload.
                    </p>
                  )}
                  {isSaitama && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800 pt-2">
                      Casually unimpressed by grandiose villain speeches, he is intensely passionate about supermarket bargain discounts, catching Saturday sales, and protecting innocent bystanders from collateral damage.
                    </p>
                  )}
                  {isMaxwell && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800 pt-2">
                      Keeper of the Astral Veil, Maxwell Shodron bends spatial geometry and temporal flow with effortless precision, counter-spelling rogue witches and shattering armored lines alike.
                    </p>
                  )}
                  {isSilvester && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800 pt-2">
                      Forged across fifteen astral dominions, SILVESTER A.Jais fuses cosmic singularity control, temporal stasis, hyper-velocity warps, and sovereign armor into one unstoppable warrior.
                    </p>
                  )}
                  {isDre && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800 pt-2">
                      Armed with an acoustic 808 Sub-Cannon rather than cosmic godhood, Dre holds his own through rhythmic bass drops, rapid Sub-Step slides, and relentless groove pressure.
                    </p>
                  )}
                  {(isZenitsu || isTanjiro || isMuzan) && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800 pt-2">
                      {isZenitsu
                        ? 'Though paralyzed by fear while awake, Zenitsu unleashes blinding Thunder Breathing slashes once unconscious, chaining sixfold lightning across the arena.'
                        : isTanjiro
                        ? 'Driven by unwavering kindness and smell-tracking precision, Tanjiro weaves calm Water Breathing deflections into blazing Hinokami Kagura finishers.'
                        : 'Over a thousand years of biological perfection turned Muzan Kibutsuji into an apex nocturnal predator armed with hyper-regeneration and razor spine whips.'}
                    </p>
                  )}
                  {NEW_HERO_UI_META[activeOp.id] && (
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans border-t border-zinc-800 pt-2">
                      {NEW_HERO_UI_META[activeOp.id].loreExtra}
                    </p>
                  )}
                </div>

                <div className="bg-zinc-900/60 p-3.5 rounded border border-zinc-800 space-y-1.5">
                  <span className="text-xs uppercase font-mono-tactical text-cyan-400 font-bold block">
                    {isSuperman
                      ? 'KRYPTONIAN COMBAT DOCTRINE'
                      : isGoku
                      ? 'MARTIAL ARTS DISCIPLINE'
                      : isSaitama
                      ? 'DAILY TRAINING ROUTINE (THE SECRET)'
                      : isMaxwell
                      ? 'ARCANE SORCERY DOCTRINE'
                      : isKing
                      ? 'S-CLASS INTIMIDATION PROTOCOL'
                      : isFlash
                      ? 'SPEED FORCE TACTICS'
                      : isLantern
                      ? 'OAN RING CONSTRUCT DOCTRINE'
                      : isShazam
                      ? 'THE SIX DEITIES OF SHAZAM'
                      : isThor
                      ? 'ASGARDIAN STORM DOCTRINE'
                      : isSilvester
                      ? '15-POWER OMEGA ARSENAL'
                      : isDre
                      ? '808 BASSWAVE DOCTRINE'
                      : isTruth
                      ? 'VERITAS SEAL PROTOCOL'
                      : isHeiliea
                      ? 'VALKYRIE STARLIGHT DOCTRINE'
                      : isBaby
                      ? 'TINY TITAN CHAOS PROTOCOL'
                      : isZenitsu
                      ? 'THUNDER BREATHING DOCTRINE'
                      : isTanjiro
                      ? 'SUN & WATER BREATHING DOCTRINE'
                      : isMuzan
                      ? 'DEMON KING DOCTRINE'
                      : NEW_HERO_UI_META[activeOp.id]?.doctrineTitle || 'ACTIVE ABILITY BRIEFING'}
                  </span>
                  <div className="text-xs font-mono-tactical text-zinc-300 space-y-1">
                    {isSuperman ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>OMNI-DIRECTIONAL FLIGHT + SONIC BOOM</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>STAGGER RESISTANCE INVULNERABILITY</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          <span>ARCTIC SUPER-BREATH CONE</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>THERMAL OVERLOAD (180° LASER EYES)</span>
                        </div>
                      </>
                    ) : isMaxwell ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          <span>FIRE FORM: 1.35x DMG + BURN IMMUNITY</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                          <span>LIGHTNING FORM: +40% SPEED & RAPID CAST</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          <span>FROST FORM: SHIELD REGEN & FREEZE CHILL</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                          <span>VOID FORM: 1.45x PIERCE & LIFESTEAL</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          <span>ARCANE FORM: -30% MANA COST + CHRONOS</span>
                        </div>
                      </>
                    ) : isKing ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>KING ENGINE: FREEZES ENEMIES & WIPES SPELLS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                          <span>SAITAMA ASSIST: SUMMONS PHANTOM SERIOUS STRIKE</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>HELLFIRE WAVE-MOTION CANNON BEAM</span>
                        </div>
                      </>
                    ) : isFlash ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          <span>PASSIVE 1.52x SUPERSONIC MOVEMENT SPEED</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>SPEED VORTEX WHIRLWIND CLEARS SPELLS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>INFINITE MASS NOVA CHAIN DETONATION</span>
                        </div>
                      </>
                    ) : isLantern ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>POWER RING FLIGHT + EMERALD WARD (+55 ARMOR)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          <span>HARD-LIGHT METEOR CONSTRUCT IMPACT</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                          <span>OAN WILLPOWER PIERCING BEAM</span>
                        </div>
                      </>
                    ) : isShazam ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                          <span>FLIGHT OF MERCURY + STRENGTH OF HERCULES DASH</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>POWER OF ZEUS TARGETED SKY LIGHTNING</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>SHAZAM! 5-PILLAR THUNDERFALL (+25 ARMOR)</span>
                        </div>
                      </>
                    ) : isThor ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>STORM FLIGHT + BOOMERANG MJOLNIR TOSS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          <span>SEISMIC ASGARDIAN THUNDER SLAM</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                          <span>BIFROST ODINFORCE SKY PILLAR (+25 HP/ARMOR)</span>
                        </div>
                      </>
                    ) : isSilvester ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>1–5: OMNI-FLIGHT, TIME-FREEZE, BLACK HOLE, METEOR RAIN, GOD 4X</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          <span>6–10: MIRROR CLOAK, TACHYON STEP, SOLAR NOVA, ZERO BLIZZARD, HELLFIRE</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                          <span>11–15: THUNDER CHAIN, SOUL DRAIN, REALITY SLASH, SOVEREIGN ROAR, OMEGA APOCALYPSE</span>
                        </div>
                      </>
                    ) : isDre ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          <span>808 BASS DROP RADIAL SHOCKWAVE</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span>SUB-STEP DASH + STUDIO AMPLIFY (+40 ARMOR)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                          <span>OMEGA MIXTAPE TRIPLE BEAT DETONATION</span>
                        </div>
                      </>
                    ) : isTruth ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                          <span>LEVITATION FLIGHT + VERITAS EYE RAYS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          <span>JUDGMENT SEAL LOCKS TARGETS &amp; WIPES SPELLS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          <span>ABSOLUTE TRUTH FULL-ARENA PURGE</span>
                        </div>
                      </>
                    ) : isHeiliea ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                          <span>VALKYRIE WING FLIGHT + STAR LANCE VOLLEY</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>SERAPH BLESSING (+40 HP / +35 ARMOR CLEANSE)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                          <span>STARFALL RAIN &amp; CELESTIAL NOVA</span>
                        </div>
                      </>
                    ) : isBaby ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>1.40x TINY AGILITY + CRAWL ZOOM</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span>COSMIC TANTRUM SLAM &amp; NAP SHIELD (+45 ARMOR)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          <span>MEGA CRYING WAVE SONIC KNOCKBACK</span>
                        </div>
                      </>
                    ) : isZenitsu ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                          <span>1.44x PASSIVE SPEED + THUNDER TRAIL ORBS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>FIRST FORM THUNDERCLAP &amp; FLASH</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          <span>SIXFOLD CHAIN &amp; FLAMING THUNDER GOD</span>
                        </div>
                      </>
                    ) : isTanjiro ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>WATER WHEEL 360° DEFLECTION (CLEARS SPELLS)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          <span>HINOKAMI KAGURA FIRE DASH</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>SUN DRAGON HALO + +25 HP BREATHING RECOVERY</span>
                        </div>
                      </>
                    ) : isMuzan ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>PASSIVE +2.8 HP/SEC DEMON KING REGENERATION</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <span>SPINE WHIP STORM + INSTANT BLOOD STEP</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>BLACK BLOOD SHOCKWAVE +40 LIFESTEAL HEAL</span>
                        </div>
                      </>
                    ) : isSaitama ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>100 PUSH-UPS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>100 SIT-UPS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>100 SQUATS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>10 KILOMETER RUN EVERY SINGLE DAY!</span>
                        </div>
                      </>
                    ) : NEW_HERO_UI_META[activeOp.id] ? (
                      <>
                        {NEW_HERO_UI_META[activeOp.id].bullets.map((b, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${b.dotClass}`} />
                            <span>{b.text}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="font-sans text-zinc-400 leading-relaxed">
                        {activeOp.activeSkill.name}: {activeOp.activeSkill.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 lg:pt-3 border-t border-zinc-800/80 shrink-0">
            {activeSkin?.isLocked ? (
              <button
                onClick={() => {
                  soundEngine.playUIClick('select');
                  if (onOpenStore) {
                    onOpenStore();
                  }
                }}
                className="w-full py-2.5 lg:py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-black uppercase tracking-widest text-xs lg:text-sm clip-tactical-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>UNLOCK IN STORE ({activeSkin.priceCP || 350} CP)</span>
              </button>
            ) : (
              <button
                onClick={handleEquip}
                className="w-full py-2.5 lg:py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black font-black uppercase tracking-widest text-xs lg:text-sm clip-tactical-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>EQUIP {activeOp.name.toUpperCase()}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
