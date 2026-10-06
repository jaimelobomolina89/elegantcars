// Helpers shared by every page: loading data/site.yaml, illustrations, formatting.
(function () {
  var DATA_URL = "data/site.yaml";
  var CREDITS_URL = "images/credits.yaml";
  var SVG_NS = "http://www.w3.org/2000/svg";

  // Side-profile silhouettes, keyed by car type slug. viewBox is 0 0 400 160.
  var SILHOUETTES = {
    coupe: {
      body: "M30 120 L30 105 Q35 92 70 88 L140 82 Q175 55 230 52 Q285 52 320 80 L360 88 Q375 92 375 108 L375 120 Z",
      glass: "M150 82 Q180 60 228 58 Q270 58 300 80 Z",
      wheels: [95, 305],
      radius: 22
    },
    berlina: {
      body: "M25 120 L25 102 Q30 90 65 86 L120 82 L160 52 Q175 46 200 46 L265 46 Q285 47 300 60 L325 82 L365 88 Q378 92 378 106 L378 120 Z",
      glass: "M132 82 L166 56 Q178 51 200 51 L262 51 Q279 52 291 63 L310 82 Z",
      wheels: [90, 310],
      radius: 23
    },
    suv: {
      body: "M25 122 L25 92 Q28 78 55 74 L105 70 L135 36 Q142 30 160 30 L300 30 Q318 30 330 42 L355 70 Q375 74 377 90 L377 122 Z",
      glass: "M118 70 L142 40 Q148 36 162 36 L298 36 Q312 36 322 46 L343 70 Z",
      wheels: [95, 305],
      radius: 26
    },
    cabrio: {
      body: "M30 120 L30 104 Q35 92 70 88 L150 84 L176 64 L183 66 L170 84 L320 82 L360 88 Q375 92 375 108 L375 120 Z",
      glass: "M178 68 L182 69 L171 83 L166 83 Z",
      wheels: [95, 305],
      radius: 22
    }
  };

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  // Decorative illustration: hidden from assistive tech because the car's or
  // type's name is always shown next to it.
  function silhouette(typeSlug, color) {
    var shape = SILHOUETTES[typeSlug] || SILHOUETTES.coupe;
    var svg = svgEl("svg", {
      viewBox: "0 0 400 160",
      "aria-hidden": "true",
      focusable: "false",
      class: "silhouette"
    });
    svg.appendChild(svgEl("ellipse", { cx: 200, cy: 142, rx: 185, ry: 8, class: "silhouette-shadow" }));
    svg.appendChild(svgEl("path", { d: shape.body, fill: color || "currentColor" }));
    svg.appendChild(svgEl("path", { d: shape.glass, class: "silhouette-glass" }));
    shape.wheels.forEach(function (cx) {
      svg.appendChild(svgEl("circle", { cx: cx, cy: 122, r: shape.radius, class: "silhouette-tyre" }));
      svg.appendChild(svgEl("circle", { cx: cx, cy: 122, r: shape.radius * 0.5, class: "silhouette-rim" }));
    });
    return svg;
  }

  // Faded, cropped copy of a photo that fills the frame behind the uncropped
  // photo. Decorative, so hidden from screen readers; removed if it fails to load.
  function photoBackdrop(src) {
    var img = document.createElement("img");
    img.className = "photo-backdrop";
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.draggable = false;
    img.addEventListener("error", function () {
      img.remove();
    });
    if (src) img.src = src;
    return img;
  }

  // A container holding the car's photo. If the file is missing it falls back
  // to the drawn silhouette, so a new car never shows a broken image.
  function carMedia(car, className) {
    var media = document.createElement("div");
    media.className = className + " " + className + "-photo";
    var img = document.createElement("img");
    img.src = car.image;
    img.alt = car.image_alt || car.fullName;
    img.addEventListener("error", function () {
      console.warn("Image not found for '" + car.id + "': " + car.image);
      media.className = className;
      media.replaceChildren(silhouette(car.type, car.color));
    });
    media.appendChild(img);
    return media;
  }

  var IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "svg"];

  // Files to try, in order: the explicit path from site.yaml if set, otherwise
  // <base> with each supported extension.
  function imageCandidates(explicit, base) {
    if (explicit) return [explicit];
    return IMAGE_EXTENSIONS.map(function (ext) {
      return base + "." + ext;
    });
  }

  // An <img> that tries each candidate in turn and calls onMissing if none of
  // them exists.
  function imageFromCandidates(candidates, onMissing) {
    var img = document.createElement("img");
    var queue = candidates.slice();
    img.addEventListener("error", function () {
      if (queue.length) {
        img.src = queue.shift();
        return;
      }
      console.warn("No image found, tried: " + candidates.join(", "));
      onMissing(img);
    });
    img.src = queue.shift();
    return img;
  }

  function photoPath(car, n) {
    return "images/cars/" + car.id + "/" + n + ".jpg";
  }

  function loads(src) {
    return new Promise(function (resolve) {
      var probe = new Image();
      probe.onload = function () {
        resolve(true);
      };
      probe.onerror = function () {
        resolve(false);
      };
      probe.src = src;
    });
  }

  // Resolves to the list of a car's photos that actually exist: the explicit
  // `images` list if given, otherwise 1.jpg, 2.jpg, … up to the first gap.
  // A static site can't list a folder, so numbered files are probed in order,
  // with no upper limit.
  function findPhotos(car) {
    if (car.images.length) {
      return Promise.all(car.images.map(loads)).then(function (ok) {
        return car.images.filter(function (src, i) {
          return ok[i];
        });
      });
    }
    var found = [];
    function next(n) {
      var src = photoPath(car, n);
      return loads(src).then(function (ok) {
        if (!ok) return found;
        found.push(src);
        return next(n + 1);
      });
    }
    return next(1);
  }

  function carUrl(car) {
    return "car.html?id=" + encodeURIComponent(car.id);
  }

  // ---- Languages ----------------------------------------------------------
  // The default language's content lives in data/site.yaml and its interface
  // text in lang/<default>/ui.yaml. Other languages override keys from
  // lang/<code>/content.yaml and lang/<code>/ui.yaml; anything they don't
  // translate falls back to the default.

  var LANG_STORAGE_KEY = "elegantcars.lang";

  var i18n = {
    lang: "es",
    defaultLang: "es",
    locale: "es-ES",
    languages: [],
    ui: {},
    uiDefault: {}
  };

  function lookup(obj, key) {
    return key.split(".").reduce(function (node, part) {
      return node && typeof node === "object" ? node[part] : undefined;
    }, obj);
  }

  // Interface text for `key`, with {placeholders} filled from `vars`. Plural
  // entries ({one, other}) are chosen by vars.plural, or vars.count.
  function t(key, vars) {
    vars = vars || {};
    var value = lookup(i18n.ui, key);
    if (value === undefined) value = lookup(i18n.uiDefault, key);
    if (value === undefined) {
      console.warn("Missing interface text: " + key);
      return key;
    }
    if (value && typeof value === "object") {
      var n = vars.plural !== undefined ? vars.plural : vars.count;
      var form = new Intl.PluralRules(i18n.locale).select(Number(n) || 0);
      value = value[form] !== undefined ? value[form] : value.other;
    }
    return String(value).replace(/\{(\w+)\}/g, function (match, name) {
      return vars[name] !== undefined ? vars[name] : match;
    });
  }

  function readStoredLang() {
    try {
      return window.localStorage.getItem(LANG_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeLang(code) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch (e) {
      // Storage unavailable (private mode etc.): the ?lang= parameter still works.
    }
  }

  // ?lang=<code> wins (and is remembered), then the remembered choice, then
  // the default language.
  function resolveLang(config) {
    var codes = i18n.languages.map(function (l) {
      return l.code;
    });
    var fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl && codes.indexOf(fromUrl) !== -1) {
      storeLang(fromUrl);
      return fromUrl;
    }
    var stored = readStoredLang();
    if (stored && codes.indexOf(stored) !== -1) return stored;
    return config.default;
  }

  // Copies translated text onto the default-language content. Sections are
  // merged key by key; brands, types and cars are matched by slug / id.
  function applyTranslations(raw, tr) {
    ["site", "home", "contact"].forEach(function (section) {
      if (tr[section]) raw[section] = Object.assign(raw[section] || {}, tr[section]);
    });
    [
      ["brands", "slug"],
      ["types", "slug"],
      ["cars", "id"]
    ].forEach(function (pair) {
      var overrides = tr[pair[0]];
      if (!overrides) return;
      (raw[pair[0]] || []).forEach(function (item) {
        if (overrides[item[pair[1]]]) Object.assign(item, overrides[item[pair[1]]]);
      });
    });
    return raw;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(i18n.locale).format(value);
  }

  function formatPrice(value) {
    var amount = new Intl.NumberFormat(i18n.locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(value);
    return t("car.price_from", { price: amount });
  }

  // Internal links keep the current language in the URL (so a shared link
  // opens in the same language); in the default language the parameter is
  // dropped to keep URLs clean.
  function localizeLinks(root) {
    (root || document).querySelectorAll("a[href]:not([data-lang-link])").forEach(function (a) {
      var href = a.getAttribute("href");
      if (/^([a-z]+:|#)/i.test(href)) return;
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || !/\.html$/.test(url.pathname)) return;
      if (i18n.lang === i18n.defaultLang) url.searchParams.delete("lang");
      else url.searchParams.set("lang", i18n.lang);
      a.setAttribute("href", url.pathname.split("/").pop() + url.search + url.hash);
    });
  }

  var GLOBE_PATHS = [
    "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20Z",
    "M2 12h20",
    "M12 2c2.8 2.7 4.2 6.1 4.2 10s-1.4 7.3-4.2 10c-2.8-2.7-4.2-6.1-4.2-10S9.2 4.7 12 2Z"
  ];

  function globeIcon() {
    var svg = svgEl("svg", {
      viewBox: "0 0 24 24",
      width: 22,
      height: 22,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 1.6,
      "stroke-linecap": "round",
      "aria-hidden": "true",
      focusable: "false"
    });
    GLOBE_PATHS.forEach(function (d) {
      svg.appendChild(svgEl("path", { d: d }));
    });
    return svg;
  }

  // Globe button in the header that opens a list of every language (a
  // disclosure menu). Each entry reloads the current page in that language.
  // It closes with Escape, by clicking outside, or when focus leaves it.
  function renderLanguageSwitcher() {
    var box = document.getElementById("lang-switch");
    if (!box) return;
    box.setAttribute("aria-label", t("language.label"));

    var current = i18n.languages.find(function (l) {
      return l.code === i18n.lang;
    });
    var button = document.createElement("button");
    button.type = "button";
    button.className = "lang-toggle";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "lang-menu");
    var label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = t("language.label") + ": " + ((current && current.name) || i18n.lang);
    button.append(globeIcon(), label);

    var list = document.createElement("ul");
    list.id = "lang-menu";
    list.className = "lang-menu";
    list.hidden = true;
    i18n.languages.forEach(function (language) {
      var url = new URL(window.location.href);
      url.searchParams.set("lang", language.code);
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = url.pathname.split("/").pop() + url.search + url.hash;
      a.setAttribute("data-lang-link", "");
      a.setAttribute("hreflang", language.code);
      a.setAttribute("lang", language.code);
      a.textContent = language.name || language.code;
      if (language.code === i18n.lang) a.setAttribute("aria-current", "true");
      li.appendChild(a);
      list.appendChild(li);
    });

    function setOpen(open) {
      list.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    }

    button.addEventListener("click", function () {
      var open = list.hidden;
      setOpen(open);
      if (open) {
        var active = list.querySelector('[aria-current="true"]') || list.querySelector("a");
        if (active) active.focus();
      }
    });
    box.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !list.hidden) {
        setOpen(false);
        button.focus();
      }
    });
    box.addEventListener("focusout", function (event) {
      if (!box.contains(event.relatedTarget)) setOpen(false);
    });
    document.addEventListener("click", function (event) {
      if (!box.contains(event.target)) setOpen(false);
    });

    box.replaceChildren(button, list);
  }

  // Fills the static text of the page: elements with data-i18n="key" get the
  // text, data-i18n-aria-label="key" sets the aria-label, and the <body>'s
  // data-page-title="key" sets the document title.
  function translatePage() {
    document.documentElement.lang = i18n.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
    var titleKey = document.body.getAttribute("data-page-title");
    if (titleKey) setTitle(t(titleKey));
  }

  function setTitle(text) {
    document.title = text + " · elegantcars";
  }

  // Index brands and types by slug and give every car display names, so pages
  // never have to look them up themselves.
  function prepare(raw) {
    var data = {
      site: raw.site || {},
      home: raw.home || {},
      brands: raw.brands || [],
      types: raw.types || [],
      cars: raw.cars || [],
      brandBySlug: {},
      typeBySlug: {}
    };
    data.contact = raw.contact || {};
    data.brands.forEach(function (b) {
      b.logos = imageCandidates(b.logo, "images/brands/" + b.slug);
      b.backgrounds = imageCandidates(b.background, "images/filters/" + b.slug);
      data.brandBySlug[b.slug] = b;
    });
    data.types.forEach(function (t) {
      t.images = imageCandidates(t.image, "images/types/" + t.slug);
      data.typeBySlug[t.slug] = t;
    });
    data.cars.forEach(function (car) {
      var brand = data.brandBySlug[car.brand];
      var type = data.typeBySlug[car.type];
      if (!brand) console.warn("site.yaml: car '" + car.id + "' has unknown brand '" + car.brand + "'");
      if (!type) console.warn("site.yaml: car '" + car.id + "' has unknown type '" + car.type + "'");
      car.brandName = brand ? brand.name : car.brand;
      car.typeName = type ? type.name : car.type;
      car.fullName = car.brandName + " " + car.model;
      // Convention: a car's photos are images/cars/<id>/1.jpg, 2.jpg, … unless
      // an explicit `images` list is given. The first one is its main photo.
      car.images = Array.isArray(car.images) ? car.images.filter(Boolean) : [];
      car.image = car.images[0] || photoPath(car, 1);
    });
    return data;
  }

  function showError(err) {
    console.error(err);
    var box = document.getElementById("load-error");
    if (!box) return;
    var key = window.location.protocol === "file:" ? "errors.file_protocol" : "errors.load_failed";
    // If even the interface text failed to load, fall back to a fixed message.
    var hasText = lookup(i18n.uiDefault, key) !== undefined;
    box.textContent = hasText
      ? t(key)
      : "No se ha podido cargar el contenido. / The site content couldn't be loaded. Please serve the folder with a web server and reload.";
    box.hidden = false;
  }

  // Fetches and parses a YAML file. Optional files (translations) resolve to
  // an empty object when they don't exist.
  function loadYaml(url, optional) {
    return fetch(url, { cache: "no-cache" }).then(function (response) {
      if (!response.ok) {
        if (optional) return {};
        throw new Error("HTTP " + response.status + " loading " + url);
      }
      return response.text().then(function (text) {
        return window.jsyaml.load(text) || {};
      });
    });
  }

  // Loads site.yaml and the language files, translates the page, then hands
  // the data to the page-specific callback.
  function boot(render) {
    loadYaml(DATA_URL)
      .then(function (raw) {
        var config = raw.languages || { default: "es", available: [{ code: "es", locale: "es-ES" }] };
        i18n.languages = config.available || [];
        i18n.defaultLang = config.default;
        i18n.lang = resolveLang(config);
        var current = i18n.languages.find(function (l) {
          return l.code === i18n.lang;
        });
        i18n.locale = (current && current.locale) || i18n.lang;

        var isDefault = i18n.lang === i18n.defaultLang;
        return Promise.all([
          loadYaml("lang/" + i18n.defaultLang + "/ui.yaml"),
          isDefault ? {} : loadYaml("lang/" + i18n.lang + "/ui.yaml", true),
          isDefault ? {} : loadYaml("lang/" + i18n.lang + "/content.yaml", true),
          loadYaml(CREDITS_URL, true)
        ]).then(function (files) {
          i18n.uiDefault = files[0];
          i18n.ui = isDefault ? files[0] : files[1];
          var data = prepare(applyTranslations(raw, files[2]));
          data.credits = files[3];
          return data;
        });
      })
      .then(function (data) {
        translatePage();
        renderLanguageSwitcher();
        var footer = document.getElementById("footer-note");
        if (footer && data.site.footer) footer.textContent = data.site.footer;
        render(data);
        localizeLinks(document);
      })
      .catch(showError);
  }

  // A faded, decorative image fixed behind the whole page. Tries each
  // candidate file in turn; if none exists nothing is shown.
  function backdrop(candidates) {
    var box = document.createElement("div");
    box.className = "page-backdrop";
    box.setAttribute("aria-hidden", "true");
    var img = imageFromCandidates(candidates, function () {
      box.remove();
      document.body.classList.remove("has-backdrop");
    });
    img.alt = "";
    box.appendChild(img);
    document.body.prepend(box);
    // Lets the CSS give the text panels so it stays readable over the image.
    document.body.classList.add("has-backdrop");
  }

  // "Photo: Author · CC BY-SA 4.0" for an image listed in images/credits.yaml,
  // linking to the source and the licence. Returns null if it isn't listed.
  function creditLine(credits, src) {
    var entry = credits && credits[src];
    if (!entry || !entry.author) return null;
    var p = document.createElement("p");
    p.className = "photo-credit";
    var author = entry.source ? document.createElement("a") : document.createElement("span");
    if (entry.source) author.href = entry.source;
    author.textContent = entry.author;
    p.append(t("credits.photo_by") + " ", author);
    if (entry.license) {
      var license = entry.license_url ? document.createElement("a") : document.createElement("span");
      if (entry.license_url) license.href = entry.license_url;
      license.textContent = entry.license;
      p.append(" · ", license);
    }
    return p;
  }

  // Resolves to the first candidate file that exists, or null.
  function firstExisting(candidates) {
    var queue = candidates.slice();
    function next() {
      if (!queue.length) return Promise.resolve(null);
      var src = queue.shift();
      return loads(src).then(function (ok) {
        return ok ? src : next();
      });
    }
    return next();
  }

  // Site logo: images/logo.* for light backgrounds and images/logo-on-dark.*
  // for dark ones (the homepage hero, and dark mode on other pages). If neither
  // file exists, the text logo in the HTML is kept. The text is hidden until we
  // know, so the header doesn't flicker between the two.
  function setupLogo() {
    var link = document.querySelector(".logo");
    if (!link) return;
    var onDark = document.body.classList.contains("page-home");
    Promise.all([
      firstExisting(imageCandidates(null, "images/logo")),
      firstExisting(imageCandidates(null, "images/logo-on-dark"))
    ]).then(function (found) {
      var light = found[0];
      var dark = found[1];
      var main = onDark ? dark || light : light || dark;
      if (main) {
        var picture = document.createElement("picture");
        if (!onDark && light && dark) {
          var source = document.createElement("source");
          source.media = "(prefers-color-scheme: dark)";
          source.srcset = dark;
          picture.appendChild(source);
        }
        var img = document.createElement("img");
        img.src = main;
        img.alt = "elegantcars";
        img.className = "logo-image";
        picture.appendChild(img);
        link.replaceChildren(picture);
      }
      link.classList.remove("logo-pending");
    });
  }

  setupLogo();

  window.Elegant = {
    boot: boot,
    t: t,
    setTitle: setTitle,
    silhouette: silhouette,
    carMedia: carMedia,
    photoBackdrop: photoBackdrop,
    findPhotos: findPhotos,
    imageCandidates: imageCandidates,
    imageFromCandidates: imageFromCandidates,
    backdrop: backdrop,
    creditLine: creditLine,
    carUrl: carUrl,
    formatNumber: formatNumber,
    formatPrice: formatPrice
  };
})();
