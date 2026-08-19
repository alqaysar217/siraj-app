
'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isKickingRef = useRef(false);

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

  useEffect(() => {
    if (!db || !user || !auth) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    // تم إلغاء نظام "الترميم التلقائي" (setDoc) هنا لمنع تصفير بيانات الطلاب عند أخطاء الصلاحيات
    const unsubscribeProfile = onSnapshot(userDocRef, 
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);

          if (data.role === 'student' && !isKickingRef.current) {
            // 1. التحقق من الحظر
            if (data.status === 'banned') {
              isKickingRef.current = true;
              await signOut(auth);
              toast({ variant: "destructive", title: "الحساب محظور", description: "تم إيقاف صلاحية دخولك فوراً." });
              return;
            }

            // 2. التحقق من تعدد الأجهزة
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
          // إذا لم يوجد المستند فعلياً، ننهي التحميل ليقوم نظام التسجيل بالتعامل معه
          setLoading(false);
        }
      },
      (error) => {
        console.error("Profile sync error:", error);
        // في حال حدوث خطأ في الصلاحيات، ننهي التحميل لمنع تعليق الصفحة
        setLoading(false);
      }
    );

    return () => {
      unsubscribeProfile();
    };
  }, [db, user, auth, toast]);

  return { 
    user, 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student'
  };
}
