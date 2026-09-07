# Phase 3 実施記録 — サイトのブランド変更

対象: `margherita-works-domain-migration-plan.md` Phase 3
前提: Phase 0（調査）/ Phase 1（ドメイン取得・DNSSECは保留）/ Phase 2（GitHub Pages側の事前変更）完了済み

## 表示文言の変更

| 箇所 | 変更前 | 変更後 |
|---|---|---|
| `src/components/Header.tsx` ワードマーク | `KOHEI ISHIKAWA / PORTFOLIO HUB` | `KOHEI ISHIKAWA / MARGHERITA WORKS` |
| `src/components/Footer.tsx` 著作権表示 | `© {year} Kohei Ishikawa` | `© {year} Margherita Works by Kohei Ishikawa`（年は動的のまま） |
| `src/data/projects.ts` の `portfolio-hub` プロジェクト表示名 | `Portfolio Hub` (ja/en共通) | `Margherita Works` (ja/en共通) |

## メタデータの変更

| 箇所 | 変更前 | 変更後 |
|---|---|---|
| `index.html` `<title>` | `Kohei Ishikawa Portfolio Hub — Apps, Websites & Tools` | `Margherita Works — Apps, Websites & Tools` |
| `index.html` `og:title` | 同上 | 同上（新表記に統一） |
| `index.html` schema.org `WebSite.name` | `Kohei Ishikawa Portfolio Hub` | `Margherita Works` |
| `index.html` `og:image` / schema `url` | 旧ドメイン | `https://margheritaworks.com/...`（Phase 2で対応済み） |
| `src/i18n/translations.ts` `meta.title`（ja） | `Kohei Ishikawa Portfolio Hub — つくったアプリと、その使いどころ` | `Margherita Works — つくったアプリと、その使いどころ` |
| `src/i18n/translations.ts` `meta.title`（en） | `Kohei Ishikawa Portfolio Hub — Apps, Websites & Tools` | `Margherita Works — Apps, Websites & Tools` |
| `src/pages/ProjectDetail.tsx` の詳細ページタイトル組み立て | `` `${name} — Kohei Ishikawa Portfolio Hub` `` | `` `${name} — Margherita Works` `` |

`meta description`（ja/en）はもともと `Portfolio Hub` という文字列を含んでいなかったため変更していません。canonical URL / hreflang / og:url は `src/i18n/LanguageProvider.tsx` と `src/i18n/seo.ts` が `window.location.origin` と Vite の `BASE_URL` から動的に組み立てる設計のため、Phase 2 で `base` をルートにした時点で自動的に新ドメイン基準になります（コード変更不要、既存設計のまま）。

## OG画像の再生成

`public/og.png` に `PORTFOLIO HUB` という文字が直接焼き込まれていたため、これはメタデータ更新だけでは直らない実体のある画像でした。

- 元画像のレイアウト・配色・比率を実測して再現:
  - 背景 `#FAFAFA`
  - 見出し 2行（元: `PORTFOLIO` / `HUB`）を `MARGHERITA` / `WORKS` に差し替え、色 `#18181C`、太字グロテスクサンセリフ
  - アクセントバー `#5B57D6`（元画像から実測した色をそのまま使用）
  - サブタイトル `Apps, Websites & Tools`（`#4A4A52`、変更なし・据え置き）
  - 著者名 `Kohei Ishikawa`（`#8A8A92`、変更なし・据え置き）
- フォントはサイト本体で使っている Archivo ではなく、環境にあった DejaVu Sans Bold で再現しています（グロテスクサンセリフとして近い印象ですが完全一致ではありません）。
- レイアウト座標は元画像の実ピクセルを計測して踏襲しており、機械的なテキスト差し替えです。新規のロゴデザインやクリエイティブな作り直しはしていません。

## 意図的に今回は変更していないもの（要確認・要判断）

