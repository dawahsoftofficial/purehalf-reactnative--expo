# Chat Audio Messages Design

Date: 2026-07-05

## Scope

Add voice-note audio messages to the mobile app and Laravel chat APIs. This phase covers sending, receiving, private storage, playback, Pusher/API resource payloads, and mobile chat UI. Admin panel UI adjustments are intentionally deferred to a later phase, while API/resource compatibility must prevent the existing admin monitor from breaking.

Voice notes are recorded inside chat only. Users cannot attach existing audio files from the phone in this phase.

## Decisions

- Interaction model: Option B visual direction, adapted to tap-based recording.
- Recording flow: first mic tap starts recording; second send tap stops and sends.
- Maximum duration: 60 seconds.
- Storage: private DigitalOcean Spaces objects.
- API approach: extend the existing send-message endpoint to accept either JSON text messages or multipart audio messages.
- Playback: authenticated API endpoint verifies conversation access before returning a short-lived signed URL.

## API Contract

`POST /auth/conversations/{conversation}/messages` supports two payload shapes.

Text messages:

```http
Content-Type: application/json
```

```json
{
  "type": "text",
  "body": "Assalamu alaikum"
}
```

Audio messages:

```http
Content-Type: multipart/form-data
```

Fields:

- `type=audio`
- `audio=<file>`
- `duration_seconds=<1..60>`

Validation:

- Caller must be a participant in the conversation.
- `type` must be `text` or `audio`; omitted type remains compatible with existing clients and is treated as `text`.
- Text messages require non-empty `body`.
- Audio messages require an uploaded audio file and a duration between 1 and 60 seconds.
- Audio MIME/type is restricted to `audio/mp4`, `audio/m4a`, and `audio/x-m4a`.
- Audio file size is capped at 10 MB.

Playback endpoint:

```http
GET /auth/conversations/messages/{message}/audio
```

Rules:

- Caller must be a participant in the message conversation.
- Message must have `type=audio` and an audio object path.
- Response returns a signed URL that expires after 5 minutes.

## Storage And Data Model

Audio files are stored privately in DigitalOcean Spaces at:

```text
{DIGITALOCEAN_FOLDER}/chat-audio/{conversation_id}/{message_uuid}.m4a
```

The `messages` table keeps metadata, not public audio URLs:

- `type`
- `body`
- `audio_path`
- `audio_duration_seconds`
- `audio_mime`
- `audio_size_bytes`

For audio messages, `body` is set to `Voice message` so existing conversation previews, notifications, and older consumers have a safe fallback.

`MessageResource`, `ConversationResource`, and `MessageSent` broadcast payloads include audio metadata for `type=audio`. They must keep the current text-message fields unchanged.

## Mobile UX

In `SingleChat`, when the text input is empty, the send button becomes a mic button.

Recording flow:

1. User taps the mic button.
2. App requests microphone permission if needed.
3. Composer transforms into the selected recording bar with cancel, timer, live level/wave display, and send.
4. User taps send to stop recording and upload.
5. User taps cancel to discard.

At 60 seconds, recording auto-stops and moves to a ready-to-send state. It does not auto-send.

Audio bubble behavior:

- Outgoing optimistic bubble appears while uploading, with spinner/progress.
- Failed uploads keep a draft/error bubble with retry and delete controls.
- Received/sent audio bubbles show play/pause, duration, playback progress, timestamp, and existing read/delivered ticks.
- Conversation list preview shows `Voice message`, optionally with a mic icon where the current UI makes that practical.

Permission/error behavior:

- If microphone permission is denied, show a short translated error and keep the normal text composer.
- While an audio message is uploading, do not allow starting another recording in the same chat.
- Existing block, guardian/wali, unread/read/delivered, Pusher, and chat-credit behavior remains unchanged.

## Implementation Boundary

Mobile app changes in `app-old/`:

- Add an audio recorder/player wrapper service.
- Use `react-native-nitro-sound` for recording/playback unless native build verification shows incompatibility. Because the current app has `react-native-nitro-modules` 0.32.0 and `react-native-nitro-sound` requires 0.35.4 or newer, the implementation plan must include that dependency bump and native verification.
- Add or cleanly branch an audio message bubble for `type === "audio"`.
- Extend `message-services.tsx` and message API types for multipart audio payloads and audio metadata.
- Add Android `RECORD_AUDIO` permission and iOS microphone usage text.
- Add translations for audio errors/states.

API changes in `admin/`:

- Add migration for audio metadata columns on `messages`.
- Update `SendMessage` validation for text vs audio payloads.
- Update `ConversationController` and `ConversationService` to pass type/file metadata and store private audio objects.
- Update `MessageResource`, `ConversationResource`, and `MessageSent` payloads.
- Add private playback route and controller/service handling.
- Keep text-message requests backward-compatible.

## Testing

API tests:

- Existing JSON text send still works when `type` is omitted.
- JSON text send works with `type=text`.
- Audio send rejects missing file, unsupported MIME, zero/over-60 duration, and non-participants.
- Audio send stores a private object path and creates a `type=audio` message with metadata.
- Playback endpoint denies non-participants.
- Playback endpoint succeeds for participants and does not expose a permanent public URL.
- Message resource and Pusher payload include audio metadata.

Mobile tests:

- API service builds JSON for text and multipart form data for audio.
- Audio message rendering switches on `type=audio`.
- Composer shows mic when text is empty and send when text is present.
- Recording state shows timer/cancel/send and handles max duration.
- Upload failure shows retry/delete state.

Manual verification:

- Send and receive an audio message in an existing conversation.
- Start a new conversation with text still works.
- Audio playback works after reopening the chat.
- Conversation list preview updates to `Voice message`.
- Blocked participant and wali/guardian chat views remain intact.

## Deferred

- Admin panel audio playback/moderation UI.
- Attaching existing audio files.
- Transcription.
- Waveform generated from real amplitude samples persisted on the backend.
- Resumable/background uploads.
