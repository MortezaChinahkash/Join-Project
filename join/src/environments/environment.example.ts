// Template for Firebase environment configuration
// Copy this file to environment.ts and environment.prod.ts and replace with your actual Firebase config

export const environment = {
  production: false, // Set to true for production
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.REGION.firebasedatabase.app",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  }
};

/*
=== SETUP INSTRUCTIONS ===

1. Create a Firebase project at: https://console.firebase.google.com/
2. Go to Project Settings → General → Your apps
3. Add a web app or select existing one
4. Copy the Firebase configuration
5. Replace the placeholder values above with your actual config
6. Copy this file to:
   - src/environments/environment.ts (for development)
   - src/environments/environment.prod.ts (for production, set production: true)

7. Enable Authentication in Firebase Console:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Enable "Anonymous" (for guest login)

8. The actual config files (environment.ts, environment.prod.ts) are in .gitignore 
   so your Firebase credentials stay private
*/
