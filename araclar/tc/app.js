(function () {
  var out = document.getElementById("tc-out");
  var statusEl = document.getElementById("tc-status");
  var errorEl = document.getElementById("tc-error");
  var copyBtn = document.getElementById("tc-copy");

  function mod10(n) {
    return ((n % 10) + 10) % 10;
  }

  function valid(raw) {
    if (!/^[1-9]\d{10}$/.test(raw)) return false;
    var d = raw.split("").map(Number);
    var odd = d[0] + d[2] + d[4] + d[6] + d[8];
    var even = d[1] + d[3] + d[5] + d[7];
    if (d[9] !== mod10(odd * 7 - even)) return false;
    var sum = 0;
    for (var i = 0; i < 10; i++) sum += d[i];
    return d[10] === sum % 10;
  }

  function generate() {
    var d = [1 + Math.floor(Math.random() * 9)];
    for (var i = 1; i < 9; i++) d[i] = Math.floor(Math.random() * 10);
    var odd = d[0] + d[2] + d[4] + d[6] + d[8];
    var even = d[1] + d[3] + d[5] + d[7];
    d[9] = mod10(odd * 7 - even);
    var sum = 0;
    for (var j = 0; j < 10; j++) sum += d[j];
    d[10] = sum % 10;
    return d.join("");
  }

  function showNew() {
    errorEl.textContent = "";
    statusEl.textContent = "";
    out.value = generate();
  }

  document.getElementById("tc-new").addEventListener("click", showNew);
  document.getElementById("tc-check").addEventListener("click", function () {
    errorEl.textContent = "";
    statusEl.textContent = "";
    var raw = out.value.replace(/\s+/g, "");
    if (!/^\d{11}$/.test(raw)) {
      errorEl.textContent = "11 hane olmalı.";
      return;
    }
    statusEl.textContent = valid(raw) ? "Geçerli." : "Geçersiz.";
  });
  copyBtn.addEventListener("click", function () {
    if (!out.value.trim()) return;
    navigator.clipboard.writeText(out.value.replace(/\s+/g, "")).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
  showNew();
})();
