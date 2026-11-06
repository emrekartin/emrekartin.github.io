(function () {
  var pick = document.getElementById("color-pick");
  var hexEl = document.getElementById("color-hex");
  var rEl = document.getElementById("color-r");
  var gEl = document.getElementById("color-g");
  var bEl = document.getElementById("color-b");
  var unityEl = document.getElementById("color-unity");
  var errorEl = document.getElementById("color-error");
  var copyBtn = document.getElementById("color-copy");

  function hexByte(n) {
    return n.toString(16).padStart(2, "0");
  }

  function unityChannel(n) {
    return (Math.round((n / 255) * 1000) / 1000).toString();
  }

  function show(r, g, b) {
    errorEl.textContent = "";
    var hex = "#" + hexByte(r) + hexByte(g) + hexByte(b);
    pick.value = hex;
    hexEl.value = hex;
    rEl.value = String(r);
    gEl.value = String(g);
    bEl.value = String(b);
    unityEl.value = unityChannel(r) + ", " + unityChannel(g) + ", " + unityChannel(b);
  }

  function parseHex(raw) {
    var s = raw.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16)
    };
  }

  function channel(raw) {
    var s = raw.trim();
    if (!/^\d+$/.test(s)) return null;
    var n = Number(s);
    if (n > 255) return null;
    return n;
  }

  function unit(raw) {
    var s = raw.trim().replace(",", ".");
    if (!/^(?:0|1|0?\.\d+|1\.0+|\.\d+)$/.test(s)) return null;
    var n = Number(s);
    if (n < 0 || n > 1) return null;
    return Math.round(n * 255);
  }

  function fromHex() {
    var color = parseHex(hexEl.value);
    if (!color) {
      errorEl.textContent = "Hex okunmadı.";
      return;
    }
    show(color.r, color.g, color.b);
  }

  pick.addEventListener("input", function () {
    var color = parseHex(pick.value);
    if (color) show(color.r, color.g, color.b);
  });

  document.getElementById("color-eye").addEventListener("click", function () {
    errorEl.textContent = "";
    if (!window.EyeDropper) {
      errorEl.textContent = "Bu tarayıcı renk yakalamıyor.";
      return;
    }
    new EyeDropper().open().then(function (result) {
      var color = parseHex(result.sRGBHex);
      if (color) show(color.r, color.g, color.b);
    }).catch(function () {});
  });

  document.getElementById("from-hex").addEventListener("click", fromHex);
  document.getElementById("from-rgb").addEventListener("click", function () {
    var r = channel(rEl.value);
    var g = channel(gEl.value);
    var b = channel(bEl.value);
    if (r === null || g === null || b === null) {
      errorEl.textContent = "R, G, B 0 ile 255 arası olmalı.";
      return;
    }
    show(r, g, b);
  });
  document.getElementById("from-unity").addEventListener("click", function () {
    var parts = unityEl.value.match(/(?:\d+\.?\d*|\.\d+)/g) || [];
    if (parts.length < 3) {
      errorEl.textContent = "Unity r, g, b olmalı.";
      return;
    }
    var r = unit(parts[0]);
    var g = unit(parts[1]);
    var b = unit(parts[2]);
    if (r === null || g === null || b === null) {
      errorEl.textContent = "Unity değeri 0 ile 1 arası olmalı.";
      return;
    }
    show(r, g, b);
  });
  copyBtn.addEventListener("click", function () {
    if (!hexEl.value) return;
    navigator.clipboard.writeText(hexEl.value).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });

  fromHex();
})();
