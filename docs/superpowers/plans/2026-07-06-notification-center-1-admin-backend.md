# Notification Center — Plan 1: Admin Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Target repo:** `D:\GitHub\Pure Half\admin` (Laravel 9). All paths below are relative to that repo. Run all commands from there.

**Goal:** Persist per-member notifications to the DB when they are sent, expose them to the mobile app via `v1/app/auth/notifications` endpoints, let admins hide notification types with a `show_in_app` toggle, and prune anything older than 7 days.

**Architecture:** Notifications already funnel through one method — `SendEmailNotification::transformInAppNotification()`. We insert a `user_notifications` row there (gated on the template's new `show_in_app` flag) via a static `UserNotification::record()`. A new `Api\NotificationController` serves list/read/delete endpoints scoped to the authenticated user, filtered to visible + ≤7-day rows. A daily command force-deletes rows older than 7 days. The admin notifications DataTable gets one more toggle column, handled by the existing generic AJAX handler.

**Tech Stack:** Laravel 9, Passport (`auth:api_user`), Eloquent + SoftDeletes, `ResponseAPI` trait, PHPUnit feature tests with `RefreshDatabase`.

**Spec:** `docs/superpowers/specs/2026-07-06-in-app-notification-center-design.md` (in the `app-old` repo).

---

## File Structure

**Create:**

- `database/migrations/2026_07_06_000001_create_user_notifications_table.php` — new per-user table
- `database/migrations/2026_07_06_000002_add_show_in_app_to_notifications_table.php` — template visibility flag
- `app/Models/UserNotification.php` — model, scopes, `record()`
- `app/Http/Resources/UserNotificationResource.php` — API shape
- `app/Http/Controllers/Api/NotificationController.php` — list/read/markAllRead/destroy/clearAll
- `app/Console/Commands/PruneUserNotifications.php` — 7-day prune
- `tests/Feature/UserNotificationRecordTest.php` — persistence unit tests
- `tests/Feature/UserNotificationApiTest.php` — endpoint feature tests
- `tests/Feature/PruneUserNotificationsTest.php` — prune command test

**Modify:**

- `app/Models/Notification.php` — add `show_in_app` to `$fillable`
- `app/Http/Traits/SendEmailNotification.php:77-98` — call `UserNotification::record(...)` inside `transformInAppNotification`
- `app/Http/Controllers/Api/AuthController.php:257-277` — add `unread_notifications` to `getCounter`
- `routes/api.php:51-124` — register the `notifications` route group
- `app/Console/Kernel.php:17-33` — register + schedule the prune command
- `app/Http/Controllers/Admin/NotificationController.php:179-192` — accept `show_in_app` in `updateStatus`
- `resources/views/admin/pages/notifications/index.blade.php:24-55` — add "Show in app" toggle column

---

## Task 1: `user_notifications` table + `UserNotification` model + `record()`

**Files:**

- Create: `database/migrations/2026_07_06_000001_create_user_notifications_table.php`
- Create: `app/Models/UserNotification.php`
- Modify: `app/Models/Notification.php`
- Create: `database/migrations/2026_07_06_000002_add_show_in_app_to_notifications_table.php`
- Test: `tests/Feature/UserNotificationRecordTest.php`

- [ ] **Step 1: Write the migration for `user_notifications`**

Create `database/migrations/2026_07_06_000001_create_user_notifications_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('notification_id')->constrained('notifications')->cascadeOnDelete();
            $table->string('trigger')->nullable();
            $table->string('type')->nullable();
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('image')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'deleted_at', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_notifications');
    }
};
```

- [ ] **Step 2: Write the migration adding `show_in_app` to `notifications`**

Create `database/migrations/2026_07_06_000002_add_show_in_app_to_notifications_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->boolean('show_in_app')->default(true)->after('in_app_notification_data');
        });
    }

    public function down()
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn('show_in_app');
        });
    }
};
```

- [ ] **Step 3: Add `show_in_app` to the `Notification` model `$fillable`**

In `app/Models/Notification.php`, change the `$fillable` array to append `'show_in_app'`:

```php
    protected $fillable = [
        'trigger',
        'comments',
        'whatsapp_sms_body',
        'status_whatsapp',
        'status_sms',
        'email_subject',
        'email_title',
        'email_body',
        "email_image",
        'email_deep_link',
        'email_status',
        'in_app_notification_title',
        'in_app_notification_description',
        'in_app_notification_image',
        'in_app_notification_data',
        'show_in_app',
    ];
```

- [ ] **Step 4: Write the `UserNotification` model**

Create `app/Models/UserNotification.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserNotification extends Model
{
    use SoftDeletes;

    protected $table = 'user_notifications';

    protected $fillable = [
        'user_id',
        'notification_id',
        'trigger',
        'type',
        'title',
        'body',
        'image',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function template()
    {
        return $this->belongsTo(Notification::class, 'notification_id');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeVisible($query)
    {
        return $query->whereHas('template', function ($q) {
            $q->where('show_in_app', true);
        });
    }

    /**
     * Persist one row per recipient for a template-backed notification.
     * No-op when the template is hidden from the app center.
     *
     * @param  int[]  $userIds
     * @param  string|array|null  $data  rendered JSON string or array payload
     */
    public static function record(array $userIds, Notification $notice, string $title, ?string $body, ?string $image = null, $data = null): void
    {
        if (! $notice->show_in_app) {
            return;
        }

        $decoded = null;
        if (is_array($data)) {
            $decoded = $data;
        } elseif (is_string($data) && $data !== '') {
            $decoded = json_decode($data, true) ?: null;
        }

        $type = $decoded['notification_type'] ?? $notice->trigger;
        $now = now();

        $rows = [];
        foreach (array_unique($userIds) as $userId) {
            $rows[] = [
                'user_id' => $userId,
                'notification_id' => $notice->id,
                'trigger' => $notice->trigger,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'image' => $image,
                'data' => $decoded ? json_encode($decoded) : null,
                'read_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            static::insert($chunk);
        }
    }
}
```

- [ ] **Step 5: Write the failing persistence test**

Create `tests/Feature/UserNotificationRecordTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserNotificationRecordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['broadcasting.default' => 'null']);
    }

    public function test_record_inserts_a_row_when_template_is_visible(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = Notification::create([
            'trigger' => 'profile_liked',
            'show_in_app' => true,
            'in_app_notification_title' => 'Someone liked you',
            'in_app_notification_description' => 'Tap to view',
        ]);

        UserNotification::record(
            [$user->id],
            $notice,
            'Ali liked you',
            'Tap to view',
            null,
            json_encode(['notification_type' => 'profile_liked', 'other_user_id' => $user->id])
        );

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $user->id,
            'notification_id' => $notice->id,
            'type' => 'profile_liked',
            'title' => 'Ali liked you',
            'read_at' => null,
        ]);
    }

    public function test_record_skips_when_template_is_hidden(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = Notification::create([
            'trigger' => 'profile_visited',
            'show_in_app' => false,
        ]);

        UserNotification::record([$user->id], $notice, 'Title', 'Body', null, null);

        $this->assertDatabaseCount('user_notifications', 0);
    }

    public function test_record_falls_back_to_trigger_when_payload_has_no_type(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = Notification::create(['trigger' => 'membership_extended', 'show_in_app' => true]);

        UserNotification::record([$user->id], $notice, 'Extended', 'Body', null, null);

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $user->id,
            'type' => 'membership_extended',
        ]);
    }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `php artisan test --filter=UserNotificationRecordTest`
Expected: 3 passing (migrations run under `RefreshDatabase`, `record()` behaves as asserted).

- [ ] **Step 7: Commit**

```bash
git add database/migrations/2026_07_06_000001_create_user_notifications_table.php \
        database/migrations/2026_07_06_000002_add_show_in_app_to_notifications_table.php \
        app/Models/UserNotification.php app/Models/Notification.php \
        tests/Feature/UserNotificationRecordTest.php
git commit -m "feat(notifications): user_notifications table, model, and record()"
```

---

## Task 2: Wire persistence into the notification pipeline

**Files:**

- Modify: `app/Http/Traits/SendEmailNotification.php:77-98`
- Test: `tests/Feature/UserNotificationRecordTest.php` (add one method)

- [ ] **Step 1: Write the failing integration test**

Append this method to `tests/Feature/UserNotificationRecordTest.php` (and add the imports `use App\Events\SetNotificationAction;` and `use Illuminate\Support\Facades\Event;` at the top):

```php
    public function test_transform_in_app_notification_persists_a_row(): void
    {
        Event::fake([SetNotificationAction::class]); // stop the FCM listener from running

        $user = User::factory()->create([
            'in_app_notifications' => 1,
            'email_notification' => 0,
            'interface_language_id' => null,
        ]);
        Notification::create([
            'trigger' => 'profile_liked',
            'show_in_app' => true,
            'email_status' => 0,
            'in_app_notification_title' => ':username liked you',
            'in_app_notification_description' => 'Tap to view',
            'in_app_notification_data' => json_encode(['notification_type' => 'profile_liked']),
        ]);

        $host = new class {
            use \App\Http\Traits\SendEmailNotification;
        };
        $host->transformNotifications('profile_liked', [$user->id], ['full_name' => 'Ali']);

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $user->id,
            'type' => 'profile_liked',
        ]);
        Event::assertDispatched(SetNotificationAction::class);
    }
