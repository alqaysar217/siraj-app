
'use server';

import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

/**
 * تهيئة Firebase Admin بشكل احترافي للعمل في بيئة الخادم
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
 * @param uid - المعرف الفريد للطالب في Firebase Auth (يجب أن يطابق معرف المستند)
 */
export async function resetStudentPassword(uid: string) {
  if (!uid) return { success: false, error: "معرف المستخدم (UID) مفقود" };

  try {
    const auth = admin.auth();
    const db = admin.firestore();

    // 1. تحديث كلمة السر في نظام الحماية الأساسي (Auth)
    // نستخدم student123 ككلمة مؤقتة
    await auth.updateUser(uid, {
      password: 'student123',
    });

    // 2. تحديث علامة الفرض في Firestore لضمان تحويله لصفحة التغيير
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      forcePasswordChange: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully reset password to 'student123' for UID: ${uid}`);
    return { success: true };
  } catch (error: any) {
    console.error("Reset Password Error Details:", error);
    
    let userFriendlyError = "حدث خطأ أثناء محاولة تصفير كلمة السر. تأكد من وجود صلاحيات كافية.";
    if (error.code === 'auth/user-not-found') {
      userFriendlyError = "لم يتم العثور على هذا المستخدم في نظام الحماية (Auth).";
    }

    return { success: false, error: userFriendlyError };
  }
}
