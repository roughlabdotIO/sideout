import { SIDE_USA } from './constants.js';
import { isOnCourtSide, pickTargetLocal, targetToWorld } from './court.js';
import { DOWN_TIME, HIT_RADIUS, REACH_GROUND, faceAngle } from './players.js';
import { liftFor } from './aim.js';

// ============================================================
// SHOTS — every ball contact: human ground touches (bump, set,
// bump-set, overhead dig, free ball), dives, spikes, and the AI's
// own touches and attacks. Decides touch quality and where the
// ball goes. Pure logic: rules, ball launch, sound and sand are
// injected by the game through `ctx`.
// ============================================================

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rnd(a) { return (Math.random() * 2 - 1) * a; }

/**
 * @param {object} ctx
 * @param {object} ctx.ball             ball state (js/logic/ball.js)
 * @param {object[]} ctx.players        player states (js/logic/players.js)
 * @param {object} ctx.venue            venue with the active court (js/logic/venue.js)
 * @param {(p: object) => boolean} ctx.touch
 *   count the touch under the rules; false when it's a fault (point already awarded)
 * @param {(px:number,pz:number,tx:number,tz:number,vyUp:number,hard:boolean,power?:number,inherit?:number) => void} ctx.hit
 *   launch the ball (see launchBall)
 * @param {{ puff(x:number,z:number,n:number,pow:number):void, hitstop(t:number):void, sound(name:string):void, shot?(name:string, p:object):void }} ctx.fx
 *   feedback hooks; sound names: 'dive', 'shank', 'setDump', 'drop'.
 *   Optional `shot` names the executed shot: human 'free' | 'recv' | 'dig' |
 *   'bumpctrl' | 'ovdig' | 'bumpset' | 'set' | 'dive' | 'spike'; AI 'ai-free' |
 *   'ai-recv' | 'ai-dig' | 'ai-shank' | 'ai-dump' | 'ai-set' | 'ai-drop' | 'ai-spike'.
 */
