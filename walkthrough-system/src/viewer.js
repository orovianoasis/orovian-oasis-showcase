import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

const canvas = document.getElementById('gl');
const loading = document.getElementById('loading');
const loadingProgress = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');
const errorBox = document.getElementById('errorBox');
const statusNode = document.getElementById('status');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8da8b6);
scene.fog = new THREE.FogExp2(0x9aafb8, 0.0018);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.03, 5000);
scene.add(new THREE.HemisphereLight(0xffffff, 0x5a6255, 2.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.6);
sun.position.set(15, 30, 20);
scene.add(sun);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true;
const keys = Object.create(null);
const collisionMeshes = [];
const roofMeshes = [];
const slabMeshes = [];
let modelRoot = null;
let modelBox = new THREE.Box3();
let modelCenter = new THREE.Vector3();
let modelSize = new THREE.Vector3();
let config = {};
let loaded = false;
let fly = false;
let showRoof = true;
let showSlabs = true;
let yaw = 0;
let pitch = 0;
let fov = 70;
let startState = null;
let exteriorState = null;
let backExteriorState = null;
let lastGroundY = 0;
let dragging = false;
let dragPointer = null;
let dragX = 0;
let dragY = 0;
let pinchDistance = 0;
const activePointers = new Map();

const defaults = {
  model: 'house.glb',
  eye_height: 1.68,
  player_radius: 0.28,
  walk_speed: 3.6,
  run_speed: 7.2,
  fly_speed: 6.2,
  step_height: 0.38,
  max_drop: 1.2,
  model_scale: 1,
  model_offset: [0, 0, 0],
  model_rotation_degrees: [0, 0, 0],
  roof_match: ['roof', 'roofing'],
  slab_match: ['slab', 'floor platform', 'floor-platform', 'floor system', 'upper platform'],
  collision_exclude: ['glass', 'window', 'curtain', 'fixture', 'furniture', 'plant', 'landscape'],
  entry_position: null,
  entry_target: null,
  exterior_position: null,
  exterior_target: null,
  background: '#8da8b6'
};

function vec3(value, fallback = [0, 0, 0]) {
  const source = Array.isArray(value) && value.length >= 3 ? value : fallback;
  return new THREE.Vector3(Number(source[0]) || 0, Number(source[1]) || 0, Number(source[2]) || 0);
}
function regexList(values) {
  return (Array.isArray(values) ? values : []).map(value => {
    try { return new RegExp(String(value), 'i'); } catch { return null; }
  }).filter(Boolean);
}
function objectSearchText(object) {
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return [object.name, ...materials.filter(Boolean).map(item => item.name)].join(' ').toLowerCase();
}
function matchesAny(text, expressions) { return expressions.some(expression => expression.test(text)); }
function worldDirectionFromAngles(includePitch = false) {
  const cp = includePitch ? Math.cos(pitch) : 1;
  return new THREE.Vector3(Math.sin(yaw) * cp, includePitch ? Math.sin(pitch) : 0, -Math.cos(yaw) * cp).normalize();
}
function lookAtAngles(from, target) {
  const direction = target.clone().sub(from).normalize();
  yaw = Math.atan2(direction.x, -direction.z);
  pitch = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1));
}
function updateCameraRotation() {
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  camera.rotation.z = 0;
  camera.fov = fov;
  camera.updateProjectionMatrix();
}
function showError(message) {
  loading.classList.add('is-hidden');
  errorBox.textContent = message;
  errorBox.classList.add('is-visible');
  console.error(message);
}
function updateStatus() {
  const roofText = roofMeshes.length ? (showRoof ? 'Roof visible' : 'Roof hidden') : 'Roof not tagged';
  const slabText = slabMeshes.length ? (showSlabs ? 'Slabs visible' : 'Slabs hidden') : 'Slabs not tagged';
  statusNode.textContent = `${fly ? 'Fly mode' : 'Walk mode'} • ${roofText} • ${slabText} • Zoom ${Math.round(fov)}°`;
  const flyBtn = document.getElementById('flyBtn');
  if (flyBtn) {
    flyBtn.textContent = fly ? 'WALK' : 'FLY';
    flyBtn.classList.toggle('active', fly);
  }
  document.getElementById('roofBtn')?.classList.toggle('active', !showRoof);
  document.getElementById('upperBtn')?.classList.toggle('active', !showSlabs);
}
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener('resize', resize);

