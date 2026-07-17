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
const exteriorFrameMeshes = [];
const landMeshes = [];
const doorMeshes = [];
const garageDoorMeshes = [];
const doorRecords = new Map();
const garageDoorRecords = new Map();
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
let leftExteriorState = null;
let rightExteriorState = null;
let exteriorFrameBox = new THREE.Box3();
let lastGroundY = 0;
let landLevelY = 0;
let flyCeilingY = 0;
let dragging = false;
let dragPointer = null;
let dragX = 0;
let dragY = 0;
let pinchDistance = 0;
let pointerLockTimer = null;
let lastTouchTap = { time: 0, x: 0, y: 0 };
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
  exterior_frame_exclude: ['landscape', 'site pad', 'site_pad', 'site', 'driveway', 'drive', 'entry walk', 'entry_walk', 'walkway', 'sidewalk', 'terrain', 'lawn', 'ground plane', 'ground_plane', 'ground', 'pool', 'spa', 'water', 'deck', 'terrace', 'patio', 'hardscape', 'firepit', 'lounger', 'planter', 'tree', 'shrub', 'plant', 'furniture', 'fixture', 'appliance', 'car', 'vehicle'],
  entry_position: null,
  entry_target: null,
  exterior_position: null,
  exterior_target: null,
  exterior_distance_scale: 1.08,
  exterior_screen_fill: 0.78,
  exterior_elevation_degrees: 22,
  exterior_angle_degrees: 0,
  exterior_target_height_ratio: 0.30,
  exterior_include_site: true,
  exterior_front_direction: null,
  land_match: ['site', 'terrain', 'lawn', 'ground', 'driveway', 'walkway', 'sidewalk', 'patio', 'terrace', 'deck', 'hardscape'],
  min_fly_height: 0.25,
  max_fly_height: null,
  max_fly_height_ratio: 0.58,
  door_match: ['(^|[_\\s-])door([_\\s-]|$)', 'entry[_\\s-]?door', 'interior[_\\s-]?door', 'pivot[_\\s-]?door', 'glass[_\\s-]?door'],
  door_exclude: ['garage[_\\s-]?door', 'cabinet', 'drawer', 'doorway', 'frame', 'trim', 'handle', 'knob'],
  door_open_angle_degrees: 88,
  door_animation_seconds: 0.55,
  door_max_distance: 12,
  garage_door_match: ['garage[_\\s-]?door', 'overhead[_\\s-]?door', 'sectional[_\\s-]?door', 'roll[_\\s-]?up[_\\s-]?door'],
  garage_door_exclude: ['frame', 'trim', 'track', 'opener', 'motor', 'hardware', 'handle', 'knob'],
  garage_door_animation_seconds: 0.9,
  garage_door_lift_ratio: 0.92,
  garage_door_inset_ratio: 0.3,
  garage_door_max_distance: 60,
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
function normalizeYaw(value) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}
function worldDirectionFromAngles(includePitch = false) {
  const cp = includePitch ? Math.cos(pitch) : 1;
  // Three.js cameras look down local -Z. Positive camera yaw turns the view
  // toward world -X, so the X component must use -sin(yaw). Keeping this
  // convention aligned with updateCameraRotation prevents side presets and
  // movement controls from facing opposite directions.
  return new THREE.Vector3(-Math.sin(yaw) * cp, includePitch ? Math.sin(pitch) : 0, -Math.cos(yaw) * cp).normalize();
}
function lookAtAngles(from, target) {
  const direction = target.clone().sub(from).normalize();
  // Invert the X term to match Three.js camera yaw. Without this, FRONT and
  // BACK appear correct because their X component is zero, while SIDE L and
  // SIDE R point directly away from the property.
  yaw = normalizeYaw(Math.atan2(-direction.x, -direction.z));
  pitch = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1));
}
function applyLookDelta(deltaX, deltaY, horizontalScale, verticalScale) {
  // One permanent first-person look convention. Exterior preset buttons only
  // change camera position and never alter the swipe or mouse direction.
  yaw = normalizeYaw(yaw - deltaX * horizontalScale);
  pitch = THREE.MathUtils.clamp(pitch - deltaY * verticalScale, -1.48, 1.48);
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
  const exteriorFrameExcludePatterns = regexList(config.exterior_frame_exclude || defaults.exterior_frame_exclude);
  const landPatterns = regexList(config.land_match || defaults.land_match);
  const doorPatterns = regexList(config.door_match || defaults.door_match);
  const doorExcludePatterns = regexList(config.door_exclude || defaults.door_exclude);
  const garageDoorPatterns = regexList(config.garage_door_match || defaults.garage_door_match);
  const garageDoorExcludePatterns = regexList(config.garage_door_exclude || defaults.garage_door_exclude);
  root.traverse(object => {
    if (!object.isMesh || !object.geometry) return;
    const text = objectSearchText(object);
    object.frustumCulled = true;
    if (!object.geometry.boundsTree) {
      try { object.geometry.computeBoundsTree(); } catch (error) { console.warn('BVH skipped for', object.name, error); }
    }
    if (!matchesAny(text, excludePatterns)) collisionMeshes.push(object);
    const objectName = String(object.name || '').toLowerCase();
    if (!matchesAny(objectName, exteriorFrameExcludePatterns)) exteriorFrameMeshes.push(object);
    if (matchesAny(objectName, landPatterns) && !/(pool|spa|water|basin|roof|upper)/i.test(objectName)) landMeshes.push(object);
    if (matchesAny(text, roofPatterns)) roofMeshes.push(object);
    if (matchesAny(text, slabPatterns)) slabMeshes.push(object);
    if (matchesAny(objectName, garageDoorPatterns) && !matchesAny(objectName, garageDoorExcludePatterns)) garageDoorMeshes.push(object);
    if (matchesAny(text, doorPatterns) && !matchesAny(text, doorExcludePatterns)) doorMeshes.push(object);
  });
  scene.add(root);
  root.updateMatrixWorld(true);
  modelBox.setFromObject(root);
  modelBox.getCenter(modelCenter);
  modelBox.getSize(modelSize);

  exteriorFrameBox.makeEmpty();
  exteriorFrameMeshes.forEach(mesh => exteriorFrameBox.expandByObject(mesh, true));
  if (exteriorFrameBox.isEmpty()) exteriorFrameBox.copy(modelBox);

  // Build the camera footprint from actual roof/slab object names, not material
  // names. Material matching previously pulled in car roofs, pool/site slabs, and
  // other unrelated geometry, which shifted the target and pushed the house away.
  const structuralBox = new THREE.Box3();
  const structuralMeshes = [...new Set([...roofMeshes, ...slabMeshes])].filter(mesh => {
    const objectName = String(mesh.name || '').toLowerCase();
    const namedStructure = matchesAny(objectName, roofPatterns) || matchesAny(objectName, slabPatterns);
    return namedStructure && !matchesAny(objectName, exteriorFrameExcludePatterns);
  });
  structuralMeshes.forEach(mesh => structuralBox.expandByObject(mesh, true));
  if (!structuralBox.isEmpty()) {
    const structuralSize = structuralBox.getSize(new THREE.Vector3());
    if (structuralSize.x > 1.5 && structuralSize.z > 1.5) {
      const candidateMinY = exteriorFrameBox.isEmpty() ? modelBox.min.y : exteriorFrameBox.min.y;
      const candidateMaxY = exteriorFrameBox.isEmpty() ? modelBox.max.y : exteriorFrameBox.max.y;
      const padX = Math.max(0.45, structuralSize.x * 0.07);
      const padZ = Math.max(0.45, structuralSize.z * 0.07);
      exteriorFrameBox.set(
        new THREE.Vector3(structuralBox.min.x - padX, Math.max(modelBox.min.y, candidateMinY), structuralBox.min.z - padZ),
        new THREE.Vector3(structuralBox.max.x + padX, Math.min(modelBox.max.y, Math.max(candidateMaxY, structuralBox.max.y)), structuralBox.max.z + padZ),
      );
    }
  }

  const eye = Number(config.eye_height) || defaults.eye_height;
  let bestLand = null;
  landMeshes.forEach(mesh => {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const horizontalArea = Math.max(0, size.x) * Math.max(0, size.z);
    const thinEnough = size.y <= Math.max(1.8, Math.max(size.x, size.z) * 0.12);
    if (horizontalArea > 1 && thinEnough && (!bestLand || horizontalArea > bestLand.area)) {
      bestLand = { area: horizontalArea, top: box.max.y };
    }
  });
  if (bestLand) landLevelY = bestLand.top;
  else if (Array.isArray(config.entry_position)) landLevelY = vec3(config.entry_position).y - eye;
  else landLevelY = modelBox.min.y;

  const horizontalSpan = Math.max(modelSize.x, modelSize.z, 10);
  const configuredMaximum = Number(config.max_fly_height);
  flyCeilingY = Number.isFinite(configuredMaximum) && configuredMaximum > 0
    ? landLevelY + configuredMaximum
    : Math.max(modelBox.max.y + 6, landLevelY + modelSize.y + horizontalSpan * (Number(config.max_fly_height_ratio) || defaults.max_fly_height_ratio));

  prepareDoors();
  prepareGarageDoors();
  lastGroundY = landLevelY;
  const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z, 10);
  camera.far = Math.max(1000, maxDimension * 18);
  scene.fog.density = Math.min(0.004, 0.018 / maxDimension);
  camera.updateProjectionMatrix();

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
  leftExteriorState = buildExteriorState('left');
  rightExteriorState = buildExteriorState('right');
  flyCeilingY = Math.max(
    flyCeilingY,
    exteriorState?.position.y || flyCeilingY,
    backExteriorState?.position.y || flyCeilingY,
    leftExteriorState?.position.y || flyCeilingY,
    rightExteriorState?.position.y || flyCeilingY,
  );
  document.getElementById('roofBtn')?.classList.toggle('unmatched', roofMeshes.length === 0);
  document.getElementById('upperBtn')?.classList.toggle('unmatched', slabMeshes.length === 0);
  resetView();
}


