# Debug Delete-Account-and-Restart — Plan 1: Admin Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Target repo:** `D:\GitHub\Pure Half\admin` (Laravel 12). All paths below are relative to that repo. Run all commands from there.

**Goal:** Add a debug-only endpoint that permanently (hard) deletes the authenticated user's account, reusing the repository's existing but currently-unused `forceDelete()` method, gated so it 404s whenever the backend's own `APP_DEBUG` is off.

**Architecture:** One new route in the existing authenticated `auth` group, one new controller method that checks `config('app.debug')` then delegates to a new one-line service passthrough, which calls the already-existing `BaseRepository::forceDelete()`.

**Tech Stack:** Laravel 12, Passport (`auth:api_user` guard, `scope.abilities:user`), PHPUnit feature tests with `RefreshDatabase` + `Laravel\Passport\Passport::actingAs()`, real MySQL/MariaDB test DB (`DB_DATABASE=pure_half_test` per `.env.testing`).

**Spec:** `docs/superpowers/specs/2026-07-11-debug-delete-account-restart-design.md` (in the `app-old` repo).

## Global Constraints

- This endpoint must 404 (not just 403) whenever `config('app.debug')` is `false` — it should look like it doesn't exist in that case.
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
