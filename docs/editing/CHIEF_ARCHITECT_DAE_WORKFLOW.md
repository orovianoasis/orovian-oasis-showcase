# Chief Architect DAE → automatic GitHub walkthrough

This repository can now create the custom Orovian Oasis walkthrough without ChatGPT and without the Chief Architect cloud viewer.

## What to export from Chief Architect Premier

Open a Perspective Full Overview containing the layers and materials that should appear online, then export the 3D model as **Collada / DAE**.

Keep the DAE and every texture file Chief creates together. A typical upload folder is:

```text
content/projects/new-house/
├── property-details.json
├── cover-front.webp
├── cover-back.webp
├── new-house.dae
├── textures/
│   ├── stone.jpg
│   ├── wood.jpg
│   └── roofing.png
├── ground-floor.dxf
└── upper-floor.dxf
```

Upload that one extracted folder to `content/projects/` and commit it. Do not upload the ZIP itself.

## What GitHub does

The Pages workflow automatically:

1. Detects the DAE export.
2. Installs a compatible Blender converter on the GitHub runner.
3. Converts the DAE and referenced textures into one browser-ready `house.glb`.
4. Copies the permanent Orovian walkthrough interface.
5. Derives floor following and movement collision from the GLB at runtime.
6. Publishes the same RUN, FLY, UP, DOWN, EXTERIOR, ROOF, SLABS, RESET, keyboard, mouse, D-pad, touch-look, and pinch-zoom controls.
7. Builds the normal project, floor-plan, and tour pages.

Generated conversion files are temporary build products. They do not need to be uploaded or committed.

## Existing custom HTML/GLB projects

Existing projects that already contain both a walkthrough HTML file and a GLB continue using those files unchanged.

To deliberately replace an existing custom tour with the DAE-generated tour, set this inside `property-details.json`:

```json
"walkthrough": {
  "prefer_dae": true
}
```

## Optional camera and layer adjustments

The walkthrough automatically creates a starting view and exterior view. Leave the coordinate values as `null` to use those defaults.

```json
"walkthrough": {
  "entry_position": null,
  "entry_target": null,
  "exterior_position": null,
  "exterior_target": null,
  "roof_match": ["roof", "roofing"],
  "slab_match": ["slab", "floor platform"]
}
```

When exact coordinates are supplied, use `[x, y, z]` values in the converted model's world coordinates. The generated tour contains `conversion-report.json`, which records model bounds for troubleshooting.

`roof_match` and `slab_match` compare the exported Chief object and material names. Add another matching phrase when a visibility button says that no layer was tagged.

## Updating a property

Export the DAE again from Chief and replace the old DAE and updated textures inside the same project folder. Commit the replacements. GitHub recognizes the changed model, reconverts it, and republishes the same project URL.

Replace cover images, DXFs, or `property-details.json` only when those items changed too.
