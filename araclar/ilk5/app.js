(function () {
  function set(points) {
    var names = ["OK", "ŞG", "KF", "UF", "P"];
    return points.map(function (p, i) { return { x: p[0], y: p[1], label: names[i] }; });
  }

  Lineup({
    key: "ek-ilk5",
    title: "İlk 5",
    coachLabel: "Başantrenör",
    shapes: {
      "Standart": set([[50, 80], [84, 58], [16, 58], [72, 30], [34, 24]]),
      "4 dış 1 iç": set([[50, 80], [85, 55], [15, 55], [10, 14], [62, 26]]),
      "5 dış": set([[50, 80], [86, 52], [14, 52], [91, 13], [9, 13]]),
      "Yüksek-alçak": set([[50, 80], [86, 48], [14, 48], [50, 42], [37, 22]])
    },
    initial: "Standart",
    keeper: false,
    ratio: 0.94,
    field: function (c, PX, PY, S) {
      for (var i = 0; i < 20; i++) {
        c.fillStyle = i % 2 ? "#d39a5e" : "#dba567";
        c.fillRect(PX + i * 5 * S, PY, 5 * S, 94 * S);
      }
      c.fillStyle = "rgba(120, 50, 20, 0.35)";
      c.fillRect(PX + 34 * S, PY + 2 * S, 32 * S, 36 * S);
      c.strokeStyle = "#fff";
      c.lineWidth = 3;
      function at(x, y) { return [PX + x * S, PY + y * S]; }
      c.strokeRect(PX + 2 * S, PY + 2 * S, 96 * S, 90 * S);
      c.strokeRect(PX + 34 * S, PY + 2 * S, 32 * S, 36 * S);
      c.beginPath();
      c.arc(PX + 50 * S, PY + 38 * S, 12 * S, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo.apply(c, at(6, 2));
      c.lineTo.apply(c, at(6, 29.9));
      c.arc(PX + 50 * S, PY + 12 * S, 47.5 * S, Math.atan2(17.9, -44), Math.atan2(17.9, 44), true);
      c.lineTo.apply(c, at(94, 2));
      c.stroke();
      c.beginPath();
      c.arc(PX + 50 * S, PY + 12 * S, 8 * S, Math.PI, 0, true);
      c.stroke();
      c.beginPath();
      c.arc(PX + 50 * S, PY + 92 * S, 12 * S, Math.PI, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo.apply(c, at(44, 9.7));
      c.lineTo.apply(c, at(56, 9.7));
      c.stroke();
      c.strokeStyle = "#f97316";
      c.beginPath();
      c.arc(PX + 50 * S, PY + 12 * S, 1.6 * S, 0, Math.PI * 2);
      c.stroke();
    }
  });
})();
