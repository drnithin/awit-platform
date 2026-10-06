/* Shared helpers for the Program MIS and the funder dashboards. */
(function () {
  "use strict";
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = n => (Math.round(n * 10) / 10).toLocaleString("en-IN");
  const compact = n => { const a = Math.abs(n); return a >= 1e5 ? (n / 1e5).toFixed(a >= 1e6 ? 1 : 2).replace(/\.?0+$/, "") + " L" : a >= 1e3 ? (n / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "k" : String(Math.round(n * 10) / 10); };
  const PAL = ["var(--c-hsp,#1D4FC0)", "var(--c-sfvt,#C26A00)", "var(--c-as,#1B7648)", "var(--c-city,#7A3FB5)", "var(--c-mute,#9AA9C2)"];
  const get = k => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const short = (t, n) => { t = String(t); return t.length > n ? t.slice(0, n - 1) + "\u2026" : t; };

  const niceMax = m => { const raw = Math.max(m, 1e-9) / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p * 4; };
  function axis(max, W, H, L, B) {
    let g = "";
    for (let t = 0; t <= 4; t++) { const y = H - B - (H - B - 14) * t / 4; g += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--rule2,#E6EDF6)"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + compact(max * t / 4) + "</text>"; }
    return g;
  }
  const legend = series => series.length > 1 ? '<div style="display:flex;flex-wrap:wrap;gap:.3rem 1rem;font-size:.875rem;margin-top:.5rem">' + series.map((s, i) => '<span><i style="display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:.35rem;vertical-align:-1px;background:' + PAL[i % PAL.length] + '"></i>' + esc(s.name) + "</span>").join("") + "</div>" : "";
  function hbars(labels, vals, color) {
    const max = Math.max(1, ...vals.map(v => Math.abs(v)));
    return '<div style="display:grid;grid-template-columns:minmax(110px,38%) 1fr auto;gap:.35rem .7rem;align-items:center">' + labels.map((l, i) =>
      '<div style="line-height:1.25">' + esc(l) + '</div><div style="position:relative;height:16px;background:var(--rule2,#E6EDF6);border-radius:3px"><div style="position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:' + (color || PAL[0]) + ";width:" + Math.min(100, Math.abs(vals[i]) / max * 100) + '%"></div></div><div style="font-weight:700;text-align:right;font-variant-numeric:tabular-nums">' + nf(vals[i]) + "</div>").join("") + "</div>";
  }
  function gbars(labels, series) {
    const W = 720, H = 260, L = 46, B = 34, max = niceMax(Math.max(1, ...series.flatMap(s => s.values))), gw = (W - L) / labels.length, bw = gw * .8 / series.length;
    let g = axis(max, W, H, L, B);
    labels.forEach((l, k) => {
      series.forEach((s, j) => { const v = s.values[k] || 0, h = (H - B - 14) * v / max, x = L + k * gw + gw * .1 + j * bw; g += '<rect x="' + x + '" y="' + (H - B - h) + '" width="' + Math.max(1, bw - 2) + '" height="' + h + '" rx="2" fill="' + PAL[j % PAL.length] + '"><title>' + esc(l) + ", " + esc(s.name) + ": " + nf(v) + "</title></rect>" + (labels.length * series.length <= 16 ? '<text x="' + (x + (bw - 2) / 2) + '" y="' + (H - B - h - 4) + '" text-anchor="middle" style="fill:var(--ink,#16233F);font-weight:700">' + compact(v) + "</text>" : ""); });
      if (labels.length <= 12 || k % Math.ceil(labels.length / 12) === 0) g += '<text x="' + (L + k * gw + gw / 2) + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(short(l, Math.max(4, Math.floor(gw / 6.5)))) + "</text>";
    });
    return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="Bar chart">' + g + "</svg>" + legend(series);
  }
  function lines(labels, series) {
    const W = 720, H = 250, L = 46, B = 30, max = niceMax(Math.max(1, ...series.flatMap(s => s.values))), st = (W - L - 16) / Math.max(1, labels.length - 1);
    let g = axis(max, W, H, L, B);
    series.forEach((s, j) => {
      const pts = s.values.map((v, k) => [L + 8 + k * st, H - B - (H - B - 14) * (v || 0) / max]);
      g += '<polyline points="' + pts.map(p => p.join(",")).join(" ") + '" fill="none" stroke="' + PAL[j % PAL.length] + '" stroke-width="2.5"/>';
      pts.forEach((p, k) => { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="' + PAL[j % PAL.length] + '"><title>' + esc(labels[k]) + ", " + esc(s.name) + ": " + nf(s.values[k] || 0) + "</title></circle>"; });
    });
    labels.forEach((l, k) => { if (labels.length <= 12 || k % Math.ceil(labels.length / 12) === 0) g += '<text x="' + (L + 8 + k * st) + '" y="' + (H - 10) + '" text-anchor="' + (k === labels.length - 1 && k > 0 ? "end" : "middle") + '">' + esc(short(l, 10)) + "</text>"; });
    return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="Line chart">' + g + "</svg>" + legend(series);
  }
  function table(ds) {
    return '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%"><thead><tr><th style="text-align:left;padding:.45rem .6rem">' + esc(ds.labelName || "") + "</th>" + ds.series.map(s => '<th style="text-align:right;padding:.45rem .6rem">' + esc(s.name) + "</th>").join("") + "</tr></thead><tbody>" +
      ds.labels.map((l, i) => '<tr><td style="padding:.45rem .6rem;border-top:1px solid var(--rule2,#E6EDF6)">' + esc(l) + "</td>" + ds.series.map(s => '<td style="padding:.45rem .6rem;border-top:1px solid var(--rule2,#E6EDF6);text-align:right;font-variant-numeric:tabular-nums">' + nf(s.values[i] || 0) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
  }
  function render(ds) {
    if (!ds || !ds.labels || !ds.labels.length || !ds.series || !ds.series.length) return '<p style="color:var(--ink2,#52617E)">Nothing to draw yet.</p>';
    if (ds.type === "table") return table(ds);
    if (ds.type === "line") return lines(ds.labels, ds.series);
    if (ds.series.length === 1 && (ds.horizontal || ds.labels.length > 8)) return hbars(ds.labels, ds.series[0].values, ds.color);
    if (ds.labels.length > 24) return table(ds);
    return gbars(ds.labels, ds.series);
  }

  /* Live figures for the Govandi project, read from the two tools on this device. */
  function snapshot() {
    const out = { schools: [], vendors: null };
    const st = get("schooltrack.v1");
    if (st && st.schools) {
      for (const sc of Object.values(st.schools)) {
        if (!/govandi/i.test(sc.project || "")) continue;
        const ss = Object.values(st.sessions || {}).filter(s => s.schoolId === sc.id);
        const classes = (sc.classes || []).map(c => {
          const acts = [];
          for (let a = 1; a <= 10; a++) { const m = ss.filter(s => s.classId === c.id && s.activity === a && s.status !== "rejected"); acts.push(m.some(s => s.status === "verified") ? "v" : m.length ? "p" : ""); }
          return { id: c.id, enrol: c.enrol, acts };
        });
        const ver = ss.filter(s => s.status === "verified");
        out.schools.push({ name: sc.name, id: sc.id, classes, verified: ver.length, reach: classes.filter(c => c.acts.includes("v")).reduce((n, c) => n + c.enrol, 0), enrol: classes.reduce((n, c) => n + c.enrol, 0) });
      }
    }
    const sf = get("sfvt.v2");
    if (sf && sf.vendors) {
      const vs = Object.values(sf.vendors).filter(v => v.review !== "rejected" && /govandi/i.test(v.ward || ""));
      if (vs.length) {
        const ids = new Set(vs.map(v => v.id)), xs = Object.values(sf.visits || {}).filter(x => ids.has(x.vid) && x.status === "verified");
        out.vendors = { registered: vs.length, attended: vs.filter(v => v.att).length, screened: vs.filter(v => v.scr && !v.scr.declined).length, trained: vs.filter(v => v.kit && v.kit.trained).length, visited: new Set(xs.map(x => x.vid)).size, visits: xs.length };
      }
    }
    return out;
  }
  function govandiDefault(sample) {
    const a = v => sample ? v : 0;
    return {
      project: { id: "govandi", name: "Nourishing Govandi", tagline: "Sehat Ki Baat, Saath Saath", place: "Govandi, Mumbai", funder: "Godrej", start: "2026-09-01", end: "2027-03-31" },
      sample: !!sample,
      indicators: [
        { comp: "Healthy Schools Program", name: "Schools in the program", unit: "schools", target: 2, achieved: a(2) },
        { comp: "Healthy Schools Program", name: "Students reached", unit: "students", target: 0, achieved: a(123) },
        { comp: "Women's nutrition outreach", name: "Women and adolescents reached", unit: "people", target: 1000, achieved: a(310) },
        { comp: "Women's nutrition outreach", name: "Community sessions held", unit: "sessions", target: 40, achieved: a(12) },
        { comp: "Women's nutrition outreach", name: "Follow-up group discussions", unit: "discussions", target: 15, achieved: a(3) },
        { comp: "mDiabetes", name: "People enrolled in mDiabetes", unit: "people", target: 5000, achieved: a(1460) },
        { comp: "Street food vendors", name: "Vendors trained", unit: "vendors", target: 50, achieved: a(8) },
        { comp: "Street food vendors", name: "Stall monitoring visits", unit: "visits", target: 50, achieved: a(4) }
      ],
      updates: sample ? [{ date: "2026-10-01", text: "Community sessions are running in three localities, with pre and post questions answered by raised cards." }, { date: "2026-09-15", text: "Arogya City Coordinator for Mumbai in place; community mobilisation partner on board." }] : [],
      datasets: sample ? [
        { id: "d-sample1", title: "Knowledge before and after the session", labelName: "Session", type: "bar", labels: ["GOV001", "GOV002", "GOV003", "GOV004", "GOV005", "GOV006"], series: [{ name: "Before, % correct", values: [52, 48, 57, 55, 50, 61] }, { name: "After, % correct", values: [81, 79, 86, 84, 77, 88] }], show: "govandi" },
        { id: "d-sample2", title: "mDiabetes enrolments, running total", labelName: "Week", type: "line", labels: ["1 Sep", "8 Sep", "15 Sep", "22 Sep", "29 Sep", "6 Oct"], series: [{ name: "People enrolled", values: [0, 180, 420, 760, 1120, 1460] }], show: "govandi" }
      ] : []
    };
  }
  window.AWIT = { esc, nf, compact, render, get, set, snapshot, govandiDefault, HUB_KEY: "awit.hub.v1" };
})();
