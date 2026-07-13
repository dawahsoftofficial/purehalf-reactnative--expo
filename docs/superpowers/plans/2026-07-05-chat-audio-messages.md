# Chat Audio Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private in-chat voice-note sending, receiving, and playback to the React Native app and Laravel chat APIs.

**Architecture:** Laravel remains the source of truth for chat messages, message metadata, private audio object paths, and participant authorization. Mobile records a local 60-second voice note, uploads it through the existing send-message endpoint as multipart form data, and plays audio through authenticated short-lived playback URLs. Pusher payloads and conversation resources include audio metadata while keeping current text fields backward-compatible.

**Tech Stack:** Laravel 9, MySQL, DigitalOcean Spaces S3 disk, Pusher, React Native 0.82, TypeScript, Jest, `react-native-nitro-sound`, `react-native-nitro-modules`.

---

## Preconditions

- Work in both existing Git repos, not the non-Git workspace root:
  - API: `D:\GitHub\Pure Half\admin`
  - Mobile: `D:\GitHub\Pure Half\app-old`
- Both repos already contain unrelated dirty changes. Stage only files named in each task.
- Use TDD for behavior changes: write the test, run it and confirm the expected failure, implement the smallest production change, rerun the test.
- Keep admin panel UI changes out of this pass.

## File Structure

API files:

- Create: `admin/database/migrations/2026_07_05_000000_add_audio_columns_to_messages_table.php`
  Adds audio metadata columns to the existing `messages` table.
- Modify: `admin/app/Models/Message.php`
  Adds audio metadata to `$fillable` and casts duration/size as integers.
- Modify: `admin/app/Http/Requests/Api/SendMessage.php`
  Validates text and audio send payloads.
- Modify: `admin/app/Http/Controllers/Api/ConversationController.php`
  Passes validated audio request data into the service and adds the playback action.
- Modify: `admin/app/Http/Services/ConversationService.php`
  Stores audio messages, private audio object paths, message statuses, unread counters, and conversation previews.
- Modify: `admin/app/Http/Services/UploadService.php`
  Adds private chat-audio upload and temporary URL helpers.
- Modify: `admin/app/Http/Interfaces/UploadInterface.php`
  Adds storage methods needed by the upload service.
- Modify: `admin/app/Http/Repositories/UploadRepository.php`
  Writes private objects and returns temporary URLs from stored paths.
- Modify: `admin/app/Http/Resources/MessageResource.php`
  Emits audio metadata.
- Modify: `admin/app/Events/Conversation/MessageSent.php`
  Broadcasts audio metadata and uses `Voice message` preview.
- Modify: `admin/routes/api.php`
  Adds the authenticated playback route.
- Create: `admin/tests/Feature/ConversationAudioMessageTest.php`
  Covers text compatibility, audio send validation/storage, and participant-only playback.

Mobile files:

- Modify: `app-old/package.json` and lockfile
  Adds `react-native-nitro-sound` and bumps `react-native-nitro-modules`.
- Modify: `app-old/android/app/src/main/AndroidManifest.xml`
  Adds `android.permission.RECORD_AUDIO`.
- Modify: `app-old/ios/PureHalf/Info.plist`
  Adds `NSMicrophoneUsageDescription`.
- Modify: `app-old/src/services/api/types/message-types.tsx`
  Adds audio metadata and audio-send payload types.
- Modify: `app-old/src/services/api/EndPoints.tsx`
  Adds the message audio playback endpoint helper.
- Modify: `app-old/src/services/api/message-services.tsx`
  Adds multipart audio send and playback URL helpers.
- Create: `app-old/src/services/audio/chat-audio-service.ts`
  Wraps recording/playback library calls behind a small app-owned interface.
- Create: `app-old/src/screens/messages/components/AudioMessageBubble.tsx`
  Renders audio playback controls inside chat bubbles.
- Create: `app-old/src/screens/messages/components/VoiceRecorderBar.tsx`
  Renders the tap-to-record/tap-to-send composer state.
- Modify: `app-old/src/screens/messages/components/MessageBubble.tsx`
  Delegates `type=audio` messages to `AudioMessageBubble`.
- Modify: `app-old/src/screens/messages/SingleChat.tsx`
  Manages recording state, upload state, and composer switching.
- Modify: `app-old/src/screens/messages/SingleChat.styles.ts`
  Adds compact voice-note styles using existing theme tokens.
- Modify: `app-old/src/screens/messages/Messages.tsx`
  Shows `Voice message` preview for audio last messages.
- Modify: `app-old/src/languages/English.json`, `RomanUrdu.json`, `Urdu.json`, `Keys.tsx`
  Adds user-visible audio states and errors.
- Create: focused Jest tests next to the changed mobile modules.

---

### Task 1: API Audio Metadata Migration And Resource Shape

**Files:**

- Create: `admin/database/migrations/2026_07_05_000000_add_audio_columns_to_messages_table.php`
- Modify: `admin/app/Models/Message.php`
- Modify: `admin/app/Http/Resources/MessageResource.php`
- Test: `admin/tests/Feature/ConversationAudioMessageTest.php`

- [ ] **Step 1: Write failing resource test**

Add this test file:

```php
<?php

namespace Tests\Feature;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationAudioMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_message_resource_includes_audio_metadata_for_audio_message(): void
    {
        $message = new Message([
            'id' => 10,
            'conversation_id' => 77,
            'sender_type' => 'App\\Models\\User',
            'sender_id' => 5,
            'body' => 'Voice message',
            'type' => 'audio',
            'audio_path' => 'pure-half/chat-audio/77/message-uuid.m4a',
            'audio_duration_seconds' => 18,
            'audio_mime' => 'audio/mp4',
            'audio_size_bytes' => 245000,
        ]);
        $message->setCreatedAt(now());

        $payload = (new MessageResource($message))->resolve(request());

        $this->assertSame('audio', $payload['type']);
        $this->assertSame('Voice message', $payload['body']);
        $this->assertSame('pure-half/chat-audio/77/message-uuid.m4a', $payload['audio']['path']);
        $this->assertSame(18, $payload['audio']['duration_seconds']);
        $this->assertSame('audio/mp4', $payload['audio']['mime']);
        $this->assertSame(245000, $payload['audio']['size_bytes']);
    }

    public function test_message_resource_keeps_audio_null_for_text_message(): void
    {
        $message = new Message([
            'id' => 11,
            'conversation_id' => 77,
            'sender_type' => 'App\\Models\\User',
            'sender_id' => 5,
            'body' => 'Assalamu alaikum',
            'type' => 'text',
        ]);
        $message->setCreatedAt(now());

        $payload = (new MessageResource($message))->resolve(request());

        $this->assertSame('text', $payload['type']);
        $this->assertSame('Assalamu alaikum', $payload['body']);
        $this->assertNull($payload['audio']);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd "D:\GitHub\Pure Half\admin"
php artisan test --filter=ConversationAudioMessageTest
```

