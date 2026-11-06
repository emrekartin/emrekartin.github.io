(function () {
  var decEl = document.getElementById("base-dec");
  var hexEl = document.getElementById("base-hex");
  var binEl = document.getElementById("base-bin");
  var errorEl = document.getElementById("base-error");

  function fail(message) {
    errorEl.textContent = message;
  }

  function parseDec(raw) {
    if (!/^\d+$/.test(raw)) return null;
    if (raw.length > 200) return false;
    return BigInt(raw);
  }

  function parseHex(raw) {
    var s = raw.trim().replace(/^0x/i, "");
    if (!/^[0-9a-fA-F]+$/.test(s)) return null;
    if (s.length > 200) return false;
    return BigInt("0x" + s);
  }

  function parseBin(raw) {
    var s = raw.replace(/\s+/g, "").replace(/^0b/i, "");
    if (!/^[01]+$/.test(s)) return null;
    if (s.length > 800) return false;
    return BigInt("0b" + s);
  }

  function fill(n) {
    errorEl.textContent = "";
    decEl.value = n.toString(10);
    hexEl.value = n.toString(16).toUpperCase();
    binEl.value = n.toString(2);
  }

  function run(el, parse) {
    var raw = el.value.trim();
    if (!raw) {
      fail("Sayı yaz.");
      return;
    }
    var n = parse(raw);
    if (n === false) {
      fail("Çok uzun.");
      return;
    }
    if (n === null) {
      fail("Bu sayı okunmadı.");
      return;
    }
    fill(n);
  }

  document.getElementById("from-dec").addEventListener("click", function () { run(decEl, parseDec); });
  document.getElementById("from-hex").addEventListener("click", function () { run(hexEl, parseHex); });
  document.getElementById("from-bin").addEventListener("click", function () { run(binEl, parseBin); });
})();
