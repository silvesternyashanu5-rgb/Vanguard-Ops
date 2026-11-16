import * as THREE from 'three';
import { ArenaMap } from '../types/game';
import {
  createContainerTexture,
  getConcreteSlabMaps,
  getConcreteWallMaps,
  getRockBumpMap,
  getRockNormalMap,
} from './threeModels';
import { FloraObject } from './arcanumWorldSimulator';
import {
  MapObstacle,
  createOrientedBoxCollider,
} from './collision';

export type { MapObstacle, OrientedBoxCollider, CylinderCollider } from './collision';

export interface BuiltMap {
  group: THREE.Group;
  obstacles: MapObstacle[];
  spawnPoints: THREE.Vector3[];
  groundMesh: THREE.Mesh;
  groundSegments: { segX: number; segZ: number };
  flora: FloraObject[];
}

export function buildArenaMap(mapData: ArenaMap): BuiltMap {
  const group = new THREE.Group();
  group.name = `Arena_${mapData.id}`;
  const obstacles: MapObstacle[] = [];
  const spawnPoints: THREE.Vector3[] = [];
  const flora: FloraObject[] = [];

  // 1. Terrain / Deformable Multi-Layer Mesh Grid (72 x 72 segments for dynamic craters)
  const segX = 72;
  const segZ = 72;
  const slabMaps = getConcreteSlabMaps(mapData.groundColor);
  const groundGeo = new THREE.PlaneGeometry(mapData.mapSize.x, mapData.mapSize.z, segX, segZ);

  // Initialize vertex colors so crater deformation visibly chars/cracks outward
  const vCount = groundGeo.attributes.position.count;
  const vColors = new Float32Array(vCount * 3);
  for (let i = 0; i < vCount; i++) {
    const shade = 0.94 + Math.random() * 0.1;
    vColors[i * 3] = shade;
    vColors[i * 3 + 1] = shade;
    vColors[i * 3 + 2] = shade;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));

  const groundMat = new THREE.MeshStandardMaterial({
    map: slabMaps.map,
    normalMap: slabMaps.normalMap,
    normalScale: new THREE.Vector2(1.4, 1.4),
    bumpMap: slabMaps.bumpMap,
    bumpScale: 0.03,
    roughnessMap: slabMaps.roughnessMap,
    vertexColors: true,
    roughness: mapData.theme === 'midnight_warehouse' ? 0.55 : 0.9,
    metalness: mapData.theme === 'cyber_neon' ? 0.16 : 0.04,
    envMapIntensity: 0.35,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Boundary walls (Poured architectural concrete perimeter walls with seam/tie-hole relief)
  const wallTint =
    mapData.theme === 'dust_district'
      ? '#7c6448'
      : mapData.theme === 'planet_namek'
      ? '#3d5855'
      : '#4b4f56';
  const wallMaps = getConcreteWallMaps(wallTint);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallMaps.map,
    normalMap: wallMaps.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3),
    bumpMap: wallMaps.bumpMap,
    bumpScale: 0.035,
    roughness: 0.92,
    metalness: 0.05,
    envMapIntensity: 0.3,
  });

  const halfX = mapData.mapSize.x / 2;
  const halfZ = mapData.mapSize.z / 2;
  const wallHeight = 5.0;
  const wallThickness = 2;

  // North, South, East, West walls (scale UV coordinates cleanly to avoid texture stretching)
  const wallConfigs = [
    { size: [mapData.mapSize.x, wallHeight, wallThickness], pos: [0, wallHeight / 2, -halfZ], repU: mapData.mapSize.x / 16 },
    { size: [mapData.mapSize.x, wallHeight, wallThickness], pos: [0, wallHeight / 2, halfZ], repU: mapData.mapSize.x / 16 },
    { size: [wallThickness, wallHeight, mapData.mapSize.z], pos: [-halfX, wallHeight / 2, 0], repU: mapData.mapSize.z / 16 },
    { size: [wallThickness, wallHeight, mapData.mapSize.z], pos: [halfX, wallHeight / 2, 0], repU: mapData.mapSize.z / 16 },
  ];

  wallConfigs.forEach(cfg => {
    const wGeo = new THREE.BoxGeometry(cfg.size[0], cfg.size[1], cfg.size[2]);
    const uvAttr = wGeo.attributes.uv as THREE.BufferAttribute;
    for (let u = 0; u < uvAttr.count; u++) {
      uvAttr.setX(u, uvAttr.getX(u) * cfg.repU);
    }
    uvAttr.needsUpdate = true;

    const wMesh = new THREE.Mesh(wGeo, wallMat);
    wMesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    wMesh.receiveShadow = true;
    wMesh.castShadow = true;
    group.add(wMesh);

    const box = new THREE.Box3().setFromObject(wMesh);
    obstacles.push({ box, type: 'wall' });
  });

  // 2. Predefined Map Layouts & Props
  if (mapData.theme === 'city_z') {
    buildCityZ(group, obstacles, spawnPoints, halfX, halfZ);
  } else if (mapData.theme === 'tournament_arena') {
    buildTournamentArena(group, obstacles, spawnPoints, halfX, halfZ);
  } else if (mapData.theme === 'planet_namek') {
    buildPlanetNamek(group, obstacles, spawnPoints, halfX, halfZ);
  } else if (mapData.theme === 'cyber_neon') {
    buildNeonComplex(group, obstacles, spawnPoints, halfX, halfZ);
  } else if (mapData.theme === 'dust_district') {
    buildDustDistrict(group, obstacles, spawnPoints, halfX, halfZ);
  } else {
    buildMidnightWarehouse(group, obstacles, spawnPoints, halfX, halfZ);
  }

  // 3. Populate Interactive Procedural Flora Groves + Scattered 3D Concrete Rubble
  populateArenaFlora(group, mapData, flora, obstacles, halfX, halfZ);
  populateConcreteRubble(group, mapData, halfX, halfZ);

  // Fallback spawn points if none registered
  if (spawnPoints.length === 0) {
    spawnPoints.push(
      new THREE.Vector3(-25, 0, -25),
      new THREE.Vector3(25, 0, 25),
      new THREE.Vector3(-25, 0, 25),
      new THREE.Vector3(25, 0, -25),
      new THREE.Vector3(0, 0, -28),
      new THREE.Vector3(0, 0, 28)
    );
  }

  return {
    group,
    obstacles,
    spawnPoints,
    groundMesh: ground,
    groundSegments: { segX, segZ },
    flora,
  };
}

