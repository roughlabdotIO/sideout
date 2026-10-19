import { makeTex, flatPlane, getShadowTex } from './textures.js';
import { approachPhase } from '../logic/players.js';

// ============================================================
// PLAYER POSE SPRITES — original big-head pixel style.
// Eyes on every face. Movement animation: two-frame front run
// (walkA/walkB) and two-frame side-profile run (sideA/sideB,
// drawn facing right and mirrored for leftward movement).
// Poses: ready / bump / dig / set. Dives lie the sprite down.
// ============================================================
function playerTexSet(kit, accent, shorts, skin, hair, back){
  const EYE='#161616';
  const shade=(hex,f=0.68)=>'#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*f)
    .toString(16).padStart(2,'0')).join('');
  const kitDk=shade(kit), accDk=shade(accent), shortsDk=shade(shorts), skinDk=shade(skin,0.8);
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
    g.clearRect(0,0,16,22);
    if(back){
      // seen from behind: the platform is IN FRONT of the body, hidden by the
      // back. Only the arms show, reaching forward-down along the flanks;
      // head dropped between the shoulders, knees bent.
      headAt(g,5,3);                                 // head sunk between the shoulders
      g.fillStyle=kit;   g.fillRect(3,10,10,5);      // shoulders hunched, back rounded
      g.fillStyle=accent;g.fillRect(3,11,10,1);
      g.fillStyle=skin;                              // locked arms angling in, toward the front
      g.fillRect(2,11,1,2); g.fillRect(13,11,1,2);
      g.fillStyle=skinDk;
      g.fillRect(3,13,1,2); g.fillRect(12,13,1,2);   // ...vanishing under the body
      g.fillStyle=shorts;g.fillRect(4,15,8,3);       // low crouch
      g.fillStyle=skin;                              // knees out, feet wide and planted
      g.fillRect(3,18,2,2); g.fillRect(11,18,2,2);
      g.fillRect(4,20,2,1); g.fillRect(10,20,2,1);
      g.fillRect(3,21,3,1); g.fillRect(10,21,3,1);
      return;
    }
    // platform: arms in a clean V, converging to joined hands
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
  // --- three-quarter poses: torso turned toward screen-RIGHT (mirrored for
  // left). Seen from above, the far (right) side recedes: it sits one pixel
  // higher and is shaded; the shirt stripe slants up toward it; head turned,
  // far foot set back. The near (left) arm works across toward the turn.
  const headTurned=(g,hx,hy)=>{
    g.fillStyle=hair; g.fillRect(hx+1,hy,4,1); g.fillRect(hx,hy+1,6,3);
    if(back){
      g.fillStyle=hair; g.fillRect(hx,hy+4,6,3);        // back of the head
      g.fillStyle=skin; g.fillRect(hx,hy+4,1,2);        // near ear showing
      g.fillRect(hx+2,hy+7,3,1);                        // neck, shifted with the turn
    }else{
      g.fillStyle=skin; g.fillRect(hx,hy+4,6,4);        // face in three-quarter
      g.fillStyle=hair; g.fillRect(hx,hy+4,1,3);        // far side: hair over the temple
      g.fillStyle=EYE;  g.fillRect(hx+2,hy+5,1,1); g.fillRect(hx+4,hy+5,1,1);
      g.fillStyle=skinDk; g.fillRect(hx+5,hy+5,1,2);    // nose edge toward the turn
    }
  };
  const turnedTorso=(g,top)=>{
    g.fillStyle=kit;    g.fillRect(4,top,7,6);           // near side, full width
    g.fillStyle=kitDk;  g.fillRect(11,top-1,2,6);        // far side: receding, shaded, higher
    g.fillStyle=accent; g.fillRect(4,top+2,4,1); g.fillRect(8,top+1,3,1);  // stripe slants up...
    g.fillStyle=accDk;  g.fillRect(11,top,2,1);                            // ...into the far side
  };
  const turnedShorts=(g)=>{
    g.fillStyle=shorts;   g.fillRect(5,15,5,3);
    g.fillStyle=shortsDk; g.fillRect(10,14,2,3);
  };
  const turnedLegs=(g)=>{
    g.fillStyle=skin;   g.fillRect(5,18,2,3); g.fillRect(4,21,3,1);   // near leg, foot forward
    g.fillStyle=skinDk; g.fillRect(10,17,2,3); g.fillRect(10,20,3,1); // far leg, set back
  };
  const readyD=makeTex(16,22,(g)=>{
    g.clearRect(0,0,16,22);
    headTurned(g,6,2);
    turnedTorso(g,9);
    g.fillStyle=skin;
    if(back){
      // from behind the hands are out front, hidden: arms hang forward at the flanks
      g.fillRect(3,10,1,3); g.fillStyle=skinDk; g.fillRect(4,13,1,1);
      g.fillRect(13,9,1,2);                                            // far arm, barely showing
    }else{
      g.fillRect(3,10,1,3); g.fillRect(4,13,2,1); g.fillRect(6,14,3,1);  // near arm reaching across the chest
      g.fillStyle=skinDk; g.fillRect(13,10,1,2); g.fillRect(12,12,1,2);  // far arm, mostly hidden
    }
    turnedShorts(g); turnedLegs(g);
  });
  const bumpD=makeTex(16,22,(g)=>{
    // platform angled toward the target: the V converges off to the side
    g.clearRect(0,0,16,22);
    if(back){
      // from behind: the platform points forward and to the turn side, so the
      // joined forearms show only where they stick out past the far shoulder
      headTurned(g,6,2);
      turnedTorso(g,9);
      g.fillStyle=skin;   g.fillRect(3,10,1,3);             // near arm going forward, into the body
      g.fillStyle=skinDk; g.fillRect(4,13,1,1);
      g.fillStyle=skin;   g.fillRect(13,8,2,1); g.fillRect(14,7,2,1);   // platform poking out, up-right
      turnedShorts(g);
      g.fillStyle=skin;   g.fillRect(5,17,2,3); g.fillRect(4,20,3,1);   // knees bent
      g.fillStyle=skinDk; g.fillRect(10,16,2,3); g.fillRect(10,19,3,1);
      return;
    }
    headTurned(g,6,1);
    turnedTorso(g,9);
    g.fillStyle=skin;
    g.fillRect(3,10,1,2); g.fillRect(4,12,1,1);           // near arm sweeps across...
    g.fillRect(5,13,2,1); g.fillRect(7,14,2,1); g.fillRect(9,15,2,1);
    g.fillStyle=skinDk; g.fillRect(13,9,1,3); g.fillRect(13,12,1,2);   // far arm drops along the side
    g.fillStyle=skin;   g.fillRect(11,15,3,2);            // ...joined hands out to the side
    turnedShorts(g); turnedLegs(g);
  });
  const setD=makeTex(16,22,(g)=>{
    // hands above the forehead, pushed toward the turn side
    g.clearRect(0,0,16,22);
    g.fillStyle=skin;   g.fillRect(6,1,2,1); g.fillRect(6,2,2,4);       // near hand and arm
    g.fillStyle=skinDk; g.fillRect(12,0,2,1); g.fillRect(12,1,1,4);     // far hand, higher (receding)
    headTurned(g,6,2);
    turnedTorso(g,9);
    turnedShorts(g); turnedLegs(g);
  });
  // --- run-up plant (third step): feet together, knees bent, both arms
  // swung back for the load before take-off ---
  const spikeLoad=makeTex(16,22,(g)=>{
    g.clearRect(0,0,16,22);
    headAt(g,5,3);                                   // dropped into the load
    g.fillStyle=kit;   g.fillRect(4,10,8,5);
    g.fillStyle=accent;g.fillRect(4,12,8,1);
    if(back){
      // swung back = toward us: both arms show, hands out and low behind the hips
      g.fillStyle=skin;
      g.fillRect(3,11,1,3); g.fillRect(12,11,1,3);
      g.fillRect(2,14,2,2); g.fillRect(12,14,2,2);
    }else{
      // swung back = behind the body: just the hands peeking out past the hips
      g.fillStyle=skinDk;
      g.fillRect(3,11,1,2); g.fillRect(12,11,1,2);
      g.fillRect(2,13,1,2); g.fillRect(13,13,1,2);
    }
    g.fillStyle=shorts;g.fillRect(5,15,6,2);
    g.fillStyle=skin;                                // knees bent, feet side by side
    g.fillRect(5,17,2,2); g.fillRect(9,17,2,2);
    g.fillRect(6,19,1,2); g.fillRect(9,19,1,2);
    g.fillRect(5,21,2,1); g.fillRect(9,21,2,1);
  });
  return {idle,walkA,walkB,sideA,sideB,ready,bump,dig,set,spikeWind,spikeCock,spikeHit,spikeLoad,
          turned:{ready:readyD,bump:bumpD,set:setD}};
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
// torso: straight or diagonal, from the aim cursor (while planted) or from
// where the last touch was sent (during the contact pose). The angle is
// measured against the player's "forward" (toward the net); hysteresis keeps
// the pose from flickering when the cursor sits on the threshold.
const TURN_ON=25*Math.PI/180, TURN_OFF=18*Math.PI/180;
function bodyTurn(p, v){
  let tx=null, tz=null;
  if(p.aim){ tx=p.aim.x; tz=p.aim.z; }
  else if(p.windup>0&&p.wAim){ tx=p.wAim.x; tz=p.wAim.z; }
  else if(p.poseT>0&&p.turnX!==null){ tx=p.turnX; tz=p.turnZ; }
  if(tx===null){ v.turn=0; return 0; }
  const lateral=tx-p.x, along=(tz-p.z)*-p.side;   // forward = toward the net
  const angle=Math.atan2(Math.abs(lateral), along);
  const limit=v.turn?TURN_OFF:TURN_ON;
  v.turn=angle>limit?Math.sign(lateral)||1:0;
  return v.turn;
}

