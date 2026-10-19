import { makeTex, flatPlane, getShadowTex } from '../render/textures.js';
import { landingPoint } from './ball.js';

let ballTex = null;

/** Ball sprite: asymmetric panels so the rotation reads at a glance. */
export function getBallTex() {
  if (ballTex) return ballTex;
  ballTex = makeTex(8, 8, (g) => {
    g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(4, 4, 3.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd21f';
    g.fillRect(1, 2, 6, 1);           // upper band
    g.fillRect(2, 5, 5, 1);           // lower band, offset
    g.fillRect(5, 1, 1, 3);           // vertical stub on one side only
    g.fillStyle = '#d8b000'; g.fillRect(2, 3, 1, 1); g.fillRect(6, 5, 1, 1);
    g.fillStyle = '#c0c8e0'; g.fillRect(1, 5, 1, 1); // cool pixel breaks symmetry
  });
  return ballTex;
}

function ringTex(color) {
  return makeTex(16, 16, (g) => {
    g.clearRect(0, 0, 16, 16);
    g.strokeStyle = color; g.lineWidth = 2;
    g.beginPath(); g.arc(8, 8, 6, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffffff';
    g.fillRect(7, 0, 2, 3); g.fillRect(7, 13, 2, 3); g.fillRect(0, 7, 3, 2); g.fillRect(13, 7, 3, 2);
  });
}

/**
 * Everything drawn for the ball: shadow, sprite (height shown by lifting it
 * up-screen and scaling), landing ring and trail ghosts on hard-driven balls.
 * @param {THREE.Scene} scene
 */
export function createBallView(scene) {
  const tex = getBallTex();
  const landTexHot = ringTex('#ff4444');   // incoming attack: hard bump ahead
  const landTexSoft = ringTex('#ffd21f');  // soft ball: composed reception

  const shadow = flatPlane(0.6, 0.32, getShadowTex()); shadow.position.y = 0.045; scene.add(shadow);
  const sprite = flatPlane(0.55, 0.55, tex); sprite.position.y = 0.12; scene.add(sprite);
  const landMark = flatPlane(0.9, 0.9, landTexSoft);
  landMark.position.y = 0.055; landMark.visible = false; scene.add(landMark);

  // --- ball trail (ghosts shown on hard-driven balls) ---
  const trail = [];
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.26 - i * 0.055, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), mat);
    m.rotation.x = -Math.PI / 2; m.visible = false; m.position.y = 0.11;
    scene.add(m); trail.push(m);
  }

  return {
    /** Push the ball state onto its meshes. */
    sync(ball) {
      shadow.position.set(ball.x, 0.045, ball.z);
      const s = 1 + ball.y * 0.10;
      if (ball.squashT > 0) sprite.scale.set(s * 1.25, s * 0.72, 1);   // contact squash
      else sprite.scale.set(s, s, 1);
      sprite.rotation.z = ball.spin;
      sprite.position.set(ball.x, 0.12, ball.z - ball.y * 0.12);
      const sh = Math.max(0.25, 0.6 - ball.y * 0.05);
      shadow.scale.set(sh / 0.6, sh / 0.6, 1);

      // landing ring: color signals the kind of bump you'll need
      if (ball.live) {
        const lp = landingPoint(ball);
        const hot = Math.hypot(ball.vx, ball.vz) > 8;
        landMark.material.map = hot ? landTexHot : landTexSoft;
        landMark.visible = true;
        landMark.position.set(lp.x, 0.055, lp.z);
        const ms = 0.5 + Math.min(lp.t, 1.2) * 0.8;
        landMark.scale.set(ms, ms, 1);
      } else {
        landMark.visible = false;
      }

      // trail ghosts on hard-driven balls
      const hspNow = Math.hypot(ball.vx, ball.vz);
      trail.forEach((m, i) => {
        const hrec = ball.hist[(i + 1) * 3];
        const show = ball.live && hspNow > 9 && hrec;
        m.visible = !!show;
        if (show) {
          m.position.set(hrec.x, 0.11, hrec.z - hrec.y * 0.12);
          m.rotation.z = ball.spin - (i + 1) * 0.45 * Math.sign(ball.spinRate || 1);
          const ss = (1 + hrec.y * 0.10) * 0.9;
          m.scale.set(ss, ss, 1);
        }
      });
    },
  };
}
