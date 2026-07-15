# Editing guide

## Visual website editing

Everything used to design the website is grouped inside `website/`:

```text
website/
├── index.html
├── _layout.html
├── listing.html
├── project.html
├── floor-plans.html
├── tour-placeholder.html
├── 404.html
├── css/site.css
└── js/site.js
```

- Edit `website/index.html` for the front-page sections.
- Edit `website/_layout.html` for the shared header, navigation placement, metadata structure, and footer.
- Edit `website/css/site.css` for visual design.
- Edit `website/js/site.js` for interactive behavior.
- Edit the other HTML files for category, project, floor-plan, tour-placeholder, and error-page layouts.

## Content editing

Do not hard-code changing project values into page HTML. Each project uses:

```text
content/projects/PROJECT-SLUG/project.toml
```

That control file manages price, status, featured placement, checkout link, inquiry link, square footage, bedrooms, bathrooms, garage, materials, floor plans, 3D tour state, Search Engine Optimization metadata, transformation details, and listing details.

## Media editing

- Global logos, icons, and shared images: `assets/`
- Project-specific images: `content/projects/PROJECT-SLUG/assets/`
- Floor-plan images and downloads: `content/projects/PROJECT-SLUG/floor-plans/`
- Walkthrough files: `content/projects/PROJECT-SLUG/tour/`

## Previewing

Run `tools/Preview_Local.bat`. It validates the source, builds `dist/`, starts a local server, and opens the finished website.

Never edit `dist/` directly. It is generated output and will be replaced on the next build.
