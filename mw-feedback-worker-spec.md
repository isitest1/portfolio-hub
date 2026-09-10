# 共用フィードバック Worker 構築仕様（Margherita Works）

作成日：2026-09-09
対象：Cloudflare Workers ＋ D1 ＋ KV ＋ Email（send_email）
前提知識：このファイル単体で完結する。

## 0. 目的

Margherita Works の全アプリ（iOS アプリ内の「ご意見を送る」フォーム、各アプリのサポートサイト上の投票フォーム）から送られてくる **自由記述の意見** と **単一選択のアンケート回答** を、1つの Worker で受け取る。

- 自由記述は D1 に保存し、`support@margheritaworks.com` へメールで通知する
- アンケート回答は D1 に保存するだけで、通知しない（集計 API で見る）
- アプリは JSON の `app` フィールドで識別する

既存の他 Worker（例：釣果ログの海しる中継）とは **別の新規 Worker** として作る。責務を混ぜない。

---

## 1. 前提（人が先に済ませておくこと）

1. `margheritaworks.com` のゾーンが Cloudflare にあり、**Email Routing が有効**であること
2. Email Routing の **宛先アドレス（転送先の Gmail）が確認済み** であること。この Gmail アドレスを以下 `NOTIFY_TO` と呼ぶ
3. `wrangler` にログイン済み（`npx wrangler login`）であること
4. Node.js 20 以上

---

## 2. リポジトリ構成

リポジトリ名：`mw-feedback-worker`（プライベート）

```
mw-feedback-worker/
├─ package.json
├─ wrangler.jsonc
├─ schema.sql
├─ src/
│  └─ index.ts
└─ README.md   （このファイルの要約と運用コマンド）
```

### package.json

```json
{
  "name": "mw-feedback-worker",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "db:init:local": "wrangler d1 execute mw-feedback --local --file=schema.sql",
    "db:init": "wrangler d1 execute mw-feedback --remote --file=schema.sql",
    "summary": "wrangler d1 execute mw-feedback --remote --command \"SELECT app,q,answer,source,COUNT(*) AS n FROM poll_answers GROUP BY app,q,answer,source ORDER BY app,q,n DESC\""
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250000.0",
    "typescript": "^5.6.0",
    "wrangler": "^4.0.0"
  },
  "dependencies": {
    "mimetext": "^3.0.0"
  }
}
```

### wrangler.jsonc

`database_id` と `id` は、手順 4 で作成したあとに埋める。

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "mw-feedback-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-09-01",
  "compatibility_flags": ["nodejs_compat"],

  "routes": [
    { "pattern": "api.margheritaworks.com", "custom_domain": true }
  ],

  "d1_databases": [
    { "binding": "DB", "database_name": "mw-feedback", "database_id": "<D1のID>" }
  ],

  "kv_namespaces": [
    { "binding": "RATE", "id": "<KVのID>" }
  ],

  "send_email": [
    { "name": "EMAIL" }
  ],

  "vars": {
    "ALLOWED_APPS": "choka-log,ensemble-stage",
    "ALLOWED_RETURN_HOSTS": "margheritaworks.com,chokalog.margheritaworks.com,ensemblestage.margheritaworks.com",
    "MAIL_FROM": "noreply@margheritaworks.com",
    "APP_LABELS": "{\"choka-log\":\"釣果ログ\",\"ensemble-stage\":\"吹奏楽セッティング\"}"
  }
}
```

シークレット（`wrangler secret put` で登録。ファイルに書かない）：

| 名前 | 内容 |
|---|---|
| `NOTIFY_TO` | 通知先。Email Routing で確認済みの Gmail アドレス |
| `SUMMARY_TOKEN` | 集計 API 用のランダム文字列（`openssl rand -hex 32`） |
| `IP_SALT` | IP をハッシュ化する塩（`openssl rand -hex 16`） |

新しいアプリを追加するときは、`ALLOWED_APPS` と `APP_LABELS`（および必要なら `ALLOWED_RETURN_HOSTS`）に追記して再デプロイするだけでよい。

### schema.sql

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at TEXT NOT NULL,
  app         TEXT NOT NULL,
  type        TEXT NOT NULL,           -- bug | request | question | other
  message     TEXT NOT NULL,
  email       TEXT,
  diag_json   TEXT,
  source      TEXT NOT NULL,           -- app | web
  client_ts   TEXT
);

CREATE TABLE IF NOT EXISTS poll_answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at TEXT NOT NULL,
  app         TEXT NOT NULL,
  q           TEXT NOT NULL,           -- 質問ID 例: role-v1, chart-usage-v1, market-v1
  answer      TEXT NOT NULL,           -- 選択肢の内部値
  source      TEXT NOT NULL            -- app | web
);

CREATE INDEX IF NOT EXISTS idx_feedback_app_time ON feedback(app, received_at);
CREATE INDEX IF NOT EXISTS idx_poll_app_q ON poll_answers(app, q);
```

