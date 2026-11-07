window.Lineup = function (cfg) {
  var nameEl = document.getElementById("xi-name");
  var coachEl = document.getElementById("xi-coach");
  var formEl = document.getElementById("xi-form");
  var colorEl = document.getElementById("xi-color");
  var color2El = document.getElementById("xi-color2");
  var patternEl = document.getElementById("xi-pattern");
  var gkEl = document.getElementById("xi-gk");
  var pitchEl = document.getElementById("xi-pitch");
  var slotsEl = document.getElementById("xi-slots");
  var benchEl = document.getElementById("xi-bench");
  var outEl = document.getElementById("xi-out");
  var HEX = /^#[0-9a-f]{6}$/i;
  var PATTERNS = { plain: 1, vstripe: 1, hstripe: 1, half: 1, sash: 1 };

  var count = cfg.shapes[cfg.initial].length;
  var slots = [];
  var pos = [];
  var labels = [];
  var nameInputs = [];
  for (var i = 0; i < count; i++) slots.push({ no: "", name: "" });

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
      s: slots.map(function (s) { return [s.no, s.name]; }),
      p: pos.map(function (p) { return [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]; }),
      b: benchEl.value
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
    benchEl.value = String(data.b || "").slice(0, 600);
    arrange();
    if (Array.isArray(data.s)) {
      data.s.slice(0, count).forEach(function (s, i) {
        slots[i] = { no: String((s && s[0]) || "").replace(/\D/g, "").slice(0, 2), name: String((s && s[1]) || "").slice(0, 40) };
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
      var tag = document.createElement("span");
      tag.className = "xi-pos";
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
          else benchEl.focus();
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
      slotsEl.children[i].firstChild.textContent = labels[i];
      input.placeholder = isKeeper(i) ? "Kaleci" : "Oyuncu";
      input.setAttribute("aria-label", labels[i] + " oyuncusu");
    });
  }

  function drawPitch() {
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
  patternEl.addEventListener("change", function () {
    color2El.disabled = patternEl.value === "plain";
    drawPitch();
    save();
  });
  [nameEl, coachEl, benchEl].forEach(function (el) {
    el.addEventListener("input", save);
  });

  document.getElementById("xi-reset").addEventListener("click", function () {
    arrange();
    drawPitch();
    save();
  });

  document.getElementById("xi-clear").addEventListener("click", function () {
    if (!confirm("Oyuncular, yedekler ve takım bilgisi silinsin mi?")) return;
    slots.forEach(function (s) { s.no = ""; s.name = ""; });
    nameEl.value = "";
    coachEl.value = "";
    benchEl.value = "";
    arrange();
    buildSlots();
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
    var bench = benchEl.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 20);
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
    cfg.field(c, PX, PY, S);
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
        c.fillStyle = "#fff";
        c.font = "500 24px " + font;
        bench.forEach(function (b, n) {
          fitText(b, 830, y + 40 + n * 36, 210);
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
  buildSlots();
  drawPitch();
};