export function createShots({ ball, players, venue, touch, hit, fx }) {
  const court = () => venue.active;
  const { wx, wz, lz, txFrom } = venue;

  /** Launch from player `p` and remember where they sent it (the body turns that way). */
  function hitBy(p, tx, tz, ...rest) {
    p.turnX = tx; p.turnZ = tz;
    hit(p.x, p.z, tx, tz, ...rest);
  }

  /** Spot in the opponent half farthest from the defenders (6 random tries). */
  function pickOpenTarget(side) {
    const opps = players.filter(p => p.side !== side);
    let best = targetToWorld(court(), pickTargetLocal(side)), bestD = -1;
    for (let i = 0; i < 6; i++) {
      const t = targetToWorld(court(), pickTargetLocal(side));
      let dmin = 1e9;
      opps.forEach(o => { dmin = Math.min(dmin, Math.hypot(o.x - t.x, o.z - t.z)); });
      if (dmin > bestD) { bestD = dmin; best = t; }
    }
    return best;
  }

  /** Ball reached while diving: desperate dig, lands the player on the sand. */
  function diveTouch(p) {
    if (!touch(p)) return;
    p.diveT = 0; p.downT = DOWN_TIME;
    p.poseKind = 'dig'; p.poseT = DOWN_TIME;
    ball.chainQ = 0.25;
    fx.hitstop(0.03);
    fx.puff(p.x, p.z, 7, 1.2);
    const tx = txFrom(p, rnd(2.4), -3.4, 3.4);
    const tz = wz(p.side, 2.0 + Math.random() * 2.5);
    hitBy(p, tx, tz, 11 + rnd(1), false, 1, 0.5);
    fx.sound('dive');
    fx.shot?.('dive', p);
  }

  /**
   * Human ground touch toward an aimed spot. The actual shot is resolved
   * from the button intent (`mode`: 'bump' | 'set' | 'auto') and the
   * incoming ball; touch quality sets how far the ball strays from `aim`.
   * @param {{ x: number, z: number }} aim world target chosen with the aim cursor
   */
  function groundTouch(p, aim, mode = 'auto') {
    const dist = Math.hypot(ball.x - p.x, ball.z - p.z);
    // forgiving near the body, harsh at the edge of the arms
    let q = Math.max(0.15, 1 - (dist / HIT_RADIUS) ** 2);
    const ivx = ball.vx, ivz = ball.vz;
    const hsp = Math.hypot(ivx, ivz);
    if (!touch(p)) return;
    p.cool = 0.35;
    p.faceA = faceAngle(p, ball.x, ball.z);
    const toAim = (errX, errZ) => ({ x: aim.x + rnd(errX), z: aim.z + rnd(errZ) });
    const lift = liftFor(aim.charge);   // held longer → higher arc, same landing spot

    // resolve the actual touch from button intent + ball state
    let kind;
    if (ball.touches >= 3) kind = 'free';
    else if (mode === 'bump') kind = (hsp > 6.0 || ball.y < 1.3) ? 'recv' : 'bumpctrl';
    else if (mode === 'set') kind = (hsp > 7.0) ? 'ovdig' : (ball.y < 1.35 ? 'bumpset' : 'set');
    else kind = (hsp > 6.0 || ball.y < 1.3) ? 'recv' : 'set';

    fx.shot?.(kind === 'recv' && hsp > 9 ? 'dig' : kind, p);
    let t;
    if (kind === 'free') {
      // third touch from the ground = safe free ball over
      p.poseKind = 'bump'; p.poseT = 0.18;
      t = toAim(1.2, 1.0);
      hitBy(p, t.x, t.z, 9 * lift, false, 1, 0.12);
    } else if (kind === 'recv') {
      ball.chainQ = q;
      const hard = hsp > 9;
      p.poseKind = hard ? 'dig' : 'bump'; p.poseT = 0.2;
      const give = hard ? 0.12 : 0.07;
      p.vx += ivx * give; p.vz += ivz * give;
      if (hard) {
        fx.puff(p.x, p.z, 6, 1.1);
        t = toAim((1 - q) * 1.6, (1 - q) * 1.2);
        hitBy(p, t.x, t.z, 12 * lift, false, 1, Math.min(0.45, (1 - q) * 0.5));
      } else {
        t = toAim((1 - q) * 1.8, (1 - q) * 0.9);
        hitBy(p, t.x, t.z, 10.5 * lift, false, 1, Math.min(0.5, (1 - q) * 0.55));
      }
    } else if (kind === 'bumpctrl') {
      // controlled bump on an easy ball: legit, a touch less precise than a set
      ball.chainQ = (ball.chainQ + q * 0.92) / 2;
      p.poseKind = 'bump'; p.poseT = 0.2;
      t = toAim((1 - q) * 1.4, (1 - q) * 0.8);
      hitBy(p, t.x, t.z, 10.8 * lift, false, 1, (1 - q) * 0.3);
    } else if (kind === 'ovdig') {
      // hands on a driven ball: badly punished control
      q *= 0.5;
      ball.chainQ = q;
      p.poseKind = 'set'; p.poseT = 0.2;
      p.vx += ivx * 0.1; p.vz += ivz * 0.1;
      fx.puff(p.x, p.z, 4, 0.9);
      t = toAim((1 - q) * 1.8, 1.0);
      hitBy(p, t.x, t.z, 11.5 * lift, false, 1, Math.min(0.5, (1 - q) * 0.5));
    } else if (kind === 'bumpset') {
      // ALZATA IN BAGHER: the low-ball set variant — platform arms,
      // same set trajectory, slightly less precise than clean hands
      ball.chainQ = (ball.chainQ + q * 0.9) / 2;
      p.poseKind = 'bump'; p.poseT = 0.22;
      t = toAim((1 - q) * 1.3, (1 - q) * 0.4);
      hitBy(p, t.x, t.z, 11.5 * lift, false, 1, (1 - q) * 0.3);
    } else {
      // clean overhead SET
      p.poseKind = 'set'; p.poseT = 0.22;
      ball.chainQ = (ball.chainQ + q) / 2;
      t = toAim((1 - q) * 1.2, (1 - q) * 0.3);
      hitBy(p, t.x, t.z, 11.5 * lift, false, 1, (1 - q) * 0.25);
    }
    ball.aftertouch = 0;   // the aim cursor is the control: no curving after contact
  }

  /**
   * Human spike while airborne: quality from jump timing and height;
   * stick up/down picks a deep or short attack, left/right the angle.
   */
  function trySpike(p, mx, mz) {
    const dist = Math.hypot(ball.x - p.x, ball.z - p.z);
    if (dist > 1.35) return;
    if (ball.y < 1.4 || ball.y > p.jumpH + 3.2) return;
    if (!touch(p)) return;
    p.cool = 0.4;
    p.faceA = faceAngle(p, ball.x, ball.z);
    const hitH = p.jumpH + 2.2;
    const timing = Math.max(0.1, 1 - Math.abs(ball.y - hitH) / 1.3);
    const apexQ = Math.min(1, p.jumpH / 1.1);
    const q = timing * apexQ * (0.7 + 0.3 * ball.chainQ);
    const depth = mz < 0 ? 3.6 : mz > 0 ? 0.6 : 2.0;
    const tz = wz(-p.side, 1.4 + depth + rnd((1 - q) * 1.6));
    const tx = txFrom(p, mx * 3.4 + rnd((1 - q) * 2.2), -3.6, 3.6);
    hitBy(p, tx, tz, 1.7, true, 0.78 + 0.5 * q, 0.05);
    p.poseKind = 'spikeHit'; p.poseT = 0.28;   // arm whips down after contact
    fx.shot?.('spike', p);
    if (p.side === SIDE_USA) ball.aftertouch = 0.6;
  }

  /** AI ground touch: free ball on the 3rd, reception/dig on the 1st, set on the 2nd. */
  function aiGround(p) {
    const dist = Math.hypot(ball.x - p.x, ball.z - p.z);
    const ivx = ball.vx, ivz = ball.vz;
    const hspIn = Math.hypot(ivx, ivz);
    let q = Math.max(0.3, 1 - dist / HIT_RADIUS) * (0.75 + Math.random() * 0.25);
    q *= clamp(1 - (hspIn - 8) * 0.045, 0.55, 1);
    if (!touch(p)) return;
    p.cool = 0.5;
    p.faceA = faceAngle(p, ball.x, ball.z);
    const hard = hspIn > 9;
    const mate = players.find(m => m.side === p.side && m !== p);
    if (ball.touches >= 3) {
      p.poseKind = 'bump'; p.poseT = 0.18;
      const t = pickOpenTarget(p.side);
      hitBy(p, t.x + rnd(1.2), t.z + rnd(1.2), 9, false, 1, 0.12);
      fx.shot?.('ai-free', p);
    } else if (ball.touches === 1) {
      p.poseKind = hard ? 'dig' : 'bump'; p.poseT = 0.2;
      const give = (hard ? 0.12 : 0.07);
      p.vx += ivx * give; p.vz += ivz * give;
      if (hard) fx.puff(p.x, p.z, 6, 1.1);
      const shank = Math.random() < (hspIn > 9 ? 0.14 : 0.05);
      if (shank) {
        ball.chainQ = 0.2;
        hitBy(p, txFrom(p, rnd(3.2), -4.2, 4.2), wz(p.side, 1.0 + Math.random() * 4) + rnd(1.5), 10 + rnd(2), false, 1, 0.5);
        fx.sound('shank');
        fx.shot?.('ai-shank', p);
      } else if (hard) {
        // defensive dig: pop it high near the spot, weight back
        ball.chainQ = q;
        const tx = txFrom(p, rnd((1 - q) * 1.6), -3.4, 3.4);
        const tz = wz(p.side, clamp(Math.abs(lz(p.z)) - 1.5 + rnd((1 - q) * 1.2), 1.2, court().half - 0.8));
        hitBy(p, tx, tz, 12, false, 1, Math.min(0.45, (1 - q) * 0.5));
        fx.shot?.('ai-dig', p);
      } else {
        ball.chainQ = q;
        hitBy(p, txFrom(p, p.x * 0.4 - (p.x - court().centerX) * 0.6 + rnd((1 - q) * 1.6), -2.4, 2.4), wz(p.side, 1.7 + rnd((1 - q) * 0.8)), 10.5, false, 1, Math.min(0.5, (1 - q) * 0.55));
        fx.shot?.('ai-recv', p);
      }
    } else {
      // second touch near the net: sometimes dump it over on two
      if (Math.abs(p.z) < 2.6 && ball.y > 1.6 && Math.random() < 0.15) {
        p.poseKind = 'set'; p.poseT = 0.22;
        const t = pickOpenTarget(p.side);
        hitBy(p, t.x + rnd(1.0), t.z + rnd(1.0), 5.5, false, 0.95, 0.08);
        fx.sound('setDump');
        fx.shot?.('ai-dump', p);
        return;
      }
      p.poseKind = 'set'; p.poseT = 0.22;
      ball.chainQ = (ball.chainQ + q) / 2;
      let sz = wz(p.side, 1.25);
      if (Math.random() < 0.10) { sz = wz(p.side, 0.55 + Math.random() * 0.3); ball.chainQ *= 0.8; }
      hitBy(p, wx(clamp(mate.x - court().centerX + rnd((1 - q) * 0.8), -2.6, 2.6)), sz, 11.5, false, 1, (1 - q) * 0.25);
      fx.shot?.('ai-set', p);
    }
  }

  /** AI attack: a drop shot on poor sets, otherwise a spike at an open spot. */
  function aiSpike(p) {
    if (!touch(p)) return;
    p.cool = 0.5;
    p.faceA = faceAngle(p, ball.x, ball.z);
    p.poseKind = 'spikeHit'; p.poseT = 0.28;   // follow-through
    const timing = Math.max(0.2, 1 - Math.abs(ball.y - (p.jumpH + 2.2)) / 1.3);
    const q = timing * (0.6 + Math.random() * 0.35) * (0.7 + 0.3 * ball.chainQ);
    const dropProb = 0.18 + (1 - ball.chainQ) * 0.25;
    if (Math.random() < dropProb) {
      const tx = txFrom(p, rnd(2.0), -3.2, 3.2);
      const tz = wz(-p.side, 1.1 + Math.random() * 0.9);
      hitBy(p, tx, tz, 4.6, false, 0.9, 0.03);
      fx.sound('drop');
      fx.shot?.('ai-drop', p);
      return;
    }
    const t = pickOpenTarget(p.side);
    if (Math.random() < 0.15) { t.x = wx(Math.sign(t.x - court().centerX || 1) * (court().width / 2 - 0.15 + rnd(0.5))); }
    hitBy(p, t.x + rnd((1 - q) * 2), t.z + rnd((1 - q) * 2), 1.7, true, 0.78 + 0.5 * q, 0.05);
    fx.shot?.('ai-spike', p);
  }

  /**
   * Per-frame contact timers: pose hold, wind-up resolving into a ground
   * touch, dive reaching the ball (or ending face down), recovery.
   */
  function stepActions(dt) {
    players.forEach(p => {
      if (p.poseT > 0) p.poseT -= dt;
      if (p.windup > 0) {
        p.windup -= dt;
        p.faceA = faceAngle(p, ball.x, ball.z);   // track the ball while coiling
        if (p.windup <= 0) {
          const dist = Math.hypot(ball.x - p.x, ball.z - p.z);
          if (ball.live && dist < HIT_RADIUS * 1.3 && ball.y < REACH_GROUND + 0.2 && ball.lastToucher !== p) {
            if (p.wKind === 'human') groundTouch(p, p.wAim || { x: p.x, z: wz(p.side, 1.5) }, p.wMode || 'auto');
            else aiGround(p);
          } else {
            p.cool = Math.max(p.cool, 0.18);
          }
        }
      }
      if (p.diveT > 0) {
        p.diveT -= dt;
        const dist = Math.hypot(ball.x - p.x, ball.z - p.z);
        if (ball.live && dist < 1.05 && ball.y < 1.7 && ball.lastToucher !== p && isOnCourtSide(ball.z, p.side, court())) {
          diveTouch(p);
        } else if (p.diveT <= 0) {
          p.downT = DOWN_TIME;
        }
      } else if (p.downT > 0) {
        p.downT -= dt;
      }
    });
  }

  return { pickOpenTarget, trySpike, aiSpike, stepActions };
}
