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

  var title = [brandName, typeName].filter(Boolean).join(" · ") || Elegant.t("stock.all_cars");
  document.getElementById("stock-title").textContent = title;
  Elegant.setTitle(title + " · " + Elegant.t("page_titles.stock"));

  renderBrandBackdrop();

  renderActiveFilters();

  document.getElementById("results-status").textContent =
    matches.length === data.cars.length
      ? Elegant.t("stock.showing_all", { count: data.cars.length })
      : Elegant.t("stock.showing_some", { count: matches.length, total: data.cars.length, plural: data.cars.length });

  var grid = document.getElementById("car-grid");
  grid.append.apply(grid, matches.map(card));
  document.getElementById("empty-state").hidden = matches.length > 0;

  // A chip per active filter, each linking to the same listing without it.
  function renderActiveFilters() {
    var box = document.getElementById("active-filters");
    [
      ["brand", Elegant.t("stock.filter_brand"), brandName],
      ["type", Elegant.t("stock.filter_type"), typeName]
    ].forEach(function (entry) {
      if (!filters[entry[0]]) return;
      var rest = new URLSearchParams(params);
      rest.delete(entry[0]);
      var query = rest.toString();

      var chip = document.createElement("a");
      chip.className = "chip";
      chip.href = "stock.html" + (query ? "?" + query : "");
      chip.setAttribute("aria-label", Elegant.t("stock.remove_filter", { filter: entry[1].toLowerCase(), value: entry[2] }));
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

  // When filtering by brand, show images/filters/<brand>.(png|jpg|jpeg|svg)
  // faded behind the page. Decorative only; nothing shows if there's no file.
  function renderBrandBackdrop() {
    var brand = data.brandBySlug[filters.brand];
    if (brand) Elegant.backdrop(brand.backgrounds);
  }

  function card(car) {
    var article = document.createElement("article");
    article.className = "card";

    var media = Elegant.carMedia(car, "card-media");
    var photo = media.querySelector("img");
    if (photo) photo.loading = "lazy";

    var body = document.createElement("div");
    body.className = "card-body";

    var meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = [car.brandName, car.typeName, car.year].filter(Boolean).join(" · ");

    var heading = document.createElement("h2");
    heading.className = "card-title";
    // The title link is stretched over the whole card in CSS, so the entire
    // card opens the detail page while screen readers hear a single link.
    var link = document.createElement("a");
    link.href = Elegant.carUrl(car);
    link.textContent = car.fullName;
    heading.appendChild(link);

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
      [Elegant.t("car.power"), car.power, " " + Elegant.t("units.power")],
      [Elegant.t("car.acceleration"), car.acceleration, " s"],
      [Elegant.t("car.top_speed"), car.top_speed, " km/h"]
    ].forEach(function (spec) {
      if (spec[1] == null || spec[1] === "") return;
      var wrap = document.createElement("div");
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = spec[0];
      dd.textContent = Elegant.formatNumber(spec[1]) + spec[2];
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
