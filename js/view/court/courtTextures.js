import { makeTex } from '../textures.js';
import { COURT_PRESETS } from './presets.js';
import { getLinesTex } from './elements/lines.js';
import { getNetTex } from './elements/net.js';
import { getPostTex } from './elements/netPosts.js';
import { getTowerTex } from './elements/refTower.js';
import { getBannerTex } from './elements/banners.js';
import { getProtNetTex, getProtPostTex } from './elements/protectionNet.js';
import { getCrowdTex } from '../npcView.js';

let sandTex = null;

function ensureSandTex() {
  if (sandTex) return sandTex;
  sandTex = makeTex(128, 224, (g) => {
    g.fillStyle = '#e8c777';
    g.fillRect(0, 0, 128, 224);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = Math.random() < 0.5 ? '#dcb95f' : '#f2d58c';
      g.fillRect((Math.random() * 128) | 0, (Math.random() * 224) | 0, 1, 1);
    }
  });
  return sandTex;
}

/**
 * Shared court surface textures (generated once).
 * Every other court element owns its texture in ./elements/.
 */
export function getCourtTextures() {
  return {
    sand: ensureSandTex(),
  };
}

/** Pre-warm textures for every court type in a venue. */
export function warmCourtTextures() {
  ensureSandTex();
  getNetTex();
  getPostTex();
  getTowerTex();
  getBannerTex();
  getProtNetTex();
  getProtPostTex();
  getCrowdTex();
  Object.keys(COURT_PRESETS).forEach((type) => getLinesTex(type));
}
