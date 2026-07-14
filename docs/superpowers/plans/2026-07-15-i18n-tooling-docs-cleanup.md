# i18n Docs & Tooling Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repoint every stale `src/translations/` reference in `app-old/` at the real `src/languages/` i18n system, and make the `eslint-plugin-i18n-json` config actually run against it (instead of silently matching zero files).

**Architecture:** Six small, independent-ish file edits: one config block repointed with two rules deliberately left off (documented why), one CLI glob widened, three trivial path corrections, and two documentation edits. No new dependencies, no application code changes, no runtime behavior changes for end users — this is tooling/docs only.

**Tech Stack:** ESLint 9 flat config, `eslint-plugin-i18n-json` (already a devDependency), `lint-staged`/husky, VS Code `i18n-ally` extension settings.

**Spec:** `docs/superpowers/specs/2026-07-15-i18n-docs-tooling-design.md`

## Global Constraints

- **Branch:** all work happens on `docs/i18n-tooling-cleanup` (already created off `staging`, currently checked out). Do not commit to `staging` directly — this repo's convention is feature branch → merge to `staging`, confirmed by its own git history.
- **Stage exact paths only.** Never `git add -A` or `git add .`. This working tree has other sessions' in-flight uncommitted edits (as of 2026-07-15: `jest-setup.ts`, `jest.config.js`, `src/components/profile-badges.tsx`, `src/languages/English.json`, `src/languages/Urdu.json`, `src/languages/RomanUrdu.json`, `src/screens/privacySettings/PrivacySettings.tsx`, plus an untracked `PrivacySettings.test.tsx`). None of these belong to this plan — leave them untouched and unstaged.
- **Do not edit `src/languages/*.json` content.** Two other sessions are actively editing those three files for unrelated fixes. This plan only touches config/docs files that reference their _path_, never their contents.
- **Rules intentionally left off:** `i18n-json/sorted-keys` and `i18n-json/identical-keys` stay at severity `0` in this plan. Turning them on requires sorting `English.json` and reconciling ~16-21 missing/orphaned keys per locale — out of scope here, tracked via a comment left in `eslint.config.mjs` (Task 1).
- **One known, accepted lint error:** once Task 1 lands, `RomanUrdu.json`'s `refundPolicyDesc` (empty string) fails `i18n-json/valid-message-syntax`. This is expected and is not a regression to chase down — it's a real pre-existing content gap, tracked separately (spawned background task, not part of this plan).

---

### Task 1: Repoint the eslint-plugin-i18n-json config at `src/languages`

**Files:**

- Modify: `eslint.config.mjs:145-185`

**Interfaces:**

- Consumes: nothing from other tasks (first task).
- Produces: an `eslint.config.mjs` whose i18n-json block matches `src/languages/*.json`, with `valid-json`/`valid-message-syntax` enabled and `sorted-keys`/`identical-keys` off. Task 2 depends on this being correct before widening `package.json`'s glob.

- [ ] **Step 1: Replace the i18n-json config block**

In `eslint.config.mjs`, find this block (currently lines 145-185):

```js
  {
    files: ['src/translations/*.json'],
    plugins: { 'i18n-json': i18nJsonPlugin },
    processor: {
      meta: { name: '.json' },
      ...i18nJsonPlugin.processors['.json'],
    },
    rules: {
      ...i18nJsonPlugin.configs.recommended.rules,
      'i18n-json/valid-message-syntax': [
        2,
        {
          syntax: path.resolve(
            __dirname,
            './scripts/i18next-syntax-validation.js'
          ),
        },
      ],
      'i18n-json/valid-json': 2,
      'i18n-json/sorted-keys': [
        2,
        {
          order: 'asc',
          indentSpaces: 2,
        },
      ],
      'i18n-json/identical-keys': [
        2,
        {
          filePath: path.resolve(__dirname, './src/translations/en.json'),
        },
      ],
      'prettier/prettier': [
        0,
        {
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],
    },
  },
```

Replace it with:

