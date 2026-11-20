$ErrorActionPreference = 'Stop'

Write-Host '==> 构建 Web 资源'
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '==> 同步 Capacitor'
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '==> 构建签名 Release APK'
Push-Location android
try {
    .\gradlew.bat assembleRelease --no-daemon
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

$apk = 'android/app/build/outputs/apk/release/app-release.apk'
if (Test-Path $apk) {
    $dest = "shengshengyueer-learn-release.apk"
    Copy-Item $apk $dest -Force
    Write-Host "==> 完成：$dest"
} else {
    Write-Error '未找到 release APK'
    exit 1
}
