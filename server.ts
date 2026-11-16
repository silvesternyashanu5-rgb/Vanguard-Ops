import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

type GameMode = 'ffa' | 'duel_1v1';

interface RankedPlayerEntry {
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

interface RoomParticipant {
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

interface MultiplayerRoomState {
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function computeRankTier(rp: number): string {
  if (rp >= 4200) return 'APEX LEGEND';
  if (rp >= 3500) return 'GRANDMASTER';
  if (rp >= 2900) return 'MASTER';
  if (rp >= 2300) return 'DIAMOND';
  if (rp >= 1800) return 'PLATINUM';
  if (rp >= 1300) return 'GOLD';
  if (rp >= 800) return 'SILVER';
  return 'BRONZE';
}

const rankedLeaderboard: RankedPlayerEntry[] = [
  { id: 'rk_01', name: 'KAL_EL_PRIME', operatorId: 'superman', level: 120, rankTier: 'APEX LEGEND', rp: 4820, wins: 142, losses: 11, kd: 4.85, status: 'online' },
  { id: 'rk_02', name: 'KAKAROT_ULTRA', operatorId: 'son_goku', level: 118, rankTier: 'APEX LEGEND', rp: 4590, wins: 129, losses: 14, kd: 4.41, status: 'in_duel' },
  { id: 'rk_03', name: 'BALD_CAPE_Z', operatorId: 'saitama', level: 115, rankTier: 'APEX LEGEND', rp: 4310, wins: 118, losses: 16, kd: 4.12, status: 'online' },
  { id: 'rk_04', name: 'NOVA_SPECTRE', operatorId: 'spectre_neon', level: 109, rankTier: 'GRANDMASTER', rp: 3980, wins: 96, losses: 21, kd: 3.45, status: 'online' },
  { id: 'rk_05', name: 'SOLAR_KNIGHT', operatorId: 'superman', level: 104, rankTier: 'GRANDMASTER', rp: 3740, wins: 88, losses: 24, kd: 3.18, status: 'online' },
  { id: 'rk_06', name: 'VEGETA_PRIDE', operatorId: 'son_goku', level: 101, rankTier: 'GRANDMASTER', rp: 3560, wins: 82, losses: 25, kd: 2.94, status: 'in_duel' },
  { id: 'rk_07', name: 'GHOST_RECON_07', operatorId: 'vanguard_recon', level: 97, rankTier: 'MASTER', rp: 3290, wins: 74, losses: 29, kd: 2.65, status: 'online' },
  { id: 'rk_08', name: 'APEX_IRON', operatorId: 'reaper_apex', level: 92, rankTier: 'MASTER', rp: 3040, wins: 65, losses: 31, kd: 2.38, status: 'offline' },
  { id: 'rk_09', name: 'CIPHER_BLADE', operatorId: 'spectre_neon', level: 88, rankTier: 'DIAMOND', rp: 2680, wins: 56, losses: 33, kd: 2.09, status: 'online' },
  { id: 'rk_10', name: 'PLAYER_YOU', operatorId: 'saitama', level: 84, rankTier: 'DIAMOND', rp: 2450, wins: 49, losses: 28, kd: 2.15, isPlayer: true, status: 'online' },
  { id: 'rk_11', name: 'VIPER_K9', operatorId: 'vanguard_recon', level: 79, rankTier: 'PLATINUM', rp: 2140, wins: 44, losses: 34, kd: 1.76, status: 'online' },
  { id: 'rk_12', name: 'NIGHT_STALKER', operatorId: 'reaper_apex', level: 74, rankTier: 'PLATINUM', rp: 1890, wins: 39, losses: 36, kd: 1.54, status: 'online' },
  { id: 'rk_13', name: 'COBRA_09', operatorId: 'spectre_neon', level: 68, rankTier: 'GOLD', rp: 1580, wins: 31, losses: 35, kd: 1.28, status: 'offline' },
  { id: 'rk_14', name: 'SMALLVILLE_77', operatorId: 'superman', level: 61, rankTier: 'GOLD', rp: 1360, wins: 25, losses: 32, kd: 1.12, status: 'online' },
  { id: 'rk_15', name: 'ROOKIE_Z', operatorId: 'vanguard_recon', level: 45, rankTier: 'SILVER', rp: 980, wins: 16, losses: 29, kd: 0.89, status: 'online' },
  { id: 'rk_16', name: 'CADET_ZERO', operatorId: 'reaper_apex', level: 28, rankTier: 'BRONZE', rp: 540, wins: 7, losses: 24, kd: 0.64, status: 'offline' },
];

function getSortedLeaderboard(): RankedPlayerEntry[] {
  return [...rankedLeaderboard].sort((a, b) => b.rp - a.rp);
}

const rooms = new Map<string, MultiplayerRoomState>();
const roomClients = new Map<string, Set<WebSocket>>();
const clientInfo = new Map<WebSocket, { clientId: string; roomCode: string | null }>();

const BOT_POOL = [
  { name: 'Ignis_Witch', operatorId: 'witch_fire', operatorName: 'Fire & Water Witch', level: 97, rp: 3290 },
  { name: 'Aqua_Sorceress', operatorId: 'witch_water', operatorName: 'Fire & Water Witch', level: 88, rp: 2680 },
  { name: 'Pyro_Hex', operatorId: 'witch_fire', operatorName: 'Fire & Water Witch', level: 112, rp: 4120 },
  { name: 'Tide_Siren', operatorId: 'witch_water', operatorName: 'Fire & Water Witch', level: 105, rp: 3890 },
  { name: 'Ember_Coven', operatorId: 'witch_fire', operatorName: 'Fire & Water Witch', level: 92, rp: 3040 },
  { name: 'Frost_Witch', operatorId: 'witch_water', operatorName: 'Fire & Water Witch', level: 84, rp: 2450 },
  { name: 'Cinder_Mage', operatorId: 'witch_fire', operatorName: 'Fire & Water Witch', level: 79, rp: 2140 },
];

function getOrCreateRoom(roomCode: string, mode: GameMode = 'ffa', mapId = 'city_z', isRanked = false): MultiplayerRoomState {
  const existing = rooms.get(roomCode);
  if (existing) return existing;

  const minPlayers = mode === 'ffa' ? 3 : 2;
  const maxPlayers = mode === 'ffa' ? 8 : 2;
  const fresh: MultiplayerRoomState = {
    roomCode,
    mode,
    isRanked,
    mapId,
    players: [],
    minPlayers,
    maxPlayers,
    countdownSeconds: null,
    status: 'waiting',
    chatMessages: [
      {
        id: `sys_${Date.now()}`,
        sender: 'SYSTEM',
        text:
          mode === 'ffa'
            ? `Free-For-All lobby #${roomCode} open. Minimum 3 players required to begin the 2:00 launch countdown.`
            : `1v1 Match lobby #${roomCode} open. Strictly 2 players maximum.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };
  rooms.set(roomCode, fresh);
  return fresh;
}

function broadcastRoom(roomCode: string, payload: unknown) {
  const subs = roomClients.get(roomCode);
  if (!subs) return;
  const encoded = JSON.stringify(payload);
  for (const ws of subs) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(encoded);
    }
  }
}

function broadcastAll(payload: unknown) {
  const encoded = JSON.stringify(payload);
  for (const ws of clientInfo.keys()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(encoded);
    }
  }
}

function enforceRoomRules(room: MultiplayerRoomState) {
  room.minPlayers = room.mode === 'ffa' ? 3 : 2;
  room.maxPlayers = room.mode === 'ffa' ? 8 : 2;

  if (room.mode === 'duel_1v1' && room.players.length > 2) {
    room.players = room.players.slice(0, 2);
  }

  if (room.mode === 'ffa') {
    if (room.players.length >= 3) {
      if (room.countdownSeconds === null && room.status !== 'launching' && room.status !== 'in_match') {
        room.countdownSeconds = 120; // 2 minutes countdown starts once 3+ players found
        room.status = 'countdown';
        room.chatMessages.push({
          id: `cd_${Date.now()}`,
          sender: 'SYSTEM',
          text: '3+ players found! 2:00 countdown started — extra challengers can still join before launch.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } else {
      room.countdownSeconds = null;
      if (room.status === 'countdown') {
        room.status = 'waiting';
      }
    }
  } else {
    // 1v1 mode: no 2-minute countdown; strictly 2 players
    room.countdownSeconds = null;
    room.status = room.players.length === 2 ? 'countdown' : 'waiting';
  }
}

// Authoritative 1-second server tick for active Free-For-All 2-minute join countdowns
setInterval(() => {
  for (const [roomCode, room] of rooms.entries()) {
    if (room.mode === 'ffa' && room.status === 'countdown' && room.countdownSeconds !== null) {
      if (room.players.length < 3) {
        room.countdownSeconds = null;
        room.status = 'waiting';
        broadcastRoom(roomCode, { type: 'room:state', room });
        continue;
      }

      room.countdownSeconds = Math.max(0, room.countdownSeconds - 1);
      if (room.countdownSeconds === 0) {
        room.status = 'launching';
        broadcastRoom(roomCode, { type: 'room:state', room });
        broadcastRoom(roomCode, { type: 'room:launch', room });
      } else {
        broadcastRoom(roomCode, { type: 'room:state', room });
      }
    }
  }
}, 1000);

async function startServer() {
  const app = express();
  app.use(express.json());

  // REST API: Top-to-Bottom Ranked Leaderboard
  app.get('/api/ranked', (_req, res) => {
    res.json({ leaderboard: getSortedLeaderboard() });
  });

  app.post('/api/ranked/result', (req, res) => {
    const { won, kills, deaths, operatorId } = req.body as {
      won?: boolean;
      kills?: number;
      deaths?: number;
      operatorId?: string;
    };

    const playerEntry = rankedLeaderboard.find(e => e.isPlayer);
    if (playerEntry) {
      const rpDelta = won ? 35 : -15;
      playerEntry.rp = Math.max(100, playerEntry.rp + rpDelta);
      playerEntry.rankTier = computeRankTier(playerEntry.rp);
      if (won) playerEntry.wins += 1;
      else playerEntry.losses += 1;
      if (operatorId) playerEntry.operatorId = operatorId;
      const prevGames = Math.max(1, playerEntry.wins + playerEntry.losses);
      const matchKd = (kills ?? 0) / Math.max(1, deaths ?? 1);
      playerEntry.kd = Number((((playerEntry.kd * (prevGames - 1)) + matchKd) / prevGames).toFixed(2));
    }

    const sorted = getSortedLeaderboard();
    broadcastAll({ type: 'leaderboard:update', leaderboard: sorted });
    res.json({ leaderboard: sorted });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', ws => {
    const clientId = `user_${Math.random().toString(36).slice(2, 8)}`;
    clientInfo.set(ws, { clientId, roomCode: null });

    ws.send(JSON.stringify({ type: 'welcome', clientId, leaderboard: getSortedLeaderboard() }));

    ws.on('message', raw => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const info = clientInfo.get(ws);
      if (!info) return;

      if (msg.type === 'ranked:get') {
        ws.send(JSON.stringify({ type: 'leaderboard:update', leaderboard: getSortedLeaderboard() }));
        return;
      }

      if (msg.type === 'room:join') {
        const roomCode = String(msg.roomCode || 'MP-7821');
        const requestedMode = (msg.mode === 'duel_1v1' ? 'duel_1v1' : 'ffa') as GameMode;
        const mapId = String(msg.mapId || 'city_z');
        const isRanked = Boolean(msg.isRanked);

        if (info.roomCode && info.roomCode !== roomCode) {
          const prevSubs = roomClients.get(info.roomCode);
          prevSubs?.delete(ws);
          const prevRoom = rooms.get(info.roomCode);
          if (prevRoom) {
            prevRoom.players = prevRoom.players.filter(p => p.id !== info.clientId);
            enforceRoomRules(prevRoom);
            broadcastRoom(info.roomCode, { type: 'room:state', room: prevRoom });
          }
        }

        const room = getOrCreateRoom(roomCode, requestedMode, mapId, isRanked);

        if (!roomClients.has(roomCode)) {
          roomClients.set(roomCode, new Set());
        }
        roomClients.get(roomCode)!.add(ws);
        info.roomCode = roomCode;

        const alreadyIn = room.players.some(p => p.id === info.clientId);
        if (!alreadyIn) {
          if (room.players.length >= room.maxPlayers) {
            ws.send(
              JSON.stringify({
                type: 'room:error',
                message:
                  room.mode === 'duel_1v1'
                    ? '1v1 Match room is full — only 2 players can join.'
                    : `Free-For-All room is full (${room.maxPlayers} players max).`,
              })
            );
            ws.send(JSON.stringify({ type: 'room:state', room }));
            return;
          }

          const playerRank = rankedLeaderboard.find(e => e.isPlayer);
          room.players.push({
            id: info.clientId,
            name: String(msg.playerName || 'YOU'),
            operatorId: String(msg.operatorId || 'saitama'),
            operatorName: String(msg.operatorName || 'Saitama'),
            level: playerRank?.level || 84,
            rp: playerRank?.rp || 2450,
            isBot: false,
            isReady: true,
            isHost: room.players.filter(p => !p.isBot).length === 0,
          });
        } else {
          room.players = room.players.map(p =>
            p.id === info.clientId
              ? {
                  ...p,
                  operatorId: String(msg.operatorId || p.operatorId),
                  operatorName: String(msg.operatorName || p.operatorName),
                }
              : p
          );
        }

        enforceRoomRules(room);
        broadcastRoom(roomCode, { type: 'room:state', room });
        return;
      }

      if (!info.roomCode) return;
      const room = rooms.get(info.roomCode);
      if (!room) return;

      if (msg.type === 'room:set_mode') {
        const nextMode = (msg.mode === 'duel_1v1' ? 'duel_1v1' : 'ffa') as GameMode;
        room.mode = nextMode;
        room.countdownSeconds = null;
        room.status = 'waiting';
        if (nextMode === 'duel_1v1' && room.players.length > 2) {
          // Keep host human + 1 challenger max
          const humans = room.players.filter(p => !p.isBot);
          const others = room.players.filter(p => p.isBot);
          room.players = [...humans, ...others].slice(0, 2);
        }
        room.chatMessages.push({
          id: `mode_${Date.now()}`,
          sender: 'SYSTEM',
          text:
            nextMode === 'ffa'
              ? 'Switched to FREE-FOR-ALL (Min 3 players · 2:00 join countdown on 3rd player).'
              : 'Switched to 1v1 MATCH (Strictly 2 players maximum).',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        enforceRoomRules(room);
        broadcastRoom(room.roomCode, { type: 'room:state', room });
        return;
      }

      if (msg.type === 'room:set_map') {
        room.mapId = String(msg.mapId || room.mapId);
        broadcastRoom(room.roomCode, { type: 'room:state', room });
        return;
      }

      if (msg.type === 'room:add_bot') {
        if (room.players.length >= room.maxPlayers) {
          ws.send(
            JSON.stringify({
              type: 'room:error',
              message:
                room.mode === 'duel_1v1'
                  ? '1v1 Match allows strictly 2 players only!'
                  : `Lobby reached maximum capacity (${room.maxPlayers} players).`,
            })
          );
          return;
        }
        const usedNames = new Set(room.players.map(p => p.name));
        const candidate =
          BOT_POOL.find(b => !usedNames.has(b.name)) ||
          {
            name: `Challenger_${room.players.length + 1}`,
            operatorId: 'vanguard_recon',
            operatorName: 'Vanguard',
            level: 80,
            rp: 2050,
          };

        room.players.push({
          id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          name: candidate.name,
          operatorId: candidate.operatorId,
          operatorName: candidate.operatorName,
          level: candidate.level,
          rp: candidate.rp,
          isBot: true,
          isReady: true,
          isHost: false,
        });
        room.chatMessages.push({
          id: `join_${Date.now()}`,
          sender: 'SYSTEM',
          text: `${candidate.name} (${candidate.operatorName}) joined the lobby.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        enforceRoomRules(room);
        broadcastRoom(room.roomCode, { type: 'room:state', room });
        return;
      }

      if (msg.type === 'room:remove_bot') {
        const lastBotIdx = [...room.players].reverse().findIndex(p => p.isBot);
        if (lastBotIdx !== -1) {
          const actualIdx = room.players.length - 1 - lastBotIdx;
          const [removed] = room.players.splice(actualIdx, 1);
          room.chatMessages.push({
            id: `leave_${Date.now()}`,
            sender: 'SYSTEM',
            text: `${removed.name} left the lobby.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          enforceRoomRules(room);
          broadcastRoom(room.roomCode, { type: 'room:state', room });
        }
        return;
      }

      if (msg.type === 'room:chat') {
        const text = String(msg.text || '').trim().slice(0, 180);
        if (!text) return;
        const sender = String(msg.sender || 'Operator');
        room.chatMessages.push({
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          sender,
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        if (room.chatMessages.length > 40) {
          room.chatMessages = room.chatMessages.slice(-40);
        }
        broadcastRoom(room.roomCode, { type: 'room:state', room });
        return;
      }

      if (msg.type === 'room:start') {
        if (room.players.length < room.minPlayers) {
          ws.send(
            JSON.stringify({
              type: 'room:error',
              message:
                room.mode === 'ffa'
                  ? 'Free-For-All requires at least 3 players before starting!'
                  : '1v1 Match requires 2 players!',
            })
          );
          return;
        }
        room.status = 'launching';
        broadcastRoom(room.roomCode, { type: 'room:state', room });
        broadcastRoom(room.roomCode, { type: 'room:launch', room });
      }
    });

    ws.on('close', () => {
      const info = clientInfo.get(ws);
      clientInfo.delete(ws);
      if (info?.roomCode) {
        const subs = roomClients.get(info.roomCode);
        subs?.delete(ws);
        const room = rooms.get(info.roomCode);
        if (room) {
          room.players = room.players.filter(p => p.id !== info.clientId);
          enforceRoomRules(room);
          broadcastRoom(info.roomCode, { type: 'room:state', room });
        }
      }
    });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Arena Server & WebSocket Hub listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
