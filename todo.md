# Amateur Music Hub - TODO

## Phase 1: DB Schema & Backend API
- [x] DBスキーマ設計: tracks, comments, likes テーブル
- [x] Drizzle マイグレーション生成・適用
- [x] server/db.ts: 楽曲CRUD・コメント・いいね・タグのクエリヘルパー
- [x] server/routers/tracks.ts: 楽曲一覧・詳細・アップロード・削除API
- [x] server/routers/comments.ts: コメント投稿・取得API
- [x] server/routers/likes.ts: いいね・解除・カウントAPI
- [x] server/routers/users.ts: ユーザープロフィール・投稿楽曲一覧API
- [x] S3ストレージ連携（音楽ファイルアップロード）
- [x] Vitestテスト作成（8件パス）

## Phase 2: グローバルスタイル・レイアウト・ナビゲーション
- [x] index.css: ダーク系ネオンカラーテーマ設定（CSS変数）
- [x] Google Fonts設定（Inter + Space Grotesk）
- [x] App.tsx: ルーティング設定（全ページ）
- [x] components/Navbar.tsx: ナビゲーションバー（ロゴ・検索・ログイン）
- [x] components/GlobalPlayer.tsx: グローバル固定プレイヤー（下部）
- [x] contexts/PlayerContext.tsx: 再生状態管理コンテキスト

## Phase 3: 楽曲一覧・アップロード・検索ページ
- [x] pages/Home.tsx: ランディングページ（ヒーロー・新着・人気楽曲）
- [x] pages/Explore.tsx: 楽曲一覧（新着順・人気順・ジャンル絞り込み）
- [x] pages/Upload.tsx: 音楽アップロードページ（ファイル選択・メタデータ入力）
- [x] components/TrackCard.tsx: 楽曲カードコンポーネント

## Phase 4: 楽曲詳細・プレイヤー・波形・コメント・いいね
- [x] pages/TrackDetail.tsx: 楽曲詳細ページ
- [x] WaveSurfer.js による波形表示プレイヤー
- [x] コメント投稿・表示・削除
- [x] いいねボタン（楽観的更新）

## Phase 5: アーティストプロフィール・テスト・最終調整
- [x] pages/Profile.tsx: アーティストプロフィールページ
- [x] プロフィール編集機能（名前・自己紹介）
- [x] Vitestテスト（tracks, likes, comments, users）
- [x] TypeScriptエラー解消

## Phase 6: チェックポイント・デプロイ
- [x] 最終チェックポイント保存
