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

const call = (over: Partial<typeof baseState>, cfg: Partial<RatingPromptConfig> = {}) =>
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
