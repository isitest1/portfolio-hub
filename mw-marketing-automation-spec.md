# 軽量マーケティング自動化 構築仕様（mw-marketing）

作成日：2026-09-09
対象：GitHub Actions（cron）＋ Node.js/TypeScript スクリプト。サーバーもデータベースも持たない
前提知識：このファイル単体で完結する

## 0. 目的と設計方針

一人で週 3 時間の運用に収めるため、**「毎週月曜の朝に、読むだけで済むメールが 1 通届き、投稿の下書きが GitHub Issues に並んでいる」**状態を作る。管理画面は作らない。

やること（3 本）：

| # | ジョブ | 入力 | 出力 |
|---|---|---|---|
| A | 週次レポート | App Store Connect の売上レポート（ダウンロード数）、フィードバック Worker の集計、前週のデータ | Claude が要約したメール 1 通 |
| B | 検索順位の記録 | `apps.json` の狙う検索語 | `data/ranks/*.json` に追記。順位変動があればレポートに含める |
| C | 投稿下書き | `apps.json`、直近のリリース、`notes/` の手書きメモ、A の数字 | GitHub Issues に下書き（ラベル `post-draft`） |

方針：
- 状態はすべて **リポジトリ内の JSON ファイルに commit して残す**（DB を持たない）
- 失敗しても翌週に再実行されればよい。リトライや監視は作り込まない
- 生成物（Claude の要約・下書き）は必ず人が読んでから使う。自動投稿はしない

---

## 1. 前提（人が用意するもの）

### 1.1 App Store Connect API キー

App Store Connect → ユーザとアクセス → 統合 → App Store Connect API → チームキー。役割は **「売上とレポート」（Sales and Reports）** で足りる（管理者権限は不要）。

取得する 3 つ：
- **Issuer ID**（UUID）
- **Key ID**（10 文字）
- **秘密鍵 `.p8`**（ダウンロードは 1 回だけ）

**重要**：`.p8` はリポジトリに絶対に入れない。GitHub Secrets に中身を貼る。
また、Claude のプロジェクトナレッジに `AuthKey_….p8` がアップロードされているのを確認した。これはプロジェクトファイルから削除し、鍵が既に露出したとみなして **App Store Connect 側でそのキーを失効させ、新しく発行し直す**ことを推奨する。

### 1.2 Vendor Number

App Store Connect → 支払いと財務レポート の画面上部に表示される 8 桁程度の数字。売上レポート取得に必要。

### 1.3 Anthropic API キー

Claude API 用。`ANTHROPIC_API_KEY`。

### 1.4 メール送信用の Gmail アプリパスワード

`support@margheritaworks.com` の送信設定で発行した Google アプリパスワード（16 桁）を流用する。レポートは自分の Gmail 宛てに送る。

### 1.5 フィードバック Worker の集計トークン

`mw-feedback-worker` の `SUMMARY_TOKEN`（`GET /poll/summary` 用）。

### 1.6 GitHub Secrets 一覧

リポジトリ `mw-marketing` の Settings → Secrets and variables → Actions に登録：

| Secret 名 | 内容 |
|---|---|
| `ASC_ISSUER_ID` | App Store Connect の Issuer ID |
| `ASC_KEY_ID` | App Store Connect の Key ID |
| `ASC_PRIVATE_KEY` | `.p8` ファイルの中身（`-----BEGIN PRIVATE KEY-----` から `-----END PRIVATE KEY-----` まで、改行込み） |
| `ASC_VENDOR_NUMBER` | Vendor Number |
| `ANTHROPIC_API_KEY` | Claude API キー |
| `GMAIL_USER` | 送信元・送信先の Gmail アドレス |
| `GMAIL_APP_PASSWORD` | Google アプリパスワード |
| `FEEDBACK_SUMMARY_TOKEN` | Worker の集計トークン |

`GITHUB_TOKEN` は Actions が自動で持つ（Issues 作成と commit に使う。ワークフローの `permissions` で `contents: write`, `issues: write` を付ける）。

---

## 2. リポジトリ構成

リポジトリ名：`mw-marketing`（プライベート）

