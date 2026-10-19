import { COURT_W } from '../logic/constants.js';
import { makeTex, flatPlane, getShadowTex } from './textures.js';
import { createRefTower } from './court/elements/refTower.js';

// ============================================================
// NPC — everyone on the venue who isn't a player:
// referees (tower + second referee) and the crowd on the stands.
// ============================================================

// ---------- crowd ----------

let crowdTex = null;

/**
 * Packed pixel spectators — big-head Sensible style, bright random kits.
 * Tiled 2D across the stands (RepeatWrapping) so any side reads as a crowd.
 */
export function getCrowdTex() {
  if (crowdTex) return crowdTex;
  const clothes = ['#e0402f', '#d83030', '#f5d020', '#ffe14d', '#2f6fd6',
    '#3a55c8', '#ff6ec7', '#e070a0', '#7bdb5a', '#39a35a', '#ff9e3d',
    '#c04fd0', '#f2f2f8', '#20c0c0'];
  const skins = ['#e8b98a', '#c98850', '#8a5a33', '#f0cfa8', '#6e4326'];
  const hairs = ['#3a2a1a', '#181818', '#e8d24d', '#b06a2a', '#d0d0d0', '#a03020'];
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const CW = 6, CH = 8, COLS = 16, ROWS = 6;
  crowdTex = makeTex(CW * COLS, CH * ROWS, (g) => {
    g.fillStyle = '#2a2230';
    g.fillRect(0, 0, CW * COLS, CH * ROWS);
    for (let ry = 0; ry < ROWS; ry++) {
      g.fillStyle = ry % 2 ? '#332b3a' : '#241d2b'; // bleacher step shading
      g.fillRect(0, ry * CH, CW * COLS, 1);
      for (let cx = 0; cx < COLS; cx++) {
        const x = cx * CW;
        const y = ry * CH;
        g.fillStyle = pick(clothes);
        g.fillRect(x + 1, y + 4, 4, 4); // torso
        g.fillStyle = pick(skins);
        g.fillRect(x + 1, y + 1, 4, 3); // head
        g.fillStyle = pick(hairs);
        g.fillRect(x + 1, y, 4, 1); // hair
        g.fillStyle = '#161616';
        g.fillRect(x + 2, y + 2, 1, 1);
        g.fillRect(x + 3, y + 2, 1, 1); // eyes
      }
    }
  });
  crowdTex.wrapS = THREE.RepeatWrapping;
  crowdTex.wrapT = THREE.RepeatWrapping;
  return crowdTex;
}

// ---------- referees ----------

/** Duration of the first referee's service-authorization arm sweep (s). */
export const REF_AUTH_TIME = 0.95;

/** First referee stands on the tower just outside the right sideline. */
const REF_OFFSET_X = COURT_W / 2 + 1.1;

function refTex(signal) {
  // drawn in RIGHT profile; the tower referee is mirrored to face left.
  // classic look: blue cap, black & white striped shirt, red sleeves/legs
  return makeTex(16, 22, (g) => {
    g.clearRect(0, 0, 16, 22);
    const skin = '#c96a4a', blue = '#2f6fd6', red = '#d03030', black = '#181818';
    if (signal) {
      g.fillStyle = red;  g.fillRect(12, 3, 2, 5);     // raised sleeve
      g.fillStyle = skin; g.fillRect(12, 1, 2, 2);     // hand up to award the point
    }
    g.fillStyle = blue;
    g.fillRect(5, 1, 6, 1); g.fillRect(4, 2, 7, 2);   // cap crown
    g.fillRect(11, 3, 3, 1);                          // visor toward the court
    g.fillStyle = skin;  g.fillRect(6, 4, 6, 5);      // profile face
    g.fillStyle = '#161616'; g.fillRect(10, 5, 1, 1); // eye on the court side
    g.fillStyle = '#ffd21f'; g.fillRect(12, 7, 2, 1); // whistle at the mouth
    g.fillStyle = '#f2f2f8'; g.fillRect(5, 9, 6, 6);  // shirt base
    g.fillStyle = black;                              // vertical stripes
    g.fillRect(5, 9, 1, 6); g.fillRect(7, 9, 1, 6); g.fillRect(9, 9, 1, 6);
    if (!signal) {
      g.fillStyle = red;  g.fillRect(7, 10, 2, 3);    // sleeved arm at the side
      g.fillStyle = skin; g.fillRect(7, 13, 2, 1);    // hand
    }
    g.fillStyle = black; g.fillRect(5, 15, 6, 2);     // shorts
    g.fillStyle = red;                                // red legs
    g.fillRect(6, 17, 1, 4); g.fillRect(9, 17, 1, 4);
    g.fillStyle = black;                              // boots forward
    g.fillRect(9, 21, 3, 1); g.fillRect(6, 21, 2, 1);
  });
}

