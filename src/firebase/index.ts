'use client';

import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigValid } from './config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * تهيئة خدمات Firebase بأمان باستخدام نمط Singleton.
 * يمنع هذا التحديث أخطاء "INTERNAL ASSERTION FAILED" عبر ضمان استدعاء initializeFirestore مرة واحدة فقط.
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

    // 2. تأمين مثيل قاعدة البيانات (Firestore Instance)
    // نستخدم initializeFirestore لضبط الإعدادات التجريبية (Long Polling) المطلوبة في هذه البيئة
    if (!db) {
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      } catch (firestoreError) {
        // في حال كان Firestore مهيأ مسبقاً (مثلاً بواسطة HMR)، نقوم بجلب المثيل الحالي
        db = getFirestore(app);
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
