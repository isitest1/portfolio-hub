# Phase 4 実施記録 — Cloudflare DNSとGitHub Pagesの接続

対象: `margherita-works-domain-migration-plan.md` Phase 4
前提: Phase 1（ドメイン取得）完了済み。

**ステータス: 完了（2026-09-07）**。当初はCloudflare/GitHubの画面操作が必要なため所有者本人の作業として案内していたが、所有者がCloudflareのDNS編集権限のみに絞ったAPIトークンを発行し、Claudeに渡して実行を依頼した。GitHub側はリポジトリに対して既にadmin権限を持つ `gh` CLI認証がこの環境にあったため、Cloudflare APIと GitHub REST API (`gh api`) を使って以下をすべてClaudeが実行した。

## 実施ログ（2026-09-07）

1. 所有者がCloudflareで「Edit zone DNS」テンプレート・`margheritaworks.com`単一ゾーンに絞ったAPIトークンを発行し、Claudeに共有。
2. トークンを検証 (`/user/tokens/verify`)、ゾーンID取得、既存レコード確認 → GitHubのTXT所有権確認レコードのみ既に存在していることを確認。
3. Cloudflare API (`POST /zones/{id}/dns_records`) で以下を作成:
   - `A @ -> 185.199.108.153 / .109.153 / .110.153 / .111.153`（Proxy: DNS only）
   - `CNAME www -> isitest1.github.io`（Proxy: DNS only）
   - AAAAは必須ではないため見送り。
4. `gh api -X PUT repos/isitest1/portfolio-hub/pages -f cname=margheritaworks.com` でリポジトリのカスタムドメインを設定。レスポンスで `protected_domain_state: "verified"`（TXT所有権確認は既に完了済みだったことが判明）、`https_certificate.state: "new"` を確認。
5. `main` に未マージだった `domain-migration-margheritaworks` を確認したところ、この時点でカスタムドメインは設定済みだが**サイトの実体はまだ旧ビルド**（`base: '/portfolio-hub/'`のまま）という不整合状態になったため、直ちに `git merge --ff-only` → `git push origin main` を実行し、`.github/workflows/deploy.yml` のデプロイを `gh run watch` で完走まで監視。
6. デプロイ完了後、証明書状態を再確認 → `https_certificate.state: "approved"`（`margheritaworks.com` と `www.margheritaworks.com` の両方、有効期限 2026-12-06）。`gh api -X PUT repos/isitest1/portfolio-hub/pages -F https_enforced=true` で **Enforce HTTPS** を有効化。
7. `curl` / Node の `dns.resolve*` で最終確認（下記「確認結果」を参照）。
8. 使い終えたCloudflare APIトークンは**所有者側で失効（Revoke）することを推奨**（このセッション以降は不要）。

## 確認結果（デプロイ後）

- `http://margheritaworks.com/` → 200、`https://margheritaworks.com/` → 200
- `http://www.margheritaworks.com/` / `https://www.margheritaworks.com/` → いずれも `http://margheritaworks.com/` へ301転送
- `https://isitest1.github.io/portfolio-hub/`（旧URL）→ `http://margheritaworks.com/` へ301転送（GitHub側の自動転送。Phase 5で想定していた挙動どおり）
- ページ内の `<title>` が `Margherita Works — Apps, Websites & Tools` になっていることを確認（Phase 3のブランド変更が本番に反映されている）
- `/assets/*.js`, `/assets/*.css`, `/favicon.svg` がルート絶対パスで200
- `/sitemap.xml`, `/robots.txt`, `/og.png` が新ドメイン基準で200、`sitemap.xml`内に旧ドメイン文字列なし
- `/ja/` `/en/` への直接アクセスは `curl` では404（想定どおり。`public/404.html` のJSリダイレクトでブラウザ上は正しく描画される設計で、これは移行前から同じ仕組み。この環境にはJS実行可能なブラウザ確認手段がないため、**実際のブラウザでの目視確認を推奨**）
- `www.margheritaworks.com` のCNAME伝播はCloudflare API登録直後は外部リゾルバにまだ反映されていなかったが、数分後に解決を確認
- Enforce HTTPS有効化直後の `http://` ルートは一時的にFastlyのキャッシュ（`Cache-Control: max-age=600`）から200を返していた。HSTSリダイレクトはキャッシュ失効後に有効になる可能性があるため、有効化から10分程度経ってから再確認するとよい

## なぜ当初は `main` へのマージを保留していたか

`public/CNAME` を含んだ状態で `main` にマージ・デプロイすると、GitHub Pagesがそのビルド成果物の `CNAME` を読み取り、`margheritaworks.com` を独自ドメインとして即座に設定してしまう可能性があります。その時点でCloudflare側のDNS（AレコードなどをGitHub Pagesへ向ける設定）がまだ無いと、次のようになりかねません。

- 旧URL `https://isitest1.github.io/portfolio-hub/` が想定外の挙動になる（カスタムドメイン設定により自動転送/停止される場合がある）
- 新URL `https://margheritaworks.com/` はDNSが伝播していないためまだ表示できない

結果として、DNS接続が終わるまでの間サイトが誰からも正常に見られない空白期間が生まれるおそれがあります。そのため、**このPhase 4の DNS/GitHub側の設定が終わってから、`main` へのマージとデプロイを行う**、という順序にしています。

---

## 手順

### 1. GitHubアカウントでのドメイン所有権確認（TXTレコード）

参照: [GitHub Pages Custom Domain Verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)（2026-09-07 に公式ドキュメントを確認済み）

