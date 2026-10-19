// ============================================================
// LOGIC CONSTANTS — measures and rules of the game world.
// Pure data: no Three.js, no DOM. Visual tuning lives in js/view/.
// ============================================================

/** Court dimensions and net height (world units). */
export const COURT_W = 8;
export const COURT_L = 16;
export const HALF = COURT_L / 2;
export const NET_H = 2.2;

/** Playable court margin used by boundary checks. */
export const COURT_MARGIN = 0.15;

/**
 * FIVB free zone: mandatory clear space around the playing court,
 * minimum 3 m on every side (sidelines and end lines).
 * The protection net sits at the outer edge of this zone.
 */
export const FREE_ZONE = 3;

/** Sand kept beyond the protection net (world units). */
export const SIDE_NET_BUFFER = 1.2;

/** Extra sand added to a side court footprint: free zone + net + buffer, both sides. */
export const SIDE_SCENE_PAD = 2 * (FREE_ZONE + SIDE_NET_BUFFER);

/** Team sides: USA plays the near half (+Z), Sweden the far half (−Z). */
export const SIDE_USA = 1, SIDE_SWE = -1;

/** Court role within a multi-court venue. */
export const COURT_TYPE = {
  MAIN: 'main',
  SIDE: 'side',
};

/**
 * Rules and footprint per court type.
 * footprintW/L: full scene footprint (sand + infrastructure), used for layout.
 */
export const COURT_RULES = {
  [COURT_TYPE.MAIN]: {
    playable: true,
    hasOfficials: true,
    footprintW: 32,
    footprintL: 38,
  },
  [COURT_TYPE.SIDE]: {
    playable: true,
    hasOfficials: false,
    footprintW: COURT_W + SIDE_SCENE_PAD,
    footprintL: COURT_L + SIDE_SCENE_PAD,
  },
};

/** Default placement of secondary courts around the main court. */
export const VENUE_LAYOUT = {
  /** Gap between scene footprints (world units). */
  sideCourtGap: 6,
};

/** Standard local spawn positions [USA-1, USA-2, SWE-1, SWE-2]. */
export const PLAYER_HOMES_LOCAL = [
  [-2.0, 5.2],
  [2.0, 5.2],
  [-2.0, -5.2],
  [2.0, -5.2],
];

/** World X center for a side court given the main court and flank (-1 | 1). */
export function sideCourtCenterX(flank, mainCourt) {
  return flank * (
    mainCourt.footprintW / 2 +
    VENUE_LAYOUT.sideCourtGap +
    COURT_RULES[COURT_TYPE.SIDE].footprintW / 2
  );
}

/** Half-extents of the protection net perimeter (outer edge of the free zone). */
export function protectionNetHalfExtents() {
  return {
    halfW: COURT_W / 2 + FREE_ZONE,
    halfL: COURT_L / 2 + FREE_ZONE,
  };
}
