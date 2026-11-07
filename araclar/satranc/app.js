(function () {
  var boardEl = document.getElementById("c-board");
  var statusEl = document.getElementById("c-status");
  var modeEl = document.getElementById("c-mode");
  var levelEl = document.getElementById("c-level");
  var sideEl = document.getElementById("c-side");
  var undoEl = document.getElementById("c-undo");
  var promoEl = document.getElementById("c-promo");
  var takenTop = document.getElementById("c-taken-top");
  var takenBottom = document.getElementById("c-taken-bottom");
  var KEY = "ek-satranc";

  var GLYPH = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟\uFE0E" };
  var NAME = { k: "Şah", q: "Vezir", r: "Kale", b: "Fil", n: "At", p: "Piyon" };
  var VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  var KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  var KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  var DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  var ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function color(p) { return p ? (p === p.toUpperCase() ? "w" : "b") : ""; }
  function other(c) { return c === "w" ? "b" : "w"; }
  function on(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  function initial() {
    var row = "rnbqkbnr".split("");
    var b = [];
    for (var i = 0; i < 64; i++) b.push("");
    for (var c = 0; c < 8; c++) {
      b[c] = row[c];
      b[8 + c] = "p";
      b[48 + c] = "P";
      b[56 + c] = row[c].toUpperCase();
    }
    return { b: b, turn: "w", castle: "KQkq", ep: -1, half: 0 };
  }

  function attacked(b, sq, by) {
    var r = sq >> 3, c = sq & 7, i, rr, cc, p;
    var pawn = by === "w" ? "P" : "p", dir = by === "w" ? 1 : -1;
    for (i = -1; i <= 1; i += 2) {
      rr = r + dir; cc = c + i;
      if (on(rr, cc) && b[rr * 8 + cc] === pawn) return true;
    }
    var knight = by === "w" ? "N" : "n", king = by === "w" ? "K" : "k";
    for (i = 0; i < 8; i++) {
      rr = r + KN[i][0]; cc = c + KN[i][1];
      if (on(rr, cc) && b[rr * 8 + cc] === knight) return true;
      rr = r + KG[i][0]; cc = c + KG[i][1];
      if (on(rr, cc) && b[rr * 8 + cc] === king) return true;
    }
    var bishop = by === "w" ? "B" : "b", rook = by === "w" ? "R" : "r", queen = by === "w" ? "Q" : "q";
    for (i = 0; i < 4; i++) {
      rr = r + DIAG[i][0]; cc = c + DIAG[i][1];
      while (on(rr, cc)) {
        p = b[rr * 8 + cc];
        if (p) { if (p === bishop || p === queen) return true; break; }
        rr += DIAG[i][0]; cc += DIAG[i][1];
      }
      rr = r + ORTH[i][0]; cc = c + ORTH[i][1];
      while (on(rr, cc)) {
        p = b[rr * 8 + cc];
        if (p) { if (p === rook || p === queen) return true; break; }
        rr += ORTH[i][0]; cc += ORTH[i][1];
      }
    }
    return false;
  }

  function inCheck(s, side) {
    return attacked(s.b, s.b.indexOf(side === "w" ? "K" : "k"), other(side));
  }

  function pseudo(s) {
    var b = s.b, me = s.turn, out = [];
    function add(from, to, extra) {
      var m = { from: from, to: to, cap: b[to] };
      if (extra) for (var k in extra) m[k] = extra[k];
      out.push(m);
    }
    for (var sq = 0; sq < 64; sq++) {
      var p = b[sq];
      if (!p || color(p) !== me) continue;
      var r = sq >> 3, c = sq & 7, t = p.toLowerCase(), i, rr, cc, to;
      if (t === "p") {
        var dir = me === "w" ? -1 : 1, start = me === "w" ? 6 : 1, lastRow = me === "w" ? 0 : 7;
        var promos = me === "w" ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"];
        rr = r + dir;
        if (on(rr, c) && !b[rr * 8 + c]) {
          if (rr === lastRow) promos.forEach(function (q) { add(sq, rr * 8 + c, { promo: q }); });
          else add(sq, rr * 8 + c);
          if (r === start && !b[(r + 2 * dir) * 8 + c]) add(sq, (r + 2 * dir) * 8 + c, { dbl: true });
        }
        for (i = -1; i <= 1; i += 2) {
          cc = c + i;
          if (!on(rr, cc)) continue;
          to = rr * 8 + cc;
          if (b[to] && color(b[to]) !== me) {
            if (rr === lastRow) promos.forEach(function (q) { add(sq, to, { promo: q }); });
            else add(sq, to);
          } else if (to === s.ep) {
            add(sq, to, { ep: true, cap: me === "w" ? "p" : "P" });
          }
        }
      } else if (t === "n" || t === "k") {
        var offs = t === "n" ? KN : KG;
        for (i = 0; i < 8; i++) {
          rr = r + offs[i][0]; cc = c + offs[i][1];
          if (!on(rr, cc)) continue;
          to = rr * 8 + cc;
          if (!b[to] || color(b[to]) !== me) add(sq, to);
        }
        if (t === "k") castles(s, sq, add);
      } else {
        var dirs = t === "b" ? DIAG : t === "r" ? ORTH : DIAG.concat(ORTH);
        for (i = 0; i < dirs.length; i++) {
          rr = r + dirs[i][0]; cc = c + dirs[i][1];
          while (on(rr, cc)) {
            to = rr * 8 + cc;
            if (b[to]) {
              if (color(b[to]) !== me) add(sq, to);
              break;
            }
            add(sq, to);
            rr += dirs[i][0]; cc += dirs[i][1];
          }
        }
      }
    }
    return out;
  }

  function castles(s, sq, add) {
    var b = s.b, me = s.turn, them = other(me);
    var home = me === "w" ? 60 : 4;
    if (sq !== home || attacked(b, home, them)) return;
    var rook = me === "w" ? "R" : "r";
    if (s.castle.indexOf(me === "w" ? "K" : "k") >= 0 && b[home + 3] === rook && !b[home + 1] && !b[home + 2] &&
        !attacked(b, home + 1, them) && !attacked(b, home + 2, them)) {
      add(home, home + 2, { rook: [home + 3, home + 1] });
    }
    if (s.castle.indexOf(me === "w" ? "Q" : "q") >= 0 && b[home - 4] === rook && !b[home - 1] && !b[home - 2] && !b[home - 3] &&
        !attacked(b, home - 1, them) && !attacked(b, home - 2, them)) {
      add(home, home - 2, { rook: [home - 4, home - 1] });
    }
  }

  function make(s, m) {
    var b = s.b.slice();
    var p = b[m.from];
    b[m.to] = m.promo || p;
    b[m.from] = "";
    if (m.ep) b[(m.from & ~7) | (m.to & 7)] = "";
    if (m.rook) { b[m.rook[1]] = b[m.rook[0]]; b[m.rook[0]] = ""; }
    var castle = s.castle;
    if (p === "K") castle = castle.replace("K", "").replace("Q", "");
    if (p === "k") castle = castle.replace("k", "").replace("q", "");
    [[63, "K"], [56, "Q"], [7, "k"], [0, "q"]].forEach(function (x) {
      if (m.from === x[0] || m.to === x[0]) castle = castle.replace(x[1], "");
    });
    return {
      b: b,
      turn: other(s.turn),
      castle: castle,
      ep: m.dbl ? (m.from + m.to) / 2 : -1,
      half: p.toLowerCase() === "p" || m.cap ? 0 : s.half + 1
    };
  }

  function legal(s) {
    return pseudo(s).filter(function (m) { return !inCheck(make(s, m), s.turn); });
  }

  function key(s) {
    return s.b.map(function (p) { return p || "."; }).join("") + s.turn + s.castle + s.ep;
  }

  function insufficient(b) {
    var rest = b.filter(function (p) { return p && p.toLowerCase() !== "k"; });
    if (!rest.length) return true;
    return rest.length === 1 && /[nb]/i.test(rest[0]);
  }

  // ---- yapay zekâ ----
  function evaluate(s) {
    var b = s.b, score = 0, pieces = 0;
    for (var i = 0; i < 64; i++) if (b[i] && !/[kp]/i.test(b[i])) pieces++;
    var endgame = pieces <= 4;
    for (var sq = 0; sq < 64; sq++) {
      var p = b[sq];
      if (!p) continue;
      var white = color(p) === "w", t = p.toLowerCase();
      var r = white ? sq >> 3 : 7 - (sq >> 3), c = sq & 7;
      var center = 7 - (Math.abs(3.5 - r) + Math.abs(3.5 - c));
      var v = VALUE[t];
      if (t === "p") v += (6 - r) * (endgame ? 14 : 6) + ((c === 3 || c === 4) && (r === 3 || r === 4) ? 18 : 0);
      else if (t === "n") v += center * 6;
      else if (t === "b") v += center * 4;
      else if (t === "q") v += center * 1.5;
      else if (t === "k") v += endgame ? center * 6 : (r === 7 ? 12 : -center * 5) + (r === 7 && (c <= 2 || c >= 6) ? 18 : 0);
      score += white ? v : -v;
    }
    return s.turn === "w" ? score : -score;
  }

  function ordered(s, moves) {
    return moves.sort(function (a, b) {
      var va = a.cap ? VALUE[a.cap.toLowerCase()] * 10 - VALUE[s.b[a.from].toLowerCase()] : -1e5;
      var vb = b.cap ? VALUE[b.cap.toLowerCase()] * 10 - VALUE[s.b[b.from].toLowerCase()] : -1e5;
      if (a.promo) va += 8000;
      if (b.promo) vb += 8000;
      return vb - va;
    });
  }

  var nodes = 0;

  function quiesce(s, alpha, beta, depth) {
    var stand = evaluate(s);
    if (stand >= beta) return beta;
    if (alpha < stand) alpha = stand;
    if (depth <= 0) return alpha;
    var moves = ordered(s, pseudo(s).filter(function (m) { return m.cap; }));
    for (var i = 0; i < moves.length; i++) {
      var ns = make(s, moves[i]);
      if (inCheck(ns, s.turn)) continue;
      nodes++;
      var sc = -quiesce(ns, -beta, -alpha, depth - 1);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  function search(s, depth, alpha, beta, ply, quiet) {
    if (depth === 0) return quiet ? quiesce(s, alpha, beta, 4) : evaluate(s);
    var moves = ordered(s, pseudo(s)), any = false;
    for (var i = 0; i < moves.length; i++) {
      var ns = make(s, moves[i]);
      if (inCheck(ns, s.turn)) continue;
      any = true;
      nodes++;
      var sc = -search(ns, depth - 1, -beta, -alpha, ply + 1, quiet);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    if (!any) return inCheck(s, s.turn) ? -100000 + ply : 0;
    return alpha;
  }

  function bestMove(s, level) {
    var depth = level === 3 ? 4 : level === 2 ? 2 : 1;
    var noise = level === 1 ? 120 : level === 2 ? 15 : 0;
    var moves = ordered(s, legal(s));
    var best = null, bestScore = -Infinity;
    nodes = 0;
    moves.forEach(function (m) {
      var ns = make(s, m);
      var sc = -search(ns, depth - 1, -1e6, 1e6, 1, level >= 2) + Math.random() * noise;
      if (repeats(key(ns)) >= 2) sc -= 50;
      if (sc > bestScore) { bestScore = sc; best = m; }
    });
    return best;
  }

  // ---- oyun durumu ----
  var state, history, seen, selected = -1, targets = [], lastMove = null, over = false, thinking = false, pendingPromo = null;
  var mode = "ai", mySide = "w", online = null;

  function repeats(k) { return seen[k] || 0; }

  function sfx(name) {
    if (window.ekSes) window.ekSes(name);
  }

  function myTurn() {
    if (over || thinking) return false;
    if (mode === "local") return true;
    if (mode === "ai") return state.turn === mySide;
    return online && online.connected() && state.turn === mySide;
  }

  function newGame() {
    state = initial();
    history = [];
    seen = {};
    seen[key(state)] = 1;
    selected = -1;
    targets = [];
    lastMove = null;
    over = false;
    thinking = false;
    pendingPromo = null;
    promoEl.hidden = true;
    render();
    maybeAi();
  }

  function flipped() {
    return (mode === "ai" || mode === "online") && mySide === "b";
  }

  function render() {
    boardEl.innerHTML = "";
    var checkSq = inCheck(state, state.turn) ? state.b.indexOf(state.turn === "w" ? "K" : "k") : -1;
    for (var i = 0; i < 64; i++) {
      var sq = flipped() ? 63 - i : i;
      var r = sq >> 3, c = sq & 7;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.sq = sq;
      btn.className = (r + c) % 2 ? "dk" : "lt";
      var p = state.b[sq];
      if (p) {
        var span = document.createElement("span");
        span.className = color(p) === "w" ? "pw" : "pb";
        span.textContent = GLYPH[p.toLowerCase()];
        btn.appendChild(span);
      }
      var file = "abcdefgh"[c], rank = 8 - r;
      btn.setAttribute("aria-label", file + rank + (p ? " " + (color(p) === "w" ? "beyaz " : "siyah ") + NAME[p.toLowerCase()] : ""));
      if (lastMove && (sq === lastMove.from || sq === lastMove.to)) btn.classList.add("last");
      if (sq === selected) btn.classList.add("sel");
      if (sq === checkSq) btn.classList.add("check");
      if (targets.some(function (m) { return m.to === sq; })) btn.classList.add(p || targets.some(function (m) { return m.to === sq && m.ep; }) ? "hit" : "dot");
      if ((flipped() ? i % 8 === 0 : c === 0)) btn.dataset.rank = rank;
      if ((flipped() ? i >= 56 : r === 7)) btn.dataset.file = file;
      boardEl.appendChild(btn);
    }
    renderTaken();
    undoEl.disabled = mode === "online" || !history.length || thinking;
    status();
  }

  function renderTaken() {
    var start = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    var lost = { w: "", b: "" };
    ["w", "b"].forEach(function (side) {
      Object.keys(start).forEach(function (t) {
        var ch = side === "w" ? t.toUpperCase() : t;
        var n = start[t] - state.b.filter(function (p) { return p === ch; }).length;
        for (var i = 0; i < n; i++) lost[side] += GLYPH[t];
      });
    });
    var bottomSide = flipped() ? "b" : "w";
    takenBottom.innerHTML = lost[other(bottomSide)] ? '<span class="' + (bottomSide === "w" ? "pb" : "pw") + '">' + lost[other(bottomSide)] + "</span>" : "";
    takenTop.innerHTML = lost[bottomSide] ? '<span class="' + (bottomSide === "w" ? "pw" : "pb") + '">' + lost[bottomSide] + "</span>" : "";
  }

  function sideName(c) { return c === "w" ? "Beyaz" : "Siyah"; }

  function status() {
    if (mode === "online" && !(online && online.connected())) {
      statusEl.textContent = "Online oyun için rakibin bağlanmasını bekle.";
      return;
    }
    var moves = legal(state);
    var check = inCheck(state, state.turn);
    var text;
    if (!moves.length) {
      text = check ? "Şah mat! " + sideName(other(state.turn)) + " kazandı." : "Pat. Berabere.";
    } else if (state.half >= 100) {
      text = "50 hamle kuralı. Berabere.";
    } else if (insufficient(state.b)) {
      text = "Mat edecek taş kalmadı. Berabere.";
    } else if (repeats(key(state)) >= 3) {
      text = "Üç kez aynı pozisyon. Berabere.";
    } else {
      text = (check ? "Şah! " : "") + "Sıra " + sideName(state.turn).toLowerCase() + "da";
      if (mode === "ai") text += state.turn === mySide ? " (sen)" : " (bilgisayar)";
      if (mode === "online") text += state.turn === mySide ? " (sen)" : " (rakip)";
      if (thinking) text = "Bilgisayar düşünüyor…";
      statusEl.textContent = text;
      return;
    }
    if (!over) {
      over = true;
      var mine = mode === "local" ? null : !moves.length && check ? state.turn !== mySide : null;
      sfx(mine === null ? (check && !moves.length ? "win" : "nomatch") : mine ? "win" : "lose");
    }
    statusEl.textContent = text;
  }

  function play(m, remote) {
    history.push({ state: state, last: lastMove });
    var capture = !!m.cap;
    state = make(state, m);
    seen[key(state)] = repeats(key(state)) + 1;
    lastMove = { from: m.from, to: m.to };
    selected = -1;
    targets = [];
    if (mode === "online" && !remote) online.send({ t: "move", from: m.from, to: m.to, promo: m.promo || "" });
    render();
    if (!over) sfx(inCheck(state, state.turn) ? "flag" : capture ? "kick" : "flip");
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
    }, 60);
  }

  function choosePromo(moves) {
    pendingPromo = moves;
    promoEl.innerHTML = "";
    moves.forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ghost";
      b.innerHTML = '<span class="' + (color(m.promo) === "w" ? "pw" : "pb") + '">' + GLYPH[m.promo.toLowerCase()] + "</span>";
      b.setAttribute("aria-label", NAME[m.promo.toLowerCase()]);
      b.addEventListener("click", function () {
        promoEl.hidden = true;
        pendingPromo = null;
        play(m);
      });
      promoEl.appendChild(b);
    });
    promoEl.hidden = false;
  }

  boardEl.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn || !myTurn() || pendingPromo) return;
    var sq = Number(btn.dataset.sq);
    var hits = targets.filter(function (m) { return m.to === sq; });
    if (hits.length) {
      if (hits.length > 1) choosePromo(hits);
      else play(hits[0]);
      return;
    }
    var p = state.b[sq];
    if (p && color(p) === state.turn && sq !== selected) {
      selected = sq;
      targets = legal(state).filter(function (m) { return m.from === sq; });
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
      var k = key(state);
      seen[k] = Math.max(0, repeats(k) - 1);
      var h = history.pop();
      state = h.state;
      lastMove = h.last;
    }
    over = false;
    selected = -1;
    targets = [];
    promoEl.hidden = true;
    pendingPromo = null;
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
  document.getElementById("c-new").addEventListener("click", function () {
    if (mode === "online") {
      if (online.connected()) online.send({ t: "new" });
      else online.host();
    }
    newGame();
  });

  online = window.ekOnline({
    box: document.getElementById("c-online"),
    game: "satranc",
    onStart: function (role) {
      mySide = role === "guest" ? "b" : "w";
      newGame();
    },
    onMessage: function (msg) {
      if (msg.t === "new") return newGame();
      if (msg.t === "full") { statusEl.textContent = "Bu oda dolu."; return; }
      if (msg.t !== "move" || state.turn === mySide) return;
      var m = legal(state).filter(function (x) {
        return x.from === msg.from && x.to === msg.to && (x.promo || "") === (msg.promo || "");
      })[0];
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
