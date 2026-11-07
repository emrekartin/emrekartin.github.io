(function () {
  var birthEl = document.getElementById("age-birth");
  var onEl = document.getElementById("age-on");
  var outEl = document.getElementById("age-out");
  var errorEl = document.getElementById("age-error");

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

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

  function nextBirthday(birth, on) {
    if (birth.getMonth() === on.getMonth() && birth.getDate() === on.getDate()) return "Bugün yaş günü.";
    var year = on.getFullYear();
    var next = new Date(year, birth.getMonth(), birth.getDate());
    if (next <= on) next = new Date(year + 1, birth.getMonth(), birth.getDate());
    var left = daysBetween(on, next);
    return "Sonraki yaş gününe " + left + " gün";
  }

  onEl.value = today();
  document.getElementById("age-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var birth = parse(birthEl.value);
    var on = parse(onEl.value);
    if (!birth || !on) {
      errorEl.textContent = "Tarih seç.";
      return;
    }
    if (on < birth) {
      errorEl.textContent = "Gün, doğumdan önce.";
      return;
    }
    outEl.textContent = span(birth, on) + " · " + daysBetween(birth, on) + " gün · " + nextBirthday(birth, on);
  });
})();