function exteriorFrontAxis() {
  if (Array.isArray(config.exterior_front_direction)) {
    const configured = vec3(config.exterior_front_direction);
    configured.y = 0;
    if (configured.lengthSq() > 1e-6) return configured.normalize();
  }
  if (Array.isArray(config.entry_position) && Array.isArray(config.entry_target)) {
    const fromEntry = vec3(config.entry_position).sub(vec3(config.entry_target));
    fromEntry.y = 0;
    if (fromEntry.lengthSq() > 1e-6) return fromEntry.normalize();
  }
  return new THREE.Vector3(0, 0, 1);
}

function buildExteriorState(side = 'front') {
  const exteriorFov = Number(config.exterior_fov) || 72;
  if (side === 'front' && Array.isArray(config.exterior_position)) {
    return {
      position: vec3(config.exterior_position),
      target: Array.isArray(config.exterior_target) ? vec3(config.exterior_target) : modelCenter.clone(),
      fov: exteriorFov,
    };
  }

  // Exterior presets are full-property survey views. Use the complete model
  // bounds so the residence, yard, driveway, pool, and acreage stay visible.
  const includeSite = config.exterior_include_site !== false;
  const frameBox = includeSite || exteriorFrameBox.isEmpty() ? modelBox : exteriorFrameBox;
  const frameCenter = frameBox.getCenter(new THREE.Vector3());
  const frameSize = frameBox.getSize(new THREE.Vector3());
  const front = exteriorFrontAxis();
  const back = front.clone().multiplyScalar(-1);
  // SIDE L and SIDE R are defined from a person standing in front of the house.
  const left = new THREE.Vector3(-front.z, 0, front.x).normalize();
  const right = left.clone().multiplyScalar(-1);
  const horizontal = ({ front, back, left, right }[side] || front).clone().normalize();

  const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(Number(config.exterior_elevation_degrees) || defaults.exterior_elevation_degrees, 8, 38));
  const cameraFromTarget = horizontal.multiplyScalar(Math.cos(elevation));
  cameraFromTarget.y = Math.sin(elevation);
  cameraFromTarget.normalize();

  const targetHeightRatio = THREE.MathUtils.clamp(Number(config.exterior_target_height_ratio) || defaults.exterior_target_height_ratio, 0.16, 0.52);
  const target = Array.isArray(config.exterior_target)
    ? vec3(config.exterior_target)
    : new THREE.Vector3(frameCenter.x, frameBox.min.y + frameSize.y * targetHeightRatio, frameCenter.z);
  const forward = cameraFromTarget.clone().negate();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const rightAxis = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
  const upAxis = new THREE.Vector3().crossVectors(rightAxis, forward).normalize();
  const verticalHalfFov = THREE.MathUtils.degToRad(exteriorFov * 0.5);
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * Math.max(camera.aspect || 1, 0.35));
  const fill = THREE.MathUtils.clamp(Number(config.exterior_screen_fill) || defaults.exterior_screen_fill, 0.58, 0.96);
  const tanHorizontal = Math.max(Math.tan(horizontalHalfFov) * fill, 0.05);
  const tanVertical = Math.max(Math.tan(verticalHalfFov) * fill, 0.05);

  let distance = 0;
  const corners = [
    new THREE.Vector3(frameBox.min.x, frameBox.min.y, frameBox.min.z),
    new THREE.Vector3(frameBox.min.x, frameBox.min.y, frameBox.max.z),
    new THREE.Vector3(frameBox.min.x, frameBox.max.y, frameBox.min.z),
    new THREE.Vector3(frameBox.min.x, frameBox.max.y, frameBox.max.z),
    new THREE.Vector3(frameBox.max.x, frameBox.min.y, frameBox.min.z),
    new THREE.Vector3(frameBox.max.x, frameBox.min.y, frameBox.max.z),
    new THREE.Vector3(frameBox.max.x, frameBox.max.y, frameBox.min.z),
    new THREE.Vector3(frameBox.max.x, frameBox.max.y, frameBox.max.z),
  ];
  corners.forEach(corner => {
    const relative = corner.clone().sub(target);
    const targetDepth = relative.dot(forward);
    distance = Math.max(
      distance,
      Math.abs(relative.dot(rightAxis)) / tanHorizontal - targetDepth,
      Math.abs(relative.dot(upAxis)) / tanVertical - targetDepth,
    );
  });
  distance += Math.max(frameSize.x, frameSize.z) * 0.04 + 0.6;
  distance *= THREE.MathUtils.clamp(Number(config.exterior_distance_scale) || defaults.exterior_distance_scale, 0.9, 1.45);
  const position = target.clone().addScaledVector(cameraFromTarget, Math.max(distance, 5));
  return { position, target, fov: exteriorFov };
}


