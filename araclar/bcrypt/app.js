(function () {
  var bcrypt = dcodeIO.bcrypt;
  var pw = document.getElementById("pw");
  var rounds = document.getElementById("rounds");
  var output = document.getElementById("hash-out");
  var statusEl = document.getElementById("hash-status");
  var errorEl = document.getElementById("hash-error");
  var makeBtn = document.getElementById("hash-make");
  var copyBtn = document.getElementById("hash-copy");
  var checkBtn = document.getElementById("hash-check");
  var busy = false;

  function setBusy(on) {
    busy = on;
    makeBtn.disabled = on;
    checkBtn.disabled = on;
  }

  makeBtn.addEventListener("click", function () {
    errorEl.textContent = "";
    statusEl.textContent = "";
    if (!pw.value) {
      output.value = "";
      errorEl.textContent = "Parola yaz.";
      return;
    }
    setBusy(true);
    statusEl.textContent = "Hesaplanıyor.";
    bcrypt.hash(pw.value, Number(rounds.value), function (err, hash) {
      setBusy(false);
      statusEl.textContent = "";
      if (err || !hash) {
        output.value = "";
        errorEl.textContent = "Hash üretilemedi.";
        return;
      }
      output.value = hash;
    });
  });

  checkBtn.addEventListener("click", function () {
    errorEl.textContent = "";
    statusEl.textContent = "";
    if (!pw.value || !output.value.trim()) {
      errorEl.textContent = "Parola ve hash gerekli.";
      return;
    }
    setBusy(true);
    statusEl.textContent = "Kontrol ediliyor.";
    bcrypt.compare(pw.value, output.value.trim(), function (err, same) {
      setBusy(false);
      statusEl.textContent = "";
      if (err) {
        errorEl.textContent = "Bu hash okunmadı.";
        return;
      }
      statusEl.textContent = same ? "Eşleşti." : "Eşleşmedi.";
    });
  });

  copyBtn.addEventListener("click", function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
})();