Expected: FAIL because the `messages` model/resource do not expose the `audio` payload.

- [ ] **Step 3: Add migration**

Create `database/migrations/2026_07_05_000000_add_audio_columns_to_messages_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('audio_path')->nullable()->after('body');
            $table->unsignedSmallInteger('audio_duration_seconds')->nullable()->after('audio_path');
            $table->string('audio_mime', 100)->nullable()->after('audio_duration_seconds');
            $table->unsignedInteger('audio_size_bytes')->nullable()->after('audio_mime');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'audio_path',
                'audio_duration_seconds',
                'audio_mime',
                'audio_size_bytes',
            ]);
        });
    }
};
```

- [ ] **Step 4: Update model**

In `app/Models/Message.php`, replace the `$fillable` line with:

```php
protected $fillable = [
    'conversation_id',
    'sender_type',
    'sender_id',
    'body',
    'type',
    'audio_path',
    'audio_duration_seconds',
    'audio_mime',
    'audio_size_bytes',
];

protected $casts = [
    'audio_duration_seconds' => 'integer',
    'audio_size_bytes' => 'integer',
];
```

- [ ] **Step 5: Update resource**

In `app/Http/Resources/MessageResource.php`, include this `audio` key in the returned array:

```php
'audio' => $this->type === 'audio' ? [
    'path' => $this->audio_path,
    'duration_seconds' => $this->audio_duration_seconds,
    'mime' => $this->audio_mime,
    'size_bytes' => $this->audio_size_bytes,
] : null,
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```powershell
php artisan test --filter=ConversationAudioMessageTest
```

Expected: PASS for both resource tests.

- [ ] **Step 7: Commit API metadata change**

```powershell
git add database/migrations/2026_07_05_000000_add_audio_columns_to_messages_table.php app/Models/Message.php app/Http/Resources/MessageResource.php tests/Feature/ConversationAudioMessageTest.php
git commit -m "feat(api): add audio metadata to messages"
```

---

### Task 2: API Send Validation And Private Audio Storage

**Files:**

- Modify: `admin/tests/Feature/ConversationAudioMessageTest.php`
- Modify: `admin/app/Http/Requests/Api/SendMessage.php`
- Modify: `admin/app/Http/Interfaces/UploadInterface.php`
- Modify: `admin/app/Http/Repositories/UploadRepository.php`
- Modify: `admin/app/Http/Services/UploadService.php`
- Modify: `admin/app/Http/Controllers/Api/ConversationController.php`
- Modify: `admin/app/Http/Services/ConversationService.php`

- [ ] **Step 1: Add failing API send tests**

Append these helpers and tests to `ConversationAudioMessageTest`:

```php
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

private function conversationFor(User $sender, User $receiver): Conversation
{
    $conversation = Conversation::create([
        'type' => 'private',
        'last_message' => 'Existing',
        'last_message_at' => now(),
    ]);

    foreach ([$sender, $receiver] as $participant) {
        ConversationParticipant::create([
            'conversation_id' => $conversation->id,
            'participant_id' => $participant->id,
            'participant_type' => User::class,
            'is_blocked' => false,
            'unread_count' => 0,
        ]);
    }

    return $conversation->load('participants.participant');
}

public function test_text_message_send_remains_backward_compatible_when_type_is_omitted(): void
{
    $sender = User::factory()->create(['chat_credits' => 50, 'gender' => 'female']);
    $receiver = User::factory()->create(['chat_credits' => 50]);
    $conversation = $this->conversationFor($sender, $receiver);

    $response = $this->actingAs($sender, 'api_user')
        ->postJson("/api/v1/app/auth/conversations/{$conversation->id}/messages", [
            'body' => 'Assalamu alaikum',
        ]);

    $response->assertOk()
        ->assertJsonPath('results.type', 'text')
        ->assertJsonPath('results.body', 'Assalamu alaikum')
        ->assertJsonPath('results.audio', null);

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $conversation->id,
        'sender_id' => $sender->id,
        'type' => 'text',
        'body' => 'Assalamu alaikum',
    ]);
}

public function test_audio_message_upload_creates_private_audio_message(): void
{
    Storage::fake('DigitalOcean');

    $sender = User::factory()->create(['chat_credits' => 50, 'gender' => 'female']);
    $receiver = User::factory()->create(['chat_credits' => 50]);
    $conversation = $this->conversationFor($sender, $receiver);
    $audio = UploadedFile::fake()->create('voice.m4a', 256, 'audio/mp4');

    $response = $this->actingAs($sender, 'api_user')
        ->post("/api/v1/app/auth/conversations/{$conversation->id}/messages", [
            'type' => 'audio',
            'audio' => $audio,
            'duration_seconds' => 18,
        ]);

    $response->assertOk()
        ->assertJsonPath('results.type', 'audio')
        ->assertJsonPath('results.body', 'Voice message')
        ->assertJsonPath('results.audio.duration_seconds', 18);

    $message = \App\Models\Message::where('conversation_id', $conversation->id)
        ->where('type', 'audio')
        ->firstOrFail();

    $this->assertSame('Voice message', $message->body);
    $this->assertSame(18, $message->audio_duration_seconds);
    $this->assertStringContainsString("chat-audio/{$conversation->id}/", $message->audio_path);
    Storage::disk('DigitalOcean')->assertExists($message->audio_path);
}

