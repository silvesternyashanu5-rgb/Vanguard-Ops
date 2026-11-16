import * as THREE from 'three';
import { OperatorSkin, WeaponData } from '../types/game';
import {
  applyUniversalRealismUpgrade,
  attachRealisticCape,
  buildRealisticHumanoidBody,
  getConcreteSlabMaps,
  getConcreteWallMaps,
  getRockBumpMap,
  getRockNormalMap,
  makeCapeMaterial,
  makeFabricMaterial,
  makeLeatherMaterial,
  makeSkinMaterial,
} from './realisticAnatomy';

export { getConcreteSlabMaps, getConcreteWallMaps, getRockBumpMap, getRockNormalMap };

// Procedural texture cache to avoid re-generating
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates high-fidelity procedural camouflage texture using Canvas
 */
export function createCamoTexture(pattern: OperatorSkin['camoPattern'], primaryHex: string): THREE.CanvasTexture {
  const key = `${pattern}_${primaryHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base background
  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 512, 512);

  if (pattern === 'tactical_navy') {
    // Blue / navy digital camo splotches
    const colors = ['#1e3a8a', '#3b82f6', '#172554', '#93c5fd', '#0f172a'];
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const x = Math.floor(Math.random() * 64) * 8;
      const y = Math.floor(Math.random() * 64) * 8;
      const w = (Math.floor(Math.random() * 4) + 1) * 8;
      const h = (Math.floor(Math.random() * 4) + 1) * 8;
      ctx.fillRect(x, y, w, h);
    }
  } else if (pattern === 'desert_camo') {
    const colors = ['#78350f', '#b45309', '#d97706', '#fef3c7', '#451a03'];
    for (let i = 0; i < 350; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 28 + 12;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'cyber_neon') {
    // Circuit grid lines & tech glyphs
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(512, i);
      ctx.stroke();
    }
    ctx.fillStyle = '#ec4899';
    for (let i = 0; i < 60; i++) {
      ctx.fillRect(Math.random() * 500, Math.random() * 500, 16, 16);
    }
  } else if (pattern === 'gold_damascus') {
    // Damascus steel wavy lines
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    for (let y = 0; y < 512; y += 12) {
      ctx.beginPath();
      for (let x = 0; x < 512; x += 10) {
        const ny = y + Math.sin(x * 0.05 + y * 0.02) * 12 + Math.cos(x * 0.02) * 6;
        if (x === 0) ctx.moveTo(x, ny);
        else ctx.lineTo(x, ny);
      }
      ctx.stroke();
    }
  } else {
    // Urban shadow
    const colors = ['#18181b', '#27272a', '#3f3f46', '#52525b', '#09090b'];
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const w = Math.random() * 40 + 20;
      const h = Math.random() * 40 + 20;
      ctx.fillRect(x, y, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates procedural industrial container / metal texture
 */
export function createContainerTexture(colorHex: string, hasStripe: boolean = true): THREE.CanvasTexture {
  const key = `container_${colorHex}_${hasStripe}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Corrugated vertical ridges
  for (let x = 0; x < 512; x += 32) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(x, 0, 16, 512);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(x + 16, 0, 4, 512);
  }

  // Industrial caution hazard stripes
  if (hasStripe) {
    ctx.save();
    ctx.translate(256, 120);
    ctx.rotate(0.35);
    for (let i = -300; i < 300; i += 30) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(i, -20, 15, 40);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(i + 15, -20, 15, 40);
    }
    ctx.restore();

    // Stencil text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('TACTICAL-09', 40, 440);
    ctx.fillText('CARGO / HAZARD', 40, 480);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates ground concrete / tarmac texture (PBR cracked concrete slabs matching weathered arena floors)
 */
export function createGroundTexture(groundColorHex: string): THREE.CanvasTexture {
  return getConcreteSlabMaps(groundColorHex).map;
}

/**
 * Procedural 3D Weapon Model (Assault, Sniper, SMG, Shotgun, Pistol, Knife)
 * Composite 6-10 part mesh
 */
export function createWeaponMesh(weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = `Weapon_${weapon.id}`;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: weapon.colorScheme.primary,
    metalness: 0.85,
    roughness: 0.25,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: weapon.colorScheme.secondary,
    metalness: 0.7,
    roughness: 0.35,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: weapon.colorScheme.accent,
    metalness: 0.9,
    roughness: 0.2,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: weapon.colorScheme.glow,
    emissive: weapon.colorScheme.glow,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });

  if (weapon.type === 'assault') {
    // 1. Receiver / Lower Body
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.55), bodyMat);
    receiver.position.set(0, 0, 0);
    receiver.castShadow = true;
    group.add(receiver);

    // 2. Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 12), trimMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.48);
    barrel.castShadow = true;
    group.add(barrel);

    // 3. Muzzle brake
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.08, 8), accentMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.02, 0.75);
    group.add(muzzle);

    // 4. Magazine (Curved / banana clip)
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.12), trimMat);
    mag.rotation.x = 0.2;
    mag.position.set(0, -0.16, 0.1);
    group.add(mag);

    // 5. Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.35), trimMat);
    stock.position.set(0, -0.02, -0.4);
    group.add(stock);

    // 6. Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.09), trimMat);
    grip.rotation.x = -0.3;
    grip.position.set(0, -0.14, -0.12);
    group.add(grip);

    // 7. Tactical Holo Sight
    const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.15), accentMat);
    opticBase.position.set(0, 0.1, 0.02);
    group.add(opticBase);

    const opticLens = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), glowMat);
    opticLens.rotation.x = Math.PI / 2;
    opticLens.position.set(0, 0.11, 0.08);
    group.add(opticLens);

    // 8. Tactical Laser Module
    const laser = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.12), accentMat);
    laser.position.set(0.07, 0.02, 0.35);
    group.add(laser);

  } else if (weapon.type === 'sniper') {
    // Long heavy rifle with huge optical scope
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.7), bodyMat);
    group.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.9, 16), trimMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, 0.75);
    group.add(barrel);

    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.14), accentMat);
    muzzle.position.set(0, 0.03, 1.25);
    group.add(muzzle);

    // Heavy Telescopic Scope
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 16), trimMat);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.16, 0.05);
    group.add(scopeTube);

    const scopeLens = new THREE.Mesh(new THREE.CircleGeometry(0.042, 16), glowMat);
    scopeLens.position.set(0, 0.16, 0.25);
    group.add(scopeLens);

    // Stock & Bipod
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.45), trimMat);
    stock.position.set(0, -0.02, -0.5);
    group.add(stock);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.14), accentMat);
    mag.position.set(0, -0.15, 0.05);
    group.add(mag);

  } else if (weapon.type === 'smg') {
    // Compact high-RPM submachine gun
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.15, 0.4), bodyMat);
    group.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 12), trimMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.3);
    group.add(barrel);

    const suppr = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 16), accentMat);
    suppr.rotation.x = Math.PI / 2;
    suppr.position.set(0, 0.02, 0.45);
    group.add(suppr);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.08), glowMat);
    mag.rotation.x = -0.2;
    mag.position.set(0, -0.18, 0.05);
    group.add(mag);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), trimMat);
    grip.rotation.x = -0.3;
    grip.position.set(0, -0.12, -0.1);
    group.add(grip);

  } else if (weapon.type === 'shotgun') {
    // Heavy tactical combat shotgun with dual tubes
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.5), bodyMat);
    group.add(receiver);

    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 12), trimMat);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(0, 0.04, 0.5);
    group.add(barrel1);

    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 12), accentMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, -0.04, 0.48);
    group.add(tube);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.25), glowMat);
    pump.position.set(0, -0.03, 0.45);
    group.add(pump);

  } else if (weapon.type === 'pistol') {
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.28), bodyMat);
    slide.position.set(0, 0.05, 0.02);
    group.add(slide);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.1), trimMat);
    frame.rotation.x = -0.25;
    frame.position.set(0, -0.06, -0.04);
    group.add(frame);

    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.08), accentMat);
    accent.position.set(0, 0.09, -0.08);
    group.add(accent);

  } else if (weapon.type === 'knife') {
    // Tactical Combat Knife
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.32), accentMat);
    blade.position.set(0, 0, 0.15);
    group.add(blade);

    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.16), bodyMat);
    hilt.position.set(0, 0, -0.08);
    group.add(hilt);

  } else if (weapon.type === 'fist') {
    // Heroic Clenched Punch Gauntlet (Saitama / Martial Artist)
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.38, 16), trimMat);
    forearm.rotation.x = Math.PI / 2;
    forearm.position.set(0, -0.04, -0.22);
    forearm.castShadow = true;
    group.add(forearm);

    // Clenched Gauntlet / Fist
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.2), bodyMat);
    fist.position.set(0, 0, 0);
    fist.castShadow = true;
    group.add(fist);

    // Knuckle Strike Plate
    const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.07), accentMat);
    knuckles.position.set(0, 0.01, 0.11);
    group.add(knuckles);

    // Kinetic Wind / Shockwave Ring around knuckles
    const shockRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 8, 24), glowMat);
    shockRing.position.set(0, 0.01, 0.14);
    group.add(shockRing);

  } else if (weapon.type === 'ki_blast') {
    // Goku's Ki Palm Blaster
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.28, 16), bodyMat);
    wrist.rotation.x = Math.PI / 2;
    wrist.position.set(0, -0.04, -0.2);
    group.add(wrist);

    // Martial Palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.08), trimMat);
    palm.position.set(0, 0, -0.04);
    group.add(palm);

    // Hovering Radiant Ki Sphere
    const kiSphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), glowMat);
    kiSphere.position.set(0, 0, 0.14);
    group.add(kiSphere);

    // Orbiting Ki Ring
    const kiRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 8, 24), accentMat);
    kiRing.position.set(0, 0, 0.14);
    kiRing.rotation.x = Math.PI / 3;
    group.add(kiRing);

  } else if (weapon.type === 'beam') {
    // Kamehameha Cupped Charge Core
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), glowMat);
    core.position.set(0, 0, 0.12);
    group.add(core);

    const outerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshBasicMaterial({
        color: weapon.colorScheme.glow,
        transparent: true,
        opacity: 0.45,
        wireframe: true,
      })
    );
    outerGlow.position.set(0, 0, 0.12);
    group.add(outerGlow);

    // Concentrated Beam Projection Tube
    const beamProjection = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.45, 16), accentMat);
    beamProjection.rotation.x = Math.PI / 2;
    beamProjection.position.set(0, 0, 0.38);
    group.add(beamProjection);

  } else if (weapon.type === 'energy_ball') {
    // Spirit Bomb Celestial Sphere
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), glowMat);
    orb.position.set(0, 0.08, 0.12);
    group.add(orb);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 8, 32), accentMat);
    ring1.position.set(0, 0.08, 0.12);
    ring1.rotation.x = Math.PI / 4;
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 8, 32), trimMat);
    ring2.position.set(0, 0.08, 0.12);
    ring2.rotation.y = Math.PI / 4;
    group.add(ring2);

  } else if (weapon.type === 'kryptonian_strike') {
    // Kryptonian Power Gauntlet / Sonic Shockwave Emitter
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.36, 16), bodyMat);
    forearm.rotation.x = Math.PI / 2;
    forearm.position.set(0, -0.04, -0.2);
    group.add(forearm);

    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.16, 0.21), trimMat);
    group.add(fist);

    const crestPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 5), accentMat);
    crestPlate.rotation.x = Math.PI / 2;
    crestPlate.position.set(0, 0.01, 0.12);
    group.add(crestPlate);

    const sonicRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 24), glowMat);
    sonicRing.position.set(0, 0, 0.16);
    group.add(sonicRing);

  } else if (weapon.type === 'heat_vision') {
    // Twin Solar Optical Plasma Lenses
    const coreEmitter = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.14), bodyMat);
    group.add(coreEmitter);

    [-0.06, 0.06].forEach(xPos => {
      const eyeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.36, 12), glowMat);
      eyeLens.rotation.x = Math.PI / 2;
      eyeLens.position.set(xPos, 0.01, 0.2);
      group.add(eyeLens);
    });

    const solarHalo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.015, 8, 24), accentMat);
    solarHalo.position.set(0, 0, 0.12);
    group.add(solarHalo);

  } else if (weapon.type === 'super_breath') {
    // Arctic Sub-Zero Cone Vortex
    const vortexCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.44, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: weapon.colorScheme.glow,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      })
    );
    vortexCone.rotation.x = -Math.PI / 2;
    vortexCone.position.set(0, 0, 0.24);
    group.add(vortexCone);

    const frostCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), accentMat);
    frostCore.position.set(0, 0, 0.06);
    group.add(frostCore);

  } else if (weapon.type === 'arcane_bolt') {
    // Arcane Gauntlet + Hovering Prism Focus
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.26, 14), bodyMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, -0.02, -0.18);
    group.add(cuff);

    const runeRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 24), accentMat);
    runeRing.position.set(0, 0.02, 0.14);
    group.add(runeRing);

    const prism = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glowMat);
    prism.position.set(0, 0.02, 0.14);
    group.add(prism);

  } else if (weapon.type === 'rune_beam') {
    // Ornate Aether Scepter Focus
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.65, 12), bodyMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, -0.02, 0.06);
    group.add(shaft);

    const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 24), accentMat);
    crownRing.position.set(0, 0, 0.44);
    group.add(crownRing);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), glowMat);
    crystal.scale.set(0.85, 0.85, 1.5);
    crystal.position.set(0, 0, 0.44);
    group.add(crystal);

  } else if (weapon.type === 'chronos_orb') {
    // Spinning Temporal Astrolabe Sphere
    const coreOrb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), glowMat);
    coreOrb.position.set(0, 0.04, 0.14);
    group.add(coreOrb);

    const outerAstrolabe = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 8, 28), accentMat);
    outerAstrolabe.position.set(0, 0.04, 0.14);
    outerAstrolabe.rotation.x = Math.PI / 3;
    group.add(outerAstrolabe);

    const innerAstrolabe = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 8, 28), trimMat);
    innerAstrolabe.position.set(0, 0.04, 0.14);
    innerAstrolabe.rotation.y = Math.PI / 3;
    group.add(innerAstrolabe);

  } else if (weapon.type === 'void_nova') {
    // Void Grimoire Sigil Emitter
    const tomeCover = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.06), bodyMat);
    tomeCover.position.set(0, 0.02, 0.08);
    tomeCover.rotation.x = -0.35;
    group.add(tomeCover);

    const sigilDisc = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 24), glowMat);
    sigilDisc.position.set(0, 0.04, 0.22);
    group.add(sigilDisc);

    const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), accentMat);
    starCore.position.set(0, 0.04, 0.22);
    group.add(starCore);

  } else if (weapon.type === 'king_engine') {
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.3, 14), bodyMat);
    forearm.rotation.x = Math.PI / 2;
    forearm.position.set(0, -0.02, -0.18);
    group.add(forearm);

    const pulseCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glowMat);
    pulseCore.position.set(0, 0.02, 0.14);
    group.add(pulseCore);

    const sonicRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 24), accentMat);
    sonicRing.position.set(0, 0.02, 0.16);
    group.add(sonicRing);

  } else if (weapon.type === 'king_wave') {
    const waveSphere = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 18), glowMat);
    waveSphere.position.set(0, 0.02, 0.14);
    group.add(waveSphere);

    const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 28), accentMat);
    ringA.position.set(0, 0.02, 0.22);
    group.add(ringA);

  } else if (weapon.type === 'speed_lightning' || weapon.type === 'lightning_arc') {
    const gaunt = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.28, 14), bodyMat);
    gaunt.rotation.x = Math.PI / 2;
    gaunt.position.set(0, -0.02, -0.18);
    group.add(gaunt);

    const arcCore = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), glowMat);
    arcCore.position.set(0, 0.01, 0.14);
    group.add(arcCore);

    const arcRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.016, 8, 24), accentMat);
    arcRing.position.set(0, 0.01, 0.14);
    arcRing.rotation.x = Math.PI / 4;
    group.add(arcRing);

  } else if (weapon.type === 'speed_punch') {
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.08, 0.34, 14), bodyMat);
    forearm.rotation.x = Math.PI / 2;
    forearm.position.set(0, -0.03, -0.18);
    group.add(forearm);

    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.2), trimMat);
    group.add(fist);

    const speedCone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.32, 16, 1, true), glowMat);
    speedCone.rotation.x = Math.PI / 2;
    speedCone.position.set(0, 0, 0.22);
    group.add(speedCone);

  } else if (weapon.type === 'lantern_beam') {
    const ringBand = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 20), glowMat);
    ringBand.position.set(0, 0.01, 0.02);
    group.add(ringBand);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.42, 8), trimMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, 0.24);
    group.add(barrel);

  } else if (weapon.type === 'lantern_hammer') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.56, 10), bodyMat);
    handle.rotation.x = Math.PI / 2.6;
    handle.position.set(0, 0.02, 0.12);
    group.add(handle);

    const hammerMat = new THREE.MeshStandardMaterial({
      color: weapon.colorScheme.glow,
      emissive: weapon.colorScheme.glow,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.85,
      roughness: 0.15,
    });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.38), hammerMat);
    head.position.set(0, 0.16, 0.36);
    group.add(head);

  } else if (weapon.type === 'mjolnir_strike') {
    // Forged Uru Mjolnir Hammer
    const handleMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.8 });
    const uruMat = new THREE.MeshStandardMaterial({
      color: '#64748b',
      metalness: 0.92,
      roughness: 0.22,
    });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.5, 10), handleMat);
    handle.position.set(0, -0.02, 0.12);
    handle.rotation.x = Math.PI / 3;
    group.add(handle);

    const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.34), uruMat);
    hammerHead.position.set(0, 0.14, 0.28);
    hammerHead.rotation.x = -Math.PI / 6;
    group.add(hammerHead);

    const stormRing = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.015, 8, 24), glowMat);
    stormRing.position.set(0, 0.14, 0.28);
    group.add(stormRing);
  } else if (weapon.type === 'silvester_gauntlet') {
    // Sovereign Cosmic Judgment Gauntlet
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.34, 14), bodyMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, -0.02, -0.15);
    group.add(cuff);

    const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glowMat);
    starCore.position.set(0, 0.03, 0.16);
    group.add(starCore);

    const omegaRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 28), accentMat);
    omegaRing.position.set(0, 0.03, 0.18);
    group.add(omegaRing);
  } else if (weapon.type === 'silvester_blade') {
    // Omega Astral Greatsword
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.28, 10), accentMat);
    hilt.rotation.x = Math.PI / 2;
    hilt.position.set(0, -0.04, -0.06);
    group.add(hilt);

    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.045, 0.055), accentMat);
    crossguard.position.set(0, -0.02, 0.08);
    group.add(crossguard);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.028, 0.72), glowMat);
    blade.position.set(0, 0.01, 0.44);
    group.add(blade);
  } else if (weapon.type === 'silvester_cannon') {
    // Hyperion Dual-Core Singularity Rail Cannon
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.56), bodyMat);
    group.add(chassis);

    [-0.055, 0.055].forEach(xPos => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.045, 0.72), accentMat);
      rail.position.set(xPos, 0.03, 0.34);
      group.add(rail);
    });

    const coreBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.52, 12), glowMat);
    coreBeam.rotation.x = Math.PI / 2;
    coreBeam.position.set(0, 0.03, 0.36);
    group.add(coreBeam);
  } else if (weapon.type === 'sonic_bass' || weapon.type === 'sonic_boom') {
    // Dre Studio Subwoofer Bass Cannon
    const speakerBox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.42), bodyMat);
    group.add(speakerBox);
    const wooferCone = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.06, 0.14, 16), glowMat);
    wooferCone.rotation.x = Math.PI / 2;
    wooferCone.position.set(0, 0, 0.24);
    group.add(wooferCone);
    const eqRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.016, 8, 24), accentMat);
    eqRing.position.set(0, 0, 0.28);
    group.add(eqRing);
  } else if (weapon.type === 'truth_ray' || weapon.type === 'truth_prism') {
    // The Truth Golden Veritas Pyramid Prism
    const prism = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.26, 4), accentMat);
    prism.rotation.x = Math.PI / 2;
    prism.position.set(0, 0.02, 0.14);
    group.add(prism);
    const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), glowMat);
    eyeCore.position.set(0, 0.02, 0.2);
    group.add(eyeCore);
  } else if (weapon.type === 'star_lance' || weapon.type === 'petal_storm') {
    // Heiliea Starlight Valkyrie Lance
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.72, 10), accentMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, 0, 0.14);
    group.add(shaft);
    const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.28, 6), glowMat);
    spearHead.rotation.x = Math.PI / 2;
    spearHead.position.set(0, 0, 0.62);
    group.add(spearHead);
  } else if (weapon.type === 'bottle_blaster') {
    // The Baby Turbo Plasma Bottle Blaster
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.28, 16), bodyMat);
    bottle.rotation.x = Math.PI / 2;
    bottle.position.set(0, 0, 0.06);
    group.add(bottle);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.05, 16), accentMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0, 0.21);
    group.add(collar);
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 12), glowMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0, 0.28);
    group.add(nozzle);
  } else if (weapon.type === 'tantrum_smash') {
    // The Baby Giant Cosmic Rattle
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.34, 10), accentMat);
    stick.rotation.x = Math.PI / 2;
    stick.position.set(0, 0, 0.06);
    group.add(stick);
    const rattleOrb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), glowMat);
    rattleOrb.position.set(0, 0, 0.28);
    group.add(rattleOrb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 20), accentMat);
    ring.position.set(0, 0, 0.28);
    group.add(ring);
  } else if (weapon.type === 'nichirin_thunder' || weapon.type === 'thunder_flash') {
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.26, 10), bodyMat);
    hilt.rotation.x = Math.PI / 2;
    hilt.position.set(0, 0, -0.06);
    group.add(hilt);
    const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.022, 8), accentMat);
    tsuba.rotation.x = Math.PI / 2;
    tsuba.position.set(0, 0, 0.07);
    group.add(tsuba);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.05, 0.85), trimMat);
    blade.position.set(0, 0.01, 0.5);
    group.add(blade);
    const edgeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.018, 0.82), glowMat);
    edgeGlow.position.set(0, 0.036, 0.5);
    group.add(edgeGlow);
  } else if (weapon.type === 'water_slash' || weapon.type === 'sun_flame') {
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.26, 10), bodyMat);
    hilt.rotation.x = Math.PI / 2;
    hilt.position.set(0, 0, -0.06);
    group.add(hilt);
    const tsuba = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 8, 16), accentMat);
    tsuba.position.set(0, 0, 0.07);
    group.add(tsuba);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.052, 0.86), bodyMat);
    blade.position.set(0, 0.01, 0.51);
    group.add(blade);
    const auraArc = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 20, Math.PI * 1.4), glowMat);
    auraArc.position.set(0, 0.02, 0.55);
    auraArc.rotation.y = Math.PI / 2;
    group.add(auraArc);
  } else if (weapon.type === 'demon_whip' || weapon.type === 'blood_thorn') {
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.22, 12), bodyMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, 0, -0.04);
    group.add(cuff);
    for (let seg = 0; seg < 4; seg++) {
      const whipSeg = new THREE.Mesh(new THREE.BoxGeometry(0.045 - seg * 0.006, 0.035, 0.22), seg % 2 === 0 ? trimMat : glowMat);
      whipSeg.position.set(Math.sin(seg * 0.8) * 0.04, 0.02, 0.14 + seg * 0.19);
      whipSeg.rotation.y = seg % 2 === 0 ? 0.18 : -0.18;
      group.add(whipSeg);
    }
  } else if (weapon.type === 'repulsor_beam' || weapon.type === 'unibeam') {
    const gaunt = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.34, 12), bodyMat);
    gaunt.rotation.x = Math.PI / 2;
    gaunt.position.set(0, 0, -0.05);
    group.add(gaunt);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), glowMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0, 0.16);
    group.add(core);
    if (weapon.type === 'unibeam') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 24), accentMat);
      ring.position.set(0, 0, 0.18);
      group.add(ring);
    }
  } else if (weapon.type === 'web_shooter' || weapon.type === 'web_gauntlet') {
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.22, 12), trimMat);
    wrist.rotation.x = Math.PI / 2;
    group.add(wrist);
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 10), glowMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0.02, 0.18);
    group.add(nozzle);
  } else if (weapon.type === 'eldritch_bolt' || weapon.type === 'eldritch_whip' || weapon.type === 'chaos_hex' || weapon.type === 'chaos_rift') {
    const mandalaOuter = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 8, 28), glowMat);
    mandalaOuter.position.set(0, 0.02, 0.16);
    group.add(mandalaOuter);
    const mandalaInner = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 8, 6), accentMat);
    mandalaInner.position.set(0, 0.02, 0.18);
    group.add(mandalaInner);
  } else if (weapon.type === 'batarang' || weapon.type === 'bat_gauntlet') {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.14), bodyMat);
    wing.position.set(0, 0.02, 0.15);
    group.add(wing);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.015, 0.03), glowMat);
    edge.position.set(0, 0.02, 0.22);
    group.add(edge);
  } else if (weapon.type === 'amazon_sword' || weapon.type === 'tempest_katana' || weapon.type === 'kamish_wrath' || weapon.type === 'venuzdonoa_blade' || weapon.type === 'totsuka_blade' || weapon.type === 'chidori_blade') {
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.28, 10), accentMat);
    hilt.rotation.x = Math.PI / 2;
    hilt.position.set(0, 0, -0.08);
    group.add(hilt);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), accentMat);
    guard.position.set(0, 0, 0.06);
    group.add(guard);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.085, 0.86), glowMat);
    blade.position.set(0, 0.01, 0.5);
    group.add(blade);
  } else if (weapon.type === 'lasso_truth') {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.024, 10, 24), glowMat);
    coil.position.set(0, 0.02, 0.16);
    group.add(coil);
  } else if (weapon.type === 'trident_bolt' || weapon.type === 'hydro_lance') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 10), accentMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, 0, 0.24);
    group.add(shaft);
    [-0.08, 0, 0.08].forEach((xP, idx) => {
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.028, idx === 1 ? 0.28 : 0.2, 6), glowMat);
      prong.rotation.x = Math.PI / 2;
      prong.position.set(xP, 0, idx === 1 ? 0.78 : 0.72);
      group.add(prong);
    });
  } else if (weapon.type === 'monarch_daggers' || weapon.type === 'uchiha_kunai' || weapon.type === 'shinobi_kunai') {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.2, 8), trimMat);
    grip.rotation.x = Math.PI / 2;
    grip.position.set(0, 0, -0.04);
    group.add(grip);
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.42, 4), glowMat);
    blade.rotation.x = Math.PI / 2;
    blade.position.set(0, 0, 0.24);
    group.add(blade);
  } else if (weapon.type === 'rasengan_orb' || weapon.type === 'limitless_blue' || weapon.type === 'hollow_purple' || weapon.type === 'megiddo_ray' || weapon.type === 'jio_graze') {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), glowMat);
    core.position.set(0, 0.02, 0.18);
    group.add(core);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 8, 24), accentMat);
    orbit.position.set(0, 0.02, 0.18);
    orbit.rotation.x = Math.PI / 3;
    group.add(orbit);
  } else if (weapon.type === 'gum_pistol' || weapon.type === 'haki_fist' || weapon.type === 'divergent_fist' || weapon.type === 'blood_pierce' || weapon.type === 'water_stream_fist' || weapon.type === 'cosmic_fist') {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.34, 12), trimMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, 0, -0.1);
    group.add(arm);
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.16, 0.22), bodyMat);
    fist.position.set(0, 0, 0.08);
    group.add(fist);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 8, 24), glowMat);
    ring.position.set(0, 0, 0.18);
    group.add(ring);
  } else if (weapon.type === 'indra_arrow') {
    const bowArc = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.024, 8, 18, Math.PI), accentMat);
    bowArc.rotation.y = Math.PI / 2;
    bowArc.position.set(0, 0.04, 0.1);
    group.add(bowArc);
    const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.82, 8), glowMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(0, 0.04, 0.36);
    group.add(arrow);
  }

  // Scale down slightly to first-person/third-person handheld ratio
  group.scale.set(1.2, 1.2, 1.2);
  return group;
}