function prepareDoors() {
  doorRecords.clear();
  const openAngle = THREE.MathUtils.degToRad(Number(config.door_open_angle_degrees) || defaults.door_open_angle_degrees);
  doorMeshes.forEach(object => {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    if (size.y < 0.8 || Math.max(size.x, size.z) < 0.35) return;
    const name = objectSearchText(object);
    const widthAxis = size.x >= size.z ? 'x' : 'z';
    const useMaxHinge = /(^|[_\s-])(right|rh|hinge-r)([_\s-]|$)/i.test(name);
    const hinge = box.getCenter(new THREE.Vector3());
    hinge[widthAxis] = useMaxHinge ? box.max[widthAxis] : box.min[widthAxis];
    const originalWorldPosition = object.getWorldPosition(new THREE.Vector3());
    const originalWorldQuaternion = object.getWorldQuaternion(new THREE.Quaternion());
    doorRecords.set(object, {
      kind: 'hinged',
      object,
      parent: object.parent,
      hinge,
      originalWorldPosition,
      originalWorldQuaternion,
      progress: 0,
      from: 0,
      to: 0,
      startedAt: 0,
      direction: useMaxHinge ? -1 : 1,
      angle: openAngle,
    });
  });
}

function applyObjectWorldTransform(object, parent, worldPosition, worldQuaternion) {
  if (parent) {
    parent.updateMatrixWorld(true);
    const localPosition = parent.worldToLocal(worldPosition.clone());
    const parentQuaternion = parent.getWorldQuaternion(new THREE.Quaternion());
    object.position.copy(localPosition);
    object.quaternion.copy(parentQuaternion.invert().multiply(worldQuaternion));
  } else {
    object.position.copy(worldPosition);
    object.quaternion.copy(worldQuaternion);
  }
  object.updateMatrixWorld(true);
}

