(function () {
  var KEY = "ek-penalti";
  var zonesEl = document.getElementById("p-zones");
  var keeperEl = document.getElementById("p-keeper");
  var ballEl = document.getElementById("p-ball");
  var turnEl = document.getElementById("p-turn");
  var msgEl = document.getElementById("p-msg");
  var youEl = document.getElementById("p-you");
  var cpuEl = document.getElementById("p-cpu");
  var youDots = document.getElementById("p-you-dots");
  var cpuDots = document.getElementById("p-cpu-dots");
  var recordEl = document.getElementById("p-record");

  var COL_X = [26.7, 50, 73.3];
  var ROW_Y = [25.5, 48.5];
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  saved.w = saved.w || 0;
  saved.p = saved.p || 0;
  saved.h = Array.isArray(saved.h) && saved.h.length === 6 ? saved.h : [0, 0, 0, 0, 0, 0];

  var you, cpu, turn, busy, over;

  function store() {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }

  function col(z) { return z % 3; }
  function row(z) { return Math.floor(z / 3); }

  function weighted(weights) {
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return i;
    }
    return weights.length - 1;
  }

  function saves(shot, dive) {
    if (col(shot) !== col(dive)) return false;
    return row(shot) === row(dive) || col(shot) === 1;
  }

  function placeKeeper(z) {
    if (z === null) {
      keeperEl.style.left = "50%";
      keeperEl.style.top = "60%";
      keeperEl.style.transform = "translate(-50%, -100%)";
      return;
    }
    var c = col(z), high = row(z) === 0;
    var side = c === 0 ? -1 : c === 2 ? 1 : 0;
    keeperEl.style.left = (side ? COL_X[c] + side * -2 : 50) + "%";
    keeperEl.style.top = (high ? 50 : side ? 64 : 60) + "%";
    var deg = side * (high ? 55 : 80);
    keeperEl.style.transform = "translate(-50%, -100%) rotate(" + deg + "deg)";
  }

  function placeBall(x, y, small) {
    ballEl.style.left = x + "%";
    ballEl.style.top = y + "%";
    ballEl.style.width = small ? "4%" : "6%";
  }

  function goals(list) {
    return list.filter(Boolean).length;
  }

  function dots(el, list) {
    var n = Math.max(5, list.length);
    el.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var d = document.createElement("i");
      if (i < list.length) d.className = list[i] ? "goal" : "miss";
      el.appendChild(d);
    }
  }

  function decided() {
    var yg = goals(you), cg = goals(cpu);
    if (you.length <= 5 && cpu.length <= 5) {
      var yl = 5 - you.length, cl = 5 - cpu.length;
      if (yg + yl < cg || cg + cl < yg) return true;
      if (you.length === 5 && cpu.length === 5) return yg !== cg;
      return false;
    }
    return you.length === cpu.length && yg !== cg;
  }

  function render() {
    youEl.textContent = goals(you);
    cpuEl.textContent = goals(cpu);
    dots(youDots, you);
    dots(cpuDots, cpu);
    recordEl.textContent = saved.w + " / " + saved.p;
    zonesEl.querySelectorAll("button").forEach(function (b) { b.disabled = busy || over; });
    if (over) {
      turnEl.textContent = "";
    } else if (you.length >= 5 && cpu.length >= 5 && you.length === cpu.length) {
      turnEl.textContent = "Seri penaltılar · " + (turn === "shoot" ? "şut sende" : "kaleci sensin");
    } else {
      turnEl.textContent = turn === "shoot" ? "Şut sırası sende: bir köşe seç" : "Kaleci sensin: atlayacağın yeri seç";
    }
  }

  function start() {
    you = [];
    cpu = [];
    turn = "shoot";
    busy = false;
    over = false;
    msgEl.textContent = "";
    placeKeeper(null);
    placeBall(50, 86, false);
    render();
  }

  function kick(zone) {
    busy = true;
    render();
    var shooting = turn === "shoot";
    var shot, dive;
    if (shooting) {
      shot = zone;
      dive = weighted(saved.h.map(function (n, i) { return n + (col(i) === 1 ? 1 : 2); }));
      saved.h[shot]++;
    } else {
      dive = zone;
      shot = weighted([2, 1, 2, 3, 1, 3]);
    }
    var miss = row(shot) === 0 && col(shot) !== 1 && Math.random() < 0.12;
    var saved1 = !miss && saves(shot, dive);
    var bx = COL_X[col(shot)], by = ROW_Y[row(shot)];
    if (miss) {
      if (Math.random() < 0.5) by = 6;
      else bx = col(shot) === 0 ? 10 : 90;
    } else if (saved1) {
      by = Math.min(by + 6, 52);
    }
    placeKeeper(dive);
    placeBall(bx, by, true);
    setTimeout(function () {
      var scored = !miss && !saved1;
      (shooting ? you : cpu).push(scored);
      var text = miss ? (by === 6 ? "Üstten auta!" : "Direğin yanından auta!") : saved1 ? "Kaleci kurtardı!" : "Gol!";
      msgEl.textContent = (shooting ? "Sen: " : "Rakip: ") + text;
      if (decided()) {
        over = true;
        var won = goals(you) > goals(cpu);
        saved.p++;
        if (won) saved.w++;
        msgEl.textContent += " · " + (won ? "Seriyi kazandın " : "Seriyi kaybettin ") + goals(you) + "-" + goals(cpu) + ".";
      }
      store();
      render();
      setTimeout(function () {
        if (over) return;
        placeKeeper(null);
        placeBall(50, 86, false);
        turn = turn === "shoot" ? "save" : "shoot";
        busy = false;
        render();
      }, 1000);
    }, 550);
  }

  zonesEl.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || busy || over) return;
    kick(Number(b.dataset.z));
  });

  document.getElementById("p-new").addEventListener("click", start);
  start();
})();
