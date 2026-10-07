// The home page: the scene, and how the page moves it.
//
// Pinning and the DOM's own movements are GSAP ScrollTrigger timelines. The scene is told where the
// page is once a frame — how far the hero has burst, how far into Games and Tools — and eases there
// itself, so a fast flick never makes it jump.

import { body, gsap, lang, reveal, ScrollTrigger, still, theme } from "./common.js";
import { createScene } from "./scene.js";

const small = innerWidth < 760;   // the scene's point count, chosen once
const canvas = document.querySelector("canvas.scene");
const scene = canvas && createScene(canvas, { small, still });
if (!scene) document.documentElement.classList.add("no-webgl");

const $ = (s) => document.querySelector(s);
const clamp = (v) => Math.min(1, Math.max(0, v));
const PALETTE = {
  // light added over a dark sky
  dark: {
    hero: ["#f4f6ff", "#a9b8ea"],
    apps: ["#8b7cf8", "#4f7cff"],
    games: ["#ff3fa4", "#39ff9a"],
    tools: ["#3fd0ff", "#2a6bff"],
    end: ["#7f8fd0", "#3a4a8f"],
  },
  // ink over a light one: the same hues, deep enough to read on white
  light: {
    hero: ["#141a46", "#3a4c9e"],
    apps: ["#5a3fe0", "#2457e6"],
    games: ["#e01283", "#08a058"],
    tools: ["#0886c8", "#1c48d0"],
    end: ["#59649c", "#2e3c80"],
  },
};

// ------------------------------------------------------------------ the hero and the devices, per width

// Rebuilt whenever the window crosses the phone width or the motion setting changes: a window
// dragged narrow must get the phone's pins and lengths, not keep the desktop's (gsap.matchMedia
// reverts everything a context made, inline styles included, and runs it again).
const NARROW = "(max-width: 760px)";
let narrow = matchMedia(NARROW).matches;
addEventListener("resize", () => { narrow = matchMedia(NARROW).matches; });

let heroProgress = 0;
const hero = $("#top");
const stage = $(".stage3d");

gsap.matchMedia().add({ narrow: NARROW, wide: "(min-width: 761px)", motion: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
  const { narrow: isNarrow, motion } = ctx.conditions;

  // the hero: the moon, then through it
  if (hero) {
    const words = hero.querySelector(".hero__words");
    const length = isNarrow ? "+=70%" : "+=110%";
    ScrollTrigger.create({
      trigger: hero, start: "top top", end: length, pin: true, scrub: true,
      onUpdate: (self) => { heroProgress = self.progress; },
    });
    if (motion) {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: length, scrub: true } })
        .to(words, { scale: 1.35, opacity: 0, filter: "blur(10px)", ease: "power2.in" }, 0)
        .to(".hero__hud", { opacity: 0, ease: "none" }, 0)
        .to(".hero__flash", { opacity: 1, ease: "power2.in", duration: 0.5 }, 0.55)
        .to(".hero__flash", { opacity: 0, ease: "power2.out", duration: 0.45 }, 1.05);
    }
  }

  // apps: the devices turn, the holograms come up — pinned on a wide screen, in passing on a phone
  if (stage && motion) {
    gsap.timeline({
      scrollTrigger: { trigger: ".apps-show", start: isNarrow ? "top 75%" : "top top", end: isNarrow ? "bottom 45%" : "+=130%",
        pin: isNarrow ? false : ".apps-show", scrub: 0.8 },
    })
      .fromTo(".monitor3d", { rotateY: isNarrow ? -18 : -32, rotateX: isNarrow ? 8 : 14, z: isNarrow ? -80 : -260, y: isNarrow ? 30 : 60 },
        { rotateY: isNarrow ? -6 : -10, rotateX: isNarrow ? 2 : 4, z: 0, y: 0, ease: "power2.out" }, 0)
      .fromTo(".phone3d", { rotateY: isNarrow ? 22 : 38, rotateX: isNarrow ? 4 : 8, z: isNarrow ? -40 : -120, y: isNarrow ? 60 : 140 },
        { rotateY: isNarrow ? 8 : 12, rotateX: 2, z: isNarrow ? 40 : 120, y: 0, ease: "power2.out" }, 0)
      .fromTo(".holo", { opacity: 0, z: -80, scale: 0.85 }, { opacity: 1, z: isNarrow ? 20 : 60, scale: 1, stagger: 0.12, ease: "power3.out" }, 0.25);
  }

  return () => { heroProgress = 0; };
});

