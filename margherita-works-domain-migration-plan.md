# Margherita Works 独自ドメイン移行・ブランド更新計画

作成日: 2026-09-04  
新ブランド名: **Margherita Works**  
新ドメイン: **margheritaworks.com**  
現在のサイト: `https://isitest1.github.io/portfolio-hub/ja`

## 1. 目的

現在のポートフォリオサイトと各アプリのサポートページ、プライバシーポリシー、ストア掲載情報を、`Margherita Works` と `margheritaworks.com` に統一する。

当面はサイトをGitHub Pagesで配信し続け、Cloudflareでは次の機能だけを使用する。

- ドメインの登録と更新
- DNS管理
- 必要に応じたリダイレクト

Cloudflare Pagesへの移行は今回の必須作業に含めない。まずは既存のGitHub Pagesを独自ドメインに接続し、安全に切り替える。

## 2. 基本方針

- 正式なブランド表記は `Margherita Works` とする。
- 正式なURLは `https://margheritaworks.com/` とする。
- 日本語トップは `https://margheritaworks.com/ja/` とする。
- 英語トップは `https://margheritaworks.com/en/` とする。
- `https://www.margheritaworks.com/` からは正規URLへ転送する。
- 既存のGitHub Pages URLは、移行後もすぐには削除しない。
- 既存URLから新URLへ可能な限り転送し、古いリンクを一定期間利用可能にする。
- App Store、Chrome Web Store、各アプリ内のリンクは、公開済みページの動作確認後に更新する。
- プライバシーポリシーのURLは安易に変更せず、各アプリから参照されている場所を確認してから切り替える。

## 3. 推奨URL設計

サイト内のURLは、原則として次の形式に統一する。

```text
https://margheritaworks.com/ja/
https://margheritaworks.com/en/

https://margheritaworks.com/ja/projects/<project-id>/
https://margheritaworks.com/en/projects/<project-id>/
```

サポートページとプライバシーポリシーを分ける場合は、次の形式を推奨する。

```text
https://margheritaworks.com/ja/projects/<project-id>/support/
https://margheritaworks.com/en/projects/<project-id>/support/
https://margheritaworks.com/ja/projects/<project-id>/privacy/
https://margheritaworks.com/en/projects/<project-id>/privacy/
```

ただし、現行サイトがプロジェクト詳細ページだけでサポート情報を完結させている場合は、不要なページ分割をしない。Claudeは現在のルーティングと掲載内容を確認し、既存リンクを壊さない最小限の変更を選択すること。

## 4. 実施順序

### Phase 0: 作業前の調査とバックアップ

- [ ] `portfolio-hub` の作業ブランチを作成する。
- [ ] 現在の本番サイトを画面保存する。
- [ ] 現在の全公開URLを一覧化する。
- [ ] `src/data/projects.ts` に登録されている全プロジェクトを一覧化する。
- [ ] リポジトリ全体で次の文字列を検索する。

```text
isitest1.github.io
portfolio-hub
Portfolio Hub
Kohei Ishikawa
石川 紘平
support
privacy
appStoreUrl
chrome
http://
https://
```

- [ ] 各URLについて、用途を分類する。
  - サイト内リンク
  - App Store URL
  - Chrome Web Store URL
  - サポートURL
  - プライバシーポリシーURL
  - GitHubリポジトリURL
  - 外部サービスURL
- [ ] 現在の `main` のコミットIDを記録する。
- [ ] 切り戻し方法をREADMEまたは作業記録に残す。

### Phase 1: Cloudflareでドメインを取得

- [ ] Cloudflare Registrarで `margheritaworks.com` を購入する。
- [ ] 登録者情報を正しく入力する。
- [ ] 登録メールアドレスの確認を完了する。
- [ ] 自動更新が有効であることを確認する。
- [ ] Cloudflareアカウントで二要素認証を有効にする。
- [ ] ドメインロックが有効であることを確認する。
- [ ] DNSSECの状態を確認する。
- [ ] 回復用メールアドレスと支払方法を確認する。

Cloudflare上のドメイン購入操作、支払情報の入力、メール認証は、Claudeが自動実行せず、所有者が画面上で実施する。Claudeは必要な設定値と手順を提示する。

