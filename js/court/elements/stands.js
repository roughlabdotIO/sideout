import { COURT_W, COURT_L, FREE_ZONE } from '../constants.js';
import { tiledPlane } from '../../render/textures.js';
import { getCrowdTex } from '../../npc/npc.js';

/**
 * Layout of the ring out from the lines: free zone → banner strip → stands.
 * Shared with the banners so they line up with the stand ring.
 * @param {object} preset main court preset
 */
export function standsLayout(preset) {
  const standInsetX = COURT_W / 2 + FREE_ZONE + preset.bannerDepth + preset.standGap;
  const standInsetZ = COURT_L / 2 + FREE_ZONE + preset.bannerDepth + preset.standGap;
  const standCenterX = standInsetX + preset.standDepth / 2;
  const standCenterZ = standInsetZ + preset.standDepth / 2;
  return {
    standCenterX,
    standCenterZ,
    ringLenX: 2 * standCenterX + preset.standDepth, // top/bottom bands span
    ringLenZ: 2 * standCenterZ + preset.standDepth, // left/right bands span
  };
}

/**
 * Crowd-packed stands wrapping all four sides of a court.
 * @param {THREE.Scene} scene
 * @param {{ centerX: number, centerZ: number, preset: object }} opts
 * @returns {THREE.Mesh[]} [left, right, top, bottom]
 */
export function createStands(scene, { centerX, centerZ, preset }) {
  const { standCenterX, standCenterZ, ringLenX, ringLenZ } = standsLayout(preset);
  const crowd = getCrowdTex();
  const stands = [];
  // Left / right stands (band runs along Z).
  [-1, 1].forEach((sx) => {
    const m = tiledPlane(preset.standDepth, ringLenZ, crowd, preset.crowdTile);
    m.position.set(centerX + sx * standCenterX, 0.03, centerZ);
    scene.add(m);
    stands.push(m);
  });
  // Top / bottom stands (band runs along X).
  [-1, 1].forEach((sz) => {
    const m = tiledPlane(ringLenX, preset.standDepth, crowd, preset.crowdTile);
    m.position.set(centerX, 0.03, centerZ + sz * standCenterZ);
    scene.add(m);
    stands.push(m);
  });
  return stands;
}
