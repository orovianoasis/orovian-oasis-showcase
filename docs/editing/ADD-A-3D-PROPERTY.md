# Add a 3D Property Manually

1. Duplicate `content/projects/luxury-custom-home/` and rename the copied folder with a unique lowercase hyphenated slug.
2. Replace `tour/viewer.html` and `tour/house.glb`.
3. Replace the DXF files and their SVG previews in `floor-plans/`.
4. Update `project.toml`; its `slug` must exactly match the folder name.
5. Keep `tour/collision.json` and `tour/manifest.json` valid JSON. If the new walkthrough stores collision data inside its HTML, extract that data into `collision.json`; otherwise use the collision file produced with that walkthrough.
6. Set `published = true`. Set `featured = true` only for projects that should appear in the homepage feature area.
7. Commit the complete project folder to GitHub.

Do not upload a ZIP as the project folder. GitHub Pages needs the extracted files.
