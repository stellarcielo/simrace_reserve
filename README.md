# シムレース体験 予約システム

学園祭のシムレース体験ブース向けの、時間枠制の予約Webアプリです。

- 来場者: `/book` で日付・時間枠を選び、さらに機体（スペック説明付き）を選んで予約 → 6桁の予約コードを発行。`/reservation` でコードから照会・キャンセルできる。
- 運営: `/admin` で予約一覧の確認・受付チェックイン、`/admin/settings` で機体（名前・スペック）の登録・時間枠・開催日を設定して枠を生成。
- お知らせ: `/admin/announcements` で登録したお知らせ（通常/重要）が、トップページ・予約確認ページ・受付案内画面（`/display`）に表示される。
- ページ編集: `/admin/pages` でトップページの「ご来場の流れ」を Markdown で編集できる（空で保存すると非表示）。

機体（シムレース機）はスペックが異なる前提で、1台ごとに`Rig`として個別に管理する。予約は「時間枠 × 機体」の組み合わせ単位（1予約=1機体=1名）で、枠ごとの空き台数は「稼働中の機体数 − その枠の予約数」から自動計算される。

## 技術構成

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma 7 (driver adapter方式) + SQLite（開発時は `better-sqlite3` アダプタ）
- 管理者認証: 環境変数のパスワード + 署名付きJWTセッションCookie

## セットアップ

```bash
npm install
npx prisma migrate deploy   # 初回のみ（DBスキーマ作成）
npm run dev
```

`http://localhost:3000` で起動します（ポートが使用中の場合は自動で別ポートになります）。

### 環境変数

`.env.example` を `.env` にコピーして値を設定してください。

| 変数名 | 説明 |
| --- | --- |
| `DATABASE_URL` | DB接続文字列（開発時は `file:./dev.db`） |
| `ADMIN_PASSWORD` | 管理画面 (`/admin`) のログインパスワード |
| `AUTH_SECRET` | 管理セッションCookie署名用の秘密鍵。`openssl rand -hex 32` などで生成 |

### 初期設定の流れ（イベント準備時）

1. `/admin/login` で管理者パスワードでログイン
2. `/admin/settings` の「機体管理」で各機体の名前・スペック（例: 「ハンドル型/3面モニター/VRなし」）を登録
3. 同じページの「開催設定」で1枠の長さ・営業時間・開催日（例: `2026-09-12,2026-09-13`）を入力し「設定を保存」
4. 「枠を生成」を押すと、開催日ごとに時間枠が自動作成される（既に枠がある日付はスキップされる）
5. 当日は `/admin` で予約一覧を確認し、来場者の受付時に「チェックイン」を押す
6. 機材トラブル等でその機体が使えなくなった場合は「機体管理」で当該機体を非稼働にする（予約履歴がある機体は削除できない仕様）。休憩時間などで時間枠ごと閉じたい場合は「時間枠の個別設定」で該当枠の「受付中」を外す

### サンプル予約を生成する

予約照会や受付の動作確認には、`/admin` の「サンプル予約」から「サンプル予約を生成」を押してください。

- 先に `/admin/settings` で稼働中の機体を登録し、現在または未来の時間枠を生成しておきます。
- 受付中で終了前の枠から、機体が空いている組み合わせを選び、1回につき最大5件の予約を作成します。空きが5件未満なら、その件数だけ作成します。
- 氏名は「サンプル予約 1」などになり、通常の予約と同じ形式の一意な6文字の予約コードを発行します。生成結果のコードから予約内容を開けます。
- サンプルも通常の予約と同様に枠を使用し、予約一覧・予約照会・呼び出し画面に反映されます。確認後は予約内容のページからキャンセルできます（受付済みなら、先に管理画面で受付を取り消します）。
- もう一度押すと、残りの空き枠に新しいサンプルを追加します。既存の予約は変更しません。

## デプロイ（本番運用）

### 方式A: ローカルサーバー + Cloudflare Tunnel（推奨・採用中）

学園祭当日1〜2日だけ稼働させる用途なら、SQLiteのままローカルPCで動かし、Cloudflare Tunnelで外部公開するのが最も簡単。SQLiteはファイルベースなので、Vercelのようなサーバーレス環境とは違い、1台のマシンでプロセスが動き続けるこの構成とは相性が良い。

1. 本番ビルドして起動する（`4000`番ポートで待受）

   ```bash
   npm run build
   npm run start
   ```