```

- [ ] **Step 2: Run it to verify it fails**

Run: `php artisan test --filter=test_transform_in_app_notification_persists_a_row`
Expected: FAIL — `user_notifications` has no row (persistence not wired yet).

- [ ] **Step 3: Add the `record()` call inside `transformInAppNotification`**

In `app/Http/Traits/SendEmailNotification.php`, inside the `try` block of `transformInAppNotification` (currently lines 79-88), add the persistence call immediately before `Event::dispatch(...)`:

```php
    private function transformInAppNotification(array $toUserId,array $keyAttributes,$notice){

        try{

        $in_app_notification_title = $this->replace_string($notice->in_app_notification_title,$keyAttributes);
        $in_app_notification_description = $this->replace_string($notice->in_app_notification_description,$keyAttributes);
        $in_app_notification_image = $notice->in_app_notification_image;
        $keyAttributes['other_user_id'] = $toUserId[0];
        $in_app_notification_data = $this->replace_string($notice->in_app_notification_data , $keyAttributes) ;
        $in_app_notification_press_action = null;

        \App\Models\UserNotification::record(
            $toUserId,
            $notice,
            $in_app_notification_title,
            $in_app_notification_description,
            $in_app_notification_image,
            $in_app_notification_data
        );

        Event::dispatch(new SetNotificationAction($toUserId, $in_app_notification_title , $in_app_notification_description,$in_app_notification_press_action,$in_app_notification_image,$in_app_notification_data));


    }catch(Throwable $ex){
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `php artisan test --filter=UserNotificationRecordTest`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Traits/SendEmailNotification.php tests/Feature/UserNotificationRecordTest.php
git commit -m "feat(notifications): persist user notifications at dispatch"
```

---

## Task 3: API resource + controller + routes

**Files:**

- Create: `app/Http/Resources/UserNotificationResource.php`
- Create: `app/Http/Controllers/Api/NotificationController.php`
- Modify: `routes/api.php:51-124`
- Test: `tests/Feature/UserNotificationApiTest.php`

- [ ] **Step 1: Write the resource**

Create `app/Http/Resources/UserNotificationResource.php`:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserNotificationResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'trigger' => $this->trigger,
            'title' => $this->title,
            'body' => $this->body,
            'image' => $this->image,
            'data' => $this->data,
            'is_read' => ! is_null($this->read_at),
            'read_at' => optional($this->read_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
```

- [ ] **Step 2: Write the controller**

Create `app/Http/Controllers/Api/NotificationController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserNotificationResource;
use App\Http\Traits\ResponseAPI;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Lang;

class NotificationController extends Controller
{
    use ResponseAPI;

    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $perPage = (int) $request->get('per_page', 20);

            $items = UserNotification::forUser($user->id)
                ->visible()
                ->recent()
                ->orderByDesc('created_at')
                ->paginate($perPage);

            $collection = UserNotificationResource::collection($items);

            return $this->success(JsonResponse::HTTP_OK, 'Notifications fetched successfully', $collection, $items->total());
        } catch (\Exception $ex) {
            return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
        }
    }

    public function markRead(Request $request, $id)
    {
        try {
            $user = $request->user();
            $notification = UserNotification::forUser($user->id)->findOrFail($id);

            if (is_null($notification->read_at)) {
                $notification->read_at = now();
                $notification->save();
            }

            return $this->success(JsonResponse::HTTP_OK, 'Notification marked as read', new UserNotificationResource($notification));
        } catch (\Exception $ex) {
            return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
        }
    }

    public function markAllRead(Request $request)
    {
        try {
            $user = $request->user();
            $updated = UserNotification::forUser($user->id)->unread()->update(['read_at' => now()]);

            return $this->success(JsonResponse::HTTP_OK, 'All notifications marked as read', ['updated' => $updated]);
        } catch (\Exception $ex) {
            return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $notification = UserNotification::forUser($user->id)->findOrFail($id);
            $notification->delete();

            return $this->success(JsonResponse::HTTP_OK, 'Notification deleted successfully');
        } catch (\Exception $ex) {
            return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
        }
    }

    public function clearAll(Request $request)
    {
        try {
            $user = $request->user();
            $cleared = UserNotification::forUser($user->id)->delete();

            return $this->success(JsonResponse::HTTP_OK, 'Notifications cleared successfully', ['cleared' => $cleared]);
        } catch (\Exception $ex) {
            return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
        }
    }
}
```

- [ ] **Step 3: Register the routes**

In `routes/api.php`, add `NotificationController` to the `Api` import group on line 3:

```php
use App\Http\Controllers\Api\{AuthController, ConversationController, listingController, NotificationController, WebhookController};
```

Then inside the `auth:api_user` group (after the `conversations` group closes, e.g. after line 70), add:

```php
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::post('mark-all-read', [NotificationController::class, 'markAllRead']);
            Route::delete('clear-all', [NotificationController::class, 'clearAll']);
            Route::post('{id}/read', [NotificationController::class, 'markRead']);
            Route::delete('{id}', [NotificationController::class, 'destroy']);
        });
```

> Order matters: `mark-all-read` and `clear-all` are declared before the `{id}` routes so they are not captured as an id.

- [ ] **Step 4: Write the feature tests**

Create `tests/Feature/UserNotificationApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserNotificationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['broadcasting.default' => 'null']);
    }

    private function visibleTemplate(bool $show = true): Notification
    {
        return Notification::create(['trigger' => 'profile_liked', 'show_in_app' => $show]);
    }

    private function makeRow(User $user, Notification $notice, array $overrides = []): UserNotification
    {
        return UserNotification::create(array_merge([
            'user_id' => $user->id,
            'notification_id' => $notice->id,
            'trigger' => $notice->trigger,
            'type' => 'profile_liked',
            'title' => 'Hello',
            'body' => 'World',
            'read_at' => null,
        ], $overrides));
    }

    public function test_index_returns_own_visible_recent_notifications_newest_first(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = $this->visibleTemplate();
        $this->makeRow($user, $notice, ['title' => 'Older'])->forceFill(['created_at' => now()->subMinutes(10)])->save();
        $this->makeRow($user, $notice, ['title' => 'Newer']);

        $response = $this->actingAs($user, 'api_user')->getJson('/api/v1/app/auth/notifications');

        $response->assertOk()
            ->assertJsonPath('results.0.title', 'Newer')
            ->assertJsonPath('results.1.title', 'Older')
            ->assertJsonPath('total', 2);
    }

    public function test_index_hides_rows_whose_template_is_unticked(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = $this->visibleTemplate(false); // show_in_app = false
        $this->makeRow($user, $notice);

        $response = $this->actingAs($user, 'api_user')->getJson('/api/v1/app/auth/notifications');

        $response->assertOk()->assertJsonCount(0, 'results');
    }

    public function test_index_excludes_other_users_and_rows_older_than_seven_days(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $other = User::factory()->create(['interface_language_id' => null]);
        $notice = $this->visibleTemplate();

        $this->makeRow($other, $notice, ['title' => 'Not mine']);
        $this->makeRow($user, $notice, ['title' => 'Too old'])->forceFill(['created_at' => now()->subDays(8)])->save();
        $this->makeRow($user, $notice, ['title' => 'Mine recent']);

        $response = $this->actingAs($user, 'api_user')->getJson('/api/v1/app/auth/notifications');

        $response->assertOk()
            ->assertJsonCount(1, 'results')
            ->assertJsonPath('results.0.title', 'Mine recent');
    }

    public function test_mark_read_sets_read_at_for_owned_row(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $row = $this->makeRow($user, $this->visibleTemplate());

        $this->actingAs($user, 'api_user')
            ->postJson("/api/v1/app/auth/notifications/{$row->id}/read")
            ->assertOk()
            ->assertJsonPath('results.is_read', true);

        $this->assertNotNull($row->fresh()->read_at);
    }

    public function test_mark_all_read_marks_every_unread_row(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = $this->visibleTemplate();
        $this->makeRow($user, $notice);
        $this->makeRow($user, $notice);

        $this->actingAs($user, 'api_user')
            ->postJson('/api/v1/app/auth/notifications/mark-all-read')
            ->assertOk()
            ->assertJsonPath('results.updated', 2);

        $this->assertSame(0, UserNotification::forUser($user->id)->unread()->count());
    }

    public function test_destroy_soft_deletes_owned_row(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $row = $this->makeRow($user, $this->visibleTemplate());

        $this->actingAs($user, 'api_user')
            ->deleteJson("/api/v1/app/auth/notifications/{$row->id}")
            ->assertOk();

        $this->assertSoftDeleted('user_notifications', ['id' => $row->id]);
    }

    public function test_clear_all_soft_deletes_all_owned_rows(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = $this->visibleTemplate();
        $this->makeRow($user, $notice);
        $this->makeRow($user, $notice);

        $this->actingAs($user, 'api_user')
            ->deleteJson('/api/v1/app/auth/notifications/clear-all')
            ->assertOk()
            ->assertJsonPath('results.cleared', 2);

        $this->assertSame(0, UserNotification::forUser($user->id)->count());
    }

    public function test_cannot_mark_read_another_users_notification(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $other = User::factory()->create(['interface_language_id' => null]);
        $row = $this->makeRow($other, $this->visibleTemplate());

        $this->actingAs($user, 'api_user')
            ->postJson("/api/v1/app/auth/notifications/{$row->id}/read")
            ->assertStatus(500); // findOrFail on a scoped query → not found
    }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `php artisan test --filter=UserNotificationApiTest`
Expected: 8 passing.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Resources/UserNotificationResource.php \
        app/Http/Controllers/Api/NotificationController.php \
        routes/api.php tests/Feature/UserNotificationApiTest.php
git commit -m "feat(notifications): add mobile notification API endpoints"
```

---

## Task 4: Add `unread_notifications` to the counter

**Files:**

- Modify: `app/Http/Controllers/Api/AuthController.php:257-277`
- Test: `tests/Feature/UserNotificationApiTest.php` (add one method)

- [ ] **Step 1: Write the failing test**

Append to `tests/Feature/UserNotificationApiTest.php`:

```php
    public function test_counter_includes_unread_notifications_count(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = $this->visibleTemplate();
        $this->makeRow($user, $notice); // unread
        $this->makeRow($user, $notice, ['read_at' => now()]); // read

        $this->actingAs($user, 'api_user')
            ->getJson('/api/v1/app/auth/counter')
            ->assertOk()
            ->assertJsonPath('results.unread_notifications', 1);
    }
```

- [ ] **Step 2: Run it to verify it fails**

Run: `php artisan test --filter=test_counter_includes_unread_notifications_count`
Expected: FAIL — `results.unread_notifications` missing.

- [ ] **Step 3: Add the count to `getCounter`**

In `app/Http/Controllers/Api/AuthController.php`, add `use App\Models\UserNotification;` to the imports if not present, then update `getCounter` (lines 257-277) so `$result` always includes the count:

```php
    public function getCounter()
    {
        $current_user = request()->User();
        try {
            $data = collect($current_user->all_interaction);
            $result = [
                'like_you_counter' => null,
                'visit_you_counter' => null,
                'photo_requested_you_counter' => null,
            ];
            if ($data) {
                $result['like_you_counter'] = $data->where('type', 1)->pluck('counter')->first();
                $result['visit_you_counter'] = $data->where('type', 3)->pluck('counter')->first();
                $result['photo_requested_you_counter'] = $data->where('type', 5)->pluck('counter')->first();
            }

            $result['unread_notifications'] = UserNotification::forUser($current_user->id)
                ->visible()->recent()->unread()->count();

            return $this->success(JsonResponse::HTTP_OK, Lang::get('response.find'), $result);
        } catch (Exception $ex) {
            return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
        } finally {
            Event::dispatch(new SetUserOnlineAt($current_user->id));
        }
    }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `php artisan test --filter=UserNotificationApiTest`
Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Api/AuthController.php tests/Feature/UserNotificationApiTest.php
git commit -m "feat(notifications): expose unread_notifications in counter"
```

---

## Task 5: Daily 7-day prune command

**Files:**

- Create: `app/Console/Commands/PruneUserNotifications.php`
- Modify: `app/Console/Kernel.php:17-33`
- Test: `tests/Feature/PruneUserNotificationsTest.php`

- [ ] **Step 1: Write the command**

Create `app/Console/Commands/PruneUserNotifications.php`:

```php
<?php

namespace App\Console\Commands;

use App\Models\UserNotification;
use Illuminate\Console\Command;

class PruneUserNotifications extends Command
{
    protected $signature = 'notifications:prune-user {--days=7 : Override retention days}';

    protected $description = 'Force-delete user notifications older than the retention window (default 7 days).';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: 7);
        $cutoff = now()->subDays($days);

        $deleted = UserNotification::withTrashed()
            ->where('created_at', '<', $cutoff)
            ->forceDelete();

        $this->info("Pruned {$deleted} user notifications older than {$days} days.");

        return self::SUCCESS;
    }
}
```

- [ ] **Step 2: Register + schedule it in the Kernel**

In `app/Console/Kernel.php`, add to `$commands`:

```php
    protected $commands = [
        Commands\MembershipExpirySoon::class,
        Commands\MembershipExpire::class,
        Commands\RecommendationNotice::class,
        Commands\ResetDailyChatCreditUsed::class,
        Commands\PruneApiErrorLogs::class,
        Commands\PruneUserNotifications::class,
    ];
```

And add to `schedule()`:

```php
        $schedule->command('notifications:prune-user')->dailyAt('02:00');
```

- [ ] **Step 3: Write the failing test**

Create `tests/Feature/PruneUserNotificationsTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PruneUserNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['broadcasting.default' => 'null']);
    }

    public function test_prune_removes_rows_older_than_seven_days_including_soft_deleted(): void
    {
        $user = User::factory()->create(['interface_language_id' => null]);
        $notice = Notification::create(['trigger' => 'profile_liked', 'show_in_app' => true]);

        $base = ['user_id' => $user->id, 'notification_id' => $notice->id, 'type' => 'profile_liked', 'title' => 'x'];

        $recent = UserNotification::create($base);
        $old = UserNotification::create($base);
        $old->forceFill(['created_at' => now()->subDays(8)])->save();
        $oldCleared = UserNotification::create($base);
        $oldCleared->forceFill(['created_at' => now()->subDays(9)])->save();
        $oldCleared->delete(); // soft-deleted + old

        $this->artisan('notifications:prune-user')->assertSuccessful();

        $this->assertDatabaseHas('user_notifications', ['id' => $recent->id]);
        $this->assertDatabaseMissing('user_notifications', ['id' => $old->id]);
        $this->assertDatabaseMissing('user_notifications', ['id' => $oldCleared->id]);
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `php artisan test --filter=PruneUserNotificationsTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Console/Commands/PruneUserNotifications.php app/Console/Kernel.php \
        tests/Feature/PruneUserNotificationsTest.php
git commit -m "feat(notifications): daily 7-day prune command"
```

---

## Task 6: Admin "Show in app" toggle

**Files:**

- Modify: `app/Http/Controllers/Admin/NotificationController.php:179-192`
- Modify: `resources/views/admin/pages/notifications/index.blade.php:24-55`

- [ ] **Step 1: Accept `show_in_app` in `updateStatus`**

In `app/Http/Controllers/Admin/NotificationController.php`, change the `$fieldsToUpdate` line in `updateStatus`:

```php
    public function updateStatus(Request $request, $id)
    {
        try {

            $notification = Notification::findOrFail($id);

            $fieldsToUpdate = $request->only(['email_status', 'status_whatsapp', 'status_sms', 'show_in_app']);
            $notification->update($fieldsToUpdate);

            return response()->json(['success' => true, 'message' => 'Notification updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
```

- [ ] **Step 2: Add the "Show in app" column header**

In `resources/views/admin/pages/notifications/index.blade.php`, add a header cell after the `SMS` header (line 31):

```html
<th>Whats app</th>
<th>Email</th>
<th>SMS</th>
<th>Show in app</th>
<th class="action-buttons">Actions</th>
```

- [ ] **Step 3: Add the toggle cell**

In the same file, add a cell after the SMS toggle cell (after line 55, before the `action-buttons` `<td>`):

```html
<td>
  <div class="form-check form-switch">
    <input
      class="form-check-input"
      name="show_in_app"
      type="checkbox"
      id="show_in_app"
      value="1"
      {{$notification-
    />show_in_app == 1 ? 'checked' : ''}}>
  </div>
</td>
```

> The existing generic change handler (`resources/views/admin/pages/notifications/index.blade.php:203-230`) reads the input's `name` attribute and posts `{show_in_app: 0|1}` to `update-status` — no JS change needed.

- [ ] **Step 4: Manual verification**

Run the admin locally (`php artisan serve`), open `/admin/notifications`, toggle "Show in app" on a row, and confirm the network request `POST /admin/notifications/{id}/update-status` returns `{success:true}` and the DB `notifications.show_in_app` value flips. (This UI toggle has no automated test — admin web-auth setup is out of scope for this plan.)

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Admin/NotificationController.php \
        resources/views/admin/pages/notifications/index.blade.php
git commit -m "feat(notifications): admin show_in_app visibility toggle"
```

---

## Task 7: Full suite + curation

- [ ] **Step 1: Run the full notification test suite**

Run: `php artisan test --filter=Notification`
Expected: `UserNotificationRecordTest` (4) + `UserNotificationApiTest` (9) + `PruneUserNotificationsTest` (1) all pass.

- [ ] **Step 2: Curate default visibility for functional triggers**

The `show_in_app` column defaults to `true`, so every existing template is visible. In the admin `/admin/notifications` screen, untick the system/functional triggers that should not appear in the customer center — at minimum: `app_update`, `account_suspension`, `account_unsuspended`, `update_profile_picture_forced_males_only`, and any chat trigger (`someone_messaged_you_notification`) if you don't want the center to duplicate the Messages screen. (No code change — operator action. Recorded here so it is not forgotten.)

- [ ] **Step 3: Final commit (if any doc/notes changed)**

```bash
git add -A
git commit -m "chore(notifications): backend complete" --allow-empty
```

---

## Done criteria

- `php artisan test --filter=Notification` is green.
- Sending any in-app notification whose template is ticked creates a `user_notifications` row per recipient; unticked templates create none and are hidden from the list/counter retroactively.
- `GET /api/v1/app/auth/notifications` returns the caller's visible, ≤7-day notifications newest-first with a `total`; read/mark-all-read/delete/clear-all all work and are user-scoped.
- `/api/v1/app/auth/counter` returns `unread_notifications`.
- `notifications:prune-user` hard-deletes rows older than 7 days and is scheduled daily.
- Admin `/admin/notifications` has a working "Show in app" toggle.
