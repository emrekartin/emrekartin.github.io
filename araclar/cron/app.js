(function () {
  var input = document.getElementById("cron-in");
  var outEl = document.getElementById("cron-out");
  var errorEl = document.getElementById("cron-error");
  var days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  function all(min, max) {
    var list = [];
    for (var n = min; n <= max; n++) list.push(n);
    return list;
  }

  function same(list, full) {
    if (list.length !== full.length) return false;
    for (var i = 0; i < list.length; i++) if (list[i] !== full[i]) return false;
    return true;
  }

  function field(expr, min, max) {
    if (!/^[0-9*,/\-]+$/.test(expr)) return null;
    var found = {};
    var parts = expr.split(",");
    for (var p = 0; p < parts.length; p++) {
      var piece = parts[p];
      var step = 1;
      var slash = piece.indexOf("/");
      if (slash >= 0) {
        step = Number(piece.slice(slash + 1));
        piece = piece.slice(0, slash);
        if (!Number.isInteger(step) || step < 1) return null;
      }
      var start;
      var end;
      if (piece === "*") {
        start = min;
        end = max;
      } else if (piece.indexOf("-") >= 0) {
        var pair = piece.split("-");
        start = Number(pair[0]);
        end = Number(pair[1]);
      } else {
        start = Number(piece);
        end = start;
      }
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < min || end > max || start > end) return null;
      for (var n = start; n <= end; n += step) found[n] = true;
    }
    return Object.keys(found).map(Number).sort(function (a, b) { return a - b; });
  }

  function clock(hour, minute) {
    return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
  }

  function stepOf(list) {
    if (list.length < 2) return 0;
    var step = list[1] - list[0];
    for (var i = 1; i < list.length; i++) if (list[i] - list[i - 1] !== step) return 0;
    return step;
  }

  function read(raw) {
    var parts = raw.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    var minute = field(parts[0], 0, 59);
    var hour = field(parts[1], 0, 23);
    var dom = field(parts[2], 1, 31);
    var month = field(parts[3], 1, 12);
    var dow = field(parts[4], 0, 7);
    if (!minute || !hour || !dom || !month || !dow) return null;
    dow = dow.map(function (n) { return n === 7 ? 0 : n; }).filter(function (n, i, list) {
      return list.indexOf(n) === i;
    }).sort(function (a, b) { return a - b; });
    var everyMinute = same(minute, all(0, 59));
    var everyHour = same(hour, all(0, 23));
    var everyDom = same(dom, all(1, 31));
    var everyMonth = same(month, all(1, 12));
    var everyDow = same(dow, all(0, 6));
    if (minute.length === 1 && minute[0] === 0 && everyHour && everyDom && everyMonth && everyDow) return "Her saat başı";
    if (minute[0] === 0 && everyHour && everyDom && everyMonth && everyDow) {
      var minuteStep = stepOf(minute);
      if (minuteStep > 1 && minute[minute.length - 1] + minuteStep > 59) return "Her " + minuteStep + " dakikada bir";
    }
    if (minute.length === 1 && hour.length === 1 && everyDom && everyMonth && everyDow) {
      return "Her gün saat " + clock(hour[0], minute[0]);
    }
    if (minute.length === 1 && hour.length === 1 && everyDom && everyMonth && same(dow, [1, 2, 3, 4, 5])) {
      return "Her hafta içi saat " + clock(hour[0], minute[0]);
    }
    if (minute.length === 1 && hour.length === 1 && everyDom && everyMonth && same(dow, [0, 6])) {
      return "Her hafta sonu saat " + clock(hour[0], minute[0]);
    }
    if (minute.length === 1 && hour.length === 1 && everyDom && everyMonth) {
      return dow.map(function (n) { return days[n]; }).join(", ") + " saat " + clock(hour[0], minute[0]);
    }
    if (minute.length === 1 && hour.length === 1 && dom.length === 1 && everyMonth && everyDow) {
      return "Her ayın " + dom[0] + ". günü, saat " + clock(hour[0], minute[0]);
    }
    var bits = [];
    bits.push(minute.length === 1 ? "dakika " + minute[0] : "dakikalar " + minute.join(", "));
    bits.push(hour.length === 1 ? "saat " + hour[0] : "saatler " + hour.join(", "));
    if (!everyDom) bits.push("ayın " + dom.join(", ") + ". günü");
    if (!everyMonth) bits.push(month.join(", ") + ". ay");
    if (!everyDow) bits.push(dow.map(function (n) { return days[n]; }).join(", "));
    return bits.join(", ");
  }

  document.getElementById("cron-run").addEventListener("click", function () {
    errorEl.textContent = "";
    outEl.textContent = "";
    if (!input.value.trim()) {
      errorEl.textContent = "İfade yaz.";
      return;
    }
    var text = read(input.value);
    if (!text) {
      errorEl.textContent = "Bu ifade okunmadı.";
      return;
    }
    outEl.textContent = text;
  });
})();
