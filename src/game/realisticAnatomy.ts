import * as THREE from 'three';

const mapCache = new Map<string, THREE.CanvasTexture>();
const geoCache = new Map<string, THREE.BufferGeometry>();

// Seeded deterministic PRNG so procedural bumps/textures look natural and never flicker across frames
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function finalizeMap(
  canvas: HTMLCanvasElement,
  key: string,
  options: { srgb?: boolean; repeatX?: number; repeatY?: number } = {}
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (options.repeatX && options.repeatY) {
    tex.repeat.set(options.repeatX, options.repeatY);
  }
  tex.colorSpace = options.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  mapCache.set(key, tex);
  return tex;
}

/**
 * Converts a grayscale height canvas into a true Tangent-Space RGB Normal Map
 * using Sobel finite differences with toroidal wrap-around so tiling stays seamless.
 */
function heightCanvasToNormalMap(
  heightCanvas: HTMLCanvasElement,
  key: string,
  strength: number,
  options: { repeatX?: number; repeatY?: number } = {}
): THREE.CanvasTexture {
  if (mapCache.has(key)) return mapCache.get(key)!;

  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, w, h).data;

  const nCanvas = document.createElement('canvas');
  nCanvas.width = w;
  nCanvas.height = h;
  const nCtx = nCanvas.getContext('2d')!;
  const dst = nCtx.createImageData(w, h);
  const dstData = dst.data;

  const sample = (x: number, y: number): number => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return srcData[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hL = sample(x - 1, y);
      const hR = sample(x + 1, y);
      const hU = sample(x, y - 1);
      const hD = sample(x, y + 1);

      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const invLen = 1 / Math.hypot(dx, dy, 1.0);

      const nx = dx * invLen;
      const ny = dy * invLen;
      const nz = invLen;

      const idx = (y * w + x) * 4;
      dstData[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dstData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dstData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dstData[idx + 3] = 255;
    }
  }

  nCtx.putImageData(dst, 0, 0);
  return finalizeMap(nCanvas, key, {
    srgb: false,
    repeatX: options.repeatX,
    repeatY: options.repeatY,
  });
}

// ============================================================================
// 1. PROCEDURAL PBR TEXTURE MAPS (NORMAL, WRINKLE ALBEDO, SKIN, LEATHER, CONCRETE)
// ============================================================================

function buildFabricHeightCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(101);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Horizontal waist/lumbar tension gathers & diagonal shoulder/armpit pulls
  for (let i = 0; i < 64; i++) {
    const x0 = rand() * size;
    const y0 = rand() * size;
    const len = 85 + rand() * 190;
    const isHorizPull = i % 3 === 0;
    const ang = isHorizPull
      ? (rand() - 0.5) * 0.28
      : (rand() > 0.5 ? 0.42 : -0.42) + (rand() - 0.5) * 0.35;
    const width = 4 + rand() * 11;

    const grad = ctx.createLinearGradient(
      x0,
      y0,
      x0 + Math.cos(ang + Math.PI / 2) * width,
      y0 + Math.sin(ang + Math.PI / 2) * width
    );
    grad.addColorStop(0, 'rgba(128,128,128,0)');
    grad.addColorStop(0.32, 'rgba(32,32,32,0.58)');
    grad.addColorStop(0.68, 'rgba(228,228,228,0.54)');
    grad.addColorStop(1, 'rgba(128,128,128,0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(
      x0 + Math.cos(ang) * len * 0.5 + (rand() - 0.5) * 16,
      y0 + Math.sin(ang) * len * 0.5 + (rand() - 0.5) * 16,
      x0 + Math.cos(ang) * len,
      y0 + Math.sin(ang) * len
    );
    ctx.stroke();
  }

  // Tight herringbone / twill cloth micro-weave
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let y = 0; y < size; y += 3) {
    ctx.fillRect(0, y, size, 1.2);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 0; x < size; x += 3) {
    ctx.fillRect(x, 0, 1.2, size);
  }

  return canvas;
}

export function getFabricBumpMap(): THREE.CanvasTexture {
  const key = 'pbr_fabric_bump_v3';
  if (mapCache.has(key)) return mapCache.get(key)!;
  return finalizeMap(buildFabricHeightCanvas(), key, { srgb: false, repeatX: 2, repeatY: 2 });
}

export function getFabricNormalMap(): THREE.CanvasTexture {
  const key = 'pbr_fabric_normal_v1';
  if (mapCache.has(key)) return mapCache.get(key)!;
  return heightCanvasToNormalMap(buildFabricHeightCanvas(), key, 2.8, { repeatX: 2, repeatY: 2 });
}

/** Subtle neutral multiply albedo map encoding fine textile grain & dark fold creases */
export function getFabricWrinkleAlbedoMap(): THREE.CanvasTexture {
  const key = 'pbr_fabric_albedo_ao_v1';
  if (mapCache.has(key)) return mapCache.get(key)!;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(111);

  ctx.fillStyle = '#efefef';
  ctx.fillRect(0, 0, size, size);

  // Subtle crease AO valleys so suit tension folds always read crisply under any lighting
  for (let i = 0; i < 48; i++) {
    const x0 = rand() * size;
    const y0 = rand() * size;
    const len = 85 + rand() * 180;
    const ang = (rand() > 0.5 ? 0.35 : -0.35) + (rand() - 0.5) * 0.45;
    const width = 4 + rand() * 10;

    ctx.strokeStyle = 'rgba(72, 68, 60, 0.16)';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(
      x0 + Math.cos(ang) * len * 0.5 + (rand() - 0.5) * 14,
      y0 + Math.sin(ang) * len * 0.5 + (rand() - 0.5) * 14,
      x0 + Math.cos(ang) * len,
      y0 + Math.sin(ang) * len
    );
    ctx.stroke();
  }

  // Fine cloth grain speckle
  for (let i = 0; i < 3600; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(rand() * size, rand() * size, 2, 2);
  }

  return finalizeMap(canvas, key, { srgb: true, repeatX: 2, repeatY: 2 });
}

export function getFabricRoughnessMap(): THREE.CanvasTexture {
  const key = 'pbr_fabric_rough_v2';
  if (mapCache.has(key)) return mapCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(202);

  ctx.fillStyle = '#d4d4d4';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 750; i++) {
    const shade = 175 + Math.floor(rand() * 72);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(rand() * size, rand() * size, 3 + rand() * 8, 2 + rand() * 5);
  }

  return finalizeMap(canvas, key, { srgb: false, repeatX: 2, repeatY: 2 });
}

function buildCapeHeightCanvas(): HTMLCanvasElement {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(303);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Diagonal cloth tension folds running from top-left shoulder toward bottom-right hem
  for (let i = 0; i < 34; i++) {
    const x = rand() * size;
    const w = 12 + rand() * 24;
    const tilt = 38 + rand() * 48;
    const grad = ctx.createLinearGradient(x - w, 0, x + w, 0);
    grad.addColorStop(0, 'rgba(128,128,128,0)');
    grad.addColorStop(0.35, 'rgba(42,42,42,0.48)');
    grad.addColorStop(0.65, 'rgba(222,222,222,0.44)');
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - w, 0);
    ctx.lineTo(x + w, 0);
    ctx.lineTo(x + w + tilt, size);
    ctx.lineTo(x - w + tilt, size);
    ctx.closePath();
    ctx.fill();
  }

  // Heavy woven cotton-linen cross-threads
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  for (let y = 0; y < size; y += 3) {
    ctx.fillRect(0, y, size, 1);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 0; x < size; x += 3) {
    ctx.fillRect(x, 0, 1, size);
  }

  return canvas;
}

export function getCapeClothBumpMap(): THREE.CanvasTexture {
  const key = 'pbr_cape_bump_v2';
  if (mapCache.has(key)) return mapCache.get(key)!;
  return finalizeMap(buildCapeHeightCanvas(), key, { srgb: false, repeatX: 2, repeatY: 2 });
}

export function getCapeNormalMap(): THREE.CanvasTexture {
  const key = 'pbr_cape_normal_v1';
  if (mapCache.has(key)) return mapCache.get(key)!;
  return heightCanvasToNormalMap(buildCapeHeightCanvas(), key, 2.6, { repeatX: 2, repeatY: 2 });
}

