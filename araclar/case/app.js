(function () {
  var input = document.getElementById("case-in");
  var camelEl = document.getElementById("case-camel");
  var snakeEl = document.getElementById("case-snake");
  var kebabEl = document.getElementById("case-kebab");
  var errorEl = document.getElementById("case-error");

  function lower(value) {
    return value.toLocaleLowerCase("tr-TR");
  }

  function upperFirst(value) {
    var text = lower(value);
    return text.charAt(0).toLocaleUpperCase("tr-TR") + text.slice(1);
  }

  function words(raw) {
    return raw.trim().split(/[^0-9A-Za-zÇĞİIıÖŞÜçğıöşü]+/).filter(Boolean);
  }

  document.getElementById("case-run").addEventListener("click", function () {
    errorEl.textContent = "";
    var parts = words(input.value);
    if (!parts.length) {
      camelEl.value = "";
      snakeEl.value = "";
      kebabEl.value = "";
      errorEl.textContent = "Metin yaz.";
      return;
    }
    var camel = lower(parts[0]);
    for (var i = 1; i < parts.length; i++) camel += upperFirst(parts[i]);
    var flat = parts.map(lower);
    camelEl.value = camel;
    snakeEl.value = flat.join("_");
    kebabEl.value = flat.join("-");
  });
})();
