const EYE_COLOR_HEX: Record<string, string> = {
  brown: '#6F4E37',
  amber: '#C68E17',
  hazel: '#8E7618',
  green: '#4C9A5B',
  blue: '#4A7FBF',
  grey: '#9AA0A6',
};

export type EyeColorSwatch = { color?: string; icon?: string };

// Eye-color options don't carry a hex value from the backend (attr_type is
// 'hex' but the column is NULL), so the six real colors are a small
// client-side lookup by label. "Multicolor" gets a palette icon instead of a
// flat swatch (one color can't represent it); "Prefer not to say" and
// anything unrecognized render no swatch at all.
export const getEyeColorSwatch = (label?: string): EyeColorSwatch => {
  const key = (label ?? '').trim().toLowerCase();
  if (EYE_COLOR_HEX[key]) return { color: EYE_COLOR_HEX[key] };
  if (key === 'multicolor') return { icon: 'color-palette-outline' };
  return {};
};
