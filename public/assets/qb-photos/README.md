# qb-photos

This folder contains **decorative/styling QB images** used for specialized pages (e.g. action shots, themed visuals).

---

## 🔍 Purpose

- These are not standard player headshots — used for visual styling and theme.
- Intentionally separate from `/assets/headshots/` which are used for standardized portraits.

---

## 📂 Usage

- All imports of these images should reference `/assets/qb-photos/...`
- Example file(s):
  - `jameis-1.png … jameis-5.png` → used in `RankerLandingPage.jsx`

---

## ⚠️ Notes

- Changes or deletions in this folder require checking specific pages that use these assets.
- If moving / renaming, update import paths in code.
- Compression / optimizations of these images should preserve visual fidelity.

---

## 🛠 Suggested Workflow

1. If adding new decorative/styling assets for QBs → place here.
2. If refactoring / cleaning → exclude this folder by default in cleanup scans, unless explicitly targeted.
3. Ensure import paths are consistent (no ambiguous dynamic strings that might hide usage).
