'use client';

import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Initializes Firebase services safely.
 * Deployment Pulse: v1.8.0 - FIX: Robust Long Polling initialization to solve "Backend didn't respond" errors.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined' && isFirebaseConfigValid()) {
    try {
      const existingApps = getApps();
      if (!existingApps.length) {
        app = initializeApp(firebaseConfig);
        // نستخدم initializeFirestore مباشرة لضمان تطبيق الإعدادات قبل أي محاولة اتصال أخرى
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
        auth = getAuth(app);
      } else {
        app = getApp();
        auth = getAuth(app);
        db = getFirestore(app);
      }
    } catch (error) {
      console.error("Firebase Initialization Error:", error);
    }
  }
  
  return { app: app || null, auth: auth || null, db: db || null };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-memo-firebase';
export * from './errors';
export * from './error-emitter';