2. `cloudflared` をインストールする（例: `sudo apt install cloudflared` / Mac は `brew install cloudflared`）
3. トンネルを起動して公開する

   - お試し・一時利用（Cloudflareアカウント不要、`*.trycloudflare.com` のランダムなURLが発行される）:
     ```bash
     cloudflared tunnel --url http://localhost:4000
     ```
   - 独自ドメイン等で固定URLにしたい場合は `cloudflared tunnel login` でCloudflareアカウントに認証後、Named Tunnelを作成する（詳細は cloudflared 公式ドキュメント参照）

4. 発行されたURLが来場者向けの予約URLになる。同じURLに `/admin` を付ければ管理画面にもアクセスできる

**公開前に必ず確認すること**

- `.env` の `ADMIN_PASSWORD` を、今設定されている簡易な値から推測されにくいものに変更する（外部公開する以上、総当たりされうる）
- `AUTH_SECRET` はランダムな値になっているか確認する（`openssl rand -hex 32` で再生成可）
- ログインセッションCookieは本番モード (`NODE_ENV=production`、`npm run start` で自動的にそうなる) では `Secure` 属性付きで発行される。Cloudflare TunnelはHTTPSで終端するのでトンネル経由のURLでは問題なく動作するが、トンネルをバイパスして `http://<LANのIP>:4000` に直接アクセスすると、ブラウザがCookieを送らずログインが機能しない（想定通りの挙動）
- `next start` と `cloudflared tunnel` の両プロセスをイベント中ずっと起動したままにする必要がある（PCのスリープ・スクリーンロックでのスリープ移行に注意。`pm2` や `tmux`/`screen` での常駐化を推奨）
- 予約データは `dev.db` 1ファイルにしか存在しない。当日は定期的に別の場所へコピーしておくと、PCのトラブル時に復旧できる

### 方式A': Docker で起動する

方式Aの `npm run build` / `npm run start` の代わりに Docker で動かすこともできる。起動時に `prisma migrate deploy` が自動で実行される。DB は コンテナ内の `/app/data/app.db` に作られるので、ボリュームをマウントして永続化する。

```bash
docker build -t simrace-reserve .
```

```bash
docker run -d --name simrace-reserve --restart unless-stopped -p 4000:4000 -v simrace-data:/app/data -e ADMIN_PASSWORD='推測されにくいパスワード' -e AUTH_SECRET="$(openssl rand -hex 32)" simrace-reserve
```

- DB のバックアップは `docker cp simrace-reserve:/app/data/app.db ./backup.db` で取得できる
- 既存の `dev.db` を引き継ぐ場合は、受付開始前に `docker cp ./dev.db simrace-reserve:/app/data/app.db` → `docker restart simrace-reserve`
- `AUTH_SECRET` を変えるとログイン中のセッションが無効になるだけで、予約データには影響しない

### 方式B: Vercel + Postgres

外部ホスティングに載せたい場合の代替案。Vercelのようなサーバーレス環境ではファイルが永続化されないため、**Postgresへの切り替えが必須**。また Prisma 7 はDBごとに専用の「ドライバーアダプタ」を使うため、以下の切り替え作業が必要。

1. Vercelにデプロイ後、プロジェクトの Storage タブから Postgres を追加する（Neon/Supabase等の無料枠でも可）
2. `prisma/schema.prisma` の `datasource` を `provider = "postgresql"` に変更
3. Postgres用ドライバーアダプタを追加

   ```bash
   npm install pg @prisma/adapter-pg
   ```

4. `src/lib/db.ts` の `PrismaBetterSqlite3` を `PrismaPg` に差し替える

   ```ts
   import { PrismaPg } from "@prisma/adapter-pg";
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   ```

5. ローカルで `npx prisma migrate dev` を実行し直してPostgres用のマイグレーションを再生成し、コミットする
6. Vercelの環境変数に `DATABASE_URL`（Postgres接続文字列）・`ADMIN_PASSWORD`・`AUTH_SECRET` を設定してデプロイ

## 検証済みの動作

- 同じ時間枠でも異なる機体であれば別々に予約できます
- 同じ枠・同じ機体への二重予約はDBトランザクションでブロックされます
- 予約キャンセル時は該当の枠・機体が再度予約可能に戻ります
- 予約履歴のある機体は削除できず、非稼働(isActive=false)への切り替えのみ可能です
- 管理画面 (`/admin/*`, `/api/admin/*`) は未ログイン時に自動的にログイン画面へリダイレクト／401を返します

## 既知の注意点

- `middleware.ts` は Next.js 16 で非推奨表示が出ますが（`proxy.ts` への移行案内）、現時点では動作に問題ありません。
