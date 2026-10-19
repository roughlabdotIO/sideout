import { SIDE_USA, SIDE_SWE, PLAYER_HOMES_LOCAL } from './constants.js';
import { clampPlayerOnCourt } from './court.js';

// ============================================================
// PLAYERS — state and body physics (run, jump, dive, recover).
// No meshes or sound: js/view/playersView.js draws them and the
// game plays whistles and sand puffs from what these return.
// ============================================================

/** Top running speed (world units / s). */
export const PLAYER_SPEED = 7.5;
/** Take-off speed and gravity of a jump. */
export const JUMP_V = 8;
export const G_J = 26;
/** How fast velocity follows the stick, on the sand and in the air. */
export const RESP_GROUND = 9;
export const RESP_AIR = 2.5;
/** Dive: launch speed, time airborne, time lying on the sand after. */
export const DIVE_SPEED = 12;
export const DIVE_TIME = 0.42;
export const DOWN_TIME = 0.55;
/** Contact reach: horizontal radius and max ball height for a ground touch. */
export const HIT_RADIUS = 1.15;
export const REACH_GROUND = 2.5;
/** Coil before a ground touch resolves. */
export const WINDUP = 0.06;

/** The four players [USA-1, USA-2, SWE-1, SWE-2]. */
const ROSTER = [
  { name: 'USA-1', side: SIDE_USA },
  { name: 'USA-2', side: SIDE_USA },
  { name: 'SWE-1', side: SIDE_SWE },
  { name: 'SWE-2', side: SIDE_SWE },
];

function makePlayer({ name, side }, [x, z]) {
  return {
    x, z, side, name, home: { x, z }, cool: 0,
    vx: 0, vz: 0,
    air: false, jumpH: 0, jumpV: 0,
    windup: 0, wmx: 0, wmz: 0, wKind: null, wMode: 'auto',
    diveT: 0, downT: 0, diveDx: 0,
    poseKind: 'idle', poseT: 0, ready: false, faceA: 0,
    stride: 0,
  };
}

/** Creates the four player states at their main-court home spots. */
export function createPlayers() {
  return ROSTER.map((r, i) => makePlayer(r, PLAYER_HOMES_LOCAL[i]));
}

/** True while diving, lying on the sand or coiling for a touch. */
export function isBusy(p) {
  return p.diveT > 0 || p.downT > 0 || p.windup > 0;
}

/**
 * Leave the sand. @returns {boolean} false if already airborne.
 */
export function startJump(p) {
  if (p.air) return false;
  p.air = true;
  p.jumpV = JUMP_V;
  return true;
}

/** Throw the body toward a point on the sand (usually the landing point). */
export function startDive(p, target) {
  const dx = target.x - p.x, dz = target.z - p.z;
  const d = Math.hypot(dx, dz) || 1;
  p.vx = dx / d * DIVE_SPEED; p.vz = dz / d * DIVE_SPEED;
  p.diveT = DIVE_TIME; p.diveDx = dx;
}

/**
 * Steer a player toward the target velocity (tvx, tvz) and move it,
 * kept inside the court run-off. Dives and recoveries ignore the stick.
 */
export function movePlayer(p, tvx, tvz, dt, court) {
  if (p.diveT > 0) {
    const a = Math.min(1, 2.0 * dt); p.vx -= p.vx * a; p.vz -= p.vz * a;
  } else if (p.downT > 0) {
    const a = Math.min(1, 6 * dt); p.vx -= p.vx * a; p.vz -= p.vz * a;
  } else {
    const a = Math.min(1, (p.air ? RESP_AIR : RESP_GROUND) * dt);
    p.vx += (tvx - p.vx) * a; p.vz += (tvz - p.vz) * a;
  }
  p.x += p.vx * dt; p.z += p.vz * dt;
  p.stride += Math.hypot(p.vx, p.vz) * dt;   // drives the leg cycle
  clampPlayerOnCourt(p, court);
}

/**
 * Jump arcs for every airborne player.
 * @returns {object[]} players that touched down this frame.
 */
export function stepJumps(players, dt) {
  const landed = [];
  players.forEach((p) => {
    if (!p.air) return;
    p.jumpV -= G_J * dt;
    p.jumpH += p.jumpV * dt;
    if (p.jumpH <= 0) {
      p.jumpH = 0; p.jumpV = 0; p.air = false;
      p.cool = Math.max(p.cool, 0.15);
      landed.push(p);
    }
  });
  return landed;
}
