(function () {
  var FORMS = {
    "4-4-2": [4, 4, 2],
    "4-3-3": [4, 3, 3],
    "4-2-3-1": [4, 2, 3, 1],
    "4-1-4-1": [4, 1, 4, 1],
    "4-4-1-1": [4, 4, 1, 1],
    "4-3-2-1": [4, 3, 2, 1],
    "4-5-1": [4, 5, 1],
    "3-5-2": [3, 5, 2],
    "3-4-3": [3, 4, 3],
    "3-4-2-1": [3, 4, 2, 1],
    "5-3-2": [5, 3, 2],
    "5-4-1": [5, 4, 1]
  };

  function lineLabel(li, count, k, j) {
    if (li === 0) {
      if (k === 4) return ["SLB", "STP", "STP", "SĞB"][j];
      if (k === 5) return ["SLB", "STP", "STP", "STP", "SĞB"][j];
      return "STP";
    }
    if (li === count - 1) {
      if (k === 3) return ["SLK", "SNT", "SĞK"][j];
      return "SNT";
    }
    if (count === 4 && li === 2) {
      if (k === 3) return ["SLK", "OOS", "SĞK"][j];
      if (k === 4) return ["SLO", "MO", "MO", "SĞO"][j];
      return "OOS";
    }
    if (k === 1) return "DOS";
    if (k === 2) return count === 4 ? "DOS" : "MO";
    if (k === 4) return ["SLO", "MO", "MO", "SĞO"][j];
    if (k === 5) return ["SLO", "MO", "MO", "MO", "SĞO"][j];
    return "MO";
  }

  function shape(lines) {
    var spots = [{ x: 50, y: 91, label: "KL" }];
    lines.forEach(function (k, li) {
      var y = 74 - li * (52 / (lines.length - 1));
      for (var j = 0; j < k; j++) {
        var edge = li === 0 && k >= 4 && (j === 0 || j === k - 1);
        spots.push({
          x: 12 + ((j + 0.5) / k) * 76,
          y: edge ? y - 4 : y,
          label: lineLabel(li, lines.length, k, j)
        });
      }
    });
    return spots;
  }

  var shapes = {};
  Object.keys(FORMS).forEach(function (key) { shapes[key] = shape(FORMS[key]); });

  Lineup({
    key: "ek-ilk11",
    title: "İlk 11",
    coachLabel: "Teknik direktör",
    shapes: shapes,
    initial: "4-3-3",
    keeper: true,
    ratio: 1.4,
    surface: "#23874a",
    stripe: 0.88,
    presets: [
      { name: "Çim", a: "#23874a" },
      { name: "Koyu çim", a: "#17603a" },
      { name: "Sentetik", a: "#3aa856" },
      { name: "Toprak saha", a: "#9a6a3f" },
      { name: "Mavi saha", a: "#1f5fa8" }
    ],
    field: function (c, PX, PY, S, col) {
      for (var i = 0; i < 14; i++) {
        c.fillStyle = i % 2 ? col.b : col.a;
        c.fillRect(PX, PY + i * 10 * S, 100 * S, 10 * S);
      }
      c.strokeStyle = "rgba(255,255,255,0.85)";
      c.lineWidth = 3;
      function rect(x, y, w, h) { c.strokeRect(PX + x * S, PY + y * S, w * S, h * S); }
      rect(3, 3, 94, 134);
      rect(20, 3, 60, 20);
      rect(36, 3, 28, 7);
      rect(20, 117, 60, 20);
      rect(36, 130, 28, 7);
      rect(43, 0.6, 14, 2.4);
      rect(43, 137, 14, 2.4);
      c.beginPath();
      c.moveTo(PX + 3 * S, PY + 70 * S);
      c.lineTo(PX + 97 * S, PY + 70 * S);
      c.stroke();
      c.beginPath();
      c.arc(PX + 50 * S, PY + 70 * S, 9 * S, 0, Math.PI * 2);
      c.stroke();
    }
  });
})();