```js
  {
    files: ['src/languages/*.json'],
    plugins: { 'i18n-json': i18nJsonPlugin },
    processor: {
      meta: { name: '.json' },
      ...i18nJsonPlugin.processors['.json'],
    },
    rules: {
      ...i18nJsonPlugin.configs.recommended.rules,
      'i18n-json/valid-message-syntax': [
        2,
        {
          syntax: path.resolve(
            __dirname,
            './scripts/i18next-syntax-validation.js'
          ),
        },
      ],
      'i18n-json/valid-json': 2,
      // sorted-keys/identical-keys are OFF: English.json's keys aren't sorted
      // alphabetically yet, and Urdu/RomanUrdu already have drift vs English
      // (Urdu is missing 16 keys and has 2 English doesn't; RomanUrdu is
      // missing 21 keys). Sort English.json and reconcile the other two
      // locale files, then flip these back to 2 and point identical-keys at:
      //   filePath: path.resolve(__dirname, './src/languages/English.json')
      'i18n-json/sorted-keys': 0,
      'i18n-json/identical-keys': 0,
      'prettier/prettier': [
        0,
        {
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],
    },
  },
```

- [ ] **Step 2: Verify directly against the real files (bypassing `yarn lint` — Task 2 widens that separately)**

Run from `app-old/`:

```sh
npx eslint src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
```

Expected: exactly one problem, on `RomanUrdu.json`:

```
D:\GitHub\Pure Half\app-old\src\languages\RomanUrdu.json
  0:0  error
- Expected
+ Received

  Object {
    "translation": Object {
-     "refundPolicyDesc": "ValidMessage<String>",
+     "refundPolicyDesc": "String('') ===> Message is Empty.",
    },
  }  i18n-json/valid-message-syntax

✖ 1 problem (1 error, 0 warnings)
```

`English.json` and `Urdu.json` should report no problems. If you see anything else (e.g. `sorted-keys` or `identical-keys` firing), the rule severities weren't set to `0` correctly — recheck Step 1.

- [ ] **Step 3: Commit**

```sh
git add eslint.config.mjs
git commit -m "fix(lint): point i18n-json config at src/languages, defer sorted/identical-keys"
```

---

### Task 2: Widen `package.json`'s lint scripts to cover JSON, update the documented count

**Files:**

- Modify: `package.json` (scripts: `lint`, `lint:fix`, `lint:errors:files`)
- Modify: `CLAUDE.md:46`

**Interfaces:**

- Consumes: Task 1's corrected `eslint.config.mjs` (this task's verification only makes sense with that already in place).
- Produces: `yarn lint` now actually covers `src/languages/*.json`. The real error/warning count from this task's run is what Task 6 re-confirms at the end.

- [ ] **Step 1: Widen the three eslint-invoking scripts**

In `package.json`, in the `"scripts"` block:

```json
    "lint": "eslint \"src/**/*.{js,jsx,ts,tsx}\" --ignore-pattern \"**/node_modules/**\"",
    "lint:fix": "eslint \"src/**/*.{js,jsx,ts,tsx}\" --fix --ignore-pattern \"**/node_modules/**\"",
    "lint:errors:files": "eslint \"src/**/*.{js,jsx,ts,tsx}\" --quiet --format json | node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const r=JSON.parse(d||'[]');const s=new Set();for(const f of r){if((f.errorCount||0)>0)s.add(f.filePath);}process.stdout.write([...s].join('\\n'));});\"",
```

Replace with (only the glob changes, `{js,jsx,ts,tsx}` → `{js,jsx,ts,tsx,json}` in all three):

```json
    "lint": "eslint \"src/**/*.{js,jsx,ts,tsx,json}\" --ignore-pattern \"**/node_modules/**\"",
    "lint:fix": "eslint \"src/**/*.{js,jsx,ts,tsx,json}\" --fix --ignore-pattern \"**/node_modules/**\"",
    "lint:errors:files": "eslint \"src/**/*.{js,jsx,ts,tsx,json}\" --quiet --format json | node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const r=JSON.parse(d||'[]');const s=new Set();for(const f of r){if((f.errorCount||0)>0)s.add(f.filePath);}process.stdout.write([...s].join('\\n'));});\"",
```

- [ ] **Step 2: Run `yarn lint` and record the real count**

```sh
yarn lint
```

