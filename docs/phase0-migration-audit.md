# Phase 0 調査記録 — Margherita Works ドメイン移行

作成日: 2026-09-07
対象: `margherita-works-domain-migration-plan.md` Phase 0

## 0. 作業ブランチとロールバック基準点

- 作業ブランチ: `domain-migration-margheritaworks`（`main` から作成）
- 分岐元コミット（ロールバック時に戻す基準点）:
  ```
  553f9b8bb8a3aee232e7798820b2721f353d254d
  ```
  `git log -1` 日時: 2026-09-05 03:30:42 +0000
- ロールバック手順（このコミットまで戻す場合）:
  ```bash
  git checkout main
  git reset --hard 553f9b8bb8a3aee232e7798820b2721f353d254d   # main を巻き戻す場合のみ。通常は不要
  git branch -D domain-migration-margheritaworks               # 作業ブランチを破棄する場合
  ```
  DNS/Cloudflare/GitHub Pages側の切り戻しは計画書 12章のとおり別途実施する。
- 作業前の untracked ファイル: `margherita-works-domain-migration-plan.md`（この計画書自体。コミット対象は別途判断）。それ以外の未コミット変更なし。
- リポジトリ内に `AuthKey_3753922QBC.p8`（App Store Connect APIキー）が存在するが、`.gitignore` で `*.p8` として除外済みで、git履歴にも一度もコミットされていないことを確認済み。これは今回の移行作業の対象外。

## 1. 本番サイトの現状確認

- 公開URL: `https://isitest1.github.io/portfolio-hub/`
- `WebFetch` でルートURLの応答を確認済み。`<title>` は `Kohei Ishikawa Portfolio Hub — Apps, Websites & Tools` で、リポジトリの `index.html` と一致。サイトは正常に公開中。
- **画面キャプチャ（スクリーンショット画像）についての制約**: 本セッションにはブラウザ操作・画像スクリーンショットを取得するツールが利用できない。そのため「画面保存」はテキストベースの記録（本ファイル、および下記のURL・メタデータ一覧）で代替した。画像として保存したい場合は、以下のURLを実際のブラウザで開き、手動でスクリーンショットを保存することを推奨する。
  - `https://isitest1.github.io/portfolio-hub/`（ルート）
  - `https://isitest1.github.io/portfolio-hub/ja`
  - `https://isitest1.github.io/portfolio-hub/en`
  - 主要プロジェクト詳細ページ（例: `https://isitest1.github.io/portfolio-hub/ja/projects/needsoon`）
- 現行 `index.html` のメタデータ（変更前の記録として）:
  - title: `Kohei Ishikawa Portfolio Hub — Apps, Websites & Tools`
  - description: `個人で開発しているiPhoneアプリ・Webアプリ・ツールをまとめたポートフォリオ。`
  - og:image: `https://isitest1.github.io/portfolio-hub/og.png`
  - author: `Kohei Ishikawa` / email `kouhei10@gmail.com`（schema.org JSON-LD内。ユーザー本人のメールと表記が異なる可能性があるため、ブランド変更時に確認すること）
  - google-site-verification タグあり（ドメイン変更時はSearch Console側の再設定要）

## 2. `src/data/projects.ts` 全プロジェクト一覧（現状ママ）

| id | status | featured | detailページ | appStoreUrl | chromeWebStoreUrl | supportUrl | websiteUrl | githubUrl |
|---|---|---|---|---|---|---|---|---|
| needsoon | active | ✓ | ✓ | apps.apple.com/.../id6792124859 | – | isitest1.github.io/needsoon-support/ | – | – |
| workoutquest | active | ✓ | ✓ | apps.apple.com/.../id6790803132 | – | isitest1.github.io/workoutquest-site/ | – | – |
| furusato-cospa | active | ✓ | ✓ | – | chromewebstore.google.com/detail/mopedkejokejahoekdkfgccgiaicipld | – | furusato-cospa.kouhei1.workers.dev/ | – |
| textsnap | active | ✓ | ✓ | – | – | – | isitest1.github.io/TextSnap/ | github.com/isitest1/TextSnap |
| unit-price-scanner | active | – | ✓ | apps.apple.com/.../id6789856620 | – | isitest1.github.io/unitpricescanner-support/ | – | – |
| ensemble-stage | active | ✓ | ✓ | apps.apple.com/.../id6793795823 | – | isitest1.github.io/ensemble-stage-site/ | – | – |
| netagicho | active | – | ✓ | apps.apple.com/.../id6797323735 | – | isitest1.github.io/netagicho/ | – | – |
| photoslim | active | – | ✓ | apps.apple.com/.../id6802024030 | – | isitest1.github.io/photoslim-support/ | – | – |
| namecue | active | – | ✓ | apps.apple.com/.../id6791782983 | – | isitest1.github.io/NameCue/support.html | – | – |
| record-quick | coming-soon | – | – | – | – | isitest1.github.io/RecordQuick-site/ | – | – |
| rig-sketch | coming-soon | – | – | – | – | – | – | – |
| tube-player-for-safari | coming-soon | – | – | – | – | isitest1.github.io/tube-player-for-safari-site/ | – | – |
| copy-all-text | active | – | ✓ | apps.apple.com/.../id6805767687 | – | isitest1.github.io/copy-all-text-support/ | – | – |
| xcode-sentinel | active | – | ✓ | – | – | – | isitest1.github.io/XcodeSentinel/ | github.com/isitest1/XcodeSentinel |
| web-monitor-rss | active | – | – | – | – | – | – | github.com/isitest1/web-monitor-rss |
| text-compare | active | – | – | – | – | – | isitest1.github.io/text-compare/ | github.com/isitest1/text-compare |
| portfolio-hub | active | – | – | – | – | – | – | github.com/isitest1/portfolio-hub |

