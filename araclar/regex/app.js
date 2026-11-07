(function () {
  var pattern = document.getElementById("re-pattern");
  var text = document.getElementById("re-text");
  var out = document.getElementById("re-out");
  var error = document.getElementById("re-error");
  var flags = ["i", "m", "s", "g"];

  function flagText() {
    return flags.filter(function (f) {
      return document.getElementById("re-" + f).checked;
    }).join("");
  }

  function run() {
    out.innerHTML = "";
    error.textContent = "";
    var src = pattern.value;
    if (!src) {
      error.textContent = "Desen yaz.";
      return;
    }
    var re;
    try {
      re = new RegExp(src, flagText());
    } catch (e) {
      error.textContent = "Desen hatalı.";
      return;
    }
    var body = text.value;
    var found = [];
    if (re.global) {
      var hit;
      while ((hit = re.exec(body))) {
        found.push(hit);
        if (hit[0] === "") re.lastIndex++;
        if (found.length > 200) break;
      }
    } else {
      var one = re.exec(body);
      if (one) found.push(one);
    }
    if (!found.length) {
      error.textContent = "Eşleşme yok.";
      return;
    }
    found.forEach(function (hit, n) {
      var row = document.createElement("p");
      row.className = "re-hit";
      var label = document.createElement("span");
      label.textContent = (n + 1) + ". ";
      row.appendChild(label);
      var mark = document.createElement("mark");
      mark.className = "re-mark";
      mark.textContent = hit[0];
      row.appendChild(mark);
      for (var i = 1; i < hit.length; i++) {
        var cap = document.createElement("span");
        cap.textContent = "  · " + i + " " + (hit[i] == null ? "" : hit[i]);
        row.appendChild(cap);
      }
      out.appendChild(row);
    });
  }

  document.getElementById("re-run").addEventListener("click", run);
})();