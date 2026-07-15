# Projects

Each live project receives one folder:

```text
content/projects/project-slug/
├── project.toml
├── assets/
│   ├── cover.webp
│   ├── card.webp
│   ├── share.webp
│   └── gallery/
├── floor-plans/
└── tour/
```

- Edit `project.toml` for price, status, facts, purchase links, labels, and other fluid data.
- Put that project's PNG, JPEG, WebP, SVG, and gallery media inside its own `assets/` folder.
- Put customer-facing floor plans, PDFs, and optional DXFs in `floor-plans/`.
- Put `viewer.html`, `house.glb`, `collision.json`, and `manifest.json` in `tour/` only when the walkthrough is ready.
- Set `published = true` only after the referenced files exist.
