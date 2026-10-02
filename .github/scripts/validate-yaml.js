// Checks the site's YAML files before they are published.
// Run locally with: node .github/scripts/validate-yaml.js
//
// Uses the same vendored js-yaml the browser uses, so a file that passes here
// also loads on the site. Errors fail the check (and block the deploy);
// warnings are only reported.

var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..", "..");
var yaml = require(path.join(root, "js/vendor/js-yaml/js-yaml.umd.min.js"));

var CAR_FIELDS = ["id", "brand", "type", "model", "year", "color", "tagline", "description",
  "engine", "power", "acceleration", "top_speed", "price", "images", "image_alt"];
var REQUIRED = ["id", "brand", "type", "model"];
var NUMBERS = ["year", "power", "acceleration", "top_speed", "price"];

var inGithub = !!process.env.GITHUB_ACTIONS;
var errors = 0;
var warnings = 0;

// GitHub shows ::error / ::warning lines as annotations on the file.
function report(level, file, line, message) {
  if (level === "error") errors++; else warnings++;
  if (inGithub) {
    console.log("::" + level + " file=" + file + (line ? ",line=" + line : "") + "::" + message);
  } else {
    console.log((level === "error" ? "ERROR   " : "warning ") + file + (line ? ":" + line : "") + "  " + message);
  }
}

// Line of the first "key: value" match at or after line `from`, so messages
// point near the problem.
function lineOf(text, key, value, from) {
  var lines = text.split("\n");
  for (var i = from ? from - 1 : 0; i < lines.length; i++) {
    var m = lines[i].match(/^\s*(?:-\s+)?([\w./-]+):\s*(.*?)\s*$/);
    if (m && m[1] === key && String(m[2]).replace(/^["']|["']$/g, "") === String(value)) return i + 1;
  }
  return 0;
}

function load(file) {
  var text = fs.readFileSync(path.join(root, file), "utf8");
  try {
    return { text: text, doc: yaml.load(text) || {} };
  } catch (e) {
    var line = e.mark ? e.mark.line + 1 : 0;
    report("error", file, line, "YAML no válido / Invalid YAML: " + e.reason +
      ". Revisa la sangría (dos espacios, sin tabuladores) y que no queden campos a medias.");
    return null;
  }
}

function yamlFiles(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).reduce(function (list, entry) {
    var rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return list.concat(yamlFiles(rel));
    return /\.ya?ml$/.test(entry.name) ? list.concat(rel) : list;
  }, []);
}

var files = ["data/site.yaml", "images/credits.yaml"].concat(yamlFiles("lang"));
var loaded = {};
files.forEach(function (file) { loaded[file] = load(file); });

// site.yaml: the stock must reference real brands and types.
var site = loaded["data/site.yaml"];
var ids = {};
if (site) {
  var file = "data/site.yaml";
  var slugs = function (list) {
    return (list || []).reduce(function (set, item) { set[item.slug] = true; return set; }, {});
  };
  var brands = slugs(site.doc.brands);
  var types = slugs(site.doc.types);

  (site.doc.cars || []).forEach(function (car, i) {
    if (!car || typeof car !== "object") {
      report("error", file, 0, "El coche nº " + (i + 1) + " está vacío o mal formado / Car #" + (i + 1) + " is empty or malformed.");
      return;
    }
    var name = car.id || "#" + (i + 1);
    var line = car.id ? lineOf(site.text, "id", car.id) : 0;
    var at = function (key) { return lineOf(site.text, key, car[key], line) || line; };

    REQUIRED.forEach(function (key) {
      if (car[key] === undefined || car[key] === null || car[key] === "") {
        report("error", file, line, "Al coche '" + name + "' le falta '" + key + "' / Car '" + name + "' is missing '" + key + "'.");
      }
    });
    if (car.id) {
      if (ids[car.id]) report("error", file, line, "El id '" + car.id + "' está repetido / Duplicate id '" + car.id + "'.");
      ids[car.id] = true;
      if (!/^[a-z0-9-]+$/.test(car.id)) {
        report("warning", file, line, "El id '" + car.id + "' debería ir en minúsculas, sin espacios / Id should be lowercase with no spaces.");
      }
    }
    if (car.brand && !brands[car.brand]) {
      report("error", file, at("brand"), "Coche '" + name + "': la marca '" + car.brand + "' no está en la lista brands (las slugs van en minúsculas) / Unknown brand slug.");
    }
    if (car.type && !types[car.type]) {
      report("error", file, at("type"), "Coche '" + name + "': el tipo '" + car.type + "' no está en la lista types (las slugs van en minúsculas) / Unknown type slug.");
    }
    NUMBERS.forEach(function (key) {
      if (key in car && typeof car[key] !== "number") {
        report("error", file, line, "Coche '" + name + "': '" + key + "' debe ser un número, sin puntos ni símbolos (p. ej. 82000) / '" + key + "' must be a plain number.");
      }
    });
    Object.keys(car).forEach(function (key) {
      if (CAR_FIELDS.indexOf(key) === -1) {
        report("warning", file, line, "Coche '" + name + "': campo desconocido '" + key + "', ¿errata? / Unknown field '" + key + "', typo?");
      }
    });
  });
}

// Translations keyed by a car id that no longer exists are left over.
if (site) {
  Object.keys(loaded).forEach(function (file) {
    var entry = loaded[file];
    if (!entry || !/content\.ya?ml$/.test(file) || !entry.doc.cars) return;
    Object.keys(entry.doc.cars).forEach(function (id) {
      if (!ids[id]) report("warning", file, lineOf(entry.text, id, ""), "Traducción de un coche que no está en site.yaml: '" + id + "' / Translation for unknown car.");
    });
  });
}

// Credits for image files that were deleted.
var credits = loaded["images/credits.yaml"];
if (credits) {
  Object.keys(credits.doc).forEach(function (image) {
    if (!fs.existsSync(path.join(root, image))) {
      report("warning", "images/credits.yaml", lineOf(credits.text, image, ""), "Crédito de una imagen que ya no existe: " + image + " / Credit for a missing image.");
    }
  });
}

console.log("\n" + files.length + " files checked: " + errors + " error(s), " + warnings + " warning(s).");
process.exit(errors ? 1 : 0);
