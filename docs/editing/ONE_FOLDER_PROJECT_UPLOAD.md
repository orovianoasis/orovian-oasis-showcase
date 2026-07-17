# One-folder property upload

Upload one extracted property folder into `content/projects/`.

## Chief Architect automatic walkthrough folder

```text
new-house/
├── property-details.json
├── cover-front.webp
├── cover-back.webp
├── new-house.dae
├── textures/
├── ground-floor.dxf
└── upper-floor.dxf
```

This is the preferred new workflow. GitHub Actions converts the DAE and its referenced texture files to a GLB, connects it to the permanent walkthrough interface, and publishes the tour automatically.

Do not upload the ZIP. Extract it and upload the one outer project folder.

## Existing custom walkthrough folder

Existing packages remain supported:

```text
luxury-custom-home/
├── property-details.json
├── cover-front.webp
├── cover-back.webp
├── walkthrough.html
├── model.glb
├── ground-floor.dxf
└── upper-floor.dxf
```

When both HTML and GLB are present, the website preserves that tour rather than reconverting it.

## The one editable control file

Copy:

```text
content/project-templates/property-details-template.json
```

into the property folder and rename the copy:

```text
property-details.json
```

Edit that one file to change title, summary, category, location, publication status, featured status, square footage, bedrooms, bathrooms, garage, stories, price, checkout link, button labels, carousel behavior, and optional walkthrough settings.

The outer folder name controls the permanent URL. Changing `title` changes the displayed name everywhere without breaking that URL.

## Pricing behavior

```json
"price": null,
"checkout_url": ""
```

Displays **Contact for pricing** and opens the property-aware Contact Us popup.

```json
"price": 125000,
"checkout_url": ""
```

Displays **$125,000** and keeps **Request Details**.

```json
"price": 125000,
"checkout_url": "https://your-checkout-link.example"
```

Displays **$125,000** and replaces Request Details with **Buy Now**.

Set `show_contact_with_buy_button` to `true` to display both buttons.

## Walkthrough adjustments

Most DAE exports need no manual walkthrough settings. Optional values live under `walkthrough` in `property-details.json`:

```json
"walkthrough": {
  "entry_position": null,
  "entry_target": null,
  "exterior_position": null,
  "exterior_target": null,
  "roof_match": ["roof", "roofing"],
  "slab_match": ["slab", "floor platform"]
}
```

Leave camera positions as `null` for automatic placement. Add object or material name fragments to the matching lists when Chief exports different roof or slab names.

Full DAE instructions: `docs/editing/CHIEF_ARCHITECT_DAE_WORKFLOW.md`

## JSON rules

- Text uses double quotes.
- Entries are separated by commas.
- Numbers do not use quotes.
- Boolean values are `true` or `false` without quotes.
- No public price is `null` without quotes.
- JSON does not permit comments.

An invalid JSON file stops the build and reports the exact line and column.