async function loadConfig() {
  try {
    const response = await fetch('walkthrough-config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const incoming = await response.json();
    config = { ...defaults, ...incoming };
  } catch (error) {
    console.warn('Using default walkthrough configuration:', error);
    config = { ...defaults };
  }
  scene.background = new THREE.Color(config.background || defaults.background);
}

function prepareModel(root) {
  modelRoot = root;
  root.scale.setScalar(Number(config.model_scale) || 1);
  root.position.copy(vec3(config.model_offset));
  const rotation = vec3(config.model_rotation_degrees);
  root.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z));
  root.updateMatrixWorld(true);

  const roofPatterns = regexList(config.roof_match);
  const slabPatterns = regexList(config.slab_match);
  const excludePatterns = regexList(config.collision_exclude);
  root.traverse(object => {
    if (!object.isMesh || !object.geometry) return;
    const text = objectSearchText(object);
    object.frustumCulled = true;
    if (!object.geometry.boundsTree) {
      try { object.geometry.computeBoundsTree(); } catch (error) { console.warn('BVH skipped for', object.name, error); }
    }
    if (!matchesAny(text, excludePatterns)) collisionMeshes.push(object);
    if (matchesAny(text, roofPatterns)) roofMeshes.push(object);
    if (matchesAny(text, slabPatterns)) slabMeshes.push(object);
  });
  scene.add(root);
  modelBox.setFromObject(root);
  modelBox.getCenter(modelCenter);
  modelBox.getSize(modelSize);
  lastGroundY = modelBox.min.y;
  const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z, 10);
  camera.far = Math.max(1000, maxDimension * 18);
  scene.fog.density = Math.min(0.004, 0.018 / maxDimension);
  camera.updateProjectionMatrix();

  const eye = Number(config.eye_height) || defaults.eye_height;
  let entryPosition;
  if (Array.isArray(config.entry_position)) {
    entryPosition = vec3(config.entry_position);
  } else {
    entryPosition = new THREE.Vector3(modelCenter.x, modelBox.min.y + eye, modelBox.max.z + Math.max(2.4, modelSize.z * 0.12));
  }
  const entryTarget = Array.isArray(config.entry_target)
    ? vec3(config.entry_target)
    : new THREE.Vector3(modelCenter.x, modelBox.min.y + eye * 0.7, modelCenter.z);
  startState = { position: entryPosition, target: entryTarget, fov: Number(config.entry_fov) || 70 };
  exteriorState = buildExteriorState('front');
  backExteriorState = buildExteriorState('back');
  document.getElementById('roofBtn')?.classList.toggle('unmatched', roofMeshes.length === 0);
  document.getElementById('upperBtn')?.classList.toggle('unmatched', slabMeshes.length === 0);
  resetView();
}


function buildExteriorState(side = 'front') {
  const exteriorFov = Number(config.exterior_fov) || 68;
  const isBack = side === 'back';
  if (!isBack && Array.isArray(config.exterior_position)) {
    return {
      position: vec3(config.exterior_position),
      target: Array.isArray(config.exterior_target) ? vec3(config.exterior_target) : modelCenter.clone(),
      fov: exteriorFov,
    };
  }

  // Frame either exterior from a slight diagonal and modest elevation so the
  // facade, roof, and some depth remain visible without sending the property
  // off-screen. FRONT uses +Z; BACK mirrors the view from -Z.
  const aspect = Math.max(camera.aspect || 1, 0.62);
  const projectedHeight = Math.max(
    modelSize.y * 1.35,
    (modelSize.x / aspect) * 1.25,
    6,
  );
  const frameDistance = (projectedHeight * 0.5) / Math.tan(THREE.MathUtils.degToRad(exteriorFov * 0.5));
  const distance = Math.max(frameDistance * 1.28, modelSize.z * 0.7, 7);
  const elevation = Math.max(modelSize.y * 0.30, modelSize.z * 0.16, 2.2);
  const sideOffset = Math.max(modelSize.x * 0.18, 1.2);
  const position = new THREE.Vector3(
    modelCenter.x + (isBack ? -sideOffset : sideOffset),
    modelCenter.y + elevation,
    isBack ? modelBox.min.z - distance : modelBox.max.z + distance,
  );
  const target = !isBack && Array.isArray(config.exterior_target)
    ? vec3(config.exterior_target)
    : new THREE.Vector3(modelCenter.x, modelCenter.y - modelSize.y * 0.04, modelCenter.z);
  return { position, target, fov: exteriorFov };
}

