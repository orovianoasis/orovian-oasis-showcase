# Project field reference

For one-folder projects, `property-details.json` is the preferred editable control file. `project.toml` remains the advanced manually organized format.

## Automatic walkthrough fields in `property-details.json`

The optional `walkthrough` object controls DAE-generated tours. Most values can stay at their defaults.

| Field | Purpose |
|---|---|
| `prefer_dae` | Use the DAE-generated tour even when an older HTML/GLB package is present |
| `model_scale` | Uniform scale applied to the converted model |
| `model_offset` | `[x, y, z]` model translation |
| `model_rotation_degrees` | `[x, y, z]` rotation correction |
| `entry_position` / `entry_target` | Optional reset-camera coordinates; `null` uses automatic placement |
| `exterior_position` / `exterior_target` | Optional exterior-camera coordinates |
| `roof_match` | Object/material name fragments controlled by ROOF |
| `slab_match` | Object/material name fragments controlled by SLABS |
| `collision_exclude` | Name fragments excluded from walking collision |
| `eye_height`, `player_radius`, `step_height`, `max_drop` | Walk-mode collision tuning |
| `walk_speed`, `run_speed`, `fly_speed` | Movement speeds |

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
