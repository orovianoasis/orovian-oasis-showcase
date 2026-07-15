# Content workflow

```text
Chief Architect / renovation project / listing data
                    ↓
      content/projects/PROJECT-SLUG/
                    ↓
             project.toml
      media + floor plans + tour files
                    ↓
          Commit and push to main
                    ↓
      GitHub Action validates and builds
                    ↓
        showcase.orovianoasis.com
```

## What stays private elsewhere

Keep these in a separate private source repository:

- Chief Architect `.plan` and `.layout` files
- unredacted client documents
- surveys, contracts, and acquisition documents
- detailed budgets that are not meant for the public
- original high-resolution source exports
- private addresses and access instructions

Only publish customer-facing media, sanitized metadata, optimized walkthrough files, public floor-plan files, and hosted checkout links here.

## Folder convention

- `website/` = all editable HTML, CSS, and JavaScript in one place.
- `assets/` = logos, icons, images, thumbnails, and other media.
- Each project stores its own uploaded media in `content/projects/PROJECT-SLUG/assets/`.
