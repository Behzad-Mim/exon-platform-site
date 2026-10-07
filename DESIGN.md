# Moon Platform — Design System

The site at moonplatform.app: Moon Platform's home (Apps, Games, Windows Tools, Updates, Contact)
and Exon Platform's pages under `/exon`. Static pages in `public/`, one stylesheet
(`public/assets/site.css`), two bundles built from `src/` (`main.js` for the home page with its
WebGL scene, `page.js` for the inner pages). Nothing is fetched from any other site.

## 0. Research Log

- Reference 1: youtube.com/shorts/bZoUxuUnYxw («Websites in 2026 are a different game»), watched
  frame by frame (6 Oct 2026): near-black scenes lit by one glowing object made of particles, huge
  type, HUD captions, grain, cards that tilt and slide.
- Reference 2 (7 Oct 2026, the owner): a capsule navigation bar — a mark, tabs each in its own
  soft pill, a dark «Get Started» at the end — and a scroll scenario: the particle moon reacting
  to the pointer; the first scroll bursts it towards the camera; Apps in violet and blue with the
  app in 3D devices and hologram labels; Games darker with neon pink and green and a controller
  that assembles; Windows Tools in cyber blue with a glass bento; a dark contact finale with a
  form and a glowing contact@moonplatform.app. Libraries named: Three.js, GSAP + ScrollTrigger,
  Lenis, glassmorphism.
- Reference 3: the owner's BAXAK store screenshots — a bold title over a phone on a light patterned
  ground with a diagonal colour band. Used for the Exon pictures (`publish/marketing/`), built
  from the app's own screens (UiProbe `--market`, a made-up demo book).
- Skipped: the frontend skill's Layer A/B library is not installed here beyond `aside.md`;
  Imagen and Lazyweb not available. The owner's references are the contract.

## 1. Atmosphere & Identity

A night sky with one lit thing in it, and the page is a journey through it. You arrive at the moon
— thousands of points of light, lit from one side, parting around the pointer. The first scroll
bursts it towards you and you fly through; on the far side each part of the page has its own light:
violet and blue for the app that exists, neon for the games that do not yet, cyber blue for the
tools in the workshop, and then quiet. **The signature: one cloud of particles that becomes the
moon, the burst, a game controller and a pair of gears — the same points, re-forming.**

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Ink 950 / 900 / 800 | `--ink-950/900/800` | `#03040a` `#070915` `#0e1230` | ground, footer, glass base |
| Lunar 700 / 500 / 300 / 100 | `--lunar-*` | `#2a3566` `#5d73c4` `#a9b8ea` `#dfe5fa` | rims, halos, muted text, body text |
| Moonlight | `--moonlight` | `#f4f6ff` | headlines, primary button |
| Accent | `--accent` / `--accent-hover` | `#9fb6ff` / `#c8d5ff` | links, focus |
| Eclipse | `--eclipse` | `#ffbf73` | «in development» status only |
| Apps light | `--exon-violet` `--exon-blue` | `#8b7cf8` `#4f7cff` | Apps scene, gloss button |
| Games light | `--neon-pink` `--neon-green` | `#ff3fa4` `#39ff9a` | Games scene, glitch |
| Tools light | `--cyber` `--cyber-deep` | `#3fd0ff` `#2a6bff` | Tools scene, bento, holograms |

The scene's particle colours follow the section (main.js `PALETTE`), crossfaded by how far each
section is on screen; the sky behind has one gradient layer per section (`.sky__*`), crossfaded the
same way. Accent stays interactive-only.

## 3. Typography

| Level | Size | Weight | Usage |
|---|---|---|---|
| Display | `clamp(44px, 8.4vw, 132px)` / 0.98 / -0.045em | 800 | hero |
| H1 | `clamp(34px, 5.4vw, 76px)` / 1.02 / -0.035em | 800 | section titles |
| H2 | `clamp(24px, 2.6vw, 34px)` | 700 | card titles |
| Lead | `clamp(17px, 1.5vw, 20px)` / 1.65 | 400 | intros |
| HUD | 12px mono, 0.2em, uppercase (Persian: 14px Calibri, no tracking) | 500 | overlines, chips |

