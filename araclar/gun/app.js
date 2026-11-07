(function () {
  var dateEl = document.getElementById("off-date");
  var amountEl = document.getElementById("off-amount");
  var unitEl = document.getElementById("off-unit");
  var outEl = document.getElementById("off-out");
  var errorEl = document.getElementById("off-error");
  var names = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function parse(value) {
    var parts = value.split("-");
    if (parts.length !== 3) return null;
    var y = Number(parts[0]);
    var m = Number(parts[1]);
    var d = Number(parts[2]);
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