- **`public/favicon.svg`**: 抽象的な3本バーのマーク（`Portfolio Hub` という文字は含まれていない）。ブランド名を直接表しているわけではないため、今回はそのまま残しています。`Margherita Works` 用に専用のロゴ/ファビコンを新しく作る場合は、デザインの意思決定が必要なためこちらでは判断していません。
- **Heroの本文（`hero.headline` / `hero.body`）**: 計画書は「必要に応じて」次のタグライン使用を提案していました。
  ```
  ja: 小さな工夫を、便利なプロダクトに。
  en: Small ideas, useful products.
  ```
  既存のHero文章（`APPS, WEBSITES & TOOLS.` + 本文）はすでに具体的で高品質、かつブランド名を含んでいなかったため、今回は変更していません。デザインを全面変更しないというClaudeへの実行指示（計画書13章 #4）に沿った判断です。このタグラインを使いたい場合は、どこに配置するか（Heroのサブテキスト、About、Footerなど）を別途指示してください。
- **`Footer.tsx` の `CONTACT_EMAIL = 'kouhei10@gmail.com'`**: このアドレスは環境情報として渡されている連絡先（`kouhei1@gmail.com`）と綴りが異なります。既存サイトの実装のままで、今回のブランド/ドメイン変更とは無関係な既存の値のため変更していません。意図した別アドレスなのか、誤字なのかをご確認ください。
- **`src/i18n/LanguageProvider.tsx` の `localStorage` キー `'portfolio-hub.lang'`**: URLではなくブラウザ内保存キーのため動作に影響しません。改名すると既存訪問者の言語設定が一度リセットされるため、Phase 2の記録同様、今回は据え置いています。
- **`README.md` / `CLAUDE.md` 内の `Portfolio Hub` 表記**: 計画書の構成上、これらはPhase 9（GitHub全体の更新）で扱う項目のため、Phase 3では変更していません。

## 検証結果

- `npm run typecheck` ✅ / `npm run build` ✅
- ビルド成果物 (`dist/assets/*.js`, `dist/index.html`) を文字列検索し、`Portfolio Hub` / `PORTFOLIO HUB` の表示文言が残っていないことを確認。`portfolio-hub`（小文字・ハイフン区切り）は意図した4箇所のみ残存（プロジェクトの `id`、`localStorage` キー、GitHubリポジトリURL、スクリーンショットのファイル名参照）— これらはURLやIDであり表示文言ではないため対象外。
- `Margherita Works` / `MARGHERITA WORKS` がビルド済みJSと`index.html`に出力されていることを確認。

## Phase 3 完了状況

- [x] `Portfolio Hub` を公開画面では `Margherita Works` に変更
- [x] 日本語・英語のヘッダー、フッター、ページタイトルを更新
- [ ] Heroの説明文差し替え → 意図的に見送り（上記参照、必要なら追加指示を）
- [x] フッターの著作権表示を `© {year} Margherita Works by Kohei Ishikawa` に更新
- [x] `<title>` 更新
- [x] meta description 確認（変更不要と判断）
- [x] OGの `og:title` / `og:image` 更新、`og:url` は動的生成のため対応不要
- [x] canonical URL（動的生成のため対応不要、Phase 2のbase変更で自動追従）
- [x] robots.txt / sitemap.xml（Phase 2で対応済み）
- [x] manifest.webmanifest（存在しないため対象外）
- [x] 構造化データ（JSON-LD）の名称・URL更新
- [x] faviconとOG画像 → OG画像は再生成済み、faviconは意図的に据え置き（上記参照）
- [x] 旧名称 `Portfolio Hub` が公開画面・ビルド成果物に残っていないことを確認
- [x] サポート連絡先・プライバシーポリシー確認 → このリポジトリ自体には専用のプライバシー/サポートページが存在せず、各アプリ側で管理されているため対象外（Phase 0調査記録の通り）
- [x] 法人と誤認させる表現がないことを確認（Header/Footerとも個人名+ブランド名の併記のみ）
