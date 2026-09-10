# 「Android版を希望する」ページ 設計仕様（サポートサイト＋共用 Worker）

作成日：2026-09-10
対象：`chokalog.margheritaworks.com/android/`（静的ページ）と `mw-feedback-worker`（`api.margheritaworks.com`）への機能追加
前提文書：`mw-feedback-worker-spec.md`（2026-09-09）。本仕様はその**追記**であり、既存の `/feedback` `/poll` `/poll/summary` は変更しない。

---

## 0. 目的と方針

- 目的：Android 版の需要を**メール登録数**として数え、需要が見えた時点で登録者を Google Play クローズドテスト（12 人 × 14 日）のテスターとして招く。
- 方針：
  - サポートサイトは静的（JS なしで動く `<form>`）。既存の投票フォームと同じ作り。
  - メールアドレスは個人情報なので、**投票（`poll_answers`）とは別テーブル**に入れ、後で一括削除・一覧出力ができるようにする。
  - 登録直後の通知メールは送らない（1 件ごとに `support@` へ届くと邪魔）。週次レポートで件数を見る。
  - 二重オプトイン（確認メール）は**やらない**。母数が数十人規模で、誤登録の害が小さいため。代わりに登録解除リンクを必ず付ける。
  - スパム対策は「ハニーポット＋回数制限」から始め、実際にスパムが来たら Turnstile を足す。

---

## 1. サポートサイト側

### 1.1 URL 構成

| URL | 内容 |
|---|---|
| `/android/` | 登録ページ本体（`/android/index.html`） |
| `/android/#thanks` | 登録完了の表示（同ページ内、CSS の `:target` で出す） |
| `/android/#error-email` | メール形式エラーの表示（同上） |
| `/android/#error-rate` | 回数制限の表示（同上） |
| `/android/unsubscribed/` | 登録解除完了ページ（静的） |

流入元は `?src=ig` `?src=x` `?src=fb` `?src=site` で受け取り、hidden に写す（JS 1 行。JS が無効なら空で送る）。

### 1.2 ページ構成（上から）

1. 見出し：「Android 版を検討しています」
2. 説明（3〜4 行）
   - 現在は iPhone 版のみ。Android 版は**希望される方の人数を見て**作るかどうか決める
   - 登録いただいた方には、（作る場合）公開前のテスト参加のお願いと、公開のお知らせをメールで送る
   - それ以外の目的には使わない。いつでも解除できる
3. フォーム（§1.3）
4. 「iPhone 版はこちら」の App Store リンク（`site` キャンペーンリンク）
5. 完了メッセージ／エラーメッセージ（`:target` で表示）

### 1.3 フォーム HTML

```html
<form method="post" action="https://api.margheritaworks.com/wish" class="wish-form">
  <input type="hidden" name="app" value="choka-log">
  <input type="hidden" name="topic" value="android">
  <input type="hidden" name="src" id="src" value="">
  <input type="hidden" name="return" value="https://chokalog.margheritaworks.com/android/">

  <!-- ハニーポット。人には見えない。埋まっていたらボットとみなす -->
  <div class="hp" aria-hidden="true">
    <label>ウェブサイト <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
  </div>

  <label for="email">メールアドレス</label>
  <input type="email" id="email" name="email" required maxlength="254"
         inputmode="email" autocomplete="email" placeholder="you@example.com">

  <fieldset>
    <legend>お使いの Android 端末（任意）</legend>
    <label><input type="radio" name="device" value="pixel"> Pixel</label>
    <label><input type="radio" name="device" value="galaxy"> Galaxy</label>
    <label><input type="radio" name="device" value="xperia"> Xperia</label>
    <label><input type="radio" name="device" value="other"> その他</label>
  </fieldset>

  <p class="note">登録いただいたアドレスは、Android 版のテスト参加のお願いと公開のお知らせにのみ使います。
  メール内のリンクからいつでも解除できます。<a href="/privacy/">プライバシーポリシー</a></p>

  <button type="submit">Android 版を希望する</button>
</form>

<div id="thanks" class="flash">登録しました。作ることになったら、テストのお願いをメールでお送りします。</div>
<div id="error-email" class="flash flash-error">メールアドレスの形式を確認してください。</div>
<div id="error-rate" class="flash flash-error">しばらく時間をおいて、もう一度お試しください。</div>

<script>
  // ?src=ig などを hidden に写す。JS が無くてもフォーム自体は動く
  document.getElementById('src').value =
    (new URLSearchParams(location.search).get('src') || '').slice(0, 16);
</script>
```

