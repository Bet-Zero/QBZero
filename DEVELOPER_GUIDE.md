# Developer Guide

QBZero is a React + Firebase application that provides a public-facing NFL quarterback scouting tool. This guide explains the project structure and how the pieces fit together for future contributors and AI tools.

## Folder Structure

```
src/
├── components/          # Layout wrappers and shared UI pieces
│   ├── layout/          # Site wide layout components
│   └── shared/          # Reusable UI widgets
├── constants/           # Data lists and enums
├── features/            # Domain modules grouped by feature
│   ├── filters/         # Filtering UI and logic
│   ├── lists/           # Ranked list components
│   ├── profile/         # QB profile editor
│   ├── roster/          # Roster building tools
│   ├── table/           # QB table view
│   └── tierMaker/       # Tier list creation tools
├── hooks/               # Custom React hooks
├── pages/               # Top level route views
├── utils/               # Helper functions and data transforms
├── firebase/            # Firestore helper modules
└── styles/              # Additional style sheets
```

> ### src/components/
>
> - **layout/** – currently only `SiteLayout.jsx` for shared page chrome.
> - **shared/** – generic pieces like `PlayerHeadshot`, `TeamLogo`, modals, drawers and filter widgets.
>
> ### src/features/
>
> Features encapsulate major areas of the UI. Each contains React components specific to that feature.
>
> - **filters/** – filter panel, active filter pills and filter sections.
> - **lists/** – functionality for creating ranked lists of players.
> - **profile/** – player profile view with editable traits, roles and blurbs.
> - **roster/** – team roster builder with add-player drawer and card display.
> - **table/** – main player table and mini row components.
> - **tierMaker/** – drag-and-drop tier board for custom lists.
>
> ### src/hooks/
>
> Custom React hooks used throughout the app:
>
> - `useFirebaseQuery` – fetches a Firestore collection and tracks loading state.
> - `usePlayerData` – loads player documents then normalizes them.
> - `useFilteredPlayers` – applies filter logic and sorting to player arrays.
>
> ### src/pages/
>
> Route level components rendered by React Router. Examples include `PlayerTableView`, `PlayerProfileView`, `TeamRosterView`, etc.
>
> ### src/utils/
>
> Utility modules grouped by domain:
>
> - **filtering/** – functions for filter defaults, options and helpers.
> - **formatting/** – formatting helpers like `formatHeight` and `formatSalary`.
> - **roles/** – position/role mapping utilities and option lists.
> - **roster/** – contract helpers and roster building utilities.
> - `profileHelpers.js` – modal and blurb helpers.
>
> ## Key Components
>
> - **PlayerTable** (`features/table/PlayerTable.jsx`) – central table with search, filters and sort options.
> - **FilterPanel** and **ActiveFiltersDisplay** – manage filter selection and show active pills.
> - **PlayerProfileView** (`pages/PlayerProfileView.jsx`) – edit-mode page for individual players with trait and role breakdown modals.
> - **RosterViewer** (`features/roster/RosterViewer.jsx`) – interactive roster builder. Uses **AddPlayerDrawer** to search and place players.
> - **AddPlayerDrawer** and **PlayerRowMini** – allow quick searching and selecting players for roster slots.
>
> Many mini components in `features/table` (e.g. `PlayerRow`, `PlayerDrawer`, `RolePill`, `PlayerStatsMini`) compose the table UI. Shared UI primitives such as `RangeSelector` and `BadgeFilterSelect` live under `components/shared/ui/`.
>
> ## Custom Hooks
>
> - **useFirebaseQuery** – generic Firestore fetch wrapper returning `{ data, loading, error }`. Defined in `src/hooks/useFirebaseQuery.js`.
> - **usePlayerData** – builds on `useFirebaseQuery('players')` and normalizes documents using `normalizePlayerData` from `utils/roster`.
> - **useFilteredPlayers** – memoizes calls to `filterPlayers` and `sortPlayers` from `utils/filtering/playerFilterUtils.js`.
>
> ## Utilities and Constants
>
> Filtering logic lives in `src/utils/filtering`. Default filter values are defined in `playerFilterDefaults.js`:
>
> ```js
> export function getDefaultPlayerFilters() {
>   return {
>     nameSearch: '',
>     nameOrder: 'az',
>     // ...
>   };
> }
> ```
>
> Role options come from `utils/roles/roleOptions.js` while the comprehensive sub-role list is exported from `constants/SubRoleMasterList.js`.
>
> The roster utilities provide helpers like `buildInitialRoster` which auto-fills starter, rotation and bench groups based on position priorities.
>
> Formatting helpers (`formatHeight`, `formatSalary`) handle display of numbers. `profileHelpers.js` resolves modal titles and blurb text keys.
>
> ## State Flow and Filtering
>
> Player documents are loaded from Firestore via `usePlayerData`. These normalized player objects are passed through `useFilteredPlayers` which applies the current filter set. Filters come from `getDefaultPlayerFilters()` and are updated via the filter UI. Sorting is performed by `sortPlayers` inside `playerFilterUtils.js`.
>
> Firebase documents are expected to contain bio info, contract data, traits, roles, subRoles, badges, stats and blurbs. Normalization adds convenience fields like `formattedPosition` and `salaryByYear` for quicker lookups.
>
> ## Modals and Blurb Editing
>
> Several attributes have explanatory blurbs with optional video. `getModalTitle` and `getBlurbValue` in `profileHelpers.js` map keys such as `trait_Shooting` or `role_offense1` to a user-friendly title and stored text. `Modal.jsx` supports generic popups and is reused for these breakdown editors.
>
> ## Roster Tools
>
> `RosterViewer` orchestrates the starter/rotation/bench sections using **RosterSection** and **PlayerCard**. When adding a player, **AddPlayerDrawer** filters the entire player list by team, position, roles or contract details. Slots can be auto-filled via `buildInitialRoster` when loading an existing team roster.
>
> ## Developer Conventions
>
> - Import paths use the alias `@/` pointing to `src/` (configured in `jsconfig.json`).
> - Components are organized by feature; shared UI lives under `src/components/shared`.
> - Many utilities export functions individually so they can be tree-shaken.
> - Keep new components small and reusable—follow patterns in `features/table` for mini components.
>
> ## Contributing Notes
>
> - There is no automated test suite. Run `npm run lint` (ESLint) where possible.
> - Firebase credentials are loaded from environment variables (`src/firebaseConfig.js`).
> - When adding new filters or traits, update defaults and display helpers accordingly.

## Data Model Overview

Player documents in Firestore are flattened objects with fields for bio, contract, roles and stats. Important properties include `playerId`, `position`, `roles`, `subRoles`, `traits` and a `contract` object. Check `data/players.json` for the full schema.

## Firestore Collections and Data Sources

This project pulls quarterback and contract data from two distinct Firestore collections:

| Collection | Purpose                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| `/players` | Stores universal quarterback data: bio, traits, roles, stats, badges, blurbs |
| `/teams`   | Stores team-specific cap sheets and `contract_clean` (used for cap tools)    |

- Use `usePlayerData()` when querying global quarterback records, rankings, etc.
- Use `useTeamRoster()` or direct `/teams` queries for anything related to contract logic, team building, or cap validation.

📄 Refer to [`DATA_SOURCE_MAP.md`](../docs/DATA_SOURCE_MAP.md) for usage rules  
📄 Refer to [`FIRESTORE_SCHEMA.md`](../docs/FIRESTORE_SCHEMA.md) for field-level details

## Adding Filters or Traits

1. Define default values in `src/utils/filtering/playerFilterDefaults.js`.
2. Add label helpers in `src/utils/filtering/filterHelpers.js` or constants files.
3. Extend the UI under `src/features/filters/FiltersPanel/FilterPanel/sections`.
4. Update `profileHelpers.js` and `constants/badgeList.js` when introducing new trait labels.

## Typical Workflow

1. Install dependencies with `npm install`.
2. Start the dev server via `npm run dev`.
3. Add components within feature folders and split files over ~200 lines.
4. Run `npm run lint` and `npm test` before committing.
