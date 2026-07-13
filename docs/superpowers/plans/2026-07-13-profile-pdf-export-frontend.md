# Profile PDF Export — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Share profile as PDF" row to the ME hub that opens a native-approximation preview screen with photo/wali toggles, fetches the branded PDF from the backend endpoint (built in the companion `admin/` plan), and hands it to the system share sheet.

**Architecture:** A new pure module (`pdf-share.ts`, RN-free so it's directly jest-testable — mirroring the existing `profile-completion.ts` extraction) holds filename/data-URI formatting logic. A new screen (`ProfilePdfShare.tsx`) follows the existing `PrivacySettings.tsx` toggle-row scaffold (`Container`/`Header`/`ModalLoader`/`react-native-switch`). A new `ApiServices.getProfilePdf()` method follows the existing `Services.tsx` promise-wrapper pattern. Sharing goes through the new `react-native-share` dependency, since RN's built-in `Share` API cannot attach files on Android.

**Tech Stack:** React Native 0.82 / React 19.1, TypeScript, `react-native-share` (new dependency), existing `axios`-based `Api` client, `react-native-switch`, `react-i18next`, Jest + `@testing-library/react-native`.

## Global Constraints

- React Native 0.82 / React 19.1 / TypeScript — do not bump these (per repo `CLAUDE.md`).
- Path alias `@/*` → `src/*`; import sort is enforced by `eslint-plugin-simple-import-sort` (run `yarn lint:fix` if imports get flagged).
- Every user-visible string goes through `LanguageKeys` + `src/languages/{English,Urdu,RomanUrdu}.json` — real Urdu/Roman Urdu translations, not English duplicates (established convention per prior onboarding-gift work).
- Use `wp()`/`hp()` from `src/global/Scalling.tsx` for all sizes, never raw pixel values.
- No premium/paywall gate on this feature — it is free for all members (§6 of the design spec).
- Depends on the backend endpoint from `admin/docs/superpowers/plans/2026-07-13-profile-pdf-export-backend.md` (`POST /auth/profile/pdf`, `{ include_photo, include_wali }` → `{ pdf_base64, filename, reference, generated_at }`). If that endpoint isn't deployed yet, Task 3 onward can still be implemented and unit/component-tested against a mocked `ApiServices.getProfilePdf`; only the live share flow needs the real backend.

---

### Task 1: Add the `react-native-share` dependency

**Files:**
- Modify: `app-old/package.json`
- Modify: `app-old/yarn.lock` (generated)

**Interfaces:**
- Produces: `import Share from 'react-native-share';` available app-wide.

- [ ] **Step 1: Install the package**

Run:
```bash
cd app-old
yarn add react-native-share
```
Expected: `react-native-share` added to `dependencies` in `package.json`, `yarn.lock` updated.

- [ ] **Step 2: iOS pod install (macOS only — skip if this session has no macOS toolchain)**

Run: `bundle exec pod install` from `app-old/ios`
Expected: `RNShare` pod linked, no errors. (RN 0.82's autolinking handles Android automatically — no manual `MainApplication` edits needed.)

- [ ] **Step 3: Verify the app still type-checks**

Run: `yarn type-check`
Expected: no new errors (package has its own TypeScript types bundled).

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add react-native-share for profile PDF sharing"
```

---

### Task 2: `EndPoints` + `ApiServices.getProfilePdf()`

**Files:**
- Modify: `app-old/src/services/api/EndPoints.tsx`
- Modify: `app-old/src/services/api/Services.tsx`

**Interfaces:**
- Produces: `ApiServices.getProfilePdf(includePhoto: boolean, includeWali: boolean): Promise<{ pdf_base64: string; filename: string; reference: string; generated_at: string }>`.

- [ ] **Step 1: Add the endpoint constant**

In `app-old/src/services/api/EndPoints.tsx`, add next to `claimProfileGift`:
```ts
  claimProfileGift: '/auth/profile/claim-gift',
  profilePdf: '/auth/profile/pdf',
```

- [ ] **Step 2: Add the service method**

In `app-old/src/services/api/Services.tsx`, add directly after `claimProfileGift` (following its exact promise/error-handling shape):

```ts
  /**
   * Generate the member's own profile as a branded PDF. Toggles control
   * whether the member's photo and wali contact details are included —
   * both default to false server-side when omitted.
   * @returns Promise resolving to { pdf_base64, filename, reference, generated_at }
   */
  getProfilePdf = (
    includePhoto: boolean,
    includeWali: boolean
  ): Promise<{
    pdf_base64: string;
    filename: string;
    reference: string;
    generated_at: string;
  }> => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.profilePdf, {
        include_photo: includePhoto,
        include_wali: includeWali,
      })
        .then((response) => {
          const data = response?.data;
          if (data?.error === false && data?.results) {
            resolve(data.results);
          } else {
            const errorMessage = data?.message || 'Failed to generate PDF';
            console.error(
              '[ApiServices.getProfilePdf] API returned error:',
              errorMessage
            );
            reject(errorMessage);
          }
        })
        .catch((error) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to generate PDF';
          console.error('[ApiServices.getProfilePdf] Error:', {
            message: errorMessage,
            status: error?.response?.status,
            data: error?.response?.data,
          });
          reject(errorMessage);
        });
    });
  };
