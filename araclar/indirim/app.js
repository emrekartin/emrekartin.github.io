(function () {
  var amountEl = document.getElementById("disc-amount");
  var rateEl = document.getElementById("disc-rate");
  var outEl = document.getElementById("disc-out");
  var errorEl = document.getElementById("disc-error");

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
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return n <= 100 && Number.isFinite(n) ? n : null;
  }

  function kurus(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function tl(n) {
    return kurus(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
  }

  document.getElementById("disc-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var amount = money(amountEl.value);
    var rate = percent(rateEl.value);
    if (amount === null) {
      errorEl.textContent = "Tutar yaz.";
      return;
    }
    if (rate === null) {
      errorEl.textContent = "İndirim 0 ile 100 arası olmalı.";
      return;
    }
    var off = kurus(amount * rate / 100);
    outEl.textContent = "İndirim " + tl(off) + " · Ödenecek " + tl(amount - off);
  });
})();
