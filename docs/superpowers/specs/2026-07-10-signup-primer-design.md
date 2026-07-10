# Part 2 — First-Install Personalization Primer + Match-Count Reveal (Design Spec)

**Status:** PROPOSAL for review. Nothing built. Drafted overnight 2026-07-10 while the
product owner was away, so all product decisions are captured as **Decision Points**
(§10) with a recommended default. Approve/adjust those before we execute the plans.

**Goal:** A short, warm pre-signup moment (2–3 questions) shown on first install that
makes the user feel understood and ends on a real, outcome-based "**We found _X_
matches for you**" reveal — to lift signup conversion. Framing is gender-differentiated
(men and women value different things).

**Scope:** Frontend-led (a pre-auth primer flow in `app-old`) plus a small **public**
backend endpoint in `admin` that returns a real match count. Companion plans:

- `admin/docs/superpowers/plans/2026-07-10-signup-primer-backend.md`
- `app-old/docs/superpowers/plans/2026-07-10-signup-primer-frontend.md`

---

## DECISIONS LOCKED (2026-07-10) — supersedes the proposal sections below

The design below was the initial proposal; the product owner has since made the calls
here. Where they conflict, THIS section wins. The canonical questions, flow, per-question
visibility, and storage shape live in **`2026-07-10-signup-primer-questions.md`**.

- **Two gendered journeys** (female / male), full question inventory in the questions file.
- **Placement — pre-signup capture, post-auth commit.** All questions are asked while the
  user is anonymous (first install). Answers are held in MMKV and **committed to the account
  immediately after authentication succeeds** (write `intro_answers` JSON + mirrored
  columns + generated summary). Accepted risk: abandoning signup before auth loses answers.
- **This flow leads; Part 1 follows, trimmed.** The welcome questionnaire is the front of
  onboarding. Part 1's `OnboardingProfile` ME wizard runs afterward, with the small overlap
  (caste) removed. The two are mostly complementary (this = partner preferences + offerings;
  Part 1 = self attributes).
- **Storage.** New `user_details.intro_answers` (JSON) + `user_details.intro_summary`
  (string, editable). Caste → `caste`, "does caste matter" → `caste_restriction`, one-liner
  → `about_you` (existing columns). Private keys (`journey_stage`, `concerns`) are returned
  only to the owner — never on public/other-user profile responses, never used to rank.
- **Match count reveal — exact number, no floor.** Criteria = opposite gender · same
  country (from device region) · age ±10. The rich preference answers personalise and
  pre-fill; they do **not** shrink the headline number.
- **Feature flag** `show_signup_primer` default **off**. **Delete** the orphan
  `SignupStepInput`/`SignupStepRadio` screens. **No voice note** (text one-liner only). **No
  location question** (country inferred from device region).
- **Female age:** the female flow gains a light "his age range" question (age slider), so a
  woman's count is age-tailored too (gender · same country · her chosen range ±buffer).

### Admin controls & flow preview (locked 2026-07-10)

- **Phase toggles (settings flags).** Staff enable/disable each onboarding phase
  independently; the app reads these on boot via the public `GET v1/app/settings`:
  - `enable_presignup_questions` — the pre-signup welcome questionnaire (default **off**).
  - `enable_postsignup_questions` — the post-signup additional questions / Part 1 `Onboarding
Profile` ME wizard (default **on**). Part 1's flow gate checks this flag.
  - `enable_match_count_reveal` — the "we found X" reveal (default **off**).
    Each is a `Setting` row (`type=boolean`, seeded by migration) editable from the admin
    settings screen. (This replaces the single `show_signup_primer` flag from the proposal.)
- **Question preview page (admin).** A read-only admin page renders the full signup flow
  order plus both question inventories (female + male, hard-coded text) so staff can see and
  debug the entire flow at a glance. The canonical source stays the questions file
  (`2026-07-10-signup-primer-questions.md`); the admin page and the RN app both mirror it —
  kept in sync by hand for now (a shared JSON manifest is a future improvement to remove
  drift). New admin route + blade view under the general/settings area.

Below this line is the original proposal, kept for context; treat it as superseded where it
differs from the above and from the questions file.

---

## 1. Why this exists (product intent)

This is "Part 2" of the signup revamp. Part 1 (onboarding profile-building + chat-credit
rewards) enriches the profile **after** the core signup. Part 2 sits **before** signup:
the first thing a fresh install sees. Its two jobs:

