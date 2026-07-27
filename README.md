# 友達管理アプリ (friendinfo)

友達の情報（F/O/R/M/D形式のプロフィール、誕生日、家の退去月、読書・サークル・紹介の進捗、現在の状態など）を、Googleスプレッドシートをデータ保存先として登録・閲覧・編集できるアプリです。

スマホでの利用を想定した**静的サイト版**（`docs/`、GitHub Pagesで公開してホーム画面に追加する用途）と、**Apps Script上で完結するUI版**（`gas-app/`、Apps Scriptだけで動く）の2種類のフロントエンドがあり、どちらも同じGoogle Apps Script（GAS）バックエンドを共有します。

## 主な機能

- 友達の登録・一覧閲覧・編集・削除
- **登録のしやすさを最優先**：必須項目は「名前」のみ。誕生日・退去月・本/サークル/現在の状態などのよく使う項目はフォーム上部に配置し、詳細プロフィール（F/O/R/M/D）は折りたたみ式でスキップ可能。登録すると自動でフォームがリセットされ、続けて次の人を登録できます
- **メモからのAI自動入力**（静的サイト版）：会話中に取ったメモや思い出したことを自由文でテキストエリアに貼り付け、「AIで自動入力」を押すとClaude APIが名前・誕生日・出身などの項目を読み取ってフォームに反映します。反映後は内容を確認してから登録してください
- 一覧・検索：名前・関係・メモでのキーワード検索、誕生日・退去月・名前・更新日での並び替え
  - 誕生日・退去月は「直近（近い将来）が上に来る」順で並び替えでき、近いものにはバッジが表示されます
- データは実体としてGoogleスプレッドシートの「友達データ」シートに保存されるため、アプリを介さずスプレッドシート側から直接見る・編集することも可能です

## 技術構成

```
gas-app/    Google Apps Script（バックエンド + Apps Script上で動くUI）
  Code.gs         … スプレッドシートCRUD、doGet/doPostによるJSON API
  Index.html       ┐
  Stylesheet.html   ├ Apps Script上で直接開いたときのHTML UI（HTML Service）
  JavaScript.html  ┘
  appsscript.json  … マニフェスト（Webアプリ公開設定など）

docs/       GitHub Pagesで公開する静的サイト版フロントエンド
  index.html … 1ファイル完結のスマホ向けUI。GASへはJSONP(読み取り)・
               no-cors POST(書き込み)で通信し、Claude APIをブラウザから直接呼ぶ
```

外部サーバーやデータベースは使用せず、Googleのインフラ + GitHub Pages（静的ホスティング）だけで完結します。

## デプロイ手順

### 1. Google Apps Script側のセットアップ

1. Googleスプレッドシートを新規作成する（例：「友達管理」）
2. メニューの「拡張機能」→「Apps Script」を開く
3. デフォルトの `コード.gs` を削除し、`gas-app/Code.gs` の内容を貼り付ける
4. 左側の「＋」→「HTML」で `Index`・`Stylesheet`・`JavaScript` という名前のファイルを作成し、それぞれ `gas-app/Index.html`・`gas-app/Stylesheet.html`・`gas-app/JavaScript.html` の内容を貼り付ける
5. プロジェクト設定で「`appsscript.json` をエディタで表示する」を有効にし、内容を `gas-app/appsscript.json` に合わせる（`access` は `ANYONE_ANONYMOUS`）
6. 右上「デプロイ」→「新しいデプロイ」→種類「ウェブアプリ」
   - 「次のユーザーとして実行」：自分
   - 「アクセスできるユーザー」：**全員**
     （GitHub Pages側の静的サイトから認証なしで読み書きするため、この設定が必須です。下記「セキュリティについて」を必ずお読みください）
7. デプロイ後に表示される `https://script.google.com/macros/s/.../exec` のURLを控えておく（静的サイト側の設定で使います）

clasp CLIでのセットアップも可能です（`gas-app/` をそのままプッシュできます）。

```bash
npm install -g @google/clasp
clasp login
cd gas-app
clasp create --type sheet --title "友達管理"
clasp push
clasp deploy
```

### 2. GitHub Pages側のセットアップ

1. GitHubリポジトリの Settings → Pages を開く
2. Source を「Deploy from a branch」にし、ブランチとフォルダで `docs/` を指定する
   （このリポジトリでは `docs/index.html` が公開対象です）
3. 公開されたURL（例: `https://<ユーザー名>.github.io/friendinfo/`）にスマホでアクセスする
4. 右上の歯車アイコン→「接続設定」を開き、以下を入力して保存する
   - **GOOGLE APPS SCRIPT URL**：手順1で控えたデプロイURL
   - **ANTHROPIC API KEY**：メモからの自動入力を使う場合のみ（[console.anthropic.com](https://console.anthropic.com/)で発行）
5. スマホのブラウザで「ホーム画面に追加」すると、アプリのアイコンとして使えます

## セキュリティについて（重要）

GitHub Pages（静的サイト）からGoogle Apps Scriptを呼び出す都合上、Webアプリのアクセス設定は「全員（認証不要）」にする必要があります。これはURLさえ知っていれば誰でもデータの読み書きができる状態を意味します（実質的にURLの長い乱数文字列が漏れないことに依存する運用です）。

- Apps ScriptのデプロイURLは第三者に共有しないでください
- ANTHROPIC API KEYはブラウザのlocalStorageに保存され、外部には送信されません（Anthropic API呼び出し時のみ使用）が、端末を共有している場合は他の人からも見える点に注意してください
- より厳密なアクセス制御が必要な場合は、`gas-app/appsscript.json` の `access` を `MYSELF` に戻し、`gas-app/` のApps Script上で完結するUI（`Index.html`）のみを使う運用にしてください（この場合、GitHub Pages版は使えません）

## データの保存場所・バックアップ

初回アクセス時に、紐づくスプレッドシートへ自動で「友達データ」シートが作成されます（ヘッダー行つき）。スプレッドシートなので、Googleドライブの標準機能でバージョン履歴の確認やコピーによるバックアップが可能です。

## 開発メモ

- 各友達のIDはクライアント側でUUIDを発行して送信します（`docs/index.html`はno-cors POSTのレスポンスを読めないため、サーバーが採番したIDを受け取れない制約への対応）。Apps Script上で完結するUI版（`google.script.run`経由）ではサーバー側で採番します
- 同時編集時の競合を避けるため、書き込み処理には `LockService` を使用しています
- `docs/index.html` は一覧取得のたびに `loadFriends()` を呼びますが、連続登録などで複数の取得が同時に走っても、後から発行したリクエストの結果だけを反映し古い結果で上書きしないようにしています
- 選択式項目（本／サークル／現在の状態）の選択肢は `gas-app/Code.gs` の `BOOK_STATUS_OPTIONS` / `CIRCLE_STATUS_OPTIONS` / `CURRENT_STAGE_OPTIONS`、および `docs/index.html` 側の同名の定数で管理しています。選択肢を増減する場合は両方を編集してください
