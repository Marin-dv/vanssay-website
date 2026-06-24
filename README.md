# vanssay-website

The Vanssay marketing site — a store hub listing the Framer plugins by Vanssay,
plus each plugin's presentation page and client space.

## Pages

| File | Role | Target subdomain |
|---|---|---|
| `index.html` | **Store hub** — lists every Vanssay plugin | `vanssay.net` |
| `reviews.html` | Reviews plugin presentation (the old `index.html`) | `reviews.vanssay.net` |
| `account.html` | Reviews client space (talks to `api.vanssay.net`) | `reviews.vanssay.net/account` |
| `geoblock.html` | Bouncer plugin presentation | `geoblock.vanssay.net` |
| `geoblock-account.html` | Bouncer client space (talks to `api.vanssay.net/geoblock`) | `geoblock.vanssay.net/account` |
| `privacy.html` · `terms.html` · `demo.html` · `admin.html` | shared | — |

All cross-page links are **relative**, so the whole site works as-is on
`vanssay.net` today. When you split it into subdomains, deploy each subdomain as
its own GitHub Pages site:

- **reviews.vanssay.net** → `reviews.html` (renamed `index.html`) + `account.html` + privacy/terms/demo
- **geoblock.vanssay.net** → `geoblock.html` (renamed `index.html`) + `geoblock-account.html` (renamed `account.html`)

Each needs a DNS `CNAME` to GitHub Pages and a `CNAME` file with the subdomain.

## Backends

Both plugins share one API host on the VPS:
- Reviews → `https://api.vanssay.net`
- Bouncer → `https://api.vanssay.net/geoblock` (nginx routes the `/geoblock` prefix)

## Branding

Logo glyph in `/branding` (the "V"). Vanssay brand = blue→purple
(`#0e7afe`→`#7c5cff`); the **Bouncer** product uses a green variant
(`#16a34a` / `#22c55e`).
