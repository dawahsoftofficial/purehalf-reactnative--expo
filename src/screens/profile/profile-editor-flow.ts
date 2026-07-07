/* eslint-disable @typescript-eslint/no-explicit-any */

export type ProfileEditorField = {
  id?: string;
  title?: string;
  type?: string;
  data?: any[];
  selected?: any;
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
  title: string,
  activeIndex: number,
  total: number
) => {
  const safeTotal = Math.max(total, 0);
  const safeIndex = safeTotal
    ? Math.min(Math.max(activeIndex, 0), safeTotal - 1)
    : 0;
  return `${title} - ${safeTotal ? safeIndex + 1 : 0} of ${safeTotal}`;
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

export const shouldUseTagOptions = (
  item: ProfileEditorField,
  options: any[] = []
) => {
  if (item?.type === 'dropDownBinary') return options.length >= 2;
  return (
    item?.type === 'dropDown' && options.length >= 2 && options.length <= 5
  );
};
