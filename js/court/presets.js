import { COURT_TYPE, FREE_ZONE, SIDE_SCENE_PAD } from './constants.js';

/**
 * Visual and layout defaults per court type.
 * Playing lines are always COURT_W × COURT_L; main court adds venue shell.
 */
export const COURT_PRESETS = {
  [COURT_TYPE.MAIN]: {
    /** Full scene footprint (sand + infrastructure). */
    venueW: 32,
    venueL: 38,
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
    playable: true,
    hasOfficials: true,
    /** FIVB free zone kept clear around the lines. */
    freeZone: FREE_ZONE,
  },
  [COURT_TYPE.SIDE]: {
    sandPadExtraW: SIDE_SCENE_PAD,
    sandPadExtraL: SIDE_SCENE_PAD,
    lineColor: '#e0e0e0',
    lineWidth: 3,
    linesY: 0.018,
    netY: 0.042,
    postsY: 0.052,
    playable: true,
    hasOfficials: false,
    /** FIVB free zone kept clear around the lines. */
    freeZone: FREE_ZONE,
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
