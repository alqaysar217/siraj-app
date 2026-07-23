
'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * تهيئة خدمات Firebase بأداء فائق (Ultra-Fast Initialization).
 * نستخدم هنا persistentLocalCache لضمان تخزين البيانات نصياً في جهاز المستخدم.
 * هذا يجعل الدورات والكتب تظهر فوراً (في أجزاء من الثانية) عند فتح الموقع مرة ثانية.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined' || !isFirebaseConfigValid()) {
    return { app: null, auth: null, db: null };
  }

  try {
    // 1. تأمين مثيل التطبيق
    if (!app) {
      const existingApps = getApps();
      app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
    }

    // 2. تأمين قاعدة البيانات مع التخزين المحلي المتقدم (Persistent Cache)
    if (!db) {
      // نستخدم initializeFirestore بدلاً من getFirestore لتفعيل الإعدادات المتقدمة للكاش
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      console.log("✅ تم تفعيل نظام التخزين المحلي الذكي لمنصة سراج");
    }

    // 3. تأمين مثيل الحماية
    if (!auth) {
      auth = getAuth(app);
    }
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
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