/**
 * Creates Saitama's face texture (clean derpy/blank expression or intense serious mode manga shading)
 */
export function createSaitamaFaceTexture(isSerious: boolean): THREE.CanvasTexture {
  const key = `saitama_face_${isSerious}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Anatomical skin base with warm crown, temple warmth, and darker occipital skull/nape shading
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
  baseGrad.addColorStop(0, '#e3b595');
  baseGrad.addColorStop(0.45, '#e8be9e');
  baseGrad.addColorStop(0.76, '#cfa080');
  baseGrad.addColorStop(1, '#a8785c');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Back of head / occipital bone & lower skull shadow (UV edges x<130 & x>382 wrap to rear head)
  const leftOccipGrad = ctx.createLinearGradient(0, 120, 145, 120);
  leftOccipGrad.addColorStop(0, 'rgba(110, 68, 52, 0.56)');
  leftOccipGrad.addColorStop(0.6, 'rgba(130, 84, 66, 0.25)');
  leftOccipGrad.addColorStop(1, 'rgba(130, 84, 66, 0)');
  ctx.fillStyle = leftOccipGrad;
  ctx.fillRect(0, 0, 145, 512);

  const rightOccipGrad = ctx.createLinearGradient(512, 120, 367, 120);
  rightOccipGrad.addColorStop(0, 'rgba(110, 68, 52, 0.56)');
  rightOccipGrad.addColorStop(0.6, 'rgba(130, 84, 66, 0.25)');
  rightOccipGrad.addColorStop(1, 'rgba(130, 84, 66, 0)');
  ctx.fillStyle = rightOccipGrad;
  ctx.fillRect(367, 0, 145, 512);

  // Subtle dermal micro-variation & subsurface warmth along nape & cheekbones
  for (let i = 0; i < 650; i++) {
    const px = ((i * 193) % 512);
    const py = ((i * 317) % 512);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 224, 200, 0.08)' : 'rgba(120, 65, 48, 0.07)';
    ctx.fillRect(px, py, 2, 2);
  }

  if (!isSerious) {
    // Iconic derpy / casual blank expression
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 5;

    // Left oval eye
    ctx.beginPath();
    ctx.ellipse(195, 230, 22, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right oval eye
    ctx.beginPath();
    ctx.ellipse(317, 230, 22, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Simple dot pupils
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(195, 230, 7, 0, Math.PI * 2);
    ctx.arc(317, 230, 7, 0, Math.PI * 2);
    ctx.fill();

    // Minimal curved eyebrows
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(170, 190); ctx.quadraticCurveTo(195, 180, 220, 190);
    ctx.moveTo(292, 190); ctx.quadraticCurveTo(317, 180, 342, 190);
    ctx.stroke();

    // Minimal nose
    ctx.beginPath();
    ctx.moveTo(256, 265); ctx.lineTo(250, 285); ctx.lineTo(262, 285);
    ctx.stroke();

    // Casual neutral mouth line
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(215, 340); ctx.lineTo(297, 340);
    ctx.stroke();
  } else {
    // SERIOUS MODE: Intense manga speedlines, dark shadows and piercing glare
    const grad = ctx.createLinearGradient(0, 120, 0, 230);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(100, 120, 312, 140);

    // Speedline hatching across brow
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    for (let x = 140; x <= 370; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 130);
      ctx.lineTo(x - 12, 225);
      ctx.stroke();
    }

    // Heavy angled eyebrows
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(150, 205); ctx.lineTo(235, 222);
    ctx.moveTo(362, 205); ctx.lineTo(277, 222);
    ctx.stroke();

    // Sharp warrior eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(160, 225); ctx.lineTo(230, 233); ctx.lineTo(220, 246); ctx.lineTo(165, 240); ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(352, 225); ctx.lineTo(282, 233); ctx.lineTo(292, 246); ctx.lineTo(347, 240); ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Intense glowing pupils
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(195, 236, 6, 0, Math.PI * 2);
    ctx.arc(317, 236, 6, 0, Math.PI * 2);
    ctx.fill();

    // Clenched serious mouth
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(215, 350); ctx.lineTo(256, 344); ctx.lineTo(297, 350);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Procedural 3D Model of SAITAMA (The One Punch Hero)
 * Realistic sculpted anatomical build, wrinkled cloth jumpsuit, burgundy leather gauntlets & belt,
 * sculpted cranium + ears + anatomical neck, and shoulder-draped asymmetric pleated white cape.
 */
export function createSaitamaMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Saitama_OnePunchHero';

  const isSerious = skin.camoPattern === 'saitama_serious';
  const isOppai = skin.camoPattern === 'saitama_oppai';
  const isTracksuit = skin.camoPattern === 'saitama_tracksuit';

  // Primary suit material (rich matte ochre jumpsuit with baked fabric wrinkle relief)
  const suitColor = isOppai ? '#dc2626' : isTracksuit ? '#0284c7' : isSerious ? '#b58516' : '#b88c22';
  const suitMat = makeFabricMaterial({
    color: suitColor,
    roughness: 0.84,
    metalness: isSerious ? 0.08 : 0.02,
  });

  // Pants match jumpsuit (or dark denim blue in Oppai hoodie form)
  const pantsMat = isOppai
    ? makeFabricMaterial({ color: '#1e3a8a', roughness: 0.88, metalness: 0.02 })
    : suitMat;

  // Heavy pleated off-white linen cape
  const capeMat = makeCapeMaterial({
    color: skin.capeColor || '#eae8e1',
    roughness: 0.86,
    metalness: 0.02,
  });

  // Wrinkled deep oxblood crimson leather gloves & dark tactical boots
  const gloveColor = skin.gloveColor && skin.gloveColor !== '#dc2626' ? skin.gloveColor : '#541616';
  const gloveMat = makeLeatherMaterial({
    color: gloveColor,
    roughness: 0.44,
    metalness: 0.1,
  });
  const bootMat = makeLeatherMaterial({
    color: isOppai ? '#1e293b' : '#211010',
    roughness: 0.46,
    metalness: 0.12,
  });

  // Dark espresso leather belt + aged brass clasp
  const beltLeatherMat = makeLeatherMaterial({
    color: '#291610',
    roughness: 0.48,
    metalness: 0.14,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#b88a28',
    metalness: 0.86,
    roughness: 0.28,
  });

  // Sculpted skin & cranium head with micro-pore normal texture
  const faceTex = createSaitamaFaceTexture(isSerious);
  const skinMat = makeSkinMaterial({
    color: '#d9a17f',
    roughness: 0.48,
  });
  const headMat = makeSkinMaterial({
    color: '#e8bfa2',
    map: faceTex,
    roughness: 0.46,
  });

  // Build full sculpted, articulated realistic human body
  const body = buildRealisticHumanoidBody(group, {
    suitMat,
    pantsMat,
    gloveMat,
    bootMat,
    skinMat,
    headMat,
    beltMat: isOppai ? undefined : beltLeatherMat,
    buckleMat: isOppai ? undefined : goldMat,
    shoulderScale: 1.07,
    armPose: 'heroic_idle',
    addEarsAndNose: true,
    rotateHeadFaceForward: true,
  });

  // Subtle jumpsuit zipper & collar trim
  if (!isOppai) {
    const zipper = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.34, 0.015),
      new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.8, roughness: 0.3 })
    );
    zipper.position.set(0, 1.28, 0.142);
    group.add(zipper);

    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 8, 20), suitMat);
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.set(0, 1.475, 0.005);
    group.add(collarRing);
  }

  // Signature Asymmetric Shoulder-Draped Pleated Cape swept across right shoulder
  if (!isOppai) {
    attachRealisticCape(group, capeMat, {
      asymmetric: true,
      width: 0.78,
      length: 1.14,
      addCollarMantle: true,
    });

    // Subtle brass fastener pins under collar folds
    [-0.14, 0.14].forEach(xPos => {
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.024, 16), goldMat);
      stud.rotation.x = Math.PI / 2 - 0.3;
      stud.position.set(xPos, 1.465, 0.08);
      group.add(stud);
    });
  }

  // Only show held firearm if equipping an actual ranged/blade weapon (keep clean clenched gauntlets for punch)
  if (weapon.type !== 'fist' && weapon.type !== 'kryptonian_strike') {
    const weaponMesh = createWeaponMesh(weapon);
    weaponMesh.position.set(-0.22, -0.22, 0.16);
    weaponMesh.rotation.set(0.75, 0.05, 0);
    body.rightArmGroup.add(weaponMesh);
  }

  // Golden Aura ring for Serious Mode
  if (isSerious) {
    const auraMat = new THREE.MeshBasicMaterial({
      color: '#facc15',
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const aura = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.78, 1.82, 16, 1, true), auraMat);
    aura.position.y = 0.98;
    group.add(aura);
  }

  addHeroGroundShadow(group, 1.15);
  return group;
}

/**
 * Creates Goku's face texture (determined by transformation form: eye color, eyebrows, Saiyan warrior intensity)
 */
export function createGokuFaceTexture(eyeColorHex: string, isSSJ3: boolean): THREE.CanvasTexture {
  const key = `goku_face_${eyeColorHex}_${isSSJ3}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm anime Saiyan skin tone
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(0, 0, 512, 512);

  // Intense martial artist eyes
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;

  // Eyebrows (absent or heavy brow ridge in SSJ3)
  if (!isSSJ3) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = eyeColorHex === '#10b981' ? '#facc15' :
                      eyeColorHex === '#ef4444' ? '#ef4444' :
                      eyeColorHex === '#06b6d4' ? '#06b6d4' :
                      eyeColorHex === '#cbd5e1' ? '#f8fafc' : '#18181b';
    ctx.beginPath();
    ctx.moveTo(140, 205); ctx.lineTo(235, 222);
    ctx.moveTo(372, 205); ctx.lineTo(277, 222);
    ctx.stroke();
  } else {
    // SSJ3 Protruding heavy brow ridge shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(150, 195, 212, 25);
  }

  // Sharp Saiyan outline eyes
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 5;
  ctx.fillStyle = '#ffffff';

  // Left Eye
  ctx.beginPath();
  ctx.moveTo(165, 225); ctx.lineTo(232, 230); ctx.lineTo(220, 246); ctx.lineTo(170, 242); ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Eye
  ctx.beginPath();
  ctx.moveTo(347, 225); ctx.lineTo(280, 230); ctx.lineTo(292, 246); ctx.lineTo(342, 242); ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pupils (Emerald for SSJ, Cyan for SSB, Red for SSG, Silver for UI, Black for Base)
  ctx.fillStyle = eyeColorHex;
  ctx.beginPath();
  ctx.arc(200, 236, 7, 0, Math.PI * 2);
  ctx.arc(312, 236, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(200, 236, 3, 0, Math.PI * 2);
  ctx.arc(312, 236, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nose (Sharp angular anime nose)
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 260); ctx.lineTo(248, 285); ctx.lineTo(262, 285);
  ctx.stroke();

  // Confident martial arts smirk / battle ready smile
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(215, 345); ctx.quadraticCurveTo(256, 355, 297, 345);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Procedural 3D Model of SON GOKU (Dragon Ball Universe)
 * Features spiky Saiyan hair geometry, orange & blue martial arts gi, blue waist sash & wristbands,
 * and form-specific transformations (SSJ1, SSJ2, SSJ3 waist-length mane, SSG, SSB, and Ultra Instinct).
 */
export function createGokuMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = `Goku_${skin.id}`;

  const isSSJ3 = skin.camoPattern === 'goku_ssj3';
  const isSSG = skin.camoPattern === 'goku_ssg';
  const isTransformed = skin.camoPattern !== 'goku_base';

  const hairColor = skin.hairColor || '#18181b';
  const eyeColor = skin.eyeColor || '#18181b';

  // Hair material (smooth, slightly emissive if glowing super saiyan or ultra instinct)
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    emissive: isTransformed ? hairColor : '#000000',
    emissiveIntensity: skin.camoPattern === 'goku_mui' ? 0.6 : isTransformed ? 0.35 : 0,
    roughness: 0.35,
    metalness: skin.camoPattern === 'goku_mui' ? 0.5 : 0.1,
  });

  // Orange Gi Material
  const giMat = new THREE.MeshStandardMaterial({
    color: '#ea580c',
    roughness: 0.7,
    metalness: 0.05,
  });

  // Blue Undershirt, Sash, Wristbands Material
  const blueMat = new THREE.MeshStandardMaterial({
    color: '#1d4ed8',
    roughness: 0.65,
    metalness: 0.1,
  });

  // Skin tone material with face texture
  const faceTex = createGokuFaceTexture(eyeColor, isSSJ3);
  const headMat = new THREE.MeshStandardMaterial({
    color: '#fed7aa',
    map: faceTex,
    roughness: 0.4,
    metalness: 0.05,
  });

  const bodySkinMat = new THREE.MeshStandardMaterial({
    color: '#fed7aa',
    roughness: 0.4,
    metalness: 0.05,
  });

  // 1. Pelvis & Orange Gi Pants
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.26), giMat);
  pelvis.position.set(0, 0.92, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  // Blue Waist Sash / Belt
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16), blueMat);
  sash.position.set(0, 1.0, 0);
  sash.scale.set(1.0, 1.0, 0.78);
  group.add(sash);

  // Sash hanging knot ribbon
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.04), blueMat);
  knot.position.set(-0.12, 0.85, 0.16);
  knot.rotation.z = 0.15;
  group.add(knot);

  // 2. Torso: Orange Gi Vest with Blue Undershirt visible at V-Neck
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.28), giMat);
  torso.position.set(0, 1.25, 0);
  torso.castShadow = true;
  group.add(torso);

  // Inner Blue Undershirt showing at chest & shoulders
  const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.25, 0.3), blueMat);
  innerShirt.position.set(0, 1.34, 0.01);
  group.add(innerShirt);

  // Turtle School / Whis Chest Emblem (Circular white badge with crest)
  const emblem = new THREE.Mesh(
    new THREE.CircleGeometry(0.055, 16),
    new THREE.MeshBasicMaterial({ color: '#ffffff' })
  );
  emblem.position.set(-0.1, 1.32, 0.145);
  group.add(emblem);

  // 3. Head & Face
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 18), headMat);
  head.position.set(0, 1.62, 0);
  head.rotation.y = -Math.PI / 2; // Face front
  head.castShadow = true;
  group.add(head);

  // 4. Iconic Spiky Saiyan Hair Geometry (Extruded Cones in Goku's Silhouette)
  const hairGroup = new THREE.Group();
  hairGroup.name = 'GokuHair';
  hairGroup.position.set(0, 1.64, 0);

  // Hair Base Cap
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hairCap.position.set(0, 0.02, -0.02);
  hairGroup.add(hairCap);

  // Large Signature Spikes
  // Top right swept spike
  const spike1 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 5), hairMat);
  spike1.rotation.set(-0.2, 0, -0.75);
  spike1.position.set(0.15, 0.16, -0.04);
  hairGroup.add(spike1);

  // Far right horizontal spike
  const spike2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 5), hairMat);
  spike2.rotation.set(-0.1, 0, -1.25);
  spike2.position.set(0.2, 0.06, -0.06);
  hairGroup.add(spike2);

  // Top left swept spike
  const spike3 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 5), hairMat);
  spike3.rotation.set(-0.2, 0, 0.65);
  spike3.position.set(-0.14, 0.17, -0.04);
  hairGroup.add(spike3);

  // Far left spike
  const spike4 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 5), hairMat);
  spike4.rotation.set(-0.1, 0, 1.15);
  spike4.position.set(-0.18, 0.07, -0.06);
  hairGroup.add(spike4);

  // Top center tall crown spike
  const spike5 = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.42, 5), hairMat);
  spike5.rotation.set(-0.35, 0, -0.15);
  spike5.position.set(0.02, 0.22, -0.05);
  hairGroup.add(spike5);

  // Front forehead bangs
  const bang1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 4), hairMat);
  bang1.rotation.set(0.5, 0, -0.2);
  bang1.position.set(-0.08, 0.08, 0.15);
  hairGroup.add(bang1);

  const bang2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 4), hairMat);
  bang2.rotation.set(0.6, 0, 0.25);
  bang2.position.set(0.06, 0.08, 0.15);
  hairGroup.add(bang2);

  // Form 4: Super Saiyan 3 Waist-Length Cascading Hair Extension
  if (isSSJ3) {
    const ssj3Mane = new THREE.Group();
    // Cascading spikes hanging down behind the back
    for (let i = 0; i < 7; i++) {
      const longSpike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.75, 5), hairMat);
      longSpike.rotation.x = Math.PI - 0.25;
      longSpike.rotation.z = (i - 3) * 0.15;
      longSpike.position.set((i - 3) * 0.07, -0.32, -0.16);
      ssj3Mane.add(longSpike);
    }
    hairGroup.add(ssj3Mane);
  }

  group.add(hairGroup);

  // 5. Left & Right Legs (Orange Gi Pants & Dark Blue Martial Arts Boots)
  [-0.11, 0.11].forEach(xPos => {
    // Thigh with billowy gi folds
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.44, 12), giMat);
    thigh.position.set(xPos, 0.68, 0);
    thigh.castShadow = true;
    group.add(thigh);

    // Shin
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.38, 12), giMat);
    shin.position.set(xPos, 0.32, 0);
    shin.castShadow = true;
    group.add(shin);

    // Martial Arts Boot (Dark navy with red laces)
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.24), blueMat);
    boot.position.set(xPos, 0.07, 0.03);
    boot.castShadow = true;
    group.add(boot);

    const redLace = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.12, 0.02),
      new THREE.MeshBasicMaterial({ color: '#ef4444' })
    );
    redLace.position.set(xPos, 0.08, 0.15);
    group.add(redLace);
  });

  // 6. Arms, Bare Forearms & Blue Wristbands
  // Left Arm (Martial arts guard stance)
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.4, 10), bodySkinMat);
  leftArm.rotation.set(0.7, 0.3, -0.3);
  leftArm.position.set(-0.25, 1.22, 0.12);
  group.add(leftArm);

  const leftWrist = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), blueMat);
  leftWrist.position.set(-0.27, 1.15, 0.22);
  group.add(leftWrist);

  // Right Arm (Poised in combat stance or holding firearm)
  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.4, 10), bodySkinMat);
  rightArm.rotation.set(0.6, -0.2, 0.2);
  rightArm.position.set(0.25, 1.22, 0.12);
  group.add(rightArm);

  const rightWrist = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), blueMat);
  rightWrist.position.set(0.27, 1.15, 0.22);
  group.add(rightWrist);

  // Weapon held in hand
  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.18, 1.14, 0.36);
  weaponMesh.rotation.set(0, -0.05, 0);
  group.add(weaponMesh);

  // 7. Dynamic Ki Transformation Aura (For Forms 2 through 8)
  if (isTransformed) {
    const auraColorHex = skin.auraColor || '#facc15';
    const auraMat = new THREE.MeshBasicMaterial({
      color: auraColorHex,
      transparent: true,
      opacity: skin.camoPattern === 'goku_mui' ? 0.45 : 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const auraCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 2.1, 16, 1, true), auraMat);
    auraCylinder.position.y = 1.05;
    group.add(auraCylinder);

    // Bio-electricity rings for SSJ2 and SSJ3
    if (skin.camoPattern === 'goku_ssj2' || isSSJ3) {
      const sparkMat = new THREE.MeshBasicMaterial({
        color: '#67e8f9',
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65 + i * 0.1, 0.02, 6, 12), sparkMat);
        ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        ring.position.y = 0.8 + i * 0.4;
        group.add(ring);
      }
    }
  }

  // Soft contact ground shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  group.add(shadowPlane);

  return group;
}

