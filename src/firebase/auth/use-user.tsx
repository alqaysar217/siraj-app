
'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

/**
 * خطاف إدارة المستخدم المطور (سراج v2)
 * يضمن استقرار الجلسة، التعامل مع تعدد الأجهزة، وترميم الملفات المفقودة
 */
export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isKickingRef = useRef(false);

  // 1. مراقبة حالة تسجيل الدخول الأساسية
  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  // 2. مراقبة الملف الشخصي والجلسات النشطة
  useEffect(() => {
    if (!db || !user || !auth) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, 
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);

          // نظام الأمان للطلاب فقط (الأدمن مستثنى)
          if (data.role === 'student' && !isKickingRef.current) {
            
            // أ- فحص الحظر
            if (data.status === 'banned') {
              isKickingRef.current = true;
              await signOut(auth);
              toast({ variant: "destructive", title: "الحساب محظور", description: "تم إيقاف صلاحية دخولك فوراً." });
              return;
            }

            // ب- فحص الجلسة النشطة (الطرد التبادلي)
            const localSessionId = localStorage.getItem('siraj_session_id');
            if (data.lastSessionId && localSessionId && data.lastSessionId !== localSessionId) {
              isKickingRef.current = true;
              await signOut(auth);
              localStorage.removeItem('siraj_session_id');
              toast({ variant: "destructive", title: "تنبيه أمني", description: "تم تسجيل الدخول من جهاز آخر، تم إنهاء هذه الجلسة." });
              return;
            }
          }
          setLoading(false);
        } else {
          // ج- نظام الترميم التلقائي (Auto-Repair)
          // في حال وجود Auth ولكن الملف مفقود في Firestore
          try {
            const repairData = {
              uid: user.uid,
              name: user.displayName || "طالب سراج",
              email: user.email,
              role: "student",
              status: "active",
              enrolledCourses: [],
              showInLeaderboard: true,
              deviceIds: [],
              createdAt: serverTimestamp()
            };
            await setDoc(userDocRef, repairData, { merge: true });
          } catch (e) {
            console.error("Profile repair failed");
          }
        }
      },
      (error) => {
        console.error("Profile sync error", error);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [db, user, auth]);

  return { 
    user, 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student'
  };
}
