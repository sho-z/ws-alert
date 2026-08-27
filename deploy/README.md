# 実行環境について

GitHub Actionsのスケジュール実行（`.github/workflows/check.yml`）で完結しています。VPS等のサーバー管理は不要です。

- 実行間隔: 5分ごと（JST 7:00〜23:59のみ。cronはUTC基準で `*/5 0-14,22-23 * * *`）
- 状態(`state.json`)は毎回の実行後にリポジトリへコミットして永続化しています
- 認証情報（X APIキー・ntfyトピック）は GitHub Actions の Secrets に保存しており、リポジトリ本体には含まれません
- 手動実行やログ確認は `gh run list` / `gh run view` で行えます
