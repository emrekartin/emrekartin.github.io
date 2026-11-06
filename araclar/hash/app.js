(function () {
  var input = document.getElementById("hash-in");
  var output = document.getElementById("hash-out");
  var errorEl = document.getElementById("hash-error");
  var copyBtn = document.getElementById("hash-copy");
  var ticket = 0;

  function hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function run() {
    var mine = ++ticket;
    errorEl.textContent = "";
    if (!crypto.subtle) {
      errorEl.textContent = "Bu sayfa güvenli bağlantıda açılmalı.";
      return;
    }
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(input.value)).then(function (buf) {
      if (mine !== ticket) return;
      output.value = hex(buf);
    }).catch(function () {
      if (mine !== ticket) return;
      output.value = "";
      errorEl.textContent = "Hesaplanamadı.";
    });
  }

  input.addEventListener("input", run);
  copyBtn.addEventListener("click", function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
  run();
})();
