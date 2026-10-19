import { SIDE_USA, SIDE_SWE } from './constants.js';
import { inCourt, courtSideAtZ } from './court.js';
import { resetBall } from './ball.js';

// ============================================================
// MATCH — rules of the game: phases, score, service order,
// touch count, who wins a rally. Pure logic: functions return
// what happened and the game shows banners and blows whistles.
// ============================================================

/** Points needed to win the match. */
export const WIN_SCORE = 15;
/** Seconds the server has after the whistle (delay-of-service rule). */
export const SERVE_LIMIT = 8;
/** Seconds players get to set up before the referee whistles. */
export const SERVE_PREP = 3;
/** Pause after a point before the next serve. */
export const POINT_PAUSE = 1.6;

/**
 * Match phases: 'serve' (waiting for the serve) → 'rally' → 'point'
 * (short pause) → 'serve' … → 'over'.
 */
export function createMatch() {
  return {
    score: { usa: 0, swe: 0 },
    state: 'serve',
    servingSide: SIDE_USA,
    pointTimer: 0,
    /** 'prep' (getting ready) → 'go' (whistle blown). */
    servePhase: 'prep',
    prepTimer: SERVE_PREP,
    serveTimer: SERVE_LIMIT,
    /** AI waits at least this long after the whistle before serving. */
    aiServeAt: 2,
    /** Player serving this point. */
    server: null,
    /** Which of the two team-mates serves next, per team. */
    serveRot: { usa: 0, swe: 0 },
    lastServeSide: null,
    /** Winning side once state is 'over'. */
    winner: null,
  };
}

/** Back to 0–0, USA serving. Call setupServe() after. */
export function resetScore(m) {
  m.score = { usa: 0, swe: 0 };
  m.servingSide = SIDE_USA;
}

/**
 * Line everyone up for the next serve on `court`: players back home, server
 * behind the end line, partner at the net, ball in the server's hands.
 * Ends the match instead when a team has reached WIN_SCORE.
 */
export function setupServe(m, players, ball, court) {
  m.state = 'serve';
  resetBall(ball); ball.touches = 0; ball.chainQ = 0.7;
  ball.lastToucher = null;
  const homes = court.getPlayerHomesWorld();
  players.forEach((p, i) => {
    p.x = homes[i][0]; p.z = homes[i][1]; p.home = { x: homes[i][0], z: homes[i][1] };
    p.air = false; p.jumpH = 0; p.jumpV = 0; p.cool = 0;
    p.vx = 0; p.vz = 0; p.windup = 0; p.diveT = 0; p.downT = 0;
    p.poseKind = 'idle'; p.poseT = 0; p.ready = false; p.aim = null; p.wAim = null;
    p.approach = null; p.swingQueued = false; p.tapT = 0;
  });
  // fresh match: reset the service order
  if (m.score.usa === 0 && m.score.swe === 0) { m.lastServeSide = null; m.serveRot.usa = 0; m.serveRot.swe = 0; }
  // side-out: the team gaining serve alternates its server
  if (m.lastServeSide !== null && m.servingSide !== m.lastServeSide) {
    if (m.servingSide === SIDE_USA) m.serveRot.usa ^= 1; else m.serveRot.swe ^= 1;
  }
  m.lastServeSide = m.servingSide;
  const side = m.servingSide;
  const teamIdx = side === SIDE_USA ? [0, 1] : [2, 3];
  const rot = side === SIDE_USA ? m.serveRot.usa : m.serveRot.swe;
  m.server = players[teamIdx[rot]];
  const partner = players[teamIdx[1 - rot]];
  m.server.x = court.centerX + 1.5; m.server.z = court.localSideZ(side, court.half + 0.8); // behind the end line
  partner.x = court.centerX - 1.0; partner.z = court.localSideZ(side, 1.6);              // partner up at the net
  holdBallForServe(m, ball);
  ball.vx = ball.vy = ball.vz = 0;
  ball.lastSide = side;
  if (m.score.usa >= WIN_SCORE || m.score.swe >= WIN_SCORE) {
    m.state = 'over';
    m.winner = m.score.usa > WIN_SCORE - 1 ? SIDE_USA : SIDE_SWE;
  } else {
    m.winner = null;
    m.servePhase = 'prep'; m.prepTimer = SERVE_PREP;   // players get set first...
    m.serveTimer = SERVE_LIMIT;
    m.aiServeAt = 2 + Math.random() * 1.5;             // ...AI waits 2s+ after the whistle
  }
}

/** The ball sits in the server's hands until the serve is struck. */
export function holdBallForServe(m, ball) {
  ball.x = m.server.x; ball.z = m.server.z - m.servingSide * 0.5; ball.y = 1;
}

/** True when `side` may serve now (whistle blown). */
export function canServe(m, side) {
  return m.state === 'serve' && m.servingSide === side && m.servePhase === 'go';
}

/** True when the AI server has waited long enough after the whistle. */
export function aiReadyToServe(m) {
  return (SERVE_LIMIT - m.serveTimer) >= m.aiServeAt;
}

/** The serve has been struck by `server`: the rally starts with 1 touch. */
export function startRally(m, ball, server) {
  ball.lastSide = server.side; ball.touches = 1; ball.lastToucher = server; ball.chainQ = 0.75;
  m.state = 'rally';
}

/**
 * Count a touch by player `p`.
 * @returns {string | null} the fault ('DOUBLE TOUCH!', 'FOUR TOUCHES!') or null if legal.
 */
export function recordTouch(ball, p) {
  if (ball.lastSide !== p.side) { ball.touches = 0; ball.lastToucher = null; }
  if (ball.lastToucher === p) return 'DOUBLE TOUCH!';
  ball.touches++;
  if (ball.touches > 3) return 'FOUR TOUCHES!';
  ball.lastToucher = p;
  ball.lastSide = p.side;
  return null;
}

/** Point to `side`: it also wins the serve. */
export function awardPoint(m, side) {
  m.state = 'point'; m.pointTimer = POINT_PAUSE;
  if (side === SIDE_USA) m.score.usa++; else m.score.swe++;
  m.servingSide = side;
}

/**
 * Who wins the rally when the ball lands at its current position.
 * @returns {{ side: number, msg: string }}
 */
export function judgeLanding(ball, court) {
  if (!inCourt(ball.x, ball.z, court)) return { side: -ball.lastSide, msg: 'BALL OUT!' };
  const sideLanded = courtSideAtZ(ball.z, court) || SIDE_USA;
  return { side: -sideLanded, msg: 'SAND POINT!' };
}

/**
 * Pause after a point. @returns {boolean} true when the next serve is due.
 */
export function tickPoint(m, dt) {
  m.pointTimer -= dt;
  return m.pointTimer <= 0;
}

/**
 * Serve clock: 'prep' countdown, then the whistle, then SERVE_LIMIT seconds.
 * @returns {{ whistle: boolean, timeout: boolean }}
 *   whistle: service authorized this frame; timeout: delay of service.
 */
export function tickServe(m, dt) {
  const ev = { whistle: false, timeout: false };
  if (m.servePhase === 'prep') {
    m.prepTimer -= dt;
    if (m.prepTimer <= 0) {
      m.servePhase = 'go';
      m.serveTimer = SERVE_LIMIT;
      ev.whistle = true;
    }
  } else {
    m.serveTimer -= dt;
    if (m.serveTimer <= 0) ev.timeout = true;
  }
  return ev;
}