```
mw-marketing/
├─ apps.json                    # アプリ登録情報（§3）
├─ notes/                       # 人が書く投稿ネタのメモ（§7.2）
│  ├─ choka-log.md
│  └─ ensemble-stage.md
├─ data/
│  ├─ downloads/YYYY-MM-DD.json # 日別ダウンロード数（A が追記）
│  ├─ ranks/YYYY-MM-DD.json     # 検索順位（B が追記）
│  └─ reports/YYYY-MM-DD.md     # 送ったレポートの控え（A が追記）
├─ src/
│  ├─ asc.ts                    # App Store Connect API（JWT・売上レポート）
│  ├─ ranks.ts                  # 検索順位取得
│  ├─ feedback.ts               # Worker の集計取得
│  ├─ claude.ts                 # Claude API 呼び出し
│  ├─ mail.ts                   # Gmail SMTP 送信
│  ├─ github.ts                 # Issues 作成
│  ├─ weekly-report.ts          # ジョブ A + B
│  └─ post-drafts.ts            # ジョブ C
├─ .github/workflows/weekly.yml
├─ package.json
└─ tsconfig.json
```

`package.json`：

```json
{
  "name": "mw-marketing",
  "private": true,
  "type": "module",
  "scripts": {
    "report": "tsx src/weekly-report.ts",
    "drafts": "tsx src/post-drafts.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "jose": "^5.9.0",
    "nodemailer": "^6.9.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/nodemailer": "^6.4.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

---

## 3. `apps.json`（アプリ登録情報）

すべてのジョブが参照する唯一の設定ファイル。追加・変更はここだけ。

```json
{
  "brand": {
    "name": "Margherita Works",
    "site": "https://margheritaworks.com",
    "support_email": "support@margheritaworks.com"
  },
  "apps": [
    {
      "id": "choka-log",
      "name": "釣果ログ",
      "apple_id": "<App Store Connect で確定後に記入>",
      "sku_or_bundle": "<バンドルID>",
      "tier": 1,
      "status": "in_review",
      "store_url": "https://apps.apple.com/jp/app/id<AppleID>",
      "support_url": "https://chokalog.margheritaworks.com/",
      "repo": "isitest1/<釣果ログのリポジトリ名>",
      "audience": "相模湾・東京湾のボート釣り（マイボート・レンタルボート・遊漁船）。魚探で水深を読む人",
      "value_prop": "釣れた写真1枚から、場所・時刻・潮回り・底質・魚礁を自動で添える釣果ログ。水深は魚探の実測値だけ",
      "never_say": ["海図", "航海", "ナビ", "他社アプリ名", "共有", "売買", "送信しません"],
      "tone": "同じ釣り人として。宣伝口調にしない。実釣の一次情報を軸にする",
      "keywords": ["釣果ログ", "船釣り 記録", "ボート釣り アプリ", "底質", "魚礁 釣り", "タイドグラフ 釣果"],
      "channels": ["x"],
      "seasons": [
        { "months": [9, 10, 11, 12], "theme": "秋冬の船釣り。カワハギ・アマダイ・青物。底質と水深の話" },
        { "months": [3, 4, 5], "theme": "春の乗っ込みマダイ。潮回りと水深の話" }
      ]
    },
    {
      "id": "ensemble-stage",
      "name": "吹奏楽セッティング",
      "apple_id": "6793795823",
      "tier": 1,
      "status": "live",
      "store_url": "https://apps.apple.com/jp/app/id6793795823",
      "support_url": "https://ensemblestage.margheritaworks.com/",
      "repo": "isitest1/<吹奏楽のリポジトリ名>",
      "audience": "学校の吹奏楽部の顧問・指導者、学生指揮者・部長、一般団体の運営",
      "value_prop": "配置図・座席表を iPad で作って PDF で配れる",
      "never_say": ["他社アプリ名"],
      "tone": "先生に向けて丁寧に、短く。教育現場の言葉づかい",
      "keywords": ["吹奏楽 配置図", "吹奏楽 座席表", "アンサンブル 配置", "楽器 配置図 アプリ", "定期演奏会 配置"],
      "channels": ["x"],
      "seasons": [
        { "months": [10, 11, 12], "theme": "定期演奏会の配置。ステージ図の作り方" },
        { "months": [3, 4, 5], "theme": "新入部員の配置。パート決めと座席" },
        { "months": [6, 7, 8], "theme": "コンクールの配置。規定内での並び" }
      ]
    },
    { "id": "neta-cho",           "name": "ネタ帳",           "apple_id": "6797323735", "tier": 2, "status": "live", "keywords": ["ネタ帳 アプリ", "話のネタ メモ", "アイデア メモ"] },
    { "id": "workout-quest",      "name": "WorkoutQuest",     "apple_id": "6790803132", "tier": 2, "status": "live", "keywords": ["筋トレ 習慣化", "筋トレ 記録 ゲーム"] },
    { "id": "need-soon",          "name": "NeedSoon",         "apple_id": "6792124859", "tier": 2, "status": "live", "keywords": ["買い物リスト", "買い忘れ アプリ"] },
    { "id": "sukkiri-gb",         "name": "スッキリGB",       "apple_id": "6802024030", "tier": 3, "status": "live", "keywords": [] },
    { "id": "copy-all-text",      "name": "全文コピー",       "apple_id": "6805767687", "tier": 3, "status": "live", "keywords": ["全文コピー"] },
    { "id": "unit-price-scanner", "name": "UnitPriceScanner", "apple_id": "<記入>",     "tier": 3, "status": "live", "keywords": ["単価 計算 アプリ", "値札 スキャン"] },
    { "id": "name-cue",           "name": "NameCue",          "apple_id": "<記入>",     "tier": 3, "status": "live", "keywords": [] }
  ]
}
```

- `tier`：1 = 投稿下書きを作る（週 3 時間を使う対象）、2 = レポートと順位監視だけ、3 = レポートのダウンロード数だけ
- `never_say`：Claude に生成させるときの禁止語。ストア掲載文の方針と揃える
- `seasons`：当月に該当するテーマを下書き生成のヒントにする

---

## 4. ジョブ A：週次レポート

### 4.1 App Store Connect からダウンロード数を取る（`src/asc.ts`）

**売上レポート（Sales Reports）API** を使う。日別・アプリ別のユニット数（無料アプリのダウンロード）が TSV で取れる。Analytics Reports API（インプレッションや製品ページ閲覧）は設定が重いので、第 2 段階に回す（§8）。

JWT（ES256、有効 20 分）：

```ts
import { SignJWT, importPKCS8 } from "jose";