CSS（要点）：

```css
.hp { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
.flash { display:none; margin-top:1.5rem; padding:1rem; border-radius:.5rem; background:#eef6ee; }
.flash-error { background:#fbeeee; }
.flash:target { display:block; }
```

`:target` を使うため、完了・エラー時は Worker が `/android/#thanks` 等へ 303 で戻す。JS もサーバー側テンプレートも要らない。

### 1.4 登録解除ページ `/android/unsubscribed/`

「登録を解除しました。」の 1 文と、サポートサイトトップへのリンクだけ。Worker の `GET /wish/unsubscribe` がここへ 303 で戻す。

### 1.5 プライバシーポリシー `/privacy/` への追記

「お知らせの配信希望」の項を追加する。

> Android 版などのお知らせを希望される方から、メールアドレスをお預かりすることがあります。お預かりしたアドレスは、テスト参加のお願いと公開のお知らせの送信にのみ使用し、第三者に提供しません。お知らせメール内のリンク、または `support@margheritaworks.com` へのご連絡により、いつでも削除できます。

### 1.6 各所からの導線

| 置き場所 | URL |
|---|---|
| Instagram リンク欄（表示名「Android版を希望する」） | `https://chokalog.margheritaworks.com/android/?src=ig` |
| X（Margherita Works）固定ポストの補足、返信用 | `…/android/?src=x` |
| Facebook ページの「詳細」欄 | `…/android/?src=fb` |
| サポートサイトのトップ（「Android 版について」の 1 行） | `…/android/?src=site` |
| App Store 説明文の末尾（「Android 版のご希望はサポートサイトから」） | `…/android/?src=appstore` |

---

## 2. Worker 側

### 2.1 追加するもの

| 項目 | 内容 |
|---|---|
| テーブル | `wish_signups` |
| エンドポイント | `POST /wish`（登録）、`GET /wish/unsubscribe`（解除）、`GET /wish/summary`（集計）、`GET /wish/export`（一覧 CSV） |
| 環境変数 | `SITE_BASE`（返り先の既定。`https://chokalog.margheritaworks.com`） |
| シークレット | `UNSUB_SALT`（解除トークン生成用。`openssl rand -hex 16`） |
| 回数制限 | `/wish`：1 日に 3 件／IP |

`ALLOWED_APPS`・`ALLOWED_RETURN_HOSTS`・`SUMMARY_TOKEN`・`IP_SALT`・KV・D1 は既存のものをそのまま使う。

### 2.2 schema.sql への追記

```sql
CREATE TABLE IF NOT EXISTS wish_signups (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at  TEXT NOT NULL,
  app          TEXT NOT NULL,             -- choka-log
  topic        TEXT NOT NULL,             -- android（将来 ipad など追加可）
  email        TEXT NOT NULL,             -- 表示用（入力そのまま、trim のみ）
  email_norm   TEXT NOT NULL,             -- 小文字化。重複判定用
  device       TEXT,                      -- pixel | galaxy | xperia | other | NULL
  src          TEXT,                      -- ig | x | fb | site | appstore | NULL
  unsub_token  TEXT NOT NULL,             -- 解除用。sha256(email_norm + UNSUB_SALT) の先頭 32 桁
  status       TEXT NOT NULL DEFAULT 'active',  -- active | unsubscribed
  invited_at   TEXT,                      -- テスト招待メールを送った日時（手動更新）
  UNIQUE (app, topic, email_norm)
);
CREATE INDEX IF NOT EXISTS idx_wish_app_topic ON wish_signups(app, topic, status);
```

