(function () {
  var out = document.getElementById("iban-out");
  var statusEl = document.getElementById("iban-status");
  var errorEl = document.getElementById("iban-error");
  var copyBtn = document.getElementById("iban-copy");
  var lengths = {
    TR: 26, DE: 22, GB: 22, FR: 27, NL: 18, BE: 16, ES: 24, IT: 27,
    CH: 21, AT: 20, AZ: 28, BG: 22, CY: 28, CZ: 24, DK: 18, EE: 20,
    FI: 18, GR: 27, HR: 21, HU: 28, IE: 22, IS: 26, LI: 21, LT: 20,
    LU: 20, LV: 21, MC: 27, MT: 31, NO: 15, PL: 28, PT: 25, RO: 24,
    SE: 24, SI: 19, SK: 24, SM: 27, VA: 22
  };

  function compact(raw) {
    return raw.replace(/\s+/g, "").toUpperCase();
  }

  function group(value) {
    return value.replace(/(.{4})/g, "$1 ").trim();
  }

  function mod97(iban) {
    var rearranged = iban.slice(4) + iban.slice(0, 4);
    var digits = "";
    for (var i = 0; i < rearranged.length; i++) {
      var code = rearranged.charCodeAt(i);
      digits += code >= 65 ? String(code - 55) : rearranged[i];
    }
    var rem = 0;
    for (var j = 0; j < digits.length; j++) {
      rem = (rem * 10 + (digits.charCodeAt(j) - 48)) % 97;
    }
    return rem;
  }

  function valid(iban) {
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
    var expected = lengths[iban.slice(0, 2)];
    if (expected) {
      if (iban.length !== expected) return false;
    } else if (iban.length < 15 || iban.length > 34) {
      return false;
    }
    return mod97(iban) === 1;
  }

  function generate() {
    var body = "";
    var bytes = new Uint8Array(22);
    crypto.getRandomValues(bytes);
    for (var i = 0; i < 22; i++) body += String(bytes[i] % 10);
    var rem = mod97("TR00" + body);
    var check = String(98 - rem).padStart(2, "0");
    return "TR" + check + body;
  }

  function showNew() {
    errorEl.textContent = "";
    statusEl.textContent = "";
    out.value = group(generate());
  }

  document.getElementById("iban-check").addEventListener("click", function () {
    errorEl.textContent = "";
    statusEl.textContent = "";
    var iban = compact(out.value);
    if (!iban) {
      errorEl.textContent = "IBAN yaz.";
      return;
    }
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
      errorEl.textContent = "IBAN okunmadı.";
      return;
    }
    statusEl.textContent = valid(iban) ? "Geçerli." : "Geçersiz.";
  });
  document.getElementById("iban-new").addEventListener("click", showNew);
  copyBtn.addEventListener("click", function () {
    var iban = compact(out.value);
    if (!iban) return;
    navigator.clipboard.writeText(iban).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
  showNew();
})();
