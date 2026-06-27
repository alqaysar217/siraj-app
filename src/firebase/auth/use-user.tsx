
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

          if (data.role === 'student' && !isKickingRef.current) {
            // 1. فحص الحظر
            if (data.status === 'banned') {
              isKickingRef.current = true;
              signOut(auth).then(() => {
                toast({ variant: "destructive", title: "الحساب محظور", description: "تم إيقاف صلاحية دخولك فوراً." });
              });
              return;
            }

            // 2. فحص تعدد الأجهزة مع مهلة حماية ممتدة
            const localSessionId = typeof window !== 'undefined' ? localStorage.getItem('siraj_session_id') : null;
            const sessionTimestamp = typeof window !== 'undefined' ? parseInt(localStorage.getItem('siraj_session_timestamp') || '0') : 0;
            
            // مهلة حماية 10 ثوانٍ لمنع الطرد الوهمي عند أول دخول
            const isVeryRecent = Date.now() - sessionTimestamp < 10000; 

            if (data.lastSessionId && localSessionId && data.lastSessionId !== localSessionId && !isVeryRecent) {
              isKickingRef.current = true;
              signOut(auth).then(() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('siraj_session_id');
                  localStorage.removeItem('siraj_session_timestamp');
                }
                toast({ variant: "destructive", title: "تنبيه أمني", description: "تم تسجيل الدخول من جهاز آخر." });
              });
              return;
            }
          }
        }
        setLoading(false);
      },
      (error) => {
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
