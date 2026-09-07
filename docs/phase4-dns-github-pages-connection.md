# Phase 4 手順書 — Cloudflare DNSとGitHub Pagesの接続

対象: `margherita-works-domain-migration-plan.md` Phase 4
実施者: **所有者本人**（Cloudflareダッシュボード・GitHubアカウント設定の画面操作が必要で、Claudeはこれらを自動実行しない）
前提: Phase 1（ドメイン取得）完了済み。Phase 2/3（コード側の変更）は `domain-migration-margheritaworks` ブランチにコミット・push済みだが、**まだ `main` にはマージしていない**。

## なぜまだ `main` にマージしていないか

`public/CNAME` を含んだ状態で `main` にマージ・デプロイすると、GitHub Pagesがそのビルド成果物の `CNAME` を読み取り、`margheritaworks.com` を独自ドメインとして即座に設定してしまう可能性があります。その時点でCloudflare側のDNS（AレコードなどをGitHub Pagesへ向ける設定）がまだ無いと、次のようになりかねません。

- 旧URL `https://isitest1.github.io/portfolio-hub/` が想定外の挙動になる（カスタムドメイン設定により自動転送/停止される場合がある）
- 新URL `https://margheritaworks.com/` はDNSが伝播していないためまだ表示できない

結果として、DNS接続が終わるまでの間サイトが誰からも正常に見られない空白期間が生まれるおそれがあります。そのため、**このPhase 4の DNS/GitHub側の設定が終わってから、`main` へのマージとデプロイを行う**、という順序にしています。

---

## 手順

### 1. GitHubアカウントでのドメイン所有権確認（TXTレコード）

参照: [GitHub Pages Custom Domain Verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)（2026-09-07 に公式ドキュメントを確認済み）

- [ ] GitHubに `isitest1` でログインし、**個人アカウントの Settings → Pages**（リポジトリ設定ではなくアカウント設定）を開く。
- [ ] **Add a domain** をクリックし、`margheritaworks.com` を入力して追加する。
- [ ] GitHubが提示するTXTレコードのホスト名は次の形式になる。
  ```
  _github-pages-challenge-isitest1.margheritaworks.com
  ```
  値（Value）はGitHubの画面上にその場で表示される固有の文字列。これは事前に予測できないため、**画面に表示された値をそのままコピーする**こと。
- [ ] Cloudflareダッシュボード → `margheritaworks.com` の **DNS** 設定で、上記ホスト名のTXTレコードを追加する。
  - Type: `TXT`
  - Name: `_github-pages-challenge-isitest1`（Cloudflareではドメイン部分を省略してサブドメイン部分だけ入力するのが一般的）
  - Content: GitHubが表示した値をそのまま貼り付け
  - Proxy status: TXTレコードにはProxyの概念がないため気にしなくてよい
- [ ] DNS反映を待つ（即時〜最大24時間、公式ドキュメントの表現）。`dig` コマンドで確認できる場合は事前に確認してから、GitHub側で **Verify** をクリックする。
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

- [ ] 上記A×4、（該当する場合）AAAA×4、CNAME×1（www）をCloudflare DNSに追加する。
- [ ] **重要**: 初期設定時はこれらのレコードの Proxy status を **「DNS only」（グレーの雲マーク）** にする。オレンジの「Proxied」のままだとGitHub側のHTTPS証明書（Let's Encrypt）発行が失敗することがある。
- [ ] ワイルドカードDNSレコード（`*`）は作成しない。

### 3. GitHubリポジトリ側でカスタムドメインを設定

- [ ] `isitest1/portfolio-hub` リポジトリの **Settings → Pages → Custom domain** に `margheritaworks.com` を入力して Save する。
  - この時点で `domain-migration-margheritaworks` ブランチはまだ `main` にマージされていないので、`public/CNAME` はまだデプロイされていない。**この画面からの手動設定が今回のトリガーになる**（GitHubがリポジトリに `CNAME` ファイルを自動コミットする場合がある点に注意。もし自動コミットされたら、次にこちらのブランチをマージする際にコンフリクトしないか確認する）。
- [ ] **DNS check** が成功（緑のチェック）になるまで待つ。失敗する場合はDNS伝播待ちの可能性が高いので、時間を置いて再試行する。

### 4. `main` へのマージとデプロイ

DNS checkが成功したら、初めてコードをmainへ反映する。

- [ ] `domain-migration-margheritaworks` ブランチを `main` にマージする（Pull Requestを作成してマージするか、Claudeに指示すれば実行する）。
- [ ] `main` へのpushで `.github/workflows/deploy.yml` が自動的にビルド・デプロイする。
- [ ] デプロイ完了後、リポジトリの **Settings → Pages** で `CNAME` が `margheritaworks.com` になっていること、証明書発行状況を確認する。

### 5. HTTPS証明書発行後の仕上げ

- [ ] GitHub側でHTTPS証明書の発行が完了したら、**Settings → Pages → Enforce HTTPS** を有効にする（発行前に有効化しようとしても選択できないことが多い）。
- [ ] 次のURLをすべてブラウザで開いて確認する。
  ```
  http://margheritaworks.com/
  https://margheritaworks.com/
  http://www.margheritaworks.com/
  https://www.margheritaworks.com/
  https://margheritaworks.com/ja/
  https://margheritaworks.com/en/
  ```
- [ ] 最終的にすべて `https://margheritaworks.com/...` の正規URLへ統一されることを確認する。

---

## Claudeが実行できること／できないこと

- **Claudeが実行できない**: Cloudflareダッシュボードでのレコード追加、GitHubアカウント設定でのドメイン所有権確認（TXT）とその「Verify」クリック、リポジトリSettingsでのCustom domain入力・Enforce HTTPSのトグル。いずれもブラウザでのログインセッションが必要な操作で、この環境からは行えない。
- **Claudeが実行できること**（指示があれば）:
  - Phase 4がすべて完了した後の `domain-migration-margheritaworks` → `main` のマージとpush
  - DNS check失敗時の原因調査の壁打ち（`dig` の結果を貼ってもらえれば読み解く）
  - GitHubが `CNAME` ファイルを自動コミットした場合のブランチ側との整合性確認

## 参考資料

- GitHub Pagesのカスタムドメイン管理（Apex用A/AAAA、wwwのCNAME）: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pagesのカスタムドメイン所有権確認（TXTレコード）: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
