/* eslint-disable @typescript-eslint/no-explicit-any */

export type ProfileEditorField = {
  id?: string;
  title?: string;
  type?: string;
  data?: any[];
  selected?: any;
  inline?: boolean; // force inline option tiles regardless of option count
};

export const isFieldHiddenForGender = (
  item: ProfileEditorField,
  gender?: string
) => {
  const isMale = gender !== 'female';
  return (
    (item?.id === 'doYouHaveABeard' && !isMale) ||
    (item?.id === 'hijab-0' && isMale)
  );
};

export const getVisibleProfileFields = (
  fields: ProfileEditorField[] = [],
  gender?: string
) => fields.filter((item) => !isFieldHiddenForGender(item, gender));

export const getProgressLabel = (
  _title: string,
  activeIndex: number,
  total: number
) => {
  const safeTotal = Math.max(total, 0);
  const safeIndex = safeTotal
    ? Math.min(Math.max(activeIndex, 0), safeTotal - 1)
    : 0;
  return `${safeTotal ? safeIndex + 1 : 0} of ${safeTotal}`;
};

export const getOptionKey = (option: any) =>
  `${String(option?.id ?? '')}-${String(option?.value ?? '')}`;

export const getOptionLabel = (item: ProfileEditorField, option: any) => {
  const label = item?.type === 'dropDownBinary' ? option?.id : option?.value;
  if (label === null || label === undefined) return '';
  return String(label);
};

export const isOptionSelected = (item: ProfileEditorField, option: any) =>
  item?.type === 'dropDownBinary'
    ? item?.selected?.value === option?.value
    : item?.selected?.id === option?.id;

// Whether a field's current selection counts as "answered" — used to gate
// the wizard's Next button and, indirectly, profile-strength completion.
export const isFieldFilled = (item: ProfileEditorField) => {
  const sel: any = item?.selected ?? {};
  if (item?.type === 'scalling') return sel.value != null && sel.value !== '';
  if (item?.type === 'dropDown') return sel.id != null;
  if (item?.type === 'dropDownBinary') return sel.value != null;
  // Free-text/default branch: trim whitespace before checking emptiness so
  // this matches the backend's ProfileRewardService::isFilled() check. A
  // whitespace-only answer must not satisfy the wizard's required-answer
  // gate, or profile-strength could read 100% locally while the backend
  // still considers the field unfilled and rejects the completion claim.
  return sel.value != null && String(sel.value).trim() !== '';
};

// Whether the active question counts as "answered" for the wizard's Next-
// button gate. A free-text field being actively typed into hasn't committed
// its value to item.selected yet (that only happens on blur — see
// TextQuestionInput's onCommit in profile-question-wizard), so while it's
// the active question this reads a live boolean the input reports on every
// keystroke instead of the stale committed value. That boolean (not the raw
// text) is deliberate: the input owns its own per-keystroke text state so
// typing never re-renders the surrounding question card, and only reports
// upward when answered/unanswered actually flips.
export const isActiveItemAnswered = (
  item: ProfileEditorField | undefined,
  liveAnswered: { id: string; answered: boolean } | null
): boolean => {
  if (!item) return false;
  if (item.type === 'input' && liveAnswered && item.id === liveAnswered.id) {
    return liveAnswered.answered;
  }
  return isFieldFilled(item);
};

export const shouldUseTagOptions = (
  item: ProfileEditorField,
  options: any[] = []
) => {
  if (options.length < 2) return false;
  if (item?.type === 'dropDownBinary') return true;
  if (item?.type !== 'dropDown') return false;
  // Fields flagged `inline` always render as tappable tiles, however many
  // options they have (e.g. body type, eye colour, complexion). Otherwise only
  // short lists become tiles; longer ones keep the searchable modal picker.
  return item?.inline === true || options.length <= 5;
};

