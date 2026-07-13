# Debug Delete-Account-and-Restart — Plan 1: Admin Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Target repo:** `D:\GitHub\Pure Half\admin` (Laravel 12). All paths below are relative to that repo. Run all commands from there.

**Goal:** Add a debug-only endpoint that permanently (hard) deletes the authenticated user's account, reusing the repository's existing but currently-unused `forceDelete()` method, gated so it 404s unless a dedicated, off-by-default flag is explicitly enabled.

**Architecture:** One new route in the existing authenticated `auth` group, one new controller method that checks `config('app.allow_debug_account_delete')`, logs an audit line, then delegates (inside a transaction) to a new one-line service passthrough, which calls the already-existing `BaseRepository::forceDelete()`. (Task 1 originally gated on `config('app.debug')`; Task 2 hardens this — see that task for why.)

**Tech Stack:** Laravel 12, Passport (`auth:api_user` guard, `scope.abilities:user`), PHPUnit feature tests with `RefreshDatabase` + `Laravel\Passport\Passport::actingAs()`, real MySQL/MariaDB test DB (`DB_DATABASE=pure_half_test` per `.env.testing`).

**Spec:** `docs/superpowers/specs/2026-07-11-debug-delete-account-restart-design.md` (in the `app-old` repo).

## Global Constraints

- This endpoint must 404 (not just 403) whenever its gate is closed — it should look like it doesn't exist in that case. (Task 1's gate was `config('app.debug')`; Task 2 replaces this with a dedicated flag — see Task 2's constraints.)
- No OTP, no `purpose_of_leaving` — this is a single-call debug action, deliberately not the existing soft-delete flow.
- Reuse `BaseRepository::forceDelete(int $id): bool` (`app/Http/Repositories/BaseRepository.php:126-134`) as-is — it already force-deletes `detail`, `media`, and `all_interaction` relations plus the user row. Do not duplicate that logic elsewhere.
- Tests require a reachable MySQL/MariaDB instance matching `.env.testing`. If `php -r "var_dump(@fsockopen('127.0.0.1', 3306, $e, $s, 3) !== false);"` prints `bool(false)`, the DB is down — this is a known environment issue on this machine; do not switch to sqlite or skip verification, flag it and wait for a reachable DB.

---

### Task 1: Debug force-delete-account endpoint

**Files:**