```

- [ ] **Step 3: Type-check**

Run: `yarn type-check`
Expected: clean (matches the existing `claimProfileGift`/`collectChatCredits` pattern exactly, so no new type errors).

- [ ] **Step 4: Commit**

```bash
git add src/services/api/EndPoints.tsx src/services/api/Services.tsx
git commit -m "feat: add profilePdf endpoint and ApiServices.getProfilePdf"
```

---

### Task 3: Pure helper module `pdf-share.ts`

**Files:**
- Create: `app-old/src/screens/profile/pdf-share.ts`
- Test: `app-old/src/screens/profile/pdf-share.test.ts`

**Interfaces:**
- Produces:
  - `buildShareFilename(firstName: string | undefined): string` — e.g. `"PureHalf-Profile-Ahmed.pdf"`, falling back to `"PureHalf-Profile.pdf"` when no first name is available.
  - `buildPdfDataUrl(base64: string): string` — prefixes with `data:application/pdf;base64,`.
  - `previewSections(detail: Record<string, unknown> | undefined): string[]` — the section titles the preview card lists as "will be included", based on whether the member has filled in anything from that group. This is a coarse presence check (any one field in the group is non-empty), not a re-implementation of the backend's exact per-row logic — good enough for a "here's roughly what's going in" preview, not meant to byte-for-byte match the generated PDF.

- [ ] **Step 1: Write the failing tests**

Create `app-old/src/screens/profile/pdf-share.test.ts`:

```ts
import {
  buildPdfDataUrl,
  buildShareFilename,
  previewSections,
} from './pdf-share';

describe('buildShareFilename', () => {
  it('builds a filename from the first name', () => {
    expect(buildShareFilename('Ahmed')).toBe('PureHalf-Profile-Ahmed.pdf');
  });

  it('strips whitespace and falls back when the name is empty', () => {
    expect(buildShareFilename('   ')).toBe('PureHalf-Profile.pdf');
    expect(buildShareFilename(undefined)).toBe('PureHalf-Profile.pdf');
  });

  it('strips characters that are unsafe in filenames', () => {
    expect(buildShareFilename('Ahmed/Khan')).toBe('PureHalf-Profile-AhmedKhan.pdf');
  });
});

describe('buildPdfDataUrl', () => {
  it('prefixes the base64 payload with the PDF data URL scheme', () => {
    expect(buildPdfDataUrl('JVBERi0xLjQ=')).toBe(
      'data:application/pdf;base64,JVBERi0xLjQ='
    );
  });
});

