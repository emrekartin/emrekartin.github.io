(function () {
  var fileEl = document.getElementById("img-file");
  var dropEl = document.getElementById("img-drop");
  var formatEl = document.getElementById("img-format");
  var sizeEl = document.getElementById("img-size");
  var qualityEl = document.getElementById("img-quality");
  var qualityValue = document.getElementById("img-quality-value");
  var allBtn = document.getElementById("img-all");
  var clearBtn = document.getElementById("img-clear");
  var outEl = document.getElementById("img-out");
  var errorEl = document.getElementById("img-error");
  var listEl = document.getElementById("img-list");
  var MAX_FILES = 30;
  var EXT = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };

  var items = [];
  var run = 0;
  var timer = null;

  function bytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " KB";
    return (n / 1024 / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " MB";
  }

  function targetType(file) {
    if (formatEl.value !== "auto") return formatEl.value;
    return EXT[file.type] ? file.type : "image/jpeg";
  }

  function outName(file, type) {
    var base = file.name.replace(/\.[^.]+$/, "") || "resim";
    return base + "." + EXT[type];
  }

  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () {
        return viaImg(file);
      });
    }
    return viaImg(file);
  }

  function viaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("decode"));
      };
      img.src = url;
    });
  }

  function encode(item) {
    var src = item.bitmap;
    var w = src.width;
    var h = src.height;
    var limit = parseInt(sizeEl.value, 10);
    if (limit >= 16 && Math.max(w, h) > limit) {
      var scale = limit / Math.max(w, h);
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }
    var type = targetType(item.file);
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var c = canvas.getContext("2d");
    if (type === "image/jpeg") {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, w, h);
    }
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
    c.drawImage(src, 0, 0, w, h);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) return reject(new Error("encode"));
        if (blob.type !== type) type = blob.type;
        resolve({ blob: blob, w: w, h: h, type: type });
      }, type, Number(qualityEl.value) / 100);
    });
  }

  function row(item) {
    var li = document.createElement("li");
    li.className = "img-item";
    var thumb = document.createElement("img");
    thumb.alt = "";
    var body = document.createElement("div");
    body.className = "img-body";
    var name = document.createElement("strong");
    name.textContent = item.file.name;
    var meta = document.createElement("span");
    meta.className = "img-meta";
    meta.textContent = "Hazırlanıyor…";
    body.appendChild(name);
    body.appendChild(meta);
    var link = document.createElement("a");
    link.className = "img-dl";
    link.textContent = "İndir";
    link.hidden = true;
    li.appendChild(thumb);
    li.appendChild(body);
    li.appendChild(link);
    listEl.appendChild(li);
    item.el = { thumb: thumb, meta: meta, link: link };
  }

  function paint(item) {
    var r = item.result;
    if (item.url) URL.revokeObjectURL(item.url);
    item.url = URL.createObjectURL(r.blob);
    item.el.thumb.src = item.url;
    var change = Math.round((1 - r.blob.size / item.file.size) * 100);
    var parts = [
      bytes(item.file.size) + " → " + bytes(r.blob.size) + (change > 0 ? " (−%" + change + ")" : change < 0 ? " (+%" + -change + ")" : ""),
      item.bitmap.width + "×" + item.bitmap.height + (r.w !== item.bitmap.width ? " → " + r.w + "×" + r.h : ""),
      EXT[r.type].toUpperCase()
    ];
    item.el.meta.textContent = parts.join(" · ");
    item.el.meta.classList.toggle("img-worse", change < 0);
    item.el.link.href = item.url;
    item.el.link.download = outName(item.file, r.type);
    item.el.link.hidden = false;
  }

  function summary() {
    var done = items.filter(function (i) { return i.result; });
    allBtn.disabled = !done.length;
    clearBtn.disabled = !items.length;
    if (!done.length) {
      outEl.textContent = "";
      return;
    }
    var before = 0;
    var after = 0;
    done.forEach(function (i) {
      before += i.file.size;
      after += i.result.blob.size;
    });
    var worse = done.some(function (i) { return i.result.blob.size > i.file.size; });
    outEl.textContent = done.length + " resim · " + bytes(before) + " → " + bytes(after) +
      (worse ? " · Büyüyen dosyada orijinali kullanman daha iyi." : "");
  }

  function processAll() {
    var mine = ++run;
    var queue = items.slice();
    (function next() {
      if (mine !== run) return;
      var item = queue.shift();
      if (!item) return summary();
      if (!item.bitmap) return next();
      item.el.meta.textContent = "Hazırlanıyor…";
      encode(item).then(function (result) {
        if (mine !== run) return;
        item.result = result;
        paint(item);
        summary();
        next();
      }, function () {
        item.el.meta.textContent = "Bu resim kaydedilemedi.";
        next();
      });
    })();
  }

  function add(files) {
    errorEl.textContent = "";
    var list = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type) || /\.(heic|heif|avif)$/i.test(f.name); });
    if (!list.length) {
      errorEl.textContent = "Resim dosyası bulunamadı.";
      return;
    }
    var room = MAX_FILES - items.length;
    if (list.length > room) {
      errorEl.textContent = "En fazla " + MAX_FILES + " resim. Fazlası alınmadı.";
      list = list.slice(0, Math.max(0, room));
    }
    var failed = [];
    Promise.all(list.map(function (file) {
      var item = { file: file };
      items.push(item);
      row(item);
      return decode(file).then(function (bitmap) {
        item.bitmap = bitmap;
      }, function () {
        failed.push(file.name);
        item.el.meta.textContent = "Bu tarayıcı bu formatı açamıyor.";
      });
    })).then(function () {
      if (failed.length) errorEl.textContent = failed.length + " dosya açılamadı. HEIC gibi formatları önce telefonda JPEG olarak paylaş.";
      processAll();
    });
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(processAll, 250);
  }

  fileEl.addEventListener("change", function () {
    add(fileEl.files);
    fileEl.value = "";
  });

  ["dragenter", "dragover"].forEach(function (type) {
    dropEl.addEventListener(type, function (e) {
      e.preventDefault();
      dropEl.classList.add("over");
    });
  });
  ["dragleave", "drop"].forEach(function (type) {
    dropEl.addEventListener(type, function (e) {
      e.preventDefault();
      dropEl.classList.remove("over");
    });
  });
  dropEl.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files.length) add(e.dataTransfer.files);
  });

  document.addEventListener("paste", function (e) {
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    var files = [];
    Array.prototype.forEach.call((e.clipboardData && e.clipboardData.items) || [], function (it) {
      if (it.kind === "file") {
        var f = it.getAsFile();
        if (f) files.push(new File([f], f.name && f.name !== "image.png" ? f.name : "yapistirilan.png", { type: f.type }));
      }
    });
    if (files.length) {
      e.preventDefault();
      add(files);
    }
  });

  qualityEl.addEventListener("input", function () {
    qualityValue.textContent = qualityEl.value;
    schedule();
  });
  formatEl.addEventListener("change", schedule);
  sizeEl.addEventListener("input", schedule);
  sizeEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      processAll();
    }
  });

  allBtn.addEventListener("click", function () {
    var links = items.filter(function (i) { return i.result; }).map(function (i) { return i.el.link; });
    links.forEach(function (link, n) {
      setTimeout(function () { link.click(); }, n * 300);
    });
  });

  clearBtn.addEventListener("click", function () {
    run++;
    items.forEach(function (i) {
      if (i.url) URL.revokeObjectURL(i.url);
      if (i.bitmap && i.bitmap.close) i.bitmap.close();
    });
    items = [];
    listEl.innerHTML = "";
    errorEl.textContent = "";
    summary();
  });
})();
