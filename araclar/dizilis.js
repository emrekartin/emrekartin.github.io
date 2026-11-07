window.Lineup = function (cfg) {
  var nameEl = document.getElementById("xi-name");
  var coachEl = document.getElementById("xi-coach");
  var formEl = document.getElementById("xi-form");
  var colorEl = document.getElementById("xi-color");
  var color2El = document.getElementById("xi-color2");
  var patternEl = document.getElementById("xi-pattern");
  var gkEl = document.getElementById("xi-gk");
  var surfaceEl = document.getElementById("xi-surface");
  var paintEl = document.getElementById("xi-paint");
  var pitchEl = document.getElementById("xi-pitch");
  var slotsEl = document.getElementById("xi-slots");
  var benchEl = document.getElementById("xi-bench");
  var outEl = document.getElementById("xi-out");
  var stageEl = document.createElement("div");
  stageEl.className = "xi-stage";
  pitchEl.parentNode.insertBefore(stageEl, pitchEl);
  stageEl.appendChild(pitchEl);
  var sideEl = document.createElement("aside");
  sideEl.className = "xi-side";
  sideEl.setAttribute("aria-label", "Saha kenarı");
  stageEl.appendChild(sideEl);
  var HEX = /^#[0-9a-f]{6}$/i;
  var PATTERNS = { plain: 1, vstripe: 1, hstripe: 1, half: 1, sash: 1 };

  var BENCH_MAX = 20;
  var count = cfg.shapes[cfg.initial].length;
  var slots = [];
  var pos = [];
  var labels = [];
  var nameInputs = [];
  var bench = [];
  var captain = -1;
  for (var i = 0; i < count; i++) slots.push({ no: "", name: "" });

  var posList = [];
  var posNames = {};
  (cfg.positions || []).forEach(function (p) {
    posList.push(p[0]);
    posNames[p[0]] = p[1];
  });
  Object.keys(cfg.shapes).forEach(function (key) {
    cfg.shapes[key].forEach(function (s) {
      if (posList.indexOf(s.label) < 0) posList.push(s.label);
    });
  });

  var capWrap = document.createElement("div");
  capWrap.className = "field xi-captain";
  var capLabel = document.createElement("label");
  capLabel.htmlFor = "xi-captain";
  capLabel.textContent = "Kaptan";
  var capEl = document.createElement("select");
  capEl.id = "xi-captain";
  capWrap.appendChild(capLabel);
  capWrap.appendChild(capEl);
  slotsEl.parentNode.insertBefore(capWrap, slotsEl);

  Object.keys(cfg.shapes).forEach(function (key) {
    var opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key;
    formEl.appendChild(opt);
  });
  formEl.value = cfg.initial;

  function isKeeper(i) {
    return cfg.keeper && i === 0;
  }

  function inkFor(hex) {
    var n = parseInt(hex.slice(1), 16);
    var lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return lum > 160 ? "#111" : "#fff";
  }

  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map(function (v) {
      return Math.round(v * f).toString(16).padStart(2, "0");
    }).join("");
  }

  function surface() {
    var a = surfaceEl ? surfaceEl.value : cfg.surface;
    return { a: a, b: shade(a, cfg.stripe), paint: paintEl ? paintEl.value : "" };
  }

  function paintSurface() {
    var s = surface();
    pitchEl.style.setProperty("--s1", s.a);
    pitchEl.style.setProperty("--s2", s.b);
    if (s.paint) pitchEl.style.setProperty("--paint", s.paint);
  }

  function kit(i) {
    if (isKeeper(i)) return { a: gkEl.value, b: gkEl.value, p: "plain" };
    return { a: colorEl.value, b: color2El.value, p: patternEl.value };
  }

  function kitCss(k) {
    if (k.p === "vstripe") return "repeating-linear-gradient(90deg, " + k.a + " 0 20%, " + k.b + " 20% 40%)";
    if (k.p === "hstripe") return "repeating-linear-gradient(180deg, " + k.a + " 0 20%, " + k.b + " 20% 40%)";
    if (k.p === "half") return "linear-gradient(90deg, " + k.a + " 50%, " + k.b + " 50%)";
    if (k.p === "sash") return "linear-gradient(135deg, " + k.a + " 38%, " + k.b + " 38% 62%, " + k.a + " 62%)";
    return k.a;
  }

  function arrange() {
    var spots = cfg.shapes[formEl.value];
    labels = spots.map(function (s) { return s.label; });
    pos = spots.map(function (s) { return { x: s.x, y: s.y }; });
  }

  function state() {
    return {
      t: nameEl.value,
      c: coachEl.value,
      f: formEl.value,
      k: colorEl.value,
      k2: color2El.value,
      pt: patternEl.value,
      g: gkEl ? gkEl.value : "",
      sf: surfaceEl ? surfaceEl.value : "",
      pn: paintEl ? paintEl.value : "",
      s: slots.map(function (s) { return [s.no, s.name]; }),
      p: pos.map(function (p) { return [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]; }),
      ps: labels.slice(),
      cp: captain,
      bs: benchList().map(function (b) { return [b.no, b.name]; })
    };
  }

  function apply(data) {
    if (!data || typeof data !== "object") return;
    nameEl.value = String(data.t || "").slice(0, 40);
    coachEl.value = String(data.c || "").slice(0, 40);
    if (cfg.shapes[data.f]) formEl.value = data.f;
    if (HEX.test(data.k)) colorEl.value = data.k;
    if (HEX.test(data.k2)) color2El.value = data.k2;
    if (PATTERNS[data.pt]) patternEl.value = data.pt;
    if (gkEl && HEX.test(data.g)) gkEl.value = data.g;
    if (surfaceEl && HEX.test(data.sf)) surfaceEl.value = data.sf;
    if (paintEl && HEX.test(data.pn)) paintEl.value = data.pn;
    if (Array.isArray(data.bs)) {
      bench = data.bs.slice(0, BENCH_MAX).map(function (b) {
        return { no: cleanNo(b && b[0]), name: String((b && b[1]) || "").slice(0, 40) };
      });
    } else if (typeof data.b === "string") {
      bench = data.b.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, BENCH_MAX).map(function (s) {
        var m = s.match(/^(\d{1,2})\s+(.+)$/);
        return m ? { no: m[1], name: m[2].slice(0, 40) } : { no: "", name: s.slice(0, 40) };
      });
    }
    captain = Number.isInteger(data.cp) && data.cp >= 0 && data.cp < count ? data.cp : -1;
    arrange();
    if (Array.isArray(data.ps) && data.ps.length === count) {
      data.ps.forEach(function (label, i) {
        if (posList.indexOf(label) >= 0) labels[i] = label;
      });
    }
    if (Array.isArray(data.s)) {
      data.s.slice(0, count).forEach(function (s, i) {
        slots[i] = { no: cleanNo(s && s[0]), name: String((s && s[1]) || "").slice(0, 40) };
      });
    }
    if (Array.isArray(data.p) && data.p.length === count) {
      data.p.forEach(function (p, i) {
        if (p && isFinite(p[0]) && isFinite(p[1])) {
          pos[i] = { x: Math.min(97, Math.max(3, Number(p[0]))), y: Math.min(97, Math.max(3, Number(p[1]))) };
        }
      });
    }
  }

  function cleanNo(v) {
    return String(v || "").replace(/\D/g, "").slice(0, 2);
  }

  function save() {
    try { localStorage.setItem(cfg.key, JSON.stringify(state())); } catch (e) {}
    if (location.hash) history.replaceState(null, "", location.pathname);
  }

  function encode(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj));
    var bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(text) {
    var bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function buildSlots() {
    slotsEl.innerHTML = "";
    nameInputs = [];
    slots.forEach(function (slot, i) {
      var row = document.createElement("div");
      row.className = "xi-slot";
      var tag = document.createElement("select");
      tag.className = "xi-pos";
      tag.title = "Pozisyon";
      posList.forEach(function (label) {
        var opt = document.createElement("option");
        opt.value = label;
        opt.textContent = label;
        tag.appendChild(opt);
      });
      function longNames(on) {
        Array.prototype.forEach.call(tag.options, function (opt) {
          opt.textContent = on && posNames[opt.value] ? opt.value + " · " + posNames[opt.value] : opt.value;
        });
      }
      tag.addEventListener("mousedown", function () { longNames(true); });
      tag.addEventListener("keydown", function () { longNames(true); });
      tag.addEventListener("blur", function () { longNames(false); });
      tag.addEventListener("change", function () {
        longNames(false);
        labels[i] = tag.value;
        relabel();
        drawPitch();
        save();
      });
      var no = document.createElement("input");
      no.type = "text";
      no.inputMode = "numeric";
      no.maxLength = 2;
      no.placeholder = "No";
      no.value = slot.no;
      no.setAttribute("aria-label", "Forma numarası " + (i + 1));
      var name = document.createElement("input");
      name.type = "text";
      name.maxLength = 40;
      name.autocomplete = "off";
      name.spellcheck = false;
      name.value = slot.name;
      no.addEventListener("input", function () {
        no.value = no.value.replace(/\D/g, "");
        slot.no = no.value;
        drawPitch();
        save();
      });
      name.addEventListener("input", function () {
        slot.name = name.value;
        fillCaptain();
        drawPitch();
        save();
      });
      [no, name].forEach(function (el) {
        el.addEventListener("keydown", function (e) {
          if (e.key !== "Enter") return;
          e.preventDefault();
          var next = nameInputs[i + 1];
          if (el === no) name.focus();
          else if (next) next.focus();
          else benchEl.querySelector("input").focus();
        });
      });
      row.appendChild(tag);
      row.appendChild(no);
      row.appendChild(name);
      slotsEl.appendChild(row);
      nameInputs.push(name);
    });
    relabel();
  }

  function relabel() {
    nameInputs.forEach(function (input, i) {
      slotsEl.children[i].firstChild.value = labels[i];
      input.placeholder = isKeeper(i) ? "Kaleci" : "Oyuncu";
      input.setAttribute("aria-label", labels[i] + " oyuncusu");
    });
    fillCaptain();
  }

  function fillCaptain() {
    capEl.innerHTML = "";
    var none = document.createElement("option");
    none.value = "-1";
    none.textContent = "Yok";
    capEl.appendChild(none);
    slots.forEach(function (slot, i) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = labels[i] + (slot.name.trim() ? " · " + slot.name.trim() : "") + (slot.no ? " (" + slot.no + ")" : "");
      capEl.appendChild(opt);
    });
    capEl.value = String(captain);
  }

  function benchList() {
    return bench.filter(function (b) { return b.no || b.name.trim(); });
  }

  function benchKit() {
    return { a: colorEl.value, b: color2El.value, p: patternEl.value };
  }

  function buildBench() {
    benchEl.innerHTML = "";
    bench = benchList();
    bench.forEach(function (item) { benchRow(item, false); });
    if (bench.length < BENCH_MAX) benchRow({ no: "", name: "" }, true);
  }

  function benchRow(item, fresh) {
    var row = document.createElement("div");
    row.className = "xi-slot";
    var tag = document.createElement("span");
    tag.className = "xi-pos";
    tag.textContent = "Yedek";
    var no = document.createElement("input");
    no.type = "text";
    no.inputMode = "numeric";
    no.maxLength = 2;
    no.placeholder = "No";
    no.value = item.no;
    no.setAttribute("aria-label", "Yedek forma numarası");
    var name = document.createElement("input");
    name.type = "text";
    name.maxLength = 40;
    name.autocomplete = "off";
    name.spellcheck = false;
    name.placeholder = "Yedek oyuncu";
    name.value = item.name;
    name.setAttribute("aria-label", "Yedek oyuncu");
    function changed() {
      no.value = no.value.replace(/\D/g, "");
      item.no = no.value;
      item.name = name.value;
      if (fresh && (item.no || item.name.trim())) {
        fresh = false;
        bench.push(item);
        if (bench.length < BENCH_MAX) benchRow({ no: "", name: "" }, true);
      }
      drawSide();
      save();
    }
    no.addEventListener("input", changed);
    name.addEventListener("input", changed);
    [no, name].forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (el === no) { name.focus(); return; }
        var next = row.nextElementSibling;
        if (next) next.querySelector("input").focus();
      });
    });
    row.appendChild(tag);
    row.appendChild(no);
    row.appendChild(name);
    benchEl.appendChild(row);
  }

  function drawSide() {
    var coach = coachEl.value.trim();
    var bench = benchList();
    sideEl.innerHTML = "";
    sideEl.hidden = !coach && !bench.length;
    function title(text) {
      var h = document.createElement("p");
      h.className = "xi-side-title";
      h.textContent = text;
      sideEl.appendChild(h);
    }
    if (coach) {
      title(cfg.coachLabel);
      var p = document.createElement("p");
      p.className = "xi-side-coach";
      p.textContent = coach;
      sideEl.appendChild(p);
    }
    if (bench.length) {
      title("Yedekler");
      var ul = document.createElement("ul");
      var k = benchKit();
      var ink = inkFor(k.a);
      bench.forEach(function (b) {
        var li = document.createElement("li");
        var dot = document.createElement("span");
        dot.className = "xi-mini";
        dot.style.background = kitCss(k);
        dot.style.color = ink;
        if (k.p !== "plain") dot.style.textShadow = ink === "#fff" ? "0 0 3px rgba(0,0,0,0.9)" : "0 0 3px rgba(255,255,255,0.9)";
        dot.textContent = b.no;
        var nm = document.createElement("span");
        nm.textContent = b.name.trim() || "Yedek";
        li.appendChild(dot);
        li.appendChild(nm);
        ul.appendChild(li);
      });
      sideEl.appendChild(ul);
    }
  }

  function drawPitch() {
    drawSide();
    pitchEl.querySelectorAll(".tok").forEach(function (el) { el.remove(); });
    slots.forEach(function (slot, i) {
      var k = kit(i);
      var ink = inkFor(k.a);
      var tok = document.createElement("div");
      tok.className = "tok";
      var dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = kitCss(k);
      dot.style.color = ink;
      if (k.p !== "plain") dot.style.textShadow = ink === "#fff" ? "0 0 3px rgba(0,0,0,0.9)" : "0 0 3px rgba(255,255,255,0.9)";
      dot.textContent = slot.no || labels[i];
      if (!slot.no) dot.classList.add("dim");
      tok.appendChild(dot);
      if (i === captain) {
        var cap = document.createElement("span");
        cap.className = "cap";
        cap.textContent = "K";
        cap.title = "Kaptan";
        dot.appendChild(cap);
      }
      if (slot.name.trim()) {
        var nm = document.createElement("span");
        nm.className = "nm";
        nm.textContent = slot.name.trim();
        tok.appendChild(nm);
      }
      tok.title = slot.name.trim() || labels[i];
      tok.style.left = pos[i].x + "%";
      tok.style.top = pos[i].y + "%";
      drag(tok, i);
      pitchEl.appendChild(tok);
    });
  }

  function drag(tok, i) {
    tok.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      tok.setPointerCapture(e.pointerId);
      var sx = e.clientX;
      var sy = e.clientY;
      var moved = false;
      function move(ev) {
        if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 5) return;
        moved = true;
        tok.classList.add("moving");
        var rect = pitchEl.getBoundingClientRect();
        pos[i] = {
          x: Math.min(97, Math.max(3, ((ev.clientX - rect.left) / rect.width) * 100)),
          y: Math.min(97, Math.max(3, ((ev.clientY - rect.top) / rect.height) * 100))
        };
        tok.style.left = pos[i].x + "%";
        tok.style.top = pos[i].y + "%";
      }
      function up() {
        tok.classList.remove("moving");
        tok.removeEventListener("pointermove", move);
        tok.removeEventListener("pointerup", up);
        tok.removeEventListener("pointercancel", up);
        if (moved) save();
        else {
          nameInputs[i].scrollIntoView({ block: "center", behavior: "smooth" });
          nameInputs[i].focus({ preventScroll: true });
        }
      }
      tok.addEventListener("pointermove", move);
      tok.addEventListener("pointerup", up);
      tok.addEventListener("pointercancel", up);
    });
  }

  function say(text) {
    outEl.textContent = text;
    clearTimeout(say.timer);
    say.timer = setTimeout(function () { outEl.textContent = ""; }, 2500);
  }

  function paintKit(c, k, x, y, r) {
    c.save();
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = k.a;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.fillStyle = k.b;
    var w = (r * 2) / 5;
    if (k.p === "vstripe") {
      c.fillRect(x - r + w, y - r, w, r * 2);
      c.fillRect(x - r + w * 3, y - r, w, r * 2);
    } else if (k.p === "hstripe") {
      c.fillRect(x - r, y - r + w, r * 2, w);
      c.fillRect(x - r, y - r + w * 3, r * 2, w);
    } else if (k.p === "half") {
      c.fillRect(x, y - r, r, r * 2);
    } else if (k.p === "sash") {
      c.translate(x, y);
      c.rotate(Math.PI / 4);
      c.fillRect(-0.34 * r, -2 * r, 0.68 * r, 4 * r);
    }
    c.restore();
  }

  formEl.addEventListener("change", function () {
    arrange();
    relabel();
    drawPitch();
    save();
  });
  [colorEl, color2El, gkEl].forEach(function (el) {
    if (!el) return;
    el.addEventListener("input", function () {
      drawPitch();
      save();
    });
  });
  [surfaceEl, paintEl].forEach(function (el) {
    if (!el) return;
    el.addEventListener("input", function () {
      paintSurface();
      save();
    });
  });
  if (surfaceEl && cfg.presets) {
    var swatches = document.createElement("div");
    swatches.className = "xi-swatches";
    swatches.setAttribute("role", "group");
    swatches.setAttribute("aria-label", "Hazır saha renkleri");
    cfg.presets.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "xi-swatch";
      b.title = p.name;
      b.setAttribute("aria-label", p.name);
      b.style.background = p.paint
        ? "linear-gradient(90deg, " + p.a + " 0 62%, " + p.paint + " 62%)"
        : p.a;
      b.addEventListener("click", function () {
        surfaceEl.value = p.a;
        if (paintEl && p.paint) paintEl.value = p.paint;
        paintSurface();
        save();
      });
      swatches.appendChild(b);
    });
    var host = surfaceEl.closest(".row-2, .row-3") || surfaceEl.parentNode;
    host.parentNode.insertBefore(swatches, host.nextSibling);
  }
  patternEl.addEventListener("change", function () {
    color2El.disabled = patternEl.value === "plain";
    drawPitch();
    save();
  });
  nameEl.addEventListener("input", save);
  coachEl.addEventListener("input", function () {
    drawSide();
    save();
  });
  capEl.addEventListener("change", function () {
    captain = Number(capEl.value);
    drawPitch();
    save();
  });

  document.getElementById("xi-reset").addEventListener("click", function () {
    arrange();
    relabel();
    drawPitch();
    save();
  });

  document.getElementById("xi-clear").addEventListener("click", function () {
    if (!confirm("Oyuncular, yedekler ve takım bilgisi silinsin mi?")) return;
    slots.forEach(function (s) { s.no = ""; s.name = ""; });
    nameEl.value = "";
    coachEl.value = "";
    bench = [];
    captain = -1;
    arrange();
    buildSlots();
    buildBench();
    drawPitch();
    save();
  });

  document.getElementById("xi-link").addEventListener("click", function () {
    var url = location.origin + location.pathname + "#t=" + encode(state());
    navigator.clipboard.writeText(url).then(function () {
      say("Bağlantı kopyalandı. Açan kişi aynı kadroyu görür.");
    }, function () {
      say("Kopyalanamadı.");
    });
  });

  document.getElementById("xi-png").addEventListener("click", function () {
    var W = 1080;
    var font = "Sora, 'Segoe UI', sans-serif";
    var bench = benchList();
    var coach = coachEl.value.trim();
    var side = bench.length || coach;
    var PW = 760;
    var PH = PW * cfg.ratio;
    var PX = side ? 40 : (W - PW) / 2;
    var PY = 170;
    var sideH = (coach ? 100 : 0) + (bench.length ? 40 + bench.length * 36 : 0);
    var H = Math.round(Math.max(PY + PH, PY + sideH) + 50);
    var canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    var c = canvas.getContext("2d");
    var S = PW / 100;

    c.fillStyle = "#0f172a";
    c.fillRect(0, 0, W, H);
    c.textBaseline = "middle";
    c.fillStyle = "#fff";
    c.font = "700 52px " + font;
    c.textAlign = "left";
    fitText(nameEl.value.trim() || cfg.title, 40, 70, W - 80);
    c.font = "600 30px " + font;
    c.fillStyle = "rgba(255,255,255,0.7)";
    c.fillText(formEl.value, 40, 122);

    c.save();
    cfg.field(c, PX, PY, S, surface());
    c.restore();

    c.textAlign = "center";
    slots.forEach(function (slot, i) {
      var x = PX + (pos[i].x / 100) * PW;
      var y = PY + (pos[i].y / 100) * PH;
      var k = kit(i);
      var ink = inkFor(k.a);
      paintKit(c, k, x, y, 30);
      c.beginPath();
      c.arc(x, y, 30, 0, Math.PI * 2);
      c.lineWidth = 4;
      c.strokeStyle = "#fff";
      c.stroke();
      c.font = "700 " + (slot.no ? 26 : 18) + "px " + font;
      if (k.p !== "plain") {
        c.lineWidth = 5;
        c.strokeStyle = ink === "#fff" ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.75)";
        c.strokeText(slot.no || labels[i], x, y + 1);
      }
      c.fillStyle = ink;
      c.fillText(slot.no || labels[i], x, y + 1);
      if (i === captain) {
        c.beginPath();
        c.arc(x + 24, y - 24, 13, 0, Math.PI * 2);
        c.fillStyle = "#facc15";
        c.fill();
        c.lineWidth = 2;
        c.strokeStyle = "#111";
        c.stroke();
        c.fillStyle = "#111";
        c.font = "800 15px " + font;
        c.fillText("K", x + 24, y - 23);
      }
      var label = slot.name.trim();
      if (!label) return;
      c.font = "600 22px " + font;
      var w = c.measureText(label).width + 18;
      c.fillStyle = "rgba(0,0,0,0.6)";
      c.fillRect(x - w / 2, y + 38, w, 32);
      c.fillStyle = "#fff";
      c.fillText(label, x, y + 55);
    });

    if (side) {
      var y = PY + 10;
      c.textAlign = "left";
      if (coach) {
        c.fillStyle = "rgba(255,255,255,0.6)";
        c.font = "600 22px " + font;
        c.fillText(cfg.coachLabel, 830, y);
        c.fillStyle = "#fff";
        c.font = "600 26px " + font;
        fitText(coach, 830, y + 36, 210);
        y += 100;
      }
      if (bench.length) {
        c.fillStyle = "rgba(255,255,255,0.6)";
        c.font = "600 22px " + font;
        c.fillText("Yedekler", 830, y);
        var bk = benchKit();
        var bink = inkFor(bk.a);
        bench.forEach(function (b, n) {
          var by = y + 40 + n * 36;
          paintKit(c, bk, 845, by, 15);
          c.beginPath();
          c.arc(845, by, 15, 0, Math.PI * 2);
          c.lineWidth = 2;
          c.strokeStyle = "#fff";
          c.stroke();
          if (b.no) {
            c.textAlign = "center";
            c.font = "700 14px " + font;
            if (bk.p !== "plain") {
              c.lineWidth = 3;
              c.strokeStyle = bink === "#fff" ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.75)";
              c.strokeText(b.no, 845, by + 1);
            }
            c.fillStyle = bink;
            c.fillText(b.no, 845, by + 1);
            c.textAlign = "left";
          }
          c.fillStyle = "#fff";
          c.font = "500 24px " + font;
          fitText(b.name.trim() || "Yedek", 870, by, 175);
        });
      }
    }

    function fitText(text, x, y, max) {
      var t = text;
      while (t.length > 1 && c.measureText(t).width > max) t = t.slice(0, -1);
      c.fillText(t === text ? t : t + "…", x, y);
    }

    canvas.toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (nameEl.value.trim() || cfg.title).replace(/[\\/:*?"<>|]+/g, "") + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
  });

  arrange();
  var loaded = false;
  var match = location.hash.match(/^#t=([\w-]+)$/);
  if (match) {
    try {
      apply(decode(match[1]));
      loaded = true;
    } catch (e) {}
  }
  if (!loaded) {
    try { apply(JSON.parse(localStorage.getItem(cfg.key) || "null")); } catch (e) {}
  }
  color2El.disabled = patternEl.value === "plain";
  paintSurface();
  buildSlots();
  buildBench();
  drawPitch();
};
