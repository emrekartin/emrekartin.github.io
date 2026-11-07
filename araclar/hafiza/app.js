(function () {
  var KEY = "ek-hafiza";
  var SYMBOLS = ["🍎", "🍌", "🍇", "🍉", "🍓", "🍒", "🍍", "🥝", "🥥", "🍑", "🍋", "🥕", "🌽", "🍆", "🥑", "🍄", "🌶️", "🥨"];
  var COLS = { 12: 4, 16: 4, 24: 6, 36: 6 };
  var gridEl = document.getElementById("h-grid");
  var movesEl = document.getElementById("h-moves");
  var timeEl = document.getElementById("h-time");
  var bestEl = document.getElementById("h-best");
  var levelEl = document.getElementById("h-level");
  var msgEl = document.getElementById("h-msg");

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  saved.best = saved.best || {};
  if (COLS[saved.level]) levelEl.value = saved.level;

  var deck, open, moves, found, t0, timer, lock;

  function sfx(name) {
    if (window.ekSes) window.ekSes(name);
  }

  function store() {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function showBest() {
    var b = saved.best[levelEl.value];
    bestEl.textContent = b ? b.m + " hamle" : "—";
  }

  function start() {
    var n = Number(levelEl.value);
    saved.level = levelEl.value;
    store();
    clearInterval(timer);
    t0 = 0;
    moves = 0;
    found = 0;
    open = [];
    lock = false;
    movesEl.textContent = "0";
    timeEl.textContent = "0";
    msgEl.textContent = "";
    showBest();
    var picks = shuffle(SYMBOLS.slice()).slice(0, n / 2);
    deck = shuffle(picks.concat(picks));
    gridEl.style.gridTemplateColumns = "repeat(" + COLS[n] + ", 1fr)";
    gridEl.style.width = COLS[n] === 6 ? "min(100%, 34rem)" : "min(100%, 26rem)";
    gridEl.innerHTML = "";
    deck.forEach(function (sym, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.i = i;
      b.setAttribute("aria-label", "Kapalı kart");
      b.innerHTML = '<span class="face back"></span><span class="face front"></span>';
      b.querySelector(".front").textContent = sym;
      gridEl.appendChild(b);
    });
  }

  function finish() {
    clearInterval(timer);
    sfx("win");
    var secs = Math.max(1, Math.round((Date.now() - t0) / 1000));
    timeEl.textContent = secs;
    var b = saved.best[levelEl.value];
    if (!b || moves < b.m || (moves === b.m && secs < b.s)) {
      saved.best[levelEl.value] = { m: moves, s: secs };
      store();
      showBest();
      msgEl.textContent = "Bitti! " + moves + " hamle, " + secs + " saniye. Yeni rekor.";
    } else {
      msgEl.textContent = "Bitti! " + moves + " hamle, " + secs + " saniye.";
    }
  }

  gridEl.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || lock || b.classList.contains("up")) return;
    if (!t0) {
      t0 = Date.now();
      timer = setInterval(function () { timeEl.textContent = Math.floor((Date.now() - t0) / 1000); }, 250);
    }
    b.classList.add("up");
    b.setAttribute("aria-label", deck[b.dataset.i]);
    open.push(b);
    if (open.length < 2) { sfx("flip"); return; }
    moves++;
    movesEl.textContent = moves;
    var a = open[0], c = open[1];
    open = [];
    if (deck[a.dataset.i] === deck[c.dataset.i]) {
      a.classList.add("done");
      c.classList.add("done");
      found += 2;
      if (found === deck.length) finish();
      else sfx("match");
      return;
    }
    sfx("flip");
    setTimeout(function () { sfx("nomatch"); }, 450);
    lock = true;
    setTimeout(function () {
      a.classList.remove("up");
      c.classList.remove("up");
      a.setAttribute("aria-label", "Kapalı kart");
      c.setAttribute("aria-label", "Kapalı kart");
      lock = false;
    }, 800);
  });

  levelEl.addEventListener("change", start);
  document.getElementById("h-new").addEventListener("click", start);
  start();
})();