既存 DB への適用：`npx wrangler d1 execute mw-feedback --remote --file=schema.sql`（`IF NOT EXISTS` なので再実行で壊れない）。

### 2.3 `POST /wish`

`application/x-www-form-urlencoded`（サイトの `<form>`）と JSON の両方を受ける。

フィールド：

| 名前 | 必須 | 検証 |
|---|---|---|
| `app` | 必須 | `ALLOWED_APPS` に含まれる |
| `topic` | 必須 | `^[a-z0-9-]{1,32}$`。当面は `android` のみ許可（`ALLOWED_TOPICS` を定数で持つ） |
| `email` | 必須 | trim 後 254 字以内、`^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| `device` | 任意 | `pixel|galaxy|xperia|other`。それ以外は NULL |
| `src` | 任意 | `^[a-z0-9-]{1,16}$`。それ以外は NULL |
| `website` | 任意 | **空でなければボット**（ハニーポット） |
| `return` | 任意 | `ALLOWED_RETURN_HOSTS` のホストのみ。無ければ `SITE_BASE + "/android/"` |

処理：

1. 回数制限（`rl:wish:<hash>`、3 件／日）。超過 → form なら `303 → return#error-rate`、JSON なら `429`
2. ハニーポットが埋まっていれば **何もせず** `303 → return#thanks`（ボットに成功したと思わせる）
3. 検証。メール形式エラー → form なら `303 → return#error-email`、JSON なら `400`
4. `email_norm = email.trim().toLowerCase()`、`unsub_token = sha256(email_norm + UNSUB_SALT)` の先頭 32 桁（hex）
5. `INSERT … ON CONFLICT(app, topic, email_norm) DO UPDATE SET status='active', received_at=excluded.received_at, device=COALESCE(excluded.device, device), src=COALESCE(excluded.src, src)`
   - 重複登録は上書き扱いにし、**登録済みかどうかを外から判別できないようにする**（列挙防止）
   - 一度解除した人が再登録したら `active` に戻す
6. form なら `303 → return#thanks`、JSON なら `204`

通知メールは送らない。

### 2.4 `GET /wish/unsubscribe?app=<app>&topic=<topic>&t=<token>`

- `t` が 32 桁 hex でなければ `400`
- `UPDATE wish_signups SET status='unsubscribed' WHERE app=? AND topic=? AND unsub_token=?`
- 該当があってもなくても `303 → SITE_BASE + "/android/unsubscribed/"`（列挙防止）
- 回数制限は掛けない（解除は妨げない）

このリンクをテスト招待メールと公開告知メールの末尾に必ず入れる：
`https://api.margheritaworks.com/wish/unsubscribe?app=choka-log&topic=android&t=<unsub_token>`

### 2.5 `GET /wish/summary?app=<app>&topic=<topic>`

- `Authorization: Bearer <SUMMARY_TOKEN>` 必須（既存と同じ）
- レスポンス：

```json
{
  "total_active": 23,
  "by_src":    [ { "src": "ig", "n": 15 }, { "src": "x", "n": 4 }, { "src": null, "n": 4 } ],
  "by_device": [ { "device": "pixel", "n": 9 }, { "device": null, "n": 8 } ],
  "by_week":   [ { "week": "2026-W38", "n": 6 }, { "week": "2026-W39", "n": 9 } ],
  "invited":   5
}
```

`status='active'` のみ数える。週次レポート（`mw-marketing`）はこれを呼んで「Android 希望：累計 23（今週 +9）」と出す。

### 2.6 `GET /wish/export?app=<app>&topic=<topic>`

