# Profile picture screen redesign

## Context

The onboarding "Add your profile picture" screen (`src/screens/profilePicture/`) reads as flat and low-hierarchy: a solid-fill circle with a generic person-silhouette placeholder, and a lavender pill button for "View photo guidelines" that competes visually with the upload circle. This is a visual-only pass — no changes to upload logic, navigation, or the guidelines modal's own content.

## Scope

Two files only:

- `src/screens/profilePicture/components/profile-picture-header.tsx`
- `src/screens/profilePicture/components/profile-picture-upload.tsx`

`ProfilePicture.tsx`, `guidelines-modal.tsx`, and `upload-progress.tsx` are unchanged.

## Design

**Header**

- Title/subtitle copy unchanged.
- "View photo guidelines" trigger changes from a filled lavender pill to an inline text link: `shield-check` icon (16px) + "Photo guidelines" text, `Colors.primary`, no background fill or border. Reduces visual competition with the upload circle, which becomes the primary focal point.

**Upload circle**

- Fill switches from solid `Colors.lavender` to a dashed-border ring (`Colors.primaryLite`, `borderStyle: 'dashed'`) around a `Colors.lavender` fill — reads as a drop zone rather than a static avatar placeholder.
- Placeholder icon switches from `person` to `camera-plus` (`Colors.primaryLite`), signaling "add a photo" more directly than a generic silhouette.
- Badge overlay (bottom-right add/camera icon on `Colors.primary` circle) is unchanged — it already correctly swaps between `add` and `camera` based on whether a photo is selected.
- Caption text ("Tap to upload" / "Tap to change your photo") unchanged.
- When an image is already selected, the dashed ring and placeholder icon are not shown — the selected `Image` fills the circle as it does today. Only the empty-state placeholder changes.

**Explicitly out of scope** (from earlier discussion): no step-progress indicator — dropped because tying it to real onboarding position needs broader flow analysis, and a decorative one would be misleading.

## Testing

Manual visual check only (RN styling change, no new logic): confirm both empty and photo-selected states render correctly, and that tapping "Photo guidelines" still opens `guidelines-modal.tsx`.
