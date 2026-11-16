import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Crosshair,
  Flame,
  Lock,
  MapPin,
  Play,
  Shield,
  Sliders,
  Sparkles,
  Swords,
  User,
  Zap,
} from 'lucide-react';
import {
  ArenaMap,
  GameMode,
  OperatorData,
  TacticalPerk,
  WeaponData,
} from '../../types/game';
import { getPerksForOperator, getWeaponsForOperator } from '../../data/gameData';
import { LobbyViewer } from '../../game/lobbyViewer';
import { soundEngine } from '../../audio/soundEngine';

interface DeploymentPrepLayerProps {
  operators: OperatorData[];
  selectedOperator: OperatorData;
  primaryWeapon: WeaponData;
  secondaryWeapon: WeaponData;
  selectedPerk: TacticalPerk;
  activeMap: ArenaMap;
  selectedMode: GameMode;
  onChangeOperator: (op: OperatorData) => void;
  onSelectSkin: (skinId: string) => void;
  onEquipPrimary: (weapon: WeaponData) => void;
  onEquipSecondary: (weapon: WeaponData) => void;
  onSelectPerk: (perk: TacticalPerk) => void;
  onToggleAttachment: (weaponId: string, attachmentId: string) => void;
  onOpenMaps: () => void;
  onOpenStore: () => void;
  onBack: () => void;
  onPlayMatch: () => void;
}

type PrepSlotTab = 'overview' | 'skin' | 'primary' | 'secondary' | 'perk';

