import {
  buildScalingSelected,
  convertScaleValue,
  formatScaleValue,
  getOptionKey,
  getOptionLabel,
  getProgressLabel,
  getScalingDisplay,
  getVisibleProfileFields,
  inchesFromLegacyFeet,
  isActiveItemAnswered,
  isFieldFilled,
  isOptionSelected,
  normalizeScalingSelected,
  shouldUseTagOptions,
} from './profile-editor-flow';

const field = (overrides: Record<string, unknown>) => ({
  id: 'field-1',
  title: 'Field',
  type: 'dropDown',
  data: [],
  selected: {},
  ...overrides,
});

describe('getVisibleProfileFields', () => {
  it('hides beard for female users', () => {
    const fields = [field({ id: 'doYouHaveABeard' }), field({ id: 'sect-0' })];

    expect(
      getVisibleProfileFields(fields, 'female').map((item) => item.id)
    ).toEqual(['sect-0']);
  });

  it('hides hijab for male users', () => {
    const fields = [field({ id: 'hijab-0' }), field({ id: 'sect-0' })];

    expect(
      getVisibleProfileFields(fields, 'male').map((item) => item.id)
    ).toEqual(['sect-0']);
  });

  it('treats missing gender as male for existing behavior compatibility', () => {
    const fields = [field({ id: 'hijab-0' }), field({ id: 'doYouHaveABeard' })];

    expect(getVisibleProfileFields(fields).map((item) => item.id)).toEqual([
      'doYouHaveABeard',
    ]);
  });
});

describe('getProgressLabel', () => {
  it('formats one-based progress without repeating the group title', () => {
    expect(getProgressLabel('Lifestyle', 0, 11)).toBe('1 of 11');
  });

  it('keeps progress inside range', () => {
    expect(getProgressLabel('Lifestyle', 20, 11)).toBe('11 of 11');
  });
});

describe('option helpers', () => {
  it('uses binary option id as the visible label', () => {
    const item = field({ type: 'dropDownBinary' });
    expect(getOptionLabel(item, { id: 'Yes', value: 1 })).toBe('Yes');
  });

  it('uses dropdown option value as the visible label', () => {
    const item = field({ type: 'dropDown' });
    expect(getOptionLabel(item, { id: 5, value: 'Masters' })).toBe('Masters');
  });

  it('builds stable option keys from id and value', () => {
    expect(getOptionKey({ id: 'Yes', value: 1 })).toBe('Yes-1');
  });

  it('matches binary selected value', () => {
    const item = field({
      type: 'dropDownBinary',
      selected: { id: 'No', value: 0 },
    });
    expect(isOptionSelected(item, { id: 'No', value: 0 })).toBe(true);
  });

  it('matches dropdown selected id', () => {
    const item = field({
      type: 'dropDown',
      selected: { id: 4, value: 'Engineer' },
    });
    expect(isOptionSelected(item, { id: 4, value: 'Engineer' })).toBe(true);
  });

  it('uses tags for binary fields', () => {
    const item = field({
      type: 'dropDownBinary',
      data: [
        { id: 'Yes', value: 1 },
        { id: 'No', value: 0 },
      ],
    });

    expect(shouldUseTagOptions(item, item.data)).toBe(true);
  });

  it('uses tags for dropdown fields with two to five local options', () => {
    const item = field({
      type: 'dropDown',
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
        { id: 3, value: 'C' },
      ],
    });

    expect(shouldUseTagOptions(item, item.data)).toBe(true);
  });

  it('does not use tags for larger dropdown fields', () => {
    const item = field({
      type: 'dropDown',
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
        { id: 3, value: 'C' },
        { id: 4, value: 'D' },
        { id: 5, value: 'E' },
        { id: 6, value: 'F' },
      ],
    });

    expect(shouldUseTagOptions(item, item.data)).toBe(false);
  });

  it('uses tags for inline-flagged dropdowns regardless of option count', () => {
    const item = field({
      type: 'dropDown',
      inline: true,
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
        { id: 3, value: 'C' },
        { id: 4, value: 'D' },
        { id: 5, value: 'E' },
        { id: 6, value: 'F' },
      ],
    });

    expect(shouldUseTagOptions(item, item.data)).toBe(true);
  });
});

