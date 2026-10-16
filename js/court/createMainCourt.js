import { COURT_TYPE } from './constants.js';
import { getCourtPreset } from './presets.js';
import { getCourtTextures } from './courtTextures.js';
import { createCourtBase } from './courtModel.js';
import { flatPlane } from '../render/textures.js';
import { createLines } from './elements/lines.js';
import { createNet } from './elements/net.js';
import { createNetPosts } from './elements/netPosts.js';
import { createStands } from './elements/stands.js';
import { createBanners } from './elements/banners.js';

/**
 * Main (central) court: playing surface + FIVB free zone + banners on the
 * end lines + crowd-packed stands wrapping all four sides.
 * @param {THREE.Scene} scene
 * @param {{ centerX?: number, centerZ?: number, id?: string }} options
 */
export function createMainCourt(scene, { centerX = 0, centerZ = 0, id = 'main' } = {}) {
  const type = COURT_TYPE.MAIN;
  const preset = getCourtPreset(type);
  const tex = getCourtTextures();

  const ground = flatPlane(preset.venueW, preset.venueL, tex.sand, false);
  ground.position.set(centerX, 0, centerZ);
  scene.add(ground);

  const lines = createLines(scene, { type, centerX, centerZ, y: preset.linesY });
  const net = createNet(scene, { centerX, centerZ, y: preset.netY });
  const posts = createNetPosts(scene, { centerX, centerZ, y: preset.postsY });
  const stands = createStands(scene, { centerX, centerZ, preset });
  const banners = createBanners(scene, { centerX, centerZ, preset });

  return createCourtBase(centerX, centerZ, {
    id,
    type,
    venueW: preset.venueW,
    venueL: preset.venueL,
    freeZone: preset.freeZone,
    playable: preset.playable,
    hasOfficials: preset.hasOfficials,
    ground,
    lines,
    net,
    posts,
    stands,
    banners,
  });
}
