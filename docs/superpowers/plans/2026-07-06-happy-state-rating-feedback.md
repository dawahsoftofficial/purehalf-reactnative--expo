# Happy-State Rating & Feedback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prompt a member for an in-app star+comment rating after sustained chat activity; save every rating to the backend for staff to view, send 4–5★ raters to the native store review, and keep the whole cadence tunable (and killable) from the admin panel.

**Architecture:** Two repos. **Admin (Laravel 9)** owns a `ratings` table, a Passport-authed `POST /v1/app/auth/rating/store` endpoint, a single `rating_prompt` JSON `Setting` row (the tunable cadence + safety kill-switch, editable via a dedicated admin form), and a read-only Ratings list. **Mobile (RN 0.82)** tracks messages-sent in MMKV, evaluates a pure eligibility function when the user leaves a chat, and shows a root-mounted modal that POSTs the rating and (for 4–5★) calls the already-present `requestRateApp()`.

**Tech Stack:** Laravel 9 + Passport + Blade/DataTables + phpunit; React Native 0.82 + Zustand + MMKV + i18next + `react-native-in-app-review` (already installed) + jest.

**Repos & working dirs:**

- Admin: `D:\GitHub\Pure Half\admin` (Part A)
- Mobile: `D:\GitHub\Pure Half\app-old` (Part B)

Build **Part A first** (the mobile side consumes its endpoint + setting). Commit each part in its own repo.

---

## File Structure

### Part A — Admin (`admin/`)

- Create `database/migrations/2026_07_06_000001_create_ratings_table.php` — ratings schema
- Create `database/migrations/2026_07_06_000002_add_rating_prompt_setting.php` — seed the tunable setting row
- Create `app/Models/Rating.php` — model + user relation + star badge accessor
- Modify `app/Models/User.php` — add `ratings()` hasMany
- Create `app/Http/Requests/Api/StoreRatingRequest.php` — validation
- Create `app/Http/Controllers/Api/RatingController.php` — `store`
- Modify `routes/api.php` — register endpoint
- Modify `app/Http/Controllers/Admin/GeneralController.php` — `ratingIndex`, `ratingSettingsIndex`, `ratingSettingsUpdate`
- Modify `routes/web.php` — admin routes
- Create `resources/views/admin/pages/general/rating/index.blade.php` + `table.blade.php` — list
- Create `resources/views/admin/pages/general/rating/settings.blade.php` — cadence form
- Modify `resources/views/partials/sidebar.blade.php` — nav entries
- Create `tests/Feature/RatingStoreTest.php` — endpoint tests

### Part B — Mobile (`app-old/`)

- Create `src/services/rating/ratingEngagement.ts` — MMKV state + pure `shouldShowRatingPrompt` + orchestrator
- Create `src/stores/rating-store.ts` — modal visibility store
- Modify `src/stores/index.ts` — export rating-store
- Modify `src/stores/settings-store.ts` — `RatingPromptConfig` type + `getRatingPrompt()` selector
- Create `src/components/rating/RatingPromptModal.tsx` — the popup
- Modify `src/services/api/EndPoints.tsx` + `src/services/api/Services.tsx` — `storeRating`
- Modify `src/screens/messages/hooks/useSendMessage.ts` — increment counter
- Modify `src/screens/messages/SingleChat.tsx` — evaluate on chat blur
- Modify `src/initialization/Initialization.tsx` — mount modal + record first open
- Modify `src/languages/Keys.tsx` + every `src/languages/*.json` — i18n keys
- Modify `jest-setup.ts` — repair broken import (prereq for the unit test)
- Create `src/services/rating/__tests__/ratingEngagement.test.ts` — eligibility unit tests

---

# PART A — ADMIN (Laravel)

> Run all Part A commands from `D:\GitHub\Pure Half\admin`. Start on a feature branch:
>
> ```bash
> cd "D:/GitHub/Pure Half/admin" && git checkout -b feature/happy-state-rating
> ```

### Task A1: Ratings table migration

**Files:**

- Create: `admin/database/migrations/2026_07_06_000001_create_ratings_table.php`

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->unsignedTinyInteger('stars');
            $table->text('comment')->nullable();
            $table->string('trigger_event')->nullable();
            $table->string('platform')->nullable();
            $table->string('app_version')->nullable();
            $table->boolean('sent_to_store')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
```

- [ ] **Step 2: Run the migration**

Run: `php artisan migrate`
Expected: `Migrating: 2026_07_06_000001_create_ratings_table` … `DONE`

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_07_06_000001_create_ratings_table.php
git commit -m "feat(rating): add ratings table"
```

---

### Task A2: Seed the tunable `rating_prompt` setting

**Files:**

- Create: `admin/database/migrations/2026_07_06_000002_add_rating_prompt_setting.php`

**Note:** This one JSON `Setting` row is both the mobile config source (returned as-is by the existing `settingIndex`) and the admin's safety control surface. Keys are camelCase to match the mobile store.

- [ ] **Step 1: Write the migration**

```php
<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (!Setting::where('key', 'rating_prompt')->exists()) {
            Setting::create([
                'title' => 'Rating Prompt',
                'description' => 'Controls when the in-app rating popup is shown to members. Set "enabled" to false to switch the feature off.',
                'key' => 'rating_prompt',
                'type' => 'json',
                'value' => [
                    'enabled' => true,
                    'minAccountAgeDays' => 7,
                    'minSentMessages' => 15,
                    'cooldownDays' => 60,
                    'maxPrompts' => 3,
                    'storeMinStars' => 4,
                ],
                'is_active' => 1,
            ]);
        }
    }

    public function down(): void
    {
        Setting::where('key', 'rating_prompt')->delete();
    }
};
```

- [ ] **Step 2: Run it and verify the row exists**

