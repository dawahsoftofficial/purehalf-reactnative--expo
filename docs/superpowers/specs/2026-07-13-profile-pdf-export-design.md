# Profile PDF Export ("Share profile as PDF") — Design Spec

- **Date:** 2026-07-13
- **Status:** Approved design (mockup signed off), ready for implementation planning
- **Scope:** Members can download their own profile as a branded one-page PDF and share it through the system share sheet. Every copy carries the Pure Half logo and a QR code back to the app — a marketing loop, not just a utility.
- **Repos touched:** `admin/` (PDF generation endpoint) and `app-old/` (entry point, preview, share flow).
- **Mockup:** approved visual at https://claude.ai/code/artifact/ea74b09c-c69c-4f7d-8dd4-46099f9d743a (sample member "Ahmed K.", built from the real profile schema and `Colors.tsx` brand tokens).

## 1. Goal

A member taps **Share profile as PDF** on their ME hub, previews the document, and shares it (WhatsApp, email, print, save to files). The PDF is styled like a classic marriage biodata — a format families already know — in Pure Half branding. The document is the marketing asset: logo header, "Meet <name> on Pure Half" footer, QR code that routes recipients toward the app.

## 2. The document

One A4 page, generated server-side from the same data `GET v1/app/auth/my/detail` already serves. Layout per the approved mockup:

- **Header band** — brand-violet gradient (`#4B2E83 → #6E42B8`), two-half heart logo + "Pure Half" wordmark, "Marriage Profile / purehalf.com" at right.
- **Identity block** — photo (or modest placeholder avatar), display name as **first name + last initial** ("Ahmed K."), age, city + country, chips: ID-Verified (when applicable), marital status, profession, practice level.
- **Profile sections — every field from the profile editor schema** (`app-old/src/screens/profile/Data.tsx`), grouped exactly as the app groups them:
  - *About* (`about_you`)
  - *Islamic Values* — prayers, practice level, sect, beard (male) / hijab (female), new Muslim
  - *Lifestyle* — education, profession, earnings per month, marital status, children, smoking, drinking, car, house, business, pets
  - *Appearance & Health* — height (ft + cm), body type, eye color, skin tone, disability
  - *Family Background* — ethnicity, languages, nationality
  - *Future Plans* — marriage timeline, family plan, relocation, open to polygamy
  - *Looking For* (`about_partner`), *Likes*, *Dislikes*
  - *Wali (Guardian) Contact* — name, phone, email (toggle-gated, see §5)
- **Footer band** — QR code, "Meet <first name> on Pure Half — scan to view the full profile", store availability line, reference ID + generation date.

Empty/unanswered fields are omitted (no "Not provided" rows) so sparse profiles still look dignified. Field labels and option values come from the same lookup tables the app renders, so the PDF always matches what the member sees in the editor.

## 3. Backend (`admin/`)

- **Endpoint:** `POST v1/app/auth/profile/pdf` inside the existing authenticated `auth` group in `routes/api.php` (next to `profile/privacy`). Body: `{ include_photo: bool, include_wali: bool }`. Response: the PDF binary (`application/pdf`), plus `X-` headers or a small JSON envelope if the plan finds that cleaner — decided at plan time.
- **Members only, own profile only.** The endpoint renders the authenticated user; no user-id parameter exists, so there is nothing to leak. Throttled (e.g. `throttle:10,1`) — PDF generation is comparatively expensive and a shared document rarely needs regenerating.
- **Generation:** `barryvdh/laravel-dompdf` (new composer dependency — nothing PDF-capable is installed today) rendering a Blade template. Pure PHP, no headless-Chrome ops burden; the approved layout (two columns, key-value rows, header/footer bands) is well within dompdf's CSS subset. The brand heart is inline SVG; fonts embed via dompdf's font handling.
- **QR code:** small pure-PHP library (e.g. `chillerlan/php-qrcode`, GD-based) rendered inline as a data-URI image. Exact package pinned at plan time.
- **QR destination (launch):** the marketing site (`frontend/` project, replacing purehalf.com) — a `/get` style page with store badges. A per-member public web profile preview is explicitly **out of scope** for v1 (see §8); the QR still carries `?ref=<member ref>` so the destination can upgrade later without reprinting old PDFs becoming dead links.
- **Reference ID:** a stable, non-sequential public ref for the member (existing public identifier if one exists; otherwise a short hash of the user id — plan time). Printed beside the generation date.
- **Localization:** English at launch. The Blade template keys strings through Laravel's localization from day one so the Urdu/RTL pass (fast follow) is a translation file + RTL stylesheet, not a rewrite.

