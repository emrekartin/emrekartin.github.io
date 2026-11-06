(function () {
  var input = document.getElementById("b64-in");
  var output = document.getElementById("b64-out");
  var errorEl = document.getElementById("b64-error");
  var copyBtn = document.getElementById("b64-copy");

  function encode(text) {
    var bytes = new TextEncoder().encode(text);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function decode(text) {
    var clean = text.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    var pad = clean.length % 4;
    if (pad) clean += "====".slice(pad);
    var bin = atob(clean);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  function run(fn) {
    errorEl.textContent = "";
    if (!input.value) {
      output.value = "";
      errorEl.textContent = "Metin yok.";
      return;
    }
    try {
      output.value = fn(input.value);
    } catch (err) {
      output.value = "";
      errorEl.textContent = "Bu metin çözülemedi.";
    }
  }

  document.getElementById("b64-encode").addEventListener("click", function () { run(encode); });
  document.getElementById("b64-decode").addEventListener("click", function () { run(decode); });
  copyBtn.addEventListener("click", function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
})();
