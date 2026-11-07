(function () {
  var fromEl = document.getElementById("work-from");
  var toEl = document.getElementById("work-to");
  var outEl = document.getElementById("work-out");
  var errorEl = document.getElementById("work-error");
  var ramazan = ["2005-11-03", "2006-10-23", "2007-10-12", "2008-09-30", "2009-09-20", "2010-09-09", "2011-08-30", "2012-08-19", "2013-08-08", "2014-07-28", "2015-07-17", "2016-07-05", "2017-06-25", "2018-06-15", "2019-06-04", "2020-05-24", "2021-05-13", "2022-05-02", "2023-04-21", "2024-04-10", "2025-03-30", "2026-03-20", "2027-03-09"];
  var kurban = ["2005-01-20", "2006-01-10", "2006-12-31", "2007-12-20", "2008-12-08", "2009-11-27", "2010-11-16", "2011-11-06", "2012-10-25", "2013-10-15", "2014-10-04", "2015-09-24", "2016-09-12", "2017-09-01", "2018-08-21", "2019-08-11", "2020-07-31", "2021-07-20", "2022-07-09", "2023-06-28", "2024-06-16", "2025-06-06", "2026-05-27", "2027-05-16"];
  var full = {};
  var half = {};

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function key(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function shift(iso, days) {
    var parts = iso.split("-");
    return key(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + days));
  }

  ramazan.forEach(function (start) {
    half[shift(start, -1)] = true;
    for (var i = 0; i < 3; i++) full[shift(start, i)] = true;
  });
  kurban.forEach(function (start) {
    half[shift(start, -1)] = true;
    for (var i = 0; i < 4; i++) full[shift(start, i)] = true;
  });

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

  function fixed(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    if ((m === 1 && d === 1) || (m === 4 && d === 23) || (m === 5 && d === 19) || (m === 8 && d === 30) || (m === 10 && d === 29)) return "full";
    if (m === 5 && d === 1 && y >= 2009) return "full";
    if (m === 7 && d === 15 && y >= 2017) return "full";
    if (m === 10 && d === 28) return "half";
    return "";
  }

  function amount(n) {
    return n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
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
    var holiday = 0;
    var halves = 0;
    var missing = false;
    var cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= last) {
      var year = cursor.getFullYear();
      if (year < 2005 || year > 2027) missing = true;
      var day = cursor.getDay();
      if (day === 0 || day === 6) weekend += 1;
      else {
        var kind = fixed(cursor);
        var stamp = key(cursor);
        if (full[stamp]) kind = "full";
        else if (kind !== "full" && half[stamp]) kind = "half";
        if (kind === "full") holiday += 1;
        else if (kind === "half") {
          halves += 1;
          work += 0.5;
        } else work += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    var text = amount(work) + " iş günü · " + weekend + " hafta sonu · " + holiday + " resmi tatil";
    if (halves) text += " · " + halves + " yarım gün";
    if (missing) text += " · 2005–2027 dışı bayramlar listede yok";
    outEl.textContent = text;
  });
})();