計17件。`hasDetailPage: true` は11件（needsoon, workoutquest, furusato-cospa, textsnap, unit-price-scanner, ensemble-stage, netagicho, photoslim, namecue, copy-all-text, xcode-sentinel）。

## 3. 現在の全公開URL一覧（サイト内ルート）

`vite.config.ts` の `base: '/portfolio-hub/'` と `scripts/generate-sitemap.ts` の `SITE_URL` に基づく現行サイトのURL構成:

```
https://isitest1.github.io/portfolio-hub/            （ルート、言語判定でja/enへ）
https://isitest1.github.io/portfolio-hub/ja
https://isitest1.github.io/portfolio-hub/en
https://isitest1.github.io/portfolio-hub/ja/projects/<id>   （detailページを持つ11件）
https://isitest1.github.io/portfolio-hub/en/projects/<id>   （同上）
https://isitest1.github.io/portfolio-hub/sitemap.xml
https://isitest1.github.io/portfolio-hub/robots.txt
https://isitest1.github.io/portfolio-hub/og.png
```

外部リンク（プロジェクトごと）は上記2章の表のとおり。

## 4. リポジトリ全文検索結果（該当ファイルと分類）

対象は `src/`, `public/`, `scripts/`, `index.html`, `README.md`, `package.json`, `vite.config.ts`, `.github/` （`node_modules`, `dist`, `.git`, `package-lock.json` は除外）。

### 4.1 `isitest1.github.io`（23件ヒット、うちコード内の主な参照）

分類:

- **サイト内リンク（自己参照・要ドメイン更新）**
  - `index.html:14` — `og:image`
  - `index.html:29` — schema.org `url`
  - `public/robots.txt:4` — `Sitemap:`
  - `scripts/generate-sitemap.ts:7` — `SITE_URL` 定数（sitemap生成のベースURL）
- **各プロジェクトのSupport URL（外部・別リポジトリ管理、Phase 3/5で個別判断）**
  - `src/data/projects.ts` 内、`isitest1.github.io/<repo>-support/` 系が9件（needsoon, workoutquest, unit-price-scanner, ensemble-stage, netagicho, photoslim, namecue, copy-all-text, record-quick, tube-player-for-safari）
- **各プロジェクトのWebsite/GitHub Pages URL（外部・別リポジトリ管理）**
  - `textsnap`, `xcode-sentinel`, `text-compare` の `websiteUrl`（それぞれ `isitest1.github.io/TextSnap/`, `isitest1.github.io/XcodeSentinel/`, `isitest1.github.io/text-compare/`）
- **コメント内の出典記載（コードではない）**
  - `src/data/projects.ts` 冒頭コメント（出典説明文）

### 4.2 `portfolio-hub`（24件ヒット）

- ビルド設定・自己参照: `vite.config.ts` の `base: '/portfolio-hub/'`、`scripts/generate-sitemap.ts` の `SITE_URL`、`package.json` の `"name": "portfolio-hub"`
- サイト内リンク: `index.html` の `og:image` / schema.org `url`、`public/robots.txt`
- プロジェクトデータ内: `projects.ts` の `id: 'portfolio-hub'` プロジェクト自体のGitHub URL、および上記 `isitest1.github.io/portfolio-hub/...` 系
- ドキュメント: `README.md`, `CLAUDE.md`（タイトル見出し、本文中の言及）

### 4.3 `Portfolio Hub` / ブランド表記（13件）

