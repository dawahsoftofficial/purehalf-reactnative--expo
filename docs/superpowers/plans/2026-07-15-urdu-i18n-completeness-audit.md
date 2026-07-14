# Urdu i18n Completeness Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two i18n completeness gaps in `app-old/src/languages/Urdu.json` found while fixing the prior "not available" placeholder sweep (2026-07-15): 16 keys entirely missing from Urdu.json, and ~24 keys present but silently copy-pasted from English with no marker. Resolve both with real Urdu translations, consistent placeholder-flagging for confirmed-dead keys, and deletion of 2 confirmed-orphaned Urdu-only keys.

**Architecture:** Pure content edits to `app-old/src/languages/Urdu.json` (one flat `translation` object, 4-space indent, standard JSON), plus one small doc-accuracy comment update in `app-old/eslint.config.mjs`. No component/screen code changes. No RomanUrdu.json changes (explicitly out of scope — separate follow-up per project memory).

**Tech Stack:** i18next + react-i18next, `eslint-plugin-i18n-json` (valid-json / valid-message-syntax only — sorted-keys/identical-keys are deliberately off repo-wide pending a separate, already-branched cleanup; see Global Constraints).

## Global Constraints

- **Translate current English.json wording, not stale Urdu wording or key names.** Several existing Urdu values are translations of an _older_ English string (e.g. `giftClaimBody` currently reads "Claim {{amount}} free chat credits…" while current `English.json` says "Claim your free chats…" with no placeholder). Always match `English.json`'s current value, and preserve/restore interpolation placeholders (`{{amount}}`, etc.) whenever the actual call site passes that param — verified per-key below, don't re-derive.
- **Confirmed-dead keys get the literal placeholder string `"not available"`, not a real translation.** This matches the established precedent already in this file (`relation`/`selectRelation` were left as `"not available"` rather than translated or deleted, because they had zero live call sites). Do not spend translation effort on strings nothing renders.
- **Guardian-login keys are not touched.** `enterYourEmailLabel` ("Sign in as guardian") stays exactly as-is — do not translate, do not delete. Its screen (`GuardianEmailInput.tsx`) was physically deleted in commit `6d060cb`; per root `CLAUDE.md` and `app-old/CLAUDE.md`, all guardian-login code is slated for removal, not extension. Translating a string for a deleted screen is wasted/contradictory effort.
- **RomanUrdu.json is out of scope.** Do not touch it — it has its own, separately-tracked drift (21 missing keys per the `eslint.config.mjs` comment).
- **Formatting**: 4-space indent, double-quoted keys/values, matches surrounding lines exactly. Preserve key insertion order to mirror `English.json`'s ordering (insert new keys adjacent to the same neighbors English.json has them next to).
- **Before starting**: the working tree had unrelated uncommitted changes in progress on these same files as of plan-writing time (a concurrent cleanup of `relation`/`selectRelation` + various other `"not available"` fills). Task 1 below re-verifies the baseline is clear before any edit — do not skip it.

---

### Task 1: Re-verify baseline

**Files:**

- Read-only: `app-old/src/languages/English.json`, `app-old/src/languages/Urdu.json`

**Interfaces:**

- Produces: confirmation that the key sets below still match current disk state before Tasks 2–8 edit anything.

- [ ] **Step 1: Confirm no other uncommitted changes are in flight**

Run: `cd app-old && git status --short -- src/languages/`
Expected: clean (no output) for `English.json`/`Urdu.json`/`Keys.tsx`, OR changes that are unrelated to the keys listed in Tasks 2–8 below (cross-check by name if anything shows up). If `relation`/`selectRelation`-style unrelated work is still uncommitted, stop and ask before proceeding — don't edit on top of someone else's uncommitted work without checking again.

- [ ] **Step 2: Re-run the key-diff to confirm this plan's key lists are still accurate**

Run (from repo root):

