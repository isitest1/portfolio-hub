# Android版・Web版 希望登録フォーム 実装仕様（吹奏楽セッティング）

作成日：2026-09-13（改訂：同日 — 実装済み `mw-feedback-worker` の `/wish` エンドポイントと `wish_signups` テーブルに合わせて §1・§2・§5 を書き直し）
対象：
- 共用フィードバック Worker `mw-feedback-worker`（`api.margheritaworks.com`）
- サポートサイト `ensemblestage.margheritaworks.com`
- iOS アプリ「吹奏楽セッティング：配置図・座席表」（導線の追加のみ）

前提知識：このファイル単体で完結する。Worker の現状（2026-09-13 時点）は次のとおりで、本仕様はこれを前提に **差分だけ** を指示する。

- `POST /wish`：`app`, `topic`（`ALLOWED_TOPICS = {"android"}`）, `email`, `device`（`pixel|galaxy|xperia|other`）, `src`, `website`（ハニーポット）, `return` を受け、`wish_signups` に upsert（`UNIQUE(app, topic, email_norm)`）
- form POST なら `return + "#thanks"` / `#error-email` / `#error-rate` へ 303、JSON なら 204
- `GET /wish/unsubscribe?app=&topic=&t=` → `status='unsubscribed'` にして `SITE_BASE + "/android/unsubscribed/"` へ 303
- `GET /wish/summary`・`GET /wish/export`（`SUMMARY_TOKEN` 必須、既定は `app=choka-log&topic=android`）
- `SITE_BASE` は `https://chokalog.margheritaworks.com` 固定（`/wish` の `return` フォールバックと解除リダイレクトに使用）
- `ALLOWED_APPS` に `ensemble-stage` は登録済み、`ALLOWED_RETURN_HOSTS` に `ensemblestage.margheritaworks.com` は登録済み

---

## 0. 目的と方針

### 0.1 目的

1. 吹奏楽セッティングの Android 版（または Web 版）を作るかどうかを、登録数で判断する
2. 作ることになった場合の Google Play クローズドテスト（新規個人アカウントは 12 人・14 日間が必須）のテスター候補を、開発前に確保しておく
3. 「Android で作りたい」のか「学校の PC・Chromebook のブラウザで作りたい」のかを分けて数える

### 0.2 釣果ログ版との違い（重要）

釣果ログの `/android/` は「iPhone か Android か」の二択で、機種（Pixel / Galaxy / Xperia）を聞いている。吹奏楽セッティングでは **機種は聞かず**、代わりに次の 2 問を聞く。

| 項目 | 内容 | 必須 |
|---|---|---|
| `platform_wish`（アンケート ID `platform-wish-v1`） | 配置図を作るときに使いたい端末 | 必須 |
| `role`（アンケート ID `role-v1`） | 立場（アプリ内フォームと同じ選択肢・同じ内部値） | 任意 |

理由：このアプリは iPad で編集する前提であり、閲覧だけなら PDF 出力で足りる。学校現場の主な端末は Chromebook・Windows・iPad であり、Android タブレットはほとんど無い。したがって「Android 版が欲しい」の中身が実際には「ブラウザ版が欲しい」であることが多く、分けて数えないと開発する物を間違える。

### 0.3 判断基準（あらかじめ決めておく）

| 判断 | 基準 | 時期 |
|---|---|---|
| Android 版に着手 | `role = teacher` の登録が 10 件以上、かつ全登録のうち `platform_wish = android` が過半数 | 2027 年 5 月末 |
| Web 版（閲覧専用でも可）の検討に切り替え | `platform_wish = browser` が過半数 | 2027 年 5 月末 |
| どちらも着手しない | 全登録が 15 件未満 | 2027 年 5 月末 |

定期演奏会シーズン（10〜12 月）と新入部員シーズン（3〜5 月）の両方を通した数字で判断する。3 月時点では判断しない。

### 0.4 送ってはいけないもの（厳守）

配置図の中身、団体名、生徒名、位置情報、端末を識別する ID。サイトのフォームからはメールアドレスと 2 問の回答と `src` だけを送る。

---

## 1. Worker 側の変更（`mw-feedback-worker`）

新しいテーブル・新しいエンドポイントは作らない。既存の `/wish` 系を次の 5 点で拡張する。**`app=choka-log` の動作は一切変えない**（釣果ログのフォームは `device` を送り続ける。`platform_wish`/`role` は来ないので NULL のまま）。

