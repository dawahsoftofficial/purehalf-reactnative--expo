type PostSignupInput = {
  membershipStatus: number | null | undefined;
  skipPaywall: boolean;
  hasMembershipGift?: boolean;
};

type Route = { name: string; params?: { navigateTo: string; from: string } };

// The shared decision for the FINAL step of the signup chain. Non-members
// normally see the subscription paywall; when the remote flag skips it, they go
// straight to the app. Members either see the gift-congrats screen (WelcomeUser
// case) or go to BottomTab. Step-ordering (lat/long, basic-info, image) stays
// in each caller — only this membership decision is shared.
export const postSignupMembershipRoute = ({
  membershipStatus,
  skipPaywall,
  hasMembershipGift = false,
}: PostSignupInput): Route => {
  const isNonMember = membershipStatus === null || membershipStatus === 0;

  if (isNonMember) {
    if (skipPaywall) {
      return { name: 'BottomTab' };
    }
    return {
      name: 'ProFeaturesPromotion',
      params: { navigateTo: 'BottomTab', from: 'SignUp' },
    };
  }

  if (hasMembershipGift) {
    return {
      name: 'GiftMembershipCongrats',
      params: { navigateTo: 'BottomTab', from: 'SignUp' },
    };
  }

  return { name: 'BottomTab' };
};
