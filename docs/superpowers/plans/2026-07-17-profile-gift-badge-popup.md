# Profile Gift Badge — Right Placement + Explainer Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin the ME-profile gift badge to the right end of the profile-strength bar instead of letting it ride the progress fill, and replace its locked/claimed toasts with an explainer popup that offers a "Start now" route into the profile questions.

**Architecture:** Three touched areas. (1) `Header.tsx` positions the badge at a fixed edge and stops hiding the claimed state. (2) A new presentational `profile-gift-info-modal.tsx` renders two variants (`locked` / `claimed`) and owns no state, navigation, or API calls — the parent injects everything via props. (3) `Header.tsx` swaps `flashMessage` calls for modal state and navigates to the existing `OnboardingProfile` flow. No backend change.

**Tech Stack:** React Native 0.82, TypeScript, i18next, jest + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-07-17-profile-gift-badge-popup-design.md`

## Global Constraints

- **Scaling:** use `wp()` / `hp()` from `src/global/Scalling.tsx`, never raw pixels.
- **i18n:** every user-visible string goes through `t()` / `LanguageKeys`. A new key must be added to **all four** files: `Keys.tsx`, `English.json`, `Urdu.json`, `RomanUrdu.json`.
- **Copy rule:** the gift is **150 credits** (= 3 chats at 50 credits/chat). New copy says **"free chat credits"**, never "free chats". Do **not** edit the existing `giftClaimBody` key — its "chats" wording is a known pre-existing bug and is explicitly out of scope.
- **RTL:** every directional style must mirror on `Rtl` (from `CheckRtl()`).
- **Imports:** `eslint-plugin-simple-import-sort` orders imports; `@typescript-eslint/consistent-type-imports` forces `import type`. Run `yarn lint:fix` rather than hand-ordering.
- **Icon fact:** `gift-open-outline` exists in **MaterialCommunityIcons**, NOT Ionicons. `gift` and `gift-outline` are Ionicons. Mixing these up renders a blank glyph with no error.
- **Do not bump any dependency.**
- **Husky runs `tsc --noEmit` + lint-staged on every commit.** A commit that fails type-check will be rejected — that is the safety net, do not bypass it with `--no-verify`.

---

### Task 1: i18n keys for the new popup

**Files:**

- Modify: `src/languages/Keys.tsx:35-37`
- Modify: `src/languages/English.json:191`
- Modify: `src/languages/Urdu.json:185`
- Modify: `src/languages/RomanUrdu.json:188`

**Interfaces:**

- Consumes: nothing.
- Produces: `LanguageKeys.giftInfoTitle`, `LanguageKeys.giftInfoBody` (`{{percent}}`, `{{credits}}`), `LanguageKeys.giftStartNow`, `LanguageKeys.giftClaimedTitle`, `LanguageKeys.giftClaimedBody` (`{{credits}}`) — all consumed by Task 3.

Only **adds** keys. The dead `giftLockedHint` / `giftAlreadyClaimedHint` are deleted in Task 4, once their last consumer is gone — deleting them here would break `tsc` and the husky hook would reject the commit.

- [ ] **Step 1: Add the key constants**

In `src/languages/Keys.tsx`, the block currently reads:

```ts
  giftClaimTitle: 'giftClaimTitle',
  giftClaimBody: 'giftClaimBody',
  claimGift: 'claimGift',
```

Replace it with:

```ts
  giftClaimTitle: 'giftClaimTitle',
  giftClaimBody: 'giftClaimBody',
  giftInfoTitle: 'giftInfoTitle',
  giftInfoBody: 'giftInfoBody',
  giftStartNow: 'giftStartNow',
  giftClaimedTitle: 'giftClaimedTitle',
  giftClaimedBody: 'giftClaimedBody',
  claimGift: 'claimGift',
