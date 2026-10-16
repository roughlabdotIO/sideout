import { COURT_TYPE, sideCourtCenterX } from './constants.js';
import { warmCourtTextures } from './courtTextures.js';
import { createMainCourt } from './createMainCourt.js';
import { createSideCourt } from './createSideCourt.js';
import { createVenueState } from './venueState.js';

/**
 * Builds the full beach venue and returns playable state.
 * @param {THREE.Scene} scene
 */
export function buildVenue(scene) {
  warmCourtTextures();

  const main = createMainCourt(scene, { id: 'main' });

  const sides = [
    createSideCourt(scene, {
      centerX: sideCourtCenterX(-1, main),
      centerZ: 0,
      id: 'side-left',
    }),
    createSideCourt(scene, {
      centerX: sideCourtCenterX(1, main),
      centerZ: 0,
      id: 'side-right',
    }),
  ];

  const venue = {
    main,
    sides,
    courts: [main, ...sides],
  };

  return createVenueState(venue);
}
