(function () {
  var input = document.getElementById("url-in");
  var output = document.getElementById("url-out");
  var errorEl = document.getElementById("url-error");
  var copyBtn = document.getElementById("url-copy");

  function encode() {
    errorEl.textContent = "";
    output.value = encodeURI(input.value);
  }

  function decode() {
    errorEl.textContent = "";
    try {
      output.value = decodeURI(input.value);
    } catch (e) {
      output.value = "";
      errorEl.textContent = "Bu metin çözülemedi.";
    }
  }

  document.getElementById("url-encode").addEventListener("click", encode);
  document.getElementById("url-decode").addEventListener("click", decode);
  copyBtn.addEventListener("click", function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
})();