- Modify: `app/Http/Services/Users/UserParentService.php` (add `forceDeleteAccount` method, alongside the existing `deleteAccount` at line 41-45)
- Modify: `routes/api.php` (add route inside the existing `auth` group, alongside line 91's `delete/account`)
- Modify: `app/Http/Controllers/Api/AuthController.php` (add `forceDeleteAccountDebug` method, alongside the existing `deleteAccount` at line 982-1006)
- Test: Create `tests/Feature/DebugForceDeleteAccountTest.php`

**Interfaces:**

- Consumes: `BaseRepository::forceDelete(int $id): bool` (existing, unchanged), `AuthController::$userService` (existing `UserService` instance, already injected via constructor).
- Produces: nothing consumed by the mobile-side plan directly other than the route path `DELETE /v1/app/auth/debug/force-delete-account`, which the mobile plan calls by URL string (no shared PHP interface).

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/DebugForceDeleteAccountTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

class DebugForceDeleteAccountTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): User
    {
        $user = User::factory()->create();
        Passport::actingAs($user, ['user'], 'api_user');

        return $user;
    }

    public function test_hard_deletes_the_authenticated_user_when_debug_is_on(): void
    {
        config(['app.debug' => true]);
        $user = $this->actingAsUser();

        $response = $this->deleteJson('/api/v1/app/auth/debug/force-delete-account');

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_returns_404_when_debug_is_off(): void
    {
        config(['app.debug' => false]);
        $this->actingAsUser();

        $response = $this->deleteJson('/api/v1/app/auth/debug/force-delete-account');

        $response->assertNotFound();
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `php artisan test --filter=DebugForceDeleteAccountTest`

Expected: FAILS — the route `/v1/app/auth/debug/force-delete-account` doesn't exist yet, so both requests 404 (the first test's `assertOk()` fails).

- [ ] **Step 3: Add the service method**

In `app/Http/Services/Users/UserParentService.php`, immediately after the existing `deleteAccount` method (ends around line 45), add:

```php
    public function forceDeleteAccount(int $id): bool
    {
        return $this->IUser->forceDelete($id);
    }
```

- [ ] **Step 4: Add the route**

In `routes/api.php`, immediately after the existing line (inside the `auth` group):

```php
        Route::delete('delete/account', [AuthController::class, 'deleteAccount']);
```

add:

```php
        Route::delete('debug/force-delete-account', [AuthController::class, 'forceDeleteAccountDebug']);
```

- [ ] **Step 5: Add the controller method**

In `app/Http/Controllers/Api/AuthController.php`, immediately after the existing `deleteAccount` method (ends at line 1006), add:

```php
    public function forceDeleteAccountDebug()
    {
        if (! config('app.debug')) {
            abort(404);
        }

        $currentUser = request()->user();
        $this->userService->forceDeleteAccount($currentUser->id);

        return $this->success(JsonResponse::HTTP_OK, 'Account permanently deleted.');
    }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `php artisan test --filter=DebugForceDeleteAccountTest`

Expected: both tests PASS.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Services/Users/UserParentService.php routes/api.php app/Http/Controllers/Api/AuthController.php tests/Feature/DebugForceDeleteAccountTest.php
git commit -m "feat(debug): add debug endpoint to hard-delete the current account

Reuses the existing but previously-unwired BaseRepository::forceDelete()
via a new UserParentService::forceDeleteAccount() passthrough. Gated on
config('app.debug') so it 404s whenever the backend's APP_DEBUG is off,
independent of any mobile build's own debug flag."
```

---

## Self-Review Notes

- **Spec coverage:** Admin side of the spec → this single task. Backend tests section of the spec → both test methods above.
- **Placeholder scan:** no TODO/TBD; all steps show literal code and exact commands.
- **Type consistency:** `forceDeleteAccount(int $id): bool` matches `BaseRepository::forceDelete(int $id): bool`'s return type; `AuthController::$userService` is the existing injected `UserService` (which extends `UserParentService`), so the new method is available without any constructor change.
- **Route URL correction:** `php artisan route:list` was checked directly to confirm the real registered path is `api/v1/app/auth/...` (the `api` prefix comes from `RouteServiceProvider::boot()`, which is genuinely registered in `config/app.php` — not dead code). The test's URLs use `/api/v1/app/auth/debug/force-delete-account`, not the bare `/v1/app/...` form some other existing test files in this repo mistakenly use (a separate, already-flagged pre-existing bug in 4 unrelated test files, out of scope here).

---

### Task 2: Harden the gate to a dedicated flag, add audit log + transaction (post-review fix)

A final whole-branch review of Task 1 found gating on `config('app.debug')` Critical: this project's actual staging environment (which mobile's `API_BASE_URL` points at) runs `APP_DEBUG=true`, so the endpoint would have been live and reachable there, permanently deleting any user's own account with no confirmation/recovery. Confirmed with the user: switch to a dedicated, off-by-default flag (`ALLOW_DEBUG_ACCOUNT_DELETE`), and also add the review's other two findings (audit log, transaction wrap) in the same task since they touch the same method.

**Files:**

- Modify: `config/app.php` (new config key)
- Modify: `app/Http/Controllers/Api/AuthController.php` (`forceDeleteAccountDebug()`)
- Modify: `tests/Feature/DebugForceDeleteAccountTest.php`

**Interfaces:**

- Consumes: nothing new from elsewhere in the codebase.
- Produces: `config('app.allow_debug_account_delete'): bool` — this replaces `config('app.debug')` as the endpoint's gate. **Operational note for whoever deploys this:** since mobile's `.env` `API_BASE_URL` points at staging, actually exercising this tool from a device requires setting `ALLOW_DEBUG_ACCOUNT_DELETE=true` on staging's backend `.env` for the duration of testing, then setting it back to `false` — this flag is not restricted to local-only by design.

- [ ] **Step 1: Update the test to require the new flag (write the failing assertion)**