/**
 * Creates Kryptonian Armourweave CanvasTexture (microscopic geometric chainmail weave)
 */
export function createKryptonianArmorweaveTexture(primaryHex: string): THREE.CanvasTexture {
  const key = `kryptonian_weave_${primaryHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle geometric hexagonal armourweave lattice
  const stepX = 24;
  const stepY = 20;
  for (let row = 0; row < 28; row++) {
    for (let col = 0; col < 24; col++) {
      const cx = col * stepX + (row % 2 === 1 ? stepX * 0.5 : 0);
      const cy = row * stepY;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i + Math.PI / 6;
        const px = cx + Math.cos(ang) * 9;
        const py = cy + Math.sin(ang) * 9;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(9, 17, 45, 0.16)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle Kryptonian seam piping
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(148, 256);
  ctx.lineTo(128, 512);
  ctx.moveTo(384, 0);
  ctx.lineTo(364, 256);
  ctx.lineTo(384, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates Superman's Iconic Raised Diamond Pentagon "S" Shield Crest Texture
 */
export function createSupermanCrestTexture(isKingdom: boolean, isSolarBlack: boolean): THREE.CanvasTexture {
  const key = `superman_crest_${isKingdom}_${isSolarBlack}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  const bgFill = isKingdom ? '#09090b' : isSolarBlack ? '#1f2937' : '#facc15';
  const sColor = isSolarBlack ? '#e2e8f0' : '#dc2626';
  const borderColor = isSolarBlack ? '#94a3b8' : '#b91c1c';

  // Pentagon diamond shield
  ctx.beginPath();
  ctx.moveTo(110, 86);
  ctx.lineTo(402, 86);
  ctx.lineTo(466, 200);
  ctx.lineTo(256, 446);
  ctx.lineTo(46, 200);
  ctx.closePath();
  ctx.fillStyle = bgFill;
  ctx.fill();
  ctx.lineWidth = 28;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  // Classic bold stylized "S" emblem inside diamond
  ctx.fillStyle = sColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(372, 130);
  ctx.lineTo(156, 130);
  ctx.lineTo(106, 198);
  ctx.lineTo(190, 260);
  ctx.lineTo(318, 264);
  ctx.lineTo(334, 304);
  ctx.lineTo(222, 338);
  ctx.lineTo(176, 302);
  ctx.lineTo(148, 336);
  ctx.lineTo(256, 404);
  ctx.lineTo(376, 314);
  ctx.lineTo(340, 224);
  ctx.lineTo(208, 212);
  ctx.lineTo(186, 182);
  ctx.lineTo(340, 182);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates Superman's Chiseled Face Texture (with strong brow & heroic gaze)
 */
export function createSupermanFaceTexture(): THREE.CanvasTexture {
  const key = 'superman_face_classic';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5cba7';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle cheekbone & jawline definition
  ctx.fillStyle = 'rgba(120, 62, 34, 0.14)';
  ctx.fillRect(140, 290, 232, 120);

  // Strong dark eyebrows
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(150, 196); ctx.lineTo(232, 210);
  ctx.moveTo(362, 196); ctx.lineTo(280, 210);
  ctx.stroke();

  // Sharp confident steel-blue eyes
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(196, 230, 24, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(316, 230, 24, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(196, 230, 8, 0, Math.PI * 2);
  ctx.arc(316, 230, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(196, 230, 3.5, 0, Math.PI * 2);
  ctx.arc(316, 230, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Nose & Chiseled Chin
  ctx.strokeStyle = '#7c4a2d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 250); ctx.lineTo(248, 286); ctx.lineTo(264, 286);
  ctx.stroke();

  // Determined hero mouth
  ctx.strokeStyle = '#4a2511';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(214, 340); ctx.quadraticCurveTo(256, 348, 298, 340);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Procedural 3D Model of SUPERMAN (Kryptonian Armourweave, Weighted Crimson Cape, Raised "S" Shield, Gold Belt & Red Boots)
 */
export function createSupermanMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Superman_ManOfSteel';

  const isKingdom = skin.camoPattern === 'superman_kingdom';
  const isSolarBlack = skin.camoPattern === 'superman_solar_black';

  // 1. Suit Material (Kryptonian Armourweave catching specular highlights)
  const weaveTex = createKryptonianArmorweaveTexture(skin.primaryColor || '#13347a');
  const suitMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: weaveTex,
    roughness: 0.3,
    metalness: 0.42,
  });

  // 2. Crimson Cape Material (Weighted cloth physics attached at shoulder clasps)
  const capeMat = new THREE.MeshStandardMaterial({
    color: skin.capeColor || '#b91c1c',
    roughness: 0.48,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  // 3. Deep Red Boots & Crimson Trim Material
  const bootMat = new THREE.MeshStandardMaterial({
    color: isSolarBlack ? '#27272a' : '#991b1b',
    roughness: 0.34,
    metalness: 0.32,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.72,
    metalness: 0.25,
  });

  // 4. Golden Utility Belt & Clasps Material
  const goldMat = new THREE.MeshStandardMaterial({
    color: isSolarBlack ? '#cbd5e1' : '#eab308',
    metalness: 0.92,
    roughness: 0.16,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: '#f5cba7',
    roughness: 0.42,
    metalness: 0.04,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    color: '#f5cba7',
    map: createSupermanFaceTexture(),
    roughness: 0.38,
    metalness: 0.05,
  });

  // 5. Pelvis / Lower Suit & Golden Utility Belt
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.2, 0.27), suitMat);
  pelvis.position.set(0, 0.93, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  // Utility Belt Band
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.1, 16), goldMat);
  belt.position.set(0, 1.02, 0);
  belt.scale.set(1.0, 1.0, 0.76);
  group.add(belt);

  // Geometric Belt Buckle
  const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.036, 5), goldMat);
  buckle.rotation.x = Math.PI / 2;
  buckle.position.set(0, 1.02, 0.195);
  group.add(buckle);

  // 6. Sculpted Muscular Torso (Broad Heroic Chest & Shoulders)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.3), suitMat);
  torso.position.set(0, 1.27, 0);
  torso.castShadow = true;
  group.add(torso);

  // Raised Chest Armour Pecs
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.06), suitMat);
  chestPlate.position.set(0, 1.33, 0.145);
  group.add(chestPlate);

  // 7. Raised Iconic "S" Shield Crest Focal Point
  const crestBacking = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.11, 0.032, 5), goldMat);
  crestBacking.rotation.x = Math.PI / 2;
  crestBacking.rotation.z = Math.PI;
  crestBacking.position.set(0, 1.33, 0.172);
  group.add(crestBacking);

  const crestTex = createSupermanCrestTexture(isKingdom, isSolarBlack);
  const crestFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 0.25),
    new THREE.MeshStandardMaterial({
      map: crestTex,
      transparent: true,
      roughness: 0.24,
      metalness: 0.55,
    })
  );
  crestFace.position.set(0, 1.33, 0.19);
  group.add(crestFace);

  // 8. Weighted Crimson-Red Cape with Shoulder Clasps & Cloth Grid
  const capeGeo = new THREE.PlaneGeometry(0.76, 1.24, 8, 12);
  const pos = capeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setZ(i, (y - 0.62) * 0.14 - 0.06);
  }
  capeGeo.computeVertexNormals();

  const cape = new THREE.Mesh(capeGeo, capeMat);
  cape.position.set(0, 0.94, -0.18);
  cape.castShadow = true;
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  // Shoulder Cape Fastener Clasps
  [-0.18, 0.18].forEach(xPos => {
    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.045, 0.12), goldMat);
    clasp.position.set(xPos, 1.49, -0.09);
    group.add(clasp);
  });

  // 9. Head, Dark Swept Hair + Signature Forehead S-Curl & Laser Eye Glow Nodes
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.168, 22, 20), faceMat);
  head.position.set(0, 1.66, 0);
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  group.add(head);

  const hairMat = new THREE.MeshStandardMaterial({
    color: '#111827',
    roughness: 0.45,
    metalness: 0.15,
  });
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.174, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairCap.position.set(0, 1.67, -0.015);
  group.add(hairCap);

  // Signature S-Curl Forehead Lock
  const sCurl = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.014, 8, 12, Math.PI * 1.25), hairMat);
  sCurl.position.set(0.015, 1.74, 0.158);
  sCurl.rotation.z = 0.6;
  group.add(sCurl);

  // Dynamic Eye Glow Overlays (ignite bright orange-yellow -> white-hot during Thermal Overload!)
  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#ef4444',
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
  });
  const leftEyeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), eyeGlowMat);
  leftEyeGlow.position.set(-0.055, 1.66, 0.152);
  group.add(leftEyeGlow);

  const rightEyeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), eyeGlowMat);
  rightEyeGlow.position.set(0.055, 1.66, 0.152);
  group.add(rightEyeGlow);

  group.userData.eyeGlowMat = eyeGlowMat;
  group.userData.leftEyeGlow = leftEyeGlow;
  group.userData.rightEyeGlow = rightEyeGlow;

  // 10. Legs & Deep Red Reinforced Boots
  [-0.12, 0.12].forEach(xPos => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.44, 12), suitMat);
    thigh.position.set(xPos, 0.69, 0);
    thigh.castShadow = true;
    group.add(thigh);

    const shinBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.082, 0.36, 12), bootMat);
    shinBoot.position.set(xPos, 0.31, 0);
    shinBoot.castShadow = true;
    group.add(shinBoot);

    // Boot Top Cuff (Golden/Red V-Trim)
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.09, 0.05, 12), bootMat);
    cuff.position.set(xPos, 0.48, 0.01);
    group.add(cuff);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.26), bootMat);
    foot.position.set(xPos, 0.085, 0.03);
    foot.castShadow = true;
    group.add(foot);

    // Reinforced Scuff-Resistant Sole
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.126, 0.035, 0.275), soleMat);
    sole.position.set(xPos, 0.02, 0.03);
    group.add(sole);
  });

  // 11. Muscular Arms & Kryptonian Wrist Cuffs
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.068, 0.42, 12), suitMat);
  leftArm.rotation.set(0.55, 0.18, -0.25);
  leftArm.position.set(-0.28, 1.26, 0.11);
  group.add(leftArm);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.14), skinMat);
  leftHand.position.set(-0.31, 1.16, 0.25);
  group.add(leftHand);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.068, 0.42, 12), suitMat);
  rightArm.rotation.set(0.5, -0.18, 0.25);
  rightArm.position.set(0.28, 1.26, 0.11);
  group.add(rightArm);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.14), skinMat);
  rightHand.position.set(0.31, 1.16, 0.24);
  group.add(rightHand);

  // Subtle weapon/power core indicator (hidden during unarmed stance or rendered cleanly)
  if (weapon.type !== 'kryptonian_strike') {
    const weaponMesh = createWeaponMesh(weapon);
    weaponMesh.position.set(0.22, 1.16, 0.36);
    weaponMesh.scale.set(0.85, 0.85, 0.85);
    group.add(weaponMesh);
  }

  // Contact shadow disc
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.3),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  group.add(shadowPlane);

  return group;
}

