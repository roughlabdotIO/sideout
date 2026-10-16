/** Pixel texture helpers shared across court, players, ball, etc. */

export function makeTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
}

export function flatPlane(w, h, tex, transparent = true) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** Flat plane with a repeat-tiled texture clone sized to the band. */
export function tiledPlane(w, l, tex, tileWorld) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(
    Math.max(1, Math.round(w / tileWorld)),
    Math.max(1, Math.round(l / tileWorld))
  );
  return flatPlane(w, l, t);
}

let shadowTex = null;
/** Soft oval drop shadow shared by players, ball and referees. */
export function getShadowTex() {
  if (!shadowTex) {
    shadowTex = makeTex(16, 8, (g) => {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath();
      g.ellipse(8, 4, 7, 3, 0, 0, Math.PI * 2);
      g.fill();
    });
  }
  return shadowTex;
}
