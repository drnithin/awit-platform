/* Access settings for the AWIT program platform.

   Each line holds the fingerprint (SHA-256) of a passcode, not the passcode itself.
   To change a passcode: open admin/passcodes.html on the website, type the new passcode,
   copy the fingerprint it shows, and paste it below in place of the old one.

   This is a screen lock for a prototype. It keeps casual visitors out, but it is not
   real security: proper logins come with the shared database. */
window.AWIT_ACCESS = {
  // Arogya World India Trust managers and heads: Program MIS and every dashboard
  team: ["01e92f4b5d75adc8d7487587a570693f73f2d87a08426871cafe0028daef36c2"],
  // Partner managers: each opens only that partner's part of a tool dashboard
  partners: {
    cini: ["207c9de8644ce3f7a36f275e8c60ccc0353d822c47a33108cae2852a4a10a3b7"],
    mamta: ["1c27dd6d0c7060e5c1fc64e408e485ade69a243fc5c0fcb3d6e5e9c548f392de"],
    nasvi: ["17f768719e33382c2e53e7ba2f6759dd6a341b3c9cb083884022f9930804b9ae"]
  },
  // One line per funder dashboard. The team passcode also opens every funder dashboard.
  funders: {
    govandi: ["c80fbfc4e03dfba4345f6b1de5e19e0495599476c2bd9e77ee60df07ed2b0768"]
  }
};
(function () {
  async function sha(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  const ss = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function screen(title, intro, orgs, check, done) {
    const o = document.createElement("div");
    o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Sign in");
    o.style.cssText = "position:fixed;inset:0;z-index:999;background:var(--paper,#F2F6FB);color:var(--ink,#16233F);display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:var(--body,system-ui,sans-serif);overflow:auto";
    const inputCss = "width:100%;min-height:50px;font:inherit;padding:.5rem .8rem;border:1.5px solid currentColor;border-radius:12px;background:var(--sheet,#fff);color:inherit";
    o.innerHTML = '<div style="max-width:400px;width:100%"><h1 style="font-family:var(--display,system-ui,sans-serif);font-size:1.6rem;margin:0 0 .4rem">' + esc(title) + '</h1>' +
      '<p style="margin:0 0 1.1rem;color:var(--ink2,#52617E)">' + esc(intro) + '</p>' +
      (orgs ? '<label for="awit-org" style="display:block;font-weight:700;margin-bottom:.3rem">Your organisation</label><select id="awit-org" style="' + inputCss + ';margin-bottom:1rem">' + orgs.map(function (g) { return '<option value="' + esc(g.id) + '">' + esc(g.name) + '</option>'; }).join("") + '</select>' : '') +
      '<label for="awit-pass" style="display:block;font-weight:700;margin-bottom:.3rem">Passcode</label>' +
      '<input id="awit-pass" type="password" autocomplete="off" style="' + inputCss + '">' +
      '<p id="awit-err" role="alert" style="min-height:1.5rem;margin:.4rem 0;color:var(--bad,#C4352B);font-weight:700"></p>' +
      '<button id="awit-go" style="width:100%;min-height:50px;font:inherit;font-weight:700;border:0;border-radius:12px;background:var(--ink,#16233F);color:var(--paper,#fff);cursor:pointer">Sign in</button></div>';
    document.body.appendChild(o);
    const input = o.querySelector("#awit-pass"), err = o.querySelector("#awit-err"), sel = o.querySelector("#awit-org");
    async function attempt() {
      if (!input.value) { err.textContent = "Enter the passcode."; return; }
      if (!(window.crypto && crypto.subtle)) { err.textContent = "Open this page from the website address (https) to sign in."; return; }
      const h = await sha(input.value), org = sel ? sel.value : null;
      if (check(h, org)) { o.remove(); done(org); }
      else { err.textContent = "That passcode is not right for " + (sel ? sel.options[sel.selectedIndex].text : "this page") + ". Try again."; input.value = ""; input.focus(); }
    }
    o.querySelector("#awit-go").addEventListener("click", attempt);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
    (sel || input).focus();
  }
  window.awitHash = sha;
  /* One passcode, no organisation: the Program MIS ("team") and funder pages ("funder:<id>"). */
  window.awitGate = function (scope, title) {
    return new Promise(function (resolve) {
      const key = "awit.unlock." + scope;
      if (ss.get(key) === "1" || ss.get("awit.unlock.team") === "1") return resolve();
      const A = window.AWIT_ACCESS || {};
      const allowed = scope === "team" ? (A.team || []) : (((A.funders || {})[scope.split(":")[1]] || []).concat(A.team || []));
      screen(title, scope === "team" ? "This page is for Arogya World India Trust managers. Enter the team passcode." : "Enter the passcode you were given for this project.", null,
        function (h) { return allowed.indexOf(h) >= 0; }, function () { ss.set(key, "1"); resolve(); });
    });
  };
  /* Tool dashboards: Arogya World ("aw") or a partner. Resolves with the organisation id. */
  window.awitSignIn = function (app, title, orgs) {
    return new Promise(function (resolve) {
      const key = "awit.org." + app, had = ss.get(key);
      if (had && orgs.some(function (g) { return g.id === had; })) return resolve(had);
      if (ss.get("awit.unlock.team") === "1") { ss.set(key, "aw"); return resolve("aw"); }
      const A = window.AWIT_ACCESS || {};
      screen(title, "Sign in with your organisation's passcode. Partner managers see their own schools or vendors only.", orgs,
        function (h, org) { return (org === "aw" ? (A.team || []) : ((A.partners || {})[org] || [])).indexOf(h) >= 0; },
        function (org) { ss.set(key, org); if (org === "aw") ss.set("awit.unlock.team", "1"); resolve(org); });
    });
  };
  window.awitSignOut = function (app) { ss.del("awit.org." + app); ss.del("awit.unlock.team"); location.reload(); };
})();
