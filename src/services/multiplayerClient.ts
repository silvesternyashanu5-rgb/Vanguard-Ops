import { GameMode, MultiplayerRoomState, RankedPlayerEntry } from '../types/game';

type RoomListener = (room: MultiplayerRoomState) => void;
type LeaderboardListener = (leaderboard: RankedPlayerEntry[]) => void;
type ErrorListener = (message: string) => void;
type LaunchListener = (room: MultiplayerRoomState) => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private clientId: string | null = null;
  private pendingQueue: string[] = [];

  private roomListeners = new Set<RoomListener>();
  private leaderboardListeners = new Set<LeaderboardListener>();
  private errorListeners = new Set<ErrorListener>();
  private launchListeners = new Set<LaunchListener>();

  private latestLeaderboard: RankedPlayerEntry[] = [];
  private latestRoom: MultiplayerRoomState | null = null;

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        while (this.pendingQueue.length > 0) {
          const payload = this.pendingQueue.shift();
          if (payload) ws.send(payload);
        }
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(String(event.data));
          if (data.type === 'welcome') {
            this.clientId = data.clientId || null;
            if (Array.isArray(data.leaderboard)) {
              this.latestLeaderboard = data.leaderboard;
              this.leaderboardListeners.forEach(cb => cb(data.leaderboard));
            }
          } else if (data.type === 'leaderboard:update' && Array.isArray(data.leaderboard)) {
            this.latestLeaderboard = data.leaderboard;
            this.leaderboardListeners.forEach(cb => cb(data.leaderboard));
          } else if (data.type === 'room:state' && data.room) {
            this.latestRoom = data.room;
            this.roomListeners.forEach(cb => cb(data.room));
          } else if (data.type === 'room:error' && data.message) {
            this.errorListeners.forEach(cb => cb(String(data.message)));
          } else if (data.type === 'room:launch' && data.room) {
            this.latestRoom = data.room;
            this.launchListeners.forEach(cb => cb(data.room));
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onclose = () => {
        this.ws = null;
        if (this.reconnectTimer === null) {
          this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 2000);
        }
      };
    } catch {
      // Safe fallback
    }
  }

  private send(payload: Record<string, unknown>) {
    this.connect();
    const encoded = JSON.stringify(payload);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(encoded);
    } else {
      this.pendingQueue.push(encoded);
    }
  }

  public getClientId(): string | null {
    return this.clientId;
  }

  public async fetchLeaderboard(): Promise<RankedPlayerEntry[]> {
    try {
      const res = await fetch('/api/ranked');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.leaderboard)) {
          this.latestLeaderboard = json.leaderboard;
          this.leaderboardListeners.forEach(cb => cb(json.leaderboard));
          return json.leaderboard;
        }
      }
    } catch {
      // Ignore network fallback error
    }
    this.send({ type: 'ranked:get' });
    return this.latestLeaderboard;
  }

  public async reportRankedResult(won: boolean, kills: number, deaths: number, operatorId: string): Promise<void> {
    try {
      const res = await fetch('/api/ranked/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ won, kills, deaths, operatorId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.leaderboard)) {
          this.latestLeaderboard = json.leaderboard;
          this.leaderboardListeners.forEach(cb => cb(json.leaderboard));
        }
      }
    } catch {
      // Ignore error
    }
  }

  public joinRoom(params: {
    roomCode: string;
    mode: GameMode;
    mapId: string;
    playerName: string;
    operatorId: string;
    operatorName: string;
    isRanked?: boolean;
  }) {
    this.send({ type: 'room:join', ...params });
  }

  public setMode(mode: GameMode) {
    this.send({ type: 'room:set_mode', mode });
  }

  public setMap(mapId: string) {
    this.send({ type: 'room:set_map', mapId });
  }

  public addChallenger() {
    this.send({ type: 'room:add_bot' });
  }

  public removeChallenger() {
    this.send({ type: 'room:remove_bot' });
  }

  public sendChat(sender: string, text: string) {
    this.send({ type: 'room:chat', sender, text });
  }

  public startRoomMatch() {
    this.send({ type: 'room:start' });
  }

  public subscribeRoom(cb: RoomListener): () => void {
    this.connect();
    this.roomListeners.add(cb);
    if (this.latestRoom) cb(this.latestRoom);
    return () => {
      this.roomListeners.delete(cb);
    };
  }

  public subscribeLeaderboard(cb: LeaderboardListener): () => void {
    this.connect();
    this.leaderboardListeners.add(cb);
    if (this.latestLeaderboard.length > 0) cb(this.latestLeaderboard);
    return () => {
      this.leaderboardListeners.delete(cb);
    };
  }

  public subscribeError(cb: ErrorListener): () => void {
    this.errorListeners.add(cb);
    return () => {
      this.errorListeners.delete(cb);
    };
  }

  public subscribeLaunch(cb: LaunchListener): () => void {
    this.launchListeners.add(cb);
    return () => {
      this.launchListeners.delete(cb);
    };
  }
}

export const multiplayerClient = new MultiplayerClient();