// Height is always sent to the API as cm. The backend stores height in a
// numeric double column, so the legacy feet.inches encoding cannot represent
// x'10" (4.10 collapses to the float 4.1 = 4'1"). Feet is therefore a
// display/input unit only; ft values are handled as total inches in the app.
export const inchesFromLegacyFeet = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const [feetPart, inchPart = '0'] = String(value).split('.');
  const feet = parseInt(feetPart, 10);
  if (Number.isNaN(feet)) return null;
  const inches = parseInt(inchPart, 10);
  return feet * 12 + Math.min(Number.isNaN(inches) ? 0 : inches, 11);
};

export const convertScaleValue = (
  value: number,
  fromScale: string,
  toScale: string
) => {
  if (fromScale === toScale) return value;
  if (fromScale === 'cm' && toScale === 'ft') return Math.round(value / 2.54);
  if (fromScale === 'ft' && toScale === 'cm') return Math.round(value * 2.54);
  if (fromScale === 'kg' && toScale === 'lbs')
    return Math.round(value * 2.20462);
  if (fromScale === 'lbs' && toScale === 'kg')
    return Math.round(value / 2.20462);
  return value;
};

export const formatScaleValue = (scale: string, value: number) => {
  if (scale === 'ft') return `${Math.floor(value / 12)}′${value % 12}″`;
  return `${value} ${scale}`;
};

// In-app selected shape for scalling fields:
//   height: { value: <cm>, scale: 'cm', displayScale: 'cm' | 'ft' }
//   weight: { value: <unit int>, scale: 'kg' | 'lbs' }
// displayScale is never sent to the API (Funtions.tsx builds params explicitly).
export const getScalingDisplay = (item: ProfileEditorField) => {
  const sel = item?.selected ?? {};
  if (item?.id === 'height') {
    const scale = sel.displayScale === 'ft' ? 'ft' : 'cm';
    const value =
      sel.value === null || sel.value === undefined
        ? null
        : convertScaleValue(sel.value, 'cm', scale);
    return { scale, value };
  }
  const scale = sel.scale === 'lbs' ? 'lbs' : 'kg';
  const value =
    sel.value === null || sel.value === undefined ? null : Number(sel.value);
  return { scale, value };
};

export const buildScalingSelected = (
  item: ProfileEditorField,
  scale: string,
  unitValue: number
) => {
  if (item?.id === 'height') {
    return {
      value: convertScaleValue(unitValue, scale, 'cm'),
      scale: 'cm',
      displayScale: scale,
    };
  }
  return { value: unitValue, scale };
};

// Values loaded from the API can be legacy feet.inches decimals; convert them
// to the canonical in-app shape once, when the editor opens. Ambiguous legacy
// values like 5.1 are read as 5'1".
export const normalizeScalingSelected = (item: any) => {
  if (item?.type !== 'scalling') return item;
  const sel = item?.selected ?? {};
  if (item?.id === 'height') {
    const displayScale = sel.displayScale ?? (sel.scale === 'ft' ? 'ft' : 'cm');
    if (sel.value === null || sel.value === undefined || sel.value === '') {
      return { ...item, selected: { scale: 'cm', displayScale } };
    }
    if (sel.scale === 'ft') {
      const inches = inchesFromLegacyFeet(sel.value);
      if (inches === null) {
        return { ...item, selected: { scale: 'cm', displayScale } };
      }
      return {
        ...item,
        selected: {
          value: convertScaleValue(inches, 'ft', 'cm'),
          scale: 'cm',
          displayScale,
        },
      };
    }
    return {
      ...item,
      selected: {
        value: Math.round(Number(sel.value)),
        scale: 'cm',
        displayScale,
      },
    };
  }
  if (sel.value === null || sel.value === undefined || sel.value === '') {
    return item;
  }
  return {
    ...item,
    selected: {
      value: Math.round(Number(sel.value)),
      scale: sel.scale === 'lbs' ? 'lbs' : 'kg',
    },
  };
};
