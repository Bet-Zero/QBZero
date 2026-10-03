# QBZero

QBZero is an NFL quarterback ranking and scouting site. Anyone can browse it;
the owner, signed in as an admin, edits grades, rankings, lists and tier lists
in place, and those edits are written back to Firebase Firestore.

## Tech Stack

- **React** with **Vite**
- **Tailwind CSS** for styling
- **Firebase** — Firestore for data, Firebase Auth for admin sign-in
- **Vitest** for tests
- Deployed on **Vercel** (`main` deploys to the live site)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure Firebase by creating a `.env` file in the project root:

   ```
   VITE_FIREBASE_API_KEY=<your key>
   VITE_FIREBASE_AUTH_DOMAIN=<your domain>
   VITE_FIREBASE_PROJECT_ID=<project id>
   VITE_FIREBASE_STORAGE_BUCKET=<bucket>
   VITE_FIREBASE_MESSAGING_SENDER_ID=<sender id>
   VITE_FIREBASE_APP_ID=<app id>
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

The app runs at `http://localhost:5173` by default.

## Checks

```bash
npx vitest run   # tests
npm run lint     # eslint
npm run build    # production build
```

## Maintenance Scripts

The scripts under `scripts/` (and `populateQBs.js`) use the Firebase Admin SDK
through `scripts/firebaseAdmin.js`, which reads a service account from
`serviceAccountKey.json` in the project root or from the
`FIREBASE_SERVICE_ACCOUNT` environment variable. That key bypasses
`firestore.rules`, so keep it out of the repo.

- `npm run check-firestore` — read-only health check
- `npm run check-roster` — validates the curated QB list, no credentials needed
- `npm run populate-qbs:dry` / `npm run populate-qbs` — sync players from the
  curated list
- `npm run refresh-headshots:dry` / `npm run refresh-headshots`,
  `npm run save-headshot` — headshot upkeep

## Key Features

- **QB Ranker** — head-to-head comparisons that build a ranking
- **Rankings** — the owner's personal rankings, saved sets and their history
- **QB Profiles** — trait grades, roles, stats and blurbs for each quarterback
- **Player Table** — filter and sort quarterbacks
- **Lists and Tier Maker** — ranked lists and drag-and-drop tier boards
- **Backup QBs** — backup quarterback bracket and hall of fame
- **QBW** — a takes board open to visitors

## Folder Structure

```
public/        Static assets (logos, headshots, fonts)
scripts/       Firebase Admin maintenance scripts
src/
  components/  Layout and shared UI
  features/    Domain features (ranker, rankings, profile, table, lists, tierMaker, ...)
  hooks/       Custom React hooks
  pages/       Route-level pages
  utils/       Filtering, formatting and ranking helpers
  constants/   Shared constants (traits, stats, teams)
  firebase/    Firestore helper modules
tests/         Vitest suites
```

## Further Docs

- [AGENTS.md](AGENTS.md) — conventions, Firestore collections and access rules
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) — architecture notes
- [docs/FIRESTORE_SCHEMA.md](docs/FIRESTORE_SCHEMA.md) — field breakdowns
- [docs/FILE_MAP.md](docs/FILE_MAP.md) — project layout
- Feature hierarchies in `docs/` (Filters, Lists, Profile, Ranker, Rankings,
  Roster, Table, Tier Maker, QBW, Backup Bracket)
