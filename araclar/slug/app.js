(function () {
  var input = document.getElementById("slug-in");
  var output = document.getElementById("slug-out");
  var errorEl = document.getElementById("slug-error");
  var copyBtn = document.getElementById("slug-copy");
  var map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u" };

  function slug(raw) {
    var text = "";
    for (var i = 0; i < raw.length; i++) text += map[raw.charAt(i)] || raw.charAt(i);
    return text.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  document.getElementById("slug-run").addEventListener("click", function () {
    errorEl.textContent = "";
    var value = slug(input.value.trim());
    output.value = value;
    if (!value) errorEl.textContent = "Başlık yaz.";
  });
  copyBtn.addEventListener("click", function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
})();
