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

The stock page reads its filters from the URL, for example `stock.html?brand=ferrari`, `stock.html?type=suv` or both combined: `stock.html?brand=porsche&type=coupe`. Clicking a car opens its detail page, and "Back to stock" returns to the same filtered list.

## Running locally

The pages load `data/site.yaml` in the browser, which browsers only allow over HTTP. Opening `index.html` by double-clicking it won't work. From this folder, run:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000> and press Ctrl+C in the terminal to stop the server. Any static web host (Apache, Nginx, GitHub Pages, Netlify and so on) works the same way, with no build step.

## Languages

The site is in **Spanish (default)**, **English** and **French**. Visitors switch with the ES / EN / FR links in the header. The choice is added to the address (`?lang=en`) so links can be shared, and the browser remembers it. New visitors see Spanish.

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

## Images

All images live in `images/`. The current files are placeholder illustrations. To use real ones, replace each file and keep its name:

```
images/hero.jpg                    homepage background (wide, e.g. 1920×1080)
images/brands/<brand slug>.png     brand logo on the filters page (.png, .jpg, .jpeg or .svg)
images/types/<type slug>.png       car type image on the filters page (.png, .jpg, .jpeg or .svg)
images/filters/<brand slug>.jpg    faded background of the stock page when filtered by that brand (.png, .jpg, .jpeg or .svg)
images/cars/<car id>/1.jpg         main photo: stock card and first slide
images/cars/<car id>/2.jpg, 3.jpg… more carousel slides (16:9 or 16:10, e.g. 1600×900)
```

- **Car photos:** the detail page shows `1.jpg`, `2.jpg`, `3.jpg` and so on in order, stopping at the first missing number, so adding `4.jpg` adds a slide with no YAML change. To use other file names or a custom order, list them under `images:` on that car in the YAML. If a car has no photos, a drawn illustration of its car type in the car's `color` is shown instead.
- **Brand logos:** the current files are the brands' official wordmarks (and the BMW roundel) from Wikimedia Commons. See `images/brands/CREDITS.md` for sources and trademark notes. The site looks for `<slug>.png`, then `.jpg`, `.jpeg` and `.svg`, so any of those formats works under the brand's slug. To use a different file name, set `logo:` on the brand in the YAML. If a logo is missing, the brand name is shown on its own.
- **Car type images:** same rules as logos, in `images/types/` (for example `images/types/suv.png`). To use a different file name, set `image:` on the type in the YAML. If an image is missing, a drawn illustration of the type is shown. The current files are placeholders.
- **Brand backgrounds:** when the stock is filtered by a brand (`stock.html?brand=ferrari`), `images/filters/<brand slug>` is shown faded behind the page. Any of the four formats works. To use another file name, set `background:` on the brand in the YAML. If there's no file, no background is shown. To make it stronger or subtler, change `--backdrop-opacity` in `css/styles.css`. The current files are placeholders.
- **Homepage video:** put an `.mp4` file in `images/` and set `home.video` in the YAML, for example `video: images/hero.mp4`. The hero image is used as the poster while the video loads, and visitors get a pause button.

## Structure

```
index.html  filters.html  stock.html  car.html  contact.html
data/site.yaml          all content
images/                 hero, brand logos, car type images and car photos
css/styles.css          single stylesheet (light and dark mode)
js/common.js            loads the YAML, photo lookup, shared helpers, fallback illustrations
js/home.js  js/filters.js  js/stock.js  js/car.js  js/contact.js   one per page
lang/<code>/            translations (see Languages)
js/vendor/js-yaml/      YAML parser (js-yaml 5.4.2, MIT licence)
```