export async function ascToken(): Promise<string> {
  const key = await importPKCS8(process.env.ASC_PRIVATE_KEY!, "ES256");
  return await new SignJWT({ aud: "appstoreconnect-v1" })
    .setProtectedHeader({ alg: "ES256", kid: process.env.ASC_KEY_ID!, typ: "JWT" })
    .setIssuer(process.env.ASC_ISSUER_ID!)
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(key);
}
```

日別売上レポートの取得（gzip の TSV が返る）：

```ts
import { gunzipSync } from "node:zlib";

export async function dailySales(reportDate: string /* YYYY-MM-DD */): Promise<Array<{ appleId: string; units: number; country: string }>> {
  const url = new URL("https://api.appstoreconnect.apple.com/v1/salesReports");
  url.search = new URLSearchParams({
    "filter[frequency]": "DAILY",
    "filter[reportSubType]": "SUMMARY",
    "filter[reportType]": "SALES",
    "filter[vendorNumber]": process.env.ASC_VENDOR_NUMBER!,
    "filter[reportDate]": reportDate,
  }).toString();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await ascToken()}`, Accept: "application/a-gzip" } });
  if (res.status === 404) return []; // その日のレポートが無い（売上ゼロの日は 404 になる）
  if (!res.ok) throw new Error(`salesReports ${res.status}: ${await res.text()}`);
  const tsv = gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
  const [header, ...rows] = tsv.trim().split("\n").map(l => l.split("\t"));
  const col = (n: string) => header.indexOf(n);
  return rows
    .filter(r => r[col("Product Type Identifier")]?.startsWith("1")) // 1, 1F, 1T… = アプリ本体のダウンロード
    .map(r => ({ appleId: r[col("Apple Identifier")], units: parseInt(r[col("Units")], 10), country: r[col("Country Code")] }));
}
```

- レポートは **前日分まで**。実行日の 2 日前〜8 日前の 7 日分を取る（前日分は生成が遅れることがある）
- 取得結果は `data/downloads/YYYY-MM-DD.json` に `{ "date", "byApp": { "<appleId>": units } }` で保存する。既に存在する日は取り直さない
- レート制限は緩いが、`404` は正常（その日のダウンロードがゼロ）として扱う

### 4.2 フィードバック集計を取る（`src/feedback.ts`）

```ts
export async function pollSummary() {
  const res = await fetch("https://api.margheritaworks.com/poll/summary", {
    headers: { Authorization: `Bearer ${process.env.FEEDBACK_SUMMARY_TOKEN}` },
  });
  if (!res.ok) return { rows: [] };
  return (await res.json()) as { rows: Array<{ app: string; q: string; answer: string; source: string; n: number }> };
}
```

自由記述の件数は Worker の API に無いので、レポートには「Gmail の `[アプリ名]` 件名で検索してください」と 1 行書くだけにする（Worker に `/feedback/summary` を足したくなったら同じ形で追加）。

### 4.3 前週比の計算

