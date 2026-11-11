// İki oyunculu PeerJS katmanı. Unity'ye olayları "Network" nesnesindeki OnNetEvent ile iletir.
(function () {
  var PREFIX = "patates-coop-";
  var ROOM_PATTERN = /^[a-z0-9]{8,32}$/;
  var state = { peer: null, conn: null, role: "none", room: "", link: "", queue: [], timer: 0 };

  function emit(event) {
    var text = JSON.stringify(event);
    if (window.potatoUnity) {
      try { window.potatoUnity.SendMessage("Network", "OnNetEvent", text); }
      catch (error) { console.warn("[Patates] Unity mesajı iletilemedi", error); }
    } else {
      state.queue.push(text);
    }
  }

  function flush() {
    if (!window.potatoUnity) return;
    var pending = state.queue;
    state.queue = [];
    for (var i = 0; i < pending.length; i++) {
      window.potatoUnity.SendMessage("Network", "OnNetEvent", pending[i]);
    }
  }

  function randomRoom() {
    var alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
    var bytes = new Uint8Array(14);
    window.crypto.getRandomValues(bytes);
    var id = "";
    for (var i = 0; i < bytes.length; i++) id += alphabet[bytes[i] % alphabet.length];
    return id;
  }

  function inviteLink(room) {
    var url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("room", room);
    return url.toString();
  }

  function clearTimer() {
    if (state.timer) clearTimeout(state.timer);
    state.timer = 0;
  }

  // Kalp atışı JS tarafında: arka plandaki sekmede Unity kare çizmese de bağlantı canlı görünür.
  function wire(conn, onClose) {
    var beat = 0;
    conn.on("open", function () {
      beat = setInterval(function () {
        if (conn.open) { try { conn.send("{\"t\":\"ping\"}"); } catch (e) {} }
      }, 1000);
    });
    conn.on("data", function (data) {
      emit({ t: "data", d: typeof data === "string" ? data : JSON.stringify(data) });
    });
    conn.on("close", function () {
      if (beat) clearInterval(beat);
      onClose();
    });
    conn.on("error", function (error) {
      emit({ t: "error", s: "connection", m: String(error && error.message || error) });
    });
  }

  function destroy() {
    clearTimer();
    if (state.conn) { try { state.conn.close(); } catch (e) {} }
    if (state.peer) { try { state.peer.destroy(); } catch (e) {} }
    state.conn = null;
    state.peer = null;
    state.role = "none";
    state.room = "";
    state.link = "";
  }

  function peerOptions() {
    return { debug: 1 };
  }

  var api = {
    available: function () {
      return typeof window.Peer === "function";
    },

    host: function () {
      if (!api.available()) { emit({ t: "error", s: "no-peerjs", m: "PeerJS yüklenmedi" }); return; }
      destroy();
      state.role = "host";
      state.room = randomRoom();
      var peer = new window.Peer(PREFIX + state.room, peerOptions());
      state.peer = peer;
      peer.on("open", function () {
        state.link = inviteLink(state.room);
        emit({ t: "hosting", room: state.room, link: state.link });
      });
      peer.on("connection", function (conn) {
        if (state.conn && state.conn.open) {
          conn.on("open", function () {
            conn.send(JSON.stringify({ t: "full" }));
            setTimeout(function () { try { conn.close(); } catch (e) {} }, 600);
          });
          return;
        }
        state.conn = conn;
        conn.on("open", function () { emit({ t: "peer-open" }); });
        wire(conn, function () {
          if (state.conn === conn) state.conn = null;
          emit({ t: "peer-close" });
        });
      });
      peer.on("disconnected", function () {
        if (state.peer === peer && !peer.destroyed) {
          try { peer.reconnect(); } catch (e) {}
        }
      });
      peer.on("error", function (error) {
        emit({ t: "error", s: error.type || "peer", m: String(error.message || error) });
      });
    },

    join: function (room) {
      if (!api.available()) { emit({ t: "error", s: "no-peerjs", m: "PeerJS yüklenmedi" }); return; }
      room = String(room || "").trim().toLowerCase();
      if (!ROOM_PATTERN.test(room)) { emit({ t: "error", s: "bad-room", m: "Oda kodu geçersiz" }); return; }
      destroy();
      state.role = "client";
      state.room = room;
      var peer = new window.Peer(peerOptions());
      state.peer = peer;
      peer.on("open", function () {
        var conn = peer.connect(PREFIX + room, { reliable: true });
        state.conn = conn;
        conn.on("open", function () {
          clearTimer();
          emit({ t: "connected", room: room });
        });
        wire(conn, function () {
          if (state.conn === conn) state.conn = null;
          emit({ t: "host-close" });
        });
      });
      peer.on("error", function (error) {
        clearTimer();
        emit({ t: "error", s: error.type || "peer", m: String(error.message || error) });
      });
      state.timer = setTimeout(function () {
        if (!state.conn || !state.conn.open) emit({ t: "error", s: "timeout", m: "Bağlantı zaman aşımına uğradı" });
      }, 20000);
    },

    send: function (text) {
      if (state.conn && state.conn.open) state.conn.send(text);
    },

    kick: function () {
      if (state.role === "host" && state.conn) {
        try { state.conn.close(); } catch (e) {}
        state.conn = null;
      }
    },

    leave: function () {
      destroy();
    },

    copy: function (text) {
      function fallback() {
        var area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) {}
        area.remove();
        emit({ t: "copied", ok: ok });
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { emit({ t: "copied", ok: true }); }, fallback);
      } else {
        fallback();
      }
    },

    roomFromUrl: function () {
      try {
        var room = new URLSearchParams(window.location.search).get("room") || "";
        room = room.trim().toLowerCase();
        return ROOM_PATTERN.test(room) ? room : "";
      } catch (e) {
        return "";
      }
    },

    info: function () {
      return { role: state.role, room: state.room, link: state.link, open: !!(state.conn && state.conn.open) };
    },

    attach: function (instance) {
      window.potatoUnity = instance;
      flush();
    }
  };

  window.addEventListener("beforeunload", function () { destroy(); });
  window.PotatoNet = api;
})();
