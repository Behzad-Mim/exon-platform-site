// Moon Platform — the site's behaviour: language, header, reveals, card tilt, the sliding band,
// and the moon. Nothing here fetches anything; nothing is stored but the chosen language.

(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  root.classList.add("js");

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------------------------------------------------------------- language

  const titles = {
    en: document.querySelector('meta[name="title-en"]')?.content,
    fa: document.querySelector('meta[name="title-fa"]')?.content,
  };

  function setLang(code) {
    body.dataset.lang = code;
    root.lang = code;
    root.dir = code === "fa" ? "rtl" : "ltr";
    if (titles[code]) document.title = titles[code];
    for (const button of document.querySelectorAll("[data-set-lang]"))
      button.setAttribute("aria-pressed", String(button.dataset.setLang === code));
    try { localStorage.setItem("moon.lang", code); } catch (e) { /* a private window */ }
    window.dispatchEvent(new Event("moon:lang"));
  }

  for (const button of document.querySelectorAll("[data-set-lang]"))
    button.addEventListener("click", () => setLang(button.dataset.setLang));

  let saved = null;
  try { saved = localStorage.getItem("moon.lang"); } catch (e) { /* a private window */ }
  const asked = new URLSearchParams(location.search).get("lang");
  setLang(asked === "fa" || asked === "en" ? asked
    : saved || (/^(fa|ps|prs)\b/i.test(navigator.language || "") ? "fa" : "en"));

  // ---------------------------------------------------------------- header: glass once scrolled

  const bar = document.querySelector(".bar");
  const top = document.createElement("div");
  top.style.cssText = "position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none";
  body.prepend(top);
  if (bar)
    new IntersectionObserver(([entry]) => bar.classList.toggle("is-solid", !entry.isIntersecting)).observe(top);

  // ---------------------------------------------------------------- the section you are in

  const links = [...document.querySelectorAll(".nav a[href^='#'], .nav a[href^='/#']")];
  const byId = new Map(links.map((a) => [a.getAttribute("href").replace(/^\/?#/, ""), a]));
  if (byId.size) {
    const seen = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const link = byId.get(entry.target.id);
        if (link && entry.isIntersecting) {
          for (const other of links) other.removeAttribute("aria-current");
          link.setAttribute("aria-current", "true");
        }
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    for (const id of byId.keys()) {
      const section = document.getElementById(id);
      if (section) seen.observe(section);
    }
  }

  // ---------------------------------------------------------------- reveals, once each

  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        reveal.unobserve(entry.target);
      }
  }, { rootMargin: "0px 0px -8% 0px" });
  for (const el of document.querySelectorAll("[data-reveal]")) reveal.observe(el);

  // ---------------------------------------------------------------- cards lean toward the pointer

  if (finePointer && !still)
    for (const card of document.querySelectorAll(".tilt")) {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add("is-tracking");
        card.style.setProperty("--ry", (x * 4).toFixed(2) + "deg");
        card.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tracking");
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
      });
    }

  // ---------------------------------------------------------------- the band slides with the scroll

  const bands = [...document.querySelectorAll("[data-slide]")];
  if (bands.length && !still) {
    let live = false, queued = false;
    const place = () => {
      queued = false;
      for (const band of bands) {
        const r = band.parentElement.getBoundingClientRect();
        const through = (innerHeight - r.top) / (innerHeight + r.height);   // 0 entering, 1 leaving
        const way = Number(band.dataset.slide) * (body.dataset.lang === "fa" ? -1 : 1);
        band.style.transform = `translate3d(${(way * (through - 0.5) * 38).toFixed(2)}%,0,0)`;
      }
    };
    const ask = () => { if (live && !queued) { queued = true; requestAnimationFrame(place); } };
    new IntersectionObserver(([entry]) => { live = entry.isIntersecting; ask(); })
      .observe(bands[0].parentElement);
    addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", ask);
    addEventListener("moon:lang", ask);
  }

  // ---------------------------------------------------------------- the moon

  const canvas = document.querySelector("canvas.hero__moon");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const small = innerWidth < 720;
  const COUNT = small ? 1800 : 3200;
  const DUST = small ? 260 : 480;

  // Points on the sphere by the golden-angle spiral: even, with no seams or poles.
  const points = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    // A little jitter, so the spiral's lattice does not show; a little terrain, so the light is uneven.
    let px = Math.cos(t) * r + (Math.random() - 0.5) * 0.05;
    let py = y + (Math.random() - 0.5) * 0.05;
    let pz = Math.sin(t) * r + (Math.random() - 0.5) * 0.05;
    const n = Math.hypot(px, py, pz); px /= n; py /= n; pz /= n;
    const crater = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(px * 9.1 + pz * 4.7) * Math.cos(py * 7.3 - px * 3.1));
    points.push({ x: px, y: py, z: pz, s: crater, k: Math.random() * 6.28, d: 1 });
  }
  // The dust around it — what makes it glow rather than sit there.
  for (let i = 0; i < DUST; i++) {
    const u = Math.random() * 2 - 1, t = Math.random() * 6.28, r = Math.sqrt(1 - u * u);
    const far = 1.08 + Math.pow(Math.random(), 2.2) * 0.75;
    points.push({ x: Math.cos(t) * r * far, y: u * far, z: Math.sin(t) * r * far, s: 0.5, k: Math.random() * 6.28, d: far });
  }

  // A soft round sprite for the brightest points, drawn once.
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 32;
  const sg = sprite.getContext("2d");
  const grad = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(244,246,255,1)");
  grad.addColorStop(0.25, "rgba(200,213,255,.55)");
  grad.addColorStop(1, "rgba(93,115,196,0)");
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 32, 32);

  let w = 0, h = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    w = box.width; h = box.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = w > 900;
    const view = Math.min(h, innerHeight);
    R = wide ? Math.min(w * 0.22, view * 0.36) : Math.min(w * 0.34, view * 0.17);
    cx = wide ? (body.dataset.lang === "fa" ? w * 0.28 : w * 0.72) : w * 0.5;
    cy = wide ? view * 0.48 : view * 0.25;
  }

  let pointer = null;        // where the pointer is, in canvas space
  let spin = 0, last = 0, scrollPhase = 0;
  const hero = canvas.parentElement;

  function frame(now) {
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    spin += dt * 0.12;

    // The phase: lit from the front-right when you arrive, waning to a crescent as the hero leaves.
    const theta = 0.2 * Math.PI + scrollPhase * 0.62 * Math.PI + Math.sin(now / 5200) * 0.05;
    const side = body.dataset.lang === "fa" ? -1 : 1;
    let lx = Math.sin(theta) * side, ly = -0.32, lz = Math.cos(theta);
    const ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;

    const lift = scrollPhase * R * 0.9;
    const ox = cx, oy = cy - lift;

    ctx.clearRect(0, 0, w, h);

    // The halo behind it.
    const halo = ctx.createRadialGradient(ox, oy, R * 0.6, ox, oy, R * 2.6);
    halo.addColorStop(0, `rgba(93,115,196,${0.30 - scrollPhase * 0.12})`);
    halo.addColorStop(0.45, "rgba(42,53,102,.10)");
    halo.addColorStop(1, "rgba(4,5,11,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // The body: a lit disc under the points, brightest where the light falls, so the moon reads as
    // a solid thing and not a cloud.
    const bx = ox + lx * R * 0.42, by = oy + ly * R * 0.42;
    const disc = ctx.createRadialGradient(bx, by, R * 0.05, ox, oy, R * 1.02);
    disc.addColorStop(0, `rgba(200,213,255,${0.30 * Math.max(0.2, lz + 0.35)})`);
    disc.addColorStop(0.55, "rgba(93,115,196,.12)");
    disc.addColorStop(0.97, "rgba(42,53,102,.10)");
    disc.addColorStop(1, "rgba(42,53,102,0)");
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(ox, oy, R * 1.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    const cos = Math.cos(spin), sin = Math.sin(spin);
    const tilt = 0.38, ct = Math.cos(tilt), st = Math.sin(tilt);
    const f = 3.2;
    const reach = Math.max(90, R * 0.55);

    for (const p of points) {
      // turn about the axis, then lean the axis toward the viewer
      const x1 = p.x * cos + p.z * sin;
      const z1 = -p.x * sin + p.z * cos;
      const y2 = p.y * ct - z1 * st;
      const z2 = p.y * st + z1 * ct;

      const scale = (R * f) / (f - z2);
      let sx = ox + x1 * scale, sy = oy + y2 * scale;

      let lit;
      if (p.d === 1) {
        const lambert = Math.max(0, x1 * lx + y2 * ly + z2 * lz);
        const rim = Math.pow(1 - Math.abs(z2), 3) * Math.max(0, x1 * lx + y2 * ly) * 0.9;
        lit = (Math.pow(lambert, 1.05) * 1.15 * p.s + rim) * (z2 < 0 ? 0.16 : 1) + 0.03;
      } else {
        lit = 0.10 + 0.22 * Math.max(0, x1 * lx + y2 * ly + z2 * lz) / p.d;
      }
      lit *= 0.82 + 0.18 * Math.sin(now / 900 + p.k);

      // The points part around the pointer and settle back behind it.
      if (pointer) {
        const dx = sx - pointer.x, dy = sy - pointer.y, dist = Math.hypot(dx, dy);
        if (dist < reach && dist > 0.01) {
          const push = Math.pow(1 - dist / reach, 2) * 26;
          sx += (dx / dist) * push; sy += (dy / dist) * push;
          lit *= 1 + (1 - dist / reach) * 0.8;
        }
      }

      if (lit < 0.03) continue;
      const a = Math.min(1, lit);
      if (a > 0.6 && p.d === 1) {
        ctx.globalAlpha = (a - 0.5) * 0.8;
        ctx.drawImage(sprite, sx - 6, sy - 6, 12, 12);
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = p.d === 1 ? "#f4f6ff" : "#a9b8ea";
      const dot = p.d === 1 ? (z2 > 0 ? 1.4 + a * 0.8 : 1.1) : 1.2;
      ctx.fillRect(sx - dot / 2, sy - dot / 2, dot, dot);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // Runs only while the hero is on screen and the tab is visible; one still frame when motion is off.
  let running = false, onScreen = true, id = 0;
  const loop = (now) => { frame(now); id = running ? requestAnimationFrame(loop) : 0; };
  function decide() {
    const should = onScreen && !document.hidden && !still;
    if (should && !running) { running = true; id = requestAnimationFrame(loop); }
    else if (!should && running) { running = false; cancelAnimationFrame(id); id = 0; last = 0; }
    if (still) frame(performance.now());
  }

  size();
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; decide(); }).observe(hero);
  document.addEventListener("visibilitychange", decide);
  addEventListener("resize", () => { size(); if (still) frame(performance.now()); });
  addEventListener("moon:lang", () => { size(); if (still) frame(performance.now()); });
  addEventListener("scroll", () => {
    scrollPhase = Math.min(1, Math.max(0, scrollY / Math.max(1, hero.offsetHeight)));
  }, { passive: true });

  if (finePointer && !still) {
    hero.addEventListener("pointermove", (e) => {
      const box = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
    });
    hero.addEventListener("pointerleave", () => { pointer = null; });
  }

  decide();
})();
