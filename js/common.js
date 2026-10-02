// Helpers shared by every page: loading data/site.yaml, illustrations, formatting.
(function () {
  var DATA_URL = "data/site.yaml";
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

  var priceFormat =new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  });

  function formatPrice(value) {
    return "From " + priceFormat.format(value);
  }

  function plural(count, word) {
    return count + " " + word + (count === 1 ? "" : "s");
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
    box.textContent =
      window.location.protocol === "file:"
        ? "The site content can't load when the page is opened as a file. Serve the folder with a web server (see README) and reload."
        : "Sorry, the site content couldn't be loaded. Please reload the page.";
    box.hidden = false;
  }

  // Loads the YAML, fills shared parts of the page, then hands the data to the
  // page-specific callback.
  function boot(render) {
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status + " loading " + DATA_URL);
        return response.text();
      })
      .then(function (text) {
        var data = prepare(window.jsyaml.load(text));
        var footer = document.getElementById("footer-note");
        if (footer && data.site.footer) footer.textContent = data.site.footer;
        render(data);
      })
      .catch(showError);
  }

  window.Elegant = {
    boot: boot,
    silhouette: silhouette,
    carMedia: carMedia,
    findPhotos: findPhotos,
    imageFromCandidates: imageFromCandidates,
    carUrl: carUrl,
    formatPrice: formatPrice,
    plural: plural
  };
})();
