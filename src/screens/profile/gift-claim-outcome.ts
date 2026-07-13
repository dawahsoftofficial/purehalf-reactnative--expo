/* eslint-disable @typescript-eslint/no-explicit-any */

// Pure helpers around the result of claiming the profile-completion gift
// (ApiServices.claimProfileGift). Extracted so the one piece of this feature
// that touches real currency-equivalent state (chat_credits) has real,
// running test coverage instead of living as duplicated inline logic in
// OnboardingProfile.tsx and Header.tsx.
export type ClaimResult = {
  status: string;
  awarded: number;
  new_balance: number;
  multiplier: number;
};

export const buildUpdatedUserAfterGiftClaim = (
  currentUser: any,
  result: ClaimResult
) => ({
  ...(currentUser ?? {}),
  chat_credits: result.new_balance,
  profile_finish_bonus_awarded: true,
});

// A repeat claim resolves with status: 'already_claimed' (awarded: 0)
// instead of rejecting — see ApiServices.claimProfileGift's JSDoc. Only show
// the reward toast for a genuinely fresh claim so stale local state (e.g.
// multi-device use) doesn't surface a confusing "+0 Chat Credits" toast.
export const shouldShowGiftClaimToast = (result: ClaimResult): boolean =>
  result.status === 'claimed';
