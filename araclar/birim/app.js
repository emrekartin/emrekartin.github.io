(function () {
  var KEY = "ek-birim";
  var CATS = [
    { id: "length", name: "Uzunluk", units: [
      ["mm", "Milimetre", 0.001], ["cm", "Santimetre", 0.01], ["m", "Metre", 1], ["km", "Kilometre", 1000],
      ["in", "İnç", 0.0254], ["ft", "Ayak (feet)", 0.3048], ["yd", "Yarda", 0.9144],
      ["mi", "Mil", 1609.344], ["nmi", "Deniz mili", 1852]
    ] },
    { id: "mass", name: "Ağırlık", units: [
      ["mg", "Miligram", 1e-6], ["g", "Gram", 0.001], ["kg", "Kilogram", 1], ["t", "Ton", 1000],
      ["oz", "Ons", 0.028349523125], ["lb", "Libre (pound)", 0.45359237], ["st", "Stone", 6.35029318]
    ] },
    { id: "temp", name: "Sıcaklık", units: [
      ["C", "Santigrat (°C)"], ["F", "Fahrenhayt (°F)"], ["K", "Kelvin (K)"]
    ] },
    { id: "area", name: "Alan", units: [
      ["cm2", "Santimetrekare", 1e-4], ["m2", "Metrekare", 1], ["donum", "Dönüm", 1000], ["ha", "Hektar", 10000],
      ["km2", "Kilometrekare", 1e6], ["in2", "İnç kare", 0.00064516], ["ft2", "Ayak kare", 0.09290304],
      ["ac", "Akre", 4046.8564224], ["mi2", "Mil kare", 2589988.110336]
    ] },
    { id: "volume", name: "Hacim", units: [
      ["ml", "Mililitre (cm³)", 0.001], ["l", "Litre", 1], ["m3", "Metreküp", 1000],
      ["floz", "Sıvı ons (ABD)", 0.0295735295625], ["galus", "Galon (ABD)", 3.785411784],
      ["galuk", "Galon (İngiliz)", 4.54609], ["ft3", "Ayak küp", 28.316846592], ["bbl", "Varil (petrol)", 158.987294928]
    ] },
    { id: "speed", name: "Hız", units: [
      ["ms", "Metre / saniye", 1], ["kmh", "Kilometre / saat", 1 / 3.6], ["mph", "Mil / saat", 0.44704],
      ["kn", "Knot", 1852 / 3600], ["fts", "Ayak / saniye", 0.3048]
    ] },
    { id: "data", name: "Veri", units: [
      ["bit", "Bit", 0.125], ["B", "Bayt", 1], ["KB", "Kilobayt (KB)", 1e3], ["MB", "Megabayt (MB)", 1e6],
      ["GB", "Gigabayt (GB)", 1e9], ["TB", "Terabayt (TB)", 1e12], ["KiB", "Kibibayt (KiB)", 1024],
      ["MiB", "Mebibayt (MiB)", 1048576], ["GiB", "Gibibayt (GiB)", 1073741824], ["TiB", "Tebibayt (TiB)", 1099511627776]
    ] },
    { id: "time", name: "Zaman", units: [
      ["ms", "Milisaniye", 0.001], ["s", "Saniye", 1], ["min", "Dakika", 60], ["h", "Saat", 3600],
      ["d", "Gün", 86400], ["wk", "Hafta", 604800], ["mo", "Ay (ortalama)", 2629746], ["yr", "Yıl (ortalama)", 31556952]
    ] },
    { id: "energy", name: "Enerji", units: [
      ["J", "Joule", 1], ["kJ", "Kilojoule", 1000], ["cal", "Kalori", 4.184], ["kcal", "Kilokalori", 4184],
      ["Wh", "Watt saat", 3600], ["kWh", "Kilowatt saat", 3.6e6], ["BTU", "BTU", 1055.05585262]
    ] },
    { id: "pressure", name: "Basınç", units: [
      ["Pa", "Pascal", 1], ["kPa", "Kilopascal", 1000], ["bar", "Bar", 1e5], ["atm", "Atmosfer", 101325],
      ["psi", "PSI", 6894.757293168], ["mmHg", "mmHg", 133.322387415]
    ] },
    { id: "power", name: "Güç", units: [
      ["W", "Watt", 1], ["kW", "Kilowatt", 1000], ["PS", "Beygir gücü (PS)", 735.49875], ["hp", "Beygir gücü (hp)", 745.69987158227]
    ] }
  ];

  var DEFAULTS = {
    length: "m", mass: "kg", temp: "C", area: "m2", volume: "l", speed: "kmh",
    data: "MB", time: "h", energy: "kcal", pressure: "bar", power: "kW"
  };

  var catEl = document.getElementById("unit-cat");
  var valEl = document.getElementById("unit-val");
  var fromEl = document.getElementById("unit-from");
  var outEl = document.getElementById("unit-out");
  var errorEl = document.getElementById("unit-error");
  var listEl = document.getElementById("unit-list");
  var display = new Intl.NumberFormat("tr-TR", { maximumSignificantDigits: 10 });
  var plain = new Intl.NumberFormat("tr-TR", { maximumSignificantDigits: 10, useGrouping: false });

  catEl.innerHTML = CATS.map(function (c) { return '<option value="' + c.id + '">' + c.name + "</option>"; }).join("");

  function cat() {
    return CATS.find(function (c) { return c.id === catEl.value; }) || CATS[0];
  }

  function fillUnits(selected) {
    var units = cat().units;
    fromEl.innerHTML = units.map(function (u) { return '<option value="' + u[0] + '">' + u[1] + "</option>"; }).join("");
    fromEl.value = units.some(function (u) { return u[0] === selected; }) ? selected : DEFAULTS[cat().id];
  }

  function parse(raw) {
    var text = String(raw || "").trim().replace(/\s/g, "");
    if (!text) return null;
    if (text.indexOf(",") >= 0) text = text.replace(/\./g, "").replace(",", ".");
    else if ((text.match(/\./g) || []).length > 1) text = text.replace(/\./g, "");
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(text)) return NaN;
    return Number(text);
  }

  function toC(v, u) { return u === "C" ? v : u === "F" ? (v - 32) * 5 / 9 : v - 273.15; }
  function fromC(v, u) { return u === "C" ? v : u === "F" ? v * 9 / 5 + 32 : v + 273.15; }

  function convert(v, from, to) {
    var c = cat();
    if (c.id === "temp") return fromC(toC(v, from), to);
    var f = c.units.find(function (u) { return u[0] === from; })[2];
    var t = c.units.find(function (u) { return u[0] === to; })[2];
    return v * f / t;
  }

  function fmt(x, nf) {
    if (x === 0) return "0";
    var a = Math.abs(x);
    if (a >= 1e15 || a < 1e-6) return x.toExponential(6).replace(/\.?0+e/, "e").replace(".", ",");
    return nf.format(x);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function run() {
    errorEl.textContent = "";
    outEl.textContent = "";
    try { localStorage.setItem(KEY, JSON.stringify({ cat: catEl.value, from: fromEl.value })); } catch (e) {}
    var v = parse(valEl.value);
    if (v === null) { listEl.innerHTML = ""; return; }
    if (!isFinite(v)) {
      listEl.innerHTML = "";
      errorEl.textContent = "Sayı yaz. Ondalık için virgül ya da nokta kullanabilirsin.";
      return;
    }
    if (cat().id === "temp" && toC(v, fromEl.value) < -273.15) {
      listEl.innerHTML = "";
      errorEl.textContent = "Mutlak sıfırın (−273,15 °C) altı olmaz.";
      return;
    }
    listEl.innerHTML = cat().units.filter(function (u) { return u[0] !== fromEl.value; }).map(function (u) {
      var r = convert(v, fromEl.value, u[0]);
      return '<li><button type="button" class="unit-row" data-copy="' + esc(fmt(r, plain)) + '" title="Kopyala">' +
        '<span class="unit-num">' + esc(fmt(r, display)) + "</span><span class=\"unit-name\">" + esc(u[1]) + "</span></button></li>";
    }).join("");
  }

  listEl.addEventListener("click", function (e) {
    var row = e.target.closest("[data-copy]");
    if (!row || !navigator.clipboard) return;
    navigator.clipboard.writeText(row.dataset.copy).then(function () {
      outEl.textContent = row.dataset.copy + " kopyalandı.";
    });
  });

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  if (CATS.some(function (c) { return c.id === saved.cat; })) catEl.value = saved.cat;
  fillUnits(saved.from);

  catEl.addEventListener("change", function () { fillUnits(); run(); });
  fromEl.addEventListener("change", run);
  valEl.addEventListener("input", run);
  valEl.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });
  run();
})();
