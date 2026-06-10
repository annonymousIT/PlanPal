# PlanPal

**あなたを学ぶAIカレンダー** / The Calendar That Learns You

Googleカレンダーと双方向同期しながら、ユーザーの「○/△/✕」評価とコメントから好みを学習し、自然言語で予定を提案・登録できるカレンダーアプリ。

---

## 🎯 何ができるか

- **Googleカレンダー双方向同期**：既存予定の取り込み／PlanPalで作った予定はGoogleにも反映／削除も同期
- **MagicBar（自然言語入力）**：「明日19時に飲み会」→ 即時登録／「来週どこかでランチ」→ AIが空き時間から3候補を提案
- **学習サイクル**：予定終了後に○/△/✕で評価＋一言コメント。次回以降のAI提案にカテゴリ別嗜好が反映される
- **3つのビュー**：月／週／日ビュー、時間枠クリックで即作成
- **カスタマイズ**：5色のアクセントカラー、ダーク/ライトモード、月曜/日曜始まり、設定はlocalStorage永続化

---

## 🧱 技術スタック

| レイヤ | 採用 | 理由 |
|---|---|---|
| **フロント** | Next.js 15 (App Router) + TypeScript + Tailwind v4 + Framer Motion | UIアニメーションの滑らかさを担保しつつ、SSRで初期表示を最適化 |
| **バックエンド** | Go + Gin + GORM | 並列処理（goroutine）で同期処理を非同期化／型安全と起動速度 |
| **DB** | PostgreSQL (Railway) | JSONBで参加者/嗜好の半構造データを格納、UUID標準サポート |
| **認証** | Google OAuth 2.0 + JWT (access 15min / refresh 30day) | 短命アクセストークン＋リフレッシュ機構で漏洩被害を限定 |
| **暗号化** | AES-256-GCM | OAuthトークンをDB保存時に暗号化、per-call nonce |
| **AI** | Google Gemini API | 自然言語クエリの曖昧解釈と複数候補生成 |
| **ホスティング** | Railway (backend + DB) + Vercel (frontend想定) | 環境変数管理とPostgreSQLのプロビジョニングが一体化 |

---

## 📂 ディレクトリ構成

```
PlanPal/
├── backend/
│   ├── main.go         # Ginルーティング、CORS、エントリポイント
│   ├── auth.go         # Google OAuth、JWT発行、AuthMiddleware
│   ├── calendar.go     # Google Calendar API（List/Create/Update/Delete/FreeBusy）
│   ├── handlers.go     # /api/events, /api/magic-bar, /api/calendar/sync
│   ├── ai.go           # Gemini呼び出し、DetectSpecificDatetime（正規表現2経路）
│   ├── security.go     # AES-256-GCM暗号化、JWT発行/検証
│   ├── database.go     # GORM初期化、AutoMigrate
│   └── models.go       # ScheduleEvent / UserPreference / CalendarConnection 他
└── frontend/
    └── src/
        ├── app/page.tsx              # メインダッシュボード、設定・認証状態管理
        ├── components/
        │   ├── MonthView.tsx         # 月ビュー（ホバー+ボタンで作成）
        │   ├── WeekView.tsx          # 週ビュー（時間枠クリックで作成）
        │   ├── DayView.tsx           # 日ビュー
        │   ├── EventPanel.tsx        # 予定詳細・編集・削除
        │   ├── QuickCreatePanel.tsx  # 時間枠クリックからの簡易作成
        │   ├── MagicBar.tsx          # 自然言語入力UI
        │   └── SettingsModal.tsx     # テーマ・アクセントカラー・週始まり
        ├── lib/
        │   ├── api.ts                # fetchラッパ、自動リフレッシュ、セッション切れイベント
        │   └── calendar-utils.ts     # 日付ヘルパー（getWeekDates 他）
        └── types/index.ts            # ScheduleEvent / UserSettings 型定義
```

---

## 🔑 主要な設計判断

各判断の **課題→判断→理由** を [振り返りラベル付きIssue](../../issues?q=label%3A%E6%8C%AF%E3%82%8A%E8%BF%94%E3%82%8A) に整理しています：

