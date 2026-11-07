(function () {
  var unixEl = document.getElementById("unix-in");
  var dateEl = document.getElementById("unix-date");
  var timeEl = document.getElementById("unix-time");
  var outEl = document.getElementById("unix-out");
  var errorEl = document.getElementById("unix-error");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function show(date) {
    var ms = date.getTime();
    unixEl.value = String(Math.floor(ms / 1000));
    dateEl.value = pad(date.getDate()) + "." + pad(date.getMonth() + 1) + "." + date.getFullYear();
    timeEl.value = pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
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
    var text = dateEl.value.trim();
    var tr = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    var clock = timeEl.value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!tr || !clock) {
      outEl.textContent = "";
      errorEl.textContent = "Tarih ve saat seç.";
      return;
    }
    var h = Number(clock[1]);
    var min = Number(clock[2]);
    var s = clock[3] ? Number(clock[3]) : 0;
    var date = new Date(Number(tr[3]), Number(tr[2]) - 1, Number(tr[1]), h, min, s);
    if (h > 23 || min > 59 || s > 59 || date.getFullYear() !== Number(tr[3]) || date.getDate() !== Number(tr[1])) {
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
