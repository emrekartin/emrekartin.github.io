(function () {
  var input = document.getElementById("json-in");
  var output = document.getElementById("json-out");
  var errorEl = document.getElementById("json-error");
  var copyBtn = document.getElementById("json-copy");

  function place(text, pos) {
    var line = 1;
    var col = 1;
    var end = Math.min(pos, text.length);
    for (var i = 0; i < end; i++) {
      if (text.charAt(i) === "\n") {
        line += 1;
        col = 1;
      } else {
        col += 1;
      }
    }
    return { line: line, col: col };
  }

  function fail(text, err) {
    output.value = "";
    var match = /position (\d+)/i.exec(err.message || "");
    if (!match) {
      errorEl.textContent = "Bu metin JSON değil.";
      return;
    }
    var at = place(text, Number(match[1]));
    errorEl.textContent = "Hata: satır " + at.line + ", sütun " + at.col + ".";
  }

  function run(space) {
    var text = input.value;
    errorEl.textContent = "";
    if (!text.trim()) {
      output.value = "";
      errorEl.textContent = "Metin yok.";
      return;
    }
    try {
      output.value = JSON.stringify(JSON.parse(text), null, space);
    } catch (err) {
      fail(text, err);
    }
  }

  document.getElementById("json-pretty").addEventListener("click", function () {
    run(2);
  });
  document.getElementById("json-mini").addEventListener("click", function () {
    run(0);
  });
  copyBtn.addEventListener("click", function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
})();
