# ステラ 毎日自動コンテンツ生成スクリプト
# Windowsタスクスケジューラから呼び出す

$ProjectDir = "C:\Users\chirai\Desktop\deb\02supi"
$LogDir = "$ProjectDir\stella\logs"
$LogFile = "$LogDir\auto-generate-$(Get-Date -Format 'yyyyMMdd').log"

# ログディレクトリ作成
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# 実行開始ログ
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] stella-generate 自動実行開始" | Tee-Object -FilePath $LogFile -Append

# プロジェクトディレクトリに移動
Set-Location $ProjectDir

# Claude Code CLI で stella-generate を実行（5記事一括自動生成）
$prompt = "stella-generateスキルを --count 5 オプションで実行してください。知識ベースから未使用テーマを5つ自動選択し、各テーマについてnote記事・音声スクリプト・noteメタ情報・Spotifyメタ情報をすべて生成してください。生成後はgit add -A && git commit -m 'auto: 記事自動生成 $(Get-Date -Format yyyyMMdd)' && git push を実行してください。"

claude --print $prompt 2>&1 | Tee-Object -FilePath $LogFile -Append

# 実行終了ログ
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] stella-generate 自動実行完了" | Tee-Object -FilePath $LogFile -Append
