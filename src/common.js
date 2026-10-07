// What every page of the site shares: the language, the capsule menu, search, smooth scrolling,
// reveals and the contact form. Nothing here talks to anybody but this site.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export const root = document.documentElement;
export const body = document.body;
export const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
root.classList.add("js");

// ------------------------------------------------------------------ language

const titles = {
  en: document.querySelector('meta[name="title-en"]')?.content,
  fa: document.querySelector('meta[name="title-fa"]')?.content,
};

export function lang() { return body.dataset.lang === "fa" ? "fa" : "en"; }

export function setLang(code) {
  body.dataset.lang = code;
  root.lang = code;
  root.dir = code === "fa" ? "rtl" : "ltr";
  if (titles[code]) document.title = titles[code];
  for (const el of document.querySelectorAll("[data-set-lang]"))
    el.setAttribute("aria-pressed", String(el.dataset.setLang === code));
  for (const el of document.querySelectorAll("[data-toggle-lang]"))
    el.textContent = code === "fa" ? "EN" : "فا";
  for (const el of document.querySelectorAll("[data-ph-en]"))
    el.placeholder = code === "fa" ? el.dataset.phFa : el.dataset.phEn;
  try { localStorage.setItem("moon.lang", code); } catch (e) { /* a private window */ }
  window.dispatchEvent(new Event("moon:lang"));
  ScrollTrigger.refresh();
}

for (const el of document.querySelectorAll("[data-set-lang]"))
  el.addEventListener("click", () => setLang(el.dataset.setLang));
for (const el of document.querySelectorAll("[data-toggle-lang]"))
  el.addEventListener("click", () => setLang(lang() === "fa" ? "en" : "fa"));

{
  let saved = null;
  try { saved = localStorage.getItem("moon.lang"); } catch (e) { /* a private window */ }
  const asked = new URLSearchParams(location.search).get("lang");
  setLang(asked === "fa" || asked === "en" ? asked
    : saved || (/^(fa|ps|prs)\b/i.test(navigator.language || "") ? "fa" : "en"));
}

// ------------------------------------------------------------------ light and dark

// Dark is the site's own, the moon's; light is a choice, remembered in this browser. Each page's
// <head> applies a saved choice before the first paint, so a light page never flashes dark first.
export function theme() { return root.dataset.theme === "light" ? "light" : "dark"; }

function showTheme() {
  const light = theme() === "light";
  for (const el of document.querySelectorAll("[data-toggle-theme]")) el.setAttribute("aria-pressed", String(light));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#eef1fa" : "#03040a");
}

export function setTheme(next) {
  try { localStorage.setItem("moon.theme", next); } catch (e) { /* a private window */ }
  const apply = () => {
    if (next === "light") root.dataset.theme = "light";
    else delete root.dataset.theme;
    showTheme();
    window.dispatchEvent(new Event("moon:theme"));
  };
  // a cross-fade where the browser has one; at once where it does not
  if (document.startViewTransition && !still) document.startViewTransition(apply);
  else apply();
}

for (const el of document.querySelectorAll("[data-toggle-theme]"))
  el.addEventListener("click", () => setTheme(theme() === "light" ? "dark" : "light"));
showTheme();

// ------------------------------------------------------------------ smooth scrolling

export let lenis = null;
if (!still) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToTarget(target) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -84, duration: 1.4 });
  else el.scrollIntoView({ block: "start" });
}