## 4. Mobile (`app-old/`)

- **Entry point:** a new row on the ME hub (`src/screens/profile/profile-hub.tsx`), styled like its existing rows: icon + "Share profile as PDF". No premium gate — the feature is free for all members; distribution is the marketing win.
- **Preview screen:** a **native approximation** of the document (header band, identity block, section list — built from data the app already holds), not an embedded PDF render: displaying real PDF pages in RN would require a heavy viewer dependency (`react-native-pdf`) for no user value, since the server template is the single source of truth. Two toggles, both **off by default**:
  - *Include my photo* — off → the template uses the modest placeholder avatar.
  - *Include wali contact details* — off → the wali section is omitted entirely.
  Primary CTA: **Share** — only then is the PDF fetched, with the current toggle flags.
- **Share:** new dependency `react-native-share` (nothing file-share-capable is installed; RN core `Share` cannot attach files on Android). The app receives the PDF, hands it to the share sheet as a `data:application/pdf;base64,` URL (works on both platforms, no filesystem dependency), filename `PureHalf-Profile-<FirstName>.pdf`. "Save to Files/Downloads" comes free as a share-sheet target.
- **i18n:** all new strings through `t()` with keys added to `src/translations/en.json` and mirrored in the other locales (the `i18n-json/identical-keys` lint gate enforces this).
- **Analytics:** log `profile_pdf_generated` and `profile_pdf_shared` (with `include_photo` / `include_wali` flags) via the existing Firebase analytics service, so marketing can see whether the loop is used.
- **Errors:** generation/network failure → the app's standard error toast with retry; nothing is written or shared on failure. Offline → the row still opens the preview screen, which shows the standard offline state.

## 5. Privacy rules

The PDF is designed to leave the app, so its contents are fixed policy, not template accidents:

| Category | Contents |
| --- | --- |
| **Always included** | First name + last initial, age, city & country, every profile-editor section (§2), ID-verified badge when the account is verified |
| **Member-controlled (off by default)** | Photo; wali/guardian name, phone, and email |
| **Never included** | The member's own phone or email (contact flows through the wali or the app), exact location beyond city, account/payment/usage data |

The wali toggle deliberately ships even though guardian *mobile screens* are being removed (2026-07-12 pivot): this uses only the guardian **data** that stays on the admin side, adds no guardian-facing mobile surface, and matches how families actually use biodata — the wali is the point of contact.

## 6. Decisions taken (from mockup review)

1. **Free for all members** — every shared PDF is an advertisement; no paywall.
2. **Server-side generation** (Laravel + dompdf) — one brand-consistent template for both platforms, no heavy mobile PDF dependency, template updates without app releases.
3. **QR lands on the marketing site** at launch; per-member web preview is a future upgrade the `ref` parameter already anticipates.
4. **English at launch, Urdu/RTL fast follow** — template localized from day one to keep the follow-up cheap.
5. **All profile fields included** — including earnings, ownership flags, and polygamy preference; the share-time toggles (photo, wali) are the only member-facing choices.

## 7. Testing

- **Backend (feature tests):** authenticated member gets a `200 application/pdf`; toggles include/omit photo and wali sections (assert on the rendered HTML passed to dompdf rather than parsing PDF bytes); guardian tokens and unauthenticated calls are rejected; throttle kicks in; empty optional fields don't render "Not provided" rows.
- **Mobile:** component test for the preview screen's toggle → request-flag wiring; manual pass on both platforms for the share sheet (WhatsApp, email, save-to-files) since share targets can't be meaningfully unit-tested.
- **Template QA:** golden-eye check of dense (all fields) and sparse (minimal profile) renders, long strings (400-char about texts), and a female profile (hijab row instead of beard).

## 8. Out of scope (v1)

- Per-member public web profile preview page (QR upgrade path).
- Urdu/RTL PDF (fast follow).
- Sharing *other* members' profiles as PDF — this is self-share only; sharing someone else's data raises consent questions that need their own design.
- Admin-side controls (e.g. disabling the feature, template management) beyond what Settings already provides.
