(function () {
  var KEY = "cv-draft";
  var STEPS = [
    { id: "identity", label: "Kimlik", hint: "Adın ve sana nasıl ulaşılacağı. Gerisi isteğe bağlı." },
    { id: "summary", label: "Özet", hint: "İki ya da üç cümle. Ne yaptığın ve ne aradığın yeter." },
    { id: "experience", label: "Deneyim", hint: "En yeni iş üstte kalsın. Her satır, sayfada bir madde olur." },
    { id: "education", label: "Eğitim", hint: "Okul, bölüm ve yıl. Kısa tut." },
    { id: "skills", label: "Beceriler", hint: "Araçlar ve diller. Liste yeterli, uzun paragraf gerekmez." },
    { id: "extra", label: "Ek", hint: "Proje, sertifika, yayın. Yoksa bu adımı boş geç." }
  ];

  var stepsEl = document.getElementById("steps");
  var panel = document.getElementById("panel");
  var sheet = document.getElementById("sheet");
  var saveState = document.getElementById("save-state");
  var saveTimer = 0;
  var fieldSeq = 0;

  var state = emptyState();
  load();

  function uid() {
    return "id" + Math.random().toString(36).slice(2, 10);
  }

  function emptyState() {
    return {
      step: "identity",
      personal: {
        name: "", title: "", email: "", phone: "", location: "", website: "",
        summary: "", birth: "", gender: "", military: "", license: ""
      },
      experience: [],
      education: [],
      skills: "",
      languages: "",
      references: "",
      projects: [],
      certificates: [],
      publications: [],
      custom: []
    };
  }

  function blank(list) {
    var item = { id: uid() };
    if (list === "experience") Object.assign(item, { role: "", company: "", start: "", end: "", current: false, details: "" });
    if (list === "education") Object.assign(item, { school: "", degree: "", start: "", end: "" });
    if (list === "projects") Object.assign(item, { name: "", link: "", description: "" });
    if (list === "certificates") Object.assign(item, { name: "", issuer: "", date: "" });
    if (list === "publications") Object.assign(item, { title: "", publisher: "", date: "", link: "" });
    if (list === "custom") Object.assign(item, { title: "", content: "" });
    return item;
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function load() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) { raw = null; }
    if (!raw) {
      try { raw = fromLegacy(JSON.parse(localStorage.getItem("resumeData") || "null")); } catch (err) { raw = null; }
    }
    if (!raw || !raw.personal) return;
    state = emptyState();
    Object.assign(state.personal, raw.personal || {});
    ["experience", "education", "projects", "certificates", "publications", "custom"].forEach(function (key) {
      if (Array.isArray(raw[key])) state[key] = raw[key].filter(realItem);
    });
    state.skills = raw.skills || "";
    state.languages = raw.languages || "";
    state.references = raw.references || "";
    if (STEPS.some(function (step) { return step.id === raw.step; })) state.step = raw.step;
  }

  function fromLegacy(raw) {
    if (!raw || !raw.personal) return null;
    var p = raw.personal;
    return {
      step: "identity",
      personal: {
        name: p.name || "",
        title: p.title || "",
        email: p.email || "",
        phone: p.phone || "",
        location: p.location || "",
        website: p.linkedin || p.website || "",
        summary: p.summary || "",
        birth: p.dob || p.birth || "",
        gender: p.gender || "",
        military: p.military || "",
        license: p.drivingLicense || p.license || ""
      },
      experience: (raw.experience || []).map(mapExp),
      education: (raw.education || []).map(function (item) {
        return { id: item.id || uid(), school: item.school || "", degree: item.degree || "", start: item.startDate || item.start || "", end: item.endDate || item.end || "" };
      }),
      skills: raw.skills || "",
      languages: raw.languages || "",
      references: raw.references || "",
      projects: (raw.projects || []).map(function (item) {
        return { id: item.id || uid(), name: item.name || "", link: item.link || "", description: item.description || "" };
      }),
      certificates: (raw.certificates || []).map(function (item) {
        return { id: item.id || uid(), name: item.name || "", issuer: item.issuer || "", date: item.date || "" };
      }),
      publications: (raw.publications || []).map(function (item) {
        return { id: item.id || uid(), title: item.title || "", publisher: item.publisher || "", date: item.date || "", link: item.link || "" };
      }),
      custom: (raw.customSections || raw.custom || []).map(function (item) {
        return { id: item.id || uid(), title: item.title || "", content: item.content || "" };
      })
    };
  }

  function mapExp(item) {
    var end = item.endDate || item.end || "";
    var current = item.current === true || /^(halen|devam|present|current)$/i.test(String(end).trim());
    return {
      id: item.id || uid(),
      role: item.role || "",
      company: item.company || "",
      start: item.startDate || item.start || "",
      end: current ? "" : end,
      current: current,
      details: item.details || item.description || ""
    };
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    saveState.textContent = "Kaydedildi";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveState.textContent = "Boş bölüm sayfada çıkmaz. Taslak bu tarayıcıda durur.";
    }, 900);
  }

  function readPanel() {
    panel.querySelectorAll("[data-bind]").forEach(function (el) {
      if (el.dataset.group === "root") state[el.dataset.bind] = el.value;
      else state.personal[el.dataset.bind] = el.value;
    });
    var names = new Set();
    panel.querySelectorAll("[data-scope]").forEach(function (el) { names.add(el.dataset.scope); });
    names.forEach(function (name) {
      state[name] = Array.prototype.map.call(panel.querySelectorAll('article[data-list="' + name + '"]'), function (card) {
        var item = { id: card.dataset.id };
        card.querySelectorAll("[data-key]").forEach(function (input) {
          item[input.dataset.key] = input.type === "checkbox" ? input.checked : input.value;
        });
        return item;
      });
    });
  }

  function go(step) {
    readPanel();
    state.step = step;
    save();
    render();
    var first = panel.querySelector("input, textarea");
    if (first) first.focus();
  }

  function count(step) {
    if (step === "identity") return state.personal.name.trim() ? 1 : 0;
    if (step === "summary") return state.personal.summary.trim() ? 1 : 0;
    if (step === "skills") return (state.skills.trim() || state.languages.trim()) ? 1 : 0;
    if (step === "extra") {
      return state.projects.length + state.certificates.length + state.publications.length + state.custom.length + (state.references.trim() ? 1 : 0);
    }
    return state[step].filter(filledItem).length;
  }

  function realItem(item) {
    return !!item && Object.keys(item).some(function (key) { return key !== "id"; });
  }

  function filledItem(item) {
    return Object.keys(item).some(function (key) {
      if (key === "id" || key === "current") return false;
      return String(item[key] || "").trim() !== "";
    });
  }

  function renderSteps() {
    stepsEl.innerHTML = STEPS.map(function (step, index) {
      var n = count(step.id);
      var mark = n ? '<i>' + (step.id === "experience" || step.id === "education" || step.id === "extra" ? n : "●") + "</i>" : "";
      var current = step.id === state.step ? ' aria-current="step"' : "";
      return '<button type="button" class="step" data-step="' + step.id + '"' + current + '><b>' + (index + 1) + '</b> ' + step.label + mark + "</button>";
    }).join("");
  }

  function render() {
    renderSteps();
    renderPanel();
    renderPreview();
  }

  function renderPanel(focusId) {
    fieldSeq = 0;
    var index = STEPS.findIndex(function (step) { return step.id === state.step; });
    var step = STEPS[index];
    var prev = index > 0 ? STEPS[index - 1].id : "";
    var next = index < STEPS.length - 1 ? STEPS[index + 1].id : "";
    panel.innerHTML =
      '<p class="panel-kicker">' + (index + 1) + " / " + STEPS.length + "</p>" +
      "<h2>" + step.label + "</h2>" +
      '<p class="panel-hint">' + step.hint + "</p>" +
      bodyFor(step.id) +
      '<div class="step-nav">' +
        (prev ? '<button type="button" class="ghost" data-go="' + prev + '">Geri</button>' : "<span></span>") +
        (next ? '<button type="button" data-go="' + next + '">Devam</button>' : "<span></span>") +
      "</div>";
    if (focusId) {
      var field = panel.querySelector('[data-id="' + focusId + '"] input, [data-id="' + focusId + '"] textarea');
      if (field) field.focus();
    }
  }

  function input(id, label, value, extra) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" ' + extra + ' value="' + esc(value) + '"></div>';
  }

  function bodyFor(step) {
    var p = state.personal;
    if (step === "identity") {
      var optional = p.birth || p.gender || p.military || p.license;
      return "" +
        input("name", "Ad soyad", p.name, 'data-bind="name" autocomplete="name"') +
        input("title", "Ünvan", p.title, 'data-bind="title" autocomplete="organization-title" placeholder="Ürün tasarımcısı"') +
        '<div class="row-2">' +
          input("email", "E-posta", p.email, 'data-bind="email" autocomplete="email"') +
          input("phone", "Telefon", p.phone, 'data-bind="phone" autocomplete="tel"') +
        "</div>" +
        '<div class="row-2">' +
          input("location", "Şehir", p.location, 'data-bind="location" autocomplete="address-level2"') +
          input("website", "Site veya LinkedIn", p.website, 'data-bind="website" placeholder="https://"') +
        "</div>" +
        "<details" + (optional ? " open" : "") + "><summary>İsteğe bağlı bilgiler</summary>" +
          '<div class="row-2">' +
            input("birth", "Doğum tarihi", p.birth, 'data-bind="birth" placeholder="1996"') +
            input("license", "Ehliyet", p.license, 'data-bind="license" placeholder="B"') +
          "</div>" +
          '<div class="row-2">' +
            input("military", "Askerlik", p.military, 'data-bind="military" placeholder="Yapıldı"') +
            input("gender", "Cinsiyet", p.gender, 'data-bind="gender"') +
          "</div>" +
        "</details>";
    }
    if (step === "summary") {
      return '<div class="field"><label for="summary">Kısa özet</label><textarea id="summary" data-bind="summary" rows="6" placeholder="Ne üzerine çalıştığın ve bir sonraki adımın.">' + esc(p.summary) + "</textarea></div>";
    }
    if (step === "experience") return listBlock("experience", "İş ekle", state.experience, experienceCard);
    if (step === "education") return listBlock("education", "Okul ekle", state.education, educationCard);
    if (step === "skills") {
      return "" +
        '<div class="field"><label for="skills">Beceriler</label><textarea id="skills" data-bind="skills" data-group="root" rows="4" placeholder="Araştırma, Figma, yazı">' + esc(state.skills) + "</textarea></div>" +
        '<div class="field"><label for="languages">Diller</label><textarea id="languages" data-bind="languages" data-group="root" rows="3" placeholder="Türkçe, İngilizce">' + esc(state.languages) + "</textarea></div>";
    }
    return "" +
      group("projects", "Projeler", "Proje ekle", state.projects, projectCard) +
      group("certificates", "Sertifikalar", "Sertifika ekle", state.certificates, certificateCard) +
      group("publications", "Yayınlar", "Yayın ekle", state.publications, publicationCard) +
      '<h3 class="block-label">Referans</h3>' +
      '<div class="field"><label for="references">Ad, ünvan, iletişim</label><textarea id="references" data-bind="references" data-group="root" rows="3">' + esc(state.references) + "</textarea></div>" +
      group("custom", "Başka bölüm", "Bölüm ekle", state.custom, customCard);
  }

  function listBlock(name, label, items, card) {
    var inner = items.length ? items.map(card).join("") : '<p class="empty" data-scope="' + name + '">Henüz bir kayıt yok.</p>';
    var scope = items.length ? ' data-scope="' + name + '"' : "";
    return '<div' + scope + ">" + inner + "</div>" + addButton(name, label);
  }

  function group(name, title, label, items, card) {
    return '<h3 class="block-label">' + title + "</h3>" + listBlock(name, label, items, card);
  }

  function addButton(name, label) {
    return '<button type="button" class="ghost" data-add="' + name + '">' + label + "</button>";
  }

  function cardHead(list, item, index, total) {
    var nouns = {
      experience: "iş",
      education: "okul",
      projects: "proje",
      certificates: "sertifika",
      publications: "yayın",
      custom: "bölüm"
    };
    var place = total > 1 ? '<p class="card-place">' + (index + 1) + ". " + nouns[list] + "</p>" : "";
    var order = "";
    if (total > 1) {
      order = '<div class="card-order" role="group" aria-label="Sıra">' +
        '<button type="button" class="texty" data-move="-1" data-bucket="' + list + '" data-id="' + item.id + '"' + (index === 0 ? ' disabled title="Zaten en üstte"' : "") + ">Üste al</button>" +
        '<button type="button" class="texty" data-move="1" data-bucket="' + list + '" data-id="' + item.id + '"' + (index === total - 1 ? ' disabled title="Zaten en altta"' : "") + ">Alta al</button>" +
        "</div>";
    }
    return '<header class="card-head">' + place + order +
      '<button type="button" class="texty card-remove" data-del="1" data-bucket="' + list + '" data-id="' + item.id + '">Sil</button>' +
      "</header>";
  }

  function experienceCard(item, index) {
    var end = item.current ? " disabled" : "";
    return '<article class="card" data-list="experience" data-id="' + item.id + '">' +
      cardHead("experience", item, index, state.experience.length) +
      '<div class="row-2">' +
        field("Görev", "role", item.role) +
        field("Kurum", "company", item.company) +
      "</div>" +
      '<div class="row-2">' +
        field("Başlangıç", "start", item.start, 'placeholder="2022"') +
        field("Bitiş", "end", item.end, 'placeholder="2024"' + end) +
      "</div>" +
      '<label class="check-line"><input type="checkbox" data-key="current"' + (item.current ? " checked" : "") + "> Sürüyor</label>" +
      area("Ne yaptın", "details", item.details, 4, "Her satıra bir madde") +
      "</article>";
  }

  function educationCard(item, index) {
    return '<article class="card" data-list="education" data-id="' + item.id + '">' +
      cardHead("education", item, index, state.education.length) +
      field("Okul", "school", item.school) +
      field("Bölüm veya derece", "degree", item.degree) +
      '<div class="row-2">' + field("Başlangıç", "start", item.start) + field("Bitiş", "end", item.end) + "</div>" +
      "</article>";
  }

  function projectCard(item, index) {
    return '<article class="card" data-list="projects" data-id="' + item.id + '">' +
      cardHead("projects", item, index, state.projects.length) +
      '<div class="row-2">' + field("Ad", "name", item.name) + field("Bağlantı", "link", item.link) + "</div>" +
      area("Kısa not", "description", item.description, 3, "") +
      "</article>";
  }

  function certificateCard(item, index) {
    return '<article class="card" data-list="certificates" data-id="' + item.id + '">' +
      cardHead("certificates", item, index, state.certificates.length) +
      '<div class="row-2">' + field("Ad", "name", item.name) + field("Veren", "issuer", item.issuer) + "</div>" +
      field("Tarih", "date", item.date) +
      "</article>";
  }

  function publicationCard(item, index) {
    return '<article class="card" data-list="publications" data-id="' + item.id + '">' +
      cardHead("publications", item, index, state.publications.length) +
      '<div class="row-2">' + field("Başlık", "title", item.title) + field("Yayın yeri", "publisher", item.publisher) + "</div>" +
      '<div class="row-2">' + field("Tarih", "date", item.date) + field("Bağlantı", "link", item.link) + "</div>" +
      "</article>";
  }

  function customCard(item, index) {
    return '<article class="card" data-list="custom" data-id="' + item.id + '">' +
      cardHead("custom", item, index, state.custom.length) +
      field("Başlık", "title", item.title, 'placeholder="Gönüllülük"') +
      area("Metin", "content", item.content, 3, "") +
      "</article>";
  }

  function field(label, key, value, extra) {
    fieldSeq += 1;
    var id = "fld-" + fieldSeq;
    return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" data-key="' + key + '" value="' + esc(value) + '" ' + (extra || "") + "></div>";
  }

  function area(label, key, value, rows, placeholder) {
    fieldSeq += 1;
    var id = "fld-" + fieldSeq;
    return '<div class="field"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" data-key="' + key + '" rows="' + rows + '" placeholder="' + esc(placeholder || "") + '">' + esc(value) + "</textarea></div>";
  }

  function renderPreview() {
    var p = state.personal;
    var parts = [];
    parts.push("<h1" + (p.name.trim() ? "" : ' class="ph"') + ">" + esc(p.name.trim() || "Ad Soyad") + "</h1>");
    if (p.title.trim()) parts.push('<p class="role">' + esc(p.title.trim()) + "</p>");
    var contact = [p.email, p.phone, p.location, p.website].map(function (v) { return v.trim(); }).filter(Boolean);
    if (contact.length) parts.push('<p class="contact">' + contact.map(esc).join(" · ") + "</p>");
    var fine = [];
    if (p.birth.trim()) fine.push("Doğum " + p.birth.trim());
    if (p.gender.trim()) fine.push(p.gender.trim());
    if (p.military.trim()) fine.push("Askerlik: " + p.military.trim());
    if (p.license.trim()) fine.push("Ehliyet: " + p.license.trim());
    if (fine.length) parts.push('<p class="fine">' + fine.map(esc).join(" · ") + "</p>");
    if (p.summary.trim()) parts.push('<p class="summary">' + esc(p.summary.trim()) + "</p>");

    var jobs = state.experience.filter(filledItem);
    if (jobs.length) {
      parts.push("<h2>Deneyim</h2>");
      jobs.forEach(function (job) {
        var title = [job.role, job.company].map(function (v) { return String(v || "").trim(); }).filter(Boolean).join(", ");
        parts.push('<div class="job"><div class="job-top"><strong>' + esc(title || "Görev") + "</strong><span class=\"when\">" + esc(dates(job.start, job.end, job.current)) + "</span></div>" + rich(job.details) + "</div>");
      });
    }

    var schools = state.education.filter(filledItem);
    if (schools.length) {
      parts.push("<h2>Eğitim</h2>");
      schools.forEach(function (school) {
        parts.push('<div class="job"><div class="edu-top"><div><strong>' + esc(school.school.trim() || "Okul") + "</strong>" + (school.degree.trim() ? "<div>" + esc(school.degree.trim()) + "</div>" : "") + '</div><span class="when">' + esc(dates(school.start, school.end, false)) + "</span></div></div>");
      });
    }

    textSection(parts, "Beceriler", state.skills);
    textSection(parts, "Diller", state.languages);

    var projects = state.projects.filter(filledItem);
    if (projects.length) {
      parts.push("<h2>Projeler</h2>");
      projects.forEach(function (item) {
        var link = item.link.trim() ? " · " + esc(item.link.trim()) : "";
        parts.push('<div class="job"><strong>' + esc(item.name.trim() || "Proje") + "</strong>" + link + rich(item.description) + "</div>");
      });
    }

    var certificates = state.certificates.filter(filledItem);
    if (certificates.length) {
      parts.push("<h2>Sertifikalar</h2>");
      certificates.forEach(function (item) {
        var line = [item.name, item.issuer].map(function (v) { return String(v || "").trim(); }).filter(Boolean).join(", ");
        parts.push('<div class="job"><div class="job-top"><span>' + esc(line) + '</span><span class="when">' + esc(item.date.trim()) + "</span></div></div>");
      });
    }

    var publications = state.publications.filter(filledItem);
    if (publications.length) {
      parts.push("<h2>Yayınlar</h2>");
      publications.forEach(function (item) {
        var line = [item.title, item.publisher].map(function (v) { return String(v || "").trim(); }).filter(Boolean).join(", ");
        var link = item.link.trim() ? "<div>" + esc(item.link.trim()) + "</div>" : "";
        parts.push('<div class="job"><div class="job-top"><span>' + esc(line) + '</span><span class="when">' + esc(item.date.trim()) + "</span></div>" + link + "</div>");
      });
    }

    textSection(parts, "Referanslar", state.references);

    state.custom.filter(filledItem).forEach(function (item) {
      parts.push("<h2>" + esc(item.title.trim() || "Bölüm") + "</h2>");
      parts.push(rich(item.content) || "");
    });

    if (!p.name.trim() && parts.length === 1) {
      parts.push('<p class="contact ph">Ünvan · e-posta · şehir</p>');
    }
    sheet.innerHTML = parts.join("");
  }

  function textSection(parts, title, value) {
    var text = String(value || "").trim();
    if (!text) return;
    parts.push("<h2>" + title + "</h2><p>" + esc(text) + "</p>");
  }

  function dates(start, end, current) {
    var left = String(start || "").trim();
    var right = current ? "Halen" : String(end || "").trim();
    if (left && right) return left + " – " + right;
    return left || right;
  }

  function rich(value) {
    var lines = String(value || "").split(/\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    if (!lines.length) return "";
    if (lines.length === 1 && !/^[-•]/.test(lines[0])) return "<p>" + esc(lines[0]) + "</p>";
    return "<ul>" + lines.map(function (line) {
      return "<li>" + esc(line.replace(/^[-•]\s*/, "")) + "</li>";
    }).join("") + "</ul>";
  }

  function dirty() {
    var p = state.personal;
    if (Object.keys(p).some(function (key) { return String(p[key] || "").trim(); })) return true;
    if (state.skills.trim() || state.languages.trim() || state.references.trim()) return true;
    return ["experience", "education", "projects", "certificates", "publications", "custom"].some(function (key) {
      return state[key].some(filledItem);
    });
  }

  function arm(button, label, action) {
    if (button.dataset.armed !== "1") {
      button.dataset.armed = "1";
      button.textContent = label;
      setTimeout(function () {
        if (button.dataset.armed === "1") {
          button.dataset.armed = "";
          button.textContent = button.id === "reset" ? "Temizle" : "Örnek";
        }
      }, 2400);
      return;
    }
    button.dataset.armed = "";
    button.textContent = button.id === "reset" ? "Temizle" : "Örnek";
    action();
  }

  stepsEl.addEventListener("click", function (event) {
    var button = event.target.closest("[data-step]");
    if (!button || button.dataset.step === state.step) return;
    go(button.dataset.step);
  });

  panel.addEventListener("input", function (event) {
    if (event.target.dataset.key === "current") {
      var end = event.target.closest("[data-list]").querySelector('[data-key="end"]');
      end.disabled = event.target.checked;
      if (event.target.checked) end.value = "";
    }
    readPanel();
    save();
    renderPreview();
    renderSteps();
  });

  panel.addEventListener("click", function (event) {
    var goBtn = event.target.closest("[data-go]");
    if (goBtn) { go(goBtn.dataset.go); return; }

    var add = event.target.closest("[data-add]");
    if (add) {
      readPanel();
      var item = blank(add.dataset.add);
      state[add.dataset.add].push(item);
      save();
      render();
      var field = panel.querySelector('[data-id="' + item.id + '"] input, [data-id="' + item.id + '"] textarea');
      if (field) field.focus();
      return;
    }

    var move = event.target.closest("[data-move]");
    if (move) {
      readPanel();
      var list = state[move.dataset.bucket];
      var from = list.findIndex(function (item) { return item.id === move.dataset.id; });
      var to = from + Number(move.dataset.move);
      if (from < 0 || to < 0 || to >= list.length) return;
      var swapped = list[from];
      list[from] = list[to];
      list[to] = swapped;
      save();
      render();
      return;
    }

    var del = event.target.closest("[data-del]");
    if (!del) return;
    if (del.dataset.armed !== "1") {
      del.dataset.armed = "1";
      del.textContent = "Silinsin mi?";
      return;
    }
    readPanel();
    state[del.dataset.bucket] = state[del.dataset.bucket].filter(function (item) { return item.id !== del.dataset.id; });
    save();
    render();
  });

  document.getElementById("print").addEventListener("click", function () {
    readPanel();
    save();
    renderPreview();
    window.print();
  });

  document.getElementById("reset").addEventListener("click", function () {
    var button = document.getElementById("reset");
    if (!dirty()) return;
    arm(button, "Emin misin?", function () {
      state = emptyState();
      localStorage.removeItem(KEY);
      saveState.textContent = "Taslak temizlendi.";
      render();
    });
  });

  document.getElementById("sample").addEventListener("click", function () {
    var button = document.getElementById("sample");
    var apply = function () {
      state = emptyState();
      Object.assign(state.personal, {
        name: "Emre Kartın",
        title: "Software Developer",
        email: "emrekartin@gmail.com",
        location: "Ankara",
        website: "https://www.linkedin.com/in/emrekartin",
        summary: "Ankara’da yazılım geliştirici. Mobil uygulamalar, Unity ve Java."
      });
      state.experience.push(Object.assign(blank("experience"), {
        role: "Software Developer",
        company: "AKGÜN · Ankara",
        start: "Haz 2025",
        current: true,
        details: "Mobil uygulamalar, Ionic"
      }));
      state.experience.push(Object.assign(blank("experience"), {
        role: "Unity Developer",
        company: "AKGÜN · Ankara",
        start: "Mar 2022",
        current: true,
        details: "Unity, Augmented Reality (AR)"
      }));
      state.experience.push(Object.assign(blank("experience"), {
        role: "Game Developer",
        company: "Lecten",
        start: "Eki 2021",
        end: "Şub 2022",
        details: "Unity, .NET"
      }));
      state.experience.push(Object.assign(blank("experience"), {
        role: "Software Development Intern",
        company: "Noderix · İzmir",
        start: "Mar 2020",
        end: "Tem 2020",
        details: "Unity, Blender"
      }));
      state.education.push(Object.assign(blank("education"), {
        school: "Manisa Celal Bayar Üniversitesi",
        degree: "Bilgisayar Mühendisliği, lisans",
        start: "2015",
        end: "2020"
      }));
      state.skills = "Mobil uygulamalar, Ionic, Unity, Augmented Reality (AR), .NET, Blender, Java";
      state.languages = "Türkçe, İngilizce";
      state.step = "identity";
      save();
      render();
    };
    if (dirty()) arm(button, "Üstüne yazılsın mı?", apply);
    else apply();
  });

  document.getElementById("show-edit").addEventListener("click", function () { setView("edit"); });
  document.getElementById("show-preview").addEventListener("click", function () { setView("preview"); });

  function setView(view) {
    document.body.dataset.view = view;
    document.getElementById("show-edit").setAttribute("aria-pressed", view === "edit" ? "true" : "false");
    document.getElementById("show-preview").setAttribute("aria-pressed", view === "preview" ? "true" : "false");
    if (view === "preview") {
      readPanel();
      renderPreview();
    }
  }

  render();
})();
