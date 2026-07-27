# 友達管理アプリ (friendinfo)

友達の情報（F/O/R/M/D形式のプロフィール、誕生日、家の退去月、読書・サークル・紹介の進捗、現在の状態など）を登録・閲覧・編集できるWebアプリです。

## 主な機能

- 友達の登録・詳細閲覧・編集・削除
- 一覧画面で名前・誕生日・退去月・本・サークル・現在の状態・更新日でソート
  - 誕生日・退去月は「直近（近い将来）が上に来る」順でソートされ、近いものにはバッジが表示されます
- 本・サークルなどの進捗状況を選択式で管理
- CSVエクスポート（Excel/Googleスプレッドシートにそのまま取り込み可能、UTF-8 BOM付き）

## データの保存方法

アプリ内のSQLiteデータベース（`data/friends.db`、gitで管理対象外）にデータを保存します。スプレッドシートとの連携が必要な場合は、一覧画面の「CSVエクスポート」からCSVを出力し、Googleスプレッドシート等に読み込んでください。

## Getting Started

依存パッケージをインストールして開発サーバーを起動します。

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

### ビルド

```bash
npm run build
npm run start
```

## 技術スタック

- [Next.js](https://nextjs.org)（App Router, Server Actions）
- [Tailwind CSS](https://tailwindcss.com)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
