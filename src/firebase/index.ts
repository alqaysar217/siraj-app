
'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let persistenceEnabled = false;

/**
 * تهيئة خدمات Firebase بأمان باستخدام نمط Singleton.
 * تم إضافة ميزة enableMultiTabIndexedDbPersistence لتسريع تحميل البيانات 
 * وضمان عمل المنصة في ظروف الإنترنت الضعيفة.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined' || !isFirebaseConfigValid()) {
    return { app: null, auth: null, db: null };
  }

  try {
    // 1. تأمين مثيل التطبيق (App Instance)
    if (!app) {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        app = existingApps[0];
      } else {
        app = initializeApp(firebaseConfig);
      }
    }

    // 2. تأمين مثيل قاعدة البيانات (Firestore Instance) مع التخزين المحلي
    if (!db) {
      db = getFirestore(app);

      // تفعيل ميزة التخزين المحلي الذكي (Persistence)
      // تتيح للمنصة تحميل البيانات فوراً من ذاكرة الجهاز قبل طلبها من السحابة
      if (!persistenceEnabled && typeof window !== 'undefined') {
        enableMultiTabIndexedDbPersistence(db).catch((err) => {
          if (err.code === 'failed-precondition') {
            // تحدث إذا فتح المستخدم تبويبات كثيرة في نفس الوقت
            console.warn("تنبيه: التخزين المحلي يعمل في تبويب آخر.");
          } else if (err.code === 'unimplemented') {
            // تحدث إذا كان المتصفح قديماً جداً ولا يدعم الميزة
            console.warn("تنبيه: المتصفح الحالي لا يدعم ميزة العمل دون اتصال.");
          }
        });
        persistenceEnabled = true;
      }
    }

    // 3. تأمين مثيل الحماية (Auth Instance)
    if (!auth) {
      auth = getAuth(app);
    }
  } catch (error) {
    console.error("Firebase Critical Initialization Error:", error);
  }
  
  return { 
    app: app || null, 
    auth: auth || null, 
    db: db || null 
  };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-memo-firebase';
export * from './errors';
export * from './error-emitter';
