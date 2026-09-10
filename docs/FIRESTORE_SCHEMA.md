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

Saved ranking sets, plus the current personal ranking.

## `personalRankingArchives/{archiveId}`

Point-in-time snapshots of a personal ranking, used for movement indicators.

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
