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
| `invoice.html` | Invoice viewer (HTML + print to PDF), opened from any client space | shared |
| `privacy.html` · `terms.html` · `demo.html` · `admin.html` | shared | — |

Every client space shows an **Invoices** card, built by `assets/invoices.js` from
the Accounts service (`GET /billing/invoices`). One invoice series covers all the
plugins, so `accounts.html` lists them all and each plugin page filters by its
own product. The documents are auth-scoped, which is why `invoice.html` fetches
one with the caller's token instead of linking straight to the API.

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
