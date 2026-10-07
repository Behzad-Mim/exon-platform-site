// moonplatform.app — Moon Platform's own address, served by Cloudflare.
//
// What lives here:
//
//   - Moon Platform's site — the home page with Apps, Games and Windows Tools, and each product's
//     own pages under its own path (Exon Platform: /exon, /exon/privacy) — the files in public/;
//   - for each released app, short download links that stay where they are while the files behind
//     them move —
//       /exon/download/android   the newest APK
//       /exon/download/windows   the newest Windows ZIP
//       /exon/download           the newest release's page, with its notes, sizes and checksums
//   - /exon/latest, which the app asks to learn whether a newer build has been published;
//   - /api/updates, the newest releases for the home page, read from GitHub's releases feed;
//   - /api/contact, the home page's form: one message, sent to the owner's inbox through Cloudflare
//     Email Routing (the send_email binding). Nothing about it is stored.
//
// The installers themselves stay among GitHub's releases; this only points at them. If they ever
// move, these few lines change, and every printed QR code and every installed app follows.

import { EmailMessage } from "cloudflare:email";

const APEX = "moonplatform.app";
const RELEASES = "https://github.com/Behzad-Mim/exon-platform-releases/releases";

const FILES = {
  "/exon/download/android": "ExonPlatform-Android.apk",
  "/exon/download/windows": "ExonPlatform-Windows-x64.zip",
};

// Addresses people may type for a page that lives elsewhere.
const MOVED = {
  "/privacy": "/exon/privacy",
};

// How long one answer from GitHub is used again. Releases come weeks apart; a new one shows here
// within ten minutes of being published, and GitHub is asked at most that often per data centre.
const LATEST_SECONDS = 600;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // www, and plain http, come home to the one address. Only on the real domain: a developer's
    // copy on localhost is left as it is.
    if (url.hostname.endsWith(APEX) && (url.hostname !== APEX || url.protocol === "http:")) {
      url.protocol = "https:";
      url.hostname = APEX;
      return Response.redirect(url.toString(), 301);
    }

    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (Object.hasOwn(FILES, path))
      return away(`${RELEASES}/latest/download/${FILES[path]}`);

    if (path === "/exon/download")
      return away(`${RELEASES}/latest`);

    if (path === "/exon/latest")
      return latest(ctx);

    if (path === "/api/contact")
      return request.method === "POST" ? contact(request, env) : new Response(null, { status: 405, headers: { Allow: "POST" } });

    if (path === "/api/updates")
      return updates(ctx);

    if (Object.hasOwn(MOVED, path))
      return Response.redirect(new URL(MOVED[path], url).toString(), 301);

    // Google's ownership file is fetched by its exact name, .html and all, and must answer 200
    // there — not the redirect to the bare name that every other page gets.
    if (/^\/google[0-9a-f]+\.html$/.test(path))
      return dressed(await env.ASSETS.fetch(new Request(new URL(path.slice(0, -5), url), request)));

    return dressed(await env.ASSETS.fetch(request));
  },
};

// A redirect that is never remembered: what "newest" means changes with every release.
function away(location) {
  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}

// Where GitHub's own /releases/latest points — a /releases/tag/vX.Y.Z address, the version in its
// last segment — handed on unchanged, so the app reads it exactly as it reads GitHub's.
async function latest(ctx) {
  const cache = caches.default;
  const key = new Request(`https://${APEX}/exon/latest`);

  const kept = await cache.match(key);
  if (kept)
    return kept;

  let location = null;
  try {
    const answer = await fetch(`${RELEASES}/latest`, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "moonplatform.app" },
    });
    location = answer.headers.get("Location");
  } catch (e) {
    // GitHub unreachable from here: said below, the same as an answer that is not a release.
  }

  // Only a release address is passed on. Anything else — a sign-in page, an error — would read as
  // no answer in the app anyway; a 502 says so plainly, and the app then asks GitHub itself.
  if (!location || !location.includes("/releases/tag/"))
    return new Response("GitHub did not say which release is the newest.\n", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });

  const response = new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": `public, max-age=${LATEST_SECONDS}` },
  });

  ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}

// The site's pages, with the headers a page of ours should carry.
function dressed(response) {
  const page = new Response(response.body, response);
  page.headers.set("X-Content-Type-Options", "nosniff");
  page.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  page.headers.set("X-Frame-Options", "DENY");
  return page;
}

