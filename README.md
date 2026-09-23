# The Exon Platform site

Live at **<https://behzad-mim.github.io/exon-platform-site/>**, served by GitHub Pages from `main`.

```
index.html     the homepage, with the download links
privacy.html   the privacy policy
sitemap.xml    the two pages above, named for a crawler
```

Both are self-contained: no CDN, no web font to fetch, no build step. Open either one in a browser
and it works. English and Persian live in the same file behind a toggle, each with its own `lang`
and `dir`.

## Why these two pages exist

Google will not publish an OAuth consent screen to production without a **homepage URL** and a
**privacy policy URL**. That matters more than it sounds: while the consent screen sits in *Testing*,
Google expires the refresh token every 7 days, and the app would ask the owner to sign in to Google
again every week for as long as it is used.

What goes in the Google Cloud console, under **Google Auth Platform → Branding**:

| Field | Value |
| --- | --- |
| Application home page | `https://behzad-mim.github.io/exon-platform-site/` |
| Application privacy policy link | `https://behzad-mim.github.io/exon-platform-site/privacy.html` |
| Authorized domains | `github.io` |

Then **Audience → Publish app** stops being greyed out.

## Updating it

Edit the file and push. Pages rebuilds on its own, usually within a minute.

```bash
git add -A && git commit -m "..." && git push
```

## Before changing anything, check these are still true

The privacy policy makes specific promises. Each is accurate as the app stands, and each has to be
re-checked if the app changes:

- no analytics, no advertising, no telemetry, no crash reports leaving the device
- no servers operated by us, and no user accounts
- the ledger is SQLCipher-encrypted with a key derived from the owner's password
- cloud backups are encrypted **before** upload, with a key derived from the book password
- the only Google scopes requested are `openid`, `userinfo.email` and `drive.file`
- the Google token is kept in DPAPI / Android Keystore, never in a backup or an export

The contact address on both pages is `behzad.shahidi0@gmail.com` — the same one Google shows on the
consent screen, and the one people will actually write to. Change it in both files if a different
one should be public.

## Related

The installers live in a separate repository, and no source is published in either:
<https://github.com/Behzad-Mim/exon-platform-releases>

## Being found

The homepage went unindexed for its first weeks while the privacy policy did, and the reason was
plain once looked at: every release note links the privacy policy, so that was the only page
anything ever pointed a crawler at. A page nothing links to is a page nothing finds.

So: `sitemap.xml` names both. It is submitted through Search Console — a **URL prefix** property,
verified with the HTML file Google hands out, which needs no domain of one's own — and it is also
named in `robots.txt` at the host root, which is how a crawler finds a sitemap without anybody
submitting it anywhere. That file cannot live here: a crawler reads robots.txt from the HOST root,
`behzad-mim.github.io/robots.txt`, so it lives in the `Behzad-Mim.github.io` repository, which is
also now a small landing page rather than a 404 — one more door to this site, which had none.

The sitemap itself is deliberately dull: two `<loc>`s, two `<lastmod>`s, and nothing else. It began
with an explanatory comment and with `<changefreq>` and `<priority>`, and Search Console answered
«Sitemap could not be read» for a file that parsed cleanly everywhere else. Google ignores both of
those elements by its own documentation, and a comment buys a crawler nothing — so the explanation
lives here, in the file people read, and the machine file has nothing in it to misread.

The title and the description carry Persian as well as English, because «exon platform» is not what
the people this is for would ever type. They type «برنامه صرافی».