/**
 * Creates Maxwell Shodron's Archmage Face Texture (glowing arcane irises + silver-streaked brows)
 */
export function createMaxwellFaceTexture(eyeColorHex: string): THREE.CanvasTexture {
  const key = `maxwell_face_${eyeColorHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f3d0b5';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle cheekbone shadow
  ctx.fillStyle = 'rgba(76, 29, 149, 0.1)';
  ctx.fillRect(145, 295, 222, 110);

  // Sharp archmage eyebrows
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(148, 200); ctx.lineTo(232, 214);
  ctx.moveTo(364, 200); ctx.lineTo(280, 214);
  ctx.stroke();

  // Almond arcane eyes
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(196, 232, 23, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(316, 232, 23, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Glowing arcane irises
  ctx.fillStyle = eyeColorHex;
  ctx.beginPath();
  ctx.arc(196, 232, 8.5, 0, Math.PI * 2);
  ctx.arc(316, 232, 8.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(196, 232, 3, 0, Math.PI * 2);
  ctx.arc(316, 232, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.strokeStyle = '#8b5a3c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 248); ctx.lineTo(249, 286); ctx.lineTo(263, 286);
  ctx.stroke();

  // Confident archmage smirk
  ctx.strokeStyle = '#4a2511';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(216, 342); ctx.quadraticCurveTo(260, 352, 298, 336);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Procedural 3D Model of MAXWELL SHODRON (Arcane Sovereign & Chronomancer)
 * Features layered sorcerer coat & flowing cloth cape, gold rune belt & pauldrons,
 * glowing chest sigil crystal, swept silver-streaked hair, and rotating floating Rune Halo.
 */
export function createMaxwellMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Maxwell_Shodron';

  const primaryHex = skin.primaryColor || '#5b21b6';
  const capeHex = skin.capeColor || '#31105f';
  const auraHex = skin.auraColor || '#a855f7';
  const eyeHex = skin.eyeColor || '#c084fc';

  const coatMat = new THREE.MeshStandardMaterial({
    color: primaryHex,
    roughness: 0.55,
    metalness: 0.18,
  });

  const trouserMat = new THREE.MeshStandardMaterial({
    color: '#111827',
    roughness: 0.72,
    metalness: 0.08,
  });

  const capeMat = new THREE.MeshStandardMaterial({
    color: capeHex,
    roughness: 0.45,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#eab308',
    metalness: 0.9,
    roughness: 0.18,
  });

  const runeGlowMat = new THREE.MeshStandardMaterial({
    color: auraHex,
    emissive: auraHex,
    emissiveIntensity: 2.3,
    roughness: 0.15,
    metalness: 0.3,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: '#f3d0b5',
    roughness: 0.42,
    metalness: 0.04,
  });

  const faceMat = new THREE.MeshStandardMaterial({
    color: '#f3d0b5',
    map: createMaxwellFaceTexture(eyeHex),
    roughness: 0.38,
    metalness: 0.05,
  });

  // 1. Pelvis, Coat-Tails & Ornate Gold Sorcerer Belt
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.26), trouserMat);
  pelvis.position.set(0, 0.92, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  // Flared arcane coat-tails around waist/thighs
  const coatTail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.34, 0.52, 14, 1, true, Math.PI * 0.22, Math.PI * 1.56),
    coatMat
  );
  coatTail.position.set(0, 0.74, -0.02);
  coatTail.rotation.y = Math.PI;
  coatTail.material.side = THREE.DoubleSide;
  coatTail.castShadow = true;
  group.add(coatTail);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.09, 16), goldMat);
  belt.position.set(0, 1.01, 0);
  belt.scale.set(1.0, 1.0, 0.76);
  group.add(belt);

  const buckleGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), runeGlowMat);
  buckleGem.position.set(0, 1.01, 0.19);
  group.add(buckleGem);

  // 2. Layered Sorcerer Torso, High Collar & Glowing Chest Sigil
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.46, 0.27), coatMat);
  torso.position.set(0, 1.26, 0);
  torso.castShadow = true;
  group.add(torso);

  // High archmage collar
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.15, 0.14, 14, 1, true, Math.PI * 0.25, Math.PI * 1.5),
    coatMat
  );
  collar.position.set(0, 1.52, -0.02);
  collar.rotation.y = Math.PI;
  group.add(collar);

  // Golden breastplate filigree & glowing Aether Core
  const chestTrim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.03), goldMat);
  chestTrim.position.set(0, 1.28, 0.135);
  group.add(chestTrim);

  const chestCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), runeGlowMat);
  chestCrystal.position.set(0, 1.32, 0.16);
  group.add(chestCrystal);

  // Golden Pauldrons
  [-0.25, 0.25].forEach((xPos, idx) => {
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), goldMat);
    pauldron.position.set(xPos, 1.44, 0);
    pauldron.rotation.z = idx === 0 ? 0.35 : -0.35;
    group.add(pauldron);
  });

  // 3. Flowing Astral Cape with Dynamic Cloth Mesh
  const capeGeo = new THREE.PlaneGeometry(0.74, 1.2, 8, 12);
  const pos = capeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setZ(i, (y - 0.6) * 0.14 - 0.05);
  }
  capeGeo.computeVertexNormals();

  const cape = new THREE.Mesh(capeGeo, capeMat);
  cape.position.set(0, 0.94, -0.17);
  cape.castShadow = true;
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  // 4. Head, Swept Dark Hair with Silver Sorcerer Streak
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 22, 20), faceMat);
  head.position.set(0, 1.65, 0);
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  group.add(head);

  const darkHairMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.45,
    metalness: 0.18,
  });
  const silverStreakMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.35,
    metalness: 0.3,
  });

  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.172, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    darkHairMat
  );
  hairCrown.position.set(0, 1.67, -0.015);
  group.add(hairCrown);

  // Swept arcane hair spikes & silver temple lock
  const silverLock = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), silverStreakMat);
  silverLock.position.set(-0.08, 1.74, 0.1);
  silverLock.rotation.set(0.45, 0, 0.42);
  group.add(silverLock);

  const topLock = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 5), darkHairMat);
  topLock.position.set(0.04, 1.78, 0.05);
  topLock.rotation.set(-0.25, 0, -0.35);
  group.add(topLock);

  // 5. Floating Rotating Arcane Halo Behind Shoulders
  const arcaneHalo = new THREE.Group();
  arcaneHalo.position.set(0, 1.48, -0.22);

  const outerSigilRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.014, 8, 32), runeGlowMat);
  arcaneHalo.add(outerSigilRing);

  const innerGoldRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.012, 8, 28), goldMat);
  arcaneHalo.add(innerGoldRing);

  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), runeGlowMat);
    shard.position.set(Math.cos(ang) * 0.42, Math.sin(ang) * 0.42, 0);
    arcaneHalo.add(shard);
  }
  group.add(arcaneHalo);
  group.userData.arcaneHalo = arcaneHalo;

  // 5B. Orbiting Elemental Satellites + Elemental Transformation Aura
  const elementalOrbitGroup = new THREE.Group();
  elementalOrbitGroup.position.set(0, 1.18, 0);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const sat = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), runeGlowMat);
    sat.position.set(Math.cos(angle) * 0.56, Math.sin(i * 1.4) * 0.14, Math.sin(angle) * 0.56);
    elementalOrbitGroup.add(sat);
  }
  group.add(elementalOrbitGroup);
  group.userData.elementalOrbitGroup = elementalOrbitGroup;

  const auraMat = new THREE.MeshBasicMaterial({
    color: auraHex,
    transparent: true,
    opacity: skin.camoPattern !== 'maxwell_archmage' ? 0.24 : 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const elementalAura = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.68, 1.78, 16, 1, true), auraMat);
  elementalAura.position.y = 0.94;
  group.add(elementalAura);
  group.userData.elementalAura = elementalAura;

  // 6. Legs & Gold-Trimmed Boots
  [-0.11, 0.11].forEach(xPos => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.078, 0.44, 12), trouserMat);
    thigh.position.set(xPos, 0.68, 0);
    thigh.castShadow = true;
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.072, 0.36, 12), coatMat);
    shin.position.set(xPos, 0.31, 0);
    shin.castShadow = true;
    group.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.13, 0.25), trouserMat);
    boot.position.set(xPos, 0.075, 0.03);
    boot.castShadow = true;
    group.add(boot);

    const bootGold = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.084, 0.04, 12), goldMat);
    bootGold.position.set(xPos, 0.47, 0);
    group.add(bootGold);
  });

  // 7. Arms, Spellcaster Cuffs & Floating Grimoire Orb in Off-Hand
  const gloveMat = new THREE.MeshStandardMaterial({
    color: skin.gloveColor || '#4c1d95',
    roughness: 0.4,
    metalness: 0.35,
  });

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.058, 0.4, 10), coatMat);
  leftArm.rotation.set(0.65, 0.25, -0.32);
  leftArm.position.set(-0.27, 1.24, 0.12);
  group.add(leftArm);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.1, 0.13), gloveMat);
  leftHand.position.set(-0.31, 1.15, 0.26);
  group.add(leftHand);

  const offhandOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), runeGlowMat);
  offhandOrb.position.set(-0.33, 1.28, 0.3);
  group.add(offhandOrb);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.058, 0.4, 10), coatMat);
  rightArm.rotation.set(0.55, -0.2, 0.28);
  rightArm.position.set(0.27, 1.24, 0.12);
  group.add(rightArm);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.1, 0.13), skinMat);
  rightHand.position.set(0.3, 1.15, 0.25);
  group.add(rightHand);

  // Store material handles on userData for live Elemental Magic Transmission transforms
  group.userData.maxwellMats = {
    coatMat,
    capeMat,
    runeGlowMat,
    gloveMat,
    auraMat,
  };

  // Held Arcane Weapon / Scepter / Spell Focus
  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.24, 1.15, 0.38);
  weaponMesh.scale.set(0.88, 0.88, 0.88);
  group.add(weaponMesh);

  // Soft contact ground shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.3),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  group.add(shadowPlane);

  return group;
}

/**
 * Helper: Creates dual soft contact AO shadow + elongated directional cast shadow plane shared by hero models
 */
function addHeroGroundShadow(group: THREE.Group, size = 1.25) {
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(6, 8, 12, 0.85)');
  grad.addColorStop(0.5, 'rgba(8, 10, 15, 0.48)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);

  // Tight ambient-occlusion contact shadow directly under boots
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 0.72, size * 0.56),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.015;
  group.add(contactShadow);

  // Elongated golden-hour cast shadow silhouette stretching left-forward on the arena floor
  const castShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 1.48, size * 0.68),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  castShadow.rotation.x = -Math.PI / 2;
  castShadow.rotation.z = -0.36;
  castShadow.position.set(-size * 0.52, 0.012, size * 0.26);
  group.add(castShadow);
}

function createKingFaceTexture(): THREE.CanvasTexture {
  const key = 'king_face_scar';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f2caa8';
  ctx.fillRect(0, 0, 512, 512);

  // Heavy intimidating brow & deep eye sockets
  ctx.fillStyle = 'rgba(24, 24, 27, 0.16)';
  ctx.fillRect(140, 195, 232, 60);
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(140, 198); ctx.lineTo(234, 218);
  ctx.moveTo(372, 198); ctx.lineTo(278, 218);
  ctx.stroke();

  // Stern piercing eyes
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 4;
  ctx.fillRect(168, 224, 52, 22);
  ctx.strokeRect(168, 224, 52, 22);
  ctx.fillRect(292, 224, 52, 22);
  ctx.strokeRect(292, 224, 52, 22);
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(194, 235, 7, 0, Math.PI * 2);
  ctx.arc(318, 235, 7, 0, Math.PI * 2);
  ctx.fill();

  // Iconic three-claw scar across left eye (canvas right side)
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 5;
  [-12, 0, 12].forEach(off => {
    ctx.beginPath();
    ctx.moveTo(290 + off, 165);
    ctx.lineTo(324 + off, 305);
    ctx.stroke();
  });

  // Stoic jaw frown & chin stubble
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(212, 344);
  ctx.lineTo(300, 344);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

function createHeroMaskFaceTexture(
  maskColor: string | null,
  eyeColor: string,
  skinHex = '#f3d0b5'
): THREE.CanvasTexture {
  const key = `hero_face_${maskColor || 'none'}_${eyeColor}_${skinHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = skinHex;
  ctx.fillRect(0, 0, 512, 512);

  if (maskColor) {
    ctx.fillStyle = maskColor;
    ctx.beginPath();
    ctx.ellipse(256, 228, 128, 56, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Intense white/glowing hero eyes
  ctx.fillStyle = eyeColor;
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(165, 224); ctx.lineTo(222, 234); ctx.lineTo(205, 246); ctx.lineTo(168, 240); ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(347, 224); ctx.lineTo(290, 234); ctx.lineTo(307, 246); ctx.lineTo(344, 240); ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Confident mouth
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(218, 342); ctx.quadraticCurveTo(256, 352, 294, 342);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

export function createKingMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'King_OPM';

  const coatMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor || '#18181b',
    roughness: 0.65,
    metalness: 0.15,
  });
  const trouserMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.72 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.85, roughness: 0.22 });
  const hairMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.45, metalness: 0.15 });
  const auraHex = skin.auraColor || '#f59e0b';
  const engineGlowMat = new THREE.MeshStandardMaterial({
    color: auraHex,
    emissive: auraHex,
    emissiveIntensity: 2.2,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#f2caa8', roughness: 0.45 });
  const faceMat = new THREE.MeshStandardMaterial({
    color: '#f2caa8',
    map: createKingFaceTexture(),
    roughness: 0.4,
  });

  // Tall broad S-Class build
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.28), trouserMat);
  pelvis.position.set(0, 0.94, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.3), coatMat);
  torso.position.set(0, 1.3, 0);
  torso.castShadow = true;
  group.add(torso);

  // Turtleneck collar & gold buttons
  const neckCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.14, 0.14, 14), coatMat);
  neckCollar.position.set(0, 1.56, 0);
  group.add(neckCollar);

  const chestEngineOrb = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 24), engineGlowMat);
  chestEngineOrb.position.set(0.06, 1.32, 0.16);
  group.add(chestEngineOrb);

  // Orbiting King Engine dread rings
  const kingAuraGroup = new THREE.Group();
  kingAuraGroup.position.set(0, 1.15, 0);
  const auraRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.018, 8, 32),
    new THREE.MeshBasicMaterial({ color: auraHex, transparent: true, opacity: 0.65 })
  );
  auraRing1.rotation.x = Math.PI / 2;
  kingAuraGroup.add(auraRing1);
  group.add(kingAuraGroup);
  group.userData.elementalOrbitGroup = kingAuraGroup;

  // Head + spiky swept blonde hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 22, 20), faceMat);
  head.position.set(0, 1.72, 0);
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  group.add(head);

  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.175, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hairCrown.position.set(0, 1.74, -0.02);
  group.add(hairCrown);
  for (let i = -2; i <= 2; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.22, 5), hairMat);
    spike.position.set(i * 0.05, 1.86, -0.05);
    spike.rotation.set(-0.35, 0, -i * 0.18);
    group.add(spike);
  }

  // Legs & polished shoes
  [-0.12, 0.12].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.075, 0.84, 12), trouserMat);
    leg.position.set(xPos, 0.48, 0);
    leg.castShadow = true;
    group.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.12, 0.25), coatMat);
    shoe.position.set(xPos, 0.06, 0.04);
    group.add(shoe);
  });

  // Arms
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.44, 10), coatMat);
  leftArm.rotation.set(0.35, 0.15, -0.22);
  leftArm.position.set(-0.3, 1.28, 0.08);
  group.add(leftArm);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.1, 0.12), skinMat);
  leftHand.position.set(-0.34, 1.08, 0.18);
  group.add(leftHand);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.44, 10), coatMat);
  rightArm.rotation.set(0.55, -0.15, 0.2);
  rightArm.position.set(0.3, 1.28, 0.12);
  group.add(rightArm);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.1, 0.12), skinMat);
  rightHand.position.set(0.32, 1.12, 0.24);
  group.add(rightHand);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.14, 0.36);
  weaponMesh.scale.set(0.85, 0.85, 0.85);
  group.add(weaponMesh);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.07, 16), goldMat);
  belt.position.set(0, 1.03, 0);
  belt.scale.set(1, 1, 0.72);
  group.add(belt);

  addHeroGroundShadow(group, 1.3);
  return group;
}