1. **Feel personalized.** A couple of friendly questions ("who are you", "who are you
   hoping to meet") signal that the app is about _them_, not a generic form.
2. **Outcome-based motivation.** End on a concrete, real number — "There are 1,240
   people here who match what you're looking for" — so the value is felt _before_ the
   friction of creating an account. This is the single highest-leverage conversion moment.

Gender-differentiated tone (see §6): women tend to respond to safety, seriousness, and
the guardian/wali model; men tend to respond to reach and quantity. Same flow, different
microcopy and which supporting stat we lead with.

## 2. Honesty constraint (important)

Pre-auth, the user is anonymous — we do **not** know their own attributes, only their
stated preferences. So the reveal must say "**profiles that match what you're looking
for**", never "matches _for you_" in a way that implies mutual matching. The number is
real (a live count from the DB), but the copy must not over-promise. This is a hard
content rule, not a decision point.

## 3. Where it slots into the flow

Today (not-logged-in path), the root stack starts at `AuthWelcome` and never inserts
anything before it (`RootNavigation.tsx:77`, initial-route logic `82-125`). The primer
becomes the **first screen** for a not-logged-in, first-install user:

```
Cold start
  → [Primer]  (only if: not logged in AND feature-flag on AND not seen before)
      → questions → match-count reveal → "Create your account"
  → AuthWelcome ("Get started")  → PhoneNumber/Otp or social
  → Location → UserInput → OnboardingProfile → ProfilePicture → … → BottomTab
```

Gating (all three must hold to show it):

- **Not logged in** — `IS_LOGGED_IN` falsy (returning users are already routed by
  `getUserData`; we only touch the untouched not-logged-in default).
- **Feature flag on** — new setting `show_signup_primer` (see §7).
- **Not seen before** — new MMKV first-run flag `PRIMER_SEEN` (no such flag exists
  today; nearest precedent is `ratingEngagement.ts`'s write-once `rating.firstOpenAt`).

The primer always offers a **Skip** ("Maybe later") that sets `PRIMER_SEEN` and goes to
`AuthWelcome`, so it can never trap a user. Completing the reveal's CTA does the same
(set `PRIMER_SEEN` → `AuthWelcome`).

## 4. The questions (recommended v1)

Three quick, low-friction steps. Each maps directly to a filter the backend count needs.

| #   | Question                                     | Control                                      | Maps to                                    |
| --- | -------------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| 1   | "First, tell us about you — I am a…"         | two large tiles: **Man** / **Woman**         | `seeking` = opposite gender                |
| 2   | "Who are you hoping to meet? Preferred age…" | dual-thumb range slider (18–60) or age bands | `min_age` / `max_age`                      |
| 3   | "Where should we look?"                      | **Near me** (requests GPS) / **Anywhere**    | `latitude`/`longitude` + `radius`, or none |

Design notes:

- **Q1 gender** is the pivot: it flips the search to the opposite gender **and** selects
  the gender-differentiated copy for the rest of the flow. It's also the single most
  valuable value to carry forward (it drives signup branching — male-only ProfilePicture,
  female → AddWali).
- **Q3 location is optional and honest.** "Near me" requests the OS location permission
  (reusing the geolocation path already in `Location.tsx`); if granted we send lat/long +
  a radius and the reveal says "within ~100 km of you". If denied or "Anywhere", we send
  no location and the reveal says "across the country". Requesting GPS is deferred to an
  explicit tap (not auto-prompted on screen 1) to keep first-run friction low.
- **We deliberately do NOT ask education/earnings in v1.** Those are ULID attribute ids
  that only exist behind the **auth-only** `list/attribute` endpoint; asking them pre-auth
  would require a new public options endpoint and add friction for a marginal reveal gain.
  Deferring them keeps v1 lean. (Richer reveal is Decision Point D.)

## 5. The reveal

A single celebratory screen:

- **Hero number** — "We found **1,240** people who match what you're looking for."
  (Real count from the API, rounded and floored — see §8.)
- **Up to two supporting chips**, derived from the same filtered pool by the API so they
  cost no extra round-trips:
  - the age line — "aged {min}–{max}"
  - the location line — "within ~100 km of you" / "across the country"
- **Gender-led framing line** (§6).
- **Primary CTA** — "Create your account to meet them" → sets `PRIMER_SEEN` →
  `AuthWelcome`.
- **Graceful degradation** — if the count API fails or the flag/endpoint isn't deployed,
  the reveal shows an encouraging _number-free_ message ("There's a community waiting —
  let's set up your profile") and continues. The primer must never dead-end on a network
  error.

## 6. Gender-differentiated copy (illustrative, final copy at build)

| Moment           | Woman selected                                                                                  | Man selected                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Intro subtitle   | "A calmer, more respectful way to meet someone serious."                                        | "Meet genuine people ready for something real."                      |
| Reveal lead line | "{X} respectful, serious members match your preferences — and every step is guardian-friendly." | "{X} members match what you're looking for. Start connecting today." |
| CTA              | "Create your account"                                                                           | "Create your account"                                                |

All strings go through i18n (`t()`), added to `Keys.tsx` + all three locale JSONs
(English, Urdu, RomanUrdu), per the repo rule. (Part 1's copy was left English-only on a
screen that already worked that way; the primer is net-new, so we localise it properly.)

## 7. Backend: the match-count API

New **public** endpoint (no auth token — it runs before signup):

```
GET /api/v1/app/public/match-count
  ?seeking=male|female              (required)
  &min_age=INT&max_age=INT          (optional, 18–99)
  &latitude=FLOAT&longitude=FLOAT   (optional pair)
  &radius=INT                       (optional km, default 500 when lat/long present)
```

Response (existing `ResponseAPI` envelope):

```json
{
  "message": "...",
  "error": false,
  "code": 200,
  "results": {
    "count": 1240,
    "raw_count": 1187,
    "age": { "min": 25, "max": 35 },
    "scope": "nearby|nationwide"
  }
}
```

**Query** reuses the recommend-list eligibility gates (`UserService::getRecommendUser`
scopes) but keyed off the supplied `seeking` gender directly:

- `where('gender', $seeking)`
- `whereNull('banned_at')` (`scopeUnBanned`)
- `where('is_approved', true)` (`scopeIsProfileCompleted`)
- soft-delete global scope (automatic)
- `where('search_visibility', true)` — include this so we only count discoverable
  profiles (more honest than the raw recommend query, which omits it)
- if `min_age`/`max_age`: `scopeAge` (`TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE())
BETWEEN ? AND ?`)
- if lat/long: `scopeWithInRadius($lat,$lng,$radius)` (haversine `<= radius`) + lat/long
  `IS NOT NULL`

Then `->count()` (not `->paginate()`). No PII is returned — only aggregate numbers.

**Abuse/rate limiting:** define a dedicated named limiter (e.g. `match_count`,
~20/min by IP) in `RouteServiceProvider::configureRateLimiting()` and attach
`throttle:match_count` to the route, so this public endpoint has its own bucket separate
from the shared authenticated `api` 60/min. Validation via a `MatchCountRequest extends
BaseRequest` for consistent 422s.

**Feature flag:** a new boolean setting `show_signup_primer` seeded via a migration
(copying `2026_07_10_000002_add_skip_signup_membership_paywall_setting.php`). Because
`is_active=1`, it's automatically returned by the existing public `GET v1/app/settings`
endpoint — no settings-controller change. **Recommended default: `false`** (off) so
shipping the app before the endpoint is live can't surface a broken primer; flip it on
from the admin once backend is deployed and copy is approved.

## 8. Privacy / "always feels good" number handling

The displayed number is shaped so it never discourages:

- **Round** to a friendly figure (e.g. nearest 10 below 1k, nearest 100 above).
- **Floor** small counts: below a threshold (e.g. 50) show a range or "50+" rather than a
  precise tiny/zero number — a fresh region shouldn't read "3 matches". Exact policy is
  Decision Point F.
- The API returns both `count` (display-shaped) and `raw_count` (unshaped) so the app can
  choose, and so we can tune shaping server-side without an app release.

## 9. Persistence & carry-forward

- **`PRIMER_SEEN`** (new MMKV string key) — set on completion or skip; gates re-display.
- **`PRIMER_ANSWERS`** (new MMKV key, JSON) — `{ gender, minAge, maxAge, lat, lng }`.
  Used purely as **UI prefill defaults** for the real signup:
  - gender → prefill UserInput's gender picker (`UserInput.tsx` `initializeUserData`).
  - lat/lng → nothing authoritative (Location derives its own from GPS at signup), but can
    seed a friendlier Location prompt.
    Server remains source of truth: `onVerified`/`onLoggedIn` re-fetch and overwrite, so
    primer answers are never committed to the backend directly — only surfaced as defaults
    the user confirms during the real signup steps.

## 10. Decision Points (please review)

| #   | Decision                        | Options                                                                                                                 | Recommended                                                                       |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A   | Question set                    | (a) gender + age + location (3), (b) add a 4th "what matters most" preference, (c) gender + age only (2)                | **(a)** — 3 questions, best feel-vs-friction                                      |
| B   | Location pre-auth               | (a) "Near me" (GPS on tap) / "Anywhere" toggle, (b) always request GPS up front, (c) skip location entirely             | **(a)** — honest + low friction                                                   |
| C   | Reveal richness                 | (a) hero number + age/location chips, (b) hero number only, (c) number + demographic breakdown                          | **(a)**                                                                           |
| D   | Education/earnings in the count | (a) exclude in v1, (b) include (needs a new **public options endpoint** + extra questions)                              | **(a)** — defer                                                                   |
| E   | Feature-flag default            | (a) off (`false`), (b) on (`true`)                                                                                      | **(a)** off — safe staged rollout                                                 |
| F   | Small/zero count policy         | (a) show "50+" floor, (b) show a range, (c) show honest exact number                                                    | **(a)**                                                                           |
| G   | Orphan screens                  | (a) delete `SignupStepInput`/`SignupStepRadio` (unused prototypes) and build fresh, (b) generalize them into the primer | **(a)** delete + build a clean data-driven wizard; reuse only their visual tokens |
| H   | Radius for "Near me"            | value in km (backend default 500)                                                                                       | **~100 km** for the reveal's "near you" framing; keep 500 as fallback             |

## 11. Components & files (overview; exact steps in the plans)

**Backend (`admin`):**

- `routes/api.php` — new public route `public/match-count` above the `auth:api_user`
  group, with `throttle:match_count`.
- `app/Http/Controllers/Api/PublicController.php` (new) — `matchCount(MatchCountRequest)`.
- `app/Http/Requests/Api/MatchCountRequest.php` (new, extends `BaseRequest`).
- `app/Http/Services/Users/UserService.php` — new `countMatches(array $filters): int`
  (or a small `MatchCountService`) reusing the recommend scopes.
- `app/Providers/RouteServiceProvider.php` — new `match_count` rate limiter.
- `database/migrations/2026_07_10_xxxxxx_add_show_signup_primer_setting.php` (new).

**Frontend (`app-old`):**

- `src/screens/signupPrimer/` (new) — a data-driven step wizard + reveal (generalize the
  orphan step visuals; reuse the Part-1 design tokens: `appBg`, `ink`, `primary`,
  `lavender`).
- `src/services/storageManager/StorageManager.tsx` — add `PRIMER_SEEN`, `PRIMER_ANSWERS`.
- `src/stores/settings-store.ts` — add `getShowSignupPrimer()` (default false).
- `src/navigation/RootNavigation.tsx` — register `SignupPrimer`; branch the not-logged-in
  initial route to it when enabled + unseen.
- `src/services/api/Services.tsx` + endpoints — `getMatchCount(params)`.
- `src/languages/{Keys.tsx,English.json,Urdu.json,RomanUrdu.json}` — primer + reveal keys.
- Delete `src/screens/signup-step-input/`, `src/screens/signup-step-radio/` and their
  route registrations (Decision G).
- Prefill hook-in at `src/screens/userInput/UserInput.tsx` (gender default).

## 12. Testing strategy

- **Backend:** unit-test `countMatches` filter logic (gender/age/radius/eligibility) with
  a seeded set; feature-test the public route (200 shape, 422 on bad `seeking`, throttle
  headers). Same local-DB caveat as Part 1 — author tests, run once a test DB exists (do
  **not** run against staging).
- **Frontend:** pure-logic unit tests for the number-shaping helper and the
  primer-gating resolver (`shouldShowPrimer({loggedIn, enabled, seen})`), which run under
  the working jest setup. `yarn type-check` + eslint as the automated gate (RN component
  tests remain broken). On-device walkthrough for the flow + graceful-degradation.

## 13. Rollout order (once approved)

1. Backend: endpoint + limiter + `show_signup_primer` seed → deploy to staging (migrate +
   `config:clear` on the server). Flag stays **off**.
2. Frontend: primer flow behind the flag → build, test on device with the flag flipped on
   for a test build.
3. Flip `show_signup_primer` on in staging admin; validate the real reveal numbers.
4. Merge to `staging` (never straight to main), then production rollout.

The app degrades gracefully at every step: no flag / no endpoint ⇒ no primer, straight to
`AuthWelcome`, exactly as today.
