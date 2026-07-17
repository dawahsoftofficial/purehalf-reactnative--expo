import {
  computeProgress,
  formatMatchCount,
  isAutoAdvance,
  nextStepIndex,
  prevStepIndex,
  type PrimerStep,
  questionPosition,
  shouldShowPrimer,
} from './primer-logic';

describe('shouldShowPrimer', () => {
  it('shows only when not logged in, enabled, and unseen', () => {
    expect(
      shouldShowPrimer({ loggedIn: false, enabled: true, seen: false })
    ).toBe(true);
  });
  it('hides when logged in', () =>
    expect(
      shouldShowPrimer({ loggedIn: true, enabled: true, seen: false })
    ).toBe(false));
  it('hides when disabled', () =>
    expect(
      shouldShowPrimer({ loggedIn: false, enabled: false, seen: false })
    ).toBe(false));
  it('hides when already seen', () =>
    expect(
      shouldShowPrimer({ loggedIn: false, enabled: true, seen: true })
    ).toBe(false));
});

describe('formatMatchCount', () => {
  it('groups thousands', () => expect(formatMatchCount(1240)).toBe('1,240'));
  it('leaves small numbers', () => expect(formatMatchCount(50)).toBe('50'));
  it('rounds floats', () => expect(formatMatchCount(1239.6)).toBe('1,240'));
  it('guards NaN and negatives', () => {
    expect(formatMatchCount(NaN)).toBe('0');
    expect(formatMatchCount(-5)).toBe('0');
  });
});

describe('conditional steps', () => {
  const steps: PrimerStep[] = [
    { id: 'a' },
    { id: 'b', showIf: (ans) => ans.wantB === true },
    { id: 'c' },
  ];

  it('nextStepIndex skips a hidden step', () => {
    expect(nextStepIndex(steps, { wantB: false }, 0)).toBe(2);
    expect(nextStepIndex(steps, { wantB: true }, 0)).toBe(1);
  });

  it('nextStepIndex returns -1 at the end', () => {
    expect(nextStepIndex(steps, { wantB: false }, 2)).toBe(-1);
  });

  it('prevStepIndex skips a hidden step', () => {
    expect(prevStepIndex(steps, { wantB: false }, 2)).toBe(0);
    expect(prevStepIndex(steps, { wantB: true }, 2)).toBe(1);
  });

  it('prevStepIndex returns -1 at the first question', () => {
    expect(prevStepIndex(steps, { wantB: false }, 0)).toBe(-1);
  });

  it('computeProgress is over visible steps only', () => {
    expect(computeProgress(steps, { wantB: false }, 0)).toBe(50);
    expect(computeProgress(steps, { wantB: false }, 2)).toBe(100);
    expect(computeProgress(steps, { wantB: true }, 0)).toBe(33);
  });

  it('questionPosition counts only visible steps', () => {
    expect(questionPosition(steps, { wantB: false }, 2)).toEqual({
      current: 2,
      total: 2,
    });
    expect(questionPosition(steps, { wantB: true }, 1)).toEqual({
      current: 2,
      total: 3,
    });
  });
});

describe('isAutoAdvance', () => {
  it("'single' always self-advances", () =>
    expect(isAutoAdvance({ control: 'single' })).toBe(true));

  it("'status' self-advances without the polygamy checkbox (woman Q2)", () =>
    expect(isAutoAdvance({ control: 'status' })).toBe(true));

  it("'status' waits for Continue when the polygamy checkbox is shown (man Q1)", () =>
    expect(isAutoAdvance({ control: 'status', hasPolygamy: true })).toBe(
      false
    ));

  it("'deen' self-advances without the revert checkbox (man Q3)", () =>
    expect(isAutoAdvance({ control: 'deen' })).toBe(true));

  it("'deen' waits for Continue when the revert checkbox is shown (woman Q3)", () =>
    expect(isAutoAdvance({ control: 'deen', hasRevert: true })).toBe(false));

  it('controls with extra inputs never self-advance', () => {
    expect(isAutoAdvance({ control: 'multi' })).toBe(false);
    expect(isAutoAdvance({ control: 'work' })).toBe(false);
    expect(isAutoAdvance({ control: 'sectCombo' })).toBe(false);
    expect(isAutoAdvance({ control: 'slider' })).toBe(false);
    expect(isAutoAdvance({ control: 'text' })).toBe(false);
    expect(isAutoAdvance({ control: 'traits' })).toBe(false);
    expect(isAutoAdvance({ control: 'habits' })).toBe(false);
    expect(isAutoAdvance({ control: 'casteCombo' })).toBe(false);
  });

  it('an unknown control needs Continue (safe direction)', () =>
    expect(isAutoAdvance({ control: 'something-new' })).toBe(false));
});