### Phase 2: GitHub Pages側の事前変更

このサイトはReact、TypeScript、Viteで構成されており、現在は `/portfolio-hub/` をベースパスとしている可能性がある。独自ドメインではルート配信になるため、Claudeは実装を確認して次を変更する。

- [ ] `vite.config.ts` の `base` を `/` に変更する。
- [ ] `public/404.html` のSPAフォールバック処理を確認する。
- [ ] 現在の仕様に従い、必要であれば `segments` を `0` に変更する。
- [ ] ハードコードされた `/portfolio-hub/` をすべて検索して修正する。
- [ ] アセット、画像、JavaScript、CSSのパスがルート基準で正常に解決されることを確認する。
- [ ] `public/CNAME` を追加し、内容を次の1行だけにする。

```text
margheritaworks.com
```

- [ ] GitHub Actionsの成果物に `CNAME` が含まれることを確認する。
- [ ] `npm run typecheck` を実行する。
- [ ] `npm run build` を実行する。
- [ ] ローカルプレビューで `/ja/`、`/en/`、各詳細ページ、存在しないURLを確認する。
- [ ] ブラウザの開発者ツールで404、CORS、Mixed Content、JavaScriptエラーがないことを確認する。

### Phase 3: サイトのブランド変更

#### 表示文言

- [ ] `Portfolio Hub` を、公開画面では `Margherita Works` に変更する。
- [ ] 日本語と英語のヘッダー、フッター、ページタイトルを更新する。
- [ ] 必要に応じて次の説明文を使用する。

日本語:

```text
小さな工夫を、便利なプロダクトに。
```

英語:

```text
Small ideas, useful products.
```

- [ ] フッターの著作権表示を更新する。

```text
© 2026 Margherita Works by Kohei Ishikawa
```

#### メタデータと検索対応

- [ ] `<title>` を更新する。
- [ ] `meta description` を日本語と英語で更新する。
- [ ] Open Graphの `og:title`、`og:description`、`og:url`、`og:image` を更新する。
- [ ] X向けメタデータがある場合は更新する。
- [ ] canonical URLを新ドメインへ統一する。
- [ ] `robots.txt` を確認する。
- [ ] `sitemap.xml` を生成または更新し、新ドメインのURLだけを記載する。
- [ ] `manifest.webmanifest` がある場合は名称、アイコン、`start_url` を更新する。
- [ ] 構造化データがある場合は名称、URL、ロゴを更新する。
- [ ] faviconとOG画像を `Margherita Works` 用に更新する。
- [ ] 旧名称 `Portfolio Hub` が不要に残っていないことを確認する。

#### 連絡先と法的ページ

- [ ] サポート連絡先を確認する。
- [ ] プライバシーポリシー内の運営者名とサイトURLを確認する。
- [ ] 利用規約がある場合は同様に確認する。
- [ ] ブランド名は使用しても、法人でない場合に会社であると誤認させる表現は使用しない。
- [ ] 必要なページでは運営者を `Kohei Ishikawa` または `石川 紘平` と明記する。

### Phase 4: Cloudflare DNSとGitHub Pagesの接続

ClaudeはGitHubの最新の公式値を確認してから設定案を提示する。IPアドレスを記憶だけで入力しない。

- [ ] GitHubアカウント設定でカスタムドメインの所有確認を行う。
- [ ] GitHubが表示するTXTレコードをCloudflare DNSに追加する。
- [ ] GitHub側で所有確認が完了したことを確認する。
- [ ] Cloudflare DNSにGitHub Pages向けのAレコードを追加する。
- [ ] GitHub公式文書で案内されている場合はAAAAレコードも追加する。
- [ ] `www` のCNAMEを `isitest1.github.io` に設定する。
- [ ] 初期設定時は、GitHubの証明書発行を妨げないよう、必要に応じてCloudflare Proxyを `DNS only` にする。
- [ ] GitHubリポジトリの `Settings > Pages > Custom domain` に `margheritaworks.com` を設定する。
- [ ] DNS checkが成功することを確認する。
- [ ] HTTPS証明書の発行完了後、`Enforce HTTPS` を有効にする。
- [ ] 次のURLをすべて確認する。