---

## 3. API 仕様

### 3.1 `POST /feedback`（JSON。iOS アプリから）

リクエスト：

```json
{
  "app": "ensemble-stage",
  "type": "request",
  "message": "自由記述（2000字以内）",
  "email": "任意",
  "poll": { "q": "role-v1", "answer": "teacher" },
  "diag": { "app": "1.3 (7)", "ios": "19.0", "device": "iPad14,5", "groups": 2, "layouts": 9 },
  "source": "app",
  "client_ts": "2026-09-09T10:15:00+09:00"
}
```

検証：

- `app`：`ALLOWED_APPS` に含まれる
- `type`：`bug | request | question | other`
- `message`：文字列、2000 字以内。`type` が `other` 以外なら 1 字以上
- `email`：省略可。あれば 254 字以内で `@` を含む簡易チェック
- `poll`：省略可。あれば `q` と `answer` が英数字とハイフンのみ、各 64 字以内
- `diag`：省略可。あれば JSON オブジェクト。2 KB 以内。**キーに `lat`,`lon`,`latitude`,`longitude`,`name`,`names`,`title`,`id`,`idfv`,`uuid` を含む場合は 400**（位置情報・個人名・識別子の混入防止）
- `source`：`app | web`。省略時 `app`

処理：

1. `feedback` に 1 行挿入
2. `poll` があれば `poll_answers` に 1 行挿入
3. `message` が空でなければ通知メール送信（下記 3.4）
4. `204 No Content`

エラー：

- `400 { "message": "<日本語の理由>" }`
- `429 { "message": "しばらく時間をおいて再度お試しください" }`

### 3.2 `POST /poll`（サポートサイトの `<form>` から。JS なし）

`Content-Type: application/x-www-form-urlencoded` を受け付ける（JSON も可）。

フォームのフィールド：

| 名前 | 内容 |
|---|---|
| `app` | アプリ ID |
| `q` | 質問 ID |
| `answer` | 選択肢の内部値（submit ボタンの `name="answer" value="..."`） |
| `return` | 戻り先 URL（例：`https://chokalog.margheritaworks.com/#roadmap-thanks`） |

処理：

1. 検証（`app`,`q`,`answer` は 3.1 と同じ規則）
2. `return` の host が `ALLOWED_RETURN_HOSTS` に含まれることを確認。含まれなければ `https://margheritaworks.com/` に戻す
3. `poll_answers` に `source='web'` で 1 行挿入
4. `303 See Other` + `Location: <return>`

JSON で来た場合は `204` を返す。

サポートサイト側の HTML 例：

```html
<form method="post" action="https://api.margheritaworks.com/poll">
  <input type="hidden" name="app" value="choka-log">
  <input type="hidden" name="q" value="market-v1">
  <input type="hidden" name="return" value="https://chokalog.margheritaworks.com/#roadmap-thanks">
  <button type="submit" name="answer" value="buy-and-sell">買ってみたい。自分のポイントも、金額次第で出してよい</button>
  <button type="submit" name="answer" value="buy-only">買ってみたい。ただし自分のポイントは出さない</button>
  <button type="submit" name="answer" value="sell-only">買わないが、自分のポイントは金額次第で出してよい</button>
  <button type="submit" name="answer" value="none">興味がない</button>
</form>
```