export function getSkinBumpMap(): THREE.CanvasTexture {
  const key = 'pbr_skin_bump_v2';
  if (mapCache.has(key)) return mapCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(404);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const v = rand() > 0.5 ? 162 : 96;
    ctx.fillStyle = `rgba(${v},${v},${v},0.36)`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  return finalizeMap(canvas, key, { srgb: false, repeatX: 3, repeatY: 3 });
}

export function getSkinNormalMap(): THREE.CanvasTexture {
  const key = 'pbr_skin_normal_v1';
  if (mapCache.has(key)) return mapCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(405);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 5200; i++) {
    const v = rand() > 0.5 ? 158 : 100;
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.fillRect(rand() * size, rand() * size, 1.5, 1.5);
  }

  return heightCanvasToNormalMap(canvas, key, 1.4, { repeatX: 3, repeatY: 3 });
}

function buildLeatherHeightCanvas(): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(505);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Natural pebbled hide grain
  for (let i = 0; i < 2800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1.0 + rand() * 2.2;
    const v = 96 + Math.floor(rand() * 90);
    ctx.fillStyle = `rgba(${v},${v},${v},0.52)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glove & boot bend creases
  for (let c = 0; c < 18; c++) {
    const y = rand() * size;
    ctx.strokeStyle = 'rgba(30,30,30,0.52)';
    ctx.lineWidth = 2 + rand() * 3.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(size * 0.5, y + (rand() - 0.5) * 16, size, y + (rand() - 0.5) * 10);
    ctx.stroke();
  }

  return canvas;
}

export function getLeatherBumpMap(): THREE.CanvasTexture {
  const key = 'pbr_leather_bump_v2';
  if (mapCache.has(key)) return mapCache.get(key)!;
  return finalizeMap(buildLeatherHeightCanvas(), key, { srgb: false, repeatX: 2, repeatY: 2 });
}

export function getLeatherNormalMap(): THREE.CanvasTexture {
  const key = 'pbr_leather_normal_v1';
  if (mapCache.has(key)) return mapCache.get(key)!;
  return heightCanvasToNormalMap(buildLeatherHeightCanvas(), key, 2.5, { repeatX: 2, repeatY: 2 });
}

function buildArmorHeightCanvas(): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(606);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 580; i++) {
    const v = rand() > 0.5 ? 156 : 104;
    ctx.fillStyle = `rgba(${v},${v},${v},0.28)`;
    ctx.fillRect(rand() * size, rand() * size, 24 + rand() * 68, 1);
  }
  ctx.strokeStyle = 'rgba(36,36,36,0.52)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  return canvas;
}

export function getArmorBumpMap(): THREE.CanvasTexture {
  const key = 'pbr_armor_bump_v2';
  if (mapCache.has(key)) return mapCache.get(key)!;
  return finalizeMap(buildArmorHeightCanvas(), key, { srgb: false, repeatX: 2, repeatY: 2 });
}

export function getArmorNormalMap(): THREE.CanvasTexture {
  const key = 'pbr_armor_normal_v1';
  if (mapCache.has(key)) return mapCache.get(key)!;
  return heightCanvasToNormalMap(buildArmorHeightCanvas(), key, 2.0, { repeatX: 2, repeatY: 2 });
}

export function getConcreteSlabMaps(baseHex: string): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const albedoKey = `concrete_slab_albedo_v2_${baseHex}`;
  const bumpKey = 'concrete_slab_bump_v2';
  const normalKey = 'concrete_slab_normal_v2';
  const roughKey = 'concrete_slab_rough_v2';

  let map = mapCache.get(albedoKey);
  let bumpMap = mapCache.get(bumpKey);
  let normalMap = mapCache.get(normalKey);
  let roughnessMap = mapCache.get(roughKey);

  if (map && bumpMap && normalMap && roughnessMap) {
    return { map, bumpMap, normalMap, roughnessMap };
  }

  const size = 1024;
  const rand = mulberry32(707);

  // Moody industrial dark-slate concrete blended gently with map theme (matches cinema asphalt/concrete slab tone)
  const themeCol = new THREE.Color(baseHex);
  const concreteTint = new THREE.Color('#5a5d62').lerp(themeCol, 0.28);

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;
  aCtx.fillStyle = `#${concreteTint.getHexString()}`;
  aCtx.fillRect(0, 0, size, size);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#848484';
  bCtx.fillRect(0, 0, size, size);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#dadada';
  rCtx.fillRect(0, 0, size, size);

  // Subtle weathered concrete splotches & damp oil/water patches
  for (let i = 0; i < 220; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 20 + rand() * 85;
    const dark = rand() > 0.42;
    const alpha = 0.035 + rand() * 0.065;
    aCtx.fillStyle = dark ? `rgba(12,14,18,${alpha})` : `rgba(215,218,224,${alpha * 0.7})`;
    aCtx.beginPath();
    aCtx.arc(x, y, r, 0, Math.PI * 2);
    aCtx.fill();

    rCtx.fillStyle = dark ? 'rgba(155,155,155,0.28)' : 'rgba(245,245,245,0.22)';
    rCtx.beginPath();
    rCtx.arc(x, y, r, 0, Math.PI * 2);
    rCtx.fill();
  }

  // Fine mineral gravel & poured concrete pitting
  for (let i = 0; i < 20000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 1 + rand() * 2.2;
    const isPit = rand() > 0.44;
    aCtx.fillStyle = isPit ? 'rgba(10,12,15,0.16)' : 'rgba(235,238,242,0.08)';
    aCtx.fillRect(x, y, s, s);
    bCtx.fillStyle = isPit ? 'rgba(50,50,50,0.42)' : 'rgba(182,182,182,0.32)';
    bCtx.fillRect(x, y, s, s);
  }

  // Crisp 2x2 concrete expansion slab grooves with recessed shadow & top chamfer highlight
  const drawSeam = (x1: number, y1: number, x2: number, y2: number, w: number) => {
    aCtx.strokeStyle = 'rgba(14,16,20,0.72)';
    aCtx.lineWidth = w;
    aCtx.beginPath();
    aCtx.moveTo(x1, y1);
    aCtx.lineTo(x2, y2);
    aCtx.stroke();

    aCtx.strokeStyle = 'rgba(235,240,248,0.13)';
    aCtx.lineWidth = 2;
    aCtx.beginPath();
    aCtx.moveTo(x1 + 2.5, y1 + 2.5);
    aCtx.lineTo(x2 + 2.5, y2 + 2.5);
    aCtx.stroke();

    bCtx.strokeStyle = 'rgba(12,12,12,0.92)';
    bCtx.lineWidth = w + 2;
    bCtx.beginPath();
    bCtx.moveTo(x1, y1);
    bCtx.lineTo(x2, y2);
    bCtx.stroke();
  };

  drawSeam(0, 2, size, 2, 6);
  drawSeam(0, size * 0.5, size, size * 0.5, 5);
  drawSeam(2, 0, 2, size, 6);
  drawSeam(size * 0.5, 0, size * 0.5, size, 5);

  // Realistic organic hairline concrete fracture cracks (finer & subtler than cartoon cracks)
  for (let c = 0; c < 18; c++) {
    let cx = rand() * size;
    let cy = rand() * size;
    let ang = rand() * Math.PI * 2;
    const steps = 12 + Math.floor(rand() * 16);
    aCtx.strokeStyle = 'rgba(16,18,22,0.48)';
    aCtx.lineWidth = 1.0 + rand() * 1.4;
    bCtx.strokeStyle = 'rgba(20,20,20,0.78)';
    bCtx.lineWidth = 2.0 + rand() * 1.8;

    aCtx.beginPath();
    bCtx.beginPath();
    aCtx.moveTo(cx, cy);
    bCtx.moveTo(cx, cy);
    for (let s = 0; s < steps; s++) {
      ang += (rand() - 0.5) * 0.9;
      cx += Math.cos(ang) * (8 + rand() * 14);
      cy += Math.sin(ang) * (8 + rand() * 14);
      aCtx.lineTo(cx, cy);
      bCtx.lineTo(cx, cy);
    }
    aCtx.stroke();
    bCtx.stroke();
  }

  map = finalizeMap(albedoCanvas, albedoKey, { srgb: true, repeatX: 16, repeatY: 16 });
  bumpMap = finalizeMap(bumpCanvas, bumpKey, { srgb: false, repeatX: 16, repeatY: 16 });
  normalMap = heightCanvasToNormalMap(bumpCanvas, normalKey, 2.2, { repeatX: 16, repeatY: 16 });
  roughnessMap = finalizeMap(roughCanvas, roughKey, { srgb: false, repeatX: 16, repeatY: 16 });
  return { map, bumpMap, normalMap, roughnessMap };
}

