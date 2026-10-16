import { COURT_W, COURT_L } from '../constants.js';
import { getCourtPreset } from '../presets.js';
import { makeTex, flatPlane } from '../../render/textures.js';

const linesTexByType = {};

/** Boundary lines texture; color and stroke width come from the court preset. */
export function getLinesTex(type) {
  if (linesTexByType[type]) return linesTexByType[type];
  const preset = getCourtPreset(type);
  linesTexByType[type] = makeTex(160, 320, (g) => {
    g.clearRect(0, 0, 160, 320);
    g.strokeStyle = preset.lineColor;
    g.lineWidth = preset.lineWidth;
    g.strokeRect(2, 2, 156, 316);
  });
  return linesTexByType[type];
}

/**
 * Playing-court boundary lines (COURT_W × COURT_L).
 * @param {THREE.Scene} scene
 * @param {{ type: string, centerX: number, centerZ: number, y: number }} opts
 */
export function createLines(scene, { type, centerX, centerZ, y }) {
  const lines = flatPlane(COURT_W, COURT_L, getLinesTex(type));
  lines.position.set(centerX, y, centerZ);
  scene.add(lines);
  return lines;
}
