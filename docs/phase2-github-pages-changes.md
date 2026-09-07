# Phase 2 実施記録 — GitHub Pages側の事前変更

対象: `margherita-works-domain-migration-plan.md` Phase 2
前提: [Phase 0 調査記録](./phase0-migration-audit.md) / [Phase 1 手順書](./phase1-cloudflare-domain-setup.md)（ドメイン取得完了・DNSSECは未有効化のまま保留）

## 変更内容

| ファイル | 変更 |
|---|---|
| `vite.config.ts` | `base` のデフォルトを `/portfolio-hub/` → `/` に変更（独自ドメインのルート配信用） |
| `public/404.html` | SPAフォールバックの `segments` を `1` → `0` に変更 |
| `public/CNAME`（新規） | 1行のみ: `margheritaworks.com` |
| `index.html` | `og:image`、schema.org `url` を `https://isitest1.github.io/portfolio-hub/...` → `https://margheritaworks.com/...` に更新 |
| `public/robots.txt` | `Sitemap:` を新ドメインへ更新 |
| `scripts/generate-sitemap.ts` | `SITE_URL` 定数を新ドメインへ更新 |
| `src/components/Shot.tsx` | コメント中の古いbaseパス言及を修正（動作に影響する変更ではない） |

このアプリはもともと `import.meta.env.BASE_URL` と `window.location.origin` を基準にルーター (`App.tsx`)・画像パス (`Shot.tsx`)・canonical/hreflang/OGP (`LanguageProvider.tsx`, `seo.ts`) を組み立てる設計になっていたため、`base` を `/` に変えるだけでこれらは自動的にルート基準・新ドメイン基準に追従する。個別のコンポーネント修正は不要だった。

## 意図的に今回は変更していないもの

- `src/i18n/LanguageProvider.tsx` の `localStorage` キー `'portfolio-hub.lang'` — URLではなくブラウザ内保存キーのため、動作に影響しない。ブランド統一のため改名する場合はPhase 3以降で判断（改名すると既存訪問者の保存済み言語設定が一度リセットされる点に注意）。
- `package.json` の `"name": "portfolio-hub"` — npmパッケージ名であり公開URLには影響しない。リポジトリ名・GitHub About欄の変更はPhase 9で扱う。

## 検証結果

- `npm run typecheck` → エラーなし
- `npm run build` → 成功（`sitemap.xml: 24 URLs`）
- `dist/` の内容を確認:
  - `dist/CNAME` に `margheritaworks.com` が出力されている（`public/` はViteが自動的に`dist`直下へコピーするため、`.github/workflows/deploy.yml` の `actions/upload-pages-artifact@v3` がそのまま `dist` をアップロードする現行構成で自動的に含まれる。ワークフロー自体の変更は不要）
  - `dist/index.html` の `<script src>` / `<link href>` が `/assets/...` とルート絶対パスで出力されている
  - `dist/sitemap.xml` / `dist/robots.txt` が新ドメイン基準になっている
- `npm run preview` でローカル確認:
  - `/`, `/ja`, `/en`, `/ja/projects/needsoon`, `/en/projects/xcode-sentinel` → いずれも200
  - `/assets/index-*.js`, `/sitemap.xml`, `/robots.txt`, `/CNAME` → いずれも200
  - コンソール/ネットワークエラーなし（外部リクエストはGoogle Fontsのみで、いずれもHTTPS）
- 注意: `vite preview` はSPAフォールバックとして未知のパスにも200で `index.html` を返すため、GitHub Pages実環境での「本当の404 → `public/404.html` のJSリダイレクト」という挙動はこの場ではシミュレートできていない。この検証は独自ドメイン接続後（Phase 4完了後）に実URLで行う必要がある。

## Phase 2 完了状況

- [x] `vite.config.ts` の `base` を `/` に変更
- [x] `public/404.html` のSPAフォールバック確認・`segments` を `0` に変更
- [x] ハードコードされた `/portfolio-hub/`（URLとして意味を持つもの）を検索・修正
- [x] アセット・画像・JS・CSSパスがルート基準で解決されることを確認
- [x] `public/CNAME` を追加（内容: `margheritaworks.com` のみ）
- [x] GitHub Actionsの成果物にCNAMEが含まれることを確認（`dist/CNAME` を実ビルドで確認済み）
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] ローカルプレビューで `/ja/`、`/en/`、詳細ページ、存在しないURLを確認
- [x] 開発者ツール相当の確認（curlでのステータスコード・レスポンス確認、外部リクエストの洗い出し）— 実ブラウザでのコンソール確認は未実施

## 未コミットの変更

現時点ではすべてワーキングツリー上の変更で、コミットはしていません。この状態で `git status` は以下の通りです。

```
 M index.html
 M public/404.html
 M public/robots.txt
 M scripts/generate-sitemap.ts
 M src/components/Shot.tsx
 M vite.config.ts
?? docs/
?? public/CNAME
```

**重要**: `public/CNAME` を追加した状態で `main` にマージ・pushすると、次のデプロイでGitHub PagesのCustom Domainがこの値で上書きされる可能性がある。Phase 4（GitHubの所有権確認・DNS接続）の準備が整うまでは、このブランチをmainにマージ/pushしないこと。
