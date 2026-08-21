'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  Firestore, 
  initializeFirestore
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * تهيئة فايربيس بنظام الاتصال المستقر.
 * فرض استخدام Long Polling لحل مشكلة الـ 10 ثوانٍ (Timeout) بشكل نهائي.
 */
if (typeof window !== 'undefined' && isFirebaseConfigValid()) {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(firebaseConfig);
  }

  if (!(window as any)._firebaseDb) {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true, // فرض البروتوكول المستقر
    });
    (window as any)._firebaseDb = db;
  } else {
    db = (window as any)._firebaseDb;
  }
  
  if (!(window as any)._firebaseAuth) {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    (window as any)._firebaseAuth = auth;
  } else {
    auth = (window as any)._firebaseAuth;
  }
}

export { app, auth, db };

export function initializeFirebase() {
  return { app, auth, db };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-memo-firebase';
export * from './errors';
export * from './error-emitter';
