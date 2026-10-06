# moonplatform.app — Moon Platform's site

Live at **<https://moonplatform.app/>** — Moon Platform's own domain, served by a Cloudflare Worker
from this folder (since 6 Oct 2026): the home page with **Apps, Games and Windows Tools**, and
Exon Platform's own pages under `/exon`. Before that, Exon's site was GitHub Pages at
`https://behzad-mim.github.io/exon-platform-site/`, and that address still answers: see below.
The look and its rules are in [`DESIGN.md`](DESIGN.md).

```
public/                     the site, as Cloudflare serves it
  index.html                Moon Platform: Apps (Exon Platform), Games and Windows Tools (coming soon)
  exon.html                 Exon Platform's page, with the download links        -> /exon
  exon/privacy.html         Exon Platform's privacy policy                        -> /exon/privacy
  404.html                  any address that is not a page
  assets/moon.css, moon.js  the one stylesheet and the one script; the moon is drawn in moon.js
  assets/exon-icon.png      the app's own icon
  favicon.svg, robots.txt, sitemap.xml, google....html
worker.js                   the redirects: www and http, /exon/download..., /exon/latest, /privacy
wrangler.toml.example       the worker's config; copy to wrangler.toml (gitignored) to deploy
DESIGN.md                   the design system: tokens, components, motion, accepted debt

index.html, privacy.html    GitHub Pages only: forward the old address to /exon and /exon/privacy
sitemap.xml, google....html GitHub Pages only: what Search Console knows the old address by
```

The pages fetch nothing from anybody else: no CDN, no web font, no analytics, no build step. English and Persian live in the same file behind a toggle, each with its own
`lang` and `dir`.

## The addresses

| Address | What answers |
| --- | --- |
| `https://moonplatform.app/` | Moon Platform's home: Apps, Games, Windows Tools |
| `https://moonplatform.app/exon` | Exon Platform's page |
| `https://moonplatform.app/exon/privacy` | its privacy policy (`/privacy` redirects here) |
| `https://moonplatform.app/exon/download/android` | the newest APK, straight from the latest GitHub release |
| `https://moonplatform.app/exon/download/windows` | the newest Windows ZIP, the same way |
| `https://moonplatform.app/exon/download` | the newest release's page: notes, sizes, checksums |
| `https://moonplatform.app/exon/latest` | what the app asks for updates: GitHub's own redirect to `/releases/tag/vX.Y.Z`, handed on unchanged (kept 10 minutes) |
| `https://www.moonplatform.app/…`, `http://…` | 301 to the same path on `https://moonplatform.app` |

The installers stay among GitHub's releases in `Behzad-Mim/exon-platform-releases`; this only points
at them. If they ever move, `worker.js` changes and every printed QR code and every installed app
follows — which is the whole reason the app and the printouts name this domain and not GitHub.

From 1.3.10 the app asks `/exon/latest` first and GitHub directly only when this does not answer,
and the «ساخته‌شده با Exon Platform» line at the end of every export names `moonplatform.app/exon`.
A future app gets its own path the same way (`/name`, `/name/download/...`, `/name/latest`).

## The old address

Printed statements and release notes made before 1.3.10 point at
`behzad-mim.github.io/exon-platform-site/`. Paper cannot be reprinted, so GitHub Pages keeps serving
this repository's root, where `index.html` and `privacy.html` are now one-line forwarders (a
meta refresh, a script, and a canonical link) to `/exon` and `/exon/privacy`. Leave them, and leave Pages on.

## Deploying

From this folder, with the owner's Cloudflare account logged in (`npx wrangler login`):

```bash
cp wrangler.toml.example wrangler.toml   # once
npx wrangler deploy
```

The custom domains in the config are created by the deploy itself, certificates included. Then
push the repository as before, for the GitHub Pages side:

```bash
git add -A && git commit -m "..." && git push
```

## Google

Google will not publish an OAuth consent screen to production without a **homepage URL** and a
**privacy policy URL** on a domain the owner has verified. That matters more than it sounds: while
the consent screen sits in *Testing*, Google expires the refresh token every 7 days, and the app
would ask the owner to sign in to Google again every week for as long as it is used.

What goes in the Google Cloud console, under **Google Auth Platform → Branding**:

| Field | Value |
| --- | --- |
| Application home page | `https://moonplatform.app/exon` |
| Application privacy policy link | `https://moonplatform.app/exon/privacy` |
| Authorized domains | `moonplatform.app` |

The domain is verified in Search Console as a **Domain** property, by a TXT record in the zone's DNS
on Cloudflare — Search Console may offer to add it itself after a sign-in to Cloudflare; otherwise
it is pasted into Cloudflare ▸ moonplatform.app ▸ DNS ▸ Add record. (The Google file in `public/`
also lets a URL-prefix property verify, if that is ever wanted.)

## Before changing anything, check these are still true

The privacy policy makes specific promises. Each is accurate as the app stands, and each has to be
re-checked if the app changes:

- no analytics, no advertising, no telemetry, no crash reports leaving the device
- no user accounts; the only machines of ours that anything passes through are the relay
  (employees outside the shop — bytes it cannot read, one key hash per shop kept), the assistant
  endpoint (figures without names, nothing kept), and this site's `/latest` (no identifier,
  nothing kept)
- the ledger is SQLCipher-encrypted with a key derived from the owner's password
- cloud backups are encrypted **before** upload, with a key derived from the book password
- the only Google scopes requested are `openid`, `userinfo.email` and `drive.file`
- the Google token is kept in DPAPI / Android Keystore, never in a backup or an export

The contact address on the pages is `behzad.shahidi0@gmail.com` — the same one Google shows on the
consent screen, and the one people will actually write to. Change it in both files if a different
one should be public.

## Related

The installers live in a separate repository, and no source is published in either:
<https://github.com/Behzad-Mim/exon-platform-releases>

## Being found

`public/sitemap.xml` names the three pages, and `public/robots.txt` names the sitemap, which is how a
crawler finds it without anybody submitting it anywhere. In Search Console, submit `sitemap.xml` on
the moonplatform.app property too.

The sitemap is deliberately dull: `<loc>`s, `<lastmod>`s, and nothing else. It once began
with an explanatory comment and with `<changefreq>` and `<priority>`, and Search Console answered
«Sitemap could not be read» for a file that parsed cleanly everywhere else. Google ignores both of
those elements by its own documentation, and a comment buys a crawler nothing.

The title and the description carry Persian as well as English, because «exon platform» is not what
the people this is for would ever type. They type «برنامه صرافی».
