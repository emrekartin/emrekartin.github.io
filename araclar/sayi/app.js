(function () {
  var minEl = document.getElementById("num-min");
  var maxEl = document.getElementById("num-max");
  var countEl = document.getElementById("num-count");
  var modeEl = document.getElementById("num-mode");
  var outEl = document.getElementById("num-out");
  var errorEl = document.getElementById("num-error");

  function rand(span) {
    var limit = 0x100000000 - (0x100000000 % span);
    var buf = new Uint32Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % span;
    }
  }

  function whole(value) {
    var n = Number(String(value).trim());
    if (!Number.isInteger(n) || n < -1000000000 || n > 1000000000) return null;
    return n;
  }

  document.getElementById("num-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    if (!crypto.getRandomValues) {
      errorEl.textContent = "Bu sayfa güvenli bağlantıda açılmalı.";
      return;
    }
    var min = whole(minEl.value);
    var max = whole(maxEl.value);
    var count = Number(String(countEl.value).trim());
    if (min === null || max === null || !Number.isInteger(count) || count < 1 || count > 50) {
      errorEl.textContent = "En az ve en çok tam sayı olmalı. Adet 1–50.";
      return;
    }
    if (max < min) {
      var swap = min;
      min = max;
      max = swap;
    }
    var span = max - min + 1;
    var unique = modeEl.value === "unique";
    if (unique && count > span) {
      errorEl.textContent = "Aralık bu kadar tekrarsız sayı vermez.";
      return;
    }
    var picks = [];
    var seen = {};
    while (picks.length < count) {
      var n = min + rand(span);
      if (unique && seen[n]) continue;
      seen[n] = true;
      picks.push(n);
    }
    outEl.textContent = picks.join(" · ");
  });
})();