// ------------------------------------------------------------------ the form

const FROM = "website@moonplatform.app";

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });
}

// One line of what a visitor typed, safe to put in a mail header: no line breaks, no angle brackets.
function line(value, max) {
  return typeof value === "string" ? value.replace(/[\r\n<>"\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// A header word in plain ASCII when it can be, RFC 2047 when it cannot (a Persian name, say).
const word = (text) => (/^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${base64(text)}?=`);

async function contact(request, env) {
  // only from our own pages (and a developer's copy on this machine)
  const origin = request.headers.get("Origin");
  if (origin) {
    const host = new URL(origin).hostname;
    if (host !== APEX && host !== "localhost" && host !== "127.0.0.1") return json({ ok: false }, 403);
  }

  let data;
  try {
    const text = await request.text();
    if (text.length > 20000) return json({ ok: false }, 413);
    data = JSON.parse(text);
  } catch (e) {
    return json({ ok: false }, 400);
  }

  // A robot fills the field a person never sees, or sends faster than a person can type. It is told
  // it worked, and nothing is sent.
  if (data.company || !(Number(data.waited) > 2500)) return json({ ok: true });

  const name = line(data.name, 100);
  const email = line(data.email, 200);
  const message = typeof data.message === "string" ? data.message.replace(/\r\n?/g, "\n").trim().slice(0, 4000) : "";
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 5) return json({ ok: false }, 400);

  const ip = request.headers.get("CF-Connecting-IP") || "local";
  if (env.CONTACT_LIMIT) {
    const { success } = await env.CONTACT_LIMIT.limit({ key: ip });
    if (!success) return json({ ok: false }, 429);
  }

  if (!env.MAIL || !env.MAIL_TO) return json({ ok: false }, 503);

  const lang = data.lang === "fa" ? "fa" : "en";
  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Language: ${lang}`,
    `Country: ${request.cf?.country || "?"}`,
    "",
    message,
    "",
    "— sent from the form on https://moonplatform.app/#contact",
  ].join("\n");

  const raw = [
    `From: ${word("Moon Platform website")} <${FROM}>`,
    `To: <${env.MAIL_TO}>`,
    `Reply-To: ${word(name)} <${email}>`,
    `Subject: ${word("moonplatform.app — " + name)}`,
    `Message-ID: <${crypto.randomUUID()}@${APEX}>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64(body).replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");

  try {
    await env.MAIL.send(new EmailMessage(FROM, env.MAIL_TO, raw));
  } catch (e) {
    return json({ ok: false }, 502);
  }

  return json({ ok: true });
}

// ------------------------------------------------------------------ updates

// GitHub's releases feed rather than its API: the API allows an unauthenticated caller sixty requests
// an hour per address, and Cloudflare's addresses are shared with everybody else's workers.
const UPDATES_SECONDS = 1800;

const entity = (text) => text
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&");

function parseFeed(xml) {
  return xml.split("<entry>").slice(1).map((entry) => {
    const pick = (re) => (entry.match(re) || [])[1] || "";
    const link = pick(/<link[^>]*href="([^"]+)"/);
    const html = entity(pick(/<content type="html">([\s\S]*?)<\/content>/));
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
      .map((m) => entity(m[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const persian = (t) => /[\u0600-\u06FF]/.test(t);
    return {
      version: (link.match(/\/tag\/v?([^/?#]+)/) || [])[1] || entity(pick(/<title>([^<]*)<\/title>/)),
      date: pick(/<updated>([^<]+)<\/updated>/),
      url: link,
      en: paragraphs.find((t) => !persian(t)) || "",
      fa: paragraphs.find(persian) || "",
    };
  }).filter((r) => r.url);
}

async function updates(ctx) {
  const cache = caches.default;
  const key = new Request(`https://${APEX}/api/updates`);
  const kept = await cache.match(key);
  if (kept) return kept;

  let releases = [];
  try {
    const res = await fetch(`${RELEASES}.atom`, { headers: { "User-Agent": "moonplatform.app", Accept: "application/atom+xml" } });
    if (res.ok) releases = parseFeed(await res.text()).slice(0, 6);
  } catch (e) {
    // the page keeps its link to the releases instead
  }

  const response = json({ releases }, releases.length ? 200 : 502,
    { "Cache-Control": releases.length ? `public, max-age=${UPDATES_SECONDS}` : "no-store" });
  if (releases.length) ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}