`data/downloads/` から「直近 7 日」と「その前の 7 日」を集計し、アプリごとに `{ thisWeek, lastWeek, delta, deltaPct }` と、国別の上位 3 を出す。ダウンロードが 0 のアプリも行として残す（消えると気づけない）。

### 4.4 Claude で要約（`src/claude.ts`）

モデルは `claude-sonnet-5`（後述の下書き生成も同じ）。要約はデータを渡して「日本語で、以下の形式で」と指示する。

システムプロンプト：

```
あなたは個人開発者のマーケティング担当です。週次の数字を受け取り、日本語で短い報告を書きます。
ルール：
- 数字の羅列ではなく、「先週から何が変わったか」「その理由として考えられること」「今週やるべき一手」を書く
- やるべき一手は1つだけ。ASOの文言修正、投稿、記事、何もしない、のいずれか
- 推測は推測と書く。データにないことを断定しない
- 見出しは「先週の要点」「アプリ別」「今週の一手」「気になる点」の4つ。全体で600字以内
- 敬語は使わず、簡潔な常体で書く
```

ユーザーメッセージ：`apps.json` の `id/name/tier`、前週比の JSON、順位変動の JSON（§5）、アンケート集計の JSON、当月の `seasons` を JSON で渡す。

### 4.5 メール送信（`src/mail.ts`）

nodemailer で `smtp.gmail.com:587`、`GMAIL_USER` / `GMAIL_APP_PASSWORD`。宛先は `GMAIL_USER`。件名 `[MW週次] 2026-09-14`。本文はテキスト（Claude の要約 + 生の表を下に付ける）。同じ内容を `data/reports/YYYY-MM-DD.md` に保存して commit する。

---

## 5. ジョブ B：検索順位の記録（`src/ranks.ts`）

### 5.1 取得方法と限界

公式に取れるのは **iTunes Search API** だけ：

```
https://itunes.apple.com/search?term=<検索語>&country=jp&entity=software&limit=200
```

返ってくる並びは、iPhone の App Store 検索結果と **完全には一致しない**（App Store 側は端末・パーソナライズ・広告枠が入る）。したがって、この順位は「絶対値」ではなく **「先週より上がったか下がったか」の相対指標**として使う。ASO 施策の前後で動いたかを見るには十分。

### 5.2 実装

- `apps.json` の各アプリの `keywords` について、上記 API を叩き、結果の `trackId` 配列の中で自アプリの `apple_id` が何番目かを記録する。見つからなければ `null`（200 位圏外）
- 1 語あたり 1 リクエスト、語間に 1 秒待つ（レート制限は 1 分 20 回程度）
- 結果を `data/ranks/YYYY-MM-DD.json` に `{ "<appId>": { "<keyword>": rank|null } }` で保存
- 前回ファイルと比べて、5 位以上動いた語と、圏外↔圏内が入れ替わった語を「変動」として §4.4 に渡す

---

## 6. ワークフロー（`.github/workflows/weekly.yml`）

毎週月曜 08:00 JST（= 日曜 23:00 UTC）。

```yaml
name: weekly
on:
  schedule:
    - cron: "0 23 * * 0"
  workflow_dispatch:

permissions:
  contents: write
  issues: write

jobs:
  weekly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - name: Weekly report (downloads + ranks + mail)
        run: npm run report
        env:
          ASC_ISSUER_ID: ${{ secrets.ASC_ISSUER_ID }}
          ASC_KEY_ID: ${{ secrets.ASC_KEY_ID }}
          ASC_PRIVATE_KEY: ${{ secrets.ASC_PRIVATE_KEY }}
          ASC_VENDOR_NUMBER: ${{ secrets.ASC_VENDOR_NUMBER }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
          FEEDBACK_SUMMARY_TOKEN: ${{ secrets.FEEDBACK_SUMMARY_TOKEN }}
      - name: Post drafts (tier 1 apps)
        run: npm run drafts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Commit data
        run: |
          git config user.name "mw-bot"
          git config user.email "noreply@margheritaworks.com"
          git add data/
          git diff --cached --quiet || git commit -m "data: $(date -u +%F)"
          git push
```

`workflow_dispatch` を付けてあるので、GitHub の Actions 画面から手動実行して試せる。

---

## 7. ジョブ C：投稿下書き（`src/post-drafts.ts`）

### 7.1 対象と本数

`tier: 1` のアプリだけ。1 アプリにつき週 3 本。多く作っても読まない。

### 7.2 入力

