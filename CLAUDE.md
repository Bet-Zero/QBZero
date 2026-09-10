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

This session has no Firebase credentials and cannot reach Firestore, deploy
rules, or read the live site. Anything requiring them is a step for the owner.

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
