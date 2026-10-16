import {
  COURT_W,
  COURT_L,
  HALF,
  NET_H,
  COURT_MARGIN,
  PLAYER_HOMES_LOCAL,
} from './constants.js';

/**
 * @typedef {Object} Court
 * @property {string} id
 * @property {string} type
 * @property {number} centerX
 * @property {number} centerZ
 * @property {number} width
 * @property {number} length
 * @property {number} half
 * @property {number} netH
 * @property {boolean} playable
 * @property {boolean} hasOfficials
 * @property {number} [venueW]
 * @property {number} [venueL]
 * @property {THREE.Mesh} ground
 * @property {THREE.Mesh} lines
 * @property {THREE.Mesh} net
 * @property {THREE.Mesh[]} posts
 * @property {THREE.Mesh[]} [stands]
 * @property {THREE.Mesh[]} [banners]
 * @property {(lx: number, lz: number) => { x: number, z: number }} toWorld
 * @property {(x: number, z: number) => { x: number, z: number }} toLocal
 * @property {(side: number, offset: number) => number} localSideZ
 * @property {(lx: number, lz: number) => boolean} containsLocal
 * @property {(x: number, z: number) => boolean} containsWorld
 * @property {() => number[][]} getPlayerHomesWorld
 */

/**
 * @param {number} centerX
 * @param {number} centerZ
 * @param {Partial<Court>} props
 * @returns {Court}
 */
export function createCourtBase(centerX, centerZ, props) {
  const toWorld = (lx, lz) => ({ x: centerX + lx, z: centerZ + lz });
  const toLocal = (x, z) => ({ x: x - centerX, z: z - centerZ });
  const localSideZ = (side, offset) => centerZ + side * offset;
  const containsLocal = (lx, lz) =>
    Math.abs(lx) <= COURT_W / 2 + COURT_MARGIN &&
    Math.abs(lz) <= HALF + COURT_MARGIN;
  const containsWorld = (x, z) => {
    const l = toLocal(x, z);
    return containsLocal(l.x, l.z);
  };
  const getPlayerHomesWorld = () =>
    PLAYER_HOMES_LOCAL.map(([lx, lz]) => [centerX + lx, centerZ + lz]);

  return {
    centerX,
    centerZ,
    width: COURT_W,
    length: COURT_L,
    half: HALF,
    netH: NET_H,
    toWorld,
    toLocal,
    localSideZ,
    containsLocal,
    containsWorld,
    getPlayerHomesWorld,
    ...props,
  };
}
