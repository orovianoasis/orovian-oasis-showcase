# Orovian Oasis Showcase

Public GitHub Pages repository for:

- **Concept Homes** — original designs, floor plans, interactive walkthroughs, and licensing packages
- **Transformations** — fix-and-flip projects, rehabs, and before/after stories
- **Properties** — physical properties that are actively available, pending, sold, or archived

Target domain: **showcase.orovianoasis.com**

## The main project-upload rule

For the normal workflow, extract a completed property package, add `cover.webp`, and upload that **one folder** into:

```text
content/projects/
```

`project.toml` is optional. The build automatically reads `README.txt`, detects the walkthrough HTML, GLB, and DXFs, generates the website connection files, creates browser previews, and publishes the property. Original long filenames and underscores are accepted; public URLs are converted to hyphens automatically.

Use `project.toml` only for advanced overrides such as exact pricing, checkout links, status, category, SEO, or licensing details.

Start with the [One-folder upload guide](docs/editing/ONE_FOLDER_PROJECT_UPLOAD.md).

## Folder convention

- `website/` = all editable HTML, CSS, and JavaScript in one place.
- `assets/` = logos, icons, images, thumbnails, and other media.
- Each project stores its own uploaded media in `content/projects/PROJECT-SLUG/assets/`.

## Visual-editing workspace

The homepage source is `website/index.html`. All page HTML, CSS, and JavaScript are grouped under `website/`, while `assets/` remains reserved for images and other media. The generated public homepage is `dist/index.html`.


## Desktop and mobile editing

The presentation layers are separated for safer visual updates:

- `website/css/site.css` — shared and desktop styling
- `website/css/mobile.css` — mobile/tablet-only styling
- `website/js/mobile.js` — optional mobile-only behavior

See the [Mobile design editing guide](docs/editing/MOBILE_DESIGN_GUIDE.md).

## Documentation

- [Quick start](docs/getting-started/QUICK_START.md)
- [Editing guide](docs/editing/EDITING_GUIDE.md)
- [One-folder project upload](docs/editing/ONE_FOLDER_PROJECT_UPLOAD.md)
- [Content workflow](docs/editing/CONTENT_WORKFLOW.md)
- [Custom-domain setup](docs/deployment/CUSTOM_DOMAIN_SETUP.md)
- [Repository map](docs/reference/REPOSITORY_MAP.md)
- [Project-field reference](docs/reference/PROJECT_FIELD_REFERENCE.md)
- [Release checklist](docs/reference/RELEASE_CHECKLIST.md)


## Visual system 2.0

The redesigned interface uses a floating auto-hiding header, a native left-side dropdown menu, centered project cards, a plum/mint/coral palette, and social icons in the footer.

- `website/css/site.css` controls the complete visual system.
- `website/js/site.js` contains only essential lightweight behavior.
- `website/js/dynamics.js` contains optional scroll reveals, header auto-hide, tilt, pointer glow, and button ripple effects.
- Removing `dynamics.js` does not break navigation, project data, pricing, floor plans, or the native menu.
- Add social profile URLs under `[social]` in `content/site.toml`.

## Interface update 2.5

- The header, footer, quick-contact, Contact Us, and About logos use the tighter `assets/brand/logo-tight.webp` derivative.
- Footer and dialog logos use reusable orbit classes; the footer orbit runs opposite the header orbit.
- Clicking the footer logo opens the compact About Orovian Oasis dialog.
- JavaScript-enhanced dialogs open and close with one click while preserving the visitor's exact scroll position. CSS `:target` remains the no-JavaScript fallback.
- Privacy Policy and Terms & Conditions pages are generated from `website/privacy.html` and `website/terms.html`. Their destinations can be changed in `[legal]` inside `content/site.toml`.

## Favicon

Replace `assets/brand/favicon.png` with any square PNG favicon, preferably **512 × 512 pixels**. Keep the filename unchanged; every generated page already references it.

