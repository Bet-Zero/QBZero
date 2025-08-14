# AGENTS.md – QBZero AI Instructions

## Project Overview

QBZero is a public-facing NFL quarterback scouting platform. It displays QB bios, stats, roles, contracts, and grades using a clean layout. All quarterback data is loaded from Firebase Firestore using a flattened player structure (no nested documents).

This is a read-only scouting tool used to view quarterback attributes and evaluations. You should never write to Firestore or attempt to save data — only read.

## Coding Conventions

- Framework: React + Vite + Firebase
- Backend: Firestore (flattened quarterback documents in 'players' collection)
- Style: Tailwind CSS with utility classes
- Imports: Use alias paths (e.g., @/components/...)
- File Format: Named exports preferred; default exports only for top-level views

## File Structure

Project is organized by feature-first structure with scoped utility and component folders:

src/
components/
layout/
shared/
ui/
drawers/
filters/
grades/
features/
table/
profile/
roster/
lists/
filters/
tierMaker/
hooks/
utils/
filtering/
formatting/
roles/
roster/
constants/
firebase/
pages/
styles/

All new code should be grouped by feature when possible. Reusable UI or logic goes in `shared/`, `hooks/`, or `utils/`.

## Task Rules for Agents

- ✅ Refactors should preserve visual layout and logic
- ✅ Break large components (>200 lines) into clean, shallow subcomponents
- ✅ Keep logic and layout separated where appropriate
- ✅ Use smart, readable file naming (TraitGradesBlock.jsx, AddPlayerDrawer.jsx, etc.)
- ✅ Preserve modals, filters, blurbs, and Firestore reads
- ✅ Leave the worktree clean (git status should show no changes)
- ❌ Never create new branches
- ❌ Never amend or squash existing commits

## Firestore Data Source Rules

This project uses two Firestore collections for quarterback-related data:

| Collection | Used For                                                                           |
| ---------- | ---------------------------------------------------------------------------------- |
| `/players` | Global quarterback data (bio, traits, roles, stats, badges, blurbs, raw contracts) |
| `/teams`   | Roster-specific data (contract_clean, team cap sheets, Architect tools)            |

- All role, trait, stat, badge, and evaluation info comes from `/players`
- All salary/cap validation logic must use `contract_clean` from `/teams`
- Only `/teams` should be modified when editing contracts or roster logic
- Codex should treat `/players` as the read-only master record

📄 Reference [`DATA_SOURCE_MAP.md`](../docs/DATA_SOURCE_MAP.md) for usage patterns  
📄 See [`FIRESTORE_SCHEMA.md`](../docs/FIRESTORE_SCHEMA.md) for full field breakdowns

## Firebase Rules

- All data is read from Firestore.
  The main Firestore collections are:

- `'players'`: flattened quarterback documents used for traits, roles, stats, badges, etc.
- `'teams'`: documents that contain `capSheet.players[]` with `contract_clean` and team roster data

- Do not modify Firestore read logic without validating schema against usePlayerData.js and Firebase helpers.

## PR Guidelines

- Start PR titles with a clear, concise summary (e.g., `refactor: split PlayerProfileView`)
- Include a bullet summary of the changes
- Cite file paths using `【F:path†L#】` format
- Skip descriptions for unchanged UI unless relevant to the task

## Other Notes

- DEVELOPER_GUIDE.md contains detailed file structure, key files, and component logic
- README.md contains instructions for running and setting up the project
- Use /features/profile/ and /features/lists/ as structural examples if needed
