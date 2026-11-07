(function () {
  var amountEl = document.getElementById("kdv-amount");
  var rateEl = document.getElementById("kdv-rate");
  var outEl = document.getElementById("kdv-out");
  var errorEl = document.getElementById("kdv-error");

  function money(raw) {
    var s = raw.trim().replace(/\s/g, "");
    if (!s) return null;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function kurus(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function tl(n) {
    return kurus(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
  }

  function run(add) {
    errorEl.textContent = "";
    outEl.textContent = "";
    var amount = money(amountEl.value);
    var rate = Number(rateEl.value);
    if (amount === null) {
      errorEl.textContent = "Tutar yaz.";
      return;
    }
    var net;
    var tax;
    var total;
    if (add) {
      net = kurus(amount);
      tax = kurus(net * rate / 100);
      total = kurus(net + tax);
    } else {
      total = kurus(amount);
      net = kurus(total / (1 + rate / 100));
      tax = kurus(total - net);
    }
    outEl.textContent = "Ara tutar " + tl(net) + " · KDV " + tl(tax) + " · Toplam " + tl(total);
  }

  document.getElementById("kdv-add").addEventListener("click", function () { run(true); });
  document.getElementById("kdv-split").addEventListener("click", function () { run(false); });
})();
