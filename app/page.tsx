import { redirect } from 'next/navigation';
import { i18nConfig } from '@/lib/i18n';

// This page should not be accessible - middleware handles redirect
// This is a fallback in case middleware doesn't catch it
export default function RootPage() {
  redirect(`/${i18nConfig.defaultLocale}`);
}
