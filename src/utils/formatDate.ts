// src/utils/formatDate.ts
export const formatDate = (
  dateString: string | undefined | null,
  pattern: 'dd/mm/yyyy' | 'yyyy-mm-dd' = 'dd/mm/yyyy',
  useUTC = false // set true if your backend sends UTC-only dates and you want to avoid TZ shifts
): string => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const year  = useUTC ? d.getUTCFullYear()  : d.getFullYear();
  const month = (useUTC ? d.getUTCMonth()    : d.getMonth()) + 1; // 0-based
  const day   = useUTC ? d.getUTCDate()      : d.getDate();

  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yyyy = String(year);

  return pattern === 'yyyy-mm-dd' ? `${yyyy}-${mm}-${dd}` : `${dd}/${mm}/${yyyy}`;
};
