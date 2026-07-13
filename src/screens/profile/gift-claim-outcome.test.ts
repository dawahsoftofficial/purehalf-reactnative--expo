import type { ClaimResult } from './gift-claim-outcome';
import {
  buildUpdatedUserAfterGiftClaim,
  shouldShowGiftClaimToast,
} from './gift-claim-outcome';

const result = (overrides: Partial<ClaimResult> = {}): ClaimResult => ({
  status: 'claimed',
  awarded: 50,
  new_balance: 150,
  multiplier: 50,
  ...overrides,
});

describe('buildUpdatedUserAfterGiftClaim', () => {
  it('merges chat_credits and profile_finish_bonus_awarded onto the existing user', () => {
    const currentUser = { id: 1, chat_credits: 100 };

    expect(
      buildUpdatedUserAfterGiftClaim(currentUser, result({ new_balance: 150 }))
    ).toEqual({
      id: 1,
      chat_credits: 150,
      profile_finish_bonus_awarded: true,
    });
  });

  it('preserves other existing fields on the user object', () => {
    const currentUser = {
      id: 7,
      full_name: 'Amina',
      detail: { tagline: 'Hello' },
    };

    expect(buildUpdatedUserAfterGiftClaim(currentUser, result())).toEqual({
      id: 7,
      full_name: 'Amina',
      detail: { tagline: 'Hello' },
      chat_credits: 150,
      profile_finish_bonus_awarded: true,
    });
  });

  it('handles a null currentUser', () => {
    expect(buildUpdatedUserAfterGiftClaim(null, result())).toEqual({
      chat_credits: 150,
      profile_finish_bonus_awarded: true,
    });
  });

  it('handles an undefined currentUser', () => {
    expect(buildUpdatedUserAfterGiftClaim(undefined, result())).toEqual({
      chat_credits: 150,
      profile_finish_bonus_awarded: true,
    });
  });
});

describe('shouldShowGiftClaimToast', () => {
  it('is true for a fresh claim', () => {
    expect(shouldShowGiftClaimToast(result({ status: 'claimed' }))).toBe(true);
  });

  it('is false when the gift was already claimed', () => {
    expect(
      shouldShowGiftClaimToast(result({ status: 'already_claimed' }))
    ).toBe(false);
  });

  it('is false for any other unexpected status value', () => {
    expect(shouldShowGiftClaimToast(result({ status: 'pending' }))).toBe(false);
    expect(shouldShowGiftClaimToast(result({ status: '' }))).toBe(false);
  });
});