- Latin: the system's display face (`Segoe UI Variable Display`, SF Pro…). Persian: **Calibri**
  (the owner's choice, 7 Oct 2026) — Windows' own font, which carries Persian. It cannot be served
  from the site (Microsoft's licence), so phones without it fall back to their own Persian face
  (Noto Sans Arabic UI on Android). No web font is downloaded at all.
- Mono: `ui-monospace, Cascadia Mono…` — HUD, terminal, glitch titles.
- Persian text is never letter-spaced; line heights rise for it.

## 4. Spacing & Layout

Base 4px (`--s1`…`--s40`). Content width 1200px, gutter `clamp(16px, 4vw, 40px)`. Sections
`--s40` apart on desktop, `--s24` on phones. Breakpoints 560 / 600 / 760 / 860 / 900 / 1000.
`html, body { overflow-x: clip }` — nothing sliding in from the side may widen a phone's page.

## 5. Components

- **Capsule** (`.capsule`): mark · tabs (Apps, Games, Windows Tools, Updates, Search) · language
  pill · dark «Get Started». Glass that thickens once the page moves (`.is-floating`). Under 860px:
  mark · Get Started · menu button → `.menu` glass sheet. Current section underlined
  (`aria-current`).
- **Search** (`.search`): `/` or Ctrl+K or the tab; a fixed index in `common.js`, both languages;
  arrows + Enter; Escape closes.
- **Glass** (`.glass`): tint gradient + blur(20px) saturate + 1px rim + lit-side rim gradient
  (mirrored in Persian) + inner sheen + outer glow. Cards, tiles, form, holograms are glass so the
  scene shows through them.
- **Buttons**: `--primary` (moonlight), `--glass`, `--gloss` (violet→blue→cyan with a sheen that
  crosses on hover — the download buttons). Height 52.
- **Stage3d**: CSS 3D monitor + phone holding the app's real screens (`assets/screens/{en,fa}`),
  turned by ScrollTrigger while pinned; **holograms** (`.holo`) fade up beside them.
- **Gallery** (`.strip`): the store pictures (`assets/shots/{en,fa}`), sideways scroll-snap, arrow
  buttons; only the current language's images load.
- **Game card**: neon glass, glitch title (redacted, honest — the games are unannounced), slides
  in skewed from the side.
- **Bento tile**: cyber glass; the big one is a terminal that types on approach and hover; small
  ones turn their gear on hover; tool names redacted until the owner names them.
- **Update**: release cards from `/api/updates` (GitHub's releases feed via the worker).
- **Contact form**: name, email, message, a hidden honeypot; status line; posts to
  `/api/contact`, which mails the owner through Cloudflare Email Routing.

## 6. Motion & Interaction

| What | How |
|---|---|
| Smooth scroll | Lenis (`lerp .085`), driven by GSAP's ticker; ScrollTrigger updates on its scroll |
| Hero | pinned 110% (70% on phones); the scene's burst follows the pin's progress; the words scale up, blur and fade; a flash at the crossing |
| Scene | `scene.js`: one `Points` with four positions per point (moon, burst, controller, gears) mixed in the vertex shader; colours, camera and mixes eased per frame toward what the page says (`main.js place()`); pointer pushes points apart in screen space |
| Apps | `.apps-show` pinned 130% on desktop; devices turn, holograms stagger in |
| Games / Tools | cards slide in skewed; tiles rise with a slight X tilt |
| Reveals | GSAP from y 36 / opacity 0, expo.out, once |

Only transform, opacity and filter animate. `prefers-reduced-motion`: no Lenis, no reveals, no
glitch, the scene frozen in place (no drift or spin), still readable at every scroll position.
No WebGL: `html.no-webgl`, the canvas hidden, the sky gradients carry the page.
Performance: points 22k desktop / 9k phone, DPR ≤ 1.75 / 1.5; if frames run long the scene drops
to 60% of the points and resolution; the loop rests while the tab is hidden.

## 7. Depth & Surface

Mixed: the scene and sky are the light; glass surfaces take their colour from what is behind
them; rims catch the light on the side the moon is (upper right; upper left in Persian).

## 8. Accessibility Constraints & Accepted Debt

- WCAG 2.2 AA contrast on text; visible focus everywhere; skip link; every section has a heading
  and an anchor; the canvas and decorations are `aria-hidden`; the language switch changes `lang`,
  `dir` and the title.
- The terminal's text is a decoration of a status that the tiles also say in words.

| Accepted debt | Why | Exit |
|---|---|---|
| main.js ~700 KB raw (~180 KB brotli) | three.js | import from three's own modules if the size starts to matter |
| Tool and game names redacted | unannounced | the owner names them; each gets a page like /exon |
| Exon pictures from a demo book in the app's dark theme | no real data may appear | — |
| Date-box placeholders in the app read «1405/01/01» even in Gregorian | app-side, hard-coded watermark | fix in the app (owner's list) |