### 3.3 `GET /poll/summary?app=<app>&q=<q>`（集計。開発者だけ）

- ヘッダー `Authorization: Bearer <SUMMARY_TOKEN>` 必須。なければ `401`
- `app`,`q` は省略可（省略時は全件）
- レスポンス：

```json
{
  "rows": [
    { "app": "ensemble-stage", "q": "role-v1", "answer": "teacher", "source": "app", "n": 12 }
  ]
}
```

週次レポートのスクリプトからこれを呼ぶ。

### 3.4 通知メール

- 差出人：`MAIL_FROM`（`noreply@margheritaworks.com`）
- 宛先：`NOTIFY_TO`
- `Reply-To`：`email` があればそれ
- 件名：`[<APP_LABELS のアプリ名>][<種類の日本語>] <message の先頭 30 字>`
- 本文（text/plain）：

```
アプリ: 吹奏楽セッティング (ensemble-stage)
種類: 要望
受信: 2026-09-09T01:15:00Z
D1 id: 42
---
<message>
---
返信先: reply@example.com
アンケート: role-v1 = teacher
診断: {"app":"1.3 (7)","ios":"19.0","device":"iPad14,5","groups":2,"layouts":9}
```

種類の日本語：`bug=不具合, request=要望, question=質問, other=その他`

### 3.5 回数制限

KV に `rl:<endpoint>:<sha256(IP + IP_SALT)>` を TTL 付きで保存し、回数を数える。

- `/feedback`：1 時間に 5 件
- `/poll`：1 日に 3 件

生の IP は保存しない（ハッシュのみ）。

### 3.6 CORS

`Origin` が `https://*.margheritaworks.com` または `https://margheritaworks.com` のときだけ、`Access-Control-Allow-Origin` に同じ値を返す。`OPTIONS` は `204`。iOS アプリの `URLSession` は CORS の対象外なので影響しない。

---

## 4. 構築手順（Claude Code が実行）

```bash
# 1. 雛形
mkdir mw-feedback-worker && cd mw-feedback-worker
npm init -y
npm i mimetext
npm i -D wrangler @cloudflare/workers-types typescript
# package.json / wrangler.jsonc / schema.sql / src/index.ts を本仕様どおり作成

# 2. D1 と KV を作成し、返ってきた ID を wrangler.jsonc に記入
npx wrangler d1 create mw-feedback
npx wrangler kv namespace create RATE

# 3. スキーマ投入
npm run db:init

# 4. シークレット登録（値は人に入力してもらう。ファイルに書かない）
npx wrangler secret put NOTIFY_TO
npx wrangler secret put SUMMARY_TOKEN
npx wrangler secret put IP_SALT

# 5. デプロイ（カスタムドメイン api.margheritaworks.com の DNS と証明書は wrangler が自動設定）
npm run deploy
```

`send_email` バインディングは、ゾーンで Email Routing が有効であれば追加設定なしで使える。宛先 `NOTIFY_TO` は Email Routing の確認済み宛先アドレスであること（未確認の宛先には送れない）。

---

## 5. src/index.ts

