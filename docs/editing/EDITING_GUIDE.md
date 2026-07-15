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
├── css/
│   ├── site.css
│   └── mobile.css
└── js/
    ├── site.js
    ├── dynamics.js
    └── mobile.js
```

- Edit `website/index.html` for the front-page sections.
- Edit `website/_layout.html` for the shared header, navigation placement, metadata structure, and footer.
- Edit `website/css/site.css` for shared and desktop visual design.
- Edit `website/css/mobile.css` for mobile/tablet-only visual changes.
- Edit `website/js/site.js` for tiny shared essential behavior.
- Edit `website/js/dynamics.js` for shared optional motion.
- Edit `website/js/mobile.js` for mobile-only optional behavior.
- See [Mobile design editing guide](MOBILE_DESIGN_GUIDE.md).
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


## Dynamics

Edit `website/js/dynamics.js` for shared optional motion effects and `website/js/mobile.js` for mobile-only enhancements. Core year output remains in `website/js/site.js`. The HTML and CSS remain usable when either optional script is removed or blocked.
