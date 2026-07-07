import {
  getOptionKey,
  getOptionLabel,
  getProgressLabel,
  getVisibleProfileFields,
  isOptionSelected,
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
  it('formats the group title and one-based progress', () => {
    expect(getProgressLabel('Lifestyle', 0, 11)).toBe('Lifestyle - 1 of 11');
  });

  it('keeps progress inside range', () => {
    expect(getProgressLabel('Lifestyle', 20, 11)).toBe('Lifestyle - 11 of 11');
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
});
