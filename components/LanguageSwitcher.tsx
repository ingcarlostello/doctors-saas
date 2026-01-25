"use client";

import { useTranslation } from "@/components/TranslationProvider";
import { i18nConfig, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const { locale, setLocale } = useTranslation();

    const handleLocaleChange = (newLocale: Locale) => {
        // Set cookie for persistence
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
        setLocale(newLocale);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {i18nConfig.localeFlags[locale]} {i18nConfig.localeNames[locale]}
                    </span>
                    <span className="sm:hidden">{i18nConfig.localeFlags[locale]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {i18nConfig.locales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                        className={locale === loc ? "bg-accent" : ""}
                    >
                        <span className="mr-2">{i18nConfig.localeFlags[loc]}</span>
                        {i18nConfig.localeNames[loc]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
