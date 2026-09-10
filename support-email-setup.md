# support@margheritaworks.com セットアップ手順

作成日：2026-09-09
目的：全アプリ共通の問い合わせ窓口 `support@margheritaworks.com` を、受信（Gmailへ転送）と送信（Gmailから support@ 名義で返信）の両方向で使えるようにする。
方式：Cloudflare Email Routing（受信転送）＋ Gmail の「他のアドレスからメールを送信」（送信）。追加のメールサービス契約は不要。

前提：`margheritaworks.com` のゾーンが Cloudflare にあり、DNS が Cloudflare で管理されていること（ドメイン移行 Phase 4 完了後）。

---

## 0. 役割分担

| 担当 | 作業 |
|---|---|
| **人（ご本人）** | APIトークン発行、確認メールのリンクをクリック、Gmail側の設定、Googleアプリパスワード発行 |
| **Claude Code** | Cloudflare API でのルーティング有効化・宛先登録・転送ルール作成・DNS(SPF/DMARC)編集・疎通確認 |

確認メールのクリックと Gmail の設定画面操作は API で代替できないため、人が行う。Claude Code は該当箇所で作業を止め、完了を待ってから次へ進む。

---

## 1. 【人】Cloudflare API トークンを発行する

Cloudflare ダッシュボード → プロフィール → API トークン → 「トークンを作成」→ カスタムトークン。

権限：
- Account → **Email Routing Addresses** → Edit
- Zone → **Email Routing Rules** → Edit
- Zone → **DNS** → Edit
- Zone → **Zone** → Read

ゾーンリソース：Include → Specific zone → `margheritaworks.com`

発行したトークンを環境変数で Claude Code に渡す（ファイルやリポジトリに書かない）：

```bash
export CF_API_TOKEN="<トークン>"
```

---

## 2. 【Claude Code】ゾーンIDとアカウントIDを取得する

```bash
CF_ZONE_NAME="margheritaworks.com"

ZONE_JSON=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=$CF_ZONE_NAME")
CF_ZONE_ID=$(echo "$ZONE_JSON" | jq -r '.result[0].id')
CF_ACCOUNT_ID=$(echo "$ZONE_JSON" | jq -r '.result[0].account.id')
echo "zone=$CF_ZONE_ID account=$CF_ACCOUNT_ID"
```

両方が空でないことを確認してから進む。

---

## 3. 【Claude Code】Email Routing を有効化する

MX レコードと SPF レコードは Cloudflare が自動で追加する。既に MX レコードがある場合は上書きされるので、事前に現在の MX を記録しておく。

```bash
# 現状の MX / TXT を控える
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=MX" | jq '.result[] | {name, content, priority}'
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=TXT" | jq '.result[] | {name, content}'

# 有効化（必要な DNS レコードの追加とロックまで行われる）
curl -s -X POST -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/email/routing/enable" | jq '.success, .result.status'
```

`success: true` かつ `status` が `ready` になるまで、数十秒おきに `GET /zones/$CF_ZONE_ID/email/routing` で確認する。

---

## 4. 【Claude Code → 人】転送先アドレスを登録し、確認する

転送先は現在使っている Gmail アドレス。以下では `GMAIL_ADDR` とする。

```bash
GMAIL_ADDR="<ご本人のGmailアドレス>"

curl -s -X POST -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/email/routing/addresses" \
  -d "{\"email\":\"$GMAIL_ADDR\"}" | jq '.result | {id, email, verified}'
```

**ここで Claude Code は停止し、次を人に依頼する：**

> Cloudflare から `GMAIL_ADDR` 宛てに「Verify your email address」というメールが届いています。リンクをクリックして確認を完了してください。

人が確認後、Claude Code は `verified` が非 null になったことを確認して再開する：

```bash
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/email/routing/addresses" \
  | jq '.result[] | {email, verified}'
```

---

## 5. 【Claude Code】転送ルールを作成する

`support@` を Gmail へ転送する。合わせて、将来アプリ側の Worker が差出人に使う `noreply@` は「受信したら破棄」にしておく（返信が来てもゴミになるだけなので）。

```bash
# support@ → Gmail
curl -s -X POST -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/email/routing/rules" \
  -d "{
    \"name\": \"support to gmail\",
    \"enabled\": true,
    \"priority\": 0,
    \"matchers\": [{\"type\":\"literal\",\"field\":\"to\",\"value\":\"support@$CF_ZONE_NAME\"}],
    \"actions\":  [{\"type\":\"forward\",\"value\":[\"$GMAIL_ADDR\"]}]
  }" | jq '.success, .result.id'

# noreply@ → 破棄
curl -s -X POST -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/email/routing/rules" \
  -d "{
    \"name\": \"drop noreply\",
    \"enabled\": true,
    \"priority\": 1,
    \"matchers\": [{\"type\":\"literal\",\"field\":\"to\",\"value\":\"noreply@$CF_ZONE_NAME\"}],
    \"actions\":  [{\"type\":\"drop\"}]
  }" | jq '.success, .result.id'

# それ以外の宛先（typo など）は破棄。catch-all は転送にしない（スパムの受け皿になるため）
curl -s -X PUT -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/email/routing/rules/catch_all" \
  -d '{"name":"catch-all drop","enabled":true,"matchers":[{"type":"all"}],"actions":[{"type":"drop"}]}' \
  | jq '.success'
```

---

## 6. 【Claude Code】受信の疎通確認