function setHingedDoorProgress(record, progress) {
  const angle = record.angle * record.direction * progress;
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  const worldPosition = record.originalWorldPosition.clone().sub(record.hinge).applyQuaternion(rotation).add(record.hinge);
  const worldQuaternion = rotation.clone().multiply(record.originalWorldQuaternion);
  applyObjectWorldTransform(record.object, record.parent, worldPosition, worldQuaternion);
}

function garageDoorGroupKey(object) {
  const normalized = String(object.name || 'garage-door')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const numbered = normalized.match(/(garage_door_\d+)(?:_(?:panel_?)?\d+)?(?:_|$)/);
  if (numbered) return numbered[1];
  return normalized.replace(/_(?:panel|section|segment)_?\d+$/, '') || 'garage-door';
}

function prepareGarageDoors() {
  garageDoorRecords.clear();
  const groups = new Map();
  garageDoorMeshes.forEach(object => {
    const key = garageDoorGroupKey(object);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(object);
  });

  groups.forEach((objects, key) => {
    const box = new THREE.Box3();
    objects.forEach(object => box.expandByObject(object, true));
    const size = box.getSize(new THREE.Vector3());
    if (size.y < 0.8 || Math.max(size.x, size.z) < 0.5) return;

    const center = box.getCenter(new THREE.Vector3());
    const normalAxis = size.x <= size.z ? 'x' : 'z';
    const inward = new THREE.Vector3();
    const centerDelta = modelCenter[normalAxis] - center[normalAxis];
    inward[normalAxis] = Math.abs(centerDelta) > 0.01 ? Math.sign(centerDelta) : -1;

    const liftRatio = THREE.MathUtils.clamp(Number(config.garage_door_lift_ratio) || defaults.garage_door_lift_ratio, 0.5, 1.5);
    const insetRatio = THREE.MathUtils.clamp(Number(config.garage_door_inset_ratio) || defaults.garage_door_inset_ratio, 0, 0.8);
    const record = {
      kind: 'garage',
      key,
      objects: objects.map(object => ({
        object,
        parent: object.parent,
        originalWorldPosition: object.getWorldPosition(new THREE.Vector3()),
        originalWorldQuaternion: object.getWorldQuaternion(new THREE.Quaternion()),
      })),
      inward,
      lift: Math.max(size.y * liftRatio, 1),
      inset: Math.max(size.y * insetRatio, 0.25),
      progress: 0,
      from: 0,
      to: 0,
      startedAt: 0,
    };
    objects.forEach(object => garageDoorRecords.set(object, record));
  });
}

