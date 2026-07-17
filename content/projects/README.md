# Upload property folders here

Upload **one extracted property folder** directly into this directory.

## Automatic Chief Architect workflow

```text
content/projects/new-house/
├── property-details.json
├── cover-front.webp
├── cover-back.webp
├── new-house.dae
├── textures/
├── ground-floor.dxf
└── upper-floor.dxf
```

GitHub Actions converts the Chief Architect DAE and its referenced textures into the permanent Orovian Oasis walkthrough automatically. No Chief cloud account, ChatGPT conversion, handwritten HTML, or manually created GLB is required.

## Existing walkthrough packages remain supported

```text
content/projects/luxury-custom-home/
├── property-details.json
├── cover-front.webp
├── cover-back.webp
├── README.txt
├── ...Walkthrough....html
├── ...Model....glb
└── one or more .dxf files
```

When both an HTML walkthrough and GLB already exist, the importer preserves them. Set `walkthrough.prefer_dae` to `true` in `property-details.json` only when a DAE should replace that existing tour.

`property-details.json` is recommended but optional. It controls the public title, description, category, status, square footage, bedrooms, bathrooms, garage, stories, price, checkout link, carousel behavior, tour text, optional camera positions, and roof/slab matching.

When it is missing, the importer falls back to information detected from `README.txt`.

The GitHub Actions build automatically:

- Creates a hyphenated public URL from the folder name.
- Reads editable project data from `property-details.json`.
- Converts a Chief Architect DAE into the reusable custom walkthrough when needed.
- Preserves an existing HTML/GLB walkthrough when supplied.
- Generates required tour metadata.
- Creates visible SVG previews from DXF drawings.
- Uses every `cover*` image as a swipeable project slideshow.
- Applies price, inquiry, and checkout behavior from the project details.

Do **not** upload the ZIP itself. Extract it first, then drag the entire folder here.

Template: `content/project-templates/property-details-template.json`

Chief workflow: `docs/editing/CHIEF_ARCHITECT_DAE_WORKFLOW.md`

Folders containing `project.toml` remain supported for advanced manual control.
