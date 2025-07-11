// Template for environment configuration - DO NOT COMMIT REAL VALUES
export const firebaseConfig = {

  apiKey: "AIzaSyAMajQkymTiHB35Z5gmSzy8ezCv432D87A",

  authDomain: "join-project-a437a.firebaseapp.com",

  databaseURL: "https://join-project-a437a-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "join-project-a437a",

  storageBucket: "join-project-a437a.firebasestorage.app",

  messagingSenderId: "848614889298",

  appId: "1:848614889298:web:c448e996f46de06252cc8b",

  measurementId: "G-X4R986D1CT"

};

export const environment = {
  production: true, // Set to true for production builds
  firebase: firebaseConfig
};


// Instructions:
// 1. Copy this file to environment.ts
// 2. Replace all "YOUR_*" values with your actual Firebase configuration
// 3. Never commit the real environment.ts file to version control