// same-page anchors glide; others load as usual
for (const a of document.querySelectorAll('a[href^="#"], a[href^="/#"]')) {
  a.addEventListener("click", (e) => {
    const hash = a.getAttribute("href").replace(/^\//, "");
    if (a.getAttribute("href").startsWith("/#") && location.pathname !== "/") return;
    const el = hash.length > 1 && document.querySelector(hash);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(el);
    history.replaceState(null, "", hash);
  });
}

// ------------------------------------------------------------------ the capsule and its phone menu

const menu = document.querySelector("[data-menu]");
const menuButton = document.querySelector("[data-menu-button]");
function closeMenu() {
  if (!menu) return;
  menu.hidden = true;
  menuButton?.setAttribute("aria-expanded", "false");
}
menuButton?.addEventListener("click", () => {
  const open = menu.hidden;
  menu.hidden = !open;
  menuButton.setAttribute("aria-expanded", String(open));
});
for (const a of document.querySelectorAll("[data-menu] a")) a.addEventListener("click", closeMenu);

const capsule = document.querySelector(".capsule");
if (capsule) {
  ScrollTrigger.create({
    start: 24, end: "max",
    onToggle: (self) => capsule.classList.toggle("is-floating", self.isActive),
  });
}

// the section you are in, underlined in the capsule
const tabs = [...document.querySelectorAll(".capsule__tabs a[href*='#']")];
for (const tab of tabs) {
  const id = tab.getAttribute("href").split("#")[1];
  const section = id && document.getElementById(id);
  if (!section) continue;
  ScrollTrigger.create({
    trigger: section, start: "top 55%", end: "bottom 55%",
    onToggle: (self) => { if (self.isActive) { tabs.forEach((t) => t.removeAttribute("aria-current")); tab.setAttribute("aria-current", "true"); } },
  });
}

// ------------------------------------------------------------------ search

const INDEX = [
  { href: "/exon", en: "Exon Platform", fa: "اکسون پلتفرم", den: "The offline ledger for hawala and currency exchange", dfa: "دفتر آفلاین صرافی و حواله", k: "exon ledger hawala exchange صرافی حواله دفتر اکسون" },
  { href: "/exon/download/windows", en: "Download Exon for Windows", fa: "دانلود اکسون برای ویندوز", den: "The newest ZIP, 64-bit", dfa: "آخرین فایل ZIP، ۶۴ بیتی", k: "download windows zip دانلود ویندوز" },
  { href: "/exon/download/android", en: "Download Exon for Android", fa: "دانلود اکسون برای اندروید", den: "The newest APK, Android 5.0 and up", dfa: "آخرین فایل APK، اندروید ۵ به بالا", k: "download android apk دانلود اندروید" },
  { href: "/exon/download", en: "Exon release notes", fa: "یادداشت‌های نسخهٔ اکسون", den: "What is new, sizes and checksums", dfa: "تازه‌ها، حجم و هش فایل‌ها", k: "release notes version changelog نسخه تازه" },
  { href: "/exon/privacy", en: "Exon privacy policy", fa: "حریم خصوصی اکسون", den: "What leaves your device, and what does not", dfa: "چه چیزی دستگاه شما را ترک می‌کند", k: "privacy policy google drive حریم خصوصی" },
  { href: "/#apps", en: "Apps", fa: "اپ‌ها", den: "What Moon Platform has released", dfa: "آنچه Moon Platform منتشر کرده", k: "apps اپ برنامه" },
  { href: "/#games", en: "Games", fa: "بازی‌ها", den: "In development — coming soon", dfa: "در حال ساخت — به‌زودی", k: "games بازی" },
  { href: "/#tools", en: "Windows Tools", fa: "ابزارهای ویندوز", den: "In development — coming soon", dfa: "در حال ساخت — به‌زودی", k: "windows tools utilities ابزار ویندوز" },
  { href: "/#updates", en: "Updates", fa: "به‌روزرسانی‌ها", den: "The newest releases", dfa: "تازه‌ترین نسخه‌ها", k: "updates news به‌روزرسانی" },
  { href: "/#contact", en: "Contact", fa: "تماس", den: "contact@moonplatform.app · WhatsApp", dfa: "contact@moonplatform.app · واتساپ", k: "contact email whatsapp support تماس ایمیل پشتیبانی" },
];

const search = document.querySelector("[data-search]");
if (search) {
  const input = search.querySelector("input");
  const list = search.querySelector("[data-results]");
  // the list scrolls under the wheel and the touchpad itself: Lenis, stopped while search is open,
  // would otherwise swallow every wheel event on the page, this list's too
  list.setAttribute("data-lenis-prevent", "");
  let active = 0, shown = [];

  const open = () => {
    search.hidden = false;
    lenis?.stop();
    input.value = "";
    render();
    requestAnimationFrame(() => input.focus());
  };
  const close = () => { search.hidden = true; lenis?.start(); };

  function render() {
    const q = input.value.trim().toLowerCase();
    const l = lang();
    shown = INDEX.filter((i) => !q || [i.en, i.fa, i.den, i.dfa, i.k].join(" ").toLowerCase().includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.innerHTML = "";
    if (!shown.length) {
      const li = document.createElement("li");
      li.className = "search__empty";
      li.textContent = l === "fa" ? "چیزی پیدا نشد." : "Nothing found.";
      list.append(li);
      return;
    }
    shown.forEach((item, n) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.href;
      a.className = "search__item" + (n === active ? " is-active" : "");
      const b = document.createElement("b");
      b.textContent = l === "fa" ? item.fa : item.en;
      const s = document.createElement("span");
      s.textContent = l === "fa" ? item.dfa : item.den;
      a.append(b, s);
      a.addEventListener("click", (e) => {
        const hash = item.href.startsWith("/#") && location.pathname === "/" ? item.href.slice(1) : null;
        close();
        if (hash) { e.preventDefault(); scrollToTarget(hash); }
      });
      li.append(a);
      list.append(li);
    });
  }

  // the arrow keys walk the list: the one they reach scrolls into sight
  const keepInView = () => list.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { active = Math.min(shown.length - 1, active + 1); render(); keepInView(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { active = Math.max(0, active - 1); render(); keepInView(); e.preventDefault(); }
    else if (e.key === "Enter") { list.querySelectorAll("a")[active]?.click(); e.preventDefault(); }
  });
  search.addEventListener("click", (e) => { if (e.target === search) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !search.hidden) close();
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) { e.preventDefault(); open(); }
  });
  for (const b of document.querySelectorAll("[data-open-search]")) b.addEventListener("click", () => { closeMenu(); open(); });
  window.addEventListener("moon:lang", () => { if (!search.hidden) render(); });
}

