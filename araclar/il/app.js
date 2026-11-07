(function () {
  var NAMES = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
    "Düzce"
  ];
  var ALIASES = { "33": ["icel"], "46": ["maras"], "63": ["urfa"], "03": ["afyon"], "31": ["antakya"], "41": ["izmit"], "54": ["adapazari"] };

  var qEl = document.getElementById("il-q");
  var outEl = document.getElementById("il-out");
  var listEl = document.getElementById("il-list");

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function fold(s) {
    return s.toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
      .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/\s+/g, " ").trim();
  }

  var PROVINCES = NAMES.map(function (name, i) {
    var code = pad(i + 1);
    return { code: code, name: name, key: fold(name), alias: ALIASES[code] || [] };
  });

  function render(items) {
    listEl.innerHTML = "";
    items.forEach(function (p) {
      var li = document.createElement("li");
      var code = document.createElement("span");
      code.className = "il-code";
      code.textContent = p.code;
      var name = document.createElement("strong");
      name.textContent = p.name;
      var post = document.createElement("span");
      post.className = "il-post";
      post.textContent = "Posta " + p.code + "xxx";
      li.appendChild(code);
      li.appendChild(name);
      li.appendChild(post);
      listEl.appendChild(li);
    });
  }

  function byCode(n) {
    return n >= 1 && n <= 81 ? PROVINCES[n - 1] : null;
  }

  function search() {
    var raw = qEl.value.trim();
    var compact = raw.replace(/\s+/g, "");
    if (!raw) {
      outEl.textContent = "";
      render(PROVINCES);
      return;
    }

    var plate = raw.toUpperCase().match(/^(\d{1,2})\s*[A-Z]{1,3}\s*\d{2,4}$/);
    if (plate) {
      var fromPlate = byCode(Number(plate[1]));
      outEl.textContent = fromPlate ? "Plaka " + fromPlate.code + " · " + fromPlate.name : "Plaka kodu 01–81 arasında olmalı.";
      render(fromPlate ? [fromPlate] : []);
      return;
    }

    if (/^\d+$/.test(compact)) {
      if (compact.length <= 2) {
        var one = byCode(Number(compact));
        outEl.textContent = one ? one.name + " · plaka " + one.code + " · posta kodu " + one.code + "xxx" : "Plaka kodu 01–81 arasında olmalı.";
        render(one ? [one] : []);
        return;
      }
      var head = byCode(Number(compact.slice(0, 2)));
      if (!head) {
        outEl.textContent = "Bu posta kodu bir ile ait değil. İlk iki hane 01–81 olmalı.";
        render([]);
        return;
      }
      outEl.textContent = compact.length === 5
        ? "Posta kodu " + compact + " · " + head.name + " (plaka " + head.code + ")"
        : "Posta kodu 5 hanedir. " + compact.slice(0, 2) + " ile başlayanlar " + head.name + ".";
      render([head]);
      return;
    }

    var q = fold(raw);
    var hits = PROVINCES.filter(function (p) {
      return p.key.indexOf(q) === 0 || p.alias.some(function (a) { return a.indexOf(q) === 0; });
    });
    if (!hits.length) {
      hits = PROVINCES.filter(function (p) { return p.key.indexOf(q) >= 0; });
    }
    if (hits.length === 1) {
      outEl.textContent = hits[0].name + " · plaka " + hits[0].code + " · posta kodu " + hits[0].code + "xxx";
    } else {
      outEl.textContent = hits.length ? "" : "İl bulunamadı.";
    }
    render(hits);
  }

  qEl.addEventListener("input", search);
  qEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") e.preventDefault();
  });
  search();
})();