```text
http://margheritaworks.com/
https://margheritaworks.com/
http://www.margheritaworks.com/
https://www.margheritaworks.com/
https://margheritaworks.com/ja/
https://margheritaworks.com/en/
```

- [ ] 最終的にHTTPSかつ正規URLへ統一されることを確認する。
- [ ] ワイルドカードDNSレコードは作成しない。

### Phase 5: 旧URLへの対応

- [ ] `https://isitest1.github.io/portfolio-hub/ja` から新URLへの移行後の挙動を確認する。
- [ ] GitHub Pagesの仕様により旧パスが自動的に新ドメイン配下へ転送されるか確認する。
- [ ] 旧URLが404になる場合は、旧URLから新URLへ案内する移行ページまたはリダイレクトを用意する。
- [ ] 旧URLを参照している外部ページを可能な範囲で更新する。
- [ ] GitHubリポジトリのAbout欄とREADMEのURLを更新する。
- [ ] 各サポート用リポジトリに旧URLが残っていないか確認する。

注意: GitHub Pagesの1つの公開先にカスタムドメインを設定すると、旧 `github.io` URLがカスタムドメインへ転送される場合がある。実際の挙動を確認し、推測で完了扱いにしない。

## 5. 各プロジェクトで行う共通作業

以下は、それぞれのXcodeまたはVS Codeプロジェクトで個別に実施する。

### 5.1 全プロジェクト共通の検索

各リポジトリで次を全文検索する。

```text
isitest1.github.io
portfolio-hub
unitpricescanner-support
NameCue
support
privacy
terms
mailto:
CFBundleDisplayName
CFBundleName
MARKETING_VERSION
CURRENT_PROJECT_VERSION
homepage_url
author
website
```

検索結果は、変更が必要なものと変更不要なものに分けて記録する。

### 5.2 Xcodeプロジェクト共通

- [ ] アプリ内の「サポート」「ヘルプ」「プライバシーポリシー」「お問い合わせ」リンクを更新する。
- [ ] Swift、SwiftUI、Storyboard、Info.plist、設定ファイル、ローカライズ文字列を検索する。
- [ ] `Info.plist` のURL Schemeは、今回のWebサイト変更だけを理由に変更しない。
- [ ] Universal Linksを使用している場合はAssociated Domainsを更新する。
- [ ] Universal Linksを使用している場合は、新ドメインに `apple-app-site-association` を配置する。
- [ ] OAuthのコールバックURLを使用している場合は、サービス側とアプリ側を同時に更新する。
- [ ] Share Extension、Safari Web Extension、Widgetなど別ターゲットにも旧URLがないか確認する。
- [ ] About画面のブランド名を必要に応じて更新する。
- [ ] アプリ名やデベロッパー名は、ブランド変更だけを理由に自動変更しない。
- [ ] ビルド番号を更新する必要がある変更か判断する。
- [ ] URLしか変更していない場合でも、アプリ内にハードコードされていれば新しいバイナリの公開が必要になる。
- [ ] シミュレーターと実機で全リンクを開き、404やリダイレクトループがないことを確認する。
- [ ] TestFlightで確認してからApp Storeへ提出する。

### 5.3 Safari拡張機能共通

- [ ] Safari App ExtensionまたはSafari Web Extensionの本体とコンテナアプリを両方確認する。
- [ ] 設定画面、About画面、ヘルプ画面のリンクを更新する。
- [ ] 拡張機能に同梱されるHTML、JavaScript、JSON内の旧URLを検索する。
- [ ] `manifest.json` を使用している場合は、`homepage_url` などの関連項目を確認する。
- [ ] App Store ConnectのサポートURLとマーケティングURLを更新する。
- [ ] 変更を含む新バージョンを提出する必要があるか確認する。

### 5.4 Chrome拡張機能共通

