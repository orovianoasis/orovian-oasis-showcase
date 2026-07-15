# Mobile design editing guide

The showcase now uses one synchronized content system with isolated presentation layers.

```text
website/css/site.css      shared + desktop visual rules
website/css/mobile.css    phone/tablet-only visual rules
website/js/site.js        shared essential behavior
website/js/contact.js     shared contact popup/form behavior
website/js/dynamics.js    shared optional motion
website/js/mobile.js      phone/tablet-only optional behavior
```

## Change mobile without changing desktop

Put mobile visual changes in `website/css/mobile.css`. GitHub loads that file only when the viewport is 880 pixels wide or narrower. Desktop never applies those rules.

Examples of mobile-only changes:

```css
@media(max-width:560px){
  .hero h1{font-size:3.2rem}
  .project-card{border-radius:22px}
  .footer-grid{text-align:center}
}
```

Put mobile-only JavaScript in `website/js/mobile.js`. Its code checks the same 880-pixel media query before activating.

## Shared changes

Use `website/css/site.css` when a visual decision should affect desktop and mobile, such as brand colors or a shared button component. Mobile rules can still override that shared value inside `mobile.css`.

Use the HTML files in `website/` for structural changes that should remain synchronized across screen sizes. Avoid maintaining a separate mobile HTML copy; duplicate pages drift, prices disagree, and one eventually becomes the evil twin.

## Content remains synchronized

Prices, status, metadata, project descriptions, floor plans, checkout links, and tour settings remain in `content/`. Changing them updates desktop and mobile together.

## Testing

Run `tools/Preview_Local.bat`, open the local address in Chrome or Edge, press `F12`, and toggle the device toolbar. Test at least:

- 390 × 844 phone portrait
- 844 × 390 phone landscape
- 768 × 1024 tablet portrait
- Desktop wider than 1100 pixels

Never edit `dist/`; it is generated output.


## Version 2.3 mobile controls

The top-right Contact control remains a pill on desktop and becomes the same circular control on mobile. Mobile centering for the featured project, property-intake ribbon, footer brand, social icons, Contact Us link, and copyright line lives only in `website/css/mobile.css`.

The stronger mobile blueprint bounce is also defined in `mobile.css`. Shared tracer lights and desktop motion remain in `site.css`, while pointer parallax remains optional in `js/dynamics.js`.
