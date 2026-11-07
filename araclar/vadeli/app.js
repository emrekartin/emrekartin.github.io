(function () {
  var amountEl = document.getElementById("dep-amount");
  var rateEl = document.getElementById("dep-rate");
  var daysEl = document.getElementById("dep-days");
  var ccyEl = document.getElementById("dep-ccy");
  var taxEl = document.getElementById("dep-tax");
  var outEl = document.getElementById("dep-out");
  var errorEl = document.getElementById("dep-error");

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
    return Number.isFinite(n) ? n : null;
  }

  function whole(raw) {
    var s = raw.trim();
    if (!/^\d+$/.test(s)) return null;
    var n = Number(s);
    return n > 0 && n <= 100000 ? n : null;
  }

  function kurus(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function tl(n) {
    return kurus(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function suggestTax(days) {
    if (ccyEl.value === "fx") return "25";
    if (days <= 180) return "17,5";
    if (days <= 365) return "15";
    return "10";
  }

  function fillTax() {
    var days = whole(daysEl.value);
    if (days === null) return;
    taxEl.value = suggestTax(days);
  }

  daysEl.addEventListener("input", fillTax);
  ccyEl.addEventListener("change", fillTax);

  document.getElementById("dep-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var amount = money(amountEl.value);
    var rate = percent(rateEl.value);
    var days = whole(daysEl.value);
    var taxRate = percent(taxEl.value);
    if (amount === null) {
      errorEl.textContent = "Anapara yaz.";
      return;
    }
    if (rate === null) {
      errorEl.textContent = "Faiz yaz.";
      return;
    }
    if (days === null) {
      errorEl.textContent = "Gün yaz.";
      return;
    }
    if (taxRate === null) {
      errorEl.textContent = "Stopaj yaz.";
      return;
    }
    var gross = kurus(amount * (rate / 100) * (days / 365));
    var tax = kurus(gross * (taxRate / 100));
    var net = kurus(gross - tax);
    var suffix = ccyEl.value === "try" ? " TL" : "";
    outEl.textContent = "Brüt " + tl(gross) + suffix + " · Stopaj " + tl(tax) + suffix + " · Net " + tl(net) + suffix + " · Vade sonu " + tl(amount + net) + suffix;
  });
})();
