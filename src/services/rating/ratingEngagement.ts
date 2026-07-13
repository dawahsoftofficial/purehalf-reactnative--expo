import { StorageManager } from '@/services/storageManager';
import { useRatingStore } from '@/stores/rating-store';
import type { RatingPromptConfig } from '@/stores/settings-store';
import { useSettingsStore } from '@/stores/settings-store';

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
