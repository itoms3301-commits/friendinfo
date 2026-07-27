# 友達管理アプリ (friendinfo)

友達の情報（F/O/R/M/D形式のプロフィール、誕生日、家の退去月、読書・サークル・紹介の進捗、現在の状態など）を、Googleスプレッドシートをデータ保存先として登録・閲覧・編集できるWebアプリです。**Google Apps Script (GAS)** で作られており、サーバーのホスティングは不要です。

## 主な機能

- 友達の登録・一覧閲覧・編集・削除（すべて1つの画面で完結）
- **登録のしやすさを最優先**：必須項目は「名前」のみ。誕生日・退去月・本/サークル/現在の状態などのよく使う項目はフォーム上部に配置し、詳細プロフィール（F/O/R/M/D）は折りたたみ式でスキップ可能。登録すると自動でフォームがリセットされ、続けて次の人を登録できます
- 一覧・検索画面：名前・関係・メモでのキーワード検索、列見出しクリックでのソート
  - 誕生日・退去月は「直近（近い将来）が上に来る」順でソートでき、近いものにはバッジが表示されます
- データは実体としてGoogleスプレッドシートの「友達データ」シートに保存されるため、アプリを介さずスプレッドシート側から直接見る・編集することも可能です（一覧画面の「スプレッドシートを開く」から直接ジャンプできます）

## 技術構成

- `gas-app/` 以下がGoogle Apps Scriptのソースコード一式です
  - `Code.gs` … サーバーサイド（スプレッドシートの読み書き、CRUD処理）
  - `Index.html` / `Stylesheet.html` / `JavaScript.html` … Webアプリの画面（HTML Service）
  - `appsscript.json` … マニフェスト（タイムゾーン、Webアプリ公開設定など）
- 外部サーバーやデータベースは使用せず、Googleのインフラ上だけで完結します

## デプロイ方法

### 方法A：Apps Scriptエディタで手動セットアップ（もっとも簡単）

1. Googleスプレッドシートを新規作成する（例：「友達管理」）
2. メニューの「拡張機能」→「Apps Script」を開く
3. デフォルトで作られる `コード.gs` の中身を削除し、このリポジトリの `gas-app/Code.gs` の内容を貼り付ける
4. 左側の「＋」→「HTML」で `Index`・`Stylesheet`・`JavaScript` という名前のファイルを作成し、それぞれ `gas-app/Index.html`・`gas-app/Stylesheet.html`・`gas-app/JavaScript.html` の中身を貼り付ける
5. `appsscript.json` の内容を、プロジェクトの設定から「`appsscript.json` をエディタで表示する」を有効にした上で `gas-app/appsscript.json` の内容に合わせる
6. 右上の「デプロイ」→「新しいデプロイ」→種類の選択で「ウェブアプリ」を選択
   - 「次のユーザーとして実行」：自分
   - 「アクセスできるユーザー」：自分のみ（他の人にも使ってほしい場合は「全員」等に変更可能。ただしその場合は友達の個人情報が閲覧可能になる範囲に注意してください）
7. デプロイ後に表示されるURLがアプリのURLです。ブックマークしておくと便利です

### 方法B：clasp CLIを使う

[clasp](https://github.com/google/clasp)（`npm install -g @google/clasp`）を使うと、このリポジトリの `gas-app/` ディレクトリをそのままApps Scriptプロジェクトにプッシュできます。

```bash
npm install -g @google/clasp
clasp login
cd gas-app
clasp create --type sheet --title "友達管理"
clasp push
clasp deploy
```

`clasp create --type sheet` を使うと、紐づくGoogleスプレッドシートも同時に作成されます。

## データの保存場所・バックアップ

初回アクセス時に、紐づくスプレッドシートへ自動で「友達データ」シートが作成されます（ヘッダー行つき）。スプレッドシートなので、Googleドライブの標準機能でバージョン履歴の確認やコピーによるバックアップが可能です。

## 開発メモ

- 各友達のIDはUUIDで採番され、スプレッドシートの行の並び替えに影響されません
- 同時編集時の競合を避けるため、書き込み処理には `LockService` を使用しています
- 選択式項目（本／サークル／現在の状態）の選択肢は `gas-app/Code.gs` の `BOOK_STATUS_OPTIONS` / `CIRCLE_STATUS_OPTIONS` / `CURRENT_STAGE_OPTIONS` で管理しています。選択肢を増減する場合はここを編集してください
