import * as THREE from 'three';
import { ArenaMap } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

/**
 * ARCANUM_DYNAMIC_WORLD_SIMULATOR WorldConfig
 * Drives skybox scattering, volumetric sun rays, time-of-day cycling,
 * deformable multi-layer ground grid, and kinetic foliage physics.
 */
export const ARCANUM_WORLD_CONFIG = {
  SkyLayer: {
    AtmosphereType: 'Dynamic Procedural Skybox',
    CloudDensity: 0.75,
    LightingEngine: 'Real-time Volumetric Sun Rays with Dynamic Time-of-Day Cycling',
    WeatherState: 'High-Altitude Atmospheric Turbulence & Particle Embers',
  },
  MidAirLayer: {
    ParticleEmitters: 'Floating Dust, Debris, and Shockwave Distortion Rings',
    ProjectileCollision: 'Enabled',
    AudioReverbZone: 'Open-Air Environmental Echo Matrix',
  },
  GroundLayer: {
    TerrainType: 'Deformable Multi-Layer Mesh Grid',
    FrictionCoefficient: 0.85,
    Destructibility: 'Dynamic Vertex Displacers',
  },
} as const;

export interface FloraObject {
  id: string;
  rootGroup: THREE.Group;
  stumpGroup: THREE.Group;
  upperPivot: THREE.Group;
  position: THREE.Vector3;
  theme: ArenaMap['theme'];
  bendX: number;
  bendZ: number;
  velBendX: number;
  velBendZ: number;
  isSnapped: boolean;
  dynamicPos: THREE.Vector3;
  dynamicVel: THREE.Vector3;
  dynamicRotVel: THREE.Vector3;
  settled: boolean;
  canopyLeafColor: number;
}

interface ShockwaveRingEffect {
  group: THREE.Group;
  ringMesh: THREE.Mesh;
  hazeMesh: THREE.Mesh;
  origin: THREE.Vector3;
  maxRadius: number;
  currentRadius: number;
  expandSpeed: number; // 340 m/s nominal scaled cleanly so human eye sees supersonic wave
  life: number;
  maxLife: number;
}

interface DynamicDebrisChunk {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface LeafBurstParticle {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;
  maxLife: number;
}

interface VolumetricCloudCluster {
  group: THREE.Group;
  basePos: THREE.Vector3;
  orbitAngle: number;
  orbitRadius: number;
  altitude: number;
  pushOffset: THREE.Vector3;
  pushVel: THREE.Vector3;
  driftSpeed: number;
}

const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();
const _tmpVecC = new THREE.Vector3();
const _tmpColorA = new THREE.Color();
const _tmpColorB = new THREE.Color();

export class ArcanumDynamicWorldSimulator {
  private scene: THREE.Scene;
  private mapData: ArenaMap;
  private groundMesh: THREE.Mesh;
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private isSoftwareGl: boolean;

  // SkyLayer state
  private skyDome: THREE.Mesh | null = null;
  private skyUniforms: {
    uTime: { value: number };
    uTopColor: { value: THREE.Color };
    uHorizonColor: { value: THREE.Color };
    uSunDir: { value: THREE.Vector3 };
    uSunColor: { value: THREE.Color };
    uShockwaveTime: { value: number };
    uShockwaveStrength: { value: number };
    uShockwaveOrigin: { value: THREE.Vector3 };
  } | null = null;
  private clouds: VolumetricCloudCluster[] = [];
  private godRayGroup: THREE.Group | null = null;
  private emberPoints: THREE.Points | null = null;
  private emberVelocities: Float32Array = new Float32Array(0);

  // MidAirLayer state
  private shockwaves: ShockwaveRingEffect[] = [];
  private debrisChunks: DynamicDebrisChunk[] = [];
  private leafBursts: LeafBurstParticle[] = [];
  private footstepDustPuffs: LeafBurstParticle[] = [];

  // GroundLayer grid cache for O(1) height lookup
  private groundSegX: number;
  private groundSegZ: number;
  private groundSizeX: number;
  private groundSizeZ: number;

  // Vegetation registry
  private floraObjects: FloraObject[] = [];

  // Camera shake state driven by ON_HEAVY_PUNCH_IMPACT
  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;
  private shakeDuration: number = 0.4;

  // Time-of-day accumulator
  private worldTime: number = 0;
  private baseSkyColor: THREE.Color;
  private baseFogColor: THREE.Color;
  private baseSunColor: THREE.Color;

  // Shared geometries/materials for debris & dust
  private debrisGeo: THREE.IcosahedronGeometry;
  private debrisConcreteMat: THREE.MeshStandardMaterial;
  private debrisEarthMat: THREE.MeshStandardMaterial;

  constructor(
    scene: THREE.Scene,
    mapData: ArenaMap,
    groundMesh: THREE.Mesh,
    groundSegments: { segX: number; segZ: number },
    sunLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
    floraList: FloraObject[],
    isSoftwareGl: boolean
  ) {
    this.scene = scene;
    this.mapData = mapData;
    this.groundMesh = groundMesh;
    this.groundSegX = groundSegments.segX;
    this.groundSegZ = groundSegments.segZ;
    this.groundSizeX = mapData.mapSize.x;
    this.groundSizeZ = mapData.mapSize.z;
    this.sunLight = sunLight;
    this.hemiLight = hemiLight;
    this.floraObjects = floraList;
    this.isSoftwareGl = isSoftwareGl;

    this.baseSkyColor = new THREE.Color(mapData.skyColor);
    this.baseFogColor = new THREE.Color(mapData.fogColor);
    this.baseSunColor = new THREE.Color(mapData.lightingPreset.sunColor);

    this.debrisGeo = new THREE.IcosahedronGeometry(0.18, 0);
    this.debrisConcreteMat = new THREE.MeshStandardMaterial({
      color: '#52525b',
      roughness: 0.9,
      metalness: 0.1,
    });
    this.debrisEarthMat = new THREE.MeshStandardMaterial({
      color: mapData.theme === 'planet_namek' ? '#0f766e' : '#3f2e21',
      roughness: 0.95,
      metalness: 0.05,
    });

    this.initSkyLayer();
    this.initVolumetricClouds();
    this.initVolumetricSunRays();
    this.initAtmosphericEmbers();
  }