- 表示文言: `index.html` の `<title>`, `og:title`, schema.org `name`
- `src/i18n/translations.ts` の `title`（ja/en 両方、meta title用）
- `src/pages/ProjectDetail.tsx:16` — 詳細ページの `<title>` 組み立てに使用
- `src/data/projects.ts:376` — `portfolio-hub` プロジェクト自体の表示名（このサイト自身をプロジェクトとして紹介している行）
- `README.md`, `CLAUDE.md` の見出し・本文（ドキュメント）

### 4.4 `Kohei Ishikawa`（13件） / `石川 紘平`（0件、コード内では未使用）

- `index.html` の `<title>`, `meta author`, `og:title`, schema.org `author.name` / `author.email`
- `src/i18n/translations.ts` の meta title 文言（ja/en）
- `src/pages/ProjectDetail.tsx` の `<title>` 組み立てと schema.org `author`
- `src/components/Footer.tsx:8` — フッター著作権表示 `© {year} Kohei Ishikawa`
- 「石川 紘平」は現在コード内に一切登場しない（計画書内にのみ存在）。日本語ページのフッター等で運営者名を日本語表記にするかは Phase 3 で判断が必要。

### 4.5 `support` / `privacy`（28件・6件）

- `privacy` は現在コード内に**専用のプライバシーポリシーページや `privacyUrl` フィールドが存在しない**。`src/types/index.ts` に `privacyUrl` 相当のプロパティなし。各アプリのプライバシーポリシーは、各アプリの独立したSupportページ（外部）側で扱われている前提。
- `support` は `supportUrl`（型定義・データ・`ProjectLinks.tsx` の表示ロジック・`translations.ts` のラベル文言）で一貫して使われている。ポートフォリオ側にプライバシー専用リンクの概念がないため、計画書3章の「サポート/プライバシーを分ける」設計は**現状では不要**（既存ルーティングに合わせ、詳細ページ内でリンクをまとめる最小変更が妥当）。

### 4.6 `appStoreUrl`（17件） / `chrome`（9件）

- 型定義 `src/types/index.ts`、表示ロジック `src/components/ProjectLinks.tsx`、データ `src/data/projects.ts` の該当プロジェクト8件（`appStoreUrl`）、1件（`chromeWebStoreUrl`: furusato-cospa）。
- これらはApp Store Connect / Chrome Web Store側の掲載情報更新（Phase 7, 8）に対応するインベントリとして4.1/4.2と合わせて利用する。

### 4.7 `http://`（4件） / `https://`（コード内実質7ファイル、上記で分類済み）

- `http://` は `scripts/generate-sitemap.ts:18` の `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`（sitemap.xml仕様上のXML名前空間URIであり、実際のリンクではない）のみ。他はテンプレートリテラルの `${...}` 内など誤検出は無し。
- `public/sitemap.xml` は `.gitignore` で除外されたビルド生成物であり、リポジトリには未コミット（`git ls-files` で確認済み、追跡なし）。

## 5. その他の構成確認

- `public/404.html`: SPAフォールバック実装済み。`segments = 1`（`base` が `/portfolio-hub/` である現状に対応）。独自ドメイン化で `base: '/'` にする場合は `segments = 0` への変更がPhase 2で必要（計画書どおり）。
- `public/CNAME`: 現時点で**存在しない**（Phase 2で新規作成）。
- `manifest.webmanifest` / `manifest.json`: 存在しない。Phase 3の該当項目は対象外。
- `.github/workflows/deploy.yml`: `actions/upload-pages-artifact@v3` で `dist` をそのままアップロードする構成。`CNAME` を `public/` に置けば `dist` にコピーされビルド成果物に含まれる（Viteの `public/` 挙動どおり）ため、ワークフロー自体の変更は不要と見込まれる。
- 独自メールアドレス（`support@` 等）は未設定。schema.org 内の `kouhei10@gmail.com` はユーザー本人の主要連絡先と表記が異なる可能性があるため、Phase 3で要確認。

## 6. Phase 0 完了状況

- [x] `portfolio-hub` の作業ブランチを作成する → `domain-migration-margheritaworks`
- [x] 現在の本番サイトを画面保存する → 画像スクリーンショット取得ツールなしのため、テキストベースの現状記録で代替（1章参照）。画像保存は手動作業を推奨。
- [x] 現在の全公開URLを一覧化する → 3章
- [x] `src/data/projects.ts` の全プロジェクトを一覧化する → 2章
- [x] リポジトリ全体で指定文字列を検索する → 4章
- [x] 各URLの用途分類 → 4章各節
- [x] 現在の `main` のコミットIDを記録する → 0章
- [x] 切り戻し方法を作業記録に残す → 0章
