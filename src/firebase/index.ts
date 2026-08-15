'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * تهيئة فايربيس بنظام "المثيل الوحيد" المستقر.
 * نستخدم متغيراً عالمياً (window) في بيئة التطوير لمنع تكرار التهيئة عند تحديث الكود (HMR).
 */
if (typeof window !== 'undefined' && isFirebaseConfigValid()) {
  const existingApps = getApps();
  app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  
  // حماية من تكرار تهيئة Firestore في Next.js لتجنب خطأ Primary Lease
  const globalDb = (window as any)._firebaseDb;
  
  if (globalDb) {
    db = globalDb;
  } else {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        }),
        // حل مشكلة تعذر الوصول للسيرفر في الشبكات الضعيفة
        experimentalForceLongPolling: true,
      });
      (window as any)._firebaseDb = db;
      console.log("🚀 تم تشغيل محرك البيانات المستقر لمنصة سراج");
    } catch (e) {
      db = getFirestore(app);
    }
  }
  
  auth = getAuth(app);
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