// -------------------------------------------------------------
// MAP 1: Neon Complex
// -------------------------------------------------------------
function buildNeonComplex(
  group: THREE.Group,
  obstacles: MapObstacle[],
  spawns: THREE.Vector3[],
  _halfX: number,
  _halfZ: number
) {
  const containerTexRed = createContainerTexture('#dc2626', true);
  const containerTexBlue = createContainerTexture('#2563eb', true);
  const containerTexYellow = createContainerTexture('#ca8a04', false);

  const matRed = new THREE.MeshStandardMaterial({ map: containerTexRed, roughness: 0.4, metalness: 0.6 });
  const matBlue = new THREE.MeshStandardMaterial({ map: containerTexBlue, roughness: 0.4, metalness: 0.6 });
  const matYellow = new THREE.MeshStandardMaterial({ map: containerTexYellow, roughness: 0.4, metalness: 0.6 });

  // Helper to add shipping container (exact OBB so angled/stacked containers slide cleanly)
  const addContainer = (x: number, y: number, z: number, rotY: number, mat: THREE.Material) => {
    const cMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 9), mat);
    cMesh.position.set(x, y + 1.5, z);
    cMesh.rotation.y = rotY;
    cMesh.castShadow = true;
    cMesh.receiveShadow = true;
    group.add(cMesh);

    const box = new THREE.Box3().setFromObject(cMesh);
    const obb = createOrientedBoxCollider(cMesh.position, cMesh.rotation, 4, 3, 9);
    obstacles.push({ box, obb, type: 'crate' });
  };

  // Stacked cargo containers around central courtyard
  addContainer(-14, 0, -10, 0, matRed);
  addContainer(-14, 3, -10, 0, matYellow);
  addContainer(-14, 0, -19, 0, matBlue);

  addContainer(14, 0, 10, 0, matBlue);
  addContainer(14, 3, 10, 0, matRed);
  addContainer(14, 0, 19, 0, matYellow);

  addContainer(-12, 0, 14, Math.PI / 2, matYellow);
  addContainer(12, 0, -14, Math.PI / 2, matRed);

  // Elevated central Catwalk / Sniper Platform
  const platformMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5, metalness: 0.8 });
  const platform = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 8), platformMat);
  platform.position.set(0, 3.8, -2);
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  const platBox = new THREE.Box3().setFromObject(platform);
  obstacles.push({ box: platBox, type: 'building' });

  // Support pillars (solid cylinders)
  const pillarMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7, metalness: 0.5 });
  [-7, 7].forEach(px => {
    [-3, 3].forEach(pz => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3.8, 8), pillarMat);
      pillar.position.set(px, 1.9, -2 + pz);
      pillar.castShadow = true;
      group.add(pillar);
      obstacles.push({
        box: new THREE.Box3().setFromObject(pillar),
        cylinder: { x: px, z: -2 + pz, radius: 0.34, minY: 0, maxY: 3.8 },
        type: 'cylinder',
      });
    });
  });

  // Walkable Access Ramp up to Catwalk (sloped upward toward -Z meeting catwalk front lip at z=+2.0, y=4.0)
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 8.2), platformMat);
  ramp.position.set(0, 2.05, 5.6);
  ramp.rotation.x = 0.48;
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  group.add(ramp);
  obstacles.push({
    box: new THREE.Box3().setFromObject(ramp),
    obb: createOrientedBoxCollider(ramp.position, ramp.rotation, 4, 0.3, 8.2),
    isWalkableRamp: true,
    type: 'ramp',
  });

  // Cyber Neon Signs & Glowing light bars
  const neonMatCyan = new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 2.5 });
  const neonMatPink = new THREE.MeshStandardMaterial({ color: '#ec4899', emissive: '#ec4899', emissiveIntensity: 2.5 });

  const sign1 = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 0.2), neonMatCyan);
  sign1.position.set(0, 5.2, -5.8);
  group.add(sign1);

  const sign2 = new THREE.Mesh(new THREE.BoxGeometry(6, 1.0, 0.2), neonMatPink);
  sign2.position.set(-14, 5.5, -10);
  group.add(sign2);

  // Spawns
  spawns.push(
    new THREE.Vector3(-28, 0, -28),
    new THREE.Vector3(28, 0, 28),
    new THREE.Vector3(-28, 0, 28),
    new THREE.Vector3(28, 0, -28),
    new THREE.Vector3(0, 4.0, -2), // Catwalk spawn
    new THREE.Vector3(0, 0, 22)
  );
}

