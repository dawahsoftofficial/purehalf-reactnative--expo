import { computeGiftStatus, computeStrengthFromUser } from './gift-status';

describe('computeStrengthFromUser', () => {
  it('is 0 for a user with no detail at all', () => {
    expect(computeStrengthFromUser({})).toBe(0);
    expect(computeStrengthFromUser(undefined)).toBe(0);
  });

  it('increases as more detail fields are filled', () => {
    const empty = computeStrengthFromUser({ detail: {} });
    const partial = computeStrengthFromUser({
      detail: {
        about_you: 'Kind and practising',
        about_partner: 'Someone caring',
        likes: 'Reading',
        dislikes: 'Dishonesty',
        open_for_polygamy: 0,
      },
    });

    expect(partial).toBeGreaterThan(empty);
  });

  it('counts interest_id and tagline presence toward the total', () => {
    const withoutExtras = computeStrengthFromUser({ detail: {} });
    const withExtras = computeStrengthFromUser({
      detail: { interest_id: [1, 2], tagline: 'Looking for my other half' },
    });

    expect(withExtras).toBeGreaterThan(withoutExtras);
  });

  it('treats a whitespace-only tagline as not filled', () => {
    const blank = computeStrengthFromUser({ detail: { tagline: '   ' } });
    const empty = computeStrengthFromUser({ detail: {} });

    expect(blank).toBe(empty);
  });
});

describe('computeGiftStatus', () => {
  it('is unclaimed and ineligible for a brand-new user', () => {
    expect(computeGiftStatus({}, 90)).toEqual({
      strengthPct: 0,
      claimed: false,
      eligible: false,
    });
  });

  it('is eligible once strength crosses the threshold', () => {
    const status = computeGiftStatus({ detail: {} }, 0);

    expect(status.eligible).toBe(true);
  });

  it('is never eligible once already claimed, regardless of strength or threshold', () => {
    const status = computeGiftStatus(
      { profile_finish_bonus_awarded: true, detail: {} },
      0
    );

    expect(status.claimed).toBe(true);
    expect(status.eligible).toBe(false);
  });

  it('is ineligible below the threshold', () => {
    const status = computeGiftStatus({ detail: {} }, 101);

    expect(status.eligible).toBe(false);
  });
});
