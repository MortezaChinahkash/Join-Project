# Console Protection Build Script für Windows
Write-Host "🔒 Starte Console Protection Build..." -ForegroundColor Green

# 1. Normale Angular Build
Write-Host "📦 Führe Angular Build aus..." -ForegroundColor Yellow
ng build --configuration production --aot --build-optimizer --extract-licenses

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# 2. Entferne Source Maps (optional - kann auch gelassen werden)
Write-Host "🗑️ Entferne Source Maps..." -ForegroundColor Yellow
Get-ChildItem -Path "dist/join/browser" -Filter "*.map" -Recurse | Remove-Item -Force

# 3. Kopiere Console-Protection-Dateien
Write-Host "� Kopiere Console-Protection..." -ForegroundColor Yellow
$assetsJsPath = "dist/join/browser/assets/js"
$assetsCssPath = "dist/join/browser/assets/css"

if (!(Test-Path $assetsJsPath)) {
    New-Item -ItemType Directory -Path $assetsJsPath -Force
}

if (!(Test-Path $assetsCssPath)) {
    New-Item -ItemType Directory -Path $assetsCssPath -Force
}

if (Test-Path "src/assets/js/browser-security.js") {
    Copy-Item -Path "src/assets/js/browser-security.js" -Destination $assetsJsPath -Force
    Write-Host "✅ Console-Protection Script kopiert" -ForegroundColor Green
}

if (Test-Path "src/assets/css/security.css") {
    Copy-Item -Path "src/assets/css/security.css" -Destination $assetsCssPath -Force
    Write-Host "✅ Security CSS kopiert" -ForegroundColor Green
}

# 4. Überprüfe .htaccess
Write-Host "🔍 Überprüfe .htaccess..." -ForegroundColor Yellow
$htaccessPath = "dist/join/browser/.htaccess"

if (Test-Path $htaccessPath) {
    Write-Host "✅ .htaccess gefunden" -ForegroundColor Green
} else {
    Write-Host "⚠️ .htaccess nicht gefunden!" -ForegroundColor Yellow
}

# 5. Build-Report
Write-Host "" -ForegroundColor White
Write-Host "📊 Build-Statistiken:" -ForegroundColor Cyan

$buildSize = (Get-ChildItem -Path "dist/join/browser" -Recurse | Measure-Object -Property Length -Sum).Sum
$buildSizeMB = [math]::Round($buildSize / 1MB, 2)

Write-Host "📦 Build-Größe: $buildSizeMB MB" -ForegroundColor White

$jsFileCount = (Get-ChildItem -Path "dist/join/browser" -Filter "*.js" -Recurse).Count
$cssFileCount = (Get-ChildItem -Path "dist/join/browser" -Filter "*.css" -Recurse).Count
$htmlFileCount = (Get-ChildItem -Path "dist/join/browser" -Filter "*.html" -Recurse).Count

Write-Host "📄 Dateien: $jsFileCount JS, $cssFileCount CSS, $htmlFileCount HTML" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "✅ Console Protection Build abgeschlossen!" -ForegroundColor Green
Write-Host "📁 Build-Verzeichnis: dist/join/browser" -ForegroundColor White
Write-Host "🚀 Bereit für Production-Deployment!" -ForegroundColor Green

# 6. Console Protection Info
Write-Host "" -ForegroundColor White
Write-Host "🔍 Console Protection Features:" -ForegroundColor Cyan
Write-Host "✅ Console-Eingabe blockiert (eval, Function)" -ForegroundColor Green
Write-Host "✅ DOM-Manipulation eingeschränkt" -ForegroundColor Green
Write-Host "✅ Kritische Window-Properties geschützt" -ForegroundColor Green
Write-Host "✅ DevTools und Debugging erlaubt" -ForegroundColor Green
Write-Host "✅ Rechtsklick und normale Nutzung erlaubt" -ForegroundColor Green
Write-Host "✅ Source-Anzeige erlaubt" -ForegroundColor Green

# 7. Optional: Build-Verzeichnis öffnen
$openBuild = Read-Host "📂 Build-Verzeichnis öffnen? (y/n)"
if ($openBuild -eq "y" -or $openBuild -eq "Y") {
    Start-Process "dist/join/browser"
}
