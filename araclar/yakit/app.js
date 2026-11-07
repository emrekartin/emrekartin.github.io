(function () {
  var modeEl = document.getElementById("fuel-mode");
  var kmEl = document.getElementById("fuel-km");
  var rateEl = document.getElementById("fuel-rate");
  var litersEl = document.getElementById("fuel-liters");
  var priceEl = document.getElementById("fuel-price");
  var peopleEl = document.getElementById("fuel-people");
  var outEl = document.getElementById("fuel-out");
  var errorEl = document.getElementById("fuel-error");

  function num(el) {
    var text = el.value.trim().replace(/\s/g, "");
    if (!text) return null;
    if (text.indexOf(",") >= 0) text = text.replace(/\./g, "").replace(",", ".");
    if (!/^\d+(\.\d+)?$|^\.\d+$/.test(text)) return NaN;
    return Number(text);
  }

  function fmt(x, digits) {
    return x.toLocaleString("tr-TR", { maximumFractionDigits: digits });
  }

  function money(x) {
    return x.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
  }

  function setMode() {
    document.querySelectorAll("[data-mode]").forEach(function (el) {
      el.hidden = el.dataset.mode !== modeEl.value;
    });
    outEl.textContent = "";
    errorEl.textContent = "";
  }

  modeEl.addEventListener("change", setMode);

  document.getElementById("fuel-run").addEventListener("click", function () {
    outEl.textContent = "";
    errorEl.textContent = "";
    var km = num(kmEl);
    var price = num(priceEl);
    if (!(km > 0)) {
      errorEl.textContent = "Yolu kilometre olarak yaz.";
      return;
    }
    if (Number.isNaN(price)) {
      errorEl.textContent = "Litre fiyatına sayı yaz.";
      return;
    }

    if (modeEl.value === "cost") {
      var rate = num(rateEl);
      var people = num(peopleEl);
      if (!(rate > 0)) {
        errorEl.textContent = "100 kilometrede kaç litre yaktığını yaz.";
        return;
      }
      if (Number.isNaN(people) || (people !== null && (people < 1 || !Number.isInteger(people)))) {
        errorEl.textContent = "Kişi sayısı tam sayı olmalı.";
        return;
      }
      var liters = km * rate / 100;
      var parts = [fmt(liters, 2) + " litre"];
      if (price) {
        var total = liters * price;
        parts.push(money(total));
        if (people > 1) parts.push("kişi başı " + money(total / people));
        parts.push("km başı " + money(total / km));
      }
      outEl.textContent = parts.join(" · ");
      return;
    }

    var used = num(litersEl);
    if (!(used > 0)) {
      errorEl.textContent = "Harcanan yakıtı litre olarak yaz.";
      return;
    }
    var result = [fmt(used / km * 100, 2) + " L / 100 km", fmt(km / used, 2) + " km / litre"];
    if (price) result.push("km başı " + money(used * price / km));
    outEl.textContent = result.join(" · ");
  });

  setMode();
})();
