'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager,
  getFirestore
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * تهيئة فايربيس بنظام "المثيل الوحيد" المستقر جداً.
 * نستخدم متغيراً عالمياً (window) لضمان عدم إعادة التهيئة التي تسبب خطأ Primary Lease.
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
  if ((window as any)._firebaseDb) {
    db = (window as any)._firebaseDb;
  } else {
    /**
     * إعدادات المحرك المستقر:
     * - experimentalForceLongPolling: لتجنب مشاكل GRPC في الشبكات المقيدة أو البطئ الشديد.
     * - persistentLocalCache: لتفعيل العمل في وضع الاوفلاين وتحسين السرعة.
     * - tabManager: استخدام persistentSingleTabManager لتقليل تأخير الاتصال الناتج عن مزامنة التبويبات المتعددة.
     */
    const firestoreSettings = {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager()
      })
    };

    try {
      // محاولة التهيئة بالإعدادات المستقرة
      db = initializeFirestore(app, firestoreSettings);
      console.log("🚀 تم تفعيل محرك البيانات المستقر (Long Polling + Single Tab)");
    } catch (e) {
      console.warn("فشلت التهيئة المخصصة، يتم التراجع للنسخة الأساسية");
      db = getFirestore(app);
    }
    (window as any)._firebaseDb = db;
  }
  
  // 3. تهيئة نظام المصادقة (Auth Singleton)
  if ((window as any)._firebaseAuth) {
    auth = (window as any)._firebaseAuth;
  } else {
    auth = getAuth(app);
    // ضمان بقاء الجلسة نشطة في المتصفح
    setPersistence(auth, browserLocalPersistence).catch(() => {});
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
