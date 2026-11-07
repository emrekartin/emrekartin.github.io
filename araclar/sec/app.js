(function () {
  var listEl = document.getElementById("pick-list");
  var countEl = document.getElementById("pick-count");
  var outEl = document.getElementById("pick-out");
  var errorEl = document.getElementById("pick-error");

  function rand(span) {
    var limit = 0x100000000 - (0x100000000 % span);
    var buf = new Uint32Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % span;
    }
  }

  document.getElementById("pick-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    if (!crypto.getRandomValues) {
      errorEl.textContent = "Bu sayfa güvenli bağlantıda açılmalı.";
      return;
    }
    var items = listEl.value.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    var count = Number(String(countEl.value).trim());
    if (!items.length) {
      errorEl.textContent = "Listeye satır yaz.";
      return;
    }
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      errorEl.textContent = "Adet 1–50 olmalı.";
      return;
    }
    if (count > items.length) {
      errorEl.textContent = "Listede bu kadar satır yok.";
      return;
    }
    var pool = items.slice();
    var picks = [];
    while (picks.length < count) {
      var index = rand(pool.length);
      picks.push(pool.splice(index, 1)[0]);
    }
    outEl.textContent = picks.join(" · ");
  });
})();
