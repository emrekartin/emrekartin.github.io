(function () {
  var input = document.getElementById("jwt-in");
  var headerEl = document.getElementById("jwt-header");
  var payloadEl = document.getElementById("jwt-payload");
  var errorEl = document.getElementById("jwt-error");

  function decodePart(part) {
    var text = part.replace(/-/g, "+").replace(/_/g, "/");
    while (text.length % 4) text += "=";
    var bin = atob(text);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    try {
      return JSON.stringify(JSON.parse(decoded), null, 2);
    } catch (e) {
      return decoded;
    }
  }

  document.getElementById("jwt-read").addEventListener("click", function () {
    errorEl.textContent = "";
    headerEl.value = "";
    payloadEl.value = "";
    var raw = input.value.trim();
    if (!raw) {
      errorEl.textContent = "JWT yapıştır.";
      return;
    }
    var parts = raw.split(".");
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      errorEl.textContent = "Bu JWT okunmadı.";
      return;
    }
    try {
      headerEl.value = decodePart(parts[0]);
      payloadEl.value = decodePart(parts[1]);
    } catch (e) {
      headerEl.value = "";
      payloadEl.value = "";
      errorEl.textContent = "Bu JWT okunmadı.";
    }
  });
})();
