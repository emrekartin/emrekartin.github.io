(function () {
  var KEY = "ek-flappy";
  var canvas = document.getElementById("f-canvas");
  var ctx = canvas.getContext("2d");
  var overEl = document.getElementById("f-over");
  var scoreEl = document.getElementById("f-score");
  var bestEl = document.getElementById("f-best");
  var W = canvas.width, H = canvas.height, GROUND = H - 60;
  var GAP = 150, PIPE_W = 62, SPACING = 210, SPEED = 140;
  var GRAVITY = 1500, FLAP = -430;

  var best = 0;
  try { best = Number(localStorage.getItem(KEY)) || 0; } catch (e) {}
  bestEl.textContent = best;

  var bird, pipes, score, state = "ready", last = 0, scroll = 0, raf = 0;

  function sfx(name) {
    if (window.ekSes) window.ekSes(name);
  }

  function reset() {
    bird = { x: 96, y: H * 0.42, vy: 0 };
    pipes = [];
    score = 0;
    scroll = 0;
    scoreEl.textContent = "0";
    for (var i = 0; i < 3; i++) addPipe(W + 80 + i * SPACING);
  }

  function addPipe(x) {
    var top = 70 + Math.random() * (GROUND - GAP - 140);
    pipes.push({ x: x, top: top, passed: false });
  }

  function flap() {
    if (state === "over") {
      reset();
      state = "ready";
    }
    if (state === "ready" || state === "pause") {
      state = "run";
      overEl.hidden = true;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
    bird.vy = FLAP;
    sfx("tap");
  }

  function pause() {
    if (state !== "run") return;
    state = "pause";
    overEl.textContent = "Duraklatıldı · devam için dokun";
    overEl.hidden = false;
  }

  function end() {
    state = "over";
    sfx("lose");
    var record = score > best;
    if (record) {
      best = score;
      bestEl.textContent = best;
      try { localStorage.setItem(KEY, String(best)); } catch (e) {}
    }
    setTimeout(function () {
      if (state !== "over") return;
      overEl.textContent = (record && score ? "Yeni rekor: " : "Skor: ") + score + " · tekrar için dokun";
      overEl.hidden = false;
    }, 350);
  }

  function hit() {
    if (bird.y + 14 >= GROUND || bird.y - 14 <= 0) return true;
    return pipes.some(function (p) {
      if (bird.x + 13 < p.x || bird.x - 13 > p.x + PIPE_W) return false;
      return bird.y - 11 < p.top || bird.y + 11 > p.top + GAP;
    });
  }

  function step(dt) {
    bird.vy = Math.min(bird.vy + GRAVITY * dt, 700);
    bird.y += bird.vy * dt;
    if (state !== "run") return;
    var speed = SPEED + Math.min(score, 40) * 1.5;
    scroll += speed * dt;
    pipes.forEach(function (p) {
      p.x -= speed * dt;
      if (!p.passed && p.x + PIPE_W < bird.x - 13) {
        p.passed = true;
        score++;
        scoreEl.textContent = score;
        sfx("eat");
      }
    });
    if (pipes[0].x + PIPE_W < -10) {
      pipes.shift();
      addPipe(pipes[pipes.length - 1].x + SPACING);
    }
    if (hit()) end();
  }

  function loop(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (state === "run") step(dt);
    else if (state === "over" && bird.y < GROUND - 14) {
      bird.vy = Math.min(bird.vy + GRAVITY * dt, 700);
      bird.y = Math.min(GROUND - 14, bird.y + bird.vy * dt);
    }
    draw();
    if (state === "run" || (state === "over" && bird.y < GROUND - 14)) raf = requestAnimationFrame(loop);
  }

  function draw() {
    var sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, "#5ec4e8");
    sky.addColorStop(1, "#b8ecf7");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (var i = 0; i < 4; i++) {
      var cx = ((i * 140 - scroll * 0.2) % (W + 160) + W + 160) % (W + 160) - 80;
      var cy = 70 + (i % 2) * 60;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy - 8, 24, 0, Math.PI * 2);
      ctx.arc(cx + 46, cy, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    pipes.forEach(function (p) {
      drawPipe(p.x, 0, p.top, true);
      drawPipe(p.x, p.top + GAP, GROUND - p.top - GAP, false);
    });

    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = "#73bf2e";
    ctx.fillRect(0, GROUND, W, 12);
    ctx.fillStyle = "#5a9e22";
    for (var x = -(scroll % 24); x < W; x += 24) ctx.fillRect(x, GROUND + 12, 12, 4);

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.max(-0.45, Math.min(1.2, bird.vy / 600)));
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    var wing = state === "run" && bird.vy < 0 ? -6 : 2;
    ctx.ellipse(-5, wing, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(7, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(9, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(13, 1);
    ctx.lineTo(23, 4);
    ctx.lineTo(13, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (state === "run" || state === "over") {
      ctx.font = "800 44px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.strokeText(score, W / 2, 70);
      ctx.fillStyle = "#fff";
      ctx.fillText(score, W / 2, 70);
    }
  }

  function drawPipe(x, y, h, top) {
    if (h <= 0) return;
    var g = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
    g.addColorStop(0, "#4ea82a");
    g.addColorStop(0.45, "#8fe05b");
    g.addColorStop(1, "#3d8a1f");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, PIPE_W, h);
    ctx.strokeStyle = "#2f6b16";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, PIPE_W, h);
    var lipY = top ? y + h - 22 : y;
    ctx.fillRect(x - 5, lipY, PIPE_W + 10, 22);
    ctx.strokeRect(x - 5, lipY, PIPE_W + 10, 22);
  }

  canvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    flap();
  });
  overEl.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    flap();
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input, textarea, select, [data-ek]")) return;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      e.preventDefault();
      if (!e.repeat) flap();
    } else if (e.key === "p" || e.key === "P") {
      pause();
    }
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); });

  reset();
  draw();
})();