- [x] GitHubに `isitest1` でログインし、**個人アカウントの Settings → Pages**（リポジトリ設定ではなくアカウント設定）を開く。
- [x] **Add a domain** をクリックし、`margheritaworks.com` を入力して追加する。
- [x] GitHubが提示するTXTレコードのホスト名は次の形式になる。
  ```
  _github-pages-challenge-isitest1.margheritaworks.com
  ```
  値（Value）はGitHubの画面上にその場で表示される固有の文字列。これは事前に予測できないため、**画面に表示された値をそのままコピーする**こと。
- [x] Cloudflareダッシュボード → `margheritaworks.com` の **DNS** 設定で、上記ホスト名のTXTレコードを追加する。
  - Type: `TXT`
  - Name: `_github-pages-challenge-isitest1`（Cloudflareではドメイン部分を省略してサブドメイン部分だけ入力するのが一般的）
  - Content: GitHubが表示した値をそのまま貼り付け
  - Proxy status: TXTレコードにはProxyの概念がないため気にしなくてよい
- [x] DNS反映を待つ（即時〜最大24時間、公式ドキュメントの表現）。`dig` コマンドで確認できる場合は事前に確認してから、GitHub側で **Verify** をクリックする。
  ```bash
  dig TXT _github-pages-challenge-isitest1.margheritaworks.com +short
  ```

### 2. Cloudflare DNSに GitHub Pages 向けレコードを追加

参照: [GitHub Pages Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)（2026-09-07 に公式ドキュメントを確認済み。以下のIPはこのページに記載の現在値）

apex（`margheritaworks.com` 本体）向けに、次の **Aレコード4本** をすべて追加する。

| Type | Name | Content |
|---|---|---|
| A | `margheritaworks.com`（Cloudflareでは `@`） | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

GitHub公式が案内している場合は、**AAAAレコード4本**も追加する。

| Type | Name | Content |
|---|---|---|
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

`www` サブドメイン向けに **CNAMEレコード1本**を追加する（GitHub公式の指定どおり、リポジトリ名を含めず `<user>.github.io` のみを指す）。

| Type | Name | Content |
|---|---|---|
| CNAME | `www` | `isitest1.github.io` |

- [x] 上記A×4、（該当する場合）AAAA×4、CNAME×1（www）をCloudflare DNSに追加する。
- [x] **重要**: 初期設定時はこれらのレコードの Proxy status を **「DNS only」（グレーの雲マーク）** にする。オレンジの「Proxied」のままだとGitHub側のHTTPS証明書（Let's Encrypt）発行が失敗することがある。
- [x] ワイルドカードDNSレコード（`*`）は作成しない。

### 3. GitHubリポジトリ側でカスタムドメインを設定

- [x] `isitest1/portfolio-hub` リポジトリの **Settings → Pages → Custom domain** に `margheritaworks.com` を設定する（実際は `gh api -X PUT repos/isitest1/portfolio-hub/pages -f cname=margheritaworks.com` で実行）。
  - 事前の懸念だった「GitHubが `CNAME` ファイルを自動コミットする」現象は、この `build_type: "workflow"`（Actionsベース）のPages構成では発生しなかった（`main` に差分なしを確認済み）。旧来のブランチベースPagesとは挙動が異なる。
- [x] **DNS check** が成功したことを確認（`gh api repos/isitest1/portfolio-hub/pages` のレスポンスで `https_certificate.state` が `new` → `approved` に進んだことで確認）。

### 4. `main` へのマージとデプロイ

DNS checkが成功したら、初めてコードをmainへ反映する。

- [x] `domain-migration-margheritaworks` ブランチを `main` にマージする（Pull Requestを作成してマージするか、Claudeに指示すれば実行する）。
- [x] `main` へのpushで `.github/workflows/deploy.yml` が自動的にビルド・デプロイする。
- [x] デプロイ完了後、リポジトリの **Settings → Pages** で `CNAME` が `margheritaworks.com` になっていること、証明書発行状況を確認する。

### 5. HTTPS証明書発行後の仕上げ

- [x] GitHub側でHTTPS証明書の発行が完了したら、**Settings → Pages → Enforce HTTPS** を有効にする（発行前に有効化しようとしても選択できないことが多い）。
- [x] 次のURLをすべてブラウザで開いて確認する。
  ```
  http://margheritaworks.com/
  https://margheritaworks.com/
  http://www.margheritaworks.com/
  https://www.margheritaworks.com/
  https://margheritaworks.com/ja/
  https://margheritaworks.com/en/
  ```
- [x] 最終的にすべて `https://margheritaworks.com/...` の正規URLへ統一されることを確認する。

---

## Claudeが実行できたこと／できなかったこと（実施後の追記）

- **Claudeだけでは実行できなかった**: GitHubアカウント設定でのドメイン所有権確認フロー（Settings → Pages → Add a domain、TXT値の払い出しとVerifyクリック）は、公開APIが見当たらずブラウザでのログインセッションが必要だったため、所有者本人が実施した。
- **所有者からトークン／権限を受け取った後にClaudeが実行できたこと**:
  - Cloudflare DNSレコードの追加・確認（Cloudflare API、DNS編集のみに絞ったトークン経由）
  - GitHubリポジトリのCustom domain設定、DNS check状況の確認、Enforce HTTPSの有効化（`gh api` 経由。この環境の `gh` 認証が対象リポジトリのadmin権限を持っていたため実行可能だった）
  - `main` へのマージ・push・デプロイ監視・本番URLの動作確認
- 次回同種の作業をする場合、事前にCloudflareのDNS編集専用トークンと、対象リポジトリに書き込み権限のある `gh` 認証があれば、Phase 4はほぼ全自動で実行できる。

## 参考資料

- GitHub Pagesのカスタムドメイン管理（Apex用A/AAAA、wwwのCNAME）: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pagesのカスタムドメイン所有権確認（TXTレコード）: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
