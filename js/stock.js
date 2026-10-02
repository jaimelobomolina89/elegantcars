// Stock page: lists the cars matching ?brand=<slug> and/or ?type=<slug>.
// With no parameters every car is listed.
Elegant.boot(function (data) {
  var params = new URLSearchParams(window.location.search);
  var filters = {
    brand: (params.get("brand") || "").toLowerCase(),
    type: (params.get("type") || "").toLowerCase()
  };

  var matches = data.cars.filter(function (car) {
    return (!filters.brand || car.brand === filters.brand) && (!filters.type || car.type === filters.type);
  });

  // Prefer the display name from site.yaml; fall back to the raw slug so an
  // unknown filter is still visible to the user.
  var brandName = filters.brand && (data.brandBySlug[filters.brand] || { name: filters.brand }).name;
  var typeName = filters.type && (data.typeBySlug[filters.type] || { name: filters.type }).name;

  var title = [brandName, typeName].filter(Boolean).join(" · ") || "All cars";
  document.getElementById("stock-title").textContent = title;
  document.title = title + " · Stock · elegantcars";

  renderActiveFilters();

  document.getElementById("results-status").textContent =
    matches.length === data.cars.length
      ? "Showing all " + Elegant.plural(data.cars.length, "car")
      : "Showing " + matches.length + " of " + Elegant.plural(data.cars.length, "car");

  var grid = document.getElementById("car-grid");
  grid.append.apply(grid, matches.map(card));
  document.getElementById("empty-state").hidden = matches.length > 0;

  // A chip per active filter, each linking to the same listing without it.
  function renderActiveFilters() {
    var box = document.getElementById("active-filters");
    [
      ["brand", "Brand", brandName],
      ["type", "Car type", typeName]
    ].forEach(function (entry) {
      if (!filters[entry[0]]) return;
      var rest = new URLSearchParams(params);
      rest.delete(entry[0]);
      var query = rest.toString();

      var chip = document.createElement("a");
      chip.className = "chip";
      chip.href = "stock.html" + (query ? "?" + query : "");
      chip.setAttribute("aria-label", "Remove " + entry[1].toLowerCase() + " filter: " + entry[2]);
      chip.textContent = entry[1] + ": " + entry[2];
      var x = document.createElement("span");
      x.setAttribute("aria-hidden", "true");
      x.className = "chip-x";
      x.textContent = "×";
      chip.appendChild(x);
      box.appendChild(chip);
    });
    box.hidden = !box.children.length;
  }

  function card(car) {
    var article = document.createElement("article");
    article.className = "card";

    // Show the car's photo; if the file is missing, fall back to the drawn
    // silhouette so a new car never shows a broken image.
    var media = document.createElement("div");
    media.className = "card-media card-media-photo";
    var img = document.createElement("img");
    img.src = car.image;
    img.alt = car.image_alt || car.fullName;
    img.loading = "lazy";
    img.addEventListener("error", function () {
      console.warn("Image not found for '" + car.id + "': " + car.image);
      media.className = "card-media";
      media.replaceChildren(Elegant.silhouette(car.type, car.color));
    });
    media.appendChild(img);

    var body = document.createElement("div");
    body.className = "card-body";

    var meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = [car.brandName, car.typeName, car.year].filter(Boolean).join(" · ");

    var heading = document.createElement("h2");
    heading.className = "card-title";
    heading.textContent = car.fullName;

    body.append(meta, heading);

    if (car.tagline) {
      var tagline = document.createElement("p");
      tagline.className = "card-tagline";
      tagline.textContent = car.tagline;
      body.appendChild(tagline);
    }

    if (car.engine) {
      var engine = document.createElement("p");
      engine.className = "card-engine";
      engine.textContent = car.engine;
      body.appendChild(engine);
    }

    var specs = document.createElement("dl");
    specs.className = "card-specs";
    [
      ["Power", car.power, " PS"],
      ["0–100 km/h", car.acceleration, " s"],
      ["Top speed", car.top_speed, " km/h"]
    ].forEach(function (spec) {
      if (spec[1] == null || spec[1] === "") return;
      var wrap = document.createElement("div");
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = spec[0];
      dd.textContent = spec[1] + spec[2];
      wrap.append(dt, dd);
      specs.appendChild(wrap);
    });
    if (specs.children.length) body.appendChild(specs);

    if (car.price) {
      var price = document.createElement("p");
      price.className = "card-price";
      price.textContent = Elegant.formatPrice(car.price);
      body.appendChild(price);
    }

    article.append(media, body);
    return article;
  }
});
