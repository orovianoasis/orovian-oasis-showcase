# v3.8 — Automatic Chief Architect walkthrough build

Only the walkthrough-import pipeline and its documentation were changed.

- Added automatic COLLADA/DAE detection and conversion during GitHub Actions.
- Added the permanent Orovian Oasis walkthrough template and prebuilt browser runtime.
- Added runtime floor following, collision, walk/fly modes, exterior view, roof/slab visibility matching, keyboard, mouse, touch, D-pad, and pinch zoom.
- Added conversion caching so unchanged DAE models can reuse prior GLB output.
- Preserved existing HTML/GLB walkthrough packages without conversion.
- Added optional walkthrough camera, movement, and layer-matching settings to `property-details.json`.
- No website layout, colors, contact behavior, filters, project cards, pricing logic, or existing project content were redesigned.