`topic` は吹奏楽でも `android` のまま使う（`ALLOWED_TOPICS` は変えない）。Android か Web かは `platform_wish` 列で区別する。

### 1.1 スキーマ：列を 2 つ追加（`schema.sql` に追記し、本番にも適用）

```sql
-- 2026-09-13 追加（ensemble-stage の Android/Web 希望登録）
ALTER TABLE wish_signups ADD COLUMN platform_wish TEXT;  -- android | browser | either | NULL
ALTER TABLE wish_signups ADD COLUMN role TEXT;           -- teacher | student | community | NULL
```

`ALTER TABLE ... ADD COLUMN` は再実行するとエラーになるため、`schema.sql` の `CREATE TABLE IF NOT EXISTS wish_signups` 本体にも同じ 2 列を追加しておき（新規環境用）、本番には `ALTER` だけを個別に流す：

```bash
npx wrangler d1 execute mw-feedback --remote --command "ALTER TABLE wish_signups ADD COLUMN platform_wish TEXT"
npx wrangler d1 execute mw-feedback --remote --command "ALTER TABLE wish_signups ADD COLUMN role TEXT"
```

### 1.2 `SITE_BASE` をアプリ別にする（`wrangler.jsonc` と `resolveReturn` / `handleWishUnsubscribe`）

現状 `SITE_BASE` が釣果ログ固定のため、吹奏楽から `return` 無し（または許可外ホスト）で送ると釣果ログのページに戻り、解除リンクも釣果ログの `/android/unsubscribed/` に飛ぶ。これを直す。

`wrangler.jsonc` の `vars` に追加（`SITE_BASE` は互換のため残す）：

```jsonc
"SITE_BASES": "{\"choka-log\":\"https://chokalog.margheritaworks.com\",\"ensemble-stage\":\"https://ensemblestage.margheritaworks.com\"}"
```

`Env` に `SITE_BASES: string` を追加し、次の関数を足す：

```ts
function siteBase(env: Env, app: string | null | undefined): string {
  try {
    const m = JSON.parse(env.SITE_BASES ?? "{}") as Record<string, string>;
    if (app && m[app]) return m[app];
  } catch { /* ignore */ }
  return env.SITE_BASE;
}
```

- `resolveReturn(env, ret, fallbackPath)` に第 4 引数 `app` を足し、フォールバックを `siteBase(env, app) + fallbackPath` にする。`handleWish` では `b.app`（文字列なら）を渡す。`app` の検証前に呼んでいるので、不正な `app` なら `env.SITE_BASE` に落ちる（現状と同じ）
- `handleWishUnsubscribe` のリダイレクト先を `siteBase(env, app) + "/android/unsubscribed/"` にする（`app` は検証済み）

### 1.3 `POST /wish`：`platform_wish` と `role` を受け付ける（`handleWish`）

定数を追加：

```ts
const PLATFORM_WISHES = new Set(["android", "browser", "either"]);
const ROLES = new Set(["teacher", "student", "community"]);
const PLATFORM_REQUIRED_APPS = new Set(["ensemble-stage"]);
```

`email` 検証の直後に追加：

```ts
const platformWish = typeof b.platform_wish === "string" && PLATFORM_WISHES.has(b.platform_wish) ? b.platform_wish : null;
const role = typeof b.role === "string" && ROLES.has(b.role) ? b.role : null;
if (PLATFORM_REQUIRED_APPS.has(app) && platformWish === null) {
  if (isJson) throw new HttpError(400, "端末の希望を選んでください");
  return redirect(ret + "#error-platform");
}
```

upsert を次に差し替える（`device` の COALESCE と同じ流儀）：

```ts
await env.DB.prepare(
  `INSERT INTO wish_signups (received_at, app, topic, email, email_norm, device, src, unsub_token, status, platform_wish, role)
   VALUES (?,?,?,?,?,?,?,?,'active',?,?)
   ON CONFLICT(app, topic, email_norm) DO UPDATE SET
     status='active',
     received_at=excluded.received_at,
     device=COALESCE(excluded.device, wish_signups.device),
     src=COALESCE(excluded.src, wish_signups.src),
     platform_wish=COALESCE(excluded.platform_wish, wish_signups.platform_wish),
     role=COALESCE(excluded.role, wish_signups.role)`
).bind(now, app, topic, email, emailNorm, device, src, token, platformWish, role).run();
```

`poll_answers` にも同時に書く（アプリ内の `role-v1` と同じ集計 API `GET /poll/summary` で並べて見るため。メールアドレスは書かない）：

