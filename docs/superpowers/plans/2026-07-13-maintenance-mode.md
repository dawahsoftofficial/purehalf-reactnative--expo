# Maintenance Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff toggle an admin-controlled "maintenance mode" that blocks the mobile app behind a full-screen, non-dismissable notice (message + informational time range) until turned back off.

**Architecture:** A new `maintenance_mode` `Setting` row (JSON: `{enabled, message, start_at, end_at}`) rides the existing public `GET /settings` endpoint with zero API changes. Staff edit it through a dedicated visual form layered onto the existing generic Setting edit/index Blade views (same pattern already used for `badges_and_payments`). The mobile app reads it via a new `getMaintenanceMode()` getter on the existing `useSettingsStore`, and `Initialization.tsx` renders a new `MaintenanceScreen` overlay (taking precedence over the existing force-update modal) whenever `enabled` is true. `MaintenanceScreen` self-polls `/settings` every 30s so it dismisses itself automatically when staff turn it off, and `Initialization.tsx` also re-fetches on `AppState` foreground-resume so a user who backgrounded the app before maintenance started sees it promptly on return.

**Tech Stack:** Laravel 12 / PHP 8.2+ (`admin/`), React Native 0.82 + Zustand + react-i18next (`app-old/`). Backend tests via `php artisan test` (PHPUnit, `RefreshDatabase`). Mobile tests via `yarn jest` (already working in this repo — no new infra needed).

## Global Constraints

- No Laravel API middleware / 503 gating — client-side gate only (spec Non-goal).
- No auto-expiry at `end_at` — staff always flip `enabled` off manually; the time range is informational only (spec Decision 5).
- No manual retry button, no logout action on the maintenance screen — it dismisses itself automatically (spec Decision 3).
- Maintenance-mode overlay takes precedence over the existing force-update modal (spec Decision/Architecture).
- Fail-open: if `/settings` fails to load or the key is missing/malformed, treat maintenance as `enabled: false` (spec Error Handling).
- Follow existing patterns exactly — the `badges_and_payments` special-case block in `admin/resources/views/admin/pages/setting/{edit,index}.blade.php` and the `getDailyRecommendations`/`getRatingPrompt` getters in `app-old/src/stores/settings-store.ts` are the templates to mirror, not redesign.

---

### Task 1: Backend — `maintenance_mode` Setting + API exposure

**Files:**

- Create: `admin/database/migrations/2026_07_13_000001_add_maintenance_mode_setting.php`
- Test: `admin/tests/Feature/MaintenanceModeSettingTest.php`

**Interfaces:**

- Consumes: `App\Models\Setting` (`admin/app/Models/Setting.php`) — `type: 'json'` casts `value` to/from an associative array automatically via `getValueAttribute`/`setValueAttribute`.
- Produces: a `settings` DB row with `key = 'maintenance_mode'`, always `is_active = 1`, whose `value` decodes to `{enabled: bool, message: string, start_at: string|null, end_at: string|null}`. Every later task (admin views, mobile store) depends on this exact key and shape. Rides the existing `GET /api/v1/app/settings` endpoint (`listingController::settingIndex`, `admin/app/Http/Controllers/Api/listingController.php:65`) with no controller changes — response shape is `{message, error, code, results: [{title, key, value, type}, ...]}`.

- [ ] **Step 1: Write the migration**

```php
<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (!Setting::where('key', 'maintenance_mode')->exists()) {
            Setting::create([
                'title' => 'Maintenance Mode',
                'description' => 'Blocks the mobile app with a full-screen notice when enabled. The start/end times are shown to members as an informational window only — maintenance does not end automatically, "enabled" must be turned off manually in this setting.',
                'key' => 'maintenance_mode',
                'type' => 'json',
                'value' => [
                    'enabled' => false,
                    'message' => '',
                    'start_at' => null,
                    'end_at' => null,
                ],
                'is_active' => 1,
            ]);
        }
    }

    public function down(): void
    {
        Setting::where('key', 'maintenance_mode')->delete();
    }
};
```

