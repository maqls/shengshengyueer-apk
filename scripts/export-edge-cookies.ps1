# Export jyeoo.com / zujuan.com cookies from the user's logged-in Edge browser.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/export-edge-cookies.ps1
# Output: scripts/.cookie-jyeoo.txt / scripts/.cookie-zujuan.txt (auto-read by crawlers)

Add-Type -AssemblyName System.Security

$Root = Split-Path -Parent $PSScriptRoot
$Local = $env:LOCALAPPDATA
$DbCandidates = @(
  "$Local\Microsoft\Edge\User Data\Default\Network\Cookies",
  "$Local\Microsoft\Edge\User Data\Profile 1\Network\Cookies",
  "$Local\Google\Chrome\User Data\Default\Network\Cookies"
)

# 用 Python 只为读取 sqlite（无需 win32crypt），输出 base64 加密值
$pyScript = @'
import sqlite3, sys, json, base64, shutil, os
db, local_state = sys.argv[1], sys.argv[2]
# 用 Python 解析 Local State（PS5 ConvertFrom-Json 对大 JSON 会失败）
key = None
try:
    with open(local_state, "r", encoding="utf-8") as f:
        st = json.load(f)
    ek = st.get("os_crypt", {}).get("encrypted_key")
    if ek:
        key = base64.b64encode(base64.b64decode(ek)).decode()  # 原始字节 base64
except Exception:
    pass
# Edge 运行时数据库可能被独占锁；尝试 URI 只读，失败则退回普通打开
# db 参数已是 PowerShell 复制出的临时文件
con = sqlite3.connect(db)
rows = []
for domain in ("jyeoo.com", "zujuan.com"):
    for row in con.execute(
        "select host_key,name,encrypted_value from cookies where host_key like ?",
        ("%" + domain,)
    ):
        host, name, enc = row
        rows.append({"domain": domain, "host": host, "name": name,
                     "value": base64.b64encode(enc).decode()})
con.close()
print(json.dumps({"key": key, "cookies": rows}))
'@

$pyFile = Join-Path $env:TEMP "edge_cookie_read.py"
[IO.File]::WriteAllText($pyFile, $pyScript)

function Unprotect-Dpapi([byte[]]$data) {
  return [System.Security.Cryptography.ProtectedData]::Unprotect(
    $data, $null, [System.Security.Cryptography.DataProtectionScope]::LocalMachine
  )
}

# Edge 130+ 使用 AES-GCM 加密 Cookie（前缀 v10/v20），密钥本身用 DPAPI 加密存在 Local State
function Get-AesKey($localStatePath) {
  if (-not (Test-Path $localStatePath)) { return $null }
  $json = Get-Content $localStatePath -Raw | ConvertFrom-Json
  $encKey = $json.os_crypt.encrypted_key
  if (-not $encKey) { return $null }
  $raw = [Convert]::FromBase64String($encKey)
  # 去掉 "DPAPI" 前缀（前5字节）
  $payload = $raw[5..($raw.Length - 1)]
  return Unprotect-Dpapi $payload
}

function Decrypt-Cookie([byte[]]$enc, [byte[]]$key) {
  if ($null -eq $enc -or $enc.Length -lt 3) { return $null }
  $prefix = [Text.Encoding]::ASCII.GetString($enc, 0, 3)
  if ($prefix -eq 'v10' -or $prefix -eq 'v20') {
    if ($null -eq $key) { return $null }
    # 格式: v10/v20 + nonce(12) + ciphertext + tag(16)
    $nonce = $enc[3..14]
    $cipher = $enc[15..($enc.Length - 1)]
    $aes = [System.Security.Cryptography.AesGcm]::new($key)
    $plain = New-Object byte[] ($cipher.Length - 16)
    $tag = $cipher[($cipher.Length - 16)..($cipher.Length - 1)]
    $ct = $cipher[0..($cipher.Length - 17)]
    try {
      $aes.Decrypt($nonce, $ct, $tag, $plain)
      return [Text.Encoding]::UTF8.GetString($plain)
    } catch { return $null }
  }
  # 旧版 DPAPI 加密
  try {
    $plain = Unprotect-Dpapi $enc
    return [Text.Encoding]::UTF8.GetString($plain)
  } catch { return $null }
}

foreach ($db in $DbCandidates) {
  if (-not (Test-Path $db)) { continue }
  # db = User Data\Default\Network\Cookies -> 上3层 = User Data
  $userData = Split-Path (Split-Path (Split-Path $db -Parent) -Parent) -Parent
  $localState = Join-Path $userData "Local State"

  # Edge 运行时独占锁定 DB；先尝试直接复制，失败则提示用户临时关闭 Edge
  $copy = "$db.cookie-copy"
  $copied = $false
  for ($attempt = 0; $attempt -lt 2 -and -not $copied; $attempt++) {
    try {
      $srcStream = [IO.File]::Open($db, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
      $dstStream = [IO.File]::Create($copy)
      $srcStream.CopyTo($dstStream)
      $dstStream.Close(); $srcStream.Close()
      $copied = $true
    } catch {
      if ($attempt -eq 0) {
        Write-Host "Edge is locking its cookie database. Please CLOSE all Edge windows, then press Enter here."
        Read-Host "Press Enter when Edge is closed"
      } else {
        Write-Host "Copy still failed: $($_.Exception.Message)"
      }
    }
  }
  if (-not $copied) { continue }
  $json = (& python $pyFile $copy $localState 2>$null) -join "`n"
  Remove-Item $copy -ErrorAction SilentlyContinue
  if (-not $json) { continue }
  $data = $json | ConvertFrom-Json
  $keyBytes = $null
  if ($data.key) {
    $rawKey = [Convert]::FromBase64String($data.key)
    # 去掉 "DPAPI" 前缀（前5字节）后解密
    $keyBytes = Unprotect-Dpapi $rawKey[5..($rawKey.Length - 1)]
  }
  Write-Host "Reading cookies: $db (key: $(if($keyBytes){'found'}else{'none'}), rows: $($data.cookies.Count))"

  $byDomain = @{}
  foreach ($row in $data.cookies) {
    $val = Decrypt-Cookie ([Convert]::FromBase64String($row.value)) $keyBytes
    if (-not $val) { continue }
    if (-not $byDomain.ContainsKey($row.domain)) { $byDomain[$row.domain] = @() }
    $byDomain[$row.domain] += "$($row.name)=$val"
  }
  foreach ($domain in $byDomain.Keys) {
    $keyName = if ($domain -eq 'jyeoo.com') { 'jyeoo' } else { 'zujuan' }
    $out = Join-Path $Root "scripts\.cookie-$keyName.txt"
    [IO.File]::WriteAllText($out, ($byDomain[$domain] -join '; '), [Text.Encoding]::UTF8)
    Write-Host "OK ${domain}: exported $($byDomain[$domain].Count) cookies -> $out"
  }
}
Remove-Item $pyFile -ErrorAction SilentlyContinue
Write-Host "Done. Crawlers will use these cookies automatically."
