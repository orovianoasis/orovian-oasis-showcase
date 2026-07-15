# Upload property folders here

For the easiest workflow, upload **one extracted property folder** directly into this directory.

```text
content/projects/luxury_custom_home/
├── cover-front.webp
├── cover-back.webp
├── README.txt
├── ...Walkthrough....html
├── ...Model....glb
└── one or more .dxf files
```

That is enough. `project.toml` is optional.

The GitHub Actions build automatically:

- Creates a hyphenated public URL from the folder name.
- Reads project details from `README.txt`.
- Connects the walkthrough HTML and GLB.
- Generates the required tour metadata.
- Creates visible SVG previews from the DXF drawings.
- Uses every `cover*.webp` image as a swipeable project slideshow. A single `cover.webp` still works.

Do **not** upload the ZIP itself. Extract it first, add one or more `cover*.webp` images, then drag the entire folder here.

Full instructions: `docs/editing/ONE_FOLDER_PROJECT_UPLOAD.md`

Folders containing `project.toml` remain supported for advanced manual control.