Replace the full contents of `tests/Feature/DebugForceDeleteAccountTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

class DebugForceDeleteAccountTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): User
    {
        $user = User::factory()->create();
        Passport::actingAs($user, ['user'], 'api_user');

        return $user;
    }

    public function test_hard_deletes_the_authenticated_user_when_flag_is_on(): void
    {
        config(['app.allow_debug_account_delete' => true]);
        $user = $this->actingAsUser();

        $response = $this->deleteJson('/api/v1/app/auth/debug/force-delete-account');

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_returns_404_when_flag_is_off(): void
    {
        config(['app.allow_debug_account_delete' => false]);
        $this->actingAsUser();

        $response = $this->deleteJson('/api/v1/app/auth/debug/force-delete-account');

        $response->assertNotFound();
    }

    public function test_returns_404_when_flag_is_off_even_if_app_debug_is_true(): void
    {
        config(['app.debug' => true, 'app.allow_debug_account_delete' => false]);
        $this->actingAsUser();

        $response = $this->deleteJson('/api/v1/app/auth/debug/force-delete-account');

        $response->assertNotFound();
    }
}
```

The third test is the one that actually encodes the fix — it fails against the current (Task 1) code, which still checks `app.debug`, not the new flag.

- [ ] **Step 2: Run the tests to verify the new one fails**

Run: `php artisan test --filter=DebugForceDeleteAccountTest`

Expected: `test_returns_404_when_flag_is_off_even_if_app_debug_is_true` FAILS (currently returns 200/deletes the user, since the controller still only checks `app.debug`, which this test sets to `true`). The other two may pass or fail depending on `config('app.debug')`'s ambient test value — don't worry about their current state, only Step 4 needs to make all three pass together.

- [ ] **Step 3: Add the config key**

In `config/app.php`, immediately after the existing line:

```php
    'debug' => (bool) env('APP_DEBUG', false),
```

add:

```php
    'allow_debug_account_delete' => (bool) env('ALLOW_DEBUG_ACCOUNT_DELETE', false),
```

- [ ] **Step 4: Harden the controller method**

Replace the current `forceDeleteAccountDebug()` method in `app/Http/Controllers/Api/AuthController.php`:

```php
    public function forceDeleteAccountDebug()
    {
        if (! config('app.debug')) {
            abort(404);
        }

        $currentUser = request()->user();
        $this->userService->forceDeleteAccount($currentUser->id);

        return $this->success(JsonResponse::HTTP_OK, 'Account permanently deleted.');
    }
```

with:

```php
    public function forceDeleteAccountDebug()
    {
        if (! config('app.allow_debug_account_delete')) {
            abort(404);
        }

        $currentUser = request()->user();

        Log::warning('Debug force-delete-account triggered', [
            'user_id' => $currentUser->id,
            'ip' => request()->ip(),
        ]);

        DB::beginTransaction();
        try {
            $this->userService->forceDeleteAccount($currentUser->id);
            DB::commit();
        } catch (Exception $ex) {
            DB::rollBack();
            return $this->error(JsonResponse::HTTP_INTERNAL_SERVER_ERROR, Lang::get('response.error.server'), $ex->getMessage());
        }

        return $this->success(JsonResponse::HTTP_OK, 'Account permanently deleted.');
    }
```

`Log`, `DB`, `Exception`, and `Lang` are all already imported/used elsewhere in this file (e.g. `Log::error` in `updateDetail()`, `DB::beginTransaction()`/`Exception`/`Lang::get` in `deleteAccount()`) — no new imports needed.

- [ ] **Step 5: Run the tests to verify all three pass**

Run: `php artisan test --filter=DebugForceDeleteAccountTest`

Expected: all three tests PASS.

- [ ] **Step 6: Commit**

```bash
git add config/app.php app/Http/Controllers/Api/AuthController.php tests/Feature/DebugForceDeleteAccountTest.php
git commit -m "fix(debug): gate force-delete-account on a dedicated flag, not app.debug

A whole-branch review found gating this irreversible endpoint on
config('app.debug') Critical: staging (which mobile points at) runs
APP_DEBUG=true, so it would have been live there. Switches to a
dedicated, off-by-default ALLOW_DEBUG_ACCOUNT_DELETE flag, and adds an
audit log line plus a transaction wrap matching deleteAccount()'s
existing convention."
```

## Self-Review Notes (Task 2)

- **Spec coverage:** matches the spec's revised "Backend safety net" decision and revised Controller section exactly.
- **Placeholder scan:** clean — literal code and commands throughout.
- **Type consistency:** `config('app.allow_debug_account_delete')` matches the new `config/app.php` key exactly; `Log`/`DB`/`Exception`/`Lang` usage mirrors the existing `deleteAccount()` method's own imports, already present in this file.
