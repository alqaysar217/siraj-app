'use server';

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "studio-4398737486-c7df0", // نفس معرف مشروعك
  });
}

/**
 * دالة لتصفير كلمة سر طالب معين برمجياً
 * تستخدم فقط من قبل المسؤولين عبر Server Actions
 */
export async function resetStudentPassword(uid: string) {
  try {
    // 1. تحديث كلمة السر في Firebase Auth Admin
    await admin.auth().updateUser(uid, {
      password: 'student123',
    });

    // 2. تحديث علامة الفرض في Firestore لضمان تحويله لصفحة التغيير فور دخوله
    const db = admin.firestore();
    await db.collection('users').doc(uid).update({
      forcePasswordChange: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return { success: false, error: error.message };
  }
}