(function () {
  var LEVELS = {
    easy: { rows: 9, cols: 9, mines: 10 },
    mid: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
  };
  var KEY = "ek-mayin";
  var gridEl = document.getElementById("m-grid");
  var leftEl = document.getElementById("m-left");
  var timeEl = document.getElementById("m-time");
  var bestEl = document.getElementById("m-best");
  var levelEl = document.getElementById("m-level");
  var flagEl = document.getElementById("m-flag");
  var msgEl = document.getElementById("m-msg");

  var L, cells, buttons, started, done, opened, flags, t0, timer, flagMode = false;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  if (LEVELS[saved.level]) levelEl.value = saved.level;
  saved.best = saved.best || {};

  function sfx(name) {
    if (window.ekSes) window.ekSes(name);
  }

  function store() {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }

  function neighbors(i) {
    var r = Math.floor(i / L.cols), c = i % L.cols, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < L.rows && nc >= 0 && nc < L.cols) out.push(nr * L.cols + nc);
      }
    }
    return out;
  }

  function start() {
    L = LEVELS[levelEl.value];
    saved.level = levelEl.value;
    store();
    clearInterval(timer);
    started = false;
    done = false;
    opened = 0;
    flags = 0;
    cells = [];
    buttons = [];
    gridEl.innerHTML = "";
    gridEl.style.gridTemplateColumns = "repeat(" + L.cols + ", auto)";
    for (var i = 0; i < L.rows * L.cols; i++) {
      cells.push({ mine: false, n: 0, open: false, flag: false });
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.i = i;
      b.setAttribute("aria-label", "Kapalı kare");
      gridEl.appendChild(b);
      buttons.push(b);
    }
    leftEl.textContent = L.mines;
    timeEl.textContent = "0";
    var best = saved.best[levelEl.value];
    bestEl.textContent = best ? best + " sn" : "—";
    msgEl.textContent = "";
  }

  function plant(safe) {
    var banned = neighbors(safe).concat(safe);
    var pool = [];
    for (var i = 0; i < cells.length; i++) if (banned.indexOf(i) < 0) pool.push(i);
    for (var m = 0; m < L.mines; m++) {
      var k = m + Math.floor(Math.random() * (pool.length - m));
      var tmp = pool[m]; pool[m] = pool[k]; pool[k] = tmp;
      cells[pool[m]].mine = true;
    }
    cells.forEach(function (cell, idx) {
      cell.n = neighbors(idx).filter(function (j) { return cells[j].mine; }).length;
    });
    started = true;
    t0 = Date.now();
    timer = setInterval(function () {
      timeEl.textContent = Math.floor((Date.now() - t0) / 1000);
    }, 250);
  }

  function paint(i) {
    var cell = cells[i], b = buttons[i];
    b.className = "";
    if (cell.open) {
      b.classList.add("open");
      if (cell.mine) {
        b.textContent = "💣";
      } else {
        b.textContent = cell.n || "";
        if (cell.n) b.classList.add("n" + cell.n);
      }
      b.setAttribute("aria-label", cell.mine ? "Mayın" : cell.n ? cell.n + " komşu mayın" : "Boş");
    } else {
      b.textContent = cell.flag ? "🚩" : "";
      b.setAttribute("aria-label", cell.flag ? "Bayrak" : "Kapalı kare");
    }
  }

  function reveal(i) {
    var stack = [i];
    while (stack.length) {
      var j = stack.pop();
      var cell = cells[j];
      if (cell.open || cell.flag) continue;
      cell.open = true;
      opened++;
      paint(j);
      if (cell.mine) return lose(j);
      if (!cell.n) neighbors(j).forEach(function (k) { if (!cells[k].open) stack.push(k); });
    }
    if (opened === cells.length - L.mines) win();
  }

  function lose(i) {
    done = true;
    clearInterval(timer);
    buttons[i].classList.add("boom");
    cells.forEach(function (cell, j) {
      if (cell.mine && !cell.flag && j !== i) { cell.open = true; paint(j); }
      if (!cell.mine && cell.flag) buttons[j].textContent = "❌";
    });
    buttons[i].classList.add("boom");
    msgEl.textContent = "Mayına bastın. Yeni oyun?";
    sfx("boom");
  }

  function win() {
    done = true;
    clearInterval(timer);
    var secs = Math.max(1, Math.round((Date.now() - t0) / 1000));
    timeEl.textContent = secs;
    cells.forEach(function (cell, j) { if (cell.mine && !cell.flag) { cell.flag = true; paint(j); } });
    leftEl.textContent = "0";
    sfx("win");
    var best = saved.best[levelEl.value];
    if (!best || secs < best) {
      saved.best[levelEl.value] = secs;
      store();
      bestEl.textContent = secs + " sn";
      msgEl.textContent = "Kazandın! " + secs + " saniye, yeni rekor.";
    } else {
      msgEl.textContent = "Kazandın! " + secs + " saniye.";
    }
  }

  function toggleFlag(i) {
    var cell = cells[i];
    if (cell.open || done) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    leftEl.textContent = L.mines - flags;
    paint(i);
    sfx(cell.flag ? "flag" : "unflag");
  }

  function chord(i) {
    var around = neighbors(i);
    var flagged = around.filter(function (j) { return cells[j].flag; }).length;
    if (flagged !== cells[i].n) return;
    around.forEach(function (j) { if (!done && !cells[j].open && !cells[j].flag) reveal(j); });
  }

  gridEl.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || done) return;
    var i = Number(b.dataset.i);
    if (flagMode && !cells[i].open) { toggleFlag(i); return; }
    if (!started) plant(i);
    var before = opened;
    if (cells[i].open) {
      if (cells[i].n) chord(i);
    } else {
      reveal(i);
    }
    if (!done && opened > before) sfx("open");
  });

  gridEl.addEventListener("contextmenu", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    toggleFlag(Number(b.dataset.i));
  });

  flagEl.addEventListener("click", function () {
    flagMode = !flagMode;
    flagEl.setAttribute("aria-pressed", flagMode ? "true" : "false");
    flagEl.classList.toggle("toggle-on", flagMode);
  });

  levelEl.addEventListener("change", start);
  document.getElementById("m-new").addEventListener("click", start);
  start();
})();
