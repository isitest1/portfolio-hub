# iOSアプリ側 実装指示（吹奏楽セッティング — Android/Web版 希望登録の導線追加）

作成日：2026-09-13
対象：iOS/iPadOSアプリ「吹奏楽セッティング（Ensemble Stage）」設定画面
前提知識：このファイル単体で完結する。元仕様（`ensemble-stage-android-wish-spec.md`）の§3をベースに、Worker側・サポートサイト側の実装完了後の状態に合わせて更新した。

## 0. 背景

Android版・Web版を検討するにあたり、希望者を集めるための登録ページ

**https://ensemble-stage.margheritaworks.com/android/**

を公開済み（サポートサイト`ensemble-stage-site`リポジトリ、日本語・英語両対応）。共有のフィードバックWorker（`mw-feedback-worker`）への登録・集計もすでに本番稼働中。

**iOSアプリ側でやることは、このページへのリンクを1行追加するだけ**。フォームや送信処理をアプリ内に作る必要はない。

## 1. 元仕様からの変更点（重要）

元の`ensemble-stage-android-wish-spec.md`§3.1に書かれていたURLは

```
https://ensemblestage.margheritaworks.com/android/?src=app   ← 誤り（ハイフンが抜けている）
```

だったが、これは仕様書作成時点の誤記で、**実在しないドメイン**だった。正しいURLは

```
https://ensemble-stage.margheritaworks.com/android/?src=app   ← 正しい（ハイフンあり）
```

**必ずハイフンありの`ensemble-stage.margheritaworks.com`を使うこと。** アプリの`CNAME`・DNS・共有Workerの許可リスト（`ALLOWED_RETURN_HOSTS`）もすべてハイフンありで統一されている。

それ以外の技術的な変更はiOSアプリ側に影響しない（登録フォームの送信先はサポートサイト側の`<form>`が担っており、アプリはリンクを開くだけのため）。

## 2. 設定画面への追加（必須）

既存の「フィードバック」セクションに外部リンク行を1つ追加する：

```
フィードバック
  ご意見を送る                       ›
  Android版・Web版を希望する          ↗   ← https://ensemble-stage.margheritaworks.com/android/?src=app
  App Storeでレビューを書く           ↗
```

- ラベルには、既存の他の外部リンク行と同じ`arrow.up.forward`アイコンを付ける
- `UIApplication.shared.open(url)`でSafari（外部ブラウザ）を開く。アプリ内ブラウザ（`SFSafariViewController`等）にはしない
- URLはコードに直書きせず、`Info.plist`かビルド設定の定数（例：`ANDROID_WISH_URL`）として持つ
- `?src=app`のクエリパラメータは必ず付ける（サポートサイト側で流入元を区別するため。値は固定で`app`）

## 3. 「ご意見を送る」フォームの補助（任意・省略可）

「ご意見を送る」の自由記述に「Android」または「アンドロイド」という語が含まれて送信されたとき、送信完了後のアラートに次の1行を追加する（送信内容自体は変えない）：

```
Android 版・Web 版のご希望は、設定の「Android版・Web版を希望する」からも登録できます。
```

実装が煩雑であれば省略してよい。

## 4. プライバシー申告

変更なし。アプリは外部リンクを開くだけで、どのデータもアプリ側からは送信しない。

## 5. 受け入れ確認

- [ ] 設定画面の「フィードバック」に「Android版・Web版を希望する」の行があり、`arrow.up.forward`アイコンが付いている
- [ ] タップするとSafariで `https://ensemble-stage.margheritaworks.com/android/?src=app` が開く（**ハイフンあり**のドメインであることを確認）
- [ ] URLがコードに直書きされていない（`Info.plist`またはビルド設定の定数）
- [ ] （実装した場合）「ご意見を送る」でAndroid関連の語を含む送信後、案内アラートが表示される
