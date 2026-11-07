(function () {
  var KEY = "ek-kosu";
  var canvas = document.getElementById("k-canvas");
  var ctx = canvas.getContext("2d");
  var overEl = document.getElementById("k-over");
  var scoreEl = document.getElementById("k-score");
  var coinsEl = document.getElementById("k-coins");
  var bestEl = document.getElementById("k-best");
  var W = canvas.width, H = canvas.height;
  var HORIZON = 150, BOTTOM = H - 30, ROAD = 300, FAR = 70;
  var JUMP_V = 9.5, GRAV = 26, SLIDE_T = 0.65;

  var best = 0;
  try { best = Number(localStorage.getItem(KEY)) || 0; } catch (e) {}
  bestEl.textContent = best;

  var P, items, speed, dist, coins, nextRow, state = "ready", last = 0, raf = 0, t = 0;

  function sfx(name) {
    if (window.ekSes) window.ekSes(name);
  }

  function reset() {
    P = { lane: 1, x: 1, y: 0, vy: 0, slide: 0 };
    items = [];
    speed = 16;
    dist = 0;
    coins = 0;
    nextRow = 30;
    scoreEl.textContent = "0";
    coinsEl.textContent = "0";
  }

  function proj(z) {
    return 1 / (1 + z * 0.09);
  }

  function screen(lane, z, h) {
    var p = proj(z);
    var y = HORIZON + (BOTTOM - HORIZON) * p;
    var laneW = ROAD / 3;
    return { x: W / 2 + (lane - 1) * laneW * p, y: y - (h || 0) * 46 * p, p: p };
  }

  function spawnRow(z) {
    var pattern = [];
    var kinds = ["train", "low", "high", "coin", "none"];
    var blocked = 0;
    for (var lane = 0; lane < 3; lane++) {
      var k = kinds[Math.floor(Math.random() * kinds.length)];
      if (k === "train") {
        if (blocked >= 1) k = "coin";
        else blocked++;
      }
      pattern.push(k);
    }
    pattern.forEach(function (k, lane) {
      if (k === "none") return;
      if (k === "coin") {
        for (var i = 0; i < 4; i++) items.push({ kind: "coin", lane: lane, z: z + i * 2.2, len: 0.3 });
        return;
      }
      items.push({ kind: k, lane: lane, z: z, len: k === "train" ? 9 : 0.6 });
      if (k === "low" && Math.random() < 0.5) items.push({ kind: "coin", lane: lane, z: z, len: 0.3, high: true });
    });
  }

  function act(a) {
    if (state === "over") {
      reset();
      state = "ready";
    }
    if (state !== "run") {
      state = "run";
      overEl.hidden = true;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
    if (a === "left" && P.lane > 0) { P.lane--; sfx("turn"); }
    if (a === "right" && P.lane < 2) { P.lane++; sfx("turn"); }
    if (a === "up" && P.y <= 0.01) { P.vy = JUMP_V; P.slide = 0; sfx("tap"); }
    if (a === "down") {
      if (P.y > 0.01) P.vy = -JUMP_V * 1.4;
      P.slide = SLIDE_T;
    }
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
    var score = Math.floor(dist) + coins * 10;
    var record = score > best;
    if (record) {
      best = score;
      bestEl.textContent = best;
      try { localStorage.setItem(KEY, String(best)); } catch (e) {}
    }
    overEl.textContent = (record ? "Yeni rekor: " : "Skor: ") + score + " · tekrar için dokun";
    overEl.hidden = false;
  }

  function step(dt) {
    t += dt;
    speed = Math.min(34, 16 + dist / 120);
    var dz = speed * dt;
    dist += dz;
    P.x += (P.lane - P.x) * Math.min(1, dt * 14);
    if (P.y > 0 || P.vy > 0) {
      P.vy -= GRAV * dt;
      P.y = Math.max(0, P.y + P.vy * dt);
      if (P.y === 0) P.vy = 0;
    }
    if (P.slide > 0) P.slide = Math.max(0, P.slide - dt);

    nextRow -= dz;
    if (nextRow <= FAR) {
      spawnRow(nextRow);
      nextRow += 13 + Math.random() * 6 - Math.min(4, dist / 600);
    }

    var lanePos = Math.round(P.x);
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.z -= dz;
      if (it.z + it.len < -2) { items.splice(i, 1); continue; }
      if (it.lane !== lanePos || it.z > 0.5 || it.z + it.len < -0.3) continue;
      if (it.kind === "coin") {
        if (it.high ? P.y > 0.8 : P.y < 1.3) {
          coins++;
          coinsEl.textContent = coins;
          items.splice(i, 1);
          sfx("eat");
        }
        continue;
      }
      if (it.kind === "low" && P.y > 0.55) continue;
      if (it.kind === "high" && P.slide > 0) continue;
      if (it.kind === "train" && Math.abs(P.x - it.lane) > 0.45) continue;
      draw();
      return end();
    }
    scoreEl.textContent = Math.floor(dist) + coins * 10;
  }

  function loop(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (state !== "run") return;
    step(dt);
    if (state === "run") {
      draw();
      raf = requestAnimationFrame(loop);
    }
  }

  function quad(a, b, c, d, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    var sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
    sky.addColorStop(0, "#7cc4f5");
    sky.addColorStop(1, "#d8f0ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, HORIZON);

    ctx.fillStyle = "#94a3b8";
    for (var b = 0; b < 9; b++) {
      var bw = 34 + (b * 17) % 22, bh = 30 + (b * 37) % 60;
      ctx.fillRect(b * 42 - 8, HORIZON - bh, bw, bh);
    }
    ctx.fillStyle = "#6b8e4e";
    ctx.fillRect(0, HORIZON, W, H - HORIZON);

    var l0 = screen(-0.5, FAR), r0 = screen(2.5, FAR), l1 = screen(-0.5, -1.5), r1 = screen(2.5, -1.5);
    quad(l0, r0, r1, l1, "#8a7a6a");
    for (var lane = 0; lane < 3; lane++) {
      var a = screen(lane - 0.32, FAR), bb = screen(lane + 0.32, FAR), c = screen(lane + 0.32, -1.5), d = screen(lane - 0.32, -1.5);
      quad(a, bb, c, d, "#6b5b4b");
    }
    var off = dist % 3;
    ctx.fillStyle = "#4a3b2e";
    for (var z = FAR - off; z > -1.5; z -= 3) {
      var s0 = screen(-0.5, z), s1 = screen(2.5, z);
      ctx.fillRect(s0.x, s0.y, s1.x - s0.x, Math.max(1, 5 * s0.p));
    }
    ctx.strokeStyle = "#c0c7d0";
    for (var rl = 0; rl < 3; rl++) {
      [-0.2, 0.2].forEach(function (o) {
        var f = screen(rl + o, FAR), n = screen(rl + o, -1.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      });
    }

    var drawn = false;
    var sorted = items.slice().sort(function (p, q) { return q.z - p.z; });
    sorted.forEach(function (it) {
      if (!drawn && it.z < 0) { drawPlayer(); drawn = true; }
      drawItem(it);
    });
    if (!drawn) drawPlayer();
  }

  function drawItem(it) {
    var lane = it.lane;
    if (it.kind === "coin") {
      var s = screen(lane, it.z, it.high ? 1.6 : 0.5);
      var r = 9 * s.p * 1.4;
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, r * Math.abs(Math.cos(t * 4 + it.z)) + 1, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a16207";
      ctx.lineWidth = Math.max(1, 2 * s.p);
      ctx.stroke();
      return;
    }
    var near = Math.max(it.z, -1.5), far = it.z + it.len;
    var hgt = it.kind === "train" ? 3.2 : it.kind === "low" ? 0.7 : 2.4;
    var half = it.kind === "train" ? 0.42 : 0.4;
    var fl = screen(lane - half, near), fr = screen(lane + half, near);
    var ftl = screen(lane - half, near, hgt), ftr = screen(lane + half, near, hgt);
    var bl = screen(lane - half, far, hgt), br = screen(lane + half, far, hgt);
    if (it.kind === "train") {
      quad(ftl, ftr, br, bl, "#7f1d1d");
      var sideL = screen(lane - half, far), sideR = screen(lane + half, far);
      if (lane < 1) quad(fr, ftr, br, sideR, "#991b1b");
      if (lane > 1) quad(fl, ftl, bl, sideL, "#991b1b");
      quad(fl, fr, ftr, ftl, "#dc2626");
      ctx.fillStyle = "#bfdbfe";
      var wx = ftl.x + (ftr.x - ftl.x) * 0.15, ww = (ftr.x - ftl.x) * 0.7;
      ctx.fillRect(wx, ftl.y + (fl.y - ftl.y) * 0.15, ww, (fl.y - ftl.y) * 0.3);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(ftl.x + (ftr.x - ftl.x) * 0.12, ftl.y + (fl.y - ftl.y) * 0.75, (ftr.x - ftl.x) * 0.16, (fl.y - ftl.y) * 0.1);
      ctx.fillRect(ftl.x + (ftr.x - ftl.x) * 0.72, ftl.y + (fl.y - ftl.y) * 0.75, (ftr.x - ftl.x) * 0.16, (fl.y - ftl.y) * 0.1);
      return;
    }
    if (it.kind === "low") {
      quad(fl, fr, ftr, ftl, "#f8fafc");
      ctx.fillStyle = "#ef4444";
      var sw = (fr.x - fl.x) / 5;
      for (var i = 0; i < 5; i += 2) ctx.fillRect(fl.x + i * sw, ftl.y, sw, fl.y - ftl.y);
      return;
    }
    var barTop = screen(lane, near, hgt), barLow = screen(lane, near, 1.35);
    ctx.fillStyle = "#475569";
    ctx.fillRect(fl.x, barTop.y, 4 * fl.p, fl.y - barTop.y);
    ctx.fillRect(fr.x - 4 * fl.p, barTop.y, 4 * fl.p, fl.y - barTop.y);
    quad({ x: fl.x, y: barLow.y }, { x: fr.x, y: barLow.y }, { x: fr.x, y: barTop.y }, { x: fl.x, y: barTop.y }, "#f59e0b");
    ctx.fillStyle = "#111827";
    var stripes = 4, stw = (fr.x - fl.x) / (stripes * 2);
    for (var k = 0; k < stripes; k++) ctx.fillRect(fl.x + (k * 2 + 0.5) * stw, barTop.y, stw * 0.6, barLow.y - barTop.y);
  }

  function drawPlayer() {
    var base = screen(P.x, 0);
    var y = base.y - P.y * 46;
    var sliding = P.slide > 0 && P.y < 0.05;
    var bodyH = sliding ? 26 : 58;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    var run = state === "run" && P.y === 0 && !sliding ? Math.sin(t * 18) * 6 : 0;
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    if (!sliding) {
      ctx.beginPath();
      ctx.moveTo(base.x - 5, y - 22);
      ctx.lineTo(base.x - 6 + run, y - 2);
      ctx.moveTo(base.x + 5, y - 22);
      ctx.lineTo(base.x + 6 - run, y - 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.roundRect(base.x - 13, y - bodyH, 26, sliding ? 22 : 34, 8);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(base.x - 11, y - bodyH + 4, 22, 5);
    ctx.fillStyle = "#f1c27d";
    ctx.beginPath();
    ctx.arc(sliding ? base.x + 16 : base.x, sliding ? y - 14 : y - bodyH - 9, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(sliding ? base.x + 16 : base.x, sliding ? y - 17 : y - bodyH - 12, 11, Math.PI, 0);
    ctx.fill();
  }

  var KEYS = {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", " ": "up",
    a: "left", d: "right", w: "up", s: "down", A: "left", D: "right", W: "up", S: "down"
  };

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [data-ek]")) return;
    if (e.key === "p" || e.key === "P") return pause();
    var a = KEYS[e.key];
    if (!a) return;
    e.preventDefault();
    if (!e.repeat) act(a);
  });

  var sx = 0, sy = 0, tracking = false;
  function down(e) {
    tracking = true;
    sx = e.clientX;
    sy = e.clientY;
  }
  canvas.addEventListener("pointerdown", down);
  overEl.addEventListener("pointerdown", down);
  window.addEventListener("pointerup", function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
      if (state !== "run") act("none");
      return;
    }
    act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });
  canvas.style.touchAction = "none";

  document.querySelectorAll(".pad [data-act]").forEach(function (b) {
    b.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      act(b.dataset.act);
    });
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); });

  reset();
  draw();
})();