1. `apps.json` の該当アプリ（`audience`, `value_prop`, `never_say`, `tone`, `seasons` の当月分）
2. `notes/<appId>.md`：**人が書き溜めるネタ**。実釣の記録、生徒からの反応、思いついたこと。1 行 1 ネタ。先頭に `- [ ]` で未使用、`- [x]` で使用済み。スクリプトは未使用の上から 3 つを渡し、使った行に `[x]` を付けて commit する
3. 直近 14 日の GitHub Releases（`repo` が設定されていれば `GET /repos/{repo}/releases`）のタイトルと本文
4. 前週のダウンロード数と順位変動（§4.3, §5.2）

`notes/` が空でリリースも無い週は、`seasons` のテーマだけで 1 本にする（3 本作らない）。ネタが無いのに 3 本作らせると、宣伝口調の空文が並ぶ。

### 7.3 生成の指示

システムプロンプト：

```
あなたは個人開発者本人として X（旧Twitter）に投稿する文を書きます。
ルール：
- 140字以内。1投稿1テーマ。ハッシュタグは最大2つ、末尾に置く
- 「宣伝」ではなく「同じ趣味の人への一次情報」として書く。アプリ名は入れなくてよい。入れる場合は文末に自然に
- 整いすぎた文、説明口調、絵文字の多用、「〜してみませんか」「ぜひ」「必見」を使わない
- 与えられた never_say の語は使わない
- ネタ（notes）に書かれた事実だけを使い、書かれていない体験や数字を作らない
- 出力は JSON 配列のみ。各要素は { "text": "...", "based_on": "使ったネタの行そのまま" }
```

ユーザーメッセージに、7.2 の入力を JSON で渡す。

### 7.4 出力先：GitHub Issues

1 週につき 1 Issue（アプリごと）。タイトル `[投稿下書き] 釣果ログ 2026-09-14`、ラベル `post-draft`、本文：

```
## 下書き（承認したものだけ投稿する）

### 1
<text>
元ネタ: <based_on>

### 2
...

## 使い方
- 投稿したら、その番号にチェックを付けてこの Issue を閉じる
- 直して使う場合は、ここに直した文を書いてから閉じる（次回の生成の参考にする）
```

前週の Issue が開いたままなら、新しい Issue は作らず、コメントで今週分を追記する（未処理の下書きが積み上がるのを防ぐ）。

投稿は **人が X のアプリからコピペで行う**。X API は無料枠が無く、URL 付き投稿は従量課金のため使わない。

---

## 8. 第 2 段階（今回は実装しない）

必要になったら足す。今回のリポジトリ構成のまま追加できる。

- **Analytics Reports API**：インプレッション、製品ページ閲覧、ソース別（検索・閲覧・Web 参照）を取る。`ONGOING` のレポートリクエストを 1 回作成し、以後は日次で CSV を取りに行く。ダウンロード数だけでは「見られているのに落とされない（掲載文の問題）」か「そもそも見られていない（キーワードの問題）」かが分からないので、ASO を本格的に回す段階で必要になる
- **Worker に `/feedback/summary`**：自由記述の件数と種類別内訳
- **Threads / Bluesky の自動投稿**：X と違い API が無料。必要なら承認済み下書きの投稿を自動化できる

---

## 9. 動作確認

1. `apps.json` の `apple_id` が空のアプリを埋める（UnitPriceScanner、NameCue。釣果ログは審査通過後）
2. ローカルで `.env` を作り（gitignore 済みにする）、`npm run report` → メールが届く。`data/downloads/` と `data/ranks/` にファイルができる
3. `npm run drafts` → GitHub Issues に `post-draft` の Issue ができる
4. Actions の `workflow_dispatch` で手動実行 → 同じ結果。`data/` の commit が push される
5. 翌週月曜 08:00 に自動実行されることを確認する

## 10. 受け入れ確認

- [ ] `.p8` の中身がリポジトリの履歴に一度も入っていない（`git log -p | grep "BEGIN PRIVATE"` が空）
- [ ] 売上レポートの `404` を「ゼロ」として扱い、ジョブが落ちない
- [ ] レポートにダウンロード 0 のアプリも行として出る
- [ ] 順位が `null`（圏外）の語がレポートで「圏外」と表示される
- [ ] `notes/` が空の週は下書きが 1 本だけ生成される
- [ ] 下書きに `never_say` の語が含まれていない（スクリプト側でも生成後に文字列チェックし、含まれていたら再生成 1 回、それでも含まれれば破棄）
- [ ] 前週の `post-draft` Issue が開いている場合、新しい Issue を作らずコメント追記になる
- [ ] Claude の要約が 600 字以内
