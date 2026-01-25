import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18nConfig, isValidLocale, type Locale } from "@/lib/i18n/config";

const isPublicRoute = createRouteMatcher([
  "/",
  "/:lang",
  "/:lang/",
]);

// Routes that should not be localized
const isIgnoredRoute = (pathname: string) => {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/trpc") ||
    pathname.includes(".") // static files
  );
};

function getLocaleFromHeaders(request: NextRequest): Locale {
  // Check for stored preference in cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get("Accept-Language");
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const [code, priority] = lang.trim().split(";q=");
        return {
          code: code.split("-")[0].toLowerCase(), // Get just the language code (e.g., 'en' from 'en-US')
          priority: priority ? parseFloat(priority) : 1,
        };
      })
      .sort((a, b) => b.priority - a.priority);

    for (const lang of languages) {
      if (isValidLocale(lang.code)) {
        return lang.code;
      }
    }
  }

  return i18nConfig.defaultLocale;
}

function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isValidLocale(firstSegment)) {
    return firstSegment;
  }

  return null;
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Skip locale handling for ignored routes
  if (isIgnoredRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameLocale = getLocaleFromPathname(pathname);

  // If no locale in pathname, redirect to localized version
  if (!pathnameLocale) {
    const locale = getLocaleFromHeaders(req);
    const newUrl = new URL(`/${locale}${pathname === "/" ? "" : pathname}`, req.url);

    const response = NextResponse.redirect(newUrl);
    // Set cookie for future requests
    response.cookies.set("NEXT_LOCALE", locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return response;
  }

  // Handle authentication after locale routing
  const { isAuthenticated } = await auth();

  // Remove locale from pathname for route matching
  const pathWithoutLocale = pathname.replace(`/${pathnameLocale}`, "") || "/";

  // Public routes (landing page)
  const isPublicPath = pathWithoutLocale === "/" || pathWithoutLocale === "";

  if (!isAuthenticated && !isPublicPath) {
    if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Redirect to localized landing page
    return NextResponse.redirect(new URL(`/${pathnameLocale}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