export function getConcreteWallMaps(baseHex: string): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const albedoKey = `concrete_wall_albedo_v2_${baseHex}`;
  const bumpKey = 'concrete_wall_bump_v2';
  const normalKey = 'concrete_wall_normal_v2';

  let map = mapCache.get(albedoKey);
  let bumpMap = mapCache.get(bumpKey);
  let normalMap = mapCache.get(normalKey);
  if (map && bumpMap && normalMap) return { map, bumpMap, normalMap };

  const w = 1024;
  const h = 512;
  const rand = mulberry32(808);
  // Dark moody architectural concrete wall
  const tint = new THREE.Color('#474b52').lerp(new THREE.Color(baseHex), 0.22);

  const aCanvas = document.createElement('canvas');
  aCanvas.width = w;
  aCanvas.height = h;
  const aCtx = aCanvas.getContext('2d')!;
  aCtx.fillStyle = `#${tint.getHexString()}`;
  aCtx.fillRect(0, 0, w, h);

  const bCanvas = document.createElement('canvas');
  bCanvas.width = w;
  bCanvas.height = h;
  const bCtx = bCanvas.getContext('2d')!;
  bCtx.fillStyle = '#848484';
  bCtx.fillRect(0, 0, w, h);

  // Vertical rainwater run-off streaks & poured concrete variation
  for (let i = 0; i < 140; i++) {
    const x = rand() * w;
    const sw = 10 + rand() * 54;
    const alpha = 0.03 + rand() * 0.065;
    aCtx.fillStyle = rand() > 0.45 ? `rgba(14,16,20,${alpha})` : `rgba(210,214,220,${alpha * 0.55})`;
    aCtx.fillRect(x, 0, sw, h);
  }

  for (let i = 0; i < 9000; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const s = 1 + rand() * 2.2;
    aCtx.fillStyle = rand() > 0.45 ? 'rgba(12,14,18,0.14)' : 'rgba(230,234,240,0.06)';
    aCtx.fillRect(x, y, s, s);
    bCtx.fillStyle = rand() > 0.45 ? 'rgba(56,56,56,0.34)' : 'rgba(176,176,176,0.28)';
    bCtx.fillRect(x, y, s, s);
  }

  // Broad architectural concrete panel expansion joints (clean & non-distracting)
  const panelCount = 2;
  const panelW = w / panelCount;
  for (let p = 0; p < panelCount; p++) {
    const px = p * panelW;
    aCtx.strokeStyle = 'rgba(12,14,18,0.68)';
    aCtx.lineWidth = 4;
    aCtx.beginPath();
    aCtx.moveTo(px, 0);
    aCtx.lineTo(px, h);
    aCtx.stroke();

    aCtx.strokeStyle = 'rgba(220,225,232,0.09)';
    aCtx.lineWidth = 2;
    aCtx.beginPath();
    aCtx.moveTo(px + 3, 0);
    aCtx.lineTo(px + 3, h);
    aCtx.stroke();

    bCtx.strokeStyle = 'rgba(16,16,16,0.88)';
    bCtx.lineWidth = 5;
    bCtx.beginPath();
    bCtx.moveTo(px, 0);
    bCtx.lineTo(px, h);
    bCtx.stroke();

    // Subtle recessed formwork tie holes
    [0.25, 0.75].forEach(rx => {
      [0.32, 0.7].forEach(ry => {
        const hx = px + panelW * rx;
        const hy = h * ry;
        aCtx.fillStyle = 'rgba(14,16,20,0.45)';
        aCtx.beginPath();
        aCtx.arc(hx, hy, 4, 0, Math.PI * 2);
        aCtx.fill();
        bCtx.fillStyle = 'rgba(22,22,22,0.75)';
        bCtx.beginPath();
        bCtx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        bCtx.fill();
      });
    });
  }

  // Subtle horizontal concrete pour lift seam
  aCtx.strokeStyle = 'rgba(14,16,20,0.28)';
  aCtx.lineWidth = 2;
  aCtx.beginPath();
  aCtx.moveTo(0, h * 0.52);
  aCtx.lineTo(w, h * 0.52);
  aCtx.stroke();

  // Bottom splash grime & AO wall-to-floor seam shadow
  const grimeGrad = aCtx.createLinearGradient(0, h * 0.65, 0, h);
  grimeGrad.addColorStop(0, 'rgba(12,14,18,0)');
  grimeGrad.addColorStop(1, 'rgba(12,14,18,0.48)');
  aCtx.fillStyle = grimeGrad;
  aCtx.fillRect(0, h * 0.65, w, h * 0.35);

  map = finalizeMap(aCanvas, albedoKey, { srgb: true });
  bumpMap = finalizeMap(bCanvas, bumpKey, { srgb: false });
  normalMap = heightCanvasToNormalMap(bCanvas, normalKey, 2.0);
  return { map, bumpMap, normalMap };
}

export function getRockBumpMap(): THREE.CanvasTexture {
  const key = 'pbr_rock_bump_v2';
  if (mapCache.has(key)) return mapCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(909);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1500; i++) {
    const shade = 38 + Math.floor(rand() * 175);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},0.48)`;
    ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 8, 2 + rand() * 8);
  }

  return finalizeMap(canvas, key, { srgb: false });
}

export function getRockNormalMap(): THREE.CanvasTexture {
  const key = 'pbr_rock_normal_v1';
  if (mapCache.has(key)) return mapCache.get(key)!;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(910);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1600; i++) {
    const shade = 40 + Math.floor(rand() * 170);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},0.5)`;
    ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 7, 2 + rand() * 7);
  }
  return heightCanvasToNormalMap(canvas, key, 2.6);
}

// ============================================================================
// 2. PBR MATERIAL FACTORIES
// ============================================================================

export interface MaterialOptions {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture | null;
  roughness?: number;
  metalness?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  side?: THREE.Side;
  transparent?: boolean;
  opacity?: number;
  vertexColors?: boolean;
}

export function makeFabricMaterial(opts: MaterialOptions): THREE.MeshPhysicalMaterial {
  const col = new THREE.Color(opts.color ?? '#ffffff');
  const sheenCol = col.clone().lerp(new THREE.Color('#ffffff'), 0.22);
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? '#ffffff',
    map: opts.map ?? getFabricWrinkleAlbedoMap(),
    normalMap: getFabricNormalMap(),
    normalScale: new THREE.Vector2(1.25, 1.25),
    bumpMap: getFabricBumpMap(),
    bumpScale: 0.024,
    roughnessMap: getFabricRoughnessMap(),
    roughness: opts.roughness ?? 0.82,
    metalness: opts.metalness ?? 0.03,
    sheen: 0.36,
    sheenRoughness: 0.78,
    sheenColor: sheenCol,
    envMapIntensity: 0.32,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    vertexColors: opts.vertexColors ?? false,
  });
}

export function makeCapeMaterial(opts: MaterialOptions): THREE.MeshPhysicalMaterial {
  const col = new THREE.Color(opts.color ?? '#eae8e1');
  const sheenCol = col.clone().lerp(new THREE.Color('#ffffff'), 0.28);
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? '#eae8e1',
    map: opts.map ?? null,
    normalMap: getCapeNormalMap(),
    normalScale: new THREE.Vector2(1.3, 1.3),
    bumpMap: getCapeClothBumpMap(),
    bumpScale: 0.03,
    roughnessMap: getFabricRoughnessMap(),
    roughness: opts.roughness ?? 0.88,
    metalness: opts.metalness ?? 0.02,
    sheen: 0.42,
    sheenRoughness: 0.74,
    sheenColor: sheenCol,
    envMapIntensity: 0.28,
    side: THREE.DoubleSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    vertexColors: opts.vertexColors ?? false,
  });
}

export function makeSkinMaterial(opts: MaterialOptions): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? '#d9a17f',
    map: opts.map ?? null,
    normalMap: getSkinNormalMap(),
    normalScale: new THREE.Vector2(0.45, 0.45),
    bumpMap: getSkinBumpMap(),
    bumpScale: 0.006,
    roughness: opts.roughness ?? 0.48,
    metalness: 0.01,
    clearcoat: 0.08,
    clearcoatRoughness: 0.58,
    sheen: 0.14,
    sheenColor: new THREE.Color('#d97757'),
    sheenRoughness: 0.82,
    envMapIntensity: 0.3,
  });
}

