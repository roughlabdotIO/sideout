/**
 * Runtime state: which court the player is currently on.
 * @param {{ main: import('./courtModel.js').Court, sides: import('./courtModel.js').Court[], courts: import('./courtModel.js').Court[] }} venue
 */
export function createVenueState(venue) {
  let active = venue.main;

  return {
    venue,
    get active() {
      return active;
    },
    get playableCourts() {
      return venue.courts.filter((c) => c.playable);
    },
    /** Switch active court by id ('main', 'side-left', 'side-right'). */
    setActive(id) {
      const next = venue.courts.find((c) => c.id === id);
      if (!next?.playable) return false;
      active = next;
      return true;
    },
    isMain() {
      return active === venue.main;
    },
  };
}