- [ ] `manifest.json` の `homepage_url` を確認して更新する。
- [ ] オプション画面、ポップアップ、About画面、README内のリンクを更新する。
- [ ] Chrome Web Store Developer Dashboardのウェブサイト、サポートURL、プライバシーポリシーURLを更新する。
- [ ] ストア説明文に旧ブランド名や旧URLが残っていないか確認する。
- [ ] パッケージ内のファイルを変更した場合は、manifestのバージョンを上げて新しいZIPを作成する。
- [ ] ストア掲載情報だけを変更する場合と、拡張機能パッケージを更新する場合を分ける。
- [ ] 権限、データ利用、プライバシー開示に変更がないことを確認する。
- [ ] 2026年8月1日から施行されているChrome Web Storeのデータ収集と開示要件も併せて確認する。

### 5.5 Webアプリと通常のVS Codeプロジェクト共通

- [ ] READMEの公式サイトURLを更新する。
- [ ] `package.json` の `homepage`、`repository`、`bugs` を確認する。
- [ ] `.env` およびデプロイ環境変数の公開URLを確認する。
- [ ] CORS許可オリジンを確認する。
- [ ] CSPの `connect-src`、`img-src`、`frame-src` などを確認する。
- [ ] OAuthのリダイレクトURIを確認する。
- [ ] API、Webhook、メールテンプレート内のURLを確認する。
- [ ] PWAのmanifest、Service Worker、キャッシュキーを確認する。
- [ ] OG画像、canonical、sitemap、robotsを更新する。
- [ ] GitHubリポジトリのAbout欄、Topics、公開URLを更新する。
- [ ] GitHub Actions、Cloudflare設定、Vercelなどのデプロイ先に旧ドメインがないか確認する。

## 6. 現在確認できているプロジェクト別アクション

ポートフォリオのREADMEで確認できる次のプロジェクトを対象にする。Claudeは `src/data/projects.ts` を開き、実際の全件と照合して不足分を追加する。

### NameCue

- [ ] `isitest1/isitest1.github.io` 内のNameCueサポートページを確認する。
- [ ] 既存のNameCueサポートページを新ポートフォリオへ統合するか、旧ページから新ページへ転送する。
- [ ] Xcodeプロジェクト内の旧サポートURLを更新する。
- [ ] App Store ConnectのサポートURLとプライバシーポリシーURLを更新する。
- [ ] 既存利用者が古いURLから到達できることを確認する。

### UnitPriceScanner

- [ ] `unitpricescanner-support` リポジトリの `index.html` と `privacy.html` を確認する。
- [ ] 内容を新ドメインへ移すか、既存ページから新URLへ転送する。
- [ ] Xcodeプロジェクト内のサポートURLとプライバシーポリシーURLを更新する。
- [ ] App Store ConnectのURLを更新する。
- [ ] 価格比較やスキャン機能に関する説明文は、ブランド変更と分けて管理する。

### WorkoutQuest

- [ ] Xcodeプロジェクト内の旧URLを確認する。
- [ ] 健康関連データを扱う場合は、プライバシーポリシーの内容とURLを再確認する。
- [ ] App Store ConnectのURLと各言語の掲載内容を更新する。

### Tube Player for Safari

- [ ] XcodeのコンテナアプリとSafari拡張ターゲットを確認する。
- [ ] Safari拡張内のヘルプ、設定、About、プライバシーリンクを更新する。
- [ ] App Store ConnectのサポートURL、マーケティングURL、プライバシーポリシーURLを更新する。
- [ ] ストア掲載上の名称は、Appleの知的財産関連ガイドラインに抵触しないか別途確認する。

### Web Monitor RSS

- [ ] VS Codeプロジェクトの公開URL、README、環境変数、OAuth、CORSを確認する。
- [ ] 利用規約、プライバシーポリシー、問い合わせ先を新ブランドへ更新する。
- [ ] RSS内に絶対URLを出力している場合は、新ドメインへの変更要否を確認する。
- [ ] Cloudflareへの将来移行計画とは分け、今回の変更範囲を明確にする。
- [ ] 複数ユーザー機能や課金機能が未実装の場合、今回のブランド変更に混ぜない。

### Text Compare

- [ ] VS Codeプロジェクトのメタデータとフッターを更新する。
- [ ] PWA、OG、canonical、sitemap、READMEのURLを確認する。
- [ ] 外部送信を行わない設計であっても、プライバシー説明のURLと内容を確認する。