public function test_audio_message_rejects_duration_over_sixty_seconds(): void
{
    $sender = User::factory()->create(['chat_credits' => 50, 'gender' => 'female']);
    $receiver = User::factory()->create(['chat_credits' => 50]);
    $conversation = $this->conversationFor($sender, $receiver);

    $response = $this->actingAs($sender, 'api_user')
        ->post("/api/v1/app/auth/conversations/{$conversation->id}/messages", [
            'type' => 'audio',
            'audio' => UploadedFile::fake()->create('voice.m4a', 256, 'audio/mp4'),
            'duration_seconds' => 61,
        ]);

    $response->assertStatus(422);
}
```

- [ ] **Step 2: Run tests to verify expected failures**

Run:

```powershell
php artisan test --filter=ConversationAudioMessageTest
```

Expected: resource tests pass, new API tests fail because validation/storage/service support is missing.

- [ ] **Step 3: Update request validation**

Replace `rules()` in `app/Http/Requests/Api/SendMessage.php`:

```php
public function rules()
{
    $type = $this->input('type', 'text');

    return [
        'type' => 'sometimes|in:text,audio',
        'body' => $type === 'audio' ? 'nullable|string' : 'required|string',
        'audio' => $type === 'audio'
            ? 'required|file|mimetypes:audio/mp4,audio/m4a,audio/x-m4a|max:10240'
            : 'prohibited',
        'duration_seconds' => $type === 'audio'
            ? 'required|integer|min:1|max:60'
            : 'prohibited',
    ];
}
```

- [ ] **Step 4: Add private upload methods**

Extend `app/Http/Interfaces/UploadInterface.php`:

```php
public function putPrivate(string $subPath, $file): string;
public function temporaryUrlForPath(string $filePath, \DateTimeInterface $expiresAt): string;
```

Add to `app/Http/Repositories/UploadRepository.php`:

```php
public function putPrivate(string $subPath, $file): string
{
    $filePath = env('DIGITALOCEAN_FOLDER') . '/' . $subPath;
    $this->storage->put($filePath, file_get_contents($file), 'private');

    return $filePath;
}

public function temporaryUrlForPath(string $filePath, \DateTimeInterface $expiresAt): string
{
    return $this->storage->temporaryUrl($filePath, $expiresAt);
}
```

Add to `app/Http/Services/UploadService.php`:

```php
public function uploadPrivateChatAudio(int $conversationId, $file): string
{
    $extension = strtolower($file->getClientOriginalExtension() ?: 'm4a');
    if (!in_array($extension, ['m4a', 'mp4'], true)) {
        $extension = 'm4a';
    }

    $subPath = 'chat-audio/' . $conversationId . '/' . (string) \Illuminate\Support\Str::uuid() . '.' . $extension;

    return $this->IUpload->putPrivate($subPath, $file);
}

public function temporaryChatAudioUrl(string $filePath): string
{
    return $this->IUpload->temporaryUrlForPath($filePath, now()->addMinutes(5));
}
```

- [ ] **Step 5: Wire controller to service**

In `ConversationController::sendMessage`, replace the service call with:

```php
$message = $this->chatService->sendMessage(
    $conversation,
    $participant,
    $request->input('body'),
    $request->input('type', 'text'),
    $request->file('audio'),
    $request->integer('duration_seconds') ?: null
);
```

- [ ] **Step 6: Implement audio send in service**

Update `ConversationService` constructor to accept `UploadService $uploadService` and assign `$this->uploadService`.

Change `sendMessage` signature:

```php
public function sendMessage($conversation, $participant, $body, $type = 'text', $audioFile = null, $durationSeconds = null)
```

Before message creation, add:

```php
$messageBody = $type === 'audio' ? 'Voice message' : $body;
$audioPath = null;
$audioMime = null;
$audioSize = null;

if ($type === 'audio') {
    $audioPath = $this->uploadService->uploadPrivateChatAudio($conversation->id, $audioFile);
    $audioMime = $audioFile->getMimeType();
    $audioSize = $audioFile->getSize();
}
```

Replace message creation fields with:

```php
$message = $this->IMessage->create([
    'conversation_id' => $conversation->id,
    'sender_type' => get_class($participant),
    'sender_id' => $participant->id,
    'body' => $messageBody,
    'type' => $type,
    'audio_path' => $audioPath,
    'audio_duration_seconds' => $durationSeconds,
    'audio_mime' => $audioMime,
    'audio_size_bytes' => $audioSize,
]);
```

Replace conversation last-message update body with `$messageBody`:

```php
$conversation->update([
    'last_message' => $messageBody,
    'last_message_at' => now(),
]);
```

- [ ] **Step 7: Run tests to verify pass**

Run:

```powershell
php artisan test --filter=ConversationAudioMessageTest
```

Expected: all tests in `ConversationAudioMessageTest` pass.

- [ ] **Step 8: Commit API audio send**

```powershell
git add app/Http/Requests/Api/SendMessage.php app/Http/Interfaces/UploadInterface.php app/Http/Repositories/UploadRepository.php app/Http/Services/UploadService.php app/Http/Controllers/Api/ConversationController.php app/Http/Services/ConversationService.php tests/Feature/ConversationAudioMessageTest.php
git commit -m "feat(api): send private chat audio messages"
```

---

### Task 3: API Authenticated Audio Playback

**Files:**

- Modify: `admin/tests/Feature/ConversationAudioMessageTest.php`
- Modify: `admin/routes/api.php`
- Modify: `admin/app/Http/Controllers/Api/ConversationController.php`
- Modify: `admin/app/Http/Services/UploadService.php`

- [ ] **Step 1: Add failing playback tests**

Append:

```php
public function test_audio_playback_returns_temporary_url_for_participant(): void
{
    $sender = User::factory()->create(['chat_credits' => 50, 'gender' => 'female']);
    $receiver = User::factory()->create(['chat_credits' => 50]);
    $conversation = $this->conversationFor($sender, $receiver);

    $uploadService = \Mockery::mock(\App\Http\Services\UploadService::class);
    $uploadService->shouldReceive('temporaryChatAudioUrl')
        ->once()
        ->with('pure-half/chat-audio/' . $conversation->id . '/voice.m4a')
        ->andReturn('https://signed.example.test/audio.m4a');
    $this->app->instance(\App\Http\Services\UploadService::class, $uploadService);

    $message = \App\Models\Message::create([
        'conversation_id' => $conversation->id,
        'sender_type' => User::class,
        'sender_id' => $sender->id,
        'body' => 'Voice message',
        'type' => 'audio',
        'audio_path' => 'pure-half/chat-audio/' . $conversation->id . '/voice.m4a',
        'audio_duration_seconds' => 12,
        'audio_mime' => 'audio/mp4',
        'audio_size_bytes' => 5,
    ]);

    $response = $this->actingAs($receiver, 'api_user')
        ->getJson("/api/v1/app/auth/conversations/messages/{$message->id}/audio");

    $response->assertOk()
        ->assertJsonStructure(['message', 'error', 'code', 'results' => ['url', 'expires_at']]);
}

