import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Lang } from '../types';
import { ui, type UI } from './translations';

const STORAGE_KEY = 'portfolio-hub.lang';

type Ctx = { lang: Lang; t: UI; setLang: (l: Lang) => void; path: (p?: string) => string };

const LanguageContext = createContext<Ctx | null>(null);

export const detectLang = (): Lang => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'ja' || saved === 'en') return saved;
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { lang: param } = useParams();
  const lang: Lang = param === 'en' ? 'en' : 'ja';
  const navigate = useNavigate();
  const location = useLocation();
  const t = ui[lang];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;

    // title / description / og:title / og:description は各ページの useSeo() が設定する

    // hreflang: ja/en を同じページ同士で関連付ける
    const origin = window.location.origin;
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const restPath = location.pathname.replace(/^\/(ja|en)/, '');
    const urlFor = (l: Lang) => origin + base + '/' + l + restPath;

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      const el = document.querySelector(`meta[${attr}="${key}"]`);
      if (el) el.setAttribute('content', content);
    };
    setMeta('property', 'og:url', urlFor(lang));

    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
      let el = document.querySelector<HTMLLinkElement>(selector);
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        if (hreflang) el.hreflang = hreflang;
        document.head.appendChild(el);
      }
      el.href = href;
    };
    setLink('canonical', urlFor(lang));
    setLink('alternate', urlFor('ja'), 'ja');
    setLink('alternate', urlFor('en'), 'en');
    setLink('alternate', urlFor('ja'), 'x-default');
  }, [lang, location.pathname]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      t,
      // 同じページのまま言語だけ差し替える
      setLang: (next: Lang) => {
        localStorage.setItem(STORAGE_KEY, next);
        const rest = location.pathname.replace(/^\/(ja|en)/, '');
        navigate('/' + next + rest, { replace: true });
      },
      path: (p = '') => '/' + lang + (p ? '/' + p.replace(/^\//, '') : ''),
    }),
    [lang, t, location.pathname, navigate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