function setGarageDoorProgress(record, progress) {
  // Simplified sectional motion: lift the complete door above the opening and
  // ease it inward toward the garage ceiling. Grouped panel meshes stay aligned.
  const liftProgress = 1 - Math.pow(1 - progress, 2);
  const insetProgress = progress * progress;
  const movement = new THREE.Vector3(0, record.lift * liftProgress, 0)
    .addScaledVector(record.inward, record.inset * insetProgress);
  record.objects.forEach(item => {
    applyObjectWorldTransform(
      item.object,
      item.parent,
      item.originalWorldPosition.clone().add(movement),
      item.originalWorldQuaternion,
    );
  });
}

function setDoorProgress(record, progress) {
  if (record.kind === 'garage') setGarageDoorProgress(record, progress);
  else setHingedDoorProgress(record, progress);
}

function toggleDoor(record) {
  if (!record) return false;
  record.from = record.progress;
  record.to = record.progress > 0.5 ? 0 : 1;
  record.startedAt = performance.now();
  return true;
}

function updateDoors(now) {
  const records = new Set([...doorRecords.values(), ...garageDoorRecords.values()]);
  records.forEach(record => {
    if (record.progress === record.to) return;
    const configuredSeconds = record.kind === 'garage'
      ? Number(config.garage_door_animation_seconds) || defaults.garage_door_animation_seconds
      : Number(config.door_animation_seconds) || defaults.door_animation_seconds;
    const seconds = Math.max(0.12, configuredSeconds);
    const raw = THREE.MathUtils.clamp((now - record.startedAt) / (seconds * 1000), 0, 1);
    const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    record.progress = THREE.MathUtils.lerp(record.from, record.to, eased);
    setDoorProgress(record, record.progress);
    if (raw >= 1) record.progress = record.to;
  });
}

