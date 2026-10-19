import { HIT_RADIUS, REACH_GROUND, WINDUP, faceAngle } from './players.js';
import { isOnCourtSide, courtSideAtZ } from './court.js';
import { landingPoint, BALL_G } from './ball.js';

// ============================================================
// AIM — "plant and aim" ground touches for the human player.
// Pressing an action button while the ball is coming plants the
// player and shows an aim cursor; the arrows then move only the
// cursor, and the touch fires on its own when the ball comes into
// reach, toward the cursor (js/logic/shots.js adds the error).
// ============================================================

/** Cursor speed while an arrow is held (world units / s). */
export const AIM_SPEED = 9;
/** Holding the action button this long charges a full-height touch (s). */
export const CHARGE_TIME = 0.8;
/** Upward launch speed multiplier: quick tap → full charge. */
const LIFT_MIN = 0.8, LIFT_MAX = 1.35;

/**
 * How much higher than the shot's base arc the ball is sent for a given charge.
 * @param {number} [charge] 0..1; undefined (no aim, e.g. AI) → base arc (1)
 */
export function liftFor(charge) {
  return charge === undefined ? 1 : LIFT_MIN + (LIFT_MAX - LIFT_MIN) * charge;
}
/** Give up aiming after this long without a contact (s). */
export const AIM_TIMEOUT = 3;
/** The touch fires once the ball is in reach and at or below this height. */
const CONTACT_Y = { bump: 1.6, set: REACH_GROUND, auto: REACH_GROUND };
/** Ball this close to the body = clean touch, fire right away. */
const SWEET_SPOT = 0.45;
/** Lowest playable ball height. */
const LOW_LIMIT = 0.25;
/** Cursor margin inside the lines and from the net. */
const AIM_MARGIN = 0.3;
const AIM_NET_GAP = 0.6;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Touches the player's team has already made on this ball. */
function teamTouches(p, ball) {
  return ball.lastSide === p.side ? ball.touches : 0;
}

/** Ball live, not just played by `p`, and on or headed for `p`'s half. */
export function ballComingTo(p, ball, court) {
  if (!ball.live || ball.lastToucher === p) return false;
  return isOnCourtSide(ball.z, p.side, court) ||
    courtSideAtZ(landingPoint(ball).z, court) === p.side;
}

/** Keep the cursor inside the half it aims at. */
function clampAim(aim, court) {
  const halfW = court.width / 2 - AIM_MARGIN;
  aim.x = clamp(aim.x, court.centerX - halfW, court.centerX + halfW);
  const depth = clamp((aim.z - court.centerZ) * aim.side, AIM_NET_GAP, court.half - AIM_MARGIN);
  aim.z = court.localSideZ(aim.side, depth);
}

/**
 * Plant `p` and open the aim cursor at the natural target for this touch:
 * reception → toward the setter's zone, second touch → set zone at the net,
 * third touch → middle of the opponent half.
 * @param {'bump'|'set'|'auto'} mode
 */
export function startAim(p, ball, court, mode) {
  const n = teamTouches(p, ball);
  const over = n >= 2;
  const side = over ? -p.side : p.side;
  let x, depth;
  if (over) { x = court.centerX; depth = court.half * 0.55; }
  else if (n === 1) { x = p.x; depth = 1.25; }
  else { x = court.centerX + (p.x - court.centerX) * 0.3; depth = 1.8; }
  // charge: grows while the button stays held, freezes once released
  p.aim = { mode, side, x, z: court.localSideZ(side, depth), t: 0, charge: 0, holding: true };
  clampAim(p.aim, court);
}

/** Second press within this time = double tap (dive). */
export const DOUBLE_TAP = 0.3;
/** A dive can reach a landing point up to this far away. */
export const DIVE_RANGE = 3.2;

/** The ball is coming down on `p`'s half within diving range of them. */
export function canDive(p, ball, court) {
  if (!ballComingTo(p, ball, court)) return false;
  const lp = landingPoint(ball);
  return courtSideAtZ(lp.z, court) === p.side && Math.hypot(lp.x - p.x, lp.z - p.z) <= DIVE_RANGE;
}

/** Count down the double-tap window (call every frame for the human player). */
export function tickTap(p, dt) {
  if (p.tapT > 0) p.tapT -= dt;
}

/**
 * Action button pressed on the sand.
 * - first press: plant and open the aim cursor;
 * - second press within DOUBLE_TAP, ball falling within DIVE_RANGE: dive;
 * - a later press while aiming: cancel the aim.
 * @returns {'aim' | 'dive' | 'cancel' | 'none'}
 *   none: no ball to play.
 */
