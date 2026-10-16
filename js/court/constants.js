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

/** Court role within a multi-court venue. */
export const COURT_TYPE = {
  MAIN: 'main',
  SIDE: 'side',
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

/** Half-width of a court's scene footprint (for venue layout). */
export function sceneHalfW(court) {
  if (court.venueW) return court.venueW / 2;
  const pad = court.sandPadExtraW ?? 4;
  return (COURT_W + pad) / 2;
}

/** World X center for a side court given the main court and flank (-1 | 1). */
export function sideCourtCenterX(flank, mainCourt) {
  return flank * (
    sceneHalfW(mainCourt) +
    VENUE_LAYOUT.sideCourtGap +
    sceneHalfW({ sandPadExtraW: SIDE_SCENE_PAD })
  );
}

/** Half-extents of the protection net perimeter (outer edge of the free zone). */
export function protectionNetHalfExtents() {
  return {
    halfW: COURT_W / 2 + FREE_ZONE,
    halfL: COURT_L / 2 + FREE_ZONE,
  };
}
