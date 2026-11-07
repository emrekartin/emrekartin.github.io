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
  }

  function runRandom(list, count) {
    teams = [];
    for (var i = 0; i < count; i++) teams.push({ members: [], captain: null });
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
