# Website design workspace

This folder contains the editable visual website in one place.

| File | Purpose |
|---|---|
| `index.html` | Homepage sections and front-page layout |
| `_layout.html` | Shared document shell, metadata, header, navigation, and footer |
| `listing.html` | Concept Homes, Transformations, and Properties listing layout |
| `project.html` | Individual project detail-page layout |
| `floor-plans.html` | Customer-facing floor-plan layout |
| `tour-placeholder.html` | Message shown before a 3D tour is published |
| `404.html` | Page-not-found layout |
| `css/site.css` | All shared website styling |
| `js/site.js` | All shared website interactions |

## Editing rule

- Change the **overall visual website** here.
- Change company-wide text and settings in `content/site.toml` and `content/navigation.toml`.
- Change a property's price, status, dimensions, links, and metadata in its `project.toml`.
- Put image and media files in `assets/` or the relevant project's `assets/` folder.
- Do not manually edit `dist/`; it is regenerated.

Run `tools/Preview_Local.bat` to build and preview the finished site.


## Motion layer

`js/dynamics.js` adds scroll reveals, header auto-hide, card tilt, pointer glow, and button ripples. Removing its script tag disables those effects without breaking navigation or content.
