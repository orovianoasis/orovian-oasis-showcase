# Walkthrough control engine invariants

The visible interface is intentionally unchanged. The movement/look implementation underneath it follows these rules:

1. **Rendered camera direction is authoritative.** Forward/back/strafe movement is based on `camera.getWorldDirection()`, not a separately reconstructed yaw vector.
2. **Preset views do not remap controls.** FRONT, BACK, SIDE L, and SIDE R only reposition/reorient the camera. WASD, D-pad, mouse, and touch keep the same first-person meaning.
3. **Three.js yaw sign is handled explicitly.** A `PerspectiveCamera` looks down local `-Z`; with YXZ Euler rotation, target-to-yaw uses `atan2(-x, -z)`.
4. **Touch gesture transitions reset their baseline.** Pinch temporarily suspends look rotation. When one finger remains, drag restarts from that finger's current position so stale coordinates cannot create a sudden turn or apparent inversion.
5. **Look input commits immediately.** Mouse/touch/Q-arrow changes update the camera before movement is calculated in the same frame.

Run `npm run test:controls` to check the direction-sign invariants without loading a model.
