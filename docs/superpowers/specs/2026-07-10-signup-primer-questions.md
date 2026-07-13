# Welcome Questionnaire — Female & Male Flows (CANONICAL LIST) — REVIEW & EDIT ME

**This file is the human source of truth for the two welcome journeys.** The questions
below are yours (2026-07-10); I've added the metadata each one needs to be built:
control type, **visibility (public = shown on profile / private = never shown)**, and
**maps-to** (an existing profile field, the JSON blob, and/or the match-count filter).

Supersedes the earlier lean draft. Companion: `2026-07-10-signup-primer-design.md`.

---

## 0. Data-handling principles (please read)

**Public vs private.** Some answers become the person's **profile summary** (caste,
priorities, what they offer, the one-liner). Others are **private** — used only to warm the
tone and, where helpful, show a supportive line. Private answers are **never shown to other
users, never used to rank or match.** Marked per-question below.

**Storage.** All answers are stored on the user's `user_details` as a new JSON column
`intro_answers` (structured, versioned). A few also mirror into existing structured columns
so search/filters keep working: caste → `caste`, "does caste matter" → `caste_restriction`,
the one-liner → `about_you`. From the **public** parts we generate a **profile summary
blurb** (stored + editable).

**Empathy.** The tone (especially the female flow, and extra warmth for the "tired of the
rishta process" / "worried about age" states) is dignifying and hopeful — never scarcity,
pressure, or judgement. The private check-in exists to _acknowledge_ what's hard, then
reassure — not to diagnose.

**Match count** (the "we found X" reveal) uses only: opposite gender · same country · age
±10. The rich preference answers personalise and pre-fill — they do **not** shrink the
headline number (per your F decision).

Legend — Vis: 🟢 public (on profile) · 🔒 private · ⚪ neutral (drives count/prefill only).

---

## 0.5 Interaction & instrumentation (build behaviours)

- **Auto-advance single-selects.** Any radio-style single-select screen (gender, stage,
  status, caste-matters, deen, sect…) advances on tap — **no Continue button**. Multi-select
  / free-text / slider screens keep Continue. This is the single biggest perceived-length win
  — the flow feels like a conversation, not a form.
- **One global progress bar.** A single thin bar across the _whole_ journey (0→100% over all
  steps) in the header, so the end never feels unknowable — abandonment mid-quiz mostly
  happens when it does. The in-question "x/4" chips are secondary.
- **Per-screen drop-off analytics, from day one.** Fire `screen_view` + `screen_completed` /
  `screen_skipped` for every step (PII-free). Then cut/merge on **data, not opinion**: if a
  screen bleeds ~15% while others bleed ~3%, fix that screen — not the whole flow.
  **Hypothesis to watch:** the _identity cluster_ (status → caste → deen → sect — four
  factual screens in a row before any emotional hook). **If the data confirms it, move F3's
  empathy screen earlier** to break up that stretch. Do NOT reorder pre-emptively —
  instrument first.

---

## 1. Shared first question

| Q   | Copy                            | Control | Options     | Vis | Maps to                                      |
| --- | ------------------------------- | ------- | ----------- | --- | -------------------------------------------- |
| S1  | "Let's start with you. I am a…" | 2 tiles | Woman · Man | ⚪  | `users.gender` (prefill) + forks the journey |

---

## 2. FEMALE FLOW (looking for a husband)

Intro: _"Let's find someone who's serious about you — respectfully, with your family
involved."_

### F1 — "Where are you in this journey?" · single select · 🔒 private (tone)

- Just starting out
- Searching for a while
- Honestly tired of the rishta process
- My family is searching for me

→ `intro_answers.journey_stage`. Drives the warmth of the copy + reveal line. Never shown.

### F1b — "What's your current status?" · single select · 🟢 public

- Single (never married)
- Divorced
- Widowed

→ existing `user_details.maritial_status_id`. Prefill + matching; shown on profile.
_(Note: `maritial_status_id` is the REAL, existing column — it is misspelled in the live
schema. Keep the misspelling in every mapping; "correcting" it to `marital_status_id` points
at a non-existent column and breaks the integration. Fixing the schema typo is a separate,
app-wide migration — out of scope here.)_

**Advanced (both flows) — "Open to another marriage"** · optional toggle behind an "Advanced"
expander on this screen (NOT a status option) → `user_details.open_for_polygamy`. Moved out
of status per direction — openness to polygamy is a preference, not a current status.

**Polygamy disclosure — BUILD REQUIREMENTS (the whole point of splitting it out — do NOT skip):**

1. **Profile badge:** when `open_for_polygamy = true`, his profile card shows an explicit
   "Open to another marriage" badge, visible to women browsing / matching.
2. **Female-side filter:** the F5 non-negotiable **"He isn't looking for a second wife"**
   excludes `open_for_polygamy = true` profiles from her results (and/or a dedicated filter
   setting). Without this filter, splitting the flag out achieves nothing.

### F2 — "Your Khandan / Caste" (+ preference) · ONE screen · 🟢 public

- Khandan: free-text input (e.g. "Rajput", "Syed"), skippable with **"Prefer not to say"** →
  `user_details.caste`. **Always captured** (bug fix — otherwise silently excluded from a
  partner's "must be same caste" filter).
- Inline below: "Does it matter in your match?" — Yes / No → `user_details.caste_restriction`.

Merged onto one screen (like F-SECT) — removes the only place two consecutive screens asked
the same topic, and saves a screen per journey.

### F-DEEN — "Your relationship with deen" · single-select + a separate checkbox · 🟢 public · skippable

Practice (single-select): I pray 5 times a day · I pray sometimes · Working on it · **Prefer
not to say**.

**Separate checkbox, independent of the practice answer:** ☑ "I'm a revert Muslim" →
`user_details.is_new_muslim`. **BUG FIX:** it must NOT be a fourth radio option — a revert
who prays 5× a day needs to select _both_. (Matches the male "Revert Muslim sisters"
openness, which otherwise filters against nothing.)

→ `user_details.islamic_practice_level_id` / `prayers_punctuality_id`. Needed so F4 "Strong
deen & character" has a real fact to match against.

### F-SECT — "Your sect" · single select + preference · 🟢 public · skippable

- Sunni · Shia · Other · Prefer not to say
- Inline: "Prefer the same sect?" — Yes / No

→ `user_details.sect_id` (own sect, always capturable) + a sect-preference. Same
silent-exclusion fix as caste — capture the fact so Sunni/Shia filters actually work.

### F3 — "What's been weighing on you? Tick everything that's true — this stays private." · multi-select · 🔒 PRIVATE

- Pressure from family/relatives
- Worried about my age
- Tired of the rishta process
- Worried about my career after marriage
- I need strict privacy

(Self-critical body-image options removed — they clash with the app's empathy promise. Keep
the "Only you can see this" badge. "Strict privacy" also surfaces the app's private-photo
controls.)

→ `intro_answers.concerns` (private). Used ONLY for tone + a reassuring line (e.g. "photos
are always under your control"). **Never shown, never ranked.**

_(Mood check-in removed — redundant with the F3 "weighing on you" question above.)_

### F4 — "What matters most in him? Pick your top 4." · multi-select (max 4) · 🟢 public

_Supportive line: "Knowing what you want is a strength — choose freely."_

- Strong deen & character · Good-looking, takes care of himself · Tall · Financially settled ·
  Respected family background · Well educated · Respects my career and goals · Kind to the
  women in his life · Emotionally mature

→ `intro_answers.partner_priorities`. Shown on profile as "What she values".

### F5 — "Any of these non-negotiable for you?" · multi-select · 🟢 public

_Supportive line: "Your standards protect you — never apologise for them."_
_After selecting (appreciation): "Knowing your worth is beautiful — the right man will honour every one of these."_

- Absolutely no smoking · No drinking · **He isn't looking for a second wife** (excludes
  `open_for_polygamy` men) · Separate home from in-laws · I'll continue working after
  marriage · Must be settled in/near my city · No dealbreakers — I'm flexible

→ `intro_answers.dealbreakers` (habit dealbreakers also map toward `smoking_id` /
`drinking_id` preferences). Wali option removed per direction.

### F6 — "His work situation — what suits you?" · multi-select · 🟢 public

- Business owner · Salaried professional · Government job · Settled overseas · No
  preference, character first

→ `intro_answers.preferred_work`.

### F-AGE — "What age range are you hoping for in him?" · dual slider · 🟢 public / ⚪ count

- Age range: [slider — e.g. 25–40]

→ `intro_answers.partner_age {min,max}` **and the match-count age filter** (gender · same
country · this range ±buffer). Keeps a woman's number age-tailored like the men's.

### F7 — "Anything else you'd like to add?" · free text · 🟢 public · optional

Placeholder (greyed example): _"e.g. Someone honest, attentive, and family-oriented."_
→ `user_details.about_partner` + `intro_answers.note`. Open catch-all — she can describe
herself or what she's hoping for. Text only.

### F-ME — "What's wonderful about you?" · multi-select · 🟢 public · self-confidence

_Affirming response after selecting: "Masha'Allah — you sound like a wonderful woman. Any
good man would be lucky."_

- Kind and caring · Family-oriented · Well educated · Ambitious and hardworking · Good sense
  of humour · Practising in my deen · Honest and loyal · Independent

→ `intro_answers.strengths` (public) + feeds `about_you` / the profile summary. A self-praise,
confidence-boosting moment right before the reveal.

---

## 3. MALE FLOW (looking for a wife)

Intro: _"Let's find someone you can build a life with — sincerely, with families involved."_

### M1 — "What best describes you right now?" · single select · 🔒 private (tone)

- Ready to marry now
- It's getting late — I really want to settle down
- Keen to marry and guard my deen (stay away from haram)
- Been searching for a while

→ `intro_answers.journey_stage`. Drives tone. Never shown. (The another-marriage case now
lives in M1b, not here.)

### M1b — "What's your current status?" · single select · 🟢 public

- Single (never married)
- Divorced
- Widowed

→ existing `user_details.maritial_status_id`. Prefill + matching. Widowed restored; the "open
to another marriage" polygamy toggle is the shared **Advanced** flag described under F1b
(`open_for_polygamy`, shown on profile, filterable by women).

### M2 — "Your Khandan / Caste" (+ preference) · ONE screen · 🟢 public

- Same as F2: free-text khandan (skippable / "Prefer not to say") → `caste`, plus inline
  "Does it matter?" Yes / No → `caste_restriction`. Always captured.

> **Wizard note:** the step engine still needs light conditional support for skippable steps
> and the "Advanced" polygamy toggle, so keep it generic.

### M-DEEN — "Your relationship with deen" · single select · 🟢 public · skippable

- I pray 5 times a day
- I pray sometimes
- Working on it
- Prefer not to say

→ `user_details.islamic_practice_level_id` / `prayers_punctuality_id`. Needed so M4
"Practising deen and modesty" has a real fact to match against.

### M-SECT — "Your sect" · single select + preference · 🟢 public · skippable

- (same Sunni / Shia / Other / Prefer not to say + "Prefer the same sect?" as F-SECT) →
  `user_details.sect_id` + sect-preference.

### M3 — "Be honest — what's been the hardest part? Tick all that apply." · multi-select · 🔒 PRIVATE

- Hard to find someone I'm genuinely attracted to
- Hard to find someone younger, as I'd hoped
- Haven't found someone truly compatible
- Hard to find someone who practises like I do
- Still moving on from a past relationship
- Worried time is passing

→ `intro_answers.concerns` (private). Tone only. Never shown. (Candid male pain-points —
attraction / age / compatibility — kept private so honesty is safe; only warms the tone.)

_(Mood check-in removed — redundant with the M3 "hardest part" question above.)_

### M4 — "What matters most in her? Pick your top 4." · multi-select (max 4) · 🔒 PRIVATE / matching-only

- Beautiful / attractive _(beauty)_
- Youthful and full of life _(age)_
- Warm, well-mannered nature _(behaviour)_
- Easy-going and fun to be with _(coolness)_
- Practising deen and modesty
- Honest and loyal
- Family-oriented
- Career-minded is a plus

→ `intro_answers.partner_priorities`. **Visibility: PRIVATE / matching-only (confirmed)** —
used for matching + personalization, NOT shown on his public profile. His public summary
leans on M6 (what he offers) + his one-liner. The female F4 ("what she values") stays
🟢 public (flattering).

### M5 — "Her background — what are you open to?" · multi-select · 🟢 public

- Same city · Anywhere in Pakistan · Settled overseas · Open to other nationalities · Revert
  Muslim sisters · Open to all

→ `intro_answers.partner_openness`.

### M-AGE — "What age range are you hoping for in her?" · dual slider · 🟢 public / ⚪ count

- Age range: [slider — e.g. 23–32]

→ `intro_answers.partner_age {min,max}` **and the match-count age filter**. Split out of M5
into its own question per direction, mirroring the female F-AGE.

### M-WORK — "Tell us about your work" · single-select + optional income · profession 🟢 public / income 🔒 private

- Business owner · Self-employed · Salaried professional · Government job · Settled overseas
- (optional) Monthly income: a range

→ `user_details.profession_id` / `have_business` (public) + `earnings_per_month_id`
(**private matching signal — never shown as an exact figure**). Helper line under income:
_"Shared as a range only, never an exact figure."_ (Removed the "ahead of many" flattery —
income is a private matching input, not a bragging point.)

### M-HABITS — "A couple of quick facts" · two toggles · 🟢 public · required

- Do you smoke? — No · Occasionally · Yes
- Do you drink? — No · Occasionally · Yes

→ `user_details.smoking_id` / `drinking_id`. **Required** — F5 lets a woman filter
"absolutely no smoking / no drinking", so we need the male-side fact to match against.
(Consider a matching female-side habits fact if women's habits should also be filterable.)

### M6 — "What can you offer her? Tick all that apply — this shows on your profile." · multi-select · 🟢 public

_Appreciation line — **BUILD RULE: render conditionally.** Show it ONLY if he ticked at least
one genuinely generous offer (separate home / she can continue her career / simple nikah).
Suppress it entirely otherwise — never render it statically, or it fires as empty flattery
for a man who ticked nothing: "Masha'Allah — offering this much is rare these days. A woman
will value a man who brings this."_

- Separate home · Living with my parents (joint family) · She can continue her career · Based
  abroad / relocating · Simple nikah, no heavy demands · Financially independent

→ `intro_answers.offerings`. The heart of his profile summary.

### M-ME — "What makes you a great husband?" · multi-select · 🟢 public · self-confidence

_Affirming response after selecting: "Masha'Allah — you've got a lot to offer. She'll see
it."_

- Caring and supportive · Hardworking and ambitious · Family-oriented · Well educated · Good
  sense of humour · Practising in my deen · Honest and loyal · Financially responsible

→ `intro_answers.strengths` (public) + `about_you` / profile summary. Self-praise before the
reveal (mirrors the female F-ME).

---

## 4. JSON storage shape (`user_details.intro_answers`)

```json
{
  "version": 1,
  "flow": "female",
  "journey_stage": "tired_of_rishta", // private
  "concerns": ["age", "judged_looks"], // private
  "caste": "Rajput", // + mirrored to user_details.caste
  "caste_matters": "prefer_same", // + mirrored to caste_restriction
  "partner_priorities": ["deen", "family_bg", "career_respect", "kind"],
  "dealbreakers": ["separate_home", "wali_in_chats"],
  "preferred_work": ["salaried", "overseas"], // female
  "partner_openness": ["same_city", "revert"], // male
  "partner_age": { "min": 25, "max": 34 }, // male
  "offerings": ["separate_home", "support_career"], // male
  "one_liner": "…" // + mirrored to about_you
}
```

Private keys (`journey_stage`, `concerns`) are returned ONLY to the owner, never in
public/other-user profile responses.

## 5. Profile summary (generated from 🟢 public keys)

Auto-composed, then editable by the user. Examples:

- **Female:** _"Rajput · Values strong deen, a respected family, kindness, and someone who
  respects her goals · Non-negotiables: her own home, and a wali present in chats · Prefers
  a settled professional."_
- **Male:** _"Ready to marry now · Looking for a caring, practising partner · Offers a
  separate home, support for her career, and a simple nikah."_

Stored as `user_details.intro_summary` (string) so it's cheap to render and the user can
tweak the wording.

## 6. Reuse of existing profile fields (so search/filters keep working)

| Answer                      | Existing column                                                        | Notes                           |
| --------------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| Caste (F2/M2)               | `user_details.caste`                                                   | free-text column already exists |
| Does caste matter (F2b/M2b) | `user_details.caste_restriction`                                       | already exists                  |
| One-liner (F7)              | `user_details.about_you`                                               | already exists                  |
| Everything else             | `user_details.intro_answers` (NEW json) + `intro_summary` (NEW string) | new columns                     |

## 7. Status of decisions

**Resolved (locked 2026-07-10):**

- Placement: **pre-signup capture → commit after auth** (answers held in MMKV, written to
  the account once authenticated).
- This flow **leads**; Part 1's ME wizard follows, **trimmed** (caste removed).
- **No voice note** — F7 is text only.
- Match count: **live DB count** with the user's own filters; gender · same country · age ±10
  (from F-AGE / M-AGE). **If count < 50 → founding-member copy** ("Be among the first — early
  members get priority matching"), never a fabricated number. Country shown **dynamically
  from the Location screen**.
- **Matching-fact integrity:** every filter now has a self-fact to match against — caste
  (F2b/M2b, always captured), sect (F-SECT/M-SECT), deen (F-DEEN/M-DEEN), smoking/drinking
  (M-HABITS), revert (F-DEEN toggle), polygamy (Advanced flag). No more silent exclusions.
- **Part 1 OnboardingProfile:** remove the weight slider (contradicts F3's empathy promise);
  keep height, replace weight with an optional body-type descriptor incl. "Prefer not to say."
- **Admin controls:** staff can enable/disable the pre-signup and post-signup question
  phases via settings flags, and **preview** these question lists in a read-only admin page
  (see the design spec's "Admin controls & flow preview").
- **Gender asked once:** S1 sets `users.gender`; the later UserInput gender field is
  **skipped when gender is already set** (shown only as a fallback if the welcome flow was
  skipped / flag off / social edge case). Gender stays required.
- **Caste is conditional:** ask "does caste matter?" first (F2/M2 → `caste_restriction`);
  the khandan picker (F2b/M2b) shows only if it's not "Doesn't matter". First branching
  question — the wizard's step engine must support conditional steps generically.

**Also resolved:** F4 (female "what she values") 🟢 public; M4 (male priorities) 🔒
private/matching-only. Mood check-in (F3b/M3b) signposts real support on a hard answer. M1
"second marriage" → handled by M1b (maps to `maritial_status_id` + `open_for_polygamy`).

**Still to confirm from you:**

- **Caste list:** confirm/extend the bundled biradari list (app-side; no DB table).
- **Support resource:** which helpline / link to show on a serious-distress answer.
