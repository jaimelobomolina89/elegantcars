// Car detail page: shows the car chosen by ?id=<car id> in full.
Elegant.boot(function (data) {
  var id = new URLSearchParams(window.location.search).get("id");
  var car = data.cars.find(function (c) {
    return c.id === id;
  });

  // If we came from a (possibly filtered) stock page, go back to that exact
  // listing; otherwise go to the full stock.
  var back = document.getElementById("back-link");
  try {
    var from = new URL(document.referrer);
    if (from.origin === window.location.origin && /\/stock\.html$/.test(from.pathname)) {
      back.href = from.pathname.split("/").pop() + from.search;
    }
  } catch (e) {
    // No or invalid referrer: keep the default link.
  }

  if (!car) {
    document.getElementById("car-not-found").hidden = false;
    Elegant.setTitle(Elegant.t("page_titles.car_not_found"));
    return;
  }

  Elegant.setTitle(car.fullName);
  // Show the main photo straight away, then upgrade to a carousel once we know
  // how many photos the car has.
  var slot = document.getElementById("car-media-slot");
  var media = Elegant.carMedia(car, "detail-media");
  var mainPhoto = media.querySelector("img");
  if (mainPhoto) media.insertBefore(backdrop(car.image), mainPhoto);
  slot.appendChild(media);
  Elegant.findPhotos(car).then(function (photos) {
    if (photos.length > 1) {
      slot.replaceChildren(carousel(car, photos, data.credits));
    } else if (photos.length === 1) {
      var credit = Elegant.creditLine(data.credits, photos[0]);
      if (credit) {
        credit.classList.add("container");
        slot.appendChild(credit);
      }
    }
  });
  document.getElementById("car-meta").textContent = [car.brandName, car.typeName, car.year]
    .filter(Boolean)
    .join(" · ");
  document.getElementById("car-name").textContent = car.fullName;
  document.getElementById("car-tagline").textContent = car.tagline || "";
  document.getElementById("car-description").textContent = car.description || "";
  document.getElementById("car-price").textContent = car.price ? Elegant.formatPrice(car.price) : "";

  var specs = document.getElementById("car-specs");
  [
    ["car.engine", car.engine, ""],
    ["car.power", car.power, " " + Elegant.t("units.power")],
    ["car.acceleration", car.acceleration, " s"],
    ["car.top_speed", car.top_speed, " km/h"],
    ["car.type", car.typeName, ""],
    ["car.year", car.year, ""]
  ].forEach(function (spec) {
    if (spec[1] == null || spec[1] === "") return;
    var wrap = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = Elegant.t(spec[0]);
    // Numbers use the language's format (3,4 in Spanish); years and text don't.
    var value = typeof spec[1] === "number" && spec[0] !== "car.year" ? Elegant.formatNumber(spec[1]) : spec[1];
    dd.textContent = value + spec[2];
    wrap.append(dt, dd);
    specs.appendChild(wrap);
  });

  var moreBrand = document.getElementById("more-brand");
  moreBrand.href = "stock.html?brand=" + encodeURIComponent(car.brand);
  moreBrand.textContent = Elegant.t("car.more_brand", { brand: car.brandName });
  var moreType = document.getElementById("more-type");
  moreType.href = "stock.html?type=" + encodeURIComponent(car.type);
  moreType.textContent = Elegant.t("car.more_type", { type: car.typeName });

  document.getElementById("car-detail").hidden = false;
});

// Faded copy of a photo that fills the landscape frame behind the uncropped
// photo. Decorative, so hidden from screen readers; removed if it fails to load.
function backdrop(src) {
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

// Accessible photo carousel: previous/next buttons, thumbnails, arrow keys and
// swipe. It never auto-advances, so there is nothing to pause.
function carousel(car, photos, credits) {
  var index = 0;

  var root = document.createElement("section");
  root.className = "carousel";
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", Elegant.t("car.photos_label", { car: car.fullName }));

  var stage = document.createElement("div");
  stage.className = "carousel-stage";

  var fill = backdrop();

  var image = document.createElement("img");
  image.className = "carousel-image";
  image.draggable = false;

  function button(className, label, symbol, step) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "carousel-btn " + className;
    b.setAttribute("aria-label", label);
    var icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = symbol;
    b.appendChild(icon);
    b.addEventListener("click", function () {
      show(index + step);
    });
    return b;
  }

  var prev = button("carousel-prev", Elegant.t("car.previous_photo"), "‹", -1);
  var next = button("carousel-next", Elegant.t("car.next_photo"), "›", 1);

  var counter = document.createElement("p");
  counter.className = "carousel-counter";
  counter.setAttribute("aria-live", "polite");

  stage.append(fill, image, prev, next, counter);

  var thumbs = document.createElement("ul");
  thumbs.className = "carousel-thumbs container";
  var thumbButtons = photos.map(function (src, i) {
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "carousel-thumb";
    b.setAttribute("aria-label", Elegant.t("car.show_photo", { n: i + 1, total: photos.length }));
    var img = document.createElement("img");
    img.src = src;
    img.alt = "";
    b.appendChild(img);
    b.addEventListener("click", function () {
      show(i);
    });
    li.appendChild(b);
    thumbs.appendChild(li);
    return b;
  });

  function show(i) {
    index = (i + photos.length) % photos.length;
    image.src = photos[index];
    fill.src = photos[index];
    image.alt = Elegant.t("car.photo_alt", { car: car.fullName, n: index + 1, total: photos.length });
    counter.textContent = index + 1 + " / " + photos.length;
    var line = Elegant.creditLine(credits, photos[index]);
    if (line) credit.replaceChildren.apply(credit, Array.prototype.slice.call(line.childNodes));
    else credit.replaceChildren();
    thumbButtons.forEach(function (b, j) {
      if (j === index) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }

  root.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
    else return;
    event.preventDefault();
  });

  var startX = null;
  stage.addEventListener("pointerdown", function (event) {
    startX = event.clientX;
  });
  stage.addEventListener("pointerup", function (event) {
    if (startX === null) return;
    var dx = event.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
  });

  // Photographer and licence of the current photo (from images/credits.yaml).
  var credit = document.createElement("p");
  credit.className = "photo-credit container";

  root.append(stage, credit, thumbs);
  show(0);
  return root;
}
