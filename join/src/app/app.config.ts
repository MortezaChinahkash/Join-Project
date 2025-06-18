import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "join-project-a437a", appId: "1:848614889298:web:c448e996f46de06252cc8b", databaseURL: "https://join-project-a437a-default-rtdb.europe-west1.firebasedatabase.app", storageBucket: "join-project-a437a.firebasestorage.app", apiKey: "AIzaSyAMajQkymTiHB35Z5gmSzy8ezCv432D87A", authDomain: "join-project-a437a.firebaseapp.com", messagingSenderId: "848614889298", measurementId: "G-X4R986D1CT" })), provideFirestore(() => getFirestore())]
};