export function makeLeatherMaterial(opts: MaterialOptions): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: opts.color ?? '#541616',
    map: opts.map ?? null,
    normalMap: getLeatherNormalMap(),
    normalScale: new THREE.Vector2(1.15, 1.15),
    bumpMap: getLeatherBumpMap(),
    bumpScale: 0.022,
    roughness: opts.roughness ?? 0.38,
    metalness: opts.metalness ?? 0.14,
    envMapIntensity: 0.45,
  });
}

export function makeArmorMaterial(opts: MaterialOptions): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? '#334155',
    map: opts.map ?? null,
    normalMap: getArmorNormalMap(),
    normalScale: new THREE.Vector2(0.85, 0.85),
    bumpMap: getArmorBumpMap(),
    bumpScale: 0.014,
    roughness: opts.roughness ?? 0.24,
    metalness: opts.metalness ?? 0.84,
    clearcoat: 0.38,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.65,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

// ============================================================================
// 3. CACHED SCULPTED ANATOMICAL GEOMETRIES
// ============================================================================

/**
 * Muscular athletic torso + pelvis unified silhouette (v-tapered lats, chest pecs,
 * sculpted spinal furrow along rear, narrow athletic waist with fabric tension folds,
 * and anatomical hip/glute curve).
 * Local Y bounds: [-0.32, +0.32] (total height 0.64m, centered around y ~ 1.18 in character coords)
 */
