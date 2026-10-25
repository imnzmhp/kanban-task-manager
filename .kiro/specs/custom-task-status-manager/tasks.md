# Implementation Plan: カスタムタスク状態管理システム

## Overview

カスタムタスク状態管理システムの実装は、既存のkanban-task-managerに動的状態管理機能を追加する包括的な拡張です。実装は基盤システムから始まり、UI統合、データ移行、最終統合の段階的アプローチで進めます。各タスクは段階的な進捗を確保し、既存システムとの互換性を維持しながら12の正確性プロパティを満たします。

## Tasks

- [x] 1. 基盤データ構造とタイプ定義の実装
  - [x] 1.1 カスタム状態のデータモデルを実装
    - src/types/CustomStatus.tsを作成
    - CustomStatus, StatusColor, ValidationResult インターフェースを定義
    - StoredDataV2, TaskV2 拡張インターフェースを定義
    - _Requirements: 1.1, 1.2, 10.1_

  - [ ]* 1.2 基盤データ構造のプロパティテストを作成
    - **Property 1: ステータス設定のシリアライゼーション往復**
    - **Validates: Requirements 10.3**

- [x] 2. 色生成システムとバリデーションの実装
  - [x] 2.1 ColorPaletteクラスを実装
    - src/utils/ColorPalette.tsを作成
    - LAB色空間での位置ベース色生成ロジック
    - WCAG AA準拠のコントラスト比計算機能
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 2.2 色生成のプロパティテストを作成
    - **Property 3: 色生成の位置一貫性**
    - **Property 5: WCAG準拠コントラスト保証**
    - **Validates: Requirements 4.3, 4.4, 4.2**

  - [x] 2.3 StatusValidatorクラスを実装
    - src/utils/StatusValidator.tsを作成
    - 状態名の検証ロジック（50文字制限、重複チェック）
    - 空白文字のトリム処理
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ]* 2.4 バリデーションのプロパティテストを作成
    - **Property 2: ステータス名検証の一貫性**
    - **Validates: Requirements 9.1, 9.2, 9.4**

- [x] 3. チェックポイント - 基盤コンポーネントの動作確認
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 状態管理システムの実装
  - [x] 4.1 StatusReducerを実装
    - src/contexts/StatusReducer.tsを作成
    - StatusState, StatusAction定義
    - CRUD操作、並び替え、エラーハンドリングのreducer関数
    - _Requirements: 1.1, 2.1, 3.2_

  - [ ]* 4.2 StatusReducerのプロパティテストを作成
    - **Property 4: 表示順序の整合性維持**
    - **Property 9: ステータス管理不変条件**
    - **Validates: Requirements 3.2, 3.3, 1.4, 1.5**

  - [x] 4.3 StatusContextを実装
    - src/contexts/StatusContext.tsxを作成
    - StatusContextValue インターフェース実装
    - CRUD操作メソッド（createStatus, updateStatus, deleteStatus等）
    - クエリメソッド（getStatusById, getColorForStatus等）
    - _Requirements: 1.2, 2.1, 2.2_

  - [ ]* 4.4 ステータス削除保護のプロパティテストを作成
    - **Property 6: ステータス削除保護**
    - **Property 11: 依存関係チェックの正確性**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 5. シリアライゼーションとストレージ層の実装
  - [x] 5.1 StatusSerializerクラスを実装
    - src/services/StatusSerializer.tsを作成
    - JSON形式でのシリアライゼーション/デシリアライゼーション
    - バージョンメタデータの管理
    - _Requirements: 10.1, 10.4, 10.5_

  - [ ]* 5.2 シリアライゼーションのプロパティテストを作成
    - **Property 1: ステータス設定のシリアライゼーション往復**
    - **Validates: Requirements 10.3**

  - [x] 5.3 LocalStorageServiceを拡張
    - 既存のLocalStorageServiceクラスを拡張
    - CustomStatus保存/読み込み機能を追加
    - StoredDataV2フォーマットサポート
    - _Requirements: 10.1, 10.2_

- [x] 6. データ移行システムの実装
  - [x] 6.1 MigrationSystemクラスを実装
    - src/services/MigrationSystem.tsを作成
    - v1データ検出とv2変換ロジック
    - バックアップ作成機能
    - データ整合性チェック
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 6.2 マイグレーションのプロパティテストを作成
    - **Property 8: マイグレーション可逆性**
    - **Validates: Requirements 7.2, 7.3**

- [x] 7. チェックポイント - バックエンド機能の統合テスト
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. UI支援サービスの実装
  - [x] 8.1 TruncationServiceクラスを実装
    - src/utils/TruncationService.tsを作成
    - レスポンシブな状態名省略ロジック
    - デスクトップ/モバイル別の文字数制限
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 8.2 省略表示のプロパティテストを作成
    - **Property 7: 省略表示の一貫性**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 9. StatusSettingsModalコンポーネントの実装
  - [x] 9.1 基本的なStatusSettingsModalを作成
    - src/components/StatusSettingsModal.tsxを作成
    - モーダルの基本構造とオープン/クローズ機能
    - 既存状態の表示リスト
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.2 @dnd-kit/sortableによるドラッグ&ドロップを実装
    - SortableListItemコンポーネントを作成
    - ドラッグ&ドロップによる並び替え機能
    - リアルタイム色プレビュー更新
    - _Requirements: 3.1, 3.2, 8.3_

  - [ ]* 9.3 リアルタイムプレビューのプロパティテストを作成
    - **Property 12: リアルタイムプレビュー同期**
    - **Validates: Requirements 8.3**

  - [x] 9.4 状態の追加・編集・削除機能を実装
    - インライン編集機能（ダブルクリック対応）
    - 新規状態追加フォーム
    - 削除確認ダイアログ
    - _Requirements: 1.3, 2.1, 6.4_

  - [ ]* 9.5 StatusSettingsModalのユニットテストを作成
    - モーダル操作、フォーム検証、エラーハンドリングのテスト
    - アクセシビリティ（キーボード操作）のテスト

