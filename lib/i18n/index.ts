// Client-safe exports only - no server-only imports
export { i18nConfig, isValidLocale, getLocaleFromPath, removeLocaleFromPath } from './config';
export type { Locale } from './config';
export type {
    Dictionary,
    CommonDictionary,
    LandingDictionary,
    DashboardDictionary,
    PatientsDictionary,
    CalendarDictionary,
    ChatDictionary,
    TranslationContextValue
} from './types';

// Note: getDictionary is exported from './dictionaries' and should only be 
// imported in Server Components. It's intentionally NOT re-exported here.
