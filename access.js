/* Access settings for the AWIT program platform.

   Each line holds the fingerprint (SHA-256) of a passcode, not the passcode itself.
   To change a passcode: open admin/passcodes.html on the website, type the new passcode,
   copy the fingerprint it shows, and paste it below in place of the old one.

   This is a screen lock for a prototype. It keeps casual visitors out, but it is not
   real security: proper logins come with the shared database. */
window.AWIT_ACCESS = {
  // Managers and heads: Program MIS and both tool dashboards
  team: ["01e92f4b5d75adc8d7487587a570693f73f2d87a08426871cafe0028daef36c2"],
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
  window.awitHash = sha;
  window.awitGate = function (scope, title) {
    return new Promise(function (resolve) {
      const key = "awit.unlock." + scope;
      try { if (sessionStorage.getItem(key) === "1") return resolve(); } catch (e) {}
      const A = window.AWIT_ACCESS || { team: [], funders: {} };
      const allowed = scope === "team" ? A.team : ((A.funders || {})[scope.split(":")[1]] || []).concat(A.team);
      const o = document.createElement("div");
      o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Passcode needed");
      o.style.cssText = "position:fixed;inset:0;z-index:999;background:var(--paper,#F2F6FB);color:var(--ink,#16233F);display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:var(--body,system-ui,sans-serif)";
      o.innerHTML = '<div style="max-width:380px;width:100%"><h1 style="font-family:var(--display,system-ui,sans-serif);font-size:1.6rem;margin:0 0 .4rem">' + title + '</h1>' +
        '<p style="margin:0 0 1.1rem;color:var(--ink2,#52617E)">' + (scope === "team" ? "This page is for Arogya World India Trust managers. Enter the team passcode." : "Enter the passcode you were given for this project.") + '</p>' +
        '<label for="awit-pass" style="display:block;font-weight:700;margin-bottom:.3rem">Passcode</label>' +
        '<input id="awit-pass" type="password" autocomplete="off" style="width:100%;min-height:50px;font:inherit;padding:.5rem .8rem;border:1.5px solid currentColor;border-radius:12px;background:var(--sheet,#fff);color:inherit">' +
        '<p id="awit-err" role="alert" style="min-height:1.5rem;margin:.4rem 0;color:var(--bad,var(--margin,#C4352B));font-weight:700"></p>' +
        '<button id="awit-go" style="width:100%;min-height:50px;font:inherit;font-weight:700;border:0;border-radius:12px;background:var(--ink,#16233F);color:var(--paper,#fff);cursor:pointer">Open</button></div>';
      document.body.appendChild(o);
      const input = o.querySelector("#awit-pass"), err = o.querySelector("#awit-err");
      async function attempt() {
        if (!input.value) { err.textContent = "Enter the passcode."; return; }
        if (!(window.crypto && crypto.subtle)) { err.textContent = "Open this page from the website address (https) to unlock it."; return; }
        const h = await sha(input.value);
        if (allowed.indexOf(h) >= 0) { try { sessionStorage.setItem(key, "1"); } catch (e) {} o.remove(); resolve(); }
        else { err.textContent = "That passcode is not right. Try again."; input.value = ""; input.focus(); }
      }
      o.querySelector("#awit-go").addEventListener("click", attempt);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
      input.focus();
    });
  };
})();