  // ---------------------------------------------------------------------------
  // 1. SKYLAYER: Dynamic Procedural Skybox + Shockwave Sky Ripple
  // ---------------------------------------------------------------------------
  private initSkyLayer() {
    const topCol = this.baseSkyColor.clone().multiplyScalar(0.85);
    const horizonCol = this.baseFogColor.clone().lerp(this.baseSunColor, 0.25);

    this.skyUniforms = {
      uTime: { value: 0 },
      uTopColor: { value: topCol },
      uHorizonColor: { value: horizonCol },
      uSunDir: { value: new THREE.Vector3(...this.mapData.lightingPreset.sunPosition).normalize() },
      uSunColor: { value: this.baseSunColor.clone() },
      uShockwaveTime: { value: 99 },
      uShockwaveStrength: { value: 0 },
      uShockwaveOrigin: { value: new THREE.Vector3() },
    };

    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform float uShockwaveTime;
        uniform float uShockwaveStrength;
        uniform vec3 uShockwaveOrigin;
        varying vec3 vWorldPos;

        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y, 0.0, 1.0);
          vec3 sky = mix(uHorizonColor, uTopColor, pow(h, 0.58));

          // Sun disc + Mie atmospheric halo
          float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
          sky += uSunColor * pow(sunDot, 16.0) * 0.42;
          sky += uSunColor * pow(sunDot, 140.0) * 1.1;

