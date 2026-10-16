import { COURT_W, COURT_L, COURT_TYPE } from './constants.js';
import { getCourtPreset } from './presets.js';
import { getCourtTextures } from './courtTextures.js';
import { createCourtBase } from './courtModel.js';
import { flatPlane } from '../render/textures.js';
import { createLines } from './elements/lines.js';
import { createNet } from './elements/net.js';
import { createNetPosts } from './elements/netPosts.js';
import { createProtectionNet } from './elements/protectionNet.js';

/**
 * Side (secondary) court: playing surface + FIVB free zone + protection net.
 * @param {THREE.Scene} scene
 * @param {{ centerX?: number, centerZ?: number, id?: string }} options
 */
export function createSideCourt(scene, { centerX = 0, centerZ = 0, id = 'side' } = {}) {
  const type = COURT_TYPE.SIDE;
  const preset = getCourtPreset(type);
  const tex = getCourtTextures();

  const ground = flatPlane(
    COURT_W + preset.sandPadExtraW,
    COURT_L + preset.sandPadExtraL,
    tex.sand,
    false
  );
  ground.position.set(centerX, 0, centerZ);
  scene.add(ground);

  const lines = createLines(scene, { type, centerX, centerZ, y: preset.linesY });
  const net = createNet(scene, { centerX, centerZ, y: preset.netY });
  const posts = createNetPosts(scene, { centerX, centerZ, y: preset.postsY });
  const protection = createProtectionNet(scene, { centerX, centerZ, preset });

  return createCourtBase(centerX, centerZ, {
    id,
    type,
    sandPadExtraW: preset.sandPadExtraW,
    sandPadExtraL: preset.sandPadExtraL,
    freeZone: preset.freeZone,
    playable: preset.playable,
    hasOfficials: preset.hasOfficials,
    ground,
    lines,
    net,
    posts,
    stands: [],
    banners: [],
    protectionNet: protection.bands,
    protectionPosts: protection.posts,
    protectionHalfW: protection.halfW,
    protectionHalfL: protection.halfL,
  });
}
