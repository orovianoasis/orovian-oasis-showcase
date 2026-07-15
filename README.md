# Orovian Oasis Showcase

Public GitHub Pages repository for:

- **Concept Homes** — original designs, floor plans, interactive walkthroughs, and licensing packages
- **Transformations** — fix-and-flip projects, rehabs, and before/after stories
- **Properties** — physical properties that are actively available, pending, sold, or archived

Target domain: **showcase.orovianoasis.com**

## The main editing rule

Every project has one control panel:

```text
content/projects/PROJECT-SLUG/project.toml
```

Edit that file to change price, status, featured placement, public description, checkout links, facts, floor plans, materials, purchase options, and search metadata. Replace media in the same project folder. GitHub Actions validates, builds, and deploys the website automatically after a push to `main`.

Start with the [Quick Start Guide](docs/getting-started/QUICK_START.md).

## Folder convention

- `website/` = all editable HTML, CSS, and JavaScript in one place.
- `assets/` = logos, icons, images, thumbnails, and other media.
- Each project stores its own uploaded media in `content/projects/PROJECT-SLUG/assets/`.

## Visual-editing workspace

The homepage source is `website/index.html`. All page HTML, CSS, and JavaScript are grouped under `website/`, while `assets/` remains reserved for images and other media. The generated public homepage is `dist/index.html`.


## Documentation

- [Quick start](docs/getting-started/QUICK_START.md)
- [Editing guide](docs/editing/EDITING_GUIDE.md)
- [Content workflow](docs/editing/CONTENT_WORKFLOW.md)
- [Custom-domain setup](docs/deployment/CUSTOM_DOMAIN_SETUP.md)
- [Repository map](docs/reference/REPOSITORY_MAP.md)
- [Project-field reference](docs/reference/PROJECT_FIELD_REFERENCE.md)
- [Release checklist](docs/reference/RELEASE_CHECKLIST.md)