function raycast(origin, direction, far = Infinity, meshes = collisionMeshes) {
  if (!meshes.length) return null;
  raycaster.set(origin, direction);
  raycaster.near = 0;
  raycaster.far = far;
  const hits = raycaster.intersectObjects(meshes, false);
  return hits.length ? hits[0] : null;
}
function findFloor(x, z, currentEyeY, allowWideSearch = false) {
  const eye = Number(config.eye_height) || defaults.eye_height;
  const step = Number(config.step_height) || defaults.step_height;
  const maxDrop = Number(config.max_drop) || defaults.max_drop;
  const currentFoot = currentEyeY - eye;
  const originY = allowWideSearch ? modelBox.max.y + Math.max(4, modelSize.y * 0.2) : currentFoot + step + 0.12;
  const maxDistance = allowWideSearch ? Math.max(modelSize.y + 20, 50) : step + maxDrop + 0.4;
  const hit = raycast(new THREE.Vector3(x, originY, z), new THREE.Vector3(0, -1, 0), maxDistance);
  if (!hit) return allowWideSearch ? modelBox.min.y : null;
  if (!allowWideSearch) {
    const difference = hit.point.y - currentFoot;
    if (difference > step + 0.08 || difference < -maxDrop) return null;
  }
  return hit.point.y;
}
function blockedAt(position, moveDirection, moveDistance) {
  if (!collisionMeshes.length || moveDirection.lengthSq() < 1e-8) return false;
  const eye = Number(config.eye_height) || defaults.eye_height;
  const radius = Number(config.player_radius) || defaults.player_radius;
  const footY = position.y - eye;
  const heights = [0.22, 0.58, 0.9];
  for (const fraction of heights) {
    const origin = new THREE.Vector3(position.x, footY + eye * fraction, position.z);
    const hit = raycast(origin, moveDirection, moveDistance + radius);
    if (hit && hit.distance < moveDistance + radius) return true;
  }
  return false;
}
function movePlayer(delta) {
  if (!loaded) return;
  const running = keys.ShiftLeft || keys.ShiftRight || keys.MobileRun;
  const speed = fly ? Number(config.fly_speed) || defaults.fly_speed : (running ? Number(config.run_speed) || defaults.run_speed : Number(config.walk_speed) || defaults.walk_speed);
  const amount = speed * delta;
  const turnMode = keys.KeyQ;
  if (turnMode) {
    if (keys.ArrowLeft) yaw -= 1.85 * delta;
    if (keys.ArrowRight) yaw += 1.85 * delta;
    if (keys.ArrowUp) pitch = Math.min(1.45, pitch + 1.35 * delta);
    if (keys.ArrowDown) pitch = Math.max(-1.45, pitch - 1.35 * delta);
  }
  const forward = worldDirectionFromAngles(false);
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  const movement = new THREE.Vector3();
  if (keys.KeyW || (!turnMode && keys.ArrowUp) || keys.MobileForward) movement.add(forward);
  if (keys.KeyS || (!turnMode && keys.ArrowDown) || keys.MobileBack) movement.sub(forward);
  if (keys.KeyA || (!turnMode && keys.ArrowLeft) || keys.MobileLeft) movement.sub(right);
  if (keys.KeyD || (!turnMode && keys.ArrowRight) || keys.MobileRight) movement.add(right);
  if (movement.lengthSq() > 0) movement.normalize();

  const position = camera.position.clone();
  if (movement.lengthSq() > 0) {
    const horizontal = movement.clone().multiplyScalar(amount);
    const xMove = new THREE.Vector3(horizontal.x, 0, 0);
    if (xMove.lengthSq() > 0 && !blockedAt(position, xMove.clone().normalize(), xMove.length())) position.x += xMove.x;
    const zMove = new THREE.Vector3(0, 0, horizontal.z);
    if (zMove.lengthSq() > 0 && !blockedAt(position, zMove.clone().normalize(), zMove.length())) position.z += zMove.z;
  }
  if (fly) {
    if (keys.Space || keys.MobileRise) position.y += amount;
    if (keys.KeyC || keys.ControlLeft || keys.ControlRight || keys.MobileLower) position.y -= amount;
  } else {
    const floor = findFloor(position.x, position.z, position.y, false);
    if (floor !== null) {
      lastGroundY = floor;
      position.y = floor + (Number(config.eye_height) || defaults.eye_height);
    } else {
      position.y = lastGroundY + (Number(config.eye_height) || defaults.eye_height);
    }
  }
  camera.position.copy(position);
  updateCameraRotation();
}

