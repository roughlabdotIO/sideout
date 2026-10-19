import { makeTex, flatPlane, getShadowTex } from './textures.js';

// ============================================================
// PLAYER POSE SPRITES — original big-head pixel style.
// Eyes on every face. Movement animation: two-frame front run
// (walkA/walkB) and two-frame side-profile run (sideA/sideB,
// drawn facing right and mirrored for leftward movement).
// Poses: ready / bump / dig / set. Dives lie the sprite down.
// ============================================================
function playerTexSet(kit, accent, shorts, skin, hair, back){
  const EYE='#161616';
  // shared head: front (face + eyes) or nuca (hair over the head, neck hint)
  const headAt=(g,hx,hy)=>{
    g.fillStyle=hair; g.fillRect(hx+1,hy,4,1); g.fillRect(hx,hy+1,6,3);
    if(back){
      g.fillStyle=hair; g.fillRect(hx,hy+4,6,3);        // back of the head
      g.fillStyle=skin; g.fillRect(hx+1,hy+7,4,1);      // neck
    }else{
      g.fillStyle=skin; g.fillRect(hx,hy+4,6,4);        // face
      g.fillStyle=EYE;  g.fillRect(hx+1,hy+5,1,1); g.fillRect(hx+4,hy+5,1,1);
    }
  };
  const frontBody=(g)=>{
    g.fillStyle=kit;   g.fillRect(4,9,8,6);
    g.fillStyle=accent;g.fillRect(4,11,8,1);
    g.fillStyle=skin;
    g.fillRect(3,9,1,4); g.fillRect(12,9,1,4);
    g.fillRect(3,13,1,1);g.fillRect(12,13,1,1);
    g.fillStyle=shorts;g.fillRect(5,15,6,3);
  };
  const idle=makeTex(16,22,(g)=>{
    g.clearRect(0,0,16,22);
    headAt(g,5,1);frontBody(g);
    g.fillStyle=skin;  g.fillRect(6,18,1,3); g.fillRect(9,18,1,3);
    g.fillRect(5,21,2,1); g.fillRect(9,21,2,1);
  });
  const walkA=makeTex(16,22,(g)=>{
    g.clearRect(0,0,16,22);
    headAt(g,5,1);frontBody(g);
    g.fillStyle=skin;
    g.fillRect(6,18,1,3); g.fillRect(5,21,2,1);    // left leg planted
    g.fillRect(9,18,1,2); g.fillRect(10,20,2,1);   // right leg lifted
  });
  const walkB=makeTex(16,22,(g)=>{
    g.clearRect(0,0,16,22);
    headAt(g,5,1);frontBody(g);
    g.fillStyle=skin;
    g.fillRect(9,18,1,3); g.fillRect(9,21,2,1);    // right leg planted
    g.fillRect(6,18,1,2); g.fillRect(4,20,2,1);    // left leg lifted
  });
  const sideHeadBody=(g,armFwd)=>{
    g.fillStyle=hair;  g.fillRect(5,1,6,1); g.fillRect(4,2,7,2); g.fillRect(4,4,2,3); // cap + back of head
    g.fillStyle=skin;  g.fillRect(6,4,6,5);                       // profile face
    g.fillStyle=EYE;   g.fillRect(10,6,1,1);                      // one eye on the leading side
    g.fillStyle=kit;   g.fillRect(5,9,6,6);
    g.fillStyle=accent;g.fillRect(5,11,6,1);
    g.fillStyle=skin;
    if(armFwd)g.fillRect(9,10,2,4); else g.fillRect(5,10,2,4);    // swinging arm
    g.fillStyle=shorts;g.fillRect(5,15,6,3);
  };
  const sideA=makeTex(16,22,(g)=>{   // stride open
    g.clearRect(0,0,16,22);
    sideHeadBody(g,true);
    g.fillStyle=skin;
    g.fillRect(5,18,2,3);  g.fillRect(3,21,2,1);   // back leg
    g.fillRect(9,18,2,3);  g.fillRect(10,21,2,1);  // front leg
  });
  const sideB=makeTex(16,22,(g)=>{   // legs passing
    g.clearRect(0,0,16,22);
    sideHeadBody(g,false);
    g.fillStyle=skin;
    g.fillRect(8,18,2,3);  g.fillRect(8,21,2,1);   // planted under the body
    g.fillRect(5,17,2,2);  g.fillRect(4,19,2,1);   // trailing leg folded up
  });
  const ready=makeTex(16,22,(g)=>{
    g.clearRect(0,0,16,22);
    headAt(g,5,2);
    g.fillStyle=kit;   g.fillRect(3,9,10,6);
    g.fillStyle=accent;g.fillRect(3,11,10,1);
    g.fillStyle=skin;
    g.fillRect(2,10,1,3); g.fillRect(13,10,1,3);
    g.fillRect(3,13,2,2); g.fillRect(11,13,2,2);
    g.fillStyle=shorts;g.fillRect(4,15,8,3);
    g.fillStyle=skin;
    g.fillRect(4,18,2,3); g.fillRect(10,18,2,3);
    g.fillRect(3,21,3,1); g.fillRect(10,21,3,1);
  });
  const bump=makeTex(16,22,(g)=>{
    // platform: arms in a clean V, converging to joined hands
    g.clearRect(0,0,16,22);
    headAt(g,5,1);
    g.fillStyle=kit;   g.fillRect(4,9,8,5);
    g.fillStyle=accent;g.fillRect(4,10,8,1);
    g.fillStyle=skin;                              // the V, stepped diagonals
    g.fillRect(3,10,1,2); g.fillRect(12,10,1,2);   // from the shoulders...
    g.fillRect(4,12,1,2); g.fillRect(11,12,1,2);
    g.fillRect(5,13,1,2); g.fillRect(10,13,1,2);
    g.fillRect(6,14,1,2); g.fillRect(9,14,1,2);
    g.fillRect(7,15,2,2);                          // ...to the joined hands
    g.fillStyle=shorts;g.fillRect(5,16,6,2);
    g.fillStyle=skin;  g.fillRect(6,18,1,3); g.fillRect(9,18,1,3);
    g.fillRect(5,21,2,1); g.fillRect(9,21,2,1);
  });
  const dig=makeTex(20,22,(g)=>{
    g.clearRect(0,0,20,22);
    headAt(g,7,4);
    g.fillStyle=kit;   g.fillRect(4,10,12,5);
    g.fillStyle=accent;g.fillRect(4,12,12,1);
    g.fillStyle=skin;
    g.fillRect(2,11,2,3); g.fillRect(2,14,2,1);
    g.fillRect(16,12,2,5); g.fillRect(16,17,3,2);  // hand on the sand
    g.fillStyle=shorts;
    g.fillRect(4,15,5,3); g.fillRect(11,15,5,3);
    g.fillStyle=skin;
    g.fillRect(3,18,3,3); g.fillRect(14,18,3,3);
    g.fillRect(2,21,4,1); g.fillRect(14,21,4,1);
  });
  const set=makeTex(16,22,(g)=>{
    g.clearRect(0,0,16,22);
    g.fillStyle=skin;
    g.fillRect(4,1,2,1); g.fillRect(10,1,2,1);     // open hands framing the ball
    g.fillRect(4,2,2,4); g.fillRect(10,2,2,4);     // arms angled slightly inward
    headAt(g,5,2);
    g.fillStyle=kit;   g.fillRect(4,9,8,6);
    g.fillStyle=accent;g.fillRect(4,11,8,1);
    g.fillStyle=shorts;g.fillRect(5,15,6,3);
    g.fillStyle=skin;  g.fillRect(6,18,1,3); g.fillRect(9,18,1,3);
    g.fillRect(5,21,2,1); g.fillRect(9,21,2,1);
  });
  // --- spike swing, three moments ---
  const spikeWind=makeTex(16,22,(g)=>{
    // ascent: hitting arm loaded low and behind, legs tucked
    g.clearRect(0,0,16,22);
    headAt(g,5,1);
    g.fillStyle=kit;   g.fillRect(4,9,8,6);
    g.fillStyle=accent;g.fillRect(4,11,8,1);
    g.fillStyle=skin;
    g.fillRect(3,9,1,3);                            // guide arm forward
    g.fillRect(12,11,1,3); g.fillRect(13,13,1,3);   // hitting arm swung back-low
    g.fillStyle=shorts;g.fillRect(5,15,6,3);
    g.fillStyle=skin;
    g.fillRect(6,18,1,2); g.fillRect(9,18,1,2);     // legs tucked mid-air
    g.fillRect(5,20,2,1); g.fillRect(9,20,2,1);
  });
  const spikeCock=makeTex(16,22,(g)=>{
    // at the apex: arm cocked high above the head, back arched
    g.clearRect(0,0,16,22);
    g.fillStyle=skin;
    g.fillRect(11,1,2,2);                           // fist high
    g.fillRect(11,3,2,4);                           // arm up beside the head
    headAt(g,5,1);
    g.fillStyle=kit;   g.fillRect(4,9,8,6);
    g.fillStyle=accent;g.fillRect(4,11,8,1);
    g.fillStyle=skin;  g.fillRect(3,8,1,3);         // guide arm high
    g.fillStyle=shorts;g.fillRect(5,15,6,3);
    g.fillStyle=skin;
    g.fillRect(6,18,1,2); g.fillRect(9,19,1,2);     // arched: legs trail behind
    g.fillRect(5,19,2,1); g.fillRect(10,20,2,1);
  });
  const spikeHit=makeTex(16,22,(g)=>{
    // follow-through: arm whipped down across the body
    g.clearRect(0,0,16,22);
    headAt(g,5,1);
    g.fillStyle=kit;   g.fillRect(4,9,8,5);
    g.fillStyle=accent;g.fillRect(4,10,8,1);
    g.fillStyle=skin;
    g.fillRect(10,8,2,2); g.fillRect(9,10,2,2); g.fillRect(8,12,2,2); // downward whip
    g.fillRect(8,14,2,1);                           // hand ends at the waist
    g.fillRect(3,11,1,3);                           // other arm trails back
    g.fillStyle=shorts;g.fillRect(5,15,6,2);
    g.fillStyle=skin;
    g.fillRect(6,17,1,4); g.fillRect(9,17,1,4);     // legs extended for landing
    g.fillRect(5,21,2,1); g.fillRect(9,21,2,1);
  });
  return {idle,walkA,walkB,sideA,sideB,ready,bump,dig,set,spikeWind,spikeCock,spikeHit};
}