```ts
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export interface Env {
  DB: D1Database;
  RATE: KVNamespace;
  EMAIL: SendEmail;
  ALLOWED_APPS: string;
  ALLOWED_RETURN_HOSTS: string;
  MAIL_FROM: string;
  APP_LABELS: string;
  NOTIFY_TO: string;
  SUMMARY_TOKEN: string;
  IP_SALT: string;
}

const TYPES = new Set(["bug", "request", "question", "other"]);
const TYPE_JA: Record<string, string> = { bug: "不具合", request: "要望", question: "質問", other: "その他" };
const ID_RE = /^[a-z0-9-]{1,64}$/;
const FORBIDDEN_DIAG_KEYS = /^(lat|lon|latitude|longitude|name|names|title|id|idfv|uuid)$/i;

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const json = (status: number, body: unknown, extra: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...extra } });

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("Origin") ?? "";
  const ok = /^https:\/\/([a-z0-9-]+\.)?margheritaworks\.com$/.test(origin);
  return ok
    ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, GET, OPTIONS", "access-control-allow-headers": "content-type, authorization", vary: "Origin" }
    : {};
}

async function ipKey(req: Request, env: Env, bucket: string): Promise<string> {
  const ip = req.headers.get("CF-Connecting-IP") ?? "0.0.0.0";
  const data = new TextEncoder().encode(ip + env.IP_SALT);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
  return `rl:${bucket}:${hex}`;
}

async function rateLimit(req: Request, env: Env, bucket: string, limit: number, ttlSec: number): Promise<void> {
  const key = await ipKey(req, env, bucket);
  const cur = parseInt((await env.RATE.get(key)) ?? "0", 10);
  if (cur >= limit) throw new HttpError(429, "しばらく時間をおいて再度お試しください");
  await env.RATE.put(key, String(cur + 1), { expirationTtl: ttlSec });
}

function allowedApps(env: Env): Set<string> {
  return new Set(env.ALLOWED_APPS.split(",").map(s => s.trim()).filter(Boolean));
}

function validatePoll(env: Env, app: unknown, q: unknown, answer: unknown) {
  if (typeof app !== "string" || !allowedApps(env).has(app)) throw new HttpError(400, "app が不正です");
  if (typeof q !== "string" || !ID_RE.test(q)) throw new HttpError(400, "q が不正です");
  if (typeof answer !== "string" || !ID_RE.test(answer)) throw new HttpError(400, "answer が不正です");
  return { app, q, answer };
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const b = await req.json().catch(() => null);
    if (!b || typeof b !== "object") throw new HttpError(400, "JSON が不正です");
    return b as Record<string, unknown>;
  }
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const out: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) out[k] = typeof v === "string" ? v : "";
    return out;
  }
  throw new HttpError(400, "Content-Type が不正です");
}

async function handleFeedback(req: Request, env: Env): Promise<Response> {
  await rateLimit(req, env, "feedback", 5, 3600);
  const b = await readBody(req);

  const app = b.app;
  if (typeof app !== "string" || !allowedApps(env).has(app)) throw new HttpError(400, "app が不正です");
  const type = b.type;
  if (typeof type !== "string" || !TYPES.has(type)) throw new HttpError(400, "type が不正です");
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (message.length > 2000) throw new HttpError(400, "本文は2000字以内にしてください");
  if (type !== "other" && message.length === 0) throw new HttpError(400, "本文を入力してください");

  let email: string | null = null;
  if (b.email !== undefined && b.email !== null && b.email !== "") {
    if (typeof b.email !== "string" || b.email.length > 254 || !b.email.includes("@")) throw new HttpError(400, "メールアドレスの形式が正しくありません");
    email = b.email.trim();
  }

  let diagJson: string | null = null;
  if (b.diag !== undefined && b.diag !== null) {
    if (typeof b.diag !== "object" || Array.isArray(b.diag)) throw new HttpError(400, "diag が不正です");
    for (const k of Object.keys(b.diag as object)) {
      if (FORBIDDEN_DIAG_KEYS.test(k)) throw new HttpError(400, `diag に許可されないキーがあります: ${k}`);
    }
    diagJson = JSON.stringify(b.diag);
    if (diagJson.length > 2048) throw new HttpError(400, "diag が大きすぎます");
  }

  const source = b.source === "web" ? "web" : "app";
  const clientTs = typeof b.client_ts === "string" ? b.client_ts.slice(0, 40) : null;
  const now = new Date().toISOString();

  const ins = await env.DB.prepare(
    "INSERT INTO feedback (received_at, app, type, message, email, diag_json, source, client_ts) VALUES (?,?,?,?,?,?,?,?)"
  ).bind(now, app, type, message, email, diagJson, source, clientTs).run();
  const rowId = ins.meta.last_row_id;

  let pollLine = "";
  if (b.poll && typeof b.poll === "object") {
    const p = b.poll as Record<string, unknown>;
    const { q, answer } = validatePoll(env, app, p.q, p.answer);
    await env.DB.prepare("INSERT INTO poll_answers (received_at, app, q, answer, source) VALUES (?,?,?,?,?)")
      .bind(now, app, q, answer, source).run();
    pollLine = `${q} = ${answer}`;
  }

  if (message.length > 0) {
    const labels = JSON.parse(env.APP_LABELS) as Record<string, string>;
    const appLabel = labels[app] ?? app;
    const subject = `[${appLabel}][${TYPE_JA[type]}] ${message.slice(0, 30).replace(/\s+/g, " ")}`;
    const body = [
      `アプリ: ${appLabel} (${app})`,
      `種類: ${TYPE_JA[type]}`,
      `受信: ${now}`,
      `D1 id: ${rowId}`,
      "---",
      message,
      "---",
      `返信先: ${email ?? "(なし)"}`,
      `アンケート: ${pollLine || "(なし)"}`,
      `診断: ${diagJson ?? "(なし)"}`,
    ].join("\n");

    const msg = createMimeMessage();
    msg.setSender({ name: "Margherita Works Feedback", addr: env.MAIL_FROM });
    msg.setRecipient(env.NOTIFY_TO);
    msg.setSubject(subject);
    if (email) msg.setHeader("Reply-To", email);
    msg.addMessage({ contentType: "text/plain", data: body });
    await env.EMAIL.send(new EmailMessage(env.MAIL_FROM, env.NOTIFY_TO, msg.asRaw()));
  }

  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

async function handlePoll(req: Request, env: Env): Promise<Response> {
  await rateLimit(req, env, "poll", 3, 86400);
  const b = await readBody(req);
  const { app, q, answer } = validatePoll(env, b.app, b.q, b.answer);
  const isJson = (req.headers.get("content-type") ?? "").includes("application/json");
  const source = isJson ? (b.source === "web" ? "web" : "app") : "web";

  await env.DB.prepare("INSERT INTO poll_answers (received_at, app, q, answer, source) VALUES (?,?,?,?,?)")
    .bind(new Date().toISOString(), app, q, answer, source).run();

  if (isJson) return new Response(null, { status: 204, headers: corsHeaders(req) });

  let location = "https://margheritaworks.com/";
  if (typeof b.return === "string") {
    try {
      const u = new URL(b.return);
      const hosts = new Set(env.ALLOWED_RETURN_HOSTS.split(",").map(s => s.trim()));
      if (u.protocol === "https:" && hosts.has(u.hostname)) location = u.toString();
    } catch { /* ignore */ }
  }
  return new Response(null, { status: 303, headers: { location } });
}

async function handleSummary(req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${env.SUMMARY_TOKEN}`) return json(401, { message: "unauthorized" });
  const url = new URL(req.url);
  const app = url.searchParams.get("app");
  const q = url.searchParams.get("q");
  const where: string[] = [];
  const binds: string[] = [];
  if (app) { where.push("app = ?"); binds.push(app); }
  if (q) { where.push("q = ?"); binds.push(q); }
  const sql = `SELECT app, q, answer, source, COUNT(*) AS n FROM poll_answers ${where.length ? "WHERE " + where.join(" AND ") : ""} GROUP BY app, q, answer, source ORDER BY app, q, n DESC`;
  const rows = await env.DB.prepare(sql).bind(...binds).all();
  return json(200, { rows: rows.results });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
      if (req.method === "POST" && url.pathname === "/feedback") return await handleFeedback(req, env);
      if (req.method === "POST" && url.pathname === "/poll") return await handlePoll(req, env);
      if (req.method === "GET" && url.pathname === "/poll/summary") return await handleSummary(req, env);
      if (req.method === "GET" && url.pathname === "/health") return json(200, { ok: true });
      return json(404, { message: "not found" });
    } catch (e) {
      if (e instanceof HttpError) return json(e.status, { message: e.message }, corsHeaders(req));
      console.error(e);
      return json(500, { message: "内部エラーが発生しました" }, corsHeaders(req));
    }
  },
} satisfies ExportedHandler<Env>;
```

`tsconfig.json` は `"types": ["@cloudflare/workers-types"]`、`"module": "esnext"`、`"moduleResolution": "bundler"`、`"strict": true` で作る。

---

## 6. 動作確認（デプロイ後）

```bash
API=https://api.margheritaworks.com

