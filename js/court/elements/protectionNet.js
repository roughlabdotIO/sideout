import { protectionNetHalfExtents } from '../constants.js';
import { makeTex, flatPlane } from '../../render/textures.js';

let protNetTex = null;
let protPostTex = null;

/** One chain-link cell; tiled along each fence band via RepeatWrapping. */
export function getProtNetTex() {
  if (protNetTex) return protNetTex;
  protNetTex = makeTex(16, 12, (g) => {
    g.clearRect(0, 0, 16, 12);
    g.fillStyle = '#c4ccd6';
    g.fillRect(0, 0, 16, 1); // top rail
    g.fillStyle = '#7d848e';
    g.fillRect(0, 11, 16, 1); // bottom rail
    g.strokeStyle = 'rgba(190,200,214,0.55)';
    g.lineWidth = 1;
    for (let x = -8; x < 16; x += 4) {
      g.beginPath(); g.moveTo(x, 1); g.lineTo(x + 8, 11); g.stroke();
      g.beginPath(); g.moveTo(x + 8, 1); g.lineTo(x, 11); g.stroke();
    }
  });
  protNetTex.wrapS = THREE.RepeatWrapping;
  protNetTex.wrapT = THREE.RepeatWrapping;
  return protNetTex;
}

/** Fence corner post seen from above. */
export function getProtPostTex() {
  if (protPostTex) return protPostTex;
  protPostTex = makeTex(6, 6, (g) => {
    g.fillStyle = '#4a4f57';
    g.fillRect(0, 0, 6, 6);
    g.fillStyle = '#aeb6c0';
    g.fillRect(1, 1, 4, 4);
    g.fillStyle = '#dfe4ea';
    g.fillRect(2, 2, 2, 2);
  });
  return protPostTex;
}

/**
 * Perimeter protection net at the outer edge of the FIVB free zone.
 * @param {THREE.Scene} scene
 * @param {{ centerX: number, centerZ: number, preset: object }} opts
 * @returns {{ bands: THREE.Mesh[], posts: THREE.Mesh[], halfW: number, halfL: number }}
 */
export function createProtectionNet(scene, { centerX, centerZ, preset }) {
  const { halfW, halfL } = protectionNetHalfExtents();
  const th = preset.protNetThickness;
  const y = preset.protNetY;
  const cell = preset.protNetCell;
  const bands = [];

  const band = (spanW, spanL, along) => {
    const t = getProtNetTex().clone();
    t.needsUpdate = true;
    if (along === 'x') {
      t.repeat.set(Math.max(1, Math.round(spanW / cell)), 1);
    } else {
      t.repeat.set(1, Math.max(1, Math.round(spanL / cell)));
    }
    return flatPlane(spanW, spanL, t);
  };

  // North / South bands run along X (full width, closing the corners).
  [-1, 1].forEach((end) => {
    const m = band(halfW * 2 + th, th, 'x');
    m.position.set(centerX, y, centerZ + end * halfL);
    scene.add(m);
    bands.push(m);
  });
  // West / East bands run along Z (inset so corners meet cleanly).
  [-1, 1].forEach((side) => {
    const m = band(th, halfL * 2 - th, 'z');
    m.position.set(centerX + side * halfW, y, centerZ);
    scene.add(m);
    bands.push(m);
  });

  // Corner posts.
  const posts = [];
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      const p = flatPlane(preset.protPostSize, preset.protPostSize, getProtPostTex());
      p.position.set(centerX + sx * halfW, preset.protPostY, centerZ + sz * halfL);
      scene.add(p);
      posts.push(p);
    });
  });

  return { bands, posts, halfW, halfL };
}