// -------------------------------------------------------------
// MAP 2: Dust District
// -------------------------------------------------------------
function buildDustDistrict(
  group: THREE.Group,
  obstacles: MapObstacle[],
  spawns: THREE.Vector3[],
  _halfX: number,
  _halfZ: number
) {
  const adobeMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.95, metalness: 0.05 });
  const sandbagMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9, metalness: 0.1 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.85, metalness: 0.1 });

  // Adobe Buildings
  const addBuilding = (x: number, z: number, w: number, h: number, d: number) => {
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), adobeMat);
    bMesh.position.set(x, h / 2, z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    group.add(bMesh);

    const box = new THREE.Box3().setFromObject(bMesh);
    obstacles.push({ box, type: 'building' });
  };

  addBuilding(-18, -16, 14, 6, 12);
  addBuilding(18, 16, 14, 6, 12);
  addBuilding(-16, 18, 10, 5, 10);
  addBuilding(16, -18, 10, 5, 10);

  // Central Watchtower
  const towerFloor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 8), woodMat);
  towerFloor.position.set(0, 4.2, 0);
  towerFloor.castShadow = true;
  group.add(towerFloor);
  obstacles.push({ box: new THREE.Box3().setFromObject(towerFloor), type: 'building' });

  // Tower legs (solid cylinders)
  [-3.5, 3.5].forEach(x => {
    [-3.5, 3.5].forEach(z => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4.2, 8), woodMat);
      leg.position.set(x, 2.1, z);
      leg.castShadow = true;
      group.add(leg);
      obstacles.push({
        box: new THREE.Box3().setFromObject(leg),
        cylinder: { x, z, radius: 0.3, minY: 0, maxY: 4.2 },
        type: 'cylinder',
      });
    });
  });

  // Sandbag fortifications (tight OBBs)
  const addSandbags = (x: number, z: number, rotY: number) => {
    const bags = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 1.2), sandbagMat);
    bags.position.set(x, 0.6, z);
    bags.rotation.y = rotY;
    bags.castShadow = true;
    bags.receiveShadow = true;
    group.add(bags);

    obstacles.push({
      box: new THREE.Box3().setFromObject(bags),
      obb: createOrientedBoxCollider(bags.position, bags.rotation, 4.5, 1.2, 1.2),
      type: 'crate',
    });
  };

  addSandbags(0, -10, 0);
  addSandbags(0, 10, 0);
  addSandbags(-8, 0, Math.PI / 2);
  addSandbags(8, 0, Math.PI / 2);

  // Spawns
  spawns.push(
    new THREE.Vector3(-30, 0, -30),
    new THREE.Vector3(30, 0, 30),
    new THREE.Vector3(-30, 0, 30),
    new THREE.Vector3(30, 0, -30),
    new THREE.Vector3(0, 4.5, 0), // Watchtower top
    new THREE.Vector3(0, 0, -22)
  );
}

// -------------------------------------------------------------
// MAP 3: Midnight Warehouse
// -------------------------------------------------------------
function buildMidnightWarehouse(
  group: THREE.Group,
  obstacles: MapObstacle[],
  spawns: THREE.Vector3[],
  _halfX: number,
  _halfZ: number
) {
  const containerDark = createContainerTexture('#1e293b', true);
  const containerSteel = createContainerTexture('#334155', false);
  const matDark = new THREE.MeshStandardMaterial({ map: containerDark, roughness: 0.35, metalness: 0.7 });
  const matSteel = new THREE.MeshStandardMaterial({ map: containerSteel, roughness: 0.35, metalness: 0.7 });

  const barrelMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    roughness: 0.4,
    metalness: 0.8,
  });

  // Labyrinth container maze (exact OBBs for angled containers)
  const addContainer = (x: number, y: number, z: number, rotY: number, mat: THREE.Material) => {
    const cMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 9), mat);
    cMesh.position.set(x, y + 1.5, z);
    cMesh.rotation.y = rotY;
    cMesh.castShadow = true;
    cMesh.receiveShadow = true;
    group.add(cMesh);

    obstacles.push({
      box: new THREE.Box3().setFromObject(cMesh),
      obb: createOrientedBoxCollider(cMesh.position, cMesh.rotation, 4, 3, 9),
      type: 'crate',
    });
  };

  addContainer(-10, 0, 0, 0, matDark);
  addContainer(-10, 3, 0, 0, matSteel);

  addContainer(10, 0, 0, 0, matSteel);
  addContainer(10, 3, 0, 0, matDark);

  addContainer(0, 0, -15, Math.PI / 2, matDark);
  addContainer(0, 0, 15, Math.PI / 2, matSteel);

  addContainer(-20, 0, -18, 0.4, matSteel);
  addContainer(20, 0, 18, -0.4, matDark);

  // Explosive Oil Barrels (cylinders)
  const addBarrels = (x: number, z: number) => {
    for (let i = 0; i < 3; i++) {
      const bx = x + (i - 1) * 0.9;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 12), barrelMat);
      barrel.position.set(bx, 0.55, z);
      barrel.castShadow = true;
      group.add(barrel);
      obstacles.push({
        box: new THREE.Box3().setFromObject(barrel),
        cylinder: { x: bx, z, radius: 0.42, minY: 0, maxY: 1.1 },
        type: 'barrel',
      });
    }
  };

  addBarrels(-5, 8);
  addBarrels(5, -8);
  addBarrels(-16, 6);

  // Spawns
  spawns.push(
    new THREE.Vector3(-25, 0, -25),
    new THREE.Vector3(25, 0, 25),
    new THREE.Vector3(-25, 0, 25),
    new THREE.Vector3(25, 0, -25),
    new THREE.Vector3(0, 0, -6),
    new THREE.Vector3(0, 0, 6)
  );
}

