import 'server-only';
import type { Locale } from './config';
import type { Dictionary } from './types';

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
    en: () => import('@/public/locales/en/index').then((module) => module.default),
    es: () => import('@/public/locales/es/index').then((module) => module.default),
    pt: () => import('@/public/locales/pt/index').then((module) => module.default),
    fr: () => import('@/public/locales/fr/index').then((module) => module.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
    const loadDictionary = dictionaries[locale];

    if (!loadDictionary) {
        // Fallback to English if locale is not found
        return dictionaries.en();
    }

    return loadDictionary();
}