人に、別のメールアカウント（または Gmail 自身）から `support@margheritaworks.com` へテストメールを送ってもらい、Gmail に届くことを確認する。届かない場合は次を確認：

- `GET /zones/$CF_ZONE_ID/email/routing` の `status` が `ready` か
- MX レコードが `route1/2/3.mx.cloudflare.net` になっているか
- 宛先アドレスの `verified` が入っているか

---

## 7. 【Claude Code】SPF と DMARC を整える

Email Routing が追加した SPF は `v=spf1 include:_spf.mx.cloudflare.net ~all`。手順8で Gmail から support@ 名義で送信するため、Google の送信サーバーも SPF に含める。

```bash
# 既存の SPF レコード ID を取得
SPF_ID=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=TXT&name=$CF_ZONE_NAME" \
  | jq -r '.result[] | select(.content | test("v=spf1")) | .id')

# include を追加して更新
curl -s -X PATCH -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$SPF_ID" \
  -d '{"content":"v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all"}' | jq '.success'
```

更新が「ロックされている」旨のエラーで拒否された場合は、Cloudflare ダッシュボードの Email Routing → 設定 → DNS レコードから編集する（人の作業）。

DMARC は監視モードで置く（`p=none`）。Gmail の SMTP 経由で送る返信は margheritaworks.com の DKIM 署名が付かないため、`p=reject` にすると自分の返信が弾かれる：

```bash
curl -s -X POST -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -d "{\"type\":\"TXT\",\"name\":\"_dmarc.$CF_ZONE_NAME\",\"content\":\"v=DMARC1; p=none; rua=mailto:support@$CF_ZONE_NAME\",\"ttl\":1}" | jq '.success'
```

---

## 8. 【人】Gmail から support@ 名義で送信できるようにする

これはブラウザ操作のため人が行う。Claude Code は手順を提示して待つ。

1. Google アカウントで 2段階認証を有効にしていない場合は有効にする
2. Google アカウント → セキュリティ → 「アプリ パスワード」で新しいパスワードを発行する（名前は `margheritaworks-smtp` 等）。16桁の文字列を控える
3. Gmail → 設定（歯車）→ すべての設定を表示 → 「アカウントとインポート」→ 「他のメールアドレスを追加」
4. 名前：`Margherita Works`、メールアドレス：`support@margheritaworks.com`、「エイリアスとして扱います」にチェック → 次へ
5. SMTP サーバー：`smtp.gmail.com`、ポート：`587`、ユーザー名：ご本人の Gmail アドレス、パスワード：手順2のアプリパスワード、「TLS を使用したセキュリティで保護された接続」→ アカウントを追加
6. `support@margheritaworks.com` 宛てに確認コードのメールが届く（手順5の転送で Gmail に入る）。コードを入力して確認を完了する
7. 同じ画面の「他のメールアドレスを追加」欄で、`support@` を **「デフォルトで返信する場合」→「メールを受信したアドレスから返信する」** に設定する。これで support@ 宛てに来たメールへの返信が自動的に support@ 名義になる

---

## 9. 【Claude Code → 人】送信の疎通確認

人に、Gmail から `support@margheritaworks.com` 名義で外部のアドレス（別サービスのメール）へテスト送信してもらい、以下を確認する：

- 受信側で差出人が `support@margheritaworks.com` と表示される
- 迷惑メールに入らない
- ヘッダーの `Authentication-Results` で SPF が `pass`（envelope は gmail.com で通る）

---

## 10. 各所への反映（Claude Code）

窓口が動いたら、次の箇所を `support@margheritaworks.com` に統一する：

- `portfolio-hub`：フッター、`projects.ts` の連絡先、プライバシーポリシーの連絡先
- 各アプリのサポートサイト（サブドメイン群）のフッターと問い合わせ行
- App Store Connect：各アプリの「サポートURL」先のページに記載する連絡先（App Store Connect 自体には Apple ID のメールが登録されているが、審査連絡用なので変更不要）
- 釣果ログ `feedback-form-spec.md` の `mailto:` 宛先と Worker の通知先（既に support@ 指定済みなので確認のみ）
- Cloudflare Worker の `send_email` バインディング：差出人 `noreply@margheritaworks.com`、宛先 `support@margheritaworks.com`（宛先は手順4で確認済みの Gmail ではなく、support@ 経由で転送させると Reply-To が保てる）

---

## 11. 完了チェック

- [ ] `support@` へのメールが Gmail に届く
- [ ] Gmail から `support@` 名義で送信でき、受信側で迷惑メール扱いされない
- [ ] `support@` 宛てのメールに Gmail で「返信」すると、差出人が自動で `support@` になる
- [ ] `noreply@` と存在しない宛先は破棄され、Gmail に届かない
- [ ] SPF に `_spf.mx.cloudflare.net` と `_spf.google.com` の両方が含まれている
- [ ] `_dmarc` が `p=none` で存在する
- [ ] API トークンがリポジトリ・ファイルに残っていない

---

## 補足：将来の改善点

Gmail の SMTP を使う方式は無料で手軽だが、送信メールに margheritaworks.com の DKIM 署名が付かないため、DMARC を `p=reject` にできず、大量送信には向かない。問い合わせ返信の頻度が増えたら、送信専用に Resend や Brevo の無料枠を SMTP として Gmail の「他のアドレス」に設定し直し、DKIM を揃える。受信側（Email Routing）はそのまま使える。
