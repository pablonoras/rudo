import { addDays, format, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// Type for supported locales
export type SupportedLocale = 'en' | 'es';

// Get the appropriate locale object for date-fns
const getDateFnsLocale = (locale: SupportedLocale) => {
  switch (locale) {
    case 'es':
      return es;
    case 'en':
    default:
      return undefined; // date-fns uses English by default
  }
};

// Localized format function
export const formatLocalized = (date: Date, formatString: string, locale: SupportedLocale = 'en'): string => {
  const localeObj = getDateFnsLocale(locale);
  return format(date, formatString, localeObj ? { locale: localeObj } : {});
};

// Common date formatting utilities
export const formatDayName = (date: Date, locale: SupportedLocale = 'en'): string => {
  return formatLocalized(date, 'EEE', locale);
};

export const formatFullDayName = (date: Date, locale: SupportedLocale = 'en'): string => {
  return formatLocalized(date, 'EEEE', locale);
};

export const formatMonthYear = (date: Date, locale: SupportedLocale = 'en'): string => {
  return formatLocalized(date, 'MMMM yyyy', locale);
};

export const formatMonthDay = (date: Date, locale: SupportedLocale = 'en'): string => {
  return formatLocalized(date, 'MMMM d', locale);
};

export const formatMonthDayYear = (date: Date, locale: SupportedLocale = 'en'): string => {
  return formatLocalized(date, 'MMMM d, yyyy', locale);
};

export const formatFullDateWithDay = (date: Date, locale: SupportedLocale = 'en'): string => {
  return formatLocalized(date, 'EEEE, MMMM d', locale);
};

// Re-export common date utilities that don't need localization
export { addDays, isToday, startOfWeek };
