export type ProfileInfoItem = {
  selected?: {
    value?: number | string;
  };
};

export const hasRealProfileValue = (item: ProfileInfoItem): boolean => {
  const value = item?.selected?.value;
  return (
    typeof value === 'number' ||
    (typeof value === 'string' && value.length !== 0)
  );
};
