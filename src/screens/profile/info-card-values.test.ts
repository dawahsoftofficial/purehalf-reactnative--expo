import { hasRealProfileValue } from './info-card-values';

describe('hasRealProfileValue', () => {
  it('does not treat a redacted disability as a visible None answer', () => {
    expect(hasRealProfileValue({ selected: {} })).toBe(false);
  });

  it('keeps numeric No answers and non-empty strings visible', () => {
    expect(hasRealProfileValue({ selected: { value: 0 } })).toBe(true);
    expect(hasRealProfileValue({ selected: { value: 'None' } })).toBe(true);
  });
});