Run: `php artisan migrate`
Then: `php artisan tinker --execute="echo json_encode(App\Models\Setting::where('key','rating_prompt')->first()->value);"`
Expected: `{"enabled":true,"minAccountAgeDays":7,"minSentMessages":15,"cooldownDays":60,"maxPrompts":3,"storeMinStars":4}`

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_07_06_000002_add_rating_prompt_setting.php
git commit -m "feat(rating): seed tunable rating_prompt setting"
```

---

### Task A3: Rating model + User relation

**Files:**

- Create: `admin/app/Models/Rating.php`
- Modify: `admin/app/Models/User.php`

- [ ] **Step 1: Create the model**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rating extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'stars',
        'comment',
        'trigger_event',
        'platform',
        'app_version',
        'sent_to_store',
    ];

    protected $casts = [
        'stars' => 'integer',
        'sent_to_store' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // Bootstrap-badge class for the admin list, keyed by star count.
    public function getStarsBadgeAttribute(): string
    {
        if ($this->stars >= 4) {
            return 'bg-success-light text-success';
        }
        if ($this->stars == 3) {
            return 'bg-warning-light text-warning';
        }
        return 'bg-danger-light text-danger';
    }

    public function scopeStarsFilter($query, $stars)
    {
        return $query->where('stars', (int) $stars);
    }
}
```

- [ ] **Step 2: Add the relation to User**

In `admin/app/Models/User.php`, add this method alongside the other relations (e.g. right after the existing `query_customer()` relation):

```php
    public function ratings()
    {
        return $this->hasMany(Rating::class, 'user_id', 'id');
    }
```

- [ ] **Step 3: Verify both load**

Run: `php artisan tinker --execute="echo get_class(new App\Models\Rating()); echo PHP_EOL; echo (new App\Models\User())->ratings()->getRelated()::class;"`
Expected: `App\Models\Rating` then `App\Models\Rating`

- [ ] **Step 4: Commit**

```bash
git add app/Models/Rating.php app/Models/User.php
git commit -m "feat(rating): add Rating model and User relation"
```

---

### Task A4: Store endpoint (TDD)

**Files:**

- Create: `admin/app/Http/Requests/Api/StoreRatingRequest.php`
- Create: `admin/app/Http/Controllers/Api/RatingController.php`
- Modify: `admin/routes/api.php`
- Test: `admin/tests/Feature/RatingStoreTest.php`

- [ ] **Step 1: Write the failing feature test**

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

class RatingStoreTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): User
    {
        $user = User::factory()->create();
        Passport::actingAs($user, ['user'], 'api_user');
        return $user;
    }

    public function test_authenticated_user_can_submit_a_high_rating(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/v1/app/auth/rating/store', [
            'stars' => 5,
            'comment' => 'Great app',
            'trigger_event' => 'chat_activity',
            'platform' => 'ios',
            'app_version' => '0.0.1',
        ])->assertOk();

        $this->assertDatabaseHas('ratings', [
            'user_id' => $user->id,
            'stars' => 5,
            'comment' => 'Great app',
            'sent_to_store' => 1,
        ]);
    }

    public function test_low_rating_is_not_flagged_for_store(): void
    {
        $user = $this->actingAsUser();

        $this->postJson('/v1/app/auth/rating/store', [
            'stars' => 2,
            'comment' => 'needs work',
        ])->assertOk();

        $this->assertDatabaseHas('ratings', [
            'user_id' => $user->id,
            'stars' => 2,
            'sent_to_store' => 0,
        ]);
    }

    public function test_stars_out_of_range_is_rejected(): void
    {
        $this->actingAsUser();

        $this->postJson('/v1/app/auth/rating/store', ['stars' => 7])
            ->assertStatus(422);
    }
}
```

> If `User::factory()` fails because the factory omits required NOT-NULL columns, create the user explicitly instead: `User::create([...])` with the minimal required fields (inspect `users` migration for NOT-NULL columns without defaults — typically `first_name`, `gender`, `status`), and keep the rest of each test identical.

- [ ] **Step 2: Run the test to verify it fails**

Run: `php artisan test --filter=RatingStoreTest`
Expected: FAIL — 404/route-not-defined (endpoint doesn't exist yet).

- [ ] **Step 3: Create the FormRequest**

```php
<?php

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\BaseRequest;

class StoreRatingRequest extends BaseRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'stars' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'trigger_event' => 'nullable|string|max:50',
            'platform' => 'nullable|string|max:20',
            'app_version' => 'nullable|string|max:20',
        ];
    }
}
```

- [ ] **Step 4: Create the controller**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreRatingRequest;
use App\Http\Traits\ResponseAPI;
use App\Models\Setting;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Lang;

class RatingController extends Controller
{
    use ResponseAPI;

    public function store(StoreRatingRequest $request)
    {
        try {
            $user = $request->user();
            $data = $request->only(['stars', 'comment', 'trigger_event', 'platform', 'app_version']);

            $settingRow = Setting::where('key', 'rating_prompt')->first();
            $config = $settingRow ? $settingRow->value : [];
            $threshold = $config['storeMinStars'] ?? 4;
            $data['sent_to_store'] = (int) $data['stars'] >= (int) $threshold;

            $user->ratings()->create($data);

            return $this->success(JsonResponse::HTTP_OK, Lang::get('response.created'));
        } catch (Exception $ex) {
            return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
        }
    }
}
```

- [ ] **Step 5: Register the route**

In `admin/routes/api.php`, add `RatingController` to the top `use` import:

```php
use App\Http\Controllers\Api\{AuthController, ConversationController, listingController, RatingController, WebhookController};
```

Then inside the `['prefix' => 'auth', 'middleware' => ['auth:api_user', 'scope.abilities:user']]` group (e.g. right after the existing `query` prefix block at lines 102–104), add:

```php
        Route::prefix('rating')->group(function () {
            Route::post('store', [RatingController::class, 'store']);
        });
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `php artisan test --filter=RatingStoreTest`
Expected: PASS (3 tests).

> If the failure is Passport-key related (`personal access client not found`), run `php artisan passport:keys --force` in the test env or add `Passport::actingAs` prerequisites per the project's existing API tests, then re-run.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Requests/Api/StoreRatingRequest.php app/Http/Controllers/Api/RatingController.php routes/api.php tests/Feature/RatingStoreTest.php
git commit -m "feat(rating): add authenticated rating store endpoint with tests"
```

---

### Task A5: Admin controller methods (list + settings form)

**Files:**

- Modify: `admin/app/Http/Controllers/Admin/GeneralController.php`

- [ ] **Step 1: Add model imports**

At the top of `GeneralController.php`, add to the `use` block:

```php
use App\Models\Rating;
use App\Models\Setting;
```

- [ ] **Step 2: Add the three methods**

