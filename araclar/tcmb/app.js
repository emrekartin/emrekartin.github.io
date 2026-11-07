(function () {
  var dateEl = document.getElementById("tcmb-date");
  var usdEl = document.getElementById("tcmb-usd");
  var eurEl = document.getElementById("tcmb-eur");
  var marketDateEl = document.getElementById("mkt-date");
  var marketUsdEl = document.getElementById("mkt-usd");
  var marketEurEl = document.getElementById("mkt-eur");
  var marketGoldEl = document.getElementById("mkt-gold");
  var errorEl = document.getElementById("tcmb-error");
  var runBtn = document.getElementById("tcmb-run");
  var months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function money(n, digits) {
    return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function bulletinLine(name, row) {
    return name + " · Döviz alış " + money(row.forexBuying, 4) + " · Döviz satış " + money(row.forexSelling, 4) +
      " · Efektif alış " + money(row.banknoteBuying, 4) + " · Efektif satış " + money(row.banknoteSelling, 4);
  }

  function marketLine(name, row, digits) {
    return name + " · Alış " + money(row.Buying, digits) + " · Satış " + money(row.Selling, digits);
  }

  function day(raw) {
    var parts = String(raw).split(".");
    if (parts.length !== 3) return raw;
    return Number(parts[0]) + " " + months[Number(parts[1]) - 1] + " " + parts[2];
  }

  function showBulletin(data) {
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
    usdEl.textContent = bulletinLine("Dolar", rows.USD);
    eurEl.textContent = bulletinLine("Euro", rows.EUR);
  }

  function showMarket(data) {
    if (!data.USD || !data.EUR || !data.GRA) throw new Error("empty");
    var when = String(data.Update_Date || "");
    var match = when.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    var stamp = match
      ? Number(match[3]) + " " + months[Number(match[2]) - 1] + " " + match[1] + " " + match[4] + ":" + match[5]
      : when;
    marketDateEl.textContent = "Serbest piyasa " + stamp + " · Truncgil, bülten değil";
    marketUsdEl.textContent = marketLine("Dolar", data.USD, 4);
    marketEurEl.textContent = marketLine("Euro", data.EUR, 4);
    marketGoldEl.textContent = marketLine("Gram altın", data.GRA, 2);
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
    dateEl.textContent = "Kurlar alınıyor.";
    marketDateEl.textContent = "";
    marketUsdEl.textContent = "";
    marketEurEl.textContent = "";
    marketGoldEl.textContent = "";
    var bulletin = load("https://tradersbot.app/api/v1/tcmb").then(showBulletin).catch(function () {
      dateEl.textContent = "";
      usdEl.textContent = "";
      eurEl.textContent = "";
      errorEl.textContent = "Bülten alınamadı.";
    });
    var market = load("https://finans.truncgil.com/v4/today.json").then(showMarket).catch(function () {
      marketDateEl.textContent = "";
      marketUsdEl.textContent = "";
      marketEurEl.textContent = "";
      marketGoldEl.textContent = "Serbest piyasa alınamadı.";
    });
    Promise.all([bulletin, market]).then(function () {
      runBtn.disabled = false;
    });
  }

  document.getElementById("tcmb-run").addEventListener("click", run);
  run();
})();
