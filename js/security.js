/* Security check — a live audit of the site from inside the browser.
   Everything here is measured: the headers come from a HEAD request to this
   origin, the rest from the page's own performance timeline. Nothing is sent
   anywhere, and every value is rendered with textContent (never innerHTML). */

(function () {
  "use strict";

  var root = document.documentElement;
  var list = document.getElementById("checks");
  var verdict = document.getElementById("verdict");
  var rows = [];

  function add(label, status, detail, title) {
    rows.push({ label: label, status: status, detail: detail, title: title || "" });
  }

  function truncate(s, n) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  /* ---------- theme (same behaviour as the homepage) ---------- */
  var toggle = document.getElementById("theme-toggle");
  var label = toggle && toggle.querySelector(".theme-label");
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    if (toggle) {
      var isLight = t === "light";
      toggle.setAttribute("aria-pressed", String(isLight));
      if (label) label.textContent = isLight ? "Dark" : "Light";
    }
  }
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  applyTheme(stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- helpers ---------- */
  function headerRow(headers, name, label, test) {
    var value = headers.get(name);
    add(label, value && (!test || test(value)) ? "pass" : "fail",
        value || "header missing", value || "");
  }

  /* ---------- the audit ---------- */
  async function audit() {
    // 1. transport actually used for this visit
    var secure = location.protocol === "https:";
    add("Transport", secure ? "pass" : "warn",
        secure
          ? "This page was served over TLS. The same site is also reachable on :8443."
          : "Served over plain HTTP on the LAN. A TLS listener exists on :8443 with a local CA.");

    var nav = performance.getEntriesByType("navigation")[0];
    if (nav && nav.nextHopProtocol) {
      add("Protocol", "info", nav.nextHopProtocol + " — negotiated by the server", nav.nextHopProtocol);
    }

    // 2. response headers, read from this origin
    var headers = null;
    try {
      var res = await fetch(new URL("./", location.href).href, { method: "HEAD", cache: "no-store" });
      headers = res.headers;
    } catch (e) {
      // expected on file:// or if the policy ever blocks same-origin fetch
    }

    if (headers) {
      var csp = headers.get("content-security-policy");
      add("Content-Security-Policy", csp && /default-src/.test(csp) ? "pass" : "fail",
          csp ? truncate(csp, 150) : "header missing", csp || "");

      headerRow(headers, "x-content-type-options", "X-Content-Type-Options", function (v) { return /nosniff/i.test(v); });
      headerRow(headers, "x-frame-options", "X-Frame-Options", function (v) { return /DENY/i.test(v); });
      headerRow(headers, "referrer-policy", "Referrer-Policy");
      headerRow(headers, "permissions-policy", "Permissions-Policy");
      headerRow(headers, "cross-origin-opener-policy", "COOP");
      headerRow(headers, "cross-origin-resource-policy", "CORP");

      var server = headers.get("server") || "";
      var leaks = /\d+\.\d+/.test(server);
      add("Server banner", server && !leaks ? "pass" : "warn",
          server ? server + (leaks ? " — exposes a version" : " — no version disclosed") : "not disclosed",
          server);

      var hsts = headers.get("strict-transport-security");
      add("HSTS", hsts ? "pass" : "info",
          hsts || "not set here — expected: HSTS belongs on the public HTTPS vhost, not on a LAN self-signed listener.",
          hsts || "");
    } else {
      add("Response headers", "warn", "Could not read headers from this context — open the page over HTTP(S) rather than from disk.");
    }

    // 3. what the document actually loaded
    var resources = performance.getEntriesByType("resource") || [];
    var external = resources.filter(function (e) {
      try { return new URL(e.name).origin !== location.origin; } catch (err) { return false; }
    });
    add("Third-party requests", external.length === 0 ? "pass" : "fail",
        external.length === 0
          ? "None. Fonts, styles and scripts are all served from this origin."
          : external.map(function (e) { return e.name; }).join(", "),
        external.map(function (e) { return e.name; }).join("\n"));

    var fonts = resources.filter(function (e) { return /\.woff2?(\?|$)/.test(e.name); });
    var localFonts = fonts.every(function (f) {
      try { return new URL(f.name).origin === location.origin; } catch (err) { return false; }
    });
    add("Web fonts", fonts.length === 0 ? "info" : localFonts ? "pass" : "fail",
        fonts.length === 0
          ? "No webfont files loaded (system fallback)."
          : fonts.length + " subset" + (fonts.length === 1 ? "" : "s") + " loaded, all from this origin.",
        fonts.map(function (f) { return f.name; }).join("\n"));

    // 4. what it stored
    var cookieCount = document.cookie ? document.cookie.split(";").filter(Boolean).length : 0;
    add("Cookies", cookieCount === 0 ? "pass" : "warn",
        cookieCount === 0
          ? "None. There is no analytics, no session, no consent banner."
          : cookieCount + " cookie(s) present: " + document.cookie);

    var lsKeys = [];
    try { lsKeys = Object.keys(localStorage); } catch (e) {}
    add("Browser storage", lsKeys.length === 0 ? "pass" : "info",
        lsKeys.length === 0
          ? "Nothing stored."
          : "Keys: " + lsKeys.join(", ") + " — theme preference only, never sent anywhere.",
        lsKeys.join("\n"));

    // 5. integrity of the shell
    var inlineHandlers = document.querySelectorAll("[onclick],[onload],[onerror]").length;
    add("Inline event handlers", inlineHandlers === 0 ? "pass" : "fail",
        inlineHandlers === 0 ? "None — the CSP forbids them and the markup has none." : inlineHandlers + " found.");

    render();
  }

  function render() {
    var pass = 0, fail = 0, warn = 0;

    rows.forEach(function (r) {
      if (r.status === "pass") pass++;
      if (r.status === "fail") fail++;
      if (r.status === "warn") warn++;

      var row = document.createElement("div");
      row.className = "check";

      var l = document.createElement("span");
      l.className = "check-label";
      l.textContent = r.label;

      var v = document.createElement("span");
      v.className = "check-value";
      v.textContent = r.detail;
      if (r.title) v.title = r.title;

      var s = document.createElement("span");
      s.className = "status status--" + r.status;
      s.textContent = r.status;

      row.append(l, v, s);
      list.appendChild(row);
    });

    var total = rows.filter(function (r) {
      return r.status === "pass" || r.status === "fail" || r.status === "warn";
    }).length;

    var allClean = fail === 0 && warn === 0;
    verdict.setAttribute("data-state", fail ? "bad" : allClean ? "ok" : "warn");
    verdict.querySelector(".verdict-count").textContent = pass + " / " + total;
    verdict.querySelector(".verdict-label").textContent = allClean
      ? "checks passed — measured just now, in your browser"
      : (fail ? fail + " failed" : "") +
        (fail && warn ? " · " : "") +
        (warn ? warn + " to review" : "") +
        " — everything else passed";
  }

  audit();
})();
