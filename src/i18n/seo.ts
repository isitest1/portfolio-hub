import { useEffect } from 'react';

/** public/ 配下の絶対パスや相対パスから、GitHub Pages の base を含む絶対URLを作る */
export function absoluteUrl(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return window.location.origin + base + (pathname.startsWith('/') ? pathname : '/' + pathname);
}

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  const el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) el.setAttribute('content', content);
};

/** ページごとの title / description / OGP を設定する（呼び出したページが優先される） */
export function useSeo(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
  }, [title, description]);
}

/** JSON-LD 構造化データを <head> に追加する。json が null のときは何も出さない */
export function useJsonLd(json: string | null) {
  useEffect(() => {
    if (!json) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = json;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [json]);
}
