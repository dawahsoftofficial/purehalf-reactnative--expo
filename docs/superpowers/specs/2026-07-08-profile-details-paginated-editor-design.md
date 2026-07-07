# Pure Half - Profile Details Paginated Editor (Design Spec)

**Date:** 2026-07-08
**Scope:** Convert the self-profile detail group editor in the Me section from a long category form into a one-question-at-a-time guided flow. Apply the flow to all profile detail groups opened from the Me hub. Do not change profile data, API contracts, existing attribute options, or other-user profile display.
**Approved via:** visual companion option A and follow-up approval ("Yeah to all. Looks alright to me.").

---

## 1. Problem

The Me section now presents profile details as a clean hub, but opening a detail group still shows the full group as one long edit screen. Lifestyle is the clearest example: it has 11 fields, so the screen feels tedious even though many answers are simple selections.

Users should feel like they are moving quickly through small decisions, not filling a large form.

## 2. Goal

- Replace the long `EditProfileGroup` field list with a guided editor.
- Show one question per step.
- Use answer tags for simple choice fields wherever possible.
- Keep existing pickers for large option lists and height/weight scale fields.
- Save once at the end through the existing `updateDetails(formData)` path.
- Apply this consistently to all Me profile detail groups:
  - Appearance & Health
  - Family Background
  - Lifestyle
  - Islamic Values
  - Personality & Requirements
  - Future Plans

## 3. User Experience

### 3.1 Screen structure

Each group opens into the existing `EditProfileGroup` route, but the content changes from a scrolling list to a single active question:

- Header: existing back header with the group title.
- Progress label: for example, `Lifestyle - 1 of 11`.
- Progress bar: filled by the current step index.
- Question title: the field title from `Data.tsx`.
- Answer control:
  - Tags for short option lists and binary yes/no.
  - Existing picker button for long dropdowns.
  - Existing `HeightWeightPicker` for `scalling` fields.
  - Existing input control for text fields.
- Footer actions:
  - First step: `Skip` and `Next`.
  - Middle steps: `Back`, `Skip`, and `Next`.
  - Last step: `Back`, `Skip`, and `Save`.

### 3.2 Navigation behavior

- Selecting an answer updates local `formData` immediately.
- `Next` advances to the next visible field.
- `Back` returns to the previous visible field without losing local changes.
- `Skip` leaves the current field as-is and advances.
- `Save` calls `updateDetails(formData)` once, then updates `currentUser`, storage, and returns to the Me hub.

### 3.3 Hidden fields

The existing gender-specific visibility rules must stay intact:

- Hide `doYouHaveABeard` for female users.
- Hide `hijab-0` for male users.
- Hide `Widowed` from male marital-status options.

Progress and step counts should count only visible fields.

## 4. Architecture

### 4.1 Reuse existing route

Update `src/screens/profile/EditProfileGroup.tsx` in place. The route signature remains:

```ts
navigation.navigate('EditProfileGroup', {
  title: group.title,
  data: categoriesData?.[group.key] ?? [],
});
```

No navigation contract change is needed from `Profile.tsx` or `profile-hub.tsx`.

### 4.2 Local state model

Keep the existing local `formData` array initialized from route params. Add:

- `visibleFields`: memoized list of fields after gender filtering.
- `activeIndex`: current visible field index.
- `activeItem`: `visibleFields[activeIndex]`.

All update handlers should continue mutating `formData` by stable item identity (`id` or title where currently used), so final save payload stays compatible with `updateDetails`.

### 4.3 Control rendering

Refactor the current `renderItem` logic into a single `renderActiveControl(item)` function:

- `input`: render `IconInput`.
- `scalling`: render the existing scale/value picker row.
- `dropDownBinary`: render tags.
- `dropDown` with 2-5 local options: render tags.
- `dropDown` with larger or lazily loaded options: render `PickerButton`.

The current tag behavior is select-only. That should remain for this pass unless there is already an established clear-answer pattern elsewhere.

### 4.4 Pickers

Keep the existing `Picker` and `HeightWeightPicker` modals. Picker selection updates the active item and closes the modal. The user then presses `Next` or `Save`, keeping the flow controlled and predictable.

## 5. Data Flow

Core data flow is unchanged:

1. Me hub passes the selected group data to `EditProfileGroup`.
2. `EditProfileGroup` deep-copies route data into `formData`.
3. User moves through fields and updates local selections.
4. Final save calls `updateDetails(formData)`.
5. On success:
   - Merge returned detail into `currentUser`.
   - Persist to `StorageManager.storageKeys.USER`.
   - Call `updateCurrentUser(updatedUser)`.
   - Navigate back.
6. Profile refetch on focus updates hub previews/counts.

No admin/API change is needed.

## 6. i18n

Reuse existing labels where available:

- `update`
- `updating`
- `notYetProvided`
- existing field titles from `Data.tsx`

Add keys for any new footer/progress labels not already present:

- `next`
- `back`
- `skip`

Update English, Roman Urdu, and Urdu locale files if keys are missing.

## 7. Error Handling

- Existing save failure behavior can remain: stop loading and keep the user on the editor.
- Picker API failures for language/nationality keep the existing loader/failure behavior.
- If a group has no visible fields, show a simple empty state and keep a back action. This should be rare but prevents a blank screen.

## 8. Testing

Manual verification should cover:

- Lifestyle flow shows `1 of 11` for the expected user gender and advances through all fields.
- Back/Next/Skip preserve selections.
- Tags select the correct option for yes/no and short dropdown fields.
- Long dropdowns still open the existing picker.
- Height/weight still open the existing height/weight picker.
- Male users do not see hijab, and female users do not see beard.
- Male marital status does not include `Widowed`.
- Save updates the Me hub preview/count after returning.
- Other-user profile view remains unchanged.

Automated coverage can focus on pure helpers if extracted:

- visible field filtering.
- progress label/count calculation.
- tag eligibility for option fields.

## 9. Risks

- **More screens/taps:** One-question pacing is easier cognitively but can add taps. This is intentional for now because the approved direction prioritizes perceived speed and simplicity.
- **Text inputs:** Long text fields in Personality may feel slower one at a time. Keep controls polished and allow Skip to reduce friction.
- **Picker-heavy groups:** Some fields still need modal pickers because option lists are too large for tags. The flow should still feel guided because only one picker field is presented at a time.
- **State mismatch:** Visible fields are derived from `formData`; updates must always write back to `formData`, not only to the visible projection.

## 10. Rollout Order

1. Extract field visibility and progress helpers inside `EditProfileGroup.tsx` or a small local helper file.
2. Replace the `FlatList` with the guided single-question layout.
3. Reuse/refactor current field rendering into active-control rendering.
4. Wire footer navigation and final save.
5. Add missing i18n keys.
6. Verify the flows listed in the testing section.