export function pressAction(p, ball, court, mode) {
  const doubleTap = p.tapT > 0;
  p.tapT = DOUBLE_TAP;
  if (doubleTap && canDive(p, ball, court)) {
    p.aim = null; p.tapT = 0;
    return 'dive';
  }
  if (p.aim) { p.aim = null; return 'cancel'; }
  if (!ballComingTo(p, ball, court)) return 'none';
  startAim(p, ball, court, mode);
  return 'aim';
}

/** Height at which a spike is hit, coming down (≈ jump apex + arm reach). */
const ATTACK_H = 3.3;
/** Take off this far short of the hitting point, so the ball is in front. */
const TAKEOFF_GAP = 0.4;

/**
 * Where to run up to for an attack: the spot under the ball when, coming
 * down, it reaches hitting height (stopping a little short of it). With no
 * ball to hit, straight toward the net.
 */
export function attackPoint(p, ball, court) {
  const ours = ball.live && (isOnCourtSide(ball.z, p.side, court) ||
    courtSideAtZ(landingPoint(ball).z, court) === p.side);
  if (!ours) return { x: p.x, z: court.localSideZ(p.side, 1.2) };
  let hx = null, hz = null;
  for (let t = 0; t < 3; t += 0.02) {
    const y = ball.y + ball.vy * t - 0.5 * BALL_G * t * t;
    if (ball.vy - BALL_G * t < 0 && y <= ATTACK_H) { hx = ball.x + ball.vx * t; hz = ball.z + ball.vz * t; break; }
  }
  if (hx === null) { const lp = landingPoint(ball); hx = lp.x; hz = lp.z; }
  const dx = hx - p.x, dz = hz - p.z, d = Math.hypot(dx, dz);
  if (d <= TAKEOFF_GAP) return { x: p.x, z: p.z };
  return { x: hx - dx / d * TAKEOFF_GAP, z: hz - dz / d * TAKEOFF_GAP };
}

/**
 * One frame of aiming: move the cursor with the stick, charge the height
 * while the action button is held, and fire the touch when the ball comes
 * into reach.
 * @param {boolean} held the button that opened the aim is still down
 * @returns {'contact' | 'cancel' | null}
 *   contact: the wind-up toward the cursor has started (p.wAim set);
 *   cancel: the ball can't be played any more.
 */
export function stepAim(p, ball, court, mx, mz, dt, held = false) {
  const a = p.aim;
  if (!a) return null;
  a.t += dt;
  if (!held) a.holding = false;
  if (a.holding) a.charge = Math.min(1, a.charge + dt / CHARGE_TIME);
  a.x += mx * AIM_SPEED * dt;
  a.z += mz * AIM_SPEED * dt;
  clampAim(a, court);
  if (a.t > AIM_TIMEOUT || !ballComingTo(p, ball, court)) { p.aim = null; return 'cancel'; }
  p.faceA = faceAngle(p, ball.x, ball.z);

  const dist = Math.hypot(ball.x - p.x, ball.z - p.z);
  // where the ball will be when the wind-up resolves: fire at the closest
  // approach (clean touch), not the moment it enters reach (edge of the arms)
  const bx = ball.x + ball.vx * WINDUP, bz = ball.z + ball.vz * WINDUP;
  const by = ball.y + ball.vy * WINDUP - 0.5 * BALL_G * WINDUP * WINDUP;
  const dPred = Math.hypot(bx - p.x, bz - p.z);
  const descending = ball.vy < 0 || ball.y < 1.0;
  const inReach = dPred < HIT_RADIUS && by <= CONTACT_Y[a.mode] && by > LOW_LIMIT &&
    descending && isOnCourtSide(ball.z, p.side, court);
  const best = dPred < SWEET_SPOT || dPred >= (a.lastPred ?? Infinity) || by < LOW_LIMIT + 0.35;
  a.lastPred = dPred;
  if (inReach && best) {
    p.windup = WINDUP; p.wKind = 'human'; p.wMode = a.mode;
    p.wAim = { x: a.x, z: a.z, charge: a.charge }; p.wmx = 0; p.wmz = 0;
    p.aim = null;
    return 'contact';
  }
  // ball dropping past, out of reach: give up so the player can move again
  if (ball.y < 1.0 && dist > HIT_RADIUS * 1.6) {
    const lp = landingPoint(ball);
    if (Math.hypot(lp.x - p.x, lp.z - p.z) > HIT_RADIUS * 1.6) { p.aim = null; return 'cancel'; }
  }
  return null;
}
