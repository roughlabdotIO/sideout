import {
  PLAYER_SPEED, movePlayer, isBusy, startJump, startDive,
  startApproach, stepApproach,
} from './players.js';
import { pressAction, stepAim, tickTap, attackPoint } from './aim.js';
import { landingPoint } from './ball.js';

// ============================================================
// HUMAN CONTROL — what the player's buttons do, shared by the
// game and the shot lab. Pure logic: feedback (sound, sand) goes
// through ctx.fx, the serve is handled by the game before this.
//
//   arrows        run · while planted: move the aim cursor
//   BUMP/SET/AUTO plant & aim (hold = higher touch) · double tap = dive
//   ATTACK        three-step run-up (arrows: path, else toward the ball) and jump
//                 · again in the air = spike
//                 (pressed during the run-up: swings by itself at the right height)
// ============================================================

/** Queued swing fires once the ball is this close to the ideal contact height. */
const SWING_WINDOW = 0.1;

/**
 * @param {object} p the human-controlled player
 * @param {{ mx:number, mz:number, bump:boolean, set:boolean, atk:boolean, auto:boolean,
 *           held:(mode:string)=>boolean }} input
 *   stick (−1..1), button presses this frame (edges), and whether the button
 *   that opened the aim is still held
 * @param {number} dt
 * @param {{ ball:object, court:object, shots:object, canAct:boolean,
 *           fx:{ step(p:object):void, jump(p:object):void, dive(p:object):void } }} ctx
 *   canAct: the rally is on (buttons do something)
 */
export function updateHumanControl(p, input, dt, ctx) {
  const { ball, court, shots, fx } = ctx;
  const { mx, mz } = input;
  tickTap(p, dt);

  // --- body: run-up, planted aiming, or free running ---
  if (p.approach) {
    const ev = stepApproach(p, dt, court, mx, mz);   // arrows steer the run-up
    if (ev === 'step') fx.step(p);
    else if (ev === 'jump') fx.jump(p);
  } else if (p.aim) {
    movePlayer(p, 0, 0, dt, court);
    stepAim(p, ball, court, mx, mz, dt, input.held(p.aim.mode));
  } else {
    const maxSp = PLAYER_SPEED * (p.air ? 0.3 : 1);
    movePlayer(p, mx * maxSp, mz * maxSp, dt, court);
  }
  p.cool = Math.max(0, p.cool - dt);

  // --- swing queued during the run-up: hit when the ball reaches the hand ---
  if (p.swingQueued) {
    if (!p.air && !p.approach) p.swingQueued = false;   // landed without a chance
    else if (p.air && p.cool <= 0) {
      const dist = Math.hypot(ball.x - p.x, ball.z - p.z);
      const ideal = p.jumpH + 2.2;
      const inWindow = ball.live && dist < 1.35 && ball.y > 1.4 && ball.y < p.jumpH + 3.2;
      if (inWindow && (ball.y <= ideal + SWING_WINDOW || p.jumpV < -1)) {
        p.swingQueued = false;
        shots.trySpike(p, mx, mz);
      }
    }
  }

  if (!ctx.canAct) return;
  if (!(input.bump || input.set || input.atk || input.auto)) return;

  // during the run-up only the swing can be queued
  if (p.approach) {
    if (input.atk || input.auto) p.swingQueued = true;
    return;
  }
  if (p.cool > 0 || isBusy(p)) return;

  if (p.air) {
    if (input.atk || input.auto) { p.swingQueued = false; shots.trySpike(p, mx, mz); }
    return;
  }

  if (input.atk) {
    startApproach(p, attackPoint(p, ball, court), { mx, mz });   // arrows pick the path
    fx.step(p);                                    // first (left) foot pushes off
    return;
  }

  const mode = input.bump ? 'bump' : input.set ? 'set' : 'auto';
  const r = pressAction(p, ball, court, mode);
  if (r === 'dive') {
    startDive(p, landingPoint(ball));
    fx.dive(p);
  } else if (r === 'none') {
    // smart button with nothing to receive: a standing jump near the net / under a high ball
    const dist = Math.hypot(ball.x - p.x, ball.z - p.z);
    if (mode === 'auto' && (Math.abs(p.z - court.centerZ) < 3.8 || (ball.y > 2.3 && dist < 1.6))) {
      if (startJump(p)) fx.jump(p);
    } else {
      p.cool = 0.12;   // swung at nothing
    }
  }
}
