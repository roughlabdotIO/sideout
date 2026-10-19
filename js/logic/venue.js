import { COURT_TYPE, sideCourtCenterX } from './constants.js';
import { createCourt } from './court.js';

/**
 * The beach venue: main court flanked by two side courts, plus which
 * court is being played on and the coordinate helpers for it.
 * Pure logic: js/view/venueView.js draws it and frames the camera.
 */
export function createVenue() {
  const main = createCourt(COURT_TYPE.MAIN, { id: 'main' });
  const sides = [
    createCourt(COURT_TYPE.SIDE, { id: 'side-left', centerX: sideCourtCenterX(-1, main) }),
    createCourt(COURT_TYPE.SIDE, { id: 'side-right', centerX: sideCourtCenterX(1, main) }),
  ];
  const courts = [main, ...sides];
  let active = main;

  return {
    main,
    sides,
    courts,
    /** The court currently being played on. */
    get active() { return active; },

    /**
     * Switch active court by id ('main', 'side-left', 'side-right').
     * @returns {boolean} false when the court does not exist or isn't playable.
     */
    setActive(id) {
      const next = courts.find((c) => c.id === id);
      if (!next?.playable) return false;
      active = next;
      return true;
    },

    /** World X from a court-local X. */
    wx(lx) { return active.centerX + lx; },
    /** World Z at `off` units from the net, on `side`'s half. */
    wz(side, off) { return active.localSideZ(side, off); },
    /** Court-local Z from a world Z. */
    lz(z) { return z - active.centerZ; },
    /** World X offset from a player by `dx`, clamped to [lo, hi] in court-local X. */
    txFrom(p, dx, lo, hi) {
      const lx = p.x - active.centerX + dx;
      return active.centerX + Math.max(lo, Math.min(hi, lx));
    },
  };
}
