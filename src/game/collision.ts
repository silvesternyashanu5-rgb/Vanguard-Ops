import * as THREE from 'three';

export interface OrientedBoxCollider {
  center: THREE.Vector3;
  halfSize: THREE.Vector3;
  matrix: THREE.Matrix4;
  invMatrix: THREE.Matrix4;
  /** World-space direction of local +X, +Y, +Z axes */
  axisX: THREE.Vector3;
  axisY: THREE.Vector3;
  axisZ: THREE.Vector3;
}

export interface CylinderCollider {
  x: number;
  z: number;
  radius: number;
  minY: number;
  maxY: number;
  /** Linked flora ID so upper trunk clearance drops to stump height when snapped */
  floraId?: string;
  stumpMaxY?: number;
}

export interface MapObstacle {
  box: THREE.Box3;
  type: 'wall' | 'crate' | 'building' | 'barrel' | 'ramp' | 'tree' | 'cylinder';
  isDestructible?: boolean;
  obb?: OrientedBoxCollider;
  cylinder?: CylinderCollider;
  isWalkableRamp?: boolean;
}

export interface CollisionQueryContext {
  obstacles: MapObstacle[];
  mapSize: { x: number; z: number };
  getTerrainHeight: (x: number, z: number) => number;
  snappedFloraIds?: Set<string>;
}

export interface CharacterCollisionResult {
  feetY: number;
  isGrounded: boolean;
  hitWall: boolean;
  hitCeiling: boolean;
}

const _tmpVec = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();
const _localRayOrigin = new THREE.Vector3();
const _localRayDir = new THREE.Vector3();
const _localBox = new THREE.Box3();
const _localRay = new THREE.Ray();
const _localHit = new THREE.Vector3();

/**
 * Create an exact Oriented Bounding Box (OBB) collider from world transform & full dimensions.
 */
export function createOrientedBoxCollider(
  pos: THREE.Vector3,
  euler: THREE.Euler,
  width: number,
  height: number,
  depth: number
): OrientedBoxCollider {
  const quat = new THREE.Quaternion().setFromEuler(euler);
  const matrix = new THREE.Matrix4().compose(pos, quat, new THREE.Vector3(1, 1, 1));
  const invMatrix = matrix.clone().invert();
  const halfSize = new THREE.Vector3(width * 0.5, height * 0.5, depth * 0.5);

  const axisX = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).normalize();
  const axisY = new THREE.Vector3(0, 1, 0).applyQuaternion(quat).normalize();
  const axisZ = new THREE.Vector3(0, 0, 1).applyQuaternion(quat).normalize();

  return {
    center: pos.clone(),
    halfSize,
    matrix,
    invMatrix,
    axisX,
    axisY,
    axisZ,
  };
}

/**
 * Computes exact world-space Y height of a walkable OBB/ramp top surface directly above (worldX, worldZ).
 * Returns null if (worldX, worldZ) falls outside the ramp's top XZ footprint (expanded by margin).
 */
export function getWalkableObbTopY(
  obb: OrientedBoxCollider,
  worldX: number,
  worldZ: number,
  margin: number = 0.22
): number | null {
  const { center, halfSize, axisX, axisY, axisZ } = obb;

  // Reject nearly-vertical surfaces
  if (Math.abs(axisY.y) < 0.25) return null;

  // Top face center in world space
  const topCenterX = center.x + axisY.x * halfSize.y;
  const topCenterY = center.y + axisY.y * halfSize.y;
  const topCenterZ = center.z + axisY.z * halfSize.y;

  // Solve 2x2 system for local (lx, lz) on top plane:
  // lx * axisX.xz + lz * axisZ.xz = (worldX - topCenterX, worldZ - topCenterZ)
  const dx = worldX - topCenterX;
  const dz = worldZ - topCenterZ;
  const det = axisX.x * axisZ.z - axisZ.x * axisX.z;
  if (Math.abs(det) < 1e-5) return null;

  const lx = (dx * axisZ.z - dz * axisZ.x) / det;
  const lz = (axisX.x * dz - axisX.z * dx) / det;

  const slopeCos = Math.max(0.45, Math.abs(axisY.y));
  const localMargin = margin / slopeCos;
  if (Math.abs(lx) > halfSize.x + localMargin || Math.abs(lz) > halfSize.z + localMargin) {
    return null;
  }

  const clampedLx = THREE.MathUtils.clamp(lx, -halfSize.x, halfSize.x);
  const clampedLz = THREE.MathUtils.clamp(lz, -halfSize.z, halfSize.z);
  return topCenterY + clampedLx * axisX.y + clampedLz * axisZ.y;
}