public function test_audio_playback_denies_non_participant(): void
{
    $sender = User::factory()->create(['chat_credits' => 50, 'gender' => 'female']);
    $receiver = User::factory()->create(['chat_credits' => 50]);
    $outsider = User::factory()->create(['chat_credits' => 50]);
    $conversation = $this->conversationFor($sender, $receiver);

    $message = \App\Models\Message::create([
        'conversation_id' => $conversation->id,
        'sender_type' => User::class,
        'sender_id' => $sender->id,
        'body' => 'Voice message',
        'type' => 'audio',
        'audio_path' => 'pure-half/chat-audio/' . $conversation->id . '/voice.m4a',
        'audio_duration_seconds' => 12,
        'audio_mime' => 'audio/mp4',
        'audio_size_bytes' => 5,
    ]);

    $response = $this->actingAs($outsider, 'api_user')
        ->getJson("/api/v1/app/auth/conversations/messages/{$message->id}/audio");

    $response->assertForbidden();
}
```

- [ ] **Step 2: Run tests to verify failure**

```powershell
php artisan test --filter=ConversationAudioMessageTest
```

Expected: playback route tests fail with 404.

- [ ] **Step 3: Add route**

In `routes/api.php`, inside `Route::prefix('messages')->group(function () { ... })`, add:

```php
Route::get('{message}/audio', [ConversationController::class, 'audioUrl']);
```

- [ ] **Step 4: Add controller action**

Add to `ConversationController`:

```php
public function audioUrl(Message $message)
{
    try {
        if ($denied = $this->denyIfNotParticipant($message->conversation_id)) return $denied;

        if ($message->type !== 'audio' || !$message->audio_path) {
            return $this->error(JsonResponse::HTTP_NOT_FOUND, 'Audio message not found');
        }

        $url = app(\App\Http\Services\UploadService::class)->temporaryChatAudioUrl($message->audio_path);

        return $this->success(JsonResponse::HTTP_OK, 'Audio URL generated successfully', [
            'url' => $url,
            'expires_at' => now()->addMinutes(5)->toDateTimeString(),
        ]);
    } catch (\Exception $ex) {
        return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
    }
}
```

- [ ] **Step 5: Run tests to verify pass**

```powershell
php artisan test --filter=ConversationAudioMessageTest
```

Expected: all playback tests pass.

- [ ] **Step 6: Commit playback endpoint**

```powershell
git add routes/api.php app/Http/Controllers/Api/ConversationController.php tests/Feature/ConversationAudioMessageTest.php
git commit -m "feat(api): add private chat audio playback"
```

---

### Task 4: Mobile API Types And Multipart Service

**Files:**

- Modify: `app-old/src/services/api/types/message-types.tsx`
- Modify: `app-old/src/services/api/EndPoints.tsx`
- Modify: `app-old/src/services/api/message-services.tsx`
- Test: `app-old/src/services/api/message-services.test.ts`

- [ ] **Step 1: Write failing mobile API tests**

Create `src/services/api/message-services.test.ts`:

```ts
import EndPoints from './EndPoints';
import messageServices from './message-services';
import { Api } from './Middleware';

