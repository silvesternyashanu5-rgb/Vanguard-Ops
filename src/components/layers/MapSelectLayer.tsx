import React, { useState } from 'react';
import { ArrowLeft, Check, MapPin, ChevronRight } from 'lucide-react';
import { ArenaMap, GameMode } from '../../types/game';
import { soundEngine } from '../../audio/soundEngine';

interface MapSelectLayerProps {
  maps: ArenaMap[];
  selectedMap: ArenaMap;
  selectedMode: GameMode;
  onSelectMap: (map: ArenaMap) => void;
  onSelectMode: (mode: GameMode) => void;
  onConfirmSelection: (map: ArenaMap, mode: GameMode) => void;
  onBack: () => void;
}

export const MapSelectLayer: React.FC<MapSelectLayerProps> = ({
  maps,
  selectedMap,
  selectedMode,
  onSelectMap,
  onSelectMode,
  onConfirmSelection,
  onBack,
}) => {
  const [currentMap, setCurrentMap] = useState<ArenaMap>(selectedMap);
  const [currentMode, setCurrentMode] = useState<GameMode>(selectedMode);

  const handleChooseMap = (m: ArenaMap) => {
    setCurrentMap(m);
    onSelectMap(m);
    soundEngine.playUIClick('select');
  };

  const handleChooseMode = (mode: GameMode) => {
    setCurrentMode(mode);
    onSelectMode(mode);
    soundEngine.playUIClick('tab');
  };

  const handleConfirm = () => {
    soundEngine.playUIClick('deploy');
    onConfirmSelection(currentMap, currentMode);
  };

  return (
    <div className="absolute inset-0 z-40 h-dvh bg-[#080a0f] text-white flex flex-col overflow-hidden select-none">
      {/* Compact Single-Row Header for Landscape Phone */}
      <div className="h-12 lg:h-14 px-3 lg:px-6 flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/80 z-10 backdrop-blur-sm shrink-0">
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
          <h1 className="text-sm lg:text-xl font-bold font-heading uppercase tracking-wider text-white flex items-center space-x-2 truncate">
            <span className="text-amber-400 whitespace-nowrap">ARENA SELECTION</span>
            <span className="hidden xl:inline-block text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono-tactical border border-amber-500/30 whitespace-nowrap">
              TACTICAL DEPLOYMENT ZONES
            </span>
          </h1>
        </div>

        {/* Strictly 2 Multiplayer Modes */}
        <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded border border-zinc-800 overflow-x-auto shrink-0 max-w-[55%]">
          {[
            { id: 'ffa', label: 'FREE-FOR-ALL (3+)' },
            { id: 'duel_1v1', label: '1V1 MATCH (2P)' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => handleChooseMode(m.id as GameMode)}
              className={`px-2.5 py-1 text-[10px] lg:text-xs font-mono-tactical uppercase tracking-wider rounded transition-all whitespace-nowrap shrink-0 ${
                currentMode === m.id ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scrollable Arena Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 lg:p-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-5">
          {maps.map(mapItem => {
            const isSelected = currentMap.id === mapItem.id;

            const bannerGradient =
              mapItem.theme === 'cyber_neon'
                ? 'radial-gradient(circle at 50% 20%, #06b6d4 0%, #090d16 85%)'
                : mapItem.theme === 'dust_district'
                ? 'radial-gradient(circle at 50% 20%, #ea580c 0%, #382b1d 85%)'
                : mapItem.theme === 'city_z'
                ? 'radial-gradient(circle at 50% 20%, #dc2626 0%, #1a0b06 85%)'
                : mapItem.theme === 'tournament_arena'
                ? 'radial-gradient(circle at 50% 20%, #38bdf8 0%, #0c4a6e 85%)'
                : mapItem.theme === 'planet_namek'
                ? 'radial-gradient(circle at 50% 20%, #10b981 0%, #064e3b 85%)'
                : 'radial-gradient(circle at 50% 20%, #2563eb 0%, #05070a 85%)';

            return (
              <div
                key={mapItem.id}
                onClick={() => handleChooseMap(mapItem)}
                className={`relative rounded-lg overflow-hidden border cursor-pointer transition-all clip-tactical-sm flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-zinc-900 shadow-xl shadow-amber-500/15 ring-1 ring-amber-400/60'
                    : 'border-zinc-800 bg-zinc-950/75 hover:border-zinc-700 hover:bg-zinc-900/80'
                }`}
              >
                {/* Visual Banner Preview */}
                <div
                  className="h-24 lg:h-36 w-full relative flex items-end p-2.5 lg:p-4 bg-gradient-to-t from-black via-black/40 to-transparent"
                  style={{
                    backgroundColor: mapItem.groundColor,
                    backgroundImage: bannerGradient,
                  }}
                >
                  <div className="absolute top-2 left-2.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-zinc-700 text-[9px] lg:text-[10px] font-mono-tactical text-amber-400 font-bold">
                    {mapItem.codename}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2.5 flex items-center space-x-1 px-1.5 py-0.5 bg-amber-500 text-black text-[9px] lg:text-[10px] font-mono-tactical font-black rounded">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>SELECTED</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-heading font-black text-sm lg:text-lg tracking-wider text-white uppercase drop-shadow-md truncate">
                      {mapItem.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-[10px] lg:text-xs text-zinc-300 font-mono-tactical truncate">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{mapItem.location}</span>
                    </div>
                  </div>
                </div>

                {/* Description & Intel */}
                <div className="p-2.5 lg:p-4 space-y-2 lg:space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-[11px] lg:text-xs text-zinc-300 leading-snug font-sans line-clamp-2">
                    {mapItem.description}
                  </p>

                  <div className="space-y-1 pt-1.5 border-t border-zinc-800/80 text-[10px] lg:text-xs font-mono-tactical">
                    <div className="flex justify-between text-zinc-400">
                      <span>ARENA SCALE</span>
                      <span className="text-white font-bold">{mapItem.mapSize.x}m × {mapItem.mapSize.z}m</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>CAPACITY / NODES</span>
                      <span className="text-amber-400 font-bold">{mapItem.maxPlayers} OPS · {mapItem.powerUpSpawns.length} POWER-UPS</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pinned Bottom Confirmation Bar (Always Visible in Landscape!) */}
      <div className="px-3 py-2 lg:px-6 lg:py-3 bg-zinc-950/95 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md">
        <div className="min-w-0">
          <span className="text-[9px] lg:text-[10px] font-mono-tactical text-zinc-500 uppercase block leading-none">
            ACTIVE TARGET ZONE
          </span>
          <div className="font-heading font-bold text-sm lg:text-lg text-white uppercase flex items-center space-x-2 truncate mt-0.5">
            <span className="text-amber-400 truncate">{currentMap.name}</span>
            <span className="text-[10px] lg:text-xs text-zinc-400 font-mono-tactical shrink-0">
              [{currentMode === 'duel_1v1' ? '1V1 MATCH · 2 PLAYERS' : 'FREE-FOR-ALL · 3+ PLAYERS'}]
            </span>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="px-5 py-2 lg:px-8 lg:py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-heading font-black uppercase tracking-widest text-xs lg:text-sm clip-tactical-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 shrink-0"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>CONFIRM SELECTION</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
