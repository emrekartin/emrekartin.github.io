(function () {
  var boardEl = document.getElementById("d-board");
  var statusEl = document.getElementById("d-status");
  var modeEl = document.getElementById("d-mode");
  var levelEl = document.getElementById("d-level");
  var sideEl = document.getElementById("d-side");
  var undoEl = document.getElementById("d-undo");
  var KEY = "ek-dama";
  var DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function other(c) { return c === "w" ? "b" : "w"; }
  function on(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function isKing(p) { return p === "W" || p === "B"; }

  // Büyük harf dama, küçük harf taş: w/W beyaz, b/B siyah.
  function side(p) { return p ? (p.toLowerCase() === "w" ? "w" : "b") : ""; }

  function initial() {
    var b = [];
    for (var i = 0; i < 64; i++) {
      var r = i >> 3;
      b.push(r === 1 || r === 2 ? "b" : r === 5 || r === 6 ? "w" : "");
    }
    return { b: b, turn: "w" };
  }

  function forward(s) { return s === "w" ? -1 : 1; }

  function manDirs(s) {
    return [[forward(s), 0], [0, -1], [0, 1]];
  }

  function captures(b, sq, piece, back, list, path, caps) {
    var me = side(piece), r = sq >> 3, c = sq & 7, found = false;
    var dirs = isKing(piece) ? DIRS : manDirs(me);
    dirs.forEach(function (d) {
      if (back && d[0] === -back[0] && d[1] === -back[1]) return;
      if (isKing(piece)) {
        var rr = r + d[0], cc = c + d[1];
        while (on(rr, cc) && !b[rr * 8 + cc]) { rr += d[0]; cc += d[1]; }
        if (!on(rr, cc) || side(b[rr * 8 + cc]) !== other(me)) return;
        var cap = rr * 8 + cc;
        rr += d[0]; cc += d[1];
        while (on(rr, cc) && !b[rr * 8 + cc]) {
          var land = rr * 8 + cc;
          found = true;
          step(land, cap, d);
          rr += d[0]; cc += d[1];
        }
      } else {
        var mr = r + d[0], mc = c + d[1], lr = r + 2 * d[0], lc = c + 2 * d[1];
        if (!on(lr, lc)) return;
        if (side(b[mr * 8 + mc]) !== other(me) || b[lr * 8 + lc]) return;
        found = true;
        step(lr * 8 + lc, mr * 8 + mc, d);
      }
    });

    function step(land, cap, d) {
      var nb = b.slice();
      nb[land] = piece;
      nb[sq] = "";
      nb[cap] = "";
      captures(nb, land, piece, isKing(piece) ? d : null, list, path.concat(land), caps.concat(cap));
    }

    if (!found && caps.length) list.push({ from: path[0], to: sq, path: path.slice(1), caps: caps });
  }

  function legal(s) {
    var b = s.b, me = s.turn, caps = [], quiet = [];
    for (var sq = 0; sq < 64; sq++) {
      var p = b[sq];
      if (side(p) !== me) continue;
      captures(b, sq, p, null, caps, [sq], []);
      if (caps.length) continue;
      var r = sq >> 3, c = sq & 7;
      var dirs = isKing(p) ? DIRS : manDirs(me);
      dirs.forEach(function (d) {
        var rr = r + d[0], cc = c + d[1];
        while (on(rr, cc) && !b[rr * 8 + cc]) {
          quiet.push({ from: sq, to: rr * 8 + cc, path: [rr * 8 + cc], caps: [] });
          if (!isKing(p)) break;
          rr += d[0]; cc += d[1];
        }
      });
    }
    if (!caps.length) return quiet;
    var most = Math.max.apply(null, caps.map(function (m) { return m.caps.length; }));
    return caps.filter(function (m) { return m.caps.length === most; });
  }

  function make(s, m) {
    var b = s.b.slice();
    var p = b[m.from];
    b[m.from] = "";
    m.caps.forEach(function (c) { b[c] = ""; });
    var lastRow = s.turn === "w" ? 0 : 7;
    if (!isKing(p) && m.to >> 3 === lastRow) p = p.toUpperCase();
    b[m.to] = p;
    return { b: b, turn: other(s.turn) };
  }

  function count(b, me) {
    var men = 0, kings = 0;
    b.forEach(function (p) {
      if (side(p) !== me) return;
      if (isKing(p)) kings++;
      else men++;
    });
    return { men: men, kings: kings, all: men + kings };
  }

  // ---- yapay zekâ ----
  function evaluate(s) {
    var score = 0;
    for (var sq = 0; sq < 64; sq++) {
      var p = s.b[sq];
      if (!p) continue;
      var me = side(p), r = sq >> 3, c = sq & 7;
      var adv = me === "w" ? 7 - r : r;
      var v = isKing(p) ? 320 : 100 + adv * adv * 1.6 + (c > 1 && c < 6 ? 4 : 0);
      score += me === "w" ? v : -v;
    }
    return s.turn === "w" ? score : -score;
  }

  function search(s, depth, alpha, beta, ply) {
    var moves = legal(s);
    if (!moves.length) return -100000 + ply;
    if (depth <= 0 && !moves[0].caps.length) return evaluate(s);
    if (depth <= -4) return evaluate(s);
    for (var i = 0; i < moves.length; i++) {
      var sc = -search(make(s, moves[i]), depth - 1, -beta, -alpha, ply + 1);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  function bestMove(s, level) {
    var depth = level === 3 ? 5 : level === 2 ? 3 : 1;
    var noise = level === 1 ? 90 : level === 2 ? 12 : 0;
    var best = null, bestScore = -Infinity;
    legal(s).forEach(function (m) {
      var sc = -search(make(s, m), depth - 1, -1e6, 1e6, 1) + Math.random() * noise;
      if (sc > bestScore) { bestScore = sc; best = m; }
    });
    return best;
  }

  // ---- oyun ----
  var state, history, selected = -1, targets = [], lastMove = null, over = false, thinking = false;
  var mode = "ai", mySide = "w", online = null;

  function sfx(name) {
    if (window.ekSes) window.ekSes(name);
  }

  function myTurn() {
    if (over || thinking) return false;
    if (mode === "local") return true;
    if (mode === "ai") return state.turn === mySide;
    return online && online.connected() && state.turn === mySide;
  }

  function flipped() {
    return (mode === "ai" || mode === "online") && mySide === "b";
  }

  function newGame() {
    state = initial();
    history = [];
    selected = -1;
    targets = [];
    lastMove = null;
    over = false;
    thinking = false;
    render();
    maybeAi();
  }

  function render() {
    boardEl.innerHTML = "";
    var moves = over ? [] : legal(state);
    var mustTake = moves.length && moves[0].caps.length ? moves.map(function (m) { return m.from; }) : [];
    for (var i = 0; i < 64; i++) {
      var sq = flipped() ? 63 - i : i;
      var r = sq >> 3, c = sq & 7;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.sq = sq;
      btn.className = (r + c) % 2 ? "dk" : "lt";
      var p = state.b[sq];
      if (p) {
        var disc = document.createElement("span");
        disc.className = "disc " + (side(p) === "w" ? "dw" : "db") + (isKing(p) ? " king" : "");
        btn.appendChild(disc);
      }
      btn.setAttribute("aria-label", "abcdefgh"[c] + (8 - r) + (p ? (side(p) === "w" ? " beyaz" : " siyah") + (isKing(p) ? " dama" : " taş") : ""));
      if (lastMove && (sq === lastMove.from || sq === lastMove.to)) btn.classList.add("last");
      if (lastMove && lastMove.caps.indexOf(sq) >= 0) btn.classList.add("gone");
      if (sq === selected) btn.classList.add("sel");
      if (myTurn() && mustTake.indexOf(sq) >= 0 && sq !== selected) btn.classList.add("must");
      if (targets.some(function (m) { return m.to === sq; })) btn.classList.add("dot");
      boardEl.appendChild(btn);
    }
    undoEl.disabled = mode === "online" || !history.length || thinking;
    status(moves);
  }

  function sideName(c) { return c === "w" ? "Beyaz" : "Siyah"; }

  function status(moves) {
    if (mode === "online" && !(online && online.connected())) {
      statusEl.textContent = "Online oyun için rakibin bağlanmasını bekle.";
      return;
    }
    var mine = count(state.b, state.turn), theirs = count(state.b, other(state.turn));
    var text = "";
    if (!over && (!mine.all || !moves.length)) {
      over = true;
      var winner = other(state.turn);
      text = sideName(winner) + " kazandı" + (!mine.all ? "." : " (rakibin hamlesi kalmadı).");
      sfx(mode === "local" ? "win" : winner === mySide ? "win" : "lose");
    } else if (!over && mine.all === 1 && theirs.all === 1 && mine.kings === 1 && theirs.kings === 1) {
      over = true;
      text = "İki tarafta da birer dama kaldı. Berabere.";
      sfx("nomatch");
    }
    if (over) {
      if (text) statusEl.textContent = text;
      return;
    }
    if (thinking) {
      statusEl.textContent = "Bilgisayar düşünüyor…";
      return;
    }
    text = "Sıra " + sideName(state.turn).toLowerCase() + "da";
    if (mode === "ai") text += state.turn === mySide ? " (sen)" : " (bilgisayar)";
    if (mode === "online") text += state.turn === mySide ? " (sen)" : " (rakip)";
    if (moves.length && moves[0].caps.length) text += " · taş almak zorunlu" + (moves[0].caps.length > 1 ? " (" + moves[0].caps.length + " taş)" : "");
    statusEl.textContent = text;
  }

  function play(m, remote) {
    history.push({ state: state, last: lastMove });
    var wasKing = isKing(state.b[m.from]);
    state = make(state, m);
    lastMove = m;
    selected = -1;
    targets = [];
    if (mode === "online" && !remote) online.send({ t: "move", from: m.from, to: m.to, caps: m.caps });
    sfx(!wasKing && isKing(state.b[m.to]) ? "match" : m.caps.length ? "kick" : "flip");
    render();
    maybeAi();
  }

  function maybeAi() {
    if (mode !== "ai" || over || state.turn === mySide) return;
    thinking = true;
    render();
    setTimeout(function () {
      var m = bestMove(state, Number(levelEl.value));
      thinking = false;
      if (m) play(m);
      else render();
    }, 250);
  }

  boardEl.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn || !myTurn()) return;
    var sq = Number(btn.dataset.sq);
    var hit = targets.filter(function (m) { return m.to === sq; })[0];
    if (hit) return play(hit);
    var p = state.b[sq];
    if (side(p) === state.turn && sq !== selected) {
      var mine = legal(state).filter(function (m) { return m.from === sq; });
      if (mine.length) {
        selected = sq;
        targets = mine;
      } else {
        selected = -1;
        targets = [];
        render();
        var all = legal(state);
        if (all.length && all[0].caps.length) statusEl.textContent = "Taş almak zorunlu: işaretli taşlardan biriyle oyna.";
        return;
      }
    } else {
      selected = -1;
      targets = [];
    }
    render();
  });

  undoEl.addEventListener("click", function () {
    if (mode === "online" || !history.length || thinking) return;
    var steps = mode === "ai" ? (state.turn === mySide ? 2 : 1) : 1;
    while (steps-- > 0 && history.length) {
      var h = history.pop();
      state = h.state;
      lastMove = h.last;
    }
    over = false;
    selected = -1;
    targets = [];
    render();
    maybeAi();
  });

  function syncControls() {
    levelEl.hidden = mode !== "ai";
    sideEl.hidden = mode !== "ai";
  }

  function saveSettings() {
    try { localStorage.setItem(KEY, JSON.stringify({ mode: mode === "online" ? "ai" : mode, level: levelEl.value, side: sideEl.value })); } catch (e) {}
  }

  function setMode(next) {
    if (mode === "online" && next !== "online" && online) online.leave();
    mode = next;
    modeEl.value = next;
    mySide = mode === "ai" ? sideEl.value : mode === "online" ? (online && online.role() === "guest" ? "b" : "w") : "w";
    syncControls();
    saveSettings();
  }

  modeEl.addEventListener("change", function () {
    setMode(modeEl.value);
    if (mode === "online") online.host();
    newGame();
  });
  levelEl.addEventListener("change", saveSettings);
  sideEl.addEventListener("change", function () {
    setMode(mode);
    newGame();
  });
  document.getElementById("d-new").addEventListener("click", function () {
    if (mode === "online") {
      if (online.connected()) online.send({ t: "new" });
      else online.host();
    }
    newGame();
  });

  online = window.ekOnline({
    box: document.getElementById("d-online"),
    game: "dama",
    onStart: function (role) {
      mySide = role === "guest" ? "b" : "w";
      newGame();
    },
    onMessage: function (msg) {
      if (msg.t === "new") return newGame();
      if (msg.t === "full") { statusEl.textContent = "Bu oda dolu."; return; }
      if (msg.t !== "move" || state.turn === mySide) return;
      var caps = (msg.caps || []).join(",");
      var m = legal(state).filter(function (x) { return x.from === msg.from && x.to === msg.to && x.caps.join(",") === caps; })[0];
      if (m) play(m, true);
    },
    onEnd: function () { render(); }
  });

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    if (saved.level) levelEl.value = saved.level;
    if (saved.side) sideEl.value = saved.side;
    if (saved.mode === "local" || saved.mode === "ai") mode = saved.mode;
  } catch (e) {}
  setMode(online.pending() ? "online" : mode);
  newGame();
})();
