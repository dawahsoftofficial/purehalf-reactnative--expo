import { getEyeColorSwatch } from './eye-color-swatches';

describe('getEyeColorSwatch', () => {
  it('returns a hex color for each of the six real eye colors', () => {
    expect(getEyeColorSwatch('Brown')).toEqual({ color: '#6F4E37' });
    expect(getEyeColorSwatch('Amber')).toEqual({ color: '#C68E17' });
    expect(getEyeColorSwatch('Hazel')).toEqual({ color: '#8E7618' });
    expect(getEyeColorSwatch('Green')).toEqual({ color: '#4C9A5B' });
    expect(getEyeColorSwatch('Blue')).toEqual({ color: '#4A7FBF' });
    expect(getEyeColorSwatch('Grey')).toEqual({ color: '#9AA0A6' });
  });

  it('matches case-insensitively', () => {
    expect(getEyeColorSwatch('BROWN')).toEqual({ color: '#6F4E37' });
    expect(getEyeColorSwatch('brown')).toEqual({ color: '#6F4E37' });
  });

  it('returns a palette icon for Multicolor instead of a flat color', () => {
    expect(getEyeColorSwatch('Multicolor')).toEqual({
      icon: 'color-palette-outline',
    });
  });

  it('returns no swatch for "Prefer not to say"', () => {
    expect(getEyeColorSwatch('Prefer not to say')).toEqual({});
  });

  it('returns no swatch for unrecognized or missing labels', () => {
    expect(getEyeColorSwatch('Something new')).toEqual({});
    expect(getEyeColorSwatch(undefined)).toEqual({});
    expect(getEyeColorSwatch('')).toEqual({});
  });
});
