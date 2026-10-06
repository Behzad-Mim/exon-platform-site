// moonplatform.app — Moon Platform's own address, served by Cloudflare.
//
// Three things live here:
//
//   - the Exon Platform site: the homepage and the privacy policy, the files beside this one;
//   - short download links that stay where they are while the files behind them move —
//       /download/android   the newest APK
//       /download/windows   the newest Windows ZIP
//       /download           the newest release's page, with its notes, sizes and checksums
//   - /latest, which the app asks to learn whether a newer build has been published.
//
// The installers themselves stay among GitHub's releases; this only points at them. If they ever
// move, these few lines change, and every printed QR code and every installed app follows.

const APEX = "moonplatform.app";
const RELEASES = "https://github.com/Behzad-Mim/exon-platform-releases/releases";

const FILES = {
  "/download/android": "ExonPlatform-Android.apk",
  "/download/windows": "ExonPlatform-Windows-x64.zip",
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

    if (path === "/download")
      return away(`${RELEASES}/latest`);

    if (path === "/latest")
      return latest(ctx);

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
  const key = new Request(`https://${APEX}/latest`);

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
