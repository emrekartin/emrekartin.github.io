(function () {
  var buyEl = document.getElementById("fund-buy");
  var sellEl = document.getElementById("fund-sell");
  var kindEl = document.getElementById("fund-kind");
  var rateEl = document.getElementById("fund-rate");
  var outEl = document.getElementById("fund-out");
  var errorEl = document.getElementById("fund-error");

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

  function rateText(value) {
    var n = Number(value);
    if (n === 0) return "0";
    return String(n).replace(".", ",");
  }

  kindEl.addEventListener("change", function () {
    rateEl.value = rateText(kindEl.value);
  });

  document.getElementById("fund-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var buy = money(buyEl.value);
    var sell = money(sellEl.value);
    var rate = percent(rateEl.value);
    if (buy === null || sell === null) {
      errorEl.textContent = "Alış ve satış yaz.";
      return;
    }
    if (rate === null) {
      errorEl.textContent = "Stopaj 0 ile 100 arası olmalı.";
      return;
    }
    var gain = kurus(sell - buy);
    if (gain < 0) {
      outEl.textContent = "Zarar " + tl(-gain) + " · Stopaj " + tl(0) + " · Hesaba geçen " + tl(sell);
      return;
    }
    var tax = kurus(gain * rate / 100);
    outEl.textContent = "Kazanç " + tl(gain) + " · Stopaj " + tl(tax) + " · Hesaba geçen " + tl(sell - tax);
  });
})();
