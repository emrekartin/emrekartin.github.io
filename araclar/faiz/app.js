(function () {
  var amountEl = document.getElementById("int-amount");
  var rateEl = document.getElementById("int-rate");
  var spanEl = document.getElementById("int-span");
  var unitEl = document.getElementById("int-unit");
  var kindEl = document.getElementById("int-kind");
  var outEl = document.getElementById("int-out");
  var errorEl = document.getElementById("int-error");

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
    return kurus(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
  }

  document.getElementById("int-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var amount = money(amountEl.value);
    var rate = percent(rateEl.value);
    var span = whole(spanEl.value);
    if (amount === null) {
      errorEl.textContent = "Anapara yaz.";
      return;
    }
    if (rate === null) {
      errorEl.textContent = "Oran yaz.";
      return;
    }
    if (span === null) {
      errorEl.textContent = "Süre yaz.";
      return;
    }
    var r = rate / 100;
    var interest;
    if (kindEl.value === "simple") {
      var years = unitEl.value === "day" ? span / 365 : unitEl.value === "month" ? span / 12 : span;
      interest = amount * r * years;
    } else if (unitEl.value === "day") {
      interest = amount * (Math.pow(1 + r / 365, span) - 1);
    } else if (unitEl.value === "month") {
      interest = amount * (Math.pow(1 + r / 12, span) - 1);
    } else {
      interest = amount * (Math.pow(1 + r, span) - 1);
    }
    interest = kurus(interest);
    outEl.textContent = "Faiz " + tl(interest) + " · Toplam " + tl(amount + interest);
  });
})();
