(function () {
  var left = document.getElementById("diff-a");
  var right = document.getElementById("diff-b");
  var out = document.getElementById("diff-out");
  var status = document.getElementById("diff-status");
  var error = document.getElementById("diff-error");

  function lines(text) {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  }

  function run() {
    out.innerHTML = "";
    status.textContent = "";
    error.textContent = "";
    var a = lines(left.value);
    var b = lines(right.value);
    if (a.length * b.length > 800 * 800) {
      error.textContent = "Metin çok uzun.";
      return;
    }
    var n = a.length;
    var m = b.length;
    var dp = new Uint32Array((n + 1) * (m + 1));
    var w = m + 1;
    var i, j;
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        dp[i * w + j] = a[i] === b[j]
          ? dp[(i + 1) * w + (j + 1)] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + (j + 1)]);
      }
    }
    var added = 0;
    var removed = 0;
    i = 0;
    j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        row("same", "  " + a[i]);
        i++;
        j++;
      } else if (dp[(i + 1) * w + j] >= dp[i * w + (j + 1)]) {
        row("del", "- " + a[i]);
        removed++;
        i++;
      } else {
        row("add", "+ " + b[j]);
        added++;
        j++;
      }
    }
    while (i < n) { row("del", "- " + a[i]); removed++; i++; }
    while (j < m) { row("add", "+ " + b[j]); added++; j++; }
    status.textContent = added + " eklendi · " + removed + " silindi";
  }

  function row(kind, text) {
    var div = document.createElement("div");
    div.className = "diff-line" + (kind === "add" ? " diff-add" : kind === "del" ? " diff-del" : "");
    div.textContent = text;
    out.appendChild(div);
  }

  document.getElementById("diff-run").addEventListener("click", run);
})();
