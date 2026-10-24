import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../src/data/projects';
import { languages, ui } from '../src/i18n/translations';
import type { Lang } from '../src/types';
// vite build --ssr src/entry-server.tsx --outDir dist-ssr の出力（package.json の build を参照）
import { render } from '../dist-ssr/entry-server.js';

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
 *
 * head（title / description / canonical / hreflang / OGP）に加えて、本文も
 * entry-server.tsx の render()（renderToString + StaticRouter）で書き出し、
 * <div id="root"> に埋め込む。ブラウザ側は main.tsx の hydrateRoot で引き継ぐ。
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
  // 置換文字列の $ を特別扱いさせないため、関数で渡す
  const body: string = render(r.urlPath);
  html = html.replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);

  const outPath = path.join(distDir, r.filePath);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

// 404.html: 一覧に無い住所（/ja/ など）でも SPA をそのまま描画する（HTTP は 404 のまま）。
// 以前の「?/path に退避して index.html に戻す」方式は、index.html を「/」の転送ページにしたため使わない。
const notFoundHtml = template.replace(
  '</head>',
  '    <meta name="robots" content="noindex" />\n  </head>'
);
writeFileSync(path.join(distDir, '404.html'), notFoundHtml);

// index.html（「/」）: /ja へ転送するだけのページ。GitHub Pages はサーバー側の 301 を設定できないため、
// 即時の meta refresh（Google は恒久的な転送として扱う）と canonical で /ja を正とする。
// 言語の自動判定はしない（Googlebot が英語環境のため「/」が英語版として登録されていた）。
const verification = template.match(/<meta name="google-site-verification"[^>]*>/)?.[0] ?? '';
const redirectHtml = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(ui.ja.meta.title)}</title>
    <meta name="description" content="${escapeHtml(ui.ja.meta.description)}" />
    ${verification}
    <link rel="canonical" href="${SITE_URL}/ja" />
    <link rel="alternate" hreflang="ja" href="${SITE_URL}/ja" />
    <link rel="alternate" hreflang="en" href="${SITE_URL}/en" />
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/ja" />
    <meta http-equiv="refresh" content="0; url=/ja" />
    <script>location.replace('/ja' + location.search + location.hash);</script>
  </head>
  <body>
    <p><a href="/ja">Margherita Works</a></p>
  </body>
</html>
`;
writeFileSync(path.join(distDir, 'index.html'), redirectHtml);

console.log(`prerender: ${routes.length} pages + 404.html + index.html (→ /ja) written`);
