// Credits page: every image listed in images/credits.yaml, with its author,
// licence and source.
Elegant.boot(function (data) {
  var list = document.getElementById("credits-list");

  Object.keys(data.credits || {}).forEach(function (path) {
    var entry = data.credits[path];
    var li = document.createElement("li");
    li.className = "credit-item";

    var thumb = document.createElement("img");
    thumb.src = path;
    thumb.alt = "";
    thumb.loading = "lazy";
    thumb.className = "credit-thumb";

    var body = document.createElement("div");
    var file = document.createElement("p");
    file.className = "credit-file";
    file.textContent = path;
    body.appendChild(file);

    var line = Elegant.creditLine(data.credits, path);
    if (line) body.appendChild(line);

    if (entry.source) {
      var source = document.createElement("a");
      source.href = entry.source;
      source.className = "credit-source";
      source.textContent = Elegant.t("credits.source");
      body.appendChild(source);
    }

    li.append(thumb, body);
    list.appendChild(li);
  });
});