export function createFlashMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'The_Flash';

  const suitHex = skin.primaryColor || '#dc2626';
  const accentHex = skin.visorColor || '#facc15';
  const auraHex = skin.auraColor || '#fbbf24';

  const suitMat = new THREE.MeshStandardMaterial({ color: suitHex, roughness: 0.36, metalness: 0.28 });
  const trimMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.2,
    metalness: 0.8,
    roughness: 0.2,
  });
  const whiteCrestMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 });
  const faceMat = new THREE.MeshStandardMaterial({
    color: '#f3d0b5',
    map: createHeroMaskFaceTexture(suitHex, '#fef08a'),
    roughness: 0.38,
  });

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.24), suitMat);
  pelvis.position.set(0, 0.92, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.26), suitMat);
  torso.position.set(0, 1.26, 0);
  torso.castShadow = true;
  group.add(torso);

  // Chest circle emblem + golden lightning bolt
  const crestCircle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), whiteCrestMat);
  crestCircle.rotation.x = Math.PI / 2;
  crestCircle.position.set(0, 1.32, 0.135);
  group.add(crestCircle);

  const boltBar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.17, 0.04), trimMat);
  boltBar.rotation.z = -0.35;
  boltBar.position.set(0, 1.32, 0.15);
  group.add(boltBar);

  // Golden Lightning Belt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.075, 16), trimMat);
  belt.position.set(0, 1.02, 0);
  belt.scale.set(1, 1, 0.72);
  group.add(belt);

  // Head + Cowl + Golden Winged Ear Bolts
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 22, 20), faceMat);
  head.position.set(0, 1.64, 0);
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  group.add(head);

  const cowlCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    suitMat
  );
  cowlCap.position.set(0, 1.65, 0);
  group.add(cowlCap);

  [-0.175, 0.175].forEach((xPos, idx) => {
    const earBolt = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 4), trimMat);
    earBolt.position.set(xPos, 1.67, -0.02);
    earBolt.rotation.set(-0.6, 0, idx === 0 ? 0.35 : -0.35);
    group.add(earBolt);
  });

  // Legs & Golden Speed Boots
  [-0.11, 0.11].forEach(xPos => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.46, 12), suitMat);
    thigh.position.set(xPos, 0.68, 0);
    thigh.castShadow = true;
    group.add(thigh);

    const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.068, 0.36, 12), trimMat);
    bootShaft.position.set(xPos, 0.3, 0);
    group.add(bootShaft);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.24), trimMat);
    boot.position.set(xPos, 0.06, 0.04);
    group.add(boot);
  });

  // Dynamic runner arms
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.38, 10), suitMat);
  leftArm.rotation.set(0.85, 0.2, -0.25);
  leftArm.position.set(-0.26, 1.24, 0.12);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.38, 10), suitMat);
  rightArm.rotation.set(0.75, -0.2, 0.25);
  rightArm.position.set(0.26, 1.24, 0.12);
  group.add(rightArm);

  // Crackling Speed Force lightning orbit ring
  const speedOrbit = new THREE.Group();
  speedOrbit.position.set(0, 1.18, 0);
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const spark = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 4), trimMat);
    spark.position.set(Math.cos(ang) * 0.48, (i % 2 === 0 ? 0.12 : -0.12), Math.sin(ang) * 0.48);
    spark.rotation.z = Math.PI / 2;
    speedOrbit.add(spark);
  }
  const ringGlow = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.012, 8, 28),
    new THREE.MeshBasicMaterial({ color: auraHex, transparent: true, opacity: 0.7 })
  );
  ringGlow.rotation.x = Math.PI / 2;
  speedOrbit.add(ringGlow);
  group.add(speedOrbit);
  group.userData.elementalOrbitGroup = speedOrbit;

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.26, 1.15, 0.36);
  weaponMesh.scale.set(0.86, 0.86, 0.86);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.2);
  return group;
}

export function createGreenLanternMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Green_Lantern';

  const greenHex = skin.primaryColor || '#15803d';
  const glowHex = skin.visorColor || '#4ade80';
  const gloveHex = skin.gloveColor || '#f8fafc';

  const greenMat = new THREE.MeshStandardMaterial({ color: greenHex, roughness: 0.38, metalness: 0.35 });
  const blackMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.55, metalness: 0.25 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: gloveHex, roughness: 0.3, metalness: 0.2 });
  const ringGlowMat = new THREE.MeshStandardMaterial({
    color: glowHex,
    emissive: glowHex,
    emissiveIntensity: 2.3,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    color: '#f3d0b5',
    map: createHeroMaskFaceTexture(greenHex, '#ffffff'),
    roughness: 0.38,
  });

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.25), blackMat);
  pelvis.position.set(0, 0.92, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.48, 0.28), greenMat);
  torso.position.set(0, 1.26, 0);
  torso.castShadow = true;
  group.add(torso);

  // Chest Lantern Crest
  const crestPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), gloveMat);
  crestPlate.rotation.x = Math.PI / 2;
  crestPlate.position.set(0, 1.32, 0.145);
  group.add(crestPlate);

  const lanternRingSymbol = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 20), ringGlowMat);
  lanternRingSymbol.position.set(0, 1.32, 0.165);
  group.add(lanternRingSymbol);

  // Head + Dark Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 22, 20), faceMat);
  head.position.set(0, 1.64, 0);
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshStandardMaterial({ color: '#3f2e21', roughness: 0.6 })
  );
  hair.position.set(0, 1.66, -0.015);
  group.add(hair);

  // Legs & Emerald Boots
  [-0.11, 0.11].forEach(xPos => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.078, 0.45, 12), blackMat);
    thigh.position.set(xPos, 0.68, 0);
    thigh.castShadow = true;
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.36, 12), greenMat);
    shin.position.set(xPos, 0.3, 0);
    group.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.12, 0.24), greenMat);
    boot.position.set(xPos, 0.06, 0.04);
    group.add(boot);
  });

  // Arms & White Gloves + Glowing Power Ring on Right Hand
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.4, 10), blackMat);
  leftArm.rotation.set(0.6, 0.2, -0.25);
  leftArm.position.set(-0.27, 1.24, 0.12);
  group.add(leftArm);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.1, 0.12), gloveMat);
  leftHand.position.set(-0.31, 1.13, 0.25);
  group.add(leftHand);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.4, 10), blackMat);
  rightArm.rotation.set(0.7, -0.2, 0.25);
  rightArm.position.set(0.27, 1.24, 0.12);
  group.add(rightArm);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.1, 0.12), gloveMat);
  rightHand.position.set(0.3, 1.14, 0.26);
  group.add(rightHand);

  const powerRing = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 8, 18), ringGlowMat);
  powerRing.position.set(0.3, 1.14, 0.32);
  group.add(powerRing);

  // Orbiting Hard-Light Construct Halo
  const lanternOrbit = new THREE.Group();
  lanternOrbit.position.set(0, 1.22, 0);
  const hardLightRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.015, 8, 6),
    new THREE.MeshBasicMaterial({ color: glowHex, transparent: true, opacity: 0.72 })
  );
  hardLightRing.rotation.x = Math.PI / 2;
  lanternOrbit.add(hardLightRing);
  group.add(lanternOrbit);
  group.userData.elementalOrbitGroup = lanternOrbit;

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.26, 1.14, 0.36);
  weaponMesh.scale.set(0.88, 0.88, 0.88);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.25);
  return group;
}

export function createShazamMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Shazam_Champion';

  const suitHex = skin.primaryColor || '#dc2626';
  const capeHex = skin.capeColor || '#f8fafc';
  const goldHex = skin.gloveColor || '#eab308';
  const auraHex = skin.auraColor || '#fde047';

  const suitMat = new THREE.MeshStandardMaterial({ color: suitHex, roughness: 0.42, metalness: 0.25 });
  const capeMat = new THREE.MeshStandardMaterial({
    color: capeHex,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: goldHex,
    emissive: auraHex,
    emissiveIntensity: 0.65,
    metalness: 0.85,
    roughness: 0.2,
  });
  const lightningMat = new THREE.MeshStandardMaterial({
    color: auraHex,
    emissive: auraHex,
    emissiveIntensity: 2.3,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    color: '#f3d0b5',
    map: createHeroMaskFaceTexture(null, '#fef9c3'),
    roughness: 0.38,
  });

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.26), suitMat);
  pelvis.position.set(0, 0.92, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.29), suitMat);
  torso.position.set(0, 1.27, 0);
  torso.castShadow = true;
  group.add(torso);

  // Iconic Glowing Gold Chest Lightning Bolt
  const upperBolt = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.19, 0.04), lightningMat);
  upperBolt.rotation.z = -0.35;
  upperBolt.position.set(0.02, 1.35, 0.15);
  group.add(upperBolt);

  const lowerBolt = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.19, 0.04), lightningMat);
  lowerBolt.rotation.z = -0.35;
  lowerBolt.position.set(-0.02, 1.22, 0.15);
  group.add(lowerBolt);

  // Golden Sash & Shoulder Clasps
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.085, 16), goldMat);
  sash.position.set(0, 1.02, 0);
  sash.scale.set(1, 1, 0.72);
  group.add(sash);

  [-0.22, 0.22].forEach(xPos => {
    const clasp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), goldMat);
    clasp.position.set(xPos, 1.48, 0.02);
    group.add(clasp);
  });

  // Flowing White-Gold Cloth Cape
  const capeGeo = new THREE.PlaneGeometry(0.76, 1.15, 8, 12);
  const cPos = capeGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    cPos.setZ(i, (cPos.getY(i) - 0.58) * 0.14 - 0.04);
  }
  capeGeo.computeVertexNormals();
  const cape = new THREE.Mesh(capeGeo, capeMat);
  cape.position.set(0, 0.96, -0.17);
  cape.castShadow = true;
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  // Head + Dark Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.162, 22, 20), faceMat);
  head.position.set(0, 1.65, 0);
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.5 })
  );
  hair.position.set(0, 1.67, -0.015);
  group.add(hair);

  // Legs & Golden Boots
  [-0.12, 0.12].forEach(xPos => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.45, 12), suitMat);
    thigh.position.set(xPos, 0.68, 0);
    thigh.castShadow = true;
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.36, 12), goldMat);
    shin.position.set(xPos, 0.3, 0);
    group.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.12, 0.24), goldMat);
    boot.position.set(xPos, 0.06, 0.04);
    group.add(boot);
  });

  // Arms & Golden Gauntlets
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.4, 10), suitMat);
  leftArm.rotation.set(0.6, 0.2, -0.25);
  leftArm.position.set(-0.28, 1.24, 0.12);
  group.add(leftArm);

  const leftCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.065, 0.16, 10), goldMat);
  leftCuff.rotation.set(0.6, 0.2, -0.25);
  leftCuff.position.set(-0.31, 1.15, 0.23);
  group.add(leftCuff);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.4, 10), suitMat);
  rightArm.rotation.set(0.65, -0.2, 0.25);
  rightArm.position.set(0.28, 1.24, 0.12);
  group.add(rightArm);

  const rightCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.065, 0.16, 10), goldMat);
  rightCuff.rotation.set(0.65, -0.2, 0.25);
  rightCuff.position.set(0.31, 1.15, 0.23);
  group.add(rightCuff);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.26, 1.14, 0.36);
  weaponMesh.scale.set(0.88, 0.88, 0.88);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.28);
  return group;
}

export function createThorMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Thor_Odinson';

  const armorHex = skin.primaryColor || '#1e293b';
  const capeHex = skin.capeColor || '#b91c1c';
  const auraHex = skin.auraColor || '#38bdf8';

  const armorMat = new THREE.MeshStandardMaterial({
    color: armorHex,
    metalness: 0.72,
    roughness: 0.3,
  });
  const silverMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    metalness: 0.92,
    roughness: 0.18,
  });
  const capeMat = new THREE.MeshStandardMaterial({
    color: capeHex,
    roughness: 0.48,
    side: THREE.DoubleSide,
  });
  const goldHairMat = new THREE.MeshStandardMaterial({
    color: '#eab308',
    roughness: 0.45,
    metalness: 0.15,
  });
  const thunderGlowMat = new THREE.MeshStandardMaterial({
    color: auraHex,
    emissive: auraHex,
    emissiveIntensity: 2.2,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    color: '#f3d0b5',
    map: createHeroMaskFaceTexture(null, auraHex),
    roughness: 0.38,
  });

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.28), armorMat);
  pelvis.position.set(0, 0.93, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), armorMat);
  torso.position.set(0, 1.28, 0);
  torso.castShadow = true;
  group.add(torso);

  // Six Iconic Silver Asgardian Chest Discs
  for (let row = 0; row < 3; row++) {
    [-0.12, 0.12].forEach(xPos => {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.03, 14), silverMat);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(xPos, 1.42 - row * 0.12, 0.155);
      group.add(disc);
    });
  }

  // Flowing Crimson Asgardian Cape
  const capeGeo = new THREE.PlaneGeometry(0.78, 1.18, 8, 12);
  const cPos = capeGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    cPos.setZ(i, (cPos.getY(i) - 0.59) * 0.14 - 0.05);
  }
  capeGeo.computeVertexNormals();
  const cape = new THREE.Mesh(capeGeo, capeMat);
  cape.position.set(0, 0.96, -0.18);
  cape.castShadow = true;
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  // Head + Asgardian Golden Hair + Winged Silver Helm
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 22, 20), faceMat);
  head.position.set(0, 1.66, 0);
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  group.add(head);

  const hairMane = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.18), goldHairMat);
  hairMane.position.set(0, 1.6, -0.1);
  group.add(hairMane);

  const helmDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.175, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
    silverMat
  );
  helmDome.position.set(0, 1.68, 0);
  group.add(helmDome);

  [-0.18, 0.18].forEach((xPos, idx) => {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4), silverMat);
    wing.position.set(xPos, 1.76, -0.02);
    wing.rotation.set(-0.35, 0, idx === 0 ? 0.55 : -0.55);
    group.add(wing);
  });

  // Legs & Asgardian Greaves
  [-0.12, 0.12].forEach(xPos => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.082, 0.45, 12), armorMat);
    thigh.position.set(xPos, 0.68, 0);
    thigh.castShadow = true;
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.074, 0.36, 12), silverMat);
    shin.position.set(xPos, 0.3, 0);
    group.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.24), armorMat);
    boot.position.set(xPos, 0.06, 0.04);
    group.add(boot);
  });

  // Arms + Mjolnir Orbit Lightning
  const skinMat = new THREE.MeshStandardMaterial({ color: '#f3d0b5', roughness: 0.42 });
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.42, 10), skinMat);
  leftArm.rotation.set(0.5, 0.2, -0.25);
  leftArm.position.set(-0.3, 1.24, 0.1);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.42, 10), skinMat);
  rightArm.rotation.set(0.65, -0.2, 0.25);
  rightArm.position.set(0.3, 1.24, 0.12);
  group.add(rightArm);

  // Orbiting Bifrost storm shards
  const stormOrbit = new THREE.Group();
  stormOrbit.position.set(0, 1.22, 0);
  for (let i = 0; i < 3; i++) {
    const ang = (i * Math.PI * 2) / 3;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), thunderGlowMat);
    shard.position.set(Math.cos(ang) * 0.56, 0.1, Math.sin(ang) * 0.56);
    stormOrbit.add(shard);
  }
  group.add(stormOrbit);
  group.userData.elementalOrbitGroup = stormOrbit;

  // Held Mjolnir / Stormbreaker weapon
  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.15, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.32);
  return group;
}