function doorAtScreen(clientX, clientY) {
  if (!doorRecords.size && !garageDoorRecords.size) return null;
  const rect = canvas.getBoundingClientRect();
  const x = Number.isFinite(clientX) ? clientX : rect.left + rect.width * 0.5;
  const y = Number.isFinite(clientY) ? clientY : rect.top + rect.height * 0.5;
  const pointer = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -(((y - rect.top) / rect.height) * 2 - 1));
  raycaster.setFromCamera(pointer, camera);
  raycaster.near = 0;
  const hingedLimit = Number(config.door_max_distance) || defaults.door_max_distance;
  const garageLimit = Number(config.garage_door_max_distance) || defaults.garage_door_max_distance;
  raycaster.far = Math.max(hingedLimit, garageLimit);
  const targets = [...doorRecords.keys(), ...garageDoorRecords.keys()];
  const hits = raycaster.intersectObjects(targets, false);
  for (const hit of hits) {
    const record = garageDoorRecords.get(hit.object) || doorRecords.get(hit.object);
    const limit = record?.kind === 'garage' ? garageLimit : hingedLimit;
    if (record && hit.distance <= limit) return record;
  }
  return null;
}

function interactDoorAt(clientX, clientY) {
  const record = doorAtScreen(clientX, clientY);
  if (!record) return false;
  clearTimeout(pointerLockTimer);
  pointerLockTimer = null;
  return toggleDoor(record);
}

const mobileMovementKeys = ['MobileForward', 'MobileBack', 'MobileLeft', 'MobileRight', 'MobileRise', 'MobileLower'];
function clearMovementState() {
  mobileMovementKeys.forEach(key => { keys[key] = false; });
  document.querySelectorAll('#mobileControls button.active').forEach(button => button.classList.remove('active'));
}
function clearGestureState() {
  dragging = false;
  dragPointer = null;
  pinchDistance = 0;
  activePointers.clear();
  clearMovementState();
}
function clampFlyHeight(position) {
  const eye = Number(config.eye_height) || defaults.eye_height;
  const configuredMinimum = Number(config.min_fly_height);
  const minimum = Number.isFinite(configuredMinimum)
    ? landLevelY + Math.max(0, configuredMinimum)
    : landLevelY + eye;
  position.y = THREE.MathUtils.clamp(position.y, minimum, flyCeilingY);
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
    if (keys.ArrowLeft) yaw = normalizeYaw(yaw + 1.85 * delta);
    if (keys.ArrowRight) yaw = normalizeYaw(yaw - 1.85 * delta);
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
    clampFlyHeight(position);
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
  fov = state.fov;
  fly = flyMode;
  if (flyMode) clampFlyHeight(camera.position);
  lookAtAngles(camera.position, state.target);
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
function resetView() { clearGestureState(); applyState(startState, false); }
function applyExteriorState(state) {
  clearGestureState();
  applyState(state, true);
}
function exteriorView() {
  if (!Array.isArray(config.exterior_position)) exteriorState = buildExteriorState('front');
  applyExteriorState(exteriorState);
}
function backExteriorView() {
  backExteriorState = buildExteriorState('back');
  applyExteriorState(backExteriorState);
}
function leftExteriorView() {
  leftExteriorState = buildExteriorState('left');
  applyExteriorState(leftExteriorState);
}
function rightExteriorView() {
  rightExteriorState = buildExteriorState('right');
  applyExteriorState(rightExteriorState);
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
  if (event.code === 'KeyJ') leftExteriorView();
  if (event.code === 'KeyL') rightExteriorView();
  if (event.code === 'KeyR') toggleRoof();
  if (event.code === 'KeyU') toggleSlabs();
  if (event.code === 'KeyX') resetView();
  if (event.code === 'KeyI') toggleUI();
  if (event.code === 'KeyT') toggleTools();
}, { passive: false });
window.addEventListener('keyup', event => { keys[event.code] = false; });
window.addEventListener('blur', () => { Object.keys(keys).forEach(key => { keys[key] = false; }); clearGestureState(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) clearGestureState(); });
canvas.addEventListener('click', event => {
  if (!window.matchMedia('(pointer:fine)').matches || document.pointerLockElement === canvas) return;
  clearTimeout(pointerLockTimer);
  pointerLockTimer = setTimeout(() => canvas.requestPointerLock?.(), 360);
});
canvas.addEventListener('dblclick', event => {
  event.preventDefault();
  clearTimeout(pointerLockTimer);
  pointerLockTimer = null;
  interactDoorAt(document.pointerLockElement === canvas ? undefined : event.clientX, document.pointerLockElement === canvas ? undefined : event.clientY);
});
document.addEventListener('mousemove', event => {
  if (document.pointerLockElement !== canvas) return;
  applyLookDelta(event.movementX, event.movementY, 0.0022, 0.002);
});
canvas.addEventListener('wheel', event => { event.preventDefault(); setFov(fov + Math.sign(event.deltaY) * 3); }, { passive: false });