describe('inchesFromLegacyFeet', () => {
  it('parses feet.inches decimals digit-wise, not numerically', () => {
    expect(inchesFromLegacyFeet(5.11)).toBe(71);
    expect(inchesFromLegacyFeet('5.11')).toBe(71);
    expect(inchesFromLegacyFeet(4.0)).toBe(48);
    expect(inchesFromLegacyFeet(5)).toBe(60);
  });

  it('reads the ambiguous x.1 legacy value as x feet 1 inch', () => {
    expect(inchesFromLegacyFeet(5.1)).toBe(61);
  });

  it('clamps impossible legacy inch parts like 7.12', () => {
    expect(inchesFromLegacyFeet(7.12)).toBe(7 * 12 + 11);
  });

  it('returns null for empty or unparsable values', () => {
    expect(inchesFromLegacyFeet(null)).toBeNull();
    expect(inchesFromLegacyFeet(undefined)).toBeNull();
    expect(inchesFromLegacyFeet('')).toBeNull();
    expect(inchesFromLegacyFeet('abc')).toBeNull();
  });
});

describe('convertScaleValue', () => {
  it('round-trips common heights between cm and inches', () => {
    expect(convertScaleValue(178, 'cm', 'ft')).toBe(70);
    expect(convertScaleValue(70, 'ft', 'cm')).toBe(178);
    expect(convertScaleValue(165, 'cm', 'cm')).toBe(165);
  });

  it('converts weight between kg and lbs', () => {
    expect(convertScaleValue(70, 'kg', 'lbs')).toBe(154);
    expect(convertScaleValue(154, 'lbs', 'kg')).toBe(70);
  });
});

describe('formatScaleValue', () => {
  it('formats total inches as feet and inches', () => {
    expect(formatScaleValue('ft', 70)).toBe('5′10″');
    expect(formatScaleValue('ft', 48)).toBe('4′0″');
  });

  it('formats plain units with a suffix', () => {
    expect(formatScaleValue('cm', 178)).toBe('178 cm');
    expect(formatScaleValue('kg', 70)).toBe('70 kg');
  });
});

describe('buildScalingSelected', () => {
  it('always commits height as cm, keeping the display unit separately', () => {
    const height = field({ id: 'height', type: 'scalling' });
    expect(buildScalingSelected(height, 'ft', 70)).toEqual({
      value: 178,
      scale: 'cm',
      displayScale: 'ft',
    });
    expect(buildScalingSelected(height, 'cm', 165)).toEqual({
      value: 165,
      scale: 'cm',
      displayScale: 'cm',
    });
  });

  it('commits weight in the chosen unit', () => {
    const weight = field({ id: 'weight', type: 'scalling' });
    expect(buildScalingSelected(weight, 'lbs', 154)).toEqual({
      value: 154,
      scale: 'lbs',
    });
  });
});

describe('normalizeScalingSelected', () => {
  it('converts a legacy feet.inches height to cm on load', () => {
    const item = normalizeScalingSelected(
      field({
        id: 'height',
        type: 'scalling',
        selected: { value: 5.9, scale: 'ft' },
      })
    );
    expect(item.selected).toEqual({
      value: convertScaleValue(5 * 12 + 9, 'ft', 'cm'),
      scale: 'cm',
      displayScale: 'ft',
    });
  });

  it('keeps a cm height and defaults the display unit to cm', () => {
    const item = normalizeScalingSelected(
      field({
        id: 'height',
        type: 'scalling',
        selected: { value: 178, scale: 'cm' },
      })
    );
    expect(item.selected).toEqual({
      value: 178,
      scale: 'cm',
      displayScale: 'cm',
    });
  });

  it('preserves the preferred unit when no value is set', () => {
    const item = normalizeScalingSelected(
      field({ id: 'height', type: 'scalling', selected: { scale: 'ft' } })
    );
    expect(item.selected).toEqual({ scale: 'cm', displayScale: 'ft' });
  });

  it('rounds weight and keeps its unit', () => {
    const item = normalizeScalingSelected(
      field({
        id: 'weight',
        type: 'scalling',
        selected: { value: '154', scale: 'lbs' },
      })
    );
    expect(item.selected).toEqual({ value: 154, scale: 'lbs' });
  });

  it('leaves non-scalling items untouched', () => {
    const item = field({ id: 'caste', type: 'input' });
    expect(normalizeScalingSelected(item)).toBe(item);
  });
});

