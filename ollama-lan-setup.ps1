$ErrorActionPreference = 'Continue'

Write-Host '===== 1. 本机局域网 IP =====' -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
  Select-Object InterfaceAlias, IPAddress | Format-Table -AutoSize

Write-Host '===== 2. 当前 11434 端口监听情况 =====' -ForegroundColor Cyan
$listeners = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
  $listeners | Select-Object LocalAddress, LocalPort, State | Format-Table -AutoSize
} else {
  Write-Host '未发现 11434 监听，Ollama 可能没启动或只监听 IPv6。' -ForegroundColor Yellow
}

Write-Host '===== 3. 设置 OLLAMA_HOST 并重启 Ollama =====' -ForegroundColor Cyan
[Environment]::SetEnvironmentVariable('OLLAMA_HOST', '0.0.0.0:11434', 'User')
$env:OLLAMA_HOST = '0.0.0.0:11434'
Write-Host '已设置 OLLAMA_HOST=0.0.0.0:11434（用户级，永久生效）'

$ollama = Get-Process ollama -ErrorAction SilentlyContinue
if ($ollama) {
  Write-Host '正在关闭现有的 Ollama 进程…' -ForegroundColor Yellow
  Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

Write-Host '启动 Ollama（监听所有网卡）…' -ForegroundColor Green
Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden
Start-Sleep -Seconds 4

Write-Host '===== 4. 本机自测 =====' -ForegroundColor Cyan
try {
  $tags = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 8
  Write-Host '本机访问成功，已安装模型：' -ForegroundColor Green
  $tags.models | Select-Object -ExpandProperty name
} catch {
  Write-Host "本机访问失败：$($_.Exception.Message)" -ForegroundColor Red
  Write-Host '请确认已安装 Ollama 且模型已下载（ollama pull qwen2.5:7b）。' -ForegroundColor Red
}

Write-Host '===== 5. 防火墙提示 =====' -ForegroundColor Cyan
Write-Host '如果手机仍连不上，请以管理员身份运行下面命令放行端口：'
Write-Host '  netsh advfirewall firewall add rule name="OllamaLAN" dir=in action=allow protocol=TCP localport=11434' -ForegroundColor Yellow
Write-Host ''
Write-Host '把「步骤1」里电脑的 IPv4 地址填到 App 设置页，例如 http://192.168.0.42:11434' -ForegroundColor Cyan