Add inside the `GeneralController` class (e.g. after `queryDelete`):

```php
    public function ratingIndex(Request $request)
    {
        $stars = $request->get('stars');

        $query = Rating::with(['user' => function ($q) {
            $q->select('id', 'first_name', 'last_name', 'phone_number', 'email');
        }])->latest();

        if ($stars !== null && $stars !== '') {
            $query->where('stars', (int) $stars);
        }

        $data['data'] = $query->get();
        $data['stars'] = $stars;

        return view('admin.pages.general.rating.index', $data);
    }

    public function ratingSettingsIndex()
    {
        $action = 'rating-settings';
        $setting = Setting::where('key', 'rating_prompt')->first();
        $config = $setting?->value ?: [
            'enabled' => true,
            'minAccountAgeDays' => 7,
            'minSentMessages' => 15,
            'cooldownDays' => 60,
            'maxPrompts' => 3,
            'storeMinStars' => 4,
        ];

        return view('admin.pages.general.rating.settings', compact('action', 'config'));
    }

    public function ratingSettingsUpdate(Request $request)
    {
        try {
            $request->validate([
                'minAccountAgeDays' => 'required|integer|min:0',
                'minSentMessages' => 'required|integer|min:1',
                'cooldownDays' => 'required|integer|min:0',
                'maxPrompts' => 'required|integer|min:1',
                'storeMinStars' => 'required|integer|min:1|max:5',
            ]);

            $setting = Setting::where('key', 'rating_prompt')->firstOrFail();
            $setting->value = [
                'enabled' => $request->boolean('enabled'),
                'minAccountAgeDays' => (int) $request->input('minAccountAgeDays'),
                'minSentMessages' => (int) $request->input('minSentMessages'),
                'cooldownDays' => (int) $request->input('cooldownDays'),
                'maxPrompts' => (int) $request->input('maxPrompts'),
                'storeMinStars' => (int) $request->input('storeMinStars'),
            ];
            $setting->save();

            return back()->with('success', Lang::get('response.updated'));
        } catch (Exception $ex) {
            return redirect()->back()->with('error', Lang::get('response.error.exception', ['attribute' => $ex->getMessage()]));
        }
    }
```

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/Admin/GeneralController.php
git commit -m "feat(rating): add admin rating list and settings controller methods"
```

---

### Task A6: Admin routes

**Files:**

- Modify: `admin/routes/web.php`

- [ ] **Step 1: Add routes to the `general` group**

Inside the `Route::name('general.')->prefix('general/')->group(...)` block (e.g. right after the `query` routes at lines 111–113), add:

```php
            Route::get('rating', [GeneralController::class, 'ratingIndex'])->name('rating.index');
            Route::get('rating/settings', [GeneralController::class, 'ratingSettingsIndex'])->name('rating.settings.index');
            Route::patch('rating/settings', [GeneralController::class, 'ratingSettingsUpdate'])->name('rating.settings.update');
```

- [ ] **Step 2: Verify routes are registered**

Run: `php artisan route:list --path=general/rating`
Expected: three rows — `admin.general.rating.index`, `admin.general.rating.settings.index`, `admin.general.rating.settings.update`.

- [ ] **Step 3: Commit**

```bash
git add routes/web.php
git commit -m "feat(rating): register admin rating routes"
```

---

### Task A7: Admin Blade views

**Files:**

- Create: `admin/resources/views/admin/pages/general/rating/index.blade.php`
- Create: `admin/resources/views/admin/pages/general/rating/table.blade.php`
- Create: `admin/resources/views/admin/pages/general/rating/settings.blade.php`

- [ ] **Step 1: List page (`index.blade.php`)**

```blade
@extends('layouts.app', ['title' => 'Ratings', 'main_ac' => 'general.rating', 'action' => 'rating-index'])
@push('css')
<link rel="stylesheet" href="{{ asset('assets/js/plugins/datatables-bs5/dataTables.bootstrap5.min.css') }}">
<link rel="stylesheet" href="{{ asset('assets/js/plugins/datatables-buttons-bs5/buttons.bootstrap5.min.css') }}">
@endpush

@section('content')
<div class="row">
    <div class="col-md-12">
        @include('alerts.error', ['session' => 'error']) @include('alerts.success', ['session' => 'success'])
        <div class="block block-rounded">
            <div class="block-header block-header-default">
                <h3 class="block-title">Member Ratings</h3>
                <form method="get" class="d-flex align-items-center">
                    <select name="stars" class="form-select form-select-sm me-2" onchange="this.form.submit()">
                        <option value="">All stars</option>
                        @for ($s = 5; $s >= 1; $s--)
                            <option value="{{ $s }}" {{ (string) request('stars') === (string) $s ? 'selected' : '' }}>{{ $s }} ★</option>
                        @endfor
                    </select>
                </form>
            </div>
            <div class="block-content py-md-3">
                @include('admin.pages.general.rating.table', ['data' => $data])
            </div>
        </div>
    </div>
</div>
@endsection