// -------------------------------------------------------------
// MAP 4: City Z - Ground Zero (Saitama's Domain)
// -------------------------------------------------------------
function buildCityZ(
  group: THREE.Group,
  obstacles: MapObstacle[],
  spawns: THREE.Vector3[],
  _halfX: number,
  _halfZ: number
) {
  const concreteMat = new THREE.MeshStandardMaterial({ color: '#3f3f46', roughness: 0.9, metalness: 0.1 });
  const darkRubbleMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.95, metalness: 0.05 });
  const roadMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.8, metalness: 0.2 });
  const craterGlowMat = new THREE.MeshStandardMaterial({
    color: '#ea580c',
    emissive: '#ea580c',
    emissiveIntensity: 2.2,
    roughness: 0.2
  });

  // 1. Central Meteor Impact Crater (walkable raised slabs)
  const craterOuter = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 0.4, 32), darkRubbleMat);
  craterOuter.position.set(0, 0.2, 0);
  craterOuter.receiveShadow = true;
  group.add(craterOuter);
  obstacles.push({
    box: new THREE.Box3().setFromObject(craterOuter),
    cylinder: { x: 0, z: 0, radius: 15.0, minY: 0, maxY: 0.4 },
    type: 'cylinder',
  });

  const craterCore = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 0.5, 24), craterGlowMat);
  craterCore.position.set(0, 0.26, 0);
  group.add(craterCore);
  obstacles.push({
    box: new THREE.Box3().setFromObject(craterCore),
    cylinder: { x: 0, z: 0, radius: 9.0, minY: 0, maxY: 0.51 },
    type: 'cylinder',
  });

  // 2. Elevated Ruined Highway Overpass (High ground sniper bridge)
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(38, 0.8, 8), roadMat);
  bridgeDeck.position.set(0, 4.8, -16);
  bridgeDeck.castShadow = true;
  bridgeDeck.receiveShadow = true;
  group.add(bridgeDeck);
  obstacles.push({ box: new THREE.Box3().setFromObject(bridgeDeck), type: 'building' });

  // Overpass concrete support pillars (solid cylinders)
  [-12, 0, 12].forEach(px => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4.8, 12), concreteMat);
    pillar.position.set(px, 2.4, -16);
    pillar.castShadow = true;
    group.add(pillar);
    obstacles.push({
      box: new THREE.Box3().setFromObject(pillar),
      cylinder: { x: px, z: -16, radius: 0.82, minY: 0, maxY: 4.8 },
      type: 'cylinder',
    });
  });

  // East & West walkable ramps leading smoothly from ground flush onto the overpass deck
  const rampEast = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 6), roadMat);
  rampEast.position.set(24.4, 2.65, -16);
  rampEast.rotation.z = -0.375;
  rampEast.castShadow = true;
  rampEast.receiveShadow = true;
  group.add(rampEast);
  obstacles.push({
    box: new THREE.Box3().setFromObject(rampEast),
    obb: createOrientedBoxCollider(rampEast.position, rampEast.rotation, 14, 0.5, 6),
    isWalkableRamp: true,
    type: 'ramp',
  });

  const rampWest = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 6), roadMat);
  rampWest.position.set(-24.4, 2.65, -16);
  rampWest.rotation.z = 0.375;
  rampWest.castShadow = true;
  rampWest.receiveShadow = true;
  group.add(rampWest);
  obstacles.push({
    box: new THREE.Box3().setFromObject(rampWest),
    obb: createOrientedBoxCollider(rampWest.position, rampWest.rotation, 14, 0.5, 6),
    isWalkableRamp: true,
    type: 'ramp',
  });

  // 3. Ruined Apartment Skyscraper Towers
  const addRuinedTower = (x: number, z: number, w: number, h: number, d: number) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), concreteMat);
    tower.position.set(x, h / 2, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);
    obstacles.push({ box: new THREE.Box3().setFromObject(tower), type: 'building' });

    // Decorative window indentations
    const winMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.2 });
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, h * 0.6, d + 0.1), winMat);
    win.position.set(x, h / 2, z);
    group.add(win);
  };

  addRuinedTower(-24, 18, 12, 10, 12);
  addRuinedTower(24, 18, 12, 12, 12);
  addRuinedTower(-26, -10, 10, 8, 10);
  addRuinedTower(26, -10, 10, 8, 10);

  // 4. Tactical concrete Jersey barriers (exact OBBs for angled cover)
  const addBarrier = (x: number, z: number, rotY: number) => {
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 0.8), darkRubbleMat);
    barrier.position.set(x, 0.6, z);
    barrier.rotation.y = rotY;
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    group.add(barrier);
    obstacles.push({
      box: new THREE.Box3().setFromObject(barrier),
      obb: createOrientedBoxCollider(barrier.position, barrier.rotation, 4.5, 1.2, 0.8),
      type: 'crate',
    });
  };

  addBarrier(-8, 6, 0.2);
  addBarrier(8, 6, -0.2);
  addBarrier(-12, -4, Math.PI / 2);
  addBarrier(12, -4, Math.PI / 2);
  addBarrier(0, 16, 0);

  // Spawns
  spawns.push(
    new THREE.Vector3(-28, 0, -28),
    new THREE.Vector3(28, 0, 28),
    new THREE.Vector3(-28, 0, 28),
    new THREE.Vector3(28, 0, -28),
    new THREE.Vector3(0, 5.2, -16), // On highway bridge
    new THREE.Vector3(0, 0, 20)
  );
}

