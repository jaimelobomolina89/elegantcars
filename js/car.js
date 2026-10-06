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
  if (mainPhoto) media.insertBefore(Elegant.photoBackdrop(car.image), mainPhoto);
  slot.appendChild(media);
  Elegant.findPhotos(car).then(function (photos) {
    if (photos.length > 1) {
      slot.replaceChildren(carousel(car, photos, data.credits));
    } else if (photos.length === 1) {
      var open = function () {
        lightbox(car, photos, 0, data.credits);
      };
      mainPhoto.addEventListener("click", open);
      media.appendChild(iconButton("carousel-btn carousel-expand", Elegant.t("car.open_fullscreen"), "⤢", open));
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
    ["car.year", car.year, ""],
    ["car.mileage", car.mileage, " km"]
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

// Round button with a symbol for an icon and the label for screen readers.
function iconButton(className, label, symbol, onClick) {
  var b = document.createElement("button");
  b.type = "button";
  b.className = className;
  b.setAttribute("aria-label", label);
  var icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = symbol;
  b.appendChild(icon);
  b.addEventListener("click", onClick);
  return b;
}

// Calls onSwipe(-1 or 1) when the pointer is dragged sideways across el, and
// returns a function that tells whether the last pointer gesture was a swipe
// (so a swipe doesn't also count as a click).
function onSwipe(el, callback) {
  var startX = null;
  var swiped = false;
  el.addEventListener("pointerdown", function (event) {
    startX = event.clientX;
    swiped = false;
  });
  el.addEventListener("pointerup", function (event) {
    if (startX === null) return;
    var dx = event.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) {
      swiped = true;
      callback(dx < 0 ? 1 : -1);
    }
  });
  return function () {
    return swiped;
  };
}

// Full-screen photo viewer in a modal <dialog>: previous/next buttons, arrow
// keys and swipe; Escape, the close button or a click outside the photo close
// it. Calls onClose(index) with the photo that was showing.
function lightbox(car, photos, start, credits, onClose) {
  var index = start;
  var many = photos.length > 1;
  // Focus goes back to whatever opened the viewer when it closes.
  var opener = document.activeElement;

  var dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", Elegant.t("car.photos_label", { car: car.fullName }));

  var stage = document.createElement("div");
  stage.className = "lightbox-stage";
  var image = document.createElement("img");
  image.className = "lightbox-image";
  image.draggable = false;
  stage.appendChild(image);

  var close = iconButton("carousel-btn lightbox-close", Elegant.t("car.close_fullscreen"), "×", function () {
    dialog.close();
  });

  var counter = document.createElement("p");
  counter.className = "carousel-counter lightbox-counter";
  counter.setAttribute("aria-live", "polite");

  var credit = document.createElement("p");
  credit.className = "photo-credit lightbox-credit";

  dialog.append(stage, credit, close);
  if (many) {
    dialog.append(
      iconButton("carousel-btn carousel-prev", Elegant.t("car.previous_photo"), "‹", function () {
        show(index - 1);
      }),
      iconButton("carousel-btn carousel-next", Elegant.t("car.next_photo"), "›", function () {
        show(index + 1);
      }),
      counter
    );
  }

  function show(i) {
    index = (i + photos.length) % photos.length;
    image.src = photos[index];
    image.alt = Elegant.t("car.photo_alt", { car: car.fullName, n: index + 1, total: photos.length });
    counter.textContent = index + 1 + " / " + photos.length;
    var line = Elegant.creditLine(credits, photos[index]);
    if (line) credit.replaceChildren.apply(credit, Array.prototype.slice.call(line.childNodes));
    else credit.replaceChildren();
  }

  dialog.addEventListener("keydown", function (event) {
    if (!many) return;
    if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
    else return;
    event.preventDefault();
  });
  var wasSwipe = onSwipe(stage, function (step) {
    if (many) show(index + step);
  });
  // A click on the dark area around the photo closes the viewer.
  stage.addEventListener("click", function (event) {
    if (event.target === stage && !wasSwipe()) dialog.close();
  });
  dialog.addEventListener("close", function () {
    document.documentElement.classList.remove("lightbox-open");
    dialog.remove();
    if (onClose) onClose(index);
    if (opener && opener !== document.body && document.contains(opener)) opener.focus();
  });

  show(index);
  document.body.appendChild(dialog);
  document.documentElement.classList.add("lightbox-open");
  dialog.showModal();
  close.focus();
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

  var fill = Elegant.photoBackdrop();

  var image = document.createElement("img");
  image.className = "carousel-image";
  image.draggable = false;

  function button(className, label, symbol, step) {
    return iconButton("carousel-btn " + className, label, symbol, function () {
      show(index + step);
    });
  }

  function openFullscreen() {
    lightbox(car, photos, index, credits, show);
  }
  var expand = iconButton("carousel-btn carousel-expand", Elegant.t("car.open_fullscreen"), "⤢", openFullscreen);

  var prev = button("carousel-prev", Elegant.t("car.previous_photo"), "‹", -1);
  var next = button("carousel-next", Elegant.t("car.next_photo"), "›", 1);

  var counter = document.createElement("p");
  counter.className = "carousel-counter";
  counter.setAttribute("aria-live", "polite");

  stage.append(fill, image, prev, next, expand, counter);

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

  var wasSwipe = onSwipe(stage, function (step) {
    show(index + step);
  });
  // Clicking the photo opens it full screen (unless it was a swipe).
  image.addEventListener("click", function () {
    if (!wasSwipe()) openFullscreen();
  });

  // Photographer and licence of the current photo (from images/credits.yaml).
  var credit = document.createElement("p");
  credit.className = "photo-credit container";

  root.append(stage, credit, thumbs);
  show(0);
  return root;
}
