import { COURT_W } from '../../../logic/constants.js';
import { makeTex, flatPlane } from '../../textures.js';

/** The net extends this far past each sideline, out to the posts. */
export const NET_OVERHANG = 0.4;

let netTex = null;

/** Net seen from above: white top band over a dark mesh strip. */
export function getNetTex() {
  if (netTex) return netTex;
  netTex = makeTex(160, 10, (g) => {
    g.fillStyle = 'rgba(20,20,40,0.85)';
    g.fillRect(0, 3, 160, 5);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 160, 3);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (let x = 0; x < 160; x += 4) g.fillRect(x, 4, 1, 4);
  });
  return netTex;
}

/**
 * Net across the centre line of a court.
 * @param {THREE.Scene} scene
 * @param {{ centerX: number, centerZ: number, y: number }} opts
 */
export function createNet(scene, { centerX, centerZ, y }) {
  const net = flatPlane(COURT_W + 2 * NET_OVERHANG, 0.55, getNetTex());
  net.position.set(centerX, y, centerZ);
  scene.add(net);
  return net;
}
