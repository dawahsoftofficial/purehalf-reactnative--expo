import {
  femaleJourney,
  maleJourney,
  SECOND_MARRIAGE_LABEL,
  SECT_PREFERENCE_OPTIONS,
} from './journeys';

describe('signup primer journeys', () => {
  it('starts the male journey with marital status and highlights second marriage', () => {
    expect(maleJourney[0]).toMatchObject({
      id: 'status',
      hasPolygamy: true,
    });
    expect(SECOND_MARRIAGE_LABEL).toBe('Looking for a second marriage');
  });

  it('does not ask caste in either journey', () => {
    expect(femaleJourney.some((step) => step.id === 'caste')).toBe(false);
    expect(maleJourney.some((step) => step.id === 'caste')).toBe(false);
  });

  it('does not ask male members about smoking or drinking in the primer', () => {
    expect(maleJourney.some((step) => step.id === 'habits')).toBe(false);
  });

  it('uses clear sect preference choices for both journeys', () => {
    expect(femaleJourney.some((step) => step.id === 'sect')).toBe(true);
    expect(maleJourney.some((step) => step.id === 'sect')).toBe(true);
    expect(SECT_PREFERENCE_OPTIONS.map((option) => option.label)).toEqual([
      'Prefer the same sect',
      'Any sect can work',
    ]);
  });
});