// -------------------------------------------------------------
// MAP 5: World Martial Arts Tournament Stage (Goku's Sacred Ring)
// -------------------------------------------------------------
function buildTournamentArena(
  group: THREE.Group,
  obstacles: MapObstacle[],
  spawns: THREE.Vector3[],
  _halfX: number,
  _halfZ: number
) {
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.65, metalness: 0.1 });
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.7, metalness: 0.2 });
  const redWoodMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.6, metalness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.3, metalness: 0.8 });
  const roofTileMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4, metalness: 0.3 });

  // 1. Central Elevated Stone Fighting Ring (26m x 26m, height 1.4m)
  const ring = new THREE.Mesh(new THREE.BoxGeometry(26, 1.4, 26), stoneMat);
  ring.position.set(0, 0.7, 0);
  ring.receiveShadow = true;
  ring.castShadow = true;
  group.add(ring);
  obstacles.push({ box: new THREE.Box3().setFromObject(ring), type: 'building' });

  // Red Boundary Ring Tiles
  const borderRing = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.05, 26.4), redWoodMat);
  borderRing.position.set(0, 1.42, 0);
  group.add(borderRing);

  // Inner fighting square
  const innerMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.6 });
  const innerSquare = new THREE.Mesh(new THREE.BoxGeometry(24, 0.06, 24), innerMat);
  innerSquare.position.set(0, 1.43, 0);
  group.add(innerSquare);

  // 2. Four Sacred Stone Dragon Corner Pillars
  const cornerCoords = [
    [-13, -13],
    [13, -13],
    [-13, 13],
    [13, 13]
  ];

  cornerCoords.forEach(([cx, cz]) => {
    // Stone Column (cylinder)
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 4.5, 12), darkStoneMat);
    col.position.set(cx, 2.25, cz);
    col.castShadow = true;
    group.add(col);
    obstacles.push({
      box: new THREE.Box3().setFromObject(col),
      cylinder: { x: cx, z: cz, radius: 0.85, minY: 0, maxY: 4.5 },
      type: 'cylinder',
    });

    // Golden Dragon Head / Orb
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), goldMat);
    orb.position.set(cx, 4.8, cz);
    group.add(orb);
  });

  // 3. North & South Traditional Temple Viewing Pagodas
  const addPagoda = (zPos: number, isNorth: boolean) => {
    // Veranda Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(20, 2.5, 8), darkStoneMat);
    base.position.set(0, 1.25, zPos);
    base.castShadow = true;
    group.add(base);
    obstacles.push({ box: new THREE.Box3().setFromObject(base), type: 'building' });

    // Red Pillars (solid cylinders on top of veranda)
    [-8, -4, 0, 4, 8].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3.5, 8), redWoodMat);
      p.position.set(px, 4.25, zPos);
      p.castShadow = true;
      group.add(p);
      obstacles.push({
        box: new THREE.Box3().setFromObject(p),
        cylinder: { x: px, z: zPos, radius: 0.32, minY: 2.5, maxY: 6.0 },
        type: 'cylinder',
      });
    });

    // Tiered Pagoda Roof (walkable/solid high slab)
    const roof1 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.6, 10), roofTileMat);
    roof1.position.set(0, 6.2, zPos);
    group.add(roof1);
    obstacles.push({ box: new THREE.Box3().setFromObject(roof1), type: 'building' });

    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(5, 2.2, 4), roofTileMat);
    roof2.position.set(0, 7.6, zPos);
    roof2.rotation.y = Math.PI / 4;
    group.add(roof2);
  };

  addPagoda(-26, true);
  addPagoda(26, false);

  // 4. East & West Torii Gates
  const addTorii = (xPos: number) => {
    [-3.5, 3.5].forEach(pz => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 5.0, 10), redWoodMat);
      post.position.set(xPos, 2.5, pz);
      post.castShadow = true;
      group.add(post);
      obstacles.push({
        box: new THREE.Box3().setFromObject(post),
        cylinder: { x: xPos, z: pz, radius: 0.4, minY: 0, maxY: 5.0 },
        type: 'cylinder',
      });
    });

    const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 9.0), redWoodMat);
    crossbeam.position.set(xPos, 5.2, 0);
    group.add(crossbeam);
    obstacles.push({ box: new THREE.Box3().setFromObject(crossbeam), type: 'wall' });
  };

  addTorii(-28);
  addTorii(28);

  // Spawns
  spawns.push(
    new THREE.Vector3(-22, 0, -22),
    new THREE.Vector3(22, 0, 22),
    new THREE.Vector3(-22, 0, 22),
    new THREE.Vector3(22, 0, -22),
    new THREE.Vector3(0, 1.45, 0), // Center ring spawn
    new THREE.Vector3(2, 2.55, 24.5) // South pagoda veranda spawn (clear of pillars)
  );
}

