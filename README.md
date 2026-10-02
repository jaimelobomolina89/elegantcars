# elegantcars

A small static web portal for high-end cars. All content comes from a single YAML file, so updating the stock means editing one file.

## Pages

| Page | Contents | Navigation |
| --- | --- | --- |
| `index.html` | Homepage: hero image (or video) and a button to the filters | Filters |
| `filters.html` | Pick a brand or a car type | Home, Stock |
| `stock.html` | Cars matching the chosen filter; all cars when no filter is given | Home, Filters |

The stock page reads its filters from the URL, for example `stock.html?brand=ferrari`, `stock.html?type=suv` or both combined: `stock.html?brand=porsche&type=coupe`.

## Running locally

The pages load `data/site.yaml` in the browser, which browsers only allow over HTTP. Opening `index.html` by double-clicking it won't work. From this folder, run:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000> and press Ctrl+C in the terminal to stop the server. Any static web host (Apache, Nginx, GitHub Pages, Netlify and so on) works the same way, with no build step.

## Updating content

Everything is in **`data/site.yaml`**: homepage text and media, the brand list, the car type list and the cars. Save the file and reload the page.

- **Add a car:** add an entry under `cars:` and save its photo as `images/cars/<id>.jpg`. It appears on the stock page and is counted on the filters page automatically.
- **Add a brand or car type:** add it to `brands:` or `types:`. It appears on the filters page automatically.
- **Remove a car:** delete its entry. Its photo can stay in `images/` or be deleted.

## Images

All images live in `images/`. The current files are placeholder illustrations. To use real photos, replace each file and keep its name:

```
images/hero.jpg               homepage background (wide, e.g. 1920×1080)
images/cars/<car id>.jpg      one per car (16:10, e.g. 1200×750)
```

A car's image defaults to `images/cars/<id>.jpg`. To use another file name or format, set `image:` on that car in the YAML. If a car's image is missing, the site shows a drawn illustration of its car type in the car's `color` instead of a broken image.

For a homepage video, put an `.mp4` file in `images/` and set `home.video` in the YAML, for example `video: images/hero.mp4`. The hero image is then used as the poster while the video loads, and visitors get a pause button.

## Structure

```
index.html  filters.html  stock.html
data/site.yaml          all content
images/                 hero and car photos
css/styles.css          single stylesheet (light and dark mode)
js/common.js            loads the YAML, shared helpers and fallback illustrations
js/home.js              homepage
js/filters.js           filters page
js/stock.js             stock page
js/vendor/js-yaml/      YAML parser (js-yaml 5.4.2, MIT licence)
```