export function getAnatomicalTorsoGeo(): THREE.BufferGeometry {
  const key = 'geo_anatomical_torso_v3';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const radialSegs = 36;
  const heightSegs = 28;
  const height = 0.64;
  const geo = new THREE.CylinderGeometry(0.18, 0.16, height, radialSegs, heightSegs, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = THREE.MathUtils.clamp((y + height * 0.5) / height, 0, 1); // 0 = pelvis bottom, 1 = shoulder/collar top
    const angle = Math.atan2(x, z); // 0 = front (+Z), PI/-PI = rear (-Z), +/-PI/2 = sides
    const r = Math.hypot(x, z);
    if (r < 0.001) continue;

    // Anatomical width (X) & depth (Z) profile along spine
    let scaleX = 1.0;
    let scaleZ = 0.68;

    if (t < 0.24) {
      // Pelvis / glute fullness
      const p = t / 0.24;
      scaleX = 0.98 + 0.08 * Math.sin(p * Math.PI);
      scaleZ = 0.68 + 0.09 * Math.sin(p * Math.PI);
    } else if (t < 0.44) {
      // Athletic waist taper at belt line (t ~ 0.30)
      const p = (t - 0.24) / 0.2;
      scaleX = 0.96 - 0.09 * Math.sin(p * Math.PI);
      scaleZ = 0.64 - 0.05 * Math.sin(p * Math.PI);
    } else if (t < 0.87) {
      // Ribcage + broad V-taper lats
      const p = (t - 0.44) / 0.43;
      scaleX = 0.96 + 0.36 * Math.sin(p * Math.PI * 0.72);
      scaleZ = 0.68 + 0.15 * Math.sin(p * Math.PI * 0.8);
    } else {
      // Trapezius slope into neck collar
      const p = (t - 0.87) / 0.13;
      scaleX = 1.25 - 0.45 * p;
      scaleZ = 0.79 - 0.24 * p;
    }

    // Chest pectoral fullness (+Z front)
    const frontFactor = Math.max(0, Math.cos(angle));
    const chestBulge =
      frontFactor > 0.2 && t > 0.52 && t < 0.86
        ? Math.sin(((t - 0.52) / 0.34) * Math.PI) * 0.03 * frontFactor
        : 0;

    // Scapulae & dorsal spinal groove (-Z back)
    const backFactor = Math.max(0, -Math.cos(angle));
    const spineGroove =
      backFactor > 0.45 && t > 0.14 && t < 0.88
        ? -Math.exp(-Math.pow(Math.sin(angle) * 4.6, 2)) * 0.025 * backFactor
        : 0;
    const latSwell =
      backFactor > 0.2 && t > 0.48 && t < 0.86
        ? Math.pow(Math.sin(angle), 2) * 0.024 * backFactor * Math.sin(((t - 0.48) / 0.38) * Math.PI)
        : 0;

    // Pronounced gluteal fullness & clean vertical center crease below belt
    const gluteBulge =
      backFactor > 0.25 && t > 0.02 && t < 0.26
        ? Math.sin(((t - 0.02) / 0.24) * Math.PI) *
          (0.038 * Math.abs(Math.sin(angle)) - 0.018 * Math.exp(-Math.pow(Math.sin(angle) * 5.2, 2))) *
          backFactor
        : 0;

    // Subtle fabric bunching folds radiating above waist belt & across lumbar curve
    const waistFabricRipple =
      t > 0.28 && t < 0.56
        ? Math.sin(t * 58 + Math.abs(Math.sin(angle)) * 3.2) *
          0.0048 *
          Math.sin(((t - 0.28) / 0.28) * Math.PI)
        : 0;

    const radialFactor =
      1.0 + (chestBulge + spineGroove + latSwell + gluteBulge + waistFabricRipple) / Math.max(0.08, r);
    pos.setX(i, x * scaleX * radialFactor);
    pos.setZ(i, z * scaleZ * radialFactor);
  }

  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

/** Sculpted pelvis / hip seat block for legacy replacement */
export function getAnatomicalPelvisGeo(): THREE.BufferGeometry {
  const key = 'geo_anatomical_pelvis_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const geo = new THREE.CylinderGeometry(0.175, 0.165, 0.22, 24, 10);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const angle = Math.atan2(x, z);
    const back = Math.max(0, -Math.cos(angle));
    const seam = back * Math.exp(-Math.pow(Math.sin(angle) * 5.0, 2)) * 0.02;
    const glute = back * Math.pow(Math.sin(angle), 2) * 0.028 * (1 - Math.abs(y / 0.11));
    pos.setX(i, x * 1.05);
    pos.setZ(i, z * 0.72 + (z < 0 ? -glute + seam : 0));
  }
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

/** Anatomical sternocleidomastoid tapered neck with subtle nape concavity */
export function getAnatomicalNeckGeo(): THREE.BufferGeometry {
  const key = 'geo_anatomical_neck_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const pts = [
    new THREE.Vector2(0.095, -0.085),
    new THREE.Vector2(0.075, -0.025),
    new THREE.Vector2(0.066, 0.03),
    new THREE.Vector2(0.069, 0.085),
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.scale(1.02, 1.0, 0.94);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

/**
 * Sculpted anatomical cranium + jawline (preserves spherical UVs so +Z maps face cleanly
 * when head mesh uses `rotation.y = -Math.PI / 2`).
 */
export function getAnatomicalHeadGeo(): THREE.BufferGeometry {
  const key = 'geo_anatomical_head_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const geo = new THREE.SphereGeometry(0.155, 32, 24);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    y *= 1.14;
    const ny = y / (0.155 * 1.14); // -1 chin .. +1 crown

    if (ny < -0.08) {
      // Taper lower jaw & chin cleanly
      const jawT = Math.min(1, (-ny - 0.08) / 0.92);
      const narrow = 1 - jawT * 0.26;
      z *= narrow;
      x *= 1 - jawT * 0.15;
    } else if (ny > 0.16) {
      // Upper parietal / occipital rounding
      x *= 0.97;
      z *= 0.92;
    } else {
      // Cheek / temple zygomatic contour
      z *= 0.9;
    }

    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

export function getMuscularThighGeo(): THREE.BufferGeometry {
  const key = 'geo_muscular_thigh_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const pts = [
    new THREE.Vector2(0.062, -0.22), // knee top
    new THREE.Vector2(0.074, -0.14),
    new THREE.Vector2(0.090, -0.02), // quad/hamstring swell
    new THREE.Vector2(0.096, 0.10), // upper thigh
    new THREE.Vector2(0.088, 0.22), // hip socket
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.scale(0.95, 1.0, 1.06);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

export function getMuscularCalfGeo(): THREE.BufferGeometry {
  const key = 'geo_muscular_calf_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const pts = [
    new THREE.Vector2(0.047, -0.20), // ankle
    new THREE.Vector2(0.058, -0.08),
    new THREE.Vector2(0.075, 0.04), // gastrocnemius calf belly
    new THREE.Vector2(0.072, 0.12),
    new THREE.Vector2(0.063, 0.20), // knee joint
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

export function getMuscularUpperArmGeo(): THREE.BufferGeometry {
  const key = 'geo_muscular_upperarm_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const pts = [
    new THREE.Vector2(0.051, -0.16), // elbow
    new THREE.Vector2(0.064, -0.05),
    new THREE.Vector2(0.070, 0.04), // bicep/tricep swell
    new THREE.Vector2(0.076, 0.12), // deltoid flare
    new THREE.Vector2(0.062, 0.16), // shoulder cap
  ];
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

export function getMuscularForearmGeo(): THREE.BufferGeometry {
  const key = 'geo_muscular_forearm_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const pts = [
    new THREE.Vector2(0.041, -0.14), // wrist
    new THREE.Vector2(0.049, -0.04),
    new THREE.Vector2(0.060, 0.06), // brachioradialis bulge
    new THREE.Vector2(0.053, 0.14), // elbow
  ];
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

/** Full-length sculpted leg (ankle -> gastrocnemius calf -> knee -> quad thigh -> hip) */
export function getFullMuscularLegGeo(): THREE.BufferGeometry {
  const key = 'geo_full_muscular_leg_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const pts = [
    new THREE.Vector2(0.047, -0.42),
    new THREE.Vector2(0.056, -0.28),
    new THREE.Vector2(0.073, -0.15),
    new THREE.Vector2(0.062, -0.01),
    new THREE.Vector2(0.080, 0.14),
    new THREE.Vector2(0.094, 0.28),
    new THREE.Vector2(0.088, 0.42),
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.scale(0.95, 1.0, 1.05);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

/** Full-length sculpted arm (wrist -> forearm -> elbow -> bicep -> deltoid) */
export function getFullMuscularArmGeo(): THREE.BufferGeometry {
  const key = 'geo_full_muscular_arm_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const pts = [
    new THREE.Vector2(0.042, -0.21),
    new THREE.Vector2(0.053, -0.11),
    new THREE.Vector2(0.049, -0.01),
    new THREE.Vector2(0.066, 0.09),
    new THREE.Vector2(0.075, 0.17),
    new THREE.Vector2(0.056, 0.21),
  ];
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

export function getBootVampGeo(): THREE.BufferGeometry {
  const key = 'geo_sculpted_boot_vamp_v2';
  if (geoCache.has(key)) return geoCache.get(key)!;

  const geo = new THREE.SphereGeometry(0.062, 16, 12);
  geo.scale(0.95, 0.72, 1.95);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < -0.015) {
      pos.setY(i, -0.015);
    }
  }
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

// ============================================================================
// 4. ASYMMETRIC & SYMMETRIC PLEATED SHOULDER-DRAPED CAPE WITH VERTEX-COLOR AO
// ============================================================================

export interface CapeOptions {
  asymmetric?: boolean; // default true for iconic shoulder-draped sweep revealing muscular back
  width?: number;
  length?: number;
  shoulderColor?: THREE.ColorRepresentation;
  claspMat?: THREE.Material;
  addCollarMantle?: boolean;
}

/**
 * Helper to sculpt any cape PlaneGeometry with deep accordion pleats & smooth
 * ambient-occlusion vertex colors (deep slate shadow in valleys, warm linen on ridges).
 */
function sculptPleatedCapeGeometry(
  width: number,
  length: number,
  asymmetric: boolean,
  segX: number,
  segY: number
): THREE.PlaneGeometry {
  const capeGeo = new THREE.PlaneGeometry(width, length, segX, segY);
  const pos = capeGeo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const origX = pos.getX(i);
    const origY = pos.getY(i);
    const u = THREE.MathUtils.clamp(origX / width + 0.5, 0, 1); // 0 .. 1
    const v = THREE.MathUtils.clamp(origY / length + 0.5, 0, 1); // 0 .. 1
    const hang = THREE.MathUtils.clamp(1 - v, 0, 1); // 0 top collar -> 1 bottom hem

    let newX = origX;
    let newY = origY;
    let newZ = -0.02;
    let ao = 0.92;

    if (asymmetric) {
      // Narrow gather across top shoulders, then sweeps diagonally backward & outward to screen-right (local -X)
      const topWidthFactor = 0.42 + hang * 0.92;
      const diagShift = -0.36 * Math.pow(hang, 1.08);
      newX = origX * topWidthFactor + diagShift;

      // Natural parabolic draped hem curve higher on outer billowing right tip
      newY += Math.sin(u * Math.PI) * 0.04 * hang + (1 - u) * 0.14 * hang;

      // Wrap collar gently forward over left shoulder (+X) & stand naturally clear of back/calves
      const shoulderWrap = (1 - hang) * 0.08 * Math.pow(Math.max(0, Math.abs(u - 0.5) * 2), 1.45);
      const backStandOff = -0.095 * Math.pow(hang, 0.88) - 0.09 * Math.sin(hang * Math.PI * 0.72);

      // 4.5 deep sculptural sharp-ridged accordion pleats fanning along cloth drape vector
      const pleatPhase = u * Math.PI * 5.0 + hang * 0.85;
      const rawSin = Math.sin(pleatPhase);
      // Slight crest sharpening for heavyweight cotton fold look
      const shapedPleat = Math.sign(rawSin) * Math.pow(Math.abs(rawSin), 0.82);
      const pleatAmp = 0.018 + 0.058 * Math.pow(hang, 0.78);
      const pleatDepth = pleatAmp * shapedPleat;
      const secondaryFold = 0.016 * hang * Math.cos(u * Math.PI * 10.5 - hang * 1.4);

      newZ = shoulderWrap + backStandOff + pleatDepth + secondaryFold;

      // Baked crease AO: troughs (shapedPleat < 0) shade cooler charcoal gray, crests stay bright
      const foldShadow = 0.78 + 0.22 * shapedPleat;
      const shoulderCowlShade = 0.84 + 0.16 * hang;
      ao = THREE.MathUtils.clamp(foldShadow * shoulderCowlShade, 0.52, 1.0);
    } else {
      // Symmetrical heavy cloak with sculpted longitudinal folds
      const widthSpread = 0.54 + hang * 0.68;
      newX = origX * widthSpread;
      newY += Math.sin(u * Math.PI) * 0.03 * hang;
      const rawSin = Math.sin(u * Math.PI * 6.0);
      const shaped = Math.sign(rawSin) * Math.pow(Math.abs(rawSin), 0.84);
      const pleat = (0.016 + 0.05 * hang) * shaped;
      newZ = -0.065 * hang + pleat - 0.03;
      ao = THREE.MathUtils.clamp(0.8 + 0.2 * shaped, 0.56, 1.0);
    }

    pos.setXYZ(i, newX, newY, newZ);

    // Slightly cool ambient tint inside shadowed fold troughs for hyper-real cinema contrast
    const troughCool = (1 - ao) * 0.08;
    colors[i * 3] = Math.max(0.45, ao - troughCool);
    colors[i * 3 + 1] = Math.max(0.47, ao - troughCool * 0.4);
    colors[i * 3 + 2] = Math.max(0.50, ao);
  }

  capeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  capeGeo.computeVertexNormals();
  capeGeo.computeBoundingBox();
  capeGeo.computeBoundingSphere();
  return capeGeo;
}

/** Ensure any cape material cleanly enables vertexColors for crease AO without affecting non-cape clones */
function enableVertexColorCapeMaterial(mat: THREE.Material): THREE.Material {
  if (mat instanceof THREE.MeshStandardMaterial) {
    const cloned = mat.clone();
    cloned.vertexColors = true;
    cloned.side = THREE.DoubleSide;
    cloned.roughness = Math.max(0.84, cloned.roughness);
    cloned.envMapIntensity = 0.28;
    cloned.needsUpdate = true;
    return cloned;
  }
  return mat;
}

/**
 * Builds a high-segment, naturally folded shoulder-draped cape mesh (plus folded diagonal shoulder shawl
 * cowl) and registers `userData.capeMesh` + `userData.capeBasePos` on `targetGroup`.
 */
export function attachRealisticCape(
  targetGroup: THREE.Group,
  capeMat: THREE.Material,
  opts: CapeOptions = {}
): THREE.Mesh {
  const asymmetric = opts.asymmetric ?? true;
  const width = opts.width ?? 0.78;
  const length = opts.length ?? 1.14;

  // Sculpted upper-shoulder collar cowl & diagonal shawl gather wrapping traps & neck base
  if (opts.addCollarMantle !== false) {
    const collarGeo = new THREE.TorusGeometry(0.162, 0.042, 14, 28, Math.PI * 1.55);
    const collar = new THREE.Mesh(collarGeo, capeMat);
    collar.position.set(0, 1.465, -0.015);
    collar.rotation.x = Math.PI / 2 + 0.18;
    collar.rotation.z = Math.PI * 0.72;
    collar.castShadow = true;
    collar.receiveShadow = true;
    targetGroup.add(collar);

    if (asymmetric) {
      // Diagonal draped fold crossing upper back from screen-left shoulder toward screen-right scapulae
      const shawlGeo = new THREE.TorusGeometry(0.185, 0.036, 10, 24, Math.PI * 0.92);
      const shawl = new THREE.Mesh(shawlGeo, capeMat);
      shawl.position.set(-0.04, 1.40, -0.105);
      shawl.rotation.set(Math.PI * 0.42, 0.32, Math.PI * 0.16);
      shawl.scale.set(1.18, 0.85, 1.0);
      shawl.castShadow = true;
      shawl.receiveShadow = true;
      targetGroup.add(shawl);
    }
  }

  const capeGeo = sculptPleatedCapeGeometry(width, length, asymmetric, 28, 28);
  const vcMat = enableVertexColorCapeMaterial(capeMat);

  const cape = new THREE.Mesh(capeGeo, vcMat);
  cape.position.set(0, 0.96, -0.13);
  cape.castShadow = true;
  cape.receiveShadow = true;
  targetGroup.userData.capeMesh = cape;
  targetGroup.userData.capeBasePos = new Float32Array(capeGeo.attributes.position.array as Float32Array);
  targetGroup.add(cape);

  return cape;
}

// ============================================================================
// 5. SCULPTED BOOT & GAUNTLET GLOVE HELPERS
// ============================================================================

export function createSculptedBootGroup(
  bootMat: THREE.Material,
  soleMat?: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const darkSole =
    soleMat ||
    makeLeatherMaterial({
      color: '#111827',
      roughness: 0.75,
      metalness: 0.05,
    });

  // Rolled top cuff & shin collar
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.064, 0.10, 16), bootMat);
  cuff.position.set(0, 0.25, 0);
  cuff.castShadow = true;
  cuff.receiveShadow = true;
  g.add(cuff);

  const cuffLip = new THREE.Mesh(new THREE.TorusGeometry(0.069, 0.013, 8, 18), bootMat);
  cuffLip.rotation.x = Math.PI / 2;
  cuffLip.position.set(0, 0.295, 0);
  g.add(cuffLip);

  // Lower ankle shaft with subtle leather ankle crease ring
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.063, 0.056, 0.16, 16), bootMat);
  shaft.position.set(0, 0.14, 0);
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Sculpted foot vamp & rounded toe cap
  const vamp = new THREE.Mesh(getBootVampGeo(), bootMat);
  vamp.position.set(0, 0.048, 0.045);
  vamp.castShadow = true;
  vamp.receiveShadow = true;
  g.add(vamp);

  // Heavy treaded rubber outsole
  const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.069, 0.026, 16), darkSole);
  sole.scale.set(0.92, 1.0, 1.95);
  sole.position.set(0, 0.014, 0.045);
  sole.castShadow = true;
  g.add(sole);

  return g;
}

