/* Nox — portfolio interactions: clock, theme, scroll reveal, year. */

(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) root.classList.add("reduced");

  /* ---------- local time in Germany ---------- */
  const clockEl = document.getElementById("clock");
  if (clockEl) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short",
    });
    const tick = () => {
      const parts = fmt.formatToParts(new Date());
      const get = (t) => (parts.find((p) => p.type === t) || {}).value || "";
      clockEl.textContent = `${get("hour")}:${get("minute")} ${get("timeZoneName")}`;
      clockEl.title = "Local time in Germany";
    };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- theme ---------- */
  const toggle = document.getElementById("theme-toggle");
  const label = toggle && toggle.querySelector(".theme-label");
  const stored = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const initial = stored || (prefersLight ? "light" : "dark");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (toggle) {
      const isLight = theme === "light";
      toggle.setAttribute("aria-pressed", String(isLight));
      if (label) label.textContent = isLight ? "Dark" : "Light";
      toggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f2f1ea" : "#0a0b0c");
  }

  applyTheme(initial);

  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem("theme", next);
    });
  }

  /* ---------- reveal on scroll ---------- */
  const targets = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((el) => io.observe(el));
  }

  /* ---------- footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- the cat (press "c" or click the footer glyph) ---------- */
  const cat = document.getElementById("cat-runner");
  const catBtn = document.getElementById("cat-glyph");

  if (cat && !reduceMotion) {
    const release = () => {
      if (cat.classList.contains("go")) return;
      cat.classList.add("go");
    };

    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (event.key.toLowerCase() === "c") release();
    });

    if (catBtn) catBtn.addEventListener("click", release);

    cat.addEventListener("animationend", (event) => {
      if (event.target === cat) cat.classList.remove("go");
    });
  }
})();
