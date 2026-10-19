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
/** Braking on the sand (slowing down or reversing): feet plant, no sliding. */
export const RESP_BRAKE = 30;
/** Below this speed a player on the sand with no input stands still. */
const STOP_SPEED = 0.35;
/** Dive: launch speed, time airborne, time lying on the sand after. */
export const DIVE_SPEED = 12;
export const DIVE_TIME = 0.42;
export const DOWN_TIME = 0.55;
/** Contact reach: horizontal radius and max ball height for a ground touch. */
export const HIT_RADIUS = 1.15;
export const REACH_GROUND = 2.5;
/** Coil before a ground touch resolves. */
export const WINDUP = 0.06;

/**
 * Attack approach — the beach three-step run-up:
 *   1) LEFT step: start and accelerate,
 *   2) RIGHT step: the long, fastest one,
 *   3) LEFT closes beside the right: plant, brake, arms swing back (load)
 * then take-off, the run's speed turning into a higher jump.
 */
export const APPROACH = {
  step1: 0.28,       // s, left step
  step2: 0.14,       // s, right step
  plant: 0.14,       // s, left closes + load
  speed: 6.2,        // top speed of a full-length run-up
  dist: 2.2,         // ground covered by a full-length run-up
  jumpV: 9.2,        // take-off speed (standing jump: JUMP_V)
  carry: 1.5,        // forward drift kept in the air
};

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
    windup: 0, wmx: 0, wmz: 0, wKind: null, wMode: 'auto', wAim: null,
    /** Active aim cursor (js/logic/aim.js) while planted waiting for the ball. */
    aim: null,
    diveT: 0, downT: 0, diveDx: 0,
    poseKind: 'idle', poseT: 0, ready: false, faceA: 0,
    stride: 0,
    /** Where the last touch was sent (the body stays turned that way during the pose). */
    turnX: null, turnZ: null,
    /** Attack run-up in progress (see APPROACH), and a swing queued for the jump. */
    approach: null, swingQueued: false,
    /** Countdown after an action press: a second press within it is a double tap. */
    tapT: 0,
  };
}

/** Creates the four player states at their main-court home spots. */
export function createPlayers() {
  return ROSTER.map((r, i) => makePlayer(r, PLAYER_HOMES_LOCAL[i]));
}

/** Facing angle so the body's "up" (arms/platform) points at (tx,tz). */
export function faceAngle(p, tx, tz) {
  return Math.atan2(-(tx - p.x), -(tz - p.z));
}

/** True while diving, lying on the sand, coiling for a touch or running up to attack. */
export function isBusy(p) {
  return p.diveT > 0 || p.downT > 0 || p.windup > 0 || !!p.approach;
}

/** How fast the stick can bend the run-up during the first two steps (rad/s). */
const APPROACH_TURN = 9;

/**
 * Start the three-step attack run-up. The path follows the stick when one
 * is held (`steer`), otherwise it heads for `target` (where the player wants
 * to take off). Stride length adapts to how far `target` lies along the
 * chosen path, like a real hitter shortening or lengthening the steps.
 * @param {{x:number,z:number}} target
 * @param {{mx:number,mz:number}} [steer] stick at the press
 */
export function startApproach(p, target, steer) {
  const tx = target.x - p.x, tz = target.z - p.z;
  const steered = !!steer && Math.hypot(steer.mx, steer.mz) > 0.3;
  let dx, dz;
  if (steered) { dx = steer.mx; dz = steer.mz; }
  else if (Math.hypot(tx, tz) >= 0.2) { dx = tx; dz = tz; }
  else { dx = 0; dz = -p.side; }                  // nowhere to go: run at the net
  const n = Math.hypot(dx, dz);
  dx /= n; dz /= n;
  // fit the strides to the target when it lies ahead on the path;
  // a path the player picked away from it gets a full-length run-up
  const along = tx * dx + tz * dz;
  const fit = !steered || along > 0.5;
  const scale = fit ? Math.max(0.45, Math.min(1.3, along / APPROACH.dist)) : 1;
  p.approach = { t: 0, dirX: dx, dirZ: dz, scale };
  p.aim = null;
  p.swingQueued = false;
}

/** Which part of the run-up the player is in: 'step1' | 'step2' | 'plant' (or null). */
export function approachPhase(p) {
  const a = p.approach;
  if (!a) return null;
  if (a.t < APPROACH.step1) return 'step1';
  if (a.t < APPROACH.step1 + APPROACH.step2) return 'step2';
  return 'plant';
}

/**
 * One frame of the run-up. During the first two steps the stick bends the
 * path; once the closing step plants, the direction is locked.
 * @param {number} [mx] stick x (−1..1)
 * @param {number} [mz] stick z (−1..1)
 * @returns {null | 'step' | 'jump'} a foot landed this frame / the player took off.
 */
export function stepApproach(p, dt, court, mx = 0, mz = 0) {
  const a = p.approach;
  if (!a) return null;
  const T1 = APPROACH.step1, T2 = T1 + APPROACH.step2, T3 = T2 + APPROACH.plant;
  const prev = a.t;
  a.t += dt;
  if (a.t < T2 && Math.hypot(mx, mz) > 0.3) {
    // turn the path toward the stick, at most APPROACH_TURN rad/s
    const cur = Math.atan2(a.dirZ, a.dirX), want = Math.atan2(mz, mx);
    let diff = want - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const turn = Math.max(-APPROACH_TURN * dt, Math.min(APPROACH_TURN * dt, diff));
    a.dirX = Math.cos(cur + turn); a.dirZ = Math.sin(cur + turn);
  }
  const top = APPROACH.speed * a.scale;
  let speed;
  if (a.t < T1) speed = top * (0.55 + 0.45 * a.t / T1);              // left: accelerate
  else if (a.t < T2) speed = top * 1.05;                            // right: fastest
  else speed = top * 0.9 * Math.max(0, 1 - (a.t - T2) / APPROACH.plant); // left closes: brake + load
  p.vx = a.dirX * speed; p.vz = a.dirZ * speed;
  p.x += p.vx * dt; p.z += p.vz * dt;
  p.stride += speed * dt;
  clampPlayerOnCourt(p, court);
  if (a.t >= T3) {
    // take-off: the run turns into height, a little forward drift remains
    p.approach = null;
    p.air = true; p.jumpV = APPROACH.jumpV;
    p.vx = a.dirX * APPROACH.carry; p.vz = a.dirZ * APPROACH.carry;
    return 'jump';
  }
  if ((prev < T1 && a.t >= T1) || (prev < T2 && a.t >= T2)) return 'step';
  return null;
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
  } else if (p.air) {
    const a = Math.min(1, RESP_AIR * dt);
    p.vx += (tvx - p.vx) * a; p.vz += (tvz - p.vz) * a;
  } else {
    // on the sand: accelerate smoothly, but brake hard when the stick asks
    // for less speed or points against the run
    const v = Math.hypot(p.vx, p.vz), t = Math.hypot(tvx, tvz);
    const braking = t < v * 0.9 || tvx * p.vx + tvz * p.vz < 0;
    const a = Math.min(1, (braking ? RESP_BRAKE : RESP_GROUND) * dt);
    p.vx += (tvx - p.vx) * a; p.vz += (tvz - p.vz) * a;
    if (t === 0 && Math.hypot(p.vx, p.vz) < STOP_SPEED) { p.vx = 0; p.vz = 0; }
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
