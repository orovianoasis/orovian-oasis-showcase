# Luxury Custom Home — Website Project Folder

This folder is ready for the Orovian Oasis Showcase build system.

## Supplied files used

- `tour/viewer.html` — renamed from the supplied interactive walkthrough HTML.
- `tour/house.glb` — renamed from the supplied walkable GLB model.
- `floor-plans/luxury-custom-home-ground-floor.dxf`
- `floor-plans/luxury-custom-home-upper-floor.dxf`
- `floor-plans/luxury-custom-home-drawing-index.dxf`
- `source-files/luxury-custom-home-geometry.obj` — preserved but not required by the website.

## Website support files generated automatically

- `project.toml` — connects the property to the showcase.
- `tour/collision.json` — extracted from the collision data embedded in `viewer.html`.
- `tour/manifest.json` — describes the tour package.
- `assets/*.svg` — public project artwork.
- `floor-plans/*.svg` — browser previews generated from the supplied DXF drawings.

Chief Architect Premier is **not required** to publish this package because the browser-ready HTML walkthrough, GLB model, and DXF drawings already exist. Chief Architect is only needed later when you want to revise the design or export new model/drawing files.