// service authorization: arm fully extended toward the court —
// the sprite is rotated at the whistle to sweep from server to net
function refAuthTex() {
  return makeTex(16, 22, (g) => {
    g.clearRect(0, 0, 16, 22);
    const skin = '#d9a066', shirt = '#f2f2f8', navy = '#22307a';
    g.fillStyle = navy;
    g.fillRect(5, 1, 6, 1); g.fillRect(4, 2, 7, 2);
    g.fillRect(11, 3, 3, 1);                          // visor
    g.fillStyle = skin;  g.fillRect(6, 4, 6, 5);
    g.fillStyle = '#161616'; g.fillRect(10, 5, 1, 1);
    g.fillStyle = '#ffd21f'; g.fillRect(12, 7, 2, 1); // whistle
    g.fillStyle = shirt; g.fillRect(5, 9, 6, 6);
    g.fillStyle = skin;  g.fillRect(11, 10, 5, 2);    // arm extended straight out
    g.fillStyle = navy;  g.fillRect(5, 15, 6, 3);
    g.fillStyle = skin;
    g.fillRect(6, 18, 1, 3); g.fillRect(9, 18, 1, 3);
    g.fillRect(9, 21, 3, 1); g.fillRect(6, 21, 2, 1);
  });
}

/**
 * Referees for a court: first referee up on the tower chair at the right,
 * second referee on foot at the opposite post, shuffling along the net.
 * @param {THREE.Scene} scene
 * @param {import('../logic/court.js').Court} court
 */
export function createOfficials(scene, court) {
  const cx = court.centerX, cz = court.centerZ;
  const shadowTex = getShadowTex();
  const tex = { idle: refTex(false), signal: refTex(true), auth: refAuthTex() };
  const meshes = [];
  const add = (mesh) => { meshes.push(mesh); scene.add(mesh); return mesh; };

  // first referee stands on top of the tower chair
  const tower = createRefTower(scene, { x: cx + REF_OFFSET_X, z: cz });
  meshes.push(...tower.meshes);

  const ref1Shadow = add(flatPlane(0.6, 0.3, shadowTex));
  ref1Shadow.position.set(tower.top.x, tower.top.y, tower.top.z); // his shadow ON the boards
  ref1Shadow.scale.set(0.55, 0.55, 1);
  const ref1 = add(flatPlane(1.0, 1.35, tex.idle));
  ref1.position.set(tower.top.x, 0.14, tower.top.z - 0.36);      // standing on the platform
  ref1.scale.set(-1.28, 1.28, 1);                               // mirrored: left profile, facing the court

  const ref2Shadow = add(flatPlane(1.0, 0.5, shadowTex));
  ref2Shadow.position.set(cx - REF_OFFSET_X, 0.04, cz + 0.35);
  const ref2 = add(flatPlane(1.0, 1.35, tex.idle));
  ref2.position.set(cx - REF_OFFSET_X, 0.1, cz);

  function setMap(map) {
    if (ref1.material.map !== map) ref1.material.map = map;
  }

  return {
    meshes,
    setVisible(visible) {
      meshes.forEach((m) => { m.visible = visible; });
    },
    /**
     * Per-frame pose update.
     * @param {{ signal: boolean, authT: number, servingSide: number, ballZ: number }} f
     *   signal: arm raised to award a point; authT: remaining service-authorization
     *   sweep time (0 = none); servingSide: ±1; ballZ: world Z of the ball.
     */
    update({ signal, authT, servingSide, ballZ }) {
      // second referee shuffles along the net following the ball's side
      const r2z = cz + Math.max(-1.2, Math.min(1.2, (ballZ - cz) * 0.12));
      ref2.position.z += (r2z - ref2.position.z) * 0.06;
      ref2Shadow.position.z = ref2.position.z + 0.35;
      // first referee: on a point, raise the arm to award it;
      // at the whistle, arm extended sweeping from the server toward the net
      if (signal) {
        setMap(tex.signal);
        ref1.rotation.z = 0;
      } else if (authT > 0) {
        setMap(tex.auth);
        const k = authT / REF_AUTH_TIME;            // 1 -> 0
        ref1.rotation.z = servingSide * 0.785 * k * k; // starts at the server, eases to net level
      } else {
        setMap(tex.idle);
        ref1.rotation.z = 0;
      }
    },
  };
}
