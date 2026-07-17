# Custom domain setup

Desired address:

```text
showcase.orovianoasis.com
```

## GitHub

1. Open the `orovian-showcase` repository.
2. Select **Settings → Pages**.
3. Set the publishing source to **GitHub Actions**.
4. Enter `showcase.orovianoasis.com` under **Custom domain**.
5. Save.
6. Enable **Enforce HTTPS** when GitHub makes the option available.

## DNS provider

Create this DNS record:

| Type | Name | Value |
|---|---|---|
| CNAME | `showcase` | `orovianoasis.github.io` |

The value points to the GitHub Pages user domain, not the repository path.

## Safety

Verify the domain in GitHub before or while connecting it, and do not use a wildcard DNS record for this purpose.
