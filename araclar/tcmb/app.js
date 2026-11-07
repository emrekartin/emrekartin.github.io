(function () {
  var dateEl = document.getElementById("tcmb-date");
  var usdEl = document.getElementById("tcmb-usd");
  var eurEl = document.getElementById("tcmb-eur");
  var errorEl = document.getElementById("tcmb-error");
  var runBtn = document.getElementById("tcmb-run");
  var months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function rate(n) {
    return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }

  function line(name, row) {
    return name + " · Döviz alış " + rate(row.forexBuying) + " · Döviz satış " + rate(row.forexSelling) +
      " · Efektif alış " + rate(row.banknoteBuying) + " · Efektif satış " + rate(row.banknoteSelling);
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
    dateEl.textContent = "Bülten " + day(data.date);
    usdEl.textContent = line("Dolar", rows.USD);
    eurEl.textContent = line("Euro", rows.EUR);
  }

  function run() {
    errorEl.textContent = "";
    runBtn.disabled = true;
    dateEl.textContent = "Bülten alınıyor.";
    fetch("https://tradersbot.app/api/v1/tcmb")
      .then(function (response) {
        if (!response.ok) throw new Error("bad");
        return response.json();
      })
      .then(show)
      .catch(function () {
        dateEl.textContent = "";
        usdEl.textContent = "";
        eurEl.textContent = "";
        errorEl.textContent = "Bülten alınamadı.";
      })
      .then(function () {
        runBtn.disabled = false;
      });
  }

  document.getElementById("tcmb-run").addEventListener("click", run);
  run();
})();