```ts
if (platformWish) {
  await env.DB.prepare("INSERT INTO poll_answers (received_at, app, q, answer, source) VALUES (?,?,?,?,'web')")
    .bind(now, app, "platform-wish-v1", platformWish).run();
}
if (role) {
  await env.DB.prepare("INSERT INTO poll_answers (received_at, app, q, answer, source) VALUES (?,?,?,?,'web')")
    .bind(now, app, "role-v1", role).run();
}
```

注意：再登録（upsert の UPDATE 側）でも `poll_answers` には毎回 1 行入る。`/wish/summary` の件数が正であり、`poll_answers` 側は参考値と割り切る。厳密にしたい場合は upsert の `meta.changes` では INSERT/UPDATE を区別できないため、事前に `SELECT 1 FROM wish_signups WHERE app=? AND topic=? AND email_norm=?` で存在確認し、新規のときだけ `poll_answers` に書く。**本仕様では事前 SELECT 方式を採用する**。

### 1.4 `GET /wish/summary`・`GET /wish/export`：内訳と列を追加

`handleWishSummary` の `Promise.all` に 2 本追加し、レスポンスに `by_platform_wish` と `by_role` を足す：

```ts
env.DB.prepare(`SELECT platform_wish, COUNT(*) AS n ${base} GROUP BY platform_wish ORDER BY n DESC`).bind(app, topic).all(),
env.DB.prepare(`SELECT role, COUNT(*) AS n ${base} GROUP BY role ORDER BY n DESC`).bind(app, topic).all(),
```

`handleWishExport` の SELECT とヘッダー行に `platform_wish,role` を追加する（`device` の後ろ）。

`package.json` の `wish:summary` スクリプトを次に差し替える：

```json
"wish:summary": "wrangler d1 execute mw-feedback --remote --command \"SELECT app,topic,platform_wish,role,src,status,COUNT(*) AS n FROM wish_signups GROUP BY app,topic,platform_wish,role,src,status ORDER BY app,n DESC\""
```

### 1.5 デプロイ順

1. `schema.sql` 更新 → 本番に `ALTER` 2 本を流す（§1.1）
2. `wrangler.jsonc` に `SITE_BASES` 追加、`src/index.ts` 修正
3. `npm run deploy`
4. §5 の Worker の受け入れ確認（釣果ログ側の既存動作の確認を含む）

### 1.6 既存への影響（確認済み）

以下の理由で、釣果ログのフォーム・各 iOS アプリの `/feedback`・投票フォーム `/poll` には影響しない。

- 追加する 2 列は NULL 許容・既定値なし。既存行と既存の列名指定 `INSERT` はそのまま動く。**ただし §1.5 の順序（`ALTER` → デプロイ）を守ること。**逆にすると新コードの `INSERT` が失敗し、釣果ログ側の登録も止まる
- `SITE_BASE` は残し、`siteBase()` は該当アプリが無ければ `SITE_BASE` に落ちる。`choka-log` の戻り先は変わらない
- 必須チェックは `PLATFORM_REQUIRED_APPS`（`ensemble-stage` のみ）に限定。`choka-log` は新 2 列が NULL のまま upsert される。`poll_answers` への書き込みは新 2 列が非 NULL のときだけ
- `/wish/summary` はキーの追加のみ。`/wish/export` は CSV の列が `device` の後ろに 2 つ増える（列位置で読む既存スクリプトは無い）
- `/feedback`・`/poll`・`/poll/summary`・回数制限・CORS・解除トークンの生成方法は変更しない。配布済みの解除リンクも有効なまま

デプロイ前に確認すること：

- `wrangler.jsonc` の `vars`（`ALLOWED_APPS` 9 件など）が本番の Variables と一致していること。ダッシュボードで直接編集した値があると、ファイルからのデプロイで上書きされる。`npx wrangler deploy --dry-run` またはダッシュボードで照合する
- 回数制限 `rl:wish:` はアプリ別ではなく IP 別（1 日 3 件）。受け入れ確認で釣果ログと吹奏楽の両フォームを同じ回線から続けて試すと 4 回目で 429 になる。KV の該当キーを削除するか、日を分けて確認する

---

## 2. サポートサイト側（`ensemblestage.margheritaworks.com/android/`）

### 2.1 ページの作り

釣果ログの `chokalog.margheritaworks.com/android/` と**同じ構造・同じスタイル・同じ送信方式**で作る。ヘッダー・フッター・ナビは吹奏楽セッティングのサポートサイトのものを使う。既存ページの HTML/CSS/JS をコピーして、本節の差分だけ変える。

