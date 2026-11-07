(function () {
  var KEY = "ek-refleks";
  var ROUNDS = 5;
  var pad = document.getElementById("r-pad");
  var countEl = document.getElementById("r-count");
  var lastEl = document.getElementById("r-last");
  var bestEl = document.getElementById("r-best");
  var listEl = document.getElementById("r-list");

  var best = 0;
  try { best = Number(JSON.parse(localStorage.getItem(KEY) || "{}").best) || 0; } catch (e) {}
  bestEl.textContent = best ? best + " ms" : "—";

  var state = "idle", times = [], timer = 0, shownAt = 0;

  function sfx(name) {
    if (window.ekSes) window.ekSes(name);
  }

  function show(cls, title, note) {
    pad.className = "rx" + (cls ? " " + cls : "");
    pad.textContent = title;
    if (note) {
      var s = document.createElement("small");
      s.textContent = note;
      pad.appendChild(s);
    }
  }

  function arm() {
    state = "wait";
    show("wait", "Bekle…", "Yeşil yanınca bas");
    sfx("wait");
    timer = setTimeout(function () {
      state = "go";
      show("go", "BAS!");
      shownAt = performance.now();
    }, 1200 + Math.random() * 2800);
  }

  function press() {
    if (state === "idle" || state === "result" || state === "done") {
      if (state === "done") {
        times = [];
        listEl.textContent = "";
      }
      countEl.textContent = times.length + " / " + ROUNDS;
      arm();
      return;
    }
    if (state === "wait") {
      clearTimeout(timer);
      state = "result";
      show("", "Erken bastın!", "Bu deneme sayılmadı. Tekrar için dokun.");
      sfx("early");
      return;
    }
    if (state === "go") {
      var ms = Math.round(performance.now() - shownAt);
      times.push(ms);
      lastEl.textContent = ms + " ms";
      countEl.textContent = times.length + " / " + ROUNDS;
      listEl.textContent = times.map(function (t) { return t + " ms"; }).join(" · ");
      if (times.length < ROUNDS) {
        sfx("tap");
        state = "result";
        show("", ms + " ms", "Sıradaki için dokun");
        return;
      }
      state = "done";
      var avg = Math.round(times.reduce(function (a, b) { return a + b; }, 0) / times.length);
      var record = !best || avg < best;
      if (record) {
        best = avg;
        bestEl.textContent = best + " ms";
        try { localStorage.setItem(KEY, JSON.stringify({ best: best })); } catch (e) {}
      }
      sfx(record ? "win" : "match");
      show("", "Ortalama " + avg + " ms", (record ? "Yeni rekor! " : "") + "Yeniden denemek için dokun");
    }
  }

  pad.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    press();
  });
  pad.addEventListener("click", function (e) {
    if (e.detail === 0) press();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== " " || e.repeat) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [data-ek]")) return;
    e.preventDefault();
    press();
  });
})();
