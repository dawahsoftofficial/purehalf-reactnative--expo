# Profile Picture Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the onboarding "Add your profile picture" screen more visual hierarchy — the upload circle becomes a clear "drop zone" and the guidelines trigger stops competing with it for attention.

**Architecture:** Pure styling/JSX changes to two existing presentational components. No new files, no prop/interface changes, no logic changes.

**Tech Stack:** React Native 0.82, TypeScript, `react-native-vector-icons/Ionicons`, `react-native-material-ripple`, existing `Colors`/`Fonts`/`Typography`/`wp`/`hp` tokens from `src/res` and `src/global`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-11-profile-picture-screen-redesign-design.md`
- Only `profile-picture-header.tsx` and `profile-picture-upload.tsx` change. `ProfilePicture.tsx`, `guidelines-modal.tsx`, `upload-progress.tsx` stay untouched.
- Title/subtitle copy and the "Tap to upload" / "Tap to change your photo" caption text stay word-for-word unchanged.
- Use `wp()`/`hp()` for all sizing — no raw pixel values (per `app-old/CLAUDE.md`).
- Icon set stays `Ionicons` (already imported in both files) — use `camera-outline`, an icon name already in use elsewhere in this codebase (`src/components/pickers/ImagePicker.tsx:118`), not an icon name from a different icon font.
- No step-progress indicator (explicitly out of scope per spec).
- `yarn type-check` must stay clean (it is clean today per `app-old/CLAUDE.md`).

---

### Task 1: Header — pill button becomes inline text link

**Files:**

- Modify: `src/screens/profilePicture/components/profile-picture-header.tsx`

**Interfaces:**

- Consumes: nothing new — same `ProfilePictureHeaderProps` (`onGuidelinesPress: () => void`), unchanged.
- Produces: nothing consumed by other tasks — Task 2 is independent.

- [ ] **Step 1: Replace the `guidelinesBtn` Ripple styling and `guidelinesText` style**

In `src/screens/profilePicture/components/profile-picture-header.tsx`, replace the `Styles.guidelinesBtn` and `Styles.guidelinesText` definitions:

```ts
const Styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  title: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large1,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    lineHeight: wp(5.4),
    marginTop: hp(1),
    maxWidth: wp(80),
  },
  guidelinesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginTop: hp(2),
  },
  guidelinesText: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    textDecorationLine: 'underline',
  },
});
```

This drops `backgroundColor: Colors.lavender`, `paddingVertical`, `paddingHorizontal`, and `borderRadius: 999` (no more pill fill), and adds `textDecorationLine: 'underline'` on the label so it still reads as tappable without a filled background.

- [ ] **Step 2: Shrink the icon and drop the ripple border radius (no longer a pill)**

In the same file, update the `Ripple` and `Ionicons` JSX:

```tsx
<Ripple style={Styles.guidelinesBtn} onPress={onGuidelinesPress}>
  <Ionicons
    name="shield-checkmark-outline"
    size={wp(3.6)}
    color={Colors.primary}
  />
  <Text style={Styles.guidelinesText}>View photo guidelines</Text>
</Ripple>
```

(Removed the `rippleContainerBorderRadius={999}` prop — that was sized for the old pill shape; a plain ripple works for an inline text link. Icon size trimmed from `wp(4)` to `wp(3.6)` to match the smaller, quieter treatment.)

- [ ] **Step 3: Type-check**

Run: `cd app-old && yarn type-check`
Expected: no errors (exits 0, no output beyond the tsc invocation).

- [ ] **Step 4: Manual visual check**

Run the app (`yarn android` or `yarn ios`) or Metro + existing simulator, navigate to the profile-picture onboarding screen, and confirm:

- "View photo guidelines" now renders as underlined text with a small shield icon, no lavender fill/pill shape behind it.
- Tapping it still opens the guidelines modal (`guidelines-modal.tsx`) — behavior unchanged, only the trigger's appearance changed.

- [ ] **Step 5: Commit**

```bash
git add src/screens/profilePicture/components/profile-picture-header.tsx
git commit -m "style(profile-picture): turn guidelines pill into inline text link"
```

---

### Task 2: Upload circle — dashed drop-zone ring + camera placeholder icon

**Files:**

- Modify: `src/screens/profilePicture/components/profile-picture-upload.tsx`

**Interfaces:**

- Consumes: nothing new — same `ProfilePictureUploadProps` (`imageUri: string`, `onPress: () => void`), unchanged.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Switch the empty-state icon from `person` to `camera-outline`**

In `src/screens/profilePicture/components/profile-picture-upload.tsx`, change:

```tsx
<Ionicons name="person" size={wp(26)} color={Colors.primaryLite} />
```

to:

```tsx
<Ionicons name="camera-outline" size={wp(22)} color={Colors.primaryLite} />
```

(Icon shrinks slightly from `wp(26)` to `wp(22)` — `camera-outline`'s glyph is visually wider than `person` at the same size and looked crowded against the ring at the old size during review.)

- [ ] **Step 2: Change the ring from a solid border to a dashed drop-zone border**

In the same file, update the `Styles.ring` definition:

```ts
ring: {
  width: RING,
  height: RING,
  borderRadius: RING / 2,
  backgroundColor: Colors.lavender,
  borderWidth: 2,
  borderColor: Colors.primaryLite,
  borderStyle: 'dashed',
  alignItems: 'center',
  justifyContent: 'center',
},
```

(Only `borderColor` and `borderStyle` change — from `Colors.hairline` solid to `Colors.primaryLite` dashed. `backgroundColor: Colors.lavender` and everything else stays as-is, including the `hasImage` branch that renders the full-bleed `Image` — the dashed border still shows around a selected photo, same as the old solid border did.)

- [ ] **Step 3: Type-check**

Run: `cd app-old && yarn type-check`
Expected: no errors.

- [ ] **Step 4: Manual visual check**

In the running app, on the profile-picture screen, confirm:

- Empty state: ring shows a dashed `Colors.primaryLite` border around a lavender-filled circle with a centered outline camera icon (not the old person silhouette), and the add-badge (bottom-right `+`) still renders on top of it.
- After picking a photo: the photo fills the circle as before, the dashed border still frames it, and the badge icon swaps to the camera icon (existing `hasImage` logic — unchanged).
- Caption still reads "Tap to upload" / "Tap to change your photo" depending on state.

- [ ] **Step 5: Commit**

```bash
git add src/screens/profilePicture/components/profile-picture-upload.tsx
git commit -m "style(profile-picture): dashed drop-zone ring and camera placeholder icon"
```
