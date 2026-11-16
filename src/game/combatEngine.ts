import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  ArenaMap, 
  GameMode, 
  GameSettings, 
  KillFeedEntry, 
  OperatorData, 
  PowerUpInstance, 
  WeaponData, 
  CombatantScore,
  EndOfMatchStats,
  MatchAward,
  MatchLaunchConfig,
  MaxwellElement
} from '../types/game';
import { buildArenaMap, BuiltMap } from './mapBuilder';
import {
  clipCameraRayAgainstObstacles,
  CollisionQueryContext,
  resolveCharacterCollision,
} from './collision';
import { createOperatorMesh, createPowerUpMesh, createWeaponMesh, createWitchMesh } from './threeModels';
import { soundEngine } from '../audio/soundEngine';
import { ArcanumDynamicWorldSimulator } from './arcanumWorldSimulator';

const MAXWELL_ELEMENT_ORDER: MaxwellElement[] = ['arcane', 'fire', 'lightning', 'frost', 'void'];

const MAXWELL_ELEMENT_PROFILES: Record<
  MaxwellElement,
  {
    label: string;
    coatHex: string;
    capeHex: string;
    gloveHex: string;
    runeHex: string;
    auraHex: string;
    tracerHex: string;
  }
> = {
  arcane: {
    label: 'ARCANE FORM — -30% MANA COST',
    coatHex: '#2e1065',
    capeHex: '#581c87',
    gloveHex: '#3b0764',
    runeHex: '#c084fc',
    auraHex: '#a855f7',
    tracerHex: '#c084fc',
  },
  fire: {
    label: 'PYRO TRANSMISSION — +35% DMG & BURN IMMUNE',
    coatHex: '#450a0a',
    capeHex: '#991b1b',
    gloveHex: '#7c2d12',
    runeHex: '#fb923c',
    auraHex: '#f97316',
    tracerHex: '#fb923c',
  },
  lightning: {
    label: 'VOLT TRANSMISSION — +38% SPD & RAPID CAST',
    coatHex: '#0c4a6e',
    capeHex: '#0369a1',
    gloveHex: '#164e63',
    runeHex: '#fde047',
    auraHex: '#38bdf8',
    tracerHex: '#38bdf8',
  },
  frost: {
    label: 'FROST TRANSMISSION — CHILL HIT & WARD REGEN',
    coatHex: '#083344',
    capeHex: '#155e75',
    gloveHex: '#0e7490',
    runeHex: '#a5f3fc',
    auraHex: '#22d3ee',
    tracerHex: '#67e8f9',
  },
  void: {
    label: 'VOID TRANSMISSION — +45% DMG & LIFESTEAL',
    coatHex: '#09090b',
    capeHex: '#4c0519',
    gloveHex: '#3b0764',
    runeHex: '#f43f5e',
    auraHex: '#e11d48',
    tracerHex: '#f43f5e',
  },
};

export interface CombatEngineCallbacks {
  onHealthChanged: (health: number, armor: number) => void;
  onAmmoChanged: (current: number, reserve: number) => void;
  onWeaponChanged: (weapon: WeaponData) => void;
  onKillFeed: (entry: KillFeedEntry) => void;
  onScoresUpdated: (scores: CombatantScore[]) => void;
  onMatchOver: (winner: string, isPlayerWinner: boolean) => void;
  onMatchOverWithStats?: (stats: EndOfMatchStats) => void;
  onHitmarker: (isHeadshot: boolean, damage: number) => void;
  onPowerUpActive: (type: string, duration: number) => void;
  onKiChanged?: (energy: number) => void;
  onStaggerChanged?: (stagger: number, isStaggered: boolean) => void;
  onFlightChanged?: (flying: boolean) => void;
  onThermalOverloadChanged?: (active: boolean) => void;
  onElementChanged?: (element: MaxwellElement) => void;
}

