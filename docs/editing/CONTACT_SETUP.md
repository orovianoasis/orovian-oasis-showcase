# Contact popup and form setup

The shared header Contact control opens a quick-contact popup with Email and Call / Text choices. The footer Contact Us link opens a larger contact form. Both popups use CSS `:target`, so they still open if JavaScript is disabled.

## Add the public contact details

Edit `content/site.toml`:

```toml
[contact]
phone_display = "(312) 555-1234"
phone_href = "tel:+13125551234"
text_href = "sms:+13125551234"
email = "hello@example.com"
form_endpoint = ""
inquiry_url = "https://orovianoasis.com"
```

- `phone_display` is the readable number shown to visitors.
- `phone_href` launches a phone call.
- `text_href` launches a text message.
- `email` powers the Email button and mail-app form fallback.
- `form_endpoint` is optional. Add an HTTPS endpoint from your own backend or form service for direct background submission.
- `inquiry_url` continues to power project inquiry links and does not replace the homepage Property Intake links.

## Form behavior

When `form_endpoint` is blank, submitting the form prepares an email in the visitor's email application. When a valid endpoint is provided, `website/js/contact.js` posts the form directly and shows an inline success or failure message.

Never place private credentials, API secrets, or server tokens in `site.toml`; GitHub Pages is public.
