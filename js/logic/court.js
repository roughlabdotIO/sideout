import {
  COURT_W,
  COURT_L,
  HALF,
  NET_H,
  COURT_MARGIN,
  COURT_RULES,
  PLAYER_HOMES_LOCAL,
} from './constants.js';

// ============================================================
// COURT — a playing court as pure data + geometry rules.
// No meshes here: js/view/court/ draws a court from this object.
// ============================================================

/**
 * @typedef {Object} Court
 * @property {string} id
 * @property {string} type
 * @property {number} centerX
 * @property {number} centerZ
 * @property {number} width
 * @property {number} length
 * @property {number} half
 * @property {number} netH
 * @property {boolean} playable
 * @property {boolean} hasOfficials
 * @property {number} footprintW
 * @property {number} footprintL
 * @property {(lx: number, lz: number) => { x: number, z: number }} toWorld
 * @property {(x: number, z: number) => { x: number, z: number }} toLocal
 * @property {(side: number, offset: number) => number} localSideZ
 * @property {(lx: number, lz: number) => boolean} containsLocal
 * @property {(x: number, z: number) => boolean} containsWorld
 * @property {() => number[][]} getPlayerHomesWorld
 */

/**
 * @param {string} type COURT_TYPE value
 * @param {{ id: string, centerX?: number, centerZ?: number }} opts
 * @returns {Court}
 */
export function createCourt(type, { id, centerX = 0, centerZ = 0 }) {
  const toWorld = (lx, lz) => ({ x: centerX + lx, z: centerZ + lz });
  const toLocal = (x, z) => ({ x: x - centerX, z: z - centerZ });
  const localSideZ = (side, offset) => centerZ + side * offset;
  const containsLocal = (lx, lz) =>
    Math.abs(lx) <= COURT_W / 2 + COURT_MARGIN &&
    Math.abs(lz) <= HALF + COURT_MARGIN;
  const containsWorld = (x, z) => {
    const l = toLocal(x, z);
    return containsLocal(l.x, l.z);
  };
  const getPlayerHomesWorld = () =>
    PLAYER_HOMES_LOCAL.map(([lx, lz]) => [centerX + lx, centerZ + lz]);

  return {
    id,
    type,
    centerX,
    centerZ,
    width: COURT_W,
    length: COURT_L,
    half: HALF,
    netH: NET_H,
    ...COURT_RULES[type],
    toWorld,
    toLocal,
    localSideZ,
    containsLocal,
    containsWorld,
    getPlayerHomesWorld,
  };
}

/**
 * True when (x, z) lands inside a court (+ small margin).
 * Defaults to the main court centered at the origin.
 * @param {number} x
 * @param {number} z
 * @param {Court | null} [court]
 */
export function inCourt(x, z, court = null) {
  if (court) return court.containsWorld(x, z);
  return (
    Math.abs(x) <= COURT_W / 2 + COURT_MARGIN &&
    Math.abs(z) <= HALF + COURT_MARGIN
  );
}

/** Which team side owns world Z relative to the court net line. */
export function courtSideAtZ(z, court) {
  const rel = z - court.centerZ;
  if (rel === 0) return 1;
  return Math.sign(rel);
}

/** True when an entity is on the given team's half of the court. */
export function isOnCourtSide(z, side, court) {
  return courtSideAtZ(z, court) === side;
}

/**
 * Keep a player on their own half of the active court, inside the run-off:
 * 0.55 from the net up to 1.2 past the end line, 1.5 past the sidelines.
 */
export function clampPlayerOnCourt(p, court) {
  const halfW = court.width / 2 + 1.5;
  const lx = p.x - court.centerX;
  p.x = court.centerX + Math.max(-halfW, Math.min(halfW, lx));

  const depth = (p.z - court.centerZ) * p.side;   // distance from the net into own half
  p.z = court.localSideZ(p.side, Math.max(0.55, Math.min(court.half + 1.2, depth)));
}

/**
 * Ball crossing the net line of the active court this frame.
 * @returns {{ hAt: number, blocked: boolean, tapeClip?: boolean } | null}
 *   null: no crossing, or the ball clears the net;
 *   blocked: passes outside the antennas (dies on the hitter's side);
 *   otherwise below the top of the net: tapeClip = grazes the band, else into the net.
 */
export function netCrossEvent(prevZ, z, ballX, ballY, ballVy, dt, court) {
  const prevRel = prevZ - court.centerZ;
  const curRel = z - court.centerZ;
  if (Math.sign(prevRel) === Math.sign(curRel) || prevRel === 0) return null;
  const t = Math.abs(prevRel) / (Math.abs(prevRel) + Math.abs(curRel));
  const hAt = ballY - ballVy * dt * (1 - t);
  if (Math.abs(ballX - court.centerX) >= court.width / 2 + 0.4) return { hAt, blocked: true };
  if (hAt >= court.netH) return null;   // clears the net
  return { hAt, blocked: false, tapeClip: hAt > court.netH - 0.22 };
}

/** Random target in the opponent half, court-local (for AI / attacks). */
export function pickTargetLocal(side, rnd = () => (Math.random() * 2 - 1)) {
  return {
    lx: rnd() * (COURT_W / 2 - 0.7),
    lz: -side * (1.2 + Math.random() * (HALF - 2.0)),
  };
}

export function targetToWorld(court, { lx, lz }) {
  return court.toWorld(lx, lz);
}
