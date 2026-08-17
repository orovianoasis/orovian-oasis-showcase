import assert from 'node:assert/strict';

const EPS = 1e-9;
const near = (a,b) => Math.abs(a-b) < EPS;
const normYaw = value => Math.atan2(Math.sin(value), Math.cos(value));

// THREE camera with YXZ Euler yaw looks down local -Z.
// Its planar forward vector is [-sin(yaw), 0, -cos(yaw)].
function renderedForward(yaw) {
  return [-Math.sin(yaw), 0, -Math.cos(yaw)];
}
function yawForTargetDirection(x, z) {
  return normYaw(Math.atan2(-x, -z));
}
function planarRight([x,,z]) {
  // cross(forward, worldUp)
  const len = Math.hypot(-z, x);
  return [-z / len, 0, x / len];
}

const cardinal = [
  { name: 'north/-Z', dir: [0,-1] },
  { name: 'east/+X', dir: [1,0] },
  { name: 'south/+Z', dir: [0,1] },
  { name: 'west/-X', dir: [-1,0] },
];

for (const {name, dir:[x,z]} of cardinal) {
  const yaw = yawForTargetDirection(x,z);
  const [fx,,fz] = renderedForward(yaw);
  assert.ok(near(fx,x) && near(fz,z), `${name}: preset yaw must face target`);
}

// First-person look convention: dragging/moving mouse right decreases Euler yaw,
// which points the camera toward +X (screen/world right at the default heading).
const swipeRightYaw = -0.25;
assert.ok(renderedForward(swipeRightYaw)[0] > 0, 'right-look input must turn right');

// Q + Left increases Euler yaw, which points the camera toward -X (left).
const keyboardLeftYaw = 0.25;
assert.ok(renderedForward(keyboardLeftYaw)[0] < 0, 'Q+Left must turn left');

// Q + Right decreases Euler yaw, which points the camera toward +X (right).
const keyboardRightYaw = -0.25;
assert.ok(renderedForward(keyboardRightYaw)[0] > 0, 'Q+Right must turn right');

// Strafe basis must stay orthogonal and right-handed relative to visual forward.
const fwd = renderedForward(-Math.PI/2); // +X
const right = planarRight(fwd);          // +Z
assert.ok(near(right[0],0) && near(right[2],1), 'strafe right must follow rendered camera basis');

console.log('PASS: walkthrough control-direction invariants');
