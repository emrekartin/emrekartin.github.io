(function () {
  var fromEl = document.getElementById("date-from");
  var toEl = document.getElementById("date-to");
  var outEl = document.getElementById("date-out");
  var errorEl = document.getElementById("date-error");
  var names = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

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