function syncSprite(p, v){
  const texs=v.texs;
  let map=texs.idle, wide=1, rot=0, flip=1;
  const turn=bodyTurn(p,v);
  // a turnable pose: diagonal variant (drawn turned right, mirrored for left)
  const pose=(name)=>{
    if(turn&&texs.turned[name]){ flip=turn; return texs.turned[name]; }
    return texs[name]||texs.idle;
  };
  const runUp=approachPhase(p);
  if(p.diveT>0||p.downT>0){
    map=texs.dig; wide=1.25;
    rot=(p.diveDx>=0?-1:1)*Math.PI/2;
  }else if(runUp){
    // attack run-up: LEFT step, RIGHT step, then the left closes into the load
    map=runUp==='step1'?texs.walkB:runUp==='step2'?texs.walkA:texs.spikeLoad;
  }else if(p.poseT>0){
    map=pose(p.poseKind);
    if(p.poseKind==='dig'){ wide=1.25; if(turn)flip=turn; }   // the dig already leans; mirror it to the turn side
  }else if(p.windup>0||p.ready||p.aim){
    map=pose('ready');
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
    return {mesh,shadow,texs,turn:0};
  });
  return {
    /** Push every player's simulation state onto its sprite and shadow. */
    sync(){ players.forEach((p,i)=>syncSprite(p,views[i])); },
  };
}
