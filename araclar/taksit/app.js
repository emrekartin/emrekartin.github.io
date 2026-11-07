(function () {
  var amountEl = document.getElementById("ins-amount");
  var monthsEl = document.getElementById("ins-months");
  var rateEl = document.getElementById("ins-rate");
  var outEl = document.getElementById("ins-out");
  var errorEl = document.getElementById("ins-error");

  function money(raw) {
    var s = raw.trim().replace(/\s/g, "");
    if (!s) return null;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function percent(raw) {
    var s = raw.trim().replace(/\s/g, "").replace("%", "").replace(",", ".");
    if (s === "") return 0;
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function whole(raw) {
    var s = raw.trim();
    if (!/^\d+$/.test(s)) return null;
    var n = Number(s);
    return n > 0 && n <= 600 ? n : null;
  }

  function kurus(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function tl(n) {
    return kurus(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
  }

  document.getElementById("ins-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var amount = money(amountEl.value);
    var months = whole(monthsEl.value);
    var rate = percent(rateEl.value);
    if (amount === null) {
      errorEl.textContent = "Tutar yaz.";
      return;
    }
    if (months === null) {
      errorEl.textContent = "Ay yaz.";
      return;
    }
    if (rate === null) {
      errorEl.textContent = "Faiz yaz.";
      return;
    }
    if (rate === 0) {
      var even = kurus(amount / months);
      var drift = kurus(amount - even * months);
      if (drift !== 0) {
        outEl.textContent = "Aylık " + tl(even) + " · Son taksit " + tl(even + drift) + " · Toplam " + tl(amount) + " · Faiz " + tl(0);
      } else {
        outEl.textContent = "Aylık " + tl(even) + " · Toplam " + tl(amount) + " · Faiz " + tl(0);
      }
      return;
    }
    var r = rate / 100;
    var growth = Math.pow(1 + r, months);
    var payment = kurus(amount * r * growth / (growth - 1));
    var total = kurus(payment * months);
    outEl.textContent = "Aylık " + tl(payment) + " · Toplam " + tl(total) + " · Faiz " + tl(total - amount);
  });
})();
