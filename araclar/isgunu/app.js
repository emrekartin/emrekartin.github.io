(function () {
  var fromEl = document.getElementById("work-from");
  var toEl = document.getElementById("work-to");
  var outEl = document.getElementById("work-out");
  var errorEl = document.getElementById("work-error");

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

  document.getElementById("work-run").addEventListener("click", function () {
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
    if (to < from) {
      start = to;
      end = from;
    }
    var work = 0;
    var weekend = 0;
    var cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= last) {
      var day = cursor.getDay();
      if (day === 0 || day === 6) weekend += 1;
      else work += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    outEl.textContent = work + " iş günü · " + weekend + " hafta sonu · resmi tatil hariç";
  });
})();