          // Skybox shockwave ripple distortion triggered by ON_HEAVY_PUNCH_IMPACT
          if (uShockwaveStrength > 0.005) {
            vec3 waveDir = normalize(vWorldPos - uShockwaveOrigin);
            float distAngle = acos(clamp(dot(dir, normalize(vec3(uShockwaveOrigin.x, 20.0, uShockwaveOrigin.z))), -1.0, 1.0));
            float front = uShockwaveTime * 2.8;
            float ring = exp(-pow((distAngle - front) * 9.0, 2.0));
            float shimmer = sin(distAngle * 28.0 - uShockwaveTime * 24.0) * 0.5 + 0.5;
            sky += mix(uSunColor, vec3(0.85, 0.95, 1.0), 0.5) * ring * shimmer * uShockwaveStrength * 0.75;
            sky += vec3(0.18, 0.25, 0.35) * ring * uShockwaveStrength * 0.35;
          }

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    });

    const skyGeo = new THREE.SphereGeometry(175, 32, 20);
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.skyDome.frustumCulled = false;
    this.scene.add(this.skyDome);
  }

  private initVolumetricClouds() {
    // CloudDensity: 0.75 -> 24 multi-puff volumetric cloud clusters circling high above
    const clusterCount = Math.round(32 * ARCANUM_WORLD_CONFIG.SkyLayer.CloudDensity);
    const puffGeo = new THREE.DodecahedronGeometry(1, 1);

    const cloudColor = this.baseFogColor
      .clone()
      .lerp(new THREE.Color('#f8fafc'), 0.48)
      .lerp(this.baseSunColor, 0.18);

    const cloudMat = new THREE.MeshStandardMaterial({
      color: cloudColor,
      emissive: cloudColor,
      emissiveIntensity: 0.14,
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    });

    for (let i = 0; i < clusterCount; i++) {
      const cluster = new THREE.Group();
      const puffCount = 3 + (i % 3);
      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        const sx = 5.5 + ((i * 7 + p * 3) % 5);
        const sy = 1.6 + ((p + i) % 3) * 0.55;
        const sz = 4.2 + ((i + p * 5) % 4);
        puff.scale.set(sx, sy, sz);
        puff.position.set(
          (p - puffCount / 2) * 3.8,
          ((p % 2) - 0.5) * 0.9,
          ((p * 17) % 3) * 1.4
        );
        cluster.add(puff);
      }

      const orbitAngle = (i / clusterCount) * Math.PI * 2 + (i % 3) * 0.15;
      const orbitRadius = 46 + (i % 5) * 14;
      const altitude = 54 + (i % 4) * 6;
      const basePos = new THREE.Vector3(
        Math.cos(orbitAngle) * orbitRadius,
        altitude,
        Math.sin(orbitAngle) * orbitRadius
      );
      cluster.position.copy(basePos);
      this.scene.add(cluster);

      this.clouds.push({
        group: cluster,
        basePos,
        orbitAngle,
        orbitRadius,
        altitude,
        pushOffset: new THREE.Vector3(),
        pushVel: new THREE.Vector3(),
        driftSpeed: 0.012 + (i % 4) * 0.004,
      });
    }
  }

  private initVolumetricSunRays() {
    this.godRayGroup = new THREE.Group();
    const rayMat = new THREE.MeshBasicMaterial({
      color: this.baseSunColor,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.02 : 0.028,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const rayGeo = new THREE.ConeGeometry(8.5, 68, 12, 1, true);
    const rayOffsets = [
      [-18, 28, -12],
      [6, 30, -22],
      [22, 26, 8],
      [-10, 29, 20],
    ];

    rayOffsets.forEach(([x, y, z], idx) => {
      const cone = new THREE.Mesh(rayGeo, rayMat);
      cone.position.set(x, y, z);
      cone.scale.set(0.75 + idx * 0.18, 1, 0.75 + idx * 0.18);
      this.godRayGroup?.add(cone);
    });

    this.scene.add(this.godRayGroup);
  }

  private initAtmosphericEmbers() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    this.emberVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * this.groundSizeX;
      positions[idx + 1] = 0.5 + Math.random() * 24;
      positions[idx + 2] = (Math.random() - 0.5) * this.groundSizeZ;

      this.emberVelocities[idx] = (Math.random() - 0.5) * 1.6;
      this.emberVelocities[idx + 1] = 0.35 + Math.random() * 0.8;
      this.emberVelocities[idx + 2] = (Math.random() - 0.5) * 1.6;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const emberColor =
      this.mapData.theme === 'planet_namek'
        ? '#6ee7b7'
        : this.mapData.theme === 'cyber_neon'
        ? '#38bdf8'
        : '#fb923c';

    const mat = new THREE.PointsMaterial({
      color: emberColor,
      size: 0.18,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.emberPoints = new THREE.Points(geo, mat);
    this.scene.add(this.emberPoints);
  }

  // ---------------------------------------------------------------------------
  // 2. GROUND HEIGHT QUERIES & FRICTION
  // ---------------------------------------------------------------------------
  public getFrictionCoefficient(): number {
    return ARCANUM_WORLD_CONFIG.GroundLayer.FrictionCoefficient;
  }

  public getGroundHeightAt(worldX: number, worldZ: number): number {
    const posAttr = this.groundMesh.geometry.attributes.position as THREE.BufferAttribute;
    const cols = this.groundSegX + 1;
    const rows = this.groundSegZ + 1;

    // Ground PlaneGeometry is rotated -PI/2 around X, so local X = world X, local Y = -world Z, local Z = world Y height!
    const u = THREE.MathUtils.clamp((worldX + this.groundSizeX * 0.5) / this.groundSizeX, 0, 1);
    const v = THREE.MathUtils.clamp((worldZ + this.groundSizeZ * 0.5) / this.groundSizeZ, 0, 1);

    const gx = Math.min(cols - 1, Math.max(0, Math.round(u * this.groundSegX)));
    const gz = Math.min(rows - 1, Math.max(0, Math.round(v * this.groundSegZ)));
    const index = gz * cols + gx;

    if (index < 0 || index >= posAttr.count) return 0;
    return posAttr.getZ(index);
  }

  // ---------------------------------------------------------------------------
  // 3. FOOTSTEP GRANULAR DUST EMITTER
  // ---------------------------------------------------------------------------
  public spawnFootstepDust(worldPos: THREE.Vector3, intensity: number = 1.0) {
    const count = Math.min(18, Math.max(6, Math.round(8 * intensity)));
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const groundY = this.getGroundHeightAt(worldPos.x, worldPos.z);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.35;
      positions[idx] = worldPos.x + Math.cos(angle) * r;
      positions[idx + 1] = groundY + 0.08;
      positions[idx + 2] = worldPos.z + Math.sin(angle) * r;

      const speed = (0.8 + Math.random() * 1.8) * intensity;
      velocities[idx] = Math.cos(angle) * speed;
      velocities[idx + 1] = (0.9 + Math.random() * 1.4) * intensity;
      velocities[idx + 2] = Math.sin(angle) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const dustColor =
      this.mapData.theme === 'planet_namek'
        ? '#5eead4'
        : this.mapData.theme === 'tournament_arena'
        ? '#e2e8f0'
        : '#a8a29e';

    const mat = new THREE.PointsMaterial({
      color: dustColor,
      size: 0.22 * Math.max(0.8, intensity),
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.footstepDustPuffs.push({
      points,
      velocities,
      life: 0,
      maxLife: 0.55,
    });
  }

  // ---------------------------------------------------------------------------
  // 4. ENVIRONMENTAL PHYSICS EVENT: ON_HEAVY_PUNCH_IMPACT()
  // ---------------------------------------------------------------------------
  public onHeavyPunchThrown(
    strikeOrigin: THREE.Vector3,
    forceVector: THREE.Vector3,
    magnitude: number
  ) {
    const normDir = _tmpVecA.copy(forceVector);
    const forceMag = normDir.length();
    if (forceMag > 0.0001) {
      normDir.divideScalar(forceMag);
    } else {
      normDir.set(0, 0, -1);
    }

    const impactPoint = _tmpVecB.copy(strikeOrigin);
    impactPoint.y = this.getGroundHeightAt(impactPoint.x, impactPoint.z);

    // 1. Shockwave & Air Displacement (Radius: Magnitude * 15.0, ExpandSpeed: 340 m/s)
    this.spawnShockwaveRing(strikeOrigin, normDir, magnitude);

    // Ripple Skybox & Part Volumetric Clouds
    if (this.skyUniforms) {
      this.skyUniforms.uShockwaveTime.value = 0;
      this.skyUniforms.uShockwaveStrength.value = Math.min(1.6, 0.45 + magnitude * 0.22);
      this.skyUniforms.uShockwaveOrigin.value.copy(strikeOrigin);
    }
    this.partVolumetricClouds(strikeOrigin, magnitude);
    this.pushAtmosphericEmbers(strikeOrigin, magnitude);

    // Open-Air Environmental Echo Matrix audio
    soundEngine.playShockwaveImpact(magnitude);

    // 2. Terrain & Ground Reaction (Radius = 10m, DisplaceVertexZ, 45 Debris, CameraShake)
    this.deformTerrainCrater(impactPoint, forceVector, magnitude);
    this.spawnCrackedDebris(impactPoint, normDir, magnitude, 45);
    this.triggerCameraShake(magnitude * 0.8, 0.4);

    // 3. Vegetation & Foliage Interaction (60 deg cone, MaxRange: 25m, Snap > 85.0)
    this.interactFoliageInCone(strikeOrigin, forceVector, forceMag, magnitude);
  }

  private spawnShockwaveRing(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    magnitude: number
  ) {
    const group = new THREE.Group();
    group.position.copy(origin);

    const waveColor =
      this.mapData.theme === 'planet_namek'
        ? '#34d399'
        : this.mapData.theme === 'cyber_neon'
        ? '#38bdf8'
        : '#fef08a';

    // Outer air pressure ring (horizontal ground-hugging shockwave)
    const ringGeo = new THREE.RingGeometry(0.75, 1.0, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: waveColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    group.add(ringMesh);

    // Heat-Haze Distortion Ripple Shell facing direction of punch
    const hazeGeo = new THREE.TorusGeometry(0.95, 0.14, 10, 32);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hazeMesh = new THREE.Mesh(hazeGeo, hazeMat);
    const lookTarget = _tmpVecC.copy(origin).add(direction);
    hazeMesh.lookAt(lookTarget);
    group.add(hazeMesh);

    this.scene.add(group);

    const maxRadius = Math.max(8, magnitude * 15.0);
    this.shockwaves.push({
      group,
      ringMesh,
      hazeMesh,
      origin: origin.clone(),
      maxRadius,
      currentRadius: 0.6,
      expandSpeed: 340, // 340 m/s sonic wave speed
      life: 0,
      maxLife: Math.max(0.28, Math.min(0.65, maxRadius / 120 + 0.18)),
    });
  }

  private partVolumetricClouds(origin: THREE.Vector3, magnitude: number) {
    const pushStrength = Math.min(18, 4.0 * magnitude);
    for (const cloud of this.clouds) {
      _tmpVecC.copy(cloud.group.position).sub(origin);
      _tmpVecC.y = 0;
      const dist = _tmpVecC.length();
      if (dist < 90 && dist > 0.1) {
        _tmpVecC.normalize();
        const falloff = 1.0 - dist / 90;
        cloud.pushVel.addScaledVector(_tmpVecC, pushStrength * falloff);
      }
    }
  }

  private pushAtmosphericEmbers(origin: THREE.Vector3, magnitude: number) {
    if (!this.emberPoints) return;
    const posAttr = this.emberPoints.geometry.attributes.position as THREE.BufferAttribute;
    const pushForce = Math.min(28, 7 * magnitude);

    for (let i = 0; i < posAttr.count; i++) {
      const ex = posAttr.getX(i);
      const ey = posAttr.getY(i);
      const ez = posAttr.getZ(i);
      _tmpVecC.set(ex - origin.x, ey - origin.y, ez - origin.z);
      const dist = _tmpVecC.length();
      if (dist < 35 && dist > 0.2) {
        _tmpVecC.normalize();
        const idx = i * 3;
        const factor = (1 - dist / 35) * pushForce;
        this.emberVelocities[idx] += _tmpVecC.x * factor;
        this.emberVelocities[idx + 1] += Math.abs(_tmpVecC.y) * factor * 0.5 + 1.5;
        this.emberVelocities[idx + 2] += _tmpVecC.z * factor;
      }
    }
  }

  private deformTerrainCrater(
    impactCenter: THREE.Vector3,
    forceVector: THREE.Vector3,
    magnitude: number
  ) {
    const geo = this.groundMesh.geometry as THREE.BufferGeometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colorAttr = geo.attributes.color as THREE.BufferAttribute | undefined;

    const radius = 10.0; // Radius = 10m per spec
    const zPushInfluence = Math.abs(forceVector.z) * 0.008;
    const impactDepth = Math.min(1.65, 0.24 * magnitude + zPushInfluence);
    let modified = false;

    for (let i = 0; i < posAttr.count; i++) {
      // PlaneGeometry rotated -PI/2 around X:
      // local X = world X
      // local Y = -world Z
      // local Z = world Y (elevation)
      const vx = posAttr.getX(i);
      const vz = -posAttr.getY(i);
      const dx = vx - impactCenter.x;
      const dz = vz - impactCenter.z;
      const distSq = dx * dx + dz * dz;

      if (distSq <= radius * radius) {
        modified = true;
        const dist = Math.sqrt(distSq);
        const normDist = dist / radius; // 0 at center, 1 at edge

        // Smooth crater bowl in center (0..0.7) + slight displaced rim lip (0.7..1.0)
        let displacement = 0;
        if (normDist < 0.72) {
          const bowl = Math.cos((normDist / 0.72) * (Math.PI * 0.5));
          displacement = -impactDepth * bowl;
        } else {
          const rim = Math.sin(((normDist - 0.72) / 0.28) * Math.PI);
          displacement = impactDepth * 0.28 * rim;
        }

        const currentZ = posAttr.getZ(i);
        // Clamp maximum crater depth so terrain stays playable
        const nextZ = THREE.MathUtils.clamp(currentZ + displacement, -1.9, 1.1);
        posAttr.setZ(i, nextZ);

        // Darken & crack radial crater vertex colors
        if (colorAttr) {
          const scorchFactor = Math.min(1, (1 - normDist) * 0.85);
          _tmpColorA.setRGB(colorAttr.getX(i), colorAttr.getY(i), colorAttr.getZ(i));
          _tmpColorB.set(normDist < 0.4 ? '#18181b' : '#44403c');
          _tmpColorA.lerp(_tmpColorB, scorchFactor * 0.75);
          colorAttr.setXYZ(i, _tmpColorA.r, _tmpColorA.g, _tmpColorA.b);
        }
      }
    }

    if (modified) {
      posAttr.needsUpdate = true;
      if (colorAttr) colorAttr.needsUpdate = true;
      geo.computeVertexNormals();
    }
  }

  private spawnCrackedDebris(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    magnitude: number,
    count: number
  ) {
    // Cap total active debris chunks for smooth 60fps mobile performance
    const maxActive = 135;
    while (this.debrisChunks.length + count > maxActive && this.debrisChunks.length > 0) {
      const oldest = this.debrisChunks.shift()!;
      this.scene.remove(oldest.mesh);
    }

    for (let i = 0; i < count; i++) {
      const mat = i % 3 === 0 ? this.debrisEarthMat : this.debrisConcreteMat;
      const chunk = new THREE.Mesh(this.debrisGeo, mat);
      const scale = 0.45 + Math.random() * 1.15;
      chunk.scale.set(scale, scale * (0.5 + Math.random() * 0.7), scale);
      chunk.castShadow = !this.isSoftwareGl;

      const spreadAngle = Math.random() * Math.PI * 2;
      const spawnRad = Math.random() * 2.4;
      chunk.position.set(
        origin.x + Math.cos(spreadAngle) * spawnRad,
        origin.y + 0.25 + Math.random() * 0.4,
        origin.z + Math.sin(spreadAngle) * spawnRad
      );
      this.scene.add(chunk);

      const radialSpeed = (4 + Math.random() * 10) * Math.min(2.2, 0.7 + magnitude * 0.25);
      const vel = new THREE.Vector3(
        Math.cos(spreadAngle) * radialSpeed + direction.x * 4.5,
        4.5 + Math.random() * 7.5 * Math.min(1.8, 0.65 + magnitude * 0.2),
        Math.sin(spreadAngle) * radialSpeed + direction.z * 4.5
      );
      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      );

      this.debrisChunks.push({
        mesh: chunk,
        vel,
        rotVel,
        life: 0,
        maxLife: 2.2 + Math.random() * 1.2,
      });
    }
  }

  public triggerCameraShake(intensity: number, duration: number = 0.4) {
    this.shakeIntensity = Math.max(this.shakeIntensity, Math.min(3.5, intensity));
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  public sampleCameraShake(): { pitchOffset: number; yawOffset: number; rollOffset: number } {
    if (this.shakeTimer <= 0 || this.shakeIntensity <= 0.001) {
      return { pitchOffset: 0, yawOffset: 0, rollOffset: 0 };
    }
    const ratio = this.shakeTimer / Math.max(0.01, this.shakeDuration);
    const amp = this.shakeIntensity * ratio * 0.018;
    return {
      pitchOffset: (Math.random() - 0.5) * amp * 2.0,
      yawOffset: (Math.random() - 0.5) * amp * 1.6,
      rollOffset: (Math.random() - 0.5) * amp * 1.2,
    };
  }

  private interactFoliageInCone(
    strikeOrigin: THREE.Vector3,
    forceVector: THREE.Vector3,
    forceMagnitude: number,
    magnitude: number
  ) {
    const dirXZ = _tmpVecC.set(forceVector.x, 0, forceVector.z);
    if (dirXZ.lengthSq() < 0.0001) {
      dirXZ.set(0, 0, -1);
    } else {
      dirXZ.normalize();
    }

    const maxRange = 25.0; // MaxRange: 25m
    const halfConeRad = THREE.MathUtils.degToRad(30); // SpreadAngle: 60 degrees (±30 deg)
    const cosHalfCone = Math.cos(halfConeRad);

    for (const flora of this.floraObjects) {
      if (flora.isSnapped) continue;

      const toTreeX = flora.position.x - strikeOrigin.x;
      const toTreeZ = flora.position.z - strikeOrigin.z;
      const dist = Math.hypot(toTreeX, toTreeZ);

      if (dist > maxRange) continue;

      const invDist = dist > 0.001 ? 1 / dist : 1;
      const dot = (toTreeX * invDist) * dirXZ.x + (toTreeZ * invDist) * dirXZ.z;

      // Match 60-degree forward cone OR immediate close-range shockwave splash (<= 4.5m)
      if (dot < cosHalfCone && dist > 4.5) continue;

      const distanceFactor = Math.max(0.1, 1.0 - dist / maxRange);
      const effectiveForce = forceMagnitude * distanceFactor;

      // Shed leaves & twigs in a green-and-brown cloud
      this.spawnLeafParticleBurst(flora, distanceFactor * magnitude);

      if (forceMagnitude > 85.0 && distanceFactor > 0.35) {
        // Structural threshold exceeded -> Trunk Snap & Fracture into Dynamic RigidBody
        flora.isSnapped = true;
        soundEngine.playTreeSnap();

        // Reparent upperPivot into scene world space at snap point (~0.9m high)
        const worldPos = new THREE.Vector3();
        flora.upperPivot.getWorldPosition(worldPos);
        flora.rootGroup.remove(flora.upperPivot);
        flora.upperPivot.position.copy(worldPos);
        this.scene.add(flora.upperPivot);

        flora.dynamicPos.copy(worldPos);
        const launchSpeed = Math.min(22, 9 + (effectiveForce - 40) * 0.12);
        flora.dynamicVel.set(
          dirXZ.x * launchSpeed + (Math.random() - 0.5) * 3,
          4.2 + Math.random() * 3.5,
          dirXZ.z * launchSpeed + (Math.random() - 0.5) * 3
        );
        // Pitch forward in direction of blast + twist spin
        flora.dynamicRotVel.set(
          dirXZ.z * 3.8,
          (Math.random() - 0.5) * 2.5,
          -dirXZ.x * 3.8
        );

        // Extra high-density leaf burst on trunk fracture
        this.spawnLeafParticleBurst(flora, magnitude * 1.4);
      } else {
        // Elastic Trunk Bending clamped to 45 degrees with Elastic Snap-Back
        const pushStrength = Math.min(18, 6.5 * distanceFactor * Math.max(1, magnitude * 0.45));
        // Rotating around Z bends along X (negative), rotating around X bends along Z (positive)
        flora.velBendZ -= dirXZ.x * pushStrength;
        flora.velBendX += dirXZ.z * pushStrength;
      }
    }
  }

  private spawnLeafParticleBurst(flora: FloraObject, intensity: number) {
    const count = Math.min(60, Math.max(24, Math.round(32 * Math.max(0.8, intensity * 0.6))));
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    const canopyColor = new THREE.Color(flora.canopyLeafColor);
    const brownBarkColor = new THREE.Color('#78350f');
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 2.2;
      positions[idx] = flora.position.x + Math.cos(a) * r;
      positions[idx + 1] = flora.position.y + 3.0 + Math.random() * 2.2;
      positions[idx + 2] = flora.position.z + Math.sin(a) * r;

      const isBark = i % 4 === 0;
      c.copy(isBark ? brownBarkColor : canopyColor).offsetHSL(
        (Math.random() - 0.5) * 0.04,
        0,
        (Math.random() - 0.5) * 0.1
      );
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;

      const burstSpd = 2.5 + Math.random() * 5.5;
      velocities[idx] = Math.cos(a) * burstSpd;
      velocities[idx + 1] = 1.8 + Math.random() * 4.0;
      velocities[idx + 2] = Math.sin(a) * burstSpd;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.leafBursts.push({
      points,
      velocities,
      life: 0,
      maxLife: 1.9 + Math.random() * 0.8,
    });
  }

  // ---------------------------------------------------------------------------
  // 5. PER-FRAME WORLD SIMULATION TICK
  // ---------------------------------------------------------------------------
  public update(delta: number, focusPos?: THREE.Vector3) {
    this.worldTime += delta;

    // A. Dynamic Time-of-Day Cycling & Skybox Shockwave Decay (low-angle golden hour shadows)
    const cycleAngle = this.worldTime * 0.03; // slow atmospheric cycle
    const sunElev = 0.36 + Math.sin(cycleAngle) * 0.06;
    const sunAzimuth = 0.78 + cycleAngle * 0.35;
    const sunDir = _tmpVecA
      .set(Math.cos(sunAzimuth), sunElev, Math.sin(sunAzimuth))
      .normalize();

    if (focusPos) {
      this.sunLight.target.position.set(focusPos.x, 0, focusPos.z);
      this.sunLight.position.copy(this.sunLight.target.position).addScaledVector(sunDir, 38);
      this.sunLight.target.updateMatrixWorld();
    } else {
      this.sunLight.position.copy(sunDir).multiplyScalar(65);
    }

    if (this.skyUniforms) {
      this.skyUniforms.uTime.value = this.worldTime;
      this.skyUniforms.uSunDir.value.copy(sunDir);
      this.skyUniforms.uShockwaveTime.value += delta;
      this.skyUniforms.uShockwaveStrength.value = THREE.MathUtils.damp(
        this.skyUniforms.uShockwaveStrength.value,
        0,
        4.5,
        delta
      );
    }

    // Subtle volumetric sun ray orientation & gentle shimmer
    if (this.godRayGroup) {
      this.godRayGroup.rotation.z = Math.sin(cycleAngle) * 0.16;
      this.godRayGroup.rotation.x = Math.cos(cycleAngle) * 0.12;
    }

    // B. Volumetric Cloud Drift + Shockwave Parting Recovery
    for (const cloud of this.clouds) {
      cloud.orbitAngle += cloud.driftSpeed * delta;
      const targetX = Math.cos(cloud.orbitAngle) * cloud.orbitRadius;
      const targetZ = Math.sin(cloud.orbitAngle) * cloud.orbitRadius;

      cloud.pushOffset.addScaledVector(cloud.pushVel, delta);
      cloud.pushVel.multiplyScalar(Math.exp(-3.2 * delta));
      cloud.pushOffset.lerp(_tmpVecB.set(0, 0, 0), 1 - Math.exp(-0.8 * delta));

      cloud.group.position.set(
        targetX + cloud.pushOffset.x,
        cloud.altitude + Math.sin(this.worldTime * 0.5 + cloud.orbitAngle) * 0.6,
        targetZ + cloud.pushOffset.z
      );
      cloud.group.lookAt(0, cloud.altitude - 10, 0);
    }

    // C. High-Altitude Atmospheric Turbulence & Particle Embers
    if (this.emberPoints) {
      const posAttr = this.emberPoints.geometry.attributes.position as THREE.BufferAttribute;
      const halfX = this.groundSizeX * 0.5;
      const halfZ = this.groundSizeZ * 0.5;

      for (let i = 0; i < posAttr.count; i++) {
        const idx = i * 3;
        // Relax velocity back to gentle ambient wind
        this.emberVelocities[idx] = THREE.MathUtils.damp(
          this.emberVelocities[idx],
          Math.sin(this.worldTime * 0.6 + i) * 1.1,
          1.8,
          delta
        );
        this.emberVelocities[idx + 1] = THREE.MathUtils.damp(
          this.emberVelocities[idx + 1],
          0.55,
          1.8,
          delta
        );
        this.emberVelocities[idx + 2] = THREE.MathUtils.damp(
          this.emberVelocities[idx + 2],
          Math.cos(this.worldTime * 0.5 + i) * 1.1,
          1.8,
          delta
        );

        let nx = posAttr.getX(i) + this.emberVelocities[idx] * delta;
        let ny = posAttr.getY(i) + this.emberVelocities[idx + 1] * delta;
        let nz = posAttr.getZ(i) + this.emberVelocities[idx + 2] * delta;

        if (ny > 26) ny = 0.5;
        if (nx > halfX) nx = -halfX;
        if (nx < -halfX) nx = halfX;
        if (nz > halfZ) nz = -halfZ;
        if (nz < -halfZ) nz = halfZ;

        posAttr.setXYZ(i, nx, ny, nz);
      }
      posAttr.needsUpdate = true;
    }

    // D. Shockwave Distortion Rings (340 m/s expansion)
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life += delta;
      // Scale visual growth cleanly so 340 m/s punch wave expands convincingly across arena
      sw.currentRadius = Math.min(sw.maxRadius, sw.currentRadius + sw.expandSpeed * 0.32 * delta);
      const t = sw.life / sw.maxLife;

      sw.ringMesh.scale.setScalar(sw.currentRadius);
      sw.hazeMesh.scale.setScalar(0.8 + sw.currentRadius * 0.42);
      (sw.ringMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - t));
      (sw.hazeMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.65 * (1 - t));

      if (sw.life >= sw.maxLife) {
        this.scene.remove(sw.group);
        sw.ringMesh.geometry.dispose();
        (sw.ringMesh.material as THREE.Material).dispose();
        sw.hazeMesh.geometry.dispose();
        (sw.hazeMesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // E. Cracked Concrete & Shattered Earth Debris
    const friction = ARCANUM_WORLD_CONFIG.GroundLayer.FrictionCoefficient;
    for (let i = this.debrisChunks.length - 1; i >= 0; i--) {
      const d = this.debrisChunks[i];
      d.life += delta;
      d.vel.y -= 20.0 * delta;
      d.mesh.position.addScaledVector(d.vel, delta);
      d.mesh.rotation.x += d.rotVel.x * delta;
      d.mesh.rotation.y += d.rotVel.y * delta;
      d.mesh.rotation.z += d.rotVel.z * delta;

      const floorY = this.getGroundHeightAt(d.mesh.position.x, d.mesh.position.z) + 0.1;
      if (d.mesh.position.y < floorY) {
        d.mesh.position.y = floorY;
        d.vel.y = Math.abs(d.vel.y) * 0.28;
        d.vel.x *= 1 - friction * 0.55;
        d.vel.z *= 1 - friction * 0.55;
        d.rotVel.multiplyScalar(0.65);
      }

      if (d.life >= d.maxLife) {
        this.scene.remove(d.mesh);
        this.debrisChunks.splice(i, 1);
      }
    }

    // F. Foliage Elastic Snap-Back + Dynamic Rigid-Body Snapped Trunks
    const maxBendRad = THREE.MathUtils.degToRad(45); // BendingLimit: 45 degrees
    const springK = 36.0;
    const springDamping = 5.4;

    for (const flora of this.floraObjects) {
      if (!flora.isSnapped) {
        // Elastic spring back to upright
        const accX = -springK * flora.bendX - springDamping * flora.velBendX;
        const accZ = -springK * flora.bendZ - springDamping * flora.velBendZ;

        flora.velBendX += accX * delta;
        flora.velBendZ += accZ * delta;
        flora.bendX = THREE.MathUtils.clamp(flora.bendX + flora.velBendX * delta, -maxBendRad, maxBendRad);
        flora.bendZ = THREE.MathUtils.clamp(flora.bendZ + flora.velBendZ * delta, -maxBendRad, maxBendRad);

        // Add gentle ambient wind sway on top of elastic shockwave bend
        const windX = Math.sin(this.worldTime * 1.6 + flora.position.x * 0.3) * 0.025;
        const windZ = Math.cos(this.worldTime * 1.3 + flora.position.z * 0.3) * 0.02;
        flora.upperPivot.rotation.set(flora.bendX + windX, 0, flora.bendZ + windZ);
      } else if (!flora.settled) {
        // Rigid-body tumbling of snapped trunk across the terrain
        flora.dynamicVel.y -= 19.5 * delta;
        flora.dynamicPos.addScaledVector(flora.dynamicVel, delta);
        flora.upperPivot.position.copy(flora.dynamicPos);
        flora.upperPivot.rotation.x += flora.dynamicRotVel.x * delta;
        flora.upperPivot.rotation.y += flora.dynamicRotVel.y * delta;
        flora.upperPivot.rotation.z += flora.dynamicRotVel.z * delta;

        const floorY = this.getGroundHeightAt(flora.dynamicPos.x, flora.dynamicPos.z) + 0.55;
        if (flora.dynamicPos.y <= floorY) {
          flora.dynamicPos.y = floorY;
          flora.upperPivot.position.y = floorY;

          if (Math.abs(flora.dynamicVel.y) > 1.2) {
            flora.dynamicVel.y = Math.abs(flora.dynamicVel.y) * 0.3;
          } else {
            flora.dynamicVel.y = 0;
          }

          flora.dynamicVel.x *= Math.exp(-friction * 4.5 * delta);
          flora.dynamicVel.z *= Math.exp(-friction * 4.5 * delta);
          flora.dynamicRotVel.multiplyScalar(Math.exp(-friction * 3.8 * delta));

          if (
            flora.dynamicVel.lengthSq() < 0.08 &&
            Math.abs(flora.dynamicVel.y) < 0.05 &&
            flora.dynamicRotVel.lengthSq() < 0.08
          ) {
            flora.settled = true;
          }
        }
      }
    }

    // G. Leaf & Branch Particle Bursts
    this.updateParticleSystemList(this.leafBursts, delta, 4.2, 2.2);

    // H. Footstep Granular Dust Puffs
    this.updateParticleSystemList(this.footstepDustPuffs, delta, 1.8, 3.0);

    // I. Camera Shake Timer Decay
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - delta);
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  private updateParticleSystemList(
    list: LeafBurstParticle[],
    delta: number,
    gravity: number,
    airDrag: number
  ) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life += delta;
      const posAttr = p.points.geometry.attributes.position as THREE.BufferAttribute;

      for (let j = 0; j < posAttr.count; j++) {
        const idx = j * 3;
        p.velocities[idx] *= Math.exp(-airDrag * delta);
        p.velocities[idx + 1] -= gravity * delta;
        p.velocities[idx + 2] *= Math.exp(-airDrag * delta);

        const px = posAttr.getX(j);
        const pz = posAttr.getZ(j);
        const flutter = Math.sin(this.worldTime * 8 + j) * 0.45 * delta;
        let ny = posAttr.getY(j) + p.velocities[idx + 1] * delta;
        const floorY = this.getGroundHeightAt(px, pz) + 0.06;
        if (ny < floorY) {
          ny = floorY;
          p.velocities[idx] *= 0.6;
          p.velocities[idx + 1] = 0;
          p.velocities[idx + 2] *= 0.6;
        }
        posAttr.setXYZ(
          j,
          px + p.velocities[idx] * delta + flutter,
          ny,
          pz + p.velocities[idx + 2] * delta
        );
      }
      posAttr.needsUpdate = true;
      (p.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.scene.remove(p.points);
        p.points.geometry.dispose();
        (p.points.material as THREE.Material).dispose();
        list.splice(i, 1);
      }
    }
  }

  public dispose() {
    if (this.skyDome) {
      this.scene.remove(this.skyDome);
      this.skyDome.geometry.dispose();
      (this.skyDome.material as THREE.Material).dispose();
      this.skyDome = null;
    }

    const disposedGeos = new Set<THREE.BufferGeometry>();
    const disposedMats = new Set<THREE.Material>();

    this.clouds.forEach(cloud => {
      this.scene.remove(cloud.group);
      cloud.group.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          if (!disposedGeos.has(m.geometry)) {
            m.geometry.dispose();
            disposedGeos.add(m.geometry);
          }
          const mat = m.material as THREE.Material;
          if (mat && !disposedMats.has(mat)) {
            mat.dispose();
            disposedMats.add(mat);
          }
        }
      });
    });
    this.clouds = [];

    if (this.godRayGroup) {
      this.scene.remove(this.godRayGroup);
      this.godRayGroup.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          if (!disposedGeos.has(m.geometry)) {
            m.geometry.dispose();
            disposedGeos.add(m.geometry);
          }
          const mat = m.material as THREE.Material;
          if (mat && !disposedMats.has(mat)) {
            mat.dispose();
            disposedMats.add(mat);
          }
        }
      });
      this.godRayGroup = null;
    }

    if (this.emberPoints) {
      this.scene.remove(this.emberPoints);
      this.emberPoints.geometry.dispose();
      (this.emberPoints.material as THREE.Material).dispose();
      this.emberPoints = null;
    }

    this.shockwaves.forEach(sw => {
      this.scene.remove(sw.group);
      sw.ringMesh.geometry.dispose();
      (sw.ringMesh.material as THREE.Material).dispose();
      sw.hazeMesh.geometry.dispose();
      (sw.hazeMesh.material as THREE.Material).dispose();
    });
    this.debrisChunks.forEach(d => this.scene.remove(d.mesh));
    this.leafBursts.forEach(p => {
      this.scene.remove(p.points);
      p.points.geometry.dispose();
      (p.points.material as THREE.Material).dispose();
    });
    this.footstepDustPuffs.forEach(p => {
      this.scene.remove(p.points);
      p.points.geometry.dispose();
      (p.points.material as THREE.Material).dispose();
    });
    this.debrisGeo.dispose();
    this.debrisConcreteMat.dispose();
    this.debrisEarthMat.dispose();
  }
}