function createSilvesterFaceTexture(eyeGlowHex: string): THREE.CanvasTexture {
  const key = `silvester_face_${eyeGlowHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#efc6a6';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle sovereign jawline shading
  ctx.fillStyle = 'rgba(30, 41, 59, 0.14)';
  ctx.fillRect(142, 294, 228, 118);

  // Sharp confident eyebrows
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(148, 198); ctx.lineTo(234, 214);
  ctx.moveTo(364, 198); ctx.lineTo(278, 214);
  ctx.stroke();

  // Luminous sovereign eyes
  ctx.fillStyle = eyeGlowHex;
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(196, 232, 24, 12, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(316, 232, 24, 12, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(196, 232, 5.5, 0, Math.PI * 2);
  ctx.arc(316, 232, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Cool half-smirk
  ctx.strokeStyle = '#6b3217';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(216, 342); ctx.quadraticCurveTo(260, 356, 300, 336);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Procedural 3D Model of SILVESTER A.Jais (Apex Sovereign Armor, Layered Cloth Cape, Halo Crown & Dual Cosmic Orbit Rings)
 */
export function createSilvesterMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Silvester_A_Jais';

  const armorHex = skin.primaryColor || '#09090b';
  const energyHex = skin.visorColor || '#38bdf8';
  const capeHex = skin.capeColor || '#312e81';
  const goldHex = skin.gloveColor || '#eab308';

  const armorMat = new THREE.MeshStandardMaterial({
    color: armorHex,
    roughness: 0.2,
    metalness: 0.85,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: goldHex,
    metalness: 0.94,
    roughness: 0.14,
  });
  const energyMat = new THREE.MeshStandardMaterial({
    color: energyHex,
    emissive: energyHex,
    emissiveIntensity: 2.3,
    roughness: 0.08,
  });
  const capeMat = new THREE.MeshStandardMaterial({
    color: capeHex,
    roughness: 0.45,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    color: '#efc6a6',
    map: createSilvesterFaceTexture(energyHex),
    roughness: 0.36,
  });

  // Sculpted sovereign legs & armored greaves
  [-0.125, 0.125].forEach(xPos => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.086, 0.46, 12), armorMat);
    thigh.position.set(xPos, 0.7, 0);
    thigh.castShadow = true;
    group.add(thigh);

    const greave = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.075, 0.38, 12), armorMat);
    greave.position.set(xPos, 0.31, 0);
    group.add(greave);

    const kneeCrest = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.06), goldMat);
    kneeCrest.position.set(xPos, 0.5, 0.075);
    group.add(kneeCrest);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.12, 0.26), goldMat);
    boot.position.set(xPos, 0.07, 0.03);
    group.add(boot);
  });

  // Pelvis + Gold Sovereign Belt
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.28), armorMat);
  pelvis.position.set(0, 0.95, 0);
  group.add(pelvis);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.085, 16), goldMat);
  belt.position.set(0, 1.04, 0);
  belt.scale.set(1, 1, 0.74);
  group.add(belt);

  // Broad Sculpted Sovereign Chestplate + Glowing Omega Star Core
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.31), armorMat);
  torso.position.set(0, 1.3, 0);
  torso.castShadow = true;
  group.add(torso);

  const chestReactorRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 24), goldMat);
  chestReactorRing.position.set(0, 1.36, 0.165);
  group.add(chestReactorRing);

  const chestCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.082, 0), energyMat);
  chestCore.position.set(0, 1.36, 0.17);
  group.add(chestCore);

  // Dramatic Golden Sovereign Shoulder Pauldrons
  [-0.29, 0.29].forEach((xPos, idx) => {
    const pauldron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.15, 0.12, 6),
      goldMat
    );
    pauldron.position.set(xPos, 1.5, 0);
    pauldron.rotation.z = idx === 0 ? 0.38 : -0.38;
    group.add(pauldron);

    const edgeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.18), energyMat);
    edgeTrim.position.set(xPos, 1.54, 0);
    edgeTrim.rotation.z = idx === 0 ? 0.38 : -0.38;
    group.add(edgeTrim);
  });

  // Layered Sovereign Cloth Cape (animated live by cloth physics)
  const capeGeo = new THREE.PlaneGeometry(0.84, 1.32, 8, 12);
  const pos = capeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, (pos.getY(i) - 0.65) * 0.14 - 0.06);
  }
  capeGeo.computeVertexNormals();
  const cape = new THREE.Mesh(capeGeo, capeMat);
  cape.position.set(0, 0.96, -0.2);
  cape.castShadow = true;
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  // Head + Swept Platinum-Silver Sovereign Hair + Glowing Eyes + Halo Crown
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.168, 22, 20), faceMat);
  head.position.set(0, 1.71, 0);
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  group.add(head);

  const hairMat = new THREE.MeshStandardMaterial({
    color: skin.camoPattern === 'silvester_seraph' ? '#fde047' : '#e2e8f0',
    roughness: 0.25,
    metalness: 0.5,
  });
  for (let s = 0; s < 8; s++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.22, 5), hairMat);
    const a = (s / 8) * Math.PI * 1.4 - Math.PI * 0.2;
    spike.position.set(Math.cos(a) * 0.1, 1.84 + Math.abs(Math.sin(a)) * 0.05, Math.sin(a) * 0.09 - 0.03);
    spike.rotation.z = -Math.cos(a) * 0.65;
    spike.rotation.x = -0.38;
    group.add(spike);
  }

  // Luminous Sovereign Halo Crown behind head
  const haloCrown = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.018, 8, 32), energyMat);
  haloCrown.position.set(0, 1.78, -0.14);
  group.add(haloCrown);
  group.userData.arcaneHalo = haloCrown;

  // Dual Sovereign Eye Glow Sockets
  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: energyHex,
    emissive: energyHex,
    emissiveIntensity: 1.6,
    transparent: true,
    opacity: 0.75,
  });
  const leftEyeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeGlowMat);
  leftEyeGlow.position.set(-0.055, 1.71, 0.155);
  group.add(leftEyeGlow);
  const rightEyeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeGlowMat);
  rightEyeGlow.position.set(0.055, 1.71, 0.155);
  group.add(rightEyeGlow);
  group.userData.eyeGlowMat = eyeGlowMat;
  group.userData.leftEyeGlow = leftEyeGlow;
  group.userData.rightEyeGlow = rightEyeGlow;

  // Arms & Sovereign Gauntlets
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.064, 0.42, 12), armorMat);
  leftArm.rotation.set(0.55, 0.18, -0.25);
  leftArm.position.set(-0.29, 1.3, 0.11);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.064, 0.42, 12), armorMat);
  rightArm.rotation.set(0.5, -0.18, 0.25);
  rightArm.position.set(0.29, 1.3, 0.11);
  group.add(rightArm);

  // Orbiting 15-Power Cosmic Star Shards & Dual Orthogonal Energy Rings
  const cosmicOrbit = new THREE.Group();
  cosmicOrbit.position.set(0, 1.28, 0);
  const orbitRingA = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.014, 8, 36), goldMat);
  orbitRingA.rotation.x = Math.PI / 2.6;
  cosmicOrbit.add(orbitRingA);

  const orbitRingB = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 8, 36), energyMat);
  orbitRingB.rotation.y = Math.PI / 3;
  orbitRingB.rotation.x = -Math.PI / 3.2;
  cosmicOrbit.add(orbitRingB);

  for (let i = 0; i < 5; i++) {
    const ang = (i * Math.PI * 2) / 5;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), i % 2 === 0 ? energyMat : goldMat);
    shard.position.set(Math.cos(ang) * 0.68, Math.sin(ang * 2) * 0.18, Math.sin(ang) * 0.68);
    cosmicOrbit.add(shard);
  }
  group.add(cosmicOrbit);
  group.userData.elementalOrbitGroup = cosmicOrbit;

  // Equipped Weapon Mesh
  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.18, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.45);
  return group;
}

/**
 * Procedural 3D Model of DRE (Sonic Titan — Studio Bomber Armor, Headphones, Gold Medallion, EQ Orbit Rings)
 */
export function createDreMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Dre_SonicTitan';

  const isPlatinum = skin.camoPattern === 'dre_platinum';
  const jacketMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor || '#18181b',
    roughness: 0.38,
    metalness: isPlatinum ? 0.65 : 0.35,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: skin.capeColor || '#ea580c',
    emissive: '#9a3412',
    emissiveIntensity: 0.45,
    roughness: 0.28,
    metalness: 0.5,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    roughness: 0.2,
    metalness: 0.9,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: skin.auraColor || '#f97316',
    emissive: skin.auraColor || '#f97316',
    emissiveIntensity: 2.1,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#8d5524', roughness: 0.55 });

  [-0.125, 0.125].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.075, 0.84, 12), jacketMat);
    leg.position.set(xPos, 0.48, 0);
    group.add(leg);
    const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.26), trimMat);
    sneaker.position.set(xPos, 0.06, 0.03);
    group.add(sneaker);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.3), jacketMat);
  torso.position.set(0, 1.22, 0);
  torso.castShadow = true;
  group.add(torso);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.07, 14), goldMat);
  belt.position.set(0, 0.96, 0);
  belt.scale.set(1, 1, 0.72);
  group.add(belt);

  // Gold Chain Medallion
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 8, 20), goldMat);
  chain.position.set(0, 1.38, 0.14);
  chain.rotation.x = 0.28;
  group.add(chain);

  // Head + Neon Studio Visor + Headphones
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 16), skinMat);
  head.position.set(0, 1.66, 0);
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.08), glowMat);
  visor.position.set(0, 1.68, 0.14);
  group.add(visor);

  const band = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.02, 8, 20, Math.PI), trimMat);
  band.position.set(0, 1.68, 0);
  group.add(band);

  [-0.18, 0.18].forEach(xPos => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.045, 12), glowMat);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(xPos, 1.67, 0);
    group.add(cup);
  });

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.062, 0.42, 10), jacketMat);
  leftArm.rotation.set(0.55, 0.2, -0.25);
  leftArm.position.set(-0.29, 1.24, 0.12);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.062, 0.42, 10), jacketMat);
  rightArm.rotation.set(0.55, -0.2, 0.25);
  rightArm.position.set(0.29, 1.24, 0.12);
  group.add(rightArm);

  const orbit = new THREE.Group();
  orbit.position.set(0, 1.24, 0);
  const eqRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.015, 8, 32), glowMat);
  eqRing.rotation.x = Math.PI / 2.4;
  orbit.add(eqRing);
  group.add(orbit);
  group.userData.elementalOrbitGroup = orbit;

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.15, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.35);
  return group;
}

/**
 * Procedural 3D Model of THE TRUTH (White-Gold Veritas Cloak, Pyramid All-Seeing Halo, Orbiting Runes)
 */
export function createTruthMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TheTruth_Veritas';

  const coatMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor || '#f8fafc',
    roughness: 0.36,
    metalness: 0.25,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#b45309',
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.88,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: skin.visorColor || '#fbbf24',
    emissive: skin.visorColor || '#fbbf24',
    emissiveIntensity: 2.2,
  });

  [-0.11, 0.11].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.07, 0.86, 12), coatMat);
    leg.position.set(xPos, 0.48, 0);
    group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.24), goldMat);
    boot.position.set(xPos, 0.06, 0.03);
    group.add(boot);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.28), coatMat);
  torso.position.set(0, 1.24, 0);
  group.add(torso);

  // Flowing Golden-Ivory Mystic Cape
  const capeGeo = new THREE.PlaneGeometry(0.8, 1.28, 8, 12);
  const cape = new THREE.Mesh(
    capeGeo,
    new THREE.MeshStandardMaterial({
      color: skin.capeColor || '#fef08a',
      roughness: 0.45,
      side: THREE.DoubleSide,
    })
  );
  cape.position.set(0, 0.94, -0.19);
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  // Chest Golden Eye Triangle
  const emblem = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 3), goldMat);
  emblem.position.set(0, 1.3, 0.15);
  group.add(emblem);

  // Hooded Head + Glowing Third-Eye Visor
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 16), coatMat);
  head.position.set(0, 1.67, 0);
  group.add(head);

  const eyeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.08), glowMat);
  eyeVisor.position.set(0, 1.67, 0.14);
  group.add(eyeVisor);

  // Floating Golden All-Seeing Pyramid above Crown
  const pyramid = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 4), glowMat);
  pyramid.position.set(0, 2.02, 0);
  group.add(pyramid);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.016, 8, 28), goldMat);
  halo.position.set(0, 1.72, -0.13);
  group.add(halo);
  group.userData.arcaneHalo = halo;

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.42, 10), coatMat);
  leftArm.rotation.set(0.55, 0.15, -0.25);
  leftArm.position.set(-0.27, 1.24, 0.11);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.42, 10), coatMat);
  rightArm.rotation.set(0.55, -0.15, 0.25);
  rightArm.position.set(0.27, 1.24, 0.11);
  group.add(rightArm);

  const orbit = new THREE.Group();
  orbit.position.set(0, 1.25, 0);
  for (let i = 0; i < 3; i++) {
    const ang = (i * Math.PI * 2) / 3;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 3), glowMat);
    shard.position.set(Math.cos(ang) * 0.62, 0, Math.sin(ang) * 0.62);
    orbit.add(shard);
  }
  group.add(orbit);
  group.userData.elementalOrbitGroup = orbit;

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.15, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.35);
  return group;
}

/**
 * Procedural 3D Model of HEILIEA (Starlight Valkyrie — Pearl Armor, Twin Light Wings, Crescent Crown)
 */
export function createHeilieaMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Heiliea_Valkyrie';

  const armorMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor || '#fce7f3',
    roughness: 0.25,
    metalness: 0.55,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: skin.auraColor || '#f472b6',
    emissive: skin.auraColor || '#f472b6',
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: skin.gloveColor || '#fbbf24',
    roughness: 0.2,
    metalness: 0.88,
  });

  [-0.1, 0.1].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.062, 0.88, 12), armorMat);
    leg.position.set(xPos, 0.49, 0);
    group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.22), goldMat);
    boot.position.set(xPos, 0.05, 0.03);
    group.add(boot);
  });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.16, 0.5, 14), armorMat);
  torso.position.set(0, 1.24, 0);
  group.add(torso);

  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), wingMat);
  crest.position.set(0, 1.32, 0.19);
  group.add(crest);

  // Pearl-Pink Flowing Valkyrie Cape + Articulated Twin Light Wings
  const capeGeo = new THREE.PlaneGeometry(0.72, 1.22, 8, 10);
  const cape = new THREE.Mesh(capeGeo, wingMat);
  cape.position.set(0, 0.94, -0.18);
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  [-1, 1].forEach(side => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.03), wingMat);
    wing.position.set(side * 0.48, 1.44, -0.14);
    wing.rotation.z = side * 0.42;
    wing.rotation.y = side * -0.25;
    group.add(wing);
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 16), new THREE.MeshStandardMaterial({ color: '#fde2c8', roughness: 0.55 }));
  head.position.set(0, 1.66, 0);
  group.add(head);

  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 24, Math.PI * 1.2), goldMat);
  crown.position.set(0, 1.78, 0.03);
  crown.rotation.x = Math.PI / 2.2;
  group.add(crown);

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.4, 10), armorMat);
  leftArm.rotation.set(0.55, 0.15, -0.25);
  leftArm.position.set(-0.24, 1.24, 0.1);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.4, 10), armorMat);
  rightArm.rotation.set(0.55, -0.15, 0.25);
  rightArm.position.set(0.24, 1.24, 0.1);
  group.add(rightArm);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.26, 1.16, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.3);
  return group;
}

/**
 * Procedural 3D Model of THE BABY (Compact Tiny Cosmic Titan — Onesie, Hero Cape, Big Eyes, Orbiting Toys)
 */
export function createBabyMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TheBaby_TinyTitan';

  const onesieMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor || '#38bdf8',
    roughness: 0.42,
    metalness: 0.15,
  });
  const capeMat = new THREE.MeshStandardMaterial({
    color: skin.capeColor || '#ef4444',
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#f59e0b',
    emissiveIntensity: 0.85,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.55 });

  // Compact stubby toddler legs
  [-0.095, 0.095].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.068, 0.42, 12), onesieMat);
    leg.position.set(xPos, 0.24, 0);
    group.add(leg);
    const bootie = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), goldMat);
    bootie.position.set(xPos, 0.06, 0.03);
    group.add(bootie);
  });

  // Chubby Star Onesie Torso
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 14), onesieMat);
  torso.scale.set(1.0, 1.15, 0.85);
  torso.position.set(0, 0.68, 0);
  group.add(torso);

  // Golden Pacifier Chest Badge
  const pacifierRing = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.015, 8, 18), goldMat);
  pacifierRing.position.set(0, 0.72, 0.21);
  group.add(pacifierRing);

  // Miniature Hero Cape
  const capeGeo = new THREE.PlaneGeometry(0.56, 0.72, 6, 8);
  const cape = new THREE.Mesh(capeGeo, capeMat);
  cape.position.set(0, 0.56, -0.2);
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  // Oversized Cute-Yet-Fierce Toddler Head + Tuft Curl + Glowing Eyes
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 18), skinMat);
  head.position.set(0, 1.14, 0);
  group.add(head);

  const curl = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.016, 8, 16, Math.PI * 1.4), new THREE.MeshStandardMaterial({ color: '#92400e' }));
  curl.position.set(0, 1.37, 0.03);
  group.add(curl);

  const eyeGlow = new THREE.MeshStandardMaterial({
    color: skin.visorColor || '#38bdf8',
    emissive: skin.visorColor || '#38bdf8',
    emissiveIntensity: 1.8,
  });
  [-0.075, 0.075].forEach(xOff => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), eyeGlow);
    eye.position.set(xOff, 1.16, 0.2);
    group.add(eye);
  });

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.28, 10), onesieMat);
  leftArm.rotation.set(0.6, 0.2, -0.35);
  leftArm.position.set(-0.24, 0.76, 0.1);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.28, 10), onesieMat);
  rightArm.rotation.set(0.6, -0.2, 0.35);
  rightArm.position.set(0.24, 0.76, 0.1);
  group.add(rightArm);

  // Orbiting Floating Toy Stars
  const orbit = new THREE.Group();
  orbit.position.set(0, 0.85, 0);
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI * 2) / 4;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), i % 2 === 0 ? goldMat : eyeGlow);
    star.position.set(Math.cos(ang) * 0.52, Math.sin(ang * 2) * 0.12, Math.sin(ang) * 0.52);
    orbit.add(star);
  }
  group.add(orbit);
  group.userData.elementalOrbitGroup = orbit;

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.24, 0.68, 0.28);
  weaponMesh.scale.set(0.85, 0.85, 0.85);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.05);
  return group;
}

/**
 * Procedural 3D Model of ZENITSU AGATSUMA (Yellow Haori, Corps Uniform, Blonde Spiky Hair, Thunder Nichirin)
 */
export function createZenitsuMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Zenitsu_ThunderBreathing';

  const isGodspeed = skin.camoPattern === 'zenitsu_godspeed';
  const corpsMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.55 });
  const haoriMat = new THREE.MeshStandardMaterial({
    color: skin.capeColor || '#facc15',
    emissive: isGodspeed ? '#ca8a04' : '#713f12',
    emissiveIntensity: isGodspeed ? 0.45 : 0.15,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: '#fde047', roughness: 0.35 });
  const sparkMat = new THREE.MeshStandardMaterial({
    color: skin.auraColor || '#facc15',
    emissive: skin.auraColor || '#facc15',
    emissiveIntensity: isGodspeed ? 2.4 : 1.6,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.55 });
  const wrapMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.65 });

  [-0.105, 0.105].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.84, 12), corpsMat);
    leg.position.set(xPos, 0.48, 0);
    group.add(leg);
    const shinWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.072, 0.28, 10), wrapMat);
    shinWrap.position.set(xPos, 0.22, 0);
    group.add(shinWrap);
    const sandal = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.23), haoriMat);
    sandal.position.set(xPos, 0.05, 0.03);
    group.add(sandal);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.26), corpsMat);
  torso.position.set(0, 1.22, 0);
  torso.castShadow = true;
  group.add(torso);

  // Flowing Yellow Triangle Haori Cloak
  const capeGeo = new THREE.PlaneGeometry(0.74, 1.08, 6, 10);
  const cape = new THREE.Mesh(capeGeo, haoriMat);
  cape.position.set(0, 0.96, -0.17);
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.28), wrapMat);
  belt.position.set(0, 0.98, 0);
  group.add(belt);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.158, 18, 16), skinMat);
  head.position.set(0, 1.64, 0);
  group.add(head);

  // Spiky Golden-Blonde Hair
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 1.6 - Math.PI * 0.3;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.19, 5), hairMat);
    spike.position.set(Math.cos(a) * 0.11, 1.77 + Math.abs(Math.sin(a)) * 0.04, Math.sin(a) * 0.09 - 0.02);
    spike.rotation.z = -Math.cos(a) * 0.6;
    spike.rotation.x = -0.3;
    group.add(spike);
  }

  // Orbiting Thunder Breathing Sparks
  const orbit = new THREE.Group();
  orbit.position.set(0, 1.15, 0);
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI * 2) / 4;
    const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), sparkMat);
    spark.position.set(Math.cos(ang) * 0.6, Math.sin(ang * 2) * 0.15, Math.sin(ang) * 0.6);
    orbit.add(spark);
  }
  group.add(orbit);
  group.userData.elementalOrbitGroup = orbit;

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.4, 10), haoriMat);
  leftArm.rotation.set(0.55, 0.2, -0.25);
  leftArm.position.set(-0.26, 1.24, 0.1);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.4, 10), haoriMat);
  rightArm.rotation.set(0.55, -0.2, 0.25);
  rightArm.position.set(0.26, 1.24, 0.1);
  group.add(rightArm);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.15, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.25);
  return group;
}

/**
 * Procedural 3D Model of TANJIRO KAMADO (Checkered Emerald Haori, Slayer Mark, Water & Sun Breath Ring)
 */
export function createTanjiroMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Tanjiro_WaterSunBreath';

  const isHinokami = skin.camoPattern === 'tanjiro_hinokami';
  const corpsMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.55 });
  const haoriMat = new THREE.MeshStandardMaterial({
    color: skin.capeColor || '#10b981',
    emissive: isHinokami ? '#991b1b' : '#065f46',
    emissiveIntensity: 0.3,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: '#450a0a', roughness: 0.4 });
  const sunMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#f97316', emissiveIntensity: 1.9 });
  const waterMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 1.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.55 });

  [-0.105, 0.105].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.84, 12), corpsMat);
    leg.position.set(xPos, 0.48, 0);
    group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.23), haoriMat);
    boot.position.set(xPos, 0.05, 0.03);
    group.add(boot);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.5, 0.27), corpsMat);
  torso.position.set(0, 1.22, 0);
  torso.castShadow = true;
  group.add(torso);

  const capeGeo = new THREE.PlaneGeometry(0.74, 1.08, 6, 10);
  const cape = new THREE.Mesh(capeGeo, haoriMat);
  cape.position.set(0, 0.96, -0.17);
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
  group.add(cape);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 16), skinMat);
  head.position.set(0, 1.64, 0);
  group.add(head);

  // Burgundy-Dark Hair + Slayer Mark Scar + Hanafuda Earrings
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 1.5 - Math.PI * 0.25;
    const lock = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), hairMat);
    lock.position.set(Math.cos(a) * 0.11, 1.77, Math.sin(a) * 0.09 - 0.02);
    lock.rotation.z = -Math.cos(a) * 0.55;
    lock.rotation.x = -0.25;
    group.add(lock);
  }
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 0.02), sunMat);
  mark.position.set(-0.065, 1.72, 0.145);
  group.add(mark);

  [-0.175, 0.175].forEach(xPos => {
    const earring = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
    earring.position.set(xPos, 1.58, 0.04);
    group.add(earring);
  });

  // Dual Orbiting Water & Sun Spheres
  const orbit = new THREE.Group();
  orbit.position.set(0, 1.2, 0);
  const waterOrb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), waterMat);
  waterOrb.position.set(0.58, 0.1, 0);
  orbit.add(waterOrb);
  const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), sunMat);
  sunOrb.position.set(-0.58, -0.08, 0);
  orbit.add(sunOrb);
  group.add(orbit);
  group.userData.elementalOrbitGroup = orbit;

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.4, 10), haoriMat);
  leftArm.rotation.set(0.55, 0.2, -0.25);
  leftArm.position.set(-0.26, 1.24, 0.1);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.4, 10), haoriMat);
  rightArm.rotation.set(0.55, -0.2, 0.25);
  rightArm.position.set(0.26, 1.24, 0.1);
  group.add(rightArm);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.15, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.25);
  return group;
}

/**
 * Procedural 3D Model of MUZAN KIBUTSUJI (Demon King Suit or Final White-Hair Form + Spine Whips)
 */
export function createMuzanMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Muzan_DemonKing';

  const isFinal = skin.camoPattern === 'muzan_final';
  const suitMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor || '#18181b',
    roughness: 0.35,
    metalness: 0.25,
  });
  const bloodMat = new THREE.MeshStandardMaterial({
    color: skin.auraColor || '#dc2626',
    emissive: '#b91c1c',
    emissiveIntensity: 1.6,
  });
  const paleSkinMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.45 });
  const hatMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: isFinal ? '#f8fafc' : '#09090b', roughness: 0.3 });

  [-0.11, 0.11].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.072, 0.88, 12), suitMat);
    leg.position.set(xPos, 0.49, 0);
    group.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.24), bloodMat);
    shoe.position.set(xPos, 0.05, 0.03);
    group.add(shoe);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.28), suitMat);
  torso.position.set(0, 1.25, 0);
  torso.castShadow = true;
  group.add(torso);

  // Flowing Demon Spine Whip Tendrils on Back
  [-0.2, 0.2].forEach((xOff, idx) => {
    const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 1.25, 8), bloodMat);
    whip.position.set(xOff, 1.32, -0.26);
    whip.rotation.z = idx === 0 ? 0.45 : -0.45;
    whip.rotation.x = -0.35;
    group.add(whip);
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.162, 18, 16), paleSkinMat);
  head.position.set(0, 1.68, 0);
  group.add(head);

  // Glowing Demon King Crimson Eyes
  [-0.055, 0.055].forEach(xOff => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), bloodMat);
    eye.position.set(xOff, 1.69, 0.15);
    group.add(eye);
  });

  if (isFinal) {
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 1.5 - Math.PI * 0.25;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 5), hairMat);
      spike.position.set(Math.cos(a) * 0.11, 1.82, Math.sin(a) * 0.09 - 0.02);
      spike.rotation.z = -Math.cos(a) * 0.65;
      group.add(spike);
    }
  } else {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.025, 18), hatMat);
    brim.position.set(0, 1.79, 0.02);
    group.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.14, 16), hatMat);
    crown.position.set(0, 1.86, 0.02);
    group.add(crown);
  }

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.42, 10), suitMat);
  leftArm.rotation.set(0.55, 0.18, -0.25);
  leftArm.position.set(-0.27, 1.25, 0.11);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.42, 10), suitMat);
  rightArm.rotation.set(0.55, -0.18, 0.25);
  rightArm.position.set(0.27, 1.25, 0.11);
  group.add(rightArm);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.15, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.35);
  return group;
}

/**
 * Procedural 3D Operator
 * Routes to Saitama, Goku, Superman, Silvester A.Jais, Dre, The Truth, Heiliea, The Baby, Zenitsu, Tanjiro, Muzan, Maxwell, King, Flash, Green Lantern, Shazam, Thor, or tactical soldier
 */
export function createOperatorMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const pat = skin.camoPattern || '';
  if (pat.startsWith('saitama')) {
    return createSaitamaMesh(skin, weapon);
  }

  let built: THREE.Group | null = null;
  let asymmetricCape = true;
  let skipNeckEars = false;
  let skipGeometrySculpt = false;

  if (pat.startsWith('goku_')) {
    built = createGokuMesh(skin, weapon);
  } else if (pat.startsWith('superman_')) {
    asymmetricCape = false;
    built = createSupermanMesh(skin, weapon);
  } else if (pat.startsWith('silvester_')) {
    asymmetricCape = true;
    built = createSilvesterMesh(skin, weapon);
  } else if (pat.startsWith('dre_')) {
    built = createDreMesh(skin, weapon);
  } else if (pat.startsWith('truth_')) {
    asymmetricCape = false;
    built = createTruthMesh(skin, weapon);
  } else if (pat.startsWith('heiliea_')) {
    asymmetricCape = false;
    built = createHeilieaMesh(skin, weapon);
  } else if (pat.startsWith('baby_')) {
    skipGeometrySculpt = true;
    skipNeckEars = true;
    asymmetricCape = true;
    built = createBabyMesh(skin, weapon);
  } else if (pat.startsWith('zenitsu_')) {
    asymmetricCape = true;
    built = createZenitsuMesh(skin, weapon);
  } else if (pat.startsWith('tanjiro_')) {
    asymmetricCape = true;
    built = createTanjiroMesh(skin, weapon);
  } else if (pat.startsWith('muzan_')) {
    built = createMuzanMesh(skin, weapon);
  } else if (pat.startsWith('maxwell_')) {
    asymmetricCape = true;
    built = createMaxwellMesh(skin, weapon);
  } else if (pat.startsWith('king_')) {
    built = createKingMesh(skin, weapon);
  } else if (pat.startsWith('flash_')) {
    built = createFlashMesh(skin, weapon);
  } else if (pat.startsWith('lantern_')) {
    built = createGreenLanternMesh(skin, weapon);
  } else if (pat.startsWith('shazam_')) {
    asymmetricCape = true;
    built = createShazamMesh(skin, weapon);
  } else if (pat.startsWith('thor_')) {
    asymmetricCape = false;
    built = createThorMesh(skin, weapon);
  } else if (
    pat.startsWith('ironman_') ||
    pat.startsWith('spiderman_') ||
    pat.startsWith('strange_') ||
    pat.startsWith('wanda_')
  ) {
    skipNeckEars = pat.startsWith('ironman_') || pat.startsWith('spiderman_');
    asymmetricCape = !pat.startsWith('strange_');
    built = createMarvelHeroMesh(skin, weapon);
  } else if (
    pat.startsWith('batman_') ||
    pat.startsWith('ww_') ||
    pat.startsWith('aquaman_')
  ) {
    skipNeckEars = pat.startsWith('batman_');
    asymmetricCape = pat.startsWith('batman_');
    built = createDcHeroMesh(skin, weapon);
  } else if (
    pat.startsWith('rimuru_') ||
    pat.startsWith('jinwoo_') ||
    pat.startsWith('naruto_') ||
    pat.startsWith('luffy_') ||
    pat.startsWith('gojo_') ||
    pat.startsWith('yuji_') ||
    pat.startsWith('garou_') ||
    pat.startsWith('anos_') ||
    pat.startsWith('itachi_') ||
    pat.startsWith('sasuke_')
  ) {
    asymmetricCape = !pat.startsWith('anos_');
    built = createAnimeHeroMesh(skin, weapon);
  }

  if (built) {
    applyUniversalRealismUpgrade(built, {
      asymmetricCape,
      skipNeckEars,
      skipGeometrySculpt,
    });
    return built;
  }

  const group = new THREE.Group();
  group.name = 'TacticalOperator';

  const camoTex = createCamoTexture(skin.camoPattern, skin.primaryColor);

  const uniformMat = new THREE.MeshStandardMaterial({
    map: camoTex,
    roughness: 0.65,
    metalness: 0.15,
  });

  const armorMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.35,
    metalness: 0.7,
  });

  const gearMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.4,
    metalness: 0.5,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: skin.visorColor,
    emissive: skin.visorColor,
    emissiveIntensity: 1.6,
    roughness: 0.1,
    metalness: 0.9,
  });

  // 1. Pelvis / Hip Belt
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.26), gearMat);
  pelvis.position.set(0, 0.92, 0);
  pelvis.castShadow = true;
  group.add(pelvis);

  // 2. Torso / Combat Fatigues
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.28), uniformMat);
  torso.position.set(0, 1.22, 0);
  torso.castShadow = true;
  group.add(torso);

  // 3. Bulletproof Tactical Plate Carrier Vest
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.32), armorMat);
  vest.position.set(0, 1.24, 0.01);
  vest.castShadow = true;
  group.add(vest);

  // 4. Front Magazine Pouches (3 pouches on chest)
  for (let i = -1; i <= 1; i++) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.08), gearMat);
    pouch.position.set(i * 0.11, 1.18, 0.18);
    group.add(pouch);
  }

  // 5. Tactical Radio with Long Antenna (On back-left)
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), gearMat);
  radio.position.set(-0.16, 1.34, -0.17);
  group.add(radio);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 8), gearMat);
  antenna.position.set(-0.16, 1.55, -0.17);
  group.add(antenna);

  // 6. Tactical Ballistic Helmet & Night-Vision Goggles
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 14), uniformMat);
  head.position.set(0, 1.58, 0);
  head.castShadow = true;
  group.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), armorMat);
  helmet.position.set(0, 1.59, 0);
  helmet.castShadow = true;
  group.add(helmet);

  // Visor / Tactical Goggles
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.09), visorMat);
  visor.position.set(0, 1.6, 0.14);
  group.add(visor);

  // Dual NVG tubes (folded up or active)
  const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.07), gearMat);
  nvgMount.position.set(0, 1.72, 0.15);
  group.add(nvgMount);

  // 7. Left & Right Legs with Knee Guards and Boots
  [-0.12, 0.12].forEach((xPos) => {
    // Upper Thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 12), uniformMat);
    thigh.position.set(xPos, 0.68, 0);
    thigh.castShadow = true;
    group.add(thigh);

    // Knee Armor Guard
    const knee = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.06), armorMat);
    knee.position.set(xPos, 0.48, 0.08);
    group.add(knee);

    // Shin / Lower Leg
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38, 12), uniformMat);
    shin.position.set(xPos, 0.28, 0);
    shin.castShadow = true;
    group.add(shin);

    // Tactical Combat Boot
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.24), gearMat);
    boot.position.set(xPos, 0.06, 0.04);
    boot.castShadow = true;
    group.add(boot);
  });

  // 8. Arms holding the firearm in combat ready stance
  // Left Arm (Foregrip support)
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.4, 10), uniformMat);
  leftArm.rotation.set(0.8, 0.4, -0.4);
  leftArm.position.set(-0.24, 1.18, 0.22);
  group.add(leftArm);

  // Right Arm (Trigger grip)
  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.4, 10), uniformMat);
  rightArm.rotation.set(0.9, -0.3, 0.3);
  rightArm.position.set(0.24, 1.18, 0.18);
  group.add(rightArm);

  // 9. Held Firearm
  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.08, 1.14, 0.38);
  weaponMesh.rotation.set(0, -0.05, 0);
  group.add(weaponMesh);

  // Ground contact shadow disc
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  group.add(shadowPlane);

  applyUniversalRealismUpgrade(group, { skipNeckEars: true });
  return group;
}

/**
 * Creates 3D Animated Power-Up Pickups
 */
export function createPowerUpMesh(type: string, colorHex: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `PowerUp_${type}`;

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 2.2,
    roughness: 0.1,
    metalness: 0.9,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.8,
    roughness: 0.3,
  });

  // Base tactical pedestal
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 0.2, 8), baseMat);
  base.position.y = 0.1;
  group.add(base);

  // Glowing inner beacon ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 24), coreMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.22;
  group.add(ring);

  // Floating Hero Hologram
  const holoGroup = new THREE.Group();
  holoGroup.name = 'Hologram';
  holoGroup.position.y = 1.0;

  if (type === 'health') {
    // Medical Cross
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), coreMat);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.18), coreMat);
    holoGroup.add(barV);
    holoGroup.add(barH);
  } else if (type === 'armor') {
    // Tactical Shield
    const shield = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), coreMat);
    shield.scale.set(1.1, 1.3, 0.6);
    holoGroup.add(shield);
  } else if (type === 'quad_damage') {
    // Menacing quad rune / 4 spinning blades
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 4), coreMat);
      blade.rotation.z = (i * Math.PI) / 2;
      blade.position.set(Math.cos((i * Math.PI) / 2) * 0.25, Math.sin((i * Math.PI) / 2) * 0.25, 0);
      holoGroup.add(blade);
    }
  } else if (type === 'speed') {
    // Lightning bolt / dual chevron
    const chev1 = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 3), coreMat);
    chev1.rotation.z = Math.PI;
    chev1.position.y = 0.15;
    const chev2 = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 3), coreMat);
    chev2.position.y = -0.15;
    holoGroup.add(chev1);
    holoGroup.add(chev2);
  } else {
    // Ammo Crate
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.3), coreMat);
    holoGroup.add(crate);
  }

  group.add(holoGroup);

  // Vertical light beacon beam
  const beamMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.45, 8, 12, 1, true), beamMat);
  beam.position.y = 4.0;
  group.add(beam);

  return group;
}

/**
 * Procedural 3D Elemental Witch (Fire Magic & Water Magic)
 * Composite pointed witch hat, layered robe, arcane belt, moonlit face,
 * glowing elemental eyes, twisted crystal staff, and orbiting fire & water orbs.
 */
export function createWitchMesh(variantIndex: number = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ElementalWitch';

  const isCrimsonAccent = variantIndex % 2 === 0;
  const robeHex = isCrimsonAccent ? '#2a0f2b' : '#0e1b33';
  const trimHex = isCrimsonAccent ? '#f97316' : '#38bdf8';

  const robeMat = new THREE.MeshStandardMaterial({
    color: robeHex,
    roughness: 0.78,
    metalness: 0.08,
  });

  const cloakMat = new THREE.MeshStandardMaterial({
    color: '#140c1c',
    roughness: 0.82,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: '#d4af37',
    roughness: 0.25,
    metalness: 0.85,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: '#e9d8d2',
    roughness: 0.58,
    metalness: 0.02,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: isCrimsonAccent ? '#1f1024' : '#cbd5e1',
    roughness: 0.65,
    metalness: 0.1,
  });

  const fireMat = new THREE.MeshStandardMaterial({
    color: '#fb923c',
    emissive: '#ef4444',
    emissiveIntensity: 2.2,
    roughness: 0.18,
    metalness: 0.2,
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 2.2,
    roughness: 0.12,
    metalness: 0.35,
  });

  // 1. Flared Witch Robe Skirt (grounded bottom-center at y = 0)
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.44, 0.96, 16), robeMat);
  skirt.position.set(0, 0.48, 0);
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  group.add(skirt);

  // Scalloped hem trim ring
  const hemTrim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.022, 8, 24), metalMat);
  hemTrim.rotation.x = Math.PI / 2;
  hemTrim.position.set(0, 0.04, 0);
  group.add(hemTrim);

  // 2. Corset Torso & Arcane Gold Belt
  const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.46, 14), robeMat);
  bodice.position.set(0, 1.16, 0);
  bodice.castShadow = true;
  group.add(bodice);

  const sashBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.09, 14), metalMat);
  sashBelt.position.set(0, 0.96, 0);
  group.add(sashBelt);

  // Glowing dual-element brooch on chest
  const brooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), isCrimsonAccent ? fireMat : waterMat);
  brooch.position.set(0, 1.24, 0.19);
  group.add(brooch);

  // 3. Flowing Shoulder Mantle & Cape
  const mantle = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.35, 14, 1, true),
    cloakMat
  );
  mantle.position.set(0, 1.32, -0.02);
  group.add(mantle);

  const capeGeo = new THREE.PlaneGeometry(0.68, 1.15, 6, 8);
  const cape = new THREE.Mesh(capeGeo, cloakMat);
  cape.position.set(0, 0.85, -0.2);
  cape.rotation.x = 0.14;
  cape.castShadow = true;
  group.add(cape);
  group.userData.capeMesh = cape;
  group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array as Float32Array);

  // 4. Head, Hair & Glowing Arcane Eyes
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 14), skinMat);
  head.position.set(0, 1.56, 0);
  head.castShadow = true;
  group.add(head);

  // Flowing witch hair locks
  const hairBack = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.38, 12), hairMat);
  hairBack.position.set(0, 1.44, -0.06);
  group.add(hairBack);

  // Glowing eyes (one fire ember, one hydro cyan tint or dual arcane glow)
  [-0.055, 0.055].forEach((xOff, i) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 8, 8),
      i === 0 ? fireMat : waterMat
    );
    eye.position.set(xOff, 1.57, 0.14);
    group.add(eye);
  });

  // 5. Iconic Pointed Witch Hat (Brim + Crown Band + Bent Spire)
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 1.66, 0);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.03, 20), cloakMat);
  brim.castShadow = true;
  hatGroup.add(brim);

  const brimRim = new THREE.Mesh(new THREE.TorusGeometry(0.435, 0.015, 8, 24), metalMat);
  brimRim.rotation.x = Math.PI / 2;
  hatGroup.add(brimRim);

  const hatLowerCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 16), cloakMat);
  hatLowerCone.position.set(0, 0.21, 0);
  hatLowerCone.castShadow = true;
  hatGroup.add(hatLowerCone);

  const hatBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.185, 0.195, 0.055, 16),
    new THREE.MeshStandardMaterial({
      color: trimHex,
      emissive: trimHex,
      emissiveIntensity: 1.4,
      roughness: 0.25,
    })
  );
  hatBand.position.set(0, 0.05, 0);
  hatGroup.add(hatBand);

  const hatTip = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.3, 12), cloakMat);
  hatTip.position.set(0, 0.45, -0.07);
  hatTip.rotation.x = -0.45;
  hatGroup.add(hatTip);

  group.add(hatGroup);

  // 6. Arms & Dual-Elemental Arcane Staff
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.04, 0.42, 10), robeMat);
  leftArm.position.set(-0.25, 1.18, 0.16);
  leftArm.rotation.set(0.85, 0.2, -0.35);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.04, 0.42, 10), robeMat);
  rightArm.position.set(0.27, 1.18, 0.18);
  rightArm.rotation.set(0.75, -0.15, 0.25);
  group.add(rightArm);

  const woodMat = new THREE.MeshStandardMaterial({
    color: '#3f2314',
    roughness: 0.72,
    metalness: 0.15,
  });

  const staffGroup = new THREE.Group();
  staffGroup.position.set(0.35, 1.05, 0.28);
  staffGroup.rotation.x = 0.22;

  const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, 1.75, 10), woodMat);
  staffShaft.castShadow = true;
  staffGroup.add(staffShaft);

  const cradleRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 18), metalMat);
  cradleRing.position.set(0, 0.96, 0);
  staffGroup.add(cradleRing);

  // Dual Fire + Water staff orbs
  const staffFireOrb = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), fireMat);
  staffFireOrb.position.set(-0.055, 0.96, 0);
  staffGroup.add(staffFireOrb);

  const staffWaterOrb = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), waterMat);
  staffWaterOrb.position.set(0.055, 0.96, 0);
  staffGroup.add(staffWaterOrb);

  group.add(staffGroup);
  group.userData.staffGroup = staffGroup;

  // 7. Floating Orbiting Fire & Water Magic Spheres around Witch
  const orbitPivot = new THREE.Group();
  orbitPivot.position.set(0, 1.32, 0);

  const fireOrb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), fireMat);
  fireOrb.position.set(0.55, 0.12, 0);
  orbitPivot.add(fireOrb);

  const waterOrb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), waterMat);
  waterOrb.position.set(-0.55, -0.05, 0);
  orbitPivot.add(waterOrb);

  group.add(orbitPivot);
  group.userData.magicOrbitPivot = orbitPivot;

  // 8. Ground Contact Shadow Disc
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.3),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  group.add(shadowPlane);

  applyUniversalRealismUpgrade(group, {
    asymmetricCape: false,
    skipNeckEars: false,
  });
  return group;
}

function createCosmicSkinTexture(baseHex: string, dotHex: string): THREE.CanvasTexture {
  const key = `cosmic_tex_${baseHex}_${dotHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : dotHex;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 2.4 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Procedural 3D Marvel Hero Builder (Iron Man, Spider-Man, Doctor Strange, Scarlet Witch)
 */
export function createMarvelHeroMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  const pat = skin.camoPattern || 'ironman_mk3';
  const isIronMan = pat.startsWith('ironman_');
  const isSpidey = pat.startsWith('spiderman_');
  const isStrange = pat.startsWith('strange_');
  const isWanda = pat.startsWith('wanda_');
  const isHulkbuster = pat === 'ironman_hulkbuster';

  const primaryMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor || '#b91c1c',
    roughness: isIronMan ? 0.2 : 0.45,
    metalness: isIronMan ? 0.85 : 0.2,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: skin.gloveColor || '#eab308',
    roughness: 0.25,
    metalness: isIronMan ? 0.88 : 0.3,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: skin.visorColor || '#38bdf8',
    emissive: skin.visorColor || '#38bdf8',
    emissiveIntensity: 2.1,
  });

  if (isHulkbuster) {
    group.scale.set(1.24, 1.18, 1.24);
  }

  [-0.115, 0.115].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.074, 0.86, 12), primaryMat);
    leg.position.set(xPos, 0.48, 0);
    leg.castShadow = true;
    group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.12, 0.24), trimMat);
    boot.position.set(xPos, 0.06, 0.03);
    group.add(boot);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.29), primaryMat);
  torso.position.set(0, 1.24, 0);
  torso.castShadow = true;
  group.add(torso);

  if (isIronMan) {
    const arc = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 16), glowMat);
    arc.rotation.x = Math.PI / 2;
    arc.position.set(0, 1.32, 0.155);
    group.add(arc);
    [-0.27, 0.27].forEach((xP, i) => {
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.24), trimMat);
      pauldron.position.set(xP, 1.48, 0);
      pauldron.rotation.z = i === 0 ? 0.28 : -0.28;
      group.add(pauldron);
    });
    if (pat === 'ironman_mk50' || pat === 'ironman_mk85') {
      [-1, 1].forEach(s => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.04), glowMat);
        wing.position.set(s * 0.34, 1.44, -0.18);
        wing.rotation.z = s * 0.42;
        group.add(wing);
      });
    }
  } else if (isSpidey) {
    const spiderBadge = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), trimMat);
    spiderBadge.position.set(0, 1.3, 0.155);
    group.add(spiderBadge);
    if (pat === 'spiderman_iron') {
      [-1, 1].forEach(s => {
        for (let row = 0; row < 2; row++) {
          const mechArm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.015, 0.78, 8), trimMat);
          mechArm.position.set(s * (0.28 + row * 0.12), 1.48 + row * 0.16, -0.2);
          mechArm.rotation.z = s * (-0.55 - row * 0.2);
          mechArm.rotation.x = 0.25;
          group.add(mechArm);
        }
      });
    }
  } else if (isStrange || isWanda) {
    const capeGeo = new THREE.PlaneGeometry(0.82, 1.24, 8, 12);
    const capeMat = new THREE.MeshStandardMaterial({
      color: skin.capeColor || '#dc2626',
      roughness: 0.48,
      side: THREE.DoubleSide,
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 0.96, -0.19);
    group.userData.capeMesh = cape;
    group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
    group.add(cape);
    if (isStrange) {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 18, Math.PI * 1.15), capeMat);
      collar.position.set(0, 1.54, -0.08);
      group.add(collar);
      const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), glowMat);
      eye.rotation.x = Math.PI / 2;
      eye.position.set(0, 1.34, 0.16);
      group.add(eye);
    }
  }

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.164, 20, 18),
    isIronMan || isSpidey ? primaryMat : new THREE.MeshStandardMaterial({ color: '#f3d0b5', roughness: 0.5 })
  );
  head.position.set(0, 1.66, 0);
  head.castShadow = true;
  group.add(head);

  if (isIronMan) {
    const faceplate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.06), trimMat);
    faceplate.position.set(0, 1.65, 0.13);
    group.add(faceplate);
  }
  if (isIronMan || isSpidey) {
    [-0.06, 0.06].forEach(xP => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.035, 0.04), glowMat);
      eye.position.set(xP, 1.68, 0.165);
      group.add(eye);
    });
  }
  if (isWanda) {
    const tiara = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 4), trimMat);
    tiara.position.set(0, 1.78, 0.12);
    group.add(tiara);
  }

  const orbit = new THREE.Group();
  orbit.position.set(0, 1.28, 0);
  const auraRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.015, 8, 28), glowMat);
  auraRing.rotation.x = Math.PI / 2.4;
  orbit.add(auraRing);
  group.add(orbit);
  group.userData.elementalOrbitGroup = orbit;

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.42, 10), primaryMat);
  leftArm.rotation.set(0.55, 0.2, -0.25);
  leftArm.position.set(-0.28, 1.25, 0.11);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.42, 10), primaryMat);
  rightArm.rotation.set(0.55, -0.2, 0.25);
  rightArm.position.set(0.28, 1.25, 0.11);
  group.add(rightArm);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.16, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.32);
  return group;
}