function getEffectiveMaxY(obs: MapObstacle, snappedFloraIds?: Set<string>): number {
  if (obs.cylinder) {
    if (obs.cylinder.floraId && snappedFloraIds?.has(obs.cylinder.floraId)) {
      return obs.cylinder.stumpMaxY ?? obs.cylinder.minY + 0.95;
    }
    return obs.cylinder.maxY;
  }
  return obs.box.max.y;
}

function getEffectiveMinY(obs: MapObstacle): number {
  if (obs.cylinder) return obs.cylinder.minY;
  return obs.box.min.y;
}

/**
 * Resolves vertical ground/platform/ramp support AND multi-pass horizontal wall sliding
 * against cylinders, oriented boxes, axis-aligned boxes, and arena boundary walls.
 *
 * `posXZ` represents (x, feetY, z) and is mutated in place to the valid resolved position.
 */
export function resolveCharacterCollision(
  pos: THREE.Vector3,
  prevFeetY: number,
  radius: number,
  charHeight: number,
  velocity: THREE.Vector3 | null,
  ctx: CollisionQueryContext,
  options?: {
    stepHeight?: number;
    isFlying?: boolean;
  }
): CharacterCollisionResult {
  const isFlying = options?.isFlying ?? false;
  const stepHeight = options?.stepHeight ?? (isFlying ? 0.15 : 0.48);

  const wallMargin = 1.0 + radius + 0.04;
  const boundX = Math.max(4, ctx.mapSize.x * 0.5 - wallMargin);
  const boundZ = Math.max(4, ctx.mapSize.z * 0.5 - wallMargin);

  let hitWall = false;
  let hitCeiling = false;

  // Helper: clamp XZ to arena interior
  const clampBounds = () => {
    if (pos.x < -boundX) {
      pos.x = -boundX;
      if (velocity && velocity.x < 0) velocity.x = 0;
      hitWall = true;
    } else if (pos.x > boundX) {
      pos.x = boundX;
      if (velocity && velocity.x > 0) velocity.x = 0;
      hitWall = true;
    }
    if (pos.z < -boundZ) {
      pos.z = -boundZ;
      if (velocity && velocity.z < 0) velocity.z = 0;
      hitWall = true;
    } else if (pos.z > boundZ) {
      pos.z = boundZ;
      if (velocity && velocity.z > 0) velocity.z = 0;
      hitWall = true;
    }
  };

  clampBounds();

  // -------------------------------------------------------------------------
  // PASS 1: Multi-iteration horizontal obstacle push-out & smooth wall sliding
  // -------------------------------------------------------------------------
  const solveHorizontalPushout = () => {
    const feetY = pos.y;
    const headY = feetY + charHeight;

    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < ctx.obstacles.length; i++) {
        const obs = ctx.obstacles[i];

        // Walkable ramps: allow seamless entry & climbing along top surface when within stepHeight,
        // while keeping high undersides and raised sides completely solid!
        if (obs.isWalkableRamp && obs.obb) {
          const rampTopY = getWalkableObbTopY(obs.obb, pos.x, pos.z, radius * 1.75);
          if (rampTopY !== null) {
            if (prevFeetY >= rampTopY - stepHeight - 0.12 || feetY >= rampTopY - stepHeight - 0.12) {
              continue;
            }
          }
        }

        const obsMinY = getEffectiveMinY(obs);
        const obsMaxY = getEffectiveMaxY(obs, ctx.snappedFloraIds);

        // Step-height / clearance check: skip obstacles strictly below feet or strictly above head
        if (feetY >= obsMaxY - 0.16 || headY <= obsMinY + 0.06) {
          continue;
        }
        // If feet are within automatic step-up height above prevFeetY, let vertical pass step onto it
        if (!obs.isWalkableRamp && prevFeetY >= obsMaxY - stepHeight && obsMaxY - prevFeetY <= stepHeight && (velocity?.y ?? 0) <= 1.2) {
          if (obs.cylinder) {
            const dx = pos.x - obs.cylinder.x;
            const dz = pos.z - obs.cylinder.z;
            const stepR = obs.cylinder.radius + radius * 1.05;
            if (dx * dx + dz * dz <= stepR * stepR) continue;
          } else if (obs.obb) {
            _tmpVec.set(pos.x, obsMaxY, pos.z).applyMatrix4(obs.obb.invMatrix);
            if (
              Math.abs(_tmpVec.x) <= obs.obb.halfSize.x + radius * 1.05 &&
              Math.abs(_tmpVec.z) <= obs.obb.halfSize.z + radius * 1.05
            ) {
              continue;
            }
          } else if (
            pos.x >= obs.box.min.x - radius * 1.05 &&
            pos.x <= obs.box.max.x + radius * 1.05 &&
            pos.z >= obs.box.min.z - radius * 1.05 &&
            pos.z <= obs.box.max.z + radius * 1.05
          ) {
            continue;
          }
        }

        // 1A. Vertical Cylinder collider
        if (obs.cylinder) {
          const dx = pos.x - obs.cylinder.x;
          const dz = pos.z - obs.cylinder.z;
          const minDist = obs.cylinder.radius + radius;
          const distSq = dx * dx + dz * dz;
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            const nx = dist > 1e-5 ? dx / dist : 1;
            const nz = dist > 1e-5 ? dz / dist : 0;
            const push = minDist - dist;
            pos.x += nx * push;
            pos.z += nz * push;
            if (velocity) {
              const vn = velocity.x * nx + velocity.z * nz;
              if (vn < 0) {
                velocity.x -= vn * nx;
                velocity.z -= vn * nz;
              }
            }
            hitWall = true;
          }
          continue;
        }

        // 1B. Oriented Bounding Box (OBB) collider
        if (obs.obb) {
          const { halfSize, invMatrix, axisX, axisZ } = obs.obb;
          _tmpVec.set(pos.x, feetY + charHeight * 0.5, pos.z).applyMatrix4(invMatrix);

          // Local Y overlap check
          if (Math.abs(_tmpVec.y) >= halfSize.y + charHeight * 0.48) {
            continue;
          }

          const clX = THREE.MathUtils.clamp(_tmpVec.x, -halfSize.x, halfSize.x);
          const clZ = THREE.MathUtils.clamp(_tmpVec.z, -halfSize.z, halfSize.z);
          const dlx = _tmpVec.x - clX;
          const dlz = _tmpVec.z - clZ;
          const distSq = dlx * dlx + dlz * dlz;

          let pushWorldX = 0;
          let pushWorldZ = 0;

          if (distSq < 1e-8) {
            // Center is inside the OBB XZ footprint: push out along nearest XZ face
            const penX = halfSize.x - Math.abs(_tmpVec.x);
            const penZ = halfSize.z - Math.abs(_tmpVec.z);
            if (penX < penZ) {
              const signX = _tmpVec.x >= 0 ? 1 : -1;
              const mag = penX + radius;
              pushWorldX = axisX.x * signX * mag;
              pushWorldZ = axisX.z * signX * mag;
            } else {
              const signZ = _tmpVec.z >= 0 ? 1 : -1;
              const mag = penZ + radius;
              pushWorldX = axisZ.x * signZ * mag;
              pushWorldZ = axisZ.z * signZ * mag;
            }
          } else if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq);
            const lnx = dlx / dist;
            const lnz = dlz / dist;
            const mag = radius - dist;
            pushWorldX = (axisX.x * lnx + axisZ.x * lnz) * mag;
            pushWorldZ = (axisX.z * lnx + axisZ.z * lnz) * mag;
          }

          if (pushWorldX !== 0 || pushWorldZ !== 0) {
            pos.x += pushWorldX;
            pos.z += pushWorldZ;
            const nLen = Math.hypot(pushWorldX, pushWorldZ);
            if (nLen > 1e-5 && velocity) {
              const nx = pushWorldX / nLen;
              const nz = pushWorldZ / nLen;
              const vn = velocity.x * nx + velocity.z * nz;
              if (vn < 0) {
                velocity.x -= vn * nx;
                velocity.z -= vn * nz;
              }
            }
            hitWall = true;
          }
          continue;
        }

        // 1C. Axis-Aligned Bounding Box (AABB) collider
        const bMinX = obs.box.min.x;
        const bMaxX = obs.box.max.x;
        const bMinZ = obs.box.min.z;
        const bMaxZ = obs.box.max.z;

        const clX = THREE.MathUtils.clamp(pos.x, bMinX, bMaxX);
        const clZ = THREE.MathUtils.clamp(pos.z, bMinZ, bMaxZ);
        const dx = pos.x - clX;
        const dz = pos.z - clZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < 1e-8) {
          // Inside AABB footprint -> push to nearest edge + radius
          const leftPen = pos.x - bMinX;
          const rightPen = bMaxX - pos.x;
          const backPen = pos.z - bMinZ;
          const frontPen = bMaxZ - pos.z;
          const minPen = Math.min(leftPen, rightPen, backPen, frontPen);
          let nx = 0;
          let nz = 0;
          if (minPen === leftPen) nx = -1;
          else if (minPen === rightPen) nx = 1;
          else if (minPen === backPen) nz = -1;
          else nz = 1;
          const push = minPen + radius;
          pos.x += nx * push;
          pos.z += nz * push;
          if (velocity) {
            const vn = velocity.x * nx + velocity.z * nz;
            if (vn < 0) {
              velocity.x -= vn * nx;
              velocity.z -= vn * nz;
            }
          }
          hitWall = true;
        } else if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;
          const push = radius - dist;
          pos.x += nx * push;
          pos.z += nz * push;
          if (velocity) {
            const vn = velocity.x * nx + velocity.z * nz;
            if (vn < 0) {
              velocity.x -= vn * nx;
              velocity.z -= vn * nz;
            }
          }
          hitWall = true;
        }
      }

      clampBounds();
    }
  };

  solveHorizontalPushout();

  // -------------------------------------------------------------------------
  // PASS 2: Vertical support (terrain + platforms + cylinders + walkable ramps)
  // -------------------------------------------------------------------------
  let supportY = ctx.getTerrainHeight(pos.x, pos.z);
  const velY = velocity?.y ?? 0;

  for (let i = 0; i < ctx.obstacles.length; i++) {
    const obs = ctx.obstacles[i];

    if (obs.isWalkableRamp && obs.obb) {
      const rampTopY = getWalkableObbTopY(obs.obb, pos.x, pos.z, radius * 0.85);
      if (rampTopY !== null) {
        // Player can step/land onto ramp if previous feet weren't far beneath it
        if (prevFeetY >= rampTopY - stepHeight - 0.14 && pos.y <= rampTopY + 0.18 && velY <= 2.5) {
          if (rampTopY > supportY) supportY = rampTopY;
        }
      }
      continue;
    }

    const obsMaxY = getEffectiveMaxY(obs, ctx.snappedFloraIds);
    const obsMinY = getEffectiveMinY(obs);

    // Check if player's XZ footprint overlaps this obstacle
    let overTop = false;
    if (obs.cylinder) {
      const dx = pos.x - obs.cylinder.x;
      const dz = pos.z - obs.cylinder.z;
      const r = obs.cylinder.radius + radius * 0.6;
      overTop = dx * dx + dz * dz <= r * r;
    } else if (obs.obb) {
      _tmpVec.set(pos.x, obsMaxY, pos.z).applyMatrix4(obs.obb.invMatrix);
      overTop =
        Math.abs(_tmpVec.x) <= obs.obb.halfSize.x + radius * 0.55 &&
        Math.abs(_tmpVec.z) <= obs.obb.halfSize.z + radius * 0.55;
    } else {
      overTop =
        pos.x >= obs.box.min.x - radius * 0.55 &&
        pos.x <= obs.box.max.x + radius * 0.55 &&
        pos.z >= obs.box.min.z - radius * 0.55 &&
        pos.z <= obs.box.max.z + radius * 0.55;
    }

    if (!overTop) continue;

    // Standing / Landing / Stepping onto top surface
    if (prevFeetY >= obsMaxY - stepHeight - 0.08 && pos.y <= obsMaxY + 0.12 && velY <= 1.5) {
      if (obsMaxY > supportY) supportY = obsMaxY;
    }

    // Ceiling bump (when jumping up under bridge decks, pagoda roofs, catwalks)
    const headY = pos.y + charHeight;
    const prevHeadY = prevFeetY + charHeight;
    if (velY > 0 && headY > obsMinY && pos.y < obsMinY && prevHeadY <= obsMinY + 0.25) {
      pos.y = Math.max(supportY, obsMinY - charHeight);
      if (velocity && velocity.y > 0) velocity.y = 0;
      hitCeiling = true;
    }
  }

  let isGrounded = false;
  if (pos.y <= supportY + 0.03 && velY <= 1.2) {
    pos.y = supportY;
    if (velocity && velocity.y < 0) velocity.y = 0;
    isGrounded = true;
  }

  // Re-run quick horizontal pushout if landing changed Y near an overlapping upper prop
  if (hitCeiling) {
    solveHorizontalPushout();
  }

  return {
    feetY: pos.y,
    isGrounded,
    hitWall,
    hitCeiling,
  };
}

