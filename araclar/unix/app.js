(function () {
  var unixEl = document.getElementById("unix-in");
  var dateEl = document.getElementById("unix-date");
  var outEl = document.getElementById("unix-out");
  var errorEl = document.getElementById("unix-error");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function localValue(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
      "T" + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
  }

  function show(date) {
    var ms = date.getTime();
    unixEl.value = String(Math.floor(ms / 1000));
    dateEl.value = localValue(date);
    outEl.textContent = "Saniye " + Math.floor(ms / 1000) + " · Milisaniye " + ms + " · UTC " + date.toISOString();
  }

  function fromUnix() {
    errorEl.textContent = "";
    var raw = unixEl.value.trim();
    if (!/^-?\d+$/.test(raw)) {
      outEl.textContent = "";
      errorEl.textContent = "Unix sayı olmalı.";
      return;
    }
    var n = Number(raw);
    var ms = Math.abs(n) >= 100000000000 ? n : n * 1000;
    var date = new Date(ms);
    if (isNaN(date.getTime())) {
      outEl.textContent = "";
      errorEl.textContent = "Bu sayı tarihe dönmüyor.";
      return;
    }
    show(date);
    unixEl.value = raw;
  }

  function fromDate() {
    errorEl.textContent = "";
    if (!dateEl.value) {
      outEl.textContent = "";
      errorEl.textContent = "Tarih seç.";
      return;
    }
    var date = new Date(dateEl.value);
    if (isNaN(date.getTime())) {
      outEl.textContent = "";
      errorEl.textContent = "Bu tarih okunmadı.";
      return;
    }
    show(date);
  }

  document.getElementById("unix-from").addEventListener("click", fromUnix);
  document.getElementById("date-from").addEventListener("click", fromDate);
  document.getElementById("unix-now").addEventListener("click", function () {
    errorEl.textContent = "";
    show(new Date());
  });
  show(new Date());
})();