/**
 * Procedural 3D DC Hero Builder (Batman, Wonder Woman, Aquaman)
 */
export function createDcHeroMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  const pat = skin.camoPattern || 'batman_classic';
  const isBat = pat.startsWith('batman_');
  const isWW = pat.startsWith('ww_');
  const isAqua = pat.startsWith('aquaman_');

  const suitMat = new THREE.MeshStandardMaterial({
    color: skin.primaryColor || '#334155',
    roughness: isWW || isAqua ? 0.28 : 0.42,
    metalness: isWW || isAqua || pat === 'batman_hellbat' ? 0.72 : 0.35,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: skin.gloveColor || '#eab308',
    metalness: 0.88,
    roughness: 0.2,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: skin.visorColor || '#fbbf24',
    emissive: skin.visorColor || '#fbbf24',
    emissiveIntensity: 2.0,
  });

  [-0.11, 0.11].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.072, 0.86, 12), suitMat);
    leg.position.set(xPos, 0.48, 0);
    leg.castShadow = true;
    group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.24), trimMat);
    boot.position.set(xPos, 0.06, 0.03);
    group.add(boot);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.28), suitMat);
  torso.position.set(0, 1.24, 0);
  torso.castShadow = true;
  group.add(torso);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), trimMat);
  belt.position.set(0, 0.98, 0);
  belt.scale.set(1, 1, 0.75);
  group.add(belt);

  if (skin.capeColor && skin.capeColor !== 'none') {
    const capeGeo = new THREE.PlaneGeometry(0.84, 1.26, 8, 12);
    const cape = new THREE.Mesh(
      capeGeo,
      new THREE.MeshStandardMaterial({ color: skin.capeColor, roughness: 0.5, side: THREE.DoubleSide })
    );
    cape.position.set(0, 0.95, -0.19);
    group.userData.capeMesh = cape;
    group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
    group.add(cape);
  }

  if (pat === 'batman_hellbat' || pat === 'ww_golden_eagle') {
    [-1, 1].forEach(side => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.26, 0.03), glowMat);
      wing.position.set(side * 0.46, 1.42, -0.16);
      wing.rotation.z = side * 0.4;
      group.add(wing);
    });
  }

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.162, 20, 18),
    isBat ? suitMat : new THREE.MeshStandardMaterial({ color: '#f2ccb0', roughness: 0.52 })
  );
  head.position.set(0, 1.66, 0);
  group.add(head);

  if (isBat) {
    [-0.1, 0.1].forEach(xP => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 4), suitMat);
      ear.position.set(xP, 1.84, 0.01);
      group.add(ear);
    });
    [-0.055, 0.055].forEach(xP => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.028, 0.03), glowMat);
      eye.position.set(xP, 1.68, 0.16);
      group.add(eye);
    });
  } else {
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.02, 8, 22), trimMat);
    crown.position.set(0, 1.76, 0.02);
    crown.rotation.x = Math.PI / 2.2;
    group.add(crown);
  }

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.42, 10), suitMat);
  leftArm.rotation.set(0.55, 0.2, -0.25);
  leftArm.position.set(-0.28, 1.25, 0.11);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.42, 10), suitMat);
  rightArm.rotation.set(0.55, -0.2, 0.25);
  rightArm.position.set(0.28, 1.25, 0.11);
  group.add(rightArm);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.16, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.32);
  return group;
}

