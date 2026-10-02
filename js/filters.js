// Filters page: one link per brand and per car type, each going to the stock
// page with that filter applied.
Elegant.boot(function (data) {
  // Faded background: images/filters/filters-page.(png|jpg|jpeg|svg), or the
  // file set as `filters_background` in site.yaml. Nothing shows if missing.
  Elegant.backdrop(Elegant.imageCandidates(data.site.filters_background, "images/filters/filters-page"));

  function count(field, slug) {
    return data.cars.filter(function (car) {
      return car[field] === slug;
    }).length;
  }

  function tile(href, name, total, illustration) {
    var li = document.createElement("li");
    var link = document.createElement("a");
    link.className = "tile";
    link.href = href;

    if (illustration) {
      var media = document.createElement("span");
      media.className = "tile-media";
      media.appendChild(illustration);
      link.appendChild(media);
    }

    var label = document.createElement("span");
    label.className = "tile-name";
    label.textContent = name;

    var meta = document.createElement("span");
    meta.className = "tile-count";
    meta.textContent = Elegant.t("filters.in_stock", { count: total });

    link.append(label, meta);
    li.appendChild(link);
    return li;
  }

  // Brand and type names are printed under their images, so the images are
  // decorative (empty alt). Each candidate file (.png, .jpg, .jpeg, .svg) is
  // tried in turn. A brand with no logo shows just its name; a type with no
  // image falls back to the drawn silhouette.
  function logo(brand) {
    var img = Elegant.imageFromCandidates(brand.logos, function (missing) {
      missing.closest(".tile-media").remove();
    });
    img.alt = "";
    img.className = "tile-logo";
    return img;
  }

  function typeImage(type) {
    var img = Elegant.imageFromCandidates(type.images, function (missing) {
      var media = missing.closest(".tile-media");
      media.classList.remove("tile-media-photo");
      media.replaceChildren(Elegant.silhouette(type.slug));
    });
    img.alt = "";
    img.className = "tile-type-image";
    return img;
  }

  var brandList = document.getElementById("brand-tiles");
  data.brands.forEach(function (brand) {
    brandList.appendChild(
      tile("stock.html?brand=" + encodeURIComponent(brand.slug), brand.name, count("brand", brand.slug), logo(brand))
    );
  });

  var typeList = document.getElementById("type-tiles");
  data.types.forEach(function (type) {
    typeList.appendChild(
      tile(
        "stock.html?type=" + encodeURIComponent(type.slug),
        type.name,
        count("type", type.slug),
        typeImage(type)
      )
    );
  });
  typeList.querySelectorAll(".tile-media").forEach(function (media) {
    media.classList.add("tile-media-photo");
  });

  var all = document.getElementById("all-link");
  all.textContent = Elegant.t("filters.see_all", { count: data.cars.length });
  all.hidden = false;
});