- [ ] **Step 2: Run the migration against the test DB**

Run: `cd admin && php artisan migrate --path=database/migrations/2026_07_13_000001_add_maintenance_mode_setting.php`
Expected: `Migrating: 2026_07_13_000001_add_maintenance_mode_setting` then `Migrated:` with no errors. (If your local `.env` DB is unavailable, this step will run automatically inside the `RefreshDatabase` test in Step 3 instead — don't block on it.)

- [ ] **Step 3: Write the failing feature test**

```php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaintenanceModeSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_endpoint_exposes_maintenance_mode_disabled_by_default(): void
    {
        $response = $this->getJson('/api/v1/app/settings');

        $response->assertOk();
        $response->assertJsonFragment([
            'key' => 'maintenance_mode',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => 'maintenance_mode',
            'is_active' => 1,
        ]);

        $payload = collect($response->json('results'))
            ->firstWhere('key', 'maintenance_mode');

        $this->assertNotNull($payload, 'maintenance_mode key missing from /settings response');
        $this->assertFalse($payload['value']['enabled']);
        $this->assertSame('', $payload['value']['message']);
        $this->assertNull($payload['value']['start_at']);
        $this->assertNull($payload['value']['end_at']);
    }
}
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd admin && php artisan test --filter=MaintenanceModeSettingTest`
Expected: FAIL — `maintenance_mode` key not found (migration doesn't exist yet if you skipped Step 2, or the test DB hasn't migrated it).

- [ ] **Step 5: Confirm the migration file from Step 1 is saved, then run the test to verify it passes**

Run: `cd admin && php artisan test --filter=MaintenanceModeSettingTest`
Expected: PASS (`RefreshDatabase` runs all migrations, including the new one, against the test DB).

- [ ] **Step 6: Commit**

```bash
cd admin
git add database/migrations/2026_07_13_000001_add_maintenance_mode_setting.php tests/Feature/MaintenanceModeSettingTest.php
git commit -m "feat(settings): add maintenance_mode setting exposed via /settings"
```

---

### Task 2: Backend — dedicated admin form for maintenance mode

**Files:**

- Modify: `admin/app/Http/Requests/Admin/Setting/UpdateRequest.php:83-96` (the `case 'json':` branch in `withValidator`)
- Modify: `admin/resources/views/admin/pages/setting/edit.blade.php:78-196` (the `@if/@elseif` chain around `$value`)
- Modify: `admin/resources/views/admin/pages/setting/index.blade.php:44-68` (the `@if/@elseif` chain around `$value`) and `:89-93` (the edit-button title)
- Test: `admin/tests/Feature/AdminMaintenanceSettingControlTest.php`

**Interfaces:**

- Consumes: the `maintenance_mode` `Setting` row from Task 1 (key, shape). Reuses the existing generic `SettingController@edit`/`@update` (`admin/app/Http/Controllers/Admin/SettingController.php`) and route `admin.setting.update` — no controller or route changes.
- Produces: nothing consumed by later tasks — this is the staff-facing surface, independently testable via rendered HTML.

- [ ] **Step 1: Write the failing view test**

```php
<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Setting;
use Illuminate\Support\ViewErrorBag;
use Tests\TestCase;

class AdminMaintenanceSettingControlTest extends TestCase
{
    private function maintenanceSetting(array $overrides = []): Setting
    {
        $setting = new Setting;
        $setting->setRawAttributes([
            'id' => 9,
            'title' => 'Maintenance Mode',
            'description' => 'Blocks the mobile app during maintenance.',
            'key' => 'maintenance_mode',
            'type' => 'json',
            'is_active' => true,
            'value' => json_encode(array_merge([
                'enabled' => false,
                'message' => '',
                'start_at' => null,
                'end_at' => null,
            ], $overrides)),
        ]);
        $setting->syncOriginal();

        return $setting;
    }

    public function test_maintenance_setting_editor_has_visual_controls(): void
    {
        $this->actingAs(new Admin(['role' => 1]), 'admin');

        $html = view('admin.pages.setting.edit', [
            'setting' => $this->maintenanceSetting(['message' => 'Down for scheduled work.']),
            'errors' => new ViewErrorBag,
        ])->render();

        $this->assertStringContainsString('maintenance-enabled-control', $html);
        $this->assertStringContainsString('maintenance-message-control', $html);
        $this->assertStringContainsString('maintenance-start-control', $html);
        $this->assertStringContainsString('maintenance-end-control', $html);
        $this->assertStringContainsString('Down for scheduled work.', $html);
        $this->assertStringContainsString('Maintenance mode enabled', $html);
    }

    public function test_setting_list_summarizes_maintenance_mode(): void
    {
        $this->actingAs(new Admin(['role' => 1]), 'admin');

        $html = view('admin.pages.setting.index', [
            'settings' => collect([$this->maintenanceSetting(['enabled' => true, 'message' => 'Upgrading servers.'])]),
            'errors' => new ViewErrorBag,
        ])->render();

        $this->assertStringContainsString('Maintenance: ON', $html);
        $this->assertStringContainsString('Upgrading servers.', $html);
        $this->assertStringContainsString('Manage Maintenance Mode', $html);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd admin && php artisan test --filter=AdminMaintenanceSettingControlTest`
Expected: FAIL — neither view has any `maintenance_mode`-specific markup yet.

- [ ] **Step 3: Add the visual edit-form block**

In `admin/resources/views/admin/pages/setting/edit.blade.php`, inside the `{{-- Dynamic Value --}}` block (the `@if ($setting->key === 'badges_and_payments') ... @elseif ($setting->type == 'json' || ...)` chain starting around line 84), add a new `@elseif` branch **before** the generic `@elseif ($setting->type == 'json' || $setting->type == 'array')` branch:

```blade
                                        @elseif ($setting->key === 'maintenance_mode')
                                            @php
                                                $maintenanceValue = is_string($value) ? json_decode($value, true) : $value;
                                                $maintenanceValue = is_array($maintenanceValue) ? $maintenanceValue : [];
                                                $maintenanceValue['enabled'] ??= false;
                                                $maintenanceValue['message'] ??= '';
                                                $maintenanceValue['start_at'] ??= null;
                                                $maintenanceValue['end_at'] ??= null;
                                            @endphp

                                            <div class="alert alert-info">
                                                Turning this on shows a full-screen notice in the mobile app and blocks normal use until you turn it back off here. The start/end times below are shown to members as an informational window only — maintenance does not end automatically.
                                            </div>

                                            <div class="mb-4">
                                                <div class="form-check form-switch">
                                                    <input class="form-check-input" type="checkbox" id="maintenance-enabled-control"
                                                        {{ $maintenanceValue['enabled'] ? 'checked' : '' }}>
                                                    <label class="form-check-label" for="maintenance-enabled-control">Maintenance mode enabled</label>
                                                </div>
                                            </div>

                                            <div class="mb-4">
                                                <label class="form-label" for="maintenance-message-control">Message shown to members</label>
                                                <textarea id="maintenance-message-control" class="form-control" rows="3">{{ $maintenanceValue['message'] }}</textarea>
                                            </div>

                                            <div class="row g-3 mb-4">
                                                <div class="col-md-6">
                                                    <label class="form-label" for="maintenance-start-control">Start (informational)</label>
                                                    <input type="datetime-local" id="maintenance-start-control" class="form-control"
                                                        value="{{ $maintenanceValue['start_at'] }}">
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label" for="maintenance-end-control">End (informational)</label>
                                                    <input type="datetime-local" id="maintenance-end-control" class="form-control"
                                                        value="{{ $maintenanceValue['end_at'] }}">
                                                </div>
                                            </div>

                                            <textarea id="maintenance-json-value" name="value" class="form-control json-box" rows="4" style="display:none">{{ json_encode($maintenanceValue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</textarea>
```

Then in the `@push('js')` section at the bottom of the same file, add (alongside the existing `@if ($setting->key === 'badges_and_payments')` script block):

```blade
    @if ($setting->key === 'maintenance_mode')
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const jsonField = document.getElementById('maintenance-json-value');
                const enabledControl = document.getElementById('maintenance-enabled-control');
                const messageControl = document.getElementById('maintenance-message-control');
                const startControl = document.getElementById('maintenance-start-control');
                const endControl = document.getElementById('maintenance-end-control');

                function writeJson() {
                    jsonField.value = JSON.stringify({
                        enabled: enabledControl.checked,
                        message: messageControl.value,
                        start_at: startControl.value || null,
                        end_at: endControl.value || null,
                    }, null, 2);
                }

                [enabledControl, messageControl, startControl, endControl].forEach(function (control) {
                    control.addEventListener('input', writeJson);
                    control.addEventListener('change', writeJson);
                });

                writeJson();
            });
        </script>
    @endif
```

- [ ] **Step 4: Add the list-view summary**

In `admin/resources/views/admin/pages/setting/index.blade.php`, add a new `@elseif` branch **before** the generic `@elseif (is_array($value) || is_object($value))` branch (around line 48-60):

```blade
                                            @elseif ($q->key === 'maintenance_mode' && is_array($value))
                                                <span class="badge {{ ($value['enabled'] ?? false) ? 'bg-danger' : 'bg-secondary' }}">
                                                    Maintenance: {{ ($value['enabled'] ?? false) ? 'ON' : 'Off' }}
                                                </span>
                                                @if (!empty($value['message']))
                                                    <div class="fs-xs text-muted mt-2">{{ str($value['message'])->limit(60) }}</div>
                                                @endif
```

And update the edit-button `title` attribute (around line 91) to add a maintenance-specific tooltip:

```blade
                                                <a href="{{ route('admin.setting.edit', $q->id) }}"
                                                    class="btn btn-sm btn-alt-primary" title="{{ $q->key === 'badges_and_payments' ? 'Manage Badge Controls' : ($q->key === 'maintenance_mode' ? 'Manage Maintenance Mode' : 'Edit Setting') }}">
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd admin && php artisan test --filter=AdminMaintenanceSettingControlTest`
Expected: PASS

- [ ] **Step 6: Add server-side validation for the JSON shape**

In `admin/app/Http/Requests/Admin/Setting/UpdateRequest.php`, inside `withValidator`'s `case 'json':` branch (lines 83-96), add an `elseif` alongside the existing `packages_and_entitlements`/`badges_and_payments` checks:

```php
                        if ($settingKey === 'packages_and_entitlements') {
                            $this->validatePackagesAndEntitlements($decoded, $validator);
                        } elseif ($settingKey === 'badges_and_payments') {
                            $this->validateBadgesAndPayments($decoded, $validator);
                        } elseif ($settingKey === 'maintenance_mode') {
                            $this->validateMaintenanceMode($decoded, $validator);
                        }
```

Then add the private method (place it alongside `validateBadgesAndPayments`):

```php
    private function validateMaintenanceMode($decoded, $validator): void
    {
        if (! is_array($decoded)) {
            $validator->errors()->add('value', 'maintenance_mode must be a JSON object.');
            return;
        }

        if (! is_bool($decoded['enabled'] ?? null)) {
            $validator->errors()->add('value', 'maintenance_mode.enabled must be true or false.');
        }

        if (! is_string($decoded['message'] ?? null)) {
            $validator->errors()->add('value', 'maintenance_mode.message must be a string.');
        }

        foreach (['start_at', 'end_at'] as $field) {
            $fieldValue = $decoded[$field] ?? null;
            if ($fieldValue !== null && ! is_string($fieldValue)) {
                $validator->errors()->add('value', "maintenance_mode.{$field} must be a date string or null.");
            }
        }
    }
```

- [ ] **Step 7: Re-run the full test file to confirm nothing broke**

Run: `cd admin && php artisan test --filter=AdminMaintenanceSettingControlTest`
Expected: PASS (validation changes don't affect view-rendering assertions, but confirms no syntax errors were introduced)

- [ ] **Step 8: Commit**

```bash
cd admin
git add app/Http/Requests/Admin/Setting/UpdateRequest.php resources/views/admin/pages/setting/edit.blade.php resources/views/admin/pages/setting/index.blade.php tests/Feature/AdminMaintenanceSettingControlTest.php
git commit -m "feat(admin): add dedicated maintenance-mode edit form and list summary"
```

---

### Task 3: Mobile — `getMaintenanceMode()` store getter

**Files:**

- Modify: `app-old/src/stores/settings-store.ts`
- Test: `app-old/src/stores/settings-store.test.ts` (new file)

**Interfaces:**

- Consumes: the `/settings` payload shape from Task 1 (`{key: 'maintenance_mode', type: 'json', value: {enabled, message, start_at, end_at}}`), read via the store's existing `getSettingByKey<T>(key)`.
- Produces: `useSettingsStore.getState().getMaintenanceMode(): MaintenanceMode` where `MaintenanceMode = {enabled: boolean; message: string; start_at: string | null; end_at: string | null}`. Task 4 (`MaintenanceScreen`) and Task 5 (`Initialization.tsx`) both call this exact function.

- [ ] **Step 1: Write the failing test**

Create `app-old/src/stores/settings-store.test.ts`:

```ts
import { useSettingsStore } from './settings-store';

describe('getMaintenanceMode', () => {
  afterEach(() => {
    useSettingsStore.getState().clearSettings();
  });

  it('defaults to disabled when no settings have loaded', () => {
    expect(useSettingsStore.getState().getMaintenanceMode()).toEqual({
      enabled: false,
      message: '',
      start_at: null,
      end_at: null,
    });
  });

  it('reflects an enabled maintenance window from the settings payload', () => {
    useSettingsStore.getState().setSettings({
      message: 'ok',
      error: false,
      code: 200,
      results: [
        {
          title: 'Maintenance Mode',
          key: 'maintenance_mode',
          type: 'json',
          value: {
            enabled: true,
            message: 'Upgrading servers.',
            start_at: '2026-07-13T22:00',
            end_at: '2026-07-14T02:00',
          },
        },
      ],
    });

    expect(useSettingsStore.getState().getMaintenanceMode()).toEqual({
      enabled: true,
      message: 'Upgrading servers.',
      start_at: '2026-07-13T22:00',
      end_at: '2026-07-14T02:00',
    });
  });

  it('falls back to defaults when the setting is missing entirely', () => {
    useSettingsStore.getState().setSettings({
      message: 'ok',
      error: false,
      code: 200,
      results: [],
    });

    expect(useSettingsStore.getState().getMaintenanceMode().enabled).toBe(
      false
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app-old && yarn jest src/stores/settings-store.test.ts`
Expected: FAIL with "getMaintenanceMode is not a function" (or TypeScript error if run through `tsc` first — jest with the babel transform will still fail at runtime).

- [ ] **Step 3: Add the type and getter**

In `app-old/src/stores/settings-store.ts`, add the type near `RatingPromptConfig` (after line 142):

```ts
export type MaintenanceMode = {
  enabled: boolean;
  message: string;
  start_at: string | null;
  end_at: string | null;
};

const MAINTENANCE_MODE_DEFAULTS: MaintenanceMode = {
  enabled: false,
  message: '',
  start_at: null,
  end_at: null,
};
```

Add `MaintenanceMode` to the `SettingValue` union (around line 153-163):

```ts
type SettingValue =
  | AuthenticationMethod
  | ChatCredits
  | boolean
  | number
  | MaxChatsPerDay
  | BadgesAndPayments
  | DailyRecommendations
  | MaintenanceMode
  | PackagesAndEntitlements
  | RatingPromptConfig
  | AppLink[];
```

Add the getter signature to `SettingsState` (near `getRatingPrompt`, around line 198):

```ts
getRatingPrompt: () => RatingPromptConfig;
getMaintenanceMode: () => MaintenanceMode;
getSettingByKey: <T extends SettingValue>(key: string) => T | null;
```

Add the implementation next to `getRatingPrompt`'s implementation (around line 297-301):

```ts
  getRatingPrompt: () => {
    const state = get();
    const value = state.getSettingByKey<RatingPromptConfig>('rating_prompt');
    return { ...RATING_PROMPT_DEFAULTS, ...(value ?? {}) };
  },

  getMaintenanceMode: () => {
    const state = get();
    const value = state.getSettingByKey<MaintenanceMode>('maintenance_mode');
    return { ...MAINTENANCE_MODE_DEFAULTS, ...(value ?? {}) };
  },
```

Note: `MaintenanceMode` is already exported via its own `export type` at the declaration site above — do **not** re-add it to the `export type { ... }` block at the bottom of the file (that would be a duplicate-export error).

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app-old && yarn jest src/stores/settings-store.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Type-check**

Run: `cd app-old && yarn type-check`
Expected: no new errors

- [ ] **Step 6: Commit**

```bash
cd app-old
git add src/stores/settings-store.ts src/stores/settings-store.test.ts
git commit -m "feat(settings): add getMaintenanceMode() store getter"
```

---

### Task 4: Mobile — `MaintenanceScreen` component + translations

**Files:**

- Create: `app-old/src/screens/maintenance/MaintenanceScreen.tsx`
- Test: `app-old/src/screens/maintenance/MaintenanceScreen.test.tsx` (new file)
- Modify: `app-old/src/languages/English.json`, `app-old/src/languages/Urdu.json`, `app-old/src/languages/RomanUrdu.json`

**Interfaces:**

- Consumes: `useSettingsStore` (`../../stores`) — specifically `getMaintenanceMode()` and `setSettings()` from Task 3; `ApiServices.getAppSettings()` (`../../services`) for the background poll.
- Produces: `export default MaintenanceScreen` — a zero-prop component. Task 5 (`Initialization.tsx`) renders it as `<MaintenanceScreen />` with no props; all its data comes from the store directly.

- [ ] **Step 1: Add the translation keys**

In `app-old/src/languages/English.json`, change the last two lines (currently):

```json
    "voiceMessage": "Voice message",
    "recordingVoice": "Recording voice message"
  }
}
```

to:

```json
    "voiceMessage": "Voice message",
    "recordingVoice": "Recording voice message",
    "maintenanceTitle": "Under Maintenance",
    "maintenanceWindow": "We expect to be back between {{start}} and {{end}}."
  }
}
```

In `app-old/src/languages/Urdu.json`, change the last two lines (currently):

```json
    "voiceMessage": "صوتی پیغام",
    "recordingVoice": "صوتی پیغام ریکارڈ ہو رہا ہے"
  }
}
```

to:

```json
    "voiceMessage": "صوتی پیغام",
    "recordingVoice": "صوتی پیغام ریکارڈ ہو رہا ہے",
    "maintenanceTitle": "زیر مرمت",
    "maintenanceWindow": "ہم {{start}} اور {{end}} کے درمیان واپس آنے کی امید رکھتے ہیں۔"
  }
}
```

In `app-old/src/languages/RomanUrdu.json`, change the last two lines (currently):

```json
    "voiceMessage": "Voice message",
    "recordingVoice": "Voice message record ho raha hai"
  }
}
```

to:

```json
    "voiceMessage": "Voice message",
    "recordingVoice": "Voice message record ho raha hai",
    "maintenanceTitle": "Maintenance Jari Hai",
    "maintenanceWindow": "Hamein umeed hai {{start}} aur {{end}} ke darmiyan wapas aa jayenge."
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `app-old/src/screens/maintenance/MaintenanceScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import MaintenanceScreen from './MaintenanceScreen';

let mockMaintenanceMode: {
  enabled: boolean;
  message: string;
  start_at: string | null;
  end_at: string | null;
};

jest.mock('../../services', () => ({
  ApiServices: {
    getAppSettings: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../stores', () => ({
  useSettingsStore: (
    selector: (state: {
      getMaintenanceMode: () => unknown;
      setSettings: () => void;
    }) => unknown
  ) =>
    selector({
      getMaintenanceMode: () => mockMaintenanceMode,
      setSettings: jest.fn(),
    }),
}));

describe('MaintenanceScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockMaintenanceMode = {
      enabled: true,
      message: 'Upgrading servers.',
      start_at: '2026-07-13T22:00',
      end_at: '2026-07-14T02:00',
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the maintenance message', () => {
    render(<MaintenanceScreen />);
    expect(screen.getByText('Upgrading servers.')).toBeTruthy();
  });

  it('omits the message line when none is set', () => {
    mockMaintenanceMode = {
      enabled: true,
      message: '',
      start_at: null,
      end_at: null,
    };
    render(<MaintenanceScreen />);
    expect(screen.queryByText('Upgrading servers.')).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd app-old && yarn jest src/screens/maintenance/MaintenanceScreen.test.tsx`
Expected: FAIL — cannot find module `./MaintenanceScreen`.

- [ ] **Step 4: Write the component**

Create `app-old/src/screens/maintenance/MaintenanceScreen.tsx`:

```tsx
import moment from 'moment';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text as RNText, View } from 'react-native';

import { hp, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import { ApiServices } from '../../services';
import { useSettingsStore } from '../../stores';
import type { SettingsResponse } from '../../stores/settings-store';

const POLL_INTERVAL_MS = 30000;

const formatWindow = (value: string | null): string | null => {
  if (!value) return null;
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('MMM D, h:mm A') : value;
};

const MaintenanceScreen = () => {
  const { t } = useTranslation();
  const {
    message,
    start_at: startAt,
    end_at: endAt,
  } = useSettingsStore((state) => state.getMaintenanceMode());
  const setSettings = useSettingsStore((state) => state.setSettings);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const response =
          (await ApiServices.getAppSettings()) as SettingsResponse;
        if (response) {
          setSettings(response);
        }
      } catch (error) {
        console.error('Failed to re-check maintenance status.', error);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [setSettings]);

  const start = formatWindow(startAt);
  const end = formatWindow(endAt);

  return (
    <Modal visible transparent onRequestClose={() => {}} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <RNText style={styles.title}>{t('maintenanceTitle')}</RNText>
          {message ? <RNText style={styles.message}>{message}</RNText> : null}
          {start && end ? (
            <RNText style={styles.window}>
              {t('maintenanceWindow', { start, end })}
            </RNText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

export default MaintenanceScreen;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: wp(6),
  },
  title: {
    color: Colors.theme,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(6),
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    fontSize: wp(4),
    marginTop: hp(2),
    textAlign: 'center',
  },
  window: {
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color60,
    fontSize: wp(3.5),
    marginTop: hp(1.5),
    textAlign: 'center',
  },
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd app-old && yarn jest src/screens/maintenance/MaintenanceScreen.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Type-check and lint**

Run: `cd app-old && yarn type-check && yarn lint --quiet src/screens/maintenance/MaintenanceScreen.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json`
Expected: no new errors

- [ ] **Step 7: Commit**

```bash
cd app-old
git add src/screens/maintenance/MaintenanceScreen.tsx src/screens/maintenance/MaintenanceScreen.test.tsx src/languages/English.json src/languages/Urdu.json src/languages/RomanUrdu.json
git commit -m "feat(maintenance): add MaintenanceScreen overlay with self-polling and translations"
```

---

### Task 5: Mobile — wire the gate into `Initialization.tsx`

**Files:**

- Modify: `app-old/src/initialization/Initialization.tsx`

**Interfaces:**

- Consumes: `getMaintenanceMode()` (Task 3) via `useSettingsStore`; `MaintenanceScreen` (Task 4) via `../screens/maintenance/MaintenanceScreen`.
- Produces: nothing further consumed by other tasks — this is the final integration point.

**No automated test** — `Initialization.tsx` has no existing test coverage (heavy native-module coupling: `RNBootSplash`, `GoogleSignin`), and no test precedent exists for this file. Verification is manual QA per the spec's Testing section (see Step 5 below).

- [ ] **Step 1: Add the `AppState` import and the reactive maintenance-mode selector**

In `app-old/src/initialization/Initialization.tsx`, update the `react-native` import (line 3) to include `AppState`:

```tsx
import { AppState, Modal, StyleSheet, View } from 'react-native';
```

Add `MaintenanceScreen` import near the other local imports (after line 16):

```tsx
import MaintenanceScreen from '../screens/maintenance/MaintenanceScreen';
```

Add the reactive selector inside the component, next to the `settingsLoaded` selector (after line 35):

```tsx
const settingsLoaded = useSettingsStore((state) => state.loaded);
const maintenanceMode = useSettingsStore((state) => state.getMaintenanceMode());
```

- [ ] **Step 2: Re-check settings on foreground resume**

Add a new `useEffect` after the existing `checkForMandatoryUpdate` effect (after line 90):

```tsx
useEffect(() => {
  checkForMandatoryUpdate();
}, [checkForMandatoryUpdate]);

// Re-check /settings whenever the app returns to the foreground, so a user
// who backgrounded the app before maintenance started sees the gate on
// return without waiting for a fresh cold start.
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      checkForMandatoryUpdate();
    }
  });
  return () => subscription.remove();
}, [checkForMandatoryUpdate]);
```

- [ ] **Step 3: Give maintenance mode precedence over the force-update modal**

Replace the `return (...)` block (lines 138-166) with:

```tsx
return (
  <View style={styles.container}>
    {maintenanceMode.enabled ? (
      <MaintenanceScreen />
    ) : (
      <Modal
        visible={showUpdateModal}
        transparent
        onRequestClose={() => {}}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalBody}>
              <Text style={styles.title}>Update Required</Text>
              <Text style={styles.description}>
                A new update is now available. Please update your app to
                continue using it.
              </Text>
            </View>
            <Button
              buttonStyle={styles.ctaButton}
              onPress={handleUpdatePress}
              text="Update Now"
            />
          </View>
        </View>
      </Modal>
    )}
    {appReady && !maintenanceMode.enabled ? <RootNavigation /> : <View />}
    <RatingPromptModal />
  </View>
);
```

- [ ] **Step 4: Type-check and lint**

Run: `cd app-old && yarn type-check && yarn lint --quiet src/initialization/Initialization.tsx`
Expected: no new errors

- [ ] **Step 5: Manual QA on a running build**

This step has no automated substitute — perform it before considering the feature done:

1. Run `yarn android` (or `yarn ios`) to get the app running against the staging API.
2. In the staging admin panel, go to Settings, find "Maintenance Mode", turn it on with a test message and a start/end time, save.
3. Cold-start the app (kill and reopen) — confirm the `MaintenanceScreen` overlay appears with your message and formatted time range, and the rest of the app is unreachable.
4. Background the app, turn maintenance off in admin, foreground the app again — confirm it clears within a few seconds (via the `AppState` resume re-check).
5. Turn maintenance back on, cold-start the app, leave it sitting on the maintenance screen, then turn maintenance off in admin — confirm the screen disappears on its own within ~30s (the in-screen poll), with no user interaction.
6. Turn on both maintenance mode and force-update (`forceUpdate` setting) simultaneously — confirm only the maintenance screen shows (precedence), not the update prompt.

- [ ] **Step 6: Commit**

```bash
cd app-old
git add src/initialization/Initialization.tsx
git commit -m "feat(maintenance): gate app access on maintenance mode, ahead of force-update"
```
