import { formatMembershipAmount } from './membership-purchase-display';

describe('formatMembershipAmount', () => {
  it('uses the localized RevenueCat price when available', () => {
    expect(
      formatMembershipAmount({
        amount: 7.49,
        localizedPrice: '£7.49',
        currencyCode: 'GBP',
      })
    ).toBe('£7.49');
  });

  it('falls back to the supplied currency code and grouped amount', () => {
    expect(
      formatMembershipAmount({ amount: 1249.5, currencyCode: 'usd' })
    ).toBe('USD 1,249.5');
  });

  it('keeps PKR as the legacy fallback for server-triggered confirmations', () => {
    expect(formatMembershipAmount({ amount: 500 })).toBe('PKR 500');
  });
});
