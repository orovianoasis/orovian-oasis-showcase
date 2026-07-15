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
| `css/site.css` | Shared styling and desktop presentation |
| `css/mobile.css` | Phone/tablet-only styling; does not affect desktop |
| `js/site.js` | Tiny shared essential behavior |
| `js/contact.js` | Contact popup, form enhancement, and optional direct form endpoint |
| `js/dynamics.js` | Optional shared motion and polish |
| `js/mobile.js` | Optional phone/tablet-only behavior |

## Desktop and mobile separation

- Edit `css/site.css` for shared or desktop-facing design.
- Edit `css/mobile.css` for phone/tablet-only visual changes. It is applied only at 880px and below.
- Edit `js/mobile.js` for mobile-only behavior. It is guarded by the same breakpoint.
- Shared HTML and project data continue to update both views automatically.

## Editing rule

- Change the **overall visual website** here.
- Change company-wide text and settings in `content/site.toml` and `content/navigation.toml`.
- Change a property's price, status, dimensions, links, and metadata in its `project.toml`.
- Put image and media files in `assets/` or the relevant project's `assets/` folder.
- Do not manually edit `dist/`; it is regenerated.

Run `tools/Preview_Local.bat` to build and preview the finished site.


## Motion layer

`js/contact.js` enhances the CSS-based contact popups and form. The popups still open without JavaScript, and the form falls back to the configured email application when no direct endpoint is supplied.

`js/dynamics.js` adds shared scroll reveals, header auto-hide, card tilt, pointer glow, blueprint motion, and button ripples. `js/mobile.js` is reserved for mobile-only behavior. Removing either optional motion script does not break navigation or content.
