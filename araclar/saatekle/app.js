(function () {
  var timeEl = document.getElementById("add-time");
  var opEl = document.getElementById("add-op");
  var hEl = document.getElementById("add-h");
  var mEl = document.getElementById("add-m");
  var outEl = document.getElementById("add-out");
  var errorEl = document.getElementById("add-error");
  var DAY = 24 * 60;

  function minutes(value) {
    var parts = value.split(":");
    if (parts.length < 2) return null;
    var h = Number(parts[0]);
    var m = Number(parts[1]);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  function amount(el) {
    var raw = el.value.trim();
    if (!raw) return 0;
    return /^\d+$/.test(raw) ? Number(raw) : null;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  document.getElementById("add-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var start = minutes(timeEl.value);
    var h = amount(hEl);
    var m = amount(mEl);
    if (start === null) {
      errorEl.textContent = "Saat seç.";
      return;
    }
    if (h === null || m === null) {
      errorEl.textContent = "Saat ve dakikaya tam sayı yaz.";
      return;
    }
    var total = start + Number(opEl.value) * (h * 60 + m);
    var days = Math.floor(total / DAY);
    var clock = total - days * DAY;
    var note = "";
    if (days === 1) note = " · ertesi gün";
    else if (days === -1) note = " · önceki gün";
    else if (days > 1) note = " · " + days + " gün sonra";
    else if (days < -1) note = " · " + -days + " gün önce";
    outEl.textContent = pad(Math.floor(clock / 60)) + ":" + pad(clock % 60) + note;
  });
})();
