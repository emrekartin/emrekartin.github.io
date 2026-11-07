(function () {
  var N = 20;
  var KEY = "ek-yilan";
  var canvas = document.getElementById("s-canvas");
  var ctx = canvas.getContext("2d");
  var overEl = document.getElementById("s-over");
  var scoreEl = document.getElementById("s-score");
  var bestEl = document.getElementById("s-best");
  var speedEl = document.getElementById("s-speed");
  var wrapEl = document.getElementById("s-wrap");
  var C = canvas.width / N;
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  var best = Number(saved.best) || 0;
  if (["160", "115", "80"].indexOf(saved.speed) >= 0) speedEl.value = saved.speed;
  wrapEl.checked = !!saved.wrap;
  bestEl.textContent = best;

  var snake, dir, queue, food, score, timer = 0, state = "idle";

  function sfx(name) {
    if (window.ekSes) window.ekSes(name);
  }

  function store() {
    saved.best = best;
    saved.speed = speedEl.value;
    saved.wrap = wrapEl.checked;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }

  function reset() {
    snake = [[9, 10], [8, 10], [7, 10]];
    dir = "right";
    queue = [];
    score = 0;
    scoreEl.textContent = "0";
    placeFood();
    draw();
  }

  function placeFood() {
    var free = [];
    for (var x = 0; x < N; x++) {
      for (var y = 0; y < N; y++) {
        if (!snake.some(function (s) { return s[0] === x && s[1] === y; })) free.push([x, y]);
      }
    }
    food = free[Math.floor(Math.random() * free.length)];
  }

  function interval() {
    return Math.max(50, Number(speedEl.value) - Math.min(40, Math.floor(score / 5) * 4));
  }

  function play() {
    if (state === "over") reset();
    state = "run";
    wrapEl.disabled = true;
    overEl.hidden = true;
    clearTimeout(timer);
    tick();
  }

  function pause() {
    if (state !== "run") return;
    state = "pause";
    clearTimeout(timer);
    overEl.textContent = "Duraklatıldı · devam için dokun ya da Boşluk";
    overEl.hidden = false;
  }

  function end() {
    state = "over";
    wrapEl.disabled = false;
    clearTimeout(timer);
    var record = score > best;
    if (record) {
      best = score;
      bestEl.textContent = best;
    }
    store();
    sfx(record && score ? "win" : "lose");
    overEl.textContent = (record && score ? "Yeni rekor: " : "Skor: ") + score + " · tekrar için dokun";
    overEl.hidden = false;
  }

  function tick() {
    if (state !== "run") return;
    while (queue.length) {
      var next = queue.shift();
      var a = DIRS[next], b = DIRS[dir];
      if (a[0] + b[0] !== 0 || a[1] + b[1] !== 0) { dir = next; break; }
    }
    var d = DIRS[dir];
    var head = [snake[0][0] + d[0], snake[0][1] + d[1]];
    if (wrapEl.checked) {
      head[0] = (head[0] + N) % N;
      head[1] = (head[1] + N) % N;
    } else if (head[0] < 0 || head[0] >= N || head[1] < 0 || head[1] >= N) {
      return end();
    }
    var eat = head[0] === food[0] && head[1] === food[1];
    var body = eat ? snake : snake.slice(0, -1);
    if (body.some(function (s) { return s[0] === head[0] && s[1] === head[1]; })) return end();
    snake.unshift(head);
    if (eat) {
      score++;
      scoreEl.textContent = score;
      sfx("eat");
      if (snake.length === N * N) { draw(); return end(); }
      placeFood();
    } else {
      snake.pop();
    }
    draw();
    timer = setTimeout(tick, interval());
  }

  function draw() {
    ctx.fillStyle = "#1b2430";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (var x = 0; x < N; x++) {
      for (var y = 0; y < N; y++) {
        if ((x + y) % 2) ctx.fillRect(x * C, y * C, C, C);
      }
    }
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(food[0] * C + C / 2, food[1] * C + C / 2, C * 0.38, 0, Math.PI * 2);
    ctx.fill();
    snake.forEach(function (s, i) {
      ctx.fillStyle = i === 0 ? "#86efac" : i % 2 ? "#22c55e" : "#16a34a";
      roundRect(s[0] * C + 1.5, s[1] * C + 1.5, C - 3, C - 3, 6);
    });
    var h = snake[0], d = DIRS[dir];
    ctx.fillStyle = "#0f172a";
    [[-0.18, -0.18], [0.18, 0.18]].forEach(function (o) {
      var ex = h[0] * C + C / 2 + (d[1] ? o[0] : 0) * C + d[0] * C * 0.18;
      var ey = h[1] * C + C / 2 + (d[0] ? o[1] : 0) * C + d[1] * C * 0.18;
      ctx.beginPath();
      ctx.arc(ex, ey, C * 0.08, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  function turn(next) {
    if (queue.length < 3) queue.push(next);
    if (state !== "run") play();
  }

  var KEYS = {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    a: "left", d: "right", w: "up", s: "down", A: "left", D: "right", W: "up", S: "down"
  };

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input:not([type=checkbox]), textarea, select, [data-ek]")) return;
    if (e.key === " ") {
      e.preventDefault();
      if (state === "run") pause();
      else play();
      return;
    }
    var next = KEYS[e.key];
    if (!next) return;
    e.preventDefault();
    turn(next);
  });

  overEl.addEventListener("click", play);

  var sx = 0, sy = 0, tracking = false;
  canvas.addEventListener("pointerdown", function (e) {
    tracking = true;
    sx = e.clientX;
    sy = e.clientY;
  });
  window.addEventListener("pointerup", function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });

  document.querySelectorAll(".pad [data-dir]").forEach(function (b) {
    b.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      turn(b.dataset.dir);
    });
  });

  speedEl.addEventListener("change", store);
  wrapEl.addEventListener("change", store);
  document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); });

  reset();
})();