### その他のプロジェクト

- [ ] `src/data/projects.ts` の全件を確認し、この一覧にないプロジェクトを追加する。
- [ ] GitHubアカウント `isitest1` の公開リポジトリを確認し、ポートフォリオ未掲載の公開アプリも洗い出す。
- [ ] XcodeSentinelなど開発中または未公開のプロジェクトは、公開URLを持つ段階で更新対象に追加する。

## 7. App Store Connectで行う作業

各アプリについて、言語ごとに次を確認する。

- [ ] Support URL
- [ ] Marketing URL
- [ ] Privacy Policy URL
- [ ] Promotional Textに旧ブランド名や旧URLがないか
- [ ] Descriptionに旧ブランド名や旧URLがないか
- [ ] App Review Informationの連絡先URLやメモ
- [ ] In-App PurchaseまたはSubscriptionの説明と審査用情報
- [ ] Custom Product Pagesがある場合の掲載内容
- [ ] App Store Connect上の各ローカリゼーション

原則として、URLの変更だけでアプリ本体に変更がない場合は、まずApp Store Connect上でメタデータを更新できるか確認する。アプリ内にURLが組み込まれている場合は、Xcodeプロジェクトの修正、新ビルド、TestFlight確認、審査提出が必要になる。

## 8. Chrome Web Storeで行う作業

対象となるChrome拡張機能ごとに次を確認する。

- [ ] Developer Dashboardのウェブサイト
- [ ] Support URL
- [ ] Privacy Policy URL
- [ ] Store Listingの説明文
- [ ] スクリーンショット内の旧URLや旧ブランド
- [ ] `manifest.json` の `homepage_url`
- [ ] 拡張機能内のAbout、Help、Privacyリンク
- [ ] プライバシー開示と実際のデータ処理が一致していること

掲載情報だけの変更で済むか、パッケージ更新が必要かを明確に分ける。パッケージを変更する場合はバージョンを上げ、完全なZIPを作成して審査へ提出する。

## 9. GitHub全体の更新

- [ ] `portfolio-hub` リポジトリのAbout欄を更新する。
- [ ] `portfolio-hub` のREADMEを `Margherita Works` に更新する。
- [ ] デプロイ手順を独自ドメイン前提に更新する。
- [ ] `CLAUDE.md` に新しいブランド名、正規URL、URL設計を記載する。
- [ ] 各公開リポジトリのREADMEに新しい公式サイトURLを追加する。
- [ ] 各リポジトリのAbout欄にあるWebsiteを更新する。
- [ ] Issue template、Pull Request template、Funding、Security Policyに旧URLがないか確認する。
- [ ] GitHubプロフィールREADMEがある場合は更新する。

## 10. メールアドレス

ドメイン取得直後に独自メールを必須とはしない。必要になった段階で、次の候補を検討する。

```text
support@margheritaworks.com
contact@margheritaworks.com
privacy@margheritaworks.com
```

注意事項:

- Cloudflare Registrarでドメインを取得しただけでは、通常のメールボックスは作成されない。
- Cloudflare Email Routingを使用する場合は受信転送が中心となるため、送信元アドレスとして使用する方法を別途設計する。
- メール設定を行う場合は、MX、SPF、DKIM、DMARCを正しく設定する。
- 独自メールを準備する前に、既存の問い合わせ先を削除しない。

## 11. 公開前テスト

### URLと表示

- [ ] `/` へアクセスした際の言語選択または転送が正しい。
- [ ] `/ja/` と `/en/` が表示できる。
- [ ] 全プロジェクト詳細ページが表示できる。
- [ ] 画像、CSS、JavaScriptがすべて200で取得できる。
- [ ] 404ページが正しく動作する。
- [ ] SNS共有時のタイトル、説明、画像が正しい。
- [ ] canonical URLが新ドメインを指している。
- [ ] sitemap内に旧ドメインがない。
- [ ] モバイルとデスクトップの表示を確認する。

### セキュリティとDNS