# 疎通
curl -s $API/health

# 自由記述（通知メールが NOTIFY_TO に届くこと）
curl -s -i -X POST $API/feedback -H 'content-type: application/json' -d '{
  "app":"ensemble-stage","type":"request","message":"テスト送信です",
  "email":"test@example.com","poll":{"q":"role-v1","answer":"teacher"},
  "diag":{"app":"1.3 (7)","ios":"19.0","device":"iPad14,5","groups":2,"layouts":9},
  "source":"app"
}'
# → 204

# 禁止キー（400 になること）
curl -s -X POST $API/feedback -H 'content-type: application/json' -d '{"app":"choka-log","type":"bug","message":"x","diag":{"lat":35.1}}'
# → {"message":"diag に許可されないキーがあります: lat"}

# Web 投票（303 で return に戻ること）
curl -s -i -X POST $API/poll -d 'app=choka-log&q=market-v1&answer=buy-only&return=https://chokalog.margheritaworks.com/%23roadmap-thanks'
# → 303 Location: https://chokalog.margheritaworks.com/#roadmap-thanks

# 集計
curl -s $API/poll/summary?app=ensemble-stage -H "Authorization: Bearer <SUMMARY_TOKEN>"

# 回数制限（6回目が 429 になること）
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/feedback -H 'content-type: application/json' -d '{"app":"choka-log","type":"other","message":""}'; done
```

---

## 7. iOS 側・サポートサイト側への引き渡し値

| 渡す先 | 値 |
|---|---|
| iOS アプリ（`FEEDBACK_ENDPOINT`） | `https://api.margheritaworks.com/feedback` |
| サポートサイトの投票フォーム `action` | `https://api.margheritaworks.com/poll` |
| 週次レポートのスクリプト | `https://api.margheritaworks.com/poll/summary` と `SUMMARY_TOKEN` |

