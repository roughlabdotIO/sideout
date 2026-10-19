import { COURT_TYPE } from '../logic/constants.js';
import { warmCourtTextures } from './court/courtTextures.js';
import { createMainCourtView } from './court/mainCourtView.js';
import { createSideCourtView } from './court/sideCourtView.js';
import { createOfficials } from './npcView.js';

/** Height of the orthographic top-down camera above the sand. */
const CAMERA_Y = 100;

/**
 * Draws the whole venue from js/logic/venue.js, places the referees on the
 * main court and frames the camera on the active court.
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {ReturnType<import('../logic/venue.js').createVenue>} venue
 */
export function createVenueView(scene, camera, venue) {
  warmCourtTextures();
  const courtViews = venue.courts.map((c) =>
    c.type === COURT_TYPE.MAIN ? createMainCourtView(scene, c) : createSideCourtView(scene, c));
  const officials = createOfficials(scene, venue.main);

  /** Re-frame the camera and show/hide the referees for the active court. */
  function refresh() {
    const c = venue.active;
    camera.position.set(c.centerX, CAMERA_Y, c.centerZ);
    camera.lookAt(c.centerX, 0, c.centerZ);
    officials.setVisible(c.hasOfficials);
  }
  refresh();

  return { courtViews, officials, refresh };
}
