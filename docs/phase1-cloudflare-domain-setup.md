# Phase 1 手順書 — Cloudflareで margheritaworks.com を取得する

対象: `margherita-works-domain-migration-plan.md` Phase 1
実施者: **所有者本人**（購入・支払い・メール認証はClaudeが自動実行しない）
前提: [Phase 0 調査記録](./phase0-migration-audit.md) 完了済み

この手順は、Cloudflareの画面上で行う作業のチェックリストです。Claudeは代行しません。各項目の完了を確認したら、このファイルの `[ ]` を `[x]` に更新してください（またはそのまま口頭で「完了した」と伝えてください）。

---

## 1. ドメインの購入

- [ ] Cloudflareアカウントにログインする（未作成なら [dash.cloudflare.com](https://dash.cloudflare.com/) で作成）。
- [ ] 左メニューの **Registrar**（またはダッシュボード内の「ドメインを登録」）から `margheritaworks.com` を検索する。
- [ ] 取得可能であることを確認し、カートに追加する。
  - `.com` はCloudflare Registrarでは**卸値（原価）+ ICANN手数料**で提供される。プレミアムドメイン扱いになっていないか、表示価格を確認する。
- [ ] 支払い方法を登録し、購入を完了する。

参考: [Cloudflareの新規ドメイン登録手順](https://developers.cloudflare.com/registrar/get-started/register-domain/)

## 2. 登録者情報（WHOIS）の入力

- [ ] 登録者情報（Registrant）を正確に入力する。氏名は法人名と誤認されない表記にする（計画書 3章の方針: ブランド名は使ってよいが法人と誤認させない）。
- [ ] Cloudflareは個人登録者のWHOIS情報を標準でプライバシー保護（redaction）する。**WHOIS Privacy / Redaction が有効になっていること**を確認する（Registrant Contact設定画面）。
- [ ] 連絡先メールアドレスは、日常的に確認できるアドレスを設定する（更新通知・ICANN確認メールが届く）。

## 3. 登録メールアドレスの確認（ICANN検証）

- [ ] 購入後にICANNから送られる本人確認メール（Verify your email / Whois Data Reminder）を確認し、期限内にリンクをクリックする。
- [ ] 未確認のまま一定期間放置するとドメインが停止（サスペンド）される点に注意する。

## 4. 自動更新の有効化

- [ ] ドメインの管理画面で **Auto-Renew** が有効になっていることを確認する。
- [ ] 支払い方法の有効期限が十分先であることを確認する（更新失敗によるドメイン失効を防ぐ）。

## 5. Cloudflareアカウントの二要素認証（2FA）

- [ ] Cloudflareダッシュボードの **My Profile → Authentication** で2FA（TOTPアプリ推奨）を有効化する。
- [ ] リカバリーコードを安全な場所（パスワードマネージャー等）に保存する。

このステップはドメイン自体の設定ではなくアカウント保護だが、ドメインの乗っ取り防止に直結するため購入直後に必ず実施する。

## 6. ドメインロック（Registrar Lock）

- [ ] ドメイン管理画面で **Domain Lock**（Transfer Lock）が有効になっていることを確認する。
- [ ] Cloudflare Registrarでは通常デフォルトで有効。無効になっている場合のみ有効化する。

## 7. DNSSECの状態確認

- [ ] ドメインの **DNS → Settings** で DNSSEC のステータスを確認する。
- [ ] Phase 1時点では**有効化するかどうかを決めるだけでよい**（実際のDS登録・伝播確認はPhase 4のDNS接続作業と合わせて行う）。今すぐ有効化する場合は、Cloudflareの自動DNSSEC設定に従う。
- [ ] 注意: DNSSECを有効にした状態でネームサーバーやDS レコードの設定を誤ると、ドメイン全体が名前解決不能になるリスクがある。Phase 4でGitHub Pages接続が安定した後に有効化する方が安全であれば、その順序でも構わない。

## 8. 回復用メールアドレスと支払い方法の確認

- [ ] Cloudflareアカウントの **Recovery email** が、実際にアクセスできるアドレスになっていることを確認する。
- [ ] 支払い方法（クレジットカード等）の有効期限、請求先情報を確認する。
- [ ] 可能であれば、複数の連絡経路（登録者メール・アカウント回復メール）が同一の単一障害点にならないようにする。

---

## Phase 1 完了チェック

すべて完了したら、以下を確認してからPhase 2（GitHub Pages側のコード変更）に進む。

- [ ] `margheritaworks.com` がCloudflareアカウントの Registrar 一覧に表示されている
- [ ] ドメインステータスが `Active`（Pending や Locked-for-transfer 等の異常状態でない）
- [ ] 自動更新 = 有効
- [ ] Cloudflareアカウントの2FA = 有効
- [ ] ドメインロック = 有効
- [ ] DNSSECの方針を決定済み（有効化済み、またはPhase 4後に有効化すると決めた）
- [ ] 回復用メール・支払い方法を確認済み

完了後、Claudeに「Phase 1完了」と伝えてもらえれば、Phase 2（`vite.config.ts` の `base` 変更、`public/CNAME` 追加など）に進みます。

## 参考資料

- Cloudflare Registrar: https://domains.cloudflare.com/
- Cloudflareの新規ドメイン登録: https://developers.cloudflare.com/registrar/get-started/register-domain/