@push('js')
<script src="{{ asset('assets/js/lib/jquery.min.js') }}"></script>
<script src="{{ asset('assets/js/plugins/datatables/jquery.dataTables.min.js') }}"></script>
<script src="{{ asset('assets/js/plugins/datatables-bs5/dataTables.bootstrap5.min.js') }}"></script>
<script src="{{ asset('assets/js/pages/be_tables_datatables.min.js') }}"></script>
@endpush
```

- [ ] **Step 2: Table partial (`table.blade.php`)**

```blade
<table class="table table-bordered table-striped table-vcenter js-dataTable-full-pagination">
    <thead>
        <tr>
            <th class="text-center" style="width: 60px;">#</th>
            <th>Member</th>
            <th>Stars</th>
            <th>Comment</th>
            <th class="d-none d-sm-table-cell">Trigger</th>
            <th class="d-none d-sm-table-cell">Platform</th>
            <th class="d-none d-sm-table-cell">App Version</th>
            <th>Store?</th>
            <th>Created At</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($data as $key => $item)
            <tr>
                <td class="text-center fs-sm">{{ $key + 1 }}</td>
                <td class="fs-sm">
                    @if ($item->user)
                        <a href="{{ route('admin.user.show', $item->user->id) }}">
                            {{ $item->user->full_name }}
                            <br>{{ $item->user->phone_number ?: $item->user->email }}
                        </a>
                    @else
                        Deleted User
                    @endif
                </td>
                <td>
                    <span class="fs-xs fw-semibold d-inline-block py-1 px-3 rounded-pill {{ $item->stars_badge }}">
                        {{ $item->stars }} ★
                    </span>
                </td>
                <td>{{ $item->comment }}</td>
                <td class="d-none d-sm-table-cell fs-sm">{{ $item->trigger_event }}</td>
                <td class="d-none d-sm-table-cell fs-sm">{{ $item->platform }}</td>
                <td class="d-none d-sm-table-cell fs-sm">{{ $item->app_version }}</td>
                <td>
                    @if ($item->sent_to_store)
                        <span class="badge bg-success">Yes</span>
                    @else
                        <span class="badge bg-secondary">No</span>
                    @endif
                </td>
                <td class="fs-sm">{{ date('Y-m-d h:i a', strtotime($item->created_at)) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
```

- [ ] **Step 3: Settings form (`settings.blade.php`)**

```blade
@extends('layouts.app', ['title' => 'Rating Settings', 'main_ac' => 'general.rating', 'action' => 'rating-settings'])

@section('content')
<div class="row">
    <div class="col-md-8 col-lg-6">
        @include('alerts.error', ['session' => 'error']) @include('alerts.success', ['session' => 'success'])
        <div class="block block-rounded">
            <div class="block-header block-header-default">
                <h3 class="block-title">Rating Prompt Settings</h3>
            </div>
            <div class="block-content">
                <form action="{{ route('admin.general.rating.settings.update') }}" method="post">
                    @method('PATCH')
                    @csrf

                    <div class="form-check form-switch mb-4">
                        <input type="checkbox" class="form-check-input" id="enabled" name="enabled" value="1"
                            {{ !empty($config['enabled']) ? 'checked' : '' }}>
                        <label class="form-check-label" for="enabled"><strong>Enabled</strong> (master switch — uncheck to turn the prompt off)</label>
                    </div>

                    <div class="mb-3">
                        <label class="form-label" for="minAccountAgeDays">Minimum account age (days)</label>
                        <input type="number" min="0" class="form-control" id="minAccountAgeDays" name="minAccountAgeDays" value="{{ $config['minAccountAgeDays'] ?? 7 }}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="minSentMessages">Minimum messages sent</label>
                        <input type="number" min="1" class="form-control" id="minSentMessages" name="minSentMessages" value="{{ $config['minSentMessages'] ?? 15 }}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="cooldownDays">Cooldown between prompts (days)</label>
                        <input type="number" min="0" class="form-control" id="cooldownDays" name="cooldownDays" value="{{ $config['cooldownDays'] ?? 60 }}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label" for="maxPrompts">Maximum prompts per user</label>
                        <input type="number" min="1" class="form-control" id="maxPrompts" name="maxPrompts" value="{{ $config['maxPrompts'] ?? 3 }}">
                    </div>
                    <div class="mb-4">
                        <label class="form-label" for="storeMinStars">Stars needed to open store review</label>
                        <input type="number" min="1" max="5" class="form-control" id="storeMinStars" name="storeMinStars" value="{{ $config['storeMinStars'] ?? 4 }}">
                    </div>

                    <button type="submit" class="btn btn-primary">Save Settings</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
```

- [ ] **Step 4: Verify pages render**

Run: `php artisan serve` then log into the admin and visit `/admin/general/rating` and `/admin/general/rating/settings`.
Expected: the list renders (possibly empty) and the settings form shows the seeded defaults.

- [ ] **Step 5: Commit**

```bash
git add resources/views/admin/pages/general/rating/
git commit -m "feat(rating): add admin ratings list and settings views"
```

---

### Task A8: Sidebar navigation

**Files:**

- Modify: `admin/resources/views/partials/sidebar.blade.php`

- [ ] **Step 1: Add the nav block**

Immediately after the closing `</li>` of the existing `general.query` submenu (line ~270), insert:

```blade
                <li class="nav-main-item {{ $main_ac == 'general.rating' ? 'open' : '' }}">
                    <a class="nav-main-link nav-main-link-submenu" data-toggle="submenu" aria-haspopup="true"
                        aria-expanded="false" href="#">
                        <i class="nav-main-link-icon fa fa-star"></i>
                        <span class="nav-main-link-name">Ratings</span>
                    </a>
                    <ul class="nav-main-submenu">
                        <li class="nav-main-item">
                            <a class="nav-main-link {{ $action == 'rating-index' ? 'active' : '' }}"
                                href="{{ route('admin.general.rating.index') }}">
                                <span class="nav-main-link-name">List</span>
                            </a>
                        </li>
                        <li class="nav-main-item">
                            <a class="nav-main-link {{ $action == 'rating-settings' ? 'active' : '' }}"
                                href="{{ route('admin.general.rating.settings.index') }}">
                                <span class="nav-main-link-name">Prompt Settings</span>
                            </a>
                        </li>
                    </ul>
                </li>
```

- [ ] **Step 2: Verify**

Reload any admin page. Expected: a "Ratings" section appears in the sidebar with "List" and "Prompt Settings"; the active item highlights on each page.

- [ ] **Step 3: Commit**

```bash
git add resources/views/partials/sidebar.blade.php
git commit -m "feat(rating): add ratings sidebar navigation"
```

**Part A complete — the backend is now a shippable, tested unit.**

---

# PART B — MOBILE (React Native)

> Run all Part B commands from `D:\GitHub\Pure Half\app-old`. Start on a feature branch:
>
> ```bash
> cd "D:/GitHub/Pure Half/app-old" && git checkout -b feature/happy-state-rating
> ```

### Task B1: Settings-store config selector

**Files:**

- Modify: `app-old/src/stores/settings-store.ts`

- [ ] **Step 1: Add the config type** — after the `AppLink` type (line ~127), add:

```ts
type RatingPromptConfig = {
  enabled: boolean;
  minAccountAgeDays: number;
  minSentMessages: number;
  cooldownDays: number;
  maxPrompts: number;
  storeMinStars: number;
};

const RATING_PROMPT_DEFAULTS: RatingPromptConfig = {
  enabled: true,
  minAccountAgeDays: 7,
  minSentMessages: 15,
  cooldownDays: 60,
  maxPrompts: 3,
  storeMinStars: 4,
};
```

- [ ] **Step 2: Add to the `SettingValue` union** (line ~129) — add `| RatingPromptConfig`:

```ts
type SettingValue =
  | AuthenticationMethod
  | ChatCredits
  | boolean
  | MaxChatsPerDay
  | BadgesAndPayments
  | DailyRecommendations
  | PackagesAndEntitlements
  | RatingPromptConfig
  | AppLink[];
```

- [ ] **Step 3: Declare the selector in `SettingsState`** — add after `getAppLinks` (line ~165):

```ts
getRatingPrompt: () => RatingPromptConfig;
```

- [ ] **Step 4: Implement the selector** — add inside the store object, after `getAppLinks` (line ~221):

```ts
  getRatingPrompt: () => {
    const state = get();
    const value = state.getSettingByKey<RatingPromptConfig>('rating_prompt');
    return { ...RATING_PROMPT_DEFAULTS, ...(value ?? {}) };
  },
```

- [ ] **Step 5: Export the type** — add `RatingPromptConfig` to the `export type { ... }` block at the bottom (keep alphabetical-ish ordering; place after `PackagesAndEntitlements`):

```ts
  PackagesAndEntitlements,
  RatingPromptConfig,
  PaymentWallConfig,
```

- [ ] **Step 6: Type-check**

Run: `yarn type-check`
Expected: CLEAN (no new errors).

- [ ] **Step 7: Commit**

```bash
git add src/stores/settings-store.ts
git commit -m "feat(rating): expose rating_prompt config via settings store"
```

---

### Task B2: Rating modal store

**Files:**

- Create: `app-old/src/stores/rating-store.ts`
- Modify: `app-old/src/stores/index.ts`

- [ ] **Step 1: Create the store**

```ts
import { create } from 'zustand';

type RatingState = {
  visible: boolean;
  trigger: string | null;
  show: (trigger: string) => void;
  hide: () => void;
};

export const useRatingStore = create<RatingState>((set) => ({
  visible: false,
  trigger: null,
  show: (trigger: string) => set({ visible: true, trigger }),
  hide: () => set({ visible: false }),
}));
```

- [ ] **Step 2: Export from the barrel** — add to `src/stores/index.ts`:

```ts
export * from './rating-store';
```

- [ ] **Step 3: Type-check + commit**

Run: `yarn type-check` (Expected: CLEAN)

```bash
git add src/stores/rating-store.ts src/stores/index.ts
git commit -m "feat(rating): add rating modal store"
```

---

### Task B3: Engagement + eligibility module (with unit tests)

**Files:**

- Modify: `app-old/jest-setup.ts` (repair broken import — prerequisite)
- Create: `app-old/src/services/rating/ratingEngagement.ts`
- Test: `app-old/src/services/rating/__tests__/ratingEngagement.test.ts`

- [ ] **Step 1: Repair jest setup** — in `jest-setup.ts`, replace the broken line

```ts
import '@testing-library/react-native/extend-expect';
```

with:

```ts
import '@testing-library/react-native';
```

(In v13+ the matchers are bundled; the `/extend-expect` subpath was removed.)

- [ ] **Step 2: Create the module**

```ts
import { StorageManager } from '@/services/storageManager';
import type { RatingPromptConfig } from '@/stores/settings-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useRatingStore } from '@/stores/rating-store';

const KEYS = {
  firstOpenAt: 'rating.firstOpenAt',
  sentMessages: 'rating.sentMessagesCount',
  promptsShown: 'rating.promptsShownCount',
  lastPromptAt: 'rating.lastPromptAt',
  completed: 'rating.completed',
} as const;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const num = (s?: string | null): number => (s ? parseInt(s, 10) || 0 : 0);

export type RatingDeviceState = {
  firstOpenAt: number | null;
  sentMessagesCount: number;
  promptsShownCount: number;
  lastPromptAt: number | null;
  completed: boolean;
};

export function getRatingState(): RatingDeviceState {
  const firstOpen = StorageManager.getString(KEYS.firstOpenAt);
  const lastPrompt = StorageManager.getString(KEYS.lastPromptAt);
  return {
    firstOpenAt: firstOpen ? num(firstOpen) : null,
    sentMessagesCount: num(StorageManager.getString(KEYS.sentMessages)),
    promptsShownCount: num(StorageManager.getString(KEYS.promptsShown)),
    lastPromptAt: lastPrompt ? num(lastPrompt) : null,
    completed: StorageManager.getString(KEYS.completed) === 'true',
  };
}

export function recordFirstOpenIfNeeded(): void {
  if (!StorageManager.getString(KEYS.firstOpenAt)) {
    StorageManager.setString(KEYS.firstOpenAt, Date.now().toString());
  }
}

export function recordSentMessage(): void {
  const next = num(StorageManager.getString(KEYS.sentMessages)) + 1;
  StorageManager.setString(KEYS.sentMessages, next.toString());
}

export function markPromptShown(): void {
  const next = num(StorageManager.getString(KEYS.promptsShown)) + 1;
  StorageManager.setString(KEYS.promptsShown, next.toString());
  StorageManager.setString(KEYS.lastPromptAt, Date.now().toString());
}

export function markCompleted(): void {
  StorageManager.setString(KEYS.completed, 'true');
}

// Account age preferring the server signup date, falling back to first app open.
export function accountAgeDays(
  createdAtIso: string | null | undefined,
  firstOpenAt: number | null,
  now: number
): number {
  const base = createdAtIso ? new Date(createdAtIso).getTime() : firstOpenAt;
  if (!base || Number.isNaN(base)) return 0;
  return (now - base) / MS_PER_DAY;
}

// Pure — no I/O, `now` injected — so it is trivially unit-testable.
export function shouldShowRatingPrompt(params: {
  config: RatingPromptConfig;
  state: RatingDeviceState;
  createdAtIso: string | null | undefined;
  now: number;
}): boolean {
  const { config, state, createdAtIso, now } = params;

  if (!config.enabled) return false;
  if (state.completed) return false;
  if (state.promptsShownCount >= config.maxPrompts) return false;
  if (
    accountAgeDays(createdAtIso, state.firstOpenAt, now) <
    config.minAccountAgeDays
  ) {
    return false;
  }
  if (state.sentMessagesCount < config.minSentMessages) return false;
  if (state.lastPromptAt != null) {
    const daysSinceLast = (now - state.lastPromptAt) / MS_PER_DAY;
    if (daysSinceLast < config.cooldownDays) return false;
  }
  return true;
}

// Impure orchestrator called from screens. Reads live config + device state
// and shows the modal if eligible.
export function evaluateAndMaybeShowRatingPrompt(
  trigger: string,
  createdAtIso?: string | null
): void {
  const config = useSettingsStore.getState().getRatingPrompt();
  const state = getRatingState();
  const eligible = shouldShowRatingPrompt({
    config,
    state,
    createdAtIso,
    now: Date.now(),
  });
  if (eligible) {
    useRatingStore.getState().show(trigger);
  }
}
```

- [ ] **Step 3: Write the unit tests**

```ts
import type { RatingPromptConfig } from '@/stores/settings-store';

import { shouldShowRatingPrompt } from '../ratingEngagement';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const NOW = MS_PER_DAY * 100; // day 100

const config: RatingPromptConfig = {
  enabled: true,
  minAccountAgeDays: 7,
  minSentMessages: 15,
  cooldownDays: 60,
  maxPrompts: 3,
  storeMinStars: 4,
};

const baseState = {
  firstOpenAt: NOW - MS_PER_DAY * 30,
  sentMessagesCount: 20,
  promptsShownCount: 0,
  lastPromptAt: null as number | null,
  completed: false,
};

const call = (
  over: Partial<typeof baseState>,
  cfg: Partial<RatingPromptConfig> = {}
) =>
  shouldShowRatingPrompt({
    config: { ...config, ...cfg },
    state: { ...baseState, ...over },
    createdAtIso: null,
    now: NOW,
  });

describe('shouldShowRatingPrompt', () => {
  it('shows when all conditions are met', () => {
    expect(call({})).toBe(true);
  });
  it('hidden when disabled', () => {
    expect(call({}, { enabled: false })).toBe(false);
  });
  it('hidden when already completed', () => {
    expect(call({ completed: true })).toBe(false);
  });
  it('hidden when not enough messages', () => {
    expect(call({ sentMessagesCount: 5 })).toBe(false);
  });
  it('hidden when account too new', () => {
    expect(call({ firstOpenAt: NOW - MS_PER_DAY * 2 })).toBe(false);
  });
  it('hidden within cooldown window', () => {
    expect(call({ lastPromptAt: NOW - MS_PER_DAY * 10 })).toBe(false);
  });
  it('shows once cooldown has elapsed', () => {
    expect(call({ lastPromptAt: NOW - MS_PER_DAY * 61 })).toBe(true);
  });
  it('hidden when max prompts reached', () => {
    expect(call({ promptsShownCount: 3 })).toBe(false);
  });
});

describe('accountAge via createdAt', () => {
  it('prefers a recent createdAt over an old firstOpenAt', () => {
    const created = new Date(NOW - MS_PER_DAY).toISOString(); // 1 day old
    expect(
      shouldShowRatingPrompt({
        config,
        state: { ...baseState, firstOpenAt: NOW - MS_PER_DAY * 365 },
        createdAtIso: created,
        now: NOW,
      })
    ).toBe(false);
  });
});
```

- [ ] **Step 4: Run the tests**

Run: `yarn jest src/services/rating`
Expected: PASS (9 tests). If jest still errors on unrelated setup, fix only what blocks this file from running, then re-run.

- [ ] **Step 5: Commit**

```bash
git add jest-setup.ts src/services/rating/ratingEngagement.ts src/services/rating/__tests__/ratingEngagement.test.ts
git commit -m "feat(rating): add engagement tracking and eligibility logic with tests"
```

---

### Task B4: API endpoint wrapper

**Files:**

- Modify: `app-old/src/services/api/EndPoints.tsx`
- Modify: `app-old/src/services/api/Services.tsx`

- [ ] **Step 1: Add the endpoint** — in `EndPoints.tsx`, near `getAppSettings` (line 44), add:

```ts
  storeRating: '/auth/rating/store',
```

- [ ] **Step 2: Add the service method** — in `Services.tsx`, add alongside the other wrappers (e.g. after `interactionAction`, line ~830):

```ts
storeRating = (params: any) => {
  return new Promise((resolve, reject) => {
    Api.post(EndPoints.storeRating, params)
      .then((res) => {
        resolve(res?.data?.results);
      })
      .catch((error) => {
        reject(error?.response?.data?.message || '');
        console.log(
          'error while hiting rating store api =>',
          error?.response?.data
        );
      });
  });
};
```

- [ ] **Step 3: Type-check + commit**

Run: `yarn type-check` (Expected: CLEAN)

```bash
git add src/services/api/EndPoints.tsx src/services/api/Services.tsx
git commit -m "feat(rating): add storeRating api wrapper"
```

---

### Task B5: Count sent messages

**Files:**

- Modify: `app-old/src/screens/messages/hooks/useSendMessage.ts`

- [ ] **Step 1: Import the recorder** — add near the top imports (after line 3):

```ts
import { recordSentMessage } from '@/services/rating/ratingEngagement';
```

- [ ] **Step 2: Increment on send** — update `onSendPress` (lines 133–142) to:

```ts
const onSendPress = async (
  inputMessage: string
): Promise<SendMessageResult> => {
  if (isBlockedByYou) {
    return { type: 'blockedByYou' };
  }

  await sendMessage(inputMessage);
  recordSentMessage();
  return { type: 'sent' };
};
```

- [ ] **Step 3: Type-check + commit**

Run: `yarn type-check` (Expected: CLEAN)

```bash
git add src/screens/messages/hooks/useSendMessage.ts
git commit -m "feat(rating): count sent messages for engagement trigger"
```

---

### Task B6: Evaluate on leaving a chat

**Files:**

- Modify: `app-old/src/screens/messages/SingleChat.tsx`

- [ ] **Step 1: Import the orchestrator** — add to the imports:

```ts
import { evaluateAndMaybeShowRatingPrompt } from '@/services/rating/ratingEngagement';
```

- [ ] **Step 2: Add a blur listener** — add this `useEffect` alongside the other effects (e.g. right after the `useSendMessage` call at line ~778). `currentUser` and `props.navigation` are already in scope in this component:

```ts
useEffect(() => {
  const unsubscribe = props.navigation.addListener('blur', () => {
    evaluateAndMaybeShowRatingPrompt('chat_activity', currentUser?.created_at);
  });
  return unsubscribe;
}, [props.navigation, currentUser?.created_at]);
```

- [ ] **Step 3: Type-check**

Run: `yarn type-check`
Expected: CLEAN. (If `props.navigation` is destructured differently in this file, use the local navigation reference already used by `onWaliPress` at line ~824.)

- [ ] **Step 4: Commit**

```bash
git add src/screens/messages/SingleChat.tsx
git commit -m "feat(rating): evaluate rating prompt when leaving a chat"
```

---

### Task B7: The rating modal component

**Files:**

- Create: `app-old/src/components/rating/RatingPromptModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Text } from '@/components';
import { hp, wp } from '@/global';
import { requestRateApp } from '@/lib/utils/rate-app';
import { LanguageKeys } from '@/languages/Keys';
import { Colors, Fonts } from '@/res';
import { ApiServices, flashSuccessMessage, useGlobalContext } from '@/services';
import {
  markCompleted,
  markPromptShown,
} from '@/services/rating/ratingEngagement';
import { useRatingStore, useSettingsStore } from '@/stores';

const STAR_COUNT = 5;

const RatingPromptModal = () => {
  const { t } = useTranslation();
  const { visible, trigger, hide } = useRatingStore();
  const { currentUser } = useGlobalContext();
  const getRatingPrompt = useSettingsStore((s) => s.getRatingPrompt);

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStars(0);
    setComment('');
    setSubmitting(false);
  };

  const closeAndReset = () => {
    hide();
    reset();
  };

  const onDismiss = () => {
    markPromptShown();
    closeAndReset();
  };

  const onSubmit = async () => {
    if (stars < 1 || submitting) return;
    setSubmitting(true);

    const config = getRatingPrompt();
    const goesToStore = stars >= config.storeMinStars;

    markPromptShown();

    try {
      await ApiServices.storeRating({
        stars,
        comment: comment.trim() || null,
        trigger_event: trigger,
        platform: Platform.OS,
        app_version: DeviceInfo.getVersion(),
      });
      markCompleted();
      closeAndReset();
      flashSuccessMessage(LanguageKeys.ratingThankYou);

      if (goesToStore) {
        await requestRateApp();
      }
    } catch (_error) {
      // Service layer logs the failure; dismiss without marking completed so a
      // genuine submission can be retried after the cooldown.
      closeAndReset();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t(LanguageKeys.ratingPromptTitle)}</Text>
          <Text style={styles.subtitle}>
            {t(LanguageKeys.ratingPromptSubtitle)}
          </Text>

          <View style={styles.starsRow}>
            {Array.from({ length: STAR_COUNT }).map((_, i) => {
              const index = i + 1;
              const filled = index <= stars;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setStars(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={filled ? 'star' : 'star-outline'}
                    size={wp(9)}
                    color={filled ? Colors.primary : Colors.color1}
                    style={styles.star}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t(LanguageKeys.ratingCommentPlaceholder)}
            placeholderTextColor={Colors.color1}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
          />

          <Button
            buttonStyle={styles.submitBtn}
            onPress={onSubmit}
            text={t(LanguageKeys.ratingSubmit)}
            disabled={stars < 1 || submitting}
          />
          <TouchableOpacity onPress={onDismiss} style={styles.notNowBtn}>
            <Text style={styles.notNowText}>
              {t(LanguageKeys.ratingNotNow)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default RatingPromptModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: wp(6),
    alignItems: 'center',
  },
  title: {
    color: Colors.theme,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(5.5),
    textAlign: 'center',
    includeFontPadding: false,
  },
  subtitle: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(3.8),
    textAlign: 'center',
    marginTop: wp(2),
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: wp(5),
  },
  star: {
    marginHorizontal: wp(1.5),
  },
  input: {
    width: '100%',
    minHeight: hp(10),
    borderWidth: 1,
    borderColor: Colors.primaryLite,
    borderRadius: 12,
    padding: wp(3),
    textAlignVertical: 'top',
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(3.8),
  },
  submitBtn: {
    marginTop: wp(5),
    borderRadius: 30,
    paddingVertical: hp(0.3),
    paddingHorizontal: wp(2.2),
    width: '100%',
  },
  notNowBtn: {
    marginTop: wp(3),
    paddingVertical: wp(2),
  },
  notNowText: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(3.8),
  },
});
```

> **Import-verification note:** `Button`/`Text` come from the components barrel (`@/components`), matching `Initialization.tsx`. If `LanguageKeys` is a default export in `src/languages/Keys.tsx`, change the import to `import LanguageKeys from '@/languages/Keys';`. If `Button` does not accept a `disabled` prop, the internal `if (stars < 1 || submitting) return;` guard already prevents empty/duplicate submits — leaving `disabled` is harmless but can be removed. Confirm `Colors.primary`, `Colors.primaryLite`, `Colors.color1`, `Colors.theme`, and `Fonts.APPFONT_B/APPFONT_R` exist (all used elsewhere in this codebase).

- [ ] **Step 2: Type-check + commit**

Run: `yarn type-check` (Expected: CLEAN)

```bash
git add src/components/rating/RatingPromptModal.tsx
git commit -m "feat(rating): add rating prompt modal component"
```

---

### Task B8: i18n keys

**Files:**

- Modify: `app-old/src/languages/Keys.tsx`
- Modify: every locale JSON in `app-old/src/languages/` (`English.json`, `Urdu.json`, `RomanUrdu.json`, and any others present)

**Note:** `eslint-plugin-i18n-json/identical-keys` fails the build if locales drift, so add the same six keys to **all** locale files.

- [ ] **Step 1: Add keys to `Keys.tsx`** — inside the `LanguageKeys` object, add:

```ts
  ratingPromptTitle: 'ratingPromptTitle',
  ratingPromptSubtitle: 'ratingPromptSubtitle',
  ratingCommentPlaceholder: 'ratingCommentPlaceholder',
  ratingSubmit: 'ratingSubmit',
  ratingNotNow: 'ratingNotNow',
  ratingThankYou: 'ratingThankYou',
```

- [ ] **Step 2: `English.json`** — add:

```json
  "ratingPromptTitle": "Enjoying Pure Half?",
  "ratingPromptSubtitle": "We'd love to hear how it's going. Your feedback helps us improve.",
  "ratingCommentPlaceholder": "Add a comment (optional)",
  "ratingSubmit": "Submit",
  "ratingNotNow": "Not now",
  "ratingThankYou": "Thank you for your feedback!"
```

- [ ] **Step 3: `Urdu.json`** — add (adjust wording with a native reviewer if needed):

```json
  "ratingPromptTitle": "کیا آپ کو پیور ہاف پسند ہے؟",
  "ratingPromptSubtitle": "ہم آپ کی رائے جاننا چاہیں گے۔ آپ کی رائے ہمیں بہتر بننے میں مدد دیتی ہے۔",
  "ratingCommentPlaceholder": "تبصرہ شامل کریں (اختیاری)",
  "ratingSubmit": "جمع کرائیں",
  "ratingNotNow": "ابھی نہیں",
  "ratingThankYou": "آپ کی رائے کا شکریہ!"
```

- [ ] **Step 4: `RomanUrdu.json`** — add:

```json
  "ratingPromptTitle": "Kya aap ko Pure Half pasand hai?",
  "ratingPromptSubtitle": "Hum aap ki raye jan-na chahenge. Aap ki feedback humein behtar banane mein madad deti hai.",
  "ratingCommentPlaceholder": "Comment likhein (optional)",
  "ratingSubmit": "Submit",
  "ratingNotNow": "Abhi nahi",
  "ratingThankYou": "Aap ki feedback ka shukriya!"
```

> Add the same six keys to any additional locale files present in `src/languages/` so identical-keys passes.

- [ ] **Step 5: Lint the locales + type-check**

Run: `yarn lint src/languages && yarn type-check`
Expected: no new `i18n-json/identical-keys` errors; type-check CLEAN.

- [ ] **Step 6: Commit**

```bash
git add src/languages/
git commit -m "feat(rating): add rating prompt i18n keys"
```

---

### Task B9: Mount the modal + record first open

**Files:**

- Modify: `app-old/src/initialization/Initialization.tsx`

- [ ] **Step 1: Add imports** — near the other imports:

```ts
import RatingPromptModal from '@/components/rating/RatingPromptModal';
import { recordFirstOpenIfNeeded } from '@/services/rating/ratingEngagement';
```

- [ ] **Step 2: Record first open** — add a `useEffect` inside the `Initialization` component (near the existing effects, ~line 77):

```ts
useEffect(() => {
  recordFirstOpenIfNeeded();
}, []);
```

- [ ] **Step 3: Mount the modal** — in the returned JSX, add `<RatingPromptModal />` as a sibling of `<RootNavigation />` inside the container `View` (right after the `{isLoading ? <View /> : <RootNavigation />}` line, ~139):

```tsx
{
  isLoading ? <View /> : <RootNavigation />;
}
<RatingPromptModal />;
```

- [ ] **Step 4: Type-check**

Run: `yarn type-check`
Expected: CLEAN.

- [ ] **Step 5: Commit**

```bash
git add src/initialization/Initialization.tsx
git commit -m "feat(rating): mount rating modal and record first app open"
```

---

### Task B10: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Point the app at the admin build** carrying Part A, then temporarily relax the cadence for testing: in the admin **Ratings → Prompt Settings**, set `minAccountAgeDays = 0`, `minSentMessages = 2`, `cooldownDays = 0`, `maxPrompts = 3`. Save.

- [ ] **Step 2: Run the app**

Run: `yarn android --active-arch-only` (per project note: build a single ABI to avoid the intermittent clang crash) or `yarn ios`.

- [ ] **Step 3: Trigger the prompt** — open a conversation, send ≥2 messages, then navigate back out of the chat. Expected: the rating modal appears.

- [ ] **Step 4: High-rating path** — pick 5★, optionally type a comment, Submit. Expected: thank-you toast, then the native review sheet (or store fallback). In admin **Ratings → List**, the row appears with `Store? = Yes`.

- [ ] **Step 5: Low-rating path** — reset local state (reinstall or clear app storage), repeat, pick 2★ + a comment, Submit. Expected: thank-you toast, **no** store review. Admin list shows the row with `Store? = No`.

- [ ] **Step 6: Frequency guard** — after submitting once, leave another chat. Expected: no prompt (state is `completed`). Toggle **Enabled = off** in admin, reinstall, repeat: expected no prompt at all.

- [ ] **Step 7: Restore production-safe defaults** in admin (age 7 / messages 15 / cooldown 60 / max 3 / store 4), and commit nothing (verification only).

**Part B complete.**

---

## Self-Review (spec coverage)

- **Detect happy state / trigger timing** → B3 (engagement counter + eligibility), B5 (count), B6 (evaluate on chat blur). ✅
- **Show internal popup at the right, non-frequent time** → B3 cooldown/age/max gating + B7 modal + B9 mount. ✅
- **Good rating → external store; else stay internal; stars + one comment** → B7 (`goesToStore` → `requestRateApp()`; always POST; one comment field). ✅
- **Admin shows internal ratings** → A5/A7/A8 (list + filter + nav). ✅
- **Admin settings controls for safety** → A2 (seeded row incl. `enabled` kill-switch) + A5/A7 (dedicated labeled form). ✅
- **Backend endpoint + persistence + user scoping** → A1/A3/A4 (table, model+relation, endpoint + tests). ✅
- **Config delivery to app** → A2 row returned by existing `settingIndex` (no code change) + B1 selector with safe fallbacks. ✅
- **i18n** → B8 across all locales. ✅
- **Tests** → A4 (feature) + B3 (unit) + jest repair. ✅

Type consistency verified: `RatingPromptConfig` (camelCase) defined in B1, consumed identically in B3/B7; JSON stored by A2/A5 uses the same camelCase keys; `evaluateAndMaybeShowRatingPrompt(trigger, createdAtIso)` signature matches its B6 call site; `storeRating` payload fields match `StoreRatingRequest` rules and the `ratings` columns.
