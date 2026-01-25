export const i18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt', 'fr'] as const,
    localeNames: {
        en: 'English',
        es: 'Español',
        pt: 'Português',
        fr: 'Français',
    },
    localeFlags: {
        en: '🇺🇸',
        es: '🇪🇸',
        pt: '🇧🇷',
        fr: '🇫🇷',
    },
} as const;

export type Locale = (typeof i18nConfig.locales)[number];

export function isValidLocale(locale: string): locale is Locale {
    return i18nConfig.locales.includes(locale as Locale);
}

export function getLocaleFromPath(pathname: string): Locale {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && isValidLocale(firstSegment)) {
        return firstSegment;
    }

    return i18nConfig.defaultLocale;
}

export function removeLocaleFromPath(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && isValidLocale(firstSegment)) {
        return '/' + segments.slice(1).join('/') || '/';
    }

    return pathname;
}