Expected: the existing pre-change baseline (per `CLAUDE.md`: 20 errors, 853 warnings) plus exactly one new error — the same `RomanUrdu.json` / `refundPolicyDesc` / `i18n-json/valid-message-syntax` failure from Task 1, Step 2. Total should be **21 errors**, warnings unchanged at **853** (this rule only adds errors, no new warnings).

If the numbers differ from this, stop and investigate before continuing — don't just copy "21 errors" into the doc without the real run matching.

- [ ] **Step 3: Update the documented count in `CLAUDE.md`**

In `CLAUDE.md`, find (line 46):

```
yarn lint               # eslint  (currently: 20 errors, 853 warnings — see Known Issues)
```

Replace with the real count from Step 2 (shown here assuming it matched the expected 21/853 — use your actual numbers if different):

```
yarn lint               # eslint  (currently: 21 errors, 853 warnings — see Known Issues)
```

- [ ] **Step 4: Commit**

```sh
git add package.json CLAUDE.md
git commit -m "chore(lint): widen yarn lint to cover src/languages/*.json"
```

---

### Task 3: Fix the pre-commit hook's dead glob

**Files:**

- Modify: `lint-staged.config.js:16`

**Interfaces:**

- Consumes: nothing from Tasks 1-2 (lint-staged invokes `eslint` directly on staged filenames, independent of `package.json`'s scripts or which `eslint.config.mjs` block exists — though in practice it now benefits from Task 1's fix once a language file is actually staged).
- Produces: a working pre-commit glob. Nothing later depends on this directly.

- [ ] **Step 1: Fix the glob**

In `lint-staged.config.js`, find:

```js
  'src/translations/*.(json)': (filenames) => [
    `npx eslint --fix ${filenames
      .map((filename) => `"${filename}"`)
      .join(' ')}`,
  ],
```

Replace with:

```js
  'src/languages/*.(json)': (filenames) => [
    `npx eslint --fix ${filenames
      .map((filename) => `"${filename}"`)
      .join(' ')}`,
  ],
```

- [ ] **Step 2: Verify the glob matches the real files (without touching them or git staging)**

Run from `app-old/`:

```sh
node -e "
const mm = require('micromatch');
const files = ['src/languages/English.json', 'src/languages/Urdu.json', 'src/languages/RomanUrdu.json', 'src/languages/Keys.tsx'];
const pattern = 'src/languages/*.(json)';
for (const f of files) console.log(f, '=>', mm.isMatch(f, pattern));
"
```

Expected:

```
src/languages/English.json => true
src/languages/Urdu.json => true
src/languages/RomanUrdu.json => true
src/languages/Keys.tsx => false
```

- [ ] **Step 3: Commit**

```sh
git add lint-staged.config.js
git commit -m "fix(hooks): point pre-commit i18n-json glob at src/languages"
```

---

### Task 4: Fix the editor/tooling config references

**Files:**

- Modify: `.vscode/settings.json:34`
- Modify: `.cursorrules:26`

**Interfaces:**

- Consumes: nothing (fully independent of Tasks 1-3).
- Produces: nothing later depends on.

- [ ] **Step 1: Fix `.vscode/settings.json`**

Find:

```json
  "i18n-ally.localesPaths": ["src/translations/"],
```

Replace with:

```json
  "i18n-ally.localesPaths": ["src/languages/"],
```

- [ ] **Step 2: Fix `.cursorrules`**

Find (line 26, inside the folder-tree code block):

```
  ├── translations  ## translations files for the app
```

Replace with:

```
  ├── languages  ## i18n: Keys.tsx + English/Urdu/RomanUrdu.json (i18next)
```

Leave the rest of `.cursorrules` untouched — its tree has other inaccuracies (an `api` folder, a `lib` description that doesn't match reality, a React Query mention that isn't a real dependency) that are out of scope per the spec (§4). Only this one line changes.

- [ ] **Step 3: Confirm no stale references remain in either file**

```sh
grep -n "src/translations\|translations " .vscode/settings.json .cursorrules
```

Expected: no output (no matches).

- [ ] **Step 4: Commit**

