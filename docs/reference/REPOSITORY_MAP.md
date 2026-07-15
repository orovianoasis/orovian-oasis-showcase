# Repository map

```text
orovian-showcase/
├── website/                 All editable visual website files
│   ├── index.html           Homepage source
│   ├── _layout.html         Shared head, header, navigation, footer
│   ├── listing.html         Category gallery source
│   ├── project.html         Project-detail source
│   ├── floor-plans.html     Floor-plan source
│   ├── tour-placeholder.html
│   ├── 404.html
│   ├── css/site.css
│   └── js/site.js
├── assets/                  Global PNG, JPG, WebP, SVG, logos, icons, media
├── content/
│   ├── site.toml            Company-wide and commerce settings
│   ├── navigation.toml      Menu labels and destinations
│   ├── project-templates/   Duplicate one to create a project
│   └── projects/            One folder and project.toml per project
├── scripts/                 Build and validation engine
├── tools/                   Windows creation, build, and preview launchers
├── docs/                    Organized documentation
│   ├── getting-started/     Setup and upload instructions
│   ├── editing/             Website and content workflows
│   ├── deployment/          GitHub Pages and domain setup
│   ├── reference/           Field guide, map, and release checklist
│   └── internal/            Checksums, manifest, and validation report
├── dist/                    Generated public website; never edit manually
└── .github/workflows/       Automatic validation and GitHub Pages deployment
```

## Where to edit

- Overall page layout: `website/*.html`
- Site appearance: `website/css/site.css
website/css/mobile.css`
- Menus, animation, galleries, filters, and interaction: `website/js/site.js
website/js/mobile.js`
- Global uploaded media: `assets/`
- Property-specific media: `content/projects/SLUG/assets/`
- Price, availability, dimensions, links, and metadata: `content/projects/SLUG/project.toml`
- Company-wide configuration: `content/site.toml`
- Navigation: `content/navigation.toml`

The build combines these sources into `dist/index.html` and the generated category/project pages.
