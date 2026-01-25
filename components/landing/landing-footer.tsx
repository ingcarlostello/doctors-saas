"use client";

import { useNamespace } from "@/components/TranslationProvider";

export function LandingFooter() {
  const { t } = useNamespace("common");

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">Z</span>
            </div>
            <span className="text-lg font-semibold">Zenticare</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              {t.footer.privacyPolicy}
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              {t.footer.termsOfService}
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
