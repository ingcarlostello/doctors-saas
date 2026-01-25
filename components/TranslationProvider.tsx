"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary, Locale, TranslationContextValue } from "@/lib/i18n";

const TranslationContext = createContext<TranslationContextValue | null>(null);

interface TranslationProviderProps {
    children: ReactNode;
    dictionary: Dictionary;
    locale: Locale;
}

export function TranslationProvider({
    children,
    dictionary,
    locale,
}: TranslationProviderProps) {
    const setLocale = (newLocale: Locale) => {
        // Navigate to the new locale
        const currentPath = window.location.pathname;
        const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}/, "");
        window.location.href = `/${newLocale}${pathWithoutLocale || ""}`;
    };

    return (
        <TranslationContext.Provider value={{ dictionary, locale, setLocale }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);

    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }

    return context;
}

// Helper hook to get a specific namespace
export function useNamespace<K extends keyof Dictionary>(namespace: K) {
    const { dictionary, locale, setLocale } = useTranslation();
    return {
        t: dictionary[namespace],
        locale,
        setLocale,
    };
}