- `Authorization: Bearer <SUMMARY_TOKEN>` 必須
- `text/csv; charset=utf-8` で `received_at,email,device,src,status,invited_at,unsub_token` を返す（`status='active'` のみ）
- 用途：着手判断の時に一覧を落とし、Gmail から BCC でテスト招待を送る。20〜30 人規模なので配信サービスは使わない
- 送った後は手動で `invited_at` を入れる：
  `npx wrangler d1 execute mw-feedback --remote --command "UPDATE wish_signups SET invited_at=datetime('now') WHERE app='choka-log' AND topic='android' AND status='active' AND invited_at IS NULL"`

### 2.7 wrangler.jsonc への追記

```jsonc
"vars": {
  // 既存の値はそのまま
  "SITE_BASE": "https://chokalog.margheritaworks.com"
}
```

シークレット追加：`npx wrangler secret put UNSUB_SALT`

### 2.8 src/index.ts への追記

`Env` に `SITE_BASE: string; UNSUB_SALT: string;` を足し、以下を追加する。既存関数（`rateLimit`・`readBody`・`allowedApps`・`corsHeaders`・`json`・`HttpError`）を再利用する。

```ts
const ALLOWED_TOPICS = new Set(["android"]);
const DEVICES = new Set(["pixel", "galaxy", "xperia", "other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SRC_RE = /^[a-z0-9-]{1,16}$/;
const TOPIC_RE = /^[a-z0-9-]{1,32}$/;
const TOKEN_RE = /^[0-9a-f]{32}$/;

async function sha256Hex(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function resolveReturn(env: Env, ret: unknown, fallbackPath: string): string {
  if (typeof ret === "string") {
    try {
      const u = new URL(ret);
      const hosts = new Set(env.ALLOWED_RETURN_HOSTS.split(",").map(s => s.trim()));
      if (u.protocol === "https:" && hosts.has(u.hostname)) { u.hash = ""; return u.toString(); }
    } catch { /* ignore */ }
  }
  return env.SITE_BASE + fallbackPath;
}

const redirect = (to: string) => new Response(null, { status: 303, headers: { location: to } });

async function handleWish(req: Request, env: Env): Promise<Response> {
  const isJson = (req.headers.get("content-type") ?? "").includes("application/json");
  const b = await readBody(req);
  const ret = resolveReturn(env, b.return, "/android/");

  // 回数制限
  try {
    await rateLimit(req, env, "wish", 3, 86400);
  } catch (e) {
    if (isJson) throw e;
    return redirect(ret + "#error-rate");
  }

  // ハニーポット：ボットには成功したふりをする
  if (typeof b.website === "string" && b.website.trim() !== "") {
    return isJson ? new Response(null, { status: 204, headers: corsHeaders(req) }) : redirect(ret + "#thanks");
  }

  const app = b.app;
  if (typeof app !== "string" || !allowedApps(env).has(app)) throw new HttpError(400, "app が不正です");
  const topic = b.topic;
  if (typeof topic !== "string" || !TOPIC_RE.test(topic) || !ALLOWED_TOPICS.has(topic)) throw new HttpError(400, "topic が不正です");

  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (email.length === 0 || email.length > 254 || !EMAIL_RE.test(email)) {
    if (isJson) throw new HttpError(400, "メールアドレスの形式が正しくありません");
    return redirect(ret + "#error-email");
  }
  const emailNorm = email.toLowerCase();
  const device = typeof b.device === "string" && DEVICES.has(b.device) ? b.device : null;
  const src = typeof b.src === "string" && SRC_RE.test(b.src) ? b.src : null;
  const token = (await sha256Hex(emailNorm + env.UNSUB_SALT)).slice(0, 32);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO wish_signups (received_at, app, topic, email, email_norm, device, src, unsub_token, status)
     VALUES (?,?,?,?,?,?,?,?,'active')
     ON CONFLICT(app, topic, email_norm) DO UPDATE SET
       status='active',
       received_at=excluded.received_at,
       device=COALESCE(excluded.device, wish_signups.device),
       src=COALESCE(excluded.src, wish_signups.src)`
  ).bind(now, app, topic, email, emailNorm, device, src, token).run();

  return isJson ? new Response(null, { status: 204, headers: corsHeaders(req) }) : redirect(ret + "#thanks");
}