/**
 * Procedural 3D Anime Legends Hero Builder
 * (Rimuru, Sung Jin-Woo, Naruto, Luffy, Gojo, Yuji Itadori, Garou, Anos, Itachi, Sasuke)
 */
export function createAnimeHeroMesh(skin: OperatorSkin, weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();
  const pat = skin.camoPattern || 'rimuru_base';
  const isCosmic = pat === 'garou_cosmic';
  const isSixPathsOrOrbit =
    pat === 'naruto_sixpaths' ||
    pat === 'naruto_baryon' ||
    pat === 'sasuke_rinnegan' ||
    pat === 'gojo_shinjuku' ||
    pat === 'rimuru_true_dragon';

  const primaryMat = new THREE.MeshStandardMaterial({
    map: isCosmic ? createCosmicSkinTexture('#09090b', '#a855f7') : undefined,
    color: isCosmic ? '#ffffff' : skin.primaryColor || '#1e293b',
    roughness: isCosmic ? 0.22 : 0.48,
    metalness: isCosmic ? 0.65 : 0.18,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: skin.gloveColor || '#eab308',
    roughness: 0.35,
    metalness: 0.45,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: skin.auraColor || skin.visorColor || '#38bdf8',
    emissive: skin.auraColor || skin.visorColor || '#38bdf8',
    emissiveIntensity: 2.1,
  });

  [-0.105, 0.105].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.07, 0.84, 12), primaryMat);
    leg.position.set(xPos, 0.48, 0);
    leg.castShadow = true;
    group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.1, 0.23), accentMat);
    boot.position.set(xPos, 0.05, 0.03);
    group.add(boot);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.27), primaryMat);
  torso.position.set(0, 1.23, 0);
  torso.castShadow = true;
  group.add(torso);

  if (skin.capeColor && skin.capeColor !== 'none') {
    const capeGeo = new THREE.PlaneGeometry(0.8, 1.22, 8, 12);
    const cape = new THREE.Mesh(
      capeGeo,
      new THREE.MeshStandardMaterial({ color: skin.capeColor, roughness: 0.45, side: THREE.DoubleSide })
    );
    cape.position.set(0, 0.94, -0.19);
    group.userData.capeMesh = cape;
    group.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array);
    group.add(cape);
  }

  // Transformation Wings / Baryon Tails / Gear 5 Hagoromo Scarf / Susanoo Ribs
  if (
    pat === 'rimuru_demon_lord' ||
    pat === 'rimuru_true_dragon' ||
    pat === 'sasuke_ems' ||
    pat === 'sasuke_rinnegan' ||
    pat === 'itachi_susanoo'
  ) {
    [-1, 1].forEach(side => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.24, 0.04), glowMat);
      wing.position.set(side * 0.44, 1.38, -0.18);
      wing.rotation.z = side * 0.38;
      group.add(wing);
    });
  }
  if (pat === 'naruto_baryon' || pat === 'naruto_kcm2') {
    for (let t = -1; t <= 1; t++) {
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.95, 6), glowMat);
      tail.position.set(t * 0.22, 1.1, -0.28);
      tail.rotation.x = -0.55;
      tail.rotation.z = t * 0.35;
      group.add(tail);
    }
  }
  if (pat === 'luffy_gear5' || pat === 'luffy_gear4') {
    const cloudCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.045, 8, 22),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: '#e2e8f0', emissiveIntensity: 0.45 })
    );
    cloudCollar.position.set(0, 1.48, -0.04);
    cloudCollar.rotation.x = 0.35;
    group.add(cloudCollar);
  }

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 18, 16),
    isCosmic ? primaryMat : new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.52 })
  );
  head.position.set(0, 1.65, 0);
  head.castShadow = true;
  group.add(head);

  // Iconic Anime Hair / Straw Hat / Blindfold / Demon Horns
  const hairHex = pat.startsWith('naruto_')
    ? '#facc15'
    : pat.startsWith('gojo_') || pat === 'luffy_gear5'
    ? '#f8fafc'
    : pat.startsWith('yuji_')
    ? '#fb7185'
    : pat.startsWith('rimuru_')
    ? '#7dd3fc'
    : pat.startsWith('garou_')
    ? isCosmic
      ? '#38bdf8'
      : pat === 'garou_monster'
      ? '#dc2626'
      : '#e2e8f0'
    : '#0f172a';
  const hairMat = new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.35 });

  for (let s = 0; s < 7; s++) {
    const a = (s / 7) * Math.PI * 1.5 - Math.PI * 0.25;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 5), hairMat);
    spike.position.set(Math.cos(a) * 0.11, 1.79, Math.sin(a) * 0.09 - 0.02);
    spike.rotation.z = -Math.cos(a) * 0.62;
    group.add(spike);
  }

  if (pat.startsWith('luffy_')) {
    const strawMat = new THREE.MeshStandardMaterial({ color: pat === 'luffy_gear5' ? '#f8fafc' : '#eab308', roughness: 0.65 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.025, 18), strawMat);
    brim.position.set(0, 1.78, 0.02);
    group.add(brim);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.12, 16), strawMat);
    dome.position.set(0, 1.84, 0.02);
    group.add(dome);
  } else if (pat === 'gojo_blindfold') {
    const blindfold = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.075, 0.18), new THREE.MeshStandardMaterial({ color: '#09090b' }));
    blindfold.position.set(0, 1.67, 0.06);
    group.add(blindfold);
  } else {
    [-0.055, 0.055].forEach(xP => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 8), glowMat);
      eye.position.set(xP, 1.66, 0.15);
      group.add(eye);
    });
  }

  // Orbiting Truth-Seeking Orbs / Shadow Mist / Limitless Spheres
  const orbit = new THREE.Group();
  orbit.position.set(0, 1.32, 0);
  const orbCount = isSixPathsOrOrbit ? 6 : 3;
  for (let i = 0; i < orbCount; i++) {
    const ang = (i * Math.PI * 2) / orbCount;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), i % 2 === 0 ? glowMat : accentMat);
    orb.position.set(Math.cos(ang) * 0.62, Math.sin(ang * 2) * 0.16, Math.sin(ang) * 0.62);
    orbit.add(orb);
  }
  group.add(orbit);
  group.userData.elementalOrbitGroup = orbit;

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.4, 10), primaryMat);
  leftArm.rotation.set(0.55, 0.2, -0.25);
  leftArm.position.set(-0.27, 1.24, 0.1);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.4, 10), primaryMat);
  rightArm.rotation.set(0.55, -0.2, 0.25);
  rightArm.position.set(0.27, 1.24, 0.1);
  group.add(rightArm);

  const weaponMesh = createWeaponMesh(weapon);
  weaponMesh.position.set(0.28, 1.15, 0.36);
  weaponMesh.scale.set(0.92, 0.92, 0.92);
  group.add(weaponMesh);

  addHeroGroundShadow(group, 1.3);
  return group;
}