- [x] 10. Enhanced Columnコンポーネントの実装
  - [x] 10.1 動的状態対応のColumnを作成
    - 既存Column.tsxをEnhancedColumn.tsxとして拡張
    - CustomStatus対応の動的状態表示
    - 省略表示+ツールチップ機能
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 10.2 色遷移アニメーションを実装
    - 300ms CSS遷移アニメーション
    - アクセシビリティ（prefers-reduced-motion）対応
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [ ]* 10.3 Enhanced Columnのユニットテストを作成
    - 省略表示ロジック、ツールチップ、アニメーションのテスト

- [x] 11. KanbanBoardの統合と設定UI追加
  - [x] 11.1 KanbanBoardに設定ボタンを追加
    - ギアアイコンの設定ボタンをボードヘッダーに配置
    - StatusSettingsModalとの連携
    - _Requirements: 6.1, 6.2_

  - [x] 11.2 動的状態列の生成機能を実装
    - CustomStatusに基づく動的Column生成
    - 表示順序に従った列配置
    - _Requirements: 3.4, 6.5_

  - [ ]* 11.3 KanbanBoard統合のユニットテストを作成
    - 設定UI統合、動的列生成のテスト

- [x] 12. AppInitializerの拡張とプロバイダー統合
  - [x] 12.1 StatusProviderをAppProvidersに統合
    - 既存AppProviders.tsxにStatusProviderを追加
    - 適切な順序での Provider 配置
    - _Requirements: 7.1_

  - [x] 12.2 AppInitializerを拡張してデータ移行を実装
    - 既存AppInitializer.tsxにMigrationSystem統合
    - 起動時の自動データ移行処理
    - エラーハンドリングとフォールバック
    - _Requirements: 7.1, 7.4, 7.5_

- [x] 13. TaskContextの拡張（TaskV2対応）
  - [x] 13.1 TaskContextをCustomStatus対応に拡張
    - statusIdベースのタスク管理に変更
    - 既存APIの後方互換性維持
    - _Requirements: 7.2, 7.3_

  - [ ]* 13.2 TaskContext拡張のユニットテストを作成
    - 新旧フォーマット間の互換性テスト

- [x] 14. チェックポイント - 統合システムの動作確認
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. プロパティベーステストの統合
  - [ ]* 15.1 fast-checkライブラリのセットアップ
    - 依存関係追加とテスト設定
    - カスタムArbitraryの実装

  - [ ]* 15.2 残りの正確性プロパティのテスト実装
    - **Property 10: ユニークIDとシーケンシャル順序生成**
    - **Validates: Requirements 1.2**

- [x] 16. エラーハンドリングとログ機能の実装
  - [x] 16.1 SystemErrorとErrorSeverityの実装
    - src/types/SystemError.tsを作成
    - エラー分類と回復アクション機能
    - _Requirements: 設計文書のエラーハンドリング方針_

  - [x] 16.2 包括的エラーハンドリングを各コンポーネントに追加
    - データ整合性エラー、バリデーションエラー、ストレージエラーの処理
    - ユーザーフレンドリーなエラーメッセージ

- [x] 17. 最終統合とデモ機能の実装
  - [x] 17.1 システム全体の統合テストを実行
    - 全機能の動作確認
    - パフォーマンステストとメモリリーク検査

  - [x] 17.2 デモ用サンプルデータとガイドツアー機能を実装
    - 初回ユーザー向けのオンボーディング
    - カスタム状態のサンプルデータ

- [x] 18. 最終チェックポイント - システム完成の確認
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability  
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- **Programming Language**: TypeScript (as specified in design document)
- **Testing Framework**: Jest with fast-check for property-based testing
- **Key Dependencies**: @dnd-kit/sortable, react-beautiful-dnd (existing)
- **Migration Strategy**: Automatic v1→v2 conversion with backup creation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 4, "tasks": ["4.4", "5.2", "5.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "8.1"] },
    { "id": 6, "tasks": ["8.2", "9.1"] },
    { "id": 7, "tasks": ["9.2", "9.4"] },
    { "id": 8, "tasks": ["9.3", "9.5", "10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3"] },
    { "id": 10, "tasks": ["11.1", "11.2"] },
    { "id": 11, "tasks": ["11.3", "12.1"] },
    { "id": 12, "tasks": ["12.2", "13.1"] },
    { "id": 13, "tasks": ["13.2", "15.1"] },
    { "id": 14, "tasks": ["15.2", "16.1"] },
    { "id": 15, "tasks": ["16.2", "17.1"] },
    { "id": 16, "tasks": ["17.2"] }
  ]
}
```