URL：`https://ensemblestage.margheritaworks.com/android/`
あわせて `https://ensemblestage.margheritaworks.com/android/unsubscribed/`（解除完了ページ。釣果ログ版と同じ文面でアプリ名だけ変える）を作る。§1.2 の `SITE_BASES` がここに飛ばす。

`?src=` を受け取り、hidden フィールドで Worker に送る（既存と同じ）。

### 2.2 文言

**title / og:title**
```
Android版・Web版を検討しています｜吹奏楽セッティング
```

**meta description / og:description**
```
吹奏楽セッティングのAndroid版・ブラウザ版は、希望される方の人数を見て作るかどうかを決めます。メールアドレスをご登録いただくと、公開前のテストや公開のお知らせをお送りします。
```

**本文**

```
ANDROID・WEB

# Android版・Web版を検討しています

現在は iPhone・iPad 版のみです。Android 版、またはパソコンのブラウザで使える版は、
**希望される方の人数を見て**作るかどうかを決めます。

登録いただいた方には、（作ることになった場合）公開前のテスト参加のお願いと、
公開のお知らせをメールでお送りします。それ以外の目的には使いません。いつでも解除できます。
```

**フォーム**

```
メールアドレス                       [必須]

配置図を作るとき、どの端末を使いたいですか   [必須・単一選択]
  ○ Android のスマートフォン・タブレット
  ○ パソコンのブラウザ（学校の PC・Chromebook を含む）
  ○ どちらでもよい

あなたの立場（任意）                  [単一選択]
  ○ 顧問・指導者
  ○ 学生指揮者・部長・部員
  ○ 一般団体の運営

登録いただいたアドレスは、Android 版・Web 版のテスト参加のお願いと公開のお知らせにのみ使います。
メール内のリンクからいつでも解除できます。[プライバシーポリシー]

[ Android版・Web版を希望する ]
```

**送信後（`#thanks`）**
```
登録しました。作ることになったら、テストのお願いをメールでお送りします。
```

**エラー**
```
#error-email     メールアドレスの形式を確認してください。
#error-platform  端末の希望を選んでください。
#error-rate      しばらく時間をおいて、もう一度お試しください。
```

**末尾**
```
iPhone・iPad 版はこちらからご利用いただけます。
[App Store でダウンロード]  → https://apps.apple.com/jp/app/id6793795823
```

### 2.3 フォームの実装

- `action="https://api.margheritaworks.com/wish"`、`method="post"`（釣果ログ版と同じ）
- hidden：
  - `app=ensemble-stage`
  - `topic=android`（吹奏楽でも `android` のまま。§1 参照）
  - `src=<URL の ?src=>`（無ければ送らない）
  - `return=https://ensemblestage.margheritaworks.com/android/`（Worker が `#thanks` 等を付けて戻す）
  - ハニーポット `website`（見た目は非表示、`autocomplete="off"`、`tabindex="-1"`）
- `platform_wish` はラジオボタン `name="platform_wish"`、値は `android` / `browser` / `either`。3 つのうち 1 つに `required` を付ける
- `role` はラジオボタン `name="role"`、値は `teacher` / `student` / `community`。未選択なら送らない
- **`device` は送らない**。釣果ログ版にある機種（Pixel / Galaxy / Xperia）の選択肢は入れない
- 戻ってきた URL の `#thanks` / `#error-email` / `#error-platform` / `#error-rate` に応じて、釣果ログ版と同じ仕組みでメッセージを表示する。`#error-platform` の表示を 1 つ追加する
- 送信ボタンは二重送信防止のため送信中は無効化する

### 2.4 サポートサイト内の導線

1. FAQ に 1 項目追加：
   ```
   Q. Android 版・パソコン版はありますか？
   A. 現在は iPhone・iPad 版のみです。希望される方の人数を見て作るかどうかを決めます。
      こちらから登録をお願いします → /android/?src=faq
   ```
2. フッターのナビに「Android版・Web版」のリンクを追加（`/android/?src=site`）
3. X `@ensemble_stage` のプロフィールリンク・固定ポスト用：`/android/?src=x`

`src` の値一覧：`site`（サポートサイト）、`faq`、`x`、`app`（アプリ内）、`mail`（サポート返信）。いずれも `[a-z0-9-]{1,16}` を満たす。

---

## 3. iOS アプリ側（導線の追加のみ）

