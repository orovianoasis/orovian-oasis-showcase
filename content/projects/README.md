# Upload property folders here

Upload **one extracted property folder** directly into this directory.

```text
content/projects/luxury_custom_home/
├── property-details.json
├── cover-front.webp
├── cover-back.webp
├── README.txt
├── ...Walkthrough....html
├── ...Model....glb
└── one or more .dxf files
```

`property-details.json` is recommended but optional. It is the editable control panel for the public title, description, category, status, square footage, bedrooms, bathrooms, garage, stories, price, checkout link, carousel behavior, and tour-button text.

When `property-details.json` is missing, the importer falls back to information detected from `README.txt`.

The GitHub Actions build automatically:

- Creates a hyphenated public URL from the folder name.
- Reads editable project data from `property-details.json`.
- Uses `README.txt` only as a fallback for omitted details.
- Connects the walkthrough HTML and GLB.
- Generates required tour metadata.
- Creates visible SVG previews from DXF drawings.
- Uses every `cover*` image as a swipeable project slideshow.
- Displays Contact for pricing when `price` is `null`.
- Displays a numeric price when `price` contains a number.
- Replaces Request Details with Buy Now when both a price and `checkout_url` are supplied.

Do **not** upload the ZIP itself. Extract it first, then drag the entire folder here.

Template: `content/project-templates/property-details-template.json`

Full instructions: `docs/editing/ONE_FOLDER_PROJECT_UPLOAD.md`

Folders containing `project.toml` remain supported for advanced manual control.
