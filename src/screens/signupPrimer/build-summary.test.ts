import { buildIntroSummary } from './build-summary';

describe('buildIntroSummary', () => {
  it('composes a female summary from public answers only', () => {
    const summary = buildIntroSummary(
      {
        caste: { caste: 'Rajput', matters: 'yes' },
        priorities: ['strong_deen', 'respected_family', 'kind_to_women'],
        dealbreakers: ['no_smoking', 'separate_home'],
        preferred_work: ['salaried'],
        strengths: ['kind_caring', 'family_oriented'],
        note: 'Someone honest and family-oriented.',
        // private — must never appear:
        concerns: ['worried_age'],
        stage: 'tired_rishta',
      },
      'female'
    );

    expect(summary).toContain('Rajput');
    expect(summary).toContain('Values Strong deen & character');
    expect(summary).toContain('Non-negotiables:');
    expect(summary).toContain('Prefers Salaried professional');
    expect(summary).toContain('Describes herself as Kind and caring');
    expect(summary).toContain('Someone honest and family-oriented.');
    // private answers never leak:
    expect(summary).not.toContain('Worried about my age');
  });

  it('composes a male summary and never includes the private priorities (M4)', () => {
    const summary = buildIntroSummary(
      {
        offerings: ['separate_home', 'continue_career'],
        partner_openness: ['same_city', 'revert'],
        strengths: ['hardworking'],
        // M4 is private/matching-only:
        priorities: ['beautiful', 'youthful'],
      },
      'male'
    );

    expect(summary).toContain('Offers Separate home');
    expect(summary).toContain('Open to Same city');
    expect(summary).toContain('Describes himself as Hardworking and ambitious');
    // the male "what matters most in her" answers are private:
    expect(summary).not.toContain('Beautiful');
    expect(summary).not.toContain('Youthful');
  });

  it('skips the "prefer not to say" caste sentinel and empty sections', () => {
    const summary = buildIntroSummary(
      { caste: { caste: '__pns__' } },
      'female'
    );
    expect(summary).toBe('');
  });

  it('drops the "no dealbreakers" / "no preference" filler options', () => {
    const summary = buildIntroSummary(
      {
        dealbreakers: ['no_dealbreakers'],
        preferred_work: ['no_preference'],
      },
      'female'
    );
    expect(summary).toBe('');
  });

  it('tolerates missing / malformed answers without throwing', () => {
    expect(buildIntroSummary({}, 'male')).toBe('');
    expect(
      buildIntroSummary({ priorities: 'not-an-array' as unknown }, 'female')
    ).toBe('');
  });
});
