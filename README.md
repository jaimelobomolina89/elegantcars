# elegantcars

A small static web portal for high-end cars. All content comes from a single YAML file, so updating the stock means editing one file.

## Pages

| Page | Contents | Navigation |
| --- | --- | --- |
| `index.html` | Homepage: hero image (or video) and a "Find your car" button | none |
| `filters.html` | Pick a brand (with logo) or a car type | Home, Stock, Contact |
| `stock.html` | Cars matching the chosen filter; all cars when no filter is given | Home, Filters, Contact |
| `car.html?id=<car id>` | Detail page for one car, with a photo carousel | Home, Filters, Stock, Contact |
| `contact.html` | Phone number and email | Home, Filters, Stock |
| `credits.html` | Author and licence of every photo (linked from every footer) | Home, Filters, Stock, Contact |

The stock page reads its filters from the URL, for example `stock.html?brand=ferrari`, `stock.html?type=suv` or both combined: `stock.html?brand=porsche&type=coupe`. Clicking a car opens its detail page, and "Back to stock" returns to the same filtered list.

## Running locally

The pages load `data/site.yaml` in the browser, which browsers only allow over HTTP. Opening `index.html` by double-clicking it won't work. From this folder, run:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000> and press Ctrl+C in the terminal to stop the server. Any static web host (Apache, Nginx, GitHub Pages, Netlify and so on) works the same way, with no build step.

## Languages

The site is in **Spanish (default)**, **English** and **French**. Visitors switch with the globe button in the header, which opens a list of all languages. The choice is added to the address (`?lang=en`) so links can be shared, and the browser remembers it. New visitors see Spanish.

```
data/site.yaml          content in Spanish (the default language)
lang/es/ui.yaml         interface text in Spanish: menus, headings, buttons, labels (complete)
lang/en/ui.yaml         English interface text
lang/en/content.yaml    English translations of the content in site.yaml
lang/fr/ui.yaml         French interface text
lang/fr/content.yaml    French translations of the content in site.yaml
```

**Fallback:** if a key is translated it's shown; otherwise the Spanish text is used. That works one key at a time, so a new car added to `site.yaml` appears in every language straight away, in Spanish until its `tagline`, `description` and `engine` are added under `cars:` → `<car id>` in `lang/en/content.yaml` and `lang/fr/content.yaml`.

**Adding a language:** add it under `languages:` in `site.yaml` (code, name and locale such as `de-DE`), then create `lang/<code>/ui.yaml` and `lang/<code>/content.yaml` with whatever you have translated.

Numbers and prices follow each language's format (e.g. `3,4 s` and `230.000 €` in Spanish). Power is shown as CV, PS or ch.

## Updating content

Everything is in **`data/site.yaml`**: homepage text and media, contact details, the brand list, the car type list and the cars. Text there is in Spanish; translations live in `lang/` (see Languages). Save the file and reload the page.

- **Add a car:** add an entry under `cars:` and create `images/cars/<id>/` with photos named `1.jpg`, `2.jpg` and so on. The car appears on the stock page and is counted on the filters page automatically.
- **Add a brand or car type:** add it to `brands:` or `types:`. It appears on the filters page automatically.
- **Change contact details:** edit `contact:`. The phone number and email currently there are placeholders.

**Automatic check:** every push runs a check on the YAML files (GitHub → Actions tab). If a file has an error, such as broken indentation, a field left half-deleted, or a `brand`/`type` that doesn't match a slug, the site is **not** published and the live site keeps the last good version. Open the failed run to see the file, line and what to fix. Warnings, such as leftover translations or credits for deleted images, don't block publishing. To run the same check locally: `node .github/scripts/validate-yaml.js`.

## Images

All images live in `images/`. The car photos, hero, brand backgrounds and type images are real, freely licensed photos from Wikimedia Commons (see **Image credits** below), except `images/types/suv.jpeg`, which is your own upload. To use your own photos, replace each file and keep its name:

