const EYE_COLOR_HEX: Record<string, string> = {
  brown: '#6F4E37',
  amber: '#C68E17',
  hazel: '#8E7618',
  green: '#4C9A5B',
  blue: '#4A7FBF',
  grey: '#9AA0A6',
};

// A short rainbow band standing in for "Multicolor" eyes, since no single
// hex value can represent it.
const MULTICOLOR_GRADIENT = [
  '#F16A6A',
  '#F5B942',
  '#4C9A5B',
  '#4A7FBF',
  '#8E4EC6',
];

export type EyeColorSwatch = { color?: string; gradient?: string[] };

// Eye-color options don't carry a hex value from the backend (attr_type is
// 'hex' but the column is NULL), so the six real colors are a small
// client-side lookup by label. "Multicolor" gets a rainbow gradient instead
// of a flat swatch; "Prefer not to say" and anything unrecognized render no
// swatch at all.
export const getEyeColorSwatch = (label?: string): EyeColorSwatch => {
  const key = (label ?? '').trim().toLowerCase();
  if (EYE_COLOR_HEX[key]) return { color: EYE_COLOR_HEX[key] };
  if (key === 'multicolor') return { gradient: MULTICOLOR_GRADIENT };
  return {};
};
