# One-folder property upload

Upload one extracted property folder into `content/projects/`.

```text
luxury_custom_home/
├── property-details.json
├── cover-front.webp
├── cover-back.webp
├── Luxury_Custom_Home_Ground_Floor.dxf
├── Luxury_Custom_Home_Upper_Floor.dxf
├── Luxury_Custom_Home_Drawing_Index.dxf
├── Luxury_Custom_Home_Walkable_Model.glb
├── Luxury_Custom_Home_Interactive_Walkthrough_Keyboard_Turn.html
├── Luxury_Custom_Home_Geometry.obj
└── README.txt
```

Do not upload the ZIP file. GitHub stores ZIP files without extracting them.

## The one editable control file

Copy:

```text
content/project-templates/property-details-template.json
```

into the property folder and rename the copy:

```text
property-details.json
```

Edit that one file to change the project title, summary, category, location, year, publication status, featured status, sorting, availability, square footage, bedrooms, bathrooms, garage, stories, lot size, price, checkout link, button labels, carousel behavior, and tour-button behavior.

The outer property-folder name controls the permanent URL. Changing `title` changes the displayed name everywhere without breaking the existing URL.

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

Displays **$125,000** and keeps **Request Details**, because no payment destination exists.

```json
"price": 125000,
"checkout_url": "https://your-checkout-link.example"
```

Displays **$125,000** and replaces Request Details with **Buy Now**.

Set `show_contact_with_buy_button` to `true` to display both buttons.

## Automatic importing

The build still detects the walkthrough HTML, GLB model, DXF floor plans, and every `cover*` image automatically. `property-details.json` controls metadata; it does not require you to rename or reorganize the exported architectural files.

When the JSON file is absent, `README.txt` remains the fallback source.

## JSON rules

- Text uses double quotes.
- Entries are separated by commas.
- Numbers do not use quotes.
- Boolean values are `true` or `false` without quotes.
- No public price is written as `null` without quotes.
- JSON does not permit comments.

An invalid JSON file stops the build and reports the exact line and column that needs correction.
