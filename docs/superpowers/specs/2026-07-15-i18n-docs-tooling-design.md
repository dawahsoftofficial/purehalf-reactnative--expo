# i18n Docs & Tooling Cleanup — Design Spec

- **Date:** 2026-07-15
- **Status:** Approved design, ready for implementation planning
- **Scope:** Six files in `app-old/` that reference a `src/translations/` directory that hasn't existed for a while — the real i18n system lives in `src/languages/`. Correct every stale reference, and make the previously-dead `eslint-plugin-i18n-json` config actually run against the real files.
- **Repos touched:** `app-old/` only.

## 1. Problem

The live i18n system is `src/languages/` (`Keys.tsx` + `English.json`/`Urdu.json`/`RomanUrdu.json`, loaded by `src/languages/i18n.tsx` into i18next). Five files still reference a `src/translations/` directory that doesn't exist, so the tooling/docs built around it are all silently inert:

- `CLAUDE.md` — Layout tree entry, and a Conventions bullet claiming `i18n-json/identical-keys` "will fail builds if other locales drift" (it never runs).
- `.cursorrules` — same tree entry, in an otherwise generic/boilerplate file (see §4).
- `.vscode/settings.json` — `i18n-ally.localesPaths` points at nothing, so the i18n Ally extension does nothing for anyone using it.
- `lint-staged.config.js` — a pre-commit glob matching zero files.
- `eslint.config.mjs` — the i18n-json plugin block's `files` glob and `identical-keys` baseline both point at the dead directory.

A sixth, independent gap: even a correctly-pointed `eslint.config.mjs` wouldn't matter for `yarn lint`, because `package.json`'s `lint`/`lint:fix`/`lint:errors:files` scripts pass `src/**/*.{js,jsx,ts,tsx}` to the eslint CLI — no `.json` — so JSON files are excluded before `eslint.config.mjs`'s own `files` patterns are ever consulted.

Net effect: there has never been real enforcement that `English.json`, `Urdu.json`, and `RomanUrdu.json` stay in sync, valid, or sorted. They don't — see §3.

## 2. Changes

1. **`CLAUDE.md`** — Layout tree: `translations/ # i18n JSON, validated by eslint-plugin-i18n-json` → `languages/ # i18n: Keys.tsx + English/Urdu/RomanUrdu.json, loaded by i18n.tsx (i18next)`. Conventions i18n bullet rewritten to describe what's actually enforced post-fix (valid-json + valid-message-syntax; sorted-keys/identical-keys off, see §3).
2. **`.cursorrules`** — one line: `translations` → `languages` in its folder tree. Nothing else in this file is touched (§4).
3. **`.vscode/settings.json`** — `i18n-ally.localesPaths`: `["src/translations/"]` → `["src/languages/"]`.
4. **`lint-staged.config.js`** — pre-commit glob: `'src/translations/*.(json)'` → `'src/languages/*.(json)'`.
5. **`eslint.config.mjs`** — i18n-json block's `files` → `['src/languages/*.json']`. `valid-json` and `valid-message-syntax` stay at severity 2. `sorted-keys` and `identical-keys` set to `0` with a comment: what's wrong today (`English.json` isn't alphabetized; Urdu is missing 16 keys and has 2 English doesn't; RomanUrdu is missing 21 keys) and what re-enabling requires (sort `English.json`, backfill/reconcile the others, then flip both back to `2` and point `identical-keys`'s `filePath` at `src/languages/English.json`).
6. **`package.json`** — `lint`, `lint:fix`, `lint:errors:files` globs widened to `src/**/*.{js,jsx,ts,tsx,json}`. Only the three language files currently exist under `src/**/*.json`, so nothing unrelated gets swept in.

## 3. What actually happens when this lands

Verified directly (not guessed) against current file contents:

- `valid-json` — passes on all three files today.
- `valid-message-syntax` — passes on 1,962 of 1,963 keys. The one failure: `RomanUrdu.json`'s `refundPolicyDesc` is an empty string, which the validator rejects as an empty message. **This rule is enabled anyway** — one pre-existing error is an acceptable, honest trade for real enforcement going forward, versus disabling the rule to hide it.
- `sorted-keys` — would fail immediately (`English.json` keys aren't alphabetical). Deferred, per your call — not part of this change.
- `identical-keys` — would fail immediately (parity is already broken: Urdu missing 16 keys / 2 orphaned; RomanUrdu missing 21). Deferred, same reason. Urdu/RomanUrdu aren't in active use yet, which is exactly why this drifted unnoticed — reinforces that deferring the harder parity fix now, rather than blocking this cleanup on it, is the right call.
- `yarn lint`'s currently-documented baseline (`CLAUDE.md`: "20 errors, 853 warnings") will shift by the one new `valid-message-syntax` error. The implementation step re-runs `yarn lint` and updates that line to the real count rather than leaving it stale.

## 4. Out of scope

- **`.cursorrules`'s broader inaccuracy.** Its folder tree also lists an `api` folder and describes `lib` as containing "auth, env, hooks, i18n, storage" — neither matches the real structure (`services/api/`, `hooks/`/`global/`/`lib/` per `CLAUDE.md`). Its tech-stack section lists React Query, which isn't a dependency here. This reads as an unedited generic template, not a maintained doc. Only the one `translations` line is being fixed, matching the same narrow scope as every other file in this change — not a rewrite of the file.
- **Sorting `English.json` and backfilling `Urdu.json`/`RomanUrdu.json`** to actually turn on `sorted-keys`/`identical-keys` — deferred per §3, tracked by the comment left in `eslint.config.mjs`.
- **Two content bugs found along the way, already spawned as separate background tasks, not part of this change:**
  - Each locale file repeats the JSON key `"image"` 21 times; 20 of the 21 are silently dead (last-key-wins).
  - `English.json`'s `refundPolicyDesc` is literal Lorem Ipsum placeholder text; `RomanUrdu.json`'s is empty.

## 5. Verification

- `yarn lint` (and `yarn check-all`) run clean modulo the one known `refundPolicyDesc` error, called out by name in the output.
- `i18n-ally` resolves keys in VS Code (spot-check: open `English.json`, confirm inline annotations appear over `t()` calls).
- A staged edit to `src/languages/English.json` triggers the pre-commit hook (confirms `lint-staged.config.js`'s glob match works).
- `CLAUDE.md`'s Commands section error/warning count matches the real `yarn lint` output after the change.
