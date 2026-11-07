(function () {
  var fromEl = document.getElementById("time-from");
  var toEl = document.getElementById("time-to");
  var outEl = document.getElementById("time-out");
  var errorEl = document.getElementById("time-error");

  function minutes(value) {
    var parts = value.split(":");
    if (parts.length < 2) return null;
    var h = Number(parts[0]);
    var m = Number(parts[1]);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  document.getElementById("time-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    var from = minutes(fromEl.value);
    var to = minutes(toEl.value);
    if (from === null || to === null) {
      errorEl.textContent = "Saat seç.";
      return;
    }
    var next = "";
    var diff = to - from;
    if (diff < 0) {
      diff += 24 * 60;
      next = " · ertesi gün";
    }
    var h = Math.floor(diff / 60);
    var m = diff % 60;
    outEl.textContent = h + " saat " + m + " dakika · " + diff + " dakika" + next;
  });
})();
