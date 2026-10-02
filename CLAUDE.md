# elegantcars

Static web portal for high-end cars. Plain HTML/CSS/JS, no build step, no framework, no npm dependencies. All content comes from YAML loaded in the browser. See README.md for the full user-facing docs.

## Run and check

- Serve with `python3 -m http.server 8000` from the repo root. Pages fetch YAML, so `file://` doesn't work.
- After changes, check all three languages (`?lang=es`, `?lang=en`, `?lang=fr`) and phone width (375px, no horizontal scroll).
- Browsers cache JS, CSS and images aggressively. Hard refresh (Cmd+Shift+R) before deciding something is broken.
- `node --check js/<file>.js` for a quick syntax check.
- `node .github/scripts/validate-yaml.js` validates all YAML with the vendored parser (not run in CI yet). If you add a car field, add it to `CAR_FIELDS` there.

## Where things live

- `data/site.yaml`: the single source of stock and site content, written in **Spanish (the default language)**. Holds languages, home, contact, brands, types and cars.
- `lang/<code>/ui.yaml`: interface text (menus, headings, buttons, labels). `lang/es/ui.yaml` must contain every key; other languages override only what they translate.
- `lang/<code>/content.yaml`: translations of `site.yaml` text, with cars keyed by `id` and brands/types by `slug`. Anything missing falls back to Spanish.
- HTML pages hold **no fixed text**. Elements use `data-i18n="key"`, `data-i18n-aria-label="key"` and `<body data-page-title="key">`, filled in by `js/common.js`.
- `js/common.js`: YAML loading, i18n (`Elegant.t`), formatting, image lookup, logo, language switcher, shared helpers. There is one script per page: `home.js`, `filters.js`, `stock.js`, `car.js`, `contact.js`, `credits.js`.
- `js/vendor/js-yaml/`: vendored YAML parser. Don't swap it for a CDN.

## Conventions to keep

- **Everything editable through files and naming conventions, not code.** The owner wants to update stock and images by editing YAML and dropping in files.
- **Images:**
  - Logos, type images and backgrounds are tried as `.png`, `.jpg`, `.jpeg`, `.svg`, in that order, via `imageCandidates`.
  - Car photos are `images/cars/<id>/1.jpg, 2.jpg, …`, probed in order with no upper limit. Photo 1 is the stock card.
  - The site logo is `images/logo.*` (light backgrounds) and `images/logo-on-dark.*`.
  - Brand backgrounds are `images/filters/<slug>.*`, and the filters page background is `images/filters/filters-page.*`.
  - Every image needs a graceful fallback (drawn silhouette, text, or nothing). Never show a broken image.
- **Image credits:** most photos are CC BY / CC BY-SA from Wikimedia Commons and must stay credited in `images/credits.yaml`. When an image is replaced, update or remove its entry. Only use freely licensed images (no NC/ND), and never redraw brand trademarks; see `images/brands/CREDITS.md`.
- **New interface text:** add the key to `lang/es/ui.yaml` and to `en` and `fr`. Plurals use `{one, other}` and `{placeholders}`.
- **New car:** add the entry to `site.yaml` (Spanish text), its photos folder, and its tagline/description/engine in `lang/en/content.yaml` and `lang/fr/content.yaml`.
- **Internal links:** `localizeLinks` adds `?lang=` automatically. Links created in page scripts during `render` are covered.
- **Accessibility:**
  - Keep WCAG AA contrast, visible focus, keyboard support (carousel, language menu), `alt` text, and respect for `prefers-reduced-motion`.
  - Decorative images get `alt=""`.
- **Style:** match the existing ES5-style JS (`var`, `function`), comment density and CSS tokens on `:root` (with dark-mode overrides).
- **Translations:** the Spanish and French were written by Claude. Flag new translations for native-speaker review.

## Notes

- Commit messages in this repo are usually short and in Spanish.
- Large image commits over HTTPS needed `git config http.postBuffer 157286400` (already set locally).
