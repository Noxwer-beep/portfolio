# maximilian jatzkowski — portfolio

A single-page portfolio: dark-first, one accent, no framework, no build step.
Open `index.html` in a browser and it works.

    portfolio/
    ├── index.html          all content lives here
    ├── vantage.html        case study: the Vantage scanner
    ├── 404.html            served by nginx for unknown paths
    ├── security.html       the "security check" page
    ├── css/
    │   ├── styles.css      design tokens + layout
    │   ├── project.css     case-study prose, code blocks, figures
    │   └── 404.css
    ├── js/
    │   ├── head.js         adds .js before first paint (CSP-safe, no inline script)
    │   ├── main.js         clock, theme toggle, scroll reveal, the cat
    │   └── 404.js
    ├── assets/
    │   ├── logo.svg        lockup for dark surfaces
    │   ├── logo-light.svg  lockup for light surfaces
    │   ├── mark.svg        cat mark on transparent
    │   ├── favicon.svg     cat mark in a dark tile
    │   ├── vantage-report.png    report screenshot (case study)
    │   └── vantage-findings.png  findings screenshot (case study)
    ├── tools/build_logo.py regenerates the logo files
    └── README.md

## Preview locally

    cd ~/portfolio
    python3 -m http.server 8787
    # open http://localhost:8787

Opening the file directly (`file://`) also works — nothing is fetched with JS.

## Content status

Real and final: name, email, homelab, Hack The Box, Metasploitable 2, AI agents,
IT studies, cats.

Still to fill in when available:

1. **Hack The Box profile** — the contact link points at `https://www.hackthebox.com/`.
   Swap in your public profile URL (`https://app.hackthebox.com/profile/…`).
2. **GitHub / LinkedIn** — commented out in the contact `<ul>`. Uncomment and set
   the URLs once the profiles exist.
3. **A CV** — no download link is wired up. If you add `assets/cv.pdf`, add a
   `Download CV` button in `.hero-actions`.
4. **`og:url`** — still `https://example.com`; set it to the live domain, and add an
   `og:image` (1200×630) for link previews.

## The cat

Three quiet appearances, no emoji, nothing that undermines the professional read:

- a 17px sitting-cat glyph in the footer colophon (clickable, tooltip "Press c")
- press `c` anywhere on the page and a cat trots across the bottom of the viewport
- one line in About, one fact row ("Off-screen"), and a `Press c` hint in the
  "This site" work entry

It is ignored while typing in an input, and completely disabled under
`prefers-reduced-motion`. To remove all of it: delete `.cat-runner` and `.cat-glyph`
from `index.html`, the `/* the cat */` block in `css/styles.css`, and the
`/* the cat */` block in `js/main.js`.

## Logo

The mark is a cat head whose ears are cut into the top edge of the silhouette;
the pupils are knocked out with a mask (so the tile colour shows through rather
than a painted-on colour), and the nose is the only accent — the same lime as the
site. It is built from one geometry description, so the favicon, the header mark
and the lockup can never drift apart.

- **Header** — inline SVG mark at 26px next to live text `mj /dev`, so it stays
  crisp on any display and inherits the hover tilt.
- **Favicon** — the mark in a rounded dark tile.
- **Lockups** — `logo.svg` (cream text, for dark surfaces) and `logo-light.svg`
  (ink text, for white paper). The wordmark is *outlined paths*, not `<text>`, so
  it renders identically on machines without Space Grotesk installed.

Regenerating (needs a Space Grotesk TTF, OFL licensed — download it first):

    FONT=/path/to/SpaceGrotesk.ttf python3 tools/build_logo.py

## Deployment

This folder is the source; a copy is served from the homelab VM by a hardened
rootless-Podman nginx container. Operational notes, the publish script and the
remaining root-only steps (firewall, optional TLS) live in
`/home/nox/srv/mj-portfolio/README-OPS.md`. Short version:

    /home/nox/srv/mj-portfolio/bin/deploy.sh

## Related

- `/home/nox/showcase` — five alternative homepage concepts, same person, served
  on :8089. Useful when a section of this page needs rethinking.
- `/home/nox/Obsidian/Engineering` — the vault with decisions, ops runbook and
  build logs for both projects.

## Design tokens

All colors, fonts, and spacing are CSS variables at the top of `css/styles.css`.
Two themes: `[data-theme="dark"]` (default) and `[data-theme="light"]`. The accent
is a single value (`--accent`) — change it in one place and the page follows.

- Display: Space Grotesk (self-hosted woff2)
- Accent italic: Instrument Serif
- Details / labels: JetBrains Mono

Fonts are **self-hosted**: woff2 subsets live in `css/fonts/` and `css/fonts.css`
declares them. No Google Fonts request, no visitor IPs leaving the network — which
is also why the server's CSP can stay at `font-src 'self'`.

To change or add a family, regenerate rather than hand-editing:

    python3 tools/fetch_fonts.py "<google-css2-url>" /home/nox/portfolio

(`tools/fetch_fonts.py` keeps only the latin and latin-ext subsets.)

## Details worth knowing

- The clock in the header shows Europe/Berlin time, updated every 15s.
- Theme choice persists in `localStorage`; first visit follows the OS preference.
- Scroll reveals are progressive enhancement: without JS every section is visible.
- `prefers-reduced-motion` disables animation and smooth scrolling.
- Anchor links use `scroll-margin-top` so section headings clear the sticky header.
- Work entries are `<article>`s. Vantage's name is a link because a full case
  study exists at `vantage.html`; the others stay unlinked rather than pointing at
  dead pages.

## Case studies

`vantage.html` is the first full write-up: problem, what it does, the confidence
model, the authorisation gate, what went wrong on the first attempt, and what is
next. It reuses the site's tokens via `css/project.css` — same header, same theme
toggle, same footer, so it reads as part of the site rather than a separate site.

Adding another: copy `vantage.html`, keep the header/footer blocks, replace the
`.prose` body, add a `pj-meta` list at the top, and link it from the relevant
`.work-name` in `index.html`.

## Deploying

Any static host works, since there's no build step:

- **GitHub Pages** — push to a repo, Settings → Pages → deploy from branch root.
- **Cloudflare Pages / Netlify** — connect the repo, no build command, output dir `/`.
- **Your own box** — drop the folder behind the reverse proxy you already run
  (Traefik/Caddy), e.g. `caddy file-server --root ~/portfolio --domain example.com`.

Before going live: the four items under "Content status".
