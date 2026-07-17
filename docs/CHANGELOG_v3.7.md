# Version 3.7 — One-file property details

- Added optional `property-details.json` support to the one-folder importer.
- Project title, summary, category, status, facts, pricing, checkout behavior, carousel settings, and tour labels can now be controlled from one file.
- `property-details.json` overrides README inference; README remains the fallback when the JSON file is absent.
- A positive price with a checkout URL creates a Buy Now action.
- Contact-for-pricing projects continue to open the property-aware contact popup.
- A numeric price without a checkout URL safely retains Request Details.
- Added a reusable template and plain-language guide under `content/project-templates/`.
