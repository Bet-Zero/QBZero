# CLAUDE.md

Project conventions live in `AGENTS.md`. This file covers how to work with the
repo owner.

## Communication

End every message with a recap split into three labelled sections, so it is
never ambiguous which parts are finished work and which need a reply:

1. **What I did** — completed, merged, live. No action needed.
2. **What needs you** — decisions to make, or steps only the owner can take
   (anything in the Firebase console, Vercel settings, or checking the live
   site). State plainly what a useful reply looks like.
3. **Optional / whenever** — known issues that are not breaking anything.

Say so explicitly when a section is empty rather than dropping it.

Keep the distinction between _diagnosed_ and _fixed_ sharp. If a change makes a
failure visible without resolving its cause, say that in those words.

## Access

A cloud session can reach Firestore's API and can run every maintenance script
— but only with a credential. `scripts/firebaseAdmin.js` takes one from
`serviceAccountKey.json` (the owner's machine) or from the
`FIREBASE_SERVICE_ACCOUNT` environment variable, raw or base64.

So say which of these is actually blocking, rather than "no access":

- **No credential in this session.** Fixable without the owner's machine — the
  key comes from the Firebase console and goes in the environment's secrets.
  Say so instead of deferring the whole task. `npm run check-firestore` is the
  read-only one to run first.
- **Needs the owner's machine.** Only things that are genuinely local: files
  `.gitignore` excludes by name (`updateStats.js` and friends), and anything
  needing a phone or a browser signed in as the owner.
- **Needs the owner as a person.** Firebase console settings, Vercel settings,
  looking at the live site.

That key bypasses `firestore.rules` entirely — full read and write on every
collection — so never ask for one casually, and say what it will be used for.

## Verification

Before claiming a fix works, confirm the test fails against the previous
behavior — not just that it passes against the new one.

```
npx vitest run        # full suite
npm run build         # vite build
npm run lint          # eslint, currently non-zero from a known backlog
```

Lint has a standing backlog (mostly jsx-a11y in older features). Compare the
count before and after rather than expecting zero.
