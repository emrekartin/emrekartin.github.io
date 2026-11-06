(function () {
  var lenEl = document.getElementById("pw-len");
  var out = document.getElementById("pw-out");
  var errorEl = document.getElementById("pw-error");
  var copyBtn = document.getElementById("pw-copy");
  var chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*-_";

  function pick() {
    var max = 256 - (256 % chars.length);
    var buf = new Uint8Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < max) return chars[buf[0] % chars.length];
    }
  }

  function generate() {
    errorEl.textContent = "";
    if (!crypto.getRandomValues) {
      errorEl.textContent = "Bu sayfa güvenli bağlantıda açılmalı.";
      return;
    }
    var len = Number(lenEl.value);
    if (!Number.isInteger(len) || len < 4 || len > 64) {
      out.value = "";
      errorEl.textContent = "Uzunluk 4 ile 64 arası olmalı.";
      return;
    }
    var value = "";
    for (var i = 0; i < len; i++) value += pick();
    out.value = value;
  }

  document.getElementById("pw-new").addEventListener("click", generate);
  copyBtn.addEventListener("click", function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
  generate();
})();
