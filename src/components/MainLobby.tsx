import React, { useEffect, useRef, useState } from 'react';
import { 
  Settings, 
  Mail, 
  Users, 
  ShoppingBag, 
  Award, 
  Crosshair, 
  Play, 
  MessageSquare, 
  Plus, 
  BatteryMedium, 
  Wifi, 
  Sparkles, 
  Backpack, 
  ArrowLeftRight, 
  Maximize2,
  MapPin
} from 'lucide-react';
import { ArenaMap, GameMode, OperatorData, WeaponData } from '../types/game';
import { LobbyViewer } from '../game/lobbyViewer';
import { soundEngine } from '../audio/soundEngine';

interface MainLobbyProps {
  playerOperator: OperatorData;
  equippedWeapon: WeaponData;
  activeMap: ArenaMap;
  selectedMode: GameMode;
  onOpenLayer: (layer: 'operators' | 'loadout' | 'settings' | 'maps' | 'store' | 'battlepass' | 'room_lobby' | 'deployment_prep' | 'ranked') => void;
  onStartGame: () => void;
}

export const MainLobby: React.FC<MainLobbyProps> = ({
  playerOperator,
  equippedWeapon,
  activeMap,
  selectedMode,
  onOpenLayer,
  onStartGame,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<LobbyViewer | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inboxToast, setInboxToast] = useState<string | null>(null);

  // Initialize 3D Turntable in Background Center
  useEffect(() => {
    if (mountRef.current && !viewerRef.current) {
      const viewer = new LobbyViewer(mountRef.current, playerOperator, equippedWeapon);
      viewerRef.current = viewer;

      const handleResize = () => viewer.handleResize();
      window.addEventListener('resize', handleResize);

      // Start atmospheric menu ambient music
      soundEngine.startAmbientLoop();

      return () => {
        window.removeEventListener('resize', handleResize);
        viewer.dispose();
        viewerRef.current = null;
      };
    }
  }, []);

  // Update 3D operator when changed
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.updateOperator(playerOperator, equippedWeapon);
    }
  }, [playerOperator, equippedWeapon]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleMailboxClick = () => {
    soundEngine.playUIClick('tab');
    setInboxToast('Inbox: 6 supply drops claimed! +500 Credits added.');
    setTimeout(() => setInboxToast(null), 3000);
  };

  return (
    <div className="relative w-full h-dvh bg-[#06080c] text-white select-none overflow-hidden flex flex-col justify-between">
      {/* 3D ATMOSPHERIC OPERATOR STAGE (Canvas in Background) */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" 
      />

      {/* Atmospheric Background Vignette & Dusk Sky Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none z-1" />
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-red-600/15 blur-3xl pointer-events-none z-1" />

      {/* Inbox Toast Notification */}
      {inboxToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded bg-zinc-950/95 border border-amber-400 text-amber-300 text-xs font-mono-tactical font-bold shadow-xl animate-fadeIn">
          {inboxToast}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER CLUSTER (Profile, Currencies, Social, Settings, Battery)       */}
      {/* ========================================================================= */}
      <div className="relative z-10 px-3 pt-1.5 pb-1 lg:px-5 lg:pt-3 flex items-center justify-between gap-2 shrink-0">
        {/* Top-Left: Player Profile Card & Currencies */}
        <div className="flex items-center space-x-2 min-w-0">
          <div 
            onClick={() => onOpenLayer('operators')}
            className="flex items-center space-x-2 bg-black/65 border border-zinc-700/80 p-1 pr-2.5 lg:p-1.5 lg:pr-4 rounded-sm clip-tactical-sm cursor-pointer hover:border-amber-400 transition-all backdrop-blur-xs group shrink-0"
          >
            {/* Avatar Emblem */}
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded border flex items-center justify-center font-heading font-black text-xs lg:text-lg shadow-md group-hover:scale-105 transition-transform ${
              playerOperator.id === 'saitama'
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-amber-300 text-black'
                : playerOperator.id === 'son_goku'
                ? 'bg-gradient-to-tr from-orange-500 to-amber-400 border-orange-400 text-black'
                : playerOperator.id === 'superman'
                ? 'bg-gradient-to-tr from-red-600 via-blue-700 to-amber-400 border-red-400 text-yellow-200'
                : playerOperator.id === 'maxwell_shodron'
                ? 'bg-gradient-to-tr from-violet-600 via-purple-700 to-amber-400 border-violet-400 text-amber-200'
                : 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 text-black'
            }`}>
              {playerOperator.id === 'saitama' ? 'OPM' : playerOperator.id === 'son_goku' ? 'DBZ' : playerOperator.id === 'superman' ? 'SM' : playerOperator.id === 'maxwell_shodron' ? 'MS' : playerOperator.name.slice(0, 2).toUpperCase()}
            </div>
            {/* Nickname & Level */}
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-heading font-bold text-xs lg:text-sm tracking-wide text-white uppercase group-hover:text-amber-400">
                  {playerOperator.name}
                </span>
                <span className="text-[9px] lg:text-[10px] font-mono-tactical text-amber-400 font-bold px-1 bg-amber-500/20 rounded border border-amber-500/40 whitespace-nowrap">
                  {playerOperator.id === 'saitama' ? 'LIMITER: BROKEN' : playerOperator.id === 'son_goku' ? 'SAIYAN GOD' : playerOperator.id === 'superman' ? 'MAN OF STEEL' : playerOperator.id === 'maxwell_shodron' ? 'ARCHMAGE' : 'LV. 99'}
                </span>
              </div>
              {/* XP Bar */}
              <div className="w-20 lg:w-28 h-1 lg:h-1.5 bg-zinc-800 rounded-full mt-0.5 lg:mt-1 overflow-hidden border border-zinc-700">
                <div className="h-full bg-amber-400 w-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Currencies: Credits & COD Points */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Credits (C) */}
            <div className="flex items-center space-x-1 px-2 py-0.5 lg:px-3 lg:py-1 bg-black/65 border border-zinc-700/80 rounded-sm clip-tactical-sm text-[11px] lg:text-xs font-mono-tactical backdrop-blur-xs">
              <span className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full bg-zinc-700 text-[9px] flex items-center justify-center font-bold text-zinc-300">C</span>
              <span className="font-bold text-zinc-200">40,334</span>
            </div>

            {/* COD Points (CP) with + button */}
            <div 
              onClick={() => onOpenLayer('store')}
              className="flex items-center space-x-1 px-2 py-0.5 lg:px-2.5 lg:py-1 bg-black/65 border border-amber-500/40 rounded-sm clip-tactical-sm text-[11px] lg:text-xs font-mono-tactical cursor-pointer hover:border-amber-400 transition-all backdrop-blur-xs group"
            >
              <span className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full bg-amber-500 text-[9px] flex items-center justify-center font-bold text-black">CP</span>
              <span className="font-bold text-amber-400">1,250</span>
              <span className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <Plus className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right: Mailbox, Friends, Settings, Fullscreen, Battery */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button 
            onClick={() => onOpenLayer('battlepass')}
            className="w-7 h-7 lg:w-8 lg:h-8 rounded bg-black/65 border border-zinc-700 hover:border-amber-400 flex items-center justify-center text-zinc-300 hover:text-amber-400 transition-colors backdrop-blur-xs"
            title="Battle Pass"
          >
            <Award className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
          </button>

          <button 
            onClick={handleMailboxClick}
            className="relative w-7 h-7 lg:w-8 lg:h-8 rounded bg-black/65 border border-zinc-700 hover:border-amber-400 flex items-center justify-center text-zinc-300 hover:text-white transition-colors backdrop-blur-xs"
            title="Mailbox"
          >
            <Mail className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 lg:w-4 lg:h-4 bg-amber-500 text-black rounded-full text-[8px] lg:text-[9px] font-mono-tactical font-black flex items-center justify-center">
              6
            </span>
          </button>

          <button 
            onClick={() => onOpenLayer('room_lobby')}
            className="w-7 h-7 lg:w-8 lg:h-8 rounded bg-black/65 border border-zinc-700 hover:border-amber-400 flex items-center justify-center text-zinc-300 hover:text-white transition-colors backdrop-blur-xs"
            title="Squad Friends"
          >
            <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </button>

          <button 
            onClick={() => onOpenLayer('settings')}
            className="w-7 h-7 lg:w-8 lg:h-8 rounded bg-black/65 border border-zinc-700 hover:border-amber-400 flex items-center justify-center text-zinc-300 hover:text-amber-400 transition-colors backdrop-blur-xs"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </button>

          <button 
            onClick={toggleFullscreen}
            className="w-7 h-7 lg:w-8 lg:h-8 rounded bg-black/65 border border-zinc-700 hover:border-cyan-400 flex items-center justify-center text-zinc-300 hover:text-white transition-colors backdrop-blur-xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
          >
            <Maximize2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </button>

          <div className="hidden sm:flex items-center space-x-1 pl-1 text-zinc-400 font-mono-tactical text-[10px] lg:text-[11px]">
            <BatteryMedium className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
            <Wifi className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-cyan-400" />
            <span>24ms</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MIDDLE SECTION: Left Promotional Cards & Right Game Mode Selector         */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex-1 min-h-0 px-3 lg:px-5 py-1 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left Side: Seasonal Cards & Store Banners */}
        <div className="w-44 sm:w-52 lg:w-56 max-h-full overflow-y-auto flex flex-col justify-center space-y-1.5 lg:space-y-2.5 pointer-events-auto pr-0.5">
          {/* Featured Card 1: Samurai's Soul Series */}
          <div 
            onClick={() => onOpenLayer('store')}
            className="relative p-1.5 lg:p-2.5 rounded bg-zinc-950/75 border border-zinc-800 hover:border-amber-400 cursor-pointer clip-tactical-sm transition-all group backdrop-blur-xs shrink-0"
          >
            <div className="text-[8px] lg:text-[9px] font-mono-tactical text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-400" />
              <span>MYTHIC DROP</span>
            </div>
            <h4 className="font-heading font-black text-[11px] lg:text-xs text-white uppercase mt-0.5 group-hover:text-amber-400 leading-tight">
              Samurai's Soul Series
            </h4>
            <div className="py-1 lg:h-9 mt-1 rounded bg-gradient-to-r from-red-950 via-zinc-900 to-amber-950 border border-zinc-800 flex items-center justify-center text-[9px] lg:text-[10px] font-mono-tactical text-zinc-300">
              [ ︻╦╤─ BLUEPRINTS ]
            </div>
          </div>

          {/* Featured Card 2: Vampires vs Werewolves / Tier 15 */}
          <div 
            onClick={() => onOpenLayer('battlepass')}
            className="relative p-1.5 lg:p-2.5 rounded bg-zinc-950/75 border border-zinc-800 hover:border-amber-400 cursor-pointer clip-tactical-sm transition-all group backdrop-blur-xs flex items-center justify-between gap-1.5 shrink-0"
          >
            <div className="min-w-0">
              <span className="text-[8px] lg:text-[9px] font-mono-tactical text-cyan-400 uppercase block leading-none">
                BATTLE PASS S3
              </span>
              <h4 className="font-heading font-black text-[11px] lg:text-xs text-white uppercase group-hover:text-amber-400 leading-tight mt-0.5 truncate">
                Vampires vs Werewolves
              </h4>
            </div>
            <div className="px-1.5 py-0.5 lg:px-2 lg:py-1 rounded bg-amber-500/20 border border-amber-500/50 text-[8px] lg:text-[10px] font-mono-tactical font-black text-amber-400 flex flex-col items-center shrink-0">
              <span>TIER</span>
              <span className="text-[10px] lg:text-xs leading-none">15</span>
            </div>
          </div>

          {/* Store & Arenas Quick Buttons */}
          <div className="grid grid-cols-2 gap-1.5 shrink-0">
            <button 
              onClick={() => onOpenLayer('store')}
              className="py-1.5 lg:py-2 px-2 rounded bg-gradient-to-r from-amber-500/20 to-amber-600/30 border border-amber-500/60 hover:brightness-125 flex items-center justify-center space-x-1 transition-all"
            >
              <ShoppingBag className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-amber-400" />
              <span className="font-heading font-black text-[10px] lg:text-xs text-amber-300 uppercase">
                STORE
              </span>
            </button>
            <button 
              onClick={() => onOpenLayer('maps')}
              className="py-1.5 lg:py-2 px-2 rounded bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center space-x-1 transition-all text-zinc-300"
            >
              <MapPin className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-cyan-400" />
              <span className="font-heading font-bold text-[10px] lg:text-xs uppercase">
                ARENAS
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Ranked Match (1v1 Ladder) & Multiplayer (FFA 3+ / 1v1) */}
        <div className="w-44 sm:w-52 lg:w-60 max-h-full overflow-y-auto flex flex-col justify-center space-y-2 pointer-events-auto pl-0.5">
          {/* RANKED MATCH — 1v1 & Top-to-Bottom Player Ladder */}
          <div 
            onClick={() => onOpenLayer('ranked')}
            className="px-2.5 py-2 lg:p-3 rounded bg-zinc-950/85 border border-amber-500/40 hover:border-amber-400 cursor-pointer clip-tactical-sm transition-all group backdrop-blur-xs flex items-center justify-between shrink-0 shadow-md"
          >
            <div className="min-w-0">
              <span className="text-[8px] lg:text-[9px] font-mono-tactical text-amber-400 uppercase font-bold block leading-none">
                1V1 LADDER · TOP TO BOTTOM
              </span>
              <h4 className="font-heading font-black text-xs lg:text-base text-white uppercase group-hover:text-amber-400 leading-tight mt-0.5">
                RANKED MATCH
              </h4>
              <span className="text-[9px] lg:text-[10px] text-zinc-400 font-mono-tactical block truncate">
                2 Players · Climb Rank #1
              </span>
            </div>
            <div className="w-6 h-6 lg:w-7 lg:h-7 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center font-heading font-bold text-[10px] lg:text-xs text-amber-400 shrink-0">
              1v1
            </div>
          </div>

          {/* MULTIPLAYER — Free-For-All (3+ w/ 2m countdown) & 1v1 Match (2P max) */}
          <div 
            onClick={() => onOpenLayer('room_lobby')}
            className="px-2.5 py-2 lg:p-3 rounded bg-zinc-900/90 border-2 border-amber-400 cursor-pointer clip-tactical-sm transition-all shadow-lg shadow-amber-500/15 flex flex-col space-y-1.5 shrink-0"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[8px] lg:text-[9px] font-mono-tactical text-cyan-400 uppercase font-bold block leading-none">
                  {selectedMode === 'duel_1v1' ? '1V1 MATCH · 2P MAX' : 'FREE-FOR-ALL · 3+ PLAYERS'}
                </span>
                <h4 className="font-heading font-black text-xs lg:text-base text-white uppercase leading-tight mt-0.5">
                  MULTIPLAYER
                </h4>
              </div>
              <Crosshair className="w-4 h-4 lg:w-6 lg:h-6 text-amber-400 shrink-0 ml-1" />
            </div>

            <div className="text-[9px] lg:text-[10px] text-zinc-300 font-mono-tactical space-y-0.5 border-t border-zinc-800 pt-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">FREE-FOR-ALL</span>
                <span className="text-emerald-400 font-bold">3+ · 2m TIMER</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">1V1 MATCH</span>
                <span className="text-amber-300 font-bold">2 PLAYERS MAX</span>
              </div>
              <span className="text-[9px] text-zinc-400 block truncate pt-0.5">
                Map: {activeMap.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER CLUSTER (Comms Chat, MP Room, Loadout, Operators, START)    */}
      {/* ========================================================================= */}
      <div className="relative z-10 px-3 pb-2 pt-1 lg:px-5 lg:pb-3 flex items-center justify-between gap-2 shrink-0">
        {/* Bottom-Left: Comms Chat & (1/4) MP - ROOM Button */}
        <div className="flex items-center space-x-1.5 lg:space-x-2">
          {/* Chat Icon Button */}
          <button 
            onClick={() => onOpenLayer('room_lobby')}
            className="w-8 h-8 lg:w-10 lg:h-10 rounded bg-black/75 border border-zinc-700 hover:border-amber-400 flex items-center justify-center text-zinc-300 hover:text-white transition-colors backdrop-blur-xs shrink-0"
            title="World Comms Chat"
          >
            <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>

          {/* MP - ROOM Button */}
          <div 
            onClick={() => onOpenLayer('room_lobby')}
            className="flex items-center space-x-1.5 lg:space-x-2 px-2.5 py-1.5 lg:px-3 lg:py-2 bg-black/75 border border-zinc-700/80 rounded clip-tactical-sm cursor-pointer hover:border-amber-400 transition-all backdrop-blur-xs group shrink-0"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono-tactical text-[10px] lg:text-xs font-bold text-zinc-200 group-hover:text-white whitespace-nowrap">
              MP - LOBBY
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] lg:text-[10px] font-mono-tactical font-black">
              JOIN
            </span>
          </div>
        </div>

        {/* Bottom-Right: LOADOUT, OPERATORS, and GLOWING START / DEPLOY BUTTON */}
        <div className="flex items-center space-x-1.5 lg:space-x-3">
          {/* LOADOUT (Inventory Layer) */}
          <button 
            onClick={() => onOpenLayer('loadout')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 lg:px-4 lg:py-2.5 rounded bg-black/75 border border-zinc-700/80 hover:border-amber-400 text-zinc-200 hover:text-white transition-all clip-tactical-sm backdrop-blur-xs group"
          >
            <Backpack className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-heading font-black text-[10px] lg:text-xs uppercase tracking-wider">
              LOADOUT
            </span>
          </button>

          {/* OPERATORS (Characters Layer) */}
          <button 
            onClick={() => onOpenLayer('operators')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 lg:px-4 lg:py-2.5 rounded bg-black/75 border border-zinc-700/80 hover:border-amber-400 text-zinc-200 hover:text-white transition-all clip-tactical-sm backdrop-blur-xs group"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-heading font-black text-[10px] lg:text-xs uppercase tracking-wider">
              OPERATORS
            </span>
          </button>

          {/* MASSIVE GLOWING TACTICAL START BUTTON */}
          <button 
            onClick={onStartGame}
            className="relative px-4 py-1.5 lg:px-8 lg:py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-heading font-black uppercase text-xs lg:text-base tracking-widest clip-tactical-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(234,179,8,0.45)] flex items-center space-x-1.5 lg:space-x-2 group"
          >
            <Play className="w-3.5 h-3.5 lg:w-5 lg:h-5 fill-black stroke-black group-hover:scale-110 transition-transform" />
            <span>START</span>
          </button>
        </div>
      </div>
    </div>
  );
};
