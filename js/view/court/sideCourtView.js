import { getCourtPreset } from './presets.js';
import { getCourtTextures } from './courtTextures.js';
import { flatPlane } from '../textures.js';
import { createLines } from './elements/lines.js';
import { createNet } from './elements/net.js';
import { createNetPosts } from './elements/netPosts.js';
import { createProtectionNet } from './elements/protectionNet.js';

/**
 * Draws a side (secondary) court: sand footprint, lines, net and posts,
 * and the protection net at the edge of the FIVB free zone.
 * @param {THREE.Scene} scene
 * @param {import('../../logic/court.js').Court} court
 * @returns {{ meshes: Record<string, THREE.Mesh | THREE.Mesh[]> }}
 */
export function createSideCourtView(scene, court) {
  const { type, centerX, centerZ } = court;
  const preset = getCourtPreset(type);
  const tex = getCourtTextures();

  const ground = flatPlane(court.footprintW, court.footprintL, tex.sand, false);
  ground.position.set(centerX, 0, centerZ);
  scene.add(ground);

  const lines = createLines(scene, { type, centerX, centerZ, y: preset.linesY });
  const net = createNet(scene, { centerX, centerZ, y: preset.netY });
  const posts = createNetPosts(scene, { centerX, centerZ, y: preset.postsY });
  const protection = createProtectionNet(scene, { centerX, centerZ, preset });

  return {
    meshes: {
      ground,
      lines,
      net,
      posts,
      protectionNet: protection.bands,
      protectionPosts: protection.posts,
    },
  };
}
