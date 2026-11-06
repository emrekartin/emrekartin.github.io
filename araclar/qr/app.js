(function () {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

  var textEl = document.getElementById("qr-text");
  var eccEl = document.getElementById("qr-ecc");
  var darkEl = document.getElementById("qr-dark");
  var lightEl = document.getElementById("qr-light");
  var statusEl = document.getElementById("qr-status");
  var warnEl = document.getElementById("qr-warn");
  var errorEl = document.getElementById("qr-error");
  var canvas = document.getElementById("qr-canvas");
  var emptyEl = document.getElementById("qr-empty");
  var pngBtn = document.getElementById("download-png");
  var svgBtn = document.getElementById("download-svg");

  var current = null;

  function hexOk(value) {
    return /^#[0-9a-f]{6}$/i.test(value);
  }

  function contrast(a, b) {
    function lin(channel) {
      var c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    function lum(hex) {
      var n = parseInt(hex.slice(1), 16);
      var r = lin((n >> 16) & 255);
      var g = lin((n >> 8) & 255);
      var bl = lin(n & 255);
      return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    }
    var l1 = lum(a);
    var l2 = lum(b);
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function render() {
    current = null;
    errorEl.textContent = "";
    warnEl.textContent = "";
    statusEl.textContent = "";
    var text = textEl.value;
    if (!text.trim()) {
      canvas.hidden = true;
      emptyEl.hidden = false;
      pngBtn.disabled = true;
      svgBtn.disabled = true;
      return;
    }

    var dark = hexOk(darkEl.value) ? darkEl.value : "#1c1916";
    var light = hexOk(lightEl.value) ? lightEl.value : "#fffdf8";

    try {
      var qr = qrcode(0, eccEl.value);
      qr.addData(text);
      qr.make();
    } catch (err) {
      canvas.hidden = true;
      emptyEl.hidden = false;
      pngBtn.disabled = true;
      svgBtn.disabled = true;
      errorEl.textContent = "Bu metin QR koduna sığmıyor. Kısalt veya hata düzeltmeyi düşür.";
      return;
    }

    var count = qr.getModuleCount();
    var margin = 4;
    var cell = 12;
    while ((count + margin * 2) * cell > 1400 && cell > 2) cell -= 1;
    var size = (count + margin * 2) * cell;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = dark;
    for (var r = 0; r < count; r += 1) {
      for (var c = 0; c < count; c += 1) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
        }
      }
    }

    canvas.hidden = false;
    emptyEl.hidden = true;
    pngBtn.disabled = false;
    svgBtn.disabled = false;

    var version = (count - 17) / 4;
    var bytes = new TextEncoder().encode(text).length;
    statusEl.textContent = "Sürüm " + version + " · " + eccEl.value + " · " + bytes + " bayt";

    var ratio = contrast(dark, light);
    if (ratio < 3) {
      warnEl.textContent = "Kontrast düşük. Telefon kamerası bu renkleri kaçırabilir.";
    }

    current = { qr: qr, dark: dark, light: light, margin: margin };
  }

  function svgMarkup() {
    var qr = current.qr;
    var count = qr.getModuleCount();
    var margin = current.margin;
    var total = count + margin * 2;
    var path = "";
    for (var r = 0; r < count; r += 1) {
      for (var c = 0; c < count; c += 1) {
        if (qr.isDark(r, c)) {
          path += "M" + (c + margin) + " " + (r + margin) + "h1v1h-1z";
        }
      }
    }
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total + '" shape-rendering="crispEdges">\n' +
      '<rect width="100%" height="100%" fill="' + current.light + '"/>\n' +
      '<path d="' + path + '" fill="' + current.dark + '"/>\n' +
      "</svg>\n"
    );
  }

  function download(filename, blob) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  textEl.addEventListener("input", render);
  eccEl.addEventListener("change", render);
  darkEl.addEventListener("input", render);
  lightEl.addEventListener("input", render);

  pngBtn.addEventListener("click", function () {
    if (!current) return;
    canvas.toBlob(function (blob) {
      if (blob) download("qr.png", blob);
    }, "image/png");
  });

  svgBtn.addEventListener("click", function () {
    if (!current) return;
    download("qr.svg", new Blob([svgMarkup()], { type: "image/svg+xml" }));
  });

  document.getElementById("fill-sample").addEventListener("click", function () {
    textEl.value = "https://www.emrekartin.com";
    render();
    textEl.focus();
  });

  document.getElementById("clear").addEventListener("click", function () {
    textEl.value = "";
    render();
    textEl.focus();
  });

  document.getElementById("qr-form").addEventListener("submit", function (event) {
    event.preventDefault();
  });

  render();
})();
