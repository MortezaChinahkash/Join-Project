# 🔐 Join App - Login & Signup Guide (ELI10)

## Was ist das hier?

Diese App hat ein **Login-System** wie bei YouTube, Instagram oder anderen Apps. Du kannst:
- Ein **Konto erstellen** (Signup)
- Dich **anmelden** (Login) 
- Als **Gast** reinschauen (ohne Konto)
- Dich wieder **abmelden** (Logout)

Wir benutzen **Firebase** - das ist wie ein unsichtbarer Helfer von Google, der alle Passwörter sicher aufbewahrt.

---

## 🚀 Wie funktioniert das Login-System?

### 1. **Neues Konto erstellen (Signup)**
```typescript
// So registriert sich jemand:
await authService.register("Max Mustermann", "max@email.com", "meinpasswort123");
```

**Was passiert:**
1. Du gibst deinen Namen, Email und Passwort ein
2. Firebase prüft: "Gibt es diese Email schon?"
3. Wenn nein → Konto wird erstellt ✅
4. Wenn ja → Fehlermeldung: "Email bereits vergeben" ❌

### 2. **Anmelden (Login)**
```typescript
// So meldet sich jemand an:
await authService.login("max@email.com", "meinpasswort123");
```

**Was passiert:**
1. Du gibst Email und Passwort ein
2. Firebase prüft: "Stimmen die Daten?"
3. Wenn ja → Du bist drin! ✅
4. Wenn nein → Fehlermeldung: "Falsche Daten" ❌

### 3. **Als Gast anmelden**
```typescript
// So geht's ohne Konto:
await authService.loginAsGuest();
```

**Was passiert:**
1. Du klickst "Als Gast anmelden"
2. Firebase erstellt ein temporäres "Geister-Konto"
3. Du kannst die App benutzen, aber deine Daten werden nicht gespeichert

### 4. **Abmelden (Logout)**
```typescript
// So meldest du dich ab:
await authService.logout();
```

**Was passiert:**
1. Firebase "vergisst" dass du angemeldet bist
2. Du wirst zur Login-Seite weitergeleitet
3. Alle deine Daten in der App werden gelöscht

---

## 🏗️ Wie ist das programmiert?

### **AuthService** - Der Login-Manager
Das ist wie der **Türsteher** einer Disco. Er entscheidet wer rein darf:

```typescript
export class AuthService {
  // Speichert den aktuellen Benutzer
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  // Alle anderen können sehen wer angemeldet ist
  public currentUser$ = this.currentUserSubject.asObservable();
}
```

### **User Interface** - Wie sehen Benutzer aus?
```typescript
export interface User {
  id: string;        // Eindeutige Nummer (wie Personalausweis)
  name: string;      // "Max Mustermann"
  email: string;     // "max@email.com"
  isGuest: boolean;  // true = Gast, false = echter Benutzer
}
```

### **Firebase Connection** - Die Verbindung
```typescript
// Firebase wird so eingerichtet:
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

constructor(private auth: Auth) {
  // Lauscht ob jemand sich an- oder abmeldet
  onAuthStateChanged(this.auth, (firebaseUser) => {
    if (firebaseUser) {
      // Jemand hat sich angemeldet!
    } else {
      // Jemand hat sich abgemeldet!
    }
  });
}
```

---

## 📱 Alle Login-Methoden erklärt

### **1. register() - Neues Konto**
```typescript
async register(name: string, email: string, password: string): Promise<User> {
  try {
    // 1. Firebase erstellt Konto
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    
    // 2. Name wird gespeichert
    await updateProfile(userCredential.user, { displayName: name });
    
    // 3. Benutzer wird zurückgegeben
    return this.mapFirebaseUserToUser(userCredential.user);
  } catch (error) {
    // 4. Wenn Fehler → verständliche Nachricht
    throw this.handleAuthError(error);
  }
}
```

**Mögliche Fehler:**
- `auth/email-already-in-use` → "Email bereits vergeben"
- `auth/weak-password` → "Passwort zu schwach (min. 6 Zeichen)"
- `auth/invalid-email` → "Ungültige Email-Adresse"

### **2. login() - Anmelden**
```typescript
async login(email: string, password: string): Promise<User> {
  try {
    // Firebase prüft Email + Passwort
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return this.mapFirebaseUserToUser(userCredential.user);
  } catch (error) {
    throw this.handleAuthError(error);
  }
}
```

**Mögliche Fehler:**
- `auth/user-not-found` → "Benutzer existiert nicht"
- `auth/wrong-password` → "Falsches Passwort"
- `auth/too-many-requests` → "Zu viele Versuche, warte kurz"

### **3. loginAsGuest() - Gast-Anmeldung**
```typescript
async loginAsGuest(): Promise<User> {
  try {
    // Firebase erstellt anonymen Benutzer
    const userCredential = await signInAnonymously(this.auth);
    return this.mapFirebaseUserToUser(userCredential.user);
  } catch (error) {
    throw this.handleAuthError(error);
  }
}
```

**Was ist anders bei Gästen:**
- Keine Email/Passwort nötig
- Daten gehen verloren wenn Browser geschlossen wird
- Können später zu echten Benutzern "aufgewertet" werden

### **4. logout() - Abmelden**
```typescript
async logout(): Promise<void> {
  try {
    // Firebase meldet ab
    await signOut(this.auth);
    // Weiterleitung zur Login-Seite
    this.router.navigate(['/auth']);
  } catch (error) {
    throw new Error('Abmelden fehlgeschlagen');
  }
}
```