```sh
git add .vscode/settings.json .cursorrules
git commit -m "docs: point i18n-ally and .cursorrules at src/languages"
```

---

### Task 5: Fix CLAUDE.md's i18n description

**Files:**

- Modify: `CLAUDE.md:36` (Layout tree)
- Modify: `CLAUDE.md:62` (Conventions)

**Interfaces:**

- Consumes: Task 1's enforcement decision (what's actually on/off) so the Conventions bullet describes reality, not aspiration.
- Produces: nothing later depends on.

- [ ] **Step 1: Fix the Layout tree entry**

Find (last line of the tree, currently line 36):

```
└── translations/            # i18n JSON, validated by eslint-plugin-i18n-json
```

Replace with:

```
└── languages/               # i18n: Keys.tsx + English/Urdu/RomanUrdu.json, loaded by i18n.tsx (i18next)
```

- [ ] **Step 2: Fix the Conventions bullet**

Find (currently line 62):

```
- **i18n**: every user-visible string goes through `t()`. Keys in `src/translations/en.json` are authoritative; `i18n-json/identical-keys` will fail builds if other locales drift.
```

Replace with:

```
- **i18n**: every user-visible string goes through `t()`. Keys live in `src/languages/English.json` (+ `Urdu.json`, `RomanUrdu.json`, `Keys.tsx`), loaded by `src/languages/i18n.tsx`. `eslint-plugin-i18n-json` validates JSON syntax and i18next interpolation syntax on these files; key-parity/sort enforcement (`identical-keys`/`sorted-keys`) isn't turned on yet — English.json isn't alphabetized and locale parity has existing drift (see the comment in `eslint.config.mjs`).
```

- [ ] **Step 3: Commit**

```sh
git add CLAUDE.md
git commit -m "docs: describe the real src/languages i18n system in CLAUDE.md"
```

---

### Task 6: Final verification sweep

**Files:** none modified — verification only.

**Interfaces:**

- Consumes: the combined result of Tasks 1-5.
- Produces: confidence this is ready to hand off (merge/PR decision is the user's, per project convention — this task doesn't merge anything).

- [ ] **Step 1: Re-run `yarn lint`, confirm it matches Task 2's captured count**

```sh
yarn lint
```

Expected: identical to Task 2 Step 2's numbers (Tasks 3-5 don't touch anything `eslint` inspects, so this should be unchanged).

- [ ] **Step 2: Confirm type-check is still clean**

```sh
yarn type-check
```

Expected: no output, exit code 0 (per `CLAUDE.md`, this was clean before this plan and nothing here touches `src/**/*.{ts,tsx}`).

- [ ] **Step 3: Confirm no stale references remain in any of the six touched files**

```sh
grep -n "src/translations" CLAUDE.md .cursorrules .vscode/settings.json lint-staged.config.js eslint.config.mjs package.json
```

Expected: no output. (The design spec at `docs/superpowers/specs/2026-07-15-i18n-docs-tooling-design.md` still legitimately mentions `src/translations` — that file is intentionally out of scope, it's the historical record of what was wrong.)

- [ ] **Step 4: Manual check — i18n Ally in VS Code (human-only, not scriptable)**

This step can't be automated by an agent; flag it to the user rather than skipping it silently:

1. Open `app-old/` in VS Code with the i18n Ally extension installed and enabled.
2. Open `src/languages/English.json`.
3. Open any screen file that calls `t('someKey')` (e.g. search `t(Keys.` in `src/screens/`).
4. Expected: i18n Ally shows an inline annotation over the `t()` call with the resolved English string, instead of showing nothing (which was the pre-fix behavior, since `localesPaths` pointed at a nonexistent folder).

If the user doesn't use VS Code / i18n Ally, this step is not blocking — note that it was skipped and why.

- [ ] **Step 5: Review the branch**

```sh
git log --oneline staging..docs/i18n-tooling-cleanup
git status --short
```

Expected: 6 commits (the spec commit from brainstorming + Tasks 1-5), and `git status` shows no unexpected files staged or modified beyond the other sessions' pre-existing unrelated changes noted in Global Constraints.

No commit for this task — if any check fails, fix it as part of the task whose change caused it, then re-run this sweep.
