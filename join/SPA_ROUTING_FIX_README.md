# SPA Routing Fix - Lösungen für "Not Found" Fehler

## Problem
Single Page Applications (SPAs) wie Angular verwalten Routen clientseitig. Wenn Benutzer direkt eine URL aufrufen oder die Seite neu laden, sucht der Server nach einer physischen Datei, die nicht existiert.

## Lösungen nach Server-Typ

### 1. Apache Server (.htaccess)
**Hauptlösung:** Verwenden Sie die `.htaccess` Datei
**Alternative:** Verwenden Sie `.htaccess-alternative` falls die Hauptlösung nicht funktioniert

### 2. Nginx Server
Verwenden Sie die Konfiguration aus `nginx.conf` in Ihrer Server-Konfiguration

### 3. IIS/Windows Server
Verwenden Sie die `web.config` Datei

### 4. Netlify/Vercel/ähnliche Services
Verwenden Sie die `_redirects` Datei

### 5. PHP Server
Verwenden Sie `index.php` als Fallback

### 6. Server ohne URL Rewriting
Verwenden Sie `404.html` als Fallback-Lösung

## Deployment-Schritte

1. **Alle Dateien aus `dist/join/browser` hochladen**
2. **Je nach Server-Typ die entsprechende Konfiguration aktivieren**
3. **Testen Sie diese URLs:**
   - `https://ihre-domain.com/` (Startseite)
   - `https://ihre-domain.com/board` (Board-Seite)
   - `https://ihre-domain.com/summary` (Summary-Seite)
   - `https://ihre-domain.com/contacts` (Contacts-Seite)

## Fehlerbehebung

### Fall 1: .htaccess funktioniert nicht
- Überprüfen Sie, ob mod_rewrite aktiviert ist
- Verwenden Sie `.htaccess-alternative`
- Kontaktieren Sie Ihren Hosting-Provider

### Fall 2: Immer noch 404 Fehler
1. Löschen Sie die aktuelle `.htaccess`
2. Benennen Sie `.htaccess-alternative` zu `.htaccess` um
3. Laden Sie die Datei erneut hoch

### Fall 3: Assets (CSS/JS) laden nicht
- Überprüfen Sie den `<base href="/">` Tag in index.html
- Stellen Sie sicher, dass alle Asset-Pfade korrekt sind

## Wichtige Hinweise

- ✅ Alle Konfigurationsdateien müssen im **Root-Verzeichnis** liegen
- ✅ Der `<base href="/">` Tag muss in index.html korrekt gesetzt sein
- ✅ Asset-Ordner (`assets/`, `media/`) müssen ausgeschlossen werden
- ⚠️ Testen Sie nach jeder Änderung alle Routen

## Support

Falls das Problem weiterhin besteht:
1. Teilen Sie uns den Server-Typ mit (Apache, Nginx, IIS, etc.)
2. Überprüfen Sie die Browser-Konsole auf Fehler
3. Testen Sie die .htaccess-Regeln mit einem Online-Tool
