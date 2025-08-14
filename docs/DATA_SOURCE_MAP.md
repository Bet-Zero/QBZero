# 📘 DATA_SOURCE_MAP.md

This file defines which Firestore collections serve as the source of truth for different types of quarterback/team data. It clarifies what data lives where, which tools use which paths, and what rules Codex should follow.

---

## 🔹 /players — Universal Quarterback Records

- One document per quarterback (`player_id`)
- Used by: QBZero (public site), Rankings, Tier Maker
- Stores all quarterback data except team cap/roster context
- **DO NOT store roster-specific contract logic here** (use `/teams` for that)

### 📦 Main Fields:

- `bio`: AGE, HT, WT, Team, Position, Years Pro
- `traits`: Trait grades (Throwing, Accuracy, Mobility, etc.)
- `blurbs`: All trait/role/throwing-profile descriptions
- `roles`, `subRoles`, `throwingProfile`: Role & style system
- `badges`, `overall_grade`, `status`: Evaluation metadata
- `system.stats`: Passing & rushing stats
- `contract`: Raw scraped contract data
- `contract_summary`: Structured version for quick reference
- `draft`, `agent`, `team`, `position`, `player_id`, `display_name`: Identifiers & metadata

---

## 🔸 /teams — Cap Sheet & Roster Info

- One document per team (`teamId`)
- Used by roster tools, Trade Machine, etc.
- Source of truth for active roster, contracts, and cap sheets

### 📦 Structure:

- `capSheet.lastUpdated`: Timestamp
- `capSheet.players[]`: Full player objects with cleaned contract data

Each player includes:

- Basic info: `name`, `player_id`, `position`, `height`, `weight`, `age`, `display_name`
- `contract_clean`: Finalized contract with structure:
  - `years`, `total_value`, `average_value`
  - `salaries_by_year`: `{ [year]: { salary, guaranteed, option, source } }`
  - `fa_year`, `fa_type`, `franchise_tag`, `has_extension`

---

## ⚙️ Rules for Codex

| Task                                  | Use Collection                      |
| ------------------------------------- | ----------------------------------- |
| QB scouting, grading, stats           | `/players`                          |
| Showing bio & roles in tables         | `/players`                          |
| Showing salary in rankings (optional) | `/players.contract_clean` if synced |
| Cap validation, roster moves          | `/teams` only                       |
| Contract editing                      | `/teams.contract_clean` only        |

---

## 🧠 Reminder for Codex:

- Treat `/players` as the _public, clean, global quarterback record_
- Treat `/teams` as the _private, editable roster state for team tools_