jest.mock('./Middleware', () => ({
  Api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('messageServices audio messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends text messages as JSON payloads', async () => {
    (Api.post as jest.Mock).mockResolvedValue({
      data: {
        error: false,
        results: {
          id: 1,
          conversation_id: 2,
          body: 'Assalamu alaikum',
          type: 'text',
          sender_type: 'User',
          sender_id: 3,
          created_at: '2026-07-05 10:00:00',
          statuses: [],
          audio: null,
        },
      },
    });

    await messageServices.sendConversationMessage(2, {
      type: 'text',
      body: 'Assalamu alaikum',
    });

    expect(Api.post).toHaveBeenCalledWith(
      EndPoints.sendConversationMessage(2),
      { type: 'text', body: 'Assalamu alaikum' }
    );
  });

  it('sends audio messages as form data', async () => {
    (Api.post as jest.Mock).mockResolvedValue({
      data: {
        error: false,
        results: {
          id: 1,
          conversation_id: 2,
          body: 'Voice message',
          type: 'audio',
          sender_type: 'User',
          sender_id: 3,
          created_at: '2026-07-05 10:00:00',
          statuses: [],
          audio: {
            path: 'pure-half/chat-audio/2/voice.m4a',
            duration_seconds: 12,
            mime: 'audio/mp4',
            size_bytes: 100,
          },
        },
      },
    });

    await messageServices.sendConversationMessage(2, {
      type: 'audio',
      audio: {
        uri: 'file:///tmp/voice.m4a',
        name: 'voice.m4a',
        type: 'audio/mp4',
      },
      duration_seconds: 12,
    });

    const [, payload] = (Api.post as jest.Mock).mock.calls[0];
    expect(payload).toBeInstanceOf(FormData);
  });

  it('fetches a temporary audio playback url', async () => {
    (Api.get as jest.Mock).mockResolvedValue({
      data: {
        error: false,
        results: {
          url: 'https://signed.example.test/audio.m4a',
          expires_at: '2026-07-05 10:05:00',
        },
      },
    });

    const result = await messageServices.getMessageAudioUrl(55);

    expect(Api.get).toHaveBeenCalledWith(EndPoints.getMessageAudioUrl(55));
    expect(result.url).toBe('https://signed.example.test/audio.m4a');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```powershell
cd "D:\GitHub\Pure Half\app-old"
yarn test src/services/api/message-services.test.ts --runInBand
```

Expected: FAIL because audio payload types and `getMessageAudioUrl` do not exist.

- [ ] **Step 3: Update types**

In `message-types.tsx`, change `Message`:

```ts
export type MessageAudio = {
  path: string;
  duration_seconds: number;
  mime: string;
  size_bytes: number;
};

export type Message = {
  id: number;
  conversation_id: number;
  body: string;
  type: 'text' | 'audio' | string;
  sender_type: string;
  sender_id: number;
  created_at: string;
  statuses: MessageStatus[];
  audio: MessageAudio | null;
};
```

Replace `SendConversationMessagePayload`:

```ts
export type AudioUploadFile = {
  uri: string;
  name: string;
  type: string;
};

export type SendTextConversationMessagePayload = {
  type?: 'text';
  body: string;
};

export type SendAudioConversationMessagePayload = {
  type: 'audio';
  audio: AudioUploadFile;
  duration_seconds: number;
};

export type SendConversationMessagePayload =
  | SendTextConversationMessagePayload
  | SendAudioConversationMessagePayload;

export type GetMessageAudioUrlResponse = {
  message: string;
  error: boolean;
  code: number;
  results: {
    url: string;
    expires_at: string;
  };
};
```

- [ ] **Step 4: Add endpoint helper**

In `EndPoints.tsx`, add:

```ts
getMessageAudioUrl: (messageId: number) =>
  `/auth/conversations/messages/${messageId}/audio`,
```

- [ ] **Step 5: Update service**

In `message-services.tsx`, import `GetMessageAudioUrlResponse`. Add a private helper method inside the class:

```ts
private buildSendPayload = (payload: SendConversationMessagePayload) => {
  if (payload.type !== 'audio') {
    return {
      type: payload.type ?? 'text',
      body: payload.body,
    };
  }

  const formData = new FormData();
  formData.append('type', 'audio');
  formData.append('duration_seconds', String(payload.duration_seconds));
  formData.append('audio', payload.audio as unknown as Blob);

  return formData;
};
```

Update `sendConversationMessage` to call:

```ts
Api.post(
  EndPoints.sendConversationMessage(conversationId),
  this.buildSendPayload(payload)
);
```

Add method:

```ts
getMessageAudioUrl = (messageId: number) => {
  return new Promise<{ url: string; expires_at: string }>((resolve, reject) => {
    Api.get(EndPoints.getMessageAudioUrl(messageId))
      .then((response) => {
        const data = response.data as GetMessageAudioUrlResponse;
        if (data?.error === true) {
          reject(data?.message || 'Failed to fetch audio URL');
          return;
        }
        resolve(data.results);
      })
      .catch((error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to fetch audio URL';
        reject(errorMessage);
      });
  });
};
```

- [ ] **Step 6: Run test to verify pass**

```powershell
yarn test src/services/api/message-services.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 7: Commit mobile API service**

```powershell
git add src/services/api/types/message-types.tsx src/services/api/EndPoints.tsx src/services/api/message-services.tsx src/services/api/message-services.test.ts
git commit -m "feat(app): add chat audio API client"
```

---

### Task 5: Mobile Audio Recorder Service And Native Permissions

**Files:**

- Modify: `app-old/package.json`
- Modify: lockfile
- Modify: `app-old/android/app/src/main/AndroidManifest.xml`
- Modify: `app-old/ios/PureHalf/Info.plist`
- Create: `app-old/src/services/audio/chat-audio-service.ts`
- Test: `app-old/src/services/audio/chat-audio-service.test.ts`

- [ ] **Step 1: Install audio dependency**

```powershell
cd "D:\GitHub\Pure Half\app-old"
yarn add react-native-nitro-sound react-native-nitro-modules@^0.35.4
```

Expected: `package.json` and `yarn.lock` update. If npm changes `package-lock.json`, leave it untouched unless the repo currently treats it as canonical for this branch.

- [ ] **Step 2: Write failing service test**

Create `src/services/audio/chat-audio-service.test.ts`:

```ts
import chatAudioService from './chat-audio-service';

jest.mock('react-native-nitro-sound', () => ({
  startRecorder: jest.fn().mockResolvedValue('file:///tmp/voice.m4a'),
  stopRecorder: jest.fn().mockResolvedValue('file:///tmp/voice.m4a'),
  startPlayer: jest.fn().mockResolvedValue('playing'),
  stopPlayer: jest.fn().mockResolvedValue('stopped'),
}));

describe('chatAudioService', () => {
  it('normalizes a stopped recording into upload file metadata', async () => {
    const result = await chatAudioService.stopRecording(12);

    expect(result).toEqual({
      uri: 'file:///tmp/voice.m4a',
      name: 'voice.m4a',
      type: 'audio/mp4',
      duration_seconds: 12,
    });
  });
});
```

- [ ] **Step 3: Run test to verify failure**

```powershell
yarn test src/services/audio/chat-audio-service.test.ts --runInBand
```

Expected: FAIL because service file does not exist.

- [ ] **Step 4: Add service**

Create `src/services/audio/chat-audio-service.ts`:

```ts
import {
  startPlayer,
  startRecorder,
  stopPlayer,
  stopRecorder,
} from 'react-native-nitro-sound';

export type RecordedChatAudio = {
  uri: string;
  name: string;
  type: 'audio/mp4';
  duration_seconds: number;
};

class ChatAudioService {
  private activeRecordingUri: string | null = null;

  startRecording = async (): Promise<string> => {
    const uri = await startRecorder();
    this.activeRecordingUri = uri;
    return uri;
  };

  stopRecording = async (
    durationSeconds: number
  ): Promise<RecordedChatAudio> => {
    const uri = await stopRecorder();
    this.activeRecordingUri = null;

    return {
      uri,
      name: 'voice.m4a',
      type: 'audio/mp4',
      duration_seconds: durationSeconds,
    };
  };

  cancelRecording = async (): Promise<void> => {
    if (!this.activeRecordingUri) return;
    await stopRecorder();
    this.activeRecordingUri = null;
  };

  play = async (url: string): Promise<void> => {
    await startPlayer(url);
  };

  stopPlayback = async (): Promise<void> => {
    await stopPlayer();
  };
}

const chatAudioService = new ChatAudioService();
export default chatAudioService;
```

- [ ] **Step 5: Add native permissions**

In `android/app/src/main/AndroidManifest.xml`, add below `POST_NOTIFICATIONS`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

In `ios/PureHalf/Info.plist`, add near other `NS*UsageDescription` keys:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>PureHalf needs microphone access so you can record voice messages in chat.</string>
```

- [ ] **Step 6: Run tests and type-check**

```powershell
yarn test src/services/audio/chat-audio-service.test.ts --runInBand
yarn type-check
```

Expected: PASS. If TypeScript reports different exported function names from `react-native-nitro-sound`, update only `chat-audio-service.ts` and its mock so the app-owned service API remains unchanged.

- [ ] **Step 7: Commit audio service**

```powershell
git add package.json yarn.lock android/app/src/main/AndroidManifest.xml ios/PureHalf/Info.plist src/services/audio/chat-audio-service.ts src/services/audio/chat-audio-service.test.ts
git commit -m "feat(app): add chat audio recorder service"
```

---

### Task 6: Mobile Audio Bubble Rendering

**Files:**

- Create: `app-old/src/screens/messages/components/AudioMessageBubble.tsx`
- Modify: `app-old/src/screens/messages/components/MessageBubble.tsx`
- Modify: `app-old/src/screens/messages/SingleChat.styles.ts`
- Test: `app-old/src/screens/messages/components/AudioMessageBubble.test.tsx`

- [ ] **Step 1: Write failing render test**

Create `src/screens/messages/components/AudioMessageBubble.test.tsx`:

```tsx
import React from 'react';
import renderer from 'react-test-renderer';

import AudioMessageBubble from './AudioMessageBubble';

describe('AudioMessageBubble', () => {
  it('renders duration and play control for an audio message', () => {
    const tree = renderer.create(
      <AudioMessageBubble
        item={{
          id: 1,
          type: 'audio',
          body: 'Voice message',
          created_at: '2026-07-05 10:00:00',
          audio: {
            path: 'pure-half/chat-audio/1/voice.m4a',
            duration_seconds: 18,
            mime: 'audio/mp4',
            size_bytes: 100,
          },
        }}
        isCurrentUser={true}
        textColour="#ffffff"
        isRead={false}
        messageStatus="sent"
        isBlockedYou={false}
        Styles={{
          audioBubbleContent: {},
          audioPlayButton: {},
          audioWaveTrack: {},
          audioWaveBar: {},
          audioDuration: {},
          messageTimeAndStatusWrapper: {},
          messageTimeInline: {},
        }}
      />
    );

    expect(JSON.stringify(tree.toJSON())).toContain('0:18');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```powershell
yarn test src/screens/messages/components/AudioMessageBubble.test.tsx --runInBand
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Create component**

Create `AudioMessageBubble.tsx` with:

```tsx
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../../../global';
import { Colors } from '../../../res';
import messageServices from '../../../services/api/message-services';
import chatAudioService from '../../../services/audio/chat-audio-service';
import { getMessageTime } from '../SingleChat.utils';
import MessageStatusIcon from './MessageStatusIcon';

type Props = {
  item: any;
  isCurrentUser: boolean;
  textColour: string;
  isRead: boolean;
  messageStatus: 'sending' | 'sent';
  isBlockedYou: boolean;
  Styles: any;
};

const formatDuration = (seconds?: number) => {
  const safeSeconds = Math.max(0, seconds || 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioMessageBubble = ({
  item,
  isCurrentUser,
  textColour,
  isRead,
  messageStatus,
  isBlockedYou,
  Styles,
}: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const onPlayPress = async () => {
    if (isPlaying) {
      await chatAudioService.stopPlayback();
      setIsPlaying(false);
      return;
    }

    const sourceUrl =
      item.local_uri || (await messageServices.getMessageAudioUrl(item.id)).url;
    await chatAudioService.play(sourceUrl);
    setIsPlaying(true);
  };

  return (
    <>
      <View style={Styles.audioBubbleContent}>
        <TouchableOpacity style={Styles.audioPlayButton} onPress={onPlayPress}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={wp(4)}
            color={isCurrentUser ? Colors.primary : Colors.color2}
          />
        </TouchableOpacity>
        <View style={Styles.audioWaveTrack}>
          {Array.from({ length: 12 }).map((_, index) => (
            <View
              key={index}
              style={[
                Styles.audioWaveBar,
                {
                  height: wp(1.4 + (index % 4) * 0.9),
                  backgroundColor: textColour,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[Styles.audioDuration, { color: textColour }]}>
          {formatDuration(
            item.audio?.duration_seconds || item.duration_seconds
          )}
        </Text>
      </View>

      <View style={Styles.messageTimeAndStatusWrapper}>
        <Text style={[Styles.messageTimeInline, { color: textColour }]}>
          {getMessageTime(item?.created_at)}
        </Text>
        {isCurrentUser && (
          <MessageStatusIcon
            status={messageStatus}
            isSeen={isRead}
            isBlocked={isBlockedYou}
            wasSentWhileBlocked={false}
          />
        )}
      </View>
    </>
  );
};

export default AudioMessageBubble;
```

- [ ] **Step 4: Add styles**

In `SingleChat.styles.ts`, add:

```ts
audioBubbleContent: {
  flexDirection: 'row',
  alignItems: 'center',
  minWidth: wp(48),
  maxWidth: wp(68),
},
audioPlayButton: {
  width: wp(8),
  height: wp(8),
  borderRadius: wp(4),
  backgroundColor: Colors.whiteRGBA90,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: wp(2),
},
audioWaveTrack: {
  flex: 1,
  minHeight: wp(8),
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  opacity: 0.86,
},
audioWaveBar: {
  width: wp(0.7),
  borderRadius: wp(0.4),
},
audioDuration: {
  marginLeft: wp(2),
  fontSize: Typography.tiny1,
  fontFamily: Fonts.APPFONT_R,
  includeFontPadding: false,
},
```

- [ ] **Step 5: Branch MessageBubble**

In `MessageBubble.tsx`, import `AudioMessageBubble`. Replace the body text section with:

```tsx
{
  item?.type === 'audio' ? (
    <AudioMessageBubble
      item={item}
      isCurrentUser={isCurrentUser}
      textColour={textColour}
      isRead={isRead}
      messageStatus={messageStatus}
      isBlockedYou={isBlockedYou}
      Styles={Styles}
    />
  ) : (
    <>
      <Text style={[Styles.messageTxt, { color: textColour }]}>
        {item?.body}
      </Text>
      <View style={Styles.messageTimeAndStatusWrapper}>
        <Text
          style={[
            Styles.messageTimeInline,
            {
              color:
                isCurrentUser || isGuardian ? Colors.whiteRGBA90 : Colors.muted,
            },
          ]}
        >
          {getMessageTime(item?.created_at)}
        </Text>
        {isCurrentUser && (
          <MessageStatusIcon
            status={messageStatus}
            isSeen={isRead}
            isBlocked={isBlockedYou}
            wasSentWhileBlocked={false}
          />
        )}
      </View>
    </>
  );
}
```

- [ ] **Step 6: Run test**

```powershell
yarn test src/screens/messages/components/AudioMessageBubble.test.tsx --runInBand
yarn type-check
```

Expected: PASS.

- [ ] **Step 7: Commit audio bubble**

```powershell
git add src/screens/messages/components/AudioMessageBubble.tsx src/screens/messages/components/MessageBubble.tsx src/screens/messages/SingleChat.styles.ts src/screens/messages/components/AudioMessageBubble.test.tsx
git commit -m "feat(app): render audio message bubbles"
```

---

### Task 7: Mobile Recording Composer And Send Flow

**Files:**

- Create: `app-old/src/screens/messages/components/VoiceRecorderBar.tsx`
- Modify: `app-old/src/screens/messages/SingleChat.tsx`
- Modify: `app-old/src/screens/messages/hooks/useSendMessage.ts`
- Modify: `app-old/src/languages/English.json`
- Modify: `app-old/src/languages/RomanUrdu.json`
- Modify: `app-old/src/languages/Urdu.json`
- Modify: `app-old/src/languages/Keys.tsx`
- Test: `app-old/src/screens/messages/components/VoiceRecorderBar.test.tsx`

- [ ] **Step 1: Write failing recorder bar test**

Create `VoiceRecorderBar.test.tsx`:

```tsx
import React from 'react';
import renderer from 'react-test-renderer';

import VoiceRecorderBar from './VoiceRecorderBar';

describe('VoiceRecorderBar', () => {
  it('renders timer and send action', () => {
    const tree = renderer.create(
      <VoiceRecorderBar
        elapsedSeconds={7}
        isSending={false}
        onCancel={jest.fn()}
        onSend={jest.fn()}
      />
    );

    expect(JSON.stringify(tree.toJSON())).toContain('0:07');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```powershell
yarn test src/screens/messages/components/VoiceRecorderBar.test.tsx --runInBand
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Create recorder bar**

Create `VoiceRecorderBar.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../../../global';
import { Colors } from '../../../res';
import Styles from '../SingleChat.styles';

type Props = {
  elapsedSeconds: number;
  isSending: boolean;
  onCancel: () => void;
  onSend: () => void;
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VoiceRecorderBar = ({
  elapsedSeconds,
  isSending,
  onCancel,
  onSend,
}: Props) => {
  return (
    <View style={Styles.voiceRecorderOuter}>
      <TouchableOpacity
        style={Styles.voiceCancelBtn}
        onPress={onCancel}
        disabled={isSending}
      >
        <Ionicons name="close" size={wp(4.6)} color={Colors.color2} />
      </TouchableOpacity>
      <Text style={Styles.voiceTimer}>{formatDuration(elapsedSeconds)}</Text>
      <View style={Styles.voiceWaveTrack}>
        {Array.from({ length: 16 }).map((_, index) => (
          <View
            key={index}
            style={[
              Styles.voiceWaveBar,
              { height: wp(1.2 + (index % 5) * 0.8) },
            ]}
          />
        ))}
      </View>
      <TouchableOpacity
        style={Styles.voiceSendBtn}
        onPress={onSend}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Ionicons name="send" size={wp(4.6)} color={Colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default VoiceRecorderBar;
```

- [ ] **Step 4: Add styles**

Add to `SingleChat.styles.ts`:

```ts
voiceRecorderOuter: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: Colors.primary,
  marginTop: hp(1),
  marginBottom: hp(1.5),
  marginHorizontal: wp(4),
  borderRadius: 26,
  paddingVertical: hp(0.7),
  paddingHorizontal: wp(2),
},
voiceCancelBtn: {
  width: wp(9),
  height: wp(9),
  borderRadius: wp(4.5),
  backgroundColor: Colors.whiteRGBA18,
  justifyContent: 'center',
  alignItems: 'center',
},
voiceTimer: {
  color: Colors.color2,
  fontFamily: Fonts.APPFONT_M,
  fontSize: Typography.small2,
  includeFontPadding: false,
  marginHorizontal: wp(3),
},
voiceWaveTrack: {
  flex: 1,
  minHeight: wp(9),
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
voiceWaveBar: {
  width: wp(0.75),
  borderRadius: wp(0.4),
  backgroundColor: Colors.whiteRGBA90,
},
voiceSendBtn: {
  width: wp(10.5),
  height: wp(10.5),
  borderRadius: wp(5.25),
  backgroundColor: Colors.color2,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: wp(2),
},
```

- [ ] **Step 5: Extend send hook**

In `useSendMessage.ts`, change `onSendPress` type to accept the union payload:

```ts
type SendMessageInput =
  | string
  | {
      type: 'audio';
      audio: {
        uri: string;
        name: string;
        type: string;
      };
      duration_seconds: number;
    };
```

Inside `sendMessage`, derive:

```ts
const isAudio = typeof inputMessage !== 'string';
const messagePayload = isAudio
  ? inputMessage
  : {
      type: 'text' as const,
      body: inputMessage,
    };
```

Use `messagePayload` for existing and new conversation sends. For new conversations, keep first-message audio disabled in this pass by showing:

```ts
if (isAudio && (!conversationData || !conversationData.id)) {
  flashErrorMessage('Please send a text message before voice notes.');
  return;
}
```

- [ ] **Step 6: Wire SingleChat recording state**

In `SingleChat.tsx`, add state:

```ts
const [isRecordingVoice, setIsRecordingVoice] = useState(false);
const [voiceElapsedSeconds, setVoiceElapsedSeconds] = useState(0);
const [isSendingVoice, setIsSendingVoice] = useState(false);
const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

Add functions:

```ts
const clearVoiceTimer = () => {
  if (voiceTimerRef.current) {
    clearInterval(voiceTimerRef.current);
    voiceTimerRef.current = null;
  }
};

const startVoiceRecording = async () => {
  try {
    setVoiceElapsedSeconds(0);
    await chatAudioService.startRecording();
    setIsRecordingVoice(true);
    voiceTimerRef.current = setInterval(() => {
      setVoiceElapsedSeconds((seconds) => {
        if (seconds >= 60) {
          clearVoiceTimer();
          return 60;
        }
        return seconds + 1;
      });
    }, 1000);
  } catch (error) {
    flashInfoMessage(LanguageKeys.microphonePermissionDenied);
  }
};

const cancelVoiceRecording = async () => {
  clearVoiceTimer();
  await chatAudioService.cancelRecording();
  setIsRecordingVoice(false);
  setVoiceElapsedSeconds(0);
};

const sendVoiceRecording = async () => {
  if (isSendingVoice) return;
  setIsSendingVoice(true);
  clearVoiceTimer();
  try {
    const recording = await chatAudioService.stopRecording(
      Math.max(1, voiceElapsedSeconds)
    );
    await onSendPress({
      type: 'audio',
      audio: {
        uri: recording.uri,
        name: recording.name,
        type: recording.type,
      },
      duration_seconds: recording.duration_seconds,
    });
    setIsRecordingVoice(false);
    setVoiceElapsedSeconds(0);
  } finally {
    setIsSendingVoice(false);
  }
};
```

Render `VoiceRecorderBar` instead of the text composer when `isRecordingVoice` is true. Change the disabled empty send button to a mic button:

```tsx
<TouchableOpacity
  style={{
    ...Styles.sendBtn,
    backgroundColor:
      inputMessage.trim().length === 0 ? Colors.primaryMid : Colors.primary,
  }}
  onPress={async () => {
    if (inputMessage.trim().length === 0) {
      await startVoiceRecording();
      return;
    }
    const res = await onSendPress(inputMessage);
    if (res?.type === 'blockedByYou') {
      Alert.alert(
        `You have blocked ${otherUserData?.name} please unblock first to send message`
      );
    }
  }}
>
  <Ionicons
    name={inputMessage.trim().length === 0 ? 'mic' : 'send'}
    size={wp(4.6)}
    color={Colors.color2}
  />
</TouchableOpacity>
```

- [ ] **Step 7: Add translations**

Add keys to English, RomanUrdu, and Urdu JSON with English fallback text for non-English if translations are not available:

```json
"microphonePermissionDenied": "Microphone permission is needed to record voice messages.",
"voiceMessage": "Voice message",
"recordingVoice": "Recording voice message"
```

Add to `Keys.tsx`:

```ts
microphonePermissionDenied: 'microphonePermissionDenied',
voiceMessage: 'voiceMessage',
recordingVoice: 'recordingVoice',
```

- [ ] **Step 8: Run tests and type-check**

```powershell
yarn test src/screens/messages/components/VoiceRecorderBar.test.tsx --runInBand
yarn type-check
```

Expected: PASS.

- [ ] **Step 9: Commit recorder composer**

```powershell
git add src/screens/messages/components/VoiceRecorderBar.tsx src/screens/messages/components/VoiceRecorderBar.test.tsx src/screens/messages/SingleChat.tsx src/screens/messages/SingleChat.styles.ts src/screens/messages/hooks/useSendMessage.ts src/languages/English.json src/languages/RomanUrdu.json src/languages/Urdu.json src/languages/Keys.tsx
git commit -m "feat(app): add voice note recorder composer"
```

---

### Task 8: Conversation Preview, Pusher Payload Verification, And Final Checks

**Files:**

- Modify: `admin/app/Events/Conversation/MessageSent.php`
- Modify: `app-old/src/screens/messages/Messages.tsx`
- Test: extend existing tests or add focused tests if setup remains stable.

- [ ] **Step 1: Verify API Pusher payload includes audio metadata**

Inspect `MessageSent.php`. Ensure `broadcastWith()` returns:

```php
'message' => new MessageResource($this->message),
'conversation' => [
    'id' => $this->message->conversation_id,
    'last_message' => $this->message->body,
    'last_message_at' => $this->message->created_at->toDateTimeString(),
    'participants' => $this->unreadCounter,
],
```

If this is already true, make no API code change in this step.

- [ ] **Step 2: Update mobile conversation preview**

In `Messages.tsx`, replace preview text selection with:

```ts
const previewText =
  item.last_message_detail?.type === 'audio'
    ? LanguageKeys.voiceMessage
    : item.last_message;

const hasLastMessage = !!previewText && previewText.trim() !== '';
```

Render `{previewText}` instead of `{item.last_message}`.

- [ ] **Step 3: Run targeted checks**

API:

```powershell
cd "D:\GitHub\Pure Half\admin"
php artisan test --filter=ConversationAudioMessageTest
```

Mobile:

```powershell
cd "D:\GitHub\Pure Half\app-old"
yarn test src/services/api/message-services.test.ts src/services/audio/chat-audio-service.test.ts src/screens/messages/components/AudioMessageBubble.test.tsx src/screens/messages/components/VoiceRecorderBar.test.tsx --runInBand
yarn type-check
```

Expected: all targeted tests pass and `tsc --noEmit` passes.

- [ ] **Step 4: Native build smoke checks**

Android:

```powershell
cd "D:\GitHub\Pure Half\app-old"
yarn android
```

Expected: Android builds and launches. If no Android device/emulator is available, run:

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

iOS on macOS only:

```sh
cd "D:/GitHub/Pure Half/app-old/ios"
bundle exec pod install
cd ..
yarn ios
```

Expected: iOS builds and launches. If this Windows workstation is used, record that iOS native verification was not run locally.

- [ ] **Step 5: Commit final preview/verification change**

```powershell
git add src/screens/messages/Messages.tsx
git commit -m "feat(app): show voice message previews"
```

If `MessageSent.php` changed:

```powershell
cd "D:\GitHub\Pure Half\admin"
git add app/Events/Conversation/MessageSent.php
git commit -m "feat(api): broadcast audio message metadata"
```

---

## Manual QA Script

- [ ] Run Laravel API locally with a database that has the audio migration applied.
- [ ] Run the mobile app on Android.
- [ ] Open an existing conversation.
- [ ] Confirm the text composer shows a mic when the text input is empty.
- [ ] Tap mic once and confirm the violet recording bar appears.
- [ ] Tap cancel and confirm no message is created.
- [ ] Record again, wait 3-5 seconds, tap send, and confirm an outgoing audio bubble appears.
- [ ] Confirm the receiver sees the audio bubble through Pusher or after reopening the conversation.
- [ ] Tap play on sender and receiver devices.
- [ ] Confirm conversation list preview reads `Voice message`.
- [ ] Try recording past 60 seconds and confirm it stops without sending.
- [ ] Deny microphone permission and confirm the translated permission error appears.
- [ ] Confirm blocked-user behavior still prevents sending.
- [ ] Confirm guardian/wali banner and read/delivered ticks still render.

## Plan Self-Review

Spec coverage:

- In-chat recording only: Task 7 implements recording inside `SingleChat`; no file picker is added.
- 60-second maximum: Task 7 timer stops at 60 and does not auto-send.
- Private DigitalOcean storage: Task 2 stores private objects and saves `audio_path`.
- Authenticated playback: Task 3 adds participant-checked playback URL endpoint.
- Multipart send endpoint: Task 2 extends the existing send endpoint.
- Audio resource/Pusher payloads: Tasks 1 and 8 cover resources and broadcasts.
- Mobile bubbles and preview: Tasks 6 and 8 cover chat bubble and list preview.
- Admin panel deferred: no admin blade/controller UI task is included.

Placeholder scan:

- No forbidden marker text or undefined paths remain.
- All new functions referenced later are introduced before use in the plan.

Type consistency:

- Backend metadata uses `audio_path`, `audio_duration_seconds`, `audio_mime`, and `audio_size_bytes` consistently.
- Mobile payload uses `duration_seconds` to match the API contract.
- Mobile response audio object uses `duration_seconds`, `mime`, and `size_bytes` consistently.
