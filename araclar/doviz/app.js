(function () {
  var amountEl = document.getElementById("fx-amount");
  var fromEl = document.getElementById("fx-from");
  var toEl = document.getElementById("fx-to");
  var outEl = document.getElementById("fx-out");
  var errorEl = document.getElementById("fx-error");
  var runBtn = document.getElementById("fx-run");
  var names = [
    ["USD", "Dolar"],
    ["TRY", "Lira"],
    ["EUR", "Euro"],
    ["GBP", "Sterlin"],
    ["CHF", "Frank"],
    ["JPY", "Yen"],
    ["CAD", "Kanada doları"],
    ["AUD", "Avustralya doları"],
    ["CNY", "Yuan"],
    ["NOK", "Norveç kronu"],
    ["SEK", "İsveç kronu"],
    ["DKK", "Danimarka kronu"],
    ["PLN", "Zloti"],
    ["CZK", "Koruna"],
    ["HUF", "Forint"],
    ["RON", "Ley"]
  ];
  var months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function fill(select, selected) {
    names.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item[0];
      option.textContent = item[0] + " · " + item[1];
      if (item[0] === selected) option.selected = true;
      select.appendChild(option);
    });
  }

  function money(raw) {
    var s = raw.trim().replace(/\s/g, "");
    if (!s) return null;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function num(n) {
    var abs = Math.abs(n);
    var max = abs >= 1 ? 4 : 6;
    return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: max });
  }

  function day(iso) {
    var parts = iso.split("-");
    return Number(parts[2]) + " " + months[Number(parts[1]) - 1] + " " + parts[0];
  }

  function show(amount, from, to, rate, iso) {
    outEl.textContent = num(amount) + " " + from + " = " + num(amount * rate) + " " + to +
      " · 1 " + from + " = " + num(rate) + " " + to + " · ECB, " + day(iso);
  }

  function run() {
    errorEl.textContent = "";
    var amount = money(amountEl.value);
    var from = fromEl.value;
    var to = toEl.value;
    if (amount === null) {
      outEl.textContent = "";
      errorEl.textContent = "Tutar yaz.";
      return;
    }
    if (from === to) {
      outEl.textContent = num(amount) + " " + from;
      return;
    }
    runBtn.disabled = true;
    outEl.textContent = "Kur alınıyor.";
    fetch("https://api.frankfurter.app/latest?from=" + from + "&to=" + to)
      .then(function (response) {
        if (!response.ok) throw new Error("bad");
        return response.json();
      })
      .then(function (data) {
        var rate = data.rates && data.rates[to];
        if (!rate || !data.date) throw new Error("empty");
        show(amount, from, to, rate, data.date);
      })
      .catch(function () {
        outEl.textContent = "";
        errorEl.textContent = "Kur alınamadı.";
      })
      .then(function () {
        runBtn.disabled = false;
      });
  }

  fill(fromEl, "USD");
  fill(toEl, "TRY");
  document.getElementById("fx-run").addEventListener("click", run);
  document.getElementById("fx-swap").addEventListener("click", function () {
    var from = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = from;
    if (amountEl.value.trim()) run();
  });
  run();
})();
