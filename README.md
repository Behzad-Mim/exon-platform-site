# The two public pages

Google will not let an OAuth consent screen be published to production without a **homepage URL** and
a **privacy policy URL**. These are those two pages. They are also the only reason the app can leave
"Testing" status — and leaving it is what stops Google expiring the refresh token every 7 days.

```
index.html     the homepage
privacy.html   the privacy policy
```

Both are self-contained: no CDN, no fonts to fetch, no build step. Open either one in a browser and
it works. English and Persian in the same file, with a toggle.

## Publishing them

Any static host will do. GitHub Pages is free and its domain is accepted by Google:

1. Make a public repository, e.g. `exon-platform-site`.
2. Put `index.html` and `privacy.html` at its root and push.
3. Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. A minute later the pages are at:
   - `https://<username>.github.io/exon-platform-site/`
   - `https://<username>.github.io/exon-platform-site/privacy.html`

Then in the Google Cloud console, under **Google Auth Platform → Branding**:

- **Application home page** → the first URL
- **Application privacy policy link** → the second
- **Authorized domains** → `github.io`

and **Audience → Publish app** stops being greyed out.

## Before publishing, check these are still true

The privacy policy makes specific promises. They are accurate as the app stands, and each one is a
claim that has to be re-checked if the app changes:

- no analytics, no advertising, no telemetry, no crash reports leaving the device
- no servers operated by us, and no user accounts
- the ledger is SQLCipher-encrypted with a key derived from the owner's password
- cloud backups are encrypted **before** upload, with a key derived from the book password
- the only Google scopes requested are `openid`, `userinfo.email` and `drive.file`
- the Google token is kept in DPAPI / Android Keystore, never in a backup or an export

The contact address in both pages is `behzad.shahidi0@gmail.com`. Change it in both files if a
different one should be public — it is the address Google shows on the consent screen and the one
people will write to.
