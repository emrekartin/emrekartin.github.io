(function () {
  var playersEl = document.getElementById("squad-players");
  var keepersEl = document.getElementById("squad-keepers");
  var teamsEl = document.getElementById("squad-teams");
  var modeEl = document.getElementById("squad-mode");
  var orderEl = document.getElementById("squad-order");
  var orderField = document.getElementById("squad-order-field");
  var hintEl = document.getElementById("squad-hint");
  var runBtn = document.getElementById("squad-run");
  var copyBtn = document.getElementById("squad-copy");
  var errorEl = document.getElementById("squad-error");
  var outEl = document.getElementById("squad-out");
  var draftEl = document.getElementById("draft");
  var turnEl = document.getElementById("draft-turn");
  var poolEl = document.getElementById("draft-pool");
  var captainsBtn = document.getElementById("draft-captains");
  var restBtn = document.getElementById("draft-rest");
  var undoBtn = document.getElementById("draft-undo");
  var KEY = "ek-kadro";

  var teams = [];
  var draft = null;

  function rand(span) {
    var limit = 0x100000000 - (0x100000000 % span);
    var buf = new Uint32Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % span;
    }
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = rand(i + 1);
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function lines(text) {
    return text.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
  }

  function people() {
    var list = [];
    lines(keepersEl.value).forEach(function (name) { list.push({ name: name, keeper: true }); });
    lines(playersEl.value).forEach(function (name) { list.push({ name: name, keeper: false }); });
    list.forEach(function (p, i) { p.id = i; });
    return list;
  }

  function label(p) {
    return p.name + (p.keeper ? " (kaleci)" : "");
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        players: playersEl.value,
        keepers: keepersEl.value,
        teams: teamsEl.value,
        mode: modeEl.value,
        order: orderEl.value
      }));
    } catch (e) {}
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!saved) return;
      playersEl.value = saved.players || "";
      keepersEl.value = saved.keepers || "";
      if (saved.teams) teamsEl.value = saved.teams;
      if (saved.mode) modeEl.value = saved.mode;
      if (saved.order) orderEl.value = saved.order;
    } catch (e) {}
  }

  function syncMode() {
    var drafting = modeEl.value === "draft";
    orderField.hidden = !drafting;
    runBtn.textContent = drafting ? "Başla" : "Dağıt";
    hintEl.textContent = drafting
      ? "Önce kaptanları seç. İlk seçimi kimin yapacağı rastgele belirlenir. Aldım verdim: 1, 2, 1, 2. Yılan: 1, 2, 2, 1."
      : "Kaleciler takımlara birer birer dağılır. Sayılar eşit değilse fark en fazla bir olur.";
  }

  function smallest(list, key) {
    var min = Infinity;
    list.forEach(function (team) { min = Math.min(min, key(team)); });
    var tied = list.filter(function (team) { return key(team) === min; });
    return tied[rand(tied.length)];
  }

  function render() {
    outEl.innerHTML = "";
    teams.forEach(function (team, i) {
      var card = document.createElement("article");
      card.className = "squad-team";
      var head = document.createElement("h2");
      head.textContent = "Takım " + (i + 1);
      var count = document.createElement("span");
      count.textContent = team.members.length + " kişi";
      head.appendChild(count);
      card.appendChild(head);
      var list = document.createElement("ol");
      team.members.forEach(function (p) {
        var li = document.createElement("li");
        li.textContent = label(p) + (team.captain === p ? " · kaptan" : "");
        list.appendChild(li);
      });
      card.appendChild(list);
      outEl.appendChild(card);
    });
    var done = teams.length && (!draft || !draft.pool.length);
    copyBtn.disabled = !done;
    drawPitch(done);
  }

  var pitchBox = document.getElementById("pitch-box");
  var pitchEl = document.getElementById("pitch");
  var sidesRow = document.getElementById("pitch-sides");
  var sideEls = [document.getElementById("pitch-a"), document.getElementById("pitch-b")];
  var formEls = [document.getElementById("pitch-form-a"), document.getElementById("pitch-form-b")];
  var formLabels = [document.getElementById("pitch-form-a-label"), document.getElementById("pitch-form-b-label")];
  var pitchError = document.getElementById("pitch-error");
  var forms = [];
  var sides = [0, 1];
  var COLORS = ["#2563eb", "#dc2626"];

  function defaultForm(n) {
    var known = ["", "1", "1-1", "2-1", "2-2", "2-2-1", "2-3-1", "3-3-1", "3-3-2", "3-4-2", "4-4-2"];
    if (n < known.length) return known[n];
    var a = Math.round(n * 0.4);
    var b = Math.round(n * 0.4);
    return a + "-" + b + "-" + (n - a - b);
  }

  function goalie(team) {
    return team.members.find(function (m) { return m.keeper; }) || team.members[team.members.length - 1];
  }

  function outfield(team) {
    var g = goalie(team);
    return team.members.filter(function (m) { return m !== g; });
  }

  function parseForm(text, n) {
    var parts = text.split(/[^0-9]+/).filter(Boolean).map(Number);
    var sum = parts.reduce(function (a, b) { return a + b; }, 0);
    if (n === 0) return parts.length ? null : [];
    if (sum !== n || parts.some(function (k) { return k < 1; })) return null;
    return parts;
  }

  function layout(i) {
    var team = teams[i];
    var field = outfield(team);
    var lines = parseForm(forms[i], field.length) || parseForm(defaultForm(field.length), field.length);
    goalie(team).at = { d: 4, y: 50 };
    var k = 0;
    lines.forEach(function (count, li) {
      var d = lines.length === 1 ? 28 : 14 + li * (26 / (lines.length - 1));
      for (var j = 0; j < count; j++) {
        field[k++].at = { d: d, y: 10 + ((j + 1) / (count + 1)) * 80 };
      }
    });
  }

  function initials(name) {
    var words = name.split(/\s+/).filter(Boolean);
    var text = words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2);
    return text.toLocaleUpperCase("tr");
  }

  function fillSides() {
    sidesRow.hidden = teams.length < 3;
    sideEls.forEach(function (el, s) {
      el.innerHTML = "";
      teams.forEach(function (team, i) {
        var opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = "Takım " + (i + 1);
        el.appendChild(opt);
      });
      el.value = String(sides[s]);
    });
  }

  function drawPitch(done) {
    pitchBox.hidden = !done;
    if (!done) return;
    if (forms.length !== teams.length) {
      forms = teams.map(function (t) { return defaultForm(t.members.length - 1); });
      sides = [0, 1];
      fillSides();
    }
    pitchError.textContent = "";
    pitchEl.querySelectorAll(".tok").forEach(function (el) { el.remove(); });
    sides.forEach(function (ti, s) {
      var team = teams[ti];
      formLabels[s].textContent = "Takım " + (ti + 1) + " dizilişi";
      formEls[s].placeholder = defaultForm(team.members.length - 1) || "—";
      if (document.activeElement !== formEls[s]) formEls[s].value = forms[ti];
      if (team.members.some(function (m) { return !m.at; })) layout(ti);
      var g = goalie(team);
      team.members.forEach(function (p) {
        var tok = document.createElement("div");
        tok.className = "tok" + (p === g ? " gk" : "") + (team.captain === p ? " cap" : "");
        tok.style.setProperty("--team", COLORS[s]);
        var dot = document.createElement("span");
        dot.className = "dot";
        dot.textContent = initials(p.name);
        var nm = document.createElement("span");
        nm.className = "nm";
        nm.textContent = p.name;
        tok.appendChild(dot);
        tok.appendChild(nm);
        tok.title = p.name;
        place(tok, p, s);
        drag(tok, p, s);
        pitchEl.appendChild(tok);
      });
    });
  }

  function place(tok, p, s) {
    var x = s === 0 ? p.at.d : 100 - p.at.d;
    tok.style.left = x + "%";
    tok.style.top = p.at.y + "%";
  }

  function drag(tok, p, s) {
    tok.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      tok.setPointerCapture(e.pointerId);
      tok.classList.add("moving");
      function move(ev) {
        var rect = pitchEl.getBoundingClientRect();
        var x = Math.min(98, Math.max(2, ((ev.clientX - rect.left) / rect.width) * 100));
        var y = Math.min(96, Math.max(4, ((ev.clientY - rect.top) / rect.height) * 100));
        p.at = { d: s === 0 ? x : 100 - x, y: y };
        place(tok, p, s);
      }
      function up() {
        tok.classList.remove("moving");
        tok.removeEventListener("pointermove", move);
        tok.removeEventListener("pointerup", up);
        tok.removeEventListener("pointercancel", up);
      }
      tok.addEventListener("pointermove", move);
      tok.addEventListener("pointerup", up);
      tok.addEventListener("pointercancel", up);
    });
  }

  formEls.forEach(function (el, s) {
    el.addEventListener("input", function () {
      var ti = sides[s];
      var n = outfield(teams[ti]).length;
      if (!parseForm(el.value, n)) {
        pitchError.textContent = "Takım " + (ti + 1) + " dizilişi " + n + " oyuncu etmeli (kaleci hariç).";
        return;
      }
      forms[ti] = el.value.trim();
      layout(ti);
      drawPitch(true);
    });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter") e.preventDefault();
    });
  });

  sideEls.forEach(function (el, s) {
    el.addEventListener("change", function () {
      var pick = Number(el.value);
      if (pick === sides[1 - s]) sides[1 - s] = sides[s];
      sides[s] = pick;
      fillSides();
      drawPitch(true);
    });
  });

  document.getElementById("pitch-reset").addEventListener("click", function () {
    sides.forEach(layout);
    drawPitch(true);
  });

  document.getElementById("pitch-png").addEventListener("click", function () {
    var S = 10;
    var top = 80;
    var canvas = document.createElement("canvas");
    canvas.width = 150 * S;
    canvas.height = 100 * S + top;
    var c = canvas.getContext("2d");
    var font = "Sora, 'Segoe UI', sans-serif";
    c.fillStyle = "#14532d";
    c.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < 10; i++) {
      c.fillStyle = i % 2 ? "#1f7a3f" : "#23874a";
      c.fillRect(i * 15 * S, top, 15 * S, 100 * S);
    }
    c.strokeStyle = "rgba(255,255,255,0.85)";
    c.lineWidth = 4;
    function rect(x, y, w, h) { c.strokeRect(x * S, top + y * S, w * S, h * S); }
    rect(3, 3, 144, 94);
    rect(3, 25, 20, 50);
    rect(3, 37, 7, 26);
    rect(127, 25, 20, 50);
    rect(140, 37, 7, 26);
    rect(0.6, 43, 2.4, 14);
    rect(147, 43, 2.4, 14);
    c.beginPath();
    c.moveTo(75 * S, top + 3 * S);
    c.lineTo(75 * S, top + 97 * S);
    c.stroke();
    c.beginPath();
    c.arc(75 * S, top + 50 * S, 11 * S, 0, Math.PI * 2);
    c.stroke();

    c.textBaseline = "middle";
    sides.forEach(function (ti, s) {
      var team = teams[ti];
      c.fillStyle = "#fff";
      c.font = "600 34px " + font;
      c.textAlign = s === 0 ? "left" : "right";
      var head = "Takım " + (ti + 1) + (forms[ti] ? "  " + forms[ti] : "");
      c.fillText(head, s === 0 ? 30 : canvas.width - 30, top / 2);
      var g = goalie(team);
      team.members.forEach(function (p) {
        var x = (s === 0 ? p.at.d : 100 - p.at.d) * 1.5 * S;
        var y = top + p.at.y * S;
        c.beginPath();
        c.arc(x, y, 28, 0, Math.PI * 2);
        c.fillStyle = p === g ? "#facc15" : COLORS[s];
        c.fill();
        c.lineWidth = 4;
        c.strokeStyle = p === g ? COLORS[s] : "#fff";
        c.stroke();
        c.fillStyle = p === g ? "#111" : "#fff";
        c.textAlign = "center";
        c.font = "600 22px " + font;
        c.fillText(initials(p.name), x, y + 1);
        c.font = "600 22px " + font;
        var label = p.name + (team.captain === p ? " (K)" : "");
        var w = c.measureText(label).width + 16;
        c.fillStyle = "rgba(0,0,0,0.55)";
        c.fillRect(x - w / 2, y + 36, w, 30);
        c.fillStyle = "#fff";
        c.fillText(label, x, y + 52);
      });
    });
    c.textAlign = "center";
    c.fillStyle = "rgba(255,255,255,0.8)";
    c.font = "600 30px " + font;
    c.fillText("vs", canvas.width / 2, top / 2);
    canvas.toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "kadro.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
  });

  function runRandom(list, count) {
    teams = [];
    for (var i = 0; i < count; i++) teams.push({ members: [], captain: null });
    forms = [];
    shuffle(list.filter(function (p) { return p.keeper; })).forEach(function (p) {
      smallest(teams, function (t) {
        return t.members.filter(function (m) { return m.keeper; }).length * 1000 + t.members.length;
      }).members.push(p);
    });
    shuffle(list.filter(function (p) { return !p.keeper; })).forEach(function (p) {
      smallest(teams, function (t) { return t.members.length; }).members.push(p);
    });
    draft = null;
    draftEl.hidden = true;
    render();
  }

  function teamFor(n) {
    var count = teams.length;
    var round = Math.floor(n / count);
    var pos = n % count;
    if (draft.order === "snake" && round % 2 === 1) pos = count - 1 - pos;
    return (draft.start + pos) % count;
  }

  function captainsLeft() {
    return teams.filter(function (t) { return !t.captain; }).length;
  }

  function drawDraft() {
    poolEl.innerHTML = "";
    var choosing = captainsLeft() > 0;
    draft.pool.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ghost";
      btn.textContent = label(p);
      btn.addEventListener("click", function () { take(p); });
      poolEl.appendChild(btn);
    });
    if (choosing) {
      var next = teams.findIndex(function (t) { return !t.captain; });
      turnEl.textContent = "Takım " + (next + 1) + " kaptanını seç.";
    } else if (draft.pool.length) {
      var team = teams[teamFor(draft.picks)];
      var first = draft.picks === 0 ? " · ilk seçim rastgele ona düştü" : "";
      turnEl.textContent = "Sıra " + team.captain.name + " kaptanda (Takım " + (teams.indexOf(team) + 1) + ")" + first + ".";
    } else {
      turnEl.textContent = "Kadro tamam.";
    }
    captainsBtn.hidden = !choosing;
    restBtn.hidden = choosing || !draft.pool.length;
    undoBtn.disabled = !draft.history.length;
    render();
  }

  function removeFromPool(p) {
    draft.pool = draft.pool.filter(function (q) { return q !== p; });
  }

  function take(p) {
    if (captainsLeft() > 0) {
      var team = teams.find(function (t) { return !t.captain; });
      team.captain = p;
      team.members.push(p);
      removeFromPool(p);
      draft.history.push({ team: team, person: p, captain: true });
      if (!captainsLeft()) draft.start = rand(teams.length);
    } else {
      var target = teams[teamFor(draft.picks)];
      target.members.push(p);
      removeFromPool(p);
      draft.picks++;
      draft.history.push({ team: target, person: p, captain: false });
    }
    drawDraft();
  }

  function undo() {
    var last = draft.history.pop();
    if (!last) return;
    last.team.members = last.team.members.filter(function (m) { return m !== last.person; });
    if (last.captain) last.team.captain = null;
    else draft.picks--;
    draft.pool.push(last.person);
    draft.pool.sort(function (a, b) { return a.id - b.id; });
    drawDraft();
  }

  function startDraft(list, count) {
    teams = [];
    for (var i = 0; i < count; i++) teams.push({ members: [], captain: null });
    forms = [];
    draft = { pool: list, picks: 0, start: 0, order: orderEl.value, history: [] };
    draftEl.hidden = false;
    drawDraft();
  }

  runBtn.addEventListener("click", function () {
    errorEl.textContent = "";
    if (!window.crypto || !crypto.getRandomValues) {
      errorEl.textContent = "Bu sayfa güvenli bağlantıda açılmalı.";
      return;
    }
    var list = people();
    var count = Number(teamsEl.value);
    if (list.length > 80) {
      errorEl.textContent = "En fazla 80 kişi.";
      return;
    }
    if (list.length < count) {
      errorEl.textContent = count + " takım için en az " + count + " kişi yaz.";
      return;
    }
    save();
    if (modeEl.value === "draft") startDraft(list, count);
    else runRandom(list, count);
  });

  captainsBtn.addEventListener("click", function () {
    var field = shuffle(draft.pool.filter(function (p) { return !p.keeper; }));
    var keepers = shuffle(draft.pool.filter(function (p) { return p.keeper; }));
    var order = field.concat(keepers);
    while (captainsLeft() > 0 && order.length) take(order.shift());
  });

  restBtn.addEventListener("click", function () {
    while (draft.pool.length) {
      var team = teams[teamFor(draft.picks)];
      var hasKeeper = team.members.some(function (m) { return m.keeper; });
      var options = draft.pool.filter(function (p) { return p.keeper !== hasKeeper; });
      if (!options.length) options = draft.pool;
      take(options[rand(options.length)]);
    }
  });

  undoBtn.addEventListener("click", undo);

  copyBtn.addEventListener("click", function () {
    var text = teams.map(function (team, i) {
      return "Takım " + (i + 1) + ": " + team.members.map(function (p) {
        return label(p) + (team.captain === p ? " (kaptan)" : "");
      }).join(", ");
    }).join("\n");
    navigator.clipboard.writeText(text).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });

  [playersEl, keepersEl, teamsEl, orderEl].forEach(function (el) {
    el.addEventListener("change", save);
  });
  modeEl.addEventListener("change", function () {
    syncMode();
    save();
    teams = [];
    draft = null;
    draftEl.hidden = true;
    render();
  });

  load();
  syncMode();
})();
