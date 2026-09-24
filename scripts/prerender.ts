import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../src/data/projects';
import { languages, ui } from '../src/i18n/translations';
import type { Lang } from '../src/types';

/**
 * GitHub Pages は静的ホストで、SPAの直接URL（/ja, /ja/projects/xxx など）に
 * 実ファイルが無いと生のHTTP 404を返す（404.html の中の client-side redirect は
 * ステータスコードには影響しない）。Googleのインデックス処理はHTTPステータスを
 * 優先するため、これがそのままインデックス未登録の原因になっていた。
 *
 * このスクリプトは vite build 後に実行し、各正規URLに対応する実ファイルを
 * dist/ 以下に生成する。ファイル名は「GitHub Pagesが末尾スラッシュへの301
 * リダイレクトを発生させない」ように、ディレクトリ+index.htmlではなく
 * 拡張子なしURLに対応する *.html ファイル（例: /ja -> dist/ja.html）にする。
 */

const SITE_URL = 'https://margheritaworks.com';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(root, 'dist');
const template = readFileSync(path.join(distDir, 'index.html'), 'utf-8');

interface Route {
  lang: Lang;
  urlPath: string;
  filePath: string;
  title: string;
  description: string;
}

const routes: Route[] = [];

for (const lang of languages) {
  routes.push({
    lang,
    urlPath: `/${lang}`,
    filePath: `${lang}.html`,
    title: ui[lang].meta.title,
    description: ui[lang].meta.description,
  });

  for (const p of projects) {
    if (!p.hasDetailPage) continue;
    routes.push({
      lang,
      urlPath: `/${lang}/projects/${p.id}`,
      filePath: path.join(lang, 'projects', `${p.id}.html`),
      // Home.tsx / ProjectDetail.tsx の useSeo() 呼び出しと同じ組み立て方にすること
      title: `${p.name[lang]} — Margherita Works`,
      description: p.description[lang],
    });
  }
}

const altUrl = (urlPath: string, targetLang: Lang) =>
  `${SITE_URL}/${targetLang}${urlPath.replace(/^\/(ja|en)/, '')}`;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function setMetaContent(html: string, attr: 'name' | 'property', key: string, content: string): string {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  return html.replace(re, `$1${escapeHtml(content)}$2`);
}

for (const r of routes) {
  const canonical = `${SITE_URL}${r.urlPath}`;

  let html = template;
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${r.lang}"`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(r.title)}</title>`);
  html = setMetaContent(html, 'name', 'description', r.description);
  html = setMetaContent(html, 'property', 'og:title', r.title);
  html = setMetaContent(html, 'property', 'og:description', r.description);
  html = setMetaContent(html, 'name', 'twitter:title', r.title);
  html = setMetaContent(html, 'name', 'twitter:description', r.description);

  const headExtra = [
    `<meta property="og:url" content="${canonical}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" hreflang="ja" href="${altUrl(r.urlPath, 'ja')}" />`,
    `<link rel="alternate" hreflang="en" href="${altUrl(r.urlPath, 'en')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${altUrl(r.urlPath, 'ja')}" />`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${headExtra}\n  </head>`);

  const outPath = path.join(distDir, r.filePath);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

console.log(`prerender: ${routes.length} pages written`);