export function createSculptedGloveGroup(
  gloveMat: THREE.Material,
  cuffColor?: THREE.ColorRepresentation
): THREE.Group {
  const g = new THREE.Group();
  const rimMat = cuffColor ? makeLeatherMaterial({ color: cuffColor, roughness: 0.36 }) : gloveMat;

  // Tapered forearm gauntlet sleeve with subtle wrist-crease rings
  const gauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.049, 0.23, 16), gloveMat);
  gauntlet.position.set(0, 0.065, 0);
  gauntlet.castShadow = true;
  gauntlet.receiveShadow = true;
  g.add(gauntlet);

  const wristCrease = new THREE.Mesh(new THREE.TorusGeometry(0.051, 0.009, 6, 16), gloveMat);
  wristCrease.rotation.x = Math.PI / 2;
  wristCrease.position.set(0, -0.02, 0);
  g.add(wristCrease);

  // Folded wide gauntlet cuff lip
  const cuffRing = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.015, 8, 18), rimMat);
  cuffRing.rotation.x = Math.PI / 2;
  cuffRing.position.set(0, 0.17, 0);
  g.add(cuffRing);

  // Sculpted clenched fist (palm + finger curl + knuckle bar + thumb)
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 12), gloveMat);
  palm.scale.set(0.96, 1.08, 1.08);
  palm.position.set(0, -0.075, 0.012);
  palm.castShadow = true;
  g.add(palm);

  const knuckles = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.046, 4, 8), gloveMat);
  knuckles.rotation.z = Math.PI / 2;
  knuckles.position.set(0, -0.095, 0.042);
  g.add(knuckles);

  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.032, 4, 8), gloveMat);
  thumb.position.set(0.042, -0.072, 0.034);
  thumb.rotation.z = -0.45;
  g.add(thumb);

  return g;
}

// ============================================================================
// 6. FULL SCULPTED HUMANOID BODY BUILDER (ARTICULATED FOR STRIDE ANIMATION)
// ============================================================================

export interface HumanBodyConfig {
  suitMat: THREE.Material;
  pantsMat?: THREE.Material;
  gloveMat: THREE.Material;
  bootMat?: THREE.Material;
  skinMat: THREE.Material;
  headMat: THREE.Material;
  beltMat?: THREE.Material;
  buckleMat?: THREE.Material;
  shoulderScale?: number;
  armPose?: 'combat' | 'heroic_idle';
  includeBootHeight?: boolean;
  addEarsAndNose?: boolean;
  rotateHeadFaceForward?: boolean;
}

export interface RealisticBodyParts {
  torso: THREE.Mesh;
  neck: THREE.Mesh;
  head: THREE.Mesh;
  headGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  beltGroup: THREE.Group;
}

