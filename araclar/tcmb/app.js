(function () {
  var dateEl = document.getElementById("tcmb-date");
  var usdEl = document.getElementById("tcmb-usd");
  var eurEl = document.getElementById("tcmb-eur");
  var goldEl = document.getElementById("gold-line");
  var errorEl = document.getElementById("tcmb-error");
  var runBtn = document.getElementById("tcmb-run");
  var months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function money(n) {
    return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }

  function line(name, row) {
    return name + " · Döviz alış " + money(row.forexBuying) + " · Döviz satış " + money(row.forexSelling) +
      " · Efektif alış " + money(row.banknoteBuying) + " · Efektif satış " + money(row.banknoteSelling);
  }

  function day(raw) {
    var parts = String(raw).split(".");
    if (parts.length !== 3) return raw;
    return Number(parts[0]) + " " + months[Number(parts[1]) - 1] + " " + parts[2];
  }

  function show(data) {
    var rows = {};
    (data.rates || []).forEach(function (row) { rows[row.code] = row; });
    if (!rows.USD || !rows.EUR || !data.date) throw new Error("empty");
    var parts = String(data.date).split(".");
    var bulletin = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var text = "Bülten " + day(data.date);
    if (bulletin < today) text += " · son iş günü";
    dateEl.textContent = text;
    usdEl.textContent = line("Dolar", rows.USD);
    eurEl.textContent = line("Euro", rows.EUR);
  }

  function tl(n) {
    return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function showGold(data) {
    var link = data.attribution;
    var rows = (data.market && data.market.gold_silver) || [];
    var gram = null;
    rows.forEach(function (row) {
      if (row.code === "XAU_GRAM") gram = row;
    });
    if (!gram || !link || !link.url) throw new Error("empty");
    goldEl.textContent = "";
    goldEl.appendChild(document.createTextNode("Gram altın · Alış " + tl(gram.buy) + " · Satış " + tl(gram.sell) + " · "));
    var anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.textContent = link.text || "TurkishLiraRates";
    goldEl.appendChild(anchor);
  }

  function load(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("bad");
      return response.json();
    });
  }

  function run() {
    errorEl.textContent = "";
    runBtn.disabled = true;
    dateEl.textContent = "Bülten alınıyor.";
    goldEl.textContent = "";
    var bulletin = load("https://tradersbot.app/api/v1/tcmb").then(show).catch(function () {
      dateEl.textContent = "";
      usdEl.textContent = "";
      eurEl.textContent = "";
      errorEl.textContent = "Bülten alınamadı.";
    });
    var gold = load("https://turkishlirarates.com/data/v1/rates.json").then(showGold).catch(function () {
      goldEl.textContent = "Gram altın alınamadı.";
    });
    Promise.all([bulletin, gold]).then(function () {
      runBtn.disabled = false;
    });
  }

  document.getElementById("tcmb-run").addEventListener("click", run);
  run();
})();
