import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Plus,
  Minus,
  MessageSquare,
  Send,
  ShieldCheck,
  Clock,
  Swords,
  Lock,
  MapPin,
} from 'lucide-react';
import {
  ArenaMap,
  GameMode,
  MultiplayerRoomState,
  OperatorData,
  WeaponData,
} from '../../types/game';
import { soundEngine } from '../../audio/soundEngine';
import { multiplayerClient } from '../../services/multiplayerClient';

interface RoomLobbyLayerProps {
  maps: ArenaMap[];
  playerOperator: OperatorData;
  equippedWeapon: WeaponData;
  activeMap: ArenaMap;
  selectedMode: GameMode;
  onSelectMap: (map: ArenaMap) => void;
  onSelectMode: (mode: GameMode) => void;
  onLaunchMatch: (room: MultiplayerRoomState) => void;
  onBack: () => void;
}

function formatCountdown(seconds: number | null): string {
  if (seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const RoomLobbyLayer: React.FC<RoomLobbyLayerProps> = ({
  maps,
  playerOperator,
  equippedWeapon,
  activeMap,
  selectedMode,
  onSelectMap,
  onSelectMode,
  onLaunchMatch,
  onBack,
}) => {
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    const unsubRoom = multiplayerClient.subscribeRoom(nextRoom => {
      setRoomState(nextRoom);
      if (nextRoom.mode !== selectedMode) {
        onSelectMode(nextRoom.mode);
      }
      const matchedMap = maps.find(m => m.id === nextRoom.mapId);
      if (matchedMap && matchedMap.id !== activeMap.id) {
        onSelectMap(matchedMap);
      }
    });

    const unsubErr = multiplayerClient.subscribeError(msg => {
      setErrorBanner(msg);
      setTimeout(() => setErrorBanner(null), 3500);
    });

    const unsubLaunch = multiplayerClient.subscribeLaunch(launchedRoom => {
      onLaunchMatch(launchedRoom);
    });

    multiplayerClient.joinRoom({
      roomCode: 'MP-7821',
      mode: selectedMode,
      mapId: activeMap.id,
      playerName: playerOperator.name,
      operatorId: playerOperator.id,
      operatorName: playerOperator.name,
      isRanked: false,
    });

    return () => {
      unsubRoom();
      unsubErr();
      unsubLaunch();
    };
  }, []);

  const currentMode: GameMode = roomState?.mode || selectedMode;
  const players = roomState?.players || [];
  const minPlayers = currentMode === 'ffa' ? 3 : 2;
  const maxPlayers = currentMode === 'ffa' ? 8 : 2;
  const countdownSeconds = roomState?.countdownSeconds ?? null;
  const canStart = players.length >= minPlayers;
  const slotsArray = Array.from({ length: maxPlayers }, (_, i) => i);

  const handleSwitchMode = (mode: GameMode) => {
    soundEngine.playUIClick('tab');
    onSelectMode(mode);
    multiplayerClient.setMode(mode);
  };

  const handleAddPlayer = () => {
    soundEngine.playUIClick('select');
    multiplayerClient.addChallenger();
  };

  const handleRemoveBot = () => {
    soundEngine.playUIClick('tab');
    multiplayerClient.removeChallenger();
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    soundEngine.playUIClick('tab');
    multiplayerClient.sendChat(playerOperator.name, chatInput.trim());
    setChatInput('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState?.roomCode || 'MP-7821');
    setCopiedCode(true);
    soundEngine.playUIClick('tab');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-40 h-dvh bg-[#080a0f] text-white flex flex-col overflow-hidden select-none">
      {/* Header with ONLY the 2 Multiplayer Modes */}
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
          <h1 className="text-sm lg:text-xl font-bold font-heading uppercase tracking-wider text-white flex items-center space-x-2 min-w-0">
            <span className="text-amber-400 whitespace-nowrap">MULTIPLAYER</span>
            <span className="hidden md:inline text-xs text-zinc-400 font-mono-tactical">
              ({players.length}/{maxPlayers})
            </span>
          </h1>
        </div>

        {/* Strictly 2 Multiplayer Mode Tabs: Free-For-All & 1v1 Match */}
        <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded border border-zinc-800 shrink-0">
          <button
            onClick={() => handleSwitchMode('ffa')}
            className={`px-2.5 py-1 text-[10px] lg:text-xs font-mono-tactical uppercase tracking-wider rounded transition-all whitespace-nowrap ${
              currentMode === 'ffa'
                ? 'bg-amber-500 text-black font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            FREE-FOR-ALL (3+)
          </button>
          <button
            onClick={() => handleSwitchMode('duel_1v1')}
            className={`px-2.5 py-1 text-[10px] lg:text-xs font-mono-tactical uppercase tracking-wider rounded transition-all whitespace-nowrap ${
              currentMode === 'duel_1v1'
                ? 'bg-amber-500 text-black font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            1V1 MATCH (2P MAX)
          </button>
        </div>

        <button
          onClick={handleCopyCode}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-[10px] lg:text-xs font-mono-tactical text-zinc-300 transition-all shrink-0"
        >
          <span>#{roomState?.roomCode || 'MP-7821'}</span>
          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
        </button>
      </div>

      {/* Mode Rule & Countdown Status Strip */}
      <div className="px-3 lg:px-6 py-2 bg-zinc-900/75 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {currentMode === 'ffa' ? (
          <>
            <div className="flex items-center space-x-2 text-[11px] lg:text-xs font-mono-tactical">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                FREE-FOR-ALL MISSION: <strong className="text-white">{players.length}/8 PLAYERS</strong>
              </span>
              <span className="text-zinc-500">·</span>
              {players.length < 3 ? (
                <span className="text-amber-300 font-bold">
                  NEED {3 - players.length} MORE TO START 2:00 JOIN COUNTDOWN
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">
                  3+ PLAYERS FOUND — EXTRA PLAYERS CAN JOIN BEFORE TIMER ENDS!
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {countdownSeconds !== null && (
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono-tactical text-xs font-black">
                  <Clock className="w-3.5 h-3.5" />
                  <span>LAUNCH IN {formatCountdown(countdownSeconds)}</span>
                </div>
              )}
              {players.some(p => p.isBot) && (
                <button
                  onClick={handleRemoveBot}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-mono-tactical text-zinc-300 flex items-center space-x-1"
                >
                  <Minus className="w-3 h-3" />
                  <span>REMOVE SLOT</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2 text-[11px] lg:text-xs font-mono-tactical">
              <Swords className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                1V1 MATCH: <strong className="text-white">{players.length}/2 PLAYERS</strong>
              </span>
              <span className="text-zinc-500">·</span>
              <span className={players.length === 2 ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                {players.length === 2
                  ? '2/2 PLAYERS LOCKED — READY TO DUEL'
                  : 'ONLY 2 PLAYERS CAN JOIN — ADD OR WAIT FOR 1 CHALLENGER'}
              </span>
            </div>
            {players.some(p => p.isBot) && (
              <button
                onClick={handleRemoveBot}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-mono-tactical text-zinc-300 flex items-center space-x-1"
              >
                <Minus className="w-3 h-3" />
                <span>REMOVE CHALLENGER</span>
              </button>
            )}
          </>
        )}
      </div>

      {errorBanner && (
        <div className="px-4 py-1.5 bg-red-600/90 text-white text-xs font-mono-tactical font-bold text-center shrink-0">
          {errorBanner}
        </div>
      )}

      {/* Main Squad Slots & Live Chat */}
      <div className="flex-1 min-h-0 flex flex-col min-[540px]:flex-row overflow-y-auto min-[540px]:overflow-hidden relative p-3 lg:p-5 gap-3 lg:gap-5 max-w-6xl mx-auto w-full">
        {/* Player Slots + Map Selector + Launch Button */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5 min-h-0">
          {/* Quick Map Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 shrink-0">
            <span className="text-[10px] font-mono-tactical text-zinc-400 flex items-center space-x-1 shrink-0 mr-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>ARENA:</span>
            </span>
            {maps.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  soundEngine.playUIClick('tab');
                  onSelectMap(m);
                  multiplayerClient.setMap(m.id);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono-tactical uppercase border transition-all whitespace-nowrap shrink-0 ${
                  activeMap.id === m.id
                    ? 'bg-amber-500 text-black border-amber-300 font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Slots Grid */}
          <div
            className={`grid gap-2 lg:gap-3 flex-1 min-h-0 overflow-y-auto ${
              currentMode === 'duel_1v1' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {slotsArray.map(idx => {
              const member = players[idx];
              if (member) {
                return (
                  <div
                    key={member.id}
                    className="p-2.5 lg:p-3 rounded border border-amber-500/40 bg-zinc-900/80 clip-tactical-sm flex flex-col justify-between min-h-[82px] shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 rounded bg-zinc-800 border border-amber-500/50 flex items-center justify-center font-heading font-black text-amber-400 text-[10px] lg:text-xs">
                        0{idx + 1}
                      </div>
                      <span className="text-[9px] font-mono-tactical font-bold text-emerald-400">
                        {member.isBot ? 'BOT READY' : 'LIVE PLAYER'}
                      </span>
                    </div>

                    <div className="mt-1">
                      <h4 className="font-heading font-black text-xs lg:text-sm text-white uppercase truncate">
                        {member.name}
                      </h4>
                      <p className="text-[10px] text-amber-400 font-mono-tactical truncate">
                        {member.operatorName} · LV.{member.level}
                      </p>
                      <span className="hidden lg:block text-[10px] text-zinc-500 truncate">
                        {idx === 0 ? equippedWeapon.name : `${member.rp} RP`}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={`empty_${idx}`}
                  onClick={handleAddPlayer}
                  className="p-2.5 lg:p-3 rounded border border-dashed border-zinc-800 bg-zinc-950/40 clip-tactical-sm flex flex-col items-center justify-center min-h-[82px] cursor-pointer hover:border-amber-500/50 hover:bg-zinc-900/30 transition-all text-center group"
                >
                  <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center group-hover:border-amber-400 transition-colors">
                    <Plus className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
                  </div>
                  <span className="text-[9px] lg:text-[10px] font-mono-tactical text-zinc-400 uppercase mt-1 group-hover:text-white">
                    + ADD PLAYER
                  </span>
                </button>
              );
            })}
          </div>

          {/* Launch Button with Strict Min-Player Enforcement */}
          <div className="pt-1 shrink-0">
            <button
              disabled={!canStart}
              onClick={() => {
                if (!canStart) return;
                soundEngine.playUIClick('deploy');
                multiplayerClient.startRoomMatch();
              }}
              className={`w-full py-2.5 lg:py-3.5 font-black uppercase tracking-widest text-xs lg:text-base clip-tactical-sm transition-all flex items-center justify-center space-x-2 ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 active:scale-95 shadow-xl shadow-amber-500/25'
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {canStart ? (
                <>
                  <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 stroke-[2.5]" />
                  <span>
                    {currentMode === 'ffa'
                      ? `DEPLOY FREE-FOR-ALL NOW (${players.length} PLAYERS${
                          countdownSeconds !== null ? ` · ${formatCountdown(countdownSeconds)}` : ''
                        })`
                      : 'DEPLOY 1V1 MATCH (2/2 PLAYERS)'}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {currentMode === 'ffa'
                      ? `NEED ${3 - players.length} MORE PLAYER${3 - players.length > 1 ? 'S' : ''} (MIN 3 FOR FREE-FOR-ALL)`
                      : 'NEED 2 PLAYERS TO START 1V1 MATCH'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live WebSocket Multi-User Chat */}
        <div className="w-full min-[540px]:w-60 lg:w-80 flex flex-col border border-zinc-800 bg-zinc-950/60 rounded clip-tactical-sm min-h-0 flex-shrink-0 p-2.5 lg:p-3">
          <div className="flex items-center space-x-2 text-[10px] lg:text-xs font-mono-tactical text-zinc-400 pb-1.5 border-b border-zinc-800 shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>LIVE LOBBY CHAT</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 py-2 text-[11px] lg:text-xs font-mono-tactical text-zinc-300">
            {(roomState?.chatMessages || []).map(msg => (
              <div key={msg.id} className="bg-zinc-900/60 p-1.5 lg:p-2 rounded border border-zinc-800/80 leading-snug">
                <span className={msg.sender === 'SYSTEM' ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
                  {msg.sender}:{' '}
                </span>
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 pt-1.5 border-t border-zinc-800 shrink-0">
            <input
              type="text"
              placeholder="Send room message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400"
            />
            <button
              onClick={handleSendMessage}
              className="p-1.5 rounded bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shrink-0"
            >
              <Send className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