function applyState(state, flyMode) {
  if (!state) return;
  camera.position.copy(state.position);
  lookAtAngles(state.position, state.target);
  fov = state.fov;
  fly = flyMode;
  if (!flyMode) {
    const floor = findFloor(camera.position.x, camera.position.z, camera.position.y, true);
    if (floor !== null) {
      lastGroundY = floor;
      camera.position.y = floor + (Number(config.eye_height) || defaults.eye_height);
    }
  }
  updateCameraRotation();
  updateStatus();
}
function resetView() { applyState(startState, false); }
function exteriorView() {
  if (!Array.isArray(config.exterior_position)) exteriorState = buildExteriorState('front');
  applyState(exteriorState, true);
}
function backExteriorView() {
  backExteriorState = buildExteriorState('back');
  applyState(backExteriorState, true);
}
function toggleFly() { fly = !fly; updateStatus(); }
function toggleRoof() { if (!roofMeshes.length) return; showRoof = !showRoof; roofMeshes.forEach(mesh => { mesh.visible = showRoof; }); updateStatus(); }
function toggleSlabs() { if (!slabMeshes.length) return; showSlabs = !showSlabs; slabMeshes.forEach(mesh => { mesh.visible = showSlabs; }); updateStatus(); }
function setFov(next) { fov = THREE.MathUtils.clamp(next, 35, 100); updateCameraRotation(); updateStatus(); }

const blockedKeys = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);
window.addEventListener('keydown', event => {
  if (blockedKeys.has(event.code)) event.preventDefault();
  keys[event.code] = true;
  if (event.repeat) return;
  if (event.code === 'KeyF') toggleFly();
  if (event.code === 'KeyE') exteriorView();
  if (event.code === 'KeyB') backExteriorView();
  if (event.code === 'KeyR') toggleRoof();
  if (event.code === 'KeyU') toggleSlabs();
  if (event.code === 'KeyX') resetView();
  if (event.code === 'KeyI') toggleUI();
  if (event.code === 'KeyT') toggleTools();
}, { passive: false });
window.addEventListener('keyup', event => { keys[event.code] = false; });
window.addEventListener('blur', () => { Object.keys(keys).forEach(key => { keys[key] = false; }); });
canvas.addEventListener('click', () => { if (window.matchMedia('(pointer:fine)').matches && document.pointerLockElement !== canvas) canvas.requestPointerLock?.(); });
document.addEventListener('mousemove', event => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= event.movementX * 0.0022;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.002, -1.48, 1.48);
});
canvas.addEventListener('wheel', event => { event.preventDefault(); setFov(fov + Math.sign(event.deltaY) * 3); }, { passive: false });

