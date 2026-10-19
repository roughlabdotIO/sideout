import { COURT_W } from '../../../logic/constants.js';
import { makeTex, flatPlane } from '../../textures.js';

/** Distance of each post outside the sideline. */
export const POST_OFFSET = 0.35;

let postTex = null;

/** Post seen from above: grey cap with a dark rim. */
export function getPostTex() {
  if (postTex) return postTex;
  postTex = makeTex(6, 6, (g) => {
    g.fillStyle = '#333';
    g.fillRect(0, 0, 6, 6);
    g.fillStyle = '#bbb';
    g.fillRect(1, 1, 4, 4);
  });
  return postTex;
}

/**
 * The two net posts, one beyond each sideline on the centre line.
 * @param {THREE.Scene} scene
 * @param {{ centerX: number, centerZ: number, y: number }} opts
 * @returns {THREE.Mesh[]} [left, right]
 */
export function createNetPosts(scene, { centerX, centerZ, y }) {
  return [-1, 1].map((side) => {
    const post = flatPlane(0.35, 0.35, getPostTex());
    post.position.set(centerX + side * (COURT_W / 2 + POST_OFFSET), y, centerZ);
    scene.add(post);
    return post;
  });
}
