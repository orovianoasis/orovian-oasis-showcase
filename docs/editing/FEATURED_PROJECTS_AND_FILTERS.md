# Featured projects and category filters

## Homepage count

Edit this value in `content/site.toml`:

```toml
homepage_featured_limit = 3
```

The homepage shows no more than that number. Projects with `featured = true` appear first; the build fills any remaining spaces automatically.

## Filters

The filter bar is generated automatically on:

- `/concept-homes/`
- `/transformations/`
- `/properties/`

No separate filter configuration is required. The build reads these project facts:

- `square_feet`
- `bedrooms`
- `full_bathrooms`
- `half_bathrooms`
- `garage`
- `stories`

For one-folder imports, those values are inferred from `README.txt`. A correctly configured `project.toml` can override them.

The optional browser behavior lives in `website/js/filters.js`. Removing that file does not hide any projects; it only disables interactive filtering.