describe('previewSections', () => {
  it('lists a section once any of its fields are filled in', () => {
    const sections = previewSections({ prayers_punctuality_id: 3 });
    expect(sections).toContain('Islamic Values');
  });

  it('omits sections with nothing filled in', () => {
    const sections = previewSections({ prayers_punctuality_id: 3 });
    expect(sections).not.toContain('Lifestyle');
  });

  it('returns an empty list for an undefined detail', () => {
    expect(previewSections(undefined)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test pdf-share.test.ts`
Expected: FAIL — `Cannot find module './pdf-share'`.

- [ ] **Step 3: Write the implementation**

Create `app-old/src/screens/profile/pdf-share.ts`:

```ts
const UNSAFE_FILENAME_CHARS = /[^a-zA-Z0-9-]/g;

export function buildShareFilename(firstName: string | undefined): string {
  const cleaned = (firstName ?? '').trim().replace(UNSAFE_FILENAME_CHARS, '');
  return cleaned.length > 0
    ? `PureHalf-Profile-${cleaned}.pdf`
    : 'PureHalf-Profile.pdf';
}

export function buildPdfDataUrl(base64: string): string {
  return `data:application/pdf;base64,${base64}`;
}

// Coarse "does this group have anything filled in" check per section, keyed
// by the same apiKey fields Data.tsx groups under appearanceAndHealth /
// familyBackground / lifeStyle / islamicValues / futurePlan. Mirrors the
// backend's section list (admin ProfilePdfService::buildViewData) by title,
// but does not replicate its exact per-row visibility logic — this only
// drives the mobile preview card's "what's going in" checklist.
const SECTION_FIELD_GROUPS: Array<{ title: string; fields: string[] }> = [
  {
    title: 'Islamic Values',
    fields: [
      'prayers_punctuality_id',
      'islamic_practice_level_id',
      'sect_id',
      'have_beard',
      'hijab_level_id',
      'is_new_muslim',
    ],
  },
  {
    title: 'Lifestyle',
    fields: [
      'education_level_id',
      'profession_id',
      'earnings_per_month_id',
      'maritial_status_id',
      'have_children',
      'smoking_id',
      'drinking_id',
      'have_car',
      'have_house',
      'have_business',
      'have_pets',
    ],
  },
  {
    title: 'Appearance & Health',
    fields: ['height', 'body_type_id', 'eyes_color_id', 'skin_tone_id', 'disability_id'],
  },
  {
    title: 'Family Background',
    fields: ['ethinicity_id', 'language_id', 'nationality_id'],
  },
  {
    title: 'Future Plans',
    fields: ['marriage_plan_id', 'family_plan_id', 'relocation_plan_id', 'open_for_polygamy'],
  },
];

export function previewSections(
  detail: Record<string, unknown> | undefined
): string[] {
  if (!detail) {
    return [];
  }

  return SECTION_FIELD_GROUPS.filter((group) =>
    group.fields.some((field) => {
      const value = detail[field];
      return value !== null && value !== undefined && value !== '';
    })
  ).map((group) => group.title);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test pdf-share.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/screens/profile/pdf-share.ts src/screens/profile/pdf-share.test.ts
git commit -m "feat: add pure filename/data-url/section-preview helpers for profile PDF sharing"
```

---

### Task 4: Translation keys

**Files:**
- Modify: `app-old/src/languages/Keys.tsx`
- Modify: `app-old/src/languages/English.json`
- Modify: `app-old/src/languages/Urdu.json`
- Modify: `app-old/src/languages/RomanUrdu.json`

**Interfaces:**
- Produces: `LanguageKeys.shareProfilePdf`, `LanguageKeys.shareProfilePdfSubtitle`, `LanguageKeys.sharePdfIncludePhoto`, `LanguageKeys.sharePdfIncludeWali`, `LanguageKeys.sharePdfIncludeWaliDesc`, `LanguageKeys.sharePdfCta`, `LanguageKeys.sharePdfGenerating`, `LanguageKeys.sharePdfFailed`, `LanguageKeys.sharePdfNewBadge`.

- [ ] **Step 1: Add keys to `Keys.tsx`**

In `app-old/src/languages/Keys.tsx`, add near `tapToAdd` (identity-mapping convention — value equals key name):
```ts
  shareProfilePdf: 'shareProfilePdf',
  shareProfilePdfSubtitle: 'shareProfilePdfSubtitle',
  sharePdfIncludePhoto: 'sharePdfIncludePhoto',
  sharePdfIncludeWali: 'sharePdfIncludeWali',
  sharePdfIncludeWaliDesc: 'sharePdfIncludeWaliDesc',
  sharePdfCta: 'sharePdfCta',
  sharePdfGenerating: 'sharePdfGenerating',
  sharePdfFailed: 'sharePdfFailed',
  sharePdfNewBadge: 'sharePdfNewBadge',
```

- [ ] **Step 2: Add English copy**

In `app-old/src/languages/English.json`, add near `"profileStrength"`:
```json
    "shareProfilePdf": "Share profile as PDF",
    "shareProfilePdfSubtitle": "A branded document you can send to family — with your profile details and a link back to your Pure Half profile.",
    "sharePdfIncludePhoto": "Include my photo",
    "sharePdfIncludeWali": "Include wali contact details",
    "sharePdfIncludeWaliDesc": "Off by default. Turn on so families know who to approach.",
    "sharePdfCta": "Share",
    "sharePdfGenerating": "Preparing your PDF...",
    "sharePdfFailed": "Couldn't generate the PDF. Please try again.",
    "sharePdfNewBadge": "New",
```

- [ ] **Step 3: Add Urdu copy**

In `app-old/src/languages/Urdu.json`, add the same keys with real Urdu translations:
```json
    "shareProfilePdf": "پروفائل بطور PDF شیئر کریں",
    "shareProfilePdfSubtitle": "ایک برانڈڈ دستاویز جو آپ خاندان کو بھیج سکتے ہیں — آپ کی پروفائل کی تفصیلات اور Pure Half پروفائل کے لنک کے ساتھ۔",
    "sharePdfIncludePhoto": "میری تصویر شامل کریں",
    "sharePdfIncludeWali": "ولی کی رابطہ تفصیلات شامل کریں",
    "sharePdfIncludeWaliDesc": "پہلے سے آف ہے۔ خاندان کو معلوم ہونے کے لیے آن کریں کہ کس سے رابطہ کریں۔",
    "sharePdfCta": "شیئر کریں",
    "sharePdfGenerating": "آپ کی PDF تیار کی جا رہی ہے...",
    "sharePdfFailed": "PDF تیار نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔",
    "sharePdfNewBadge": "نیا",
```

- [ ] **Step 4: Add Roman Urdu copy**

In `app-old/src/languages/RomanUrdu.json`, add the same keys:
```json
    "shareProfilePdf": "Profile PDF ke tor par share karein",
    "shareProfilePdfSubtitle": "Ek branded document jo aap family ko bhej sakte hain — aapki profile ki tafseelat aur Pure Half profile ke link ke sath.",
    "sharePdfIncludePhoto": "Meri tasveer shamil karein",
    "sharePdfIncludeWali": "Wali ki contact tafseelat shamil karein",
    "sharePdfIncludeWaliDesc": "Pehle se off hai. Family ko pata chalne ke liye on karein ke kis se rabta karein.",
    "sharePdfCta": "Share karein",
    "sharePdfGenerating": "Aapki PDF tayyar ki ja rahi hai...",
    "sharePdfFailed": "PDF tayyar nahi ho saki. Baraye meherbani dobara koshish karein.",
    "sharePdfNewBadge": "Naya",
```

- [ ] **Step 5: Run the i18n lint gate**

Run: `yarn lint`
Expected: no `i18n-json/identical-keys` errors (all four files now have the same key set).

- [ ] **Step 6: Commit**

```bash
git add src/languages/Keys.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
git commit -m "feat: add translation keys for profile PDF sharing"
```

---

### Task 5: `ProfilePdfShare` screen — toggle wiring

**Files:**
- Create: `app-old/src/screens/profile/ProfilePdfShare.tsx`
- Test: `app-old/src/screens/profile/ProfilePdfShare.test.tsx`

**Interfaces:**
- Consumes: `ApiServices.getProfilePdf` (Task 2), `buildShareFilename`/`buildPdfDataUrl` (Task 3), `LanguageKeys.sharePdf*` (Task 4).
- Produces: default-exported `ProfilePdfShare` screen component, navigated to with no route params (reads the current member from `useGlobalContext()`).

**Scope note:** the design spec (§4) calls for the preview to be "a native approximation of the document" rather than an embedded PDF render. This task builds that as a lightweight summary card — display name/age/location plus a checklist of which sections will appear — not a pixel replica of the approved PDF mockup (header band, two-column layout, etc.). Full visual replication would duplicate most of the backend Blade template as RN components for a screen the member sees once per share; flag to the user if they'd rather invest in a closer visual match.

- [ ] **Step 1: Write the failing component test**

Create `app-old/src/screens/profile/ProfilePdfShare.test.tsx`. This test isolates the toggle → request-flag wiring described in the design spec (§4/§7), independent of the native share sheet:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import ProfilePdfShare from './ProfilePdfShare';

const mockGetProfilePdf = jest.fn().mockResolvedValue({
  pdf_base64: 'JVBERi0xLjQ=',
  filename: 'PureHalf-Profile-Ahmed.pdf',
  reference: 'PH-00042',
  generated_at: '2026-07-13T00:00:00Z',
});

jest.mock('../../services', () => ({
  ApiServices: {
    getProfilePdf: (...args: unknown[]) => mockGetProfilePdf(...args),
  },
  useGlobalContext: () => ({
    currentUser: {
      first_name: 'Ahmed',
      last_name: 'Khan',
      city: 'Manchester',
      country: 'United Kingdom',
      detail: { prayers_punctuality_id: 3, height: 175 },
    },
  }),
  flashErrorMessage: jest.fn(),
}));

const mockShareOpen = jest.fn().mockResolvedValue({ action: 'shared' });
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: (...args: unknown[]) => mockShareOpen(...args) },
}));

describe('ProfilePdfShare', () => {
  beforeEach(() => {
    mockGetProfilePdf.mockClear();
    mockShareOpen.mockClear();
  });

  it('requests the PDF with both toggles off by default when Share is pressed', async () => {
    render(<ProfilePdfShare navigation={{ goBack: jest.fn() }} />);

    fireEvent.press(screen.getByTestId('share-pdf-cta'));

    await screen.findByTestId('share-pdf-cta');
    expect(mockGetProfilePdf).toHaveBeenCalledWith(false, false);
  });

  it('passes the toggled flags through to the request', async () => {
    render(<ProfilePdfShare navigation={{ goBack: jest.fn() }} />);

    fireEvent(
      screen.getByTestId('toggle-include-photo'),
      'onValueChange',
      true
    );
    fireEvent(
      screen.getByTestId('toggle-include-wali'),
      'onValueChange',
      true
    );
    fireEvent.press(screen.getByTestId('share-pdf-cta'));

    await screen.findByTestId('share-pdf-cta');
    expect(mockGetProfilePdf).toHaveBeenCalledWith(true, true);
  });

  it('shares the fetched PDF as a base64 data URL with the built filename', async () => {
    render(<ProfilePdfShare navigation={{ goBack: jest.fn() }} />);

    fireEvent.press(screen.getByTestId('share-pdf-cta'));

    await screen.findByTestId('share-pdf-cta');
    expect(mockShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'data:application/pdf;base64,JVBERi0xLjQ=',
        filename: 'PureHalf-Profile-Ahmed.pdf',
        useInternalStorage: true,
      })
    );
  });

  it('shows a preview summary with the member identity and included sections', () => {
    render(<ProfilePdfShare navigation={{ goBack: jest.fn() }} />);

    expect(screen.getByText('Ahmed K.')).toBeTruthy();
    expect(screen.getByText('Manchester, United Kingdom')).toBeTruthy();
    expect(screen.getByText('Islamic Values')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test ProfilePdfShare.test.tsx`
Expected: FAIL — `Cannot find module './ProfilePdfShare'`.

- [ ] **Step 3: Write the screen**

Create `app-old/src/screens/profile/ProfilePdfShare.tsx`, following the `PrivacySettings.tsx` scaffold (`Container`/`Header`/`ModalLoader`/`react-native-switch`) exactly:

```tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Share from 'react-native-share';
import { Switch } from 'react-native-switch';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Container, Header, ModalLoader, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  useGlobalContext,
} from '../../services';
import {
  buildPdfDataUrl,
  buildShareFilename,
  previewSections,
} from './pdf-share';

type ProfilePdfShareProps = {
  navigation: any;
};

const ProfilePdfShare = ({ navigation }: ProfilePdfShareProps) => {
  const { currentUser } = useGlobalContext();
  const [includePhoto, setIncludePhoto] = useState(false);
  const [includeWali, setIncludeWali] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayName = [
    currentUser?.first_name,
    currentUser?.last_name ? `${currentUser.last_name.charAt(0)}.` : null,
  ]
    .filter(Boolean)
    .join(' ');
  const location = [currentUser?.city, currentUser?.country]
    .filter(Boolean)
    .join(', ');
  const sections = previewSections(currentUser?.detail);

  const onShare = async () => {
    setLoading(true);
    try {
      const result = await ApiServices.getProfilePdf(
        includePhoto,
        includeWali
      );
      await Share.open({
        url: buildPdfDataUrl(result.pdf_base64),
        filename:
          result.filename ?? buildShareFilename(currentUser?.first_name),
        useInternalStorage: true,
        failOnCancel: false,
      });
    } catch {
      flashErrorMessage(LanguageKeys.sharePdfFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={Styles.screen}>
      <Header
        title={LanguageKeys.shareProfilePdf}
        navigation={navigation}
        titleVariant="display"
      />
      <ModalLoader visible={loading} message={LanguageKeys.sharePdfGenerating} />

      <ScrollView
        contentContainerStyle={Styles.innerCon}
        showsVerticalScrollIndicator={false}
      >
        <Text style={Styles.subtitle}>
          {LanguageKeys.shareProfilePdfSubtitle}
        </Text>

        <View style={Styles.previewCard}>
          <Text style={Styles.previewName}>{displayName}</Text>
          {location ? (
            <Text style={Styles.previewLocation}>{location}</Text>
          ) : null}
          {sections.length > 0 ? (
            <View style={Styles.previewSections}>
              {sections.map((title) => (
                <View key={title} style={Styles.previewSectionRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={wp(4)}
                    color={Colors.verified}
                  />
                  <Text style={Styles.previewSectionTxt}>{title}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={Styles.groupCard}>
          <View style={Styles.fieldCon}>
            <View style={Styles.fieldTxtCon}>
              <Text style={Styles.fieldTxt}>
                {LanguageKeys.sharePdfIncludePhoto}
              </Text>
            </View>
            <Switch
              testID="toggle-include-photo"
              value={includePhoto}
              onValueChange={setIncludePhoto}
              renderActiveText={false}
              renderInActiveText={false}
              circleSize={25}
              backgroundActive={Colors.primary}
              backgroundInactive={Colors.color18}
            />
          </View>
          <View style={[Styles.fieldCon, Styles.divider]}>
            <View style={Styles.fieldTxtCon}>
              <Text style={Styles.fieldTxt}>
                {LanguageKeys.sharePdfIncludeWali}
              </Text>
              <Text style={Styles.fieldDesc}>
                {LanguageKeys.sharePdfIncludeWaliDesc}
              </Text>
            </View>
            <Switch
              testID="toggle-include-wali"
              value={includeWali}
              onValueChange={setIncludeWali}
              renderActiveText={false}
              renderInActiveText={false}
              circleSize={25}
              backgroundActive={Colors.primary}
              backgroundInactive={Colors.color18}
            />
          </View>
        </View>

        <Ripple
          testID="share-pdf-cta"
          onPress={onShare}
          disabled={loading}
          style={Styles.cta}
        >
          <Text style={Styles.ctaTxt}>{LanguageKeys.sharePdfCta}</Text>
        </Ripple>
      </ScrollView>
    </Container>
  );
};

const Styles = StyleSheet.create({
  screen: { flex: 1 },
  innerCon: { paddingHorizontal: wp(5), paddingTop: hp(2), paddingBottom: hp(4) },
  subtitle: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.muted,
    marginBottom: hp(2.5),
  },
  previewCard: {
    backgroundColor: Colors.lavender,
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(2.5),
  },
  previewName: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    color: Colors.ink,
  },
  previewLocation: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.muted,
    marginTop: hp(0.2),
  },
  previewSections: { marginTop: hp(1.4), gap: hp(0.6) },
  previewSectionRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2) },
  previewSectionTxt: {
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    color: Colors.ink,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fieldCon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
  },
  divider: { borderTopWidth: 1, borderTopColor: Colors.hairline },
  fieldTxtCon: { flex: 1, marginRight: wp(3) },
  fieldTxt: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    color: Colors.ink,
  },
  fieldDesc: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.muted,
    marginTop: hp(0.3),
  },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: hp(1.8),
    alignItems: 'center',
    marginTop: hp(3),
  },
  ctaTxt: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small3,
    color: Colors.color2,
  },
});

export default ProfilePdfShare;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test ProfilePdfShare.test.tsx`
Expected: PASS (4 tests). If `Header`/`Container`/`ModalLoader` from `'../../components'` render native elements that jsdom can't handle, mirror the mocking approach already used in `EditProfileGroup.test.tsx` (`jest.mock('../../components', () => ...)`) — mock only the pieces that error, keep `Text` passthrough so `getByTestId`/`getByText` still find the CTA/switches/preview text via their own `testID`/children props.

- [ ] **Step 5: Type-check and lint**

Run: `yarn type-check && yarn lint:fix`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/screens/profile/ProfilePdfShare.tsx src/screens/profile/ProfilePdfShare.test.tsx
git commit -m "feat: add ProfilePdfShare screen with photo/wali toggles"
```

---

### Task 6: Register the screen and wire the ME hub entry point

**Files:**
- Modify: `app-old/src/navigation/RootNavigation.tsx`
- Modify: `app-old/src/screens/profile/profile-hub.tsx`
- Modify: `app-old/src/screens/profile/Profile.tsx`

**Interfaces:**
- Consumes: `ProfilePdfShare` screen (Task 5).
- Produces: exported `SharePdfRow` component from `profile-hub.tsx`; a new `Stack.Screen` route named `"ProfilePdfShare"`.

- [ ] **Step 1: Register the navigation route**

In `app-old/src/navigation/RootNavigation.tsx`, add the import near the other profile-screen imports (alongside `EditProfileGroup`/`EditInterests`, line ~31-32):
```ts
  EditInterests,
  EditProfileGroup,
  ProfilePdfShare,
```
and register the screen next to them (after line 271's `EditInterests` registration):
```tsx
          <Stack.Screen name="EditProfileGroup" component={EditProfileGroup} />
          <Stack.Screen name="EditInterests" component={EditInterests} />
          <Stack.Screen name="ProfilePdfShare" component={ProfilePdfShare} />
```
Check how `EditProfileGroup`/`EditInterests` are actually imported (barrel file vs. direct path) by inspecting the top of `RootNavigation.tsx` before editing — match whichever style is already used for that import block exactly (likely a `screens` barrel re-export; if so, also add `export { default as ProfilePdfShare } from '../screens/profile/ProfilePdfShare';` to that barrel file).

- [ ] **Step 2: Add the `SharePdfRow` component to `profile-hub.tsx`**

In `app-old/src/screens/profile/profile-hub.tsx`, add a new export following the exact `Ripple`/`Ionicons`/`Styles.row` pattern used by `DetailSectionList`'s rows (place it after `DetailSectionList`, before the `Styles` block):

```tsx
type SharePdfRowProps = {
  onPress: () => void;
};

export const SharePdfRow = memo(function SharePdfRow({
  onPress,
}: SharePdfRowProps) {
  return (
    <View style={Styles.card}>
      <Ripple onPress={onPress} style={Styles.row}>
        <View style={Styles.iconChip}>
          <Ionicons name="document-text-outline" size={wp(5)} color={Colors.primary} />
        </View>
        <View style={Styles.rowText}>
          <Text style={Styles.rowTitle}>{LanguageKeys.shareProfilePdf}</Text>
          <Text style={Styles.rowPreview} numberOfLines={1}>
            {LanguageKeys.shareProfilePdfSubtitle}
          </Text>
        </View>
        <View style={Styles.countPillDone}>
          <Text style={Styles.newBadgeTxt}>{LanguageKeys.sharePdfNewBadge}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={wp(5)}
          color={Colors.primaryLite}
        />
      </Ripple>
    </View>
  );
});
```

Add the one new style key to the existing `Styles` `StyleSheet.create({...})` block in the same file (next to `countTxtDone`):
```ts
  newBadgeTxt: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.tiny1,
    color: Colors.verified,
    paddingHorizontal: wp(0.5),
  },
```

- [ ] **Step 3: Wire it into `Profile.tsx`**

In `app-old/src/screens/profile/Profile.tsx`:
1. Add `SharePdfRow` to the existing `import { ... } from './profile-hub';` block (line 35-41).
2. Add an `onSharePdf` callback next to `onEditInterests` (line 217-219):
   ```ts
   const onSharePdf = useCallback(() => {
     navigation.navigate('ProfilePdfShare');
   }, [navigation]);
   ```
3. Render the row in the own-profile branch, directly after `<DetailSectionList .../>` and before the closing spacer `<View style={{ height: 28 }} />` (lines 551-556):
   ```tsx
                       <DetailSectionList
                         categoriesData={categoriesData}
                         gender={userData?.detail?.gender ?? userData?.gender}
                         onOpenGroup={onOpenGroup}
                       />
                       <SharePdfRow onPress={onSharePdf} />
                       <View style={{ height: 28 }} />
   ```

- [ ] **Step 4: Type-check**

Run: `yarn type-check`
Expected: clean.

- [ ] **Step 5: Manual verification (own-profile screen only touches native navigation, not meaningfully jest-testable without a full navigator mock)**

Run the app (`yarn android` or `yarn ios`), go to the ME tab → own profile, confirm the "Share profile as PDF" row appears below the profile-details section list with a "New" badge, and tapping it navigates to the `ProfilePdfShare` screen.

- [ ] **Step 6: Commit**

```bash
git add src/navigation/RootNavigation.tsx src/screens/profile/profile-hub.tsx src/screens/profile/Profile.tsx
git commit -m "feat: surface Share profile as PDF row on the ME hub"
```

---

### Task 7: Analytics events

**Files:**
- Modify: `app-old/src/screens/profile/ProfilePdfShare.tsx`
- Modify: `app-old/src/screens/profile/ProfilePdfShare.test.tsx`

**Interfaces:**
- Consumes: `addAnaylatics` from `app-old/src/services/firebase/analytics.tsx` (existing — note the established, intentionally-unfixed typo in the function name).
- Produces: two new analytics events, `profile_pdf_generated` and `profile_pdf_shared`, each carrying `{ include_photo, include_wali }`.

- [ ] **Step 1: Write the failing test**

Add to `app-old/src/screens/profile/ProfilePdfShare.test.tsx`, inside the existing mock block add a mock for the analytics module:

```tsx
const mockAddAnaylatics = jest.fn();
jest.mock('../../services/firebase/analytics', () => ({
  addAnaylatics: (...args: unknown[]) => mockAddAnaylatics(...args),
}));
```

and a new test:

```tsx
  it('logs generated and shared analytics events with the current toggle flags', async () => {
    render(<ProfilePdfShare navigation={{ goBack: jest.fn() }} />);

    fireEvent(
      screen.getByTestId('toggle-include-wali'),
      'onValueChange',
      true
    );
    fireEvent.press(screen.getByTestId('share-pdf-cta'));

    await screen.findByTestId('share-pdf-cta');
    expect(mockAddAnaylatics).toHaveBeenCalledWith('profile_pdf_generated', {
      include_photo: false,
      include_wali: true,
    });
    expect(mockAddAnaylatics).toHaveBeenCalledWith('profile_pdf_shared', {
      include_photo: false,
      include_wali: true,
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test ProfilePdfShare.test.tsx`
Expected: FAIL — `mockAddAnaylatics` never called.

- [ ] **Step 3: Wire the events into the screen**

In `app-old/src/screens/profile/ProfilePdfShare.tsx`:
1. Add the import:
   ```ts
   import { addAnaylatics } from '../../services/firebase/analytics';
   ```
2. Update `onShare`:
   ```ts
   const onShare = async () => {
     setLoading(true);
     try {
       const result = await ApiServices.getProfilePdf(
         includePhoto,
         includeWali
       );
       await addAnaylatics('profile_pdf_generated', {
         include_photo: includePhoto,
         include_wali: includeWali,
       });
       await Share.open({
         url: buildPdfDataUrl(result.pdf_base64),
         filename:
           result.filename ?? buildShareFilename(currentUser?.first_name),
         useInternalStorage: true,
         failOnCancel: false,
       });
       await addAnaylatics('profile_pdf_shared', {
         include_photo: includePhoto,
         include_wali: includeWali,
       });
     } catch {
       flashErrorMessage(LanguageKeys.sharePdfFailed);
     } finally {
       setLoading(false);
     }
   };
   ```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test ProfilePdfShare.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full jest suite to check for regressions**

Run: `yarn test`
Expected: PASS, with no newly-broken tests outside this feature (the two pre-existing failures — `EditProfileGroup.test.tsx`, `App.test.tsx` — are known and unrelated; confirm no new failures beyond those two).

- [ ] **Step 6: Run `yarn check-all`**

Run: `yarn check-all`
Expected: lint clean (or only pre-existing warnings), type-check clean, tests as in Step 5.

- [ ] **Step 7: Commit**

```bash
git add src/screens/profile/ProfilePdfShare.tsx src/screens/profile/ProfilePdfShare.test.tsx
git commit -m "feat: log analytics events for profile PDF generation and sharing"
```

---

## Post-implementation notes for the user

1. **Manual device verification is required** (Task 6, Step 5) — the share-sheet flow (WhatsApp, email, save-to-files) cannot be meaningfully unit-tested and needs a real iOS/Android pass, consistent with the design spec's testing section (§7).
2. **This plan assumes `admin`'s `POST /auth/profile/pdf` endpoint is live.** If you run this plan before the backend plan, everything through Task 5 still works (mocked in tests); only the real share flow needs the deployed endpoint.
3. Per repo convention (`[[feedback_staging_first]]`), branch off `staging` for this work and merge back to `staging` first — do not target `main` directly.
4. **Offline state** — the design spec (§4) calls for the preview screen to show "the standard offline state" when opened without connectivity. This plan didn't verify whether `Container` (the shared screen wrapper reused from `PrivacySettings.tsx`) already handles this app-wide, or whether each screen opts in individually. Check that during Task 5 implementation; if it's not automatic, add whatever offline-detection hook the rest of the app uses before considering this task done.
5. **Preview card is a lightweight summary, not a mockup replica** (Task 5's scope note) — flag to the user during review in case they want the preview closer to the approved PDF mockup's visual layout.