describe('getScalingDisplay', () => {
  it('presents height in the display unit from the canonical cm value', () => {
    expect(
      getScalingDisplay(
        field({
          id: 'height',
          type: 'scalling',
          selected: { value: 178, scale: 'cm', displayScale: 'ft' },
        })
      )
    ).toEqual({ scale: 'ft', value: 70 });
  });

  it('returns a null value when height is unset', () => {
    expect(
      getScalingDisplay(
        field({
          id: 'height',
          type: 'scalling',
          selected: { scale: 'cm', displayScale: 'cm' },
        })
      )
    ).toEqual({ scale: 'cm', value: null });
  });

  it('presents weight in its own unit', () => {
    expect(
      getScalingDisplay(
        field({
          id: 'weight',
          type: 'scalling',
          selected: { value: 154, scale: 'lbs' },
        })
      )
    ).toEqual({ scale: 'lbs', value: 154 });
  });
});

describe('isFieldFilled', () => {
  it('is unfilled for a dropdown with no id selected', () => {
    expect(isFieldFilled(field({ type: 'dropDown', selected: {} }))).toBe(
      false
    );
  });

  it('is filled once a dropdown option id is selected', () => {
    expect(
      isFieldFilled(
        field({ type: 'dropDown', selected: { id: 4, value: 'Engineer' } })
      )
    ).toBe(true);
  });

  it('is filled for a binary field even when the value is falsy (No = 0)', () => {
    expect(
      isFieldFilled(
        field({ type: 'dropDownBinary', selected: { id: 'No', value: 0 } })
      )
    ).toBe(true);
  });

  it('is unfilled for a binary field with no value yet', () => {
    expect(isFieldFilled(field({ type: 'dropDownBinary', selected: {} }))).toBe(
      false
    );
  });

  it('is filled for a scalling field once a value is committed', () => {
    expect(
      isFieldFilled(
        field({ type: 'scalling', selected: { value: 178, scale: 'cm' } })
      )
    ).toBe(true);
  });

  it('is unfilled for a scalling field with no committed value', () => {
    expect(
      isFieldFilled(field({ type: 'scalling', selected: { scale: 'cm' } }))
    ).toBe(false);
  });

  it('is filled for free text once non-empty', () => {
    expect(
      isFieldFilled(
        field({ type: 'input', selected: { value: 'Kind and practising' } })
      )
    ).toBe(true);
  });

  it('is unfilled for empty free text', () => {
    expect(
      isFieldFilled(field({ type: 'input', selected: { value: '' } }))
    ).toBe(false);
    expect(isFieldFilled(field({ type: 'input', selected: {} }))).toBe(false);
  });

  it('is unfilled for whitespace-only free text', () => {
    expect(
      isFieldFilled(field({ type: 'input', selected: { value: '   ' } }))
    ).toBe(false);
  });
});

describe('isActiveItemAnswered', () => {
  it('reads the live typing buffer for the item currently focused, ignoring its uncommitted selected value', () => {
    const item = field({
      id: 'aboutYourself',
      type: 'input',
      selected: {},
    });

    expect(isActiveItemAnswered(item, 'aboutYourself', 'Kind and honest')).toBe(
      true
    );
  });

  it('treats a whitespace-only live buffer as unanswered', () => {
    const item = field({ id: 'aboutYourself', type: 'input', selected: {} });

    expect(isActiveItemAnswered(item, 'aboutYourself', '   ')).toBe(false);
  });

  it('treats an empty live buffer as unanswered even if committed selected has a stale value', () => {
    const item = field({
      id: 'aboutYourself',
      type: 'input',
      selected: { value: 'old answer' },
    });

    expect(isActiveItemAnswered(item, 'aboutYourself', '')).toBe(false);
  });

  it('falls back to the committed selected value when this item is not the focused one', () => {
    const item = field({
      id: 'aboutYourself',
      type: 'input',
      selected: { value: 'Kind and honest' },
    });

    expect(isActiveItemAnswered(item, 'otherField', '')).toBe(true);
  });

  it('falls back to isFieldFilled for non-input types regardless of focus state', () => {
    const item = field({
      id: 'sect-0',
      type: 'dropDown',
      selected: { id: 4, value: 'Sunni' },
    });

    expect(isActiveItemAnswered(item, 'sect-0', '')).toBe(true);
  });

  it('is unanswered when there is no active item', () => {
    expect(isActiveItemAnswered(undefined, '', '')).toBe(false);
  });
});