---

## 🛡️ Wie werden Passwörter geschützt?

### **Firebase Sicherheit:**
1. **Verschlüsselung:** Passwörter werden nie im Klartext gespeichert
2. **HTTPS:** Alle Daten werden verschlüsselt übertragen
3. **Rate Limiting:** Zu viele falsche Versuche werden blockiert
4. **Session Management:** Automatisches Abmelden nach Zeit

### **Was wir NICHT sehen:**
- Deine echten Passwörter (Firebase verschlüsselt sie)
- Persönliche Daten (nur was du freigibst)

### **Was wir sehen:**
- Deine Email (zum Anmelden)
- Deinen Namen (zum Anzeigen)
- Ob du angemeldet bist

---

## 🔧 Für Entwickler: Setup

### **1. Firebase Projekt erstellen**
1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Klicke "Neues Projekt" 
3. Gib einen Namen ein (z.B. "MeinLoginApp")
4. Folge den Schritten

### **2. Authentication aktivieren**
1. In Firebase → "Authentication" → "Sign-in method"
2. Aktiviere "Email/Password" 
3. Aktiviere "Anonymous" (für Gäste)

### **3. Web-App hinzufügen**
1. In Projektübersicht → Web-Symbol `</>`
2. App-Name eingeben
3. Firebase Config kopieren

### **4. Config in Angular einfügen**
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "deine-api-key",
    authDomain: "dein-projekt.firebaseapp.com",
    projectId: "dein-projekt",
    // ... weitere Werte
  }
};
```

### **5. Packages installieren**
```bash
npm install firebase @angular/fire
```

---

## 🎯 Wie benutzt man das Login-System?

### **In Components:**
```typescript
export class LoginComponent {
  constructor(private authService: AuthService) {}
  
  async onLogin() {
    try {
      const user = await this.authService.login(this.email, this.password);
      console.log('Angemeldet als:', user.name);
    } catch (error) {
      console.log('Fehler:', error.message);
    }
  }
}
```

### **Prüfen ob angemeldet:**
```typescript
// Ist jemand angemeldet?
if (this.authService.isAuthenticated) {
  console.log('Benutzer ist da!');
}

// Ist es ein Gast?
if (this.authService.isGuest) {
  console.log('Das ist ein Gast');
}

// Aktueller Benutzer
const user = this.authService.currentUser;
console.log('Angemeldet als:', user?.name);
```

### **Auf Änderungen hören:**
```typescript
// Wird benachrichtigt wenn sich jemand an/abmeldet
this.authService.currentUser$.subscribe(user => {
  if (user) {
    console.log('Jemand hat sich angemeldet:', user.name);
  } else {
    console.log('Jemand hat sich abgemeldet');
  }
});
```

---

## 🚨 Route Guards - Türsteher für Seiten

### **AuthGuard - Nur für angemeldete Benutzer**
```typescript
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    if (this.authService.isAuthenticated) {
      return true; // Darf rein!
    }
    
    this.router.navigate(['/auth']); // Zur Login-Seite!
    return false; // Nicht rein!
  }
}
```

### **Routing Setup:**
```typescript
const routes: Routes = [
  { path: 'auth', component: AuthComponent }, // Für alle zugänglich
  { 
    path: '', 
    component: MainContentComponent,
    canActivate: [AuthGuard], // Nur für angemeldete!
    children: [
      { path: 'board', component: BoardComponent },
      { path: 'contacts', component: ContactsComponent }
    ]
  }
];
```

---

## 📋 Zusammenfassung - Was macht was?

| Feature | Was passiert | Beispiel |
|---------|--------------|----------|
| **Signup** | Neues Konto erstellen | "Max" + "max@test.com" + "123456" |
| **Login** | Mit bestehendem Konto anmelden | Email + Passwort eingeben |
| **Guest Login** | Temporär ohne Konto | Klick auf "Als Gast" |
| **Logout** | Sich abmelden | Alle Daten werden gelöscht |
| **Session** | Angemeldet bleiben | Auch nach Browser-Neustart |
| **Guards** | Seiten schützen | Nur angemeldete sehen Board |

---

## 🔍 Debugging - Wenn was nicht klappt

### **Firebase Console prüfen:**
1. Gehe zu Firebase Console → Authentication → Users
2. Siehst du neue Benutzer? ✅
3. Keine Benutzer? → Config prüfen ❌

### **Browser Console:**
```javascript
// Aktueller Benutzer in der Console
console.log('Aktueller Benutzer:', authService.currentUser);

// Firebase Auth Status
console.log('Firebase Auth:', auth.currentUser);
```

### **Häufige Probleme:**
- **"Firebase not defined"** → Config fehlt in environment.ts
- **"Operation not allowed"** → Email/Password in Firebase Console nicht aktiviert
- **"Network error"** → Internet-Verbindung prüfen
- **"Invalid email"** → Email-Format falsch

---

## 🎉 Das war's!

Jetzt weißt du wie das Login-System funktioniert! 

**Kurz gesagt:**
1. Firebase ist unser Passwort-Manager
2. AuthService ist unser App-Manager  
3. Components zeigen die Formulare
4. Guards schützen geheime Seiten

**Du kannst jetzt:**
- Neue Konten erstellen ✅
- Benutzer anmelden ✅  
- Gäste reinlassen ✅
- Sicher abmelden ✅
- Seiten schützen ✅

Viel Spaß beim Programmieren! 🚀