- [ ] HTTPS証明書が有効である。
- [ ] HTTPからHTTPSへ転送される。
- [ ] `www` とapexの正規化ができている。
- [ ] DNSSECを確認する。
- [ ] GitHubのドメイン所有確認が完了している。
- [ ] 不要なDNSレコードがない。
- [ ] ワイルドカードDNSレコードがない。

### 外部掲載

- [ ] App Storeの全公開アプリから新しいURLが開ける。
- [ ] Chrome Web Storeから新しいURLが開ける。
- [ ] アプリ内の全リンクが開ける。
- [ ] GitHubのREADMEとAbout欄から新しいサイトが開ける。
- [ ] 旧URLから利用者が迷わず新URLへ移動できる。

## 12. 切り戻し方針

問題が発生した場合は、次の順序で切り戻す。

1. GitHub PagesのCustom domain設定を確認する。
2. DNSレコードを作業前の状態へ戻す。
3. `portfolio-hub` を記録した安定コミットへ戻す。
4. `vite.config.ts` の `base` を旧値へ戻す。
5. `public/404.html` の設定を旧値へ戻す。
6. 旧GitHub Pages URLで表示できることを確認する。
7. App StoreやChrome Web StoreのURLは、旧URLが利用可能な場合に限り旧値へ戻す。

ドメインの購入自体は取り消さず、DNS設定だけを切り戻す。

## 13. Claudeへの実行指示

Claudeは、次の原則で作業すること。

1. 最初にリポジトリ全体を調査し、変更対象ファイルと現在のURL一覧を提示する。
2. 推測でプロジェクト名やURLを追加しない。
3. 既存の日本語と英語の両方を維持する。
4. デザインを全面変更しない。今回はブランド名、ドメイン、URL、関連メタデータの更新を中心とする。
5. 既存URLを可能な限り維持または転送する。
6. DNS値はGitHubとCloudflareの公式文書で最新値を確認する。
7. Cloudflareの購入、支払、メール認証など、所有者による操作が必要な箇所は明確に分ける。
8. 各段階で `npm run typecheck` と `npm run build` を実行する。
9. 変更前後のURL対応表を作成する。
10. 完了時に、コードで完了した作業と、App Store Connect、Chrome Web Store、Xcode各プロジェクトなどで人が行う残作業を分けて報告する。

## 14. 最終成果物

Claudeは、少なくとも次を成果物として残す。

- [ ] ブランド変更済みのサイトコード
- [ ] 独自ドメイン対応済みのビルド設定
- [ ] `public/CNAME`
- [ ] 更新済みのREADME
- [ ] 更新済みのCLAUDE.md
- [ ] 新旧URL対応表
- [ ] Cloudflare DNS設定値の一覧
- [ ] App Store Connect更新対象一覧
- [ ] Chrome Web Store更新対象一覧
- [ ] Xcodeプロジェクト別の更新対象一覧
- [ ] VS Codeプロジェクト別の更新対象一覧
- [ ] テスト結果
- [ ] 未完了事項と手動作業一覧

## 15. 参考資料

- Cloudflare Registrar: https://domains.cloudflare.com/
- Cloudflareの新規ドメイン登録: https://developers.cloudflare.com/registrar/get-started/register-domain/
- GitHub Pagesのカスタムドメイン管理: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pagesのカスタムドメイン確認: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
- Apple App Store Connect Help: https://developer.apple.com/help/app-store-connect/
- Chrome Web Storeの更新: https://developer.chrome.com/docs/webstore/update/

## 16. 完了条件

次の条件をすべて満たした時点で、今回の移行を完了とする。

- `https://margheritaworks.com/ja/` と `/en/` が正常に表示される。
- ブランド表記が `Margherita Works` に統一されている。
- サイト内に意図しない旧ドメインと旧ブランド名が残っていない。
- 旧URLから新サイトへ到達できる。
- HTTPS、DNS、GitHubのドメイン確認が正常である。
- 公開済みアプリのストア掲載URLが更新されている。
- アプリ内に旧URLが組み込まれているものは、更新版の準備または提出状況が記録されている。
- Chrome拡張機能のストア情報とパッケージ内リンクが確認されている。
- GitHubの各公開リポジトリから新サイトへ到達できる。
- 未完了の作業が、プロジェクトごとに明確に記録されている。
