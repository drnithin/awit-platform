/* Shared code for the AWIT program platform: helpers, photo fingerprints, location,
   charts drawn as plain SVG (so each one can be copied or saved as an image), flags. */
(function () {
  "use strict";
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = n => (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString("en-IN");
  const compact = n => { const a = Math.abs(n); return a >= 1e5 ? (n / 1e5).toFixed(a >= 1e6 ? 1 : 2).replace(/\.?0+$/, "") + " L" : a >= 1e3 ? (n / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "k" : String(Math.round(n * 10) / 10); };
  const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "0%";
  const sum = a => a.reduce((x, y) => x + y, 0);
  const fmtDay = t => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const fmtDate = t => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const fmtTime = t => new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const fmtDist = m => m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(1) + " km";
  const dayKey = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hav = (a, b, c, d) => { const R = 6371000, r = x => x * Math.PI / 180, x = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  const get = k => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const pinHash = (id, pin) => { let h = 2166136261; for (const ch of id + ":" + pin) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };

  /* ---------- photos ---------- */
  function dhash(src) {
    const c = document.createElement("canvas"); c.width = 9; c.height = 8;
    const x = c.getContext("2d", { willReadFrequently: true }); if (!x) return null;
    x.drawImage(src, 0, 0, 9, 8); const d = x.getImageData(0, 0, 9, 8).data; let bits = "";
    for (let y = 0; y < 8; y++) for (let i = 0; i < 8; i++) { const a = (y * 9 + i) * 4, b = a + 4; bits += (d[a] * .299 + d[a + 1] * .587 + d[a + 2] * .114) > (d[b] * .299 + d[b + 1] * .587 + d[b + 2] * .114) ? "1" : "0"; }
    let h = ""; for (let i = 0; i < 64; i += 4) h += parseInt(bits.slice(i, i + 4), 2).toString(16); return h;
  }
  const ham = (a, b) => { let n = 0; for (let i = 0; i < 16; i++) { let v = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (v) { n += v & 1; v >>= 1; } } return n; };
  const randHash = r => { let h = ""; for (let i = 0; i < 16; i++) h += Math.floor(r() * 16).toString(16); return h; };
  function fileToPhoto(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader(); fr.onerror = () => rej(new Error("read"));
      fr.onload = () => {
        const im = new Image(); im.onerror = () => rej(new Error("image"));
        im.onload = () => { const c = document.createElement("canvas"), w = 220, h = Math.max(1, Math.round(im.height / im.width * w)); c.width = w; c.height = h; const x = c.getContext("2d"); if (!x) return rej(new Error("canvas")); x.drawImage(im, 0, 0, w, h); res({ thumb: c.toDataURL("image/jpeg", .6), hash: dhash(c) }); };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  /* Drawn stand-in photos for the sample data and demo mode. kind: "class" | "stall" | "page" */
  function samplePhoto(seed, kind) {
    const r = rng(seed), c = document.createElement("canvas"); c.width = 160; c.height = 120;
    const x = c.getContext("2d"); if (!x) return { thumb: null, hash: randHash(r) };
    const hue = Math.floor(r() * 360);
    x.fillStyle = "hsl(" + hue + " 28% " + (64 + r() * 18) + "%)"; x.fillRect(0, 0, 160, 120);
    for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 9; gx++) { x.fillStyle = (r() > .5 ? "rgba(255,255,255," : "rgba(0,0,0,") + (.06 + r() * .18) + ")"; x.fillRect(gx * 160 / 9, gy * 15, 160 / 9 + 1, 16); }
    if (kind === "stall") {
      x.fillStyle = "hsl(" + ((hue + 180) % 360) + " 15% 42%)"; x.fillRect(0, 92, 160, 28);
      const cx = 30 + r() * 50; x.fillStyle = "hsl(" + Math.floor(r() * 360) + " 65% 45%)"; x.fillRect(cx, 22, 70, 10); x.fillStyle = "#3b2d22"; x.fillRect(cx + 4, 32, 3, 34); x.fillRect(cx + 63, 32, 3, 34);
      x.fillStyle = "hsl(" + Math.floor(r() * 360) + " 45% 55%)"; x.fillRect(cx - 4, 64, 78, 26); x.fillStyle = "#222"; x.beginPath(); x.arc(cx + 10, 96, 8, 0, 7); x.arc(cx + 60, 96, 8, 0, 7); x.fill();
      const px = cx + 80 + r() * 14; x.fillStyle = "hsl(25 40% " + (25 + r() * 20) + "%)"; x.beginPath(); x.arc(px, 48, 8, 0, 7); x.fill(); x.fillStyle = "hsl(" + Math.floor(r() * 360) + " 50% 50%)"; x.fillRect(px - 8, 56, 16, 34);
    } else if (kind === "page") {
      x.fillStyle = "#f7f4ea"; x.fillRect(14, 8, 132, 104); x.strokeStyle = "#9aa"; x.lineWidth = 1;
      for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(20, 22 + i * 10); x.lineTo(140, 22 + i * 10); x.stroke(); }
      x.fillStyle = "#334"; for (let i = 0; i < 9; i++) x.fillRect(24, 16 + i * 10, 20 + r() * 50, 3);
    } else {
      x.fillStyle = "hsl(" + ((hue + 40) % 360) + " 18% " + (34 + r() * 16) + "%)"; x.fillRect(0, 68 + r() * 18, 160, 60);
      x.fillStyle = "#1f3b2d"; x.fillRect(r() * 90, 8 + r() * 10, 40 + r() * 50, 24 + r() * 10);
      const n = 14 + Math.floor(r() * 18);
      for (let i = 0; i < n; i++) { const px = 8 + r() * 144, py = 58 + r() * 54, s = 4 + (py - 50) / 9; x.fillStyle = "hsl(" + (20 + r() * 20) + " 40% " + (18 + r() * 22) + "%)"; x.beginPath(); x.arc(px, py, s, 0, 7); x.fill(); x.fillStyle = ["#f2f2ee", "#c9d8f0", "#f0d9a8"][Math.floor(r() * 3)]; x.fillRect(px - s, py + s, 2 * s, s * 1.5); }
    }
    return { thumb: c.toDataURL("image/jpeg", .6), hash: dhash(c) || randHash(r) };
  }

  /* ---------- location ---------- */
  /* mode "real": the phone's GPS. "demo": close to the anchor. "far": about 2 km from it. */
  function getPos(mode, anchor) {
    const a = anchor || [12.9716, 77.5946];
    if (mode === "demo") return Promise.resolve({ lat: a[0] + .0002 + Math.random() * .0002, lng: a[1] + .0001 + Math.random() * .0002, sim: true });
    if (mode === "far") return Promise.resolve({ lat: a[0] + .014, lng: a[1] + .012, sim: true });
    return new Promise(res => {
      if (!navigator.geolocation) return res({ fail: true });
      navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }), () => res({ fail: true }), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    });
  }
  function parseLatLng(text) {
    const t = String(text || "");
    const m = /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/.exec(t) || /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/.exec(t) || /[?&](?:q|query|destination|ll)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i.exec(t) || /(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/.exec(t);
    if (!m) return null; const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
  }
  const mapsLink = (lat, lng) => "https://www.google.com/maps/search/?api=1&query=" + lat.toFixed(6) + "," + lng.toFixed(6);

  /* ---------- charts (plain SVG, every attribute inline so the picture survives export) ---------- */
  const FF = 'font-family="Atkinson Hyperlegible, Arial, Helvetica, sans-serif"';
  const INK = "var(--ink)", INK2 = "var(--ink2)", GRID = "var(--rule2)", SURF = "var(--sheet)", SERIES = "var(--series,var(--accent))", MUTE = "var(--mute)";
  const T = (x, y, s, o) => { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.s || 12) + '" fill="' + (o.f || INK2) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : "") + (o.b ? ' font-weight="700"' : "") + ">" + esc(s) + "</text>"; };
  const tip = s => ' data-tip="' + esc(s) + '"';
  function wrap(s, n, maxLines) {
    maxLines = maxLines || 2; n = Math.max(4, n); const words = String(s).split(/\s+/), lines = []; let cur = "";
    for (const w of words) { if (!cur) cur = w; else if ((cur + " " + w).length <= n) cur += " " + w; else { lines.push(cur); cur = w; } }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] = keep[maxLines - 1].slice(0, Math.max(1, n - 1)) + "…"; return keep; }
    return lines.map(l => l.length > n + 3 ? l.slice(0, n) + "…" : l);
  }
  const niceMax = m => { const raw = Math.max(m, 1e-9) / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p * 4; };
  const frame = (w, h, body, label) => '<svg class="chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + Math.ceil(h) + '" width="100%" role="img" aria-label="' + esc(label || "Chart") + '" ' + FF + ">" + body + "</svg>";
  /* bar with a rounded data end and a square baseline. dir "r" grows right, "u" grows up */
  function bar(x, y, w, h, dir, fill, extra) {
    if (w <= 0 || h <= 0) return "";
    let d;
    if (dir === "r") { const r = Math.min(4, w, h / 2); d = "M" + x + " " + y + "H" + (x + w - r) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) + "V" + (y + h - r) + "Q" + (x + w) + " " + (y + h) + " " + (x + w - r) + " " + (y + h) + "H" + x + "Z"; }
    else { const r = Math.min(4, h, w / 2); d = "M" + x + " " + (y + h) + "V" + (y + r) + "Q" + x + " " + y + " " + (x + r) + " " + y + "H" + (x + w - r) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) + "V" + (y + h) + "Z"; }
    return '<path d="' + d + '" fill="' + fill + '"' + (extra || "") + "/>";
  }
  function legend(items, W, y) {
    let x = 0, row = 0, s = "";
    for (const it of items) {
      const w = 22 + String(it.label).length * 6.7 + 18; if (x + w > W && x > 0) { x = 0; row++; }
      const yy = y + row * 20;
      s += it.shape === "line" ? '<rect x="' + (x + 5) + '" y="' + (yy - 11) + '" width="2" height="14" fill="' + it.color + '"/>' : '<rect x="' + x + '" y="' + (yy - 10) + '" width="12" height="12" rx="2" fill="' + it.color + '"' + (it.opacity ? ' fill-opacity="' + it.opacity + '"' : "") + "/>";
      s += T(x + 18, yy, it.label, { f: INK }); x += w;
    }
    return { s, h: (row + 1) * 20 };
  }
  function yAxis(max, W, L, top, bottom, fmt) {
    let g = "";
    for (let t = 0; t <= 4; t++) { const y = bottom - (bottom - top) * t / 4; g += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="' + GRID + '" stroke-width="1"/>' + T(L - 6, y + 4, (fmt || compact)(max * t / 4), { a: "end", s: 11 }); }
    return g;
  }
  function xLabels(labels, at, y, charsPer, every) {
    let g = "";
    labels.forEach((l, k) => { if (k % every) return; wrap(l, charsPer).forEach((ln, i) => { g += T(at(k), y + i * 13, ln, { a: "middle", s: 11 }); }); });
    return g;
  }
  const ch = {
    /* items: [{label, value, value2?, text?, color?, sub?}]  o: {w, max, mark, markLabel, color, rank, fmt, legend, labelW} */
    hbar(items, o) {
      o = o || {}; const W = o.w || 560, rankW = o.rank ? 24 : 0, lw = o.labelW || Math.round(W * (o.rank ? .42 : .38));
      const texts = items.map(it => it.text != null ? String(it.text) : (o.fmt ? o.fmt(it.value) : nf(it.value)));
      const vw = Math.min(W * .34, Math.max(36, ...texts.map(t => t.length * 7.3 + 6))), x0 = lw + 10, tw = Math.max(40, W - vw - 10 - x0);
      const max = o.max || Math.max(1, ...items.map(i => Math.max(i.value || 0, i.value2 || 0)));
      let y = 2, g = "";
      items.forEach((it, k) => {
        const lines = wrap(it.label, Math.floor((lw - rankW) / 6.6)), rowH = Math.max(30, lines.length * 15 + (it.sub ? 14 : 0) + 10), cy = y + rowH / 2, textTop = cy - (lines.length * 15 + (it.sub ? 14 : 0)) / 2 + 11;
        if (o.rank) g += T(0, cy + 4, String(k + 1), { s: 12 });
        lines.forEach((ln, i) => { g += T(rankW, textTop + i * 15, ln, { f: INK, s: 12.5 }); });
        if (it.sub) g += T(rankW, textTop + lines.length * 15, it.sub, { s: 11 });
        const c = it.color || o.color || SERIES, tp = tip(it.label + ": " + texts[k]);
        g += '<rect x="' + x0 + '" y="' + (cy - 8) + '" width="' + tw + '" height="16" rx="3" fill="' + GRID + '"' + tp + "/>";
        g += bar(x0, cy - 8, Math.min(1, (it.value || 0) / max) * tw, 16, "r", c, tp);
        if (it.value2 != null) g += bar(x0, cy - 3, Math.min(1, it.value2 / max) * tw, 6, "r", INK, tp);
        if (o.mark != null) g += '<rect x="' + (x0 + tw * o.mark / max - 1) + '" y="' + (cy - 13) + '" width="2" height="26" fill="' + INK + '"/>';
        g += T(W, cy + 4.5, texts[k], { a: "end", f: INK, b: 1, s: 12.5 });
        y += rowH;
      });
      const lg = (o.legend || []).concat(o.markLabel ? [{ label: o.markLabel, color: INK, shape: "line" }] : []);
      if (lg.length) { const L = legend(lg, W, y + 18); g += L.s; y += L.h + 10; }
      return frame(W, y + 2, g, o.aria || "Bar chart");
    },
    vbar(labels, vals, o) {
      o = o || {}; const W = o.w || 560, L = 44, top = 20, n = vals.length, slot = (W - L) / n, cpl = Math.max(4, Math.floor(slot / 6.4));
      const lines = Math.max(...labels.map(l => wrap(l, cpl).length)), H = (o.h || 220) + lines * 13, bottom = H - lines * 13 - 8, max = o.max || niceMax(Math.max(1, ...vals)), bw = Math.min(28, slot * .62), fmt = o.fmt || compact;
      let g = yAxis(max, W, L, top, bottom, o.axisFmt || fmt);
      vals.forEach((v, k) => { const h = (bottom - top) * Math.min(1, v / max), x = L + k * slot + (slot - bw) / 2; g += bar(x, bottom - h, bw, h, "u", (o.colors && o.colors[k]) || o.color || SERIES, tip(labels[k] + ": " + fmt(v))); if (n <= 14) g += T(x + bw / 2, bottom - h - 5, fmt(v), { a: "middle", f: INK, b: 1, s: 11.5 }); });
      g += xLabels(labels, k => L + k * slot + slot / 2, bottom + 15, cpl, Math.ceil(n / 14));
      return frame(W, H, g, o.aria || "Column chart");
    },
    /* series: [{name, color, values}] */
    grouped(labels, series, o) {
      o = o || {}; const W = o.w || 560, L = 44, top = 20, n = labels.length, slot = (W - L) / n, m = series.length, bw = Math.min(22, slot * .8 / m - 2), cpl = Math.max(4, Math.floor(slot / 6.4));
      const lines = Math.max(...labels.map(l => wrap(l, cpl).length)), plotH = o.h || 210, bottom = top + plotH, max = o.max || niceMax(Math.max(1, ...series.flatMap(s => s.values))), fmt = o.fmt || compact;
      let g = yAxis(max, W, L, top, bottom, o.axisFmt || fmt);
      labels.forEach((l, k) => {
        const gx = L + k * slot + (slot - m * (bw + 2) + 2) / 2;
        series.forEach((s, j) => { const v = s.values[k] || 0, h = plotH * Math.min(1, v / max), x = gx + j * (bw + 2); g += bar(x, bottom - h, bw, h, "u", s.color, tip(l + ", " + s.name + ": " + fmt(v))); if (n * m <= 14) g += T(x + bw / 2, bottom - h - 5, fmt(v), { a: "middle", f: INK, b: 1, s: 11 }); });
      });
      g += xLabels(labels, k => L + k * slot + slot / 2, bottom + 15, cpl, Math.ceil(n / 14));
      const lg = legend(series.map(s => ({ label: s.name, color: s.color })), W, bottom + lines * 13 + 26); g += lg.s;
      return frame(W, bottom + lines * 13 + 26 + lg.h - 8, g, o.aria || "Grouped column chart");
    },
    stacked(labels, series, o) {
      o = o || {}; const W = o.w || 900, L = 48, top = 14, n = labels.length, slot = (W - L) / n, bw = Math.min(24, slot * .7), plotH = o.h || 220, bottom = top + plotH, fmt = o.fmt || compact;
      const tot = labels.map((_, k) => sum(series.map(s => s.values[k] || 0))), max = o.max || niceMax(Math.max(1, ...tot));
      let g = yAxis(max, W, L, top, bottom, fmt);
      labels.forEach((l, k) => {
        let y = bottom; const x = L + k * slot + (slot - bw) / 2, last = series.map(s => s.values[k] || 0).reduce((a, v, i) => v > 0 ? i : a, -1);
        series.forEach((s, j) => { const v = s.values[k] || 0, h = plotH * v / max; if (h <= 0) return; y -= h; const hh = Math.max(1, h - 2), tp = tip(l + ", " + s.name + ": " + nf(v)); g += j === last ? bar(x, y, bw, hh, "u", s.color, tp) : '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + hh + '" fill="' + s.color + '"' + tp + "/>"; });
      });
      g += xLabels(labels, k => L + k * slot + slot / 2, bottom + 16, 9, Math.ceil(n / 12));
      const lg = legend(series.map(s => ({ label: s.name, color: s.color })), W, bottom + 44); g += lg.s;
      return frame(W, bottom + 44 + lg.h - 8, g, o.aria || "Stacked column chart");
    },
    line(labels, series, o) {
      o = o || {}; const W = o.w || 900, L = 48, R = 26, top = 16, plotH = o.h || 200, bottom = top + plotH, n = labels.length, st = (W - L - R - 8) / Math.max(1, n - 1), fmt = o.fmt || compact;
      const max = o.max || niceMax(Math.max(1, ...series.flatMap(s => s.values)));
      let g = yAxis(max, W - R, L, top, bottom, o.axisFmt || fmt);
      series.forEach((s, j) => {
        const pts = s.values.map((v, k) => [L + 6 + k * st, bottom - plotH * Math.min(1, (v || 0) / max)]);
        if (o.area && j === 0) g += '<path d="M' + pts[0][0] + " " + bottom + " " + pts.map(p => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") + " L" + pts[n - 1][0] + " " + bottom + 'Z" fill="' + s.color + '" fill-opacity=".1"/>';
        g += '<polyline points="' + pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ") + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
        pts.forEach((p, k) => { g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (n <= 26 ? 4 : 2.5) + '" fill="' + s.color + '" stroke="' + SURF + '" stroke-width="' + (n <= 26 ? 2 : 1) + '"' + tip(labels[k] + (series.length > 1 ? ", " + s.name : "") + ": " + fmt(s.values[k] || 0)) + "/>"; });
      });
      g += xLabels(labels, k => L + 6 + k * st, bottom + 16, 9, Math.ceil(n / (W > 700 ? 12 : 7)));
      let H = bottom + 26;
      if (series.length > 1) { const lg = legend(series.map(s => ({ label: s.name, color: s.color })), W, bottom + 44); g += lg.s; H = bottom + 44 + lg.h - 8; }
      return frame(W, H, g, o.aria || "Line chart");
    },
    /* parts: [{label, value, color}] */
    donut(parts, centre, centreLab, o) {
      o = o || {}; const W = o.w || 560, r = 58, cx = 84, cy = 84, C = 2 * Math.PI * r, tot = sum(parts.map(p => p.value)) || 1;
      let off = 0, g = '<g transform="rotate(-90 ' + cx + " " + cy + ')">';
      for (const p of parts) { const len = p.value / tot * C; if (len > 0) g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + p.color + '" stroke-width="22" stroke-dasharray="' + Math.max(.5, len - 2).toFixed(2) + " " + (C - Math.max(.5, len - 2)).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"' + tip(p.label + ": " + nf(p.value) + " (" + pct(p.value, tot) + ")") + "/>"; off += len; }
      g += "</g>" + T(cx, cy + 4, centre, { a: "middle", f: INK, b: 1, s: 22 }) + T(cx, cy + 22, centreLab, { a: "middle", s: 11 });
      const lx = 190, rowH = 24, startY = Math.max(16, cy - parts.length * rowH / 2 + 14);
      parts.forEach((p, i) => { const y = startY + i * rowH; g += '<rect x="' + lx + '" y="' + (y - 10) + '" width="12" height="12" rx="2" fill="' + p.color + '"/>' + T(lx + 20, y, p.label, { f: INK, s: 12.5 }) + T(W, y, nf(p.value) + "  " + pct(p.value, tot), { a: "end", f: INK, b: 1, s: 12.5 }); });
      return frame(W, Math.max(170, startY + parts.length * rowH), g, o.aria || centreLab);
    },
    /* steps: [{label, value}] */
    funnel(steps, o) {
      o = o || {}; const W = o.w || 560, lw = Math.round(W * .32), vw = 92, x0 = lw + 8, tw = W - vw - 8 - x0, max = Math.max(1, steps[0].value), rowH = 32;
      let g = "";
      steps.forEach((s, k) => {
        const cy = k * rowH + rowH / 2 + 2, w = Math.max(3, s.value / max * tw), lines = wrap(s.label, Math.floor(lw / 6.6));
        lines.forEach((ln, i) => { g += T(0, cy + 4 - (lines.length - 1) * 7 + i * 14, ln, { f: INK, s: 12.5 }); });
        g += '<rect x="' + (x0 + (tw - w) / 2) + '" y="' + (cy - 11) + '" width="' + w + '" height="22" rx="4" fill="' + (o.color || SERIES) + '"' + tip(s.label + ": " + nf(s.value) + " (" + pct(s.value, max) + ")") + "/>";
        g += T(W - 40, cy + 4.5, nf(s.value), { a: "end", f: INK, b: 1, s: 12.5 }) + T(W, cy + 4.5, pct(s.value, max), { a: "end", s: 11.5 });
      });
      return frame(W, steps.length * rowH + 4, g, o.aria || "Funnel");
    }
  };

  /* ---------- tooltips ---------- */
  function tips() {
    if (document.getElementById("tip")) return;
    const el = document.createElement("div"); el.id = "tip"; el.hidden = true; document.body.appendChild(el);
    const show = e => { const t = e.target.closest && e.target.closest("[data-tip]"); if (!t) { el.hidden = true; return; } el.textContent = t.getAttribute("data-tip"); el.hidden = false; const w = el.offsetWidth, h = el.offsetHeight; el.style.left = Math.max(6, Math.min(window.innerWidth - w - 6, e.clientX + 12)) + "px"; el.style.top = Math.max(6, e.clientY - h - 10) + "px"; };
    document.addEventListener("mousemove", show); document.addEventListener("click", show); document.addEventListener("scroll", () => { el.hidden = true; }, true);
  }

  /* ---------- tiles and pictures ---------- */
  /* A tile whose body is one SVG chart gets Copy and Save buttons. */
  function tile(span, title, sub, body, o) {
    o = o || {}; const pic = o.img !== false && /^<svg class="chart"/.test(String(body).trim());
    return '<section class="tile ' + (span || "") + '"' + (pic ? ' data-pic="1"' : "") + '><div class="thead"><h2>' + title + "</h2>" + (pic ? '<div class="tools"><button class="btn quiet sm" data-a="img-copy">Copy image</button><button class="btn quiet sm" data-a="img-save">Save image</button></div>' : "") + "</div>" + (sub ? '<p class="sub">' + sub + "</p>" : '<div style="height:.6rem"></div>') + body + (o.after || "") + "</section>";
  }
  const kpis = list => '<div class="kpis">' + list.map(([v, l]) => '<div><b class="num">' + v + '</b><span class="muted">' + l + "</span></div>").join("") + "</div>";
  /* swap css variables for the light theme's real colours, so a saved picture never depends on the page */
  function resolve(svg) {
    const root = document.documentElement, prev = root.getAttribute("data-theme"); root.setAttribute("data-theme", "light");
    const cs = getComputedStyle(root), val = n => cs.getPropertyValue(n).trim();
    let out = svg, guard = 0;
    while (/var\(/.test(out) && guard++ < 4) out = out.replace(/var\((--[\w-]+)(?:,\s*([^()]+|var\([^()]*\)))?\)/g, (m, n, fb) => val(n) || fb || "#000000");
    if (prev === null) root.removeAttribute("data-theme"); else root.setAttribute("data-theme", prev);
    return out;
  }
  const img = {
    foot: "Arogya World India Trust",
    /* wrap a chart with its title on a white card */
    compose(inner, vbW, vbH, title, sub, foot) {
      const W = 800, pad = 28, scale = (W - 2 * pad) / vbW, tl = wrap(title, 62, 3), sl = sub ? wrap(sub, 100, 3) : [], head = 30 + tl.length * 26 + sl.length * 17 + 14, H = head + vbH * scale + 46;
      let g = '<rect width="' + W + '" height="' + H + '" fill="#ffffff"/>';
      tl.forEach((l, i) => { g += '<text x="' + pad + '" y="' + (44 + i * 26) + '" font-size="21" font-weight="700" fill="var(--ink)">' + esc(l) + "</text>"; });
      sl.forEach((l, i) => { g += '<text x="' + pad + '" y="' + (44 + tl.length * 26 - 4 + i * 17) + '" font-size="13" fill="var(--ink2)">' + esc(l) + "</text>"; });
      g += '<g transform="translate(' + pad + " " + head + ") scale(" + scale.toFixed(4) + ')">' + inner + "</g>";
      g += '<text x="' + pad + '" y="' + (H - 16) + '" font-size="11.5" fill="var(--ink2)">' + esc(foot || img.foot) + "</text>";
      return resolve('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + Math.ceil(H) + '" viewBox="0 0 ' + W + " " + Math.ceil(H) + '" ' + FF + ">" + g + "</svg>");
    },
    fromTile(tileEl, foot) {
      const s = tileEl.querySelector("svg.chart"); if (!s) return null;
      const vb = s.getAttribute("viewBox").split(" ").map(Number), h2 = tileEl.querySelector("h2"), sub = tileEl.querySelector(".sub");
      return { svg: img.compose(s.innerHTML.replace(/ data-tip="[^"]*"/g, ""), vb[2], vb[3], h2 ? h2.textContent : "", sub ? sub.textContent : "", foot), name: (h2 ? h2.textContent : "chart").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "chart" };
    },
    /* a card of headline numbers: items [[value, label]] */
    kpiCard(title, sub, items, foot) {
      const cols = Math.min(3, items.length), cw = 744 / cols, rows = Math.ceil(items.length / cols);
      let g = "";
      items.forEach(([v, l], i) => { const x = (i % cols) * cw, y = Math.floor(i / cols) * 92; g += '<rect x="' + x + '" y="' + y + '" width="' + (cw - 14) + '" height="3" fill="var(--ink)"/><text x="' + x + '" y="' + (y + 44) + '" font-size="32" font-weight="700" fill="var(--ink)">' + esc(String(v).replace(/<[^>]+>/g, "")) + "</text>"; wrap(String(l).replace(/<[^>]+>/g, ""), Math.floor(cw / 7.4)).forEach((ln, k) => { g += '<text x="' + x + '" y="' + (y + 64 + k * 16) + '" font-size="13.5" fill="var(--ink2)">' + esc(ln) + "</text>"; }); });
      return img.compose(g, 744, rows * 92, title, sub, foot);
    },
    toPng(svg, scale) {
      return new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => { const s = scale || 2, c = document.createElement("canvas"); c.width = im.naturalWidth * s; c.height = im.naturalHeight * s; const x = c.getContext("2d"); x.drawImage(im, 0, 0, c.width, c.height); c.toBlob(b => b ? res(b) : rej(new Error("png")), "image/png"); };
        im.onerror = () => rej(new Error("svg")); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      });
    },
    toDataUrl(svg, scale) { return img.toPng(svg, scale).then(b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); })); },
    save(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); },
    async copy(svg) { if (!(navigator.clipboard && window.ClipboardItem)) throw new Error("no clipboard"); await navigator.clipboard.write([new ClipboardItem({ "image/png": img.toPng(svg, 2) })]); }
  };
  function flash(btn, text) { const o = btn.textContent; btn.textContent = text; setTimeout(() => { btn.textContent = o; }, 1600); }
  /* Copy image / Save image on any chart tile, on every page that loads this file */
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest('[data-a="img-copy"],[data-a="img-save"]'); if (!b) return;
    const pic = img.fromTile(b.closest(".tile")); if (!pic) return;
    if (b.dataset.a === "img-copy") { try { await img.copy(pic.svg); flash(b, "Copied"); return; } catch (err) { /* fall through to saving */ } }
    try { img.save(await img.toPng(pic.svg, 2), pic.name + ".png"); flash(b, b.dataset.a === "img-copy" ? "Saved instead" : "Saved"); } catch (err) { flash(b, "Could not make the image"); }
  });

  /* ---------- flags between Arogya World and a partner ---------- */
  /* flag: {id, about:{kind,id,label}, to, note, ts, status:"open"|"answered"|"closed", reply, replyTs, closedTs} */
  function flagsHtml(list, me, ORGS) {
    if (!list.length) return '<p class="muted">' + (me === "aw" ? "You have not flagged anything to a partner. Use Flag to partner on any record." : "Arogya World has not flagged anything to you.") + "</p>";
    const lab = { open: ["Waiting for " + "the partner", "bad"], answered: ["Answered", "wait"], closed: ["Closed", "plain"] };
    return list.slice().sort((a, b) => (a.status === "closed") - (b.status === "closed") || b.ts - a.ts).map(f =>
      '<div class="qcard' + (f.status === "open" ? " red" : "") + ' stack tight"><div class="row between"><h3>' + esc(f.about.label) + '</h3><span class="pill ' + lab[f.status][1] + '">' + (f.status === "open" ? "Waiting for " + esc(ORGS[f.to] || f.to) : lab[f.status][0]) + "</span></div>" +
      '<p class="small muted">Flagged by Arogya World India Trust to ' + esc(ORGS[f.to] || f.to) + " on " + fmtDay(f.ts) + "</p><p>" + esc(f.note) + "</p>" +
      (f.reply ? '<p class="note"><strong>' + esc(ORGS[f.to] || f.to) + " replied on " + fmtDay(f.replyTs) + ":</strong> " + esc(f.reply) + "</p>" : "") +
      (me === f.to && f.status === "open" ? '<div class="field"><label for="fr-' + f.id + '">Your reply</label><textarea id="fr-' + f.id + '" rows="2"></textarea></div><div><button class="btn primary" data-a="flagreply" data-id="' + f.id + '">Send reply</button></div>' : "") +
      (me === "aw" && f.status !== "closed" ? '<div><button class="btn" data-a="flagclose" data-id="' + f.id + '">Close this flag</button></div>' : "") + "</div>").join("");
  }
  function flagForm(about, to, ORGS) {
    return '<div class="stack" style="padding:1.25rem"><h2>Flag to ' + esc(ORGS[to] || to) + '</h2><p class="muted">' + esc(about.label) + '</p><div class="field"><label for="flag-note">What should they look at?</label><textarea id="flag-note" rows="3"></textarea></div><p id="flag-err" class="note bad small" hidden>Write a short note first.</p>' +
      '<div class="row"><button class="btn primary" data-a="flagsend" data-kind="' + esc(about.kind) + '" data-id="' + esc(about.id) + '" data-to="' + esc(to) + '" data-label="' + esc(about.label) + '">Send flag</button><button class="btn quiet" data-a="close">Cancel</button></div></div>';
  }

  /* ---------- saved datasets (Data hub) ---------- */
  function render(ds, o) {
    if (!ds || !ds.labels || !ds.labels.length || !ds.series || !ds.series.length) return '<p class="muted">Nothing to draw yet.</p>';
    const pal = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)"], w = (o && o.w) || 560;
    if (ds.type === "table" || ds.labels.length > 40) return '<div class="scroll"><table><thead><tr><th>' + esc(ds.labelName || "") + "</th>" + ds.series.map(s => '<th class="n">' + esc(s.name) + "</th>").join("") + "</tr></thead><tbody>" + ds.labels.map((l, i) => "<tr><td>" + esc(l) + "</td>" + ds.series.map(s => '<td class="n">' + nf(s.values[i] || 0) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
    const series = ds.series.map((s, i) => ({ name: s.name, values: s.values, color: pal[i % pal.length] }));
    if (ds.type === "line") return ch.line(ds.labels, series, { w });
    if (series.length === 1) return ds.horizontal || ds.labels.length > 8 ? ch.hbar(ds.labels.map((l, i) => ({ label: l, value: series[0].values[i] || 0 })), { w, color: ds.color || pal[0] }) : ch.vbar(ds.labels, series[0].values, { w, color: ds.color || pal[0], fmt: nf, axisFmt: compact });
    return ch.grouped(ds.labels, series, { w, fmt: nf, axisFmt: compact });
  }

  /* ---------- Nourishing Govandi: figures taken from the two tools on this device ---------- */
  function snapshot() {
    const out = { schools: [], vendors: null };
    const st = get("schooltrack.v2");
    if (st && st.schools) {
      for (const sc of Object.values(st.schools)) {
        if (!/govandi/i.test(sc.project || "")) continue;
        const ss = Object.values(st.sessions || {}).filter(s => s.schoolId === sc.id);
        const classes = (sc.classes || []).map(c => { const acts = []; for (let a = 1; a <= 10; a++) { const m = ss.filter(s => s.classId === c.id && s.activity === a && s.status !== "rejected"); acts.push(m.some(s => s.status === "counted") ? "v" : m.length ? "p" : ""); } return { id: c.id, enrol: c.enrol, acts }; });
        out.schools.push({ name: sc.name, id: sc.id, classes, sessions: ss.filter(s => s.status === "counted").length, reach: sum(classes.filter(c => c.acts.includes("v")).map(c => c.enrol)), enrol: sum(classes.map(c => c.enrol)) });
      }
    }
    const sf = get("sfvt.v3");
    if (sf && sf.vendors) {
      const vs = Object.values(sf.vendors).filter(v => v.review !== "rejected" && (/govandi/i.test(v.ward || "") || v.city === "Mumbai"));
      if (vs.length) {
        const ids = new Set(vs.map(v => v.id)), xs = Object.values(sf.visits || {}).filter(x => ids.has(x.vid) && x.status === "counted"), by = n => new Set(xs.filter(x => x.n === n).map(x => x.vid)).size;
        out.vendors = { registered: vs.length, attended: vs.filter(v => v.att).length, screened: vs.filter(v => v.scr && !v.scr.declined).length, trained: vs.filter(v => v.kit && v.kit.trained).length, visit1: by(1), visit2: by(2), visit3: by(3), visits: xs.length };
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
        { comp: "Nutrition outreach", name: "Women and adolescents reached", unit: "people", target: 1000, achieved: a(310) },
        { comp: "Nutrition outreach", name: "Community sessions held", unit: "sessions", target: 40, achieved: a(12) },
        { comp: "Nutrition outreach", name: "Follow-up group discussions", unit: "discussions", target: 15, achieved: a(3) },
        { comp: "mDiabetes", name: "People enrolled in mDiabetes", unit: "people", target: 5000, achieved: a(1460) },
        { comp: "Street food vendor training", name: "Vendors trained", unit: "vendors", target: 50, achieved: a(8) },
        { comp: "Street food vendor training", name: "Stall monitoring visits", unit: "visits", target: 50, achieved: a(4) }
      ],
      updates: sample ? [{ date: "2026-10-01", text: "Community sessions are running in three localities, with pre and post questions answered by raised cards." }, { date: "2026-09-15", text: "Arogya City Coordinator for Mumbai in place; community mobilisation partner on board." }] : [],
      datasets: sample ? [
        { id: "d-sample1", title: "Knowledge before and after the session", labelName: "Session", type: "bar", labels: ["GOV001", "GOV002", "GOV003", "GOV004", "GOV005", "GOV006"], series: [{ name: "Before, % correct", values: [52, 48, 57, 55, 50, 61] }, { name: "After, % correct", values: [81, 79, 86, 84, 77, 88] }], show: "govandi" },
        { id: "d-sample2", title: "mDiabetes enrolments, running total", labelName: "Week", type: "line", labels: ["1 Sep", "8 Sep", "15 Sep", "22 Sep", "29 Sep", "6 Oct"], series: [{ name: "People enrolled", values: [0, 180, 420, 760, 1120, 1460] }], show: "govandi" }
      ] : []
    };
  }

  window.AWIT = { esc, nf, compact, pct, sum, fmtDay, fmtDate, fmtTime, fmtDist, dayKey, uid, rng, hav, get, set, pinHash, dhash, ham, fileToPhoto, samplePhoto, getPos, parseLatLng, mapsLink, ch, wrap, tips, tile, kpis, img, flash, flagsHtml, flagForm, render, snapshot, govandiDefault, HUB_KEY: "awit.hub.v2" };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tips); else tips();
})();
