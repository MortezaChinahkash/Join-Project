// Template for environment configuration - DO NOT COMMIT REAL VALUES
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.region.firebasedatabase.app",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  }
};

// Instructions:
// 1. Copy this file to environment.ts
// 2. Replace all "YOUR_*" values with your actual Firebase configuration
// 3. Never commit the real environment.ts file to version control
