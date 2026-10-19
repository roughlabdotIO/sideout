import { COURT_TYPE } from '../../logic/constants.js';

/**
 * Visual tuning per court type: colors, draw heights (y) and tiling.
 * Footprint, playability and officials are game rules: see COURT_RULES
 * in js/logic/constants.js.
 */
export const COURT_PRESETS = {
  [COURT_TYPE.MAIN]: {
    /** Stands ring the 4 sides, packed with crowd. */
    standDepth: 3.6,
    /** Gap after the (reserved) banner strip before the stands. */
    standGap: 0.6,
    /** World size of one crowd tile on the stands. */
    crowdTile: 5,
    bannerDepth: 1.4,
    /** Extra gap beyond the FIVB free zone before the banners. */
    bannerGap: 1.0,
    /** World size of one banner block. */
    bannerTile: 7,
    lineColor: '#ffffff',
    lineWidth: 4,
    linesY: 0.025,
    netY: 0.05,
    postsY: 0.06,
  },
  [COURT_TYPE.SIDE]: {
    lineColor: '#e0e0e0',
    lineWidth: 3,
    linesY: 0.018,
    netY: 0.042,
    postsY: 0.052,
    /** Perimeter protection net. */
    protNetThickness: 0.2,
    protNetY: 0.14,
    protPostSize: 0.45,
    protPostY: 0.16,
    /** World size of one chain-link cell (drives texture tiling). */
    protNetCell: 0.9,
  },
};

export function getCourtPreset(type) {
  return COURT_PRESETS[type] ?? COURT_PRESETS[COURT_TYPE.SIDE];
}