// -------------------------------------------------------------
// MAP 6: Planet Namek Wasteland (Goku vs. Frieza Battleground)
// -------------------------------------------------------------
function buildPlanetNamek(
  group: THREE.Group,
  obstacles: MapObstacle[],
  spawns: THREE.Vector3[],
  _halfX: number,
  _halfZ: number
) {
  const rockMat = new THREE.MeshStandardMaterial({ color: '#047857', roughness: 0.9, metalness: 0.1 });
  const plateauMat = new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.85, metalness: 0.15 });
  const domeMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.5, metalness: 0.05 });
  const energyPoolMat = new THREE.MeshStandardMaterial({
    color: '#06b6d4',
    emissive: '#0891b2',
    emissiveIntensity: 2.5,
    roughness: 0.1
  });

  // 1. Towering Rock Plateaus (cylinders)
  const addPlateau = (x: number, z: number, r: number, h: number) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, 16), plateauMat);
    p.position.set(x, h / 2, z);
    p.castShadow = true;
    p.receiveShadow = true;
    group.add(p);
    obstacles.push({
      box: new THREE.Box3().setFromObject(p),
      cylinder: { x, z, radius: r * 0.96, minY: 0, maxY: h },
      type: 'building',
    });
  };

  addPlateau(-22, -20, 6, 8);
  addPlateau(22, 20, 6, 8);
  addPlateau(-20, 22, 5, 6);
  addPlateau(20, -22, 5, 6);

  // Walkable Access Ramps to Plateaus (flush from ground up to 8m plateau rim)
  const ramp1 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 15), rockMat);
  ramp1.position.set(-22, 3.92, -7.8);
  ramp1.rotation.x = 0.56;
  ramp1.castShadow = true;
  group.add(ramp1);
  obstacles.push({
    box: new THREE.Box3().setFromObject(ramp1),
    obb: createOrientedBoxCollider(ramp1.position, ramp1.rotation, 5, 0.5, 15),
    isWalkableRamp: true,
    type: 'ramp',
  });

  const ramp2 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 15), rockMat);
  ramp2.position.set(22, 3.92, 7.8);
  ramp2.rotation.x = -0.56;
  ramp2.castShadow = true;
  group.add(ramp2);
  obstacles.push({
    box: new THREE.Box3().setFromObject(ramp2),
    obb: createOrientedBoxCollider(ramp2.position, ramp2.rotation, 5, 0.5, 15),
    isWalkableRamp: true,
    type: 'ramp',
  });

  // 2. Namekian Organic Clay Dome Houses (cylinder base + dome collider)
  const addNamekHouse = (x: number, z: number) => {
    // Base cylinder
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 3.5, 18), domeMat);
    base.position.set(x, 1.75, z);
    base.castShadow = true;
    group.add(base);
    obstacles.push({
      box: new THREE.Box3().setFromObject(base),
      cylinder: { x, z, radius: 4.5, minY: 0, maxY: 3.5 },
      type: 'building',
    });

    // Dome roof
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.5, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.set(x, 3.5, z);
    dome.castShadow = true;
    group.add(dome);
    obstacles.push({
      box: new THREE.Box3().setFromObject(dome),
      cylinder: { x, z, radius: 3.5, minY: 3.5, maxY: 7.4 },
      type: 'building',
    });

    // Antenna spire
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 3.0, 8), domeMat);
    spire.position.set(x, 6.5, z);
    group.add(spire);
  };

  addNamekHouse(-16, 0);
  addNamekHouse(16, 0);

  // 3. Central Geothermal Glowing Energy Pool
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.3, 24), energyPoolMat);
  pool.position.set(0, 0.15, 0);
  group.add(pool);

  // Surrounding natural rock spires (cylinders)
  [-7, 7].forEach(rx => {
    [-7, 7].forEach(rz => {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 5.0, 8), rockMat);
      spire.position.set(rx, 2.5, rz);
      spire.castShadow = true;
      group.add(spire);
      obstacles.push({
        box: new THREE.Box3().setFromObject(spire),
        cylinder: { x: rx, z: rz, radius: 1.05, minY: 0, maxY: 5.0 },
        type: 'wall',
      });
    });
  });

  // Spawns
  spawns.push(
    new THREE.Vector3(-28, 0, -28),
    new THREE.Vector3(28, 0, 28),
    new THREE.Vector3(-28, 0, 28),
    new THREE.Vector3(28, 0, -28),
    new THREE.Vector3(-22, 8.2, -20), // High plateau sniper spawn
    new THREE.Vector3(22, 8.2, 20)
  );
}