async function handleWishUnsubscribe(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const app = url.searchParams.get("app") ?? "";
  const topic = url.searchParams.get("topic") ?? "";
  const t = url.searchParams.get("t") ?? "";
  if (!allowedApps(env).has(app) || !ALLOWED_TOPICS.has(topic) || !TOKEN_RE.test(t)) throw new HttpError(400, "リンクが不正です");
  await env.DB.prepare("UPDATE wish_signups SET status='unsubscribed' WHERE app=? AND topic=? AND unsub_token=?")
    .bind(app, topic, t).run();
  return redirect(env.SITE_BASE + "/android/unsubscribed/");
}

function requireToken(req: Request, env: Env) {
  if ((req.headers.get("Authorization") ?? "") !== `Bearer ${env.SUMMARY_TOKEN}`) throw new HttpError(401, "unauthorized");
}

async function handleWishSummary(req: Request, env: Env): Promise<Response> {
  requireToken(req, env);
  const url = new URL(req.url);
  const app = url.searchParams.get("app") ?? "choka-log";
  const topic = url.searchParams.get("topic") ?? "android";
  const base = "FROM wish_signups WHERE app=? AND topic=? AND status='active'";
  const [total, bySrc, byDevice, byWeek, invited] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS n ${base}`).bind(app, topic).first<{ n: number }>(),
    env.DB.prepare(`SELECT src, COUNT(*) AS n ${base} GROUP BY src ORDER BY n DESC`).bind(app, topic).all(),
    env.DB.prepare(`SELECT device, COUNT(*) AS n ${base} GROUP BY device ORDER BY n DESC`).bind(app, topic).all(),
    env.DB.prepare(`SELECT strftime('%Y-W%W', received_at) AS week, COUNT(*) AS n ${base} GROUP BY week ORDER BY week`).bind(app, topic).all(),
    env.DB.prepare(`SELECT COUNT(*) AS n ${base} AND invited_at IS NOT NULL`).bind(app, topic).first<{ n: number }>(),
  ]);
  return json(200, {
    total_active: total?.n ?? 0,
    by_src: bySrc.results, by_device: byDevice.results, by_week: byWeek.results,
    invited: invited?.n ?? 0,
  });
}

async function handleWishExport(req: Request, env: Env): Promise<Response> {
  requireToken(req, env);
  const url = new URL(req.url);
  const app = url.searchParams.get("app") ?? "choka-log";
  const topic = url.searchParams.get("topic") ?? "android";
  const rows = await env.DB.prepare(
    "SELECT received_at,email,device,src,status,invited_at,unsub_token FROM wish_signups WHERE app=? AND topic=? AND status='active' ORDER BY received_at"
  ).bind(app, topic).all<Record<string, string | null>>();
  const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = ["received_at,email,device,src,status,invited_at,unsub_token",
    ...rows.results.map(r => [r.received_at, r.email, r.device, r.src, r.status, r.invited_at, r.unsub_token].map(esc).join(","))];
  return new Response("\uFEFF" + lines.join("\n"), {
    status: 200,
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="wish-${app}-${topic}.csv"` },
  });
}
```

`fetch` のルーティングに追加：

```ts
if (req.method === "POST" && url.pathname === "/wish") return await handleWish(req, env);
if (req.method === "GET"  && url.pathname === "/wish/unsubscribe") return await handleWishUnsubscribe(req, env);
if (req.method === "GET"  && url.pathname === "/wish/summary") return await handleWishSummary(req, env);
if (req.method === "GET"  && url.pathname === "/wish/export") return await handleWishExport(req, env);
```

`package.json` の scripts に追記：

```json
"wish:summary": "wrangler d1 execute mw-feedback --remote --command \"SELECT app,topic,src,status,COUNT(*) AS n FROM wish_signups GROUP BY app,topic,src,status\""
```

---

## 3. 週次レポート（`mw-marketing`）への組み込み

- 月曜のレポート生成時に `GET /wish/summary?app=choka-log&topic=android` を呼び、次の 2 行を釣果ログの節に足す：
  - `Android 希望：累計 <total_active> 件（今週 +<今週の by_week>）`
  - `内訳：ig <n> / x <n> / fb <n> / site <n>`
- 累計が **20 件** を超えた週は、レポート冒頭に「Android 着手の基準に達しました」を 1 行入れる（判断はマスタープラン §7 の通り）。

---

## 4. 動作確認

```bash
API=https://api.margheritaworks.com

