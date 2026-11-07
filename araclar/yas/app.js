(function () {
  var birthEl = document.getElementById("age-birth");
  var onEl = document.getElementById("age-on");
  var outEl = document.getElementById("age-out");
  var errorEl = document.getElementById("age-error");

  function today() {
    var d = new Date();
    return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear();
  }

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

  function decimalAge(birth, on) {
    var years = on.getFullYear() - birth.getFullYear();
    var last = new Date(on.getFullYear(), birth.getMonth(), birth.getDate());
    if (last > on) {
      years -= 1;
      last = new Date(on.getFullYear() - 1, birth.getMonth(), birth.getDate());
    }
    var next = new Date(last.getFullYear() + 1, birth.getMonth(), birth.getDate());
    var value = years + daysBetween(last, on) / daysBetween(last, next);
    return (Math.floor(value * 100) / 100).toFixed(2).replace(".", ",") + " yaş";
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
    outEl.textContent = span(birth, on) + " · " + decimalAge(birth, on) + " · " + daysBetween(birth, on) + " gün · " + nextBirthday(birth, on);
  });
})();