function isControlTarget(target) { return Boolean(target.closest('button,#ui,#quickToggles,#mobileControls')); }
canvas.addEventListener('pointerdown', event => {
  if (isControlTarget(event.target)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  canvas.setPointerCapture?.(event.pointerId);
  if (activePointers.size === 1) { dragging = true; dragPointer = event.pointerId; dragX = event.clientX; dragY = event.clientY; }
  if (activePointers.size === 2) {
    const points = [...activePointers.values()];
    pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }
});
canvas.addEventListener('pointermove', event => {
  if (!activePointers.has(event.pointerId)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activePointers.size === 2) {
    const points = [...activePointers.values()];
    const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    if (pinchDistance) setFov(fov - (distance - pinchDistance) * 0.045);
    pinchDistance = distance;
    return;
  }
  if (dragging && dragPointer === event.pointerId) {
    yaw -= (event.clientX - dragX) * 0.006;
    pitch = THREE.MathUtils.clamp(pitch - (event.clientY - dragY) * 0.005, -1.48, 1.48);
    dragX = event.clientX; dragY = event.clientY;
  }
});
function endPointer(event) {
  activePointers.delete(event.pointerId);
  if (dragPointer === event.pointerId) { dragging = false; dragPointer = null; }
  if (activePointers.size < 2) pinchDistance = 0;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

function bindHold(id, keyName, onStart = null) {
  const button = document.getElementById(id);
  if (!button) return;
  const down = event => {
    event.preventDefault();
    keys[keyName] = true;
    if (onStart) onStart();
    button.classList.add('active');
    button.setPointerCapture?.(event.pointerId);
  };
  const up = event => { event.preventDefault(); keys[keyName] = false; button.classList.remove('active'); };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointercancel', up);
  button.addEventListener('pointerleave', up);
}
function bindTap(id, action) { document.getElementById(id)?.addEventListener('click', event => { event.preventDefault(); action(); }); }
bindHold('moveForward','MobileForward'); bindHold('moveBack','MobileBack'); bindHold('moveLeft','MobileLeft'); bindHold('moveRight','MobileRight');
const enableMobileVerticalMovement = () => { if (!fly) { fly = true; updateStatus(); } };
bindHold('riseBtn','MobileRise',enableMobileVerticalMovement); bindHold('lowerBtn','MobileLower',enableMobileVerticalMovement);
bindTap('exteriorBtn',exteriorView); bindTap('backExteriorBtn',backExteriorView); bindTap('roofBtn',toggleRoof); bindTap('upperBtn',toggleSlabs); bindTap('resetBtn',resetView);
function toggleUI() {
  const ui = document.getElementById('ui');
  const button = document.getElementById('toggleUI');
  const hidden = ui.classList.toggle('hidden');
  button.textContent = hidden ? 'INFO OFF' : 'INFO ON';
  button.classList.toggle('active', !hidden);
  button.setAttribute('aria-pressed', String(!hidden));
}
function toggleTools() {
  const groups = [document.getElementById('dpad'), document.getElementById('mobileActionsLeft'), document.getElementById('mobileActionsRight'), document.getElementById('lookHint')];
  const button = document.getElementById('toggleTools');
  const hidden = !groups[0].classList.contains('hidden');
  groups.forEach(node => node?.classList.toggle('hidden', hidden));
  button.textContent = hidden ? 'TOOLS OFF' : 'TOOLS ON';
  button.classList.toggle('active', !hidden);
  button.setAttribute('aria-pressed', String(!hidden));
}
bindTap('toggleUI',toggleUI); bindTap('toggleTools',toggleTools); bindTap('enter',() => canvas.requestPointerLock?.());

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  movePlayer(delta);
  renderer.render(scene, camera);
}

async function init() {
  await loadConfig();
  const loader = new GLTFLoader();
  loader.load(config.model || 'house.glb', gltf => {
    try {
      prepareModel(gltf.scene);
      loaded = true;
      loadingProgress.style.width = '100%';
      loadingText.textContent = 'Ready';
      setTimeout(() => loading.classList.add('is-hidden'), 180);
      updateStatus();
    } catch (error) {
      showError(`The model loaded, but the walkthrough could not prepare it: ${error.message}`);
    }
  }, progress => {
    const percent = progress.total ? Math.max(8, Math.min(96, (progress.loaded / progress.total) * 100)) : 40;
    loadingProgress.style.width = `${percent}%`;
    loadingText.textContent = progress.total ? `Loading model… ${Math.round(percent)}%` : 'Loading model…';
  }, error => showError(`The 3D model could not be loaded. Confirm that house.glb exists beside viewer.html. ${error?.message || ''}`));
  animate();
}
init();
