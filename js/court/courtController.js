import { buildVenue } from './buildVenue.js';
import { getCameraFocus } from './courtGameplay.js';
import { createOfficials } from '../npc/npc.js';

/**
 * Single entry point for everything court-related the game needs:
 * the venue, the active court, local↔world coordinate helpers,
 * camera framing and the referees.
 *
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 */
export function createCourtController(scene, camera) {
  const venue = buildVenue(scene);
  const officials = createOfficials(scene, venue.venue.main);

  const active = () => venue.active;

  function focusCamera() {
    const f = getCameraFocus(active());
    camera.position.set(f.x, f.y, f.z);
    camera.lookAt(f.lookX, 0, f.lookZ);
  }

  function syncOfficials() {
    officials.setVisible(active().hasOfficials);
  }

  focusCamera();
  syncOfficials();

  return {
    venue,
    officials,
    /** The court currently being played on. */
    get active() { return active(); },

    /** World X from a court-local X. */
    wx(lx) { return active().centerX + lx; },
    /** World Z at `off` units from the net, on `side`'s half. */
    wz(side, off) { return active().localSideZ(side, off); },
    /** Court-local Z from a world Z. */
    lz(z) { return z - active().centerZ; },
    /** World X offset from a player by `dx`, clamped to [lo, hi] in court-local X. */
    txFrom(p, dx, lo, hi) {
      const lx = p.x - active().centerX + dx;
      return active().centerX + Math.max(lo, Math.min(hi, lx));
    },

    focusCamera,

    /**
     * Make court `id` active ('main', 'side-left', 'side-right'),
     * reframing the camera and showing/hiding the referees.
     * @returns {boolean} false when the court does not exist or isn't playable.
     */
    switchTo(id) {
      if (!venue.setActive(id)) return false;
      focusCamera();
      syncOfficials();
      return true;
    },
  };
}