// ------------------------------------------------------------------ games: the cards come in from the edges

if (!still) {
  gsap.utils.toArray(".game-card").forEach((card, i) => {
    gsap.fromTo(card, { x: i % 2 ? 220 : -220, skewX: i % 2 ? -14 : 14, opacity: 0 }, {
      x: 0, skewX: 0, opacity: 1, ease: "expo.out", duration: 1.3,
      scrollTrigger: { trigger: card, start: "top 85%", once: true, onEnter: () => card.classList.add("is-glitching") },
    });
  });
  gsap.utils.toArray(".tile").forEach((tile, i) => {
    gsap.fromTo(tile, { y: 50, opacity: 0, rotateX: 18 }, {
      y: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: "expo.out", delay: (i % 3) * 0.08,
      scrollTrigger: { trigger: tile, start: "top 90%", once: true },
    });
  });
}

// ------------------------------------------------------------------ tools: a terminal that types when you come near it

for (const term of document.querySelectorAll("[data-type]")) {
  const out = term.querySelector("pre");
  const script = () => (lang() === "fa" ? term.dataset.typeFa : term.dataset.typeEn).split("|");
  let typing = null;
  out.textContent = script().join("\n");
  const type = () => {
    if (typing) return;
    const lines = script();
    out.textContent = "";
    let line = 0, ch = 0;
    typing = setInterval(() => {
      if (line >= lines.length) { clearInterval(typing); typing = null; return; }
      out.textContent += lines[line][ch] ?? "";
      ch++;
      if (ch > lines[line].length) { out.textContent += "\n"; line++; ch = 0; }
    }, still ? 0 : 26);
  };
  term.closest(".tile")?.addEventListener("pointerenter", type);
  ScrollTrigger.create({ trigger: term, start: "top 75%", once: true, onEnter: type });
  window.addEventListener("moon:lang", () => { clearInterval(typing); typing = null; out.textContent = script().join("\n"); });
}

// ------------------------------------------------------------------ updates: the newest releases, from the site itself

