# Moon Platform — Design System

The site at moonplatform.app: Moon Platform's home (Apps, Games, Windows Tools) and Exon Platform's
pages under `/exon`. Static HTML, one stylesheet (`public/assets/moon.css`), one script
(`public/assets/moon.js`), no build step, no third-party request of any kind.

## 0. Research Log

- Reference: the owner's link, youtube.com/shorts/bZoUxuUnYxw («Websites in 2026 are a different
  game») — watched frame by frame on 6 Oct 2026. Taken from it: near-black scenes lit by ONE glowing
  object made of particles (a light-flower, a particle dandelion); display type far larger than the
  viewport, sliding sideways with scroll; tiny monospace HUD captions in the corners; grain over
  everything; cards that tilt toward the pointer. Not taken: any of those sites' copy, logos or
  marks.
- Embedded design references: the frontend skill's Layer A/B library is not installed on this
  machine beyond `aside.md`; skipped — the video is the reference.
- Lazyweb, Imagen drafts: skipped — no image generation here, and the owner gave a concrete
  reference.

## 1. Atmosphere & Identity

A night sky with one lit thing in it. The page is dark ink and quiet; the only bright object is the
moon, drawn from two thousand points of light, lit from one side so a crescent glows, turning slowly
and parting around the pointer. Everything else is moonlight on glass. **The signature: the particle
moon whose phase follows the scroll** — full when you arrive, waning as you move into what is still
being built.

## 2. Color

### Palette — dark only (the site is a night scene; light mode would erase the moon)

| Role | Token | Value | Usage |
|---|---|---|---|
| Ink 950 | `--ink-950` | `#04050b` | page background |
| Ink 900 | `--ink-900` | `#080b18` | lower bands, footer |
| Ink 800 | `--ink-800` | `#0f1430` | glass tint base |
| Lunar 700 | `--lunar-700` | `#2a3566` | rims at rest, dividers on glass |
| Lunar 500 | `--lunar-500` | `#5d73c4` | halo mid-stop |
| Lunar 300 | `--lunar-300` | `#a9b8ea` | secondary text on dark, HUD captions |
| Lunar 100 | `--lunar-100` | `#dfe5fa` | body text |
| Moonlight | `--moonlight` | `#f4f6ff` | headlines, primary button fill |
| Accent | `--accent` | `#9fb6ff` | links, focus ring (interactive only) |
| Accent hover | `--accent-hover` | `#c8d5ff` | link hover |
| Eclipse | `--eclipse` | `#ffbf73` | «in development» status only |
| Exon violet | `--exon` | `#7c6cf6` | Exon's own surfaces (from its icon's E) |

Text roles: `--text-primary` = moonlight, `--text-body` = lunar-100, `--text-muted` = lunar-300.
Lines: `--line` = `rgba(169,184,234,.14)`, `--line-strong` = `rgba(169,184,234,.28)`.

### Rules
- Accent is interactive only. Eclipse appears only on the «coming soon» status dot and chip.
- Light comes from the moon (upper right in LTR, upper left in RTL); gradients and rims fall off
  from that side.

## 3. Typography

System fonts by decision: the audience is largely in Afghanistan, Persian must render on every
device, and the site fetches nothing from anybody else (the privacy page promises as much).

| Level | Size | Weight | Line height | Tracking | Usage |
|---|---|---|---|---|---|
| Mega | `clamp(72px, 17vw, 260px)` | 800 | 0.86 | -0.05em | the sliding band |
| Display | `clamp(40px, 7.2vw, 96px)` | 700 | 1.02 | -0.035em | hero headline |
| H1 | `clamp(32px, 4.6vw, 60px)` | 700 | 1.05 | -0.03em | section titles |
| H2 | `clamp(24px, 2.6vw, 34px)` | 650 | 1.15 | -0.02em | card titles |
| Body/lg | `clamp(17px, 1.5vw, 20px)` | 400 | 1.65 | 0 | leads |
| Body | 16px | 400 | 1.7 | 0 | text |
| Body/sm | 14px | 400 | 1.6 | 0 | card meta |
| HUD | 11.5px | 500 | 1.4 | 0.18em, uppercase | monospace captions, overlines |

- Sans: `"Segoe UI Variable Display", "Segoe UI", -apple-system, "SF Pro Display", Roboto, "Noto Sans", "Noto Sans Arabic", Tahoma, sans-serif`
- Mono: `ui-monospace, "Cascadia Mono", "SF Mono", Consolas, "Liberation Mono", monospace`
- Persian (`[lang=fa]`) loosens tracking to 0 and raises line height by 0.15 — Arabic script must
  never be letter-spaced.

