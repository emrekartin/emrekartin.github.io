(function () {
  var euX = document.getElementById("eu-x");
  var euY = document.getElementById("eu-y");
  var euZ = document.getElementById("eu-z");
  var qX = document.getElementById("q-x");
  var qY = document.getElementById("q-y");
  var qZ = document.getElementById("q-z");
  var qW = document.getElementById("q-w");
  var errorEl = document.getElementById("quat-error");
  var copyBtn = document.getElementById("quat-copy");

  function read(el, empty) {
    var raw = el.value.trim().replace(/,/g, ".");
    if (raw === "") return empty;
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return null;
    var n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function fmt(n) {
    if (Math.abs(n) < 1e-6) n = 0;
    var nearest = Math.round(n);
    if (Math.abs(n - nearest) < 1e-4) n = nearest;
    return n.toFixed(6).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
  }

  function eulerToQuat(xd, yd, zd) {
    var d = Math.PI / 180;
    var x = xd * d;
    var y = yd * d;
    var z = zd * d;
    var sx = Math.sin(x / 2);
    var cx = Math.cos(x / 2);
    var sy = Math.sin(y / 2);
    var cy = Math.cos(y / 2);
    var sz = Math.sin(z / 2);
    var cz = Math.cos(z / 2);
    return {
      x: sx * cy * cz + sy * sz * cx,
      y: sy * cx * cz - sx * sz * cy,
      z: sz * cx * cy - sx * sy * cz,
      w: cx * cy * cz + sy * sz * sx
    };
  }

  function makePositive(deg) {
    var negativeFlip = -0.0001 * (180 / Math.PI);
    var positiveFlip = 360 + negativeFlip;
    if (deg < negativeFlip) deg += 360;
    else if (deg > positiveFlip) deg -= 360;
    return deg;
  }

  function quatToEuler(x, y, z, w) {
    var len = Math.hypot(x, y, z, w);
    if (len === 0) return null;
    x /= len;
    y /= len;
    z /= len;
    w /= len;
    var epsilon = 1e-6;
    var cutoff = (1 - 2 * epsilon) * (1 - 2 * epsilon);
    var d1x = 2 * x * w;
    var d1y = 2 * y * w;
    var d1z = 2 * z * w;
    var d2x = 2 * x * y;
    var d2y = 2 * y * z;
    var d2z = 2 * z * x;
    var d3x = x * x;
    var d3y = y * y;
    var d3z = z * z;
    var d3w = w * w;
    var y1 = d2y - d1x;
    var a;
    var b;
    var c;
    if (y1 * y1 < cutoff) {
      var x1 = d2x + d1z;
      var x2 = d3y + d3w - d3x - d3z;
      var z1 = d2z + d1y;
      var z2 = d3z + d3w - d3x - d3y;
      a = Math.atan2(x1, x2);
      b = -Math.asin(Math.max(-1, Math.min(1, y1)));
      c = Math.atan2(z1, z2);
    } else {
      y1 = Math.max(-1, Math.min(1, y1));
      var A = d2z;
      var B = d1y;
      var C = d2y;
      var D = d1x;
      var sx1 = 2 * (A * D + B * C);
      var sx2 = -A * A + B * B - C * C + D * D;
      a = Math.atan2(sx1, sx2);
      b = -Math.asin(y1);
      c = 0;
    }
    var r = 180 / Math.PI;
    return {
      x: makePositive(b * r),
      y: makePositive(c * r),
      z: makePositive(a * r)
    };
  }

  function toQuat() {
    errorEl.textContent = "";
    var x = read(euX, 0);
    var y = read(euY, 0);
    var z = read(euZ, 0);
    if (x === null || y === null || z === null) {
      errorEl.textContent = "Açı sayı olmalı.";
      return;
    }
    var q = eulerToQuat(x, y, z);
    qX.value = fmt(q.x);
    qY.value = fmt(q.y);
    qZ.value = fmt(q.z);
    qW.value = fmt(q.w);
  }

  function toEuler() {
    errorEl.textContent = "";
    var x = read(qX, null);
    var y = read(qY, null);
    var z = read(qZ, null);
    var w = read(qW, null);
    if (x === null || y === null || z === null || w === null) {
      errorEl.textContent = "x, y, z, w sayı olmalı.";
      return;
    }
    var e = quatToEuler(x, y, z, w);
    if (!e) {
      errorEl.textContent = "Bu quaternion okunmadı.";
      return;
    }
    euX.value = fmt(e.x);
    euY.value = fmt(e.y);
    euZ.value = fmt(e.z);
  }

  document.getElementById("to-quat").addEventListener("click", toQuat);
  document.getElementById("to-euler").addEventListener("click", toEuler);
  copyBtn.addEventListener("click", function () {
    var parts = [qX.value, qY.value, qZ.value, qW.value];
    if (parts.some(function (p) { return p.trim() === ""; })) return;
    navigator.clipboard.writeText(parts.join(", ")).then(function () {
      copyBtn.textContent = "Kopyalandı";
      setTimeout(function () { copyBtn.textContent = "Kopyala"; }, 1200);
    });
  });
})();
