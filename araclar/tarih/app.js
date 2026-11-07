(function () {
  var fromEl = document.getElementById("date-from");
  var toEl = document.getElementById("date-to");
  var outEl = document.getElementById("date-out");
  var errorEl = document.getElementById("date-error");
  var names = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

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

  function daysBetween(from, to) {
    return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000);
  }

  function span(from, to) {
    var y = to.getFullYear() - from.getFullYear();
    var m = to.getMonth() - from.getMonth();
    var d = to.getDate() - from.getDate();
    if (d < 0) {
      m -= 1;
      d += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    }
    if (m < 0) {
      y -= 1;
      m += 12;
    }
    return y + " yıl, " + m + " ay, " + d + " gün";
  }

  document.getElementById("date-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var from = parse(fromEl.value);
    var to = parse(toEl.value);
    if (!from || !to) {
      errorEl.textContent = "Tarih seç.";
      return;
    }
    var start = from;
    var end = to;
    var note = "";
    if (to < from) {
      start = to;
      end = from;
      note = "Bitiş daha erken. ";
    }
    outEl.textContent = note + span(start, end) + " · " + daysBetween(start, end) + " gün · " + names[end.getDay()];
  });
})();