export function buildRealisticHumanoidBody(
  targetGroup: THREE.Group,
  cfg: HumanBodyConfig
): RealisticBodyParts {
  targetGroup.userData.isRealisticBody = true;
  const pantsMat = cfg.pantsMat ?? cfg.suitMat;
  const bootMat = cfg.bootMat ?? cfg.gloveMat;
  const sScale = cfg.shoulderScale ?? 1.0;

  // 1. Unified Sculpted Muscular Torso + Pelvis
  const torso = new THREE.Mesh(getAnatomicalTorsoGeo(), cfg.suitMat);
  torso.position.set(0, 1.18, 0);
  torso.scale.set(sScale, 1.0, sScale);
  torso.castShadow = true;
  torso.receiveShadow = true;
  targetGroup.add(torso);
  targetGroup.userData.torsoMesh = torso;

  if (pantsMat !== cfg.suitMat) {
    const hipCover = new THREE.Mesh(getAnatomicalPelvisGeo(), pantsMat);
    hipCover.position.set(0, 0.94, 0);
    hipCover.scale.set(1.03 * sScale, 1.0, 1.04 * sScale);
    hipCover.castShadow = true;
    hipCover.receiveShadow = true;
    targetGroup.add(hipCover);
  }

  // 2. Sculpted Waist Belt + Buckle
  const beltGroup = new THREE.Group();
  beltGroup.position.set(0, 1.01, 0);
  if (cfg.beltMat) {
    const beltStrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.184 * sScale, 0.19 * sScale, 0.068, 24),
      cfg.beltMat
    );
    beltStrap.scale.set(1.0, 1.0, 0.72);
    beltStrap.castShadow = true;
    beltStrap.receiveShadow = true;
    beltGroup.add(beltStrap);

    if (cfg.buckleMat) {
      const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.026, 20), cfg.buckleMat);
      buckle.rotation.x = Math.PI / 2;
      buckle.position.set(0, 0, 0.138 * sScale);
      beltGroup.add(buckle);
    }
  }
  targetGroup.add(beltGroup);

  // 3. Articulated Legs (Hip Pivot at y = 0.90)
  const buildLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.105 * sScale, 0.90, 0);

    const thigh = new THREE.Mesh(getMuscularThighGeo(), pantsMat);
    thigh.position.set(0, -0.22, 0);
    thigh.castShadow = true;
    thigh.receiveShadow = true;
    legPivot.add(thigh);

    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.064, 12, 10), pantsMat);
    kneeCap.position.set(0, -0.44, 0.008);
    kneeCap.castShadow = true;
    legPivot.add(kneeCap);

    const calf = new THREE.Mesh(getMuscularCalfGeo(), pantsMat);
    calf.position.set(0, -0.64, 0);
    calf.castShadow = true;
    calf.receiveShadow = true;
    legPivot.add(calf);

    const boot = createSculptedBootGroup(bootMat);
    boot.position.set(0, -0.90, 0);
    legPivot.add(boot);

    targetGroup.add(legPivot);
    return legPivot;
  };

  const rightLegGroup = buildLeg(-1);
  const leftLegGroup = buildLeg(1);
  targetGroup.userData.leftLegGroup = leftLegGroup;
  targetGroup.userData.rightLegGroup = rightLegGroup;

  // 4. Articulated Arms (Shoulder Pivot at y = 1.42)
  const buildArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.238 * sScale, 1.42, 0);

    const deltoidCap = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), cfg.suitMat);
    deltoidCap.scale.set(1.02, 1.06, 0.96);
    deltoidCap.castShadow = true;
    deltoidCap.receiveShadow = true;
    armPivot.add(deltoidCap);

    const upperArm = new THREE.Mesh(getMuscularUpperArmGeo(), cfg.suitMat);
    upperArm.position.set(side * 0.015, -0.15, 0.01);
    upperArm.castShadow = true;
    upperArm.receiveShadow = true;
    armPivot.add(upperArm);

    const elbowCap = new THREE.Mesh(new THREE.SphereGeometry(0.054, 12, 10), cfg.suitMat);
    elbowCap.position.set(side * 0.02, -0.31, 0.02);
    armPivot.add(elbowCap);

    const forearmPivot = new THREE.Group();
    forearmPivot.position.set(side * 0.02, -0.31, 0.02);
    forearmPivot.rotation.x = cfg.armPose === 'heroic_idle' ? -0.24 : -0.78;
    forearmPivot.rotation.z = side * -0.05;

    const forearm = new THREE.Mesh(getMuscularForearmGeo(), cfg.suitMat);
    forearm.position.set(0, -0.12, 0);
    forearm.castShadow = true;
    forearm.receiveShadow = true;
    forearmPivot.add(forearm);

    const glove = createSculptedGloveGroup(cfg.gloveMat);
    glove.position.set(0, -0.22, 0);
    forearmPivot.add(glove);

    armPivot.add(forearmPivot);

    armPivot.rotation.z = side * 0.13;
    armPivot.rotation.x = cfg.armPose === 'heroic_idle' ? -0.04 : -0.15;

    targetGroup.add(armPivot);
    return armPivot;
  };

  const rightArmGroup = buildArm(-1);
  const leftArmGroup = buildArm(1);
  targetGroup.userData.leftArmGroup = leftArmGroup;
  targetGroup.userData.rightArmGroup = rightArmGroup;

  // 5. Anatomical Neck, Sculpted Cranium, 2-Part Ears & Nose
  const neck = new THREE.Mesh(getAnatomicalNeckGeo(), cfg.skinMat);
  neck.position.set(0, 1.535, 0);
  neck.castShadow = true;
  neck.receiveShadow = true;
  targetGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.69, 0.01);
  targetGroup.add(headGroup);

  const head = new THREE.Mesh(getAnatomicalHeadGeo(), cfg.headMat);
  if (cfg.rotateHeadFaceForward !== false) {
    head.rotation.y = -Math.PI / 2;
  }
  head.castShadow = true;
  head.receiveShadow = true;
  headGroup.add(head);

  if (cfg.addEarsAndNose !== false) {
    const innerEarMat =
      cfg.skinMat instanceof THREE.MeshStandardMaterial
        ? (() => {
            const m = cfg.skinMat.clone();
            m.color = m.color.clone().multiplyScalar(0.72);
            return m;
          })()
        : cfg.skinMat;

    [-1, 1].forEach(side => {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.144, -0.016, -0.012);
      earGroup.rotation.z = side * -0.14;
      earGroup.rotation.y = side * 0.18;

      const outerEar = new THREE.Mesh(new THREE.SphereGeometry(0.031, 12, 10), cfg.skinMat);
      outerEar.scale.set(0.38, 1.18, 0.72);
      outerEar.castShadow = true;
      earGroup.add(outerEar);

      // Recessed inner concha shadow cavity for realistic side/back ear silhouette
      const concha = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), innerEarMat);
      concha.scale.set(0.32, 0.92, 0.56);
      concha.position.set(side * 0.004, -0.002, -0.003);
      earGroup.add(concha);

      headGroup.add(earGroup);
    });

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.021, 0.052, 6), cfg.skinMat);
    nose.position.set(0, -0.015, 0.142);
    nose.rotation.x = 0.45;
    headGroup.add(nose);
  }

  return {
    torso,
    neck,
    head,
    headGroup,
    leftLegGroup,
    rightLegGroup,
    leftArmGroup,
    rightArmGroup,
    beltGroup,
  };
}

// ============================================================================
// 7. UNIVERSAL REALISM POST-PROCESSOR (UPGRADES ALL LEGACY HEROES & WITCHES!)
// ============================================================================

function classifyMaterial(mat: THREE.Material): THREE.Material {
  if ((mat as THREE.MeshPhysicalMaterial).userData?.realismUpgraded) return mat;
  if (!(mat instanceof THREE.MeshStandardMaterial)) return mat;

  // Preserve glowing emissives / unlit overlays cleanly
  const isGlowing = mat.emissiveIntensity && mat.emissiveIntensity > 0.75;
  if (isGlowing || mat.transparent) {
    mat.userData.realismUpgraded = true;
    return mat;
  }

  const col = mat.color;
  const r = col.r;
  const g = col.g;
  const b = col.b;

  // Detect flesh skin tones
  const isSkin =
    r > 0.45 &&
    r >= g &&
    g >= b * 0.88 &&
    r - b > 0.07 &&
    mat.metalness < 0.15 &&
    mat.roughness < 0.72;

  if (isSkin) {
    mat.normalMap = mat.normalMap ?? getSkinNormalMap();
    mat.normalScale = mat.normalScale ?? new THREE.Vector2(0.45, 0.45);
    mat.bumpMap = mat.bumpMap ?? getSkinBumpMap();
    mat.bumpScale = 0.006;
    mat.roughness = Math.max(0.44, mat.roughness);
    mat.envMapIntensity = 0.3;
  } else if (mat.metalness >= 0.55) {
    mat.normalMap = mat.normalMap ?? getArmorNormalMap();
    mat.normalScale = mat.normalScale ?? new THREE.Vector2(0.85, 0.85);
    mat.bumpMap = mat.bumpMap ?? getArmorBumpMap();
    mat.bumpScale = 0.014;
    mat.roughness = Math.max(0.2, mat.roughness);
    mat.envMapIntensity = 0.6;
  } else if (mat.side === THREE.DoubleSide) {
    mat.normalMap = mat.normalMap ?? getCapeNormalMap();
    mat.normalScale = mat.normalScale ?? new THREE.Vector2(1.25, 1.25);
    mat.bumpMap = mat.bumpMap ?? getCapeClothBumpMap();
    mat.bumpScale = 0.03;
    mat.roughnessMap = mat.roughnessMap ?? getFabricRoughnessMap();
    mat.roughness = Math.max(0.82, mat.roughness);
    mat.envMapIntensity = 0.28;
  } else {
    mat.map = mat.map ?? getFabricWrinkleAlbedoMap();
    mat.normalMap = mat.normalMap ?? getFabricNormalMap();
    mat.normalScale = mat.normalScale ?? new THREE.Vector2(1.2, 1.2);
    mat.bumpMap = mat.bumpMap ?? getFabricBumpMap();
    mat.bumpScale = 0.024;
    mat.roughnessMap = mat.roughnessMap ?? getFabricRoughnessMap();
    mat.roughness = Math.max(0.68, mat.roughness);
    mat.envMapIntensity = 0.32;
  }

  mat.userData.realismUpgraded = true;
  mat.needsUpdate = true;
  return mat;
}

