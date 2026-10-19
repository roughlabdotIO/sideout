import { makeTex, flatPlane } from './textures.js';

/** Dots drawn between the player and the cursor. */
const TRAIL_DOTS = 6;
/** Height-charge bar size (world units). */
const BAR_W = 1.0, BAR_H = 0.14;

function reticleTex(color) {
  return makeTex(16, 16, (g) => {
    g.clearRect(0, 0, 16, 16);
    g.strokeStyle = color; g.lineWidth = 2;
    g.beginPath(); g.arc(8, 8, 5.5, 0, Math.PI * 2); g.stroke();
    g.fillStyle = color;
    g.fillRect(7, 0, 2, 4); g.fillRect(7, 12, 2, 4); g.fillRect(0, 7, 4, 2); g.fillRect(12, 7, 4, 2);
    g.fillStyle = '#ffffff'; g.fillRect(7, 7, 2, 2);
  });
}

/**
 * Aim cursor of the player who is planted waiting for the ball:
 * cyan on the own half (pass / set), yellow on the opponent half (free ball),
 * with a dotted line from the player. A bar above the player shows the
 * height charge (held button); the cursor swells with it.
 * @param {THREE.Scene} scene
 */
export function createAimView(scene) {
  const texOwn = reticleTex('#5ee0ff');
  const texOpp = reticleTex('#ffe14d');
  const dotTex = makeTex(2, 2, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 2, 2); });
  const reticle = flatPlane(1.1, 1.1, texOwn);
  reticle.position.y = 0.07; reticle.visible = false; scene.add(reticle);
  const dots = [];
  for (let i = 0; i < TRAIL_DOTS; i++) {
    const d = flatPlane(0.12, 0.12, dotTex);
    d.position.y = 0.065; d.visible = false; d.material.opacity = 0.7; scene.add(d);
    dots.push(d);
  }

  // height charge bar beside the player: dark frame + fill growing left → right
  const solid = (c) => makeTex(2, 2, (g) => { g.fillStyle = c; g.fillRect(0, 0, 2, 2); });
  const fillTex = solid('#ffe14d'), fullTex = solid('#7bff6e');
  const barBg = flatPlane(BAR_W + 0.08, BAR_H + 0.08, solid('#101028'));
  const barFill = flatPlane(BAR_W, BAR_H, fillTex);
  barBg.position.y = 0.135; barFill.position.y = 0.14;
  barBg.visible = barFill.visible = false;
  scene.add(barBg); scene.add(barFill);

  return {
    /** Show the cursor of whichever player is aiming (if any). */
    sync(players) {
      const p = players.find((q) => q.aim);
      reticle.visible = !!p;
      dots.forEach((d) => { d.visible = !!p; });
      barBg.visible = barFill.visible = !!p;
      if (!p) return;
      const a = p.aim;
      reticle.material.map = a.side === p.side ? texOwn : texOpp;
      // the cursor swells with the charge; it stops pulsing when full
      const pulse = a.charge >= 1 ? 0 : Math.sin(a.t * 10) * 0.08;
      const s = (1 + 0.45 * a.charge) * (1 + pulse);
      reticle.scale.set(s, s, 1);
      const bx = p.x - BAR_W / 2, bz = p.z - 1.25;
      barBg.position.set(p.x, 0.135, bz);
      const w = Math.max(0.001, a.charge);
      barFill.scale.set(w, 1, 1);
      barFill.position.set(bx + BAR_W * w / 2, 0.14, bz);
      barFill.material.map = a.charge >= 1 ? fullTex : fillTex;
      reticle.position.set(a.x, 0.07, a.z);
      dots.forEach((d, i) => {
        const k = (i + 1) / (TRAIL_DOTS + 1);
        d.position.set(p.x + (a.x - p.x) * k, 0.065, p.z + (a.z - p.z) * k);
      });
    },
  };
}
