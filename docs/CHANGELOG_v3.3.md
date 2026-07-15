# Orovian Oasis Showcase 3.3

## Property-aware contact actions

- `Request Details` opens the built-in Contact Us modal instead of leaving the showcase.
- `Contact for pricing` is now a contact-modal action on project cards and project pages.
- Contact form submissions automatically include the related project title, category, canonical project URL, and source page.
- The top Contact control also inherits project context while a visitor is viewing a project or its supporting pages.

## Featured-project rule

- The homepage now displays up to three featured projects by default.
- Explicit `featured = true` projects appear first.
- Remaining slots are filled automatically from published projects.
- Change `homepage_featured_limit` in `content/site.toml` to adjust the limit.

## Category filters

- Concept Homes, Transformations, and Properties receive the same reusable filter system whenever that category has published projects.
- Filters include search, square footage, bedrooms, bathrooms, garage capacity, and stories.
- Filter controls use slightly varied accent colors.
- Filtering is progressive enhancement: all projects remain visible if JavaScript is unavailable.

## Visual details

- Specification pills now include emojis and category-specific accent colors.
- Additional project-page headings and actions include restrained emoji accents.
