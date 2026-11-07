(function () {
  var countEl = document.getElementById("die-count");
  var sidesEl = document.getElementById("die-sides");
  var outEl = document.getElementById("die-out");
  var errorEl = document.getElementById("die-error");

  function rand(span) {
    var limit = 0x100000000 - (0x100000000 % span);
    var buf = new Uint32Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < limit) return (buf[0] % span) + 1;
    }
  }

  function whole(value, min, max) {
    var n = Number(String(value).trim());
    if (!Number.isInteger(n) || n < min || n > max) return null;
    return n;
  }

  document.getElementById("die-roll").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    if (!crypto.getRandomValues) {
      errorEl.textContent = "Bu sayfa güvenli bağlantıda açılmalı.";
      return;
    }
    var count = whole(countEl.value, 1, 24);
    var sides = whole(sidesEl.value, 2, 100);
    if (count === null || sides === null) {
      errorEl.textContent = "Adet 1–24, yüz 2–100 olmalı.";
      return;
    }
    var rolls = [];
    var total = 0;
    for (var i = 0; i < count; i++) {
      var face = rand(sides);
      rolls.push(face);
      total += face;
    }
    outEl.textContent = rolls.join(" · ") + (count > 1 ? " · Toplam " + total : "");
  });

  document.getElementById("die-coin").addEventListener("click", function () {
    errorEl.textContent = "";
    if (!crypto.getRandomValues) {
      outEl.textContent = "";
      errorEl.textContent = "Bu sayfa güvenli bağlantıda açılmalı.";
      return;
    }
    outEl.textContent = rand(2) === 1 ? "Yazı" : "Tura";
  });
})();
