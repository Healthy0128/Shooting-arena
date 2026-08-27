import assert from 'node:assert/strict';
import {assistedAimDirection,segmentCircleHit} from '../src/hit-detection.js';

const swept=segmentCircleHit({x:0,z:0},{x:5,z:0},{x:2.5,z:.45},.5);
assert.equal(swept.hit,true,'a fast projectile must hit between frames');
assert.ok(Math.abs(swept.x-2.5)<1e-6,'impact point must use the closest segment position');
assert.equal(segmentCircleHit({x:0,z:0},{x:5,z:0},{x:2.5,z:.6},.5).hit,false,'a clear miss must remain a miss');

const near=assistedAimDirection({
  aim:{x:1,z:0},origin:{x:0,z:0},target:{x:10,z:.7},maxAngleRad:Math.PI/36
});
assert.equal(near.assisted,true,'aim within five degrees must receive a small correction');
const far=assistedAimDirection({
  aim:{x:1,z:0},origin:{x:0,z:0},target:{x:10,z:2},maxAngleRad:Math.PI/36
});
assert.equal(far.assisted,false,'aim outside five degrees must not auto-target');

console.log('hit detection checks passed');