```
images/logo.png                    site logo on light backgrounds (.png, .jpg, .jpeg or .svg)
images/logo-on-dark.png            site logo on dark backgrounds: homepage hero and dark mode
images/hero.jpg                    homepage background (wide, e.g. 1920×1080)
images/brands/<brand slug>.png     brand logo on the filters page (.png, .jpg, .jpeg or .svg)
images/types/<type slug>.png       car type image on the filters page (.png, .jpg, .jpeg or .svg)
images/filters/<brand slug>.jpg    faded background of the stock page when filtered by that brand (.png, .jpg, .jpeg or .svg)
images/filters/filters-page.jpg    faded background of the filters page (.png, .jpg, .jpeg or .svg)
images/cars/<car id>/1.jpg         main photo: stock card and first slide
images/cars/<car id>/2.jpg, 3.jpg… more carousel slides (16:9 or 16:10, e.g. 1600×900)
```

- **Site logo:** `images/logo.*` is used on light backgrounds and `images/logo-on-dark.*` on the homepage hero and in dark mode. Any of the four formats works. If only one exists it's used everywhere, and if neither exists the text logo is shown. The display height is set by `.logo-image` in `css/styles.css` (32px, 26px on phones).
- **Car photos:** the detail page shows `1.jpg`, `2.jpg`, `3.jpg` and so on in order, stopping at the first missing number, so adding `4.jpg` adds a slide with no YAML change. To use other file names or a custom order, list them under `images:` on that car in the YAML. If a car has no photos, a drawn illustration of its car type in the car's `color` is shown instead.
- **Brand logos:** the current files are the brands' official wordmarks (and the BMW roundel) from Wikimedia Commons. See `images/brands/CREDITS.md` for sources and trademark notes. The site looks for `<slug>.png`, then `.jpg`, `.jpeg` and `.svg`, so any of those formats works under the brand's slug. To use a different file name, set `logo:` on the brand in the YAML. If a logo is missing, the brand name is shown on its own.
- **Car type images:** same rules as logos, in `images/types/` (for example `images/types/suv.png`). A `.png` wins over a `.jpg` with the same name, so delete the old file when you change format. To use a different file name, set `image:` on the type in the YAML. If an image is missing, a drawn illustration of the type is shown.
- **Brand backgrounds:** when the stock is filtered by a brand (`stock.html?brand=ferrari`), `images/filters/<brand slug>` is shown faded behind the page. Any of the four formats works. To use another file name, set `background:` on the brand in the YAML. If there's no file, no background is shown. To make it stronger or subtler, change `--backdrop-opacity` in `css/styles.css`. Same idea on the filters page with `images/filters/filters-page.*`, or set `filters_background:` under `site:` in the YAML.
- **Homepage video:** put an `.mp4` file in `images/` and set `home.video` in the YAML, for example `video: images/hero.mp4`. The hero image is used as the poster while the video loads, and visitors get a pause button.

## Image credits

Most photos carry Creative Commons licences (CC BY or CC BY-SA), which require crediting the photographer. `images/credits.yaml` lists the author, licence and source of every image. The site uses it to show a credit line under each carousel photo and to build `credits.html`, which is linked from every footer.

- **Replacing a photo with your own:** delete or update its entry in `images/credits.yaml`, so the new photo isn't credited to someone else.
- **Adding a freely licensed photo:** add an entry with at least `author`, plus `license`, `license_url` and `source` when you have them.
- **CC BY-SA photos:** if you edit one (crop it, recolour it and so on), the edited file must also be shared under CC BY-SA.

## Structure

```
index.html  filters.html  stock.html  car.html  contact.html  credits.html
data/site.yaml          all content
images/                 hero, brand logos, car type images and car photos
css/styles.css          single stylesheet (light and dark mode)
js/common.js            loads the YAML, photo lookup, shared helpers, fallback illustrations
js/home.js  js/filters.js  js/stock.js  js/car.js  js/contact.js   one per page
lang/<code>/            translations (see Languages)
js/vendor/js-yaml/      YAML parser (js-yaml 5.4.2, MIT licence)
```

## DNS

DNS is at https://server.moyseafood.com:3333/evo/login
