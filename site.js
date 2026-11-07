(function () {
  var tools = [
    ["ATS CV", "/araclar/cv/", "cv ozgecmis"],
    ["QR Kod", "/araclar/qr/", "qr"],
    ["Zar", "/araclar/zar/", "zar yazi tura"],
    ["Rastgele Sayı", "/araclar/sayi/", "random sayi"],
    ["Listeden Seç", "/araclar/sec/", "sec liste"],
    ["JSON", "/araclar/json/", "json"],
    ["Base64", "/araclar/base64/", "base64"],
    ["URL", "/araclar/url/", "url encode"],
    ["Case", "/araclar/case/", "camel snake kebab"],
    ["Slug", "/araclar/slug/", "slug"],
    ["JWT", "/araclar/jwt/", "jwt token"],
    ["Diff", "/araclar/diff/", "diff fark karsilastir"],
    ["Regex", "/araclar/regex/", "regex regexp"],
    ["Unix", "/araclar/unix/", "unix timestamp zaman"],
    ["Cron", "/araclar/cron/", "cron"],
    ["Yaş", "/araclar/yas/", "yas"],
    ["Tarih Farkı", "/araclar/tarih/", "tarih"],
    ["Saat Farkı", "/araclar/saat/", "saat"],
    ["Tarih Ekle", "/araclar/gun/", "tarih ekle"],
    ["İş Günü", "/araclar/isgunu/", "is gunu tatil"],
    ["Base", "/araclar/taban/", "base hex binary decimal"],
    ["Renk", "/araclar/renk/", "renk color hex rgb"],
    ["Quaternion", "/araclar/quaternion/", "quaternion euler unity"],
    ["UUID", "/araclar/uuid/", "uuid"],
    ["Parola", "/araclar/parola/", "parola password"],
    ["TC No", "/araclar/tc/", "tc kimlik"],
    ["IBAN", "/araclar/iban/", "iban"],
    ["SHA-256 Hash", "/araclar/hash/", "sha hash"],
    ["Password Hash", "/araclar/bcrypt/", "bcrypt password hash"],
    ["Döviz", "/araclar/doviz/", "doviz kur"],
    ["TCMB Bülteni", "/araclar/tcmb/", "tcmb dolar euro altin"],
    ["Fon Stopajı", "/araclar/fon/", "fon stopaj"],
    ["KDV", "/araclar/kdv/", "kdv"],
    ["Faiz", "/araclar/faiz/", "faiz"],
    ["Vadeli Hesap", "/araclar/vadeli/", "vadeli"],
    ["İndirim", "/araclar/indirim/", "indirim"],
    ["Taksit", "/araclar/taksit/", "taksit"]
  ];

  function fold(s) {
    return s.toLocaleLowerCase("tr")
      .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
      .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");
  }

  function paintTheme() {
    var dark = document.documentElement.dataset.theme === "dark";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#12161c" : "#d5dce6");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.textContent = dark ? "Açık" : "Koyu";
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
    if (back) back.hidden = true;
  }

  function draw() {
    list.innerHTML = "";
    hits.forEach(function (tool, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = tool[0];
      if (i === cursor) btn.className = "on";
      btn.addEventListener("click", function () { location.href = tool[1]; });
      list.appendChild(btn);
    });
  }

  function search(q) {
    var words = fold(q).split(/\s+/).filter(Boolean);
    hits = tools.filter(function (tool) {
      var hay = fold(tool[0] + " " + tool[2]);
      return words.every(function (w) { return hay.indexOf(w) !== -1; });
    });
    cursor = 0;
    draw();
  }

  function openSearch() {
    if (!back) return;
    back.hidden = false;
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
    theme.addEventListener("click", function () {
      setTheme(document.documentElement.dataset.theme !== "dark");
    });
    var find = document.createElement("button");
    find.type = "button";
    find.className = "ghost";
    find.setAttribute("data-ek", "search");
    find.textContent = "Ara";
    find.addEventListener("click", openSearch);
    parent.appendChild(theme);
    parent.appendChild(find);
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
  box.setAttribute("aria-label", "Ara");
  input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Ara";
  input.setAttribute("aria-label", "Ara");
  list = document.createElement("div");
  list.className = "cmd-list";
  box.appendChild(input);
  box.appendChild(list);
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
    } else if (e.key === "Escape") {
      closeSearch();
    }
  });

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (back.hidden) openSearch();
      else closeSearch();
    } else if (e.key === "Escape") {
      closeSearch();
    }
  });
})();