// -------------------------------------------------------------
// PROCEDURAL COMPOSITE VEGETATION & FOLIAGE BUILDER
// Multi-part Tree Group (Root flare + Snap stump + Upper pivot + Branches + Multi-cluster foliage)
// -------------------------------------------------------------
function populateArenaFlora(
  group: THREE.Group,
  mapData: ArenaMap,
  floraList: FloraObject[],
  obstacles: MapObstacle[],
  halfX: number,
  halfZ: number
) {
  const theme = mapData.theme;

  const barkHex =
    theme === 'planet_namek'
      ? '#475569'
      : theme === 'city_z'
      ? '#27272a'
      : '#5c3a21';

  const canopyLeafColor =
    theme === 'planet_namek'
      ? 0x0d9488
      : theme === 'city_z'
      ? 0x4d7c0f
      : theme === 'dust_district'
      ? 0x65a30d
      : theme === 'cyber_neon'
      ? 0x059669
      : 0x16a34a;

  const barkMat = new THREE.MeshStandardMaterial({
    color: barkHex,
    roughness: 0.92,
    metalness: 0.04,
  });

  const branchMat = new THREE.MeshStandardMaterial({
    color: barkHex,
    roughness: 0.88,
    metalness: 0.04,
  });

  const leafMatPrimary = new THREE.MeshStandardMaterial({
    color: canopyLeafColor,
    roughness: 0.62,
    metalness: 0.05,
  });

  const leafMatHighlight = new THREE.MeshStandardMaterial({
    color: new THREE.Color(canopyLeafColor).offsetHSL(0.03, 0.06, 0.09),
    roughness: 0.58,
    metalness: 0.05,
  });

  // Curated tree groves positioned cleanly clear of buildings/spawns while lining sightlines
  const treeCoords: Array<[number, number, number]> =
    theme === 'tournament_arena'
      ? [
          [-20, -14, 1.05],
          [-20, 14, 0.95],
          [20, -14, 1.1],
          [20, 14, 1.0],
          [-32, -6, 1.2],
          [-32, 8, 1.1],
          [32, -8, 1.15],
          [32, 6, 1.05],
          [-14, -33, 1.1],
          [14, -33, 1.05],
          [-14, 33, 1.0],
          [14, 33, 1.15],
          [-26, -26, 0.95],
          [26, 26, 1.05],
        ]
      : theme === 'planet_namek'
      ? [
          [-13, -14, 1.15],
          [13, -14, 1.0],
          [-13, 14, 1.05],
          [13, 14, 1.1],
          [-32, -8, 1.2],
          [32, 8, 1.2],
          [0, -28, 1.1],
          [0, 28, 1.15],
          [-29, 10, 0.95],
          [29, -10, 1.0],
          [-10, -26, 1.0],
          [10, 26, 1.05],
        ]
      : [
          [-17, -26, 1.05],
          [17, -26, 1.1],
          [-17, 26, 1.0],
          [17, 26, 1.12],
          [-33, 0, 1.2],
          [33, 0, 1.15],
          [-32, -20, 1.0],
          [32, 20, 1.05],
          [-6, -28, 0.95],
          [6, 28, 1.0],
          [-20, 4, 1.05],
          [20, -4, 1.05],
        ];

  const stumpGeo = new THREE.CylinderGeometry(0.28, 0.42, 0.95, 9);
  const rootGeo = new THREE.BoxGeometry(0.22, 0.45, 0.65);
  const upperTrunkGeo = new THREE.CylinderGeometry(0.16, 0.27, 2.8, 9);
  const branchGeo = new THREE.CylinderGeometry(0.06, 0.12, 1.45, 7);
  const crownGeo = new THREE.DodecahedronGeometry(1.35, 1);
  const subCrownGeo = new THREE.DodecahedronGeometry(0.95, 1);

  treeCoords.forEach(([x, z, scale], idx) => {
    // Clamp safely inside perimeter walls
    if (Math.abs(x) > halfX - 4 || Math.abs(z) > halfZ - 4) return;

    const rootGroup = new THREE.Group();
    rootGroup.position.set(x, 0, z);
    rootGroup.scale.setScalar(scale);

    // 1. Anchored Stump & Root Buttresses (remains after trunk snaps!)
    const stumpGroup = new THREE.Group();
    const stump = new THREE.Mesh(stumpGeo, barkMat);
    stump.position.y = 0.475;
    stump.castShadow = true;
    stump.receiveShadow = true;
    stumpGroup.add(stump);

    for (let r = 0; r < 3; r++) {
      const root = new THREE.Mesh(rootGeo, barkMat);
      const a = (r / 3) * Math.PI * 2 + idx * 0.4;
      root.position.set(Math.cos(a) * 0.34, 0.18, Math.sin(a) * 0.34);
      root.rotation.y = -a + Math.PI / 2;
      root.rotation.x = 0.45;
      stumpGroup.add(root);
    }
    rootGroup.add(stumpGroup);

    // 2. Breakable / Bendable Upper Trunk Pivot (anchored at snap height y = 0.9)
    const upperPivot = new THREE.Group();
    upperPivot.position.set(0, 0.9, 0);

    const upperTrunk = new THREE.Mesh(upperTrunkGeo, barkMat);
    upperTrunk.position.y = 1.35;
    upperTrunk.castShadow = true;
    upperTrunk.receiveShadow = true;
    upperPivot.add(upperTrunk);

    // 3 Primary Spreading Branches
    for (let b = 0; b < 3; b++) {
      const bAngle = (b / 3) * Math.PI * 2 + idx * 0.7;
      const branch = new THREE.Mesh(branchGeo, branchMat);
      branch.position.set(Math.cos(bAngle) * 0.48, 2.25 + b * 0.18, Math.sin(bAngle) * 0.48);
      branch.rotation.z = -Math.cos(bAngle) * 0.75;
      branch.rotation.x = Math.sin(bAngle) * 0.75;
      branch.castShadow = true;
      upperPivot.add(branch);

      // Sub-canopy cluster at branch tip
      const subCanopy = new THREE.Mesh(
        subCrownGeo,
        b % 2 === 0 ? leafMatPrimary : leafMatHighlight
      );
      subCanopy.position.set(Math.cos(bAngle) * 0.95, 2.95 + b * 0.15, Math.sin(bAngle) * 0.95);
      subCanopy.scale.set(1.15, 0.88, 1.15);
      subCanopy.castShadow = true;
      subCanopy.receiveShadow = true;
      upperPivot.add(subCanopy);
    }

    // Main Top Foliage Crown
    const mainCrown = new THREE.Mesh(crownGeo, leafMatPrimary);
    mainCrown.position.set(0, 3.55, 0);
    mainCrown.scale.set(1.22, 0.96, 1.22);
    mainCrown.castShadow = true;
    mainCrown.receiveShadow = true;
    upperPivot.add(mainCrown);

    rootGroup.add(upperPivot);
    group.add(rootGroup);

    const floraId = `flora_${idx}`;
    const trunkRadius = 0.42 * scale;
    const fullHeight = 3.5 * scale;
    const stumpHeight = 0.95 * scale;
    obstacles.push({
      box: new THREE.Box3(
        new THREE.Vector3(x - trunkRadius, 0, z - trunkRadius),
        new THREE.Vector3(x + trunkRadius, fullHeight, z + trunkRadius)
      ),
      cylinder: {
        x,
        z,
        radius: trunkRadius,
        minY: 0,
        maxY: fullHeight,
        floraId,
        stumpMaxY: stumpHeight,
      },
      type: 'tree',
    });

    floraList.push({
      id: floraId,
      rootGroup,
      stumpGroup,
      upperPivot,
      position: new THREE.Vector3(x, 0, z),
      theme,
      bendX: 0,
      bendZ: 0,
      velBendX: 0,
      velBendZ: 0,
      isSnapped: false,
      dynamicPos: new THREE.Vector3(x, 0.9 * scale, z),
      dynamicVel: new THREE.Vector3(),
      dynamicRotVel: new THREE.Vector3(),
      settled: false,
      canopyLeafColor,
    });
  });
}

