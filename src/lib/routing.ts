import { defaultLang, type Lang } from '@/i18n/ui';

const rawBase = import.meta.env.BASE_URL ?? '/';
export const basePath = rawBase === '/' ? '' : rawBase.replace(/\/$/, '');

export function href(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function localizedHref(path: string, lang: Lang): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return href(normalized);
  return href(normalized === '/' ? '/en/' : `/en${normalized}`);
}

export function stripBase(pathname: string): string {
  if (basePath && pathname.startsWith(basePath)) {
    const rest = pathname.slice(basePath.length);
    return rest === '' ? '/' : rest;
  }
  return pathname;
}

export function switchLang(pathname: string, lang: Lang): string {
  const path = stripBase(pathname);
  const withoutLocale =
    path === '/en' || path === '/en/' ? '/' : path.startsWith('/en/') ? path.slice(3) : path;
  return localizedHref(withoutLocale, lang);
}
