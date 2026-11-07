(function () {
  var dateEl = document.getElementById("off-date");
  var amountEl = document.getElementById("off-amount");
  var unitEl = document.getElementById("off-unit");
  var outEl = document.getElementById("off-out");
  var errorEl = document.getElementById("off-error");
  var names = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function parse(value) {
    var text = String(value || "").trim();
    var tr = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    var iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    var y;
    var m;
    var d;
    if (tr) {
      d = Number(tr[1]);
      m = Number(tr[2]);
      y = Number(tr[3]);
    } else if (iso) {
      y = Number(iso[1]);
      m = Number(iso[2]);
      d = Number(iso[3]);
    } else return null;
    var date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }

  function shift(date, amount, unit) {
    var next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (unit === "day") {
      next.setDate(next.getDate() + amount);
      return next;
    }
    if (unit === "year") {
      next = new Date(date.getFullYear() + amount, date.getMonth(), 1);
    } else {
      next = new Date(date.getFullYear(), date.getMonth() + amount, 1);
    }
    var last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(date.getDate(), last));
    return next;
  }

  function label(date) {
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear() + ", " + names[date.getDay()];
  }

  document.getElementById("off-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var date = parse(dateEl.value);
    var raw = amountEl.value.trim().replace(",", ".");
    if (!date) {
      errorEl.textContent = "Tarih seç.";
      return;
    }
    if (!/^-?\d+$/.test(raw)) {
      errorEl.textContent = "Sayı yaz.";
      return;
    }
    outEl.textContent = label(shift(date, Number(raw), unitEl.value));
  });
})();
