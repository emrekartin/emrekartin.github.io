(function () {
  var PREFIX = "emrekartin-";

  function code() {
    var abc = "abcdefghijkmnpqrstuvwxyz23456789", out = "";
    var bytes = crypto.getRandomValues(new Uint8Array(10));
    for (var i = 0; i < bytes.length; i++) out += abc[bytes[i] % abc.length];
    return out;
  }

  function roomFromHash() {
    var m = /(?:^#|&)oda=([a-z0-9]{6,20})/.exec(location.hash);
    return m ? m[1] : "";
  }

  window.ekOnline = function (opts) {
    var box = opts.box;
    var peer = null, conn = null, role = "", room = "";

    box.innerHTML =
      '<p class="online-status" aria-live="polite"></p>' +
      '<div class="online-link" hidden><input type="text" readonly aria-label="Davet linki" /><button type="button">Kopyala</button></div>';
    var statusEl = box.querySelector(".online-status");
    var linkBox = box.querySelector(".online-link");
    var linkInput = linkBox.querySelector("input");
    var copyBtn = linkBox.querySelector("button");

    function status(text) {
      statusEl.textContent = text;
    }

    copyBtn.addEventListener("click", function () {
      linkInput.select();
      (navigator.clipboard ? navigator.clipboard.writeText(linkInput.value) : Promise.reject())
        .catch(function () { document.execCommand("copy"); })
        .then(function () {
          copyBtn.textContent = "Kopyalandı";
          setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1500);
        });
    });

    function wire(c) {
      conn = c;
      c.on("open", function () {
        linkBox.hidden = true;
        status(role === "host" ? "Rakip bağlandı. Oyun başladı." : "Bağlandın. Oyun başladı.");
        opts.onStart(role);
      });
      c.on("data", function (msg) {
        if (msg && typeof msg === "object") opts.onMessage(msg);
      });
      c.on("close", function () {
        if (conn !== c) return;
        conn = null;
        status("Rakibin bağlantısı koptu.");
        opts.onEnd();
      });
      c.on("error", function () {
        status("Bağlantı hatası.");
      });
    }

    function makePeer(id) {
      if (typeof Peer === "undefined") {
        status("Online bağlantı kütüphanesi yüklenemedi.");
        return null;
      }
      return id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
    }

    function host() {
      close();
      role = "host";
      room = code();
      box.hidden = false;
      status("Oda hazırlanıyor…");
      peer = makePeer(PREFIX + opts.game + "-" + room);
      if (!peer) return;
      peer.on("open", function () {
        var url = location.origin + location.pathname + "#oda=" + room;
        linkInput.value = url;
        linkBox.hidden = false;
        status("Bu linki rakibine gönder. O açınca oyun başlar.");
      });
      peer.on("connection", function (c) {
        if (conn) {
          c.on("open", function () { c.send({ t: "full" }); setTimeout(function () { c.close(); }, 300); });
          return;
        }
        wire(c);
      });
      peer.on("error", function (err) {
        status("Bağlantı kurulamadı (" + (err && err.type || "hata") + ").");
      });
    }

    function join(r) {
      close();
      role = "guest";
      room = r;
      box.hidden = false;
      status("Odaya bağlanılıyor…");
      peer = makePeer();
      if (!peer) return;
      peer.on("open", function () {
        wire(peer.connect(PREFIX + opts.game + "-" + room, { reliable: true }));
      });
      peer.on("error", function (err) {
        var type = err && err.type;
        status(type === "peer-unavailable" ? "Oda bulunamadı. Linki gönderen kişi sayfayı kapatmış olabilir." : "Bağlantı kurulamadı (" + (type || "hata") + ").");
      });
    }

    function close() {
      if (conn) { var c = conn; conn = null; try { c.close(); } catch (e) {} }
      if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
      role = "";
    }

    function leave() {
      close();
      box.hidden = true;
      linkBox.hidden = true;
      if (roomFromHash()) history.replaceState(null, "", location.pathname + location.search);
    }

    window.addEventListener("beforeunload", close);

    var api = {
      host: host,
      leave: leave,
      send: function (msg) { if (conn && conn.open) conn.send(msg); },
      connected: function () { return !!(conn && conn.open); },
      role: function () { return role; },
      pending: function () { return !!roomFromHash(); }
    };

    var r = roomFromHash();
    if (r) setTimeout(function () { join(r); }, 0);
    return api;
  };
})();