1. [#1 アクセントカラー：CSSカスケード制御の困難からJS強制注入への転換](../../issues/1)
2. [#2 Google同期予定とPlanPal独自予定の区別：ConnectionIDゼロ値を意味的マーカーに](../../issues/2)
3. [#3 OAuthログイン後のカレンダー初回同期を非同期化：体感速度を優先](../../issues/3)
4. [#4 MagicBar：具体的日時クエリでLLMをスキップする2経路設計](../../issues/4)
5. [#5 学習信頼度モデル：累計評価10件で1.0到達の線形スケール](../../issues/5)
6. [#6 OAuthトークンのAES-256-GCM暗号化保存：DB漏洩時の被害最小化](../../issues/6)

---

## 🔧 ローカル起動

### 必要なもの

- Go 1.21+
- Node.js 18+
- PostgreSQLインスタンス（Railwayなど）
- Google Cloud Console で OAuth 2.0 クライアント発行＋承認済みリダイレクトURIに `http://localhost:8080/auth/google/callback` 追加
- Gemini API キー

### バックエンド

```bash
cd backend
cp .env.example .env  # 値を埋める
go mod tidy
go run .
# → Server starting on :8080
```

`.env` に必要な値：

```env
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback
GEMINI_API_KEY=...
JWT_SECRET=<32文字以上>
AES_KEY=<ちょうど32バイト>
FRONTEND_URL=http://localhost:3000
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## 🌐 API エンドポイント

| Method | Path | 用途 |
|---|---|---|
| `GET` | `/auth/google` | Google OAuthフロー開始 |
| `GET` | `/auth/google/callback` | OAuthコールバック、JWT発行 |
| `POST` | `/auth/refresh` | リフレッシュトークンでアクセストークン更新 |
| `GET` | `/api/user/me` | 自分のプロフィール |
| `GET` | `/api/events` | 予定一覧 |
| `POST` | `/api/events` | 予定作成（Googleにも自動push） |
| `PUT` | `/api/events/:id` | 予定更新（Googleにも反映） |
| `DELETE` | `/api/events/:id` | 予定削除（PlanPal由来ならGoogleからも削除） |
| `POST` | `/api/events/:id/feedback` | 評価＋コメント送信 |
| `DELETE` | `/api/events/:id/feedback` | 評価削除（嗜好カウントも巻き戻し） |
| `POST` | `/api/magic-bar` | 自然言語クエリ → 提案 |
| `POST` | `/api/calendar/sync` | 手動同期トリガー |

`/api/*` はすべて `AuthMiddleware` で JWT 検証が必須。

---

## 🧠 学習サイクルの仕組み

1. ユーザーが予定を○/△/✕で評価＋コメント
2. `HandleSubmitFeedback` が `updateUserPreference` をgoroutineで呼び出し
3. `UserPreference` テーブルに `category × {positive, negative, neutral}` のカウントが累積
4. `confidence = min(total / 10, 1.0)` で信頼度を更新
5. 次回 MagicBar 起動時、AIプロンプトに `buildFeedbackContext` がカテゴリ別評価＋参加者＋コメントを注入
6. Gemini はユーザーの嗜好を反映した候補を生成

詳細：[#5 学習信頼度モデル](../../issues/5)

---

## 🔐 セキュリティ方針

- **OAuthトークン**：AES-256-GCM で暗号化して保存（[詳細 #6](../../issues/6)）
- **JWT**：HS256、アクセス15分／リフレッシュ30日。期限切れは自動リフレッシュ、リフレッシュ失敗で `planpal:session-expired` イベント発火しUIをログアウト状態に
- **CORS**：`FRONTEND_URL` のみを許可
- **環境変数分離**：DB接続文字列とAES鍵を別変数で管理し、片方の漏洩経路だけでは突破できない構造に

---

## 📌 未実装／既知の改善余地

- HttpOnly Cookie ベースのトークン管理（現状はURLパラメータ → localStorage）
- ユーザーアカウント削除エンドポイント
- pgvector を使ったコメント埋め込み（より高度な嗜好推論）
- MagicBar の9候補バッチ（Phase 2 機能）
- AES_KEY のローテーション機構

---

## 📜 ライセンス

MIT
