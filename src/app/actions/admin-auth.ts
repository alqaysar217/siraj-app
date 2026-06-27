'use server';

import * as admin from 'firebase-admin';

/**
 * تهيئة Firebase Admin بشكل آمن للعمل في بيئة الخادم (Server-side)
 * يتم استخدام الإعدادات الافتراضية للبيئة السحابية لضمان الاستقرار
 */
if (!admin.apps.length) {
  try {
    admin.initializeApp();
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
  if (!uid) return { success: false, error: "معرف المستخدم مفقود" };

  try {
    const auth = admin.auth();
    const db = admin.firestore();

    // 1. تحديث كلمة السر في نظام الحماية الأساسي (Auth) لتصبح الكلمة المؤقتة
    await auth.updateUser(uid, {
      password: 'student123',
    });

    // 2. تحديث علامة الفرض في Firestore لضمان تحويله لصفحة التغيير فور دخوله
    // نستخدم الـ UID كمعرف للمستند لأنه هو المعيار في منصة سراج
    await db.collection('users').doc(uid).update({
      forcePasswordChange: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully reset password for user: ${uid}`);
    return { success: true };
  } catch (error: any) {
    console.error("Reset Password Error Details:", error);
    
    // معالجة الأخطاء الشائعة
    let userFriendlyError = "حدث خطأ أثناء محاولة تصفير كلمة السر.";
    if (error.code === 'auth/user-not-found') {
      userFriendlyError = "لم يتم العثور على هذا المستخدم في نظام الحماية.";
    }

    return { success: false, error: userFriendlyError };
  }
}
