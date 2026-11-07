(function () {
  var KEY = "ek-ses";
  var on = true;
  try { on = localStorage.getItem(KEY) !== "0"; } catch (e) {}
  var ctx = null;

  function audio() {
    if (!ctx) {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ctx = new A();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(c, freq, dur, opts) {
    opts = opts || {};
    var t = c.currentTime + (opts.delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    var vol = opts.vol || 0.12;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(c, dur, opts) {
    opts = opts || {};
    var t = c.currentTime + (opts.delay || 0);
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource();
    src.buffer = buf;
    var filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = opts.freq || 1200;
    var gain = c.createGain();
    gain.gain.value = opts.vol || 0.25;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
  }

  function notes(c, list, step, opts) {
    list.forEach(function (f, i) {
      tone(c, f, step * 1.6, Object.assign({}, opts, { delay: i * step }));
    });
  }

  var SOUNDS = {
    move: function (c) { tone(c, 220, 0.06, { type: "triangle", vol: 0.06 }); },
    merge: function (c, n) { tone(c, 330 + Math.min(11, n || 1) * 45, 0.09, { type: "triangle", vol: 0.1 }); },
    tap: function (c) { tone(c, 660, 0.05, { type: "square", vol: 0.04 }); },
    open: function (c) { tone(c, 520, 0.05, { type: "triangle", vol: 0.07, to: 760 }); },
    flag: function (c) { tone(c, 880, 0.07, { type: "square", vol: 0.05, to: 1180 }); },
    unflag: function (c) { tone(c, 900, 0.07, { type: "square", vol: 0.05, to: 600 }); },
    boom: function (c) { noise(c, 0.6, { freq: 600, vol: 0.5 }); tone(c, 140, 0.5, { type: "sawtooth", vol: 0.12, to: 40 }); },
    eat: function (c) { tone(c, 600, 0.08, { type: "square", vol: 0.06, to: 1000 }); },
    turn: function (c) { tone(c, 300, 0.03, { type: "triangle", vol: 0.03 }); },
    flip: function (c) { tone(c, 420, 0.05, { type: "triangle", vol: 0.07, to: 560 }); },
    match: function (c) { notes(c, [660, 990], 0.08, { type: "triangle", vol: 0.09 }); },
    nomatch: function (c) { tone(c, 260, 0.14, { type: "triangle", vol: 0.07, to: 200 }); },
    kick: function (c) { noise(c, 0.08, { freq: 900, vol: 0.4 }); tone(c, 120, 0.1, { vol: 0.2, to: 60 }); },
    goal: function (c) { noise(c, 0.9, { freq: 2500, vol: 0.12 }); notes(c, [523, 659, 784], 0.1, { type: "triangle", vol: 0.1 }); },
    save: function (c) { noise(c, 0.12, { freq: 500, vol: 0.4 }); tone(c, 330, 0.25, { type: "triangle", vol: 0.08, to: 220 }); },
    post: function (c) { tone(c, 1400, 0.35, { type: "triangle", vol: 0.08, to: 1300 }); },
    wait: function (c) { tone(c, 300, 0.08, { type: "sine", vol: 0.06 }); },
    go: function (c) { tone(c, 1000, 0.12, { type: "square", vol: 0.06 }); },
    early: function (c) { tone(c, 180, 0.25, { type: "sawtooth", vol: 0.07, to: 120 }); },
    win: function (c) { notes(c, [523, 659, 784, 1047], 0.11, { type: "triangle", vol: 0.1 }); },
    lose: function (c) { notes(c, [392, 330, 262], 0.15, { type: "triangle", vol: 0.09 }); }
  };

  window.ekSes = function (name, arg) {
    if (!on || !SOUNDS[name]) return;
    var c = audio();
    if (!c) return;
    try { SOUNDS[name](c, arg); } catch (e) {}
  };

  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';

  var title = document.querySelector(".page-title");
  if (!title) return;
  var head = document.createElement("div");
  head.className = "game-head";
  title.parentNode.insertBefore(head, title);
  head.appendChild(title);
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ghost game-sound";
  function paint() {
    btn.innerHTML = on ? ICON_ON : ICON_OFF;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Sesi kapat" : "Sesi aç");
    btn.title = on ? "Sesi kapat" : "Sesi aç";
  }
  paint();
  btn.addEventListener("click", function () {
    on = !on;
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    paint();
    if (on) window.ekSes("tap");
  });
  head.appendChild(btn);
})();