```bash
node -e "
const en = require('./app-old/src/languages/English.json').translation;
const ur = require('./app-old/src/languages/Urdu.json').translation;
const missing = ['alsoRefund','refundPolicyText','membershipactiveText','blurForOthers','blurIsOn','blurYourPhotoForPrivacy','visibleToOthersUnblurred','visibleToOthersBlurred','youWillStillSeeOriginal','helpsKeepIdentityPrivate','recommendedForIslamicModesty','youStayInControl','originalPhotoStoredSecurely','gotIt','locationConsentHeading','locationConsentDescription'];
const orphaned = ['paymentOfDescription','basicInformation'];
console.log('Still missing from Urdu (expect all 16 true):', missing.every(k => !(k in ur)));
console.log('Still orphaned in Urdu (expect all 2 true):', orphaned.every(k => (k in ur) && !(k in en)));
console.log('giftClaimBody current EN:', JSON.stringify(en.giftClaimBody));
"
```

Expected: both booleans `true`, and `giftClaimBody` EN value has no `{{amount}}` (confirms the interpolation-mismatch finding still holds). If anything differs, stop and re-diff by hand before continuing — the translations below assume this exact baseline.

- [ ] **Step 3: Commit checkpoint**

No commit — read-only verification task. Proceed to Task 2 only if Step 2's output matches expected.

---

### Task 2: Add the photo-blur-privacy modal keys (11 keys)

**Context:** These 11 keys have zero live JSX consumer today — they're prep copy for a blur-privacy explainer modal referenced in `docs/superpowers/specs/2026-07-11-onboarding-polish-design.md:63` ("styled after the existing blur-info modal pattern") that hasn't been (re)built yet. Unlike the dead keys in Task 7, this is _pending_ feature copy, not abandoned/superseded copy — English.json already carries it as authoritative content, so Urdu should match it now rather than waiting for the modal to ship. Terminology matches the live sibling keys `blurMyPhoto`/`blurPhotoHint` (→ "دھندلی") and `turnOnBlur`/`turnOffBlur` (→ "بلر … کریں") already in this file. `gotIt`'s Urdu matches the already-translated `understood` key ("سمجھ گئے"), which serves the identical "single-button acknowledgment modal" role at its one real call site (`Header.tsx:1187-1191`, the "Profile in review" modal).

**Files:**

- Modify: `app-old/src/languages/Urdu.json`

**Interfaces:**

- Consumes: none (new keys)
- Produces: 11 new keys matching `English.json`'s existing key set exactly (no interpolation params on any of these).

- [ ] **Step 1: Insert the 11 keys**

Find this existing line (last of the `blurMyPhoto`/`blurPhotoHint`/`blurProfilePic`/`unblurProfilePic`/`turnOnBlur`/`turnOffBlur` cluster is elsewhere in the file — these 11 new keys instead go where `English.json` has them, immediately after `turnOffBlur` and before `blurYourPhotoForPrivacy`'s next neighbor per English.json's order: `blurForOthers` → `blurIsOn` → `blurYourPhotoForPrivacy` → `visibleToOthersUnblurred` → `visibleToOthersBlurred` → `youWillStillSeeOriginal` → `helpsKeepIdentityPrivate` → `recommendedForIslamicModesty` → `youStayInControl` → `originalPhotoStoredSecurely` → `gotIt` → (existing `searchProfiles` key follows). Locate the current Urdu.json line containing `"turnOffBlur"` and confirm what immediately follows it — insert the block there, immediately before whatever key currently follows `turnOffBlur`. If `turnOffBlur` is not adjacent to that follow-on key (i.e. other unrelated keys sit between), instead anchor on the key immediately preceding `searchProfiles` in Urdu.json and insert right before `"searchProfiles"` — matching English.json's ordering takes priority over matching Urdu.json's current (already-imperfect) ordering.

Insert this block (exact JSON, 4-space indent to match surrounding lines):

```json
    "blurForOthers": "بلر آن کریں",
    "blurIsOn": "بلر آف کریں",
    "blurYourPhotoForPrivacy": "رازداری کے لیے اپنی تصویر دھندلی کریں",
    "visibleToOthersUnblurred": "دوسروں کو نظر آئے گی (غیر دھندلی)",
    "visibleToOthersBlurred": "دوسروں کو نظر آئے گی (دھندلی)",
    "youWillStillSeeOriginal": "آپ کو اپنی اصل تصویر ہمیشہ نظر آئے گی۔ جب بلر آن ہو تو دوسروں کو دھندلی تصویر نظر آئے گی۔",
    "helpsKeepIdentityPrivate": "آپ کی شناخت نجی رکھنے میں مدد دیتا ہے",
    "recommendedForIslamicModesty": "اسلامی پردے اور باوقار میچنگ کے لیے تجویز کردہ",
    "youStayInControl": "کنٹرول آپ کے ہاتھ میں ہے: بلر کبھی بھی تبدیل کریں",
    "originalPhotoStoredSecurely": "آپ کی اصل تصویر محفوظ طریقے سے محفوظ رہتی ہے۔ بلر فعال ہونے پر ایپ دوسروں کو صرف دھندلی تصویر دکھاتی ہے۔",
    "gotIt": "سمجھ گئے",
```

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('app-old/src/languages/Urdu.json','utf8')); console.log('valid')"`
Expected: `valid` (no throw)