## 4. Spacing & Layout

Base 4px: `--s1` 4 · `--s2` 8 · `--s3` 12 · `--s4` 16 · `--s5` 20 · `--s6` 24 · `--s8` 32 ·
`--s10` 40 · `--s12` 48 · `--s16` 64 · `--s20` 80 · `--s24` 96 · `--s32` 128.

- Content width 1200px (`--wrap`), gutter `clamp(16px, 4vw, 40px)`.
- Breakpoints: 640 / 900 / 1200.
- Sections breathe: `--s32` between sections on desktop, `--s20` on phones.
- Asymmetry on purpose: the app card spans the row; Games and Tools sit as a pair below it,
  because one thing is out and two are not.

## 5. Components

### Header bar
- Mark + wordmark, nav (Apps, Games, Windows Tools), language toggle.
- At rest transparent; after 24px of scroll it becomes glass (recipe in §7). Mobile: nav collapses
  to the toggle and a compact anchor row under the bar.
- States: link hover → moonlight; focus → 2px accent ring offset 3px; current section → underline.

### Button
- `primary`: moonlight fill, ink text, radius 999px, height 48px, padding 0 `--s6`.
- `glass`: glass recipe, moonlight text.
- States: hover lifts 1px and brightens the rim; active presses back to 0; focus ring as above;
  `aria-disabled` never used — a button that cannot act is not shown.
- An icon inside is inline SVG 18px, `currentColor`.

### Glass card
- Recipe §7; radius 28px; padding `--s8` (`--s6` on phones).
- Tilts up to 4° toward the pointer on devices with a fine pointer (perspective 1200px) — the tilt
  is the affordance that the card is a link/has actions; static cards do not tilt.
- Entry: rises 24px and fades in once when it enters the viewport.

### Status chip
- Mono HUD text, pill, `--line-strong` rim. Variant `soon`: an eclipse dot that pulses (the thing it
  names is in progress — the motion carries the meaning).

### Language toggle
- Two buttons, `aria-pressed`; choice kept in localStorage (wrapped in try/catch).

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|---|---|---|---|
| Micro | 140ms | ease-out | button press, link colour |
| Standard | 260ms | cubic-bezier(.2,.7,.2,1) | header glass, card tilt return |
| Emphasis | 900ms | cubic-bezier(.16,1,.3,1) | reveals |
| Scroll-driven | tied to scroll | linear | moon phase, mega band slide |

- The moon renders on a canvas only while the hero is on screen and the tab is visible.
- Only `transform` and `opacity` animate (canvas draws are the moon's own).
- `prefers-reduced-motion`: the moon draws one still frame, bands stop, reveals are instant, no
  tilt.

## 7. Depth & Surface — mixed

- **Glass (dark glossy):** tint `linear-gradient(160deg, rgba(31,40,86,.55), rgba(10,13,30,.72))`
  + `backdrop-filter: blur(18px) saturate(140%)` + 1px rim `--line` brightening to `--line-strong`
  on the lit side + inner sheen `inset 0 1px 0 rgba(255,255,255,.08)` + outer glow
  `0 30px 80px -30px rgba(93,115,196,.45)`.
- **Atmosphere:** ink base, a halo `radial-gradient` behind the moon from `--lunar-500` at 18% to
  transparent, a static starfield (two layers, CSS), and film grain (SVG turbulence at 6%).
- **New-moon disc** (Games) and **light window** (Tools): CSS-only objects with rim light and an
  inner glow — dimensional, never flat circles.

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- WCAG 2.2 AA: body text lunar-100 on ink-950 ≈ 15:1; muted lunar-300 ≈ 9:1; HUD text never below
  11.5px and only for labels that repeat information.
- Visible focus on every interactive element; skip link to main; every section reachable by anchor.
- Canvas is `aria-hidden`; nothing is said only by the moon.
- `lang` and `dir` switch with the language; Persian text is never letter-spaced.

### Accepted Debt
| Item | Location | Why accepted | Exit |
|---|---|---|---|
| System fonts, no display face | all pages | no third-party fetch; Persian coverage everywhere | a self-hosted Persian/Latin pair if the owner wants one |
| Dark only | all pages | the moon is the light source | — |
| No screenshots of Exon yet | home, /exon | screenshots must come from a demo book, not the owner's | add from the app's shot harness with demo data |