// -------------------------------------------------------------
// SCATTERED 3D CONCRETE RUBBLE & WEATHERED STONES (Instanced + AO Contact Shadows)
// -------------------------------------------------------------
function populateConcreteRubble(
  group: THREE.Group,
  mapData: ArenaMap,
  halfX: number,
  halfZ: number
) {
  const rockGeo = new THREE.IcosahedronGeometry(0.18, 0);
  const pos = rockGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const cut = 0.72 + 0.42 * Math.abs(Math.sin(i * 17.3 + x * 23.1 + z * 11.7));
    const flatBaseY = y < 0 ? y * 0.48 : y * (0.62 + cut * 0.24);
    pos.setXYZ(i, x * cut, flatBaseY, z * (0.78 + (i % 3) * 0.16));
  }
  rockGeo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    color: mapData.theme === 'planet_namek' ? '#36524e' : '#585b60',
    normalMap: getRockNormalMap(),
    normalScale: new THREE.Vector2(1.15, 1.15),
    bumpMap: getRockBumpMap(),
    bumpScale: 0.025,
    roughness: 0.94,
    metalness: 0.04,
    flatShading: true,
    envMapIntensity: 0.28,
  });

  // Soft dark radial AO contact shadow disk beneath each rock
  const aoCanvas = document.createElement('canvas');
  aoCanvas.width = 64;
  aoCanvas.height = 64;
  const aCtx = aoCanvas.getContext('2d')!;
  const aGrad = aCtx.createRadialGradient(32, 32, 3, 32, 32, 30);
  aGrad.addColorStop(0, 'rgba(5, 7, 10, 0.85)');
  aGrad.addColorStop(0.55, 'rgba(8, 10, 14, 0.42)');
  aGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  aCtx.fillStyle = aGrad;
  aCtx.fillRect(0, 0, 64, 64);
  const aoTex = new THREE.CanvasTexture(aoCanvas);

  const rockShadowGeo = new THREE.PlaneGeometry(0.46, 0.34);
  const rockShadowMat = new THREE.MeshBasicMaterial({
    map: aoTex,
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });

  const count = 110;
  const instancedRocks = new THREE.InstancedMesh(rockGeo, rockMat, count);
  instancedRocks.castShadow = true;
  instancedRocks.receiveShadow = true;

  const instancedShadows = new THREE.InstancedMesh(rockShadowGeo, rockShadowMat, count);

  const dummy = new THREE.Object3D();
  const sDummy = new THREE.Object3D();
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // Deterministic spread across arena floor
    const rx = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1;
    const rz = ((Math.sin(i * 19.193) * 24634.6345) % 1 + 1) % 1;
    const x = (rx * 2 - 1) * (halfX - 3.5);
    const z = (rz * 2 - 1) * (halfZ - 3.5);

    const scaleBase = 0.5 + ((i * 17) % 10) * 0.11;
    const sx = scaleBase * (0.95 + (i % 3) * 0.22);
    const sy = scaleBase * (0.58 + (i % 2) * 0.24);
    const sz = scaleBase * (0.88 + ((i + 1) % 3) * 0.2);

    dummy.position.set(x, sy * 0.09, z);
    dummy.rotation.set(
      ((i * 13) % 7) * 0.18,
      ((i * 29) % 11) * 0.57,
      ((i * 7) % 5) * 0.16
    );
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    instancedRocks.setMatrixAt(i, dummy.matrix);

    // Grounded contact + directional shadow under each rock chunk
    sDummy.position.set(x - sx * 0.12, 0.012, z + sz * 0.08);
    sDummy.rotation.set(-Math.PI / 2, 0, ((i * 29) % 11) * 0.57);
    sDummy.scale.set(sx * 1.15, sz * 0.95, 1);
    sDummy.updateMatrix();
    instancedShadows.setMatrixAt(i, sDummy.matrix);

    const shade = 0.62 + ((i * 23) % 10) * 0.052;
    col.setRGB(shade, shade * 0.99, shade * 0.97);
    instancedRocks.setColorAt(i, col);
  }
  instancedRocks.instanceMatrix.needsUpdate = true;
  if (instancedRocks.instanceColor) instancedRocks.instanceColor.needsUpdate = true;
  instancedShadows.instanceMatrix.needsUpdate = true;
  group.add(instancedShadows);
  group.add(instancedRocks);
}


