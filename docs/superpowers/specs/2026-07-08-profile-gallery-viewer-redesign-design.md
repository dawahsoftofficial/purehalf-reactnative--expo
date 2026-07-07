# Profile Gallery Viewer Redesign

## Context

The profile gallery is opened from another user's profile through `ImageViewer` with `navigation.navigate('ImageViewer', { userData })`. It currently uses a black full-screen viewer, `SwiperFlatList`, large left/right controls, and dot pagination. It works functionally, but the presentation feels unfinished: there is no profile context, no visible photo count, no thumbnail browsing, and the private-photo access state looks like a plain locked error state instead of a deliberate product moment.

The approved direction is the richer gallery redesign shown in the Superpowers browser mockup on July 8, 2026: an immersive mobile photo viewer with profile context, photo count, thumbnail navigation, and a polished private-photo panel.

## Goals

- Make the other-user gallery feel premium, intentional, and consistent with the app's refreshed profile header style.
- Let members browse with both swipe gestures and thumbnail taps.
- Replace arrow and dot controls with a clearer thumbnail rail and count pill.
- Preserve existing photo access behavior and API contracts.
- Improve empty, loading, locked, request-sent, and image-error states.

## Non-Goals

- No REST API changes.
- No changes to profile routing or the `ImageViewer` route name.
- No changes to guardian/wali flows.
- No new photo upload or moderation behavior.
- No paywall, monetization, or membership-gating change.
- No broad profile screen refactor outside the gallery entry point if a small parameter improvement is needed.

## User Experience

The gallery opens as a full-screen photo viewer. The active image fills the screen with `cover`-style framing and subtle dark gradients at the top and bottom so controls remain readable. A top glass-style bar contains a back button, a concise title such as the member's photos, and lightweight gallery context. A count pill shows the current position, for example `2 / 6`.

The bottom of the screen contains a compact thumbnail rail. Tapping a thumbnail jumps directly to that image. Swiping the main image updates the active thumbnail and count. The thumbnail rail replaces the current large arrows and dot strip.

When private photos exist but access has not been granted, a locked item remains in the gallery sequence. It appears as a locked thumbnail and as a full-slide locked panel when selected. The locked panel explains that private photos require access and offers the existing request action. If access has already been requested, the CTA becomes a disabled/status-style control. If access is granted, private images load into the same sequence and thumbnail rail.

If no images are available, the screen shows a branded empty state with a back control and a short message. If an individual image fails to load, that slide shows a contained fallback rather than breaking the whole viewer.

## Data Flow

`ImageViewer` continues to receive `userData` from route params.

The existing media composition rules remain:

- Public gallery images are shown first when present.
- If the viewed user has private photos and the current viewer does not have access, a locked gallery item is added.
- If the current viewer is viewing their own profile, private gallery images are included directly when available.
- If `photo_access_action === 2` for another user, `ApiServices.viewPrivateMedia(userData.id)` loads private gallery images and appends them to the sequence.
- `ApiServices.privatePhotoAccessRequest(userData.id)` remains the request-access action.

The implementation should normalize these variants into a small internal item model instead of mixing raw strings and the `'privateImage'` sentinel throughout rendering. A suitable model is:

```ts
type GalleryItem =
  | { type: 'image'; id: string; uri: string; private?: boolean }
  | { type: 'locked-private'; id: 'locked-private' };
```

## Component Structure

The work should stay centered in `src/components/ImageViewer.tsx`. The component can be reorganized internally into small render helpers:

- `buildGalleryItems`: converts `userData.media` and private media responses into renderable gallery items.
- `renderSlide`: renders either an image slide, locked-private slide, or image-error fallback.
- `renderTopBar`: renders back button, title/context, and count pill.
- `renderThumbnail`: renders image thumbnails and the locked-private thumbnail.
- `renderEmptyState`: renders the redesigned no-images state.
- `renderLockedPrivatePanel`: renders private access explanation and CTA state.

Extracting new files is not required. If the file becomes hard to read, small local helper components inside `ImageViewer.tsx` are acceptable.

## Controls And State

State should track:

- `galleryItems`: normalized list of image and locked-private items.
- `activeIndex`: current slide index.
- `loader`: existing modal loader state for initial and request-access loading.
- `loadingImageIds`: per-image loading state, so one image load does not obscure all slides.
- `failedImageIds`: per-image error state.
- Existing alert visibility for `PrivacyProtectedAlert` and `RequestSentAlert`, unless the implementation can preserve behavior with the redesigned panel alone.

Swipe gestures update `activeIndex`. Thumbnail taps call the current slider's `scrollToIndex` behavior and update the active visual state. The implementation may keep `SwiperFlatList` if it supports reliable programmatic index changes. If it proves awkward for thumbnail jumping or active-index synchronization, switching to an existing dependency such as `react-native-reanimated-carousel` is acceptable because it is already in the app.

## Visual Design

Use existing app tokens from `Colors`, `Fonts`, `Typography`, `wp`, and `hp`.

The palette should stay mostly dark for the immersive viewer, but avoid a flat black-only design:

- Background: near-black or black.
- Overlays: translucent dark/glass surfaces using existing black/white RGBA tokens where possible.
- Primary CTA: white or brand-primary treatment, depending on contrast.
- Locked/private accents: brand violet and lavender tokens.
- Text: white for controls on image, muted white for secondary context.

The design should avoid oversized floating arrows. Touch controls should be compact icon buttons with stable dimensions. Thumbnails should have fixed aspect ratio and active border treatment so layout does not shift while browsing.

## Error Handling

- If route params are missing or `media` is absent, hide the loader and show the empty state.
- If `viewPrivateMedia` fails, keep public images and any locked state that was already known.
- If `privatePhotoAccessRequest` fails, hide the loader and keep the locked CTA available.
- If one image fails to load, mark only that image as failed and show a fallback on that slide and thumbnail.
- If thumbnail tap targets an out-of-range index due to async updates, ignore it safely.

## Accessibility And RTL

The back button, request button, thumbnails, and locked-photo control should remain comfortably tappable. Text should fit in compact surfaces with `numberOfLines` where appropriate. The viewer should respect the app's RTL direction where practical, especially top-bar alignment and back icon direction if `CheckRtl` is used.

## Verification

Run:

```sh
yarn type-check
```

Also run focused lint if practical:

```sh
npx eslint src/components/ImageViewer.tsx
```

Manual verification states:

- Public gallery only.
- Public gallery plus locked private photos.
- Private access request not yet sent.
- Private access already requested.
- Private access granted.
- Current user's own public and private gallery.
- Empty gallery.
- Individual image load failure.
- Thumbnail tap changes slide and active count.
- Swipe changes thumbnail active state and count.

## Implementation Boundary

This redesign should not modify API services, language files, profile routing, guardian/wali features, or admin behavior unless the implementation reveals a concrete compile-time requirement. Any strings already present in `LanguageKeys` should be reused. New visible strings should be added through the existing translation system only if no suitable key exists.
