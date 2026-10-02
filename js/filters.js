// Filters page: one link per brand and per car type, each going to the stock
// page with that filter applied.
Elegant.boot(function (data) {
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
    meta.textContent = Elegant.plural(total, "car") + " in stock";

    link.append(label, meta);
    li.appendChild(link);
    return li;
  }

  var brandList = document.getElementById("brand-tiles");
  data.brands.forEach(function (brand) {
    brandList.appendChild(
      tile("stock.html?brand=" + encodeURIComponent(brand.slug), brand.name, count("brand", brand.slug))
    );
  });

  var typeList = document.getElementById("type-tiles");
  data.types.forEach(function (type) {
    typeList.appendChild(
      tile(
        "stock.html?type=" + encodeURIComponent(type.slug),
        type.name,
        count("type", type.slug),
        Elegant.silhouette(type.slug)
      )
    );
  });

  var all = document.getElementById("all-link");
  all.textContent = "See all " + Elegant.plural(data.cars.length, "car");
  all.hidden = false;
});
