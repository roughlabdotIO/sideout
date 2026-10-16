import { COURT_W, HALF, COURT_MARGIN } from './constants.js';

/**
 * True when (x, z) lands inside a court (+ small margin).
 * @param {number} x
 * @param {number} z
 * @param {import('./courtModel.js').Court | null} [court]
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

/** Keep player inside the active court run-off zone (world coords). */
export function clampPlayerOnCourt(p, court) {
  const halfW = court.width / 2 + 1.5;
  const lx = p.x - court.centerX;
  p.x = court.centerX + Math.max(-halfW, Math.min(halfW, lx));

  if (p.side === 1) {
    p.z = Math.max(court.localSideZ(1, 0.55), Math.min(court.localSideZ(1, court.half + 1.2), p.z));
  } else {
    p.z = Math.min(court.localSideZ(-1, -0.55), Math.max(court.localSideZ(-1, -(court.half + 1.2)), p.z));
  }
}

/**
 * Net crossing relative to the active court centre line.
 * @returns {{ hAt: number } | null}
 */
export function netCrossEvent(prevZ, z, ballX, ballY, ballVy, dt, court) {
  const prevRel = prevZ - court.centerZ;
  const curRel = z - court.centerZ;
  if (Math.sign(prevRel) === Math.sign(curRel) || prevRel === 0) return null;
  const t = Math.abs(prevRel) / (Math.abs(prevRel) + Math.abs(curRel));
  const hAt = ballY - ballVy * dt * (1 - t);
  if (hAt >= court.netH || Math.abs(ballX - court.centerX) >= court.width / 2 + 0.4) {
    return { hAt, blocked: true };
  }
  return { hAt, blocked: false, tapeClip: hAt > court.netH - 0.22 };
}

/** World target in the opponent half (for AI / attacks). */
export function pickTargetLocal(side, rnd = () => (Math.random() * 2 - 1)) {
  return {
    lx: rnd() * (COURT_W / 2 - 0.7),
    lz: -side * (1.2 + Math.random() * (HALF - 2.0)),
  };
}

export function targetToWorld(court, { lx, lz }) {
  return court.toWorld(lx, lz);
}

/** Camera focus for orthographic view centered on the active court. */
export function getCameraFocus(court) {
  return { x: court.centerX, y: 100, z: court.centerZ, lookX: court.centerX, lookZ: court.centerZ };
}