function isControlTarget(target) { return Boolean(target.closest('button,#ui,#quickToggles,#mobileControls')); }
canvas.addEventListener('pointerdown', event => {
  if (isControlTarget(event.target)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, startedAt: performance.now(), moved: false });
  canvas.setPointerCapture?.(event.pointerId);
  if (activePointers.size === 1) { dragging = true; dragPointer = event.pointerId; dragX = event.clientX; dragY = event.clientY; }
  if (activePointers.size === 2) {
    const points = [...activePointers.values()];
    pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }
});
canvas.addEventListener('pointermove', event => {
  if (!activePointers.has(event.pointerId)) return;
  const pointerRecord = activePointers.get(event.pointerId);
  pointerRecord.x = event.clientX;
  pointerRecord.y = event.clientY;
  if (Math.hypot(event.clientX - pointerRecord.startX, event.clientY - pointerRecord.startY) > 10) pointerRecord.moved = true;
  activePointers.set(event.pointerId, pointerRecord);
  if (activePointers.size === 2) {
    const points = [...activePointers.values()];
    const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    if (pinchDistance) setFov(fov - (distance - pinchDistance) * 0.045);
    pinchDistance = distance;
    return;
  }
  if (dragging && dragPointer === event.pointerId) {
    const deltaX = event.clientX - dragX;
    const deltaY = event.clientY - dragY;
    // Exterior presets only reposition the camera. They never switch touch
    // controls into an orbit mode, so swipe direction remains identical before
    // and after FRONT, BACK, SIDE L, or SIDE R.
    applyLookDelta(deltaX, deltaY, 0.006, 0.005);
    dragX = event.clientX; dragY = event.clientY;
  }
});
function endPointer(event) {
  const pointerRecord = activePointers.get(event.pointerId);
  const wasSinglePointer = activePointers.size === 1;
  activePointers.delete(event.pointerId);
  if (dragPointer === event.pointerId) { dragging = false; dragPointer = null; }
  if (activePointers.size < 2) pinchDistance = 0;
  if (event.type === 'pointerup' && event.pointerType !== 'mouse' && pointerRecord && wasSinglePointer && !pointerRecord.moved) {
    const now = performance.now();
    const closeEnough = Math.hypot(event.clientX - lastTouchTap.x, event.clientY - lastTouchTap.y) < 34;
    if (now - lastTouchTap.time < 360 && closeEnough) {
      interactDoorAt(event.clientX, event.clientY);
      lastTouchTap = { time: 0, x: 0, y: 0 };
    } else {
      lastTouchTap = { time: now, x: event.clientX, y: event.clientY };
    }
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
window.addEventListener('pointercancel', () => clearMovementState());

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
  button.addEventListener('lostpointercapture', up);
}
function bindTap(id, action) { document.getElementById(id)?.addEventListener('click', event => { event.preventDefault(); action(); }); }
bindHold('moveForward','MobileForward'); bindHold('moveBack','MobileBack'); bindHold('moveLeft','MobileLeft'); bindHold('moveRight','MobileRight');
const enableMobileVerticalMovement = () => { if (!fly) { fly = true; updateStatus(); } };
bindHold('riseBtn','MobileRise',enableMobileVerticalMovement); bindHold('lowerBtn','MobileLower',enableMobileVerticalMovement);
bindTap('exteriorBtn',exteriorView); bindTap('backExteriorBtn',backExteriorView); bindTap('leftExteriorBtn',leftExteriorView); bindTap('rightExteriorBtn',rightExteriorView); bindTap('roofBtn',toggleRoof); bindTap('upperBtn',toggleSlabs); bindTap('resetBtn',resetView);
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
  updateDoors(performance.now());
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
