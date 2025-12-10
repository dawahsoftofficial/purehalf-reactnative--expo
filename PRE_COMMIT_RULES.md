# Pre-Commit Rules Documentation

This document explains all the pre-commit rules and checks that run automatically before each commit.

## 🔍 Pre-Commit Hook Overview

The pre-commit hook (`.husky/pre-commit`) runs **automatically** before every commit and performs the following checks:

### 1. Branch Protection Check

**Location**: `.husky/pre-commit` (lines 5-18)

**What it does**:

- Prevents direct commits to protected branches (`main` or `master`)
- Forces you to create a feature branch instead
- Can be bypassed with `SKIP_BRANCH_PROTECTION=true` environment variable

**Example**:

```bash
# ❌ This will fail on main branch
git commit -m "feat: new feature"

# ✅ This will work (on a feature branch)
git checkout -b feature/new-feature
git commit -m "feat: new feature"
```

### 2. TypeScript Type Checking

**Command**: `pnpm type-check`
**What it does**:

- Runs TypeScript compiler in check mode (`tsc --noemit`)
- Validates all TypeScript files without generating output
- Catches type errors before they reach the repository

**Fails if**:

- Type errors exist in any `.ts` or `.tsx` file
- Type definitions are incorrect
- Import/export types are mismatched

### 3. Lint-Staged Checks

**Location**: `lint-staged.config.js`

Runs on **staged files only** (files you're committing), making it fast and efficient.

#### 3.1 JavaScript/TypeScript Files (`**/*.{js,jsx,ts,tsx}`)

**What it does**:

- Runs ESLint with auto-fix on all staged JS/TS files
- Automatically fixes issues that can be auto-fixed
- Blocks commit if unfixable errors remain

**ESLint Rules Applied** (from `eslint.config.mjs`):

##### Code Quality Rules

- **`max-params: 3`** - Functions can have maximum 3 parameters
- **`max-lines-per-function: 70`** - Functions must be under 70 lines
- **`unicorn/filename-case: kebab-case`** - All files must use kebab-case naming
- **`simple-import-sort`** - Imports must be sorted automatically
- **`unused-imports/no-unused-imports`** - Removes unused imports
- **`unused-imports/no-unused-vars`** - Removes unused variables (except those starting with `_`)

##### TypeScript Rules

- **`@typescript-eslint/consistent-type-imports`** - Enforces type-only imports
- **`import/no-cycle`** - Prevents circular dependencies

##### React Rules

- **`react-compiler`** - React Compiler rules
- **`react/display-name: off`** - Display names not required
- **`react/no-inline-styles: off`** - Inline styles allowed
- **`react/destructuring-assignment: off`** - Destructuring not enforced

##### Styling Rules

- **`tailwindcss/classnames-order`** - Tailwind classes must be in official order
- **`prettier/prettier`** - Code formatting via Prettier

#### 3.2 Markdown & JSON Files (`**/*.(md|json)`)

**What it does**:

- Runs Prettier to format markdown and JSON files
- Automatically fixes formatting issues

#### 3.3 Translation Files (`src/translations/*.json`)

**What it does**:

- Validates i18next syntax
- Ensures JSON is valid
- Sorts translation keys alphabetically
- Ensures all translation files have identical keys (compared to `en.json`)

**Rules**:

- **`i18n-json/valid-message-syntax`** - Validates i18next interpolation syntax
- **`i18n-json/valid-json`** - Ensures valid JSON format
- **`i18n-json/sorted-keys`** - Keys must be sorted alphabetically
- **`i18n-json/identical-keys`** - All translation files must have same keys as `en.json`

## 📝 Commit Message Rules

**Location**: `.husky/commit-msg`

**What it does**:

- Validates commit messages using Commitlint
- Enforces [Conventional Commits](https://www.conventionalcommits.org/) format

**Format Required**:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types (Required)

- **`feat:`** - New feature
- **`fix:`** - Bug fix
- **`perf:`** - Performance improvement
- **`docs:`** - Documentation changes
- **`style:`** - Formatting, missing semicolons, etc.
- **`refactor:`** - Code refactoring
- **`test:`** - Adding or updating tests
- **`chore:`** - Maintenance tasks

### Examples

✅ **Valid commit messages**:

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login form validation issue"
git commit -m "docs: update README with setup instructions"
git commit -m "refactor: simplify API client configuration"
```

❌ **Invalid commit messages**:

```bash
git commit -m "added new feature"           # Missing type
git commit -m "fix bug"                      # Missing colon
git commit -m "FEAT: new feature"           # Type must be lowercase
git commit -m "feat:New feature"            # Missing space after colon
```

## 🚫 Bypassing Pre-Commit Hooks

### Skip All Hooks (Not Recommended)

```bash
git commit --no-verify -m "feat: your message"
```

⚠️ **Warning**: Only use this in emergencies. It bypasses all quality checks.

### Skip Branch Protection Only

```bash
SKIP_BRANCH_PROTECTION=true git commit -m "feat: your message"
```

This allows committing to `main`/`master` but still runs linting and type-checking.

## 🔧 Troubleshooting

### Issue: "Direct commits to main branch are not allowed"

**Solution**: Create a feature branch:

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: your message"
```

### Issue: TypeScript errors blocking commit

**Solution**: Fix the type errors:

```bash
# Check what errors exist
pnpm type-check

# Fix the errors in your code, then try again
git commit -m "feat: your message"
```

### Issue: ESLint errors blocking commit

**Solution**: Most errors auto-fix, but if not:

```bash
# Run lint manually to see errors
pnpm lint

# Fix errors in your code, then try again
git commit -m "feat: your message"
```

### Issue: Translation files have mismatched keys

**Solution**: Ensure all translation files have the same keys:

```bash
# Check translation files
pnpm lint:translations

# Add missing keys to all translation files, then try again
git commit -m "feat: your message"
```

## 📊 Summary

| Check                  | Command            | Runs On                  | Auto-Fix |
| ---------------------- | ------------------ | ------------------------ | -------- |
| Branch Protection      | Git hook           | All commits              | ❌       |
| Type Checking          | `pnpm type-check`  | All commits              | ❌       |
| ESLint                 | `pnpm lint-staged` | Staged files only        | ✅       |
| Prettier               | `prettier --write` | Staged files only        | ✅       |
| Translation Validation | `eslint` on JSON   | Staged translation files | ✅       |
| Commit Message         | `commitlint`       | All commits              | ❌       |

## 🎯 Best Practices

1. **Always work on feature branches** - Never commit directly to `main`
2. **Let auto-fix work** - Most issues are automatically fixed
3. **Fix type errors immediately** - They won't go away on their own
4. **Keep translations in sync** - Add keys to all language files
5. **Write clear commit messages** - Follow conventional commits format
6. **Don't bypass hooks** - They're there to maintain code quality

---

_These rules ensure code quality, consistency, and prevent common errors before they reach the repository._
