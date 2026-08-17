
'use client';

import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
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
  // 1. تهيئة التطبيق (App Singleton)
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(firebaseConfig);
  }

  // 2. تهيئة قاعدة البيانات (Firestore Singleton)
  // نتحقق أولاً مما إذا كانت مخزنة في النافذة العالمية لمنع تعارضات الـ Lease في Next.js
  if ((window as any)._firebaseDb) {
    db = (window as any)._firebaseDb;
  } else {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        }),
        /**
         * حل مشكلة تعذر الوصول للسيرفر في الشبكات الضعيفة (مثل اليمن).
         * نجبر Firestore على استخدام HTTP Long Polling بدلاً من WebSockets
         * لأنها أكثر استقراراً ولا تنقطع بسهولة عند ضعف الإشارة.
         */
        experimentalForceLongPolling: true,
      });
      (window as any)._firebaseDb = db;
      console.log("🚀 تم تفعيل محرك البيانات المستقر (Long Polling) لمنصة سراج");
    } catch (e) {
      console.warn("Firestore initialization warning, falling back to getFirestore:", e);
      db = getFirestore(app);
    }
  }
  
  // 3. تهيئة نظام المصادقة (Auth Singleton)
  if ((window as any)._firebaseAuth) {
    auth = (window as any)._firebaseAuth;
  } else {
    auth = getAuth(app);
    (window as any)._firebaseAuth = auth;
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
