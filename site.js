(function () {
  var tools = [
    ["ATS CV", "/araclar/cv/", "Özgeçmiş yaz, PDF al", "cv ozgecmis resume"],
    ["QR Kod", "/araclar/qr/", "Metinden QR, PNG veya SVG", "qr karekod"],
    ["Zar", "/araclar/zar/", "Zar at, yazı tura", "zar dice yazi tura"],
    ["Rastgele Sayı", "/araclar/sayi/", "Aralıktan sayı çek", "random sayi kura"],
    ["Listeden Seç", "/araclar/sec/", "Satırlardan rastgele seç", "sec liste kura cekilis"],
    ["Kadro", "/araclar/kadro/", "Halı saha takımı kur", "halisaha hali saha kadro takim kaptan mac futbol"],
    ["İlk 11", "/araclar/ilk11/", "Futbol on birini sahaya diz", "ilk 11 onbir kadro dizilis takim futbol forma"],
    ["İlk 5", "/araclar/ilk5/", "Basketbol beşini sahaya diz", "ilk 5 bes basketbol basket kadro takim forma pota"],
    ["JSON", "/araclar/json/", "Hizala, sıkıştır, hatayı bul", "json format"],
    ["Base64", "/araclar/base64/", "Kodla veya çöz", "base64"],
    ["URL", "/araclar/url/", "Adresi kodla veya çöz", "url encode decode"],
    ["Case", "/araclar/case/", "camelCase, snake_case, kebab-case", "case camel snake kebab harf"],
    ["Slug", "/araclar/slug/", "Başlığı adrese çevir", "slug adres"],
    ["JWT", "/araclar/jwt/", "Header ve payload oku", "jwt token"],
    ["Diff", "/araclar/diff/", "İki metnin farkı", "diff fark karsilastir compare"],
    ["Regex", "/araclar/regex/", "Deseni metinde dene", "regex regexp duzenli ifade"],
    ["Resim", "/araclar/resim/", "Küçült, sıkıştır, format değiştir", "resim gorsel foto image compress sikistir kucult boyut jpeg jpg webp png donustur"],
    ["Video", "/araclar/video/", "Küçült, sıkıştır, MP4 yap", "video compress compressor sikistir kucult mp4 mov webm boyut"],
    ["Unix", "/araclar/unix/", "Timestamp ve tarih", "unix timestamp epoch zaman"],
    ["Cron", "/araclar/cron/", "İfadeyi cümleye çevir", "cron zamanlama"],
    ["Yaş", "/araclar/yas/", "Doğum tarihinden yaş", "yas dogum gunu"],
    ["Tarih Farkı", "/araclar/tarih/", "İki tarih arası", "tarih fark gun"],
    ["Saat Farkı", "/araclar/saat/", "İki saat arası", "saat dakika fark"],
    ["Tarih Ekle", "/araclar/gun/", "Tarihe gün, ay, yıl ekle", "tarih ekle gun ay yil"],
    ["İş Günü", "/araclar/isgunu/", "Tatiller düşülmüş iş günü", "is gunu resmi tatil bayram"],
    ["Base", "/araclar/taban/", "Decimal, hex, binary", "base taban hex binary decimal ikili onluk"],
    ["Renk", "/araclar/renk/", "Hex, RGB, Unity Color", "renk color hex rgb unity"],
    ["Quaternion", "/araclar/quaternion/", "Euler ve quaternion", "quaternion euler unity rotation"],
    ["UUID", "/araclar/uuid/", "Rastgele UUID üret", "uuid guid"],
    ["Parola", "/araclar/parola/", "Güçlü parola üret", "parola sifre password"],
    ["TC No", "/araclar/tc/", "Kontrol basamaklı no üret", "tc kimlik"],
    ["IBAN", "/araclar/iban/", "IBAN denetle", "iban banka"],
    ["Plaka ve Posta Kodu", "/araclar/il/", "İl, plaka, posta kodu başı", "plaka posta kodu il sehir il kodu ptt"],
    ["SHA-256 Hash", "/araclar/hash/", "Metnin SHA-256 değeri", "sha sha256 hash"],
    ["Password Hash", "/araclar/bcrypt/", "bcrypt üret, denetle", "bcrypt password hash parola"],
    ["Döviz", "/araclar/doviz/", "Anlık kurla çevir", "doviz kur dolar euro"],
    ["TCMB Bülteni", "/araclar/tcmb/", "Dolar, euro, gram altın", "tcmb merkez bankasi dolar euro altin"],
    ["Fon Stopajı", "/araclar/fon/", "Fon kazancının stopajı", "fon stopaj vergi"],
    ["KDV", "/araclar/kdv/", "KDV ekle veya ayır", "kdv vergi"],
    ["Faiz", "/araclar/faiz/", "Basit veya bileşik faiz", "faiz bilesik"],
    ["Vadeli Hesap", "/araclar/vadeli/", "Net getiri, stopaj", "vadeli mevduat faiz"],
    ["İndirim", "/araclar/indirim/", "İndirimli tutar", "indirim yuzde"],
    ["Taksit", "/araclar/taksit/", "Aylık taksit, toplam", "taksit kredi"]
  ];

  var enterTarget = {
    "base-dec": "from-dec", "base-hex": "from-hex", "base-bin": "from-bin",
    "color-hex": "from-hex", "color-r": "from-rgb", "color-g": "from-rgb", "color-b": "from-rgb",
    "color-unity": "from-unity",
    "eu-x": "to-quat", "eu-y": "to-quat", "eu-z": "to-quat",
    "q-x": "to-euler", "q-y": "to-euler", "q-z": "to-euler", "q-w": "to-euler",
    "unix-in": "unix-from", "unix-date": "date-from", "unix-time": "date-from",
    "tc-out": "tc-check", "iban-out": "iban-check"
  };

  var moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>';
  var sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
  var lens = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="m15.5 15.5 4 4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || "");

  function fold(s) {
    return s.toLocaleLowerCase("tr")
      .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
      .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");
  }

  function matches(tool, words) {
    var hay = fold(tool[0] + " " + tool[2] + " " + tool[3]);
    return words.every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function words(q) {
    return fold(q).split(/\s+/).filter(Boolean);
  }

  function isDark() {
    return document.documentElement.dataset.theme === "dark";
  }

  function paintTheme() {
    var dark = isDark();
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#12161c" : "#d5dce6");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.innerHTML = dark ? sun : moon;
      btn.setAttribute("aria-label", dark ? "Açık tema" : "Koyu tema");
      btn.title = dark ? "Açık tema" : "Koyu tema";
    });
  }

  function setTheme(dark) {
    if (dark) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("ek-theme", dark ? "dark" : "light"); } catch (e) {}
    paintTheme();
  }

  var back = null;
  var input = null;
  var list = null;
  var hits = [];
  var cursor = 0;

  function closeSearch() {
    if (back && !back.hidden) {
      back.hidden = true;
      document.body.style.overflow = "";
    }
  }

  function draw() {
    list.innerHTML = "";
    if (!hits.length) {
      var none = document.createElement("p");
      none.className = "cmd-empty";
      none.textContent = "Araç bulunamadı.";
      list.appendChild(none);
      return;
    }
    hits.forEach(function (tool, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "option");
      if (i === cursor) {
        btn.className = "on";
        btn.setAttribute("aria-selected", "true");
      }
      btn.textContent = tool[0];
      var desc = document.createElement("span");
      desc.textContent = tool[2];
      btn.appendChild(desc);
      btn.addEventListener("click", function () { location.href = tool[1]; });
      list.appendChild(btn);
    });
    var on = list.querySelector(".on");
    if (on) on.scrollIntoView({ block: "nearest" });
  }

  function search(q) {
    var w = words(q);
    hits = tools.filter(function (tool) { return matches(tool, w); });
    cursor = 0;
    draw();
  }

  function openSearch() {
    if (!back) return;
    back.hidden = false;
    document.body.style.overflow = "hidden";
    input.value = "";
    search("");
    input.focus();
  }

  function mount(parent) {
    if (!parent || parent.querySelector("[data-ek]")) return;
    var theme = document.createElement("button");
    theme.type = "button";
    theme.className = "ghost";
    theme.setAttribute("data-ek", "theme");
    theme.setAttribute("data-theme-toggle", "");
    theme.addEventListener("click", function () { setTheme(!isDark()); });
    var find = document.createElement("button");
    find.type = "button";
    find.className = "ghost";
    find.setAttribute("data-ek", "search");
    find.setAttribute("aria-label", "Araç ara");
    find.innerHTML = lens;
    find.title = "Ara (" + (mac ? "⌘K" : "Ctrl K") + ")";
    find.addEventListener("click", openSearch);
    parent.appendChild(find);
    parent.appendChild(theme);
  }

  mount(document.querySelector(".nav"));
  mount(document.querySelector(".cv-top-actions"));
  paintTheme();

  back = document.createElement("div");
  back.className = "cmd-back";
  back.hidden = true;
  var box = document.createElement("div");
  box.className = "cmd";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Araç ara");
  input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Araç ara: JWT, KDV, tarih…";
  input.setAttribute("aria-label", "Araç ara");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("spellcheck", "false");
  list = document.createElement("div");
  list.className = "cmd-list";
  list.setAttribute("role", "listbox");
  var foot = document.createElement("p");
  foot.className = "cmd-foot";
  foot.textContent = "↑ ↓ seç · Enter aç · Esc kapat";
  box.appendChild(input);
  box.appendChild(list);
  box.appendChild(foot);
  back.appendChild(box);
  document.body.appendChild(back);

  back.addEventListener("click", function (e) { if (e.target === back) closeSearch(); });
  input.addEventListener("input", function () { search(input.value); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hits.length) { cursor = (cursor + 1) % hits.length; draw(); }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hits.length) { cursor = (cursor - 1 + hits.length) % hits.length; draw(); }
    } else if (e.key === "Enter" && hits[cursor]) {
      location.href = hits[cursor][1];
    }
  });

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (back.hidden) openSearch();
      else closeSearch();
      return;
    }
    if (e.key === "Escape") {
      closeSearch();
      return;
    }
    if (e.key === "/" && back.hidden) {
      var t = e.target;
      var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (!typing) {
        e.preventDefault();
        var filter = document.querySelector(".tool-filter");
        if (filter) filter.focus();
        else openSearch();
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.defaultPrevented || e.isComposing) return;
    var t = e.target;
    if (!t || t.tagName !== "INPUT" || !back.hidden) return;
    if (t.closest(".cmd") || t.classList.contains("tool-filter")) return;
    if (!/^(text|number|password|search)$/.test(t.type)) return;
    var btn = null;
    if (enterTarget[t.id]) btn = document.getElementById(enterTarget[t.id]);
    if (!btn) {
      var scope = t.closest(".wrap, .panel, main") || document;
      btn = scope.querySelector(".actions button:not(.ghost):not(:disabled)");
    }
    if (btn && !btn.disabled) {
      e.preventDefault();
      btn.click();
    }
  });

  var filter = document.querySelector(".tool-filter");
  if (filter) {
    var byHref = {};
    tools.forEach(function (tool) { byHref[tool[1]] = tool; });
    var cards = Array.prototype.slice.call(document.querySelectorAll("a.tool"));
    var groups = Array.prototype.slice.call(document.querySelectorAll(".tool-group"));
    var empty = document.createElement("p");
    empty.className = "tool-empty";
    empty.textContent = "Araç bulunamadı.";
    empty.hidden = true;
    filter.parentNode.insertBefore(empty, filter.nextSibling);

    var apply = function () {
      var w = words(filter.value);
      var shown = 0;
      cards.forEach(function (card) {
        var tool = byHref[card.getAttribute("href")];
        var ok = tool ? matches(tool, w) : matches([card.textContent, "", "", ""], w);
        card.hidden = !ok;
        if (ok) shown++;
      });
      groups.forEach(function (group) {
        group.hidden = !group.querySelector("a.tool:not([hidden])");
      });
      empty.hidden = shown > 0;
    };

    filter.addEventListener("input", apply);
    filter.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var first = document.querySelector("a.tool:not([hidden])");
        if (first) location.href = first.getAttribute("href");
      } else if (e.key === "Escape") {
        filter.value = "";
        apply();
        filter.blur();
      }
    });
  }
})();
