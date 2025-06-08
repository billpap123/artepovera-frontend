// src/utils/formatDate.ts

/**
 * Formats a date string into a more readable format (e.g., "Jun 8, 2025").
 * Gracefully handles null, undefined, or invalid date strings.
 * @param dateString The date string to format (e.g., an ISO string from your backend).
 * @returns A formatted date string like "Jun 8, 2025", or a fallback string like "Date unknown".
 */
export const formatDate = (dateString: string | undefined | null): string => {
    // Return a fallback if the dateString is null, undefined, or empty
    if (!dateString) {
      return 'Date unknown';
    }
  
    try {
      const date = new Date(dateString);
  
      // An invalid date's time is NaN (Not-a-Number). This is a reliable check.
      if (isNaN(date.getTime())) {
        console.warn(`formatDate received an invalid date string: ${dateString}`);
        return 'Invalid Date';
      }
  
      // If the date is valid, format it and return it.
      // 'undefined' for locales uses the browser's default locale.
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short', // e.g., "Jun"
        day: 'numeric',
      });
    } catch (e) {
      // This catch block is a safeguard for any other unexpected errors.
      console.error("Error parsing date in formatDate function:", dateString, e);
      return 'Invalid Date';
    }
  };