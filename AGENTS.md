# AGENTS.md – QBZero AI Instructions

See `CLAUDE.md` for how the repo owner wants updates reported.

## Project Overview

QBZero is a public-facing NFL quarterback scouting platform. It displays QB
bios, stats, roles, contracts, and grades using a clean layout. Quarterback
data is loaded from Firebase Firestore using a flattened player structure.

The site is publicly readable and **the owner can edit it in place** — player
grades, rankings, lists and tier lists are all written back to Firestore.
Writes are gated on Firebase Auth (see below), not on anything client-side.

### History worth knowing

This project was created by duplicating a basketball scouting app and
repurposing it for quarterbacks. The conversion was not finished in one pass,
and the recurring failure mode is a list written out in two places where one
half was converted and the other was not — which reliably surfaces as a filter
that silently matches nothing. Shared constants exist to stop that recurring:

- `src/constants/traits.js` — `QB_TRAITS`, the trait set
- `src/constants/stats.js` — `QB_STATS`, the box-score stats
- `src/constants/teamList.js` — teams, carrying both `id` and `abbr`
- `src/utils/formatting/teamLogos.js` — `TEAM_LOGO_MAP`

Import from these rather than re-typing a list. If you find basketball
vocabulary still in place (rebounds, shooting, defensive roles, positions like
Guard/Wing/Big), it is residue, not a feature.

## Coding Conventions

- Framework: React + Vite + Firebase
- Backend: Firestore (flattened quarterback documents in the `players` collection)
- Style: Tailwind CSS with utility classes
- Imports: Use alias paths (e.g., `@/components/...`)
- File Format: Named exports preferred; default exports only for top-level views

## File Structure

Feature-first, with scoped utility and component folders:

```
src/
  components/   layout/ shared/ (ui/ drawers/ filters/ grades/ rankings/)
  features/     table/ profile/ roster/ lists/ filters/ tierMaker/ ranker/
                rankings/ backupBracket/ qbw/
  hooks/
  utils/        filtering/ formatting/ roles/ roster/ ranker/
  constants/
  firebase/
  pages/
  styles/
```

New code is grouped by feature. Reusable UI or logic goes in `shared/`,
`hooks/`, or `utils/`.

## Firestore

| Collection                | Contents                                      | Writable by      |
| ------------------------- | --------------------------------------------- | ---------------- |
| `players`                 | QB bios, traits, roles, stats, badges, blurbs | admin            |
| `qbRankings`              | Saved ranking sets                            | admin            |
| `personalRankingArchives` | Archived personal rankings                    | admin            |
| `lists`                   | User-built lists                              | admin            |
| `tierLists`               | Tier maker boards                             | admin            |
| `rosterProjects`          | Roster tool projects                          | admin            |
| `takes` / `takeAuthors`   | QB Weekly takes board                         | any visitor      |
| `admins`                  | One document per admin UID                    | nobody (console) |

`firestore.rules` in the repo is the source of truth for the policy above.
Editing it does not deploy it — that needs the Firebase console or CLI.

**Auth:** admin is granted by a document at `admins/<uid>`. `useAuth` reads it
to decide whether to show editing controls; the rules check the same document
and are what actually enforce access. Never treat the client-side `isAdmin` as
a security boundary.

There is no `teams` collection. Earlier revisions of this file described one,
along with `capSheet` and `contract_clean` fields; none of that exists here.

## Task Rules for Agents

- ✅ Refactors should preserve visual layout and logic
- ✅ Break large components (>200 lines) into clean, shallow subcomponents
- ✅ Keep logic and layout separated where appropriate
- ✅ Use readable file naming (`TraitGradesBlock.jsx`, `AddPlayerDrawer.jsx`)
- ✅ Preserve modals, filters and blurbs
- ✅ Work on a branch and open a PR; the owner merges
- ❌ Never amend, squash or force-push shared history
- ❌ Never widen a change beyond what was asked without saying so

## The annual roster update

The curated list in `src/features/ranker/quarterbacks.js` decides which
quarterbacks the app carries. Updating it for a new season:

```
1. Edit quarterbacks.js — add new quarterbacks, fix teams for anyone who moved
2. npm run check-roster        validates the list, needs no credentials
3. npm run populate-qbs:dry    reports what would change, writes nothing
4. npm run populate-qbs        applies it
```

Saved data always wins over the script's defaults, so re-running preserves
grades, roles and blurbs. Only name, team and position are refreshed.

**Never remove a quarterback from the list.** Their grades and any past
ranking that includes them depend on the entry existing. Mark them retired on
their profile instead — the status icon in the header — which keeps them
rankable for past seasons while dropping them from the ranker's default pool.

Ids are Firestore document ids. Once a quarterback has been graded, changing
their id orphans everything saved against it.

### What has no ingestion path

`bio` (age, height, weight, years pro), `system.stats` (CMP/ATT/YDS/TD/INT/
CMP%/RTG/QBR) and `contract` are displayed by the app but nothing fills them:
`populateQBs.js` writes empty values and there is no editor for them. The
profile page only edits evaluation — traits, roles, subroles, badges, running
profile, blurbs, overall grade, status. A `package.json` script once pointed at
an `updateStats.js` that has never existed in this repository.

## Verification

```
npx vitest run     # full suite
npm run build      # vite build
npm run lint       # eslint
```

Lint is clean — zero problems. Keep it that way: if a rule fires, fix the
cause or explain in the commit why the rule is wrong here, rather than
disabling it.

Before claiming a fix works, confirm the test fails against the previous
behavior — several bugs here were silent, and a test that only passes
afterwards proves nothing about them.

## PR Guidelines

- Start PR titles with a clear, concise summary (e.g., `refactor: split PlayerProfileView`)
- Include a bullet summary of the changes
- Reference files as `path/to/file.js:42`
- Skip descriptions for unchanged UI unless relevant to the task

## Other Notes

- `docs/` holds `FILE_MAP.md`, `FIRESTORE_SCHEMA.md` and the per-feature
  component hierarchies, which `npm run docs` regenerates.
- `DEVELOPER_GUIDE.md` covers file structure and component logic
- `README.md` covers running and setting up the project