```

- [ ] **Step 2: Add the English strings**

In `src/languages/English.json`, insert directly after the `"giftClaimBody"` line (191):

```json
    "giftInfoTitle": "Unlock your profile gift",
    "giftInfoBody": "Complete your profile screens to reach {{percent}}% profile strength and unlock {{credits}} free chat credits.",
    "giftStartNow": "Start now",
    "giftClaimedTitle": "Gift claimed",
    "giftClaimedBody": "You've already claimed your {{credits}} free chat credits for completing your profile.",
```

- [ ] **Step 3: Add the Urdu strings**

In `src/languages/Urdu.json`, insert directly after the `"giftClaimBody"` line (185):

```json
    "giftInfoTitle": "اپنا پروفائل تحفہ حاصل کریں",
    "giftInfoBody": "اپنی پروفائل اسکرینز مکمل کریں، {{percent}}% پروفائل مضبوطی تک پہنچیں اور {{credits}} مفت چیٹ کریڈٹس حاصل کریں۔",
    "giftStartNow": "ابھی شروع کریں",
    "giftClaimedTitle": "تحفہ حاصل کر لیا گیا",
    "giftClaimedBody": "آپ پروفائل مکمل کرنے پر اپنے {{credits}} مفت چیٹ کریڈٹس پہلے ہی حاصل کر چکے ہیں۔",
```

- [ ] **Step 4: Add the RomanUrdu strings**

In `src/languages/RomanUrdu.json`, insert directly after the `"giftClaimBody"` line (188). RomanUrdu convention = Roman-script Urdu with English technical nouns kept in English:

```json
    "giftInfoTitle": "Apna profile gift unlock karein",
    "giftInfoBody": "Apni profile screens mukammal karein, {{percent}}% profile strength tak pahunchein aur {{credits}} free chat credits hasil karein.",
    "giftStartNow": "Abhi shuru karein",
    "giftClaimedTitle": "Gift hasil kar liya",
    "giftClaimedBody": "Aap profile mukammal karne par apne {{credits}} free chat credits pehle hi hasil kar chuke hain.",
```

- [ ] **Step 5: Verify the JSON and interpolation lint**

Run: `yarn lint src/languages`
Expected: exit 0, no errors on the three JSON files. (`eslint-plugin-i18n-json` validates JSON syntax and i18next `{{...}}` interpolation.)

- [ ] **Step 6: Verify types**

Run: `yarn type-check`
Expected: exit 0, no output.

- [ ] **Step 7: Commit**

```bash
git add src/languages/Keys.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
git commit -m "feat(i18n): add profile gift explainer popup keys"
```

---

### Task 2: Pin the badge to the right end and reveal the claimed state

**Files:**

- Modify: `src/screens/profile/Header.tsx:963-983` (the `strengthTrackWrap` block)
- Modify: `src/screens/profile/Header.tsx:1348-1353` (`Styles.giftAboveBar`)
- Modify: `src/screens/profile/components/gift-badge.tsx:16-23` (stale comment)

**Interfaces:**

- Consumes: nothing.
- Produces: nothing new. `GiftBadge`'s existing `{ eligible, claimed, onPress }` props are unchanged.

This is the visible fix: today the badge is offset by `left/right: ${profileStrength}%`, so it slides along with the fill and collides with the strength label at low percentages.

- [ ] **Step 1: Fix the positioning style**

In `src/screens/profile/Header.tsx`, `Styles.giftAboveBar` currently reads:

```ts
  giftAboveBar: {
    position: 'absolute',
    bottom: hp(1.4),
    transform: [{ translateX: -wp(4) }],
    zIndex: 1,
  },
```

Replace with (the `translateX` existed only to centre the badge over the moving fill point; pinned to an edge it would push the badge off the card):

```ts
  giftAboveBar: {
    position: 'absolute',
    bottom: hp(1.4),
    zIndex: 1,
  },
