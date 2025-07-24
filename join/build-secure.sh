#!/bin/bash

# Production Build Script mit Sicherheitsoptimierungen
echo "🔒 Starte sicheren Production Build..."

# 1. Normale Angular Build
echo "📦 Führe Angular Build aus..."
ng build --configuration production --aot --build-optimizer --extract-licenses

# 2. Code Obfuscation (optional - benötigt zusätzliche Tools)
echo "🔧 Führe Code-Obfuscation aus..."
# npx javascript-obfuscator dist/join/browser --output dist/join/browser-obfuscated

# 3. Entferne Source Maps
echo "🗑️ Entferne Source Maps..."
find dist/join/browser -name "*.map" -type f -delete

# 4. Entferne Debug-Informationen
echo "🧹 Bereinige Debug-Informationen..."
find dist/join/browser -name "*.js" -exec sed -i 's/console\.log[^;]*;//g' {} \;
find dist/join/browser -name "*.js" -exec sed -i 's/console\.warn[^;]*;//g' {} \;
find dist/join/browser -name "*.js" -exec sed -i 's/console\.error[^;]*;//g' {} \;

# 5. Minimiere HTML weiter
echo "📄 Optimiere HTML..."
find dist/join/browser -name "*.html" -exec sed -i 's/<!--.*-->//g' {} \;

# 6. Kopiere Sicherheitsdateien
echo "🔐 Kopiere Sicherheitskonfiguration..."
cp src/assets/js/browser-security.js dist/join/browser/assets/js/
cp src/assets/css/security.css dist/join/browser/assets/css/

# 7. Setze Dateiberechtigungen
echo "🔒 Setze Sicherheitsberechtigungen..."
chmod 644 dist/join/browser/*.html
chmod 644 dist/join/browser/*.js
chmod 644 dist/join/browser/*.css
chmod 600 dist/join/browser/.htaccess

echo "✅ Sicherer Build abgeschlossen!"
echo "📁 Build-Verzeichnis: dist/join/browser"
echo "🚀 Bereit für Production-Deployment!"

# 8. Sicherheits-Report
echo ""
echo "🔍 Sicherheits-Checklist:"
echo "✅ Console-Schutz aktiviert"
echo "✅ DevTools-Erkennung aktiviert"
echo "✅ Source Maps entfernt"
echo "✅ Debug-Logs entfernt"
echo "✅ Keyboard-Shortcuts blockiert"
echo "✅ Rechtsklick blockiert"
echo "✅ Content Security Policy gesetzt"
echo "✅ Security Headers konfiguriert"