Xcode 側で作るのは設定画面のリンク 1 行だけ。フォームをアプリ内に作らない。

### 3.1 設定画面

既存の「フィードバック」セクションに外部リンク行を 1 つ足す：

```
フィードバック
  ご意見を送る                       ›
  Android版・Web版を希望する          ↗   ← https://ensemblestage.margheritaworks.com/android/?src=app
  App Storeでレビューを書く           ↗
```

- `Label` に `arrow.up.forward` を付ける（既存の外部リンク行と同じ）
- `UIApplication.shared.open` で Safari を開く（アプリ内ブラウザにしない）
- URL は `Info.plist` またはビルド設定の定数 `ANDROID_WISH_URL` として持ち、コードに直書きしない

### 3.2 「ご意見を送る」フォームの補助（任意）

「ご意見を送る」の自由記述に「Android」または「アンドロイド」という語が含まれて送信されたとき、送信完了後のアラートに次の 1 行を足す（送信内容は変えない）：

```
Android 版・Web 版のご希望は、設定の「Android版・Web版を希望する」からも登録できます。
```

実装が煩雑なら省略してよい。

### 3.3 プライバシー申告

変更なし。アプリからは外部リンクを開くだけで、データを送らない。

---

## 4. 運用

- `support@` に「Android 版はないのか」という自由記述が届いたら、返信に `https://ensemblestage.margheritaworks.com/android/?src=mail` を添える
- 週次レポート（`mw-marketing`）は `GET /wish/summary?app=ensemble-stage&topic=android` を呼び、`total_active`・`by_platform_wish`・`by_role` を吹奏楽の欄に載せる。釣果ログの `android-wish` 件数と同じ場所に並べる
- 判断は §0.3 の基準で 2027 年 5 月末に行う。それまでは数字を見ても方針を変えない
- テスト招待を送ったら `invited_at` を手動更新する（釣果ログと同じ運用）

---

## 5. 受け入れ確認

Worker：
- [ ] 本番の `wish_signups` に `platform_wish`・`role` 列がある
- [ ] `POST /wish`（JSON、`app=ensemble-stage`）で `platform_wish` 無しなら `400 {"message":"端末の希望を選んでください"}`。form POST なら `return#error-platform` へ 303
- [ ] `POST /wish`（`app=ensemble-stage`, `platform_wish=android`, `role=teacher`）で 204。`wish_signups` に 1 行（`device` は NULL）、`poll_answers` に `platform-wish-v1` と `role-v1` の各 1 行
- [ ] 同じメールで `platform_wish=browser` を再送すると、`wish_signups` は 1 行のまま `platform_wish` が `browser` に更新され、`poll_answers` は増えない
- [ ] `POST /wish`（`app=choka-log`, `device=pixel`）が変更前と同じ結果（`platform_wish`/`role` を送っても NULL のまま、必須チェックにかからない）
- [ ] `app=ensemble-stage` で `return` を省略して form POST すると `https://ensemblestage.margheritaworks.com/android/#thanks` に戻る（釣果ログのサイトに飛ばない）
- [ ] `GET /wish/unsubscribe?app=ensemble-stage&topic=android&t=<token>` で `status='unsubscribed'` になり、`https://ensemblestage.margheritaworks.com/android/unsubscribed/` へ 303。`app=choka-log` は従来どおり釣果ログの解除ページへ
- [ ] `GET /wish/summary?app=ensemble-stage&topic=android` に `by_platform_wish`・`by_role` がある
- [ ] `GET /wish/export?app=ensemble-stage&topic=android` の CSV に `platform_wish,role` 列がある
- [ ] `GET /poll/summary?app=ensemble-stage&q=platform-wish-v1` で件数が見える
- [ ] `website` に値を入れて送ると成功したふりをして何も保存されない（既存どおり）

サポートサイト：
- [ ] `/android/?src=x` から送信すると `wish_signups.src` に `x` が入る
- [ ] 端末の希望を選ばずに送信すると、ブラウザの `required` で止まる。`required` を外して送ると `#error-platform` のメッセージが出る
- [ ] 機種（Pixel 等）の選択肢が無く、`device` を送っていない
- [ ] `/android/unsubscribed/` が存在する
- [ ] FAQ とフッターからページに辿り着ける
- [ ] スマートフォン幅で表示が崩れない

iOS：
- [ ] 設定画面の「フィードバック」に「Android版・Web版を希望する」の行があり、Safari で `?src=app` 付きの URL が開く
- [ ] `ANDROID_WISH_URL` がコードに直書きされていない
