(function () {
  var N = 4;
  var KEY = "ek-2048";
  var boardEl = document.getElementById("g-board");
  var scoreEl = document.getElementById("g-score");
  var bestEl = document.getElementById("g-best");
  var msgEl = document.getElementById("g-msg");
  var undoEl = document.getElementById("g-undo");

  var grid, score, best = 0, won, over, prev = null, fresh = [], merged = [];

  for (var i = 0; i < N * N; i++) boardEl.appendChild(document.createElement("div"));

  function sfx(name, arg) {
    if (window.ekSes) window.ekSes(name, arg);
  }

  function empty() {
    var g = [];
    for (var r = 0; r < N; r++) g.push([0, 0, 0, 0]);
    return g;
  }

  function spawn() {
    var cells = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (!grid[r][c]) cells.push([r, c]);
    if (!cells.length) return;
    var p = cells[Math.floor(Math.random() * cells.length)];
    grid[p[0]][p[1]] = Math.random() < 0.9 ? 2 : 4;
    fresh.push(p[0] * N + p[1]);
  }

  function start() {
    grid = empty();
    score = 0;
    won = false;
    over = false;
    prev = null;
    fresh = [];
    merged = [];
    spawn();
    spawn();
    msgEl.textContent = "";
    draw();
    store();
  }

  function store() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ g: grid, s: score, b: best, w: won }));
    } catch (e) {}
  }

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!d) return false;
      best = Number(d.b) || 0;
      if (!Array.isArray(d.g) || d.g.length !== N) return false;
      grid = d.g.map(function (row) { return row.map(function (v) { return Number(v) || 0; }); });
      score = Number(d.s) || 0;
      won = !!d.w;
      over = !canMove();
      return true;
    } catch (e) {
      return false;
    }
  }

  function draw() {
    var cells = boardEl.children;
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var v = grid[r][c];
        var el = cells[r * N + c];
        el.textContent = v || "";
        el.className = v ? (v > 2048 ? "vbig" : "v" + v) : "";
        if (fresh.indexOf(r * N + c) >= 0) el.classList.add("new");
        if (merged.indexOf(r * N + c) >= 0) el.classList.add("merged");
      }
    }
    scoreEl.textContent = score;
    if (score > best) best = score;
    bestEl.textContent = best;
    undoEl.disabled = !prev;
  }

  function line(dir, k) {
    var out = [];
    for (var j = 0; j < N; j++) {
      if (dir === "left") out.push([k, j]);
      if (dir === "right") out.push([k, N - 1 - j]);
      if (dir === "up") out.push([j, k]);
      if (dir === "down") out.push([N - 1 - j, k]);
    }
    return out;
  }

  function move(dir) {
    if (over) return;
    var before = JSON.stringify(grid);
    var snapshot = { g: JSON.parse(before), s: score, w: won };
    fresh = [];
    merged = [];
    var gained = 0;
    for (var k = 0; k < N; k++) {
      var cells = line(dir, k);
      var vals = cells.map(function (p) { return grid[p[0]][p[1]]; }).filter(Boolean);
      var res = [];
      for (var i = 0; i < vals.length; i++) {
        if (vals[i] === vals[i + 1]) {
          res.push(vals[i] * 2);
          gained += vals[i] * 2;
          merged.push(cells[res.length - 1][0] * N + cells[res.length - 1][1]);
          i++;
        } else {
          res.push(vals[i]);
        }
      }
      cells.forEach(function (p, j) { grid[p[0]][p[1]] = res[j] || 0; });
    }
    if (JSON.stringify(grid) === before) return;
    prev = snapshot;
    score += gained;
    var top = 0;
    merged.forEach(function (i) { top = Math.max(top, grid[Math.floor(i / N)][i % N]); });
    spawn();
    var sound = top ? "merge" : "move";
    if (!won && grid.some(function (row) { return row.indexOf(2048) >= 0; })) {
      won = true;
      sound = "win";
      msgEl.textContent = "2048! Kazandın. İstersen devam et.";
    } else {
      msgEl.textContent = "";
    }
    if (!canMove()) {
      over = true;
      sound = "lose";
      msgEl.textContent = "Hamle kalmadı. Skor: " + score;
    }
    sfx(sound, Math.log2(top || 2));
    draw();
    store();
  }

  function canMove() {
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var v = grid[r][c];
        if (!v) return true;
        if (c < N - 1 && grid[r][c + 1] === v) return true;
        if (r < N - 1 && grid[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  var KEYS = {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    a: "left", d: "right", w: "up", s: "down", A: "left", D: "right", W: "up", S: "down"
  };

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [data-ek]")) return;
    var dir = KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    move(dir);
  });

  var sx = 0, sy = 0, tracking = false;
  boardEl.addEventListener("pointerdown", function (e) {
    tracking = true;
    sx = e.clientX;
    sy = e.clientY;
  });
  window.addEventListener("pointerup", function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - sx;
    var dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
  });

  undoEl.addEventListener("click", function () {
    if (!prev) return;
    grid = prev.g;
    score = prev.s;
    won = prev.w;
    over = false;
    prev = null;
    fresh = [];
    merged = [];
    msgEl.textContent = "";
    draw();
    store();
  });

  document.getElementById("g-new").addEventListener("click", start);

  if (load()) {
    if (over) msgEl.textContent = "Hamle kalmadı. Skor: " + score;
    draw();
  } else {
    start();
  }
})();