// ------------------------------------------------------------------ reveals

export function reveal() {
  for (const el of document.querySelectorAll("[data-reveal]")) {
    if (still) { el.style.opacity = 1; continue; }
    gsap.fromTo(el, { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.1, ease: "expo.out", delay: Number(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }
}

// ------------------------------------------------------------------ the pictures: one step at a time with the arrows

const strip = document.querySelector("[data-strip-list]");
for (const b of document.querySelectorAll("[data-strip]")) {
  b.addEventListener("click", () => {
    const dir = Number(b.dataset.strip) * (lang() === "fa" ? -1 : 1);
    strip?.scrollBy({ left: dir * strip.clientWidth * 0.8, behavior: still ? "auto" : "smooth" });
  });
}

// ------------------------------------------------------------------ contact form

const form = document.querySelector("[data-contact]");
if (form) {
  const loaded = Date.now();
  const status = form.querySelector("[data-status]");
  const say = (key) => {
    const words = {
      sending: { en: "Sending…", fa: "در حال فرستادن…" },
      sent: { en: "Sent. We will write back to the address you gave.", fa: "فرستاده شد. به نشانی‌ای که دادید جواب می‌دهیم." },
      name: { en: "Please write your name.", fa: "لطفاً نام خود را بنویسید." },
      email: { en: "That email address does not look right.", fa: "این نشانی ایمیل درست به نظر نمی‌رسد." },
      message: { en: "Please write a message.", fa: "لطفاً پیامی بنویسید." },
      invalid: { en: "Please check the name, the email and the message.", fa: "لطفاً نام، ایمیل و پیام را بررسی کنید." },
      busy: { en: "Too many messages from here just now — try again in a minute.", fa: "از اینجا پیام زیادی آمده؛ یک دقیقه بعد دوباره بفرستید." },
      failed: { en: "It did not go through. Please write to contact@moonplatform.app.", fa: "فرستاده نشد. لطفاً به contact@moonplatform.app ایمیل بزنید." },
    };
    status.textContent = words[key][lang()];
    status.dataset.state = key;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    // a message of any length: «تست» is three letters, and it is a message
    const wrong = !data.name?.trim() ? "name"
      : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((data.email || "").trim()) ? "email"
      : !(data.message || "").trim() ? "message" : null;
    for (const field of form.querySelectorAll("input, textarea")) field.removeAttribute("aria-invalid");
    if (wrong) {
      say(wrong);
      const field = form.elements[wrong];
      field?.setAttribute("aria-invalid", "true");
      field?.focus();
      return;
    }
    data.email = data.email.trim();
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    say("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, lang: lang(), waited: Date.now() - loaded }),
      });
      if (res.ok) { say("sent"); form.reset(); }
      else say(res.status === 429 ? "busy" : res.status === 400 ? "invalid" : "failed");
    } catch (err) {
      say("failed");
    } finally {
      button.disabled = false;
    }
  });
}

export { gsap, ScrollTrigger };
