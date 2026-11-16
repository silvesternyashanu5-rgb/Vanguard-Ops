import React, { useState, useRef, useEffect } from 'react';
import { 
  ActiveScreenLayer, 
  ArenaMap, 
  GameMode, 
  GameSettings, 
  MatchLaunchConfig,
  OperatorData, 
  TacticalPerk,
  WeaponData 
} from './types/game';
import { ARENA_MAPS, DEFAULT_SETTINGS, OPERATORS, getPerksForOperator, getWeaponsForOperator } from './data/gameData';
import { DEFAULT_HUD_LAYOUT } from './data/operatorControls';
import { CombatEngine } from './game/combatEngine';
import { MainLobby } from './components/MainLobby';
import { OperatorsLayer } from './components/layers/OperatorsLayer';
import { LoadoutLayer } from './components/layers/LoadoutLayer';
import { SettingsLayer } from './components/layers/SettingsLayer';
import { MapSelectLayer } from './components/layers/MapSelectLayer';
import { StoreLayer } from './components/layers/StoreLayer';
import { RoomLobbyLayer } from './components/layers/RoomLobbyLayer';
import { RankedLayer } from './components/layers/RankedLayer';
import { DeploymentPrepLayer } from './components/layers/DeploymentPrepLayer';
import { GameHUD } from './components/game/GameHUD';
import { OrientationNotice } from './components/OrientationNotice';
import { soundEngine } from './audio/soundEngine';
import { multiplayerClient } from './services/multiplayerClient';

