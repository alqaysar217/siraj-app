'use server';

import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

/**
 * تهيئة Firebase Admin بشكل احترافي للعمل في بيئة الخادم
 * نستخدم معرف المشروع من الإعدادات لضمان الاتصال الصحيح
 */
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

/**
 * دالة لتصفير كلمة سر طالب معين برمجياً من جهة الخادم
 * تستخدم فقط من قبل المسؤولين عبر Server Actions
 * @param uid - المعرف الفريد للطالب في Firebase Auth
 */
export async function resetStudentPassword(uid: string) {
  if (!uid) return { success: false, error: "معرف المستخدم (UID) مفقود" };

  try {
    const auth = admin.auth();
    const db = admin.firestore();

    // 1. تحديث كلمة السر في نظام الحماية الأساسي (Auth) لتصبح الكلمة المؤقتة
    // هذه العملية تتم في جهة السيرفر ولها أولوية قصوى
    await auth.updateUser(uid, {
      password: 'student123',
    });

    // 2. تحديث علامة الفرض في Firestore لضمان تحويله لصفحة التغيير فور دخوله
    // نستخدم الـ UID كمعرف للمستند لضمان التطابق
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      forcePasswordChange: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully reset password to 'student123' for UID: ${uid}`);
    return { success: true };
  } catch (error: any) {
    console.error("Reset Password Error Details:", error);
    
    let userFriendlyError = "حدث خطأ أثناء محاولة تصفير كلمة السر.";
    if (error.code === 'auth/user-not-found') {
      userFriendlyError = "لم يتم العثور على هذا المستخدم في نظام الحماية.";
    }

    return { success: false, error: userFriendlyError };
  }
}