export interface UniversalUpgradeOptions {
  asymmetricCape?: boolean;
  skipGeometrySculpt?: boolean;
  skipNeckEars?: boolean;
}

/**
 * Seamlessly upgrades ANY character or enemy `THREE.Group`:
 * - Enriches every suit/skin/armor/cape material with tangent-space normal maps, wrinkle albedo grain,
 *   and physically calibrated envMapIntensity so dark crevices & muscles read sharply.
 * - Replaces sharp boxy torsos, pelvises, cylindrical limbs, spherical heads, and box boots with
 *   sculpted anatomical meshes while keeping custom crests, helmets, wings, halos, hair & weapons exact!
 * - Resculpts flat rectangular capes into deep pleated vertex-AO cloth geometry with live wind physics base.
 */
export function applyUniversalRealismUpgrade(
  group: THREE.Group,
  options: UniversalUpgradeOptions = {}
): void {
  const toProcess: THREE.Mesh[] = [];
  group.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      toProcess.push(obj);
    }
  });

  const capeMesh = group.userData?.capeMesh as THREE.Mesh | undefined;
  let foundHeadMesh: THREE.Mesh | null = null;
  let foundSkinMat: THREE.Material | null = null;

  for (const mesh of toProcess) {
    // Skip transparent ground shadow disc or particle FX
    if (mesh.rotation.x < -1.3 && mesh.position.y < 0.05 && mesh.geometry instanceof THREE.PlaneGeometry) {
      continue;
    }

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(m => classifyMaterial(m));
    } else if (mesh.material) {
      mesh.material = classifyMaterial(mesh.material);
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (options.skipGeometrySculpt || group.userData?.isRealisticBody) continue;

    // 1. Upgrade flat cape PlaneGeometry into deep pleated vertex-AO cape
    if (capeMesh && mesh === capeMesh && mesh.geometry instanceof THREE.PlaneGeometry) {
      const params = mesh.geometry.parameters;
      const w = params.width || 0.78;
      const h = params.height || 1.2;
      const asym = options.asymmetricCape ?? true;
      const pleated = sculptPleatedCapeGeometry(w, h, asym, 24, 24);
      mesh.geometry.dispose();
      mesh.geometry = pleated;
      if (mesh.material && !Array.isArray(mesh.material)) {
        mesh.material = enableVertexColorCapeMaterial(mesh.material);
      }
      mesh.position.z = Math.max(-0.16, mesh.position.z + 0.03);
      group.userData.capeBasePos = new Float32Array(pleated.attributes.position.array as Float32Array);
      continue;
    }

    const geo = mesh.geometry;

    // 2. Replace sharp boxy torso / pelvis BoxGeometry with sculpted anatomy
    if (geo instanceof THREE.BoxGeometry) {
      const { width: w, height: h, depth: d } = geo.parameters;
      if (w >= 0.36 && h >= 0.40 && d >= 0.20 && mesh.position.y > 1.0 && mesh.position.y < 1.45) {
        mesh.geometry = getAnatomicalTorsoGeo();
        mesh.scale.set((w / 0.42) * mesh.scale.x, (h / 0.60) * mesh.scale.y, (d / 0.25) * mesh.scale.z);
        continue;
      }
      if (w >= 0.32 && h >= 0.14 && h <= 0.28 && d >= 0.20 && mesh.position.y > 0.78 && mesh.position.y < 1.05) {
        mesh.geometry = getAnatomicalPelvisGeo();
        mesh.scale.set((w / 0.37) * mesh.scale.x, (h / 0.20) * mesh.scale.y, (d / 0.24) * mesh.scale.z);
        continue;
      }
      if (mesh.position.y <= 0.16 && w >= 0.09 && w <= 0.16 && d >= 0.19) {
        mesh.geometry = getBootVampGeo();
        mesh.scale.set((w / 0.115) * mesh.scale.x, (h / 0.09) * mesh.scale.y, (d / 0.23) * mesh.scale.z);
        continue;
      }
      if (mesh.position.y > 0.95 && mesh.position.y < 1.3 && w >= 0.08 && w <= 0.14 && h >= 0.08 && d >= 0.10) {
        const fist = new THREE.SphereGeometry(0.056, 12, 10);
        fist.scale(0.95, 1.0, 1.25);
        mesh.geometry = fist;
        continue;
      }
    }

    // 3. Replace uniform straight cylindrical limbs with muscular Lathe limbs
    if (geo instanceof THREE.CylinderGeometry) {
      const { radiusTop: rt, radiusBottom: rb, height: h } = geo.parameters;
      if (rt >= 0.068 && rt <= 0.11 && h >= 0.74 && h <= 0.94 && mesh.position.y < 0.6) {
        mesh.geometry = getFullMuscularLegGeo();
        mesh.scale.set((rt / 0.086) * mesh.scale.x, (h / 0.84) * mesh.scale.y, (rt / 0.086) * mesh.scale.z);
        continue;
      }
      if (rt >= 0.068 && rt <= 0.105 && h >= 0.32 && h <= 0.52 && mesh.position.y > 0.18 && mesh.position.y < 0.82) {
        mesh.geometry = mesh.position.y > 0.48 ? getMuscularThighGeo() : getMuscularCalfGeo();
        mesh.scale.set((rt / 0.086) * mesh.scale.x, (h / 0.42) * mesh.scale.y, (rt / 0.086) * mesh.scale.z);
        continue;
      }
      if (rt >= 0.042 && rt <= 0.085 && h >= 0.26 && h <= 0.48 && Math.abs(mesh.position.x) > 0.2 && mesh.position.y > 1.05 && mesh.position.y < 1.4) {
        mesh.geometry = h > 0.35 ? getFullMuscularArmGeo() : getMuscularUpperArmGeo();
        mesh.scale.set((rt / 0.068) * mesh.scale.x, (h / (h > 0.35 ? 0.42 : 0.32)) * mesh.scale.y, (rt / 0.068) * mesh.scale.z);
        continue;
      }
      if (rt >= 0.17 && rb >= 0.14 && h >= 0.42 && h <= 0.54 && mesh.position.y > 1.05 && mesh.position.y < 1.38) {
        mesh.geometry = getAnatomicalTorsoGeo();
        mesh.scale.set((rt / 0.21) * mesh.scale.x, (h / 0.60) * mesh.scale.y, (rt / 0.21) * mesh.scale.z);
        continue;
      }
    }

    // 4. Sculpted cranium head upgrade for SphereGeometry heads (preserve hats/crowns/eyes/auras)
    if (geo instanceof THREE.SphereGeometry) {
      const { radius, thetaLength } = geo.parameters;
      if (
        radius >= 0.145 &&
        radius <= 0.185 &&
        (thetaLength === undefined || thetaLength > Math.PI * 0.85) &&
        mesh.position.y >= 1.50 &&
        mesh.position.y <= 1.78 &&
        Math.abs(mesh.position.x) < 0.05 &&
        Math.abs(mesh.position.z) < 0.05
      ) {
        const s = radius / 0.155;
        mesh.geometry = getAnatomicalHeadGeo();
        mesh.scale.setScalar(s);
        foundHeadMesh = mesh;
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          foundSkinMat = mesh.material;
        }
      }
    }
  }

  // Add subtle anatomical neck & 2-part ears if head was upgraded cleanly
  if (!options.skipGeometrySculpt && !group.userData?.isRealisticBody && !options.skipNeckEars && foundHeadMesh && foundSkinMat) {
    const neckMat = makeSkinMaterial({
      color: foundSkinMat instanceof THREE.MeshStandardMaterial ? foundSkinMat.color : '#d9a17f',
    });
    const neck = new THREE.Mesh(getAnatomicalNeckGeo(), neckMat);
    neck.position.set(0, foundHeadMesh.position.y - 0.16, foundHeadMesh.position.z);
    neck.castShadow = true;
    group.add(neck);

    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), neckMat);
      ear.scale.set(0.4, 1.15, 0.7);
      ear.position.set(side * 0.145, foundHeadMesh.position.y - 0.01, foundHeadMesh.position.z - 0.01);
      group.add(ear);
    });
  }
}

