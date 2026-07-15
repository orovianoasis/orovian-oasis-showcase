# One-folder property upload

The default workflow does **not** require `project.toml`.

## What to upload

Extract the property package and add one or more WebP cover images to the same folder as the exported files. Use `cover-front.webp` and `cover-back.webp` for the normal front/rear slideshow. Additional files such as `cover-03.webp` are also detected.

```text
luxury_custom_home/
├── cover-front.webp
├── cover-back.webp
├── Luxury_Custom_Home_Ground_Floor.dxf
├── Luxury_Custom_Home_Upper_Floor.dxf
├── Luxury_Custom_Home_Drawing_Index.dxf
├── Luxury_Custom_Home_Walkable_Model.glb
├── Luxury_Custom_Home_Interactive_Walkthrough_Keyboard_Turn.html
├── Luxury_Custom_Home_Geometry.obj
└── README.txt
```

Upload that entire extracted folder into:

```text
content/projects/
```

Do not upload the ZIP file. GitHub stores ZIP files without extracting them.

## What the website does automatically

During the GitHub Actions build, the importer:

- Converts spaces and underscores in the folder name into a hyphenated public URL.
- Reads the project title, summary, square footage, bedrooms, bathrooms, garage, and stories from `README.txt` when available.
- Detects the walkthrough HTML and GLB model without renaming the source files.
- Copies all required walkthrough support files while excluding source-only OBJ, PLAN, DWG, and ZIP files from the public tour.
- Generates `viewer.html`, `house.glb`, `collision.json`, and `manifest.json` in the published output.
- Detects every DXF file, creates a browser-viewable SVG preview, and keeps the original DXF as a download.
- Detects every image whose filename begins with `cover` and creates the homepage-card and project-page carousel. With only one cover, it behaves as a static image.
- Uses `project_carousel_autoplay` and `project_carousel_interval_ms` from `content/site.toml` for global slideshow behavior.
- Publishes the property automatically.
- Hides the Structure Demo after the first real property is detected.
- Features the first real property automatically when no project has been explicitly featured.

## Automatic category choice

The importer reads the folder and README text:

- `rehab`, `fix-and-flip`, `renovation`, or `transformation` → **Transformations**
- `MLS`, `listing`, or `for sale` → **Properties**
- Everything else → **Concept Homes**

## Optional advanced control

A manually organized project containing `project.toml` still works exactly as before. Use it only when you need precise control over price, status, category, checkout links, licensing text, SEO, or featured placement.

The simple one-folder workflow and advanced `project.toml` workflow can exist together in the same repository.

## Autoplay or manual/static mode

The default rotates every five seconds and still supports arrows, dots, mouse clicks, and touch swipes. In `content/site.toml`:

```toml
project_carousel_autoplay = true
project_carousel_interval_ms = 5000
```

Change autoplay to `false` to keep every carousel manual/static while preserving its arrows and swipe controls. Advanced `project.toml` projects can override this with a `[carousel]` section.
