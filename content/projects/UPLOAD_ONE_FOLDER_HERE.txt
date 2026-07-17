UPLOAD ONE EXTRACTED PROPERTY FOLDER INTO content/projects/

PREFERRED CHIEF ARCHITECT FOLDER
- property-details.json     ← one-file control panel
- cover-front.webp
- cover-back.webp
- house-model.dae           ← Collada export from Chief Architect
- textures/                 ← every texture Chief exports with the DAE
- DXF floor plans

GitHub Actions automatically converts the DAE to GLB and connects the permanent Orovian Oasis walkthrough controls. No Chief cloud account, ChatGPT conversion, or handwritten walkthrough HTML is required.

EXISTING CUSTOM TOURS ALSO WORK
A folder that already contains both a walkthrough HTML file and GLB keeps using those files unchanged.

The original long filenames and underscores are allowed.
project.toml is optional.
Do not upload the ZIP itself.

PROPERTY DETAILS — RECOMMENDED
Copy this template:
content/project-templates/property-details-template.json

Place the copy directly in the property folder and rename it:
property-details.json

Edit that one JSON file whenever public project information changes.

PRICING
- price = null: Contact for pricing + Request Details contact popup
- price = a number: public numeric price
- price + checkout_url: Buy Now replaces Request Details
- price without checkout_url: numeric price + Request Details

PROJECT COVER SLIDESHOWS
Every image whose filename begins with cover becomes part of the carousel:
- cover-front.webp
- cover-back.webp
- cover-01.webp
- cover-pool.webp

With no cover image, the generated placeholder remains.