---

## 8. 運用

- 新アプリの追加：`wrangler.jsonc` の `ALLOWED_APPS`・`APP_LABELS`・`ALLOWED_RETURN_HOSTS` に追記して `npm run deploy`
- 集計をすぐ見る：`npm run summary`
- 自由記述の一覧：`npx wrangler d1 execute mw-feedback --remote --command "SELECT id,received_at,app,type,substr(message,1,60) FROM feedback ORDER BY id DESC LIMIT 50"`
- シークレットのローテーション：`npx wrangler secret put SUMMARY_TOKEN` で上書き

---

## 9. 受け入れ確認

- [ ] `GET /health` が 200
- [ ] `POST /feedback`（JSON）で 204 が返り、`NOTIFY_TO` の Gmail に `[吹奏楽セッティング][要望] …` の件名で届く。差出人が `noreply@margheritaworks.com`、`Reply-To` が送信時の `email`
- [ ] `diag` に `lat` を入れると 400
- [ ] `POST /poll`（form）で 303 が返り、`return` に戻る。許可外ホストを `return` に入れると `https://margheritaworks.com/` に戻る
- [ ] `GET /poll/summary` がトークンなしで 401、ありで集計 JSON
- [ ] `/feedback` を同一 IP から 1 時間に 6 回目で 429
- [ ] KV と D1 に生の IP アドレスが保存されていない
- [ ] `NOTIFY_TO`・`SUMMARY_TOKEN`・`IP_SALT` がリポジトリ内のファイルに存在しない
