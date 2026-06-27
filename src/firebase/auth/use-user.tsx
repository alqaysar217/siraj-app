'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';

export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const isKickingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!db || !user || !auth || !mounted) {
      if (user === null) setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);

          // لا تتخذ إجراءات أمنية إذا كان المستخدم في صفحات التوثيق أصلاً
          const isAuthFlow = pathname.includes('/auth/');
          if (isAuthFlow && pathname !== '/auth/change-password') {
             setLoading(false);
             return;
          }

          if (data.role === 'student' && !isKickingRef.current) {
            // 1. فحص الحظر
            if (data.status === 'banned') {
              isKickingRef.current = true;
              signOut(auth).then(() => {
                toast({ variant: "destructive", title: "الحساب محظور", description: "تم إيقاف صلاحية دخولك فوراً." });
              });
              return;
            }

            // 2. فحص تعدد الأجهزة (الجلسات)
            const localSessionId = typeof window !== 'undefined' ? localStorage.getItem('siraj_session_id') : null;
            
            // طرد المستخدم فقط إذا كان هناك "جلسة نشطة" محلية تختلف عن السيرفر
            // هذا يمنع الطرد عند أول دخول من جهاز جديد لأن localSessionId سيكون null وقتها
            if (data.lastSessionId && localSessionId && data.lastSessionId !== localSessionId) {
              isKickingRef.current = true;
              signOut(auth).then(() => {
                if (typeof window !== 'undefined') localStorage.removeItem('siraj_session_id');
                toast({ variant: "destructive", title: "تنبيه أمني", description: "تم تسجيل الدخول من جهاز آخر، تم إنهاء هذه الجلسة." });
              });
              return;
            }

            // 3. فحص التغيير الإجباري لكلمة السر
            if (data.forcePasswordChange && pathname !== '/auth/change-password') {
              router.replace('/auth/change-password');
              return;
            }
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Profile Subscription Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [db, user, auth, toast, mounted, pathname, router]);

  return { 
    user, 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student'
  };
}
