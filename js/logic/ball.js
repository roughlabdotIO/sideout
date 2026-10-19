import { netCrossEvent } from './court.js';

// ============================================================
// BALL — state and flight physics. Knows nothing about score,
// sound or input: stepBall() reports what happened and the game
// decides points, whistles and sand puffs.
// ============================================================

/** Gravity acting on the ball (world units / s²). */
export const BALL_G = 22;

/** Positions kept for the trail ghosts (most recent first). */
const TRAIL_LEN = 14;

/** Lateral push per second while aftertouch is active. */
const AFTERTOUCH_PUSH = 13;

function rnd(a) { return (Math.random() * 2 - 1) * a; }

/**
 * @param {number} startSide team side that serves first (±1)
 */
export function createBall(startSide) {
  return {
    x: 0, y: 1, z: 6.5, vx: 0, vy: 0, vz: 0, live: false,
    // rally bookkeeping read and written by the game rules
    lastSide: startSide, touches: 0, lastToucher: null, chainQ: 0.7,
    // spin & float serve
    spin: 0, spinRate: 0, wobble: false,
    /** Seconds left in which the human can curve the ball sideways. */
    aftertouch: 0,
    /** Contact squash frames right after a hit (visual). */
    squashT: 0,
    /** Recent positions for the trail ghosts. */
    hist: [],
  };
}

/** Dead ball between points: clears flight-only state. */
export function resetBall(ball) {
  ball.live = false;
  ball.aftertouch = 0;
  ball.squashT = 0;
  ball.hist.length = 0;
}

/**
 * Launch the ball from (px,pz) so it lands on (tx,tz) after rising at vyUp.
 * @param {boolean} hard spike / hard-driven ball (more spin)
 * @param {number} power scales the horizontal speed (<1 falls short)
 * @param {number} inherit 0..1 share of the incoming velocity kept (sloppy touches)
 */
export function launchBall(ball, px, pz, tx, tz, vyUp, hard, power = 1, inherit = 0) {
  const inVx = ball.vx, inVz = ball.vz;
  const y0 = Math.max(ball.y, 0.2);
  const T = (vyUp + Math.sqrt(vyUp * vyUp + 2 * BALL_G * y0)) / BALL_G;
  ball.vx = ((tx - px) / T * power) * (1 - inherit) + inVx * inherit;
  ball.vz = ((tz - pz) / T * power) * (1 - inherit) + inVz * inherit;
  ball.vy = vyUp;
  ball.live = true;
  // spin: spikes rip, soft touches roll; sign follows the lateral direction
  const sgn = Math.sign(ball.vx || ((Math.random() < 0.5) ? 1 : -1));
  ball.spinRate = (hard ? 15 : 6.5) * sgn * (0.7 + Math.random() * 0.5);
  ball.wobble = false;   // float serves opt back in after the call
  ball.squashT = 0.07;
}

/** Float serve: almost no spin, the ball knuckles in flight. */
export function makeFloat(ball) {
  ball.spinRate = 1.2 * Math.sign(rnd(1) || 1);
  ball.wobble = true;
}

/** Where and in how many seconds the ball reaches the sand. */
export function landingPoint(ball) {
  if (!ball.live) return { x: ball.x, z: ball.z, t: 0 };
  const a = -0.5 * BALL_G, b = ball.vy, c = ball.y;
  const disc = b * b - 4 * a * c;
  const t = (-b - Math.sqrt(Math.max(disc, 0))) / (2 * a);
  return { x: ball.x + ball.vx * t, z: ball.z + ball.vz * t, t };
}

/**
 * Advance the ball one frame.
 * @param {number} steer aftertouch input: -1 left, 0 none, 1 right
 * @returns {{ net: null | 'tape' | 'body', landed: boolean }}
 *   net: 'tape' = clipped the band and stays live, 'body' = into the net;
 *   landed: touched the sand this frame (ball is now dead).
 */
export function stepBall(ball, dt, court, steer = 0) {
  const ev = { net: null, landed: false };
  if (!ball.live) return ev;
  if (ball.aftertouch > 0) {
    ball.aftertouch -= dt;
    ball.vx += steer * AFTERTOUCH_PUSH * dt;
    ball.spinRate += steer * 30 * dt;
  }
  // spin: integrate rotation, bleed off slowly with the air
  ball.spin += ball.spinRate * dt;
  ball.spinRate -= ball.spinRate * 0.25 * dt;
  // float-serve knuckle: a no-spin ball drifts unpredictably
  if (ball.wobble && Math.hypot(ball.vx, ball.vz) > 5) {
    ball.vx += rnd(4.5) * dt;
  }
  const hsp = Math.hypot(ball.vx, ball.vz);
  const k = Math.min(0.9, 0.015 * hsp);
  ball.vx -= ball.vx * k * dt;
  ball.vz -= ball.vz * k * dt;

  const prevZ = ball.z;
  ball.vy -= BALL_G * dt;
  ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  ball.y += ball.vy * dt;

  const netEvt = netCrossEvent(prevZ, ball.z, ball.x, ball.y, ball.vy, dt, court);
  if (netEvt) {
    if (netEvt.tapeClip) {
      // NET CORD: clipped the tape — the ball is LIVE (beach rule):
      // it bleeds speed, pops off the band and usually dribbles over
      ball.vz *= (0.18 + Math.random() * 0.3);
      if (Math.random() < 0.25) ball.vz *= -0.6;   // sometimes it falls back
      ball.vx *= 0.7;
      ball.vy = 1.2 + rnd(1.2);
      ball.spinRate *= 0.4;
      ball.wobble = false;
      ev.net = 'tape';
    } else {
      // into the body of the net: dies on the hitter's side
      const prevRel = prevZ - court.centerZ;
      ball.z = court.centerZ + prevRel * 0.15 + Math.sign(prevRel) * 0.12;
      ball.vz *= -0.25; ball.vx *= 0.5; ball.vy = Math.min(ball.vy, 0);
      ev.net = 'body';
    }
  }

  if (ball.y <= 0) {
    ball.y = 0;
    ball.live = false;
    ev.landed = true;
  }
  return ev;
}

/** Store the current position for the trail ghosts. */
export function recordTrail(ball) {
  ball.hist.unshift({ x: ball.x, z: ball.z, y: ball.y });
  if (ball.hist.length > TRAIL_LEN) ball.hist.pop();
}
