# Quick start

## 1. Create the repository

Create a new **public** GitHub repository named:

```text
orovian-showcase
```

Upload the **contents** of this folder to the root of that repository.

## 2. Enable GitHub Pages

Open the new repository and select:

```text
Settings → Pages → Source → GitHub Actions
```

The included deployment workflow builds the site from the files in `content/` and publishes the generated `dist/` directory.

## 3. Configure the custom domain

In the same Pages settings, enter:

```text
showcase.orovianoasis.com
```

At the domain provider, create a CNAME record:

```text
Host / Name: showcase
Target / Value: orovianoasis.github.io
```

Do not add `/orovian-showcase` to the CNAME target.

## 4. Confirm the starter

The repository contains one published structure demo. It proves the gallery, project detail page, floor-plan route, generated catalog data, and deployment pipeline are connected. Remove or unpublish it after the final page design is installed.

## 5. Add the first real project

Export the property from Chief Architect as Collada/DAE with its texture files, add `cover.webp` or front/back cover images, and upload the entire extracted folder into:

```text
content/projects/
```

GitHub Actions converts the DAE, connects the permanent custom walkthrough controls, and publishes it automatically. Existing HTML/GLB walkthrough packages remain supported. Do not upload the ZIP itself.

See `docs/editing/CHIEF_ARCHITECT_DAE_WORKFLOW.md`.

## Folder convention

- `website/` = all editable HTML, CSS, and JavaScript in one place.
- `assets/` = logos, icons, images, thumbnails, and other media.
- Each project stores its own uploaded media in `content/projects/PROJECT-SLUG/assets/`.

## Design the website

- Homepage: `website/index.html`
- Shared shell: `website/_layout.html`
- Styling: `website/css/site.css`
- Interaction: `website/js/site.js`

Run `tools/Preview_Local.bat` after an edit.