// national kits: USA white/red trim/blue shorts, SWE yellow/blue.
// USA play the near court facing the net, so we see their backs (no eyes);
// Sweden face the camera. Profiles are shared, one eye on the leading side.
// [kit, accent, shorts, skin, hair, back]
const KITS = {
  'USA-1': ['#f2f2f8','#e03d3d','#2440b0','#c98850','#3a2a1a',true],
  'USA-2': ['#f2f2f8','#e03d3d','#2440b0','#8a5a33','#181818',true],
  'SWE-1': ['#ffd21f','#2f6fd6','#2f6fd6','#e8b98a','#e8d24d',false],
  'SWE-2': ['#ffd21f','#2f6fd6','#2f6fd6','#e8b98a','#b06a2a',false],
};

// pose & animation selection — head-up front view; lateral runs
// switch to the side profile (mirrored when heading left);
// backward movement runs on the front frames for now
function syncSprite(p, v){
  const texs=v.texs;
  let map=texs.idle, wide=1, rot=0, flip=1;
  if(p.diveT>0||p.downT>0){
    map=texs.dig; wide=1.25;
    rot=(p.diveDx>=0?-1:1)*Math.PI/2;
  }else if(p.poseT>0){
    map=texs[p.poseKind]||texs.idle;
    if(p.poseKind==='dig')wide=1.25;
  }else if(p.windup>0||p.ready){
    map=texs.ready;
  }else if(p.air){
    // spike swing follows the jump: loading up, then cocked at the top
    map=p.jumpV>1.5?texs.spikeWind:texs.spikeCock;
  }else{
    const spd=Math.hypot(p.vx,p.vz);
    if(spd>1.4&&!p.air){
      const frame=Math.floor(p.stride*3)%2;
      if(Math.abs(p.vx)>Math.abs(p.vz)*1.15){
        map=frame?texs.sideB:texs.sideA;     // profile run
        flip=p.vx<0?-1:1;                     // mirror when going left
      }else{
        map=frame?texs.walkB:texs.walkA;      // front run (also backward)
      }
    }
  }
  if(v.mesh.material.map!==map){v.mesh.material.map=map;}
  v.mesh.rotation.z=rot;
  const sc=1+p.jumpH*0.22;
  v.mesh.scale.set(sc*wide*flip,sc,1);
  v.mesh.position.set(p.x,0.1,p.z-p.jumpH*0.10);
  const shs=Math.max(0.5,1-p.jumpH*0.28);
  v.shadow.scale.set(shs,shs,1);
  v.shadow.position.set(p.x,0.04,p.z+0.35);
}

/**
 * Sprites and shadows for the players, matched by name to their kit.
 * @param {THREE.Scene} scene
 * @param {object[]} players states from js/logic/players.js
 */
export function createPlayersView(scene, players){
  const views=players.map(p=>{
    const texs=playerTexSet(...KITS[p.name]);
    const mesh=flatPlane(1.0,1.35,texs.idle);
    mesh.position.set(p.x,0.1,p.z);scene.add(mesh);
    const shadow=flatPlane(1.0,0.5,getShadowTex());
    shadow.position.set(p.x,0.04,p.z+0.35);scene.add(shadow);
    return {mesh,shadow,texs};
  });
  return {
    /** Push every player's simulation state onto its sprite and shadow. */
    sync(){ players.forEach((p,i)=>syncSprite(p,views[i])); },
  };
}
