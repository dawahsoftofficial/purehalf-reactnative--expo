# Profile intro video and voice design

## Outcome

Members can record a short video and voice introduction from their profile. Each clip is independently moderated before other members can play it, without changing the approval state of the rest of the profile.

## Member experience

- The single-profile screen shows two compact media cards: video and voice.
- On the member's own profile, an empty card says **Record video** or **Record voice**. A submitted card changes to **Change video/voice** and shows its own Pending review, Approved, or Needs changes status.
- Members may replace pending, approved, or rejected media. Every replacement returns only that media item to Pending review.
- On another member's profile, a media card is shown only when that item is approved. The actions are **Watch video** and **Hear voice**.
- Video recording uses a dedicated camera-style screen, the front camera by default, a 10-second limit, camera flip, cancel, retake, preview, and submit controls.
- Voice recording uses a dedicated waveform screen with a large red record/stop control, 10-second timer, cancel, retake, playback, and submit controls.
- Video and voice can each be disabled independently through server settings. Disabled media is neither recordable nor visible to other members.

## Moderation and data contract

- `user_media` keeps the existing `intro_video` and `intro_voice` URLs and adds an independent status and rejection reason for each.
- Status values are `pending`, `approved`, `rejected`, or null when no media exists.
- Uploading intro media sets that item's status to `pending` and clears its rejection reason. Deleting it clears both.
- Profile approval fields on `users` are not changed by intro-media uploads or deletions.
- The admin Profile changes review queue also includes members with pending intro media. Each pending player has its own Approve and Reject action.
- Member-facing profile resources expose intro media only when its status is approved and the corresponding feature setting is enabled. The owner still receives the raw URL/status so they can preview or replace it.
- Both client and API enforce a maximum duration of 10 seconds.

## Settings

- `profile_intro_video_enabled` controls video recording and playback.
- `profile_intro_voice_enabled` controls voice recording and playback.
- Both default to enabled and use the existing admin Settings editor and public settings API.

## Visual direction

The buttons use the current Pure Half surface, lavender, primary-purple, and status colors. They are equal-width rounded cards with a circular media icon, a strong action label, a short supporting line, and a small state pill. Pending uses an amber clock, approved uses a green check, and rejected uses a red alert icon.