/**
 * Ray-intersect camera ray against all obstacles (respecting tight OBB & Cylinder shapes
 * instead of oversized rotated AABBs) to find closest distance before hitting geometry.
 */
export function clipCameraRayAgainstObstacles(
  pivot: THREE.Vector3,
  desiredCamPos: THREE.Vector3,
  obstacles: MapObstacle[],
  snappedFloraIds?: Set<string>
): number {
  _tmpDir.copy(desiredCamPos).sub(pivot);
  const maxLen = _tmpDir.length();
  if (maxLen <= 0.01) return maxLen;
  _tmpDir.divideScalar(maxLen);

  let closestDist = maxLen;
  const worldRay = new THREE.Ray(pivot, _tmpDir);

  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];

    if (obs.cylinder) {
      // Exact ray-vs-finite-vertical-cylinder in XZ + Y span check
      const cx = obs.cylinder.x;
      const cz = obs.cylinder.z;
      const r = obs.cylinder.radius;
      const ox = pivot.x - cx;
      const oz = pivot.z - cz;
      const a = _tmpDir.x * _tmpDir.x + _tmpDir.z * _tmpDir.z;
      if (a > 1e-6) {
        const b = 2 * (ox * _tmpDir.x + oz * _tmpDir.z);
        const c = ox * ox + oz * oz - r * r;
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
          const t = (-b - Math.sqrt(disc)) / (2 * a);
          if (t > 0.1 && t < closestDist) {
            const hitY = pivot.y + _tmpDir.y * t;
            const maxY = getEffectiveMaxY(obs, snappedFloraIds);
            if (hitY >= obs.cylinder.minY && hitY <= maxY) {
              const d = t - 0.25;
              if (d > 0.4 && d < closestDist) closestDist = d;
            }
          }
        }
      }
      continue;
    }

    if (obs.obb) {
      _localRayOrigin.copy(pivot).applyMatrix4(obs.obb.invMatrix);
      _localRayDir.copy(_tmpDir).transformDirection(obs.obb.invMatrix);
      _localRay.set(_localRayOrigin, _localRayDir);
      _localBox.set(
        _tmpVec.set(-obs.obb.halfSize.x, -obs.obb.halfSize.y, -obs.obb.halfSize.z),
        obs.obb.halfSize
      );
      if (_localRay.intersectBox(_localBox, _localHit)) {
        const worldHit = _localHit.clone().applyMatrix4(obs.obb.matrix);
        const d = pivot.distanceTo(worldHit) - 0.25;
        if (d > 0.4 && d < closestDist) {
          closestDist = d;
        }
      }
      continue;
    }

    if (worldRay.intersectBox(obs.box, _localHit)) {
      const d = pivot.distanceTo(_localHit) - 0.25;
      if (d > 0.4 && d < closestDist) {
        closestDist = d;
      }
    }
  }

  return closestDist;
}
