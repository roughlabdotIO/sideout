import { makeTex, flatPlane, getShadowTex } from '../../render/textures.js';

let towerTex = null;

/** Tower chair platform seen from above. */
export function getTowerTex() {
  if (towerTex) return towerTex;
  towerTex = makeTex(14, 14, (g) => {
    g.fillStyle = '#4a3a20';
    g.fillRect(0, 0, 3, 3); g.fillRect(11, 0, 3, 3); g.fillRect(0, 11, 3, 3); g.fillRect(11, 11, 3, 3); // legs
    g.fillStyle = '#8a6a3a'; g.fillRect(1, 1, 12, 12);          // platform
    g.fillStyle = '#a5824c';
    g.fillRect(2, 3, 10, 1); g.fillRect(2, 6, 10, 1); g.fillRect(2, 9, 10, 1); // planks
    g.fillStyle = '#6a4e28'; g.fillRect(1, 12, 12, 1);          // ladder edge
  });
  return towerTex;
}

/**
 * First referee's tower chair. Reads as ELEVATED: the platform is shifted
 * up-screen away from its ground shadow (same trick as ball height).
 * @param {THREE.Scene} scene
 * @param {{ x: number, z: number }} at world position of the tower base
 * @returns {{ meshes: THREE.Mesh[], top: { x: number, y: number, z: number } }}
 *   `top` is where a figure standing on the platform should be placed.
 */
export function createRefTower(scene, { x, z }) {
  const shadow = flatPlane(1.6, 0.85, getShadowTex());
  shadow.position.set(x + 0.15, 0.035, z + 0.55);   // cast on the sand
  scene.add(shadow);

  const platform = flatPlane(1.3, 1.3, getTowerTex());
  platform.position.set(x, 0.045, z - 0.2);         // platform, raised
  scene.add(platform);

  return { meshes: [shadow, platform], top: { x, y: 0.05, z: z - 0.02 } };
}