export class CombatEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private swFrameTimeout: number | null = null;
  private isDisposed: boolean = false;
  private clock: THREE.Clock;

  // Active Map & Environment
  private activeMap: ArenaMap;
  private builtMap: BuiltMap | null = null;

  // Player State
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 1.7, 0);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public playerYaw: number = 0;
  public playerPitch: number = 0;
  public isGrounded: boolean = true;
  public isCrouched: boolean = false;
  public isADS: boolean = false;
  public isReloading: boolean = false;
  public isFiring: boolean = false;
  public isSprinting: boolean = false;
  public health: number = 100;
  public armor: number = 50;
  public kills: number = 0;
  public deaths: number = 0;
  public streak: number = 0;
  public highestStreak: number = 0;
  public totalDamage: number = 0;
  public headshots: number = 0;
  public shotsFired: number = 0;
  public shotsHit: number = 0;
  public powerUpsCollected: number = 0;
  public abilitiesUsed: number = 0;
  public matchStartTime: number = Date.now();
  private killIdCounter: number = 0;
  public kiEnergy: number = 100;
  public isKiCharging: boolean = false;
  public currentMagicElement: MaxwellElement = 'arcane';
  private frostArmorAccum: number = 0;
  private activeSkinOverrideId: string | null = null;
  public operator: OperatorData;
  public weapons: WeaponData[];
  public activeWeaponIndex: number = 0;
  private weaponMesh: THREE.Group | null = null;
  private muzzleFlashLight: THREE.PointLight | null = null;
  private lastFireTime: number = 0;
  private reloadEndTime: number = 0;

  // Superman Mechanics: Flight, Super-Speed Dash, Stagger Resistance, Thermal Overload
  public isFlying: boolean = false;
  public isThermalOverload: boolean = false;
  private thermalOverloadTimer: number = 0;
  private thermalTickAccum: number = 0;
  private thermalScorchAccum: number = 0;
  public staggerResistance: number = 100;
  public isStaggered: boolean = false;
  private staggerRecoverTimer: number = 0;
  private staggerDelayTimer: number = 0;
  private superDashTimer: number = 0;
  private superDashDir: THREE.Vector3 = new THREE.Vector3();
  private wasFastFlight: boolean = false;
  private dashTrails: Array<{ mesh: THREE.Mesh; life: number }> = [];
  private thermalBeamsGroup: THREE.Group | null = null;
  private thermalLeftSheath: THREE.Mesh | null = null;
  private thermalRightSheath: THREE.Mesh | null = null;
  private thermalLeftCore: THREE.Mesh | null = null;
  private thermalRightCore: THREE.Mesh | null = null;
  private thermalImpactLight: THREE.PointLight | null = null;
  private snappedFloraIds: Set<string> = new Set();

  // Recoil & Sway
  private recoilPitch: number = 0;
  private recoilYaw: number = 0;
  private swayOffset: THREE.Vector3 = new THREE.Vector3();

  // Active Power-Ups on Player
  public quadDamageTimer: number = 0;
  public speedBoostTimer: number = 0;

  // 3D Power-Up Pickups in World
  private powerUps: PowerUpInstance[] = [];
  private powerUpMeshes: Map<string, THREE.Group> = new Map();

  // Bots
  private bots: Array<{
    id: string;
    name: string;
    team: 'red' | 'blue';
    pos: THREE.Vector3;
    rotY: number;
    health: number;
    armor: number;
    mesh: THREE.Group;
    target: THREE.Vector3 | null;
    state: 'patrol' | 'hunt' | 'attack';
    lastShotTime: number;
    isAlive: boolean;
    respawnTimer: number;
    frozenTimer: number;
    kills: number;
    deaths: number;
    isWitch: boolean;
    nextSpell: 'fire' | 'water';
    castAnimTimer: number;
  }> = [];

  // Bullets, Witch Elemental Spells & Visual FX
  private bulletTracers: Array<{
    line: THREE.Object3D;
    origin: THREE.Vector3;
    direction: THREE.Vector3;
    distance: number;
    progress: number;
  }> = [];

  private witchSpells: Array<{
    mesh: THREE.Group;
    element: 'fire' | 'water';
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    attackerName: string;
  }> = [];

  private playerBurnTimer: number = 0;
  private burnTickAccum: number = 0;
  private playerBurnAttacker: string = 'Fire Witch';
  private playerWaterSlowTimer: number = 0;

  // Realism FX: Camera shake, impact particles, footsteps, atmospheric effects
  private screenShake: number = 0;
  private damageFlinch: number = 0;
  private footstepAccumulator: number = 0;
  private footstepSide: number = 1;
  private lastHeartbeatTime: number = 0;
  private wasGrounded: boolean = true;
  private sunLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private worldSimulator: ArcanumDynamicWorldSimulator | null = null;

  // Third-person Character Avatar & Action Timers
  public isThirdPerson: boolean = true;
  private playerMesh: THREE.Group | null = null;
  private meshFacingYaw: number = 0;
  private slideTimer: number = 0;
  private slideDir: THREE.Vector3 = new THREE.Vector3();
  private kickTimer: number = 0;
  private punchAnimTimer: number = 0;

  // Match State
  private gameMode: GameMode;
  private settings: GameSettings;
  public callbacks: CombatEngineCallbacks;
  private matchTimer: number = 300; // 5 minutes
  private killGoal: number = 25;
  private isMatchRunning: boolean = true;

  // Input state
  public moveInput = { x: 0, y: 0 };
  public lookInput = { x: 0, y: 0 };
  public lookDelta = { x: 0, y: 0 };
  public operatorName: string = 'Saitama';

  constructor(
    container: HTMLElement,
    map: ArenaMap,
    operator: OperatorData,
    weapons: WeaponData[],
    mode: GameMode,
    settings: GameSettings,
    callbacks: CombatEngineCallbacks,
    matchConfig?: MatchLaunchConfig
  ) {
    this.container = container;
    this.activeMap = map;
    this.operator = operator;
    this.operatorName = operator.name;
    this.weapons = JSON.parse(JSON.stringify(weapons)); // clone
    this.gameMode = mode;
    this.killGoal = mode === 'duel_1v1' ? 10 : 20;
    this.settings = settings;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(map.skyColor);
    this.scene.fog = new THREE.FogExp2(map.fogColor, map.fogDensity);

    const initFov = THREE.MathUtils.clamp(settings.cameraFov ?? 54, 40, 95);
    this.camera = new THREE.PerspectiveCamera(
      initFov,
      container.clientWidth / container.clientHeight,
      0.05,
      300
    );
    this.scene.add(this.camera);

    // 4. Calibrated Studio Environment Reflection (subdued so shadows & normal relief stay crisp)
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environmentIntensity = 0.34;
      pmremGenerator.dispose();
    } catch {
      // Ignored if environment generator fails
    }

    // 5. Lighting Rig
    this.setupLighting();

    // 6. Build Arena Geometry
    this.builtMap = buildArenaMap(map);
    this.scene.add(this.builtMap.group);

    // 6B. Initialize ARCANUM_DYNAMIC_WORLD_SIMULATOR
    if (this.sunLight && this.hemiLight) {
      this.worldSimulator = new ArcanumDynamicWorldSimulator(
        this.scene,
        map,
        this.builtMap.groundMesh,
        this.builtMap.groundSegments,
        this.sunLight,
        this.hemiLight,
        this.builtMap.flora,
        this.isSoftwareGl
      );
    }

    // 7. Setup Power-Up Pickups
    this.setupPowerUps();

    // 8. Setup First-Person Handheld Weapon & Third-Person Player Avatar
    this.setupFirstPersonWeapon();
    this.setupPlayerAvatar();

    // 9. Spawn Bots (1 rival in 1v1 Match; 2+ rivals in Free-For-All)
    this.setupBots(operator, matchConfig);

    // 10. Position Player at Spawn (preserving elevated spawn Y + eye height and clearing any overlapping props)
    const spawn = this.builtMap.spawnPoints[0] || new THREE.Vector3(0, 0, 0);
    const spawnTerrainY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(spawn.x, spawn.z) : 0;
    const spawnFeetY = Math.max(spawn.y, spawnTerrainY);
    this.playerPos.set(spawn.x, spawnFeetY + this.getEyeHeightOffset(), spawn.z);
    this.resolvePlayerCollision(spawnFeetY, null);
    this.updateThirdPersonCamera(0);

    // Initial state trigger
    this.callbacks.onHealthChanged(this.health, this.armor);
    this.callbacks.onStaggerChanged?.(this.staggerResistance, this.isStaggered);
    if (this.operator.id === 'maxwell_shodron') {
      this.callbacks.onElementChanged?.(this.currentMagicElement);
    }
    const curWep = this.getCurrentWeapon();
    this.callbacks.onAmmoChanged(curWep.currentAmmo, curWep.reserveAmmo);
    this.callbacks.onWeaponChanged(curWep);
    this.updateScoresList();

    // Pre-compile scene & shader programs to eliminate first-shot frame hitches
    try {
      this.renderer.compile(this.scene, this.camera);
    } catch {
      // Safe fallback if driver blocks eager compile
    }

    // 11. Start Loop
    this.tick = this.tick.bind(this);
    this.tick();

    soundEngine.playAnnouncer('match_start');
  }

  private setupLighting() {
    const { lightingPreset } = this.activeMap;

    // Subdued Hemisphere light so shadows keep rich depth & cloth folds pop
    const hemiLight = new THREE.HemisphereLight(
      lightingPreset.hemiSky,
      lightingPreset.hemiGround,
      0.42
    );
    this.hemiLight = hemiLight;
    this.scene.add(hemiLight);

    // Key directional sun light with tight high-resolution shadow frustum
    const dirLight = new THREE.DirectionalLight(lightingPreset.sunColor, lightingPreset.sunIntensity * 1.22);
    dirLight.position.set(
      lightingPreset.sunPosition[0],
      lightingPreset.sunPosition[1],
      lightingPreset.sunPosition[2]
    );

    if (!this.isSoftwareGl && this.settings.shadows) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 95;
      const d = 12;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0003;
      dirLight.shadow.normalBias = 0.012;
      dirLight.shadow.radius = 2.0;
    }
    this.sunLight = dirLight;
    this.scene.add(dirLight);
    this.scene.add(dirLight.target);

    // Cool twilight rim light separating cape, cranium, and shoulders from dark concrete
    const rimFill = new THREE.DirectionalLight('#93c5fd', 0.78);
    rimFill.position.set(-lightingPreset.sunPosition[0] * 0.7, 16, -lightingPreset.sunPosition[2] * 0.7);
    this.scene.add(rimFill);

    // Minimal ambient floor bounce
    const amb = new THREE.AmbientLight('#ffffff', 0.08);
    this.scene.add(amb);
  }

  private setupFirstPersonWeapon() {
    if (this.weaponMesh) {
      this.camera.remove(this.weaponMesh);
    }

    const curWep = this.getCurrentWeapon();
    this.weaponMesh = createWeaponMesh(curWep);
    
    // Position weapon in lower-right first person perspective (hidden while third-person avatar active)
    this.weaponMesh.position.set(0.24, -0.22, -0.45);
    this.weaponMesh.rotation.set(0.04, -0.08, 0);
    this.weaponMesh.visible = !this.isThirdPerson;
    this.camera.add(this.weaponMesh);

    // Muzzle flash light
    this.muzzleFlashLight = new THREE.PointLight('#fef08a', 0, 8);
    this.muzzleFlashLight.position.set(0.24, -0.18, -0.85);
    this.camera.add(this.muzzleFlashLight);
  }

  private setupPlayerAvatar() {
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
    }
    const targetSkinId = this.activeSkinOverrideId || this.operator.selectedSkinId;
    const selectedSkin =
      this.operator.skins.find(s => s.id === targetSkinId) ||
      this.operator.skins[0];
    if (this.operator.id === 'maxwell_shodron') {
      if (selectedSkin.camoPattern === 'maxwell_fire') this.currentMagicElement = 'fire';
      else if (selectedSkin.camoPattern === 'maxwell_lightning') this.currentMagicElement = 'lightning';
      else if (selectedSkin.camoPattern === 'maxwell_frost') this.currentMagicElement = 'frost';
      else if (
        selectedSkin.camoPattern === 'maxwell_void' ||
        selectedSkin.camoPattern === 'maxwell_blood_moon'
      ) {
        this.currentMagicElement = 'void';
      } else {
        this.currentMagicElement = 'arcane';
      }
    }
    this.playerMesh = createOperatorMesh(selectedSkin, this.getCurrentWeapon());
    this.playerMesh.visible = this.isThirdPerson;
    this.scene.add(this.playerMesh);
    if (this.operator.id === 'maxwell_shodron') {
      this.applyMaxwellElementAppearance();
    }
  }

  public transformNextForm() {
    if (!this.isMatchRunning || this.operator.skins.length <= 1) return;
    const currentId = this.activeSkinOverrideId || this.operator.selectedSkinId;
    const idx = Math.max(0, this.operator.skins.findIndex(s => s.id === currentId));
    const nextSkin = this.operator.skins[(idx + 1) % this.operator.skins.length];
    this.activeSkinOverrideId = nextSkin.id;
    this.abilitiesUsed += 1;
    this.armor = Math.min(100, this.armor + 30);
    this.speedBoostTimer = Math.max(this.speedBoostTimer, 3.2);
    this.screenShake = Math.max(this.screenShake, 0.75);
    soundEngine.playFormTransform();
    this.setupPlayerAvatar();
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const ringHex = nextSkin.auraColor || nextSkin.visorColor || '#fde047';
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.35, this.playerPos.z), ringHex, 12, 460);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    this.callbacks.onPowerUpActive(`FORM AWAKENED: ${nextSkin.name.toUpperCase()}!`, 2.6);
  }

  private applyMaxwellElementAppearance() {
    const mats = this.playerMesh?.userData?.maxwellMats as
      | {
          coatMat?: THREE.MeshStandardMaterial;
          capeMat?: THREE.MeshStandardMaterial;
          runeGlowMat?: THREE.MeshStandardMaterial;
          gloveMat?: THREE.MeshStandardMaterial;
          auraMat?: THREE.MeshBasicMaterial;
        }
      | undefined;
    if (!mats) return;
    const p = MAXWELL_ELEMENT_PROFILES[this.currentMagicElement];
    mats.coatMat?.color.set(p.coatHex);
    mats.capeMat?.color.set(p.capeHex);
    mats.gloveMat?.color.set(p.gloveHex);
    if (mats.runeGlowMat) {
      mats.runeGlowMat.color.set(p.runeHex);
      mats.runeGlowMat.emissive.set(p.runeHex);
    }
    if (mats.auraMat) {
      mats.auraMat.color.set(p.auraHex);
    }
  }

  public transmuteElement(target?: MaxwellElement) {
    if (!this.isMatchRunning || this.operator.id !== 'maxwell_shodron') return;
    let next: MaxwellElement;
    if (target) {
      if (target === this.currentMagicElement) return;
      next = target;
    } else {
      const idx = MAXWELL_ELEMENT_ORDER.indexOf(this.currentMagicElement);
      next = MAXWELL_ELEMENT_ORDER[(idx + 1) % MAXWELL_ELEMENT_ORDER.length];
    }

    this.currentMagicElement = next;
    this.abilitiesUsed += 1;
    this.applyMaxwellElementAppearance();
    soundEngine.playElementTransmission(next);

    const profile = MAXWELL_ELEMENT_PROFILES[next];
    const footOrigin = this.playerPos.clone().add(new THREE.Vector3(0, -1.0, 0));
    this.spawnSigilRing(footOrigin, profile.tracerHex, 4.4, 420);
    this.spawnSigilRing(footOrigin.clone().add(new THREE.Vector3(0, 0.35, 0)), profile.runeHex, 3.0, 340);
    this.screenShake = Math.max(this.screenShake, 0.36);

    if (next === 'fire') this.playerBurnTimer = 0;
    if (next === 'frost') this.playerWaterSlowTimer = 0;

    this.callbacks.onElementChanged?.(next);
    this.callbacks.onPowerUpActive(profile.label, 2.2);
  }

  public setThirdPerson(enabled: boolean) {
    this.isThirdPerson = enabled;
    if (this.playerMesh) this.playerMesh.visible = enabled;
    if (this.weaponMesh) this.weaponMesh.visible = !enabled;
  }

  public updateSettings(next: GameSettings) {
    this.settings = next;
    if (this.sunLight && !this.isSoftwareGl) {
      this.renderer.shadowMap.enabled = next.shadows;
      this.sunLight.castShadow = next.shadows;
    }
    soundEngine.setVolumes(next.masterVolume, next.sfxVolume, next.musicVolume);
    if (!this.isADS) {
      const customFov = THREE.MathUtils.clamp(next.cameraFov ?? 54, 40, 95);
      this.camera.fov = this.isThirdPerson ? customFov : Math.max(customFov, 68);
      this.camera.updateProjectionMatrix();
    }
  }

  public getRadarState() {
    return {
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      playerYaw: this.playerYaw,
      mapSize: this.activeMap.mapSize,
      bots: this.bots.map(b => ({
        id: b.id,
        x: b.pos.x,
        z: b.pos.z,
        isAlive: b.isAlive,
      })),
      powerUps: this.powerUps.map(p => ({
        id: p.id,
        x: p.position[0],
        z: p.position[2],
        isAvailable: p.isAvailable,
        type: p.type,
      })),
    };
  }

  private setupPowerUps() {
    this.activeMap.powerUpSpawns.forEach((spawn, idx) => {
      const pUp: PowerUpInstance = {
        id: `powerup_${idx}`,
        type: spawn.type,
        position: spawn.position,
        name: spawn.type.replace('_', ' ').toUpperCase(),
        duration: spawn.type === 'quad_damage' || spawn.type === 'speed' ? 15 : 0,
        color: spawn.type === 'quad_damage' ? '#a855f7' :
               spawn.type === 'speed' ? '#eab308' :
               spawn.type === 'health' ? '#22c55e' :
               spawn.type === 'armor' ? '#06b6d4' : '#f97316',
        glowColor: spawn.type === 'quad_damage' ? '#c084fc' :
                   spawn.type === 'speed' ? '#fde047' :
                   spawn.type === 'health' ? '#4ade80' :
                   spawn.type === 'armor' ? '#38bdf8' : '#fb923c',
        isAvailable: true,
        respawnTimeRemaining: 0,
        respawnDelay: spawn.respawnDelay,
      };

      const mesh = createPowerUpMesh(pUp.type, pUp.color);
      mesh.position.set(pUp.position[0], pUp.position[1], pUp.position[2]);
      this.scene.add(mesh);

      this.powerUps.push(pUp);
      this.powerUpMeshes.set(pUp.id, mesh);
    });
  }

  private setupBots(playerOperator: OperatorData, matchConfig?: MatchLaunchConfig) {
    const isDuel = this.gameMode === 'duel_1v1';
    const isWitches = matchConfig?.enemyType === 'witches' || (!matchConfig?.isRanked && matchConfig?.enemyType !== 'operators');
    const desiredTotal = isDuel
      ? 2
      : Math.max(3, matchConfig?.totalCombatants ?? 5);
    const botCount = Math.max(1, desiredTotal - 1);
    const defaultNames = isWitches
      ? ['Ignis_Witch', 'Aqua_Sorceress', 'Pyro_Hex', 'Tide_Siren', 'Ember_Coven', 'Frost_Witch', 'Cinder_Mage']
      : ['Viper_07', 'Ghost_K9', 'ShadowReaper', 'Apex_Sniper', 'NightStalker', 'Kal_El_Prime', 'Kakarot_Ultra'];
    const opponentNames = matchConfig?.opponentNames || [];
    const dummyWeapon = this.weapons[0];

    for (let i = 0; i < botCount; i++) {
      const spawnIdx = (i + 1) % (this.builtMap?.spawnPoints.length || 1);
      const spawn = this.builtMap?.spawnPoints[spawnIdx] || new THREE.Vector3(0, 0, 0);

      let botMesh: THREE.Group;
      if (isWitches) {
        botMesh = createWitchMesh(i);
      } else {
        const botSkin = playerOperator.skins[i % playerOperator.skins.length];
        botMesh = createOperatorMesh(botSkin, dummyWeapon);
      }
      botMesh.position.copy(spawn);
      this.scene.add(botMesh);

      this.bots.push({
        id: `bot_${i}`,
        name: opponentNames[i] || defaultNames[i % defaultNames.length],
        team: isDuel ? 'red' : i % 2 === 0 ? 'red' : 'blue',
        pos: spawn.clone(),
        rotY: Math.random() * Math.PI * 2,
        health: isWitches ? 120 : 100,
        armor: isWitches ? 30 : 25,
        mesh: botMesh,
        target: null,
        state: 'patrol',
        lastShotTime: 0,
        isAlive: true,
        respawnTimer: 0,
        frozenTimer: 0,
        kills: 0,
        deaths: 0,
        isWitch: isWitches,
        nextSpell: i % 2 === 0 ? 'fire' : 'water',
        castAnimTimer: 0,
      });
    }
  }

  public getCurrentWeapon(): WeaponData {
    return this.weapons[this.activeWeaponIndex];
  }

  public switchWeapon(index?: number) {
    if (this.isReloading) return;
    if (index !== undefined) {
      this.activeWeaponIndex = index % this.weapons.length;
    } else {
      this.activeWeaponIndex = (this.activeWeaponIndex + 1) % this.weapons.length;
    }

    const cur = this.getCurrentWeapon();
    this.setupFirstPersonWeapon();
    this.setupPlayerAvatar();
    soundEngine.playUIClick('tab');
    this.callbacks.onWeaponChanged(cur);
    this.callbacks.onAmmoChanged(cur.currentAmmo, cur.reserveAmmo);
  }

  public reload() {
    const cur = this.getCurrentWeapon();
    if (this.isReloading || cur.currentAmmo === cur.magSize || cur.reserveAmmo <= 0) return;

    this.isReloading = true;
    this.reloadEndTime = this.clock.getElapsedTime() + cur.reloadTime;
    soundEngine.playReload('mag_out');

    setTimeout(() => {
      if (this.isReloading) soundEngine.playReload('mag_in');
    }, (cur.reloadTime * 1000) * 0.45);

    setTimeout(() => {
      if (this.isReloading) soundEngine.playReload('bolt');
    }, (cur.reloadTime * 1000) * 0.85);
  }

  public setADS(ads: boolean) {
    this.isADS = ads;
    soundEngine.playUIClick('tab');
  }

  public startFiring() {
    this.isFiring = true;
  }

  public stopFiring() {
    this.isFiring = false;
  }

  public jump() {
    if (this.isFlying) {
      this.playerVelocity.y = 7.2;
      this.isGrounded = false;
      return;
    }
    if (this.isGrounded) {
      this.playerVelocity.y = 7.8;
      this.isGrounded = false;
      this.slideTimer = 0;
      this.worldSimulator?.spawnFootstepDust(this.playerPos, 1.1);
    }
  }

  public triggerSlide() {
    if (!this.isMatchRunning || this.slideTimer > 0.1) return;
    if (this.isFlying) {
      this.playerVelocity.y = -6.5;
      return;
    }
    const forward = new THREE.Vector3(-Math.sin(this.playerYaw), 0, -Math.cos(this.playerYaw));
    const right = new THREE.Vector3(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw));
    const moveDir = new THREE.Vector3()
      .addScaledVector(forward, this.moveInput.y)
      .addScaledVector(right, this.moveInput.x);

    if (moveDir.lengthSq() > 0.01) {
      moveDir.normalize();
    } else {
      moveDir.copy(forward);
    }

    this.slideDir.copy(moveDir);
    this.slideTimer = 0.48;
    this.playerVelocity.x = moveDir.x * 16.5;
    this.playerVelocity.z = moveDir.z * 16.5;
    soundEngine.playFootstep();
    this.worldSimulator?.spawnFootstepDust(this.playerPos, 1.6);
  }

  public triggerKick() {
    if (!this.isMatchRunning || this.kickTimer > 0.15) return;
    this.kickTimer = 0.38;
    this.screenShake = Math.max(this.screenShake, 0.55);
    if (this.operator.id === 'dre_titan') {
      soundEngine.playDreBass(false);
    } else if (this.operator.id === 'zenitsu_agatsuma') {
      soundEngine.playZenitsuThunder(false);
    } else if (this.operator.id === 'tanjiro_kamado') {
      soundEngine.playTanjiroBreath(true);
    } else if (this.operator.id === 'muzan_kibutsuji') {
      soundEngine.playMuzanBlood(false);
    } else {
      soundEngine.playGunshot(
        this.operator.id === 'superman' || this.operator.id === 'shazam_champion'
          ? 'kryptonian_strike'
          : this.operator.id === 'thor_odinson'
          ? 'mjolnir_strike'
          : 'fist',
        true
      );
    }

    const forward = new THREE.Vector3(-Math.sin(this.playerYaw), 0, -Math.cos(this.playerYaw)).normalize();
    const strikeOrigin = this.playerPos.clone().addScaledVector(forward, 2.2);

    // Medium kinetic shockwave + cone foliage whip
    this.worldSimulator?.onHeavyPunchThrown(
      strikeOrigin,
      forward.clone().multiplyScalar(82),
      2.8
    );

    const quadMult = this.quadDamageTimer > 0 ? 4 : 1;
    const strongHeroSet = new Set([
      'saitama', 'son_goku', 'superman', 'the_flash', 'green_lantern', 'shazam_champion',
      'thor_odinson', 'silvester_jais', 'the_truth', 'heiliea_valkyrie', 'the_baby',
      'zenitsu_agatsuma', 'tanjiro_kamado', 'muzan_kibutsuji', 'iron_man', 'spider_man',
      'doctor_strange', 'scarlet_witch', 'batman', 'wonder_woman', 'aquaman',
      'rimuru_tempest', 'sung_jinwoo', 'naruto_uzumaki', 'monkey_d_luffy',
      'satoru_gojo', 'yuji_itadori', 'garou_opm', 'anos_voldigoad', 'itachi_uchiha', 'sasuke_uchiha',
    ]);
    const isStrongHero = strongHeroSet.has(this.operator.id);
    const kickDamage = (this.operator.id === 'silvester_jais' || this.operator.id === 'anos_voldigoad' ? 220 : isStrongHero ? 155 : 75) * quadMult;

    for (const bot of this.bots) {
      if (!bot.isAlive) continue;
      const toBot = bot.pos.clone().sub(this.playerPos);
      toBot.y = 0;
      const dist = toBot.length();
      if (dist < 4.8 && (dist < 1.2 || forward.dot(toBot.normalize()) > 0.35)) {
        this.damageBot(bot, kickDamage, false);
        this.totalDamage += kickDamage;
        this.shotsHit += 1;
        soundEngine.playHitmarker(false);
        this.callbacks.onHitmarker(false, kickDamage);
      }
    }
  }

  public toggleCrouch() {
    this.isCrouched = !this.isCrouched;
  }

  // Shoot weapon action
  private shoot() {
    const cur = this.getCurrentWeapon();
    if (this.isReloading) return;

    if (cur.currentAmmo <= 0) {
      this.reload();
      return;
    }

    const now = this.clock.getElapsedTime();
    const isLightningMaxwell =
      this.operator.id === 'maxwell_shodron' && this.currentMagicElement === 'lightning';
    const effectiveFireRate = cur.fireRate * (isLightningMaxwell ? 1.35 : 1.0);
    if (now - this.lastFireTime < 1 / effectiveFireRate) return;

    this.lastFireTime = now;
    cur.currentAmmo -= 1;
    this.shotsFired += 1;
    this.callbacks.onAmmoChanged(cur.currentAmmo, cur.reserveAmmo);

    // Audio
    soundEngine.playGunshot(cur.type, this.quadDamageTimer > 0);

    // Recoil kickback
    const recoilAmount = cur.recoil * (this.isADS ? 0.45 : 1.0);
    this.recoilPitch += recoilAmount;
    this.recoilYaw += (Math.random() - 0.5) * recoilAmount * 0.5;

    // Visual Muzzle Flash & Punch/Fire Swing Animation
    this.punchAnimTimer = 0.22;
    if (this.muzzleFlashLight) {
      this.muzzleFlashLight.intensity = 4.5;
      setTimeout(() => {
        if (this.muzzleFlashLight) this.muzzleFlashLight.intensity = 0;
      }, 50);
    }

    // Weapon kick animation in camera space
    if (this.weaponMesh) {
      this.weaponMesh.position.z = -0.36;
      this.weaponMesh.rotation.x = 0.12;
    }

    // Raycast bullet calculation from camera through reticle, starting clear of third-person camera backplane
    const raycaster = new THREE.Raycaster();
    const spread = cur.spread * (this.isADS ? 0.2 : 1.0);
    const screenCoord = new THREE.Vector2(
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2
    );

    raycaster.setFromCamera(screenCoord, this.camera);
    if (this.isThirdPerson) {
      // Advance origin to just ahead of player shoulder so third-person camera never hits behind character
      const camToPlayer = this.camera.position.distanceTo(this.playerPos);
      raycaster.ray.origin.addScaledVector(raycaster.ray.direction, Math.max(0.5, camToPlayer * 0.82));
    }

    const tracerStart = this.isThirdPerson
      ? this.playerPos.clone().addScaledVector(raycaster.ray.direction, 0.7).setY(this.playerPos.y - 0.25)
      : raycaster.ray.origin.clone();

    // MidAirLayer.ProjectileCollision: Check nearest obstacle wall hit along ray
    let obstacleHitDist = 75;
    let obstacleHitPoint: THREE.Vector3 | null = null;
    if (this.builtMap) {
      const ray = raycaster.ray;
      const obsHit = new THREE.Vector3();
      for (const obs of this.builtMap.obstacles) {
        if (ray.intersectBox(obs.box, obsHit)) {
          const d = ray.origin.distanceTo(obsHit);
          if (d < obstacleHitDist) {
            obstacleHitDist = d;
            obstacleHitPoint = obsHit.clone();
          }
        }
      }
    }

    // Check hit against bots (respecting obstacle occlusion)
    let hitSomething = false;
    const botTargets = this.bots.filter(b => b.isAlive);
    const damageMultiplier = this.quadDamageTimer > 0 ? 4 : 1;

    for (const bot of botTargets) {
      const botBox = new THREE.Box3().setFromObject(bot.mesh);
      // Slightly expand box for responsive hit detection
      botBox.expandByScalar(0.2);

      const intersectionPoint = new THREE.Vector3();
      const ray = raycaster.ray;

      if (ray.intersectBox(botBox, intersectionPoint)) {
        const dist = ray.origin.distanceTo(intersectionPoint);
        if (dist > obstacleHitDist + 0.15) {
          continue; // Occluded behind arena cover
        }
        hitSomething = true;
        this.shotsHit += 1;
        const isHeadshot = intersectionPoint.y > (bot.pos.y + 1.45);
        if (isHeadshot) this.headshots += 1;
        const elementDmgMult =
          this.operator.id === 'maxwell_shodron'
            ? this.currentMagicElement === 'void'
              ? 1.45
              : this.currentMagicElement === 'fire'
              ? 1.35
              : 1.0
            : 1.0;
        const baseDmg = cur.damage * (isHeadshot ? 1.75 : 1.0) * elementDmgMult;
        const finalDmg = Math.round(baseDmg * damageMultiplier);
        this.totalDamage += finalDmg;

        if (this.operator.id === 'maxwell_shodron') {
          if (this.currentMagicElement === 'frost') {
            bot.frozenTimer = Math.max(bot.frozenTimer, 1.4);
          } else if (this.currentMagicElement === 'void' && this.health < 100) {
            this.health = Math.min(100, this.health + 8);
            this.callbacks.onHealthChanged(this.health, this.armor);
          }
        }

        // Apply damage to bot
        this.damageBot(bot, finalDmg, isHeadshot);

        // Hitmarker notification
        soundEngine.playHitmarker(isHeadshot);
        this.callbacks.onHitmarker(isHeadshot, finalDmg);

        // Spawn bullet tracer to hit point
        this.createBulletTracer(tracerStart, intersectionPoint);
        break;
      }
    }

    if (!hitSomething) {
      if (obstacleHitPoint) {
        this.createBulletTracer(tracerStart, obstacleHitPoint);
        this.worldSimulator?.spawnFootstepDust(obstacleHitPoint, 0.9);
      } else {
        // Trace ray out 75m into distance
        const endPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(75));
        this.createBulletTracer(tracerStart, endPoint);
      }
    }

    // Trigger ON_HEAVY_PUNCH_IMPACT environmental physics for punches, Ki blasts, and heavy ballistics
    if (this.worldSimulator) {
      const strikeDir = raycaster.ray.direction.clone().normalize();
      const strikeOrigin = this.playerPos.clone().addScaledVector(strikeDir, 3.2);
      const quadMult = this.quadDamageTimer > 0 ? 1.45 : 1.0;

      if (cur.id === 'saitama_serious') {
        this.worldSimulator.onHeavyPunchThrown(
          strikeOrigin,
          strikeDir.clone().multiplyScalar(125 * quadMult),
          4.8 * quadMult
        );
      } else if (
        cur.id === 'saitama_afterimage' ||
        cur.id === 'goku_dragon_fist' ||
        cur.id === 'goku_spirit_bomb' ||
        cur.id === 'superman_kryptonian_fist' ||
        cur.id === 'maxwell_void_nova' ||
        cur.id === 'maxwell_chronos_orb' ||
        cur.id === 'flash_infinite_mass' ||
        cur.id === 'thor_mjolnir_throw' ||
        cur.id === 'lantern_warhammer' ||
        cur.id === 'shazam_hercules_fist' ||
        cur.id === 'king_hellfire_wave' ||
        cur.id === 'silvester_omega_blade' ||
        cur.id === 'silvester_hyperion_cannon' ||
        cur.id === 'dre_boom_amp' ||
        cur.id === 'truth_oracle_prism' ||
        cur.id === 'heiliea_petal_storm' ||
        cur.id === 'baby_rattle_smash' ||
        cur.id === 'zenitsu_thunderclap' ||
        cur.id === 'tanjiro_hinokami_blade' ||
        cur.id === 'muzan_blood_bramble' ||
        cur.type === 'unibeam' ||
        cur.type === 'hollow_purple' ||
        cur.type === 'venuzdonoa_blade' ||
        cur.type === 'indra_arrow' ||
        cur.type === 'cosmic_fist'
      ) {
        this.worldSimulator.onHeavyPunchThrown(
          strikeOrigin,
          strikeDir.clone().multiplyScalar(98 * quadMult),
          3.9 * quadMult
        );
      } else if (
        cur.id === 'saitama_normal_punch' ||
        cur.id === 'goku_kamehameha' ||
        cur.id === 'superman_heat_vision' ||
        cur.id === 'maxwell_rune_beam' ||
        cur.id === 'king_engine_pulse' ||
        cur.id === 'silvester_cosmic_gauntlet' ||
        cur.id === 'dre_sonic_cannon' ||
        cur.id === 'truth_veritas_ray' ||
        cur.id === 'heiliea_starlight_lance' ||
        cur.id === 'baby_bottle_blaster' ||
        cur.id === 'zenitsu_nichirin_blade' ||
        cur.id === 'tanjiro_water_blade' ||
        cur.id === 'muzan_spine_whip' ||
        cur.type === 'repulsor_beam' ||
        cur.type === 'haki_fist' ||
        cur.type === 'rasengan_orb' ||
        cur.type === 'chidori_blade' ||
        cur.type === 'megiddo_ray'
      ) {
        this.worldSimulator.onHeavyPunchThrown(
          strikeOrigin,
          strikeDir.clone().multiplyScalar(78 * quadMult),
          3.0 * quadMult
        );
      } else if (cur.id === 'saitama_consecutive') {
        if (this.shotsFired % 2 === 1) {
          this.worldSimulator.onHeavyPunchThrown(
            strikeOrigin,
            strikeDir.clone().multiplyScalar(52 * quadMult),
            1.8 * quadMult
          );
        }
      } else if (cur.type === 'sniper' || cur.type === 'shotgun') {
        this.worldSimulator.onHeavyPunchThrown(
          strikeOrigin,
          strikeDir.clone().multiplyScalar(42 * quadMult),
          1.3
        );
      }
    }

    // Auto-reload on empty
    if (cur.currentAmmo === 0) {
      this.reload();
    }
  }

  private createBulletTracer(origin: THREE.Vector3, target: THREE.Vector3) {
    const dir = target.clone().sub(origin).normalize();
    const dist = origin.distanceTo(target);
    const cur = this.getCurrentWeapon();

    let projectileObj: THREE.Object3D;

    if (cur.type === 'fist') {
      // Atmospheric pressure kinetic shockwave ring
      const ringGeo = new THREE.RingGeometry(0.25, 0.65, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : cur.colorScheme.glow || '#f59e0b',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'ki_blast') {
      // Glowing Ki energy sphere
      const sphereGeo = new THREE.SphereGeometry(0.32, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : cur.colorScheme.glow || '#facc15',
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(origin);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'beam') {
      // Kamehameha continuous radiant beam
      const beamGeo = new THREE.CylinderGeometry(0.25, 0.25, Math.min(dist, 12), 12);
      const beamMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#38bdf8',
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(beamGeo, beamMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'kryptonian_strike') {
      // Gold & Crimson Kryptonian Sonic Shockwave Ring
      const ringGeo = new THREE.RingGeometry(0.35, 0.85, 18);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#ef4444',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'heat_vision') {
      // Twin searing crimson-amber plasma bolts
      const boltGroup = new THREE.Group();
      [-0.08, 0.08].forEach(xOff => {
        const boltGeo = new THREE.CylinderGeometry(0.06, 0.08, Math.min(dist, 9), 8);
        const boltMat = new THREE.MeshBasicMaterial({
          color: this.quadDamageTimer > 0 ? '#c084fc' : '#ef4444',
          transparent: true,
          opacity: 0.95,
        });
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.x = xOff;
        boltGroup.add(bolt);
      });
      boltGroup.position.copy(origin);
      boltGroup.lookAt(target);
      this.scene.add(boltGroup);
      projectileObj = boltGroup;
    } else if (cur.type === 'super_breath') {
      // Sub-zero crystalline frost blast sphere
      const iceGeo = new THREE.OctahedronGeometry(0.45, 0);
      const iceMat = new THREE.MeshBasicMaterial({
        color: '#a5f3fc',
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(iceGeo, iceMat);
      mesh.position.copy(origin);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'energy_ball') {
      // Celestial Spirit Bomb orb
      const orbGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#38bdf8',
      });
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      mesh.position.copy(origin);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'arcane_bolt') {
      // Shimmering elemental crystal bolt
      const elColor =
        this.operator.id === 'maxwell_shodron'
          ? MAXWELL_ELEMENT_PROFILES[this.currentMagicElement].tracerHex
          : '#c084fc';
      const boltGeo = new THREE.OctahedronGeometry(0.28, 0);
      const boltMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#facc15' : elColor,
      });
      const mesh = new THREE.Mesh(boltGeo, boltMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'rune_beam') {
      // Piercing radiant elemental beam
      const elColor =
        this.operator.id === 'maxwell_shodron'
          ? MAXWELL_ELEMENT_PROFILES[this.currentMagicElement].tracerHex
          : '#e879f9';
      const beamGeo = new THREE.CylinderGeometry(0.18, 0.22, Math.min(dist, 12), 10);
      const beamMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#facc15' : elColor,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(beamGeo, beamMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'chronos_orb') {
      // Elemental temporal stasis orb
      const elColor =
        this.operator.id === 'maxwell_shodron'
          ? MAXWELL_ELEMENT_PROFILES[this.currentMagicElement].tracerHex
          : '#67e8f9';
      const orbGeo = new THREE.IcosahedronGeometry(0.46, 0);
      const orbMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#facc15' : elColor,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      mesh.position.copy(origin);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'void_nova') {
      // Expanding elemental cataclysmic sigil ring
      const elColor =
        this.operator.id === 'maxwell_shodron'
          ? MAXWELL_ELEMENT_PROFILES[this.currentMagicElement].tracerHex
          : '#f43f5e';
      const ringGeo = new THREE.TorusGeometry(0.55, 0.12, 8, 18);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#facc15' : elColor,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'king_engine') {
      // Intimidating golden-crimson King Engine acoustic ring
      const ringGeo = new THREE.TorusGeometry(0.5, 0.1, 8, 18);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#f59e0b',
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'king_wave') {
      // Hellfire Wave-Motion Cannon beam
      const beamGeo = new THREE.CylinderGeometry(0.35, 0.42, Math.min(dist, 13), 12);
      const beamMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#ef4444',
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(beamGeo, beamMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'speed_lightning' || cur.type === 'lightning_arc') {
      // High-velocity golden / sky-blue lightning bolt
      const boltColor =
        this.operator.id === 'thor_odinson'
          ? '#38bdf8'
          : this.operator.id === 'shazam_champion'
          ? '#fef08a'
          : '#facc15';
      const boltGeo = new THREE.CylinderGeometry(0.08, 0.1, Math.min(dist, 9), 8);
      const boltMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : boltColor,
        transparent: true,
        opacity: 0.96,
      });
      const mesh = new THREE.Mesh(boltGeo, boltMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'speed_punch') {
      // Infinite Mass kinetic shock ring
      const ringGeo = new THREE.RingGeometry(0.38, 0.92, 18);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#fbbf24',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'lantern_beam') {
      // Emerald Oan Willpower hard-light beam
      const beamGeo = new THREE.CylinderGeometry(0.14, 0.18, Math.min(dist, 10), 10);
      const beamMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#22c55e',
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(beamGeo, beamMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'lantern_hammer') {
      // Projected Emerald Construct Warhammer Head
      const hammerGeo = new THREE.BoxGeometry(0.62, 0.42, 0.86);
      const hammerMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#4ade80',
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(hammerGeo, hammerMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'mjolnir_strike') {
      // Spinning Uru hammer-charged thunderhead projectile
      const uruGeo = new THREE.BoxGeometry(0.55, 0.36, 0.72);
      const uruMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#7dd3fc',
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(uruGeo, uruMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'silvester_gauntlet') {
      const boltGeo = new THREE.OctahedronGeometry(0.32, 0);
      const boltMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#fde047' : '#38bdf8',
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(boltGeo, boltMat);
      mesh.position.copy(origin);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'silvester_blade') {
      const arcGeo = new THREE.TorusGeometry(0.58, 0.1, 8, 18, Math.PI);
      const arcMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#fde047' : '#c084fc',
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(arcGeo, arcMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'silvester_cannon') {
      const beamGeo = new THREE.CylinderGeometry(0.26, 0.34, Math.min(dist, 12), 12);
      const beamMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#fde047' : '#fbbf24',
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(beamGeo, beamMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'sonic_bass' || cur.type === 'sonic_boom') {
      const ringGeo = new THREE.TorusGeometry(cur.type === 'sonic_boom' ? 0.65 : 0.42, 0.1, 8, 18);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#fde047' : cur.type === 'sonic_boom' ? '#fbbf24' : '#f97316',
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'truth_ray' || cur.type === 'truth_prism') {
      if (cur.type === 'truth_ray') {
        const beamGeo = new THREE.CylinderGeometry(0.16, 0.2, Math.min(dist, 12), 10);
        const beamMat = new THREE.MeshBasicMaterial({
          color: this.quadDamageTimer > 0 ? '#38bdf8' : '#fef08a',
          transparent: true,
          opacity: 0.95,
        });
        const mesh = new THREE.Mesh(beamGeo, beamMat);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.copy(origin);
        mesh.lookAt(target);
        this.scene.add(mesh);
        projectileObj = mesh;
      } else {
        const prismGeo = new THREE.OctahedronGeometry(0.45, 0);
        const prismMat = new THREE.MeshBasicMaterial({
          color: this.quadDamageTimer > 0 ? '#38bdf8' : '#fbbf24',
          transparent: true,
          opacity: 0.94,
        });
        const mesh = new THREE.Mesh(prismGeo, prismMat);
        mesh.position.copy(origin);
        mesh.lookAt(target);
        this.scene.add(mesh);
        projectileObj = mesh;
      }
    } else if (cur.type === 'star_lance' || cur.type === 'petal_storm') {
      const lanceGeo = new THREE.CylinderGeometry(0.1, 0.22, Math.min(dist, 9), 8);
      const lanceMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#fde047' : cur.type === 'petal_storm' ? '#fbcfe8' : '#f472b6',
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(lanceGeo, lanceMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'bottle_blaster' || cur.type === 'tantrum_smash') {
      const orbGeo =
        cur.type === 'tantrum_smash'
          ? new THREE.TorusGeometry(0.55, 0.12, 8, 16)
          : new THREE.SphereGeometry(0.3, 12, 10);
      const orbMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#f472b6' : cur.type === 'tantrum_smash' ? '#fde047' : '#38bdf8',
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'nichirin_thunder' || cur.type === 'thunder_flash') {
      const flashGeo = new THREE.CylinderGeometry(0.08, 0.14, Math.min(dist, 10), 8);
      const flashMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#38bdf8' : cur.type === 'thunder_flash' ? '#fde047' : '#facc15',
        transparent: true,
        opacity: 0.96,
      });
      const mesh = new THREE.Mesh(flashGeo, flashMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'water_slash' || cur.type === 'sun_flame') {
      const arcGeo = new THREE.TorusGeometry(0.52, 0.1, 8, 16, Math.PI * 1.1);
      const arcMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#fde047' : cur.type === 'sun_flame' ? '#ef4444' : '#38bdf8',
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(arcGeo, arcMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (cur.type === 'demon_whip' || cur.type === 'blood_thorn') {
      const whipGeo = new THREE.TorusGeometry(0.56, 0.09, 8, 16, Math.PI * 1.2);
      const whipMat = new THREE.MeshBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : cur.type === 'blood_thorn' ? '#be123c' : '#f43f5e',
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(whipGeo, whipMat);
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (
      cur.type === 'repulsor_beam' ||
      cur.type === 'unibeam' ||
      cur.type === 'megiddo_ray' ||
      cur.type === 'chidori_blade' ||
      cur.type === 'indra_arrow'
    ) {
      const col =
        this.quadDamageTimer > 0
          ? '#fde047'
          : cur.type === 'unibeam'
          ? '#38bdf8'
          : cur.type === 'indra_arrow'
          ? '#a855f7'
          : cur.colorScheme.glow || '#38bdf8';
      const cylGeo = new THREE.CylinderGeometry(cur.type === 'unibeam' ? 0.24 : 0.1, 0.14, Math.min(dist, 12), 10);
      const mesh = new THREE.Mesh(cylGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.94 }));
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (
      cur.type === 'rasengan_orb' ||
      cur.type === 'limitless_blue' ||
      cur.type === 'hollow_purple' ||
      cur.type === 'jio_graze' ||
      cur.type === 'chaos_hex' ||
      cur.type === 'chaos_rift' ||
      cur.type === 'eldritch_bolt' ||
      cur.type === 'trident_bolt'
    ) {
      const orbGeo = new THREE.SphereGeometry(cur.type === 'hollow_purple' || cur.type === 'chaos_rift' ? 0.56 : 0.34, 14, 12);
      const mesh = new THREE.Mesh(
        orbGeo,
        new THREE.MeshBasicMaterial({ color: this.quadDamageTimer > 0 ? '#fde047' : cur.colorScheme.glow, transparent: true, opacity: 0.94 })
      );
      mesh.position.copy(origin);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else if (
      cur.type === 'web_shooter' ||
      cur.type === 'web_gauntlet' ||
      cur.type === 'eldritch_whip' ||
      cur.type === 'batarang' ||
      cur.type === 'bat_gauntlet' ||
      cur.type === 'amazon_sword' ||
      cur.type === 'lasso_truth' ||
      cur.type === 'hydro_lance' ||
      cur.type === 'tempest_katana' ||
      cur.type === 'monarch_daggers' ||
      cur.type === 'kamish_wrath' ||
      cur.type === 'shinobi_kunai' ||
      cur.type === 'gum_pistol' ||
      cur.type === 'haki_fist' ||
      cur.type === 'divergent_fist' ||
      cur.type === 'blood_pierce' ||
      cur.type === 'water_stream_fist' ||
      cur.type === 'cosmic_fist' ||
      cur.type === 'venuzdonoa_blade' ||
      cur.type === 'uchiha_kunai' ||
      cur.type === 'totsuka_blade'
    ) {
      const ringGeo = new THREE.TorusGeometry(0.45, 0.09, 8, 16);
      const mesh = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: this.quadDamageTimer > 0 ? '#fde047' : cur.colorScheme.glow, transparent: true, opacity: 0.94 })
      );
      mesh.position.copy(origin);
      mesh.lookAt(target);
      this.scene.add(mesh);
      projectileObj = mesh;
    } else {
      // Tactical bullet tracer line
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1.8)
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: this.quadDamageTimer > 0 ? '#c084fc' : '#fef08a',
        linewidth: 2,
      });
      const line = new THREE.Line(geo, mat);
      line.position.copy(origin);
      line.lookAt(target);
      this.scene.add(line);
      projectileObj = line;
    }

    this.bulletTracers.push({
      line: projectileObj,
      origin: origin.clone(),
      direction: dir,
      distance: dist,
      progress: 0,
    });
  }

  private damageBot(bot: typeof this.bots[0], damage: number, isHeadshot: boolean) {
    if (bot.armor > 0) {
      const armorAbsorb = Math.min(bot.armor, Math.floor(damage * 0.6));
      bot.armor -= armorAbsorb;
      bot.health -= (damage - armorAbsorb);
    } else {
      bot.health -= damage;
    }

    // Bot hit reaction: turn toward player
    bot.state = 'hunt';
    bot.target = this.playerPos.clone();

    if (bot.health <= 0) {
      // Bot Killed!
      bot.isAlive = false;
      bot.deaths += 1;
      bot.respawnTimer = 4.0;
      bot.mesh.visible = false;

      this.kills += 1;
      this.streak += 1;
      if (this.streak > this.highestStreak) {
        this.highestStreak = this.streak;
      }

      const killEntry: KillFeedEntry = {
        id: `kill_${Date.now()}_${++this.killIdCounter}`,
        killerName: this.operatorName,
        killerIsPlayer: true,
        victimName: bot.name,
        victimIsPlayer: false,
        weaponName: this.getCurrentWeapon().name,
        isHeadshot,
        timestamp: Date.now(),
      };
      this.callbacks.onKillFeed(killEntry);
      this.updateScoresList();

      // Announcer streak check
      if (this.streak === 2) soundEngine.playAnnouncer('double_kill');
      else if (this.streak === 3) soundEngine.playAnnouncer('triple_kill');
      else if (this.streak >= 5) soundEngine.playAnnouncer('rampage');

      // Check win condition
      if (this.kills >= this.killGoal) {
        this.isMatchRunning = false;
        soundEngine.playAnnouncer('victory');
        this.callbacks.onMatchOver(this.operatorName, true);
        const stats = this.buildEndOfMatchStats(true);
        this.callbacks.onMatchOverWithStats?.(stats);
      }
    }
  }

  public damagePlayer(damage: number, attackerName: string, weaponName: string = 'M4-Vanguard') {
    if (this.health <= 0) return;

    // Superman Invulnerability / Stagger Resistance (Poise) mechanic:
    // Standard enemy hits deal 0 HP damage while Poise holds, absorbing solar charge!
    if (this.operator.id === 'superman') {
      if (!this.isStaggered && this.staggerResistance > 0) {
        this.staggerDelayTimer = 2.0;
        const poiseCost = Math.max(8, Math.round(damage * 0.55));
        this.staggerResistance = Math.max(0, this.staggerResistance - poiseCost);
        this.kiEnergy = Math.min(100, this.kiEnergy + 6);
        this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
        soundEngine.playStaggerDeflect();

        if (this.staggerResistance <= 0) {
          this.isStaggered = true;
          this.staggerRecoverTimer = 3.0;
          this.screenShake = Math.max(this.screenShake, 0.75);
          this.callbacks.onPowerUpActive('POISE BROKEN — STAGGERED!', 3.0);
        }
        this.callbacks.onStaggerChanged?.(Math.round(this.staggerResistance), this.isStaggered);
        return;
      }
    }

    // Silvester A.Jais Sovereign Armor passively mitigates 45% of incoming damage
    if (this.operator.id === 'silvester_jais') {
      damage = Math.max(1, Math.round(damage * 0.55));
    } else if (this.operator.id === 'satoru_gojo' || this.operator.id === 'anos_voldigoad') {
      // Gojo Limitless Infinity & Anos Demon King Tyrant barrier mitigate 35% of incoming damage
      damage = Math.max(1, Math.round(damage * 0.65));
    } else if (this.operator.id === 'iron_man' || this.operator.id === 'monkey_d_luffy' || this.operator.id === 'garou_opm') {
      damage = Math.max(1, Math.round(damage * 0.78));
    }

    soundEngine.playDamageTaken();

    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, Math.floor(damage * 0.65));
      this.armor -= absorbed;
      this.health -= (damage - absorbed);
    } else {
      this.health -= damage;
    }

    this.callbacks.onHealthChanged(Math.max(0, this.health), Math.max(0, this.armor));

    // Player Death
    if (this.health <= 0) {
      this.deaths += 1;
      this.streak = 0;
      this.playerBurnTimer = 0;
      this.playerWaterSlowTimer = 0;

      if (this.isThermalOverload) {
        this.stopThermalOverload();
      }

      const killEntry: KillFeedEntry = {
        id: `kill_${Date.now()}_${++this.killIdCounter}`,
        killerName: attackerName,
        killerIsPlayer: false,
        victimName: this.operatorName,
        victimIsPlayer: true,
        weaponName,
        isHeadshot: false,
        timestamp: Date.now(),
      };
      this.callbacks.onKillFeed(killEntry);
      this.updateScoresList();

      // Respawn after 3 seconds
      setTimeout(() => {
        this.respawnPlayer();
      }, 3000);
    }
  }

  private respawnPlayer() {
    this.health = 100;
    this.armor = 50;
    this.staggerResistance = 100;
    this.isStaggered = false;
    this.playerBurnTimer = 0;
    this.playerWaterSlowTimer = 0;
    this.callbacks.onStaggerChanged?.(100, false);
    const spawnIdx = Math.floor(Math.random() * (this.builtMap?.spawnPoints.length || 1));
    const spawn = this.builtMap?.spawnPoints[spawnIdx] || new THREE.Vector3(0, 0, 0);
    const spawnTerrainY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(spawn.x, spawn.z) : 0;
    const spawnFeetY = Math.max(spawn.y, spawnTerrainY);
    this.playerPos.set(spawn.x, spawnFeetY + this.getEyeHeightOffset(), spawn.z);
    this.playerVelocity.set(0, 0, 0);
    this.resolvePlayerCollision(spawnFeetY, null);
    this.callbacks.onHealthChanged(this.health, this.armor);
  }

  private updateScoresList() {
    const list: CombatantScore[] = [
      {
        id: 'player',
        name: this.operatorName,
        isPlayer: true,
        team: 'blue',
        kills: this.kills,
        deaths: this.deaths,
        score: this.kills * 100,
        ping: 24,
      },
      ...this.bots.map(b => ({
        id: b.id,
        name: b.name,
        isPlayer: false,
        team: b.team,
        kills: b.kills,
        deaths: b.deaths,
        score: b.kills * 100,
        ping: Math.floor(Math.random() * 20 + 25),
      }))
    ];

    list.sort((a, b) => b.score - a.score);
    this.callbacks.onScoresUpdated(list);
  }

  private afterDraw(cb: () => void) {
    if (this.isDisposed) return;
    if (!this.isSoftwareGl) {
      this.animFrameId = requestAnimationFrame(cb);
      return;
    }
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
      this.swFrameTimeout = window.setTimeout(cb, 80);
      return;
    }
    const poll = () => {
      if (this.isDisposed) {
        gl.deleteSync(sync);
        return;
      }
      const status = gl.clientWaitSync(sync, gl.SYNC_FLUSH_COMMANDS_BIT, 0);
      if (status === gl.TIMEOUT_EXPIRED) {
        this.swFrameTimeout = window.setTimeout(poll, 4);
      } else {
        gl.deleteSync(sync);
        this.swFrameTimeout = window.setTimeout(cb, 80);
      }
    };
    this.swFrameTimeout = window.setTimeout(poll, 4);
  }

  // Main 60fps Loop
  private tick() {
    if (!this.container || this.isDisposed) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.isMatchRunning) {
      this.updatePlayerMovement(delta);
      this.updateWeaponAnimation(delta);
      this.updateCapeClothPhysics(delta);
      this.updateDashTrails(delta);
      if (this.isThermalOverload) {
        this.updateThermalOverload(delta);
      }
      this.updatePowerUps(delta);
      this.updateBots(delta);
      this.updateBulletTracers(delta);
      this.updateWitchSpells(delta);
      this.worldSimulator?.update(delta, this.playerPos);

      // Witch Elemental Burn DoT & Water Slow timers (resisted by Fire/Frost Maxwell)
      if (this.operator.id === 'maxwell_shodron') {
        if (this.currentMagicElement === 'fire') this.playerBurnTimer = 0;
        if (this.currentMagicElement === 'frost') {
          this.playerWaterSlowTimer = 0;
          if (this.armor < 100 && this.health > 0) {
            this.armor = Math.min(100, this.armor + delta * 4.5);
            this.frostArmorAccum += delta;
            if (this.frostArmorAccum >= 0.25) {
              this.frostArmorAccum = 0;
              this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
            }
          }
        }
      }
      if (this.playerWaterSlowTimer > 0) {
        this.playerWaterSlowTimer = Math.max(0, this.playerWaterSlowTimer - delta);
      }
      if (this.playerBurnTimer > 0 && this.health > 0) {
        this.playerBurnTimer = Math.max(0, this.playerBurnTimer - delta);
        this.burnTickAccum += delta;
        if (this.burnTickAccum >= 0.7) {
          this.burnTickAccum = 0;
          this.damagePlayer(5, this.playerBurnAttacker, 'Fire Magic (Burn)');
        }
      }

      // Firing continuously if automatic weapon (disabled while Thermal Overload beams active)
      if (!this.isThermalOverload) {
        if (this.isFiring && this.getCurrentWeapon().isAutomatic) {
          this.shoot();
        } else if (this.isFiring && !this.getCurrentWeapon().isAutomatic && this.clock.getElapsedTime() - this.lastFireTime > 0.3) {
          this.shoot();
        }
      }

      // Check reload completion
      if (this.isReloading && this.clock.getElapsedTime() >= this.reloadEndTime) {
        const cur = this.getCurrentWeapon();
        const needed = cur.magSize - cur.currentAmmo;
        const toTake = Math.min(needed, cur.reserveAmmo);
        cur.currentAmmo += toTake;
        cur.reserveAmmo -= toTake;
        this.isReloading = false;
        this.callbacks.onAmmoChanged(cur.currentAmmo, cur.reserveAmmo);
      }

      // Ki / Yellow Sun / Aether Mana charging & Superman Poise recovery
      if (this.isKiCharging) {
        this.kiEnergy = Math.min(100, this.kiEnergy + delta * 45);
        this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
      } else if (this.operator.id === 'superman' && !this.isThermalOverload && this.kiEnergy < 100) {
        // Passive Yellow Sun radiation charge
        this.kiEnergy = Math.min(100, this.kiEnergy + delta * 5.0);
        this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
      } else if (this.operator.id === 'maxwell_shodron' && this.kiEnergy < 100) {
        // Passive Aether Mana regeneration (accelerated in Lightning & Arcane forms)
        const regenRate =
          this.currentMagicElement === 'lightning'
            ? 13.0
            : this.currentMagicElement === 'arcane'
            ? 11.0
            : 7.5;
        this.kiEnergy = Math.min(100, this.kiEnergy + delta * regenRate);
        this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
      } else if (
        (this.operator.id === 'king_opm' ||
          this.operator.id === 'the_flash' ||
          this.operator.id === 'green_lantern' ||
          this.operator.id === 'shazam_champion' ||
          this.operator.id === 'thor_odinson' ||
          this.operator.id === 'silvester_jais' ||
          this.operator.id === 'dre_titan' ||
          this.operator.id === 'the_truth' ||
          this.operator.id === 'heiliea_valkyrie' ||
          this.operator.id === 'the_baby' ||
          this.operator.id === 'zenitsu_agatsuma' ||
          this.operator.id === 'tanjiro_kamado' ||
          this.operator.id === 'muzan_kibutsuji' ||
          this.operator.id === 'anos_voldigoad' ||
          this.operator.id === 'satoru_gojo' ||
          this.operator.id === 'rimuru_tempest' ||
          this.operator.id === 'sung_jinwoo' ||
          this.operator.id === 'naruto_uzumaki') &&
        this.kiEnergy < 100
      ) {
        const heroRegen =
          this.operator.id === 'silvester_jais' || this.operator.id === 'anos_voldigoad'
            ? 18.0
            : this.operator.id === 'satoru_gojo' || this.operator.id === 'rimuru_tempest'
            ? 15.0
            : this.operator.id === 'the_truth' || this.operator.id === 'sung_jinwoo' || this.operator.id === 'naruto_uzumaki'
            ? 13.0
            : 11.5;
        this.kiEnergy = Math.min(100, this.kiEnergy + delta * heroRegen);
        this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
      } else if (this.kiEnergy < 100 && !this.operator.id.startsWith('vanguard') && !this.operator.id.startsWith('spectre') && !this.operator.id.startsWith('reaper')) {
        this.kiEnergy = Math.min(100, this.kiEnergy + delta * 12.0);
        this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
      }

      // Passive Cellular / Spirit / Demon Regeneration (Muzan, Rimuru, Naruto, Anos, Itachi)
      if (
        (this.operator.id === 'muzan_kibutsuji' ||
          this.operator.id === 'rimuru_tempest' ||
          this.operator.id === 'naruto_uzumaki' ||
          this.operator.id === 'anos_voldigoad' ||
          this.operator.id === 'itachi_uchiha') &&
        this.health > 0 &&
        this.health < 100
      ) {
        const prevFloor = Math.floor(this.health);
        this.health = Math.min(100, this.health + delta * 2.8);
        if (Math.floor(this.health) !== prevFloor || this.health >= 100) {
          this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
        }
      }

      if (this.operator.id === 'superman') {
        if (this.isStaggered) {
          this.staggerRecoverTimer -= delta;
          if (this.staggerRecoverTimer <= 0) {
            this.isStaggered = false;
            this.staggerResistance = 65;
            this.callbacks.onStaggerChanged?.(65, false);
          }
        } else if (this.staggerResistance < 100) {
          if (this.staggerDelayTimer > 0) {
            this.staggerDelayTimer -= delta;
          } else {
            this.staggerResistance = Math.min(100, this.staggerResistance + delta * 14);
            this.callbacks.onStaggerChanged?.(Math.round(this.staggerResistance), false);
          }
        }
      }

      // Match timer countdown
      this.matchTimer -= delta;
      if (this.matchTimer <= 0) {
        this.isMatchRunning = false;
        if (this.isThermalOverload) this.stopThermalOverload();
        const isPlayerWin = this.kills >= 10;
        this.callbacks.onMatchOver(isPlayerWin ? this.operatorName : 'Hostile Team', isPlayerWin);
        const stats = this.buildEndOfMatchStats(isPlayerWin);
        this.callbacks.onMatchOverWithStats?.(stats);
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.afterDraw(this.tick);
  }

  private updatePlayerMovement(delta: number) {
    // 1. Process Look Angles with Sensitivity (supports drag delta + continuous orbit lookInput)
    const sens = this.settings.touchSensitivity * (this.isADS ? 0.45 : 1.0);
    this.playerYaw -= (this.lookDelta.x * 0.003 + this.lookInput.x * delta * 2.4) * sens;
    this.playerPitch -=
      (this.lookDelta.y * 0.003 + this.lookInput.y * delta * 1.8) *
      sens *
      (this.settings.invertY ? -1 : 1);
    this.playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.playerPitch));

    // Reset look delta
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;

    // Smooth Recoil Recovery & Environmental Camera Shake
    this.recoilPitch = THREE.MathUtils.damp(this.recoilPitch, 0, 15, delta);
    this.recoilYaw = THREE.MathUtils.damp(this.recoilYaw, 0, 15, delta);
    this.screenShake = THREE.MathUtils.damp(this.screenShake, 0, 8, delta);
    const simShake = this.worldSimulator ? this.worldSimulator.sampleCameraShake() : { pitchOffset: 0, yawOffset: 0, rollOffset: 0 };
    const localShakePitch = (Math.random() - 0.5) * this.screenShake * 0.025;
    const localShakeYaw = (Math.random() - 0.5) * this.screenShake * 0.025;

    // Update slide / kick / punch timers
    if (this.slideTimer > 0) {
      this.slideTimer = Math.max(0, this.slideTimer - delta);
      this.playerVelocity.x = this.slideDir.x * 13.5 * (0.4 + this.slideTimer);
      this.playerVelocity.z = this.slideDir.z * 13.5 * (0.4 + this.slideTimer);
      if (Math.random() < 0.35) {
        this.worldSimulator?.spawnFootstepDust(this.playerPos, 0.8);
      }
    }
    if (this.kickTimer > 0) {
      this.kickTimer = Math.max(0, this.kickTimer - delta);
    }
    if (this.punchAnimTimer > 0) {
      this.punchAnimTimer = Math.max(0, this.punchAnimTimer - delta);
    }

    // Apply rotation to Camera
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.playerYaw + this.recoilYaw + simShake.yawOffset + localShakeYaw;
    this.camera.rotation.x = this.playerPitch + this.recoilPitch + simShake.pitchOffset + localShakePitch;
    this.camera.rotation.z = simShake.rollOffset + (this.slideTimer > 0 ? 0.04 : 0);

    // 2. Process Movement Vector with GroundLayer FrictionCoefficient (0.85)
    const friction = this.worldSimulator ? this.worldSimulator.getFrictionCoefficient() : 0.85;
    const groundDamping = 10.5 + friction * 4.5;
    const heroSpeedMap: Record<string, number> = {
      the_flash: 1.52,
      silvester_jais: 1.48,
      zenitsu_agatsuma: 1.44,
      the_baby: 1.4,
      garou_opm: 1.4,
      sung_jinwoo: 1.38,
      spider_man: 1.36,
      satoru_gojo: 1.36,
      anos_voldigoad: 1.36,
      sasuke_uchiha: 1.36,
      naruto_uzumaki: 1.35,
      rimuru_tempest: 1.34,
      monkey_d_luffy: 1.34,
      yuji_itadori: 1.34,
      itachi_uchiha: 1.32,
      iron_man: 1.26,
      heiliea_valkyrie: 1.24,
      muzan_kibutsuji: 1.22,
      tanjiro_kamado: 1.2,
      wonder_woman: 1.2,
    };
    const speedMultiplier =
      (this.speedBoostTimer > 0 ? 1.7 : 1.0) *
      (heroSpeedMap[this.operator.id] || 1.0) *
      (this.operator.id === 'maxwell_shodron' && this.currentMagicElement === 'lightning' ? 1.38 : 1.0) *
      (this.isADS ? 0.6 : 1.0) *
      (this.isCrouched ? 0.5 : 1.0) *
      (this.playerWaterSlowTimer > 0 ? 0.68 : 1.0);
    const baseSpeed = 7.0 * speedMultiplier;

    // Move forward/strafe relative to yaw
    const forward = new THREE.Vector3(-Math.sin(this.playerYaw), 0, -Math.cos(this.playerYaw));
    const right = new THREE.Vector3(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw));

    // Flash, Silvester, Zenitsu & high-speed heroes ambient trail orbs
    if (
      (this.operator.id === 'the_flash' ||
        this.operator.id === 'silvester_jais' ||
        this.operator.id === 'zenitsu_agatsuma' ||
        this.operator.id === 'heiliea_valkyrie' ||
        this.operator.id === 'sung_jinwoo' ||
        this.operator.id === 'naruto_uzumaki' ||
        this.operator.id === 'garou_opm' ||
        this.operator.id === 'satoru_gojo') &&
      Math.hypot(this.playerVelocity.x, this.playerVelocity.z) > 8.0 &&
      Math.random() < 0.45
    ) {
      this.spawnDashTrailOrb(
        this.operator.id === 'silvester_jais' || this.operator.id === 'satoru_gojo'
          ? '#38bdf8'
          : this.operator.id === 'heiliea_valkyrie'
          ? '#f472b6'
          : this.operator.id === 'sung_jinwoo' || this.operator.id === 'garou_opm'
          ? '#a855f7'
          : '#facc15'
      );
    }

    // Super-Speed Dash burst
    if (this.superDashTimer > 0) {
      this.superDashTimer = Math.max(0, this.superDashTimer - delta);
      this.playerVelocity.x = this.superDashDir.x * 28.5;
      this.playerVelocity.z = this.superDashDir.z * 28.5;
      if (this.isFlying) {
        this.playerVelocity.y = this.superDashDir.y * 22.0;
      }
      this.spawnDashTrailOrb(
        this.operator.id === 'the_flash' ||
          this.operator.id === 'shazam_champion' ||
          this.operator.id === 'zenitsu_agatsuma'
          ? '#facc15'
          : this.operator.id === 'silvester_jais'
          ? '#38bdf8'
          : this.operator.id === 'heiliea_valkyrie'
          ? '#f472b6'
          : undefined
      );
    } else if (this.isThermalOverload) {
      // Mid-air locked hover during Thermal Overload while sweeping 180+ deg laser beams
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, 12, delta);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, 12, delta);
      this.playerVelocity.y = THREE.MathUtils.damp(this.playerVelocity.y, 0, 12, delta);
    } else if (this.slideTimer <= 0) {
      if (this.isFlying) {
        // Omni-directional Flight with smooth acceleration curves & Sonic Boom transition
        const camForward = new THREE.Vector3();
        this.camera.getWorldDirection(camForward);
        const flightDir = camForward
          .multiplyScalar(this.moveInput.y)
          .add(right.clone().multiplyScalar(this.moveInput.x));
        const flightMaxSpeed = (this.speedBoostTimer > 0 ? 25.0 : 18.5);
        if (flightDir.lengthSq() > 0.01) {
          flightDir.normalize();
          this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, flightDir.x * flightMaxSpeed, 4.2, delta);
          this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, flightDir.z * flightMaxSpeed, 4.2, delta);
          this.playerVelocity.y = THREE.MathUtils.damp(this.playerVelocity.y, flightDir.y * flightMaxSpeed, 4.2, delta);
        } else {
          // Hover glide damp
          this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, 3.8, delta);
          this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, 3.8, delta);
          this.playerVelocity.y = THREE.MathUtils.damp(this.playerVelocity.y, Math.sin(this.clock.getElapsedTime() * 2.5) * 0.25, 4.5, delta);
        }

        const flightSpeed = this.playerVelocity.length();
        const isFastFlight = flightSpeed > 13.5;
        if (isFastFlight && !this.wasFastFlight) {
          soundEngine.playSonicBoom();
          this.spawnSonicBoomRing();
          this.screenShake = Math.max(this.screenShake, 0.45);
        }
        this.wasFastFlight = isFastFlight;
      } else {
        this.wasFastFlight = false;
        const moveDir = forward.multiplyScalar(this.moveInput.y).add(right.multiplyScalar(this.moveInput.x));
        if (moveDir.lengthSq() > 0.01) {
          moveDir.normalize();
          this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, moveDir.x * baseSpeed, 12, delta);
          this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, moveDir.z * baseSpeed, 12, delta);

          // Stride-based footstep sound + granular terrain dust kick-up
          if (this.isGrounded) {
            const horizSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
            this.footstepAccumulator += horizSpeed * delta;
            if (this.footstepAccumulator >= 2.2) {
              this.footstepAccumulator = 0;
              this.footstepSide *= -1;
              soundEngine.playFootstep();
              this.worldSimulator?.spawnFootstepDust(this.playerPos, speedMultiplier);
            }
          }
        } else {
          this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, groundDamping, delta);
          this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, groundDamping, delta);
        }
      }
    }

    // Gravity (disabled during active Flight or Thermal Overload hover)
    if (!this.isFlying && !this.isThermalOverload) {
      this.playerVelocity.y -= 18.0 * delta;
    }

    const eyeHeightOffset = this.getEyeHeightOffset();
    const prevFeetY = this.playerPos.y - eyeHeightOffset;

    // Proposed feet position
    const nextFeetPos = new THREE.Vector3(
      this.playerPos.x + this.playerVelocity.x * delta,
      prevFeetY + this.playerVelocity.y * delta,
      this.playerPos.z + this.playerVelocity.z * delta
    );
    if (this.isFlying) {
      nextFeetPos.y = Math.min(28 - eyeHeightOffset, nextFeetPos.y);
    }

    // Separate player horizontally from living bots/Witches so characters cannot walk straight through each other
    const playerRadius = 0.48;
    const botRadius = 0.45;
    const minEntityDist = playerRadius + botRadius;
    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      if (!bot.isAlive) continue;
      if (Math.abs(nextFeetPos.y - bot.pos.y) > 1.75) continue;
      const dx = nextFeetPos.x - bot.pos.x;
      const dz = nextFeetPos.z - bot.pos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < minEntityDist * minEntityDist) {
        const dist = Math.sqrt(distSq);
        const nx = dist > 1e-4 ? dx / dist : 1;
        const nz = dist > 1e-4 ? dz / dist : 0;
        const push = (minEntityDist - dist) * 0.65;
        nextFeetPos.x += nx * push;
        nextFeetPos.z += nz * push;
        bot.pos.x -= nx * (minEntityDist - dist) * 0.35;
        bot.pos.z -= nz * (minEntityDist - dist) * 0.35;
      }
    }

    // Full narrowphase 3D collision resolution (walls, buildings, waist-high barriers, cylinders, trees, walkable ramps, craters)
    const charHeight = eyeHeightOffset + 0.16;
    const collisionRes = resolveCharacterCollision(
      nextFeetPos,
      prevFeetY,
      playerRadius,
      charHeight,
      this.playerVelocity,
      this.getCollisionContext(),
      { isFlying: this.isFlying }
    );

    if (collisionRes.isGrounded) {
      if (!this.wasGrounded && this.playerVelocity.y <= -2.5) {
        this.worldSimulator?.spawnFootstepDust(nextFeetPos, 1.8);
        soundEngine.playFootstep();
      }
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
    this.wasGrounded = this.isGrounded;

    this.playerPos.set(nextFeetPos.x, collisionRes.feetY + eyeHeightOffset, nextFeetPos.z);
    this.updateThirdPersonCamera(delta);
  }

  private getEyeHeightOffset(): number {
    return this.slideTimer > 0 ? 0.95 : this.isCrouched ? 1.1 : 1.7;
  }

  private getCollisionContext(): CollisionQueryContext {
    this.snappedFloraIds.clear();
    if (this.builtMap) {
      for (let i = 0; i < this.builtMap.flora.length; i++) {
        if (this.builtMap.flora[i].isSnapped) {
          this.snappedFloraIds.add(this.builtMap.flora[i].id);
        }
      }
    }
    return {
      obstacles: this.builtMap?.obstacles ?? [],
      mapSize: this.activeMap.mapSize,
      getTerrainHeight: (x: number, z: number) =>
        this.worldSimulator ? this.worldSimulator.getGroundHeightAt(x, z) : 0,
      snappedFloraIds: this.snappedFloraIds,
    };
  }

  private resolvePlayerCollision(prevFeetY: number, vel: THREE.Vector3 | null = this.playerVelocity): boolean {
    const eyeHeightOffset = this.getEyeHeightOffset();
    const feetPos = new THREE.Vector3(this.playerPos.x, this.playerPos.y - eyeHeightOffset, this.playerPos.z);
    const res = resolveCharacterCollision(
      feetPos,
      prevFeetY,
      0.48,
      eyeHeightOffset + 0.16,
      vel,
      this.getCollisionContext(),
      { isFlying: this.isFlying }
    );
    this.playerPos.set(feetPos.x, res.feetY + eyeHeightOffset, feetPos.z);
    return res.isGrounded;
  }

  /**
   * Moves the player across high-speed dashes, blinks, and teleports using swept collision substeps
   * so abilities never clip inside buildings, perimeter walls, trees, or waist-high cover.
   */
  private movePlayerBySweptStep(dir: THREE.Vector3, distance: number) {
    const stepDir = dir.clone();
    if (!this.isFlying) {
      stepDir.y *= 0.28;
    }
    if (stepDir.lengthSq() > 1e-6) {
      stepDir.normalize();
    } else {
      stepDir.set(0, 0, -1);
    }

    const steps = Math.max(1, Math.ceil(Math.abs(distance) / 0.85));
    const stepLen = distance / steps;
    const eyeHeightOffset = this.getEyeHeightOffset();
    const feetPos = new THREE.Vector3(this.playerPos.x, this.playerPos.y - eyeHeightOffset, this.playerPos.z);
    const ctx = this.getCollisionContext();

    for (let s = 0; s < steps; s++) {
      const prevFeetY = feetPos.y;
      feetPos.addScaledVector(stepDir, stepLen);
      if (this.isFlying) {
        feetPos.y = Math.min(28 - eyeHeightOffset, feetPos.y);
      }
      const res = resolveCharacterCollision(
        feetPos,
        prevFeetY,
        0.48,
        eyeHeightOffset + 0.16,
        null,
        ctx,
        { isFlying: this.isFlying, stepHeight: 0.55 }
      );
      feetPos.y = res.feetY;
      // Stop sweeping forward if dash slammed squarely into a solid obstacle/wall
      if (res.hitWall) {
        break;
      }
    }

    // Also separate cleanly from any bot standing at the arrival spot
    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      if (!bot.isAlive) continue;
      if (Math.abs(feetPos.y - bot.pos.y) > 1.75) continue;
      const dx = feetPos.x - bot.pos.x;
      const dz = feetPos.z - bot.pos.z;
      const distSq = dx * dx + dz * dz;
      const minD = 0.93;
      if (distSq < minD * minD) {
        const dist = Math.sqrt(distSq);
        const nx = dist > 1e-4 ? dx / dist : 1;
        const nz = dist > 1e-4 ? dz / dist : 0;
        feetPos.x += nx * (minD - dist);
        feetPos.z += nz * (minD - dist);
      }
    }
    resolveCharacterCollision(
      feetPos,
      feetPos.y,
      0.48,
      eyeHeightOffset + 0.16,
      null,
      ctx,
      { isFlying: this.isFlying }
    );

    this.playerPos.set(feetPos.x, feetPos.y + eyeHeightOffset, feetPos.z);
  }

  private updateThirdPersonCamera(delta: number) {
    const groundY = this.worldSimulator
      ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z)
      : 0;
    const horizSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
    const isMoving = horizSpeed > 0.6;
    const elapsed = this.clock.getElapsedTime();

    // Update 3D player character mesh position & action animations
    if (this.playerMesh) {
      const halo = this.playerMesh.userData?.arcaneHalo as THREE.Object3D | undefined;
      if (halo) {
        halo.rotation.z += delta * (this.currentMagicElement === 'lightning' ? 2.4 : 1.1);
      }
      const orbitGroup = this.playerMesh.userData?.elementalOrbitGroup as THREE.Object3D | undefined;
      if (orbitGroup) {
        orbitGroup.rotation.y += delta * (this.currentMagicElement === 'lightning' ? 3.2 : 1.45);
      }

      const feetY = Math.max(groundY, this.playerPos.y - (this.slideTimer > 0 ? 0.95 : this.isCrouched ? 1.1 : 1.7));
      const walkBob = isMoving && this.isGrounded && this.slideTimer <= 0 && !this.isFlying ? Math.abs(Math.sin(elapsed * 11)) * 0.06 : 0;
      const hoverBob = (this.isFlying || this.isThermalOverload) && !this.isGrounded ? Math.sin(elapsed * 2.8) * 0.08 : 0;

      this.playerMesh.position.set(this.playerPos.x, feetY + walkBob + hoverBob, this.playerPos.z);

      // Smoothly turn character toward 360 movement direction (front/back/left/right) when walking freely,
      // and snap cleanly toward camera aim yaw when attacking, aiming, or unleashing Thermal Overload
      const isAttackingOrAiming =
        this.isFiring ||
        this.isADS ||
        this.punchAnimTimer > 0 ||
        this.kickTimer > 0 ||
        this.isThermalOverload;
      let targetFacingYaw = this.playerYaw;
      if (!isAttackingOrAiming && isMoving) {
        targetFacingYaw = Math.atan2(-this.playerVelocity.x, -this.playerVelocity.z);
      }
      // Shortest angular interpolation
      let angleDiff = targetFacingYaw - this.meshFacingYaw;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.meshFacingYaw += angleDiff * Math.min(1, delta * (isAttackingOrAiming ? 22 : 12));

      // Base rotation faces away from camera along character facing angle
      let yawOffset = Math.PI;
      let pitchLean = 0;
      let rollLean = 0;

      if (this.slideTimer > 0) {
        pitchLean = 0.55; // low slide lean back
        this.playerMesh.position.y -= 0.25;
      } else if (this.isThermalOverload) {
        // Hover poised mid-air aiming laser eyes
        pitchLean = -0.14;
      } else if (this.isFlying && !this.isGrounded) {
        // Superman flight angle scales smoothly with horizontal flight speed
        pitchLean = -Math.min(0.95, horizSpeed / 18.0) - 0.1;
      } else if (this.kickTimer > 0) {
        const p = 1 - this.kickTimer / 0.38;
        yawOffset += Math.sin(p * Math.PI) * 1.45;
        pitchLean = -0.32 * Math.sin(p * Math.PI);
        rollLean = 0.28 * Math.sin(p * Math.PI);
      } else if (this.punchAnimTimer > 0) {
        const p = 1 - this.punchAnimTimer / 0.22;
        pitchLean = -0.25 * Math.sin(p * Math.PI);
        yawOffset -= 0.38 * Math.sin(p * Math.PI);
      } else if (isMoving) {
        pitchLean = -0.06;
      }

      this.playerMesh.rotation.set(pitchLean, this.meshFacingYaw + yawOffset, rollLean);

      // Articulated realistic limb stride, combat punch/kick, and natural breathing motion
      const leftLeg = this.playerMesh.userData?.leftLegGroup as THREE.Object3D | undefined;
      const rightLeg = this.playerMesh.userData?.rightLegGroup as THREE.Object3D | undefined;
      const leftArm = this.playerMesh.userData?.leftArmGroup as THREE.Object3D | undefined;
      const rightArm = this.playerMesh.userData?.rightArmGroup as THREE.Object3D | undefined;
      if (leftLeg && rightLeg && leftArm && rightArm) {
        const strideAmp = isMoving && this.isGrounded && this.slideTimer <= 0 && !this.isFlying ? 0.52 : 0;
        const phase = elapsed * 11.5;
        let targetLLeg = Math.sin(phase) * strideAmp;
        let targetRLeg = -Math.sin(phase) * strideAmp;
        let targetLArm = -0.08 - Math.sin(phase) * strideAmp * 0.65 + Math.sin(elapsed * 2.1) * 0.02;
        let targetRArm = -0.08 + Math.sin(phase) * strideAmp * 0.65 - Math.sin(elapsed * 2.1) * 0.02;

        if (this.punchAnimTimer > 0) {
          const p = Math.sin((1 - this.punchAnimTimer / 0.22) * Math.PI);
          targetRArm = -1.38 * p;
          targetLArm = 0.22 * p;
        } else if (this.kickTimer > 0) {
          const p = Math.sin((1 - this.kickTimer / 0.38) * Math.PI);
          targetRLeg = -1.25 * p;
          targetLArm = -0.5 * p;
        }

        const lerpRate = Math.min(1, delta * 18);
        leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, targetLLeg, lerpRate);
        rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, targetRLeg, lerpRate);
        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, targetLArm, lerpRate);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, targetRArm, lerpRate);
      }
    }

    if (!this.isThirdPerson) {
      this.camera.position.copy(this.playerPos);
      return;
    }

    // Third-person customizable cinematic viewing point (distance zoom, height, and shoulder offset)
    const zoomDistMult = THREE.MathUtils.clamp(this.settings.cameraZoom ?? 1.0, 0.55, 2.2);
    const userHeight = THREE.MathUtils.clamp(this.settings.cameraHeight ?? 0.0, -0.45, 0.85);
    const userShoulder = THREE.MathUtils.clamp(this.settings.cameraShoulder ?? 0.0, -0.85, 0.85);

    const backDist = (this.isADS ? 1.55 : 2.15) * zoomDistMult;
    const sideOffset = this.isADS
      ? (userShoulder >= 0 ? Math.max(0.42, userShoulder) : Math.min(-0.42, userShoulder))
      : userShoulder;
    const feetYForCam = Math.max(groundY, this.playerPos.y - (this.slideTimer > 0 ? 0.95 : this.isCrouched ? 1.1 : 1.7));

    const camForward = new THREE.Vector3();
    this.camera.getWorldDirection(camForward);
    const camRight = new THREE.Vector3(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw));

    const pivot = new THREE.Vector3(
      this.playerPos.x,
      Math.max(
        groundY + 0.35,
        feetYForCam + (this.slideTimer > 0 ? 0.55 : this.isADS ? 1.28 : 1.04) + userHeight
      ),
      this.playerPos.z
    );

    const desiredCamPos = pivot
      .clone()
      .addScaledVector(camForward, -backDist)
      .addScaledVector(camRight, sideOffset);

    // Clamp camera above ground heightfield
    const camGround = this.worldSimulator
      ? this.worldSimulator.getGroundHeightAt(desiredCamPos.x, desiredCamPos.z)
      : 0;
    desiredCamPos.y = Math.max(camGround + 0.45, desiredCamPos.y);

    // Prevent camera from clipping inside arena obstacles (exact OBB, cylinder, and AABB raycast)
    if (this.builtMap) {
      const rayDir = desiredCamPos.clone().sub(pivot);
      const maxLen = rayDir.length();
      if (maxLen > 0.01) {
        rayDir.divideScalar(maxLen);
        const clippedDist = clipCameraRayAgainstObstacles(
          pivot,
          desiredCamPos,
          this.builtMap.obstacles,
          this.snappedFloraIds
        );
        if (clippedDist < maxLen) {
          desiredCamPos.copy(pivot).addScaledVector(rayDir, clippedDist);
        }
      }
    }

    if (delta <= 0) {
      this.camera.position.copy(desiredCamPos);
    } else {
      this.camera.position.lerp(desiredCamPos, Math.min(1, delta * 24));
    }
  }

  private updateWeaponAnimation(delta: number) {
    if (!this.weaponMesh) return;

    // ADS Zoom & User-Calibrated Viewpoint Lens
    const customFov = THREE.MathUtils.clamp(this.settings.cameraFov ?? 54, 40, 95);
    const baseFov = this.isThirdPerson ? customFov : Math.max(customFov, 68);
    const adsFov =
      this.getCurrentWeapon().type === 'sniper'
        ? 22
        : this.isThirdPerson
        ? Math.min(38, Math.round(customFov * 0.72))
        : 48;
    const targetFOV = this.isADS ? adsFov : baseFov;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFOV, 16, delta);
    this.camera.updateProjectionMatrix();

    // Weapon position lerp (ADS centers weapon in view)
    const targetPos = this.isADS 
      ? new THREE.Vector3(0, -0.16, -0.38) 
      : new THREE.Vector3(0.24, -0.22, -0.45);

    // Subtle breathing bob
    const isMoving = this.moveInput.x !== 0 || this.moveInput.y !== 0;
    const time = this.clock.getElapsedTime();
    const bobX = Math.sin(time * (isMoving ? 8 : 2)) * (isMoving ? 0.015 : 0.003);
    const bobY = Math.cos(time * (isMoving ? 16 : 4)) * (isMoving ? 0.015 : 0.003);

    targetPos.x += bobX;
    targetPos.y += bobY;

    this.weaponMesh.position.lerp(targetPos, delta * 14);

    // Return recoil rotation to center
    this.weaponMesh.rotation.x = THREE.MathUtils.damp(this.weaponMesh.rotation.x, 0.04, 12, delta);
  }

  private updatePowerUps(delta: number) {
    // Player active power-up timers
    if (this.quadDamageTimer > 0) {
      this.quadDamageTimer = Math.max(0, this.quadDamageTimer - delta);
    }
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer = Math.max(0, this.speedBoostTimer - delta);
    }

    // World pickup meshes animation & proximity detection
    const time = this.clock.getElapsedTime();

    this.powerUps.forEach(pUp => {
      const mesh = this.powerUpMeshes.get(pUp.id);
      if (!mesh) return;

      if (!pUp.isAvailable) {
        mesh.visible = false;
        pUp.respawnTimeRemaining -= delta;
        if (pUp.respawnTimeRemaining <= 0) {
          pUp.isAvailable = true;
          mesh.visible = true;
        }
        return;
      }

      // Rotate & Bob hologram
      const holo = mesh.getObjectByName('Hologram');
      if (holo) {
        holo.rotation.y = time * 2.5;
        holo.position.y = 1.0 + Math.sin(time * 3) * 0.15;
      }

      // Proximity check with player
      const pUpVec = new THREE.Vector3(pUp.position[0], pUp.position[1], pUp.position[2]);
      if (this.playerPos.distanceTo(pUpVec) < 1.8) {
        this.collectPowerUp(pUp);
      }
    });
  }

  private collectPowerUp(pUp: PowerUpInstance) {
    pUp.isAvailable = false;
    pUp.respawnTimeRemaining = pUp.respawnDelay;
    this.powerUpsCollected += 1;

    soundEngine.playPowerUp(pUp.type);

    if (pUp.type === 'health') {
      this.health = Math.min(100, this.health + 50);
      this.callbacks.onHealthChanged(this.health, this.armor);
    } else if (pUp.type === 'armor') {
      this.armor = Math.min(100, this.armor + 50);
      this.callbacks.onHealthChanged(this.health, this.armor);
    } else if (pUp.type === 'quad_damage') {
      this.quadDamageTimer = 15;
      soundEngine.playAnnouncer('quad_damage');
      this.callbacks.onPowerUpActive('QUAD DAMAGE (4x)', 15);
    } else if (pUp.type === 'speed') {
      this.speedBoostTimer = 15;
      this.callbacks.onPowerUpActive('SPEED OVERDRIVE (2x)', 15);
    } else if (pUp.type === 'ammo') {
      const cur = this.getCurrentWeapon();
      cur.currentAmmo = cur.magSize;
      cur.reserveAmmo = cur.magSize * 4;
      this.callbacks.onAmmoChanged(cur.currentAmmo, cur.reserveAmmo);
    }
  }

  private updateBots(delta: number) {
    const time = this.clock.getElapsedTime();
    const ctx = this.getCollisionContext();

    this.bots.forEach(bot => {
      if (!bot.isAlive) {
        bot.respawnTimer -= delta;
        if (bot.respawnTimer <= 0) {
          // Respawn Bot
          bot.isAlive = true;
          bot.health = bot.isWitch ? 120 : 100;
          bot.armor = bot.isWitch ? 30 : 25;
          bot.frozenTimer = 0;
          bot.castAnimTimer = 0;
          bot.mesh.visible = true;

          const spawnIdx = Math.floor(Math.random() * (this.builtMap?.spawnPoints.length || 1));
          const spawn = this.builtMap?.spawnPoints[spawnIdx] || new THREE.Vector3(0, 0, 0);
          bot.pos.copy(spawn);
          resolveCharacterCollision(bot.pos, spawn.y, 0.45, 1.8, null, ctx);
          bot.mesh.position.copy(bot.pos);
        }
        return;
      }

      // Super-Breath Arctic Freeze state
      if (bot.frozenTimer > 0) {
        bot.frozenTimer = Math.max(0, bot.frozenTimer - delta);
        bot.mesh.position.copy(bot.pos);
        return;
      }

      // Animate Witch orbiting Fire/Water orbs & spell-casting staff
      if (bot.isWitch) {
        const orbitPivot = bot.mesh.userData?.magicOrbitPivot as THREE.Object3D | undefined;
        if (orbitPivot) {
          orbitPivot.rotation.y += delta * 2.5;
          orbitPivot.position.y = 1.48 + Math.sin(time * 3.2) * 0.08;
        }
        if (bot.castAnimTimer > 0) {
          bot.castAnimTimer = Math.max(0, bot.castAnimTimer - delta);
        }
        const staffGroup = bot.mesh.userData?.staffGroup as THREE.Object3D | undefined;
        if (staffGroup) {
          const swing = bot.castAnimTimer > 0 ? Math.sin((bot.castAnimTimer / 0.35) * Math.PI) * 0.65 : 0;
          staffGroup.rotation.x = 0.14 + swing + Math.sin(time * 2.2) * 0.04;
        }
      }

      const prevBotY = bot.pos.y;
      // Distance to Player
      const distToPlayer = bot.pos.distanceTo(this.playerPos);

      // AI Logic: If close to player, aim and cast/shoot
      if (distToPlayer < 38 && this.health > 0) {
        bot.state = 'attack';
        // Look at player (horizontal direction only so bots don't pitch into terrain)
        const lookDir = new THREE.Vector3(this.playerPos.x - bot.pos.x, 0, this.playerPos.z - bot.pos.z);
        if (lookDir.lengthSq() > 1e-4) lookDir.normalize();
        bot.rotY = Math.atan2(lookDir.x, lookDir.z);
        bot.mesh.rotation.y = bot.rotY;

        if (bot.isWitch) {
          // Elemental Witch casts Fire Magic & Water Magic projectiles
          if (time - bot.lastShotTime > 1.45) {
            bot.lastShotTime = time;
            bot.castAnimTimer = 0.35;
            this.castWitchSpell(bot, bot.nextSpell);
            bot.nextSpell = bot.nextSpell === 'fire' ? 'water' : 'fire';
          }
          // Witches strafe & maintain mid-range casting distance
          if (distToPlayer > 15) {
            bot.pos.addScaledVector(lookDir, delta * 3.4);
          } else if (distToPlayer < 9) {
            bot.pos.addScaledVector(lookDir, -delta * 2.6);
          }
        } else {
          // Shoot at player with reasonable accuracy interval
          if (time - bot.lastShotTime > 1.2) {
            bot.lastShotTime = time;
            if (Math.random() < 0.45) {
              this.damagePlayer(18, bot.name, 'M4-Vanguard');
            }
            this.createBulletTracer(bot.pos.clone().setY(bot.pos.y + 1.2), this.playerPos.clone());
          }
          if (distToPlayer > 12) {
            bot.pos.addScaledVector(lookDir, delta * 3.5);
          }
        }
      } else {
        // Patrol around map
        bot.rotY += delta * 0.5;
        bot.mesh.rotation.y = bot.rotY;
        const forward = new THREE.Vector3(Math.sin(bot.rotY), 0, Math.cos(bot.rotY));
        bot.pos.addScaledVector(forward, delta * 2.2);
      }

      // Gravity + solid obstacle/ramp collision for bots (so enemies can't walk through walls!)
      bot.pos.y = Math.max(0, bot.pos.y - 9.0 * delta);
      const botRes = resolveCharacterCollision(bot.pos, prevBotY, 0.45, 1.8, null, ctx);
      if (botRes.hitWall) {
        // Nudge patrol heading away from walls so bots steer around obstacles cleanly
        bot.rotY += delta * 2.2;
      }
      bot.mesh.position.copy(bot.pos);
    });

    // Bot-to-Bot horizontal capsule separation so AI fighters never stack inside one another
    for (let i = 0; i < this.bots.length; i++) {
      const a = this.bots[i];
      if (!a.isAlive) continue;
      for (let j = i + 1; j < this.bots.length; j++) {
        const b = this.bots[j];
        if (!b.isAlive) continue;
        if (Math.abs(a.pos.y - b.pos.y) > 1.7) continue;
        const dx = a.pos.x - b.pos.x;
        const dz = a.pos.z - b.pos.z;
        const distSq = dx * dx + dz * dz;
        const minD = 0.9;
        if (distSq < minD * minD) {
          const dist = Math.sqrt(distSq);
          const nx = dist > 1e-4 ? dx / dist : 1;
          const nz = dist > 1e-4 ? dz / dist : 0;
          const halfPush = (minD - dist) * 0.5;
          a.pos.x += nx * halfPush;
          a.pos.z += nz * halfPush;
          b.pos.x -= nx * halfPush;
          b.pos.z -= nz * halfPush;
          resolveCharacterCollision(a.pos, a.pos.y, 0.45, 1.8, null, ctx);
          resolveCharacterCollision(b.pos, b.pos.y, 0.45, 1.8, null, ctx);
          a.mesh.position.copy(a.pos);
          b.mesh.position.copy(b.pos);
        }
      }
    }
  }

  private castWitchSpell(bot: typeof this.bots[0], element: 'fire' | 'water') {
    const spawnOrigin = bot.pos.clone().add(new THREE.Vector3(0, 1.45, 0));
    const targetPoint = this.playerPos.clone().add(new THREE.Vector3(0, -0.15, 0));
    // Slight predictive spread so player can dodge or extinguish spells
    const dir = targetPoint.sub(spawnOrigin).normalize();
    dir.x += (Math.random() - 0.5) * 0.06;
    dir.y += (Math.random() - 0.5) * 0.04;
    dir.z += (Math.random() - 0.5) * 0.06;
    dir.normalize();

    const spellGroup = new THREE.Group();
    if (element === 'fire') {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 12, 12),
        new THREE.MeshBasicMaterial({ color: '#fef08a' })
      );
      const flameShell = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 12, 12),
        new THREE.MeshBasicMaterial({
          color: '#f97316',
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      const flareRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.48, 0.05, 8, 18),
        new THREE.MeshBasicMaterial({
          color: '#ef4444',
          transparent: true,
          opacity: 0.8,
        })
      );
      spellGroup.add(core, flameShell, flareRing);
    } else {
      const hydroCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 12, 12),
        new THREE.MeshBasicMaterial({ color: '#e0f2fe' })
      );
      const waterShell = new THREE.Mesh(
        new THREE.SphereGeometry(0.44, 12, 12),
        new THREE.MeshBasicMaterial({
          color: '#06b6d4',
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      const waveRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.06, 8, 20),
        new THREE.MeshBasicMaterial({
          color: '#38bdf8',
          transparent: true,
          opacity: 0.85,
        })
      );
      spellGroup.add(hydroCore, waterShell, waveRing);
    }

    spellGroup.position.copy(spawnOrigin);
    this.scene.add(spellGroup);
    soundEngine.playWitchMagic(element);

    const speed = element === 'fire' ? 26 : 24;
    this.witchSpells.push({
      mesh: spellGroup,
      element,
      pos: spawnOrigin,
      vel: dir.multiplyScalar(speed),
      life: 3.2,
      attackerName: bot.name,
    });
  }

  private disposeSpellObject(group: THREE.Group) {
    this.scene.remove(group);
    group.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }

  private updateWitchSpells(delta: number) {
    for (let i = this.witchSpells.length - 1; i >= 0; i--) {
      const spell = this.witchSpells[i];
      spell.life -= delta;
      spell.pos.addScaledVector(spell.vel, delta);
      spell.mesh.position.copy(spell.pos);
      spell.mesh.rotation.x += delta * 6.5;
      spell.mesh.rotation.y += delta * 8.0;

      let removeSpell = spell.life <= 0;

      // Ground impact
      const groundY = this.worldSimulator
        ? this.worldSimulator.getGroundHeightAt(spell.pos.x, spell.pos.z)
        : 0;
      if (!removeSpell && spell.pos.y <= groundY + 0.25) {
        this.worldSimulator?.spawnFootstepDust(spell.pos, 1.3);
        removeSpell = true;
      }

      // Arena cover collision
      if (!removeSpell && this.builtMap) {
        for (const obs of this.builtMap.obstacles) {
          if (obs.box.containsPoint(spell.pos)) {
            this.worldSimulator?.spawnFootstepDust(spell.pos, 1.2);
            removeSpell = true;
            break;
          }
        }
      }

      // Player hit detection
      if (!removeSpell && this.health > 0) {
        const playerCenter = this.playerPos.clone().add(new THREE.Vector3(0, -0.3, 0));
        if (spell.pos.distanceTo(playerCenter) < 1.35) {
          removeSpell = true;
          if (spell.element === 'fire') {
            const isFireImmune =
              this.operator.id === 'maxwell_shodron' && this.currentMagicElement === 'fire';
            if (isFireImmune) {
              this.playerBurnTimer = 0;
              this.callbacks.onPowerUpActive('PYRO FORM — FIRE RESISTED', 1.4);
              this.damagePlayer(4, spell.attackerName, 'Fire Magic (Resisted)');
            } else {
              this.playerBurnTimer = 2.2;
              this.burnTickAccum = 0;
              this.playerBurnAttacker = spell.attackerName;
              this.screenShake = Math.max(this.screenShake, 0.45);
              this.callbacks.onPowerUpActive('BURNING — FIRE MAGIC', 2.2);
              this.damagePlayer(18, spell.attackerName, 'Fire Magic');
            }
          } else {
            const isFrostImmune =
              this.operator.id === 'maxwell_shodron' && this.currentMagicElement === 'frost';
            if (isFrostImmune) {
              this.playerWaterSlowTimer = 0;
              this.callbacks.onPowerUpActive('FROST FORM — CHILL IMMUNE', 1.4);
              this.damagePlayer(4, spell.attackerName, 'Water Magic (Resisted)');
            } else {
              this.playerWaterSlowTimer = 1.8;
              // Hydro surge knockback
              const push = spell.vel.clone().setY(0).normalize();
              this.playerVelocity.addScaledVector(push, 7.5);
              this.screenShake = Math.max(this.screenShake, 0.35);
              this.callbacks.onPowerUpActive('CHILLED — WATER MAGIC', 1.8);
              this.damagePlayer(15, spell.attackerName, 'Water Magic');
            }
          }
        }
      }

      if (removeSpell) {
        this.disposeSpellObject(spell.mesh);
        this.witchSpells.splice(i, 1);
      }
    }
  }

  private updateBulletTracers(delta: number) {
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const tracer = this.bulletTracers[i];
      tracer.progress += delta * 120; // 120 m/s tracer speed

      if (tracer.progress >= tracer.distance) {
        this.scene.remove(tracer.line);
        if ('geometry' in tracer.line && (tracer.line as THREE.Mesh).geometry) {
          (tracer.line as THREE.Mesh).geometry.dispose();
        }
        this.bulletTracers.splice(i, 1);
      } else {
        tracer.line.position.copy(
          tracer.origin.clone().add(tracer.direction.clone().multiplyScalar(tracer.progress))
        );
      }
    }
  }

  public triggerKamehameha() {
    if (!this.isMatchRunning) return;
    this.punchAnimTimer = 0.32;
    this.abilitiesUsed += 1;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));

    soundEngine.playKamehameha();
    this.screenShake = 0.9;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 4.5),
      forward.clone().multiplyScalar(96),
      3.8
    );

    const beamGeo = new THREE.CylinderGeometry(0.65, 0.85, 34, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.95,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(this.playerPos).addScaledVector(forward, 17);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
    this.scene.add(beam);
    setTimeout(() => {
      this.scene.remove(beam);
      beamGeo.dispose();
      beamMat.dispose();
    }, 550);

    const dmg = this.quadDamageTimer > 0 ? 480 : 240;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      if (toBot.length() < 36 && forward.angleTo(toBot) < 0.42) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
  }

  public triggerSpiritBomb() {
    if (!this.isMatchRunning) return;
    this.punchAnimTimer = 0.35;
    this.abilitiesUsed += 1;
    this.kiEnergy = Math.max(0, this.kiEnergy - 30);
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));

    soundEngine.playKamehameha();
    this.screenShake = 1.1;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const impactCenter = this.playerPos.clone().addScaledVector(forward, 12);

    this.worldSimulator?.onHeavyPunchThrown(
      impactCenter,
      forward.clone().multiplyScalar(115),
      4.5
    );

    const orbGeo = new THREE.SphereGeometry(1.5, 18, 18);
    const orbMat = new THREE.MeshBasicMaterial({
      color: '#67e8f9',
      transparent: true,
      opacity: 0.92,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.copy(this.playerPos).add(new THREE.Vector3(0, 2.2, 0));
    this.scene.add(orb);

    const startTime = performance.now();
    const animateOrb = () => {
      const t = Math.min(1, (performance.now() - startTime) / 420);
      orb.position.lerpVectors(
        this.playerPos.clone().add(new THREE.Vector3(0, 2.2, 0)),
        impactCenter,
        t
      );
      orb.scale.setScalar(1 + t * 1.3);
      if (t < 1 && !this.isDisposed) {
        requestAnimationFrame(animateOrb);
      } else {
        this.scene.remove(orb);
        orbGeo.dispose();
        orbMat.dispose();
      }
    };
    requestAnimationFrame(animateOrb);

    const dmg = this.quadDamageTimer > 0 ? 640 : 320;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(impactCenter) < 16) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
  }

  // --- Superman Flight, Sonic Boom, Super-Speed Dash, Super-Breath, Thermal Overload & Cape Cloth ---

  public toggleFlight() {
    if (!this.isMatchRunning) return;
    this.isFlying = !this.isFlying;
    this.callbacks.onFlightChanged?.(this.isFlying);
    soundEngine.playUIClick('tab');

    if (this.isFlying) {
      if (this.isGrounded) {
        this.playerPos.y += 1.1;
        this.playerVelocity.y = 5.5;
        this.isGrounded = false;
      }
      soundEngine.playSonicBoom();
      this.spawnSonicBoomRing();
    }
  }

  public triggerSuperSpeedDash() {
    if (!this.isMatchRunning || this.superDashTimer > 0.05) return;
    this.abilitiesUsed += 1;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    if (!this.isFlying) forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();

    this.superDashDir.copy(forward);
    this.superDashTimer = 0.28;
    soundEngine.playSonicBoom();
    this.spawnSonicBoomRing();
    this.screenShake = Math.max(this.screenShake, 0.5);
  }

  public triggerSuperBreath() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    this.kiEnergy = Math.max(0, this.kiEnergy - 15);
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSuperBreath();
    this.screenShake = Math.max(this.screenShake, 0.35);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const origin = this.playerPos.clone().addScaledVector(forward, 1.2);

    // Swirling translucent icy Arctic Breath cone
    const coneGeo = new THREE.ConeGeometry(3.4, 15, 20, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: '#a5f3fc',
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(origin).addScaledVector(forward, 7.5);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), forward);
    this.scene.add(cone);

    const start = performance.now();
    const fadeCone = () => {
      const p = Math.min(1, (performance.now() - start) / 550);
      cone.scale.set(1 + p * 0.45, 1, 1 + p * 0.45);
      coneMat.opacity = 0.45 * (1 - p);
      if (p < 1 && !this.isDisposed) {
        requestAnimationFrame(fadeCone);
      } else {
        this.scene.remove(cone);
        coneGeo.dispose();
        coneMat.dispose();
      }
    };
    requestAnimationFrame(fadeCone);

    // Extinguish incoming enemy projectiles & Witch Fire/Water spells inside the breath cone
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const tPos = this.bulletTracers[i].line.position;
      const toTracer = tPos.clone().sub(this.playerPos);
      if (toTracer.length() < 16 && forward.angleTo(toTracer) < 0.6) {
        this.scene.remove(this.bulletTracers[i].line);
        this.bulletTracers.splice(i, 1);
      }
    }
    for (let i = this.witchSpells.length - 1; i >= 0; i--) {
      const toSpell = this.witchSpells[i].pos.clone().sub(this.playerPos);
      if (toSpell.length() < 18 && forward.angleTo(toSpell) < 0.68) {
        this.disposeSpellObject(this.witchSpells[i].mesh);
        this.witchSpells.splice(i, 1);
      }
    }

    // Freeze & knock back hostiles in cone
    const dmg = this.quadDamageTimer > 0 ? 360 : 110;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      const dist = toBot.length();
      if (dist < 16 && forward.angleTo(toBot) < 0.56) {
        bot.frozenTimer = 3.5;
        bot.pos.addScaledVector(forward, 4.2);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
  }

  public triggerThermalOverload() {
    if (!this.isMatchRunning) return;
    if (this.isThermalOverload) {
      this.stopThermalOverload();
      return;
    }
    if (this.kiEnergy < 45) return;

    this.abilitiesUsed += 1;
    this.kiEnergy = Math.max(0, this.kiEnergy - 45);
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));

    this.isThermalOverload = true;
    this.thermalOverloadTimer = 4.5;
    this.thermalTickAccum = 0;
    this.thermalScorchAccum = 0;

    // Elevate slightly to lock mid-air hover
    if (this.isGrounded) {
      this.playerPos.y += 1.4;
      this.isGrounded = false;
    }
    this.playerVelocity.set(0, 0, 0);

    // Ignite Superman's eye glow materials
    const eyeMat = this.playerMesh?.userData?.eyeGlowMat as THREE.MeshStandardMaterial | undefined;
    if (eyeMat) {
      eyeMat.color.set('#fffbeb');
      eyeMat.emissive.set('#ef4444');
      eyeMat.emissiveIntensity = 5.5;
      eyeMat.opacity = 1.0;
    }

    this.createThermalBeamRig();
    soundEngine.playThermalOverload(true);
    this.callbacks.onThermalOverloadChanged?.(true);
    this.callbacks.onPowerUpActive('THERMAL OVERLOAD (SWEEP TO BURN)', 4.5);
  }

  private createThermalBeamRig() {
    this.disposeThermalBeamRig();
    const group = new THREE.Group();

    const sheathMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreMat = new THREE.MeshBasicMaterial({
      color: '#fffbeb',
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sheathGeo = new THREE.CylinderGeometry(0.065, 0.14, 1, 10);
    sheathGeo.translate(0, 0.5, 0);
    sheathGeo.rotateX(Math.PI / 2);

    const coreGeo = new THREE.CylinderGeometry(0.024, 0.045, 1, 8);
    coreGeo.translate(0, 0.5, 0);
    coreGeo.rotateX(Math.PI / 2);

    this.thermalLeftSheath = new THREE.Mesh(sheathGeo, sheathMat);
    this.thermalRightSheath = new THREE.Mesh(sheathGeo, sheathMat);
    this.thermalLeftCore = new THREE.Mesh(coreGeo, coreMat);
    this.thermalRightCore = new THREE.Mesh(coreGeo, coreMat);

    this.thermalImpactLight = new THREE.PointLight('#fb7185', 6, 16);

    group.add(
      this.thermalLeftSheath,
      this.thermalRightSheath,
      this.thermalLeftCore,
      this.thermalRightCore,
      this.thermalImpactLight
    );
    this.scene.add(group);
    this.thermalBeamsGroup = group;
  }

  private disposeThermalBeamRig() {
    if (!this.thermalBeamsGroup) return;
    this.scene.remove(this.thermalBeamsGroup);
    this.thermalBeamsGroup.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    this.thermalBeamsGroup = null;
    this.thermalLeftSheath = null;
    this.thermalRightSheath = null;
    this.thermalLeftCore = null;
    this.thermalRightCore = null;
    this.thermalImpactLight = null;
  }

  private stopThermalOverload() {
    this.isThermalOverload = false;
    this.thermalOverloadTimer = 0;
    soundEngine.playThermalOverload(false);
    this.disposeThermalBeamRig();

    const eyeMat = this.playerMesh?.userData?.eyeGlowMat as THREE.MeshStandardMaterial | undefined;
    if (eyeMat) {
      eyeMat.emissiveIntensity = 0;
      eyeMat.opacity = 0;
    }
    this.callbacks.onThermalOverloadChanged?.(false);
  }

  private updateThermalOverload(delta: number) {
    this.thermalOverloadTimer -= delta;
    if (this.thermalOverloadTimer <= 0) {
      this.stopThermalOverload();
      return;
    }

    this.screenShake = Math.max(this.screenShake, 0.22);

    // Raycast from camera aim for sweeping 180-degree target point
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    if (this.isThirdPerson) {
      const camToPlayer = this.camera.position.distanceTo(this.playerPos);
      raycaster.ray.origin.addScaledVector(raycaster.ray.direction, Math.max(0.5, camToPlayer * 0.82));
    }

    let hitDist = 60;
    if (this.builtMap) {
      const obsHit = new THREE.Vector3();
      for (const obs of this.builtMap.obstacles) {
        if (raycaster.ray.intersectBox(obs.box, obsHit)) {
          const d = raycaster.ray.origin.distanceTo(obsHit);
          if (d < hitDist) hitDist = d;
        }
      }
    }
    const impactPoint = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, hitDist);
    const groundAtHit = this.worldSimulator
      ? this.worldSimulator.getGroundHeightAt(impactPoint.x, impactPoint.z)
      : 0;
    if (impactPoint.y < groundAtHit) {
      impactPoint.y = groundAtHit;
    }

    // Read Superman's eye world coordinates directly from his 3D head sockets
    const leftEyeObj = this.playerMesh?.userData?.leftEyeGlow as THREE.Object3D | undefined;
    const rightEyeObj = this.playerMesh?.userData?.rightEyeGlow as THREE.Object3D | undefined;
    const leftOrigin = new THREE.Vector3();
    const rightOrigin = new THREE.Vector3();

    if (this.isThirdPerson && leftEyeObj && rightEyeObj) {
      leftEyeObj.getWorldPosition(leftOrigin);
      rightEyeObj.getWorldPosition(rightOrigin);
    } else {
      const rightVec = new THREE.Vector3(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw));
      leftOrigin.copy(this.playerPos).addScaledVector(rightVec, -0.07).add(new THREE.Vector3(0, -0.03, 0));
      rightOrigin.copy(this.playerPos).addScaledVector(rightVec, 0.07).add(new THREE.Vector3(0, -0.03, 0));
    }

    if (this.thermalLeftSheath && this.thermalRightSheath && this.thermalLeftCore && this.thermalRightCore) {
      const pulse = 1 + Math.sin(this.clock.getElapsedTime() * 48) * 0.14;
      const leftLen = Math.max(0.5, leftOrigin.distanceTo(impactPoint));
      const rightLen = Math.max(0.5, rightOrigin.distanceTo(impactPoint));

      this.thermalLeftSheath.position.copy(leftOrigin);
      this.thermalLeftSheath.lookAt(impactPoint);
      this.thermalLeftSheath.scale.set(pulse, pulse, leftLen);

      this.thermalLeftCore.position.copy(leftOrigin);
      this.thermalLeftCore.lookAt(impactPoint);
      this.thermalLeftCore.scale.set(pulse, pulse, leftLen);

      this.thermalRightSheath.position.copy(rightOrigin);
      this.thermalRightSheath.lookAt(impactPoint);
      this.thermalRightSheath.scale.set(pulse, pulse, rightLen);

      this.thermalRightCore.position.copy(rightOrigin);
      this.thermalRightCore.lookAt(impactPoint);
      this.thermalRightCore.scale.set(pulse, pulse, rightLen);

      if (this.thermalImpactLight) {
        this.thermalImpactLight.position.copy(impactPoint).add(new THREE.Vector3(0, 0.5, 0));
      }
    }

    // Continuous armor stripping, melt damage & scorched-earth craters along sweep
    this.thermalTickAccum += delta;
    this.thermalScorchAccum += delta;

    if (this.thermalScorchAccum >= 0.34) {
      this.thermalScorchAccum = 0;
      this.worldSimulator?.onHeavyPunchThrown(
        impactPoint,
        raycaster.ray.direction.clone().multiplyScalar(68),
        2.2
      );
    }

    if (this.thermalTickAccum >= 0.14) {
      this.thermalTickAccum = 0;
      const dmg = this.quadDamageTimer > 0 ? 190 : 58;
      this.bots.filter(b => b.isAlive).forEach(bot => {
        const botBox = new THREE.Box3().setFromObject(bot.mesh).expandByScalar(0.8);
        const beamHit = new THREE.Vector3();
        const nearImpact = bot.pos.distanceTo(impactPoint) < 3.5;
        if (nearImpact || raycaster.ray.intersectBox(botBox, beamHit)) {
          bot.armor = 0; // Strip armor cleanly
          bot.pos.addScaledVector(raycaster.ray.direction, 0.45);
          this.damageBot(bot, dmg, true);
          this.callbacks.onHitmarker(true, dmg);
          this.totalDamage += dmg;
          this.shotsHit += 1;
          soundEngine.playHitmarker(true);
        }
      });
    }
  }

  private spawnSonicBoomRing() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const ringGeo = new THREE.RingGeometry(0.45, 0.72, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(this.playerPos).addScaledVector(forward, 0.5);
    ring.lookAt(this.playerPos.clone().addScaledVector(forward, 5));
    this.scene.add(ring);

    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 280);
      ring.scale.setScalar(1 + p * 5.2);
      ringMat.opacity = 0.88 * (1 - p);
      if (p < 1 && !this.isDisposed) {
        requestAnimationFrame(anim);
      } else {
        this.scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    };
    requestAnimationFrame(anim);
  }

  private spawnDashTrailOrb(customColor?: string) {
    const geo = new THREE.SphereGeometry(0.28, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: customColor ?? (Math.random() > 0.35 ? '#38bdf8' : '#ffffff'),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const orb = new THREE.Mesh(geo, mat);
    orb.position.copy(this.playerPos).add(
      new THREE.Vector3((Math.random() - 0.5) * 0.4, -0.45 + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4)
    );
    this.scene.add(orb);
    this.dashTrails.push({ mesh: orb, life: 0.32 });
  }

  private updateDashTrails(delta: number) {
    for (let i = this.dashTrails.length - 1; i >= 0; i--) {
      const t = this.dashTrails[i];
      t.life -= delta;
      const mat = t.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, t.life / 0.32) * 0.75;
      t.mesh.scale.setScalar(0.6 + (1 - t.life / 0.32) * 1.1);
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        mat.dispose();
        this.dashTrails.splice(i, 1);
      }
    }
  }

  private updateCapeClothPhysics(delta: number) {
    if (!this.playerMesh) return;
    const cape = this.playerMesh.userData?.capeMesh as THREE.Mesh | undefined;
    const basePos = this.playerMesh.userData?.capeBasePos as Float32Array | undefined;
    if (!cape || !basePos) return;

    const posAttr = cape.geometry.attributes.position as THREE.BufferAttribute;
    const time = this.clock.getElapsedTime();
    const speed = this.playerVelocity.length();
    const flightBoost = this.isFlying ? 1.85 : 1.0;
    const waveFreq = 3.8 + Math.min(10.0, speed * 0.55);
    const waveAmp = (0.025 + Math.min(0.18, speed * 0.012)) * flightBoost;
    const billowBack = Math.min(0.42, speed * 0.025) * flightBoost;

    for (let i = 0; i < posAttr.count; i++) {
      const bx = basePos[i * 3];
      const by = basePos[i * 3 + 1];
      const bz = basePos[i * 3 + 2];

      // Top collar stays fastened; hem billows while preserving sculptural deep pleats
      const pinWeight = THREE.MathUtils.clamp((0.55 - by) / 1.12, 0, 1);
      const flutter = Math.sin(time * waveFreq + by * 3.4 + bx * 2.8) * waveAmp * pinWeight;
      const edgeRipple = Math.cos(time * (waveFreq * 0.68) + bx * 4.2) * (waveAmp * 0.3) * pinWeight;

      posAttr.setXYZ(
        i,
        bx + edgeRipple * 0.22 - billowBack * 0.14 * pinWeight,
        by,
        bz - billowBack * pinWeight + flutter
      );
    }
    posAttr.needsUpdate = true;
    cape.geometry.computeVertexNormals();
  }

  private spawnSigilRing(origin: THREE.Vector3, colorHex: string, maxScale: number, durationMs: number) {
    const ringGeo = new THREE.TorusGeometry(0.65, 0.07, 8, 28);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(origin);
    this.scene.add(ring);

    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / durationMs);
      ring.scale.setScalar(1 + p * maxScale);
      ring.rotation.z += 0.14;
      ringMat.opacity = 0.9 * (1 - p);
      if (p < 1 && !this.isDisposed) {
        requestAnimationFrame(anim);
      } else {
        this.scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    };
    requestAnimationFrame(anim);
  }

  public triggerArcaneBlink() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    soundEngine.playArcaneBlink();

    const elProfile = MAXWELL_ELEMENT_PROFILES[this.currentMagicElement];
    const originPos = this.playerPos.clone().add(new THREE.Vector3(0, -1.1, 0));
    this.spawnSigilRing(originPos, elProfile.tracerHex, 3.6, 340);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    if (forward.lengthSq() > 0.001) forward.normalize();

    const blinkDist = this.currentMagicElement === 'lightning' ? 19 : 13;
    this.movePlayerBySweptStep(forward, blinkDist);

    this.screenShake = Math.max(this.screenShake, 0.25);
    this.spawnSigilRing(this.playerPos.clone().add(new THREE.Vector3(0, -1.1, 0)), elProfile.runeHex, 3.8, 360);
    this.callbacks.onPowerUpActive(
      this.currentMagicElement === 'lightning' ? 'LIGHTNING STEP SURGE' : 'ELEMENTAL PHASE BLINK',
      1.4
    );
  }

  public triggerChronoStasis() {
    const manaCost = this.currentMagicElement === 'arcane' ? Math.round(25 * 0.7) : 25;
    if (!this.isMatchRunning || this.kiEnergy < manaCost) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - manaCost);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playChronoStasis();
    this.screenShake = Math.max(this.screenShake, 0.55);

    const elProfile = MAXWELL_ELEMENT_PROFILES[this.currentMagicElement];
    const surgeRadius = this.currentMagicElement === 'lightning' ? 22 : 18;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 3.0),
      forward.clone().multiplyScalar(82),
      3.0
    );

    // Vaporize incoming enemy spells & tracers within 20m
    for (let i = this.witchSpells.length - 1; i >= 0; i--) {
      if (this.witchSpells[i].pos.distanceTo(this.playerPos) <= 20) {
        this.disposeSpellObject(this.witchSpells[i].mesh);
        this.witchSpells.splice(i, 1);
      }
    }
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const tr = this.bulletTracers[i];
      if (tr.line.position.distanceTo(this.playerPos) <= 20) {
        this.scene.remove(tr.line);
        this.bulletTracers.splice(i, 1);
      }
    }

    // Elemental Surge effect on nearby hostiles
    const baseDmg =
      this.currentMagicElement === 'fire' || this.currentMagicElement === 'void' ? 165 : 125;
    const dmg = this.quadDamageTimer > 0 ? baseDmg * 2 : baseDmg;
    const freezeTime = this.currentMagicElement === 'frost' ? 6.0 : 4.5;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= surgeRadius) {
        bot.frozenTimer = Math.max(bot.frozenTimer, freezeTime);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });

    // Translucent elemental surge pulse
    const sphereGeo = new THREE.SphereGeometry(1.0, 24, 18);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: elProfile.tracerHex,
      transparent: true,
      opacity: 0.42,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stasisSphere = new THREE.Mesh(sphereGeo, sphereMat);
    stasisSphere.position.copy(this.playerPos);
    this.scene.add(stasisSphere);

    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 480);
      stasisSphere.scale.setScalar(1 + p * 15);
      stasisSphere.rotation.y += 0.08;
      sphereMat.opacity = 0.42 * (1 - p);
      if (p < 1 && !this.isDisposed) {
        requestAnimationFrame(anim);
      } else {
        this.scene.remove(stasisSphere);
        sphereGeo.dispose();
        sphereMat.dispose();
      }
    };
    requestAnimationFrame(anim);

    const surgeTitle =
      this.currentMagicElement === 'fire'
        ? 'INFERNO SURGE WAVE'
        : this.currentMagicElement === 'lightning'
        ? 'THUNDER SURGE FIELD'
        : this.currentMagicElement === 'frost'
        ? 'GLACIAL FREEZE SURGE'
        : this.currentMagicElement === 'void'
        ? 'VOID COLLAPSE FIELD'
        : 'CHRONOS STASIS FIELD';
    this.callbacks.onPowerUpActive(surgeTitle, 3.0);
  }

  public triggerAetherBarrier() {
    const manaCost = this.currentMagicElement === 'arcane' ? Math.round(20 * 0.7) : 20;
    if (!this.isMatchRunning || this.kiEnergy < manaCost) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - manaCost);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playAetherBarrier();

    const shieldGain = this.currentMagicElement === 'frost' ? 60 : 45;
    this.armor = Math.min(100, this.armor + shieldGain);
    this.health = Math.min(100, this.health + 15);
    this.playerBurnTimer = 0;
    this.playerWaterSlowTimer = 0;
    this.callbacks.onHealthChanged(this.health, this.armor);
    this.callbacks.onPowerUpActive(`ELEMENTAL WARD (+${shieldGain} SHIELD)`, 3.0);

    const elProfile = MAXWELL_ELEMENT_PROFILES[this.currentMagicElement];
    const domeGeo = new THREE.IcosahedronGeometry(1.55, 1);
    const domeMat = new THREE.MeshBasicMaterial({
      color: elProfile.tracerHex,
      transparent: true,
      opacity: 0.38,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.copy(this.playerPos).add(new THREE.Vector3(0, -0.4, 0));
    this.scene.add(dome);

    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 650);
      dome.position.copy(this.playerPos).add(new THREE.Vector3(0, -0.4, 0));
      dome.rotation.y += 0.06;
      domeMat.opacity = 0.38 * (1 - p);
      if (p < 1 && !this.isDisposed) {
        requestAnimationFrame(anim);
      } else {
        this.scene.remove(dome);
        domeGeo.dispose();
        domeMat.dispose();
      }
    };
    requestAnimationFrame(anim);
  }

  public triggerArcaneNova() {
    const manaCost = this.currentMagicElement === 'arcane' ? Math.round(55 * 0.7) : 55;
    if (!this.isMatchRunning || this.kiEnergy < manaCost) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - manaCost);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playArcaneNova();
    this.screenShake = Math.max(this.screenShake, 1.25);

    const elProfile = MAXWELL_ELEMENT_PROFILES[this.currentMagicElement];
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 3.5),
      forward.clone().multiplyScalar(125),
      4.8
    );

    const novaMult =
      this.currentMagicElement === 'fire' || this.currentMagicElement === 'void' ? 1.25 : 1.0;
    const baseDmg = Math.round(420 * novaMult);
    const dmg = this.quadDamageTimer > 0 ? baseDmg * 2 : baseDmg;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      const dist = toBot.length();
      if (dist <= 24) {
        if (dist > 0.01) {
          bot.pos.addScaledVector(toBot.normalize(), 4.5);
        }
        if (this.currentMagicElement === 'frost') {
          bot.frozenTimer = Math.max(bot.frozenTimer, 4.5);
        }
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });

    const ringOrigin = this.playerPos.clone().add(new THREE.Vector3(0, -0.85, 0));
    this.spawnSigilRing(ringOrigin, elProfile.tracerHex, 18, 620);
    this.spawnSigilRing(ringOrigin.clone().add(new THREE.Vector3(0, 0.25, 0)), elProfile.runeHex, 14, 520);
    this.callbacks.onPowerUpActive(`ELEMENTAL CATACLYSM (${this.currentMagicElement.toUpperCase()})`, 3.5);
  }

  // =========================================================================
  // KING (OPM) ABILITIES — Engine Roar, Saitama Assist & Hellfire Cannon
  // =========================================================================

  public triggerKingEngine() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playKingEngine(true);
    this.screenShake = Math.max(this.screenShake, 0.75);

    const origin = this.playerPos.clone().add(new THREE.Vector3(0, -0.9, 0));
    this.spawnSigilRing(origin, '#fbbf24', 14, 520);
    this.spawnSigilRing(origin.clone().add(new THREE.Vector3(0, 0.35, 0)), '#ef4444', 10, 440);

    for (let i = this.witchSpells.length - 1; i >= 0; i--) {
      if (this.witchSpells[i].pos.distanceTo(this.playerPos) <= 18) {
        this.disposeSpellObject(this.witchSpells[i].mesh);
        this.witchSpells.splice(i, 1);
      }
    }

    const dmg = this.quadDamageTimer > 0 ? 190 : 95;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 18) {
        bot.frozenTimer = Math.max(bot.frozenTimer, 4.0);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('KING ENGINE — HOSTILES TERRIFIED!', 3.2);
  }

  public triggerKingSaitamaAssist() {
    if (!this.isMatchRunning || this.kiEnergy < 30) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 30);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.25;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSeriousPunch();
    this.screenShake = Math.max(this.screenShake, 1.1);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const impactCenter = this.playerPos.clone().addScaledVector(forward, 11);

    this.worldSimulator?.onHeavyPunchThrown(impactCenter, forward.clone().multiplyScalar(110), 4.2);
    this.spawnSigilRing(impactCenter.clone().setY(impactCenter.y - 0.6), '#fde047', 12, 460);

    const dmg = this.quadDamageTimer > 0 ? 520 : 260;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      if (toBot.length() < 24 && forward.angleTo(toBot) < 0.6) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('SAITAMA ASSIST: SERIOUS STRIKE!', 2.4);
  }

  public triggerKingHellfire() {
    if (!this.isMatchRunning || this.kiEnergy < 50) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 50);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.35;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playKingEngine(true);
    soundEngine.playKamehameha();
    this.screenShake = Math.max(this.screenShake, 1.35);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 4.5),
      forward.clone().multiplyScalar(130),
      4.8
    );

    const beamGeo = new THREE.CylinderGeometry(0.95, 1.2, 34, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      transparent: true,
      opacity: 0.92,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(this.playerPos).addScaledVector(forward, 17);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
    this.scene.add(beam);
    setTimeout(() => {
      this.scene.remove(beam);
      beamGeo.dispose();
      beamMat.dispose();
    }, 620);

    this.spawnSigilRing(this.playerPos.clone().add(new THREE.Vector3(0, -0.8, 0)), '#fbbf24', 15, 550);

    const dmg = this.quadDamageTimer > 0 ? 920 : 460;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      if (toBot.length() < 34 && forward.angleTo(toBot) < 0.5) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('HELLFIRE WAVE-MOTION CANNON!', 3.2);
  }

  // =========================================================================
  // THE FLASH ABILITIES — Phase Warp, Speed Vortex & Infinite Mass Detonation
  // =========================================================================

  public triggerFlashPhase() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    soundEngine.playFlashSpeed();

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y *= 0.25;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();

    this.superDashDir.copy(forward);
    this.superDashTimer = 0.34;
    this.speedBoostTimer = Math.max(this.speedBoostTimer, 3.5);
    this.spawnSigilRing(this.playerPos.clone().add(new THREE.Vector3(0, -0.9, 0)), '#facc15', 6.5, 380);
    this.callbacks.onPowerUpActive('SPEED FORCE PHASE SURGE', 3.5);
  }

  public triggerFlashVortex() {
    if (!this.isMatchRunning || this.kiEnergy < 25) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 25);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playFlashSpeed();
    this.screenShake = Math.max(this.screenShake, 0.65);

    for (let i = this.witchSpells.length - 1; i >= 0; i--) {
      if (this.witchSpells[i].pos.distanceTo(this.playerPos) <= 18) {
        this.disposeSpellObject(this.witchSpells[i].mesh);
        this.witchSpells.splice(i, 1);
      }
    }

    const origin = this.playerPos.clone().add(new THREE.Vector3(0, -0.8, 0));
    this.spawnSigilRing(origin, '#facc15', 14, 480);
    this.spawnSigilRing(origin.clone().add(new THREE.Vector3(0, 0.9, 0)), '#ef4444', 11, 440);

    const dmg = this.quadDamageTimer > 0 ? 400 : 200;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      const dist = toBot.length();
      if (dist <= 16) {
        if (dist > 0.01) bot.pos.addScaledVector(toBot.normalize(), 4.2);
        bot.frozenTimer = Math.max(bot.frozenTimer, 2.5);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('SPEED VORTEX CYCLONE!', 2.6);
  }

  public triggerFlashUltimate() {
    if (!this.isMatchRunning || this.kiEnergy < 50) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 50);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.35;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playFlashSpeed();
    soundEngine.playShazamThunder();
    this.screenShake = Math.max(this.screenShake, 1.3);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 3.5),
      forward.clone().multiplyScalar(130),
      4.6
    );
    this.spawnSigilRing(this.playerPos.clone().add(new THREE.Vector3(0, -0.8, 0)), '#fde047', 18, 560);

    const dmg = this.quadDamageTimer > 0 ? 880 : 440;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 22) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('INFINITE MASS NOVA!', 3.2);
  }

  // =========================================================================
  // GREEN LANTERN ABILITIES — Emerald Ward, Meteor Construct & Oan Willpower Beam
  // =========================================================================

  public triggerLanternShield() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playLanternConstruct();

    this.armor = Math.min(100, this.armor + 55);
    this.health = Math.min(100, this.health + 20);
    this.playerBurnTimer = 0;
    this.playerWaterSlowTimer = 0;
    this.callbacks.onHealthChanged(this.health, this.armor);

    const domeGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const domeMat = new THREE.MeshBasicMaterial({
      color: '#4ade80',
      transparent: true,
      opacity: 0.45,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.copy(this.playerPos).add(new THREE.Vector3(0, -0.35, 0));
    this.scene.add(dome);
    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 650);
      dome.position.copy(this.playerPos).add(new THREE.Vector3(0, -0.35, 0));
      dome.rotation.y += 0.08;
      domeMat.opacity = 0.45 * (1 - p);
      if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
      else {
        this.scene.remove(dome);
        domeGeo.dispose();
        domeMat.dispose();
      }
    };
    requestAnimationFrame(anim);
    this.callbacks.onPowerUpActive('EMERALD RING WARD (+55 ARMOR)', 2.8);
  }

  public triggerLanternConstruct() {
    if (!this.isMatchRunning || this.kiEnergy < 25) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 25);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.3;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playLanternConstruct();
    this.screenShake = Math.max(this.screenShake, 0.9);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const impactCenter = this.playerPos.clone().addScaledVector(forward, 9);
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(impactCenter.x, impactCenter.z) : 0;
    impactCenter.y = Math.max(groundY + 0.5, impactCenter.y);

    this.worldSimulator?.onHeavyPunchThrown(impactCenter, forward.clone().multiplyScalar(105), 4.0);

    const meteorGeo = new THREE.DodecahedronGeometry(1.4, 0);
    const meteorMat = new THREE.MeshBasicMaterial({
      color: '#22c55e',
      transparent: true,
      opacity: 0.88,
      wireframe: false,
    });
    const meteor = new THREE.Mesh(meteorGeo, meteorMat);
    meteor.position.copy(impactCenter).add(new THREE.Vector3(0, 7, 0));
    this.scene.add(meteor);

    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 360);
      meteor.position.y = THREE.MathUtils.lerp(impactCenter.y + 7, impactCenter.y, p);
      meteor.rotation.y += 0.14;
      meteorMat.opacity = 0.9 * (1 - p * 0.4);
      if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
      else {
        this.scene.remove(meteor);
        meteorGeo.dispose();
        meteorMat.dispose();
      }
    };
    requestAnimationFrame(anim);
    this.spawnSigilRing(impactCenter.clone().setY(groundY + 0.15), '#4ade80', 12, 480);

    const dmg = this.quadDamageTimer > 0 ? 480 : 240;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(impactCenter) <= 13) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('EMERALD METEOR CONSTRUCT!', 2.4);
  }

  public triggerLanternBeam() {
    if (!this.isMatchRunning || this.kiEnergy < 50) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 50);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.35;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playLanternConstruct();
    soundEngine.playKamehameha();
    this.screenShake = Math.max(this.screenShake, 1.15);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 4.0),
      forward.clone().multiplyScalar(118),
      4.4
    );

    const beamGeo = new THREE.CylinderGeometry(0.6, 0.8, 32, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: '#4ade80',
      transparent: true,
      opacity: 0.94,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(this.playerPos).addScaledVector(forward, 16);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
    this.scene.add(beam);
    setTimeout(() => {
      this.scene.remove(beam);
      beamGeo.dispose();
      beamMat.dispose();
    }, 580);

    const dmg = this.quadDamageTimer > 0 ? 880 : 440;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      if (toBot.length() < 34 && forward.angleTo(toBot) < 0.45) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('OAN WILLPOWER BEAM!', 3.0);
  }

  // =========================================================================
  // SHAZAM ABILITIES — Bolt of Zeus & SHAZAM! Sky Thunder
  // =========================================================================

  private spawnSkyLightningPillar(center: THREE.Vector3, colorHex: string, radius = 0.75, durationMs = 460) {
    const pillarGeo = new THREE.CylinderGeometry(radius, radius * 1.35, 36, 12);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(center.x, center.y + 18, center.z);
    this.scene.add(pillar);

    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / durationMs);
      pillar.scale.set(1 - p * 0.4, 1, 1 - p * 0.4);
      pillarMat.opacity = 0.94 * (1 - p);
      if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
      else {
        this.scene.remove(pillar);
        pillarGeo.dispose();
        pillarMat.dispose();
      }
    };
    requestAnimationFrame(anim);
  }

  public triggerShazamBolt() {
    if (!this.isMatchRunning || this.kiEnergy < 25) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 25);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playShazamThunder();
    this.screenShake = Math.max(this.screenShake, 0.95);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const strikeCenter = this.playerPos.clone().addScaledVector(forward, 9);
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(strikeCenter.x, strikeCenter.z) : 0;
    strikeCenter.y = groundY;

    this.worldSimulator?.onHeavyPunchThrown(strikeCenter, forward.clone().multiplyScalar(100), 3.8);
    this.spawnSkyLightningPillar(strikeCenter, '#fde047', 0.85, 480);
    this.spawnSigilRing(strikeCenter.clone().add(new THREE.Vector3(0, 0.2, 0)), '#fef08a', 11, 460);

    const dmg = this.quadDamageTimer > 0 ? 640 : 320;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(strikeCenter) <= 13) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('BOLT OF ZEUS!', 2.4);
  }

  public triggerShazamUltimate() {
    if (!this.isMatchRunning || this.kiEnergy < 50) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 50);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.35;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playShazamThunder();
    this.screenShake = Math.max(this.screenShake, 1.45);

    this.armor = Math.min(100, this.armor + 25);
    this.callbacks.onHealthChanged(this.health, this.armor);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 3.0),
      forward.clone().multiplyScalar(130),
      4.9
    );

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const baseStrike = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);
    this.spawnSkyLightningPillar(baseStrike, '#fef08a', 1.25, 560);
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      this.spawnSkyLightningPillar(
        new THREE.Vector3(baseStrike.x + Math.cos(ang) * 6.5, groundY, baseStrike.z + Math.sin(ang) * 6.5),
        '#facc15',
        0.65,
        520
      );
    }
    this.spawnSigilRing(baseStrike.clone().add(new THREE.Vector3(0, 0.25, 0)), '#ef4444', 16, 560);

    const dmg = this.quadDamageTimer > 0 ? 900 : 450;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 22) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('SHAZAM! THUNDERFALL (+25 ARMOR)', 3.2);
  }

  // =========================================================================
  // THOR ODINSON ABILITIES — Mjolnir Throw, Thunder Slam & Bifrost Pillar
  // =========================================================================

  public triggerThorHammerThrow() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    soundEngine.playThorMjolnir();
    this.screenShake = Math.max(this.screenShake, 0.7);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const origin = this.playerPos.clone().addScaledVector(forward, 1.4);
    const target = this.playerPos.clone().addScaledVector(forward, 22);

    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 4.0),
      forward.clone().multiplyScalar(92),
      3.5
    );

    const hammerGeo = new THREE.BoxGeometry(0.55, 0.36, 0.8);
    const hammerMat = new THREE.MeshBasicMaterial({ color: '#7dd3fc' });
    const proj = new THREE.Mesh(hammerGeo, hammerMat);
    proj.position.copy(origin);
    this.scene.add(proj);
    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 360);
      const pingPong = p < 0.5 ? p * 2 : (1 - p) * 2;
      proj.position.lerpVectors(origin, target, pingPong);
      proj.rotation.y += 0.45;
      proj.rotation.x += 0.35;
      if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
      else {
        this.scene.remove(proj);
        hammerGeo.dispose();
        hammerMat.dispose();
      }
    };
    requestAnimationFrame(anim);

    const dmg = this.quadDamageTimer > 0 ? 520 : 260;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      if (toBot.length() <= 24 && forward.angleTo(toBot) < 0.48) {
        bot.pos.addScaledVector(forward, 3.8);
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('MJOLNIR THUNDER TOSS!', 2.0);
  }

  public triggerThorThunderSlam() {
    if (!this.isMatchRunning || this.kiEnergy < 25) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 25);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.3;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playThorMjolnir();
    soundEngine.playShazamThunder();
    this.screenShake = Math.max(this.screenShake, 1.0);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const slamPos = new THREE.Vector3(this.playerPos.x, groundY + 0.15, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(slamPos, new THREE.Vector3(0, -110, 0), 4.2);
    this.spawnSigilRing(slamPos, '#38bdf8', 15, 520);
    this.spawnSigilRing(slamPos.clone().add(new THREE.Vector3(0, 0.3, 0)), '#e0f2fe', 11, 440);

    const dmg = this.quadDamageTimer > 0 ? 440 : 220;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 18) {
        bot.frozenTimer = Math.max(bot.frozenTimer, 3.5);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('ASGARDIAN THUNDER SLAM!', 2.8);
  }

  public triggerThorBifrost() {
    if (!this.isMatchRunning || this.kiEnergy < 50) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 50);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.35;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playShazamThunder();
    soundEngine.playThorMjolnir();
    this.screenShake = Math.max(this.screenShake, 1.5);

    this.armor = Math.min(100, this.armor + 25);
    this.health = Math.min(100, this.health + 25);
    this.callbacks.onHealthChanged(this.health, this.armor);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);

    this.worldSimulator?.onHeavyPunchThrown(center, forward.clone().multiplyScalar(135), 5.0);
    this.spawnSkyLightningPillar(center, '#38bdf8', 2.4, 620);
    this.spawnSkyLightningPillar(center, '#fef08a', 1.0, 560);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.2, 0)), '#38bdf8', 20, 620);

    const dmg = this.quadDamageTimer > 0 ? 960 : 480;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 24) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('BIFROST ODINFORCE STORM!', 3.4);
  }

  // =========================================================================
  // SILVESTER A.JAIS — 15 OMEGA SOVEREIGN POWERS (+ OMNI-FLIGHT = 15 POWERS)
  // =========================================================================

  // Power #2: Chronos Time-Freeze
  public triggerSilvesterTimeFreeze() {
    if (!this.isMatchRunning || this.kiEnergy < 15) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 15);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('time');
    this.screenShake = Math.max(this.screenShake, 0.75);

    this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
    this.witchSpells = [];

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.25, this.playerPos.z), '#38bdf8', 24, 580);
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 1.2, this.playerPos.z), '#fbbf24', 18, 520);

    const dmg = this.quadDamageTimer > 0 ? 280 : 140;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 26) {
        bot.frozenTimer = Math.max(bot.frozenTimer, 5.5);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('2. CHRONOS TIME-FREEZE (5.5s)!', 2.8);
  }

  // Power #3: Black Hole Singularity
  public triggerSilvesterSingularity() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('singularity');
    this.screenShake = Math.max(this.screenShake, 1.15);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const center = this.playerPos.clone().addScaledVector(forward, 11);
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(center.x, center.z) : 0;
    center.y = groundY + 2.0;

    const coreGeo = new THREE.SphereGeometry(1.6, 18, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: '#09090b' });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(center);
    this.scene.add(core);

    const ringGeo = new THREE.TorusGeometry(2.6, 0.22, 10, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#c084fc', transparent: true, opacity: 0.92 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(center);
    ring.rotation.x = Math.PI / 2.6;
    this.scene.add(ring);

    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 760);
      const scale = p < 0.7 ? 1 + p * 0.9 : Math.max(0.05, (1 - p) * 5.2);
      core.scale.setScalar(scale);
      ring.scale.setScalar(scale * 1.15);
      ring.rotation.z += 0.25;
      ringMat.opacity = 0.92 * (1 - p * 0.65);
      if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
      else {
        this.scene.remove(core);
        this.scene.remove(ring);
        coreGeo.dispose();
        coreMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
      }
    };
    requestAnimationFrame(anim);

    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -125, 0), 4.6);

    const dmg = this.quadDamageTimer > 0 ? 760 : 380;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(center) <= 20) {
        const pull = center.clone().sub(bot.pos).setY(0).multiplyScalar(0.65);
        bot.pos.add(pull);
        bot.frozenTimer = Math.max(bot.frozenTimer, 2.5);
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('3. BLACK HOLE SINGULARITY!', 2.6);
  }

  // Power #4: Celestial Meteor Rain
  public triggerSilvesterMeteorRain() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('nova');
    this.screenShake = Math.max(this.screenShake, 1.25);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const focus = this.playerPos.clone().addScaledVector(forward, 12);
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(focus.x, focus.z) : 0;

    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const dist = i === 0 ? 0 : 5.5;
      const targetPos = new THREE.Vector3(
        focus.x + Math.cos(ang) * dist,
        groundY + 0.3,
        focus.z + Math.sin(ang) * dist
      );
      const metGeo = new THREE.DodecahedronGeometry(1.0, 0);
      const metMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#fb923c' : '#fde047' });
      const meteor = new THREE.Mesh(metGeo, metMat);
      meteor.position.set(targetPos.x + (i - 2) * 1.4, groundY + 19, targetPos.z);
      this.scene.add(meteor);

      const startPos = meteor.position.clone();
      const start = performance.now() + i * 70;
      const anim = () => {
        const elapsed = performance.now() - start;
        if (elapsed < 0) {
          if (!this.isDisposed) requestAnimationFrame(anim);
          return;
        }
        const p = Math.min(1, elapsed / 320);
        meteor.position.lerpVectors(startPos, targetPos, p);
        meteor.rotation.x += 0.25;
        meteor.rotation.y += 0.2;
        if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
        else {
          this.scene.remove(meteor);
          metGeo.dispose();
          metMat.dispose();
          this.spawnSigilRing(targetPos, '#fb923c', 7.5, 360);
        }
      };
      requestAnimationFrame(anim);
    }

    this.worldSimulator?.onHeavyPunchThrown(
      new THREE.Vector3(focus.x, groundY + 0.5, focus.z),
      forward.clone().multiplyScalar(130),
      4.8
    );

    const dmg = this.quadDamageTimer > 0 ? 840 : 420;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(focus) <= 18) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('4. CELESTIAL METEOR RAIN!', 2.8);
  }

  // Power #5: Divine Overdrive (4x DMG + Hyper-Speed + Full Restore)
  public triggerSilvesterDivineOverdrive() {
    if (!this.isMatchRunning || this.kiEnergy < 25) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 25);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('omega');
    this.screenShake = Math.max(this.screenShake, 0.9);

    this.quadDamageTimer = 14;
    this.speedBoostTimer = 14;
    this.health = 100;
    this.armor = 100;
    this.playerBurnTimer = 0;
    this.playerWaterSlowTimer = 0;
    this.callbacks.onHealthChanged(100, 100);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.3, this.playerPos.z), '#fde047', 14, 520);
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 1.0, this.playerPos.z), '#38bdf8', 11, 520);
    this.callbacks.onPowerUpActive('5. DIVINE OVERDRIVE (4X DMG + MAX HP/ARMOR)!', 3.4);
  }

  // Power #6: Astral Mirror Cloak (+75 Armor, +35 HP, Projectiles Cleared)
  public triggerSilvesterMirrorCloak() {
    if (!this.isMatchRunning || this.kiEnergy < 15) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 15);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('cloak');

    this.armor = Math.min(100, this.armor + 75);
    this.health = Math.min(100, this.health + 35);
    this.playerBurnTimer = 0;
    this.playerWaterSlowTimer = 0;
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));

    this.witchSpells.forEach(s => {
      if (s.pos.distanceTo(this.playerPos) < 16) this.disposeSpellObject(s.mesh);
    });
    this.witchSpells = this.witchSpells.filter(s => s.pos.distanceTo(this.playerPos) >= 16);

    const shieldGeo = new THREE.IcosahedronGeometry(2.3, 1);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: '#34d399',
      wireframe: true,
      transparent: true,
      opacity: 0.78,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.copy(this.playerPos);
    this.scene.add(shield);
    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 720);
      shield.position.copy(this.playerPos);
      shield.rotation.y += 0.14;
      shieldMat.opacity = 0.78 * (1 - p);
      if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
      else {
        this.scene.remove(shield);
        shieldGeo.dispose();
        shieldMat.dispose();
      }
    };
    requestAnimationFrame(anim);
    this.callbacks.onPowerUpActive('6. ASTRAL MIRROR CLOAK (+75 ARMOR/+35 HP)', 2.8);
  }

  // Power #7: Tachyon Flash Step (24m Quantum Warp)
  public triggerSilvesterTachyonStep() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    soundEngine.playSilvesterOmega('warp');
    this.screenShake = Math.max(this.screenShake, 0.45);

    const startPos = this.playerPos.clone();
    this.spawnSigilRing(startPos.clone().setY(startPos.y - 1.1), '#38bdf8', 4.5, 360);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.movePlayerBySweptStep(forward, 24);

    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 1.1), '#fde047', 6.5, 400);
    const dmg = this.quadDamageTimer > 0 ? 240 : 120;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 8) {
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('7. TACHYON FLASH STEP (24m WARP)!', 1.8);
  }

  // Power #8: Solar Supernova
  public triggerSilvesterSolarNova() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('nova');
    this.screenShake = Math.max(this.screenShake, 1.35);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY + 0.3, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -140, 0), 5.2);
    this.spawnSigilRing(center, '#fde047', 22, 580);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.8, 0)), '#fb923c', 16, 480);

    const dmg = this.quadDamageTimer > 0 ? 920 : 460;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const dist = bot.pos.distanceTo(this.playerPos);
      if (dist <= 24) {
        const push = bot.pos.clone().sub(this.playerPos).setY(0).normalize().multiplyScalar(8);
        bot.pos.add(push);
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('8. SOLAR SUPERNOVA DETONATION!', 2.8);
  }

  // Power #9: Absolute Zero Blizzard
  public triggerSilvesterZeroBlizzard() {
    if (!this.isMatchRunning || this.kiEnergy < 15) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 15);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('ice');
    this.screenShake = Math.max(this.screenShake, 0.75);

    const sphereGeo = new THREE.SphereGeometry(14, 18, 12);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: '#67e8f9',
      wireframe: true,
      transparent: true,
      opacity: 0.68,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.copy(this.playerPos);
    this.scene.add(sphere);
    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 600);
      sphere.scale.setScalar(0.5 + p * 0.9);
      sphere.rotation.y += 0.12;
      sphereMat.opacity = 0.68 * (1 - p);
      if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
      else {
        this.scene.remove(sphere);
        sphereGeo.dispose();
        sphereMat.dispose();
      }
    };
    requestAnimationFrame(anim);

    const dmg = this.quadDamageTimer > 0 ? 620 : 310;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 22) {
        bot.frozenTimer = Math.max(bot.frozenTimer, 5.0);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('9. ABSOLUTE ZERO BLIZZARD (5s FREEZE)!', 2.8);
  }

  // Power #10: Hellfire Judgment
  public triggerSilvesterHellfire() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('fire');
    this.screenShake = Math.max(this.screenShake, 1.0);

    const alive = this.bots.filter(b => b.isAlive && b.pos.distanceTo(this.playerPos) <= 24);
    alive.forEach(bot => this.spawnSkyLightningPillar(bot.pos, '#f97316', 1.15, 480));
    if (alive.length === 0) {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.spawnSkyLightningPillar(this.playerPos.clone().addScaledVector(forward, 10), '#f97316', 1.5, 480);
    }

    const dmg = this.quadDamageTimer > 0 ? 780 : 390;
    alive.forEach(bot => {
      this.damageBot(bot, dmg, true);
      this.callbacks.onHitmarker(true, dmg);
      this.totalDamage += dmg;
      this.shotsHit += 1;
    });
    this.callbacks.onPowerUpActive('10. HELLFIRE JUDGMENT PILLARS!', 2.6);
  }

  // Power #11: Thunder God Chain
  public triggerSilvesterThunderChain() {
    if (!this.isMatchRunning || this.kiEnergy < 15) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 15);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('thunder');
    this.screenShake = Math.max(this.screenShake, 0.9);

    const targets = this.bots
      .filter(b => b.isAlive && b.pos.distanceTo(this.playerPos) <= 24)
      .slice(0, 6);
    const dmg = this.quadDamageTimer > 0 ? 720 : 360;
    targets.forEach((bot, idx) => {
      this.spawnSkyLightningPillar(bot.pos, idx % 2 === 0 ? '#38bdf8' : '#fef08a', 0.85, 440);
      this.damageBot(bot, dmg, true);
      this.callbacks.onHitmarker(true, dmg);
      this.totalDamage += dmg;
      this.shotsHit += 1;
    });
    if (targets.length === 0) {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.spawnSkyLightningPillar(this.playerPos.clone().addScaledVector(forward, 9), '#38bdf8', 0.9, 440);
    }
    this.callbacks.onPowerUpActive('11. THUNDER GOD CHAIN!', 2.4);
  }

  // Power #12: Soul Drain Eclipse
  public triggerSilvesterSoulDrain() {
    if (!this.isMatchRunning || this.kiEnergy < 15) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 15);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('drain');
    this.screenShake = Math.max(this.screenShake, 0.65);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.3, this.playerPos.z), '#f43f5e', 18, 520);

    let drained = 0;
    const dmg = this.quadDamageTimer > 0 ? 560 : 280;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 20) {
        drained += 1;
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });

    const healBonus = drained > 0 ? 45 : 25;
    this.health = Math.min(100, this.health + healBonus);
    this.armor = Math.min(100, this.armor + healBonus);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    this.callbacks.onPowerUpActive(`12. SOUL DRAIN ECLIPSE (+${healBonus} HP/ARMOR)!`, 2.6);
  }

  // Power #13: Reality Dimensional Slash
  public triggerSilvesterRealitySlash() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.32;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('slash');
    this.screenShake = Math.max(this.screenShake, 1.15);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.worldSimulator?.onHeavyPunchThrown(
      this.playerPos.clone().addScaledVector(forward, 4.0),
      forward.clone().multiplyScalar(135),
      4.6
    );

    const arcGeo = new THREE.TorusGeometry(4.2, 0.35, 10, 28, Math.PI * 1.15);
    const arcMat = new THREE.MeshBasicMaterial({ color: '#c084fc', transparent: true, opacity: 0.95 });
    const slash = new THREE.Mesh(arcGeo, arcMat);
    slash.position.copy(this.playerPos).addScaledVector(forward, 3.0);
    slash.lookAt(this.playerPos.clone().addScaledVector(forward, 20));
    slash.rotateZ(-Math.PI * 0.55);
    this.scene.add(slash);

    const startPos = slash.position.clone();
    const endPos = this.playerPos.clone().addScaledVector(forward, 28);
    const start = performance.now();
    const anim = () => {
      const p = Math.min(1, (performance.now() - start) / 420);
      slash.position.lerpVectors(startPos, endPos, p);
      slash.scale.setScalar(1 + p * 0.8);
      arcMat.opacity = 0.95 * (1 - p);
      if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
      else {
        this.scene.remove(slash);
        arcGeo.dispose();
        arcMat.dispose();
      }
    };
    requestAnimationFrame(anim);

    const dmg = this.quadDamageTimer > 0 ? 1040 : 520;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      const toBot = bot.pos.clone().sub(this.playerPos);
      if (toBot.length() <= 30 && forward.angleTo(toBot) < 0.72) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('13. REALITY DIMENSIONAL SLASH!', 2.6);
  }

  // Power #14: Sovereign Conqueror's Roar (Strips Enemy Armor + Stuns + +35 Energy)
  public triggerSilvesterSovereignRoar() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    this.kiEnergy = Math.min(100, this.kiEnergy + 35);
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('roar');
    this.screenShake = Math.max(this.screenShake, 1.0);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.3, this.playerPos.z), '#fbbf24', 20, 520);

    const dmg = this.quadDamageTimer > 0 ? 360 : 180;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 22) {
        bot.armor = 0;
        bot.frozenTimer = Math.max(bot.frozenTimer, 3.0);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('14. SOVEREIGN ROAR (+35 ENERGY & ARMOR SHATTER)!', 2.8);
  }

  // Power #15: OMEGA APOCALYPSE (Ultimate Signature)
  public triggerSilvesterOmegaApocalypse() {
    if (!this.isMatchRunning || this.kiEnergy < 40) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 40);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.4;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playSilvesterOmega('omega');
    this.screenShake = Math.max(this.screenShake, 1.85);

    this.health = Math.min(100, this.health + 35);
    this.armor = Math.min(100, this.armor + 35);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);

    this.worldSimulator?.onHeavyPunchThrown(center, forward.clone().multiplyScalar(155), 5.8);
    this.spawnSkyLightningPillar(center, '#38bdf8', 2.6, 680);
    this.spawnSkyLightningPillar(center, '#fde047', 1.2, 620);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      this.spawnSkyLightningPillar(
        new THREE.Vector3(center.x + Math.cos(ang) * 9.5, groundY, center.z + Math.sin(ang) * 9.5),
        i % 2 === 0 ? '#c084fc' : '#fde047',
        0.95,
        620
      );
    }
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.3, 0)), '#fde047', 26, 660);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.8, 0)), '#38bdf8', 20, 620);

    const dmg = this.quadDamageTimer > 0 ? 1998 : 999;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 32) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('15. OMEGA APOCALYPSE UNLEASHED!', 3.6);
  }

  // =========================================================================
  // DRE — 808 Sonic Bass Blaster & Equalizer Abilities
  // =========================================================================

  public triggerDreBassDrop() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playDreBass(true);
    this.screenShake = Math.max(this.screenShake, 0.95);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY + 0.2, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -100, 0), 3.6);
    this.spawnSigilRing(center, '#f97316', 16, 480);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.5, 0)), '#fbbf24', 11, 420);

    const dmg = this.quadDamageTimer > 0 ? 520 : 260;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 18) {
        const push = bot.pos.clone().sub(this.playerPos).setY(0).normalize().multiplyScalar(6.5);
        bot.pos.add(push);
        bot.frozenTimer = Math.max(bot.frozenTimer, 3.0);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('360° 808 BASS DROP!', 2.4);
  }

  public triggerDreSubStep() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    soundEngine.playDreBass(false);
    this.screenShake = Math.max(this.screenShake, 0.45);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();

    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 1.0), '#f97316', 5, 340);
    this.movePlayerBySweptStep(forward, 18);

    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 1.0), '#fbbf24', 6.5, 380);
    this.callbacks.onPowerUpActive('SUB-STEP WARP!', 1.8);
  }

  public triggerDreAmplify() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playDreBass(true);
    this.armor = Math.min(100, this.armor + 50);
    this.quadDamageTimer = Math.max(this.quadDamageTimer, 8);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 1.0), '#fbbf24', 9, 440);
    this.callbacks.onPowerUpActive('AMPLIFY! (+50 ARMOR & 4X BASS)', 2.8);
  }

  public triggerDreOmegaMixtape() {
    if (!this.isMatchRunning || this.kiEnergy < 45) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 45);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.35;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playDreBass(true);
    soundEngine.playShockwaveImpact(4.2);
    this.screenShake = Math.max(this.screenShake, 1.45);

    this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
    this.witchSpells = [];

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -130, 0), 4.8);
    this.spawnSkyLightningPillar(center, '#f97316', 1.4, 520);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.25, 0)), '#fbbf24', 22, 580);

    const dmg = this.quadDamageTimer > 0 ? 1040 : 520;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 26) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('OMEGA MIXTAPE FINALE!', 3.2);
  }

  // =========================================================================
  // THE TRUTH — Veritas All-Seeing Eye Abilities (Flier)
  // =========================================================================

  public triggerTruthSeal() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playTruthChime();
    this.screenShake = Math.max(this.screenShake, 0.7);

    this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
    this.witchSpells = [];

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.25, this.playerPos.z), '#fbbf24', 22, 540);

    const dmg = this.quadDamageTimer > 0 ? 480 : 240;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 22) {
        bot.frozenTimer = Math.max(bot.frozenTimer, 4.5);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('JUDGMENT SEAL (4.5s FREEZE)!', 2.6);
  }

  public triggerTruthVeilShift() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    soundEngine.playTruthChime();
    this.screenShake = Math.max(this.screenShake, 0.35);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 1.0), '#fef08a', 4.5, 340);
    this.movePlayerBySweptStep(forward, 20);
    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 1.0), '#fbbf24', 6, 380);
    this.callbacks.onPowerUpActive('VEIL SHIFT (20m BLINK)!', 1.8);
  }

  public triggerTruthTrueSight() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    this.kiEnergy = Math.min(100, this.kiEnergy + 35);
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playTruthChime();
    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.8), '#38bdf8', 18, 460);

    const dmg = this.quadDamageTimer > 0 ? 320 : 160;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 20) {
        bot.armor = 0;
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('TRUE SIGHT (ARMOR STRIPPED +35 VERITAS)!', 2.6);
  }

  public triggerTruthAbsolute() {
    if (!this.isMatchRunning || this.kiEnergy < 45) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 45);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.35;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playTruthChime();
    soundEngine.playShazamThunder();
    this.screenShake = Math.max(this.screenShake, 1.35);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, forward.clone().multiplyScalar(135), 4.8);
    this.spawnSkyLightningPillar(center, '#fde047', 1.9, 600);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.3, 0)), '#fbbf24', 24, 580);

    const dmg = this.quadDamageTimer > 0 ? 1120 : 560;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 26) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('ABSOLUTE TRUTH UNLEASHED!', 3.2);
  }

  // =========================================================================
  // HEILIEA — Starlight Valkyrie Abilities (Flier)
  // =========================================================================

  public triggerHeilieaSeraphHeal() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playHeilieaChord();

    this.health = Math.min(100, this.health + 60);
    this.armor = Math.min(100, this.armor + 45);
    this.playerBurnTimer = 0;
    this.playerWaterSlowTimer = 0;
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));

    this.witchSpells.forEach(s => {
      if (s.pos.distanceTo(this.playerPos) < 16) this.disposeSpellObject(s.mesh);
    });
    this.witchSpells = this.witchSpells.filter(s => s.pos.distanceTo(this.playerPos) >= 16);
    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.8), '#f472b6', 12, 480);
    this.callbacks.onPowerUpActive('SERAPH HEAL (+60 HP / +45 ARMOR)!', 2.6);
  }

  public triggerHeilieaStarfall() {
    if (!this.isMatchRunning || this.kiEnergy < 25) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 25);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playHeilieaChord();
    this.screenShake = Math.max(this.screenShake, 0.95);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const focus = this.playerPos.clone().addScaledVector(forward, 11);
    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(focus.x, focus.z) : 0;

    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const targetPos = new THREE.Vector3(
        focus.x + Math.cos(ang) * (i === 0 ? 0 : 4.5),
        groundY + 0.3,
        focus.z + Math.sin(ang) * (i === 0 ? 0 : 4.5)
      );
      const starGeo = new THREE.OctahedronGeometry(0.85, 0);
      const starMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#f472b6' : '#fde047' });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(targetPos.x, groundY + 18, targetPos.z);
      this.scene.add(star);

      const startPos = star.position.clone();
      const start = performance.now() + i * 60;
      const anim = () => {
        const elapsed = performance.now() - start;
        if (elapsed < 0) {
          if (!this.isDisposed) requestAnimationFrame(anim);
          return;
        }
        const p = Math.min(1, elapsed / 300);
        star.position.lerpVectors(startPos, targetPos, p);
        star.rotation.y += 0.25;
        if (p < 1 && !this.isDisposed) requestAnimationFrame(anim);
        else {
          this.scene.remove(star);
          starGeo.dispose();
          starMat.dispose();
          this.spawnSigilRing(targetPos, '#f472b6', 6.5, 340);
        }
      };
      requestAnimationFrame(anim);
    }

    const dmg = this.quadDamageTimer > 0 ? 680 : 340;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(focus) <= 16) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('STARFALL BARRAGE!', 2.6);
  }

  public triggerHeilieaCelestialNova() {
    if (!this.isMatchRunning || this.kiEnergy < 45) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 45);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.35;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playHeilieaChord();
    soundEngine.playShockwaveImpact(4.0);
    this.screenShake = Math.max(this.screenShake, 1.3);

    this.health = 100;
    this.armor = Math.min(100, this.armor + 50);
    this.callbacks.onHealthChanged(100, Math.round(this.armor));

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -130, 0), 4.8);
    this.spawnSkyLightningPillar(center, '#f472b6', 1.6, 560);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.3, 0)), '#fbcfe8', 24, 580);

    const dmg = this.quadDamageTimer > 0 ? 1000 : 500;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 26) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('CELESTIAL NOVA (FULL HEAL)!', 3.2);
  }

  // =========================================================================
  // THE BABY — Cosmic Toddler Titan Abilities
  // =========================================================================

  public triggerBabyTantrum() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playBabyTantrum(true);
    this.screenShake = Math.max(this.screenShake, 1.0);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY + 0.2, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -105, 0), 4.0);
    this.spawnSigilRing(center, '#38bdf8', 17, 480);

    const dmg = this.quadDamageTimer > 0 ? 580 : 290;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 18) {
        bot.frozenTimer = Math.max(bot.frozenTimer, 3.0);
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('TANTRUM STOMP!', 2.4);
  }

  public triggerBabyCrawlZoom() {
    if (!this.isMatchRunning || this.superDashTimer > 0.05) return;
    this.abilitiesUsed += 1;
    soundEngine.playBabyTantrum(false);
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();
    this.superDashDir.copy(forward);
    this.superDashTimer = 0.34;
    this.speedBoostTimer = Math.max(this.speedBoostTimer, 3.5);
    this.callbacks.onPowerUpActive('CRAWL ZOOM (SUPERSONIC)!', 2.0);
  }

  public triggerBabyNapShield() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playPowerUp('armor');
    this.armor = Math.min(100, this.armor + 55);
    this.health = Math.min(100, this.health + 30);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.8), '#38bdf8', 9, 440);
    this.callbacks.onPowerUpActive('NAP TIME SHIELD (+55 ARMOR / +30 HP)!', 2.6);
  }

  public triggerBabyCryingWave() {
    if (!this.isMatchRunning || this.kiEnergy < 45) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 45);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.36;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playBabyTantrum(true);
    soundEngine.playShockwaveImpact(4.6);
    this.screenShake = Math.max(this.screenShake, 1.55);

    this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
    this.witchSpells = [];

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY + 0.25, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -145, 0), 5.2);
    this.spawnSigilRing(center, '#38bdf8', 26, 620);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.8, 0)), '#fde047', 19, 540);

    const dmg = this.quadDamageTimer > 0 ? 1160 : 580;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 28) {
        const push = bot.pos.clone().sub(this.playerPos).setY(0).normalize().multiplyScalar(9);
        bot.pos.add(push);
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('MEGA CRYING WAVE!', 3.2);
  }

  // =========================================================================
  // ZENITSU AGATSUMA — Thunder Breathing Abilities
  // =========================================================================

  public triggerZenitsuThunderclap() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.3;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playZenitsuThunder(true);
    this.screenShake = Math.max(this.screenShake, 0.95);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();

    const startPos = this.playerPos.clone();
    this.movePlayerBySweptStep(forward, 22);

    this.spawnSigilRing(startPos.clone().setY(startPos.y - 1.0), '#facc15', 7, 380);
    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 1.0), '#fde047', 12, 440);
    this.worldSimulator?.onHeavyPunchThrown(this.playerPos, forward.clone().multiplyScalar(115), 4.0);

    const dmg = this.quadDamageTimer > 0 ? 680 : 340;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 14 || bot.pos.distanceTo(startPos) <= 12) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('FIRST FORM: THUNDERCLAP & FLASH!', 2.4);
  }

  public triggerZenitsuSixfold() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    soundEngine.playZenitsuThunder(true);
    this.screenShake = Math.max(this.screenShake, 0.8);

    this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
    this.witchSpells = [];

    const dmg = this.quadDamageTimer > 0 ? 540 : 270;
    const targets = this.bots.filter(b => b.isAlive && b.pos.distanceTo(this.playerPos) <= 22).slice(0, 6);
    targets.forEach(bot => {
      this.spawnSkyLightningPillar(bot.pos, '#facc15', 0.75, 420);
      bot.frozenTimer = Math.max(bot.frozenTimer, 2.5);
      this.damageBot(bot, dmg, true);
      this.callbacks.onHitmarker(true, dmg);
      this.totalDamage += dmg;
      this.shotsHit += 1;
    });
    if (targets.length === 0) {
      this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.8), '#facc15', 14, 420);
    }
    this.callbacks.onPowerUpActive('THUNDERCLAP & FLASH: SIXFOLD!', 2.2);
  }

  public triggerZenitsuFlamingDragon() {
    if (!this.isMatchRunning || this.kiEnergy < 45) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 45);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.36;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playZenitsuThunder(true);
    soundEngine.playShazamThunder();
    this.screenShake = Math.max(this.screenShake, 1.5);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -140, 0), 5.0);
    this.spawnSkyLightningPillar(center, '#fde047', 1.8, 600);
    this.spawnSkyLightningPillar(center, '#f97316', 0.9, 540);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.3, 0)), '#facc15', 24, 580);

    const dmg = this.quadDamageTimer > 0 ? 1240 : 620;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 26) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('SEVENTH FORM: FLAMING THUNDER GOD!', 3.2);
  }

  // =========================================================================
  // TANJIRO KAMADO — Water Breathing & Hinokami Kagura Abilities
  // =========================================================================

  public triggerTanjiroWaterWheel() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playTanjiroBreath(false);
    this.screenShake = Math.max(this.screenShake, 0.8);

    this.armor = Math.min(100, this.armor + 25);
    this.playerBurnTimer = 0;
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
    this.witchSpells = [];

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.3, this.playerPos.z), '#38bdf8', 18, 520);

    const dmg = this.quadDamageTimer > 0 ? 560 : 280;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 18) {
        this.damageBot(bot, dmg, false);
        this.callbacks.onHitmarker(false, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('WATER BREATHING: CONSTANT FLUX (+25 ARMOR)!', 2.4);
  }

  public triggerTanjiroHinokamiDash() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    soundEngine.playTanjiroBreath(true);
    this.screenShake = Math.max(this.screenShake, 0.75);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();

    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.9), '#ef4444', 6, 360);
    this.movePlayerBySweptStep(forward, 16);

    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.9), '#f97316', 11, 440);
    this.worldSimulator?.onHeavyPunchThrown(this.playerPos, forward.clone().multiplyScalar(105), 3.8);

    const dmg = this.quadDamageTimer > 0 ? 660 : 330;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 14) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('HINOKAMI KAGURA: DANCE!', 2.4);
  }

  public triggerTanjiroSunDragon() {
    if (!this.isMatchRunning || this.kiEnergy < 45) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 45);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.36;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playTanjiroBreath(true);
    soundEngine.playShockwaveImpact(4.4);
    this.screenShake = Math.max(this.screenShake, 1.4);

    this.health = Math.min(100, this.health + 35);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -135, 0), 5.0);
    this.spawnSkyLightningPillar(center, '#ef4444', 1.5, 580);
    this.spawnSkyLightningPillar(center, '#f97316', 0.9, 540);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.3, 0)), '#fde047', 23, 560);

    const dmg = this.quadDamageTimer > 0 ? 1200 : 600;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 25) {
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('SUN HALO DRAGON HEAD DANCE (+35 HP)!', 3.2);
  }

  // =========================================================================
  // MUZAN KIBUTSUJI — Demon King Biokinesis Abilities
  // =========================================================================

  public triggerMuzanWhipStorm() {
    if (!this.isMatchRunning || this.kiEnergy < 20) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 20);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.3;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playMuzanBlood(true);
    this.screenShake = Math.max(this.screenShake, 0.95);

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.3, this.playerPos.z), '#f43f5e', 17, 500);

    let hitCount = 0;
    const dmg = this.quadDamageTimer > 0 ? 620 : 310;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 17) {
        hitCount += 1;
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });

    const drainHeal = hitCount > 0 ? 30 : 15;
    this.health = Math.min(100, this.health + drainHeal);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    this.callbacks.onPowerUpActive(`BIOKINESIS WHIP STORM (+${drainHeal} HP)!`, 2.6);
  }

  public triggerMuzanBloodStep() {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    soundEngine.playMuzanBlood(false);
    this.screenShake = Math.max(this.screenShake, 0.45);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();

    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.9), '#be123c', 5.5, 340);
    this.movePlayerBySweptStep(forward, 18);

    this.armor = Math.min(100, this.armor + 35);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.9), '#f43f5e', 7, 380);
    this.callbacks.onPowerUpActive('CRIMSON MIST STEP (+35 ARMOR)!', 2.0);
  }

  public triggerMuzanShockwave() {
    if (!this.isMatchRunning || this.kiEnergy < 45) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - 45);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.36;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    soundEngine.playMuzanBlood(true);
    soundEngine.playShockwaveImpact(4.5);
    this.screenShake = Math.max(this.screenShake, 1.55);

    this.health = Math.min(100, this.health + 45);
    this.armor = Math.min(100, this.armor + 35);
    this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -145, 0), 5.2);
    this.spawnSkyLightningPillar(center, '#be123c', 1.7, 580);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.3, 0)), '#f43f5e', 26, 620);

    const dmg = this.quadDamageTimer > 0 ? 1280 : 640;
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= 27) {
        bot.frozenTimer = Math.max(bot.frozenTimer, 3.0);
        this.damageBot(bot, dmg, true);
        this.callbacks.onHitmarker(true, dmg);
        this.totalDamage += dmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive('BLACK BLOOD SHOCKWAVE (+45 HP)!', 3.4);
  }

  // =========================================================================
  // PARAMETERIZED MARVEL / DC / ANIME HERO SIGNATURE SKILL ENGINE (17x3 SKILLS)
  // =========================================================================

  private executeHeroSealAoE(
    cost: number,
    radius: number,
    dmg: number,
    freezeSec: number,
    wipeSpells: boolean,
    healHp: number,
    addArmor: number,
    colorHex: string,
    banner: string,
    audioStyle: 'tech' | 'magic' | 'water' | 'flame' | 'lightning' | 'shadow' | 'impact'
  ) {
    if (!this.isMatchRunning || this.kiEnergy < cost) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - cost);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.3;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    const sndStyle =
      audioStyle === 'magic' ? 'cosmic' : audioStyle === 'lightning' ? 'energy' : audioStyle === 'impact' ? 'slash' : audioStyle;
    soundEngine.playHeroSignature(sndStyle, false);
    this.screenShake = Math.max(this.screenShake, 0.9);

    if (wipeSpells) {
      this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
      this.witchSpells = [];
    }
    if (healHp > 0 || addArmor > 0) {
      this.health = Math.min(100, this.health + healHp);
      this.armor = Math.min(100, this.armor + addArmor);
      this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    }

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    this.spawnSigilRing(new THREE.Vector3(this.playerPos.x, groundY + 0.3, this.playerPos.z), colorHex, radius, 520);

    const finalDmg = Math.round(dmg * (this.quadDamageTimer > 0 ? 2 : 1));
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= radius) {
        if (freezeSec > 0) bot.frozenTimer = Math.max(bot.frozenTimer, freezeSec);
        if (finalDmg > 0) {
          this.damageBot(bot, finalDmg, freezeSec > 0);
          this.callbacks.onHitmarker(freezeSec > 0, finalDmg);
          this.totalDamage += finalDmg;
          this.shotsHit += 1;
        }
      }
    });
    this.callbacks.onPowerUpActive(banner, 2.5);
  }

  private executeHeroDash(
    dist: number,
    dmg: number,
    addArmor: number,
    healHp: number,
    colorHex: string,
    banner: string,
    audioStyle: 'tech' | 'magic' | 'water' | 'flame' | 'lightning' | 'shadow' | 'impact'
  ) {
    if (!this.isMatchRunning) return;
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.28;
    const sndStyle =
      audioStyle === 'magic' ? 'cosmic' : audioStyle === 'lightning' ? 'energy' : audioStyle === 'impact' ? 'slash' : audioStyle;
    soundEngine.playHeroSignature(sndStyle, false);
    this.screenShake = Math.max(this.screenShake, 0.72);

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();

    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.9), colorHex, 6, 360);
    this.movePlayerBySweptStep(forward, dist);

    this.speedBoostTimer = Math.max(this.speedBoostTimer, 2.4);
    if (addArmor > 0 || healHp > 0) {
      this.health = Math.min(100, this.health + healHp);
      this.armor = Math.min(100, this.armor + addArmor);
      this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    }

    this.spawnSigilRing(this.playerPos.clone().setY(this.playerPos.y - 0.9), colorHex, 11, 440);
    this.worldSimulator?.onHeavyPunchThrown(this.playerPos, forward.clone().multiplyScalar(105), 3.6);

    if (dmg > 0) {
      const finalDmg = Math.round(dmg * (this.quadDamageTimer > 0 ? 2 : 1));
      this.bots.filter(b => b.isAlive).forEach(bot => {
        if (bot.pos.distanceTo(this.playerPos) <= 14) {
          this.damageBot(bot, finalDmg, true);
          this.callbacks.onHitmarker(true, finalDmg);
          this.totalDamage += finalDmg;
          this.shotsHit += 1;
        }
      });
    }
    this.callbacks.onPowerUpActive(banner, 2.3);
  }

  private executeHeroNova(
    cost: number,
    radius: number,
    dmg: number,
    freezeSec: number,
    healHp: number,
    addArmor: number,
    pillarHex: string,
    ringHex: string,
    banner: string,
    audioStyle: 'tech' | 'magic' | 'water' | 'flame' | 'lightning' | 'shadow' | 'impact'
  ) {
    if (!this.isMatchRunning || this.kiEnergy < cost) return;
    this.kiEnergy = Math.max(0, this.kiEnergy - cost);
    this.abilitiesUsed += 1;
    this.punchAnimTimer = 0.36;
    this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));
    const sndStyle =
      audioStyle === 'magic' ? 'cosmic' : audioStyle === 'lightning' ? 'energy' : audioStyle === 'impact' ? 'slash' : audioStyle;
    soundEngine.playHeroSignature(sndStyle, true);
    soundEngine.playShockwaveImpact(4.6);
    this.screenShake = Math.max(this.screenShake, 1.55);

    if (healHp > 0 || addArmor > 0) {
      this.health = Math.min(100, this.health + healHp);
      this.armor = Math.min(100, this.armor + addArmor);
      this.callbacks.onHealthChanged(Math.round(this.health), Math.round(this.armor));
    }
    this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
    this.witchSpells = [];

    const groundY = this.worldSimulator ? this.worldSimulator.getGroundHeightAt(this.playerPos.x, this.playerPos.z) : 0;
    const center = new THREE.Vector3(this.playerPos.x, groundY, this.playerPos.z);
    this.worldSimulator?.onHeavyPunchThrown(center, new THREE.Vector3(0, -145, 0), 5.2);
    this.spawnSkyLightningPillar(center, pillarHex, 1.6, 580);
    this.spawnSigilRing(center.clone().add(new THREE.Vector3(0, 0.3, 0)), ringHex, radius, 620);

    const finalDmg = Math.round(dmg * (this.quadDamageTimer > 0 ? 2 : 1));
    this.bots.filter(b => b.isAlive).forEach(bot => {
      if (bot.pos.distanceTo(this.playerPos) <= radius) {
        if (freezeSec > 0) bot.frozenTimer = Math.max(bot.frozenTimer, freezeSec);
        this.damageBot(bot, finalDmg, true);
        this.callbacks.onHitmarker(true, finalDmg);
        this.totalDamage += finalDmg;
        this.shotsHit += 1;
      }
    });
    this.callbacks.onPowerUpActive(banner, 3.2);
  }

  // Marvel Heroes
  public triggerIronMissiles() { this.executeHeroSealAoE(20, 20, 320, 0, true, 0, 15, '#ef4444', 'JERICHO MICRO-MISSILE SALVO!', 'tech'); }
  public triggerIronNanoShield() { this.executeHeroSealAoE(0, 10, 80, 0, true, 20, 50, '#38bdf8', 'BLEEDING EDGE NANO SHIELD (+50 ARMOR)!', 'tech'); }
  public triggerIronUnibeam() { this.executeHeroNova(45, 26, 620, 0, 0, 25, '#38bdf8', '#ef4444', 'MARK 85 ARC UNIBEAM!', 'tech'); }

  public triggerSpiderWebBomb() { this.executeHeroSealAoE(20, 18, 220, 3.8, true, 0, 15, '#f8fafc', 'WEB SNARE BOMB (LOCKED 3.8S)!', 'impact'); }
  public triggerSpiderZip() { this.executeHeroDash(20, 260, 20, 0, '#ef4444', 'IRON SPIDER WEB ZIP!', 'tech'); }
  public triggerSpiderOverload() { this.executeHeroNova(45, 24, 580, 2.5, 25, 30, '#ef4444', '#fbbf24', 'INSTANT KILL: ARACHNID SURGE!', 'impact'); }

  public triggerStrangeMirrorSeal() { this.executeHeroSealAoE(20, 20, 240, 4.0, true, 0, 20, '#f97316', 'MIRROR DIMENSION SEAL!', 'magic'); }
  public triggerStrangePortal() { this.executeHeroDash(20, 240, 25, 15, '#fb923c', 'SLING RING PORTAL WARP!', 'magic'); }
  public triggerStrangeVishanti() { this.executeHeroNova(45, 27, 640, 2.0, 25, 25, '#f97316', '#10b981', 'BOLTS OF BALTHAKK & VISHANTI!', 'magic'); }

  public triggerWandaRealityWarp() { this.executeHeroSealAoE(20, 20, 290, 3.5, true, 0, 15, '#f43f5e', 'CHAOS REALITY HEX WARP!', 'magic'); }
  public triggerWandaTelekinesis() { this.executeHeroDash(18, 300, 25, 15, '#e11d48', 'SCARLET TELEKINETIC BLINK!', 'magic'); }
  public triggerWandaChaosNova() { this.executeHeroNova(45, 28, 660, 2.5, 30, 25, '#be123c', '#f43f5e', 'SCARLET WITCH CHAOS NOVA!', 'magic'); }

  // DC Heroes
  public triggerBatmanSmoke() { this.executeHeroSealAoE(15, 18, 210, 3.2, true, 0, 35, '#94a3b8', 'CRYO-SMOKE PELLET (+35 ARMOR)!', 'tech'); }
  public triggerBatmanGrapnel() { this.executeHeroDash(18, 260, 20, 0, '#fbbf24', 'BAT-GRAPNEL ZIP STRIKE!', 'tech'); }
  public triggerBatmanHellbat() { this.executeHeroNova(45, 24, 600, 1.5, 25, 45, '#ef4444', '#fbbf24', 'HELLBAT APOKOLIPS OVERDRIVE!', 'impact'); }

  public triggerWwBracelets() { this.executeHeroSealAoE(20, 19, 310, 1.5, true, 0, 45, '#fde047', 'AEGIS BRACELET CLASH (+45 ARMOR)!', 'impact'); }
  public triggerWwLasso() { this.executeHeroDash(18, 290, 20, 10, '#facc15', 'LASSO OF TRUTH CHARGE!', 'impact'); }
  public triggerWwGodstrike() { this.executeHeroNova(45, 26, 630, 2.0, 30, 30, '#fde047', '#ef4444', 'GODKILLER THUNDERWAVE!', 'lightning'); }

  public triggerAquamanTidal() { this.executeHeroSealAoE(20, 20, 280, 2.5, true, 20, 20, '#06b6d4', 'POSEIDON TIDAL VORTEX!', 'water'); }
  public triggerAquamanSurge() { this.executeHeroDash(18, 280, 25, 10, '#38bdf8', 'ATLANTEAN HYDRO SURGE!', 'water'); }
  public triggerAquamanKraken() { this.executeHeroNova(45, 26, 620, 2.5, 25, 30, '#06b6d4', '#fbbf24', 'KARATHEN OCEAN TEMPEST!', 'water'); }

  // Anime Legends
  public triggerRimuruBeelzebuth() { this.executeHeroSealAoE(20, 22, 320, 2.5, true, 35, 30, '#38bdf8', 'GLUTTONOUS KING BEELZEBUTH (+35 HP)!', 'magic'); }
  public triggerRimuruStorm() { this.executeHeroDash(20, 300, 25, 15, '#7dd3fc', 'SPATIAL MOTION + STORM!', 'magic'); }
  public triggerRimuruAzathoth() { this.executeHeroNova(45, 29, 690, 3.0, 40, 35, '#a855f7', '#38bdf8', 'VOID GOD AZATHOTH (+40 HP)!', 'magic'); }

  public triggerJinwooRulers() { this.executeHeroSealAoE(20, 20, 310, 3.0, true, 0, 25, '#a855f7', "RULER'S AUTHORITY TELEKINESIS!", 'shadow'); }
  public triggerJinwooExchange() { this.executeHeroDash(22, 330, 25, 15, '#9333ea', 'SHADOW EXCHANGE BLITZ!', 'shadow'); }
  public triggerJinwooArise() { this.executeHeroNova(45, 28, 670, 2.5, 35, 35, '#9333ea', '#c084fc', 'ARISE: SHADOW MONARCH LEGION!', 'shadow'); }

  public triggerNarutoRasenshuriken() { this.executeHeroSealAoE(20, 21, 340, 1.5, true, 0, 20, '#f97316', 'SAGE ART: LAVA RASENSHURIKEN!', 'flame'); }
  public triggerNarutoBlitz() { this.executeHeroDash(20, 320, 25, 20, '#facc15', 'KURAMA CHAKRA BLITZ!', 'lightning'); }
  public triggerNarutoBijuu() { this.executeHeroNova(45, 29, 680, 2.0, 40, 35, '#f97316', '#fde047', 'SIX PATHS: ULTRA-BIG BALL BIJUU!', 'flame'); }

  public triggerLuffyRedRoc() { this.executeHeroSealAoE(20, 19, 350, 1.5, true, 0, 25, '#ef4444', 'GUM-GUM RED ROC!', 'flame'); }
  public triggerLuffyCulverin() { this.executeHeroDash(20, 310, 25, 15, '#f8fafc', 'SNAKEMAN JET CULVERIN!', 'impact'); }
  public triggerLuffyBajrang() { this.executeHeroNova(45, 28, 700, 2.5, 35, 35, '#f8fafc', '#fbbf24', 'GEAR 5: BAJRANG GUN!', 'impact'); }

  public triggerGojoRed() { this.executeHeroSealAoE(20, 21, 340, 2.0, true, 0, 25, '#ef4444', 'CURSED TECHNIQUE REVERSAL: RED!', 'magic'); }
  public triggerGojoInfinity() { this.executeHeroSealAoE(0, 12, 120, 2.5, true, 25, 65, '#38bdf8', 'LIMITLESS INFINITY BARRIER (+65 ARMOR)!', 'magic'); }
  public triggerGojoPurple() { this.executeHeroNova(45, 30, 740, 3.0, 25, 30, '#a855f7', '#38bdf8', 'HOLLOW TECHNIQUE: PURPLE!', 'magic'); }

  public triggerYujiBlackFlash() { this.executeHeroSealAoE(20, 18, 360, 2.0, true, 20, 20, '#f43f5e', 'AWAKENED BLACK FLASH (SPARK OF BLACK)!', 'impact'); }
  public triggerYujiStep() { this.executeHeroDash(20, 310, 25, 15, '#38bdf8', 'CURSED FLASH STEP!', 'impact'); }
  public triggerYujiShrine() { this.executeHeroNova(45, 27, 660, 2.5, 30, 30, '#be123c', '#f43f5e', 'DOMAIN EXPANSION: MALEVOLENT SHRINE!', 'shadow'); }

  public triggerGarouFajin() { this.executeHeroSealAoE(20, 21, 340, 1.8, true, 0, 25, '#38bdf8', 'EXTREME FA JIN SHOCKWAVE!', 'impact'); }
  public triggerGarouDash() { this.executeHeroDash(22, 330, 25, 15, '#a855f7', 'AWAKENED CONSTELLATION DASH!', 'shadow'); }
  public triggerGarouGamma() { this.executeHeroNova(45, 29, 710, 2.5, 30, 35, '#a855f7', '#38bdf8', 'COSMIC FEAR: GAMMA RAY BURST!', 'magic'); }

  public triggerAnosEyes() { this.executeHeroSealAoE(20, 22, 350, 4.0, true, 30, 30, '#9333ea', 'CHAOTIC EYES OF DESTRUCTION (WIPED SPELLS)!', 'shadow'); }
  public triggerAnosVenuzdonoa() { this.executeHeroDash(22, 360, 30, 20, '#dc2626', 'ABOLISHER OF REASON: VENUZDONOA!', 'shadow'); }
  public triggerAnosEgil() { this.executeHeroNova(45, 30, 750, 3.0, 40, 40, '#9333ea', '#ef4444', 'EGIL GRONE ANGDROA (+40 HP)!', 'flame'); }

  public triggerItachiAmaterasu() { this.executeHeroSealAoE(20, 20, 330, 2.5, true, 20, 20, '#ef4444', 'AMATERASU: INEXTINGUISHABLE BLACK FLAME!', 'flame'); }
  public triggerItachiCrows() { this.executeHeroDash(20, 280, 30, 20, '#be123c', 'EPHEMERAL CROW CLONE WARP!', 'shadow'); }
  public triggerItachiTsukuyomi() { this.executeHeroNova(45, 28, 670, 4.2, 35, 35, '#dc2626', '#fb923c', 'TSUKUYOMI + TOTSUKA BLADE!', 'shadow'); }

  public triggerSasukeKirin() { this.executeHeroSealAoE(20, 21, 340, 2.5, true, 0, 20, '#38bdf8', 'LIGHTNING RELEASE: KIRIN!', 'lightning'); }
  public triggerSasukeWarp() { this.executeHeroDash(22, 320, 30, 15, '#818cf8', 'RINNEGAN AMENOTEJIKARA!', 'shadow'); }
  public triggerSasukeIndra() { this.executeHeroNova(45, 29, 700, 2.5, 30, 35, '#818cf8', '#38bdf8', "SIX PATHS: INDRA'S ARROW!", 'lightning'); }

  public triggerAbility(type: 'special' | 'super' | 'charge' | 'teleport') {
    if (!this.isMatchRunning) return;
    const isSaitama = this.operator.id === 'saitama';
    const isGoku = this.operator.id === 'son_goku';
    const isSuperman = this.operator.id === 'superman';
    const isMaxwell = this.operator.id === 'maxwell_shodron';
    const isKing = this.operator.id === 'king_opm';
    const isFlash = this.operator.id === 'the_flash';
    const isLantern = this.operator.id === 'green_lantern';
    const isShazam = this.operator.id === 'shazam_champion';
    const isThor = this.operator.id === 'thor_odinson';
    const isSilvester = this.operator.id === 'silvester_jais';
    const isDre = this.operator.id === 'dre_titan';
    const isTruth = this.operator.id === 'the_truth';
    const isHeiliea = this.operator.id === 'heiliea_valkyrie';
    const isBaby = this.operator.id === 'the_baby';
    const isZenitsu = this.operator.id === 'zenitsu_agatsuma';
    const isTanjiro = this.operator.id === 'tanjiro_kamado';
    const isMuzan = this.operator.id === 'muzan_kibutsuji';

    if (type === 'charge') {
      this.isKiCharging = true;
      soundEngine.playKiCharge(true);
      return;
    }

    const heroSkillRouter: Record<string, { teleport: () => void; special: () => void; super: () => void }> = {
      iron_man: { teleport: () => this.triggerIronNanoShield(), special: () => this.triggerIronMissiles(), super: () => this.triggerIronUnibeam() },
      spider_man: { teleport: () => this.triggerSpiderZip(), special: () => this.triggerSpiderWebBomb(), super: () => this.triggerSpiderOverload() },
      doctor_strange: { teleport: () => this.triggerStrangePortal(), special: () => this.triggerStrangeMirrorSeal(), super: () => this.triggerStrangeVishanti() },
      scarlet_witch: { teleport: () => this.triggerWandaTelekinesis(), special: () => this.triggerWandaRealityWarp(), super: () => this.triggerWandaChaosNova() },
      batman: { teleport: () => this.triggerBatmanGrapnel(), special: () => this.triggerBatmanSmoke(), super: () => this.triggerBatmanHellbat() },
      wonder_woman: { teleport: () => this.triggerWwLasso(), special: () => this.triggerWwBracelets(), super: () => this.triggerWwGodstrike() },
      aquaman: { teleport: () => this.triggerAquamanSurge(), special: () => this.triggerAquamanTidal(), super: () => this.triggerAquamanKraken() },
      rimuru_tempest: { teleport: () => this.triggerRimuruStorm(), special: () => this.triggerRimuruBeelzebuth(), super: () => this.triggerRimuruAzathoth() },
      sung_jinwoo: { teleport: () => this.triggerJinwooExchange(), special: () => this.triggerJinwooRulers(), super: () => this.triggerJinwooArise() },
      naruto_uzumaki: { teleport: () => this.triggerNarutoBlitz(), special: () => this.triggerNarutoRasenshuriken(), super: () => this.triggerNarutoBijuu() },
      monkey_d_luffy: { teleport: () => this.triggerLuffyCulverin(), special: () => this.triggerLuffyRedRoc(), super: () => this.triggerLuffyBajrang() },
      satoru_gojo: { teleport: () => this.triggerGojoInfinity(), special: () => this.triggerGojoRed(), super: () => this.triggerGojoPurple() },
      yuji_itadori: { teleport: () => this.triggerYujiStep(), special: () => this.triggerYujiBlackFlash(), super: () => this.triggerYujiShrine() },
      garou_opm: { teleport: () => this.triggerGarouDash(), special: () => this.triggerGarouFajin(), super: () => this.triggerGarouGamma() },
      anos_voldigoad: { teleport: () => this.triggerAnosVenuzdonoa(), special: () => this.triggerAnosEyes(), super: () => this.triggerAnosEgil() },
      itachi_uchiha: { teleport: () => this.triggerItachiCrows(), special: () => this.triggerItachiAmaterasu(), super: () => this.triggerItachiTsukuyomi() },
      sasuke_uchiha: { teleport: () => this.triggerSasukeWarp(), special: () => this.triggerSasukeKirin(), super: () => this.triggerSasukeIndra() },
    };
    const routedHero = heroSkillRouter[this.operator.id];
    if (routedHero) {
      routedHero[type]();
      return;
    }

    if (type === 'teleport') {
      if (isSuperman) {
        this.triggerSuperSpeedDash();
        return;
      }
      if (isMaxwell) {
        this.triggerArcaneBlink();
        return;
      }
      if (isKing) {
        this.triggerKingSaitamaAssist();
        return;
      }
      if (isFlash) {
        this.triggerFlashPhase();
        return;
      }
      if (isLantern) {
        this.triggerLanternShield();
        return;
      }
      if (isShazam) {
        this.triggerSuperSpeedDash();
        return;
      }
      if (isThor) {
        this.triggerThorHammerThrow();
        return;
      }
      if (isSilvester) {
        this.triggerSilvesterTachyonStep();
        return;
      }
      if (isDre) {
        this.triggerDreSubStep();
        return;
      }
      if (isTruth) {
        this.triggerTruthVeilShift();
        return;
      }
      if (isHeiliea) {
        this.triggerHeilieaSeraphHeal();
        return;
      }
      if (isBaby) {
        this.triggerBabyCrawlZoom();
        return;
      }
      if (isZenitsu) {
        this.triggerZenitsuSixfold();
        return;
      }
      if (isTanjiro) {
        this.triggerTanjiroHinokamiDash();
        return;
      }
      if (isMuzan) {
        this.triggerMuzanBloodStep();
        return;
      }
      this.abilitiesUsed += 1;
      if (isGoku) {
        soundEngine.playQuickComms('Instant Transmission!');
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.movePlayerBySweptStep(dir, 12);
        this.screenShake = 0.35;
      } else if (isSaitama) {
        soundEngine.playQuickComms('Sidestep.');
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.movePlayerBySweptStep(dir, 14);
        this.screenShake = 0.4;
      } else {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.movePlayerBySweptStep(dir, 8);
        this.screenShake = 0.25;
      }
      return;
    }

    if (type === 'special') {
      if (isSuperman) {
        this.triggerSuperBreath();
        return;
      }
      if (isMaxwell) {
        this.triggerChronoStasis();
        return;
      }
      if (isKing) {
        this.triggerKingEngine();
        return;
      }
      if (isFlash) {
        this.triggerFlashVortex();
        return;
      }
      if (isLantern) {
        this.triggerLanternConstruct();
        return;
      }
      if (isShazam) {
        this.triggerShazamBolt();
        return;
      }
      if (isThor) {
        this.triggerThorThunderSlam();
        return;
      }
      if (isSilvester) {
        this.triggerSilvesterTimeFreeze();
        return;
      }
      if (isDre) {
        this.triggerDreBassDrop();
        return;
      }
      if (isTruth) {
        this.triggerTruthSeal();
        return;
      }
      if (isHeiliea) {
        this.triggerHeilieaStarfall();
        return;
      }
      if (isBaby) {
        this.triggerBabyTantrum();
        return;
      }
      if (isZenitsu) {
        this.triggerZenitsuThunderclap();
        return;
      }
      if (isTanjiro) {
        this.triggerTanjiroWaterWheel();
        return;
      }
      if (isMuzan) {
        this.triggerMuzanWhipStorm();
        return;
      }
      if (this.kiEnergy < 30) return;
      this.kiEnergy -= 30;
      this.abilitiesUsed += 1;
      this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));

      if (isGoku) {
        // Kamehameha Beam
        soundEngine.playKamehameha();
        this.screenShake = 0.85;
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);

        // Environmental shockwave, crater & tree whip
        this.worldSimulator?.onHeavyPunchThrown(
          this.playerPos.clone().addScaledVector(forward, 4.5),
          forward.clone().multiplyScalar(96),
          3.8
        );

        // Visual beam mesh
        const beamGeo = new THREE.CylinderGeometry(0.8, 0.8, 30, 16);
        const beamMat = new THREE.MeshBasicMaterial({
          color: '#38bdf8',
          transparent: true,
          opacity: 0.95,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.copy(this.playerPos).add(forward.clone().multiplyScalar(15));
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
        this.scene.add(beam);
        setTimeout(() => this.scene.remove(beam), 600);

        // Pierce hostiles
        this.bots.filter(b => b.isAlive).forEach(bot => {
          const toBot = bot.pos.clone().sub(this.playerPos);
          if (toBot.length() < 32 && forward.angleTo(toBot) < 0.4) {
            this.damageBot(bot, 240, true);
            this.callbacks.onHitmarker(true, 240);
            this.totalDamage += 240;
            this.shotsHit += 1;
          }
        });
      } else if (isSaitama) {
        // Consecutive Normal Punches
        this.screenShake = 1.0;
        soundEngine.playGunshot('fist', true);
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);

        // Environmental heavy punch shockwave + foliage cone whip
        this.worldSimulator?.onHeavyPunchThrown(
          this.playerPos.clone().addScaledVector(forward, 3.5),
          forward.clone().multiplyScalar(88),
          3.4
        );

        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            soundEngine.playGunshot('fist', true);
          }, i * 75);
        }

        this.bots.filter(b => b.isAlive).forEach(bot => {
          const toBot = bot.pos.clone().sub(this.playerPos);
          if (toBot.length() < 18 && forward.angleTo(toBot) < 0.7) {
            this.damageBot(bot, 220, false);
            this.callbacks.onHitmarker(true, 220);
            this.totalDamage += 220;
            this.shotsHit += 1;
          }
        });
      } else {
        // Tactical Frag / Drone
        soundEngine.playAnnouncer('quad_damage');
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        this.worldSimulator?.onHeavyPunchThrown(
          this.playerPos.clone().addScaledVector(forward, 5.0),
          forward.clone().multiplyScalar(92),
          3.2
        );
        this.bots.filter(b => b.isAlive).forEach(bot => {
          if (bot.pos.distanceTo(this.playerPos) < 20) {
            this.damageBot(bot, 180, false);
            this.totalDamage += 180;
            this.shotsHit += 1;
          }
        });
      }
      return;
    }

    if (type === 'super') {
      if (isSuperman) {
        this.triggerThermalOverload();
        return;
      }
      if (isMaxwell) {
        this.triggerArcaneNova();
        return;
      }
      if (isKing) {
        this.triggerKingHellfire();
        return;
      }
      if (isFlash) {
        this.triggerFlashUltimate();
        return;
      }
      if (isLantern) {
        this.triggerLanternBeam();
        return;
      }
      if (isShazam) {
        this.triggerShazamUltimate();
        return;
      }
      if (isThor) {
        this.triggerThorBifrost();
        return;
      }
      if (isSilvester) {
        this.triggerSilvesterOmegaApocalypse();
        return;
      }
      if (isDre) {
        this.triggerDreOmegaMixtape();
        return;
      }
      if (isTruth) {
        this.triggerTruthAbsolute();
        return;
      }
      if (isHeiliea) {
        this.triggerHeilieaCelestialNova();
        return;
      }
      if (isBaby) {
        this.triggerBabyCryingWave();
        return;
      }
      if (isZenitsu) {
        this.triggerZenitsuFlamingDragon();
        return;
      }
      if (isTanjiro) {
        this.triggerTanjiroSunDragon();
        return;
      }
      if (isMuzan) {
        this.triggerMuzanShockwave();
        return;
      }
      if (this.kiEnergy < 70) return;
      this.kiEnergy -= 70;
      this.abilitiesUsed += 1;
      this.callbacks.onKiChanged?.(Math.round(this.kiEnergy));

      if (isGoku) {
        // Super Saiyan Awakening
        soundEngine.playKamehameha();
        this.screenShake = 1.4;
        this.quadDamageTimer = 20;
        this.speedBoostTimer = 20;
        this.callbacks.onPowerUpActive('SUPER SAIYAN AWAKENED (4x DMG)', 20);

        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        this.worldSimulator?.onHeavyPunchThrown(
          this.playerPos.clone().addScaledVector(forward, 3.0),
          forward.clone().multiplyScalar(135),
          5.2
        );

        this.bots.filter(b => b.isAlive).slice(0, 3).forEach(bot => {
          this.damageBot(bot, 500, true);
          this.totalDamage += 500;
          this.shotsHit += 1;
        });
      } else if (isSaitama) {
        // Serious Punch -> Maximum Force (> 85.0): snaps trunks, blasts 10m craters, parts clouds
        soundEngine.playSeriousPunch();
        this.screenShake = 1.8;
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);

        this.worldSimulator?.onHeavyPunchThrown(
          this.playerPos.clone().addScaledVector(forward, 4.0),
          forward.clone().multiplyScalar(150),
          5.8
        );

        this.bots.filter(b => b.isAlive).forEach(bot => {
          const toBot = bot.pos.clone().sub(this.playerPos);
          if (toBot.length() < 50 && forward.angleTo(toBot) < 1.3) {
            this.damageBot(bot, 9999, true);
            this.totalDamage += 999;
            this.shotsHit += 1;
          }
        });
      } else {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        this.worldSimulator?.onHeavyPunchThrown(
          this.playerPos.clone().addScaledVector(forward, 4.0),
          forward.clone().multiplyScalar(110),
          4.2
        );
        this.quadDamageTimer = 20;
        this.armor = 100;
        this.health = 100;
        this.callbacks.onHealthChanged(this.health, this.armor);
        this.callbacks.onPowerUpActive('TACTICAL OVERCLOCK ACTIVE', 20);
      }
    }
  }

  public stopKiCharging() {
    this.isKiCharging = false;
    soundEngine.playKiCharge(false);
  }

  public buildEndOfMatchStats(isPlayerWinner: boolean): EndOfMatchStats {
    const matchDuration = Math.round((Date.now() - this.matchStartTime) / 1000);
    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : (this.kills > 0 ? 74 : 0);
    const headshotPct = this.kills > 0 ? Math.round((this.headshots / this.kills) * 100) : 0;
    const kd = this.deaths > 0 ? (this.kills / this.deaths).toFixed(2) : this.kills.toFixed(2);
    const playerScore = this.kills * 125 + this.headshots * 50 + Math.floor(this.totalDamage * 0.25);

    const isSaitama = this.operator.id === 'saitama';
    const isGoku = this.operator.id === 'son_goku';
    const isSuperman = this.operator.id === 'superman';
    const isMaxwell = this.operator.id === 'maxwell_shodron';
    const isKing = this.operator.id === 'king_opm';
    const isFlash = this.operator.id === 'the_flash';
    const isLantern = this.operator.id === 'green_lantern';
    const isShazam = this.operator.id === 'shazam_champion';
    const isThor = this.operator.id === 'thor_odinson';
    const isSilvester = this.operator.id === 'silvester_jais';
    const isDre = this.operator.id === 'dre_titan';
    const isTruth = this.operator.id === 'the_truth';
    const isHeiliea = this.operator.id === 'heiliea_valkyrie';
    const isBaby = this.operator.id === 'the_baby';
    const isZenitsu = this.operator.id === 'zenitsu_agatsuma';
    const isTanjiro = this.operator.id === 'tanjiro_kamado';
    const isMuzan = this.operator.id === 'muzan_kibutsuji';

    const list: CombatantScore[] = [
      {
        id: 'player',
        name: this.operatorName,
        isPlayer: true,
        team: 'blue',
        kills: this.kills,
        deaths: this.deaths,
        score: playerScore,
        ping: 24,
      },
      ...this.bots.map(b => ({
        id: b.id,
        name: b.name,
        isPlayer: false,
        team: b.team,
        kills: b.kills,
        deaths: b.deaths,
        score: b.kills * 100,
        ping: Math.floor(Math.random() * 20 + 25),
      }))
    ];
    list.sort((a, b) => b.score - a.score);

    const topCombatant = list[0] || list[0];
    const isPlayerMvp = topCombatant.isPlayer;

    const NEW_MVP_META: Record<string, { title: string; quote: string; awardTitle: string; awardCat: string; awardDesc: string }> = {
      iron_man: { title: 'GENIUS ARMORER', quote: '"I am Iron Man. Jarvis, log another clean victory."', awardTitle: 'ARC REACTOR UNIBEAM', awardCat: 'MARVEL', awardDesc: 'Dominated with Nano Shields and Mark 85 Unibeams.' },
      spider_man: { title: 'FRIENDLY NEIGHBORHOOD', quote: '"My Spider-Sense never misses! Anyone else sticky?"', awardTitle: 'INSTANT KILL', awardCat: 'MARVEL', awardDesc: 'Outmaneuvered the arena with Iron Spider Web Zips.' },
      doctor_strange: { title: 'SORCERER SUPREME', quote: '"In every universe, the Sorcerer Supreme prevails."', awardTitle: 'VISHANTI MYSTIC', awardCat: 'MARVEL', awardDesc: 'Locked targets inside the Mirror Dimension.' },
      scarlet_witch: { title: 'SCARLET WITCH', quote: '"Chaos bends to my will—no more threats."', awardTitle: 'CHAOS HEX', awardCat: 'MARVEL', awardDesc: 'Unleashed Darkhold Reality Warps across the lobby.' },
      batman: { title: 'DARK KNIGHT', quote: '"I am vengeance. I am the night. I had prep time."', awardTitle: 'HELLBAT FURY', awardCat: 'DC COMICS', awardDesc: 'Neutralized every target with stealth and Hellbat strikes.' },
      wonder_woman: { title: 'GODDESS OF WAR', quote: '"Peace is won through courage and truth."', awardTitle: 'GODKILLER', awardCat: 'DC COMICS', awardDesc: 'Deflected enemy magic with the Bracelets of Submission.' },
      aquaman: { title: 'KING OF ATLANTIS', quote: '"The seven seas bow—and so does this arena."', awardTitle: 'TRIDENT OF POSEIDON', awardCat: 'DC COMICS', awardDesc: 'Swept the battlefield with Karathen Tidal Storms.' },
      rimuru_tempest: { title: 'DEMON LORD SLIME', quote: '"Wait, Ciel already solved the entire fight? Nice!"', awardTitle: 'VOID GOD AZATHOTH', awardCat: 'ANIME LEGENDS', awardDesc: 'Absorbed all spells with Beelzebuth and unleashed Azathoth.' },
      sung_jinwoo: { title: 'SHADOW MONARCH', quote: '"Arise. Every defeated rival belongs to my shadow army."', awardTitle: 'ARISE', awardCat: 'ANIME LEGENDS', awardDesc: 'Eliminated the lobby with Shadow Exchange and Kamish Wrath.' },
      naruto_uzumaki: { title: 'SEVENTH HOKAGE', quote: '"Believe it! With Kurama by my side, I never go back on my word!"', awardTitle: 'BARYON RASENGAN', awardCat: 'ANIME LEGENDS', awardDesc: 'Overwhelmed rivals with Rasenshuriken and Six Paths Bijuu.' },
      monkey_d_luffy: { title: 'SUN GOD NIKA', quote: '"Shishishi! Now THIS is freedom! I am gonna be King of the Pirates!"', awardTitle: 'DRUMS OF LIBERATION', awardCat: 'ANIME LEGENDS', awardDesc: 'Crushed every opponent under Gear 5 Bajrang Gun.' },
      satoru_gojo: { title: 'THE HONORED ONE', quote: '"Throughout Heaven and Earth, I alone am the Honored One."', awardTitle: 'HOLLOW PURPLE', awardCat: 'ANIME LEGENDS', awardDesc: 'Stood untouched behind Infinity and erased enemies with Purple.' },
      yuji_itadori: { title: 'BLACK FLASH VESSEL', quote: '"I will keep punching through curses until everyone is saved!"', awardTitle: 'SPARK OF BLACK', awardCat: 'ANIME LEGENDS', awardDesc: 'Delivered devastating Black Flashes and Domain slashes.' },
      garou_opm: { title: 'COSMIC HERO HUNTER', quote: '"Watch closely—this is Mode: Cosmic Fear perfected."', awardTitle: 'GAMMA RAY BURST', awardCat: 'ANIME LEGENDS', awardDesc: 'Evolved mid-match to obliterate targets with Gamma Ray Burst.' },
      anos_voldigoad: { title: 'TYRANT DEMON KING', quote: '"Did you think killing me would be enough to make me die?"', awardTitle: 'VENUZDONOA', awardCat: 'ANIME LEGENDS', awardDesc: 'Erased every spell in sight with the Abolisher of Reason.' },
      itachi_uchiha: { title: 'UCHIHA PRODIGY', quote: '"You are already under my genjutsu—Tsukuyomi is complete."', awardTitle: 'TSUKUYOMI', awardCat: 'ANIME LEGENDS', awardDesc: 'Sealed the lobby with Amaterasu and the Blade of Totsuka.' },
      sasuke_uchiha: { title: 'SHADOW HOKAGE', quote: '"With the Rinnegan and Indra’s Arrow, nothing escapes."', awardTitle: "INDRA'S ARROW", awardCat: 'ANIME LEGENDS', awardDesc: 'Struck from across the arena with Kirin and Amenotejikara.' },
    };
    const newHeroMeta = NEW_MVP_META[this.operator.id];

    const mvpTitle = newHeroMeta
      ? newHeroMeta.title
      : isSaitama
      ? 'ONE-PUNCH APEX' 
      : isGoku 
        ? 'ULTRA WARRIOR'
        : isSuperman
          ? 'MAN OF STEEL'
          : isMaxwell
            ? 'ARCANE SOVEREIGN'
            : isKing
              ? 'STRONGEST MAN ON EARTH'
              : isFlash
                ? 'SCARLET SPEEDSTER'
                : isLantern
                  ? 'EMERALD KNIGHT'
                  : isShazam
                    ? 'CHAMPION OF ETERNITY'
                    : isThor
                      ? 'GOD OF THUNDER'
                      : isSilvester
                        ? 'OMEGA SOVEREIGN'
                        : isDre
                          ? '808 SONIC STRIKER'
                          : isTruth
                            ? 'ALL-SEEING VERITAS'
                            : isHeiliea
                              ? 'STARLIGHT VALKYRIE'
                              : isBaby
                                ? 'TINY COSMIC TITAN'
                                : isZenitsu
                                  ? 'THUNDER GODSPEED'
                                  : isTanjiro
                                    ? 'SUN BREATHING SLAYER'
                                    : isMuzan
                                      ? 'IMMORTAL DEMON KING'
                                      : 'TACTICAL RECON MASTER';

    const mvpQuote = newHeroMeta
      ? newHeroMeta.quote
      : isSaitama
      ? '"Is that it? What a bore... Wait, what time is it?! Did I miss the Saturday supermarket discount sale?!"'
      : isGoku
        ? '"Haha! That was awesome! You guys were really tough! Let\'s fight again!"'
        : isSuperman
          ? '"I never fight to destroy. I fight to protect the light of a better tomorrow."'
          : isMaxwell
            ? '"Every rune obeys the Sovereign. Time itself bends to my spellwork."'
            : isKing
              ? '"Thump-thump... Thump-thump... Honestly, I just wanted to finish my RPG tonight."'
              : isFlash
                ? '"You blinked! By the time you looked up, the match was already over."'
                : isLantern
                  ? '"In brightest day, in blackest night—willpower conquers every fight."'
                  : isShazam
                    ? '"SHAZAM! Guess the wisdom of Solomon and power of Zeus did the trick!"'
                    : isThor
                      ? '"Whosoever holds Mjolnir proved worthy upon the battlefield this day!"'
                      : isSilvester
                        ? '"Fifteen powers. One Sovereign. Even eternity kneels when Omega awakens."'
                        : isDre
                          ? '"Turn the sub up—when the 808 drops, the whole battlefield bows to the beat."'
                          : isTruth
                            ? '"No illusion can hide from the All-Seeing Eye. Truth always prevails."'
                            : isHeiliea
                              ? '"Rise on wings of starlight—every ally under my shield stands unbroken!"'
                              : isBaby
                                ? '"Goo-goo ga-ga! ...And you seriously thought a rattle couldn\'t solo the lobby?!"'
                                : isZenitsu
                                  ? '"Thunderclap and Flash... I only needed one form to clear the room!"'
                                  : isTanjiro
                                    ? '"Hinokami Kagura burns eternal—we will protect everyone until dawn!"'
                                    : isMuzan
                                      ? '"Perfection incarnate. Not a single slayer could touch the Demon King."'
                                      : '"Target neutralized with absolute surgical efficiency."';

    const awards: MatchAward[] = [];
    if (isPlayerWinner || isPlayerMvp) {
      awards.push({
        id: 'mvp',
        title: 'MATCH MVP',
        category: 'SUPREMACY',
        description: 'Awarded to the highest performing tactical combatant on the battlefield.',
        rarity: 'mythic',
        xpBonus: 500,
      });
    }
    if (this.headshots >= 3) {
      awards.push({
        id: 'headhunter',
        title: 'CRITICAL HEADHUNTER',
        category: 'PRECISION',
        description: `Landed ${this.headshots} lethal critical hits with surgical precision.`,
        rarity: 'legendary',
        xpBonus: 350,
      });
    }
    if (this.highestStreak >= 3) {
      awards.push({
        id: 'unstoppable',
        title: 'UNSTOPPABLE STREAK',
        category: 'COMBAT',
        description: `Executed a ${this.highestStreak}-kill streak without taking lethal damage.`,
        rarity: 'epic',
        xpBonus: 300,
      });
    }
    if (isSaitama && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'serious_strike',
        title: 'LIMITLESS PUNCH',
        category: 'SIGNATURE',
        description: 'Unleashed the terrifying shockwave of serious physical power.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isGoku && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'saiyan_awakening',
        title: 'SUPER SAIYAN WILL',
        category: 'AWAKENING',
        description: 'Channeled raw cosmic ki to disintegrate hostile formations.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isSuperman && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'solar_overload',
        title: 'SOLAR THERMAL OVERLOAD',
        category: 'KRYPTONIAN',
        description: 'Absorbed Yellow Sun radiation and swept the battlefield with white-hot laser vision.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isMaxwell && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'arcane_cataclysm',
        title: 'ARCANE CATACLYSM',
        category: 'SORCERY',
        description: 'Wove Chronos Stasis, Phase Blink, and Arcane Nova to dominate the arena.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isKing && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'king_engine_apex',
        title: 'KING ENGINE RESONANCE',
        category: 'S-CLASS RANK 7',
        description: 'Terrified hostiles with the King Engine and unleashed Hellfire Wave-Motion Cannon.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isFlash && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'speed_force_avatar',
        title: 'SPEED FORCE AVATAR',
        category: 'RELATIVISTIC',
        description: 'Outran incoming spells and shattered lines with Infinite Mass Nova.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isLantern && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'emerald_willpower',
        title: 'UNBREAKABLE WILLPOWER',
        category: 'GREEN LANTERN CORPS',
        description: 'Forged Emerald Meteors and Oan Willpower Beams to crush hostile waves.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isShazam && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'living_thunder',
        title: 'MAGIC WORD: SHAZAM!',
        category: 'CHAMPION OF ETERNITY',
        description: 'Called down the Lightning of Zeus and shattered armor with Hercules strength.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isThor && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'odinforce_thunder',
        title: 'WORTHY OF MJOLNIR',
        category: 'ASGARDIAN',
        description: 'Summoned the Bifrost Pillar and hurled Uru thunder across the arena.',
        rarity: 'mythic',
        xpBonus: 450,
      });
    } else if (isSilvester && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'omega_ascendancy',
        title: '15-POWER ASCENDANCY',
        category: 'OMEGA SOVEREIGN',
        description: 'Commanded all 15 Sovereign powers—from Chronos Time-Freeze to Omega Apocalypse.',
        rarity: 'mythic',
        xpBonus: 650,
      });
    } else if (isDre && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'dre_bass_master',
        title: '808 BASS DOMINANCE',
        category: 'SONIC DIVISION',
        description: 'Dropped seismic studio shockwaves and detonated Omega Mixtape Finale.',
        rarity: 'legendary',
        xpBonus: 420,
      });
    } else if (isTruth && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'truth_veritas_eye',
        title: 'VERITAS REVELATION',
        category: 'LEGENDARY SEER',
        description: 'Sealed hostiles in golden stasis and unleashed Absolute Truth.',
        rarity: 'mythic',
        xpBonus: 480,
      });
    } else if (isHeiliea && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'heiliea_starlight',
        title: 'STARLIGHT SANCTUARY',
        category: 'VALKYRIE ORDER',
        description: 'Rained Starfall meteors and restored allies with Celestial Nova.',
        rarity: 'mythic',
        xpBonus: 480,
      });
    } else if (isBaby && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'baby_cosmic_tantrum',
        title: 'COSMIC NAPTIME TITAN',
        category: 'LEGENDARY NURSERY',
        description: 'Zoomed past spells and shook the arena with Mega Crying Wave.',
        rarity: 'mythic',
        xpBonus: 480,
      });
    } else if (isZenitsu && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'zenitsu_godspeed',
        title: 'FLAMING THUNDER GOD',
        category: 'DEMON SLAYER CORPS',
        description: 'Perfected First & Seventh Forms of Thunder Breathing at blinding speed.',
        rarity: 'mythic',
        xpBonus: 480,
      });
    } else if (isTanjiro && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'tanjiro_hinokami',
        title: 'HINOKAMI KAGURA',
        category: 'DEMON SLAYER CORPS',
        description: 'United Water Breathing flow with the blazing Sun Halo Dragon.',
        rarity: 'mythic',
        xpBonus: 480,
      });
    } else if (isMuzan && this.abilitiesUsed >= 1) {
      awards.push({
        id: 'muzan_demon_king',
        title: 'IMMORTAL PROGENITOR',
        category: 'TWELVE KIZUKI',
        description: 'Outlasted the arena with cellular regeneration and Black Blood Shockwaves.',
        rarity: 'mythic',
        xpBonus: 480,
      });
    } else if (newHeroMeta && this.abilitiesUsed >= 1) {
      awards.push({
        id: `${this.operator.id}_signature`,
        title: newHeroMeta.awardTitle,
        category: newHeroMeta.awardCat,
        description: newHeroMeta.awardDesc,
        rarity: 'mythic',
        xpBonus: 500,
      });
    }
    if (this.totalDamage >= 1200) {
      awards.push({
        id: 'heavy_destroyer',
        title: 'HEAVY DESTROYER',
        category: 'DEVASTATION',
        description: `Inflicted over ${this.totalDamage} points of destructive damage.`,
        rarity: 'epic',
        xpBonus: 250,
      });
    }
    if (awards.length === 0) {
      awards.push({
        id: 'combatant',
        title: 'VALIANT COMBATANT',
        category: 'HONOR',
        description: 'Fought bravely in competitive arena deathmatch.',
        rarity: 'common',
        xpBonus: 150,
      });
    }

    const baseXP = 850 + this.kills * 80 + this.headshots * 40;
    const awardsXP = awards.reduce((acc, a) => acc + a.xpBonus, 0);
    const totalXPGained = baseXP + awardsXP;

    return {
      winner: isPlayerWinner ? this.operatorName : topCombatant.name,
      isPlayerWinner,
      mvp: {
        name: topCombatant.name,
        isPlayer: topCombatant.isPlayer,
        operatorId: this.operator.id,
        operatorName: this.operatorName,
        score: topCombatant.score,
        kills: topCombatant.kills,
        deaths: topCombatant.deaths,
        kd: topCombatant.deaths > 0 ? (topCombatant.kills / topCombatant.deaths).toFixed(2) : topCombatant.kills.toFixed(2),
        title: mvpTitle,
        quote: mvpQuote,
      },
      playerStats: {
        kills: this.kills,
        deaths: this.deaths,
        kdRatio: parseFloat(kd),
        score: playerScore,
        totalDamage: this.totalDamage,
        headshots: this.headshots,
        headshotPercentage: headshotPct,
        accuracyPercentage: accuracy,
        highestStreak: this.highestStreak,
        powerUpsCollected: this.powerUpsCollected,
        abilitiesUsed: this.abilitiesUsed,
        matchDurationSeconds: matchDuration,
      },
      awards,
      rewards: {
        creditsEarned: 850 + this.kills * 45,
        codPoints: isPlayerWinner ? 60 : 25,
        xpGained: totalXPGained,
        previousLevel: 99,
        currentLevel: 100,
        levelProgressPercent: 88,
        battlePassTier: 16,
        rankTier: 'MASTER IV',
        rankPointsGained: isPlayerWinner ? 48 : -12,
      },
      scoreboard: list,
    };
  }

  public handleResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    if (this.swFrameTimeout !== null) {
      clearTimeout(this.swFrameTimeout);
      this.swFrameTimeout = null;
    }
    soundEngine.playThermalOverload(false);
    this.disposeThermalBeamRig();
    this.witchSpells.forEach(s => this.disposeSpellObject(s.mesh));
    this.witchSpells = [];
    this.worldSimulator?.dispose();
    this.renderer.dispose();
    soundEngine.stopAmbientLoop();
    if (this.weaponMesh) this.camera.remove(this.weaponMesh);
  }
}
