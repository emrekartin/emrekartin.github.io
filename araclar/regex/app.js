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

  var EXAMPLES = {
    mail: {
      pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+",
      text: "Bana ali.veli@ornek.com veya destek@site.com.tr adresinden ulaşın. @kullanici bir e-posta değil.",
      hint: "Harf, rakam veya nokta, sonra @, sonra alan adı. \\w harf ya da rakam demek, + bir veya daha fazla."
    },
    tel: {
      pattern: "0?5\\d{2}[ -]?\\d{3}[ -]?\\d{2}[ -]?\\d{2}",
      text: "Ara: 0532 123 45 67 ya da 5051234567. Sabit hat 0312 555 55 55 eşleşmez.",
      hint: "Başta isteğe bağlı 0, sonra 5 ve iki rakam. \\d rakam, {3} üç tane, [ -]? araya boşluk ya da tire gelebilir."
    },
    date: {
      pattern: "(\\d{2})\\.(\\d{2})\\.(\\d{4})",
      text: "Maç 15.11.2026'da, rövanş 22.11.2026'da oynanacak.",
      hint: "gg.aa.yyyy biçimi. Parantezler gün, ay ve yılı ayrı ayrı yakalar; sonuçta 1, 2, 3 diye görünür. \\. gerçek nokta demek."
    },
    price: {
      pattern: "\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})? TL",
      text: "Saha 1.200 TL, su 25,50 TL, forma 899 TL, top 1.450,00 TL.",
      hint: "1–3 rakam, ardından binlik noktalı gruplar, isteğe bağlı kuruş, sonunda TL. * sıfır veya daha fazla, ? isteğe bağlı, (?: ) yakalamadan gruplar."
    },
    plate: {
      pattern: "\\b\\d{2} [A-Z]{1,3} \\d{2,4}\\b",
      text: "06 ABC 123, 34 A 1234 ve 35 XY 99 plakalı araçlar.",
      hint: "İki rakam il kodu, 1–3 büyük harf, 2–4 rakam. [A-Z] büyük harf, \\b kelime sınırı."
    }
  };

  var hint = document.getElementById("re-hint");
  Array.prototype.forEach.call(document.querySelectorAll("[data-ex]"), function (btn) {
    btn.addEventListener("click", function () {
      var ex = EXAMPLES[btn.getAttribute("data-ex")];
      pattern.value = ex.pattern;
      text.value = ex.text;
      flags.forEach(function (f) {
        document.getElementById("re-" + f).checked = f === "g";
      });
      hint.textContent = ex.hint;
      run();
    });
  });

  document.getElementById("re-run").addEventListener("click", run);
})();