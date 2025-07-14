# 🎯 Join App - Onboarding System

## 📋 Übersicht

Das Onboarding-System führt neue Benutzer durch die wichtigsten Funktionen der Join-App. Es zeigt eine interaktive Tour durch die Navigation mit Tooltip-Erklärungen für jede Hauptfunktion.

## 🚀 Funktionen

### ✨ Hauptfeatures
- **Automatisches Onboarding**: Startet automatisch nach der ersten Registrierung
- **Schritt-für-Schritt-Tour**: Führt durch Summary, Add Task, Board und Contacts
- **Responsive Design**: Funktioniert auf Desktop und Mobile
- **Überspringbar**: Benutzer können die Tour jederzeit beenden
- **Highlight-Effekt**: Hebt die jeweiligen Navigationselemente hervor

### 🎮 Interaktive Elemente
- **Vor/Zurück-Navigation**: Benutzer können zwischen Schritten navigieren
- **Schritt-Anzeige**: Zeigt aktuellen Fortschritt (z.B. "2 von 4")
- **Schließen-Button**: Ermöglicht das Beenden der Tour
- **Skip-Option**: Überspringt die komplette Tour

## 📂 Dateistruktur

```
src/app/
├── services/
│   └── onboarding.service.ts       # Hauptlogik für Onboarding
├── onboarding-overlay/
│   ├── onboarding-overlay.component.ts
│   ├── onboarding-overlay.component.html
│   └── onboarding-overlay.component.scss
└── main-content/
    ├── main-content.component.html  # Enthält onboarding-overlay
    └── main-content.ts             # Importiert OnboardingComponent
```

## 🛠️ Technische Implementierung

### OnboardingService
```typescript
// Hauptmethoden:
- startOnboarding()      // Startet die Tour
- nextStep()            // Nächster Schritt
- previousStep()        // Vorheriger Schritt
- skipOnboarding()      // Überspringt die Tour
- resetOnboarding()     // Zurücksetzen (für Tests)
```

### OnboardingStep Interface
```typescript
interface OnboardingStep {
  id: string;                    // Eindeutige ID
  title: string;                 // Überschrift
  description: string;           // Erklärtext
  route: string;                 // Ziel-Route
  targetElementSelector: string; // CSS-Selektor für Highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightNavItem?: string;     // Optional: Nav-Item-Highlight
}
```

## 🎨 Design-Features

### Visual Effects
- **Pulsing Highlight**: Animierte Hervorhebung des Zielelements
- **Smooth Transitions**: Weiche Übergänge zwischen Schritten
- **Backdrop Blur**: Weichgezeichneter Hintergrund
- **Tooltip Arrows**: Pfeile zeigen auf Zielelemente

### Responsive Anpassungen
- **Desktop**: Tooltips positioniert um Navigationselemente
- **Mobile**: Zentrierte Tooltips für bessere Lesbarkeit
- **Touch-Optimiert**: Große Buttons für Touch-Geräte

## 🔧 Konfiguration

### Onboarding-Schritte anpassen:
```typescript
// In onboarding.service.ts
private readonly onboardingSteps: OnboardingStep[] = [
  {
    id: 'summary',
    title: 'Summary Dashboard',
    description: 'Beschreibung hier...',
    route: '/summary',
    targetElementSelector: 'app-nav li.nav-item a[routerLink="summary"]',
    position: 'right'
  },
  // Weitere Schritte...
];
```

### Neue Schritte hinzufügen:
1. Neuen `OnboardingStep` in `onboardingSteps` Array hinzufügen
2. Route und Selektor definieren
3. Tooltip-Position festlegen

## 🧪 Testing

### Manuelles Starten (Browser-Konsole):
```javascript
// Startet Onboarding manuell
window.startOnboarding();
```

### Zurücksetzen:
```javascript
// Setzt Onboarding-Status zurück
localStorage.removeItem('join_onboarding_completed');
```

### Neuer User simulieren:
```javascript
// Simuliert neuen User
localStorage.setItem('join_new_user', 'true');
localStorage.removeItem('join_onboarding_completed');
// Dann Seite neu laden
```

## 📱 Responsive Verhalten

### Desktop (>768px)
- Tooltips erscheinen neben Navigationselementen
- Pfeile zeigen auf Zielelemente
- Kompakte Darstellung

### Mobile (<768px)
- Tooltips zentriert auf dem Bildschirm
- Keine Pfeile (da Position variiert)
- Größere Touch-Targets
- Vollbreite Buttons

## 🔄 Datenfluss

1. **User Registration**: `AuthService.register()` setzt `join_new_user` Flag
2. **Navigation**: Nach Login → Summary-Route
3. **Onboarding Check**: `OnboardingService` prüft Flags
4. **Tour Start**: Automatischer Start nach 1 Sekunde
5. **Step Navigation**: User navigiert durch Schritte
6. **Completion**: `join_onboarding_completed` Flag wird gesetzt

## 🎯 Benutzerführung

### Schritt 1: Summary
- Erklärt Dashboard-Funktionen
- Zeigt Task-Übersicht
- Navigation zu anderen Bereichen

### Schritt 2: Add Task
- Erklärung Task-Erstellung
- Formulare und Eingabefelder
- Prioritäten und Zuweisungen

### Schritt 3: Board
- Kanban-Board Konzept
- Drag & Drop Funktionalität
- Spalten-Organisation

### Schritt 4: Contacts
- Kontaktverwaltung
- Team-Mitglieder hinzufügen
- Zuweisung zu Tasks

## 🚨 Wichtige Hinweise

### Performance
- Lazy Loading: Komponente wird nur bei Bedarf geladen
- Minimale DOM-Manipulation
- Effiziente Event-Listener

### Accessibility
- Keyboard-Navigation unterstützt
- Screen-Reader freundlich
- High-Contrast Mode Support
- Reduced Motion Support

### Browser-Kompatibilität
- Modern Browser (ES6+)
- CSS Grid/Flexbox Support
- Touch-Event Support

## 🔍 Debugging

### Häufige Probleme:
1. **Tooltip erscheint nicht**: Prüfe CSS-Selektoren
2. **Falsche Position**: Überprüfe `getTooltipPosition()`
3. **Navigation funktioniert nicht**: Router-Konfiguration prüfen

### Debug-Logs:
```typescript
// In onboarding.service.ts aktivieren
console.log('Current step:', this.getCurrentStep());
console.log('Show onboarding:', this.showOnboarding$);
```

## 🚀 Deployment

### Produktionsbereit:
- Alle Debug-Logs entfernen
- CSS-Optimierung prüfen
- Performance-Tests durchführen
- Cross-Browser-Tests

### Fehlerbehebung:
```typescript
// Window-Funktion für Produktion deaktivieren
// In onboarding.service.ts entfernen:
(window as any).startOnboarding = () => this.manualStartOnboarding();
```

---

**Entwickler**: Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash  
**Version**: 1.0.0  
**Letzte Aktualisierung**: Januar 2025
