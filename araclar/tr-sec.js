(function () {
  var months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var dow = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"];
  var pop = null;
  var anchor = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function parseDate(value) {
    var text = String(value || "").trim();
    var tr = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    var iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    var d;
    var mo;
    var y;
    if (tr) {
      d = Number(tr[1]);
      mo = Number(tr[2]);
      y = Number(tr[3]);
    } else if (iso) {
      y = Number(iso[1]);
      mo = Number(iso[2]);
      d = Number(iso[3]);
    } else return null;
    var date = new Date(y, mo - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return date;
  }

  function formatDate(date) {
    return pad(date.getDate()) + "." + pad(date.getMonth() + 1) + "." + date.getFullYear();
  }

  function parseTime(value) {
    var m = String(value || "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    var h = Number(m[1]);
    var min = Number(m[2]);
    var s = m[3] ? Number(m[3]) : 0;
    if (h > 23 || min > 59 || s > 59) return null;
    return { h: h, m: min, s: s };
  }

  function formatTime(h, m, s) {
    var text = pad(h) + ":" + pad(m);
    if (s) text += ":" + pad(s);
    return text;
  }

  function close() {
    if (pop) pop.remove();
    pop = null;
    anchor = null;
  }

  function place(input, node) {
    close();
    anchor = input;
    pop = node;
    input.parentNode.appendChild(node);
  }

  function openDate(input) {
    var current = parseDate(input.value) || new Date();
    var view = new Date(current.getFullYear(), current.getMonth(), 1);

    function draw() {
      var node = document.createElement("div");
      node.className = "tr-pop";
      var head = document.createElement("div");
      head.className = "tr-pop-head";
      var prev = document.createElement("button");
      prev.type = "button";
      prev.textContent = "‹";
      var title = document.createElement("strong");
      title.textContent = months[view.getMonth()] + " " + view.getFullYear();
      var next = document.createElement("button");
      next.type = "button";
      next.textContent = "›";
      prev.addEventListener("click", function (event) {
        event.stopPropagation();
        view.setMonth(view.getMonth() - 1);
        draw();
      });
      next.addEventListener("click", function (event) {
        event.stopPropagation();
        view.setMonth(view.getMonth() + 1);
        draw();
      });
      head.appendChild(prev);
      head.appendChild(title);
      head.appendChild(next);
      var grid = document.createElement("div");
      grid.className = "tr-cal";
      dow.forEach(function (name) {
        var cell = document.createElement("span");
        cell.className = "dow";
        cell.textContent = name;
        grid.appendChild(cell);
      });
      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var lead = (first.getDay() + 6) % 7;
      var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      var selected = parseDate(input.value);
      for (var i = 0; i < lead; i++) {
        var blank = document.createElement("button");
        blank.type = "button";
        blank.disabled = true;
        blank.textContent = "";
        grid.appendChild(blank);
      }
      for (var day = 1; day <= days; day++) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = String(day);
        if (selected && selected.getFullYear() === view.getFullYear() && selected.getMonth() === view.getMonth() && selected.getDate() === day) {
          btn.className = "on";
        }
        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          var picked = new Date(view.getFullYear(), view.getMonth(), Number(event.currentTarget.textContent));
          input.value = formatDate(picked);
          close();
        });
        grid.appendChild(btn);
      }
      node.appendChild(head);
      node.appendChild(grid);
      place(input, node);
    }

    draw();
  }

  function openTime(input) {
    var current = parseTime(input.value) || { h: 9, m: 0, s: 0 };
    var chosen = { h: current.h, m: current.m, s: current.s || 0 };
    var node = document.createElement("div");
    node.className = "tr-pop tr-clock";
    var read = document.createElement("strong");
    read.className = "tr-read";

    function showRead() {
      read.textContent = pad(chosen.h) + ":" + pad(chosen.m);
      input.value = formatTime(chosen.h, chosen.m, chosen.s);
    }

    function column(title, count, get, set) {
      var wrap = document.createElement("div");
      wrap.className = "tr-col";
      var cap = document.createElement("span");
      cap.textContent = title;
      var list = document.createElement("div");
      list.className = "tr-list";
      for (var n = 0; n < count; n++) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = pad(n);
        if (n === get()) btn.className = "on";
        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          set(Number(event.currentTarget.textContent));
          [].forEach.call(list.children, function (child) {
            child.className = Number(child.textContent) === get() ? "on" : "";
          });
          showRead();
        });
        list.appendChild(btn);
      }
      wrap.appendChild(cap);
      wrap.appendChild(list);
      return list;
    }

    showRead();
    var cols = document.createElement("div");
    cols.className = "tr-cols";
    var hourList = column("Saat", 24, function () { return chosen.h; }, function (v) { chosen.h = v; });
    var sep = document.createElement("span");
    sep.className = "tr-sep";
    sep.textContent = ":";
    var minuteList = column("Dakika", 60, function () { return chosen.m; }, function (v) { chosen.m = v; });
    cols.appendChild(hourList.parentNode);
    cols.appendChild(sep);
    cols.appendChild(minuteList.parentNode);
    var ok = document.createElement("button");
    ok.type = "button";
    ok.className = "tr-ok";
    ok.textContent = "Tamam";
    ok.addEventListener("click", function (event) {
      event.stopPropagation();
      showRead();
      close();
    });
    node.appendChild(read);
    node.appendChild(cols);
    node.appendChild(ok);
    place(input, node);
    [hourList, minuteList].forEach(function (list) {
      var on = list.querySelector(".on");
      if (on) list.scrollTop = on.offsetTop - (list.clientHeight - on.offsetHeight) / 2;
    });
  }

  document.addEventListener("click", function (event) {
    if (!pop) return;
    if (pop.contains(event.target) || event.target === anchor) return;
    close();
  });

  document.querySelectorAll(".tr-date").forEach(function (input) {
    var parsed = parseDate(input.value);
    if (parsed) input.value = formatDate(parsed);
    input.addEventListener("focus", function () { openDate(input); });
    input.addEventListener("click", function (event) {
      event.stopPropagation();
      if (anchor !== input) openDate(input);
    });
    input.addEventListener("change", function () {
      var date = parseDate(input.value);
      if (date) input.value = formatDate(date);
    });
  });

  document.querySelectorAll(".tr-time").forEach(function (input) {
    var parsed = parseTime(input.value);
    if (parsed) input.value = formatTime(parsed.h, parsed.m, parsed.s);
    input.addEventListener("focus", function () { openTime(input); });
    input.addEventListener("click", function (event) {
      event.stopPropagation();
      if (anchor !== input) openTime(input);
    });
    input.addEventListener("change", function () {
      var time = parseTime(input.value);
      if (time) input.value = formatTime(time.h, time.m, time.s);
    });
  });
})();
