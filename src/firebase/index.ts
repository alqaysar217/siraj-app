'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  Firestore, 
  initializeFirestore, 
  getFirestore
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * تهيئة فايربيس بنظام "المثيل الوحيد" المستقر.
 * نفرض استخدام Long Polling لتجاوز مشاكل الاتصال (Timeout) الناتجة عن gRPC.
 */
if (typeof window !== 'undefined' && isFirebaseConfigValid()) {
  // 1. تهيئة التطبيق
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(firebaseConfig);
  }

  // 2. تهيئة قاعدة البيانات مع فرض Long Polling بشكل إلزامي
  if (!(window as any)._firebaseDb) {
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        // هذا الخيار يساعد في البيئات التي تمنع الـ WebSockets
      });
      console.log("🚀 Firestore Initialized with Forced Long Polling");
    } catch (e: any) {
      // في حال تم التهيئة مسبقاً، نكتفي بجلب المثيل الحالي
      db = getFirestore(app);
    }
    (window as any)._firebaseDb = db;
  } else {
    db = (window as any)._firebaseDb;
  }
  
  // 3. تهيئة نظام المصادقة
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
