import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { type Locale, i18nConfig } from "@/lib/i18n";
import { TranslationProvider } from "@/components/TranslationProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Zenticare",
    description: "Your trusted medical SaaS platform",
    icons: {
        icon: "/Z-logo-TransparetICO.ico",
    },
};

export async function generateStaticParams() {
    return i18nConfig.locales.map((locale) => ({ lang: locale }));
}

interface RootLayoutProps {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}

export default async function RootLayout({
    children,
    params,
}: RootLayoutProps) {
    const { lang: langParam } = await params;
    // Validate and fallback to default locale if unsupported
    const lang = (i18nConfig.locales as readonly string[]).includes(langParam)
        ? (langParam as Locale)
        : i18nConfig.defaultLocale;
    const dictionary = await getDictionary(lang);

    return (
        <html lang={lang} suppressHydrationWarning>
            <head>
                <link
                    rel="preload"
                    href="/notificationChat.MP3"
                    as="audio"
                    type="audio/mpeg"
                />
                {/* hreflang tags for SEO */}
                {i18nConfig.locales.map((locale) => (
                    <link
                        key={locale}
                        rel="alternate"
                        hrefLang={locale}
                        href={`/${locale}`}
                    />
                ))}
                <link rel="alternate" hrefLang="x-default" href="/en" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ClerkProvider dynamic>
                    <ConvexClientProvider>
                        <TranslationProvider dictionary={dictionary} locale={lang}>
                            {children}
                        </TranslationProvider>
                    </ConvexClientProvider>
                    <Toaster />
                </ClerkProvider>
            </body>
        </html>
    );
}