- [ ] **Step 3: Commit**

```bash
cd app-old && git add src/languages/Urdu.json
git commit -m "feat(i18n): add Urdu translations for photo-blur-privacy modal copy"
```

---

### Task 3: Add the location-consent modal keys (2 keys)

**Context:** Live, single call site: `app-old/src/components/alerts/LocationConsentModal.tsx:31-36`, rendered from `Settings.tsx:302-306`. Title + body of a permission-request modal. No interpolation. Uses "لوکیشن" (transliterated), matching the sibling live strings `enableLocation`/`enableLocationDes` in the same permission-request family — not the outlier native-word "مقام" used by the standalone `location` key elsewhere.

**Files:**

- Modify: `app-old/src/languages/Urdu.json`

**Interfaces:**

- Consumes: none (new keys)
- Produces: `locationConsentHeading`, `locationConsentDescription`

- [ ] **Step 1: Insert the 2 keys**

In English.json these sit between `restoreSubscriptionErrorMessage` and `ratingPromptTitle`. Locate those same two keys in Urdu.json and insert this block between them:

```json
    "locationConsentHeading": "لوکیشن تک رسائی درکار ہے",
    "locationConsentDescription": "ہمیں آپ کے قریب موجود ساتھیوں کو تلاش کرنے اور میچنگ کا تجربہ بہتر بنانے کے لیے آپ کی لوکیشن درکار ہے۔ آپ کی لوکیشن کا ڈیٹا صرف میچنگ کے مقصد کے لیے استعمال ہوتا ہے اور محفوظ رکھا جاتا ہے۔",
```

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('app-old/src/languages/Urdu.json','utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 3: Commit**

```bash
cd app-old && git add src/languages/Urdu.json
git commit -m "feat(i18n): add Urdu translations for location-consent modal"
```

---

### Task 4: Add the refund/membership keys (3 keys)

**Context:** `alsoRefund` + `refundPolicyText` are live at `app-old/src/screens/proFeaturesPromotion/components/TermsAndConditions.tsx:37,44` — rendered as two **adjacent, separate** `<Text>` elements (`{t('alsoRefund')}` immediately followed by a tappable `{t('refundPolicyText')}` link), not one concatenated string. Don't bake "Refund Policy" into `alsoRefund`'s own text or it'll visually duplicate. `refundPolicyText` matches the already-translated `refundPolicy` key exactly ("ریفنڈ پالیسی"). `membershipactiveText` has **zero live call sites** — `MembershipInfo.tsx:157-160` uses a different key (`renewalDate`) for the same UI row — so it gets the dead-key placeholder treatment (Task 7 convention), not a real translation, even though it's in the "missing" bucket rather than the "silently untranslated" bucket.

**Files:**

- Modify: `app-old/src/languages/Urdu.json`

**Interfaces:**

- Consumes: none (new keys)
- Produces: `alsoRefund`, `refundPolicyText`, `membershipactiveText`

- [ ] **Step 1: Insert `alsoRefund` and `refundPolicyText`**

In English.json these sit between `acceptTermsAndConditions` and `privacyPolicy`. Locate those two keys in Urdu.json and insert between them:

```json
    "alsoRefund": "آپ درج ذیل بھی ملاحظہ کر سکتے ہیں:",
    "refundPolicyText": "ریفنڈ پالیسی",
```

- [ ] **Step 2: Insert `membershipactiveText`**

In English.json this sits between `membershipUpgradeMsg` and `diveInAndExplore`. Locate those two keys in Urdu.json and insert between them:

```json
    "membershipactiveText": "not available",
```

- [ ] **Step 3: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('app-old/src/languages/Urdu.json','utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 4: Commit**

```bash
cd app-old && git add src/languages/Urdu.json
git commit -m "feat(i18n): add Urdu translations for refund policy link text"
```

---

### Task 5: Translate the silently-untranslated profile-attribute labels (15 keys)

**Context:** These are short profile-field/section labels, currently byte-identical to their English values (no placeholder marker, so the earlier "not available" sweep missed them). Terminology cross-checked against already-translated sibling keys for the same concepts (e.g. `doYouOwnACar` → "کار" not "گاڑی"; `smoking` → "تمباکو نوشی"; `haveChildren` → "بچے"; `aboutSectionLabel` → "تعارف") to stay consistent with established app vocabulary.

**Files:**

- Modify: `app-old/src/languages/Urdu.json`

**Interfaces:**

- Consumes: none (in-place value replacement, keys already exist)
- Produces: real Urdu values for the 15 keys below (no key additions/removals, no interpolation)

- [ ] **Step 1: Replace each value in place**

| Key                | Old value              | New value              |
| ------------------ | ---------------------- | ---------------------- |
| `hi`               | `"Salaam"`             | `"سلام"`               |
| `children`         | `"Children"`           | `"بچے"`                |
| `drinking`         | `"Drinking"`           | `"شراب نوشی"`          |
| `car`              | `"Car"`                | `"کار"`                |
| `business`         | `"Business"`           | `"کاروبار"`            |
| `pets`             | `"Pets"`               | `"پالتو جانور"`        |
| `house`            | `"House"`              | `"گھر"`                |
| `prayerLabel`      | `"Prayer"`             | `"نماز"`               |
| `hijabLabel`       | `"Hijab"`              | `"حجاب"`               |
| `beard`            | `"Beard"`              | `"داڑھی"`              |
| `smokingLabel`     | `"Smoking"`            | `"تمباکو نوشی"`        |
| `aboutView`        | `"About"`              | `"تعارف"`              |
| `lookingFor`       | `"Looking for"`        | `"تلاش"`               |
| `familyPlans`      | `"Family plans"`       | `"خاندانی منصوبے"`     |
| `marriageTimeline` | `"Marriage plans"`     | `"شادی کے منصوبے"`     |
| `openToRelocating` | `"Open to relocating"` | `"منتقلی کے لیے تیار"` |

For each row: find the line `"<key>": "<Old value>",` in `app-old/src/languages/Urdu.json` and replace with `"<key>": "<New value>",` — 16 individual single-line edits (table has 16 rows including `hi`).

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('app-old/src/languages/Urdu.json','utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 3: Verify no English residue remains on these keys**

Run:

```bash
node -e "
const en = require('./app-old/src/languages/English.json').translation;
const ur = require('./app-old/src/languages/Urdu.json').translation;
const keys = ['hi','children','drinking','car','business','pets','house','prayerLabel','hijabLabel','beard','smokingLabel','aboutView','lookingFor','familyPlans','marriageTimeline','openToRelocating'];
const stillIdentical = keys.filter(k => en[k] === ur[k]);
console.log('Still identical to English (expect empty):', stillIdentical);
"
```

Expected: `Still identical to English (expect empty): []`

- [ ] **Step 4: Commit**

```bash
cd app-old && git add src/languages/Urdu.json
git commit -m "fix(i18n): translate profile-attribute labels left as English copy"
```

---

### Task 6: Translate the silently-untranslated onboarding/gift-claim keys (7 keys)

**Context:** All 7 have live call sites in `OnboardingProfile.tsx` (intro phase) and `gift-claim-modal.tsx` (profile-completion reward modal), confirmed via direct usage search — safe to translate for real. **Important:** `giftClaimBody`'s call site (`gift-claim-modal.tsx:121`) passes `{ amount: giftCredits }` — current `English.json` dropped the `{{amount}}` placeholder (separate English-side bug, flagged to spawn as its own task, not fixed here), but Urdu should use the placeholder since the mechanism supports it and it's simply the more complete, correct string. Terminology: "free chats" → "مفت چیٹ کریڈٹس", matching the already-live `giftReadyBody` key ("مفت چیٹ کریڈٹس حاصل کرنے کے لیے ٹیپ کریں").

**Files:**

- Modify: `app-old/src/languages/Urdu.json`

**Interfaces:**

- Consumes: none (in-place value replacement)
- Produces: real Urdu values for 7 keys; `giftClaimBody` retains `{{amount}}` interpolation syntax verbatim

- [ ] **Step 1: Replace each value in place**

| Key                         | Old value                                                                          | New value                                                                                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onboardingIntroTitle`      | `"Let's Build Your Best Profile"`                                                  | `"آئیے آپ کی بہترین پروفائل بنائیں"`                                                                                                                                                                                                                             |
| `onboardingIntroCta`        | `"Let's Go"`                                                                       | `"چلیں"`                                                                                                                                                                                                                                                         |
| `onboardingIntroBody`       | (old English-matching text)                                                        | `"آپ کی شکل و صورت، طرزِ زندگی اور اقدار کے بارے میں چند مزید تفصیلات ہمیں ایسے ساتھی تلاش کرنے میں مدد دیتی ہیں جو واقعی آپ کے لیے موزوں ہوں۔ ہر سیکشن مکمل کریں اور ہم آپ کا شکریہ مفت چیٹ کریڈٹس سے ادا کریں گے — جو حقیقی گفتگو شروع کرنے کے لیے کافی ہیں۔"` |
| `onboardingIntroRewardChip` | `"Free chat credits when you finish"`                                              | `"مکمل کرنے پر مفت چیٹ کریڈٹس"`                                                                                                                                                                                                                                  |
| `giftClaimTitle`            | `"You've completed your profile!"`                                                 | `"آپ نے اپنا پروفائل مکمل کر لیا ہے!"`                                                                                                                                                                                                                           |
| `giftClaimBody`             | `"Claim {{amount}} free chat credits — our gift for finishing your full profile."` | `"اپنے {{amount}} مفت چیٹ کریڈٹس حاصل کریں — اپنی پروفائل مکمل کرنے پر ہماری طرف سے تحفہ۔"`                                                                                                                                                                      |
| `claimGift`                 | `"Claim Gift"`                                                                     | `"تحفہ حاصل کریں"`                                                                                                                                                                                                                                               |
| `maybeLater`                | `"Maybe Later"`                                                                    | `"شاید بعد میں"`                                                                                                                                                                                                                                                 |

(Table has 8 rows — `onboardingIntroTitle`, `onboardingIntroCta`, `onboardingIntroBody`, `onboardingIntroRewardChip`, `giftClaimTitle`, `giftClaimBody`, `claimGift`, `maybeLater`.) For `onboardingIntroBody`, read the current line first (`grep -n '"onboardingIntroBody"' app-old/src/languages/Urdu.json`) to get its exact current text for the old_string match — it's a stale English variant, not byte-identical to current English.json, so don't assume the exact wording without checking.

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('app-old/src/languages/Urdu.json','utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 3: Verify `{{amount}}` placeholder survived**

Run: `grep -n '"giftClaimBody"' app-old/src/languages/Urdu.json`
Expected: line contains literal `{{amount}}`

- [ ] **Step 4: Commit**

```bash
cd app-old && git add src/languages/Urdu.json
git commit -m "fix(i18n): translate onboarding-intro and gift-claim modal copy"
```

---

### Task 7: Flag confirmed-dead keys, leave guardian key untouched

**Context:** `recommendationAvailable` and `newRecommendation` have **zero live call sites** anywhere in `app-old/src` (confirmed via exhaustive search) — the actual "no more recommendations today" UI uses a different, already-correctly-translated key (`noRcommendedUserAvailable`). These two were superseded, not just unbuilt. Consistent with the existing `relation`/`selectRelation` precedent in this same file, flag rather than translate. `enterYourEmailLabel` needs no edit at all — confirmed separately (Task 1 doesn't cover it because it requires no action).

**Files:**

- Modify: `app-old/src/languages/Urdu.json`

**Interfaces:**

- Consumes: none
- Produces: `recommendationAvailable` and `newRecommendation` set to the literal string `not available`

- [ ] **Step 1: Replace both values**

| Key                       | Old value                                        | New value         |
| ------------------------- | ------------------------------------------------ | ----------------- |
| `recommendationAvailable` | `"Exclusive top picks"`                          | `"not available"` |
| `newRecommendation`       | `"The new recommendations will be available at"` | `"not available"` |

- [ ] **Step 2: Confirm `enterYourEmailLabel` is unchanged**

Run: `grep -n '"enterYourEmailLabel"' app-old/src/languages/Urdu.json`
Expected: `"enterYourEmailLabel": "Sign in as guardian",` — unchanged from before this plan started. Do not edit this line in this task or any other.

- [ ] **Step 3: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('app-old/src/languages/Urdu.json','utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 4: Commit**

```bash
cd app-old && git add src/languages/Urdu.json
git commit -m "chore(i18n): flag superseded recommendation keys as not-available, matching existing dead-key convention"
```

---

### Task 8: Delete the 2 orphaned Urdu-only keys

**Context:** `paymentOfDescription` and `basicInformation` exist only in `Urdu.json` — absent from `English.json`, `RomanUrdu.json`, and `Keys.tsx` (so no screen can reference them; `LanguageKeys` only exposes what's in `Keys.tsx`). Confirmed via `git log --all -S"<key>"`: introduced once in the very first migration commit (`da7500f`), never referenced by any commit since. Their values are exact duplicates of live keys (`basicSettings`, `makePaymentOf`) — safe to delete.

**Files:**

- Modify: `app-old/src/languages/Urdu.json`

**Interfaces:**

- Consumes: none
- Produces: `Urdu.json` with 2 fewer keys; `Object.keys(Urdu.json.translation).length` decreases by 2

- [ ] **Step 1: Remove both lines**

Delete these two lines entirely (including trailing comma/formatting) from `app-old/src/languages/Urdu.json`:

```json
    "paymentOfDescription": "کی پیمنٹ کریں۔",
```

```json
    "basicInformation": "بنیادی سیٹنگز",
```

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('app-old/src/languages/Urdu.json','utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 3: Confirm deletion and no orphans remain**

Run:

```bash
node -e "
const en = require('./app-old/src/languages/English.json').translation;
const ur = require('./app-old/src/languages/Urdu.json').translation;
const orphaned = Object.keys(ur).filter(k => !(k in en));
console.log('Remaining orphaned keys in Urdu (expect empty):', orphaned);
"
```

Expected: `Remaining orphaned keys in Urdu (expect empty): []`

- [ ] **Step 4: Commit**

```bash
cd app-old && git add src/languages/Urdu.json
git commit -m "chore(i18n): delete orphaned Urdu-only keys with no code references"
```

---

### Task 9: Update the eslint.config.mjs tracking comment

**Context:** `eslint.config.mjs`'s `i18n-json/sorted-keys`/`identical-keys` block carries a comment (landed via the separate `docs/i18n-tooling-cleanup` branch) stating "Urdu is missing 16 keys and has 2 English doesn't; RomanUrdu is missing 21 keys." After Tasks 2–8, that's no longer true for Urdu — only RomanUrdu remains drifted. Update the comment so it stays accurate; do not change the rule severity levels themselves (still `0` — re-enabling requires sorting English.json and reconciling RomanUrdu too, both explicitly out of scope here per that branch's own design spec §4).

**Files:**

- Modify: `app-old/eslint.config.mjs:164-171`

**Interfaces:**

- Consumes: none
- Produces: no behavior change (rule severities stay `0`), comment text only

- [ ] **Step 1: Update the comment**

Old:

```js
      // sorted-keys/identical-keys are OFF: English.json's keys aren't sorted
      // alphabetically yet, and Urdu/RomanUrdu already have drift vs English
      // (Urdu is missing 16 keys and has 2 English doesn't; RomanUrdu is
      // missing 21 keys). Sort English.json and reconcile the other two
      // locale files, then flip these back to 2 and point identical-keys at:
      //   filePath: path.resolve(__dirname, './src/languages/English.json')
      'i18n-json/sorted-keys': 0,
      'i18n-json/identical-keys': 0,
```

New:

```js
      // sorted-keys/identical-keys are OFF: English.json's keys aren't sorted
      // alphabetically yet, and RomanUrdu still has drift vs English (missing
      // 21 keys) — see docs/superpowers/plans/2026-07-15-urdu-i18n-completeness-audit.md
      // for the Urdu reconciliation this deferred (Urdu itself is now in sync,
      // as of that plan). Sort English.json and reconcile RomanUrdu, then flip
      // these back to 2 and point identical-keys at:
      //   filePath: path.resolve(__dirname, './src/languages/English.json')
      'i18n-json/sorted-keys': 0,
      'i18n-json/identical-keys': 0,
```

- [ ] **Step 2: Confirm lint config still loads**

Run: `cd app-old && yarn eslint --print-config src/languages/Urdu.json > /dev/null && echo "config OK"`
Expected: `config OK`

- [ ] **Step 3: Commit**

```bash
cd app-old && git add eslint.config.mjs
git commit -m "docs(lint): update i18n-json drift comment now that Urdu is reconciled"
```

---

### Task 10: Final verification

**Files:**

- Read-only

**Interfaces:**

- Consumes: final state of `Urdu.json` from Tasks 2–9

- [ ] **Step 1: Full parity re-check**

Run:

```bash
node -e "
const en = require('./app-old/src/languages/English.json').translation;
const ur = require('./app-old/src/languages/Urdu.json').translation;
const enKeys = Object.keys(en);
const missing = enKeys.filter(k => !(k in ur));
const orphaned = Object.keys(ur).filter(k => !(k in en));
function hasUrduScript(s) { return /[؀-ۿݐ-ݿ]/.test(s); }
const stillPlainEnglish = enKeys.filter(k => (k in ur) && en[k] === ur[k] && k !== 'enterYourEmailLabel');
console.log('Missing from Urdu:', missing);
console.log('Orphaned in Urdu:', orphaned);
console.log('Still byte-identical to English (excl. enterYourEmailLabel):', stillPlainEnglish);
"
```

Expected: `Missing from Urdu: []`, `Orphaned in Urdu: []`, `Still byte-identical to English (excl. enterYourEmailLabel): []`

- [ ] **Step 2: Run the project's lint check scoped to language files**

Run: `cd app-old && yarn eslint src/languages/Urdu.json`
Expected: no `valid-json` or `valid-message-syntax` errors (pre-existing unrelated errors elsewhere in the repo are not this task's concern)

- [ ] **Step 3: Run full check-all and compare against documented baseline**

Run: `cd app-old && yarn check-all`
Expected: no new failures introduced by this plan's changes (compare error/warning count against whatever `app-old/CLAUDE.md`'s Commands section currently documents — don't assume the historical "20 errors, 853 warnings" snapshot is current, re-read the file first per its own Known Issues note)

- [ ] **Step 4: Report out-of-scope findings**

No code change — surface these to the user rather than acting on them (already covered in the chat summary that accompanies this plan, repeated here so they're not lost if this plan is executed standalone in a fresh session):

- `English.json`'s `giftClaimBody` is missing the `{{amount}}` interpolation placeholder its only call site (`gift-claim-modal.tsx:121`) actually passes — confirmed real bug, English users never see the gift amount. Not fixed here (Urdu-scoped task); candidate for its own fix.
- `app-old/src/screens/profilePicture/components/guidelines-modal.tsx:123` hardcodes `text="Got it"` (literal string, wrong case/key) instead of `LanguageKeys.gotIt` — bypasses i18n entirely, will never localize even after this plan's `gotIt` translation lands. Separate code fix, not a translation fix.
- Orphaned guardian-login translation keys beyond `enterYourEmailLabel` (`enterYourEmailBelowLabel`, `guardianOtpDesription`, and likely more from the same deleted `src/screens/guardian/` tree) are real Urdu translations sitting dead in the schema — candidate for a batch cleanup as part of the broader tracked guardian-removal initiative, not this plan.
- `app-old/src/screens/tester/TesterScreenDirectory.tsx:106` has a stray debug-menu entry (`VerifyWaliCode`) pointing at a screen deleted in the same guardian-removal commit. Minor, dev-only.
- The `"image"` key duplication bug (21 near-identical dead entries per locale file) and `refundPolicyDesc`'s Lorem-Ipsum placeholder content are **already independently flagged and spawned as background tasks** per `docs/superpowers/specs/2026-07-15-i18n-docs-tooling-design.md` §4 on the `docs/i18n-tooling-cleanup` branch — do not re-flag or re-spawn these.
