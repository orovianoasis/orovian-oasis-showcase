# Project field reference

Each `project.toml` is the canonical public record for one project.

## Top-level quick-update fields

| Field | Purpose |
|---|---|
| `slug` | Permanent URL name; must match the folder |
| `category` | `concept-home`, `transformation`, or `property` |
| `published` | Controls whether the project is generated publicly |
| `featured` | Places the project in the homepage featured gallery |
| `status` | Machine-readable availability |
| `status_label` | Public badge text |
| `sort_order` | Lower numbers appear earlier |
| `updated` | Public revision date |

## Identity

Public title, subtitle, location, year, and summary.

## Pricing

Controls visible price text, currency, hosted checkout, inquiry actions, and button labels. `display_text` overrides the numeric amount.

## Facts

Square footage, bedrooms, bathrooms, garage, stories, and lot size.

## Media

Relative paths to card, cover, and social-sharing media.

## Tour

Controls whether the 3D walkthrough button appears. When enabled, the project’s `tour/` folder must contain a working viewer package.

## Floor plans

Each `[[floor_plans]]` block can contain an image, customer PDF, optional DXF download, label, and caption.

## Materials

Each `[[materials]]` block is a concise public-facing finish or scope highlight—not necessarily a construction bill of materials.

## Purchase options and deliverables

Use these arrays for design-license tiers, drawing packages, customization services, or other clearly defined products.

## Category-specific sections

- `[concept]` — product and licensing details
- `[transformation]` — rehab stage and optionally public financials
- `[property]` — physical listing data, agent details, and customer actions