# 正常（303 で #thanks に戻る）
curl -s -i -X POST $API/wish -d 'app=choka-log&topic=android&email=test%40example.com&device=pixel&src=ig&return=https://chokalog.margheritaworks.com/android/'
# → 303 Location: https://chokalog.margheritaworks.com/android/#thanks

# 同じアドレスの再登録（上書き。303 で #thanks。行は増えない）
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/wish -d 'app=choka-log&topic=android&email=TEST%40example.com'
# → 303

# メール形式エラー（#error-email）
curl -s -i -X POST $API/wish -d 'app=choka-log&topic=android&email=abc' | grep -i location
# → …/android/#error-email

# ハニーポット（DB に入らず #thanks）
curl -s -i -X POST $API/wish -d 'app=choka-log&topic=android&email=bot%40example.com&website=http://spam' | grep -i location

# 許可外の topic（400）
curl -s -X POST $API/wish -H 'content-type: application/json' -d '{"app":"choka-log","topic":"ipad","email":"a@b.co"}'

# 回数制限（4 回目が #error-rate）
for i in 1 2 3 4; do curl -s -i -X POST $API/wish -d "app=choka-log&topic=android&email=u$i%40example.com" | grep -i location; done

# 集計・CSV
curl -s "$API/wish/summary?app=choka-log&topic=android" -H "Authorization: Bearer <SUMMARY_TOKEN>"
curl -s "$API/wish/export?app=choka-log&topic=android"  -H "Authorization: Bearer <SUMMARY_TOKEN>" -o wish.csv

# 解除（CSV の unsub_token を使う）
curl -s -i "$API/wish/unsubscribe?app=choka-log&topic=android&t=<token>" | grep -i location
# → …/android/unsubscribed/

# 実機：iPhone の Instagram アプリ内ブラウザからリンク欄経由で登録し、#thanks が表示されること
```

---

## 5. 受け入れ確認

- [ ] `/android/?src=ig` を開き、送信後に `#thanks` の文が表示される（JS 有効・無効の両方）
- [ ] 不正なメールで `#error-email`、4 回目で `#error-rate` が表示される
- [ ] D1 の `wish_signups` に `src='ig'` `device` が入り、同一アドレスの再送で行が増えない
- [ ] ハニーポットを埋めた送信が D1 に入らない
- [ ] `/wish/summary` `/wish/export` がトークンなしで 401
- [ ] `unsub_token` のリンクで `status='unsubscribed'` になり、`/android/unsubscribed/` に戻る。解除後の再登録で `active` に戻る
- [ ] `/privacy/` に配信希望の項が追加されている
- [ ] KV・D1 に生の IP が無い。`UNSUB_SALT` がファイルに無い
- [ ] Instagram アプリ内ブラウザ（iOS）で一連の流れが通る

---

## 6. 将来の拡張（今はやらない）

- Turnstile：スパム登録が実際に来たら `<form>` にウィジェットを足し、Worker で `cf-turnstile-response` を検証する。ページの JS 依存が増えるので、来てから
- `topic` の追加：`ipad`・`mac` など。`ALLOWED_TOPICS` に足すだけ
- 招待メールの自動送信：20〜30 人規模では Gmail の BCC で足りる。100 人を超えたら `send_email` バインディングで Worker から送る
