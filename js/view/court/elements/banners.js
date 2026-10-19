import { COURT_L, FREE_ZONE } from '../../../logic/constants.js';
import { makeTex, tiledPlane } from '../../textures.js';
import { standsLayout } from './stands.js';

let bannerTex = null;

/** Advertising board: a row of colored brand blocks, tiled along the band. */
export function getBannerTex() {
  if (bannerTex) return bannerTex;
  bannerTex = makeTex(160, 12, (g) => {
    const brands = ['#e03d3d', '#2f6fd6', '#ffd21f', '#7bff6e', '#ff6ec7'];
    const w = 32;
    brands.forEach((color, i) => {
      g.fillStyle = color;
      g.fillRect(i * w, 0, w, 12);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillRect(i * w + 6, 4, 20, 4);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(i * w + 8, 5, 16, 2);
    });
  });
  bannerTex.wrapS = THREE.RepeatWrapping;
  bannerTex.wrapT = THREE.RepeatWrapping;
  return bannerTex;
}

/**
 * Advertising banners along the end lines, beyond the free zone and in
 * front of the stands (same width as the stand ring).
 * @param {THREE.Scene} scene
 * @param {{ centerX: number, centerZ: number, preset: object }} opts
 * @returns {THREE.Mesh[]} [far end, near end]
 */
export function createBanners(scene, { centerX, centerZ, preset }) {
  const bannerCenterZ = COURT_L / 2 + FREE_ZONE + preset.bannerGap + preset.bannerDepth / 2;
  const bannerLenX = 2 * standsLayout(preset).standCenterX;
  return [-1, 1].map((end) => {
    const banner = tiledPlane(bannerLenX, preset.bannerDepth, getBannerTex(), preset.bannerTile);
    banner.position.set(centerX, 0.035, centerZ + end * bannerCenterZ);
    scene.add(banner);
    return banner;
  });
}
