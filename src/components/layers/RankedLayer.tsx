import React, { useEffect, useState } from 'react';
import { ArrowLeft, Crown, Swords, Trophy, Shield, Play, Sliders, Users } from 'lucide-react';
import { ArenaMap, OperatorData, RankedPlayerEntry } from '../../types/game';
import { soundEngine } from '../../audio/soundEngine';
import { multiplayerClient } from '../../services/multiplayerClient';

interface RankedLayerProps {
  playerOperator: OperatorData;
  activeMap: ArenaMap;
  onStartRanked1v1: (opponent: RankedPlayerEntry) => void;
  onPrepRanked1v1: (opponent: RankedPlayerEntry) => void;
  onBack: () => void;
}

export const RankedLayer: React.FC<RankedLayerProps> = ({
  playerOperator,
  activeMap,
  onStartRanked1v1,
  onPrepRanked1v1,
  onBack,
}) => {
  const [leaderboard, setLeaderboard] = useState<RankedPlayerEntry[]>([]);
  const [selectedRival, setSelectedRival] = useState<RankedPlayerEntry | null>(null);

  useEffect(() => {
    const unsub = multiplayerClient.subscribeLeaderboard(entries => {
      setLeaderboard(entries);
      setSelectedRival(prev => {
        if (prev) {
          return entries.find(e => e.id === prev.id) || prev;
        }
        const playerIdx = entries.findIndex(e => e.isPlayer);
        const rival = entries[Math.max(0, playerIdx - 1)] || entries.find(e => !e.isPlayer) || entries[0];
        return rival || null;
      });
    });

    multiplayerClient.fetchLeaderboard();
    return () => unsub();
  }, []);

  const playerEntry = leaderboard.find(e => e.isPlayer);
  const playerRankNum = leaderboard.findIndex(e => e.isPlayer) + 1;

  const getTierBadgeColor = (tier: string) => {
    if (tier === 'APEX LEGEND') return 'text-red-400 border-red-500/50 bg-red-500/15';
    if (tier === 'GRANDMASTER') return 'text-amber-300 border-amber-400/50 bg-amber-500/15';
    if (tier === 'MASTER') return 'text-purple-300 border-purple-400/50 bg-purple-500/15';
    if (tier === 'DIAMOND') return 'text-cyan-300 border-cyan-400/50 bg-cyan-500/15';
    if (tier === 'PLATINUM') return 'text-emerald-300 border-emerald-400/50 bg-emerald-500/15';
    return 'text-zinc-300 border-zinc-600 bg-zinc-800/70';
  };

  const activeRival =
    selectedRival && !selectedRival.isPlayer
      ? selectedRival
      : leaderboard.find(e => !e.isPlayer) || null;

  return (
    <div className="absolute inset-0 z-40 h-dvh bg-[#07090e] text-white flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="h-12 lg:h-14 px-3 lg:px-6 flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/90 z-10 shrink-0">
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
          <div className="min-w-0">
            <h1 className="text-sm lg:text-xl font-bold font-heading uppercase tracking-wider text-white flex items-center space-x-2">
              <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400 shrink-0" />
              <span className="text-amber-400 truncate">RANKED 1V1 LADDER</span>
            </h1>
          </div>
        </div>

        {playerEntry && (
          <div className="flex items-center space-x-2 text-[10px] lg:text-xs font-mono-tactical shrink-0">
            <span className="text-zinc-400 hidden sm:inline">YOUR RANK:</span>
            <span className="font-black text-white">#{playerRankNum}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-amber-400 font-bold">{playerEntry.rp} RP</span>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <span className="hidden sm:inline text-cyan-300 font-bold">{playerEntry.rankTier}</span>
          </div>
        )}
      </div>

      {/* Main Split Content: Left Top-to-Bottom Ladder, Right 1v1 Ranked Duel Matchup */}
      <div className="flex-1 min-h-0 flex flex-col min-[580px]:flex-row overflow-hidden max-w-6xl mx-auto w-full p-3 lg:p-5 gap-3 lg:gap-5">
        {/* TOP TO BOTTOM LEADERBOARD */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col border border-zinc-800 rounded bg-zinc-950/75 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between shrink-0">
            <span className="text-[10px] lg:text-xs font-mono-tactical font-bold text-amber-400 uppercase tracking-wider">
              TOP TO BOTTOM RANKINGS ({leaderboard.length} PLAYERS)
            </span>
            <span className="text-[10px] font-mono-tactical text-zinc-400">
              1V1 RANKED STANDINGS
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-800/70">
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              const isSelected = activeRival?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => {
                    if (!entry.isPlayer) {
                      soundEngine.playUIClick('select');
                      setSelectedRival(entry);
                    }
                  }}
                  className={`px-3 py-2 lg:py-2.5 flex items-center justify-between gap-2 transition-all ${
                    entry.isPlayer
                      ? 'bg-amber-500/15 border-y border-amber-400/40'
                      : isSelected
                      ? 'bg-cyan-500/10 cursor-pointer'
                      : 'hover:bg-zinc-900/70 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 lg:space-x-3 min-w-0">
                    <div
                      className={`w-7 h-7 lg:w-8 lg:h-8 rounded flex items-center justify-center font-heading font-black text-xs lg:text-sm shrink-0 border ${
                        rank === 1
                          ? 'bg-amber-400 text-black border-amber-200'
                          : rank === 2
                          ? 'bg-zinc-300 text-black border-white'
                          : rank === 3
                          ? 'bg-amber-700 text-white border-amber-500'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {rank === 1 ? <Crown className="w-4 h-4" /> : `#${rank}`}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-bold text-xs lg:text-sm text-white uppercase truncate">
                          {entry.isPlayer ? `${playerOperator.name} (YOU)` : entry.name}
                        </span>
                        {entry.isPlayer && (
                          <span className="text-[9px] font-mono-tactical font-black text-amber-400">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono-tactical text-zinc-400 flex items-center space-x-1.5">
                        <span>LV.{entry.level}</span>
                        <span>·</span>
                        <span className="uppercase">{entry.operatorId.replace('_', ' ')}</span>
                        <span>·</span>
                        <span>{entry.wins}W-{entry.losses}L</span>
                        <span className="hidden sm:inline">· K/D {entry.kd.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs lg:text-sm font-mono-tactical font-black text-amber-400">
                        {entry.rp} RP
                      </div>
                      <div className={`text-[9px] font-mono-tactical px-1.5 py-0.2 rounded border uppercase ${getTierBadgeColor(entry.rankTier)}`}>
                        {entry.rankTier}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1V1 RANKED DUEL PANEL (STRICTLY 2 PLAYERS) */}
        <div className="w-full min-[580px]:w-72 lg:w-96 flex flex-col justify-between border border-zinc-800 rounded bg-zinc-950/90 p-3 lg:p-4 space-y-3 shrink-0">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] lg:text-xs font-mono-tactical font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Swords className="w-3.5 h-3.5" />
                <span>1V1 RANKED DUEL</span>
              </span>
              <span className="text-[10px] font-mono-tactical text-cyan-300 font-bold flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>2 PLAYERS ONLY</span>
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 font-sans leading-snug">
              Ranked Match pits you in a strict 1v1 duel (only 2 players). Defeat higher-ranked opponents to gain +35 RP and climb from the bottom to #1.
            </p>

            {/* Matchup Card */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* YOU */}
              <div className="p-2.5 rounded border border-amber-500/40 bg-amber-500/10 space-y-1">
                <span className="text-[9px] font-mono-tactical text-amber-300 font-bold block">
                  PLAYER 1 (YOU)
                </span>
                <div className="font-heading font-black text-xs lg:text-sm text-white uppercase truncate">
                  {playerOperator.name}
                </div>
                <div className="text-[10px] font-mono-tactical text-zinc-300">
                  #{playerRankNum || '-'} · {playerEntry?.rp ?? 2450} RP
                </div>
              </div>

              {/* CHALLENGER */}
              <div className="p-2.5 rounded border border-red-500/40 bg-red-500/10 space-y-1">
                <span className="text-[9px] font-mono-tactical text-red-300 font-bold block">
                  PLAYER 2 (RIVAL)
                </span>
                <div className="font-heading font-black text-xs lg:text-sm text-white uppercase truncate">
                  {activeRival ? activeRival.name : 'SELECT RIVAL'}
                </div>
                <div className="text-[10px] font-mono-tactical text-zinc-300">
                  {activeRival ? `${activeRival.rp} RP · ${activeRival.rankTier}` : 'Tap ladder'}
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono-tactical flex items-center justify-between">
              <span className="text-zinc-400">ARENA ZONE</span>
              <span className="text-white font-bold uppercase">{activeMap.name}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {activeRival && (
              <>
                <button
                  onClick={() => {
                    soundEngine.playUIClick('deploy');
                    onStartRanked1v1(activeRival);
                  }}
                  className="w-full py-2.5 lg:py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-heading font-black uppercase tracking-widest text-xs lg:text-sm clip-tactical-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4 fill-black stroke-black" />
                  <span>START 1V1 RANKED MATCH</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playUIClick('select');
                    onPrepRanked1v1(activeRival);
                  }}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-400 text-zinc-200 font-heading font-bold uppercase tracking-wider text-xs clip-tactical-sm active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>INSPECT EQUIPPED GEAR FIRST</span>
                </button>
              </>
            )}
            <div className="flex items-center justify-center space-x-1 text-[10px] font-mono-tactical text-zinc-500">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>WIN +35 RP · LOSS -15 RP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
