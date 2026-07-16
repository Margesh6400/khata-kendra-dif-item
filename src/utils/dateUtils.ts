import { format } from 'date-fns';

/**
 * Parses a date string safely to local time to prevent timezone shift bugs.
 * If the input string is a date-only string (e.g. YYYY-MM-DD), it parses it
 * in the local timezone. Otherwise, it falls back to standard Date parsing.
 */
export const safeParseLocalDate = (dateStr: string | Date | undefined | null): Date => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // If it's a full ISO string with timezone or time (contains T or space + time), parse normally
  if (dateStr.includes('T') || (dateStr.includes(' ') && dateStr.split(' ')[1].includes(':'))) {
    return new Date(dateStr);
  }
  
  // Try splitting by hyphen for YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }

  // Try splitting by slash for DD/MM/YYYY
  const slashParts = dateStr.split('/');
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10) - 1;
    const year = parseInt(slashParts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }

  return new Date(dateStr);
};

/**
 * Formats a date string or Date object safely in the local timezone.
 */
export const formatLocalDate = (dateStr: string | Date | undefined | null, formatStr: string): string => {
  try {
    const date = safeParseLocalDate(dateStr);
    return format(date, formatStr);
  } catch (e) {
    console.error('Error formatting local date:', e);
    return '';
  }
};