export default function App() {
  const [activeLayer, setActiveLayer] = useState<ActiveScreenLayer>('lobby');
  const [operatorsList, setOperatorsList] = useState<OperatorData[]>(OPERATORS);
  const [operator, setOperator] = useState<OperatorData>(OPERATORS[0]);
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>([
    'skin_saitama_classic',
    'skin_saitama_serious',
    'skin_saitama_oppai',
    'skin_saitama_tracksuit',
    'skin_goku_base',
    'skin_goku_ssj1',
    'skin_goku_ssj2',
    'skin_superman_kryptonian',
    'skin_superman_kingdom',
    'skin_superman_solar',
    'skin_maxwell_archmage',
    'skin_maxwell_fire',
    'skin_maxwell_lightning',
    'skin_maxwell_frost',
    'skin_maxwell_void',
    'skin_maxwell_astral',
    'skin_maxwell_bloodmoon',
    'skin_king_classic',
    'skin_king_gold',
    'skin_flash_scarlet',
    'skin_flash_godspeed',
    'skin_flash_black',
    'skin_lantern_emerald',
    'skin_lantern_parallax',
    'skin_lantern_white',
    'skin_shazam_classic',
    'skin_shazam_black',
    'skin_thor_odinson',
    'skin_thor_ragnarok',
    'skin_thor_rune_king',
    'skin_silvester_prime',
    'skin_silvester_seraph',
    'skin_silvester_eclipse',
    'skin_dre_studio',
    'skin_dre_platinum',
    'skin_truth_oracle',
    'skin_truth_eclipse',
    'skin_heiliea_valkyrie',
    'skin_heiliea_rose',
    'skin_baby_boss',
    'skin_baby_cosmic',
    'skin_zenitsu_classic',
    'skin_zenitsu_godspeed',
    'skin_tanjiro_classic',
    'skin_tanjiro_hinokami',
    'skin_muzan_suit',
    'skin_muzan_final',
  ]);
  const [weaponsList, setWeaponsList] = useState<WeaponData[]>(() => getWeaponsForOperator(OPERATORS[0]));
  const [weapon, setWeapon] = useState<WeaponData>(() => {
    const weps = getWeaponsForOperator(OPERATORS[0]);
    return weps.find(w => w.category === 'primary') || weps[0];
  });
  const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponData>(() => {
    const weps = getWeaponsForOperator(OPERATORS[0]);
    return weps.find(w => w.category === 'secondary') || weps[weps.length - 1];
  });
  const [selectedPerk, setSelectedPerk] = useState<TacticalPerk>(() => getPerksForOperator(OPERATORS[0])[0]);
  const [activeMap, setActiveMap] = useState<ArenaMap>(ARENA_MAPS[0]);
  const [selectedMode, setSelectedMode] = useState<GameMode>('ffa');
  const [matchLaunchConfig, setMatchLaunchConfig] = useState<MatchLaunchConfig>({
    mode: 'ffa',
    isRanked: false,
    opponentNames: ['Ignis_Witch', 'Aqua_Sorceress', 'Pyro_Hex', 'Tide_Witch'],
    totalCombatants: 5,
    enemyType: 'witches',
  });
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('vanguard_ops_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          hudLayout: {
            ...DEFAULT_HUD_LAYOUT,
            ...(parsed.hudLayout || {}),
          },
        };
      }
    } catch {
      // Ignore storage read errors
    }
    return DEFAULT_SETTINGS;
  });

  const handlePersistSettings = (next: GameSettings) => {
    setSettings(next);
    combatEngineRef.current?.updateSettings(next);
    try {
      localStorage.setItem('vanguard_ops_settings_v1', JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const switchOperator = (nextOp: OperatorData) => {
    setOperator(nextOp);
    setOperatorsList(prev => prev.map(item => (item.id === nextOp.id ? nextOp : item)));
    const weps = getWeaponsForOperator(nextOp);
    setWeaponsList(weps);
    setWeapon(weps.find(w => w.category === 'primary') || weps[0]);
    setSecondaryWeapon(weps.find(w => w.category === 'secondary') || weps[weps.length - 1]);
    setSelectedPerk(getPerksForOperator(nextOp)[0]);
  };

  const handleSelectSkin = (skinId: string) => {
    setOperator(prev => ({ ...prev, selectedSkinId: skinId }));
    setOperatorsList(prev =>
      prev.map(op => (op.id === operator.id ? { ...op, selectedSkinId: skinId } : op))
    );
  };

  const handleToggleAttachment = (weaponId: string, attachmentId: string) => {
    const updateWeaponAttachments = (item: WeaponData): WeaponData => {
      if (item.id !== weaponId) return item;
      return {
        ...item,
        attachments: item.attachments.map(a =>
          a.id === attachmentId ? { ...a, enabled: !a.enabled } : a
        ),
      };
    };

    setWeaponsList(prev => prev.map(updateWeaponAttachments));
    setWeapon(prev => updateWeaponAttachments(prev));
    setSecondaryWeapon(prev => updateWeaponAttachments(prev));
  };

  const handleUnlockSkin = (skinId: string) => {
    setUnlockedSkinIds(prev => (prev.includes(skinId) ? prev : [...prev, skinId]));
    setOperatorsList(prevOps =>
      prevOps.map(op => {
        const hasSkin = op.skins.some(s => s.id === skinId);
        if (!hasSkin) return op;
        return {
          ...op,
          skins: op.skins.map(s => (s.id === skinId ? { ...s, isLocked: false } : s)),
        };
      })
    );
    setOperator(prevOp => {
      const hasSkin = prevOp.skins.some(s => s.id === skinId);
      if (!hasSkin) return prevOp;
      return {
        ...prevOp,
        skins: prevOp.skins.map(s => (s.id === skinId ? { ...s, isLocked: false } : s)),
      };
    });
  };

  // Ordered loadout so primary equipped slot is always index 0 and secondary is index 1
  const matchWeapons = [
    weapon,
    ...(secondaryWeapon.id !== weapon.id ? [secondaryWeapon] : []),
    ...weaponsList.filter(w => w.id !== weapon.id && w.id !== secondaryWeapon.id),
  ];

  // In-Game 3D Engine ref & reactive instance for HUD mount
  const gameMountRef = useRef<HTMLDivElement>(null);
  const combatEngineRef = useRef<CombatEngine | null>(null);
  const [combatEngineInstance, setCombatEngineInstance] = useState<CombatEngine | null>(null);

  // Handle Match Startup
  const handleStartGame = (customConfig?: Partial<MatchLaunchConfig>) => {
    const modeToRun = customConfig?.mode || selectedMode;
    const isRanked = customConfig?.isRanked ?? false;
    const resolvedConfig: MatchLaunchConfig = {
      mode: modeToRun,
      isRanked,
      enemyType: customConfig?.enemyType ?? (isRanked ? 'operators' : 'witches'),
      opponentNames:
        customConfig?.opponentNames ||
        (modeToRun === 'duel_1v1'
          ? [isRanked ? 'Ranked_Rival' : 'Ignis_Witch']
          : ['Ignis_Witch', 'Aqua_Sorceress', 'Pyro_Hex', 'Tide_Witch']),
      totalCombatants:
        customConfig?.totalCombatants ?? (modeToRun === 'duel_1v1' ? 2 : 5),
    };
    setMatchLaunchConfig(resolvedConfig);
    setSelectedMode(modeToRun);
    soundEngine.playUIClick('deploy');
    soundEngine.stopAmbientLoop();
    setActiveLayer('game');
  };

  // Mount 3D Combat Engine when entering 'game' layer
  useEffect(() => {
    if (activeLayer === 'game' && gameMountRef.current && !combatEngineRef.current) {
      const engine = new CombatEngine(
        gameMountRef.current,
        activeMap,
        operator,
        matchWeapons,
        selectedMode,
        settings,
        {
          onHealthChanged: () => {},
          onAmmoChanged: () => {},
          onWeaponChanged: () => {},
          onKillFeed: () => {},
          onScoresUpdated: () => {},
          onMatchOver: (_winner, isPlayerWinner) => {
            if (matchLaunchConfig.isRanked) {
              multiplayerClient.reportRankedResult(
                isPlayerWinner,
                engine.kills,
                engine.deaths,
                operator.id
              );
            }
          },
          onHitmarker: () => {},
          onPowerUpActive: () => {},
        },
        matchLaunchConfig
      );
      combatEngineRef.current = engine;
      setCombatEngineInstance(engine);

      const handleResize = () => engine.handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        engine.dispose();
        combatEngineRef.current = null;
        setCombatEngineInstance(null);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer, activeMap, operator, weapon, secondaryWeapon, weaponsList, selectedMode]);

  const handleExitMatch = () => {
    if (combatEngineRef.current) {
      combatEngineRef.current.dispose();
      combatEngineRef.current = null;
    }
    setCombatEngineInstance(null);
    setActiveLayer('lobby');
    soundEngine.startAmbientLoop();
  };

  return (
    <div className="relative w-screen h-dvh bg-[#07090e] overflow-hidden text-white font-tactical select-none">
      {/* Mobile Landscape Guidance Notice */}
      <OrientationNotice />

      {/* 1. MAIN LOBBY (When on lobby layer) */}
      {activeLayer === 'lobby' && (
        <MainLobby
          playerOperator={operator}
          equippedWeapon={weapon}
          activeMap={activeMap}
          selectedMode={selectedMode}
          onOpenLayer={layer => {
            soundEngine.playUIClick('select');
            setActiveLayer(layer);
          }}
          onStartGame={() => handleStartGame()}
        />
      )}

      {/* 2. OPERATORS LAYER (Fullscreen with Back Button) */}
      {activeLayer === 'operators' && (
        <OperatorsLayer
          operators={operatorsList}
          selectedOperator={operator}
          equippedWeapon={weapon}
          onSelectOperator={op => {
            switchOperator(op);
          }}
          onBack={() => setActiveLayer('lobby')}
          onOpenStore={() => setActiveLayer('store')}
        />
      )}

      {/* 3. LOADOUT LAYER (Fullscreen with Back Button) */}
      {activeLayer === 'loadout' && (
        <LoadoutLayer
          weapons={weaponsList}
          equippedWeapon={weapon}
          operator={operator}
          onEquipWeapon={w => {
            if (w.category === 'secondary') {
              setSecondaryWeapon(w);
            } else {
              setWeapon(w);
            }
            setWeaponsList(prev => prev.map(item => (item.id === w.id ? w : item)));
          }}
          onBack={() => setActiveLayer('lobby')}
        />
      )}

      {/* 4. SETTINGS LAYER (Fullscreen with Back Button) */}
      {activeLayer === 'settings' && (
        <SettingsLayer
          settings={settings}
          onUpdateSettings={handlePersistSettings}
          onBack={() => setActiveLayer('lobby')}
        />
      )}

      {/* 5. MAP SELECTION LAYER (Fullscreen with Back Button -> Confirm opens Deployment Prep) */}
      {activeLayer === 'maps' && (
        <MapSelectLayer
          maps={ARENA_MAPS}
          selectedMap={activeMap}
          selectedMode={selectedMode}
          onSelectMap={m => setActiveMap(m)}
          onSelectMode={m => setSelectedMode(m)}
          onConfirmSelection={(map, mode) => {
            setActiveMap(map);
            setSelectedMode(mode);
            setActiveLayer('deployment_prep');
          }}
          onBack={() => setActiveLayer('lobby')}
        />
      )}

      {/* 5B. DEPLOYMENT PREP LAYER (Shows all equipped hero gear & powers + PLAY button) */}
      {activeLayer === 'deployment_prep' && (
        <DeploymentPrepLayer
          operators={operatorsList}
          selectedOperator={operator}
          primaryWeapon={weapon}
          secondaryWeapon={secondaryWeapon}
          selectedPerk={selectedPerk}
          activeMap={activeMap}
          selectedMode={selectedMode}
          onChangeOperator={op => switchOperator(op)}
          onSelectSkin={handleSelectSkin}
          onEquipPrimary={w => {
            setWeapon(w);
            setWeaponsList(prev => prev.map(item => (item.id === w.id ? w : item)));
          }}
          onEquipSecondary={w => {
            setSecondaryWeapon(w);
            setWeaponsList(prev => prev.map(item => (item.id === w.id ? w : item)));
          }}
          onSelectPerk={perk => setSelectedPerk(perk)}
          onToggleAttachment={handleToggleAttachment}
          onOpenMaps={() => setActiveLayer('maps')}
          onOpenStore={() => setActiveLayer('store')}
          onBack={() => setActiveLayer('maps')}
          onPlayMatch={() => handleStartGame()}
        />
      )}

      {/* 6. STORE / BATTLE PASS LAYER (Fullscreen with Back Button) */}
      {(activeLayer === 'store' || activeLayer === 'battlepass') && (
        <StoreLayer
          unlockedSkinIds={unlockedSkinIds}
          onUnlockSkin={handleUnlockSkin}
          onBack={() => setActiveLayer('lobby')}
        />
      )}

      {/* 7. ROOM LOBBY LAYER (Multiplayer: Free-For-All 3+ w/ 2m Timer & 1v1 Match 2P Only) */}
      {activeLayer === 'room_lobby' && (
        <RoomLobbyLayer
          maps={ARENA_MAPS}
          playerOperator={operator}
          equippedWeapon={weapon}
          activeMap={activeMap}
          selectedMode={selectedMode}
          onSelectMap={m => setActiveMap(m)}
          onSelectMode={m => setSelectedMode(m)}
          onLaunchMatch={room => {
            const myId = multiplayerClient.getClientId();
            const otherPlayers = myId
              ? room.players.filter(p => p.id !== myId)
              : room.players.slice(1);
            handleStartGame({
              mode: room.mode,
              isRanked: room.isRanked,
              enemyType: room.isRanked ? 'operators' : 'witches',
              opponentNames: otherPlayers.map(p => p.name),
              totalCombatants: room.players.length,
            });
          }}
          onBack={() => setActiveLayer('lobby')}
        />
      )}

      {/* 7B. RANKED LADDER & 1V1 MATCH LAYER (Top to Bottom Rankings + 2-Player 1v1) */}
      {activeLayer === 'ranked' && (
        <RankedLayer
          playerOperator={operator}
          activeMap={activeMap}
          onStartRanked1v1={opponent => {
            handleStartGame({
              mode: 'duel_1v1',
              isRanked: true,
              opponentNames: [opponent.name],
              totalCombatants: 2,
            });
          }}
          onPrepRanked1v1={opponent => {
            setSelectedMode('duel_1v1');
            setMatchLaunchConfig({
              mode: 'duel_1v1',
              isRanked: true,
              opponentNames: [opponent.name],
              totalCombatants: 2,
            });
            setActiveLayer('deployment_prep');
          }}
          onBack={() => setActiveLayer('lobby')}
        />
      )}

      {/* 8. 3D COMBAT GAME SESSION */}
      {activeLayer === 'game' && (
        <div className="relative w-full h-full">
          {/* Isolated WebGL Mount */}
          <div ref={gameMountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

          {/* Clean Minimalist Tactical HUD matching requested control layout */}
          {combatEngineInstance && (
            <GameHUD
              engine={combatEngineInstance}
              operator={operator}
              settings={settings}
              onUpdateSettings={handlePersistSettings}
              onExitMatch={handleExitMatch}
              onPlayAgain={() => {
                handleExitMatch();
                setTimeout(() => handleStartGame(), 80);
              }}
              onOpenStore={() => {
                handleExitMatch();
                setActiveLayer('store');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
