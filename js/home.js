// Homepage: hero image or video, driven by the `home` section of site.yaml.
Elegant.boot(function (data) {
  var home = data.home;
  var media = document.getElementById("hero-media");

  document.getElementById("hero-eyebrow").textContent = home.eyebrow || "";
  document.getElementById("hero-title").textContent = home.title || "";
  document.getElementById("hero-text").textContent = home.text || "";
  document.getElementById("hero-button").textContent = home.button || "Find your car";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (home.video) {
    // Decorative background video: muted, no controls, with a visible
    // pause/play button (WCAG 2.2.2). It doesn't autoplay for people who prefer
    // reduced motion.
    var video = document.createElement("video");
    video.src = home.video;
    if (home.image) video.poster = home.image;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden", "true");
    video.autoplay = !reduceMotion;
    media.appendChild(video);

    var toggle = document.getElementById("hero-toggle");
    var sync = function () {
      toggle.textContent = video.paused ? "Play background video" : "Pause background video";
    };
    toggle.hidden = false;
    toggle.addEventListener("click", function () {
      if (video.paused) video.play();
      else video.pause();
    });
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    sync();
  } else if (home.image) {
    var img = document.createElement("img");
    img.src = home.image;
    img.alt = home.image_alt || "";
    media.appendChild(img);
  }
});