```

- [ ] **Step 2: Pin the badge and un-hide the claimed state**

Still in `Header.tsx`, this block:

```tsx
            <View style={Styles.strengthTrackWrap}>
              {!giftClaimed && (
                <View
                  style={[
                    Styles.giftAboveBar,
                    Rtl
                      ? {
                          right: `${Math.max(0, Math.min(100, profileStrength))}%`,
                        }
                      : {
                          left: `${Math.max(0, Math.min(100, profileStrength))}%`,
                        },
                  ]}
                >
                  <GiftBadge
                    eligible={giftEligible}
                    claimed={giftClaimed}
                    onPress={onGiftBadgePress}
                  />
                </View>
              )}
```

becomes:

```tsx
            <View style={Styles.strengthTrackWrap}>
              <View
                style={[Styles.giftAboveBar, Rtl ? { left: 0 } : { right: 0 }]}
              >
                <GiftBadge
                  eligible={giftEligible}
                  claimed={giftClaimed}
                  onPress={onGiftBadgePress}
                />
              </View>
```

Delete the now-orphaned closing `)}` that terminated the `{!giftClaimed && (` expression, keeping the `<View style={Styles.strengthTrack}>` sibling that follows intact.

- [ ] **Step 3: Fix the stale comment in gift-badge.tsx**

The current comment claims the component is used in two headers and that the ME header hides nothing. Both are wrong: `gift-badge.tsx` has exactly one importer. In `src/screens/profile/components/gift-badge.tsx`, replace the comment block above `const GiftBadge = ...`:

```tsx
// Three states, all tappable — the caller (which already knows
// strengthPct/giftThreshold) decides what onPress does for each: locked
// (muted, below the completion threshold) shows an explanatory hint,
// eligible (solid primary, wiggling to draw the eye) opens the claim modal,
// claimed (solid, verified-green — "opened") shows an already-claimed hint.
// Used identically in the OnboardingProfile header and the ME profile
// header so the gift reads the same wherever the user reaches it.
```

with:

```tsx
// Three states, all tappable — the caller (which already knows
// strengthPct/giftThreshold) decides what onPress does for each: locked
// (muted, below the completion threshold) and claimed (verified-green,
// "opened") open an explainer popup, eligible (solid primary, wiggling to
// draw the eye) opens the claim modal. Rendered by the ME profile header
// only, pinned to the right end of the profile-strength bar.
```

- [ ] **Step 4: Verify types and lint**

Run: `yarn type-check && yarn lint src/screens/profile/Header.tsx src/screens/profile/components/gift-badge.tsx`
Expected: type-check exit 0. Lint exit 0 (warnings are tolerated in this repo; **errors are not**).

- [ ] **Step 5: Commit**

```bash
git add src/screens/profile/Header.tsx src/screens/profile/components/gift-badge.tsx
git commit -m "fix(profile): pin gift badge to right end of strength bar"
```

---

### Task 3: The `ProfileGiftInfoModal` component (TDD)

**Files:**

- Create: `src/screens/profile/components/profile-gift-info-modal.tsx`
- Test: `src/screens/profile/components/profile-gift-info-modal.test.tsx`

**Interfaces:**

- Consumes: `LanguageKeys.giftInfoTitle`, `giftInfoBody`, `giftStartNow`, `giftClaimedTitle`, `giftClaimedBody` from Task 1; existing `LanguageKeys.maybeLater`, `LanguageKeys.gotIt`.
- Produces: default export `ProfileGiftInfoModal` and named export `type ProfileGiftInfoVariant = 'locked' | 'claimed'`, both consumed by Task 4. Props:
  ```ts
  { visible: boolean; variant: ProfileGiftInfoVariant; percent: number;
    credits: number; onClose: () => void; onStart: () => void }
  ```

The test mocks mirror `privacy-quick-settings-modal.test.tsx` in this same folder (the established pattern): `../../../components` is mocked so `Button`/`Text` become inspectable RN primitives, and `../../../languages` is mocked so `LanguageKeys.x` resolves to the literal `'x'`. `i18next`'s `t` is mocked to echo `key|k=v` so a test can assert the interpolation values actually reach it. `react-native-vector-icons` needs **no** mock — it transforms fine under the RN preset.

- [ ] **Step 1: Write the failing test**

Create `src/screens/profile/components/profile-gift-info-modal.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React, { type ReactNode } from 'react';

import ProfileGiftInfoModal from './profile-gift-info-modal';

type ChildrenProps = { children?: ReactNode };
type ButtonProps = { text?: ReactNode; onPress?: () => void };

jest.mock('i18next', () => ({
  t: (key: string, opts?: Record<string, unknown>) =>
    opts
      ? `${key}|${Object.entries(opts)
          .map(([k, v]) => `${k}=${v}`)
          .join(',')}`
      : key,
}));

jest.mock('../../../components', () => {
  const ReactActual = jest.requireActual('react') as typeof React;
  const { Text: MockText } = jest.requireActual('react-native') as {
    Text: React.ComponentType<any>;
  };

  return {
    Button: ({ onPress, text }: ButtonProps) =>
      ReactActual.createElement(MockText, { onPress }, text),
    Text: ({ children, style }: ChildrenProps & { style?: unknown }) =>
      ReactActual.createElement(MockText, { style }, children),
  };
});

jest.mock('../../../languages', () => ({
  LanguageKeys: {
    giftInfoTitle: 'giftInfoTitle',
    giftInfoBody: 'giftInfoBody',
    giftStartNow: 'giftStartNow',
    giftClaimedTitle: 'giftClaimedTitle',
    giftClaimedBody: 'giftClaimedBody',
    maybeLater: 'maybeLater',
    gotIt: 'gotIt',
  },
}));

describe('ProfileGiftInfoModal', () => {
  const baseProps = {
    visible: true,
    percent: 90,
    credits: 150,
    onClose: jest.fn(),
    onStart: jest.fn(),
  };

  beforeEach(() => {
    baseProps.onClose.mockReset();
    baseProps.onStart.mockReset();
  });

  describe('locked variant', () => {
    it('explains the gift, passing the threshold and credits to the copy', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="locked" />);

      expect(screen.getByText('giftInfoTitle')).toBeTruthy();
      expect(
        screen.getByText('giftInfoBody|percent=90,credits=150')
      ).toBeTruthy();
    });

    it('starts the profile flow via onStart, not onClose', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="locked" />);

      fireEvent.press(screen.getByText('giftStartNow'));

      expect(baseProps.onStart).toHaveBeenCalledTimes(1);
      expect(baseProps.onClose).not.toHaveBeenCalled();
    });

    it('dismisses via Maybe Later without starting the flow', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="locked" />);

      fireEvent.press(screen.getByText('maybeLater'));

      expect(baseProps.onClose).toHaveBeenCalledTimes(1);
      expect(baseProps.onStart).not.toHaveBeenCalled();
    });
  });

  describe('claimed variant', () => {
    it('confirms the claim and offers no way to restart the flow', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="claimed" />);

      expect(screen.getByText('giftClaimedTitle')).toBeTruthy();
      expect(screen.getByText('giftClaimedBody|credits=150')).toBeTruthy();
      expect(screen.queryByText('giftStartNow')).toBeNull();
      expect(screen.queryByText('maybeLater')).toBeNull();
    });

    it('dismisses via Got it', () => {
      render(<ProfileGiftInfoModal {...baseProps} variant="claimed" />);

      fireEvent.press(screen.getByText('gotIt'));

      expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('renders nothing while not visible', () => {
    render(
      <ProfileGiftInfoModal {...baseProps} variant="locked" visible={false} />
    );

    expect(screen.queryByText('giftInfoTitle')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/profile/components/profile-gift-info-modal.test.tsx`
Expected: FAIL — `Cannot find module './profile-gift-info-modal'`.

- [ ] **Step 3: Write the component**

Create `src/screens/profile/components/profile-gift-info-modal.tsx`:

```tsx
import { t } from 'i18next';
import React from 'react';
import { Modal, StyleSheet, Text as ReactText, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';

export type ProfileGiftInfoVariant = 'locked' | 'claimed';

type ProfileGiftInfoModalProps = {
  visible: boolean;
  variant: ProfileGiftInfoVariant;
  percent: number;
  credits: number;
  onClose: () => void;
  onStart: () => void;
};

// The two gift states that can't be claimed right now, which previously only
// flashed a toast. `locked` explains what the gift is and offers a route into
// the profile questions; `claimed` just confirms it's already spent. Claiming
// itself stays in GiftClaimModal — this modal holds no state and calls no API,
// so the caller decides what "start" means.
const ProfileGiftInfoModal = ({
  visible,
  variant,
  percent,
  credits,
  onClose,
  onStart,
}: ProfileGiftInfoModalProps) => {
  const claimed = variant === 'claimed';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={Styles.wrapper}>
        <View style={Styles.card}>
          <View style={[Styles.iconChip, claimed && Styles.iconChipClaimed]}>
            {claimed ? (
              // gift-open-outline is a MaterialCommunityIcons glyph; Ionicons
              // has no open-gift equivalent.
              <MaterialCommunityIcons
                name="gift-open-outline"
                size={wp(7)}
                color={Colors.verified}
              />
            ) : (
              <Ionicons name="gift" size={wp(7)} color={Colors.primary} />
            )}
          </View>
          <Text variant="display" style={Styles.title}>
            {claimed
              ? LanguageKeys.giftClaimedTitle
              : LanguageKeys.giftInfoTitle}
          </Text>
          <ReactText style={Styles.body}>
            {claimed
              ? t(LanguageKeys.giftClaimedBody, { credits })
              : t(LanguageKeys.giftInfoBody, { percent, credits })}
          </ReactText>
          {claimed ? (
            <Button
              onPress={onClose}
              buttonStyle={Styles.singleButton}
              text={LanguageKeys.gotIt}
            />
          ) : (
            <View style={Styles.buttonRow}>
              <Button
                variant="outline"
                onPress={onClose}
                buttonStyle={Styles.button}
                text={LanguageKeys.maybeLater}
              />
              <Button
                onPress={onStart}
                buttonStyle={Styles.button}
                text={LanguageKeys.giftStartNow}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ProfileGiftInfoModal;

// Mirrors gift-claim-modal.tsx so the two gift dialogs read as one family.
const Styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: wp(4),
    padding: wp(5),
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconChip: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  iconChipClaimed: {
    backgroundColor: 'rgba(46,158,91,0.12)',
  },
  title: {
    color: Colors.ink,
    fontSize: Typography.medium1,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  body: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: hp(1),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2.5),
    width: '100%',
  },
  button: {
    flex: 1,
  },
  singleButton: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: hp(2.5),
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/profile/components/profile-gift-info-modal.test.tsx`
Expected: PASS — 6 tests, 1 suite.

- [ ] **Step 5: Verify types and lint**

Run: `yarn type-check && yarn lint src/screens/profile/components/profile-gift-info-modal.tsx src/screens/profile/components/profile-gift-info-modal.test.tsx`
Expected: type-check exit 0. Lint exit 0 (errors are not tolerated; warnings are).

- [ ] **Step 6: Commit**

```bash
git add src/screens/profile/components/profile-gift-info-modal.tsx src/screens/profile/components/profile-gift-info-modal.test.tsx
git commit -m "feat(profile): add gift explainer popup component"
```

---

### Task 4: Wire the popup into Header and delete the dead toast keys

**Files:**

- Modify: `src/screens/profile/Header.tsx` (imports, state, `onGiftBadgePress`, render)
- Modify: `src/languages/Keys.tsx:48-49`
- Modify: `src/languages/English.json:203-204`
- Modify: `src/languages/Urdu.json:197-198`
- Modify: `src/languages/RomanUrdu.json:200-201`

**Interfaces:**

- Consumes: `ProfileGiftInfoModal` + `ProfileGiftInfoVariant` from Task 3; `giftThreshold` / `giftCredits`, already read from `useSettingsStore()` at the top of `Header.tsx`.
- Produces: nothing.

`giftLockedHint` / `giftAlreadyClaimedHint` are deleted **in this task**, after their last consumer disappears in Step 3 — `Keys.tsx` is typed, so removing them earlier would fail `tsc`.

- [ ] **Step 1: Add the imports**

In `src/screens/profile/Header.tsx`, next to the existing `import GiftClaimModal from './components/gift-claim-modal';`, add:

```tsx
import ProfileGiftInfoModal, {
  type ProfileGiftInfoVariant,
} from './components/profile-gift-info-modal';
```

(Import order is enforced — run `yarn lint:fix` at the end of the task rather than placing it by hand.)

- [ ] **Step 2: Add the modal state**

Next to `const [giftModalVisible, setGiftModalVisible] = useState(false);` add. One nullable variant rather than two booleans, because the two popups are mutually exclusive and a single value can't drift into an impossible both-open state:

```tsx
const [giftInfoVariant, setGiftInfoVariant] =
  useState<ProfileGiftInfoVariant | null>(null);
```

- [ ] **Step 3: Replace the toasts with popup state**

`onGiftBadgePress` currently reads:

```tsx
const onGiftBadgePress = useCallback(() => {
  if (giftClaimed) {
    flashSuccessMessage(t(LanguageKeys.giftAlreadyClaimedHint));
    return;
  }
  if (!giftEligible) {
    flashErrorMessage(
      t(LanguageKeys.giftLockedHint, { percent: giftThreshold })
    );
    return;
  }
  setGiftModalVisible(true);
}, [giftClaimed, giftEligible, giftThreshold, t]);
```

Replace it with (note `giftThreshold` and `t` leave the dependency array — the modal now does that interpolation):

```tsx
const onGiftBadgePress = useCallback(() => {
  if (giftClaimed) {
    setGiftInfoVariant('claimed');
    return;
  }
  if (!giftEligible) {
    setGiftInfoVariant('locked');
    return;
  }
  setGiftModalVisible(true);
}, [giftClaimed, giftEligible]);
```

Also update the comment directly above it — it currently says locked/claimed taps "just explain the state" via a hint:

```tsx
// GiftBadge is tappable in all three states; only the eligible tap opens
// the claim modal — locked/claimed taps open the explainer popup instead.
```

Do **not** remove the `flashSuccessMessage` / `flashErrorMessage` imports: both are still used by `onChatCreditsPress` and `onMessagePress` in this file.

- [ ] **Step 4: Add the close/start handlers**

Next to `const closeGiftModal = useCallback(() => setGiftModalVisible(false), []);` add:

```tsx
const closeGiftInfo = useCallback(() => setGiftInfoVariant(null), []);

// `from: 'Home'` is what makes OnboardingProfile's exitFlow/bailFlow reset to
// BottomTab when the user leaves it, rather than continuing down the signup
// chain to ProfilePicture — correct for a flow entered from inside the app.
const onGiftInfoStart = useCallback(() => {
  setGiftInfoVariant(null);
  navigation.navigate('OnboardingProfile', { from: 'Home' });
}, [navigation]);
```

- [ ] **Step 5: Render the modal**

Directly after the existing `<GiftClaimModal ... />` element, add:

```tsx
<ProfileGiftInfoModal
  visible={giftInfoVariant !== null}
  variant={giftInfoVariant ?? 'locked'}
  percent={giftThreshold}
  credits={giftCredits}
  onClose={closeGiftInfo}
  onStart={onGiftInfoStart}
/>
```

- [ ] **Step 6: Delete the dead keys**

Now that `Header.tsx` no longer references them, remove these two lines from `src/languages/Keys.tsx`:

```ts
  giftLockedHint: 'giftLockedHint',
  giftAlreadyClaimedHint: 'giftAlreadyClaimedHint',
```

Remove from `src/languages/English.json`:

```json
    "giftLockedHint": "Reach {{percent}}% profile completion to unlock this gift",
    "giftAlreadyClaimedHint": "You've already claimed this gift",
```

Remove from `src/languages/Urdu.json`:

```json
    "giftLockedHint": "یہ تحفہ حاصل کرنے کے لیے اپنا پروفائل {{percent}}% مکمل کریں",
    "giftAlreadyClaimedHint": "آپ یہ تحفہ پہلے ہی حاصل کر چکے ہیں",
```

Remove from `src/languages/RomanUrdu.json`:

```json
    "giftLockedHint": "Yeh gift hasil karne ke liye apna profile {{percent}}% mukammal karein",
    "giftAlreadyClaimedHint": "Aap yeh gift pehle hi hasil kar chuke hain",
```

- [ ] **Step 7: Confirm the deleted keys have no remaining references**

Run: `git grep -n "giftLockedHint\|giftAlreadyClaimedHint" -- src`
Expected: **no matches** (exit code 1, no output). If anything matches, that consumer must be migrated before the keys can go.

- [ ] **Step 8: Fix import order, then verify everything**

Run: `yarn lint:fix src/screens/profile/Header.tsx`
Then run: `yarn type-check && yarn lint src/screens/profile/Header.tsx src/languages && npx jest src/screens/profile`
Expected: type-check exit 0; lint exit 0 with no errors; jest — all profile suites pass, including the new `profile-gift-info-modal` suite and the existing `gift-status` / `gift-claim-outcome` suites.

- [ ] **Step 9: Commit**

```bash
git add src/screens/profile/Header.tsx src/languages/Keys.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
git commit -m "feat(profile): open gift explainer popup instead of toast"
```

---

### Task 5: Full verification

**Files:** none modified (unless a check fails).

- [ ] **Step 1: Run the full check suite**

Run: `yarn check-all`
Expected: lint has **no errors** (a large pre-existing warning count is normal and not a regression); type-check exit 0; jest all suites pass.

If jest reports pre-existing failures in suites this branch never touched, confirm they also fail on `staging` (`git stash && git checkout staging && npx jest <suite>`) before treating them as this branch's problem — `app-old/CLAUDE.md` claims jest is broken, which was found to be stale for the profile suites but may still hold elsewhere.

- [ ] **Step 2: Manual verification on device**

Per `feedback_dont_run_native_builds`, **do not run the native build via tooling** — hand these steps to the user:

```sh
yarn start        # then reload the app
```

Check, on the ME profile tab:

1. At low profile strength the gift sits at the **right end** of the strength bar and does **not** move as strength changes (previously it tracked the fill and collided with the "Profile strength N%" label).
2. Tapping the locked (muted) gift opens the popup — **not** a toast. "Maybe Later" dismisses it; "Start now" lands in the profile questions, and backing out returns to the bottom-tab app rather than the signup chain.
3. With a claimed gift, the green open-gift badge is now visible (it used to disappear entirely) and taps open the "Gift claimed" popup with a single "Got it".
4. At ≥90% strength and unclaimed, the wiggling gift still opens the existing claim modal, unchanged.
5. Switch to Urdu: the badge mirrors to the **left** end of the bar and the popup copy reads correctly RTL.

- [ ] **Step 3: Report results and hand off**

Report the actual command output. Do not claim success for any step whose output was not observed. Then use `superpowers:finishing-a-development-branch` to decide how this branch integrates (staging-first — this repo merges to `staging`, never directly to `main`).
