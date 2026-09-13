# FIRESTORE_SCHEMA.md

Field reference for the Firestore collections QBZero actually uses. See
`firestore.rules` for who may write to each, and `AGENTS.md` for the summary.

---

## `players/{playerId}`

The master quarterback record. Document id matches the `id` in
`src/features/ranker/quarterbacks.js` (e.g. `josh-allen`).

- `player_id`: string, same as the document id
- `display_name`: string
- `status`: `'active'` | `'retired'` — retired quarterbacks are kept forever;
  the ranker's default pool filters on this rather than dropping them
- `bio`: `{ Team, Position, AGE, HT, WT, 'Years Pro' }` — `Team` is an
  abbreviation (`KC`, `ARI`), matching the `abbr` on `TeamListFull`
- `traits`: one key per entry in `QB_TRAITS` (`src/constants/traits.js`),
  each 0–100
- `roles`: `{ offense1, offense2, style1, style2, armTalent }`
- `subRoles`: `{ offense: string[] }` — names from `SubRoleMasterList`
- `runningProfile`: one of `runningProfileTiers`
- `badges`: string[]
- `blurbs`: `{ traits, roles, subroles, throwingProfile, playStyle, overall }`
- `overall_grade`: number | null
- `system.stats`: `{ CMP, ATT, YDS, TD, INT, 'CMP%', RTG, QBR, G }` — the keys
  in `QB_STATS` (`src/constants/stats.js`)
- `contract`, `contract_summary`: raw contract data
- `free_agency_year`, `free_agent_type`

`normalizePlayerData` flattens this for the UI, lifting `system.stats` to the
top level and deriving `heightInInches`, `salaryByYear` and `formattedPosition`.
Those derived fields are not stored — do not write them back.

## `qbRankings/{rankingId}`

The standalone ranking lists — the ones made from "Create Rankings" and edited
at `/rankings/other/{id}`. Each holds `name`, `rankings`, `createdAt` and
`updatedAt`. The personal board is **not** here, despite what earlier revisions
of this file said.

## `personalRankingArchives/{archiveId}`

The personal board and its history, in one collection. Two shapes, told apart
by a single field:

| Field       | The live board        | A snapshot |
| ----------- | --------------------- | ---------- |
| `isCurrent` | `true`                | absent     |
| `rankings`  | the board             | the board as it stood |
| `notes`     | note for this version | the note the archived version carried |
| `version`   | bumped on every save  | — |
| `createdAt` | when first created    | when archived |
| `updatedAt` | last save             | — |

Exactly one document carries `isCurrent: true`; every query here filters on it
explicitly. Saving is a transaction: the outgoing board is written as a new
snapshot and the live document replaced in one commit, so two tabs cannot
produce two snapshots of the same state or lose a board between them. A save
may pass the `version` it loaded, and is refused if the document has moved on.

Each entry in `rankings` is `{ id, name, team, imageUrl, notes, rank }`. `id` is
the roster id from `quarterbacks.js`, which is also the player document id and
the headshot filename — entries used to carry a generated id instead, which is
why movement treated a re-added quarterback as new. A manual entry, for someone
not on the roster, gets an id prefixed `manual-`.

A snapshot is frozen on purpose: the live board resolves `team` from the player
record on render, an archive never does.

Older documents may also carry `timestamp` (a client-clock ISO string) and
`snapshotNumber` / `previousArchiveId` from a chain nothing read. Nothing writes
them now; `timestamp` is still read as a fallback so old snapshots show a date.

## `lists/{listId}`

User-built lists: ordered players, optional tiers, title and subtitle.

## `tierLists/{tierListId}`

Tier maker boards: named rows holding player ids.

## `rosterProjects/{projectId}`

Saved roster tool projects.

## `takes/{takeId}` and `takeAuthors/{authorId}`

The QB Weekly takes board. Visitors claim an author name, receive a code, and
post takes; `status` on a take is `'pending'` | `'correct'` | `'incorrect'`.
These are the only collections a visitor may write to.

## `admins/{uid}`

Presence of a document grants admin. Created in the Firebase console only —
`firestore.rules` denies all writes to it, and the app never attempts one.
