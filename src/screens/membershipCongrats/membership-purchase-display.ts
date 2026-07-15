const groupThousands = (value: number): string => {
  const [integer, decimal] = String(value).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decimal ? `${grouped}.${decimal}` : grouped;
};

export const formatMembershipAmount = ({
  amount,
  localizedPrice,
  currencyCode,
}: {
  amount: number | string;
  localizedPrice?: string | null;
  currencyCode?: string | null;
}): string => {
  const localized = localizedPrice?.trim();
  if (localized) return localized;

  const numericAmount = Number(amount);
  const formattedAmount = Number.isFinite(numericAmount)
    ? groupThousands(numericAmount)
    : String(amount);
  const currency = currencyCode?.trim().toUpperCase() || 'PKR';

  return `${currency} ${formattedAmount}`;
};
