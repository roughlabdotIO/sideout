import { getCourtPreset } from './presets.js';
import { getCourtTextures } from './courtTextures.js';
import { flatPlane } from '../textures.js';
import { createLines } from './elements/lines.js';
import { createNet } from './elements/net.js';
import { createNetPosts } from './elements/netPosts.js';
import { createStands } from './elements/stands.js';
import { createBanners } from './elements/banners.js';

/**
 * Draws the main (central) court: sand footprint, lines, net and posts,
 * banners on the end lines and crowd-packed stands on all four sides.
 * @param {THREE.Scene} scene
 * @param {import('../../logic/court.js').Court} court
 * @returns {{ meshes: Record<string, THREE.Mesh | THREE.Mesh[]> }}
 */
export function createMainCourtView(scene, court) {
  const { type, centerX, centerZ } = court;
  const preset = getCourtPreset(type);
  const tex = getCourtTextures();

  const ground = flatPlane(court.footprintW, court.footprintL, tex.sand, false);
  ground.position.set(centerX, 0, centerZ);
  scene.add(ground);

  return {
    meshes: {
      ground,
      lines: createLines(scene, { type, centerX, centerZ, y: preset.linesY }),
      net: createNet(scene, { centerX, centerZ, y: preset.netY }),
      posts: createNetPosts(scene, { centerX, centerZ, y: preset.postsY }),
      stands: createStands(scene, { centerX, centerZ, preset }),
      banners: createBanners(scene, { centerX, centerZ, preset }),
    },
  };
}