const updates = $("[data-updates]");
if (updates) {
  let items = null;
  const render = () => {
    if (!items) return;
    updates.innerHTML = "";
    for (const r of items.slice(0, 4)) {
      const a = document.createElement("a");
      a.className = "update glass";
      a.href = r.url;
      const date = new Date(r.date);
      const head = document.createElement("div");
      head.className = "update__head";
      const v = document.createElement("span");
      v.className = "update__version";
      v.textContent = "Exon " + r.version;
      const d = document.createElement("time");
      d.dateTime = r.date;
      d.textContent = date.toLocaleDateString(lang() === "fa" ? "fa-AF" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
      head.append(v, d);
      const p = document.createElement("p");
      p.textContent = (lang() === "fa" ? r.fa : r.en) || r.en || r.fa || "";
      a.append(head, p);
      updates.append(a);
    }
  };
  // the cards change the page's height under them: every pin and position below is measured again
  fetch("/api/updates").then((r) => (r.ok ? r.json() : null)).then((j) => { items = j?.releases || null; render(); ScrollTrigger.refresh(); }).catch(() => {});
  window.addEventListener("moon:lang", render);
}

// ------------------------------------------------------------------ the scene, told where the page is

if (scene) {
  const sections = { apps: $("#apps"), games: $("#games"), tools: $("#tools"), updates: $("#updates"), contact: $("#contact") };
  const layers = { hero: $(".sky__hero"), apps: $(".sky__apps"), games: $(".sky__games"), tools: $(".sky__tools") };

  // Where each part starts on the page, measured when ScrollTrigger lays the page out (pins add their
  // spacing then), not asked of the browser every frame: a getBoundingClientRect in the frame forced a
  // style and layout pass first, and on a phone that was frame time the points needed.
  const tops = {};
  let vh = innerHeight, pageY = scrollY;
  const measure = () => {
    vh = innerHeight;
    pageY = scrollY;
    for (const [k, el] of Object.entries(sections)) if (el) tops[k] = el.getBoundingClientRect().top + scrollY;
  };
  measure();
  ScrollTrigger.addEventListener("refresh", measure);
  addEventListener("scroll", () => { pageY = scrollY; }, { passive: true });
  addEventListener("resize", () => { vh = innerHeight; }, { passive: true });
  const into = (key, from, to) => {
    if (tops[key] === undefined) return 0;
    const top = tops[key] - pageY;
    return clamp((from * vh - top) / ((from - to) * vh));
  };
  const mix = (a, b, t) => a + (b - a) * t;
  const palettes = {};
  for (const [name, set] of Object.entries(PALETTE)) {
    palettes[name] = {};
    for (const [k, [a, b]] of Object.entries(set)) palettes[name][k] = [hex(a), hex(b)];
  }
  // what was last written, so a frame that changes nothing writes nothing (each write is a style recalc)
  const written = { scene: "", layers: {} };

  function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

  function place() {
    const t = scene.target;
    const explode = clamp(heroProgress * 1.15);
    const appsIn = into("apps", 0.9, 0.1);
    const ctrlIn = into("games", 0.85, 0.3);
    const gearIn = into("tools", 0.85, 0.3);
    const gearOut = into("updates", 0.8, 0.2);
    const end = into("contact", 0.9, 0.3);

    t.explode = explode;
    t.ctrl = ctrlIn * (1 - gearIn);
    t.gear = gearIn * (1 - gearOut);
    t.camZ = mix(mix(6, 2.1, explode), narrow ? 9.5 : 7.4, appsIn);
    t.camY = 0;
    // on a phone the shapes sit behind the headings: by day, ink behind dark text, so fainter
    t.opacity = mix(1, 0.35, end) * (narrow ? (theme() === "light" ? 0.65 : 0.9) : 1);
    t.ctrlX = narrow ? 0 : (lang() === "fa" ? -1.4 : 1.4);   // across from the heading
    t.gearX = narrow ? 0 : (lang() === "fa" ? -1.5 : 1.5);   // across from the heading

    // the light of each part of the page
    const w = {
      hero: 1 - explode,
      apps: explode * (1 - ctrlIn),
      games: ctrlIn * (1 - gearIn),
      tools: gearIn * (1 - gearOut),
      end: gearOut,
    };
    const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
    const colours = palettes[theme()];
    const a = [0, 0, 0], b = [0, 0, 0];
    for (const [k, weight] of Object.entries(w))
      for (let i = 0; i < 3; i++) { a[i] += colours[k][0][i] * weight / total; b[i] += colours[k][1][i] * weight / total; }
    t.colorA.setRGB(a[0], a[1], a[2]);
    t.colorB.setRGB(b[0], b[1], b[2]);

    // the sky behind it, a layer per part, crossfading
    for (const [k, el] of Object.entries(layers)) {
      const o = (w[k] / total).toFixed(3);
      if (el && written.layers[k] !== o) { el.style.opacity = o; written.layers[k] = o; }
    }
    const now = Object.entries(w).sort((x, y) => y[1] - x[1])[0][0];
    if (written.scene !== now) { body.dataset.scene = now; written.scene = now; }
  }

  // light or dark: the points as light, or as ink
  const inkFor = () => { place(); scene.ink(theme() === "light"); };
  inkFor();
  addEventListener("moon:theme", inkFor);

  // the mouse, a pen, and a finger: on a phone or a touch screen the points part under the finger
  // while it moves, scrolling or not (touch events keep coming while the page scrolls; pointer
  // events stop the moment a drag becomes a scroll)
  if (!still) {
    const at = (x, y) => scene.pointer((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") at(e.clientX, e.clientY); }, { passive: true });
    const touch = (e) => { const t = e.touches[0]; if (t) at(t.clientX, t.clientY); };
    addEventListener("touchstart", touch, { passive: true });
    addEventListener("touchmove", touch, { passive: true });
  }
  // the canvas follows the window; ScrollTrigger refreshes itself on a real resize, and on a phone
  // it ignores the address bar sliding in and out — a refresh of every pin each time it did was a
  // stall in the middle of a finger's scroll
  addEventListener("resize", () => scene.size());

  // runs on GSAP's clock, the one Lenis and ScrollTrigger already share; rests when the tab is hidden
  gsap.ticker.add(() => {
    if (document.hidden) return;
    place();
    scene.frame(performance.now());
  });
}

reveal();

// every trigger made, in page order; and again once the fonts have set the real heights
ScrollTrigger.sort();
ScrollTrigger.refresh();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
