import { postSignupMembershipRoute } from './resolve-post-signup-route';

describe('postSignupMembershipRoute', () => {
  it('returns the paywall for a non-member when skip is off', () => {
    const r = postSignupMembershipRoute({
      membershipStatus: 0,
      skipPaywall: false,
    });
    expect(r.name).toBe('ProFeaturesPromotion');
    expect(r.params).toEqual({ navigateTo: 'BottomTab', from: 'SignUp' });
  });

  it('skips straight to BottomTab for a non-member when skip is on', () => {
    const r = postSignupMembershipRoute({
      membershipStatus: 0,
      skipPaywall: true,
    });
    expect(r.name).toBe('BottomTab');
    expect(r.params).toBeUndefined();
  });

  it('skips for a null membership when skip is on', () => {
    expect(
      postSignupMembershipRoute({ membershipStatus: null, skipPaywall: true })
        .name
    ).toBe('BottomTab');
  });

  it('sends a member to the gift-congrats route when requested', () => {
    const r = postSignupMembershipRoute({
      membershipStatus: 1,
      skipPaywall: true,
      hasMembershipGift: true,
    });
    expect(r.name).toBe('GiftMembershipCongrats');
  });

  it('sends a member to BottomTab by default', () => {
    expect(
      postSignupMembershipRoute({ membershipStatus: 1, skipPaywall: false })
        .name
    ).toBe('BottomTab');
  });
});
