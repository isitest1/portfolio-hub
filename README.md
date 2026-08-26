# Portfolio Hub

個人開発のiPhoneアプリ・Webアプリ・ツールをまとめるポートフォリオサイト。デザイン方向は "Grid Poster"（大きなグロテスク見出し + カテゴリ3列グリッド）。

- React 18 + TypeScript + Vite
- 日本語 / 英語（`/ja/`, `/en/`）
- GitHub Pages + GitHub Actions で公開

## 開発（Dev Container）

VS Code で `Dev Containers: Reopen in Container`。

```bash
npm run dev -- --host 0.0.0.0
npm run build
npm run typecheck
```

## 構成

```
src/
  components/   UI（文章は持たない）
  data/projects.ts    プロジェクト情報（ja / en）
  i18n/               translations.ts + LanguageProvider
  pages/              Home / ProjectDetail / NotFound
  styles/global.css
public/         favicon, robots.txt, 404.html(SPA fallback)
```

## プロジェクトの追加

`src/data/projects.ts` に1件追加するだけ。コンポーネントの修正は不要。

- 実在する URL のキーだけ書く（`appStoreUrl` などが無ければリンクは描画されない）
- `featured: true` で Featured セクションに出る
- `hasDetailPage: true` で `/ja/projects/<id>` の詳細ページが有効になる
- 画像は `public/projects/` に置き `screenshots: ['/projects/xxx.png']`（未設定ならプレースホルダ表示）

## GitHub Pages

1. `vite.config.ts` の `base` をリポジトリ名に合わせる（例 `/portfolio-hub/`）。ユーザーページなら `'/'`。
2. `base` を `'/'` にした場合は `public/404.html` の `segments` を `0` にする。
3. リポジトリ Settings → Pages → Source を **GitHub Actions** に。
4. `main` に push すると `.github/workflows/deploy.yml` がデプロイ。

## 言語の決定順

1. URL（`/ja/` `/en/`）→ 2. localStorage → 3. ブラウザ設定 → 4. `ja`

言語切替は現在のパスを保ったまま `/ja/projects/x` ↔ `/en/projects/x` を入れ替えます。

## TODO

- `src/data/projects.ts` の URL（App Store / Website / Support / GitHub）を実際の値に差し替える
- `public/projects/` にアイコンとスクリーンショットを追加
- OG 画像（`public/og.png`）と `index.html` の `og:image` / `og:url`