export const DeploymentPrepLayer: React.FC<DeploymentPrepLayerProps> = ({
  operators,
  selectedOperator,
  primaryWeapon,
  secondaryWeapon,
  selectedPerk,
  activeMap,
  selectedMode,
  onChangeOperator,
  onSelectSkin,
  onEquipPrimary,
  onEquipSecondary,
  onSelectPerk,
  onToggleAttachment,
  onOpenMaps,
  onOpenStore,
  onBack,
  onPlayMatch,
}) => {
  const [activeSlot, setActiveSlot] = useState<PrepSlotTab>('overview');
  const [inspectWeapon, setInspectWeapon] = useState<WeaponData>(primaryWeapon);
  const viewerMountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<LobbyViewer | null>(null);

  const operatorWeapons = getWeaponsForOperator(selectedOperator);
  const primaryPool = operatorWeapons.filter(w => w.category === 'primary');
  const secondaryPool = operatorWeapons.filter(w => w.category === 'secondary');
  const perkPool = getPerksForOperator(selectedOperator);
  const activeSkin =
    selectedOperator.skins.find(s => s.id === selectedOperator.selectedSkinId) ||
    selectedOperator.skins[0];

  const isSaitama = selectedOperator.id === 'saitama';
  const isGoku = selectedOperator.id === 'son_goku';
  const isSuperman = selectedOperator.id === 'superman';
  const isMaxwell = selectedOperator.id === 'maxwell_shodron';

  useEffect(() => {
    setInspectWeapon(primaryWeapon);
  }, [primaryWeapon]);

  // Initialize 3D Operator Preview
  useEffect(() => {
    if (viewerMountRef.current && !viewerRef.current) {
      const viewer = new LobbyViewer(viewerMountRef.current, selectedOperator, inspectWeapon);
      viewerRef.current = viewer;

      const handleResize = () => viewer.handleResize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        viewer.dispose();
        viewerRef.current = null;
      };
    }
  }, []);

  // Update 3D model live when operator, skin, or weapon changes
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.updateOperator(selectedOperator, inspectWeapon);
    }
  }, [selectedOperator, inspectWeapon]);

  const handleOperatorSwitch = (op: OperatorData) => {
    soundEngine.playUIClick('select');
    onChangeOperator(op);
  };

  const handleSkinPick = (skinId: string, isLocked?: boolean) => {
    if (isLocked) {
      soundEngine.playUIClick('tab');
      onOpenStore();
      return;
    }
    soundEngine.playUIClick('select');
    onSelectSkin(skinId);
  };

  return (
    <div className="absolute inset-0 z-40 h-dvh bg-[#07090e] text-white flex flex-col overflow-hidden select-none">
      {/* Compact Top Header */}
      <div className="h-11 lg:h-14 px-3 lg:px-6 flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/85 z-10 backdrop-blur-sm shrink-0">
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

          <h1 className="text-xs sm:text-sm lg:text-lg font-bold font-heading uppercase tracking-wider text-white flex items-center space-x-2 min-w-0">
            <span className="text-amber-400 whitespace-nowrap">DEPLOYMENT PREP</span>
            <span className="hidden sm:inline-block text-[10px] lg:text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono-tactical border border-amber-500/30 whitespace-nowrap">
              EQUIPPED LOADOUT INSPECT
            </span>
          </h1>
        </div>

        {/* Selected Arena & Mode Chip + Change Map Button */}
        <button
          onClick={() => {
            soundEngine.playUIClick('tab');
            onOpenMaps();
          }}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-[10px] lg:text-xs font-mono-tactical transition-all shrink-0"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-white font-bold uppercase truncate max-w-[120px] sm:max-w-none">
            {activeMap.name}
          </span>
          <span className="text-cyan-400 uppercase font-bold">
            [{selectedMode === 'duel_1v1' ? '1V1 MATCH' : 'FREE-FOR-ALL'}]
          </span>
        </button>
      </div>

      {/* Main Split Workspace (Horizontal even on rotated phone landscape!) */}
      <div className="flex-1 min-h-0 flex flex-col min-[540px]:flex-row overflow-hidden relative">
        {/* LEFT STAGE: 3D Character & Equipped Loadout Switcher */}
        <div className="relative h-36 min-[540px]:h-auto min-[540px]:w-[42%] lg:w-[44%] border-b min-[540px]:border-b-0 min-[540px]:border-r border-zinc-800/80 bg-gradient-to-b from-[#0d111a] to-[#06080c] flex flex-col justify-between overflow-hidden shrink-0">
          {/* 3D Interactive Operator Viewport */}
          <div
            ref={viewerMountRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Top Left Identity Overlay */}
          <div className="relative z-10 p-2.5 lg:p-4 pointer-events-none flex items-start justify-between">
            <div>
              <span className="text-[9px] lg:text-[10px] font-mono-tactical text-amber-400 uppercase tracking-widest block">
                // READY FOR DEPLOYMENT
              </span>
              <h2 className="text-lg lg:text-2xl font-black font-heading uppercase text-white leading-none mt-0.5 drop-shadow">
                {selectedOperator.name}
              </h2>
              <span className="text-[10px] lg:text-xs font-mono-tactical text-cyan-300 block mt-0.5">
                {activeSkin?.name}
              </span>
            </div>

            <div className="px-2 py-0.5 rounded bg-black/75 border border-zinc-700/80 text-[9px] lg:text-[10px] font-mono-tactical text-zinc-300">
              {selectedOperator.callsign}
            </div>
          </div>

          {/* Bottom Hero Quick-Switch Strip inside 3D Stage */}
          <div className="relative z-10 p-2 lg:p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] lg:text-[10px] font-mono-tactical text-zinc-400 uppercase tracking-wider">
                SWITCH OPERATOR
              </span>
              <span className="text-[9px] font-mono-tactical text-zinc-500">
                DRAG HERO TO ROTATE
              </span>
            </div>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
              {operators.map(op => {
                const isSelected = op.id === selectedOperator.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => handleOperatorSwitch(op)}
                    className={`px-2.5 py-1 rounded border text-[10px] lg:text-xs font-heading font-bold uppercase tracking-wide whitespace-nowrap shrink-0 transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-300 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900/85 text-zinc-300 border-zinc-700/70 hover:border-zinc-500 hover:text-white'
                    }`}
                  >
                    {op.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT WORKSPACE: All Equipped Gear Cards + Live Customization Drawer */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-zinc-950/85 overflow-hidden">
          {/* Slot Filter Tabs */}
          <div className="px-3 py-1.5 lg:px-5 lg:py-2.5 border-b border-zinc-800/80 bg-zinc-950 flex items-center space-x-1.5 overflow-x-auto shrink-0">
            {[
              { id: 'overview', label: 'ALL EQUIPPED', icon: Shield },
              { id: 'skin', label: isGoku ? 'FORM / SKIN' : isMaxwell ? 'ATTIRE / SKIN' : 'SKIN / SUIT', icon: Sparkles },
              { id: 'primary', label: isMaxwell ? 'MAIN SPELL' : isSaitama || isGoku || isSuperman ? 'MAIN POWER' : 'PRIMARY', icon: Crosshair },
              { id: 'secondary', label: isMaxwell ? 'ULTIMATE / ORB' : isSaitama || isGoku || isSuperman ? 'ULTIMATE / ALT' : 'SECONDARY', icon: Swords },
              { id: 'perk', label: 'PERK & SKILL', icon: Zap },
            ].map(tabItem => {
              const Icon = tabItem.icon;
              const isActive = activeSlot === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => {
                    soundEngine.playUIClick('tab');
                    setActiveSlot(tabItem.id as PrepSlotTab);
                  }}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] lg:text-xs font-mono-tactical uppercase tracking-wider whitespace-nowrap shrink-0 transition-all border ${
                    isActive
                      ? 'bg-amber-500 text-black font-black border-amber-400'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Equipped Items & Quick Swapper */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-5 space-y-3">
            {/* TAB: OVERVIEW — Shows every single thing equipped by the player with direct Change buttons */}
            {activeSlot === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* 1. Equipped Character & Skin */}
                  <div
                    onClick={() => {
                      soundEngine.playUIClick('tab');
                      setActiveSlot('skin');
                    }}
                    className="p-2.5 lg:p-3 rounded border border-zinc-800 bg-zinc-900/75 hover:border-amber-400/80 cursor-pointer transition-all clip-tactical-sm flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono-tactical text-amber-400 uppercase font-bold flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>SUIT / TRANSFORMATION</span>
                      </span>
                      <h4 className="font-heading font-black text-xs lg:text-sm text-white uppercase truncate mt-0.5">
                        {activeSkin?.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-mono-tactical block truncate">
                        {activeSkin?.rarity} · {selectedOperator.faction}
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono-tactical text-amber-400 font-bold shrink-0">
                      CHANGE
                    </span>
                  </div>

                  {/* 2. Equipped Primary Power / Weapon */}
                  <div
                    onClick={() => {
                      soundEngine.playUIClick('tab');
                      setActiveSlot('primary');
                    }}
                    className="p-2.5 lg:p-3 rounded border border-zinc-800 bg-zinc-900/75 hover:border-amber-400/80 cursor-pointer transition-all clip-tactical-sm flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono-tactical text-cyan-400 uppercase font-bold flex items-center space-x-1">
                        <Crosshair className="w-3 h-3" />
                        <span>{isMaxwell ? 'PRIMARY ARCANE SPELL' : isSaitama || isGoku || isSuperman ? 'PRIMARY COMBAT POWER' : 'PRIMARY WEAPON'}</span>
                      </span>
                      <h4 className="font-heading font-black text-xs lg:text-sm text-white uppercase truncate mt-0.5">
                        {primaryWeapon.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-mono-tactical block truncate">
                        {primaryWeapon.damage} DMG · {primaryWeapon.fireRate} RPS · RNG {primaryWeapon.range}
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono-tactical text-cyan-400 font-bold shrink-0">
                      CHANGE
                    </span>
                  </div>

                  {/* 3. Equipped Secondary Power / Sidearm */}
                  <div
                    onClick={() => {
                      soundEngine.playUIClick('tab');
                      setActiveSlot('secondary');
                    }}
                    className="p-2.5 lg:p-3 rounded border border-zinc-800 bg-zinc-900/75 hover:border-amber-400/80 cursor-pointer transition-all clip-tactical-sm flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono-tactical text-rose-400 uppercase font-bold flex items-center space-x-1">
                        <Swords className="w-3 h-3" />
                        <span>{isMaxwell ? 'SECONDARY SPELL / ORB' : isSaitama || isGoku || isSuperman ? 'SECONDARY / SIGNATURE' : 'SECONDARY SIDEARM'}</span>
                      </span>
                      <h4 className="font-heading font-black text-xs lg:text-sm text-white uppercase truncate mt-0.5">
                        {secondaryWeapon.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-mono-tactical block truncate">
                        {secondaryWeapon.damage} DMG · {secondaryWeapon.type.toUpperCase()} CLASS
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono-tactical text-rose-400 font-bold shrink-0">
                      CHANGE
                    </span>
                  </div>

                  {/* 4. Equipped Tactical Perk */}
                  <div
                    onClick={() => {
                      soundEngine.playUIClick('tab');
                      setActiveSlot('perk');
                    }}
                    className="p-2.5 lg:p-3 rounded border border-zinc-800 bg-zinc-900/75 hover:border-amber-400/80 cursor-pointer transition-all clip-tactical-sm flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono-tactical text-emerald-400 uppercase font-bold flex items-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span>TACTICAL PERK</span>
                      </span>
                      <h4 className="font-heading font-black text-xs lg:text-sm text-white uppercase truncate mt-0.5">
                        {selectedPerk.name}
                      </h4>
                      <span className="text-[10px] text-emerald-300 font-mono-tactical block truncate">
                        {selectedPerk.bonusLabel}
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono-tactical text-emerald-400 font-bold shrink-0">
                      CHANGE
                    </span>
                  </div>
                </div>

                {/* 5. Active Skill & Signature Moves Summary */}
                <div className="p-2.5 lg:p-3 rounded border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-[10px] lg:text-xs font-mono-tactical font-bold text-amber-400 uppercase">
                      <Flame className="w-3.5 h-3.5" />
                      <span>ACTIVE SKILL: {selectedOperator.activeSkill.name}</span>
                    </div>
                    <span className="text-[10px] font-mono-tactical text-zinc-400">
                      CD {selectedOperator.activeSkill.cooldown}s
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    {selectedOperator.activeSkill.description}
                  </p>

                  {selectedOperator.signatureMoves && selectedOperator.signatureMoves.length > 0 && (
                    <div className="pt-1.5 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
                      {selectedOperator.signatureMoves.map((mv, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] lg:text-[10px] font-mono-tactical px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200"
                        >
                          {mv.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Attachments quick toggles (if weapon supports attachments) */}
                {primaryWeapon.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono-tactical text-zinc-400 uppercase">
                      <Sliders className="w-3 h-3 text-amber-400" />
                      <span>EQUIPPED MODIFICATIONS ({primaryWeapon.name})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {primaryWeapon.attachments.map(att => (
                        <button
                          key={att.id}
                          onClick={() => {
                            soundEngine.playUIClick('tab');
                            onToggleAttachment(primaryWeapon.id, att.id);
                          }}
                          className={`px-2.5 py-1.5 rounded border text-left flex items-center justify-between text-[10px] lg:text-xs transition-all ${
                            att.enabled
                              ? 'border-amber-400 bg-amber-500/15 text-white'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                          }`}
                        >
                          <span className="truncate pr-1 font-heading font-bold uppercase">
                            {att.name}
                          </span>
                          <span
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              att.enabled
                                ? 'border-amber-400 bg-amber-500 text-black'
                                : 'border-zinc-700'
                            }`}
                          >
                            {att.enabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SKIN / TRANSFORMATION SWAPPER */}
            {activeSlot === 'skin' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase tracking-wider">
                    SELECT {selectedOperator.name.toUpperCase()} SKIN / FORM ({selectedOperator.skins.length})
                  </span>
                  <button
                    onClick={() => setActiveSlot('overview')}
                    className="text-[10px] font-mono-tactical text-amber-400 hover:underline uppercase"
                  >
                    BACK TO EQUIPPED SUMMARY
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedOperator.skins.map(skin => {
                    const isEquipped = selectedOperator.selectedSkinId === skin.id;
                    return (
                      <div
                        key={skin.id}
                        onClick={() => handleSkinPick(skin.id, skin.isLocked)}
                        className={`p-2.5 rounded border cursor-pointer transition-all clip-tactical-sm flex items-center justify-between gap-2 ${
                          isEquipped
                            ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                            : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className="w-4 h-4 rounded-full border border-white/50 shrink-0"
                            style={{ backgroundColor: skin.hairColor || skin.primaryColor }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-heading font-bold text-xs lg:text-sm text-white uppercase truncate">
                              {skin.name}
                            </h4>
                            <span className="text-[10px] font-mono-tactical text-zinc-400 block truncate">
                              {skin.multiplier || skin.rarity}
                            </span>
                          </div>
                        </div>

                        {skin.isLocked ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-mono-tactical font-bold flex items-center space-x-1 shrink-0">
                            <Lock className="w-3 h-3" />
                            <span>{skin.priceCP || 350} CP</span>
                          </span>
                        ) : isEquipped ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-mono-tactical font-black flex items-center space-x-1 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>EQUIPPED</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono-tactical shrink-0">
                            EQUIP
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: PRIMARY POWER / WEAPON SWAPPER */}
            {activeSlot === 'primary' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase tracking-wider">
                    SELECT PRIMARY {isMaxwell ? 'ARCANE SPELL' : isSaitama || isGoku || isSuperman ? 'POWER / ABILITY' : 'WEAPON'} ({primaryPool.length})
                  </span>
                  <button
                    onClick={() => setActiveSlot('overview')}
                    className="text-[10px] font-mono-tactical text-amber-400 hover:underline uppercase"
                  >
                    BACK TO EQUIPPED SUMMARY
                  </button>
                </div>

                <div className="space-y-2">
                  {primaryPool.map(item => {
                    const isEquipped = primaryWeapon.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          soundEngine.playUIClick('select');
                          setInspectWeapon(item);
                          onEquipPrimary(item);
                        }}
                        className={`p-2.5 lg:p-3 rounded border cursor-pointer transition-all clip-tactical-sm flex items-center justify-between gap-3 ${
                          isEquipped
                            ? 'border-cyan-400 bg-cyan-500/10'
                            : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-600'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-heading font-black text-xs lg:text-sm text-white uppercase">
                              {item.name}
                            </h4>
                            <span className="text-[9px] font-mono-tactical px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 uppercase">
                              {item.damage} DMG · {item.fireRate} RPS
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        </div>

                        {isEquipped ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-400 text-black text-[10px] font-mono-tactical font-black flex items-center space-x-1 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>EQUIPPED</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono-tactical shrink-0">
                            EQUIP
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: SECONDARY POWER / SIDEARM SWAPPER */}
            {activeSlot === 'secondary' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase tracking-wider">
                    SELECT SECONDARY {isMaxwell ? 'ARCANE INVOCATION' : isSaitama || isGoku || isSuperman ? 'SIGNATURE STRIKE' : 'SIDEARM / MELEE'} ({secondaryPool.length})
                  </span>
                  <button
                    onClick={() => setActiveSlot('overview')}
                    className="text-[10px] font-mono-tactical text-amber-400 hover:underline uppercase"
                  >
                    BACK TO EQUIPPED SUMMARY
                  </button>
                </div>

                <div className="space-y-2">
                  {secondaryPool.map(item => {
                    const isEquipped = secondaryWeapon.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          soundEngine.playUIClick('select');
                          setInspectWeapon(item);
                          onEquipSecondary(item);
                        }}
                        className={`p-2.5 lg:p-3 rounded border cursor-pointer transition-all clip-tactical-sm flex items-center justify-between gap-3 ${
                          isEquipped
                            ? 'border-rose-400 bg-rose-500/10'
                            : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-600'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-heading font-black text-xs lg:text-sm text-white uppercase">
                              {item.name}
                            </h4>
                            <span className="text-[9px] font-mono-tactical px-1.5 py-0.5 rounded bg-zinc-800 text-rose-300 uppercase">
                              {item.damage} DMG · RNG {item.range}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        </div>

                        {isEquipped ? (
                          <span className="px-2 py-0.5 rounded bg-rose-400 text-black text-[10px] font-mono-tactical font-black flex items-center space-x-1 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>EQUIPPED</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono-tactical shrink-0">
                            EQUIP
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: TACTICAL PERK SWAPPER */}
            {activeSlot === 'perk' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase tracking-wider">
                    SELECT TACTICAL PERK ({perkPool.length})
                  </span>
                  <button
                    onClick={() => setActiveSlot('overview')}
                    className="text-[10px] font-mono-tactical text-amber-400 hover:underline uppercase"
                  >
                    BACK TO EQUIPPED SUMMARY
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perkPool.map(perk => {
                    const isEquipped = selectedPerk.id === perk.id;
                    return (
                      <div
                        key={perk.id}
                        onClick={() => {
                          soundEngine.playUIClick('select');
                          onSelectPerk(perk);
                        }}
                        className={`p-2.5 rounded border cursor-pointer transition-all clip-tactical-sm flex flex-col justify-between gap-1 ${
                          isEquipped
                            ? 'border-emerald-400 bg-emerald-500/15'
                            : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-heading font-black text-xs lg:text-sm text-white uppercase truncate">
                            {perk.name}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono-tactical font-bold shrink-0">
                            {perk.bonusLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          {perk.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PINNED BOTTOM DEPLOYMENT BAR WITH GLOWING PLAY BUTTON */}
      <div className="px-3 py-2 lg:px-6 lg:py-3 bg-zinc-950/95 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md">
        <div className="min-w-0 flex items-center space-x-3 overflow-x-auto">
          <div className="shrink-0">
            <span className="text-[9px] font-mono-tactical text-zinc-500 uppercase block leading-none">
              EQUIPPED SUMMARY
            </span>
            <div className="text-xs lg:text-sm font-heading font-bold text-white uppercase truncate mt-0.5">
              <span className="text-amber-400">{selectedOperator.name}</span>
              <span className="text-zinc-500 mx-1.5">·</span>
              <span className="text-cyan-300">{primaryWeapon.name}</span>
              <span className="text-zinc-500 mx-1.5">·</span>
              <span className="text-rose-300">{secondaryWeapon.name}</span>
              <span className="hidden md:inline text-zinc-500 mx-1.5">·</span>
              <span className="hidden md:inline text-emerald-300">{selectedPerk.name}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            soundEngine.playUIClick('deploy');
            onPlayMatch();
          }}
          className="px-6 py-2 lg:px-10 lg:py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-heading font-black uppercase tracking-widest text-xs lg:text-base clip-tactical-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(234,179,8,0.45)] flex items-center space-x-2 shrink-0"
        >
          <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-black stroke-black" />
          <span>PLAY</span>
        </button>
      </div>
    </div>
  );
};
